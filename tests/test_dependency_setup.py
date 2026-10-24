"""Filesystem and download controls for the pinned browser-test dependency."""
import contextlib
import hashlib
import importlib.util
import io
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock
import urllib.error
import urllib.request

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/setup_test_dependencies.py'
spec = importlib.util.spec_from_file_location('test_dependency_setup_module', SCRIPT)
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)
PINNED_URL, PINNED_SHA, PINNED_BYTES = setup.SOURCE_URL, setup.EXPECTED_SHA256, setup.EXPECTED_BYTES


class DependencySetupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repository'
        self.root.mkdir()
        self.payload = b'/* Anonymous dependency fixture. */\n'
        self.source = Path(self.temp.name) / 'source.js'
        self.source.write_bytes(self.payload)
        self.sha_patch = mock.patch.object(setup, 'EXPECTED_SHA256', hashlib.sha256(self.payload).hexdigest())
        self.size_patch = mock.patch.object(setup, 'EXPECTED_BYTES', len(self.payload))
        self.sha_patch.start(); self.size_patch.start()
        self.addCleanup(self.sha_patch.stop); self.addCleanup(self.size_patch.stop)

    def target(self, index=0):
        return self.root / setup.DESTINATIONS[index]

    def existing(self, index, data=None):
        target = self.target(index)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(self.payload if data is None else data)
        return target

    def assert_missing(self):
        self.assertFalse(any(self.target(i).exists() for i in range(5)))

    def test_official_constants(self):
        self.assertEqual(PINNED_BYTES, 16706)
        self.assertEqual(PINNED_SHA, 'c28d1b9e6e83901da233beffb0524866165746e46c050a53467a40ae2fd13a6a')
        self.assertIn('/wikimedia/mediawiki/d0d9a283f219a1c9487754dc96598080a4a4e30a/', PINNED_URL)
        self.assertEqual(len(set(setup.DESTINATIONS)), 5)
        self.assertTrue(all(not Path(p).is_absolute() and '..' not in Path(p).parts for p in setup.DESTINATIONS))

    def test_local_source_creates_exact_copies(self):
        result = setup.prepare(self.root, self.source)
        self.assertEqual(result['created'], 5)
        self.assertTrue(result['license_notices_unchanged'])
        self.assertEqual(self.source.read_bytes(), self.payload)
        self.assertTrue(all(self.target(i).read_bytes() == self.payload for i in range(5)))

    def test_idempotent_existing_files_need_no_fetch(self):
        setup.prepare(self.root, self.source)
        fetch = mock.Mock(side_effect=AssertionError('No download is allowed'))
        result = setup.prepare(self.root, fetch=fetch)
        self.assertEqual(result['created'], 0)
        fetch.assert_not_called()

    def test_check_missing_has_no_writes_or_network(self):
        fetch = mock.Mock(side_effect=AssertionError('No download is allowed'))
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, check=True, fetch=fetch)
        fetch.assert_not_called()
        self.assertEqual(list(self.root.iterdir()), [])

    def test_check_existing_has_no_writes(self):
        setup.prepare(self.root, self.source)
        before = [(self.target(i).stat().st_ino, self.target(i).stat().st_mtime_ns) for i in range(5)]
        self.assertEqual(setup.prepare(self.root, check=True)['created'], 0)
        self.assertEqual(before, [(self.target(i).stat().st_ino, self.target(i).stat().st_mtime_ns) for i in range(5)])

    def test_partial_existing_preserves_existing_inodes(self):
        first, second = self.existing(0), self.existing(1)
        before = [(p.stat().st_ino, p.stat().st_mtime_ns) for p in (first, second)]
        self.assertEqual(setup.prepare(self.root, self.source)['created'], 3)
        self.assertEqual(before, [(p.stat().st_ino, p.stat().st_mtime_ns) for p in (first, second)])

    def test_wrong_existing_file_stops_before_any_other_write(self):
        wrong = self.existing(4, b'Existing editor data')
        fetch = mock.Mock()
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, fetch=fetch)
        fetch.assert_not_called()
        self.assertEqual(wrong.read_bytes(), b'Existing editor data')
        self.assertFalse(any(self.target(i).exists() for i in range(4)))

    def test_wrong_local_hash_is_rejected(self):
        self.source.write_bytes(b'x' * len(self.payload))
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assert_missing()

    def test_wrong_local_size_is_rejected(self):
        self.source.write_bytes(self.payload + b'extra')
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assert_missing()

    def test_wrong_download_is_rejected_before_writes(self):
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, fetch=lambda: b'x' * len(self.payload))
        self.assertEqual(list(self.root.iterdir()), [])

    def test_pinned_download_mock_installs_without_local_source(self):
        fetch = mock.Mock(return_value=self.payload)
        result = setup.prepare(self.root, fetch=fetch)
        self.assertEqual(result['source'], 'upstream')
        self.assertEqual(result['created'], 5)
        fetch.assert_called_once_with()

    def test_source_symlink_is_rejected(self):
        link = Path(self.temp.name) / 'source-link.js'
        link.symlink_to(self.source)
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, link)
        self.assert_missing()

    def test_destination_symlink_is_rejected(self):
        self.target().parent.mkdir(parents=True)
        self.target().symlink_to(self.source)
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assertTrue(self.target().is_symlink())
        self.assertEqual(self.source.read_bytes(), self.payload)

    def test_broken_destination_symlink_is_rejected(self):
        self.target().parent.mkdir(parents=True)
        self.target().symlink_to(Path(self.temp.name) / 'missing.js')
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assertTrue(self.target().is_symlink())

    def test_symlink_parent_is_rejected(self):
        outside = Path(self.temp.name) / 'outside'
        outside.mkdir()
        (self.root / 'tests').symlink_to(outside, target_is_directory=True)
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assertEqual(list(outside.iterdir()), [])

    def test_nondirectory_parent_is_rejected(self):
        (self.root / 'tests').write_bytes(b'Existing data')
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assertEqual((self.root / 'tests').read_bytes(), b'Existing data')

    def test_fifo_destination_does_not_block(self):
        self.target().parent.mkdir(parents=True)
        os.mkfifo(self.target())
        with self.assertRaises(setup.DependencyError):
            setup.prepare(self.root, self.source)
        self.assertTrue(self.target().exists())

    def test_exclusive_create_race_never_overwrites(self):
        real_open = os.open
        raced = []
        def racing_open(name, flags, *args, **kwargs):
            if flags & os.O_CREAT and not raced:
                raced.append(True)
                fd = real_open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644, **kwargs)
                os.write(fd, b'Concurrent editor data'); os.close(fd)
            return real_open(name, flags, *args, **kwargs)
        with mock.patch.object(setup.os, 'open', side_effect=racing_open):
            # The support set contains the original callable, not the patched wrapper.
            with mock.patch.object(setup.os, 'supports_dir_fd', {setup.os.open}):
                with self.assertRaises(setup.DependencyError):
                    setup.prepare(self.root, self.source)
        self.assertEqual(self.target().read_bytes(), b'Concurrent editor data')

    def test_parent_swap_cannot_write_through_new_symlink(self):
        real_open = os.open
        outside = Path(self.temp.name) / 'outside'; outside.mkdir()
        raced = []
        def racing_open(name, flags, *args, **kwargs):
            if flags & os.O_CREAT and not raced:
                raced.append(True)
                parent = self.target().parent
                parent.rename(parent.with_name('owned-directory'))
                parent.symlink_to(outside, target_is_directory=True)
            return real_open(name, flags, *args, **kwargs)
        with mock.patch.object(setup.os, 'open', side_effect=racing_open):
            with mock.patch.object(setup.os, 'supports_dir_fd', {setup.os.open}):
                with self.assertRaises(setup.DependencyError):
                    setup.prepare(self.root, self.source)
        self.assertEqual(list(outside.iterdir()), [])

    def test_unexpected_redirects_are_rejected(self):
        handler = setup.HTTPSOnly()
        for url in ('http://raw.githubusercontent.com/file', 'https://example.invalid/file'):
            with self.subTest(url=url), self.assertRaises(setup.DependencyError):
                handler.redirect_request(urllib.request.Request(PINNED_URL), None, 302, '', {}, url)
        credentials = mock.Mock(scheme='https', hostname='raw.githubusercontent.com', username='fixture', password=None)
        with mock.patch.object(setup.urllib.parse, 'urlsplit', return_value=credentials), self.assertRaises(setup.DependencyError):
            handler.redirect_request(mock.Mock(), None, 302, '', {}, PINNED_URL)

    def test_https_download_mock(self):
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = self.payload
        opener = mock.Mock(); opener.open.return_value = response
        with mock.patch.object(setup.urllib.request, 'build_opener', return_value=opener):
            self.assertEqual(setup.download(), self.payload)
        self.assertEqual(opener.open.call_args.kwargs['timeout'], 30)

    def test_http_error_does_not_invoke_fallback(self):
        opener = mock.Mock(); opener.open.side_effect = urllib.error.HTTPError(PINNED_URL, 404, '', {}, None)
        with mock.patch.object(setup.urllib.request, 'build_opener', return_value=opener), mock.patch.object(setup.subprocess, 'run') as run:
            with self.assertRaises(setup.DependencyError):
                setup.download()
            run.assert_not_called()

    def test_secure_system_client_fallback(self):
        opener = mock.Mock(); opener.open.side_effect = urllib.error.URLError('Certificate-store fixture')
        result = subprocess.CompletedProcess([], 0, stdout=self.payload, stderr=b'')
        with mock.patch.object(setup.urllib.request, 'build_opener', return_value=opener), mock.patch.object(setup.shutil, 'which', return_value='curl'), mock.patch.object(setup.subprocess, 'run', return_value=result) as run:
            self.assertEqual(setup.download(), self.payload)
        args = run.call_args.args[0]
        self.assertEqual(args[:2], ['curl', '--disable'])
        self.assertNotIn('--insecure', args)
        self.assertIn('=https', args)
        self.assertEqual(args[-1], PINNED_URL)

    def test_cli_filesystem_error_does_not_print_private_path(self):
        output = io.StringIO()
        with mock.patch.object(setup, 'prepare', side_effect=OSError('Private fixture path')), contextlib.redirect_stderr(output):
            self.assertEqual(setup.main(['--check']), 1)
        self.assertNotIn('Private fixture path', output.getvalue())


if __name__ == '__main__':
    unittest.main()

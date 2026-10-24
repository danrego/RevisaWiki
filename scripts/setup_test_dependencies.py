#!/usr/bin/env python3
"""Prepare one unchanged, pinned MediaWiki dependency for local browser tests."""
import argparse
from contextlib import contextmanager
import hashlib
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

SOURCE_URL = 'https://raw.githubusercontent.com/wikimedia/mediawiki/d0d9a283f219a1c9487754dc96598080a4a4e30a/resources/src/jquery/jquery.textSelection.js'
EXPECTED_SHA256 = 'c28d1b9e6e83901da233beffb0524866165746e46c050a53467a40ae2fd13a6a'
EXPECTED_BYTES = 16706
DESTINATIONS = (
    'tests/inline_v26/legacy_native/textSelection.js',
    'tests/inline_v26/native/textSelection.js',
    'tests/native/textSelection.js',
    'tests/native_v25/textSelection.js',
    'tests/v261/browser/textSelection.js',
)


class DependencyError(Exception):
    """Setup stopped without overwriting an existing destination."""


def verify_bytes(data):
    if len(data) != EXPECTED_BYTES or hashlib.sha256(data).hexdigest() != EXPECTED_SHA256:
        raise DependencyError('The dependency does not match its pinned size and SHA-256.')
    return data


def read_fd(fd):
    if not stat.S_ISREG(os.fstat(fd).st_mode):
        raise DependencyError('The dependency must be a regular file.')
    if os.fstat(fd).st_size != EXPECTED_BYTES:
        raise DependencyError('The dependency has an unexpected size.')
    with os.fdopen(os.dup(fd), 'rb') as stream:
        return verify_bytes(stream.read(EXPECTED_BYTES + 1))


@contextmanager
def parent_fd(root_fd, relative, create=False):
    parts = PurePosixPath(relative).parts
    if not parts or any(part in ('', '.', '..') for part in parts) or relative.startswith('/'):
        raise DependencyError('A dependency destination is invalid.')
    fd = os.dup(root_fd)
    try:
        for part in parts[:-1]:
            try:
                child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            except FileNotFoundError:
                if not create:
                    yield None
                    return
                os.mkdir(part, dir_fd=fd)
                child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            except OSError as error:
                raise DependencyError('A dependency parent is not an ordinary directory.') from error
            os.close(fd)
            fd = child
        yield fd
    finally:
        os.close(fd)


def destination_exists(root_fd, relative):
    with parent_fd(root_fd, relative) as fd:
        if fd is None:
            return False
        try:
            target = os.open(PurePosixPath(relative).name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=fd)
        except FileNotFoundError:
            return False
        except OSError as error:
            raise DependencyError('A dependency destination cannot be read safely.') from error
        try:
            read_fd(target)
        finally:
            os.close(target)
        return True


class HTTPSOnly(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        target = urllib.parse.urlsplit(new_url)
        if target.scheme != 'https' or target.hostname != 'raw.githubusercontent.com' or target.username or target.password:
            raise DependencyError('The dependency download refused an unexpected redirect.')
        return super().redirect_request(request, fp, code, message, headers, new_url)


def download():
    request = urllib.request.Request(SOURCE_URL, headers={'User-Agent': 'RevisaWiki-test-dependency-setup/1'})
    try:
        opener = urllib.request.build_opener(HTTPSOnly())
        with opener.open(request, timeout=30) as response:
            return response.read(EXPECTED_BYTES + 1)
    except DependencyError:
        raise
    except urllib.error.HTTPError as error:
        raise DependencyError('The pinned dependency could not be downloaded. Try --source.') from error
    except (urllib.error.URLError, OSError):
        # Some Python installations lack the system certificate store. The
        # optional system client still verifies HTTPS; verification is never disabled.
        client = shutil.which('curl')
        if not client:
            raise DependencyError('The download failed. Use --source with an unchanged local copy.')
        try:
            result = subprocess.run(
                [client, '--disable', '--silent', '--show-error', '--fail', '--location',
                 '--proto', '=https', '--proto-redir', '=https', '--max-time', '30',
                 '--max-filesize', str(EXPECTED_BYTES), SOURCE_URL],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, timeout=35,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            raise DependencyError('The download failed. Try --source.') from error
        if result.returncode:
            raise DependencyError('The download failed. Try --source.')
        return result.stdout


def prepare(root, local_source=None, check=False, fetch=None):
    if not hasattr(os, 'O_NOFOLLOW') or os.open not in os.supports_dir_fd:
        raise DependencyError('This setup needs directory descriptors, available on macOS and Linux.')
    root = Path(root).resolve(strict=True)
    root_fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    created = 0
    origin = 'existing'
    try:
        # Inspect every existing destination before creating directories or fetching data.
        missing = [relative for relative in DESTINATIONS if not destination_exists(root_fd, relative)]
        if check and missing:
            raise DependencyError('A browser-test dependency is missing. Run this script without --check.')
        if missing:
            if local_source is not None:
                try:
                    source_fd = os.open(local_source, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
                    try:
                        data = read_fd(source_fd)
                    finally:
                        os.close(source_fd)
                except OSError as error:
                    raise DependencyError('The local dependency could not be read safely.') from error
                origin = 'local'
            else:
                data = verify_bytes((fetch or download)())
                origin = 'upstream'
            for relative in missing:
                with parent_fd(root_fd, relative, create=True) as fd:
                    try:
                        target = os.open(PurePosixPath(relative).name,
                                         os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                                         0o644, dir_fd=fd)
                    except FileExistsError as error:
                        raise DependencyError('A destination appeared during setup; it was not overwritten.') from error
                    with os.fdopen(target, 'wb') as stream:
                        stream.write(data)
                        stream.flush()
                        os.fsync(stream.fileno())
                    created += 1
        for relative in DESTINATIONS:
            if not destination_exists(root_fd, relative):
                raise DependencyError('A dependency disappeared during setup.')
        return {'verified': len(DESTINATIONS), 'created': created, 'source': origin,
                'sha256': EXPECTED_SHA256, 'license_notices_unchanged': True}
    finally:
        os.close(root_fd)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, help='Use an unchanged local copy instead of downloading.')
    parser.add_argument('--check', action='store_true', help='Verify existing copies without network access or writes.')
    args = parser.parse_args(argv)
    try:
        result = prepare(Path(__file__).resolve().parents[1], args.source, args.check)
    except (DependencyError, OSError) as error:
        message = str(error) if isinstance(error, DependencyError) else 'A filesystem operation failed safely.'
        print('Dependency setup stopped: ' + message, file=sys.stderr)
        return 1
    print('Browser-test dependencies verified: {verified}; created: {created}; source: {source}.'.format(**result))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

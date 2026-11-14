"""Offline delivery-contract tests; integration uses only a temporary database."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest import mock

REPO = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("release_delivery", REPO / "scripts/wikimanager_delivery_v2220.py")
delivery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(delivery)


def fixture(root):
    package = root / "package"
    package.mkdir()
    old_files = root / "old"
    old_files.mkdir()
    titles = {
        "data": "Usuário:Exemplo/RevisaWiki/Dados.js",
        "catalog": "Usuário:Exemplo/RevisaWiki/Catalogo.js",
        "rules": "Usuário:Exemplo/RevisaWiki/Regras.js",
        "core": "Usuário:Exemplo/RevisaWiki.js",
        "loader": "Usuário:Exemplo/RevisaWiki/Carregador.js",
        "documentation": "Usuário:Exemplo/RevisaWiki",
    }
    payloads, files, rows = [], {}, []
    for role, name in delivery.MANUAL_FILES.items():
        raw = ("frozen release " + role + "\n").encode()
        (package / name).write_bytes(raw)
        files[name] = {"bytes": len(raw), "sha256": delivery.digest(raw)}
        payloads.append({"file": name, "destination": titles[role], "editSummary": "Atualização " + role + "."})
        if role not in {"catalog", "rules"}:
            old = old_files / name.replace("2_22_0", "2_21_7")
            old.write_text("old " + role)
            rows.append({"id": role, "project_id": "saved", "title": titles[role], "wiki": "pt",
                         "kind": "documentation" if role == "documentation" else "script",
                         "source_path": str(old), "sha256": delivery.pin(old)["sha256"], "bytes": old.stat().st_size,
                         "version": 9, "work_state": "complete", "review_state": "approved",
                         "publication_state": "reported_published", "metadata": "{}"})
    for role, (name, _) in delivery.SUPPORT_FILES.items():
        raw = ("support " + role + "\n").encode()
        (package / name).write_bytes(raw)
        files[name] = {"bytes": len(raw), "sha256": delivery.digest(raw)}
        old = old_files / name.replace("2_22_0", "2_21_7")
        old.write_text("old support " + role)
        rows.append({"id": role, "project_id": "saved", "title": "RevisaWiki 2.21.7: " + role,
                     "wiki": "pt", "kind": "reference", "source_path": str(old),
                     "sha256": delivery.pin(old)["sha256"], "bytes": old.stat().st_size,
                     "version": 9, "work_state": "draft", "review_state": "unreviewed",
                     "publication_state": "unpublished", "metadata": "{}"})
    raw = b'{"status":"passed"}\n'
    (package / "PRESAVE_ROUNDTRIP.json").write_bytes(raw)
    files["PRESAVE_ROUNDTRIP.json"] = {"bytes": len(raw), "sha256": delivery.digest(raw)}
    manifest = {"distributionRevision": delivery.VERSION, "runtimeManifestSha256": "a" * 64,
                "qaSha256": "b" * 64, "files": files, "copyPayloads": payloads}
    (package / "MANIFESTO.json").write_text(json.dumps(manifest))
    return package, rows


class InputContracts(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.package, self.rows = fixture(self.root)
        self.plan = delivery.make_plan(self.root, self.package, "saved", self.rows, [])

    def tearDown(self):
        self.temp.cleanup()

    def test_nine_targets_keep_seven_identities_and_two_new_modules(self):
        self.assertEqual(len(self.plan["targets"]), 9)
        self.assertEqual(self.plan["new_count"], 2)
        self.assertEqual(self.plan["copy_controls"], 18)
        self.assertEqual({row["id"] for row in self.plan["targets"] if row["old"]}, {row["id"] for row in self.rows})
        self.assertTrue(all(row["expected_version"] == (10 if row["old"] else 1) for row in self.plan["targets"]))
        delivery.validate_plan(self.plan)

    def test_modified_payload_and_modified_plan_are_rejected(self):
        changed = copy.deepcopy(self.plan)
        changed["targets"][0]["edit_summary"] = "unreviewed change"
        with self.assertRaises(ValueError):
            delivery.validate_plan(changed)
        (self.package / delivery.MANUAL_FILES["rules"]).write_text("changed")
        with self.assertRaises(ValueError):
            delivery.validate_plan(self.plan)

    def test_publication_gate_requires_exact_receipt_and_published_manifest(self):
        receipt = {"status": "passed", "version": delivery.VERSION, "distributionRevision": delivery.VERSION,
                   "releaseURL": delivery.RELEASE_URL,
                   "allFiveAssetsDownloadedByteEqual": True,
                   "files": {"MANIFESTO.json": {key: self.plan["manifest"][key] for key in ("bytes", "sha256")},
                             **{str(i): {} for i in range(4)}}}
        f = self.root / "github.json"
        f.write_text(json.dumps(receipt))
        delivery.release_gate(self.plan, f, delivery.pin(f)["sha256"])
        with self.assertRaises(ValueError):
            delivery.release_gate(self.plan, f, "0" * 64)
        for invalid in ["https://example.invalid/releases/tag/v" + delivery.VERSION,
                        "https://github.com/another/RevisaWiki/releases/tag/v" + delivery.VERSION,
                        delivery.RELEASE_URL + "?different=true"]:
            changed = {**receipt, "releaseURL": invalid}
            f.write_text(json.dumps(changed))
            with self.assertRaises(ValueError):
                delivery.release_gate(self.plan, f, delivery.pin(f)["sha256"])
        receipt["files"]["MANIFESTO.json"]["sha256"] = "0" * 64
        f.write_text(json.dumps(receipt))
        with self.assertRaises(ValueError):
            delivery.release_gate(self.plan, f, delivery.pin(f)["sha256"])

    def test_unknown_container_changes_and_owner_review_are_not_overwritten(self):
        github = {"releaseURL": delivery.RELEASE_URL}
        altered = copy.deepcopy(self.rows)
        altered[0]["review_state"] = "owner-changed"
        with self.assertRaises(ValueError):
            delivery.preflight(self.plan, altered, github)
        altered = self.rows + [{"id": "unrelated-new"}]
        with self.assertRaises(ValueError):
            delivery.preflight(self.plan, altered, github)

    def test_remote_application_origin_is_rejected(self):
        for value in ["https://pt.wikipedia.org", "http://example.invalid", "file:" + "/" * 3 + "tmp/app"]:
            with self.assertRaises(ValueError):
                delivery.local_origin(value)


@unittest.skipUnless(os.environ.get("WIKIMANAGER_APP_ROOT"), "Optional real backend integration; temporary database only")
class BackendIntegration(unittest.TestCase):
    def setUp(self):
        import sys
        sys.path.insert(0, os.environ["WIKIMANAGER_APP_ROOT"])
        from wikimanager.store import Store
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.package, seed = fixture(self.root)
        self.environment = mock.patch.dict(os.environ)
        self.environment.start()
        os.environ.pop("WIKIMANAGER_COMPAT_ROOT", None)
        self.store = Store(self.root)
        self.store.execute("INSERT INTO projects(id,name) VALUES(?,?)", ("saved", "Existing saved work"))
        for row in seed:
            for number in range(1, 10):
                Path(row["source_path"]).write_text("old " + row["id"] + " " + str(number))
                self.store.put_artifact("saved", row["title"], row["source_path"], wiki="pt", kind=row["kind"], id=row["id"])
            self.store.execute("UPDATE artifacts SET work_state=?,review_state=?,publication_state=? WHERE id=?",
                               (row["work_state"], row["review_state"], row["publication_state"], row["id"]))
        for number in range(17):
            f = self.root / ("reference" + str(number))
            f.write_text("unchanged")
            self.store.put_artifact("saved", "Reference " + str(number), f, kind="reference", id="reference" + str(number))
        self.before, self.history = delivery.readonly_rows(self.root, "saved")
        self.plan = delivery.make_plan(self.root, self.package, "saved", self.before, self.history)
        self.github = {"releaseURL": delivery.RELEASE_URL}

    def tearDown(self):
        self.environment.stop()
        self.temp.cleanup()

    def test_real_cas_adds_modules_preserves_other_rows_and_resumes_without_extra_versions(self):
        result = delivery.register(self.plan, self.github, self.store, "http://127.0.0.1:8780")
        self.assertEqual(len(result["artifacts"]), 26)
        current = {row["id"]: row for row in result["artifacts"]}
        targets = {row["id"] for row in self.plan["targets"]}
        for row in self.before:
            if row["id"] not in targets:
                self.assertEqual(current[row["id"]], row)
        for item in self.plan["targets"]:
            row = current[item["id"]]
            self.assertEqual(row["version"], 10 if item["old"] else 1)
            self.assertEqual((row["work_state"], row["review_state"], row["publication_state"]),
                             ("draft", "unreviewed", "unpublished"))
        again = delivery.register(self.plan, self.github, self.store, "http://127.0.0.1:8780")
        self.assertEqual(again["applied"], [])
        self.assertEqual(len(again["reused"]), 9)
        for row in self.history:
            self.assertEqual(self.store.one("SELECT * FROM artifact_versions WHERE id=?", (row["id"],)), row)
        from wikimanager.packages import delivery_order
        self.assertEqual([row["id"] for row in delivery_order(self.store, "saved")["items"]],
                         [row["id"] for row in self.plan["targets"][:6]])

    def test_interruption_after_new_module_insert_resumes_without_version_bump(self):
        original = self.store.put_artifact
        count = 0

        def interrupted(*args, **kwargs):
            nonlocal count
            count += 1
            value = original(*args, **kwargs)
            if count == 2:
                raise RuntimeError("Injected interruption after the new module insert")
            return value

        with mock.patch.object(self.store, "put_artifact", interrupted):
            with self.assertRaises(RuntimeError):
                delivery.register(self.plan, self.github, self.store, "http://127.0.0.1:8780")
        rows, history = delivery.readonly_rows(self.root, "saved")
        self.assertEqual(rows, self.before)
        self.assertEqual(history, self.history)
        result = delivery.register(self.plan, self.github, self.store, "http://127.0.0.1:8780")
        current = {row["id"]: row for row in result["artifacts"]}
        catalog = next(row for row in self.plan["targets"] if row["role"] == "catalog")
        self.assertEqual(current[catalog["id"]]["version"], 1)
        self.assertEqual(current[catalog["id"]]["publication_state"], "unpublished")

    def test_writer_lock_blocks_state_only_race_and_is_restored_after_registration(self):
        original = self.store.put_artifact
        blocked = []

        def concurrent_owner_write(*args, **kwargs):
            with sqlite3.connect(self.store.db, timeout=0) as competing:
                with self.assertRaisesRegex(sqlite3.OperationalError, "locked"):
                    competing.execute("UPDATE artifacts SET review_state='approved' WHERE id='data'")
            blocked.append(True)
            return original(*args, **kwargs)

        with mock.patch.object(self.store, "put_artifact", concurrent_owner_write):
            delivery.register(self.plan, self.github, self.store, "http://127.0.0.1:8780")
        self.assertEqual(len(blocked), 9)
        self.assertNotIn("connect", self.store.__dict__)
        # A later owner action is allowed, and is never overwritten on resume.
        self.store.execute("UPDATE artifacts SET review_state='approved' WHERE id='data'")
        with self.assertRaises(ValueError):
            delivery.register(self.plan, self.github, self.store, "http://127.0.0.1:8780")
        self.assertEqual(self.store.one("SELECT review_state FROM artifacts WHERE id='data'")["review_state"], "approved")


if __name__ == "__main__":
    unittest.main()

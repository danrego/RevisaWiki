#!/usr/bin/env python3
"""Prepare and register a frozen release in an existing local WikiManager container.

Preparation uses read-only SQLite connections. Registration is explicit, requires
the reviewed manifest and GitHub receipt hashes, and never publishes to a wiki.
The private plan contains local identities; it must not be committed or shared.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys
from datetime import datetime, timezone
import urllib.parse
import urllib.request

VERSION = "2.22.0"
TAG = "2_22_0"
RELEASE_URL = "https://github.com/danrego/RevisaWiki/releases/tag/v" + VERSION
MANUAL_FILES = {
    "data": f"RevisaWiki_v{TAG}_dados.js",
    "catalog": f"RevisaWiki_v{TAG}_catalogo.js",
    "rules": f"RevisaWiki_v{TAG}_regras.js",
    "core": f"RevisaWiki_v{TAG}.js",
    "loader": f"Carregador_comunitario_RevisaWiki_v{TAG}.js",
    "documentation": f"Documentacao_RevisaWiki_v{TAG}.wiki",
}
SUPPORT_FILES = {
    "index": ("INDICE.md", r"INDICE\.md"),
    "installation": (f"Instalacao_RevisaWiki_v{TAG}.txt", r"Instalacao_RevisaWiki_v[\d_]+\.txt"),
    "test-report": (f"Relatorio_testes_RevisaWiki_v{TAG}.txt", r"Relatorio_testes_RevisaWiki_v[\d_]+\.txt"),
}


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def load(file):
    return json.loads(Path(file).read_bytes())


def pin(file):
    file = Path(file).resolve()
    raw = file.read_bytes()
    return {"file": str(file), "bytes": len(raw), "sha256": digest(raw)}


def freeze(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    with file.open("x", encoding="utf-8") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write("\n")


def stable_id(*parts):
    return digest("\0".join(map(str, parts)).encode())[:24]


def readonly_rows(app_root, project):
    database = Path(app_root).resolve() / "data/manager.sqlite"
    with sqlite3.connect(database.as_uri() + "?mode=ro", uri=True) as connection:
        connection.row_factory = sqlite3.Row
        if not connection.execute("SELECT 1 FROM projects WHERE id=?", (project,)).fetchone():
            raise ValueError("Select an existing saved container; no Project is created.")
        rows = [dict(row) for row in connection.execute(
            "SELECT * FROM artifacts WHERE project_id=? ORDER BY id", (project,))]
        ids = [row["id"] for row in rows]
        history = [] if not ids else [dict(row) for row in connection.execute(
            "SELECT * FROM artifact_versions WHERE artifact_id IN (" + ",".join("?" for _ in ids)
            + ") ORDER BY artifact_id,id", ids)]
    return rows, history


def package_files(package, expected_manifest=""):
    package = Path(package).resolve()
    manifest_file = package / "MANIFESTO.json"
    manifest = load(manifest_file)
    if expected_manifest and pin(manifest_file)["sha256"] != expected_manifest:
        raise ValueError("The frozen release manifest changed.")
    if manifest.get("distributionRevision") != VERSION:
        raise ValueError("Only the final 2.22.0 package is accepted.")
    files = {}
    for name in [*MANUAL_FILES.values(), *(item[0] for item in SUPPORT_FILES.values()),
                 "PRESAVE_ROUNDTRIP.json"]:
        file = (package / name).resolve()
        if file.parent != package:
            raise ValueError("A delivery file escaped the frozen package.")
        descriptor = pin(file)
        if manifest["files"].get(name) != {key: descriptor[key] for key in ("bytes", "sha256")}:
            raise ValueError("A frozen copy payload changed: " + name)
        files[name] = descriptor
    return manifest, files


def make_plan(app_root, package, project, rows, history, manifest_sha=""):
    package = Path(package).resolve()
    manifest, files = package_files(package, manifest_sha)
    by_title = {row["title"]: row for row in rows}
    if len(by_title) != len(rows):
        raise ValueError("Ambiguous artifact titles in the existing container.")
    payloads = {item["file"]: item for item in manifest["copyPayloads"]}
    targets, previous = [], None
    for role, filename in MANUAL_FILES.items():
        payload = payloads[filename]
        title = payload["destination"]
        old = by_title.get(title)
        if old is None and role not in {"catalog", "rules"}:
            raise ValueError("An established manual artifact is missing: " + role)
        source = package / filename
        aid = old["id"] if old else stable_id(project, "pt", "script", title, str(source))
        targets.append({
            "role": role, "id": aid, "title": title, "wiki": old["wiki"] if old else "pt",
            "kind": old["kind"] if old else "script", "old": old,
            "expected_version": old["version"] + 1 if old else 1,
            "source": files[filename], "edit_summary": payload["editSummary"],
            "dependencies": [previous] if previous else [], "publish_order": len(targets) * 10 + 10,
        })
        previous = title
    for role, (filename, pattern) in SUPPORT_FILES.items():
        candidates = [row for row in rows if row["kind"] == "reference"
                      and re.fullmatch(pattern, Path(row["source_path"]).name)]
        if len(candidates) != 1:
            raise ValueError("An established supporting artifact is ambiguous: " + role)
        old = candidates[0]
        title = re.sub(r"^RevisaWiki \d+\.\d+\.\d+:", "RevisaWiki " + VERSION + ":", old["title"])
        if title == old["title"] and not title.startswith("RevisaWiki " + VERSION + ":"):
            raise ValueError("An unexpected supporting title was preserved; review it first.")
        targets.append({
            "role": role, "id": old["id"], "title": title, "wiki": old["wiki"], "kind": old["kind"],
            "old": old, "expected_version": old["version"] + 1, "source": files[filename],
            "edit_summary": "Atualização do material de apoio do RevisaWiki " + VERSION + ".",
            "dependencies": [], "supporting_payload": True,
        })
    if len(targets) != 9 or len({item["id"] for item in targets}) != 9:
        raise ValueError("Expected six manual payloads and three supporting artifacts.")
    for item in targets:
        item["project"] = project
    return {
        "kind": "prepared-existing-container-release-delivery", "version": VERSION,
        "project": project, "app_root": str(Path(app_root).resolve()), "package": str(package),
        "manifest": pin(package / "MANIFESTO.json"), "runtime_manifest_sha256": manifest["runtimeManifestSha256"],
        "qa_sha256": manifest["qaSha256"], "presave": files["PRESAVE_ROUNDTRIP.json"],
        "before_rows": rows, "before_history": history, "targets": targets,
        "existing_count": len(rows), "new_count": sum(item["old"] is None for item in targets),
        "copy_controls": len(targets) * 2, "publication": "manual", "wiki_writes": 0,
    }


def release_gate(plan, receipt_file, receipt_sha):
    receipt_file = Path(receipt_file)
    if not receipt_sha or pin(receipt_file)["sha256"] != receipt_sha:
        raise ValueError("Use the exact independently reviewed GitHub receipt.")
    receipt = load(receipt_file)
    if (receipt.get("status") != "passed" or receipt.get("distributionRevision") != VERSION
            or receipt.get("version") != VERSION
            or receipt.get("releaseURL") != RELEASE_URL):
        raise ValueError("GitHub publication is not validated for this release.")
    if not (receipt.get("allFiveAssetsDownloadedByteEqual") or receipt.get("allAssetsDownloadedByteEqual")):
        raise ValueError("Published assets have not been byte-verified.")
    if len(receipt.get("files", {})) < 5 or receipt["files"].get("MANIFESTO.json") != {
            key: plan["manifest"][key] for key in ("bytes", "sha256")}:
        raise ValueError("The published manifest does not match the frozen delivery.")
    return receipt


def validate_plan(plan):
    rebuilt = make_plan(plan["app_root"], plan["package"], plan["project"],
                        plan["before_rows"], plan["before_history"], plan["manifest"]["sha256"])
    if rebuilt != plan:
        raise ValueError("The saved plan does not match its frozen package and original rows.")


def target_metadata(plan, target, github):
    metadata = {
        "release_version": VERSION, "distribution_revision": VERSION,
        "edit_summary": target["edit_summary"], "dependencies": target["dependencies"],
        "release_manifest_sha256": plan["manifest"]["sha256"],
        "runtime_manifest_sha256": plan["runtime_manifest_sha256"], "qa_sha256": plan["qa_sha256"],
        "presave_roundtrip_sha256": plan["presave"]["sha256"], "github_url": github["releaseURL"],
        "wikipedia_publication": "manual", "publication": False,
    }
    if target.get("supporting_payload"):
        metadata.update(supporting_payload=True, previous_artifact_title=target["old"]["title"])
    else:
        metadata["publish_order"] = target["publish_order"]
    return metadata


def registered_exact(current, target, metadata, allow_initial=False):
    if not current:
        return False
    actual_meta = json.loads(current["metadata"])
    state = (current["work_state"], current["review_state"], current["publication_state"])
    allowed_state = state == ("draft", "unreviewed", "unpublished")
    allowed_state |= (allow_initial and target["old"] is None
                      and state == ("imported", "unreviewed", "unknown"))
    return (current["project_id"] == target["project"]
            and current["version"] == target["expected_version"]
            and current["sha256"] == target["source"]["sha256"]
            and current["wiki"] == target["wiki"] and current["kind"] == target["kind"]
            and current["title"] in {target["title"], (target["old"] or {}).get("title", target["title"])}
            and allowed_state
            and all(actual_meta.get(key) == value for key, value in metadata.items()))


def preflight(plan, rows, github):
    old = {row["id"]: row for row in plan["before_rows"]}
    current = {row["id"]: row for row in rows}
    targets = {item["id"]: item for item in plan["targets"]}
    if set(current) - (set(old) | set(targets)) or set(old) - set(current):
        raise ValueError("Container membership changed; concurrent work was preserved.")
    for aid, row in current.items():
        if aid not in targets and row != old[aid]:
            raise ValueError("An unrelated artifact changed; nothing was replaced.")
    for item in targets.values():
        row = current.get(item["id"])
        if row == item["old"]:
            continue
        if not registered_exact(row, item, target_metadata(plan, item, github), allow_initial=True):
            raise ValueError("A delivery target changed; no concurrent version was overwritten.")


def local_origin(origin):
    parsed = urllib.parse.urlsplit(origin)
    if parsed.scheme != "http" or parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("Only the local WikiManager service is supported.")
    return origin.rstrip("/")


@contextmanager
def atomic_registration(store):
    """Reuse Store's implementation under one isolated database writer lock.

    Store's existing CAS does not include owner review/publication columns. The
    writer lock spans the full-row read and every write, including its nested
    connection contexts, so state-only owner changes cannot be overwritten.
    Nested Store contexts do not commit this helper-owned transaction.
    """
    connect = store.connect
    previous = store.__dict__.get("connect")
    had_override = "connect" in store.__dict__
    with connect() as connection:
        connection.execute("BEGIN IMMEDIATE")

        @contextmanager
        def borrowed_connection(timeout=60):
            yield connection

        store.connect = borrowed_connection
        try:
            yield
        finally:
            if had_override:
                store.connect = previous
            else:
                del store.__dict__["connect"]


def register(plan, github, store, origin):
    """Register atomically; interrupted transactions roll back and safely resume."""
    with atomic_registration(store):
        return register_locked(plan, github, store, origin)


def register_locked(plan, github, store, origin):
    rows = store.query("SELECT * FROM artifacts WHERE project_id=?", (plan["project"],))
    preflight(plan, rows, github)
    applied, reused = [], []
    for item in plan["targets"]:
        current = store.one("SELECT * FROM artifacts WHERE id=?", (item["id"],))
        metadata = target_metadata(plan, item, github)
        if not registered_exact(current, item, metadata, allow_initial=True):
            if current != item["old"]:
                raise ValueError("A target changed immediately before its CAS.")
            store.put_artifact(
                plan["project"], item["title"], item["source"]["file"], wiki=item["wiki"], kind=item["kind"],
                metadata={**json.loads((item["old"] or {}).get("metadata", "{}")), **metadata}, id=item["id"],
                expected_source_sha256=item["source"]["sha256"], expected_current=item["old"],
                expected_absent=item["old"] is None,
            )
            applied.append(item["id"])
        else:
            reused.append(item["id"])
        current = store.one("SELECT * FROM artifacts WHERE id=?", (item["id"],))
        if item["old"] is None and registered_exact(current, item, metadata, allow_initial=True):
            if (current["work_state"], current["publication_state"]) == ("imported", "unknown"):
                with store.connect() as connection:
                    changed = connection.execute(
                        "UPDATE artifacts SET work_state='draft',publication_state='unpublished',updated_at=? "
                        "WHERE id=? AND project_id=? AND version=? AND sha256=? AND metadata=? "
                        "AND work_state='imported' AND review_state='unreviewed' AND publication_state='unknown'",
                        (datetime.now(timezone.utc).isoformat(), item["id"], plan["project"],
                         current["version"], current["sha256"], current["metadata"]))
                    if changed.rowcount != 1:
                        raise ValueError("The newly saved module state changed concurrently.")
                current = store.one("SELECT * FROM artifacts WHERE id=?", (item["id"],))
        if not registered_exact(current, item, metadata):
            raise ValueError("The saved release version failed its post-CAS check.")
        if current["title"] != item["title"]:
            with store.connect() as connection:
                changed = connection.execute(
                    "UPDATE artifacts SET title=? WHERE id=? AND title=? AND sha256=? AND version=? AND metadata=? "
                    "AND work_state='draft' AND review_state='unreviewed' AND publication_state='unpublished'",
                    (item["title"], item["id"], current["title"], current["sha256"], current["version"], current["metadata"]))
                if changed.rowcount != 1:
                    raise ValueError("The supporting label changed concurrently.")
    after = store.query("SELECT * FROM artifacts WHERE project_id=?", (plan["project"],))
    preflight(plan, after, github)
    by_id = {row["id"]: row for row in after}
    if len(after) != plan["existing_count"] + plan["new_count"]:
        raise ValueError("Unexpected container membership after registration.")
    for item in plan["targets"]:
        if by_id[item["id"]]["title"] != item["title"]:
            raise ValueError("A supporting display label is not current.")
    for old in plan["before_history"]:
        if store.one("SELECT * FROM artifact_versions WHERE id=?", (old["id"],)) != old:
            raise ValueError("An existing version-history row changed.")
    return {"status": "passed", "project": plan["project"], "artifacts": after,
            "applied": applied, "reused": reused, "old_history_preserved": True,
            "copyIndexURL": origin + "/#deliveries?project=" + plan["project"], "wikipediaWrites": 0}


def prepare_copy_packages(plan, origin):
    results = []
    for item in plan["targets"]:
        request = urllib.request.Request(
            origin + "/api/artifacts/" + item["id"] + "/workspace/prepare",
            data=json.dumps({"expected_sha256": item["source"]["sha256"],
                             "expected_version": item["expected_version"]}).encode(),
            headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(request, timeout=40) as response:
            selected = json.load(response)["selected_package"]
        raw = Path(item["source"]["file"]).read_bytes()
        if (selected["content"].encode() != raw or selected["content_sha256"] != item["source"]["sha256"]
                or selected["source_version"] != item["expected_version"] or selected.get("completed", False)
                or selected["edit_summary"] != item["edit_summary"]):
            raise ValueError("The prepared manual copy package differs from the frozen release.")
        results.append({"role": item["role"], "id": item["id"], "package_id": selected["id"],
                        "package_sha256": selected["package_sha256"], "version": item["expected_version"]})
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "register"])
    parser.add_argument("--app-root", type=Path, required=True)
    parser.add_argument("--package", type=Path)
    parser.add_argument("--project")
    parser.add_argument("--plan", type=Path)
    parser.add_argument("--plan-sha256", default="")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest-sha256", default="")
    parser.add_argument("--github-receipt", type=Path)
    parser.add_argument("--github-receipt-sha256", default="")
    parser.add_argument("--origin", default="http://127.0.0.1:8780")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    origin = local_origin(args.origin)
    if args.output.exists():
        raise ValueError("Use a fresh receipt path; previous evidence is immutable.")
    if args.action == "prepare":
        if args.apply or not args.package or not args.project:
            parser.error("Preparation needs an existing project and frozen package; it never applies changes.")
        rows, history = readonly_rows(args.app_root, args.project)
        plan = make_plan(args.app_root, args.package, args.project, rows, history, args.manifest_sha256)
        freeze(args.output, plan)
        print(json.dumps({"status": "prepared", "plan": pin(args.output),
                          "existing": len(rows), "targets": len(plan["targets"]), "new": plan["new_count"]}))
        return
    if (not args.apply or not args.plan or not args.plan_sha256 or not args.github_receipt
            or not args.manifest_sha256):
        parser.error("Registration needs explicit --apply and the exact approved plan, manifest and GitHub receipt.")
    if pin(args.plan)["sha256"] != args.plan_sha256:
        raise ValueError("The approved delivery plan changed.")
    plan = load(args.plan)
    if Path(plan["app_root"]) != args.app_root.resolve() or plan["manifest"]["sha256"] != args.manifest_sha256:
        raise ValueError("The approved plan does not match this application or manifest.")
    validate_plan(plan)
    github = release_gate(plan, args.github_receipt, args.github_receipt_sha256)
    # Check current state without constructing the writable Store or migrating a database.
    current, _ = readonly_rows(args.app_root, plan["project"])
    preflight(plan, current, github)
    sys.path.insert(0, str(args.app_root.resolve()))
    from wikimanager.store import Store
    from wikimanager.packages import delivery_order
    store = Store(args.app_root.resolve())
    result = register(plan, github, store, origin)
    order = delivery_order(store, plan["project"])
    manual = [item["id"] for item in plan["targets"] if not item.get("supporting_payload")]
    if [item["id"] for item in order["items"]] != manual or order["cycles"] or order["unresolved_dependencies"]:
        raise ValueError("The six manual payloads do not have their frozen dependency order.")
    result["copy_packages"] = prepare_copy_packages(plan, origin)
    result["plan"] = pin(args.plan)
    result["github_receipt"] = pin(args.github_receipt)
    freeze(args.output, result)
    print(json.dumps({"status": "passed", "targets": len(plan["targets"]),
                      "copyIndexURL": result["copyIndexURL"], "wikipediaWrites": 0}))


if __name__ == "__main__":
    main()

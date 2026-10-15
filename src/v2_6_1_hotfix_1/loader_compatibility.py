"""Lower the known optional-chain sites in the two installation loaders."""
from pathlib import Path
import argparse
import hashlib
import json
import re


HELPERS = """    // A sintaxe do common.js também precisa passar pelo ResourceLoader.
    function optionalValue(object, key) {
        return object === null || object === undefined ? undefined : object[key];
    }
    function optionalCall(object, key, args) {
        const callback = optionalValue(object, key);
        return callback === null || callback === undefined ? undefined : callback.apply(object, args);
    }
"""
FILES = ["Carregador_common_js_RevisaWiki_v2_6_1.js", "Carregador_comunitario_RevisaWiki_v2_6_1.js"]


def apply(source):
    def call(match):
        return "optionalCall(" + match[1] + ", '" + match[2] + "', [" + match[3] + "])"

    def prop(match):
        return "optionalValue(" + match[1] + ", '" + match[2] + "')"

    candidate, calls = re.subn(r"\b(window|mw)\.(RevisaWikiInlineLoadFailed|notify)\?\.\(([^;\n]*)\)", call, source)
    candidate, properties = re.subn(r"\b(root\.RevisaWiki|root\.RevisaWikiLoadInfo|root\.RevisaWikiConfig|content)\?\.(inlineEditing|uiStatus|state|jquery|nodeType)", prop, candidate)
    assert calls == 6 and properties == 8 and source.count("?.") == 14
    assert "?." not in candidate and "??" not in candidate
    marker = "    const expectedVersion = '2.6.1';\n"
    assert candidate.count(marker) == 1
    candidate = candidate.replace(marker, marker + "    const loaderRevision = '2.6.1-hotfix.1';\n" + HELPERS, 1)
    cache_marker = "&action=raw&ctype=text/javascript&v=' + expectedVersion"
    assert candidate.count(cache_marker) == 1
    return candidate.replace(cache_marker, "&action=raw&ctype=text/javascript&v=' + loaderRevision", 1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--destination", type=Path, required=True)
    args = parser.parse_args()
    args.destination.mkdir(parents=True, exist_ok=True)
    report = []
    for name in FILES:
        original = (args.source / name).read_text()
        candidate = apply(original)
        (args.destination / name).write_text(candidate)
        report.append({"file": name, "version": "2.6.1", "loaderRevision": "2.6.1-hotfix.1", "sourceSha256": hashlib.sha256(original.encode()).hexdigest(),
                       "candidateSha256": hashlib.sha256(candidate.encode()).hexdigest(),
                       "optionalCallsLowered": 6, "optionalPropertiesLowered": 8})
    (args.destination / "loader_compatibility_build.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report))

"""Repeat the current read-only native check without replacing saved receipts."""
import json
from pathlib import Path

from check_wiki_presave import GateError, check_presave, validate_receipt

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'tests/expected_release_v2211_installation1.json'
DATA = ROOT / 'dist/2.21.1-installation.1/RevisaWiki_v2_21_1_dados.js'


def main():
    try:
        receipt = check_presave(MANIFEST, DATA)
        validate_receipt(receipt, MANIFEST, DATA)
    except (GateError, OSError) as error:
        reason = str(error) if isinstance(error, GateError) else 'missing-input-file'
        print(json.dumps({'status': 'failed', 'reason': reason, 'wikipediaWrites': 0}))
        return 1
    print(json.dumps(receipt, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

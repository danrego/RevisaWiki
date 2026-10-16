"""Capture two anonymous native-parser projections. Never saves a page."""
from pathlib import Path
import hashlib
import importlib.util
import json
import time

BASE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('native_projection', BASE / 'nsrw_capture_native.py')
native = importlib.util.module_from_spec(spec)
spec.loader.exec_module(native)
source = '{{Info/Droga|nome_IUPAC=Nome literal|prefixo_ATC=R06|sufixo_ATC=AX29|ATC_supplemental=S01GX13|pregnancy_category=B3 (Austrália)|legal_status=Texto legal literal.}}'
expected = source.replace('ATC_supplemental', 'suplemento_ATC')
before = native.capture(source)
time.sleep(5)
after = native.capture(expected)
report = {'schema': 1, 'version': '2.14.0', 'source': source, 'expected': expected,
          'sourceSha256': hashlib.sha256(source.encode()).hexdigest(),
          'expectedSha256': hashlib.sha256(expected.encode()).hexdigest(),
          'captureMethod': 'two anonymous parse GET projections; all original values retained',
          'nativeSource': {'title': 'Predefinição:Info/Droga', 'oldid': 69873897},
          'networkRequests': 2, 'wikipediaWrites': 0, 'before': before, 'after': after}
BASE.joinpath('drug_native_capture.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'captured': True, 'anonymousGETs': 2, 'wikipediaWrites': 0}))

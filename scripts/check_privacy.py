"""Run the scanner's controls, then inspect this Git checkout's tracked files."""
from pathlib import Path
import subprocess,sys

root=Path(__file__).resolve().parents[1]
top=subprocess.run(['git','rev-parse','--show-toplevel'],cwd=root,text=True,capture_output=True)
if top.returncode or Path(top.stdout.strip()).resolve()!=root:
    raise SystemExit('Execute este comando em um clone do repositório. Para outra pasta, use o verificador com --allowlist.')
for command in [
    [sys.executable,'tests/privacy/test_publication_privacy_gate.py'],
    [sys.executable,'scripts/publication_privacy_gate.py'],
]:
    result=subprocess.run(command,cwd=root)
    if result.returncode:raise SystemExit(result.returncode)

from pathlib import Path
import subprocess,sys,json,os,shutil
W=Path(__file__).resolve().parent;R=W.parents[1];node=os.environ.get('REVISAWIKI_NODE') or shutil.which('node');browser=sys.argv[1]
if not node:raise SystemExit('Set REVISAWIKI_NODE to the installed Node executable.')
for mode in (sys.argv[2:] or ['structural-v23','publish-ui','publish-keys','ui','install-loaders','v25-new-pages','v25-talk-preparation']):
 if os.environ.get('REVISAWIKI_NATIVE_STOP_FILE') and Path(os.environ['REVISAWIKI_NATIVE_STOP_FILE']).exists():
  print(json.dumps({'browser':browser,'withdrawnAtModeBoundary':True,'nextModeNotRun':mode}),flush=True);break
 with (W/(browser.lower()+'_'+mode+'.log')).open('w') as out:
  p=subprocess.run([node,str(W/'run_native.cjs'),browser,os.environ.get('REVISAWIKI_NATIVE_SCRIPT') or str(R/'dist/2.5.0/RevisaWiki_v2_5.js'),mode],stdout=out,stderr=subprocess.STDOUT)
 d=json.loads((W/(browser.lower()+'_'+mode+'_results.json')).read_text());print(json.dumps({k:d.get(k) for k in ['browser','mode','passed','failed','scriptSha256']}),flush=True)
 if p.returncode:sys.exit(p.returncode)

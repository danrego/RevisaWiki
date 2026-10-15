"""Run inherited and robustness suites against one explicit, hashed script."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import subprocess, json, os, hashlib, argparse, time, shutil

qa = Path(__file__).resolve().parent
root = qa.parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--version',default='2.3.0')
parser.add_argument('--file-version',default='v2_3')
parser.add_argument('--script')
parser.add_argument('--outdir')
parser.add_argument('--workers',type=int,default=3)
parser.add_argument('--suites',nargs='*')
args = parser.parse_args()
outdir = Path(args.outdir or root/'dist'/'2.3.0').resolve()
script = Path(args.script or outdir/('RevisaWiki_'+args.file_version+'_completo.js')).resolve()
node = os.environ.get('REVISAWIKI_NODE') or shutil.which('node') or 'node'
if not script.is_file(): raise SystemExit('QA target does not exist: '+str(script))
sha256 = hashlib.sha256(script.read_bytes()).hexdigest()
env = os.environ.copy()
env.update(REVISAWIKI_EXPECTED_VERSION=args.version,REVISAWIKI_FILE_VERSION=args.file_version,
           REVISAWIKI_SCRIPT=str(script),REVISAWIKI_OUTDIR=str(outdir))
run_dir=qa/'artifacts'
run_dir.mkdir(parents=True,exist_ok=True)
shutil.copy2(qa/'harness.cjs',run_dir/'harness.cjs')
names = [r['suite'] for r in json.loads((qa/'inherited_suites.json').read_text())]
if args.suites: names = args.suites
reports = {
    'full_article_test':'full_article_test_results.json', 'v14_tests':'v14_results.json',
    'v15_core_tests':'v15_core_results.json','loader_tests':'loader_test_results.json',
    'reference_audit_tests':'reference_audit_results.json',
    'obsolete_audit_tests':'obsolete_audit_results.json',
    'catalog_audit_tests':'catalog_audit_results.json',
    'new_rules_tests':'new_rules_results.json',
    'compatibility_patch_tests':'compatibility_patch_results.json',
    'occupation_compatibility_tests':'occupation_compatibility_results.json',
    'namespace_compatibility_tests':'namespace_compatibility_results.json',
}
def run(name):
    started = time.monotonic()
    suite_path=qa/(name+'.cjs')
    suite_sha256=hashlib.sha256(suite_path.read_bytes()).hexdigest()
    executable=run_dir/(name+'.cjs')
    shutil.copy2(suite_path,executable)
    report_path = run_dir/reports.get(name,name.replace('_tests','_results')+'.json')
    if report_path.exists(): report_path.unlink()
    try:
        result = subprocess.run([node,str(executable)],cwd=root,capture_output=True,
                                text=True,env=env,timeout=240)
        output=result.stdout+result.stderr
        code=result.returncode
    except subprocess.TimeoutExpired as e:
        output='Suite exceeded 240 seconds. '+str(e)
        code=124
    if hashlib.sha256(suite_path.read_bytes()).hexdigest()!=suite_sha256:
        output += '\nERROR: Suite source changed during execution.'
        code=126
    (run_dir/(name+'.log')).write_text(output)
    passed,failed=0,0
    if report_path.exists():
        report=json.loads(report_path.read_text())
        if 'tests' in report:
            passed=sum(1 for t in report['tests'] if t.get('passed',t.get('ok',False)))
            failed=sum(1 for t in report['tests'] if not t.get('passed',t.get('ok',False)))
        elif 'passed' in report:
            passed=report['passed']
            failed=report.get('failed',len(report.get('failures',[])))
        elif 'count' in report:
            failed=len(report.get('failures',[]))
            passed=report['count']-failed
        elif name=='full_article_test':
            passed=1 if code==0 else 0
            failed=int(code!=0)
        report['qaTarget']={'version':args.version,'script':str(script),'sha256':sha256,'suiteSha256':suite_sha256}
        report_path.write_text(json.dumps(report,indent=2)+'\n')
    elif code==0:
        output += '\nERROR: Suite succeeded without writing its expected result file.'
        code=125
        (run_dir/(name+'.log')).write_text(output)
    return {'suite':name,'exit':code,'passed':passed,'failed':failed,
            'seconds':round(time.monotonic()-started,3),'report':report_path.name,
            'scriptSha256':sha256,'suiteSha256':suite_sha256,'details':output[-8000:] if code else ''}

syntax = subprocess.run([node,'--check',str(script)],cwd=root,capture_output=True,text=True)
if syntax.returncode: raise SystemExit(syntax.stdout+syntax.stderr)
results=[]
with ThreadPoolExecutor(max_workers=args.workers) as pool:
    for done in as_completed([pool.submit(run,n) for n in names]):
        row=done.result();results.append(row);print(json.dumps(row),flush=True)
report={'version':args.version,'script':str(script),'scriptSha256':sha256,
        'syntaxChecked':True,'suites':len(results),'passed':sum(r['passed'] for r in results),
        'failed':sum(r['failed'] for r in results),
        'suiteFailures':sum(r['exit']!=0 for r in results),'results':sorted(results,key=lambda r:r['suite'])}
report['coverageNote']='The case count includes systematic accepted-infobox-parameter and protected-spelling-context combinations. It is not a count of different articles or browser workflows.'
report['catalogSnapshots']=[{'file':p.name,'version':j.get('version'),'snapshotVersion':j.get('snapshotVersion'),
                            'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
                           for p in sorted(outdir.glob('Catalogo_*_'+args.file_version+'.json'))
                           for j in [json.loads(p.read_text())]]
report['catalogMetadataNote']='Catalog metadata can retain the version of an earlier rule snapshot. That metadata is separate from the executable version required by this harness and from the current package filenames. Documentation must identify the executable as '+args.version+'.'
if hashlib.sha256(script.read_bytes()).hexdigest()!=sha256:
    raise SystemExit('QA target changed while suites were running. Rerun against final bytes.')
(run_dir/'regression_summary.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'}),flush=True)
raise SystemExit(int(report['suiteFailures']>0 or report['failed']>0))

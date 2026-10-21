"""Read completed, immutable endpoints without changing the independent model."""
import argparse
import concurrent.futures
import hashlib
import importlib.util
import json
import pathlib
import shutil
import sys
import time

MODEL_CACHE = None

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def inspect_job(job):
    global MODEL_CACHE
    model_file, model_hash, row, source_root, outputs = job
    if MODEL_CACHE is None:
        raw = model_file.read_bytes()
        if digest(raw) != model_hash:
            raise ValueError('Independent model snapshot changed')
        spec = importlib.util.spec_from_file_location('rw_independent_model_snapshot', model_file)
        model = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = model
        spec.loader.exec_module(model)
        if model.mw.__version__ != model.PARSER_VERSION:
            raise ValueError('The independently pinned parser is required')
        MODEL_CACHE = model
    return MODEL_CACHE.inspect((row, source_root, outputs))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=pathlib.Path, required=True)
    parser.add_argument('--outputs', type=pathlib.Path, action='append', required=True)
    parser.add_argument('--model-file', type=pathlib.Path, required=True)
    parser.add_argument('--report', type=pathlib.Path, required=True)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    if args.report.exists():
        raise ValueError('Preserve old receipts and choose a fresh directory')
    args.report.mkdir(parents=True)
    model_raw = args.model_file.read_bytes()
    model_file = args.report.resolve() / 'MODEL_SOURCE.py'
    model_file.write_bytes(model_raw)
    manifest_raw = args.manifest.read_bytes()
    manifest = json.loads(manifest_raw)
    if not manifest.get('complete') or not manifest.get('historyComplete'):
        raise ValueError('The complete source manifest is required')
    index = {(row['pageid'], row['revid']): row for row in manifest['pages'] if row.get('file') and not row.get('missing') and row.get('namespace') == 0}
    runs, selected = [], set()
    for output in args.outputs:
        output = output.resolve()
        raw = (output / 'RUN_PRIVATE.json').read_bytes()
        run = json.loads(raw)
        choices = {(item[0], item[1]) for item in run['selected']}
        if selected & choices:
            raise ValueError('The supplied runs repeat a source capture')
        if not choices <= index.keys():
            raise ValueError('Unknown source selection')
        selected |= choices
        for role, expected in run['settings']['hashes'].items():
            file = pathlib.Path(run['settings'][role])
            if digest(file.read_bytes()) != expected:
                raise ValueError('Actual runtime snapshot changed')
        runs.append({'output': output, 'receiptSha256': digest(raw), 'selection': choices, 'offset': 0, 'hashes': run['settings']['hashes']})
    if len({tuple(sorted(run['hashes'].items())) for run in runs}) != 1:
        raise ValueError('All streamed runs must use exactly the same runtime')
    started = time.time()
    names = ['reference_bindings','reference_lists','citation_associations','table_cells','protected_literals','media','category_sort']
    report = {'kind': 'streamed-independent-actual-endpoint-oracle', 'status': 'running', 'modelSha256': digest(model_raw),
              'runnerSha256': digest(pathlib.Path(__file__).read_bytes()), 'sourceManifestSha256': digest(manifest_raw),
              'runtimeSha256': runs[0]['hashes'], 'runReceiptSha256': [run['receiptSha256'] for run in runs],
              'plannedDistinctPages': len(selected), 'observedReceipts': 0, 'completedDistinctPages': 0,
              'changedDistinctPages': 0, 'acceptedCandidatePages': 0, 'safelyRefusedCandidatePages': 0,
              'missingActualOutputPages': 0, 'failedCandidatePages': 0, 'failedAcceptedCandidatePages': 0,
              'checks': {name: dict.fromkeys(['passed','failed','ambiguous','not_applicable'],0) for name in names},
              'executionErrors': [], 'findings': [], 'wikipediaWrites': 0, 'networkRequests': 0,
              'previousResultsReclassified': False, 'knownExtremeRepeated': False}
    pages = args.report / 'pages'
    pages.mkdir()
    seen, pending = set(), {}
    def save(final=False):
        report['elapsedSeconds'] = round(time.time()-started,3)
        (args.report / ('SUMMARY.json' if final else 'PROGRESS.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    def read_rows(run):
        file = run['output'] / 'rows.jsonl'
        if not file.exists():
            return []
        with file.open('rb') as stream:
            stream.seek(run['offset'])
            raw = stream.read()
        complete = raw.rfind(b'\n') + 1
        run['offset'] += complete
        return [json.loads(line) for line in raw[:complete].splitlines()]
    queue = []
    save()
    with concurrent.futures.ProcessPoolExecutor(max_workers=max(1,min(6,args.workers))) as pool:
        while True:
            for run in runs:
                for record in read_rows(run):
                    identity = (record['pageid'],record['revid'])
                    if identity not in run['selection'] or identity in seen:
                        raise ValueError('A completed receipt is unknown or duplicated')
                    seen.add(identity)
                    row = index[identity]
                    receipt = json.loads((run['output'] / 'pages' / (str(identity[0])+'_'+str(identity[1])+'.json')).read_bytes())
                    if receipt.get('sourceSha256') != row['sha256'] or receipt.get('sourceVerified') is not True:
                        raise ValueError('Completed receipt does not bind the source')
                    report['observedReceipts'] += 1
                    if not receipt.get('output'):
                        report['missingActualOutputPages'] += 1
                        (pages / (str(identity[0])+'_'+str(identity[1])+'.json')).write_text(json.dumps({'status':'not-executed-no-actual-output','sourceSha256':row['sha256'],'pageReceiptStatus':receipt['status']}))
                        continue
                    queue.append((run,row,receipt))
            while queue and len(pending) < max(1,args.workers)*3:
                run,row,receipt = queue.pop(0)
                future = pool.submit(inspect_job,(model_file,report['modelSha256'],row,args.manifest.parent.resolve(),run['output']))
                pending[future] = (row,receipt)
            done = [future for future in pending if future.done()]
            for future in done:
                row,receipt = pending.pop(future)
                try:
                    result = future.result()
                    result['candidateReceiptStatus'] = receipt['status']
                    result['productionAutomaticGate'] = receipt.get('core',{}).get('automaticResultSafety')
                    failed = any(check['status']=='failed' for check in result['checks'].values())
                    gate = result['productionAutomaticGate']
                    report['failedCandidatePages'] += int(failed)
                    report['failedAcceptedCandidatePages'] += int(failed and bool(gate and gate.get('accepted')))
                    report['acceptedCandidatePages'] += int(bool(gate and gate.get('accepted')))
                    report['safelyRefusedCandidatePages'] += int(bool(gate and gate.get('accepted') is False))
                    report['completedDistinctPages'] += 1
                    report['changedDistinctPages'] += int(result['changed'])
                    for key,check in result['checks'].items():
                        report['checks'][key][check['status']] += 1
                    if failed or any(check['status']=='ambiguous' for check in result['checks'].values()):
                        report['findings'].append({'capture':result['capture'],'candidateReceiptStatus':receipt['status'],'automaticGateAccepted':gate.get('accepted') if gate else None,'checks':{key:check['status'] for key,check in result['checks'].items()}})
                    (pages / (result['capture']+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
                except Exception as error:
                    report['executionErrors'].append({'pageid':row['pageid'],'revid':row['revid'],'type':type(error).__name__,'message':str(error)})
            closed = all((run['output']/'RESULT.json').exists() for run in runs)
            if done or closed:
                save()
            if closed and not pending and not queue:
                break
            if not done:
                time.sleep(0.25)
    if seen != selected:
        raise ValueError('The source selection was not completely observed')
    for run in runs:
        if digest((run['output']/'RUN_PRIVATE.json').read_bytes()) != run['receiptSha256']:
            raise ValueError('Actual run binding changed')
        for role,expected in run['hashes'].items():
            if digest(pathlib.Path(json.loads((run['output']/'RUN_PRIVATE.json').read_bytes())['settings'][role]).read_bytes()) != expected:
                raise ValueError('Actual runtime changed')
    if digest(pathlib.Path(__file__).read_bytes()) != report['runnerSha256'] or digest(model_file.read_bytes()) != report['modelSha256'] or digest(args.manifest.read_bytes()) != report['sourceManifestSha256']:
        raise ValueError('An independent test input changed during execution')
    report['status'] = 'failed' if report['failedCandidatePages'] or report['executionErrors'] else 'completed_with_ambiguities' if any(row['ambiguous'] for row in report['checks'].values()) or report['missingActualOutputPages'] else 'passed'
    report['limitations'] = ['Every failed or ambiguous raw candidate remains explicitly counted. A rejected candidate is not a successful repair.', 'Independent AST agreement supplements source-bound native proofs. Unsupported template expansion is never silently declared equivalent.', 'Missing actual endpoints are not replaced by invented unchanged output. Browser refusal and timeout draft preservation require separate native checks.']
    save(True)
    print(json.dumps({key:report[key] for key in ['status','plannedDistinctPages','completedDistinctPages','failedCandidatePages','failedAcceptedCandidatePages','missingActualOutputPages','elapsedSeconds']}))

if __name__ == '__main__':
    main()

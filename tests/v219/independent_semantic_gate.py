#!/usr/bin/env python3
"""Fail closed on a hash-bound independent summary, regardless of process exit.

This is an execution dependency gate, never a native semantic acceptance claim.
Ambiguities block by default. An explicit caller policy can preserve them for
later adjudication while allowing another diagnostic phase to execute.
"""
import argparse,hashlib,json
from pathlib import Path

CHECKS={'reference_bindings','reference_lists','citation_associations','table_cells','protected_literals','media','category_sort'}

def digest(data):return hashlib.sha256(data).hexdigest()

def evaluate(summary_file,reader_file,manifest_file,actual_file,expected_pages,allow_ambiguities=False):
    pins=[]
    def read(path):
        path=Path(path).resolve();data=path.read_bytes();pins.append({'file':str(path),'bytes':len(data),'sha256':digest(data)});return data
    def require(ok,message):
        if not ok:raise ValueError(message)
    summary=json.loads(read(summary_file));reader=read(reader_file);manifest=read(manifest_file);actual=json.loads(read(actual_file))
    require(summary.get('kind')=='independent-python-ast-oracle','Not an independent AST summary')
    require(summary.get('runnerSha256')==digest(reader),'Summary belongs to a different independent reader')
    require(summary.get('sourceManifestSha256')==digest(manifest),'Summary belongs to a different source manifest')
    require(summary.get('actualOutputRunReceiptSha256')==pins[-1]['sha256'],'Summary belongs to a different actual-output run')
    hashes=actual.get('settings',{}).get('hashes',{});require(bool(hashes) and summary.get('runtimeSha256')==hashes,'Summary runtime binding differs from the actual run')
    for role in ['core','complete']:
        require(digest(read(actual['settings'][role]))==hashes.get(role),'An actual runtime changed after the output run')
    if hashes.get('coreData'):
        core=Path(actual['settings']['core']);data=core.with_name(core.stem+'_dados.js');require(digest(read(data))==hashes['coreData'],'Actual core data changed after the output run')
    completed=summary.get('completedDistinctPages');planned=summary.get('plannedDistinctPages')
    require(isinstance(expected_pages,int) and expected_pages>0 and completed==planned==expected_pages,'Independent selection is incomplete or has the wrong page count')
    require(len(summary.get('plannedCaptures',[]))==expected_pages,'Independent planned capture descriptors are incomplete')
    require(not summary.get('executionErrors'),'Independent reader reported execution errors')
    checks=summary.get('checks');require(isinstance(checks,dict) and set(checks)==CHECKS,'Independent invariant summary is incomplete')
    failed=ambiguous=0
    for key,counts in checks.items():
        require(isinstance(counts,dict) and set(counts)=={'passed','failed','ambiguous','not_applicable'},'Invariant counters are incomplete: '+key)
        require(all(isinstance(x,int) and not isinstance(x,bool) and x>=0 for x in counts.values()),'Invalid invariant counters: '+key)
        require(sum(counts.values())==completed,'Invariant counters do not cover every completed page: '+key)
        failed+=counts['failed'];ambiguous+=counts['ambiguous']
    require(not failed,'Independent semantic failures block dependent phases even when the reader process exited zero')
    require(not any('failed' in row.get('checks',{}).values() for row in summary.get('findings',[])),'A failed per-capture semantic finding contradicts the aggregate summary')
    status=summary.get('status');require(status in {'passed','completed_with_ambiguities'},'Independent semantic status blocks dependent phases: '+str(status))
    require((status=='completed_with_ambiguities')==bool(ambiguous),'Independent status contradicts its ambiguity counters')
    for pin in pins:require(digest(Path(pin['file']).read_bytes())==pin['sha256'],'A gate input changed while it was inspected')
    blocked=bool(ambiguous) and not allow_ambiguities
    report={'kind':'hash-bound-independent-semantic-dependency-gate','status':'blocked-unadjudicated-ambiguities' if blocked else 'completed-with-recorded-ambiguities' if ambiguous else 'passed-execution-dependency-gate','dependencyExecutionAllowed':not blocked,'nativeSemanticAcceptanceClaim':False,'requiresAmbiguityAdjudication':bool(ambiguous),'explicitAllowAmbiguousExecution':bool(allow_ambiguities),'semanticSummaryStatus':status,'failedInvariantPages':failed,'ambiguousInvariantPages':ambiguous,'completedDistinctPages':completed,'inputPins':pins,'networkRequests':0,'wikipediaWrites':0}
    return report,2 if blocked else 0

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for key in ['summary','reader','manifest','actual-receipt','report']:parser.add_argument('--'+key,required=True,type=Path)
    parser.add_argument('--expected-pages',required=True,type=int)
    parser.add_argument('--allow-ambiguous-execution',action='store_true',help='Explicit diagnostic execution policy only; retains requiresAmbiguityAdjudication=true and never asserts native acceptance')
    args=parser.parse_args();inputs={p.resolve() for p in [args.summary,args.reader,args.manifest,args.actual_receipt]}
    if args.report.resolve() in inputs:raise ValueError('The gate report cannot overwrite an input')
    try:report,code=evaluate(args.summary,args.reader,args.manifest,args.actual_receipt,args.expected_pages,args.allow_ambiguous_execution)
    except Exception as error:report={'kind':'hash-bound-independent-semantic-dependency-gate','status':'blocked','dependencyExecutionAllowed':False,'nativeSemanticAcceptanceClaim':False,'reason':str(error),'inputPins':[{'file':str(path),'bytes':path.stat().st_size,'sha256':digest(path.read_bytes())} for path in sorted(inputs) if path.is_file()],'networkRequests':0,'wikipediaWrites':0};code=1
    report.update(gateRunnerSha256=digest(Path(__file__).read_bytes()),requestedExpectedPages=args.expected_pages,requestedAllowAmbiguousExecution=args.allow_ambiguous_execution)
    args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({key:report[key] for key in ['status','dependencyExecutionAllowed','nativeSemanticAcceptanceClaim']}));return code

if __name__=='__main__':raise SystemExit(main())

"""Assemble 2.21 from immutable 2.20 files and source-bound repair modules."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'dist/2.20.0'
HELPERS=['composition_prerequisites.js','citation_repairs.js','structure_repairs.js','biography_infoboxes.js','integration.js','ui_preflights.js']
EXPORTS=['v221RepairPlan','v221RepairProof','v221IntegrationPrerequisitePlan','v221IntegrationPrerequisiteProof',
 'v221ConfirmedExternalPlan','v221ConfirmedExternalProof',
 'v221MissingDefaultCollectorPlan','v221MissingDefaultCollectorProof',
 'v221CitationEditionAliasPlan','v221CitationEditionAliasProof','v221CitationHeaderPlan','v221CitationHeaderProof',
 'v221CitationPlan','v221CitationPlanProof','v221CitationResearchInventory','v221CitationMigrationSafe','v221ReferenceNameEdits',
 'v221CitationTitleRequests','v221CitationTitleMetadataProof','v221CitationTitleProof',
 'v221StructurePlan','v221StructureProof','v221StructureExternalRequests','v221LinkEmphasisBoundarySafe',
 'v221InlineInfoboxEdits','v221InlineInfoboxPlan','v221InlineInfoboxProof',
 'v221BiographyPlan','v221BiographyProof','v221InfoboxEntityRequests','v221InfoboxKnownField','v221BioCompleteClaimsMap']
# Remove only line gaps after explicit statement/list/block delimiters. The
# parsed program, every lexical token and every source comment must stay equal.
# Keeping the historical formatter untouched also preserves its old test inputs.
STRUCTURAL_GAP_FORMATTER = r"""
'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),parser=require('@babel/parser');
const {normalized}=require(process.argv[4]),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=fs.readFileSync(process.argv[2],'utf8'),options={sourceType:'unambiguous',createParenthesizedExpressions:true,tokens:true},before=parser.parse(source,options);
const declarationEnds=new Set(),blockParents=new Set(['Program','BlockStatement','IfStatement','ForStatement','ForInStatement','ForOfStatement','WhileStatement','DoWhileStatement','WithStatement','TryStatement','CatchClause','LabeledStatement','SwitchCase']);
function declarations(node,parent=null){
 if(!node||typeof node!=='object')return;
 if(['FunctionDeclaration','ClassDeclaration','SwitchStatement'].includes(node.type)||node.type==='BlockStatement'&&blockParents.has(parent))declarationEnds.add(node.end);
 for(const [key,value]of Object.entries(node)){
  if(['loc','extra','start','end','tokens','comments'].includes(key))continue;
  if(Array.isArray(value))value.forEach(child=>declarations(child,node.type));else declarations(value,node.type);
 }
}
declarations(before.program);
let at=0,previous=null,result='',gaps=0;
for(const token of before.tokens){
 const gap=source.slice(at,token.start);assert(/^[\s\uFEFF]*$/.test(gap));
 const declarationBoundary=previous?.type?.label==='}'&&declarationEnds.has(previous.end)&&!['CommentLine','CommentBlock'].includes(token.type);
 if(/[\r\n\u2028\u2029]/.test(gap)&&([';','{',','].includes(previous?.type?.label)||declarationBoundary)){
  assert(previous.type!=='CommentLine');gaps++;
 }else result+=gap;
 result+=source.slice(token.start,token.end);at=token.end;previous=token;
}
assert(/^[\s\uFEFF]*$/.test(source.slice(at)));result+=source.slice(at);
const after=parser.parse(result,options),tokens=(ast,text)=>ast.tokens.map(t=>text.slice(t.start,t.end)),comments=ast=>(ast.comments||[]).map(c=>[c.type,c.value]);
const beforeProgram=JSON.stringify(normalized(before.program)),afterProgram=JSON.stringify(normalized(after.program));
assert.equal(beforeProgram,afterProgram,'Structural line gaps changed the parsed program');
assert.deepEqual(tokens(before,source),tokens(after,result),'Structural line gaps changed source tokens');
assert.deepEqual(comments(before),comments(after),'Structural line gaps changed source comments');
fs.writeFileSync(process.argv[3],result);
process.stdout.write(JSON.stringify({method:'Remove whitespace line gaps only after semicolon, opening brace, comma or AST-confirmed complete declarations and statement blocks; identical normalized program, lexical token bytes and all source comments',sourceBytes:Buffer.byteLength(source),outputBytes:Buffer.byteLength(result),sourceSha256:hash(source),outputSha256:hash(result),normalizedProgramSha256:hash(beforeProgram),literalTokensSha256:hash(JSON.stringify(tokens(before,source))),commentCount:comments(before).length,removedLineGaps:gaps,parserVersion:require('@babel/parser/package.json').version}));
"""

# Exercise the literal serialized Worker bootstrap, not just CommonJS loading.
# The frozen six-case source fixture is independently pinned in this smoke test.
SERIALIZED_WORKER_SMOKE = r"""
'use strict';
// Exercise the exact bootstrap text used by the browser Worker in a new realm.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),parser=require('@babel/parser');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),args=process.argv.slice(2),runtime=path.resolve(args.find(x=>x.startsWith('--runtime='))?.slice(10)||path.join(__dirname,'../../dist/2.21.0'));
const fixtureFile=path.resolve(args.find(x=>x.startsWith('--fixture='))?.slice(10)||path.join(__dirname,'../v219/native_nested_citation_source_fixtures.json')),fixtureBytes=fs.readFileSync(fixtureFile),fixtureSha256=sha(fixtureBytes);assert.equal(fixtureSha256,'3467f64d67bf945a9042bd2d58dd804095a922572f8661db49bd00a9260d93e5');
const fixtures=JSON.parse(fixtureBytes).cases,dataFile=path.join(runtime,'RevisaWiki_v2_21_0_dados.js'),dataBytes=fs.readFileSync(dataFile),report={kind:'actual-serialized-worker-condition-snapshot-regression',status:'passed',fixtureSha256,dataSha256:sha(dataBytes),runnerSha256:sha(fs.readFileSync(__filename)),serializedWorkerBootstraps:0,frozenFixturePlans:0,frozenFixtureProofs:0,directPlanCalls:0,directProofCalls:0,positiveConditionBranches:0,protectedFixtures:0,staleSourceRefusals:0,snapshotLifetimeChecks:0,workerMessageCalculations:0,networkRequests:0,wikipediaWrites:0,checks:0,bundles:[]};
function check(value,message){report.checks++;assert.ok(value,message);}
function equal(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
function planCall(api,...args){report.directPlanCalls++;return api.v219NestedCitationSourcePlan(...args);}
function proofCall(api,...args){report.directProofCalls++;return api.v219NestedCitationSourceProof(...args);}
function walk(node,visit,parents=[]){if(!node||typeof node!=='object')return;visit(node,parents);for(const[k,value]of Object.entries(node)){if(['loc','start','end','extra','comments'].includes(k))continue;if(Array.isArray(value))value.forEach(child=>walk(child,visit,[...parents,node]));else walk(value,visit,[...parents,node]);}}
for(const filename of['RevisaWiki_v2_21_0.js','RevisaWiki_v2_21_0_completo.js']){
 const file=path.join(runtime,filename),bytes=fs.readFileSync(file),source=bytes.toString(),ast=parser.parse(source),boots=[],refs=[],declarations=[];
 walk(ast,(node,parents)=>{if(node.type==='FunctionExpression'&&node.id?.name==='RevisaWikiBoot')boots.push(node);if(node.type==='VariableDeclarator'&&node.id?.name==='V221_LITERAL_VALUES_221')declarations.push({node,parents});if(node.type==='MemberExpression'&&node.object?.type==='Identifier'&&node.object.name==='V221_LITERAL_VALUES_221')refs.push({node,parents});});equal(boots.length,1,'One literal Worker bootstrap');
 const boot=boots[0];if(filename.endsWith('_completo.js')){equal(declarations.length,0,'Full distribution retains its primitive literals');equal(refs.length,0,'Full distribution has no extracted condition dependency');}else{equal(declarations.length,1,'One captured snapshot declaration');check(declarations[0].parents.includes(boot),'The snapshot is inside the serialized bootstrap');check(refs.length>0&&refs.every(row=>row.parents.includes(boot)&&row.node.start>declarations[0].node.end),'Every snapshot use shares the bootstrap lexical scope');const initializer=source.slice(declarations[0].node.init.start,declarations[0].node.init.end);equal(initializer,'Object.freeze({...root.RevisaWikiDataV2.packed.support221.literals})','Capture a frozen copy of the supplied literal dictionary');}
 const bootText=source.slice(boot.start,boot.end),sandbox={console,TextEncoder,TextDecoder,URL,setTimeout,clearTimeout,importScripts(){report.networkRequests++;throw Error('Network unavailable in the offline Worker test');},fetch(){report.networkRequests++;throw Error('Network unavailable in the offline Worker test');},XMLHttpRequest(){report.networkRequests++;throw Error('Network unavailable in the offline Worker test');}},messages=[];sandbox.postMessage=message=>messages.push(message);vm.createContext(sandbox);vm.runInContext(dataBytes.toString(),sandbox,{timeout:20000});const serialized='globalThis.RevisaWikiDataV2='+JSON.stringify(sandbox.RevisaWikiDataV2)+';\n('+bootText+')(globalThis);';vm.runInContext(serialized,sandbox,{timeout:20000});report.serializedWorkerBootstraps++;
 const api=sandbox.RevisaWiki;equal(typeof api?.v219NestedCitationSourcePlan,'function','Actual Worker path exposes the production API');equal(typeof sandbox.onmessage,'function','Actual Worker message handler installed');const rows=[];
 for(const fixture of fixtures){const plan=planCall(api,fixture.source,fixture.options);report.frozenFixturePlans++;equal(plan.text,fixture.expected,'Frozen source-authored endpoint retained');check(proofCall(api,fixture.source,fixture.expected,plan,fixture.options),'Source-bound proof accepted');report.frozenFixtureProofs++;equal(proofCall(api,fixture.source+'X',fixture.expected,plan,fixture.options),false,'A stale source cannot borrow the proof');report.staleSourceRefusals++;if(fixture.source!==fixture.expected){check(plan.edits.length>0&&plan.edits.every(e=>typeof e.proof?.condition==='string'&&e.proof.condition.length>=128),'Positive proof condition survives Worker serialization');report.positiveConditionBranches++;}else report.protectedFixtures++;rows.push({fixtureId:fixture.id,sourceSha256:sha(fixture.source),optionsSha256:sha(JSON.stringify(fixture.options)),expectedSha256:sha(fixture.expected),appliedSha256:sha(plan.text)});}
 const fixture=fixtures.find(row=>row.id==='radio-valid-image-caption'),original=planCall(api,fixture.source,fixture.options),condition=original.edits[0].proof.condition;if(!filename.endsWith('_completo.js')){sandbox.RevisaWikiDataV2.packed.support221.literals.baseline_condition47='Changed global value';equal(planCall(api,fixture.source,fixture.options).edits[0].proof.condition,condition,'Captured primitive survives global dictionary mutation');report.snapshotLifetimeChecks++;sandbox.RevisaWikiDataV2.packed.support221.literals={...sandbox.RevisaWikiDataV2.packed.support221.literals,baseline_condition47:'Replacement dictionary value'};equal(planCall(api,fixture.source,fixture.options).edits[0].proof.condition,condition,'Captured primitive survives global dictionary replacement');report.snapshotLifetimeChecks++;}
 sandbox.onmessage({data:{type:'calculate',id:17,job:{kind:'adjust',source:'Texto de controle.',options:{namespaceNumber:0,contentModel:'wikitext'}}}});report.workerMessageCalculations++;const terminal=messages.filter(row=>['result','error'].includes(row.type));equal(terminal.length,1,'One terminal message from the production Worker handler');equal(terminal[0].type,'result','Production Worker calculation completes');equal(terminal[0].result.text,'Texto de controle.','Worker preserves the control draft');
 equal(sha(fs.readFileSync(file)),sha(bytes),'Runtime file remains unchanged');report.bundles.push({file:filename,sha256:sha(bytes),serializedBootstrapSha256:sha(bootText),serializedWorkerBlobSha256:sha(serialized),cases:rows});
}
equal(report.positiveConditionBranches,10,'Both distributions execute all ten positive condition branches');equal(report.protectedFixtures,2,'Both distributions retain the protected fixture');equal(report.networkRequests,0,'Offline regression never dispatches a network request');equal(sha(fs.readFileSync(fixtureFile)),fixtureSha256,'Frozen historical fixture remains unchanged');equal(sha(fs.readFileSync(dataFile)),report.dataSha256,'Data distribution remains unchanged');process.stdout.write(JSON.stringify(report,null,2)+'\n');
"""

def sha(value):return hashlib.sha256(value).hexdigest()
def js(value):return json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False)
def runtime_catalog_hash(packed,node,workdir,core_source):
 # Use the immutable loader's own canonicalization, including ECMAScript
 # UTF-16 key order and JSON number/string spelling.
 assert core_source.count('function canonical(value)')==1
 start=core_source.index('function canonical(value)');end=core_source.index('function validShape(',start)
 function=core_source[start:end]
 payload=workdir/'packed-catalog.json';payload.write_text(js(packed))
 source="'use strict';\nconst fs=require('node:fs'),crypto=require('node:crypto');\n"+function+"\nconst value=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),raw=canonical(value);process.stdout.write(JSON.stringify({sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:Buffer.byteLength(raw)}));\n"
 script=workdir/'catalog-runtime-hash.cjs';script.write_text(source)
 result=subprocess.run([node,str(script),str(payload)],check=True,capture_output=True,text=True)
 proof=json.loads(result.stdout)
 assert re.fullmatch('[a-f0-9]{64}',proof['sha256']) and isinstance(proof['bytes'],int) and 0<proof['bytes']<2097152
 proof.update(method='Immutable runtime canonical function, ECMAScript UTF-16 key sorting and JSON.stringify',canonicalFunctionSha256=sha(function.encode()),methodSourceSha256=sha(source.encode()))
 return proof['sha256'],proof
def once(source,before,after):
 assert source.count(before)==1,('anchor',before[:120],source.count(before))
 return source.replace(before,after,1)
def sub_once(source,pattern,replacement):
 source,count=re.subn(pattern,replacement,source,count=0)
 assert count==1,('regex anchor',pattern,count)
 return source
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--node',default=os.environ.get('REVISAWIKI_NODE') or shutil.which('node'))
 ap.add_argument('--output',type=Path,default=ROOT/'dist/2.21.0');ap.add_argument('--manifest',type=Path,default=ROOT/'tests/expected_release_v2210.json')
 ap.add_argument('--workdir',type=Path,default=ROOT/'artifacts/v221/build');args=ap.parse_args();assert args.node
 baseline=json.loads((ROOT/'tests/expected_release_v2200.json').read_text());out=args.output.resolve();out.mkdir(exist_ok=True,parents=True)
 tmp=args.workdir.resolve();tmp.mkdir(exist_ok=True,parents=True)
 inputs={str(Path('src/v2_21')/n):(ROOT/'src/v2_21'/n).read_bytes() for n in HELPERS+['header.txt']}
 for p in [Path(__file__),ROOT/'scripts/v221_extract_data.cjs',ROOT/'scripts/v220_compact.cjs',ROOT/'package-lock.json']:inputs[str(p.relative_to(ROOT))]=p.read_bytes()
 original={}
 for name,pin in baseline['files'].items():
  raw=(BASE/name).read_bytes();assert len(raw)==pin['bytes'] and sha(raw)==pin['sha256'],name;original[name]=raw
 helper='\n'.join(inputs['src/v2_21/'+n].decode() for n in HELPERS)
 # Exact native contracts live in the hashed catalog in the split distribution.
 bio_data={};citation_data={};core_helper=helper
 for name in ['V221_INFOBOX_CONTRACTS','V221_INFOBOX_MAPPINGS','V221_BIOGRAPHY_PLAN_FAMILIES','V221_NATIVE_TITLECASE_MAP']:
  m=re.search(r'const '+name+r'=Object\.freeze\(([^\n]+)\);',core_helper);assert m,name
  section='citation' if name=='V221_NATIVE_TITLECASE_MAP' else 'biography'
  values=citation_data if section=='citation' else bio_data
  values[name]=json.loads(m[1]);core_helper=core_helper[:m.start(1)]+'root.RevisaWikiDataV2.packed.support221.'+section+'.'+name+core_helper[m.end(1):]
 (tmp/'helper-literals-source.js').write_text(core_helper)
 subprocess.run([args.node,str(ROOT/'scripts/v221_extract_data.cjs'),str(tmp/'helper-literals-source.js'),str(tmp/'helper-literals-extracted.js'),str(tmp/'helper-literals.json'),'helper'],check=True)
 core_helper=(tmp/'helper-literals-extracted.js').read_text()
 helper_literals=json.loads((tmp/'helper-literals.json').read_text())
 core_original=original['RevisaWiki_v2_20_0.js'].decode();(tmp/'baseline.js').write_text(core_original)
 subprocess.run([args.node,str(ROOT/'scripts/v221_extract_data.cjs'),str(tmp/'baseline.js'),str(tmp/'baseline-data-extracted.js'),str(tmp/'literals.json'),'baseline'],check=True)
 literals=json.loads((tmp/'literals.json').read_text())
 assert not literals.keys()&helper_literals.keys(),'Literal catalogs must have disjoint names'
 literals.update(helper_literals)
 data_text=original['RevisaWiki_v2_20_0_dados.js'].decode();a=data_text.index('const data=')+len('const data=');b=data_text.index(';if(typeof module',a)
 data=json.loads(data_text[a:b]);data['version']='2.21.0';data['packed']['support221']={'biography':bio_data,'citation':citation_data,'literals':literals}
 packed_hash,catalog_hash_proof=runtime_catalog_hash(data['packed'],args.node,tmp,core_original)
 data_output='/* RevisaWiki 2.21.0, dados. CC BY-SA 4.0. */\n(function(root){const data='+js(data)+data_text[b:]
 (out/'RevisaWiki_v2_21_0_dados.js').write_text(data_output)
 proofs=[]
 for full in [False,True]:
  name='RevisaWiki_v2_20_0'+('_completo' if full else '')+'.js'
  text=original[name].decode() if full else (tmp/'baseline-data-extracted.js').read_text()
  start=text.index('/*\n * RevisaWiki para a ptwiki, versão ');end=text.index('*/',start)+2
  text=text[:start]+inputs['src/v2_21/header.txt'].decode().rstrip()+text[end:]
  for old,new in [('cleanupStages','v221BaselineCleanupStages'),('preservationAudit','v221BaselinePreservationAudit'),
      ('safeComposition','v221BaselineSafeComposition'),('referenceAudit','v221BaselineReferenceAudit'),
      ('reviewSuggestions','v221BaselineReviewSuggestions'),('migrateForeignTemplate','v221BaselineMigrateForeignTemplate'),
      ('v219CitationLanguageBareReferencePlan','v221BaselineCitationLanguageBareReferencePlan'),
      ('v219SourceCompatibilityEdits','v221BaselineSourceCompatibilityEdits'),
      ('v219SourceCompatibilityRule','v221BaselineSourceCompatibilityRule'),
      ('v219CitationMappedParameter','v221BaselineCitationMappedParameter'),
      ('v220CitationCall','v221BaselineCitationCall220'),
      ('v218CitationKeyEdits','v221BaselineCitationKeyEdits218'),
      ('v213ReferenceCall','v221BaselineReferenceCall213'),
      ('v212CitationAliasCall','v221BaselineCitationAliasCall212'),
      ('citation','v221BaselineCitation221'),
      ('extendedCitation','v221BaselineExtendedCitation221')]:
   text=sub_once(text,r'(function\s*\*?\s*)'+old+r'(?=\s*\()',r'\g<1>'+new)
  text=once(text,"if(norm(p.key)==='titre'||norm(prev.key)==='titre')continue;",
    "if(norm(p.key)==='titre'||norm(prev.key)==='titre')continue;\n"+
    "if(p.key!==prev.key&&v221CitationSameEditorRole(p.key,prev.key))continue;")
  text=sub_once(text,r'if\s*\(p\.value\.trim\(\)\s*===\s*prev\.value\.trim\(\)\)\s*\{',
    'if(v221CitationNativeTrim(p.value)===v221CitationNativeTrim(prev.value)){')
  text=sub_once(text,r'(function\s*\*\s*calculationSteps\s*\(job\))',lambda m:(helper if full else core_helper)+'\n'+m[0])
  text=sub_once(text,r'(const\s+api\s*=\s*\{)',lambda m:m[0]+','.join(EXPORTS)+',')
  text=sub_once(text,r"const\s+cfg\s*=\s*await v220PrepareHeadingReferences\(task,\s*await prepareHeadingMainArticles\(task,\s*options\)\);",
    'const cfg=await v221PrepareEvidence(task,await v220PrepareHeadingReferences(task,await prepareHeadingMainArticles(task,options)));')
  text=once(text,"'v220HeadingReferenceProofs','v220HumanProof']) {" if full else "'v220HeadingReferenceProofs','v220HumanProof']){",
    "'v220HeadingReferenceProofs','v220HumanProof','v221InfoboxEntityProof','v221StructureExternalProof','v221DOITitleProofs','revisionId']){")
  text=once(text,"'leadImageProof','v220HumanProof'].includes(key)","'leadImageProof','v220HumanProof','v221InfoboxEntityProof','v221StructureExternalProof'].includes(key)")
  # A delimiter crossing an existing emphasis span cannot be relocated safely.
  pattern=r'if\s*\(inRange\(offset,\s*personEmphasis\)\s*\|\|\s*/\[:#\{\}<>\]/\.test\(target\)\)\s*return all;'
  text=sub_once(text,pattern,'if(inRange(offset,personEmphasis)||/[:#{}<>]/.test(target)||!v221LinkEmphasisBoundarySafe(s,offset,offset+all.length,quotes))return all;')
  text=text.replace("VERSION='2.20.0'","VERSION='2.21.0'").replace("VERSION = '2.20.0'","VERSION = '2.21.0'")
  text=sub_once(text,r'(distributionRevision:\s*)[\"\']2\.20\.0[\"\']',r'\g<1>"2.21.0"')
  text=text.replace('_v2_20_0','_v2_21_0').replace('RevisaWiki.catalogs.2.20.0','RevisaWiki.catalogs.2.21.0')
  if not full:
   text=once(text,"(function RevisaWikiBoot(root){\n'use strict';",
     "(function RevisaWikiBoot(root){\n'use strict';\nconst V221_LITERAL_VALUES_221=Object.freeze({...root.RevisaWikiDataV2.packed.support221.literals});")
   text=once(text,baseline['packedCatalogSha256'],packed_hash)
   text=once(text,'MAX_BYTES=1900000','MAX_BYTES=2097152')
   text=once(text,'data.packed?.ptwiki&&','data.packed?.support221&&data.packed?.ptwiki&&')
  target=out/name.replace('_v2_20_0','_v2_21_0')
  if full:target.write_text(text)
  else:
   raw=tmp/'core-uncompacted.js';raw.write_text(text);receipt=tmp/'COMPACT_PROOF.json'
   formatter=tmp/'structural-gaps.cjs';formatter.write_text(STRUCTURAL_GAP_FORMATTER)
   # Dependencies resolve from the repository even with an isolated workdir.
   environment={**os.environ,'NODE_PATH':str(ROOT/'node_modules')}
   formatted=tmp/'core-structural-gaps.js'
   result=subprocess.run([args.node,str(formatter),str(raw),str(formatted),str(ROOT/'scripts/v220_compact.cjs')],check=True,capture_output=True,text=True,env=environment)
   proofs.append(json.loads(result.stdout))
   subprocess.run([args.node,str(ROOT/'scripts/v220_compact.cjs'),'--input='+str(formatted),'--output='+str(target),'--receipt='+str(receipt)],check=True);proofs.append(json.loads(receipt.read_text()))
 for name,raw in original.items():
  if name.startswith('RevisaWiki_'):continue
  text=raw.decode();text=text.replace('2.20.0','2.21.0').replace('_v2_20_0','_v2_21_0')
  target=out/name.replace('_v2_20_0','_v2_21_0');target.write_text(text)
  if name.startswith('Chamada_fixa'):assert target.read_bytes()==raw
 files={}
 for path in sorted(out.glob('*.js')):
  subprocess.run([args.node,'--check',str(path)],check=True);raw=path.read_bytes();files[path.name]={'bytes':len(raw),'sha256':sha(raw)}
 for n in ['RevisaWiki_v2_21_0.js','RevisaWiki_v2_21_0_dados.js']:assert files[n]['bytes']<2097152,(n,files[n]['bytes'])
 # A syntactically valid bundle can still fail its catalog hash at startup.
 # Load each actual distribution in a fresh process before freezing it.
 boot_smoke=[]
 for name in ['RevisaWiki_v2_21_0.js','RevisaWiki_v2_21_0_completo.js']:
  code="const assert=require('node:assert/strict'),api=require(process.argv[1]);assert.equal(typeof api.calculate,'function');assert.equal(typeof api.defaults,'object');process.stdout.write(JSON.stringify({loaded:true,calculateType:typeof api.calculate}));"
  result=subprocess.run([args.node,'-e',code,str(out/name)],check=True,capture_output=True,text=True,timeout=60)
  boot_smoke.append({'file':name,**json.loads(result.stdout)})
 worker_smoke_file=tmp/'serialized-worker-smoke.cjs';worker_smoke_file.write_text(SERIALIZED_WORKER_SMOKE)
 worker_smoke_result=subprocess.run([args.node,str(worker_smoke_file),'--runtime='+str(out),'--fixture='+str(ROOT/'tests/v219/native_nested_citation_source_fixtures.json')],check=True,capture_output=True,text=True,timeout=60,env={**os.environ,'NODE_PATH':str(ROOT/'node_modules')})
 worker_smoke=json.loads(worker_smoke_result.stdout)
 assert worker_smoke['status']=='passed' and worker_smoke['networkRequests']==0 and worker_smoke['wikipediaWrites']==0
 assert worker_smoke['serializedWorkerBootstraps']==2 and worker_smoke['workerMessageCalculations']==2
 manifest={'version':'2.21.0','runtimeVersion':'2.21.0','distributionRevision':'2.21.0','baseVersion':'2.20.0',
   'baseManifestSha256':sha((ROOT/'tests/expected_release_v2200.json').read_bytes()),'packedCatalogSha256':packed_hash,'catalogHashProof':catalog_hash_proof,'files':files,
   'sourceInputs':{n:{'bytes':len(v),'sha256':sha(v)} for n,v in inputs.items()},'compactSourceProofs':proofs,'distributionBootSmoke':boot_smoke,'serializedWorkerSmoke':worker_smoke,
   'literalTransfer':{'names':sorted(literals),'helperNames':sorted(helper_literals),'valuesSha256':sha(js(literals).encode()),'method':'JSON literals only; original enclosing expressions retained'}}
 args.manifest.parent.mkdir(exist_ok=True,parents=True);args.manifest.write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'version':'2.21.0','files':files},indent=2))
if __name__=='__main__':main()

'use strict';
// The local renderer is headingless. Imported-name heuristics must not turn
// its reference bank or selected group into a different native renderer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'native-headingless-reference-list',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
 helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/reference_collectors.js'))),bundles:[],cases:[],checks:0,failures:[],
 nativeContracts:{source:56151616,target:63785697},helperInjection:false,networkRequests:0,wikipediaWrites:0};
const equal=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);
 for(const key of ['v219NativeReflistIdentity','v219NativeReflistCall','v219NativeReflistProof'])assert.equal(typeof api[key],'function','The actual installed helper must export '+key);
 report.bundles.push({bundle,version:api.version,sha256:sha(bytes),bytes:bytes.length});
 let endpointEvidence=[];
 function endpoint(source,expected,options,result,intent){
  equal(result.text,expected,'The complete actual action matches the independently specified native endpoint');
  const sourceSha256=sha(source),expectedEndpointSha256=sha(expected),
   optionsSha256=sha(JSON.stringify(Object.fromEntries(Object.entries(options).sort(([a],[b])=>a.localeCompare(b)))));
  endpointEvidence.push({evidenceKind:'actual-full-action-exact-endpoint',sourceSha256,expectedEndpointSha256,optionsSha256,
   intentSha256:sha(JSON.stringify({kind:'adjust',intent,sourceSha256,expectedEndpointSha256,optionsSha256})),
   appliedRuleIds:[...new Set((result.changes||[]).map(change=>change.id))],actualChanges:(result.changes||[]).map(({id,count})=>({id,count}))});
 }
 function test(id,fn){endpointEvidence=[];try{fn();report.cases.push({bundle,id,status:'passed',
  evidenceKind:endpointEvidence.length?'actual-full-action-exact-endpoint':'helper-or-invariant-only',fullActionEvidence:endpointEvidence});}
 catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
 const base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,
  pageTitle:'Tema fictício',contentModel:'wikitext',now:Date.UTC(2026,9,17,12),references:true},
  rows=[['',''],['|group=lower-alpha','|grupo=lower-alpha'],['|grupo=Nota','|grupo=Nota'],
   ['|group=','|grupo='],['|grupo=','|grupo='],['|refs=<ref name="a">Fonte literal.</ref>','|refs=<ref name="a">Fonte literal.</ref>'],
   ['|group=n|refs=<ref name="a">Fonte literal.</ref>','|grupo=n|refs=<ref name="a">Fonte literal.</ref>'],
   ['|liststyle=lower-roman','|estilolista=lower-roman'],['|estilolista=disc','|estilolista=disc'],
   ['|listaestilo=','|estilolista=']];
 for(const head of ['Reflist','reflist','Template:Reflist','template:Reflist','Predefinição:reflist'])
 for(const [fields,native]of rows)for(const multilingual of [false,true])for(const structuralRepairs of [false,true])
  test('native-matrix-'+head+'-'+fields+'-'+multilingual+'-'+structuralRepairs,()=>{
   const source='{{'+head+fields+'}}',expected='{{Referências'+native+'|nível=0}}',options={...base,multilingual,structuralRepairs},
    local=api.v219NativeReflistCall(source,options),result=api.calculate({kind:'adjust',source,options});
   equal(local.text,expected,'The native call preserves its unique selected group, bank and list style');
   equal(local.nativeSourceOldid,56151616,'The headingless source is pinned');
   equal(local.nativeTargetOldid,63785697,'The target heading suppression is pinned');
   endpoint(source,expected,options,result,'exact native headingless list conversion with original selected group, bank and list style');
   equal(result.preservation||[],[],'The complete native conversion retains its logical payloads');
   equal(api.safeComposition(source,result.text,options),'','The same group and reference bank remain associated');
   equal(api.calculate({kind:'adjust',source:expected,options}).text,expected,'The exact native endpoint is idempotent');
  });
 for(const [fields]of rows)test('references-option-off-'+fields,()=>{
  const source='{{Reflist'+fields+'}}',options={...base,references:false,multilingual:true},result=api.calculate({kind:'adjust',source,options});
  equal(api.v219NativeReflistCall(source,options).text,source,'The native list does not bypass a disabled references option');
  endpoint(source,source,options,result,'native reference list preserved while references option is disabled');
 });
 const refused=['|group=n|grupo=m','|group=|grupo=n','|grupo=n|group=', '|group=n|group=n',
  '|refs=<ref name="a">Fonte A.</ref>|refs=<ref name="b">Fonte B.</ref>', '|liststyle=|estilolista=disc',
  '|estilolista=disc|listaestilo=none','|group={{Grupo}}','|group={{{grupo|n}}}',
  '|1=2','|2','|colwidth=30em','|largcol=20em','|larguracol=300px','|colwidth=|largcol=20em',
  '|unknown=valor','|título=Título customizado','|nível=2'];
 for(const fields of refused)for(const multilingual of [false,true])test('refused-native-fields-'+fields+'-'+multilingual,()=>{
  const source='{{Reflist'+fields+'}}',options={...base,multilingual},local=api.v219NativeReflistCall(source,options),result=api.calculate({kind:'adjust',source,options});
  equal(local.text,source,'Unproved aliases, dynamic values, native column layout and unsupported fields keep their exact source');
  equal(local.blocked,true,'A refused native call cannot fall through to a generic foreign renderer');
  endpoint(source,source,options,result,'quiet refusal retains the complete native list and all field precedence');
 });
 for(const [id,wrap]of [['comment',s=>'<!-- '+s+' -->'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],
  ['markdown',s=>'```wikitext\n'+s+'\n```'],['whole-quote',s=>'"'+s+'"'],
  ['unknown-owner',s=>'{{Modelo fictício|texto='+s+'}}']])test('protected-'+id,()=>{
  const source=wrap('{{Reflist|group=n}}'),options={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',
   contentModel:'wikitext',autoPreview:false,authorityControl:false,biographyPortal:false,
   automaticBiographyPortals:false,automaticTopicPortals:false},result=api.calculate({kind:'adjust',source,options});
  endpoint(source,source,options,result,'protected source example or unknown enclosing template remains literal');
 });
 test('concatenated-complete-calls-are-not-one-native-call',()=>{
  const source='{{Reflist|refs=<ref>Fonte literal.</ref>}}{{Modelo fictício}}';
  equal(api.v219NativeReflistCall(source,base).text,source,'A reference bank cannot absorb a separate following complete template');
 });
 for(const raw of ['{{REFLIST}}','{{RefList}}','{{Reflistx}}','{{Outros:Reflist}}','{{Reflist','Texto {{Reflist}}'])
  test('unknown-identity-'+raw,()=>equal(api.v219NativeReflistCall(raw,base),null,'Only the original native first-letter identity and namespace prefixes are eligible'));
 test('literal-payload-and-source-bound-proof-tamper',()=>{
  const raw='{{Reflist|group=n|refs=<ref name="a">Fonte literal.</ref>}}',
   expected='{{Referências|grupo=n|refs=<ref name="a">Fonte literal.</ref>|nível=0}}';
  ok(api.v219NativeReflistProof(raw,expected,base),'Only the exact independently specified native call can reuse its proof');
  for(const changed of [expected.replace('grupo=n','grupo=m'),expected.replace('Fonte literal.','Fonte alterada.'),
   expected.replace('name="a">','name="b">'),expected.replace('nível=0','nível=2')])
   equal(api.v219NativeReflistProof(raw,changed,base),false,'A changed name, body, selected group or heading cannot reuse the source-bound contract');
  equal(api.v219NativeReflistProof(raw+' ',expected,base),false,'Different source bytes cannot reuse that native call proof');
  equal(api.v219NativeReflistProof(raw,expected,{...base,references:false}),false,'A disabled reference option cannot authorize the endpoint');
 });
 equal(sha(fs.readFileSync(file)),sha(bytes),'The actual bundle is immutable during the entire suite');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),oracles=require('./independent_v213_cases.cjs'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs'),files=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const report={version:'2.13.0',kind:'independent-fourteen-safe-repairs',runnerSha256:sha(fs.readFileSync(__filename)),oracleSha256:sha(fs.readFileSync(path.join(__dirname,'independent_v213_cases.cjs'))),cases:[],checks:0,failures:[],bundles:[],wikipediaWrites:0,networkRequests:0};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
function test(bundle,name,run){try{run();report.cases.push({bundle,name,status:'passed'});}catch(error){report.cases.push({bundle,name,status:'failed'});report.failures.push({bundle,name,message:String(error.message).replaceAll(root,'<local-path>')});}}
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo técnico',authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,autoPreview:false,registryDoiCheck:false,minorBaseConfirmed:true,unifiedNotesReferences:false,referenceColumns:false,tableAccessibility:false,endTemplateOrder:false,endSectionOrder:false,headings:false,automaticIdenticalReferences:false,moveNamedRefs:false};
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version});
 const tables=new Set([1,2,3,4,12,13]),project=(source,settings=cfg)=>{
  if(typeof api.v213TableFiniteRepairPlan==='function'&&/\{\|/.test(source))source=api.v213TableFiniteRepairPlan(source,settings).text;
  source=api.v213ReferenceSyntaxPlan(source,settings).text;
  return api.v213ReferenceFieldPlan(source,settings).text;
 };
 const finite=(item,source=item.source,settings=cfg)=>tables.has(item.feature)?api.v213TableFiniteRepairPlan(source,settings).text:api.v213ReferenceFieldPlan(api.v213ReferenceSyntaxPlan(source,settings).text,settings).text;
 const calculate=(source,options={})=>api.calculate({kind:'adjust',source,options:{...cfg,...options}});
 for(const item of oracles.items)test(bundle,item.id,()=>{
  const actual=finite(item);eq(actual,item.expected,'The finite repair matches the independently handwritten exact endpoint');eq(finite(item,actual),actual,'The finite repair is idempotent');
  if(!item.positive)return;
  const result=calculate(item.source);eq(result.text,item.expected,'The complete adjustment pipeline reaches the same handwritten endpoint');eq(result.preservation,[],'Every full source-preservation check passes');eq(api.safeComposition(item.source,result.text,cfg),'','Selectable composition accepts the complete repair');eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'A second full action is a no-op');
  const count=api.v211RetainedAdjustments(item.source,result.text);eq(count.exact,true,'Retained occurrences are proven rather than guessed');if(item.count!==undefined)eq(count.count,item.count,'The retained change count matches the independent operation count');eq(api.v211MinorMechanicalPlan(item.source,cfg).text,result.text,'The mechanical minor-edit proof replays the exact source result');eq(result.minorCheck.eligible,true,'The saved-origin mechanical proof accepts the bounded repair');
  if(item.feature===9)eq(result.text.includes('978-0-306-40615-7')||result.text.includes('0-306-40615-2'),true,'The checksum-valid ISBN digits and hyphens remain unchanged');
  if(item.feature===6&&item.source.includes('arxiv'))eq(result.text.includes('2401.01234v2'),true,'Identifier extraction retains the exact arXiv version');
 });
 for(const item of oracles.representative)for(const [name,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['code',s=>'<code>'+s+'</code>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['source',s=>'<source lang="wikitext">'+s+'</source>'],['comment',s=>'<!--'+s+'-->'],['unknown enclosing template',s=>'{{Modelo desconhecido|'+s+'}}']])test(bundle,item.id+' protected '+name,()=>{
  const source=wrap(item.source);eq(finite(item,source),source,'Protected examples and unverified enclosing expansions retain all original bytes');
 });
 for(const item of oracles.representative)for(const options of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{sectionOnly:true},{section:'2'},{discussionPage:true},{contentModel:'javascript'},{model:'json'},{markup:false},{syntaxRepairs:false},{structuralRepairs:false}])test(bundle,item.id+' scope '+JSON.stringify(options),()=>eq(finite(item,item.source,{...cfg,...options}),item.source,'The repair cannot borrow whole-article proof in an unknown, partial or disabled context'));
 for(const item of oracles.items.filter(item=>item.positive))test(bundle,item.id+' cannot hide an unrelated mutation',()=>{
  let changed=item.expected;
  if(tables.has(item.feature))changed=changed.replace('Cabeçalho','Texto alterado').replace('| A','| Valor alterado').replace('Item B','Item alterado');
  else changed=changed.replace('Fonte literal','Fonte inventada').replace('Fonte literal.','Fonte inventada.');
  eq(changed!==item.expected,true,'The adversarial endpoint contains a real unrelated source or ordered-cell mutation');eq(api.syntaxRepairSourceProof(item.source,changed,cfg).accepted,false,'A finite syntax repair cannot authorize changed source content');eq(Boolean(api.safeComposition(item.source,changed,cfg)),true,'Selectable comparison rejects that changed content');eq(api.preservationAudit(item.source,changed,cfg).length>0,true,'The independent preservation endpoint also detects the mutation');
 });
 test(bundle,'all fourteen repairs finish in one bounded action',()=>{
  const {source,expected,count}=oracles.combined,result=calculate(source);eq(result.text,expected,'The composition keeps the handwritten endpoint for all fourteen independent fixes');eq(result.preservation,[],'Combined sources, tables, identifiers and reference bodies remain intact');eq(calculate(result.text).text,result.text,'No repair is postponed to another button press');eq(api.v211RetainedAdjustments(source,result.text).exact,true,'Every composed retained adjustment has a source occurrence');eq(api.v211RetainedAdjustments(source,result.text).count,count,'The fourteen issues are counted individually');eq(api.v211MinorMechanicalPlan(source,cfg).text,result.text,'Minor replay follows the same bounded repair sequence');eq(api.safeComposition(source,result.text,cfg),'','The complete composition satisfies the selective-diff guard');
 });
 for(const size of [2,3,4,8,16])for(const broken of ['colspan='+size+'"','colspan"'+size+'"','colpsan="'+size+'"','colspan="'+size+'”'])for(const crlf of [false,true])test(bundle,'generated regular span '+JSON.stringify([size,broken,crlf]),()=>{
  let source=oracles.table('| '+broken+' | Cabeçalho\n|-\n| '+Array.from({length:size},(_,i)=>'A'+i).join(' || ')),expected=source.replace(broken,'colspan="'+size+'"');if(crlf){source=source.replaceAll('\n','\r\n');expected=expected.replaceAll('\n','\r\n');}
  eq(api.v213TableFiniteRepairPlan(source,cfg).text,expected,'An explicit regular grid determines the one finite span correction');eq(calculate(source).text,expected,'The complete action retains all generated ordered cell data');eq(calculate(expected).text,expected,'Generated span corrections require one action');
 });
 for(const scheme of ['https','http'])for(const prefixes of [2,3,4])for(const role of ['url','arquivo-url'])test(bundle,'bounded literal protocol chain '+JSON.stringify([scheme,prefixes,role]),()=>{
  const value=(scheme+'://').repeat(prefixes)+'example.test/fonte',tail=role==='url'?role+'='+value:'url=https://example.test/original|arquivo-data=2020-01-02|'+role+'='+value,source=oracles.ref(oracles.citation(tail)),expected=source.replace(value,scheme+'://example.test/fonte');
  eq(api.v213ReferenceFieldPlan(source,cfg).text,expected,'Only the exact repeated protocol prefix is removed');eq(calculate(source).text,expected,'Main and archive URL aliases finish in the same full action');eq(calculate(expected).text,expected,'No protocol-chain residue needs another action');
 });
 for(const item of oracles.representative.filter(item=>!tables.has(item.feature)))test(bundle,item.id+' rejects stale field evidence',()=>{
  const syntax=api.v213ReferenceSyntaxPlan(item.source,cfg),plan=api.v213ReferenceFieldPlan(syntax.text,cfg);
  if(plan.text!==plan.source){eq(api.v213ReferenceFieldProof(plan.source,plan.text,plan,cfg),true,'The exact field plan is independently regenerated');eq(api.v213ReferenceFieldProof(plan.source+'x',plan.text,plan,cfg),false,'A stale source cannot borrow the field plan');eq(api.v213ReferenceFieldProof(plan.source,plan.text,{...plan,sourceHash:'forged'},cfg),false,'A forged source hash cannot authorize a field repair');}
  if(syntax.text!==syntax.source){eq(api.v213ReferenceSyntaxProof(syntax.source,syntax.text,syntax,cfg),true,'The exact syntax plan is independently regenerated');eq(api.v213ReferenceSyntaxProof(syntax.source+'x',syntax.text,syntax,cfg),false,'A stale source cannot borrow the structural reference plan');eq(api.v213ReferenceSyntaxProof(syntax.source,syntax.text,{...syntax,sourceHash:'forged'},cfg),false,'A forged source hash cannot authorize structural reference changes');}
 });
}
report.failed=report.failures.length;report.status=report.failed?'failed':'passed';const output=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2130'));fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'independent_v213_qa.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures}));if(report.failed)process.exitCode=1;

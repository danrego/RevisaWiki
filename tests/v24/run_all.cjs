'use strict';
// The input/expected corpus was frozen before the 2.4 implementation was read.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const dir=__dirname,root=path.resolve(dir,'../..');
const script=path.resolve(process.env.REVISAWIKI_QA_SCRIPT||path.join(root,'dist/2.4.0/RevisaWiki_v2_4_completo.js'));
const api=require(script),fixtures=[...JSON.parse(fs.readFileSync(path.join(dir,'fixtures.json'))),...JSON.parse(fs.readFileSync(path.join(dir,'discovered_fixtures.json')))];
const rows=[];let checks=0;
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)},ok=(v,m)=>{checks++;assert(v,m)};
function test(name,fn){const start=checks;try{fn();rows.push({name,passed:true,checks:checks-start})}catch(e){rows.push({name,passed:false,checks:checks-start,error:e.stack})}}
const defaults={namespaceNumber:0,pageTitle:'Teste independente',authorityControl:false,endTemplateOrder:false,review:false,autoPreview:false,registryDoiCheck:false};
const counters={'syntax-template-close':'syntaxTemplateClosers','syntax-backslash-close-tag':'syntaxTagTypos','syntax-ref-close-boundary':'syntaxReferenceClosers','syntax-empty-named-ref':'syntaxNamedRefReuse','syntax-ref-format-close':'syntaxFormattingClosers','syntax-table-close-eof':'syntaxTableClosers'};
for(const f of fixtures)test('isolated '+f.name,()=>{
 const cfg={...defaults,...f.options},bumps=[],warnings=[];
 const out=api.automaticSyntaxRepairs(f.source,cfg,(id,n)=>bumps.push({id,n}),m=>warnings.push(m));
 const expected=f.optionalExpected&&out===f.optionalExpected?f.optionalExpected:f.expected;
 eq(out,expected,'Exact independent expected output including Unicode, source bodies and whitespace');
 eq(api.automaticSyntaxRepairs(out,cfg,()=>{},()=>{}),out,'Repair helper is idempotent');
 const plan=api.syntaxRepairPlan(f.source,cfg);
 eq(plan.text,expected,'Plan and applying helper agree');
 let rebuilt=f.source;for(const e of [...plan.edits].sort((a,b)=>b.start-a.start))rebuilt=rebuilt.slice(0,e.start)+e.text+rebuilt.slice(e.end);
 eq(rebuilt,expected,'Declared edits reconstruct exact output');
 for(const e of plan.edits){ok(e.start>=0&&e.end>=e.start&&e.end<=f.source.length,'Edit has valid bounded source range');ok(e.proof&&typeof e.proof==='object','Each edit includes an auditable proof');}
 if(f.source!==expected){ok(plan.edits.some(e=>(e.ruleId===f.rule||e.ruleIds?.includes(counters[f.rule]))),'Expected named repair rule actually fired');ok(bumps.some(b=>b.id===counters[f.rule]),'Applied repair has its report counter');}
 else eq(plan.edits,[],'Negative or protected fixture has no applied edit');
});
test('cached plan resists caller mutation',()=>{
 const source='Texto de teste.<ref>{{Citar web|url=https://example.invalid/cache-proof|titulo=Cache 中文]]</ref>',expected=source.replace('中文]]','中文}}'),plan=api.syntaxRepairPlan(source,defaults),evil=expected.replace('Cache 中文','Fonte removida');
 eq(plan.text,expected,'Unique cache mutation source is independently repairable');
 try{plan.text=evil;}catch(e){ok(e instanceof TypeError,'Frozen mutation fails explicitly');}
 try{plan.edits.push({start:0,end:source.length,text:evil,ruleId:'syntaxTemplateClosers'});}catch(e){ok(e instanceof TypeError,'Frozen edit-array mutation fails explicitly');}
 eq(api.syntaxRepairPlan(source,defaults).text,expected,'Caller cannot poison later plan regeneration');
 ok(!api.syntaxRepairEquivalence(source,evil,plan,defaults),'Equivalence never trusts mutated caller plan');
});
if(typeof api.calculate==='function'){
 test('new parameter map is explicit and nonduplicated',()=>{const map=JSON.parse(fs.readFileSync(path.join(dir,'parameter_aliases_v24.json')));eq(Object.keys(map).length,29,'Exactly 29 new explicit aliases');ok(!Object.hasOwn(map,'publicadoo'),'Existing 2.3 alias is not counted as new');});
 test('signed discussion retains original malformed source',()=>{const source='{{Referências]]\n{{Citar web|titulo=Fonte|url=https://example.invalid|acessodtaa=14 de outubro de 2026}}\n[[Usuário:Fulano|Fulano]] 21h34min de 10 de outubro de 2026 (UTC)';const r=api.calculate({kind:'adjust',source,originalSource:source,options:{...defaults,namespaceNumber:1,discussionPage:true}});eq(r.text,source,'Existing signed conversation is byte-identical');});
 for(const f of JSON.parse(fs.readFileSync(path.join(dir,'parameter_fixtures.json'))))test('parameter '+f.name,()=>{
  const cfg={...defaults,citations:true,citationRepairs:true,...f.options},bumps=[];
  const actual=api.automaticCitationRepairs(f.source,cfg,id=>bumps.push(id));eq(actual,f.expected,'Only explicit safe alias changes, no collision or inferred fuzzy match');eq(api.automaticCitationRepairs(actual,cfg,()=>{}),actual,'Exact alias correction is idempotent');if(actual!==f.source)ok(bumps.includes('verifiedParameterTypos'),'Parameter typo correction is reported');
  if(f.source!==f.expected){const r=api.calculate({kind:'adjust',source:f.source,originalSource:f.source,options:{...cfg,dates:false}});ok(!r.text.includes(f.name.replace('exact alias ','')+'='),'Full calculate repairs the exact invalid key');ok(r.changes.some(c=>c.id==='verifiedParameterTypos'),'Full calculate retains exact alias counter');eq(r.preservation,[],'Alias proof preserves every source field value');eq(api.cleanup(r.text,{...cfg,dates:false}).text,r.text,'Alias full pipeline is idempotent');}
 });
 for(const f of fixtures.filter(f=>f.source!==f.expected))test('calculate retains '+f.name,()=>{
  const cfg={...defaults,...f.options},r=api.calculate({kind:'adjust',source:f.source,originalSource:f.source,options:cfg});
  const clean=api.cleanup(f.source,cfg);
  eq(r.text,clean.text,'Full calculate and cleanup use the same repair pipeline');
  ok(r.changes.some(c=>c.id===counters[f.rule]),'Actual final report retains expected repair counter');
  ok(api.summaryTopics(f.source,r.text,r.changes.map(c=>c.id)).includes('sintaxe'),'Applied syntax repair has an accurate syntax summary topic');
  ok(r.text!==f.source,'Full calculate really changes the malformed input');
  eq(r.preservation,[],'Intended exact repair is accepted by final conservation audit');
  eq(api.cleanup(r.text,cfg).text,r.text,'Full one-click output is idempotent');
  const diff=api.comparison(f.source,r);
  eq(api.composeChanges(f.source,diff),r.text,'Accept-all diff reproduces candidate exactly');
  eq(api.composeChanges(f.source,diff.map(h=>({...h,accepted:false}))),f.source,'Reject-all diff restores original exactly');
  if(r.byteMetrics){eq(r.byteMetrics.delta,Buffer.byteLength(r.text)-Buffer.byteLength(f.source),'UTF-8 byte delta includes intended Unicode repairs');eq(r.byteMetrics.added-r.byteMetrics.removed,r.byteMetrics.delta,'Displayed additions and removals conserve exact byte delta');}
 });
 for(const f of JSON.parse(fs.readFileSync(path.join(dir,'proof_fixtures.json')))){
  test('canonical source proof '+f.name,()=>{const proof=api.syntaxRepairSourceProof(f.before,f.baseline,defaults);ok(proof.applied,'The original exact source has a recognized repair');ok(proof.ok&&proof.accepted,'Exact independently written canonical repair is accepted');});
  test('source proof blocks new malformed tail '+f.name,()=>{const proof=api.syntaxRepairSourceProof(f.before,f.baseline+'\n{{',defaults);ok(!proof.ok&&!proof.accepted,'Source repair cannot introduce a new unclosed template');});
  for(const m of f.mutations)test('source proof blocks '+f.name+' '+m.name,()=>{const after=m.remove?f.baseline.replace(m.remove,''):f.baseline.replace(m.old,m.new);ok(after!==f.baseline,'Independent mutation actually changes candidate');const proof=api.syntaxRepairSourceProof(f.before,after,defaults);ok(!proof.ok&&!proof.accepted,'A valid repair proof cannot authorize this unrelated body/group/occurrence change');});
 }
 test('named reference family crossing unresolved template tail',()=>{
  const ref='<ref name="x">{{Cite web|title=Fonte|url=https://example.invalid}}</ref>',tail='{{broken\n'+ref,source='Uma excessão consta aqui.\nA.'+ref+'\n'+tail,r=api.calculate({kind:'adjust',source,originalSource:source,options:defaults});
  ok(r.text.startsWith('Uma exceção consta aqui.'),'Independent valid spelling repair still executes');
  eq((r.text.match(/<ref name="x">[\s\S]*?<\/ref>/g)||[]),[ref,ref],'A named family spanning opaque boundary stays byte-identical, including all citation parameters');
  eq(r.text.slice(r.text.indexOf(tail)),tail,'Opaque template tail stays byte identical');
  eq(api.cleanup(r.text,defaults).text,r.text,'Cross-boundary reference family remains idempotent');eq(r.preservation,[],'No source family conflict or loss is introduced');
 });
 const tails=[
  '<ref>Fonte sem fechamento.\n\nO seguinte parágrafo é prosa, nunca corpo de referência inferido.\n{{Referências}}\n[[Categoria:中文]]\n',
  '{{Predefinição desconhecida|valor=中文\n\nProsa que pertence ao artigo.\n{{Referências}}\n[[Categoria:中文]]\n',
  '{| class="wikitable"\n! A !! B\n|-\n| 1 || 2\nProsa que impede inferir o fechamento.\n{{Referências}}\n[[Categoria:中文]]\n',
  '<ref name="a"><ref name="b">Fonte B.</ref>\n{{Referências}}\n[[Categoria:中文]]\n',
 ];
 for(const tail of tails)test('safe prefix isolation '+tail.split('\n')[0],()=>{
  const prefix='Uma excessão consta aqui.\n{{Reflist}}\nTexto.<ref name="alpha">Fonte A.</ref><ref name="beta">Fonte B.</ref>\n{{Portal3|Brasil}}\n{{Commonscat|Brasil}}\n';
  const source=prefix+tail,cfg={...defaults},r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
  ok(r.text.startsWith('Uma exceção consta aqui.'),'An independent safe spelling repair executes before unresolved tail');
  eq(r.text.slice(r.text.indexOf(tail)),tail,'Unresolved tail stays byte identical through true EOF');
  ok(r.text.includes('{{Reflist}}'),'Global collector conversion remains disabled with unresolved tail');
  eq((r.text.match(/\{\{(?:Reflist|Referências)\b/g)||[]).length,2,'No missing global renderer is appended, removed or relocated');
  ok(r.text.indexOf('{{Portal3|Brasil}}')<r.text.indexOf('{{Commonscat|Brasil}}'),'Existing footer order remains exact');
  for(const ref of ['<ref name="alpha">Fonte A.</ref>','<ref name="beta">Fonte B.</ref>'])ok(r.text.includes(ref),'Global reference family leaves prefix refs unchanged');
  ok(r.warnings.length>0,'Unresolved tail is disclosed');eq(r.preservation,[],'Safe prefix has no arbitrary content loss');
  eq(api.cleanup(r.text,cfg).text,r.text,'Repeated click never appends a hidden renderer or edits tail');
 });
 for(const [name,before,after,code] of [
  ['prose','Texto com detalhe que precisa ficar.','Texto com detalhe.','lost-prose'],
  ['URL','Texto. [https://example.invalid/fonte Fonte]','Texto.','lost-url'],
  ['image','Texto. [[Imagem:Fonte.jpg|miniatura|中文]]','Texto.','lost-image'],
  ['protected literal','Texto. <nowiki>{{Exemplo|a=中文}}</nowiki>','Texto.','lost-protected'],
  ['identifier','Texto.<ref>{{Citar periódico|doi=10.1234/exemplo|titulo=Fonte}}</ref>','Texto.','lost-identifier'],
 ])test('mutation still blocked '+name,()=>ok(api.preservationAudit(before,after).some(f=>f.code===code),'Existing arbitrary loss remains blocked after repair-aware comparison'));
 for(const f of fixtures.filter(f=>f.source!==f.expected))test('repair proof never permits source loss '+f.name,()=>{
  const baseline='Texto com detalhe e 中文. '+f.expected+'\n[https://example.invalid/segredo Fonte que fica]';
  const corrupted=baseline.replace('detalhe e 中文. ','').replace('[https://example.invalid/segredo Fonte que fica]','');
  ok(api.preservationAudit(baseline,corrupted).length>0,'Authorized repair cannot waive unrelated prose and URL losses');
 });
}
const report={version:api.version||null,script,scriptSha256:crypto.createHash('sha256').update(fs.readFileSync(script)).digest('hex'),fixtureSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'fixtures.json'))).digest('hex'),cases:rows.length,checks,passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed).length,wikipediaWrites:0,networkRequests:0,tests:rows};
const outputDirectory=path.join(dir,'artifacts');fs.mkdirSync(outputDirectory,{recursive:true});const out=process.env.REVISAWIKI_QA_REPORT||path.join(outputDirectory,'independent_contract_results.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:rows.filter(r=>!r.passed)}));process.exitCode=report.failed?1:0;

// The late 2.3 regressions remain mandatory against the selected 2.4 distribution.
const sourceTestRuns=[{name:'v24',cases:report.cases,checks:report.checks,passed:report.passed,failed:report.failed,report:path.relative(dir,out)}];
const {spawnSync}=require('node:child_process');
for(const [name,runner] of [['ref_punctuation','legacy/ref_punctuation/contracts.cjs'],['reference_headers','legacy/reference_headers/contracts.cjs'],['reference_columns','legacy/reference_columns/contracts.cjs'],['quote_markup','desflorestacao/contracts.cjs']]){
 const legacyReport=path.join(outputDirectory,name+'_results.json');
 const child=spawnSync(process.execPath,[path.join(dir,runner)],{env:{...process.env,REVISAWIKI_QA_SCRIPT:script,REVISAWIKI_QA_REPORT:legacyReport},encoding:'utf8'});
 if(child.status!==0){process.stderr.write(child.stdout||'');process.stderr.write(child.stderr||'');}
 if(!fs.existsSync(legacyReport))throw new Error('Required legacy suite did not produce evidence: '+name);
 const r=JSON.parse(fs.readFileSync(legacyReport));sourceTestRuns.push({name,cases:r.cases,checks:r.checks,passed:r.passed,failed:r.failed+(child.status!==0&&!r.failed?1:0),report:path.relative(dir,legacyReport)});
}
const aggregate={version:api.version,script,scriptSha256:report.scriptSha256,sourceTestRuns,cases:sourceTestRuns.reduce((n,r)=>n+r.cases,0),checks:sourceTestRuns.reduce((n,r)=>n+r.checks,0),passed:sourceTestRuns.reduce((n,r)=>n+r.passed,0),failed:sourceTestRuns.reduce((n,r)=>n+r.failed,0),wikipediaWrites:0,networkRequests:0};
fs.writeFileSync(path.join(outputDirectory,'suite_results.json'),JSON.stringify(aggregate,null,2)+'\n');console.log(JSON.stringify(aggregate));process.exitCode=aggregate.failed?1:0;

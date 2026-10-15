'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),script=path.join(root,'dist/2.3.0/RevisaWiki_v2_3.js'),a=require(script);
fs.mkdirSync(path.join(__dirname,'artifacts'),{recursive:true});
const cases=[];let checks=0;const eq=(x,y,label)=>{checks++;assert.deepEqual(x,y,label);},ok=(x,label)=>{checks++;assert(x,label);};
const header='! Data\n! Lugar\n! Fonte\n';
const row='|-\n| 21/03/2020\n| [[Lugar|Cidade]]\n| Texto com =, {{!}} e || escapado.<ref name="a">Fonte com {{Citar web|url=https://example.invalid/a?x=1|titulo=Fonte}}</ref>\n';
const safeRow='|-\n| 21/03/2020\n| [[Lugar|Cidade]]\n| Informação.<ref name="a">Fonte com {{Citar web|url=https://example.invalid/a?x=1|titulo=Fonte}}</ref>\n';
const source=({attrs=' class="wikitable"',span='3',heading='=== 2020 ===',body=safeRow,ending='|}\n',blank='' }={})=>'{|'+attrs+'\n'+header+'|-\n| colspan="'+span+'" |\n'+blank+heading+'\n'+body+ending;
const adjust=(s,cfg={})=>a.cleanup(s,{namespaceNumber:0,authorityControl:false,endTemplateOrder:false,...cfg});
function test(name,fn){const start=checks;try{fn();cases.push({name,passed:true,checks:checks-start});}catch(e){cases.push({name,passed:false,error:e.stack});}}
for(const level of [3,4,5])for(const span of ['3','2'])for(const blank of ['','\n',' \n\n'])test('one full source block '+[level,span,JSON.stringify(blank)].join(' '),()=>{
 const h='='.repeat(level)+' 2020 '+'='.repeat(level),s=source({span,heading:h,blank});const p=a.tableYearSectionCandidates(s);eq(p.edits.length,1,'Known heading row accepted');
 const r=a.automaticTableYearSections(s,{},()=>{},()=>{});eq(r,h+'\n{| class="wikitable"\n'+header+safeRow+'|}\n','Exact output does not infer or move data cells');
 eq(a.automaticTableYearSections(r,{},()=>{},()=>{}),r,'Idempotent specific rule');eq(a.preservationAudit(s,r),[],'No reference, URL or protected-source loss');
 eq(p.proofs[0].bodyBlocks,[safeRow],'Exact original row bytes');
});
test('duplicate event records retain all occurrences',()=>{
 const s=source({body:safeRow+safeRow+safeRow});const r=a.automaticTableYearSections(s,{},()=>{},()=>{});eq(r.split(safeRow).length-1,3,'Every identical source occurrence retained');
});
test('two years repeat only static column labels',()=>{
 const second='|-\n| 22/03/2021\n| Outra cidade\n| Nota.<ref name="a"/>\n';const s=source({body:safeRow+'|-\n| colspan="3" |\n=== 2021 ===\n'+second}),r=a.automaticTableYearSections(s,{},()=>{},()=>{});
 eq(r,'=== 2020 ===\n{| class="wikitable"\n'+header+safeRow+'|}\n\n=== 2021 ===\n{| class="wikitable"\n'+header+second+'|}\n','Expected two tables');
 eq(r.split(header).length-1,2,'Only column labels copied');eq((r.match(/<ref\b/g)||[]).length,2,'No extra citations');
});
test('only heading correction enters edit summary and never auto minor',()=>{
 const s=source();const r=a.calculate({kind:'adjust',source:s,originalSource:s,options:{namespaceNumber:0,authorityControl:false,endTemplateOrder:false,minorBaseConfirmed:true}});
 ok(r.changes.some(x=>x.id==='tableYearSections'),'New counted rule visible');ok(a.summaryTopics(s,r.text,r.changes.map(x=>x.id)).includes('tabelas'),'Table summary topic');ok(a.summaryTopics(s,r.text,r.changes.map(x=>x.id)).includes('seções'),'Section summary topic');eq(r.minorCheck.eligible,false,'Structural change not automatically minor');eq(adjust(r.text).text,r.text,'Whole pipeline stable');
});
for(const [label,s]of [
 ['table ID',source({attrs:' class="wikitable" id="tabela"'})],['infobox class',source({attrs:' class="wikitable infobox"'})],
 ['navbox class',source({attrs:' class="wikitable navbox"'})],['unclosed table',source({ending:''})],
 ['closing prose',source({ending:'|} Texto adicional\n'})],['closing reference',source({ending:'|}<ref>Fonte extra</ref>\n'})],
 ['dynamic year',source({heading:'=== {{Ano}} ==='})],['named year',source({heading:'=== Ano de 2020 ==='})],
 ['indented heading',source({heading:' === 2020 ==='})],['range year',source({heading:'=== 2020–2021 ==='})],
 ['too small grouping span',source({span:'1'})],['too large grouping span',source({span:'5'})],
 ['grouping extra nonempty cell',source({heading:'=== 2020 ===\n| Fonte nova'})],['grouping comment',source({heading:'=== 2020 ===\n<!-- comentário -->'})],
 ['rowspan crosses sections',source({body:safeRow.replace('| [[Lugar|Cidade]]','| rowspan="2" | [[Lugar|Cidade]]')})],
 ['unknown data template',source({body:row})],['row-producing template',source({body:'|-\n{{Linha|a|b}}\n'})],
 ['template in column header',source().replace('! Data','! {{Título}}')],['citation in column header',source().replace('! Data','! Data<ref>Fonte</ref>')],
 ['ID in column header',source().replace('! Data','! id="c1" | Data')],['nested table',source({body:safeRow+'{| class="wikitable"\n| interna\n|}\n'})],
 ['captions',source().replace(header,'|+ Legenda\n'+header)],['unsupported body heading',source({body:safeRow+'=== 2022 ===\n'})],
 ['unmatched heading level',source({heading:'=== 2020 ===='})]
])test('guard '+label,()=>{eq(a.tableYearSectionCandidates(s).edits.length,0,'Ambiguous or semantic source preserved');eq(a.automaticTableYearSections(s,{},()=>{},()=>{}),s,'Specific rule preserves exact input');});
for(const wrapper of [s=>'<nowiki>'+s+'</nowiki>',s=>'<!--'+s+'-->',s=>'<syntaxhighlight lang="text">'+s+'</syntaxhighlight>',s=>'<ref>'+s+'</ref>'])test('protected example '+cases.length,()=>eq(a.tableYearSectionCandidates(wrapper(source())).edits,[],'Protected source not converted'));
for(const cfg of [{sectionOnly:true},{discussionPage:true},{namespaceNumber:10},{tableChecks:false},{automaticTableRepairs:false},{headings:false}])test('options guard '+JSON.stringify(cfg),()=>eq(a.automaticTables(source(),{namespaceNumber:0,...cfg},()=>{},()=>{}),source(),'Disabled context preserves source'));
test('empty spacer rows and horizontal detail cells preserved',()=>{
 const spacer='|-\n| colspan="3" |\n',detail='|-\n| colspan="3" | Nota de contexto.<ref name="a"/>\n',s=source({body:safeRow+spacer+detail}),r=a.automaticTableYearSections(s,{},()=>{},()=>{});ok(r.includes(safeRow+spacer+detail),'Exact spacer and detail row bytes');
});
test('finite color template in double-quoted style',()=>{
 const color=safeRow.replace('| [[Lugar|Cidade]]','! style="background-color:#{{Cor tempestade|cat1}};width:2em" title="F1" | F1'),s=source({body:color});eq(a.tableYearSectionCandidates(s).edits.length,1,'Verified color rendering is inline in a style');ok(a.automaticTableYearSections(s,{},()=>{},()=>{}).includes(color),'Color and all source data exact');
});
test('color call outside style is uncertain',()=>eq(a.tableYearSectionCandidates(source({body:safeRow.replace('Informação.','{{Cor tempestade|cat1}}')})).edits.length,0,'No arbitrary template expansion inference'));
const articleRows=[];
for(const id of [73209108,73209168,73209386])test('real frozen article '+id,()=>{
 const s=fs.readFileSync(path.join(root,'tests/fixtures/Lista_de_tornados_no_Brasil_'+id+'.wiki'),'utf8'),p=a.tableYearSectionCandidates(s),after=a.automaticTableYearSections(s,{},()=>{},()=>{});
 eq(p.edits.length,id===73209108?8:7,'Actual table coverage');eq(p.proofs.reduce((n,v)=>n+v.sections,0),id===73209108?29:28,'Actual annual headings');eq(a.preservationAudit(s,after),[],'Sources and protected material preserved');
 for(const proof of p.proofs)for(const body of proof.bodyBlocks)ok(after.includes(body),'Every exact source data block remains');
 const r=adjust(s);eq(adjust(r.text).text,r.text,'Full real article idempotent');eq(a.preservationAudit(s,r.text),[],'Full article preservation audit');
 if(id!==73209108){const acre=s.slice(s.indexOf('== [[Acre]]'),s.indexOf('== [[Alagoas]]'));ok(after.includes(acre),'Elder repaired Acre remains exactly as supplied');}
 fs.writeFileSync(path.join(root,'tests/artifacts/Lista_de_tornados_proposta_'+id+'.wiki'),r.text);
 articleRows.push({revid:id,tableEdits:p.edits.length,years:p.proofs.reduce((n,v)=>n+v.sections,0),sourceSha256:crypto.createHash('sha256').update(s).digest('hex'),outputSha256:crypto.createHash('sha256').update(r.text).digest('hex'),preservation:a.preservationAudit(s,r.text)});
});
const report={version:a.version,scriptSha256:crypto.createHash('sha256').update(fs.readFileSync(script)).digest('hex'),cases:cases.length,assertions:checks,passed:cases.filter(x=>x.passed).length,failed:cases.filter(x=>!x.passed).length,articleRows,tests:cases,wikipediaWriteActions:0,networkRequests:0};
fs.writeFileSync(path.join(__dirname,'artifacts/year_section_contract_results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,tests:cases.filter(x=>!x.passed)}));process.exitCode=report.failed?1:0;

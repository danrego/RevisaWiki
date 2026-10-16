'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.resolve(process.env.REVISAWIKI_SCRIPT||process.argv[2]),api=require(file),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const report={version:api.version,kind:'review-report-grouping-contract',runtimeSha256:sha(fs.readFileSync(file)),runnerSha256:sha(fs.readFileSync(__filename)),status:'passed',cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function equal(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(name,run){report.cases++;try{run();}catch(error){report.status='failed';report.failures.push({name,error:String(error.message)});}}
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de teste',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,endTemplateOrder:false,endSectionOrder:false,automaticIdenticalReferences:false,referenceColumns:false};
const source=Array.from({length:4},(_,index)=>'<ref>{{Citar web|titulo=Fonte '+index+'|url=https://example.test/'+index+'|parametro_desconhecido=valor '+index+'|outro_parametro_desconhecido=outro '+index+'}}</ref>').join('\n')+'\n{{Referências}}\n';
test('eight source proposals retain two explicit parameter identities',()=>{
 const result=api.calculate({kind:'adjust',source,options:cfg}),groups=api.v214ReviewGroups(result.suggestions);
 equal(result.text,source,'Nonempty unknown values remain byte-identical');equal(result.preservation,[],'Grouping does not exempt source-retention checks');equal(groups.length,2,'Only exact producer identities are grouped');equal(groups.map(group=>group.proposals.length),[4,4],'Four independent occurrences remain in each group');
 equal(groups.flatMap(group=>group.proposals).length,result.suggestions.length,'No occurrence is discarded');equal(groups.every(group=>group.warningMessages.length===2),true,'Only exact native warning strings are represented by the proposal');
 for(const group of groups){equal(new Set(group.proposals.map(proposal=>proposal.start)).size,4,'Every source location remains available');for(const proposal of group.proposals){equal(source.slice(proposal.start,proposal.end),proposal.before,'The exact original snippet is preserved');equal(proposal.choices.length>=1,true,'Every original review choice remains available');}}
});
test('different templates and parameter case remain separate',()=>{
 const proposal=(template,parameter,label='Mesmo rótulo')=>({label,before:'literal',choices:[],reviewGroup:{kind:'unsupported-template-parameter',template,parameter,warningMessages:['Aviso '+template]}});
 const values=[proposal('citar web','campo'),proposal('citar livro','campo'),proposal('citar web','Campo'),proposal('citar web','campo')],snapshot=JSON.stringify(values),groups=api.v214ReviewGroups(values);
 equal(groups.length,3,'Distinct source contexts cannot merge');equal(groups.map(group=>group.proposals.length),[2,1,1],'Only the exact identity is combined');equal(JSON.stringify(values),snapshot,'The report never mutates producer proposals');equal(groups[0].proposals[1],values[3],'The original proposal object is retained');
});
test('similar labels without explicit metadata never imply identity',()=>{
 const one={label:'Rever um campo',before:'A',choices:[{after:'B'}]},two={label:one.label,before:'C',choices:[{after:'D'}]},groups=api.v214ReviewGroups([one,two]);
 equal(groups.length,2,'Label equality cannot group unrelated findings');equal(groups.map(group=>group.key),[null,null],'Unproved identities remain ordinary review items');
});
test('warning representation is tied to the complete current source proposals',()=>{
 const result=api.calculate({kind:'adjust',source,options:cfg}),messages=api.v214RepresentedReviewMessages(result,source),expected=[...new Set(result.suggestions.flatMap(proposal=>proposal.reviewGroup.warningMessages))];
 equal([...messages],expected,'Every current source-bound parameter proposal covers its own exact native warnings, including an ignored occurrence');
 equal([...api.v214RepresentedReviewMessages(result,source+'Texto novo.')],[],'A changed draft cannot suppress a warning using stale proposals');
 equal([...api.v214RepresentedReviewMessages({...result,suggestions:result.suggestions.map(proposal=>({...proposal,before:proposal.before+' alterado'}))},source)],[],'A mismatched source snippet cannot cover a current warning');
 equal([...api.v214RepresentedReviewMessages({...result,suggestions:result.suggestions.map(proposal=>({...proposal,start:-1}))},source)],[],'Invalid source coordinates cannot cover a current warning');
 equal([...api.v214RepresentedReviewMessages({...result,suggestions:result.suggestions.map(proposal=>({...proposal,reviewGroup:{...proposal.reviewGroup,kind:'unproved'}}))},source)],[],'Unproved producer identities cannot cover warnings');
 equal([...api.v214RepresentedReviewMessages({...result,suggestions:result.suggestions.map(proposal=>({...proposal,reviewGroup:{...proposal.reviewGroup,warningMessages:'not-an-array'}}))},source)],[],'Only a finite producer message array can cover warnings');
});
for(const template of ['Caixa de citação','Info/Acadêmico','Info/Artista'])test('native warning representation '+template,()=>{
 const before='{{'+template+'|nome=Texto literal|campo_desconhecido=valor preservado}}',result=api.calculate({kind:'adjust',source:before,options:cfg}),groups=api.v214ReviewGroups(result.suggestions),group=groups.find(item=>item.proposals[0]?.reviewGroup?.parameter==='campo_desconhecido');
 equal(Boolean(group),true,'The native producer gives the unknown parameter explicit identity');equal(group.proposals.length,1,'A single occurrence is honestly reported');equal(result.warnings.some(message=>group.warningMessages.includes(message)),true,'Only an exact native warning can be represented by its proposal group');equal(result.text.includes('campo_desconhecido=valor preservado'),true,'The UI never deletes a nonempty unknown parameter');
});
for(const metadata of [undefined,null,{}, {kind:'another-kind',template:'citar web',parameter:'x'},{kind:'unsupported-template-parameter',template:'',parameter:'x'},{kind:'unsupported-template-parameter',template:'citar web',parameter:''},{kind:'unsupported-template-parameter',template:1,parameter:'x'},{kind:'unsupported-template-parameter',template:'citar web',parameter:1}])test('decline incomplete producer identity '+sha(JSON.stringify(metadata)||'undefined').slice(0,8),()=>equal(api.v214ReviewGroupKey({label:'Rótulo',reviewGroup:metadata}),null,'Only the finite producer schema can authorize grouping'));
for(const [finding,expected]of [
 [{state:'pending',severity:'error',code:'missing-definition'},true],
 [{state:'pending',severity:'warning',code:'missing-renderer'},true],
 [{state:'pending',severity:'error',code:'table-complex'},true],
 [{state:'pending',severity:'info',code:'table-complex'},false],
 [{state:'pending',severity:'warning',code:'table-dynamic'},false],
 [{state:'resolved',severity:'error',code:'missing-definition'},false],
 [{state:'ignored',severity:'warning',code:'warning'},false]
])test('only current unresolved actionable findings '+JSON.stringify(finding),()=>equal(api.v214ReviewFindingVisible(finding),expected,'Informational preservation notes and old results do not crowd the current review, while errors remain visible'));
const footerAdvisory='Bloco final com predefinição sem função confirmada. A ordem foi preservada. Use a conferência de destinos ou reveja o bloco.';
for(const [finding,expected]of [
 [{domain:'local',code:'warning',state:'pending',message:footerAdvisory},false],
 [{domain:'local',code:'warning',state:'pending',severity:'error',message:footerAdvisory},true],
 [{domain:'references',code:'warning',state:'pending',message:footerAdvisory},true],
 [{domain:'local',code:'warning',state:'pending',message:footerAdvisory+' Outro erro ainda precisa de revisão.'},true],
 [{domain:'local',code:'warning',state:'pending',message:'Parâmetro fora do catálogo de Info/Medicamento: dose. Valor preservado.'},true],
 [{domain:'local',code:'warning',state:'pending',message:'Parâmetro de citação fora do catálogo: campo_invalido em Citar periódico.'},true]
])test('finite footer advisory boundary '+JSON.stringify(finding),()=>equal(api.v214ReviewFindingVisible(finding),expected,'Only the exact noncritical local preservation advisory is quiet'));
for(const key of ['vauthors','vautores','veditors','veditores'])for(const names of ['Silva JR, Santos MC','Silva JR; Santos MC'])test('accepted Vancouver representation '+key+' '+names,()=>{
 const before='Texto.<ref>{{Citar periódico|titulo=Fonte literal|url=https://example.test/fonte|'+key+'='+names+'}}</ref>\n{{Referências}}\n',result=api.calculate({kind:'adjust',source:before,options:cfg});
 equal(result.suggestions.some(proposal=>proposal.label.startsWith('Separar uma lista de autores')),false,'Accepted Vancouver fields are not offered as personal-author rewrites');equal(result.text.includes(names),true,'Names, separators and order are preserved');equal(result.text.includes('autor2='),false,'The author representation is not converted to numbered authors');equal(result.text.includes('editor2='),false,'The editor representation is not converted to numbered editors');
});
for(const key of ['autor','autores','editor','editores'])test('ordinary author list offers remain available '+key,()=>{
 const before='Texto.<ref>{{Citar periódico|titulo=Fonte literal|url=https://example.test/fonte|'+key+'=Silva JR, Santos MC}}</ref>\n{{Referências}}\n',result=api.calculate({kind:'adjust',source:before,options:cfg});
 equal(result.suggestions.some(proposal=>proposal.label.startsWith('Separar uma lista de autores')),true,'The established ordinary author-list review remains available');
});
test('a malformed field next to accepted Vancouver authors remains visible',()=>{
 const before='Texto.<ref>{{Citar periódico|titulo=Fonte literal|url=https://example.test/fonte|vautores=Silva JR, Santos MC|vautores_invalido=Texto literal}}</ref>\n{{Referências}}\n',result=api.calculate({kind:'adjust',source:before,options:cfg});
 equal(result.suggestions.some(proposal=>proposal.reviewGroup?.parameter==='vautores_invalido'),true,'An unknown author parameter is still an actual parameter review');equal(result.text.includes('vautores_invalido=Texto literal'),true,'Unknown nonempty field content is preserved');
});
test('grouped choices still apply to only the selected citation',()=>{
 const result=api.calculate({kind:'adjust',source,options:cfg}),groups=api.v214ReviewGroups(result.suggestions),proposal=groups[0].proposals[2],choice=proposal.choices.findIndex(row=>row.label==='Remover o parâmetro e o seu valor'),after=api.applySuggestion(source,proposal,choice);
 equal(choice>=0,true,'The native removal choice is still present');equal(after.slice(0,proposal.start),source.slice(0,proposal.start),'Earlier citations remain literal');equal(after.slice(proposal.start+proposal.choices[choice].after.length),source.slice(proposal.end),'Later citations remain literal');equal(after.includes('parametro_desconhecido=valor 2'),false,'Only the selected parameter is removed');equal(after.includes('outro_parametro_desconhecido=outro 2'),true,'Its sibling parameter remains untouched');
});
const directory=path.resolve(process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2140');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'ui_report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;

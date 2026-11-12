'use strict';
// Expected heading roles are pinned to the complete native source audit:
// Referências63785697, Notas59102402, Reflist56151616,
// Listanota59274856, RodapéNota59088168, combined73218466,
// heading helper72474006. This test never treats an unknown name as an alias.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),raw=fs.readFileSync(file),api=require(file),sha=s=>crypto.createHash('sha256').update(s).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;const rows=[];
function check(value,message){checks++;assert(value,message);}
function equal(a,b,message){checks++;assert.deepEqual(a,b,message);}
function direct(id,source,expected,options={}){
 const o={...cfg,...options},plan=api.v2217ReferencePlan(source,o);
 equal(plan.text,expected,id+' exact endpoint');check(api.v2217ReferenceProof(source,plan.text,plan,o),id+' replay proof');
 equal(api.v2217ReferencePlan(plan.text,o).text,plan.text,id+' idempotence');equal(api.v2217ReferenceProjection(source,o),plan.text,id+' projection');
 check(!api.v2217ReferenceProof(source,plan.text+'unrelated',plan,o),id+' unrelated mutation rejected');
 rows.push({id,sourceSha256:sha(source),outputSha256:sha(plan.text),changed:source!==plan.text});return plan;
}
function numeric(id,source,expected,options={}){const edits=api.v2216ReferenceReflistEdits(source,{...cfg,...options});equal(edits.map(e=>e.text),expected,id);rows.push({id,sourceSha256:sha(source),replacementCount:edits.length});}
const prefix='Texto.<ref>Fonte.</ref>\n\n',heading=(n,label)=>'='.repeat(n)+' '+label+' '+'='.repeat(n),labels=['Fontes','Sources','Fuentes','Quellen','出典','المراجع','Источники','Obras consultadas'],gaps=['','Texto explicativo.\n','* Item explicativo.\n','[[Ficheiro:Example.jpg|miniatura|Legenda.]]\n','{|\n| Conteúdo da tabela\n|}\n','<!-- comentário -->\n[[Categoria:Exemplos|chave]]\n'];
for(const label of labels)for(let level=1;level<=6;level++)for(const gap of gaps)for(const renderer of ['{{Reflist}}','<references/>','<references></references>']){
 const before=prefix+heading(level,label)+'\n'+gap;
 direct('retained-owner-'+rows.length,before+renderer+'\n',before+'{{Referências|nível=0}}\n');
}
for(let level=1;level<=6;level++){
 const h=heading(level,'Referências'),source=prefix+h+'\n{{Reflist}}\n',target=level===1||level===6?h+'\n{{Referências|nível=0}}':'{{Referências'+(level===2?'':'|nível='+level)+'}}';
 direct('canonical-outer-level-'+level,source,prefix+target+'\n');
 if(level>=2&&level<=5){const child=heading(Math.min(6,level+1),'Citações');direct('canonical-empty-child-'+level,prefix+h+'\n'+child+'\n{{Reflist}}\n',prefix+target+'\n');}
 direct('canonical-with-prose-'+level,prefix+h+'\nIntrodução da lista.\n{{Reflist}}\n',prefix+h+'\nIntrodução da lista.\n{{Referências|nível=0}}\n');
 direct('canonical-category-gap-'+level,prefix+h+'\n<!-- comentário -->\n[[Categoria:Exemplos]]\n<references/>\n',prefix+h+'\n<!-- comentário -->\n[[Categoria:Exemplos]]\n{{Referências|nível=0}}\n');
 numeric('numeric-canonical-retained-'+level,prefix+h+'\n{{Reflist|2}}\n',['{{Referências|nível=0}}']);
}
direct('later-bibliography-kept',prefix+'== Fontes ==\n{{Reflist}}\n\n== Referências ==\n* Obra.\n',prefix+'== Fontes ==\n{{Referências|nível=0}}\n\n== Referências ==\n* Obra.\n');
direct('nested-real-sections',prefix+'== Documentos ==\nIntrodução.\n=== Fontes ===\nExplicação.\n{{Reflist}}\n',prefix+'== Documentos ==\nIntrodução.\n=== Fontes ===\nExplicação.\n{{Referências|nível=0}}\n');
direct('standalone-default',prefix+'{{Reflist}}\n',prefix+'{{Referências}}\n');
for(let level=1;level<=6;level++)for(const gap of ['', 'Explicação.\n','* Item.\n']){
 const before=prefix+'<h'+level+' id="fontes" class="seção" title="a > b">Fontes</h'+level+'>\n'+gap;
 direct('html-owner-'+rows.length,before+'{{Reflist}}\n',before+'{{Referências|nível=0}}\n');
 numeric('numeric-html-owner-'+rows.length,before+'{{Reflist|2}}\n',['{{Referências|nível=0}}']);
}
for(const renderer of ['{{Reflist|2}}','{{Reflist|30em}}','{{Reflist|colwidth=40em}}','{{Reflist|nível=0}}','{{Referências|nível=0}}','{{Referências|nivel=3}}','{{Referências|3=4}}','{{Reflist|unknown=conteúdo}}']){const source=prefix+'== Fontes ==\n'+renderer+'\n';direct('custom-interface-preserved-'+rows.length,source,source);}
const grouped='Texto.<ref group="x" name="a">Fonte.</ref>\n\n== Fontes ==\n';
direct('group-bank',grouped+'{{Reflist|group=x|refs=<ref name="b" group="x">Outra fonte.</ref>}}\n',grouped+'{{Referências|grupo=x|refs=<ref name="b" group="x">Outra fonte.</ref>|nível=0}}\n');
direct('native-custom-group',grouped+'<references group="x"/>\n',grouped+'{{Referências|grupo=x|nível=0}}\n');
direct('native-note-group','Texto.<ref group="nota">Nota.</ref>\n\n== Fontes ==\n<references group="nota"/>\n','Texto.<ref group="nota">Nota.</ref>\n\n== Fontes ==\n{{Referências|grupo=nota|nível=0}}\n');
direct('notes-label-not-renamed','Texto.<ref group="nota">Nota.</ref>\n\n=== Notas ===\n{{Reflist|group=nota}}\n','Texto.<ref group="nota">Nota.</ref>\n\n=== Notas ===\n{{Referências|grupo=nota|nível=0}}\n');
for(const [provider,hasHeading]of [['{{Referências}}',true],['{{References}}',true],['{{Listaref}}',true],['{{Notas}}',true],['{{Notas e referências}}',true],['{{Referências|nível=3}}',true],['{{Referências|3=0}}',false],['{{Referências|2=0}}',true],['{{Referências|nivel=0}}',true],['{{Notas|2=0}}',false],['{{Notas|nivel=0}}',true],['{{Notas e referências|nível=0}}',true],['{{Esconder link para editar seção|Cabeçalho|3}}',true],['{{Widget desconhecido}}',true]]){
 const source=provider+'\nExplicação.<ref>Fonte.</ref>\n{{Reflist}}\n';
 direct('implicit-provider-'+rows.length,source,(['{{References}}','{{Listaref}}'].includes(provider)?'{{Referências}}':provider)+'\nExplicação.<ref>Fonte.</ref>\n{{Referências'+(hasHeading?'|nível=0':'')+'}}\n');
}
for(const provider of ['{{Reflist}}','<references/>','{{Reflist|group=x}}']){
 const source='Texto.<ref>Primeira.</ref>\n'+provider+'\nMais texto.<ref>Segunda.</ref>\n{{Reflist}}\n',first=provider==='{{Reflist}}'?'{{Referências}}':provider==='<references/>'?'{{Referências}}':'{{Referências|grupo=x}}';
 direct('prior-unheaded-frame-'+rows.length,source,'Texto.<ref>Primeira.</ref>\n'+first+'\nMais texto.<ref>Segunda.</ref>\n{{Referências|nível=0}}\n');
}
for(const source of ['<nowiki>== Fontes ==\n{{Reflist}}</nowiki>','<pre>== Fontes ==\n{{Reflist}}</pre>','<syntaxhighlight lang="wikitext">== Fontes ==\n{{Reflist}}</syntaxhighlight>','<math>== Fontes ==\n{{Reflist}}</math>','{{Caixa|1=\n== Fontes ==\n{{Reflist}}\n}}','{|\n|\n== Fontes ==\n{{Reflist}}\n|}','<ref>== Fontes ==\n{{Reflist}}</ref>','<nowiki><h3 id="a">Fontes</h3>\n{{Reflist}}</nowiki>','<ref><h3>Fontes</h3>\n{{Reflist}}</ref>','{{Caixa|<h3>Fontes</h3>\n{{Reflist}}}}','{|\n|<h3>Fontes</h3>\n{{Reflist}}\n|}'])direct('protected-or-nested-'+rows.length,source,source);
for(const fake of ['<nowiki>== Fontes ==</nowiki>','<nowiki><h3>Fontes</h3></nowiki>','<ref><h3>Fontes</h3></ref>','{|\n|<h3>Fontes</h3>\n|}','<h3 title="a > b">Fontes','{{Caixa|1=<h3>Fontes</h3>}}']){
 const source=fake+'\nTexto.<ref>Fonte.</ref>\n{{Reflist}}\n',p=api.v2217ReferencePlan(source,cfg);check(!p.text.includes('{{Referências|nível=0}}')||fake.startsWith('{{Caixa'),'nested/partial heading not accepted as real top-level owner');rows.push({id:'fake-owner-'+rows.length,sourceSha256:sha(source),outputSha256:sha(p.text)});
}
for(const raw of ['{{Reflist|30em}}','{{Reflist|2|nível=0}}','{{Reflist|2|refs=<ref name="a">Fonte.</ref>}}','{{Reflist|2|group={{Grupo}}}}','{{Reflist|0}}','{{Reflist|100}}'])numeric('numeric-unsupported-'+rows.length,prefix+'== Fontes ==\n'+raw+'\n',[]);
for(const [head,group]of [['Reflist',''],['Notelist','lower-alpha'],['Listanota','lower-alpha'],['NoteFoot','nota'],['Notefoot','nota'],['RodapéNota','nota']])for(let level=1;level<=6;level++){
 const call='{{'+head+'}}',source='Texto.<ref group="'+(group||'x')+'">Fonte.</ref>\n'+heading(level,'Fontes')+'\nExplicação.\n'+call,start=source.lastIndexOf(call),row={start,end:source.length,raw:call,head,entries:[],group,kind:group?'notes':'references'},target=group?'{{Notas'+(!['nota','lower-alpha'].includes(group)?'|grupo='+group:'')+'}}':'{{Referências}}',owned=api.v2217ReferenceOwnedCollectorEdit(source,row,start,target,cfg);
 equal(owned,{start,target:target.slice(0,-2)+'|nível=0}}'},'exact native unheaded alias ownership '+head+'/'+level);rows.push({id:'native-alias-owner-'+head+'-'+level,sourceSha256:sha(source),outputSha256:sha(owned.target)});
}
for(const raw of ['{{Referências}}','{{Listaref}}','{{Notas}}']){
 const source=prefix+'=== Fontes ===\nProsa.\n'+raw,scan=api.v2215ReferenceCollectorRows(source).rows,row=scan.find(r=>r.raw===raw),owned=api.v2217ReferenceOwnedCollectorEdit(source,row,row.start,raw,cfg);equal(owned,{start:row.start,target:raw},'already headed native widget remains headed');
}
for(const options of [{headings:false},{automaticReferenceCollectorHeadings:false}]){
 direct('headings-disabled-'+rows.length,prefix+'== Fontes ==\n{{Reflist}}\n',prefix+'== Fontes ==\n{{Referências|nível=0}}\n',options);
 const source='Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n{{Notas}}\n{{Referências}}\n',p=api.v2217ReferencePlan(source,{...cfg,...options});check(!p.text.includes('{{Notas e referências'),'disabled new composite headings');
 const grouped='Texto.<ref group="x">Nota.</ref>\n== Notas ==\n{{Reflist|group=x}}\n',g=api.v2215ReferenceSingleGroupPlan(grouped,{...cfg,...options});check(g.text===grouped||g.text.includes('group="nota"')&&g.text.includes('{{Notas|nível=0}}'),'single group operation atomic');
}
for(let level=1;level<=6;level++){
 const h=heading(level,'Referências'),source=prefix+h+'\nTexto explicativo.\n',p=api.v221MissingDefaultCollectorPlan(source,cfg);if(level===1){equal(p.text,source,'existing H1 missing-collector prerequisite preserved');continue;}check(p.edits.length===1,'existing missing-collector eligibility retained');check(p.text.includes(h+'\nTexto explicativo.'),'existing owner and prose intact');check(p.text.includes('{{Referências|nível=0}}'),'missing default append is headless under owner');check(api.v221MissingDefaultCollectorProof(source,p.text,p,cfg),'source-bound missing collector replay');rows.push({id:'missing-default-owner-'+level,sourceSha256:sha(source),outputSha256:sha(p.text)});
}
// Empty canonical chains cannot cross a sibling/closing boundary. These
// expectations preserve the complete original outline rather than blessing
// a stable but reparented generated heading.
for(const levels of [[3,2],[5,3],[2,2],[3,3],[2,3,2],[2,4,3],[2,3,3],[2,4,5,3]])for(const renderer of ['{{Reflist}}','<references/>']){
 const chain=levels.map((n,i)=>heading(n,i===0?'Referências':'Citações')).join('\n'),source=prefix+'== Obras ==\n'+chain+'\n'+renderer+'\n';
 direct('non-nested-chain-'+rows.length,source,prefix+'== Obras ==\n'+chain+'\n{{Referências|nível=0}}\n');
}
for(const levels of [[3,2],[2,2],[2,4,3]]){
 const chain=levels.map((n,i)=>heading(n,i===0?'Referências':'Citações')).join('\n'),source=prefix+chain+'\n{{Reflist|30em}}\n';direct('width-chain-no-sibling-loss-'+rows.length,source,source);
}
for(const container of ['div','section','article','main','aside','header','footer','nav'])for(const label of ['<h3 title="a > b" id="literal">Fontes</h3>','\n=== Fontes ===\n']){
 const before='<'+container+' class="bloco">'+label+'</'+container+'>\nTexto.<ref>Fonte.</ref>\n';direct('transparent-complete-owner-'+rows.length,before+'{{Reflist}}\n',before+'{{Referências|nível=0}}\n');
}
for(const container of ['pre','nowiki','syntaxhighlight','poem','blockquote','ref']){
 const source='<'+container+'><h3>Fontes</h3></'+container+'>\nTexto.<ref>Fonte.</ref>\n{{Reflist}}\n',p=api.v2217ReferencePlan(source,cfg);check(!p.text.includes('{{Referências|nível=0}}'),'literal/quotation HTML ancestors excluded');rows.push({id:'nontransparent-owner-'+container,sourceSha256:sha(source),outputSha256:sha(p.text)});
}
for(const fake of ['<div title="a\n=== Fontes ===\nb">Conteúdo.</div>','<div title="<h3>Fontes</h3>">Conteúdo.</div>','<section title="a > b">Conteúdo.</section>','<div><h3>Fontes</h3>']){
 const source=fake+'\nTexto.<ref>Fonte.</ref>\n{{Reflist}}\n',p=api.v2217ReferencePlan(source,cfg);check(!p.text.includes('{{Referências|nível=0}}'),'no heading from attributes/partial wrapper');rows.push({id:'fake-html-owner-'+rows.length,sourceSha256:sha(source),outputSha256:sha(p.text)});
}
const notesPrefix='Texto.<ref group="nota">Nota.</ref><ref>Fonte.</ref>\n',customPrefix='Texto.<ref group="x">Nota.</ref><ref>Fonte.</ref>\n',combinedPositives=[
 [notesPrefix+'{{Notas}}\n{{Reflist|2}}\n',notesPrefix+'{{Notas e referências}}\n'],
 [notesPrefix+'{{Notas}}\n{{Reflist}}\n',notesPrefix+'{{Notas e referências}}\n'],
 [notesPrefix+'{{Notas}}\n{{Referências}}\n',notesPrefix+'{{Notas e referências}}\n'],
 [notesPrefix+'== Notas ==\n{{Notas}}\n== Referências ==\n{{Reflist|2}}\n',notesPrefix+'{{Notas e referências}}\n'],
 [customPrefix+'== Notas ==\n{{Reflist|group=x}}\n{{Reflist}}\n',notesPrefix+'{{Notas e referências}}\n'],
 [customPrefix+'== Notas ==\n<references group="x"/>\n<references/>\n',notesPrefix+'{{Notas e referências}}\n'],
 [customPrefix+'{{Notas|grupo=x}}\n{{References}}\n',notesPrefix+'{{Notas e referências}}\n'],
 ['Texto.<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n{{Notelist}}\n{{Reflist}}\n','Texto.<ref group="lower-alpha">Nota.</ref><ref>Fonte.</ref>\n{{Notas e referências}}\n']
];
for(const [source,expected]of combinedPositives){
 const p=direct('atomic-existing-combination-'+rows.length,source,expected),step=p.steps.find(s=>s.name==='atomic-existing-collector-combination');check(!!step,'actual atomic stage executes');check(step.edits.length===1,'one source-bound final atomic delta');
 const witness=step.edits[0].witness;check(witness.nativeCombinedOldid===73218466,'current combined group contract');check(witness.sourceHash===p.sourceHash,'original source witness');check(witness.originalCollectors.length===2,'exact two original providers');
 check(witness.steps.some(s=>s.name.endsWith('unified-notes-references')),'retained merge producer trace');
 const tampered=JSON.parse(JSON.stringify(p));tampered.steps.find(s=>s.name==='atomic-existing-collector-combination').edits[0].witness.nativeCombinedOldid=0;check(!api.v2217ReferenceProof(source,p.text,tampered,cfg),'atomic witness tampering rejected');
}
const atomicNegatives=[
 notesPrefix+'{{Notas|nível=0}}\n{{Reflist|2}}\n',notesPrefix+'{{Notas}}\n{{Referências|nível=0}}\n',notesPrefix+'{{Notas|nivel=0}}\n{{Reflist|2}}\n',
 notesPrefix+'{{Notas}}\n{{Reflist|2|nível=0}}\n',notesPrefix+'{{Notas}}\n{{Reflist|30em}}\n',notesPrefix+'{{Notas}}\n{{Reflist|2|refs=<ref name="a">Fonte.</ref>}}\n',notesPrefix+'{{Notas}}\n{{Reflist|unknown=valor}}\n',
 notesPrefix+'== Fontes ==\n{{Notas}}\n{{Reflist|2}}\n',notesPrefix+'== Notas ==\nProsa preservada.\n{{Notas}}\n{{Reflist|2}}\n',notesPrefix+'{{Notas}}\nProsa preservada.\n{{Reflist|2}}\n',notesPrefix+'<h2>Notas</h2>\n{{Notas}}\n{{Reflist|2}}\n',
 notesPrefix+'=== Notas ===\n{{Notas}}\n{{Reflist|2}}\n',notesPrefix+'====== Notas ======\n{{Notas}}\n{{Reflist|2}}\n',notesPrefix+'{{Notas}}\n=== Referências ===\n{{Reflist|2}}\n',notesPrefix+'{{Notes}}\n{{Reflist|2}}\n',notesPrefix+'{{Notas}}\n{{REFERÊNCIAS}}\n',notesPrefix+'{{Notas}}\n{{Reflist}}\n{{Reflist}}\n',
 'Texto.<ref group="x">Nota.</ref><ref group="y">Outra.</ref><ref>Fonte.</ref>\n== Notas ==\n{{Reflist|group=x}}\n{{Reflist}}\n',notesPrefix+'{{Notas}}\n<!-- comentário retido -->\n{{Reflist}}\n',
 '{{Caixa|1=\n'+notesPrefix+'{{Notas}}\n{{Reflist|2}}\n}}',notesPrefix+'{|\n|{{Notas}}\n{{Reflist|2}}\n|}'
];
for(const source of atomicNegatives){equal(api.v2217ReferenceAtomicCombinedEdits(source,cfg),[],'unproved atomic combination declined');const p=api.v2217ReferencePlan(source,cfg);check(!p.steps.some(s=>s.name==='atomic-existing-collector-combination'),'no hidden atomic stage');check(!p.text.includes('{{Notas e referências}}'),'no unsupported fixed hierarchy');if(source.includes('Prosa preservada.'))check(p.text.includes('Prosa preservada.'),'prose preserved after local decline');rows.push({id:'atomic-scope-negative-'+rows.length,sourceSha256:sha(source),outputSha256:sha(p.text)});}
for(const options of [{headings:false},{automaticReferenceCollectorHeadings:false},{unifiedNotesReferences:false},{references:false}])equal(api.v2217ReferenceAtomicCombinedEdits(combinedPositives[0][0],{...cfg,...options}),[],'atomic configured scope retained');
// Independent evaluator restricted to these literal synthetic fixtures. Its
// role/level behavior comes from the audited provider bodies, not the engine's
// owner scanner; in particular native nível6 must evaluate to H2.
function fixtureOutline(source){
 const out=[];
 for(const m of source.matchAll(/^(={1,6})[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*$/gm))out.push({at:m.index,level:m[1].length,title:m[2].trim()});
 for(const m of source.matchAll(/<h([1-6])\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/h\1\s*>/gi))out.push({at:m.index,level:Number(m[1]),title:m[3]});
 for(const m of source.matchAll(/\{\{((?:[Rr]eferências|[Rr]eferencias|[Rr]eferência|[Rr]eferencia|[Rr]eferences|[Ll]istaref|[Rr]éférences|[Nn]otas e referências|[Nn]otas))([^{}]*)\}\}/g)){
  const name=m[1][0].toUpperCase()+m[1].slice(1),fields=new Map();let pos=1;
  for(const part of m[2].split('|').slice(1)){const f=/^\s*([^=]+?)\s*=([\s\S]*)$/.exec(part);if(f)fields.set(f[1],f[2].trim());else fields.set(String(pos++),part.trim());}
  if(name==='Notas e referências'){out.push({at:m.index,level:2,title:'Notas e referências'},{at:m.index+0.1,level:3,title:'Notas'},{at:m.index+0.2,level:3,title:'Referências'});continue;}
  const notes=name==='Notas',visible=fields.get('nível')??fields.get(notes?'2':'3');if(visible==='0')continue;
  const value=fields.get('nível')??fields.get('2'),level=/^[1-5]$/.test(value||'')?Number(value):2,title=fields.get('título')??fields.get('1')??(notes?'Notas':'Referências');out.push({at:m.index,level,title});
 }
 return out.sort((a,b)=>a.at-b.at).map(({level,title})=>({level,title}));
}
equal(fixtureOutline('=== Fontes ===\n{{Referências|nível=6}}'),[{level:3,title:'Fontes'},{level:2,title:'Referências'}],'native evaluator does not bless unsupported level6');
equal(fixtureOutline('{{Referências|3=0}}\n{{Notas|2=0}}\n{{Notas e referências|nível=0}}'),[{level:2,title:'Notas e referências'},{level:3,title:'Notas'},{level:3,title:'Referências'}],'effective suppression contract and fixed composite');
// Actual full actions exercise every producer family and two subsequent passes.
// Syntax-only repairs can be deferred, but no application may add a heading.
const whole=[];
for(const renderer of ['{{Reflist|2}}','{{Reflist}}','<references/>'])for(const spec of [{label:'Fontes',level:2,gap:''},{label:'Referências',level:3,gap:'Explicação.\n'},{label:'Referências',level:6,gap:''},{label:'Fontes',level:3,gap:'[[Ficheiro:Example.jpg|miniatura|Legenda]]\n'}]){
 const h=heading(spec.level,spec.label),source='Texto.<ref name="a">Fonte.</ref>\n\n'+h+'\n'+spec.gap+renderer+'\n\n== Bibliografia ==\n* Obra bibliográfica.\n';whole.push({id:'whole-owner-'+whole.length,source,manual:[h,'== Bibliografia =='],renderer});
}
whole.push({id:'whole-html',source:'Texto.<ref>Fonte.</ref>\n<h3 id="fontes" title="a > b">Fontes</h3>\nExplicação.\n{{Reflist}}\n',manual:['<h3 id="fontes" title="a > b">Fontes</h3>']});
whole.push({id:'whole-missing',source:prefix+'== Referências ==\nExplicação.\n',manual:['== Referências ==']});
whole.push({id:'whole-implicit',source:'Texto.<ref>A.</ref>\n{{Referências}}\nExplicação.<ref>B.</ref>\n{{Reflist}}\n',manual:['{{Referências}}'],implicit:true});
for(const levels of [[3,2],[2,2],[2,4,3]]){const hs=['== Obras ==',...levels.map((n,i)=>heading(n,i===0?'Referências':'Citações'))];whole.push({id:'whole-sibling-outline-'+whole.length,source:prefix+hs.join('\n')+'\n{{Reflist}}\n',manual:hs});}
whole.push({id:'whole-transparent-owner',source:'<div><h3>Fontes</h3></div>\nTexto.<ref>Fonte.</ref>\n{{Reflist}}\n',manual:['<div><h3>Fontes</h3></div>']});
for(const fixture of whole){let source=fixture.source;const outputs=[];for(let pass=0;pass<3;pass++){
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg}});calculations++;check(typeof result.text==='string','whole endpoint is text');check(api.v219AutomaticResultSafety(source,result).accepted,fixture.id+' pass accepted');outputs.push(result.text);
 for(const h of fixture.manual)check(result.text.includes(h),fixture.id+' exact retained manual owner');equal(fixtureOutline(result.text),fixtureOutline(fixture.source),fixture.id+' effective source outline preserved');
 const count=(result.text.match(/\{\{\s*(?:Reflist|Referências|Notas e referências)\b|<references\b/gi)||[]).length;equal(count,fixture.implicit?2:1,fixture.id+' exact collector count');
 if(!fixture.implicit&&!result.text.includes(fixture.renderer||'never'))check(result.text.includes('{{Referências|nível=0}}'),fixture.id+' migrated/added widget has no extra heading');
 if(fixture.implicit)check(result.text.includes('{{Referências|nível=0}}'),fixture.id+' later widget headless');source=result.text;
 }equal(outputs[1],outputs[2],fixture.id+' third pass stable');rows.push({id:fixture.id,sourceSha256:sha(fixture.source),outputSha256:sha(outputs[0]),secondOutputSha256:sha(outputs[1]),firstPassIdempotence:outputs[0]===outputs[1]});}
for(const [source,expected]of combinedPositives){
 let current=source,second=null;for(let pass=0;pass<3;pass++){const result=api.calculate({kind:'adjust',source:current,originalSource:current,options:{...cfg}});calculations++;check(api.v219AutomaticResultSafety(current,result).accepted,'actual atomic combination endpoint accepted');equal(result.text.trim(),expected.trim(),'actual existing combination survives full pipeline');if(pass===1)second=result.text;if(pass===2)equal(result.text,second,'actual atomic third pass stable');current=result.text;}
}
for(const source of atomicNegatives){
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg}});calculations++;check(api.v219AutomaticResultSafety(source,result).accepted,'actual negative source retains safe local action');check(!result.text.includes('{{Notas e referências}}'),'actual unsupported combination never inserted');if(source.includes('Prosa preservada.'))check(result.text.includes('Prosa preservada.'),'actual local decline retains prose');if(source.includes('|nível=0'))check(result.text.includes('|nível=0'),'actual caller level retained');if(source.includes('|nivel=0'))check(result.text.includes('|nivel=0'),'actual unaccented caller field retained');
 if(!source.includes('{{Caixa')&&!source.includes('{|')&&!source.includes('{{Notes}}')&&!source.includes('{{REFERÊNCIAS}}')){let expected=fixtureOutline(source);if(source===notesPrefix+'{{Notas|nível=0}}\n{{Reflist|2}}\n')expected=[{level:2,title:'Referências'}];else if(source===notesPrefix+'=== Notas ===\n{{Notas}}\n{{Reflist|2}}\n')expected=[{level:3,title:'Notas'}];equal(fixtureOutline(result.text),expected,'actual negative effective outline, only exact intentional standalone/empty-fold exceptions');}
}
check(fs.readFileSync(file).equals(raw),'runtime remains byte exact');const report={kind:'native-renderer-containing-section-integrity-property',version:'2.21.7',bundle:path.basename(file),bundleSha256:sha(raw),nativeContractAuditSha256:'be2f5c6bf41450ebd25cffa920364c1e4ddbfe71d7b9b80a61ef15bc7a2c784b',cases:rows.length,checks,calculations,rows,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cases:rows.length,checks,calculations}));

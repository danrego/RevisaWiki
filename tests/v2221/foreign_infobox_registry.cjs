'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=path.resolve(__dirname,'../../src/v2_22_1/foreign_infobox_registry.js'),source=fs.readFileSync(file,'utf8');
const names=[...source.matchAll(/^function (v2221Infobox\w+)\(/gm)].map(x=>x[1]);
const api=vm.runInNewContext(source+'\n({'+names.join(',')+'})',{}, {filename:file});
let cases=0,checks=0;const results=[];
function equal(actual,expected,label){checks++;assert.deepEqual(JSON.parse(JSON.stringify(actual)),JSON.parse(JSON.stringify(expected)),label);}
function ok(value,label){checks++;assert(value,label);}
function test(name,fn){fn();cases++;results.push(name);}
function clone(value){return JSON.parse(JSON.stringify(value));}
const hash='a'.repeat(64),pin={revision:100,sha256:hash};
function field(target,extra={}){return {target,transform:'identity',evidence:{status:'verified',role:'fixture.scalar.'+target,sourceConsumed:true,targetConsumed:true,semantics:'equivalent'},...extra};}
function record(wiki='en',title='Template:Infobox fixture',id=wiki+':fixture'){
 return {id,state:'active',source:{wiki,title,aliases:[],...pin},target:{wiki:'pt',title:'Predefinição:Info/Registro',...pin,accepted:['nome','data_nascimento','local_nascimento','imagem','legenda','texto','vazio','subcaixa','1','2']},proof:{kind:'native-contract',defaults:'equivalent',suppressions:'equivalent',aliasPrecedence:'equivalent',dynamic:'absent',embedding:'standalone'},fields:{name:field('nome'),birth_place:field('local_nascimento'),image:field('imagem'),caption:field('legenda'),text:field('texto'),blank:field('vazio'),child:field('subcaixa')}};
}
function catalog(rows=[record()]){return {schema:1,snapshotId:'fixture-snapshot',nativeAliases:[{title:'Info/Registro',aliases:['Infocaixa nativa'],...pin}],records:rows};}
function sourceEvidence(role){return {status:'verified',role,sourceConsumed:true,semantics:'equivalent'};}
function dateCompound(){return {id:'birth-components',target:'data_nascimento',transform:'date-parts-to-dmy',sources:['year','month','day'].map(component=>({key:'birth_'+component,component,evidence:sourceEvidence('person.birth.'+component)})),evidence:{status:'verified',role:'person.birth.date',targetConsumed:true,semantics:'equivalent'},transformEvidence:{calendar:'gregorian',target:'gregorian-pt-long-date',partial:'reject',age:false,categorySideEffects:false}};}
function nativeRecord(){
 const row=record('pt','Predefinição:Info/Registro','pt:repair');row.mode='native-repair';row.source.aliases=['Infocaixa nativa'];row.fields={nome:field('nome'),name:field('nome')};row.fields.name.evidence.sourceConsumed=false;
 row.fields.name.foreignEvidence=[{wiki:'en',title:'Template:Infobox fixture',key:'name',...pin,role:row.fields.name.evidence.role,consumed:true,semantics:'equivalent'}];
 row.proof.nativeRepair={status:'verified',originIndependent:true,unconsumedKeys:['name'],nativeReader:{status:'verified',coverage:'complete',forwarding:'resolved',lua:'resolved',...pin}};return row;
}
function wrapperRecord(){
 const row=record('pt','Predefinição:Info/Legacy','pt:wrapper');row.mode='native-wrapper';row.source.revision=200;row.source.sha256='b'.repeat(64);row.fields={name:field('nome')};
 row.proof.nativeWrapper={status:'verified',originIndependent:true,unconsumedKeys:[],sourceReader:{status:'verified',coverage:'complete',forwarding:'resolved',lua:'absent',revision:200,sha256:'b'.repeat(64)},targetReader:{status:'verified',coverage:'complete',forwarding:'resolved',lua:'resolved',...pin}};return row;
}
function wrapperCatalog(rows=[wrapperRecord()]){const c=catalog(rows);c.nativeAliases.push({title:'Info/Legacy',aliases:[],revision:200,sha256:'b'.repeat(64)});return c;}
function migrate(raw,cat=catalog(),context={}){return api.v2221InfoboxMigrate(raw,cat,context);}
function converted(raw,wanted,cat=catalog(),context={}){const plan=migrate(raw,cat,context);equal(plan.status,'converted');equal(plan.text,wanted);ok(api.v2221InfoboxProof(raw,wanted,plan,cat,context));equal(migrate(wanted,cat,context).text,wanted);return plan;}
function preserved(raw,cat=catalog(),context={},status){const plan=migrate(raw,cat,context);equal(plan.text,raw);equal(plan.count,0);equal(plan.edits,[]);if(status)equal(plan.status,status);return plan;}

test('all six source editions require independent explicit contracts',()=>{
 const titles={en:'Template:Infobox fixture',es:'Plantilla:Ficha de prueba',fr:'Modèle:Infobox essai',de:'Vorlage:Infobox Probe',ca:'Plantilla:Infotaula prova',it:'Template:Infobox prova'};
 for(const[wiki,title]of Object.entries(titles)){const r=record(wiki,title);converted('{{'+title+'|name=Subject}}','{{Info/Registro|nome=Subject}}',catalog([r]),{sourceWiki:wiki});}
});
test('image field guards preserve unsupported wrappers and require dependent nonempty caption',()=>{
 const r=record();r.preconditions={bareFileKeys:['image'],requiresNonemptyWhenPresent:{image:['caption']}};
 converted('{{Infobox fixture|name=A|image=Example.jpg|caption=Caption <ref name="R"/>}}','{{Info/Registro|nome=A|imagem=Example.jpg|legenda=Caption <ref name="R"/>}}',catalog([r]));
 converted('{{Infobox fixture|name=A|image= }}','{{Info/Registro|nome=A|imagem= }}',catalog([r]));
 for(const image of ['Example.jpg','File:Example.jpg','[[File:Example.jpg]]','{{image|Example.jpg}}','https://example.invalid/image.jpg','Example.jpg|thumb','Example.exe']){
  const raw='{{Infobox fixture|name=A|image='+image+'}}';preserved(raw,catalog([r]));
  if(image!=='Example.jpg')preserved('{{Infobox fixture|name=A|image='+image+'|caption=Caption}}',catalog([r]));
 }
 for(const value of [null,[],{image:[]},{image:['']},{image:4}]){const row=record();row.preconditions={requiresNonemptyWhenPresent:value};preserved('{{Infobox fixture|name=A}}',catalog([row]),{},'invalid-contract');}
 const row=record();row.preconditions={bareFileKeys:[4]};preserved('{{Infobox fixture|name=A}}',catalog([row]),{},'invalid-contract');
});
test('native aliases precede foreign names even with trusted source edition',()=>{
 const c=catalog([record('en','Template:Infocaixa nativa')]);preserved('{{Infocaixa nativa|name=Subject}}',c,{sourceWiki:'en'},'already-native');
});
test('title identity uses first letter, namespace and underscores, never global case folding',()=>{
 const r=record();r.source.aliases=['Template:Infobox_alias'];converted('{{template:infobox_alias|name=A}}','{{Info/Registro|nome=A}}',catalog([r]));
 preserved('{{INFOBOX fixture|name=A}}',catalog([r]),{},'unmapped');preserved('{{Infobox Fixture|name=A}}',catalog([r]),{},'unmapped');
 equal(api.v2221InfoboxTitle('Mode\u0300le:infobox_essai'),'Infobox essai');
});
test('parameter names and scalar/reference identities remain case and Unicode sensitive',()=>{
 preserved('{{Infobox fixture|Name=A}}');preserved('{{Infobox fixture|name=A|NAME=B}}');
 const value=' A\u0301\u00a0Å <ref name="Re\u0301f">{{citar web|título=Á|url=https://example.invalid/?x=1&y=2}}</ref><ref name="Réf"/> ';
 converted('{{Infobox fixture|name='+value+'}}','{{Info/Registro|nome='+value+'}}');
});
test('all present fields including empty unknown fields must be represented',()=>{
 for(const value of ['',' ','new fact','<ref name="u"/>'])preserved('{{Infobox fixture|name=A|unknown='+value+'}}');
 const r=record();delete r.fields.caption;preserved('{{Infobox fixture|caption=Native ignored data}}',catalog([r]));
 converted('{{Infobox fixture|name=A|blank= }}','{{Info/Registro|nome=A|vazio= }}');
});
test('owner, key and value changes each have exact nonoverlapping raw spans',()=>{
 const r=record();r.fields.birth_date=field('data_nascimento',{transform:'date-ymd-to-dmy',transformEvidence:{source:'gregorian-iso-date',target:'gregorian-pt-long-date',age:false,categorySideEffects:false}});
 const raw='{{ Infobox fixture \n| name = A \n|birth_date=2000-02-29}}',wanted='{{ Info/Registro \n| nome = A \n|data_nascimento=29 de fevereiro de 2000}}',plan=converted(raw,wanted,catalog([r]));
 equal(plan.count,4);equal(plan.edits.map(x=>x.kind),['owner','parameter','parameter','value']);let end=-1;
 for(const edit of plan.edits){equal(raw.slice(edit.start,edit.end),edit.before);ok(edit.start>=end);end=edit.end;equal(edit.count,1);}
});
test('origin ambiguity is preserved unless every plausible contract produces identical plan',()=>{
 const a=record('en'),b=record('it');converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',catalog([a,b]));
 b.fields.name=field('texto');preserved('{{Infobox fixture|name=A}}',catalog([a,b]),{},'ambiguous');
 converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',catalog([a,b]),{sourceWiki:'en'});
 b.state='unresolved';preserved('{{Infobox fixture|name=A}}',catalog([a,b]),{},'unresolved');
 preserved('{{Infobox fixture|name=A}}',catalog([a,b]),{sourceWiki:'pt'},'invalid-context');
});
test('inventory discovery never activates equivalence or fallback migration',()=>{
 for(const state of ['unresolved','unsupported','ambiguous']){const r={id:state,state,source:{wiki:'fr',title:'Modèle:Infobox fixture',aliases:[]},discovery:{qid:'Q1',templateData:true}};preserved('{{Infobox fixture|name=A}}',catalog([r]),{},'unresolved');}
});
test('per-record data faults are isolated while matching faults preserve the affected call',()=>{
 const good=record(),bad=record('it','Template:Other','bad');bad.target.accepted=4;
 converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',catalog([null,3,[],bad,good]));
 bad.source.title=good.source.title;preserved('{{Infobox fixture|name=A}}',catalog([bad,good]),{},'invalid-contract');
 for(const malformed of [null,{},[],{schema:2,records:[]},{schema:1,snapshotId:'s',records:null}])preserved('{{Infobox fixture|name=A}}',malformed,{},'invalid-catalog');
 const c=catalog();c.nativeAliases=[null];converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',c);
 c.nativeAliases=[{title:'Infobox fixture',aliases:[],revision:0,sha256:hash}];preserved('{{Infobox fixture|name=A}}',c,{},'invalid-contract');
});
test('pins, field consumption and default/suppression/alias contracts are activation gates',()=>{
 const mutations=[r=>delete r.source.sha256,r=>r.source.revision=0,r=>r.target.sha256='not-a-hash',r=>r.proof.defaults='unknown',r=>r.proof.suppressions='unknown',r=>r.proof.aliasPrecedence='unknown',r=>r.proof.dynamic='unknown',r=>r.fields.name.evidence.sourceConsumed=false,r=>r.fields.name.evidence.targetConsumed=false,r=>r.fields.name.evidence.semantics='inferred',r=>r.fields.name.evidence.role='',r=>r.fields.name.target='unknown',r=>r.fields.name.transform='execute'];
 for(const mutate of mutations){const r=record();mutate(r);preserved('{{Infobox fixture|name=A}}',catalog([r]),{},'invalid-contract');}
 const a=record(),b=clone(a);preserved('{{Infobox fixture|name=A}}',catalog([a,b]),{},'invalid-contract');
});
test('JSON contracts reject accessors, cycles, sparse arrays and executable data',()=>{
 let reads=0;const r=record();Object.defineProperty(r,'unsafe',{enumerable:true,get(){reads++;return 'no';}});preserved('{{Infobox fixture|name=A}}',catalog([r]));equal(reads,0);
 for(const mutate of [r=>r.cycle=r,r=>r.fn=()=>{},r=>r.fields.name.values=new Date(),r=>r.source.aliases=Array(2)]){const row=record();mutate(row);preserved('{{Infobox fixture|name=A}}',catalog([row]));}
 const context={};Object.defineProperty(context,'sourceWiki',{get(){reads++;return 'en';}});converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',catalog(),context);equal(reads,0);
});
test('protected extension bodies, nested calls, parameters and named refs stay byte-exact',()=>{
 const values=['{{lang|en|A=B}}','{{{input|{{fallback|x=y}}}}}','[[A|B]] and [[C#D|E=F]]','<!-- | name=trap -->A','<nowiki>{{A|B]]</nowiki>','<math>f(x)=a|b</math>','<ref name="r|1">Text {{citar livro|título=T|páginas=1–2}}</ref><ref name="r|1" />','<ref name="x"><nowiki><ref/></nowiki>A</ref>','<references><ref name="x">a|b=c</ref></references>','<span class="x">A</span>','Room < Adrian and a < b'];
 for(const value of values)converted('{{Infobox fixture|text='+value+'|name=N}}','{{Info/Registro|texto='+value+'|nome=N}}');
});
test('incomplete/ambiguous markup cannot be converted',()=>{
 const values=['{{Infobox fixture|name=A','{{Infobox fixture|name=A}}tail','{{{Infobox fixture|name=A}}}','{{Infobox fixture|text=[[A|B}}','{{Infobox fixture|text=<ref>x}}','{{Infobox fixture|text=<nowiki>x}}','{{Infobox fixture|text=<ref><ref>x</ref></ref>}}','{{Infobox fixture|text=[https://example.invalid/ label|broken]}}','{{Infobox fixture|[https://example.invalid/?a=b label]}}','{{Infobox fixture|na\nme=A}}'];
 for(const raw of values)preserved(raw,catalog(),{},'invalid-input');
});
test('named external links may contain query equals but positional equals are not guessed',()=>{
 converted('{{Infobox fixture|text=[https://example.invalid/?a=b&c=d label]}}','{{Info/Registro|texto=[https://example.invalid/?a=b&c=d label]}}');
 preserved('{{Infobox fixture|[https://example.invalid/?a=b label]}}',catalog(),{},'invalid-input');
});
test('duplicate source fields, alias collisions and named/positional collisions are preserved',()=>{
 const r=record();r.fields.title=field('nome');r.fields['1']=field('nome');r.preconditions={positional:'mapped'};
 for(const raw of ['{{Infobox fixture|name=A|name=A}}','{{Infobox fixture|name=A|title=A}}','{{Infobox fixture|A|1=A}}'])preserved(raw,catalog([r]));
 r.fields.caption.evidence.role=r.fields.name.evidence.role;preserved('{{Infobox fixture|name=A|caption=}}',catalog([r]));
 converted('{{Infobox fixture|caption=A}}','{{Info/Registro|legenda=A}}',catalog([r]));
 r.fields.caption.evidence.role='text';preserved('{{Infobox fixture|caption=A}}',catalog([r]),{},'invalid-contract');
});
test('positional mappings require explicit whitespace equivalence',()=>{
 const r=record();r.fields['1']=field('nome');r.preconditions={positional:'mapped'};preserved('{{Infobox fixture| A }}',catalog([r]));
 r.fields['1'].evidence.positionalWhitespace='trim-equivalent';converted('{{Infobox fixture| A }}','{{Info/Registro|nome= A }}',catalog([r]));
 r.fields['1']=field('1');converted('{{Infobox fixture| A }}','{{Info/Registro| A }}',catalog([r]));
 r.preconditions.positional='reject';preserved('{{Infobox fixture|A}}',catalog([r]));
});
test('child/embed modes and source-value defaults require explicit tested preconditions',()=>{
 const r=record();for(const value of ['yes','1','sim','no'])preserved('{{Infobox fixture|child='+value+'|name=A}}',catalog([r]));
 r.preconditions={inactiveEmbedValues:{child:['','no','0']},sourceValues:{name:['A']},requiredKeys:['name'],forbiddenKeys:['image']};
 for(const value of ['','no','0'])converted('{{Infobox fixture|child='+value+'|name=A}}','{{Info/Registro|subcaixa='+value+'|nome=A}}',catalog([r]));
 preserved('{{Infobox fixture|child=no}}',catalog([r]));preserved('{{Infobox fixture|child=no|name=B}}',catalog([r]));preserved('{{Infobox fixture|name=A|image=}}',catalog([r]));
 r.proof.embedding='equivalent';converted('{{Infobox fixture|child=yes|name=A}}','{{Info/Registro|subcaixa=yes|nome=A}}',catalog([r]));
});
test('literal transforms preserve scalar padding and never execute or invent text',()=>{
 const r=record();r.fields.name=field('nome',{transform:'literal-map',values:{yes:'sim','':'vazio'}});
 converted('{{Infobox fixture|name= yes \n}}','{{Info/Registro|nome= sim \n}}',catalog([r]));
 converted('{{Infobox fixture|name= \n }}','{{Info/Registro|nome= \n vazio}}',catalog([r]));
 for(const value of ['YES','maybe','\u00a0yes'])preserved('{{Infobox fixture|name='+value+'}}',catalog([r]));
 for(const value of ['{{execute}}','<script>x</script>']){r.fields.name.values.yes=value;preserved('{{Infobox fixture|name=yes}}',catalog([r]),{},'invalid-contract');}
});
test('date transforms require exact scalar date and explicit side-effect evidence',()=>{
 const r=record();r.fields.birth_date=field('data_nascimento',{transform:'date-ymd-to-dmy',transformEvidence:{source:'gregorian-iso-date',target:'gregorian-pt-long-date',age:false,categorySideEffects:false}});
 for(const[iso,wanted]of [['2000-02-29','29 de fevereiro de 2000'],['1900-03-01','1 de março de 1900'],['0001-01-01','1 de janeiro de 1']])converted('{{Infobox fixture|birth_date= '+iso+' \n}}','{{Info/Registro|data_nascimento= '+wanted+' \n}}',catalog([r]));
 for(const value of ['1900-02-29','2023-02-29','2024-13-01','0000-01-01','2000-01','2000','{{birth date|2000|1|1}}','2000-01-01<ref>x</ref>'])preserved('{{Infobox fixture|birth_date='+value+'}}',catalog([r]));
 for(const key of ['age','categorySideEffects']){const row=clone(r);row.fields.birth_date.transformEvidence[key]=true;preserved('{{Infobox fixture|birth_date=2000-01-01}}',catalog([row]),{},'invalid-contract');}
});
test('prepared registry is an immutable indexed snapshot with no caller-data mutation',()=>{
 const c=catalog(),frozen=JSON.stringify(c),p=api.v2221InfoboxRegistryPrepare(c);equal(JSON.stringify(c),frozen);ok(Object.isFrozen(p));equal(api.v2221InfoboxRegistryPrepare(p),p);
 c.records[0].fields.name.target='texto';converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',p);converted('{{Infobox fixture|name=A}}','{{Info/Registro|texto=A}}',c);
 const fake={...p};preserved('{{Infobox fixture|name=A}}',fake,{},'invalid-catalog');
});
test('proof rejects output, plan, source, contract pin and context tampering',()=>{
 const c=catalog(),raw='{{Infobox fixture|name=A}}',plan=migrate(raw,c);ok(api.v2221InfoboxProof(raw,plan.text,plan,c));
 for(const mutate of [p=>p.count++,p=>p.edits[0].text+=' ',p=>p.edits[0].before+='x',p=>p.proof.contracts[0]+=' ',p=>p.proof.snapshotId='other']){const p=clone(plan);mutate(p);ok(!api.v2221InfoboxProof(raw,plan.text,p,c));}
 ok(!api.v2221InfoboxProof(raw+' ',plan.text,plan,c));ok(!api.v2221InfoboxProof(raw,plan.text+' ',plan,c));ok(!api.v2221InfoboxProof(raw,plan.text,plan,c,{infoboxes:false}));
 const changed=clone(c);changed.records[0].source.sha256='b'.repeat(64);ok(!api.v2221InfoboxProof(raw,plan.text,plan,changed));
});
test('disabled families preserve calls and unrelated sibling boxes can still migrate',()=>{
 for(const key of ['multilingual','infoboxes','automaticParameterNames'])preserved('{{Infobox fixture|name=A}}',catalog(),{[key]:false},'disabled');
 const raws=['{{Infobox fixture|name=A|unknown=preserve}}','{{Infobox fixture|name=B}}'],plans=raws.map(raw=>migrate(raw));equal(plans[0].text,raws[0]);equal(plans[1].text,'{{Info/Registro|nome=B}}');
});
test('fuzzed literal values preserve every code unit across all source editions',()=>{
 const chunks=['plain','Á','A\u0301','\u00a0','\u200b','\ud83d\ude80','"quoted"',"apostrophe's",'x=y','\n','\t','<ref name="A\u0301">{{citar web|título=X}}</ref>'];
 for(const wiki of ['en','es','fr','de','ca','it']){const c=catalog([record(wiki)]),p=api.v2221InfoboxRegistryPrepare(c);for(let i=0;i<chunks.length;i++){const value=chunks[i]+chunks[(i*7+3)%chunks.length];converted('{{Infobox fixture|name='+value+'}}','{{Info/Registro|nome='+value+'}}',p,{sourceWiki:wiki});}}
});
test('complete date-part compounds consume every component with exact raw-span proof',()=>{
 const r=record();r.compounds=[dateCompound()];const c=catalog([r]),raw='{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29|name=A}}';
 const p=converted(raw,'{{Info/Registro|data_nascimento=29 de fevereiro de 2000|nome=A}}',c);equal(p.count,6);equal(p.edits.filter(x=>x.kind==='compound-parameter').length,2);
 for(const edit of p.edits.filter(x=>x.compoundId))for(const span of edit.consumedRawSpans)equal(raw.slice(span.start,span.end),span.before);
 converted('{{Infobox fixture|birth_day=29|name=A|birth_month=2|birth_year=2000}}','{{Info/Registro|nome=A|data_nascimento=29 de fevereiro de 2000}}',c);
 converted('{{Infobox fixture|name=A}}','{{Info/Registro|nome=A}}',c);
});
test('partial, empty, invalid, duplicate or conflicting date components preserve the whole call',()=>{
 const r=record();r.compounds=[dateCompound()];const c=catalog([r]);
 for(const raw of ['{{Infobox fixture|birth_year=2000}}','{{Infobox fixture|birth_year=2000|birth_month=2}}','{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=}}','{{Infobox fixture|birth_year=1900|birth_month=2|birth_day=29}}','{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29<ref>x</ref>}}','{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29|birth_day=29}}'])preserved(raw,c);
 r.fields.birth_date=field('data_nascimento');preserved('{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29|birth_date=2000}}',catalog([r]));
});
test('compound contracts reject missing consumption, dynamic inference, overlaps and malformed parts',()=>{
 const base=record();base.compounds=[dateCompound()];
 const mutations=[r=>r.compounds[0].sources[0].evidence.sourceConsumed=false,r=>r.compounds[0].sources[0].evidence.status='observed',r=>r.compounds[0].transformEvidence.partial='guess',r=>r.compounds[0].transformEvidence.age=true,r=>r.compounds[0].sources[0]=null,r=>r.compounds[0].sources[2].component='month',r=>r.fields.birth_year=field('nome'),r=>r.compounds.push(copyCompound(r.compounds[0])),r=>r.compounds[0].evidence.role='date'];
 function copyCompound(value){return clone(value);}
 for(const mutate of mutations){const row=clone(base);mutate(row);const c=catalog([row]);ok(api.v2221InfoboxCatalogValidate(c).recordErrors.length>0);preserved('{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29}}',c,{},'invalid-contract');}
});
test('linked-field compound joins preserve source values, names, refs and source order explicitly',()=>{
 const r=record();r.compounds=[{id:'career-pair',target:'texto',transform:'join-exact',sources:[{key:'years',evidence:sourceEvidence('career.period')},{key:'club',evidence:sourceEvidence('career.club')}],evidence:{status:'verified',role:'career.record',targetConsumed:true,semantics:'equivalent'},transformEvidence:{separator:' – ',whitespace:'preserve',partial:'reject'}}];
 const value='[[A\u0301|Á]]<ref name="Re\u0301f">Text</ref><ref name="Réf"/>',c=catalog([r]);converted('{{Infobox fixture|club='+value+'|years=2000–2001}}','{{Info/Registro|texto=2000–2001 – '+value+'}}',c);
 preserved('{{Infobox fixture|club='+value+'}}',c);preserved('{{Infobox fixture|club='+value+'|years= }}',c);
 r.compounds[0].transformEvidence.whitespace='named-margin';preserved('{{Infobox fixture|club=A|years=2000}}',catalog([r]),{},'invalid-contract');
 for(const input of r.compounds[0].sources)input.evidence.whitespace='trim-equivalent';converted('{{Infobox fixture|club= [[A]] \n|years= 2000 }}','{{Info/Registro|texto=2000 – [[A]]}}',catalog([r]));
 r.compounds[0].transformEvidence.separator='{{call}}';preserved('{{Infobox fixture|club=A|years=2000}}',catalog([r]),{},'invalid-contract');
});
test('embedded context requires placement-equivalent proof independent of explicit child parameters',()=>{
 const r=record(),raw='{{Infobox fixture|name=A}}';preserved(raw,catalog([r]),{embedded:true},'preserved');r.proof.embedding='equivalent';const c=catalog([r]),p=converted(raw,'{{Info/Registro|nome=A}}',c,{embedded:true});ok(!api.v2221InfoboxProof(raw,p.text,p,c,{embedded:false}));
 r.compounds=[dateCompound()];r.proof.embedding='standalone';preserved('{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29}}',catalog([r]),{embedded:true},'preserved');
});
test('native repair acts only on proven unconsumed keys of the same pinned native body',()=>{
 const r=nativeRecord(),c=catalog([r]);converted('{{Info/Registro|name=A}}','{{Info/Registro|nome=A}}',c);converted('{{Infocaixa nativa|name=A}}','{{Infocaixa nativa|nome=A}}',c,{sourceWiki:'en'});
 preserved('{{Info/Registro|nome=A}}',c,{},'already-native');preserved('{{Info/Registro|nome=A|unrecognized=B}}',c,{},'already-native');preserved('{{Info/Registro|name=A|unrecognized=B}}',c,{},'preserved');
 preserved('{{Info/Registro|name=A|nome=A}}',c,{},'preserved');
 const noAlias=clone(c);noAlias.nativeAliases=[];preserved('{{Info/Registro|name=A}}',noAlias,{},'unmapped');
 const stale=clone(c);for(const row of [stale.records[0].source,stale.records[0].target,stale.records[0].proof.nativeRepair.nativeReader])row.revision=101;preserved('{{Info/Registro|name=A}}',stale,{},'invalid-contract');
});
test('native repair requires complete reader and foreign semantic proof without language inference',()=>{
 const mutations=[r=>r.proof.nativeRepair.originIndependent=false,r=>r.proof.nativeRepair.nativeReader.coverage='partial',r=>r.proof.nativeRepair.nativeReader.forwarding='unknown',r=>r.proof.nativeRepair.nativeReader.lua='unknown',r=>r.proof.nativeRepair.nativeReader.sha256='b'.repeat(64),r=>delete r.fields.name.foreignEvidence,r=>r.fields.name.foreignEvidence[0].consumed=false,r=>r.fields.name.foreignEvidence[0].role='different.role',r=>r.proof.nativeRepair.unconsumedKeys=['other'],r=>r.fields.nome.target='texto'];
 for(const mutate of mutations){const r=nativeRecord();mutate(r);const c=catalog([r]);ok(api.v2221InfoboxCatalogValidate(c).recordErrors.length>0);preserved('{{Info/Registro|name=A}}',c);}
 const c=catalog([nativeRecord()]),p=migrate('{{Info/Registro|name=A}}',c),changed=clone(c);changed.records[0].fields.name.foreignEvidence[0].sha256='b'.repeat(64);ok(!api.v2221InfoboxProof(p.source,p.text,p,changed));
});
test('native repair compounds require all native inputs proven unconsumed and preserve valid native values',()=>{
 const r=nativeRecord();delete r.fields.name;r.compounds=[dateCompound()];r.proof.nativeRepair.unconsumedKeys=r.compounds[0].sources.map(x=>x.key);
 for(const input of r.compounds[0].sources){input.evidence.sourceConsumed=false;input.foreignEvidence=[{wiki:'en',title:'Template:Infobox fixture',key:input.key,...pin,role:input.evidence.role,consumed:true,semantics:'equivalent'}];}
 r.fields.data_nascimento=field('data_nascimento');const c=catalog([r]);converted('{{Info/Registro|birth_year=2000|birth_month=2|birth_day=29|nome=A}}','{{Info/Registro|data_nascimento=29 de fevereiro de 2000|nome=A}}',c);
 preserved('{{Info/Registro|data_nascimento=2000}}',c,{},'already-native');preserved('{{Info/Registro|birth_year=2000|birth_month=2}}',c,{},'preserved');
 preserved('{{Info/Registro|birth_year=2000|birth_month=2|birth_day=29|data_nascimento=2000}}',c,{},'preserved');
});
test('malformed nested compound and repair evidence cannot throw or grant a conversion',()=>{
 const base=record();base.compounds=[dateCompound()];const values=[null,false,0,'text',[],{}];
 for(const value of values)for(const key of ['sources','evidence','transformEvidence']){const r=clone(base);r.compounds[0][key]=value;const c=catalog([r]);ok(api.v2221InfoboxCatalogValidate(c).recordErrors.length>0);preserved('{{Infobox fixture|birth_year=2000|birth_month=2|birth_day=29}}',c);}
 const join=clone(base);join.compounds[0].transform='join-exact';join.compounds[0].sources=[null,{}];join.compounds[0].transformEvidence={separator:' – ',whitespace:'named-margin',partial:'reject'};ok(api.v2221InfoboxCatalogValidate(catalog([join])).recordErrors.length>0);
 for(const value of values)for(const key of ['nativeReader','unconsumedKeys']){const r=nativeRecord();r.proof.nativeRepair[key]=value;ok(api.v2221InfoboxCatalogValidate(catalog([r])).recordErrors.length>0);preserved('{{Info/Registro|name=A}}',catalog([r]));}
 const notRepair=record('pt','Info/Registro');ok(api.v2221InfoboxCatalogValidate(catalog([notRepair])).recordErrors.length>0);
});
test('literal nonempty preconditions preserve bytes and never infer language or identity',()=>{
 const r=record();r.preconditions={literalNonemptyKeys:['name']};const c=catalog([r]);
 for(const value of ['A',' A\u0301 and Á ','O\'Example','Name (pseudonym)','AT&T'])converted('{{Infobox fixture|name='+value+'}}','{{Info/Registro|nome='+value+'}}',c);
 for(const value of ['', ' \t\n ', '{{name}}','[[Name]]','[https://example.invalid/ Name]','<span>Name</span>',"''Name''",'Name\nOther','&nbsp;','Name &amp; Other'])preserved('{{Infobox fixture|name='+value+'}}',c);
 preserved('{{Infobox fixture|text=Name}}',c);preserved('{{INFOBOX fixture|name=A}}',c,{},'unmapped');
 for(const invalid of [null,'name',{},['']]){const row=clone(r);row.preconditions.literalNonemptyKeys=invalid;preserved('{{Infobox fixture|name=A}}',catalog([row]),{},'invalid-contract');}
});
test('exclusive nonempty groups guard source precedence while empty fields remain represented',()=>{
 const r=record();r.fields.works=field('texto');r.fields.credits=field('vazio');r.preconditions={mutuallyExclusiveNonempty:[['works','credits']]};const c=catalog([r]);
 converted('{{Infobox fixture|name=A|works=Work|credits= }}','{{Info/Registro|nome=A|texto=Work|vazio= }}',c);
 converted('{{Infobox fixture|works= |credits= }}','{{Info/Registro|texto= |vazio= }}',c);
 preserved('{{Infobox fixture|name=A|works=Work|credits=Credit}}',c);
 preserved('{{Infobox fixture|works=Work|credits=<ref name="x"/>}}',c);
 for(const invalid of [null,{},['works'],[['works']],[['works','works']],[['works',null]]]){const row=clone(r);row.preconditions.mutuallyExclusiveNonempty=invalid;preserved('{{Infobox fixture|name=A}}',catalog([row]),{},'invalid-contract');}
});
test('independent native wrappers need explicit source and target readers and native pins',()=>{
 const r=wrapperRecord(),c=wrapperCatalog([r]);converted('{{Info/Legacy|name=A}}','{{Info/Registro|nome=A}}',c);preserved('{{Info/Legacy|name=A|unknown=}}',c,{},'preserved');
 const missing=clone(c);missing.nativeAliases=missing.nativeAliases.filter(x=>x.title!=='Info/Registro');preserved('{{Info/Legacy|name=A}}',missing,{},'invalid-contract');
 const noOwner=clone(c);noOwner.nativeAliases=noOwner.nativeAliases.filter(x=>x.title!=='Info/Legacy');preserved('{{Info/Legacy|name=A}}',noOwner,{},'unmapped');
 for(const mutate of [r=>r.proof.nativeWrapper.sourceReader.forwarding='unknown',r=>r.proof.nativeWrapper.targetReader.lua='unknown',r=>r.proof.nativeWrapper.originIndependent=false,r=>r.proof.nativeWrapper.sourceReader.sha256=hash]){const row=clone(r);mutate(row);ok(api.v2221InfoboxCatalogValidate(wrapperCatalog([row])).recordErrors.length>0);preserved('{{Info/Legacy|name=A}}',wrapperCatalog([row]));}
});
test('native wrappers and plausible foreign sources agree on both output and semantic roles',()=>{
 const wrapper=wrapperRecord(),foreign=record('en','Template:Info/Legacy');converted('{{Info/Legacy|name=A}}','{{Info/Registro|nome=A}}',wrapperCatalog([wrapper,foreign]));
 foreign.fields.name.evidence.role='person.different.name';preserved('{{Info/Legacy|name=A}}',wrapperCatalog([wrapper,foreign]),{},'ambiguous');
 converted('{{Info/Legacy|name=A}}','{{Info/Registro|nome=A}}',wrapperCatalog([wrapper,foreign]),{sourceWiki:'pt'});
 converted('{{Info/Legacy|name=A}}','{{Info/Registro|nome=A}}',wrapperCatalog([wrapper,foreign]),{sourceWiki:'en'});
 const absent=wrapperCatalog([wrapper]);preserved('{{Info/Legacy|name=A}}',absent,{sourceWiki:'en'},'already-native');
 foreign.state='unresolved';preserved('{{Info/Legacy|name=A}}',wrapperCatalog([wrapper,foreign]),{},'unresolved');
});
test('a native wrapper authorizer stays bound to placement, guards and the proof',()=>{
 const wrapper=wrapperRecord(),foreign=record('en','Template:Info/Legacy'),raw='{{Info/Legacy|name=A}}';wrapper.preconditions={literalNonemptyKeys:['name'],forbiddenKeys:['child']};
 const c=wrapperCatalog([wrapper,foreign]),p=converted(raw,'{{Info/Registro|nome=A}}',c,{sourceWiki:'en'});equal(p.proof.authorizers.length,1);
 preserved('{{Info/Legacy|name= }}',c,{sourceWiki:'en'},'preserved');preserved('{{Info/Legacy|name=A|child=}}',c,{sourceWiki:'en'},'preserved');
 foreign.proof.embedding='equivalent';preserved(raw,wrapperCatalog([wrapper,foreign]),{sourceWiki:'en',embedded:true},'preserved');
 const changed=clone(c);changed.records[0].preconditions.requiredKeys=['additional'];ok(!api.v2221InfoboxProof(raw,p.text,p,changed,{sourceWiki:'en'}));
});
test('conflicting native owner identities never use first-match precedence',()=>{
 const c=wrapperCatalog();c.nativeAliases.push({title:'Info/Other',aliases:['Info/Legacy'],...pin});preserved('{{Info/Legacy|name=A}}',c,{},'invalid-contract');
 const duplicate=wrapperCatalog();duplicate.nativeAliases.push(clone(duplicate.nativeAliases.at(-1)));converted('{{Info/Legacy|name=A}}','{{Info/Registro|nome=A}}',duplicate);
 const differentPin=wrapperCatalog();differentPin.nativeAliases.push({...clone(differentPin.nativeAliases.at(-1)),revision:201});preserved('{{Info/Legacy|name=A}}',differentPin,{},'invalid-contract');
});
test('foreign profiles with equal output but disagreeing semantic roles remain ambiguous',()=>{
 const a=record('en'),b=record('ca');b.fields.name.evidence.role='different.semantic.name';preserved('{{Infobox fixture|name=A}}',catalog([a,b]),{},'ambiguous');
});
console.log(JSON.stringify({suite:'foreign-infobox-registry-v2221',status:'passed',cases,checks,groups:results},null,2));

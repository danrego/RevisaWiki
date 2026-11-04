'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.6/RevisaWiki_v2_21_6.js'),api=require(core),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};
let checks=0,calculations=0;const rows=[];
function eq(a,b,label){checks++;assert.deepEqual(a,b,label);}
const citation='{{Citar livro|título=Fonte|último=Silva|ano=2003}}',decode=s=>api.decodedReferenceName?api.decodedReferenceName(s):s.replace(/&#58;/g,':');
function family(source,name){return api.v219NativeReferenceObserver(source).refs.filter(r=>decode(r.attrs?.name||'')===name).map(r=>({name:decode(r.attrs?.name||''),group:r.group||'',body:r.body}));}
function resolution(source,name){const refs=family(source,name),defs=new Set(refs.filter(r=>r.body!==null).map(r=>r.body));return{occurrences:refs.length,definitions:refs.filter(r=>r.body!==null).length,unresolved:refs.some(r=>r.body===null)&&defs.size!==1};}
const wrappers=[
 ['blockquote',r=>'<blockquote>Trecho.'+r+'</blockquote>'],
 ['small-in-blockquote',r=>'<blockquote><small>Trecho.”'+r+'</small></blockquote>'],
 ['straight-double-quote',r=>'"Trecho.'+r+'"'],
 ['curly-double-quote',r=>'“Trecho.'+r+'”'],
 ['citation-helper',r=>'{{Citação|Trecho.'+r+'}}'],
 ['unknown-template',r=>'{{Modelo desconhecido|Trecho.'+r+'}}']
];
for(const[name,wrap]of wrappers)for(const old of [':0','ref-auto-1','RevisaWiki-auto-3'])for(const group of ['', 'especial']){
 const attrs=' name="'+old+'"'+(group?' group="'+group+'"':''),tail=wrap('<ref'+attrs+' />'),source='Texto.<ref'+attrs+'>'+citation+'</ref>\n'+tail+'\n{{Referências'+(group?'|grupo='+group:'')+'}}';
 const plan=api.v2216AutonamePlan(source,cfg);
 eq(plan.text,source,'An active family that extends into a quoted or template-owned scope must remain atomic');
 eq(api.v2216AutonameProof(source,plan.text,plan,cfg),true,'An unchanged conservative plan remains valid');
 eq(resolution(plan.text,old).unresolved,false,'No old-name reuse may lose its definition');
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,result).accepted,true,'Independent safe families remain usable');
 eq(resolution(result.text,old).occurrences,resolution(source,old).occurrences,'A complete active family is retained across the full calculation');
 eq(resolution(result.text,old).unresolved,false,'Full calculation cannot leave an old quoted reuse undefined');
 rows.push({id:name,sourceSha256:sha(source),outputSha256:sha(result.text)});
}
for(const tail of ['<nowiki><ref name=":0" /></nowiki>','<!-- <ref name=":0" /> -->','<pre><ref name=":0" /></pre>','<syntaxhighlight lang="wikitext"><ref name=":0" /></syntaxhighlight>']){
 const source='Texto.<ref name=":0">'+citation+'</ref>\n'+tail+'\n{{Referências}}',plan=api.v2216AutonamePlan(source,cfg);
 eq(plan.text!==source,true,'Inactive literal demonstrations do not claim an active family member');
 eq(plan.text.includes(tail),true,'Inactive literal demonstrations stay byte-identical');
 eq(family(plan.text,'Silva2003-1').length,1,'The actual active definition can still receive a descriptive name');
}
for(const tail of ['{| class="wikitable"\n| Trecho.<ref name=":0" />\n|}','<div>Trecho.<ref name=":0" /></div>']){
 const source='Texto.<ref name=":0">'+citation+'</ref>\n'+tail+'\n{{Referências}}',plan=api.v2216AutonamePlan(source,cfg);
 eq(plan.text!==source,true,'Fully observed literal families remain eligible');
 eq(family(plan.text,':0').length,0,'Every active old identity is replaced together');
 eq(family(plan.text,'Silva2003-1').length,2,'Definition and reuse share one descriptive identity');
 eq(api.v2216AutonameProof(source,plan.text,plan,cfg),true,'Complete family proof remains valid');
}
const partial='Texto.<ref name=":0">'+citation+'</ref>\n<blockquote>Trecho.<ref name=":0" /></blockquote>\nOutro.<ref name=":1">'+citation.replace('Silva','Souza')+'</ref> Mais.<ref name=":1"/>\n{{Referências}}',partialPlan=api.v2216AutonamePlan(partial,cfg);
eq(family(partialPlan.text,':0').length,2,'One incomplete family is preserved');
eq(family(partialPlan.text,':1').length,0,'An independent complete family still changes');
eq(family(partialPlan.text,'Souza2003-1').length,2,'Independent family binding is retained');
eq(api.v2216AutonameProof(partial,partialPlan.text,partialPlan,cfg),true,'Atomic conservative and changed families compose');
const open='Texto.<ref name=":0">'+citation+'</ref> Mais.<ref name=":0"/>\n{{Referências}}',p=api.v2216AutonamePlan(open,cfg);
for(const changed of [p.text.replace(/name="Silva2003-1"\s*\//,'name=":0" /'),p.text.replace('Fonte','Obra inventada'),p.text+'<blockquote><ref name=":0" /></blockquote>']){
 eq(api.v2216AutonameProof(open,changed,{...p,text:changed},cfg),false,'A forged partial family or inserted unmatched quoted use cannot inherit a proof');
}
const receipt={suite:'autoname-active-quote-integrity-2.21.6',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,rows,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));

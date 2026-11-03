'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};
const fixtureOwner=['fixture','article'].join('-'),fixtureTitle=(path='')=>'Usuário'+':'+fixtureOwner+(path?'/'+path:'');
let checks=0,calculations=0;const failures=[],rows=[];
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
const body='{{Citar web|url=https://example.org/fonte|title=Título de teste|website=Publicação de teste}}',other='{{Citar web|url=https://example.net/outra|title=Outra fonte}}',ref=(name,b=body,group='')=>'<ref name="'+name+'"'+(group?' group="'+group+'"':'')+'>'+b+'</ref>',pair=(a,b,name='fonte',group='')=>ref(name,a,group)+ref(name,b,group)+'\n{{Referências'+(group?'|grupo='+group:'')+'}}';
const audit=(a,b,opts=cfg)=>api.v2215NamedDefinitionConsistencyAudit(a,b,opts),bad=body.replace('website=','obra='),source=pair(body,body),split=pair(body,bad);
eq(audit(source,split).length,1,'native-equivalent CS1 aliases still produce conflicting raw definition bodies');
eq(audit(source,split,{...cfg,references:false,citations:false,automaticParameterNames:false}).length,1,'writer toggles cannot disable independent raw-body integrity');
eq(audit(source,source),[],'unchanged original is accepted');
eq(audit(source,pair(bad,bad)),[],'atomic equal-body normalization is accepted');
eq(audit(source,ref('fonte',bad)+'Outro.<ref name="fonte"/>\n{{Referências}}'),[],'duplicate definitions may become one definition and reuse');
eq(audit(source,pair(body,body,'nova')),[],'consistent approved identity rename creates no new conflict');
eq(audit(source,pair(body,bad,'nova')).length,1,'new raw conflict cannot evade the check by changing names');
eq(audit(source,pair(body,bad,'123')).length,1,'numeric named conflict is also rejected');
eq(audit(source,pair(body,bad,'fonte','xyz')).length,1,'changing the group cannot hide a new conflict');
eq(audit(pair(body,bad),pair(body,bad)),[],'existing raw conflict is not reported as newly introduced');
eq(audit(pair(body,bad),pair(body,body)),[],'reducing an existing conflict is accepted');
eq(audit(pair(body,bad),pair(body,bad)+ref('fonte',other)).length,1,'increasing existing distinct raw bodies is rejected');
eq(audit(pair(body,bad),pair(body,bad,'nova')),[],'one-to-one exact conflict-set rename is accepted for other identity guards to validate');
eq(audit(pair(body,bad),pair(body,bad,'nova')+pair(body,bad,'outra')).length,1,'one old conflict cannot authorize two new conflicting families');
eq(audit(pair(body,bad),pair(body,other,'nova')).length,1,'renamed conflict must preserve the exact original raw body set');
eq(audit(pair(body,bad,'antiga')+ref('nova',body),pair(body,bad,'nova')).length,1,'renaming into an existing valid identity cannot borrow an old conflict');
eq(audit(pair(body,bad,'antiga'),pair(body,bad,'antiga')+pair(body,bad,'nova')).length,1,'retained old conflict cannot authorize an additional new one');
eq(audit(pair(body,bad,'a')+pair(body,bad,'b'),pair(body,bad,'c')).length,1,'ambiguous old conflict correspondence stays unproved');
for(const name of ['fonte','123','Fonte com espaços','origem-1'])for(const group of ['','note','nota','xyz'])for(const reuse of ['',' ','\n']){
 const before=ref(name,body,group)+ref(name,reuse,group),after=ref(name,body,group)+ref(name,bad,group);
 eq(audit(before,after).length,1,'empty reuse does not authorize a conflict '+name+' '+group+' '+JSON.stringify(reuse));
 eq(audit(before,ref(name,bad,group)+'<ref name="'+name+'"'+(group?' group="'+group+'"':'')+'/>'),[],'empty reuse and self-closing reuse stay equivalent '+name+' '+group+' '+JSON.stringify(reuse));
}
for(const tag of ['nowiki','pre','syntaxhighlight','source','math','chem','ce','score','timeline','graph','includeonly','inputbox','gallery']){
 const a='<'+tag+'>'+source+'</'+tag+'>',b='<'+tag+'>'+split+'</'+tag+'>';eq(audit(a,b),[],tag+' owner is outside the definitely active literal-reference reader');
}
eq(audit('<!--'+source+'-->','<!--'+split+'-->'),[],'comment examples are excluded');
eq(audit('{{Modelo não certificado|texto='+source+'}}','{{Modelo não certificado|texto='+split+'}}'),[],'opaque template argument is not asserted to be an active ref family');
eq(audit(pair(body,body),ref('fonte',body)+'<blockquote>'+ref('fonte',bad)+'</blockquote>\n{{Referências}}').length,1,'ordinary protected quotation still has active native named references');
eq(audit('<references>'+ref('fonte',body)+ref('fonte',body)+'</references>','<references>'+ref('fonte',body)+ref('fonte',bad)+'</references>').length,1,'native list-defined active definitions are included');
eq(audit('{{Referências|refs='+ref('fonte',body)+ref('fonte',body)+'}}','{{Referências|refs='+ref('fonte',body)+ref('fonte',bad)+'}}').length,1,'verified native template reference bank is included');
eq(audit(source,pair(body,bad),{...cfg,namespaceNumber:2,pageTitle:fixtureTitle('Testes')}).length,1,'bounded article draft remains checked');
for(const [namespaceNumber,pageTitle,contentModel]of [[1,'Discussão:Exemplo','wikitext'],[2,fixtureTitle(),'wikitext'],[2,fixtureTitle('PU'),'wikitext'],[10,'Predefinição:Exemplo','wikitext'],[0,'Exemplo','javascript']])eq(audit(source,split,{...cfg,namespaceNumber,pageTitle,contentModel}),[],'nonarticle model scope '+namespaceNumber+' '+contentModel);
for(const [id,source,wanted] of [
 ['complete-symmetric-family',pair(body,body),true],
 ['protected-active-peer',ref('fonte',body)+'\n<blockquote>'+ref('fonte',body)+'</blockquote>\n'+ref('independente',other)+'\n{{Referências}}',false],
 ['opaque-template-peer',ref('fonte',body)+'\n{{Modelo não certificado|texto='+ref('fonte',body)+'}}\n'+ref('independente',other)+'\n{{Referências}}',false]
]){
 const plan=api.v2215AliasPlan(source,cfg),definitions=api.v2215NamedDefinitionFamilies(plan.text),family=definitions.get(JSON.stringify(['','fonte']));
 eq(plan.edits.length>0,true,id+' retains independent allowed edits');eq(plan.text.includes('website='),!wanted,id+' transforms a named family atomically');eq(family?.bodies.size,1,id+' does not split definitely active original equal bodies');eq(audit(source,plan.text),[],id+' independent raw consistency passes');
 rows.push({id,sourceSha256:sha(source),candidateSha256:sha(plan.text),edits:plan.edits.length});
}
const full=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
eq(api.v219AutomaticResultSafety(source,full).accepted,true,'full calculation passes the unchanged preservation and new independent reader');eq(audit(source,full.text),[],'full writer keeps all equal named raw definitions consistent');
const again=api.calculate({kind:'adjust',source:full.text,originalSource:full.text,options:cfg});calculations++;eq(again.text,full.text,'normal named-reference case is idempotent');
// Even a fabricated writer report cannot satisfy the original-source reader.
const fabricated={...full,text:split,changes:[],proofs:[],warnings:[],diagnostics:[],adjustments:[]};
eq(audit(source,fabricated.text).length,1,'clearing claimed proof/report arrays cannot hide a raw definition split');
const receipt={suite:'raw-named-definition-family-integrity-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Raw named definitions must stay atomic without suppressing unrelated fixes');

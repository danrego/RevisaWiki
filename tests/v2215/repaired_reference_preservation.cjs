'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-11-03'};
let checks=0,calculations=0;const failures=[],rows=[];
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
const body=(number='',name='Publicação de teste')=>'{{Citar web|url=https://example.org/fonte'+number+'|título=Fonte de teste'+number+'|autor=Autoria de teste|editor'+number+'=[['+name+']]|data=1 de junho de 2020}}';
const sources=[
 ['linked-editor-and-punctuation','Texto. <ref name="fonte">'+body()+'</ref>\n{{Referências}}'],
 ['linked-editor-and-bare-collector','Texto. <ref name="fonte">'+body()+'</ref>\n== Referências ==\n<references/>'],
 ['linked-editor-and-reuse','Texto. <ref name="fonte">'+body()+'</ref> Outro. <ref name="fonte"/>\n{{Referências}}'],
 ['linked-editor-and-empty-reuse','Texto. <ref name="fonte">'+body()+'</ref> Outro. <ref name="fonte"></ref>\n{{Referências}}'],
 ['anonymous-editor','Texto. <ref>'+body()+'</ref>\n{{Referências}}'],
 ['two-editors-two-references','Texto. <ref name="primeira">'+body('', 'Primeira publicação')+'</ref> Outro. <ref name="segunda">'+body('', 'Segunda publicação')+'</ref>\n<references/>'],
 ['numbered-editor-one','Texto. <ref name="fonte">'+body('1')+'</ref> Outro. <ref name="fonte"/>\n{{Referências}}'],
 ['numbered-editor-two','Texto. <ref name="fonte">'+body('2')+'</ref> Outro. <ref name="fonte"/>\n{{Referências}}'],
 ['already-linked-editor','Texto. <ref name="fonte">{{Citar web|url=https://example.org/fonte|título=Fonte de teste|editor=Publicação de teste|editor-link=Publicação de teste}}</ref>\n{{Referências}}']
];
for(const[id,source]of sources){
 const plan=api.v25ApprovedSyntaxPlan(source,cfg);eq(plan.newRepairs>0,true,id+' enters the finite syntax object guard');
 const trial=api.calculate({kind:'adjust',source,originalSource:source,options:cfg,v2214Trial:true});calculations++;
 eq(api.v219AutomaticResultSafety(source,trial).accepted,true,id+' unrestricted first calculation is already accepted');
 eq(api.preservationAudit(source,trial.text,cfg),[],id+' original-to-final preservation retains all reference data');
 eq(api.safeComposition(source,trial.text,cfg),'',id+' original-to-final composition passes the unchanged guards');
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(result.text,trial.text,id+' ordinary calculation does not drop a repair family');
 eq(api.v219AutomaticResultSafety(source,result).accepted,true,id+' ordinary calculation is source-verified');
 const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculations++;
 eq(again.text,result.text,id+' a second click has nothing left to fix');
 eq(result.text.includes('editorlink'),true,id+' existing formatter and preferred aliases use the same native key');
 eq(result.text.includes('editor-link'),false,id+' no proof-only alternate spelling remains');
 rows.push({id,sourceSha256:sha(source),candidateSha256:sha(result.text),newSyntaxRepairs:plan.newRepairs});
 const mutations=[
  ['url',text=>text.replace('https://example.org/fonte','https://example.net/outra')],
  ['title',text=>text.replace('Fonte de teste','Outro título')],
  ['editor',text=>text.replace('editor=Publicação de teste','editor=Outra publicação')],
  ['author',text=>text.replace('Autoria de teste','Outra autoria')],
  ['date',text=>text.replace('1 de junho de 2020','2 de junho de 2020')],
  ['body',text=>text.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/,'<ref name="fonte">Outra referência.</ref>')],
  ['definition',text=>text.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/,'<ref name="fonte"/>')]
 ];
 for(const[mutation,change]of mutations){const changed=change(result.text);if(changed===result.text)continue;eq(api.preservationAudit(source,changed,cfg).length>0,true,id+' refuses '+mutation+' mutation');eq(api.safeComposition(source,changed,cfg)!=='',true,id+' composition refuses '+mutation+' mutation');}
 const observed=api.v219NativeReferenceObserver(result.text),complete=observed.refs.filter(ref=>ref.body!==null);
 if(complete.length===2){const a=result.text.slice(complete[0].start,complete[0].end),b=result.text.slice(complete[1].start,complete[1].end),swapped=result.text.replace(a,'@@FIRST_REFERENCE@@').replace(b,a).replace('@@FIRST_REFERENCE@@',b);eq(api.preservationAudit(source,swapped,cfg).length>0,true,id+' retains reference order and source associations');eq(api.safeComposition(source,swapped,cfg)!=='',true,id+' composition refuses reordered references');}
}
for(const[tail,label]of [['|editorlink=Outro destino','conflicting-alias'],['|editor-link=Outro destino','existing-conflicting-link']]){
 const source='Texto. <ref name="fonte">{{Citar web|url=https://example.org/fonte|título=Fonte de teste|editor=[[Publicação de teste]]'+tail+'}}</ref>\n{{Referências}}',result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(result.text.includes('Outro destino'),true,label+' never drops a competing supplied link');
 eq(api.v219AutomaticResultSafety(source,result).accepted,true,label+' retains the original source obligations');
 const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculations++;eq(again.text,result.text,label+' remains stable');
}
const receipt={suite:'repaired-reference-native-link-alias-composition-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Native key preferences must compose with the unchanged object preservation guards');

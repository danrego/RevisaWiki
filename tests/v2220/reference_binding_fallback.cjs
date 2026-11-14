'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {api,cfg,file,sourceSha}=require('./harness.cjs');let checks=0;const cases=[];
const settings={...cfg,pageTitle:'Tema'},source='A<ref name="original">Fonte original.</ref>\nB<ref>[https://example.org/a Notas de aula]</ref>\nC<ref>[https://example.org/a Notas de aula]</ref>\n{{efn|Nota.}}\n{{Notas e referências}}\n',
 bare=api.v219CitationLanguageBareReferencePlan(source,settings),dedup=api.v2216ReferencePlan(bare.text,settings),named=api.v2216AutonamePlan(dedup.text,settings);
function eq(a,b,m){checks++;assert.equal(a,b,m);}
eq(api.v219CitationLanguageBareReferenceProof(source,bare.text,bare,settings),true,'literal bare source proof');
eq(api.v2216ReferenceProof(bare.text,dedup.text,dedup,settings),true,'literal dedup source proof');
eq(api.v2216AutonameProof(dedup.text,named.text,named,settings),true,'descriptive name source proof');
function test(id,after,wanted,options=settings){
 const result=api.v222ReferenceBindingFallback(source,after,options);eq(result.accepted,wanted,id);
 if(wanted){eq(api.v222ReferenceBindingFallbackProof(source,after,result,options),true,id+' reproducible');eq(api.v222ReferenceBindingFallbackProof(source,after,{...result,proof:{...result.proof,sourceHash:'stale'}},options),false,id+' stale proof');}
 cases.push({id,accepted:result.accepted,reason:result.reason,path:result.proof?.path.map(p=>p.kind)||[]});
}
test('source-identities-retained-bare-only',bare.text,true);
test('source-derived-anonymous-dedup',dedup.text,true);
test('source-derived-descriptive-name',named.text,true);
test('unrelated-prose-change-not-certified',named.text.replace('A<ref','Outra passagem.<ref'),false);
test('existing-named-body-loss',named.text.replace('Fonte original.','Outra fonte.'),false);
test('anonymous-body-loss',named.text.replace('Notas de aula','Outra obra'),false);
test('named-identity-renamed',named.text.replace('name="original"','name="outro"'),false);
test('named-identity-dropped',named.text.replace('<ref name="original">Fonte original.</ref>',''),false);
const namedRef='<ref name="original">Fonte original.</ref>';
test('physical-named-move',named.text.replace(namedRef,'').replace('C<ref',namedRef+'C<ref'),false);
const generated=named.families[0].after,reuse='<ref name="'+generated+'" />';
test('physical-generated-reuse-move',named.text.replace(reuse,'').replace('A<ref','A'+reuse+'<ref'),false);
test('drop-generated-reuse',named.text.replace(reuse,''),false);
test('reuse-points-to-missing-family',named.text.replace(reuse,'<ref name="ausente" />'),false);
test('split-new-definition',named.text.replace(reuse,'<ref name="'+generated+'">Outra fonte.</ref>'),false);
test('split-preexisting-definition',named.text.replace(reuse,'<ref name="original">Outra fonte.</ref>'),false);
test('generated-name-collision',named.text.split('name="'+generated+'"').join('name="original"'),false);
test('unproved-custom-new-name',named.text.split('name="'+generated+'"').join('name="nome-inventado"'),false);
test('changed-generated-group',named.text.split('name="'+generated+'"').join('name="'+generated+'" group="nota"'),false);
test('native-helper-body-change',named.text.replace('{{efn|Nota.}}','{{efn|Outra nota.}}'),false);
test('native-helper-physical-move',named.text.replace('{{efn|Nota.}}','').replace('A<ref','{{efn|Nota.}}A<ref'),false);
test('new-opaque-producer',named.text.replace('A<ref','{{Modelo desconhecido}}\nA<ref'),false);
test('empty-name-not-readable',named.text.replace('name="original"','name=""'),false);
for(const options of [{...settings,references:false},{...settings,automaticIdenticalReferences:false},{...settings,sectionOnly:true},{...settings,namespaceNumber:1,discussionPage:true},{...settings,namespaceNumber:10},{...settings,namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/PU'}])test('scope-held-'+cases.length,named.text,false,options);
eq(api.v222ReferenceBindingFallbackProof(source,named.text,null,settings),false,'missing proof');
const report={suite:'v2220-reference-binding-fallback',runtime:file,runtimeSha256:sourceSha,checks,cases:cases.length,results:cases,passed:true};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,checks,cases:cases.length,passed:true}));

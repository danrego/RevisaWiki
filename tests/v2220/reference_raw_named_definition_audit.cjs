'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {api,cfg,file,sourceSha}=require('./harness.cjs');let checks=0;const cases=[];
const body='{{Citar livro|título=Obra|editor=Editora}}',same='Primeiro<ref name="fonte">'+body+'</ref> Depois<ref name="fonte">'+body+'</ref>',
 split=same.replace('Depois<ref name="fonte">'+body,'Depois<ref name="fonte">'+body.replace('editor=','editor-sobrenome='));
function test(id,before,after,wanted,options={}){
 const settings={...cfg,...options},findings=api.v222RawNamedDefinitionAudit(before,after,settings);checks++;assert.equal(findings.length,wanted,id);
 checks++;assert.equal(JSON.stringify(api.v222RawNamedDefinitionAudit(before,after,settings)),JSON.stringify(findings),id+' deterministic original-source audit');
 if(wanted){checks++;assert(findings.every(f=>f.code==='new-raw-named-reference-split'&&f.severity==='warning'&&f.detail.beforeBodies===1&&f.detail.afterBodies>1),id+' literal split finding');}
 cases.push({id,findings:findings.length});
}
test('literal-editor-alias-split-rejected',same,split,1);
test('identical-definitions-unchanged',same,same,0);
test('uniform-alias-change-not-a-split',same,same.split('editor=').join('editor-sobrenome='),0);
test('uniform-whitespace-change-not-a-split',same,same.split('editor=Editora').join('editor= Editora'),0);
test('one-sided-whitespace-is-a-raw-split',same,same.replace('editor=Editora','editor= Editora'),1);
test('reuses-do-not-create-a-second-body',same,same.replace('Depois<ref name="fonte">'+body+'</ref>','Depois<ref name="fonte" />'),0);
const other=' Outra<ref name="outra">Fonte B.</ref>';
test('independent-family-change-keeps-equal-family',same+other,same+other.replace('Fonte B.','Fonte C.'),0);
test('new-split-detected-among-independent-changes',same+other,split+other.replace('Fonte B.','Fonte C.'),1);
const conflict='A<ref name="fonte">Fonte A.</ref> B<ref name="fonte">Fonte B.</ref>';
test('preexisting-conflict-does-not-block-other-work',conflict,conflict+' Texto.',0);
test('preexisting-conflict-not-reclassified',conflict,conflict+' C<ref name="fonte">Fonte C.</ref>',0);
test('same-name-distinct-groups-are-separate',same.replace('Depois<ref name="fonte">','Depois<ref name="fonte" group="nota">'),split.replace('Depois<ref name="fonte">','Depois<ref name="fonte" group="nota">'),0);
for(const tag of ['nowiki','pre','syntaxhighlight','source']){
 const literal='<'+tag+'>'+same+'</'+tag+'>';
 test('protected-example-'+tag,literal,literal.replace('editor=Editora','editor-sobrenome=Editora'),0);
}
test('code-reference-bodies-follow-active-raw-reader','<code>'+same+'</code>','<code>'+split+'</code>',1);
test('unchanged-code-context-not-spurious','<code>'+same+'</code>','<code>'+same+'</code> Texto.',0);
test('literal-nowiki-peer-does-not-count',same+'<nowiki><ref name="fonte">Outra.</ref></nowiki>',same+'<nowiki><ref name="fonte">Alterada.</ref></nowiki>',0);
test('unchanged-quotation-context','"'+same+'"','"'+same+'" Texto.',0);
test('active-references-in-quotation-still-count','"'+same+'"','"'+split+'"',1);
test('quotation-template-peer-not-excused','{{Quote|'+same+'}}','{{Quote|'+split+'}}',1);
for(const options of [{references:false},{citations:false},{headings:false},{references:false,citations:false,headings:false,automaticBiographyFields:false}])test('writer-preference-cannot-disable-safety-'+cases.length,same,split,1,options);
test('recognized-draft-split-rejected',same,split,1,{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'});
for(const options of [{namespaceNumber:1,discussionPage:true},{namespaceNumber:10},{namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/PU'},{sectionOnly:true},{section:'2'},{contentModel:'javascript'},{model:'css'}])test('outside-full-article-scope-'+cases.length,same,split,0,options);
test('no-raw-reference-fast-path','Texto.','Outro texto.',0);
checks++;assert.equal(api.v222RawNamedDefinitionAudit(null,split,cfg).length,0,'non-string input');
const report={suite:'v2220-original-raw-named-definition-audit',runtime:file,runtimeSha256:sourceSha,checks,cases:cases.length,results:cases,passed:true};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite:report.suite,checks,cases:cases.length,passed:true}));

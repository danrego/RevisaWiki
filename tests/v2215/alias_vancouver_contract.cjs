'use strict';
// This pinned native module selects aliases but then reads two raw English
// arguments. Native rendering evidence is separate from these engine contracts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Assunto de teste',autoPreview:false,registryDoiCheck:false};
const models=['Citar arXiv','Citar comunicado de imprensa','Citar conferência','Citar discurso','Citar tese','Citar enciclopédia','Citar entrevista','Citar episódio','Citar grupo de notícias','Citar jogo eletrônico','Citar periódico','Citar lista de discussão','Citar livro','Citar mapa','Citar vídeo','Citar relatório','Citar relatório técnico','Citar série','Citar web'];
let checks=0,calculations=0;const failures=[];const eq=(actual,expected,label)=>{checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({actual,expected,label});}};
for(const model of models)for(const [portuguese,english]of [['vautores','vauthors'],['veditores','veditors']]){
 const source='{{'+model+'|'+portuguese+'=Alpha AB, Beta CD|título=Estudo|ano=2024}}',safe=source.replace('|'+portuguese+'=','|'+english+'=');
 eq(api.v2215PortugueseCitationKey(english),null,'The broken reverse preference is absent');
 eq(api.v2215NativeCitationReadAudit(source,safe,cfg),[],'The established repair is permitted by the exact native reader');
 eq(api.v2215NativeCitationReadAudit(safe,source,cfg).length>0,true,'The English raw field cannot revert to the broken alias');
 eq(api.v2215NativeCitationReadAudit(safe,safe.replace('|'+english+'=Alpha AB, Beta CD',''),cfg).length>0,true,'Raw Vancouver names cannot disappear from the call');
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,result).accepted,true,'A repaired candidate retains the source certificate');
 eq(result.text.includes('|'+english+'=Alpha AB, Beta CD'),true,'The full pipeline preserves the native Lua workaround');
 eq(result.text.includes('|'+portuguese+'='),false,'The late preference cannot undo the workaround');
 const second=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculations++;
 eq(second.text,result.text,'The restored native workaround is idempotent');
}
eq(api.v2215AliasPlan('{{Citar audiovisual|vautores=Alpha AB}}',cfg).text,'{{Citar audiovisual|vautores=Alpha AB}}','An unrecognized template header is preserved, not treated as its module name');
const receipt={suite:'pinned-native-vancouver-raw-argument-exception-2.21.5',runtimeSha256:sha(fs.readFileSync(file)),nativeCS1Revision:72936771,models:models.length,checks,calculations,failures,scope:'Engine and reader contracts; actual native HTML witness retained separately',wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0);

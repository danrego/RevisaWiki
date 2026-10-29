'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),{box}=require('./fixtures.cjs'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
let checks=0,calculations=0;const failures=[],eq=(a,b,message)=>{checks++;try{assert.deepEqual(a,b,message);}catch(e){failures.push({message,actual:a,expected:b});}};const rows=[];
const cases=[];
for(const value of ['', 'instrumentista_sem_vocal'])cases.push({id:'fundo-strict-'+(value||'empty'),source:box('fundo='+value),absent:['|fundo=']});
for(const value of ['Instrumentista_sem_vocal','instrumentista','solo_singer','outro','instrumentista_sem_vocal<ref>Fonte</ref>'])cases.push({id:'fundo-other-'+value,source:box('fundo='+value),retain:['fundo='+value]});
cases.push({id:'fundo-duplicate',source:box('fundo=instrumentista_sem_vocal|fundo=outro'),retain:['fundo=instrumentista_sem_vocal','fundo=outro']});
cases.push({id:'fundo-alias-unchanged',source:box('fundo=instrumentista_sem_vocal','Cientista'),retain:['fundo=instrumentista_sem_vocal']});
cases.push({id:'fundo-disabled',source:box('fundo=instrumentista_sem_vocal'),options:{infoboxes:false},retain:['fundo=instrumentista_sem_vocal']});
for(const key of ['imagem_tamanho','imagem tamanho','imagemtamanho']){
 cases.push({id:'pxpx-'+key,source:box('imagem=Foto.jpg|'+key+'=180pxpx'),absent:['180pxpx'],retain:[key+'=180px']});
 for(const value of ['0pxpx','501pxpx','180pxpx<ref>Fonte</ref>','180pxpx<!-- motivo -->'])cases.push({id:'pxpx-guard-'+key+'-'+value,source:box('imagem=Foto.jpg|'+key+'='+value),retain:[key+'='+value]});
}
cases.push({id:'pxpx-alias-conflict',source:box('imagem=Foto.jpg|imagem_tamanho=180pxpx|imagem tamanho=200px'),retain:['imagem_tamanho=180pxpx','imagem tamanho=200px']});
cases.push({id:'pxpx-unrelated-field',source:box('imagem=Foto.jpg|notas=180pxpx'),retain:['notas=180pxpx']});
cases.push({id:'pxpx-landscape-guard',source:box('imagem=Foto.jpg|imagem_tamanho=180pxpx|landscape=sim'),retain:['imagem_tamanho=180pxpx','landscape=sim']});
const end="\n'''Pessoa de teste''' é uma pessoa.\n";
cases.push({id:'local-name-positive',source:'{{Ficha de persona|nombre=Pessoa de teste}}'+end,retain:['{{Info/Biografia|nome=Pessoa de teste}}'],absent:['|nombre=']});
cases.push({id:'local-name-conflict',source:'{{Ficha de persona|nome=Pessoa A|nombre=Pessoa B}}'+end,retain:['nome=Pessoa A','nombre=Pessoa B'],absent:['|nome=Pessoa B']});
cases.push({id:'local-name-linked',source:'{{Ficha de persona|nombre=[[Pessoa de teste]]}}'+end,retain:['nombre=[[Pessoa de teste]]']});
cases.push({id:'local-name-reference',source:'{{Ficha de persona|nombre=Pessoa de teste<ref>Fonte</ref>}}'+end,retain:['nombre=Pessoa de teste<ref>Fonte</ref>']});
cases.push({id:'local-name-duplicate',source:'{{Ficha de persona|nombre=Pessoa A|nombre=Pessoa B}}'+end,retain:['nombre=Pessoa A','nombre=Pessoa B'],absent:['|nome=Pessoa B']});
cases.push({id:'local-name-independent-reference',source:'{{Ficha de persona|nombre=[[Pessoa de teste]]}}'+end+'Texto.<ref>{{Citar web|url=https://example.org/artigo|título=Documento|url-acesso=registo}}</ref>\n{{Referências}}',retain:['{{Ficha de persona|nombre=[[Pessoa de teste]]}}'],absent:['url-acesso=registo'],some:['acesso-url=registo','acessourl=registo']});
for(const item of cases){
 const options={...cfg,...item.options},r=api.calculate({kind:'adjust',source:item.source,originalSource:item.source,options});calculations++;
 eq(api.v219AutomaticResultSafety(item.source,r).accepted,true,'Restored legacy branch keeps the complete preservation gate: '+item.id);
 for(const value of item.retain||[])eq(r.text.includes(value),true,'Literal retained under the original branch guards: '+item.id+' '+value);
 for(const value of item.absent||[])eq(r.text.includes(value),false,'Only the already verified correction applies: '+item.id+' '+value);
 if(item.some)eq(item.some.some(value=>r.text.includes(value)),true,'Independent reference repair continues outside a preserved native alias');
 const second=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});calculations++;eq(second.text,r.text,'Restored branch remains idempotent: '+item.id);eq(api.v219AutomaticResultSafety(r.text,second).accepted,true,'Second action retains preservation');rows.push({id:item.id,sourceSha256:sha(item.source),candidateSha256:sha(r.text)});
}
const receipt={suite:'legacy-native-pin-compatibility-2.21.3',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Only the three reviewed revision pins may restore their existing corrections');

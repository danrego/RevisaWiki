// Reproduces finite editor-argument collisions at each inherited writer.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=process.argv[2]||process.env.REVISAWIKI_V221_BUNDLE;if(!file)throw Error('Frozen bundle argument or REVISAWIKI_V221_BUNDLE required');
const api=require(path.resolve(file)),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),pin=sha(fs.readFileSync(file)),cases=[],add=(id,before,after=before)=>cases.push({id,before,after}),full=raw=>'Texto de controle.<ref>'+raw+'</ref>\n\n{{Referências}}\n';
const spellings=['Editor-Último','ULTIMO-EDITOR','editor-último1','editor1-último'],spacings=[key=>key+'=',key=>' \t'+key+' \t= \t',key=>' '+key+' = '];
for(const [i,key]of spellings.entries())for(const [j,value]of ['Souza',' ','{{Valor fictício}}','Silva'].entries())for(let order=0;order<2;order++)for(const [k,pad]of spacings.entries()){
 const fields=[pad(key)+'Silva','ultimo-editor='+value];if(order)fields.reverse();
 add('case-space-'+i+'-'+j+'-'+order+'-'+k,'{{Citar livro|título=Obra|'+fields.join('|')+'}}');
}
for(const prefix of ['argumento|','editor-sobrenome=Pessoa|','editor-sobrenome=Pessoa|editor-sobrenome=Outra|'])
 for(const pair of ['último-editor=Silva|ultimo-editor=Souza','Editor-Último=Silva|ULTIMO-EDITOR= ','editor-último=Silva|ultimo-editor=Souza'])
 add('generic-fields-'+cases.length,'{{Citar livro|'+prefix+'título=Obra|'+pair+'}}');
for(const first of ['primeiro-editor','PRIMEIRO-EDITOR','editor-primeiro'])for(const peer of ['editor-first','editor-nome1','primeiro-editor1'])
 for(const value of ['Maria',' '])add('first-peers-'+cases.length,'{{Citar livro|título=Obra|editor-sobrenome=Silva|'+first+'=Ana|'+peer+'='+value+'}}');
add('unique-last-independent-of-first-collision','{{Citar livro|título=Obra|ultimo-editor=Silva|primeiro-editor=Ana|primeiro-editor1=Maria}}',
 '{{Citar livro|título=Obra|editor-sobrenome=Silva|primeiro-editor=Ana|primeiro-editor1=Maria}}');
add('unique-first-independent-of-last-collision','{{Citar livro|título=Obra|editor-sobrenome=Silva|ultimo-editor=Souza|primeiro-editor=Ana}}');
add('unique-two-indices','{{Citar livro|título=Obra|ultimo-editor=Silva|editor2-ultimo=Souza}}',
 '{{Citar livro|título=Obra|editor-sobrenome=Silva|editor-sobrenome2=Souza}}');
add('native-accepted-aliases-stay','{{Citar livro|título=Obra|editor-last=Silva|editor-first=Ana}}');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Teste de contrato',contentModel:'wikitext',singleLineCitations:false,captureTrace:true},results=[],failures=[];
let checks=0,calculateCalls=0,gateCalls=0;
for(const row of cases){const source=full(row.before),expected=full(row.after),result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculateCalls++;
 const gate=api.v219AutomaticResultSafety(source,result);gateCalls++;const record={...row,sourceSha256:sha(source),expectedSha256:sha(expected),outputSha256:sha(result.text),accepted:gate.accepted===true,gate,changes:result.changes};
 try{if(!gate.accepted)throw Error('gate refused');checks++;if(result.text!==expected){record.actual=result.text;throw Error('independent literal endpoint differed');}checks++;
 const second=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});calculateCalls++;const gate2=api.v219AutomaticResultSafety(result.text,second);gateCalls++;
 if(!gate2.accepted||second.text!==result.text)throw Error('second endpoint failed');checks++;record.status='passed';}catch(error){record.status='failed';record.error=error.message;record.trace=result.trace;failures.push(record);}results.push(record);
}
if(sha(fs.readFileSync(file))!==pin)throw Error('Bundle changed');
const report={suite:'citation-writer-guards',version:api.version,bundleSha256:pin,casesSha256:sha(JSON.stringify(cases)),
    cases:cases.length,checks,actualCalculateCalls:calculateCalls,actualFinalGateCalls:gateCalls,
    status:failures.length?'investigation-required':'passed',failures,results,wikipediaWrites:0,
    scope:'Actual unmodified bundle; independent literal endpoints, case and spacing, native/imported aliases, blanks and positional arguments'};
if(process.env.REVISAWIKI_CITATION_WRITER_REPORT)fs.writeFileSync(process.env.REVISAWIKI_CITATION_WRITER_REPORT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,results:undefined,failures:failures.slice(0,5)}));if(failures.length)process.exitCode=1;

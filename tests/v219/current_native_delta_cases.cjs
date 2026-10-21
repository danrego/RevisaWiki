'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2);
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(n=>path.resolve(__dirname,'../../dist/2.19.0',n)));
const sources=[
 '{{Info/Concurso musical|nome=Concurso fictício|logo=[[Ficheiro:Exemplo.svg|200px|Legenda literal]]}}',
 '{{Info/Concurso musical|nome=Concurso fictício|imagem=Exemplo.svg|tamanho=900px}}',
 '{{Info/Biografia|nome=Pessoa fictícia|sepultamento=}}',
 '{{Info/Biografia|nome=Pessoa fictícia|sepultamento=[[Local fictício]]}}',
 '{{Info/Ponte|nome=Tema fictício|nome_anterior=Nome antigo|reconstrução=1900}}',
 '{{Info/Ponte|nome=Tema fictício|nome_anterior=|reconstrução=}}',
 '{{Info/Militar|nome=Pessoa fictícia|módulo={{Info|título=Dados}}}}'
];
const report={kind:'current-native-delta-existing-preservation-controls',status:'passed',cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,limits:['These controls verify the existing no-op boundary for supplied fields. They do not add parameter support or assert general rendering equivalence for changed native implementations.']};
for(const file of files){const api=require(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,endMatter:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false};
 for(const source of sources){const row={bundle:path.basename(file),runtimeSha256:sha(fs.readFileSync(file)),sourceSha256:sha(source),expectedEndpointSha256:sha(source),status:'passed'};try{const actual=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});row.actualEndpointSha256=sha(actual.text);report.checks++;assert.equal(actual.text,source,'Supplied values, nested code and unproved image consumer remain byte-identical');report.checks++;assert.deepEqual(actual.preservation,[]);report.checks++;assert(api.v219AutomaticResultSafety(source,actual).accepted);report.checks++;assert.equal(api.safeComposition(source,actual.text,cfg),'');}catch(error){row.status='failed';report.status='failed';report.failures.push({sourceSha256:sha(source),error:error.message});}report.cases.push(row);}
}report.caseCount=report.cases.length;console.log(JSON.stringify(report,null,2));if(report.status!=='passed')process.exitCode=1;

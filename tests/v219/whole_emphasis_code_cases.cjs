'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),files=process.argv.slice(2).map(file=>path.resolve(file));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={kind:'whole-multiline-emphasis-code-owner-full-actions',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0},eq=(a,b,message)=>{report.checks++;assert.deepEqual(a,b,message);},ok=(condition,message)=>{report.checks++;assert.ok(condition,message);};
const ref=(name,key)=>'<ref name="'+name+'">{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|'+key+'=Exemplo}}</ref>',
 payloads=[
 ['two-native-refs',ref('primeira','last')+'\n'+ref('segunda','ultimo')],
 ['two-native-citations','{{Citar web|título=Fonte literal|pág=2}}\n{{Citar web|título=Outra fonte|pág=3}}'],
 ['foreign-media-and-native-ref','[[Archivo:Exemplo.svg|sinmarco|Legenda literal.]]\n'+ref('fonte','last')],
 ['table-and-native-ref','{| class="wikitable"\n! Coluna\n|-\n| Valor literal\n|}\n'+ref('fonte','last')],
 ['unclosed-html-between-complete-objects',ref('primeira','last')+'\n<span>\n'+ref('segunda','ultimo')],
 ['biographical-code-draft','{{Short description|Texto literal}}{{Infobox person|name=Pessoa fictícia}}\n'+"'''Pessoa fictícia''' é uma pessoa com texto literal."]
 ];
for(const file of files){const a=require(file),bundle=path.basename(file),options={...a.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticTopicPortals:false,automaticBiographyPortals:false,biographyPortal:false},optionsSha256=sha(JSON.stringify(options)),calc=source=>a.calculate({kind:'adjust',source,options});report.bundles.push({bundle,runtimeSha256:sha(fs.readFileSync(file)),helperInjection:false});
 const test=(id,source,expected,fn,execution='full-action')=>{const descriptor={bundle,id,execution,sourceSha256:sha(source),optionsSha256,...(execution==='full-action'?{expectedEndpointSha256:sha(expected),canonicalDescriptorSha256:sha(JSON.stringify({source,options,expected}))}:{})};try{fn();report.cases.push({...descriptor,status:'passed'});}catch(error){report.status='failed';report.cases.push({...descriptor,status:'failed'});report.failures.push({bundle,id,message:error.message});}};
 for(const delimiter of ["''","'''","'''''"])for(const[id,payload]of payloads)for(const padding of ['', ' \t\r\n']){
  const source=padding+delimiter+payload+delimiter+padding;
  test('protected-'+delimiter.length+'-'+id+'-'+sha(padding).slice(0,6),source,source,()=>{
   const ranges=a.v219WholeQuotedCodeRanges(source);eq(ranges,[{start:padding.length,end:source.length-padding.length,kind:'whole-quoted-code'}],'Only the exact whole structural-code owner is shielded');
   const first=calc(source);eq(first.text,source,'The ordinary full action retains every byte in the complete emphasized code sample');eq(calc(first.text).text,source,'A second click cannot deduplicate or activate the protected example');ok(!(first.changes||[]).length,'The protected example reports no applied adjustment');
  });
 }
 for(const delimiter of ["''","'''","'''''"]){
  const source=delimiter+'Texto sobre [[Tema fictício|Tema fictício]].\nOutro texto literal.'+delimiter,expected=source.replace('[[Tema fictício|Tema fictício]]','[[Tema fictício]]');
  test('ordinary-prose-'+delimiter.length,source,expected,()=>{eq(a.v219WholeQuotedCodeRanges(source),[],'Ordinary prose emphasis is not a structural code owner');eq(calc(source).text,expected,'An independent safe prose-link repair remains reachable');eq(calc(expected).text,expected,'The ordinary prose repair is idempotent');});
 }
 for(const[open,close]of [["''","'''"],["'''","''"],["''''","''''"],["''''''","''''''"]]){
  const source=open+payloads[0][1]+close;
  test('mismatched-'+open.length+'-'+close.length,source,source,()=>eq(a.v219WholeQuotedCodeRanges(source),[],'Unmatched or unregistered apostrophe runs cannot invent a whole-code delimiter'),'helper-boundary-only');
 }
}
report.caseCount=report.cases.length;report.fullActionCases=report.cases.filter(row=>row.execution==='full-action').length;report.helperBoundaryCases=report.cases.length-report.fullActionCases;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

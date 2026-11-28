'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function run(api){const options={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},rows=[];
 const source='Texto.<ref>{{cite APOD|title=Documento|date=24 Junho 2002|access-date=8 Março 2016|apod=020624}}</ref>\n\n{{Referências}}',result=api.calculate({kind:'adjust',source,originalSource:source,options}),count=api.v2222CitationEndpointCount(source,result.text,options);
 assert(count?.exact);assert.equal(count.count,14);assert.equal(count.count,count.events.reduce((n,e)=>n+e.count,0));
 for(const key of ['url','obra','publicado','editor-sobrenome1','editor-nome1','editor-sobrenome2','editor-nome2'])assert(count.events.some(e=>e.kind==='parameter-add'&&e.key===key),'New native metadata counted: '+key);
 assert.equal(api.v2222CitationEndpointCount(source,result.text.replace('título=Documento','título=Outra obra'),options),null,'A changed title cannot borrow the import certificate');
 assert.equal(api.v2222CitationEndpointCount(source,result.text+'Outra frase.',options),null,'Unowned outside prose must remain exact');
 assert.equal(api.v2222CitationEndpointCount(source,result.text.replace('Nemiroff','Outro'),options),null,'Implicit source editor is checked, not guessed');
 assert.equal(api.v2222CitationEndpointCount(source,result.text.replace('ap020624.html','ap020625.html'),options),null,'The exact native date/selector URL stays bound');
 rows.push({id:'finite-apod-overlapping-import-and-date',passed:true,count:count.count,exact:count.exact});
 const other='Texto.<ref>{{Cite Instagram|postid=Example123|user=exampleaccount|title=Documento|author=Instituição|date=9 de setembro de 2026}}</ref>\n\n{{Referências}}',out=api.calculate({kind:'adjust',source:other,originalSource:other,options}),instagram=api.v2222CitationEndpointCount(other,out.text,options);assert(instagram?.exact);assert.equal(instagram.count,9);assert.equal(api.v2222CitationEndpointCount(other,out.text.replace('Instituição [@exampleaccount]','Instituição'),options),null,'The supplied account credit is preserved');rows.push({id:'finite-local-instagram-credit-and-url',passed:true,count:instagram.count,exact:instagram.exact});
 return{kind:'lightweight-source-bound-citation-endpoint-count',version:api.version,calculations:2,positiveCases:2,negativeCases:5,results:rows,repairPipelineReplayedByCounter:false,wikipediaWrites:0};}
if(require.main===module){const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.22.2/RevisaWiki_v2_22_2.js'),report=run(require(file));if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
module.exports={run};

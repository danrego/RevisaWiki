'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),root=path.resolve(__dirname,'../..'),sha=v=>crypto.createHash('sha256').update(v).digest('hex'),files=process.argv.slice(2).map(f=>path.resolve(f));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(f=>path.join(root,'dist/2.19.0',f)));
const report={kind:'reference-collector-source-order-and-url-label-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
for(const file of files){const a=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(a.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Assunto fictício',contentModel:'wikitext'},cfg={...base,references:true,endMatter:true,endSectionOrder:true};report.bundles.push({bundle,runtimeSha256:sha(fs.readFileSync(file))});
 function test(id,source,expected,options){const row={bundle,id,sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(options)),expectedEndpointSha256:sha(expected),scenarioSha256:sha(JSON.stringify({source,options,expected}))};report.cases.push(row);try{const out=a.calculate({kind:'adjust',source,options});eq(out.text,expected,'The full action reaches the prewritten source-order endpoint');eq(a.calculate({kind:'adjust',source:out.text,options}).text,expected,'No later click moves the collector');row.actualEndpointSha256=sha(out.text);row.appliedIds=out.changes.map(c=>c.id);row.status='passed';}catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:e.message});}}
 for(const eol of ['\n','\r\n'])for(const renderer of ['{{Referências}}','{{Referências|nível=0}}']){
  const source=['Texto.<ref>Fonte A.</ref>','','== Bibliografia ==','* Obra.<ref>Fonte B.</ref>','',renderer,'','== Ligações externas ==','* [https://example.org Página oficial]',''].join(eol);
  test('bibliography-reference/'+sha(source),source,source,cfg);
 }
 for(const title of ['Bibliografia','Leitura complementar','Ligações externas']){
  const source='Texto.<ref>Fonte A.</ref>\n\n== '+title+' ==\n* Item.<ref>Fonte B.</ref>\n\n[[Categoria:Assunto fictício]]\n';
  const expected=source.replace('[[Categoria:Assunto fictício]]','{{Referências}}\n\n[[Categoria:Assunto fictício]]');
  test('missing-collector/'+title,source,expected,{...cfg,headings:true});
 }
 for(const boundary of ["''",'"']){
  const source='Texto.<ref>[https://example.org/caminho/'+boundary+'100 título literal'+boundary+']</ref>\n{{Referências}}';
  test('ambiguous-url-label/'+sha(source),source,source,{...base,bareReferences:true,citations:true});
 }
 for(const separator of ['\u00a0','\u2003','\t','\n']){
  const source='Texto.<ref>[https://example.org/caminho/'+separator+'Título literal]</ref>\n{{Referências}}';
  test('nonliteral-url-label-separator/'+sha(separator),source,source,{...base,bareReferences:true,citations:true});
 }
 const simple='Texto.<ref>[https://example.org/ Título literal]</ref>\n{{Referências}}';
 test('ordinary-separated-url-label',simple,simple.replace('[https://example.org/ Título literal]','{{Citar web|url=https://example.org/|título=Título literal}}'),{...base,bareReferences:true,citations:true});
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

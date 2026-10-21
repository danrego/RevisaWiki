'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(p=>path.resolve(p)),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(f=>path.join(root,'dist/2.19.0',f)));
const report={schemaVersion:1,kind:'quoted-reference-first-action-convergence',runnerSha256:hash(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),citations:true,dates:true,references:true,moveNamedRefs:true,bareReferences:true,automaticCitationDateValues:true,automaticParameterNames:true,syntaxRepairs:true,structuralRepairs:true,markup:true,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext'};
 report.bundles.push({bundle,version:api.version,sha256:hash(bytes),bytes:bytes.length});
 const test=(id,source,expected,options={})=>{
  const actualOptions={...cfg,...options},scenarioSha256=hash(JSON.stringify(canonical({source,expected,options:actualOptions,kind:'adjust'}))),row={id,bundle,scenarioSha256,sourceSha256:hash(source),expectedEndpointSha256:hash(expected),optionsSha256:hash(JSON.stringify(canonical(actualOptions))),intentSha256:hash(id.replace(/-option-off-/,'-')),kind:source===expected?'boundary':'positive',expectedRepair:source!==expected,status:'passed'};report.cases.push(row);
  try{const r=api.calculate({kind:'adjust',source,options:actualOptions});eq(r.text,expected,'The first production action matches the independently written endpoint');eq(api.calculate({kind:'adjust',source:r.text,options:actualOptions}).text,r.text,'No delayed change on the second action');eq(r.preservation||[],[],'No preservation finding is suppressed');eq(api.preservationAudit(source,r.text,actualOptions),[],'Visible labels and facts remain equivalent');eq(api.safeComposition(source,r.text,actualOptions),'','Complete-object guards approve the actual result');row.actualEndpointSha256=hash(r.text);row.appliedIds=(r.changes||[]).map(c=>c.id);}catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:e.message});}
 };
 // Native CS1 accepts the exact DeadURL value no. Formatting a date does
 // not authorize changing that independent accepted field.
 const raw='{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|arquivodata=24/04/2022|urlmorta=no}}',native=raw.replace('24/04/2022','24 de abril de 2022');
 for(const [name,open,close]of [['straight','"','"'],['curly','“','”'],['guillemet','«','»']])for(const preceding of ['', '{| class="wikitable"\n! scope="col" | Coluna\n|-\n| style="text-align:left" | Valor literal\n|}\n\n'])for(const refName of ['fonte','origem-2']){
  const early='<ref name="'+refName+'" />',late='<ref name="'+refName+'">'+raw+'</ref>',source='Texto.'+early+'\n\n'+preceding+open+'Uma afirmação longa.'+late+' A fala prossegue.'+close+'\n\n{{Referências}}',expected='Texto.<ref name="'+refName+'">'+native+'</ref>\n\n'+preceding+open+'Uma afirmação longa.'+early+' A fala prossegue.'+close+'\n\n{{Referências}}';
  test('prose-quotation-'+name+'-'+(preceding?'table':'plain')+'-'+refName,source,expected);
 }
 const wrappers=[['straight',s=>'"'+s+'"'],['curly',s=>'“'+s+'”'],['guillemet',s=>'«'+s+'»'],['italic',s=>"''"+s+"''"],['bold',s=>"'''"+s+"'''"],['bold-italic',s=>"'''''"+s+"'''''"],['quotation-template',s=>'{{Citação|'+s+'}}'],['fence',s=>'```wikitext\n'+s+'\n```'],['tilde-fence',s=>'~~~wikitext\n'+s+'\n~~~']];
 for(const [name,wrap]of wrappers){
  test('whole-quoted-template-'+name,wrap(raw),wrap(raw));
  const image='[[File:Fictional image.jpg|thumb|A literal caption.]]';test('whole-quoted-image-'+name,wrap(image),wrap(image));
 }
 for(const title of ['Título literal',"''Título literal.''",'"Título literal"',"'Título literal'",'“Título literal”','«Título literal»',"'''Título literal'''","O título d'água",'Título com &amp; símbolo','Título com {{!}} token','Título com {{Modelo fictício}} token','Título com <nowiki>{{Exemplo}}</nowiki> token']){
  // The source-bound bare-link plan deliberately excludes markup and
  // entities whose rendered title has no independent literal certificate.
  const source='Texto.<ref>[https://example.invalid/fonte '+title+']</ref>\n{{Referências}}',eligible=!/[{}<>]|'{2}|&(?:#\d+|#x[0-9a-f]+|[a-z]+);/i.test(title),expected=eligible?'Texto.<ref>{{Citar web|url=https://example.invalid/fonte|título='+title+'}}</ref>\n{{Referências}}':source;
  test('bare-label-'+hash(title).slice(0,12),source,expected);
  test('bare-label-option-off-'+hash(title).slice(0,12),source,source,{bareReferences:false});
 }
 for(const [name,wrap]of wrappers){const source=wrap('<ref>[https://example.invalid/fonte "Título literal"]</ref>');test('quoted-reference-code-'+name,source,source);}
 eq(hash(fs.readFileSync(file)),hash(bytes),'Runtime remains immutable throughout this run');
}
report.distinctSemanticScenarios=new Set(report.cases.map(r=>r.scenarioSha256)).size;
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

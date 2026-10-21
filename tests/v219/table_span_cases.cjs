'use strict';
// Positive spans can create implied native HTML rows. The source's number of
// explicit row markers is not an independent bound for changing their value.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex'),root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const contract=fs.readFileSync(path.join(__dirname,'table_span_contract.json')),
 report={schemaVersion:1,kind:'native-table-span-preservation',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),contractSha256:hash(contract),bundles:[],cases:[],distinctScenarioCount:0,checks:0,failures:[],wikipediaWrites:0,networkRequests:0,helperInjection:false},identities=new Set(),
 canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value,
 eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
const scenarios=[];
const table=(rows,span,from=0,colspan=1)=>'{| class="wikitable"\n'+Array.from({length:rows},(_,index)=>'|-\n'+(index===from?'| rowspan="'+span+'"'+(colspan>1?' colspan="'+colspan+'"':'')+' | Célula literal\n| Valor '+index:index<from?'| Valor '+index+' || Outro valor':'| Valor '+index)).join('\n')+'\n|}';
for(const rows of [1,2,3,5,10])for(const from of [...new Set([0,rows-1])])for(const span of [0,1,rows-from,rows-from+1,rows+3,99,1000])for(const colspan of [1,2]){
 const source=table(rows,span,from,colspan);scenarios.push({id:'literal-'+rows+'-'+from+'-'+span+'-'+colspan,source,expected:source});
}
for(const source of [
 '{| class="wikitable"\n| rowspan="3" | Célula literal\n| Outro valor\n|-\n| Final\n|}',
 '{| class="wikitable"\n| rowspan="0" | Célula literal\n| Outro valor\n|-\n| Final\n|}',
 '{| class="wikitable"\n| rowspan="6| Célula literal\n| Outro valor\n|-\n| Final\n|}',
 '{| class="wikitable"\n| rowspan="4" | Célula literal\n| Outro valor\n|-\n|\n{| class="wikitable"\n| Interna\n|}\n|}',
 '<table><thead><tr><th rowspan="0">Cabeçalho</th><th>Outro</th></tr></thead><tbody><tr><td>Corpo</td><td>Final</td></tr></tbody></table>',
 '<table><tbody><tr><td rowspan="9">Célula literal</td><td>Valor</td></tr><tr><td>Final</td></tr></tbody><tbody><tr><td>Segundo grupo</td></tr></tbody></table>'
])scenarios.push({id:'boundary-'+hash(source).slice(0,16),source,expected:source});
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',tableChecks:true,automaticTableRepairs:true,markup:true,syntaxRepairs:true,structuralRepairs:true,tableAccessibility:false,minorBaseConfirmed:true};
 report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 for(const fixture of scenarios)for(const mode of ['isolated','default']){
  const options=mode==='default'?{...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',tableAccessibility:false,minorBaseConfirmed:true}:base,
   identity=hash(JSON.stringify(canonical({source:fixture.source,expected:fixture.expected,options,kind:'adjust'}))),row={id:fixture.id,mode,bundle,scenarioSha256:identity,status:'passed'};
  identities.add(identity);report.cases.push(row);
  try{
   const first=api.calculate({kind:'adjust',source:fixture.source,originalSource:fixture.source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
   eq(first.text,fixture.expected,'No explicit positive or zero rowspan is numerically rewritten');eq(second.text,fixture.expected,'The endpoint is idempotent');eq(first.preservation||[],[],'No table value is lost');
   eq((first.changes||[]).filter(change=>change.id==='tableSpanRepairs').length,0,'No retired numeric span write is reported');
   const visible=api.v217VisibleReviewPlan({result:first,source:first.text,options});
   eq(visible.findings.filter(finding=>finding.code==='table-rowspan-overflow'),[],'Implied native rows do not create a visible defect alert');
   eq(api.safeComposition(fixture.source,fixture.expected,options),'','The exact original table remains selectable');
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:fixture.id,mode,message:error.message});}
 }
 const incomplete=api.calculate({kind:'adjust',source:'{| class="wikitable"\n| Literal',options:{...base,syntaxRepairs:false,automaticTableRepairs:false,structuralRepairs:false}});
 const pending=api.v217VisibleReviewPlan({result:incomplete,source:incomplete.text,options:{...base,syntaxRepairs:false,automaticTableRepairs:false,structuralRepairs:false}});
 eq(pending.findings.some(finding=>['table-unclosed','unclosed-table'].includes(finding.code)),true,'A genuinely unclosed table remains visible');
 eq(hash(fs.readFileSync(file)),hash(bytes),'The actual bundle remains immutable');
}
report.distinctScenarioCount=identities.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

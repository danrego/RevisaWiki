'use strict';
// The source-level renderer producer must honor the same opaque-identity
// boundary as the later, masked reference stages. Ordinary conversion remains
// a positive endpoint, not an expectation changed to a no-op.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)throw new Error('Pass immutable runtimes');
const report={kind:'source-renderer-quarantine-composition',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),options={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',references:true,multilingual:true,structuralRepairs:true},calculate=source=>api.calculate({kind:'adjust',source,options});
 report.bundles.push({bundle,sha256:sha(bytes)});
 const rows=[
  [
    "ordinary-positive",
    "Texto.<ref>Fonte literal.</ref>\n\n== Referências ==\n{{Reflist}}",
    "Texto.<ref>Fonte literal.</ref>\n\n== Referências ==\n{{Referências|nível=0}}"
  ],
  [
    "literal-cr-identity",
    "Texto.<ref name=\"alpha&#13;beta\">Fonte literal.</ref>\n\n== Referências ==\n{{Reflist}}",
    "Texto.<ref name=\"alpha&#13;beta\">Fonte literal.</ref>\n\n== Referências ==\n{{Referências|nível=0}}"
  ],
  [
    "literal-nbsp-identity",
    "Texto.<ref name=\"alpha&nbsp;beta\">Fonte literal.</ref>\n\n== Referências ==\n{{Reflist}}",
    "Texto.<ref name=\"alpha&nbsp;beta\">Fonte literal.</ref>\n\n== Referências ==\n{{Referências|nível=0}}"
  ],
  [
    "opaque-native-note",
    "Texto.{{Refn|name={{Nome calculado}}|Fonte literal.}}\n\n== Referências ==\n{{Reflist}}",
    "Texto.{{Refn|name={{Nome calculado}}|Fonte literal.}}\n\n== Referências ==\n{{Referências|nível=0}}"
  ],
  [
    "generated-note-unknown-owner",
    "Texto.{{Sfn|Alfa|2001}}\n{{Modelo desconhecido|Dado literal}}\n\n== Referências ==\n{{Reflist}}",
    "Texto.{{Sfn|Alfa|2001}}\n{{Modelo desconhecido|Dado literal}}\n\n== Referências ==\n{{Referências|nível=0}}"
  ],
  [
    "generated-note-named-dependency",
    "Texto.{{Sfn|Alfa|2001}}<ref name=\"FOOTNOTEAlfa2001\" />\n\n== Referências ==\n{{Reflist}}",
    "Texto.{{Sfn|Alfa|2001}}<ref name=\"FOOTNOTEAlfa2001\" />\n\n== Referências ==\n{{Referências|nível=0}}"
  ]
];
 for(const [id,source,target]of rows){
  const expected=target??source,row={bundle,id,status:'passed',executionScope:'complete-action',sourceSha256:sha(source),expectedEndpointSha256:sha(expected),optionsSha256:sha(JSON.stringify(options)),scenarioSha256:sha(JSON.stringify({source,expected,options}))};
  try{
   const result=calculate(source);row.actualEndpointSha256=sha(result.text);row.appliedRuleIds=result.changes.map(item=>item.id);
   eq(result.text,expected,'The complete action respects the original reference dependency scope');
   eq(result.preservation,[],'The actual complete action has no retention finding');
   eq(api.preservationAudit(source,expected,options),[],'The declared endpoint preserves the supplied reference subsystem');
   eq(api.safeComposition(source,expected,options),'','The same endpoint passes the production composition guard');
   eq(calculate(expected).text,expected,'The endpoint finishes on the first click');
  }catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:error.message});}
  report.cases.push(row);
 }
 eq(sha(fs.readFileSync(file)),sha(bytes),'The actual immutable runtime has not changed');
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

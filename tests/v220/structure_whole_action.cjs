'use strict';
// Exercise the actual public adjust action, without injecting helper code.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2),fixtures=require('./structure_fixtures.json');
if(!files.length)throw new Error('Provide built bundle paths.');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),report={schemaVersion:1,kind:'structure-whole-action',status:'passed',cases:[],failures:[],checks:0,networkRequests:0,wikipediaWrites:0};
for(const file of files){const api=require(path.resolve(file)),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Assunto de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false},bundleSha256=sha(fs.readFileSync(file));
 const calculate=s=>api.calculate({kind:'adjust',source:s,options:cfg}),check=(condition,message)=>{report.checks++;assert.ok(condition,message);};
 function run(id,input,expected,{literal=false}={}){const row={id,bundleSha256,sourceSha256:sha(input),status:'passed',helperInjection:false};try{const expectedResult=literal?{text:expected}:calculate(expected),actual=calculate(input);check(actual.text===expectedResult.text,id+' differs from repaired endpoint: '+JSON.stringify({actual:actual.text,expected:expectedResult.text}));check(actual.localCompositionSafety?.accepted!==false,id+' composition refused');check(calculate(actual.text).text===actual.text,id+' non-idempotent action');row.appliedSha256=sha(actual.text);row.ruleIds=actual.changes.map(r=>r.id);row.accepted=actual.localCompositionSafety?.accepted!==false;}catch(e){row.status='failed';row.error=e.message;report.failures.push(row);}report.cases.push(row);}
 for(const [id,input,expected]of fixtures.pairs){run(id,input,expected);run(id+'-crlf',input.replace(/\n/g,'\r\n'),expected.replace(/\n/g,'\r\n'));for(const [kind,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="text">'+s+'</syntaxhighlight>'],['comment',s=>'<!--'+s+'-->']]){const s=wrap(input);run(id+'-literal-'+kind,s,s,{literal:true});}}
 for(const [id,s]of fixtures.negatives)run('negative-'+id,s,s,{literal:true});
 const composition=fixtures.pairs.filter(([id])=>['spelling','markdown','external-pipe','external-newline','external-protocol','link-closer','center','big','font'].includes(id));
 for(const [a,as,ae]of composition)for(const [b,bs,be]of composition)if(a!==b)run('composition-'+a+'-'+b,as+'\n'+bs,ae+'\n'+be);
}
report.status=report.failures.length?'failed':'passed';process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;

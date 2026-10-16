'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const scripts=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const report={version:'2.12.0',kind:'complete-row-and-wrapper-occurrence-boundaries',status:'passed',frozenFiles:candidate?.manifest.files,runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
const canonical='<div style="max-width:100%;min-width:0;overflow-x:auto;">\n';
for(const script of scripts){const api=require(script),bundle=path.basename(script);
 const run=(id,before,after,count)=>{try{const result=api.v211RetainedAdjustments(before,after);eq(result.exact,true,'The complete endpoint diff has a verified count');eq(result.count,count,'Every separate operation has one entry');eq(result.events.length,count,'The ledger and headline agree');eq(api.v211RetainedAdjustments(after,after).count,0,'An unchanged second endpoint has no new correction');report.cases.push({id,bundle,status:'passed'});}catch(error){report.status='failed';report.failures.push({id,bundle,message:candidate?candidate.sanitized(error.message):String(error.message)});}};
 for(const newline of ['\n','\r\n'])for(const payload of ['1200','{{formatnum:1200}}','data-sort-value="1200" | Exemplo'])for(const spacing of ['',' \t']){
  const row=spacing+'|-'+spacing+newline,head='{| class="wikitable sortable"'+newline+'! A !! B'+newline,tail='| '+payload+' || 2'+newline+'|}'+newline;
  run('one-empty-row '+JSON.stringify([newline,payload,spacing]),head+row+row+tail,head+row+tail,1);
  run('two-empty-rows '+JSON.stringify([newline,payload,spacing]),head+row+row+row+tail,head+row+tail,2);
  run('empty-final-row '+JSON.stringify([newline,payload,spacing]),head+row+tail.replace('|}'+newline,row+'|}'+newline),head+row+tail,1);
 }
 const table='{| class="wikitable" style="width:1200px"\n! A !! B\n|-\n| 1 || 2\n|}\n';
 for(const prefix of ['', 'Introdução.\n\n'])for(const suffix of ['', '\nTexto posterior.\n']){
  const before=prefix+table+suffix,after=prefix+canonical+table+'</div>\n'+suffix;
  run('one-canonical-wrapper '+JSON.stringify([prefix,suffix]),before,after,1);
  run('canonical-wrapper-and-link '+JSON.stringify([prefix,suffix]),'[[Teste|Teste]]\n'+before,'[[Teste]]\n'+after,2);
 }
 run('two-independent-wrappers',table+'Texto.\n'+table,canonical+table+'</div>\nTexto.\n'+canonical+table+'</div>\n',2);
 run('wrapper-and-row-removal',table.replace('|-\n','|-\n|-\n'),canonical+table+'</div>\n',2);
 run('wrapper-and-independent-cell-change',table,canonical+table.replace('| 1 || 2','| 1 || 3')+'</div>\n',2);
 run('inherited-unextended-paired-markup','Texto.','<div class="noresize" style="overflow:auto;">\nTexto.\n</div>',1);
 run('unchanged-canonical-wrapper',canonical+table+'</div>\n',canonical+table+'</div>\n',0);
 const referenceBefore='<ref group="nota" name="n"/>\n<references group="nota" group="nota"><ref name="n">Definição literal.</ref></references>',referenceAfter='<ref name="n" group="nota" />\n<references group="nota"><ref name="n">Definição literal.</ref></references>';
 run('reference-opener-order-and-renderer-duplicate',referenceBefore,referenceAfter,2);
 run('same-literal-definition-opener-order','<ref group="nota" name="n">Corpo preservado.</ref>','<ref name="n" group="nota" >Corpo preservado.</ref>',1);
 for(const [id,after]of [['changed-reference-name',referenceAfter.replace('name="n" group=','name="m" group=')],['changed-reference-group',referenceAfter.replace('group="nota" />','group="outra" />')],['unknown-reference-attribute',referenceAfter.replace('group="nota" />','group="nota" follow="n" />')]]){
  try{const result=api.v211RetainedAdjustments(referenceBefore,after);eq(result.events.some(event=>event.kind==='reference-opener-layout'),false,'Changed identities or unknown attributes cannot borrow the finite permutation contract');report.cases.push({id,bundle,status:'passed'});}catch(error){report.status='failed';report.failures.push({id,bundle,message:candidate?candidate.sanitized(error.message):String(error.message)});}
 }

 for(const [id,open,close]of [['indented-row-outside-table','',''],['literal-code-block','<pre>','</pre>'],['unknown-template','{{Exemplo|','}}'],['reference-body','<ref>','</ref>']]){
  const body='{| class="wikitable"\n! A !! B\n \t|- \t\n \t|- \t\n| A || B\n|}\n',before=id==='indented-row-outside-table'?'Texto.\n \t|- \t\n \t|- \t\nFim.':open+body+close,after=before.replace(' \t|- \t\n \t|- \t\n',' \t|- \t\n');
  try{const result=api.v211RetainedAdjustments(before,after);eq(result.exact,false,'A row-looking deletion outside a confirmed literal table is not assigned an invented total');eq(result.count,null,'The uncertain endpoint remains explicitly uncounted');report.cases.push({id,bundle,status:'passed'});}catch(error){report.status='failed';report.failures.push({id,bundle,message:candidate?candidate.sanitized(error.message):String(error.message)});}
 }

}
const directory=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'artifacts/v2120/dev_count');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'count_boundaries_v212.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.status!=='passed')process.exitCode=1;

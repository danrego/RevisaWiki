'use strict';
// Receipt instrumentation only. It does not calculate or change an endpoint.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function begin(report,runtimeFiles,contractFiles,runnerFile){
 const files=[...new Set([...runtimeFiles,...runtimeFiles.map(file=>path.join(path.dirname(file),'RevisaWiki_v2_19_0_dados.js')).filter(file=>fs.existsSync(file)),...contractFiles,runnerFile,__filename])];
 const pins=()=>files.map(file=>({file:path.basename(file),sha256:hash(fs.readFileSync(file)),bytes:fs.statSync(file).size}));
 const before=pins();let requests=0;
 globalThis.fetch=function(){requests++;throw Error('Network disabled in local reference receipt runner');};
 globalThis.XMLHttpRequest=class{constructor(){requests++;throw Error('XMLHttpRequest disabled in local reference receipt runner');}};
 report.networkRequests=0;report.wikipediaWrites=0;report.networkBlocked=true;
 report.contracts=contractFiles.map(file=>({file:path.basename(file),sha256:hash(fs.readFileSync(file))}));
 report.contractSha256=hash(Buffer.concat(contractFiles.map(file=>fs.readFileSync(file))));
 report.inputPinsBefore=before;report.bundles=runtimeFiles.map(file=>{const data=path.join(path.dirname(file),'RevisaWiki_v2_19_0_dados.js');return{file:path.basename(file),sha256:hash(fs.readFileSync(file)),runtimeSha256:hash(fs.readFileSync(file)),bytes:fs.statSync(file).size,...(fs.existsSync(data)?{dataSha256:hash(fs.readFileSync(data))}:{})};});
 return{
  whole(row,source,options,expected,intent){Object.assign(row,{evidenceKind:'whole-action',intent,sourceSha256:hash(source),optionsSha256:hash(JSON.stringify(options)),expectedEndpointSha256:hash(expected),scenarioSha256:hash(JSON.stringify({source,options,expected})),contractSha256:report.contractSha256});},
  finish(){report.networkRequests=requests;report.wikipediaWrites=0;report.inputPinsAfter=pins();report.inputPinsUnchanged=JSON.stringify(before)===JSON.stringify(report.inputPinsAfter);if(requests||!report.inputPinsUnchanged){report.status='failed';report.failures.push({id:'receipt-input-integrity',error:requests?'Network invocation was blocked':'An executed runtime, data, contract or runner changed'});}}
 };
}
module.exports={begin};

'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const names=['v220CitationPlan','v220CitationPlanProof','v220CitationCall','v220CitationFields','v220CitationRefTagEdits',
'v220CitationDefinitionInventory','v220FilterReferenceFindings','v220FilterCitationSuggestions','v220HeadingReferenceRequests','v220HeadingReferenceHtmlProof'];
module.exports=function load(file,preview=false){
 file=path.resolve(file);const api=require(file);if(names.every(n=>typeof api[n]==='function'))return {api,preview:false};
 if(!preview)throw new Error('Use a built 2.20 bundle, or --allow-preview during development.');
 const source=fs.readFileSync(file,'utf8'),marker='    const api = {',fragment=fs.readFileSync(path.resolve(__dirname,'../../src/v2_20/citation_repairs.js'),'utf8');
 if(source.split(marker).length!==2)throw new Error('Unexpected runtime export boundary.');
 const sandbox={module:{exports:{}},exports:{},require:createRequire(file),__dirname:path.dirname(file),__filename:file,
 console,Buffer,setTimeout,clearTimeout,TextEncoder,URL};
 vm.runInNewContext(source.replace(marker,fragment+'\n'+marker+names.join(',')+','),sandbox,{filename:path.basename(file)+'.local-citation-preview',timeout:30000});
 return {api:sandbox.module.exports,preview:true};
};

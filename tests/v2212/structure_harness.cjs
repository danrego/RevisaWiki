'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=path.resolve(__dirname,'../..');
let entry=process.env.REVISAWIKI_CURRENT_CORE||path.join(root,'dist/2.21.2/RevisaWiki_v2_21_2.js');
if(!fs.existsSync(entry))entry=path.join(root,'dist/2.21.1-installation.1/RevisaWiki_v2_21_1_completo.js');
let code=fs.readFileSync(entry,'utf8');
const methods=['v2212StructurePlan','v2212StructureProof','v2212StructurePrerequisitePlan','v2212StructurePrerequisiteProof','v2212StructureFileRequests','v24SyntaxHash','v2212StructureContext','v2212StructureOwner','v2212StructureProtected','v24SyntaxProtected','v2212StructureBox','v220BioLiteralFields','INFOBOX_CATALOG','TEMPLATE_CATALOG'];
if(!code.includes('function v2212StructurePlan(')){
 const match=/const api\s*=\s*\{/g;const found=[...code.matchAll(match)];
 if(found.length!==1)throw new Error('Unique engine export boundary required');
 code=code.slice(0,found[0].index)+fs.readFileSync(path.join(root,'src/v2_21_2/structure.js'),'utf8')+'\n'+code.slice(found[0].index);
}
if(!methods.every(name=>new RegExp('(?:[,{]\\s*'+name+'\\s*[,}:])').test(code.slice(code.search(/const api\s*=/)))))
 code=code.replace(/const api\s*=\s*\{/,'const api={'+methods.join(',')+',');
const loaded=new Module(entry,module);loaded.filename=entry;loaded.paths=module.paths;loaded._compile(code,entry);
module.exports=loaded.exports;

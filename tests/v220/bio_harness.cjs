'use strict';
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const root=path.resolve(__dirname,'../..');
const entry=process.env.REVISAWIKI_BUNDLE||path.join(root,'dist/2.19.1/RevisaWiki_v2_19_1_completo.js');
let code=fs.readFileSync(entry,'utf8');
if(!code.includes('function v220BiographyPlan(')){
 const legacyImagePlan='    function v28BiographyFieldPlan(raw,cfg={}) {';
 if(code.split(legacyImagePlan).length!==2)throw new Error('Native image-plan boundary changed');
 code=code.replace(legacyImagePlan,'    function v220BaselineBiographyFieldPlan(raw,cfg={}) {');
 const legacyAltPlan='    function v2151BiographyImageAltPlan(source,cfg={}) {';
 if(code.split(legacyAltPlan).length!==2)throw new Error('Native ALT-plan boundary changed');
 code=code.replace(legacyAltPlan,'    function v220BaselineBiographyImageAltPlan(source,cfg={}) {');
 const fragment=fs.readFileSync(path.join(root,'src/v2_20/biography_portals.js'),'utf8');
 const needle='    const api = {';
 if(code.split(needle).length!==2)throw new Error('Runtime export boundary changed');
 code=code.replace(needle,fragment+'\n'+needle+' v24SyntaxProtected,templates,parsedTemplate,v220BiographyPlan,v220BiographyProof,v220BioNodes,v220BioPrincipal,v220BioFieldEdits,v220BioPortalCandidates,v220BioPortalCleanup,v220BioWebsiteValue,v220BioMediaEdits,v220BioUrlCallEdits,v220BioLiteralFields,');
}
const loaded=new Module(entry,module);loaded.filename=entry;loaded.paths=module.paths;loaded._compile(code,entry);
module.exports=loaded.exports;

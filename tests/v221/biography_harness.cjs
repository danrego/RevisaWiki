'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const file=process.env.REVISAWIKI_BUNDLE||path.join(root,'dist/2.20.0/RevisaWiki_v2_20_0_completo.js');
let code=fs.readFileSync(file,'utf8');
const runtimeSha256=crypto.createHash('sha256').update(code).digest('hex');
const dataPath=file.replace(/(?:_completo)?\.js$/,'_dados.js'),dataBytes=fs.existsSync(dataPath)?fs.readFileSync(dataPath):null;
const names=['v221BiographyPlan','v221BiographyProof','v221InfoboxEntityRequests','v221BioPrincipal','v221BioFields','v221BioEntityAllows','v221BioCompleteClaimsMap','v221InfoboxKnownField','v221BioImageEdits','v219IndexedSyntaxContext','v24SyntaxParts','v24SyntaxProtected','editorialWikiLinkRanges','v219ImageThumbnailTypoOption','v219NativeMediaOption','V219_NATIVE_IMAGE_OPTIONS','V221_INFOBOX_MAPPINGS','V221_INFOBOX_CONTRACTS','V221_BIOGRAPHY_PLAN_FAMILIES'];
const markers=['    const api = {','const api={'].filter(marker=>code.split(marker).length===2);
if(markers.length!==1)throw Error('Runtime export boundary changed');
const marker=markers[0];
const fragment=code.includes('function v221BiographyPlan(')?'':fs.readFileSync(path.join(root,'src/v2_21/biography_infoboxes.js'),'utf8');
code=code.replace(marker,()=>fragment+'\n'+marker+names.join(',')+',');
const loaded=new Module(file,module);loaded.filename=file;loaded.paths=module.paths;loaded._compile(code,file);
module.exports={...loaded.exports,__biographyTestHarness:{runtimeFile:path.basename(file),runtimeSha256,
 dataFile:dataBytes?path.basename(dataPath):null,dataSha256:dataBytes?crypto.createHash('sha256').update(dataBytes).digest('hex'):null,
 fragmentInjected:!!fragment,fragmentSha256:fragment?crypto.createHash('sha256').update(fragment).digest('hex'):null}};

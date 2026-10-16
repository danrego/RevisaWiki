'use strict';
// Correct only literal title slots in three positive test generators. The
// independent table comes from recorded native definitions, never the runtime.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const file=path.join(__dirname,'IDENTITY_REGISTRY_AMENDMENT.json'),raw=fs.readFileSync(file),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const pin='68a1e813f8156e5f87ae6904e501a37c83c992a21f8d847240ea946d38779c02';assert.equal(sha(raw),pin);
const contract=JSON.parse(raw),titles=new Map(contract.mapping.map(row=>[row.unverifiedLiteralTitle,row.documentedLiteralTitle]));assert.equal(titles.size,33);
function reviewedRegistryTitle(literalTitle){return titles.has(literalTitle)?titles.get(literalTitle):literalTitle;}
function projectSource(relative,source){const row=contract.sourceReplacements.find(item=>item.file===relative);assert(row,'Only the three reviewed positive generators are admitted');assert([row.sourceSha256,row.technicalBaseSha256].includes(sha(source)),'The original or technically retargeted source is exact');assert.equal(source.split(row.before).length-1,1);const result=source.replace(row.before,row.after);if(sha(source)===row.technicalBaseSha256)assert.equal(sha(result),row.projectedCompiledSha256);return result;}
function declarations(){return {file:'tests/v2150/inherited/IDENTITY_REGISTRY_AMENDMENT.json',sha256:pin,scope:contract.scope,sourceReplacements:contract.sourceReplacements,runtimeModified:false,historicalFileBytesModified:false,assertionBodiesChanged:false,negativeAssertionsChanged:false};}
module.exports={reviewedRegistryTitle,projectSource,declarations,contract};

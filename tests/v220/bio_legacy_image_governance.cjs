'use strict';
// A versioned test derivation is checked before either new suite executes.
// Expected endpoints come from declared literals and a native counterproof,
// never from calculate output. Historical tests and failed receipts stay intact.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),Module=require('node:module'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),declarationPath=path.join(__dirname,'bio_legacy_image_derivation.json'),declaration=JSON.parse(fs.readFileSync(declarationPath));
const report={kind:'versioned-legacy-image-test-governance',status:'passed',checks:0,runnerSha256:sha(fs.readFileSync(__filename)),declarationSha256:sha(fs.readFileSync(declarationPath)),derivations:[],runtimeExecution:false,wikipediaWrites:0,networkRequests:0};
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function fixturesFrom(file,source){
 const anchor='for(const file of files){';eq(source.split(anchor).length,2,'One original whole-action loop remains');
 const name=path.basename(file)==='option_action_cases.cjs'?'seeds':'fixtures',context={require:Module.createRequire(file),__filename:file,__dirname:path.dirname(file),process:{argv:['node',file],env:{}},console};
 vm.runInNewContext(source.slice(0,source.indexOf(anchor))+'\nglobalThis.__fixtures=JSON.parse(JSON.stringify('+name+'));',context,{filename:file,timeout:3000});return JSON.parse(JSON.stringify(context.__fixtures));
}
eq(declaration.schemaVersion,1,'Declared derivation schema');eq(declaration.declaredBeforeNewSuiteExecution,true,'Endpoints were declared before execution');eq(declaration.runtimeChanged,false,'This is not a runtime adjustment');eq(declaration.legacyTestsChanged,false,'Historical suites are preserved');eq(declaration.derivations.length,2,'Exactly the two requested historical suites are derived');
for(const row of declaration.derivations){
 const originalPath=path.join(root,row.sourcePath),derivedPath=path.join(root,row.derivedPath),original=fs.readFileSync(originalPath,'utf8'),derived=fs.readFileSync(derivedPath,'utf8');
 eq(sha(original),row.sourceSha256,'The complete original suite has its historical hash');eq(Buffer.byteLength(original),row.sourceBytes,'Original byte count');eq(sha(derived),row.derivedSha256,'The complete versioned suite is frozen');
 let reconstructed=original;for(const operation of row.operations){eq(operation.occurrences,1,'A declared operation is unique');eq(reconstructed.split(operation.before).length,2,'The exact prior anchor occurs once');reconstructed=reconstructed.replace(operation.before,operation.after);}
 eq(derived,reconstructed,'The complete versioned suite has only the declared changes');eq((derived.match(/assert\./g)||[]).length,(original.match(/assert\./g)||[]).length,'No assertion expression was deleted or weakened');
 const before=fixturesFrom(originalPath,original),after=fixturesFrom(derivedPath,derived),oldMap=new Map(before.map(f=>[f.id,f])),newMap=new Map(after.map(f=>[f.id,f]));eq(oldMap.size,before.length,'Original fixture identities are unique');eq(newMap.size,after.length,'Versioned fixture identities are unique');eq(after.length,before.length+1,'Exactly one separately authored positive was added');
 for(const fixture of before)if(fixture.id!==row.revokedFixtureId)eq(newMap.get(fixture.id),fixture,'Every unrelated fixture and option remains exact: '+fixture.id);
 const old=oldMap.get(row.revokedFixtureId),changed=newMap.get(row.revokedFixtureId);eq(changed.source,old.source,'The revoked source is not softened');eq(changed.options,old.options,'The revoked source retains all requested options');eq(changed.gates,old.gates,'The revoked source retains all gates');eq(changed.expected,old.source,'The new negative preserves the literal original source');
 if(row.derivedPath.endsWith('/option_action_cases.cjs'))eq(changed.semanticDisposition,'native-image-dimension-preservation','The no-op has preservation metadata, not repair credit');else eq(changed.kind,'preservation','The no-op has preservation kind');
 const added=newMap.get(row.replacementPositiveId);eq(added.source.includes('[[Ficheiro:Retrato fictício.jpg|220px|alt=Uma pessoa]]'),true,'The separate positive has an explicit inline dimension and ALT');eq(added.expected,added.source.replace('[[Ficheiro:Retrato fictício.jpg|220px|alt=Uma pessoa]]','Retrato fictício.jpg|alt=Uma pessoa|imagem_tamanho=220px'),'The exact positive endpoint is authored from the native fields');eq(added.options.automaticInfoboxImages,true,'The automatic image option is enabled for the separate positive');eq(added.gates.includes('automaticInfoboxImages'),true,'The same runner generates an explicit disabled-option control');eq(original.includes("['nowiki'"),true,'Protected-owner generators are retained');
 report.derivations.push({sourcePath:row.sourcePath,sourceSha256:row.sourceSha256,derivedPath:row.derivedPath,derivedSha256:row.derivedSha256,originalFixtures:before.length,versionedFixtures:after.length,preservedNoDimensionId:row.revokedFixtureId,separatePositiveId:row.replacementPositiveId,allUnrelatedFixturesIdentical:true});
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');

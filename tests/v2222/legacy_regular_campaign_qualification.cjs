'use strict';
// Port only the current driver identity. Frozen metadata, fixture sources and
// every behavioral qualification remain the reviewed inherited programs.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const file=path.resolve(__dirname,'../v2221/regular_legacy_qualification.cjs'),raw=fs.readFileSync(file,'utf8'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(sha(raw),'f34aa4fe4e82c2fdea112db5dbe89fb1aad415522d24ea50c37cae4c796f9246');
let source=raw.replaceAll('RevisaWiki_v2_22_1','RevisaWiki_v2_22_2');
const runtimeGuards=source.match(/api\.version [!=]== '2\.22\.1'/g)||[];assert.equal(runtimeGuards.length,5,'Only the five frozen runtime eligibility guards');source=source.replace(/api\.version ([!=]==) '2\.22\.1'/g,"api.version $1 '2.22.2'");
for(const [before,after]of [["assert.equal(manifest.version, '2.22.1');","assert.equal(manifest.version, '2.22.2');"],["assert.equal(api.version, '2.22.1');","assert.equal(api.version, '2.22.2');"],["version: '2.22.1', status: 'running'","version: '2.22.2', status: 'running'"],["if (require.main === module) main();","main();"]]){assert.equal(source.split(before).length,2);source=source.replace(before,after);}
assert(source.includes("assert.equal(metadata.version, '2.22.1');"),'Frozen metadata retains its original identity');
const oldArchiveHook="archiveFull(...args) { const accepted = qualifyArchiveFull(metadata, ...args); if (accepted) qualifications.push(metadata.archiveFull.find(row => row.source === args[0]).id); return accepted; }";
const newArchiveHook="archiveFull(...args) { const accepted = qualifyArchiveFull(metadata, ...args); if (accepted) { qualifications.push(metadata.archiveFull.find(row => row.source === args[0]).id); return true; } const current=require('../v2222/legacy_archive_url_qualification.cjs'); if(current.qualify(...args,runtime)){qualifications.push(current.id);return true;} return false; }";
assert.equal(source.split(oldArchiveHook).length,2,'One exact inherited full-action archive assertion site');source=source.replace(oldArchiveHook,newArchiveHook);

if(process.argv[2])fs.writeFileSync(path.resolve(process.argv[2])+'.adapter.json',JSON.stringify({kind:'exact-current-driver-identity-and-finite-site-adapter',originalDriverSha256:sha(raw),compiledDriverSha256:sha(source),fixtureSourcesChanged:false,originalAssertionsSkipped:false,exactAdditionalQualification:{id:require('./legacy_archive_url_qualification.cjs').id,qualifierSha256:sha(fs.readFileSync(path.join(__dirname,'legacy_archive_url_qualification.cjs')))},metadataChanged:false,productionGuardsChanged:false,historicalFilesChanged:false,wikipediaWrites:0},null,2)+'\n',{flag:'wx'});
const compiled=new Module(file,module);compiled.filename=file;compiled.paths=Module._nodeModulePaths(path.dirname(file));compiled._compile(source,file);

'use strict';
// Aggregate only fresh native runs against the current immutable release pins.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const manifestPath=path.resolve(__dirname,'../../expected_release_v262.json');
const manifestBytes=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestBytes);
const directory=path.resolve(process.argv[2]||process.env.REVISAWIKI_INSTALL_REPORT_DIR||'artifacts/v262/browser');
const runnerSha256=sha(fs.readFileSync(path.join(__dirname,'run_patch.cjs')));
const summary={version:'2.6.2',kind:'native-macos-patch-browser-summary',frozenFiles:manifest.files,pinManifestSha256:sha(manifestBytes),runnerSha256,cases:0,checks:0,failed:0,browsers:[],wikipediaWrites:0,networkMutations:0,outsideRequests:0,clipboardWrites:0,screenshots:0,scope:'Nine local native browser workflows. Full source article runs through a real Worker and exact Undo. API responses are fixture-only; this is not a live Wikipedia integration or a complete visual audit.'};
let outputSha256;
for(const name of ['chrome','firefox','safari']){
 const bytes=fs.readFileSync(path.join(directory,name+'.json')),report=JSON.parse(bytes);
 assert.equal(report.version,'2.6.2');assert.equal(report.pinManifestSha256,summary.pinManifestSha256);
 assert.equal(report.runnerSha256,runnerSha256);assert.deepEqual(report.releaseFiles,manifest.files);
 assert(report.finishedAt);assert(report.browserVersion);assert.equal(report.failed,0);assert.equal(report.passed,3);
 assert.equal(report.runnerError,undefined);assert.equal(report.cleanupError,undefined);assert.equal(report.finalSavedFileHashesVerified,true);
 for(const field of ['actualWikipediaWrites','actualNetworkMutations','blockedOutsideRequests','clipboardWrites','screenshots'])assert.equal(report[field],0,name+' '+field);
 assert.equal(report.cleanup.ownSessionClosed,true);assert.equal(report.cleanup.ownProcessExited,true);assert.equal(report.cleanup.ownProfileRemoved,true);assert.equal(report.cleanup.unknownBrowserSessionsTouched,false);
 assert(report.serverRequests.length>0);assert(report.serverRequests.every(request=>request.method==='GET'));
 assert.equal(report.tests.length,3);assert(report.tests.every(test=>test.passed&&test.assertions>0));
 const city=report.tests.find(test=>test.name==='complete city-temperature article and exact undo');
 assert(city);assert.equal(city.evidence.processing.engine,'worker');assert.equal(city.evidence.processing.workerFailure,null);
 assert.equal(city.evidence.numericRows,487);assert.equal(city.restoredSha256,report.cityFixture.sha256);
 outputSha256??=city.evidence.outputSha256;assert.equal(city.evidence.outputSha256,outputSha256,'Exact output parity across installed browsers');
 summary.cases+=report.tests.length;summary.checks+=report.assertions;
 summary.browsers.push({name:report.browser,version:report.browserVersion,report:name+'.json',reportSha256:sha(bytes),cases:report.tests.length,checks:report.assertions,workerMilliseconds:city.evidence.processing.milliseconds,outputSha256:city.evidence.outputSha256,restoredSha256:city.restoredSha256,cleanup:report.cleanup});
}
assert.equal(summary.cases,9);assert.equal(summary.checks,360);
summary.status='passed';summary.finishedAt=new Date().toISOString();
fs.writeFileSync(path.join(directory,'NATIVE_BROWSER_SUMMARY.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({version:summary.version,status:summary.status,cases:summary.cases,checks:summary.checks,failed:summary.failed,browsers:summary.browsers.map(({name,version,workerMilliseconds})=>({name,version,workerMilliseconds})),wikipediaWrites:0,clipboardWrites:0,screenshots:0}));

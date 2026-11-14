'use strict';
// Reuse every assertion from the frozen HTTP harness on the exact local file.
// Product HTML, the embedded Worker and the native drivers remain unchanged.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),Module=require('node:module'),{pathToFileURL}=require('node:url');
const base=path.join(__dirname,'demonstration_browser.cjs'),raw=fs.readFileSync(base,'utf8'),sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const expected='45cf8defee73d80566c9786a6713972ab4110d8623c6f7fc5e9841ba87b48676';
assert.equal(sha(raw),expected,'The original native HTTP harness must remain frozen');
assert(process.argv[2],'Pass the exact portable demonstration HTML');
const portable=path.resolve(process.argv[2]),file=pathToFileURL(portable).href,directory=pathToFileURL(path.dirname(portable)).href.replace(/\/$/,'');
assert(fs.statSync(portable).isFile(),'The portable demonstration must exist');
const navigation="const origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;await driver.navigate(origin+'/demo.html');";
assert.equal(raw.split(navigation).length,2,'One exact harness navigation anchor is required');
const substituted="const origin="+JSON.stringify(directory)+";await driver.start(origin);report.browserVersion=driver.version;report.navigationMode='exact-file-url';report.localHttpNavigationUsed=false;report.baseHarnessSha256="+JSON.stringify(expected)+";await driver.navigate("+JSON.stringify(file)+");";
let code=raw.replace(navigation,substituted).replace("kind:'current-portable-demonstration-native-browser-smoke'","kind:'current-portable-demonstration-native-browser-file-smoke'");
const last="eq(report.networkMutations,0,'No network mutation');";
assert.equal(code.split(last).length,2,'One unchanged final validation anchor is required');
code=code.replace(last,last+"eq(report.requests,[],'The exact file URL needs no local HTTP navigation');");
const child=new Module(base,module);child.filename=base;child.paths=module.paths;child._compile(code,base);

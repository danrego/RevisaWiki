'use strict';
// Run the frozen column suite against the corrected installation directory.
// Only its two distribution locators change; assertions and cases stay intact.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const original=path.resolve(__dirname,'../v2211/columns.cjs');
let source=fs.readFileSync(original,'utf8');
for(const [before,after,count]of [
 ['tests/expected_release_v2211.json','tests/expected_release_v2211_installation1.json',2],
 ['dist/2.21.1/RevisaWiki_v2_21_1','dist/2.21.1-installation.1/RevisaWiki_v2_21_1',1]
]){assert.equal(source.split(before).length,count+1,'The exact frozen distribution locators');source=source.replaceAll(before,after);}
const scoped=new Module(original,module);scoped.filename=original;scoped.paths=Module._nodeModulePaths(path.dirname(original));scoped._compile(source,original);

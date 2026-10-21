'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const previous=path.resolve(__dirname,'../v219/demonstration_cases.cjs');
const source=fs.readFileSync(previous,'utf8').replaceAll('2.19.0','2.19.1').replaceAll('_v2_19_0','_v2_19_1');
const compiled=new Module(previous,module);compiled.filename=previous;compiled.paths=module.paths;compiled._compile(source,previous);

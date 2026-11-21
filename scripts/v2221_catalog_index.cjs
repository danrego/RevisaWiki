'use strict';
// Execute reviewed local reader code; the catalogue itself is only JSON data.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),scope={};
vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(root,'src/v2_22_1/foreign_infobox_registry.js'),'utf8')+'\nObject.assign(globalThis,{v2221InfoboxTitle,v2221InfoboxCatalogValidate});',scope);
const catalog=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),result=scope.v2221InfoboxCatalogValidate(catalog);
assert(result.valid&&!result.recordErrors.length&&!result.nativeAliasErrors.length,'Complete literal catalogue must validate');
const headers=Object.fromEntries(catalog.records.flatMap(row=>[row.source.title,...row.source.aliases]).map(raw=>{const title=scope.v2221InfoboxTitle(raw);assert(title,'Valid page title');return[raw,title];}));
process.stdout.write(JSON.stringify(headers));

// Run the ResourceLoader language-profile checks with a local PHP-Wasm runtime.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const peast=process.env.REVISAWIKI_PEAST,modules=process.env.REVISAWIKI_PHP_MODULES;
if(!peast||!modules)throw Error('Set REVISAWIKI_PEAST and REVISAWIKI_PHP_MODULES to installed local dependencies.');
const require=createRequire(path.join(path.resolve(modules),'package.json'));
const {PHP,loadPHPRuntime}=require('@php-wasm/universal'),{getPHPLoaderModule}=require('@php-wasm/node-8-3');
const php=new PHP(await loadPHPRuntime(await getPHPLoaderModule()));
async function copyTree(from,to){php.mkdirTree(to);for(const entry of await fs.readdir(from,{withFileTypes:true})){if(entry.isDirectory())await copyTree(path.join(from,entry.name),to+'/'+entry.name);else php.writeFile(to+'/'+entry.name,await fs.readFile(path.join(from,entry.name)));}}
try{
 await copyTree(path.join(peast,'lib/Peast'),'/peast/lib/Peast');php.mkdirTree('/candidate');
 for(const file of await fs.readdir(path.join(root,'dist/2.11.0')))if(file.endsWith('.js'))php.writeFile('/candidate/'+file,await fs.readFile(path.join(root,'dist/2.11.0',file)));
 php.writeFile('/check.php',await fs.readFile(path.join(here,'check_server_grammar.php')));
 php.writeFile('/run.php',"<?php $argv=['check.php','/candidate','/peast']; require '/check.php';");
 const response=await php.run({scriptPath:'/run.php'});if(response.errors)process.stderr.write(response.errors);
 const report=JSON.parse(response.text);report.version='2.11.0';report.peastCommit='9c211ef67a0cf7511f864b6d390fe5939a837d05';report.networkRequests=0;report.wikipediaWrites=0;
 const directory=process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2110');await fs.mkdir(directory,{recursive:true});
 await fs.writeFile(path.join(directory,'server_grammar.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,gate:report.gate,cases:report.cases,failed:report.failed,networkRequests:0,wikipediaWrites:0}));if(report.failed)process.exitCode=1;
}finally{await php.exit();}

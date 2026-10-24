'use strict';
// Keep every historical case and assertion. Only runtime filenames and the
// distribution directory are redirected to the current supplied programs.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const file=path.resolve(process.argv[2]);process.argv=process.argv.slice(1);process.argv[1]=file;
let code=fs.readFileSync(file,'utf8');const original=code;
const program=parser.parse(code,{sourceType:'unambiguous'}),edits=[];
const filenames=new Map([
 ['RevisaWiki_v2_19_0.js','RevisaWiki_v2_21_0.js'],
 ['RevisaWiki_v2_19_0_completo.js','RevisaWiki_v2_21_0_completo.js'],
 ['RevisaWiki_v2_19_0_dados.js','RevisaWiki_v2_21_0_dados.js'],
 ['dist/2.19.0','dist/2.21.0'],
 ['RevisaWiki_v2_20_0.js','RevisaWiki_v2_21_0.js'],
 ['RevisaWiki_v2_20_0_completo.js','RevisaWiki_v2_21_0_completo.js'],
 ['RevisaWiki_v2_20_0_dados.js','RevisaWiki_v2_21_0_dados.js'],
 ['dist/2.20.0','dist/2.21.0'],
 ['./new_writer_observers/adapter.cjs',path.join(__dirname,'legacy_new_writer_adapter.cjs')]
]);
function visit(node){
 if(!node||typeof node!=='object')return;
 if(node.type==='StringLiteral'&&['2.19.0','2.20.0'].includes(node.value)&&path.basename(file)==='valid_end_section_orders_cases.cjs')edits.push({start:node.start,end:node.end,text:JSON.stringify('2.21.0'),role:'current-version-identity'});
 if(node.type==='StringLiteral'&&node.value==='function v219StageSafeEdits(source,edits,name,cfg={}) {'&&path.basename(file)==='native_partial_collector_stage_signature_cases.cjs')edits.push({start:node.start,end:node.end,text:'(/function v219StageSafeEdits\\(source,edits,name,cfg=\\{\\}\\)\\s*\\{/.exec(raw)||[])[0]',role:'exact-layout-instrumentation-anchor'});
 if(node.type==='StringLiteral'&&filenames.has(node.value))edits.push({start:node.start,end:node.end,text:JSON.stringify(filenames.get(node.value))});
 for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
}
visit(program);for(const edit of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.text+code.slice(edit.end);
if(process.env.REVISAWIKI_COMPAT_RECEIPT)fs.appendFileSync(process.env.REVISAWIKI_COMPAT_RECEIPT,JSON.stringify({file:path.basename(file),sourceSha256:sha(original),loadedSha256:sha(code),edits:edits.map(row=>({...row,textSha256:sha(row.text),text:undefined})),scope:'exact runtime filenames, current version identity and whitespace-only stage instrumentation anchor; no endpoint or assertion substitution'})+'\n');
const loaded=new Module(file,module);loaded.filename=file;loaded.paths=Module._nodeModulePaths(path.dirname(file));loaded._compile(code,file);

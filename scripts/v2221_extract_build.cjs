'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const[action,file]=process.argv.slice(2),source=fs.readFileSync(file,'utf8'),ast=parser.parse(source),found=[];
function visit(node){if(!node||typeof node!=='object')return;if(action==='factory-sha256'&&node.type==='ObjectProperty'&&(node.key.name||node.key.value)==='factory')found.push(node.value);if(action==='boot'&&node.type==='FunctionExpression'&&node.id?.name==='RevisaWikiBoot')found.push(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
visit(ast);assert.equal(found.length,1);const value=source.slice(found[0].start,found[0].end);process.stdout.write(action==='boot'?value:crypto.createHash('sha256').update(value).digest('hex'));

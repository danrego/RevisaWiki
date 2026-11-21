'use strict';
const assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
function patch(source,helpers){
 const changes=[],sha=x=>crypto.createHash('sha256').update(x).digest('hex');let code=source;
 function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(c=>walk(c,fn));else if(v&&typeof v==='object')walk(v,fn);}}
 function alter(name,fn){const nodes=[];walk(parser.parse(code),n=>{if(n.type==='FunctionDeclaration'&&n.id.name===name)nodes.push(n);});assert.equal(nodes.length,1,name);const n=nodes[0],before=code.slice(n.start,n.end),after=fn(before);assert.notEqual(before,after,name);code=code.slice(0,n.start)+after+code.slice(n.end);changes.push({name,beforeSha256:sha(before),afterSha256:sha(after)});}
 function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
 alter('v24SyntaxTag',raw=>once(raw,"if(source[start]!=='<')return null;","if(source[start]!=='<'||!v2221NativeTagIntent(source,start))return null;"));
 alter('v219LegacySyntaxProtected',raw=>once(raw,"for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);","for(let i=0;i<view.length;){const fileNameEnd=v2221FileNameQuoteEnd(view,i);if(fileNameEnd!==null){i=fileNameEnd;continue;}if(v2221ClosingProseQuote(view,i)){i++;continue;}const t=v24SyntaxTag(view,i);"));
 alter('v2217Previous_v24SyntaxScan',raw=>once(raw,"else if(two==='|}'&&/^[ \\t]*$/.test", "else if(two==='|}'&&!closes.has(i+1)&&/^[ \\t]*$/.test"));
 alter('v2217NativeTableShadow',raw=>once(raw,"close=['fim','s-end'].includes(name)","close=['fim','s-end','termina caixa'].includes(name)"));
 // Keep the native ISBN prefix requirement in the earlier writer as well.
 function helpersAlter(name,fn){const nodes=[];walk(parser.parse(helpers),n=>{if(n.type==='FunctionDeclaration'&&n.id.name===name)nodes.push(n);});assert.equal(nodes.length,1,name);const n=nodes[0],before=helpers.slice(n.start,n.end),after=fn(before);assert.notEqual(before,after,name);helpers=helpers.slice(0,n.start)+after+helpers.slice(n.end);changes.push({name,beforeSha256:sha(before),afterSha256:sha(after)});}
 helpersAlter('v222CitationValue',raw=>once(raw,'if(/^\\d{13}$/.test(compact))','if(/^97[89]\\d{10}$/.test(compact))'));
 parser.parse(code);parser.parse(helpers);return {code,helpers,receipt:{changes,wikipediaWrites:0}};
}
module.exports={patch};

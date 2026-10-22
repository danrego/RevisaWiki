'use strict';
// Formatting only: keep the parsed program and every source comment intact.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const parser=require('@babel/parser');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const omitted=new Set(['start','end','loc','extra','leadingComments','trailingComments','innerComments','comments','tokens','errors']);
function normalized(value){
 if(Array.isArray(value))return value.map(normalized);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(key=>!omitted.has(key)).sort().map(key=>[key,normalized(value[key])]));
 return value;
}
function compact(source){
 const parseOptions={sourceType:'unambiguous',createParenthesizedExpressions:true,tokens:true};
 const before=parser.parse(source,parseOptions),chunks=[];let previous=null,at=0;
 const word=char=>!!char&&/[\p{ID_Continue}$\\]/u.test(char),operator=char=>!!char&&/[+\-*/%<>=!&|^?.]/.test(char);
 for(const token of before.tokens){
  if(token.type?.label==='eof'){
   assert(/^[\s\uFEFF]*$/.test(source.slice(at)),'Unexpected trailing source bytes');
   break;
  }
  const literal=source.slice(token.start,token.end),gap=source.slice(at,token.start);
  assert(/^[\s\uFEFF]*$/.test(gap),'A non-whitespace source gap cannot be reformatted');
  if(gap){
   if(/[\r\n\u2028\u2029]/.test(gap)||previous?.type==='CommentLine')chunks.push('\n');
   else if(previous){
    const left=source.slice(previous.start,previous.end),a=left.at(-1),b=literal[0];
    if(word(a)&&word(b)||operator(a)&&operator(b)||previous.type?.label==='num'&&b==='.')chunks.push(' ');
   }
  }
  chunks.push(literal);at=token.end;previous=token;
 }
 const result=chunks.join('')+'\n';
 const after=parser.parse(result,parseOptions),beforeProgram=JSON.stringify(normalized(before.program)),afterProgram=JSON.stringify(normalized(after.program));
 if(beforeProgram!==afterProgram){
  const first=(a,b,p='$')=>{if(a===b)return null;if(typeof a!==typeof b||a===null||b===null||typeof a!=='object')return p+': '+JSON.stringify(a)+' -> '+JSON.stringify(b);const keys=new Set([...Object.keys(a),...Object.keys(b)]);for(const key of keys){const found=first(a[key],b[key],p+'.'+key);if(found)return found;}return null;};
  throw Error('Compact formatting changed the parsed JavaScript program at '+first(JSON.parse(beforeProgram),JSON.parse(afterProgram)));
 }
 const comments=ast=>(ast.comments||[]).map(item=>[item.type,item.value]);
 assert.deepEqual(comments(before),comments(after),'Compact formatting changed a source comment or license notice');
 const lexical=ast=>(ast.tokens||[]).map(token=>source.slice(token.start,token.end));
 const beforeLexemes=lexical(before),afterLexemes=(after.tokens||[]).map(token=>result.slice(token.start,token.end));
 assert.deepEqual(beforeLexemes,afterLexemes,'Compact formatting changed a JavaScript token');
 return {code:result,proof:{method:'Token-preserving whitespace formatting; identical normalized program including parentheses, literal token bytes and all source comments; no compression or renaming',sourceBytes:Buffer.byteLength(source),outputBytes:Buffer.byteLength(result),sourceSha256:hash(source),outputSha256:hash(result),normalizedProgramSha256:hash(beforeProgram),literalTokensSha256:hash(JSON.stringify(beforeLexemes)),commentCount:comments(before).length,parserVersion:require('@babel/parser/package.json').version}};
}
module.exports={compact,normalized};
if(require.main===module){
 const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const[k,...v]=arg.replace(/^--/,'').split('=');return[k,v.join('=')];}));
 const source=args.input?fs.readFileSync(args.input,'utf8'):fs.readFileSync(0,'utf8'),result=compact(source);
 if(args.output)fs.writeFileSync(args.output,result.code);else process.stdout.write(result.code);
 if(args.receipt)fs.writeFileSync(args.receipt,JSON.stringify(result.proof,null,2)+'\n');
}

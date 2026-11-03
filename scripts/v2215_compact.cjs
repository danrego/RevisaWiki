'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),parser=require('@babel/parser'),terser=require('terser');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function inventory(source){
 const ast=parser.parse(source),values=[],names=[],keys=[],operators=[];
 function visit(n,parent=null,key=''){
  if(!n||typeof n!=='object')return;
  if(/Literal$/.test(n.type)&&!(key==='key'&&parent&&!parent.computed&&['ObjectProperty','ObjectMethod'].includes(parent.type)))values.push([n.type,n.value??null,n.pattern??null,n.flags?[...n.flags].sort().join(''):null]);
  if(n.type==='FunctionDeclaration'&&n.id)names.push(n.id.name);
  if((n.type==='ObjectProperty'||n.type==='ObjectMethod')&&!n.computed)keys.push(n.key.name??n.key.value);
  if(n.type==='MemberExpression'&&!n.computed)keys.push(n.property.name);
  if(n.operator)operators.push([n.type,n.operator]);
  for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra','leadingComments','trailingComments','innerComments','comments','tokens'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>visit(x,n,k));else if(v&&typeof v==='object')visit(v,n,k);}
 }
 visit(ast);return{values,names,keys:keys.sort(),operators};
}

function saveSafeJavaScript(source){
 const ast=parser.parse(source),edits=[];
 const vulnerable=c=>c==='{'||c==='~'||/\p{M}/u.test(c)||c.normalize('NFC')!==c||(/[\u1100-\u11ff\ua960-\ua97f\ud7b0-\ud7ff]/u.test(c));
 const escaped=c=>{const n=c.codePointAt(0);if(n<=65535)return '\\u'+n.toString(16).padStart(4,'0');const d=n-65536;return '\\u'+(55296+(d>>10)).toString(16)+'\\u'+(56320+(d&1023)).toString(16);};
 const protect=text=>Array.from(text,c=>vulnerable(c)?escaped(c):c).join('');
 const literal=value=>protect(JSON.stringify(value));
 function visit(n,parent=null,tagged=false){
  if(!n||typeof n!=='object')return;
  if(n.type==='StringLiteral'&&Array.from(n.value).some(vulnerable))edits.push({start:n.start,end:n.end,text:literal(n.value)});
  if(n.type==='TemplateElement'&&Array.from(n.value.raw).some(vulnerable)){
   if(tagged||n.value.cooked===null)throw new Error('A raw template needs explicit save-time protection');
   const raw=literal(n.value.cooked).slice(1,-1).replace(/`/g,'\\`').replace(/\$/g,'\\u0024');
   edits.push({start:n.start,end:n.end,text:raw});
  }
  for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra','leadingComments','trailingComments','innerComments','comments','tokens'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>visit(x,n,tagged||n.type==='TaggedTemplateExpression'));else if(v&&typeof v==='object')visit(v,n,tagged||n.type==='TaggedTemplateExpression');}
 }
 visit(ast);let code=source;for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 assert.equal(code.normalize('NFC'),code,'Installable code is stable under native NFC normalization');
 assert(!/\{\{(?:safesubst|subst)\s*:/i.test(code),'Installable code has no literal substitution trigger');
 assert(!code.includes('~~~'),'Installable code has no literal signature trigger');
 return{code,protectedLiterals:edits.length};
}

async function format(source){
 const before=inventory(source),result=await terser.minify(source,{
  compress:false,mangle:{reserved:['root','host','mw','api','cfg','V2214_RECOVERY_GROUPS','RevisaWikiBoot']},keep_fnames:true,keep_classnames:true,
  format:{comments:/@license|\blicen[cs]e?\b|copyright|SPDX|CC[ -]BY|creativecommons\.org/i,semicolons:true,ascii_only:false,keep_quoted_props:true,quote_style:1}
 });
 assert(!result.error);const protectedSource=saveSafeJavaScript(result.code+'\n'),code=protectedSource.code,after=inventory(code);
 assert.deepEqual(after.values,before.values,'Every literal retains its value and order');
 assert.deepEqual(after.names,before.names,'Function declaration names remain available');
 assert.deepEqual(after.keys,before.keys,'Object/API/member properties remain identical');
 assert.deepEqual(after.operators,before.operators,'No operation or guard is compressed away');
 return{code,proof:{method:'Pinned Terser formatter and local binding renaming, compression disabled; exact literals, named declarations, properties and operations verified',toolVersion:require('terser/package.json').version,compression:false,protectedLiterals:protectedSource.protectedLiterals,sourceSha256:sha(source),outputSha256:sha(code),sourceBytes:Buffer.byteLength(source),outputBytes:Buffer.byteLength(code),inventorySha256:sha(JSON.stringify(before))}};
}
if(require.main===module){const[input,output,receipt]=process.argv.slice(2);format(fs.readFileSync(input,'utf8')).then(r=>{fs.writeFileSync(output,r.code);if(receipt)fs.writeFileSync(receipt,JSON.stringify(r.proof,null,2)+'\n');}).catch(e=>{console.error(e);process.exitCode=1;});}
module.exports={format,inventory,saveSafeJavaScript};

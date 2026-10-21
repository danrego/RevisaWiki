'use strict';
// Build-only transformation. The delivered program never loads this module.
const crypto=require('node:crypto'),parser=require('@babel/parser');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const expectedContractSha256='34032f6a3e094778200c81737def422d6daa91a9e9f869a2e2bc98235c33a867';
const protectedComment=/(?:licen[csç]|copyright|spdx|creative\s*commons|CC[ -]BY|@|https?:|www\.|oldid|sha(?:1|256|512)|sourceMappingURL|sourceURL|author|autor|contribut|colabora|agradec|__\w+__)/iu;
const parse=source=>parser.parse(source,{sourceType:'unambiguous'});
function semanticTree(value){
 if(Array.isArray(value))return value.map(semanticTree);
 if(!value||typeof value!=='object')return value;
 const out={};for(const[key,item]of Object.entries(value)){
  if(['loc','start','end','extra','comments','leadingComments','trailingComments','innerComments','tokens','errors'].includes(key))continue;
  out[key]=semanticTree(item);
 }return out;
}
function lineCommentOnly(source,node){
 const start=source.lastIndexOf('\n',node.start-1)+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next;
 return node.type==='CommentLine'&&node.start>=15000&&!protectedComment.test(node.value)&&
  source.slice(start,node.start).trim()===''&&source.slice(node.end,end).trim()==='';
}
function stripCoreCommentBudget(source,completeSource,contract,tier='reserve32KiB'){
 if(typeof source!=='string'||typeof completeSource!=='string'||contract?.kind!=='reviewed-core-only-nonlegal-line-comment-budget')throw Error('Invalid source-bound comment budget contract');
 if(sha(JSON.stringify(contract))!==expectedContractSha256)throw Error('Pinned reviewed comment contract changed');
 const requested=contract.tiers?.[tier];if(!requested)throw Error('Unknown reviewed comment budget tier');
 const ast=parse(source),fullAst=parse(completeSource),byText=(text,nodes)=>{
  const result=new Map();for(const node of nodes){const raw=text.slice(node.start,node.end);if(!result.has(raw))result.set(raw,[]);result.get(raw).push(node);}return result;
 },sourceComments=byText(source,ast.comments),fullComments=byText(completeSource,fullAst.comments);
 const selected=[...contract.rows].sort((a,b)=>a.selectionRank-b.selectionRank).slice(0,requested.commentCount),edits=[];
 let removedBytes=0;
 for(const row of selected){
  if(sha(row.rawText)!==row.sha256||Buffer.byteLength(row.rawText)!==row.bytes)throw Error('Reviewed comment text/hash changed');
  const matches=sourceComments.get(row.rawText),fullMatches=fullComments.get(row.rawText);
  if(matches?.length!==1||fullMatches?.length!==1)throw Error('Reviewed explanatory comment is not unique in both actual SOURCE artifacts');
  const node=matches[0],fullNode=fullMatches[0];
  if(!lineCommentOnly(source,node)||!lineCommentOnly(completeSource,fullNode))throw Error('A reviewed comment has become protected, inline or executable source');
  edits.push({start:node.start,end:node.end,text:'',commentSha256:row.sha256});removedBytes+=row.bytes;
 }
 if(removedBytes!==requested.removedBytes||removedBytes<requested.minimumBytes)throw Error('Reviewed comment byte budget changed');
 let next=source;for(const edit of edits.sort((a,b)=>b.start-a.start))next=next.slice(0,edit.start)+next.slice(edit.end);
 const after=parse(next),beforeTree=JSON.stringify(semanticTree(ast)),afterTree=JSON.stringify(semanticTree(after));
 if(beforeTree!==afterTree)throw Error('Core comment transform changed the complete JavaScript AST');
 const terminators=text=>(text.match(/\r\n|\r|\n/g)||[]).join('');if(terminators(source)!==terminators(next))throw Error('A source line terminator changed');
 const blocks=(text,tree)=>tree.comments.filter(node=>node.type==='CommentBlock').map(node=>text.slice(node.start,node.end));
 if(JSON.stringify(blocks(source,ast))!==JSON.stringify(blocks(next,after)))throw Error('A legal/header/block comment changed');
 return {source:next,proof:{kind:'build-only-core-comment-AST-parity',tier,selectedComments:edits.length,removedBytes,
  beforeBytes:Buffer.byteLength(source),afterBytes:Buffer.byteLength(next),remainingCoreBytes:2097152-Buffer.byteLength(next),
  sourceBeforeSha256:sha(source),sourceAfterSha256:sha(next),completeSourceSha256:sha(completeSource),
  semanticAstBeforeSha256:sha(beforeTree),semanticAstAfterSha256:sha(afterTree),
  lineTerminatorsSha256:sha(terminators(source)),allBlockCommentsRetained:true,sourceLegalHeaderRetained:true,
  runtimeStatementsChanged:0,regexSourceScanning:false,readableSourceModified:false,commentTokenHashes:edits.map(edit=>edit.commentSha256)}};
}
module.exports={stripCoreCommentBudget};
if(require.main===module){
 const fs=require('node:fs'),input=JSON.parse(fs.readFileSync(0,'utf8'));
 const result=stripCoreCommentBudget(input.source,input.completeSource,input.contract,input.tier);
 process.stdout.write(JSON.stringify(result));
}

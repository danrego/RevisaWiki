'use strict';
// Use Node --expose-internals. Acorn is bundled with Node; nothing is downloaded.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const acorn=require('internal/deps/acorn/acorn/dist/acorn');
const RETIRED={it:43,tw:45,er:44,wf:26,wm:25,w1:37,tf:27,w4:40,ws:29};
const WARNING_KEYS=['tw','wf','wm','w1','tf','w4','ws'];
const HISTORICAL_HEADER_FALLBACK=new Set(['3572c2e039d55677ba958b842c5edfd32571dc10e001b3eb0a79dd96923906b8','d1baee706a8912f7acf21cc9e7a04c943ffa9537221fbfeefbb609b99a104d2a','835ffbfc1dad9b0bb5e56fa24452b558e1515cc5d955ee149a4857791d14e717','2e585e3282c9c14c69197bd9f21f92fbc676c2bcb2e5c7c6d0d1ba99117d9cb6']);
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
function keyOf(property){return property.computed?null:property.key?.name??property.key?.value;}
function walk(node,fn,parents=[]){
 if(!node||typeof node!=='object')return;
 if(Array.isArray(node)){for(const value of node)walk(value,fn,parents);return;}
 if(node.type)fn(node,parents);
 for(const [key,value]of Object.entries(node))if(!['start','end','loc','range'].includes(key)&&value&&typeof value==='object')walk(value,fn,node.type?[...parents,node]:parents);
}
function normalize(node,removed=new Set(),labels=new Set()){
 if(!node||typeof node!=='object')return node;
 if(removed.has(node))return undefined;
 if(Array.isArray(node))return node.map(n=>normalize(n,removed,labels)).filter(n=>n!==undefined);
 const result={};
 for(const [key,value]of Object.entries(node)){
  if(['start','end','loc','range'].includes(key))continue;
  if(labels.has(node)&&key==='value'){result.value='Atalhos explícitos';continue;}
  if(labels.has(node)&&key==='raw'){result.raw="'Atalhos explícitos'";continue;}
  const changed=normalize(value,removed,labels);if(changed!==undefined)result[key]=changed;
 }
 return result;
}
function sourceMap(node){
 if(node.type==='ObjectExpression')return node;
 if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='ownDictionary'&&node.arguments.length===1&&node.arguments[0].type==='ObjectExpression')return node.arguments[0];
 return null;
}
function headerReplacement(comment){
 if(comment.type!=='Block'||!/(?:RevisaWiki|Ajuste geral)/i.test(comment.value)||!/CC\s+BY-SA/i.test(comment.value))return null;
 const lines=comment.value.split('\n'),cut=lines.findIndex(line=>/^\s*\*\s*(?:Agradecimento(?:s)?\b|Créditos\b|Inspirad[oa]\b|Autor(?:ia)?\s*:)/i.test(line));
 const urls=[...comment.value.matchAll(/https?:\/\/(pt\.wikipedia\.org|en\.wiktionary\.org)\/[^\s*]*?\boldid=(\d+)[^\s*]*/g)].map(m=>'https://'+m[1]+'/w/index.php?oldid='+m[2]);
 if(cut<0)return null;
 const historicalFallback=!urls.length&&HISTORICAL_HEADER_FALLBACK.has(sha(comment.value));
 if(historicalFallback)for(const oldid of [66288743,72349758,73087684])urls.push('https://pt.wikipedia.org/w/index.php?oldid='+oldid);
 const prefix=lines.slice(0,cut);while(prefix.length&&/^\s*\*?\s*$/.test(prefix.at(-1)))prefix.pop();
 const credits=[' *',' * Agradecimentos aos scripts e às revisões anteriores.',' * Fontes e histórico nos links permanentes:',...[...new Set(urls)].map(url=>' * '+url)];
 assert(urls.length>0,'A credited header without permanent revision links requires review.');
 return {text:'/*'+[...prefix,...credits,' '].join('\n')+'*/',oldids:[...new Set(urls)].map(url=>Number(url.match(/oldid=(\d+)/)[1])),historicalFallback};
}
function flattenMessage(node){
 if(node.type==='BinaryExpression'&&node.operator==='+')return [...flattenMessage(node.left),...flattenMessage(node.right)];
 if(node.type==='Literal'&&typeof node.value==='string')return [node.value];
 if(node.type==='Identifier'&&node.name==='key')return [{key:true}];
 return [null];
}
function recognizedWarning(node,parents){
 if(node.type!=='IfStatement'||node.alternate)return false;
 if(!parents.some(p=>p.type==='FunctionDeclaration'&&p.id?.name==='expandShortcuts'))return false;
 const test=node.test;if(test.type!=='CallExpression'||test.callee.type!=='MemberExpression'||test.callee.computed||test.callee.property.name!=='includes'||test.arguments.length!==1||test.arguments[0].name!=='key'||test.callee.object.type!=='ArrayExpression')return false;
 if(JSON.stringify(test.callee.object.elements.map(x=>x.value))!==JSON.stringify(WARNING_KEYS))return false;
 const expression=node.consequent.type==='ExpressionStatement'&&node.consequent.expression;
 if(expression?.type!=='CallExpression'||expression.callee.name!=='warn'||expression.arguments.length!==1)return false;
 const parts=flattenMessage(expression.arguments[0]);
 return parts.length===3&&parts[0]==='O atalho '&&parts[1]?.key===true&&typeof parts[2]==='string'&&/^ pede referências a uma predefinição do [^.\n]+\. Pré-visualize a expansão e confira cada fonte antes de salvar\.$/.test(parts[2]);
}
function transform(source,options={}){
 assert.equal(typeof source,'string');
 const comments=[],ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script',onComment:comments});
 const edits=[],removed=new Set(),labels=new Set(),retired=[],mapProofs=[];let warningCount=0,headerCount=0;const sourceOldids=[],headerProofs=[];
 const maps=[];walk(ast,(node)=>{if(node.type==='VariableDeclarator'&&node.id.type==='Identifier'&&node.id.name==='SHORTCUTS'){const map=sourceMap(node.init);assert(map,'Unsupported shortcut-map shape requires review.');maps.push(map);}});
 for(const map of maps){
  const properties=map.properties;assert(properties.every(p=>p.type==='Property'),'Dynamic shortcut properties require review.');
  const chosen=[];
  for(const property of properties){
   const key=keyOf(property),value=property.value;
   if(!Object.hasOwn(RETIRED,key)||value.type!=='Literal'||typeof value.value!=='string')continue;
   const match=value.value.match(/^<?\{\{subst:(?:Usuário|Usuária|User):[^/{}|]+\/Predefinição(\d+)\}\}$/);
   if(match&&Number(match[1])===RETIRED[key])chosen.push(property);
  }
  for(const property of chosen){removed.add(property);retired.push(keyOf(property));}
  if(chosen.length===properties.length&&chosen.length)edits.push({start:map.start+1,end:map.end-1,text:'',kind:'retired-shortcut'});
  else for(const property of chosen){const i=properties.indexOf(property),next=properties[i+1],previous=properties[i-1];edits.push(next?{start:property.start,end:next.start,text:'',kind:'retired-shortcut'}:{start:previous.end,end:property.end,text:'',kind:'retired-shortcut'});}
  const neutral=properties.filter(p=>!removed.has(p));
  mapProofs.push({entriesBefore:properties.length,entriesAfter:neutral.length,retiredCommands:chosen.map(keyOf),neutralMappingsSha256:sha(JSON.stringify(normalize(neutral)))});
 }
 walk(ast,(node,parents)=>{
  if(node.type==='Property'&&keyOf(node)==='shortcuts'&&node.value.type==='Literal'&&typeof node.value.value==='string'&&/^Atalhos explícitos do .+$/.test(node.value.value)){
   const declaration=[...parents].reverse().find(p=>p.type==='VariableDeclarator');
   if(declaration?.id?.name==='GROUP_LABELS'){labels.add(node.value);edits.push({start:node.value.start,end:node.value.end,text:"'Atalhos explícitos'",kind:'neutral-label'});}
  }
  if(recognizedWarning(node,parents)){
   assert(maps.length>0&&maps.every(map=>WARNING_KEYS.every(key=>!map.properties.some(p=>keyOf(p)===key&&!removed.has(p)))),'A warning for a retained command cannot be removed.');
   removed.add(node);warningCount++;let start=node.start,end=node.end;
   const lineStart=source.lastIndexOf('\n',start-1)+1;if(/^\s*$/.test(source.slice(lineStart,start)))start=lineStart;
   if(source[end]==='\n')end++;
   edits.push({start,end,text:'',kind:'retired-warning'});
  }
 });
 if(options.anonymizeHeaders!==false)for(const comment of comments){const replacement=headerReplacement(comment);if(replacement&&replacement.text!==source.slice(comment.start,comment.end)){edits.push({start:comment.start,end:comment.end,text:replacement.text,kind:'neutral-comment-credits'});headerCount++;sourceOldids.push(...replacement.oldids);headerProofs.push({inputCommentSha256:sha(comment.value),outputCommentSha256:sha(replacement.text),verifiedHistoricalFallback:replacement.historicalFallback,permanentRevisionIds:replacement.oldids});}}
 for(const edit of edits)if(edit.kind!=='neutral-comment-credits')assert(!comments.some(c=>c.start<edit.end&&c.end>edit.start),'An executable edit overlapping an unrelated comment requires review.');
 edits.sort((a,b)=>a.start-b.start||a.end-b.end);
 const merged=[];for(const edit of edits){const last=merged.at(-1);if(last&&edit.start<last.end){assert(last.text===''&&edit.text===''&&last.kind==='retired-shortcut'&&edit.kind==='retired-shortcut','Unexpected edit overlap.');last.end=Math.max(last.end,edit.end);}else merged.push({...edit});}
 let text=source;for(const edit of [...merged].reverse())text=text.slice(0,edit.start)+edit.text+text.slice(edit.end);
 const after=acorn.parse(text,{ecmaVersion:'latest',sourceType:'script'}),projected=JSON.stringify(normalize(ast,removed,labels)),actual=JSON.stringify(normalize(after));
 assert.equal(actual,projected,'Unexpected executable AST change outside declared retirement/label scope.');
 const proof={schema:1,status:'passed',inputSha256:sha(source),outputSha256:sha(text),changed:source!==text,executableASTProjectedSha256:sha(projected),executableASTAfterSha256:sha(actual),ASTEquivalentOutsideDeclaredChanges:true,retiredOptionalCommands:retired.sort(),retiredWarningBranches:warningCount,neutralLabels:labels.size,neutralMappings:mapProofs,headerCreditParagraphsUpdated:headerCount,headerCreditProofs:headerProofs,permanentSourceRevisionIds:[...new Set(sourceOldids)],unrelatedCommentsPreserved:true,scientificCitationStringsPreserved:true,normalDefaultCodePreserved:true,scope:'Only exact optional personal-template key/number dependencies, their unreachable warning branch, the shortcut report label, and recognized RevisaWiki credit comments are changed. Other AST fields, including literals, regexes and template raw strings, remain exact.',networkRequests:0,wikipediaWrites:0};
 return {text,proof};
}
module.exports={transform,retiredCommands:Object.keys(RETIRED)};
if(require.main===module){
 const values={};for(let i=2;i<process.argv.length;i+=2){assert(/^--(?:input|output|proof)$/.test(process.argv[i]));values[process.argv[i].slice(2)]=process.argv[i+1];}
 assert(values.input&&values.output&&values.proof,'Required arguments: --input, --output, --proof.');
 const result=transform(fs.readFileSync(values.input,'utf8'));fs.writeFileSync(values.output,result.text);fs.writeFileSync(values.proof,JSON.stringify(result.proof,null,2)+'\n');console.log(JSON.stringify(result.proof));
}

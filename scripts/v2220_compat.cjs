'use strict';
// Version-specific AST-selected patches; historical source files stay frozen.
const fs=require('node:fs'),assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(value))value.forEach(item=>walk(item,visit));else if(value&&typeof value==='object')walk(value,visit);}}
const helperSource=String.raw`
function v222LegacyMagicCall(raw,ids){
 if(typeof raw!=='string'||!raw.startsWith('{{')||raw.startsWith('{{{')||!raw.endsWith('}}'))return false;
 const p=parsedTemplate(raw),head=p.parts[0].trim();
 return p.parts.length===1&&!/[{}:#<>\r\n]/.test(head)&&ids.includes(v222MagicIdentity(head));
}
function v222LegacySortOwnerCall(raw){
 if(typeof raw!=='string'||!raw.startsWith('{{')||raw.startsWith('{{{')||!raw.endsWith('}}'))return false;
 const p=parsedTemplate(raw),match=/^[ \t\r\n]*([^:{}\r\n]+?)[ \t]*:/.exec(p.parts[0]);
 return !!match&&v222MagicIdentity(match[1])==='defaultsort';
}
function v222LegacyHasSortCall(source){
 return templates(source).nodes.some(node=>v222LegacySortOwnerCall(source.slice(node.start,node.end)));
}
function v222LegacyStripPageName(source){
 const edits=templates(source).nodes.filter(node=>v222LegacyMagicCall(source.slice(node.start,node.end),['pagename'])).map(node=>({start:node.start,end:node.end,text:''}));
 return v24SyntaxApply(source,edits);
}
`;
function patch(source){
 let code=source;const changes=[];
 function alter(name,select,expected){
  const found=[];walk(parser.parse(code),node=>{if(node.type==='FunctionDeclaration'&&node.id.name===name)found.push(node);});assert.equal(found.length,1,name+' unique function');
  const owner=found[0],raw=code.slice(owner.start,owner.end),edits=[];
  walk(owner,node=>{const text=select(node,code);if(text!==null&&text!==undefined)edits.push({start:node.start-owner.start,end:node.end-owner.start,text});});
  assert.equal(edits.length,expected,name+' exact patch count');
  const sorted=edits.sort((a,b)=>a.start-b.start||a.end-b.end);assert(sorted.every((e,i)=>!i||e.start>=sorted[i-1].end),name+' nonoverlap');
  let next=raw;for(const edit of sorted.slice().reverse())next=next.slice(0,edit.start)+edit.text+next.slice(edit.end);
  assert.notEqual(next,raw,name+' changed');code=code.slice(0,owner.start)+next+code.slice(owner.end);
  changes.push({function:name,beforeSha256:sha(raw),afterSha256:sha(next),edits:sorted.length});
 }
 const regexTest=node=>node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.property.name==='test'&&node.callee.object.type==='RegExpLiteral',
  variableIds=JSON.stringify(['basepagename','pagename','fullpagename','subpagename','namespace','namespacenumber','talkpagename','subjectpagename','sitename']),
  pageIds=JSON.stringify(['basepagename','pagename','fullpagename','subpagename']);
 alter('v2215AliasPlan',node=>{
  if(node.type==='StringLiteral'&&node.value==='Imagem')return "'Ficheiro'";
  if(node.type==='RegExpLiteral'&&node.pattern==='^([ \\t]*)(thumb|thumbnail|miniaturadaimagem)([ \\t]*)$')return '/^([ \\t]*)(thumb|thumbnail)([ \\t]*)$/';
  return null;
 },2);
 alter('v2216LayoutSortOwner',node=>regexTest(node)&&node.callee.object.pattern.includes('DEFAULTSORT')?'v222LegacySortOwnerCall(raw)':null,1);
 alter('v2216LayoutPureProgram',node=>{
  if(!regexTest(node)||!node.callee.object.pattern.includes('BASEPAGENAME'))return null;
  return node.arguments[0].type==='Identifier'&&node.arguments[0].name==='name'?'v222LegacyMagicCall(raw,'+variableIds+')':'v222LegacyMagicCall(raw.slice(n.start,n.end),'+pageIds+')';
 },2);
 alter('v2216ObsoleteOwnerRemovalAllowed',node=>regexTest(node)&&node.callee.object.pattern.includes('BASEPAGENAME')?'v222LegacyMagicCall(child,'+variableIds+')':null,1);
 alter('v2216LayoutSisterInline',node=>node.type==='BinaryExpression'&&node.operator==='!=='&&node.left.type==='Identifier'&&node.left.name==='label'&&node.right.type==='StringLiteral'&&node.right.value==='{{BASEPAGENAME}}'?'!v222LegacyMagicCall(label,["basepagename"])':null,2);
 alter('v2216LayoutMetadata',node=>regexTest(node)&&node.callee.object.pattern.includes('DEFAULTSORT')?'v222LegacySortOwnerCall(source.slice(node.start,node.end))':null,1);
 alter('v2216LayoutFooter',node=>regexTest(node)&&node.callee.object.pattern.includes('DEFAULTSORT')?'v222LegacyHasSortCall(source)':null,1);
 alter('v2212PortalFooterRole',node=>node.type==='CallExpression'&&node.callee.type==='MemberExpression'&&node.callee.property.name==='replace'&&node.arguments[0]?.type==='RegExpLiteral'&&node.arguments[0].pattern==='\\{\\{PAGENAME\\}\\}'?'v222LegacyStripPageName(body.slice(root.end))':null,1);
 alter('v221CitationStateFields',(node,current)=>node.type==='ReturnStatement'?
  'const stateIntents=context.fields.filter(field=>v222CitationStateIntent(field.key)||v221CitationRole(field,"DeadURL")||v221CitationRole(field,"UrlStatus"));if(stateIntents.length>1)return stateIntents;'+current.slice(node.start,node.end):null,1);
 alter('v221BaselineCitation221',(node,current)=>{
  if(node.type!=='VariableDeclaration')return null;
  if(node.declarations.some(entry=>entry.id.type==='Identifier'&&entry.id.name==='parts'))return 'const v222StateSourceFields=v220CitationFields(raw),v222StateSourceIntents=v222StateSourceFields?v221CitationStateFields({fields:v222StateSourceFields}):[],v222HeldStateKeys=new Set(v222StateSourceIntents.length>1?v222StateSourceIntents.map(field=>field.key):[]);'+current.slice(node.start,node.end);
  if(node.declarations.some(entry=>entry.id.type==='Identifier'&&entry.id.name==='originalKey'))return current.slice(node.start,node.end)+'if(v222HeldStateKeys.has(originalKey))continue;';
  return null;
 },2);
 alter('v2215PreferredCall',(node,current)=>{
  if(node.type!=='ForOfStatement'||node.right.type!=='Identifier'||node.right.name!=='fields'||node.left.type!=='VariableDeclaration'||node.left.declarations[0]?.id.name!=='f')return null;
  return 'const v222PreferredStates=citation?v221CitationStateFields({fields}):[],v222PreferredHeldKeys=new Set(v222PreferredStates.length>1?v222PreferredStates.map(field=>field.key):[]);'+current.slice(node.start,node.body.start+1)+'if(v222PreferredHeldKeys.has(f.key))continue;'+current.slice(node.body.start+1,node.end);
 },1);
 alter('automaticParameters',(node,current)=>{
  if(node.type==='VariableDeclaration'&&node.declarations.some(entry=>entry.id.type==='Identifier'&&entry.id.name==='entries'))return 'const v222AutomaticFields=v220CitationFields(raw),v222AutomaticStates=v222AutomaticFields?v221CitationStateFields({fields:v222AutomaticFields}):[],v222AutomaticHeldKeys=new Set(v222AutomaticStates.length>1?v222AutomaticStates.map(field=>field.key):[]);'+current.slice(node.start,node.end);
  if(node.type==='IfStatement'&&node.test.type==='MemberExpression'&&node.test.object.name==='e'&&node.test.property.name==='remove')return 'if(e.remove||v222AutomaticHeldKeys.has(e.key))'+current.slice(node.consequent.start,node.end);
  if(node.type==='IfStatement'&&current.slice(node.test.start,node.test.end).startsWith("norm(family[0].key)!=='titre'"))return 'if(!v222AutomaticHeldKeys.has(family[0].key)&&('+current.slice(node.test.start,node.test.end)+'))'+current.slice(node.consequent.start,node.end);
  return null;
 },3);
 alter('v219CitationLanguageCall',(node,current)=>{
  if(node.type!=='ArrayExpression'||node.elements.length!==3||node.elements[0]?.type!=='ConditionalExpression'||node.elements[0].test?.type!=='MemberExpression'||node.elements[0].test.object.name!=='field'||node.elements[0].test.property.name!=='positional')return null;
  const value=node.elements[2];if(value?.type!=='CallExpression'||value.callee.name!=='readValue'||value.arguments[0]?.name!=='field')return null;
  return current.slice(node.start,value.start)+'v222CitationLanguageDateBinding(field,p,entries,cfg,'+current.slice(value.start,value.end)+',literalSyntax)'+current.slice(value.end,node.end);
 },1);
 alter('v219ReferenceBindingState',node=>node.type==='CallExpression'&&node.callee.name==='v2212OpaqueCiteWebHeader'&&node.arguments[0]?.name==='canonical'?'v222OpaqueCitationHeaderProjection(canonical,cfg)':null,1);
 alter('v219CitationLanguageRetention',(node,current)=>node.type==='ReturnStatement'&&node.argument?.type==='ConditionalExpression'&&node.argument.test.name==='certificate'?
  'if(certificate)return '+current.slice(node.argument.consequent.start,node.argument.consequent.end)+';const composed=retained.reason===\'Uma citação perdeu o campo de idioma, o valor original ou os argumentos ignorados pela interface nativa.\'?v222CitationBareAutonameCertificate(before,after,options):null;return composed?{accepted:true,reason:\'\',certificate:composed}:retained;':null,1);
 const ast=parser.parse(code),apis=[];walk(ast,node=>{if(node.type==='VariableDeclarator'&&node.id?.name==='api')apis.push(node);});assert.equal(apis.length,1,'one engine API');
 const at=code.lastIndexOf('const api',apis[0].start);assert(at>=0);code=code.slice(0,at)+helperSource+'\n'+code.slice(at);parser.parse(code);
 return {code,receipt:{scope:'2.22 native alias readers and citation-state collision compatibility only',sourceSha256:sha(source),outputSha256:sha(code),changes,insertedHelperSha256:sha(helperSource),historicalSourceFilesModified:false}};
}
if(require.main===module){const[input,output,receipt]=process.argv.slice(2);assert(input&&output&&receipt,'input output receipt');const result=patch(fs.readFileSync(input,'utf8'));fs.writeFileSync(output,result.code);fs.writeFileSync(receipt,JSON.stringify(result.receipt,null,2)+'\n');}
module.exports={patch};

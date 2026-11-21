'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end'].includes(key))continue;if(Array.isArray(value))value.forEach(child=>walk(child,visit));else if(value&&typeof value==='object')walk(value,visit);}}
function patch(source){
 const changes=[],patches=[];const tree=parser.parse(source),functions=new Map();
 walk(tree,node=>{if(node.type==='FunctionDeclaration'&&node.id){const rows=functions.get(node.id.name)||[];rows.push(node);functions.set(node.id.name,rows);}});
 const update=(name,replacements)=>{const found=functions.get(name)||[];assert(found.length<=1,'Unique layout writer '+name);if(!found.length)return;const node=found[0],before=source.slice(node.start,node.end);let after=before;
  if(typeof replacements==='function')after=replacements(before);else for(const[from,to]of replacements){if(after.includes(to))continue;assert.equal(after.split(from).length,2,'Pinned writer anchor '+name);after=after.replace(from,to);}
  if(before!==after){patches.push({start:node.start,end:node.end,text:after});changes.push({name,beforeSha256:hash(before),afterSha256:hash(after)});}
 };
 update('v222FooterAuthorityEdits',[["v215SameTemplateTitle(parsedTemplate(n.raw).parts[0],'Controle de autoridade')","v2221LayoutValidPortugueseAuthority(parsedTemplate(n.raw).parts[0])"]]);
 update('v2216LayoutFooter',[
  ["!v2216LayoutNamed(node.raw||source.slice(node.start,node.end),['Controle de autoridade'])","!v2221LayoutValidPortugueseAuthority(parsedTemplate(node.raw||source.slice(node.start,node.end)).parts[0])"],
  ["if(node.end!==portal.start&&(","if(node.end!==portal.start&&!v2221LayoutAuthorityTaxonGap(source,node,portal)&&("],
  ["!/^\\r?\\n$/.test(gap)","!/^\\r?\\n\\r?\\n$/.test(gap)"],
  ["text:raw+'\\n',kind:'authority-before-portals-insert'","text:raw+'\\n\\n',kind:'authority-before-portals-insert'"],
  ["raw=raw.replace(/^\\{\\{[^|}]+/,'{{Controle de autoridade')","raw=v2221LayoutAuthorityCall(raw)"]
 ]);
 update('v2216LayoutMetadata',[["if(cfg.endMatter===false||cfg.categories===false)","if(cfg.endMatter===false||cfg.categories===false||v2221LayoutUnprovedCategory(source))"]]);
 update('v222FooterOrderEdits',[["text=ordered.map(n=>n.raw).join(newline)","text=ordered.map((n,index)=>(index&&n.role==='portal'&&ordered[index-1].role!=='portal'?newline:'')+n.raw).join(newline)"]]);
 update('v220LeadingBlankEdits',raw=>{
  const marker='/* Leading separators are cleaned after an actual description removal. */';if(raw.includes(marker))return raw;
  const fn=parser.parse(raw).program.body[0],branches=[];walk(fn,node=>{if(node.type==='IfStatement'&&raw.slice(node.test.start,node.test.end)==='cfg.shortDescriptions!==false')branches.push(node);});
  assert.equal(branches.length,1,'Pinned description-gap writer branch');const branch=branches[0];assert(raw.slice(branch.start,branch.end).includes("'v220DescriptionLeadingGap'"),'Only the anticipatory separator write is removed');
  const comments=(branch.leadingComments||[]).filter(comment=>/Remove only the separator that the already enabled description rule|would expose at offset zero/.test(comment.value));assert([0,2].includes(comments.length),'Pinned obsolete description-gap explanation');
  return raw.slice(0,(comments.length?Math.min(...comments.map(comment=>comment.start)):branch.start))+marker+raw.slice(branch.end);
 });
 update('v2215PdPlan',[["text=banner+(body?newline+body:newline)","text=banner+(body?newline+body:'')"]]);
 update('v2217TalkOrderedHeader',[["const priority={header:0,translation:1,projects:2,fusion:3};","const priority={header:0,projects:1,translation:2,fusion:3};"]]);
 update('preservationFormattingText',raw=>{
  if(raw.includes('const v2221ColumnProse=v2221LayoutProseColumns('))return raw;
  const fn=parser.parse(raw).program.body[0],param=fn.params[0],first=fn.body.body[0],decls=first?.declarations;
  assert(fn.params.length===1&&param?.type==='Identifier'&&first?.type==='VariableDeclaration'&&first.kind==='const'&&decls.length===2,'Pinned prose-column reader');
  const [parsed,fields]=decls,a=parsed.init,b=fields.init;
  assert(parsed.id.type==='Identifier'&&a?.type==='CallExpression'&&a.callee.name==='parsedTemplate'&&a.arguments.length===1&&a.arguments[0].name===param.name&&b?.type==='CallExpression'&&b.callee.name==='preservationTemplateFields'&&b.arguments.length===1&&b.arguments[0].type==='MemberExpression'&&!b.arguments[0].computed&&b.arguments[0].object.name===parsed.id.name&&b.arguments[0].property.name==='parts','Pinned prose-column reader');
  const prefix='const v2221ColumnProse=v2221LayoutProseColumns('+param.name+');if(v2221ColumnProse!==null)return v2221ColumnProse;';
  return raw.slice(0,first.start)+prefix+raw.slice(first.start);
 });
 for(const name of ['v211AppendConfirmedPortals','addBiographyPortal'])update(name,raw=>{
  if(raw.includes('const v2221PortalContext=v2221LayoutPortalPresence('))return raw;
  const fn=parser.parse(raw).program.body[0],sourceParam=fn.params[0],cfgParam=fn.params[1];
  assert(sourceParam?.type==='Identifier'&&cfgParam?.type==='Identifier','Pinned portal arguments');
  const declarations=fn.body.body.filter(node=>node.type==='VariableDeclaration'),biography=declarations.flatMap(statement=>statement.declarations.map(declaration=>({statement,declaration}))).filter(({declaration})=>declaration.init?.type==='CallExpression'&&declaration.init.callee.name==='biographyNodes'&&declaration.init.arguments.length===1&&declaration.init.arguments[0].name===sourceParam.name);
  assert.equal(biography.length,1,'Pinned portal reader');
  const b=biography[0];assert(b.declaration.id.type==='ObjectPattern'&&b.declaration.id.properties.length===1&&b.declaration.id.properties[0].key.name==='nodes','Pinned portal node binding');
  const footers=[],fallbacks=[];walk(fn,node=>{
   if(node.type==='CallExpression'&&node.callee.name==='footerTokens'&&node.arguments[0]?.name===sourceParam.name)footers.push(node);
   if(node.type==='IfStatement'&&node.test.type==='CallExpression'&&node.test.callee.type==='MemberExpression'&&node.test.callee.property.name==='some'){
    const call=node.test.callee.object,inner=call?.arguments?.[0];
    if(call?.type==='CallExpression'&&call.callee.name==='topNodes'&&inner?.type==='CallExpression'&&inner.callee.name==='protectedView'&&inner.arguments[0]?.name===sourceParam.name)fallbacks.push(node.test);
   }
  });
  assert.equal(footers.length,1,'Pinned portal footer reader');assert.equal(fallbacks.length,1,'Pinned portal absence check');
  const footer=footers[0];assert(footer.arguments.length===2&&footer.arguments[1].type==='MemberExpression'&&footer.arguments[1].object.name===cfgParam.name&&footer.arguments[1].property.name==='footerProfiles','Pinned portal footer profiles');
  const local=[{start:b.statement.start,end:b.statement.start,text:'const v2221PortalContext=v2221LayoutPortalPresence('+sourceParam.name+');'},
   {start:b.declaration.init.start,end:b.declaration.init.end,text:'({nodes:v2221PortalContext.loose})'},
   {start:footer.start,end:footer.end,text:'v2221LayoutPortalFooter('+sourceParam.name+','+cfgParam.name+'.footerProfiles,v2221PortalContext)'},
   {start:fallbacks[0].start,end:fallbacks[0].end,text:'(v2221PortalContext.any.length||v2221PortalContext.uncertain)'}];
  for(const edit of local.sort((a,b)=>b.start-a.start||b.end-a.end))raw=raw.slice(0,edit.start)+edit.text+raw.slice(edit.end);
  return raw;
 });
 update('v2212PortalRelocate',raw=>{
  if(raw.includes('v2221LayoutPortalFooter('))return raw;
  const fn=parser.parse(raw).program.body[0],sourceParam=fn.params[0],calls=[];assert(sourceParam?.type==='Identifier','Pinned portal relocation source');
  walk(fn,node=>{if(node.type==='CallExpression'&&node.callee.name==='footerTokens')calls.push(node);});
  assert.equal(calls.length,2,'Pinned portal relocation footer readers');
  for(const call of calls){assert(call.arguments.length===2&&call.arguments.every(arg=>arg.type==='Identifier'),'Pinned portal relocation arguments');}
  assert.equal(calls[0].arguments[0].name,sourceParam.name,'Original portal relocation source');assert.equal(calls[0].arguments[1].name,calls[1].arguments[1].name,'Shared portal relocation profiles');
  for(const call of calls.sort((a,b)=>b.start-a.start))raw=raw.slice(0,call.start)+'v2221LayoutPortalFooter('+call.arguments.map(arg=>arg.name).join(',')+')'+raw.slice(call.end);
  return raw;
 });
 for(const row of patches.sort((a,b)=>b.start-a.start))source=source.slice(0,row.start)+row.text+source.slice(row.end);
 parser.parse(source);return{code:source,proof:{method:'Pinned writer-local AST ranges; align verified local source writers',changes}};
}
module.exports={patch};

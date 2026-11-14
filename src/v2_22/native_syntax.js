// Native aliases share an identity. Operands and punctuation remain untouched.
function v222MagicIdentity(header) {
 if(typeof header!=='string')return null;
 const value=header.trim().replace(/^#/,'').replace(/:$/,'');
 for(const [id,aliases,sensitive] of V222_CATALOG.syntax.magicAliases)
  for(const alias of aliases){const key=alias.replace(/^#/,'').replace(/:$/,'');if(sensitive?value===key:value.toLowerCase()===key.toLowerCase())return id;}
 return null;
}
function v222MagicEnglishHeader(header) {
 const id=v222MagicIdentity(header);if(!id)return header;
 const row=V222_CATALOG.syntax.magic.find(x=>x[2]===id&&x[3]!=='switch-default-branch-marker');
 return row?row[0]:header;
}
function v222NativeMagicRow(key,kind=null) {
 for(const row of V222_CATALOG.syntax.magic){
  if(kind&&row[3]!==kind)continue;
  if(row[4]?key===row[0]:key.toLowerCase()===row[0].toLowerCase())return row;
 }
 // This is a separate explicit spelling preference, not a behavioral change.
 if(['ORDENACAOPADRAO','ORDEMPADRAO','ORDEMPADRÃO'].includes(key))return [''+key,'ORDENAÇÃOPADRÃO','defaultsort','variable-or-colon-function',true];
 return null;
}
function v222NativeLinkNodes(view) {
 const stack=[],nodes=[];
 for(let i=0;i<view.length-1;i++){
  if(view.slice(i,i+2)==='[['){stack.push(i);i++;}
  else if(view.slice(i,i+2)===']]'){if(stack.length)nodes.push({start:stack.pop(),end:i+2});i++;}
 }
 return nodes;
}
function v222NativeNamespacePrefix(header) {
 const m=/^([ \t\r\n]*:?\s*)([^:{}\[\]|\r\n]+):/.exec(header);if(!m)return null;
 const from=m[2].replace(/_/g,' ').trim();
 const row=V222_CATALOG.syntax.namespaces.find(x=>x[0].slice(0,-1).toLowerCase()===from.toLowerCase());
 return row?{start:m[1].length,end:m[1].length+m[2].length,text:row[1].slice(0,-1),id:row[2]}:null;
}
function v222NativeImageOption(part) {
 const core=part.trim();
 for(const [from,to,id] of V222_CATALOG.syntax.image){
  if(!from.includes('$1')){if(core===from){const at=part.indexOf(core);return {start:at,end:at+core.length,text:to,id};}continue;}
  const [prefix,suffix]=from.split('$1');
  if(!core.startsWith(prefix)||!core.endsWith(suffix))continue;
  const value=core.slice(prefix.length,core.length-suffix.length||undefined);
  if(id==='img_page'&&!/^[1-9]\d*$/.test(value))continue;
  if(id==='img_upright'&&!/^\d+(?:[.,]\d+)?$/.test(value))continue;
  // The value is deliberately not translated, decoded, or made nonempty.
  const at=part.indexOf(core),before=to.split('$1')[0];
  return {start:at,end:at+prefix.length,text:before,id};
 }
 return null;
}
function v222NativeSyntaxPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.markup===false||cfg.multilingual===false)return v222EditsPlan(source,edits);
 const shield=v222Protected(source),view=shield.view,add=(start,end,text,kind,proof)=>edits.push({start,end,text,count:1,kind,proof});
 for(const node of v24SyntaxTemplates(view).nodes){
  if(node.size!==2)continue;
  const raw=source.slice(node.start,node.end),parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)continue;
  const header=parts[0].text,m=/^([ \t\r\n]*)(?:(subst:|safesubst:)[ \t]*)?(#?[^:{}|\r\n]+?)([ \t]*)(:|$)/i.exec(header);
  if(!m)continue;
  const word=m[3],row=v222NativeMagicRow(word),colon=m[5]===':',wordAt=node.start+2+m[0].indexOf(word);
  if(row&&row[3]!=='behavior-switch'&&row[3]!=='redirect-directive'&&row[3]!=='switch-default-branch-marker'){
   const isFunction=['colon-parser-function','parser-function'].includes(row[3]);
   // Defaultsort and displaytitle have colon grammar; a pipe-only homonym is a template.
   const needsColon=isFunction||['defaultsort','displaytitle'].includes(row[2]);
   const shape=row[3]!=='variable-or-colon-function'||(colon?V222_CATALOG.syntax.magicColonIds:V222_CATALOG.syntax.magicVariableIds).includes(row[2]);
   if(shape&&(!needsColon||colon)&&(colon||parts.length===1)&&view.slice(wordAt,wordAt+word.length)===word)
    add(wordAt,wordAt+word.length,row[1],'native-magic-alias',{nativeId:row[2],from:word,to:row[1]});
  }
  if(v222MagicIdentity(word)==='switch'&&colon){
   for(const part of parts.slice(1)){
    const branch=/^([ \t\r\n]*)(#default)([ \t]*)=/i.exec(part.text);if(!branch)continue;
    const at=node.start+2+part.start+branch[1].length;
    if(view.slice(at,at+branch[2].length)===branch[2])add(at,at+branch[2].length,'#padrão','native-switch-default',{nativeId:'default'});
   }
  }
  // A literal namespace prefix in a transclusion is not a prose string.
  if(!colon||!row){const ns=v222NativeNamespacePrefix(header);if(ns&&ns.id===10)add(node.start+2+ns.start,node.start+2+ns.end,ns.text,'native-transclusion-namespace',{namespaceId:10});}
 }
 const urls=[...view.matchAll(/\bhttps?:\/\/[^\s<>]+/gi)].map(m=>({start:m.index,end:m.index+m[0].length})),switches=/__[A-Za-zÀ-ÿ]+__/g;let match;
 while((match=switches.exec(view))){if(urls.some(r=>r.start<=match.index&&match.index<r.end))continue;const row=v222NativeMagicRow(match[0],'behavior-switch');if(row)add(match.index,match.index+match[0].length,row[1],'native-behavior-alias',{nativeId:row[2]});}
 const redirect=/^(\uFEFF?[ \t]*)(#REDIRECT)(?=[ \t]*\[\[)/i.exec(view);
 if(redirect)add(redirect[1].length,redirect[1].length+redirect[2].length,'#REDIRECIONAMENTO','native-redirect-alias',{nativeId:'redirect'});
 for(const node of v222NativeLinkNodes(view)){
  const body=source.slice(node.start+2,node.end-2),parts=v24SyntaxParts(body);if(!parts)continue;
  const ns=v222NativeNamespacePrefix(parts[0].text);
  if(ns)add(node.start+2+ns.start,node.start+2+ns.end,ns.text,'native-link-namespace',{namespaceId:ns.id});
  const header=parts[0].text,local=/^\s*([^:{}\[\]|]+):/.exec(header),name=local&&local[1].replace(/_/g,' ').trim(),id=name&&Object.entries(V222_CATALOG.syntax.namespaceAliases).find(([alias])=>alias.toLowerCase()===name.toLowerCase())?.[1];
  if(id!==6||/^\s*:/.test(header))continue;
  for(const part of parts.slice(1)){
   const option=v222NativeImageOption(part.text);if(!option)continue;
   const at=node.start+2+part.start+option.start,end=node.start+2+part.start+option.end;
   if(view.slice(at,end)===source.slice(at,end))add(at,end,option.text,'native-image-option',{nativeId:option.id});
  }
 }
 return v222EditsPlan(source,edits);
}
function v222NativeSyntaxProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v222NativeSyntaxPlan);}

'use strict';
// Independent corpus observation only; never used by the adjustment engine.
const assert=require('node:assert/strict'),fs=require('node:fs');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function literalAttrs(raw){
 let text=raw.replace(/^<ref\b/i,'').replace(/\/?\s*>$/,'');const out={};
 while(text.trim()){
  const m=/^\s+(name|group)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/.exec(text);
  if(!m||Object.hasOwn(out,m[1]))return null;
  const value=m[2]??m[3]??m[4];if(/[{}<>\r\n]/.test(value))return null;
  out[m[1]]=value;text=text.slice(m[0].length);
 }
 return out;
}
function refTagGraph(view){
 const tags=[];let stack=null,cursor=0;
 while(cursor<view.length){
  const at=view.indexOf('<',cursor);if(at<0)break;
  const intent=/^<\s*\/?\s*ref(?=[\s/>])/i.exec(view.slice(at));
  if(!intent){cursor=at+1;continue;}
  const head=/^<(\/?)ref(?=[\s/>])/i.exec(view.slice(at));if(!head)return null;
  let quote=null,end=at+head[0].length;
  for(;end<view.length;end++){const ch=view[end];if(quote){if(ch===quote)quote=null;}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='>')break;}
  if(end===view.length)return null;
  const raw=view.slice(at,end+1),close=!!head[1],self=!close&&/\/\s*>$/.test(raw),tag={start:at,end:end+1,raw,close,self};
  if(close){if(!/^<\/ref\s*>$/i.test(raw)||stack===null)return null;stack=null;}
  else if(!self){if(stack!==null)return null;stack=tag;}
  tags.push(tag);cursor=end+1;
 }
 return stack===null?tags:null;
}
function referenceLiteralProjection(source,inventory,api){
 if(typeof source!=='string'||typeof inventory!=='function'||typeof api?.v219NativeReferenceObserver!=='function')return{valid:false,reason:'missing-independent-reader'};
 const observed=api.v219NativeReferenceObserver(source),tags=refTagGraph(observed.view);
 if(!tags||observed.unclosed?.length||observed.shield?.unclosed?.length)return{valid:false,reason:'unclosed-or-ambiguous-literal-reference-owner'};
 const refs=[],definitions=new Map();
 for(const ref of observed.refs){
  const opening=tags.find(t=>t.start===ref.start&&!t.close),attrs=opening&&literalAttrs(source.slice(opening.start,opening.end));
  if(!ref.valid||!opening||!attrs||!!opening.self!==!!ref.self||ref.close&&!tags.some(t=>t.close&&t.start===ref.close.start&&t.end===ref.close.end))return{valid:false,reason:'unproved-literal-reference-interface'};
  const group=attrs.group??'';if(group!==String(ref.group??''))return{valid:false,reason:'unproved-inherited-or-encoded-group'};
  const name=attrs.name??'',identity=JSON.stringify([group,name]),body=ref.body===null?null:source.slice(opening.end,ref.close.start);
  if(body!==null&&body!==ref.body)return{valid:false,reason:'body-code-units-not-identical'};
  const row={...ref,opening,attrs,group,name,identity,body};refs.push(row);
  if(name&&body!==null&&body.trim()){if(!definitions.has(identity))definitions.set(identity,new Set());definitions.get(identity).add(body);}
 }
 if(tags.filter(t=>!t.close).length!==refs.length)return{valid:false,reason:'unobserved-literal-reference-tag'};
 const edits=[],referenceBlocks=[];let expansionBytes=0,expanded=0;
 for(const ref of refs){
  let body=ref.body;
  if(body===null&&ref.name){const bodies=definitions.get(ref.identity);if(bodies?.size===1){body=[...bodies][0];const blocks=inventory(body);if(blocks.length){expansionBytes+=body.length;if(expansionBytes>8388608)return{valid:false,reason:'observer-expansion-budget'};edits.push({start:ref.start,end:ref.end,text:source.slice(ref.start,ref.opening.end).replace(/\/\s*>$/,'>')+body+'</ref>'});expanded++;}}}
  if(body!==null){const blocks=inventory(body);for(const block of blocks)referenceBlocks.push({group:ref.group,block});}
 }
 let text=source,outside=source;
 for(const ref of [...refs].sort((a,b)=>b.start-a.start))outside=outside.slice(0,ref.start)+outside.slice(ref.start,ref.end).replace(/[^\r\n]/g,' ')+outside.slice(ref.end);
 for(const edit of edits.sort((a,b)=>b.start-a.start))text=text.slice(0,edit.start)+edit.text+text.slice(edit.end);
 return{valid:true,text,outside,referenceBlocks,expanded,rawIdentity:true,rawBodyValues:true};
}
function literalBlocksEvidence(before,after,inventory,api){
 const rawExact=equal(inventory(before),inventory(after));if(rawExact)return{accepted:true,rawExact:true,qualified:false,reason:'raw-literal-sequence-exact'};
 const left=referenceLiteralProjection(before,inventory,api),right=referenceLiteralProjection(after,inventory,api);
 if(!left.valid||!right.valid)return{accepted:false,rawExact:false,qualified:false,reason:left.reason||right.reason};
 const outsideExact=equal(inventory(left.outside),inventory(right.outside)),referenceBodiesExact=equal(left.referenceBlocks,right.referenceBlocks),expandedSequenceExact=equal(inventory(left.text),inventory(right.text));
 return{accepted:outsideExact&&referenceBodiesExact&&expandedSequenceExact,rawExact:false,qualified:outsideExact&&referenceBodiesExact&&expandedSequenceExact,reason:'raw-body-exact-uniquely-resolved-literal-reference-reuses',outsideExact,referenceBodiesExact,expandedSequenceExact,beforeExpansions:left.expanded,afterExpansions:right.expanded,identityNormalization:false,productGuardsChanged:false};
}
function literalBlocksExact(before,after,inventory,api){return literalBlocksEvidence(before,after,inventory,api).accepted;}
module.exports={literalBlocksExact,literalBlocksEvidence,referenceLiteralProjection};
if(require.main===module){
 const bundle=process.env.REVISAWIKI_CURRENT_CORE||require('node:path').resolve(__dirname,'../../dist/2.22.0/RevisaWiki_v2_22_0.js'),api=require(bundle);
 const inventory=s=>[...s.matchAll(/<(nowiki|math|syntaxhighlight|pre)\b[^>]*>[\s\S]*?<\/\1\s*>/gi)].map(m=>({tag:m[1].toLowerCase(),raw:m[0]}));
 let checks=0;const results=[];function probe(id,a,b,wanted){const evidence=literalBlocksEvidence(a,b,inventory,api);checks++;assert.equal(evidence.accepted,wanted,id);results.push({id,evidence});}
 const body='Fonte de exemplo: <nowiki>https://example.org/fonte?x=1</nowiki>',other='Outra: <nowiki>https://example.org/outra</nowiki>',anon=x=>'<ref>'+x+'</ref>',def=(name,x)=>'<ref name="'+name+'">'+x+'</ref>',use=name=>'<ref name="'+name+'" />';
 probe('two-byte-identical-inline-definitions-become-definition-and-reuse',anon(other)+anon(body)+anon(body),anon(other)+def('fonte',body)+use('fonte'),true);
 probe('separate-prose-literal-cannot-be-compensated-by-reference',anon(body)+'<nowiki>https://example.org/fonte?x=1</nowiki>',def('fonte',body)+use('fonte'),false);
 probe('different-raw-body-url-not-retained',anon(body)+anon(body),def('fonte',body.replace('x=1','x=2'))+use('fonte'),false);
 probe('outside-reference-formula-loss-never-qualified','<math>x^2</math>'+anon(body)+anon(body),def('fonte',body)+use('fonte'),false);
 probe('outside-reference-literal-loss-never-qualified','<nowiki>outside</nowiki>'+anon(body)+anon(body),def('fonte',body)+use('fonte'),false);
 probe('unresolved-reuse-cannot-replace-literal',anon(body)+anon(body),def('fonte',body)+use('ausente'),false);
 probe('conflicting-definition-not-expanded',anon(body)+anon(body)+anon(other),def('fonte',body)+def('fonte',other)+use('fonte'),false);
 probe('raw-NFC-NFD-names-not-unified',anon(body)+anon(body),def('Á',body)+use('A\u0301'),false);
 probe('raw-name-case-not-unified',anon(body)+anon(body),def('Fonte',body)+use('fonte'),false);
 probe('raw-group-case-not-unified','<ref group="nota">'+body+'</ref><ref group="nota">'+body+'</ref>','<ref group="nota" name="f">'+body+'</ref><ref group="Nota" name="f" />',false);
 probe('same-explicit-raw-group','<ref group="nota">'+body+'</ref><ref group="nota">'+body+'</ref>','<ref group="nota" name="f">'+body+'</ref><ref group="nota" name="f" />',true);
 for(const extra of ['</ref>','<ref name="aberta">','<\nref name="malformada">','<ref name="a" follow="f" />'])probe('ambiguous-owner-'+results.length,anon(body)+anon(body)+extra,def('fonte',body)+use('fonte')+extra,false);
 probe('example-reference-tags-stay-literal','<nowiki>'+anon(body)+'</nowiki>','<nowiki>'+def('fonte',body)+'</nowiki>',false);
 probe('raw-entity-name-spelling-not-unified',anon(body)+anon(body),def('a&amp;b',body)+use('a&#38;b'),false);
 probe('duplicate-identical-named-definitions-remain-resolved',def('f',body)+def('f',body),def('f',body)+use('f'),true);
 probe('raw-punctuation-inside-opaque-block-untouched',anon(body)+anon(body),def('f',body.replace('x=1','x=1 '))+use('f'),false);
 probe('different-order-of-reference-literals-not-qualified',anon(body)+anon(other)+anon(body),def('f',body)+use('f')+anon(other),false);
 const report={suite:'strict-independent-literal-reference-reuse-observer',cases:results.length,checks,results,passed:true,identityNormalization:false,productFunctionsChanged:false,apiGuardAssertionsChanged:false,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:results.length,checks,passed:true}));
}

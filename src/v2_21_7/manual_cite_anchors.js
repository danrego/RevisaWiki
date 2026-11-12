// Keep authored Cite targets and their ordered producers stable at write admission.
// Pure executors remain available unchanged for read-only preservation projections.
function v2217AnchorProtectionRequired(source,cfg={}){return cfg.sectionOnly===true||v2217AuthoredCiteFragments(source,cfg).length>0;}
function v2217AnchorDecoded(value){
 let out=String(value).replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi,(_,h,d)=>{try{return String.fromCodePoint(parseInt(h||d,h?16:10));}catch{return _;}}).replace(/&(amp|num|lowbar|colon);/gi,(_,n)=>({amp:'&',num:'#',lowbar:'_',colon:':'})[n.toLowerCase()]);
 for(let pass=0;pass<2;pass++){try{const next=decodeURIComponent(out);if(next===out)break;out=next;}catch{break;}}
 return out;
}
function v2217AuthoredCiteFragments(source,cfg={}){
 if(typeof source!=='string'||!/(?:cite|%|&#|&UnderBar;)/i.test(source))return[];
 const decode=raw=>{let text=String(raw);for(let pass=0;pass<3;pass++){const next=v2217AnchorDecoded(text).replace(/(?:%[0-9a-f]{2})+/gi,run=>{try{return decodeURIComponent(run);}catch{return run.replace(/%([0-9a-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));}}).replace(/&UnderBar;/gi,'_');if(next===text)break;text=next;}return text;};
 let possible=source;for(let pass=0;pass<3;pass++){const next=decode(possible.replace(/%([0-9a-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16))));if(next===possible)break;possible=next;}
 if(!/cite_(?:note|ref)-/i.test(possible))return[];
 const view=v219NativeReferenceObserver(source).view,found=[],covered=[];
 const title=raw=>{const text=decode(raw).replace(/_/g,' ').replace(/\s+/g,' ').trim();return text?text[0].toLocaleUpperCase('pt')+text.slice(1):text;};
 const classify=raw=>{
  let value=decode(raw).trim().replace(/^:\s*/,'');if(!/cite_(?:note|ref)-/i.test(value))return'none';
  const hash=value.indexOf('#');if(hash<0||!/^#cite_(?:note|ref)-/i.test(value.slice(hash)))return'uncertain';
  let prefix=value.slice(0,hash);if(!prefix)return'local';if(/[{}]/.test(prefix))return'uncertain';
  const urlLike=/^(?:https?:|\/\/|\/wiki\/|\/w\/)|^[a-z\d.-]+\.[a-z]{2,}(?:\/|$)/i.test(prefix);
  if(urlLike){
   value=value.replace(/^(https?):\/?(?!\/)/i,'$1://');
   if(/^[a-z\d.-]+\.[a-z]{2,}(?:\/|#)/i.test(value))value='http://'+value;
   try{const url=new URL(value,'https://pt.wikipedia.org');if(url.username||url.password)return'uncertain';
    if(url.hostname!=='pt.wikipedia.org')return url.hostname==='pt.m.wikipedia.org'?'uncertain':'foreign';
    let target=null;if(url.pathname.startsWith('/wiki/'))target=url.pathname.slice(6);else if(url.pathname==='/w/index.php'&&url.searchParams.has('title'))target=url.searchParams.get('title');
    return target!==null&&cfg.pageTitle&&title(target)===title(cfg.pageTitle)?'local':'uncertain';
   }catch{return'uncertain';}
  }
  return cfg.pageTitle&&title(prefix)===title(cfg.pageTitle)?'local':'uncertain';
 };
 const record=(kind,start,end,target,targetStart,targetEnd)=>{const state=classify(target);if(state==='none')return;covered.push({start:targetStart,end:targetEnd,state});if(state!=='foreign')found.push({start,end,kind,raw:source.slice(start,end)});};
 for(const match of view.matchAll(/\[\[([^\]\r\n]*?)\]\]/g)){const target=match[1].split('|')[0];record('authored-local-wikilink',match.index,match.index+match[0].length,target,match.index+2,match.index+2+target.length);}
 for(const match of view.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)){const target=match[1]??match[2]??match[3],start=match.index+match[0].indexOf(target);record('authored-local-href',match.index,match.index+match[0].length,target,start,start+target.length);}
 for(const match of view.matchAll(/(?<!\[)\[(?!\[)([^\s\]]+)(?:[ \t]+[^\]\r\n]*)?\]/g))record('authored-local-external-fragment',match.index,match.index+match[0].length,match[1],match.index+1,match.index+1+match[1].length);
 // Unknown local consumers keep their literal target. This deliberately does
 // not claim every visible Cite token is an active rendered hyperlink.
 for(const match of view.matchAll(/[^\s<>{}\[\]|"']+/g)){
  const start=match.index,end=start+match[0].length;if(!/cite_(?:note|ref)-/i.test(decode(match[0])))continue;
  if(covered.some(range=>range.start<=start&&end<=range.end))continue;
  const state=classify(match[0]);if(state==='foreign'||state==='none')continue;
  found.push({start,end,kind:'visible-literal-cite-target',raw:source.slice(start,end)});
 }
 return found.sort((a,b)=>a.start-b.start||a.end-b.end);
}
function v2217CiteProducerSnapshot(source,cfg={}){
 const anchors=v2217AuthoredCiteFragments(source,cfg);if(!v2217AnchorProtectionRequired(source,cfg))return null;
 const old=v2217Previous_v219ReferenceIdentityQuarantine(source,cfg,true);
 return JSON.stringify({anchors:anchors.map(a=>[a.kind,a.raw]),producers:old.ranges.map(r=>[r.kind,source.slice(r.start,r.end)])});
}
function v2217AnchorProducerSnapshot(source,cfg={}){const cite=v2217CiteProducerSnapshot(source,cfg),heading=v2217HeadingSnapshot(source,cfg);return cite===null&&heading===null?null:JSON.stringify({cite,heading});}
function v2217AnchorRawAudit(before,after,cfg={}){
 if(before===after||typeof before!=='string'||typeof after!=='string')return[];
 const cite=v2217CiteProducerSnapshot(before,cfg),oldHeading=v2217HeadingSnapshot(before,cfg),out=[];
 if(cite!==null&&cite!==v2217CiteProducerSnapshot(after,cfg))out.push({code:'authored-cite-anchor-identity-changed',severity:'warning',start:-1,message:'A identidade de uma nota ligada manualmente foi preservada.'});
 if(oldHeading!==null&&oldHeading!==v2217HeadingSnapshot(after,cfg))out.push({code:'authored-heading-anchor-identity-changed',severity:'warning',start:-1,message:'O título de uma seção ligada manualmente foi preservado.'});
 return out;
}
function v2217AnchorRetainedEdits(source,edits,cfg={},originalExecutor=v24SyntaxApply){
 if(!Array.isArray(edits)||!edits.length||!v2217CombinedProtectionRequired(source,cfg))return edits;
 originalExecutor(source,edits.slice());
 if(edits.some(e=>!Number.isInteger(e.start)||!Number.isInteger(e.end)||typeof e.text!=='string'))return edits;
 const snapshot=v2217AnchorProducerSnapshot(source,cfg),one=edits.filter(e=>{if(!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end<e.start||e.end>source.length||typeof e.text!=='string')return false;
  const after=source.slice(0,e.start)+e.text+source.slice(e.end);return snapshot===v2217AnchorProducerSnapshot(after,cfg);});
 const out=v24SyntaxApply(source,one);return snapshot===v2217AnchorProducerSnapshot(out,cfg)?one:[];
}
function v219ReferenceIdentityQuarantine(source,cfg={},collectAll=false){
 const original=v2217Previous_v219ReferenceIdentityQuarantine(source,cfg,collectAll);
 if(!v2217AnchorProtectionRequired(source,cfg))return original;
 const all=v2217Previous_v219ReferenceIdentityQuarantine(source,cfg,true),anchors=v2217AuthoredCiteFragments(source,cfg);return{...all,opaque:true,ranges:[...all.ranges,...anchors.map(x=>({...x,kind:'authored-cite-fragment'}))].sort((a,b)=>a.start-b.start||a.end-b.end)};
}

function v219StageSafeEdits(source,edits,name,cfg={}){return v2217Previous_v219StageSafeEdits(source,v2217AnchorRetainedEdits(source,edits,cfg),name,cfg);}
function v219BankSourcePlan(source,cfg={}){const plan=v2217Previous_v219BankSourcePlan(source,cfg);return plan&&v2217AnchorRawAudit(source,plan.text,cfg).length?{source,sourceHash:v24SyntaxHash(source),text:source,edits:[]}:plan;}
function automaticMissingNoteCollector(source,cfg,bump=()=>{}){if(!v2217CombinedProtectionRequired(source,cfg))return v2217Previous_automaticMissingNoteCollector(source,cfg,bump);const calls=[],text=v2217Previous_automaticMissingNoteCollector(source,cfg,id=>calls.push(id));if(v2217AnchorRawAudit(source,text,cfg).length)return source;for(const id of calls)bump(id);return text;}

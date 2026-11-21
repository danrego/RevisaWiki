async function v2221PrepareTalkEvidence(task,options={}) {
 const cfg={...options};if(cfg.namespaceNumber!==1||cfg.auxiliaryTemplates===false||cfg.sectionOnly||cfg.contentModel&&cfg.contentModel!=='wikitext'||!root.mw?.Api&&!root.fetch)return cfg;
 const title=String(root.mw?.config?.get('wgTitle')||cfg.pageTitle?.replace(/^[^:]+:/,'')||'');if(!title)return cfg;
 const request=async params=>{
  task.guard();let nativeRequest=null;const controller=typeof root.AbortController==='function'?new root.AbortController():null,pending={abort:()=>{controller?.abort();nativeRequest?.abort?.();}};
  task.preflightRequests||=[];task.preflightRequests.push(pending);const timer=root.setTimeout(()=>pending.abort(),5000);
  try{if(root.mw?.Api){nativeRequest=new root.mw.Api({ajax:{timeout:5000}}).get({...params,format:'json',formatversion:2});const value=await nativeRequest;task.guard();return value;}const query=new URLSearchParams({...params,format:'json',formatversion:'2'}),response=await root.fetch('/w/api.php?'+query,{method:'GET',credentials:'omit',signal:controller?.signal});task.guard();if(!response.ok)throw new Error('Public read unavailable');const value=await response.json();task.guard();return value;}
  finally{root.clearTimeout(timer);task.preflightRequests=task.preflightRequests.filter(p=>p!==pending);}
 };
 try{
  const result=await request({action:'query',titles:title,prop:'revisions',rvprop:'ids|content',rvslots:'main',rvlimit:1}),page=result.query?.pages?.[0];
  if(!page||page.ns!==0||page.missing||page.invalid||typeof page.title!=='string'||page.title.replace(/_/g,' ').trim()!==title.replace(/_/g,' ').trim())return cfg;
  const article=page.revisions?.[0]?.slots?.main?.content;if(typeof article!=='string'||article.length>4194304)return cfg;
  const proofs=await v261QueryTalkProjectProofs(task.source,article,request);task.guard();cfg.v2221TalkArticleSource=article;cfg.talkProjectProofs=proofs;
 }catch(_){task.guard();}
 return cfg;
}
function v2221TalkLeadingPortals(source) {
 const limit=Math.min(source.length,65536),view=v222Protected(source).view,byStart=new Map(v24SyntaxTemplates(view.slice(0,limit)).nodes.filter(n=>n.size===2&&n.depth===0).map(n=>[n.start,n]));
 const entries=[];let cursor=0;
 while(cursor<limit){
  const space=/^[ \t\r\n]+/.exec(source.slice(cursor));if(space){cursor+=space[0].length;continue;}
  if(source.startsWith('<!--',cursor)){const end=source.indexOf('-->',cursor+4);if(end<0)break;cursor=end+3;continue;}
  const item=byStart.get(cursor);
  if(item){
   const raw=source.slice(item.start,item.end);if(!/^[ \t]*(?:\r?\n|$)/.test(source.slice(item.end)))break;
   const parsed=parsedTemplate(raw);if(parsed&&['portal','portal2','portal3'].includes(parsed.name))entries.push({...item,raw});
   cursor=item.end;continue;
  }
  const end=source.indexOf('\n',cursor),stop=end<0?source.length:end,line=source.slice(cursor,stop);
  if(!/^Portal\s+(?:do|da|dos|das|de)\s+[^\r\n]+$/iu.test(line)||view.slice(cursor,stop)!==line)break;
  entries.push({start:cursor,end:stop,raw:line});cursor=end<0?source.length:end+1;
 }
 return entries;
}
function v2221TalkMarkerTopics(raw) {
 const slots=v2216LayoutSlots(raw);if(!slots)return null;
 const topics=[];for(const[key,value]of slots)if(/^[1-9]\d*$/.test(key)&&Number(key)%2===0){const text=value.trim();if(!text||/[{}<>\[\]]/.test(text))return null;topics.push(text);}
 return topics;
}
function v2221TalkAdditionsPlan(source,cfg={}) {
 const edits=[];if(typeof source!=='string'||cfg.namespaceNumber!==1||cfg.auxiliaryTemplates===false||cfg.sectionOnly||cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.pageRedirect)return v222EditsPlan(source,edits);
 const article=typeof cfg.v2221TalkArticleSource==='string'?cfg.v2221TalkArticleSource:'';
 // The native generator sees only isolated portal tokens from the leading
 // metadata, never conversation text. Its complete conversion is required
 // before removing those source tokens.
 const portals=v2221TalkLeadingPortals(source),portalSource=portals.map(n=>n.raw).join('\n');
 let prepared;try{prepared=v2217TalkPreparationPlan(portalSource,article,cfg);}catch(_){return v222EditsPlan(source,edits);}
 if(!prepared||typeof prepared.text!=='string')return v222EditsPlan(source,edits);
 const convertsPortals=portals.length>0&&prepared.removedPortals===portals.length;
 if(portals.length&&!convertsPortals){try{prepared=v2217TalkPreparationPlan('',article,cfg);}catch(_){return v222EditsPlan(source,edits);}}
 const known=v2216TalkNodes(source,()=>true),existingPD=known.some(n=>{const parsed=parsedTemplate(source.slice(n.start,n.end));return parsed&&v2215PdName(parsed.parts[0]);}),markers=known.filter(n=>v2216LayoutIdentity(source.slice(n.start,n.end))==='marca de projeto');
 const generated=v2216TalkNodes(prepared.text,raw=>v2216LayoutIdentity(raw)==='marca de projeto');
 let marker=null,markerCount=0;
 if(generated.length===1){
  const incoming=prepared.text.slice(generated[0].start,generated[0].end),old=markers.map(n=>source.slice(n.start,n.end)),probe=old.concat(incoming).join('\n'),merged=v2221LayoutTalkPlan(probe,cfg);
  if(v2221LayoutTalkProof(probe,merged.text,merged,cfg)){
   const matches=v2216TalkNodes(merged.text,raw=>v2216LayoutIdentity(raw)==='marca de projeto');
   if(matches.length===1){
    marker=merged.text.slice(matches[0].start,matches[0].end);const topics=v2221TalkMarkerTopics(marker),previous=old.flatMap(raw=>v2221TalkMarkerTopics(raw)||[]),identity=s=>s.normalize('NFC').toLocaleLowerCase('pt');
    if(topics)markerCount=topics.filter(topic=>!previous.some(p=>identity(p)===identity(topic))).length;
    else marker=null;
   }
  }
 }
 const canConvert=marker!==null&&convertsPortals;
 const additions=[];if(!existingPD)additions.push('{{PD}}');
 if(marker!==null){
  if(markers.length){
   if(markers[0].raw!==marker)edits.push({start:markers[0].start,end:markers[0].end,text:marker,count:Math.max(1,markerCount),kind:'talk-proved-project-union'});
   for(const node of markers.slice(1))edits.push({start:node.start,end:node.end,text:'',count:1,kind:'talk-equivalent-project-copy'});
  }else additions.push(marker);
  if(canConvert)for(const node of portals)edits.push({start:node.start,end:node.end,text:'',count:1,kind:'talk-converted-portal-token'});
 }
 if(additions.length)edits.push({start:0,end:0,text:additions.join('\n')+'\n',count:(existingPD?0:1)+(marker!==null&&!markers.length?Math.max(1,markerCount):0),kind:'talk-proved-header-additions',proof:{articleHash:article?v24SyntaxHash(article):null,projectsProofs:cfg.talkProjectProofs||[],conversationUnchanged:true}});
 return v222EditsPlan(source,edits);
}
function v2221TalkAdditionsProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v2221TalkAdditionsPlan);}

// A review date is not evidence of a bot. Inspect an unchanged saved field and
// its introducing revision, then confirm that revision's account has bot status.
function v2216AssessmentRows(source){
 return v2216TalkNodes(source,raw=>v2216LayoutIdentity(raw)==='marca de projeto').map(node=>({...node,slots:v2216LayoutSlots(node.raw)})).filter(r=>r.slots);
}
function v2216AssessmentOrigins(source,revisions){
 const current=v2216AssessmentRows(source);if(current.length!==1||!Array.isArray(revisions)||revisions.length<2)return [];
 const node=current[0],read=revision=>{
  const content=revision?.slots?.main?.content;if(typeof content!=='string')return null;
  const rows=v2216AssessmentRows(content);return rows.length===1?rows[0]:null;
 },latest=read(revisions[0]);
 if(!latest||latest.raw!==node.raw)return [];
 const origins=[];
 for(const [field,key]of [['quality',node.slots.has('1')?'1':'qualidade'],['reviewDate','rev']]){
  const value=node.slots.get(key)?.trim();if(!value||field==='quality'&&!/^[1-9]$/.test(value)||field==='reviewDate'&&!/^\d{8,14}$/.test(value))continue;
  for(let i=0;i<revisions.length-1;i++){
   const newer=read(revisions[i]),older=read(revisions[i+1]);
   if(!newer||!older||newer.slots.get(key)?.trim()!==value)break;
   if(older.slots.get(key)?.trim()===value)continue;
   const revision=revisions[i];if(typeof revision.user!=='string'||revision.userhidden||!Number.isSafeInteger(revision.revid))break;
   origins.push({field,key,value,account:revision.user,revisionId:revision.revid});break;
  }
 }
 return origins;
}
function v2216AssessmentBotEvidence(origin,record,currentBots){
 return !!origin&&!!record&&currentBots instanceof Set&&currentBots.has(origin.account)&&record.revid===origin.revisionId&&record.user===origin.account&&record.bot===true;
}
async function v2216PrepareAssessmentProvenance(task,options){
 const cfg={...options};delete cfg.v2216ConfirmedBotAssessments;
 if(!v2216TalkScope(task.source,cfg))return cfg;
 const rows=v2216AssessmentRows(task.source);
 if(rows.length!==1||!['1','qualidade','rev'].some(k=>/^[1-9]\d*$/.test(rows[0].slots.get(k)?.trim()||'')))return cfg;
 const pending=[];task.preflightRequests=pending;
 try{
  const client=new mw.Api({ajax:{timeout:6000}}),request=client.get({action:'query',formatversion:2,titles:task.title,prop:'revisions',rvprop:'ids|user|content',rvslots:'main',rvlimit:50});pending.push(request);
  const response=await request;task.guard();const pages=response.query?.pages||[];
  if(pages.length!==1||pages[0].missing||!Array.isArray(pages[0].revisions))return cfg;
  const revisions=pages[0].revisions;if(task.base&&String(revisions[0]?.revid)!==String(task.base))return cfg;
  const origins=v2216AssessmentOrigins(task.source,revisions);if(!origins.length)return cfg;
  const users=[...new Set(origins.map(r=>r.account))],query=client.get({action:'query',formatversion:2,list:'users',ususers:users.join('|'),usprop:'groups'});pending.push(query);
  const userResponse=await query;task.guard();
  const bots=new Set((userResponse.query?.users||[]).filter(r=>Array.isArray(r.groups)&&r.groups.includes('bot')).map(r=>r.name));
  if(!origins.some(r=>bots.has(r.account)))return cfg;
  // Current group membership alone does not prove how an older edit ran.
  const changesRequest=client.get({action:'query',formatversion:2,list:'recentchanges',rctitle:task.title,rcshow:'bot',rcprop:'ids|flags|user',rclimit:500});pending.push(changesRequest);
  const changesResponse=await changesRequest;task.guard();const changes=changesResponse.query?.recentchanges||[],node=rows[0],proof={sourceHash:v24SyntaxHash(task.source),templateHash:v24SyntaxHash(node.raw),templateStart:node.start};
  for(const origin of origins)if(changes.some(record=>v2216AssessmentBotEvidence(origin,record,bots)))proof[origin.field]={key:origin.key,value:origin.value,confirmedBot:true,revisionId:origin.revisionId};
  if(proof.quality||proof.reviewDate)cfg.v2216ConfirmedBotAssessments=[proof];
 }catch(error){task.guard();}finally{task.preflightRequests=[];}
 return cfg;
}

'use strict';
// Validate explicit reviewed dispositions. Historical receipts remain failed or incomplete.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),
 kinds=new Set(['fixed-current','resolved-current-rule-migration','intentional-conservative-preservation','superseded-incomplete-test-round','known-timeout-limitation']);
function failureRows(data,format){
 if(format==='leaf-failures')return(data.failures||[]).map(row=>({bundle:row.bundle||null,id:row.id,message:row.message||row.error||'',status:'failed'}));
 const key=format==='suite-summary'?'suites':format==='directed-summary'?'tasks':null;
 assert(key,'Known historical report format');assert(Array.isArray(data[key]),'Historical rows exist');
 const rows=data[key].filter(row=>row.status!=='passed').map(row=>({bundle:null,id:row.suite||row.id||row.task,
  message:row.reason||row.error||'',status:row.status}));
 if(data.complete===false)rows.push({bundle:null,id:'__round-incomplete__',message:'Historical round did not finish',status:'incomplete'});
 return rows;
}
const failureKey=(row,index)=>index+':'+sha(JSON.stringify(row));
function readReviewedDispositions(filename,{runtimePins=[]}={}){
 const file=path.resolve(filename),base=path.dirname(file),bytes=fs.readFileSync(file),plan=JSON.parse(bytes);
 assert.equal(plan.schemaVersion,1);assert.equal(plan.kind,'reviewed-legacy-dispositions');
 assert(Array.isArray(plan.historicalReports)&&plan.historicalReports.length&&Array.isArray(plan.resolutions)&&plan.resolutions.length&&Array.isArray(plan.dispositions)&&plan.dispositions.length);
 const ids=new Set(),historical=new Map(),resolutions=new Map(),runtimeHashes=new Set(runtimePins.filter(pin=>!/_dados\.js$/.test(pin.file||'')).map(pin=>pin.sha256));
 const load=row=>{
  assert(/^[a-z0-9._:-]{1,100}$/i.test(row.id)&&!ids.has(row.id),'Unique neutral record ID');ids.add(row.id);
  const location=path.resolve(base,row.file),raw=fs.readFileSync(location);assert.equal(sha(raw),row.sha256,'Exact evidence bytes for '+row.id);
  return{location,raw,data:JSON.parse(raw),declaration:row};
 };
 for(const row of plan.historicalReports){
  const entry=load(row),failures=failureRows(entry.data,row.format);
  assert(failures.length>0,'A historical disposition source has nonpassing records');
  assert.equal(failures.length,row.failureCount,'Historical cardinality is explicit');
  entry.failures=failures.map((value,index)=>({...value,key:failureKey(value,index)}));historical.set(row.id,entry);
 }
 for(const row of plan.resolutions){
  const entry=load(row),data=entry.data;
  assert(data.complete!==false,'A partial round is not resolution evidence');
  if(data.status!==undefined)assert.equal(data.status,'passed','Resolution evidence must pass');
  else assert(Array.isArray(data.failures)&&!data.failures.length&&Number(data.checks)>0,'Explicit successful resolution evidence');
  assert(!data.failures?.length,'Resolution has no unresolved failures');
  assert(Array.isArray(row.runtimeSha256)&&row.runtimeSha256.length,'Exact current runtime binding is required');
  const strings=new Set();const walk=value=>{if(typeof value==='string')strings.add(value);else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};walk(data);
  for(const hash of row.runtimeSha256){assert(runtimeHashes.has(hash),'Resolution matches a currently tested runtime');assert(strings.has(hash),'Resolution receipt contains the executed runtime hash');}
  resolutions.set(row.id,entry);
 }
 const covered=new Set(),rows=[];
 for(const row of plan.dispositions){
  assert(kinds.has(row.classification),'Known explicit disposition');assert(typeof row.reason==='string'&&row.reason.trim(),'Human review reason is required');
  const source=historical.get(row.historicalReport),resolution=resolutions.get(row.resolution);
  assert(source&&resolution,'Both historical and resolution records exist');
  const failure=source.failures.find(value=>value.key===row.failureKey);assert(failure,'Exact original failure key');
  const key=row.historicalReport+'|'+row.failureKey;assert(!covered.has(key),'Each original failure has one disposition');covered.add(key);
  rows.push({historicalReport:row.historicalReport,failureKey:row.failureKey,historicalStatus:failure.status,
   classification:row.classification,resolution:row.resolution});
 }
 const needed=[...historical].flatMap(([id,entry])=>entry.failures.map(row=>id+'|'+row.key));
 assert(needed.every(key=>covered.has(key)),'Every historical failure, timeout or incomplete round has an explicit disposition');
 for(const entry of [...historical.values(),...resolutions.values()])assert.equal(sha(fs.readFileSync(entry.location)),sha(entry.raw),'Evidence remains unchanged');
 return{kind:'explicit-reviewed-legacy-disposition-validation',status:'passed',planSha256:sha(bytes),historicalReports:historical.size,
  historicalNonpassingCount:needed.length,dispositions:rows,historicalStatusesUnchanged:true,
  currentAutomaticFixCredit:0,limitation:'Validates exact stored receipts and complete reviewed coverage; it does not independently prove semantic correctness or rerun historical tests.'};
}
module.exports={readReviewedDispositions,failureRows,failureKey};

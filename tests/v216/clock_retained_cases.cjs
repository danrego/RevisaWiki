'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),
 files=process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:['','_completo'].map(suffix=>path.join(root,'dist/2.16.0/RevisaWiki_v2_16_0'+suffix+'.js'));
const report={version:'2.16.0',kind:'utc-expiry-and-retained-operation-subsets',status:'passed',cases:0,checks:0,failures:[],bundles:[],networkRequests:0,wikipediaWrites:0};
function eq(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function check(bundle,id,fn){report.cases++;try{fn();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}}
for(const file of files){
 const bytes=fs.readFileSync(file),sha256=hash(bytes),bundle=path.basename(file),api=require(path.resolve(file));
 report.bundles.push({file:bundle,sha256,bytes:bytes.length});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',autoPreview:false,authorityControl:false,portals:false,automaticTopicPortals:false},
  box=fields=>'{{Info/Biografia|'+fields+'}}\n\n\'\'\'Pessoa de teste\'\'\' é uma pessoa.',
  run=source=>api.calculate({kind:'adjust',source,options:cfg});
 const changes=[['nome=[[Pessoa de teste]]','nome=Pessoa de teste'],
  ['nascimento_data=1980-02-01','nascimento_data={{DataExt|1|2|1980}}'],
  ['nacionalidade=Nacionalidade: brasileira','nacionalidade=brasileira']],before=box(changes.map(pair=>pair[0]).join('|'));
 for(let subset=0;subset<8;subset++)check(bundle,'retained independent subset '+subset,()=>{
  let after=before,count=0;
  for(let bit=0;bit<changes.length;bit++)if(subset&(1<<bit)){after=after.replace(...changes[bit]);count++;}
  const result=api.v211RetainedAdjustments(before,after,[],cfg);
  eq(result.exact,true,'The subset count has an exact retained endpoint');
  eq(result.count,count,'A reverted operation does not remain in the count');
  eq(result.events.length,count,'The displayed count and operation list agree');
 });
 const layered=box('nascimento_data=Nascimento: 1980-02-01');
 for(const [id,after,count]of [['label only',layered.replace('Nascimento: ',''),1],
  ['date only',layered.replace('1980-02-01','{{DataExt|1|2|1980}}'),1],
  ['both retained',layered.replace('Nascimento: 1980-02-01','{{DataExt|1|2|1980}}'),2]])
  check(bundle,'retained layered subset '+id,()=>{
   const result=api.v211RetainedAdjustments(layered,after,[],cfg);
   eq(result.exact,true,'An independently retained field component is countable');
   eq(result.count,count,'An intermediate spelling that was reverted gets no credit');
  });
 const clocks=[
  ['year boundary','2030-12-31T23:59:59Z','2031-01-01T00:00:01Z',[1,1,2000],30,31],
  ['ordinary birthday','2030-01-31T23:59:59Z','2030-02-01T00:00:01Z',[1,2,2000],29,30],
  ['leap-day birthday','2031-02-28T23:59:59Z','2031-03-01T00:00:01Z',[29,2,2000],30,31],
  ['unchanged age after midnight','2030-01-31T23:59:59Z','2030-02-01T00:00:01Z',[1,6,2000],29,29]
 ];
 for(const [id,first,second,born,oldAge,newAge]of clocks)check(bundle,'UTC native-age proof '+id,()=>{
  const RealDate=global.Date;let instant=RealDate.parse(first);
  class FixtureDate extends RealDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return instant;}}
  global.Date=FixtureDate;
  try{
   const source=box('nome=Pessoa de teste|nascimento_data={{Dni|'+born.join('|')+'}} ('+oldAge+' anos)'),
    plan=api.v216FieldValuePlan(source,cfg),oldKey=api.v211FreshnessKey(cfg),oldResult=run(source);
   eq(plan.text!==source,true,'The exact native age initially matches');
   eq(oldResult.text,plan.text,'The actual pipeline applies the same source-bound age removal');
   eq(api.v25SafeRepairPlan(source,cfg).text,plan.text,'The safe plan initially agrees');
   instant=RealDate.parse(second);
   eq(api.v216FieldValueProof(source,plan.text,plan,cfg),false,'The previous UTC-day witness expires');
   eq(oldKey===api.v211FreshnessKey(cfg),false,'The reviewed-editor freshness key changes after UTC midnight');
   const staleOutput=oldAge===newAge?plan.text:source;
   eq(api.v216FieldValuePlan(source,cfg).text,staleOutput,'The field helper checks the new native age');
   eq(api.v25SafeRepairPlan(source,cfg).text,staleOutput,'The safe cache cannot reuse a stale age decision');
   eq(run(source).text,staleOutput,'The complete calculation honors the new day');
   const correct=source.replace('('+oldAge+' anos)','('+newAge+' anos)');
   eq(run(correct).text.includes('('+newAge+' anos)'),false,'The new correct duplicate age is removed');
   if(oldAge!==newAge){
    const count=api.v211RetainedAdjustments(source,oldResult.text,[],cfg);
    eq((count.events||[]).some(event=>event.rule==='v216InfoboxDuplicateAge'),false,'The count cache cannot reuse an expired automatic-age witness');
   }
  }finally{global.Date=RealDate;}
 });
 check(bundle,'a date ceasing to be future is not trapped in yesterday safe cache',()=>{
  const RealDate=global.Date;let instant=RealDate.parse('2030-12-31T23:59:59Z');
  class FixtureDate extends RealDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return instant;}}
  global.Date=FixtureDate;
  try{
   const source=box('nome=Pessoa de teste|nascimento_data=2031-01-01');
   eq(run(source).text,source,'A future date initially stays literal');
   instant=RealDate.parse('2031-01-01T00:00:01Z');
   const expected=source.replace('2031-01-01','{{DataExt|1|1|2031}}');
   eq(api.v216FieldValuePlan(source,cfg).text,expected,'The explicit date is now eligible for presentation');
   eq(api.v25SafeRepairPlan(source,cfg).text,expected,'The safe plan uses the new UTC day');
   eq(run(source).text,expected,'The complete calculation does not reuse the old no-change result');
  }finally{global.Date=RealDate;}
 });
 eq(hash(fs.readFileSync(file)),sha256,'The executed bundle remained immutable');
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;

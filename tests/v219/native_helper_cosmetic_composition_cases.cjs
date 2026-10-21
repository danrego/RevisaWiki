'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={kind:'source-bound-helper-cosmetics-default-composition',status:'running',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],checks:0,failures:[]};
const args=process.argv.slice(2),runtimeFiles=args.length?args.flatMap(file=>fs.statSync(path.resolve(file)).isDirectory()?['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(path.resolve(file),name)):[path.resolve(file)]):['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name));
const receipt=require('./reference_receipt_metadata.cjs').begin(report,runtimeFiles,[path.join(__dirname,'native_helper_cosmetic_contract.json')],__filename);
for(const runtimeFile of runtimeFiles){const file=path.basename(runtimeFile);
 const api=require(runtimeFile),off=Object.fromEntries(Object.entries(api.defaults).map(([k,v])=>[k,typeof v==='boolean'?false:v])),cfg={...off,namespaceNumber:0,contentModel:'wikitext',auxiliaryTemplates:true,automaticParameterDuplicates:true,automaticEmptyParameters:true},defaults={...api.defaults,namespaceNumber:0,contentModel:'wikitext'};
 const check=(value,message)=>{report.checks++;if(!value)throw Error(message)},run=(id,source,options,expected,fn)=>{const row={bundle:file,id,sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(options)),expectedObjects:expected};receipt.whole(row,source,options,expected.exactEndpoint,id);try{const a=api.calculate({kind:'adjust',source,options}),b=api.calculate({kind:'adjust',source:a.text,options});row.actualEndpointSha256=sha(a.text);row.appliedIds=(a.changes||[]).map(v=>v.id);row.actualText=a.text;check(a.text===b.text,'one-click idempotence');check(!a.preservation?.length,'pipeline guard');check(api.preservationAudit(source,a.text,options).length===0,'preservation');check(api.safeComposition(source,a.text,options)==='','composition');fn(a,row);row.status='passed';}catch(e){row.status='failed';row.error=e.message;report.failures.push({bundle:file,id,error:e.message});}report.cases.push(row);};
 for(const [name,sourceHelper,fixedHelper,group]of [
  ['efn','{{Efn|Fonte nota literal.|group=nota|group=nota}}','{{Efn|Fonte nota literal.|group=nota}}','nota'],
  ['refn','{{Refn|Fonte nota literal.|group=nota|group=nota}}','{{Refn|Fonte nota literal.|group=nota}}','nota']]){
  const source='Texto.<ref>Fonte comum literal.</ref> '+sourceHelper+'\n\n{{Referências}}';
  const options={...defaults,noteRendererProofSource:source,noteRendererProofs:[{missing:true,group}]};
  const complete='Texto.<ref>Fonte comum literal.</ref> '+fixedHelper+'\n\n{{Notas e referências}}';
  run('default-missing-matching-renderer-'+name,source,options,{helper:fixedHelper,existingBody:'Fonte comum literal.',requiredGroups:['',group],exactEndpoint:complete},a=>{check(a.text===complete,'independent complete renderer endpoint');check(a.text.includes(fixedHelper),'cosmetic helper applied');const collectors=api.v219NativeCollectorGroups('{{Notas e referências}}');const actual=api.v219NativeReferenceObserver(a.text);let groups=[];for(const raw of a.text.match(/\{\{(?:Notas e referências|Referências|Notas)[^{}]*}}/g)||[])groups.push(...api.v219NativeCollectorGroups(raw).groups);check(groups.includes('')&&groups.includes(group),'matching source-proven renderer added');check(a.text.includes('<ref>Fonte comum literal.</ref>'),'ordinary body retained');check((a.changes||[]).some(x=>x.id==='missingNoteCollector'),'existing missing-note producer reachable');});
  for(const [tag,extra,expected]of [
   ['stale-render-proof',{noteRendererProofSource:source+' '},source.replace(sourceHelper,fixedHelper)],
   ['references-off',{references:false},source.replace(sourceHelper,fixedHelper)],
   ['parameter-duplicates-off',{automaticParameterDuplicates:false},source]
  ])run('missing-renderer-'+name+'-'+tag,source,{...options,...extra},{exactEndpoint:expected},a=>{check(a.text===expected,'source proof and feature authority retained');});
  run('missing-renderer-'+name+'-guard-mutants',source,options,{exactEndpoint:complete},a=>{
   for(const target of [complete.replace('group=nota','group=outro'),complete.replace('{{Notas e referências}}','{{Referências}}'),complete.replace('Fonte comum literal.','Outra fonte literal.'),complete+'\n<ref name="nova">Fonte extra.</ref>']){
    check(api.preservationAudit(source,target,options).length>0,'composition companion mutation preservation rejected');
    check(api.safeComposition(source,target,options)!=='','composition companion mutation guard rejected');
   }
  });

 }
 const helper='{{Refn|Fonte nota literal.|group=|group=}}',fixed='{{Refn|Fonte nota literal.|group=}}';
 for(const [id,source,expected]of [
  ['dedup-identical-named', '<ref name="a">Fonte A.</ref> <ref name="b">Fonte A.</ref> '+helper+'\n{{Referências}}','<ref name="a">Fonte A.</ref>  '+fixed+'\n{{Referências}}'],
  ['move-first-definition','Texto<ref name="a" />.\nMais<ref name="a">Fonte A.</ref>. '+helper+'\n{{Referências}}','Texto<ref name="a">Fonte A.</ref>.\nMais<ref name="a" />. '+fixed+'\n{{Referências}}']]){
  const options={...cfg,references:true,automaticReferenceRepairs:true,referenceGraphRepairs:true,syntaxRepairs:true,structuralRepairs:true,automaticIdenticalReferences:true,moveNamedRefs:true};
  run(id,source,options,{exactEndpoint:expected},a=>{check(a.text===expected,'independent exact ref endpoint');check((a.changes||[]).some(x=>['identicalRefs','moveNamedRefs','namedRefs','v27NamedReferences'].includes(x.id)),'existing ref producer reachable');});
 }
 const source='{{Info/Filme|país=Brasil}}\n\nTexto.<ref>Fonte comum literal.</ref> '+helper+'\n\n{{Referências}}\n';
 const expected=source.replace(helper,fixed)+'\n{{Portal3|Cinema|Entretenimento|Brasil}}\n',options={...cfg,references:true,endMatter:true,portals:true,automaticTopicPortals:true};
 run('independent-portal-addition',source,options,{exactEndpoint:expected},a=>{check(a.text===expected,'literal source-known portal endpoint');check(a.text.includes('<ref>Fonte comum literal.</ref>'),'other reference body retained');});
}
report.status=report.failures.length?'failed':'passed';receipt.finish();console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;

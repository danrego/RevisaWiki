'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const report={kind:'source-bound-biography-original-fact-retention',status:'passed',networkRequests:0,wikipediaWrites:0,runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(path.join(__dirname,'biography_source_fact_contract.json'))),bundles:[],cases:[],checks:0,failures:[]};
global.fetch=()=>{report.networkRequests++;throw Error('Network disabled');};global.XMLHttpRequest=class{constructor(){report.networkRequests++;throw Error('Network disabled');}};
const B='{{DataExt|1|1|1900}}',D='{{DataExt|2|1|1980}}',N="'''Pessoa fictícia'''",RB='<ref name="nascimento">Fonte literal do nascimento.</ref>',RP='<ref name="lugar">Fonte literal do lugar.</ref>',RD='<ref name="morte">Fonte literal da morte.</ref>',RL='<ref name="lugar-morte">Fonte literal do lugar final.</ref>';
const F='|nascimento_data='+B+RB+'|local_nascimento=[[Cidade Alfa]]'+RP+'|morte_data='+D+RD+'|local_morte=[[Cidade Beta]]'+RL;
const box=f=>'{{Info/Biografia|nome=Pessoa fictícia'+f+'}}',page=(f,lead=N+' foi uma pesquisadora.',extra='')=>box(f)+'\n'+lead+extra+'\n\n{{Referências}}';
const T='([[Cidade Alfa]]<ref name="lugar" />, '+B+'<ref name="nascimento" /> – [[Cidade Beta]]<ref name="lugar-morte" />, '+D+'<ref name="morte" />)';
const S=page(F),E=page(F,N+' '+T+' foi uma pesquisadora.'),rows=[];
const guard=(id,after,source=S,expected=E,extra={})=>rows.push({id,kind:'guard-mutation',source,after,expected,reject:true,extra});
for(const [id,from,to]of [
 ['box-birth-day',B,'{{DataExt|2|1|1900}}'],['box-birth-year',B,'{{DataExt|1|1|1901}}'],['box-date-display',B,'{{Dni|1|1|1900|si}}'],
 ['box-birth-place','[[Cidade Alfa]]','[[Cidade Gama]]'],['box-place-label','[[Cidade Alfa]]','[[Cidade Alfa|Outro nome]]'],
 ['box-death-date',D,'{{DataExt|3|1|1980}}'],['box-death-place','[[Cidade Beta]]','[[Cidade Delta]]'],
 ['box-header','|nome=Pessoa fictícia','|nome=Outra pessoa'],['box-source-title','Info/Biografia','Info/Modelo desconhecido'],
 ['box-source-ref-body',RB,RB.replace('Fonte literal do nascimento.','Outra publicação.')],['box-source-ref-name',RB,RB.replace('nascimento','outronome')],
 ['box-source-ref-group',RB,RB.replace('name="nascimento"','name="nascimento" group="n"')],['box-source-ref-missing',RB,''],
 ['box-source-alias-competing','|nascimento_data=','|data_nascimento={{DataExt|2|1|1900}}'+RB+'|nascimento_data='],
 ['box-source-alias-blank','|nascimento_data=','|data_nascimento=|nascimento_data='],['box-source-date-duplicate','|nascimento_data=','|nascimento_data='+B+RB+'|nascimento_data='],
 ['box-source-place-alias','|local_nascimento=','|nascimento_local=[[Cidade Gama]]'+RP+'|local_nascimento=']
])guard(id,E.replace(from,to));
guard('box-missing',E.slice(E.indexOf('\n')+1));
guard('box-duplicated',box(F)+'\n'+E);
guard('box-protected-owner',E.replace(box(F),'{{Modelo fictício|exemplo='+box(F)+'}}'));
guard('box-nowiki-owner',E.replace(box(F),'<nowiki>'+box(F)+'</nowiki>'));
guard('box-unproved-internal-case',E.replace('Info/Biografia','Info/BIOGRAFIA'));
guard('box-unproved-header-control',E.replace('Info/Biografia','\u000bInfo/Biografia'));
guard('copied-lead-date',E.replace(N+' '+T,N+' '+T.replace(B,'{{DataExt|2|1|1900}}')));
guard('copied-lead-place',E.replace(N+' '+T,N+' '+T.replace('[[Cidade Alfa]]','[[Cidade Gama]]')));
guard('copied-lead-ref-name',E.replace(N+' '+T,N+' '+T.replace('name="lugar"','name="outronome"')));
guard('copied-lead-ref-missing',E.replace(N+' '+T,N+' '+T.replace('<ref name="lugar" />','')));
guard('copied-lead-ref-order',E.replace(N+' '+T,N+' '+T.replace('<ref name="lugar" />','<ref name="nascimento" />').replace('<ref name="nascimento" />) foi','<ref name="lugar" />) foi')));
const source2=S.replace('|nascimento_data='+B,'|nascimento_data={{DataExt|2|1|1900}}'),expected2=E.replaceAll(B,'{{DataExt|2|1|1900}}');
guard('changed-source-stale-copy',E,source2,expected2);
rows.push({id:'fresh-changed-source-copy',kind:'actual',source:source2,expected:expected2});
rows.push({id:'four-fact-source-copy',kind:'actual',source:S,expected:E});
rows.push({id:'unchanged-source-no-copy',kind:'unchanged',source:S,expected:S});
rows.push({id:'feature-off-no-copy',kind:'actual',source:S,expected:S,extra:{automaticBiographyLead:false}});
rows.push({id:'reference-option-off-keeps-bio-authority',kind:'actual',source:S,expected:E,extra:{references:false}});
rows.push({id:'reference-normalization-enabled',kind:'actual',source:S,expected:E,extra:{references:true,automaticReferenceRepairs:true}});
const linkS=S.replaceAll('[[Cidade Alfa]]','[[Cidade Alfa|Cidade Alfa]]'),linkE=E;
rows.push({id:'proved-place-link-presentation',kind:'actual',source:linkS,expected:linkE,extra:{links:true}});
rows.push({id:'independent-link-with-source-facts',kind:'actual',source:S+'\n[[Página Alfa|Página Alfa]]',expected:E+'\n[[Página Alfa]]',extra:{links:true}});
const cite='<ref name="nascimento">{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|data=1 de janeiro de 2000}}</ref>',citeS=S.replace(RB,cite),citeE=E.replace(RB,cite);
for(const [id,from,to]of [['cited-title','título=Fonte literal','título=Outra fonte'],['cited-url','https://example.invalid/fonte','https://example.invalid/outra'],['cited-date','data=1 de janeiro de 2000','data=2 de janeiro de 2000']])guard(id,citeE.replace(from,to),citeS,citeE);
rows.push({id:'typed-publication-reference-retained',kind:'actual',source:citeS,expected:citeE});
const actorS=S.replace('Info/Biografia','Info/Ator').replace('local_nascimento=','nascimento_local=').replace('local_morte=','morte_local='),actorE=E.replace('Info/Biografia','Info/Ator').replace('local_nascimento=','nascimento_local=').replace('local_morte=','morte_local=');
rows.push({id:'separate-native-actor-contract-copy',kind:'actual',source:actorS,expected:actorE});
guard('separate-native-actor-source-date',actorE.replace('|nascimento_data='+B,'|nascimento_data={{DataExt|2|1|1900}}'),actorS,actorE);
const extraRef='<ref name="extra">Fonte adicional literal.</ref>',multiS=S.replace(RB,RB+extraRef),multiE=E.replace(RB,RB+extraRef).replace('<ref name="nascimento" /> –', '<ref name="nascimento" /><ref name="extra" /> –');
rows.push({id:'ordered-source-reference-run',kind:'actual',source:multiS,expected:multiE});
guard('box-reference-run-order',multiE.replace(RB+extraRef,extraRef+RB),multiS,multiE);
for(const file of process.argv.slice(2)){
 const api=require(path.resolve(file)),bundle=path.basename(file),before=fs.readFileSync(file),dataFile=path.join(path.dirname(path.resolve(file)),'RevisaWiki_v2_19_0_dados.js'),dataBefore=fs.readFileSync(dataFile),cfg={...Object.fromEntries(Object.keys(api.defaults).map(k=>[k,false])),namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticBiographyLead:true};
 report.bundles.push({bundle,sha256:sha(before),runtimeSha256:sha(before),dataSha256:sha(dataBefore),version:api.version});
 for(const f of rows){
  const options={...cfg,...f.extra},after=f.after??f.expected,row={id:f.id,bundle,kind:f.kind,status:'passed',sourceSha256:sha(f.source),optionsSha256:sha(JSON.stringify(canonical(options))),expectedEndpointSha256:sha(f.expected),candidateEndpointSha256:sha(after),scenarioSha256:sha(JSON.stringify(canonical({id:f.id,source:f.source,expected:f.expected,after,options,kind:f.kind})))};report.cases.push(row);
  try{
   const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);};
   if(f.kind==='actual'){
    const r=api.calculate({kind:'adjust',source:f.source,originalSource:f.source,options});row.actualEndpointSha256=sha(r.text);row.appliedIds=(r.changes||[]).map(x=>x.id);row.findings=r.preservation||[];
    eq(r.text,f.expected,'Independently authored exact complete-action endpoint');eq(r.preservation||[],[],'Pipeline preserves original fields and references');
    eq(api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options}).text,f.expected,'One-click convergence');
   }
   const findings=api.preservationAudit(f.source,after,options),composition=api.safeComposition(f.source,after,options);row.findings=findings;row.composition=composition;
   eq(findings.length>0,!!f.reject,'Preservation audit separately retains original and copied facts');eq(!!composition,!!f.reject,'Composition guard separately retains original and copied facts');
  }catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id:f.id,message:e.message});}
 }
 const plan=api.v25ApprovedSyntaxPlan(S,cfg),step=plan.safe.steps.find(x=>x.name==='v2151-biography-lead');
 for(const [id,mutate,reject]of [['fresh-source-step',p=>p,false],['stale-step-source',p=>{p.safe.steps.find(x=>x.name==='v2151-biography-lead').before+='x';return p;},true],['forged-copied-fact',p=>{p.safe.steps.find(x=>x.name==='v2151-biography-lead').edits.find(x=>x.proof.copiedFacts?.length).proof.copiedFacts[0].identity='2/1/1900';return p;},true],['stale-option-authority',p=>{p.cfg.automaticBiographyLead=false;return p;},true]]){
  const row={id,bundle,kind:'fresh-source-proof',status:'passed'};report.cases.push(row);
  try{report.checks++;assert.ok(step,'Existing source plan actually contains the proved copy');const p=mutate(structuredClone(plan)),r=api.v219BiographySourceFactProof(p,E,E);row.result=r;report.checks++;assert.equal(!r.accepted,reject,'Proof binds source edits and options');}catch(e){row.status='failed';report.status='failed';report.failures.push({bundle,id,message:e.message});}
 }
 report.checks++;assert.equal(sha(fs.readFileSync(file)),sha(before),'Runtime immutable after execution');report.checks++;assert.equal(sha(fs.readFileSync(dataFile)),sha(dataBefore),'Companion data immutable after execution');
}
report.distinctScenarioCount=new Set(report.cases.map(x=>x.scenarioSha256).filter(Boolean)).size;
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

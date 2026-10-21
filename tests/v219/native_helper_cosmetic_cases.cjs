'use strict';
// Fictional source-bound endpoints and guard controls. No runtime injection.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const report={kind:'source-bound-native-helper-cosmetic-proposal-cases',status:'running',runnerSha256:sha(fs.readFileSync(__filename)),cases:[],failures:[],checks:0,bundles:[]};
function check(ok,message){report.checks++;if(!ok)throw Error(message);}
function scenario(api,bundle,id,kind,source,expected,cfg,run){const row={bundle,id,kind,sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(cfg))};if(expected!==null)row.expectedEndpointSha256=sha(expected);try{run(row);row.status='passed';}catch(e){row.status='failed';row.error=e.message;report.failures.push({bundle,id,error:e.message});}report.cases.push(row);}
const pairs=[
 ['harvref-duplicate','{{HarvRef|BracketLeft=Valor literal|BracketLeft=Valor literal}}','{{HarvRef|BracketLeft=Valor literal}}','parameterDuplicates'],
 ['refn-group-duplicate','{{Refn|group=Valor literal|group=Valor literal}}','{{Refn|group=Valor literal}}','parameterDuplicates'],
 ['efn-content-duplicate','{{Efn|content=Valor literal|content=Valor literal}}','{{Efn|content=Valor literal}}','parameterDuplicates'],
 ['efn-empty','{{Efn|campo_catalogo_sem_destino_7349=}}','{{Efn}}','emptyInvalidParameters'],
 ['sfnm-duplicate','{{Sfnm|10a1=Valor literal|10a1=Valor literal}}','{{Sfnm|10a1=Valor literal}}','parameterDuplicates'],
 ['sfnm-empty','{{Sfnm|campo_catalogo_sem_destino_7349=}}','{{Sfnm}}','emptyInvalidParameters'],
 ['refn-empty','{{Refn|campo_catalogo_sem_destino_7349=}}','{{Refn}}','emptyInvalidParameters'],
 ['sfnmp-duplicate','{{Sfnmp|10a1=Valor literal|10a1=Valor literal}}','{{Sfnmp|10a1=Valor literal}}','parameterDuplicates'],
 ['sfnmp-empty','{{Sfnmp|campo_catalogo_sem_destino_7349=}}','{{Sfnmp}}','emptyInvalidParameters'],
 ['sfnp-duplicate','{{Sfnp|BracketLeft=Valor literal|BracketLeft=Valor literal}}','{{Sfnp|BracketLeft=Valor literal}}','parameterDuplicates']
];
const args=process.argv.slice(2),runtimeFiles=args.length?args.flatMap(file=>fs.statSync(path.resolve(file)).isDirectory()?['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(path.resolve(file),name)):[path.resolve(file)]):['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.resolve(__dirname,'../../dist/2.19.0',name));
const receipt=require('./reference_receipt_metadata.cjs').begin(report,runtimeFiles,[path.join(__dirname,'native_helper_cosmetic_contract.json')],__filename);
for(const runtimeFile of runtimeFiles){const file=path.basename(runtimeFile);
 const full=runtimeFile,api=require(full);
 const off=Object.fromEntries(Object.entries(api.defaults).map(([k,v])=>[k,typeof v==='boolean'?false:v]));
 const cfg={...off,namespaceNumber:0,contentModel:'wikitext',auxiliaryTemplates:true,automaticParameterDuplicates:true,automaticParameterNames:true,automaticEmptyParameters:true};
 const guards=(source,target,c=cfg)=>{check(api.preservationAudit(source,target,c).length===0,'preservation');check(api.safeComposition(source,target,c)==='','composition');};
 const reject=(source,target,c=cfg)=>{check(api.preservationAudit(source,target,c).length>0,'mutation preservation rejected');check(api.safeComposition(source,target,c)!=='','mutation composition rejected');};
 const actual=(source,expected,c,row)=>{receipt.whole(row,source,c,expected,row.id);const a=api.calculate({kind:'adjust',source,options:c}),b=api.calculate({kind:'adjust',source:a.text,options:c});row.actualEndpointSha256=sha(a.text);row.appliedIds=(a.changes||[]).map(x=>x.id);check(a.text===expected,'exact independent endpoint');check(b.text===a.text,'idempotence');check(!a.preservation?.length,'pipeline preservation');guards(source,a.text,c);return a;};
 for(const [id,source,expected,rule]of pairs){
  scenario(api,file,id,'positive',source,expected,cfg,row=>{const a=actual(source,expected,cfg,row);check(a.changes.some(c=>c.id===rule),'original applied counter');const plan=api.v219NativeHelperCosmeticPlan(source,cfg);check(plan.edits.length===1,'fresh plan one helper');check(api.v219NativeHelperCosmeticProof(source,expected,plan,cfg),'fresh proof');check(!api.v219NativeHelperCosmeticProof(source+' ',expected,plan,cfg),'stale source proof');check(!api.v219NativeHelperCosmeticProof(source,expected+' ',{...plan,text:expected+' '},cfg),'forged output proof');});
  for(const option of ['auxiliaryTemplates',rule==='parameterDuplicates'?'automaticParameterDuplicates':'automaticEmptyParameters']){const c={...cfg,[option]:false};scenario(api,file,id+'-off-'+option,'protected',source,source,c,row=>{actual(source,source,c,row);check(api.v219NativeHelperCosmeticPlan(source,c).edits.length===0,'disabled fresh plan');});}
  const defaults={...api.defaults,namespaceNumber:0,contentModel:'wikitext'};scenario(api,file,id+'-default-composition','default-invariants',source,null,defaults,row=>{const a=api.calculate({kind:'adjust',source,options:defaults}),b=api.calculate({kind:'adjust',source:a.text,options:defaults});row.actualEndpointSha256=sha(a.text);check(a.text.includes(expected),'independent supplied helper endpoint retained');check(a.text===b.text,'default convergence');check(!a.preservation?.length,'default pipeline preservation');guards(source,a.text,defaults);});
 }
 const literal='{{Efn|content=Fonte literal.|content=Fonte literal.}}',fixed='{{Efn|content=Fonte literal.}}';
 for(const [id,wrap]of [['code',v=>'<code>'+v+'</code>'],['blockquote',v=>'<blockquote>'+v+'</blockquote>'],['quote',v=>'"Trecho '+v+' literal."'],['italic',v=>"''Trecho "+v+" literal.''"],['unknown-owner',v=>'{{Dono desconhecido|'+v+'}}'],['quotation-owner',v=>'{{Citação|'+v+'}}']]){
  const source=wrap(literal)+'\n[[Destino|Destino]]',expected=wrap(literal)+'\n[[Destino]]',c={...cfg,links:true};scenario(api,file,'hard-'+id,'protected',source,expected,c,row=>{actual(source,expected,c,row);check(api.v219NativeHelperCosmeticPlan(source,c).edits.length===0,'hard source plan refusal');reject(source,wrap(fixed)+'\n[[Destino]]',c);});
 }
 const preserved=[
  ['implicit-explicit-one','{{Efn|1=Primeira|Segunda|content=Corpo|content=Corpo}}'],
  ['same-implicit-explicit-one','{{Refn|1=Corpo|Corpo|group=n|group=n}}'],
  ['body-alias-blank','{{Efn|1=|content=Corpo|content=Corpo}}'],
  ['group-alias-blank','{{Efn|group=|grupo=nota|content=Corpo|content=Corpo}}'],
  ['name-alias-blank','{{Efn|name=|nome=beta|content=Corpo|content=Corpo}}'],
  ['unknown-nonempty','{{Refn|campo_sem_papel=Texto|name=beta|name=beta}}'],
  ['dynamic','{{Refn|refn={{Fonte dinâmica}}|name=beta|name=beta}}'],
  ['case-invalid','{{REFN|name=beta|name=beta}}'],
  ['namespace-invalid','{{Template talk:Refn|name=beta|name=beta}}'],
  ['entity-elsewhere','<ref name="a&nbsp;b">Fonte protegida.</ref>'+literal],
  ['opaque-peer','<ref name="a">'+literal+'</ref><code><ref name="a">'+literal+'</ref></code>'],
  ['generated-explicit-name','{{Sfnp|Exemplo|2001|name=|BracketLeft=Valor literal|BracketLeft=Valor literal}}']
 ];
 for(const [id,source]of preserved)scenario(api,file,'refuse-'+id,'protected',source,source,cfg,row=>{actual(source,source,cfg,row);check(api.v219NativeHelperCosmeticPlan(source,cfg).edits.length===0,'bounded proposal refused');});
 for(const [id,source,expected]of [
  ['explicit-identical-one','{{Refn|1=Corpo|1=Corpo}}','{{Refn|1=Corpo}}'],
  ['literal-prefix','{{Template:Refn|refn=Corpo|refn=Corpo}}','{{Template:Refn|refn=Corpo}}'],
  ['native-prefix','{{Predefinição:Refn|refn=Corpo|refn=Corpo}}','{{Predefinição:Refn|refn=Corpo}}'],
  ['native-underscore','{{_Refn|refn=Corpo|refn=Corpo}}','{{_Refn|refn=Corpo}}'],
  ['two-atomic-definitions','<ref name="a">'+literal+'</ref>\n<ref name="a">'+literal+'</ref>','<ref name="a">'+fixed+'</ref>\n<ref name="a">'+fixed+'</ref>']
 ])scenario(api,file,id,'positive',source,expected,cfg,row=>{actual(source,expected,cfg,row);});
 const outer='<ref name="a">{{Citar web|título=Fonte literal|url=https://example.invalid/fonte|autor=Pessoa literal|data=2001-03-05}}</ref><ref name="a" />';
 const source=outer+'\n'+literal+'\n{{Referências|grupo=lower-alpha|nível=0}}',expected=outer+'\n'+fixed+'\n{{Referências|grupo=lower-alpha|nível=0}}';
 scenario(api,file,'typed-whole-source-context','positive',source,expected,cfg,row=>{actual(source,expected,cfg,row);for(const target of [expected.replace('título=Fonte literal','título=Outra fonte'),expected.replace('url=https://example.invalid/fonte','url=https://example.invalid/outra'),expected.replace('autor=Pessoa literal','autor=Outra pessoa'),expected.replace('data=2001-03-05','data=2002-03-05'),expected.replace('content=Fonte literal.','content=Outra fonte.'),expected.replace('grupo=lower-alpha','grupo=nota')])reject(source,target);});
 for(const helper of [pairs[0][1],pairs[5][1]]){
  const source='<ref>Fonte A literal.</ref>\n'+helper+'\n{{Referências}}',plan=api.v219NativeHelperCosmeticPlan(source,cfg),target=plan.text.replace('Fonte A literal.','Outra fonte literal.');scenario(api,file,'anonymous-binding-'+sha(helper).slice(0,8),'guard-only',source,null,cfg,row=>{check(plan.edits.length===1,'source cosmetic available');reject(source,target);});
 }
 const bankSource=pairs[0][1]+'\n{{Referências|refs=<ref name="a">Fonte A.</ref><ref name="b">Fonte B.</ref>}}',bankPlan=api.v219NativeHelperCosmeticPlan(bankSource,cfg);
 scenario(api,file,'bank-associations-and-multiplicity','guard-only',bankSource,null,cfg,row=>{check(bankPlan.edits.length===1,'bank companion cosmetic available');for(const changed of [bankPlan.text.replace('name="a">Fonte A.','name="b">Fonte A.').replace('name="b">Fonte B.','name="a">Fonte B.'),bankPlan.text.replace('</ref>}}','</ref><ref name="a">Fonte A.</ref>}}')])reject(bankSource,changed);});
 const extraPreserved=[
  ['body-fallback-blank','{{Refn|1=|refn=Corpo|refn=Corpo}}'],
  ['efn-body-fallback-blank','{{Efn|content=Corpo|text=|content=Corpo}}'],
  ['case-interior-invalid','{{rEfn|refn=Corpo|refn=Corpo}}'],
  ['module-namespace-invalid','{{Module:Refn|refn=Corpo|refn=Corpo}}'],
  ['uncertain-helper-name','{{Refn|name=a&nbsp;b|refn=Corpo|refn=Corpo}}'],
  ['implicit-before-explicit-duplicates','{{Refn|Primeira|1=Corpo|1=Corpo}}'],
  ['implicit-after-explicit-duplicates','{{Refn|1=Corpo|1=Corpo|Primeira}}'],
  ['unequal-final-blank','{{Refn|1=Corpo|1=|1=}}'],
  ['capital-name-nonempty','{{Refn|refn=Corpo|Name=ref-auto-1|name=beta|name=beta}}'],
  ['note-name-alias-blank','{{Efn|Corpo|name=|nome=beta|group=nota|group=nota}}']
 ];
 for(const [id,source]of extraPreserved)scenario(api,file,id,'protected',source,source,cfg,row=>{actual(source,source,cfg,row);check(api.v219NativeHelperCosmeticPlan(source,cfg).edits.length===0,'source-bound refusal');});
 for(const [id,source,expected]of [
  ['same-blank-name-retained','{{Refn|refn=Corpo|name=|name=}}','{{Refn|refn=Corpo|name=}}'],
  ['ignored-empty-padding','{{Refn|campo_catalogo_sem_destino_7349= \t}}','{{Refn}}'],
  ['ignored-empty-duplicates','{{Refn|campo_catalogo_sem_destino_7349=|campo_catalogo_sem_destino_7349=}}','{{Refn}}'],
  ['unrelated-body-entity','Texto&nbsp;literal.\n{{Refn|refn=Corpo|refn=Corpo}}','Texto&nbsp;literal.\n{{Refn|refn=Corpo}}'],
  ['namespace-with-underscores','{{Template_:_Refn|refn=Corpo|refn=Corpo}}','{{Template_:_Refn|refn=Corpo}}'],
  ['capital-name-ignored-empty','{{Refn|refn=Corpo|Name=}}','{{Refn|refn=Corpo}}']
 ])scenario(api,file,id,'positive',source,expected,cfg,row=>{actual(source,expected,cfg,row);const plan=api.v219NativeHelperCosmeticPlan(source,cfg);check(api.v219NativeHelperCosmeticProof(source,expected,plan,cfg),'source proof');const forged=JSON.parse(JSON.stringify(plan));forged.edits[0].start++;check(!api.v219NativeHelperCosmeticProof(source,expected,forged,cfg),'forged offsets refused');check(!api.v219NativeHelperCosmeticProof(source,expected,plan,{...cfg,auxiliaryTemplates:false}),'different permissions refused');});
 const atomicSource='<ref name="a">'+literal+'</ref>\n<ref name="a">'+literal+'</ref>',partialAtomic='<ref name="a">'+fixed+'</ref>\n<ref name="a">'+literal+'</ref>';
 scenario(api,file,'partial-atomic-transaction','guard-only',atomicSource,null,cfg,row=>{reject(atomicSource,partialAtomic);});
 const orderSource='<ref name="a">Fonte A.</ref>\n'+pairs[0][1]+'\n<ref name="b">Fonte B.</ref>\n{{Referências}}',orderPlan=api.v219NativeHelperCosmeticPlan(orderSource,cfg);
 scenario(api,file,'generated-position-after-cosmetics','guard-only',orderSource,null,cfg,row=>{check(orderPlan.edits.length===1,'cosmetic available');const without=orderPlan.text.replace(pairs[0][2]+'\n','');for(const target of [without+'\n'+pairs[0][2],without.replace('<ref name="a">',pairs[0][2]+'\n<ref name="a">')])reject(orderSource,target);});
 const many=Array.from({length:1000},(_,i)=>'{{Sfnm|1a1=Pessoa literal '+i+'|1a1=Pessoa literal '+i+'}}').join('\n'),manyExpected=Array.from({length:1000},(_,i)=>'{{Sfnm|1a1=Pessoa literal '+i+'}}').join('\n');
 scenario(api,file,'many-helper-stress-1000','stress-positive',many,manyExpected,cfg,row=>{const start=performance.now();actual(many,manyExpected,cfg,row);row.elapsedMilliseconds=performance.now()-start;check(row.elapsedMilliseconds<120000,'bounded 1000-helper execution');});
 const stress=Array.from({length:300},(_,i)=>'{{Sfnm|1a1=Pessoa literal '+i+'|1a1=Pessoa literal '+i+'}}').join('\n'),stressExpected=Array.from({length:300},(_,i)=>'{{Sfnm|1a1=Pessoa literal '+i+'}}').join('\n');
 scenario(api,file,'many-helper-stress-300','stress-positive',stress,stressExpected,cfg,row=>{const start=performance.now();actual(stress,stressExpected,cfg,row);row.elapsedMilliseconds=performance.now()-start;check(row.elapsedMilliseconds<120000,'bounded many-helper execution');});
}
report.status=report.failures.length?'failed':'passed';receipt.finish();console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;

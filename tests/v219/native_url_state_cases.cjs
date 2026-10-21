'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const contract=JSON.parse(fs.readFileSync(path.join(__dirname,'native_url_state_contract.json'))),report={kind:'native-citation-url-state-preservation',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),contractSha256:sha(fs.readFileSync(path.join(__dirname,'native_url_state_contract.json'))),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
const native=['Citar web','Citar jornal','Citar livro','Citar periódico','Citar revista'],aliases=[['Cite web','Citar web'],['Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista']],values=['sim','não','yes','no','dead','live','unfit','usurped','bot: unknown','março de 2001','valor indefinido',' YES ','no <!--literal-->','','{{Valor fictício}}','<nowiki>yes</nowiki>','"yes"','0','1','false','true','off','-','sí','si','sì','ja','oui','nein','non','vivo','viva','morto','morta','ativo','activo','s','n','NO','LIVE','unfit no archive','usurped no archive'];
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(bytes),bytes:bytes.length,runtimeVersion:api.version,helperPreview:false});assert.equal(typeof api.v219CitationUrlState,'function');
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,dates:false},calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}});
 for(const[role,keys]of Object.entries(contract.roles))for(const key of keys)for(const value of values){
  test(bundle,'helper-'+sha(key+value).slice(0,20),()=>eq(api.v219CitationUrlState(key,value),{key,value,role,preserve:true},'Native URL-state roles preserve the exact supplied bytes without inferred boolean conversion'));
  for(const title of native)for(const names of [true,false])test(bundle,'native-'+sha(title+key+value+names).slice(0,20),()=>{
   const source='{{'+title+'|título=Fonte fictícia|'+key+'='+value+'}}',result=calc(source,{automaticParameterNames:names});
   eq(result.text,source,'An accepted native URL-state key and its value remain unchanged');eq(calc(result.text,{automaticParameterNames:names}).text,result.text,'The preserved field is stable');eq(api.preservationAudit(source,result.text,{...cfg,automaticParameterNames:names}),[],'Distinct native metadata roles remain intact');
  });
  for(const[alias,target]of aliases)for(const prefix of ['', 'Template:', 'Predefinição:'])test(bundle,'local-'+sha(prefix+alias+key+value).slice(0,20),()=>{
   const source='{{'+prefix+alias+'|título=Fonte fictícia|'+key+'='+value+'}}',expected='{{'+target+'|título=Fonte fictícia|'+key+'='+value+'}}',result=calc(source);
   eq(result.text,expected,'A proved local header forwarding retains all URL-state argument bytes');eq(calc(result.text).text,result.text,'The local header forwarding is stable in one action');
  });
 }
 for(const key of ['URL-STATUS','urlstatus','estado-url','morta','constructor','__proto__'])test(bundle,'unknown-role-'+key,()=>eq(api.v219CitationUrlState(key,'yes'),null,'Unproved keys are not assigned a native status role'));
 for(const title of native)for(const fields of ['url-status=yes|urlmorta=não','dead-url=sim|urlmorta=no','url-status=dead|urlmorta=live','url-status=|urlmorta=sim'])test(bundle,'conflicting-native-'+sha(title+fields).slice(0,20),()=>{
  const source='{{'+title+'|título=Fonte fictícia|'+fields+'}}',result=calc(source);eq(result.text,source,'A status field cannot be converted into a competing native role or consume a blank override');eq(calc(result.text).text,result.text,'Existing native role/alias precedence stays stable');
 });
 for(const title of native)test(bundle,'independent-safe-repair-'+title,()=>{
  const source='{{'+title+'|título=Fonte fictícia|url-status=yes|pág=12}}',expected='{{'+title+'|título=Fonte fictícia|url-status=yes|página=12}}',result=calc(source);eq(result.text,expected,'Preserving URL-state semantics does not block a separately proved invalid-key repair');ok(!result.warnings.length,'No new advisory alert is needed for preserved native URL-state values');
 });
 for(const title of native)for(const [from,to]of [['url-status=yes','urlmorta=sim'],['url-status=live','urlmorta=não'],['urlmorta=live','urlmorta=não'],['urlmorta=unfit','urlmorta=sim'],['li=no|urlmorta=sim','urlmorta=no|li=sim'],['li=|urlmorta=sim','urlmorta=|li=sim'],['li=no|urlmorta=sim','li=sim|urlmorta=no'],['urlmorta=no|urlmorta=sim','urlmorta=sim|urlmorta=no']])for(const wrapped of [false,true])test(bundle,'guard-status-mutation-'+sha(title+from+wrapped).slice(0,20),()=>{
  const citation=status=>'{{'+title+'|título=Fonte fictícia|url=https://example.org/fonte|arquivourl=https://web.archive.org/web/20010305000000/https://example.org/fonte|arquivodata=2001-03-05|'+status+'}}',wrap=value=>wrapped?'Texto fictício.<ref>'+value+'</ref>\n{{Referências}}':value,before=wrap(citation(from)),after=wrap(citation(to));
  ok(api.preservationAudit(before,after,cfg).length>0,'The independent guard rejects a changed native URL-state role or supplied state value');
  ok(api.safeComposition(before,after,cfg)!=='','The complete composition proof cannot waive a fabricated URL-state equivalence');
 });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

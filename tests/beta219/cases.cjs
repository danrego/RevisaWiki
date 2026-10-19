'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),version='2.19.0-beta.1',sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_beta219.json')));
const report={version,status:'running',cases:0,checks:0,bundles:[],failures:[],networkRequests:0,wikipediaWrites:0,mainValidationResumed:false};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
const ok=(v,label)=>{report.checks++;assert.ok(v,label);};
const test=(label,fn)=>{report.cases++;try{fn();}catch(error){report.failures.push({label,message:error.message});}};
const aliases=['Cabeçalho de discussão','PD','Pd','Página de discussão','PW-Alvo','BPV','Bpv','Coisas a não fazer','Discussão de portal','Página de discussão/Arquivo 1','Portais-aviso'];
for(const suffix of ['.js','_completo.js']){
 const name='RevisaWiki_v2_19_0_beta_1'+suffix,file=path.join(root,'dist',version,name),data=fs.readFileSync(file),pin=manifest.files[name];
 eq(data.length,pin.bytes,'Runtime byte length');eq(sha(data),pin.sha256,'Runtime content hash');
 const api=require(file),old=require(path.join(root,'dist/2.18.0','RevisaWiki_v2_18_0'+suffix));
 report.bundles.push({file:name,...pin});eq(api.version,version,'Experimental runtime version');
 eq(Object.keys(api).sort(),Object.keys(old).sort(),'No extra public functions');
 eq(JSON.stringify(api.defaults),JSON.stringify(old.defaults),'No hidden option changes');
 for(const key of Object.keys(api))if(typeof api[key]==='function'&&key!=='v25TalkPreparationPlan')
  test(name+': unchanged public function '+key,()=>eq(api[key].toString(),old[key].toString(),'Every other public function body is unchanged'));
 const cfg={namespaceNumber:1,contentModel:'wikitext'},body='== Conversa ==\nTexto da conversa.\n',mark='{{Marca de projeto|3|Cinema|2|Estados Unidos|4|rev=sim}}';
 const plan=(s,extra={},article='')=>api.v25TalkPreparationPlan(s,article,{...cfg,...extra});
 for(const title of aliases)for(const newline of ['\n','\r\n'])for(const decorate of [x=>x,x=>x[0].toLocaleLowerCase('pt')+x.slice(1),x=>'Template:'+x.replaceAll(' ','_'),x=>' Predefinição: '+x+' ']){
  const call='{{'+decorate(title)+'|1=preservar}}',s=call+newline+body.replaceAll('\n',newline);
  test(name+': native alias '+title+' '+sha(s).slice(0,8),()=>{
   const p=plan(s);eq(p.text,s,'Keep the original valid header and every parameter byte');eq(p.changed,false,'No redundant change');eq(plan(p.text).text,s,'Idempotence');
   const displaced=body+call+'\n',q=plan(displaced);eq(q.text,displaced,'An existing header below prose cannot get a duplicate');eq(q.changed,false,'Outside-prefix refusal leaves the draft intact');
  });
 }
 for(const title of aliases)test(name+': human assessments '+title,()=>{
  const s='{{'+title+'}}\n'+mark+'\n'+body,p=plan(s);
  eq(p.text,s,'Keep human grades, named parameters and original alias');
  const withArticle=plan(s,{},'{{Portal3|Cinema|Estados Unidos}}');eq(withArticle.text,s,'Existing project grades are not replaced');
 });
 for(const title of ['PÁgina de discussão','Página DE discussão','pagina de discussao','PD inexistente','PＤ','P\u200bD','P\u00a0D','sub'+'st:PD'])test(name+': unrecognized spelling '+sha(title).slice(0,8),()=>{
  const s='{{'+title+'}}\n'+body,p=plan(s);ok(p.text.startsWith('{{PD}}\n'),'An invalid spelling cannot impersonate the real header');ok(p.text.includes(s),'Unrecognized material remains intact');
 });
 for(const title of aliases)test(name+': duplicate aliases '+title,()=>{
  const s='{{PD}}\n{{'+title+'}}\n'+body;eq(plan(s).text,s,'Duplicate existing headers are preserved for manual review');
 });
 for(const enclosure of [s=>'<!--'+s+'-->',s=>'<nowiki>'+s+'</nowiki>',s=>'<pre>'+s+'</pre>'])test(name+': protected sample '+sha(enclosure('x')).slice(0,8),()=>{
  const s=enclosure('{{Página de discussão}}')+'\n'+body,p=plan(s);ok(p.text.startsWith('{{PD}}\n'),'A literal sample is not a transcluded header');ok(p.text.includes(s),'The complete protected example is retained');
 });
 for(const extra of [{namespaceNumber:0},{namespaceNumber:2},{namespaceNumber:3},{namespaceNumber:10},{sectionOnly:true},{section:'1'},{contentModel:'javascript'},{pageRedirect:true}])test(name+': original scope '+JSON.stringify(extra),()=>eq(plan(body,extra).text,body,'Unchanged namespace, section, redirect and model gates'));
 test(name+': empty page and portal conversion',()=>{
  eq(plan('').text,'{{PD}}\n','An empty talk page gets a single header');
  const s='Portal da física Portal da tecnologia Portal da ciência\n'+body;
  const p=plan(s);eq(p.text,'{{PD}}\n{{Marca de projeto|?|Física|?|Tecnologia|?|Ciência|?}}\n'+body,'Existing portal conversion still composes with header recognition');
 });
 // Literal article endpoints are compared with the published baseline. This
 // does not waive its historical findings or claim the final 2.19 campaign.
 const articles=[
  'Texto.<ref name="a">{{Cite web|title=Fonte literal|url=https://example.test/a}}</ref>\n\n{{Referências}}',
  '{{Info/Biografia|nome=Pessoa fictícia|data_nascimento={{dni|2|3|1980}}}}\n\nTexto literal.\n\n{{Referências}}\n{{Portal3|Biografias}}',
  '{| class="wikitable"\n! Nome !! Valor\n|-\n| Alfa || <math>x^2+1</math>\n|}\n',
  '[[Ficheiro:Exemplo.png|miniaturada|200px|Legenda literal]]\n',
  '<nowiki>{{PD}} {{Cite web|title=Exemplo}}</nowiki>\n<syntaxhighlight lang="lua">return {a=1}</syntaxhighlight>\n',
  'Texto.\n\n\n\nMais texto.<ref>{{Citar jornal|título=Fonte|url=https://example.test/b|url-access=subscription}}</ref>\n{{Referências}}'
 ];
 const mainOptions={namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,authorityControl:false,registryDoiCheck:false,automaticBiographyPortals:false,automaticTopicPortals:false,biographyPortal:false};
 for(const [i,s]of articles.entries())test(name+': unchanged article '+i,()=>{
  const result=api.calculate({kind:'adjust',source:s,options:mainOptions}),previous=old.calculate({kind:'adjust',source:s,options:mainOptions});
  eq(JSON.stringify(result),JSON.stringify(previous),'All article results, guards, warnings, counts and summary inputs stay equal to 2.18');
 });
 test(name+': full Worker deadline stays unchanged',()=>{
  const text=data.toString();ok(text.includes('}, 60000);'),'The production deadline remains 60 seconds');
  ok(text.includes('error.noFallback = true; dropWorker(error);'),'Timeout terminates the Worker without a staged fallback');
  ok(text.includes('if (error.noFallback) throw error;'),'The timeout cannot continue in the page thread');
 });
}
report.status=report.failures.length?'failed':'passed';
const out=path.join(root,'tests/evidence/2.19.0-beta.1');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'focused.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(report.failures.length)process.exitCode=1;

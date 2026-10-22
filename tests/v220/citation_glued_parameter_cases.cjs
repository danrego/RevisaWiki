'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const args=process.argv.slice(2),preview=args.includes('--guard-preview'),files=args.filter(s=>!s.startsWith('--'));
if(!files.length)throw new Error('Provide frozen bundle paths.');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),report={kind:'recognized-glued-parameter-refusal-regression',status:'passed',scope:preview?'isolated-guard-source-preview':'exact-runtime-guard-plan-and-action',checks:0,cases:[],networkRequests:0,wikipediaWrites:0};
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),data=globalThis.RevisaWikiDataV2||require(path.resolve(file.replace(/(?:_completo)?\.js$/,'_dados.js'))),cs1=data.packed.support219.cs1Keys.slice(),rules=api.translationRules;
 const keys=[...new Set([...cs1,...Object.values(rules.profiles).filter(p=>p.kind==='citation').flatMap(p=>Object.keys(p.fields||{}))].map(s=>s.replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt')))];
 const sourceFragment=fs.readFileSync(path.join(__dirname,'../../src/v2_20/citation_repairs.js'),'utf8');
 let guard=api.v220CitationFragmentMayBeParameter;
 if(preview){const start=sourceFragment.indexOf('    function v220CitationFragmentMayBeParameter('),end=sourceFragment.indexOf('    function v220CitationCall(',start);assert.ok(start>=0&&end>start);guard=new Function('CS1_KEYS','TRANSLATION_RULES','let v220CitationFragmentKeys=null;\n'+sourceFragment.slice(start,end)+'\nreturn v220CitationFragmentMayBeParameter;')(cs1,rules);}
 if(typeof guard!=='function')throw new Error('The exact runtime guard must be exported.');
 const ok=(v,m)=>{report.checks++;assert.ok(v,m);},eq=(a,b,m)=>{report.checks++;assert.equal(a,b,m);};
 const suffixes=['23','23 de abril de 2013',' 23 de abril de 2013',':23 de abril de 2013','https://example.invalid/fonte',"''Fonte''",'"Fonte"',"'Fonte'",'[[Fonte]]','&quot;Fonte&quot;','“Fonte”','‘Fonte’','<i>Fonte</i>','/Fonte','-Fonte','_Fonte','\tFonte'];
 for(const key of keys){const literal=key.replace(/#/g,'2');for(const value of suffixes)ok(guard(literal+value),'known key/value boundary absorbed: '+literal+value);}
 const positives=['Ciência em foco','Museu do futuro','Universo2024 em expansão','Estrelas e galáxias','Publicationes científicas','Autoridade e memória','Authoritative histories','Titleless stories','Author\u0301ity and language','Étoiles et galaxies','科学的発見'];
 for(const value of positives)ok(!guard(value),'ordinary title fragment blocked: '+value);
 report.cases.push({id:'all-recognized-vocabulary-boundaries',bundle,status:'passed',recognizedKeys:keys.length,guardSourceSha256:sha(sourceFragment),isolatedGuardPreview:preview});
 if(preview)continue;
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false};
 const fragments=['acessodata23 de abril de 2013','access-date23 April 2013','accessdate23 April 2013','data2024-01-02','page1997','pages10–15','pmid12345678','doi10.1000/controle','isbn9780000000000','urlhttps://example.invalid/fonte','url http://example.invalid/fonte','acessodata 23 de abril de 2013','acessodata:23 de abril de 2013',"publicado''Fonte''",'publicado"Fonte"',"publicado'Fonte'",'publicado[[Fonte]]','publicado&quot;Fonte&quot;','publicado“Fonte”','publicado‘Fonte’',"publisher''Fonte''",'utgivare"Fonte"','editorial[[Fonte]]','hämtdatum/2024'];
 for(const value of fragments){const source='Texto.<ref>{{Citar web|url=https://example.invalid/|título=Fonte de controle|'+value+'}}</ref>\n\n{{Referências}}',plan=api.v220CitationPlan(source,cfg);
  eq(plan.text,source,'parameter fragment joined to title: '+value);ok(api.v220CitationPlanProof(source,source,plan,cfg),'exact unchanged proof missing');
  const result=api.calculate({kind:'adjust',source,options:cfg});ok(!result.text.includes('{{!}}'+value),'complete action joined malformed metadata: '+value);ok(!result.changes.some(c=>c.id==='v220CitationLiteralPipe'),'title repair owner still active for metadata');
  eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'complete action not idempotent');report.cases.push({id:'glued-'+value.split(/[ :]/,1)[0],bundle,status:'passed',sourceSha256:sha(source),appliedSha256:sha(result.text),isolatedGuardPreview:false});
 }
 for(const value of positives){const source='{{Citar web|url=https://example.invalid/|título=Título|'+value+'}}',expected=source.replace('|'+value,'{{!}}'+value),plan=api.v220CitationPlan(source,cfg);eq(plan.text,expected,'legitimate title repair lost');report.cases.push({id:'literal-title-'+value.split(' ',1)[0],bundle,status:'passed',sourceSha256:sha(source),appliedSha256:sha(plan.text),isolatedGuardPreview:false});}
 for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'<code>'+s+'</code>',s=>'<!-- '+s+' -->']){const source=wrap('{{Citar web|título=Título|acessodata23 de abril de 2013}}');eq(api.v220CitationPlan(source,cfg).text,source,'encoded/protected example changed');}
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');

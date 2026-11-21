'use strict';
// Qualifies specific superseded assertions while executing every original one.
// This never changes a historical test, its expectation, or its raw failed status.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{inventory}=require('./infobox_legacy_qualification_inventory.cjs');
assert(process.env.REVISAWIKI_CURRENT_CORE,'Select the exact current runtime');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex');assert.equal(api.version,'2.22.1');
const frozen={
 'tests/v2217/infobox_cases.cjs':{sha256:'5590421e11adb248b2a951fa7caeb45dcbcab77ed5f22ed40f49165e07fc253d',allowed:{26:'origin',27:'birth-name-role',29:'origin',31:'origin',32:'origin',38:'origin',57:'birth-name-role',96:'space',99:'space',102:'space',105:'space',132:'space'}},
 'tests/v2217/infobox_integrated.cjs':{sha256:'b56b64a341eed2964a4a203ced66a181d38e9579672bde72459709ff0191bbcb',allowed:{11:'space',13:'origin',14:'origin'}},
 'tests/v2217/portal_cases.cjs':{sha256:'91cbf212ffe3e295b4bd0c06d77653e78dd499e48625fff8ec8ffa6a59815477',allowed:{20:'origin',23:'origin'}},
 'tests/v2217/portal_field_priority.cjs':{sha256:'f194a36efccc3e608aa578910988c8dd793b550066be4b5927d133c542920cbd',allowed:{11:'space',22:'space',33:'space',44:'space',53:'space',64:'space',67:'space',75:'space'}},
 'tests/v2217/portal_destination.cjs':{sha256:'567395801473ab3dc71c368637cc8ade9b56f5bc1865b50a0e8c56cb228e7b7b',allowed:{48:'space',52:'space',56:'space'}},
 'tests/v2220/infobox_cases.cjs':{sha256:'f0dab8bc995125d99eb45feb417386a3cfb9610089858696269d7dc58e7feea3',allowed:{62:'origin',65:'origin',68:'origin',124:'origin'}},
 'tests/v2220/infobox_unicode_fields_integration.cjs':{sha256:'bed06268392c4add98de760dcaabf8937ff1b95ae2e9ccc99ab54758d139e9fd',allowed:Object.fromEntries(Array.from({length:12},(_,i)=>[9+19*i,'approved-invisible-citation-key']))},
 'tests/v2220/native_syntax_integration.cjs':{sha256:'83753193f65c2de62c3669a9e8512f1d77fec2cd576555d4f8ff1189b6598394',allowed:{66:'space',70:'origin',71:'origin',72:'origin'}}
};
const reasons={space:{scope:'INFOBOX-POST-EQUALS-SPACE-001',replacement:'qualified-spacing',reason:'A filled infobox value has exactly one ASCII space after =; its literal value and key are checked independently.'},origin:{scope:'IF02/IF03/native-wrapper-origin-consensus',replacement:'qualified-origin',reason:'The ambiguous local/English/Catalan Infobox person header is preserved without trusted source; unsupported image-size/compound fields cannot borrow the older generic translator.'},'birth-name-role':{scope:'IF04/native-reader-semantic-roles',replacement:'qualified-birth-name',reason:'English birth_name is not proved equivalent to the native Nome completo slot. Preserve the supplied fact instead of writing an unconsumed or semantically different key.'},'approved-invisible-citation-key':{scope:'REFX-PARAM-03',replacement:'qualified-invisible-key',reason:'Explicitly approved singleton damaged citation keys can be recovered to one known native role; conflicting aliases and all value characters remain protected. Independent ASCII URL repair remains allowed.'}};
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa Exemplo',sectionOnly:false,autoPreview:false,registryDoiCheck:false,v2212PortalProofRequired:false};
let checks=0;const controls=[],controlFailures=[];function ok(x,m){checks++;assert(x,m);}function equal(a,b,m){checks++;assert.deepEqual(a,b,m);}
const trim=x=>x.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
function box(text,title){const at=text.indexOf('{{'+title);if(at<0)return null;for(let end=text.indexOf('}}',at+2);end>=0;end=text.indexOf('}}',end+2)){const raw=text.slice(at,end+2),parsed=api.v2221InfoboxRead(raw);if(parsed)return {raw,parsed};}return null;}
function field(row,key){const found=row?.parsed.fields.filter(x=>x.key===key)||[];assert.equal(found.length,1,'Expected one preserved literal field '+key);return trim(found[0].value);}
function calculate(source,options={}){const result=api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg,...options}});ok(api.v219AutomaticResultSafety(source,result).accepted,'full preservation');const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:{...cfg,...options}});equal(again.text,result.text,'full idempotence');return result;}
function control(id,fn){const before=checks;try{fn();controls.push({id,checks:checks-before,status:'passed'});}catch(error){controlFailures.push({id,message:error.message});controls.push({id,checks:checks-before,status:'failed'});}}
const lead="\n\n'''Pessoa Exemplo''' é uma pessoa.\n";
let report;
try{
 const historical=inventory(file),qualified=[],unexpected=[];
 for(const row of historical.results){equal(row.testSha256,frozen[row.suite].sha256,'historical source immutable');ok(!row.exception,'all remaining assertions executed');for(const failure of row.failures){const category=frozen[row.suite].allowed[failure.assertion];if(category)qualified.push({suite:row.suite,assertion:failure.assertion,message:failure.message,category,...reasons[category]});else unexpected.push({suite:row.suite,...failure});}}
 report={kind:'historical-infobox-current-contract-qualification',historicalStatus:'original failures retained; this is a separate qualification',runtimeSha256:sha(fs.readFileSync(file)),historicalAssertions:historical.results.reduce((n,r)=>n+r.assertions,0),historicalAssertionsPassingUnchanged:historical.results.reduce((n,r)=>n+r.passedAssertions,0),qualifiedHistoricalDifferences:qualified,unexpectedHistoricalFailures:unexpected,rawInventory:historical};
 control('qualified-spacing',()=>{
  for(const[owner,key,value]of [['Info/Biografia','website','https://example.invalid/'],['Info/Político','website','https://example.invalid/'],['Info/Biografia','nationality','português'],['Info/Cientista','nationality','português'],['Info/Escritor','nationality','português'],['Info/Biografia','occupation','escritor'],['Info/Cientista','occupation','escritor'],['Info/Escritor','occupation','escritor']]){
   const text=api.v2217InfoboxPlan('{{'+owner+'|nome=Pessoa Exemplo|'+key+'='+value+'}}',cfg).text,b=box(text,owner),target=key==='website'&&owner==='Info/Biografia'?'site':key==='nationality'?'nacionalidade':key==='occupation'?'ocupação':key;equal(field(b,target),value);ok(new RegExp('\\|'+target+'[ \\t]+= '+value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(b.raw),'one post-equals space');
  }
  const competing=box(api.v2217InfoboxPlan('{{Info/Biografia|nome=Pessoa|website=https://example.invalid/a|site=https://example.invalid/b}}',cfg).text,'Info/Biografia');equal(field(competing,'website'),'https://example.invalid/a');equal(field(competing,'site'),'https://example.invalid/b');
  const translated=box(api.v2217InfoboxPlan('{{Infobox Biographie|nom=Pessoa Exemplo|lieu de naissance=[[Ville Exemplo]], France}}',cfg).text,'Info/Biografia');equal(field(translated,'nascimento_local'),'[[Ville Exemplo]], France');
  const unicode=box(api.v2217InfoboxPlan('{{Info/Empresa|nome=\u00a0Empresa Exemplo\u00a0|campo=\u2003Valor\u2003}}',cfg).text,'Info/Empresa');equal(field(unicode,'nome'),'\u00a0Empresa Exemplo\u00a0');equal(field(unicode,'campo'),'\u2003Valor\u2003');
  const company=box(calculate('{{Info/Empresa|nome=Empresa|homepage=https://example.org/?x=1#part}}'+lead).text,'Info/Empresa');equal(field(company,'site'),'https://example.org/?x=1#part');ok(/\|site\s+= https:\/\/example.org\/\?x=1#part/.test(company.raw),'exact native company preference and one ASCII margin');
  for(const tail of ['{{Modelo desconhecido\n','{{Portal3|Biografias}}\n{{Modelo desconhecido\n','<nowiki>{{Modelo incompleto [[Ligação</nowiki>\n']){const text=calculate('{{Info/Biografia|nome=Pessoa de teste|nacionalidade=França}}\n'+lead+tail).text;equal(field(box(text,'Info/Biografia'),'nome'),'Pessoa de teste');}
 });
 control('qualified-origin',()=>{
  const person='{{Infobox person|image=Example.png|caption=Example in 2024|birth_name=Pessoa Exemplo Completa|birth_date={{birth date and age|df=y|1999|10|14}}|birth_place=[[Cidade Exemplo]], Italy|citizenship={{hlist|[[United Kingdom]]|[[Italy]]}}|education=[[Example University]]|occupation=|years_active=2013–present}}';
  const held=box(api.v2217InfoboxPlan(person,cfg).text,'Infobox person');ok(held);equal(field(held,'birth_name'),'Pessoa Exemplo Completa');equal(field(held,'caption'),'Example in 2024');equal(field(held,'citizenship'),'{{hlist|[[United Kingdom]]|[[Italy]]}}');equal(field(held,'occupation'),'');equal(field(held,'years_active'),'2013–present');equal(field(held,'education'),'[[Example University]]');
  const mixed=person.replace('caption=','legenda=').replace('education=','educação=').replace('citizenship=','cidadania='),mixedHeld=box(api.v2217InfoboxPlan(mixed,cfg).text,'Infobox person');ok(mixedHeld);equal(field(mixedHeld,'legenda'),'Example in 2024');equal(field(mixedHeld,'educação'),'[[Example University]]');
  for(const raw of ['{{Infobox person|name=Pessoa|image_size=200|birth_place=Paris}}','{{Infobox person|name=Pessoa|image_size=200px}}','{{Infobox person|name=Pessoa|image_size=200|birth_date={{birth date and age|1920|1|2}}|death_date=2000}}']){const plan=api.v222InfoboxPlan(raw,cfg);equal(plan.text,raw);equal(plan.edits.length,0);ok(api.v222InfoboxProof(raw,raw,plan,cfg));}
  const fullHeld=box(calculate('{{Infobox person|name=Pessoa|image_size=200|birth_place=Paris}}'+lead).text,'Infobox person');ok(fullHeld);equal(field(fullHeld,'name'),'Pessoa');equal(field(fullHeld,'image_size'),'200');equal(field(fullHeld,'birth_place'),'Paris');
  // The old country expectation consumes the output of the now-refused owner
  // migration. Its literal `nome` key is not consumed by the pinned wrapper.
  const mixedCountry='{{Infobox person|nome=Pessoa Exemplo|birth_place=[[Cidade Exemplo]], U.S.}}'+lead,rawPlan=api.v2217InfoboxPlan(mixedCountry,cfg),mixedBox=box(rawPlan.text,'Infobox person');ok(mixedBox);equal(field(mixedBox,'nome'),'Pessoa Exemplo');equal(field(mixedBox,'birth_place'),'[[Cidade Exemplo]], U.S.');
  const convertedCountry=calculate('{{Infobox person|name=Pessoa Exemplo|birth_place=[[Cidade Exemplo]], U.S.}}'+lead,{v2221InfoboxSourceWiki:'en',v2221InfoboxCatalogJson:fs.readFileSync(path.resolve(__dirname,'../../src/v2_22_1/infobox_registry_data.json'),'utf8')}).text;equal(field(box(convertedCountry,'Info/Biografia'),'nascimento_local'),'[[Cidade Exemplo]], U.S.');ok(/\{\{Portal3\|[^}]*Estados Unidos/.test(convertedCountry));
 });
 control('qualified-birth-name',()=>{
  const text=api.v2217InfoboxPlan('{{Info/Biografia|nome=Pessoa Exemplo|birth_name=Nome de nascimento|birth_place=[[Cidade Exemplo]], França|education=[[Universidade Exemplo]]|citizenship=França}}',cfg).text,b=box(text,'Info/Biografia');equal(field(b,'birth_name'),'Nome de nascimento');ok(!b.parsed.fields.some(row=>row.key==='nome_nascimento'));equal(field(b,'educação'),'[[Universidade Exemplo]]');equal(field(b,'cidadania'),'França');
 });
 control('qualified-invisible-key',()=>{
  for(const char of ['\u00a0','\u202f','\u3000','\ufeff','\u200b','\u2028'])for(const side of ['leading','trailing']){
   const key=side==='leading'?char+'url':'url'+char,source='Texto.<ref>{{Citar web|title=Fonte|publisher=Instituição|'+key+'=http://http://example.org/a?x=1#part}}</ref>\n{{Referências}}\n',text=calculate(source,{portals:false,authorityControl:false}).text;ok(text.includes('|url=http://example.org/a?x=1#part'));ok(!text.includes(key+'='));ok(text.includes('|título=Fonte'));ok(text.includes('|publicado=Instituição'));
   const conflict='Texto.<ref>{{Citar web|title=Fonte|url=https://example.invalid/correto|'+key+'=http://http://example.org/a?x=1#part}}</ref>\n{{Referências}}\n',kept=calculate(conflict,{portals:false,authorityControl:false}).text;ok(kept.includes(key+'=http://http://example.org/a?x=1#part'),'conflicting role remains opaque');ok(kept.includes('|url=https://example.invalid/correto'));
  }
 });
 control('approved-title-cleanup-composes-after-key-recovery',()=>{
  const source='Texto.<ref>{{Citar web|tí\u200btulo=Valor\u200bintacto|url=https://example.invalid/}}</ref>\n{{Referências}}',options={...cfg,portals:false,authorityControl:false},isolated=api.v2221CitationFieldsPlan(source,options);
  ok(api.v2221CitationFieldsProof(source,isolated.text,isolated,options));equal(isolated.text,source.replace('tí\u200btulo=','título='),'the field-key planner alone preserves every value code unit');equal(isolated.edits.length,1);equal(isolated.edits[0].count,1);
  const result=calculate(source,options),alreadyClean=calculate(source.replace('Valor\u200bintacto','Valorintacto'),options),count=row=>row.changes.reduce((n,c)=>n+c.count,0);
  ok(result.text.includes('|título=Valorintacto'),'REFX2-FIELD-011 independently cleans Latin/number literal-title contamination');equal(count(result),count(alreadyClean)+1,'the independent title-value correction is counted separately');
 });
 control('title-values-outside-approved-literal-cleanup-remain-exact',()=>{
  for(const value of ['ไทย\u200bไทย','Valor\u200dintacto','https://example.invalid/A\u200bB','{{lang|en|Valor\u200bintacto}}','A\u0301\u200bB']){
   const source='Texto.<ref>{{Citar web|tí\u200btulo='+value+'|url=https://example.invalid/}}</ref>\n{{Referências}}',options={...cfg,portals:false,authorityControl:false},isolated=api.v2221CitationFieldsPlan(source,options);
   equal(isolated.text,source.replace('tí\u200btulo=','título='),'key-only proof cannot alter Thai, joiners, marks, dynamic text or URLs');ok(calculate(source,options).text.includes('|título='+value),'the full action preserves values outside F11 eligibility');
  }
 });
 control('country-margin-regression-is-not-qualified-away',()=>{
  for(const owner of ['Info/Biografia','Info/Cientista','Info/Escritor']){const source='{{'+owner+'|nome=Pessoa|Nacionalidade=português|local_nascimento=[[Cidade Exemplo]], França}}'+lead,text=calculate(source).text;ok(/\{\{Portal3\|[^}]*França/.test(text));ok(!/\{\{Portal3\|[^}]*Portugal/.test(text));}
 });
 control('literal-local-name-regression-is-not-qualified-away',()=>{
  const text=calculate('{{Ficha de persona|nombre=Pessoa Exemplo}}'+lead).text;equal(field(box(text,'Info/Biografia'),'nome'),'Pessoa Exemplo');
  for(const fields of ['nombre=[[Pessoa Exemplo]]','nombre=Pessoa Exemplo<ref>Fonte.</ref>','nome=Pessoa A|nombre=Pessoa B','nombre=Pessoa A|nombre=Pessoa B'])ok(box(calculate('{{Ficha de persona|'+fields+'}}'+lead).text,'Ficha de persona'));
 });
 equal(unexpected,[],'Unqualified integrity/coverage regressions remain failures');equal(controlFailures,[],'All replacement preservation controls must pass');
 report={...report,status:'passed-qualified-current-contract',replacementChecks:checks,controls,controlFailures,historicalOriginalSuiteStatusesRewritten:false,testSha256:sha(fs.readFileSync(__filename)),wikipediaWrites:0,networkRequests:0};
}catch(error){report={...report,status:'failed',replacementChecks:checks,controls,controlFailures,error:error.message,historicalOriginalSuiteStatusesRewritten:false,wikipediaWrites:0,networkRequests:0};if(process.env.REVISAWIKI_QUALIFICATION_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_QUALIFICATION_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});throw error;}
if(process.env.REVISAWIKI_QUALIFICATION_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_QUALIFICATION_RECEIPT,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({kind:report.kind,status:report.status,historicalAssertions:report.historicalAssertions,historicalAssertionsPassingUnchanged:report.historicalAssertionsPassingUnchanged,qualifiedDifferences:report.qualifiedHistoricalDifferences.length,replacementChecks:report.replacementChecks,controls:controls.length}));

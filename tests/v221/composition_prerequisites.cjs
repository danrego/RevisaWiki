'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={kind:'exact-reference-attribute-and-empty-collector-prerequisites',status:'passed',bundles:[],cases:[],checks:0,networkRequests:0,wikipediaWrites:0};
for(const supplied of process.argv.slice(2)){
 const file=path.resolve(supplied),raw=fs.readFileSync(file),api=require(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Controle de integração',calendarUTC:'2026-10-22'};
 report.bundles.push({file:path.basename(file),sha256:sha(raw),version:api.version});
 function check(id,source,expected,options={}){
  const settings={...cfg,...options},plan=api.v221IntegrationPrerequisitePlan(source,settings);
  assert.equal(plan.text,expected,id);report.checks++;
  assert.equal(api.v221IntegrationPrerequisiteProof(source,expected,plan,settings),true,id+' fresh exact-source proof');report.checks++;
  assert.equal(api.v221IntegrationPrerequisiteProof(source+'x',expected,plan,settings),false,id+' altered source rejected');report.checks++;
  assert.equal(api.v221IntegrationPrerequisiteProof(source,expected+'x',plan,settings),false,id+' altered target rejected');report.checks++;
  const result=api.calculate({kind:'adjust',source,options:settings}),gate=api.v219AutomaticResultSafety(source,result);
  assert.equal(gate.accepted,true,id+' final authoritative gate');report.checks++;
  assert.equal(api.v219AutomaticResultSafety(source,{...result,text:result.text+'\n<ref name="forged">Outra fonte.</ref>'}).accepted,false,id+' forged result rejected');report.checks++;
  report.cases.push({id,bundle:path.basename(file),sourceSha256:sha(source),outputSha256:sha(result.text),status:'passed'});
 }
 check('INT01','Texto.<ref name=fonte>[https://example.org Título]</ref>\nOutro.<ref>{{Citar web|url=https://example.org/outro|titulo=Outro|lingua=it}}</ref>\n{{Referências}}',
 'Texto.<ref name="fonte">[https://example.org Título]</ref>\nOutro.<ref>{{Citar web|url=https://example.org/outro|titulo=Outro|lingua=it}}</ref>\n{{Referências}}');
 check('INT02','Texto.<ref>Fonte.</ref>\n{{Referências|www.example.org=}}','Texto.<ref>Fonte.</ref>\n{{Referências}}');
 check('INT03','Texto.<ref name=http://example.org>[https://example.org Fonte]</ref>\n<ref name=http://example.org/>\n{{Referências}}',
 'Texto.<ref name="http://example.org">[https://example.org Fonte]</ref>\n<ref name="http://example.org"/>\n{{Referências}}');
 for(const tag of ['nowiki','syntaxhighlight','source','pre','code']){
  const source='<'+tag+'>Texto.<ref name=a>Fonte.</ref>\n{{Referências|campo_vazio=}}</'+tag+'>';
  check('protected-'+tag,source,source,{endMatter:false});
 }
 for(const args of ['|refs=','|grupo=','|1=','|url=valor','|desconhecido={{Modelo}}','|desconhecido=<!-- preservar -->']){
  const source='Texto.\n{{Referências'+args+'}}';check('preserved-collector-'+args,source,source,{endMatter:false});
 }
 for(const [id,source]of [
  ['collector-in-wikilink','[[Artigo|{{Referências|campo=}}]]'],
  ['collector-in-external-link','[https://example.org/{{Referências|campo=}} rótulo]'],
  ['collector-in-reference','<ref>{{Referências|campo=}}</ref>'],
  ['collector-in-html','<div>{{Referências|campo=}}</div>'],
  ['collector-in-html-attribute','<div title="{{Referências|campo=}}">Texto</div>'],
  ['collector-in-table','{| class="wikitable"\n| {{Referências|campo=}}\n|}'],
  ['collector-in-unknown-template','{{Outro|campo={{Referências|campo=}}}}'],
  ['collector-in-quoted-example','Texto "{{Referências|campo=}}".']
 ]){
  const settings={...cfg,endMatter:false},plan=api.v221IntegrationPrerequisitePlan(source,settings);
  assert.equal(plan.text,source,id+' prerequisite respects its owner');report.checks++;
  assert.equal(plan.edits.length,0,id+' no new prerequisite edit');report.checks++;
  assert.equal(api.v221IntegrationPrerequisiteProof(source,source,plan,settings),true,id+' exact preservation proof');report.checks++;
  report.cases.push({id,bundle:path.basename(file),status:'passed-rule-boundary',sourceSha256:sha(source),
   proofScope:'New prerequisite only; unrelated inherited normalizations are not credited as unchanged whole output.'});
 }
 for(const [id,options]of [['references-off',{references:false}],['markup-off',{markup:false}],['talk',{namespaceNumber:1}],['partial',{sectionOnly:true}],['nonwikitext',{contentModel:'javascript'}]]){
  const source='Texto.<ref name=a>Fonte.</ref>\n{{Referências|campo=}}';
  const plan=api.v221IntegrationPrerequisitePlan(source,{...cfg,...options});assert.equal(plan.text,source,id);report.checks++;
 }
 for(const tag of ['small','span','font','em']){
  const source='{{Info/Biografia|nome=Pessoa fictícia|notas=<'+tag+'>Texto.}}\n\nTexto.<ref name=fonte>Fonte.</ref>\n{{Referências|campo=}}';
  const plan=api.v221IntegrationPrerequisitePlan(source,cfg);
  assert.equal(plan.text,source,'opaque-tail-'+tag+' is byte-exact');report.checks++;
  assert.equal(plan.edits.length,0,'opaque-tail-'+tag+' has no prerequisite transaction');report.checks++;
  report.cases.push({id:'opaque-tail-'+tag,bundle:path.basename(file),status:'passed-rule-boundary',sourceSha256:sha(source)});
 }
 assert.equal(sha(fs.readFileSync(file)),sha(raw),'runtime unchanged');report.checks++;
}
assert(report.bundles.length);console.log(JSON.stringify(report,null,2));

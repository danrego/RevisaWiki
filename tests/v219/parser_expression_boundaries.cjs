'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const aliases=['#若表达式:','#若表達式:','#nếucôngthức:','#alsexpressie:','#لوتعبير:','#חשב תנאי:','#omutr:','#omuttrykk:','#omuttr:','#nếu_công_thức:','#якщовираз:','#seespr:','#만약계산:','#もし式:'];
const report={kind:'finite-parser-expression-and-fullwidth-delimiter-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),nativeContract:'tests/v219/native_parser_call_contract.json',foreignSwitchContract:'tests/v219/magic_switch_contract.json',catalogBindings:[],bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0};
const eq=(a,b,m)=>{report.checks++;assert.deepEqual(a,b,m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false},calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}});
 report.bundles.push({bundle,runtimeSha256:sha(bytes),bytes:bytes.length,version:api.version,helperInjection:false});
 const action=(id,source,expected)=>test(bundle,id,()=>{eq(calc(source).text,expected,'Only the independently mapped parser name or delimiter changes; all expression and branch bytes are retained');eq(calc(expected).text,expected,'The complete action is stable');});
 for(const alias of aliases){const record=api.translationRules.magicAliases[alias];test(bundle,'bound-'+sha(alias).slice(0,12),()=>{ok(record,'The exact foreign alias is declared');eq(record.target.replace(/:$/,''),'#ifexpr','The source-pinned native destination is the expected expression function');});report.catalogBindings.push({alias,bundle,recordSha256:sha(JSON.stringify(record))});
  for(const expression of ['2>1','2<1','2>=1','2<=1','2!=1','(2+3)*4>5','2e3>1']){const source='{{'+alias+expression+'|Texto verdadeiro|Texto falso}}',expected='{{#ifexpr:'+expression+'|Texto verdadeiro|Texto falso}}';action('expression-'+sha(source).slice(0,16),source,expected);test(bundle,'native-'+sha(expected).slice(0,16),()=>{ok(api.v219NativeParserCall(expected),'The documented numeric comparison is an actual native expression call');ok(api.v219RegisteredForeignParserCall(source),'The exact foreign identity delegates only to that proved native shape');});}
  const source='{{'+alias+'2>1|Texto verdadeiro|Texto falso}}';
  for(const [kind,wrap]of [['unknown-owner',x=>'{{Modelo fictício|1='+x+'}}'],['quote',x=>'"'+x+'"'],['italic',x=>"''"+x+"''"],['nowiki',x=>'<nowiki>'+x+'</nowiki>'],['fence',x=>'Exemplo de código:\n```wikitext\n'+x+'\n```\nFim.']])action('protected-'+kind+'-'+sha(alias).slice(0,12),wrap(source),wrap(source));
  for(const extra of [{multilingual:false},{auxiliaryTemplates:false}])test(bundle,'option-'+sha(alias+JSON.stringify(extra)).slice(0,12),()=>eq(calc(source,extra).text,source,'The declared multilingual parser adapter is explicitly optional'));
  for(const expression of ['2<ref>1','2>{{Modelo fictício}}','{{{valor}}}>1','2>\n1']){const source='{{'+alias+expression+'|Texto verdadeiro|Texto falso}}';action('ambiguous-'+sha(source).slice(0,16),source,source);}
 }
 for(const [source,expected]of [['{{デフォルトソート：Chave literal}}','{{ORDENACAOPADRAO:Chave literal}}'],['{{デフォルトソート： Chave literal }}','{{ORDENACAOPADRAO: Chave literal }}']])action('fullwidth-'+sha(source).slice(0,16),source,expected);
 for(const left of ['',' ','\t','\n'])for(const right of ['',' ','\t','\n']){
  const source='{{'+left+'デフォルトソート： Chave literal'+right+'}}',expected='{{'+left+'ORDENACAOPADRAO: Chave literal'+right+'}}';
  action('sort-padding-'+sha(source).slice(0,16),source,expected);
  action('native-sort-padding-'+sha(source).slice(0,16),expected,expected);
 }
 const switches={
  '＿＿目次強制＿＿':'__FORCARTDC__','＿＿インデックス＿＿':'__INDEXAR__','＿＿セクション編集非表示＿＿':'__NÃOEDITARSEÇÃO__',
  '＿＿インデックス拒否＿＿':'__NAOINDEXAR__','＿＿目次非表示＿＿':'__SEMTDC__','＿＿二重転送解消無効＿＿':'__REDIRECIONAMENTOESTATICO__',
  '＿＿二重転送修正無効＿＿':'__REDIRECIONAMENTOESTATICO__','＿＿目次＿＿':'__TDC__'
 };
 for(const [source,expected]of Object.entries(switches)){
  action('bare-fullwidth-switch-'+sha(source).slice(0,16),source,expected);
  action('native-switch-stable-'+sha(source).slice(0,16),expected,expected);
  for(const [kind,wrap]of [['attribute',x=>'<span data-exemplo="prefixo'+x+'sufixo">Texto</span>'],['braces',x=>'{{'+x+'}}'],['unknown-owner',x=>'{{Modelo fictício|1='+x+'}}'],['quote',x=>'"'+x+'"'],['italic',x=>"''"+x+"''"],['nowiki',x=>'<nowiki>'+x+'</nowiki>'],['fence',x=>'Exemplo de código:\n```wikitext\n'+x+'\n```\nFim.']])action('bare-switch-protected-'+kind+'-'+sha(source).slice(0,12),wrap(source),wrap(source));
 }
 for(const source of ['{{#ifexpr:<ref>1</ref>|sim|não}}','{{#ifexpr:{{{valor}}}>1|sim|não}}','{{#ifexpr>2:1|sim|não}}','{{Modelo fictício|expressão=#若表达式:2>1}}','{{デフォルトソートX：Chave literal}}','{{デフォルトソート：{{{chave}}}}}'])action('non-call-or-ambiguous-'+sha(source).slice(0,16),source,source);
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

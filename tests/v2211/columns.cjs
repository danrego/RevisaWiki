'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(root,'tests/expected_release_v2211.json'))),rows=[];
const heads=['Ligações externas','Bibliografia','Leitura adicional','Leitura complementar','Bibliografia complementar','Bibliografia adicional','Leituras complementares'];
let checks=0,calculations=0,baselineCalculations=0;function eq(a,b,m){assert.deepEqual(a,b,m);checks++;}
const listed=n=>Array.from({length:n},(_,i)=>'* Item '+(i+1)).join('\n'),wrap=(h,b)=>'Texto introdutório.\n\n== '+h+' ==\n'+b+'\n',columns=s=>/\{\{(?:Div col\|colunas=2|Colunas-lista\|)/.test(s);
for(const suffix of['','_completo']){
 const file=path.join(root,'dist/2.21.1/RevisaWiki_v2_21_1'+suffix+'.js'),bytes=fs.readFileSync(file),api=require(file),base=require(path.join(root,'dist/2.21.0/RevisaWiki_v2_21_0'+suffix+'.js')),cfg={namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo de listas',v216CalendarUTC:'2026-10-25',autoPreview:false,registryDoiCheck:false};
 eq(sha(bytes),manifest.files[path.basename(file)].sha256,'Unmodified target distribution');eq(api.version,'2.21.1','Current actual API version');eq(api.referenceColumnMinimum,base.referenceColumnMinimum,'Reference constant unchanged');
 function baselineCalculate(job){baselineCalculations++;return base.calculate(job);}
 function calculate(source,options={}){calculations++;return api.calculate({kind:'adjust',source,originalSource:source,options:{...cfg,...options}});}
 function test(id,source,verify,options={},stable=true){const result=calculate(source,options);try{verify(result.text,result);}catch(e){console.error('FAILED_CASE '+id);e.message=id+' '+e.message;throw e;}eq(api.v219AutomaticResultSafety(source,result).accepted,true,id+' final safety');if(stable)eq(calculate(result.text,options).text,result.text,id+' idempotence');rows.push({id: id+suffix,sourceSha256:sha(source),outputSha256:sha(result.text)});}
 for(const h of heads)for(const count of Array.from({length:13},(_,i)=>i))for(const eol of['\n','\r\n']){
  const source=wrap(h,listed(count)).replace(/\n/g,eol);test('plain-'+h+'-'+count+'-'+eol.length,source,text=>{eq(columns(text),count>=8,'Eight actual root items required');for(let i=1;i<=count;i++)eq((text.match(new RegExp('Item '+i+'(?=\\r?\\n|$)','g'))||[]).length,1,'Every list item remains once');if(count<8)eq(text,baselineCalculate({kind:'adjust',source,originalSource:source,options:{...cfg,endMatterColumns:false}}).text,'Short list inherits all other base rules');});
 }
 for(const h of heads)for(const count of Array.from({length:10},(_,i)=>i+1))for(const kind of['list','div'])for(const eol of['\n','\r\n']){
  const body='\n'+listed(count)+'\n',call=kind==='list'?'{{Colunas-lista|2|2='+body+'}}':'{{Div col|colunas=2}}'+body+'{{Div col fim}}',source=wrap(h,call).replace(/\n/g,eol);
  test('existing-'+h+'-'+kind+'-'+count+'-'+eol.length,source,text=>{eq(columns(text),count>=8,'Only short simple layout removed');for(let i=1;i<=count;i++)eq(text.includes('* Item '+i+(i===count?'':eol)),true,'Body text retained');if(count>=8)eq(text,baselineCalculate({kind:'adjust',source,originalSource:source,options:{...cfg,endMatterColumns:false}}).text,'Existing eight-item layout follows unchanged base formatting');});
 }
 for(const h of heads)for(const prefix of['**','*#','*:','*;'])for(const count of[1,2,7,8]){
  let body=listed(count)+'\n'+Array.from({length:9},(_,i)=>prefix+' Subitem '+i).join('\n');const source=wrap(h,body);
  test('descendants-'+h+'-'+prefix+'-'+count,source,text=>{if(count<8)eq(columns(text),false,'Descendants never count as roots');else if(['Bibliografia complementar','Bibliografia adicional','Leituras complementares'].includes(h))eq(text,source,'Complex extra-heading list remains conservative');else eq(columns(text),true,'Eight real roots retain descendants in main roles');eq(text.includes(prefix+' Subitem 8'),true,'Descendant bytes retained');});
 }
 for(const h of heads){
  const one=wrap(h,'* Um [https://example.invalid/a A] [https://example.invalid/b B]\n* Dois\n* Três\n* Quatro\n* Cinco\n* Seis\n* Sete');test('links-not-items-'+h,one,text=>eq(columns(text),false,'Links are not list entries'));
  const nested=wrap(h,'* {{Exemplo|campo=\n* Falso1\n* Falso2\n* Falso3\n* Falso4\n* Falso5\n* Falso6\n}}\n* Segundo');test('template-rows-'+h,nested,text=>eq(columns(text),false,'Template argument stars not roots'));
 }
 const short='\n* Um\n* Dois\n';
 const unsafe=[
  '{{Colunas-lista|2|2='+short+'|estilo=}}','{{Colunas-lista|2|2='+short+'|pequeno=sim}}','{{Colunas-lista|2|2='+short+'|1=2}}','{{Colunas-lista|2|2='+short+'|2=}}',
  '{{Colunas-lista|{{Número}}|2='+short+'}}','{{Colunas-lista|2|'+short+'}}','{{COLUNAS-LISTA|2|2='+short+'}}','{{Colunas-lista|\u00a01=2|2='+short+'}}','{{Colunas-lista|1=2\u00a0|2='+short+'}}',
  '{{Colunas-lista|2|2=\n* Um<ref>Fonte</ref>\n* Dois\n}}','{{Colunas-lista|2|2=\n* {{Citar web|título=Uma fonte|url=https://example.invalid}}\n* Dois\n}}','{{Colunas-lista|2|2=\n* Um\nProsa\n* Dois\n}}',
  '{{Div col|colunas=2|estilo=}}'+short+'{{Div col fim}}','{{Div col|colunas\u00a0=2}}'+short+'{{Div col fim}}','{{Div col|colunas=2\u00a0}}'+short+'{{Div col fim}}',
  '{{Div col|colunas=2}}\n* Um<ref group="nota">Nota</ref>\n* Dois\n{{Div col fim}}'
 ];
 for(const [i,call]of unsafe.entries()){
  if(i===12||i===13)continue;
  const source=wrap('Ligações externas',call);test('custom-or-uncertain-'+i,source,text=>{eq(/\{\{[ \t]*(?:colunas-lista|div col)\b/i.test(text),true,'Complex or ambiguous wrapper remains present');eq(text,baselineCalculate({kind:'adjust',source,originalSource:source,options:{...cfg,endMatterColumns:false}}).text,'Unsupported layout matches inherited nonlayout repairs');}, {},false);
 }
 for(const i of[12,13]){
  const source=wrap('Ligações externas',unsafe[i]),inherited=baselineCalculate({kind:'adjust',source,originalSource:source,options:{...cfg,endMatterColumns:false}});
  eq(inherited.text,wrap('Ligações externas','{{Div col|colunas=2}}'+short+'{{Div col fim}}'),'Existing normalizer first produces exact native layout call');
  test('prior-normalizer-then-layout-'+i,source,text=>{eq(columns(text),false,'Verified earlier correction composes with short-list cleanup');eq(text.includes(short),true,'Complete list body preserved');});
 }
 for(const option of[{endMatterColumns:false},{endMatter:false},{sectionOnly:true},{discussionPage:true},{namespaceNumber:10}]){
  const source=wrap('Ligações externas',listed(7)),old=baselineCalculate({kind:'adjust',source,originalSource:source,options:{...cfg,...option}});test('option-'+Object.keys(option)[0],source,text=>{eq(columns(text),false,'No new columns for seven entries');if(!('namespaceNumber'in option)&&!('discussionPage'in option))eq(text,old.text,'Explicitly disabled layout follows base');},option);
  const existing=wrap('Ligações externas','{{Colunas-lista|2|2='+short+'}}');test('option-existing-'+Object.keys(option)[0],existing,text=>eq(columns(text),true,'Excluded context keeps wrapper'),option);
 }
 for(const tag of['nowiki','pre','syntaxhighlight','source','code']){
  const source='<'+tag+'>\n'+wrap('Ligações externas',listed(8))+'\n</'+tag+'>';test('protected-'+tag,source,text=>eq(text,source,'Literal examples are exact'));
 }
 const suggCfg={...api.defaults,...cfg,review:true,externalLinkColumns:true,endMatter:true};
 for(const n of[2,6,7,8,9])eq(api.externalColumnsSuggestions(wrap('Ligações externas',listed(n)),suggCfg).length,n<8?0:1,'Suggestion boundary uses eight');
 for(const n of[1,9,10,11,20]){
  const source=Array.from({length:n},(_,i)=>'Texto.<ref name="f'+i+'">Fonte '+i+'.</ref>').join('\n')+'\n\n{{Referências}}\n',old=baselineCalculate({kind:'adjust',source,originalSource:source,options:cfg});test('references-unchanged-'+n,source,text=>eq(text,old.text,'Current reference behavior exactly inherited'));
 }
 const both=wrap('Ligações externas','{{Colunas-lista|2|2='+short+'}}')+'\n== Bibliografia ==\n{{Colunas-lista|2|2='+short+'}}\n';test('two-short-sections',both,(text,result)=>{eq(columns(text),false,'Both short lists cleaned');eq(result.changes.find(x=>x.id==='endMatterColumns')?.count,2,'Each list change counted');});
 const prefix=('Texto com fórmula <math>E=mc^2</math> e unidade 10 km.\n\n').repeat(2600);
 for(const n of[7,8]){const source=prefix+'== Ligações externas ==\n'+listed(n)+'\n';test('large-math-'+n,source,text=>{eq(text.startsWith(prefix),true,'Large formula and unit prefix exact');eq(columns(text),n>=8,'Large source boundary');}, {},false);}
 eq(sha(fs.readFileSync(file)),sha(bytes),'Target distribution unchanged by tests');
}
process.stdout.write(JSON.stringify({kind:'current-unmodified-column-threshold-regression',version:'2.21.1',status:'passed',runtimeManifestSha256:sha(fs.readFileSync(path.join(root,'tests/expected_release_v2211.json'))),checks,actualCalculations:calculations,baselineCalculations,cases:rows.length,bundles:2,rows,wikipediaWrites:0})+'\n');

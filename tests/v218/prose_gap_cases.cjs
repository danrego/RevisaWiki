'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const cases=[];
for(const newline of ['\n','\r\n'])for(const spacer of ['',' ','\t','  \t '])for(const count of [3,4,8])for(const [left,right]of [
 ['Primeiro texto preservado.','Segundo texto preservado.'],['Primeiro texto preservado.','== Outra seção =='],['== Outra seção ==','Primeiro texto preservado.'],
 ['Texto com fonte.<ref name="a">{{citar web|url=https://example.test/fonte|título=Fonte literal}}</ref>','{{Referências}}'],
 ['Texto com fonte.<ref name="a">Fonte literal.</ref> Outra chamada.<ref name="a" />','{{Referências}}'],
 ['Texto preservado.','{{Portal3|Ciência|Tecnologia}}'],['Texto preservado.','{{Controle de autoridade}}'],['Texto preservado.','[[Categoria:Tema fictício]]']
]){const gap=newline+Array(count-1).fill(spacer+newline).join(''),source=left+gap+right,expected=left+newline+newline+right;cases.push({id:'safe-gap-'+cases.length,source,expected,operations:1});}
for(const [id,right]of [
 ['native-grouped-reference-list','{{Referências|grupo=n|colunas=2}}'],['native-notes-reference-list','{{Notas e referências}}'],
 ['native-multiline-reference-list','{{Referências\n|colunas=2\n}}'],['native-reference-tag','<references />'],['native-reference-group-tag','<references group="n" />'],
 ['native-portal-alias','{{Portal|Ciência}}'],['native-portal-explicit-slot','{{Portal3|1=Ciência|2=Tecnologia}}']
])cases.push({id,source:'Texto preservado.\n\n \n\n'+right,expected:'Texto preservado.\n\n'+right,operations:1,...(id==='native-reference-tag'?{pipelineExpected:'Texto preservado.\n\n{{Referências}}',pipelineOperations:2}:{})});
const gap='Primeiro texto preservado.\n\n \n\nSegundo texto preservado.';
const wrapped=[
 ['template',s=>'{{Modelo fictício|texto='+s+'}}'],['triple-default',s=>'{{{valor|'+s+'}}}'],['reference',s=>'<ref name="a">'+s+'</ref>\n{{Referências}}'],
 ['reference-collector',s=>'<references>'+s+'</references>'],['table',s=>'{| class="wikitable"\n| '+s+'\n|}'],['wikilink',s=>'[[Tema|'+s+']]'],
 ['external-link',s=>'[https://example.test/ '+s+']'],['comment',s=>'<!--'+s+'-->'],['quoted-text',s=>'"'+s+'"'],['italic-text',s=>"''"+s+"''"],
 ['gallery',s=>'<gallery>'+s+'</gallery>'],['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="text">'+s+'</syntaxhighlight>'],
 ['code',s=>'<code>'+s+'</code>'],['source',s=>'<source lang="text">'+s+'</source>'],['poetry',s=>'<poem>'+s+'</poem>'],['math',s=>'<math>'+s+'</math>'],
 ['blockquote',s=>'<blockquote>'+s+'</blockquote>'],['styled-html',s=>'<div style="white-space:pre-wrap">'+s+'</div>'],['inline-html',s=>'<span>'+s+'</span>'],
 ['inclusion',s=>'<noinclude>'+s+'</noinclude>'],['fence',s=>'```wikitext\n'+s+'\n```'],['unclosed-comment',s=>'<!--'+s],['unclosed-template',s=>'{{Modelo|'+s],['unclosed-html',s=>'<div>'+s]
];
for(const [id,wrap]of wrapped)cases.push({id:'protected-'+id,source:wrap(gap),operations:0});
for(const marker of [' texto indentado','\ttexto indentado','* item','# item',': resposta','; termo','| célula','! cabeçalho','{{Modelo fictício}}','----','<br />','</pre>'])for(const order of [false,true]){const source=order?'Texto preservado.\n\n \n\n'+marker:marker+'\n\n \n\nTexto preservado.';cases.push({id:'boundary-'+cases.length,source,operations:0});}
for(const right of [
 '{{Referências|campo_desconhecido=valor}}','{{Referências|refs={{Fonte fictícia}}}}','{{Portal3|{{Tema fictício}}}}','{{Portal3|Ciência|1=Tecnologia}}','{{Portal3|}}',
 '{{Controle de autoridade|campo=valor}}','{{Navbox|lista=Texto}}','{{Commonscat|Tema}}','{{Modelo fictício}}','<references group={{Grupo}} />',
 '<references>Fonte literal.</references>','{{Referências}} texto depois','{{Referências}}<!--comentário-->','{{Referências}} {{Portal3|Ciência}}'
])cases.push({id:'unproved-endmatter-'+cases.length,source:'Texto preservado.\n\n \n\n'+right,operations:0});
for(const source of [
 'Texto preservado.\n\nOutro texto.','Texto preservado.\n \nOutro texto.','Texto preservado.\n\t\nOutro texto.',
 'Texto preservado.\r\n\n \r\nOutro texto.','Texto preservado.\n\u00a0\n\nOutro texto.','\n\n \nTexto preservado.','Texto preservado.\n\n \n',
 'Primeiro texto.\n\n<!-- comentário preservado -->\n \n\nSegundo texto.','Primeiro texto.<!-- comentário preservado -->\n\n \n\nSegundo texto.',
 'Texto com {{Modelo fictício}} preservado.\n\n \n\nOutro texto.',
 'Texto antes.\n código antes\n\n \n\n código depois\nTexto depois.'
])cases.push({id:'ambiguous-or-existing-'+cases.length,source,operations:0});
cases.push({id:'two-independent-gaps',source:gap+'\n\n{{Modelo fictício|texto='+gap+'}}\n\n'+gap,expected:gap.replace('\n\n \n\n','\n\n')+'\n\n{{Modelo fictício|texto='+gap+'}}\n\n'+gap.replace('\n\n \n\n','\n\n'),operations:2});
module.exports={cases};
function run(){
 const args=process.argv.slice(2),helperOnly=args.includes('--helper-only'),files=args.filter(arg=>arg!=='--helper-only').map(file=>path.resolve(file));
 if(!files.length)files.push(...['RevisaWiki_v2_18_0.js','RevisaWiki_v2_18_0_completo.js'].map(name=>path.join(root,'dist/2.18.0',name)));
 const report={kind:'bounded-top-level-prose-gap-repairs',version:'2.18.0',status:'passed',helperOnly,runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
 const equal=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
 for(const file of files){
  const api=process.env.REVISAWIKI_PROSE_GAP_TEST_LOADER?require(path.resolve(process.env.REVISAWIKI_PROSE_GAP_TEST_LOADER))(file):require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',autoPreview:false,minorBaseConfirmed:true,registryDoiCheck:false,
   spelling:false,dates:false,portals:false,automaticTopicPortals:false,automaticBiographyPortals:false,authorityControl:false,referenceColumns:false,unifiedNotesReferences:false,multilingual:false,moveNamedRefs:false,automaticIdenticalReferences:false,citations:false,headings:false,endTemplateOrder:false,endSectionOrder:false,bareReferences:false};
  report.bundles.push({file:bundle,version:api.version,runtimeSha256:sha(fs.readFileSync(file)),injectedHelper:!!process.env.REVISAWIKI_PROSE_GAP_TEST_LOADER});
  const test=(id,fn)=>{report.cases++;try{fn();}catch(error){report.status='failed';report.failures.push({bundle,id,message:String(error.message).replaceAll(root,'<checkout>')});}};
  for(const item of cases)test(item.id,()=>{
   const expected=item.expected??item.source,plan=api.v218ProseGapPlan(item.source,cfg);
   equal(plan.text,expected,'The exact independently written spacing endpoint is reached');equal(plan.edits.length,item.operations,'Each independently located gap counts once');
   equal(api.v218ProseGapProof(item.source,expected,plan,cfg),true,'A freshly regenerated source-bound plan agrees');equal(api.v218ProseGapPlan(expected,cfg).edits,[],'No second action can change the result');
   equal(api.v218ProseGapProof(item.source+' ',expected,plan,cfg),false,'A stale source cannot borrow this proof');equal(api.v218ProseGapProof(item.source,expected+' ',{...plan,text:expected+' '},cfg),false,'Changed content cannot borrow a whitespace proof');
   for(const edit of plan.edits){equal(/^[\r\n \t]+$/.test(edit.proof.before),true,'Only ASCII blank source is removed');equal(/^(?:\r\n\r\n|\n\n)$/.test(edit.text),true,'Exactly one empty line remains');equal(edit.proof.minorSafe,true,'The source witness is formatting-only');}
   if(!helperOnly&&item.operations){const finalExpected=item.pipelineExpected??expected,actual=api.calculate({kind:'adjust',source:item.source,options:cfg});equal(actual.text,finalExpected,'The complete action reaches the independently written composed endpoint');equal(actual.preservation,[],'References and facts pass preservation');equal(api.safeComposition(item.source,finalExpected,cfg),'','Selective application accepts this exact composed endpoint');const count=api.v211RetainedAdjustments(item.source,finalExpected,[],cfg);equal(count.exact,true,'The retained adjustment count is exact');equal(count.count,item.pipelineOperations??item.operations,'Each gap and any established list migration count separately');equal(api.calculate({kind:'adjust',source:finalExpected,options:cfg}).text,finalExpected,'The full pipeline is idempotent');equal(actual.minorCheck.eligible,true,'A confirmed source-format-only change is minor');}
  });
  if(!helperOnly)test('production-default-spacing-and-native-reference-list-compose',()=>{
   const source='Texto preservado.\n\n \n\n<references />',expected='Texto preservado.\n\n{{Referências}}',defaults={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',autoPreview:false,minorBaseConfirmed:true,registryDoiCheck:false};
   const actual=api.calculate({kind:'adjust',source,options:defaults});equal(actual.text,expected,'Default repairs compose the spacing and established native-list migration');equal(actual.preservation,[],'Both default operations retain every reference and fact');equal(api.safeComposition(source,expected,defaults),'','The complete native collector transaction is selectable');const count=api.v211RetainedAdjustments(source,expected,[],defaults);equal(count.exact,true,'Both default operations have exact source witnesses');equal(count.count,2,'One gap and one list migration count as two adjustments');equal(api.calculate({kind:'adjust',source:expected,options:defaults}).text,expected,'Default migration and spacing finish in one action');equal(actual.minorCheck.eligible,true,'The combined default source-format changes are minor');
  });
  for(const override of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{namespaceNumber:undefined},{sectionOnly:true},{section:'1'},{discussionPage:true},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{model:'json'},{syntaxRepairs:false},{structuralRepairs:false},{markup:false},{automaticProseGaps:false}])test('disabled-scope-'+JSON.stringify(override),()=>equal(api.v218ProseGapPlan(gap,{...cfg,...override}).text,gap,'The original structural and namespace opt-outs remain effective'));
 }
 process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
}
if(require.main===module)run();

'use strict';
// Count only the retained source endpoints. No repair planner is replayed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:1,discussionPage:true,contentModel:'wikitext',pageTitle:'Discussão:Exemplo fictício'},rows=[];let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const tr=(page,rev=123)=>'{{Traduzido|cód_idioma=en|página='+page+'|oldid='+rev+'|data=1 de janeiro de 2020}}',native=(page,rev=123)=>'{{Traduzido|página='+page+'|cód_idioma=en|oldid='+rev+'|data=1 de janeiro de 2020}}';
const positive=[
 ['two-translation-field-orders',tr('Página A')+'\n'+tr('Página B'),native('Página A')+'\n'+native('Página B'),2],
 ['advance-replaced-with-native-header','{{AvançarDiscussão}}','{{PD}}\n{{Marca de projeto|?}}',3],
 ['oka-preserved-with-new-header','{{OKA}}','{{PD}}\n{{Marca de projeto|?}}\n{{OKA}}',2],
 ['fusion-preserved-with-new-header','{{Fusões a avaliar|Tema A|Tema B}}','{{PD}}\n{{Marca de projeto|?}}\n{{Fusões a avaliar|Tema A|Tema B}}',2],
 ['project-union-and-owner-review-removal','{{Marca de projeto|?|Ciência|?|rev=20100101}}\n{{Marca de projeto|?|Tecnologia|?|rev=20100101}}','{{PD}}\n{{Marca de projeto|?|Ciência|?|Tecnologia|?}}',4],
 ['project-union-without-invented-field-credit','{{Marca de projeto|2|Ciência|4}}\n{{Marca de projeto|2|Tecnologia|3}}','{{Marca de projeto|2|Ciência|4|Tecnologia|3}}',1],
 ['project-union-retains-quality-repair-credit','{{Marca de projeto|qualidade|Ciência|4}}\n{{Marca de projeto|?|Tecnologia|3}}','{{Marca de projeto|?|Ciência|4|Tecnologia|3}}',2],
 ['plain-pd-duplicate','{{PD}}\n{{PD}}','{{PD}}',1],
 ['pd-native-alias','{{pd}}','{{PD}}',1],
 ['native-header-order','{{PD}}\n'+native('Página A')+'\n{{Marca de projeto|?}}','{{PD}}\n{{Marca de projeto|?}}\n'+native('Página A'),1],
 ['repeated-family-order',native('Página A')+'\n'+native('Página B'),native('Página B')+'\n'+native('Página A'),1],
 ['header-only-gap','{{PD}}\n\nTexto.','{{PD}}\nTexto.',1],
 ['unchanged-source','{{PD}}\n{{Marca de projeto|?}}\nTexto.','{{PD}}\n{{Marca de projeto|?}}\nTexto.',0]
];
for(const[id,before,after,expected]of positive){const r=api.v2222TalkEndpointCount(before,after,cfg);eq(r?.exact,true,id+' exact endpoint classification');eq(r.count,expected,id+' independently specified retained operations');eq(r.events.reduce((n,e)=>n+e.count,0),expected,id+' event sum');eq(api.v2222TalkEndpointCount(before,after,cfg),r,id+' deterministic pure result');const job={kind:'final-count',source:after,originalSource:before,options:cfg},input=JSON.stringify(job),actual=api.calculate(job);eq(actual.text,after,id+' final-count never edits the accepted draft');eq(JSON.stringify(job),input,id+' request is untouched');eq(actual.retainedAdjustments.exact,true,id+' actual final-count endpoint is exact');eq(actual.retainedAdjustments.count,expected,id+' actual metadata preserves the independently specified count');eq(actual.retainedAdjustments.sourceHash,api.v2216LayoutHash(before),id+' source hash binding');eq(actual.retainedAdjustments.outputHash,api.v2216LayoutHash(after),id+' output hash binding');rows.push({id,status:'passed',beforeSha256:sha(before),afterSha256:sha(after),expected,actualPureCount:r.count,actualMetadataCount:actual.retainedAdjustments.count});}
const negative=[
 ['human-quality-conflict','{{Marca de projeto|2|Ciência|4}}\n{{Marca de projeto|3|Tecnologia|3}}','{{Marca de projeto|2|Ciência|4|Tecnologia|3}}'],
 ['project-importance-conflict','{{Marca de projeto|?|Ciência|2}}\n{{Marca de projeto|?|Ciência|3}}','{{Marca de projeto|?|Ciência|2}}'],
 ['new-project-not-an-existing-union','{{Marca de projeto|?|Ciência|?}}\n{{Marca de projeto|?|Tecnologia|?}}','{{Marca de projeto|?|Ciência|?|Tecnologia|?|História|?}}'],
 ['new-bot-not-in-the-source','{{Marca de projeto|?|Ciência|?}}\n{{Marca de projeto|?|Tecnologia|?}}','{{Marca de projeto|?|Ciência|?|Tecnologia|?|bot=sim}}'],
 ['conflicting-pd-configuration','{{PD|1=A}}\n{{PD|1=B}}','{{PD|1=A}}'],
 ['lost-translation',native('Página A')+'\n'+native('Página B'),native('Página A')],
 ['changed-translation-revision',tr('Página A')+'\n'+tr('Página B'),native('Página A')+'\n'+native('Página B',999)],
 ['changed-translation-date',tr('Página A'),native('Página A').replace('1 de janeiro de 2020','2 de janeiro de 2020')],
 ['changed-conversation','{{PD}}\nComentário humano.','{{PD}}\nOutro comentário.'],
 ['unrelated-body-gap','{{PD}}\nTexto.  Corpo.','{{PD}}\nTexto. Corpo.'],
 ['changed-literal-nowiki','<nowiki>{{PD}}</nowiki>','<nowiki>{{pd}}</nowiki>'],
 ['changed-comment','<!-- {{PD}} -->','<!-- {{pd}} -->'],
 ['lost-comment','{{PD}}<!-- comentário -->','{{PD}}'],
 ['ambiguous-repeated-translation',tr('Página A')+'\n'+tr('Página A'),native('Página A')+'\n'+native('Página A')]
];
for(const[id,before,after]of negative){eq(api.v2222TalkEndpointCount(before,after,cfg),null,id+' has no unsupported exact talk count');rows.push({id,status:'protected',beforeSha256:sha(before),afterSha256:sha(after)});}
for(const options of [{...cfg,namespaceNumber:0,discussionPage:false},{...cfg,contentModel:'javascript'}])eq(api.v2222TalkEndpointCount('{{pd}}','{{PD}}',options),null,'No talk classifier outside its declared context');
const report={suite:'pure-retained-discussion-endpoint-count',version:api.version,runtimeSha256:sha(fs.readFileSync(file)),status:'passed',cases:rows.length,checks,rows,repairPlannersReplayed:false,productSourcesChanged:false,networkRequests:0,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));

'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const a=require(process.env.REVISAWIKI_BUNDLE||path.resolve(__dirname,'../../dist/2.20.0/RevisaWiki_v2_20_0_completo.js'));
const base={...a.defaults,namespaceNumber:0,pageTitle:'Exemplo',authorityControl:false,autoPreview:false,automaticBiographyPortals:false,biographyPortal:false,automaticTopicPortals:false,alignInfoboxParameters:false};
let checks=0,cases=0;
const rows=[
 {id:'dois portais novos',source:'{{Info/Filme/Wikidata|nome=Exemplo}}\n\nExemplo.',options:{automaticTopicPortals:true},counts:{v220TopicPortals:2}},
 {id:'só um portal ausente',source:'{{Info/Filme/Wikidata|nome=Exemplo}}\n\nExemplo.\n\n{{Portal3|Cinema}}',options:{automaticTopicPortals:true},counts:{v220TopicPortals:1}},
 {id:'portais já presentes',source:'{{Info/Filme/Wikidata|nome=Exemplo}}\n\nExemplo.\n\n{{Portal3|Cinema|Entretenimento}}',options:{automaticTopicPortals:true},counts:{}},
 {id:'adição desligada',source:'{{Info/Filme/Wikidata|nome=Exemplo}}\n\nExemplo.',options:{automaticTopicPortals:false},counts:{}},
 {id:'dez posições já ocupadas',source:'{{Info/Filme/Wikidata|nome=Exemplo}}\n\nExemplo.\n\n{{Portal3|Física|Química|Biologia|Matemática|História|Geografia|Brasil|Portugal|Ciência|Tecnologia}}',options:{automaticTopicPortals:true},counts:{}},
 {id:'país já coberto pelo estado',source:'{{Info/Biografia|nome=Exemplo|nascimento_local=[[Brasil]]}}\n\nExemplo.\n\n{{Portal3|Biografias|São Paulo}}',options:{automaticBiographyPortals:true},counts:{}},
 {id:'imagem e dois campos novos',source:'{{Info/Cavalo nomeado|nome=Exemplo|imagem=[[File:Example.jpg|thumb|250px|Legenda]]}}\n\nExemplo.',counts:{v220InfoboxImage:3}},
 {id:'imagem e uma legenda nova',source:'{{Info/Cavalo nomeado|nome=Exemplo|imagem=[[File:Example.jpg|thumb|250px|Legenda]]|imagem_tamanho=250px}}\n\nExemplo.',counts:{v220InfoboxImage:2},retainedCount:null},
 {id:'só arquivo da imagem',source:'{{Info/Cavalo nomeado|nome=Exemplo|imagem=[[File:Example.jpg|thumb|250px|Legenda]]|imagem_tamanho=250px|legenda=Legenda}}\n\nExemplo.',counts:{v220InfoboxImage:1}},
 {id:'conflito da legenda preservado',source:'{{Info/Cavalo nomeado|nome=Exemplo|imagem=[[File:Example.jpg|thumb|250px|Legenda]]|legenda=Outra}}\n\nExemplo.',counts:{}},
 {id:'três nomes de campos',source:'{{Info/Político|nome=Exemplo|nome_completo=Nome Exemplo|antecessor2=[[Pessoa Exemplo]]|sucessor2=[[Outra Pessoa]]}}\n\nExemplo.',counts:{v220InfoboxField:3}},
 {id:'três opções independentes',source:'[[File:Example.jpg|semmdolura|75px]]\n[[File:Other.jpg|thumb|width250px|Legenda]]\n[[File:Third.jpg|thumb|vertical|Legenda]]',counts:{v220ImageOption:1,v220IgnoredImageOption:1}},
 {id:'exemplo protegido',source:'<nowiki>[[File:Example.jpg|semmdolura|75px]]</nowiki>',counts:{}}
];
for(const row of rows){const cfg={...base,...row.options},r=a.calculate({kind:'adjust',source:row.source,originalSource:row.source,options:cfg}),plan=a.v220BiographyPlan(row.source,cfg),actual=Object.fromEntries(r.changes.filter(x=>x.id.startsWith('v220')).map(x=>[x.id,x.count]));cases++;
 assert.deepEqual(actual,row.counts,row.id);checks++;
 assert(a.v219AutomaticResultSafety(row.source,r).accepted,row.id);checks++;
 const edits=plan.stages.flatMap(s=>s.edits),planned=edits.reduce((n,e)=>n+(e.count||1),0);assert.equal(planned,Object.values(row.counts).reduce((n,c)=>n+c,0),row.id);checks++;
 assert(edits.every(e=>e.ruleId&&e.proof.sourceHash),row.id);checks++;
 const expectedRetained=Object.hasOwn(row,'retainedCount')?row.retainedCount:Object.values(row.counts).reduce((n,c)=>n+c,0),retained=a.v219UIPresentationMetadata({source:r.text,originalSource:row.source,presentationKinds:['syntax'],options:cfg}).presentation.retained;
 assert.equal(retained.exact,expectedRetained!==null,row.id+' contagem do resultado mantido');checks++;
 assert.equal(retained.count,expectedRetained,row.id+' contagem exibida');checks++;
 assert.equal(a.v211RetainedAdjustments(row.source,row.source,['syntax'],cfg).count,0,row.id+' não soma histórico revertido');checks++;
 if(expectedRetained===null){assert.equal(retained.text,'Ajustes aplicados, confira a comparação');checks++;assert(!/\d/.test(a.summaryForTopics(retained.topics)),row.id+' resumo sem precisão falsa');checks++;}
 const again=a.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});assert.deepEqual(again.changes.filter(x=>x.id.startsWith('v220')),[],row.id+' não conta ajustes anteriores');checks++;
 assert.equal(again.text,r.text,row.id+' resultado final estável');checks++;
 if(edits.some(e=>e.count>1)){
  for(const bad of [0,1,99,'2',null]){const changed=structuredClone(plan),edit=changed.stages.flatMap(s=>s.edits).find(e=>e.count>1);edit.count=bad;assert.equal(a.v220BiographyProof(row.source,changed.text,changed,cfg),false,row.id+' rejeita contagem adulterada');checks++;}
 }
}
console.log(JSON.stringify({suite:'v220-bio-counts',cases,checks,status:'passed'}));

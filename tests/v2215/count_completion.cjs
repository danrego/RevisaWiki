'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const core=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Exemplo de teste',contentModel:'wikitext',autoPreview:false};let checks=0;
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);},clone=x=>structuredClone(x),raw=(s,t,k=[])=>api.v2215CompleteRetainedCount(s,t,api.v211RetainedAdjustments(s,t,k,cfg),k,cfg),finish=(s,t,r,k=[],o=cfg)=>api.v2215CompleteRetainedCount(s,t,r,k,o);
const a='{{Portal3|Biografias|Ciência}}',b='{{Controle de autoridade}}',box='{{Info/Biografia|nome=Pessoa de teste|ocupação=Físico}}';
const source=box+'\nTexto literal.\n'+a+'\n'+b+'\n',output=box.replace('Físico','físico')+'\nTexto literal.\n'+b+'\n'+a+'\n';
const kinds=['occupationCase','endTemplateOrder'];
const counted=raw(source,output,kinds);
eq(counted.exact,true,'A moved identical portal and an occupation have numeric witnesses');eq(counted.count,2,'One move and one changed value count twice');
eq(counted.events.filter(e=>e.kind==='template-move'||e.kind==='structural-relocation').length,1,'Unchanged portal slots are one movement');
eq(counted.events.some(e=>e.kind==='portal-slot'),false,'A moved unchanged slot is not a new portal');
eq(finish(source,output,counted,kinds).count,counted.count,'Completion is idempotent');
for(const e of counted.events){eq(e.sourceHash,counted.sourceHash,'Event belongs to the exact source');eq(e.outputHash,counted.outputHash,'Event belongs to the exact output');}
for(const[before,after,number]of[
 ['Texto\n== Notas ==\n{{Referências}}\n','Texto\n{{Referências}}\n',1],
 ['Texto\n== Referências ==\n{{Referências}}\n','Texto\n{{Referências}}\n',1],
 ['Texto.\n\n\n\n{{DEFAULTSORT:Exemplo}}\n','Texto.\n\n{{DEFAULTSORT:Exemplo}}\n',1],
 ['Texto.\n \nOutro parágrafo.','Texto.\n\nOutro parágrafo.',1],
 ['\n\nTexto literal.','Texto literal.',1]
]){
 const r=raw(before,after,['markup','headings']);eq(r.exact,true,'A certified removed heading or normalized gap has a complete count');eq(r.count,number,'A single original syntax component counts once');
 eq(new Set(r.events.map(e=>e.id)).size,r.events.length,'No duplicated count event');
}
// Exercise the completion interface with unresolved source-bound fragments.
function unresolved(before,after){const diff=api.v27RawDiff(before,after),pins=api.v211RetainedAdjustments(before,after,[],cfg);return{count:null,exact:false,events:[],topics:[],sourceHash:pins.sourceHash,outputHash:pins.outputHash,unit:'retained-syntax-component',coveredFragments:0,totalFragments:diff.length,unresolvedFragments:diff.length,unresolved:diff,text:'Ajustes aplicados, confira a comparação'};}
for(const[before,after]of[
 ['Texto\n== Notas ==\n{{Referências}}\n','Texto\n{{Referências}}\n'],
 ['Texto.\n\n\n\nFim.','Texto.\n\nFim.']
]){const base=unresolved(before,after),r=finish(before,after,base);eq(r.exact,true,'Only independently witnessed fragments become numeric');eq(r.count,1,'One proved original component');eq(r.unresolved.length,0,'Only the precisely witnessed unresolved fragment is cleared');
 const duplicate=clone(base);duplicate.unresolved.push(clone(base.unresolved[0]));duplicate.unresolvedFragments++;const d=finish(before,after,duplicate);eq(d.count,1,'Duplicated uncertainty never counts the same component twice');
 for(const delta of [{sourceHash:'stale'},{outputHash:'stale'},{events:[{sourceHash:'stale',outputHash:base.outputHash,sourceAnchors:[],outputAnchors:[],fragments:[]}]}]){const forged={...base,...delta};eq(finish(before,after,forged),forged,'Stale or malformed count evidence is not upgraded');}
 const forged=clone(base);forged.unresolved[0].before+='changed';eq(finish(before,after,forged),forged,'A fragment must match the actual source bytes');
}
for(const[before,after]of[
 ['<nowiki>\n== Referências ==\n{{Referências}}\n</nowiki>','<nowiki>\n{{Referências}}\n</nowiki>'],
 ['== Notas ==\nTexto editorial.','Texto editorial.'],
 ['Texto\n== Referências ==\nOutro conteúdo.','Texto\nOutro conteúdo.'],
 ['<pre>\n\n\n\nLiteral\n</pre>','<pre>\n\nLiteral\n</pre>'],
 ['{|\n| A\n\n\n\n| B\n|}','{|\n| A\n\n| B\n|}'],
 ['Texto.\n\n\n\nFim.','Outra coisa.\n\nFim.']
]){const ordinary=unresolved(before,after);eq(finish(before,after,ordinary),ordinary,'Unknown content, protected owners and unrelated changes stay unresolved');}
for(const options of [{...cfg,namespaceNumber:10},{...cfg,headings:false},{...cfg,automaticReferenceCollectorHeadings:false},{...cfg,references:false}]){
 const s='Texto\n== Referências ==\n{{Referências}}\n',t='Texto\n{{Referências}}\n',r=unresolved(s,t);eq(finish(s,t,r,[],options),r,'A disabled heading scope gives no extra witness');
}
const wsSource='Texto.\n\n\n\nFim.',wsOutput='Texto.\n\nFim.';
for(const options of [{...cfg,markup:false},{...cfg,automaticProseGaps:false}]){const r=unresolved(wsSource,wsOutput);eq(finish(wsSource,wsOutput,r,[],options),r,'Disabled whitespace repair gives no count witness');}
for(const[before,after]of[
 [a+'\nTexto.\n'+a+'\n'+b+'\n',b+'\n'+a+'\nTexto.\n'+a+'\n'],
 [source,output.replace('Ciência}}','Ciência|Brasil}}')],
 ['<nowiki>'+source+'</nowiki>','<nowiki>'+output+'</nowiki>']
]){const base=api.v211RetainedAdjustments(before,after,kinds,cfg);eq(finish(before,after,base,kinds),base,'Ambiguous duplicate, changed portal contents or literal examples receive no move witness');}
for(const options of [{...cfg,contentModel:'javascript'},{...cfg,sectionOnly:true}]){const s='Texto.\n\n\n\nFim.',t='Texto.\n\nFim.',r=unresolved(s,t);eq(finish(s,t,r,[],options),r,'Other models and partial contexts keep their existing count');}
const prefix='Texto literal preservado.\n'.repeat(9000),
 largeSource=prefix+box+'\nTexto literal.\n'+a+'\n\n'+b+'\n\n{{DEFAULTSORT:Exemplo}}\n',
 largeOutput=prefix+box.replace('Físico','físico')+'\nTexto literal.\n'+b+'\n'+a+'\n{{DEFAULTSORT:Exemplo}}\n';
eq(largeSource.length+largeOutput.length>400000,true,'The finite move proof is tested beyond the old combined length cutoff');
eq(api.v27RawDiff(largeSource,largeOutput).every(f=>f.precise===true),true,'The large case has precise native diff witnesses');
const largeCount=raw(largeSource,largeOutput,kinds);eq(largeCount.exact,true,'A large precisely witnessed move stays numeric');eq(largeCount.count,2,'Size does not turn one move into copied portal insertions');
const coarse=unresolved('Texto.\n\n\n\nFim.','Texto.\n\nFim.');coarse.unresolved[0].precise=false;
eq(finish('Texto.\n\n\n\nFim.','Texto.\n\nFim.',coarse),coarse,'Coarse unresolved evidence is never guessed into an exact count');
const draftCfg={...cfg,namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'};
const draftOrdinary=api.v211RetainedAdjustments(source,output,kinds,draftCfg),draftCount=api.v2215CompleteRetainedCount(source,output,draftOrdinary,kinds,draftCfg);
eq(draftCount.exact,true,'A bounded explicit wikitext draft receives the same exact count');eq(draftCount.count,2,'A bounded draft counts the move and occupation once each');
for(const options of [{...draftCfg,pageTitle:'Usuário:Conta de Teste/PU'},{...draftCfg,contentModel:'javascript'},{...draftCfg,contentModel:undefined}]){
 const r=unresolved(source,output);eq(finish(source,output,r,kinds,options),r,'Ordinary user pages and unconfirmed draft models keep their ordinary count');
}
const report={kind:'source-component-count-completion',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations:0,status:'passed',networkRequests:0,wikipediaWrites:0};console.log(JSON.stringify(report));

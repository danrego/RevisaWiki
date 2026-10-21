'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'caption-terminal-punctuation-preservation',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,id,message:error.message});}}
const captions=[
    'Um esquema do telescópio.','Uma imagem em [[infravermelho]].','O telescópio registra luz infravermelha.',
    'A linha azul passa pelo centro da figura.','Um esquema cuja linha azul passa pelo centro da figura.',
    'O esquema tem duas partes. A linha azul passa pelo centro da figura.','À esquerda, um esquema do telescópio.',
    'A figura, que tem duas partes, usa linhas azuis.','Um retrato do século XX.','O desenho foi publicado em 2001.',
    'Um arquivo chamado exemplo.svg.','Uma legenda com a abreviatura etc.','Uma legenda com Prof.','Uma legenda terminada em A.',
    'Texto com uma pausa...','Texto com uma pausa…','"O esquema tem duas partes."',"''O esquema tem duas partes.''",
    'O esquema tem duas partes.<ref>Fonte fictícia.</ref>','O esquema tem duas partes<ref>Fonte fictícia.</ref>.',
    'O esquema tem duas partes.<!--Comentário literal.-->','{{Pequeno|O esquema tem duas partes.}}',
    'O esquema tem duas partes.\nOutra frase completa.','Uma pergunta?','Uma exclamação!','Sem pontuação final',
    'Texto terminado em [[exemplo|rótulo]].','Texto terminado em {{Pequeno|rótulo}}.',
    'Texto terminado em 2001.','Uma legenda com um endereço https://example.org/.'
];
for(const file of files){
    const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:false});
    eq(typeof api.captionTerminalPeriods,'function','The actual production caption function is available');
    const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,
        referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,registryDoiCheck:false},
        calculate=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}});
    for(const prefix of ['Imagem','Ficheiro','Arquivo','File','Image'])for(const extension of ['png','jpg','jpeg','svg','gif','webp','tiff'])for(const caption of captions)test(bundle,'caption-'+sha(prefix+extension+caption).slice(0,20),()=>{
        const source='[['+prefix+':Figura fictícia.'+extension+'|thumb|'+caption+']]',events=[];
        eq(api.captionTerminalPeriods(source,cfg,id=>events.push(id)),source,'Fragments, complete sentences and ambiguous endings retain their exact punctuation');
        eq(events,[],'The retired cosmetic rule claims no applied correction');
        const result=calculate(source);ok(!result.changes.some(change=>change.id==='captionPeriods'),'The complete action reports no retired caption-period correction');
        const expectedCaption=caption;
        ok(result.text.includes('|'+expectedCaption+']]'),'The complete action retains caption punctuation and permits only the independently reviewed reference-position correction');
        eq(calculate(result.text).text,result.text,'The unchanged punctuation needs no later action');
        eq(api.preservationAudit(source,result.text,cfg),[],'The independent media/prose inventory retains the original caption');
    });
    for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'<pre>'+s+'</pre>',s=>'<code>'+s+'</code>',s=>'<!--'+s+'-->',
        s=>'"'+s+'"',s=>"''"+s+"''",s=>'{{Quotation|'+s+'}}',s=>'```wikitext\n'+s+'\n```'])test(bundle,'protected-'+sha(String(wrap)).slice(0,20),()=>{
        const source=wrap('[[File:Figura fictícia.png|thumb|O esquema tem duas partes.]]');
        eq(api.captionTerminalPeriods(source,cfg),source,'A literal example retains all bytes');
        eq(calculate(source).text,source,'The complete production action preserves the protected image example');
    });
    for(const source of ['[[File:Figura fictícia.png.|thumb|Legenda.]]','[[File:Figura fictícia.png|alt=Uma descrição.|link=Página fictícia.]]',
        '{{Info/Biografia|imagem=Figura fictícia.png|legenda=O esquema tem duas partes.}}',
        '[[File:Figura fictícia.png|thumb|Legenda sem fechamento.', '<gallery>\nFigura fictícia.png|O esquema tem duas partes.\n</gallery>',
        '<ref>[[File:Figura fictícia.png|thumb|O esquema tem duas partes.]]</ref>'])test(bundle,'other-context-'+sha(source).slice(0,20),()=>{
        eq(api.captionTerminalPeriods(source,cfg),source,'Filenames, options, infobox fields, galleries, references and incomplete syntax retain their exact punctuation');
    });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

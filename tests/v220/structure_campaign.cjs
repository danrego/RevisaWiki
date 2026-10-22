'use strict';
// Generated syntax states have independently written literal endpoints.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const files=process.argv.slice(2);if(!files.length)throw Error('Provide built bundle paths.');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),cases=[];
const add=(family,id,source,expected=source,options={},contract='finite independently declared endpoint')=>cases.push({family,id,source,expected,options,contract});
const colors=['black','silver','gray','white','maroon','red','purple','fuchsia','green','lime','olive','yellow','navy','blue','teal','aqua','orange','#abc','#aabbcc'];
const fields=[['align','text-align',['left','center','right','justify']],['valign','vertical-align',['top','middle','bottom','baseline']],['width','width',['1','50','100','9999','0%','30%','100%']],['bgcolor','background-color',colors]];
const css=(name,value)=>name==='width'&&!value.endsWith('%')?value+'px':value;
const table=(owner,attributes,content='Alfa')=>'{| class="wikitable"\n|-'+(owner==='row'?' '+attributes:'')+'\n|'+(owner==='cell'?' '+attributes:'')+' | '+content+'\n| Beta\n|}\n';
for(const owner of ['row','cell'])for(const [name,property,values]of fields)for(const value of values)for(const quote of ['"',"'",'']){
 const literal=name+'='+quote+value+quote,inline=property+':'+css(name,value)+';',eligible=owner==='cell'||['align','bgcolor'].includes(name);
 for(const styleOrder of ['before','after']){const attributes=styleOrder==='before'?'style="'+inline+'" '+literal:literal+' style="'+inline+'"',expected='style="'+inline+'"';add('redundant-table-property',owner+'-'+name+'-'+value+'-'+quote+'-'+styleOrder,table(owner,attributes),eligible?table(owner,expected):table(owner,attributes));}
 add('unchanged-css-priority',owner+'-'+name+'-'+value+'-'+quote,table(owner,literal));
 add('competing-inline-property',owner+'-'+name+'-'+value+'-'+quote,table(owner,'style="'+property+':inherit;" '+literal));
}
for(const owner of ['row','cell'])for(const name of ['align','valign','width','bgcolor'])for(const invalid of ['inherit','var(--value)','UNKNOWN','calc(50px)','', 'foo'])add('unproved-css-value',owner+'-'+name+'-'+invalid,table(owner,'style="'+({align:'text-align',valign:'vertical-align',width:'width',bgcolor:'background-color'}[name])+':'+invalid+';" '+name+'="'+invalid+'"'));
for(const owner of ['row','cell'])for(const alignment of ['left','center','right','justify'])for(const content of ['<div style="width:40px;">Alfa</div>','<span style="display:block;">Alfa</span>','[[Ficheiro:Exemplo.svg|miniatura|Legenda]]','* Alfa','__TOC__'])add('block-sensitive-alignment',owner+'-'+alignment+'-'+sha(content).slice(0,8),table(owner,'align="'+alignment+'"',content));
for(const extension of ['pdf','PDF','htm','html','asp','aspx'])for(const label of ['Título do documento','Documento de contrôle','Resumo de Águas']){
 const url='https://example.invalid/documento.'+extension;
 add('external-pipe-document',extension+'-'+label,'Consulte ['+url+'|'+label+'].\n','Consulte ['+url+' '+label+'].\n');
 add('external-newline-label',extension+'-'+label,'Consulte ['+url+'\n'+label+'].\n','Consulte ['+url+' '+label+'].\n');
 for(const suffix of ['?a=x|y','#fragmento|valor'])add('external-pipe-url-data',extension+'-'+label+'-'+suffix,'Consulte ['+url+suffix+' '+label+'].\n');
 add('external-oneword-label',extension+'-'+label,'Consulte ['+url+'|Documento].\n');
 add('external-finite-protocol',extension+'-'+label,'Consulte [hhttps://example.invalid/documento.'+extension+' '+label+'].\n','Consulte [https://example.invalid/documento.'+extension+' '+label+'].\n');
}
for(const name of ['classe 100','organização regional','espaço de Hilbert','modelo 123']){
 add('unique-internal-link',name,'Um [[tema completo]] antecede [['+name+'] no texto.\n','Um [[tema completo]] antecede [['+name+']] no texto.\n');
 add('ambiguous-internal-link',name,'O texto cita [['+name+'] e [[outro tema].\n');
 for(const quote of ['"',"''",'“']){const end=quote==='“'?'”':quote,s='O texto cita '+quote+'[['+name+']'+end+'.\n';add('quoted-internal-link',name+'-'+quote,s);}
}
for(const [bad,good]of [['espectativas','expectativas'],['estreiou','estreou']]){
 add('finite-portuguese-spelling',bad,'O texto usa '+bad+' nesta frase.\n','O texto usa '+good+' nesta frase.\n');
 for(const [kind,wrap]of [['quotes',s=>'"'+s+'"'],['italics',s=>"''"+s+"''"],['link',s=>'[['+s+']]'],['reference',s=>'<ref>'+s+'</ref>'],['unknown-model',s=>'{{Modelo de exemplo|texto='+s+'}}']]){
  const source='O texto usa '+wrap(bad)+'.\n';
  if(kind==='reference'){
   add('literal-spelling-owner',bad+'-'+kind,source+'\n{{Referências}}\n');
   add('missing-collector-composition',bad,source,'O texto usa '+wrap(bad)+'.\n\n{{Referências}}\n\n',{},'preserve every byte of the reference body; append the enabled native default collector at the article end');
   add('missing-collector-disabled',bad,source,source,{references:false},'references option disables automatic collector insertion; note text remains literal');
  }else add('literal-spelling-owner',bad+'-'+kind,source);
 }
}
for(const delimiter of ['**','*'])for(const [prefix,eligible]of [['O projeto usa ',true],['* ',true],['x ',delimiter==='*'],['base ',delimiter==='*'],['resultado = base ',false]]){
 const phrase=delimiter==='**'?'cabos ópticos':'Floresta Conectada',source=prefix+delimiter+phrase+delimiter+' no texto.\n',expected=eligible?prefix+(delimiter==='**'?"'''":"''")+phrase+(delimiter==='**'?"'''":"''")+' no texto.\n':source;
 add('markdown-boundary',delimiter+'-'+prefix,source,expected);
}
for(const source of ['resultado = x * y * z.\n','base * fator * produto.\n','resultado = base * fator * unidade.\n'])add('multiplication-not-markdown',sha(source).slice(0,8),source);
for(const eol of ['\n','\r\n'])for(const blank of [eol+eol+eol,eol+' \t'+eol+eol,eol+eol+eol+eol])for(const boundary of ['prose','collector','table','citation']){
 const before=boundary==='prose'?'Texto de controle.':boundary==='collector'?'{{Referências}}':boundary==='table'?'{| class="wikitable"'+eol+'| Alfa'+eol+'|}':'Uma frase com nota<ref>Uma nota explicativa.</ref>',after=boundary==='collector'?'== Ligações externas ==':'Outra frase de controle.',tail=boundary==='citation'?eol+'{{Referências}}'+eol:eol;
 const finalBody=boundary==='collector'?eol+'* [https://example.invalid/fonte Fonte externa]'+eol:tail;
 add('empty-line-boundary',boundary+'-'+sha(blank).slice(0,8)+'-'+eol.length,before+blank+after+finalBody,before+eol+eol+after+finalBody);
 if(boundary==='collector'){
  const source=before+blank+after+tail;
  add('empty-final-heading-composition','empty-'+sha(blank).slice(0,8)+'-'+eol.length,source,before+eol+eol,{},'remove a truly empty final external-links heading and normalize the remaining collector boundary');
  add('empty-final-heading-disabled','empty-'+sha(blank).slice(0,8)+'-'+eol.length,source,before+eol+eol+after+tail,{headings:false},'heading removal is disabled; empty-line cleanup remains enabled');
 }
}
for(const [id,source,expected]of require('./structure_fixtures.json').pairs.filter(r=>['coordinate','coordinate-named-before-positional','maintenance','navbox','bibliography'].includes(r[0]))){
 if(id==='bibliography'){
  add('existing-structural-composition',id,source,expected,{endMatterColumns:true},'six complete bibliography entries, explicit columns option enabled, two native columns');
  add('bibliography-columns-disabled',id,source,source,{endMatterColumns:false},'same six entries, columns option disabled, original list preserved');
 }else add('existing-structural-composition',id,source,expected);
}
const originals=cases.filter(r=>['redundant-table-property','external-pipe-document','unique-internal-link','markdown-boundary'].includes(r.family)).filter((_,i)=>i%23===0);
for(const item of originals)for(const [owner,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['blockquote',s=>'<blockquote>'+s+'</blockquote>'],['comment',s=>'<!--'+s+'-->'],['unknown-template',s=>'{{Modelo de exemplo|texto='+s+'}}']])add('protected-structural-owner',item.id+'-'+owner,wrap(item.source));
const unique=new Map();for(const c of cases){const key=sha(c.source+'\0'+c.expected+'\0'+JSON.stringify(c.options));if(!unique.has(key))unique.set(key,c);}const corpus=[...unique.values()];
const report={schemaVersion:1,runnerSha256:sha(fs.readFileSync(__filename)),kind:'structure-independent-combinatorial-campaign',status:'passed',caseCount:0,distinctScenarios:corpus.length,checks:0,bundles:[],families:{},failures:[],rows:[],helperInjection:false,networkRequests:0,wikipediaWrites:0};
for(const file of files){const api=require(path.resolve(file)),bundleSha256=sha(fs.readFileSync(file)),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Assunto de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,portals:false,tableAccessibility:false,referenceColumns:false,endMatterColumns:false,externalLinkColumns:false},check=(v,m)=>{report.checks++;assert.ok(v,m);};report.bundles.push({bundle:path.basename(file),sha256:bundleSha256});
 for(const item of corpus){const row={id:item.id,family:item.family,bundleSha256,sourceSha256:sha(item.source),expectedSha256:sha(item.expected),options:item.options,contract:item.contract,status:'passed'},options={...cfg,...item.options};try{const out=api.calculate({kind:'adjust',source:item.source,options});check(out.text===item.expected,'Independent exact endpoint mismatch: '+JSON.stringify({source:item.source,expected:item.expected,actual:out.text}));check(out.localCompositionSafety?.accepted!==false,'Production composition refused a control');check(api.calculate({kind:'adjust',source:out.text,options}).text===out.text,'Second action is not idempotent');row.ruleIds=out.changes.map(r=>r.id);}catch(e){row.status='failed';row.error=e.message;report.status='failed';report.failures.push(row);}report.rows.push(row);report.caseCount++;report.families[item.family]=(report.families[item.family]||0)+1;}
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

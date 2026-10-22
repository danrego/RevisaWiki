'use strict';
// Independently declared raw-owner cases. No article, editor or network data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const args=process.argv.slice(2),files=args.filter(a=>!a.startsWith('--')),planOnly=args.includes('--plan-only');if(!files.length)throw new Error('Provide built bundle paths.');
const suffix='\n\n{{Referências}}\n',cases=[],add=(id,source,expected=source,options={})=>cases.push({id,source,expected,options});
const quotePairs=[['«','»'],['“','”'],['"','"'],["'","'"],["''","''"],["'''","'''"],["'''''","'''''"],['„','“']];
const headers=['<ref>','<ref name="origem">',"<ref name='origem'>",'<REF NAME="origem">','<ref name=origem>','<ref name="origem" group="">'];
const wrappers=[['prose',s=>'Um fato. '+s],['table-cell',s=>'{| class="wikitable"\n| '+s+'\n|}'],['table-caption',s=>'{| class="wikitable"\n|+ '+s+'\n| Dados\n|}'],['image-caption',s=>'[[Ficheiro:Example.jpg|thumb|'+s+']]'],['infobox-field',s=>'{{Info/Biografia|nome=Pessoa fictícia|notas='+s+'}}'],['citation-field',s=>'{{Citar livro|titulo=Obra fictícia|notas='+s+'}}']];
for(const [left,right]of quotePairs)for(const header of headers)for(const [owner,wrap]of wrappers){
 const body='Fonte de controle '+left+'citada'+right+'.',ref=header+body+'</ref>';
 const variants=[
  ['quoted-opening',left+'uma passagem.'+ref+right],
  ['closed-quote-before',left+'uma passagem'+right+ref+' Mais '+left+'aspas'+right+'.'],
  ['crossed-opening',left+'uma passagem.'+header+'Fonte'+right+'</ref>'],
  ['nested-quote-citation',left+'uma passagem.'+header+'{{Citar web|titulo=Documento '+left+'citado'+right+'}}.</ref>'+right],
  ['quote-inside-citation',header+'{{Citar web|titulo='+left+'Título sem fechamento}}.</ref> Mais '+left+'texto'+right+'.'],
  ['comment-reference-body',header+'<!-- '+left+'comentário'+right+' -->Fonte de controle.</ref>']
 ];
 for(const [kind,s]of variants)add([owner,kind,cases.length].join('-'),wrap(s)+suffix);
}
// Cite preprocesses extension tags even inside ordinary HTML attributes.
// These are real raw owners, not examples to be erased by an HTML-tag reader.
for(const [left,right]of quotePairs)for(const header of headers)for(const tag of ['span','div','small']){
 const lead='<'+tag+' title="'+left+'prefixo '+header+'">';
 const tail='Texto '+left+'citado'+right+'.</'+tag+'></ref>';
 add('extension-in-attribute-'+cases.length,lead+tail+suffix);
 add('extension-in-attribute-mixed-orphan-'+cases.length,'Antes.</ref> '+lead+tail+suffix);
 add('extension-in-attribute-following-closer-'+cases.length,lead+tail+' Depois.</ref>'+suffix);
}
// A ref-like closer hidden in an attribute also invalidates absence proofs.
for(const header of headers)for(const closer of ['</ref>','</REF >','</ ref>','< /ref>'])for(const tag of ['span','div','small']){
 const partial=header+'Fonte.<'+tag+' title="'+closer+'">Texto.</'+tag+'>';
 add('extension-closer-in-attribute-'+cases.length,partial+'</ref>'+suffix);
 add('extension-closer-in-attribute-with-external-note-'+cases.length,partial+'<ref>Segunda fonte.</ref></ref>'+suffix);
 add('extension-closer-in-attribute-with-prior-orphan-'+cases.length,'Antes.</ref> '+partial+'</ref>'+suffix);
}
// Isolated closers are visible prose, even when another valid note is nearby.
for(const [left,right]of quotePairs)for(const header of headers){
 const valid=header+'Fonte de controle.</ref>';
 add('mixed-orphan-before-'+cases.length,'Texto.</ref> '+left+'citação '+header+'Fonte '+left+'interna'+right+'.</ref>'+right+suffix);
 add('mixed-simple-after-'+cases.length,'Texto.'+valid+' Outro.</ref>'+suffix);
 const mixed=left+'Texto '+header+'Fonte'+right+'</ref> Depois.';
 add('mixed-uncertain-after-'+cases.length,mixed+'</ref>'+suffix);
}
for(const [left,right]of quotePairs)for(const [label,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['code',s=>'<code>'+s+'</code>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],['comment',s=>'<!--'+s+'-->'],['pre',s=>'<pre>'+s+'</pre>']]){
 const sample=left+'Texto.<ref>Fonte '+left+'citada'+right+'.</ref>'+right;
 add('protected-'+label+'-'+cases.length,wrap(sample));
}
for(const flag of ['references','structuralRepairs','markup'])for(const s of ['Texto.</ref>'+suffix,'Texto.<ref name="a" <ref>Fonte.</ref>'+suffix])add('option-off-'+flag+'-'+cases.length,s,s,{[flag]:false});
for(const attrs of ['name="a" class="nota"','name="a" name="b"','name="{{Nome}}"','name="a','data-x="ref"']){
 const s='Texto.<ref '+attrs+'>Fonte.</ref></ref>'+suffix;add('ambiguous-attrs-'+cases.length,s);
}
// Unknown incomplete enclosing owners cannot establish a safe duplicate.
for(const prefix of ['{{Modelo incerto|texto=','{{{texto|',"<span title='",'<span data-raw=',"<section title='",'<div data-raw=','[[Destino|','[https://example.invalid/ ','{| class="wikitable"\n| '])for(const header of headers){
 add('incomplete-owner-'+cases.length,prefix+header+'Fonte literal.</ref></ref>'+suffix);
}
// Only byte-adjacent canonical duplicate closers of a valid complete note
// qualify. Every literal endpoint is declared before the public action runs.
for(const header of headers)for(const body of ['Fonte de controle.','[[Fonte fictícia]].','{{Citar web|titulo=Fonte de controle|url=https://example.invalid/fonte}}','{{Citar livro|titulo=Obra de controle|ano=2024}}','Fonte <small>adicional</small>.'])for(const extra of [1,2,3,5]){
 const valid='Texto.'+header+body+'</ref>';
 add('adjacent-complete-chain-'+cases.length,valid+'</ref>'.repeat(extra)+suffix,valid+suffix);
 for(const separator of [' ','\t','\n','<!-- separador -->'])add('nonadjacent-complete-'+cases.length,valid+separator+'</ref>'+suffix);
 add('noncanonical-chain-'+cases.length,valid+'</ref></REF>'+suffix);
}
for(const body of ['', ' ', '{{Modelo incerto}}','{{#if:1|Fonte}}','{{{texto}}}','<code>Exemplo</code>']){
 const s='Texto.<ref>'+body+'</ref></ref>'+suffix;add('uncertain-note-body-'+cases.length,s);
}
// This independent finite observer checks the declared reference endpoint, not
// the product's masked parser. Legacy quote normalization and new portal/footer
// work may change unrelated bytes in the complete default action.
function rawReferenceRecords(s){
 const tags=[],defs=[];for(const m of s.matchAll(/<ref\b([^<>]*)>([\s\S]*?)<\/ref\s*>/gi)){
  const attrs=[];let rest=m[1],last=0;const re=/\s+([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;let f;
  while((f=re.exec(rest))){if(rest.slice(last,f.index).trim())break;const key=f[1].toLowerCase(),value=f[2]??f[3]??f[4];if(key!=='group'||value!=='')attrs.push([key,value]);last=re.lastIndex;}
  defs.push([rest.slice(last).trim()?['literal',rest]:attrs,m[2]]);
 }
 for(const m of s.matchAll(/<\/ref\s*>/gi))tags.push('close');
 return{definitions:defs,closingTags:tags};
}
const uniqueCases=[...new Map(cases.map(r=>[JSON.stringify([r.source,r.expected,r.options]),r])).values()];
const report={kind:'raw-reference-ownership-combinatorial-campaign',runnerSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),status:'passed',checks:0,generatedCasesBeforeDeduplication:cases.length,plannedCasesPerBundle:uniqueCases.length,wholeAction:!planOnly,cases:[],failures:[],networkRequests:0,wikipediaWrites:0};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const file of files){const api=require(path.resolve(file)),base={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false},bundleSha256=sha(fs.readFileSync(file));
 for(const row of uniqueCases){const cfg={...base,...row.options},receipt={id:row.id,sourceSha256:sha(row.source),expectedSha256:sha(row.expected),bundleSha256,status:'passed'};
  const check=(value,message)=>{report.checks++;if(!value)throw new Error(message);};
  try{const p=api.v220CitationPlan(row.source,cfg);check(p.text===row.expected,'plan differs from literal endpoint');check(api.v220CitationPlanProof(row.source,row.expected,p,cfg),'plan proof refused');check(api.v220CitationPlan(row.expected,cfg).text===row.expected,'second plan differs');
   if(!planOnly){const actual=api.calculate({kind:'adjust',source:row.source,options:cfg});receipt.accepted=actual.localCompositionSafety?.accepted!==false;receipt.appliedSha256=sha(actual.text);receipt.fullLiteralEndpointEqual=actual.text===row.expected;
    check(JSON.stringify(rawReferenceRecords(actual.text))===JSON.stringify(rawReferenceRecords(row.expected)),'whole action changed declared raw reference ownership/body endpoint');
    if(row.id.startsWith('protected-'))check(actual.text===row.expected,'protected example changed');
    check(receipt.accepted,'whole action safety refused');check(api.calculate({kind:'adjust',source:actual.text,options:cfg}).text===actual.text,'whole action not idempotent');}
  }catch(e){receipt.status='failed';receipt.error=e.message;report.failures.push(receipt);}
  report.cases.push(receipt);
 }
}
report.fullLiteralEndpointEqualCases=report.cases.filter(r=>r.fullLiteralEndpointEqual===true).length;report.referenceEndpointEqualCases=report.cases.filter(r=>r.status==='passed').length;report.status=report.failures.length?'failed':'passed';process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;

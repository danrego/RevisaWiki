'use strict';
// This declarative matrix was written before expanding the boundary validator.
// Values and endpoints are prescribed from the finite legacy key contracts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const keys=[
 ['accessadoem','acessodata','2020-01-01','access'],['Autorlink','autorlink','Pessoa de controle','author-link'],
 ['Colecção','coleção','Coleção de controle','series'],['Editora','editora','Editora de controle','publisher'],
 ['Título','título','Obra de controle','title'],['Página','página','25','page'],
 ['Local de publicação','local-publicação','Cidade de controle','publication-place'],
 ['Subtítulo','subtítulo','Seção de controle','title-note'],['Edição','edição','2','edition'],
 ['ano','data','2020-01-01','complete-day'],['year','data','1 de janeiro de 2020','complete-day']
];
const cases=[],add=(id,source,expected,options={},extra={})=>cases.push({id,source,expected,options,...extra});
function call(key,value,{eol='\n',position='middle',pad='trailing'}={}){
 const raw=pad==='leading'?eol+value:pad==='both'?eol+value+eol:pad==='plain'?value:value+eol;
 const field='|'+key+'='+raw,other=key==='Título'?'|autor=Pessoa de controle':'|título=Obra de controle',end='|local=Cidade de controle';
 return '{{citar livro'+(position==='initial'?field+other+end:position==='final'?other+end+field:other+field+end)+'}}';
}
function rename(source,key,target){return source.replace('|'+key+'=','|'+target+'=');}
const owners=[
 ['opaque',x=>'{{Modelo incerto|texto='+x+'}}'],['argument',x=>'{{{texto|'+x+'}}}'],
 ['attribute-double',x=>'<span title="'+x+'">Texto</span>'],['attribute-single',x=>"<span title='"+x+"'>Texto</span>"],
 ['attribute-unquoted',x=>'<span data-raw='+x+'>Texto</span>'],['html-owner',x=>'<div>'+x+'</div>'],
 ['link-owner',x=>'[[Tema|'+x+']]'],['external-owner',x=>'[https://example.invalid '+x+']'],
 ['table-attribute',x=>'{| class="wikitable"\n| title="'+x+'" | Texto\n|}'],
 ['nowiki',x=>'<nowiki>'+x+'</nowiki>'],['comment',x=>'<!--'+x+'-->'],['pre',x=>'<pre>'+x+'</pre>'],
 ['quoted',x=>'"'+x+'"'],['code',x=>'<code>'+x+'</code>']
];
for(const[key,target,value,kind]of keys){
 const isYear=kind==='complete-day',options={dates:isYear,automaticCitationDateValues:false};
 for(const[eolName,eol]of[['lf','\n'],['crlf','\r\n']])for(const position of['initial','middle','final'])for(const pad of['plain','leading','trailing','both']){
  const source=call(key,value,{eol,position,pad});add(key+'-'+eolName+'-'+position+'-'+pad,source,rename(source,key,target),options,{key,target,kind,planExact:true});
 }
 const source=call(key,value),expected=rename(source,key,target);
 add(key+'-named-reference','Texto.<ref name="controle">'+source+'</ref>\n{{Referências}}','Texto.<ref name="controle">'+expected+'</ref>\n{{Referências}}',options,{key,target,planExact:true});
 add(key+'-complete-cell','{| class="wikitable"\n| '+source+'\n|}','{| class="wikitable"\n| '+expected+'\n|}',options,{key,target,planExact:true});
 for(const[eolName,eol]of[['lf','\n'],['crlf','\r\n']]){
  const other=key==='Título'?'|autor=Pessoa de controle':'|título=Obra de controle',raw='{{citar livro'+eol+other+eol+'|'+key+'='+value+eol+'|local=Cidade de controle'+eol+'}}',compact=rename(call(key,value,{pad:'plain'}),key,target);
  add(key+'-default-single-line-'+eolName,raw,compact,{...options,singleLineCitations:true},{key,target});
  const inlineLines=call(key,value,{eol,pad:'both'});add(key+'-inline-value-lines-default-'+eolName,inlineLines,rename(inlineLines,key,target),{...options,singleLineCitations:true},{key,target,planExact:true});
 }
 for(const[name,wrap]of owners){add(key+'-owner-'+name,wrap(source),wrap(source),options,{key,target,negative:true});add(key+'-owner-default-'+name,wrap(source),wrap(source),{...options,singleLineCitations:true},{key,target,negative:true});}
 for(const[option,disabled]of Object.entries({citations:false,automaticCitationKeyRepairs:false,automaticParameterNames:false}))add(key+'-off-'+option,source,source,{...options,[option]:disabled},{negative:true});
 if(isYear)add(key+'-off-dates',source,source,{...options,dates:false},{negative:true});
 for(const[name,raw]of[['internal-lf',value.length<2?value+'\ncontrole':value.slice(0,1)+'\n'+value.slice(1)],['internal-crlf',value.length<2?value+'\r\ncontrole':value.slice(0,1)+'\r\n'+value.slice(1)],['empty',' \n '],['dynamic','{{Valor incerto}}'],['html','<span>Valor</span>'],['raw-over-4096',' '.repeat(4096)+value]]){
  const s=call(key,raw);add(key+'-negative-'+name,s,s,options,{negative:true});
 }
 const collision=source.slice(0,-2)+'|'+target+'=Outro valor}}';add(key+'-alias-collision',collision,collision,options,{negative:true});
 if(kind==='author-link')for(const[name,v]of[['url','https://example.invalid/'],['fragment','Pessoa#Seção'],['link','[[Pessoa]]'],['length256','X'.repeat(256)]]){const s=call(key,v);add(key+'-author-'+name,s,s,options,{negative:true});}
 if(kind==='author-link'){const s=call(key,'X'.repeat(255));add(key+'-author-exact255',s,rename(s,key,target),options,{key,target,planExact:true});}
 if(isYear||['access','author-link'].includes(kind)){const v=value+' '.repeat(4095-value.length),s=call(key,v);add(key+'-valid-raw-exact4096',s,rename(s,key,target),options,{key,target,planExact:true});}
 if(isYear)for(const[name,v]of[['year-only','2020'],['ambiguous-numeric','01/02/2020'],['incomplete-month','janeiro de 2020'],['invalid-date','2020-02-30']]){const s=call(key,v);add(key+'-year-'+name,s,s,options,{negative:true});}
 if(!isYear&&!['access','author-link'].includes(kind)){
  const s=call(key,'X'.repeat(4095));add(key+'-raw-exact4096',s,rename(s,key,target),options,{key,target,planExact:true});
 }
}
// The ordinary citation formatter already trims page and edition scalar
// values. This independent field reader declares that separate old effect;
// the key-plan expectation below still retains every original value byte.
function legacyScalarExpected(source){
 const edits=[];
 for(const m of source.matchAll(/\|(?:Página|página|Edição|edição)=[ \t]*/g)){
  let end=m.index+m[0].length,depth=0;
  for(;end<source.length;end++){
   const two=source.slice(end,end+2);
   if(two==='{{'){depth++;end++;continue;}
   if(two==='}}'){if(!depth)break;depth--;end++;continue;}
   if(source[end]==='|'&&!depth)break;
  }
  const start=m.index+m[0].length,value=source.slice(start,end);edits.push({start,end,text:value.trim()});
 }
 for(const e of edits.reverse())source=source.slice(0,e.start)+e.text+source.slice(e.end);return source;
}
for(const c of cases){
 c.planExpected=c.expected;
 const oldScalar=/^(?:Página|Edição)-/.test(c.id),owner=/-owner-(?:default-)?([^ ]+)/.exec(c.id)?.[1],
  activeOwner=!owner||['html-owner','link-owner','external-owner'].includes(owner);
 if(oldScalar&&activeOwner&&c.options.citations!==false)c.expected=legacyScalarExpected(c.expected);
 if(/-owner-default-(?:html-owner|link-owner|external-owner)$/.test(c.id))c.expected=c.expected.replace(/\r?\n/g,'');
}
const spec={kind:'legacy-citation-key-boundary-family-declarative-matrix',rule:'The existing per-kind validator is applied to a boundary-trimmed validation copy only. Raw values, collisions, scope and native precision contracts remain unchanged.',keyKinds:keys.map(([key,target,value,kind])=>({key,target,kind})),cases};
if(process.argv.includes('--spec')){process.stdout.write(JSON.stringify(spec,null,2)+'\n');process.exit(0);}
const files=process.argv.slice(2);if(!files.length)throw Error('Provide built bundle paths.');
const report={kind:spec.kind,status:'passed',declarativeSpecSha256:sha(JSON.stringify(spec)),uniqueCases:cases.length,executions:0,checks:0,cases:[],failures:[],networkRequests:0,wikipediaWrites:0};
for(const file of files){const a=require(path.resolve(file)),runtimeSha256=sha(fs.readFileSync(file)),base={...a.defaults,namespaceNumber:0,pageTitle:'Obra de controle',contentModel:'wikitext',autoPreview:false,singleLineCitations:false,tableAccessibility:false,automaticBiographyPortals:false,automaticTopicPortals:false,authorityControl:false};
 for(const c of cases){const options={...base,...c.options},row={id:c.id,runtimeSha256,sourceSha256:sha(c.source),expectedEndpointSha256:sha(c.expected),optionsSha256:sha(JSON.stringify(options)),status:'passed'};report.executions++;
  try{const r=a.calculate({kind:'adjust',source:c.source,originalSource:c.source,options});row.actualEndpointSha256=sha(r.text);row.appliedIds=r.changes.map(x=>[x.id,x.count]);report.checks++;assert.equal(r.text,c.expected,'Declarative endpoint differs');report.checks++;assert.equal(a.calculate({kind:'adjust',source:r.text,originalSource:r.text,options}).text,c.expected,'Whole action is not idempotent');report.checks++;assert.notEqual(r.localCompositionSafety?.accepted,false,'Action was refused');
   if(c.planExact){const p=a.v218CitationKeyPlan(c.source,options);report.checks++;assert.equal(p.text,c.planExpected,'Key plan endpoint differs');report.checks++;assert.equal(a.v218CitationKeyProof(c.source,c.planExpected,p,options),true);for(const e of p.edits){report.checks++;assert.equal(c.source.slice(e.start,e.end),e.proof.sourceKey);report.checks++;assert.equal(e.text,e.proof.targetKey);}report.checks++;assert.equal(a.v218CitationKeyProof(c.source,c.planExpected+'X',p,options),false,'Key proof accepted additional content');}
  }catch(e){row.status='failed';row.error=e.message;report.failures.push(row);}report.cases.push(row);
 }
}
report.status=report.failures.length?'failed':'passed';process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;

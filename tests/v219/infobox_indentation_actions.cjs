'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(file=>path.resolve(file)),hash=value=>crypto.createHash('sha256').update(value).digest('hex'),canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value,descriptors=new Set();
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(name=>path.join(root,'dist/2.19.0',name)));
const report={schemaVersion:1,kind:'principal-infobox-indentation-whole-actions',status:'passed',runnerSha256:hash(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0,helperInjection:false},fixtures=[],add=(id,source,expected,extra={})=>fixtures.push({id,source,expected,extra}),box='{{Info/Biografia|nome=Pessoa fictícia}}',lead="'''Pessoa fictícia''' foi uma pesquisadora.",tail='\n\n== Biografia ==\nTexto preservado.\n',settings={markup:true,syntaxRepairs:true,structuralRepairs:true,infoboxes:true,automaticInfoboxOrder:true,pageTitle:'Pessoa fictícia'};
for(const indent of [' ','  ','        '])for(const prefix of ['','{{Ver desambig|Outro assunto}}\n','{{Mais fontes|data=outubro de 2026}}\r\n\r\n'])for(const separator of ['\n','\n\n','\r\n']){
 add('box-first/'+hash(indent+prefix+separator),prefix+indent+box+separator+lead+tail,prefix+box+separator+lead+tail);
 add('prose-first/'+hash(indent+prefix+separator),prefix+lead+separator+indent+box+tail,prefix+box+separator+lead+tail);
}
const multiline='{{Info/Biografia\n |nome = Pessoa fictícia\n |ocupação = pesquisadora\n}}';
add('field-indentation-preserved',lead+'\n  '+multiline+tail,multiline+'\n'+lead+tail,{markup:false});
for(const [id,source]of [
 ['tab-prefix','\t'+box+'\n'+lead+tail],['mixed-prefix',' \t'+box+'\n'+lead+tail],
 ['other-indented-line',' '+box+'\n'+lead+'\n Exemplo literal preservado.\n'],
 ['other-indented-line-before',' Exemplo literal preservado.\n '+box+'\n'+lead+tail],
 ['indented-lead',' '+box+'\n '+lead+tail],['wrong-subject',' '+box+"\n'''Outra pessoa''' foi uma pesquisadora."+tail],
 ['nonbold-opening',' '+box+'\nPessoa fictícia foi uma pesquisadora.'+tail],
 ['second-box',' '+box+'\n'+lead+'\n'+box+tail],['same-line-text',' '+box+' Texto preservado.\n'+lead+tail],
 ['blockquote','<blockquote>\n '+box+'\n</blockquote>\n'+lead+tail],
 ['unknown-owner','{{Modelo fictício|conteúdo=\n '+box+'\n'+lead+'\n}}'],
 ['unknown-prefix','{{Modelo fictício}}\n '+box+'\n'+lead+tail],
 ['unproved-box',' {{Info/Modelo fictício|nome=Pessoa fictícia}}\n'+lead+tail],
 ['inexact-native-title',' {{Info/biografia|nome=Pessoa fictícia}}\n'+lead+tail],
 ['explicit-layout',' {{Info/Biografia|nome=Pessoa fictícia|estilo=largura:300px}}\n'+lead+tail],
 ['section-box',lead+'\n== Biografia ==\n '+box+'\nTexto preservado.'],
 ['conflicting-reference',lead+'<ref name="origem">Fonte Alfa.</ref>\n {{Info/Biografia|nome=Pessoa fictícia|ocupação=pesquisadora<ref name="origem">Fonte Beta.</ref>}}'+tail]
])add('boundary/'+id,source,source);
for(const [id,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['code',s=>'<code>'+s+'</code>'],['comment',s=>'<!--'+s+'-->'],['fence',s=>'```wikitext\n'+s+'\n```'],['quoted',s=>'"'+s+'"'],['italics',s=>"''"+s+"''"]]){const source=wrap(' '+box+'\n'+lead);add('literal/'+id,source,source);}
for(const key of ['syntaxRepairs','structuralRepairs','infoboxes','automaticInfoboxOrder'])add('off/'+key,' '+box+'\n'+lead,' '+box+'\n'+lead,{[key]:false});
// Markup controls source alignment. The independently scoped principal-box
// ordering operation remains enabled when only that formatting option is off.
add('independent-markup-option',' '+box+'\n'+lead,box+'\n'+lead,{markup:false});
for(const extra of [{namespaceNumber:1},{namespaceNumber:2},{namespaceNumber:10},{sectionOnly:true},{section:'0'},{discussionPage:true},{redirectPage:true},{disambiguationPage:true},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'javascript'},{pageTitle:'Outra pessoa'}])add('scope/'+hash(JSON.stringify(extra)),' '+box+'\n'+lead,' '+box+'\n'+lead,extra);
for(const file of files){const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file),base={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),namespaceNumber:0,contentModel:'wikitext',minorBaseConfirmed:true,...settings};report.bundles.push({bundle,sha256:hash(bytes),version:api.version});
 for(const fixture of fixtures){const {source,expected}=fixture,options={...base,...fixture.extra},scenarioSha256=hash(JSON.stringify(canonical({source,expected,options,kind:'adjust'}))),row={id:fixture.id,bundle,kind:source===expected?'boundary':'positive',expectedRepair:source!==expected,status:'passed',sourceSha256:hash(source),expectedEndpointSha256:hash(expected),optionsSha256:hash(JSON.stringify(canonical(options))),intentSha256:hash(fixture.id),scenarioSha256};report.cases.push(row);descriptors.add(scenarioSha256);
  try{const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});for(const [actual,wanted,label]of [[first.text,expected,'Exact independently specified whole-action endpoint'],[second.text,expected,'Second action is byte-identical'],[first.preservation||[],[],'No preservation guard is bypassed'],[api.safeComposition(source,expected,options),'','Exact source-bound composition proof']]){report.checks++;assert.deepEqual(actual,wanted,label);}row.actualEndpointSha256=hash(first.text);row.appliedIds=(first.changes||[]).map(change=>change.id);}catch(error){row.status='failed';report.status='failed';report.failures.push({bundle,id:fixture.id,message:error.message});}
 }
 report.checks++;assert.equal(hash(fs.readFileSync(file)),hash(bytes),'Actual runtime remains immutable');
}
report.distinctScenarioCount=descriptors.size;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

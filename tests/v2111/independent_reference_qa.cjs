'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),fixtures=path.join(__dirname,'independent_fixtures'),manifest=JSON.parse(fs.readFileSync(path.join(fixtures,'manifest.json'),'utf8'));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const supplied=process.env.REVISAWIKI_SCRIPT,files=supplied?[path.resolve(supplied)]:require('./candidate.cjs').bundleFiles();
const report={version:'2.11.1',kind:'independent-reference-identity-and-metadata-oracles',runnerSha256:sha(fs.readFileSync(__filename)),fixtureManifestSha256:sha(fs.readFileSync(path.join(fixtures,'manifest.json'))),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0};
const eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
function test(bundle,name,run){try{run();report.cases.push({bundle,name,status:'passed'});}catch(error){report.failures.push({bundle,name,message:String(error.message).replaceAll(root,'<local-path>')});report.cases.push({bundle,name,status:'failed'});}}
const ref=(name,body,group='')=>'<ref name="'+name+'"'+(group?' group="'+group+'"':'')+'>'+body+'</ref>';
const collect=(group='')=>'{{Referências'+(group?'|grupo='+group:'')+'}}';
const source=(prefix='',bodyA='Fonte A.',bodyB='Fonte B.',tail='')=>prefix+ref('x',bodyA)+'\n'+ref('x',bodyB)+'\n'+tail+collect();
const refTokens=code=>[...code.matchAll(/<ref\b(?![^>]*\/\s*>)([^>]*?)>([\s\S]*?)<\/ref\s*>/gi)].map(m=>({name:(/\bname\s*=\s*"([^"]*)"/i.exec(m[1])||[])[1]||'',attrs:m[1],body:m[2],full:m[0]}));
const withoutNames=code=>code.replace(/(<ref\b[^>]*\bname\s*=\s*")[^"]*(")/gi,'$1<identity>$2');
const verifiedOldURL='https://almaacreana.blogspot.com/2011/03/um-pouco-da-historia-da-aviacao-no-acre.html.',verifiedNewURL=verifiedOldURL.slice(0,-1);
const publicationAliases=['jornal','revista','dicionario','dicionário','publicacao','publicação','periodico','periódico','website','site','obra','encyclopedia','encyclopaedia','enciclopedia','enciclopédia','trabalho','work','journal','newspaper','magazine','periodical','dictionary','publicación','diccionario'];
for(const file of files){
 const api=require(file),bundle=path.basename(file),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Lista de aeroclubes do Brasil',authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,autoPreview:false,registryDoiCheck:false,minorBaseConfirmed:true};
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file)),version:api.version,distributionRevision:api.distributionRevision||null});
 const graph=code=>api.v210ReferenceRepairProjection(code,cfg),calculate=(code,options={})=>api.calculate({kind:'adjust',source:code,options:{...cfg,...options}});
 test(bundle,'independent fixture provenance and public source census',()=>{for(const [name,pin]of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(fixtures,name));eq(bytes.length,pin.bytes,'Every oracle byte count is pinned');eq(sha(bytes),pin.sha256,'Every immutable oracle hash is pinned');}const before=fs.readFileSync(path.join(fixtures,'article.wiki'),'utf8');eq(Buffer.byteLength(before),44765,'Original public article byte count');eq(sha(before),manifest.article.sha256,'Original public revision hash');eq(manifest.article.revid,73225274,'Original exact revision');eq(refTokens(before).length,82,'Independent count of complete literal definitions');eq((before.match(/<ref\b[^>]*\/\s*>/gi)||[]).length,0,'No ambiguous empty named calls');eq((before.match(/\{\{formatnum:/g)||[]).length,102,'Every numeric parser-function call remains in the article');});
 test(bundle,'whole article matches four handwritten minimal changes exactly',()=>{const before=fs.readFileSync(path.join(fixtures,'article.wiki'),'utf8'),expected=fs.readFileSync(path.join(fixtures,'expected.wiki'),'utf8'),result=calculate(before);eq(result.text,expected,'Only two complete-definition names, one field key and one exact proved URL change');eq(result.preservation,[],'The entire existing preservation audit passes');eq(calculate(expected).text,expected,'The whole engine is idempotent');eq(result.warnings.filter(w=>/catuleve|"es"|\bblog\b/.test(w)),[],'Resolved conflicts and ignored-field warnings disappear');const a=refTokens(before),b=refTokens(expected);eq(a.length,b.length,'All complete reference definitions are retained');eq(a.map(r=>r.body.replace('|blog=','|obra=').replace(verifiedOldURL,verifiedNewURL)),b.map(r=>r.body),'Only the proved alias key and exact URL differ inside citation bodies');eq(a.filter((r,i)=>r.name!==b[i].name).map(r=>r.name),['catuleve','es'],'Exactly the second occurrences are renamed');eq(withoutNames(before).replace('|blog=','|obra=').replace(verifiedOldURL,verifiedNewURL),withoutNames(expected),'All source outside the approved four lexical changes is literal');eq(result.minorCheck.eligible,true,'Four mechanical, source-preserving changes qualify as minor');const count=api.v211RetainedAdjustments(before,result.text);eq(count.exact,true,'The occurrence ledger is exact');eq(count.count,4,'Four separate lexical repairs count as four');});
 test(bundle,'unverified titles, citation identities, URLs and PDF metadata remain literal',()=>{const before=fs.readFileSync(path.join(fixtures,'article.wiki'),'utf8'),after=calculate(before).text,a=refTokens(before),b=refTokens(after);for(const name of ['bahia'])eq(b.find(r=>r.name===name).full,a.find(r=>r.name===name).full,'Unsupported bibliographic metadata is never invented or erased');eq(after.match(/https?:\/\/[^\s|}<]+/g),before.replace(verifiedOldURL,verifiedNewURL).match(/https?:\/\/[^\s|}<]+/g),'Only the independently proved exact URL changes');eq(b.find(r=>r.name==='acre').full,a.find(r=>r.name==='acre').full.replace(verifiedOldURL,verifiedNewURL),'Only the proved URL changes within the complete citation');eq(after.match(/\|formato=PDF/g),before.match(/\|formato=PDF/g),'PDF fields are not erased based on their landing page');eq(after.match(/\{\{formatnum:[^{}]+\}\}/g),before.match(/\{\{formatnum:[^{}]+\}\}/g),'All numeric parser functions retain literal arguments');eq(after.includes('|jornal=A União '),true,'The uncorroborated publication is left for human source review');});
 for(const [name,before,expected]of [
  ['two complete bare sources',source(),source().replace('name="x">Fonte B.','name="x-2">Fonte B.')],
  ['identical later body reuses the renamed identity',source('','Fonte A.','Fonte B.',ref('x','Fonte B.')+'\n'),source('','Fonte A.','Fonte B.',ref('x','Fonte B.')+'\n').replaceAll('name="x">Fonte B.','name="x-2">Fonte B.')],
  ['occupied suffix is skipped',source('', 'Fonte A.','Fonte B.',ref('x-2','Fonte C.')+'\n'),source('', 'Fonte A.','Fonte B.',ref('x-2','Fonte C.')+'\n').replace('name="x">Fonte B.','name="x-3">Fonte B.')],
  ['numeric parser function with a literal argument',source('{{formatnum:1200}}\n'),source('{{formatnum:1200}}\n').replace('name="x">Fonte B.','name="x-2">Fonte B.')],
  ['table context retains exact row and cell text','{| class="wikitable"\n| '+ref('x','Fonte A.')+'\n|-\n| '+ref('x','Fonte B.')+'\n|}\n'+collect(),'{| class="wikitable"\n| '+ref('x','Fonte A.')+'\n|-\n| '+ref('x-2','Fonte B.')+'\n|}\n'+collect()],
  ['supported native collector alias remains literal',source().replace(collect(),'{{Reflist}}'),source().replace('name="x">Fonte B.','name="x-2">Fonte B.').replace(collect(),'{{Reflist}}')],
  ['native collector style is accepted without rewrite',source().replace(collect(),'{{Referências|estilo=column-count:2;}}'),source().replace('name="x">Fonte B.','name="x-2">Fonte B.').replace(collect(),'{{Referências|estilo=column-count:2;}}')]
 ])test(bundle,name,()=>{eq(graph(before),expected,'Exact independently expected opener change');eq(withoutNames(graph(before)),withoutNames(before),'No body, group or surrounding text changes');eq(graph(expected),expected,'The renamed graph is stable');});
 const blocked=[
  ['unresolved empty call',source('',undefined,undefined,'<ref name="x"/>\n')],
  ['continuation call',source('',undefined,undefined,'<ref follow="x">Continuação.</ref>\n')],
  ['unknown transclusion',source('{{Fonte desconhecida}}\n')],
  ['unknown nested argument of a known citation',source('{{citar web|titulo={{Fonte desconhecida}}|url=https://example.test}}\n')],
  ['unknown argument containing hidden ref call',source('{{Exemplo|campo=<ref name="x"/>}}\n')],
  ['known template argument containing hidden ref call',source('{{Commonscat|campo=<ref name="x"/>}}\n')],
  ['numeric parser-function argument with a reference',source('{{formatnum:<ref name="x"/>}}\n')],
  ['numeric parser-function argument with a template',source('{{formatnum:{{Valor}}}}\n')],
  ['parser-function extra argument containing a reference',source('{{formatnum:1200|R=<ref name="x"/>}}\n')],
  ['dynamic names',ref('{{Nome}}','Fonte A.')+'\n'+ref('{{Nome}}','Fonte B.')+'\n'+collect()],
  ['dynamic groups',ref('x','Fonte A.','{{Grupo}}')+'\n'+ref('x','Fonte B.','{{Grupo}}')+'\n'+collect()],
  ['different source body embedded in an unknown template',source('','{{Fonte desconhecida|A}}','{{Fonte desconhecida|B}}')],
  ['conflicting definitions in a literal bank','<ref name="x"/>\n{{Referências|refs='+ref('x','Fonte A.')+ref('x','Fonte B.')+'}}'],
  ['indirect reference generator',source('{{refn|Nota indireta}}\n')],
  ['short reference generator',source('{{sfn|Autor|2024}}\n')],
  ['unconfirmed foreign collector',source().replace(collect(),'{{Foreign-reference-list-with-unknown-contract}}')],
  ['multiple collector intervals',ref('x','Fonte A.')+'\n'+collect()+'\n'+ref('x','Fonte B.')+'\n'+collect()],
  ['unknown collector argument',source().replace(collect(),'{{Referências|extra={{Desconhecido}}}}')],
  ['malformed group collector',source().replace(collect(),'{{Referências|grupo={{Grupo}}}}')],
  ['partial definition',source()+'\n<ref name="outro">Sem fim'],
  ['nested ref tags',source('','Texto <ref>Fonte interna.</ref>','Fonte B.')],
  ['duplicate name attributes','<ref name="x" name="y">Fonte A.</ref>\n'+ref('x','Fonte B.')+'\n'+collect()]
 ];
 for(const [name,before]of blocked)test(bundle,'ambiguous identity is declined: '+name,()=>eq(graph(before),before,'The graph never guesses a source, identity, group, hidden call or collector scope'));
 for(const [open,close]of [['<nowiki>','</nowiki>'],['<pre>','</pre>'],['<source lang="wikitext">','</source>'],['<syntaxhighlight lang="wikitext">','</syntaxhighlight>'],['<!--','-->']])test(bundle,'protected examples retain literal references '+open,()=>{const before=open+source()+close;eq(graph(before),before,'Protected markup is not an article reference graph');});
 test(bundle,'matching groups are independent with no cross-group suffix collision',()=>{const before=ref('x','Fonte A.','nota')+ref('x','Fonte B.','nota')+ref('x-2','Outro grupo.')+'\n'+collect('nota')+'\n'+collect(),expected=before.replace('name="x" group="nota">Fonte B.','name="x-2" group="nota">Fonte B.');eq(graph(before),expected,'Only occupied names in the same effective Cite group matter');eq(refTokens(graph(before)).map(r=>r.body),refTokens(before).map(r=>r.body),'Group handling never changes source bodies');});
 const blog='{{citar jornal |titulo=Uma fonte |blog=Publicação literal |url=https://example.test/fonte |data=2024}}';
 const alias=raw=>api.v2111CitationFieldCall(raw,cfg).text;
 test(bundle,'publication alias preserves the citation class and every value',()=>{eq(alias(blog),blog.replace('|blog=','|obra='),'Only one field key changes');eq(alias(blog.replace('|blog=','|obra=')),blog.replace('|blog=','|obra='),'An accepted field is stable');});
 for(const key of publicationAliases)for(const value of ['','Publicação literal','Outra publicação'])test(bundle,'publication-family collision prevents blog migration: '+key+' '+(value||'<empty>'),()=>{const before=blog.slice(0,-2)+'|'+key+'='+value+'}}';eq(alias(before),before,'An explicit publication-family alias, even empty or equal, prevents guessing');});
 for(const [label,before]of [
  ['two blog fields',blog.slice(0,-2)+'|blog=Outro}}'],
  ['empty blog value','{{citar jornal|titulo=Fonte|blog=|url=https://example.test}}'],
  ['nested publication value','{{citar jornal|titulo=Fonte|blog={{Publicação}}|url=https://example.test}}'],
  ['parameter expansion','{{citar jornal|titulo=Fonte|blog={{{Publicação}}}|url=https://example.test}}'],
  ['foreign citation','{{cite news|title=Fonte|blog=Publicação|url=https://example.test}}'],
  ['unknown template','{{Outra|titulo=Fonte|blog=Publicação}}'],
  ['free positional fragment','{{citar jornal|titulo=Fonte|blog=Publicação|Fragmento}}'],
  ['unclosed nested field','{{citar jornal|titulo=Fonte|blog={{Publicação|url=https://example.test}}']
 ])test(bundle,'unsafe publication alias is preserved: '+label,()=>eq(alias(before),before,'The finite alias migration does not broaden unrelated template syntax'));

 test(bundle,'exact URL pair has independent HTTP and source-identity evidence',()=>{const proof=JSON.parse(fs.readFileSync(path.join(fixtures,'independent_url_destination.json'),'utf8'));eq(proof.status,'passed','Independent secure GET checks passed');eq(proof.cases.map(c=>[c.status,c.redirects,c.TLSVerification]),[[404,0,0],[200,0,0]],'The exact old and replacement destinations have the required status and TLS properties');eq(proof.cases[1].canonicalURLs,[verifiedNewURL],'The exact replacement is canonical');eq(proof.cases[1].postHeadlines,['UM POUCO DA HISTÓRIA DA AVIAÇÃO NO ACRE'],'The unique post headline matches the existing cited title');const before=refTokens(fs.readFileSync(path.join(fixtures,'article.wiki'),'utf8')).find(r=>r.name==='acre').body,expected=before.replace(verifiedOldURL,verifiedNewURL);eq(api.v2111CitationFieldCall(before,cfg).text,expected,'Only the complete source-matching citation receives the finite correction');eq(api.v2111CitationFieldCall(before,{...cfg,pageTitle:'Outro artigo'}).text,before,'Another article cannot borrow that source identity');});
 const exactURLCall=refTokens(fs.readFileSync(path.join(fixtures,'article.wiki'),'utf8')).find(r=>r.name==='acre').body;
 for(const [label,mutated]of [
  ['other citation title',exactURLCall.replace('titulo=UM','titulo=OUTRO UM')],
  ['other publication',exactURLCall.replace('publicado=Alma Acreana','publicado=Outra publicação')],
  ['different year',exactURLCall.replace('|data=2011','|data=2012')],
  ['absent PDF metadata',exactURLCall.replace('|formato=PDF ','')],
  ['different access date',exactURLCall.replace('16 de outubro de 2026','15 de outubro de 2026')],
  ['duplicate URL',exactURLCall.replace('}}','|url='+verifiedOldURL+'}}')],
  ['query string',exactURLCall.replace(verifiedOldURL,verifiedOldURL+'?q=1')],
  ['fragment',exactURLCall.replace(verifiedOldURL,verifiedOldURL+'#parte')],
  ['another host',exactURLCall.replace('almaacreana','outroblog')],
  ['different case or formatting',exactURLCall.replace('citar web ','Citar web ')]
 ])test(bundle,'the exact URL evidence cannot authorize '+label,()=>eq(api.v2111CitationFieldCall(mutated,cfg).text,mutated,'A different full citation never receives the pinned historical URL correction'));
 for(const [open,close]of [['<nowiki>','</nowiki>'],['<pre>','</pre>'],['<!--','-->'],['{{Exemplo|campo=','}}']])test(bundle,'the exact URL remains protected under '+open,()=>{const before=open+exactURLCall+close;eq(api.v2111CitationFieldPlan(before,cfg).text,before,'Examples and unconfirmed argument evaluation cannot borrow an article citation repair');});
 for(const options of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{section:'1'},{citations:false},{citationRepairs:false},{markup:false}])test(bundle,'exact URL scope guard '+JSON.stringify(options),()=>eq(api.v2111CitationFieldCall(exactURLCall,{...cfg,...options}).text,exactURLCall,'A full active article context and enabled citation repair are required'));
 test(bundle,'one safe local alias repair does not suppress distinct ambiguous groups',()=>{const complete=(group='')=>ref('x','Fonte A.',group)+ref('x','Fonte B.',group)+'<ref name="x"'+(group?' group="'+group+'"':'')+'/>';const before=complete()+complete('nota')+'\n'+refTokens(fs.readFileSync(path.join(fixtures,'article.wiki'),'utf8')).find(r=>r.name==='amapá').full+'\n'+collect('nota')+'\n'+collect(),result=calculate(before,{unifiedNotesReferences:false});eq(result.text,before.replace('|blog=','|obra='),'Safe local metadata equivalence still runs beside ambiguous reference identities');const messages=result.warnings.filter(w=>/"x"/.test(w)&&/defini|conteúd|fonte/i.test(w));eq(messages.length,2,'Two effective groups keep two distinct actionable warnings');eq(new Set(messages).size,2,'Group identity is visible in the remaining warnings');eq(refTokens(result.text).filter(r=>r.name==='x').map(r=>r.body),refTokens(before).filter(r=>r.name==='x').map(r=>r.body),'Every ambiguous group source body is retained');});
 test(bundle,'ambiguous remaining conflict has one visible warning per source identity',()=>{const before=source('',undefined,undefined,'<ref name="x"/>\n'),result=calculate(before),messages=result.warnings.filter(w=>/"x"/.test(w)&&/defini|conteúd|fonte/i.test(w));eq(messages.length,1,'Two audit phases do not double the same actionable conflict');eq(refTokens(result.text).map(r=>r.body),refTokens(before).map(r=>r.body),'Quiet refusal retains complete source bodies');});
}
report.failed=report.failures.length;report.passed=report.cases.length-report.failed;report.status=report.failed?'failed':'passed';
const out=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(root,'artifacts/v2111'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'independent_reference_qa.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failed:report.failed,failures:report.failures}));if(report.failed)process.exitCode=1;

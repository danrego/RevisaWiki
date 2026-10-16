'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=process.env.REVISAWIKI_SCRIPT?null:require('./candidate.cjs'),sha=value=>crypto.createHash('sha256').update(value).digest('hex'),scripts=candidate?candidate.bundleFiles():[path.resolve(process.env.REVISAWIKI_SCRIPT)];
const manifestFile=path.join(__dirname,'fixtures/portal_real_manifest.json'),manifestBytes=fs.readFileSync(manifestFile),manifest=JSON.parse(manifestBytes);
const report={version:'2.11.1',kind:'confirmed-subject-portals',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),fixtureManifestSha256:sha(manifestBytes),frozenFiles:candidate?candidate.manifest.files:undefined,bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function test(bundle,name,fn){try{fn();report.cases.push({bundle,name,status:'passed'});}catch(error){report.status='failed';report.failures.push({bundle,name,error:candidate?candidate.sanitized(error.stack):String(error.stack)});}}
const article=box=>box+'\n\nTexto de controle.\n',box=(name,fields='')=>'{{'+name+(fields?'|'+fields:'')+'}}';
for(const script of scripts){
 const api=require(script),bundle=path.basename(script),cfg={...Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),endMatter:true,portals:true,biographyPortal:true,automaticBiographyPortals:true,automaticTopicPortals:true,namespaceNumber:0,pageTitle:'Assunto de controle'};
 report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(script)),version:api.version});
 const candidates=(source,options={})=>api.v211TopicPortalCandidates(source,{...cfg,...options});
 test(bundle,'cached native portal rendering',()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'fixtures/topic_portal_native_render.json')),proof=JSON.parse(bytes),expected=['Biologia','Zoologia','Mamíferos','Anfíbios e répteis','Aves','Peixes','Entomologia','Botânica','Micologia','Microbiologia','Vírus','Farmácia','Medicina','Saúde','Televisão','Entretenimento','Séries de televisão','Animação'];
  eq(proof.originalEvidenceSha256,'ad692fa8e41aff37fb6dc05e6bad18b5b1af61499b09e8f6e7fcc8f9f03e226d','The original anonymous read-only native response is pinned');
  eq(proof.input,expected.map(name=>'{{Portal3|'+name+'}}').join('\n'),'All eighteen native Portal3 inputs are exact');
  eq(proof.response.parse.parsewarnings,[],'Native parser returned no preview warnings');
  const html=proof.response.parse.text,links=[...html.matchAll(/href="([^"\s]+)"/g)].map(m=>{try{return decodeURIComponent(m[1]).replaceAll('_',' ');}catch(_){return m[1];}});
  for(const name of expected)eq(links.includes('/wiki/Portal:'+name),true,'Each verified canonical topic links to its native portal');
  eq(/class="[^"]*(?:new|scribunto-error|error)[^"]*"/.test(html),false,'None of the verified native targets renders as an error or missing page');
  const generated=[...new Set([article(box('Info/Taxonomia','reino=Animalia|classe=Mammalia')),article(box('Info/Taxonomia','reino=Fungi')),article(box('Info/Vacina')),article(box('Info/Televisão','formato=Série animada'))].flatMap(source=>api.v211TopicPortalCandidates(source,cfg)))];
  for(const name of generated)eq(expected.includes(name),true,'Current profile candidates are covered by cached native rendering');
 });

 function expect(name,raw,expected){test(bundle,name,()=>{const source=article(raw);eq(candidates(source),expected,'Candidates follow only the verified principal profile and literal fields');const result=api.calculate({kind:'adjust',source,options:cfg});eq((result.text.match(/\{\{Portal3\|([^{}]+)\}\}/)||[])[1]?.split('|')||[],expected,'Actual calculate applies exactly the confirmed portals');eq(result.text.replace(/\{\{Portal3\|[^{}]+\}\}\n?/, '').replace(/\s/g,''),source.replace(/\s/g,''),'All nonportal bytes except boundary whitespace remain exact');eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,'Second click is stable');});}
 expect('film with production country',box('Info/Filme','país=[[África do Sul]]'),['Cinema','Entretenimento','África do Sul']);
 expect('film coproduction',box('Info/Filme','país=[[Brasil]]<br />[[Portugal]]'),['Cinema','Entretenimento','Brasil','Portugal']);
 expect('film with unknown country',box('Info/Filme','país={{País não confirmado}}|idioma=Português|direção=Pessoa brasileira'),['Cinema','Entretenimento']);
 expect('conflicting production fields retain only film topics',box('Info/Filme','país=Brasil|pais=Portugal'),['Cinema','Entretenimento']);
 expect('unknown coproduction member prevents partial country list',box('Info/Filme','país=[[Brasil]]<br />{{País}}'),['Cinema','Entretenimento']);
 expect('film title and filming country do not classify production',box('Info/Filme','localização=França|título-bra=Filme brasileiro'),['Cinema','Entretenimento']);
 for(const [format,desired]of [['Série',['Televisão','Entretenimento']],['Telejornal',['Televisão']],['Jornalístico',['Televisão']],['Debate',['Televisão']],['Série de desenho animado',['Televisão','Entretenimento','Animação']],['Telefilme animado',['Televisão','Entretenimento','Animação']]])expect('television exact format '+format,box('Info/Televisão','formato='+format),desired);
 expect('television native alias',box('Info/Série de televisão','formato=[[Telenovela]]|país=[[Portugal]]'),['Televisão','Entretenimento','Portugal']);
 for(const format of ['Websérie','{{Formato}}','Série ou documentário','Série|formato=Telejornal'])expect('uncertain television format '+format,box('Info/Televisão','formato='+format),[]);
 expect('TV news countries do not imply entertainment',box('Info/Televisão','formato=Telejornal|país=[[Brasil]]|localização=[[Canadá]]'),['Televisão','Brasil']);
 for(const [fields,expected]of [
  ['reino=Animalia|classe=Mammalia',['Biologia','Zoologia','Mamíferos']],['regnum=[[Animalia]]|classis=[[Insecta]]',['Biologia','Zoologia','Entomologia']],
  ['reino=Animalia|classe=Aves',['Biologia','Zoologia','Aves']],['reino=Animalia|classe=Amphibia',['Biologia','Zoologia','Anfíbios e répteis']],
  ['reino=Animalia|classe=Reptilia',['Biologia','Zoologia','Anfíbios e répteis']],['reino=Animalia|classe=Sauropsida',['Biologia','Zoologia']],
  ['reino=Animalia|classe=Sauropsida|ordem=Squamata',['Biologia','Zoologia','Anfíbios e répteis']],['reino=Animalia|classe=Aves|ordem=Squamata',['Biologia','Zoologia']],
  ['reino=Animalia|domínio=Archaea|classe=Mammalia',['Biologia']],['reino=Plantae|domínio=Archaea',['Biologia']],
  ['reino=Fungi|domínio=Bacteria',['Biologia']],['reino=Animalia|domínio=Eukaryota|classe=Mammalia',['Biologia','Zoologia','Mamíferos']],
  ['reino=Plantae|domínio=Eukarya',['Biologia','Botânica']],['reino=Animalia|domínio=[[Eukariota]]|classe=Chondrichthyes',['Biologia','Zoologia','Peixes']],['reino=Animalia|classe=Mammalia|ordem=Squamata',['Biologia','Zoologia']],
  ['reino=Animalia|classe=Insecta|ordem=Crocodylia',['Biologia','Zoologia']],['reino=Animalia|classe=Amphibia|ordem=Testudines',['Biologia','Zoologia']],
  ['reino=Animalia|classe=Reptilia|ordem=Squamata',['Biologia','Zoologia','Anfíbios e répteis']],
  ['reino=Animalia|classe=Chondrichthyes',['Biologia','Zoologia','Peixes']],['reino=Animalia|classe=Sarcopterygii',['Biologia','Zoologia']],
  ['reino=Animalia|classe=Osteichthyes',['Biologia','Zoologia']],['reino=Plantae',['Biologia','Botânica']],['reino=Fungi',['Biologia','Micologia']],
  ['domínio=Bacteria',['Biologia','Microbiologia']],['domínio=Bacteria|reino=Monera',['Biologia','Microbiologia']],['grupo_viral=IV',['Biologia','Vírus']],['virus_group=VII',['Biologia','Vírus']],
  ['reino=Animalia|reino=Plantae',['Biologia']],['reino=Animalia|classe=Mammalia|classis=Aves',['Biologia','Zoologia']],
  ['reino=Animalia|grupo_viral=IV',['Biologia']],['reino={{Dado}}',['Biologia']],['reino=[[Plantae|Animalia]]',['Biologia']]
 ])expect('taxonomy '+fields,box('Info/Taxonomia',fields),expected);
 for(const [fields,expected]of [
  ['reino=[[Animalia|Plantae]]',['Biologia']],['reino=[[Fungi|Animalia]]',['Biologia']],
  ['reino=Animalia|classe=[[Mammalia|Aves]]',['Biologia','Zoologia']],
  ['reino=Animalia|classe=Sauropsida|ordem=[[Squamata|Testudines]]',['Biologia','Zoologia']],
  ['reino=Animalia|domínio=[[Eukaryota|Archaea]]',['Biologia']],
  ['reino=[[Animalia|Animais]]|classe=[[Mammalia|Mamíferos]]',['Biologia','Zoologia','Mamíferos']],
  ['reino=Animalia|domínio=[[Eukariota|Eukaryota]]|classe=Mammalia',['Biologia','Zoologia','Mamíferos']],
  ['reino=Animalia|classe=Reptilia|ordem=[[Crocodilia|Crocodylia]]',['Biologia','Zoologia','Anfíbios e répteis']]
 ])expect('finite taxon target and label consistency '+fields,box('Info/Taxonomia',fields),expected);
 for(const name of ['Speciesbox','Automatic taxobox'])expect('dynamic taxonomy remains broad '+name,box(name,'taxon=Exemplum|fossil_range=Triássico|range_map=Brasil.svg'),['Biologia']);
 expect('empty native vaccine',box('Info/Vacina'),['Farmácia','Medicina','Saúde']);
 expect('vaccine target is not subject classification',box('Info/Vacina','doença para tratar=vírus|país em causa=Brasil'),['Farmácia','Medicina','Saúde']);
 expect('biological drug',box('Info/Droga','nome=Anticorpo|tipo=biológico'),['Farmácia']);
 for(const name of ['Info/Patologia','Info/Doença'])expect('native pathology '+name,box(name,'Causas=Vírus|Tratamento=Medicamento|Nome=Doença veterinária'),['Medicina','Saúde']);
 const chem=(prefix='N02',suffix='BE01',pharmacology='Metabolism=Hepático')=>box('Info/Química','Section1={{Info/Química/Identifiers|ATCCode_prefix='+prefix+'|ATCCode_suffix='+suffix+'}}|Section5={{Chembox Pharmacology|'+pharmacology+'}}');
 expect('verified nested pharmaceutical',chem(),['Farmácia']);
 expect('verified alternative pharmaceutical half life',chem('L04','AC07','HalfLife=8–14 dias'),['Farmácia']);
 for(const [name,raw]of [['general compound',box('Info/Química','CAS=123-45-6|DrugBank=DB12345|fundo=fármaco')],['empty copied pharmacology',chem('N02','BE01','Metabolism=')],['incomplete ATC',chem('N02','','Metabolism=Hepático')],['wrong nesting',box('Info/Química','texto={{Chembox Identifiers|ATCCode_prefix=N02|ATCCode_suffix=BE01}}|nota={{Chembox Pharmacology|Metabolism=Hepático}}')],['generic infobox',box('Infocaixa','título=Vacina|dados=Animalia')],['unsupported guessed drug alias',box('Info/Medicamento','nome=Exemplo')],['TV network',box('Info/Rede de televisão','país=Brasil')],['video game',box('Info/Jogo eletrônico','formato=Série|país=Brasil')]])expect(name,raw,[]);
 for(const key of ['constructor','__proto__','toString','hasOwnProperty']){
  expect('inherited country key remains unknown '+key,box('Info/Filme','país='+key),['Cinema','Entretenimento']);
  expect('inherited taxon class key remains unknown '+key,box('Info/Taxonomia','reino=Animalia|classe='+key),['Biologia','Zoologia']);
  test(bundle,'inherited nationality template key remains unknown '+key,()=>{eq(api.v26NationalityTemplate('{{'+key+'|o}}'),null,'Native nationality lookup cannot inherit an object property');eq(api.biographyPortalCandidates(article(box('Info/Futebol','nacionalidade={{'+key+'|o}}')),{...cfg}),['Esportes','Futebol'],'An unknown nationality cannot crash or authorize a country');});
 }
 expect('own country alias retains its valid mapping',box('Info/Filme','país=EUA'),['Cinema','Entretenimento','Estados Unidos']);
 expect('own taxon class retains its valid mapping',box('Info/Taxonomia','reino=Animalia|classe=Mammalia'),['Biologia','Zoologia','Mamíferos']);
 const normal=article(box('Info/Filme','país=Brasil'));
 for(const [name,source,options]of [['non-mainspace',normal,{namespaceNumber:1}],['partial edit',normal,{sectionOnly:true}],['list',normal,{pageTitle:'Lista de filmes'}],['redirect',normal,{pageRedirect:true}],['disambiguation',normal,{pageDisambiguation:true}],['second box',normal+box('Info/Filme'),{}],['person and film',normal+box('Info/Biografia','nome=Pessoa'),{}],['body example','== Exemplos ==\n'+normal,{}],['embedded example','<div>\n'+normal+'</div>',{}],['quoted example','<blockquote>\n'+normal+'</blockquote>',{}],['protected example','<nowiki>'+normal+'</nowiki>',{}],['commented example','<!--'+normal+'-->',{}],['nested example','{{Exemplo|'+normal+'}}',{}],['indented example',' '+normal,{}],['child box',article(box('Info/Filme','child=yes|país=Brasil')),{}],['signed discussion',normal+'\n'+'~'.repeat(4),{}]])test(bundle,'principal profile guard '+name,()=>eq(candidates(source,options),[],'No subject classification from an incidental or unsupported context'));
 const footerProfiles={};for(const record of manifest.footerSources){eq(sha(record.source),record.sourceSha256,'Native footer source hash is pinned');const role=api.classifyFooterTemplate(record.source);if(role)footerProfiles[record.title.toLocaleLowerCase('pt')]=role;}
 test(bundle,'verified native eukaryotic domain aliases',()=>{const proof=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/portal_domain_aliases.json')));eq(proof.redirects,[{from:'Eukariota',to:'Eukaryota'},{from:'Eukarya',to:'Eukaryota'}],'Only the two native confirmed domain aliases extend the canonical literal');eq(proof.canonical,{title:'Eukaryota',revision:73058237,permalink:'https://pt.wikipedia.org/w/index.php?oldid=73058237'},'Domain alias target is bound to a public source revision');});
 test(bundle,'verified nationality template source records',()=>{const proof=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/portal_nationality_contracts.json')));eq(proof.templates.length,8,'Every bounded native template query is represented');eq(proof.redirects.map(row=>[row.from,row.to]).sort(),[['Predefinição:PORn','Predefinição:PRTn'],['Predefinição:SUEn','Predefinição:SWEn']].sort(),'Only the confirmed native aliases are accepted');for(const row of proof.templates){eq(sha(row.source),row.sourceSha256,'Full native nationality template source is pinned');eq(row.permalink,'https://pt.wikipedia.org/w/index.php?oldid='+row.revision,'Every finite contract has exact source attribution');}});
 test(bundle,'footer lookup follows the enabled portal operation',()=>{eq(api.v211FooterLookupNeeded({...cfg,endTemplateOrder:false}),true,'Portals still request native footer roles when reordering is off');eq(api.v211FooterLookupNeeded({...cfg,endTemplateOrder:false,portals:false}),false,'No lookup is introduced when both footer ordering and portals are disabled');eq(api.v211FooterLookupFailure({...cfg,endTemplateOrder:false}),null,'A portals-only lookup failure adds no routine warning');eq(typeof api.v211FooterLookupFailure({...cfg,endTemplateOrder:true}),'string','Existing ordering failure information is preserved');});
 test(bundle,'verified navigation wrapper classification',()=>{eq(api.classifyFooterTemplate('{{Info/Time|nome=Modelo}}'),'navbox','Verified Info/Time wrapper invokes native navigation');eq(api.classifyFooterTemplate('{{Time|nome=Modelo}}'),'navbox','Verified Time wrapper invokes native navigation');eq(api.classifyFooterTemplate('{{Elenco desconhecido}}'),null,'A name prefix is not navigation proof');});
 for(const [fields,expected]of [
  ['nascimento_cidade=[[Cidade]]|nascimento_país=[[França]]',['Esportes','Futebol','França']],
  ['nascimento_cidade=[[Cidade]]|nascimento_país=[[Noruega]]',['Esportes','Futebol','Noruega']],
  ['nacionalidade=brasileiro|nascimento_cidade=Cidade|nascimento_país=França',['Esportes','Futebol','Brasil']],
  ['nacionalidade=desconhecida|nascimento_país=França',['Esportes','Futebol']],
  ['nacionalidade=francês e brasileiro|nascimento_país=França',['Esportes','Futebol']],
  ['nascimento_cidade=[[Cidade]], [[Brasil]]|nascimento_país=França',['Esportes','Futebol']],
  ['nascimento_cidade=[[Paris]]',['Esportes','Futebol']],
  ['esporte=futsal',['Esportes']],['esporte=[[Futebol americano]]',['Esportes','Futebol americano']]
 ])test(bundle,'football evidence '+fields,()=>{const source=article(box('Info/Futebol','nome=Pessoa|'+fields));eq(api.biographyPortalCandidates(source,cfg),expected,'Football profile, nationality priority and subtype guards are explicit');eq(api.biographyDetection(source,cfg)?.infobox,'info/futebol','Native person profile is recognized without renaming the template');});
 for(const [name,country]of [['FRAn','França'],['NORn','Noruega'],['BRAn','Brasil'],['PORn','Portugal'],['PRTn','Portugal'],['ESPn','Espanha'],['ITAn','Itália'],['SUEn','Suécia'],['SWEn','Suécia']])test(bundle,'verified nationality template '+name,()=>eq(api.v26NationalityTemplate('{{'+name+'|o}}'),[country],'Finite nationality output contract supplies the country'));
 for(const source of ['{{FRAn|qualquer coisa}}','{{FRAn|o|outro=sim}}','{{País inventado|o}}','{{ENGn|o}}'])test(bundle,'unverified nationality '+source,()=>eq(api.v26NationalityTemplate(source),null,'Unknown parameters and unverified destinations remain unknown'));
 test(bundle,'preserve state and normal portal slots',()=>{const source=article(box('Info/Futebol','nacionalidade=brasileiro'))+'\n{{Portal3|Biografias|Goiás}}\n';const output=api.calculate({kind:'adjust',source,options:cfg}).text;eq(output.includes('{{Portal3|Biografias|Goiás|Esportes|Futebol}}'),true,'State already covers Brazil and new slots stay positional');eq(/\|\d+=Brasil/.test(output),false,'No unnecessary named country slot');});
 for(const raw of ['{{Portal3|Cinema|Entretenimento|Brasil}}','{{Portal3|Cinema|Entretenimento|1=Brasil}}','{{Portal3|{{Dinâmico}}}}','{{Portal3|A|B|C|D|E|F|G|H|I|J}}'])test(bundle,'existing portal guard '+raw,()=>{const source=normal+'\n'+raw+'\n';const out=api.calculate({kind:'adjust',source,options:cfg}).text;eq(out,source,'Complete, dynamic, conflicting or full existing portal calls remain intact');});
 test(bundle,'canonical portal aliases deduplicate without rewriting',()=>{const source=article(box('Info/Taxonomia','reino=Fungi'))+'\n{{Portal3|Biologia|Fungos}}\n';eq(api.calculate({kind:'adjust',source,options:cfg}).text,source,'A verified existing alias remains valid and is not duplicated');});
 test(bundle,'unconfirmed footer stays intact',()=>{const source=normal+'\n{{Rodapé desconhecido}}\n';eq(api.calculate({kind:'adjust',source,options:cfg}).text,source,'Unknown footer roles do not authorize moving or inserting a portal');});
 for(const record of manifest.cases)test(bundle,'public source '+record.id,()=>{const bytes=fs.readFileSync(path.join(__dirname,'fixtures',record.file)),source=bytes.toString('utf8');eq(bytes.length,record.sourceBytes,'Complete fixture byte count is pinned');eq(sha(bytes),record.sourceSha256,'Complete source or explicit projection is pinned');const options={...cfg,pageTitle:record.title,footerProfiles};const actual=record.id==='real-001'||record.id==='real-002'?api.biographyPortalCandidates(source,options):candidates(source,options);if(record.expectedCandidates!==null)eq(actual,record.expectedCandidates,'Native real profile has the independently recorded candidates');else{eq(actual[0],'Biologia','Only broad taxonomy is assumed when exact inherited ancestry is absent');eq(actual.includes('Medicina'),false,'Pathogenic organisms are not classified as diseases');}const result=api.calculate({kind:'adjust',source,options});eq(api.calculate({kind:'adjust',source:result.text,options}).text,result.text,'Actual real-source output is stable on second click');if(['real-001','real-002','real-003'].includes(record.id))eq(result.text.includes('{{Portal3|'+(record.id==='real-003'?actual:['Biografias',...actual]).join('|')+'}}'),true,'Actual complete real article receives all proved portal slots');});
 test(bundle,'topic feature option is respected',()=>{const result=api.calculate({kind:'adjust',source:normal,options:{...cfg,automaticTopicPortals:false}});eq(result.text,normal,'The new thematic rule can be disabled without changing prose');});
}
const dir=candidate?candidate.artifactDirectory():path.resolve(process.env.REVISAWIKI_REPORT_DIR||'.');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'topic_portals.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:report.cases.length,checks:report.checks,failures:report.failures}));if(report.failures.length)process.exitCode=1;

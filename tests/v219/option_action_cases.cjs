'use strict';
// Independently written action endpoints exercise switches through calculate.
// A missing positive remains a coverage obligation, never a passing no-op.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).filter(value=>!value.startsWith('--')).map(value=>path.resolve(value));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(value=>path.join(root,'dist/2.19.0',value)));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const scenarioIdentity=(source,expected,options)=>hash(JSON.stringify(canonical({source,expected,options,kind:'adjust'})));
const bioLead="\n\n'''Pessoa fictícia''' é uma pesquisadora.",bio=fields=>'{{Info/Biografia|nome=Pessoa fictícia|'+fields+'}}'+bioLead,
 bioOptions={infoboxes:true,markup:true,syntaxRepairs:true,structuralRepairs:true},
 bibliography=Array.from({length:6},(_,index)=>'* Livro fictício '+(index+1)).join('\n')+'\n',
 links=Array.from({length:6},(_,index)=>'* [https://example.invalid/fonte-'+(index+1)+' Fonte '+(index+1)+']').join('\n')+'\n';
const seeds=[];
const add=(id,gates,source,expected,options={},extra={})=>seeds.push({id,gates,source,expected,options,...extra});
add('foreign-citation',['citations','multilingual'],'{{Lien web|titre=Fonte literal}}','{{Citar web|titre=Fonte literal}}',{citations:true,multilingual:true},{pair:true,semanticDisposition:'exact-local-native-header-forwarding',pairExpected:{'citation-key':'{{Citar web|título=Fonte literal}}'}});
add('foreign-infobox',['infoboxes'],'{{Infobox person|name=Pessoa fictícia}}','{{Infobox person|name=Pessoa fictícia}}',{infoboxes:true,multilingual:true},{semanticDisposition:'native-wrapper-preservation'});
add('plain-link',['links'],'[[Ecossistema|ecossistema]]','[[ecossistema]]',{links:true},{pair:true});
add('plain-heading',['headings'],'== See also ==\n* [[Tema fictício]]','== Ver também ==\n* [[Tema fictício]]',{headings:true});
add('portal-wrapper',['portals'],'{{Portal|Ciência}}','{{Portal3|Ciência}}',{portals:true});
add('explicit-shortcut',['shortcuts'],'\\'.repeat(3)+'ref','{{Referências}}',{shortcuts:true});
add('category-namespace',['categories'],'[[Category:Tema fictício]]','[[Categoria:Tema fictício]]',{categories:true});
add('reference-renderer',['references'],'<references />','{{Referências}}',{references:true});
add('short-description',['shortDescriptions'],'{{Descrição curta|Texto literal}}\nTexto preservado.','Texto preservado.',{shortDescriptions:true});
add('native-duplicates',['automaticParameterDuplicates'],'{{Navbox|nome=Valor literal|nome=Valor literal}}','{{Navbox|nome=Valor literal}}',{auxiliaryTemplates:true,automaticParameterDuplicates:true},{pair:true});
add('native-key',['automaticParameterNames'],'{{Navbox|NOME=Valor literal}}','{{Navbox|nome=Valor literal}}',{auxiliaryTemplates:true,automaticParameterNames:true},{pair:true});
add('empty-unknown',['automaticEmptyParameters'],'{{Navbox|campo_inexistente_7349=}}','{{Navbox}}',{auxiliaryTemplates:true,automaticEmptyParameters:true},{pair:true});
add('native-family',['auxiliaryTemplates'],'{{Navbox|NOME=Valor literal}}','{{Navbox|nome=Valor literal}}',{auxiliaryTemplates:true,automaticParameterNames:true});
add('neutral-reference-name',['neutralReferenceNames'],'Texto.<ref name="RevisaWiki-auto-1">Fonte literal.</ref> Outra chamada.<ref name="RevisaWiki-auto-1" />\n{{Referências}}','Texto.<ref name="ref-auto-1">Fonte literal.</ref> Outra chamada.<ref name="ref-auto-1" />\n{{Referências}}',{references:true,neutralReferenceNames:true},{pair:true});
add('anonymous-identical-references',['automaticIdenticalReferences'],'A.<ref>Fonte literal.</ref> B.<ref>Fonte literal.</ref>\n{{Referências}}','A.<ref name="ref-auto-1">Fonte literal.</ref> B.<ref name="ref-auto-1" />\n{{Referências}}',{references:true,automaticIdenticalReferences:true});
add('numeric-reference-identity',['numericRefNames'],'Texto.<ref name="123">Fonte literal.</ref> Outra chamada.<ref name="123" />\n{{Referências}}','Texto.<ref name="ref-123">Fonte literal.</ref> Outra chamada.<ref name="ref-123" />\n{{Referências}}',{references:true,numericRefNames:true});
add('first-reference-definition',['moveNamedRefs'],'Texto.<ref name="fonte" /> Outra chamada.<ref name="fonte">Fonte literal.</ref>\n{{Referências}}','Texto.<ref name="fonte">Fonte literal.</ref> Outra chamada.<ref name="fonte" />\n{{Referências}}',{references:true,moveNamedRefs:true});
add('bare-reference',['bareReferences'],'Texto.<ref>[https://example.invalid/fonte Fonte literal]</ref>\n{{Referências}}','Texto.<ref>{{Citar web|url=https://example.invalid/fonte|título=Fonte literal}}</ref>\n{{Referências}}',{bareReferences:true});
// The original new-audit fixture used "Autoria literal", which does not
// establish a personal name. Retain it as a negative rather than weakening
// the person-list contract to make that ambiguous positive pass.
add('explicit-author-ellipsis',['authors'],'{{Citar web|autor=Maria Silva et al.}}','{{Citar web|autor=Maria Silva|numero-autores=et al}}',{citations:true,authors:true});
add('ambiguous-authorship-ellipsis-retained',['authors'],'{{Citar web|autor=Autoria literal et al.}}','{{Citar web|autor=Autoria literal et al.}}',{citations:true,authors:true});
add('citation-date',['dates'],'{{Citar web|data=3 February 2001}}','{{Citar web|data=3 de fevereiro de 2001}}',{citations:true,dates:true});
add('birth-date-unused-language',['birthDates'],'{{Dni|3|2|2001|lang=br|si}}','{{Dni|3|2|2001|si}}',{birthDates:true});
add('obsolete-disambiguation',['obsoleteTemplates'],'{{Outrosusos|Tema fictício}}','{{Ver desambig||Tema fictício}}',{obsoleteTemplates:true});
// Native 47200509 expands argument 1 as Ver desambig argument 2, preserving
// the intentionally empty first slot. Source SHA-256:
// 7bd89812fc9e3dc19b6035e1f49267128b998047dc5a27bfaf4f5950c6460ab8.
add('ordinary-html-emphasis',['markup'],'Texto com <i>ênfase literal</i>.',"Texto com ''ênfase literal''.",{markup:true});
add('single-line-citation',['singleLineCitations'],'{{Citar web\n|titulo=Fonte literal\n|url=https://example.invalid/fonte\n}}','{{Citar web|titulo=Fonte literal|url=https://example.invalid/fonte}}',{citations:true,singleLineCitations:true});
add('orthography',['automaticSpelling'],'A excessão foi registrada.','A exceção foi registrada.',{automaticSpelling:true},{pair:true,spellingProjection:true});
add('prose-gap',['automaticProseGaps'],'Primeiro texto preservado.\n\n \n\nSegundo texto preservado.','Primeiro texto preservado.\n\nSegundo texto preservado.',{markup:true,syntaxRepairs:true,structuralRepairs:true,automaticProseGaps:true},{pair:true});
add('legacy-heading-call',['automaticLegacyMarkup'],'Texto.\n\n== {{Bibliografia}} ==\n* Livro literal.','Texto.\n\n== Bibliografia ==\n* Livro literal.',{markup:true,syntaxRepairs:true,structuralRepairs:true,headings:true,automaticLegacyMarkup:true});
add('field-separator',['automaticFieldSyntax'],bio('nacionalidade＝Dado literal'),bio('nacionalidade=Dado literal'),{...bioOptions,automaticFieldSyntax:true});
add('native-field-date',['automaticBiographyFields'],bio('nascimento_data=2001-02-03'),bio('nascimento_data={{DataExt|3|2|2001}}'),{...bioOptions,birthDates:true,automaticBiographyFields:true});
add('native-field-accents',['automaticInfoboxValues'],bio('profissao=Pesquisadora'),bio('profissão=Pesquisadora'),{...bioOptions,automaticBiographyFields:true,automaticInfoboxValues:true,automaticParameterNames:true});
add('infobox-position',['automaticInfoboxOrder','structuralRepairs'],"'''Pessoa fictícia''' é uma pesquisadora.\n\n{{Info/Biografia|nome=Pessoa fictícia}}", "{{Info/Biografia|nome=Pessoa fictícia}}\n\n'''Pessoa fictícia''' é uma pesquisadora.",{...bioOptions,automaticInfoboxOrder:true});
add('image-fields',['automaticInfoboxImages'],bio('imagem=[[Ficheiro:Retrato fictício.jpg|alt=Uma pessoa]]'),bio('imagem=Retrato fictício.jpg|alt=Uma pessoa'),{...bioOptions,automaticInfoboxImages:true});
add('occupation-case',['occupationCase'],bio('ocupação=Jornalista'),bio('ocupação=jornalista'),{infoboxes:true,occupationCase:true});
add('living-birth-age',['livingBirthAge'],bio('nascimento_data={{dni|3|2|2001|si}}'),bio('nascimento_data={{dni|3|2|2001}}'),{infoboxes:true,birthDates:true,livingBirthAge:true,livingCategoryConfirmed:true});
add('reading-list-columns',['endMatterColumns'],'== Leitura adicional ==\n'+bibliography,'== Leitura adicional ==\n{{Div col|colunas=2}}\n'+bibliography.trimEnd()+'\n{{Div col fim}}\n',{endMatter:true,endMatterColumns:true});
add('reading-list-parent',['endMatter'],'== Leitura adicional ==\n'+bibliography,'== Leitura adicional ==\n{{Div col|colunas=2}}\n'+bibliography.trimEnd()+'\n{{Div col fim}}\n',{endMatter:true,endMatterColumns:true});
add('section-order',['endSectionOrder'],'== Ligações externas ==\n* Ligação literal.\n\n== Bibliografia ==\n* Livro literal.','== Bibliografia ==\n* Livro literal.\n\n== Ligações externas ==\n* Ligação literal.',{endMatter:true,endSectionOrder:true});
add('citation-key',['automaticSourceCompatibility'],'{{Citar web|título=Fonte literal|acessado-em=5 de março de 2001}}','{{Citar web|título=Fonte literal|acessodata=5 de março de 2001}}',{citations:true,markup:true,syntaxRepairs:true,structuralRepairs:true,automaticParameterNames:true,automaticSourceCompatibility:true},{pair:true});
const tableOptions={markup:true,syntaxRepairs:true,structuralRepairs:true,tableChecks:true,automaticTableRepairs:true,tableSyntaxRepairs:true},
 table='{| class="wikitable sortable"\n! scope="col" | Nome !! scope="col" | Valor\n|-\n| data-sort-vaule="2" | Alfa || Beta\n|-\n| Gama || Delta\n|}\n';
add('table-key',['automaticTableRepairs','tableSyntaxRepairs','tableChecks','syntaxRepairs'],table,table.replace('data-sort-vaule','data-sort-value'),tableOptions);
const withoutScopes='{| class="wikitable"\n! Nome !! Valor\n|-\n| Alfa || Beta\n|-\n| Gama || Delta\n|}\n';
add('table-header-scope',['tableAccessibility'],withoutScopes,withoutScopes.replace('! Nome !! Valor','! scope="col" | Nome !! scope="col" | Valor'),{...tableOptions,tableAccessibility:true});
const wideTable='{| class="wikitable sortable" style="width:100%;min-width:72em;table-layout:fixed;"\n! scope="col" | Nome !! scope="col" | Valor\n|-\n| Alfa || Beta\n|}\n';
add('responsive-table',['responsiveTableWrappers'],wideTable,'<div style="max-width:100%;min-width:0;overflow-x:auto;">\n'+wideTable+'</div>\n',{...tableOptions,responsiveTableWrappers:true});
const graphSource='Texto.<ref name="x">Fonte A.</ref> Outra frase.<ref name="x">Fonte B.</ref>\n{{Referências}}';
add('separate-complete-reference-definitions',['referenceGraphRepairs','automaticReferenceRepairs'],graphSource,graphSource.replace('name="x">Fonte B.','name="x-2">Fonte B.'),{markup:true,syntaxRepairs:true,structuralRepairs:true,references:true,automaticReferenceRepairs:true,referenceGraphRepairs:true});
add('typed-identifier-url',['identifierUrlRepairs'],'{{Citar periódico|pmc=https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567/}}','{{Citar periódico|pmc=1234567}}',{citations:true,markup:true,syntaxRepairs:true,structuralRepairs:true,identifierUrlRepairs:true});
const syntaxOptions={markup:true,syntaxRepairs:true,structuralRepairs:true};
add('redundant-native-reference-heading',['automaticReferenceCollectorHeadings'],'Texto.<ref>Fonte literal.</ref>\n\n== Referências ==\n\n=== Bibliografia ===\n* {{Citar livro|título=Livro literal|ano=2001}}\n\n{{Referências}}','Texto.<ref>Fonte literal.</ref>\n\n== Bibliografia ==\n* {{Citar livro|título=Livro literal|ano=2001}}\n\n{{Referências}}',{...syntaxOptions,references:true,headings:true,automaticReferenceCollectorHeadings:true});
add('literal-citation-key',['automaticCitationKeyRepairs'],'{{Citar web|accessadoem=2001-02-03}}','{{Citar web|acessodata=2001-02-03}}',{...syntaxOptions,citations:true,automaticParameterNames:true,automaticCitationKeyRepairs:true});
add('literal-citation-date-value',['automaticCitationDateValues'],'{{Citar web|data=3-Fev-2001}}','{{Citar web|data=3 de fevereiro de 2001}}',{...syntaxOptions,citations:true,dates:true,automaticCitationDateValues:true});
add('biography-opening-bold',['automaticBiographyLead'],'Pessoa fictícia é uma pesquisadora.',"'''Pessoa fictícia''' é uma pesquisadora.",{...bioOptions,automaticBiographyLead:true});
add('definition-parser-token',['templateDefinitionRepairs'],'{{#if :x|A|B}}','{{#if:x|A|B}}',{...syntaxOptions,templateDefinitionRepairs:true,namespaceNumber:10,pageTitle:'Predefinição:Modelo fictício'});
const compactNav='{{Navbox|nome=Modelo fictício|título=Um título literal suficientemente longo|grupo1=Grupo|lista1=[[Tema|rótulo]]}}';
add('definition-readable-layout',['templateReadableFormatting'],compactNav,'{{Navbox\n|nome=Modelo fictício\n|título=Um título literal suficientemente longo\n|grupo1=Grupo\n|lista1=[[Tema|rótulo]]\n}}',{...syntaxOptions,templateDefinitionRepairs:true,templateReadableFormatting:true,namespaceNumber:10,pageTitle:'Predefinição:Modelo fictício'});
const islandSource='Primeiro texto completo.\n\nTexto “sem fechamento.\n\n== Biografia ==\nTexto.<ref name="origem">{{Cite web|title=Fonte literal|url=https://example.invalid/fonte}}</ref>\n{{Referências}}';
add('literal-citation-island',['automaticCitationIslands','partialSyntaxRecovery'],islandSource,islandSource.replace('Cite web','Citar web').replace('|title=','|título='),{...syntaxOptions,citations:true,references:true,multilingual:true,partialSyntaxRecovery:true,automaticCitationIslands:true},{offExpected:{partialSyntaxRecovery:islandSource.replace('Cite web','Citar web')}});
// Local native redirects have an independent header-only operation. Disabling
// island recovery does not disable that valid native interface preservation.
const localAliasIsland=islandSource;
add('local-native-header-in-incomplete-context',['citations','multilingual'],localAliasIsland,localAliasIsland.replace('Cite web','Citar web'),{...syntaxOptions,citations:true,references:true,multilingual:true,partialSyntaxRecovery:false,automaticCitationIslands:true});
const completePrefix='{{Citar web|título=Fonte verificável|datum=2001-02-03|url=https://example.invalid/fonte}}\n\n',unresolvedReference='Texto.<ref name="aberta">Fonte {{Modelo fictício';
add('recursive-complete-prefix',['partialSyntaxRecovery'],completePrefix+unresolvedReference,completePrefix.replace('|datum=','|data=')+unresolvedReference,{...syntaxOptions,citations:true,references:true,multilingual:true,automaticParameterNames:true,partialSyntaxRecovery:true});
const notesSource='Texto.<ref group="nota">Nota literal.</ref> Outro fato.<ref>Fonte literal.</ref>\n\n{{Notas}}\n{{Referências}}';
add('combined-note-collectors',['unifiedNotesReferences'],notesSource,'Texto.<ref group="nota">Nota literal.</ref> Outro fato.<ref>Fonte literal.</ref>\n\n{{Notas e referências}}',{references:true,unifiedNotesReferences:true});
const generatedStyle='max-width:62em;column-gap:2em;column-width:30em;column-count:2;';
add('remove-generated-reference-style',['referenceColumns'],'Texto.<ref>Fonte literal.</ref>\n{{Referências|estilo='+generatedStyle+'}}','Texto.<ref>Fonte literal.</ref>\n{{Referências}}',{...syntaxOptions,references:true,referenceColumns:true});
add('parent-citation-repair',['citationRepairs'],'{{Citar web|data=2001-02-03 url=https://example.invalid/fonte}}','{{Citar web|data=2001-02-03| url=https://example.invalid/fonte}}',{citations:true,citationRepairs:true});
add('biography-topic-bar',['biographyPortal'],bio('ocupação=pesquisadora'),bio('ocupação=pesquisadora')+'\n\n{{Portal3|Biografias}}\n',{infoboxes:true,portals:true,endMatter:true,biographyPortal:true});
add('explicit-biography-country',['automaticBiographyPortals'],bio('nacionalidade=francesa'),bio('nacionalidade=francesa')+'\n\n{{Portal3|França}}\n',{infoboxes:true,portals:true,endMatter:true,automaticBiographyPortals:true});
const drugSource="{{Info/Droga|nome=Substância fictícia}}\n\n'''Substância fictícia''' é uma substância.";
add('typed-drug-portal',['automaticTopicPortals'],drugSource,drugSource+'\n\n{{Portal3|Farmácia}}\n',{infoboxes:true,portals:true,endMatter:true,automaticTopicPortals:true,pageTitle:'Substância fictícia'});
add('footer-role-order',['endTemplateOrder'],'Texto literal.\n\n[[Categoria:Tema fictício]]\n{{Portal3|Ciência}}','Texto literal.\n\n{{Portal3|Ciência}}\n[[Categoria:Tema fictício]]',{endMatter:true,endTemplateOrder:true});
add('maintenance-call',['maintenance'],'{{Dead link}}','{{Ligação inativa}}',{maintenance:true});
const copyToken=':contentReference[oaicite:0]{index=0}';
add('exact-copy-export-token',['translationResidues'],"'''Tema fictício''' é um conceito.\n\nUm fato verificável."+copyToken+'<ref>Fonte verificável.</ref>\n\n{{Referências}}',"'''Tema fictício''' é um conceito.\n\nUm fato verificável.<ref>Fonte verificável.</ref>\n\n{{Referências}}",{...syntaxOptions,translationResidues:true,pageTitle:'Tema fictício'});
// These options require the editor lifecycle, a confirmed remote proof, or a
// report-specific semantic contract. Their separate suites remain mandatory.
const nonTextObligations={
 autoPreview:'editor preview transport and timeout lifecycle',registryDoiCheck:'read-only registry response and guarded identifier punctuation',
 autoSummary:'editor summary ownership, existing-summary preservation and undo',autoMinor:'editor checkbox baseline and mechanical-change eligibility',
 authorityControl:'fresh source-bound Wikidata authority evidence',redundantBirthCategories:'fresh exact native rendered category proof',
 biographyStyleChecks:'actionable report with known biography discrepancy',dateChecks:'local report of independently invalid complete dates',
 shortCitationChecks:'confirmed shortened-citation target, no unproved missing-target warning',harvardAnchorRepairs:'fresh native rendered anchor proof before applying the separately proposed repair',independentRepairGroups:'complete-object selection and dependency-preserving projection, not a separate automatic source transform',historicalCitationRepairs:'exact article/revision/source-call identity, never a generic fictional template rewrite',tableChecks:'table report plus table-repair parent gate',review:'optional actionable suggestions and explicit application',externalLinkColumns:'optional external-list layout suggestion, distinct from automatic endMatterColumns'
};
const report={schemaVersion:1,kind:'option-action-reachability',runnerSha256:hash(fs.readFileSync(__filename)),status:'passed',bundles:[],cases:[],checks:0,failures:[],optionEvidence:{},remainingObligations:[],wikipediaWrites:0,networkRequests:0,helperInjection:false};
const eq=(actual,expected,label)=>{report.checks++;assert.deepEqual(actual,expected,label);};
// Receipt metadata binds controls to independently supplied fixture endpoints.
// It never reads a calculate result or authorizes a production transformation.
const endpointControlMetadata=(source,options,expected,kind,control=null)=>{
 const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),snapshot=value=>JSON.parse(JSON.stringify(canonical(value))),describe=(s,o,e)=>{const d={sourceSha256:digest(s),optionsSha256:digest(JSON.stringify(canonical(o))),expectedEndpointSha256:digest(e)};return {...d,scenarioSha256:digest(JSON.stringify([d.sourceSha256,d.optionsSha256,d.expectedEndpointSha256]))};},current=describe(source,options,expected),metadata={controlMetadataSchemaVersion:1,requestedOptionsSnapshot:snapshot(options),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:snapshot(Object.fromEntries(Object.entries(options).filter(([,value])=>typeof value!=='boolean'))),declaredEndpoint:current,protectedContext:false,optionGuard:false};
 if(!control){if(source!==expected&&kind==='positive'){metadata.intentSha256=current.scenarioSha256;metadata.intentPairSha256=current.scenarioSha256;}return metadata;}
 const p=control.positive;if(p.source===p.expected)return metadata;const positive=describe(p.source,p.options,p.expected),before=snapshot(p.options),after=snapshot(options),keys=[...new Set([...Object.keys(before),...Object.keys(after)])].sort(),changed=keys.filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
 assert.equal(expected,source,'A declared negative retains the complete literal input');
 const relation={kind:control.kind,positive,control:current,positiveOptionsSnapshot:before};
 if(control.kind==='option-off'){assert.equal(source,p.source,'An option control uses exactly the positive source');assert.equal(changed.length,1,'Exactly one complete option changes');assert.equal(before[changed[0]],true,'The positive option is enabled');assert.equal(after[changed[0]],false,'The negative option is explicitly disabled');relation.option=changed[0];metadata.optionGuard=true;}
 else if(control.kind==='protected'){assert.deepEqual(after,before,'Protected controls retain every complete positive option');assert.equal(source,control.prefix+p.source+control.suffix,'Protected bytes enclose exactly the independent positive source');relation.prefix=control.prefix;relation.suffix=control.suffix;metadata.protectedContext=true;}
 else if(control.kind==='scope-off'){assert.equal(source,p.source,'A scope control uses the exact positive input');assert(changed.length,'A scope control has an explicit context difference');relation.changedOptions=changed;metadata.optionGuard=true;}
 else throw new Error('Unknown declared fixture control relation');
 metadata.sourceBoundControl=relation;metadata.intentSha256=positive.scenarioSha256;metadata.intentPairSha256=positive.scenarioSha256;return metadata;
};
const protectedEndpointControl=(source,positive)=>{const at=source.indexOf(positive.source);assert(at>=0&&source.indexOf(positive.source,at+positive.source.length)===-1,'One literal fixture payload defines the protected relation');return {kind:'protected',positive,prefix:source.slice(0,at),suffix:source.slice(at+positive.source.length)};};
function run(api,bundle,id,source,expected,options,meta={},control=null){
 const controlMetadata=endpointControlMetadata(source,options,expected,meta.kind,control);
 try{
  const first=api.calculate({kind:'adjust',source,originalSource:source,options}),second=api.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});
  eq(first.text,expected,'The full action reaches the independently written endpoint');
  eq(second.text,first.text,'The full action is idempotent');
  eq(first.preservation||[],[],'The permitted action has a complete preservation proof');
  eq(api.preservationAudit(meta.spellingProjection?expected:source,first.text,options),[],'Independent preservation accepts the exact endpoint');
  eq(api.safeComposition(source,first.text,options),'','The complete edit context accepts this transaction');
  report.cases.push({bundle,id,scenarioSha256:scenarioIdentity(source,expected,options),sourceSha256:hash(source),expectedEndpointSha256:hash(expected),actualEndpointSha256:hash(first.text),optionsSha256:hash(JSON.stringify(canonical(options))),intentSha256:hash(id.replace(/-(?:positive|off-.+|protected-.+)$/,'')),enabledBooleanOptions:Object.keys(options).filter(key=>options[key]===true).sort(),scopeContext:{namespaceNumber:options.namespaceNumber,section:options.section??null,sectionOnly:!!options.sectionOnly,contentModel:options.contentModel||'wikitext',pageRedirect:!!options.pageRedirect,pageDisambiguation:!!options.pageDisambiguation,pageTitleSha256:hash(options.pageTitle||'')},expectedRepair:source!==expected,appliedIds:(first.changes||[]).filter(change=>change.count>0).map(change=>change.id),status:'passed',...meta,...controlMetadata});
 }catch(error){report.status='failed';report.cases.push({bundle,id,scenarioSha256:scenarioIdentity(source,expected,options),status:'failed',...meta});report.failures.push({bundle,id,message:error.message});}
}
for(const file of files){
 const api=require(file),bundle=path.basename(file),bytes=fs.readFileSync(file),off=Object.fromEntries(Object.keys(api.defaults).map(key=>[key,false])),base={...off,namespaceNumber:0,pageTitle:'Pessoa fictícia',contentModel:'wikitext',minorBaseConfirmed:true,now:Date.UTC(2026,9,17,12)};
 report.bundles.push({bundle,version:api.version,sha256:hash(bytes),bytes:bytes.length});
 for(const seed of seeds){
  const options={...base,...seed.options};
  run(api,bundle,seed.id+'-positive',seed.source,seed.expected,options,{gates:seed.gates,kind:seed.semanticDisposition==='native-wrapper-preservation'?'preservation':'positive',semanticDisposition:seed.semanticDisposition||'automatic-repair',spellingProjection:!!seed.spellingProjection});
  for(const gate of seed.gates){
   report.optionEvidence[gate]||={positiveIds:[],preservationIds:[],offIds:[],protectedIds:[],pairIds:[]};
   report.optionEvidence[gate][seed.semanticDisposition==='native-wrapper-preservation'?'preservationIds':'positiveIds'].push(seed.id+'-positive');
   report.optionEvidence[gate].offIds.push(seed.id+'-off-'+gate);
   run(api,bundle,seed.id+'-off-'+gate,seed.source,seed.offExpected?.[gate]??seed.source,{...options,[gate]:false},{gates:[gate],kind:'off'},(seed.offExpected?.[gate]??seed.source)===seed.source?{kind:'option-off',positive:{source:seed.source,expected:seed.expected,options}}:null);
  }
  for(const [kind,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['comment',s=>'<!-- '+s+' -->'],['code',s=>'<code>'+s+'</code>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>']]){
   run(api,bundle,seed.id+'-protected-'+kind,wrap(seed.source),wrap(seed.source),options,{gates:seed.gates,kind:'protected'},protectedEndpointControl(wrap(seed.source),{source:seed.source,expected:seed.expected,options}));
   for(const gate of seed.gates)report.optionEvidence[gate].protectedIds.push(seed.id+'-protected-'+kind);
  }
 }
 const pairs=seeds.filter(seed=>seed.pair&&!seed.spellingProjection);
 for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++){
  const left=pairs[i],right=pairs[j];if(left.gates.some(gate=>right.gates.includes(gate)))continue;
  const source=left.source+'\n\n'+right.source,expected=(left.pairExpected?.[right.id]??left.expected)+'\n\n'+(right.pairExpected?.[left.id]??right.expected),id=left.id+'-with-'+right.id;
  run(api,bundle,id,source,expected,{...base,...left.options,...right.options},{gates:[...left.gates,...right.gates],kind:'pair'});
  for(const gate of [...left.gates,...right.gates])report.optionEvidence[gate].pairIds.push(id);
 }
 for(const option of Object.keys(api.defaults))if(!report.optionEvidence[option])report.remainingObligations.push({bundle,option,kind:nonTextObligations[option]?'separate-semantic-or-browser-contract':'missing-directed-text-action',requirement:nonTextObligations[option]||'Add an independent exact positive, opt-out and guard endpoint before claiming directed coverage.'});
 eq(hash(fs.readFileSync(file)),hash(bytes),'The actual runtime stays immutable during the option run');
}
for(const value of Object.values(report.optionEvidence))for(const key of Object.keys(value))value[key]=[...new Set(value[key])];
for(const [option,value]of Object.entries(report.optionEvidence)){
 const cases=report.cases.filter(row=>row.gates?.includes(option));
 value.semanticStatus=cases.some(row=>row.status!=='passed')?'failed-directed-contract':!value.positiveIds.length?'preservation-only-no-positive-directed-contract':value.pairIds.length?'positive-off-protected-and-pairs':'positive-off-and-protected';
 if(value.semanticStatus==='preservation-only-no-positive-directed-contract')report.remainingObligations.push({option,kind:'missing-directed-text-action',requirement:'The retained local native interface is a preservation control. Add a separate primary-proven exact repair-positive source before claiming this option has directed positive coverage.'});
 if(value.semanticStatus==='failed-directed-contract')report.remainingObligations.push({option,kind:'failed-directed-contract',requirement:'Resolve the independent endpoint or scope failure without replacing the expected result by observed behavior.'});
}
report.caseCount=report.cases.length;report.distinctScenarioCount=new Set(report.cases.map(row=>row.scenarioSha256)).size;report.caseUnit='one actual bundle execution; distinctScenarioCount excludes bundle repetitions';report.attemptedDirectedOptionCount=Object.keys(report.optionEvidence).length;report.passedDirectedOptionCount=Object.values(report.optionEvidence).filter(value=>value.semanticStatus.startsWith('positive-')).length;
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

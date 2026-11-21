'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(c=>walk(c,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
function transform(s,name,fn){const found=[];walk(parser.parse(s),n=>{if(n.type==='FunctionDeclaration'&&n.id.name===name)found.push(n);});assert.equal(found.length,1,name);const n=found[0],before=s.slice(n.start,n.end),after=fn(before);assert.notEqual(after,before,name);return {source:s.slice(0,n.start)+after+s.slice(n.end),receipt:{name,beforeSha256:sha(before),afterSha256:sha(after)}};}
function patch(source,helpers){
 let code=source,h=helpers;const changes=[];
 for(const file of ['./v2221_infobox_integration.cjs','./v2221_context_patch.cjs','./v2221_infobox_patch.cjs']){
  const result=require(file).patch(code,h);code=result.code;h=result.helpers;changes.push({patch:file,...result.receipt});
 }
 const reference=require('./v2221_reference_patch.cjs'),rr=reference.patchRuntime(code),rh=reference.patchHelpers(h);code=rr.code;h=rh.code;changes.push(rr.receipt,rh.receipt);
 const citationRetention=require('./v2221_reference_citation_patch.cjs').patch(code);code=citationRetention.code;changes.push(citationRetention.receipt);
 const referencePrerequisite=require('./v2221_reference_prerequisite_patch.cjs').patch(code);code=referencePrerequisite.code;changes.push(referencePrerequisite.receipt);
 const layout=require('./v2221_layout_patch.cjs');for(const key of ['code','helpers']){const result=layout.patch(key==='code'?code:h);if(key==='code')code=result.code;else h=result.code;changes.push({patch:'layout-'+key,...result.proof});}
 const alter=(name,fn)=>{const r=transform(code,name,fn);code=r.source;changes.push(r.receipt);};
 const helper=(name,fn)=>{const r=transform(h,name,fn);h=r.source;changes.push(r.receipt);};
 const stages=[
  ['description-prefix','v2221DescriptionPrefixPlan','v2221DescriptionPrefixProof'],
  ['approved-obsolete-removal','v2221ApprovedObsoleteRemovalPlan','v2221ApprovedObsoleteRemovalProof'],
  ['citation-empty-anonymous-prerequisite','v2221CitationEmptyPartsPrerequisitePlan','v2221CitationEmptyPartsPrerequisiteProof'],
  ['citation-month-year-prerequisite','v2221CitationMonthYearPrerequisitePlan','v2221CitationMonthYearPrerequisiteProof'],
  ['citation-generic-types','v2221CitationTypedPlan','v2221CitationTypedProof'],
  ['citation-headers','v2221CitationHeadersPlan','v2221CitationHeadersProof'],
  ['citation-fields','v2221CitationFieldsPlan','v2221CitationFieldsProof'],
  ['citation-languages','v2221CitationLanguagesPlan','v2221CitationLanguagesProof'],
  ['citation-structured-fields','v2221CitationStructuredFieldsPlan','v2221CitationStructuredFieldsProof'],
  ['citation-values','v2221CitationValuesPlan','v2221CitationValuesProof'],
  ['citation-empty-calls','v2221CitationEmptyCallsPlan','v2221CitationEmptyCallsProof'],
  ['foreign-infobox-final','v2221InfoboxPipelinePlan','v2221InfoboxPipelineProof'],
  ['focused-reference-prerequisite','v2221FocusedReferencePrerequisitePlan','v2221FocusedReferencePrerequisiteProof'],
  ['focused-infobox','v2221FocusedInfoboxPlan','v2221FocusedInfoboxProof'],
  ['focused-portals','v2221FocusedPortalsPlan','v2221FocusedPortalsProof'],
  ['talk-additions','v2221TalkAdditionsPlan','v2221TalkAdditionsProof'],
  ['reference-punctuation','v2221ReferencePunctuationPlan','v2221ReferencePunctuationProof'],
  ['reference-definitions','v2221ReferenceDefinitionsPlan','v2221ReferenceDefinitionsProof'],
  ['references','v2221ReferencePlan','v2221ReferenceProof'],
  ...['Columns','Bibliography','Sisters','Portals','Authority','Stubs','Footer','Whitespace','Talk'].map(name=>['layout-'+name.toLowerCase(),'v2221Layout'+name+'Plan','v2221Layout'+name+'Proof'])
 ];
 alter('v2212PrepareEvidence',raw=>once(raw,'...v222InferencePortalRequests(source,cfg),','...v2221FocusedPortalRequests(source,cfg),...v222InferencePortalRequests(source,cfg),'));
 alter('v222PreviousAuditRepairPlan',raw=>once(raw,"apply('2.22.0-inference-initial'","apply('2.22.1-focused-reference-prerequisite-initial',v2221FocusedReferencePrerequisitePlan,v2221FocusedReferencePrerequisiteProof);apply('2.22.1-focused-infobox-initial',v2221FocusedInfoboxPlan,v2221FocusedInfoboxProof);apply('2.22.1-focused-portals-initial',v2221FocusedPortalsPlan,v2221FocusedPortalsProof);apply('2.22.0-inference-initial'"));
 alter('v222PreviousAuditRepairPlan',raw=>once(raw,"apply('2.22.1-foreign-infobox-initial'",stages.filter(([label])=>label==='description-prefix'||label==='approved-obsolete-removal'||label.startsWith('citation-')).map(([label,make,prove])=>`apply('2.22.1-${label}-initial',${make},${prove});`).join('')+"apply('2.22.1-foreign-infobox-initial'"));
 alter('v222PreviousAuditRepairPlan',raw=>once(raw,'return plan;',"for(let v2221Round=0;v2221Round<2;v2221Round++){const v2221BeforeRound=plan.text;"+stages.map(([label,make,prove])=>`apply('2.22.1-${label}-final',${make},${prove});`).join('')+"if(plan.text===v2221BeforeRound)break;}return plan;"));
 helper('v222CoreStages',raw=>{
  const first=once(raw,'const rows=[',"const rows=[['description-prefix-initial','v2221DescriptionPrefixPlan','v2221DescriptionPrefixProof'],['approved-obsolete-removal-initial','v2221ApprovedObsoleteRemovalPlan','v2221ApprovedObsoleteRemovalProof'],");
  const prerequisite=once(first,"['infoboxes','v222InfoboxPlan','v222InfoboxProof']","['focused-reference-prerequisite-initial','v2221FocusedReferencePrerequisitePlan','v2221FocusedReferencePrerequisiteProof'],['infoboxes','v222InfoboxPlan','v222InfoboxProof']");
  const typed=once(prerequisite,"['citations','v222CitationsPlan','v222CitationsProof']","['citation-empty-anonymous-prerequisite-initial','v2221CitationEmptyPartsPrerequisitePlan','v2221CitationEmptyPartsPrerequisiteProof'],['citation-month-year-prerequisite-initial','v2221CitationMonthYearPrerequisitePlan','v2221CitationMonthYearPrerequisiteProof'],['citation-generic-types-initial','v2221CitationTypedPlan','v2221CitationTypedProof'],['citations','v222CitationsPlan','v222CitationsProof']");
  const aligned=once(typed,"['ref-orphans','v222ReferenceOrphansPlan','v222ReferenceOrphansProof']","['reference-punctuation-initial','v2221ReferencePunctuationPlan','v2221ReferencePunctuationProof'],['reference-definitions-initial','v2221ReferenceDefinitionsPlan','v2221ReferenceDefinitionsProof'],['references-initial','v2221ReferencePlan','v2221ReferenceProof']");
  return once(aligned,'return rows.filter',`rows.push(...${JSON.stringify(stages)},...${JSON.stringify(stages)});return rows.filter`);
 });
 helper('v222CorePrefix',raw=>once(raw,'(e.count??1)<1','(e.count??1)<0'));
 alter('prepareAutomaticProofs',raw=>once(raw,'task.preflightRequests||=[];','Object.assign(cfg,await v2221PrepareTalkEvidence(task,cfg));task.guard();task.preflightRequests||=[];'));
 alter('serializableOptions',raw=>once(once(raw,"'v2221InfoboxCatalogJson']","'v2221InfoboxCatalogJson','v2221InfoboxSourceWiki','v2221TalkArticleSource','talkProjectProofs']"),"['v2221InfoboxCatalogJson','contentModel',","['v2221InfoboxSourceWiki','v2221TalkArticleSource','v2221InfoboxCatalogJson','contentModel',"));
 code=once(code,"if(namespace===1&&editingSection()===null)actions.append(control('Criar código',prepareTalkHeader,'ajg-prepare-talk','Criar PD e marcas de projeto no código da discussão, com opção de desfazer. Não publica a página.','create-talk-code'));",'');
 alter('prepareTalkHeader',()=> '');
 // Only the short linked phrase is interactive. The editor remains open.
 code=once(code,"'Aplica ajustes automáticos ao rascunho, sem publicar.';const intro=node('p',introText,'ajg-intro');","'Aplica ajustes automáticos ao rascunho.';const intro=node('p',introText,'ajg-intro');if(introText==='Aplica ajustes automáticos ao rascunho.'){const help=node('a','ajustes automáticos');help.href='https://pt.wikipedia.org/wiki/Usuário:Daniel_G_Rego/RevisaWiki';help.target='_blank';help.rel='noopener noreferrer';intro.replaceChildren(root.document.createTextNode('Aplica '),help,root.document.createTextNode(' ao rascunho.'));}");
 parser.parse(code);parser.parse(h);return {code,helpers:h,receipt:{sourceSha256:sha(source),helpersSha256:sha(helpers),changes,wikipediaWrites:0}};
}
if(require.main===module){const[input,helpers,out,helpersOut,receipt]=process.argv.slice(2),r=patch(fs.readFileSync(input,'utf8'),fs.readFileSync(helpers,'utf8'));fs.writeFileSync(out,r.code);fs.writeFileSync(helpersOut,r.helpers);fs.writeFileSync(receipt,JSON.stringify(r.receipt,null,2)+'\n');}
module.exports={patch};

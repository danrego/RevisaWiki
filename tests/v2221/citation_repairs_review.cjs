'use strict';
// Observational audit: a failed editorial expectation is retained as evidence.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {load,cfg}=require('./harness.cjs'),api=process.env.REVISAWIKI_CURRENT_CORE?require(path.resolve(process.env.REVISAWIKI_CURRENT_CORE)):load(['citation_repairs']);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),options={...api.defaults,...cfg};
const probes=[
 ['type-archive-source','Headers','{{Citar web|título=Artigo|obra=Revista|issn=0378-5955|arquivourl=https://web.archive.org/web/20200101000000/https://example.org/a}}','preserve','A web source with an archive URL is excluded by the frozen family-recovery contract.'],
 ['type-no-title','Headers','{{Citar web|obra=Revista|issn=0378-5955}}','preserve','The frozen contract requires an explicit article title before recovering a journal family.'],
 ['type-invalid-issn','Headers','{{Citar web|título=Página de revista|obra=Revista|issn=1234-567X}}','preserve','A shape-only invalid ISSN without volume/issue/pages is not sufficient evidence for a source-type change.'],
 ['type-explicit-locators','Headers','{{Citar web|título=Artigo|periódico=Revista|issn=0378-5955|volume=12|número=3|páginas=45–50}}','change','Explicit article/periodical metadata with equivalent reader roles.'],
 ['type-valid-main-url','Headers','{{Citar web|título=Artigo|obra=Revista|issn=0378-5955|url=https://example.org/a}}','preserve','A valid main URL keeps the existing source family.'],
 ['author-vancouver-first','StructuredFields','{{Citar periódico|vauthors=Alfa AB|primeiro=Pessoa|título=Artigo}}','preserve','The frozen orphan-first-name rule excludes Vancouver lists.'],
 ['author-real-surname','StructuredFields','{{Citar periódico|primeiro=Ana|último=Silva|título=Artigo}}','preserve','A genuine split person remains split.'],
 ['author-literal-name','StructuredFields','{{Citar livro|primeiro=Ana Silva|título=Obra}}','change','A literal unsplit author gains the literal-author role without splitting the name.'],
 ['doi-resolver-query','Values','{{Citar periódico|título=Artigo|doi=https://doi.org/10.1000/182?download=1}}','preserve','A resolver query is not proven to be part of the DOI suffix.'],
 ['doi-resolver-fragment','Values','{{Citar periódico|título=Artigo|doi=https://doi.org/10.1000/182#page=3}}','preserve','A resolver fragment is not proven to be part of the DOI suffix.'],
 ['doi-case-and-punctuation','Values','{{Citar periódico|título=Artigo|doi=https://doi.org/10.1000/AB.C;D}}','change','A complete literal DOI suffix preserves its case and punctuation.'],
 ['title-existing-conflict','Values','{{Citar web|url=https://example.org/a|title=Obra|título=}}','preserve','An empty competing title cannot erase a populated title alias.'],
 ['title-host-fallback','Values','{{Citar web|url=https://example.org/a}}','change','The explicitly authorized host label is a fallback link label, not invented bibliographic metadata.'],
 ['title-private-host','Values','{{Citar web|url=https://127.0.0.1/a}}','preserve','No host fallback is synthesized for an address literal.'],
 ['alias-native-publisher-roles','Fields','{{Citar web|website=Site|publisher=Entidade}}','change','The separate source roles remain separate.'],
 ['alias-competing-values','Fields','{{Citar web|website=Site|obra=Outro}}','preserve','Conflicting aliases are not silently overwritten.'],
 ['empty-call-with-identifier','EmptyCalls','Texto.<ref>{{Citar web|id=Identidade}} {{Citar web|título=Fonte|url=https://example.org}}</ref>','preserve','An apparent empty call with real identifier metadata is preserved.']
];
const results=[];global.fetch=()=>{throw Error('Network is disabled in local audit');};
for(const[id,stage,source,expectation,reason]of probes){const p=api['v2221Citation'+stage+'Plan'](source,options),proof=api['v2221Citation'+stage+'Proof'](source,p.text,p,options),result=api.calculate({kind:'adjust',source,originalSource:source,options});
 results.push({id,stage,source,expectation,reason,stageOutput:p.text,stageProof:proof,stageChanged:p.text!==source,expectationMet:expectation==='preserve'?p.text===source:p.text!==source,fullOutput:result.text,fullSafety:api.v219AutomaticResultSafety(source,result),inputSha256:sha(source),outputSha256:sha(result.text)});}
const report={kind:'citation-semantic-counterexample-review',engineVersion:api.version,explicitCoreSha256:process.env.REVISAWIKI_CURRENT_CORE?sha(fs.readFileSync(process.env.REVISAWIKI_CURRENT_CORE,'utf8')):null,cases:results.length,results,networkRequests:0,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:results.length,editorialExpectationFailures:results.filter(r=>!r.expectationMet).map(r=>r.id),proofFailures:results.filter(r=>!r.stageProof).map(r=>r.id)}));

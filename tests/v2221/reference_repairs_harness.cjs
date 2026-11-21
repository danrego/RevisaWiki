'use strict';
// New rules execute inside the pinned engine, with its actual readers/proofs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),parser=require('@babel/parser');
const root=path.resolve(__dirname,'../..'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function load(){
 if(process.env.REVISAWIKI_CURRENT_CORE){const api=require(path.resolve(process.env.REVISAWIKI_CURRENT_CORE));if(typeof api.v2221ReferencePlan!=='function')throw Error('Current build lacks reference rules');return {api,cfg:{...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false},sha};}
 const base=process.env.REVISAWIKI_BASE_REPOSITORY||path.resolve(root,'../../../2.21.0/repository'),file=path.join(base,'artifacts/v2220/build/v2220_runtime.cjs.js'),source=fs.readFileSync(file,'utf8');
 if(sha(source)!=='fad84a53b4c5a96f923fddcf2fee3f32232910a0ee7a037265a7f4282191f4aa')throw Error('Frozen runtime pin differs');
 const nodes=[];function visit(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionExpression'&&n.id?.name==='RevisaWikiBoot')nodes.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}}
 visit(parser.parse(source));if(nodes.length!==1)throw Error('Single lexical engine required');
 const old=fs.readdirSync(path.join(root,'src/v2_22')).filter(n=>n.endsWith('.js')).sort().map(n=>fs.readFileSync(path.join(root,'src/v2_22',n),'utf8')).join('\n'),fresh=fs.readFileSync(path.join(root,'src/v2_22_1/reference_repairs.js'),'utf8');
 const adapters=require('../../scripts/v2221_reference_patch.cjs');let helpers=adapters.patchHelpers(old+'\n'+fresh).code;const names=[...helpers.matchAll(/^(?:async )?function (v222\w+)\(/gm)].map(m=>m[1]);
 // This temporary integration mirrors the coordinator's stage registration;
 // no historical source or distribution is written or modified.
 helpers=helpers.replace("['ref-orphans','v222ReferenceOrphansPlan','v222ReferenceOrphansProof']","['reference-punctuation-initial','v2221ReferencePunctuationPlan','v2221ReferencePunctuationProof'],['reference-definitions-initial','v2221ReferenceDefinitionsPlan','v2221ReferenceDefinitionsProof'],['references-initial','v2221ReferencePlan','v2221ReferenceProof']");
 helpers=helpers.replace("['citations','v222CitationsPlan','v222CitationsProof']","['citation-empty-anonymous-prerequisite-initial','v2221CitationEmptyPartsPrerequisitePlan','v2221CitationEmptyPartsPrerequisiteProof'],['citation-month-year-prerequisite-initial','v2221CitationMonthYearPrerequisitePlan','v2221CitationMonthYearPrerequisiteProof'],['citation-generic-types-initial','v2221CitationTypedPlan','v2221CitationTypedProof'],['citations','v222CitationsPlan','v222CitationsProof']");
 const catalog={syntax:JSON.parse(fs.readFileSync(path.join(root,'src/v2_22/syntax_data.json'),'utf8')),inference:JSON.parse(fs.readFileSync(path.join(root,'src/v2_22/inference_data.json'),'utf8'))};
 const citation=fs.readFileSync(path.join(root,'src/v2_22_1/citation_repairs.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/v2_22_1/reference_citation_retention.js'),'utf8');helpers+='\n'+citation;names.push(...[...citation.matchAll(/^(?:async )?function (v2221\w+)\(/gm)].map(m=>m[1]));
 let patched=require('../../scripts/v2221_reference_citation_patch.cjs').patch(adapters.patchRuntime(source).code).code;
 const initialCitationStages=[['empty-anonymous-prerequisite','EmptyPartsPrerequisite'],['month-year-prerequisite','MonthYearPrerequisite'],['generic-types','Typed'],['headers','Headers'],['fields','Fields'],['languages','Languages'],['structured-fields','StructuredFields'],['values','Values'],['empty-calls','EmptyCalls']];
 const initialNeedle="apply('2.22.0-inference-initial'";if(patched.split(initialNeedle).length!==2)throw Error('One exact initial stage insertion required');
 patched=patched.replace(initialNeedle,initialCitationStages.map(([label,name])=>"apply('2.22.1-citation-"+label+"-initial',v2221Citation"+name+"Plan,v2221Citation"+name+"Proof);").join('')+initialNeedle);
 const tree=parser.parse(patched),boots=[];function find(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionExpression'&&n.id?.name==='RevisaWikiBoot')boots.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(find);else if(v&&typeof v==='object')find(v);}}find(tree);
 let boot=patched.slice(boots[0].start,boots[0].end),bridge='const V222_CATALOG='+JSON.stringify(catalog)+';\n'+helpers+'\nconst V222_MODULE_FUNCTIONS={'+names.join(',')+'};\n';
 boot=boot.replace('const api={',()=>bridge+'const api={');boot=boot.replace("if(typeof module==='object'&&module.exports){",()=>`Object.assign(api,{${names.join(',')}});if(typeof module==='object'&&module.exports){`);
 const data=require(path.join(root,'dist/2.22.0/RevisaWiki_v2_22_0_dados.js')),context={RevisaWikiDataV2:data,module:{exports:{}},console,TextEncoder,TextDecoder,URL,URLSearchParams,setTimeout,clearTimeout,performance};
 vm.runInNewContext('('+boot+')(globalThis);',context,{filename:'reference-rules-under-frozen-engine.cjs'});
 const api=context.module.exports,cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false};
 return {api,cfg,sha,baselineSha256:sha(source),helperSha256:sha(fresh)};
}
module.exports={load};

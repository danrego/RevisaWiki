'use strict';
// Endpoint expectations below are selected from independently reviewed primary
// contracts. This module never imports a production runtime or repair helper.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),bytes=fs.readFileSync(path.join(__dirname,'catalog_primary_contracts.json')),C=JSON.parse(bytes),norm=s=>String(s).normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt'),nativeKey=s=>String(s).normalize('NFC').replace(/_/g,' ').replace(/[ \t\r\n]+/g,' ').trim().replace(/^(?:template|predefinição)\s*:\s*/i,''),same=(a,b)=>{a=nativeKey(a);b=nativeKey(b);return a&&b&&a[0].toLocaleUpperCase('pt')===b[0].toLocaleUpperCase('pt')&&a.slice(1)===b.slice(1);},capitalize=s=>s[0].toLocaleUpperCase('pt')+s.slice(1),bankById=new Map(C.bankRows.map(row=>[row.id,row])),plain=source=>/^\{\{([^{}|]+)(?=\||\}\})/.exec(source)?.[1],fields=source=>{const head=plain(source);if(!head||/[{}<>\[\]]/.test(source.slice(2+head.length,-2)))return null;const text=source.slice(2+head.length,-2);return text?text.slice(1).split('|').map((v,i)=>{const at=v.indexOf('=');return at<0?{key:String(i+1),value:v,positional:true}:{key:v.slice(0,at).trim(),value:v.slice(at+1),positional:false};}):[];},sourceBound=(profile,row)=>profile?.source?.language===row.source?.language&&profile.source.title===row.source.title&&(profile.source.oldid??null)===(row.source.oldid??null);
const nativeHeaderScopeBytes=fs.readFileSync(path.join(__dirname,'catalog_native_header_scope_contract.json'));
if(sha(nativeHeaderScopeBytes)!=='7e6bc43d6cfde6a34563594a62ab466ecbc62290f73ada8d5b0fa6f534a9233d')throw new Error('The exact native header scope adjudication changed');
const nativeHeaderScope=JSON.parse(nativeHeaderScopeBytes),nativeHeaderScopeRows=new Map(nativeHeaderScope.rows.map(row=>[row.id,row])),scopeCanonical=value=>Array.isArray(value)?value.map(scopeCanonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,scopeCanonical(value[key])])):value;
const nativeReflistBytes=fs.readFileSync(path.join(__dirname,'native_reflist_contract.json'));
if(sha(nativeReflistBytes)!=='b6c307385c543807211302ad30f4ebdbaf040a9bfa59575f106491c636a258ac')throw new Error('The original native Reflist policy contract changed');
const compositionAdjudicationBytes=fs.readFileSync(path.join(__dirname,'catalog_native_header_composition_adjudication.json'));
if(sha(compositionAdjudicationBytes)!=='5d7dc14dac0749a94f56acefffe7e4ad6b03814d499b371461de927f240d96ae')throw new Error('The independently reviewed header/key adjudication changed');
const compositionAdjudication=JSON.parse(compositionAdjudicationBytes);
function amend(test,ctx){
 const original=test.expected,record=(expected,reason,contract)=>({test:{...test,expected,...(Object.hasOwn(test,'helperExpected')?{helperExpected:expected}:{}),branch:{...(test.branch||{}),primaryOracleAmendment:{reason,contract,oldExpectedSha256:sha(original),contractSha256:sha(bytes)}}},review:{id:test.id,category:test.category,scenario:test.scenario,source:test.source,options:test.options,oldExpected:original,newExpected:expected,changed:expected!==original,reason,contract}});
 if(test.category==='foreign-image-option')return record(test.source,'accepted-native-file-head-does-not-authorize-imported-caption-flag','nativeMedia');
 if(test.category==='foreign-namespace'){
  const alias=test.identity[0],target=test.identity[1];
  if(C.nativeMedia.acceptedFileHeads.some(name=>same(alias,name))||/^categoria:?$/i.test(target.replace(/:$/,'')))return record(test.source,'native-file-alias-or-category-without-required-sourceproof-preserved','nativeMedia');
 }
 const bank=bankById.get(test.id);if(bank){if(bank.source!==test.source)throw new Error('Bank original source drift '+test.id);return record(bank.proposedExpected,'exact-source-selected-bank-group-body-layout-and-native-priority',bank.sourceContract);}
 // The native Reflist contract deliberately retains unproved supplied fields,
 // including an empty unknown field. A generic complete-profile expectation
 // must not replace that separately pinned, more conservative interface rule.
 if(test.category==='native-unknown'&&test.scenario==='unknown-empty-field'&&test.identity?.[0]==='template'&&same(test.identity[1],'Reflist')&&same(plain(test.source),'Reflist')){
  const supplied=fields(test.source);
  if(supplied?.length===1&&!supplied[0].positional&&supplied[0].key==='campo_catalogo_sem_destino_7349'&&supplied[0].value===''){
   const result=record(test.source,'native-Reflist-unknown-argument-preserved','native_reflist_contract56151616');
   result.test.branch.primaryOracleAmendment.nativeInterfaceContractSha256=sha(nativeReflistBytes);
   result.review.nativeInterfaceContractSha256=sha(nativeReflistBytes);return result;
  }
 }
 const foreign=test.category.startsWith('foreign-')||test.category==='default-integration-foreign',head=plain(test.source);
 if(!head)return null;
 // A generated protected parent or quote never acquires the child interface.
 const alias=Array.isArray(test.identity)?test.identity[0]:null;
 if(!foreign||typeof alias!=='string'||!same(head,alias))return null;
 if(test.category.includes('protected')||test.category.includes('guard')||test.options.multilingual!==true)return null;
 const profile=Object.hasOwn(ctx.data.translationRules.profiles,norm(alias))?ctx.data.translationRules.profiles[norm(alias)]:null;
 const nativeRedirect=C.otherRedirects.find(row=>same(head,row.title))||C.citeLocal.redirects.find(row=>same(head,row.title))||C.existingLocalCite.find(row=>same(head,row.title)),nativeWrapper=C.otherWrappers.find(row=>same(head,row.title))||C.citeLocal.wrappers.find(row=>same(head,row.title));
 if(nativeWrapper)return record(test.source,'existing-native-wrapper-does-not-acquire-foreign-roles',nativeWrapper.oldid);
 if(nativeRedirect&&same(head,'Official website')){
  const p=fields(test.source),candidates=p?.filter(field=>field.key!=='url'&&norm(field.key)==='url')||[];
  if(candidates.length&&(candidates.length!==1||!/^[uU][rR][lL]$/.test(candidates[0].key)||candidates[0].value!=='https://example.invalid/catalogo'||p.some(field=>field!==candidates[0]&&(field.key==='url'||field.key==='1'))))return record(test.source,'unsupported-original-Oficial-URL-case-input-quietly-preserved','Oficial70230751-original-URL-contract');
 }
 const headerScope=nativeHeaderScopeRows.get(test.id);
 if(headerScope){
  if(test.category!==headerScope.category||test.scenario!==headerScope.scenario||test.source!==headerScope.source||sha(test.source)!==headerScope.sourceSha256||
   sha(JSON.stringify(scopeCanonical(test.options)))!==headerScope.optionsSha256||test.expected!==headerScope.oldExpected||sha(test.expected)!==headerScope.oldExpectedEndpointSha256||
   test.helperExpected!==headerScope.oldHelperExpected||nativeRedirect?.oldid!==headerScope.nativeAliasOldid||nativeRedirect.target!==headerScope.nativeTarget||
   test.options.syntaxRepairs!==false||test.options.structuralRepairs!==false||headerScope.expected!==headerScope.source||headerScope.helperExpected!==headerScope.source)throw new Error('Review the exact native header source/options/old expectation before changing its scope');
  const adjudication=compositionAdjudication.headerRows.find(row=>row.id===test.id);
  if(!adjudication||adjudication.source!==test.source||adjudication.optionsSha256!==headerScope.optionsSha256||
     adjudication.oldExpected!==headerScope.oldExpected||adjudication.oldHelperExpected!==headerScope.oldHelperExpected||
     adjudication.nativeAliasOldid!==nativeRedirect.oldid||adjudication.nativeTarget!==nativeRedirect.target)throw new Error('Exact original native header adjudication mismatch');
  const result=record(adjudication.oldExpected,'valid-native-header-forwarding-retains-every-argument','catalog_native_header_composition_adjudication');
  if(Object.hasOwn(test,'helperExpected'))result.test.helperExpected=adjudication.oldHelperExpected;
  result.test.branch.primaryOracleAmendment.priorScopeContractSha256=sha(nativeHeaderScopeBytes);
  result.test.branch.primaryOracleAmendment.compositionAdjudicationSha256=sha(compositionAdjudicationBytes);
  result.review.compositionAdjudicationSha256=sha(compositionAdjudicationBytes);return result;
 }
 if(nativeRedirect){
  const enabled=nativeRedirect.kind==='infobox'?test.options.infoboxes!==false:test.options.auxiliaryTemplates!==false||profile?.kind==='citation'&&test.options.citations!==false;
  if(!enabled)return record(test.source,'local-interface-feature-off',nativeRedirect.oldid);
  const raw='{{'+capitalize(nativeRedirect.target)+test.source.slice(2+head.length),p=fields(test.source);
  const exactRepair=compositionAdjudication.declaredRepairs.find(row=>row.id===test.id);
  if(exactRepair){
   if(test.category!=='default-integration-foreign'||test.scenario!=='proved-field-with-all-default-rules'||
      test.source!==exactRepair.source||p?.length!==1||p[0].key!==exactRepair.sourceKey||p[0].value!=='Valor literal'||
      nativeRedirect.oldid!==exactRepair.nativeAliasOldid||test.options.automaticParameterNames!==true||
      (nativeRedirect.kind==='infobox'?test.options.infoboxes!==true:test.options.citations!==true))throw new Error('Exact declared-key default composition changed');
   const result=record(exactRepair.expected,'native-header-plus-separately-proved-supplied-key-repair','catalog_native_header_composition_adjudication');
   if(Object.hasOwn(test,'helperExpected'))result.test.helperExpected=nativeRedirect.kind==='infobox'?exactRepair.expected:raw;
   result.test.branch.primaryOracleAmendment.compositionAdjudicationSha256=sha(compositionAdjudicationBytes);
   result.review.compositionAdjudicationSha256=sha(compositionAdjudicationBytes);return result;
  }
  // A separately declared supplied-key repair may compose after the native
  // header forward. The redirect does not authorize foreign argument roles.
  if(test.category==='default-integration-foreign'&&test.options.automaticParameterNames!==false&&test.options.citations!==false&&p?.length===1&&p[0].key==='titre'&&p[0].value==='Valor literal'&&['citar web','citar livro'].includes(norm(nativeRedirect.target))){
   const result=record('{{'+capitalize(nativeRedirect.target)+'|título=Valor literal}}','native-header-forward-plus-explicit-declared-title-key-repair','predecessor72349758-c.citation.tradpred.124-and-nativeTitle73016847');
   if(Object.hasOwn(test,'helperExpected'))result.test.helperExpected=raw;
   return result;
  }
  return record(raw,'exact-native-redirect-header-only-raw-arguments',nativeRedirect.oldid);
 }
 if(!profile)return null;
 const parts=fields(test.source);if(!parts)return null;
 if(C.infobox.rows.some(row=>norm(row.alias)===norm(alias)&&parts.some(field=>field.key===row.field)))return record(test.source,'unproved-foreign-infobox-explicit-role-preserved','infobox');
 if(profile.kind!=='citation')return null;
 if(C.citeCross.bindings.some(row=>sourceBound(profile,row)&&parts.some(field=>norm(field.key)===row.key)))return record(test.source,'unproved-cross-role-activation-preserved','citeCross');
 if(C.citeUnproved.bindings.some(row=>sourceBound(profile,row)&&parts.some(field=>norm(field.key)===row.sourceKey)))return record(test.source,'unproved-guessed-key-activation-preserved','citeUnproved');
 if(C.citeTarget.unsupportedLiteralTargets.some(row=>sourceBound(profile,row)&&parts.some(field=>norm(field.key)===row.sourceKey)))return record(test.source,'unsupported-native-target-role-preserved','citeTarget.unsupportedLiteralTargets');
 // Existing collision cases retain their complete source until a separate
 // independently authored collision contract proves a repair.
 if(/conflict|collision/.test(test.scenario))return null;
 const correction=C.citeTarget.literalTargetCorrections.find(row=>sourceBound(profile,row)&&parts.some(field=>norm(field.key)===row.sourceKey));
 if(correction&&parts.length===1){const target=ctx.canonicalTarget(alias,profile),field=parts[0];if(correction.newTarget==='capítulourl'&&!/^https?:\/\/[^\s<>{}\[\]]+$/.test(field.value))return record(test.source,'retained-original-nonURL-input-does-not-acquire-typed-URL-role','citeTarget.literalTargetCorrections-and-native-literal-HTTP-boundary');return record('{{'+target+'|'+correction.newTarget+'='+field.value+'}}','source-donor-and-native-target-role-correction','citeTarget.literalTargetCorrections');}
 if(test.category==='foreign-numbered'&&test.scenario==='explicit-numbered-field'){
  const [name,base,pattern,index]=test.identity;
  if(typeof pattern==='string'&&pattern.includes('#')){
   const proved=C.citeTarget.numberedPatternCorrections.find(row=>sourceBound(profile,row)&&row.sourceBase===base&&row.declaredTargetPattern===pattern);
   if(!proved||!Number.isInteger(index)||index<1||index>99)return record(test.source,'unproved-or-outside-finite-numbered-pattern-boundary','citeTarget.numberedPatternCorrections');
   return record('{{'+ctx.canonicalTarget(alias,profile)+'|'+pattern.replace('#',String(index))+'='+parts[0].value+'}}','source-donor-terminal-placeholder-substitution','citeTarget.numberedPatternCorrections');
  }
 }
 return null;
}
const selfSha256=sha(fs.readFileSync(__filename));
module.exports={amend,contractSha256:sha(bytes),contract:C,sourceSha256:selfSha256,inputsUnchanged:()=>sha(fs.readFileSync(__filename))===selfSha256&&sha(fs.readFileSync(path.join(__dirname,'catalog_primary_contracts.json')))===sha(bytes)&&sha(fs.readFileSync(path.join(__dirname,'catalog_native_header_scope_contract.json')))===sha(nativeHeaderScopeBytes)&&sha(fs.readFileSync(path.join(__dirname,'native_reflist_contract.json')))===sha(nativeReflistBytes)&&sha(fs.readFileSync(path.join(__dirname,'catalog_native_header_composition_adjudication.json')))===sha(compositionAdjudicationBytes)};

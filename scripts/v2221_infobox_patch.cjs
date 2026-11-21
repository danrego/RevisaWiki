'use strict';
// Patches the frozen build input only. Released files remain immutable.
const assert=require('node:assert/strict'),parser=require('@babel/parser'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const[key,value]of Object.entries(node)){if(['loc','start','end','extra'].includes(key))continue;if(Array.isArray(value))value.forEach(child=>walk(child,fn));else if(value&&typeof value==='object')walk(value,fn);}}
function patch(source,helpers){
 let code=source,helperCode=helpers;const changes=[];
 function change(input,name,transform){const found=[];walk(parser.parse(input),node=>{if(node.type==='FunctionDeclaration'&&node.id.name===name)found.push(node);});assert.equal(found.length,1,name);const node=found[0],before=input.slice(node.start,node.end),after=transform(before,node);assert.notEqual(before,after,name);changes.push({name,beforeSha256:sha(before),afterSha256:sha(after)});return input.slice(0,node.start)+after+input.slice(node.end);}
 code=change(code,'v2217InfoboxFormatCall',raw=>{let calls=0;const next=raw.replace(/v2217InfoboxNamedTrim\((f\.value|values\[i\]\.value)\)/g,(_,value)=>{calls++;return 'v2221FocusedInfoboxSpacingValue('+value+')';});assert.equal(calls,2,'Both formatting and comparison must use the same whitespace contract');return next;});
 code=change(code,'v2215PreferredCall',raw=>{const before="if(cfg.markup!==false&&f.spaces)add(f.spaceStart,f.spaceStart+f.spaces.length,'','v2215ParameterSpacing');";assert.equal(raw.split(before).length,2);return raw.replace(before,"if(cfg.markup!==false&&f.spaces){const padding=infobox&&v2221InfoboxTrim(f.value)&&!(/^[ \\t]*\\r?\\n/.test(f.value))?' ':'';if(f.spaces!==padding)add(f.spaceStart,f.spaceStart+f.spaces.length,padding,'v2215ParameterSpacing');}");});
 code=change(code,'v2217CountryValues',raw=>{const before='let view=v24SyntaxProtected(value).view;';assert.equal(raw.split(before).length,2);return raw.replace(before,'let view=v24SyntaxProtected(v2221InfoboxTrim(value)).view;');});
 for(const name of ['v2217InfoboxFormatCall','v2217InfoboxLocalizedValue'])code=change(code,name,raw=>{const before='templates(v24SyntaxProtected(value).view)';assert.equal(raw.split(before).length,2);return raw.replace(before,'templates(v2221FocusedValueView(value))');});
 code=change(code,'v2217PortalCandidates',raw=>{const before='const v=v24SyntaxProtected(field.value).view;';assert.equal(raw.split(before).length,2);return raw.replace(before,'const v=v24SyntaxProtected(v2221InfoboxTrim(field.value)).view;');});
 code=change(code,'v221BioMappingEdits',raw=>{const before='caption&&!v221BioLiteralImage(box)',maps='V221_INFOBOX_MAPPINGS.filter(mapping=>mapping.owner===box.name)';assert.equal(raw.split(before).length,2,'One legacy caption-image guard');assert.equal(raw.split(maps).length,2,'One native mapping selection');return raw.replace(before,'caption&&!v221BioLiteralImage(box)&&!v2221FocusedCaptionKeyRepair(source,cfg,box,mapping,field)').replace(maps,maps+'.map(mapping=>v2221FocusedNativeMapping(source,cfg,box,mapping))');});
 // Only the old opening-text branch mistakes "banda desenhada" for a band.
 // An independent explicit musical genre and an existing portal stay intact.
 code=change(code,'v2212PortalFromBox',raw=>{const before='/(?:^|[^\\p{L}])álbum';assert.equal(raw.split(before).length,2);return raw.replace(before,'!v2221FocusedAlbumConflict(doc.source)&&'+before);});
 // A birth name is not automatically a full name. The old target is not read
 // by the pinned native infobox. Explicit native-wrapper contracts are separate.
 const matches=[];walk(parser.parse(code),node=>{if(node.type==='VariableDeclarator'&&node.id?.name==='V2217_PERSON_FIELDS')matches.push(node);});assert.equal(matches.length,1,'person field table');
 const object=matches[0].init.arguments?.[0];assert.equal(object?.type,'ObjectExpression');const properties=object.properties,removals=[];
 for(const[key,target]of [['birth_name','nome_nascimento'],['parents','parentesco']]){const at=properties.findIndex(property=>property.key?.name===key||property.key?.value===key);assert(at>=0,'legacy mapping '+key);const property=properties[at];assert.equal(property.value.value,target);const start=at?properties[at-1].end:property.start,end=at?property.end:properties[at+1].start;removals.push({start,end,key});}
 for(const row of removals.sort((a,b)=>b.start-a.start)){const before=code.slice(row.start,row.end);code=code.slice(0,row.start)+code.slice(row.end);changes.push({name:'unproved-'+row.key+'-map-disabled',beforeSha256:sha(before),afterSha256:sha('')});}
 code=change(code,'v28BiographyObjectProof',raw=>{const fn=parser.parse(raw).program.body[0],expected=fn.params[1].name,calls=[];walk(fn,node=>{if(node.type==='CallExpression'&&node.callee.name==='v273MarriageInventory'&&node.arguments[0]?.type==='Identifier'&&node.arguments[0].name===expected)calls.push(node);});assert.equal(calls.length,1,'One source-side infobox inventory');const arg=calls[0].arguments[0],cfg=calls[0].arguments[1];assert.equal(cfg.type,'Identifier');return raw.slice(0,arg.start)+'v2221FocusedBiographyInventorySource('+raw.slice(arg.start,arg.end)+','+raw.slice(cfg.start,cfg.end)+')'+raw.slice(arg.end);});
 code=change(code,'biographyDetection',raw=>{assert(raw.includes(') {'));return raw.replace(') {',") {\n if(v2221FocusedBiographyConflict(source,cfg))return null;");});
 code=change(code,'v2217VerifiedPersonBox',raw=>{assert(raw.includes(') {'));return raw.replace(') {',') {\n if(v2221FocusedPersonOwner(box))return true;');});
 // The late pass masks bold lead text. Bind the subject proof before masking,
 // in a local option copy, so a protected quotation cannot erase that proof.
 code=change(code,'v219LatePortalPass',(raw,node)=>{const at=node.body.start-node.start+1,before='let result=addBiographyPortal(masked,cfg,bump,warn);';assert.equal(raw.split(before).length,2,'One source-bound late portal view');raw=raw.slice(0,at)+'if(v2221FocusedBiographyConflict(source,cfg))cfg={...cfg,v2221KnownNonhumanSubject:true};'+raw.slice(at);return raw.replace(before,'if(!v2221FocusedPortalMaskCoherent(source,masked,ranges,prefix))return source;'+before);});
 helperCode=change(helperCode,'v222InferenceSubjectConflict',raw=>raw.replace(/\)\{/,'){if(v2221FocusedBiographyConflict(source,cfg))return true;'));
 helperCode=change(helperCode,'v222FlagPlan',raw=>{const before='view=v222InferenceView(value)';assert.equal(raw.split(before).length,2);return raw.replace(before,'view=v2221FocusedValueView(value,true)');});
 // Reuse the old removal decision verbatim. This does not anticipate any
 // replacement rule, nor introduce a second list of obsolete template names.
 const decisions=[],shorts=[];walk(parser.parse(code),node=>{if(node.type!=='VariableDeclarator'||node.id?.type!=='Identifier'||!node.init)return;const expression=code.slice(node.init.start,node.init.end);if(node.id.name==='removable'&&expression.includes('cfg.shortDescriptions')&&expression.includes('sem interwiki'))decisions.push(node);if(node.id.name==='short'&&expression.includes('shortdescription')&&expression.includes('p.name'))shorts.push(node);});
 assert.equal(decisions.length,1,'One existing top-level obsolete-owner removal decision');
 const decision=decisions[0],near=shorts.filter(node=>node.end<decision.start&&decision.start-node.end<500);assert.equal(near.length,1,'One corresponding existing description flag');
 const shortExpression=code.slice(near[0].init.start,near[0].init.end),removalExpression=code.slice(decision.init.start,decision.init.end),extracted='function v2221ExistingObsoleteOwnerResult(raw,cfg={}){if(!v2216ObsoleteOwnerRemovalAllowed(raw))return raw;const p=parsedTemplate(raw),short='+shortExpression+',removable='+removalExpression+";return removable?'':raw;}";
 helperCode+='\n'+extracted+'\n';changes.push({name:'existing-obsolete-removal-decision-extracted',beforeSha256:sha(shortExpression+';'+removalExpression),afterSha256:sha(extracted)});
 parser.parse(code);parser.parse(helperCode);
 return {code,helpers:helperCode,receipt:{sourceSha256:sha(source),helpersSha256:sha(helpers),changes,wikipediaWrites:0}};
}
module.exports={patch};

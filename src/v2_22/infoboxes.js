// Native interface preferences are scoped to their actual readers.
function v222InfoboxSizeMigration(raw,cfg={}) {
 if(v2217InfoboxName(raw)!=='infobox person'||cfg.multilingual===false||cfg.automaticParameterNames===false||cfg.automaticBiographyFields===false)return null;
 const parsed=v222Fields(raw),profile=INFOBOX_CATALOG['info/biografia'];if(!parsed||!profile||!profileAccepts(profile,'imagem_tamanho'))return null;
 const size=parsed.fields.filter(f=>f.key==='image_size');
 if(size.length!==1||!/^\s*(?:[1-9]\d{0,3}(?:px)?)?\s*$/.test(size[0].value))return null;
 if(parsed.fields.some(f=>f!==size[0]&&['imagem_tamanho','imagem tamanho','imagemtamanho','imagesize','tamanho_imagem','foto_tamanho'].includes(f.key)))return null;
 const original=v2217InfoboxFields(raw);if(!original)return null;
 cfg={...cfg,v2217DeceasedContext:v2217InfoboxDeathContext(original,raw,cfg)};
 const adapted=v24SyntaxApply(raw,[{start:size[0].keyStart,end:size[0].keyEnd,text:'imagem_tamanho'}]),
  migrated=v2217InfoboxPersonMigration(adapted,cfg);
 if(!migrated)return null;
 return {...migrated,count:migrated.count+1,kind:'native-person-image-size-migration'};
}
function v222InfoboxPlan(source,cfg={}) {
 const edits=[];if(!v222Scope(source,cfg)||cfg.namespaceNumber!==0&&!v2215ArticleDraftContext(cfg,source)||cfg.infoboxes===false||cfg.automaticParameterNames===false||cfg.multilingual===false)return v222EditsPlan(source,edits);
 const shield=v222Protected(source),references=v219NativeReferenceObserver(source).refs;
 for(const node of v24SyntaxTemplates(shield.view).nodes){
  if(node.size!==2||references.some(ref=>ref.start<=node.start&&node.end<=ref.end))continue;
  const raw=source.slice(node.start,node.end),name=v2217InfoboxName(raw),parsed=v222Fields(raw);if(!name||!parsed)continue;
  const migrated=v222InfoboxSizeMigration(raw,cfg);
  if(migrated){edits.push({start:node.start,end:node.end,text:migrated.text,count:migrated.count,kind:migrated.kind,proof:{nativeOldids:migrated.nativeOldids,sourceInterface:name}});continue;}
  const profile=INFOBOX_CATALOG[name];if(!profile||!v215LiteralTemplateIdentity(raw,profile))continue;
  const fields=parsed.fields,add=(start,end,text,kind,proof)=>edits.push({start:node.start+start,end:node.start+end,text,count:1,kind,proof});
  const company=name==='info/empresa'&&profile.oldid===71838243,
   settlement=name==='info/assentamento'&&profile.oldid===72898161,
   family=company?['website','homepage','site','pagina','página']:settlement?['sítio','website']:null;
  if(family){
   const candidates=fields.filter(f=>family.includes(f.key));
   if(candidates.length===1){const field=candidates[0],target=company?'site':'sítio';
    if(field.key!==target&&profileAccepts(profile,target))add(field.keyStart,field.keyEnd,target,'native-infobox-site-key',{template:profile.title,oldid:profile.oldid,from:field.key,to:target});
   }
  }
  // Imported fields ignored by the native box may be removed only when a
  // single native counterpart already retains the byte-identical value.
  if(name==='info/biografia')for(const field of fields){
   const target=V2217_PERSON_FIELDS[field.key];
   if(!target||target===field.key||profileAccepts(profile,field.key)||!profileAccepts(profile,target))continue;
   if(fields.filter(f=>f.key===field.key).length!==1)continue;
   const native=fields.filter(f=>f.key===target);if(native.length!==1||field.value!==native[0].value)continue;
   const contract=v2151FieldSyntaxContract(profile),semantic=contract?.families.get(target);
   if(semantic&&fields.some(f=>f!==field&&f!==native[0]&&contract.families.get(f.key)===semantic))continue;
   add(field.start-1,field.end,'','redundant-ignored-infobox-key',{template:profile.title,from:field.key,retained:target,value:field.value});
  }
  // imdb_id is deliberately retained: a Wikidata statement alone does not
  // prove that the identification is present in the rendered authority box.
 }
 return v222EditsPlan(source,edits);
}
function v222InfoboxProof(before,after,plan,cfg={}) {return v222PlanProof(before,after,plan,cfg,v222InfoboxPlan);}

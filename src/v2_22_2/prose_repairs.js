// A finite separation repair needs an ordinary Portuguese phrase, not fuzzy matching.
function v2222SpellingSubjectNames(source,cfg={}){try{const box=v2217PrincipalInfobox(source,cfg);if(!box||!v2217VerifiedPersonBox(box))return[];return box.fields.filter(f=>['nome','nome_completo','nome de nascimento'].includes(f.key)&&f.value.trim()&&!/[{}\[\]<>\r\n]/.test(f.value)).map(f=>f.value.trim());}catch{return[];}}
function v2222SpellingMetalinguisticSpans(text){
 const all=[{start:0,end:text.length}],meta=/\b(?:palavra|palavras|grafia|grafias|ortografia|expressão|expressões|termo|termos|denominação|denominações|nome|nomes|título|títulos|alcunha|pseudônimo|pseudónimo|apelido|erro ortográfico)\b/iu;
 // An ordinary lower-case sentence with one final stop supplies a narrow
 // independent tail. Initials, abbreviations, numbers and other stops do not.
 const boundaries=[...text.matchAll(/\p{Ll}{4,}\.[ \t]+(?=(?:O|A|Os|As|Um|Uma)[ \t]+\p{Ll})/gu)];if(boundaries.length!==1)return all;
 const at=boundaries[0].index+boundaries[0][0].length,first=text.slice(0,at),tail=text.slice(at);if(!meta.test(first)||meta.test(tail)||! /^(?:O|A|Os|As|Um|Uma)[ \t]+[\p{Ll}\p{M}][\p{Ll}\p{M} ,\t-]*[.!?]?[ \t]*$/u.test(tail)||/\b(?:aprox|aproxim|abrev|aproximad|exempl|refer|p[aá]g|cap[ií]t)\.$/iu.test(first.trim()))return all;
 return[{start:0,end:at}];
}
function v2222ProseEdits(source,cfg={}){
 if(cfg.automaticSpelling===false||cfg.namespaceNumber!==0||cfg.discussionPage||cfg.sectionOnly||v2222NonWikitext(cfg))return[];
 const c=v2221LayoutContext(source),protectedRanges=v2222ContextProtected(source,cfg),edits=[];
 for(const m of source.matchAll(/\b(medicamento[ \t]+utilizado[ \t]+)parao(?=[ \t]+tratamento\b)/gu)){
  const start=m.index+m[1].length,end=start+5,lineStart=source.lastIndexOf('\n',m.index-1)+1,prefix=source.slice(lineStart,m.index),paragraph=source.slice(Math.max(0,source.lastIndexOf('\n\n',m.index)),source.indexOf('\n\n',end)<0?source.length:source.indexOf('\n\n',end));
  if(!v2221LayoutOutside(c,start,end)||protectedRanges.some(r=>r.start<end&&m.index<r.end)||/^(?:[ *#:;|!]|=)/.test(prefix)||/\b(?:palavra|grafia|termo|nome|expressão)\b/iu.test(paragraph))continue;
  edits.push(v2221LayoutEdit(start,end,'para o','v2222-portuguese-treatment-word-boundary',1,{phrase:'medicamento utilizado parao tratamento',finiteLexicalSeparation:true}));
 }
 return edits;
}
function v2222ProsePlan(source,cfg={}){return v2222Plan(source,'prose',v2222ProseEdits,cfg);}
function v2222ProseProof(before,after,plan,cfg={}){return v2222PlanProof(before,after,plan,cfg,v2222ProsePlan);}

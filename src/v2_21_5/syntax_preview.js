// A verified alias prefix is derived from the original source, never from the
// offered candidate. The existing structural proof still checks the remainder.
function syntaxRepairSourceProof(before,after,options={}){
 const direct=v2215BaselineSyntaxRepairSourceProof(before,after,options);
 if(!direct.applied||direct.accepted||typeof before!=='string'||typeof after!=='string')return direct;
 const cfg=pageContextOptions({...DEFAULTS,...options}),prefix=v2215AliasPlan(before,cfg);
 if(!prefix.edits.length||!v2215AliasProof(before,prefix.text,prefix,cfg))return direct;
 const checked=v2215BaselineSyntaxRepairSourceProof(prefix.text,after,options);
 // Pending structural repairs must still be completed. A cosmetic prefix does
 // not authorize arbitrary extra changes or a partially repaired checkpoint.
 if(!checked.applied||!checked.accepted)return direct;
 return {...checked,repairs:(checked.repairs||0)+prefix.edits.length,
  v2215AliasPrefix:{sourceHash:v24SyntaxHash(before),projectedSourceHash:prefix.sourceHash===v24SyntaxHash(before)?v24SyntaxHash(prefix.text):null,
   candidateHash:v24SyntaxHash(after),edits:prefix.edits.length}};
}

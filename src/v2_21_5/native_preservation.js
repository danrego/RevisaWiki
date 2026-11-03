// Reader checks use the original input before any writer projection.
function preservationAudit(before,after,options={}){
 return [...v2215BaselinePreservationAudit(before,after,options),...v2215NativeCitationReadAudit(before,after,options),...v2215NamedDefinitionConsistencyAudit(before,after,options)];
}
function safeComposition(before,after,options={}){
 const findings=[...v2215NativeCitationReadAudit(before,after,options),...v2215NamedDefinitionConsistencyAudit(before,after,options)];
 if(findings.length)return findings[0].message;
 return v2215BaselineSafeComposition(before,after,options);
}

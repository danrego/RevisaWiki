'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(core),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false};
let checks=0,calculations=0;const failures=[],rows=[];
function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
for(const group of ['note','xyz','explicações','x-y','n_2'])for(const quote of ['"',"'",''])for(const whitespace of ['',' ','  '])for(const kind of ['native','refn','tag']){
 const attribute='group'+whitespace+'='+whitespace+quote+group+quote;
 const start=kind==='native'?'<ref '+attribute+' name="n">Nota de teste.</ref>':kind==='refn'?'{{refn|name=n|group'+whitespace+'='+whitespace+group+'|Nota de teste.}}':'{{#tag:ref|Nota {{sfn|Livro|2000}}|name=n|group'+whitespace+'='+whitespace+group+'}}';
 const source=start+'<ref name="fonte">Fonte de teste.</ref>\n== Notas ==\n<references '+attribute+'/>\n\n== Referências ==\n<references />';
 const p=api.v2215ReferenceCollectorPlan(source,cfg),id=[group,quote||'unquoted',whitespace.length,kind].join('-');
 eq(p.text.includes('{{Notas e referências}}'),true,id+' unifies a single coherent group');
 eq(p.text.includes('Nota de teste.')||p.text.includes('Nota {{sfn|Livro|2000}}'),true,id+' note body retained');
 eq(p.text.includes('Fonte de teste.'),true,id+' bibliography body retained');
 eq(api.v2215ReferenceCollectorProof(source,p.text,p,cfg),true,id+' source-bound proof');
 eq(api.v2215ReferenceCollectorPlan(p.text,cfg).text,p.text,id+' stable endpoint');
 eq(api.v2215ReferenceCollectorProof(source,p.text,{...p,steps:[]},cfg),false,id+' forged proof rejected');
 const changed=p.text.replace('Fonte de teste.','Texto bibliográfico inventado.');
 eq(api.preservationAudit(source,changed,cfg).length>0,true,id+' bibliography mutation rejected');
 const groupChanged=p.text.replace(/group([ \t]*)=([ \t]*)(?:"nota"|'nota'|nota)/,'group=$1$2outra');
 if(groupChanged!==p.text)eq(api.preservationAudit(source,groupChanged,cfg).length>0,true,id+' reassignment rejected');
 rows.push({id,sourceSha256:sha(source),candidateSha256:sha(p.text),edits:p.edits.length});
}
for(const second of ['nota','lower-alpha','upper-roman','abc']){
 const source='Texto<ref group="xyz" name="n">Uma nota.</ref><ref group="'+second+'" name="n">Outra nota.</ref><ref>Fonte.</ref>\n== Notas ==\n<references group="xyz"/>\n\n<references group="'+second+'"/>\n\n== Referências ==\n<references/>';
 const p=api.v2215ReferenceCollectorPlan(source,cfg);
 eq(p.text.includes('group="xyz"'),true,'First independent group survives '+second);
 eq(p.text.includes('group="'+second+'"')||p.text.includes('grupo='+second),true,'Second independent group survives '+second);
 eq(p.text.includes('{{Notas e referências}}'),false,'Distinct groups are not merged '+second);
}
for(const group of ['a|b','a=b','a&b','a{{b','a<b','a\nb']){
 const source='Texto<ref group="'+group+'">Nota.</ref>\n== Notas ==\n<references group="'+group+'"/>\n{{Referências}}',p=api.v2215ReferenceCollectorPlan(source,cfg);
 eq(p.text,source,'A group containing template or tag syntax is never interpolated: '+JSON.stringify(group));
}
const receipt={suite:'single-note-group-variation-matrix-2.21.5',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Whitespace, quotation and producer variations preserve all note bindings');

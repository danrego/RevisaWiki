'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{api,cfg,sourceSha}=require('./harness.cjs');
let checks=0,calculations=0;const rows=[];
function yes(value,message){checks++;assert.ok(value,message);}
function run(id,body,expect){
 const source="'''Tema''' é um exemplo.<ref>"+body+'</ref>\n{{Referências}}\n';
 calculations++;const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});
 yes(api.v219AutomaticResultSafety(source,result).accepted,id+' first safety');expect(result.text);
 calculations++;const again=api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:cfg});
 yes(api.v219AutomaticResultSafety(result.text,again).accepted,id+' second safety');yes(again.text===result.text,id+' idempotence');
 rows.push({id,before:source,after:result.text});
}
const intents=['DeadURL','UrlStatus','status-url','url-estado','statusurl','urlmorto','url-status','urlmorta','dead-url','deadurl','datali','li','ligação inativa','ligação inactiva','STATUS_URL','URL_STATUS','url_estado','URLMORTO','url_morta','dead_url','LIGAÇÃO_INATIVA'];
for(const key of intents)for(const value of ['live','dead','']){
 const pair='|status-url=dead|'+key+'='+value;
 run('collision-'+key+'-'+(value||'empty'),'{{Citar web|title=Fonte|publisher=Instituição|url=https://example.org'+pair+'}}',text=>{
  yes(text.includes(pair+'}}'),'state keys, order and exact values preserved '+key);
  yes(text.includes('título=Fonte'),'independent title translation survives '+key);
  yes(text.includes('publicado=Instituição'),'independent publisher translation survives '+key);
 });
}
for(const key of ['DeadURL','UrlStatus','STATUS_URL','URL_STATUS','url_estado','URLMORTO','url_morta','dead_url','LIGAÇÃO_INATIVA']){
 run('unsupported-singleton-'+key,'{{Citar web|title=Fonte|publisher=Instituição|url=https://example.org|'+key+'=dead}}',text=>{
  yes(text.includes('|'+key+'=dead}}'),'veto-only identity does not activate unsupported singleton '+key);
  yes(!text.includes('|urlmorta=sim'),'no unsupported singleton state inference '+key);
  yes(text.includes('título=Fonte')&&text.includes('publicado=Instituição'),'independent singleton neighbors translated '+key);
 });
}
run('supported-singleton-status-url','{{Citar web|title=Fonte|publisher=Instituição|url=https://example.org|status-url=dead}}',text=>{
 yes(text.includes('|urlmorta=sim}}'),'one exact supported dead status still repaired');
 yes(text.includes('título=Fonte')&&text.includes('publicado=Instituição'),'supported singleton neighbors translated');
});
const receipt={suite:'v222-citation-state-collision-action',checks,calculations,cases:rows.length,sourceSha,passed:true,rows,wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({...receipt,rows:undefined}));

'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),api=require(process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.6/RevisaWiki_v2_21_6.js'));let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
const source='{{Marca de projeto|3|Ciência|2|rev=20261104}}\nTexto.',revision=(revid,user,content)=>({revid,user,slots:{main:{content}}}),old='{{Marca de projeto|?|Ciência|2}}\nTexto.';
const rows=[revision(3,'Conta técnica',source),revision(2,'Conta técnica',source.replace('Texto.','Texto anterior.')),revision(1,'Outra conta',old)];
eq(api.v2216AssessmentOrigins(source,rows),[{field:'quality',key:'1',value:'3',account:'Conta técnica',revisionId:2},{field:'reviewDate',key:'rev',value:'20261104',account:'Conta técnica',revisionId:2}],'Origins follow unchanged values to their introducing revision, not a later cosmetic edit');
eq(api.v2216AssessmentOrigins(source.replace('|3|','|4|'),rows),[],'A manually modified current rating is not borrowed from saved history');
eq(api.v2216AssessmentOrigins(source,rows.slice(0,2)),[],'An unconfirmed origin at the history boundary is preserved');
eq(api.v2216AssessmentOrigins(source,[rows[0],{...rows[1],userhidden:true},rows[2]]),[],'Hidden author cannot establish bot provenance');
eq(api.v2216AssessmentOrigins('{{Marca de projeto|3|Ciência|2}}\n{{Marca de projeto|2|Brasil|1}}',rows),[],'Multiple historical banners are not ambiguously matched');
const cfg={...api.defaults,namespaceNumber:1,contentModel:'wikitext',pageTitle:'Discussão:Exemplo'},node=api.v2216AssessmentRows(source)[0],proof={sourceHash:api.v2216LayoutHash(source),templateHash:api.v2216LayoutHash(node.raw),templateStart:node.start,quality:{value:'3',key:'1',confirmedBot:true},reviewDate:{value:'20261104',key:'rev',confirmedBot:true}};
let result=api.v2216TalkPlan(source,{...cfg,v2216ConfirmedBotAssessments:[proof]}).text;eq(result,'{{PD}}\n{{Marca de projeto|?|Ciência|2}}\nTexto.','Confirmed bot fields are cleared while project importance and discussion text are retained');
for(const malformed of [{...proof,sourceHash:'invalid'},{...proof,templateStart:99},{...proof,quality:{value:'4',confirmedBot:true}},{...proof,quality:{value:'3',confirmedBot:false}}]){const text=api.v2216TalkPlan(source,{...cfg,v2216ConfirmedBotAssessments:[malformed]}).text;eq(text.includes('|3|Ciência|2'),true,'Unbound or nonbot provenance preserves the human rating');}
const text=api.v2216TalkPlan(source,cfg).text;eq(text.includes('|3|Ciência|2|rev=20261104'),true,'A date alone never makes an assessment automatic');
const origin={account:'Conta técnica',revisionId:2},bots=new Set(['Conta técnica']);
eq(api.v2216AssessmentBotEvidence(origin,{user:'Conta técnica',revid:2,bot:true},bots),true,'The introducing edit must actually carry the native bot flag');
for(const record of [{user:'Conta técnica',revid:2},{user:'Conta técnica',revid:2,bot:false},{user:'Conta técnica',revid:3,bot:true},{user:'Outra conta',revid:2,bot:true}])eq(api.v2216AssessmentBotEvidence(origin,record,bots),false,'A human execution or another revision cannot borrow current bot membership');
eq(api.v2216AssessmentBotEvidence(origin,{user:'Conta técnica',revid:2,bot:true},new Set()),false,'Both the native execution flag and confirmed technical account are required');
console.log(JSON.stringify({suite:'assessment-origin-proof-2.21.6',checks,wikipediaWrites:0}));

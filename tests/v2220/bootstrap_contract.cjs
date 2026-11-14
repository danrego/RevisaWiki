'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dist=path.join(root,'dist/2.22.0'),manifestRaw=fs.readFileSync(path.join(root,'tests/expected_release_v2220.json')),manifest=JSON.parse(manifestRaw),sha=x=>crypto.createHash('sha256').update(x).digest('hex');let checks=0;const rows=[];
const yes=(x,m)=>{checks++;assert.ok(x,m);};
function bytes(name){const b=fs.readFileSync(path.join(dist,name));yes(sha(b)===manifest.files[name].sha256,'exact frozen runtime '+name);return b.toString();}
const sources={core:bytes('RevisaWiki_v2_22_0.js'),complete:bytes('RevisaWiki_v2_22_0_completo.js'),catalog:bytes('RevisaWiki_v2_22_0_catalogo.js'),rules:bytes('RevisaWiki_v2_22_0_regras.js'),data:bytes('RevisaWiki_v2_22_0_dados.js')};
async function scenario(id,{complete=false,catalog=sources.catalog,rules=sources.rules,data=sources.data,reject=false,config={}}={}){
 const notices=[],requests=[],sandbox={console,crypto:crypto.webcrypto,TextEncoder,TextDecoder,URL,URLSearchParams,performance,setTimeout,clearTimeout,draft:'Texto local inalterado.',location:{hostname:'pt.wikipedia.org'}};sandbox.window=sandbox;sandbox.RevisaWikiConfig=config;sandbox.document={readyState:'loading',querySelectorAll:()=>[],querySelector:()=>null,getElementById:()=>null,addEventListener:()=>{}};
 sandbox.mw={hook:()=>({add:()=>{},remove:()=>{}}),config:{get:key=>key==='wgAction'?'edit':key==='wgDBname'?'ptwiki':key==='wgServerName'?'pt.wikipedia.org':undefined},notify:m=>notices.push(String(m)),loader:{using:()=>Promise.resolve(),getScript:async url=>{const title=new URL(url,'https://pt.wikipedia.org').searchParams.get('title');requests.push(title);const raw=/\/Dados\.js$/.test(title)?data:/\/Catalogo\.js$/.test(title)?catalog:/\/Regras\.js$/.test(title)?rules:null;if(raw===null)throw Error('Unrecognized local read');vm.runInContext(raw,context);}}};
 const context=vm.createContext(sandbox);let error=null;try{vm.runInContext(complete?sources.complete:sources.core,context);await sandbox.RevisaWikiRulesBootPromise;await sandbox.RevisaWikiModulePromise;}catch(e){error=e;}
 yes(sandbox.draft==='Texto local inalterado.',id+' draft unchanged');
 if(reject){yes(!!error,id+' incompatible package rejected');yes(!sandbox.RevisaWiki,id+' no partially started API');}
 else{if(error)console.error(JSON.stringify({id,error:String(error?.stack||error),notices}));yes(!error,id+' starts');yes(sandbox.RevisaWiki?.version==='2.22.0',id+' correct API');yes(typeof sandbox.RevisaWiki.v222ReferencePlan==='function',id+' all rules available');}
 if(!complete&&!reject)yes(requests.length===3&&requests.every(x=>/\/(?:Dados|Catalogo|Regras)\.js$/.test(x)),id+' only fixed read-only script destinations');
 if(config.dataPage&&!reject)yes(requests.every(x=>x.startsWith(config.dataPage.replace(/\/Dados\.js$/,''))),id+' private-copy paths derive only from configured data destination');
 rows.push({id,passed:true,scriptReads:requests.length,rejected:!!error,noticeCount:notices.length});
}
(async()=>{
 await scenario('fresh-separated-installation');await scenario('complete-offline-installation',{complete:true});
 await scenario('private-copy-separated-installation',{config:{dataPage:'Usuário:Exemplo/RevisaWiki/Dados.js'}});
 await scenario('catalogue-wrong-version',{catalog:sources.catalog.replace("'version':'2.22.0'","'version':'0.0.0'"),reject:true});
 const oldVersion="version:'2.22.0'";await scenario('rule-version-mismatch',{rules:sources.rules.includes(oldVersion)?sources.rules.replace(oldVersion,"version:'0.0.0'"):sources.rules.replace("'version':'2.22.0'","'version':'0.0.0'"),reject:true});
 await scenario('catalogue-changed-same-version',{catalog:sources.catalog.replace('Botânica','Botanica alterada'),reject:true});
 await scenario('rules-changed-same-version',{rules:sources.rules.replace('factory:function RevisaWikiRulesFactory(', 'factory:function alteredFactory('),reject:true});
 const report={version:'2.22.0',kind:'exact-runtime-bootstrap-and-stale-component-controls',passed:true,checks,cases:rows.length,rows,manifestSha256:sha(manifestRaw),wikipediaWrites:0,networkRequests:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exitCode=1;});

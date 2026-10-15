'use strict';
// Isolate the local catalog cache so every installation-chain test fetches it.
localStorage.clear();
(() => {
  const params=new URLSearchParams(location.search),scenario=params.get('scenario')||'normal';
  const pageTitle=params.get('title')||'Exemplo de física',pageSource='Uma introdução.<ref name="externa">Fonte completa definida no início.</ref>\n\n== História ==\nO texto tem uma excessão e chama a fonte.<ref name="externa" />\n\n=== Óptica e luz ===\nA luz atravessa o meio.\n\n== Referências ==\n{{Referências}}\n';
  const source=scenario==='large'?pageSource.replace('A luz atravessa o meio.','A luz atravessa o meio.\n'.repeat(8000)):pageSource;
  const sectionSpecs=[['1',2,'História','História','== História =='],['2',3,'Óptica e luz','Óptica_e_luz','=== Óptica e luz ==='],['3',2,'Referências','Referências','== Referências ==']];
  const sections=sectionSpecs.map(([index,level,line,anchor,prefix])=>{const offset=source.indexOf(prefix);return{index,level,hLevel:level,line,anchor,fromtitle:pageTitle,fromTitle:pageTitle,byteoffset:new TextEncoder().encode(source.slice(0,offset)).length,codepointOffset:Array.from(source.slice(0,offset)).length};});
  const config={wgDBname:'ptwiki',wgServerName:location.hostname,wgServer:location.origin,wgScriptPath:'/w',wgArticlePath:'/wiki/$1',wgAction:'view',wgNamespaceNumber:0,wgPageContentModel:'wikitext',wgPageName:pageTitle.replaceAll(' ','_'),wgTitle:pageTitle,wgRevisionId:100,wgCurRevisionId:100,wgArticleId:10,wgUserName:'Conta de teste local',wgIsArticle:true,wgIsRedirect:false,skin:params.get('skin')||'vector-2022',wgEditSubmitButtonLabelPublish:true};
  const hooks=new Map(),qa=window.__rw26QA={scenario,pageTitle,source,sections,config,requests:[],saveCalls:[],parseCalls:[],forbiddenNetwork:[],submits:0,errors:[],hooks:[],notices:[],aborts:0,storageBlocked:false,clipboard:'',savedRevision:null,previewSerial:0};
  const error=(code,message)=>{const e=new Error(message||code);e.code=code;e.error={code,info:message||code};return e;};
  let loadFailures=0,previewFailures=0;
  function response(p,method,previewSerial){
    if(p.action==='query'){
      if(scenario==='load-failure'&&loadFailures++===0)throw error('http','Leitura local indisponível');
      let value={title:pageTitle,ns:0,pageid:10,lastrevid:100,contentmodel:'wikitext',actions:{edit:true},revisions:[{revid:100,parentid:99,timestamp:'2026-10-15T12:00:00Z',slots:{main:{contentmodel:'wikitext',content:source}}}]};
      if(scenario==='missing-page')value={title:pageTitle,ns:0,missing:true};
      if(scenario==='suppressed-source')delete value.revisions[0].slots.main.content;
      if(scenario==='protected')value.actions.edit=false;
      if(scenario==='non-wikitext'){value.contentmodel='Scribunto';value.revisions[0].slots.main.contentmodel='Scribunto';}
      if(scenario==='stale-display')value.lastrevid=value.revisions[0].revid=101;
      if(scenario==='moved-target')value.title='Outro artigo';
      if(p.rvprop==='ids|timestamp'){qa.publishPreflightReads=(qa.publishPreflightReads||0)+1;if(scenario==='move-before-save')value.title='Outro artigo';if(scenario==='revision-before-save')value.revisions[0].revid=101;if(scenario==='delete-before-save')value={title:pageTitle,missing:true};if(scenario==='read-before-save-failure')throw error('http','Leitura local falhou antes do envio');}
      if(p.meta==='userinfo')return{query:{userinfo:{id:1,name:config.wgUserName,rights:['edit','minoredit']}}};
      if(p.revids&&String(p.revids)==='101')value={...value,lastrevid:101,revisions:[{...value.revisions[0],revid:101,slots:{main:{contentmodel:'wikitext',content:qa.savedSource||source}}}]};
      return{curtimestamp:'2026-10-15T12:30:00Z',query:{pages:[value],userinfo:{id:1,name:config.wgUserName,rights:['edit','minoredit']}}};
    }
    if(p.action==='parse'){
      if(p.oldid&&!Object.hasOwn(p,'text'))return{parse:{title:pageTitle,pageid:10,revid:100,wikitext:source,tocdata:{sections},sections}};
      qa.parseCalls.push({...p});
      if(scenario==='auto-parse-failure')throw error('http','Local automatic preview failure');
      if(scenario==='auto-new-error'&&p.text.includes('exceção'))return{parse:{text:'<div class="mw-parser-output"><strong class="error">Erro de citação: falha de teste.</strong></div>',parsewarnings:[]}};
      if(scenario==='preview-failure'&&previewFailures++===0)throw error('http','Prévia local indisponível');
      return{parse:{title:p.title||pageTitle,revid:100,text:'<div class="mw-parser-output"><p data-preview="'+previewSerial+'">Prévia local '+previewSerial+'</p><ol class="references"><li>Fonte completa definida no início.</li></ol></div>',modules:['ext.local.test'],modulestyles:['ext.local.style'],parsewarnings:[],images:[],templates:[]}};
    }
    throw error('bad-action','Ação não reconhecida na API local.');
  }
  function delayed(work,ms){let timer,rejecter;const p=new Promise((resolve,reject)=>{rejecter=reject;timer=setTimeout(()=>{try{resolve(work());}catch(e){reject(e);}},ms);});p.abort=()=>{qa.aborts++;if(qa.ignoreAbort)return;clearTimeout(timer);rejecter(error('abort','Pedido local cancelado'));};return p;}
  function apiCall(p,method){
    qa.requests.push({params:{...p},method});
    if(!['query','parse','paraminfo'].includes(p.action||'query')){qa.forbiddenNetwork.push({...p});return Promise.reject(error('forbidden','Mutação não autorizada fora do simulador de publicação.'));}
    const serial=p.action==='parse'&&Object.hasOwn(p,'text')?++qa.previewSerial:0;
    if(serial){qa.parseStarted=(qa.parseStarted||[]).concat(performance.now());qa.activeParses=(qa.activeParses||0)+1;qa.maxConcurrentParses=Math.max(qa.maxConcurrentParses||0,qa.activeParses);}
    const wait=scenario==='auto-timeout'&&serial?15000:scenario.startsWith('auto-')&&serial?100:scenario==='slow-load'&&p.action==='query'?180:scenario==='preview-race'&&serial?serial===1?220:20:10;
    return delayed(()=>{try{return response(p,method,serial);}finally{if(serial)qa.activeParses--;}},wait);
  }
  function saveCall(token,p){
    qa.saveCalls.push({token,params:JSON.parse(JSON.stringify(p))});
    return delayed(()=>{
      const code={conflict:'editconflict','page-deleted':'pagedeleted','invalid-section':'nosuchsection','identity-error':'assertuserfailed','bad-token':'badtoken','abusefilter-disallow':'abusefilter-disallowed','network-error':'http'}[scenario];
      if(code)throw error(code,'Erro de publicação apenas simulado: '+code);
      if(scenario==='abusefilter-warning')return{edit:{result:'Failure',code:'abusefilter-warning',warning:'Aviso local'}};
      if(scenario==='captcha')return{edit:{result:'Failure',captcha:{id:'local',type:'simple',question:'teste'}}};
      if(scenario==='unexpected-save')return{edit:{result:'Failure'}};
      if(scenario==='unknown-result')throw error('http','Resultado ainda não confirmado no simulador.');
      if(scenario==='nochange')return{edit:{result:'Success',nochange:true,pageid:10,title:pageTitle,oldrevid:100,newrevid:100}};
      qa.savedRevision=101;qa.savedSource=p.text;
      return{edit:{result:'Success',pageid:10,title:pageTitle,oldrevid:100,newrevid:101,newtimestamp:'2026-10-15T12:31:00Z'}};
    },scenario==='slow-save'?200:20);
  }
  function Api(options){qa.apiOptions=(qa.apiOptions||[]).concat(options||{});this.get=p=>apiCall(p,'GET');this.post=p=>apiCall(p,'POST');this.postWithToken=saveCall;this.assertCurrentUser=p=>({...p,assert:'user',assertuser:config.wgUserName});this.getErrorMessage=e=>e?.error?.info||e?.message||String(e);}
  Api.assertCurrentUser=p=>({...p,assert:'user',assertuser:config.wgUserName});
  window.mw={config:{get:k=>config[k],set:(key,value)=>typeof key==='object'?Object.assign(config,key):config[key]=value},Api,
    loader:{using:items=>{qa.usedModules=(qa.usedModules||[]).concat(items||[]);return Promise.resolve();},load:items=>qa.hooks.push({moduleLoad:items}),getScript:()=>Promise.reject(error('external-script','Recurso externo recusado pelo teste.'))},
    hook:name=>{if(!hooks.has(name))hooks.set(name,[]);return{add:fn=>{hooks.get(name).push(fn);},remove:fn=>hooks.set(name,hooks.get(name).filter(x=>x!==fn)),fire:(...args)=>{qa.hooks.push({name,roots:args.map(a=>a?.[0]?.className||a?.className||'unknown')});for(const f of hooks.get(name))f(...args);}};},
    util:{wikiScript:()=>'/w/api.php',getUrl:(t,q={})=>'/w/index.php?'+new URLSearchParams({title:t,...q}),addPortletLink:()=>null},
    user:{options:{get:name=>({minordefault:false,watchdefault:false}[name])},tokens:{get:()=>undefined},getName:()=>config.wgUserName},
    notify:m=>{qa.notices.push(String(m));document.querySelector('#qa-notice').textContent=String(m);},
    confirmCloseWindow:()=>({release:()=>{qa.unloadReleased=true;}}),
    message:key=>({text:()=>key,plain:()=>key,parse:()=>key}),msg:key=>key};
  window.jQuery.client={profile:()=>({layout:/Firefox\//.test(navigator.userAgent)?'gecko':'webkit'})};
  if(/^loader-/.test(params.get('mode')||''))mw.loader.getScript=url=>{
    qa.scriptRequests=(qa.scriptRequests||[]).concat(String(url));
    if(scenario==='loader-failure'&&!qa.allowScripts)return Promise.reject(error('local-script-failure','Falha local ao carregar o núcleo.'));
    const title=new URL(url,location.href).searchParams.get('title'),route=title?.endsWith('/Carregador.js')?'/central.js':title?.endsWith('/Dados.js')?'/data.js':'/core.js';
    if(scenario==='catalog-failure'&&route==='/data.js'&&!qa.allowData)return Promise.reject(error('local-data-failure','Falha local ao carregar o catálogo.'));
    return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=route;script.onload=resolve;script.onerror=()=>reject(error('local-script-failure','Recurso local indisponível.'));document.head.append(script);});
  };
  window.RevisaWikiConfig={authorityControl:false,endTemplateOrder:false,links:false};
  window.confirm=()=>{qa.confirmCalls=(qa.confirmCalls||0)+1;return qa.confirmChoice??false;};
  qa.clipboardWrites=0;
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{qa.clipboardWrites++;throw new Error('Clipboard access forbidden in this test.');}}});
  qa.policyViolations=[];
  document.addEventListener('securitypolicyviolation',event=>{qa.policyViolations.push({directive:event.violatedDirective,blockedURI:event.blockedURI});});
  qa.workerResults=[];
  if(typeof window.Worker==='function'){
    const NativeWorker=window.Worker;
    window.Worker=class ObservedNativeWorker extends NativeWorker{
      constructor(...args){
        super(...args);
        this.addEventListener('message',event=>{
          if(event.data?.type==='result')qa.workerResults.push({id:event.data.id,result:event.data.result});
        });
      }
    };
  }
  document.addEventListener('click',event=>{qa.clicks=(qa.clicks||[]).concat({trusted:event.isTrusted,className:String(event.target?.className||''),text:event.target?.textContent?.slice(0,70)}).slice(-10);},true);
  document.addEventListener('submit',event=>{event.preventDefault();qa.submits++;});
  for(const name of ['error','unhandledrejection'])window.addEventListener(name,event=>{const msg=String(event.message||event.reason);qa.errors.push(msg);document.querySelector('#qa-errors').textContent+=msg+'\n';});
  if(scenario==='oldid')config.wgRevisionId=99;
  if(scenario==='anonymous')config.wgUserName=null;
  if(scenario==='diff')config.wgDiffNewId=100;
  if(scenario==='visual-editor')config.wgAction='edit';
  if(scenario==='transclusion')document.querySelector('.mw-editsection a').href='/w/index.php?title=Predefinição:Exemplo&action=edit&section=T-1';
  if(scenario==='cross-origin')document.querySelector('.mw-editsection a').href='https://example.invalid/w/index.php?title=Exemplo&action=edit&section=1';
  if(scenario==='malformed-link')document.querySelector('.mw-editsection a').href='/w/index.php?title=Exemplo&action=edit';
  qa.nativeEditLinks=[...document.querySelectorAll('.mw-editsection a')].map(anchor=>anchor.outerHTML);
  if(scenario==='reading-stale-controls'){
    const lead=document.createElement('button');lead.type='button';lead.className='rw26-lead-launch';lead.textContent='Atalho antigo';document.getElementById('firstHeading').append(lead);
    for(const anchor of document.querySelectorAll('.mw-editsection a')){const button=document.createElement('button');button.type='button';button.className='rw26-launch rw26-lazy-launch';button.textContent='Editar aqui';anchor.after(button);}
    const other=document.createElement('button');other.type='button';other.className='qa-unowned-control';other.textContent='Controle local independente';document.querySelector('nav').append(other);
    qa.staleOwnedButtons=document.querySelectorAll('button.rw26-launch,button.rw26-lead-launch').length;
    const anchor=document.querySelector('.mw-editsection a'),button=anchor.nextElementSibling;window.RevisaWikiInlinePending={href:anchor.href,anchor,button,label:button.textContent,timer:0};qa.stalePendingInjected=true;
  }
  if(scenario==='native-editor'){const t=document.createElement('textarea');t.id='wpTextbox1';t.value=source;const summary=document.createElement('input');summary.id='wpSummary';summary.name='wpSummary';summary.value='';document.body.prepend(summary,t);config.wgAction='edit';}
  window.addEventListener('beforeunload',()=>{try{sessionStorage.setItem('rw26-local-navigation-trace',JSON.stringify(qa));}catch{}});
  qa.ready=true;
})();

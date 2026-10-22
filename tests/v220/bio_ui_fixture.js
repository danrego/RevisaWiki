'use strict';
(()=>{
 const params=new URLSearchParams(location.search),scenario=params.get('scenario')||'normal',adapter=params.get('adapter')||'classic',namespace=scenario==='talk'?1:scenario==='styles'||scenario==='template'?10:0,
  articleTitle='Tema fictício',title=namespace===1?'Discussão:'+articleTitle:namespace===10?'Predefinição:Modelo fictício'+(scenario==='styles'?'/styles.css':''):articleTitle;
 const sources={normal:'Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].',review:'Texto fictício.<ref name=fonte_ficticia />\n{{Referências}}',lookup:'Texto sobre [[Alvo fictício]].',spelling:'O texto tem uma excessão.',talk:'Portal da física Portal da tecnologia Portal da ciência',styles:'.caixa { color: red; border-color: #aaa; }',template:'<includeonly>{{{1|}}}</includeonly><noinclude>{{Documentação}}</noinclude>'};
 const source=sources[scenario]||sources.normal,qa=window.__rw219UI={scenario,adapter,title,articleTitle,source,model:source,requests:[],forbiddenActions:[],errors:[],notices:[],nativeDiffClicks:0,submits:0,saveClicks:0,aborts:0,clipboardAttempts:0,clipboardWrites:0,policyViolations:[],workerResults:[],workerStarts:0,workerTerminates:0,queryRevision:100,parseDelay:10,queryDelay:10,modelWrites:0,breakpoints:0};
 const config={wgDBname:'ptwiki',wgServerName:location.hostname,wgServer:location.origin,wgScriptPath:'/w',wgArticlePath:'/wiki/$1',wgAction:scenario==='view'?'view':'edit',wgNamespaceNumber:namespace,wgPageContentModel:scenario==='styles'?'sanitized-css':'wikitext',wgPageName:title.replaceAll(' ','_'),wgTitle:namespace?title.slice(title.indexOf(':')+1):title,wgRevisionId:100,wgCurRevisionId:100,wgArticleId:10,wgUserName:'Conta local fictícia',wgIsArticle:namespace===0,wgIsRedirect:false,wgIsDisambiguationPage:false,skin:'vector-2022',wgWikibaseItemId:'Q123'};
 qa.humanEntity={id:'Q123',type:'item',sitelinks:{ptwiki:{site:'ptwiki',title:articleTitle}},claims:{P31:[{rank:'normal',mainsnak:{snaktype:'value',datatype:'wikibase-item',datavalue:{type:'wikibase-entityid',value:{'entity-type':'item',id:'Q5','numeric-id':5}}}}]}};
 qa.selfMessageYields=0;qa.pendingSelfMessages=[];qa.holdSelfMessages=scenario==='fallback-self-message-held';
 if(typeof window.postMessage==='function'){
  const originalPostMessage=window.postMessage;
  window.postMessage=function(...args){if(typeof args[0]==='string'&&args[0].startsWith('RevisaWiki.pause.v219:')){qa.selfMessageYields++;if(qa.holdSelfMessages){qa.pendingSelfMessages.push(args);return;}}return originalPostMessage.apply(this,args);};
  qa.releaseSelfMessages=()=>{qa.holdSelfMessages=false;const pending=qa.pendingSelfMessages.splice(0);for(const args of pending)originalPostMessage.apply(window,args);return pending.length;};
 }
 const textarea=document.getElementById('wpTextbox1');textarea.value=source;
 document.getElementById('firstHeading').textContent=title;
 document.getElementById('wpDiff').addEventListener('click',event=>{event.preventDefault();qa.nativeDiffClicks++;});
 document.getElementById('wpSave').addEventListener('click',event=>{event.preventDefault();qa.saveClicks++;});
 document.getElementById('editform').addEventListener('submit',event=>{event.preventDefault();qa.submits++;});
 window.confirm=()=>{qa.confirmAttempts=(qa.confirmAttempts||0)+1;return false;};
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{qa.clipboardAttempts++;throw new Error('Área de transferência desativada no teste local');}}});
 document.addEventListener('securitypolicyviolation',event=>qa.policyViolations.push({directive:event.violatedDirective,blockedURI:event.blockedURI}));
 for(const eventName of ['error','unhandledrejection'])window.addEventListener(eventName,event=>{qa.errors.push(String(event.message||event.reason?.message||event.reason));document.getElementById('qa-errors').textContent=qa.errors.join('\n');});
 const hooks=new Map(),error=(code,message)=>Object.assign(new Error(message||code),{code,error:{code,info:message||code}});
 function response(p){
  if(p.action==='paraminfo')return{paraminfo:{modules:[{name:'parse',parameters:[]}]}};
  if(p.action==='parse'){
   if(qa.failParse)throw error('local-preview-failure','Pré-visualização local indisponível');
   if(p.templatesandboxtext!==undefined)return{parse:{text:'<style data-mw-deduplicate="TemplateStyles">'+p.templatesandboxtext+'</style>',parsewarnings:[]}};
   const html=qa.newParseError&&/\[\[(?:Brasil|Portugal|França)\]\]/.test(String(p.text))?'<div class="mw-parser-output"><strong class="error">Erro de teste.</strong></div>':'<div class="mw-parser-output"><p>Texto fictício conferido.</p></div>';
   return{parse:{title:p.title||title,revid:100,text:html,wikitext:source,tocdata:{sections:[]},sections:[],parsewarnings:[],images:[],templates:[],categories:[]}};
  }
  if(p.action==='query'){
   if(qa.failQuery)throw error('local-query-failure','Consulta local indisponível');
   if(p.meta==='userinfo')return{query:{userinfo:{id:1,name:config.wgUserName,rights:['edit','minoredit']}}};
   const requested=String(p.titles||title).split('|');
   const pages=requested.map((requestedTitle,index)=>{const ns=requestedTitle.startsWith('Portal:')?100:requestedTitle.startsWith('Wikipédia:')?4:requestedTitle.startsWith('Predefinição:')?10:requestedTitle.startsWith('Discussão:')?1:0,
    content=ns===0&&scenario==='talk'?(qa.articleSource===undefined?'Texto fictício.\n{{Portal3|Física|Tecnologia|Ciência}}':qa.articleSource):source;
    return{pageid:10+index,title:requestedTitle.replaceAll('_',' '),ns,lastrevid:qa.queryRevision,contentmodel:config.wgPageContentModel,pageprops:{},categories:[],actions:{edit:true},revisions:[{revid:qa.queryRevision,parentid:99,timestamp:'2026-10-17T12:00:00Z',slots:{main:{contentmodel:'wikitext',content}}}],...(qa.queryPageOverrides?.[requestedTitle]||{})};});
   return{curtimestamp:'2026-10-17T12:01:00Z',query:{pages,normalized:[],redirects:[],userinfo:{id:1,name:config.wgUserName,rights:['edit','minoredit']}}};
  }
  throw error('forbidden-action','Ação recusada no simulador local');
 }
 function apiCall(parameters,method){
  const p={...parameters};qa.requests.push({method,parameters:p});
  if(!['query','parse','paraminfo'].includes(p.action)){qa.forbiddenActions.push(p.action);return Promise.reject(error('forbidden-action','Ação de escrita recusada'));}
  let timer,rejecter;const pending=new Promise((resolve,reject)=>{rejecter=reject;timer=setTimeout(()=>{const deliver=()=>{try{resolve(response(p));}catch(reason){reject(reason);}};if(qa.holdHeadingQueries&&p.action==='query'&&p.prop==='pageprops'){(qa.heldHeadingQueries||=[]).push(deliver);qa.releaseHeadingQueries=()=>{qa.holdHeadingQueries=false;const held=qa.heldHeadingQueries.splice(0);held.forEach(fn=>fn());return held.length;};}else deliver();},p.action==='parse'?qa.parseDelay:qa.queryDelay);});
  pending.abort=()=>{qa.aborts++;clearTimeout(timer);rejecter(error('abort','Consulta local cancelada'));};return pending;
 }
 function Api(){this.get=p=>apiCall(p,'GET');this.post=p=>apiCall(p,'POST');this.postWithToken=()=>{qa.forbiddenActions.push('postWithToken');return Promise.reject(error('forbidden-action','Publicação recusada no simulador local'));};this.getErrorMessage=reason=>reason?.message||String(reason);}
 window.mw={config:{get:key=>config[key],set:(key,value)=>typeof key==='object'?Object.assign(config,key):config[key]=value},Api,
  ForeignApi:function(endpoint,options){this.get=parameters=>{
   const entry={endpoint,anonymous:options?.anonymous===true,method:'GET',parameters:{...parameters}};
   (qa.foreignReads||=[]).push(entry);
   if(endpoint!=='https://www.wikidata.org/w/api.php'||!entry.anonymous||parameters.action!=='wbgetentities'||parameters.ids!=='Q123'){
    qa.forbiddenActions.push('foreign-unexpected');return Promise.reject(error('foreign-refused','Consulta não prevista no teste'));
   }
   let rejecter,timer;const request=new Promise((resolve,reject)=>{rejecter=reject;timer=setTimeout(()=>{
    const deliver=()=>{if(qa.foreignFailure)reject(error('foreign-read-failure','Leitura fictícia indisponível'));else resolve({entities:{Q123:JSON.parse(JSON.stringify(qa.humanEntity))}});};
    if(qa.holdForeignRead){(qa.heldForeignReads||=[]).push(deliver);qa.releaseForeignReads=()=>{qa.holdForeignRead=false;const rows=qa.heldForeignReads.splice(0);rows.forEach(fn=>fn());return rows.length;};}else deliver();
   },qa.foreignDelay||10);});request.abort=()=>{qa.aborts++;clearTimeout(timer);rejecter(error('abort','Consulta local cancelada'));};return request;
  };},
  loader:{using:()=>Promise.resolve(),load:()=>{},getScript:()=>Promise.reject(error('external-script-disabled','Carregamento externo recusado'))},
  hook:name=>{if(!hooks.has(name))hooks.set(name,new Set());return{add:fn=>hooks.get(name).add(fn),remove:fn=>hooks.get(name).delete(fn),fire:(...args)=>{for(const fn of hooks.get(name))fn(...args);}};},
  util:{wikiScript:()=>'/w/api.php',getUrl:(name,query={})=>'/w/index.php?'+new URLSearchParams({title:name,...query}),addPortletLink:()=>null},
  user:{options:{get:()=>false},tokens:{get:()=>null},getName:()=>config.wgUserName},notify:message=>{qa.notices.push(String(message));document.getElementById('qa-notice').textContent=String(message);},
  confirmCloseWindow:()=>({release(){}}),message:key=>({text:()=>key,plain:()=>key,parse:()=>key}),msg:key=>key};
 window.jQuery.client={profile:()=>({layout:/Firefox\//.test(navigator.userAgent)?'gecko':'webkit'})};
 const overrides={autoPreview:params.get('preview')==='1',registryDoiCheck:false};
 if(params.get('reset')!=='0'){localStorage.removeItem('RevisaWiki.preferences.v1.2');localStorage.removeItem('RevisaWiki.spelling.v1.3:ptwiki%3AConta%20local%20fict%C3%ADcia');}
 localStorage.setItem('RevisaWiki.preferences.v1.2',JSON.stringify({preset:'all',overrides:{...JSON.parse(localStorage.getItem('RevisaWiki.preferences.v1.2')||'{"overrides":{}}').overrides,...overrides}}));
 window.RevisaWikiConfig={};
 if(scenario==='personal')window.RevisaWikiConfig.autoSummary=false;
 if(scenario==='preview-failure')qa.failParse=true;
 if(scenario==='preview-new-error')qa.newParseError=true;
 if(scenario==='slow'||scenario==='race')qa.queryDelay=500;
 if(scenario==='view'){
  document.getElementById('editform').remove();
  const lead=document.createElement('button');lead.className='rw26-lead-launch';lead.textContent='Atalho antigo';document.getElementById('firstHeading').appendChild(lead);
  const stale=document.createElement('button');stale.className='rw26-launch';stale.textContent='Editar aqui';document.querySelector('.mw-editsection').appendChild(stale);
 }
 if(adapter==='codemirror'){
  textarea.hidden=true;const surface=document.createElement('div');surface.className='cm-editor qa-editor';surface.textContent=source;textarea.after(surface);
  window.jQuery(textarea).textSelection('register',{getContents:()=>qa.model,setContents:value=>{qa.model=value;qa.modelWrites++;surface.textContent=value;},getCaretPosition:()=>[0,0],setSelection:()=>{},scrollToCaretPosition:()=>{}});
 }
 if(adapter==='2017'||adapter==='visual'){
  textarea.hidden=true;const surfaceNode=document.createElement('div');surfaceNode.className='ve-ui-surface qa-editor';surfaceNode.textContent=source;textarea.after(surfaceNode);
  const events=new Map(),model={getDom:()=>qa.model,getDocument:()=>({getDocumentRange:()=>({start:0,end:qa.model.length})}),on:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},breakpoint:()=>qa.breakpoints++,getLinearFragment:()=>({insertContent:value=>{qa.model=value;qa.modelWrites++;surfaceNode.textContent=value;for(const fn of events.get('change')||[])fn();}}),setLinearSelection:()=>{}},
   surface={getMode:()=>adapter==='visual'?'visual':'source',getModel:()=>model,getView:()=>({focus(){},scrollSelectionIntoView(){}})},
   target={revid:100,editSummaryValue:'',getSurface:()=>surface,on(){},saveDialog:{changedEditSummary:false,editSummaryInput:{getValue:()=>target.editSummaryValue,setValue:value=>target.editSummaryValue=value}}};
  window.ve={init:{target},Range:function(start,end){this.start=start;this.end=end;},dm:{sourceConverter:{getDataFromSourceText:value=>Array.from(value).concat(null)}}};qa.veTarget=target;
 }
 if(adapter==='wiked')window.wikEd={useWikEd:true};
 if(['fallback','fallback-timer','fallback-channel-error','fallback-self-message-held'].includes(scenario))Object.defineProperty(window,'Worker',{value:undefined,configurable:true});
 else if(typeof window.Worker==='function'){
  const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);qa.workerStarts++;this.addEventListener('message',event=>{if(event.data?.type==='result')qa.workerResults.push({id:event.data.id,result:event.data.result});});}postMessage(...args){if(params.get('nativeWitness')==='1'&&args[0]?.type==='calculate')(qa.nativeWitnessJobs??=[]).push(JSON.parse(JSON.stringify(args[0])));return super.postMessage(...args);}terminate(){qa.workerTerminates++;return super.terminate();}};
 }
 if(scenario==='fallback-timer'||scenario==='fallback-self-message-held')Object.defineProperty(window,'MessageChannel',{value:undefined,configurable:true});
 if(scenario==='fallback-channel-error')Object.defineProperty(window,'MessageChannel',{value:function(){throw new Error('Canal local deliberadamente indisponível');},configurable:true});
 qa.read=()=>adapter==='codemirror'||adapter==='2017'||adapter==='visual'?qa.model:document.getElementById('wpTextbox1')?.value;
 qa.write=value=>{if(adapter==='codemirror'||adapter==='2017'||adapter==='visual'){qa.model=value;document.querySelector('.qa-editor').textContent=value;if(adapter==='2017')mw.hook('ve.wikitextInteractive').fire();}else document.getElementById('wpTextbox1').value=value;document.getElementById('wpTextbox1')?.dispatchEvent(new Event('input',{bubbles:true}));};
 qa.summary=()=>qa.veTarget?qa.veTarget.editSummaryValue:document.getElementById('wpSummary')?.value;
 qa.setSummary=value=>{if(qa.veTarget)qa.veTarget.editSummaryValue=value;else{document.getElementById('wpSummary').value=value;document.getElementById('wpSummary').dispatchEvent(new Event('input',{bubbles:true}));}};
 qa.state=()=>({source:qa.read(),summary:qa.summary(),minor:document.getElementById('wpMinoredit')?.checked,processing:window.RevisaWiki?.processing,status:document.querySelector('.ajg-status')?.textContent,count:document.querySelector('.ajg-result-count')?.textContent,bytes:document.querySelector('.ajg-bytes')?.textContent,checked:document.querySelector('.ajg-run')?.dataset.codeChecked,buttons:[...document.querySelectorAll('#revisawiki-ptwiki button')].map(button=>({text:button.textContent,hidden:button.hidden,disabled:button.disabled})),errors:qa.errors,forbiddenActions:qa.forbiddenActions,submits:qa.submits,saveClicks:qa.saveClicks,nativeDiffClicks:qa.nativeDiffClicks,clipboardWrites:qa.clipboardWrites});
 qa.ready=true;
})();

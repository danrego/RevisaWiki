/* Models editor adapter contracts and parse failures on localhost only. */
const editorMode=params.get('editor')||'classic';
__rwFixture.editorMode=editorMode;
if(editorMode==='codemirror'){
 const box=document.querySelector('#wpTextbox1');let calls=0;
 jQuery(box).textSelection('register',{
  getContents(){calls++;return box.value;},setContents(value){calls++;box.value=value;return this;},
  getCaretPosition(o){return o.startAndEnd?[box.selectionStart,box.selectionEnd]:box.selectionStart;},
  setSelection(o){box.setSelectionRange(o.start,o.end);return this;},scrollToCaretPosition(){return this;}
 });__rwFixture.adapterCalls=()=>calls;
}
if(editorMode==='source2017'||editorMode==='visual-switch'){
 const box=document.querySelector('#wpTextbox1'),listeners=[];
 const model={getDom:()=>box.value,getDocument:()=>({getDocumentRange:()=>({start:0,end:box.value.length})}),getLinearFragment:()=>({insertContent(value){box.value=value;for(const fn of listeners)fn();}}),breakpoint(){},setLinearSelection(){},on:(event,fn)=>listeners.push(fn)};
 __rwFixture.veMode=editorMode==='visual-switch'?'visual':'source';
 const surface={getMode:()=> __rwFixture.veMode,getModel:()=>model,getView:()=>({focus(){},scrollSelectionIntoView(){}})};
 const summary=document.querySelector('#wpSummary'),target={getSurface:()=>surface,revid:123,editSummaryValue:'',saveDialog:{editSummaryInput:{getValue:()=>summary.value,setValue:value=>{summary.value=value;}},changedEditSummary:false}};
 if(editorMode==='visual-switch'){box.remove();config.wgAction='view';__rwFixture.activateSource=()=>{__rwFixture.veMode='source';document.querySelector('#editform').prepend(box);mw.hook('ve.activationComplete').fire();};}
 window.ve={init:{target},Range:function(start,end){this.start=start;this.end=end;},dm:{sourceConverter:{getDataFromSourceText:source=>Array(source.length+1).fill(0)}}};
}
const parseScenario=params.get('parse-scenario');
if(parseScenario){
 const OldApi=mw.Api;
 mw.Api=function(){const api=new OldApi();for(const method of ['get','post'])this[method]=p=>{
  const original=api[method](p);if(p.action!=='parse')return original;
  const pending=original.then(data=>{
   if(parseScenario==='failure')throw new Error('Falha de pré-visualização simulada');
   if(parseScenario==='duplicate-error'){const error='<span class="error mw-ext-cite-error">Erro de citação: uma falha já existente.</span>';return {parse:{text:'<div class="mw-parser-output">'+error+(p.text.includes('exceção')?error:'')+'</div>',parsewarnings:[]}};}
   if(parseScenario==='cell-loss'){const lost=/scope\s*=/.test(p.text);return {parse:{text:'<div class="mw-parser-output"><table class="wikitable"><tr><th>Nome</th><th>Cidade</th></tr><tr><td>'+(lost?'':'Ana')+'</td><td>Recife</td></tr></table></div>',parsewarnings:[]}};}
   if(parseScenario==='new-error'&&p.text.includes('exceção'))return {parse:{text:'<div class="mw-parser-output"><strong class="error">Erro de citação: falha de teste.</strong></div>',parsewarnings:[]}};
   if(parseScenario==='notes'&&p.text.includes('group="nota"')&&!/\{\{(?:Notas|Notas e referências)|<references[^>]*group="nota"/i.test(p.text))return {parse:{text:'<div class="mw-parser-output"><strong class="error">Erro de citação: Existem etiquetas &lt;ref&gt; para um grupo chamado "nota", mas não foi encontrada nenhuma etiqueta &lt;references group="nota"/&gt; correspondente</strong></div>',parsewarnings:[]}};
   return data;
  });pending.abort=()=>original.abort();return pending;
 };};
}

const registryScenario=params.get('registry-scenario');
if(registryScenario){
 const originalFetch=window.fetch.bind(window);__rwFixture.registryRequests=[];
 window.fetch=async(input,options={})=>{const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.hostname!=='api.crossref.org')return originalFetch(input,options);__rwFixture.registryRequests.push({url:url.href,method:options.method,credentials:options.credentials});const doi=decodeURIComponent(url.pathname.replace('/works/',''));if(doi.endsWith('.')||doi.endsWith('/agency'))return new Response('{}',{status:404,headers:{'Content-Type':'application/json'}});const metadata={DOI:'10.1234/teste',title:[registryScenario==='mismatch-title'?'Outro artigo':'Artigo de teste'],author:[{family:registryScenario==='mismatch-author'?'Pereira':'Silva',given:'Ana'}],published:{'date-parts':[[registryScenario==='mismatch-year'?2021:2020]]}};return new Response(JSON.stringify({status:'ok',message:metadata}),{status:200,headers:{'Content-Type':'application/json'}});};
}

const noteScenario=params.get('note-scenario');
if(noteScenario){
 const originalApi=mw.Api;mw.Api=function(){const api=new originalApi();for(const method of ['get','post'])this[method]=p=>{const original=api[method](p);if(p.action!=='parse'||p.text?.includes('Fonte de teste.'))return original;const pending=original.then(data=>{if(/\{\{(?:Notas|Notas e referências)(?:\||}})|<references[^>]*group=/i.test(p.text))return data;const fixture=__rwNoteRenderFixtures.find(f=>f.id===noteScenario);return {parse:{text:fixture.html,parsewarnings:[]}};});pending.abort=()=>original.abort();return pending;};};
}

/* RevisaWiki2.1: anonymous Wikidata responses are local fixtures, never network calls. */
const womanScenario=params.get('woman-scenario');
if(womanScenario){
 config.wgWikibaseItemId='Q123';__rwFixture.foreignRequests=[];
 const statement=(id,rank='normal')=>({rank,mainsnak:{snaktype:'value',datatype:'wikibase-item',datavalue:{type:'wikibase-entityid',value:{id}}}});
 mw.ForeignApi=function(endpoint,options){
  __rwFixture.foreignOptions={endpoint,options};
  this.get=p=>{
   __rwFixture.foreignRequests.push({...p});
   if(p.action!=='wbgetentities'||p.ids!=='Q123'||p.props!=='claims|sitelinks'||p.sitefilter!=='ptwiki'){
    __rwFixture.forbidden.push(p);return Promise.reject(new Error('Unexpected foreign API operation'));}
   let timer,rejecter;const promise=new Promise((resolve,reject)=>{rejecter=reject;timer=setTimeout(()=>{
    if(womanScenario==='failure'){reject(new Error('Simulated Wikidata read failure'));return;}
    const entity={id:'Q123',type:'item',claims:{P31:[statement('Q5')],P21:[statement(womanScenario==='trans-woman'?'Q1052281':'Q6581072')]},sitelinks:{ptwiki:{title}}};
    if(womanScenario==='male')entity.claims.P21=[statement('Q6581097')];
    if(womanScenario==='nonhuman')entity.claims.P31=[statement('Q11424')];
    if(womanScenario==='mixed-human-fiction')entity.claims.P31.push(statement('Q95074'));
    if(womanScenario==='duplicate-human')entity.claims.P31.push(statement('Q5','preferred'));
    if(womanScenario==='deprecated-fiction')entity.claims.P31.push(statement('Q95074','deprecated'));
    if(womanScenario==='preferred-gender')entity.claims.P21[0].rank='preferred';
    if(womanScenario==='qualified-human')entity.claims.P31[0].qualifiers={P580:[{snaktype:'value'}]};
    if(womanScenario==='unknown-human')entity.claims.P31[0].mainsnak.snaktype='somevalue';
    if(womanScenario==='wrong-item')entity.id='Q124';
    if(womanScenario==='wrong-title')entity.sitelinks.ptwiki.title='Outra pessoa';
    if(womanScenario==='qualified')entity.claims.P21[0].qualifiers={P580:[{snaktype:'value'}]};
    if(womanScenario==='unknown-gender')entity.claims.P21[0].mainsnak.snaktype='somevalue';
    if(womanScenario==='deprecated')entity.claims.P21[0].rank='deprecated';
    if(womanScenario==='mixed-values')entity.claims.P21.push(statement('Q6581097'));
    if(womanScenario==='missing-p21')delete entity.claims.P21;
    if(womanScenario==='missing-sitelink')delete entity.sitelinks.ptwiki;
    resolve({entities:{Q123:entity}});
   },Number(params.get('woman-delay')||20));});
   promise.abort=()=>{clearTimeout(timer);rejecter(new Error('Local anonymous query cancelled'));};return promise;
  };
 };
}

const nreScenario=params.get('nre-scenario');
if(nreScenario){
 const OldNreApi=mw.Api;
 mw.Api=function(){const api=new OldNreApi();for(const method of ['get','post'])this[method]=p=>{
  const original=api[method](p);if(p.action!=='parse'||p.text?.includes('Fonte de teste.'))return original;
  const pending=original.then(data=>{
   if(/\{\{(?:Notas|Notas e referências)(?:\||}})|<references[^>]*group=/i.test(p.text))return data;
   const fixture=__rwNoteRenderFixtures.find(f=>f.id==='same-group-two-notes');
   if(!fixture)throw new Error('Missing local Cite HTML fixture');
   const group=nreScenario==='explicit-nota'?'nota':nreScenario==='custom'?'custom':'lower-alpha';
   return {parse:{text:fixture.html.replaceAll('nota',group),parsewarnings:[]}};
  });pending.abort=()=>original.abort();return pending;
 };
 };
}
if(params.has('authority-on'))window.RevisaWikiConfig.authorityControl=true;

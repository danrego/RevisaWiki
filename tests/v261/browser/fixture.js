const params = new URLSearchParams(location.search);
const namespace = Number(params.get('ns') || 0);
const model = params.get('model') || 'wikitext';
const caseName = params.get('case') || 'mount';
const title = params.get('title') || ({0:'Teste RevisaWiki',1:'Discussão:Teste RevisaWiki',2:'Usuário:Teste',3:'Usuário Discussão:Teste',4:'Wikipédia:Teste',5:'Wikipédia Discussão:Teste',10:'Predefinição:Teste',11:'Predefinição Discussão:Teste',14:'Categoria:Teste'}[namespace] || 'Teste');
const sources = {
  mount:'O texto tem uma excessão.\n',
  spelling:'O texto tem uma excessão. O relato de de um passeio continua.\n',
  signed:': O texto tem uma excessão. [[Foo|Foo]] [[Usuário:Fulano|Fulano]] 21h34min de 10 de outubro de 2026 (UTC)\n',
  template:'<includeonly>{{{texto|uma excessão}}}\n<ref name="n" />{{{fonte|<ref name="n">Fonte</ref>}}}\n<ref name="RevisaWiki-auto-1">Outra fonte</ref></includeonly>\n',
  references:'Primeira.<ref>Fonte</ref>\nSegunda.<ref>Fonte</ref>\nTerceira.<ref name="RevisaWiki-auto-9">Outra fonte</ref>\nQuarta.{{r|1=RevisaWiki-auto-9}}\n{{Referências}}\n',
  living:'{{Info/Biografia|nome=Ana|data_nascimento={{Dni|1|1|1980|si}}<ref name="dob">Fonte da data.</ref>}}\nAna nasceu em Paris.\n{{Referências}}\n',
  portals:'{{Info/Tenista|nome=Ana|local_nascimento=[[Paris]], [[França]]}}\nAna nasceu em Paris.\n',
  occupation:'{{Info/Biografia|nome=Ana|ocupação=Médico, Professor<ref name="occupation">{{Citar livro|título=Professor e Médico|ano=2020}}</ref>|data_nascimento={{Dni|1|1|1980|si}}<ref name="dob">Fonte da data.</ref>|local_nascimento=[[Paris]], [[França]]}}\nAna nasceu em Paris.\n{{Referências}}\n',
  institution:'{{Info/Biografia|nome=Ana|ocupação=Diretor do Instituto Médico Legal<br />Professor Pardal<br />CEO<ref name="occupation">{{Citar livro|título=Professor e Médico|ano=2020}}</ref>|data_nascimento={{Dni|1|1|1980|si}}<ref name="dob">Fonte da data.</ref>|local_nascimento=[[Paris]], [[França]]}}\nAna nasceu em Paris.\n{{Referências}}\n',
  occupationlinks:'{{Info/Biografia|nome=Ana|ocupação=[[Medicina|Médico]], [[Professor]]|local_nascimento=[[Paris]], [[França]]}}\nAna nasceu em Paris.\n',
  regionalportals:'{{Info/Político|nome=Ana|data_nascimento={{dni|1|6|1980}}|local_nascimento=[[Uberlândia]], [[Brasil]]}}\nAna nasceu no Brasil.\n\n{{Portal3|Biografias|Política|Goiás|Cristianismo}}\n',
  simpleportals:'{{Info/Tenista|nome=Ana|data_nascimento={{dni|1|6|1980}}|local_nascimento=[[Paris]], [[França]]}}\nAna nasceu em Paris.\n\n{{Portal3|Biografias}}\n',
  dnilower:'{{dni|1|6|1980}}\n',
  livinglower:'{{Info/Biografia|nome=Ana|data_nascimento={{dni|1|1|1980|si}}<ref name="dob">Fonte da data.</ref>}}\nAna nasceu em Paris.\n{{Referências}}\n',
  css:'.sidebar { color:var(--color-base,#202122); background-color:var(--background-color-base,#fff); }\n'
};
const source = sources[caseName] || sources.mount;
document.getElementById('wpTextbox1').value = source;
const config = {wgDBname:'ptwiki',wgServerName:'pt.wikipedia.org',wgUserName:'Conta de Teste',wgNamespaceNumber:namespace,wgTitle:title.replace(/^[^:]+:/,''),
  wgPageContentModel:model,wgPageName:title.replaceAll(' ','_'),wgRevisionId:123,wgIsRedirect:false,wgIsDisambiguationPage:false};
const hooks = new Map();
const qa = window.__rwFixture = {source,title,namespace,model,requests:[],apiMethods:[],submits:0,forbidden:[]};
document.getElementById('editform').addEventListener('submit',event=>{
  event.preventDefault();qa.submits++;document.getElementById('qa-submits').textContent=String(qa.submits);
});
window.jQuery.client = {profile:()=>({layout:/Firefox\//.test(navigator.userAgent)?'gecko':'webkit'})};
window.RevisaWikiConfig = {authorityControl:false,endTemplateOrder:false};
if(params.has('worker-off'))window.Worker=undefined;
function response(p) {
  if(p.action==='query'&&p.prop==='revisions'&&window.__rwTalkArticle!==undefined) {
    return {query:{pages:[window.__rwTalkArticleMissing?{title:p.titles,ns:0,missing:true}:{title:p.titles,ns:window.__rwTalkArticleNamespace??0,pageid:1,revisions:[{revid:456,slots:{main:{content:window.__rwTalkArticle,contentmodel:'wikitext'}}}]}]}};
  }
  if(window.__v22parse&&p.action==='parse'&&p.text) {const text=window.__v22parse(p.text);if(text)return {parse:{text,parsewarnings:[],images:[],templates:[]}};}
  if(p.action==='query'&&p.prop==='pageprops'&&params.has('heading-proof')) {
    const scenario=params.get('heading-proof');return {query:{pages:(p.titles||'').split('|').map(title=>({title,ns:0,...(scenario==='missing'?{missing:true}:{pageid:100,pageprops:scenario==='disambiguation'?{disambiguation:''}:{}})}))}};
  }
  if(p.revids)return {query:{pages:[{title,ns:namespace,revisions:[{revid:123,slots:{main:{content:source}}}]}]}};
  if(p.prop==='categories'&&p.clcategories==='Categoria:Pessoas vivas') {
    const scenario=params.get('living')||'absent';
    return {query:{pages:[{title:scenario==='title-mismatch'?'Outra pessoa':title,
      ns:scenario==='namespace-mismatch'?2:namespace,pageid:1,
      categories:scenario==='absent'?[]:[{ns:14,title:'Categoria:Pessoas vivas'}]}]}};
  }
  if(p.action==='parse'&&p.text?.includes('Fonte de teste.'))return {parse:{text:'<div class="reflist" style="column-count:2;"><ol><li>Fonte</li></ol></div>',parsewarnings:[]}};
  if(p.templatesandboxcontentmodel==='sanitized-css')return {parse:{text:'<style data-mw-deduplicate="TemplateStyles:r1">'+p.templatesandboxtext+'</style>',parsewarnings:[]}};
  if(p.action==='parse')return {parse:{text:'<div class="mw-parser-output"><p>O texto de teste.</p></div>',parsewarnings:[],images:[],templates:[]}};
  const targets=window.RevisaWiki?.templateTargets(source)||[];
  const pages=(p.titles||title).split('|').map(name=>({title:name,ns:name.startsWith('Predefinição:')?10:namespace,pageid:1,
    revisions:[{revid:targets.find(t=>t.title===name)?.oldid||targets.find(t=>t.title===name)?.profile?.oldid||123}],pageprops:{},imageinfo:[],categories:[]}));
  return {query:{pages}};
}
function apiCall(p) {
  qa.requests.push({...p});document.getElementById('qa-requests').textContent=String(qa.requests.length);
  if(!['query','parse','paraminfo'].includes(p.action||'query')) {
    qa.forbidden.push(p);return Promise.reject(new Error('A API simulada recusa ações de escrita.'));
  }
  if(p.action==='query'&&p.prop==='revisions'&&window.__rwTalkArticleFailure)return Promise.reject(new Error('Falha de leitura simulada'));
  let rejecter,timer;
  const promise=new Promise((resolve,reject)=>{rejecter=reject;timer=setTimeout(()=>resolve(response(p)),10);});
  promise.abort=()=>{clearTimeout(timer);rejecter(new Error('Pedido cancelado'));};return promise;
}
window.mw={config:{get:key=>config[key]},loader:{using:()=>Promise.resolve()},Api:function(){this.get=p=>{qa.apiMethods.push('GET');return apiCall(p);};this.post=p=>{qa.apiMethods.push('POST');return apiCall(p);};},
  hook:name=>{if(!hooks.has(name))hooks.set(name,[]);return {add:callback=>hooks.get(name).push(callback),fire:(...args)=>hooks.get(name).forEach(fn=>fn(...args))};},
  notify:message=>{document.getElementById('qa-notice').textContent=message;}};
Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{document.getElementById('qa-clipboard').value=text;}}});
window.addEventListener('error',event=>{document.getElementById('qa-errors').textContent+=event.message+'\n';});
window.addEventListener('unhandledrejection',event=>{document.getElementById('qa-errors').textContent+=String(event.reason)+'\n';});

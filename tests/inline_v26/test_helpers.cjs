'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const file=path.resolve(process.argv[2]||path.join(__dirname,'../inline/inline_controller.js'));
const code=fs.readFileSync(file,'utf8'),context=vm.createContext({URL,TextEncoder,Date,console});
vm.runInContext(code+'\nglobalThis.__H=v26InlineHelpers;',context);const H=context.__H;
const report={version:'2.6.0',sourceSha256:crypto.createHash('sha256').update(code).digest('hex'),tests:[],checks:0,actualWikipediaWrites:0,networkRequests:0};
function check(value,message){report.checks++;if(!value)throw new Error(message);}
function same(a,b,message){check(JSON.stringify(a)===JSON.stringify(b),message);}
function fails(fn,message){let caught=false;try{fn();}catch{caught=true;}check(caught,message);}
function test(name,fn){try{fn();report.tests.push({name,passed:true});}catch(e){report.tests.push({name,passed:false,error:e.message});}}
const origin='https://pt.wikipedia.org';
for(const title of ['História da luz','Óptica','João_da_Silva','Predefinição:Nome','Discussão:São_Paulo'])for(const section of ['0','1','12','209'])test('same-wiki target '+title+' section '+section,()=>{
  const value=H.parseEditTarget('/w/index.php?'+new URLSearchParams({title,action:'edit',section}),origin);
  same({title:value.title,section:value.section},{title:title.replaceAll('_',' '),section},'Exact normalized title and API section');
  check(value.href.startsWith(origin+'/w/index.php?'),'Bound origin');
});
for(const href of [
  'https://example.invalid/w/index.php?title=A&action=edit&section=1',
  '//example.invalid/w/index.php?title=A&action=edit&section=1',
  'http://pt.wikipedia.org/w/index.php?title=A&action=edit&section=1',
  '/wiki/A?title=A&action=edit&section=1',
  '/w/index.php?title=A&action=view&section=1',
  '/w/index.php?title=A&action=edit',
  '/w/index.php?title=A&action=edit&section=T-1',
  '/w/index.php?title=A&action=edit&section=new',
  '/w/index.php?title=A&action=edit&section=-1',
  '/w/index.php?title=&action=edit&section=1',
  ...['oldid','undo','preload','editintro','redirect','returnto','preloadtitle','preloadparams[]','wpTextbox1','veaction','unknown'].map(key=>'/w/index.php?title=A&action=edit&section=1&'+encodeURIComponent(key)+'=value')
])test('native fallback for link '+href,()=>fails(()=>H.parseEditTarget(href,origin),'Unsafe/unsupported link must not target inline editing'));
test('revision content explicit main slot',()=>{same(H.revisionContent({slots:{main:{content:'Texto completo.',contentmodel:'wikitext'}}}),'Texto completo.','Exact unexpanded content');same(H.revisionContent({slots:{main:{content:''}}}),'','Existing empty source is not missing source');});
for(const rev of [{},{slots:{}},{slots:{main:{}}},{texthidden:true,slots:{main:{content:'Texto'}}},{slots:{main:{contenthidden:true,content:'Texto'}}},{slots:{main:{content:'Texto',contentmodel:'Scribunto'}}},{slots:{main:{content:12}}}])test('unavailable or non-wikitext revision '+JSON.stringify(rev),()=>fails(()=>H.revisionContent(rev),'Missing/hidden source must never become an overwrite draft'));
test('snapshot captures immutable publication fields',()=>{
  const s={textarea:{value:'Texto'},summaryInput:{value:'Resumo'},minorInput:{checked:true},watchInput:{value:'watch'},title:'Página',section:'2',base:123,timestamp:'2026-10-15T00:00:00Z',starttimestamp:'2026-10-15T00:01:00Z',user:'Conta de teste',pageid:9};
  const value=H.snapshotDraft(s);s.textarea.value='Outro texto';s.summaryInput.value='Outro resumo';s.minorInput.checked=false;
  check(Object.isFrozen(value),'Frozen publication snapshot');same(value.text,'Texto','Source captured at deliberate click');same(value.summary,'Resumo','Manual summary captured');check(value.minor&&value.watchlist==='watch','Explicit minor and watch choices');
});
test('default publication choices do not silently add minor or watch',()=>{const s={textarea:{value:'x'},summaryInput:{value:''},minorInput:{checked:false},watchInput:{value:'preferences'}};const value=H.snapshotDraft(s);check(value.minor===false,'Not minor by default');check(value.watchlist==='preferences','Watch preferences retained');});
test('summary name is a name and never section source',()=>{
  const value=H.renderSummary('/* $sectionname */ $summary',{section:'2',sectionname:'Óptica e luz',summary:'Corrige um erro'});
  check(value==='/* Óptica e luz */ Corrige um erro','Exact user summary and heading substitution');
  check(H.renderSummary('$summary $summary',{summary:'Revisão'})==='Revisão Revisão','All supported placeholder occurrences handled');
});
for(const watchlist of ['preferences','watch','unwatch','nochange'])test('all explicit watch controls '+watchlist,()=>{const s={textarea:{value:'x'},summaryInput:{value:''},minorInput:{checked:false},watchInput:{value:watchlist}};check(H.snapshotDraft(s).watchlist===watchlist,'Watch choice preserved exactly');});
test('expanded summary compatibility',()=>{check(H.renderSummary('$sectionlink $summary $scriptlink',{sectionname:'Óptica',summary:'Corrige texto',scriptlink:'Ferramenta'})==='/* Óptica */ Corrige texto Ferramenta','Documented compatibility placeholders');check(H.renderSummary('$sectionname',{sectionname:'Óptica',summary:'Revisão manual'})==='Óptica Revisão manual','Manual summary never lost when placeholder omitted');check(H.renderSummary('$unknown $summary',{summary:'Revisão'})==='$unknown Revisão','Unknown variable remains visible for warning');});
const now=1800000000000,contextValue={origin,title:'Óptica',section:'2',base:123};
const valid={schema:1,origin,title:'Óptica',section:'2',base:123,savedAt:now-1000,text:'Texto do rascunho',summary:'Revisão manual',minor:true,watchlist:'watch'};
test('matching session-only recovery',()=>same(H.validateRecovery(valid,contextValue,now),{text:valid.text,summary:valid.summary,minor:true,watchlist:'watch'},'Only matching source binding restores content'));
for(const [key,value]of [
  ['schema',2],['origin','https://example.invalid'],['origin','http://pt.wikipedia.org'],['title','Outro artigo'],['section','1'],['base',124],['base','123'],['base',0],['base',1.5],['savedAt',now+1001],['savedAt',now-900001],['savedAt','recent'],['text',null],['text','x'.repeat(4194305)],['summary',null],['summary','x'.repeat(2001)],['watchlist','invalid']
])test('invalid recovery '+key+' '+(typeof value==='string'&&value.length>50?'oversize':JSON.stringify(value)),()=>check(H.validateRecovery({...valid,[key]:value},contextValue,now)===null,'Mismatching/expired draft must not enter native editor'));
for(const key of Object.keys(valid))test('recovery missing '+key,()=>{const candidate={...valid};delete candidate[key];const value=H.validateRecovery(candidate,contextValue,now);if(key==='minor')check(value?.minor===false,'Missing optional minor never grants minor');else check(value===null,'Required recovery identity and content retained');});
test('recovery inclusive age limits',()=>{check(H.validateRecovery({...valid,savedAt:now-900000},contextValue,now)!==null,'Exactly15minutes accepted');check(H.validateRecovery({...valid,savedAt:now+1000},contextValue,now)!==null,'Small measuredclockskew accepted');});
for(const code of ['editconflict','pagedeleted','missingtitle','invalidsection','nosuchsection'])test('known conflict classification '+code,()=>{const value=H.classifyError({code});check(value.conflict&&value.native&&!value.uncertain,'Known rejected conflict requires native resolution, never auto resend');});
for(const code of ['http','timeout','network','abort','unknown','empty-response','invalid-response'])test('uncertain save classification '+code,()=>{const value=H.classifyError({code});check(value.uncertain,'Transport ambiguity cannot become definite rejection or automatic retry');});
for(const code of ['assertuserfailed','badtoken','captcha','abusefilter-warning','abusefilter-disallowed','protectedpage','blocked','readonly','ratelimited'])test('native error classification '+code,()=>check(H.classifyError({code}).native,'Human complete editor required for challenge/account/permission/error'));
report.passed=report.tests.filter(t=>t.passed).length;report.failed=report.tests.filter(t=>!t.passed).length;report.completedAt=new Date().toISOString();
const output=path.resolve(process.env.REVISAWIKI_QA_REPORT||path.join(__dirname,'reports/helpers.json'));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,failed:report.failed,checks:report.checks,sourceSha256:report.sourceSha256}));for(const test of report.tests.filter(t=>!t.passed))console.error(test.name+': '+test.error);if(report.failed)process.exitCode=1;

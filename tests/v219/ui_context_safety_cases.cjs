'use strict';
// Pure UI ownership predicates. Native browser races are separate action evidence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'UI-context-pure-predicate-boundaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),bundles:[],cases:[],checks:0,actualWholeActionExecutions:0,networkRequests:0,wikipediaWrites:0,limits:['These predicates do not apply article transformations, publish, or execute DOM event handlers.','Native complete UI action races and fresh controls must pass separately.']};
for(const file of files){const a=require(file),bundle=path.basename(file),bytes=fs.readFileSync(file);report.bundles.push({bundle,sha256:sha(bytes)});const editor={},value={title:'Discussão:Tema fictício',namespace:1,model:'wikitext',base:123,section:null,editor};
 function check(id,run){const row={bundle,id,kind:'helper-only',status:'passed'};report.cases.push(row);try{run();report.checks++;}catch(e){row.status='failed';row.message=e.message;report.status='failed';}}
 check('same source ownership',()=>assert.equal(a.v219UIContextSame(value,{...value}),true));
 check('snapshot frozen',()=>{const snapshot=a.v219UIContext(value);assert(Object.isFrozen(snapshot));const changed={...value};changed.title='Outro tema';assert.equal(snapshot.title,value.title);});
 for(const[key,next]of [['title','Discussão:Outro tema'],['namespace',0],['model','sanitized-css'],['base',124],['section','0'],['section',''],['editor',{}]])check('changed-'+key+'-'+String(next),()=>assert.equal(a.v219UIContextSame(value,{...value,[key]:next}),false));
 for(const key of Object.keys(value))check('missing-'+key,()=>{const invalid={...value};delete invalid[key];assert.equal(a.v219UIContext(invalid),null);assert.equal(a.v219UIContextSame(value,invalid),false);});
 for(const invalid of [null,undefined,{},Object.create(value),{...value,title:''},{...value,title:123},{...value,namespace:'1'},{...value,namespace:NaN},{...value,base:-1},{...value,base:Infinity},{...value,base:1.5},{...value,model:''},{...value,section:0},{...value,editor:null}])check('invalid-context-'+report.cases.length,()=>assert.equal(a.v219UIContext(invalid),null));
 const page={pageid:77,ns:0,title:'Tema fictício',revisions:[{revid:123,slots:{main:{contentmodel:'wikitext',content:'Texto literal.'}}}]};
 check('exact article response',()=>assert.equal(a.v219UITalkArticle(page,'Tema fictício'),true));
 check('native title underscores',()=>assert.equal(a.v219UITalkArticle({...page,title:'Tema_fictício'},'Tema fictício'),true));
 check('native NFC identity',()=>assert.equal(a.v219UITalkArticle({...page,title:'Tema ficti\u0301cio'},'Tema fictício'),true));
 for(const[flag,value]of [['missing',true],['invalid',true],['redirect',true],['ns',1],['title','Outro tema'],['title','TEMA FICTÍCIO'],['pageid',0],['pageid','77'],['revisions',[]]])check('article-response-'+flag+'-'+String(value),()=>assert.equal(a.v219UITalkArticle({...page,[flag]:value},'Tema fictício'),false));
 for(const revision of [{revid:0,slots:page.revisions[0].slots},{revid:123,slots:{}},{revid:123,slots:{main:{contentmodel:'javascript',content:'texto'}}},{revid:123,slots:{main:{contentmodel:'wikitext',content:0}}}])check('article-revision-'+report.cases.length,()=>assert.equal(a.v219UITalkArticle({...page,revisions:[revision]},'Tema fictício'),false));
 check('no title supplied',()=>assert.equal(a.v219UITalkArticle(page,''),false));
 check('runtime immutable',()=>assert.equal(sha(fs.readFileSync(file)),sha(bytes)));
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

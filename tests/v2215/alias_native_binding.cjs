'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'),api=require(file),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const base={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false};
let checks=0;const failures=[];function eq(actual,expected,label){checks++;try{assert.deepEqual(actual,expected,label);}catch{failures.push({label,actual,expected});}}
const unsafe=[
 ['{{Citar periódico|título=Fonte|vauthors=Alpha AB, Beta CD}}','{{Citar periódico|título=Fonte|vautores=Alpha AB, Beta CD}}'],
 ['{{Citar livro|título=Fonte|veditors=Alpha AB, Beta CD}}','{{Citar livro|título=Fonte|veditores=Alpha AB, Beta CD}}'],
 ['{{Citar web|título=Fonte|vauthors=Alpha AB, Beta CD}}','{{Citar web|título=Fonte|vautores=Alpha AB, Beta CD}}'],
 ['{{Citar periódico|título=Fonte|mês=maio}}','{{Citar periódico|título=Fonte}}'],
 ['{{Citar periódico|título=Fonte|mês=maio|data=2003}}','{{Citar periódico|título=Fonte|data=2003}}'],
 ['{{Citar periódico|título=Fonte|mês=maio|ano=2003}}','{{Citar periódico|título=Fonte|ano=2003}}'],
 ['{{Citar periódico|título=Fonte|mês=maio|ano=2003}}','{{Citar periódico|título=Fonte|data=2003}}'],
 ['{{Citar periódico|título=Fonte|mês=maio|ano=2003}}','{{Citar periódico|título=Fonte|data=junho de 2003}}'],
 ['{{Citar periódico|título=Fonte|mês=maio|ano=2003}}','{{Citar periódico|título=Fonte|data=maio de 2004}}'],
 ['{{Citar livro|title=Mesmo|issue=1}}{{Citar livro|title=Mesmo|issue=2}}','{{Citar livro|título=Mesmo|número=1}}{{Citar livro|título=Mesmo|número=2}}'],
 ['{{Citar livro|title=Mesmo|número=1}}{{Citar livro|title=Mesmo|número=2}}','{{Citar livro|título=Mesmo|issue=1}}{{Citar livro|título=Mesmo|issue=2}}'],
 ['{{Citar livro|title=Livro|issue=3}}','{{Citar livro|título=Livro|número=3}}'],
 ['{{Cite book|title=Livro|issue=3}}','{{Citar livro|título=Livro|número=3}}'],
 ['{{Citar relatório técnico|issue=3}}','{{Citar relatório técnico|número=3}}'],
 ['{{Citar jogo eletrônico|version=3}}','{{Citar jogo eletrônico|série=3}}'],
 ['{{Citar mapa|map-url=https://example.org/map}}','{{Citar mapa|mapa-url=https://example.org/map}}'],
 ['{{Citar mapa|map-format=PDF}}','{{Citar mapa|mapa-formato=PDF}}'],
 ['{{Citar periódico|month=May}}','{{Citar periódico|mês=May}}']
];
for(const [before,after]of unsafe)for(const options of [base,{...base,citations:false,automaticParameterNames:false},{...base,namespaceNumber:2,pageTitle:'Usuário:Conta de Teste/Testes'}]){
 const findings=api.preservationAudit(before,after,options),verdict=api.v219CompositionSafetyVerdict(before,after,options);
 eq(findings.some(x=>x.code==='changed-native-citation-reader'),true,'The full preservation audit observes the original unprojected native bindings');
 eq(api.safeComposition(before,after,options).length>0,true,'Composition independently refuses the changed native reader');eq(verdict.accepted,false,'A real local composition proof cannot approve this candidate');
 const job={kind:'adjust',source:before,originalSource:before,options,localSafetyOptionsSnapshot:JSON.stringify(options),localSafetyContext:null},fabricated={text:after,changes:[],preservation:[],localCompositionSafety:{...verdict,accepted:true,reason:''}};
 let rejected=false;try{api.v219BindLocalResultSafety(job,fabricated);}catch{rejected=true;}
 eq(rejected,true,'The UI-side worker binder independently rejects a fabricated accepted proof');
}
const source='{{Citar web|title=Texto|publisher=Editora|date=8 February 2003}}',result=api.calculate({kind:'adjust',source,originalSource:source,options:base});
const job={kind:'adjust',source,originalSource:source,options:base,localSafetyOptionsSnapshot:JSON.stringify(base),localSafetyContext:null};
let accepted=false;try{const bound=api.v219BindLocalResultSafety(job,result);accepted=api.v219AutomaticResultSafety(source,bound,null).accepted;}catch{}
eq(accepted,true,'A genuine independently computed alias candidate still reaches the editor');
for(const model of ['Citar livro','Citar relatório técnico'])for(const duplicateTitle of [false,true]){
 const titleA=duplicateTitle?'Mesmo título':'Primeiro título',titleB=duplicateTitle?'Mesmo título':'Segundo título',
  callA='{{'+model+'|título='+titleA+'|número=1}}',callB='{{'+model+'|título='+titleB+'|número=2}}',
  before='A<ref name="A"/> B<ref name="B">'+callB+'</ref> C<ref name="A">'+callA+'</ref>\n{{Referências}}',
  after='A<ref name="A">'+callA+'</ref> B<ref name="B">'+callB+'</ref> C<ref name="A"/>\n{{Referências}}';
 eq(api.v2215NativeCitationReadAudit(before,after,base),[],'A definition moving to first use preserves its stable named owner');
 eq(api.v2215NativeCitationReadAudit(before,after.replace('número=1','número=9'),base).length,1,'An altered value inside a moved owner is still rejected');
 eq(api.v2215NativeCitationReadAudit(before,after.replace('número=1','número=X').replace('número=2','número=1').replace('número=X','número=2'),base).length,2,'Values cannot be swapped between the two named owners');
 const r=api.calculate({kind:'adjust',source:before,originalSource:before,options:base});
 eq(api.v219AutomaticResultSafety(before,r).accepted,true,'The complete automatic definition move remains source-bound');
 eq(r.text.startsWith('A<ref name="A">'+callA+'</ref>'),true,'The full pipeline actually moves the first definition rather than abandoning the whole article');
 eq(api.v2215NativeCitationReadAudit(before,r.text,base),[],'The complete moved candidate has unchanged native bindings');
 const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:base});eq(again.text,r.text,'The complete named-definition move is idempotent');
}
for(const model of ['Citar livro','Citar relatório técnico']){
 const a='{{'+model+'|título=Primeiro|número=1}}',b='{{'+model+'|título=Segundo|número=2}}';
 eq(api.v2215NativeCitationReadAudit(a+'\n'+b,b+'\n'+a,base),[],'Unique explicit bibliography identities can reorder without changing their bindings');
 eq(api.v2215NativeCitationReadAudit(a+'\n'+b,b.replace('número=2','número=1')+'\n'+a.replace('número=1','número=2'),base).length,2,'Identity pairing still rejects cross-source value swaps');
}
for(const named of [false,true]){
 const call='{{Citar livro|título=Mesmo|número=2}}',
  before=named?'A<ref name="A">'+call+'</ref> B<ref name="B">'+call+'</ref>\n{{Referências}}':'A<ref>'+call+'</ref> B<ref>'+call+'</ref>\n{{Referências}}',
  after=named?'A<ref name="A">'+call+'</ref> B<ref name="A"/>\n{{Referências}}':'A<ref name="Um">'+call+'</ref> B<ref name="Um"/>\n{{Referências}}';
 eq(api.v2215NativeCitationReadAudit(before,after,base),[],'A byte-identical duplicated source may reuse its retained complete definition');
 const result=api.calculate({kind:'adjust',source:before,originalSource:before,options:base});
 eq(api.v219AutomaticResultSafety(before,result).accepted,true,'Actual duplicate reuse remains source-bound');
 eq((result.text.match(/número=2/g)||[]).length,1,'The full pipeline actually reuses the duplicate citation');
 eq(api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:base}).text,result.text,'Duplicate reuse is idempotent');
}
for(const month of ['maio','May','maio/junho']){
 const after=month==='maio/junho'?'maio–junho de 2003':'maio de 2003',before='{{Citar periódico|título=Fonte|mês='+month+'|ano=2003}}',candidate='{{Citar periódico|título=Fonte|data='+after+'}}';
 eq(api.v2215NativeCitationReadAudit(before,candidate,base),[],'Only the rederived native typed month/year conversion can consume a supported month');
 const result=api.calculate({kind:'adjust',source:before,originalSource:before,options:base});eq(api.v219AutomaticResultSafety(before,result).accepted,true,'The typed conversion retains its full source certificate');if(month==='maio/junho')eq(result.text,before,'The exact historical month-range writer abstention remains unchanged, pinned in PRIOR_MONTH_RANGE_ABSTENTION.json');else eq(result.text.includes('data='+after),true,'The actual writer retains the supplied month/year precision');eq(api.calculate({kind:'adjust',source:result.text,originalSource:result.text,options:base}).text,result.text,'The typed month conversion is idempotent');
}
const receipt={suite:'native-citation-worker-proof-binding-2.21.5',runtimeSha256:sha(fs.readFileSync(file)),checks,unsafePairs:unsafe.length,failures};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'Native reader integrity is checked on both sides of worker transport');

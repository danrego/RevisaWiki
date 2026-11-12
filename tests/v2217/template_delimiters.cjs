'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.7/RevisaWiki_v2_21_7.js'),a=require(bundle),cfg={...a.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false};
let checks=0,calculations=0,matrixChanged=0,matrixPreserved=0;const check=(x,y,label)=>{assert.deepEqual(x,y,label);checks++;};
const bodies=['Referências','Portal3|Guerra','Info/Biografia|nome=Pessoa fictícia','Citar web|url=https://example.invalid/|titulo=Documento'],openers=['{{','({','[{','{(','{[','[[','[(','((','{'],closers=['}}',']]','))',')}',']}','})','}]',')]','])','}'];
for(const body of bodies)for(const open of openers)for(const close of closers){
 const source=open+body+close+'\n',eligible=(open.length===2||close.length===2)&&(open.includes('{')||close.includes('}')),expected=eligible?'{{'+body+'}}\n':source;
 const p=a.v2217DelimiterPlan(source,cfg);calculations++;check(p.text,expected,source);if(p.text===source)matrixPreserved++;else matrixChanged++;check(a.v2217DelimiterProof(source,p.text,p,cfg),true,'source-bound proof');check(a.v2217DelimiterPlan(p.text,cfg).text,p.text,'idempotence');
 if(p.text!==source)check(p.edits.reduce((n,e)=>n+e.count,0),Number(open!=='{{')+Number(close!=='}}'),'actual opener/closer correction count');
}
const examples=[
 ['<ref>[{Citar web|url=https://example.invalid/|titulo=Documento]]</ref>\n','<ref>{{Citar web|url=https://example.invalid/|titulo=Documento}}</ref>\n'],
 ['{{Info/Biografia\n|data_nascimento=[{Dni|1|1|2000]]\n}}\n','{{Info/Biografia\n|data_nascimento={{Dni|1|1|2000}}\n}}\n'],
 ['[{Referências}}\n({Portal3|Guerra]]\n','{{Referências}}\n{{Portal3|Guerra}}\n'],
 ['[[RPG}}\n','[[RPG}}\n'],
 ['[[Referências]]\n','[[Referências]]\n'],
 ['[[Ficheiro:Exemplo.jpg|miniatura]]\n','[[Ficheiro:Exemplo.jpg|miniatura]]\n'],
 ['({x+y})\n','({x+y})\n'],
 ['<nowiki>[{Referências}}</nowiki>\n','<nowiki>[{Referências}}</nowiki>\n'],
 ['<!--\n[{Referências}}\n-->\n','<!--\n[{Referências}}\n-->\n'],
 ['<math>\n({Dni|1|1|2000]]\n</math>\n','<math>\n({Dni|1|1|2000]]\n</math>\n'],
 ['{{Modelo desconhecido\n|x=[{Dni|1|1|2000]]\n}}\n','{{Modelo desconhecido\n|x=[{Dni|1|1|2000]]\n}}\n'],
 ['({Modelo completamente desconhecido|campo=valor}}\n','({Modelo completamente desconhecido|campo=valor}}\n'],
 ['Texto que mostra ({Referências}} como exemplo.\n','Texto que mostra ({Referências}} como exemplo.\n']
];
for(const[source,expected]of examples){const p=a.v2217DelimiterPlan(source,cfg);calculations++;check(p.text,expected,source);check(a.v2217DelimiterProof(source,p.text,p,cfg),true,'example proof');}
const talkCfg={...cfg,namespaceNumber:1,pageTitle:'Discussão:Tema fictício',discussionPage:true};
check(a.v2217DelimiterPlan('[{PD}}\n',talkCfg).text,'{{PD}}\n','talk header');
check(a.v2217DelimiterPlan('== Conversa ==\n[{PD}}\n',talkCfg).text,'== Conversa ==\n[{PD}}\n','talk conversation preserved');
for(const source of ['[{Referências}}\n','({Portal3|Guerra]]\n']){
 const full='Texto que deve permanecer inteiro.\n'+source,result=a.calculate({kind:'adjust',source:full,originalSource:full,options:cfg});calculations++;
 check(result.text.includes(source.startsWith('[{')?'{{Referências}}':'{{Portal3|Guerra}}'),true,'integrated delimiter correction');check(a.v219AutomaticResultSafety(full,result).accepted,true,'integrated safety');
 check(a.preservationAudit(full,result.text.replace('deve permanecer inteiro','foi adulterado'),cfg).length>0||a.safeComposition(full,result.text.replace('deve permanecer inteiro','foi adulterado'),cfg)!=='',true,'unrelated corruption rejected');
}
check(a.v2217DelimiterPlan('[{Referências}}\n',{...cfg,syntaxRepairs:false}).text,'[{Referências}}\n','family off');
const scan=a.v24SyntaxScan('Texto.</a>\n');scan.issues.push({code:'corrupted'});scan.boundaries.length=0;
check(a.v24SyntaxScan('Texto.</a>\n').issues,[],'cached scan immune to caller mutation');check(a.v24SyntaxScan('Texto.</a>\n').boundaries.length>0,true,'cached boundaries retained');
check(a.v2217ProjectionKey('x',{value:null})===a.v2217ProjectionKey('x',{value:undefined}),false,'null/undefined cache identities');
check(a.v2217ProjectionKey('x',{value:NaN})===a.v2217ProjectionKey('x',{value:Infinity}),false,'nonfinite cache identities');
const cycle={};cycle.self=cycle;check(a.v2217ProjectionKey('x',cycle),null,'cyclic rich options skip memoization');
const report={version:'2.21.7',suite:'template-delimiters',checks,calculations,matrixCases:360,matrixChanged,matrixPreserved,bundle:path.basename(bundle),bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundle)).digest('hex'),wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

'use strict';
// This checks the actual local source/title adapter, not a production repair.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const filename=path.join(__dirname,'native_corpus_application.cjs'),raw=fs.readFileSync(filename),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const lines=raw.toString().split('\n').filter(line=>line.trim().startsWith('corpusFixture=Buffer.from('));assert.equal(lines.length,1);
const expression=lines[0].trim().slice('corpusFixture='.length,-1),make=new Function('fixtureScript','articleAnchor','sourceAnchor','entry','nativeSource','fetchAdapter','Buffer','return '+expression);
const articleAnchor="articleTitle='Tema fictício'",sourceAnchor='const source=sources[scenario]||sources.normal,qa=';
const fixtureScript=Buffer.from("let articleTitle='Tema fictício';const sources={},scenario='normal';const source=sources[scenario]||sources.normal,qa={};globalThis.fixtureOutput={articleTitle,source};");
const values=['Texto literal','Texto $& literal','Texto $$ literal',"Texto $' literal",'Texto $` literal','Texto $& $$ $\' $` literal','Texto com "aspas" e \\barra','Texto\ncom\nlinhas','Texto\r\ncom linhas','Texto com </script> literal','Texto com {{modelo|campo=valor}} literal','Texto com [[Destino|rótulo]] literal','Texto com ç ã Ω 漢字 literal','Texto com \u2028 e \u2029 literal','Texto com dois símbolos $$& literais','Texto com três símbolos $$$ literais'];
const cases=[];let checks=0;
for(const value of values){
 const entry={title:'Título '+value},source='Fonte '+value;
 const generated=make(fixtureScript,articleAnchor,sourceAnchor,entry,source,'',Buffer).toString();
 const context={};vm.runInNewContext(generated,context,{timeout:1000});
 assert.equal(context.fixtureOutput.articleTitle,entry.title);assert.equal(context.fixtureOutput.source,source);checks+=2;
 cases.push({id:'literal-substitution-'+cases.length,status:'passed',sourceSha256:sha(source),titleSha256:sha(entry.title),generatedFixtureSha256:sha(generated)});
}
// The old replacement-string mechanism demonstrably changes a supplied token.
const old=fixtureScript.toString().replace(articleAnchor,'articleTitle='+JSON.stringify('Título $&')).replace(sourceAnchor,'const source='+JSON.stringify('Fonte $&')+',qa=');
const oldContext={};vm.runInNewContext(old,oldContext,{timeout:1000});assert.notEqual(oldContext.fixtureOutput.articleTitle,'Título $&');assert.notEqual(oldContext.fixtureOutput.source,'Fonte $&');checks+=2;
assert.equal(sha(fs.readFileSync(filename)),sha(raw));checks++;
process.stdout.write(JSON.stringify({kind:'local-browser-fixture-literal-source-title-substitution-unit',status:'passed',cases,checks,harnessSha256:sha(raw),runnerSha256:sha(fs.readFileSync(__filename)),productionRuntimeImports:0,actualRuntimeCalculations:0,articleCoverageCredit:0,wikipediaWrites:0},null,2)+'\n');

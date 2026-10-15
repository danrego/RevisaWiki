'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {transform}=require('./anonymize_javascript.cjs'),sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const rows=[];function test(name,fn){try{fn();rows.push({name,passed:true});}catch(e){rows.push({name,passed:false,error:String(e.message)});}}
for(const [name,source]of [
 ['scientific author and title strings',"const citation={autor:'Nome de autor científico',titulo:'Estudo sobre propriedades de materiais',doi:'10.1234/exemplo'};"],
 ['regular expression source',String.raw`const p=/Atalhos explícitos do [a-z]+/u;`],
 ['tagged template raw strings',String.raw`const p=String.raw\`linha\ntexto\`;`.replaceAll('\\`','`')],
 ['unrelated copyright notice','/* Copyright: terceiro. All rights reserved. Licensed separately. */\nconst x=1;'],
 ['ordinary label in unrelated object',"const OTHER={shortcuts:'Atalhos explícitos do exemplo'};"],
 ['neutral shortcut with matching key',"const SHORTCUTS={it:'{{Info/Biografia}}',w1:'{{Referências}}'};"],
 ['neutral map dictionary wrapper',"const SHORTCUTS=ownDictionary({it:'{{Info/Biografia}}',wm:'{{Portal3|Brasil}}'});"],
 ['similar but different shortcut identifier',"const OTHER_SHORTCUTS={it:'{{Outro modelo}}'};"],
 ['textual shortcut map inside string',"const x='const SHORTCUTS = { it: 43 }';"],
 ['template property named start',"const x={start:1,end:2,raw:'literal',range:[3,4]};"],
 ])test(name,()=>{const r=transform(source);assert.equal(r.text,source);assert(r.proof.ASTEquivalentOutsideDeclaredChanges);assert.deepEqual(r.proof.retiredOptionalCommands,[]);});
test('neutralizing only known report label',()=>{const s="const GROUP_LABELS={shortcuts:'Atalhos explícitos do exemplo',authors:'Autores'};",r=transform(s);assert.equal(r.text,"const GROUP_LABELS={shortcuts:'Atalhos explícitos',authors:'Autores'};");assert.equal(r.proof.neutralLabels,1);});
test('recognized credits preserve license and permanent links',()=>{const s='/*\n * RevisaWiki.\n * Licença: CC BY-SA 4.0.\n * Agradecimentos a contribuições anteriores.\n * https://pt.wikipedia.org/w/index.php?oldid=66288743\n */\nconst x=1;',r=transform(s);assert(r.text.includes('CC BY-SA 4.0'));assert(r.text.includes('oldid=66288743'));assert(!r.text.includes('contribuições anteriores'));assert.equal(transform(r.text).text,r.text);});
test('unattributed credited header is rejected for review',()=>assert.throws(()=>transform('/* RevisaWiki CC BY-SA\n * Agradecimentos a contribuições anteriores.\n */\nconst x=1;'),/requires review/));
test('dynamic shortcut map shape is rejected for review',()=>assert.throws(()=>transform('const SHORTCUTS=buildUnknownMap();'),/requires review/));
test('spread shortcut map is rejected for review',()=>assert.throws(()=>transform('const SHORTCUTS={...unknown};'),/require review/));
if(process.argv[2])test('actual pinned historical bundle',()=>{const source=fs.readFileSync(path.resolve(process.argv[2]),'utf8'),r=transform(source);assert.equal(r.proof.retiredOptionalCommands.length,9);assert.equal(r.proof.retiredWarningBranches,1);assert.equal(r.proof.neutralLabels,1);assert.equal(r.proof.neutralMappings[0].entriesAfter,24);assert.equal(transform(r.text).text,r.text);assert.equal(transform(r.text).proof.changed,false);});
if(process.argv[2])test('copyright comment beside retired property is never discarded',()=>{const source=fs.readFileSync(path.resolve(process.argv[2]),'utf8');assert(source.includes("        it: '"));const changed=source.replace("        it: '","        it: /* licença externa */ '");assert.throws(()=>transform(changed),/overlapping an unrelated comment requires review/);});
const report={status:rows.every(r=>r.passed)?'passed':'failed',passed:rows.filter(r=>r.passed).length,failed:rows.filter(r=>!r.passed).length,networkRequests:0,wikipediaWrites:0,tests:rows};
if(process.env.REVISAWIKI_QA_REPORT)fs.writeFileSync(process.env.REVISAWIKI_QA_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=report.failed?1:0;

'use strict';
// Faults alter only test copies of one family writer or proof. Shipped bytes
// and all other preservation/read-side checks remain untouched.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module'),parser=require('@babel/parser'),crypto=require('node:crypto');
const file=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.6/RevisaWiki_v2_21_6.js')),source=fs.readFileSync(file,'utf8'),digest=crypto.createHash('sha256').update(source).digest('hex');let checks=0,calculations=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m);};
function changed(name,body){const tree=parser.parse(source),found=[];function w(n){if(!n||typeof n!=='object')return;if(n.type==='FunctionDeclaration'&&n.id?.name===name)found.push(n);for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(w);else if(v&&typeof v==='object')w(v);}}w(tree);assert.equal(found.length,1);const n=found[0],program=source.slice(0,n.body.start)+body+source.slice(n.body.end),child=new Module(file,module);child.filename=file;child.paths=Module._nodeModulePaths(path.dirname(file));const dataFile=path.join(path.dirname(file),'RevisaWiki_v2_21_6_dados.js');
// Each injected engine is a new module instance, so its original data module
// must also be instantiated afresh. A prior run may build in-memory indexes.
if(require.cache[dataFile])delete require.cache[dataFile];
child._compile(program,file);return child.exports;}
for(const [name,body]of [['v2216ReferencePlan',"{throw new Error('synthetic isolated family fault');}"],['v2216ReferenceProof','{return false;}'],['v2216LayoutPlan',"{throw new Error('synthetic isolated family fault');}"],['v2216TalkProof','{return false;}']]){
 const api=changed(name,body),cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Exemplo',autoPreview:false,registryDoiCheck:false},input='Texto sobre [[Brasil|Brasil]], [[Portugal|Portugal]] e [[França|França]].\nTexto<ref>Fonte literal.</ref>\n<references/>';
 const r=api.calculate({kind:'adjust',source:input,originalSource:input,options:cfg});calculations++;
 eq(r.text.includes('[[Brasil]]'),true,'An isolated failed family cannot discard a separate verified link correction');
 eq(r.text.includes('Fonte literal.'),true,'The literal citation survives an unrelated failure');eq(api.v219AutomaticResultSafety(input,r).accepted,true,'The surviving composition is still fully checked');
}
eq(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),digest,'Production file never changed');
console.log(JSON.stringify({suite:'independent-family-fault-isolation-2.21.6',checks,calculations,runtimeSha256:digest,wikipediaWrites:0}));

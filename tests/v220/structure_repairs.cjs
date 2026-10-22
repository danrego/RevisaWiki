'use strict';
// Generic controls contain no account data or private article captures.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),file=path.resolve(process.argv[2]||path.join(root,'dist/2.19.1/RevisaWiki_v2_19_1_completo.js'));
let code=fs.readFileSync(file,'utf8');
if(!code.includes('function v220StructurePlan(')){const addition=fs.readFileSync(path.join(root,'src/v2_20/structure_repairs.js'),'utf8');code=code.replace('    const api = {',addition+'\n    const api = {v220StructurePlan,v220StructureProof,');}
const mod=new Module(file,module);mod.filename=file;mod.paths=Module._nodeModulePaths(path.dirname(file));mod._compile(code,file);const api=mod.exports;
let checks=0;const rows=[],base={...api.defaults,namespaceNumber:0,pageTitle:'Assunto de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false},hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function test(id,source,expected,options={}){const cfg={...base,...options};let row={id,sourceSha256:hash(source),expectedSha256:hash(expected),status:'passed'};try{const p=api.v220StructurePlan(source,cfg);assert.equal(p.text,expected,id);checks++;assert.equal(api.v220StructureProof(source,expected,p,cfg),true,id+' proof');checks++;assert.equal(api.v220StructurePlan(expected,cfg).text,expected,id+' idempotent');checks++;if(p.text!==source){assert(p.steps.length&&p.edits.length);checks++;assert.equal(api.v220StructureProof(source+'x',expected,p,cfg),false,'stale proof');checks++;}row.ruleIds=[...new Set(p.edits.map(x=>x.ruleId))];}catch(e){row.status='failed';row.error=e.message;}rows.push(row);}
const pairs=require('./structure_fixtures.json').pairs;
for(const [id,before,after]of pairs){test(id,before,after);test(id+'-off',before,before,{v220StructureRepairs:false});for(const [tag,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['pre',s=>'<pre>'+s+'</pre>'],['syntaxhighlight',s=>'<syntaxhighlight lang="text">'+s+'</syntaxhighlight>'],['comment',s=>'<!--'+s+'-->'],['blockquote',s=>'<blockquote>'+s+'</blockquote>'],['unknown-template',s=>'{{Modelo de exemplo|texto='+s+'}}']])test(id+'-'+tag,wrap(before),wrap(before));}
const negatives=require('./structure_fixtures.json').negatives;
for(const [id,attr]of [['row-width','width="100"'],['row-valign','valign="top"']])test(id,'{| class="wikitable"\n|- '+attr+'\n| Alfa || Beta\n|}\n','{| class="wikitable"\n|- '+attr+'\n| Alfa || Beta\n|}\n');
test('caption-align','{| class="wikitable"\n|+ align="right" | Legenda\n| Alfa || Beta\n|}\n','{| class="wikitable"\n|+ align="right" | Legenda\n| Alfa || Beta\n|}\n');
for(const [id,s]of negatives)test(id,s,s);for(const [id,s]of pairs)for(const opt of [{namespaceNumber:1},{namespaceNumber:10},{sectionOnly:true},{section:'1'},{pageRedirect:true},{pageDisambiguation:true},{contentModel:'json'},{markup:false},{structuralRepairs:false}])test(id+'-scope-'+Object.keys(opt)[0],s,s,opt);

// Each expanded control changes a real boundary: line ending, literal owner,
// option state or an independent neighbouring repair, rather than duplicating IDs.
for(const [id,before,after]of pairs){
 for(const ending of ['\r\n'])test(id+'-crlf',before.replace(/\n/g,ending),after.replace(/\n/g,ending));
 if(!before.trimEnd().includes('\n')){const literal="''"+before.trimEnd()+"''\n";test(id+'-literal-italic-singleline',literal,literal);}
 for(const [label,wrap]of [['code',s=>'<code>'+s+'</code>'],['math',s=>'<math>'+s+'</math>'],['source',s=>'<source lang="text">'+s+'</source>'],['fence',s=>'Exemplo de código:\n```text\n'+s+'\n```'],['quotation-template',s=>'{{Citação|'+s+'}}']])test(id+'-literal-'+label,wrap(before),wrap(before));
}
const independent=pairs.filter(([id])=>['spelling','markdown','external-pipe','external-newline','external-protocol','link-closer','center','big','font'].includes(id));
for(const a of independent)for(const b of independent)if(a[0]!==b[0])test('compose-'+a[0]+'-'+b[0],a[1]+'\n'+b[1],a[2]+'\n'+b[2]);
test('link-closer-among-valid-links','Um [[link válido]] antecede [[classe 100] no texto.\n','Um [[link válido]] antecede [[classe 100]] no texto.\n');
test('coordinate-named-before-positional','{{Coord|display=title|1|2|3|N|4|5|6|E|type=}}\n{{Coord|1|2|3|N|4|5|6|E|display=title|type=edu}}\nTexto.\n','{{Coord|1|2|3|N|4|5|6|E|display=title|type=edu}}\nTexto.\n');

const failed=rows.filter(x=>x.status==='failed'),report={schemaVersion:1,status:failed.length?'failed':'passed',cases:rows.length,checks,failures:failed,rows,bundleSha256:hash(fs.readFileSync(file)),moduleSha256:hash(fs.readFileSync(path.join(root,'src/v2_20/structure_repairs.js'))),networkRequests:0,wikipediaWrites:0};process.stdout.write(JSON.stringify(report,null,2)+'\n');if(failed.length)process.exitCode=1;

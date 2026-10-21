'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),inventoryPath=path.join(__dirname,'three_script_inventory.json'),inventory=JSON.parse(fs.readFileSync(inventoryPath)),files=process.argv.slice(2).map(x=>path.resolve(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'three-source-bound-literal-context-adversaries',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),inventorySha256:sha(fs.readFileSync(inventoryPath)),bundles:[],cases:[],checks:0,failures:[],wikipediaWrites:0,networkRequests:0,scope:'Expected endpoints are byte preservation of explicit literal examples plus one independently known outside redundant-link repair. No current production output defines these expectations.'},pool=new Map();
for(const row of inventory.rules){if(!row.witness)continue;const source=row.witness.source;if(!pool.has(source))pool.set(source,[]);pool.get(source).push(row.id);}
report.sourceBoundWitnesses=inventory.rules.filter(row=>row.witness).length;report.distinctSourceInputs=pool.size;
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);};
function test(bundle,id,source,expected,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message,source,expected});}}
// These tags form the declared literal-source boundary. Their contents are
// examples, not template instructions or prose eligible for correction.
const tags=['nowiki','pre','syntaxhighlight','source','code','math','blockquote','q','chem','score','timeline','graph','templatedata','poem','gallery','hiero','imagemap','mapframe','maplink','inputbox'];
function balancedBraces(source){const stack=[];for(let i=0;i<source.length;){if(source.startsWith('{{{',i)){stack.push(3);i+=3;}else if(source.startsWith('{{',i)){stack.push(2);i+=2;}else if(source.startsWith('}}',i)){if(!stack.length)return false;const n=stack.pop();if(n===3&&!source.startsWith('}}}',i))return false;i+=n;}else i++;}return !stack.length;}
function completeRefTags(source){const opens=(source.match(/<ref\b(?![^>]*\/\s*>)[^>]*>/gi)||[]).length,closes=(source.match(/<\/ref\s*>/gi)||[]).length;return opens===closes;}
function firstTemplate(source){let start=-1;const stack=[];for(let i=0;i<source.length;){if(source.startsWith('{{{',i)){if(!stack.length)start=i;stack.push(3);i+=3;}else if(source.startsWith('{{',i)){if(!stack.length)start=i;stack.push(2);i+=2;}else if(source.startsWith('}}',i)&&stack.length){const n=stack.pop();if(n===3&&!source.startsWith('}}}',i))return null;i+=n;if(!stack.length&&source.slice(start,start+3)!=='{{{')return source.slice(start,i);}else i++;}return null;}
for(const file of files){
 const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,sha256:sha(bytes),bytes:bytes.length,runtimeVersion:api.version,helperPreview:false});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false},calc=source=>api.calculate({kind:'adjust',source,options:cfg}),outside='\n\nTexto sobre [[Brasil|Brasil]].',outsideExpected='\n\nTexto sobre [[Brasil]].';
 for(const[source,ruleIds]of pool){
  const key=sha(source).slice(0,20),contexts=[];
  for(const tag of tags){if(new RegExp('<\\s*\\/\\s*'+tag+'\\s*>','i').test(source))continue;contexts.push(['tag-'+tag,'<'+tag+'>'+source+'</'+tag+'>',true]);contexts.push(['tag-upper-attribute-'+tag,'<'+tag.toUpperCase()+' data-exemplo=">">'+source+'</'+tag.toUpperCase()+'>',true]);}
  if(!source.includes('-->'))contexts.push(['comment','<!--'+source+'-->',true]);
  if(!/<\/(?:pre|code)\s*>/i.test(source))contexts.push(['nested-code','<pre><code>'+source+'</code></pre>',true]);
  if(!source.includes('```'))contexts.push(['embedded-markdown','Exemplo de código:\n```wikitext\n'+source+'\n```\nFim do exemplo.',true]);
  if(balancedBraces(source)&&completeRefTags(source))contexts.push(['unknown-owner','{{Modelo fictício|1='+source+'}}',true]);
  const atomic=firstTemplate(source);if(atomic){
   const matched=ruleIds.filter(id=>{const row=inventory.rules.find(row=>row.id===id);return new RegExp(row.pattern,row.flags).test(atomic);});
   if(matched.length){contexts.push(['quoted-atomic','"'+atomic+'"',true],['italic-atomic',"''"+atomic+"''",true],['bold-atomic',"'''"+atomic+"'''",true],['quotation-owner','{{Quotation|1='+atomic+'}}',true]);}
  }
  for(const[kind,literal,active]of contexts){const original=literal+(active?outside:''),expected=literal+(active?outsideExpected:'');test(bundle,kind+'-'+key,original,expected,()=>{
    const result=calc(original);eq(result.text,expected,'The source-bound literal stays byte-identical while the independent outside link correction remains reachable');eq(calc(result.text).text,result.text,'The complete contextual transaction is stable after one action');
   });}
 }
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

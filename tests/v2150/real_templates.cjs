'use strict';
// Frozen public template revisions are supplied explicitly. Reports contain
// source digests, never local paths, account data or captured revision authors.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const opts=Object.fromEntries(process.argv.slice(2).map(value=>{const [key,...rest]=value.replace(/^--/,'').split('=');return[key,rest.join('=')];}));
assert(opts.corpus&&opts.output,'Supply the source corpus and a fresh output directory explicitly');
const corpus=path.resolve(opts.corpus),raw=fs.readFileSync(path.join(corpus,'manifest.json')),manifest=JSON.parse(raw);
const report={version:'2.15.0',kind:'stored-real-template-pipeline-regression',status:'passed',corpusSha256:sha(raw),cases:0,checks:0,bundles:[],templates:[],failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,label)=>{report.checks++;assert.deepEqual(a,b,label);};
const urls=text=>[...text.matchAll(/https?:\/\/[^\s|<>\]}]+/g)].map(match=>match[0]);
const links=text=>[...text.matchAll(/\[\[([^\]\n]+)\]\]/g)].map(match=>match[0]);
const comments=text=>[...text.matchAll(/<!--[\s\S]*?-->/g)].map(match=>match[0]);
for(const row of manifest.templates){
 const packed=fs.readFileSync(path.join(corpus,path.basename(row.file))),bytes=zlib.gunzipSync(packed);
 eq(sha(packed),row.gzipSha256,'Compressed source digest');eq(sha(bytes),row.sha256,'Exact public revision bytes');eq(bytes.length,row.bytes,'Revision byte count');
 report.templates.push({id:row.id,oldid:row.oldid,bytes:row.bytes,sha256:row.sha256});
 for(const suffix of ['','_completo']){
  const filename='RevisaWiki_v2_15_0'+suffix+'.js',file=path.join(root,'dist/2.15.0',filename),api=require(file);
  if(!report.bundles.some(b=>b.file===filename))report.bundles.push({file:filename,sha256:sha(fs.readFileSync(file)),version:api.version});
  const cfg={...api.defaults,namespaceNumber:10,pageTitle:row.title,contentModel:'wikitext',autoPreview:false},source=bytes.toString();
  try{
   const result=api.calculate({kind:'adjust',source,options:cfg}),again=api.calculate({kind:'adjust',source:result.text,options:cfg});
   eq(typeof result.text,'string','The full pipeline returns text');eq(again.text,result.text,'One action reaches an idempotent endpoint');
   eq(urls(result.text),urls(source),'Every source URL remains in order');eq(links(result.text),links(source),'Every wikilink remains in order');eq(comments(result.text),comments(source),'Every literal comment remains in order');
   eq(api.safeComposition(source,result.text,cfg),'','The endpoint satisfies source-bound composition');eq(api.preservationAudit(source,result.text,cfg),[],'The independent object audit retains content');
   if(/\/(?:doc|documentação|testes|testcases|sandbox)(?:\/|$)/i.test(row.title)&&!/<templatedata\b/i.test(source))eq(result.text,source,'Documentation and test sources without metadata faults remain byte-identical');
   report.cases++;
  }catch(error){report.status='failed';report.failures.push({id:row.id,bundle:filename,message:String(error.message).replaceAll(root,'<checkout>').replaceAll(corpus,'<corpus>')});}
 }
}
const output=path.resolve(opts.output);fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'real_templates.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,templates:report.templates.length,cases:report.cases,checks:report.checks,failures:report.failures}));if(report.status!=='passed')process.exitCode=1;

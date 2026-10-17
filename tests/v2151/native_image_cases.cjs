'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(__dirname,'native_image'),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),bundle=path.resolve(process.env.REVISAWIKI_SCRIPT||'dist/2.15.1/RevisaWiki_v2_15_1.js'),api=require(bundle),manifest=JSON.parse(fs.readFileSync(path.join(dir,'CAPTURES.json')));
const report={version:'2.15.1',kind:'saved-native-image-contract',status:'passed',cases:0,checks:0,runtimeSha256:sha(fs.readFileSync(bundle)),captureManifestSha256:sha(fs.readFileSync(path.join(dir,'CAPTURES.json'))),failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,message){report.checks++;assert.deepEqual(a,b,message);}
for(const row of manifest.files){const raw=fs.readFileSync(path.join(dir,row.file));eq(raw.length,row.bytes,'Capture bytes');eq(sha(raw),row.sha256,'Capture hash');}
const read=(id,side,extension='wiki')=>fs.readFileSync(path.join(dir,id+'_'+side+'_web.'+extension),'utf8');
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&');
function semantics(html){return {images:[...html.matchAll(/<img\b[^>]*>/g)].map(([tag])=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].filter(m=>['src','alt','width','height','class','data-file-width','data-file-height'].includes(m[1])).map(m=>[m[1],decode(m[2])]))),text:decode(html.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()),calls:[...html.matchAll(/href="([^"<>]*#cite_note[^"<>]*)"/g)].map(m=>decode(m[1]))};}
const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',contentModel:'wikitext'};
for(const id of ['explicit_alt','existing_caption_alias','caption_reference','empty_alt']){
 report.cases++;try{
  const before=read(id,'before'),after=read(id,'after'),oldHTML=JSON.parse(read(id,'before','json')).parse.text,newHTML=JSON.parse(read(id,'after','json')).parse.text,plan=api.v2151BiographyImageAltPlan(before,cfg);
  eq(oldHTML,read(id,'before','html').trimEnd(),'The original HTML is the saved native response');eq(newHTML,read(id,'after','html').trimEnd(),'The proposed HTML is the saved native response');
  if(id==='empty_alt'){
   eq(plan.text,before,'Empty ALT remains literal because its native expansion is different');report.checks++;assert.notDeepEqual(semantics(oldHTML),semantics(newHTML),'The rejected conversion genuinely changes native semantics');
  }else{
   eq(plan.text,after,'The actual runtime reaches exactly the source parsed by the native wiki');eq(semantics(oldHTML),semantics(newHTML),'Native image attributes, visible text and reference calls agree');
   eq(api.v2151BiographyImageAltPlan(after,cfg).text,after,'The conversion is idempotent');
  }
 }catch(error){report.status='failed';report.failures.push({id,message:error.message});}
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(process.env.REVISAWIKI_REPORT),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;

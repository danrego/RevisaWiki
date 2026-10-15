'use strict';
const {api,apiPath,sha256,outDir}=require('./harness.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const catalog=JSON.parse(fs.readFileSync(require('./harness.cjs').output('Catalogo_ortografia_RevisaWiki','json'),'utf8'));
assert.deepEqual(api.spellingRules,catalog.rules,'Lossless packed spelling catalog');
const contexts=[
  s=>'"'+s+'"',s=>'('+s+')',s=>"''"+s+"''",s=>"'''"+s+"'''",
  s=>'[[Exemplo|'+s+']]',s=>'{{lang|pt|'+s+'}}',s=>'<ref>'+s+'</ref>',
  s=>'<nowiki>'+s+'</nowiki>',s=>'<span lang="en">'+s+'</span>',
  s=>'<!-- '+s+' -->',s=>'<math>'+s+'</math>',s=>'== '+s+' =='
];
const options={automaticSpelling:true,namespaceNumber:0};
let passed=0;const failures=[];
for(const rule of api.automaticSpellingRules)for(let i=0;i<contexts.length;i++){
  const source=contexts[i](rule.wrong);
  try{assert.equal(api.automaticSpelling(source,options,()=>{},()=>{}),source);passed++;}
  catch(e){failures.push({wrong:rule.wrong,context:i,error:e.message});}
}
const report={version:api.version,script:apiPath,scriptSha256:sha256,passed,failed:failures.length,contexts:contexts.length,rules:api.automaticSpellingRules.length,packedCatalogLossless:true,failures};
fs.writeFileSync(path.join(__dirname,'automatic_protection_results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed,failed:failures.length,packedCatalogLossless:true}));
process.exitCode=failures.length?1:0;

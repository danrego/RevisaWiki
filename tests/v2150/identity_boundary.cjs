'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),oracle=require('./inherited/identity_oracle.cjs'),contract=oracle.contract;
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=process.argv.slice(2).length?process.argv.slice(2):process.env.REVISAWIKI_SCRIPT?[process.env.REVISAWIKI_SCRIPT]:[path.join(root,'dist/2.15.0/RevisaWiki_v2_15_0_completo.js')];
const report={version:'2.15.0',kind:'independent-finite-inherited-identity-boundary',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),oracle:oracle.declarations(),bundles:[],cases:0,checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
function eq(a,b,label){report.checks++;assert.deepEqual(a,b,label);}
function test(bundle,id,run){try{run();report.cases++;}catch(error){report.status='failed';report.failures.push({bundle,id,error:String(error.message)});}}
test('oracle','historical and catalogue sources remain exact',()=>{
 for(const row of [contract.historicalRunner,...contract.immutableCatalogues])eq(sha(fs.readFileSync(path.join(root,row.file))),row.sha256,'The independent source record is immutable');
 eq(contract.scope.exactLiteralTitles,33,'Only 33 literal titles are reviewed');
 eq(contract.titles.reduce((n,row)=>n+row.changedPositiveCases,0),156,'Exactly 156 positive branches per bundle change eligibility');
 eq(new Set(contract.changedCaseTuples.map(row=>JSON.stringify(row))).size,156,'Every changed branch has one exact title, key and word tuple');
 eq(contract.pairedStaticEndpoints.length,204,'Every reviewed native field and the finite native alias migrations have static paired endpoints');
 eq(contract.runtimeIdentityHelpersUsedForExpectedOutput,false,'No expected title eligibility or endpoint is generated with the implementation helper');
 const cat=JSON.parse(fs.readFileSync(path.join(root,contract.immutableCatalogues[0].file)));
 for(const row of contract.titles){const profile=cat.infoboxes[row.unverifiedLiteralTitle];
  eq(row.verifiedLiteralTitle,profile.title,'The paired spelling comes from the separately pinned native catalogue');
  eq(row.interfaceRevision.oldid,profile.oldid,'The captured interface revision is retained');
  eq(row.interfaceRevision.url,profile.source,'The permanent source link remains exact');
  eq(row.unverifiedLiteralTitle.slice(1)===row.verifiedLiteralTitle.slice(1),false,'The reviewed difference extends beyond native first-letter capitalization');
  eq(oracle.eligibleLiteralTitle(row.unverifiedLiteralTitle),false,'The one exact generated spelling is declined');
  for(const title of [row.verifiedLiteralTitle,row.verifiedLiteralTitle[0].toLocaleLowerCase('pt')+row.verifiedLiteralTitle.slice(1),row.verifiedLiteralTitle.replace(/ /g,'_'),'Predefinição:'+row.verifiedLiteralTitle,' '+row.unverifiedLiteralTitle,row.unverifiedLiteralTitle+' '])eq(oracle.eligibleLiteralTitle(title),true,'No normalization or broad identity policy is added to the inherited oracle');
 }
 for(const value of ['',null,undefined,0,'Info/BIOGRAFIA','Modelo de controle','Info/Modelo não registrado','{{info/biografia}}'])eq(oracle.eligibleLiteralTitle(value),true,'Every value outside the exact finite set keeps its previous eligibility logic');
});
for(const file of files){const api=require(path.resolve(file)),bundle=path.basename(file);report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(file))});
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Pessoa de teste',authorityControl:false,autoPreview:false,portals:false};
 const calculate=source=>api.calculate({kind:'adjust',source,options:cfg});
 for(const endpoint of contract.pairedStaticEndpoints)test(bundle,'paired '+sha(endpoint.before).slice(0,16),()=>{
  const valid=calculate(endpoint.before),invalid=calculate(endpoint.unverifiedBefore);
  eq(valid.text,endpoint.expected,'The documented native title keeps its exact reviewed spouse-field migration and marriage presentation');
  eq(valid.preservation,[],'The canonical paired endpoint passes complete-source preservation');
  eq(calculate(valid.text).text,valid.text,'The canonical endpoint completes in one click');
  eq(invalid.text,endpoint.unverifiedBefore,'The paired unverified literal title stays byte-identical');
  eq(invalid.preservation,[],'Declining the paired title cannot lose source content');
 });
 for(const row of contract.titles)for(const key of ['conjuge','cônjuge','spouse','spouses','conjoint','cónyuge'])for(const word of ['casado','casada','casados'])test(bundle,'finite invalid '+sha(row.unverifiedLiteralTitle+' '+key+' '+word).slice(0,16),()=>{
  const source='{{'+row.unverifiedLiteralTitle+'|nome=Pessoa de teste|'+key+'=Pessoa A ('+word+' em 2000)'+row.extra+'}}\n\nTexto.';
  eq(calculate(source).text,source,'All native and foreign spouse field spellings remain literal inside an unverified title');
 });
}
if(process.env.REVISAWIKI_REPORT){fs.mkdirSync(path.dirname(path.resolve(process.env.REVISAWIKI_REPORT)),{recursive:true});fs.writeFileSync(process.env.REVISAWIKI_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(report.failures.length)process.exitCode=1;

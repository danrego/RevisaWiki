'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto'),parser=require('@babel/parser');
const file=path.join(__dirname,'legacy_regression.cjs'),code=fs.readFileSync(file,'utf8'),ast=parser.parse(code),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
let node;for(const item of ast.program.body)if(item.type==='FunctionDeclaration'&&item.id.name==='parseLegacyStdout')node=item;assert(node);
const parse=vm.runInNewContext('('+code.slice(node.start,node.end)+')'),samples=[
 [JSON.stringify({checks:10,status:'passed'}),{checks:10,status:'passed'}],
 [JSON.stringify({checks:12,cases:3,failures:[]},null,2),{checks:12,cases:3,failures:[]}],
 [JSON.stringify({checks:100,cases:20,failures:[]})+'\n'+JSON.stringify({checks:90,kind:'qualified',failures:[{id:'synthetic'}]}),{checks:90,kind:'qualified',failures:[{id:'synthetic'}]}],
 ['diagnostic line\n'+JSON.stringify({checks:7})+'\ntrailing text',{checks:7}],
 ['',null],['{bad-json',null],['[1,2]',[1,2]],['12',12],['noise\n0\n'+JSON.stringify({checks:0})+'\n42',{checks:0}]
];let checks=0;for(const [input,expected]of samples){assert.equal(JSON.stringify(parse(input)),JSON.stringify(expected));checks++;}
function calls(source){const out=[],tree=parser.parse(source);function walk(n){if(!n||typeof n!=='object')return;if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.object?.name==='cp'&&n.callee.property?.name==='spawnSync')out.push(source.slice(n.start,n.end));for(const[k,v]of Object.entries(n)){if(['loc','start','end'].includes(k))continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}walk(tree);return out;}
let executionShape=null;if(process.env.REVISAWIKI_LEGACY_RUNNER_PRIOR){const before=fs.readFileSync(process.env.REVISAWIKI_LEGACY_RUNNER_PRIOR,'utf8'),old=calls(before),current=calls(code);assert.deepEqual(current,old);checks++;const marker="  if(row.status!=='passed'&&row.qualification?.status!=='passed-with-qualified-legacy-protocol-difference')";assert.equal(code.slice(code.indexOf(marker)),before.slice(before.indexOf(marker)));checks++;executionShape={beforeSha256:sha(before),afterSha256:sha(code),spawnCallCount:old.length,spawnCallsByteIdentical:true,classificationAndFinalSummaryByteIdentical:true};}
const report={suite:'legacy-output-counter-parser-2.21.4',checks,calculations:0,failures:[],parserSha256:sha(code.slice(node.start,node.end)),runnerSha256:sha(code),executionShape,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

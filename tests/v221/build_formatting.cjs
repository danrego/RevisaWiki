'use strict';
// Packaging whitespace has no authority to change code, comments or values.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),parser=require('@babel/parser');
const root=path.resolve(__dirname,'../..'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-build-formatting-'));
const extraction=cp.spawnSync('python3',['-c','import ast,pathlib,sys; m=ast.parse(pathlib.Path(sys.argv[1]).read_text()); matches=[ast.literal_eval(n.value) for n in m.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=="STRUCTURAL_GAP_FORMATTER" for t in n.targets)]; assert len(matches)==1; print(matches[0],end="")',path.join(root,'scripts/build_v2210.py')],{encoding:'utf8'});assert.equal(extraction.status,0,extraction.stderr);
const formatter=path.join(temporary,'formatter.cjs');fs.writeFileSync(formatter,extraction.stdout);
const historical=fs.readFileSync(path.join(root,'tests/v220/compact_cases.cjs'),'utf8'),ast=parser.parse(historical),declaration=ast.program.body.find(n=>n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='sources')),old=declaration.declarations.find(d=>d.id.name==='sources').init.elements.map(n=>{assert.equal(n.type,'StringLiteral');return n.value;});
const extra=[
 '(function(){\nlet a=1;\nlet b=2;\nreturn a+b;\n})()',
 '(function(){\nreturn {\na:1,\nb:2\n};\n})()',
 '(function(){\nreturn [\n1,\n2,\n3\n];\n})()',
 '(function(){let a=1; // keep this line\nreturn a+2;\n})()',
 '(function(){let a=1;\n/* keep this block\nexactly */\nreturn a;\n})()',
 '(function(){return\n{a:1};\n})()',
 '(function(){let a=1\na++;\nreturn a;\n})()',
 '(function(){let a=1;\nreturn a\n++a;\n})()',
 '(function(){return `text\n inside ${\n1+2\n}`;\n})()',
 '(function(){\nreturn "a\\nb"+" a  b ";\n})()',
 '(function(){\nreturn /[;{,]\\s+/.test("; ");\n})()',
 '(function(){\nconst café={\n"a":1,\n"b":2\n};\nreturn café.a+café.b;\n})()',
 '(function(){\r\nconst x=1;\r\nreturn x;\r\n})()',
 '(function(){\u2028const x=1;\u2029return x;\n})()',
 '(function(){\nreturn ["a\u2028b",\n"a\u2029b"];\n})()',
 '(function(){\nlabel: {\n break label;\n}\nreturn 4;\n})()',
 '(function(){\nlet x=0;\nfor(let a=0;\na<3;\na++){\nx+=a;\n}\nreturn x;\n})()',
 '(function(){\nfunction x(){\nreturn 1;\n}\nreturn x();\n})()',
 '(function(){\ntry{\nthrow new Error("x");\n}catch(e){\nreturn e.message;\n}\n})()',
 '(function(){\nlet x=1;\n// never swallow this comment\nreturn x;\n})()',
];
const cases=[...old,...extra],report={kind:'build-structural-whitespace-controls',status:'passed',cases:[],checks:0,historicalInputSha256:hash(historical),formatterSha256:hash(extraction.stdout),networkRequests:0,wikipediaWrites:0};
try{
for(let i=0;i<cases.length;i++){
 const source=cases[i],input=path.join(temporary,'source-'+i+'.js'),output=path.join(temporary,'output-'+i+'.js');fs.writeFileSync(input,source);
 const result=cp.spawnSync(process.execPath,[formatter,input,output,path.join(root,'scripts/v220_compact.cjs')],{encoding:'utf8',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});assert.equal(result.status,0,result.stderr);const proof=JSON.parse(result.stdout),formatted=fs.readFileSync(output,'utf8');
 assert.equal(proof.sourceSha256,hash(source));assert.equal(proof.outputSha256,hash(formatted));
 const before=vm.runInNewContext(source,{}, {timeout:1000}),after=vm.runInNewContext(formatted,{}, {timeout:1000});assert.equal(JSON.stringify(after),JSON.stringify(before));
 const second=path.join(temporary,'second-'+i+'.js'),again=cp.spawnSync(process.execPath,[formatter,output,second,path.join(root,'scripts/v220_compact.cjs')],{encoding:'utf8',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});assert.equal(again.status,0,again.stderr);assert.equal(fs.readFileSync(second,'utf8'),formatted);
 report.checks+=6;report.cases.push({sourceSha256:hash(source),outputSha256:hash(formatted),removedLineGaps:proof.removedLineGaps});
}
assert(report.cases.some(c=>c.removedLineGaps>3));report.checks++;
console.log(JSON.stringify(report));
}finally{fs.rmSync(temporary,{recursive:true,force:true});}

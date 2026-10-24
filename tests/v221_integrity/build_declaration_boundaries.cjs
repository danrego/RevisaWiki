'use strict';
// Packaging may join declarations; expression boundaries must stay intact.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-declaration-boundaries-'));
const extracted=cp.spawnSync('python3',['-c','import ast,pathlib,sys; tree=ast.parse(pathlib.Path(sys.argv[1]).read_text()); values=[ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=="STRUCTURAL_GAP_FORMATTER" for t in n.targets)]; assert len(values)==1; print(values[0],end="")',path.join(root,'scripts/build_v2210.py')],{encoding:'utf8'});
assert.equal(extracted.status,0,extracted.stderr);
const formatter=path.join(temporary,'formatter.cjs');fs.writeFileSync(formatter,extracted.stdout);
const positive=[
 'function a(){return 1}\nfunction b(){return a()+1}return b()',
 'function* a(){yield 1}\nfunction b(){return a().next().value}return b()',
 'async function a(){return 1}\nfunction b(){return a.name}return b()',
 'function a(){function x(){return 2}\nfunction y(){return x()+1}return y()}\nfunction b(){return a()}return b()',
 'function a(){return /[{}]/.test("{")}\r\nfunction b(){return a()}return b()',
 'function a(){return "same  text"}\u2028function b(){return a()}return b()',
 'function a(){return `same\ntext`}\u2029function b(){return a()}return b()',
 'function a(){return 2}\n\n\nfunction b(){return a()}return b()',
 'function a(){return 1}\nasync function b(){return a()}return b.name',
 'function a(){return 1}\nconst b=a()+1;return b',
 'function a(){return 1}\nreturn a()',
 'function a(){return 1}\nif(a()===1){return 2}return 0',
 'function a(){return 1}\nclass B {value(){return a()}}return new B().value()',
 'function a(){return 1}\n(function(){a()})();return 2',
 'function a(){return 1}\n/x/.test("x");return a()',
 'let n=0;function a(){return 1}\n++n;return n',
 'class A {x(){return 1}}\nfunction b(){return new A().x()}return b()',
 'if(true){const x=1}\nfunction b(){return 2}return b()',
 'let n=0;for(let i=0;i<2;i++){n+=i}\nreturn n',
 'let n=0;while(n<2){n++}\nreturn n',
 'let n=0;do{n++}\nwhile(n<2);return n',
 'let n=0;try{n++}\nfinally{n++}\nreturn n',
 'let n=0;switch(n){case 0:n=1;break}\nreturn n',
 '{let n=1}\nreturn 2'
];
const negative=[
 'const a=function(){return 1}\nfunction b(){return a()}return b()',
 'const a=()=>{return 1}\nfunction b(){return a()}return b()',
 'const a={x:1}\nfunction b(){return a.x}return b()',
 'function a(){return 1}\n// This exact comment remains.\nfunction b(){return a()}return b()',
 'function a(){return 1}\n/* This exact block\n remains. */\nfunction b(){return a()}return b()'
];
let checks=0;
try{
 for(const [i,body]of [...positive,...negative].entries()){
  const source='(function(){'+body+'})()',input=path.join(temporary,i+'.js'),output=path.join(temporary,i+'-out.js');fs.writeFileSync(input,source);
  const result=cp.spawnSync(process.execPath,[formatter,input,output,path.join(root,'scripts/v220_compact.cjs')],{encoding:'utf8',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});
  assert.equal(result.status,0,result.stderr);checks++;
  const formatted=fs.readFileSync(output,'utf8'),proof=JSON.parse(result.stdout);
  assert.equal(JSON.stringify(vm.runInNewContext(source,{}, {timeout:1000})),JSON.stringify(vm.runInNewContext(formatted,{}, {timeout:1000})));checks++;
  assert.equal(proof.commentCount,(source.match(/\/\/ This|\/\* This/g)||[]).length);checks++;
  if(i<positive.length){assert.equal(proof.removedLineGaps>0,true);checks++;}
  else {assert.equal(formatted,source);checks++;}
 }
 console.log(JSON.stringify({status:'passed',cases:positive.length+negative.length,checks,networkRequests:0,wikipediaWrites:0}));
}finally{fs.rmSync(temporary,{recursive:true,force:true});}

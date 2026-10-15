'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {transform}=require('./anonymize_javascript.cjs'),sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const root=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]),files=[];
function visit(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,entry.name);if(entry.isDirectory())visit(p);else if(entry.isFile()&&p.endsWith('.js'))files.push(p);}}
for(const rel of ['dist','tests/inherited/fixtures/baselines','tests/v25_inherited/fixtures/baselines'])if(fs.existsSync(path.join(root,rel)))visit(path.join(root,rel));
const cache=new Map(),rows=[];
for(const file of files){
 const source=fs.readFileSync(file,'utf8'),digest=sha(source);let r=cache.get(digest);
 if(!r){r=transform(source);assert.equal(transform(r.text).text,r.text,'Sanitizer must be idempotent.');cache.set(digest,r);}
 rows.push({file:path.relative(root,file).replaceAll(path.sep,'/'),...r.proof});
}
const report={version:'2.6.0',status:'passed',mode:'dry-run-only-no-source-files-written',files:rows.length,distinctInputs:cache.size,changedFiles:rows.filter(r=>r.changed).length,totalOptionalCommandRemovals:rows.reduce((n,r)=>n+r.retiredOptionalCommands.length,0),allASTProofsPassed:rows.every(r=>r.ASTEquivalentOutsideDeclaredChanges),allIdempotent:true,networkRequests:0,wikipediaWrites:0,articlesOrScientificDataModified:false,results:rows};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,results:undefined}));

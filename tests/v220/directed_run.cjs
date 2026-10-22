'use strict';
// Execute the built distributions. Raw local receipts remain in the chosen folder.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),argv=Object.fromEntries(process.argv.slice(2).map(arg=>{const at=arg.indexOf('=');if(!arg.startsWith('--')||at<0)throw Error('Use --name=value');return[arg.slice(2,at),arg.slice(at+1)];}));
const directory=path.resolve(argv.dist||path.join(root,'dist/2.20.0')),output=argv.output?path.resolve(argv.output):fs.mkdtempSync(path.join(os.tmpdir(),'revisawiki-directed-'));
fs.mkdirSync(output,{recursive:true});
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const bundles=['RevisaWiki_v2_20_0.js','RevisaWiki_v2_20_0_completo.js'].map(name=>path.join(directory,name));
const manifestPath=fs.existsSync(path.join(directory,'MANIFESTO_RUNTIME.json'))?path.join(directory,'MANIFESTO_RUNTIME.json'):path.join(root,'tests/expected_release_v2200.json');
const manifestBytes=fs.readFileSync(manifestPath),manifest=JSON.parse(manifestBytes);
if(manifest.version!=='2.20.0')throw Error('The directed suite requires the frozen current release');
for(const file of bundles){const raw=fs.readFileSync(file),pin=manifest.files[path.basename(file)];if(!pin||raw.length!==pin.bytes||sha(raw)!==pin.sha256)throw Error('The executed bundle differs from the manifest');}
const tasks=[
 ['compact',['tests/v220/compact_cases.cjs']],
 ['approved-scope-registry',['tests/v220/coverage_registry_cases.cjs']],
 ['legacy-image-contract-derivation',['tests/v220/bio_legacy_image_governance.cjs']],
 ['integration',['tests/v220/integration_cases.cjs',...bundles]],
 ['transport',['tests/v220/ui_transport_cases.cjs',...bundles]],
 ['cyclic-context',['tests/v219/ui_context_serialization_cases.cjs',...bundles]],
 ['release-demonstration',['tests/v220/demonstration_release_cases.cjs',...bundles]],
 ['citations',['tests/v220/citation_cases.cjs',...bundles]],
 ['heading-references',['tests/v220/citation_heading_cases.cjs',...bundles]],
 ['whole-action-citations',['tests/v220/citation_whole_action_cases.cjs',...bundles]],
 ['adjacent-reference-boundaries',['tests/v220/citation_adjacent_boundary_cases.cjs',...bundles]],
 ['hidden-reference-attribute-boundaries',['tests/v220/citation_hidden_attribute_cases.cjs',...bundles]],
 ['double-opening-owner-boundaries',['tests/v220/citation_double_open_owner_cases.cjs',...bundles]],
 ['glued-citation-parameter-boundaries',['tests/v220/citation_glued_parameter_cases.cjs',...bundles]],
 ['biography-media-portals',['tests/v220/bio_run.cjs']],
 ['whole-action-structure',['tests/v220/structure_whole_action.cjs',...bundles]],
 ['legacy-key-value-boundaries',['tests/v220/structure_legacy_key_boundary.cjs',...bundles]],
 ['legacy-key-kind-families',['tests/v220/structure_legacy_key_family.cjs',...bundles]],
 ['legacy-key-action-composition',['tests/v220/structure_key_composition.cjs',...bundles]],
 ['legacy-key-source-prerequisite',['tests/v220/structure_key_prerequisite.cjs',...bundles]],
 ['structure-campaign',['tests/v220/structure_campaign.cjs',...bundles]],
 ['native-structure',['tests/v220/structure_native.cjs',...bundles]],
 ...bundles.map((file,index)=>['structure-'+index,['tests/v220/structure_repairs.cjs',file]])
];
const dependencies=new Set(tasks.map(([,args])=>args[0]));
function collect(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())collect(file);else if(entry.isFile()&&(/\.(?:cjs|js)$/.test(entry.name)||entry.name.endsWith('.json')&&!/results/i.test(entry.name)))dependencies.add(path.relative(root,file));}}
collect(path.join(root,'tests/v220'));
for(const name of Object.keys(manifest.sourceInputs))dependencies.add(name);
const dependencyPins=Object.fromEntries([...dependencies].sort().map(name=>[name,sha(fs.readFileSync(path.join(root,name)))]));
for(const [name,pin]of Object.entries(manifest.sourceInputs))if(dependencyPins[name]!==pin.sha256)throw Error('A runtime source input differs from its frozen build');
const report={version:'2.20.0',status:'passed',manifestSha256:sha(manifestBytes),dependencyPins,suites:[],wikipediaWrites:0};
for(const [name,args]of tasks){
 const receipt=path.join(output,name+'.json'),errors=path.join(output,name+'.stderr.txt');
 if(fs.existsSync(receipt)||fs.existsSync(errors))throw Error('Use a fresh receipt directory');
 const stdout=fs.openSync(receipt,'wx'),stderr=fs.openSync(errors,'wx');let result;
 try{result=cp.spawnSync(process.execPath,args,{cwd:root,env:{...process.env,REVISAWIKI_BUNDLE_DIR:directory},stdio:['ignore',stdout,stderr]});}
 finally{fs.closeSync(stdout);fs.closeSync(stderr);}
 const row={name,exitCode:result.status,status:'failed',receiptSha256:sha(fs.readFileSync(receipt)),runnerSha256:sha(fs.readFileSync(path.join(root,args[0])))};
 try{const parsed=JSON.parse(fs.readFileSync(receipt,'utf8'));if(result.status!==0||parsed.status!=='passed'||parsed.failures?.length)throw Error('The directed suite did not pass');row.status='passed';}
 catch{report.status='failed';}
 report.suites.push(row);process.stdout.write(JSON.stringify({name,status:row.status})+'\n');
}
for(const file of bundles)if(sha(fs.readFileSync(file))!==manifest.files[path.basename(file)].sha256)throw Error('The executed runtime changed');
for(const [name,pin]of Object.entries(dependencyPins))if(sha(fs.readFileSync(path.join(root,name)))!==pin)throw Error('A directed test dependency changed during execution: '+name);
fs.writeFileSync(path.join(output,'SUMMARY.json'),JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;

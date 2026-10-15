'use strict';
const path=require('node:path'),fs=require('node:fs'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const out=path.join(__dirname,'artifacts');
fs.mkdirSync(out,{recursive:true});
const proof=require('./PROVENANCE.json');
// The frozen suites expect an artifacts directory three levels below root.
// Copy their exact bytes there, keeping generated reports out of the sources.
for(const name of ['harness.cjs',...proof.suites.map(s=>s.name+'.cjs')])
    fs.copyFileSync(path.join(__dirname,name),path.join(out,name));
fs.cpSync(path.join(__dirname,'fixtures'),path.join(out,'fixtures'),{recursive:true});
for(const name of ['Catalogo_ortografia_RevisaWiki_v2_5.json','Carregador_common_js_RevisaWiki_v2_5.js'])
    fs.copyFileSync(path.join(root,'dist/2.5.0',name),path.join(out,name));
const nodePath=[path.join(root,'tests/inherited'),process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
for(const s of proof.suites){
    const r=cp.spawnSync(process.execPath,[path.join(out,s.name+'.cjs')],{
        cwd:root,
        env:{...process.env,NODE_PATH:nodePath,REVISAWIKI_SCRIPT:path.join(root,'dist/2.5.0/RevisaWiki_v2_5.js'),REVISAWIKI_EXPECTED_VERSION:'2.5.0',REVISAWIKI_FILE_VERSION:'v2_5',REVISAWIKI_OUTDIR:out},
        stdio:'inherit'
    });
    if(r.status!==0)process.exit(r.status||1);
}

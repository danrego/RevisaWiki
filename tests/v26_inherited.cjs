'use strict';
const path=require('node:path'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const out=path.join(__dirname,'artifacts/v26_inherited');
fs.mkdirSync(out,{recursive:true});
const proof=require('./v25_inherited/PROVENANCE.json');
// The frozen suites expect an artifacts directory three levels below root.
// Copy their exact bytes there, keeping generated reports out of the sources.
for(const name of ['harness.cjs',...proof.suites.map(s=>s.name+'.cjs')])
    fs.copyFileSync(path.join(__dirname,'v25_inherited',name),path.join(out,name));
fs.cpSync(path.join(__dirname,'v25_inherited/fixtures'),path.join(out,'fixtures'),{recursive:true});
// A browser always supplies location and URL. The old loader fixture omitted
// them because it preceded the read-view launcher. Preserve its assertions.
const loaderFixture=path.join(out,'loader_tests.cjs');
const original=fs.readFileSync(loaderFixture,'utf8');
const anchor='ctx.window = ctx;ctx.document={getElementById:()=>null};const hooks={};';
if(original.split(anchor).length!==2)throw new Error('Unexpected frozen loader fixture');
const adapted=original.replace(anchor,anchor+"ctx.location={origin:'https://pt.wikipedia.org',hostname:'pt.wikipedia.org',href:'https://pt.wikipedia.org/w/index.php?title=Teste&action=edit'};ctx.URL=URL;");
fs.writeFileSync(loaderFixture,adapted);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const harnessFixture=path.join(out,'harness.cjs');
const originalHarness=fs.readFileSync(harnessFixture,'utf8');
const rootAnchor="const root = path.resolve(__dirname, path.basename(__dirname)==='artifacts'?'../../..':'../..');";
if(originalHarness.split(rootAnchor).length!==2)throw new Error('Unexpected frozen harness');
const adaptedHarness=originalHarness.replace(rootAnchor,"const root = path.resolve(__dirname, '../../..');");
fs.writeFileSync(harnessFixture,adaptedHarness);
fs.writeFileSync(path.join(out,'fixture_environment_adaptation.json'),JSON.stringify({
 originalSha256:sha(original),adaptedSha256:sha(adapted),
 originalHarnessSha256:sha(originalHarness),adaptedHarnessSha256:sha(adaptedHarness),
 change:'Supply browser location and URL and resolve the copied harness from its actual depth; assertions unchanged.'
},null,2)+'\n');
for(const name of ['Catalogo_ortografia_RevisaWiki_v2_6.json','Carregador_common_js_RevisaWiki_v2_6.js'])
    fs.copyFileSync(path.join(root,'dist/2.6.0',name),path.join(out,name));
const nodePath=[path.join(root,'tests/inherited'),process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
const from=process.argv.indexOf('--from');
const start=from<0?0:proof.suites.findIndex(s=>s.name===process.argv[from+1]);
if(start<0)throw new Error('Unknown starting suite');
for(const s of proof.suites.slice(start)){
    const r=cp.spawnSync(process.execPath,[path.join(out,s.name+'.cjs')],{
        cwd:root,
        env:{...process.env,NODE_PATH:nodePath,REVISAWIKI_SCRIPT:path.join(root,'dist/2.6.0/RevisaWiki_v2_6.js'),REVISAWIKI_EXPECTED_VERSION:'2.6.0',REVISAWIKI_FILE_VERSION:'v2_6',REVISAWIKI_OUTDIR:out},
        stdio:'inherit'
    });
    if(r.status!==0)process.exit(r.status||1);
}

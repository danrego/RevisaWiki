'use strict';
// Reuse only the established isolated browser adapter and its exact host guards.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const file=path.resolve(__dirname,'../v2211/browser_columns.cjs'),original=fs.readFileSync(file,'utf8'),start=original.indexOf('const body=String.raw`');
assert.ok(start>0);const setup=original.slice(0,start);
const body=String.raw`
report.kind='native-browser-safe-data-installation';report.distributionRevision='2.21.1-installation.1';
report.installationRunnerSha256=sha(fs.readFileSync(path.resolve(__dirname,'../../installation1/browser_presave.cjs')));
const oldSource="const source=sources[scenario]||sources.normal,qa=",newSource="const source=params.has('installationSource')?JSON.parse(params.get('installationSource')):sources[scenario]||sources.normal,qa=";
assert.equal(fixtureScript.toString().split(oldSource).length,2);
const fixture=fixtureScript.toString().replace(oldSource,newSource);localFiles['current_fixture.js']=()=>Buffer.from(fixture);
const greekKeys=1507,sourceFor=n=>'Texto de controle.\n\n== Ligações externas ==\n'+Array.from({length:n},(_,i)=>'* Item '+(i+1)).join('\n')+'\n';
const expectedFor=n=>n<8?sourceFor(n):'Texto de controle.\n\n== Ligações externas ==\n{{Div col|colunas=2}}\n'+Array.from({length:n},(_,i)=>'* Item '+(i+1)).join('\n')+'\n{{Div col fim}}\n';
(async()=>{
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;await driver.start(origin);report.browserVersion=driver.version;
  for(const scenario of['normal','fallback'])for(const n of[7,8])await test('protected-data-'+scenario+'-'+n,async()=>{
   const source=sourceFor(n);await load('core',scenario,'classic',{installationSource:JSON.stringify(source)});
   eq(await read('RevisaWiki.catalogLoad.sha256'),'daac113c09d861d141090d42e332a194b33a85d5b5831602329671ffd5aad011','The real WebCrypto bootstrap accepts the frozen catalogue hash');
   eq(await read('Object.keys(RevisaWikiDataV2.packed.support221.citation.V221_NATIVE_TITLECASE_MAP).length'),greekKeys,'All original Unicode dictionary keys remain distinct');
   eq(await read('RevisaWikiDataV2.packed.support221.literals.SHORTCUTS.sf'),'{{Sem fontes|data={{subst:DATA}}}}','A shortcut stays literal after JavaScript decoding');
   eq(await read('__rw219UI.read()'),source,'The complete original draft reaches the actual editor');await adjust();eq(await read('__rw219UI.read()'),expectedFor(n),'The current eight-root-item rule is unchanged');
   if(n===8){eq(await read('document.getElementById("wpMinoredit").checked'),true,'Tool-only change retains the minor-edit behavior');await click('.ajg-undo');await settled();eq(await read('__rw219UI.read()'),source,'Undo restores the entire original draft');}
   await invariant();
  });
  eq(report.actualNetworkMutations,0,'No network mutation');eq(driver.errors||[],[],'No browser runtime error');report.blockedNetwork=driver.blocked||[];
 }catch(error){report.status='failed';report.failures.push({id:'driver-or-fixture',message:String(error.message)});}
 finally{
  try{if(browserName==='Safari'&&driver.session){await driver.request('DELETE','/session/'+driver.session);driver.session=null;report.ownedAutomationSessionDeletionAcknowledged=true;}await driver.close();report.ownedBrowserSessionClosed=true;}catch(error){report.status='failed';report.failures.push({id:'owned-session-cleanup',message:String(error.message)});}
  await new Promise(resolve=>server.close(resolve));report.testCount=report.tests.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
 }
})();
`;
const generated=setup+'const body='+JSON.stringify(body)+';\n'+original.slice(original.indexOf('const adapted=prefix+'));
const scoped=new Module(file,module);scoped.filename=file;scoped.paths=Module._nodeModulePaths(path.dirname(file));scoped._compile(generated,file);

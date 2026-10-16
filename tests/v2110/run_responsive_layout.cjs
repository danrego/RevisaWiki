'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {NativeChrome,NativeFirefox,NativeSafari}=require('../v261/browser/native_driver.cjs');
const responsiveFlow=require('./browser/responsive_flow.cjs');
const browserName=process.argv[2]||'Chrome',Driver={Chrome:NativeChrome,Firefox:NativeFirefox,Safari:NativeSafari}[browserName];assert(Driver,'Supported installed browser');
async function main(){
 const server=http.createServer((req,res)=>{if(req.method!=='GET'){res.writeHead(403).end();return;}res.writeHead(200,{'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self' about:; img-src 'none'"});res.end('<!doctype html><meta charset="utf-8"><title>Local responsive table validation</title>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port,driver=new Driver();let report;
 try{await driver.start(origin);await driver.navigate(origin+'/');report=await responsiveFlow(driver);report.browser=browserName;report.browserVersion=driver.version;}finally{await driver.close();await new Promise(resolve=>server.close(resolve));}
 const out=path.resolve(process.env.REVISAWIKI_REPORT_DIR||path.join(__dirname,'../../artifacts/v2110/responsive'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,browserName.toLowerCase()+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,browser:browserName,cases:report.cases.length,checks:report.checks,originalUsuallyAlreadyConfined:report.originalUsuallyAlreadyConfined,failures:report.failures}));if(report.failures.length)process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

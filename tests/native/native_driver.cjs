'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const playwright=require(process.env.REVISAWIKI_PLAYWRIGHT_MODULE || 'playwright');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
class NativeFirefox{
 async start(origin){
  this.origin=origin;this.pending=new Map();this.serial=0;this.blocked=[];this.errors=[];
  this.profile=fs.mkdtempSync(path.join(__dirname,'firefox_profile_'));
  fs.writeFileSync(path.join(this.profile,'user.js'),[
   'user_pref("app.update.auto",false);','user_pref("browser.shell.checkDefaultBrowser",false);','user_pref("datareporting.healthreport.uploadEnabled",false);','user_pref("datareporting.policy.dataSubmissionEnabled",false);','user_pref("toolkit.telemetry.enabled",false);','user_pref("browser.newtabpage.enabled",false);','user_pref("browser.startup.homepage","about:blank");','user_pref("browser.safebrowsing.downloads.enabled",false);','user_pref("browser.safebrowsing.phishing.enabled",false);','user_pref("browser.safebrowsing.malware.enabled",false);','user_pref("browser.search.update",false);','user_pref("extensions.update.enabled",false);','user_pref("app.normandy.enabled",false);','user_pref("app.shield.optoutstudies.enabled",false);'
  ].join('\n'));
  this.process=spawn('/Applications/Firefox.app/Contents/MacOS/firefox',['--headless','--no-remote','--profile',this.profile,'--remote-debugging-port','0','about:blank'],{stdio:['ignore','pipe','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error('Firefox BiDi timeout '+log.slice(-1000))),20000);const read=d=>{log+=d;const m=log.match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}};this.process.stderr.on('data',read);this.process.stdout.on('data',read);this.process.once('exit',c=>{clearTimeout(timer);reject(new Error('Firefox exited '+c+': '+log));});});
  this.socket=new WebSocket(endpoint.replace(/\/$/,'')+'/session');await new Promise((resolve,reject)=>{this.socket.addEventListener('open',resolve,{once:true});this.socket.addEventListener('error',reject,{once:true});});
  this.socket.addEventListener('message',event=>{const data=JSON.parse(event.data),job=this.pending.get(data.id);if(job){this.pending.delete(data.id);clearTimeout(job.timer);data.type==='error'?job.reject(new Error(data.error+': '+data.message)):job.resolve(data.result);}
   if(data.method==='network.beforeRequestSent'&&data.params.isBlocked){const req=data.params.request;if(req.url.startsWith(this.origin+'/')||req.url.startsWith('blob:'))this.command('network.continueRequest',{request:req.request}).catch(e=>this.errors.push(e.message));else{this.blocked.push(req.url);this.command('network.failRequest',{request:req.request}).catch(e=>this.errors.push(e.message));}}
  });
  const session=await this.command('session.new',{capabilities:{}});this.version=session.capabilities.browserVersion;this.context=(await this.command('browsingContext.create',{type:'tab'})).context;
  await this.command('session.subscribe',{events:['network.beforeRequestSent'],contexts:[this.context]});await this.command('network.addIntercept',{phases:['beforeRequestSent'],contexts:[this.context]});await this.command('browsingContext.setViewport',{context:this.context,viewport:{width:1280,height:1000},devicePixelRatio:1});
 }
 command(method,params={}){return new Promise((resolve,reject)=>{const id=++this.serial;const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('BiDi timeout '+method));},180000);this.pending.set(id,{resolve,reject,timer});this.socket.send(JSON.stringify({id,method,params}));});}
 async navigate(url){await this.command('browsingContext.navigate',{context:this.context,url,wait:'complete'});}
 async evaluate(expression){const out=await this.command('script.evaluate',{expression,target:{context:this.context},awaitPromise:true});if(out.type==='exception')throw new Error(JSON.stringify(out.exceptionDetails));return out.result.type==='undefined'?undefined:out.result.value;}
 async screenshot(file){const result=await this.command('browsingContext.captureScreenshot',{context:this.context,origin:'document'});fs.writeFileSync(file,Buffer.from(result.data,'base64'));}
 async close(){try{if(this.socket?.readyState===1)await this.command('session.end');}catch{}this.socket?.close();if(this.process&&this.process.exitCode===null){this.process.kill('SIGTERM');await Promise.race([new Promise(r=>this.process.once('exit',r)),delay(3000)]);}if(this.profile)fs.rmSync(this.profile,{recursive:true,force:true});}
}
class NativeChrome{
 async start(origin){this.origin=origin;this.blocked=[];this.browser=await playwright.chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-first-run','--no-default-browser-check','--disable-background-networking']});this.version=this.browser.version();this.context=await this.browser.newContext({viewport:{width:1280,height:1000}});await this.context.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();this.blocked.push(route.request().url());return route.abort();});this.page=await this.context.newPage();this.errors=[];this.page.on('pageerror',e=>this.errors.push(e.message));}
 async navigate(url){await this.page.goto(url,{waitUntil:'load'});}
 async evaluate(expression){return this.page.evaluate(expression);}
 async screenshot(file){await this.page.screenshot({path:file,fullPage:true});}
 async close(){await this.browser?.close();}
}
class NativeSafari{
 async start(origin){this.origin=origin;this.errors=[];this.blocked=[];this.port=47691;this.process=spawn('/usr/bin/safaridriver',['-p',String(this.port)],{stdio:['ignore','pipe','pipe']});this.log='';this.process.stderr.on('data',d=>this.log+=d);let ready=false;for(let i=0;i<50;i++){try{await this.request('GET','/status');ready=true;break;}catch{}await delay(100);}if(!ready)throw new Error('safaridriver unavailable '+this.log);const session=await this.request('POST','/session',{capabilities:{alwaysMatch:{browserName:'safari'}}});this.session=session.sessionId;this.version=session.capabilities.browserVersion;await this.request('POST',`/session/${this.session}/timeouts`,{script:180000,pageLoad:60000,implicit:0});await this.request('POST',`/session/${this.session}/window/rect`,{width:1280,height:1000});}
 async request(method,route,data){const r=await fetch(`http://127.0.0.1:${this.port}${route}`,{method,headers:{'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});const out=await r.json();if(out.value?.error)throw new Error(out.value.error+': '+out.value.message);return out.value;}
 async navigate(url){await this.request('POST',`/session/${this.session}/url`,{url});}
 async evaluate(expression){return this.request('POST',`/session/${this.session}/execute/async`,{script:'var callback=arguments[arguments.length-1]; Promise.resolve().then(function(){return (0,eval)(arguments[0]);}.bind(null,arguments[0])).then(function(value){callback({ok:true,value:value});},function(error){callback({ok:false,error:String(error&&error.stack||error)});});',args:[expression]}).then(r=>{if(!r.ok)throw new Error(r.error);return r.value;});}
 async screenshot(file){const result=await this.request('GET',`/session/${this.session}/screenshot`);fs.writeFileSync(file,Buffer.from(result,'base64'));}
 async close(){if(this.session)try{await this.request('DELETE',`/session/${this.session}`);}catch{}if(this.process&&this.process.exitCode===null)this.process.kill('SIGTERM');}
}
module.exports={NativeFirefox,NativeChrome,NativeSafari,delay};

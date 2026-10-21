'use strict';
// Supplemental test delivery only. This never activates a DOM element by JS.
module.exports=async function stableNativePointerClick(driver,selector,observations=[]){
 const box=JSON.parse(await driver.evaluate('new Promise((resolve,reject)=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)return reject(Error("Missing native target"));el.scrollIntoView({block:"center"});let prior=null,stable=0,frames=0;function sample(){const r=el.getBoundingClientRect(),x=Math.round(r.left+r.width/2),y=Math.round(r.top+r.height/2),hit=document.elementFromPoint(x,y),key=[r.x,r.y,r.width,r.height].join("|");stable=key===prior&&hit&&(hit===el||el.contains(hit))?stable+1:0;prior=key;if(stable>=2)return resolve(JSON.stringify({x,y,frames}));if(++frames>120)return reject(Error("Native target geometry did not settle"));requestAnimationFrame(sample)}requestAnimationFrame(sample)})'));
 observations.push({selector,...box});
 await driver.command('input.performActions',{context:driver.context,actions:[{type:'pointer',id:'qa-mouse',parameters:{pointerType:'mouse'},actions:[{type:'pointerMove',x:box.x,y:box.y,duration:0,origin:'viewport'},{type:'pointerDown',button:0},{type:'pointerUp',button:0}]}]});
};

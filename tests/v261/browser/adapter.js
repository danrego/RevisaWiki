// Local test adapter only. API responses are already simulated in fixture.js.
window.__qaAssertions=0;
window.__qaBlockedNetwork=0;
const nativeFetch=window.fetch.bind(window);
window.fetch=(url,options)=>{
    const resolved=new URL(typeof url==='string'?url:url.url,location.href);
    if(resolved.origin!==location.origin){__qaBlockedNetwork++;return Promise.reject(new Error('External request blocked'));}
    return nativeFetch(url,options);
};
mw.loader.getScript=()=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='/data.js';script.onload=resolve;script.onerror=()=>reject(new Error('Local data failed'));document.head.appendChild(script);
});

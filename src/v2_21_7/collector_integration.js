// Decline only a late collector insertion that its unchanged source-bank
// reader cannot prove. Keep other end-section work and citation repairs.
function endMatterPass(source,mark,warn,cfg={},original=null){
 const events=[];
 const next=v2217Previous_endMatterPass(source,(...args)=>events.push({kind:'mark',args}),(...args)=>events.push({kind:'warn',args}),cfg,original);
 if(next!==source&&cfg.references!==false&&!cfg.sectionOnly){
  const before=rendererRanges(source);
  if(before.length){
   const after=rendererRanges(next),plain=text=>/^\{\{\s*Referências\s*\}\}$/.test(text),
    count=(text,ranges)=>ranges.filter(range=>plain(text.slice(range.start,range.end))).length;
   if(after.length===before.length+1&&count(next,after)===count(source,before)+1&&
      !v219BankRetention(source,next,cfg).accepted){
    // Run the same stage with only its automatic reference append disabled.
    // Its headings, callbacks and all independent preceding repairs survive.
    return v2217Previous_endMatterPass(source,mark,warn,{...cfg,references:false},original);
   }
  }
 }
 for(const event of events)(event.kind==='mark'?mark:warn)(...event.args);
 return next;
}

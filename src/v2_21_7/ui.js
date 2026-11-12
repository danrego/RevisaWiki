// Talk metadata follows the same automatic minor-edit preference as article
// adjustments. The editor still owns the manual checkbox and draft guards.
function pageContextOptions(options={}) {
 const cfg=v2217Previous_pageContextOptions(options),ns=options.namespaceNumber;
 if(Number.isInteger(ns)&&ns>0&&ns%2===1&&
   (options.contentModel===undefined||options.contentModel==='wikitext'))
  cfg.autoMinor=options.autoMinor!==false;
 return cfg;
}

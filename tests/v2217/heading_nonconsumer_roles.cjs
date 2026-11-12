// Literal native parameter roles and foreign targets must preserve real consumers.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
const file=path.resolve(args['--module']||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(file),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const positives=[
 ['ignored-site-colour','{{Info/Sítio|nome=Exemplo|fundo=#5BBDFF}}'],
 ['biography-tracking-colour','{{Info/Biografia|bgcolour=#EEDD88}}'],
 ['wikidata-biography-colour','{{Info/Biografia/Wikidata|bgcolour=#b0c4de}}'],
 ...['cor_fundo1','cor_fundo2','cor_letra1','cor_letra2'].map(k=>['roster-'+k,'{{Elenco atual de futebol|'+k+'=#FAFAFA}}']),
 ['older-roster','{{Elenco de Futebol|cor fundo1=#900020}}'],
 ['party-colour','{{Info/Partido político|colorcode=#015AAA}}'],
 ['party-seat-numbered','{{Info/Partido político/lugares|3=#69028C}}'],
 ['party-seat-palette','{{Info/Partido político/lugares|1|2|#{{RGBpol|PS}}}}'],
 ['party-seat-hex','{{Info/Partido político/lugares|hex=#ABC}}'],
 ['foreign-apostrophe',"[https://foreign.example/a'b#part Fonte]"],
 ['foreign-apostrophe-in-reference',"<ref>[https://foreign.example/a'b#part ''Fonte'']</ref>"]
];
const negatives=[
 ['unknown-owner','{{Auxiliar|fundo=#See_also}}'],
 ['unknown-field','{{Info/Sítio|outro=#See_also}}'],
 ['real-label','{{Info/Sítio|fundo=#ABC|nome=[[#See_also|seção]]}}'],
 ['unknown-palette','{{Info/Sítio|fundo=#{{RGBpol|Outro}}}}','#{{rgbpol|outro}}'],
 ['nested-unknown-owner','{{Auxiliar|{{Info/Sítio|fundo=#See_also}}}}'],
 ['own-wiki',"[https://pt.wikipedia.org/wiki/Exemplo/a'b#See_also Fonte]"],
 ['double-opening-bracket',"[[https://foreign.example/a'b#See_also]]"],
 ['incomplete-attribute',"<a href=\"[https://foreign.example/a'b#See_also Fonte]"],
 ['foreign-label',"[https://foreign.example/a'b#part [[#See_also|seção]]]"],
 ['foreign-dynamic-target',"[https://foreign.example/{{Auxiliar|#See_also}} Fonte]"]
];
let checks=0,calls=0;const rows=[];
for(const[id,source]of positives){const before=source,view=api.v2217HeadingFragmentView(source);calls++;assert(!view.includes('#'),id);assert.equal(source,before,id+' source remains exact');checks+=2;rows.push({id,expected:'literal-nonconsumer',sourceSha256:sha(source),viewSha256:sha(view)});}
for(const[id,source,needle='#see_also']of negatives){const before=source,view=api.v2217HeadingFragmentView(source);calls++;assert(view.includes(needle),id);assert.equal(source,before,id+' source remains exact');checks+=2;rows.push({id,expected:'consumer-or-unknown-owner-retained',sourceSha256:sha(source),viewSha256:sha(view)});}
const report={kind:'native-nonconsumer-role-boundaries',version:api.version,runtimeSha256:sha(fs.readFileSync(file)),checks,helperCalls:calls,calculateCalls:0,rows,networkRequests:0,wikipediaWrites:0};
if(args['--report'])fs.writeFileSync(args['--report'],JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({checks,helperCalls:calls,calculateCalls:0,runtimeSha256:report.runtimeSha256}));

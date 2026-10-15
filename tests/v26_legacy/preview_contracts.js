(function(api){
 'use strict';
 const rows=[];let checks=0;const ok=(v,m)=>{checks++;if(!v)throw new Error(m)};
 const eq=(a,b,m)=>{checks++;if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(m)};
 function test(name,fn){const start=checks;try{fn();rows.push({name,passed:true,checks:checks-start})}catch(e){rows.push({name,passed:false,checks:checks-start,error:e.message})}}
 const source='Uma excessão.\n{| class="wikitable"\n! Nome !! Cidade\n|-\n| Ana || Recife\n|-\n| 中文 || Belém',baseline=source+'\n|}',candidate=baseline.replace('excessão','exceção');
 const cfg={namespaceNumber:0,pageTitle:'Teste independente',authorityControl:false,endTemplateOrder:false,review:false};
 const table='<table class="wikitable"><tr><th>Nome</th><th>Cidade</th></tr><tr><td>Ana</td><td>Recife</td></tr><tr><td>中文</td><td>Belém</td></tr></table>';
 const original={text:'<div class="mw-parser-output"><p>Uma excessão.</p></div>',parsewarnings:[]};
 const canonical={text:'<div class="mw-parser-output"><p>Uma excessão.</p>'+table+'</div>',source:baseline,parsewarnings:[]};
 const after={text:'<div class="mw-parser-output"><p>Uma exceção.</p>'+table+'</div>',parsewarnings:[]};
 const decide=(b,a=after,old=original)=>api.syntaxPreviewDecision(old,b,a,DOMParser,source,candidate,cfg);
 test('exact independent missing-table syntax baseline',()=>eq(api.syntaxRepairPlan(source,cfg).text,baseline,'Exact known literal table closer'));
 test('canonical repair can reveal complete table',()=>{const d=decide(canonical);ok(d.checked&&d.accepted,'Correctly repaired source table is accepted');ok(d.syntaxBaselineChecked,'Strict intermediate rendering was actually checked')});
 for(const [name,changed] of [['missing cell',table.replace('<td>Ana</td>','<td></td>')],['changed cell',table.replace('<td>Ana</td>','<td>Bia</td>')],['Unicode cell loss',table.replace('<td>中文</td>','<td></td>')],['rows reversed',table.replace('<tr><td>Ana</td><td>Recife</td></tr><tr><td>中文</td><td>Belém</td></tr>','<tr><td>中文</td><td>Belém</td></tr><tr><td>Ana</td><td>Recife</td></tr>')]])
 test('repair does not exempt rendered '+name,()=>{const d=decide(canonical,{...after,text:after.text.replace(table,changed)});ok(!d.accepted&&d.introduced.length>0,'Rendered table conservation remains strict')});
 test('missing intermediate baseline rejected',()=>{const d=decide(null);ok(!d.accepted,'Cannot waive original table guard without exact baseline')});
 test('stale intermediate source rejected',()=>{const d=decide({...canonical,source:baseline+'\nFonte inventada.'});ok(!d.accepted,'Read-only baseline must match regenerated exact repair')});
 test('new visible error after repair rejected',()=>{const d=decide(canonical,{...after,text:after.text+'<span class="error">Falha nova</span>'});ok(!d.accepted,'Repair never exempts new errors')});
 test('same existing error gaining an occurrence rejected',()=>{const error='<span class="error">Falha repetida</span>';const d=decide({...canonical,text:canonical.text+error},{...after,text:after.text+error+error},{...original,text:original.text+error});ok(!d.accepted,'Error-count guard remains strict after valid repair')});
 return {cases:rows.length,checks,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,tests:rows,wikipediaWrites:0,networkRequests:0};
})(window.RevisaWiki)

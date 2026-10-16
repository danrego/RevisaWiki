'use strict';
const article=body=>"'''Exemplo técnico''' reúne dados.\n\n"+body+'\n{{Referências}}\n';
const table=(row,head='! scope="col" | Nome !! scope="col" | Valor',opening='class="wikitable sortable"')=>'{| '+opening+'\n'+head+'\n|-\n'+row+'\n|-\n| Gama || Delta\n|}\n';
const items=[
 ['opening-numeric-quote','tableOpeningSpanQuotes',table('| colspan=2" | Alfa'),table('| colspan="2" | Alfa')],
 ['missing-span-equals','tableSpanEquals',table('| colspan"2" | Alfa'),table('| colspan="2" | Alfa')],
 ['misspelled-span-key','tableSpanAttributeTypos',table('| colpsan="2" | Alfa'),table('| colspan="2" | Alfa')],
 ['equal-sort-attribute','tableDuplicateSortValues',table('| data-sort-value="2" data-sort-value="2" | Alfa || Beta'),table('| data-sort-value="2" | Alfa || Beta')],
 ['mixed-numeric-quotes','tableMixedSpanQuotes',table('| colspan="2” | Alfa'),table('| colspan="2" | Alfa')],
 ['misspelled-sort-value','tableSortAttributeTypos',table('| data-sort-vaule="2" | Alfa || Beta'),table('| data-sort-value="2" | Alfa || Beta')],
 ['misspelled-sort-mode','tableSortAttributeTypos',table('| Alfa || Beta','! scope="col" data-sort-tyep="number" | Nome !! scope="col" | Valor'),table('| Alfa || Beta','! scope="col" data-sort-type="number" | Nome !! scope="col" | Valor')]
].map(([id,rule,source,expected])=>({id,rule,source:article(source),expected:article(expected),count:1,positive:true}));
module.exports={article,table,items};

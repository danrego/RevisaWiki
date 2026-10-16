'use strict';
// Handwritten endpoint oracles. These expected strings are not obtained from
// the implementation under test or from its edit plans.
const items=[];
function add(id,feature,source,expected,extra={}){items.push({id,feature,source,expected,positive:source!==expected,...extra});}
const note='<ref group="nota">Nota literal, sem alteração.</ref>\n';
add('collector-group',1,note+'{{Referências|group=nota}}',note+'{{Referências|grupo=nota}}',{ui:true,count:1});
add('collector-group-whitespace',1,note+'{{Referências | group = nota }}',note+'{{Referências | grupo = nota }}');
for(const [id,call]of [
 ['native-already','{{Referências|grupo=nota}}'],['different-native-group','{{Referências|group=nota|grupo=outra}}'],
 ['empty-native-group','{{Referências|group=nota|grupo=}}'],['duplicate-foreign-group','{{Referências|group=nota|group=nota}}'],
 ['dynamic-group','{{Referências|group={{Grupo}}}}'],['empty-group','{{Referências|group=}}'],
 ['parameter-group','{{Referências|group={{{grupo}}}}}'],['unknown-collector','{{Lista de fontes desconhecida|group=nota}}']
])add('collector-decline-'+id,1,note+call,note+call);
const citation=(fields)=>'<ref>{{citar jornal|titulo=Fonte literal|url=https://example.test/fonte|'+fields+'}}</ref>\n{{Referências}}';
add('equal-publication-aliases',2,citation('jornal=Publicação X|obra=Publicação X'),citation('jornal=Publicação X'),{ui:true,count:1});
add('equal-publication-aliases-three',2,citation('jornal=Publicação X|obra=Publicação X|website=Publicação X'),citation('jornal=Publicação X'),{count:2});
add('equal-publication-aliases-outer-whitespace',2,citation('jornal=Publicação X|obra= Publicação X '),citation('jornal=Publicação X'));
add('equal-page-aliases',2,citation('página=12|pagina=12'),citation('página=12'));
for(const [id,fields]of [
 ['unequal-publications','jornal=Publicação X|obra=Publicação Y'],['empty-second-publication','jornal=Publicação X|obra='],
 ['empty-first-publication','jornal=|obra=Publicação X'],['nested-publications','jornal={{Publicação}}|obra={{Publicação}}'],
 ['comment-publications','jornal=Publicação<!--a-->|obra=Publicação<!--a-->'],
 ['different-identities','jornal=Publicação X|editora=Publicação X'],['case-differs','jornal=Publicação X|obra=publicação X'],
 ['extra-text','jornal=Publicação X|obra=Publicação X, suplemento'],
 ['different-url-case','urlarquivo=https://example.test/A|archive-url=https://example.test/a']
])add('citation-alias-decline-'+id,2,citation(fields),citation(fields));
const urlCitation=raw=>'<ref>{{citar web|titulo=Fonte literal|url='+raw+'}}</ref>\n{{Referências}}';
add('bare-url-brackets',3,urlCitation('[https://example.test/fonte]'),urlCitation('https://example.test/fonte'),{ui:true,count:1});
add('bare-http-url-brackets',3,urlCitation('[http://example.test/fonte?q=1&x=2#parte]'),urlCitation('http://example.test/fonte?q=1&x=2#parte'));
for(const [id,value]of [
 ['label','[https://example.test/fonte Fonte literal]'],['nested-brackets','[[https://example.test/fonte]]'],
 ['credentials','[https://credential:code@localhost/fonte]'],['comment','[https://example.test/fonte<!--nota-->]'],
 ['dynamic','[https://example.test/{{Nome}}]'],['unclosed','[https://example.test/fonte'],
 ['trailing-content','[https://example.test/fonte] suplemento'],['javascript','[javascript:alert(1)]'],
 ['newline','[https://example.test/fonte\n]'],['protocol-relative','[//example.test/fonte]'],
 ['ipv6-brackets','[https://[2001:db8::1]/fonte]']
])add('url-decline-'+id,3,urlCitation(value),urlCitation(value));
add('url-decline-duplicate-field',3,'<ref>{{citar web|titulo=Fonte|url=[https://example.test/a]|url=https://example.test/b}}</ref>\n{{Referências}}','<ref>{{citar web|titulo=Fonte|url=[https://example.test/a]|url=https://example.test/b}}</ref>\n{{Referências}}');
add('equal-renderer-attributes',4,note+'<references group="nota" group="nota"/>',note+'<references group="nota"/>',{ui:true,count:1});
add('equal-renderer-bank-attributes',4,'<ref group="nota" name="n"/>\n<references group="nota" group="nota"><ref name="n">Definição literal.</ref></references>','<ref group="nota" name="n"/>\n<references group="nota"><ref name="n">Definição literal.</ref></references>',{pipelineExpected:'<ref name="n" group="nota" />\n<references group="nota"><ref name="n">Definição literal.</ref></references>',count:2});
for(const [id,tag]of [
 ['unequal-group','<references group="nota" group="outra"/>'],['empty-group','<references group="nota" group=""/>'],
 ['dynamic-group','<references group="{{Grupo}}" group="{{Grupo}}"/>'],['unknown-attribute','<references group="nota" group="nota" data-extra="a"/>'],
 ['unclosed-quote','<references group="nota" group="nota/>'],['duplicate-non-renderer','<ref group="nota" group="nota">Outra nota.</ref>']
])add('renderer-attribute-decline-'+id,4,note+tag,note+tag);
const table=(body,attrs='class="wikitable"')=>'{| '+attrs+'\n'+body+'\n|}\n';
const numericBody='| A || B\n|-\n| {{formatnum:1200}} || C\n|-\n|-\n| D || E';
add('table-literal-formatnum',5,table(numericBody),table(numericBody.replace('|-\n|-','|-')),{ui:true,count:1});
for(const [id,call]of [['dynamic','{{formatnum:{{Valor}}}}'],['extra-argument','{{formatnum:1200|campo=valor}}'],['template-parameter','{{formatnum:{{{valor}}}}}'],['reference-argument','{{formatnum:<ref>Fonte.</ref>}}'],['arbitrary-template','{{Formato desconhecido|1200}}']]){
 const source=table(numericBody.replace('{{formatnum:1200}}',call));add('table-formatnum-decline-'+id,5,source,source);
}
const sortableBody='! data-sort-type="number" | Quantidade\n! Nome\n|-\n| data-sort-value="20" | vinte\n| Exemplo B\n|-\n|-\n| data-sort-value="3" | três\n| Exemplo A';
add('table-sort-attributes',6,table(sortableBody,'class="wikitable sortable"'),table(sortableBody.replace('|-\n|-','|-'),'class="wikitable sortable"'),{ui:true,count:1});
for(const [id,body]of [
 ['type-on-body',sortableBody.replace('data-sort-value="20"','data-sort-type="number"')],
 ['dynamic-sort-key',sortableBody.replace('data-sort-value="20"','data-sort-value="{{Chave}}"')],
 ['unknown-sort-attribute',sortableBody.replace('data-sort-value="20"','data-sort-unknown="20"')],
 ['duplicate-key-conflict',sortableBody.replace('data-sort-value="20"','data-sort-value="20" data-sort-value="3"')],
 ['unknown-sort-type',sortableBody.replace('data-sort-type="number"','data-sort-type="unconfirmed"')]
]){const source=table(body,'class="wikitable sortable"');add('table-sort-decline-'+id,6,source,source);}
add('table-mixed-colspan-quote',7,table('| colspan="2\' | Cabeçalho literal\n|-\n| A || B'),table('| colspan="2" | Cabeçalho literal\n|-\n| A || B'),{ui:true,count:1});
add('table-mixed-rowspan-quote',7,table('| rowspan=\'2" | A\n| B\n|-\n| C'),table('| rowspan=\'2\' | A\n| B\n|-\n| C'));
for(const [id,body]of [
 ['unequal-grid','| colspan="3\' | A\n|-\n| B || C'],['zero-span','| colspan="0\' | A\n|-\n| B || C'],
 ['negative-span','| colspan="-2\' | A\n|-\n| B || C'],['decimal-span','| colspan="2.0\' | A\n|-\n| B || C'],
 ['missing-separator','| colspan="2\' A\n|-\n| B || C'],['unclosed-extra-field','| colspan="2\' class="open | A\n|-\n| B || C'],
 ['nonnumeric-span','| colspan="dois\' | A\n|-\n| B || C'],['dynamic-span','| colspan="{{Dois}}\' | A\n|-\n| B || C']
]){const source=table(body);add('table-span-decline-'+id,7,source,source);}
const wide=table('| A || B\n|-\n| C || D','class="wikitable" style="width:1200px;"');
const wrapper=source=>'<div style="max-width:100%;min-width:0;overflow-x:auto;">\n'+source+'</div>\n';
add('table-wide-fixed-px',8,wide,wrapper(wide),{ui:true,count:1});
const wideSortable=table(sortableBody.replace('|-\n|-','|-'),'class="wikitable sortable" style="width:1200px;"');
add('table-wide-sortable',8,wideSortable,wrapper(wideSortable),{count:1,native:true});
for(const [id,source]of [
 ['small-width',wide.replace('1200px','300px')],['percent-width',wide.replace('1200px','100%')],['unconfirmed-em-unit',wide.replace('1200px','75em')],
 ['float',wide.replace('width:1200px;','width:1200px;float:right;')],['custom-class',wide.replace('class="wikitable"','class="wikitable local-layout"')],
 ['custom-id',wide.replace('class="wikitable"','id="local" class="wikitable"')],['nested-html','<div>\n'+wide+'</div>\n'],
 ['existing-wrapper',wrapper(wide)],['dynamic-width',wide.replace('1200px','{{Largura}}px')],
 ['important-width',wide.replace('1200px','1200px!important')],['position',wide.replace('width:1200px;','width:1200px;position:absolute;')],
 ['nested-wikitable',wide.replace('| C || D','| C\n{| class="wikitable"\n| Dentro\n|}\n| D')]
])add('wide-table-decline-'+id,8,source,source);
module.exports={items,table,wrapper};

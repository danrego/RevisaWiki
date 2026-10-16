'use strict';
// Exact endpoints are handwritten independently of the runtime edit plans.
const items=[];
function add(id,feature,source,expected,extra={}){items.push({id,feature,source,expected,positive:source!==expected,...extra});}
const table=(body,attrs='class="wikitable"')=>'{| '+attrs+'\n'+body+'\n|}\n';
const citation=(fields,name='Citar web')=>'{{'+name+'|titulo=Fonte literal|'+fields+'}}';
const ref=call=>'Texto.<ref>'+call+'</ref>\n{{Referências}}\n';
const credentialURL='https://'+['user',':','pass','@','example.test'].join('')+'/fonte';
const grid='| A || B\n|-\n| C || D';
const span=(attribute,value)=>table('| '+attribute+' | Cabeçalho\n|-\n| A || B').replace(attribute,attribute+value);
add('span-opening-quote',1,table('| colspan=2" | Cabeçalho\n|-\n| A || B'),table('| colspan="2" | Cabeçalho\n|-\n| A || B'),{ui:true,native:true,count:1});
add('span-opening-single-quote',1,table("| colspan=2' | Cabeçalho\n|-\n| A || B"),table("| colspan='2' | Cabeçalho\n|-\n| A || B"),{count:1});
add('span-missing-equals',2,table('| colspan"2" | Cabeçalho\n|-\n| A || B'),table('| colspan="2" | Cabeçalho\n|-\n| A || B'),{ui:true,native:true,count:1});
add('span-missing-equals-space',2,table("| colspan '2' | Cabeçalho\n|-\n| A || B"),table("| colspan ='2' | Cabeçalho\n|-\n| A || B"),{count:1});
add('span-finite-typo',3,table('| colpsan="2" | Cabeçalho\n|-\n| A || B'),table('| colspan="2" | Cabeçalho\n|-\n| A || B'),{ui:true,native:true,count:1});
for(const [wrong,right]of [['colpan','colspan'],['rowpan','rowspan'],['rowpsan','rowspan']]){
 const body=right==='colspan'?'| '+wrong+'="2" | Cabeçalho\n|-\n| A || B':'| '+wrong+'="2" | A\n| B\n|-\n| C';
 add('span-finite-typo-'+wrong,3,table(body),table(body.replace(wrong,right)),{count:1});
}
const sortable='! data-sort-type="number" | Quantidade\n! Nome\n|-\n| data-sort-value="20" | vinte\n| Item B\n|-\n| data-sort-value="3" | três\n| Item A';
add('sort-key-duplicate',4,table(sortable.replace('data-sort-value="20"','data-sort-value="20" data-sort-value="20"'),'class="wikitable sortable"'),table(sortable,'class="wikitable sortable"'),{ui:true,native:true,count:1});
add('sort-type-duplicate',4,table(sortable.replace('data-sort-type="number"','data-sort-type="number" data-sort-type="number"'),'class="wikitable sortable"'),table(sortable,'class="wikitable sortable"'),{native:true,sorter:true,count:1});
add('url-exact-outer-quotes',5,ref(citation('url="https://example.test/fonte?q=1&x=2#parte"')),ref(citation('url=https://example.test/fonte?q=1&x=2#parte')),{ui:true,native:true,count:1});
add('url-exact-outer-single-quotes',5,ref(citation("url='https://example.test/fonte'")),ref(citation('url=https://example.test/fonte')),{count:1});
add('identifier-unlabelled-link',6,ref(citation('url=https://example.test/fonte|arxiv=[https://arxiv.org/abs/2401.01234v2]','Citar revista')),ref(citation('url=https://example.test/fonte|arxiv=2401.01234v2','Citar revista')),{ui:true,native:true,count:1});
for(const [key,url,value]of [['pmid','https://pubmed.ncbi.nlm.nih.gov/12345678/','12345678'],['pmc','https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/','1234567'],['doi','https://doi.org/10.1000/182','10.1000/182']])add('identifier-unlabelled-'+key,6,ref(citation('url=https://example.test/fonte|'+key+'=['+url+']','Citar revista')),ref(citation('url=https://example.test/fonte|'+key+'='+value,'Citar revista')),{count:1});
add('localized-ref-name',7,'Texto.<ref nome="localizada">Fonte literal.</ref> Outra chamada.<ref name="localizada" />\n{{Referências}}\n','Texto.<ref name="localizada">Fonte literal.</ref> Outra chamada.<ref name="localizada" />\n{{Referências}}\n',{ui:true,native:true,count:1});
add('localized-ref-group',7,'Texto.<ref name="localizada" grupo="nota">Fonte literal.</ref> Outra chamada.<ref name="localizada" group="nota" />\n{{Referências|grupo=nota}}\n','Texto.<ref name="localizada" group="nota">Fonte literal.</ref> Outra chamada.<ref name="localizada" group="nota" />\n{{Referências|grupo=nota}}\n',{native:true,count:1});
const dangling='Texto.<ref>'+citation('url=https://example.test/fonte')+'\n\n{{Referências}}\n';
add('single-dangling-citation-ref',8,dangling,dangling.replace('}}\n\n{{Referências}}','}}</ref>\n\n{{Referências}}'),{ui:true,native:true,count:1});
add('nested-single-valid-isbn',9,ref(citation('isbn={{ISBN|978-0-306-40615-7}}','Citar livro')),ref(citation('isbn=978-0-306-40615-7','Citar livro')),{ui:true,native:true,count:1});
add('nested-single-valid-isbn10',9,ref(citation('isbn={{ISBN|0-306-40615-2}}','Citar livro')),ref(citation('isbn=0-306-40615-2','Citar livro')),{count:1});
add('typed-field-one-extra-equals',10,ref(citation('url==https://example.test/fonte')),ref(citation('url=https://example.test/fonte')),{ui:true,native:true,count:1});
add('typed-date-one-extra-equals',10,ref(citation('url=https://example.test/fonte|data==2020-01-02')),ref(citation('url=https://example.test/fonte|data=2020-01-02')),{count:1});
add('typed-doi-one-extra-equals',10,ref(citation('url=https://example.test/fonte|doi==10.1000/182','Citar revista')),ref(citation('url=https://example.test/fonte|doi=10.1000/182','Citar revista')),{count:1});
add('malformed-closing-ref',11,'Texto.<ref>'+citation('url=https://example.test/fonte')+'</ref/>\n{{Referências}}\n',ref(citation('url=https://example.test/fonte')),{ui:true,native:true,count:1});
add('span-mixed-straight-curly',12,table('| colspan="2” | Cabeçalho\n|-\n| A || B'),table('| colspan="2" | Cabeçalho\n|-\n| A || B'),{ui:true,native:true,count:1});
add('span-mixed-curly-straight',12,table('| colspan=“2" | Cabeçalho\n|-\n| A || B'),table('| colspan="2" | Cabeçalho\n|-\n| A || B'),{count:1});
add('sort-key-finite-typo',13,table(sortable.replace('data-sort-value="20"','data-sort-vaule="20"'),'class="wikitable sortable"'),table(sortable,'class="wikitable sortable"'),{ui:true,native:true,count:1,sorter:true});
add('sort-type-finite-typo',13,table(sortable.replace('data-sort-type="number"','data-sort-tyep="number"'),'class="wikitable sortable"'),table(sortable,'class="wikitable sortable"'),{count:1,sorter:true});
add('url-bounded-protocol-chain',14,ref(citation('url=https://https://https://example.test/fonte')),ref(citation('url=https://example.test/fonte')),{ui:true,native:true,count:1});
add('archive-bounded-protocol-chain',14,ref(citation('url=https://example.test/fonte|arquivo-url=https://https://https://example.test/arquivo|arquivo-data=2020-01-02')),ref(citation('url=https://example.test/fonte|arquivo-url=https://example.test/arquivo|arquivo-data=2020-01-02')),{count:1});

for(const feature of [1,2,3,12])for(const [id,body]of [
 ['zero','| colspan="0" | Cabeçalho\n|-\n| A || B'],['negative','| colspan="-2" | Cabeçalho\n|-\n| A || B'],['decimal','| colspan="2.0" | Cabeçalho\n|-\n| A || B'],['dynamic','| colspan="{{Dois}}" | Cabeçalho\n|-\n| A || B'],['unequal-grid','| colspan="3" | Cabeçalho\n|-\n| A || B'],['missing-separator','| colspan="2" Cabeçalho\n|-\n| A || B'],['unknown-other-attribute','| colspan="2" data-local="x" | Cabeçalho\n|-\n| A || B']
]){
 const broken=feature===1?body.replace('colspan="','colspan='):feature===2?body.replace('colspan=','colspan'):feature===3?body.replace('colspan','colpsan'):body.replace(/colspan="([^\"]+)"/,'colspan="$1”');const source=table(broken);add('decline-span-'+feature+'-'+id,feature,source,source);
}
for(const [id,body]of [['conflict',sortable.replace('data-sort-value="20"','data-sort-value="20" data-sort-value="3"')],['empty',sortable.replace('data-sort-value="20"','data-sort-value="20" data-sort-value=""')],['dynamic',sortable.replace('data-sort-value="20"','data-sort-value="{{Chave}}" data-sort-value="{{Chave}}"')],['unknown-attribute',sortable.replace('data-sort-value="20"','data-sort-value="20" data-sort-value="20" data-local="x"')]]){const source=table(body,'class="wikitable sortable"');add('decline-sort-duplicate-'+id,4,source,source);}
for(const [id,body]of [['different-types',sortable.replace('data-sort-type="number"','data-sort-type="number" data-sort-type="text"')],['empty-type',sortable.replace('data-sort-type="number"','data-sort-type="number" data-sort-type=""')],['unknown-types',sortable.replace('data-sort-type="number"','data-sort-type="custom" data-sort-type="custom"')],['type-on-data-cell',sortable.replace('data-sort-value="20"','data-sort-type="number" data-sort-type="number"')]]){const source=table(body,'class="wikitable sortable"');add('decline-sort-type-duplicate-'+id,4,source,source);}
for(const [id,value]of [['unpaired','"https://example.test/fonte'],['mismatch',"\"https://example.test/fonte'"],['label','"https://example.test/fonte Fonte"'],['credentials','"'+credentialURL+'"'],['fragment','"https://example.test/fonte" extra'],['dynamic','"https://example.test/{{Nome}}"'],['comment','"https://example.test/fonte<!--nota-->"'],['empty','""']]){const source=ref(citation('url='+value));add('decline-quoted-url-'+id,5,source,source);}
for(const [id,value]of [['label','[https://arxiv.org/abs/2401.01234v2 Artigo]'],['other-domain','[https://example.test/abs/2401.01234v2]'],['query','[https://arxiv.org/abs/2401.01234v2?download=1]'],['fragment','[https://arxiv.org/abs/2401.01234v2#parte]'],['invalid-month','[https://arxiv.org/abs/2413.01234v2]'],['dynamic','[https://arxiv.org/abs/{{Identificador}}]'],['unclosed','[https://arxiv.org/abs/2401.01234v2']]){const source=ref(citation('url=https://example.test/fonte|arxiv='+value,'Citar revista'));add('decline-identifier-'+id,6,source,source);}
for(const [id,source]of [
 ['no-native-call','<ref nome="f">Fonte.</ref>\n{{Referências}}'],
 ['conflicting-target','<ref nome="f">Fonte A.</ref><ref name="f">Fonte B.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['two-local-definitions','<ref nome="f">Fonte A.</ref><ref nome="f">Fonte B.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['native-and-local-key','<ref nome="f" name="f">Fonte.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['dynamic-name','<ref nome="{{Nome}}">Fonte.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['other-group','<ref nome="f" group="n">Fonte.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['unknown-attrs','<ref nome="f" class="x">Fonte.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['follow','<ref nome="f" follow="outro">Fonte.</ref> Texto.<ref name="f" />\n{{Referências}}'],
 ['helper-call','<ref nome="f">Fonte.</ref> {{R|f}}\n{{Referências}}'],
 ['wrong-collector','<ref name="f" grupo="n">Fonte.</ref> Texto.<ref name="f" group="n" />\n{{Referências|grupo=outra}}'],
 ['native-and-local-group','<ref name="f" grupo="n" group="n">Fonte.</ref> Texto.<ref name="f" group="n" />\n{{Referências|grupo=n}}']
])add('decline-localized-ref-'+id,7,source,source);
for(const [id,source]of [
 ['prose-after-citation',dangling.replace('}}\n\n{{Referências}}','}} Texto posterior.\n\n{{Referências}}')],
 ['prose-before-citation',dangling.replace('<ref>','<ref>Trecho citado. ')],
 ['second-citation',dangling.replace('\n\n{{Referências}}',citation('url=https://example.test/outra')+'\n\n{{Referências}}')],
 ['unknown-citation',dangling.replace('Citar web','Modelo desconhecido')],
 ['dynamic-citation',dangling.replace('Fonte literal','{{Título}}')],
 ['two-open-refs','Outra.<ref>'+dangling],
 ['group-mismatch',dangling.replace('<ref>','<ref group="n">')],
 ['collector-not-final',dangling+'Texto depois da lista.'],
 ['two-collectors',dangling.replace('{{Referências}}','{{Referências}}\n{{Referências}}')],
 ['bank-collector',dangling.replace('{{Referências}}','{{Referências|refs=<ref name="n">Outra fonte.</ref>}}')]
])add('decline-dangling-ref-'+id,8,source,source);
for(const [id,wrapped]of [['bad-checksum','{{ISBN|978-0-306-40615-8}}'],['two-values','{{ISBN|978-0-306-40615-7|0-306-40615-2}}'],['named-parameter','{{ISBN|isbn=978-0-306-40615-7}}'],['dynamic','{{ISBN|{{Número}}}}'],['prefix-prose','ISBN {{ISBN|978-0-306-40615-7}}'],['suffix-prose','{{ISBN|978-0-306-40615-7}} outro'],['comment','{{ISBN|978-0-306-40615-7<!--nota-->}}'],['wrong-template','{{Outro|978-0-306-40615-7}}']]){const source=ref(citation('isbn='+wrapped,'Citar livro'));add('decline-isbn-'+id,9,source,source);}
for(const [id,fields]of [['title','url=https://example.test/fonte|titulo==Texto'],['quote','url=https://example.test/fonte|citacao==Texto'],['two-extra','url===https://example.test/fonte'],['bad-date','url=https://example.test/fonte|data==2020-02-31'],['ambiguous-date','url=https://example.test/fonte|data==03/04/2020'],['plain-text','url==Texto'],['credential-url','url=='+credentialURL],['different-url-fields','url==https://example.test/fonte|URL=https://example.test/outra']]){const source=ref(citation(fields));add('decline-typed-equals-'+id,10,source,source);}
for(const [id,source]of [['no-opening','Texto.</ref/>\n{{Referências}}'],['nested','<ref>Uma.<ref>Outra.</ref/>\n{{Referências}}'],['second-bad-close',ref(citation('url=https://example.test/fonte')).replace('</ref>','</ref/></ref/>')],['attributed-close',ref(citation('url=https://example.test/fonte')).replace('</ref>','</ref name="f"/>')],['unknown-body','Texto.<ref>{{Modelo desconhecido}}</ref/>\n{{Referências}}'],['empty','Texto.<ref></ref/>\n{{Referências}}'],['typo-close','Texto.<ref>Fonte.</reff/>\n{{Referências}}']])add('decline-closing-ref-'+id,11,source,source);
for(const [id,body]of [['unknown-type',sortable.replace('data-sort-type="number"','data-sort-tyep="desconhecido"')],['type-on-body',sortable.replace('data-sort-value="20"','data-sort-tyep="number"')],['conflicting-key',sortable.replace('data-sort-value="20"','data-sort-vaule="20" data-sort-value="3"')],['two-typos',sortable.replaceAll('data-sort-value','data-sort-vaule')],['dynamic-key',sortable.replace('data-sort-value="20"','data-sort-vaule="{{Chave}}"')],['unknown-spelling',sortable.replace('data-sort-value="20"','data-sorting-value="20"')]]){const source=table(body,'class="wikitable sortable"');add('decline-sort-typo-'+id,13,source,source);}
for(const [id,value]of [['mixed','https://http://example.test/fonte'],['too-many','https://https://https://https://https://example.test/fonte'],['credentials','https://https://'+credentialURL],['encoded','https%3A%2F%2Fhttps://example.test/fonte'],['path-literal','https://example.test/https://https://arquivo'],['query-literal','https://example.test/?q=https://https://example.test/a'],['dynamic','https://https://https://{{Site}}/fonte']]){const source=ref(citation('url='+value));add('decline-protocol-chain-'+id,14,source,source);}

const representative=items.filter(item=>item.ui),withoutCollector=text=>text.replace(/\n\{\{Referências\}\}\n?$/,'');
const combined={source:representative.filter(item=>item.feature!==8).map(item=>withoutCollector(item.source)).join('\n\n')+'\n\n'+representative.find(item=>item.feature===8).source,expected:representative.filter(item=>item.feature!==8).map(item=>withoutCollector(item.expected)).join('\n\n')+'\n\n'+representative.find(item=>item.feature===8).expected,count:14};
module.exports={items,representative,combined,table,citation,ref,sortable,grid};

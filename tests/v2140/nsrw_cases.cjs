'use strict';
// Independently written native endpoints for one finite imported wrapper.
const chapter='Mason, George',work="The New Student's Reference Work";
const target=(label=chapter,short=false,prefix='')=>prefix+'{{Citar enciclopédia|título=[[s:en:'+work+'/'+chapter+'|'+label+']]|enciclopédia=[[s:en:'+work+'|'+work+']]|ano=1914'+(short?'':'|editor-nome=Chandler B.|editor-sobrenome=Beach|local=Chicago|editora=F. E. Compton and Co')+'}}';
const articlePrefix='Este artigo incorpora texto de uma publicação em [[domínio público]]: ',inlinePrefix='Uma ou mais das frases anteriores incorporam texto de uma publicação em [[domínio público]]: ';
const positives=[
 {id:'default',source:'{{Cite NSRW|wstitle=Mason, George}}',expected:target()},
 {id:'whitespace',source:'{{ Cite NSRW | wstitle = Mason, George }}',expected:target()},
 {id:'native-namespace',source:'{{Predefinição:Cite NSRW|wstitle=Mason, George}}',expected:target()},
 {id:'template-namespace',source:'{{Template:Cite NSRW|wstitle=Mason, George}}',expected:target()},
 {id:'lowercase-initial',source:'{{cite NSRW|wstitle=Mason, George}}',expected:target()},
 {id:'underscore',source:'{{Cite_NSRW|wstitle=Mason, George}}',expected:target()},
 {id:'display',source:'{{Cite NSRW|wstitle=Mason, George|display=Artigo do léxico}}',expected:target('Artigo do léxico')},
 {id:'short',source:'{{Cite NSRW|wstitle=Mason, George|short=yes}}',expected:target(chapter,true)},
 {id:'short-blank',source:'{{Cite NSRW|wstitle=Mason, George|short=}}',expected:target()},
 {id:'no-icon',source:'{{Cite NSRW|wstitle=Mason, George|no-icon=yes}}',expected:target()},
 {id:'noicon',source:'{{Cite NSRW|wstitle=Mason, George|noicon=1}}',expected:target()},
 {id:'verbatim-article',source:'{{Cite NSRW|wstitle=Mason, George|vb=yes}}',expected:target(chapter,false,articlePrefix),attribution:'article'},
 {id:'verbatim-inline',source:'{{Cite NSRW|wstitle=Mason, George|vb=yes|inline=yes}}',expected:target(chapter,false,inlinePrefix),attribution:'inline'},
 {id:'verbatim-short',source:'{{Cite NSRW|wstitle=Mason, George|vb=true|short=true}}',expected:target(chapter,true,articlePrefix),attribution:'article'},
 {id:'unused-inline',source:'{{Cite NSRW|wstitle=Mason, George|inline=yes}}',expected:target()},
 {id:'empty-verbatim',source:'{{Cite NSRW|wstitle=Mason, George|vb=|inline=yes}}',expected:target()},
 {id:'literal-newlines',source:'{{Cite NSRW\n|wstitle=Mason, George\n|display=Artigo do léxico\n|short=y\n}}',expected:target('Artigo do léxico',true)},
 {id:'native-ref',source:'<ref name="fonte">{{Cite NSRW|wstitle=Mason, George}}</ref>\n{{Referências}}',expected:'<ref name="fonte">'+target()+'</ref>\n{{Referências}}'},
];
const negatives=[
 '{{Cite NSRW}}','{{Cite NSRW|wstitle=}}','{{Cite NSRW|title=Mason, George}}','{{Cite NSRW|wstitle=Mason, George|title=Outro título}}',
 '{{Cite NSRW|wstitle=Mason, George|author=Autor literal}}','{{Cite NSRW|wstitle=Mason, George|year=1915}}','{{Cite NSRW|wstitle=Mason, George|volume=3}}',
 '{{Cite NSRW|wstitle=Mason, George|pages=10}}','{{Cite NSRW|wstitle=Mason, George|url=https://example.test/source}}','{{Cite NSRW|wstitle=Mason, George|ref=ID}}',
 '{{Cite NSRW|wstitle=Mason, George|wstitle=Mason, George}}','{{Cite NSRW|wstitle=Mason, George|display=}}','{{Cite NSRW|wstitle=Mason, George|no-icon=yes|noicon=yes}}',
 '{{Cite NSRW|wstitle=Mason, George|display=[[Outro|rótulo]]}}','{{Cite NSRW|wstitle={{Outro}}}}','{{Cite NSRW|wstitle={{{capítulo}}}}}',
 '{{Cite NSRW|wstitle=Mason, George|display=<span>Rótulo</span>}}','{{Cite NSRW|wstitle=Mason, George<!-- exemplo -->}}',
 '{{Cite NSRW|wstitle=Categoria:Outro}}','{{Cite NSRW|wstitle=../Outro}}','{{Cite NSRW|wstitle=/Outro}}','{{Cite NSRW|wstitle=Mason, George#Parte}}',
 '{{Cite NSRW|wstitle=Mason%2C George}}','{{Cite NSRW|wstitle=Mason\\George}}','{{Cite NSRW|wstitle=Mason, George|short=no}}',
 '{{Cite NSRW|wstitle=Mason, George|vb=false}}','{{Cite NSRW|wstitle=Mason, George|1=Outro}}','{{Cite NSRW|wstitle=Mason, George|Outro}}',
 '{{Cite NSRW|wstitle=Mason, George|_debug=yes}}','{{subst:Cite NSRW|wstitle=Mason, George}}','{{CITE NSRW|wstitle=Mason, George}}',
 "{{Cite NSRW|wstitle=Mason, George|display=''rótulo''}}",'{{Cite NSRW|wstitle=Mason, George|display=Primeira\nsegunda}}',
];
module.exports={positives,negatives,target};

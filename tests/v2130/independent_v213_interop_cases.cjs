'use strict';
// Handwritten endpoints. Counts are one model rename, each renamed field and
// each corrected value. Already accepted native names have no rename event.
const cases=[
 {id:'interop-en-quoted-url',feature:5,count:3,
  source:'Texto.<ref>{{cite web|title=Fonte literal|url="https://example.test/fonte"}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|título=Fonte literal|url=https://example.test/fonte}}</ref>\n{{Referências}}'},
 {id:'interop-en-official-identifier',feature:6,count:3,
  source:'Texto.<ref>{{cite journal|title=Fonte literal|url=https://example.test/fonte|arxiv=[https://arxiv.org/abs/2401.01234v2]}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar periódico|título=Fonte literal|url=https://example.test/fonte|arxiv=2401.01234v2}}</ref>\n{{Referências}}'},
 {id:'interop-en-nested-isbn',feature:9,count:4,
  source:'Texto.<ref>{{cite book|title=Fonte literal|author=Autor literal|url=https://example.test/fonte|isbn={{ISBN|978-0-306-40615-7}}}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar livro|título=Fonte literal|autor=Autor literal|url=https://example.test/fonte|isbn=978-0-306-40615-7}}</ref>\n{{Referências}}'},
 {id:'interop-en-typed-extra-equals',feature:10,count:4,
  source:'Texto.<ref>{{cite web|title=Fonte literal|url=https://example.test/fonte|date==2020-01-02}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|título=Fonte literal|url=https://example.test/fonte|data=2020-01-02}}</ref>\n{{Referências}}'},
 {id:'interop-en-bounded-protocol-chain',feature:14,count:3,
  source:'Texto.<ref>{{cite web|title=Fonte literal|url=https://https://https://example.test/fonte}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|título=Fonte literal|url=https://example.test/fonte}}</ref>\n{{Referências}}'},
 {id:'interop-fr-quoted-url',feature:5,count:4,
  source:'Texto.<ref>{{Lien web|titre=Fonte literal|auteur=Autor literal|url="https://example.test/fonte"}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|título=Fonte literal|autor=Autor literal|url=https://example.test/fonte}}</ref>\n{{Referências}}'},
 {id:'interop-es-nested-isbn',feature:9,count:2,
  source:'Texto.<ref>{{Cita libro|título=Fonte literal|autor=Autor literal|url=https://example.test/fonte|isbn={{ISBN|978-0-306-40615-7}}}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar livro|título=Fonte literal|autor=Autor literal|url=https://example.test/fonte|isbn=978-0-306-40615-7}}</ref>\n{{Referências}}'},
 {id:'interop-de-bounded-protocol-chain',feature:14,count:6,
  source:'Texto.<ref>{{Literatur|Titel=Fonte literal|Autor=Autor literal|Online=https://https://https://example.test/fonte|ISBN=978-0-306-40615-7}}</ref>\n{{Referências}}',
  legacyClean:'Texto.<ref>{{Literatur|Titel=Fonte literal|Autor=Autor literal|Online=https://example.test/fonte|ISBN=978-0-306-40615-7}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar livro|título=Fonte literal|autor=Autor literal|url=https://example.test/fonte|isbn=978-0-306-40615-7}}</ref>\n{{Referências}}'},
 {id:'interop-native-empty-field-and-quoted-url',feature:5,count:2,
  source:'Texto.<ref>{{Citar web|title=Fonte literal|url="https://example.test/fonte"|parametro_obsoleto=}}</ref>\n{{Referências}}',
  legacyClean:'Texto.<ref>{{Citar web|title=Fonte literal|url=https://example.test/fonte|parametro_obsoleto=}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|title=Fonte literal|url=https://example.test/fonte}}</ref>\n{{Referências}}'},
 {id:'interop-en-extra-equals-and-protocol-chain',feature:14,count:4,
  source:'Texto.<ref>{{cite web|title=Fonte literal|url==https://https://example.test/fonte}}</ref>\n{{Referências}}',
  legacyClean:'Texto.<ref>{{cite web|title=Fonte literal|url=https://example.test/fonte}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|título=Fonte literal|url=https://example.test/fonte}}</ref>\n{{Referências}}'}
];
const nativeControls=[
 {id:'interop-native-accepted-English-aliases',count:0,
  source:'Texto.<ref>{{Citar web|title=Fonte literal|author=Autor literal|url=https://example.test/fonte|access-date=2020-01-02}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{Citar web|title=Fonte literal|author=Autor literal|url=https://example.test/fonte|access-date=2020-01-02}}</ref>\n{{Referências}}'},
 {id:'interop-native-accepted-lowercase-model',count:0,
  source:'Texto.<ref>{{citar web|title=Fonte literal|author=Autor literal|url=https://example.test/fonte}}</ref>\n{{Referências}}',
  expected:'Texto.<ref>{{citar web|title=Fonte literal|author=Autor literal|url=https://example.test/fonte}}</ref>\n{{Referências}}'}
];
module.exports={cases,nativeControls};

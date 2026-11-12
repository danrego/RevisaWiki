/* Focused source-integrity regressions. No network requests or wiki edits. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const at=value.indexOf('=');return[value.slice(0,at),value.slice(at+1)];}));
const runtime=path.resolve(args['--module']||process.env.REVISAWIKI_CURRENT_CORE||path.join(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js')),api=require(runtime),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const fixtures=[
  {
    "id": "local-note-wikilink",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-:0-1|a nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "local-backref-wikilink",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_ref-:0_1-0|a chamada]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "percent-encoded-colon",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-%3A0-1|a nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "percent-encoded-lowercase",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-%3a0-1|a nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "percent-encoded-underscore",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite%5Fnote-:0-1|a nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "html-escaped-underscore",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja <a href=\"#cite&#95;note-:0-1\">a nota</a>.\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "html-escaped-colon",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja <a href=\"#cite_note-&#58;0-1\">a nota</a>.\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "html-single-quoted-href",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja <a href='#cite_note-:0-1'>a nota</a>.\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "html-unquoted-href",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja <a href=#cite_note-:0-1>a nota</a>.\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "raw-local-external-link",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [#cite_note-:0-1 a nota].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "explicit-current-title",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[Teste de referência#cite_note-:0-1|a nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "explicit-current-title-underscores",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[Teste_de_referência#cite_note-:0-1|a nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "samepage-full-canonical-url",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1 a nota].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "samepage-protocol-relative",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [//pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1 a nota].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "samepage-index-title-query",
    "source": "{{Descrição curta|Teste}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [https://pt.wikipedia.org/w/index.php?title=Teste_de_refer%C3%AAncia#cite_note-:0-1 a nota].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "unicode-name-with-html-fragment",
    "source": "Texto.<ref name=\"Exemplo português\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n<a href=\"#cite_note-Exemplo_portugu%C3%AAs-1\">nota</a>\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "anonymous-identical-dedup-shifts-later-note",
    "source": "A.<ref>Fonte igual</ref> B.<ref>Fonte igual</ref> C.<ref>Outra fonte</ref>\n\nVeja [[#cite_note-3|terceira nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "anonymous-reference-order-change",
    "source": "A.<ref>Primeira fonte</ref> B.<ref>Segunda fonte</ref>\n\nVeja [[#cite_note-1|primeira nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "named-adjacent-reuse-removal-backref",
    "source": "A.<ref name=\"x\">Fonte</ref> B.<ref name=\"x\" /><ref name=\"x\" />\n\nVeja [[#cite_ref-x_1-2|terceira chamada]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "named-numeric-identity",
    "source": "A.<ref name=\"123\">Fonte</ref>\n\nVeja [[#cite_note-123-1|nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "grouped-note",
    "source": "A.<ref group=\"note\" name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-:0-1|nota]].\n\n<references group=\"note\"/>\n",
    "protected": true
  },
  {
    "id": "grouped-lower-alpha",
    "source": "A.<ref group=\"lower-alpha\" name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-:0-1|nota]].\n\n<references group=\"lower-alpha\"/>\n",
    "protected": true
  },
  {
    "id": "grouped-xyz",
    "source": "A.<ref group=\"xyz\" name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[#cite_note-:0-1|nota]].\n\n<references group=\"xyz\"/>\n",
    "protected": true
  },
  {
    "id": "forward-definition-move-identity-stable",
    "source": "A.<ref name=\"x\" /> B.<ref name=\"x\">Fonte</ref>\n\nVeja [[#cite_note-x-1|nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "citation-key-localization-identity-stable",
    "source": "A.<ref name=\"x\">{{cite book|last=Exemplo|title=Obra|year=2020}}</ref>\n\nVeja [[#cite_note-x-1|nota]].\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "collector-format-identity-stable",
    "source": "A.<ref name=\"x\">Fonte</ref>\n\nVeja [[#cite_note-x-1|nota]].\n\n<references/>\n",
    "protected": true
  },
  {
    "id": "comment-only",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n<!-- [[#cite_note-:0-1|nota]] -->\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "nowiki-only",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n<nowiki>[[#cite_note-:0-1|nota]]</nowiki>\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "syntaxhighlight-only",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n<syntaxhighlight lang=\"wikitext\">[[#cite_note-:0-1|nota]]</syntaxhighlight>\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "preformatted-only",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n<pre>[[#cite_note-:0-1|nota]]</pre>\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "ordinary-prose-token",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nO identificador cite_note-:0-1 é apenas texto.\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "citation-title-token",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n<ref>{{Citar web|url=https://example.invalid|título=Texto cite_note-:0-1}}</ref>\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "offpage-wikilink",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n[[Outro artigo#cite_note-:0-1|nota em outro artigo]]\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "offsite-external-link",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n[https://example.invalid/page#cite_note-:0-1 outra página]\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "other-wiki-external-link",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n[https://en.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1 outra Wikipédia]\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "harvard-not-cite",
    "source": "Texto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\n[[#CITEREFExemplo2020|obra]]\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "bare-https",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "bare-http",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja http://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "protocol-relative",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja //pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "scheme-less-literal",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-https",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-no-scheme",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-protocol-relative",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|//pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-http-colon",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|http:pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-http-one-slash",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|http:/pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-entity-colon",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|http&#58;//pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "bare-encoded-prefix-i",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#c%69te_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "bare-encoded-prefix-t",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#ci%74e_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "bare-encoded-prefix-e",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cit%65_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "unknown-helper-consumer",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{Outro formato|destino=cite_note-:0-1}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "offsite-next-to-unknown",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [https://en.wikipedia.org/wiki/Elsewhere#cite_note-:0-1 outro] {{Outro formato|cite_note-:0-1}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "query-relative-href",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja <a href='?uselang=pt#cite_note-:0-1'>a nota</a>\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "same-wiki-other-title",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Possivel_redirecionamento#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "same-wiki-index-other-title",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/w/index.php?title=Possivel_redirecionamento#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "relative-title-wikilink",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[/Subpagina#cite_note-:0-1|nota]]\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "other-namespace-wikilink",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[Discussão:Teste#cite_note-:0-1|nota]]\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "interwiki-looking-uncertain",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[:en:Teste#cite_note-:0-1|nota]]\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-named-first",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|1=https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|2=a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "URL-named-scheme-less",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|1=pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|2=a nota}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "unknown-named-fragment",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{Auxiliar|alvo=#cite_note-:0-1}}\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "malformed-query-percent",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia?x=%ZZ#c%69te_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "foreign-label-local-helper",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[Outra página#cite_note-:0-1|{{Auxiliar|alvo=#cite_note-:0-1}}]]\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "foreign-label-local-url",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja [[Outra página#cite_note-:0-1|{{URL|https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia#cite_note-:0-1|a nota}}]]\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "encoded-path-delimiter-conservative",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://pt.wikipedia.org/wiki/Teste_de_refer%C3%AAncia%23cite_note-:0-1\n\n{{Referências}}\n",
    "protected": true
  },
  {
    "id": "bare-offsite",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja https://en.wikipedia.org/wiki/Elsewhere#cite_note-:0-1\n\n{{Referências}}\n",
    "protected": false
  },
  {
    "id": "URL-offsite-no-scheme",
    "source": "{{Descrição curta|Exemplo}}\nTexto.<ref name=\":0\">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>\n\nVeja {{URL|en.wikipedia.org/wiki/Elsewhere#cite_note-:0-1|outro}}\n\n{{Referências}}\n",
    "protected": false
  }
];
const options={...api.defaults,namespaceNumber:0,pageTitle:'Teste de referência',contentModel:'wikitext',sectionOnly:false,autoPreview:false,registryDoiCheck:false,minorAllToolChanges:true,minorBaseConfirmed:true,v216CalendarUTC:'2026-11-11'};
let checks=0,calculateCalls=0;const rows=[];
function check(value,message){assert(value,message);checks++;}
// This literal reader is independent of the new guard and never resolves HTML IDs.
function literalRefs(source){const out=[];let cursor=0;for(const match of source.matchAll(/<ref\b/gi)){if(match.index<cursor)continue;let at=match.index+match[0].length,quote=null;for(;at<source.length;at++){const char=source[at];if(quote){if(char===quote)quote=null;}else if(char==='"'||char==="'")quote=char;else if(char==='>')break;}assert(at<source.length,'Complete opening tag in fixture');const open=source.slice(match.index,at+1);let end=at+1;if(!/\/\s*>$/.test(open)){const close=/<\/ref\s*>/gi;close.lastIndex=end;assert(close.exec(source),'Complete closing tag in fixture');end=close.lastIndex;}out.push(source.slice(match.index,end));cursor=end;}return out;}
function emittingTemplates(source){const out=[],stack=[];for(let at=0;at<source.length-1;at++){const token=source.slice(at,at+2);if(token==='{{'){stack.push(at);at++;}else if(token==='}}'&&stack.length){const start=stack.pop(),raw=source.slice(start,at+2),head=raw.slice(2,-2).split('|')[0].trim().replace(/^(?:Predefinição|Template)\s*:\s*/i,'').toLowerCase();if(/^(?:r|refn|efn|nre|sfn|sfnp|sfnm|sfnmp|harvref|notetag|#tag\s*:\s*ref|referências|referencias|reflist|notas|notas e referências|notelist|notefoot|rodapénota)$/.test(head))out.push([start,raw]);at++;}}return out.sort((a,b)=>a[0]-b[0]).map(row=>row[1]);}
function producerSnapshot(source){return JSON.stringify([literalRefs(source),emittingTemplates(source)]);}
function run(source,cfg=options){calculateCalls++;const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});check(api.v219AutomaticResultSafety(source,result).accepted,'Accepted safe output');return result;}
// Visible Cite tokens in uncertain carriers conservatively retain identities.
// Detection alone never certifies that a literal renders an active native link.
for(const fixture of fixtures){check(!!api.v2217AuthoredCiteFragments(fixture.source,options).length===fixture.protected,fixture.id+': conservative literal scope');const result=run(fixture.source);if(fixture.protected)check(producerSnapshot(fixture.source)===producerSnapshot(result.text),fixture.id+': literal note producers unchanged');else if(literalRefs(fixture.source).some(raw=>raw.includes('name=":0"')))check(literalRefs(result.text).some(raw=>!raw.includes('name=":0"')&&raw.includes('name=')),fixture.id+': ordinary renaming remains available');if(fixture.source.includes('{{Descrição curta'))check(!result.text.includes('{{Descrição curta'),fixture.id+': unrelated removal retained');const retained=api.v211RetainedAdjustments(fixture.source,result.text,(result.changes||[]).map(row=>row.id),options);check(retained.exact===true&&Number.isSafeInteger(retained.count)&&retained.count>=0,fixture.id+': actual retained count');if(result.text===fixture.source)check(retained.count===0,fixture.id+': unchanged is zero');rows.push({id:fixture.id,sourceSha256:sha(fixture.source),outputSha256:sha(result.text),changed:result.text!==fixture.source,retainedAdjustments:retained.count});}
const nested='{{Descrição curta|Exemplo}}\n{{Info/Biografia|nome=Pessoa Exemplo|imagem=Exemplo.jpg|ocupação=Ator|notas=<ref name=":0">{{Citar livro|ultimo=Exemplo|titulo=Obra|ano=2020}}</ref>}}\n\nTexto, <ref name=":0"/> veja [[#cite_note-:0-1|a nota]].\n\n{{Referências}}\n';
for(const anchored of [false,true])for(const trial of [false,true]){const source=anchored?nested:nested.replace(' veja [[#cite_note-:0-1|a nota]].','');calculateCalls++;const result=api.calculate({kind:'adjust',source,originalSource:source,v2214Trial:trial,options});check(api.v219AutomaticResultSafety(source,result).accepted,'Nested biography accepted');check(result.text.includes('{{Info/Biografia\n'),'Nested biography layout retained');check(/\|ocupação\s*=\s*ator/.test(result.text),'Occupation normalization retained');check(!result.text.includes('{{Descrição curta'),'Independent short description removal retained');if(anchored)check(producerSnapshot(source)===producerSnapshot(result.text),'Nested reference owners unchanged');}
let helperCompatibilityChecks=0;
const optionalHelper=api.automaticMissingNoteCollector;
check(typeof optionalHelper==='function'&&optionalHelper.length===2,'The native helper keeps its optional third callback signature');helperCompatibilityChecks++;
const ordinary='Texto sem notas.';
check(optionalHelper(ordinary,options)===ordinary,'Omitted callback is valid on an unchanged ordinary source');helperCompatibilityChecks++;
check(optionalHelper(ordinary,options,undefined)===ordinary,'Explicit undefined callback has the native default');helperCompatibilityChecks++;
const noteSource='Texto.<ref group="nota">Nota sintética.</ref>\n\n{{Referências}}\n',noteCfg={...options,noteRendererProofSource:noteSource,noteRendererProofs:[{missing:true,group:'nota'}]},events=['before'];
const withCallback=optionalHelper(noteSource,noteCfg,function(id){check(arguments.length===1,'A callback receives exactly its original single argument');check(id==='missingNoteCollector','The callback rule ID stays exact');events.push('callback');});events.push('returned');
check(JSON.stringify(events)===JSON.stringify(['before','callback','returned']),'Callback executes once before the returned endpoint');helperCompatibilityChecks++;
check(withCallback.includes('{{Notas}}')&&withCallback.includes('{{Referências}}'),'The independently supported missing-note helper still executes without authored anchors');helperCompatibilityChecks++;
check(optionalHelper(noteSource,noteCfg)===withCallback&&optionalHelper(noteSource,noteCfg,undefined)===withCallback,'Omitted callbacks return the same successful note repair');helperCompatibilityChecks++;
const sentinel=new Error('Synthetic callback interruption');let captured=null;try{optionalHelper(noteSource,noteCfg,()=>{throw sentinel;});}catch(error){captured=error;}check(captured===sentinel,'The original callback exception propagates unchanged');helperCompatibilityChecks++;
for(const source of [fixtures[0].source,ordinary]){const cfg={...options,sectionOnly:source===ordinary};check(optionalHelper(source,cfg)===source,'Protected or ordinary unchanged helper tolerates omitted callback');helperCompatibilityChecks++;}
const baselinePath=args['--baseline']||process.env.REVISAWIKI_ANCHOR_BASELINE;let helperBaselineRuntimeSha256=null;
if(baselinePath){const baselineFile=path.resolve(baselinePath),previous=require(baselineFile).automaticMissingNoteCollector;helperBaselineRuntimeSha256=sha(fs.readFileSync(baselineFile));
 const observe=(fn,source,cfg,kind)=>{const calls=['before'];let text=null,error=null;try{text=kind==='omitted'?fn(source,cfg):kind==='undefined'?fn(source,cfg,undefined):fn(source,cfg,function(id){calls.push(['callback',id,arguments.length]);});calls.push('returned');}catch(e){error={name:e.name,message:e.message};calls.push('threw');}return{text,error,calls};};
 for(const source of [ordinary,noteSource])for(const kind of ['omitted','undefined','recorded']){const cfg=source===noteSource?noteCfg:options;assert.deepEqual(observe(optionalHelper,source,cfg,kind),observe(previous,source,cfg,kind),'Exact unchanged prior helper output/callback order '+kind);checks++;helperCompatibilityChecks++;}
 const sourceOnly=fn=>{try{return{value:fn(ordinary)};}catch(e){return{error:e.name};}};assert.deepEqual(sourceOnly(optionalHelper),sourceOnly(previous),'A single source argument keeps the existing required-options behavior');checks++;helperCompatibilityChecks++;
}
const identitySource=fixtures[0].source;for(const candidate of [identitySource.replace('name=":0"','name="changed"'),identitySource.replace('</ref>','</ref><ref>Added note</ref>')]){check(api.preservationAudit(identitySource,candidate,options).length>0,'Raw identity mutation fails preservation');check(!!api.safeComposition(identitySource,candidate,options),'Raw identity mutation fails composition');}
for(const source of [identitySource.replace('Veja [[#cite_note-:0-1|a nota]].',''), 'Texto.<ref>Fonte</ref> texto.<ref>Fonte</ref>\n{{Referências}}\n']){const cfg={...options,sectionOnly:true},result=run(source,cfg);check(producerSnapshot(source)===producerSnapshot(result.text),'Partial editor source preserves reference identities');}
const report={suite:'manual-cite-anchor-integrity',kind:'manual-cite-anchor-integrity-source-regression',version:api.version,runtimeFile:path.basename(runtime),runtimeSha256:sha(fs.readFileSync(runtime)),checks,calculateCalls,calculations:calculateCalls,helperCompatibilityChecks,helperBaselineRuntimeSha256,fixtureCount:fixtures.length,rows,nativeRenderedIDResolutionNotClaimed:true,networkRequests:0,wikipediaWrites:0};
const receipt=args['--report']||process.env.REVISAWIKI_TEST_RECEIPT;if(receipt)fs.writeFileSync(receipt,JSON.stringify(report,null,2)+String.fromCharCode(10),{flag:'wx'});
console.log(JSON.stringify({checks,calculateCalls,calculations:calculateCalls,fixtureCount:fixtures.length,runtimeSha256:report.runtimeSha256,networkRequests:0,wikipediaWrites:0}));

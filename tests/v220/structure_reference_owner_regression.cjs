'use strict';
// Raw tag ownership must veto orphan deletion even when editorial quotation
// masks hide an opening. All fixtures are fictitious and work without network.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const load=require('./citation_loader.cjs'),args=process.argv.slice(2),preview=args.includes('--allow-preview'),files=args.filter(a=>!a.startsWith('--'));
if(!files.length)throw new Error('Provide at least one built bundle path.');
const result={kind:'raw-reference-owner-regression',status:'passed',checks:0,cases:[],networkRequests:0,wikipediaWrites:0};
for(const file of files){const {api,preview:injected}=load(file,preview),cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false};
 const equal=(a,b)=>{result.checks++;assert.equal(a,b);};
 const check=(id,source,expected=source)=>{const plan=api.v220CitationPlan(source,cfg);equal(plan.text,expected);result.checks++;assert.ok(api.v220CitationPlanProof(source,expected,plan,cfg));equal(api.v220CitationPlan(expected,cfg).text,expected);result.checks++;assert.ok(!api.v220CitationPlanProof(source,expected+'x',plan,cfg));result.cases.push({id,bundle:path.basename(file),helperInjection:injected,status:'passed',sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),edits:plan.edits.length});};
 check('nested-guillemets-across-reference','Texto «palavras citadas.<ref>{{citar web|título=Texto do « caderno »|data=2024}}</ref>»');
 check('quoted-title-leading-unbalanced-quote','Texto "palavras".<ref>{{citar web|titulo="Texto citado sem aspas finais|data=2024}}</ref> Depois, "outro trecho".');
 check('translated-title-quotation','Texto: "frase encerrada"<ref>{{citar web|titulo=Fonte fictícia|titulotrad=Termo “citado” no título}}</ref> Mais texto com "aspas".');
 check('multiline-reference-table-cell','{| class="wikitable"\n| Cabeçalho\n|-\n| Texto.<ref>{{citar web|titulo=Fonte "citada"}}\nOutra explicação.{{citar web|titulo=Outra fonte}}</ref>\n|}');
 check('protected-opening-external-closer','<blockquote>Texto.<ref>Fonte</blockquote></ref>');
 check('quoted-opening-external-closer','"Texto.<ref>Fonte"</ref>');
 check('quoted-closer-external-ambiguous','Texto.<ref>Fonte com "</ref>" e continuação.</ref>');
 check('comment-opening-external-closer','<!-- exemplo: <ref> -->Texto.</ref>');
 check('literal-opening-external-closer','<nowiki><ref></nowiki>Texto.</ref>');
 check('attribute-uncertain-owner','Texto.<ref name="a" class="nota">Fonte.</ref></ref>');
 check('incomplete-attribute-quote','Texto.<ref name="a>Fonte.</ref>');
 check('joined-owner','Texto.<refname="a">Fonte.</ref>');
 check('joined-group-owner','Texto.<refgroup="nota">Fonte.</ref>');
 check('nested-raw-owner','Texto.<ref>A<ref>B</ref>C</ref>');
 check('isolated-closer-preserved','Texto sem abertura.</ref>\n{{Referências}}');
 check('adjacent-duplicate-closer','Texto.<ref>Fonte.</ref></ref>','Texto.<ref>Fonte.</ref>');
 check('spaced-duplicate-preserved','Texto.<ref>Fonte.</ref> \t</ref>');
 check('mixed-case-chain-preserved','Texto.<ref>Fonte.</ref></ref></REF>');
 check('adjacent-duplicate-closer-chain','Texto.<ref>Fonte.</ref></ref></ref>','Texto.<ref>Fonte.</ref>');
 check('editorial-isolated-closer','A etiqueta </ref> encerra uma referência.');
 check('nonadjacent-closer-preserved','Texto.<ref>Fonte.</ref> Outra frase.</ref>');
 check('newline-closer-preserved','Texto.<ref>Fonte.</ref>\n</ref>');
 check('empty-note-duplicate-preserved','Texto.<ref> </ref></ref>');
 check('dynamic-note-duplicate-preserved','Texto.<ref>{{Modelo incerto}}</ref></ref>');
 check('incomplete-enclosing-template-preserved','{{Modelo incerto|texto=<ref>Fonte literal.</ref></ref>');
 check('complete-enclosing-template-preserved','{{Modelo incerto|texto=<ref>Fonte literal.</ref></ref>}}');
 check('incomplete-single-quoted-html-preserved',"<span title='<ref>Fonte literal.</ref></ref>");
 check('incomplete-unquoted-html-preserved','<span data-raw=<ref>Fonte literal.</ref></ref>');
 check('incomplete-other-html-preserved',"<section title='<ref>Fonte literal.</ref></ref>");
 check('incomplete-triple-template-preserved','{{{texto|<ref>Fonte literal.</ref></ref>');
 check('isolated-after-complete-reference','Texto.<ref>Fonte.</ref> Outro trecho.</ref>');
 check('isolated-before-uncertainty','Texto.</ref> Depois, "<ref>"');
 check('native-extension-opening-inside-html-attribute','<span title="<ref>">Texto.</span></ref>');
 check('native-named-extension-opening-inside-html-attribute',"<span title=\"<ref name='a'>\">Texto.</span></ref>");
 check('native-single-quoted-attribute-opening','<span title=\'prefixo <ref name="a">\'>Texto.</span></ref>');
 check('extension-closing-inside-attribute-preserved','Texto.<ref>Fonte.<span title="</ref>">Continua.</span></ref>');
 check('escaped-attribute-does-not-prove-duplicate','<span title="&lt;ref&gt;">Texto.</span></ref>');
 check('double-opening-still-repaired','Texto.<ref name="a" <ref>Fonte.</ref>','Texto.<ref name="a">Fonte.</ref>');
 for(const [open,close]of [['«','»'],['“','”'],['"','"']])for(const tag of ['ref','REF'])for(const ending of ['</ref>','</REF >']){
  const source='Texto '+open+'passagem.<'+tag+'>{{citar web|titulo=Fonte '+open+'citada'+close+'}}</'+tag+'>'+close+' Mais texto.';
  check('paired-quotes-'+result.cases.length,source);
  const unbalanced='Texto '+open+'passagem.<'+tag+'>Fonte'+close+ending;
  check('crossing-quotes-'+result.cases.length,unbalanced);
 }
 for(const ending of ['</ref>','</REF>','</ref >','</ ref>'])check('isolated-closer-'+ending,'Texto.'+ending);
 if(!injected)for(const [id,body,expected=body]of [
  ['native-plain-attribute','<span title="<ref>">Texto.</span></ref>'],
  ['native-named-attribute',`<span title="<ref name='a'>">Texto.</span></ref>`],
  ['native-single-quoted-attribute',`<span title='prefixo <ref name="a">'>Texto.</span></ref>`],
  ['native-malformed-html','<span title="<ref>Texto.</span></ref>'],
  ['isolated-closer','Texto.</ref>'],
  ['adjacent-duplicate','Texto.<ref>Fonte.</ref></ref>','Texto.<ref>Fonte.</ref>']
 ]){
  const source=body+'\n\n{{Referências}}\n',endpoint=expected+'\n\n{{Referências}}\n',out=api.calculate({kind:'adjust',source,options:cfg});equal(out.text,endpoint);equal(out.localCompositionSafety?.accepted!==false,true);equal(api.calculate({kind:'adjust',source:out.text,options:cfg}).text,out.text);result.cases.push({id:'whole-'+id,bundle:path.basename(file),helperInjection:false,status:'passed',sourceSha256:crypto.createHash('sha256').update(source).digest('hex')});
 }
}
process.stdout.write(JSON.stringify(result,null,2)+'\n');

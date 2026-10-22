"""Build a copy-paste index from verified current-release files."""
from pathlib import Path
import argparse
import html
import json
import shutil
from urllib.parse import urlencode

from v220_delivery import (
    ROOT, VERSION, STEM, DIST, DOCS, INSTALL_FILES, REQUIRED_DOCS,
    checked_manifest, checked_qa, checked_text, pin, sha, write_json,
)


def card_rows():
    update = f'Resumo_atualizacao_RevisaWiki_{STEM}.txt'
    return [
        ('dados', '1. Dados', f'RevisaWiki_{STEM}_dados.js',
         'Usuário:Daniel G Rego/RevisaWiki/Dados.js', update,
         'Copie o arquivo inteiro. Os dados e o programa precisam ser da mesma versão.', 'principal'),
        ('programa', '2. Programa', f'RevisaWiki_{STEM}.js',
         'Usuário:Daniel G Rego/RevisaWiki.js', update,
         'Substitua o núcleo inteiro. Use este arquivo separado dos dados.', 'principal'),
        ('central', '3. Carregador central', f'Carregador_comunitario_RevisaWiki_{STEM}.js',
         'Usuário:Daniel G Rego/RevisaWiki/Carregador.js', update,
         'Atualize depois dos dados e do programa. O common.js mantém a chamada fixa.', 'principal'),
        ('documentacao', '4. Documentação', f'Documentacao_RevisaWiki_{STEM}.wiki',
         'Usuário:Daniel G Rego/RevisaWiki', f'Resumo_documentacao_RevisaWiki_{STEM}.txt',
         'Copie o manual completo, com os recursos, a instalação e o histórico de versões.', 'principal'),
        ('chamada', 'Chamada compartilhada', 'Chamada_fixa_RevisaWiki_common.js',
         'Especial:Minha página/common.js', update,
         'Somente na primeira instalação, ou ao substituir um carregador antigo inteiro. Preserve os outros scripts e mantenha uma única chamada.', 'primeira'),
        ('central-propria', 'Carregador da cópia própria', f'Carregador_common_js_RevisaWiki_{STEM}.js',
         'Especial:Minha página/RevisaWiki/Carregador.js', update,
         'Use apenas se mantém os arquivos na sua conta. Antes deste cartão, copie dados e programa para as suas páginas correspondentes.', 'propria'),
        ('chamada-propria', 'Chamada da cópia própria', 'Chamada_fixa_RevisaWiki_copia_propria.js',
         'Especial:Minha página/common.js', update,
         'Somente na primeira instalação da cópia própria. Não a combine com a chamada compartilhada.', 'propria'),
    ]


def build_index(output, manifest_path=None, qa_path=None, preview=False):
    output = output.resolve()
    if preview and output == DIST.resolve():
        raise ValueError('A preview must use a separate output directory')
    manifest = checked_manifest(manifest_path)
    qa = None if preview else checked_qa(manifest, qa_path)
    output.mkdir(parents=True, exist_ok=True)
    payloads, cards = {}, {'principal': [], 'primeira': [], 'propria': []}
    source_pins = {}
    for ident, title, filename, destination, summary_file, note, group in card_rows():
        origin = DIST / filename if filename in manifest['files'] else DOCS / filename
        raw = origin.read_bytes()
        text = checked_text(origin)
        summary = checked_text(DOCS / summary_file).strip()
        if filename.endswith('.js') and len(raw) >= 2_097_152:
            raise ValueError('A paste card exceeds the wiki page-size limit')
        if origin.resolve() != (output / filename).resolve():
            shutil.copyfile(origin, output / filename)
        payloads[ident] = dict(text=text, filename=filename, destination=destination,
                               summary=summary, sha256=sha(raw), bytes=len(raw))
        source_pins[filename] = pin(origin)
        edit = 'https://pt.wikipedia.org/w/index.php?' + urlencode(dict(title=destination, action='edit'))
        raw_url = 'https://pt.wikipedia.org/w/index.php?' + urlencode(dict(
            title=destination, action='raw', ctype='text/javascript' if filename.endswith('.js') else 'text/plain'))
        formatted_bytes = format(len(raw), ',').replace(',', '.')
        cards[group].append(f'''<article class="card" id="{ident}">
<div class="card-heading"><h3>{html.escape(title)}</h3><span>{formatted_bytes} bytes</span></div>
<p class="destination">{html.escape(destination)}</p><p>{html.escape(note)}</p>
<div class="buttons"><button class="primary" data-copy="text" data-id="{ident}">Copiar conteúdo</button><button data-copy="summary" data-id="{ident}">Copiar resumo</button><button data-copy="destination" data-id="{ident}">Copiar destino</button></div>
<div class="links"><button class="text-button" data-view="{ident}">Ver conteúdo</button><a href="{html.escape(filename)}" download>Baixar arquivo</a><a href="{html.escape(edit)}" target="_blank" rel="noopener noreferrer">Abrir edição ↗</a><a href="{html.escape(raw_url)}" target="_blank" rel="noopener noreferrer">Ver código bruto ↗</a></div></article>''')
    copied = set(payload['filename'] for payload in payloads.values())
    for name in REQUIRED_DOCS:
        origin = DOCS / name
        checked_text(origin)
        if origin.resolve() != (output / name).resolve():
            shutil.copyfile(origin, output / name)
        copied.add(name)
        source_pins[name] = pin(origin)
    # The complete engine is downloadable, never a wiki paste payload.
    complete = f'RevisaWiki_{STEM}_completo.js'
    if (DIST / complete).resolve() != (output / complete).resolve():
        shutil.copyfile(DIST / complete, output / complete)
    source_pins[complete] = pin(DIST / complete)
    packed = json.dumps(payloads, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    banner = '<p class="preview">Prévia local do índice. A validação final desta distribuição ainda não foi concluída.</p>' if preview else ''
    page = TEMPLATE.replace('@@VERSION@@', VERSION).replace('@@STEM@@', STEM)
    page = page.replace('@@BANNER@@', banner).replace('@@PRINCIPAL@@', '\n'.join(cards['principal']))
    page = page.replace('@@PRIMEIRA@@', '\n'.join(cards['primeira'])).replace('@@PROPRIA@@', '\n'.join(cards['propria']))
    page = page.replace('@@PAYLOADS@@', packed)
    if any(token in page for token in ('@@VERSION@@', '@@STEM@@', '@@BANNER@@', '@@PRINCIPAL@@', '@@PRIMEIRA@@', '@@PROPRIA@@', '@@PAYLOADS@@')):
        raise ValueError('An index placeholder was not filled')
    (output / 'INICIO.html').write_text(page, encoding='utf-8')
    metadata = {
        'version': VERSION, 'distributionRevision': VERSION,
        'status': 'local-preview' if preview else 'release-validated',
        'wikipediaWriteActions': 0, 'automaticWikiInstallation': False,
        'commonJsFixedCallChanged': False, 'wikiPageLimitBytes': 2_097_152,
        'installParts': {name: manifest['files'][name] for name in INSTALL_FILES},
        'completeBundle': {'file': complete, **manifest['files'][complete], 'offlineOnly': True, 'wikiPasteCard': False},
        'runtimeFiles': manifest['files'], 'deliverySources': source_pins,
        'items': [{k: v for k, v in item.items() if k != 'text'} for item in payloads.values()],
        'indexSha256': pin(output / 'INICIO.html')['sha256'],
    }
    if qa is not None:
        qa_file = qa_path or ROOT / 'tests/evidence/2.20.0/QA_SUMMARY.json'
        metadata['qaSummarySha256'] = pin(qa_file)['sha256']
    write_json(output / 'MANIFESTO.json', metadata)
    return {'version': VERSION, 'status': metadata['status'], 'cards': len(payloads),
            'copyButtons': len(payloads) * 3, 'htmlBytes': len(page.encode('utf-8')),
            'runtimeChanged': False, 'wikipediaWrites': 0}


TEMPLATE = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>RevisaWiki @@VERSION@@ · Instalação e arquivos</title>
<style>
:root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#213d35;background:#f3f8f5;color-scheme:light}*{box-sizing:border-box}body{margin:0;padding:28px 18px 48px}main{max-width:1040px;margin:auto}h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.4rem 0 .7rem;line-height:1.2}h2{font-size:1.35rem;margin:0 0 .8rem}h3{font-size:1.12rem;margin:0}p{line-height:1.6;margin:.7rem 0}.badge{display:inline-block;padding:6px 11px;border-radius:99px;background:#dceee4;font-size:.85rem;font-weight:650}.intro{max-width:790px}.notice,.preview{padding:15px 18px;border-left:4px solid #246c50;background:white;border-radius:8px;margin:20px 0}.preview{border-color:#9b6a1a;background:#fff4da}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{background:white;border:1px solid #cbded2;border-radius:14px;padding:21px;min-width:0}.card-heading{display:flex;justify-content:space-between;gap:10px;align-items:baseline}.card-heading span{font-size:.75rem;color:#526d60;white-space:nowrap}.destination{font-size:.87rem;color:#456655;overflow-wrap:anywhere}.buttons{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 12px}button{font:inherit;cursor:pointer;background:#f4f9f6;color:#244d3c;border:1px solid #afc9ba;border-radius:8px;padding:10px 12px;font-size:.87rem;min-height:42px}button.primary{background:#246c50;color:white;border-color:#246c50;font-weight:650}button:hover{filter:brightness(.96)}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #d89933;outline-offset:3px}.links{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;font-size:.9rem}a{color:#246c50;text-underline-offset:3px;overflow-wrap:anywhere}.text-button{border:0;background:none;padding:0;text-decoration:underline;text-underline-offset:3px;min-height:30px}.extras{margin-top:28px;padding-top:22px;border-top:1px solid #cbded2}.extras details{margin:14px 0}.extras summary{font-weight:650;cursor:pointer;padding:8px 0}.status{min-height:1.5rem;color:#276447;font-weight:600;margin:12px 0}dialog{width:min(960px,95vw);max-height:92vh;border:1px solid #b4cdbf;border-radius:14px;padding:22px;background:#fff;color:#213d35}dialog::backdrop{background:#132c2270}.dialog-head{display:flex;justify-content:space-between;align-items:center;gap:12px}textarea{display:block;width:100%;height:58vh;resize:vertical;margin:16px 0;padding:14px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;border:1px solid #b7cec0;border-radius:8px;white-space:pre;tab-size:4}small{color:#526d60}nav{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0}.download-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.offline{padding:14px;border:1px solid #d6cdb1;border-radius:8px;background:#fffbed}.offline strong{display:block}@media(max-width:700px){.grid,.download-list{grid-template-columns:1fr}body{padding:20px 12px}.card{padding:18px}.card-heading{flex-wrap:wrap}.dialog-head{align-items:flex-start}dialog{padding:16px}}
</style></head><body><main>
<span class="badge">RevisaWiki @@VERSION@@</span><h1>Instalação e arquivos</h1>
<p class="intro">Copie os arquivos completos, confira o destino e mantenha o programa atualizado. A demonstração permite experimentar correções sem abrir um artigo ou acessar uma conta.</p>
@@BANNER@@
<nav aria-label="Nesta página"><a href="#atualizar">Atualizar</a><a href="#primeira">Primeira instalação</a><a href="#propria">Cópia própria</a><a href="#downloads">Downloads</a><a href="Demonstracao_RevisaWiki_@@STEM@@.html">Experimentar</a></nav>
<div class="notice"><p>Siga os quatro cartões na ordem: dados, programa, carregador central e documentação. Se já usa a chamada fixa, mantenha seu <strong>common.js</strong> como está. O índice não salva nenhuma página.</p></div>
<p class="status" id="status" role="status" aria-live="polite"></p>
<section id="atualizar" aria-labelledby="atualizar-titulo"><h2 id="atualizar-titulo">Atualizar a distribuição compartilhada</h2><div class="grid">@@PRINCIPAL@@</div></section>
<section id="primeira" class="extras" aria-labelledby="primeira-titulo"><h2 id="primeira-titulo">Primeira instalação</h2><p>Quem usa a distribuição compartilhada precisa apenas da chamada curta no common.js. Os quatro cartões acima são destinados à atualização das páginas centrais do programa.</p>@@PRIMEIRA@@</section>
<section id="propria" class="extras" aria-labelledby="propria-titulo"><h2 id="propria-titulo">Cópia própria</h2><p>Se mantém seus próprios arquivos, copie os dados e o programa para a sua conta e use os dois cartões abaixo. Escolha uma instalação e preserve os outros scripts do common.js.</p><div class="grid">@@PROPRIA@@</div></section>
<section class="extras"><h2>Experimente antes</h2><p>Escolha exemplos de correções e de trechos que devem ficar intactos. O motor da demonstração é o mesmo desta distribuição. Os exemplos são fixos e funcionam offline, sem as consultas de confirmação usadas em alguns artigos reais.</p><div class="links"><a href="Demonstracao_RevisaWiki_@@STEM@@.html">Abrir demonstração</a><a href="Demonstracao_RevisaWiki_@@STEM@@.html" download>Baixar demonstração</a></div></section>
<section id="downloads" class="extras"><h2>Downloads e documentação</h2><div class="download-list"><p><a href="RevisaWiki_@@VERSION@@.zip" download>Baixar o pacote completo (.zip)</a><br><small>Programa, dados, carregadores, manual, índice e demonstração.</small></p><div class="offline"><strong>Motor completo: somente para uso local</strong><a href="RevisaWiki_@@STEM@@_completo.js" download>Baixar o motor reunido (.js)</a><p>Esse arquivo ultrapassa 2 MiB. Não o cole numa página .js da Wikipédia. A instalação usa os arquivos separados de dados e programa.</p></div></div><div class="links"><a href="Instalacao_RevisaWiki_@@STEM@@.txt">Instalação completa</a><a href="Documentacao_RevisaWiki_@@STEM@@.wiki">Manual em wikitexto</a><a href="Funcionalidades_RevisaWiki_2_20.md">Recursos e limites</a><a href="Notas_da_versao_RevisaWiki_@@STEM@@.txt">Notas da versão</a><a href="Relatorio_testes_RevisaWiki_@@STEM@@.txt">Relatório de testes</a><a href="Referencia_tecnica_RevisaWiki_@@STEM@@.txt">Referência técnica</a><a href="ARQUIVOS.json">Hashes dos arquivos</a><a href="https://github.com/danrego/RevisaWiki" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div>
<details><summary>Conferir versão e recarregar</summary><p>O painel deve mostrar <strong>PTwiki @@VERSION@@</strong>. No Firefox e no Chrome para Mac, use Command + Shift + R. No Safari, use Option + Command + R. Os arquivos de programa, dados e carregador precisam declarar a mesma versão.</p></details>
<details><summary>Aviso de tamanho ao exibir o código</summary><p>O aviso que cita 102400 bytes pode vir do realce de sintaxe usado para exibir arquivos grandes. O link <strong>Ver código bruto</strong> permite conferir o conteúdo sem esse realce. Um erro de sintaxe ou uma recusa ao salvar deve ser investigado separadamente do limite de 2 MiB por página.</p></details></section>
</main>
<dialog id="viewer"><div class="dialog-head"><h2 id="viewer-title">Conteúdo</h2><button id="close-viewer">Fechar</button></div><p id="viewer-help">Selecione o texto para copiar manualmente.</p><textarea id="viewer-text" readonly spellcheck="false" aria-labelledby="viewer-title"></textarea><button id="select-text">Selecionar tudo</button></dialog>
<script type="application/json" id="payloads">@@PAYLOADS@@</script>
<script>
'use strict';
const payloads=JSON.parse(document.getElementById('payloads').textContent);
const viewer=document.getElementById('viewer'),area=document.getElementById('viewer-text'),status=document.getElementById('status');
function showText(text,title,manual){area.value=text;document.getElementById('viewer-title').textContent=title;document.getElementById('viewer-help').textContent=manual?'A cópia automática não ficou disponível. Com o texto selecionado, use Command + C no Mac ou Control + C.':'Para copiar manualmente, selecione o texto e use Command + A e Command + C no Mac.';if(!viewer.open)viewer.showModal();area.focus();if(manual)area.select();}
async function copyText(text,title){try{if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('clipboard-unavailable');await navigator.clipboard.writeText(text);status.textContent=title+' copiado.';return true;}catch(error){const field=document.createElement('textarea');field.value=text;field.setAttribute('aria-hidden','true');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(field);field.focus();field.select();let done=false;try{done=document.execCommand('copy');}catch(ignored){}field.remove();if(done){status.textContent=title+' copiado.';return true;}showText(text,title,true);status.textContent='Texto pronto para copiar manualmente.';return false;}}
document.addEventListener('click',async event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.copy){const item=payloads[button.dataset.id],kind=button.dataset.copy;const title=kind==='text'?item.filename:kind==='summary'?'Resumo da edição':'Destino';button.disabled=true;try{await copyText(item[kind],title);}finally{button.disabled=false;}}else if(button.dataset.view){const item=payloads[button.dataset.view];showText(item.text,item.filename,false);}});
document.getElementById('close-viewer').addEventListener('click',()=>viewer.close());
document.getElementById('select-text').addEventListener('click',()=>{area.focus();area.select();});
</script></body></html>
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=DIST)
    parser.add_argument('--manifest', type=Path)
    parser.add_argument('--qa', type=Path)
    parser.add_argument('--preview', action='store_true')
    args = parser.parse_args()
    print(json.dumps(build_index(args.output, args.manifest, args.qa, args.preview), ensure_ascii=False))


if __name__ == '__main__':
    main()

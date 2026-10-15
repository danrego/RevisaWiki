"""Build a local copy index from verified release bytes, without changing the release."""
from pathlib import Path
import hashlib, html, json, re, shutil
from urllib.parse import urlencode

HERE = Path(__file__).resolve()
PORTABLE = HERE.parent.name == 'scripts'
ROOT = HERE.parents[1] if PORTABLE else HERE.parents[2]
SOURCE = ROOT / 'dist/2.5.0' if PORTABLE else ROOT / 'outputs/revisawiki_v2_5'
OUT = SOURCE if PORTABLE else ROOT / 'outputs/revisawiki_v2_5_indice'
OUT.mkdir(parents=True, exist_ok=True)
freeze_path = ROOT / 'tests/expected_release.json' if PORTABLE else ROOT / 'work/revisawiki_v2_5/final_test_freeze.json'
freeze = json.loads(freeze_path.read_text())

def copy_if_different(filename):
    origin, destination = SOURCE / filename, OUT / filename
    if origin.resolve() != destination.resolve():
        shutil.copy2(origin, destination)
for filename, proof in freeze['files'].items():
    raw=(SOURCE / filename).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == proof['sha256'] and len(raw)==proof['bytes']
assert freeze['version']=='2.5.0'
for filename in ['RevisaWiki_v2_5.js','RevisaWiki_v2_5_dados.js']:
    assert (SOURCE/filename).stat().st_size<2097152
complete_exceeds_limit=(SOURCE/'RevisaWiki_v2_5_completo.js').stat().st_size>2097152

rows = [
    ('dados', '1. Dados', 'RevisaWiki_v2_5_dados.js', 'Usuário:Daniel G Rego/RevisaWiki/Dados.js', 'Resumo_atualizacao_RevisaWiki_v2_5.txt', 'Copie todo o arquivo para a página de dados.'),
    ('programa', '2. Programa', 'RevisaWiki_v2_5.js', 'Usuário:Daniel G Rego/RevisaWiki.js', 'Resumo_atualizacao_RevisaWiki_v2_5.txt', 'Copie todo o núcleo para a página do programa.'),
    ('carregador', '3. Seu carregador', 'Carregador_common_js_RevisaWiki_v2_5.js', 'Usuário:Daniel G Rego/common.js', 'Resumo_atualizacao_RevisaWiki_v2_5.txt', 'No common.js, substitua apenas o carregador antigo do RevisaWiki. Preserve seus outros scripts.'),
    ('documentacao', '4. Documentação', 'Documentacao_RevisaWiki_v2_5.wiki', 'Usuário:Daniel G Rego/RevisaWiki', 'Resumo_documentacao_RevisaWiki_v2_5.txt', 'Copie o wikitexto completo para a página de documentação.'),
    ('comunitario', 'Carregador para outros editores', 'Carregador_comunitario_RevisaWiki_v2_5.js', 'Especial:Minha página/common.js', 'Resumo_atualizacao_RevisaWiki_v2_5.txt', 'Para usar a distribuição compartilhada. Escolha apenas um carregador.'),
]
assert not re.search(r'\b[A-Z_]*PENDING\b',(SOURCE/'Relatorio_testes_RevisaWiki_v2_5.txt').read_text()),'Final test report is required'
payloads = {}
cards = []
for ident, title, filename, destination, summary_file, note in rows:
    raw = (SOURCE / filename).read_bytes()
    assert not re.search(r'\b[A-Z_]*PENDING\b',raw.decode('utf-8')),'Unfinished copy payload: '+filename
    payloads[ident] = {'text': raw.decode('utf-8'), 'filename': filename, 'destination': destination,
                      'summary': (SOURCE / summary_file).read_text().strip(),
                      'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
    copy_if_different(filename)
    href = 'https://pt.wikipedia.org/w/index.php?' + urlencode({'title': destination, 'action': 'edit'})
    cards.append(f'''<article class="card" id="{ident}">
<div class="card-heading"><h2>{html.escape(title)}</h2><span>{len(raw):,} bytes</span></div>
<p class="destination">{html.escape(destination)}</p><p>{html.escape(note)}</p>
<div class="buttons"><button class="primary" data-copy="text" data-id="{ident}">Copiar conteúdo</button><button data-copy="summary" data-id="{ident}">Copiar resumo</button><button data-copy="destination" data-id="{ident}">Copiar destino</button></div>
<div class="links"><button class="text-button" data-view="{ident}">Ver conteúdo</button><a href="{html.escape(filename)}" download>Baixar arquivo</a><a href="{html.escape(href)}" target="_blank" rel="noopener noreferrer">Abrir edição ↗</a></div>
</article>''')
packed = json.dumps(payloads, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
page = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>RevisaWiki 2.5.0 · Copiar e colar</title>
<style>
:root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#22384d;background:#f3f7fb;color-scheme:light}*{box-sizing:border-box}body{margin:0;padding:28px 18px 48px}main{max-width:1000px;margin:auto}h1{font-size:clamp(1.7rem,4vw,2.4rem);margin:.35rem 0 .6rem}h2{font-size:1.15rem;margin:0}p{line-height:1.6;margin:.7rem 0}.badge{display:inline-block;padding:6px 11px;border-radius:99px;background:#e0edfa;font-size:.85rem;font-weight:650}.intro{max-width:760px}.notice{padding:14px 18px;border-left:4px solid #4079bb;background:white;border-radius:6px;margin:20px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{background:white;border:1px solid #d2e0ee;border-radius:14px;padding:21px;box-shadow:0 4px 12px #16334d06}.card-heading{display:flex;justify-content:space-between;gap:10px;align-items:baseline}.card-heading span{font-size:.75rem;color:#62768a;white-space:nowrap}.destination{font-size:.87rem;color:#46617c;overflow-wrap:anywhere}.buttons{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 12px}button{font:inherit;cursor:pointer;background:#f4f8fd;color:#204a70;border:1px solid #b6cde3;border-radius:8px;padding:9px 12px;font-size:.87rem}button.primary{background:#285f9b;color:white;border-color:#285f9b;font-weight:650}button:hover{filter:brightness(.96)}button:focus-visible,a:focus-visible{outline:3px solid #eeae45;outline-offset:3px}.links{display:flex;flex-wrap:wrap;gap:14px;align-items:center;font-size:.85rem}a{color:#285f9b;text-underline-offset:3px}.text-button{border:0;background:none;padding:0;text-decoration:underline;text-underline-offset:3px}.extras{margin-top:24px;padding-top:16px;border-top:1px solid #d2e0ee}.extras h2{margin-bottom:10px}.status{min-height:1.5rem;color:#276447;font-weight:600;margin:12px 0}dialog{width:min(950px,95vw);border:1px solid #bbcfe1;border-radius:14px;padding:22px;background:#fff;color:#22384d}dialog::backdrop{background:#13283f70}.dialog-head{display:flex;justify-content:space-between;align-items:center;gap:12px}textarea{display:block;width:100%;height:60vh;resize:vertical;margin:16px 0;padding:14px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;border:1px solid #bdd0e1;border-radius:8px;white-space:pre;tab-size:4}small{color:#62768a}@media(max-width:700px){.grid{grid-template-columns:1fr}body{padding:20px 12px}.card{padding:18px}.card-heading{flex-wrap:wrap}}
</style></head><body><main>
<span class="badge">RevisaWiki 2.5.0</span><h1>Copiar e colar</h1>
<p class="intro">Os quatro primeiros cartões seguem a ordem de atualização. Cada botão copia o arquivo completo, o resumo da edição ou o título da página de destino.</p>
<div class="notice">Atualize primeiro os dados e o programa. Depois, atualize o carregador para 2.5.0. No <strong>common.js</strong>, preserve seus outros scripts. Este índice não salva nenhuma página.</div>
<p class="status" id="status" role="status" aria-live="polite"></p>
<div class="grid">''' + '\n'.join(cards[:4]) + '''</div>
<section class="extras"><h2>Para compartilhar com outros editores</h2>''' + cards[4] + '''</section>
<section class="extras"><h2>Instruções e conferência</h2><div class="links"><a href="Instalacao_RevisaWiki_v2_5.txt">Instalação completa</a><a href="Relatorio_testes_RevisaWiki_v2_5.txt">Relatório de testes</a><a href="MANIFESTO.json">Arquivos e hashes</a></div><p><small>O arquivo completo que reúne núcleo e dados ultrapassa o limite de uma página da ptwiki. Para instalar, use os dois cartões separados.</small></p></section>
</main>
<dialog id="viewer"><div class="dialog-head"><h2 id="viewer-title">Conteúdo</h2><button id="close-viewer">Fechar</button></div><p id="viewer-help">Para copiar manualmente, selecione o texto e use Command + A e Command + C no Mac.</p><textarea id="viewer-text" readonly spellcheck="false" aria-labelledby="viewer-title"></textarea><button id="select-text">Selecionar tudo</button></dialog>
<script type="application/json" id="payloads">''' + packed + '''</script>
<script>
'use strict';
const payloads=JSON.parse(document.getElementById('payloads').textContent);
const viewer=document.getElementById('viewer'),area=document.getElementById('viewer-text'),status=document.getElementById('status');
function showText(text,title,manual){area.value=text;document.getElementById('viewer-title').textContent=title;document.getElementById('viewer-help').textContent=manual?'A cópia automática não ficou disponível. Com o texto selecionado, use Command + C no Mac ou Control + C.':'Para copiar manualmente, selecione o texto e use Command + A e Command + C no Mac.';if(!viewer.open)viewer.showModal();area.focus();if(manual)area.select();}
async function copyText(text,title){
 try{if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('clipboard-unavailable');await navigator.clipboard.writeText(text);status.textContent=title+' copiado.';return true;}catch(error){
  const field=document.createElement('textarea');field.value=text;field.setAttribute('aria-hidden','true');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(field);field.focus();field.select();let done=false;try{done=document.execCommand('copy');}catch(ignored){}field.remove();
  if(done){status.textContent=title+' copiado.';return true;}showText(text,title,true);status.textContent='Texto pronto para copiar manualmente.';return false;
 }
}
document.addEventListener('click',async event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.copy){const item=payloads[button.dataset.id],kind=button.dataset.copy;const title=kind==='text'?item.filename:kind==='summary'?'Resumo da edição':'Destino';button.disabled=true;try{await copyText(item[kind],title);}finally{button.disabled=false;}}else if(button.dataset.view){const item=payloads[button.dataset.view];showText(item.text,item.filename,false);}});
document.getElementById('close-viewer').addEventListener('click',()=>viewer.close());
document.getElementById('select-text').addEventListener('click',()=>{area.focus();area.select();});
</script></body></html>
'''
if not complete_exceeds_limit:
    page=page.replace('O arquivo completo que reúne núcleo e dados ultrapassa o limite de uma página da ptwiki. Para instalar, use os dois cartões separados.','A instalação usa os dois cartões separados, para o programa e os dados.')
(OUT / 'INICIO.html').write_text(page)
for filename in ['Instalacao_RevisaWiki_v2_5.txt', 'Relatorio_testes_RevisaWiki_v2_5.txt',
                 'Resumo_atualizacao_RevisaWiki_v2_5.txt', 'Resumo_documentacao_RevisaWiki_v2_5.txt']:
    copy_if_different(filename)
manifest = {'version': '2.5.0', 'wikipediaWriteActions': 0,
            'sourceReleaseUnchanged': True,
            'completeFileExceedsWikiPageLimit':complete_exceeds_limit,
            'items': [{k:v for k,v in item.items() if k != 'text'} for item in payloads.values()],
            'indexSha256': hashlib.sha256((OUT / 'INICIO.html').read_bytes()).hexdigest()}
(OUT / 'MANIFESTO.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'cards': len(rows), 'copyButtons': len(rows)*3, 'htmlBytes': len(page.encode()),
                  'sourceReleaseUnchanged': True}, ensure_ascii=False))

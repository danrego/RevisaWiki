"""Update the complete manual while retaining the frozen release history."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/2.11.1'
OUT.mkdir(parents=True, exist_ok=True)
manifest_path = ROOT / 'tests/expected_release_v2111.json'
manifest = json.loads(manifest_path.read_text())
qa = json.loads((ROOT / 'artifacts/v2111/RELEASE_QA_SUMMARY.json').read_text())
assert qa['version'] == '2.11.1' and qa['status'] == 'passed'
assert qa['releaseManifestSha256'] == hashlib.sha256(manifest_path.read_bytes()).hexdigest()
assert qa['frozenFiles'] == manifest['files']
summary = qa['portugueseSummary']
features = '''* Desbloqueia reparos de referências quando há estilos literais e chamadas nativas conferidas que não acrescentam fontes.
* Separa nomes repetidos de fontes diferentes quando todas as ocorrências têm conteúdo completo, preservando cada referência.
* Troca blog por obra em citações nativas sem outro campo de publicação e corrige somente endereços com correspondência previamente comprovada.
* Reúne os avisos repetidos de um mesmo conflito, mantendo separados os nomes e grupos diferentes.'''


def active(text):
    return (text.replace('2.11.0-r2', '2.11.1').replace('2.11.0', '2.11.1')
            .replace('_v2_11_0', '_v2_11_1').replace(' · r2', '')
            .replace(', distribuição r2', '').replace('distribuição r2', 'versão 2.11.1'))


def single(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text)


base = (ROOT / 'docs/2.11.0/Documentacao_RevisaWiki_v2_11_0.wiki').read_text()
head, history = base.split('== Histórico das versões ==', 1)
history, tail = history.split('== Testes e detalhes técnicos ==', 1)
head, tail = active(head), active(tail)
head, count = re.subn(r"A versão '''2\.11\.1'''[^\n]+",
    "A versão '''2.11.1''' amplia os reparos automáticos de referências e conserva as fontes quando há dúvida sobre o destino de uma chamada. Os recursos das versões anteriores continuam disponíveis no botão Ajustar código, com comparação e opção de desfazer.", head, count=1)
assert count == 1
new_scope = '''=== Estilos, publicação e endereços de referências ===

Uma lista nativa de Referências com estilo literal pode participar dos reparos de nomes repetidos. O estilo fica exatamente como foi escrito. O programa também reconhece um conjunto pequeno de chamadas nativas conferidas que não acrescentam referências, incluindo números formatados e certas caixas finais. Isso permite conferir as fontes sem apagar essas chamadas. Predefinições desconhecidas, argumentos dinâmicos ou conteúdo que possa acrescentar outras referências continuam impedindo uma renomeação incerta.

Nas chamadas nativas de Citar web e Citar jornal, um único parâmetro <code>blog</code>, com valor literal, pode virar <code>obra</code>. A mudança exige ausência de qualquer outro campo da mesma família, como jornal, revista, website ou site, mesmo se esse campo estiver vazio ou tiver o mesmo valor. O nome do modelo e os demais dados da fonte permanecem iguais. A presença de blog não decide se a referência deve usar Citar jornal ou Citar web.

A correção de um endereço exige correspondência exata entre o artigo, a chamada e o endereço previamente conferidos. O catálogo guarda o par confirmado após consultas públicas ao endereço original e ao destino, com verificação da mesma publicação. Não há remoção geral de pontos ou outros sinais do fim das ligações. Um erro de rede, uma resposta bloqueada ou uma suposição pelo formato do endereço não autorizam a mudança. A regra não faz novas consultas aos sites durante o uso.

Um título ausente, uma classificação de publicação duvidosa ou uma indicação de PDF sem comprovação precisam de revisão editorial. O script não inventa esses dados nem os apaga para esconder um aviso. Um conflito que permanece recebe um único aviso final por nome e grupo. Problemas diferentes continuam separados na conferência.

'''
anchor = '=== Destinos das citações abreviadas ==='
assert head.count(anchor) == 1
head = head.replace(anchor, new_scope + anchor, 1)
history = history.replace('=== 2.11.0 ===', '=== 2.11.1 ===\n' + features + '\n\n=== 2.11.0 ===', 1)
start = tail.index('Os arquivos finais da 2.11.1 passaram')
end = tail.index('\n\n', start)
tail = tail[:start] + summary + tail[end:]
manual = single(head + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==' + tail)
(OUT / 'Documentacao_RevisaWiki_v2_11_1.wiki').write_text(manual)

installation = active((ROOT / 'docs/2.11.0/Instalacao_RevisaWiki_v2_11_0.txt').read_text())
installation = installation.replace('mesmo que a 2.10.0 já esteja instalada.', 'mesmo que a 2.11.0 já esteja instalada.')
installation = installation.replace('Sobre e diagnóstico informa a versão 2.11.1.', 'Sobre e diagnóstico também deve indicar 2.11.1.')
old = 'A versão continua 2.11.1, agora identificada como versão 2.11.1 no painel. O carregador central usa uma chave nova para receber este programa. A chamada fixa do common.js permanece igual.'
assert old in installation
installation = installation.replace(old, 'A versão 2.11.1 usa uma chave nova no carregador central para receber o programa e os dados correspondentes. A chamada fixa do common.js permanece igual.', 1)
start = installation.index('Os arquivos finais da 2.11.1 passaram')
end = installation.index('\n\n', start)
installation = single(installation[:start] + summary + installation[end:])
(OUT / 'Instalacao_RevisaWiki_v2_11_1.txt').write_text(installation)
(OUT / 'Resumo_atualizacao_RevisaWiki_v2_11_1.txt').write_text('RevisaWiki 2.11.1: reparos seguros de nomes e parâmetros de referências, endereços comprovados e avisos sem repetição.\n')
(OUT / 'Resumo_documentacao_RevisaWiki_v2_11_1.txt').write_text('Documentação do RevisaWiki 2.11.1: referências, limites dos reparos, testes e instalação.\n')
(OUT / 'Notas_da_versao_RevisaWiki_v2_11_1.txt').write_text(single('RevisaWiki 2.11.1\n16 de outubro de 2026\n\n' + features.replace('* ', '- ') + '\n\n' + summary + '\n\nAtualize dados, programa, carregador central e documentação, nessa ordem. A chamada fixa do common.js continua igual.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n'))
(OUT / 'LEIA_PRIMEIRO.txt').write_text('RevisaWiki 2.11.1\n\nAbra INICIO.html para copiar o conteúdo completo, o destino e o resumo de cada arquivo. Siga a ordem: dados, programa, carregador central e documentação. Quem já usa a chamada fixa mantém o common.js como está.\n\nNa Wikipédia, instale dados e núcleo separados. O arquivo completo fica disponível para download e testes locais. O índice não salva páginas.\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n')
technical = '''RevisaWiki 2.11.1: referência técnica
16 de outubro de 2026

A reconstrução parte dos sete arquivos fixados da distribuição 2.11.0 r2 e aplica os módulos de src/v2_11_1. Os arquivos arquivados permanecem intactos. Dados, núcleo e carregador central declaram 2.11.1. As duas chamadas fixas continuam idênticas.

Os reparos de nomes mantêm o plano completo de referências, a separação por grupo e região da lista, os controles de chamadas indiretas e a prova de preservação. O catálogo de chamadas sem emissão de referências é finito. O reconhecimento do estilo não modifica o CSS existente. Dados desconhecidos impedem a regra que depende deles.

A troca de blog por obra valida a chamada literal e toda a família de campos de publicação. O reparo de endereço fica vinculado ao artigo e aos bytes completos da chamada original. A reprodução dos reparos integra a conferência de preservação e de edição menor. O contador continua registrando as alterações mantidas por ocorrência.

Os testes distinguem o artigo inteiro das pequenas projeções analisadas pela API nativa. A conservação de todos os dados do artigo é conferida localmente. As consultas públicas nativas usam GET anônimo, sem salvar. Casos sintéticos não são apresentados como artigos distintos.

'''
(OUT / 'Referencia_tecnica_RevisaWiki_v2_11_1.txt').write_text(single(technical + summary + '\n\n' + manual))
lines = ['RevisaWiki 2.11.1: resultados dos testes', '16 de outubro de 2026', '', summary, '', 'Execuções nos arquivos finais', '']
for group in qa['groups']:
    lines.append('- ' + group['label'] + ': ' + str(group['cases']) + ' casos e ' + str(group['checks']) + ' verificações, sem falhas.')
lines += ['', 'Casos sintéticos e permutações não são artigos distintos. Os navegadores usam páginas locais com respostas controladas. Os relatórios e os hashes ficam em tests/evidence/2.11.1.', '', 'Arquivos executados', '']
for name, pin in manifest['files'].items():
    lines += [name + ': ' + str(pin['bytes']) + ' bytes', 'SHA-256: ' + pin['sha256']]
lines += ['', 'Nenhum teste editou a Wikipédia.', 'Código e arquivos: https://github.com/danrego/RevisaWiki', '']
(OUT / 'Relatorio_testes_RevisaWiki_v2_11_1.txt').write_text(single('\n'.join(lines)))
print(json.dumps({'version': '2.11.1', 'documentationFiles': len(list(OUT.iterdir()))}))

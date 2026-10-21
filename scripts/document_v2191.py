"""Generate the complete patch manual while retaining the original QA history."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION, SLUG = '2.19.1', 'v2_19_1'
PREVIOUS = ROOT / 'docs' / '2.19.0'
DOCS = ROOT / 'docs' / VERSION
BASE_PINS = {
    'Documentacao_RevisaWiki_v2_19_0.wiki': '4932cb6c229d279c5c7e2d31007833edad37ac2bcc5ed2e524a913849e4e6ebd',
    'Instalacao_RevisaWiki_v2_19_0.txt': '3512ca6494ad6f8cf1122dba00f51ca566d69231b2317bade02c556cdb9493fe',
    'LEIA_PRIMEIRO.txt': 'ca353e0fbf341e4aaad31d2bf2f94ae522512a173bf6ad0f4c3a7431bedf94ed',
    'Notas_da_versao_RevisaWiki_v2_19_0.txt': '467dd3d49ea54bf0b7f9f596e8e208606c8234047c8d4f565c8bbab2e4d083ed',
    'Referencia_tecnica_RevisaWiki_v2_19_0.txt': 'b6a6e1a82ec0a9197ea84db735672692cbafdabf10f434f56e4691a8135fb260',
    'Relatorio_testes_RevisaWiki_v2_19_0.txt': '9808a2f09c2c748fdfa323b45afabf119774754a6f236f19c2bf11bd990f6e38',
    'Resumo_atualizacao_RevisaWiki_v2_19_0.txt': '2563504627e8cd4380054b964f9c0bce3f058e12f5e3230d48f3568f45a8a909',
    'Resumo_documentacao_RevisaWiki_v2_19_0.txt': '3ad2c8d3fbfe0f529422c412b66943d8cfd579fb1c0115f9450153b00f03ae68',
}
FEATURES = [
    'Corrige o erro "cyclic object value" que podia interromper Ajustar código ao reconhecer o editor.',
    'Mantém a conferência do editor e do rascunho sem tentar converter o objeto do editor em texto JSON.',
    'Conserva as regras de alteração do artigo, as verificações de preservação e o limite de 60 segundos.',
    'Mantém a chamada fixa do common.js, que não precisa ser substituída nesta atualização.',
]
PATCH_INTRO = (
    'A versão 2.19.1 corrige o erro "cyclic object value", que podia interromper '
    'Ajustar código antes da revisão. O problema '
    'ocorria ao guardar a identificação do editor e foi corrigido sem mudar as '
    'regras aplicadas ao artigo. A chamada fixa do common.js permanece igual.'
)
TECHNICAL = (
    'A correção atribui ao objeto do editor um identificador estável guardado em '
    'WeakMap. O contexto usado para conferir o rascunho contém esse identificador, '
    'sem serializar o objeto do editor, seus elementos de interface ou referências '
    'circulares. Editores diferentes continuam recebendo identificadores diferentes. '
    'As conferências de título, revisão, seção, texto e instância do editor permanecem ativas.'
    '\n\n'
    'O motor de regras que altera o código do artigo não foi modificado nesta '
    'correção. O prazo de 60.000 milissegundos, as verificações de preservação, '
    'a restauração do rascunho e as proteções da marca de edição menor foram mantidos. '
    'Os dados e o carregador passam a declarar 2.19.1 para combinar com o núcleo. '
    'A chamada fixa já instalada no common.js continua igual.'
)
HISTORY_NOTICE = (
    'Os números e os resultados apresentados a seguir pertencem à validação da '
    '2.19.0. Eles foram preservados como histórico e não contam como uma nova '
    'execução completa dos testes para 2.19.1. Timeouts, recusas e resultados '
    'ambíguos mantêm seus registros originais.'
)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def clean(text):
    return re.sub(r'\n[ \t]*\n[ \t]*\n+', '\n\n', text).strip() + '\n'


def current(text):
    return text.replace('2.19.0', VERSION).replace('v2_19_0', SLUG)


def validation():
    path = ROOT / 'tests/evidence/2.19.1/QA_SUMMARY.json'
    if path.exists():
        data = json.loads(path.read_text())
        assert data['version'] == VERSION
        summary = data.get('docValidationSummary')
        paragraphs = data.get('docValidationParagraphs', [])
        if summary is not None:
            assert isinstance(summary, str) and summary.strip() == summary and summary
            assert isinstance(paragraphs, list)
            assert all(isinstance(item, str) and item.strip() == item and item for item in paragraphs)
            return summary, '\n\n'.join([summary, *paragraphs]), sha(path.read_bytes())
    text = (
        'A validação desta correção ainda não foi concluída. O relatório da '
        '2.19.1 será atualizado com os testes executados sobre os arquivos desta '
        'versão, sem atribuir a eles os resultados anteriores da 2.19.0.'
    )
    return text, text, None


def executable_pins():
    path = ROOT / 'tests/expected_release_v2191.json'
    if not path.exists():
        return 'Os hashes dos arquivos desta versão serão registrados depois da reconstrução do pacote.'
    manifest = json.loads(path.read_text())
    records = []
    for name, pin in manifest['files'].items():
        raw = (ROOT / 'dist' / VERSION / name).read_bytes()
        assert len(raw) == pin['bytes'] and sha(raw) == pin['sha256']
        records.append(name + ': ' + str(pin['bytes']) + ' bytes\nSHA-256: ' + pin['sha256'])
    return '\n\n'.join(records)


def main():
    source = {}
    for name, expected in BASE_PINS.items():
        raw = (PREVIOUS / name).read_bytes()
        assert sha(raw) == expected, name
        source[name] = raw.decode()
    summary, report, qa_hash = validation()
    old_manual = source['Documentacao_RevisaWiki_v2_19_0.wiki']
    before_history, rest = old_manual.split('== Histórico das versões ==', 1)
    history, rest = rest.split('== Testes e detalhes técnicos ==', 1)
    old_tests, end = rest.split('== Referências da documentação ==', 1)
    active = current(before_history)
    for before, after in {
        'O artigo extremo de aproximadamente 1,9 MB ultrapassou esse prazo nos testes,':
            'O artigo extremo de aproximadamente 1,9 MB ultrapassou esse prazo nos testes da 2.19.0,',
        'Nos testes locais de timeout em Chrome, Firefox e Safari,':
            'Nos testes locais de timeout da 2.19.0 em Chrome, Firefox e Safari,',
    }.items():
        assert active.count(before) == 1
        active = active.replace(before, after, 1)
    marker = '=== Usar a distribuição compartilhada ==='
    assert active.count(marker) == 1
    active = active.replace(marker, PATCH_INTRO + '\n\n' + marker, 1)
    patch_history = '=== 2.19.1 ===\n\n' + '\n'.join('* ' + item for item in FEATURES) + '\n\n'
    assert history.count('=== 2.19.0 ===') == 1
    history = history.replace('=== 2.19.0 ===', patch_history + '=== 2.19.0 ===', 1)
    current_links = (
        'Os resultados desta correção ficam no '
        '[https://github.com/danrego/RevisaWiki/blob/main/docs/2.19.1/Relatorio_testes_RevisaWiki_v2_19_1.txt '
        'Relatório de testes 2.19.1]. A '
        '[https://github.com/danrego/RevisaWiki/blob/main/docs/2.19.1/Referencia_tecnica_RevisaWiki_v2_19_1.txt '
        'referência técnica] explica a mudança no reconhecimento do editor.'
    )
    manual = (
        active + '== Histórico das versões ==' + history + '== Testes e detalhes técnicos ==\n\n'
        + '=== Correção 2.19.1 ===\n\n' + summary + '\n\n' + current_links
        + '\n\n=== Validação anterior, 2.19.0 ===\n\n' + HISTORY_NOTICE + '\n' + old_tests
        + '== Referências da documentação ==' + end
    )
    installation = current(source['Instalacao_RevisaWiki_v2_19_0.txt'])
    start, rest = installation.split('\nTESTES\n', 1)
    _, end_installation = rest.split('\nCONSULTAS E PUBLICAÇÃO\n', 1)
    installation = (
        start + '\nTESTES\n\n' + summary + '\n\n'
        + 'A validação completa da 2.19.0 continua no relatório dessa versão. '
        + 'Ela não foi contabilizada de novo como teste da correção 2.19.1.'
        + '\n\nCONSULTAS E PUBLICAÇÃO\n' + end_installation
    )
    installation = installation.replace('\nATUALIZAR A DISTRIBUIÇÃO\n', '\n' + PATCH_INTRO + '\n\nATUALIZAR A DISTRIBUIÇÃO\n', 1)
    old_technical = source['Referencia_tecnica_RevisaWiki_v2_19_0.txt']
    old_report = source['Relatorio_testes_RevisaWiki_v2_19_0.txt']
    contents = {
        'Documentacao_RevisaWiki_v2_19_1.wiki': manual,
        'Instalacao_RevisaWiki_v2_19_1.txt': installation,
        'Notas_da_versao_RevisaWiki_v2_19_1.txt': (
            'RevisaWiki 2.19.1\n\n' + '\n'.join('- ' + item for item in FEATURES)
            + '\n\n' + summary
        ),
        'Referencia_tecnica_RevisaWiki_v2_19_1.txt': (
            'RevisaWiki 2.19.1: referência técnica\n\n' + TECHNICAL + '\n\n' + summary
            + '\n\nREFERÊNCIA ANTERIOR, 2.19.0\n\n' + HISTORY_NOTICE + '\n\n' + old_technical
        ),
        'Relatorio_testes_RevisaWiki_v2_19_1.txt': (
            'RevisaWiki 2.19.1: resultados dos testes\n\n' + report
            + '\n\nArquivos da correção 2.19.1\n\n' + executable_pins()
            + '\n\nQUALIFICAÇÃO ANTERIOR, 2.19.0\n\n' + HISTORY_NOTICE + '\n\n' + old_report
        ),
        'Resumo_atualizacao_RevisaWiki_v2_19_1.txt': (
            'Atualização do RevisaWiki para 2.19.1: correção do erro de referências circulares '
            'ao reconhecer o editor, sem mudança nas regras de ajuste do artigo.'
        ),
        'Resumo_documentacao_RevisaWiki_v2_19_1.txt': (
            'Atualização do manual do RevisaWiki 2.19.1, com a correção do reconhecimento '
            'do editor, instalação e resultados dos testes separados do histórico da 2.19.0.'
        ),
        'LEIA_PRIMEIRO.txt': (
            'RevisaWiki 2.19.1\n\n' + PATCH_INTRO
            + '\n\nAbra INICIO.html. Atualize dados, programa, carregador central e documentação, '
            + 'nessa ordem. Se já usa a chamada fixa no common.js, mantenha esse bloco.'
            + '\n\nO índice oferece cópia completa, destino, resumo, editor e download. Ele não publica '
            + 'páginas. Use os arquivos separados de dados e programa para respeitar o limite por página da ptwiki.'
            + '\n\nCódigo e arquivos: https://github.com/danrego/RevisaWiki\n\n' + summary
        ),
    }
    DOCS.mkdir(parents=True, exist_ok=True)
    for name, text in contents.items():
        text = clean(text)
        assert not re.search(r'\bPENDING\b|TODO|FINAL_AUDITED|/' + 'Users/|/' + r'private/|127\.0\.0\.1:\d+', text)
        assert not re.search('[\u2014\u201c\u201d\u2018\u2019]', text)
        (DOCS / name).write_text(text)
    assert manual.split('=== 2.19.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0] == old_manual.split('=== 2.19.0 ===', 1)[1].split('== Testes e detalhes técnicos ==', 1)[0]
    assert old_technical in contents['Referencia_tecnica_RevisaWiki_v2_19_1.txt']
    assert old_report in contents['Relatorio_testes_RevisaWiki_v2_19_1.txt']
    print(json.dumps({'version': VERSION, 'files': len(contents), 'qaSha256': qa_hash}))


if __name__ == '__main__':
    main()

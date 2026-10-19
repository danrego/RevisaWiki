"""Document only the selected beta fixes and their completed local checks."""
from pathlib import Path
import hashlib,json,shutil,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
VERSION='2.19.0-beta.2'; SLUG='v2_19_0_beta_2'
D=ROOT/'dist'/VERSION; E=ROOT/'tests/evidence'/VERSION; DOC=ROOT/'docs'/VERSION

def main():
 manifest=json.loads((ROOT/'tests/expected_release_beta219_2.json').read_text())
 for name,pin in manifest['files'].items():
  raw=(D/name).read_bytes();assert len(raw)==pin['bytes'] and hashlib.sha256(raw).hexdigest()==pin['sha256']
 groups=[]
 for name in json.loads((ROOT/'tests/beta219_2/SUITES.json').read_text()):
  row=json.loads((E/name.replace('.cjs','.json')).read_text());assert row['status']=='passed' and not row['failures']
  groups.append({'suite':name,'cases':len(row['cases']),'checks':row['checks']})
 browsers=[]
 for name in ['chrome','firefox']:
  row=json.loads((E/('browser-'+name+'.json')).read_text());assert row['status']=='passed'
  browsers.append({'browser':name,'version':row['browserVersion'],'cases':len(row['cases']),'checks':row['checks']})
 summary={'version':VERSION,'status':'passed-beta-scope-with-safari-unavailable','scope':manifest['changes'],'baseVersion':'2.19.0-beta.1','mainValidationResumed':False,'final219Qualified':False,'frozenFiles':manifest['files'],'groups':groups,'browsers':browsers,'safari':{'status':'not-repeated-prior-automation-unavailable','testsExecuted':0,'priorReceipt':'tests/evidence/2.19.0-beta.1/browser-safari.json'},'wikipediaWrites':0,'giantArticleRepeated':False,'workerTimeoutMilliseconds':60000,'historicalResultsUnchanged':True}
 (E/'QA_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
 installation=(ROOT/'docs/2.19.0-beta.1/Instalacao_RevisaWiki_v2_19_0_beta_1.txt').read_text().replace('2.19.0-beta.1',VERSION).replace('v2_19_0_beta_1',SLUG)
 installation=installation.replace('Esta beta usa páginas próprias.', 'Se já instalou a beta.1, atualize dados, programa, carregador central e documentação.\nA chamada fixa do common.js não mudou e não precisa ser substituída.\n\nEsta beta usa páginas próprias.')
 manual="""O '''RevisaWiki 2.19.0-beta.2''' acrescenta três grupos de correções conferidas à beta.1. A rodada principal da versão final 2.19 continua pausada.

== O que mudou ==

* '''Datas duplicadas em infocaixas:''' remove um campo redundante quando dois parâmetros nativos da mesma data têm conteúdo literalmente idêntico. Valores diferentes e campos com funções distintas são preservados.
* '''Idade repetida:''' em sete modelos de infocaixa conferidos, retira a idade digitada depois de uma chamada de nascimento que já a exibe. A data e suas referências são mantidas. Idades divergentes, opções desconhecidas e trechos protegidos ficam intactos.
* '''Tabelas:''' impede reduzir um <code>rowspan</code> apenas pela contagem de linhas explícitas. Também impede reparos de separadores quando os atributos estão incompletos ou o trecho depende de conteúdo protegido.

A correção de <nowiki>{{PD}}</nowiki> da beta.1 continua incluída. O botão '''Criar código''' reconhece os redirecionamentos conferidos, como <nowiki>{{pd}}</nowiki> e <nowiki>{{Página de discussão}}</nowiki>, e preserva a chamada existente. Se ela estiver depois de uma conversa, não acrescenta outra no início.

As demais funções vêm da versão publicada 2.18. Esta beta não incorpora todo o código em preparação para a 2.19 final.

== Instalação ==

# Atualize os dados em [[Usuário:Daniel G Rego/RevisaWiki/Beta/Dados.js]].
# Atualize o programa em [[Usuário:Daniel G Rego/RevisaWiki/Beta.js]].
# Atualize o carregador em [[Usuário:Daniel G Rego/RevisaWiki/Beta/Carregador.js]].
# Atualize esta documentação com o arquivo fornecido no índice.
# Recarregue sem cache e confirme <code>2.19.0-beta.2</code> no painel.

Se já usa a beta.1, a chamada fixa do <code>common.js</code> é a mesma. Na primeira instalação, desative a chamada estável e acrescente somente a chamada fixa da beta, preservando seus outros scripts. Para voltar à versão estável, restaure a chamada anterior. Não carregue as duas versões na mesma página.

O programa e os dados são fornecidos separadamente para respeitar o limite de tamanho das páginas. O arquivo completo serve para download e testes locais. Os cartões do índice oferecem o conteúdo inteiro e o destino de cada arquivo. Copiar ou abrir um cartão não publica nenhuma edição.

== Como testar ==

Abra '''Editar código-fonte''' e use '''Ajustar código'''. Confira o resultado com '''Mostrar alterações''' e '''Mostrar previsão'''. Na discussão, use '''Criar código'''. A publicação continua sendo feita por você no botão normal do editor.

Os controles desta beta conferem o resultado completo, a preservação de referências e os casos em que nada deve mudar. Eles também verificam se uma segunda execução produz alterações inesperadas. São casos locais de teste, não uma contagem de artigos revisados.

== Limites e testes ==

Os três grupos de correções passaram novamente nas duas distribuições. Os testes locais da interface passaram no Chrome e no Firefox. Os testes do índice verificam os conteúdos copiados, os destinos e a apresentação em telas de tamanhos diferentes. Os números e as versões dos navegadores estão no relatório do pacote.

Os testes no Safari ficaram pendentes após a falha de infraestrutura registrada na beta.1. A sessão não foi repetida nesta atualização. Esse resultado anterior permanece como estava, sem ser convertido em aprovação.

O processamento mantém o limite de 60 segundos e as verificações de preservação. Ao atingir o limite, a análise é interrompida sem aplicar o resultado atrasado. O artigo extremo de aproximadamente 1,9 MB permanece uma limitação conhecida e não foi testado novamente nesta beta.

A rodada extensa da versão final 2.19 não foi retomada. Reparos de referências, imagens e portais que ainda dependem dessa validação ficaram de fora. Os resultados históricos continuam preservados. Nenhum teste ou etapa de preparação desta versão fez edições na Wikipédia.

== Histórico ==

=== 2.19.0-beta.2 ===

* Remoção de campos nativos redundantes com a mesma data literal.
* Remoção de idade manual repetida em campos de nascimento conferidos.
* Proteção de valores de rowspan e de cabeçalhos com atributos incompletos.
* Instalação separada, com a mesma chamada fixa da beta.1.

=== 2.19.0-beta.1 ===

* Reconhecimento dos redirecionamentos conferidos de PD, preservando a chamada existente.
* Prevenção de duplicação quando o cabeçalho está fora do início da discussão.
* Instalação separada e controles de falsos positivos, interface e cópia.

=== 2.18.0, base desta beta ===

* Reparos de citações em contextos reconhecidos.
* Correções de campos literais conferidos.
* Limpeza de linhas vazias excedentes e formatação responsiva das referências.

== Código e documentação ==

* [https://github.com/danrego/RevisaWiki Repositório no GitHub]
* [https://github.com/danrego/RevisaWiki/releases/tag/v2.19.0-beta.2 Arquivos completos desta beta]
* [[Usuário:Daniel G Rego/RevisaWiki|Documentação da versão estável]]
"""
 notes='RevisaWiki '+VERSION+'\n\nInclui a correção de PD da beta.1 e acrescenta datas nativas idênticas, idade manual repetida e proteção de tabelas.\n\nA versão final 2.19 permanece pausada. Nenhuma edição na Wikipédia.\n'
 report='RevisaWiki '+VERSION+'\n\n'+'\n'.join(x['suite']+': '+str(x['cases'])+' casos, '+str(x['checks'])+' verificações.' for x in groups)+'\n\n'+'\n'.join(x['browser']+' '+x['version']+': '+str(x['cases'])+' casos, '+str(x['checks'])+' verificações.' for x in browsers)+'\n\nOs casos são locais e executam os dois arquivos distribuídos. Não são contados como artigos. As expectativas verificam o texto inteiro e a preservação dos trechos que não devem mudar.\n\nSafari: não repetido após a indisponibilidade de automação registrada na beta.1. Os resultados anteriores permanecem inalterados. A rodada principal não foi retomada. O artigo extremo não foi repetido. Limite mantido em 60000 ms. Nenhuma edição na Wikipédia.\n'
 files={'Documentacao_RevisaWiki_'+SLUG+'.wiki':manual,'Instalacao_RevisaWiki_'+SLUG+'.txt':installation,'Resumo_atualizacao_RevisaWiki_'+SLUG+'.txt':'Atualização do RevisaWiki para 2.19.0-beta.2, com correções de datas, idade repetida e proteção de tabelas.\n','Resumo_documentacao_RevisaWiki_'+SLUG+'.txt':'Documentação e instalação do RevisaWiki 2.19.0-beta.2.\n','Relatorio_testes_RevisaWiki_'+SLUG+'.txt':report,'Notas_da_versao_RevisaWiki_'+SLUG+'.txt':notes,'LEIA_PRIMEIRO.txt':installation}
 DOC.mkdir(parents=True,exist_ok=True)
 for name,text in files.items():
  assert '\n\n\n' not in text
  (DOC/name).write_text(text);shutil.copyfile(DOC/name,D/name)
 shutil.copyfile(ROOT/'LICENSE',D/'LICENSE.txt')
 subprocess.run([sys.executable,str(ROOT/'scripts/build_index_beta219_2.py')],check=True)
if __name__=='__main__':main()

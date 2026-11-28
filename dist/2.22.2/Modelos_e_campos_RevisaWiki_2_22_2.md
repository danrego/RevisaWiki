# Modelos e campos do RevisaWiki 2.22.2

O catálogo JSON lista os nomes reconhecidos, campos, aliases e contratos. A tabela abaixo destaca os reparos acrescentados nesta versão, com destino e consumidor próprios. Um nome de campo não é transferido para toda infocaixa por semelhança.

| Modelo | Campo encontrado | Campo nativo |
| --- | --- | --- |
| Info/Álbum | `lançamento` | `lançado` |
| Info/Museu | `localidade` | `localização` |
| Info/Aeronave | `tipo` | `missao` |
| Info/Aeronave | `introducao` | `integraçao` |
| Info/Aeronave | `aposentadoria` | `aposentado` |
| Info/Aeronave | `producao` | `produção` |
| Info | `estilo_titulo` | `título-estilo` |
| Infocaixa | `estilo_titulo` | `título-estilo` |
| Info/Empresa | `website` | `site` |
| Info/Empresa | `homepage` | `site` |
| Info/Empresa | `pagina` | `site` |
| Info/Empresa | `página` | `site` |
| Info/Biografia | `name` | `nome` |
| Info/Biografia | `image` | `imagem` |
| Info/Biografia | `caption` | `legenda` |
| Info/Biografia | `alt` | `imagem_alt` |
| Info/Biografia | `birth_place` | `local_nascimento` |
| Info/Biografia | `death_place` | `local_morte` |
| Info/Biografia | `other_names` | `outros_nomes` |
| Info/Biografia | `education` | `educação` |
| Info/Biografia | `spouse` | `cônjuge` |
| Info/Biografia | `children` | `filhos` |
| Info/Biografia | `occupation` | `ocupação` |
| Info/Biografia | `parents` | `progenitores` |
| Info/Biografia | `signature` | `assinatura` |
| Info/Lutador de wrestling profissional | `name` | `nome` |
| Info/Lutador de wrestling profissional | `image` | `imagem` |
| Info/Lutador de wrestling profissional | `image_size` | `imagem_tamanho` |
| Info/Lutador de wrestling profissional | `caption` | `legenda` |
| Info/Lutador de wrestling profissional | `birth_name` | `nome_nascimento` |
| Info/Lutador de wrestling profissional | `birth_date` | `nascimento_data` |
| Info/Lutador de wrestling profissional | `birth_place` | `nascimento_local` |
| Info/Lutador de wrestling profissional | `death_date` | `morte_data` |
| Info/Lutador de wrestling profissional | `death_place` | `morte_local` |
| Info/Lutador de wrestling profissional | `resides` | `residência` |
| Info/Lutador de wrestling profissional | `spouse` | `cônjuge` |
| Info/Lutador de wrestling profissional | `children` | `filhos` |
| Info/Lutador de wrestling profissional | `family` | `família` |
| Info/Lutador de wrestling profissional | `names` | `nomes` |
| Info/Lutador de wrestling profissional | `height` | `altura` |
| Info/Lutador de wrestling profissional | `weight` | `peso` |
| Info/Lutador de wrestling profissional | `billed` | `anunciado de` |
| Info/Lutador de wrestling profissional | `trainer` | `treinador` |
| Info/Lutador de wrestling profissional | `debut` | `estreia` |
| Info/Lutador de wrestling profissional | `retired` | `aposentadoria` |
| Info/Lutador de wrestling profissional | `website` | `site` |

Nas caixas genéricas previstas, rotuloN usa rótuloN no intervalo conferido. Campos de sites só mudam quando o campo de destino não conflita. Em Info/Álbum, formato vazio pode sair, mas um valor preenchido é preservado. O identificador IMDb preenchido só sai quando o mesmo ID já tem uma ligação externa visível e comprovada.

## Campos com referências e coletor

A composição finita de campo e coletor cobre 137 destinos de 25 modelos nativos e 154 grafias de origem. São 116 destinos de texto direto, 11 condicionais, quatro em subinfocaixas, quatro de legendas com registro de referência pela avaliação dos argumentos, um numérico inteiro e um seletor textual. Cada ramo mantém suas condições e a prioridade dos aliases. Uma chave vazia não substitui a prova de uma chave ausente; uma legenda pode registrar uma fonte mesmo sem aparecer na imagem. Valores opacos, produtores desconhecidos, grupos diferentes e papéis de atributo ou de dimensão não são liberados por essa contagem.

Nos 25 casos sintéticos retidos, 20 não alcançam o ramo nativo exigido e cinco fornecem referência num papel de largura ou de texto alternativo de imagem. Eles conservam os dados e recebem zero crédito de reparo. As contrapartidas condicionais e os comprovantes nativos são verificados separadamente; isso não equivale à aprovação do pacote final.

## Migrações completas

O catálogo de migração reúne seis registros: cinco ativos e uma colisão de cabeçalho preservada. Dos ativos, dois cuidam da interface portuguesa, um reparo de Info/Biografia e um wrapper Infobox person, e três descrevem subconjuntos ingleses de pessoa, cientista e futebolista. O reconhecimento de 170 cabeçalhos serve para localizar contratos, sem prometer 170 conversões. Uma caixa estrangeira só migra quando o contrato cobre todos os seus argumentos e o contexto de uso.

| Estado | Origem | Modelo | Destino |
| --- | --- | --- | --- |
| active | pt | `Predefinição:Info/Biografia` | `Predefinição:Info/Biografia` |
| active | pt | `Predefinição:Infobox person` | `Predefinição:Info/Biografia` |
| active | en | `Template:Infobox person` | `Predefinição:Info/Biografia` |
| active | en | `Template:Infobox football biography` | `Predefinição:Info/Futebolista` |
| unresolved | ca | `Plantilla:Infobox person` | `Sem destino ativado` |

## Cuidados de leitura

Campos de nascimento, instituições, influência, sepultamento, nacionalidade e caixas incorporadas precisam do significado e do consumidor certos. Um campo aceito pelo verificador pode não ser exibido, e uma tradução literal não prova equivalência. Os argumentos desconhecidos permanecem, sem impedir reparos nativos independentes.

Os arquivos completos estão no repositório: https://github.com/danrego/RevisaWiki

## Mapas novos e limites desta versão

O catálogo reúne campos já cobertos e os acréscimos desta versão. Cada linha vale para o modelo indicado; palavras parecidas não são tratadas como o mesmo campo em qualquer infocaixa.

A base da versão anterior reúne 137 destinos em 25 modelos e 154 grafias de origem. A 2.22.2 acrescenta dois leitores específicos: propulsao para propulsão em Info/Navio, e soc para obs com o rótulo SoC: em Info/Computador. Quando as referências literais só aparecem nesses campos, a correção e o coletor ausente são preparados juntos. Outros campos novos com referências precisam de um coletor compatível ou de prova própria de consumo antes de serem ativados.

Em Info/Filme, um identificador IMDb isolado e inequívoco de sete ou oito dígitos pode ser preservado em IMDb título na seção Ligações externas antes de sair do campo obsoleto. Uma ligação nativa existente com o mesmo ID é mantida uma só vez. IDs conflitantes, chamadas dinâmicas e invólucros sem prova conservam o campo. A ferramenta não inventa um identificador.

| Modelo | Origem | Destino | Condição |
| --- | --- | --- | --- |
| Info/Biografia | nascimento_pais | nascimento_país | Texto |
| Info/Biografia | periodo_atividade | período_atividade | Texto |
| Info/Empresa | founder | fundador | Texto |
| Info/Biografia | birth_name | nome_nascimento | Texto |
| Info/Biografia | citizenship | cidadania | Texto |
| Info/Biografia | known_for | conhecido_por | Texto |
| Info/Biografia | works | obras | Texto |
| Info/Biografia | credits | créditos | Texto |
| Info/Biografia | notable_works | obras_notáveis | Texto |
| Info/Biografia | years_active | período_atividade | Texto |
| Info/Biografia | employer | empregador | Texto |
| Info/Biografia | organisation | organização | Texto |
| Info/Biografia | organization | organização | Texto |
| Info/Biografia | organizations | organizações | Texto |
| Info/Biografia | native_name | nome_nativo | Texto |
| Info/Biografia | native_name_lang | nome_nativo_lang | Código de língua |
| Info/Biografia | death_cause | causa_morte | Texto |
| Info/Biografia | resting_place | sepultamento | Texto |
| Info/Biografia | burial_place | enterro_local | Texto |
| Info/Biografia | workplaces | instituicoes_trabalho | Texto |
| Info/Biografia | doctoral_advisor | orientador | Texto |
| Info/Biografia | doctoral_advisors | orientadores | Texto |
| Info/Biografia | doctoral_students | orientados | Texto |
| Info/Biografia | field | campo | Texto |
| Info/Biografia | fields | campo | Texto |
| Info/Biografia | module | módulo | Subinfocaixa |
| Info/Biografia | module2 | módulo2 | Subinfocaixa |
| Info/Biografia | module3 | módulo3 | Subinfocaixa |
| Info/Biografia | module4 | módulo4 | Subinfocaixa |
| Info/Biografia | module5 | módulo5 | Subinfocaixa |
| Info/Biografia | module6 | módulo6 | Subinfocaixa |
| Info/Biografia | website | site | Alias nativo já consumido |
| Info/Navio | propulsao | propulsão | Texto |
| Info/Navio | tripulacao | tripulação | Texto |
| Info/Navio | lancamento | lançamento | Texto |
| Info/Museu | fechamento | encerramento | Texto |
| Info/Aeroporto | nome_nativo | nome2 | Texto |
| Info/Aeroporto | operador | administração | Texto |
| Info/Aeroporto | abertura | inauguração | Texto |
| Info/Aeroporto | elevacao_m | altitude | Número |
| Info/Corpo de água | prof_med | profundidade | Texto |
| Info/Corpo de água | prof_max | profundidade_max | Texto |
| Info/Corpo de água | mapa | imagem_mapa | Nome de arquivo |
| Info/Área protegida | cidade_proxima | localidade | Localidade |
| Info/Computador | alimentacao | energia | Texto |
| Info/Conflito militar | units1 | unidade1 | Unidades militares |
| Info/Conflito militar | units2 | unidade2 | Unidades militares |
| Info/Conflito militar | units3 | unidade3 | Unidades militares |
| Info/Conflito militar | imagem_tamanho | imagem-tamanho | Dimensão |

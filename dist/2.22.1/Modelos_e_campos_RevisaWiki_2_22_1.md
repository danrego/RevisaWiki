# Modelos e campos do RevisaWiki 2.22.1

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

A distribuição contém quatro contratos ativos e um caso de colisão retido. O reconhecimento de 170 cabeçalhos não é uma autorização para converter todos eles. Os quatro distinguem reparo de Info/Biografia, wrapper nativo Infobox person e subconjuntos ingleses de pessoa e futebolista. Sem origem comprovada, o cabeçalho compartilhado Infobox person permanece. Outros campos ou combinações de carreira podem conservar a caixa inteira.

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

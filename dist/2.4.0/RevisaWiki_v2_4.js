(function RevisaWikiModuleStart(root) {
    'use strict';
    const VERSION = '2.4.0', EXPECTED_HASH = '1daf86b796e70e117891abef91e3447ea8c0b211cc03b9966d39920f3f0d4323';
    const CACHE_KEY = 'RevisaWiki.catalogs.2.4.0', MAX_BYTES = 1900000;
    function canonical(value) {
        if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
        if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
        return JSON.stringify(value);
    }
    function validShape(data) {
        return data && data.version === VERSION && data.schema === 1 && data.packed?.ptwiki &&
            Array.isArray(data.packed.translations?.records) && Array.isArray(data.packed.spelling?.rows);
    }
    async function verified(data) {
        if (!validShape(data) || !root.crypto?.subtle || !root.TextEncoder) return false;
        const raw = canonical(data.packed);
        if (new root.TextEncoder().encode(raw).length > MAX_BYTES) return false;
        const bytes = await root.crypto.subtle.digest('SHA-256',new root.TextEncoder().encode(raw));
        return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('') === EXPECTED_HASH;
    }
    function start(data, origin) {
        root.RevisaWikiDataV2 = data;
        /*
 * RevisaWiki para a ptwiki, versão 2.4.0, 14 de outubro de 2026.
 * Licença: CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/
 *
 * Ajustar código aparece no painel e, no editor clássico ou CodeMirror,
 * também antes de Publicar. O atalho inferior tem cor verde azulada,
 * usa a mesma análise e fica desativado enquanto ela estiver em andamento.
 * Os botões corrigem sintaxe, campos de citações e infocaixas,
 * ligações e erros ortográficos previstos nas regras. Organiza notas,
 * referências e seções finais, conserva as grafias válidas e deixa as
 * alterações no editor para conferência. O script nunca salva a página.
 * O relatório mostra o que mudou, permite comparar e desfazer o resultado
 * e separa problemas pendentes de informações técnicas.
 *
 * A versão 2.4 recupera fechamentos de sintaxe em padrões comprovados,
 * antes de executar os ajustes normais. Referências e tabelas exigem
 * limites reconhecidos. Um trecho incompleto preservado não autoriza
 * mudanças no seu conteúdo nem nas famílias de referências que o cruzam.
 * Os reparos aparecem na comparação, no relatório e no resumo da edição.
 *
 * A versão 2.3 confere cópias idênticas de infocaixas e chamadas finais,
 * organiza listas globais redundantes sem misturar grupos ou listas locais,
 * preserva listas sem título nas conversões e retira resíduos conhecidos
 * de tradução. A pré-visualização verifica os dados e as fontes que ficam.
 *
 * Um título formado por uma única ligação pode receber Artigo principal
 * abaixo da seção, após confirmar que o destino existe e não é uma
 * desambiguação. A divisão de tabelas por ano conserva as linhas, as células
 * e as repetições. A pré-visualização só aceita essa reorganização quando
 * ela corresponde ao plano calculado a partir do código original.
 * Nomes portugueses confirmados em ligações, séculos e legendas recebem
 * ajustes restritos, com proteção de citações e trechos literais.
 *
 * O catálogo adapta código de 23 edições linguísticas: inglês, francês,
 * alemão, espanhol, russo, ucraniano, turco, hebraico, italiano, romeno,
 * coreano, japonês, chinês, cantonês, vietnamita, tailandês, neerlandês,
 * dinamarquês, sueco, norueguês bokmål, norueguês nynorsk, finlandês e árabe.
 * Traduzir a prosa, avaliar as fontes e resolver casos sem equivalência
 * confirmada continua sendo tarefa do editor. Controle de autoridade e
 * portais adicionais exigem os sinais previstos nas regras e consultas.
 * Conversas assinadas, definições de predefinições e campos bibliográficos
 * têm proteções próprias. As grafias dni e Dni são preservadas.
 *
 * Agradecimentos aos scripts e às revisões anteriores.
 * Fontes e histórico nos links permanentes:
 * https://pt.wikipedia.org/w/index.php?oldid=66288743
 * https://pt.wikipedia.org/w/index.php?oldid=72349758
 * https://pt.wikipedia.org/w/index.php?oldid=73087684
 */
(function RevisaWikiBoot(root) {
    'use strict';
    const VERSION = '2.4.0';
    const DEFAULTS = {
        syntaxRepairs: true, partialSyntaxRecovery: true, structuralRepairs: true, translationResidues: true, autoPreview: true, registryDoiCheck: true, biographyStyleChecks: true, automaticTableRepairs: true, tableAccessibility: true,
        citations: true, dates: true, links: true, references: true, auxiliaryTemplates: true,
        headings: true, shortDescriptions: true, portals: true, biographyPortal: true,
        multilingual: true, authorityControl: true, endTemplateOrder: true, endSectionOrder: true, unifiedNotesReferences: true, externalLinkColumns: true, endMatterColumns: true,
        occupationCase: true, automaticSpelling: true, automaticBiographyPortals: true, livingBirthAge: true, neutralReferenceNames: true,
        automaticIdenticalReferences: true, automaticParameterDuplicates: true, automaticParameterNames: true, automaticEmptyParameters: true, autoMinor: true,
        numericRefNames: true, citationRepairs: true, referenceColumns: true, shortCitationChecks: true, tableChecks: true, dateChecks: true,
        singleLineCitations: true, moveNamedRefs: true, birthDates: true,
        obsoleteTemplates: true, infoboxes: true, authors: true, bareReferences: true,
        markup: true, categories: true, endMatter: true, maintenance: true, shortcuts: true, review: true, autoSummary: true
    };
    const GROUP_LABELS = {
        syntaxTemplateClosers:'Fechamentos de predefinições recuperados', syntaxTagTypos:'Fechamentos de etiquetas corrigidos',
        syntaxReferenceClosers:'Referências sem fechamento recuperadas', syntaxNamedRefReuse:'Chamadas nominais de referências recuperadas',
        syntaxFormattingClosers:'Formatação interna de referências fechada', syntaxTableClosers:'Tabelas simples fechadas no fim da página',
        preservedUnresolvedTail:'Trecho completo ajustado com cauda incompleta preservada',
        repeatedInfoboxes: 'Cópias idênticas de infocaixas retiradas', repeatedFooterTemplates: 'Chamadas finais idênticas retiradas',
        relocatedReferenceList: 'Lista global de referências posicionada no final', redundantReferenceLists: 'Chamadas redundantes de referências retiradas',
        emptyEndHeadings: 'Títulos vazios das seções finais retirados', rendererHeadingPreserved: 'Listas sem cabeçalho preservadas na conversão',
        markdownWrappers: 'Invólucros de Markdown do artigo inteiro retirados', obsoleteShortDescriptionCategories: 'Categoria antiga de descrição curta retirada', doubleEncodedAmpersands: 'Dupla codificação do e comercial corrigida',
        verifiedParameterTypos: "Erros conhecidos de parâmetros corrigidos", missingCitationSeparators: "Separadores de citações recuperados", journalSections: "Cadernos de jornais adaptados", verifiedDOIRepairs: "DOI conferidos no registro corrigidos", legacyReferenceColumns: "Parâmetros antigos de colunas retirados", headingLinks: "Ligações duplicadas de cabeçalhos simplificadas", shortCitationAuthors: "Autores de citações curtas separados", missingNoteCollector: "Lista de notas ausente recuperada",
        headingMainArticles: "Remissões colocadas após os títulos das seções", portugueseLinkNames: "Nomes portugueses confirmados em ligações", historicalDates: "Anos e séculos com predefinições", captionPeriods: "Ponto final de legendas ajustado", centurySyntax: "Chaves de predefinição de século corrigidas",
        tableYearSections: "Subtítulos anuais colocados fora das tabelas", tableSpanRepairs: "Extensões de células de tabela corrigidas", tableSyntaxRepairs: "Separadores de atributos de tabela corrigidos", tableHeaderScopes: "Alcance de cabeçalhos de tabela informado",
        occupationCase: 'Profissões comuns com inicial minúscula', automaticSpelling: 'Grafias inequívocas corrigidas', automaticBiographyPortals: 'Portais de biografias acrescentados', livingBirthAge: 'Idade na data de nascimento habilitada', neutralReferenceNames: 'Nomes automáticos de referências simplificados',
        identicalReferences: 'Referências idênticas reutilizadas', parameterDuplicates: 'Parâmetros idênticos consolidados',
        automaticParameterNames: 'Nomes inválidos de parâmetros corrigidos', emptyInvalidParameters: 'Parâmetros inválidos vazios retirados',
        referenceColumns: 'Referências em duas colunas',
        numericRefNames: 'Nomes numéricos de referências corrigidos',
        translatedTemplates: 'Modelos de outras Wikipédias adaptados',
        translatedNamespaces: 'Espaços nominais de arquivos e categorias',
        translatedImageOptions: 'Opções de imagens adaptadas',
        translatedMagicwords: 'Palavras mágicas de outras línguas adaptadas',
        unifiedNotesReferences: 'Notas e referências reunidas',
        endMatterColumns: 'Colunas das listas finais ajustadas',
        auxiliaryParameters: 'Parâmetros de predefinições auxiliares',
        citationNames: 'Nomes das predefinições de citação',
        citationParameters: 'Parâmetros de citação',
        duplicateParameters: 'Parâmetros repetidos com valores iguais',
        dates: 'Datas de citações', identifiers: 'Identificadores e páginas',
        singleLine: 'Citações em uma linha', links: 'Ligações internas',
        urlLinks: 'URLs da ptwiki convertidas em ligações internas',
        headings: 'Títulos de seções', referenceLists: 'Listas e títulos de referências',
        refAttributes: 'Sintaxe de referências', namedRefs: 'Definições e chamadas de referências',
        shortDescriptions: 'Chamadas de descrição curta removidas',
        biographyPortal: 'Portal de biografias acrescentado',
        portals: 'Portal convertido para Portal3', birthDates: 'Data de nascimento padronizada',
        whitespace: 'Linhas vazias após remoção de descrição curta',
        obsoleteTemplates: 'Predefinições obsoletas substituídas ou removidas',
        infoboxParameters: 'Parâmetros de infocaixas corrigidos',
        infoboxDuplicates: 'Parâmetros equivalentes de infocaixas consolidados',
        authors: 'Autores e editores', citationCleanup: 'Limpeza de citações',
        bareReferences: 'Ligações em referências convertidas em citações',
        markup: 'Formatação do código', categories: 'Categorias e imagens',
        authorityControl: 'Controle de autoridade acrescentado com dados confirmados',
        endTemplateOrder: 'Predefinições finais e categorias ordenadas', endSectionOrder: 'Seções finais ordenadas',
        endMatter: 'Organização das seções finais', maintenance: 'Predefinições de manutenção',
        shortcuts: 'Atalhos explícitos', referencePunctuation: 'Posição das referências'
    };
    function ownDictionary(values) { return Object.assign(Object.create(null), values); }
    const CITE_NAMES = ownDictionary({
        'cite web': 'Citar web', 'cite book': 'Citar livro',
        'cite journal': 'Citar periódico', 'cite magazine': 'Citar revista',
        'cite conference': 'Citar conferência', 'cite thesis': 'Citar tese',
        'cite news': 'Citar jornal', 'citation': 'Citation',
        'citar web': 'Citar web', 'citar livro': 'Citar livro',
        'citar periódico': 'Citar periódico', 'citar periodico': 'Citar periódico',
        'citar jornal': 'Citar jornal', 'citar notícia': 'Citar jornal',
        'citar revista': 'Citar revista', 'citar magazine': 'Citar revista',
        'citar conferência': 'Citar conferência', 'citar tese': 'Citar tese'
    });
    const PARAMS = ownDictionary({
        title: 'título', titulo: 'título', author: 'autor', authors: 'autores',
        last: 'último', first: 'primeiro', 'author-link': 'autorlink', authorlink: 'autorlink',
        'editor-last': 'editor-sobrenome', 'editor-first': 'editor-nome',
        'editor-último': 'editor-sobrenome', 'editor-primeiro': 'editor-nome',
        editor: 'editor', editors: 'editores', 'display-authors': 'numero-autores',
        'display-editors': 'numero-editores', 'access-date': 'acessodata', accessdate: 'acessodata',
        'archive-url': 'arquivourl', archiveurl: 'arquivourl',
        'archive-date': 'arquivodata', archivedate: 'arquivodata',
        'dead-url': 'urlmorta', deadurl: 'urlmorta', date: 'data', year: 'ano',
        'publication-date': 'data-publicação', 'publication-place': 'local-publicação',
        publisher: 'publicado', 'publicado por': 'publicado', location: 'local',
        place: 'local', work: 'obra', journal: 'periódico', newspaper: 'jornal',
        magazine: 'periódico', language: 'língua', pages: 'páginas', page: 'página',
        issue: 'número', number: 'número', edition: 'edição', chapter: 'capítulo',
        'chapter-url': 'capítulourl', 'chapterurl': 'capítulourl',
        'capitulo-url': 'capítulourl', 'capítulo-url': 'capítulourl',
        'capitulourl': 'capítulourl', series: 'série', conference: 'conferência',
        format: 'formato', type: 'tipo',
        'orig-year': 'anooriginal', origyear: 'anooriginal', 'trans-title': 'titulotrad',
        'trans-chapter': 'capítulo-trad', 'subscription': 'subscricao',
        'registration': 'registro', 'quote': 'citação'
    });
    const DATE_KEYS = new Set(['data', 'ano', 'acessodata', 'arquivodata', 'data-publicação']);
    const MONTHS = ownDictionary({
        january: 1, jan: 1, enero: 1, ene: 1, janeiro: 1,
        february: 2, feb: 2, febrero: 2, fev: 2, fevereiro: 2,
        march: 3, mar: 3, marzo: 3, março: 3, marco: 3,
        april: 4, apr: 4, abril: 4, abr: 4, may: 5, mayo: 5, mai: 5, maio: 5,
        june: 6, jun: 6, junio: 6, junho: 6, july: 7, jul: 7, julio: 7, julho: 7,
        august: 8, aug: 8, agosto: 8, ago: 8,
        september: 9, sep: 9, sept: 9, septiembre: 9, setembro: 9, set: 9,
        october: 10, oct: 10, octubre: 10, outubro: 10, out: 10,
        november: 11, nov: 11, noviembre: 11, novembro: 11,
        december: 12, dec: 12, diciembre: 12, dezembro: 12, dez: 12
    });
    const MONTH_PT = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    // AJG_STATIC_CATALOG_START
    const CATALOG_DATE = '2026-10-14';
    function unpackCatalogProfiles(data, type) {
        function string(i) {
            if(typeof data.s[i]==='string')return data.s[i];
            const [base,number]=data.s[i];return data.s[i]=string(base).replace('#',String(number));
        }
        const names=list=>data.l[list].map(string);
        const pairs=index=>ownDictionary(Object.fromEntries(data.m[index].map(([k,v])=>[string(k),string(v)])));
        const record=values=>({title:string(values[0]),oldid:values[1],timestamp:string(values[2]),source:'https://pt.wikipedia.org/w/index.php?oldid='+values[1]});
        return ownDictionary(Object.fromEntries(data[type].map(r=>[string(r[0]),{
            title:string(r[1]),oldid:r[2],timestamp:string(r[3]),source:'https://pt.wikipedia.org/w/index.php?oldid='+r[2],
            accepted:names(r[4]),patterns:names(r[5]),aliases:pairs(r[6]),renames:pairs(r[7]),report:pairs(r[8]),partial:!!r[9],
            dependencies:data.l[r[10]].map(i=>record(data.d[i])),redirectTo:string(r[11]) || undefined,
            ignored:names(r[12]),obsolete:string(r[13]) || undefined,
            method:'Código público atual e módulos declarados. Campos dinâmicos ficam como catálogo parcial.'
        }])));
    }

    const PACKED_PTWIKI_CATALOG = root.RevisaWikiDataV2.packed.ptwiki;
    const INFOBOX_CATALOG = unpackCatalogProfiles(PACKED_PTWIKI_CATALOG,'b');
    const OBSOLETE_CATALOG = ownDictionary({"descrição curta":{"action":"remove_top_level","replacement":null,"source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ADescri%C3%A7%C3%A3o_curta&oldid=73027042","oldid":73027042},"sem interwiki":{"action":"remove_top_level","replacement":null,"source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ASem_interwiki&oldid=59142603","oldid":59142603},"nascimento":{"action":"replace","replacement":"Dni","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ANascimento&oldid=46237215","oldid":46237215},"birth date":{"action":"replace","replacement":"Dni","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ABirth_date&oldid=58362992","oldid":58362992},"birth date and age":{"action":"replace","replacement":"Dni","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ABirth_date_and_age&oldid=58365541","oldid":58365541},"birth date and age2":{"action":"manual","replacement":"Dni plus Idade","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ABirth_date_and_age2&oldid=66167405","oldid":66167405},"falecimento":{"action":"replace","replacement":"Morte","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AFalecimento&oldid=50216720","oldid":50216720},"falecimento e idade":{"action":"replace","replacement":"Morte","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AFalecimento_e_idade&oldid=50216928","oldid":50216928},"morte e idade":{"action":"replace","replacement":"Morte","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AMorte_e_idade&oldid=60787871","oldid":60787871},"death date":{"action":"replace","replacement":"Morte","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ADeath_date&oldid=58364211","oldid":58364211},"death date and age":{"action":"replace","replacement":"Morte","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ADeath_date_and_age&oldid=50557924","oldid":50557924},"língua":{"action":"replace","replacement":"Língua-meta","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AL%C3%ADngua&oldid=50648627","oldid":50648627},"politônico":{"action":"replace","replacement":"Lang","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3APolit%C3%B4nico&oldid=50648637","oldid":50648637},"tabela bonita":{"action":"replace_literal","replacement":"class=\"wikitable\"","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ATabela_bonita&oldid=62130283","oldid":62130283},"outrosusos":{"action":"replace","replacement":"Ver desambig","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AOutrosusos&oldid=47200509","oldid":47200509},"desambigexplicada":{"action":"replace","replacement":"Ver desambig","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ADesambigexplicada&oldid=47200506","oldid":47200506},"minidesambig":{"action":"replace","replacement":"Ver desambig","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AMinidesambig&oldid=68652697","oldid":68652697},"ver desambiguação2":{"action":"replace","replacement":"Ver desambig","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AVer_desambigua%C3%A7%C3%A3o2&oldid=29025814","oldid":29025814},"reflist":{"action":"replace","replacement":"Referências","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AReflist&oldid=56151616","oldid":56151616},"sem imagem-biografia":{"action":"replace_maintenance","replacement":"Sem imagem","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ASem_imagem-biografia&oldid=68137574","oldid":68137574},"azul":{"action":"replace","replacement":"Cor do texto","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AAzul&oldid=34119719","oldid":34119719},"branco":{"action":"replace","replacement":"Cor do texto","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ABranco&oldid=66607737","oldid":66607737},"preto":{"action":"replace","replacement":"Cor do texto","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3APreto&oldid=70788907","oldid":70788907},"divref-ini":{"action":"manual","replacement":"Referências","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ADivref-ini&oldid=59088636","oldid":59088636},"cite doi":{"action":"manual","replacement":"Citar periódico","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ACite_doi&oldid=64406778","oldid":64406778},"cite jstor":{"action":"manual","replacement":"Citar periódico","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ACite_jstor&oldid=64406730","oldid":64406730},"ref":{"action":"manual","replacement":"ref/references tags","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ARef&oldid=62110895","oldid":62110895},"ref label":{"action":"manual","replacement":"ref/references tags","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ARef_label&oldid=60788183","oldid":60788183},"nota":{"action":"manual","replacement":"ref/references tags","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ANota&oldid=62110897","oldid":62110897},"tradução integral":{"action":"manual","replacement":"Traduzido on talk page","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ATradu%C3%A7%C3%A3o_integral&oldid=60929095","oldid":60929095},"destaque":{"action":"manual","replacement":"Destaca","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3ADestaque&oldid=65702206","oldid":65702206},"d.":{"action":"manual","replacement":"Lknb","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AD.&oldid=65773196","oldid":65773196},"código língua":{"action":"manual","replacement":"Língua-meta","source":"https://pt.wikipedia.org/w/index.php?title=Predefini%C3%A7%C3%A3o%3AC%C3%B3digo_l%C3%ADngua&oldid=59083682","oldid":59083682}});
    const TEMPLATE_CATALOG = unpackCatalogProfiles(PACKED_PTWIKI_CATALOG,'t');
    for(const patch of [{"key":"info/astronauta","target":"info/biografia","exclude":["child","embed","tipo","ocupação","ocupação_atual","ocupação_anterior","patente","hierarquia","tempo","tempo_espaço","tempo_voo","seleção","tempo_AEV","tempo_aev","missão","missões","insígnia","aposentadoria","memoriais"],"aliasKeys":["módulo"]},{"key":"info/motociclista","target":"info/biografia","exclude":[],"aliasKeys":[]},{"key":"info/personalidade de mídia social","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/canal do youtube","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/celebridades da internet","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/instagrammer","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/personalidades da internet","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/streamer","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/tiktoker","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/twitch","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]},{"key":"info/youtuber","target":"info/biografia","exclude":["módulo","módulo2","módulo3","módulo4","módulo5","módulo6","logo","logotipo","legenda_logo","legenda_logotipo","tamanho_logo","tamanho_logotipo","gênero","atualização_estatísticas","alt_logo","alt_logotipo",""],"aliasKeys":["pseudônimo","pseudónimo"]}]){const p=INFOBOX_CATALOG[patch.key],base=INFOBOX_CATALOG[patch.target]||TEMPLATE_CATALOG[patch.target];if(base){const excluded=new Set(patch.exclude);p.accepted=[...new Set([...p.accepted,...base.accepted.filter(k=>!excluded.has(k)),...patch.aliasKeys])].sort();}p.partial=true;}

    const MAGIC_WORDS = new Set(["!","#bcp47","#contentmodel","#default","#dir","#formal:","#idioma","#interlanguagelink","#interwikilink","#isbn","#language","#padrao","#padrão","#redirecionamento","#redirect","$1px","=","a/ya","abaixo","abreviaturadomesatual","abreviaturadomeslocal","acima","all","alt=$1","anchorencode","anoatual","anodarevisao","anodarevisão","anolocal","archivedtalk","arg:","articlepagename","articlepagenamee","articlepath","articlespace","articlespacee","assessment","aya","babel","baseline","basepagename","basepagenamee","bcp47","bidi","bidi:","borda","border","both","bottom","calendar","caminho","caminhodoarquivo","caminhodoscript","canonical","canonicalurl","canonicalurl:","canonicalurle","canonicalurle:","cascadingsources","categoriaoculta","categorysort","categorysort rtimestamp","categorysort timestamp","categorysort:","categorytree","catoculta","center","centre","centro","chart","chart arg","chart data","class=$1","codificaancora:","codificaurl:","codificaâncora:","comborda","commaseparatedlist","commoldura","communityrequests","comprimento","contentlang","contentlanguage","contentmodel","contentmodel canonical","contentmodel local","coordinates","count","currentday","currentday2","currentdayname","currentdow","currenthour","currentmonth","currentmonth1","currentmonth2","currentmonthabbrev","currentmonthname","currentmonthnamegen","currenttime","currenttimestamp","currentversion","currentweek","currentyear","data","date","dateformat","dd2dms","default","defaultcategorysort:","defaultsort","defaultsort noerror","defaultsort noreplace","defaultsort:","defaultsortkey:","deg2dd","diaatual","diaatual2","diadarevisao","diadarevisao2","diadarevisão","diadarevisão2","diadasemanaatual","diadasemanalocal","dialocal","dialocal2","dir","directionmark","direita","dirmark","disablecontrols=$1","disambig","disambiguation","displaytitle","displaytitle noerror","displaytitle noreplace","dominio","dominioc","domínio","domínioc","e","e/","e/ga","ega","end=$1","enframed","espaconominal","espaconominalc","espaçonominal","espaçonominalc","esquerda","eul/ruel","eulruel","eun/neun","eunneun","euro","euro/ro","exibetitulo","exibetítulo","expected unconnected page","expectedunconnectedpage","expectshortpage","expectunusedcategory","expectunusedtemplate","expectwithoutscans","explode","expr","filepath","filepath:","files","forcarsumario","forcartdc","forcetoc","formal","formatdate","formatnum","forçarsumário","forçartdc","frame","framed","frameless","fullpagename","fullpagenamee","fullurl","fullurl:","fullurle","fullurle:","function","gender","gender:","genero","geolink","grammar","grammar:","gwa/wa","gwawa","gênero","hiddencat","horaatual","horalocal","horarioatual","horariolocal","iddarevisao","iddarevisão","idiomadoconteudo","idiomadoconteúdo","if","ifeq","iferror","ifexist","ifexpr","img alt","img baseline","img border","img bottom","img center","img class","img framed","img frameless","img lang","img left","img link","img lossy","img manualthumb","img middle","img none","img page","img right","img sub","img super","img text bottom","img text top","img thumbnail","img top","img upright","img width","index","indexar","insider","int","int:","interlanguagelink","interwikilink","invocar","invoke","isbn","isin","keeptitle","lang=$1","language","language option bcp47","lc","lc:","lcfirst","lcfirst:","left","len","ligacaodenovasecao","ligação=$1","ligaçãodenovaseção","linhadebase","link=$1","linkdenovasecao","linkdenovaseção","local","localday","localday2","localdayname","localdow","localhour","localmonth","localmonth1","localmonth2","localmonthabbrev","localmonthname","localmonthnamegen","localtime","localtimestamp","localurl","localurl:","localurle","localurle:","localweek","localyear","loop","lossless","lossy=$1","lqtpagelimit","lst","lsth","lstx","magic count all","magic count functions","magic count implementations","magic count languages","magic count testers","magic count types","maiuscula","maiusculas","maiúscula","maiúsculas","meio","mentor","mesatual","mesatual1","mesatual2","mesatualabrev","mesatualabreviado","mesdarevisao","meslocal","meslocal1","meslocalabrev","meslocalabreviado","middle","miniatura","miniatura=$1","miniaturadaimagem","miniaturadaimagem=$1","minuscula","minusculas","minúscula","minúsculas","msg","msg:","msgnw","msgnw:","muted","mêsdarevisão","namespace","namespacee","namespacenumber","naoeditarsecao","naoindexar","naointerwikis","nenhum","newsectionlink","niveldeprotecao","nocc","nocommafysuffix","nocontentconvert","noeditsection","noerror","noexternallanglinks","nogallery","noglobal","noindex","nomecompletodapagina","nomecompletodapaginac","nomecompletodapágina","nomecompletodapáginac","nomedapagina","nomedapaginabase","nomedapaginabasec","nomedapaginac","nomedapaginadeconteudo","nomedapaginadeconteudoc","nomedapaginadediscussao","nomedapaginadediscussaoc","nomedapágina","nomedapáginabase","nomedapáginabasec","nomedapáginac","nomedapáginadeconteúdo","nomedapáginadeconteúdoc","nomedapáginadediscussão","nomedapáginadediscussãoc","nomedasubpagina","nomedasubpaginac","nomedasubpágina","nomedasubpáginac","nomediaviewercarousel","nomedodiaatual","nomedodialocal","nomedomesatual","nomedomeslocal","nomedoservidor","nomedosite","nomedositio","nomedosítio","none","nonewsectionlink","noreplace","nosep","notalk","notc","notitleconvert","notoc","ns","ns:","nse","nse:","numberingroup","numberofactiveusers","numberofadmins","numberofarticles","numberofedits","numberoffiles","numberoffunctions","numberofimplementations","numberoflanguages","numberofobjects","numberofpages","numberoftestcases","numberoftypes","numberofusers","numberofwikis","numerodeadministradores","numerodearquivos","numerodeartigos","numerodeedicoes","numerodepaginas","numerodeusuarios","numerodeusuariosativos","numeronogrupo","numingroup","nãoeditarseção","nãoindexar","níveldeproteção","númerodeadministradores","númerodearquivos","númerodeartigos","númerodeedições","númerodepáginas","númerodeusuários","númerodeusuáriosativos","númeronogrupo","ordempadrao","ordempadrão","ordenacaopadrao","ordenaçãopadrão","padleft","padright","page $1","page=$1","pagebanner","pageid","pagelanguage","pagename","pagenamee","pages","pagesincat","pagesincategory","pagesincategory all","pagesincategory files","pagesincategory pages","pagesincategory subcats","pagesinnamespace","pagesinnamespace:","pagesinns:","pagesize","pagesusingpendingchanges","paginadeconteudo","paginadeconteudoc","paginadeconteúdo","paginadeconteúdoc","paginadediscussao","paginadediscussaoc","paginasnacat","paginasnacategoria","paginasnodominio","paginasnoespaconominal","partesdotitulo","partesdotítulo","path","pendingchangelevel","phonos","plural","plural:","pos","pretty","primary","primeiramaiuscula:","primeiramaiúscula:","primeiraminuscula:","primeiraminúscula:","property","propriedade","protectionexpiry","protectionlevel","página $1","página=$1","páginadediscussão","páginadediscussãoc","páginasnacat","páginasnacategoria","páginasnodomínio","páginasnoespaçonominal","query","r","raw","raw:","rawsuffix","redirecionamentoestatico","redirecionamentoestático","redirect","rel2abs","related","replace","revisaoatual","revisionday","revisionday2","revisionid","revisionmonth","revisionmonth1","revisionsize","revisiontimestamp","revisionuser","revisionyear","revisãoatual","right","rootpagename","rootpagenamee","rpos","rtimestamp","safesubst","safesubst:","scriptpath","se","section","section-h","section-x","seerro","seexiste","seexpr","seigual","semanaatual","semanalocal","semborda","semcc","semconverterconteudo","semconverterconteúdo","semconvertertitulo","semconvertertítulo","semct","semeditarsecao","semeditarseção","semgaleria","semligacaodenovasecao","semligaçãodenovaseção","semlinkdenovasecao","semlinkdenovaseção","semmoldura","semsumário","semtdc","server","servername","servidor","shortdesc","shortdesc noreplace","sitename","special","speciale","start=$1","statements","staticredirect","stylepath","sub","subcats","subjectpagename","subjectpagenamee","subjectspace","subjectspacee","subpagename","subpagenamee","subst","subst:","sumario","sumário","sup","super","superiordireito","superiordireito $1","superiordireito=$1","switch","switchcountry","switchlanguage","tag","talkpagename","talkpagenamee","talkspace","talkspacee","tamanhodapagina","tamanhodapágina","target","tdc","text-bottom","text-top","thumb","thumb=$1","thumbnail","thumbnail=$1","thumbtime=$1","time","timedmedia disablecontrols","timedmedia endtime","timedmedia loop","timedmedia muted","timedmedia starttime","timedmedia thumbtime","timef","timef-both","timef-date","timef-pretty","timef-time","timefl","timel","timestamp","titleparts","toc","top","translatablepage","translation","trecho","trecho-x","uc","uc:","ucfirst","ucfirst:","uic","upright","upright $1","upright=$1","url path","url query","url wiki","urlcompleto:","urlcompletoc:","urldecode","urlencode","urlencode:","useliquidthreads","userinfocard","userlanguage","usertestwiki","usuariodarevisao","usuáriodarevisão","wbreponame","wiki","wikifunctionlabel","wikifunctionlabeldesc"]);
    // AJG_STATIC_CATALOG_END

    const CS1_KEYS = ["ARXIV", "ASIN", "Autor#", "Coleção", "DOI", "EISSN", "Editora", "Edição", "HDL", "ID", "ISBN", "ISBN13", "ISMN", "ISSN", "JFM", "JSTOR", "LCCN", "Local de publicação", "MR", "Notas", "Numero", "OCLC", "OL", "OSTI", "PMC", "PMID", "Página", "RFC", "S2CID", "SSRN", "Subtítulo", "Título", "URL", "ZBL", "access-date", "accessdate", "accessodata", "acessadoem", "acessdate", "acesso", "acesso-data", "acesso-url", "acessodata", "acessomesdia", "acessourl", "agencia", "agency", "agência", "air-date", "airdate", "ano", "anooriginal", "apelido", "apelido#", "apellido", "apellido#", "apellidos", "apellidos#", "archive-date", "archive-format", "archive-url", "archivedate", "archiveurl", "argumentistas", "arquivo-data", "arquivo-url", "arquivodata", "arquivoformato", "arquivourl", "article", "article-format", "article-number", "article-url", "article-url-access", "artigo", "arxiv", "asin", "asin-tld", "at", "author", "author#", "author#-first", "author#-last", "author#-link", "author#-mask", "author#link", "author#mask", "author-first", "author-first#", "author-last", "author-last#", "author-link", "author-link#", "author-mask", "author-mask#", "authorlink", "authorlink#", "authormask", "authormask#", "authors", "autor", "autor#", "autor-link", "autor-mascara", "autor-mascara#", "autores", "autorlink", "autorlink#", "año", "bibcode", "bibcode-access", "biorxiv", "book-title", "booktitle", "call-sign", "callsign", "capitulo", "capitulo-translit", "capítulo", "capítulo-trad", "capítulo-url", "capítulourl", "cartography", "chapter", "chapter-format", "chapter-url", "chapter-url-access", "chapterurl", "cidade", "cita", "citacao", "citar", "citation", "citação", "citeseerx", "city", "class", "classe", "coauthor", "coauthors", "coautor", "coautores", "codling", "cognome", "cognome#", "colaboração", "colecao", "coleção", "collaboration", "conference", "conference-format", "conference-url", "conferenceurl", "conferencia", "conferencia-url", "conferência", "conferência-url", "consulta", "contribuicao", "contribuidor", "contribuidor#-primeiro", "contribuidor#-ultimo", "contribuidor-link#", "contribuidor-mascara", "contribuidor-mascara#", "contribuidor-primeiro#", "contribuidor-ultimo#", "contribuição", "contribution", "contribution-format", "contribution-url", "contributionurl", "contributor", "contributor#-first", "contributor#-last", "contributor#-mask", "contributor-first", "contributor-first#", "contributor-last", "contributor-last#", "contributor-link", "contributor-link#", "contributor-mask", "contributor-mask#", "credits", "créditos", "data", "data-publicacao", "data-publicação", "data-resumo", "data2", "dataaccesso", "dataacesso", "datali", "date", "dateformat", "dead-url", "deadurl", "degree", "departamento", "department", "df", "diccionario", "dicionario", "dicionário", "dictionary", "display-authors", "display-editors", "display-interviewers", "display-subjects", "display-translators", "displayauthors", "displayeditors", "docket", "doi", "doi-access", "doi-broken", "doi-broken-date", "doi-inactive-date", "doi-incorrecto", "doi_brokendate", "ed", "edicao", "edición", "edition", "editor", "editor#", "editor#-first", "editor#-given", "editor#-last", "editor#-link", "editor#-mask", "editor#-surname", "editor#link", "editor#mask", "editor-first", "editor-first#", "editor-given", "editor-given#", "editor-last", "editor-last#", "editor-link", "editor-link#", "editor-mascara", "editor-mascara#", "editor-mask", "editor-mask#", "editor-nome", "editor-nome#", "editor-primeiro#", "editor-sobrenome", "editor-sobrenome#", "editor-surname", "editor-surname#", "editora", "editores", "editorial", "editorlink", "editorlink#", "editormask", "editormask#", "editors", "edição", "eissn", "em", "embargo", "en", "enciclopaedia", "enciclopedia", "enciclopédia", "encyclopaedia", "encyclopedia", "entrevistado", "entrevistado#", "entrevistadolink", "entrevistadolink#", "entrevistador", "entrevistadores", "entry", "entry-format", "entry-url", "entry-url-access", "episode", "episode-link", "episodelink", "episódio", "episódiolink", "eprint", "escala", "estacao", "estação", "event", "event-format", "event-url", "evento", "eventurl", "expediente", "fecha", "fecha-publicación", "fechaacceso", "first", "first#", "folha", "folhas", "fonte-resumo", "format", "formato", "formato-arquivo", "formato-autor", "formato-capitulo", "formato-conferencia", "formato-conferência", "formato-editor", "formato-lista-nomes", "formato-resumo", "given", "given#", "grau", "grupo-noticias", "hdl", "hdl-access", "host", "host#", "id", "id-mensagem", "idioma", "idioma2", "idioma3", "idioma4", "in", "indicativo", "inset", "instituicao", "instituição", "institution", "interviewer", "interviewers", "isbn", "isbn13", "isbn2", "isbn3", "ismn", "issn", "issue", "jfm", "jornal", "journal", "jstor", "jstor-access", "lang", "language", "last", "last#", "last-author-amp", "lastauthoramp", "lay-date", "lay-format", "lay-source", "lay-summary", "lay-url", "lccn", "legenda", "li", "ligação inactiva", "ligação inativa", "ling", "lingua", "lingua2", "lingua3", "lingua4", "local", "local-publicacao", "local-publicação", "localização", "location", "lugar", "lugar-publicación", "língua", "língua2", "língua3", "língua4", "magazine", "mailing-list", "map", "map-format", "map-url", "map-url-access", "mapa", "mapa-formato", "mapa-url", "medio", "medium", "mensagem-id", "mes", "message-id", "minutes", "minuto", "minutos", "mode", "modo", "month", "mr", "mês", "name-list-format", "name-list-style", "network", "newsgroup", "newspaper", "no-pp", "no-tracking", "nocaps", "nocat", "nombre", "nombre#", "nome", "nome#", "nomedoi", "nopp", "nota", "notas", "notracking", "number", "numero", "numero-autores", "numero-editores", "numero-serie", "número", "obra", "oclc", "ol", "ol-access", "orig-date", "orig-year", "origyear", "osti", "osti-access", "others", "otros", "outros", "p", "page", "pages", "pagina", "paginas", "people", "periodical", "periodico", "periódico", "persona", "personas", "pessoas", "place", "pmc", "pmid", "pontofinal", "postscript", "pp", "prenome", "prenome#", "primeiro", "primeiro#", "produtora", "program", "programa", "publicacao", "publicación", "publicado", "publicado por", "publicadopor", "publication-date", "publication-place", "publicationplace", "publicação", "publisher", "página", "páginas", "quotation", "quote", "rede", "ref", "registo", "registration", "registro", "requadro", "resumo", "resumo-data", "resumo-fonte", "resumo-formato", "resumo-url", "revista", "rfc", "rotulodoi", "rótulodoi", "s2cid", "s2cid-access", "script-chapter", "script-journal", "script-magazine", "script-map", "script-newspaper", "script-periodical", "script-title", "script-website", "script-work", "season", "secao", "seccao", "seccoes", "secoes", "section", "section-format", "section-url", "sections", "separador-series", "serie", "series", "series-link", "series-no", "series-number", "serieslink", "seção", "seções", "sheet", "sheets", "site", "sobrenome", "sobrenome#", "ssrn", "station", "subject", "subject#", "subject#-link", "subject-link", "subject-link#", "subject-mask", "subjectlink#", "subscricao", "subscription", "subscrição", "subtitulo", "subtítulo", "sujeito", "sujeito#", "sujeitolink", "sujeitolink#", "surname", "surname#", "suscripción", "série", "sérielink", "séries", "template doc demo", "template-doc-demo", "tempo", "temporada", "tiempo", "time", "tipo", "title", "title-link", "titlelink", "titlo", "titulo", "titulo-translit", "titulolink", "titulolivro", "titulotrad", "total-paginas", "total-páginas", "trabalho", "trad-capitulo", "tradutor", "tradutor#", "tradutor#-link", "tradutor#-mascara", "tradutor#-primeiro", "tradutor#-ultimo", "tradutor-link", "tradutor-link#", "tradutor-mascara", "tradutor-mascara#", "tradutor-primeiro", "tradutor-primeiro#", "tradutor-sobrenome", "tradutor-ultimo", "tradutor-ultimo#", "trans-article", "trans-chapter", "trans-contribution", "trans-entry", "trans-journal", "trans-magazine", "trans-map", "trans-newspaper", "trans-periodical", "trans-quote", "trans-section", "trans-title", "trans-website", "trans-work", "trans_chapter", "trans_title", "transcricao", "transcricao-formato", "transcricaourl", "transcript", "transcript-format", "transcripturl", "transcrição", "transcrição-formato", "transcriçãourl", "translator", "translator#", "translator#-first", "translator#-given", "translator#-last", "translator#-link", "translator#-mask", "translator-first", "translator-first#", "translator-given#", "translator-last", "translator-last#", "translator-link", "translator-link#", "translator-mask", "translator-mask#", "translator-surname", "transmissão", "type", "título", "título-livro", "título-trad", "título-translit", "títulolink", "títulolivro", "títulotrad", "ultimo", "ultimo#", "ultimoamp", "universidade", "url", "url-access", "url-capítulo", "url-resumo", "url-secao", "url-seção", "url-status", "url_seção", "urlarchivo", "urlarquivo", "urlcapitulo", "urlcapítulo", "urlconferencia", "urlconferência", "urlmorta", "urltranscricao", "vauthors", "vautores", "veditores", "veditors", "version", "versão", "via", "volume", "volumen", "wayb", "website", "work", "year", "zbl", "último", "último#"];
    const CITATION_KEY_CATALOG = ownDictionary({"citar iucn": ["acessadoem", "acessoano", "acessodata", "acessodiames", "acessomesdia", "ano", "anoIUCN1", "assessores", "title", "titulo", "título"], "citar tweet": ["access-date", "accessdate", "acessodata", "archive-date", "archive-url", "archivedate", "archiveurl", "arquivodata", "arquivourl", "author", "author-link", "authorlink", "autor", "autorlink", "data", "date", "dead-url", "deadurl", "idioma", "language", "ligacao", "ligação", "lingua", "linguagem", "link", "língua", "no-tracking", "nocat", "notracking", "number", "numero", "número", "others", "outros", "retweet", "script-title", "template doc demo", "template-doc-demo", "title", "titulo", "titulo-translit", "titulotrad", "trans-title", "tweet", "tweet-translit", "tweettrad", "título", "título-translit", "títulotrad", "urlmorta", "user", "usuario", "usuário", "utilizador"], "citar rotten tomatoes": ["access-date", "accessdate", "acesso-data", "acessodata", "archive-date", "archive-url", "archivedate", "archiveurl", "arquivo-data", "arquivo-url", "arquivodata", "arquivourl", "data", "date", "dead-url", "deadurl", "episode", "episódio", "esconder_publicado", "id", "language", "local", "location", "língua", "mode", "publicado", "publisher", "publisher_hide", "ref", "script-title", "season", "temporada", "tipo", "title", "titulo", "titulo-translit", "titulotrad", "trans-title", "type", "título", "título-translit", "títulotrad", "url-status", "urlmorta"], "citar metacritic": ["access-date", "accessdate", "acesso-data", "acessodata", "archive-date", "archive-url", "archivedate", "archiveurl", "arquivo-data", "arquivo-url", "arquivodata", "arquivourl", "data", "datali", "date", "dead-url", "deadurl", "esconder_publicado", "id", "jogotipo", "language", "lingua", "local", "location", "língua", "mode", "modo", "publisher_hide", "ref", "script-title", "season", "temporada", "tipo", "title", "titulo", "titulo-translit", "titulotrad", "trans-title", "type", "título", "título-translit", "títulotrad", "url-status", "urlmorta", "vgtype"], "citar box office mojo": ["1", "access-date", "accessdate", "acesso-data", "acessodata", "archive-date", "archive-url", "archivedate", "archiveurl", "arquivo-data", "arquivo-url", "arquivodata", "arquivourl", "data", "date", "dead-url", "deadurl", "df", "esconder_publicado", "id", "language", "local", "location", "língua", "mode", "modo", "ocultar_publicado", "publisher_hide", "ref", "title", "titulo", "titulotrad", "trans-title", "título", "títulotrad", "url-status", "urlmorta"], "citar the numbers": ["access-date", "accessdate", "acesso-data", "acessodata", "archive-date", "archive-url", "archivedate", "archiveurl", "arquivo-data", "arquivo-url", "arquivodata", "arquivourl", "data", "datali", "date", "dead-url", "deadurl", "esconder_publicado", "id", "language", "lingua", "local", "location", "língua", "mode", "modo", "publisher_hide", "ref", "script-title", "title", "titulo", "titulo-translit", "titulotrad", "trans-title", "título", "título-translit", "títulotrad", "url-status", "urlmorta"]});
    // Famílias de regras reunidas dos três scripts, com análise de predefinições.
    Object.assign(CITE_NAMES, {
        'cita web': 'Citar web', 'citeweb': 'Citar web', 'citarweb': 'Citar web',
        'lien web': 'Citar web', 'ref-web': 'Citar web', 'webbref': 'Citar web',
        'cita libro': 'Citar livro', 'cite livro': 'Citar livro', 'citarlivro': 'Citar livro',
        'ouvrage': 'Citar livro', 'literatur': 'Citar livro', 'citar capítulo': 'Citar livro',
        'cite paper': 'Citar periódico', 'cite document': 'Citar periódico',
        'cite periodical': 'Citar periódico', 'cita publicación': 'Citar periódico',
        'cite encyclopedia': 'Citar enciclopédia', 'cite encyclopaedia': 'Citar enciclopédia',
        'cite av media': 'Citar vídeo', 'cite video': 'Citar vídeo',
        'cite av media notes': 'Citar vídeo notas', 'cite video game': 'Citar jogo eletrônico',
        'cite report': 'Citar relatório', 'cite techreport': 'Citar relatório técnico',
        'cite map': 'Citar mapa', 'cite mailing list': 'Citar lista de discussão',
        'cite newsgroup': 'Citar grupo de notícias', 'cite episode': 'Citar episódio',
        'cite serial': 'Citar série', 'cite speech': 'Citar discurso',
        'cite interview': 'Citar entrevista', 'cite press release': 'Citar comunicado de imprensa',
        'cite arxiv': 'Citar arXiv', 'cite tweet': 'Citar tweet', 'cite podcast': 'Citar podcast',
        'cite iucn': 'Citar IUCN', 'citar dissertação': 'Citar tese',
        'cite rotten tomatoes': 'Citar Rotten Tomatoes', 'cite rt': 'Citar Rotten Tomatoes',
        'citar rt': 'Citar Rotten Tomatoes', 'citar rotten tomatoes': 'Citar Rotten Tomatoes',
        'cite metacritic': 'Citar Metacritic', 'cite mc': 'Citar Metacritic',
        'citar mc': 'Citar Metacritic', 'citar metacritic': 'Citar Metacritic',
        'cite the numbers': 'Citar The Numbers', 'cite num': 'Citar The Numbers',
        'citar num': 'Citar The Numbers', 'citar the numbers': 'Citar The Numbers',
        'cite box office mojo': 'Citar Box Office Mojo', 'cite bom': 'Citar Box Office Mojo',
        'citar bom': 'Citar Box Office Mojo', 'citar box office mojo': 'Citar Box Office Mojo',
        'citar noticias': 'Citar jornal', 'citar notícias': 'Citar jornal',
        'cita noticia': 'Citar jornal', 'citar diário': 'Citar jornal',
        'cite newspaper': 'Citar jornal', 'citar publicação': 'Citar revista'
    });
    ['enciclopédia', 'vídeo', 'vídeo notas', 'jogo eletrônico', 'relatório', 'relatório técnico',
        'mapa', 'lista de discussão', 'grupo de notícias', 'episódio', 'série', 'discurso',
        'entrevista', 'comunicado de imprensa', 'arXiv', 'tweet', 'podcast', 'IUCN'].forEach(n => {
        CITE_NAMES[norm('Citar ' + n)] = 'Citar ' + n;
    });
    Object.assign(PARAMS, {
        fecha: 'data', datum: 'data', año: 'ano', 'accesso-data': 'acessodata',
        'acesso-data': 'acessodata', accessodata: 'acessodata', acessadoem: 'acessodata',
        'fechaacceso': 'acessodata', 'fecha de acceso': 'acessodata',
        'archive-date': 'arquivodata', 'arquivo-data': 'arquivodata',
        'arquivo-url': 'arquivourl', 'url-arquivo': 'arquivourl', urlarquivo: 'arquivourl',
        urlcapítulo: 'capítulourl', urlcapitulo: 'capítulourl', 'url-capítulo': 'capítulourl',
        'capitulo': 'capítulo', 'editorial': 'editora', 'localização': 'local',
        ciudad: 'local', lugar: 'local', publicación: 'periódico',
        idioma: 'língua', lang: 'língua', linguagem: 'língua', lengua: 'língua',
        'língua': 'língua', lingua: 'língua', 'páginas': 'páginas', paginas: 'páginas',
        'página': 'página', pagina: 'página', edición: 'edição', edicao: 'edição',
        numero: 'número', número: 'número', volumen: 'volume', volumenes: 'volume',
        'sitio web': 'website', 'sitioweb': 'website', 'sítio': 'website',
        'urlacceso': 'acessourl', 'url-access': 'acessourl',
        'trans-title': 'titulotrad', 'título-trad': 'titulotrad',
        quote: 'citação', quotation: 'citação', cita: 'citação', citacao: 'citação',
        'orig-date': 'anooriginal', 'ano original': 'anooriginal',
        'editor-link': 'editorlink', 'translator-link': 'tradutor-link',
        'translator-first': 'tradutor-primeiro', 'translator-last': 'tradutor-ultimo',
        translator: 'tradutor',
        'author-first': 'primeiro', 'author-last': 'último',
        apellido: 'último', apellidos: 'último', surname: 'último',
        given: 'primeiro', prénom: 'primeiro', nombre: 'primeiro',
        priemiro: 'primeiro', primerio: 'primeiro', primeiro: 'primeiro',
        ultimo: 'último', 'último': 'último',
        'author-mask': 'autor-mascara', authormask: 'autor-mascara',
        'name-list-style': 'formato-lista-nomes', 'namelist-style': 'formato-lista-nomes',
        'last-author-amp': 'ultimoamp', 'postscript': 'pontofinal',
        'air-date': 'data', 'airdate': 'data', 'network': 'rede',
        'station': 'estação', 'minutes': 'minuto', 'minute': 'minuto',
        'season': 'temporada', 'episode': 'episódio', 'series-number': 'numero-serie',
        'isbn10': 'isbn', 'isbn13': 'isbn',
        'deadlink': 'urlmorta', 'dead-url': 'urlmorta',
        'subscription': 'subscricao', 'registration': 'registro'
    });
    DATE_KEYS.add('data-publicacao'); DATE_KEYS.add('data-emissão');
    const LANGUAGE_CODES = ownDictionary({
        english: 'en', inglês: 'en', ingles: 'en', portuguese: 'pt', português: 'pt',
        french: 'fr', francês: 'fr', français: 'fr', spanish: 'es', español: 'es', espanhol: 'es',
        german: 'de', alemão: 'de', deutsch: 'de', italian: 'it', italiano: 'it',
        japanese: 'ja', japonês: 'ja', chinese: 'zh', chinês: 'zh',
        russian: 'ru', russo: 'ru', dutch: 'nl', neerlandês: 'nl', holandês: 'nl',
        czech: 'cs', tcheco: 'cs', checo: 'cs', arabic: 'ar', árabe: 'ar',
        hindi: 'hi', korean: 'ko', coreano: 'ko', polaco: 'pl', polish: 'pl',
        greek: 'el', grego: 'el', swedish: 'sv', sueco: 'sv'
    });
    const MAINTENANCE = ownDictionary({
        'dead link': 'Ligação inativa', 'deadlink': 'Ligação inativa',
        'link quebrado': 'Ligação inativa', 'ligação quebrada': 'Ligação inativa',
        'citation needed': 'Carece de fontes', fact: 'Carece de fontes',
        'carece fontes': 'Carece de fontes', 'mfontes': 'Mais fontes',
        'maisfontes': 'Mais fontes', 'faltam fontes': 'Mais fontes',
        'cleanup': 'Reciclagem', 'reciclar': 'Reciclagem',
        'blp sources': 'Mais notas-bpv', 'sem notas': 'Sem fontes'
    });
    const DIRECT_TEMPLATE_ALIASES = ownDictionary({
        'multiple image': 'Imagem múltipla', 'refbegin': 'InícioRef', 'refend': '-fim'
    });
    function templateEntries(p) {
        return p.parts.slice(1).map((part, index) => {
            const m = part.match(/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/);
            return m && /^[\p{L}\d _/-]+$/u.test(m[2].trim()) ?
                {index: index + 1, key: m[2].trim(), value: m[4], lead: m[1], eq: m[3]} : null;
        }).filter(Boolean);
    }
    function entriesTemplate(p, entries) {
        const parts = p.parts.slice();
        entries.forEach(e => { parts[e.index] = e.remove ? null : e.lead + e.key + e.eq + e.value; });
        return '{{' + parts.filter(x => x !== null).join('|') + '}}';
    }
    function hasParam(entries, key) { return entries.some(e => !e.remove && norm(e.key) === key && e.value.trim()); }
    function addParam(p, entries, key, value) {
        const e = {index: p.parts.length, key, value, lead: '', eq: '='};
        p.parts.push(''); entries.push(e); return e;
    }
    function extendedParam(key) {
        const k = norm(key), numbered = k.match(/^(author|author-link|authorlink|author-last|author-first|last|first|surname|given|apellido|apellidos|nombre|editor-last|editor-first|editor-link|editor|translator-link|translator-first|translator-last|translator)(\d+)$/);
        if (numbered) return (PARAMS[numbered[1]] || numbered[1]) + numbered[2];
        const flipped = k.match(/^(author|editor|translator)(\d*)-(link|first|last|name|surname|given)$/);
        if (flipped) {
            const base = flipped[1] === 'author' ? 'autor' : flipped[1] === 'translator' ? 'tradutor' : 'editor';
            return (flipped[3] === 'link' ? base === 'tradutor' ? 'tradutor-link' : base + 'link' : base === 'autor' ?
                /last|surname/.test(flipped[3]) ? 'último' : 'primeiro' :
                base + (/last|surname/.test(flipped[3]) ? base === 'tradutor' ? '-ultimo' : '-sobrenome' : base === 'tradutor' ? '-primeiro' : '-nome')) + flipped[2];
        }
        return PARAMS[k] || key;
    }
    function citationParam(key, template) {
        const name = CITE_NAMES[template] ? norm(CITE_NAMES[template]) : template;
        let target = extendedParam(key);
        if (name === 'citar iucn') target = {assessors: 'assessores', version: 'versão', category: 'categoria'}[norm(key)] || target;
        if (name === 'citar tweet') target = {user: 'usuário', number: 'número'}[norm(key)] || target;
        if (CITATION_KEY_CATALOG[name] && key.toLowerCase() === 'publisher_hide') target = 'esconder_publicado';
        return CITATION_KEY_CATALOG[name] && !CITATION_KEY_CATALOG[name].includes(target) ? key : target;
    }
    // Uma conjunção ou vírgula pode fazer parte de um nome institucional ou pessoal.
    // Não inferir uma lista de pessoas só pela presença do separador.
    function institutionalAuthor(value) {
        return /(?:^|[^\p{L}\p{M}])(?:council|committee|commission|department|institute|institution|university|academy|association|organisation|organization|foundation|society|research|group|team|staff|board|bureau|agency|ministry|secretariat|administration|corporation|company|press|publishers?|publishing|sons|associates|partners|consortium|collaboration|working\s+party|centre|center|conselho|comit[eê]|comiss[aã]o|departamento|instituto|institui[cç][aã]o|universidade|academia|associa[cç][aã]o|organiza[cç][aã]o|funda[cç][aã]o|sociedade|pesquisa|grupo|equipe|equipa|reda[cç][aã]o|editorial|diretoria|ag[eê]ncia|minist[eé]rio|secretaria|administra[cç][aã]o|empresa|companhia|editora|cons[oó]rcio|centro|reuters|unesco|unicef|ibge|consejo|comisi[oó]n|universidad|asociaci[oó]n|organizaci[oó]n|fundaci[oó]n|agencia|universit[eé]|commission|d[eé]partement|soci[eé]t[eé]|[ée]quipe|groupe|institut)(?=$|[^\p{L}\p{M}])/iu.test(value) ||
            /(?:^|[^\p{L}\p{M}])(?:government|office|authority|service|executive|treasury|parliament|congress|assembly|standards|statistics|news|media|communications|laborator(?:y|ies)|museum|library|trust|fund|bank|church|union|federation|journal|times|post|tribune|globe|governo|gabinete|autoridade|servi[cç]o|executivo|parlamento|assembleia|c[aâ]mara|banco|biblioteca|laborat[oó]rio|museu|sindicato|federa[cç][aã]o|igreja|fundo|not[ií]cias|comunica[cç][aã]o|comunica[cç][oõ]es|estat[ií]stica|imprensa|jornal|di[aá]rio|folha|gazeta|correio|p[uú]blico|observador)(?=$|[^\p{L}\p{M}])/iu.test(value) ||
            /(?:\b(?:inc|ltd|llc|gmbh|sarl)\b|\bS\.?\s*A\.?\s*$)/i.test(value);
    }
    function personalAuthorName(value, inverted) {
        if (!value || institutionalAuthor(value) || /[{}<>\[\]:;\d/&]/.test(value)) return false;
        if (value.includes(',')) {
            if (!inverted) return false;
            const sides = value.split(',').map(x => x.trim());
            if (sides.length !== 2 || sides.some(x => !x)) return false;
            value = sides.join(' ');
        }
        const words = value.trim().split(/\s+/);
        if (words.length < 2 || words.length > 9) return false;
        let capitals = 0;
        for (const word of words) {
            if (/^(?:de|da|do|das|dos|di|du|del|della|van|von|der|den|la|le|el|al|bin|ibn|e)$/i.test(word)) continue;
            if (!/^(?:\p{Lu}[\p{L}\p{M}'’.-]*|[dD][’']\p{Lu}[\p{L}\p{M}'’.-]*)$/u.test(word)) return false;
            capitals++;
        }
        return capitals >= 2;
    }
    function splitAuthorNames(value, onlySemicolons) {
        const v = value.trim();
        if (!v || /[{}<>\[\]]/.test(v) || institutionalAuthor(v)) return null;
        let names;
        if (v.includes(';')) {
            names = v.split(/\s*;\s*/);
            if (!names.every(x => personalAuthorName(x, true))) return null;
        } else if (onlySemicolons) return null;
        else if (/\s+(?:and|&|e)\s+/i.test(v)) {
            // Nunca repartir novamente uma vírgula dentro de "Sobrenome, Nome".
            names = v.split(/\s+(?:and|&|e)\s+/i);
            if (!names.every(x => personalAuthorName(x, true))) return null;
        } else if (v.includes(',')) {
            // Só a forma bibliográfica com iniciais permite inferir autores separados por vírgulas.
            names = v.split(/\s*,\s*/);
            const initials = /^(?:(?:[\p{L}\p{M}'’.-]+)\s+)+[A-Z]{1,5}$/u;
            if (!names.every(x => initials.test(x) && personalAuthorName(x, false))) return null;
        } else return null;
        return names.length >= 2 && names.length <= 20 ? names : null;
    }
    function otherAuthorFields(entries, entry, base) {
        const pattern = base === 'editor' ?
            /^(?:editor|editores|editor-nome|editor-sobrenome|editor-primeiro|editor-último|editorlink|veditors|veditores)\d*$/ :
            /^(?:autor|autores|último|ultimo|primeiro|autorlink|vauthors|vautores)\d*$/;
        return entries.some(x => x !== entry && !x.remove && x.value.trim() && pattern.test(norm(x.key)));
    }

    function extendedCitation(raw, cfg, bump, warn) {
        const p = parsedTemplate(raw);
        if (!CITE_NAMES[p.name] || !cfg.citations) return raw;
        const entries = templateEntries(p);
        const change = (e, value, group) => { if (e.value !== value) { e.value = value; bump(group || 'citationCleanup'); } };
        if (cfg.authors) for (const e of entries) {
            if (/^(?:coauthors?|coautores?)$/i.test(e.key) && !entries.some(x => /^(?:autor|último|primeiro)2$/.test(norm(x.key)))) {
                e.key = 'autor2'; bump('authors');
            }
        }
        for (const e of entries) {
            const k = norm(e.key), v = e.value.trim();
            if (!v && !/^(pontofinal|ref|separator|separador)$/.test(k)) {
                e.remove = true; bump('citationCleanup'); continue;
            }
            if (k === 'língua' && LANGUAGE_CODES[norm(v)]) change(e, LANGUAGE_CODES[norm(v)]);
            if (k === 'acessourl' && /^(?:subscription|registration|limited)$/i.test(v))
                change(e, {subscription: 'subscrição', registration: 'registo', limited: 'limitado'}[v.toLowerCase()]);
            if (k === 'urlmorta') {
                if (/^(?:1|ja|ya|yes|sì|morto|morta)$/i.test(v)) change(e, 'sim');
                if (/^(?:0|live|vivo|activo|ativo)$/i.test(v)) change(e, 'não');
            }
            if (k === 'edição') change(e, v.replace(/^(\d+)(?:st|nd|rd|th|[.ªº°])?\s*(?:ed\.?|edition|edição)$/i, '$1'));
            if (k === 'volume') change(e, v.replace(/^(?:v\.|vol\.)\s*(?=\d)/i, ''));
            if (['página', 'páginas'].includes(k)) change(e, v.replace(/^(?:pág(?:ina)?s?\.?|pages?|pg\.?)\s*(?=\d)/i, ''));
            if (k === 'ol') change(e, v.replace(/^OL(?=\d+[AMW]$)/, ''));
            if (k === 'doi') {
                if (!/^10\.\d{4,9}\/\S+$/i.test(v)) warn('Confira o DOI: ' + v + '. O identificador foi preservado.');
            }
            if (k === 'pmid' && !/^\d+$/.test(v)) warn('Confira o PMID: ' + v + '.');
            if (k === 'isbn' && !validISBN(v)) warn('ISBN com formato ou dígito de controle inválido: ' + v + '.');
            if (cfg.authors && /^(?:autor|autores|editor|editores|último|primeiro|editor-nome|editor-sobrenome|tradutor|tradutores)\d*$/.test(k)) {
                const tail = v.match(/^(.+?)[,;\s]*['\[\s]*et\s+al\.?['\]\s]*$/i);
                const display = k.startsWith('editor') ? 'numero-editores' : k.startsWith('tradutor') ? 'display-translators' : 'numero-autores';
                if (tail && !entries.some(x => norm(x.key) === display)) {
                    change(e, tail[1].replace(/[,;\s]+$/, ''), 'authors');
                    addParam(p, entries, display, 'et al'); bump('authors');
                }
                const link = e.value.trim().match(/^\[\[([^|\[\]#]+)(?:\|([^\[\]]+))?\]\]$/);
                const who = k.match(/^(autor|editor|tradutor)(\d*)$/);
                if (link && who) {
                    const field = (who[1] === 'tradutor' ? 'tradutor-link' : who[1] + 'link') + who[2];
                    const old = entries.find(x => norm(x.key) === field);
                    if (!old || old.value.trim() === link[1]) {
                        change(e, link[2] || link[1], 'authors');
                        if (!old) { addParam(p, entries, field, link[1]); bump('authors'); }
                    } else warn('Ligação de autor conflitante preservada: ' + field + '.');
                }
            }
            // URLs arquivadas contêm a URL original e uma data verificável no próprio endereço.
            if (k === 'url' && !hasParam(entries, 'arquivourl') && !hasParam(entries, 'arquivodata')) {
                const wb = v.match(/^https?:\/\/web\.archive\.org\/web\/(\d{8})(?:\d{6})?(?:id_|if_)?\/(https?:\/\/\S+)$/i);
                if (wb && validDate(+wb[1].slice(6), +wb[1].slice(4, 6), +wb[1].slice(0, 4))) {
                    change(e, wb[2]); addParam(p, entries, 'arquivourl', v);
                    addParam(p, entries, 'arquivodata', wb[1].slice(0, 4) + '-' + wb[1].slice(4, 6) + '-' + wb[1].slice(6));
                    bump('citationCleanup');
                }
            }
        }
        const urls = !!CITATION_KEY_CATALOG[p.name] || entries.some(e => !e.remove && /^(url|capítulourl|arquivourl|conferência-url|mapa-url|resumo-url|transcriçãourl|lay-url)$/.test(norm(e.key)) && e.value.trim());
        if (!urls) {
            for (const e of entries) if (!e.remove && norm(e.key) === 'acessodata') { e.remove = true; bump('citationCleanup'); }
            if (p.name === 'citar web') { p.parts[0] = 'Citation'; bump('citationNames'); }
        }
        // Apenas separadores inequívocos. Sobrenome, nome não deve ser dividido em dois autores.
        if (cfg.authors) for (const e of entries.slice()) {
            const k = norm(e.key), family = k === 'autores' || k === 'autor' ? 'autor' : k === 'editores' || k === 'editor' ? 'editor' : null;
            if (!family || !e.value.includes(';') || /[{}<>\[\]]/.test(e.value)) continue;
            const names = splitAuthorNames(e.value, true);
            if (!names || otherAuthorFields(entries, e, family)) continue;
            e.key = family; change(e, names[0], 'authors');
            names.slice(1).forEach((n, i) => { addParam(p, entries, family + (i + 2), n); bump('authors'); });
        }
        return entriesTemplate(p, entries);
    }
    function validISBN(value) {
        const v = value.replace(/[\s-]/g, '').toUpperCase();
        if (/^\d{9}[\dX]$/.test(v)) return [...v].reduce((n, c, i) => n + (c === 'X' ? 10 : +c) * (10 - i), 0) % 11 === 0;
        return /^\d{13}$/.test(v) && [...v].reduce((n, c, i) => n + +c * (i % 2 ? 3 : 1), 0) % 10 === 0;
    }
    function simpleReferences(s, bump) {
        const edits = [];
        for (const r of refTokens(s)) {
            if (r.body === null) continue;
            const m = r.body.trim().match(/^\[(https?:\/\/[^\s\[\]{}<>|]+)\s+([^\[\]{}<>|]+)\]$/);
            if (!m) continue;
            const title = m[2].replace(/^(['"]{1,3})(.*?)\1$/, '$2');
            edits.push({start: r.openEnd, end: r.end - r.raw.match(/<\s*\/\s*ref\s*>$/i)[0].length,
                text: '{{Citar web|url=' + m[1] + '|título=' + title + '}}'}); bump('bareReferences');
        }
        return applyEdits(s, edits);
    }
    function auxiliaryTemplate(raw, cfg, bump, warn) {
        const p = parsedTemplate(raw), parts = p.parts.slice();
        const alias = DIRECT_TEMPLATE_ALIASES[p.name];
        if (cfg.obsoleteTemplates && alias) { parts[0] = alias; bump('obsoleteTemplates'); }
        if (cfg.maintenance && MAINTENANCE[p.name]) { parts[0] = MAINTENANCE[p.name]; bump('maintenance'); }
        if (cfg.maintenance && (MAINTENANCE[p.name] || Object.values(MAINTENANCE).some(n => norm(n) === p.name))) {
            for (let i = 1; i < parts.length; i++) {
                const m = parts[i].match(/^\s*(date|data)\s*=\s*([\s\S]*)$/i);
                if (!m) continue;
                const date = cfg.dates ? normalizeDate(m[2], warn) : m[2];
                const next = 'data=' + date;
                if (parts[i] !== next) { parts[i] = next; bump('maintenance'); }
            }
        }
        if (cfg.obsoleteTemplates && ['infobox person', 'infobox film', 'infobox album', 'infobox television'].includes(p.name)) {
            parts[0] = 'subst:' + parts[0].trim(); bump('obsoleteTemplates');
        }
        // Refn e Efn locais preservam seus grupos e nomes de referências.
        // Sua conversão para Nre pode alterar a lista ou uma chamada nomeada.
        if (cfg.links && p.name === 'link' && parts[1] && norm(parts[1]) === 'jp') { parts[1] = 'ja'; bump('links'); }
        return '{{' + parts.join('|') + '}}';
    }
    Object.assign(PARAMS, {"agencia": "agência", "agency": "agência", "agência": "agência", "formato-arquivo": "formato-arquivo", "arquivoformato": "formato-arquivo", "archive-format": "formato-arquivo", "at": "em", "em": "em", "en": "em", "titulolivro": "título-livro", "títulolivro": "título-livro", "título-livro": "título-livro", "booktitle": "título-livro", "book-title": "título-livro", "colaboração": "colaboração", "collaboration": "colaboração", "conference-format": "formato-conferência", "event-format": "formato-conferência", "formato-conferência": "formato-conferência", "conference-url": "conferência-url", "conferenceurl": "conferência-url", "event-url": "conferência-url", "eventurl": "conferência-url", "conferência-url": "conferência-url", "degree": "grau", "grau": "grau", "expediente": "expediente", "docket": "expediente", "enciclopedia": "enciclopédia", "enciclopédia": "enciclopédia", "encyclopedia": "enciclopédia", "encyclopaedia": "enciclopédia", "requadro": "requadro", "inset": "requadro", "resumo-data": "resumo-data", "data-resumo": "resumo-data", "lay-date": "resumo-data", "resumo-formato": "resumo-formato", "formato-resumo": "resumo-formato", "lay-format": "resumo-formato", "resumo-fonte": "resumo-fonte", "fonte-resumo": "resumo-fonte", "lay-source": "resumo-fonte", "url-resumo": "resumo-url", "resumo-url": "resumo-url", "resumo": "resumo-url", "lay-url": "resumo-url", "lay-summary": "resumo-url", "map": "mapa", "mapa": "mapa", "map-format": "mapa-formato", "mapa-formato": "mapa-formato", "map-url": "mapa-url", "mapa-url": "mapa-url", "id-mensagem": "id-mensagem", "mensagem-id": "id-mensagem", "message-id": "id-mensagem", "modo": "modo", "mode": "modo", "outros": "outros", "entrevistador": "outros", "entrevistadores": "outros", "notas": "outros", "interviewer": "outros", "interviewers": "outros", "otros": "outros", "others": "outros", "programa": "programa", "program": "programa", "escala": "escala", "título-translit": "título-translit", "titulo-translit": "título-translit", "script-title": "título-translit", "secao": "seção", "seccao": "seção", "section": "seção", "seção": "seção", "seções": "seções", "secoes": "seções", "sections": "seções", "separador-series": "separador-series", "serieslink": "sérielink", "series-link": "sérielink", "sérielink": "sérielink", "sheet": "folha", "folha": "folha", "sheets": "folhas", "folhas": "folhas", "tempo": "tempo", "time": "tempo", "tiempo": "tempo", "legenda": "legenda", "title-link": "titulolink", "episode-link": "titulolink", "titlelink": "titulolink", "episodelink": "titulolink", "episódiolink": "titulolink", "titulolink": "titulolink", "títulolink": "titulolink", "departamento": "departamento", "subtitulo": "departamento", "subtítulo": "departamento", "Subtítulo": "departamento", "department": "departamento", "transcrição-formato": "transcrição-formato", "transcricao-formato": "transcrição-formato", "transcript-format": "transcrição-formato", "transcript": "transcrição", "transcricao": "transcrição", "transcrição": "transcrição", "transcripturl": "transcriçãourl", "urltranscricao": "transcriçãourl", "transcricaourl": "transcriçãourl", "transcriçãourl": "transcriçãourl"});
    // O escape da chave nas strings evita expansão ao salvar o script na Wikipédia.
    const SHORTCUTS = ownDictionary({
        bb: '\n{{Info/Biografia/Lua}}', ic: '\n{{Wikidata Infobox/core}}',
        mw: '\n{{Info/Monumento}}', il: '\n{{Info/Localidade}}',
        if: '\n{{Info/Assentamento/Filipinas}}', ie: '\n{{Info/Instituição educacional de pesquisa}}',
        poh: '\n{{Portal3|Ohio}}', pbb: '\n{{Portal3|Biografias}}',
        pbo: '\n{{Portal3|Botânica}}', pbi: '\n{{Portal3|Biologia}}',
        im1: '|imagem={\x7Bsubst:Valor Wikidata|P18|numval=1}}\n|imagem_tamanho=250px',
        ima: '{\x7Bsubst:Valor Wikidata|P18|numval=1}}',
        not: '== Notas ==\n{{Referências|grupo=nota|nível=0}}\n\n{{Referências}}',
        nla: '== Notas ==\n{{Referências|grupo=lower-alpha|nível=0}}\n\n{{Referências}}',
        pai: '{{Criado por IA|Esta seção|data={\x7Bsubst:DATA}}}}',
        sf: '{{Sem fontes|data={\x7Bsubst:DATA}}}}',
        cf: '{{Carece de fontes|data={\x7Bsubst:DATA}}}}',
        mf: '{{Mais fontes|data={\x7Bsubst:DATA}}}}', si: '{{Sem infocaixa|taxonomia}}',
        tb: '\n{{Taxonbar|from={\x7Bsubst:WD qid}}}}',
        ir: '{{Info/Rio/Wikidata}}', ref: '{{Referências}}',
        nm: '\n{\x7Bsubst:NM/Testes2}}', con: '\n{{Controle de autoridade}}'
    });
    // São comandos digitados pelo editor, não inferências sobre o assunto da página.
    function expandShortcuts(s, bump, warn) {
        return s.replace(/\\{3}([a-z]+\d*)(?![\w])/g, (all, key) => {
            if (key === 'dc') { warn('O atalho dc é obsoleto. A descrição curta deve ser editada no Wikidata.'); return all; }
            if (!SHORTCUTS[key]) return all;
            bump('shortcuts'); return SHORTCUTS[key];
        });
    }
    function diagnostics(s, cfg, warn) {
        for (const n of templates(s).nodes) {
            const p = parsedTemplate(s.slice(n.start, n.end));
            if (cfg.citations && CITE_NAMES[p.name]) for (const e of templateEntries(p)) {
                const accepted = CITATION_KEY_CATALOG[p.name] || CS1_KEYS;
                if (!accepted.includes(e.key) && !accepted.includes(e.key.replace(/\d+/g, '#')))
                    warn('Parâmetro de citação fora do catálogo: ' + e.key + ' em ' + p.parts[0].trim() + '.');
                if (['url', 'capítulourl', 'arquivourl'].includes(norm(e.key)) && /algomais\.com|algomais\.org/i.test(e.value))
                    warn('Fonte do Algomais preservada. Substitua a fonte antes de publicar, conforme a sua preferência.');
                if (['url', 'capítulourl'].includes(norm(e.key)) && /https?:\/\/[^/]*wikipedia\.org\//i.test(e.value))
                    warn('Uma referência usa a própria Wikipédia como fonte. Procure uma fonte externa que sustente o trecho.');
            }
            if (cfg.references && ['notas', 'notelist', 'nre'].includes(p.name) && !rendererRanges(s).length)
                warn('Há notas, confira se o grupo correspondente tem uma lista de referências.');
            if (cfg.obsoleteTemplates && ['track listing', 'tracklist'].includes(p.name))
                warn('Track listing pode ser convertido com a opção de revisão. Confira a lista de faixas na pré-visualização.');
        }
    }

    function norm(s) { return s.trim().replace(/_/g, ' ').replace(/\s+/g, ' ').toLocaleLowerCase('pt'); }
    function nameOf(s) { return norm(s).replace(/^(?:predefinição|template)\s*:\s*/i, ''); }
    function applyEdits(s,edits) {
        if(!edits.length)return s;
        let end=s.length;const pieces=[];
        edits.sort((a,b)=>b.start-a.start||b.end-a.end);
        for(const e of edits){if(e.end>end)throw new Error('Edições sobrepostas no analisador.');pieces.push(s.slice(e.end,end),String(e.text));end=e.start;}
        pieces.push(s.slice(0,end));return pieces.reverse().join('');
    }
    function tagAt(s, i) {
        if (s[i] !== '<') return null;
        // Uma desigualdade como < q < 1,3 não abre uma etiqueta HTML.
        if(/^<\s+[A-Za-z]\s*</.test(s.slice(i,i+40)))return null;
        let quote = '', j = i + 1;
        for (; j < s.length; j++) {
            const c = s[j];
            if (quote) { if (c === quote) quote = ''; }
            else if (c === '"' || c === "'") quote = c;
            else if (c === '>') break;
        }
        if (j === s.length) return null;
        const raw = s.slice(i, j + 1);
        const m = raw.match(/^<\s*(\/?)\s*([a-z][a-z0-9-]*)\b([\s\S]*?)>$/i);
        if (!m) return null;
        return {start: i, end: j + 1, raw, name: m[2].toLowerCase(),
            close: !!m[1], self: /\/\s*>$/.test(raw), attrs: m[3].replace(/\/\s*$/, '')};
    }
    function attrsOf(s) {
        const attrs = {}, re = /\s+([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
        let m, pos = 0;
        while ((m = re.exec(s))) {
            if (s.slice(pos, m.index).trim()) return null;
            const key = m[1].toLowerCase();
            if (Object.prototype.hasOwnProperty.call(attrs, key) || m[2] === undefined && m[3] === undefined && m[4] === undefined) return null;
            attrs[key] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
            pos = re.lastIndex;
        }
        return s.slice(pos).trim() ? null : attrs;
    }
    // Leituras são guardadas pelo texto exato, sem reutilizar posições de outro rascunho.
    const scanMemoLarge = new Map(), scanMemoSmall = new Map(), partsMemo = new Map();
    const memoBudgets = {large:0,small:0,parts:0};
    function boundedMemo(map, bucket, limit, maxEntries, key, field, create, weight) {
        let entry=map.get(key);
        if(entry && Object.hasOwn(entry.values,field)) {
            map.delete(key);map.set(key,entry);return entry.values[field];
        }
        const value=create();
        // A leitura pode chamar outro leitor e criar ou remover esta entrada.
        entry=map.get(key);
        const added=weight(value), base=entry?0:key.length*2+160;
        if(base+added>limit)return value;
        if(!entry){entry={values:{},weight:base};map.set(key,entry);memoBudgets[bucket]+=base;}
        if(Array.isArray(value))Object.freeze(value);else if(value?.nodes){Object.freeze(value.nodes);Object.freeze(value.unclosed);}
        entry.values[field]=value;entry.weight+=added;memoBudgets[bucket]+=added;
        while(map.size>maxEntries || memoBudgets[bucket]>limit){const first=map.keys().next().value;const old=map.get(first);map.delete(first);memoBudgets[bucket]-=old.weight;}
        return value;
    }
    function scanMemo(source,field,create) {
        const large=source.length>=8192;
        return boundedMemo(large?scanMemoLarge:scanMemoSmall,large?'large':'small',large?25165824:4194304,large?12:2048,
            source,field,create,value=>typeof value==='string'?value.length*2+64:Array.isArray(value)?value.length*96:((value.nodes?.length||0)+(value.unclosed?.length||0))*64+128);
    }
    function parserCacheStatus(){const actual=[scanMemoLarge,scanMemoSmall,partsMemo].reduce((total,map)=>total+[...map.values()].reduce((n,e)=>n+e.weight,0),0);
        return {largeEntries:scanMemoLarge.size,smallEntries:scanMemoSmall.size,partsEntries:partsMemo.size,
        estimatedBytes:memoBudgets.large+memoBudgets.small+memoBudgets.parts,maximumEstimatedBytes:33554432,accountingConsistent:actual===memoBudgets.large+memoBudgets.small+memoBudgets.parts};}
    const profileIndexes=new WeakMap();
    function profileIndex(profile) {
        let value=profileIndexes.get(profile);
        if(!value || value.length!==profile.accepted.length) {
            const normalized=new Map();
            for(const key of profile.accepted){const n=norm(key);if(!normalized.has(n))normalized.set(n,[]);normalized.get(n).push(key);}
            value={length:profile.accepted.length,accepted:new Set(profile.accepted),patterns:(profile.patterns||[]).map(p=>new RegExp(p,'u')),normalized};
            profileIndexes.set(profile,value);
        }
        return value;
    }
    function profileAccepts(profile,key){const index=profileIndex(profile);return index.accepted.has(key)||index.patterns.some(p=>p.test(key));}

    function templates(s) { return scanMemo(s,'templates',()=>scanTemplates(s)); }
    function scanTemplates(s) {
        const stack = [], nodes = [];
        for (let i = 0; i < s.length;) {
            if (s[i] === '<') { const t = tagAt(s, i); if (t) { i = t.end; continue; } }
            const top = stack[stack.length - 1];
            if (top && s.slice(i, i + top.size) === '}'.repeat(top.size)) {
                stack.pop();
                if (top.size === 2) nodes.push({start: top.start, end: i + 2, depth: stack.length});
                i += top.size;
            } else if (s.slice(i, i + 3) === '{{{') { stack.push({start: i, size: 3}); i += 3; }
            else if (s.slice(i, i + 2) === '{{') { stack.push({start: i, size: 2}); i += 2; }
            else i++;
        }
        return {nodes, unclosed: stack};
    }
    function splitParts(s) { return boundedMemo(partsMemo,'parts',4194304,4096,s,'parts',()=>scanSplitParts(s),parts=>parts.reduce((n,p)=>n+p.length*2+32,0)).slice(); }
    function scanSplitParts(s) {
        const parts = [], stack = [];
        let start = 0, link = 0, bracket = 0;
        for (let i = 0; i < s.length;) {
            if (s[i] === '<') { const t = tagAt(s, i); if (t) { i = t.end; continue; } }
            const top = stack[stack.length - 1];
            if (top && s.slice(i, i + top) === '}'.repeat(top)) { stack.pop(); i += top; }
            else if (s.slice(i, i + 3) === '{{{') { stack.push(3); i += 3; }
            else if (s.slice(i, i + 2) === '{{') { stack.push(2); i += 2; }
            else if (s.slice(i, i + 2) === '[[') { link++; i += 2; }
            else if (s.slice(i, i + 2) === ']]' && link) { link--; i += 2; }
            else if (s[i] === '[' && !link) { bracket++; i++; }
            else if (s[i] === ']' && bracket && !link) { bracket--; i++; }
            else if (s[i] === '|' && !stack.length && !link && !bracket) {
                parts.push(s.slice(start, i)); start = ++i;
            } else i++;
        }
        parts.push(s.slice(start));
        return parts;
    }
    function parsedTemplate(raw) {
        const parts = splitParts(raw.slice(2, -2));
        return {name: nameOf(parts[0]).replace(/^#tag\s*:\s*ref$/,'#tag:ref'), parts};
    }
    function topNodes(s) { return templates(s).nodes.filter(n => n.depth === 0).sort((a, b) => a.start - b.start); }
    const intervalIndexes=new WeakMap();
    function rangeIndex(ranges) {
        let index=intervalIndexes.get(ranges);
        if(!index||index.length!==ranges.length){
            const sorted=ranges.filter(n=>n.start<n.end).map(n=>[n.start,n.end]).sort((a,b)=>a[0]-b[0]),max=[];let end=-Infinity;
            for(const range of sorted){end=Math.max(end,range[1]);max.push(end);}
            index={length:ranges.length,sorted,max};intervalIndexes.set(ranges,index);
        }
        return index;
    }
    function rangePosition(pos,index){let low=0,high=index.sorted.length-1;while(low<=high){const mid=(low+high)>>1;if(index.sorted[mid][0]<=pos)low=mid+1;else high=mid-1;}return high;}
    function inRange(pos,ranges) {
        if(ranges.length<64)return ranges.some(n=>n.start<=pos&&pos<n.end);
        const index=rangeIndex(ranges),at=rangePosition(pos,index);return at>=0&&index.max[at]>pos;
    }
    function inRangeExcept(pos,ranges,start,end) {
        if(ranges.length<64)return ranges.some(n=>(n.start!==start||n.end!==end)&&n.start<=pos&&pos<n.end);
        const index=rangeIndex(ranges);
        for(let at=rangePosition(pos,index);at>=0&&index.max[at]>pos;at--){const range=index.sorted[at];if(range[1]>pos&&(range[0]!==start||range[1]!==end))return true;}
        return false;
    }
    function structuralRanges(s) { return scanMemo(s,'ranges',()=>scanStructuralRanges(s)); }
    function scanStructuralRanges(s) {
        const ranges = templates(s).nodes.slice();
        const table = /\{\||\|\}/g, stack = [];
        let m;
        while ((m = table.exec(s))) {
            if (m[0] === '{|') stack.push(m.index);
            else if (stack.length) ranges.push({start: stack.pop(), end: table.lastIndex});
        }
        stack.forEach(start => ranges.push({start, end: s.length}));
        const refs = refTokens(s);
        refs.forEach(r => ranges.push({start: r.start, end: r.end}));
        return ranges;
    }
    function maskProtected(source, warn, extraRanges=[]) {
        let prefix = '\uE000AJG';
        while (source.includes(prefix)) prefix += 'X';
        const saved = []; let unclosed = false;
        function save(raw) { const key = prefix + saved.length + '\uE001'; saved.push(raw); return key; }
        const literalTags = new Set(['nowiki', 'pre', 'syntaxhighlight', 'source', 'code', 'math', 'blockquote', 'q',
            'chem', 'score', 'timeline', 'graph', 'templatedata', 'poem', 'gallery',
            'hiero', 'imagemap', 'mapframe', 'maplink', 'inputbox']);
        if(extraRanges.length)source=applyEdits(source,extraRanges.map(r=>({...r,text:save(source.slice(r.start,r.end))})));
        let out = '';
        for (let i = 0; i < source.length;) {
            if (source.slice(i, i + 4) === '<!--') {
                const j = source.indexOf('-->', i + 4), end = j < 0 ? source.length : j + 3;
                if (j < 0) {unclosed=true;warn('Comentário sem fechamento preservado.');}
                out += save(source.slice(i, end)); i = end; continue;
            }
            const t = tagAt(source, i);
            if (t && !t.close && literalTags.has(t.name)) {
                let end = t.end;
                if (!t.self) {
                    const close = new RegExp('<\\s*\\/\\s*' + t.name + '\\s*>', 'gi');
                    close.lastIndex = t.end;
                    const m = close.exec(source);
                    end = m ? close.lastIndex : source.length;
                    if (!m) {unclosed=true;warn('Bloco <' + t.name + '> sem fechamento preservado.');}
                }
                out += save(source.slice(i, end)); i = end; continue;
            }
            out += source[i++];
        }
        // Exemplos preformatados e citações em bloco ficam intactos.
        const ranges = templates(out).nodes;
        const edits = [];
        let offset = 0;
        for (const line of out.match(/[^\n]*(?:\n|$)/g) || []) {
            if (!line) continue;
            if (/^[ \t]+\S/.test(line) && !inRange(offset, ranges))
                edits.push({start: offset, end: offset + line.length, text: save(line)});
            offset += line.length;
        }
        out = applyEdits(out, edits);
        const quotes = topNodes(out).filter(n => ['quote', 'quotation', 'cquote', 'blockquote',
            'citação', 'citar', 'citação em bloco', 'epígrafe'].includes(parsedTemplate(out.slice(n.start, n.end)).name));
        out = applyEdits(out, quotes.map(n => ({start: n.start, end: n.end, text: save(out.slice(n.start, n.end))})));
        return {text: out, unclosed, restore(s) {
            const re = new RegExp(prefix + '(\\d+)\\uE001', 'g');
            // Alguns blocos contêm marcadores anteriores. Desmascarar até o fim.
            for (let pass = 0; pass <= saved.length && s.includes(prefix); pass++)
                s = s.replace(re, (_, i) => saved[Number(i)]);
            return s;
        }};
    }
    function refTokens(s) { return scanMemo(s,'refs',()=>scanRefTokens(s)); }
    function scanRefTokens(s) {
        const found = [];
        for (let i = 0; i < s.length;) {
            const t = tagAt(s, i);
            if (!t) { i++; continue; }
            if (t.name !== 'ref' || t.close) { i = t.end; continue; }
            if (t.self) { found.push(Object.assign({}, t, {body: null})); i = t.end; continue; }
            const close = /<\s*\/\s*ref\s*>/gi;
            close.lastIndex = t.end;
            const m = close.exec(s);
            if (!m || /<\s*ref\b/i.test(s.slice(t.end, m.index))) { i = t.end; continue; }
            found.push(Object.assign({}, t, {end: close.lastIndex, openEnd: t.end,
                raw: s.slice(i, close.lastIndex), body: s.slice(t.end, m.index)}));
            i = close.lastIndex;
        }
        return found;
    }
    function malformedRefs(s) {
        const stack = [];
        for (let i = 0; i < s.length;) {
            const t = tagAt(s, i);
            if (!t) {
                if (/^<\s*\/?\s*ref\b/i.test(s.slice(i))) return true;
                i++; continue;
            }
            if (t.name === 'ref') {
                if (t.close) { if (!stack.length) return true; stack.pop(); }
                else { if (stack.length) return true; if (!t.self) stack.push(t); }
            }
            i = t.end;
        }
        return !!stack.length;
    }
    function rendererRanges(s) { return scanMemo(s,'renderers',()=>scanRendererRanges(s)); }
    function scanRendererRanges(s) {
        const out = topNodes(s).filter(n => ['referências', 'referencias', 'reflist', 'references',
            'notas', 'notas e referências', 'notelist'].includes(parsedTemplate(s.slice(n.start, n.end)).name));
        for (let i = 0; i < s.length;) {
            const t = tagAt(s, i);
            if (!t) { i++; continue; }
            if (t.name === 'references' && !t.close) {
                let end = t.end;
                if (!t.self) {
                    const re = /<\s*\/\s*references\s*>/gi; re.lastIndex = t.end;
                    const m = re.exec(s); end = m ? re.lastIndex : s.length;
                }
                out.push({start: t.start, end}); i = end;
            } else i = t.end;
        }
        return out.sort((a, b) => a.start - b.start);
    }
    function mapTemplateTree(s, transform) {
        const nodes = topNodes(s), edits = [];
        for (const n of nodes) {
            const raw = s.slice(n.start, n.end);
            const inner = mapTemplateTree(raw.slice(2, -2), transform);
            const next = transform('{{' + inner + '}}');
            if (raw !== next) edits.push({start: n.start, end: n.end, text: next});
        }
        return applyEdits(s, edits);
    }
    function validDate(day, month, year) {
        if (!Number.isInteger(year) || year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    }
    function normalizeDate(value, warn) {
        const trimmed = value.trim();
        let raw = trimmed.replace(/\[\[([^|\]]+)\]\]/g, '$1');
        raw = raw.replace(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|segunda-feira|terça-feira|quarta-feira|quinta-feira|sexta-feira|sábado|domingo|lunes|martes|miércoles|jueves|viernes|sábado|domingo),?\s+/i, '');
        const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (iso) {
            if (!validDate(+iso[3], +iso[2], +iso[1])) warn('Data inválida preservada: ' + trimmed);
            return value;
        }
        const ymd = raw.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
        const numeric = raw.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
        let d, month, y, m;
        if (numeric) {
            if (+numeric[1] <= 12 && +numeric[2] <= 12 && numeric[1] !== numeric[2]) {
                return value; // Sem interpretação automática de datas ambíguas.
            }
            [d, month, y] = +numeric[2] > 12 ? [+numeric[2], +numeric[1], +numeric[3]] : [+numeric[1], +numeric[2], +numeric[3]];
        } else if (ymd) [y, month, d] = [+ymd[1], +ymd[2], +ymd[3]];
        else {
            const season = raw.match(/^(spring|summer|autumn|fall|winter|primavera|verão|outono|inverno)\s+(?:de\s+)?(\d{4})$/i);
            if (season) return ({spring: 'primavera', summer: 'verão', autumn: 'outono', fall: 'outono', winter: 'inverno'}[season[1].toLowerCase()] || season[1].toLowerCase()) + ' de ' + season[2];
            const rangeEN = raw.match(/^([\p{L}.]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2}),?\s+(\d{4})$/u);
            const rangePT = raw.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(?:de\s+)?([\p{L}.]+)\s+(?:de\s+)?(\d{4})$/u);
            const monthRange = raw.match(/^([\p{L}.]+)\s*[-–/]\s*([\p{L}.]+)\s+(?:de\s+)?(\d{4})$/u);
            if (monthRange) {
                const a = MONTHS[monthRange[1].toLowerCase().replace(/\.$/, '')], b = MONTHS[monthRange[2].toLowerCase().replace(/\.$/, '')];
                return a && b ? MONTH_PT[a] + '–' + MONTH_PT[b] + ' de ' + monthRange[3] : value;
            }
            if (rangeEN || rangePT) {
                const a = rangeEN ? +rangeEN[2] : +rangePT[1], b = rangeEN ? +rangeEN[3] : +rangePT[2];
                month = MONTHS[(rangeEN ? rangeEN[1] : rangePT[3]).toLowerCase().replace(/\.$/, '')];
                y = +(rangeEN ? rangeEN[4] : rangePT[4]);
                if (!month) return value;
                if (a > b || !validDate(a, month, y) || !validDate(b, month, y)) { warn('Intervalo de datas inválido preservado: ' + trimmed); return value; }
                return a + '–' + b + ' de ' + MONTH_PT[month] + ' de ' + y;
            }
            const tm = raw.match(/^\{\{\s*(DataExt|Data|Dtlink|Fecha)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*}}$/i);
            if (tm) [d, month, y] = tm[1].toLowerCase() === 'data' ? [+tm[4], +tm[3], +tm[2]] : [+tm[2], +tm[3], +tm[4]];
            else if ((m = raw.match(/^(\d{1,2})(?:st|nd|rd|th|\.?[º°])?\s+(?:de\s+)?([\p{L}.]+)\s+(?:de\s+)?(\d{4})$/iu))) {
                d = +m[1]; month = MONTHS[m[2].toLowerCase().replace(/\.$/, '')]; y = +m[3];
            } else if ((m = raw.match(/^([\p{L}.]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s+(\d{4})$/iu))) {
                month = MONTHS[m[1].toLowerCase().replace(/\.$/, '')]; d = +m[2]; y = +m[3];
            } else if ((m = raw.match(/^([\p{L}.]+)\s+(?:de\s+)?(\d{4})$/iu))) {
                month = MONTHS[m[1].toLowerCase().replace(/\.$/, '')];
                return month ? MONTH_PT[month] + ' de ' + m[2] : value;
            } else return value;
        }
        if (!month) return value;
        if (!validDate(d, month, y)) { warn('Data inválida preservada: ' + trimmed); return value; }
        return d + ' de ' + MONTH_PT[month] + ' de ' + y;
    }
    function mappedParam(key, template) { return citationParam(key, template); }
    function parameterFamily(key) {
        const m = norm(key).match(/^(.*?)(\d*)$/), base = m[1], num = m[2];
        const aliases = ownDictionary({publicado: 'publicador', editora: 'publicador', título: 'título', titulo: 'título',
            p: 'página', página: 'página', pp: 'páginas', páginas: 'páginas',
            'editor-nome': 'editor-nome', 'editor-primeiro': 'editor-nome',
            'editor-sobrenome': 'editor-sobrenome', 'ultimo': 'último'});
        return (aliases[base] || base) + num;
    }
    function nativeCitationTitle(p) {
        const profile=TEMPLATE_CATALOG[p.name];
        if (!/^citar\b|^citation$/i.test(p.parts[0].trim())) return false;
        const raw=p.parts[0].trim().replace(/_/g,' ').replace(/\s+/g,' '), title=profile?.title || CITE_NAMES[p.name];
        if (!title) return false;
        return raw.slice(1)===title.slice(1) && raw.slice(0,1).toLocaleUpperCase('pt')===title.slice(0,1).toLocaleUpperCase('pt');
    }
    const citationAcceptedSets=new WeakMap();
    function nativeCitationAccepts(p,key) {
        const profile=TEMPLATE_CATALOG[p.name],specific=CITATION_KEY_CATALOG[norm(CITE_NAMES[p.name] || p.name)];
        const keys=specific || CS1_KEYS;
        let accepted=citationAcceptedSets.get(keys);if(!accepted){accepted=new Set(keys);citationAcceptedSets.set(keys,accepted);}
        return accepted.has(key) || accepted.has(key.replace(/\d+$/,'#')) ||
            profile && profileAccepts(profile,key);
    }

    function citation(raw, cfg, bump, warn) {
        const parsed = parsedTemplate(raw), chosen = CITE_NAMES[parsed.name];
        if (!chosen) return raw;
        const parts = parsed.parts.slice(), entries = [];
        if (cfg.citations && !nativeCitationTitle(parsed) && parts[0].trim() !== chosen) { parts[0] = chosen; bump('citationNames'); }
        for (let i = 1; i < parts.length; i++) {
            const m = parts[i].match(/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/);
            if (!m || !/^[\p{L}\d _-]+$/u.test(m[2].trim())) continue;
            const originalKey = m[2].trim();
            let key = cfg.citations && !(nativeCitationTitle(parsed) && nativeCitationAccepts(parsed,originalKey)) ? mappedParam(originalKey, parsed.name) : originalKey;
            let value = m[4], newValue = value;
            if (cfg.citations && norm(originalKey) === 'url-status') {
                const status = norm(value);
                if (['dead', 'live', 'yes', 'no'].includes(status)) {
                    key = 'urlmorta'; newValue = ['dead', 'yes'].includes(status) ? 'sim' : 'não';
                } else warn('url-status=' + value.trim() + ' preservado. Esse estado precisa de revisão manual.');
            } else if (cfg.citations && key === 'urlmorta') {
                if (/^(?:yes|dead)$/i.test(value.trim())) newValue = 'sim';
                else if (/^(?:no|live)$/i.test(value.trim())) newValue = 'não';
            }
            if (key !== originalKey || newValue !== value) bump('citationParameters');
            value = newValue;
            if (cfg.dates && DATE_KEYS.has(norm(key))) {
                newValue = normalizeDate(value, warn);
                if (newValue !== value) bump('dates'); value = newValue;
            }
            if (cfg.citations) {
                const k = norm(key), v = value.trim();
                if (k === 'doi') newValue = v.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi\s*:\s*/i, '');
                else if (k === 'pmid' && /^(?:PMID\s*:?\s*)?\d+$/i.test(v)) newValue = v.replace(/^PMID\s*:?\s*/i, '');
                else if (k === 'pmid' && /^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?$/i.test(v)) newValue = v.match(/\/(\d+)\/?$/)[1];
                else if (k === 'pmc' && /^(?:PMC\s*:?\s*)?\d+$/i.test(v)) newValue = v.replace(/^PMC\s*:?\s*/i, '');
                else if (k === 'isbn' && /^(?:ISBN(?:-1[03])?\s*:?\s*)?[\dXx -]+$/i.test(v)) newValue = v.replace(/^ISBN(?:-1[03])?\s*:?\s*/i, '');
                else if (['página', 'páginas', 'p', 'pp'].includes(k)) newValue = v.replace(/^pp?\.\s*(?=\d)/i, '');
                else if (['url', 'arquivourl', 'capítulourl'].includes(k)) newValue = v.replace(/^https?:\/\/(?=https?:\/\/)/i, '');
                else newValue = value;
                if (newValue !== value) bump('identifiers'); value = newValue;
            }
            parts[i] = m[1] + key + m[3] + value;
            entries.push({i, key, value});
        }
        if (cfg.citations) {
            const seen = new Map();
            for (const p of entries) {
                const family = parameterFamily(p.key);
                if (!seen.has(family)) { seen.set(family, p); continue; }
                const prev = seen.get(family);
                if (p.value.trim() === prev.value.trim()) { parts[p.i] = null; bump('duplicateParameters'); }
                else warn('Parâmetros conflitantes preservados em ' + chosen + ': ' + prev.key + ' / ' + p.key + '.');
            }
        }
        let result = '{{' + parts.filter(p => p !== null).join('|') + '}}';
        if (cfg.singleLineCitations && !/\uE000AJG|\{\||<\s*(?:ref|references)\b/i.test(result)) {
            const flat = result.replace(/\r?\n[ \t]*(?=\||}})/g, '').replace(/\r?\n[ \t]*(?=}}$)/g, '');
            if (!/[\r\n]/.test(flat) && flat !== result) { result = flat; bump('singleLine'); }
        }
        return result;
    }
    function birthDate(raw, bump) {
        const p = parsedTemplate(raw), parts = p.parts.slice();
        if (p.name === 'nowrap' && parts.length === 2 && /^\{\{[dD]ni\|\d+\|\d+\|\d+(?:\|si)?}}$/.test(parts[1].trim())) {
            bump('birthDates'); return parts[1].trim();
        }
        if (p.name !== 'dni') return raw;
        const args = parts.slice(1).filter(x => !/^\s*lang\s*=\s*(?:br|pt)\s*$/i.test(x));
        if (args.length < 3 || args.length > 4 || !args.slice(0, 3).every(x => /^\d+$/.test(x.trim())) ||
            args.length === 4 && norm(args[3]) !== 'si' || !validDate(+args[0], +args[1], +args[2])) return raw;
        const stem=parts[0].trim().replace(/^(?:predefinição|template)\s*:\s*/i,'');
        const title=/^[dD]ni$/.test(stem)?parts[0]:'Dni';
        const result = '{{'+title+'|' + args.slice(0, 3).map(x => x.trim()).join('|') + (args.length === 4 ? '|si' : '') + '}}';
        if (result !== raw) bump('birthDates'); return result;
    }
    function infoboxAccepts(profile, key) {
        return profileAccepts(profile,key);
    }
    function infobox(raw, bump, warn) {
        const p = parsedTemplate(raw), profile = INFOBOX_CATALOG[p.name];
        if (!profile) {
            if (p.name === 'info/pessoa') warn('Info/Pessoa não existia em ' + CATALOG_DATE + '. Confira a infocaixa adequada antes de substituir.');
            else if (p.name.startsWith('info/')) warn('Infocaixa fora do catálogo local: ' + p.parts[0].trim() + '. Seus parâmetros foram preservados.');
            return raw;
        }
        if (profile.obsolete) warn('Infocaixa obsoleta ' + profile.title + ': ' + profile.obsolete + '. Os dados foram preservados para revisão.');
        const parts = p.parts.slice(), entries = [], accepted = new Set(profile.accepted);
        for (let i = 1; i < parts.length; i++) {
            const m = parts[i].match(/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/);
            if (m && /^[\p{L}\d _/()-]+$/u.test(m[2].trim())) entries.push({i, original: m[2].trim(), key: m[2].trim(), value: m[4], before: m});
        }
        for (const entry of entries) {
            let target = profile.renames && profile.renames[entry.key], value = entry.value;
            // Aliases já aceitos continuam válidos. Só corrigir um nome inválido.
            if (accepted.has(entry.key)) target = null;
            if (p.name === 'info/filme' && entry.key === 'runtime') {
                const m = value.trim().match(/^(\d+)(?:\s*(?:minutes|minutos|min\.?))?$/i);
                if (m) { target = 'duração'; value = m[1]; }
                else warn('runtime em Info/Filme requer revisão de unidade. O valor foi preservado.');
            }
            if (p.name === 'info/assentamento' && entry.key === 'coord_escala') {
                if (/^[1-9]\d*$/.test(value.trim())) { target = 'coord_sufixo'; value = 'scale:' + value.trim(); }
                else warn('coord_escala em Info/Assentamento não é um inteiro positivo. O valor foi preservado.');
            }
            if (target && accepted.has(target)) {
                const existing = entries.find(e => e !== entry && e.key === target);
                if (existing && existing.value.trim() !== value.trim() && existing.value.trim() && value.trim()) {
                    warn('Infocaixa ' + profile.title + ': ' + entry.key + ' conflita com ' + target + '. Ambos foram preservados.');
                } else if (existing) {
                    if (!existing.value.trim() && value.trim()) {
                        existing.value = value;
                        parts[existing.i] = existing.before[1] + target + existing.before[3] + value;
                        bump('infoboxParameters');
                    }
                    parts[entry.i] = null; entry.deleted = true; bump('infoboxDuplicates');
                } else {
                    entry.key = target; entry.value = value;
                    parts[entry.i] = entry.before[1] + target + entry.before[3] + value; bump('infoboxParameters');
                }
            }
        }
        const groups = new Map();
        for (const entry of entries.filter(e => !e.deleted)) {
            const family = profile.aliases && profile.aliases[entry.key] || entry.key;
            if (!groups.has(family)) groups.set(family, entry);
            else {
                const before = groups.get(family);
                if (before.value.trim() === entry.value.trim()) { parts[entry.i] = null; entry.deleted = true; bump('infoboxDuplicates'); }
                else warn('Infocaixa ' + profile.title + ': valores diferentes em ' + before.key + ' / ' + entry.key + '. Confira manualmente.');
            }
            if (!infoboxAccepts(profile, entry.key) && !profile.partial) {
                let hint = profile.report && profile.report[entry.key];
                if (!hint) {
                    const candidates = profile.accepted.filter(k => norm(k) === norm(entry.key));
                    if (candidates.length === 1) hint = 'Confira se o nome pretendido é ' + candidates[0] + '.';
                }
                warn('Infocaixa ' + profile.title + ': parâmetro não reconhecido no catálogo, "' + entry.key + '".' + (hint ? ' ' + hint : ' Valor preservado.'));
            } else if (profile.ignored && profile.ignored.includes(entry.key)) {
                warn('Infocaixa ' + profile.title + ': "' + entry.key + '" é aceito pelo verificador, mas não é lido na exibição atual. Valor preservado.');
            }
        }
        return '{{' + parts.filter(x => x !== null).join('|') + '}}';
    }
    function obsoleteTemplate(raw, bump, warn) {
        const p = parsedTemplate(raw), rule = OBSOLETE_CATALOG[p.name];
        if (!rule || rule.action === 'remove_top_level') return raw;
        const positional = [], named = {};
        for (const part of p.parts.slice(1)) {
            const m = part.match(/^\s*([^=\n]+?)\s*=([\s\S]*)$/);
            if (m) {
                const key = norm(m[1]);
                if (Object.prototype.hasOwnProperty.call(named, key)) { warn('Predefinição obsoleta com parâmetro repetido preservada: ' + p.parts[0].trim()); return raw; }
                named[key] = m[2].trim();
            } else positional.push(part);
        }
        const allowed = keys => Object.keys(named).every(k => keys.includes(k));
        let result = raw;
        if (['nascimento', 'birth date', 'birth date and age'].includes(p.name) && allowed(p.name === 'nascimento' ? ['lang'] : ['df', 'mf']) &&
            positional.length === 3 && positional.every(x => /^\d+$/.test(x.trim()))) {
            const [d, m, y] = p.name === 'nascimento' ? positional.map(Number) : [+positional[2], +positional[1], +positional[0]];
            if (validDate(d, m, y)) result = '{{Dni|' + d + '|' + m + '|' + y +
                (p.name === 'birth date and age' ? '' : '|si') + (named.lang && !/^(?:br|pt)$/i.test(named.lang) ? '|lang=' + named.lang : '') + '}}';
        } else if (['falecimento', 'falecimento e idade', 'morte e idade', 'death date', 'death date and age'].includes(p.name) &&
            allowed(p.name.startsWith('death') ? ['df', 'mf'] : []) &&
            [3, 6].includes(positional.length) && positional.every(x => /^\d+$/.test(x.trim()))) {
            let args = positional.map(x => x.trim());
            if (p.name.startsWith('death')) args = [args[2], args[1], args[0]].concat(args.length === 6 ? [args[5], args[4], args[3]] : []);
            if (validDate(+args[0], +args[1], +args[2]) && (args.length === 3 || validDate(+args[3], +args[4], +args[5])))
                result = '{{Morte|' + args.join('|') + '}}';
        } else if (p.name === 'língua' && allowed([]) && positional.length === 1 && /^[a-z][a-z0-9-]*$/i.test(positional[0].trim()))
            result = '{{Língua-meta|' + positional[0].trim() + '|nomeBR}}';
        else if (p.name === 'politônico' && allowed([]) && positional.length === 1)
            result = '{{Lang|grc|' + positional[0] + '}}';
        else if (['azul', 'branco', 'preto'].includes(p.name) && allowed([]) && positional.length === 1)
            result = '{{Cor do texto|' + {azul: 'blue', branco: 'white', preto: 'black'}[p.name] + '|' + positional[0] + '}}';
        else if (p.name === 'sem imagem-biografia' && positional.length === 0 && allowed(['data', 'date'])) {
            const hasData = Object.prototype.hasOwnProperty.call(named, 'data');
            const hasDate = Object.prototype.hasOwnProperty.call(named, 'date');
            if (hasData && hasDate && named.data !== named.date)
                warn('Sem imagem-biografia tem valores diferentes em data / date. A chamada foi preservada.');
            else result = '{{Sem imagem|bio' + (hasData || hasDate ? '|data=' + (hasData ? named.data : named.date) : '') + '}}';
        }
        else if (p.name === 'outrosusos' && allowed([]) && positional.length <= 1)
            result = '{{Ver desambig' + (positional.length && positional[0].trim() ? '||' + positional[0] : '') + '}}';
        else if (p.name === 'desambigexplicada' && allowed([]) && positional.length === 2)
            result = '{{Ver desambig||' + positional[1] + '|este=' + positional[0] + '}}';
        else if (p.name === 'minidesambig' && allowed([]) && positional.length >= 2 && positional.length <= 6)
            result = '{{Ver desambig|' + positional.join('|') + '|prefixo=Se procura}}';
        else if (p.name === 'ver desambiguação2' && allowed([]) && [3, 4].includes(positional.length))
            result = '{{Ver desambig|' + positional[1] + '|' + positional[2] + '|este=' + positional[0] +
                (positional[3] ? '|ou=' + positional[3] : '') + '}}';
        if (result !== raw) bump('obsoleteTemplates');
        else if (p.name !== 'reflist') warn('Predefinição obsoleta preservada para revisão: ' + p.parts[0].trim() +
            (rule.replacement ? '. Alternativa: ' + rule.replacement + '.' : '.'));
        return result;
    }
    function cleanLinks(s, bump) {
        return s.replace(/\[\[([^\[\]\n|]+)\|([^\[\]\n|]+)]]/g, (all, target, label) => {
            if (/[:#{}<>]/.test(target) || /[{}<>]/.test(label)) return all;
            const title = target.trim().replace(/_/g, ' '), text = label.trim();
            if (!title || !text || label !== text) return all;
            const lowerFirst = v => v[0].toLocaleLowerCase('pt') + v.slice(1);
            if (lowerFirst(title) === lowerFirst(text)) {
                bump('links'); return '[[' + text + ']]';
            }
            if (lowerFirst(text).startsWith(lowerFirst(title))) {
                const suffix = text.slice(title.length);
                if (/^[a-záéíóúâêôãõç]+$/.test(suffix)) {
                    bump('links'); return '[[' + text.slice(0, title.length) + ']]' + suffix;
                }
            }
            return all;
        });
    }
    function wikiURLs(s, bump) {
        return s.replace(/\[(https?:\/\/pt\.wikipedia\.org\/[^\s\]<>]+)(?:[ \t]+([^\]\n]+))?]/gi, (all, address, label) => {
            if (!label || /[\[\]{}<>]/.test(label)) return all;
            try {
                const u = new URL(address.replace(/&amp;/g, '&'));
                let title;
                if (u.pathname.startsWith('/wiki/') && !u.search) title = decodeURIComponent(u.pathname.slice(6));
                else if (u.pathname === '/w/index.php' && [...u.searchParams.keys()].every(k => k === 'title') && u.searchParams.getAll('title').length === 1)
                    title = u.searchParams.get('title');
                else return all;
                title = title.replace(/_/g, ' ');
                const fragment = u.hash ? decodeURIComponent(u.hash.slice(1)).replace(/_/g, ' ') : '';
                if (fragment) title += '#' + fragment;
                if (!title || /[|\[\]{}<>\r\n]/.test(title) || /^(?:Especial|Special)\s*:/i.test(title)) return all;
                if (/^(?:Categoria|Category|Ficheiro|Arquivo|File|Image|Imagem)\s*:/i.test(title)) title = ':' + title;
                bump('urlLinks'); return '[[' + title + '|' + label + ']]';
            } catch (_) { return all; }
        });
    }
    function cleanHeadings(s, bump, multilingual = true) {
        const ranges = structuralRanges(s);
        const names = {...(multilingual ? TRANSLATION_RULES.headings : {}), 'see also': 'Ver também', 'ver también': 'Ver também', 'veja também': 'Ver também',
            'external links': 'Ligações externas', 'enlaces externos': 'Ligações externas',
            'links externos': 'Ligações externas', 'bibliography': 'Bibliografia',
            'further reading': 'Leitura complementar', 'references': 'Referências',
            'referencias': 'Referências', 'referências': 'Referências'};
        return s.replace(/^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm, (all, marks, title, offset) => {
            if (inRange(offset, ranges)) return all;
            const key = norm(title.replace(/^'''(.*)'''$/, '$1'));
            if (!Object.prototype.hasOwnProperty.call(names, key)) {
                if (!/^'''[^']+'''$/.test(title)) return all;
                bump('headings'); return marks + ' ' + title.slice(3, -3) + ' ' + marks;
            }
            const result = marks + ' ' + names[key] + ' ' + marks;
            if (result !== all) bump('headings'); return result;
        });
    }
    // Resíduos específicos de uma tradução colada no artigo inteiro. Cada
    // regra tem uma lista fechada e preserva trechos literais e dados de fontes.
    const OBSOLETE_TRANSLATION_CATEGORIES = Object.freeze(['!Artigos com descrição curta']);
    function translationResidueAllowed(cfg) {
        return cfg?.namespaceNumber === 0 && !cfg.sectionOnly && !cfg.discussionPage &&
            !cfg.pageRedirect && !cfg.pageDisambiguation && cfg.translationResidues !== false;
    }
    function residueLiteralTopic(source, cfg = {}) {
        const technical = /\b(?:html|xhtml|xml|sgml|wikitext(?:o)?|markdown|mediawiki|javascript|typescript|css|unicode|ampersand|e[- ]comercial|entidades?\s+(?:html|xml)|codifica[çc][ãa]o\s+de\s+(?:caracteres|entidades)|sequ[êe]ncias?\s+de\s+escape|linguagem\s+de\s+marca[çc][ãa]o)\b/iu;
        if (technical.test(String(cfg.pageTitle || '').replace(/_/g, ' '))) return true;
        const view = protectedView(source), firstHeading = view.search(/^={2,6}/m);
        const lead = view.slice(0, Math.min(firstHeading < 0 ? view.length : firstHeading, 3000));
        return technical.test(lead);
    }
    function residueRanges(source) {
        const view = protectedView(source), ranges = structuralRanges(view).slice();
        const parsed = templates(view);
        for (const node of parsed.unclosed) ranges.push({start:node.start,end:source.length});
        const stack = [];
        for (let at = 0; at < view.length;) {
            const tag = tagAt(view, at);
            if (tag) {
                let end = tag.end;
                if (!tag.close && !tag.self && ['samp','kbd','var','tt','cite','ref','references'].includes(tag.name)) {
                    const close = new RegExp('<\\s*\\/\\s*'+tag.name+'\\s*>','gi'); close.lastIndex = end;
                    const match = close.exec(view); end = match ? close.lastIndex : source.length;
                }
                ranges.push({start:at,end}); at = end; continue;
            }
            if (view.slice(at, at + 2) === '[[') { stack.push({start:at,kind:'internal'}); at += 2; continue; }
            if (view.slice(at, at + 2) === ']]' && stack.at(-1)?.kind === 'internal') {
                ranges.push({start:stack.pop().start,end:at + 2}); at += 2; continue;
            }
            if (view[at] === '[' && !stack.length) { stack.push({start:at,kind:'external'}); at++; continue; }
            if (view[at] === ']' && stack.at(-1)?.kind === 'external') {
                ranges.push({start:stack.pop().start,end:at + 1}); at++; continue;
            }
            at++;
        }
        for (const item of stack) ranges.push({start:item.start,end:source.length});
        let fence = null;
        for (const match of view.matchAll(/^[ \t]{0,3}(`{3,}|~{3,})([^\r\n]*)(?:\r?\n|$)/gm)) {
            if (!fence) fence = {start:match.index,char:match[1][0],length:match[1].length};
            else if (match[1][0] === fence.char && match[1].length >= fence.length && !match[2].trim()) {
                ranges.push({start:fence.start,end:match.index + match[0].length}); fence = null;
            }
        }
        if (fence) ranges.push({start:fence.start,end:source.length});
        // Endereços, títulos, ênfase e aspas podem conter grafias literais.
        for (const match of view.matchAll(/(?:\b[a-z][a-z\d+.-]*:\/\/|\b(?:mailto|urn|data|tel):|\/\/|\bwww\.)[^\s<>\[\]{}]+/gi))
            ranges.push({start:match.index,end:match.index + match[0].length});
        for (const match of view.matchAll(/^={1,6}[^\r\n]*$/gm))
            ranges.push({start:match.index,end:match.index + match[0].length});
        for (const match of view.matchAll(/('{2,5})(?!')[\s\S]*?\1|(`+)(?!`)[\s\S]*?\2|"[^"\r\n]*"|'[^'\r\n]*'|“[^”\r\n]*”|‘[^’\r\n]*’|«[^»\r\n]*»|\([^()\r\n]*\)/g))
            ranges.push({start:match.index,end:match.index + match[0].length});
        // An unmatched quotation or tag is not ordinary prose that this rule
        // can identify confidently. Keep the rest of that line untouched.
        let lineStart = 0;
        for (const line of view.match(/[^\n]*(?:\n|$)/g) || []) {
            if (!line) continue;
            const wikiQuotes = [...line.matchAll(/'{2,5}/g)].map(match=>match[0]);
            if ((line.match(/"/g) || []).length % 2 || (line.match(/`/g) || []).length % 2 ||
                (line.match(/'/g) || []).length % 2 || wikiQuotes.length % 2 ||
                wikiQuotes.some((value,index)=>index % 2 && value !== wikiQuotes[index-1]) ||
                /<[^>\r\n]*$/.test(line.replace(/\r?\n$/,'')))
                ranges.push({start:lineStart,end:lineStart + line.length});
            if ((line.includes('“') && !line.includes('”')) || (line.includes('‘') && !line.includes('’')) ||
                (line.includes('«') && !line.includes('»'))) ranges.push({start:lineStart,end:lineStart + line.length});
            lineStart += line.length;
        }
        return {view,ranges};
    }
    function obsoleteShortDescriptionCategoryEdits(source, cfg) {
        if (!translationResidueAllowed(cfg) || cfg.categories === false ||
            cfg.shortDescriptions === false && cfg.obsoleteTemplates === false) return [];
        if (!/\[\[[Cc]ategoria[ \t]*:[ \t]*!Artigos[ _\t]+com[ _\t]+descrição[ _\t]+curta\b/u.test(source)) return [];
        const {view,ranges} = residueRanges(source), edits = [];
        const links = /\[\[([Cc]ategoria)[ \t]*:[ \t]*([^|\]\r\n]+)(?:\|([^\]\r\n]*))?\]\]/g;
        for (const match of view.matchAll(links)) {
            const title = match[2].trim().replace(/_/g, ' ').replace(/[ \t]+/g, ' ');
            if (!OBSOLETE_TRANSLATION_CATEGORIES.includes(title)) continue;
            // The matched link itself is a protected range. Ignore only that
            // exact span, while keeping enclosing templates/tables/links intact.
            const start = match.index, end = start + match[0].length;
            if (ranges.some(r => (r.start !== start || r.end !== end) && r.start < end && r.end > start)) continue;
            const key = match[3];
            if (key !== undefined && /[{}<>\[\]\uE000]/.test(key)) continue;
            const lineStart = source.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
            const newline = source.indexOf('\n', end), lineEnd = newline < 0 ? source.length : newline;
            const standalone = !source.slice(lineStart, start).trim() && !source.slice(end, lineEnd).trim();
            edits.push(standalone ? {start:lineStart,end:newline < 0 ? lineEnd : newline + 1,text:'',kind:'obsoleteShortDescriptionCategories'} :
                {start,end,text:'',kind:'obsoleteShortDescriptionCategories'});
        }
        return edits;
    }
    function doubleEncodedAmpersandEdits(source, cfg) {
        if (!translationResidueAllowed(cfg) || cfg.markup === false || !source.includes('&amp;amp;') ||
            residueLiteralTopic(source, cfg)) return [];
        const {view,ranges} = residueRanges(source), edits = [];
        const paragraphs = [], paragraphCache = new Map(); let start = 0;
        for (const match of view.matchAll(/\r?\n[ \t]*\r?\n/g)) {
            paragraphs.push({start,end:match.index}); start = match.index + match[0].length;
        }
        paragraphs.push({start,end:view.length});
        const technical = /\b(?:html|xhtml|xml|sgml|entidad(?:e|es)|entity|entities|codifica[çc][ãa]o|escaping|escape|ampersand|e[- ]comercial|c[oó]digo[- ]fonte|sintaxe|literal|literalmente|caracter(?:e|es)?\s+(?:especial|especiais))\b/iu;
        function paragraphAt(at) {
            let low = 0, high = paragraphs.length - 1;
            while (low < high) { const middle = (low + high + 1) >>> 1; if (paragraphs[middle].start <= at) low = middle; else high = middle - 1; }
            if (!paragraphCache.has(low)) paragraphCache.set(low, technical.test(view.slice(paragraphs[low].start, paragraphs[low].end)));
            return paragraphCache.get(low);
        }
        for (const match of view.matchAll(/&amp;amp;/g)) {
            const at = match.index, end = at + match[0].length;
            if (inRange(at, ranges) || paragraphAt(at)) continue;
            // This rule repairs only a conjunction between prose words, as in
            // Hägglund &amp;amp; Söner. Other entities and encodings are untouched.
            if (!/[\p{L}\p{M}][ \t]+$/u.test(view.slice(Math.max(0, at - 80), at)) ||
                !/^[ \t]+\p{L}/u.test(view.slice(end, end + 80))) continue;
            edits.push({start:at,end,text:'&amp;',kind:'doubleEncodedAmpersands'});
        }
        return edits;
    }
    function wholeArticleMarkdownFenceEdits(source, cfg) {
        if (!translationResidueAllowed(cfg) || cfg.markup === false || !source.includes('```')) return [];
        const open = source.match(/^((?:[ \t]*\r?\n)*)[ \t]{0,3}```(wiki|wikitext|mediawiki)?[ \t]*\r?\n/i);
        const close = source.match(/(\r?\n)[ \t]{0,3}```[ \t]*(?:\r?\n[ \t]*)*$/);
        if (!open || !close || close.index < open[0].length) return [];
        const body = source.slice(open[0].length, close.index);
        if (residueLiteralTopic(body,cfg) || /^[ \t]{0,3}(?:```|~~~)/m.test(body)) return [];
        const view = protectedView(body), parsed = templates(view);
        if (parsed.unclosed.length || malformedRefs(view)) return [];
        const categories = /\[\[[Cc]ategoria[ \t]*:/u.test(view);
        const headings = /^={2,6}[ \t]*[^=\r\n].*?={2,6}[ \t]*$/m.test(view);
        const nodes = topNodes(view).map(n => parsedTemplate(view.slice(n.start,n.end)).name);
        const info = nodes.some(name => /^info(?:\/|$)/.test(name) || Object.hasOwn(INFOBOX_CATALOG,name));
        const references = nodes.some(name => ['referências','referencias','reflist','references','notas e referências'].includes(name)) ||
            /<references\b/i.test(view);
        const leadEnd = view.search(/^={2,6}/m);
        const lead = applyEdits(view.slice(0,leadEnd < 0 ? view.length : leadEnd),
            topNodes(view.slice(0,leadEnd < 0 ? view.length : leadEnd)).map(n => ({...n,text:''}))).trim();
        const articleLead = /^(?:(?:O|A|Os|As|Um|Uma)[ \t]+)?'''[\p{L}\p{N}][^\r\n]{1,220}?'''[ \t]+[^\r\n]+/u.test(lead) &&
            !/\b(?:exemplo|sintaxe|c[oó]digo[- ]fonte|entidade\s+html|wikitext(?:o)?|markdown)\b/iu.test(lead.slice(0,500));
        if (!articleLead || !headings || (!categories && !info && !references)) return [];
        // An unlabelled fence needs all three independent structural signals.
        if (!open[2] && (!categories || !references || !info)) return [];
        const closeStart = close.index + close[1].length;
        const lastNewline = source.indexOf('\n',closeStart), closeEnd = lastNewline < 0 ? source.length : lastNewline + 1;
        return [{start:open[1].length,end:open[0].length,text:'',kind:'markdownWrappers'},
            {start:closeStart,end:closeEnd,text:'',kind:'markdownWrappers'}];
    }
    function applyTranslationResidueEdits(source, edits, bump, wrapper = false) {
        if (!edits.length) return source;
        if (typeof bump === 'function') {
            if (wrapper) bump('markdownWrappers');
            else for (const edit of edits) bump(edit.kind);
        }
        return applyEdits(source,edits);
    }
    function removeWholeArticleMarkdownFence(source,cfg,bump,warn) {
        return applyTranslationResidueEdits(source,wholeArticleMarkdownFenceEdits(source,cfg),bump,true);
    }
    function removeObsoleteShortDescriptionCategory(source,cfg,bump,warn) {
        return applyTranslationResidueEdits(source,obsoleteShortDescriptionCategoryEdits(source,cfg),bump);
    }
    function repairDoubleEncodedAmpersands(source,cfg,bump,warn) {
        return applyTranslationResidueEdits(source,doubleEncodedAmpersandEdits(source,cfg),bump);
    }
    function removeKnownTranslationResidues(source,cfg,bump,warn) {
        let next = removeWholeArticleMarkdownFence(source,cfg,bump,warn);
        next = removeObsoleteShortDescriptionCategory(next,cfg,bump,warn);
        return repairDoubleEncodedAmpersands(next,cfg,bump,warn);
    }
    function knownTranslationResidueChanges(source,cfg) {
        const changes = []; let next = source;
        for (const planner of [wholeArticleMarkdownFenceEdits,obsoleteShortDescriptionCategoryEdits,doubleEncodedAmpersandEdits]) {
            const edits = planner(next,cfg);
            if (!edits.length) continue;
            changes.push({before:next,after:applyEdits(next,edits),edits:edits.map(edit => ({...edit,before:next.slice(edit.start,edit.end)}))});
            next = changes.at(-1).after;
        }
        return {source,normalized:next,changes};
    }
    function residueEquivalenceSource(source) {
        // Fixed source-based proof for preservation checks. This does not
        // interpret arbitrary entities or change options supplied by a page.
        return removeKnownTranslationResidues(source,{namespaceNumber:0,sectionOnly:false,discussionPage:false,
            pageRedirect:false,pageDisambiguation:false,categories:true,shortDescriptions:true,obsoleteTemplates:true,
            markup:true,translationResidues:true},()=>{},()=>{});
    }

    const STRUCTURAL_END_HEADINGS = new Set(['ver também','veja também','see also','notas','notes','referências','referencias','references','notas e referências','bibliografia','bibliography','leitura complementar','leitura adicional','further reading','ligações externas','external links']);
    const STRUCTURAL_LIST_NAMES = new Set(['referências','referencias','reflist','references','lista de referências','listaref']);
    const STRUCTURAL_NOTE_CALLS = new Set(['sfn','sfnp','sfnm','refn','efn','nre','r','rp','ref','nota','notas','notas e referências']);
    const STRUCTURAL_SAFE_BOX_CHILDREN = new Set(['flag','flagicon','flagcountry','bandeira','nowrap','nobr','lang','lang-en','lang-sv']);
    function structuralScope(cfg={}) {
        return cfg.structuralRepairs !== false && (cfg.namespaceNumber === undefined || cfg.namespaceNumber === 0) &&
            !cfg.sectionOnly && !cfg.discussionPage && !cfg.redirectPage && !cfg.disambiguationPage && !cfg.pageRedirect && !cfg.pageDisambiguation;
    }
    function structuralQuoteRanges(view) {
        const out=[];
        for(const m of view.matchAll(/"[^"\n]*(?:\n[^"\n]*)*"|“[^”]*”|«[^»]*»|'{2,5}[^'\n]+?'{2,5}/gu))out.push({start:m.index,end:m.index+m[0].length});
        for(const m of view.matchAll(/["“«]/gu))if(!inRange(m.index,out)){out.push({start:m.index,end:view.length});break;}
        return out;
    }
    function structuralContainerRanges(view) {
        const ranges=[],stack=[];
        for(const m of view.matchAll(/<\s*(\/?)\s*(table|div)\b[^>]*>/gi)){
            const name=m[2].toLowerCase();
            if(!m[1]){if(!/\/\s*>$/.test(m[0]))stack.push({name,start:m.index});continue;}
            const i=stack.map(x=>x.name).lastIndexOf(name);
            if(i>=0){const open=stack[i];stack.splice(i);ranges.push({start:open.start,end:m.index+m[0].length});}
        }
        for(const open of stack)ranges.push({start:open.start,end:view.length});
        return ranges;
    }
    function structuralReaders(source) {
        const view=protectedView(source), blockers=[...structuralRanges(view).filter(r=>view.slice(r.start,r.start+2)==='{|'),...refTokens(view),...structuralQuoteRanges(view),...structuralContainerRanges(view)];
        // Explicit links, including an unfinished link, are never deletion targets.
        const links=editorialWikiLinkRanges(view);
        for(const m of view.matchAll(/\[(?:https?:\/\/|\/\/)[^\]\n]*(?:\]|$)/g))links.push({start:m.index,end:m.index+m[0].length});
        blockers.push(...links);
        const nodes=topNodes(view).filter(n=>!inRange(n.start,blockers)).map(n=>({...n,raw:source.slice(n.start,n.end),p:parsedTemplate(source.slice(n.start,n.end))}));
        const headings=[...view.matchAll(/^(={2,6})[ \t]*([^=\n]+?)[ \t]*\1[ \t]*(?:\r?\n|$)/gm)].filter(m=>!inRange(m.index,blockers)).map(m=>({start:m.index,end:m.index+m[0].length,level:m[1].length,title:norm(m[2]),raw:m[0]}));
        let lastOther=-1;
        for(const h of headings)if(h.level===2&&!STRUCTURAL_END_HEADINGS.has(h.title))lastOther=h.start;
        const finalHeadings=headings.filter(h=>h.level===2&&h.start>lastOther&&STRUCTURAL_END_HEADINGS.has(h.title));
        return {view,nodes,headings,finalHeadings,blockers};
    }
    function structuralLiteralTemplate(raw,box=false) {
        if(/<!--|\{\{\{|\{\{\s*(?:#|subst:|safesubst:)|<\s*(?:ref|references|nowiki|pre|code|syntaxhighlight|source|blockquote|q)\b/i.test(raw))return false;
        const parsed=parsedTemplate(raw);
        if(parsed.parts.slice(1).some(x=>/\b(?:id|anchor|âncora|ancora)\s*=/.test(x)))return false;
        const children=templates(raw.slice(2,-2)).nodes;
        for(const n of children){const p=parsedTemplate(raw.slice(2,-2).slice(n.start,n.end));
            if(STRUCTURAL_NOTE_CALLS.has(p.name)||CITE_NAMES[p.name]||!box||!STRUCTURAL_SAFE_BOX_CHILDREN.has(p.name))return false;
        }
        return true;
    }
    function structuralBareList(raw) {
        if(/^<\s*references\s*(?:\/\s*>|>\s*<\s*\/\s*references\s*>)$/i.test(raw))return true;
        if(!/^\{\{/.test(raw))return false;
        const p=parsedTemplate(raw);
        if(!STRUCTURAL_LIST_NAMES.has(p.name))return false;
        if(p.parts.length===1)return true;
        // Only heading suppression is equivalent to a bare global renderer.
        return p.parts.slice(1).every(part=>/^\s*(?:nível|nivel)\s*=\s*0\s*$/i.test(part));
    }
    function structuralArticlePlan(source,cfg={}) {
        const result={source,boxRemovals:[],footerRemovals:[],referencePlan:null,headingRemovals:[],conflicts:[]};
        if(typeof source!=='string'||!structuralScope(cfg))return result;
        const info=structuralReaders(source),{view,nodes,headings,finalHeadings}=info;
        if(templates(view).unclosed.length||malformedRefs(view))return result;
        const firstMain=headings.find(h=>h.level===2&&!STRUCTURAL_END_HEADINGS.has(h.title))?.start??source.length;
        const finalStart=finalHeadings[0]?.start??source.length;
        const boxes=cfg.infoboxes===false?[]:nodes.filter(n=>!!INFOBOX_CATALOG[n.p.name]);
        const firsts=new Map();
        for(const n of boxes){
            const first=firsts.get(n.p.name);
            if(!first){firsts.set(n.p.name,n);continue;}
            const adjacent=/^\s*$/.test(source.slice(first.end,n.start));
            if(first.start>=firstMain||!(adjacent||n.start>=finalStart))continue;
            if(n.raw===first.raw&&structuralLiteralTemplate(n.raw,true))result.boxRemovals.push({...n,firstStart:first.start,firstRaw:first.raw});
            else if(n.raw!==first.raw){
                const identity=p=>foreignEntries(p).find(e=>['nome','name','título','titulo'].includes(norm(e.key)))?.value.trim();
                const a=identity(first.p),b=identity(n.p);
                if(a&&a===b)result.conflicts.push({code:'infobox-conflict',start:n.start,end:n.end,message:'Duas infocaixas de '+a+' têm campos diferentes. As duas foram preservadas.'});
            }
        }
        const footer=footerTokens(source,cfg.footerProfiles||{}),seen=new Map();
        for(const n of footer.tokens){
            if(!['portal','authority','project','navbox'].includes(n.role)||!/^\{\{/.test(n.raw)||!structuralLiteralTemplate(n.raw))continue;
            if(inRange(n.start,info.blockers))continue;
            if(seen.has(n.raw))result.footerRemovals.push({...n,firstStart:seen.get(n.raw),p:parsedTemplate(n.raw)});
            else seen.set(n.raw,n.start);
        }
        if(cfg.references!==false){
            const lists=rendererRanges(view).filter(n=>!inRange(n.start,info.blockers)).map(n=>({...n,raw:source.slice(n.start,n.end)}));
            const common=lists.filter(n=>structuralBareList(n.raw));
            const otherCommon=lists.some(n=>!structuralBareList(n.raw)&&(()=>{
                if(n.raw.startsWith('<'))return !(attrsOf(tagAt(n.raw,0)?.attrs)?.group);
                const p=parsedTemplate(n.raw);return STRUCTURAL_LIST_NAMES.has(p.name)&&!foreignEntries(p).some(e=>['grupo','group'].includes(norm(e.key))&&e.value.trim());
            })());
            const refs=refTokens(view),defaultRefs=refs.filter(r=>!(attrsOf(r.attrs)?.group));
            const macros=templates(view).nodes.some(n=>{
                if(inRange(n.start,refs))return false;
                return STRUCTURAL_NOTE_CALLS.has(parsedTemplate(source.slice(n.start,n.end)).name);
            });
            const local=common.some(n=>{
                const preceding=headings.filter(h=>h.start<n.start).at(-1);
                if(!preceding||STRUCTURAL_END_HEADINGS.has(preceding.title))return false;
                return n.start<finalStart&&headings.some(h=>h.start>n.end&&!STRUCTURAL_END_HEADINGS.has(h.title));
            });
            const misplaced=common.some(n=>n.start<(defaultRefs[0]?.start??0)&&n.start<firstMain);
            let used=0,cursor=0;
            for(const n of common){if(defaultRefs.some(r=>r.start>=cursor&&r.start<n.start))used++;cursor=n.end;}
            if(defaultRefs.some(r=>r.start>=cursor))used++;
            if(common.length&&defaultRefs.length&&!otherCommon&&!macros&&!local&&used<=1&&(common.length>1||misplaced)){
                const cuts=common.map(n=>({start:n.start,end:n.end,text:/[\p{L}\p{N}]$/u.test(source.slice(0,n.start))&&/^[\p{L}\p{N}]/u.test(source.slice(n.end))?' ':''}));
                for(let i=0;i<headings.length;i++){
                    const h=headings[i];if(h.level!==2||!['referências','referencias','references'].includes(h.title))continue;
                    const end=headings[i+1]?.start??footer.start;
                    let body=source.slice(h.end,end);
                    const within=common.filter(n=>n.start>=h.end&&n.end<=end);
                    for(const n of within.slice().sort((a,b)=>b.start-a.start))body=body.slice(0,n.start-h.end)+body.slice(n.end-h.end);
                    if(within.length&&!body.trim())cuts.push({start:h.start,end:h.end,text:''});
                }
                let candidate=applyEdits(source,cuts);
                const ci=structuralReaders(candidate),lastRef=refTokens(ci.view).reduce((n,r)=>Math.max(n,r.end),0);
                const target=ci.finalHeadings.find(h=>h.start>=lastRef&&['bibliografia','bibliography','leitura complementar','leitura adicional','further reading','ligações externas','external links'].includes(h.title));
                const at=target?.start??footerTokens(candidate,cfg.footerProfiles||{}).start;
                if(at>=lastRef){
                    const prefix=candidate.slice(0,at),suffix=candidate.slice(at);
                    candidate=prefix.replace(/\n*$/,'\n\n')+'{{Referências}}\n\n'+suffix.replace(/^\n+/,'');
                    result.referencePlan={text:candidate,removed:Math.max(0,common.length-1),calls:common.length};
                }
            }
        }
        // Remove an actually empty final heading, never a heading owning prose or a subsection.
        const end=footerTokens(source,cfg.footerProfiles||{}).start;
        for(let i=0;i<headings.length;i++){
            const h=headings[i],next=headings[i+1];
            if(cfg.headings===false||!finalHeadings.includes(h)||h.start>=end||(next&&next.level>h.level))continue;
            const finish=Math.min(next?.start??end,end);
            // A retained box or other unresolved template still belongs to this section.
            if(nodes.some(n=>n.start>=h.end&&n.start<(next?.start??source.length)&&(!footer.tokens.some(t=>t.start===n.start&&t.role))))continue;
            if(!source.slice(h.end,finish).trim())result.headingRemovals.push({start:h.start,end:h.end,text:''});
        }
        return result;
    }
    function automaticStructureCleanup(source,cfg={},bump=()=>{},warn=()=>{}) {
        if(!structuralScope(cfg))return source;
        let s=source;
        const first=structuralArticlePlan(s,cfg);
        const removals=[...first.boxRemovals.map(n=>({...n,text:''})),...first.footerRemovals.map(n=>({...n,text:''}))];
        if(removals.length){s=applyEdits(s,removals);first.boxRemovals.forEach(()=>bump('repeatedInfoboxes'));first.footerRemovals.forEach(()=>bump('repeatedFooterTemplates'));}
        const plan=structuralArticlePlan(s,cfg);
        if(plan.referencePlan&&plan.referencePlan.text!==s){s=plan.referencePlan.text;bump('relocatedReferenceList');for(let i=0;i<plan.referencePlan.removed;i++)bump('redundantReferenceLists');}
        const tail=structuralArticlePlan(s,cfg);
        if(tail.headingRemovals.length){s=applyEdits(s,tail.headingRemovals);if(tail.headingRemovals.some(n=>n.start===0))s=s.replace(/^(?:\r?\n)+/,'');tail.headingRemovals.forEach(()=>bump('emptyEndHeadings'));}
        return s;
    }
    function preserveLegacyRendererLayout(source,cfg={},bump=()=>{}) {
        if(!structuralScope(cfg)||cfg.references===false)return source;
        const info=structuralReaders(source),edits=[];
        for(const n of info.nodes){
            if(n.p.name!=='reflist')continue;
            const migrated=migrateReflist(n.p,source.slice(0,n.start),()=>{});
            if(!migrated)continue;
            const p=parsedTemplate(migrated);
            if(p.parts.slice(1).some(part=>/^\s*(?:nível|nivel)\s*=/.test(part)))continue;
            edits.push({start:n.start,end:n.end,text:'{{'+p.parts.join('|')+'|nível=0}}'});
        }
        if(edits.length)edits.forEach(()=>bump('rendererHeadingPreserved'));
        return applyEdits(source,edits);
    }
    function structuralAudit(source,cfg={}) {
        if(!structuralScope(cfg))return [];
        const plan=structuralArticlePlan(source,cfg),findings=plan.conflicts.slice();
        // Useful remaining conflicts only. Legitimate multiple boxes/lists are quiet.
        const info=structuralReaders(source),firstHeading=info.headings[0]?.start??source.length;
        const firstRef=refTokens(info.view).find(r=>!(attrsOf(r.attrs)?.group))?.start;
        if(firstRef!==undefined)for(const n of info.nodes){
            if(!['referências','referencias'].includes(n.p.name)||n.start>=firstRef||n.start>=firstHeading)continue;
            const e=foreignEntries(n.p);if(e.some(x=>['grupo','group'].includes(norm(x.key))&&x.value.trim())||e.some(x=>['nível','nivel'].includes(norm(x.key))&&x.value.trim()==='0'))continue;
            findings.push({code:'reference-heading-before-lead',start:n.start,end:n.end,message:'A chamada de Referências antes da introdução gera um título nesse ponto. Confira a lista e suas definições.'});break;
        }
        return findings;
    }
    function structuralRenderedObjects(html,Parser,selector) {
        const doc=new Parser().parseFromString(html,'text/html');
        return [...doc.querySelectorAll(selector)].filter(e=>!e.parentElement?.closest(selector)).map(e=>{
            const copy=e.cloneNode(true);copy.querySelectorAll('script,style,.reference,.mw-editsection,.mw-collapsible-toggle').forEach(n=>n.remove());
            return {text:copy.textContent.replace(/\s+/g,' ').trim(),links:[...copy.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(u=>!/^#cite_/.test(u)),images:[...copy.querySelectorAll('img')].map(i=>i.getAttribute('src'))};
        });
    }
    function structuralReferenceDisplay(html,Parser) {
        const doc=new Parser().parseFromString(html,'text/html');
        const months={january:1,jan:1,janeiro:1,february:2,feb:2,fevereiro:2,march:3,mar:3,março:3,april:4,apr:4,abril:4,may:5,maio:5,june:6,jun:6,junho:6,july:7,jul:7,julho:7,august:8,aug:8,agosto:8,september:9,sep:9,sept:9,setembro:9,october:10,oct:10,outubro:10,november:11,nov:11,novembro:11,december:12,dec:12,dezembro:12};
        const dates=new RegExp('\\b(\\d{1,2})\\s+(?:de\\s+)?('+Object.keys(months).join('|')+')\\.?\\s+(?:de\\s+)?(\\d{4})\\b','gi');
        return [...doc.querySelectorAll('li[id^="cite_note"]')].map(e=>{
            const copy=(e.querySelector('.reference-text')||e).cloneNode(true);
            copy.querySelectorAll('.error,.citation-comment,.Z3988,.mw-cite-backlink').forEach(n=>n.remove());
            const text=copy.textContent.replace(/\s+/g,' ').trim().replace(dates,(_,day,month,year)=>year+'-'+String(months[month.toLowerCase()]).padStart(2,'0')+'-'+String(Number(day)).padStart(2,'0')).replace(/Arquivado do original em|Cópia arquivada em/g,'Arquivo em');
            return {id:e.id,text,links:[...copy.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(u=>!/^#cite_/.test(u)).sort()};
        });
    }
    function structuralReferenceBank(source) {
        const view=protectedView(source),renderers=rendererRanges(view),out=new Set(),cfg={...DEFAULTS};
        for(const r of refTokens(view)){
            if(r.body===null)continue;
            const attrs=attrsOf(r.attrs)||{},parent=renderers.find(n=>n.start<=r.start&&r.start<n.end);
            let group=attrs.group||'';
            if(!group&&parent){const raw=source.slice(parent.start,parent.end);group=raw.startsWith('<')?attrsOf(tagAt(raw,0)?.attrs)?.group||'':foreignEntries(parsedTemplate(raw)).find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim()||'';}
            let body=mapTemplateTree(r.body,raw=>extendedCitation(citation(automaticCitationRepairs(raw,cfg,()=>{}),cfg,()=>{},()=>{}),cfg,()=>{},()=>{}));
            body=mapTemplateTree(body,raw=>{const p=parsedTemplate(raw);if(!CITE_NAMES[p.name])return raw;
                const fields=new Map();for(const e of foreignEntries(p))fields.set(parameterFamily(e.key),e.value.trim().replace(/[ \t\r\n]+/g,' '));
                return JSON.stringify({name:norm(CITE_NAMES[p.name]),fields:[...fields].sort((a,b)=>a[0].localeCompare(b[0]))});
            });
            out.add(JSON.stringify([group,body.replace(/[ \t\r\n]+/g,' ').trim()]));
        }
        return out;
    }
    function renderedStructuralTableProof(beforeHtml,afterHtml,Parser,beforeSource,afterSource) {
        const result={applied:false,accepted:true,boxes:0,footers:0,reason:''};
        if(typeof beforeSource!=='string'||typeof afterSource!=='string')return result;
        const plan=structuralArticlePlan(beforeSource,{namespaceNumber:0}),before=structuralReaders(beforeSource),after=structuralReaders(afterSource);
        const count=(items,raw)=>items.filter(n=>n.raw===raw).length;
        let allowedBoxes=0,allowedNavboxes=0;
        for(const raw of new Set(plan.boxRemovals.map(n=>n.raw))){const delta=count(before.nodes,raw)-count(after.nodes,raw);if(delta>0){
            const limit=plan.boxRemovals.filter(n=>n.raw===raw).length;
            if(delta>limit||count(after.nodes,raw)<1)return {...result,applied:true,accepted:false,reason:'A infocaixa que deveria permanecer foi alterada ou retirada.'};allowedBoxes+=delta;
        }}
        for(const raw of new Set(plan.footerRemovals.filter(n=>n.role==='navbox').map(n=>n.raw))){const delta=count(before.nodes,raw)-count(after.nodes,raw);if(delta>0)allowedNavboxes+=delta;}
        const collectorChanged=plan.referencePlan&&rendererRanges(before.view).length!==rendererRanges(after.view).length;
        const boxSelector='.infobox,.infobox_v2,table[class*="infobox_"]';
        if(structuralRenderedObjects(beforeHtml,Parser,boxSelector).length-structuralRenderedObjects(afterHtml,Parser,boxSelector).length>allowedBoxes)return {...result,applied:true,accepted:false,reason:'Uma infocaixa exibida desapareceu sem uma cópia literal confirmada no código.'};
        if(!allowedBoxes&&!allowedNavboxes&&!collectorChanged&&!plan.footerRemovals.some(n=>count(after.nodes,n.raw)<count(before.nodes,n.raw)))return result;
        result.applied=true;result.boxes=allowedBoxes;result.footers=plan.footerRemovals.length;
        if(preservationAudit(beforeSource,afterSource).length)return {...result,accepted:false,reason:'O código perdeu texto, arquivo, identificador ou trecho protegido.'};
        const newBank=structuralReferenceBank(afterSource);
        if([...structuralReferenceBank(beforeSource)].some(key=>!newBank.has(key)))return {...result,accepted:false,reason:'Uma definição de referência foi retirada ou alterada além das conversões reconhecidas.'};
        const same=JSON.stringify,compress=(list,removed)=>{
            const expected=list.slice();for(let i=expected.length-1;i>0&&removed;i--){const key=same(expected[i]);if(expected.slice(0,i).some(x=>same(x)===key)){expected.splice(i,1);removed--;}}
            return removed?null:expected;
        };
        const oldBoxes=structuralRenderedObjects(beforeHtml,Parser,'.infobox,.infobox_v2,table[class*="infobox_"]'),newBoxes=structuralRenderedObjects(afterHtml,Parser,'.infobox,.infobox_v2,table[class*="infobox_"]');
        const expectedBoxes=compress(oldBoxes,allowedBoxes);
        if(expectedBoxes===null||same(expectedBoxes)!==same(newBoxes))return {...result,accepted:false,reason:'Os dados visíveis da infocaixa que permaneceu não correspondem às cópias originais.'};
        const oldNav=structuralRenderedObjects(beforeHtml,Parser,'.navbox'),newNav=structuralRenderedObjects(afterHtml,Parser,'.navbox'),expectedNav=compress(oldNav,allowedNavboxes);
        if(expectedNav===null||same(expectedNav)!==same(newNav))return {...result,accepted:false,reason:'O conteúdo de uma caixa de navegação mudou além da cópia repetida.'};
        const oldRefs=structuralReferenceDisplay(beforeHtml,Parser),newRefs=structuralReferenceDisplay(afterHtml,Parser);
        function explicitNames(source){const names=new Set(),anon=[];for(const r of refTokens(protectedView(source))){if(r.body===null)continue;const attrs=attrsOf(r.attrs);if(attrs?.name)names.add((attrs.group||'')+'\0'+attrs.name);else anon.push(r.body);}return {names,anon};}
        const newExplicit=explicitNames(afterSource),minNew=newExplicit.names.size+newExplicit.anon.length;
        const refKey=e=>JSON.stringify([e.text,e.links]),oldTexts=new Set(oldRefs.map(refKey)),newTexts=new Set(newRefs.map(refKey));
        const named=new Set(refTokens(before.view).map(r=>attrsOf(r.attrs)?.name).filter(Boolean).map(n=>n.replace(/ /g,'_')));
        const explicit=e=>{let id=e.id.replace(/^cite_note-/,'').replace(/-\d+$/,'');try{id=decodeURIComponent(id.replace(/\.([0-9a-f]{2})/gi,'%$1'));}catch{}return named.has(id);};
        const implicitCounts=list=>{const out=new Map();for(const e of list.filter(x=>!explicit(x))){const key=refKey(e);out.set(key,(out.get(key)||0)+1);}return out;};
        const oldImplicit=implicitCounts(oldRefs),newImplicit=implicitCounts(newRefs);
        if(newRefs.length<minNew||[...oldTexts].some(text=>!newTexts.has(text))||[...oldImplicit].some(([key,n])=>(newImplicit.get(key)||0)<n))return {...result,accepted:false,reason:'As referências exibidas não foram preservadas na retirada das duplicações.'};
        return result;
    }

    // 2.4: bounded syntax repairs. This file is inserted inside RevisaWikiBoot.
    // Every proposal is tied to the exact input; no parser/network state is used.
    const V24_SYNTAX_RENDERERS = new Set(['referências','referencias','reflist','references','notas','notelist','notas e referências']);
    const V24_SYNTAX_CITATIONS = new Set(['citar web','citar livro','citar periódico','citar periodico','citar jornal','citar notícia','citar noticia','citar enciclopédia','citar conferência','citar tese','citar relatório','citar revista','citar vídeo','citar video','cite web','cite book','cite journal','cite news','citation']);
    const V24_SYNTAX_FORMATTING = new Set(['small','sup','sub','span']);
    const V24_SYNTAX_TYPO_TAGS = new Set(['ref','references','small','sup','sub','span']);
    const V24_SYNTAX_LITERAL = new Set(['nowiki','pre','syntaxhighlight','source','code','math','blockquote','q','chem','score','timeline','graph','templatedata','poem','gallery','hiero','imagemap','mapframe','maplink','inputbox','script','style']);
    const V24_SYNTAX_VOID = new Set(['br','hr','img','wbr','meta','link','input','area','base','col','embed','param','track']);
    const V24_SYNTAX_QUOTES = new Set(['quote','quotation','cquote','blockquote','citação','citar','citação em bloco','epígrafe']);
    const v24SyntaxPlanCache=new Map();let v24SyntaxPlanCacheBytes=0;
    function v24SyntaxRemember(plan) {
        const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};freeze(plan);
        const weight=2*(plan.source.length+plan.text.length)+4096+plan.edits.length*1200;
        if(weight<=4194304){const previous=v24SyntaxPlanCache.get(plan.source);if(previous)v24SyntaxPlanCacheBytes-=previous.weight;v24SyntaxPlanCache.delete(plan.source);v24SyntaxPlanCache.set(plan.source,{plan,weight});v24SyntaxPlanCacheBytes+=weight;
            while(v24SyntaxPlanCache.size>8||v24SyntaxPlanCacheBytes>4194304){const first=v24SyntaxPlanCache.keys().next().value;v24SyntaxPlanCacheBytes-=v24SyntaxPlanCache.get(first).weight;v24SyntaxPlanCache.delete(first);}}
        return plan;
    }
    function v24SyntaxName(value) { return String(value).trim().replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt').replace(/^(?:predefinição|template)\s*:\s*/,''); }
    function v24SyntaxHash(source) {
        let a=2166136261,b=2246822507;
        for(let i=0;i<source.length;i++){const n=source.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,3266489909);}
        return source.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);
    }
    function v24SyntaxScope(cfg={}) {
        return cfg.syntaxRepairs!==false&&cfg.structuralRepairs!==false&&!cfg.discussionPage&&!cfg.sectionOnly&&
            (cfg.namespaceNumber===undefined||cfg.namespaceNumber===0)&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v24SyntaxTag(source,start) {
        if(source[start]!=='<')return null;
        if(!/^<\s*[/\\]?\s*[a-z][a-z0-9-]*(?=[\s/>])/i.test(source.slice(start,start+128))||/^<\s+[A-Za-z]\s*</.test(source.slice(start,start+40)))return null;
        let quote='',end=start+1;
        for(;end<source.length;end++){const c=source[end];if(quote){if(c===quote)quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='<')return null;else if(c==='>')break;}
        if(end===source.length)return null;
        const raw=source.slice(start,end+1),m=raw.match(/^<\s*([/\\]?)\s*([a-z][a-z0-9-]*)\b([\s\S]*?)>$/i);
        if(!m)return null;
        return {start,end:end+1,raw,name:m[2].toLowerCase(),close:!!m[1],typo:m[1]==='\\',self:/\/\s*>$/.test(raw),attrs:m[3].replace(/\/\s*$/,'')};
    }
    function v24SyntaxAttrs(raw) {
        const result=Object.create(null),re=/\s+([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'|([^\s"'=<>`]+)))/gi;let m,last=0;
        while((m=re.exec(raw))){if(raw.slice(last,m.index).trim())return null;const key=m[1].toLowerCase();if(Object.hasOwn(result,key))return null;result[key]=m[2]??m[3]??m[4];last=re.lastIndex;}
        return raw.slice(last).trim()?null:result;
    }
    function v24SyntaxLiteralIdentity(attrs,requireName=false) {
        if(!attrs||Object.keys(attrs).some(k=>!['name','group'].includes(k)))return false;
        if(requireName&&(!attrs.name||!attrs.name.trim()))return false;
        return Object.values(attrs).every(v=>v.trim()===v&&!/[{}\[\]<>|&\r\n]/.test(v));
    }
    function v24SyntaxMaskRanges(source,ranges) {
        const chars=source.split('');for(const r of ranges)for(let i=r.start;i<r.end;i++)if(chars[i]!=='\n'&&chars[i]!=='\r')chars[i]=' ';return chars.join('');
    }
    function v24SyntaxTemplates(view) {
        const stack=[],nodes=[];
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(t){i=t.end;continue;}const top=stack.at(-1);
            if(top&&view.slice(i,i+top.size)==='}'.repeat(top.size)){stack.pop();nodes.push({...top,end:i+top.size,depth:stack.length});i+=top.size;}
            else if(view.slice(i,i+3)==='{{{'){stack.push({start:i,size:3});i+=3;}
            else if(view.slice(i,i+2)==='{{'){stack.push({start:i,size:2});i+=2;}else i++;}
        return {nodes,unclosed:stack};
    }
    function v24SyntaxMarkupQuote(view,start,insideRef=false) {
        if(view[start-1]==="'")return null;const open=view.slice(start).match(/^('{2,5})(?!')/);if(!open)return null;
        const stack=[open[1].length];let i=start+open[1].length,content=false;
        for(;i<view.length;){if(/[\r\n]/.test(view[i]))return null;
            if(insideRef&&view[i]==='<'){const tag=v24SyntaxTag(view,i);if(tag?.name==='ref')return null;}
            if(view[i]!=="'"){content=true;i++;continue;}
            let end=i+1;while(view[end]==="'")end++;const size=end-i;
            if(size===1){content=true;i=end;continue;}
            if(size===stack.at(-1)){stack.pop();if(!stack.length)return content?{end}:null;}
            else if(stack.length===1&&[2,3].includes(stack[0])&&[2,3].includes(size))stack.push(size);
            else return null;i=end;
        }
        return null;
    }
    function v24SyntaxProtected(source) {
        const ranges=[],unclosed=[];
        for(let i=0;i<source.length;){if(source.slice(i,i+4)==='<!--'){const at=source.indexOf('-->',i+4),end=at<0?source.length:at+3;const r={start:i,end,kind:'comment'};ranges.push(r);if(at<0)unclosed.push({...r,code:'syntax-opaque-unclosed'});i=end;continue;}
            const t=v24SyntaxTag(source,i);if(t&&!t.close&&V24_SYNTAX_LITERAL.has(t.name)){let end=t.end,closed=t.self;if(!t.self){const re=new RegExp('<\\s*\\/\\s*'+t.name+'\\s*>','gi');re.lastIndex=t.end;const close=re.exec(source);end=close?re.lastIndex:source.length;closed=!!close;}const r={start:i,end,kind:t.name};ranges.push(r);if(!closed)unclosed.push({...r,code:'syntax-opaque-unclosed'});i=end;continue;}i=t?t.end:i+1;}
        let view=v24SyntaxMaskRanges(source,ranges),parsed=v24SyntaxTemplates(view);
        for(const node of [...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:source.length}))]){if(node.size!==2)continue;const name=v24SyntaxName(view.slice(node.start+2,node.end).split(/[|}\n]/,1)[0]);if(V24_SYNTAX_QUOTES.has(name)){ranges.push({start:node.start,end:node.end,kind:'quotation-template'});if(!parsed.nodes.includes(node))unclosed.push({start:node.start,end:node.end,code:'syntax-opaque-unclosed'});}}
        view=v24SyntaxMaskRanges(source,ranges);
        // Attribute quotes are consumed with their tag. Paired prose quotation
        // marks are opaque, including examples containing malformed syntax.
        let quotedRefDepth=0;
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(t){if(t.name==='ref'&&!t.self){if(t.close&&!t.typo)quotedRefDepth=Math.max(0,quotedRefDepth-1);else if(!t.close)quotedRefDepth++;}i=t.end;continue;}const c=view[i],closer=c==='"'?'"':c==='“'?'”':c==='«'?'»':null;
            if(closer){const at=view.indexOf(closer,i+1),lineStart=view.lastIndexOf('\n',i-1)+1,tableAttribute=/^\{\|/.test(view.slice(lineStart,i))&&/=[ \t]*$/.test(view.slice(lineStart,i));if(tableAttribute&&at>=0){i=at+1;continue;}if(at>=0){ranges.push({start:i,end:at+1,kind:'quotation'});i=at+1;continue;}const r={start:i,end:source.length,kind:'quotation'};ranges.push(r);unclosed.push({...r,code:'syntax-opaque-unclosed'});break;}
            if(view.slice(i,i+2)==="''"){const m=v24SyntaxMarkupQuote(view,i,quotedRefDepth>0);if(m){ranges.push({start:i,end:m.end,kind:'quotation-markup'});i=m.end;continue;}}i++;}
        view=v24SyntaxMaskRanges(source,ranges);parsed=v24SyntaxTemplates(view);
        let offset=0;for(const line of source.match(/[^\n]*(?:\n|$)/g)||[]){if(!line)continue;if(/^[ \t]+\S/.test(line)&&![...parsed.nodes,...parsed.unclosed.map(n=>({...n,end:source.length}))].some(n=>n.start<=offset&&offset<n.end))ranges.push({start:offset,end:offset+line.length,kind:'preformatted'});offset+=line.length;}
        return {view:v24SyntaxMaskRanges(source,ranges),ranges,unclosed};
    }
    function v24SyntaxParts(body) {
        const parts=[],stack=[];let link=0,external=0,start=0;
        for(let i=0;i<body.length;){const t=v24SyntaxTag(body,i);if(t){i=t.end;continue;}const top=stack.at(-1),two=body.slice(i,i+2);
            if(top&&body.slice(i,i+top)==='}'.repeat(top)){stack.pop();i+=top;}
            else if(body.slice(i,i+3)==='{{{'){stack.push(3);i+=3;}
            else if(two==='{{'){stack.push(2);i+=2;}
            else if(two==='[['){link++;i+=2;}else if(two===']]'){if(!link)return null;link--;i+=2;}
            else if(body[i]==='['&&!link){external++;i++;}else if(body[i]===']'&&!link){if(!external)return null;external--;i++;}
            else if(body[i]==='|'&&!stack.length&&!link&&!external){parts.push({text:body.slice(start,i),start,end:i});start=++i;}else i++;}
        if(stack.length||link||external)return null;parts.push({text:body.slice(start),start,end:body.length});return parts;
    }
    function v24SyntaxScan(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,stack=[],links=[],external=[],tables=[],html=[],issues=shield.unclosed.slice(),boundaries=[0],tokens=[];
        const issue=(code,start,end=start+2)=>issues.push({code,start,end});
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(t){tokens.push({...t,templateDepth:stack.length,tableDepth:tables.length,linkDepth:links.length+external.length});
                if(!V24_SYNTAX_VOID.has(t.name)&&!t.self){if(!t.close){if(t.name==='ref'&&html.some(x=>x.name==='ref'))issue('syntax-nested-ref',t.start,t.end);html.push(t);}else if(html.at(-1)?.name===t.name&&!t.typo&&!t.attrs.trim())html.pop();else issue('syntax-stray-tag',t.start,t.end);}i=t.end;continue;}
            const two=view.slice(i,i+2),top=stack.at(-1);
            if(top&&view.slice(i,i+top.size)==='}'.repeat(top.size)){stack.pop();i+=top.size;}
            else if(view.slice(i,i+3)==='{{{'){stack.push({start:i,size:3});i+=3;}
            else if(two==='{{'){stack.push({start:i,size:2});i+=2;}
            else if(two==='}}'){issue('syntax-stray-template-close',i);i+=2;}
            else if(two==='[['){links.push(i);i+=2;}else if(two===']]'){if(links.length)links.pop();else issue('syntax-stray-link-close',i);i+=2;}
            else if(view[i]==='['&&!links.length&&/^(?:https?:|\/\/)/i.test(view.slice(i+1))){external.push(i++);}
            else if(view[i]===']'&&external.length){external.pop();i++;}
            else if(two==='{|'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',i-1)+1,i))){tables.push(i);i+=2;}
            else if(two==='|}'&&/^[ \t]*$/.test(view.slice(view.lastIndexOf('\n',i-1)+1,i))){if(tables.length)tables.pop();else issue('syntax-stray-table-close',i);i+=2;}
            else {if(view[i]==='<'&&/^<\s*[/\\]?\s*(?:ref|references|small|span|sup|sub)\b/i.test(view.slice(i)))issue('syntax-malformed-tag',i);if(view[i]==='\n'&&!stack.length&&!links.length&&!external.length&&!tables.length&&!html.length)boundaries.push(i+1);i++;}}
        stack.forEach(t=>issue('syntax-unclosed-template',t.start));links.forEach(t=>issue('syntax-unclosed-link',t));external.forEach(t=>issue('syntax-unclosed-external',t));tables.forEach(t=>issue('syntax-unclosed-table',t));html.forEach(t=>issue('syntax-unclosed-tag',t.start,t.end));
        if(!issues.length)boundaries.push(source.length);
        return {view,shield,issues:issues.sort((a,b)=>a.start-b.start||a.end-b.end),boundaries,tokens,tables,html,templates:stack,links,external};
    }
    function v24SyntaxContext(view,at) {
        const scan=v24SyntaxScan(view.slice(0,at));return {templates:scan.templates,html:scan.html,tables:scan.tables,links:scan.links,external:scan.external};
    }
    function v24SyntaxBodySafe(raw,allowFormatting=false) {
        if(!raw.trim()||/\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)|<\s*[/\\]?\s*(?:ref|references)\b/i.test(raw))return false;
        const s=v24SyntaxScan(raw);
        if(s.issues.some(i=>!(allowFormatting&&i.code==='syntax-unclosed-tag'&&V24_SYNTAX_FORMATTING.has(s.html.find(t=>t.start===i.start)?.name))))return false;
        return !s.templates.length&&!s.links.length&&!s.external.length&&!s.tables.length&&(!s.html.length||allowFormatting&&s.html.every(t=>V24_SYNTAX_FORMATTING.has(t.name)));
    }
    function v24SyntaxProof(ruleId,conditions,extra={}) { return {ruleId,conditions,...extra}; }
    function v24SyntaxTagEdits(source) {
        const scan=v24SyntaxScan(source),edits=[],html=[];
        for(const t of scan.tokens){if(V24_SYNTAX_VOID.has(t.name)||t.self)continue;if(!t.close){html.push(t);continue;}const top=html.at(-1);
            if(!top||top.name!==t.name||t.attrs.trim())continue;if(!t.typo){html.pop();continue;}
            if(!V24_SYNTAX_TYPO_TAGS.has(t.name)||t.templateDepth||t.tableDepth||t.linkDepth||/[{}]/.test(top.attrs)||t.name==='ref'&&html.filter(x=>x.name==='ref').length!==1||/\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)/i.test(source.slice(top.end,t.start)))continue;
            if(html.filter(x=>x.name===t.name).length===1&&v24SyntaxFutureClose(scan.view,t.end,t.name))continue;
            const slash=t.start+t.raw.indexOf('\\');edits.push({start:slash,end:slash+1,text:'/',ruleId:'syntaxTagTypos',proof:v24SyntaxProof('syntaxTagTypos',['finite closing-tag typo','matching innermost explicit opening','no attributes or dynamic container'],{tag:t.name,openingStart:top.start})});html.pop();}
        return edits;
    }
    function v24SyntaxTemplateProfile(body) {
        if(/[{}<>\uE000]/.test(body))return null;const parts=v24SyntaxParts(body);if(!parts)return null;
        const name=v24SyntaxName(parts[0].text),args=parts.slice(1).map(p=>p.text.trim());
        if(V24_SYNTAX_RENDERERS.has(name)){
            if(!args.every((arg,i)=>/^\d{1,2}$/.test(arg)&&i===0||/^(?:colunas|cols|columns)\s*=\s*\d{1,2}$/i.test(arg)||/^(?:grupo|group)\s*=\s*[^|=<>\[\]{}\r\n]+$/i.test(arg)||/^(?:nível|nivel)\s*=\s*0$/i.test(arg)||/^(?:largura|width)\s*=\s*\d{1,3}(?:em|px|%)$/i.test(arg)))return null;
            return {name,kind:'reference-renderer'};
        }
        if(V24_SYNTAX_CITATIONS.has(name)){
            if(!args.length)return null;const seen=new Set();for(const arg of args){const m=arg.match(/^([^=\n]+)=([\s\S]*)$/);if(!m||!m[2].trim())return null;const key=v24SyntaxName(m[1]);if(!/^[\p{L}\d _-]+$/u.test(key)||seen.has(key))return null;seen.add(key);}
            if(![...seen].some(k=>/^(?:url|título|titulo|title|doi|isbn|obra|work|jornal|periódico|periodico|livro|book-title)$/.test(k)))return null;
            return {name,kind:'citation'};
        }
        if(['portal','portal2'].includes(name)&&args.length>0&&args.length<=6&&args.every(a=>/^[\p{L}\p{N} _.-]+$/u.test(a)))return {name,kind:'literal-portals'};
        if(['small','pequeno','grande','nowrap','nobr','nobreak'].includes(name)&&args.length===1&&args[0]&&!/[=\[\]{}<>\r\n]/.test(args[0]))return {name,kind:'literal-formatting'};
        if(name==='dni'&&args.length===3&&args.every(a=>/^\d+$/.test(a))){const [d,m,y]=args.map(Number),date=new Date(0);date.setUTCFullYear(y,m-1,d);if(y>0&&m>=1&&m<=12&&d>=1&&d<=31&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d)return {name,kind:'literal-date'};}
        return null;
    }
    function v24SyntaxTemplateEdits(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,edits=[],re=/\{\{([^{}]*?)(\]\]|\})(?=[ \t]*(?:<\s*[/\\]\s*(?:ref|references)\s*>|\r?$))/gm;let m;
        while((m=re.exec(view))){const start=m.index,end=re.lastIndex,body=m[1],profile=v24SyntaxTemplateProfile(body);if(!profile)continue;
            if(shield.ranges.some(r=>r.start<end&&r.end>start))continue;
            const prefix=v24SyntaxApply(view.slice(0,start),edits),context=v24SyntaxContext(prefix,prefix.length);if(context.templates.length||context.tables.length||context.links.length||context.external.length||context.html.some(t=>!['ref','references'].includes(t.name)))continue;
            const lineStart=view.lastIndexOf('\n',start-1)+1,before=view.slice(lineStart,start),refPrefix=/^\s*(?:<\s*references\b[^>]*>\s*)?<\s*ref\b[^>]*>\s*$/i.test(before);
            const refBodyStart=profile.kind==='citation'&&context.html.at(-1)?.name==='ref'&&!prefix.slice(context.html.at(-1).end).trim()&&context.html.filter(t=>t.name==='ref').length===1;
            if(before.trim()&&!refPrefix&&!refBodyStart)continue;
            const suffix=view.slice(end).match(/^[ \t]*/)[0].length,follow=v24SyntaxTag(view,end+suffix),inline=!!follow&&follow.close&&['ref','references'].includes(follow.name);
            if(inline&&profile.kind!=='citation')continue;
            if(inline&&follow.name==='references'&&!(context.html.at(-1)?.name==='ref'&&context.html.at(-2)?.name==='references'))continue;
            if(body.includes('\n')&&body.trim().split(/\r?\n/).slice(1).some(line=>line.trim()&&!/^\s*\|/.test(line)))continue;
            const bad=m[2],at=end-bad.length;edits.push({start:bad==='}'?end:at,end:bad==='}'?end:end,text:bad==='}'?'}':'}}',ruleId:'syntaxTemplateClosers',proof:v24SyntaxProof('syntaxTemplateClosers',['finite template profile','isolated line or complete citation at explicit ref boundary','literal balanced fields','single minimum closing-token repair'],{template:profile.name,profile:profile.kind})});
        }
        return edits;
    }
    function v24SyntaxRendererContext(source,at,templates) {
        const ancestors=templates.nodes.filter(n=>n.size===2&&n.start<at&&at<n.end).sort((a,b)=>a.start-b.start);
        if(templates.unclosed.some(n=>n.start<at)||ancestors.length>1)return {valid:false,group:''};if(!ancestors.length)return {valid:true,group:''};
        const n=ancestors[0],parts=v24SyntaxParts(source.slice(n.start+2,n.end-2));if(!parts||!V24_SYNTAX_RENDERERS.has(v24SyntaxName(parts[0].text)))return {valid:false,group:''};
        let group='',groupSeen=false,found=false;for(const part of parts.slice(1)){const m=part.text.match(/^\s*([^=]+)=([\s\S]*)$/);if(!m)return {valid:false,group:''};const key=v24SyntaxName(m[1]);if(['group','grupo'].includes(key)){if(groupSeen||/[{}<>\[\]|&\r\n]/.test(m[2]))return {valid:false,group:''};groupSeen=true;group=m[2].trim();}const valueAt=n.start+2+part.start+part.text.indexOf('=')+1;if(key==='refs'&&valueAt<=at&&at<n.start+2+part.end)found=true;}
        return {valid:found,group};
    }
    function v24SyntaxReferences(source) {
        const shield=v24SyntaxProtected(source),view=shield.view,templates=v24SyntaxTemplates(view),refs=[],empties=[],containers=[],unclosed=[];let active=null;
        for(let i=0;i<view.length;){const t=v24SyntaxTag(view,i);if(!t){i++;continue;}i=t.end;
            if(t.name==='references'){
                if(!t.close&&!t.self){const attrs=v24SyntaxAttrs(t.attrs);containers.push({...t,attrs,valid:!!attrs&&Object.keys(attrs).every(k=>['group','responsive'].includes(k))&&Object.values(attrs).every(v=>!/[{}<>\[\]|&\r\n]/.test(v))});}
                else if(t.close&&!t.typo){const c=containers.at(-1);if(active&&c&&active.container===c){unclosed.push({...active,boundary:t,container:c});active=null;}if(c)containers.pop();}continue;}
            if(t.name!=='ref')continue;
            if(t.close){if(active&&!t.typo&&!t.attrs.trim()){refs.push({...active,end:t.end,close:t,body:source.slice(active.end,t.start)});active=null;}continue;}
            const attrs=v24SyntaxAttrs(t.attrs),renderer=v24SyntaxRendererContext(view,t.start,templates),container=containers.at(-1),group=attrs?.group??(container?.attrs?.group??renderer.group??'');
            if(active){if(!source.slice(active.end,t.start).trim())empties.push({...active,next:t});else unclosed.push({...active,boundary:null});active=null;}
            const item={...t,attrs,renderer,container,group,valid:v24SyntaxLiteralIdentity(attrs)&&renderer.valid};if(t.self)refs.push({...item,body:null,close:null});else active=item;
        }
        if(active)unclosed.push({...active,boundary:null,eof:true});return {shield,view,templates,refs,empties,unclosed};
    }
    function v24SyntaxReferenceEdits(source,cfg) {
        const parsed=v24SyntaxReferences(source),edits=[],defs=new Map(),ambiguous=new Set(),ambiguousNames=new Set(),key=r=>(r.group||'')+'\u0000'+(r.attrs?.name||'');
        let dynamicIdentity=false;for(const r of [...parsed.refs,...parsed.empties,...parsed.unclosed]){if(!r.attrs&&/\b(?:name|group)\s*=.*[{}]/i.test(r.attrs??r.raw))dynamicIdentity=true;if(r.attrs?.name&&(!r.renderer.valid||!v24SyntaxLiteralIdentity(r.attrs)))ambiguousNames.add(r.attrs.name);if(/[{}]/.test(r.attrs?.name||''))dynamicIdentity=true;}
        for(const r of parsed.refs){if(!r.attrs?.name||r.body===null||!r.body.trim())continue;const k=key(r);if(!r.valid||!v24SyntaxBodySafe(r.body))ambiguous.add(k);else{if(!defs.has(k))defs.set(k,[]);defs.get(k).push(r);}}
        for(const r of parsed.unclosed)if(r.attrs?.name)ambiguous.add(key(r));
        for(const r of parsed.empties){const k=key(r),matches=defs.get(k)||[];if(dynamicIdentity||!r.valid||!v24SyntaxLiteralIdentity(r.attrs,true)||ambiguous.has(k)||ambiguousNames.has(r.attrs.name)||matches.length!==1)continue;
            edits.push({start:r.end-1,end:r.end-1,text:'/',ruleId:'syntaxNamedRefReuse',proof:v24SyntaxProof('syntaxNamedRefReuse',['literal empty opening immediately before next ref','one nonconflicting closed definition in same effective group','no follow or dynamic identity','no content removed'],{name:r.attrs.name,group:r.group,definitionStart:matches[0].start,nextRefStart:r.next.start,inventory:{definitions:matches.length,namedRefs:parsed.refs.filter(x=>x.attrs?.name).length,anonymousRefs:parsed.refs.filter(x=>!x.attrs?.name).length,emptyOpenings:parsed.empties.length}})});}
        for(const r of parsed.unclosed){if(!r.valid||!v24SyntaxLiteralIdentity(r.attrs)||!r.renderer.valid)continue;
            if(r.boundary){if(!r.container.valid||r.group!==(r.container.attrs.group||'')||!v24SyntaxBodySafe(source.slice(r.end,r.boundary.start))||v24SyntaxFutureClose(parsed.view,r.boundary.end,'ref'))continue;
                edits.push({start:r.boundary.start,end:r.boundary.start,text:'</ref>',ruleId:'syntaxReferenceClosers',proof:v24SyntaxProof('syntaxReferenceClosers',['matching explicit references container','entire nonempty body balanced','no nested ref or dynamic identity','no content removed'],{openingStart:r.start,containerStart:r.container.start,boundary:'explicit-references-close'})});}
            else if(r.eof&&!cfg.sectionOnly&&!r.container){const raw=source.slice(r.end),trimmed=raw.trim();if(!v24SyntaxBodySafe(raw)||parsed.shield.unclosed.some(x=>x.start>=r.end))continue;
                const literalOneLine=!/[\r\n]/.test(trimmed)&&!/^\s*(?:[=*#:;]|\{\||\|)/.test(trimmed),parts=v24SyntaxTemplates(trimmed),oneCitation=parts.unclosed.length===0&&parts.nodes.length===1&&parts.nodes[0].start===0&&parts.nodes[0].end===trimmed.length&&V24_SYNTAX_CITATIONS.has(v24SyntaxName(trimmed.slice(2,-2).split('|',1)[0]));
                if(!literalOneLine&&!oneCitation)continue;
                edits.push({start:source.length,end:source.length,text:'</ref>',ruleId:'syntaxReferenceClosers',proof:v24SyntaxProof('syntaxReferenceClosers',['true whole-page EOF','single literal paragraph or one complete citation','entire body balanced','no content removed'],{openingStart:r.start,boundary:'true-eof'})});}}
        return edits;
    }
    function v24SyntaxFutureClose(view,after,name) {
        for(let i=after;i<view.length;){const t=v24SyntaxTag(view,i);if(!t){i++;continue;}i=t.end;if(t.name===name&&!t.self)return t.close;}return false;
    }
    function v24SyntaxFormattingEdits(source) {
        const parsed=v24SyntaxReferences(source),edits=[];
        for(const r of parsed.refs){if(!r.close||!r.valid||!v24SyntaxBodySafe(r.body,true))continue;
            const scan=v24SyntaxScan(r.body),open=scan.html;if(!open.length||!open.every(t=>V24_SYNTAX_FORMATTING.has(t.name)))continue;
            if(open.some(t=>v24SyntaxFutureClose(parsed.view,r.close.end,t.name)))continue;
            const text=open.slice().reverse().map(t=>'</'+t.name+'>').join('');edits.push({start:r.close.start,end:r.close.start,text,ruleId:'syntaxFormattingClosers',proof:v24SyntaxProof('syntaxFormattingClosers',['formatting opened wholly inside closed ref','only finite formatting tags remain open','proper reverse nesting','no corresponding later outside closer'],{refStart:r.start,tags:open.map(t=>t.name)})});}
        return edits;
    }
    function v24SyntaxTableCells(raw,delimiter) {
        if(/[{}<>]/.test(raw))return null;let view=raw,link=0,external=0;const chars=view.split('');for(let i=0;i<view.length;){if(view.slice(i,i+2)==='[['){link++;chars[i]=chars[i+1]=' ';i+=2;continue;}if(view.slice(i,i+2)===']]'){if(!link)return null;link--;chars[i]=chars[i+1]=' ';i+=2;continue;}if(view[i]==='['&&!link){external++;chars[i++]=' ';continue;}if(view[i]===']'&&!link){if(!external)return null;external--;chars[i++]=' ';continue;}if(link||external)chars[i]=' ';i++;}if(link||external)return null;
        view=chars.join('');const split=delimiter==='!'?'!!':'||',cells=view.split(split);let at=0;for(const cell of cells){if(/[|!]/.test(cell)||!raw.slice(at,at+cell.length).trim())return null;at+=cell.length+split.length;}return cells.length;
    }
    function v24SyntaxTableEdits(source,cfg) {
        if(cfg.sectionOnly)return [];const scan=v24SyntaxScan(source);if(scan.tables.length!==1||scan.issues.some(i=>i.code!=='syntax-unclosed-table'))return [];
        const start=scan.tables[0],context=v24SyntaxContext(source,start);if(context.templates.length||context.html.length||context.links.length||context.external.length||context.tables.length)return [];
        const raw=source.slice(start);if(scan.shield.ranges.some(r=>r.start<source.length&&r.end>start)||/\{\{|\}\}|\{\|/g.test(raw.slice(2)))return [];
        const lines=raw.split(/\r?\n/),head=lines.shift();if(!/^\{\|(?:\s+[\s\S]*)?$/.test(head))return [];
        const attrs=v24SyntaxAttrs(head.slice(2));if(!attrs||Object.keys(attrs).some(k=>!['class','style','border','cellpadding','cellspacing','width','align'].includes(k))||Object.values(attrs).some(v=>/[{}<>\[\]|]/.test(v)))return [];
        const rows=[];let cells=0,kind='',caption=false,seenCell=false,lastSeparator=false;
        for(const line of lines){if(!line.trim())continue;if(/^\|-\s*$/.test(line)){if(cells){rows.push(cells);cells=0;kind='';}else if(lastSeparator)return [];lastSeparator=true;continue;}
            if(/^\|\+/.test(line)){if(caption||seenCell||!line.slice(2).trim()||/[{}<>|]/.test(line.slice(2)))return [];caption=true;continue;}
            if(!/^[!|]/.test(line)||/^\|[}+]/.test(line))return [];const type=line[0];if(kind&&kind!==type)return [];kind=type;const n=v24SyntaxTableCells(line.slice(1),type);if(n===null)return [];cells+=n;seenCell=true;lastSeparator=false;}
        if(lastSeparator||!cells)return [];rows.push(cells);if(!rows.length||rows.some(n=>n!==rows[0]))return [];
        const newline=source.includes('\r\n')?'\r\n':'\n',text=/(?:\r?\n)$/.test(source)?'|}':newline+'|}';return [{start:source.length,end:source.length,text,ruleId:'syntaxTableClosers',proof:v24SyntaxProof('syntaxTableClosers',['true whole-page EOF','one literal top-level table','regular nonempty grid','no nested or dynamic content','no prose after rows'],{tableStart:start,rows:rows.length,columns:rows[0]})}];
    }
    function v24SyntaxApply(source,edits) {
        let out='',last=0;for(const e of edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end)){if(e.start<last||e.start<0||e.end<e.start||e.end>source.length)throw new Error('Invalid syntax repair spans');out+=source.slice(last,e.start)+e.text;last=e.end;}return out+source.slice(last);
    }
    function syntaxRepairPlan(source,cfg={}) {
        if(typeof source!=='string')throw new TypeError('O texto precisa ser uma string.');const sourceHash=v24SyntaxHash(source),base={source,sourceHash,proof:{source,sourceHash,version:'2.4'},edits:[],findings:[],text:source,unresolved:[],safePrefixEnd:0,repairedPrefixEnd:0};
        if(!v24SyntaxScope(cfg))return {...base,disabled:true};
        const cached=v24SyntaxPlanCache.get(source);if(cached){v24SyntaxPlanCache.delete(source);v24SyntaxPlanCache.set(source,cached);return cached.plan;}
        const initialScan=v24SyntaxScan(source);if(!initialScan.issues.length)return v24SyntaxRemember({...base,safePrefixEnd:source.length,repairedPrefixEnd:source.length});
        let current=source,origins=Array.from({length:source.length},(_,i)=>i),owners=Array(source.length).fill(null);
        const stage=edits=>{if(!edits.length)return;const ordered=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end),newOrigins=[],newOwners=[],pieces=[];
            const originalAt=at=>{while(at<origins.length&&origins[at]<0)at++;return origins[at]??source.length;};let last=0;
            for(const e of ordered){if(e.start<last)continue;const proof={...e.proof,span:{start:originalAt(e.start),end:originalAt(e.end)}};for(const k of ['openingStart','definitionStart','nextRefStart','containerStart','tableStart','refStart'])if(Number.isInteger(proof[k]))proof[k]=originalAt(proof[k]);const owner={...e,proof};
                pieces.push(current.slice(last,e.start),e.text);for(let i=last;i<e.start;i++){newOrigins.push(origins[i]);newOwners.push(owners[i]);}for(let i=0;i<e.text.length;i++){newOrigins.push(-1);newOwners.push(owner);}last=e.end;}
            pieces.push(current.slice(last));for(let i=last;i<current.length;i++){newOrigins.push(origins[i]);newOwners.push(owners[i]);}current=pieces.join('');origins=newOrigins;owners=newOwners;};
        stage(v24SyntaxTagEdits(current));stage(v24SyntaxTemplateEdits(current));stage(v24SyntaxTagEdits(current));stage(v24SyntaxReferenceEdits(current,cfg));stage(v24SyntaxFormattingEdits(current));stage(v24SyntaxReferenceEdits(current,cfg));stage(v24SyntaxTableEdits(current,cfg));
        const edits=[];let cursor=0,text='',proofs=[];
        const emit=end=>{if(text||end>cursor){const unique=[...new Set(proofs)],ruleIds=[...new Set(unique.map(e=>e.ruleId))];edits.push({start:cursor,end,text,ruleId:ruleIds[0],ruleIds,proof:{sourceHash,before:source.slice(cursor,end),rules:unique.map(e=>({...e.proof,sourceHash}))}});}text='';proofs=[];};
        for(let i=0;i<current.length;i++){if(origins[i]>=0){emit(origins[i]);cursor=origins[i]+1;}else{text+=current[i];if(owners[i])proofs.push(owners[i]);}}emit(source.length);
        let scan=v24SyntaxScan(current);
        // Closing one scope must never strand another token that was previously
        // paired. Positions of surviving tokens are mapped to the input.
        const originalIssues=new Set(initialScan.issues.map(i=>i.code+':'+i.start));
        if(scan.issues.some(issue=>{let at=issue.start;while(at<origins.length&&origins[at]<0)at++;return !originalIssues.has(issue.code+':'+(origins[at]??source.length));})){
            const first=initialScan.issues[0]?.start??source.length,cut=initialScan.boundaries.filter(n=>n<=first).at(-1)||0;
            return v24SyntaxRemember({...base,unresolved:initialScan.issues,safePrefixEnd:cut,repairedPrefixEnd:cut});
        }
        if(scan.issues.length){const first=scan.issues[0].start,cut=scan.boundaries.filter(n=>n<=first).at(-1)||0;let originalCut=source.length;for(let i=cut;i<origins.length;i++)if(origins[i]>=0){originalCut=origins[i];break;}
            const retained=edits.filter(e=>e.end<=originalCut&&e.start<originalCut);if(retained.length!==edits.length){current=v24SyntaxApply(source,retained);edits.splice(0,edits.length,...retained);scan=v24SyntaxScan(current);}}
        const first=scan.issues[0]?.start??current.length,repairedPrefixEnd=scan.boundaries.filter(n=>n<=first).at(-1)||0;let safePrefixEnd=repairedPrefixEnd;
        for(const e of edits){if(e.start<safePrefixEnd)safePrefixEnd-=e.text.length-(e.end-e.start);}
        if(!scan.issues.length){safePrefixEnd=source.length;}
        if(source.slice(safePrefixEnd)!==current.slice(repairedPrefixEnd)&&scan.issues.length){safePrefixEnd=0;}
        const findings=edits.map(e=>({code:e.ruleId,start:e.start,end:e.end,severity:'information',ruleIds:e.ruleIds,proof:e.proof}));
        return v24SyntaxRemember({source,sourceHash,proof:base.proof,edits,findings,text:current,unresolved:scan.issues,safePrefixEnd,repairedPrefixEnd});
    }
    function automaticSyntaxRepairs(source,cfg={},bump=()=>{},warn=()=>{}) {
        const plan=syntaxRepairPlan(source,cfg);for(const e of plan.edits)for(const id of e.ruleIds)bump(id);
        if(plan.edits.length&&plan.unresolved.length)warn('Os reparos de sintaxe ficaram limitados ao trecho completo anterior à cauda sem fechamento.');return plan.text;
    }
    function syntaxRepairPrefix(source,cfg={}) {
        const plan=syntaxRepairPlan(source,cfg);return {text:plan.text,prefix:plan.text.slice(0,plan.repairedPrefixEnd),end:plan.safePrefixEnd,repairedEnd:plan.repairedPrefixEnd,tail:source.slice(plan.safePrefixEnd),plan,unresolved:plan.unresolved};
    }
    function syntaxRepairEquivalence(before,after,plan,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||plan.proof?.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const regenerated=syntaxRepairPlan(before,cfg);return regenerated.text===after&&plan.text===after&&JSON.stringify(regenerated.edits)===JSON.stringify(plan.edits);
    }
    function syntaxRepairEquivalenceSource(source,cfg={}) { return syntaxRepairPlan(source,cfg).text; }

    // 2.4: source retention proof for objects recovered by syntax repair.
    // Inputs expected/actual have already received the same reference-name
    // normalization. This verifies data retention; it does not authorize edits.
    function v24InventoryCount(values) {
        const counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);return counts;
    }
    function v24InventoryContains(before,after) {
        for(const [key,count] of before)if((after.get(key)||0)<count)return false;return true;
    }
    function v24InventorySpace(value) { return String(value).replace(/[ \t\r\n]+/g,' ').trim(); }
    function v24InventoryTemplate(raw,cfg={}) {
        const noop=()=>{};let next=automaticCitationRepairs(raw,cfg,noop);
        next=automaticParameters(next,cfg,noop);
        const migrated=multilingualTemplate(next,cfg,noop,noop);if(migrated.handled&&!migrated.blocked)next=migrated.text;
        next=citation(next,cfg,noop,noop);next=extendedCitation(next,cfg,noop,noop);next=auxiliaryTemplate(next,cfg,noop,noop);
        if(cfg.birthDates)next=birthDate(next,noop);if(cfg.obsoleteTemplates)next=obsoleteTemplate(next,noop,noop);
        if(cfg.auxiliaryTemplates)next=auxiliaryParameters(next,noop,noop);return automaticParameters(next,cfg,noop);
    }
    function v24InventoryText(raw,cfg={}) {
        const noop=()=>{};let text=raw;
        if(cfg.links){text=wikiURLs(text,noop);text=cleanLinks(text,noop);text=canonicalPortugueseLinks(text,cfg,noop);}
        return v24InventorySpace(text);
    }
    function v24InventoryBody(raw,cfg={}) {
        const noop=()=>{};let body=raw;
        if(cfg.bareReferences){const refs=refTokens(simpleReferences('<ref>'+body+'</ref>',noop));if(refs.length===1&&refs[0].body!==null)body=refs[0].body;}
        body=mapTemplateTree(body,node=>v24InventoryTemplate(node,cfg));
        body=mapTemplateTree(body,node=>{const p=parsedTemplate(node);if(!CITE_NAMES[p.name])return node;
            const entries=foreignEntries(p).map(e=>[parameterFamily(e.key),v24InventorySpace(e.value)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
            return JSON.stringify([norm(CITE_NAMES[p.name]),entries]);});
        return v24InventoryText(body,cfg);
    }
    function v24InventoryRendererGroup(source,node) {
        const raw=source.slice(node.start,node.end);if(raw.startsWith('<'))return attrsOf(tagAt(raw,0)?.attrs)?.group||'';
        return foreignEntries(parsedTemplate(raw)).find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim()||'';
    }
    function v24InventoryReferences(source,cfg={}) {
        const view=protectedView(source),renderers=rendererRanges(view),keys=[];
        for(const ref of refTokens(view)){if(ref.body===null||!ref.body.trim())continue;const attrs=attrsOf(ref.attrs);if(!attrs)continue;
            const parent=renderers.find(r=>r.start<=ref.start&&ref.start<r.end),group=attrs.group||(parent?v24InventoryRendererGroup(source,parent):'');
            keys.push(JSON.stringify([group,attrs.name||'',v24InventoryBody(ref.body,cfg)]));}
        return v24InventoryCount(keys);
    }
    function v24InventoryPosition(pos,edits,right=false) {
        let shift=0;for(const edit of edits){if(pos<edit.start||pos===edit.start&&!right)break;if(pos<=edit.end)return edit.start+shift+(right?edit.text.length:0);shift+=edit.text.length-(edit.end-edit.start);}return pos+shift;
    }
    function v24InventoryTable(source,table,cfg={}) {
        const rows=[],captions=[];let cells=[];const finish=()=>{if(cells.length){rows.push(cells);cells=[];}};
        const raw=source.slice(table.start,table.end),lines=raw.split(/\r?\n/);lines.shift();
        for(const line of lines){if(/^\s*\|}/.test(line)){finish();break;}if(/^\s*\|-/.test(line)){finish();continue;}
            if(/^\s*\|\+/.test(line)){const part=line.replace(/^\s*\|\+/,''),view=tableCellView(part),at=view.indexOf('|');captions.push(v24InventoryText(at<0?part:part.slice(at+1),cfg));continue;}
            const first=line.match(/^[ \t]*([!|])/);if(!first){if(line.trim()&&cells.length)cells[cells.length-1][1]=v24InventorySpace(cells[cells.length-1][1]+' '+line);continue;}
            const view=tableCellView(line),delimiters=[{at:first[0].length,kind:first[1]}],re=first[1]==='!'?/!!|\|\|/g:/\|\|/g;re.lastIndex=first[0].length;let m;
            while((m=re.exec(view)))delimiters.push({at:m.index+2,kind:m[0]==='!!'?'!':'|'});
            for(let i=0;i<delimiters.length;i++){const d=delimiters[i],end=i+1<delimiters.length?delimiters[i+1].at-2:line.length,attrs=view.slice(d.at,end).indexOf('|'),content=line.slice(d.at+(attrs<0?0:attrs+1),end);cells.push([d.kind,v24InventoryText(content,cfg)]);}}
        finish();return JSON.stringify([captions,rows]);
    }
    function v24InventoryTemplates(source,cfg={}) {
        const view=protectedView(source),out=[];
        for(const node of templates(view).nodes){const raw=source.slice(node.start,node.end);let p=parsedTemplate(v24InventoryTemplate(raw,cfg));const name=p.name;
            if(['portal','portal2','portal3'].includes(name)){
                for(const part of p.parts.slice(1)){const named=part.match(/^\s*\d+\s*=([\s\S]*)$/),value=(named?named[1]:part).trim();if(value&&!/[={}<>\r\n]/.test(value))out.push({node,kind:'portal-slot',key:JSON.stringify(['portal-slot',portalIdentity(value)])});}continue;
            }
            if(V24_SYNTAX_RENDERERS.has(name)){
                const group=foreignEntries(p).find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim()||'';
                out.push({node,kind:'renderer',key:JSON.stringify(['renderer',group])});continue;
            }
            if(name==='dni'){
                const args=p.parts.slice(1).map(x=>x.trim());if(args.length>=3&&args.slice(0,3).every(x=>/^\d+$/.test(x)))out.push({node,kind:'literal-date',key:JSON.stringify(['dni',...args.slice(0,3).map(Number)])});continue;
            }
            if(['small','pequeno','grande','nowrap','nobr','nobreak'].includes(name)){
                const family=['small','pequeno'].includes(name)?'small':['nowrap','nobr','nobreak'].includes(name)?'nowrap':name;
                const args=p.parts.slice(1).map(x=>x.replace(/^\s*1\s*=/,'').trim());out.push({node,kind:'literal-formatting',key:JSON.stringify(['format',family,args.map(x=>v24InventoryText(x,cfg))])});continue;
            }
            if(V24_SYNTAX_CITATIONS.has(name)||CITE_NAMES[name]){
                const entries=foreignEntries(p).map(e=>[parameterFamily(e.key),v24InventoryText(e.value,cfg)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
                out.push({node,kind:'citation',key:JSON.stringify(['citation',norm(CITE_NAMES[name]||name),entries])});
            }
        }
        for(const renderer of rendererRanges(view).filter(r=>source[r.start]==='<'))out.push({node:renderer,kind:'renderer',key:JSON.stringify(['renderer',v24InventoryRendererGroup(source,renderer)])});
        return out;
    }
    function syntaxRepairInventoryProof(expected,actual,plan,cfg={}) {
        const result={applied:!!plan?.edits?.length,accepted:true,reason:'',definitions:0,tables:0,templates:0};if(!result.applied)return result;
        const reject=reason=>({...result,accepted:false,reason});
        // Reference normalization upstream preserves marker multiplicity. This
        // additional multiset retains repeated definitions inside renderer banks.
        const referenceExpected=v24InventoryReferences(expected,cfg),referenceActual=v24InventoryReferences(actual,cfg);result.definitions=[...referenceExpected.values()].reduce((a,b)=>a+b,0);
        if(!v24InventoryContains(referenceExpected,referenceActual))return reject('Uma definição de referência recuperada foi retirada, renomeada, teve o grupo ou conteúdo alterado, ou perdeu uma ocorrência.');
        const baseline=plan.text,baselineTables=tableAnalysis(baseline).tables,actualTables=tableAnalysis(actual).tables,expectedTables=tableAnalysis(expected).tables;
        const tableKeys=new Set();
        for(const edit of plan.edits)for(const rule of edit.proof.rules||[]){if(rule.ruleId!=='syntaxTableClosers')continue;const start=v24InventoryPosition(rule.tableStart,plan.edits),table=baselineTables.find(t=>t.start===start);
            if(!table)return reject('A tabela recuperada não tem um limite confirmado.');tableKeys.add(v24InventoryTable(baseline,table,cfg));result.tables++;}
        if(tableKeys.size){const before=v24InventoryCount(expectedTables.map(t=>v24InventoryTable(expected,t,cfg)).filter(k=>tableKeys.has(k))),after=v24InventoryCount(actualTables.map(t=>v24InventoryTable(actual,t,cfg)));
            if(!before.size||!v24InventoryContains(before,after))return reject('A tabela recuperada perdeu células, uma legenda, conteúdo ou a ordem das linhas.');}
        const targetNodes=[];for(const edit of plan.edits){if(!edit.ruleIds.includes('syntaxTemplateClosers'))continue;const at=v24InventoryPosition(edit.start,plan.edits),names=new Set((edit.proof.rules||[]).filter(r=>r.ruleId==='syntaxTemplateClosers').map(r=>r.template));
            // Adjacent template/ref closers can be one minimal diff span. The
            // template containing its first repaired delimiter is still unique.
            const candidates=templates(protectedView(baseline)).nodes.filter(n=>n.start<=at&&n.end>at&&names.has(parsedTemplate(baseline.slice(n.start,n.end)).name)).sort((a,b)=>(a.end-a.start)-(b.end-b.start));
            if(!candidates.length)return reject('A predefinição recuperada não tem um limite confirmado.');targetNodes.push(candidates[0]);}
        if(targetNodes.length){const allBase=v24InventoryTemplates(baseline,cfg),allExpected=v24InventoryTemplates(expected,cfg),allActual=v24InventoryTemplates(actual,cfg),wanted=new Set();
            for(const node of targetNodes){const values=allBase.filter(x=>x.node.start===node.start&&x.node.end===node.end);if(!values.length)return reject('Não foi possível conferir os dados da predefinição recuperada.');for(const value of values)wanted.add(value.key);result.templates++;}
            const before=new Map(),after=v24InventoryCount(allActual.map(x=>x.key));
            for(const key of wanted){const matches=allExpected.filter(x=>x.key===key),kind=matches[0]?.kind;if(!matches.length)return reject('A predefinição recuperada não corresponde ao texto conferido.');before.set(key,['renderer','portal-slot'].includes(kind)?1:matches.length);}
            if(!v24InventoryContains(before,after))return reject('Uma predefinição recuperada perdeu os dados, a chamada ou uma ocorrência.');}
        return result;
    }

    // O plano vem sempre do texto recebido, nunca de uma prova fornecida pelo editor.
    function syntaxRepairSourceProof(before,after,options={}) {
        const result={applied:false,accepted:true,ok:true,reason:'',repairs:0};
        if(before===after)return result;
        const cfg=pageContextOptions({...DEFAULTS,...options}),plan=syntaxRepairPlan(before,cfg);
        if(!plan.edits.length)return result;
        result.applied=true;result.repairs=plan.edits.length;result.baseline=plan.text;
        const reject=reason=>({...result,accepted:false,ok:false,reason});
        const next=syntaxRepairPlan(after,cfg);
        if(next.edits.length)return reject('A seleção deixou um reparo de sintaxe incompleto.');
        const approved=syntaxRepairPlan(plan.text,cfg);
        const issueCounts=issues=>issues.reduce((m,i)=>(m[i.code]=(m[i.code]||0)+1,m),Object.create(null));
        const oldIssues=issueCounts(approved.unresolved),newIssues=issueCounts(next.unresolved);
        if(Object.entries(newIssues).some(([code,n])=>n>(oldIssues[code]||0)))
            return reject('A seleção introduziu código sem fechamento ou outra estrutura incompleta.');
        if(approved.unresolved.length&&!after.endsWith(plan.text.slice(approved.safePrefixEnd)))
            return reject('O trecho incompleto preservado foi alterado.');
        const normalize=source=>{
            const c={...DEFAULTS,namespaceNumber:0},noop=()=>{};
            let s=normalizeNumericReferenceNames(source,c,noop,noop);
            s=neutralAutomaticReferenceNames(s,c,noop);
            s=normalizeRefs(s,c,noop,noop);
            return automaticIdenticalReferences(s,c,noop);
        };
        const expected=normalize(plan.text),actual=normalize(after);
        const inventory=syntaxRepairInventoryProof(expected,actual,plan,cfg);
        if(!inventory.accepted)return reject(inventory.reason);
        const markers=source=>{
            const view=protectedView(source),renderers=rendererRanges(view),counts=new Map();
            for(const ref of refTokens(view)){
                if(inRange(ref.start,renderers))continue;
                const a=attrsOf(ref.attrs);if(!a)continue;
                const key=JSON.stringify([a.group||'',a.name||'']);
                counts.set(key,(counts.get(key)||0)+1);
            }
            return counts;
        };
        const newMarkers=markers(actual);
        if([...markers(expected)].some(([key,n])=>(newMarkers.get(key)||0)<n))
            return reject('Uma chamada de referência recuperada pelo reparo foi retirada ou renomeada.');
        return result;
    }
    function syntaxRepairTransactions(before,after,hunks) {
        if(before===after||!syntaxRepairPlan(before,{...DEFAULTS,namespaceNumber:0}).edits.length)return hunks;
        // As regras seguintes dependeram da estrutura reparada. A seleção é atômica.
        return hunks.map(h=>({...h,transaction:'syntax-repair-transaction',dependent:hunks.length>1}));
    }
    function syntaxPrefixOptions(cfg) {
        return {...cfg,syntaxRepairs:false,partialSyntaxRecovery:false,structuralRepairs:false,
            translationResidues:false,review:false,sectionOnly:true,autoMinor:false,
            references:false,numericRefNames:false,neutralReferenceNames:false,moveNamedRefs:false,
            automaticIdenticalReferences:false,referenceColumns:false,unifiedNotesReferences:false,
            endMatter:false,endMatterColumns:false,endTemplateOrder:false,endSectionOrder:false,
            externalLinkColumns:false,authorityControl:false,portals:false,biographyPortal:false,
            automaticBiographyPortals:false,livingBirthAge:false,birthDates:false,occupationCase:false,
            biographyStyleChecks:false,tableChecks:false,automaticTableRepairs:false,headings:false,
            shortDescriptions:false,obsoleteTemplates:false,maintenance:false,categories:false};
    }
    function syntaxPreviewDecision(original,baseline,after,Parser,beforeSource,afterSource,options={}) {
        const proof=syntaxRepairSourceProof(beforeSource,afterSource,options);
        if(!proof.applied)return previewDecision(original,after,Parser,beforeSource,afterSource);
        const reject=reason=>({checked:true,accepted:false,introduced:[reason],resolved:[],syntaxBaselineChecked:false});
        if(!proof.accepted)return reject(proof.reason);
        if(!baseline||baseline.source!==proof.baseline||typeof baseline.text!=='string')
            return reject('A pré-visualização intermediária não corresponde ao reparo de sintaxe confirmado.');
        const decision=previewDecision(baseline,after,Parser,proof.baseline,afterSource);
        const old=renderedAudit(original.text,original.parsewarnings,Parser),now=renderedAudit(after.text,after.parsewarnings,Parser);
        const introduced=decision.introduced.slice();
        for(const finding of now.findings)if(!old.findings.includes(finding)&&!introduced.includes(finding))introduced.push(finding);
        const errors=parsed=>{
            const doc=new Parser().parseFromString(parsed.text,'text/html'),counts=new Map();
            doc.querySelectorAll('.mw-ext-cite-error,.cite-error,.error,.cs1-visible-error,.cs1-hidden-error,.scribunto-error').forEach(e=>{
                const key=e.textContent.replace(/\s+/g,' ').trim();if(key)counts.set(key,(counts.get(key)||0)+1);
            });return counts;
        };
        const previous=errors(original),current=errors(after);
        for(const [key,n]of current)if(n>(previous.get(key)||0)&&!introduced.includes(key))introduced.push(key);
        return {...decision,accepted:introduced.length===0,introduced,
            resolved:old.findings.filter(f=>!now.findings.includes(f)),syntaxBaselineChecked:true,
            syntaxProof:{applied:true,accepted:true,repairs:proof.repairs}};
    }

    function normalizeLists(s, bump, warn) {
        const edits = [], ranges = structuralRanges(s);
        for (const n of topNodes(s)) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
            if (inRangeExcept(n.start,ranges,n.start,n.end)) continue;
            if (['referências', 'referencias', 'reflist', 'references'].includes(p.name) && p.parts.length === 1) {
                if (raw !== '{{Referências}}') { edits.push({start: n.start, end: n.end, text: '{{Referências}}'}); bump('referenceLists'); }
            } else if (p.name === 'reflist' && p.parts.length > 1) {
                const migrated = migrateReflist(p, s.slice(0, n.start), warn);
                if (migrated) { edits.push({start: n.start, end: n.end, text: migrated}); bump('referenceLists'); }
                else warn('Lista de referências com parâmetros preservada: confira a conversão de ' + p.parts[0].trim() + ' manualmente.');
            } else if (p.name === 'references' && p.parts.length > 1)
                warn('Lista de referências com parâmetros preservada: confira a conversão de ' + p.parts[0].trim() + ' manualmente.');
        }
        const rr = rendererRanges(s);
        for (const r of rr) {
            const raw = s.slice(r.start, r.end);
            if (/^<\s*references\s*(?:\/\s*>|>\s*<\s*\/\s*references\s*>)$/i.test(raw) &&
                !inRange(r.start, templates(s).nodes) && !inRange(r.start, refTokens(s))) {
                edits.push({start: r.start, end: r.end, text: '{{Referências}}'}); bump('referenceLists');
            }
        }
        s = applyEdits(s, edits);
        // Remover só o título que a própria predefinição vai emitir no mesmo nível.
        const headingEdits = [], context = structuralRanges(s);
        for (const n of topNodes(s)) {
            const p = parsedTemplate(s.slice(n.start, n.end));
            if (!['referências', 'referencias'].includes(p.name)) continue;
            const attrs = {}, positional = [];
            for (const part of p.parts.slice(1)) {
                const m = part.match(/^\s*([^=]+?)\s*=([\s\S]*)$/);
                if (m) attrs[norm(m[1])] = m[2].trim();
                else positional.push(part.trim());
            }
            const title = attrs['título'] !== undefined ? attrs['título'] : attrs['1'] !== undefined ? attrs['1'] : positional[0];
            const level = attrs['nível'] !== undefined ? attrs['nível'] : attrs['2'] !== undefined ? attrs['2'] : positional[1];
            const suppression = attrs['nível'] !== undefined ? attrs['nível'] : attrs['3'] !== undefined ? attrs['3'] : positional[2];
            if (suppression === '0' || level && level !== '2' || title !== undefined && norm(title) !== 'referências') continue;
            const before = s.slice(0, n.start);
            const h = before.match(/(?:^|\n)((?:==[ \t]*Referências[ \t]*==[ \t]*\n[ \t\n]*)+)$/);
            if (!h) continue;
            const start = before.length - h[1].length;
            if (!inRange(start, context)) { headingEdits.push({start, end: n.start, text: ''}); bump('referenceLists'); }
        }
        s = applyEdits(s, headingEdits);
        // Só listas vazias consecutivas. Texto ou uma referência entre elas impede a fusão.
        const plain = /\{\{Referências}}(?:[ \t]*\n[ \t]*)+\{\{Referências}}/g;
        let changed;
        do {
            changed = false;
            const blocked = structuralRanges(s).filter(n => s.slice(n.start, n.end) !== '{{Referências}}');
            s = s.replace(plain, (all, offset) => {
                if (inRange(offset, blocked)) return all;
                changed = true; bump('referenceLists'); return '{{Referências}}';
            });
        } while (changed);
        s = s.replace(/^==[ \t]*Referências[ \t]*==[ \t]*\n[ \t\n]*(?=== Referências ==)/gm, (all, offset) => {
            if (inRange(offset, structuralRanges(s))) return all;
            bump('referenceLists'); return '';
        });
        return s;
    }
    function migrateReflist(p, before, warn) {
        const fields = new Map(), values = [], keyMap = ownDictionary({group: 'grupo', grupo: 'grupo', refs: 'refs',
            liststyle: 'estilolista', estilolista: 'estilolista', listaestilo: 'estilolista'});
        let positional = 0;
        for (const part of p.parts.slice(1)) {
            const m = part.match(/^\s*([^=\n]+?)\s*=([\s\S]*)$/);
            if (!m) {
                positional++;
                if (positional > 1 || !/^(?:\d+(?:\.\d+)?(?:em|px|%)?|\s*)$/i.test(part.trim())) return null;
                continue;
            }
            const key = norm(m[1]), value = m[2];
            if (['colwidth', 'largcol', 'larguracol'].includes(key)) {
                if (!/^(?:\d+(?:\.\d+)?(?:em|px|%)?|\s*)$/i.test(value.trim())) return null;
                continue;
            }
            if (!keyMap[key]) return null;
            const target = keyMap[key];
            if (fields.has(target)) {
                if (fields.get(target).trim() !== value.trim()) { warn('Reflist tem valores diferentes para ' + target + '. A lista foi preservada.'); return null; }
            } else { fields.set(target, value); values.push(target + '=' + value); }
        }
        // Manter um título customizado existente. O título padrão pode vir da nova caixa.
        if (!/(?:^|\n)==[ \t]*Referências[ \t]*==[ \t]*\n[ \t\n]*$/.test(before)) values.push('nível=0');
        return '{{Referências' + (values.length ? '|' + values.join('|') : '') + '}}';
    }
    function normalizeRefs(s, cfg, bump, warn) {
        const renderers = rendererRanges(s), nested = templates(s).nodes;
        const refs = refTokens(s), families = new Map(), edits = [];
        for (const r of refs) {
            const a = attrsOf(r.attrs);
            if (!a) { warn('Atributos de referência ambíguos preservados.'); continue; }
            const simple = Object.keys(a).every(k => ['name', 'group'].includes(k));
            if (!simple) { warn('Referência com atributos especiais preservada, como details ou follow.'); continue; }
            if (!a.name || /[\uE000\uE001{}&<>"\r\n]/.test(a.name + (a.group || '')) ||
                inRange(r.start, renderers) || inRange(r.start, nested)) continue;
            const key = JSON.stringify([a.group || '', a.name]);
            if (!families.has(key)) families.set(key, []);
            families.get(key).push(Object.assign({}, r, {a}));
        }
        for (const family of families.values()) {
            const definitions = family.filter(r => r.body !== null && r.body.trim());
            const bodies = new Set(definitions.map(r => r.body));
            if (bodies.size > 1) { warn('Referência "' + family[0].a.name + '" tem definições diferentes. Nenhuma foi descartada.'); continue; }
            const canonical = r => '<ref name="' + r.a.name + '"' + (r.a.group ? ' group="' + r.a.group + '"' : '') + ' />';
            const hasComplex = refs.some(r => {
                const a = attrsOf(r.attrs);
                return a && (a.name === family[0].a.name || a.follow === family[0].a.name) &&
                    (a.group || '') === (family[0].a.group || '') && Object.keys(a).some(k => !['name', 'group'].includes(k));
            });
            if (hasComplex) continue;
            const hasNestedDefinition = refs.some(r => {
                const a = attrsOf(r.attrs);
                return a && a.name === family[0].a.name && (a.group || '') === (family[0].a.group || '') && r.body !== null && r.body.trim();
            });
            if (!definitions.length && !hasNestedDefinition) { warn('Referência "' + family[0].a.name + '" sem definição no texto comum. Ela pode estar em uma lista ou predefinição.'); }

            const first = family[0], definition = definitions[0];
            const crossesList = (a, b) => renderers.some(r => r.start > a.start && r.start < b.start);
            const move = cfg.moveNamedRefs && definition && first.start < definition.start && !crossesList(first, definition);
            for (const r of family) {
                let next = r.raw;
                if (move && r === first) {
                    next = canonical(r).replace(/ \/>$/, '>') + definition.body + '</ref>'; bump('namedRefs');
                } else if (r.body !== null && r.body.trim() && definition && (move || r !== definition) &&
                    !crossesList(move ? first : definition, r)) {
                    next = canonical(r); bump('namedRefs');
                } else if (r.body === null || !r.body.trim()) {
                    next = canonical(r); if (next !== r.raw) bump('refAttributes');
                } else {
                    const opening = canonical(r).replace(/ \/>$/, '>');
                    next = opening + r.body + '</ref>'; if (next !== r.raw) bump('refAttributes');
                }
                if (next !== r.raw) edits.push({start: r.start, end: r.end, text: next});
            }
        }
        return applyEdits(s, edits);
    }
    function proseRanges(s) {
        const ranges = structuralRanges(s).slice();
        const re = /\[\[(?:[^\[\]]|\[\[[^\[\]]*\]\])*\]\]|\[(?:https?:|\/\/)[^\]\n]+\]|<[^>]+>/g;
        let m; while ((m = re.exec(s))) ranges.push({start: m.index, end: re.lastIndex});
        return ranges;
    }
    function markupPass(s, bump) {
        const edits = [];
        const italics = /<(i|em)>((?:(?!<|\uE000|\n)[\s\S])+?)<\/\1>/gi;
        let m;
        while ((m = italics.exec(s))) {
            if (!inRange(m.index, structuralRanges(s)) && !m[2].includes("''"))
                edits.push({start: m.index, end: italics.lastIndex, text: "''" + m[2] + "''"});
        }
        const small = /<small>([^<>\uE000]+)<\/small>/gi;
        while ((m = small.exec(s))) if (!inRange(m.index, structuralRanges(s)) && !/[\n{}]/.test(m[1]))
            edits.push({start: m.index, end: small.lastIndex, text: '{{Pequeno|' + parsedTemplate('{{Guard|1='+m[1]+'}}').parts.slice(1).join('&#124;') + '}}'});
        // Aplicar as conversões de HTML antes de localizar identificadores aninhados.
        s = applyEdits(s, edits); if (edits.length) bump('markup');
        const ranges = proseRanges(s), isbnEdits = [];
        const isbn = /\bISBN(?:-1[03])?\s*:?\s+([\dXx][\dXx -]{8,24}[\dXx])\b/g;
        while ((m = isbn.exec(s))) {
            const value = m[1].trim();
            if (!inRange(m.index, ranges) && validISBN(value)) isbnEdits.push({start: m.index, end: isbn.lastIndex, text: '{{ISBN|' + value + '}}'});
        }
        s = applyEdits(s, isbnEdits); if (isbnEdits.length) bump('markup');
        s = s.replace(/<br\s+clear\s*=\s*["']?(all|both|left|right|none)["']?\s*\/?>/gi, (all, value) => {
            bump('markup'); return '<br style="clear: ' + (value.toLowerCase() === 'all' ? 'both' : value.toLowerCase()) + ';" />';
        }).replace(/<\s*[\/\\]\s*br\s*>/gi, () => { bump('markup'); return '<br />'; });
        s = s.replace(/\[\[([^|\[\]\n]+)\|('{2,3})([^'\[\]\n]+)\2\]\]/g, (all, target, quotes, label) => {
            if (/[:#{}<>]/.test(target)) return all;
            bump('links'); return quotes + '[[' + target + '|' + label + ']]' + quotes;
        });
        const lines = s.split('\n');
        for (let i = 1; i < lines.length; i++) if (/^\*[^*]/.test(lines[i - 1]) && /^:\*/.test(lines[i])) {
            lines[i] = lines[i].replace(/^:\*/, '**'); bump('markup');
        }
        s = lines.join('\n');
        // Limpeza apenas de linhas de prosa. Preservar alinhamento de tabelas e parâmetros.
        const blocks = structuralRanges(s);
        s = s.replace(/\S([ \t]+)$/gm, (all, space, offset) => {
            if (inRange(offset, blocks)) return all; bump('markup'); return all.slice(0, -space.length);
        });
        return s;
    }
    function categoryPass(s, bump, warn) {
        const ranges = structuralRanges(s), seen = new Map();
        s = s.replace(/\[\[\s*(Category|Categoria)\s*:\s*([^\[\]\n]+)\]\]/gi, (all, ns, body, offset) => {
            if (inRange(offset, ranges) || /[{}\uE000]/.test(body)) return all;
            const parts = body.split('|'), title = parts[0].trim().replace(/_/g, ' ');
            if (!title) return all;
            const sort = parts.length > 1 ? parts.slice(1).join('|') : null, key = title[0].toLocaleUpperCase('pt') + title.slice(1);
            const next = '[[Categoria:' + key + (sort !== null ? '|' + sort : '') + ']]';
            if (seen.has(key)) {
                if (seen.get(key) === sort) { bump('categories'); return ''; }
                warn('Categoria repetida com chaves de ordenação diferentes: ' + key + '.');
            } else seen.set(key, sort);
            if (next !== all) bump('categories'); return next;
        });
        s = s.replace(/\[\[\s*(File|Image|Ficheiro|Arquivo|Imagem)\s*:\s*([^\[\]\n]+)\]\]/gi, (all, ns, body) => {
            const fields = splitParts(body);
            const opts = ownDictionary({thumb: 'miniatura', thumbnail: 'miniatura', right: 'direita', left: 'esquerda',
                center: 'centro', centre: 'centro', none: 'nenhum', border: 'borda',
                frame: 'commoldura', framed: 'commoldura', frameless: 'semmoldura'});
            for (let i = 1; i < fields.length; i++) if (opts[fields[i].trim().toLowerCase()]) fields[i] = opts[fields[i].trim().toLowerCase()];
            const next = '[[Imagem:' + fields.join('|') + ']]';
            if (next !== all) bump('categories'); return next;
        });
        // Um título antigo com Anexo pode ser um redirecionamento válido.
        // Remover o prefixo sem confirmar o destino pode criar uma ligação vermelha.
        return s;
    }
    function refPunctuation(s, bump, warn) {
        // Uma predefinição que emite a própria ref não pode ficar dentro de outra ref.
        const edits = [];
        for (const r of refTokens(s)) {
            const attrs = attrsOf(r.attrs);
            if (r.body === null || !attrs || Object.keys(attrs).length) continue;
            const nodes = topNodes(r.body.trim());
            if (nodes.length !== 1 || nodes[0].start !== 0 || nodes[0].end !== r.body.trim().length) continue;
            const p = parsedTemplate(r.body.trim());
            if (['sfn', 'sfnm', 'harvnp', 'harvref', 'nre', 'refn'].includes(p.name)) {
                edits.push({start: r.start, end: r.end, text: r.body.trim()}); bump('referenceLists');
            }
        }
        s = applyEdits(s, edits);
        const refs = refTokens(s), context = templates(s).nodes.concat(structuralRanges(s).filter(r => s.slice(r.start,r.start+2) === "{|")), moves = [], renderers = rendererRanges(s);
        for (let i = 0; i < refs.length; i++) {
            const first = refs[i];
            if (inRange(first.start, context) || inRange(first.start, renderers)) continue;
            let end = first.end;
            while (i + 1 < refs.length && /^\s*$/.test(s.slice(end, refs[i + 1].start)) && !/[\r\n]/.test(s.slice(end, refs[i + 1].start))) end = refs[++i].end;
            const tail = s.slice(end).match(/^[ \t]*([.,;:!?])/);
            if(tail&&/[.,:]/.test(tail[1])&&/[\p{N}]$/u.test(s.slice(0,first.start))&&/^[\p{N}]/u.test(s.slice(end+tail[0].length)))continue;
            if (tail && /[\p{L}\p{N}\])'"”»]$/u.test(s.slice(0, first.start))) {
                moves.push({start: first.start, end: end + tail[0].length, text: tail[1] + s.slice(first.start, end) + (/^[\p{L}\p{N}]/u.test(s.slice(end+tail[0].length))?' ':'')}); bump('referencePunctuation');
            } else if (/^[\p{L}\p{N}]/u.test(s.slice(end)) && !(/[\p{N}][.,:]$/u.test(s.slice(0,first.start)) && /^[\p{N}]/u.test(s.slice(end)))) {
                moves.push({start: end, end, text: ' '}); bump('referencePunctuation');
            }
        }
        return applyEdits(s, moves);
    }
    function endMatterPass(s, bump, warn, cfg = {}) {
        const context = structuralRanges(s), edits = [];
        for (const n of topNodes(s)) {
            const p = parsedTemplate(s.slice(n.start, n.end));
            const title = ownDictionary({'ligações externas': 'Ligações externas', 'ver também': 'Ver também',
                'veja também': 'Ver também', bibliografia: 'Bibliografia'})[p.name];
            if (!title || p.parts.length !== 1 || inRangeExcept(n.start,context,n.start,n.end)) continue;
            const start = s.lastIndexOf('\n', n.start - 1) + 1, end = s.indexOf('\n', n.end);
            if (s.slice(start, n.start).trim() || s.slice(n.end, end < 0 ? s.length : end).trim()) continue;
            edits.push({start: n.start, end: n.end, text: '== ' + title + ' =='}); bump('endMatter');
        }
        s = applyEdits(s, edits);
        const blocked = structuralRanges(s), heads = [], re = /^(={1,6})[ \t]*([^\n]*?)[ \t]*\1[ \t]*$/gm;
        let m; while ((m = re.exec(s))) if (!inRange(m.index, blocked)) heads.push({start: m.index, end: re.lastIndex, level: m[1].length, title: m[2]});
        // Corrigir um título de nível 1 junto com os subtítulos pertencentes a ele.
        const shifted = []; let shift = false;
        heads.forEach(h => {
            if (h.level === 1) shift = true;
            if (!shift) return;
            if (h.level === 6) { warn('Seção de nível 6 preservada, confira a hierarquia dos títulos.'); return; }
            const marks = '='.repeat(h.level + 1);
            shifted.push({start: h.start, end: h.end, text: marks + ' ' + h.title + ' ' + marks}); bump('headings');
        });
        s = applyEdits(s, shifted);
        // Adicionar um renderizador só quando nenhuma chamada do grupo principal existe.
        const renders = rendererRanges(s);
        const ordinaryRefs = refTokens(s).some(r => {
            const a = attrsOf(r.attrs); return a && !a.group && !inRange(r.start, renders);
        }) || templates(s).nodes.some(n => ['sfn', 'sfnm', 'harvnp', 'harvref'].includes(parsedTemplate(s.slice(n.start, n.end)).name));
        const ordinaryList = renders.some(r => {
            const raw = s.slice(r.start, r.end);
            return !/(?:\|\s*(?:group|grupo)\s*=\s*[^|}\s]+|<references\b[^>]*\bgroup\s*=)/i.test(raw) &&
                !/^\{\{\s*(?:notas|notelist)(?=\s*[|}])/i.test(raw);
        });
        if (ordinaryRefs && !ordinaryList && !/<\s*references\b[^>]*>(?![\s\S]*<\s*\/references\s*>)/i.test(s)) {
            let at = s.length;
            const footer = /^(?:==[ \t]*(?:Ligações externas|Bibliografia|Leitura complementar)[ \t]*==|\{\{(?:Commons(?:cat)?|Controle de autoridade|Portal3)\b|\[\[Categoria:)/gmi;
            const f = footer.exec(s); if (f) at = f.index;
            s = s.slice(0, at).replace(/\n*$/, '\n\n') + '{{Referências}}\n\n' + s.slice(at); bump('endMatter');
        }
        // Para uma única seção Ver também, mover só um bloco composto de lista simples.
        const see = /^== Ver também ==\n((?:[ \t]*\n|\*[^\n]*(?:\n|$))+)/gm, a = see.exec(s);
        const ref = /^(?:== Referências ==|\{\{(?:Referências|Notas e referências)(?:\||}}))/gm.exec(s);
        if (!cfg.endSectionOrder && a && !see.exec(s) && ref && a.index > ref.index && !inRange(a.index, structuralRanges(s)) && !/[{}]/.test(a[1])) {
            const block = a[0].trimEnd() + '\n\n';
            s = s.slice(0, a.index) + s.slice(a.index + a[0].length);
            s = s.slice(0, ref.index) + block + s.slice(ref.index); bump('endMatter');
        }
        return s;
    }
    // RevisaWiki 2.0: reparos limitados por campos reconhecidos e provas locais.
    // Este bloco usa os analisadores já existentes. Não escolhe fontes nem datas.
    const V20_PARAMETER_TYPOS = Object.freeze(ownDictionary({
        "acessodtaa":"acessodata", "acessdoata":"acessodata", "acessodat":"acessodata", "acessoddata":"acessodata", "acesosdata":"acessodata", "acessodaata":"acessodata", "acesodataa":"acessodata", "arquivodtaa":"arquivodata", "arquivodaata":"arquivodata", "arquivoddata":"arquivodata", "arquivodat":"arquivodata", "arquivourll":"arquivourl", "arquivouurl":"arquivourl", "arqivourl":"arquivourl", "tituol":"titulo", "titullo":"titulo", "tittullo":"titulo", "primeirro":"primeiro", "primeior":"primeiro", "ultmio":"ultimo", "ultimoo":"ultimo", "editroa":"editora", "publciado":"publicado", "publicaod":"publicado", "pagnias":"paginas", "pagians":"paginas", "paginass":"paginas", "edtiora":"editora", "editoar":"editora",
        acesodata:'acessodata', accesodata:'acessodata', acessdata:'acessodata',
        acessoodata:'acessodata', acessodta:'acessodata', acesoddata:'acessodata',
        arquivodta:'arquivodata', arquivoodata:'arquivodata', arquivorl:'arquivourl',
        titutlo:'titulo', tittulo:'titulo', titlo:'titulo', 'títutlo':'titulo', 'títlo':'titulo',
        primiero:'primeiro', primeirio:'primeiro', ultimmo:'ultimo', editoraa:'editora',
        publicadoo:'publicado', 'lingúa':'língua', 'linguá':'língua', departameto:'departamento'
    }));
    const V20_NEWSPAPER_IDENTITIES = Object.freeze([
        {names:['folha de s.paulo','folha de s. paulo','folha de são paulo'],hosts:['folha.uol.com.br']},
        {names:['o estado de s. paulo','o estado de s.paulo','estadão','estadao'],hosts:['estadao.com.br']},
        {names:['o globo'],hosts:['oglobo.globo.com']},
        {names:['público','publico'],hosts:['publico.pt']},
        {names:['expresso'],hosts:['expresso.pt']},
        {names:['jornal de notícias','jornal de noticias'],hosts:['jn.pt']},
        {names:['diário de notícias','diario de noticias'],hosts:['dn.pt']},
        {names:['the new york times','new york times'],hosts:['nytimes.com']},
        {names:['the guardian'],hosts:['theguardian.com']},
        {names:['the washington post','washington post'],hosts:['washingtonpost.com']}
    ]);
    const V20_NEWSPAPER_SECTIONS = new Set(['editorial','editoriais','opinião','opiniao','cartas',
        'cartas ao editor','carta ao editor','economia','política','politica','cultura','esportes',
        'desporto','desportos','ciência','ciencia','sociedade','internacional','mundo','revista',
        'caderno 2','ilustrada','ilustríssima','ilustrissima','poder','cotidiano','ípsilon','ipsilon']);
    function v20DefinitionContext(cfg={}) {
        return cfg.namespaceNumber===10&&!/\/(?:doc|documentação)(?:\/|$)/i.test(cfg.pageTitle||'');
    }
    function v20AutomationAllowed(source,cfg={}) {
        return !v20DefinitionContext(cfg)&&!discussionProtectionRanges(source,cfg).length;
    }
    function v20Plain(value) {
        return typeof value==='string'&&value.trim()&&!/[{}<>\[\]\uE000\r\n]/.test(value);
    }
    function v20PlainLabel(value) {
        const s=String(value||'').trim();
        const linked=s.match(/^\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]$/);
        return linked?(linked[2]||linked[1]).trim():s;
    }
    function v20CitationFields(p) {
        const map=new Map();
        for(const e of templateEntries(p)) {
            const family=parameterFamily(e.key);
            if(map.has(family)&&map.get(family)!==e.value.trim())return null;
            map.set(family,e.value.trim());
        }
        return map;
    }
    function v20CitationTitle(map) {
        return map&&(map.get('título')||map.get('titulo')||map.get('title')||'');
    }
    function v20PublicationYear(map) {
        if(!map)return '';
        const explicit=map.get('ano')||map.get('year');
        if(explicit)return /^\d{4}[a-z]?$/i.test(explicit)?explicit:'';
        const date=map.get('data')||map.get('date')||'';
        const years=date.match(/\b\d{4}[a-z]?\b/gi);
        return years?.length===1?years[0]:'';
    }
    function v20CitationSurnames(map) {
        const surnames=[];
        if(!map||[...map].some(([key,value])=>value&&/^(?:autor(?:es)?\d*|authors?\d*|vautores|vauthors)$/.test(key)))return surnames;
        for(let i=1;i<=4;i++) {
            const suffix=i===1?'':String(i);
            const name=map.get('último'+suffix)||map.get('ultimo'+suffix)||map.get('last'+suffix)||
                (i===1?(map.get('último1')||map.get('ultimo1')||map.get('last1')):'');
            if(!name)break;
            if(!v20Plain(name)||name.includes(','))return [];
            surnames.push(name);
        }
        return surnames;
    }
    function v20PublicationIdentity(value) {
        return String(value||'').normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt');
    }
    function v20DoiRepairProof(entry,p,cfg={}) {
        const original=entry.value.trim(),match=original.match(/^(10\.\d{4,9}\/\S+?)([.,;])$/);
        if(!match||/[{}<>\uE000]/.test(original))return null;
        const map=v20CitationFields(p),title=v20CitationTitle(map),year=v20PublicationYear(map);
        if(!v20Plain(title)||!/^\d{4}$/.test(year))return null;
        const authors=v20CitationSurnames(map);
        // Free-form personal names are not silently equated with registry surnames.
        if(!authors.length||!Array.isArray(cfg.doiRepairProofs))return null;
        const now=Number.isFinite(cfg.proofNow)?cfg.proofNow:Date.now();
        const proofs=cfg.doiRepairProofs.filter(proof=>{
            if(!proof||proof.registry!=='crossref'||proof.original!==original||proof.corrected!==match[1]||
                proof.originalStatus!==404||proof.originalAgencyStatus!==404||proof.correctedStatus!==200||proof.metadataDoi?.toLowerCase()!==match[1].toLowerCase())return false;
            const checked=Date.parse(proof.checkedAt);
            if(!Number.isFinite(checked)||checked>now+30000||now-checked>600000)return false;
            if(v20PublicationIdentity(proof.articleTitle)!==v20PublicationIdentity(title)||String(proof.publicationYear)!==year)return false;
            if(!Array.isArray(proof.authorSurnames)||proof.authorSurnames.length!==authors.length||
                !authors.every((name,i)=>v20PublicationIdentity(name)===v20PublicationIdentity(proof.authorSurnames[i])))return false;
            try {
                const url=new URL(proof.sourceUrl);
                return url.protocol==='https:'&&url.hostname==='api.crossref.org'&&
                    decodeURIComponent(url.pathname.replace(/^\/works\//,''))===match[1]&&!url.search&&!url.hash;
            } catch(_) {return false;}
        });
        return proofs.length===1?proofs[0]:null;
    }
    function v20StrictField(key,value) {
        const k=norm(key),v=value.trim();
        if(['data','date','acessodata','access-date','arquivodata','archive-date','data-publicacao','publication-date'].includes(k)) {
            const m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            return !!m&&validDate(Number(m[3]),Number(m[2]),Number(m[1]));
        }
        if(['ano','year'].includes(k))return /^[12]\d{3}$/.test(v);
        if(k==='pmid')return /^[1-9]\d{0,8}$/.test(v);
        if(k==='pmc')return /^(?:PMC)?[1-9]\d{0,8}$/.test(v);
        if(k==='doi')return /^10\.\d{4,9}\/[A-Za-z0-9._;()/:+-]+$/.test(v);
        return false;
    }
    function v20ValidURL(value) {
        const v=value.trim();
        if(!/^https?:\/\/[^\s{}<>\[\]|\uE000]+$/.test(v))return false;
        try {const u=new URL(v);return !!u.hostname&&u.hostname.includes('.')&&!u.username&&!u.password;}
        catch(_) {return false;}
    }
    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {
        if(!cfg.citations||cfg.citationRepairs===false||v20DefinitionContext(cfg))return raw;
        const p=parsedTemplate(raw);
        if(!CITE_NAMES[p.name]||raw.includes('\uE000')||raw.includes('{{{'))return raw;
        let entries=templateEntries(p),changed=false;
        const profile=TEMPLATE_CATALOG[p.name];
        for(const e of entries) {
            const target=V20_PARAMETER_TYPOS[norm(e.key)];
            // Accepted aliases remain exactly as typed, including titulo, língua and lang.
            if(cfg.automaticParameterNames===false||!target||nativeCitationAccepts(p,e.key)||!nativeCitationAccepts(p,target)||
                entries.some(x=>x!==e&&parameterFamily(mappedParam(V20_PARAMETER_TYPOS[norm(x.key)]||x.key,p.name))===parameterFamily(mappedParam(target,p.name))))continue;
            e.key=target;changed=true;bump('verifiedParameterTypos');
        }
        if(changed) {
            const rebuilt=entriesTemplate(p,entries);p.parts=parsedTemplate(rebuilt).parts;entries=templateEntries(p);
        }
        const urlKeys=new Set(['url','arquivourl','archive-url','archiveurl','urlcapitulo','capítulourl','chapter-url']);
        const insertions=[],pipePlans=[];
        for(const e of entries) {
            // Entire values must be two typed fields. Titles and URL values are excluded.
            if(!v20StrictField(e.key,e.value)&&!urlKeys.has(norm(e.key))) {
                const match=e.value.match(/^([^{}<>\uE000\r\n]+?)([ \t]+)([\p{L}_-]+)([ \t]*=[ \t]*)(https?:\/\/[^\s{}<>\[\]|\uE000]+)([ \t]*)$/u);
                if(!match||!v20StrictField(e.key,match[1])||!urlKeys.has(norm(match[3]))||
                    !v20ValidURL(match[5])||!nativeCitationAccepts(p,match[3])||
                    entries.some(x=>x!==e&&parameterFamily(x.key)===parameterFamily(match[3])))continue;
                pipePlans.push({entry:e,match,family:parameterFamily(match[3])});
            }
        }
        for(const plan of pipePlans) {
            if(pipePlans.filter(other=>other.family===plan.family).length!==1)continue;
            const e=plan.entry,match=plan.match,original=p.parts[e.index];
            const valueStart=original.length-e.value.length,splitAt=valueStart+match[1].length;
            p.parts[e.index]=original.slice(0,splitAt)+'|'+original.slice(splitAt);
            insertions.push(e.index);bump('missingCitationSeparators');changed=true;
        }
        if(insertions.length) {
            const rebuilt='{{'+p.parts.join('|')+'}}';p.parts=parsedTemplate(rebuilt).parts;entries=templateEntries(p);
        }
        if(['citar jornal','citar notícia','citar noticia','cite news'].includes(p.name)) {
            const old=entries.filter(e=>norm(e.key)==='caderno');
            const targets=entries.filter(e=>['departamento','department','subtitulo','subtítulo'].includes(norm(e.key)));
            const journals=entries.filter(e=>['jornal','newspaper','obra','work','periódico','periodico'].includes(norm(e.key)));
            const urls=entries.filter(e=>norm(e.key)==='url');
            if(old.length===1&&journals.length===1&&urls.length===1&&v20Plain(old[0].value)&&
                V20_NEWSPAPER_SECTIONS.has(norm(old[0].value))&&nativeCitationAccepts(p,'departamento')&&
                targets.length<=1&&targets.every(e=>!e.value.trim()||e.value.trim()===old[0].value.trim())) {
                let host='';try {host=new URL(urls[0].value.trim()).hostname.toLowerCase();} catch(_) {}
                const name=norm(v20PlainLabel(journals[0].value));
                const known=V20_NEWSPAPER_IDENTITIES.some(identity=>identity.names.includes(name)&&
                    identity.hosts.some(h=>host===h||host.endsWith('.'+h)));
                if(known) {
                    if(targets.length) {if(!targets[0].value.trim())targets[0].value=old[0].value;old[0].remove=true;}else old[0].key='departamento';
                    changed=true;bump('journalSections');
                }
            }
        }
        const doi=entries.filter(e=>norm(e.key)==='doi');
        if(doi.length===1) {
            const current=parsedTemplate(entriesTemplate(p,entries)),proof=v20DoiRepairProof(doi[0],current,cfg);
            if(proof) {doi[0].value=doi[0].value.replace(proof.original,proof.corrected);changed=true;bump('verifiedDOIRepairs');}
        }
        return changed?entriesTemplate(p,entries):raw;
    }
    function automaticLegacyReferenceColumns(source,cfg,bump=()=>{}) {
        if(!cfg.references||cfg.referenceColumns===false||cfg.sectionOnly||!v20AutomationAllowed(source,cfg))return source;
        const shield=maskProtected(source,()=>{},discussionProtectionRanges(source,cfg)),s=shield.text,edits=[];
        const counts=referenceEntryCounts(source),ranges=structuralRanges(s);
        for(const n of topNodes(s)) {
            const raw=s.slice(n.start,n.end),p=parsedTemplate(raw);
            if(!['referências','referencias'].includes(p.name)||raw.includes('\uE000')||
                inRangeExcept(n.start,ranges,n.start,n.end))continue;
            const entries=foreignEntries(p),old=entries.filter(e=>LEGACY_REFERENCE_COLUMNS.has(norm(e.key)));
            if(!old.length)continue;
            const groups=entries.filter(e=>['grupo','group'].includes(norm(e.key)));
            if(groups.length>1||groups.some(e=>/[{}<>\uE000]/.test(e.value)))continue;
            const styles=entries.filter(e=>norm(e.key)==='estilo'||e.key==='5');
            if(styles.length>1||styles.some(e=>/[{}<>\uE000]|\r|\n/.test(e.value)))continue;
            for(const e of old)e.remove=true;
            const count=counts[groups[0]?.value.trim()||'']||0;
            // Any existing explicit column count/width is a valid choice and remains intact.
            if(count>=REFERENCE_COLUMN_MINIMUM&&!styles.some(e=>/(?:^|;)\s*(?:(?:-moz-|-webkit-)?column-(?:count|width)|columns)\s*:/i.test(e.value))) {
                if(styles.length)styles[0].value=styles[0].value.replace(/;+\s*$/,'').trim()+(styles[0].value.trim()?';':'')+'column-count:2;';
                else {entries.push({index:p.parts.length,key:'estilo',value:'column-count:2;',lead:'',eq:'='});p.parts.push('');}
            }
            edits.push({start:n.start,end:n.end,text:translatedEntries(p,entries)});bump('legacyReferenceColumns');
        }
        return shield.restore(applyEdits(s,edits));
    }
    function v20WikiTarget(value) {
        const s=value.trim().replace(/_/g,' ').replace(/\s+/g,' ').normalize('NFC');
        if(!s||/[#:{}<>\uE000]/.test(s))return '';
        return s[0].toLocaleUpperCase('pt')+s.slice(1);
    }
    const MAIN_ARTICLE_NAMES = new Set(['artigo principal','artigos principais','artigo principal2','artigo principal 2','artigoprincipal','ap','main','principal','ver artigo principal','ver artigo','ver também artigo principal','details','detalhes']);
    function headingMainArticleCandidates(source,cfg={}) {
        if(cfg.sectionOnly||cfg.discussionPage||cfg.headings===false||cfg.links===false||cfg.namespaceNumber!==0||!v20AutomationAllowed(source,cfg))return [];
        const view=protectedView(source),ranges=structuralRanges(view),out=[];
        for(const match of view.matchAll(/^(={2,6})[ \t]*\[\[([^\[\]|\n]+)(?:\|([^\[\]\n]+))?\]\][ \t]*\1[ \t]*$/gm)){
            if(inRange(match.index,ranges))continue;
            const target=v20WikiTarget(match[2]),label=(match[3]??match[2]).trim();
            if(!target||!label||/[{}<>\uE000'\[\]|]/.test(label))continue;
            const rawTail=source.slice(match.index+match[0].length),tail=rawTail.replace(/^(?:\s|<!--[\s\S]*?-->)+/,'');
            const nextHeading=tail.match(/^={2,6}/);
            if(!tail||nextHeading&&nextHeading[0].length<=match[1].length)continue;
            let existing=null;
            if(tail.startsWith('{{')){
                const first=templates(tail).nodes.find(n=>n.start===0);
                if(first){const p=parsedTemplate(tail.slice(first.start,first.end));if(MAIN_ARTICLE_NAMES.has(p.name))existing=p;}
            }
            const existingTargets=existing?existing.parts.slice(1).map(p=>p.trim().replace(/^\d+\s*=\s*/,'').split('{{!}}')[0]).map(v20WikiTarget).filter(Boolean):[];
            out.push({start:match.index,end:match.index+match[0].length,target,label,level:match[1],existing:!!existing,existingTargets});
        }
        return out;
    }
    function automaticHeadingMainArticles(source,cfg,bump=()=>{}) {
        const candidates=headingMainArticleCandidates(source,cfg),edits=[];
        const sourceBound=cfg.headingMainArticleProofSource===cfg.biographyOriginalSource;
        for(const item of candidates){
            if(item.existing){
                if(item.existingTargets.includes(item.target))edits.push({...item,text:item.level+' '+item.label+' '+item.level});
                continue;
            }
            const proof=sourceBound&&(cfg.headingMainArticleProofs||[]).find(p=>p.target===item.target&&p.exists===true&&p.namespace===0&&p.disambiguation===false);
            if(!proof)continue;
            const current=v20WikiTarget(cfg.pageTitle||'');
            if(current&&(item.target===current||v20WikiTarget(proof.title||'')===current))continue;
            const argument=(item.target.includes('=')?'1=':'')+item.target;
            edits.push({...item,text:item.level+' '+item.label+' '+item.level+'\n{{Artigo principal|'+argument+'}}'});
        }
        for(const edit of edits)bump(edit.existing?'headingLinks':'headingMainArticles');
        return applyEdits(source,edits);
    }
    async function prepareHeadingMainArticles(task,options) {
        const cfg={...options},candidates=headingMainArticleCandidates(task.source,cfg).filter(x=>!x.existing);
        if(!candidates.length)return cfg;
        cfg.headingMainArticleProofs=[];cfg.headingMainArticleProofSource=task.source;
        try{
            task.guard();task.previewSession ||= onlineSession();
            const targets=[...new Set(candidates.map(x=>x.target))].slice(0,50);
            const data=await request(task.previewSession,'get',{action:'query',prop:'pageprops',ppprop:'disambiguation',titles:targets.join('|'),redirects:1,formatversion:2});
            task.guard();
            const aliases=new Map([...(data.query?.normalized||[]),...(data.query?.redirects||[])].map(x=>[v20WikiTarget(x.from),v20WikiTarget(x.to)]));
            const pages=Array.isArray(data.query?.pages)?data.query.pages:Object.values(data.query?.pages||{});
            for(const target of targets){
                let title=target;const seen=new Set();
                while(aliases.has(title)&&!seen.has(title)){seen.add(title);title=aliases.get(title);}
                const page=pages.find(p=>v20WikiTarget(p.title||'')===title);
                if(page&&page.ns===0&&Number(page.pageid)>0&&!Object.hasOwn(page,'missing')&&!Object.hasOwn(page,'invalid')&&!Object.hasOwn(page.pageprops||{},'disambiguation'))
                    cfg.headingMainArticleProofs.push({target,title,exists:true,namespace:0,disambiguation:false});
            }
        }catch(error){task.guard();cfg.headingMainArticleProofs=[];}
        return cfg;
    }

    const PORTUGUESE_LINK_EQUIVALENTS = Object.freeze({'Al-Kindi':'Alquindi','Ibn Muqla':'Ibne Mucla','Ibn al-Bawwab':'Ibne Albauabe','Vitruvius':'Vitrúvio','Avicenna':'Avicena','Nimrud':'Ninrude','Lente de Nimrud':'Lente de Ninrude'});
    function mergeEditorialRanges(ranges) {
        const out=[];
        for(const r of ranges.filter(r=>Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.end>r.start).sort((a,b)=>a.start-b.start||b.end-a.end)){
            if(out.length&&r.start<=out.at(-1).end)out.at(-1).end=Math.max(out.at(-1).end,r.end);else out.push({start:r.start,end:r.end});
        }
        return out;
    }
    function editorialWikiLinkRanges(source) {
        const out=[],stack=[];
        for(let i=0;i<source.length;i++){
            if(source.slice(i,i+2)==='[['){stack.push(i);i++;}
            else if(source.slice(i,i+2)===']]'&&stack.length){const start=stack.pop();out.push({start,end:i+2});i++;}
        }
        if(stack.length)out.push({start:stack[0],end:source.length});
        return out;
    }
    function portugueseEquivalent(target,label) {
        const canonical=v20WikiTarget(target);
        for(const [old,correct]of Object.entries(PORTUGUESE_LINK_EQUIVALENTS)){
            if((canonical===old||canonical===correct)&&label.trim().toLocaleLowerCase('pt')===old.toLocaleLowerCase('pt')){
                const first=label.trim()[0];return first===first.toLocaleLowerCase('pt')?correct[0].toLocaleLowerCase('pt')+correct.slice(1):correct;
            }
        }
        return null;
    }
    function canonicalPortugueseLinks(source,cfg,bump=()=>{}) {
        if(!cfg.links||!v20AutomationAllowed(source,cfg))return source;
        const protectedRanges=refTokens(source).map(r=>({start:r.start,end:r.end}));
        for(const n of templates(source).nodes)if(CITE_NAMES[parsedTemplate(source.slice(n.start,n.end)).name])protectedRanges.push(n);
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...protectedRanges])),edits=[];
        for(const m of shield.text.matchAll(/\[\[([^\[\]|\n]+)(?:\|([^\[\]\n]+))?\]\]/g)){
            const label=m[2]??m[1],next=portugueseEquivalent(m[1],label);
            if(!next)continue;
            const canonical=Object.entries(PORTUGUESE_LINK_EQUIVALENTS).find(([old,correct])=>v20WikiTarget(m[1])===old||v20WikiTarget(m[1])===correct)?.[1];
            const visible=next[0]===next[0].toLocaleLowerCase('pt')?canonical[0].toLocaleLowerCase('pt')+canonical.slice(1):canonical;
            const text='[['+visible+']]';if(text===m[0])continue;
            edits.push({start:m.index,end:m.index+m[0].length,text});bump('portugueseLinkNames');
        }
        return shield.restore(applyEdits(shield.text,edits));
    }
    function validRomanCentury(value) {
        const rows=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX'];
        return rows.includes(value)&&value!=='';
    }
    function repairCenturySyntax(source,cfg,bump=()=>{}) {
        if(!cfg.markup||!v20AutomationAllowed(source,cfg))return source;
        const ranges=refTokens(source).map(r=>({start:r.start,end:r.end}));
        const parsed=templates(source);
        for(const n of parsed.nodes)if(CITE_NAMES[parsedTemplate(source.slice(n.start,n.end)).name])ranges.push(n);
        for(const match of source.matchAll(/\{\{[ \t]*([^|{}\n]+)\|/g)){
            if(CITE_NAMES[norm(match[1])]&&!parsed.nodes.some(n=>n.start===match.index))ranges.push({start:match.index,end:source.length});
        }
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...ranges]));
        const fixed=shield.text.replace(/(?:\{\[([Ss]éc)\|([IVXLCDM]+)\}\}|\{\{([Ss]éc)\|([IVXLCDM]+)\}\])/g,(all,openName,openValue,closeName,closeValue)=>{
            const name=openName??closeName,value=openValue??closeValue;if(!validRomanCentury(value))return all;
            bump('centurySyntax');return '{{'+name+'|'+value+'}}';
        });
        return shield.restore(fixed);
    }
    function historicalDateMarkup(source,cfg,bump=()=>{}) {
        if(!cfg.markup||!v20AutomationAllowed(source,cfg))return source;
        let from=0;
        const tableRanges=literalOuterTables(source).map(raw=>{const start=source.indexOf(raw,from);from=start+raw.length;return{start,end:from};});
        const quoteRanges=[...source.matchAll(/"[^"\n]*"|“[^”\n]*”|'{2,3}[^\n]*?'{2,3}/g)].map(m=>({start:m.index,end:m.index+m[0].length}));
        const headingRanges=[...source.matchAll(/^(={2,6})[^\n]*?\1[ \t]*$/gm)].map(m=>({start:m.index,end:m.index+m[0].length}));
        const ranges=[...refTokens(source).map(r=>({start:r.start,end:r.end})),...templates(source).nodes,...editorialWikiLinkRanges(source),...tableRanges,...quoteRanges,...headingRanges];
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...ranges]));
        let text=shield.text.replace(/\bséculo[ \t]+([IVXLCDM]+)\b/g,(all,value)=>{if(!validRomanCentury(value))return all;bump('historicalDates');return '{{séc|'+value+'}}';});
        text=text.replace(/\b([1-9]\d{0,3}|[IVXLCDM]+)[ \t]+a\.C\.(?![\p{L}\p{N}])/gu,(all,value)=>{
            if(!/^\d+$/.test(value)&&!validRomanCentury(value))return all;
            bump('historicalDates');return '{{AC|'+value+'|x}}';
        });
        return shield.restore(text);
    }
    function captionTerminalPeriods(source,cfg,bump=()=>{}) {
        if(!cfg.markup||!v20AutomationAllowed(source,cfg))return source;
        const protectedRanges=refTokens(source).map(r=>({start:r.start,end:r.end}));
        for(const n of templates(source).nodes)if(CITE_NAMES[parsedTemplate(source.slice(n.start,n.end)).name])protectedRanges.push(n);
        const shield=maskProtected(source,()=>{},mergeEditorialRanges([...discussionProtectionRanges(source,cfg),...protectedRanges])),s=shield.text,stack=[],nodes=[];
        for(let i=0;i<s.length;i++){
            if(s.slice(i,i+2)==='[['){stack.push(i);i++;}
            else if(s.slice(i,i+2)===']]'&&stack.length){const start=stack.pop();if(!stack.length)nodes.push({start,end:i+2});i++;}
        }
        const edits=[];
        for(const node of nodes){
            const raw=s.slice(node.start,node.end);if(!/^\[\[\s*(?:Imagem|Ficheiro|Arquivo|File|Image)\s*:/i.test(raw))continue;
            const parts=splitParts(raw.slice(2,-2));if(parts.length<2)continue;
            if(!/\.(?:png|jpe?g|svg|gif|webp|tiff?)$/i.test(parts[0].trim()))continue;
            const caption=parts.at(-1),trimmed=caption.trim();
            if(preservationImageOption(caption)||/[\r\n\uE000]|<|https?:\/\//i.test(caption)||!trimmed.endsWith('.')||trimmed.endsWith('...'))continue;
            const word=trimmed.match(/([\p{L}]+)\.$/u)?.[1];
            if(word&&(word.length<3||/^(?:etc|aprox|prof|profa|pág|págs|vol|ed|fig|dr|dra|sr|sra)$/i.test(word)))continue;
            if(!word&&!/(?:\]\]|\}\}|\b[12]\d{3})\.$/.test(trimmed))continue;
            parts[parts.length-1]=caption.replace(/\.(\s*)$/,'$1');
            edits.push({...node,text:'[['+parts.join('|')+']]'});bump('captionPeriods');
        }
        return shield.restore(applyEdits(s,edits));
    }
    function technicalFinding(finding) {
        return finding.severity==='info'||/^table-(?:dynamic|nested|large|complex|year-heading|header-scope)$/.test(finding.code||'');
    }
    function groupedTechnicalFindings(findings) {
        const groups=new Map();
        for(const item of findings){const key=(item.domain||'')+'|'+(item.code||'')+'|'+item.message;
            if(groups.has(key))groups.get(key).occurrences++;else groups.set(key,{...item,occurrences:1});}
        return [...groups.values()].map(item=>({...item,message:item.message+(item.occurrences>1?' ('+item.occurrences+' ocorrências.)':'')}));
    }

    function automaticHeadingLinks(source,cfg,bump=()=>{}) {
        if(!cfg.headings||!cfg.links||!v20AutomationAllowed(source,cfg))return source;
        source=automaticHeadingMainArticles(source,cfg,bump);
        const shield=maskProtected(source,()=>{},discussionProtectionRanges(source,cfg)),s=shield.text;
        const ranges=structuralRanges(s),edits=[];
        for(const heading of s.matchAll(/^(={2,6})([ \t]*)(.*?)([ \t]*)\1[ \t]*$/gm)) {
            if(inRange(heading.index,ranges)||/[{}<>\uE000]/.test(heading[3]))continue;
            const tail=s.slice(heading.index+heading[0].length).replace(/^\r?\n(?:[ \t]*\r?\n)*/,'');
            const body=tail.match(/^[^\n]+(?:\n(?![ \t]*\n|={2}|[ *#:;{|!])[^\n]+)*/)?.[0]||'';
            if(!body||/^[ \t]*[=*#:;{|!<\uE000]/.test(body))continue;
            const view=protectedView(body),hidden=structuralRanges(view),targets=new Set();
            for(const link of view.matchAll(/\[\[([^\[\]|\n]+)(?:\|([^\[\]\n]+))?\]\]/g))
                if(!inRange(link.index,hidden)) {const target=v20WikiTarget(link[1]);if(target)targets.add(target);}
            const contentStart=heading.index+heading[1].length+heading[2].length;
            for(const link of heading[3].matchAll(/\[\[([^\[\]|\n]+)(?:\|([^\[\]\n]+))?\]\]/g)) {
                const target=v20WikiTarget(link[1]),label=link[2]??link[1];
                if(!target||!targets.has(target)||!label.trim()||/[{}<>\uE000'\[\]|]/.test(label))continue;
                edits.push({start:contentStart+link.index,end:contentStart+link.index+link[0].length,text:label});
                bump('headingLinks');
            }
        }
        return shield.restore(applyEdits(s,edits));
    }
    function automaticShortCitationAuthors(source,cfg,bump=()=>{}) {
        if(!cfg.references||cfg.shortCitationChecks===false||cfg.sectionOnly||!v20AutomationAllowed(source,cfg))return source;
        const shield=maskProtected(source,()=>{},discussionProtectionRanges(source,cfg)),s=shield.text;
        const definitions=new Map(),nodes=templates(s).nodes,edits=[];
        for(const n of nodes) {
            const p=parsedTemplate(s.slice(n.start,n.end));if(!CITE_NAMES[p.name])continue;
            const map=v20CitationFields(p),ref=map?.get('ref'),names=v20CitationSurnames(map),year=v20PublicationYear(map),title=v20CitationTitle(map);
            if(ref!=='harv'||names.length<2||!/^\d{4}[a-z]?$/i.test(year)||!v20Plain(title))continue;
            const id=names.join('\u0000')+'\u0000'+year;
            if(!definitions.has(id))definitions.set(id,[]);definitions.get(id).push({title,raw:s.slice(n.start,n.end)});
        }
        for(const n of nodes) {
            const raw=s.slice(n.start,n.end),p=parsedTemplate(raw);
            if(!['harvnb','harv','harvtxt','sfnp','sfn'].includes(p.name)||raw.includes('\uE000'))continue;
            if(p.parts.length<3||p.parts.slice(1).some(part=>/^\s*(?:[1-9]\d*|[Rr]ef)\s*=/.test(part)))continue;
            const joined=p.parts[1].trim(),year=p.parts[2].trim();
            if(!/^\d{4}[a-z]?$/i.test(year)||!v20Plain(joined))continue;
            const names=joined.split(', ').map(x=>x.trim());
            if(names.length<2||names.length>4||names.some(x=>!x||x.includes(',')||!/^\p{Lu}[\p{L}\p{M} .'-]+$/u.test(x)))continue;
            const works=definitions.get(names.join('\u0000')+'\u0000'+year);
            if(!works||works.length!==1)continue;
            // Exactly these surnames, this order and this year must build the local anchor.
            const parts=p.parts.slice();parts.splice(1,1,...names);
            const after='{{'+parts.join('|')+'}}';
            edits.push({start:n.start,end:n.end,text:after});bump('shortCitationAuthors');
        }
        return shield.restore(applyEdits(s,edits));
    }
    function nativeNoteEmission(p) {
        if(!['nre','efn','refn'].includes(p.name))return null;
        const entries=foreignEntries(p);
        const fields=entries.filter(e=>(p.name==='refn'?['group']:['grupo','group']).includes(norm(e.key)));
        const names=entries.filter(e=>(p.name==='refn'?['name']:['name','nome']).includes(norm(e.key)));
        if(fields.length>1||names.some((e,i)=>names.slice(0,i).some(other=>norm(other.key)===norm(e.key))))return {ambiguous:true};
        let group=fields.length?fields[0].value.trim():'';
        const personalName=(names.find(e=>norm(e.key)==='name')||names.find(e=>norm(e.key)==='nome'))?.value.trim()||'';
        if(/[{}<>\[\]\uE000\uE001]/.test(group)||names.some(e=>/[{}<>\uE000\uE001]/.test(e.value)))return {ambiguous:true};
        if(p.name!=='refn') {
            // Nre 68628864 emite apenas group no ramo nomeado. Preservar a
            // chamada e modelar o resultado, sem contornar o código do modelo.
            if(['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'].includes(group)) {
                if(personalName&&fields[0]&&norm(fields[0].key)==='grupo')group='';
            }else group='lower-alpha';
        }
        return {ambiguous:false,group,name:personalName};
    }
    function noteGroupInventory(source) {
        const s=protectedView(source),groups=new Set(),implicit=new Set(),literal=new Set();
        let ambiguous=false;
        for(const ref of refTokens(s)) {
            const attrs=attrsOf(ref.attrs),group=attrs?.group;
            if(((ref.attrs||'').match(/(?:^|\s)group\s*=/gi)||[]).length>1){ambiguous=true;continue;}
            if(group){groups.add(group);literal.add(group);}
        }
        for(const node of templates(s).nodes) {
            const p=parsedTemplate(s.slice(node.start,node.end));let name=p.name;
            const seen=new Set();
            while(TEMPLATE_CATALOG[name]?.redirectTo&&!seen.has(name)) {
                seen.add(name);name=nameOf(TEMPLATE_CATALOG[name].redirectTo);
            }
            if(!['nre','efn','refn'].includes(name))continue;
            const emission=nativeNoteEmission({...p,name});
            if(emission.ambiguous){ambiguous=true;continue;}
            const group=emission.group;
            if(group){groups.add(group);implicit.add(group);}
        }
        return {groups,implicit,literal,ambiguous};
    }
    function automaticMissingNoteCollector(source,cfg,bump=()=>{}) {
        if(!cfg.references||cfg.sectionOnly||cfg.namespaceNumber!==0||!v20AutomationAllowed(source,cfg)||
            cfg.noteRendererProofSource!==source||!Array.isArray(cfg.noteRendererProofs))return source;
        const accepted=new Set(['nota','Nota','nt','lower-alpha']);
        const proofs=cfg.noteRendererProofs.filter(p=>p?.missing===true&&accepted.has(p.group));
        if(proofs.length!==1)return source;
        const group=proofs[0].group,s=protectedView(source),inventory=noteGroupInventory(source);
        if(inventory.ambiguous||!inventory.groups.has(group))return source;
        const renderers=rendererRanges(s);
        for(const r of renderers) {
            const raw=s.slice(r.start,r.end);
            if(raw.startsWith('<')&&attrsOf(tagAt(raw,0).attrs)?.group===group)return source;
            if(raw.startsWith('{{')) {
                const p=parsedTemplate(raw),fields=foreignEntries(p),g=fields.find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim();
                if(g===group||p.name==='notas'&&(group==='lower-alpha'||(!g?group==='nota':g===group))||p.name==='notas e referências')return source;
            }
        }
        const ranges=structuralRanges(s);
        if([...s.matchAll(/^==[ \t]*Notas[ \t]*==[ \t]*$/gmi)].some(m=>!inRange(m.index,ranges)))return source;
        // Uma nota criada por Nre ou efn pode usar o coletor combinado.
        // A substituição só alcança a chamada simples, sem dados ou opções.
        if(cfg.unifiedNotesReferences&&inventory.implicit.has(group)&&!inventory.literal.has(group)&&
            [...inventory.groups].every(g=>accepted.has(g))&&renderers.length===1) {
            const r=renderers[0],raw=s.slice(r.start,r.end),p=parsedTemplate(raw);
            const start=s.lastIndexOf('\n',r.start-1)+1,next=s.indexOf('\n',r.end);
            if(['referências','referencias'].includes(p.name)&&p.parts.length===1&&
                !s.slice(start,r.start).trim()&&!s.slice(r.end,next<0?s.length:next).trim()) {
                bump('missingNoteCollector');
                return source.slice(0,r.start)+'{{Notas e referências}}'+source.slice(r.end);
            }
        }
        let at=-1;
        for(const m of s.matchAll(/^==[ \t]*Referências[ \t]*==[ \t]*$/gmi))
            if(!inRange(m.index,ranges)){at=m.index;break;}
        if(at<0)for(const n of topNodes(s)) {
            const p=parsedTemplate(s.slice(n.start,n.end));
            if(!['referências','referencias'].includes(p.name))continue;
            const line=s.lastIndexOf('\n',n.start-1)+1,next=s.indexOf('\n',n.end);
            if(!s.slice(line,n.start).trim()&&!s.slice(n.end,next<0?s.length:next).trim()){at=line;break;}
        }
        if(at<0)return source;
        const collector=group==='nota'?'{{Notas}}':'{{Notas|grupo='+group+'}}';
        bump('missingNoteCollector');
        return source.slice(0,at)+collector+'\n\n'+source.slice(at);
    }

    function automaticRulesPass(source,cfg,bump=()=>{},warn=()=>{}) {
        if(!v20AutomationAllowed(source,cfg))return source;
        const shield=maskProtected(source,warn,discussionProtectionRanges(source,cfg));
        let s=mapTemplateTree(shield.text,raw=>automaticCitationRepairs(raw,cfg,bump));
        s=automaticShortCitationAuthors(s,cfg,bump);
        s=automaticLegacyReferenceColumns(s,cfg,bump);
        s=automaticHeadingLinks(s,cfg,bump);
        return shield.restore(s);
    }
    function v20DateIdentity(value) {
        const trimmed=String(value||'').trim();
        if(!trimmed)return null;
        const raw=trimmed.replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>|<ref\b[^>]*\/\s*>/gi,'').trim();
        if(/^\{\{[\s\S]*}}$/.test(raw)) {
            const p=parsedTemplate(raw);
            if(!['dni','dnibr','dataext','nascimento','data de nascimento','data nascimento','morte','falecimento'].includes(p.name))return null;
            const fields=foreignEntries(p);
            if(fields.some(e=>!e.positional))return null;
            const [day,month,year]=p.parts.slice(1,4).map(x=>x?.trim());
            return [day,month,year].every(n=>/^\d+$/.test(n||''))&&validDate(+day,+month,+year)?`${+year}-${+month}-${+day}`:null;
        }
        const plain=raw.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,target,label)=>label||target);
        const iso=plain.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if(iso&&validDate(+iso[3],+iso[2],+iso[1]))return `${+iso[1]}-${+iso[2]}-${+iso[3]}`;
        const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const pt=plain.match(/^(\d{1,2})(?:\.?º)? de ([\p{L}]+) de (\d{4})$/iu);
        const month=pt?months.indexOf(norm(pt[2]))+1:0;
        return pt&&month&&validDate(+pt[1],month,+pt[3])?`${+pt[3]}-${month}-${+pt[1]}`:null;
    }
    function biographyStyleAudit(source,cfg={}) {
        if(cfg.biographyStyleChecks===false||cfg.namespaceNumber!==0||cfg.sectionOnly||!v20AutomationAllowed(source,cfg))return [];
        const box=principalBiographyBox(source,cfg);if(!box)return [];
        const view=protectedView(source),firstHeading=view.match(/^={2,6}/m)?.index??view.length;
        const lead=view.slice(0,firstHeading),ranges=structuralRanges(lead);
        const lines=[...lead.matchAll(/^[^\n]*\S[^\n]*$/gm)].filter(m=>!inRange(m.index,ranges)&&!/^\s*[<{|!*#:;=\uE000]/.test(m[0]));
        const first=lines.find(m=>m[0].includes("'''"));if(!first)return [];
        const opening=first[0],name=opening.match(/'''([^'\n]+)'''/),findings=[];
        if(!name)return [];
        const prefix=opening.slice(0,name.index),after=opening.slice(name.index+name[0].length);
        if(/(?:\b(?:Dr\.?|Dra\.?|Doutor|Doutora|Professor|Professora|Prof\.?|General|Coronel|Capitão|Capitã|Almirante|Duque|Duquesa|Conde|Condessa|Barão|Baronesa)|\[\[(?:[^\]|]+\|)?(?:Dr\.?|Dra\.?|Professor|Professora|General|Coronel|Capitão|Almirante)\]\])\s*$/iu.test(prefix))
            findings.push({code:'biography-opening-honorific',start:first.index,severity:'warning',message:'Confira o título ou a patente antes do nome na abertura. WP:LEOBIO orienta contextualizar essas informações no corpo do artigo. O texto foi preservado.'});
        if(/^\s*,?\s*(?:G[CO]M\w*|G[CO]IH|G[CO]SE|KBE|CBE|OBE|MBE|GBE|CH|FRS|FRSE|FBA)\b/.test(after))
            findings.push({code:'biography-opening-postnominal',start:first.index+name.index+name[0].length,severity:'warning',message:'Confira as siglas de distinções imediatamente após o nome. WP:LEOBIO orienta contextualizar ordens e condecorações na infocaixa ou no corpo do artigo. O texto foi preservado.'});
        const birth=box.fields.filter(e=>BIRTH_FIELDS.has(norm(e.key))&&e.value.trim());
        if(birth.length!==1)return findings;
        const boxDate=v20DateIdentity(birth[0].value);if(!boxDate)return findings;
        const bracket=after.match(/^\s*\(([^)]{1,400})\)/)?.[1]||'';
        const candidates=[];
        for(const n of templates(bracket).nodes) {const p=parsedTemplate(bracket.slice(n.start,n.end));if(['dni','dnibr','dataext','nascimento','data de nascimento','data nascimento'].includes(p.name)) {const d=v20DateIdentity(bracket.slice(n.start,n.end));if(d)candidates.push(d);}}
        if(!candidates.length) {
            for(const m of bracket.matchAll(/(?:\[\[)?\d{1,2}(?:\.?º)? de [\p{L}]+(?:\]\])? de (?:\[\[)?\d{4}(?:\]\])?/giu)) {const d=v20DateIdentity(m[0]);if(d)candidates.push(d);}
        }
        if(candidates.length&&candidates[0]!==boxDate)findings.push({code:'biography-birth-conflict',start:first.index+name.index+name[0].length,severity:'warning',message:'A data de nascimento na introdução ('+candidates[0]+') difere da infocaixa ('+boxDate+'). Confira as fontes antes de escolher uma data. Os valores foram preservados.'});
        return findings;
    }
    function v20PreflightCandidates(source,cfg={}) {
        if(!v20AutomationAllowed(source,cfg))return {dois:[],noteGroups:[]};
        const s=protectedView(source),dois=[],noteGroups=new Set();
        if(cfg.citations!==false&&cfg.citationRepairs!==false)for(const n of templates(s).nodes) {
            const raw=source.slice(n.start,n.end),p=parsedTemplate(raw);if(!CITE_NAMES[p.name]||raw.includes('{{{'))continue;
            const entries=templateEntries(p),doi=entries.filter(e=>norm(e.key)==='doi');if(doi.length!==1)continue;
            const original=doi[0].value.trim(),m=original.match(/^(10\.\d{4,9}\/\S+?)([.,;])$/);
            if(!m||/[{}<>\uE000]/.test(original))continue;
            const map=v20CitationFields(p),title=v20CitationTitle(map),year=v20PublicationYear(map),authors=v20CitationSurnames(map);
            if(!v20Plain(title)||!/^\d{4}$/.test(year)||!authors.length)continue;
            dois.push({original,corrected:m[1],articleTitle:title,publicationYear:year,authorSurnames:authors,start:n.start});
        }
        if(cfg.references!==false&&!cfg.sectionOnly&&cfg.namespaceNumber===0) {
            const inventory=noteGroupInventory(s);
            if(!inventory.ambiguous)for(const group of inventory.groups)
                if(['nota','Nota','nt','lower-alpha'].includes(group))noteGroups.add(group);
        }
        return {dois:dois.slice(0,12),noteGroups:[...noteGroups]};
    }
    function verifiedDOIExpectedSource(source,cfg={}) {
        if(!cfg.citations||cfg.citationRepairs===false||!v20AutomationAllowed(source,cfg))return source;
        const shield=maskProtected(source,()=>{},discussionProtectionRanges(source,cfg));
        const s=mapTemplateTree(shield.text,raw=>{
            const p=parsedTemplate(raw);if(!CITE_NAMES[p.name]||raw.includes('\uE000'))return raw;
            const entries=templateEntries(p),doi=entries.filter(e=>norm(e.key)==='doi');if(doi.length!==1)return raw;
            const proof=v20DoiRepairProof(doi[0],p,cfg);if(!proof)return raw;
            doi[0].value=doi[0].value.replace(proof.original,proof.corrected);
            return entriesTemplate(p,entries);
        });
        return shield.restore(s);
    }

    function reviewSuggestions(source, cfg) {
        if (!cfg.review||discussionProtectionRanges(source,pageContextOptions(cfg)).length) return [];
        const shield = maskProtected(source, () => {}), s = shield.text, proposals = [], limit = 100;
        function offer(start, end, label, choices) {
            const before = s.slice(start, end);
            if (before.includes('\uE000AJG') || proposals.length >= limit || choices.every(c => c.after === before)) return;
            proposals.push({id: 'review-' + proposals.length, start, end, before, label,
                choices: choices.filter(c => c.after !== before)});
        }
        for (const n of templates(s).nodes) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw), entries = templateEntries(p);
            if (cfg.multilingual && migrateForeignTemplate(raw,cfg)?.blocked) continue;
            const profile = cfg.infoboxes && INFOBOX_CATALOG[p.name] || (cfg.auxiliaryTemplates && !INFOBOX_CATALOG[p.name] && !CITE_NAMES[p.name] && TEMPLATE_CATALOG[p.name]);
            if (cfg.citations && CITE_NAMES[p.name] || profile) {
                const families = new Map();
                for (const e of entries) {
                    const family = profile ? (profile.renames[e.key] || e.key) : parameterFamily(e.key);
                    if (!families.has(family)) { families.set(family, e); continue; }
                    const prev = families.get(family);
                    if (prev.value.trim() === e.value.trim()) continue;
                    offer(n.start, n.end, 'Escolher o valor de ' + prev.key + ' / ' + e.key, [prev, e].map(chosen => {
                        const copy = entries.map(x => ({...x, remove: x !== chosen && (profile ? (profile.renames[x.key] || x.key) : parameterFamily(x.key)) === family}));
                        return {label: 'Manter ' + chosen.key + '=' + chosen.value.trim(), after: entriesTemplate(p, copy)};
                    }));
                }
                for (const e of entries) {
                    const k = norm(e.key), v = e.value.trim();
                    if (cfg.authors && ['autor', 'autores', 'editor', 'editores', 'vauthors', 'veditors', 'vautores', 'veditores'].includes(k)) {
                        const names = splitAuthorNames(v, false), base = /editor/.test(k) ? 'editor' : 'autor';
                        if (names && !otherAuthorFields(entries, e, base)) {
                            const copy = entries.map(x => ({...x})), ep = {parts: p.parts.slice()};
                            copy.find(x => x.index === e.index).key = base; copy.find(x => x.index === e.index).value = names[0];
                            names.slice(1).forEach((v, i) => addParam(ep, copy, base + (i + 2), v));
                            offer(n.start, n.end, 'Separar uma lista de autores com nomes pessoais, confira cada nome',
                                [{label: 'Separar os ' + names.length + ' nomes', after: entriesTemplate(ep, copy)}]);
                        }
                    }
                    const accepted = profile ? profile.accepted : CITATION_KEY_CATALOG[p.name] || CS1_KEYS;
                    const valid = profile ? infoboxAccepts(profile, e.key) : accepted.includes(e.key) || accepted.includes(e.key.replace(/\d+/g, '#'));
                    if (!valid && !/^\d+$/.test(e.key) && !(profile && profile.partial) &&
                        !(!profile && norm(e.key) === 'caderno' && cfg.citationRepairs)) {
                        const candidates = accepted.filter(x => !x.includes('#') && !/\d/.test(x) && editDistance(e.key, x) <= 2 &&
                            !entries.some(y => y !== e && y.key === x)).slice(0, 3);
                        const choices = candidates.map(key => ({label: 'Trocar por ' + key,
                            after: entriesTemplate(p, entries.map(x => x === e ? {...x, key} : x))}));
                        choices.push({label: 'Remover o parâmetro e o seu valor', after: entriesTemplate(p, entries.map(x => x === e ? {...x, remove: true} : x))});
                        offer(n.start, n.end, 'Parâmetro fora do catálogo de ' + p.parts[0].trim() + ': ' + e.key, choices);
                    }
                    if (!profile && k === 'doi' && /[.,;]$/.test(v)) offer(n.start, n.end,
                        'Pontuação no fim do DOI, confira o identificador na publicação', [{label: 'Retirar apenas o último sinal',
                            after: entriesTemplate(p, entries.map(x => x === e ? {...x, value: v.slice(0, -1)} : x))}]);
                    if (!profile && k === 'url-status' && /^(?:unfit|usurped|unfit no archive|usurped no archive)$/i.test(v))
                        offer(n.start, n.end, 'Estado especial da URL, confira se o arquivo é utilizável', [{label: 'Usar urlmorta=sim e conservar o arquivo',
                            after: entriesTemplate(p, entries.map(x => x === e ? {...x, key: 'urlmorta', value: 'sim'} : x))}]);
                    if (!profile && /\s+(?:url|doi|isbn|data|acessodata)\s*=/.test(e.value) && !/[{}<>\uE000]/.test(e.value))
                        offer(n.start, n.end, 'Possível | ausente, confira se o texto pertence ao título', [{label: 'Separar os campos aparentes',
                            after: entriesTemplate(p, entries.map(x => x === e ? {...x, value: e.value.replace(/\s+(?=(?:url|doi|isbn|data|acessodata)\s*=)/g, '|')} : x))}]);
                }
            }
            if (cfg.obsoleteTemplates && p.name === 'fossil range' && p.parts.slice(1).every(x => !x.includes('='))) offer(n.start, n.end,
                'Converter Fossil range, confira a escala e o resultado', [{label: 'Usar Período fóssil', after: '{{Período fóssil|' + p.parts.slice(1).join('|') + '}}'}]);
            if (cfg.obsoleteTemplates && ['track listing', 'tracklist'].includes(p.name)) offer(n.start, n.end,
                'Converter a lista de faixas com a predefinição de substituição da ptwiki', [{label: 'Substituir e pré-visualizar',
                    after: '{\x7Bsubst:Lista de faixas/Testes|' + p.parts.slice(1).join('|') + '}}'}]);
            if (cfg.references && ['harvnb', 'sfn'].includes(p.name) && p.parts[1] && /^[\p{L} .'-]+, [\p{L} .'-]+$/u.test(p.parts[1])) {
                const parts = p.parts.slice(); parts.splice(1, 1, ...parts[1].split(', '));
                offer(n.start, n.end, 'Separar autores na citação curta, confira a bibliografia', [{label: 'Separar por |', after: '{{' + parts.join('|') + '}}'}]);
            }
        }
        if (cfg.bareReferences) for (const r of refTokens(s)) {
            if (r.body === null) continue;
            if (/^\s*<cite\b[^>]*>[\s\S]*<\/cite>\s*$/i.test(r.body) && !/\uE000/.test(r.body)) offer(r.openEnd,
                r.end - r.raw.match(/<\s*\/\s*ref\s*>$/i)[0].length,
                'Retirar a marcação cite copiada, preservando o texto da referência', [{label: 'Retirar somente as etiquetas cite',
                    after: r.body.replace(/^\s*<cite\b[^>]*>/i, '').replace(/<\/cite>\s*$/i, '')}]);
            if (/[{}<>\uE000]/.test(r.body)) continue;
            const m = r.body.trim().match(/^([\p{L}\d .,'-]+?)\.?\s+"([^"|]+)"\.?(.*)$/u);
            if (m && !/[|]/.test(m[1] + m[3])) offer(r.openEnd, r.end - r.raw.match(/<\s*\/\s*ref\s*>$/i)[0].length,
                'Formatar a referência textual, confira autor e título', [{label: 'Usar Citation e preservar o restante em outros',
                    after: '{{Citation|autor=' + m[1] + '|título=' + m[2] + (m[3].trim() ? '|outros=' + m[3].trim() : '') + '}}'}]);
        }
        if (cfg.endMatter) {
            const re = /^== Bibliografia ==\n((?:[ \t]*\n|\*[^\n]*(?:\n|$))+)/gm, ranges = structuralRanges(s);
            let m; while ((m = re.exec(s))) if (!inRange(m.index, ranges) && m[1].includes('*') &&
                !templates(m[1]).unclosed.length && !/\{\{(?:InícioRef|InicioRef|Refbegin|-fim|Refend|Div col|Div col fim)\b/i.test(m[1]))
                offer(m.index, re.lastIndex, 'Agrupar a lista bibliográfica com InícioRef e -fim', [{label: 'Aplicar formatação bibliográfica',
                    after: '== Bibliografia ==\n{{InícioRef}}\n' + m[1].trimEnd() + '\n{{-fim}}\n\n'}]);
        }
        if (cfg.maintenance) {
            const re = /\[\[Categoria:!Páginas com traduções não revistas\]\]/g;
            let m; while ((m = re.exec(s))) if (!inRange(m.index, structuralRanges(s))) offer(m.index, re.lastIndex,
                'Retirar a categoria de tradução não revista somente depois da revisão', [{label: 'Remover a categoria', after: ''}]);
        }
        if (cfg.references) proposals.push(...duplicateReferenceSuggestions(source));
        proposals.push(...multilingualSuggestions(source,cfg), ...externalColumnsSuggestions(source,cfg), ...citationRepairSuggestions(source,cfg), ...legacyReferenceColumnSuggestions(source,cfg));
        if (cfg.tableChecks !== false) proposals.push(...tableSuggestions(source));
        return proposals;
    }
    function editDistance(a, b) {
        if (Math.abs(a.length - b.length) > 2) return 99;
        let row = Array.from({length: b.length + 1}, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            const next = [i];
            for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            row = next;
        }
        return row[b.length];
    }
    function applySuggestion(source, proposal, choiceIndex) {
        const shield = maskProtected(source, () => {}), choice = proposal.choices[choiceIndex];
        if (!choice || shield.text.slice(proposal.start, proposal.end) !== proposal.before)
            throw new Error('A sugestão ficou desatualizada. Faça a análise novamente.');
        return shield.restore(shield.text.slice(0, proposal.start) + choice.after + shield.text.slice(proposal.end));
    }
    function linkTargets(source) {
        const shield = maskProtected(source, () => {}), s = shield.text, context = templates(s).nodes;
        const data = new Map(), re = /\[\[\s*([^|\]\n]+)(?:\|[^\]\n]*)?\]\]/g;
        let m, seeStart = -1, seeEnd = -1;
        const headings = /^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm;
        while ((m = headings.exec(s))) if (!inRange(m.index, structuralRanges(s))) {
            if (seeStart >= 0 && seeEnd < 0 && m[1].length === 2) seeEnd = m.index;
            if (norm(m[2]) === 'ver também') seeStart = headings.lastIndex;
        }
        while ((m = re.exec(s))) {
            let title = m[1].trim().replace(/^:/, '').split('#')[0].replace(/_/g, ' ');
            if (!title || /[{}<>\uE000]/.test(title) || /^(?:Imagem|Image|File|Ficheiro|Arquivo|Especial|Special)\s*:/i.test(title)) continue;
            const category = /^(?:Categoria|Category)\s*:/i.test(title);
            if (category) title = title.replace(/^(?:Categoria|Category)\s*:\s*/i, 'Categoria:');
            const record = data.get(title) || {title, category, seeAlso: false};
            if (m.index >= seeStart && seeStart >= 0 && (seeEnd < 0 || m.index < seeEnd) && !inRange(m.index, context)) record.seeAlso = true;
            data.set(title, record);
        }
        return [...data.values()];
    }

    // Revisão local. As posições se referem ao texto original, sem publicar edições.
    function lineDiffHunks(before, after) {
        if (before === after) return [];
        const a = before.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
        const b = after.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
        const ao = [0], bo = [0];
        a.forEach(x => ao.push(ao[ao.length - 1] + x.length));
        b.forEach(x => bo.push(bo[bo.length - 1] + x.length));
        let lo = 0, ae = a.length, be = b.length;
        while (lo < ae && lo < be && a[lo] === b[lo]) lo++;
        while (ae > lo && be > lo && a[ae - 1] === b[be - 1]) { ae--; be--; }
        const pairs = [];
        // Limite de memória. Um bloco muito grande continua revisável como um único trecho.
        if ((ae - lo + 1) * (be - lo + 1) <= 600000) {
            const width = be - lo + 1, table = new Uint32Array((ae - lo + 1) * width);
            for (let i = ae - lo - 1; i >= 0; i--) for (let j = be - lo - 1; j >= 0; j--)
                table[i * width + j] = a[lo + i] === b[lo + j] ? 1 + table[(i + 1) * width + j + 1] :
                    Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
            let i = 0, j = 0;
            while (i < ae - lo && j < be - lo) {
                if (a[lo + i] === b[lo + j]) { pairs.push([lo + i++, lo + j++]); }
                else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++;
                else j++;
            }
        }
        pairs.push([ae, be]);
        const hunks = []; let i = lo, j = lo;
        for (const [ai, bi] of pairs) {
            if (ai > i || bi > j) {
                let start = ao[i], end = ao[ai], newStart = bo[j], newEnd = bo[bi];
                while (start < end && newStart < newEnd && before[start] === after[newStart]) { start++; newStart++; }
                while (end > start && newEnd > newStart && before[end - 1] === after[newEnd - 1]) { end--; newEnd--; }
                if (start !== end || newStart !== newEnd) hunks.push({start, end, newStart, newEnd,
                    before: before.slice(start, end), after: after.slice(newStart, newEnd)});
            }
            i = ai + 1; j = bi + 1;
        }
        return hunks;
    }
    // Analisa sem alterar exemplos literais e conserva as posições do código-fonte.
    function protectedView(source) { return scanMemo(source,'protectedView',()=>scanProtectedView(source)); }
    function scanProtectedView(source) {
        const shield = maskProtected(source, () => {});
        return shield.text.replace(/\uE000AJGX*\d+\uE001/g, key => shield.restore(key).replace(/[^\r\n]/g, ' '));
    }
    function lexicalDiff(before, after, start = 0, newStart = 0) {
        const tokenize = s => s.match(/[\p{L}\p{N}_]+|[ \t]+|\r?\n|[^\p{L}\p{N}_\s]|\s/gu) || [];
        const a = tokenize(before), b = tokenize(after), width = b.length + 1;
        if ((a.length + 1) * width > 160000) {
            const oldLines = before.match(/[^\n]*(?:\n|$)/g).filter(Boolean), newLines = after.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
            if (oldLines.length > 1 && oldLines.length === newLines.length && oldLines.length <= 500 &&
                oldLines.every((line, i) => plainProse(line) === plainProse(newLines[i]))) {
                let oldOffset = start, newOffset = newStart; const changes = [];
                oldLines.forEach((line, i) => {
                    if (line !== newLines[i]) changes.push(...lexicalDiff(line, newLines[i], oldOffset, newOffset));
                    oldOffset += line.length; newOffset += newLines[i].length;
                });
                return changes;
            }
            return [{start, end: start + before.length, newStart, newEnd: newStart + after.length, before, after}];
        }
        const ao = [start], bo = [newStart];
        a.forEach(x => ao.push(ao.at(-1) + x.length)); b.forEach(x => bo.push(bo.at(-1) + x.length));
        const table = new Uint32Array((a.length + 1) * width);
        for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
            table[i * width + j] = a[i] === b[j] ? 1 + table[(i + 1) * width + j + 1] :
                Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
        const pairs = []; let i = 0, j = 0;
        while (i < a.length && j < b.length) {
            if (a[i] === b[j]) pairs.push([i++, j++]);
            else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++;
            else j++;
        }
        pairs.push([a.length, b.length]); i = 0; j = 0;
        const hunks = [];
        for (const [ai, bi] of pairs) {
            if (i !== ai || j !== bi) hunks.push({start: ao[i], end: ao[ai], newStart: bo[j], newEnd: bo[bi],
                before: a.slice(i, ai).join(''), after: b.slice(j, bi).join('')});
            i = ai + 1; j = bi + 1;
        }
        return hunks;
    }
    function reviewAtoms(source) {
        const s = protectedView(source), found = [];
        for (const n of templates(s).nodes) {
            const p = parsedTemplate(s.slice(n.start, n.end)); let start = n.start + 2;
            p.parts.forEach((part, i) => {
                found.push({start: i ? start - 1 : start, end: start + part.length,
                    label: i ? 'Campo ' + (part.match(/^\s*([^=]+)=/)?.[1].trim() || i) : 'Nome da predefinição'});
                start += part.length + 1;
            });
        }
        for (const m of s.matchAll(/\[\[[\s\S]*?\]\]|\[(?:https?:|\/\/)[^\]\n]*\]|^={1,6}[^\n]*={1,6}[ \t]*$/gm))
            found.push({start: m.index, end: m.index + m[0].length, label: m[0].startsWith('=') ? 'Título de seção' : 'Ligação'});
        for (let i = 0; i < s.length;) {
            const t = tagAt(s, i);
            if (t) { found.push({start: i, end: t.end, label: 'Etiqueta <' + t.name + '>'}); i = t.end; } else i++;
        }
        return found.sort((a, b) => a.end - a.start - (b.end - b.start));
    }
    function diffHunks(before, after) {
        if (before === after) return [];
        const coarse = lineDiffHunks(before, after), a = reviewAtoms(before), b = reviewAtoms(after);
        const lineBounds = (s, start, end) => {
            const from = s.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
            const next = s.indexOf('\n', Math.max(start, end - 1));
            return {start: from, end: next < 0 ? s.length : next + 1};
        };
        const edits = coarse.flatMap(h => {
            const old = lineBounds(before, h.start, h.end), current = lineBounds(after, h.newStart, h.newEnd);
            return lexicalDiff(before.slice(old.start, old.end), after.slice(current.start, current.end), old.start, current.start);
        });
        for (const h of edits) {
            const aa = a.find(x => h.start >= x.start && h.end <= x.end && h.start < x.end && h.end > x.start);
            const bb = b.find(x => h.newStart >= x.start && h.newEnd <= x.end && h.newStart < x.end && h.newEnd > x.start);
            // Um campo, nome ou etiqueta é uma escolha indivisível, incluindo espaços.
            if (aa && bb && aa.label === bb.label || aa && bb && aa.label.startsWith('Campo ') && bb.label.startsWith('Campo ')) {
                h.start = aa.start; h.end = aa.end; h.newStart = bb.start; h.newEnd = bb.end; h.unit = aa.label;
            }
        }
        const merged = [];
        for (const h of edits.sort((x, y) => x.start - y.start || x.newStart - y.newStart)) {
            const previous = merged.at(-1);
            if (previous && (h.start < previous.end || h.newStart < previous.newEnd ||
                h.start === previous.start && h.newStart === previous.newStart)) {
                previous.start = Math.min(previous.start, h.start); previous.end = Math.max(previous.end, h.end);
                previous.newStart = Math.min(previous.newStart, h.newStart); previous.newEnd = Math.max(previous.newEnd, h.newEnd);
            } else merged.push({...h});
        }
        for (const h of merged) { h.before = before.slice(h.start, h.end); h.after = after.slice(h.newStart, h.newEnd); }
        // Limite conservador para uma expansão de campos que cruze a ordem dos trechos.
        if (applyEdits(before, merged.map(h => ({start: h.start, end: h.end, text: h.after}))) !== after)
            return coarse.map(h => ({...h, unit: 'Trecho composto'}));
        return merged;
    }
    function referenceTransactions(before, after, hunks) {
        const sources = [protectedView(before), protectedView(after)];
        const [oldRefs, newRefs] = sources.map(source => {
            const renderers = rendererRanges(source);
            return refTokens(source).map(r => {
                const parent = renderers.find(x => x.start <= r.start && r.start < x.end);
                let inheritedGroup = '';
                if (parent) {
                    const raw = source.slice(parent.start, parent.end);
                    if (raw.startsWith('<')) inheritedGroup = attrsOf(tagAt(raw, 0).attrs)?.group || '';
                    else {
                        const fields = templateEntries(parsedTemplate(raw));
                        inheritedGroup = fields.find(e => ['group', 'grupo'].includes(norm(e.key)))?.value.trim() || '';
                    }
                }
                return {...r, inheritedGroup};
            });
        });
        const parent = hunks.map((_, i) => i), families = new Map();
        const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
        const touches = (start, end, r) => start < r.end && end > r.start || start === end && start > r.start && start < r.end;
        hunks.forEach((h, i) => {
            for (const [refs, start, end] of [[oldRefs, h.start, h.end], [newRefs, h.newStart, h.newEnd]])
                for (const r of refs.filter(r => touches(start, end, r))) {
                    const a = attrsOf(r.attrs); if (!a?.name) continue;
                    const key = JSON.stringify([a.group || r.inheritedGroup || '', a.name]);
                    if (families.has(key)) parent[find(i)] = find(families.get(key)); else families.set(key, i);
                }
        });
        // Inclui nomes de notas por predefinição e trata a renomeação numérica como uma família inteira.
        const [oldUses, newUses] = sources.map(referenceNameUses);
        hunks.forEach((h, i) => {
            for (const [uses, start, end] of [[oldUses, h.start, h.end], [newUses, h.newStart, h.newEnd]])
                for (const u of uses) {
                    if (!touches(start, end, {start: u.ownerStart, end: u.ownerEnd})) continue;
                    const value = decodedReferenceName(u.value), numeric = value.match(/^(?:ref-)?(\d+)(?:-\d+)?$/);
                    const keys = [JSON.stringify([u.group, value])];
                    if (numeric) keys.push('numeric-ref-family:' + numeric[1]);
                    for (const key of keys) {
                        if (families.has(key)) parent[find(i)] = find(families.get(key)); else families.set(key, i);
                    }
                }
        });
        const counts = new Map(); hunks.forEach((_, i) => counts.set(find(i), (counts.get(find(i)) || 0) + 1));
        hunks.forEach((h, i) => { h.transaction = 'transaction-' + find(i); h.dependent = counts.get(find(i)) > 1; });
        return hunks;
    }
    function syntaxAudit(source) {
        const s = protectedView(source), findings = [], stacks = {link: [], external: [], table: []}, tags = [];
        const issue = (code, message, start, end = start + 2) => findings.push({code, message, start, end, severity: 'warning'});
        const supported = new Set(['ref', 'references', 'div', 'span', 'small', 'sup', 'sub', 'b', 'i', 'em', 'strong', 'center', 's', 'del', 'ins', 'includeonly', 'noinclude', 'onlyinclude']);
        for (const t of templates(s).unclosed) issue('unclosed-template', 'Predefinição ou parâmetro sem fechamento.', t.start);
        for (let i = 0; i < s.length;) {
            const tag = tagAt(s, i);
            if (tag) {
                if (supported.has(tag.name) && !tag.self) {
                    if (!tag.close) tags.push({name: tag.name, start: i, end: tag.end});
                    else if (tags.at(-1)?.name === tag.name) tags.pop();
                    else issue('stray-tag', 'Fechamento </' + tag.name + '> sem abertura correspondente ou fora de ordem.', i, tag.end);
                }
                i = tag.end; continue;
            }
            const two = s.slice(i, i + 2);
            if (two === '[[') { stacks.link.push(i); i += 2; }
            else if (two === ']]' && stacks.link.length) { stacks.link.pop(); i += 2; }
            else if (two === ']]') { issue('stray-link-close', 'Colchetes de fechamento sem ligação interna aberta.', i); i += 2; }
            else if (s[i] === '[' && /^(?:https?:|\/\/)/i.test(s.slice(i + 1))) { stacks.external.push(i++); }
            else if (s[i] === ']' && stacks.external.length) { stacks.external.pop(); i++; }
            else if (two === '{|' && /(?:^|\n)[ \t]*$/.test(s.slice(Math.max(0, s.lastIndexOf('\n', i - 1)), i))) { stacks.table.push(i); i += 2; }
            else if (two === '|}' && /(?:^|\n)[ \t]*$/.test(s.slice(Math.max(0, s.lastIndexOf('\n', i - 1)), i))) {
                if (stacks.table.length) stacks.table.pop(); else issue('stray-table-close', 'Tabela fechada sem abertura correspondente.', i);
                i += 2;
            } else i++;
        }
        for (const start of stacks.link) issue('unclosed-link', 'Ligação interna sem os colchetes de fechamento.', start);
        for (const start of stacks.external) issue('unclosed-external', 'Ligação externa sem colchete de fechamento.', start);
        for (const start of stacks.table) issue('unclosed-table', 'Tabela sem fechamento |}.', start);
        for (const tag of tags) issue('unclosed-tag', 'Etiqueta <' + tag.name + '> sem fechamento.', tag.start, tag.end);
        return findings;
    }
    // Substitui plainProse, sem mudar preservationAudit/lostWords ou a página.
    // Extrai só campos visíveis de modelos de formatação documentados:
    // https://pt.wikipedia.org/wiki/Predefinição:Small/doc (Pequeno é redirect)
    // https://pt.wikipedia.org/wiki/Predefinição:Grande
    // https://pt.wikipedia.org/wiki/Predefinição:Nowrap/doc (nobr/nobreak)
    // https://pt.wikipedia.org/wiki/Predefinição:ISBN/doc
    // https://pt.wikipedia.org/wiki/Wikipédia:Acessibilidade#Outros_idiomas
    function preservationTemplateFields(parts) {
        const fields=new Map();let positional=1;
        for(const raw of parts.slice(1)){
            const assignment=raw.match(/^\s*([^={}<>\n]+?)\s*=([\s\S]*)$/);
            if(assignment)fields.set(norm(assignment[1]),assignment[2]);
            else fields.set(String(positional++),raw);
        }
        return fields;
    }
    function preservationFormattingText(raw) {
        const p=parsedTemplate(raw),fields=preservationTemplateFields(p.parts);
        if(['small','pequeno','grande','nowrap','nobr','nobreak'].includes(p.name))return fields.get('1')??'';
        if(p.name==='lang')return fields.get('2')??'';
        if(p.name==='séc'&&validRomanCentury(fields.get('1')||''))return 'século '+fields.get('1');
        if(p.name==='ac'&&/^(?:[1-9]\d{0,3}|[IVXLCDM]+)$/.test(fields.get('1')||''))return fields.get('1')+' a.C.';
        if(p.name==='isbn'){
            const values=Array.from({length:9},(_,i)=>fields.get(String(i+1))).filter(v=>v!==undefined&&v.trim());
            return values.length?'ISBN '+values.join(', '):'';
        }
        return null;
    }
    function preservationTemplates(source,depth=0) {
        if(depth>64)return ' ';
        return applyEdits(source,topNodes(source).map(node=>{
            const text=preservationFormattingText(source.slice(node.start,node.end));
            return {start:node.start,end:node.end,text:text===null?' ':preservationTemplates(text,depth+1)};
        }));
    }
    function preservationEntities(source) {
        // Uma passagem. &amp;lt; continua texto "&lt;", sem virar etiqueta.
        const named={amp:'&',AMP:'&',lt:'<',LT:'<',gt:'>',GT:'>',quot:'"',QUOT:'"',apos:"'",nbsp:' ',ensp:' ',emsp:' ',thinsp:' ',hairsp:' ',
            shy:'\u00ad',ndash:'–',mdash:'—',hellip:'…',bull:'•',middot:'·',copy:'©',reg:'®',trade:'™',euro:'€',pound:'£',cent:'¢',yen:'¥',
            lsquo:"'",rsquo:"'",ldquo:'"',rdquo:'"',laquo:'«',raquo:'»',
            Agrave:'À',Aacute:'Á',Acirc:'Â',Atilde:'Ã',Auml:'Ä',Aring:'Å',AElig:'Æ',Ccedil:'Ç',
            Egrave:'È',Eacute:'É',Ecirc:'Ê',Euml:'Ë',Igrave:'Ì',Iacute:'Í',Icirc:'Î',Iuml:'Ï',
            ETH:'Ð',Ntilde:'Ñ',Ograve:'Ò',Oacute:'Ó',Ocirc:'Ô',Otilde:'Õ',Ouml:'Ö',Oslash:'Ø',
            Ugrave:'Ù',Uacute:'Ú',Ucirc:'Û',Uuml:'Ü',Yacute:'Ý',THORN:'Þ',szlig:'ß',
            agrave:'à',aacute:'á',acirc:'â',atilde:'ã',auml:'ä',aring:'å',aelig:'æ',ccedil:'ç',
            egrave:'è',eacute:'é',ecirc:'ê',euml:'ë',igrave:'ì',iacute:'í',icirc:'î',iuml:'ï',
            eth:'ð',ntilde:'ñ',ograve:'ò',oacute:'ó',ocirc:'ô',otilde:'õ',ouml:'ö',oslash:'ø',
            ugrave:'ù',uacute:'ú',ucirc:'û',uuml:'ü',yacute:'ý',thorn:'þ',yuml:'ÿ'};
        return source.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][a-z\d]+);/gi,(raw,value)=>{
            if(value[0]!=='#')return Object.hasOwn(named,value)?named[value]:raw;
            const hex=/^#x/i.test(value),number=Number.parseInt(value.slice(hex?2:1),hex?16:10);
            return number>=1&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff)?String.fromCodePoint(number):'\ufffd';
        });
    }
    function preservationImageOption(value) {
        const text=value.trim(),key=norm(text),known=new Set(['thumb','thumbnail','miniatura','miniaturadaimagem','frame','framed','quadro','enquadrada','frameless',
            'sem moldura','semmoldura','border','borda','left','right','center','centre','none','esquerda','direita','centro','nenhum','baseline','sub','super','top','text-top','middle','bottom','text-bottom']);
        if(known.has(key)||/^(?:\d+(?:x\d+)?|x\d+)px$/i.test(text)||/^upright(?:\s*=.*)?$/i.test(text)||
            /^(?:link|ligação|ligacao|class|classe|lang|língua|lingua|thumb|miniatura|página|pagina|page|start|end|thumbtime)\s*=/i.test(text))return true;
        for(const [alias,rule] of Object.entries(TRANSLATION_RULES.imageOptions))for(const option of [alias,rule.target]){
            if(option.includes('$1')){const [prefix,suffix]=option.split('$1');if(text.startsWith(prefix)&&text.endsWith(suffix))return true;}
            else if(text===option)return true;
        }
        return false;
    }
    function preservationNamespace(target) {
        const namespace=target.match(/^\s*([^:\n]+):/),escaped=/^\s*:/.test(target);
        const aliases=namespace?Object.entries(TRANSLATION_RULES.namespaceAliases).find(([key])=>norm(key)===norm(namespace[1])):null;
        return {file:!escaped&&(aliases?.[1]==='Ficheiro'||!!namespace&&/^(?:Ficheiro|Arquivo|Imagem|File|Image|Fichier|Datei|Bild|Archivo)$/i.test(namespace[1])),
            category:!escaped&&(aliases?.[1]==='Categoria'||!!namespace&&/^(?:Categoria|Category|Catégorie|Kategorie|Categoría)$/i.test(namespace[1]))};
    }
    function preservationLinks(source,depth=0) {
        if(depth>64)return ' ';
        const edits=[],stack=[];
        for(let i=0;i<source.length-1;i++){
            if(source.slice(i,i+2)==='[['){
                const target=source.slice(i+2).match(/^[^|\]\r\n]*/)?.[0]||'',file=preservationNamespace(target).file;
                // Um link comum malformado não pode engolir todos os links das
                // linhas seguintes. Imagens mantêm a pilha de legenda multilinha.
                // Links comuns não contêm outros links comuns; recuperar este
                // caso mantém o fragmento malformado visível e lê o próximo.
                if(stack.length&&!stack.at(-1).file&&!file)stack.pop();
                stack.push({start:i,file,label:false});i++;
            }
            else if(source.slice(i,i+2)===']]'&&stack.length){
                const start=stack.pop().start,end=i+2;i++;
                if(stack.length)continue;
                const parts=splitParts(source.slice(start+2,end-2)),target=parts[0],{file,category}=preservationNamespace(target);
                let display;
                if(category)display=' ';
                else if(file){
                    const captions=[],alternatives=[];
                    for(const part of parts.slice(1)){
                        const alt=part.match(/^\s*(?:alt|alternativo|texto alternativo)\s*=([\s\S]*)$/i);
                        if(alt)alternatives.push(alt[1]);else if(!preservationImageOption(part)&&part.trim())captions.push(part);
                    }
                    // MediaWiki usa o último parâmetro de legenda sem nome.
                    display=' '+(captions.at(-1)||'')+' '+(alternatives.at(-1)||'')+' ';
                }else {display=parts.length>1?parts.at(-1):target;display=portugueseEquivalent(target,display)??display;}
                edits.push({start,end,text:preservationLinks(display,depth+1)});
            }
            else if(source[i]==='|'&&stack.length&&!stack.at(-1).file)stack.at(-1).label=true;
            else if((source[i]===']'||source[i]==='\n'&&!stack.at(-1)?.label)&&stack.length&&!stack.at(-1).file)stack.pop();
        }
        return applyEdits(source,edits);
    }
    function preservationTableRanges(source,analysis) {
        return analysis.spans.map(range=>{
            const table=analysis.tables.find(t=>t.start===range.start);
            if(!table?.closed)return range;
            // tableAnalysis inclui a linha final inteira. |}]] também fecha a
            // imagem que contém a tabela e seus ]] precisam continuar presentes.
            const raw=source.slice(range.start,range.end).replace(/\r?\n$/,''),lineStart=raw.lastIndexOf('\n')+1,marker=raw.slice(lineStart).match(/^[ \t]*\|}/);
            return marker?{start:range.start,end:range.start+lineStart+marker[0].length}:range;
        });
    }
    function preservationHTML(source) {
        let text='';
        for(let i=0;i<source.length;){
            const tag=tagAt(source,i);
            if(!tag){text+=source[i++];continue;}
            if(/^(?:br|hr|div|p|li|ul|ol|dl|dt|dd|table|tr|td|th|h[1-6]|section|figure|figcaption)$/.test(tag.name))text+=' ';
            i=tag.end;
        }
        return text;
    }
    function plainProse(source) {
        let s=protectedView(source);
        const excluded=refTokens(s).concat(preservationTableRanges(s,tableAnalysis(s)));
        s=applyEdits(s,outermostRanges(excluded).map(range=>({start:range.start,end:range.end,text:' '})));
        s=s.replace(/^={1,6}[^\n]*={1,6}[ \t]*$/gm,' ');
        s=preservationTemplates(s);
        s=preservationLinks(s);
        s=s.replace(/\[(?:https?:|\/\/)[^\s\]]+(?:\s+([^\]]*))?\]/g,(_,label)=>label||'');
        // Etiquetas de linha/bloco fazem fronteiras de palavras. Etiquetas
        // inline não inserem espaços que não existiriam no texto renderizado.
        s=preservationHTML(s);
        return preservationEntities(s.replace(/'{2,5}/g,'')).replace(/\bISBN-1[03](?=\s*:?\s*\d)/g,'ISBN');
    }
    function preservationStandaloneISBNs(source) {
        const s=protectedView(source),found=new Set(),add=value=>{
            const id=value.trim().replace(/[ \t\r\n-]/g,'').toUpperCase();
            if(/^(?:\d{9}[\dX]|\d{13})$/.test(id))found.add(id);
        };
        for(const node of templates(s).nodes){
            const p=parsedTemplate(s.slice(node.start,node.end));if(p.name!=='isbn')continue;
            const fields=preservationTemplateFields(p.parts);
            for(let i=1;i<=9;i++)if(fields.has(String(i)))add(fields.get(String(i)));
        }
        for(const match of s.matchAll(/\bISBN(?:-1[03])?\s*:?\s*((?:\d[ \t-]*){12}\d|(?:\d[ \t-]*){9}[\dXx])(?![\d-])/gi))add(match[1]);
        return [...found].sort();
    }
    // Integration: include this block in place of old plainProse; keep lostWords
    // and all existing URL/image/reference/protected-block guards unchanged.
    // In preservationAudit's identifiers(s), after creating found/view, insert:
    // for (const id of preservationStandaloneISBNs(s)) found.add('isbn=' + id);
    // Export preservationEntities, preservationStandaloneISBNs and plainProse
    // for tests. No replacement of actual page text occurs in these helpers.

    function lostWords(before, after) {
        const words = s => s.normalize('NFC').match(/[\p{L}\p{N}]+/gu) || [];
        const available = new Map(); words(after).forEach(x => available.set(x, (available.get(x) || 0) + 1));
        const missing = []; words(before).forEach(x => { const n = available.get(x) || 0; if (n) available.set(x, n - 1); else missing.push(x); });
        return missing;
    }
    function preservationAudit(before, after, options={}) {
        const findings = [], issue = (code, message, needle) => findings.push({code, message, start: needle ? after.indexOf(needle) : -1, severity: 'warning'});
        const endpoints = s => new Set((protectedView(s).match(/(?:https?:\/\/|\/\/)[^\s<>\]{}|"']+/g) || [])
            .filter(u => !/^(?:https?:)?\/\/(?:[a-z-]+\.)?(?:wikipedia\.org|pt\.m\.wikipedia\.org)\/wiki\//i.test(u)));
        const newURLs = endpoints(after);
        for (const url of endpoints(before)) if (!newURLs.has(url)) issue('lost-url', 'URL retirada pelo ajuste: ' + url + '.');
        const newImages = new Set(imageTargets(after).map(x => x.title));
        for (const image of imageTargets(before)) if (!newImages.has(image.title)) issue('lost-image', 'Arquivo retirado pelo ajuste: ' + image.title + '.');
        function identifiers(s) {
            const found = new Set(), view = protectedView(s);
            for(const id of preservationStandaloneISBNs(s))found.add('isbn='+id);
            for (const n of templates(view).nodes) for (const e of templateEntries(parsedTemplate(view.slice(n.start, n.end))))
                if (/^(?:doi|isbn|pmid|pmc|issn)$/i.test(e.key) && e.value.trim()) found.add(e.key.toLowerCase() + '=' + e.value.trim().replace(/^\{\{ISBN\|([^{}]+)\}\}$/i, '$1').replace(/[ \t-]/g, ''));
            for (const m of s.matchAll(/\b10\.\d{4,9}\/[A-Za-z0-9._;()/:+-]+/g)) found.add('doi=' + m[0]);
            return found;
        }
        const newIDs = identifiers(after);
        for (const id of identifiers(before)) if (!newIDs.has(id)) issue('lost-identifier', 'Identificador de publicação retirado pelo ajuste: ' + id + '.');
        const literalCounts=source=>{
            const shield=maskProtected(source,()=>{}),counts=new Map();
            for(const token of shield.text.matchAll(/\uE000AJGX*\d+\uE001/g)){
                const key=normalizeGallery(shield.restore(token[0]));counts.set(key,(counts.get(key)||0)+1);
            }return counts;
        };
        const literalsAfter=literalCounts(after);
        for(const [literal,n]of literalCounts(before))if((literalsAfter.get(literal)||0)<n)
            issue('lost-protected','Um exemplo, comentário ou bloco literal foi alterado pelo ajuste.');
        const repairProof=syntaxRepairSourceProof(before,after,options);
        if(repairProof.applied&&!repairProof.accepted)issue('lost-repaired-reference',repairProof.reason);
        const knownSyntax=text=>repairCenturySyntax(residueEquivalenceSource(syntaxRepairEquivalenceSource(text,pageContextOptions({...DEFAULTS,...options}))),{markup:true,namespaceNumber:0});
        const missing = lostWords(plainProse(knownSyntax(before)), plainProse(knownSyntax(after)));
        if (missing.length) issue('lost-prose', 'Conferir palavras retiradas do texto visível: ' + missing.slice(0, 16).join(', ') + (missing.length > 16 ? '...' : '.') + ' Mudanças de apresentação podem explicar o aviso.');
        return findings;
    }
    function renderedProse(html, domParser) {
        const doc = new domParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('script,style,.infobox,.navbox,.reference,.references,.reflist,.mw-editsection,.mw-heading,h1,h2,h3,h4,h5,h6,.toc,.metadata,.noprint,.mw-empty-elt').forEach(e => e.remove());
        return doc.body.textContent.replace(/\s+/g, ' ').trim();
    }
    function sectionRange(source, sections, index) {
        const numeric = String(index);
        if (!/^\d+$/.test(numeric)) throw new Error('A seção transcluída ou nova não pode ser reconstruída com segurança. Abra a edição da página inteira.');
        const bytes = new TextEncoder().encode(source), offset = n => {
            if (!Number.isInteger(n) || n < 0 || n > bytes.length) throw new Error('Posição de seção inválida retornada pela API.');
            return new TextDecoder('utf-8', {fatal: true}).decode(bytes.slice(0, n)).length;
        };
        const sectionOffset = section => {
            if (section.codepointOffset !== undefined) {
                const n = Number(section.codepointOffset), characters = Array.from(source);
                if (!Number.isInteger(n) || n < 0 || n > characters.length) throw new Error('Posição Unicode de seção inválida.');
                return characters.slice(0, n).join('').length;
            }
            return offset(Number(section.byteoffset));
        };
        const local = sections.filter(s => /^\d+$/.test(String(s.index)) && Number(s.codepointOffset ?? s.byteoffset) >= 0);
        for (const section of local) {
            const at = sectionOffset(section), level = Number(section.hLevel ?? section.level);
            if (!Number.isInteger(level) || level < 1 || level > 6 || (at !== 0 && source[at - 1] !== '\n') || !source.slice(at).startsWith('='.repeat(level)))
                throw new Error('A posição retornada não corresponde a um título de seção no código original.');
        }
        if (numeric === '0') return {start: 0, end: local.length ? sectionOffset(local[0]) : source.length};
        const position = local.findIndex(s => String(s.index) === numeric);
        if (position < 0) throw new Error('A seção não foi encontrada na revisão de origem.');
        const section = local[position], following = local.slice(position + 1).find(s => Number(s.hLevel ?? s.level) <= Number(section.hLevel ?? section.level));
        return {start: sectionOffset(section), end: following ? sectionOffset(following) : source.length};
    }
    function composeSection(source, sections, index, draft) {
        const range = sectionRange(source, sections, index);
        // Separar o título seguinte mesmo quando o editor retirar a última quebra de linha.
        const tail = source.slice(range.end), separator = tail && draft && !draft.endsWith('\n') ? '\n' : '';
        return {text: source.slice(0, range.start) + draft + separator + tail, start: range.start, end: range.start + draft.length};
    }

    function mappedPosition(pos, hunks, right) {
        let delta = 0;
        for (const h of hunks) {
            if (pos < h.start || pos === h.start && !right) break;
            if (pos <= h.end) return right ? h.newEnd : h.newStart;
            delta += h.after.length - h.before.length;
        }
        return pos + delta;
    }
    function* comparisonStages(before, result) {
        const trace = [];
        for (const step of result.trace || []) {
            trace.push({...step, edits: diffHunks(step.before, step.after)});
            yield 'Comparando os trechos alterados...';
        }
        return syntaxRepairTransactions(before,result.text,referenceTransactions(before, result.text, diffHunks(before, result.text).map((h, index) => {
            let start = h.start, end = h.end;
            const reasons = new Set();
            for (const step of trace) {
                const edits = step.edits;
                if (edits.some(e => e.start <= end && e.end >= start)) reasons.add(step.label);
                start = mappedPosition(start, edits, false); end = mappedPosition(end, edits, true);
            }
            return {...h, id: 'change-' + index, accepted: true,
                reasons: reasons.size ? [...reasons] : ['Ajustes de código']};
        })));
    }
    function comparison(before, result) {
        const steps = comparisonStages(before, result); let next;
        do { next = steps.next(); } while (!next.done);
        return next.value;
    }
    function composeChanges(before, hunks) {
        return applyEdits(before, hunks.filter(h => h.accepted).map(h => ({start: h.start, end: h.end, text: h.after})));
    }
    function utf8Length(text) {
        if(typeof root.TextEncoder==='function')return new root.TextEncoder().encode(text).length;
        let size=0;
        for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);
            if(c<128)size++;else if(c<2048)size+=2;
            else if(c>=0xD800&&c<=0xDBFF&&i+1<text.length&&text.charCodeAt(i+1)>=0xDC00&&text.charCodeAt(i+1)<=0xDFFF){size+=4;i++;}
            else size+=3;
        }
        return size;
    }
    function byteMetrics(before,after,hunks) {
        const original=utf8Length(before),result=utf8Length(after),edits=hunks||diffHunks(before,after);let added=0,removed=0;
        const high=c=>c>=0xD800&&c<=0xDBFF,low=c=>c>=0xDC00&&c<=0xDFFF;
        for(const edit of edits){const a=edit.before,b=edit.after;let prefix=0,suffix=0;
            while(prefix<a.length&&prefix<b.length&&a[prefix]===b[prefix])prefix++;
            if(prefix&&((high(a.charCodeAt(prefix-1))&&low(a.charCodeAt(prefix)))||(high(b.charCodeAt(prefix-1))&&low(b.charCodeAt(prefix)))))prefix--;
            while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
            if(suffix&&((low(a.charCodeAt(a.length-suffix))&&high(a.charCodeAt(a.length-suffix-1)))||(low(b.charCodeAt(b.length-suffix))&&high(b.charCodeAt(b.length-suffix-1)))))suffix--;
            removed+=utf8Length(a.slice(prefix,a.length-suffix));added+=utf8Length(b.slice(prefix,b.length-suffix));
        }
        return {before:original,after:result,delta:result-original,added,removed,changed:added+removed,hunks:edits.length,consistent:added-removed===result-original};
    }

    function mechanicalMinorResult(source,options={}) {
        const cfg={...DEFAULTS,...options}, noop=()=>{},shield=maskProtected(source,noop);let s=shield.text;
        s=mapTemplateTree(s,raw=>automaticParameters(raw,{...cfg,automaticParameterNames:false},noop));
        if(cfg.links)s=cleanLinks(s,noop);
        if(cfg.references){s=normalizeNumericReferenceNames(s,cfg,noop,noop);s=neutralAutomaticReferenceNames(s,cfg,noop);s=normalizeRefs(s,cfg,noop,noop);s=automaticIdenticalReferences(s,cfg,noop);}
        s=referenceColumns(s,cfg,noop);
        return shield.restore(s);
    }
    function minorEligibility(before,after,options={}) {
        const metrics=options.metrics||byteMetrics(before,after,options.hunks);
        const result={eligible:false,metrics,reason:''};
        if(before===after){result.reason='Nenhuma alteração.';return result;}
        if(options.namespaceNumber!==0||options.sectionOnly){result.reason='Marcação automática limitada à edição completa de artigos.';return result;}
        if(options.minorBaseConfirmed!==true){result.reason='O rascunho não foi confirmado como alteração exclusiva da revisão de origem.';return result;}
        if(!metrics.consistent||metrics.changed>500||metrics.hunks>5){result.reason='O diff ultrapassa o limite automático de 500 bytes alterados ou cinco trechos.';return result;}
        if(mechanicalMinorResult(before,options)!==after){result.reason='Há alterações fora dos ajustes mecânicos confirmados.';return result;}
        return {...result,eligible:true,reason:'Ajustes mecânicos confirmados, até 500 bytes alterados e cinco trechos.'};
    }

    function shortCitationAudit(source) {
        const s=protectedView(source), definitions=new Map(), calls=[], findings=[];
        function fields(p) {
            const result=Object.create(null);
            for (const e of foreignEntries(p)) {
                const key=/^\d+$/.test(e.key)?e.key:CITE_NAMES[p.name]?parameterFamily(e.key):e.key;
                if (result[key]!==undefined && result[key]!==e.value.trim()) return null;
                result[key]=e.value.trim();
            }
            return result;
        }
        const plain=value=>typeof value==='string' && value.trim() && !/[{}<>\[\]\uE000\n]/.test(value);
        const identity=value=>value.normalize('NFC').replace(/ /g,'_');
        function shortTarget(p,map) {
            const override=p.name==='harvnb'?map.Ref:map.ref ?? map.Ref;
            if (override==='none') return null;
            if (override) return plain(override)?identity(override):null;
            const pos=[];
            for(let i=1;i<=5;i++){if(map[String(i)]===undefined)break;pos.push(map[String(i)]);}
            if(pos.length<2 || !/^\d{4}[a-z]?$/i.test(pos.at(-1)) || !pos.every(plain))return null;
            return identity('CITEREF'+pos.join(''));
        }
        function definitionTarget(p,map) {
            if(map.ref==='none')return null;
            if(map.ref && map.ref!=='harv') {
                if(plain(map.ref))return identity(map.ref);
                const raw=map.ref.trim();
                if(/^\{\{[\s\S]*}}$/.test(raw)) {
                    const child=parsedTemplate(raw);
                    if(['harvid','sfnref','harvref'].includes(child.name)) {
                        const nested=fields(child);if(nested)return shortTarget(child,nested);
                    }
                }
                return null;
            }
            const year=map.ano || map.year || (()=>{
                const years=(map.data || map.date || '').match(/\b\d{4}[a-z]?\b/gi);
                return years?.length===1?years[0]:'';
            })();
            if(!/^\d{4}[a-z]?$/i.test(year))return null;
            const names=[];
            for(let i=1;i<=4;i++) {
                const suffix=i===1?'':String(i), name=map['último'+suffix] || (i===1?map['último1']:'') ||
                    map['autor'+suffix] || (i===1?map.autor1:'');
                if(!name)break;
                if(!plain(name))return null;
                names.push(name);
            }
            return names.length?identity('CITEREF'+names.join('')+year):null;
        }
        for(const n of templates(s).nodes) {
            const raw=s.slice(n.start,n.end),p=parsedTemplate(raw),map=fields(p);if(!map)continue;
            if(['harvnb','harv','harvtxt','sfnp','sfn'].includes(p.name)) {
                const target=shortTarget(p,map);if(target)calls.push({target,start:n.start,raw,name:p.parts[0].trim()});
            } else if(CITE_NAMES[p.name]) {
                const target=definitionTarget(p,map);if(!target)continue;
                if(!definitions.has(target))definitions.set(target,[]);
                definitions.get(target).push({start:n.start,title:map['título'] || map.title || '',raw});
            } else if(['anchor','âncora','ancora'].includes(p.name)) {
                for(const [key,value] of Object.entries(map)) if(/^\d+$/.test(key) && plain(value)) {
                    const target=identity(value);if(!definitions.has(target))definitions.set(target,[{start:n.start,title:'',raw}]);
                }
            } else if(['harvid','sfnref'].includes(p.name)) {
                // Estes modelos constroem identificadores; não são chamadas bibliográficas.
            }
        }
        for(const m of s.matchAll(/\bid\s*=\s*["']([^"'{}<>]+)["']/gi))
            if(!definitions.has(identity(m[1])))definitions.set(identity(m[1]),[{start:m.index,title:'',raw:m[0]}]);
        const seen=new Set();
        for(const call of calls) {
            if(seen.has(call.target))continue;seen.add(call.target);
            const targets=definitions.get(call.target);
            if(!targets)findings.push({code:'short-citation-unconfirmed',start:call.start,severity:'warning',
                message:'Citação abreviada sem destino local confirmado: '+call.raw+'. Confira a bibliografia e a pré-visualização; o destino pode vir de outra predefinição.'});
            else if(new Set(targets.map(t=>t.title).filter(Boolean)).size>1)findings.push({code:'short-citation-ambiguous',start:call.start,severity:'warning',
                message:'Citação abreviada com mais de uma obra para o mesmo identificador: '+call.raw+'. Confira o ano, os autores e o campo ref, sem trocar as fontes automaticamente.'});
        }
        return findings.slice(0,80);
    }

    function referenceAudit(source, options = {}) {
        const s = protectedView(source), refs = refTokens(s), findings = [], families = new Map();
        const renderers = rendererRanges(s), groups = new Set(), required = new Set();
        const issue = (code, message, start, severity = 'warning') => findings.push({code, message, start, severity});
        function fields(raw) {
            const p = parsedTemplate(raw), entries = templateEntries(p), map = {};
            entries.forEach(e => { map[norm(e.key)] = e.value.trim(); });
            return {p, map};
        }
        for (const r of renderers) {
            const raw = s.slice(r.start, r.end);
            if (raw.startsWith('<')) { const t = tagAt(raw, 0), attrs = attrsOf(t.attrs); if (attrs) groups.add(attrs.group || ''); }
            else {
                const {p, map} = fields(raw), group = map.grupo || map.group || '';
                if (['notas', 'notas e referências'].includes(p.name)) { groups.add(group || 'nota'); groups.add('lower-alpha');
                    if(p.name==='notas e referências'){groups.add('Nota');groups.add('nt');groups.add('');} }
                else if (['notelist', 'listanota'].includes(p.name)) groups.add(group || 'lower-alpha');
                else groups.add(group);
            }
        }
        for (const r of refs) {
            const a = attrsOf(r.attrs);
            if (!a) continue;
            let inheritedGroup = '';
            const parent = renderers.find(x => x.start <= r.start && r.start < x.end);
            if (parent) {
                const raw = s.slice(parent.start, parent.end);
                if (raw.startsWith('<')) inheritedGroup = attrsOf(tagAt(raw, 0).attrs)?.group || '';
                else { const {map} = fields(raw); inheritedGroup = map.grupo || map.group || ''; }
            }
            const group = a.group || inheritedGroup;
            if (!inRange(r.start, renderers)) required.add(group);
            if (!a.name || a.follow || a.details || /[{}\uE000]/.test(a.name + group)) continue;
            const key = JSON.stringify([group, a.name]);
            if (!families.has(key)) families.set(key, {name: a.name, group, definitions: [], calls: []});
            const f = families.get(key);
            if (r.body !== null && r.body.trim()) f.definitions.push(r);
            else f.calls.push(r);
        }
        // Chamadas de notas feitas por predefinições também contam como usos.
        for (const n of templates(s).nodes) {
            const {p, map} = fields(s.slice(n.start, n.end));
            if (['sfn', 'sfnm', 'harvref'].includes(p.name)) required.add(map.grupo || map.group || '');
            if (!['nre', 'efn', 'refn', '#tag:ref'].includes(p.name)) continue;
            const emission=p.name==='#tag:ref'?{group:map.group||'',name:map.name||''}:nativeNoteEmission(p);
            if(!emission||emission.ambiguous)continue;
            const group=emission.group;required.add(group);
            const name=emission.name;
            if (!name || map.follow || /[{}\uE000]/.test(name + group)) continue;
            const key = JSON.stringify([group, name]);
            if (!families.has(key)) families.set(key, {name, group, definitions: [], calls: []});
            const positional=Object.hasOwn(map,'1')?map['1']:p.parts.slice(1).find(x=>!/^\s*[^=]+?=/.test(x));
            const content=positional??(p.name==='refn'?map.refn:map.reference??map.content??map.text??map['referência']??map['conteúdo']??map.texto)??'';
            families.get(key)[content.trim() ? 'definitions' : 'calls'].push({start: n.start, body: content});
        }
        for(const u of rReferenceUses(s)){
            if(/[{}\uE000]/.test(u.value+u.group))continue;
            const name=decodedReferenceName(u.value),group=decodedReferenceName(u.group);required.add(group);
            const key=JSON.stringify([group,name]);
            if(!families.has(key))families.set(key,{name,group,definitions:[],calls:[]});
            families.get(key).calls.push({start:u.ownerStart,body:null});
        }
        for (const f of families.values()) {
            const suffix = f.group ? ', grupo ' + f.group : '';
            if (f.calls.length && !f.definitions.length) issue('missing-definition', 'Referência "' + f.name + '" sem definição' + suffix + '.', f.calls[0].start, 'error');
            if (new Set(f.definitions.map(r => r.body)).size > 1) issue('conflicting-definition', 'Definições diferentes para "' + f.name + '"' + suffix + '.', f.definitions[0].start, 'error');
            if (f.definitions.length && !f.calls.length && f.definitions.every(r => inRange(r.start, renderers)))
                issue('unused-definition', 'Definição "' + f.name + '" na lista sem chamada no texto' + suffix + '.', f.definitions[0].start);
        }
        for (const group of required) if (!groups.has(group)) issue('missing-renderer', 'Não foi encontrada uma lista para ' +
            (group ? 'o grupo "' + group + '"' : 'as referências comuns') + '. Confira a pré-visualização, a lista pode vir de outra predefinição.', 0);
        return findings.concat(numericReferenceAudit(source), options.shortCitationChecks === false ? [] : shortCitationAudit(source));
    }
    function safeComposition(before, after) {
        const syntaxProof=syntaxRepairSourceProof(before,after);
        if(syntaxProof.applied&&!syntaxProof.accepted)return syntaxProof.reason;
        const s = maskProtected(after, () => {}).text;
        const existingSyntax = new Set(syntaxAudit(before).map(f => f.code + ':' + f.message));
        const introducedSyntax = syntaxAudit(after).find(f => !existingSyntax.has(f.code + ':' + f.message));
        if (introducedSyntax) return introducedSyntax.message + ' A seleção deixaria código incompleto.';
        const existing = new Set(referenceAudit(before).filter(f => f.severity === 'error').map(f => f.code + f.message));
        const introduced = referenceAudit(after).find(f => f.severity === 'error' && !existing.has(f.code + f.message));
        return introduced ? introduced.message + ' Algumas alterações de referências precisam ser mantidas juntas.' : ''; 
    }
    function automaticParameters(raw,cfg,bump) {
        const p=parsedTemplate(raw), profile=INFOBOX_CATALOG[p.name]||TEMPLATE_CATALOG[p.name];
        if(!profile || (INFOBOX_CATALOG[p.name]?!cfg.infoboxes:CITE_NAMES[p.name]?!cfg.citations:!cfg.auxiliaryTemplates))return raw;
        const entries=foreignEntries(p), families=new Map();let changed=false;
        if(cfg.automaticParameterDuplicates)for(const e of entries)if(!e.positional && !/[{}<>\uE000\r\n]/.test(e.key)){
            if(!families.has(e.key))families.set(e.key,[]);families.get(e.key).push(e);
        }
        for(const family of families.values())if(family.length>1 && family.every(e=>e.value===family[0].value)){
            for(const e of family.slice(0,-1)){e.remove=true;changed=true;bump('parameterDuplicates');}
        }
        for(const e of entries){
            if(e.remove)continue;
            if(/^\d+$/.test(e.key)||/[{}<>\uE000\r\n]/.test(e.key))continue;
            if(profileAccepts(profile,e.key))continue;
            if(!profile.partial && cfg.automaticEmptyParameters && !e.value.trim()) {e.remove=true;changed=true;bump('emptyInvalidParameters');continue;}
            if(!profile.partial && cfg.automaticParameterNames) {
                const candidates=profileIndex(profile).normalized.get(norm(e.key))||[];
                if(candidates.length===1 && !entries.some(other=>other!==e && other.key===candidates[0])) {
                    e.key=candidates[0];changed=true;bump('automaticParameterNames');
                }
            }
        }
        return changed?translatedEntries(p,entries):raw;
    }
    function neutralAutomaticReferenceNames(source,cfg,bump) {
        if(!cfg.references||!cfg.neutralReferenceNames||cfg.sectionOnly)return source;
        const uses=referenceNameUses(source).slice();
        if(uses.some(u=>/[{}\uE000]/.test(u.value)))return source;
        const refs=refTokens(source);
        if(refs.some(r=>!attrsOf(r.attrs)&&/RevisaWiki-auto-\d+/.test(r.attrs)))return source;
        const defined=new Set();
        for(const r of refs){const a=attrsOf(r.attrs);if(a?.name&&r.body!==null)defined.add(decodedReferenceName(a.name));}
        for(const n of templates(source).nodes){const p=parsedTemplate(source.slice(n.start,n.end));
            if(['nre','refn','efn','#tag:ref'].includes(p.name))
                for(const e of templateEntries(p))if(['name','nome'].includes(e.key))defined.add(decodedReferenceName(e.value));
        }
        const reserved=new Set(uses.map(u=>decodedReferenceName(u.value))),mapping=new Map();
        for(const u of uses){const name=decodedReferenceName(u.value),m=name.match(/^RevisaWiki-auto-(\d+)$/);
            if(!m||!defined.has(name)||mapping.has(name))continue;
            let target='ref-auto-'+m[1],suffix=2;
            while(reserved.has(target))target='ref-auto-'+m[1]+'-'+suffix++;
            reserved.add(target);mapping.set(name,target);
        }
        if(!mapping.size)return source;
        const edits=uses.filter(u=>mapping.has(decodedReferenceName(u.value))).map(u=>
            ({start:u.start,end:u.end,text:mapping.get(decodedReferenceName(u.value))}));
        mapping.forEach(()=>bump('neutralReferenceNames'));
        return applyEdits(source,edits);
    }

    function automaticIdenticalReferences(source,cfg,bump) {
        if(!cfg.references||!cfg.automaticIdenticalReferences||cfg.sectionOnly)return source;
        const refs=refTokens(source), ranges=templates(source).nodes, renderers=rendererRanges(source), names=new Set(), families=new Map(), edits=[];
        // Nomes calculados não permitem garantir que o nome novo esteja livre.
        for(const r of refs){const attrs=attrsOf(r.attrs);if(!attrs)continue;
            if(/[{}\uE000]/.test((attrs.name||'')+(attrs.follow||'')))return source;
            if(attrs.name)names.add(attrs.name);if(attrs.follow)names.add(attrs.follow);
        }
        for(const n of templates(source).nodes){const p=parsedTemplate(source.slice(n.start,n.end));
            if(!['nre','refn','efn','sfn','sfnp','sfnm','sfnmp'].includes(p.name)&&!/^#tag\s*:\s*ref\b/.test(p.name))continue;
            for(const e of foreignEntries(p))if(['name','nome'].includes(norm(e.key))){if(/[{}\uE000]/.test(e.value))return source;names.add(e.value.trim());}
        }
        for(const r of refs){const attrs=attrsOf(r.attrs);
            if(!attrs||attrs.name||r.body===null||!r.body.trim()||Object.keys(attrs).some(k=>k!=='group')||/[{}<>\uE000&"\r\n]/.test(attrs.group||'')||
                /\uE000/.test(r.body)||inRange(r.start,ranges)||inRange(r.start,renderers))continue;
            if(templates(r.body).nodes.some(n=>['sfn','sfnp','sfnm','sfnmp','nre','refn','efn','notas','referências'].includes(parsedTemplate(r.body.slice(n.start,n.end)).name)))continue;
            const region=renderers.filter(n=>n.end<=r.start).length,key=JSON.stringify([attrs.group||'',region,r.body]);
            if(!families.has(key))families.set(key,[]);families.get(key).push({...r,attrs});
        }
        for(const u of referenceNameUses(source)){if(/[{}\uE000]/.test(u.value))return source;names.add(decodedReferenceName(u.value));}
        let counter=1;
        for(const family of families.values())if(family.length>1){
            let name;do{name='ref-auto-'+counter++;}while(names.has(name));names.add(name);
            const group=family[0].attrs.group?' group="'+family[0].attrs.group+'"':'';
            family.forEach((r,i)=>edits.push({start:r.start,end:r.end,text:'<ref name="'+name+'"'+group+(i?' />':'>'+r.body+'</ref>')}));
            bump('identicalReferences');
        }
        return applyEdits(source,edits);
    }

    function duplicateReferenceSuggestions(source) {
        const s = maskProtected(source, () => {}).text, ranges = templates(s).nodes, renderers = rendererRanges(s);
        const used = new Set(), families = new Map(), proposals = [];
        for (const r of refTokens(s)) {
            const a = attrsOf(r.attrs);
            if (a && a.name) used.add(a.name);
        }
        for (const n of templates(s).nodes) for (const e of templateEntries(parsedTemplate(s.slice(n.start, n.end))))
            if (['name', 'nome'].includes(norm(e.key))) used.add(e.value.trim());
        for (const r of refTokens(s)) {
            const a = attrsOf(r.attrs);
            if (!a || a.name || r.body === null || !r.body.trim() || Object.keys(a).some(k => k !== 'group') ||
                /[{}<>\uE000&"\r\n]/.test(a.group || '') || /\uE000/.test(r.body) || inRange(r.start, ranges) || inRange(r.start, renderers)) continue;
            // Listas intermediárias separam as famílias. O conteúdo precisa ser idêntico, incluindo páginas.
            const region = renderers.filter(x => x.end <= r.start).length;
            const key = JSON.stringify([a.group || '', region, r.body]);
            if (!families.has(key)) families.set(key, []);
            families.get(key).push({...r, a});
        }
        for(const u of referenceNameUses(s)){if(/[{}\uE000]/.test(u.value))return [];used.add(decodedReferenceName(u.value));}
        let counter = 1;
        for (const refs of families.values()) {
            if (refs.length < 2 || proposals.length >= 30) continue;
            let name; do { name = 'ref-auto-' + counter++; } while (used.has(name)); used.add(name);
            const start = refs[0].start, end = refs[refs.length - 1].end;
            const group = refs[0].a.group ? ' group="' + refs[0].a.group + '"' : '';
            const edits = refs.map((r, i) => ({start: r.start - start, end: r.end - start,
                text: '<ref name="' + name + '"' + group + (i ? ' />' : '>' + r.body + '</ref>')}));
            const before = s.slice(start, end);
            proposals.push({id: 'duplicate-' + proposals.length, start, end, before,
                label: 'Reutilizar ' + refs.length + ' referências idênticas' + (group ? ', grupo ' + refs[0].a.group : ''),
                choices: [{label: 'Nomear como ' + name + ' e reutilizar', after: applyEdits(before, edits)}]});
        }
        return proposals;
    }
    function auxiliaryParameters(raw, bump, warn) {
        const p = parsedTemplate(raw), profile = TEMPLATE_CATALOG[p.name];
        if (!profile || CITE_NAMES[p.name] || INFOBOX_CATALOG[p.name]) return raw;
        const entries = templateEntries(p);
        for (const e of entries) {
            if (profile.accepted.includes(e.key) || (profile.patterns || []).some(x => new RegExp(x).test(e.key))) continue;
            const target = profile.renames[e.key];
            if (target && profile.accepted.includes(target) && !entries.some(x => x !== e && x.key === target)) {
                e.key = target; bump('auxiliaryParameters');
            } else if (!profile.partial) warn('Parâmetro fora do catálogo de ' + p.parts[0].trim() + ': ' + e.key + '. Valor preservado.');
        }
        return entriesTemplate(p, entries);
    }
    function templateTargets(source) {
        const s = maskProtected(source, () => {}).text, found = new Map();
        for (const n of templates(s).nodes) {
            const p = parsedTemplate(s.slice(n.start, n.end)), raw = p.parts[0].trim();
            if (/^#(?:invoke|invocar)\s*:/i.test(raw)) {
                const module = raw.replace(/^#(?:invoke|invocar)\s*:\s*/i, '');
                if (module && !/[{}<>\uE000]/.test(module)) {const title='Módulo:'+module.replace(/^Módulo\s*:\s*/i, '');if(!found.has(title))found.set(title,{title,module:true});}
                continue;
            }
            if (!raw || /[{}\uE000]/.test(raw) || raw.startsWith('#') || /^(?:subst|safesubst|int|msg|msgnw|raw)\s*:/i.test(raw)) continue;
            if (MAGIC_WORDS.has(norm(raw.split(':')[0])) || /^(?:DEFAULTSORT|ORDENAÇÃO|DISPLAYTITLE|TÍTULOEXIBIDO)\s*:/i.test(raw)) continue;
            const explicit = raw.startsWith(':') ? raw.slice(1) : /^(?:Predefinição|Template)\s*:/i.test(raw) ? raw.replace(/^(?:Predefinição|Template)\s*:/i, 'Predefinição:') :
                /^(?:Usuário|Usuária|User|Wikipédia|Wikipedia|Módulo|Module)\s*:/i.test(raw) ? raw : 'Predefinição:' + raw;
            const title = explicit.replace(/_/g, ' '), profile = INFOBOX_CATALOG[p.name] || TEMPLATE_CATALOG[p.name];
            if (!found.has(title)) found.set(title, {title, template: true, profile});
            if (profile) for (const dep of profile.dependencies || [])
                if (!found.has(dep.title)) found.set(dep.title, {title: dep.title, dependency: true, oldid: dep.oldid});
        }
        return [...found.values()];
    }
    function fragmentTargets(source, currentTitle) {
        const s = maskProtected(source, () => {}).text, found = new Map(), re = /\[\[([^|\]\n]+)(?:\|[^\]\n]*)?\]\]/g;
        let m;
        while ((m = re.exec(s))) {
            const parts = m[1].trim().replace(/^:/, '').split('#');
            if (parts.length < 2 || !parts.slice(1).join('#') || /[{}<>\uE000]/.test(m[1])) continue;
            const title = parts[0].replace(/_/g, ' ').trim() || currentTitle;
            if (!title || /^(?:Especial|Special|Imagem|Image|File|Ficheiro|Arquivo)\s*:/i.test(title) || /^[a-z]{2,3}\s*:/i.test(title)) continue;
            const fragment = parts.slice(1).join('#');
            found.set(JSON.stringify([title, fragment]), {title, fragment});
        }
        return [...found.values()];
    }
    function imageTargets(source) {
        const s = maskProtected(source, () => {}).text, found = new Set();
        function add(value) {
            const v = value.trim().replace(/^(?:Imagem|Image|File|Ficheiro|Arquivo|Fichier|Datei|Bild|Archivo)\s*:/i, '').replace(/_/g, ' ');
            if (v && !/[{}<>\uE000\n\r|]/.test(v) && /\.(?:svg|png|jpe?g|gif|webp|tiff?|pdf|djvu|og[gv]|webm|mp[34]|wav|flac)$/i.test(v)) found.add('Ficheiro:' + v);
        }
        const re = /\[\[\s*(?:Imagem|Image|File|Ficheiro|Arquivo)\s*:\s*([^|\]\n]+)/gi; let m;
        while ((m = re.exec(s))) add(m[1]);
        for (const n of templates(s).nodes) for (const e of templateEntries(parsedTemplate(s.slice(n.start, n.end))))
            if (/^(?:imagem(?:[_ ](?:mapa\d*(?:_ponto)?|horizonte|bandeira|escudo|selo|brasão|assinatura))?|image|foto|capa|mapa|assinatura|logo|logotipo|emblema|bandeira|brasão)$/i.test(e.key)) add(e.value);
        // Galerias são protegidas contra alterações, mas seus nomes de arquivos podem ser consultados.
        const gallerySource = source.replace(/<!--[\s\S]*?-->|<(nowiki|pre|syntaxhighlight|source|code)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
        const galleries = gallerySource.matchAll(/<gallery\b[^>]*>([\s\S]*?)<\/gallery\s*>/gi);
        for (const g of galleries) for (const line of g[1].split('\n')) add(line.split('|')[0]);
        return [...found].map(title => ({title, image: true}));
    }
    function normalizeFragment(value) {
        let v = value;
        try { v = decodeURIComponent(v); } catch (_) { /* O nome permanece verificável como texto. */ }
        try { v = decodeURIComponent(v.replace(/\.([0-9A-Fa-f]{2})/g, '%$1')); } catch (_) { /* Âncora antiga incompleta. */ }
        return v.replace(/_/g, ' ').normalize('NFC');
    }
    function renderedAudit(html, warnings, domParser) {
        const findings = new Set();
        for (const w of warnings || []) findings.add(typeof w === 'string' ? w : w['*'] || w.html || JSON.stringify(w));
        const doc = new domParser().parseFromString(html, 'text/html');
        for (const e of doc.querySelectorAll('.preview-warning, .mw-warning, .mw-ext-cite-error, .cite-error, .error, .cs1-visible-error, .cs1-hidden-error, .scribunto-error'))
            if (e.textContent.trim()) findings.add(e.textContent.trim());
        const ids = new Set([...doc.querySelectorAll('[id]')].map(e => normalizeFragment(e.id)));
        for (const link of doc.querySelectorAll('a[href]')) {
            const href = link.getAttribute('href');
            const shortReference = link.closest('li[id^="cite_note-FOOTNOTE"] .reference-text');
            if (!href.startsWith('#CITEREF') && !(shortReference && href.startsWith('#') && !href.startsWith('#cite_'))) continue;
            if (!ids.has(normalizeFragment(href.slice(1)))) findings.add('Citação curta sem entrada bibliográfica: ' + link.textContent.trim() + ' (' + href.slice(1) + ').');
        }
        return {findings: [...findings], ids: [...ids]};
    }
    const PRESETS = ownDictionary({
        all: null,
        references: ['automaticIdenticalReferences','automaticParameterDuplicates','automaticParameterNames','automaticEmptyParameters','autoMinor','referenceColumns','shortCitationChecks','numericRefNames', 'citationRepairs', 'citations', 'dates', 'references', 'singleLineCitations', 'moveNamedRefs', 'authors', 'bareReferences', 'review', 'multilingual', 'unifiedNotesReferences','autoPreview','registryDoiCheck'],
        infoboxes: ['automaticParameterDuplicates','automaticParameterNames','automaticEmptyParameters','autoMinor','infoboxes', 'review', 'multilingual','autoPreview']
    });
    function presetOptions(name, overrides) {
        const cfg = {...DEFAULTS};
        if (PRESETS[name]) for (const key of Object.keys(DEFAULTS)) if (key !== 'autoSummary') cfg[key] = PRESETS[name].includes(key);
        return Object.assign(cfg, overrides || {});
    }

    function unpackTranslationData(data) {
        const cache=[];
        function read(index) {
            if(index in cache)return cache[index];
            const [kind,value]=data.records[index];
            if(kind===0 || kind===3)return cache[index]=value;
            if(kind===2)return cache[index]=value.map(read);
            const pairs=[];
            for(let i=0;i<value.length;i+=2)pairs.push([read(value[i]),read(value[i+1])]);
            return cache[index]=ownDictionary(Object.fromEntries(pairs));
        }
        return read(data.root);
    }

    const TRANSLATION_RULES = unpackTranslationData(root.RevisaWikiDataV2.packed.translations);
    for(const profile of Object.values(TRANSLATION_RULES.profiles)){profile.fields=TRANSLATION_RULES.fieldSets[profile.fieldSet];delete profile.fieldSet;}
    delete TRANSLATION_RULES.fieldSets;
    for(const rule of Object.values(TRANSLATION_RULES.magicAliases))MAGIC_WORDS.add(norm(rule.target.replace(/^#/, '').split(':')[0]));
    Object.assign(PARAMS, {"contribution": "capítulo", "contribution-url": "capítulourl", "entry": "capítulo", "entry-url": "capítulourl", "chapter-format": "formato-capitulo", "book-title": "título-livro", "periodical": "periódico", "city": "cidade", "month": "mês", "displayauthors": "numero-autores", "displayeditors": "numero-editores", "doi-broken-date": "doi-incorrecto", "doi-inactive-date": "doi-incorrecto", "call-sign": "indicativo", "callsign": "indicativo", "publicationplace": "local-publicação", "title-link": "titulolink", "section-url": "url-seção", "transcript-url": "transcriçãourl", "article": "capítulo", "article-url": "capítulourl", "contribution-format": "formato-capitulo", "entry-format": "formato-capitulo"});
    Object.assign(MONTHS, {
        janvier:1, janv:1, février:2, fevrier:2, fév:2, févr:2, fevr:2, mars:3, avril:4, avr:4,
        juin:6, juillet:7, juil:7, juill:7, août:8, aout:8, septembre:9, octobre:10, novembre:11, décembre:12, decembre:12, déc:12,
        januar:1, februar:2, märz:3, maerz:3, mär:3, april:4, juni:6, juli:7,
        august:8, september:9, oktober:10, okt:10, november:11, dezember:12
    });
    Object.assign(LANGUAGE_CODES, {anglais:'en', allemand:'de', espagnol:'es', portugais:'pt', italien:'it',
        englisch:'en', französisch:'fr', franzoesisch:'fr', spanisch:'es', portugiesisch:'pt',
        inglés:'en', frances:'fr', francés:'fr', alemán:'de', aleman:'de', portugués:'pt', portugues:'pt', castellano:'es'});
    const TRANSLATION_PREFIX = /^(?:predefinição|plantilla|sjabloon|skabelon|template|tiêu[ _]+bản|vorlage|bản[ _]+mẫu|malline|modèle|テンプレート|şablon|แม่แบบ|modele|format|шаблон|תבנית|قالب|mall|mal|תב|樣板|样板|模板|模|ш|t|ş|틀)\s*:\s*/iu;
    const AUTHORITY_PROPERTIES = ["P212", "P213", "P214", "P227", "P231", "P236", "P238", "P239", "P240", "P243", "P244", "P245", "P247", "P267", "P268", "P269", "P270", "P271", "P345", "P347", "P349", "P352", "P354", "P356", "P359", "P377", "P380", "P381", "P396", "P402", "P409", "P428", "P454", "P455", "P458", "P477", "P480", "P486", "P492", "P493", "P494", "P496", "P497", "P508", "P535", "P536", "P549", "P557", "P563", "P587", "P590", "P591", "P592", "P593", "P594", "P595", "P597", "P599", "P604", "P605", "P627", "P628", "P637", "P639", "P640", "P648", "P649", "P650", "P651", "P652", "P653", "P661", "P662", "P665", "P668", "P672", "P673", "P683", "P685", "P687", "P696", "P699", "P701", "P715", "P716", "P723", "P727", "P757", "P758", "P762", "P781", "P808", "P809", "P815", "P818", "P827", "P830", "P838", "P839", "P842", "P846", "P850", "P858", "P864", "P886", "P902", "P938", "P947", "P949", "P950", "P951", "P959", "P960", "P961", "P962", "P999", "P1003", "P1005", "P1006", "P1007", "P1014", "P1015", "P1017", "P1025", "P1044", "P1045", "P1047", "P1048", "P1051", "P1052", "P1053", "P1054", "P1055", "P1058", "P1070", "P1076", "P1084", "P1085", "P1143", "P1146", "P1153", "P1157", "P1182", "P1184", "P1207", "P1212", "P1213", "P1216", "P1217", "P1219", "P1220", "P1225", "P1232", "P1237", "P1239", "P1242", "P1248", "P1258", "P1260", "P1263", "P1265", "P1266", "P1267", "P1274", "P1278", "P1281", "P1284", "P1285", "P1294", "P1305", "P1309", "P1315", "P1320", "P1323", "P1331", "P1348", "P1362", "P1369", "P1385", "P1391", "P1392", "P1394", "P1396", "P1402", "P1409", "P1415", "P1417", "P1421", "P1440", "P1447", "P1459", "P1461", "P1463", "P1466", "P1467", "P1468", "P1469", "P1473", "P1474", "P1550", "P1554", "P1562", "P1566", "P1584", "P1585", "P1586", "P1600", "P1607", "P1608", "P1609", "P1624", "P1627", "P1644", "P1649", "P1663", "P1665", "P1667", "P1695", "P1700", "P1702", "P1711", "P1712", "P1714", "P1727", "P1728", "P1729", "P1730", "P1733", "P1739", "P1745", "P1746", "P1747", "P1748", "P1755", "P1772", "P1795", "P1802", "P1804", "P1806", "P1807", "P1816", "P1825", "P1832", "P1844", "P1866", "P1871", "P1874", "P1890", "P1895", "P1899", "P1931", "P1936", "P1938", "P1939", "P1953", "P1954", "P1955", "P1958", "P1960", "P1961", "P1967", "P1970", "P1982", "P1983", "P1984", "P1985", "P1992", "P1994", "P2000", "P2019", "P2025", "P2026", "P2030", "P2034", "P2036", "P2038", "P2040", "P2057", "P2064", "P2080", "P2089", "P2115", "P2153", "P2163", "P2192", "P2193", "P2195", "P2266", "P2276", "P2327", "P2338", "P2342", "P2369", "P2372", "P2373", "P2400", "P2409", "P2412", "P2413", "P2423", "P2424", "P2426", "P2427", "P2455", "P2456", "P2464", "P2465", "P2468", "P2469", "P2473", "P2481", "P2482", "P2491", "P2503", "P2508", "P2509", "P2530", "P2531", "P2533", "P2558", "P2566", "P2574", "P2601", "P2602", "P2603", "P2623", "P2624", "P2625", "P2626", "P2631", "P2638", "P2639", "P2640", "P2648", "P2657", "P2685", "P2687", "P2688", "P2694", "P2696", "P2703", "P2708", "P2725", "P2732", "P2733", "P2740", "P2741", "P2748", "P2749", "P2767", "P2768", "P2772", "P2773", "P2774", "P2775", "P2776", "P2777", "P2783", "P2799", "P2811", "P2816", "P2818", "P2824", "P2858", "P2864", "P2879", "P2892", "P2924", "P2926", "P2946", "P2951", "P2961", "P2966", "P2980", "P2985", "P3004", "P3010", "P3031", "P3043", "P3044", "P3045", "P3046", "P3048", "P3060", "P3064", "P3083", "P3099", "P3100", "P3101", "P3102", "P3105", "P3108", "P3109", "P3111", "P3112", "P3117", "P3121", "P3127", "P3131", "P3134", "P3138", "P3143", "P3151", "P3177", "P3184", "P3186", "P3203", "P3204", "P3208", "P3218", "P3240", "P3288", "P3293", "P3302", "P3305", "P3307", "P3309", "P3314", "P3315", "P3318", "P3322", "P3326", "P3345", "P3348", "P3351", "P3363", "P3365", "P3371", "P3372", "P3390", "P3405", "P3408", "P3421", "P3425", "P3427", "P3429", "P3430", "P3435", "P3436", "P3444", "P3483", "P3511", "P3515", "P3516", "P3519", "P3521", "P3522", "P3525", "P3532", "P3535", "P3536", "P3537", "P3538", "P3539", "P3541", "P3542", "P3544", "P3545", "P3546", "P3547", "P3554", "P3556", "P3557", "P3560", "P3561", "P3564", "P3567", "P3568", "P3571", "P3573", "P3574", "P3580", "P3581", "P3588", "P3591", "P3593", "P3594", "P3598", "P3601", "P3604", "P3606", "P3607", "P3609", "P3619", "P3646", "P3647", "P3651", "P3652", "P3655", "P3664", "P3665", "P3666", "P3670", "P3674", "P3684", "P3685", "P3686", "P3687", "P3691", "P3697", "P3703", "P3704", "P3720", "P3726", "P3747", "P3750", "P3758", "P3762", "P3763", "P3765", "P3766", "P3769", "P3770", "P3785", "P3786", "P3787", "P3788", "P3804", "P3808", "P3827", "P3841", "P3844", "P3845", "P3851", "P3857", "P3869", "P3877", "P3898", "P3927", "P3928", "P3930", "P3932", "P3940", "P3949", "P3959", "P3964", "P3965", "P3976", "P3987", "P3998", "P4005", "P4024", "P4025", "P4060", "P4076", "P4095", "P4098", "P4107", "P4110", "P4121", "P4122", "P4125", "P4129", "P4160", "P4161", "P4168", "P4170", "P4177", "P4194", "P4251", "P4256", "P4258", "P4262", "P4282", "P4283", "P4317", "P4340", "P4344", "P4351", "P4360", "P4372", "P4381", "P4384", "P4391", "P4393", "P4399", "P4400", "P4401", "P4423", "P4439", "P4440", "P4459", "P4466", "P4477", "P4479", "P4480", "P4481", "P4482", "P4483", "P4484", "P4485", "P4491", "P4505", "P4549", "P4558", "P4568", "P4587", "P4592", "P4593", "P4597", "P4598", "P4616", "P4619", "P4629", "P4630", "P4643", "P4659", "P4660", "P4664", "P4671", "P4676", "P4677", "P4678", "P4679", "P4694", "P4700", "P4705", "P4708", "P4710", "P4715", "P4721", "P4728", "P4731", "P4753", "P4758", "P4760", "P4762", "P4802", "P4807", "P4855", "P4868", "P4947", "P4986", "P5035", "P5036", "P5037", "P5055", "P5091", "P5094", "P5108", "P5148", "P5199", "P5216", "P5221", "P5257", "P5299", "P5331", "P5354", "P5473", "P5485", "P5491", "P5500", "P5525", "P5527", "P5528", "P5549", "P5562", "P5569", "P5601", "P5619", "P5620", "P5621", "P5622", "P5665", "P5691", "P5698", "P5731", "P5732", "P5739", "P5786", "P5791", "P5845", "P5846", "P5847", "P5848", "P5849", "P5860", "P5909", "P5945", "P5950", "P5954", "P5984", "P6004", "P6018", "P6033", "P6061", "P6069", "P6083", "P6092", "P6095", "P6127", "P6130", "P6145", "P6173", "P6175", "P6177", "P6181", "P6199", "P6204", "P6206", "P6211", "P6296", "P6298", "P6324", "P6329", "P6341", "P6373", "P6468", "P6490", "P6492", "P6493", "P6496", "P6506", "P6516", "P6539", "P6542", "P6555", "P6614", "P6630", "P6631", "P6667", "P6672", "P6673", "P6674", "P6690", "P6691", "P6692", "P6702", "P6704", "P6751", "P6777", "P6786", "P6822", "P6907", "P6916", "P6934", "P6937", "P7034", "P7214", "P7215", "P7222", "P7444", "P7472", "P7480", "P7593", "P7594", "P7595", "P7609", "P7678", "P7682", "P7745", "P7777", "P7865", "P7886", "P7893", "P7946", "P7950", "P7951", "P8114", "P8122", "P8123", "P8223", "P8425", "P8492", "P8514", "P8586", "P8602", "P8611", "P8619", "P8749", "P8750", "P8780", "P8795", "P8812", "P8813", "P8848", "P8849", "P8850", "P8851", "P8853", "P8871", "P8944", "P8947", "P8980", "P8982", "P9053", "P9063", "P9064", "P9081", "P9097", "P9112", "P9116", "P9117", "P9119", "P9141", "P9142", "P9147", "P9164", "P9178", "P9179", "P9247", "P9250", "P9251", "P9252", "P9253", "P9257", "P9272", "P9282", "P9287", "P9322", "P9337", "P9354", "P9369", "P9409", "P9412", "P9421", "P9442", "P9451", "P9452", "P9464", "P9504", "P9522", "P9534", "P9536", "P9612", "P9661", "P9678", "P9807", "P9836", "P9841", "P9851", "P9861", "P9871", "P9874", "P9918", "P9964", "P9984", "P10023", "P10069", "P10075", "P10076", "P10454"];
    const AUTHORITY_ARGUMENTS = ["365chess", "aag", "aar", "aat", "abl", "abok", "academianet", "acb", "acm-dl", "adorocinema", "aelg", "afdb", "afi", "afltables", "agorha", "ahl", "allathletics", "allcinema filme", "allcinema pessoa", "allmovie", "allmovieartist", "allmusic", "allmusicalbum", "allmusiccomposition", "allmusicsong", "allocinefilm", "allocineperson", "allocineseries", "amathus", "anais do museu paulista", "angelicum", "animeclick anime", "animeclick drama", "animeclick mangá", "animeclick personagem", "animeclick pessoa", "animeclick romance", "annanime", "anncompany", "annmanga", "annperson", "anvisa", "arca", "arincs", "arlhs", "arlima", "arquivoarq", "arxiv", "as", "asn", "assembleia da república", "atp", "aub", "australianfootball", "austriaobjektid", "autores.uy", "auñamendi", "balat", "baseballcube", "baseballref", "basketballhof", "basketballref", "bau", "bav", "bavarikon", "bbc", "bcin", "bcna", "bd gest autor", "bd gest série", "bdap", "bdcn", "bdcyl", "bdfutbol", "bdi-iaph", "belvedere", "berlinerkulturdenkmal", "bfi", "bfs", "bgcts", "bgm.tv personage", "bgm.tv pessoa", "bgm.tv tópico", "bibsys", "bibsys obra", "bic", "bidicam", "biner", "bitraga autor", "bitraga obra", "bivaldi", "bl sysnum", "blbnb", "bm", "bmt", "bna", "bnaed", "bncf", "bnchl", "bnd", "bne", "bnf", "bnm", "bnmm", "boe", "booking.com", "botanist", "boxofficemojofilm", "boxofficemojofranchise", "boxofficemojoperson", "boxofficemojostudio", "boxrec", "bpn", "bpv", "brapci", "brasiliana iconográfica", "bre", "bridgeman", "bss", "bva", "bvfe", "bvl", "bvmc", "bvmc local", "bvmc obra", "bvph autoridade", "bvph publicação", "cadw", "cairn", "calis", "camaradeputados", "cantic", "cartooning for peace", "catholichierarchy", "catholichierarchydioc", "cb", "cbdb", "ccbae", "cclv", "cdda", "cemdp", "censo-guía", "cerl", "cfdw", "cfhof", "chessgames", "chesstempo", "cinecartaz filme", "cinematreasures", "cinenacional.com filme", "cinenacional.com pessoa", "cinept filme", "cinept pessoa", "cineressourcesfilm", "cineressourcesperson", "cineuropa filme", "cineuropa pessoa", "cinii", "cinii artigo", "cinii livro", "ciência vitae", "cl", "cnb livro", "cnmlbh", "cnpj", "cnv", "cob", "cobis", "cobnp", "colapsar", "comicbookdb", "condephaat", "conor al", "conor bg", "conor ks", "conor sr", "cpc-pr", "cpcclm", "cpdl", "cpdoc", "cpe", "cpp-2010", "crepč instituição", "crepč pessoa", "crunchyroll", "ctbuh", "cths", "cut", "cyclingarchives", "cyclingquotientmen", "cyclingquotientwoen", "damit", "danskefilmfilm", "danskefilmperson", "danskefilmsfilm", "danskefilmstemmer.dk", "dare", "databasefootball", "databaseolympics", "dbe", "dblp", "dbnl", "dc comics personagem", "dc comics talento", "dcampb", "decs", "desaparecidos políticos", "deutsche synchronkartei film", "dfi filme", "dfi pessoa", "dhbb", "dhp", "dialnet", "dialnetbook", "dialnetrevista", "discogsartist", "discogslabel", "discogsmaster", "disney a to z", "disney+", "distrowatch", "dll autor", "dll obra", "docomomo", "dodis", "doi", "driverdb", "dsbe", "e-enlightment", "e-mec", "eaa", "ebaf", "ebid", "egaxa", "egliseinfo", "ehf", "eiga.com filme", "eiga.com pessoa", "elcat", "elfilm film id", "eliseuvisconti", "eliteprospects", "emlo local", "emlo pessoa", "emporis", "enciclopédia açoriana", "eparks", "epcr", "epguides", "epib", "era", "espnmlb", "espnnba", "espnnfl", "espnnhl", "ethnologue", "euc", "eufootballinfo", "eul", "eurohockey", "euroleague", "europeana", "eurotour", "ewrc", "faa", "fangraphs", "fapesp instituição", "fapesp pesquisador", "fast", "fbbid", "fccos", "fei", "fff autor", "fff personagem", "fiba", "fide", "fie", "fifa", "fig", "filmaffinity", "filmportal", "fina", "find a grave cemetery", "fis-al", "fis-cc", "fis-fs", "fis-jp", "fis-nk", "fis-sb", "fmddesigner", "fmdmagazine", "fmdmodel", "fna", "footballdatabase", "footofeminin", "foradejogo", "fornminnesregistret", "fortalezas.org", "foursquare", "fpf", "framalibre", "freebase", "from", "fussballdaten", "futsalplanet", "galicianaautor", "galicianaobra", "gallica", "gdc", "gea", "gec", "genius", "geonames", "glottolog", "gnd", "gnis", "gog", "googlemaps", "gov", "gpi", "gpn", "grave", "grid", "grucultura", "guardiana", "guida al fumetto italiano", "gutenberg", "gutenbergbook", "hall of light amiga", "hancinema drama", "hancinema filme", "hancinema pessoa", "handle", "happycow", "hathitrust", "hds", "hembne", "hgc", "hgl", "hispanianostra", "historic places", "hkcan", "hockeydb", "hockeyreference", "hotels.com", "howlongtobeat", "hpip", "humble bundle", "iaaf", "iafdf", "iafdm", "iaph", "iata", "ibdbperson", "ibdbshow", "ibdbvenue", "ibge", "icao", "iccu", "icul", "ifla", "ifvpf", "igc contínuo", "igc faixa", "igespar", "igpcv", "imdb", "immub artista", "immub álbum", "imo", "imslp", "inapp autor", "inapp obra", "inducks criador", "inducks editora", "inducks edição", "inducks história", "inducks minissérie", "inducks personagem", "inducks publicação", "ine", "inepac", "infopatrimônio", "inventário dos monumentos rj", "ipac", "ipbb", "iphae", "iphan", "isa", "isbn", "isfdb", "isfdbpub", "ishof", "isidore", "isni", "issn", "isu", "itaú cultural", "itf", "itsrugby", "itu", "japantour", "jcyl", "jmdb filme", "jmdb pessoa", "joconde", "jornal do vôlei", "journalisted", "jpl", "jstor", "jstortopic", "judoinside", "juwra", "k scholar", "kalliope-verbund", "kallías", "kanto", "kd", "khl", "kinenote filme", "kinenote pessoa", "kinopoisk film id", "klov", "kmdb documentário", "kmdb filme", "kmdb pessoa", "kulturminne", "kulturnav", "lac", "lambiek comiclopedia", "latindex", "lattes", "lccn", "legendsofhockey", "lei", "lequipe", "letterboxd", "lexml brasil", "librarything", "libreflix", "librised", "librivox", "linguasphere", "linguist", "lir", "littera", "loc jukebox", "louvre", "ltik", "lumiere", "lumieredirector", "léonore", "mai", "margs", "marvel criador", "marvel personagem", "mavise", "maviseauth", "mavisecompany", "mavisedemand", "media arts database", "mek", "memória globo", "memórias da ditadura", "merimee", "metacritic", "metrolyrics", "mg", "mgp", "mhn", "michelin restaurants", "michelin voyages", "mimo", "mlb", "mmsi", "mncars", "motogp", "mountainproject", "movie walker filme", "movie walker pessoa", "moviemeter movie id", "moviepilot.de film", "mtlighthouse", "mtport", "mube", "munzinger", "munzingersport", "museu da pessoa", "museu de memes", "museu nacional ufrj", "museusbr", "musica brasilis id compositor", "musica brasilis id partitura", "musopen", "mutopia", "nara", "nara-org", "nasa", "natura2000", "nba", "ncl", "ncs", "ndl", "ndl jpno", "ndl obra", "ndled", "netflix", "nfl", "nft", "ngc", "nhl", "nhle", "nkc", "nla", "nla pessoa", "nlb", "nlc", "nlg", "nli", "nli obra", "nlm", "nlnz", "nlp", "nlr", "nlw", "nlw catálogo", "nmbl", "nndb", "npca", "npf", "npg", "nrhp", "nssdc", "nszl", "nta", "nukat", "nupill autor", "nupill documento", "nuts", "obp", "oclc", "oclc obra", "odis", "odnb", "ofdb", "ol", "olimpbase", "omdb", "openaip", "opencorporates", "opencritic", "openmlol", "opr", "orcid", "orsay", "osm", "owgr", "pace", "památkový katalog", "pase", "patrimonioirao", "pcp", "pdhchbbna", "peakbagger", "peakfinder", "persée", "perséerevista", "pga", "pgc", "piac", "pinakothek", "placar uol eleições", "pleiades", "pli", "pma", "porcelana brasil", "portal da literatura", "prdl", "procyclingstats", "procyclingstats race", "profootballhof", "profootballreference", "projeto monumentos de são paulo", "projeto vercial", "pronomfile", "pronomsoftware", "psh", "ptbnp", "pusc", "qedu", "racingreference", "radzima.org", "rallye-info", "recreation.gov", "redalyc", "registo de transparência da ue", "rep", "rginstitution", "rgperson", "rid", "rijksmonument", "rkdartists", "rottentomatoes", "routard.com", "rrl", "rsl", "saam", "sabr", "saia", "sbn", "scholar", "scn", "scopus", "scoresway", "scrum", "search", "selibr", "share autor", "share obra", "share-vde", "sherdog", "sikart", "simbad", "sipa", "sipca", "sir", "skidb", "sl", "snac", "snbp", "snczi-e", "snczi-p", "snisb", "snk", "soccerbase", "soccerbasemanager", "soccerdonna", "soccerway", "sportsreference", "srcfb", "ssrn", "steam", "structurae", "sudoc", "sudoced", "summitpost", "svkkl", "swb", "swhpl", "swimrankings", "sycomore", "syriaca dicionário", "syriaca obra", "são paulo", "tabakalera", "tate", "tcm film id", "te papa", "tebeosfera", "tebeosfera personagem", "tennisarchives", "tennishof", "tepapa", "terras indígenas no brasil", "tgn", "theatricalia", "theatricaliaplace", "theatricaliaplay", "thenumbers", "theoi", "thesports.org", "tls", "tmdb", "topcmb", "touring club italiano", "treccani", "tripadvisor", "trismegistos", "tse", "tvcom", "tvguide", "tvguideperson", "uat", "ucacr", "ueb", "uefa", "ugspace", "uk pub history", "ulan", "uniprotjournal", "unz", "upsa", "urbs", "uscongress", "vgmdbalbum", "vgmdbartist", "vgmdborganization", "viaf", "vogripa", "wals", "walsfamily", "walsgenus", "wcf", "wd", "wdpa", "whc", "wikiaves", "wikidata", "wikimapia", "wikiparques", "wnba", "woeid", "womenwriters", "world of spectrum", "worldarchery", "worldcurlingtour", "worldsbk", "wsop", "wta", "wwdb", "wwfeco", "yelp", "árvore de interesse público", "óscar"];
    function importedTemplate(raw) {
        const name = norm(parsedTemplate(raw).parts[0]);
        const m = name.match(/^([^:]+):\s*(.*)$/);
        const prefix = m && TRANSLATION_RULES.templatePrefixes[norm(m[1])];
        const stem = prefix ? m[2] : name;
        const marked = TRANSLATION_RULES.diagnosticTemplates[stem];
        const foreignPrefix = prefix && !['template', 'predefinição'].includes(norm(m[1]));
        const infobox = /^(?:карточка|картка|bilgi kutusu|מידע|정보상자|基礎情報|hộp thông tin|กล่องข้อมูล|faktaruta|faktaboks|tietolaatikko|صندوق معلومات)(?:[ /:]|$)/iu.test(stem);
        const scriptName = !name.startsWith('#') && !MAGIC_WORDS.has(norm(name.split(':')[0])) &&
            /[\p{Script=Cyrillic}\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u.test(stem);
        const latinBox = /(?:^|[ /])(?:bilgi kutusu|faktaruta|faktaboks|tietolaatikko)$/.test(stem);
        return marked || foreignPrefix || infobox || scriptName || latinBox ? {language: marked?.language || prefix || 'outra língua', name} : null;
    }
    function stripImportedFilePrefix(value) {
        return value.replace(/^(\s*)([^:\n]+):\s*/, (all, spaces, prefix) =>
            Object.entries(TRANSLATION_RULES.namespaceAliases).some(([k, v]) => norm(k) === norm(prefix) && v === 'Ficheiro') ? spaces : all);
    }
    function magicTemplate(raw, cfg, bump) {
        if (!cfg.multilingual || !cfg.auxiliaryTemplates) return null;
        const p = parsedTemplate(raw), name = p.parts[0].trim();
        for (const [alias, rule] of Object.entries(TRANSLATION_RULES.magicAliases)) {
            if (rule.kind === 'redirect' || alias.startsWith('__')) continue;
            const effectiveAlias = rule.kind === 'defaultsort' ? alias.replace(/[:：]$/, '') + (alias.endsWith('：') ? '：' : ':') : alias;
            const left = rule.caseSensitive === false ? name.toLocaleLowerCase('pt') : name;
            const right = rule.caseSensitive === false ? effectiveAlias.toLocaleLowerCase('pt') : effectiveAlias;
            const prefix = /[:：]$/.test(effectiveAlias);
            if (prefix ? left.startsWith(right) : left === right) {
                let target = rule.target;
                if (prefix && !target.endsWith(':')) target += ':';
                p.parts[0] = target + name.slice(effectiveAlias.length);
                bump('translatedMagicwords');
                return {text: '{{' + p.parts.join('|') + '}}', handled: true, blocked: false};
            }
        }
        return null;
    }
    function internationalDiagnostics(source) {
        const view = protectedView(source), findings = [];
        for (const n of templates(view).nodes) {
            const raw = source.slice(n.start, n.end), p = parsedTemplate(raw), info = importedTemplate(raw);
            if (info && !translationProfile(raw) && !CITE_NAMES[p.name]) findings.push({code: 'foreign-unknown', start: n.start, end: n.end,
                message: 'Modelo importado de outra Wikipédia sem equivalência completa: ' + p.parts[0].trim() + '. O código e os valores foram preservados.'});
        }
        return findings;
    }
    // Reorder only a contiguous footer whose components can be classified.
    // Each raw template/category remains intact, including parameters and sort keys.
    const FOOTER_ROLES = Object.freeze({project: 0, stub: 10, navbox: 20, authority: 30, portal: 40, sort: 50, category: 60, interwiki: 70});
    const FOOTER_PROJECTS = new Set(['commons', 'commonscat', 'commons category', 'wikisource', 'wikiquote', 'wikicionário', 'wikivoyage', 'wikilivros', 'wikiversity', 'wikinews', 'wikidata', 'wikispécies', 'outros projetos']);
    const FOOTER_NAVBOXES = new Set(['navbox', 'caixa de navegação', 'navbox com colunas', 'navbox with columns', 'navboxes', 'navbox core', 'navegação', 'caixa de navegação2']);
    function authorityPresent(source) {
        return templates(protectedView(source)).nodes.some(n => {
            const p = parsedTemplate(source.slice(n.start, n.end)), profile = translationProfile(source.slice(n.start, n.end));
            return ['controle de autoridade', 'controlo de autoridade', 'authority control', 'taxonbar', 'medbar'].includes(p.name) || profile?.kind === 'authority';
        });
    }
    function footerRole(raw, profiles = {}) {
        if (/^\[\[\s*Categoria\s*:/i.test(raw)) return 'category';
        const language=raw.match(/^\[\[([a-z][a-z-]{1,14})\s*:[^\[\]\n]+\]\]$/i);
        if(language && (TRANSLATION_RULES.languages.includes(language[1].toLowerCase()) || Object.values(LANGUAGE_CODES).includes(language[1].toLowerCase())))return 'interwiki';
        const p = parsedTemplate(raw), name = p.name.replace(/^(?:predefinição|template)\s*:\s*/i, '');
        if (/^(?:defaultsort|ordenaçãopadrão|ordenacaopadrao|ordempadrão|ordempadrao|ordenação)\s*:/i.test(name)) return 'sort';
        if (['referências', 'referencias', 'reflist', 'references', 'notelist', 'notas', 'notas e referências', 'div col', 'div col fim', '-fim', 'inícioref', 'inicioref'].includes(name)) return 'boundary';
        if (['controle de autoridade', 'controlo de autoridade', 'authority control', 'taxonbar', 'medbar'].includes(name)) return 'authority';
        if (['portal', 'portal2', 'portal3'].includes(name)) return 'portal';
        const migrated=translationProfile(raw);
        if(['renderer','notesRenderer'].includes(migrated?.kind))return 'boundary';
        if(migrated?.kind==='authority')return 'authority';
        if (FOOTER_PROJECTS.has(name)) return 'project';
        if (name === 'esboço' || name === 'esboco' || /^esboço(?: de| sobre)?\s+/.test(name) || /(?:^|[- /])esboço$/.test(name)) return 'stub';
        if (FOOTER_NAVBOXES.has(name)) return 'navbox';
        return ['navbox', 'stub', 'project', 'authority', 'portal'].includes(profiles[name]) ? profiles[name] : null;
    }
    function footerTokens(source, profiles = {}) {
        const view = protectedView(source), contexts = structuralRanges(view), tokens = [];
        for (const n of topNodes(view)) {
            if (inRange(n.start, contexts.filter(r => r.start < n.start || r.end > n.end))) continue;
            const raw = source.slice(n.start, n.end);
            const line = source.lastIndexOf('\n', n.start - 1) + 1;
            const eol = source.indexOf('\n', n.end), end = eol < 0 ? source.length : eol;
            if (source.slice(line, n.start).trim() || source.slice(n.end, end).trim()) continue;
            tokens.push({...n, raw, role: footerRole(raw, profiles)});
        }
        const links = /\[\[(?:Categoria\s*:[^\[\]\n]*|[a-z][a-z-]{1,14}\s*:[^\[\]\n]+)\]\]/gi;
        for (const m of view.matchAll(links)) {
            if (inRange(m.index, contexts)) continue;
            const raw = source.slice(m.index, m.index + m[0].length);
            const role = footerRole(raw, profiles);
            if (role) tokens.push({start: m.index, end: m.index + m[0].length, raw, role});
        }
        tokens.sort((a, b) => a.start - b.start);
        let cursor = source.length, selected = [];
        for (let i = tokens.length - 1; i >= 0; i--) {
            const t = tokens[i];
            if (t.role === 'boundary') break;
            if (t.end > cursor) continue;
            if (source.slice(t.end, cursor).trim()) break;
            const line = source.lastIndexOf('\n', t.start - 1) + 1;
            const before = source.slice(line, t.start);
            // Multiple adjacent categories can share a line. Other prose cannot.
            if (before.trim() && !/^(?:\s*\[\[Categoria\s*:[^\[\]\n]*\]\]\s*)+$/i.test(before)) break;
            selected.unshift(t); cursor = t.start;
        }
        return {start: selected.length ? selected[0].start : source.length, end: source.length, tokens: selected};
    }
    function footerCandidates(source) {
        return [...new Set(footerTokens(source).tokens.filter(t => !t.role).map(t =>
            parsedTemplate(t.raw).parts[0].trim().replace(/^(?:Predefinição|Template)\s*:\s*/i, '')).filter(x => x && !/[{}<>#:\uE000]/.test(x)))].slice(0, 40);
    }
    function classifyFooterTemplate(code) {
        const view = protectedView(code.replace(/<noinclude\b[^>]*>[\s\S]*?<\/noinclude\s*>/gi, m => m.replace(/[^\r\n]/g, ' ')));
        const names = templates(view).nodes.map(n => parsedTemplate(view.slice(n.start, n.end)).name);
        if (names.some(n => FOOTER_NAVBOXES.has(n)) || /\{\{\s*#invoke\s*:\s*Navbox\b/i.test(view)) return 'navbox';
        if (names.some(n => n === 'esboço' || n === 'esboco')) return 'stub';
        return null;
    }
    function authorityIdentifierURL(value) {
        if (typeof value !== 'string' || !/^(?:https?:)?\/\//i.test(value.trim())) return null;
        try {
            const url = new URL(value.trim().startsWith('//') ? 'https:' + value.trim() : value.trim());
            if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
            const host = url.hostname.toLowerCase();
            if (['wikipedia.org', 'wikidata.org', 'wikimedia.org', 'mediawiki.org', 'wikisource.org',
                'wikiquote.org', 'wiktionary.org', 'wikibooks.org', 'wikinews.org', 'wikiversity.org', 'wikivoyage.org']
                .some(domain => host === domain || host.endsWith('.' + domain))) return null;
            return value.trim();
        } catch (_) { return null; }
    }
    function authorityRenderConfirmation(response, context = {}) {
        const parsed = response?.parse;
        if (!parsed || response.error || typeof parsed.text !== 'string' || parsed.text.length > 2000000 ||
            !/^Q[1-9]\d*$/.test(context.entityId || '') || context.namespace !== 0 || context.fullPage !== true ||
            typeof context.title !== 'string' || !context.title.trim() || typeof parsed.title !== 'string' ||
            norm(parsed.title) !== norm(context.title) ||
            parsed.properties?.wikibase_item !== context.entityId ||
            (parsed.parsewarnings !== undefined && (!Array.isArray(parsed.parsewarnings) || parsed.parsewarnings.length))) return null;
        // O HTML vem de uma pré-visualização isolada da chamada, sem corpo do artigo.
        // Confirma o seletor .navbox-list .uid a[href], excluindo menus e ligações de ajuda.
        const html = parsed.text.replace(/<!--[\s\S]*?-->/g, ''), lower = html.toLowerCase(), stack = [], identifiers = [];
        const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
        for (let i = 0; i < html.length;) {
            const start = html.indexOf('<', i);
            if (start < 0) break;
            const tag = tagAt(html, start);
            if (!tag) { i = start + 1; continue; }
            i = tag.end;
            if (tag.close) {
                let found = stack.length - 1;
                while (found >= 0 && stack[found].name !== tag.name) found--;
                if (found >= 0) stack.length = found;
                continue;
            }
            const attrs = attrsOf(tag.attrs), classes = new Set((attrs?.class || '').split(/\s+/));
            if ([...classes].some(c => /^(?:error|errorbox|scribunto-error|mw-ext-cite-error|cite-error|cs1-(?:visible|hidden)-error|mw-warning|mw-parser-warning)$/.test(c))) return null;
            const parent = stack.at(-1) || {}, blocked = parent.blocked || !attrs ||
                classes.has('navbar') || classes.has('navbox-group') || classes.has('navbox-title') ||
                attrs['aria-hidden'] === 'true' || /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden)\b/i.test(attrs.style || '');
            const node = {name: tag.name, inList: parent.inList || classes.has('navbox-list'),
                inUid: parent.inUid || classes.has('uid'), blocked};
            if (tag.name === 'a' && node.inList && node.inUid && !node.blocked) {
                const href = authorityIdentifierURL(attrs.href), end = lower.indexOf('</a', tag.end);
                const text = end >= 0 ? html.slice(tag.end, end).replace(/<[^>]*>/g, '')
                    .replace(/&(?:nbsp|#0*(?:32|160)|#x0*(?:20|a0));/gi, ' ').trim() : '';
                if (href && text && !classes.has('new') && !identifiers.includes(href)) identifiers.push(href);
            }
            if (!tag.self && !voidTags.has(tag.name)) stack.push(node);
        }
        return identifiers.length ? {method: 'ptwiki-parse', entityId: context.entityId,
            title: context.title, identifiers: identifiers.slice(0, 20)} : null;
    }
    function authorityDisplayConfirmed(data) {
        const proof = data?.displayConfirmation;
        return !!(proof && proof.method === 'ptwiki-parse' && proof.entityId === data.entityId &&
            typeof proof.title === 'string' && typeof data.title === 'string' && norm(proof.title) === norm(data.title) &&
            Array.isArray(proof.identifiers) && proof.identifiers.some(authorityIdentifierURL));
    }
    function authorityEligibility(entity, context = {}) {
        if (!entity || entity.missing !== undefined || !/^Q[1-9]\d*$/.test(entity.id || '') || entity.id !== context.entityId ||
            context.namespace !== 0 || context.fullPage !== true || context.redirect || context.disambiguation ||
            typeof context.title !== 'string' || norm(entity.sitelinks?.ptwiki?.title || '') !== norm(context.title)) return null;
        const claims = entity.claims || {}, supported = [];
        for (const property of AUTHORITY_PROPERTIES) if (Array.isArray(claims[property]) && claims[property].some(s =>
            s.rank !== 'deprecated' && s.mainsnak?.snaktype === 'value' &&
            typeof s.mainsnak?.datavalue?.value === 'string' && s.mainsnak.datavalue.value.trim())) supported.push(property);
        return supported.length ? {entityId: entity.id, title: context.title, namespace: 0, fullPage: true,
            matched: true, properties: supported} : null;
    }
    function addAuthorityControl(source, cfg, bump, warn) {
        const data = cfg.authorityData;
        if (!cfg.authorityControl || cfg.sectionOnly || authorityPresent(source) || !data || data.namespace !== 0 ||
            data.fullPage !== true || data.matched !== true || !/^Q[1-9]\d*$/.test(data.entityId || '') ||
            !Array.isArray(data.properties) || !data.properties.some(p => AUTHORITY_PROPERTIES.includes(p)) ||
            !authorityDisplayConfirmed(data) || cfg.pageRedirect || cfg.pageDisambiguation ||
            (cfg.namespaceNumber !== undefined && cfg.namespaceNumber !== 0) ||
            (typeof cfg.pageTitle === 'string' && norm(cfg.pageTitle) !== norm(data.title))) return source;
        if (/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(protectedView(source)) ||
            templates(protectedView(source)).nodes.some(n => /^(?:desambig(?:uação)?|disambig|desambiguar)$/.test(parsedTemplate(source.slice(n.start, n.end)).name))) return source;
        const footer = footerTokens(source, cfg.footerProfiles), unknown = footer.tokens.find(t => !t.role);
        if (unknown) { warn('Controle de autoridade disponível, mas o bloco final contém uma predefinição sem função confirmada. Confira a posição antes de acrescentá-lo.'); return source; }
        if (footer.tokens.some(t => /<\s*ref\b/i.test(t.raw))) return source;
        const anchor = footer.tokens.find(t => FOOTER_ROLES[t.role] > FOOTER_ROLES.authority);
        const at = anchor ? anchor.start : source.trimEnd().length;
        bump('authorityControl');
        return source.slice(0, at).replace(/\n*$/, '\n\n') + '{{Controle de autoridade}}\n' +
            (at < source.length ? source.slice(at) : '');
    }
    function orderFooter(source, cfg, bump, warn) {
        if (!cfg.endTemplateOrder || cfg.sectionOnly) return source;
        const footer = footerTokens(source, cfg.footerProfiles), items = footer.tokens;
        if (items.length < 2) return source;
        if (items.some(t => !t.role)) { warn('Bloco final com predefinição sem função confirmada. A ordem foi preservada. Use a conferência de destinos ou reveja o bloco.'); return source; }
        if (items.filter(t => t.role === 'sort').length > 1) { warn('Mais de uma chave DEFAULTSORT no bloco final. A ordem foi preservada para não alterar as chaves das categorias.'); return source; }
        if (items.some(t => /<\s*ref\b/i.test(t.raw))) { warn('Predefinição final com referências preservada na posição original.'); return source; }
        const ordered = items.slice().sort((a, b) => FOOTER_ROLES[a.role] - FOOTER_ROLES[b.role] || a.start - b.start);
        if (ordered.every((t, i) => t === items[i])) return source;
        const pieces = [];
        for (let i = 0; i < ordered.length; i++) {
            if (i) pieces.push(ordered[i].role === 'stub' && ordered[i - 1].role !== 'stub' ? '\n\n\n' : '\n');
            pieces.push(ordered[i].raw);
        }
        bump('endTemplateOrder');
        return source.slice(0, footer.start) + pieces.join('') + (/\n$/.test(source) ? '\n' : '');
    }
    function orderEndSections(source, cfg, bump, warn) {
        if (!cfg.endSectionOrder || cfg.sectionOnly) return source;
        const footer = footerTokens(source, cfg.footerProfiles), body = source.slice(0, footer.start);
        const view = protectedView(body), ranges = structuralRanges(view), points = [];
        const recognised = new Set(['ver também', 'notas', 'referências', 'referencias', 'notas e referências', 'bibliografia', 'leitura complementar', 'leitura adicional', 'ligações externas']);
        let lastOther = -1;
        for (const m of view.matchAll(/^==[ \t]*([^=\n]+?)[ \t]*==[ \t]*$/gm)) {
            if (inRange(m.index, ranges)) continue;
            const title = norm(m[1]);
            if (!recognised.has(title)) lastOther = m.index;
            else points.push({start: m.index, title});
        }
        for (const n of topNodes(view)) {
            const raw = body.slice(n.start, n.end), p = parsedTemplate(raw);
            if (!['referências', 'referencias', 'notas', 'notas e referências'].includes(p.name)) continue;
            if (inRange(n.start, ranges.filter(r => r.start < n.start || r.end > n.end))) continue;
            const start = body.lastIndexOf('\n', n.start - 1) + 1, eol = body.indexOf('\n', n.end);
            if (body.slice(start, n.start).trim() || body.slice(n.end, eol < 0 ? body.length : eol).trim()) continue;
            const group = foreignEntries(p).find(e => ['grupo', 'group'].includes(norm(e.key)))?.value.trim();
            points.push({start: n.start, title: p.name === 'notas' || group ? 'notas' : p.name});
        }
        points.sort((a, b) => a.start - b.start);
        const eligible = points.filter(p => p.start > lastOther), blocks = [];
        for (const p of eligible) {
            const previous = blocks[blocks.length - 1];
            // A heading followed by its renderer belongs to a single section.
            if (previous && ['referências', 'referencias', 'notas', 'notas e referências'].includes(previous.title) &&
                previous.title === p.title && /^==/.test(body.slice(previous.start)) && !/^==/.test(body.slice(p.start))) continue;
            blocks.push({...p});
        }
        if (blocks.length < 2) return source;
        const kinds = b => ['referencias', 'referências', 'notas e referências'].includes(b.title) ? 'referências' :
            ['leitura adicional', 'leitura complementar'].includes(b.title) ? 'leitura complementar' : b.title;
        const counts = new Map();
        for (const b of blocks) counts.set(kinds(b), (counts.get(kinds(b)) || 0) + 1);
        if ([...counts.values()].some(n => n > 1)) { warn('Seções finais repetidas ou grupos de notas separados. A ordem foi preservada para revisão.'); return source; }
        const see = blocks.findIndex(b => b.title === 'ver também'), ref = blocks.findIndex(b => kinds(b) === 'referências');
        const seeFirst = see >= 0 && (ref < 0 || see < ref);
        const ranks = {'ver também': seeFirst ? 0 : 25, notas: 10, referências: 20, bibliografia: 30, 'leitura complementar': 40, 'ligações externas': 50};
        blocks.forEach((b, i) => {b.end = i + 1 < blocks.length ? blocks[i + 1].start : body.length; b.raw = body.slice(b.start, b.end);});
        const sorted = blocks.slice().sort((a, b) => ranks[kinds(a)] - ranks[kinds(b)] || a.start - b.start);
        if (sorted.every((b, i) => b === blocks[i])) return source;
        // Never relocate text across tables, incomplete HTML containers or protected comments.
        const segment = body.slice(blocks[0].start);
        if (segment.includes('\uE000') || /<\/?(?:div|section|table)\b/i.test(segment)) { warn('Seções finais com blocos especiais preservadas para revisão manual.'); return source; }
        bump('endSectionOrder');
        return body.slice(0, blocks[0].start) + sorted.map(b => b.raw.trimEnd()).join('\n\n') +
            (footer.start < source.length ? '\n\n' + source.slice(footer.start) : /\n$/.test(source) ? '\n' : '');
    }
    // Only a principal, standalone person infobox can identify a biography.
    // The musical infobox is shared with bands and needs an explicit solo type.
    const BIOGRAPHY_INFOBOXES = new Set([
        'info/biografia', 'info/ator', 'info/atriz', 'info/actor', 'info/político',
        'info/cientista', 'info/escritor', 'info/autor', 'info/artista', 'info/artista plástico',
        'info/artista de histórias em quadrinhos', 'info/filósofo', 'info/arquiteto',
        'info/astronauta', 'info/modelo', 'info/comediante', 'info/dublador',
        'info/revolucionário', 'info/criminoso', 'info/militar', 'info/nobre', 'info/monarca',
        'info/papa', 'info/clero', 'info/prelado da igreja católica', 'info/bispo da igreja católica',
        'info/sacerdote', 'info/teólogo cristão', 'info/tenista', 'info/beisebolista',
        'info/ciclista', 'info/artista marcial', 'info/futebolista', 'info/treinador de futebol',
        'info/treinador', 'info/esporte/atleta', 'info/atleta', 'info/enxadrista', 'info/xadrezista',
        'info/personalidade de mídia social', 'info/youtuber', 'info/ator pornográfico'
    ]);
    for(const name of ["info/artista marcial","info/atleta","info/boxeador","info/ciclista","info/esgrimista","info/esporte/atleta","info/golfista","info/jogador de basquete","info/jogador de rugby","info/jogador de voleibol","info/motociclista","info/nadador","info/piloto de automóvel","info/piloto de corrida","info/piloto do wrc","info/surfista","info/treinador de basquete","info/treinador de basquetebol","info/treinador de natação","info/triatleta","info/voleibol/jogador"])BIOGRAPHY_INFOBOXES.add(name);
    const BIOGRAPHY_MUSIC_BOXES = new Set(['info/música/artista', 'info/artista musical', 'info/cantor']);
    const BIOGRAPHY_SOLO_TYPES = new Set(['cantor solo', 'instrumentista sem vocal', 'pessoa sem performances']);
    function biographyNodes(source) {
        const view = protectedView(source), ranges = structuralRanges(view).slice(), stack = [];
        // An infobox illustrated in an HTML table or embedded container is not
        // sufficient to identify the subject of the whole article.
        for (const m of view.matchAll(/<\/?(?:table|div|section)\b/gi)) {
            const tag = tagAt(view, m.index);
            if (!tag || tag.self) continue;
            if (!tag.close) stack.push({name: tag.name, start: m.index});
            else {
                const index = stack.map(t => t.name).lastIndexOf(tag.name);
                if (index >= 0) {
                    const open = stack[index]; stack.splice(index);
                    ranges.push({start: open.start, end: tag.end});
                }
            }
        }
        stack.forEach(open => ranges.push({start: open.start, end: view.length}));
        return {view, nodes: topNodes(view).filter(n =>
            !inRange(n.start, ranges.filter(r => r.start < n.start || r.end > n.end)))};
    }
    function biographyDetection(source, cfg = {}) {
        if (cfg.namespaceNumber !== 0 || cfg.sectionOnly || cfg.pageRedirect || cfg.pageDisambiguation ||
            /^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle || ''))) return null;
        const {view, nodes: exposed} = biographyNodes(source);
        if (/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(view)) return null;
        const name = n => parsedTemplate(source.slice(n.start, n.end)).name.replace(/^(?:predefinição|template)\s*:\s*/, '');
        if (exposed.some(n => /^(?:desambig(?:uação)?|disambig|desambiguar)$/.test(name(n)))) return null;
        const boxes = exposed.filter(n => /^(?:info\/|infobox\b)/.test(name(n)));
        if (boxes.length !== 1) return null;
        const box = boxes[0], firstSection = view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m);
        if (firstSection >= 0 && box.start >= firstSection) return null;
        const lineStart = view.lastIndexOf('\n', box.start - 1) + 1;
        const lineEndAt = view.indexOf('\n', box.end), lineEnd = lineEndAt < 0 ? view.length : lineEndAt;
        if (view.slice(lineStart, box.start).trim() || view.slice(box.end, lineEnd).trim()) return null;
        const p = parsedTemplate(source.slice(box.start, box.end)), boxName = name(box);
        const fields = foreignEntries(p);
        if (fields.some(e => ['embed', 'child', 'embutido', 'subcaixa'].includes(norm(e.key)) &&
            e.value.trim() && !/^(?:não|nao|no|false|0)$/i.test(e.value.trim()))) return null;
        if (BIOGRAPHY_INFOBOXES.has(boxName)) return {infobox: boxName};
        if (BIOGRAPHY_MUSIC_BOXES.has(boxName)) {
            const types = fields.filter(e => norm(e.key) === 'fundo');
            // Do not use the template's solo default: a band can omit fundo.
            if (types.length !== 1 || !BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))) return null;
            if (fields.some(e => ['integrantes', 'exintegrantes'].includes(norm(e.key)) && e.value.trim())) return null;
            return {infobox: boxName, soloType: norm(types[0].value)};
        }
        // Saints' infoboxes can also cover groups of martyrs.
        if (boxName === 'info/santo' && fields.some(e =>
            ['nascimento', 'nascimento data', 'data nascimento', 'data de nascimento'].includes(norm(e.key)) &&
            e.value.trim() && !/^(?:desconhecid[ao]|ignorado|n\/a|\?)$/i.test(e.value.trim()))) return {infobox: boxName};
        return null;
    }
    function biographyNamedPart(part) {
        const m = part.match(/^(\s*)([^=\n{}<>]+?)([ \t]*=[ \t]*)([\s\S]*)$/);
        return m ? {key: m[2].trim(), value: m[4]} : null;
    }
    function biographyPortalSlots(raw) {
        const p = parsedTemplate(raw), slots = new Map();
        let next = 1;
        for (let i = 1; i < p.parts.length; i++) {
            const part = p.parts[i], eq = biographyNamedPart(part);
            // Anonymous parameters increment independently of explicit numbers.
            const key = eq ? eq.key.trim() : String(next++);
            if (!/^[1-9]\d*$/.test(key)) return {p, slots, unsafe: true};
            const number = Number(key), value = eq ? eq.value : part;
            if (number > 10 || slots.has(number) || /[{}<>\[\]\uE000\uE001]/.test(value)) return {p, slots, unsafe: true};
            slots.set(number, {index: i, value, named: !!eq});
        }
        return {p, slots, next, unsafe: false};
    }
    function addBiographyPortal(source, cfg, bump, warn) {
        if (!cfg.biographyPortal || !cfg.portals || !cfg.endMatter || !biographyDetection(source, cfg)) return source;
        const {nodes} = biographyNodes(source);
        const portalNodes = nodes.filter(n => {
            const name = parsedTemplate(source.slice(n.start, n.end)).name.replace(/^(?:predefinição|template)\s*:\s*/, '');
            return ['portal', 'portal2', 'portal3', 'barra de portal', 'portal bar'].includes(name);
        });
        const footer = footerTokens(source, cfg.footerProfiles);
        if (portalNodes.length) {
            // Preserve a valid singular alias and never duplicate an existing portal.
            for (const n of portalNodes) {
                const raw = source.slice(n.start, n.end), entries = parsedTemplate(raw).parts.slice(1);
                let next = 1;
                if (entries.some(part => {
                    const named = biographyNamedPart(part), slot = named ? named.key : String(next++);
                    return /^[1-9]$|^10$/.test(slot) && ['biografia', 'biografias'].includes(norm(named?.value ?? part));
                })) return source;
            }
            const candidates = portalNodes.filter(n => footer.tokens.some(t => t.start === n.start && t.role === 'portal') &&
                parsedTemplate(source.slice(n.start, n.end)).name.replace(/^(?:predefinição|template)\s*:\s*/, '') === 'portal3');
            for (const n of candidates) {
                const parsed = biographyPortalSlots(source.slice(n.start, n.end));
                if (parsed.unsafe) continue;
                let slot = 1;
                while (slot <= 10 && parsed.slots.get(slot)?.value.trim()) slot++;
                if (slot > 10) continue;
                const entry = parsed.slots.get(slot), parts = parsed.p.parts.slice();
                if (entry) {
                    const old = parts[entry.index];
                    parts[entry.index] = entry.named ? old.replace(/=([\s\S]*)$/, (_, value) =>
                        '=' + (value.match(/^\s*/)?.[0] || '') + 'Biografias' + (value.match(/\s*$/)?.[0] || '')) :
                        old.replace(/^(\s*)[\s\S]*?$/, '$1Biografias');
                } else if (slot === parsed.next && ![...parsed.slots.values()].some(e => e.named)) parts.push('Biografias');
                else parts.push(slot + '=Biografias');
                bump('biographyPortal');
                return source.slice(0, n.start) + '{{' + parts.join('|') + '}}' + source.slice(n.end);
            }
            warn('Biografia detectada, mas a chamada de portal exige revisão: pode estar fora do bloco final, ter valores dinâmicos, parâmetros repetidos ou dez portais preenchidos. Acrescente Biografias depois de conferir a chamada.');
            return source;
        }
        if (topNodes(protectedView(source)).some(n=>['portal','portal2','portal3','barra de portal','portal bar'].includes(parsedTemplate(source.slice(n.start,n.end)).name))) {
            warn('Portal existente fora do bloco final reconhecido. A chamada foi preservada sem duplicação.'); return source;
        }
        if (footer.tokens.some(t => !t.role || /<\s*ref\b/i.test(t.raw))) {
            warn('Biografia detectada. Confira o bloco final antes de acrescentar {{Portal3|Biografias}}, pois há uma predefinição sem função confirmada ou com referências.');
            return source;
        }
        const anchor = footer.tokens.find(t => FOOTER_ROLES[t.role] > FOOTER_ROLES.portal);
        const at = anchor ? anchor.start : source.trimEnd().length;
        bump('biographyPortal');
        return source.slice(0, at).replace(/\n*$/, '\n\n') + '{{Portal3|Biografias}}\n' +
            (anchor ? source.slice(at) : '');
    }

    const COMMON_OCCUPATIONS=new Set(["acordeonista","actor","actor de cinema","actor de teatro","actor de televisão","actriz","actriz de cinema","actriz de teatro","actriz de televisão","adida diplomática","adido diplomático","administrador","administrador de empresas","administrador de sistemas","administradora","administradora de empresas","administradora de sistemas","advogada","advogado","aeronauta","agente penitenciária","agente penitenciário","agricultor","agricultora","agronomista","agrónoma","agrónomo","agrônoma","agrônomo","alfaiata","alfaiate","amazona de hipismo","analista","analista de sistemas","analista económica","analista económico","analista econômica","analista econômico","analista financeira","analista financeiro","andebolista","anestesiologista","angiologista","animador","animador de desenhos animados","animadora","animadora de desenhos animados","antropóloga","antropólogo","apicultor","apicultora","apresentador","apresentador de televisão","apresentadora","apresentadora de televisão","arcebispo católico","argumentista","argumentista de cinema","argumentista de televisão","arqueira desportiva","arqueiro desportivo","arqueóloga","arqueóloga subaquática","arqueólogo","arqueólogo subaquático","arquitecta","arquitecta paisagista","arquitecto","arquitecto paisagista","arquiteta","arquiteta paisagista","arquiteto","arquiteto paisagista","arquivista","arranjador","arranjadora","arremessador de peso","arremessadora de peso","artesã","artesão","artista","artista gráfica","artista gráfico","artista marcial","artista plástica","artista plástico","artista visual","assistente administrativa","assistente administrativo","astrobióloga","astrobiólogo","astrofísica","astrofísico","astronauta","astroquímica","astroquímico","astrónoma","astrónomo","astrônoma","astrônomo","atirador desportivo","atiradora desportiva","atleta","atleta de atletismo","ator","ator de cinema","ator de teatro","ator de televisão","atriz","atriz de cinema","atriz de teatro","atriz de televisão","audiologista","auditor contábil","auditora contábil","aviador","aviadora","bacteriologista","bailarina","bailarino","baixista","bancária","bancário","bandolinista","banqueira","banqueiro","barbeira","barbeiro","barista","barmaid","barman","basquetebolista","baterista","beisebolista","bibliotecária","bibliotecário","biofísica","biofísico","biomédica","biomédico","bioquímica","bioquímico","bispo católico","bióloga","bióloga marinha","bióloga molecular","biólogo","biólogo marinho","biólogo molecular","blogueira","blogueiro","bloguista","bombeira","bombeiro","botânica","botânico","boxeador","boxeadora","cabeleireira","cabeleireiro","caminhoneira","caminhoneiro","camionista","canalizador","canalizadora","canoísta","cantor","cantor de ópera","cantor lírico","cantora","cantora de ópera","cantora lírica","carateca","cardeal católico","cardiologista","caricaturista","carpinteira","carpinteiro","cartunista","cartógrafa","cartógrafo","cavaleiro de hipismo","cavaquinista","cenografista","cenógrafa","cenógrafo","ceramista","chef de cozinha","ciclista","ciclista de estrada","ciclista de montanha","ciclista de pista","ciclista profissional","cientista","cientista da computação","cientista de computação","cineasta","cirurgiã","cirurgiã cardiovascular","cirurgiã plástica","cirurgião","cirurgião cardiovascular","cirurgião plástico","clarinetista","climatologista","comediante","comerciante","comissária de bordo","comissário de bordo","compositor","compositor musical","compositora","compositora musical","condutor","condutora","confeiteira","confeiteiro","conservador","conservador de museu","conservadora","conservadora de museu","constitucionalista","consulesa","consultor","consultor económico","consultor econômico","consultor financeiro","consultora","consultora económica","consultora econômica","consultora financeira","contabilista","contador","contadora","contista","contrabaixista","controlador de tráfego aéreo","controladora de tráfego aéreo","coreógrafa","coreógrafo","corredor","corredora","correspondente jornalística","correspondente jornalístico","corretor de imóveis","corretor de valores","corretora de imóveis","corretora de valores","cosmonauta","cosmóloga","cosmólogo","costureira","costureiro","cozinheira","cozinheiro","criador de conteúdo","criadora de conteúdo","criminalista","cronista","cronista de jornal","cronista de revista","cronista literária","cronista literário","crítica literária","crítico literário","curador","curadora","cônsul","dançarina","dançarino","decatleta","defensor público","defensora pública","dentista","deputada","deputada estadual","deputada federal","deputado","deputado estadual","deputado federal","dermatologista","desembargador","desembargadora","desenhista","desenvolvedor de software","desenvolvedor web","desenvolvedora de software","desenvolvedora web","designer","designer de moda","designer gráfica","designer gráfico","designer industrial","desportista","detetive","diplomata","director","director de cinema","director de fotografia","director de teatro","director de televisão","director teatral","directora","directora de cinema","directora de fotografia","directora de teatro","directora de televisão","directora teatral","diretor","diretor de animação","diretor de cinema","diretor de fotografia","diretor de teatro","diretor de televisão","diretor executivo","diretor teatral","diretora","diretora de animação","diretora de cinema","diretora de fotografia","diretora de teatro","diretora de televisão","diretora executiva","diretora teatral","dobrador","dobradora","docente","documentalista","documentarista","dramaturga","dramaturgo","dublador","dubladora","econometrista","economista","ecóloga","ecólogo","editor","editor cinematográfico","editor de jornal","editor de revista","editor jornalístico","editor literário","editor-chefe","editora","editora cinematográfica","editora de jornal","editora de revista","editora jornalística","editora literária","editora-chefe","educador","educador social","educadora","educadora social","egiptóloga","egiptólogo","electricista","eletricista","embaixador","embaixadora","empreendedor","empreendedora","empregador","empregadora","empresária","empresária industrial","empresário","empresário industrial","encanador","encanadora","encenador","encenadora","endocrinologista","enfermeira","enfermeira obstetra","enfermeiro","enfermeiro obstetra","engenheira","engenheira aeroespacial","engenheira aeronáutica","engenheira agrónoma","engenheira agrônoma","engenheira ambiental","engenheira biomédica","engenheira civil","engenheira de computação","engenheira de materiais","engenheira de minas","engenheira de produção","engenheira de software","engenheira de telecomunicações","engenheira de transportes","engenheira electrotécnica","engenheira eletrotécnica","engenheira elétrica","engenheira ferroviária","engenheira florestal","engenheira industrial","engenheira informática","engenheira mecânica","engenheira naval","engenheira nuclear","engenheira química","engenheiro","engenheiro aeroespacial","engenheiro aeronáutico","engenheiro agrónomo","engenheiro agrônomo","engenheiro ambiental","engenheiro biomédico","engenheiro civil","engenheiro de computação","engenheiro de materiais","engenheiro de minas","engenheiro de produção","engenheiro de software","engenheiro de telecomunicações","engenheiro de transportes","engenheiro electrotécnico","engenheiro eletrotécnico","engenheiro elétrico","engenheiro ferroviário","engenheiro florestal","engenheiro industrial","engenheiro informático","engenheiro mecânico","engenheiro naval","engenheiro nuclear","engenheiro químico","ensaísta","entomóloga","entomólogo","enxadrista","epidemiologista","epistemóloga","epistemólogo","escritor","escritora","escrivã","escrivão","escultor","escultora","esgrimista","especialista em segurança da informação","esportista","estatística","estatístico","esteticista","estilista","estilista de moda","estudante","etnomusicóloga","etnomusicólogo","etnóloga","etnólogo","etóloga","etólogo","executiva","executivo","fagotista","farmacêutica","farmacêutico","ferreira","ferreiro","figurinista","filóloga","filólogo","filósofa","filósofa da ciência","filósofa da linguagem","filósofa política","filósofo","filósofo da ciência","filósofo da linguagem","filósofo político","fisioterapeuta","flautista","fonoaudióloga","fonoaudiólogo","fotojornalista","fotógrafa","fotógrafa de imprensa","fotógrafa documental","fotógrafo","fotógrafo de imprensa","fotógrafo documental","freira católica","funcionária pública","funcionário público","futebolista","futsalista","física","física experimental","física teórica","físico","físico experimental","físico teórico","gastroenterologista","geneticista","geodesista","geofísica","geofísico","geoquímica","geoquímico","gerente","gerente de projetos","geriatra","gestor","gestor de projetos","gestora","gestora de projetos","geógrafa","geógrafo","geóloga","geólogo","ginasta","ginasta artística","ginasta artístico","ginasta de ginástica rítmica","ginasta de trampolim","ginecologista","golfista","golfista profissional","governador","governador de estado","governador estadual","governadora","governadora de estado","governadora estadual","gravador de arte","gravadora de arte","guarda florestal","guarda prisional","guitarrista","halterofilista","handebolista","harpista","hematologista","heptatleta","herpetóloga","herpetólogo","hidróloga","hidrólogo","higienista oral","historiador","historiador da arte","historiador da ciência","historiadora","historiadora da arte","historiadora da ciência","humorista","ictióloga","ictiólogo","ilustrador","ilustradora","imunologista","infectologista","influenciador digital","influenciadora digital","inspector","inspectora","inspetor","inspetora","instrumentista","intérprete","inventor","inventora","investigador","investigador policial","investigadora","investigadora policial","joalheira","joalheiro","jogador de andebol","jogador de badminton","jogador de badmínton","jogador de basquete","jogador de basquetebol","jogador de beisebol","jogador de futebol","jogador de futebol americano","jogador de futsal","jogador de handebol","jogador de hóquei em patins","jogador de hóquei no gelo","jogador de hóquei sobre grama","jogador de polo aquático","jogador de rugby","jogador de râguebi","jogador de rúgbi","jogador de ténis","jogador de ténis de mesa","jogador de tênis","jogador de tênis de mesa","jogador de voleibol","jogador de voleibol de praia","jogador de vôlei","jogador de vôlei de praia","jogador de xadrez","jogadora de andebol","jogadora de badminton","jogadora de badmínton","jogadora de basquete","jogadora de basquetebol","jogadora de beisebol","jogadora de futebol","jogadora de futebol americano","jogadora de futsal","jogadora de handebol","jogadora de hóquei em patins","jogadora de hóquei no gelo","jogadora de hóquei sobre grama","jogadora de polo aquático","jogadora de rugby","jogadora de râguebi","jogadora de rúgbi","jogadora de ténis","jogadora de ténis de mesa","jogadora de tênis","jogadora de tênis de mesa","jogadora de voleibol","jogadora de voleibol de praia","jogadora de vôlei","jogadora de vôlei de praia","jogadora de xadrez","jornalista","jornalista desportiva","jornalista desportivo","jornalista esportiva","jornalista esportivo","jornalista investigativa","jornalista investigativo","judoca","juiz","jurista","juíza","karateca","lançador de dardo","lançador de disco","lançador de martelo","lançador de peso","lançadora de dardo","lançadora de disco","lançadora de martelo","lançadora de peso","letrista","levantador de peso","levantadora de peso","lexicógrafa","lexicógrafo","limnóloga","limnólogo","linguista","locutor","locutora","lutador","lutador de luta livre olímpica","lutador de wrestling profissional","lutador olímpico","lutadora","lutadora de luta livre olímpica","lutadora de wrestling profissional","lutadora olímpica","líder religiosa","líder religioso","maestrina","maestro","magistrada","magistrado","manicure","maquiador","maquiadora","maquilhador","maquilhadora","maquinista","maratonista","marceneira","marceneiro","marinheira","marinheiro","matemática","matemática aplicada","matemática teórica","matemático","matemático aplicado","matemático teórico","mecânica","mecânico","medievalista","mesatenista","meteorologista","microbióloga","microbiólogo","micóloga","micólogo","militar","mineralogista","ministra","ministra de tribunal","ministro","ministro de tribunal","missionária","missionário","modelo","modelo fotográfica","modelo fotográfico","monge","monja","montador cinematográfico","montadora cinematográfica","motociclista profissional","motorista","museóloga","museólogo","musicóloga","musicólogo","médica","médica de família","médica sanitarista","médica veterinária","médico","médico de família","médico sanitarista","médico veterinário","música","músico","nadador","nadador de polo aquático","nadador profissional","nadadora","nadadora de polo aquático","nadadora profissional","naturalista","navegador","navegadora","nefrologista","neurocientista","neurocirurgiã","neurocirurgião","neurologista","neuropsicóloga","neuropsicólogo","notária","notário","novelista","nutricionista","oboísta","obstetra","oceanógrafa","oceanógrafo","odontologista","odontóloga","odontólogo","oficial de justiça","oftalmologista","oncologista","operador de bolsa","operadora de bolsa","operária","operário","organista","ornitóloga","ornitólogo","ortopedista","otorrinolaringologista","ourives","padeira","padeiro","padre católico","paisagista","paleobióloga","paleobiólogo","paleontóloga","paleontólogo","papa","paramédica","paramédico","parasitologista","parlamentar","pasteleira","pasteleiro","pastor protestante","pastora protestante","patinador","patinador artístico no gelo","patinadora","patinadora artística no gelo","patologista","pecuarista","pedagoga","pedagogo","pediatra","pedicure","pedreira","pedreiro","percussionista","pescador","pescadora","pesquisador","pesquisadora","pianista","pilota","pilota de automobilismo","pilota de automóveis","pilota de automóvel","pilota de aviação","pilota de avião","pilota de corrida automobilística","pilota de motociclismo","pilota de rali","pilota de rally","piloto","piloto de automobilismo","piloto de automóveis","piloto de automóvel","piloto de aviação","piloto de avião","piloto de corrida automobilística","piloto de motociclismo","piloto de rali","piloto de rally","pintor","pintor de arte","pintor de construção","pintora","pintora de arte","pintora de construção","pneumologista","poeta","poetisa","policial","política","político","praticante de artes marciais","prefeita","prefeita municipal","prefeito","prefeito municipal","presidente","primatóloga","primatólogo","primeira-ministra","primeiro-ministro","proctologista","procurador","procurador de justiça","procuradora","procuradora de justiça","produtor","produtor cinematográfico","produtor de cinema","produtor de televisão","produtor musical","produtora","produtora cinematográfica","produtora de cinema","produtora de televisão","produtora musical","professor","professor catedrático","professor do ensino básico","professor do ensino fundamental","professor emérito","professor universitário","professora","professora catedrática","professora do ensino básico","professora do ensino fundamental","professora emérita","professora universitária","programador","programador de computadores","programadora","programadora de computadores","promotor de justiça","promotora de justiça","protética dentária","protético dentário","psicopedagoga","psicopedagogo","psicóloga","psicóloga clínica","psicóloga do desporto","psicóloga do esporte","psicóloga educacional","psicóloga escolar","psicóloga social","psicólogo","psicólogo clínico","psicólogo do desporto","psicólogo do esporte","psicólogo educacional","psicólogo escolar","psicólogo social","psiquiatra","publicitária","publicitário","pugilista","quadrinhista","quadrinista","química","química analítica","química industrial","química inorgânica","química orgânica","químico","químico analítico","químico industrial","químico inorgânico","químico orgânico","radiologista","realizador","realizador de cinema","realizadora","realizadora de cinema","recreador","recreadora","redactor","redactora","redator","redator-chefe","redatora","redatora-chefe","regente musical","religiosa","religiosa católica","religioso","religioso católico","remador","remadora","repórter","repórter investigativa","repórter investigativo","restaurador","restaurador de arte","restauradora","restauradora de arte","reumatologista","revisor","revisor de textos","revisor-chefe","revisora","revisora de textos","revisora-chefe","romancista","roteirista","roteirista de cinema","roteirista de televisão","rugbista","sacerdote","sacerdote católico","sacerdotisa","saltador","saltador do salto triplo","saltador em altura","saltador em comprimento","saltador em distância","saltadora","saltadora do salto triplo","saltadora em altura","saltadora em comprimento","saltadora em distância","sanfoneira","sanfoneiro","saxofonista","secretária","secretária executiva","secretário","secretário executivo","senador","senadora","serralheira","serralheiro","servidor público","servidora pública","sindicalista","sismóloga","sismólogo","skatista","skatista profissional","socióloga","sociólogo","soldado","sonoplasta","streamer","surfista","surfista profissional","tabeliã","tabelião","taekwondista","tenista","tenista profissional","terapeuta ocupacional","terminóloga","terminólogo","tesoureira","tesoureiro","teóloga cristã","teólogo cristão","topógrafa","topógrafo","tradutor","tradutor literário","tradutora","tradutora literária","treinador","treinador de basquete","treinador de basquetebol","treinador de futebol","treinador de natação","treinadora","treinadora de basquete","treinadora de basquetebol","treinadora de futebol","treinadora de natação","triatleta","trombonista","trompetista","técnica","técnica de enfermagem","técnica de laboratório","técnica de som","técnico","técnico de enfermagem","técnico de laboratório","técnico de som","urbanista","urologista","velejador","velejadora","velocista","vereador","vereadora","veterinária","veterinário","violinista","violista","violoncelista","violonista","virologista","vocalista","voleibolista","vulcanologista","vulcanóloga","vulcanólogo","xadrezista","youtuber","zoóloga","zoólogo"]);
    const OCCUPATION_PHRASES=[...COMMON_OCCUPATIONS].sort((a,b)=>b.length-a.length);
    const OCCUPATION_LINK_TARGETS=new Set(['medicina','física','química','biologia','direção cinematográfica','literatura','jornalismo','pintura','escultura','fotografia','engenharia','direito','música','psicologia','arquitetura']);
    const OCCUPATION_FIELDS=new Set(['ocupação','ocupacao','ocupaçao','ocupações','ocupacoes','outras ocupações','ocupação atual','ocupação anterior','profissão','profissao','occupation','trabalho civil']);
    const OCCUPATION_PERSON_BOXES=new Set(['info/médico','info/magistrado','info/jogador de rugby','info/personalidade','info/gastrônomo','info/surfista','info/árbitro','info/titular de cargo','info/pirata','info/clérigo anglicano']);
    function occupationView(value) {
        // Indentation inside an infobox parameter is not preformatted prose.
        const prefix='{{RevisaWikiCampoInterno|';
        return protectedView(prefix+value+'}}').slice(prefix.length,-2);
    }
    function occupationLabelEdits(raw,start=0) {
        const view=occupationView(raw),refs=refTokens(view);
        const clean=applyEdits(view,refs.map(r=>({start:r.start,end:r.end,text:' '.repeat(r.end-r.start)})));
        const leading=clean.match(/^\s*(?:\*\s*)?/)[0].length;
        // A leading protected block, expression or quotation is not a label.
        if(raw.slice(0,leading).replace(/^\s*\*?\s*/, '').trim())return null;
        let label,end,target=null,piped=false,labelStart=leading;
        if(clean.startsWith('[[',leading)){
            const m=clean.slice(leading).match(/^\[\[([^\[\]\n]+)\]\]/);
            if(!m||/[{}<>]/.test(m[1]))return null;
            const parts=m[1].split('|');if(parts.length>2)return null;
            target=parts[0];piped=parts.length===2;label=parts.at(-1);end=leading+m[0].length;
            const stem=norm(target.replace(/\s*\([^()]*\)\s*$/,''));
            if(!COMMON_OCCUPATIONS.has(stem)&&!OCCUPATION_LINK_TARGETS.has(stem))return null;
        }else{
            const tail=clean.slice(leading);let best='';
            for(const candidate of OCCUPATION_PHRASES){
                const piece=tail.slice(0,candidate.length);
                if(norm(piece)===candidate&&(!tail[candidate.length]||/\s/.test(tail[candidate.length]))){best=piece;break;}
            }
            if(!best)return null;
            label=best;end=leading+best.length;
        }
        const trimmed=label.trim(),lower=trimmed.toLocaleLowerCase('pt');
        if(!COMMON_OCCUPATIONS.has(norm(trimmed)))return null;
        const tail=clean.slice(end).trim(),exact=!tail;
        if(tail&&!/^(?:de|da|do|das|dos|em|no|na|nos|nas)\s/i.test(tail))return null;
        const edits=[];
        if(trimmed!==trimmed.toLocaleUpperCase('pt')&&trimmed[0]!==trimmed[0].toLocaleLowerCase('pt')&&trimmed!==lower){
            if(target!==null){
                const spaces=label.match(/^\s*/)[0],last=label.match(/\s*$/)[0];
                const shown=spaces+lower+last;
                edits.push({start:start+leading,end:start+end,text:'[['+target+'|'+shown+']]'});
            }else edits.push({start:start+labelStart,end:start+end,text:lower});
        }
        return {edits,exact};
    }
    function occupationValueCase(value) {
        const view=occupationView(value),ranges=[...templates(view).nodes,...refTokens(view)],breaks=[];
        for(const m of view.matchAll(/\[\[[^\n]*?\]\]/g))ranges.push({start:m.index,end:m.index+m[0].length});
        for(const m of view.matchAll(/<br\s*\/?\s*>|\n/g))if(!inRange(m.index,ranges))breaks.push({start:m.index,end:m.index+m[0].length});
        const edits=[];let at=0;
        for(const br of [...breaks,{start:value.length,end:value.length}]){
            const chunk=value.slice(at,br.start),chunkView=view.slice(at,br.start),parts=[];let start=0;
            for(const m of chunkView.matchAll(/[,;]|\s+e\s+|\s+&\s+/g)){
                if(inRange(at+m.index,ranges))continue;
                parts.push({start,end:m.index});start=m.index+m[0].length;
            }
            parts.push({start,end:chunk.length});
            const parsed=parts.map(p=>occupationLabelEdits(chunk.slice(p.start,p.end),at+p.start));
            if(parts.length>1)parsed.filter(p=>p?.exact).forEach(p=>edits.push(...p.edits));
            else if(parts.length===1){const one=occupationLabelEdits(chunk,at);if(one)edits.push(...one.edits);}
            at=br.end;
        }
        return applyEdits(value,edits);
    }
    function occupationCase(source,cfg,bump) {
        if(!cfg.infoboxes||!cfg.occupationCase)return source;
        return mapTemplateTree(source,raw=>{
            const p=parsedTemplate(raw);let name=p.name;const visited=new Set();
            while(INFOBOX_CATALOG[name]?.redirectTo&&!visited.has(name)){
                visited.add(name);name=nameOf(INFOBOX_CATALOG[name].redirectTo);
            }
            const person=BIOGRAPHY_INFOBOXES.has(name)||OCCUPATION_PERSON_BOXES.has(name);
            const fields=foreignEntries(p);
            const solo=BIOGRAPHY_MUSIC_BOXES.has(name)&&fields.some(e=>norm(e.key)==='fundo'&&BIOGRAPHY_SOLO_TYPES.has(norm(e.value)));
            if(!person&&!solo)return raw;
            let changed=false;
            for(const field of fields){
                if(!OCCUPATION_FIELDS.has(norm(field.key)))continue;
                const next=occupationValueCase(field.value);
                if(next!==field.value){field.value=next;changed=true;bump('occupationCase');}
            }
            return changed?translatedEntries(p,fields):raw;
        });
    }

    const COUNTRY_PORTALS=ownDictionary({"frança":"França","brasil":"Brasil","portugal":"Portugal","estados unidos":"Estados Unidos","reino unido":"Reino Unido","alemanha":"Alemanha","espanha":"Espanha","itália":"Itália","japão":"Japão","china":"China","países baixos":"Países Baixos","finlândia":"Finlândia","suécia":"Suécia","noruega":"Noruega","dinamarca":"Dinamarca","suíça":"Suíça","áustria":"Áustria","bélgica":"Bélgica","irlanda":"Irlanda","polônia":"Polônia","rússia":"Rússia","ucrânia":"Ucrânia","turquia":"Turquia","grécia":"Grécia","canadá":"Canadá","méxico":"México","argentina":"Argentina","chile":"Chile","colômbia":"Colômbia","peru":"Peru","uruguai":"Uruguai","áfrica do sul":"África do Sul","índia":"Índia","austrália":"Austrália","nova zelândia":"Nova Zelândia","israel":"Israel","angola":"Angola","moçambique":"Moçambique","cabo verde":"Cabo Verde","são tomé e príncipe":"São Tomé e Príncipe","guiné-bissau":"Guiné-Bissau","timor-leste":"Timor-Leste","islândia":"Islândia","romênia":"Romênia","coreia do sul":"Coreia do Sul","egito":"Egito"});
    const VERIFIED_BIOGRAPHY_PORTALS=new Set(["alemanha","angola","animação","antropologia","argentina","arqueologia","arquitetura e urbanismo","arte","artes marciais","astronomia","atletismo","austrália","automobilismo","badmínton","basquetebol","beisebol","biologia","bioquímica","brasil","bélgica","cabo verde","canadá","catolicismo","chile","china","ciclismo","cinema","ciência","colômbia","coreia do sul","cristianismo","desporto","dinamarca","direito","educação","egito","engenharia","enxadrismo","escultura","espanha","estados unidos","filosofia","finlândia","fotografia","frança","futebol","futebol americano","física","geografia","geologia","ginástica","golfe","grécia","guiné-bissau","handebol","história","hóquei no gelo","irlanda","islândia","israel","itália","japão","jornalismo","literatura","matemática","medicina","moda","motociclismo","moçambique","mulheres","méxico","música","natação","negócios e economia","noruega","nova zelândia","patinação artística no gelo","países baixos","peru","pintura","política","polônia","portugal","psicologia","química","reino unido","religião","romênia","rugby","rússia","saúde","skate","sociologia","surfe","suécia","suíça","são tomé e príncipe","teatro","tecnologias de informação","televisão","timor-leste","turquia","ténis","ucrânia","uruguai","voleibol","wrestling profissional","áfrica do sul","áustria","índia"]);
    function principalBiographyBox(source,cfg={}) {
        const detection=biographyDetection(source,cfg);
        if(!detection)return null;
        const node=biographyNodes(source).nodes.find(n=>parsedTemplate(source.slice(n.start,n.end)).name===detection.infobox);
        if(!node)return null;
        const p=parsedTemplate(source.slice(node.start,node.end));
        return {...detection,node,p,fields:foreignEntries(p)};
    }
    const BIRTH_FIELDS=new Set(['data nascimento','nascimento data','data de nascimento','nascimento','nasceu','datadenascimento','data do nascimento']);
    const DEATH_FIELDS=new Set(['data morte','morte data','data de morte','morte','falecimento','data falecimento',
        'local morte','morte local','local de morte','local falecimento','causa morte','causa da morte','idade morte']);
    function biographyDeathIndication(source,box) {
        if(box.fields.some(e=>(DEATH_FIELDS.has(norm(e.key))||/morte|falece|faleceu|falecimento|óbito|obito|death|died/i.test(norm(e.key)))&&e.value.trim()))return true;
        const view=protectedView(source);
        if(/\[\[\s*Categoria\s*:\s*(?:Mortos|Assassinados|Falecidos)(?:\s|\])/i.test(view))return true;
        if(templates(view).nodes.some(n=>/^(?:morte|mortecirca|falecimento|death date(?: and age)?)$/.test(parsedTemplate(view.slice(n.start,n.end)).name)))return true;
        // A conservative veto also covers prose when an infobox omits death.
        return /\b(?:morreu|falecid[oa]s?|faleceu|morto|morta|morreram|faleceram|assassinado|assassinada)\b/iu.test(plainProse(source));
    }
    function livingDniValue(value) {
        const trimmed=value.trim(),node=topNodes(trimmed).find(n=>n.start===0);
        if(!node)return null;
        const raw=trimmed.slice(node.start,node.end),p=parsedTemplate(raw),suffix=trimmed.slice(node.end);
        if(p.name!=='dni')return null;
        let end=0;
        for(const ref of refTokens(suffix)){
            if(suffix.slice(end,ref.start).trim())return null;
            end=ref.end;
        }
        if(suffix.slice(end).trim())return null;
        const fields=new Map();let next=1;
        for(let i=1;i<p.parts.length;i++){
            const part=p.parts[i],named=biographyNamedPart(part),key=named?named.key:String(next++);
            if(fields.has(key)||!['1','2','3','4','lang','nowrap','nocat'].includes(key))return null;
            fields.set(key,{index:i,value:named?named.value:part});
        }
        if(!['si','sem idade'].includes(norm(fields.get('4')?.value||'')))return null;
        const nums=['1','2','3'].map(key=>fields.get(key)?.value.trim());
        if(!nums.every(n=>/^\d+$/.test(n||''))||!validDate(...nums.map(Number)))return null;
        const [day,month,year]=nums.map(Number),today=new Date();
        const age=today.getUTCFullYear()-year-
            (today.getUTCMonth()+1<month||today.getUTCMonth()+1===month&&today.getUTCDate()<day?1:0);
        if(age<0||age>110)return null;
        const parts=p.parts.slice();parts.splice(fields.get('4').index,1);
        return '{{'+parts.join('|')+'}}'+suffix;
    }
    function livingBirthAge(source,cfg,bump) {
        if(!cfg.birthDates||!cfg.livingBirthAge)return source;
        const box=principalBiographyBox(source,cfg);
        if(!box||biographyDeathIndication(source,box))return source;
        const alive=cfg.livingCategoryConfirmed===true||
            /\[\[\s*Categoria\s*:\s*Pessoas vivas\s*(?:\|[^\]]*)?\]\]/i.test(protectedView(source));
        if(!alive)return source;
        const births=box.fields.filter(e=>BIRTH_FIELDS.has(norm(e.key))&&e.value.trim());
        if(births.length!==1)return source;
        const field=births[0], value=livingDniValue(field.value);
        if(!value)return source;
        field.value=field.value.replace(field.value.trim(),value);
        bump('livingBirthAge');
        return source.slice(0,box.node.start)+translatedEntries(box.p,box.fields)+source.slice(box.node.end);
    }
    const PORTAL_IDENTITY_ALIASES=ownDictionary({"biografia":"biografias","polonia":"polônia","romenia":"romênia","jornal":"jornalismo","jornalismo":"jornalismo","cinema":"cinema","astronomia":"astronomia","química":"química","direito":"direito","geografia":"geografia","biologia":"biologia","bioquímica":"bioquímica","física":"física","matemática":"matemática","filosofia":"filosofia","história":"história","arqueologia":"arqueologia","antropologia":"antropologia","sociologia":"sociologia","psicologia":"psicologia","geologia":"geologia","engenharia":"engenharia","engenharias":"engenharia","arquitetura":"arquitetura e urbanismo","arquitetura e urbanismo":"arquitetura e urbanismo","urbanismo":"arquitetura e urbanismo","escultura":"escultura","esculturas":"escultura","estátua":"escultura","estátuas":"escultura","pintura":"pintura","fotografia":"fotografia","arte":"arte","artes":"arte","teatro":"teatro","televisão":"televisão","tevê":"televisão","tv":"televisão","animação":"animação","educação":"educação","ensino":"educação","moda":"moda","administração":"negócios e economia","economia":"negócios e economia","economia e negócios":"negócios e economia","negócios":"negócios e economia","negócios e economia":"negócios e economia","tecnologia da informação":"tecnologias de informação","tecnologia de informação":"tecnologias de informação","tecnologias da informação":"tecnologias de informação","tecnologias de informação":"tecnologias de informação","ti":"tecnologias de informação","saúde":"saúde","catolicismo":"catolicismo","religião":"religião","cristianismo":"cristianismo","mulheres":"mulheres","atletismo":"atletismo","basquete":"basquetebol","basquetebol":"basquetebol","basebol":"beisebol","beisebol":"beisebol","ciclismo":"ciclismo","ginástica":"ginástica","andebol":"handebol","handebol":"handebol","natação":"natação","voleibol":"voleibol","volley":"voleibol","vólei":"voleibol","vôlei":"voleibol","surf":"surfe","surfe":"surfe","surfing":"surfe","rugby":"rugby","râguebi":"rugby","rúgbi":"rugby","skate":"skate","automobilismo":"automobilismo","motociclismo":"motociclismo","badminton":"badmínton","badmínton":"badmínton","golf":"golfe","golfe":"golfe","patinagem artística":"patinação artística no gelo","patinação artística":"patinação artística no gelo","patinação artística no gelo":"patinação artística no gelo","hóquei no gelo":"hóquei no gelo","artes marciais":"artes marciais","desporto":"desporto","desportos":"desporto","esporte":"desporto","esportes":"desporto","ténis":"ténis","tênis":"ténis","futebol":"futebol","futebol americano":"futebol americano","enxadrismo":"enxadrismo","xadrez":"enxadrismo","luta livre":"wrestling profissional","luta profissional":"wrestling profissional","wrestling":"wrestling profissional","wrestling profissional":"wrestling profissional","frança":"frança","brasil":"brasil","portugal":"portugal","eua":"estados unidos","usa":"estados unidos","estados unidos da américa":"estados unidos","estados unidos":"estados unidos","uk":"reino unido","reino unido":"reino unido","alemanha":"alemanha","espanha":"espanha","itália":"itália","japão":"japão","china":"china","países baixos":"países baixos","finlândia":"finlândia","suécia":"suécia","noruega":"noruega","dinamarca":"dinamarca","suíça":"suíça","áustria":"áustria","bélgica":"bélgica","irlanda":"irlanda","polônia":"polônia","polónia":"polônia","federação russa":"rússia","rússia":"rússia","ucrânia":"ucrânia","turquia":"turquia","grécia":"grécia","canadá":"canadá","méxico":"méxico","argentina":"argentina","chile":"chile","colômbia":"colômbia","peru":"peru","uruguai":"uruguai","áfrica do sul":"áfrica do sul","índia":"índia","austrália":"austrália","nova zelândia":"nova zelândia","israel":"israel","angola":"angola","moçambique":"moçambique","cabo verde":"cabo verde","são tomé e príncipe":"são tomé e príncipe","guiné bissau":"guiné-bissau","guiné-bissau":"guiné-bissau","timor leste":"timor-leste","timor-leste":"timor-leste","islândia":"islândia","romênia":"romênia","roménia":"romênia","coreia do sul":"coreia do sul","egipto":"egito","egito":"egito"});
    function portalIdentity(value) {const key=norm(value);return PORTAL_IDENTITY_ALIASES[key]||key;}
    const SPORTS_BOX_PORTALS=ownDictionary({"info/nadador":["Natação"],"info/surfista":["Surfe"],"info/ciclista":["Ciclismo"],"info/artista marcial":["Artes marciais"],"info/motociclista":["Motociclismo"],"info/piloto de automóvel":["Automobilismo"],"info/piloto de corrida":["Automobilismo"],"info/piloto do wrc":["Automobilismo"],"info/jogador de basquete":["Basquetebol"],"info/jogador de rugby":["Rugby"],"info/boxeador":["Esportes"],"info/triatleta":["Esportes"],"info/esgrimista":["Esportes"],"info/golfista":["Golfe"],"info/treinador de natação":["Natação"],"info/voleibol/jogador":["Voleibol"],"info/treinador de basquete":["Basquetebol"],"info/esporte/atleta":["Esportes"],"info/jogador de voleibol":["Voleibol"],"info/treinador de basquetebol":["Basquetebol"],"info/atleta":["Esportes"],"info/futebolista":["Futebol"],"info/treinador de futebol":["Futebol"],"info/tenista":["Ténis"],"info/beisebolista":["Beisebol"],"info/enxadrista":["Xadrez"],"info/xadrezista":["Xadrez"]});
    const SPORTS_BOXES=new Set(["info/artista marcial","info/atleta","info/beisebolista","info/boxeador","info/ciclista","info/enxadrista","info/esgrimista","info/esporte/atleta","info/futebolista","info/golfista","info/jogador de basquete","info/jogador de rugby","info/jogador de voleibol","info/motociclista","info/nadador","info/piloto de automóvel","info/piloto de corrida","info/piloto do wrc","info/surfista","info/tenista","info/treinador","info/treinador de basquete","info/treinador de basquetebol","info/treinador de futebol","info/treinador de natação","info/triatleta","info/voleibol/jogador","info/xadrezista"]);
    const PROFESSIONAL_PORTALS=ownDictionary({"info/cientista":["Ciência"],"info/escritor":["Literatura"],"info/autor":["Literatura"],"info/político":["Política"]});
    const OCCUPATION_PORTALS=ownDictionary({"astrônomo":["Astronomia"],"astrônoma":["Astronomia"],"astrónomo":["Astronomia"],"astrónoma":["Astronomia"],"astrofísico":["Astronomia"],"astrofísica":["Astronomia"],"astroquímico":["Astronomia"],"astroquímica":["Astronomia"],"astrobiólogo":["Astronomia"],"astrobióloga":["Astronomia"],"cosmólogo":["Astronomia"],"cosmóloga":["Astronomia"],"físico":["Física"],"física":["Física"],"físico teórico":["Física"],"física teórica":["Física"],"físico experimental":["Física"],"física experimental":["Física"],"biofísico":["Física"],"biofísica":["Física"],"geofísico":["Física"],"geofísica":["Física"],"químico":["Química"],"química":["Química"],"químico analítico":["Química"],"química analítica":["Química"],"químico orgânico":["Química"],"química orgânica":["Química"],"químico inorgânico":["Química"],"química inorgânica":["Química"],"químico industrial":["Química"],"química industrial":["Química"],"bioquímico":["Bioquímica"],"bioquímica":["Bioquímica"],"matemático":["Matemática"],"matemática":["Matemática"],"matemático aplicado":["Matemática"],"matemática aplicada":["Matemática"],"matemático teórico":["Matemática"],"matemática teórica":["Matemática"],"estatístico":["Matemática"],"estatística":["Matemática"],"biólogo":["Biologia"],"bióloga":["Biologia"],"botânico":["Biologia"],"botânica":["Biologia"],"zoólogo":["Biologia"],"zoóloga":["Biologia"],"geneticista":["Biologia"],"microbiólogo":["Biologia"],"microbióloga":["Biologia"],"ecólogo":["Biologia"],"ecóloga":["Biologia"],"etólogo":["Biologia"],"etóloga":["Biologia"],"entomólogo":["Biologia"],"entomóloga":["Biologia"],"ornitólogo":["Biologia"],"ornitóloga":["Biologia"],"ictiólogo":["Biologia"],"ictióloga":["Biologia"],"herpetólogo":["Biologia"],"herpetóloga":["Biologia"],"primatólogo":["Biologia"],"primatóloga":["Biologia"],"micólogo":["Biologia"],"micóloga":["Biologia"],"parasitologista":["Biologia"],"imunologista":["Biologia"],"virologista":["Biologia"],"bacteriologista":["Biologia"],"biólogo marinho":["Biologia"],"bióloga marinha":["Biologia"],"biólogo molecular":["Biologia"],"bióloga molecular":["Biologia"],"geógrafo":["Geografia"],"geógrafa":["Geografia"],"cartógrafo":["Geografia"],"cartógrafa":["Geografia"],"geólogo":["Geologia"],"geóloga":["Geologia"],"mineralogista":["Geologia"],"vulcanólogo":["Geologia"],"vulcanóloga":["Geologia"],"vulcanologista":["Geologia"],"sismólogo":["Geologia"],"sismóloga":["Geologia"],"paleontólogo":["Geologia"],"paleontóloga":["Geologia"],"paleobiólogo":["Geologia"],"paleobióloga":["Geologia"],"geoquímico":["Geologia"],"geoquímica":["Geologia"],"historiador":["História"],"historiadora":["História"],"historiador da arte":["História"],"historiadora da arte":["História"],"historiador da ciência":["História"],"historiadora da ciência":["História"],"medievalista":["História"],"egiptólogo":["História"],"egiptóloga":["História"],"arqueólogo":["Arqueologia"],"arqueóloga":["Arqueologia"],"arqueólogo subaquático":["Arqueologia"],"arqueóloga subaquática":["Arqueologia"],"antropólogo":["Antropologia"],"antropóloga":["Antropologia"],"etnólogo":["Antropologia"],"etnóloga":["Antropologia"],"sociólogo":["Sociologia"],"socióloga":["Sociologia"],"filósofo":["Filosofia"],"filósofa":["Filosofia"],"filósofo da ciência":["Filosofia"],"filósofa da ciência":["Filosofia"],"filósofo político":["Filosofia"],"filósofa política":["Filosofia"],"filósofo da linguagem":["Filosofia"],"filósofa da linguagem":["Filosofia"],"epistemólogo":["Filosofia"],"epistemóloga":["Filosofia"],"psicólogo":["Psicologia"],"psicóloga":["Psicologia"],"psicólogo clínico":["Psicologia"],"psicóloga clínica":["Psicologia"],"psicólogo social":["Psicologia"],"psicóloga social":["Psicologia"],"psicólogo educacional":["Psicologia"],"psicóloga educacional":["Psicologia"],"psicólogo escolar":["Psicologia"],"psicóloga escolar":["Psicologia"],"psicólogo do esporte":["Psicologia"],"psicóloga do esporte":["Psicologia"],"psicólogo do desporto":["Psicologia"],"psicóloga do desporto":["Psicologia"],"neuropsicólogo":["Psicologia"],"neuropsicóloga":["Psicologia"],"médico":["Medicina"],"médica":["Medicina"],"cirurgião":["Medicina"],"cirurgiã":["Medicina"],"pediatra":["Medicina"],"psiquiatra":["Medicina"],"cardiologista":["Medicina"],"dermatologista":["Medicina"],"neurologista":["Medicina"],"neurocirurgião":["Medicina"],"neurocirurgiã":["Medicina"],"oncologista":["Medicina"],"oftalmologista":["Medicina"],"otorrinolaringologista":["Medicina"],"ortopedista":["Medicina"],"urologista":["Medicina"],"ginecologista":["Medicina"],"obstetra":["Medicina"],"anestesiologista":["Medicina"],"geriatra":["Medicina"],"gastroenterologista":["Medicina"],"endocrinologista":["Medicina"],"nefrologista":["Medicina"],"pneumologista":["Medicina"],"reumatologista":["Medicina"],"hematologista":["Medicina"],"infectologista":["Medicina"],"angiologista":["Medicina"],"patologista":["Medicina"],"radiologista":["Medicina"],"proctologista":["Medicina"],"epidemiologista":["Medicina"],"médico de família":["Medicina"],"médica de família":["Medicina"],"médico sanitarista":["Medicina"],"médica sanitarista":["Medicina"],"cirurgião plástico":["Medicina"],"cirurgiã plástica":["Medicina"],"cirurgião cardiovascular":["Medicina"],"cirurgiã cardiovascular":["Medicina"],"enfermeiro":["Saúde"],"enfermeira":["Saúde"],"enfermeiro obstetra":["Saúde"],"enfermeira obstetra":["Saúde"],"fisioterapeuta":["Saúde"],"terapeuta ocupacional":["Saúde"],"fonoaudiólogo":["Saúde"],"fonoaudióloga":["Saúde"],"audiologista":["Saúde"],"nutricionista":["Saúde"],"farmacêutico":["Saúde"],"farmacêutica":["Saúde"],"dentista":["Saúde"],"odontólogo":["Saúde"],"odontóloga":["Saúde"],"odontologista":["Saúde"],"higienista oral":["Saúde"],"protético dentário":["Saúde"],"protética dentária":["Saúde"],"engenheiro":["Engenharia"],"engenheira":["Engenharia"],"engenheiro civil":["Engenharia"],"engenheira civil":["Engenharia"],"engenheiro elétrico":["Engenharia"],"engenheira elétrica":["Engenharia"],"engenheiro electrotécnico":["Engenharia"],"engenheira electrotécnica":["Engenharia"],"engenheiro eletrotécnico":["Engenharia"],"engenheira eletrotécnica":["Engenharia"],"engenheiro mecânico":["Engenharia"],"engenheira mecânica":["Engenharia"],"engenheiro químico":["Engenharia"],"engenheira química":["Engenharia"],"engenheiro de produção":["Engenharia"],"engenheira de produção":["Engenharia"],"engenheiro de materiais":["Engenharia"],"engenheira de materiais":["Engenharia"],"engenheiro naval":["Engenharia"],"engenheira naval":["Engenharia"],"engenheiro aeronáutico":["Engenharia"],"engenheira aeronáutica":["Engenharia"],"engenheiro aeroespacial":["Engenharia"],"engenheira aeroespacial":["Engenharia"],"engenheiro ambiental":["Engenharia"],"engenheira ambiental":["Engenharia"],"engenheiro de minas":["Engenharia"],"engenheira de minas":["Engenharia"],"engenheiro nuclear":["Engenharia"],"engenheira nuclear":["Engenharia"],"engenheiro biomédico":["Engenharia"],"engenheira biomédica":["Engenharia"],"engenheiro de transportes":["Engenharia"],"engenheira de transportes":["Engenharia"],"engenheiro ferroviário":["Engenharia"],"engenheira ferroviária":["Engenharia"],"engenheiro de telecomunicações":["Engenharia"],"engenheira de telecomunicações":["Engenharia"],"engenheiro industrial":["Engenharia"],"engenheira industrial":["Engenharia"],"cientista da computação":["Tecnologias de informação"],"cientista de computação":["Tecnologias de informação"],"engenheiro de software":["Tecnologias de informação"],"engenheira de software":["Tecnologias de informação"],"engenheiro de computação":["Tecnologias de informação"],"engenheira de computação":["Tecnologias de informação"],"engenheiro informático":["Tecnologias de informação"],"engenheira informática":["Tecnologias de informação"],"programador":["Tecnologias de informação"],"programadora":["Tecnologias de informação"],"programador de computadores":["Tecnologias de informação"],"programadora de computadores":["Tecnologias de informação"],"analista de sistemas":["Tecnologias de informação"],"desenvolvedor de software":["Tecnologias de informação"],"desenvolvedora de software":["Tecnologias de informação"],"desenvolvedor web":["Tecnologias de informação"],"desenvolvedora web":["Tecnologias de informação"],"administrador de sistemas":["Tecnologias de informação"],"administradora de sistemas":["Tecnologias de informação"],"especialista em segurança da informação":["Tecnologias de informação"],"advogado":["Direito"],"advogada":["Direito"],"jurista":["Direito"],"juiz":["Direito"],"juíza":["Direito"],"magistrado":["Direito"],"magistrada":["Direito"],"procurador de justiça":["Direito"],"procuradora de justiça":["Direito"],"promotor de justiça":["Direito"],"promotora de justiça":["Direito"],"defensor público":["Direito"],"defensora pública":["Direito"],"desembargador":["Direito"],"desembargadora":["Direito"],"ministro de tribunal":["Direito"],"ministra de tribunal":["Direito"],"constitucionalista":["Direito"],"criminalista":["Direito"],"economista":["Negócios e economia"],"econometrista":["Negócios e economia"],"administrador de empresas":["Negócios e economia"],"administradora de empresas":["Negócios e economia"],"contador":["Negócios e economia"],"contadora":["Negócios e economia"],"contabilista":["Negócios e economia"],"auditor contábil":["Negócios e economia"],"auditora contábil":["Negócios e economia"],"consultor financeiro":["Negócios e economia"],"consultora financeira":["Negócios e economia"],"consultor econômico":["Negócios e economia"],"consultora econômica":["Negócios e economia"],"consultor económico":["Negócios e economia"],"consultora económica":["Negócios e economia"],"analista financeiro":["Negócios e economia"],"analista financeira":["Negócios e economia"],"analista econômico":["Negócios e economia"],"analista econômica":["Negócios e economia"],"analista económico":["Negócios e economia"],"analista económica":["Negócios e economia"],"corretor de valores":["Negócios e economia"],"corretora de valores":["Negócios e economia"],"corretor de imóveis":["Negócios e economia"],"corretora de imóveis":["Negócios e economia"],"empresário":["Negócios e economia"],"empresária":["Negócios e economia"],"empreendedor":["Negócios e economia"],"empreendedora":["Negócios e economia"],"comerciante":["Negócios e economia"],"banqueiro":["Negócios e economia"],"banqueira":["Negócios e economia"],"empresário industrial":["Negócios e economia"],"empresária industrial":["Negócios e economia"],"professor":["Educação"],"professora":["Educação"],"professor universitário":["Educação"],"professora universitária":["Educação"],"professor emérito":["Educação"],"professora emérita":["Educação"],"professor catedrático":["Educação"],"professora catedrática":["Educação"],"docente":["Educação"],"educador":["Educação"],"educadora":["Educação"],"pedagogo":["Educação"],"pedagoga":["Educação"],"psicopedagogo":["Educação"],"psicopedagoga":["Educação"],"educador social":["Educação"],"educadora social":["Educação"],"professor do ensino básico":["Educação"],"professora do ensino básico":["Educação"],"professor do ensino fundamental":["Educação"],"professora do ensino fundamental":["Educação"],"jornalista":["Jornalismo"],"repórter":["Jornalismo"],"jornalista investigativo":["Jornalismo"],"jornalista investigativa":["Jornalismo"],"jornalista desportivo":["Jornalismo"],"jornalista desportiva":["Jornalismo"],"jornalista esportivo":["Jornalismo"],"jornalista esportiva":["Jornalismo"],"repórter investigativo":["Jornalismo"],"repórter investigativa":["Jornalismo"],"correspondente jornalístico":["Jornalismo"],"correspondente jornalística":["Jornalismo"],"editor de jornal":["Jornalismo"],"editora de jornal":["Jornalismo"],"editor de revista":["Jornalismo"],"editora de revista":["Jornalismo"],"editor jornalístico":["Jornalismo"],"editora jornalística":["Jornalismo"],"cronista de jornal":["Jornalismo"],"cronista de revista":["Jornalismo"],"cineasta":["Cinema"],"diretor de cinema":["Cinema"],"diretora de cinema":["Cinema"],"director de cinema":["Cinema"],"directora de cinema":["Cinema"],"realizador de cinema":["Cinema"],"realizadora de cinema":["Cinema"],"ator de cinema":["Cinema"],"atriz de cinema":["Cinema"],"actor de cinema":["Cinema"],"actriz de cinema":["Cinema"],"montador cinematográfico":["Cinema"],"montadora cinematográfica":["Cinema"],"editor cinematográfico":["Cinema"],"editora cinematográfica":["Cinema"],"produtor cinematográfico":["Cinema"],"produtora cinematográfica":["Cinema"],"produtor de cinema":["Cinema"],"produtora de cinema":["Cinema"],"roteirista de cinema":["Cinema"],"argumentista de cinema":["Cinema"],"documentarista":["Cinema"],"ator de teatro":["Teatro"],"atriz de teatro":["Teatro"],"actor de teatro":["Teatro"],"actriz de teatro":["Teatro"],"dramaturgo":["Teatro"],"dramaturga":["Teatro"],"diretor de teatro":["Teatro"],"diretora de teatro":["Teatro"],"director de teatro":["Teatro"],"directora de teatro":["Teatro"],"encenador":["Teatro"],"encenadora":["Teatro"],"diretor teatral":["Teatro"],"diretora teatral":["Teatro"],"director teatral":["Teatro"],"directora teatral":["Teatro"],"ator de televisão":["Televisão"],"atriz de televisão":["Televisão"],"actor de televisão":["Televisão"],"actriz de televisão":["Televisão"],"apresentador de televisão":["Televisão"],"apresentadora de televisão":["Televisão"],"produtor de televisão":["Televisão"],"produtora de televisão":["Televisão"],"diretor de televisão":["Televisão"],"diretora de televisão":["Televisão"],"director de televisão":["Televisão"],"directora de televisão":["Televisão"],"roteirista de televisão":["Televisão"],"argumentista de televisão":["Televisão"],"animador 2d":["Animação"],"animadora 2d":["Animação"],"animador 3d":["Animação"],"animadora 3d":["Animação"],"animador de desenhos animados":["Animação"],"animadora de desenhos animados":["Animação"],"diretor de animação":["Animação"],"diretora de animação":["Animação"],"fotógrafo":["Fotografia"],"fotógrafa":["Fotografia"],"fotógrafo documental":["Fotografia"],"fotógrafa documental":["Fotografia"],"fotojornalista":["Jornalismo","Fotografia"],"fotógrafo de imprensa":["Jornalismo","Fotografia"],"fotógrafa de imprensa":["Jornalismo","Fotografia"],"pintor de arte":["Pintura"],"pintora de arte":["Pintura"],"escultor":["Escultura"],"escultora":["Escultura"],"artista plástico":["Arte"],"artista plástica":["Arte"],"artista visual":["Arte"],"artista gráfico":["Arte"],"artista gráfica":["Arte"],"gravador de arte":["Arte"],"gravadora de arte":["Arte"],"restaurador de arte":["Arte"],"restauradora de arte":["Arte"],"arquiteto":["Arquitetura e urbanismo"],"arquiteta":["Arquitetura e urbanismo"],"arquitecto":["Arquitetura e urbanismo"],"arquitecta":["Arquitetura e urbanismo"],"urbanista":["Arquitetura e urbanismo"],"arquiteto paisagista":["Arquitetura e urbanismo"],"arquiteta paisagista":["Arquitetura e urbanismo"],"arquitecto paisagista":["Arquitetura e urbanismo"],"arquitecta paisagista":["Arquitetura e urbanismo"],"paisagista":["Arquitetura e urbanismo"],"estilista de moda":["Moda"],"designer de moda":["Moda"],"costureiro":["Moda"],"costureira":["Moda"],"alfaiate":["Moda"],"alfaiata":["Moda"],"músico":["Música"],"música":["Música"],"cantor":["Música"],"cantora":["Música"],"compositor":["Música"],"compositora":["Música"],"compositor musical":["Música"],"compositora musical":["Música"],"instrumentista":["Música"],"vocalista":["Música"],"pianista":["Música"],"violinista":["Música"],"violonista":["Música"],"violista":["Música"],"violoncelista":["Música"],"contrabaixista":["Música"],"baixista":["Música"],"guitarrista":["Música"],"baterista":["Música"],"percussionista":["Música"],"trompetista":["Música"],"trombonista":["Música"],"clarinetista":["Música"],"oboísta":["Música"],"fagotista":["Música"],"flautista":["Música"],"saxofonista":["Música"],"harpista":["Música"],"organista":["Música"],"acordeonista":["Música"],"sanfoneiro":["Música"],"sanfoneira":["Música"],"cavaquinista":["Música"],"bandolinista":["Música"],"maestro":["Música"],"maestrina":["Música"],"regente musical":["Música"],"cantor lírico":["Música"],"cantora lírica":["Música"],"cantor de ópera":["Música"],"cantora de ópera":["Música"],"produtor musical":["Música"],"produtora musical":["Música"],"musicólogo":["Música"],"musicóloga":["Música"],"etnomusicólogo":["Música"],"etnomusicóloga":["Música"],"escritor":["Literatura"],"escritora":["Literatura"],"poeta":["Literatura"],"poetisa":["Literatura"],"romancista":["Literatura"],"contista":["Literatura"],"novelista":["Literatura"],"ensaísta":["Literatura"],"cronista literário":["Literatura"],"cronista literária":["Literatura"],"crítico literário":["Literatura"],"crítica literária":["Literatura"],"tradutor literário":["Literatura"],"tradutora literária":["Literatura"],"editor literário":["Literatura"],"editora literária":["Literatura"],"político":["Política"],"política":["Política"],"senador":["Política"],"senadora":["Política"],"deputado":["Política"],"deputada":["Política"],"deputado federal":["Política"],"deputada federal":["Política"],"deputado estadual":["Política"],"deputada estadual":["Política"],"governador estadual":["Política"],"governadora estadual":["Política"],"governador de estado":["Política"],"governadora de estado":["Política"],"prefeito municipal":["Política"],"prefeita municipal":["Política"],"vereador":["Política"],"vereadora":["Política"],"primeiro-ministro":["Política"],"primeira-ministra":["Política"],"parlamentar":["Política"],"sacerdote":["Religião"],"sacerdotisa":["Religião"],"líder religioso":["Religião"],"líder religiosa":["Religião"],"monge":["Religião"],"monja":["Religião"],"missionário":["Religião"],"missionária":["Religião"],"religioso":["Religião"],"religiosa":["Religião"],"padre católico":["Catolicismo"],"sacerdote católico":["Catolicismo"],"religioso católico":["Catolicismo"],"religiosa católica":["Catolicismo"],"freira católica":["Catolicismo"],"bispo católico":["Catolicismo"],"arcebispo católico":["Catolicismo"],"cardeal católico":["Catolicismo"],"papa":["Catolicismo"],"teólogo cristão":["Cristianismo"],"teóloga cristã":["Cristianismo"],"pastor protestante":["Cristianismo"],"pastora protestante":["Cristianismo"],"maratonista":["Atletismo"],"atleta de atletismo":["Atletismo"],"saltador em altura":["Atletismo"],"saltadora em altura":["Atletismo"],"saltador em distância":["Atletismo"],"saltadora em distância":["Atletismo"],"saltador em comprimento":["Atletismo"],"saltadora em comprimento":["Atletismo"],"saltador do salto triplo":["Atletismo"],"saltadora do salto triplo":["Atletismo"],"lançador de dardo":["Atletismo"],"lançadora de dardo":["Atletismo"],"lançador de disco":["Atletismo"],"lançadora de disco":["Atletismo"],"lançador de martelo":["Atletismo"],"lançadora de martelo":["Atletismo"],"arremessador de peso":["Atletismo"],"arremessadora de peso":["Atletismo"],"lançador de peso":["Atletismo"],"lançadora de peso":["Atletismo"],"decatleta":["Atletismo"],"heptatleta":["Atletismo"],"basquetebolista":["Basquetebol"],"jogador de basquetebol":["Basquetebol"],"jogadora de basquetebol":["Basquetebol"],"jogador de basquete":["Basquetebol"],"jogadora de basquete":["Basquetebol"],"treinador de basquetebol":["Basquetebol"],"treinadora de basquetebol":["Basquetebol"],"treinador de basquete":["Basquetebol"],"treinadora de basquete":["Basquetebol"],"beisebolista":["Beisebol"],"jogador de beisebol":["Beisebol"],"jogadora de beisebol":["Beisebol"],"ciclista":["Ciclismo"],"ciclista profissional":["Ciclismo"],"ciclista de pista":["Ciclismo"],"ciclista de estrada":["Ciclismo"],"ciclista de montanha":["Ciclismo"],"ginasta":["Ginástica"],"ginasta artístico":["Ginástica"],"ginasta artística":["Ginástica"],"ginasta de ginástica rítmica":["Ginástica"],"ginasta de trampolim":["Ginástica"],"andebolista":["Handebol"],"handebolista":["Handebol"],"jogador de andebol":["Handebol"],"jogadora de andebol":["Handebol"],"jogador de handebol":["Handebol"],"jogadora de handebol":["Handebol"],"nadador":["Natação"],"nadadora":["Natação"],"nadador profissional":["Natação"],"nadadora profissional":["Natação"],"treinador de natação":["Natação"],"treinadora de natação":["Natação"],"voleibolista":["Voleibol"],"jogador de voleibol":["Voleibol"],"jogadora de voleibol":["Voleibol"],"jogador de vôlei":["Voleibol"],"jogadora de vôlei":["Voleibol"],"jogador de voleibol de praia":["Voleibol"],"jogadora de voleibol de praia":["Voleibol"],"jogador de vôlei de praia":["Voleibol"],"jogadora de vôlei de praia":["Voleibol"],"surfista":["Surfe"],"surfista profissional":["Surfe"],"rugbista":["Rugby"],"jogador de rugby":["Rugby"],"jogadora de rugby":["Rugby"],"jogador de râguebi":["Rugby"],"jogadora de râguebi":["Rugby"],"jogador de rúgbi":["Rugby"],"jogadora de rúgbi":["Rugby"],"skatista":["Skate"],"skatista profissional":["Skate"],"piloto de automóveis":["Automobilismo"],"piloto de automóvel":["Automobilismo"],"piloto de automobilismo":["Automobilismo"],"piloto de corrida automobilística":["Automobilismo"],"piloto de rally":["Automobilismo"],"piloto de rali":["Automobilismo"],"piloto de fórmula 1":["Automobilismo"],"pilota de automóveis":["Automobilismo"],"pilota de automóvel":["Automobilismo"],"pilota de automobilismo":["Automobilismo"],"pilota de corrida automobilística":["Automobilismo"],"pilota de rally":["Automobilismo"],"pilota de rali":["Automobilismo"],"pilota de fórmula 1":["Automobilismo"],"piloto de motociclismo":["Motociclismo"],"pilota de motociclismo":["Motociclismo"],"motociclista profissional":["Motociclismo"],"jogador de badminton":["Badmínton"],"jogadora de badminton":["Badmínton"],"jogador de badmínton":["Badmínton"],"jogadora de badmínton":["Badmínton"],"golfista":["Golfe"],"golfista profissional":["Golfe"],"patinador artístico no gelo":["Patinação artística no gelo"],"patinadora artística no gelo":["Patinação artística no gelo"],"jogador de hóquei no gelo":["Hóquei no gelo"],"jogadora de hóquei no gelo":["Hóquei no gelo"],"tenista":["Ténis"],"tenista profissional":["Ténis"],"jogador de tênis":["Ténis"],"jogadora de tênis":["Ténis"],"jogador de ténis":["Ténis"],"jogadora de ténis":["Ténis"],"futebolista":["Futebol"],"jogador de futebol":["Futebol"],"jogadora de futebol":["Futebol"],"treinador de futebol":["Futebol"],"treinadora de futebol":["Futebol"],"jogador de futebol americano":["Futebol americano"],"jogadora de futebol americano":["Futebol americano"],"enxadrista":["Xadrez"],"xadrezista":["Xadrez"],"jogador de xadrez":["Xadrez"],"jogadora de xadrez":["Xadrez"],"artista marcial":["Artes marciais"],"judoca":["Artes marciais"],"carateca":["Artes marciais"],"karateca":["Artes marciais"],"taekwondista":["Artes marciais"],"praticante de artes marciais":["Artes marciais"],"lutador de wrestling profissional":["Wrestling profissional"],"lutadora de wrestling profissional":["Wrestling profissional"],"atleta":["Esportes"],"esportista":["Esportes"],"desportista":["Esportes"],"boxeador":["Esportes"],"boxeadora":["Esportes"],"pugilista":["Esportes"],"esgrimista":["Esportes"],"remador":["Esportes"],"remadora":["Esportes"],"canoísta":["Esportes"],"triatleta":["Esportes"],"mesatenista":["Esportes"],"jogador de tênis de mesa":["Esportes"],"jogadora de tênis de mesa":["Esportes"],"jogador de ténis de mesa":["Esportes"],"jogadora de ténis de mesa":["Esportes"],"velejador":["Esportes"],"velejadora":["Esportes"],"cavaleiro de hipismo":["Esportes"],"amazona de hipismo":["Esportes"],"nadador de polo aquático":["Esportes"],"nadadora de polo aquático":["Esportes"],"jogador de polo aquático":["Esportes"],"jogadora de polo aquático":["Esportes"]});
    const SPORT_LABEL_PORTALS=ownDictionary({"atletismo":["Atletismo"],"maratona":["Atletismo"],"decatlo":["Atletismo"],"decatlon":["Atletismo"],"heptatlo":["Atletismo"],"heptatlon":["Atletismo"],"basquetebol":["Basquetebol"],"basquete":["Basquetebol"],"basquetebol em cadeira de rodas":["Basquetebol"],"beisebol":["Beisebol"],"ciclismo":["Ciclismo"],"ciclismo de estrada":["Ciclismo"],"ciclismo de pista":["Ciclismo"],"ciclismo de montanha":["Ciclismo"],"mountain bike":["Ciclismo"],"bmx":["Ciclismo"],"ginástica":["Ginástica"],"ginástica artística":["Ginástica"],"ginástica rítmica":["Ginástica"],"ginástica de trampolim":["Ginástica"],"andebol":["Handebol"],"handebol":["Handebol"],"natação":["Natação"],"natação pura":["Natação"],"natação em águas abertas":["Natação"],"voleibol":["Voleibol"],"vôlei":["Voleibol"],"voleibol de praia":["Voleibol"],"vôlei de praia":["Voleibol"],"voleibol sentado":["Voleibol"],"surfe":["Surfe"],"surf":["Surfe"],"surfing":["Surfe"],"rugby":["Rugby"],"rúgbi":["Rugby"],"râguebi":["Rugby"],"rugby sevens":["Rugby"],"rugby union":["Rugby"],"rugby league":["Rugby"],"skate":["Skate"],"skateboarding":["Skate"],"automobilismo":["Automobilismo"],"fórmula 1":["Automobilismo"],"rali":["Automobilismo"],"rally":["Automobilismo"],"cartismo":["Automobilismo"],"kart":["Automobilismo"],"karting":["Automobilismo"],"motociclismo":["Motociclismo"],"motocross":["Motociclismo"],"motogp":["Motociclismo"],"badminton":["Badmínton"],"badmínton":["Badmínton"],"golfe":["Golfe"],"patinação artística no gelo":["Patinação artística no gelo"],"patinagem artística no gelo":["Patinação artística no gelo"],"hóquei no gelo":["Hóquei no gelo"],"tênis":["Ténis"],"ténis":["Ténis"],"tênis em cadeira de rodas":["Ténis"],"futebol":["Futebol"],"futebol americano":["Futebol americano"],"xadrez":["Xadrez"],"enxadrismo":["Xadrez"],"artes marciais":["Artes marciais"],"judô":["Artes marciais"],"judo":["Artes marciais"],"caratê":["Artes marciais"],"karaté":["Artes marciais"],"karate":["Artes marciais"],"taekwondo":["Artes marciais"],"jiu-jítsu":["Artes marciais"],"jiu-jitsu":["Artes marciais"],"jiu-jítsu brasileiro":["Artes marciais"],"boxe":["Esportes"],"esgrima":["Esportes"],"remo":["Esportes"],"canoagem":["Esportes"],"triatlo":["Esportes"],"triatlon":["Esportes"],"tênis de mesa":["Esportes"],"ténis de mesa":["Esportes"],"hipismo":["Esportes"],"polo aquático":["Esportes"],"halterofilismo":["Esportes"],"levantamento de peso":["Esportes"],"tiro com arco":["Esportes"],"tiro esportivo":["Esportes"],"tiro desportivo":["Esportes"],"luta livre olímpica":["Esportes"],"luta greco-romana":["Esportes"],"pentatlo moderno":["Esportes"],"pentatlon moderno":["Esportes"],"wrestling profissional":["Wrestling profissional"],"luta profissional":["Wrestling profissional"],"futebol feminino":["Futebol"],"futebol masculino":["Futebol"],"futebol de salão":["Esportes"],"association football":["Futebol"],"soccer":["Futebol"]});
    const SPORT_PORTAL_IDENTITIES=new Set(["artes marciais","atletismo","automobilismo","badmínton","basquetebol","beisebol","ciclismo","desporto","enxadrismo","futebol","futebol americano","ginástica","golfe","handebol","hóquei no gelo","motociclismo","natação","patinação artística no gelo","rugby","skate","surfe","ténis","voleibol","wrestling profissional"]);
    const NATIONALITY_PORTALS=ownDictionary({"francês":"França","francesa":"França","brasileiro":"Brasil","brasileira":"Brasil","português":"Portugal","portuguesa":"Portugal","estadunidense":"Estados Unidos","britânico":"Reino Unido","britânica":"Reino Unido","alemão":"Alemanha","alemã":"Alemanha","espanhol":"Espanha","espanhola":"Espanha","italiano":"Itália","italiana":"Itália","japonês":"Japão","japonesa":"Japão","chinês":"China","chinesa":"China","neerlandês":"Países Baixos","neerlandesa":"Países Baixos","holandês":"Países Baixos","holandesa":"Países Baixos","finlandês":"Finlândia","finlandesa":"Finlândia","sueco":"Suécia","sueca":"Suécia","norueguês":"Noruega","norueguesa":"Noruega","dinamarquês":"Dinamarca","dinamarquesa":"Dinamarca","suíço":"Suíça","suíça":"Suíça","austríaco":"Áustria","austríaca":"Áustria","belga":"Bélgica","irlandês":"Irlanda","irlandesa":"Irlanda","polonês":"Polônia","polonesa":"Polônia","polaco":"Polônia","polaca":"Polônia","russo":"Rússia","russa":"Rússia","ucraniano":"Ucrânia","ucraniana":"Ucrânia","turco":"Turquia","turca":"Turquia","grego":"Grécia","grega":"Grécia","canadense":"Canadá","canadiano":"Canadá","canadiana":"Canadá","mexicano":"México","mexicana":"México","argentino":"Argentina","argentina":"Argentina","chileno":"Chile","chilena":"Chile","colombiano":"Colômbia","colombiana":"Colômbia","peruano":"Peru","peruana":"Peru","uruguaio":"Uruguai","uruguaia":"Uruguai","sul-africano":"África do Sul","sul-africana":"África do Sul","indiano":"Índia","indiana":"Índia","australiano":"Austrália","australiana":"Austrália","neozelandês":"Nova Zelândia","neozelandesa":"Nova Zelândia","israelense":"Israel","angolano":"Angola","angolana":"Angola","moçambicano":"Moçambique","moçambicana":"Moçambique","cabo-verdiano":"Cabo Verde","cabo-verdiana":"Cabo Verde","são-tomense":"São Tomé e Príncipe","santomense":"São Tomé e Príncipe","islandês":"Islândia","islandesa":"Islândia","romeno":"Romênia","romena":"Romênia","sul-coreano":"Coreia do Sul","sul-coreana":"Coreia do Sul","egípcio":"Egito","egípcia":"Egito"});
    const VERIFIED_WOMEN_CATEGORIES=new Set(["atrizes da frança","atrizes de portugal","atrizes do brasil","cantoras da frança","cantoras de portugal","cantoras do brasil","escritoras da frança","escritoras de portugal","escritoras do brasil","físicas","matemáticas","mulheres","mulheres cientistas","mulheres do século xx","mulheres futebolistas","mulheres na ciência","mulheres na literatura","mulheres na música","mulheres na política","mulheres transgênero","químicas"]);
    const WOMAN_ITEMS=new Set(['Q6581072','Q1052281']);
    function womanEligibility(entity,context={}) {
        if(!entity||entity.type!=='item'||entity.id!==context.entityId||!/^Q[1-9]\d*$/.test(entity.id)||
            context.namespace!==0||context.fullPage!==true||context.redirect||context.disambiguation||
            typeof context.title!=='string'||!context.title.trim()||entity.sitelinks?.ptwiki?.title!==context.title)return null;
        const active=property=>Array.isArray(entity.claims?.[property])?
            entity.claims[property].filter(s=>s&&s.rank!=='deprecated'):[];
        const item=s=>s?.mainsnak?.snaktype==='value'&&s.mainsnak.datatype==='wikibase-item'&&
            s.mainsnak.datavalue?.type==='wikibase-entityid'?s.mainsnak.datavalue.value?.id:null;
        const classes=active('P31');
        if(!classes.length||classes.some(s=>!['normal','preferred'].includes(s.rank)||item(s)!=='Q5'||
            Object.keys(s.qualifiers||{}).length))return null;
        const genders=active('P21');
        if(!genders.length||genders.some(s=>!['normal','preferred'].includes(s.rank)||
            !WOMAN_ITEMS.has(item(s))||Object.keys(s.qualifiers||{}).length))return null;
        return {entityId:entity.id,title:context.title,woman:true,genderItems:[...new Set(genders.map(item))]};
    }
    function biographySubjectMatchesTitle(box,title) {
        const fields=box.fields.filter(e=>['nome','nome completo','nome comp'].includes(norm(e.key))&&e.value.trim());
        const target=norm(title.replace(/\s*\([^()]*\)\s*$/,''));
        for(const field of fields) {
            let value=protectedView(field.value);
            value=applyEdits(value,refTokens(value).map(r=>({start:r.start,end:r.end,text:''})));
            if(/[{}<>\uE000\uE001]/.test(value))continue;
            value=value.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,'$2').replace(/\[\[([^\]]+)\]\]/g,'$1');
            if(norm(value)===target)return true;
        }
        return false;
    }
    function biographyWomanProof(source,cfg,box) {
        const proof=cfg.biographyGenderProof;
        if(!proof||proof.source!==(cfg.biographyOriginalSource??source)||proof.title!==cfg.pageTitle||
            !biographySubjectMatchesTitle(box,cfg.pageTitle||''))return false;
        return !!womanEligibility(proof.entity,proof);
    }
    function biographyIsWoman(source,cfg,box) {
        // Os campos gênero e gênero musical de Info/Biografia não são dados pessoais.
        // Um valor pessoal explícito em conflito impede a adição mesmo por categoria.
        for(const field of box.fields.filter(e=>['sexo','gender','sex'].includes(norm(e.key)))) {
            const value=norm(field.value);
            if(value&&!['feminino','feminina','mulher','female','f'].includes(value))return false;
        }
        if(biographyWomanProof(source,cfg,box))return true;
        const view=protectedView(source),ranges=structuralRanges(view);
        for(const m of view.matchAll(/\[\[\s*Categoria\s*:\s*([^\]|]+)(?:\|[^\]]*)?\]\]/gi))
            if(!inRange(m.index,ranges)&&VERIFIED_WOMEN_CATEGORIES.has(norm(m[1])))return true;
        return false;
    }

    function countryPortals(value,dedicated=false) {
        // Match an explicit country, never infer citizenship from a city.
        const countries=new Set();let view=protectedView(value);
        view=applyEdits(view,refTokens(view).map(r=>({start:r.start,end:r.end,text:''})));
        if(/\b(?:ou|não|nao|possivelmente|provavelmente|talvez|incert[oa]|desconhecid[oa]|cerca|circa|aproximadamente|supostamente|presumid[oa]|duvidoso|duvidosa)\b|\?/iu.test(view))return [];
        if(/[{}<>\uE000\uE001]/.test(view.replace(/<br\s*\/?\s*>/gi,'')))return [];
        const aliases=ownDictionary({'estados unidos da américa':'Estados Unidos','eua':'Estados Unidos','holanda':'Países Baixos',
            'polónia':'Polônia','roménia':'Romênia'});
        const add=value=>{
            const key=norm(value),name=COUNTRY_PORTALS[key]||aliases[key];
            if(name&&VERIFIED_BIOGRAPHY_PORTALS.has(portalIdentity(name)))countries.add(name);
        };
        for(const m of view.matchAll(/\[\[([^|\]#]+)(?:\|[^\]]*)?\]\]/g))add(m[1]);
        const fragments=view.replace(/<br\s*\/?\s*>/gi,',').split(/[,;\n]/);
        if(dedicated||fragments.length>1){
            const last=fragments.at(-1).trim();
            if(!/[\[\]()]/.test(last))add(last);
        }
        return countries.size===1?[...countries]:[];
    }
    function portalEvidenceText(value) {
        let text=protectedView(value);
        text=applyEdits(text,refTokens(text).map(r=>({start:r.start,end:r.end,text:''})));
        if(/[{}<>\uE000\uE001]/.test(text.replace(/<br\s*\/?\s*>/gi,'')))return null;
        if(/\b(?:ou|não|nao|possivelmente|provavelmente|talvez|incert[oa]|desconhecid[oa]|supostamente|presumid[oa])\b|\?/iu.test(text))return null;
        return text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,'$2').replace(/\[\[([^\]]+)\]\]/g,'$1');
    }
    function exactPortalOccupations(value) {
        const text=linkedPortalEvidenceText(value,'occupation');if(text===null)return [];
        const labels=[];
        for(const part of text.split(/<br\s*\/?\s*>|[,;\n]|\s+e\s+|\s+&\s+/i)) {
            const key=norm(part.replace(/^\s*\*\s*/,''));
            if(COMMON_OCCUPATIONS.has(key)||Object.prototype.hasOwnProperty.call(OCCUPATION_PORTALS,key))labels.push(key);
        }
        return labels;
    }
    function explicitNationalityPortals(value) {
        const linked=countryPortals(value,true),text=portalEvidenceText(value);
        if(text===null)return [];
        const values=new Set(linked);
        for(const part of text.split(/<br\s*\/?\s*>|[,;\n]|\s+e\s+/i)) {
            const key=norm(part),country=COUNTRY_PORTALS[key]||NATIONALITY_PORTALS[key];
            if(country)values.add(country);
        }
        return values.size===1?[...values]:[];
    }
    function biographyCountryPortal(box) {
        const nationalities=box.fields.filter(e=>['nacionalidade','cidadania'].includes(norm(e.key))&&e.value.trim());
        if(nationalities.length) {
            const countries=new Set();let uncertain=false;
            for(const field of nationalities) {
                const values=explicitNationalityPortals(field.value);
                if(values.length!==1)uncertain=true;else values.forEach(x=>countries.add(x));
            }
            // Nacionalidade e nascimento são relações diferentes. A nacionalidade
            // explícita tem prioridade, sem presumir cidadania pelo local de nascimento.
            if(!uncertain&&countries.size===1)return [...countries];
            return [];
        }
        const births=box.fields.filter(e=>['local nascimento','nascimento local','local de nascimento',
            'país nascimento','pais nascimento','país de nascimento','pais de nascimento','nascimento país',
            'nascimento pais','paisnatal','nascimento cidade','cidade natal','cidadenatal'].includes(norm(e.key))&&e.value.trim());
        if(births.length!==1)return [];
        return countryPortals(births[0].value,/pa[ií]s/.test(norm(births[0].key)));
    }
    function biographySportsPortals(box) {
        const desired=new Set(SPORTS_BOX_PORTALS[box.infobox]||[]);
        if(SPORTS_BOXES.has(box.infobox)||desired.size)desired.add('Esportes');
        const fields=box.fields.filter(e=>['esporte','desporto','modalidade','esportes','desportos','modalidades'].includes(norm(e.key))&&e.value.trim());
        const explicit=new Set();let uncertain=false;
        for(const field of fields) {
            const text=linkedPortalEvidenceText(field.value,'sport');if(text===null){uncertain=true;continue;}
            for(const part of text.split(/<br\s*\/?\s*>|[,;\n]|\s+e\s+/i))
                (SPORT_LABEL_PORTALS[norm(part)]||[]).forEach(x=>explicit.add(x));
        }
        const typed=[...desired].filter(x=>portalIdentity(x)!=='desporto');
        const conflict=typed.length&&explicit.size&&typed.some(x=>![...explicit].some(y=>portalIdentity(x)===portalIdentity(y)));
        if(conflict||uncertain)return desired.size?['Esportes']:[];
        explicit.forEach(x=>desired.add(x));
        if(explicit.size)desired.add('Esportes');
        return desired.has('Esportes')?['Esportes',...[...desired].filter(x=>portalIdentity(x)!=='desporto')]:[...desired];
    }
    function biographyPortalCandidates(source,cfg={}) {
        const box=principalBiographyBox(source,cfg);if(!box)return [];
        const countries=biographyCountryPortal(box),subjects=new Set();
        biographySportsPortals(box).forEach(x=>subjects.add(x));
        (PROFESSIONAL_PORTALS[box.infobox]||[]).forEach(x=>subjects.add(x));
        if(BIOGRAPHY_MUSIC_BOXES.has(box.infobox))subjects.add('Música');
        for(const field of box.fields.filter(e=>['ocupação','ocupacao','profissão','profissao'].includes(norm(e.key))))
            for(const label of exactPortalOccupations(field.value))
                (OCCUPATION_PORTALS[label]||[]).forEach(x=>subjects.add(x));
        if([...subjects].some(x=>SPORT_PORTAL_IDENTITIES.has(portalIdentity(x))))subjects.add('Esportes');
        // A profissão não informa gênero. Mulheres exige dados explícitos.
        const woman=biographyIsWoman(source,cfg,box);
        const result=subjects.has('Esportes')?['Esportes',...[...subjects].filter(x=>portalIdentity(x)!=='desporto')]:[...subjects];
        if(woman)result.push('Mulheres');
        result.push(...countries);
        return [...new Set(result)].filter(x=>VERIFIED_BIOGRAPHY_PORTALS.has(portalIdentity(x)));
    }

    function linkedPortalEvidenceText(value,kind) {
        if(portalEvidenceText(value)===null)return null;
        let raw=protectedView(value);
        raw=applyEdits(raw,refTokens(raw).map(r=>({start:r.start,end:r.end,text:''})));
        const edits=[];
        const identitySet=values=>new Set(values.map(portalIdentity));
        for(const match of raw.matchAll(/\[\[([^\[\]\n]+)\]\]/g)) {
            const parts=match[1].split('|');if(parts.length>2)return null;
            const target=norm(parts[0].split('#')[0]),label=norm(parts.at(-1));
            if(!target||target.includes(':'))return null;
            if(kind==='sport') {
                const targetValues=SPORT_LABEL_PORTALS[target];
                if(!targetValues)return null;
                const shown=SPORT_LABEL_PORTALS[label],destinations=identitySet(targetValues);
                const same=!shown||shown.some(x=>destinations.has(portalIdentity(x)));
                const footballSubtype=label==='futebol'&&['futebol americano','futebol de salão','futsal'].includes(target);
                if(!same&&!footballSubtype)return null;
                // O destino confirmado identifica a modalidade, mesmo quando o
                // texto visível usa um nome mais amplo, como futebol americano.
                edits.push({start:match.index,end:match.index+match[0].length,text:target});
            }else {
                const targetValues=OCCUPATION_PORTALS[target]||
                    (VERIFIED_BIOGRAPHY_PORTALS.has(portalIdentity(target))?[target]:[]);
                const shown=OCCUPATION_PORTALS[label];
                if(shown) {
                    const destinations=identitySet(targetValues);
                    if(!shown.some(x=>destinations.has(portalIdentity(x))))return null;
                }else if(!COMMON_OCCUPATIONS.has(target)||target!==label)return null;
                edits.push({start:match.index,end:match.index+match[0].length,text:parts.at(-1)});
            }
        }
        return applyEdits(raw,edits);
    }

    const BRAZIL_STATE_PORTAL_ALIASES=new Set(["acre","alagoas","amapá","amazonas","amazônia","bahia","ceará","distrito federal","distrito federal (brasil)","espírito santo","goiás","maranhão","mato grosso","mato grosso do sul","minas gerais","pará","paraíba","paraná","pernambuco","piauí","rio de janeiro","estado do rio","rio de janeiro (estado)","rn","rio grande do norte","rs","rio grande do sul","rondônia","roraima","santa catarina","sp","sp estado","estado de sp","são paulo (estado)","são paulo","sergipe","tocantins"]);
    function appendBiographyPortalSlot(parts,parsed,slot,name) {
        const named=slot!==parsed.next||[...parsed.slots.values()].some(e=>e.named);
        parts.push(named?slot+'='+name:name);
        parsed.slots.set(slot,{value:name,index:parts.length-1,named});
        if(!named)parsed.next++;
    }
    function addAutomaticBiographyPortals(source,cfg,bump) {
        if(!cfg.portals||!cfg.endMatter||!cfg.automaticBiographyPortals)return source;
        let desired=biographyPortalCandidates(source,cfg);if(!desired.length)return source;
        const {nodes}=biographyNodes(source),footer=footerTokens(source,cfg.footerProfiles);
        const portals=nodes.filter(n=>['portal','portal2','portal3','barra de portal','portal bar'].includes(parsedTemplate(source.slice(n.start,n.end)).name));
        const present=new Set();
        for(const n of portals){
            const p=biographyPortalSlots(source.slice(n.start,n.end));if(p.unsafe)return source;
            for(const e of p.slots.values())if(e.value.trim())present.add(portalIdentity(e.value));
        }
        const brazilAlreadyCovered=[...present].some(x=>BRAZIL_STATE_PORTAL_ALIASES.has(x));
        desired=desired.filter(x=>!present.has(portalIdentity(x))&&!(portalIdentity(x)==='brasil'&&brazilAlreadyCovered));
        if(!desired.length)return source;
        if(portals.length){
            const n=portals.find(n=>parsedTemplate(source.slice(n.start,n.end)).name==='portal3'&&footer.tokens.some(t=>t.start===n.start&&t.role==='portal'));
            if(!n)return source;
            const p=biographyPortalSlots(source.slice(n.start,n.end)),parts=p.p.parts.slice();let changed=0;
            for(const name of desired){
                let slot=1;while(slot<=10&&p.slots.get(slot)?.value.trim())slot++;
                if(slot>10)break;
                const e=p.slots.get(slot);
                if(e){parts[e.index]=e.named?parts[e.index].replace(/=([\s\S]*)$/,'='+name):name;e.value=name;}
                else appendBiographyPortalSlot(parts,p,slot,name);
                bump('automaticBiographyPortals');changed++;
            }
            return changed?source.slice(0,n.start)+'{{'+parts.join('|')+'}}'+source.slice(n.end):source;
        }
        if(topNodes(protectedView(source)).some(n=>['portal','portal2','portal3','barra de portal','portal bar'].includes(parsedTemplate(source.slice(n.start,n.end)).name)))return source;
        if(footer.tokens.some(t=>!t.role||/<\s*ref\b/i.test(t.raw)))return source;
        const anchor=footer.tokens.find(t=>FOOTER_ROLES[t.role]>FOOTER_ROLES.portal),at=anchor?anchor.start:source.trimEnd().length;
        desired.slice(0,10).forEach(()=>bump('automaticBiographyPortals'));
        return source.slice(0,at).replace(/\n*$/,'\n\n')+'{{Portal3|'+desired.slice(0,10).join('|')+'}}\n'+(anchor?source.slice(at):'');
    }

    function finalEndMatter(source, cfg, bump, warn) {
        if (!cfg.endMatter || cfg.sectionOnly) return source;
        let result = orderEndSections(source, cfg, bump, warn);
        result = addAuthorityControl(result, cfg, bump, warn);
        result = addBiographyPortal(result, cfg, bump, warn);
        result = addAutomaticBiographyPortals(result,cfg,bump);
        return orderFooter(result, cfg, bump, warn);
    }

    const nativeFieldCache = new Map();
    function translationProfile(raw) {
        const p = parsedTemplate(raw), name = norm(p.parts[0]);
        if (['refn','efn'].includes(p.name)) return null; // Chamadas locais válidas.
        if (/^(?:subst|safesubst)\s*:/i.test(name) || TRANSLATION_RULES.languages.some(l => name.startsWith(l + ':'))) return null;
        if(['referências','referencias'].includes(p.name) && foreignEntries(p).some(e=>['col','cols','colunas','colwidth','largcol','larguracol'].includes(norm(e.key)) && e.value.trim()))
            return {target:'Referências',kind:'renderer',fields:{},columnLayout:true,nativeRenderer:true,maxPos:5,source:{language:'pt',title:'Predefinição:Referências'}};
        const direct=TRANSLATION_RULES.profiles[name] || TRANSLATION_RULES.profiles[name.replace(TRANSLATION_PREFIX, '')];
        if(direct) {
            // Shared namespace/title names are resolved by their actual fields.
            const fields=foreignEntries(p).filter(e=>!e.positional && e.value.trim()), stem=name.replace(TRANSLATION_PREFIX,'');
            const candidates=Object.values(TRANSLATION_RULES.profiles).filter(x=>norm(x.source.title.replace(TRANSLATION_PREFIX,''))===stem);
            const score=profile=>fields.filter(e=>profile.fields[norm(e.key)]).length;
            return candidates.reduce((best,next)=>score(next)>score(best)?next:best,direct);
        }
        const prefix=name.match(/^((?:predefinição|plantilla|sjabloon|skabelon|template|tiêu[ _]+bản|vorlage|bản[ _]+mẫu|malline|modèle|テンプレート|şablon|แม่แบบ|modele|format|шаблон|תבנית|قالب|mall|mal|תב|樣板|样板|模板|模|ш|t|ş|틀))\s*:\s*(.*)$/iu);
        if(prefix) {
            const stem=prefix[2], target=CITE_NAMES[stem] || INFOBOX_CATALOG[stem]?.title || TEMPLATE_CATALOG[stem]?.title;
            if(target)return {target,kind:CITE_NAMES[stem]?'citation':INFOBOX_CATALOG[stem]?'infobox':'auxiliary',fields:{},
                source:{language:TRANSLATION_RULES.templatePrefixes[norm(prefix[1])] || (/vorlage/i.test(prefix[1])?'de':/plantilla/i.test(prefix[1])?'es':'fr'),title:parsedTemplate(raw).parts[0].trim()}};
        }
        const box=INFOBOX_CATALOG[p.name],citation=CITE_NAMES[p.name];
        if(box || citation) {
            const target=box?box.title:citation, family=norm(target), cacheKey=(box?'box:':'citation:')+family;
            if(!nativeFieldCache.has(cacheKey)) {
              const values=new Map();
              for(const profile of Object.values(TRANSLATION_RULES.profiles)) {
                if(box ? profile.kind!=='infobox' || (norm(profile.target)!==family && !['info/biografia','info/cientista','info/ator','info/escritor','info/artista'].includes(family)) : profile.kind!=='citation' || /Chapitre/.test(profile.source.title))continue;
                for(const [key,value] of Object.entries(profile.fields)) {
                    if(!values.has(key))values.set(key,new Set());values.get(key).add(value);
                }
              }
              nativeFieldCache.set(cacheKey,ownDictionary(Object.fromEntries([...values].filter(([,set])=>set.size===1).map(([key,set])=>[key,[...set][0]]))));
            }
            const fields=nativeFieldCache.get(cacheKey);
            const accepted=box?box.accepted:CITATION_KEY_CATALOG[family] || CS1_KEYS;
            if(foreignEntries(p).some(e=>e.value.trim() && fields[norm(e.key)] && !accepted.includes(e.key) && !accepted.includes(e.key.replace(/\d+$/,'#'))))
                return {target,kind:box?'infobox':'citation',fields,source:{language:'mixed',title:p.parts[0].trim()},
                    numbered:box?{}:{auteur:'autor',nom:'último',prénom:'primeiro','lien auteur':'autorlink'}};
        }
        return null;
    }
    function foreignEntries(p) {
        return p.parts.slice(1).map((part, i) => {
            const m = part.match(/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/);
            return m && !/[{}<>]/.test(m[2]) ? {index:i+1,key:m[2].trim(),value:m[4],lead:m[1],eq:m[3]} :
                {index:i+1,key:String(i+1),value:part,positional:true,lead:'',eq:'='};
        });
    }
    function translatedEntries(p, entries) {
        const parts = p.parts.slice();
        for (const e of entries) parts[e.index] = e.remove ? null : e.positional ? e.value : e.lead + e.key + e.eq + e.value;
        return '{{' + parts.filter(x => x !== null).join('|') + '}}';
    }
    function translationEnabled(profile,cfg) {
        if (!cfg.multilingual) return false;
        if (profile.kind==='citation') return cfg.citations;
        if (profile.kind==='infobox') return cfg.infoboxes;
        if (profile.kind==='date') return cfg.dates && cfg.birthDates;
        if (['renderer','notesRenderer','note'].includes(profile.kind)) return cfg.references;
        return cfg.auxiliaryTemplates;
    }
    function translationDate(value,warn) {
        const v=value.trim();
        if(/^\{\{[\s\S]*\}\}$/.test(v)) {
            const profile=translationProfile(v);
            if(profile?.kind==='date' && !profile.birth) {
                const migrated=migrateForeignTemplate(v,{...DEFAULTS,dates:true,birthDates:true});
                if(migrated && !migrated.blocked)return normalizeDate(migrated.text,warn);
            }
        }
        // Os pontos e o ordinal francês são interpretados somente em campos de data.
        const normalized=v.replace(/^(\d{1,2})er\s+/i,'$1 ').replace(/^(\d{1,2})\.\s+(?=[\p{L}])/u,'$1 ');
        return normalizeDate(normalized,warn);
    }
    function migrateForeignTemplate(raw,cfg,choiceTarget) {
        const profile=translationProfile(raw); if(!profile || !translationEnabled(profile,cfg)) return null;
        const p=parsedTemplate(raw), entries=foreignEntries(p), issues=[];
        let target=choiceTarget || profile.target;
        const message=text=>{if(!issues.includes(text))issues.push(text);};
        const fields=ownDictionary(profile.fields);
        const original=key=>entries.find(e=>norm(e.key)===norm(key) && e.value.trim());
        if(profile.source.language==='fr' && original('auteur institutionnel') && entries.some(e=>/^(?:auteur|nom|prénom)\d*$/.test(norm(e.key)) && e.value.trim()))
            message('Autor institucional e nomes pessoais presentes juntos. Confira os créditos de autoria.');
        if(profile.kind==='date') {
            const pos=entries.filter(e=>e.positional || /^\d+$/.test(e.key));
            const day=pos.find(e=>e.key==='1')?.value.trim().replace(/^1er$/,'1'), month=pos.find(e=>e.key==='2')?.value.trim(), year=pos.find(e=>e.key==='3')?.value.trim();
            const m=/^\d+$/.test(month || '')?Number(month):MONTHS[norm(month || '')];
            const named=entries.filter(e=>!e.positional && !/^\d+$/.test(e.key) && e.value.trim());
            const age=named.find(e=>['âge','age'].includes(norm(e.key)));
            const simple=named.every(e=>['âge','age','liens'].includes(norm(e.key)) && ['oui','non','yes','no','1','0'].includes(norm(e.value)));
            if(pos.length===3 && /^\d+$/.test(day || '') && /^\d{4}$/.test(year || '') && validDate(Number(day),m,Number(year)) && simple) {
                target=profile.birth?'Dni':'DataExt';
                if(!profile.birth && age && ['oui','yes','1'].includes(norm(age.value)))return {profile,blocked:true,issues:['Cálculo de idade fora de uma data de nascimento requer revisão.'],candidate:raw,text:raw};
                const candidate='{{'+target+'|'+Number(day)+'|'+m+'|'+year+(target==='Dni' && !(age && ['oui','yes','1'].includes(norm(age.value)))?'|si':'')+'}}';
                return {profile,candidate,text:candidate,blocked:false,issues:[]};
            }
            return {profile,blocked:true,issues:['Data parcial, calendário ou formato sem equivalência confirmada.'],candidate:raw,text:raw};
        }
        if(profile.ambiguousWork && original(profile.ambiguousWork)) {
            if(!choiceTarget)message('Sammelwerk pode ser livro, revista ou jornal. Escolha o tipo de publicação.');
            if(target==='Citar livro') {fields.titel='capítulo';fields.sammelwerk='título';}
            else {fields.sammelwerk=target==='Citar jornal'?'jornal':'periódico';}
        }
        if(profile.kind==='infobox' && profile.source.language==='fr' && /biographie/i.test(profile.source.title))
            message('A infocaixa francesa pode exibir dados do Wikidata que não estão no código. Confira a prévia antes de substituir.');
        if(profile.kind==='list' && profile.variadic) {
            const positions=entries.filter(e=>e.positional || /^\d+$/.test(e.key));
            if(positions.every(e=>!/[\r\n]/.test(e.value.trim()))) {
                if(positions.length) {positions[0].key='1';positions[0].positional=true;positions[0].value='\n'+positions.map(e=>'* '+e.value.trim()).join('\n')+'\n';positions.slice(1).forEach(e=>e.remove=true);}
            } else message('Lista com entradas em mais de uma linha requer revisão.');
        }
        if (profile.nativeRenderer && entries.some(e => LEGACY_REFERENCE_COLUMNS.has(norm(e.key)) && e.value.trim())) {
            return {profile, blocked: true, candidate: raw, text: raw,
                issues: ['Parâmetro antigo de colunas ignorado pela predefinição atual. A configuração não foi ativada automaticamente. Confira a sugestão de duas colunas ou da apresentação automática.']};
        }
        if(profile.columnLayout) {
            const layout=[];
            for(const e of entries) {
                const k=norm(e.key),v=e.value.trim();
                if(k==='colonnes' || profile.nativeRenderer && ['col','cols','colunas'].includes(k) || !profile.nativeRenderer && /^1$/.test(k)) {
                    if(/^[1-6]$/.test(v)){layout.push('column-count:'+v);e.remove=true;}
                    else if(v)message('Número de colunas não confirmado: '+v+'.');
                } else if(k==='taille' || ['colwidth','largcol','larguracol'].includes(k)) {
                    if(/^\d+(?:\.\d+)?(?:em|px)?$/.test(v)){layout.push('column-width:'+v+(/(?:em|px)$/.test(v)?'':'em'));e.remove=true;}
                    else if(v)message('Largura de colunas não confirmada: '+v+'.');
                }
            }
            if(layout.length){entries.push({index:p.parts.length,key:'estilo',value:layout.join(';')+';',lead:'',eq:'=',generated:true});p.parts.push('');}
        }
        let dateFields=[];
        if(profile.dateParts) {
            const [dayKey,monthKey,yearKey]=profile.dateParts, day=original(dayKey), month=original(monthKey), year=original(yearKey);
            if(month || day) {
                const m=month && (/^\d+$/.test(month.value.trim())?Number(month.value):MONTHS[norm(month.value).replace(/\.$/,'')]);
                if(year && /^\d{4}$/.test(year.value.trim()) && m && (!day || /^\d+$/.test(day.value.trim()) && validDate(Number(day.value),m,Number(year.value)))) {
                    if(original('date') || original('datum'))message('Data completa e componentes de data presentes ao mesmo tempo.');
                    else {
                        dateFields=[day,month,year].filter(Boolean);dateFields.forEach(e=>e.remove=true);
                        entries.push({index:p.parts.length,key:'data',value:day?Number(day.value)+' de '+MONTH_PT[m]+' de '+year.value.trim():MONTH_PT[m]+' de '+year.value.trim(),lead:'',eq:'=',generated:true});p.parts.push('');
                    }
                } else message('Componentes de data incompletos ou inválidos.');
            }
        }
        const targetProfile=INFOBOX_CATALOG[norm(target)] || TEMPLATE_CATALOG[norm(target)];
        const citationKeys=CITATION_KEY_CATALOG[norm(target)] || CS1_KEYS;
        function accepts(key) {
            if(profile.kind==='citation')return citationKeys.includes(key) || citationKeys.includes(key.replace(/\d+$/,'#'));
            if(profile.kind==='infobox')return !!targetProfile && infoboxAccepts(targetProfile,key);
            const local={Oficial:['1','nome'],Lang:['1','2'],Nre:['1','nome','grupo','conteúdo','name','group','reference','content','text','referência','texto'],
                Referências:['grupo','refs','título','estilo','nível','estilolista','extra'],Notas:['grupo','refs'],
                'Lista simples':['1','classe','estilo','indent','indentação'],
                'Controle de autoridade': AUTHORITY_ARGUMENTS}[target];
            return local?local.includes(key):!!targetProfile && infoboxAccepts(targetProfile,key);
        }
        const subtitles=[];
        for(const e of entries) {
            if(e.remove || e.generated)continue;
            const key=norm(e.key), value=e.value.trim();
            if(profile.subtitles?.[key]) {subtitles.push({entry:e,target:profile.subtitles[key]});continue;}
            if(e.positional || /^\d+$/.test(key)) {
                if(profile.kind==='list') {
                    if(e.index===1 && /(?:^|\n)\s*[*#]/.test(e.value)) {e.key='1';e.positional=true;}
                    else if(value)message('A lista sem marcadores requer conversão das entradas antes de usar Lista simples.');
                } else if(profile.maxPos!==undefined && Number(key)<=profile.maxPos) {e.positional=true;}
                else if(value)message('Parâmetro posicional sem equivalência: '+e.key+'.');
                continue;
            }
            let mapped=fields[key];
            if(!mapped && profile.numbered) {
                const match=key.match(/^(.*?)(\d+)$/);
                if(match && profile.numbered[match[1]])mapped=profile.numbered[match[1]]+match[2];
            }
            if(!mapped && profile.kind==='citation') {
                if(/^(?:doi|isbn\d*|issn\d*|pmid|pmc|oclc|jstor|bibcode|arxiv|zbl|lccn|hdl|s2cid|volume|url|ref)$/.test(key))mapped=key;
                else if(accepts(e.key))mapped=citationParam(e.key,nameOf(target));
            }
            if(!mapped && accepts(e.key))mapped=e.key;
            // group é aceito em Nre e conserva o grupo no ramo nomeado
            // da revisão local 68628864, que não emite grupo nesse ramo.
            if(norm(target)==='nre'&&mapped==='grupo')mapped='group';
            if(!mapped || !accepts(mapped)) {
                if(value)message('Campo sem equivalência confirmada: '+e.key+'.');
                continue;
            }
            e.key=mapped;e.positional=false;
            if(['data','ano','acessodata','arquivodata'].includes(mapped) && cfg.dates) e.value=translationDate(e.value,message);
            if(['nascimento_data','morte_data','lançamento'].includes(mapped) && cfg.dates && !/[{}]/.test(e.value))e.value=translationDate(e.value,message);
            if(mapped==='língua' && LANGUAGE_CODES[norm(value)])e.value=LANGUAGE_CODES[norm(value)];
            if(mapped==='urlmorta' || ['subscricao','registro'].includes(mapped)) {
                const bool=norm(value);
                if(['sí','si','yes','ja','oui','sim','true','1'].includes(bool))e.value='sim';
                else if(['no','nein','non','não','false','0','off','-'].includes(bool))e.value='não';
                else if(value)message('Estado da ligação ou de acesso requer revisão: '+e.key+'='+value+'.');
            }
            if(mapped==='acessourl' && profile.source.language==='fr') {
                const levels={inscription:'registo',payant:'subscrição','limité':'limitado'};
                if(levels[norm(value)])e.value=levels[norm(value)];else if(value)message('Condição de acesso francesa sem equivalente confirmado: '+value+'.');
            }
            if(key==='et al.') {
                if(['oui','yes','sim','1'].includes(norm(value)))e.value='et al';else if(value)message('Valor de et al. requer revisão.');
            }
            if(mapped==='duração') {
                const duration=value.match(/^(\d+)\s*(?:minutes?|minutos?|minuten|min\.?|mn)?$/i);
                if(duration)e.value=duration[1];else if(value)message('Unidade de duração não confirmada.');
            }
            if(mapped==='url' && value && !/^(?:https?:\/\/|\/\/|\{\{)/i.test(value))message('O campo '+e.key+' contém texto ou uma ligação formatada, não apenas uma URL.');
            if(norm(target)==='nre' && mapped==='group' && !['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'].includes(value))
                message('Grupo de nota não suportado por Nre: '+value+'.');
        }
        for(const subtitle of subtitles) {
            const title=entries.find(e=>!e.remove && e.key===subtitle.target && e!==subtitle.entry);
            if(title?.value.trim()) {title.value=title.value.trim()+(/[:.,]$/.test(title.value.trim())?' ':': ')+subtitle.entry.value.trim();subtitle.entry.remove=true;}
            else if(subtitle.entry.value.trim())message('Subtítulo sem título correspondente.');
        }
        if(profile.kind==='notesRenderer') {
            const group=entries.find(e=>e.key==='grupo')?.value.trim() || profile.defaultGroup || 'lower-alpha';
            if(!original('group') && !original('groupe')) {entries.push({index:p.parts.length,key:'grupo',value:group,lead:'',eq:'='});p.parts.push('');}
            if(group!=='nota' && group!=='lower-alpha')target='Referências';
            if(target==='Referências'){entries.push({index:p.parts.length,key:'título',value:'Notas',lead:'',eq:'='});p.parts.push('');}
        }
        const seen=new Map();
        for(const e of entries.filter(e=>!e.remove)) {
            const family=e.positional?e.key:parameterFamily(e.key);
            if(seen.has(family)) {if(seen.get(family).value.trim()===e.value.trim())e.remove=true;else message('Campos conflitantes para '+e.key+'.');}
            else seen.set(family,e);
        }
        if(norm(p.parts[0])!==norm(target))p.parts[0]=target;
        const candidate=translatedEntries(p,entries);
        return {profile,candidate,issues,blocked:issues.length>0,text:issues.length?raw:candidate};
    }
    function multilingualTemplate(raw,cfg,bump,warn) {
        if(cfg.multilingual && cfg.infoboxes) {
            const p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name] || translationProfile(raw);
            if(INFOBOX_CATALOG[p.name] || profile?.kind==='infobox') {
                const entries=foreignEntries(p);let changed=false;
                for(const e of entries)if(/^(?:imagem|image|foto|capa|logo|logotipo|assinatura|imagem_mapa\d*)$/i.test(e.key)) {
                    const value=stripImportedFilePrefix(e.value);
                    if(value!==e.value){e.value=value;changed=true;bump('translatedNamespaces');}
                }
                if(changed)raw=translatedEntries(p,entries);
            }
        }
        const magic=magicTemplate(raw,cfg,bump); if(magic) return magic;
        const migration=migrateForeignTemplate(raw,cfg);if(!migration)return {text:raw,handled:false};
        if(migration.blocked)warn((migration.profile.nativeRenderer ? 'Conferir colunas de ' : 'Rever tradução de ')+parsedTemplate(raw).parts[0].trim()+': '+migration.issues.join(' '));
        else if(raw!==migration.text)bump('translatedTemplates');
        return {...migration,handled:true};
    }
    function foreignSyntax(s,cfg,bump,warn) {
        if(!cfg.multilingual || !cfg.links)return s;
        if(cfg.auxiliaryTemplates)for(const [alias,rule] of Object.entries(TRANSLATION_RULES.magicAliases)) {
            if(alias.startsWith('__')) {
                const protectedRanges=structuralRanges(s), edits=[];let at=0;
                while((at=s.indexOf(alias,at))>=0){if(!inRange(at,protectedRanges))edits.push({start:at,end:at+alias.length,text:rule.target});at+=alias.length;}
                s=applyEdits(s,edits);
            }
            else if(rule.kind==='redirect' && s.startsWith(alias+' '))s=rule.target+s.slice(alias.length);
        }
        const edits=[],stack=[],links=[];
        for(let i=0;i<s.length-1;i++) {
            if(s.slice(i,i+2)==='[['){stack.push(i);i++;}
            else if(s.slice(i,i+2)===']]' && stack.length){links.push({start:stack.pop(),end:i+2});i++;}
        }
        for(const r of links) {
            const raw=s.slice(r.start+2,r.end-2), parts=splitParts(raw), match=parts[0].match(/^(\s*:?[ \t]*)([^:\n]+):([\s\S]*)$/);
            if(!match)continue;
            const namespace=Object.entries(TRANSLATION_RULES.namespaceAliases).find(([n])=>norm(n)===norm(match[2]));
            let changed=parts.slice();
            if(namespace) {
                changed[0]=match[1]+namespace[1]+':'+match[3];bump('translatedNamespaces');
                if(namespace[1]==='Categoria')warn('Espaço nominal da categoria corrigido. Confira o título na ptwiki: '+match[3].trim()+'.');
            }
            const image=namespace?.[1] === 'Ficheiro' || /^(?:Ficheiro|Arquivo|File|Image|Imagem)$/i.test(match[2]);
            if(image && !match[1].includes(':')) for(let i=1;i<parts.length;i++) {
                const option=parts[i].trim();
                for(const [alias,rule] of Object.entries(TRANSLATION_RULES.imageOptions)) {
                    if(alias.includes('$1')) {
                        const [prefix,suffix]=alias.split('$1');
                        if(option.startsWith(prefix) && option.endsWith(suffix) && option.length>=prefix.length+suffix.length) {
                            changed[i]=rule.target.replace('$1',option.slice(prefix.length,suffix?option.length-suffix.length:undefined));
                            if(changed[i]!==parts[i])bump('translatedImageOptions');break;
                        }
                    } else if(option===alias) {changed[i]=rule.target;if(changed[i]!==parts[i])bump('translatedImageOptions');break;}
                }
            }
            if(changed.join('|')!==raw)edits.push({start:r.start,end:r.start+2+parts[0].length,text:'[['+changed[0]});
            // Alterar somente opções escalares. As legendas com ligações aninhadas ficam intactas.
            let offset=r.start+2+parts[0].length;
            for(let i=1;i<parts.length;i++){offset++;if(changed[i]!==parts[i])edits.push({start:offset,end:offset+parts[i].length,text:changed[i]});offset+=parts[i].length;}
        }
        return applyEdits(s,edits);
    }
    function normalizeGallery(raw) {
        if(!/^<gallery\b/i.test(raw))return raw;
        return raw.replace(/(^|\n)([ \t]*)([^:\n]+):/g, (all, line, spaces, prefix) =>
            Object.entries(TRANSLATION_RULES.namespaceAliases).some(([k,v]) => norm(k)===norm(prefix) && v==='Ficheiro') ? line+spaces+'Ficheiro:' : all);
    }
    function gallerySyntax(source,cfg,bump) {
        if(!cfg.multilingual || !cfg.links)return source;
        const shield=maskProtected(source,()=>{}),edits=[];
        for(const m of shield.text.matchAll(/\uE000AJGX*\d+\uE001/g)) {
            const raw=shield.restore(m[0]),after=normalizeGallery(raw);
            if(after!==raw) {
                const start=shield.restore(shield.text.slice(0,m.index)).length;
                edits.push({start,end:start+raw.length,text:after});bump('translatedNamespaces');
            }
        }
        return applyEdits(source,edits);
    }
    function translationAudit(source) {
        const s=protectedView(source),findings=[];
        for(const n of templates(s).nodes) {
            const raw=s.slice(n.start,n.end),p=parsedTemplate(raw),profile=translationProfile(raw);
            if(profile && norm(p.parts[0])!==norm(profile.target))findings.push({code:'foreign-template',start:n.start,end:n.end,
                message:'Modelo de outra Wikipédia ainda presente: '+p.parts[0].trim()+'. Confira a sugestão de migração.'});
            else if(/^(?:modèle|modele|vorlage|plantilla)\s*:/i.test(p.parts[0]) || /^(?:infobox |ficha de |fiche )/i.test(p.name) ||
                ['portail','autres projets','article détaillé','loupe','référence nécessaire','lien mort','webarchiv','toter link','belege fehlen'].includes(p.name))
                findings.push({code:'foreign-unknown',start:n.start,end:n.end,message:'Modelo estrangeiro sem conversão confirmada: '+p.parts[0].trim()+'.'});
            if(p.name==='citation' && p.parts.length===2 && !p.parts[1].includes('='))findings.push({code:'ambiguous-citation',start:n.start,end:n.end,
                message:'Citation com texto posicional pode ser uma citação francesa. Confira se deve usar Citação, pois Citation na ptwiki é bibliográfica.'});
            if(['lien','ill','interlanguage link','interlanguage link multi'].includes(p.name))findings.push({code:'foreign-interwiki-helper',start:n.start,end:n.end,
                message:'Ligação entre idiomas depende de adaptação dos títulos e da existência do artigo na ptwiki: '+p.parts[0].trim()+'.'});
        }
        for(const finding of internationalDiagnostics(source)) if(!findings.some(f=>f.start===finding.start && f.code===finding.code))findings.push(finding);
        return findings;
    }
    function multilingualSuggestions(source,cfg) {
        if(!cfg.multilingual || !cfg.review)return [];
        const shield=maskProtected(source,()=>{}),s=shield.text,proposals=[];
        for(const n of templates(s).nodes) {
            const raw=s.slice(n.start,n.end),migration=migrateForeignTemplate(raw,cfg);
            if(!migration?.blocked || proposals.length>=60)continue;
            let choices=[];
            if(migration.profile.ambiguousWork && raw.includes('Sammelwerk')) choices=['Citar livro','Citar periódico','Citar jornal'].map(target=>({
                label:'Migrar como '+target+', conferir os campos',after:migrateForeignTemplate(raw,cfg,target).candidate}));
            else if(migration.candidate!==raw)choices=[{label:'Migrar os campos reconhecidos e revisar os restantes',after:migration.candidate}];
            if(choices.length)proposals.push({id:'translation-'+proposals.length,start:n.start,end:n.end,before:raw,
                label:'Traduzir '+parsedTemplate(raw).parts[0].trim()+': '+migration.issues.join(' '),choices});
        }
        return proposals;
    }

    function usedNoteGroups(s) {return noteGroupInventory(s).groups;}
    function unifiedNotesReferences(s,cfg,bump,warn) {
        if(!cfg.references || !cfg.unifiedNotesReferences)return s;
        const groups=usedNoteGroups(s);
        if(!groups.size)return s;
        if([...groups].some(g=>!['nota','Nota','nt','lower-alpha'].includes(g))) {
            warn('Notas e referências não foi aplicado: há grupos que essa predefinição não reúne. As listas foram preservadas.');return s;
        }
        const renderers=[];
        for(const n of topNodes(s)) {
            const p=parsedTemplate(s.slice(n.start,n.end)),entries=foreignEntries(p),map={};entries.forEach(e=>map[norm(e.key)]=e.value.trim());
            if(!['notas','referências','notas e referências'].includes(p.name))continue;
            if(p.name==='notas e referências')return s;
            const lineStart=s.lastIndexOf('\n',n.start-1)+1,nextNL=s.indexOf('\n',n.end),lineEnd=nextNL<0?s.length:nextNL;
            if(s.slice(lineStart,n.start).trim() || s.slice(n.end,lineEnd).trim())continue;
            const allowed=entries.every(e=>!e.value.trim() || ['grupo','título','nível'].includes(norm(e.key)) &&
                (norm(e.key)==='grupo'?['nota','lower-alpha','Nota','nt'].includes(e.value.trim()):norm(e.key)==='nível'?['0','2','3'].includes(e.value.trim()):['notas','referências'].includes(norm(e.value))));
            renderers.push({...n,name:p.name,notes:p.name==='notas'||!!map.grupo,allowed});
        }
        if(renderers.length<2 || !renderers.some(r=>r.notes) || renderers.filter(r=>!r.notes).length!==1)return s;
        if(renderers.some(r=>!r.allowed)) {warn('Listas com definições ou configurações próprias foram preservadas. Confira a reunião de notas e referências manualmente.');return s;}
        const first=renderers[0],last=renderers.at(-1);
        let start=first.start,end=last.end;
        const preceding=s.slice(0,start).match(/(?:^|\n)==\s*(?:Notas|Referências)\s*==[ \t]*\n\s*$/i);
        if(preceding)start=preceding.index+(preceding[0].startsWith('\n')?1:0);
        const segment=s.slice(start,end);
        let skeleton=applyEdits(segment,renderers.map(r=>({start:r.start-start,end:r.end-start,text:''})));
        skeleton=skeleton.replace(/^==\s*(?:Notas|Referências|Notas e referências)\s*==[ \t]*$/gmi,'');
        if(skeleton.trim()) {warn('As listas de notas e referências têm conteúdo entre elas. A reunião exige revisão manual.');return s;}
        bump('unifiedNotesReferences');
        return s.slice(0,start)+'{{Notas e referências}}'+s.slice(end);
    }
    const LEGACY_REFERENCE_COLUMNS = new Set(['col', 'cols', 'colunas', 'colwidth', 'largcol', 'larguracol']);
    function legacyReferenceColumnSuggestions(source, cfg) {
        if (!cfg.review || !cfg.references) return [];
        const shield = maskProtected(source, () => {}), s = shield.text, proposals = [];
        for (const n of templates(s).nodes) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
            if (!['referências', 'referencias'].includes(p.name) || raw.includes('\uE000')) continue;
            const entries = foreignEntries(p), old = entries.filter(e => LEGACY_REFERENCE_COLUMNS.has(norm(e.key)));
            if (!old.some(e => e.value.trim())) continue;
            const clean = entries.map(e => old.includes(e) ? {...e, remove: true} : {...e});
            const styles = clean.filter(e => !e.remove && norm(e.key) === 'estilo');
            const choices = [];
            if (styles.length <= 1 && !styles.some(e => /[{}<>\uE000]/.test(e.value))) {
                const two = clean.map(e => ({...e})), style = two.find(e => !e.remove && norm(e.key) === 'estilo');
                if (style) style.value = style.value.replace(/(?:^|;)\s*(?:(?:-moz-|-webkit-)?column-(?:count|width)|columns)\s*:[^;]*/gi, '').replace(/^;+|;+$/g, '').trim() + ';column-count:2;';
                else { p.parts.push(''); two.push({index: p.parts.length - 1, key: 'estilo', value: 'column-count:2;', lead: '', eq: '='}); }
                choices.push({label: 'Usar duas colunas nas referências', after: translatedEntries(p, two)});
                if (!style) p.parts.pop();
            }
            choices.push({label: 'Remover configuração antiga e usar colunas automáticas', after: translatedEntries(p, clean)});
            proposals.push({id: 'legacy-reference-columns-' + proposals.length, start: n.start, end: n.end, before: raw,
                label: 'Configuração antiga de colunas em Referências: confirme a apresentação', choices});
        }
        return proposals;
    }
    const REFERENCE_COLUMN_MINIMUM = 6;
    function referenceEntryCounts(source) {
        const s = protectedView(source), lists = rendererRanges(s), groups = new Map();
        const bucket = group => { if (!groups.has(group)) groups.set(group, new Set()); return groups.get(group); };
        for (const r of refTokens(s)) {
            const attrs = attrsOf(r.attrs);
            if (!attrs || attrs.follow || attrs.details || /[{}\uE000]/.test((attrs.group || '') + (attrs.name || ''))) continue;
            const parent = lists.find(n => n.start <= r.start && r.end <= n.end);
            if (parent && r.body !== null) continue;
            let group = attrs.group || '';
            if (!group && parent) {
                const raw = s.slice(parent.start, parent.end);
                if (raw.startsWith('<')) group = attrsOf(tagAt(raw, 0).attrs)?.group || '';
                else group = foreignEntries(parsedTemplate(raw)).find(e => ['grupo','group'].includes(norm(e.key)))?.value.trim() || '';
            }
            bucket(group).add(attrs.name ? 'named:' + attrs.name : 'anonymous:' + r.start);
        }
        for (const n of templates(s).nodes) {
            const p = parsedTemplate(s.slice(n.start, n.end));
            if (!['sfn','sfnp','sfnm','sfnmp'].includes(p.name)) continue;
            const entries = foreignEntries(p), group = entries.find(e => ['grupo','group'].includes(norm(e.key)))?.value.trim() || '';
            if (/[{}\uE000]/.test(group)) continue;
            bucket(group).add('short:' + p.name + '|' + entries.map(e => e.key + '=' + e.value.trim()).join('|'));
        }
        return Object.fromEntries([...groups].map(([name, entries]) => [name, entries.size]));
    }
    function referenceColumnPlans(source, options = {}) {
        const cfg = {...DEFAULTS, ...options}, shield = maskProtected(source, () => {}), s = shield.text;
        const counts = referenceEntryCounts(source), ranges = structuralRanges(s), plans = [];
        if (!cfg.references || !cfg.referenceColumns) return plans;
        for (const n of topNodes(s)) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
            if (!['referências','referencias','notas e referências'].includes(p.name) ||
                inRangeExcept(n.start,ranges,n.start,n.end)) continue;
            const entries = foreignEntries(p), combined = p.name === 'notas e referências';
            const groups = combined ? [] : entries.filter(e => ['grupo','group'].includes(norm(e.key)));
            const group = groups[0]?.value.trim() || '', count = counts[group] || 0;
            let reason = '', code = '', after;
            if (cfg.sectionOnly) { code = 'columns-section'; reason = 'Colunas mantidas: a edição de uma seção não permite contar as referências da página inteira.'; }
            else if (groups.length > 1 || /[{}\uE000]/.test(group)) { code = 'columns-group'; reason = 'Colunas mantidas: o grupo de referências precisa de revisão.'; }
            else if (count < REFERENCE_COLUMN_MINIMUM) {
                if (!count) continue;
                code = 'columns-short'; reason = 'Referências mantidas sem colunas fixas: ' + count + (count === 1 ? ' entrada reconhecida' : ' entradas reconhecidas') + ', mínimo de seis.';
            } else if (combined) {
                const cols = entries.filter(e => ['col_ref','ref_col'].includes(e.key));
                if (cols.length > 1 || cols.some(e => /[{}\uE000]/.test(e.value))) {
                    code = 'columns-custom'; reason = 'Colunas mantidas: Notas e referências tem uma configuração própria que precisa de revisão.';
                } else if (cfg.noteReferenceColumnsSupported !== true) {
                    code = 'columns-template'; reason = cfg.referenceColumnLookupWarning || 'Duas colunas não aplicadas: a predefinição Notas e referências ainda não confirmou suporte a col_ref.';
                } else if (cols[0]?.value.trim()) {
                    if (cols[0].value.trim() === '2') continue;
                    code = 'columns-custom'; reason = 'Colunas mantidas: Notas e referências já tem uma quantidade definida manualmente.';
                } else {
                    if (cols.length) cols[0].value = '2';
                    else { entries.push({index:p.parts.length,key:'col_ref',value:'2',lead:'',eq:'='}); p.parts.push(''); }
                    after = translatedEntries(p, entries);
                }
            } else {
                const old = entries.filter(e => LEGACY_REFERENCE_COLUMNS.has(norm(e.key)) && e.value.trim());
                const styles = entries.filter(e => norm(e.key) === 'estilo' || e.key === '5');
                if (old.length) { code = 'columns-legacy'; reason = 'Colunas mantidas: há parâmetros antigos ignorados por Referências. Use a sugestão de revisão para escolher a apresentação.'; }
                else if (styles.length > 1 || styles.some(e => /[{}<>\uE000]/.test(e.value))) {
                    code = 'columns-custom'; reason = 'Colunas mantidas: o estilo da lista precisa de revisão.';
                } else if (styles.some(e => /(?:^|;)\s*(?:(?:-moz-|-webkit-)?column-(?:count|width)|columns)\s*:/i.test(e.value))) {
                    if (styles.every(e=>/(?:^|;)\s*column-count\s*:\s*2\s*(?:;|$)/i.test(e.value))) continue;
                    code='columns-configured';reason='Referências preservadas: já existe uma configuração de colunas definida no estilo.';
                }
                else {
                    if (styles.length) styles[0].value = styles[0].value.replace(/;+\s*$/,'').trim() + (styles[0].value.trim() ? ';' : '') + 'column-count:2;';
                    else { entries.push({index:p.parts.length,key:'estilo',value:'column-count:2;',lead:'',eq:'='}); p.parts.push(''); }
                    after = translatedEntries(p, entries);
                }
            }
            if(after){
                // Conferir se o parâmetro novo continua fora do texto das referências.
                const check=foreignEntries(parsedTemplate(after)),fields=check.filter(e=>combined?['col_ref','ref_col'].includes(e.key):norm(e.key)==='estilo'||e.key==='5');
                if(fields.length!==1||!(combined?fields[0].value.trim()==='2':/(?:^|;)\s*column-count\s*:\s*2\s*(?:;|$)/i.test(fields[0].value)))continue;
            }
            plans.push({start:n.start,end:n.end,before:raw,after,group,count,code,message:reason});
        }
        return plans;
    }
    function referenceColumns(source, cfg, bump) {
        const shield=maskProtected(source,()=>{});
        const edits = referenceColumnPlans(shield.text, cfg).filter(p => p.after).map(p => ({start:p.start,end:p.end,text:p.after}));
        if (edits.length) bump('referenceColumns');
        return shield.restore(applyEdits(shield.text, edits));
    }
    function notAppliedReasons(source, options = {}) {
        const cfg = {...DEFAULTS, ...options}, findings = referenceColumnPlans(source, cfg).filter(p => p.message)
            .map(p => ({code:p.code,message:p.message,start:p.start}));
        if (cfg.endMatterColumns) {
            const shield = maskProtected(source, () => {}), s = shield.text, ranges = structuralRanges(s);
            const heads = [...s.matchAll(/^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm)].filter(h => !inRange(h.index,ranges));
            for (let i=0;i<heads.length;i++) {
                const h=heads[i], title=norm(h[2]); if (!END_MATTER_COLUMN_SECTIONS.has(title)) continue;
                const body=s.slice(h.index+h[0].length,heads[i+1]?.index || s.length);
                if (/\{\{\s*(?:Div col|InícioRef|InicioRef|Colunas|Multicol)\b/i.test(body)) continue;
                const rows=body.match(/^\*(?!\*)[ \t]*\S.*$/gm)||[];
                if (rows.length && rows.length<END_MATTER_COLUMN_MINIMUM) findings.push({code:'columns-list-short',start:h.index,
                    message:'A lista de '+h[2].trim()+' ficou sem colunas fixas: '+rows.length+(rows.length===1?' entrada':' entradas')+', mínimo de seis.'});
            }
        }
        return findings.slice(0,12);
    }
    function noteReferenceColumnConfirmation(response) {
        if (typeof response?.parse?.text !== 'string' || (response.parse.parsewarnings || []).length) return false;
        const html=response.parse.text;
        return /class="[^"]*\breflist\b[^"]*"[^>]*style="[^"]*\bcolumn-count\s*:\s*2\s*(?:;|"|$)/i.test(html) ||
            /style="[^"]*\bcolumn-count\s*:\s*2\s*;[^"]*"[^>]*class="[^"]*\breflist\b/i.test(html);
    }

    const END_MATTER_COLUMN_SECTIONS = new Set(['ligações externas', 'bibliografia', 'leitura adicional', 'leitura complementar']);
    const END_MATTER_COLUMN_MINIMUM = 6;
    function endMatterColumnBlocks(source) {
        const shield = maskProtected(source, () => {}), s = shield.text, ranges = structuralRanges(s);
        const heads = [...s.matchAll(/^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm)].filter(h => !inRange(h.index, ranges)), blocks = [], unwraps = [], warnings = [];
        const wrappers = /\{\{\s*(?:Div col|Div col fim|-fim|InícioRef|InicioRef|Refbegin|Colunas(?:-lista)?|Multicol|column|col-break)\b|<\s*(?:div|table)\b/i;
        const footer = /\[\[\s*(?:Categoria|Category|Ficheiro|Imagem|File|Image)\s*:|\{\{\s*(?:Portal\d*|Controle de autoridade|DEFAULTSORT|Info\/|Navbox|Navegação|Commonscat|Commons)\b/i;
        const isEntry = row => /^\*(?!\*)[ \t]*\S/.test(row.line) && !inRange(row.start, ranges);
        function lineRows(start, end) {
            let offset = start;
            return (s.slice(start, end).match(/[^\n]*(?:\n|$)/g) || []).filter(Boolean).map(line => {
                const row = {line, start: offset, end: offset + line.length}; offset += line.length; return row;
            });
        }
        function standalone(n) {
            const start = s.lastIndexOf('\n', n.start - 1) + 1, eol = s.indexOf('\n', n.end);
            return !s.slice(start, n.start).trim() && !s.slice(n.end, eol < 0 ? s.length : eol).trim();
        }
        function listOnly(start, end) {
            const rows = lineRows(start, end), count = rows.filter(isEntry).length;
            return {count, valid: count > 0 && rows.every(row => !row.line.trim() || /^\*/.test(row.line) ||
                ranges.some(r => r.start < row.start && r.end > row.start && r.start >= start))};
        }
        for (let i = 0; i < heads.length; i++) {
            const h = heads[i], section = norm(h[2]);
            if (!END_MATTER_COLUMN_SECTIONS.has(section) || inRange(h.index, ranges)) continue;
            const start = h.index + h[0].length, next = heads[i + 1], end = next ? next.index : s.length;
            const body = s.slice(start, end);
            if (wrappers.test(body)) {
                // Apenas pares simples, sem estilos, larguras, HTML ou outros invólucros, podem ser retirados.
                const nodes = topNodes(s).filter(n => n.start >= start && n.end <= end && standalone(n));
                const layout = nodes.filter(n => /^(?:div col|div col fim|-fim|inícioref|inicioref|refbegin|colunas(?:-lista)?|multicol|column|col-break)$/.test(parsedTemplate(s.slice(n.start, n.end)).name));
                const plainPairs = !/<\s*(?:div|table)\b/i.test(body) && layout.length && layout.every(n => {
                    const p = parsedTemplate(s.slice(n.start, n.end));
                    return p.name === 'div col' ? p.parts.length === 2 && /^\s*colunas\s*=\s*2\s*$/.test(p.parts[1]) :
                        ['div col fim', '-fim'].includes(p.name) && p.parts.length === 1;
                });
                let opening = null, validPairs = !!plainPairs, pending = [];
                if (plainPairs) for (const n of layout) {
                    const p = parsedTemplate(s.slice(n.start, n.end));
                    if (p.name === 'div col') { if (opening) { validPairs = false; break; } opening = n; }
                    else {
                        if (!opening) { validPairs = false; break; }
                        const list = listOnly(opening.end, n.start);
                        if (list.valid && list.count < END_MATTER_COLUMN_MINIMUM && !footer.test(s.slice(opening.end, n.start)))
                            pending.push({start: opening.start, end: opening.end, before: s.slice(opening.start, opening.end), after: '', section, count: list.count},
                                {start: n.start, end: n.end, before: s.slice(n.start, n.end), after: '', section, count: list.count});
                        opening = null;
                    }
                }
                if (opening) validPairs = false;
                if (validPairs) unwraps.push(...pending);
                else {
                    const count = lineRows(start, end).filter(isEntry).length;
                    if (count > 0 && count < END_MATTER_COLUMN_MINIMUM && layout.some(n => {
                        const p = parsedTemplate(s.slice(n.start, n.end));
                        return p.name === 'div col' || ['inícioref','inicioref','refbegin'].includes(p.name) && p.parts.slice(1).some(part =>
                            /^\s*(?:colwidth|larguracol|largcol)\s*=\s*\S/i.test(part) || !part.includes('=') && part.trim() && part.trim() !== '1');
                    })) warnings.push('Lista de ' + section + ' com menos de seis itens e configuração própria de colunas. A formatação foi preservada para revisão.');
                }
                continue;
            }
            const lines = lineRows(start, end); let block = [];
            function finish() {
                while (block.length && !block.at(-1).line.trim()) block.pop();
                const entries = block.filter(isEntry);
                if (entries.length < END_MATTER_COLUMN_MINIMUM) { block = []; return; }
                const from = block[0].start, to = block.at(-1).end, before = block.map(x => x.line).join('');
                const crossing = ranges.some(r => r.start < from && r.end > from || r.start < to && r.end > to);
                if (crossing || before.includes('\uE000') || footer.test(before)) { block = []; return; }
                blocks.push({start: from, end: to, before, section, count: entries.length,
                    after: '{{Div col|colunas=2}}\n' + before.replace(/\n$/, '') + '\n{{Div col fim}}\n'});
                block = [];
            }
            for (const row of lines) {
                const continuation = block.length && ranges.some(r => r.start < row.start && r.end > row.start && r.start >= block[0].start);
                if (/^\*/.test(row.line) || block.length && (!row.line.trim() || continuation)) block.push(row);
                else finish();
            }
            finish();
        }
        return {shield, blocks, unwraps, warnings};
    }
    // O conteúdo da lista precisa de 2= quando contém um = fora de código protegido.
    function unprotectedColumnListEquals(body) {
        const literal = maskProtected(body, () => {});
        const s = applyEdits(literal.text, refTokens(literal.text).map(r => ({start:r.start,end:r.end,
            text:literal.text.slice(r.start,r.end).replace(/[^\r\n]/g,' ')})));
        const nested = new Map(templates(s).nodes.filter(n => n.depth === 0).map(n => [n.start,n.end]));
        let inLink = 0;
        for (let i = 0; i < s.length;) {
            if (nested.has(i)) { i = nested.get(i); continue; }
            const tag = tagAt(s, i); if (tag) { i = tag.end; continue; }
            if (s.slice(i,i+2) === '[[') { inLink++; i += 2; continue; }
            if (s.slice(i,i+2) === ']]' && inLink) { inLink--; i += 2; continue; }
            if (s[i] === '=' && !inLink) return true;
            i++;
        }
        return false;
    }
    function repairColumnListArguments(source, bump = () => {}) {
        const shield = maskProtected(source, () => {}), s = shield.text, edits = [];
        for (const n of templates(s).nodes) {
            if (n.depth !== 0) continue;
            const p = parsedTemplate(s.slice(n.start,n.end));
            if (p.name !== 'colunas-lista' || p.parts.length !== 3 || !/^\s*[1-6]\s*$/.test(p.parts[1])) continue;
            const body = p.parts[2];
            if (!/^\s*\*(?!\*)[^\n]*\S/.test(body) ||
                /^[ \t]*(?:={2,}|\{\||\|\}|[;:#])|\{\{\{/m.test(body) || templates(body).unclosed.length) continue;
            if (!unprotectedColumnListEquals(body)) continue;
            const at = n.start + 2 + p.parts[0].length + 1 + p.parts[1].length + 1;
            edits.push({start:at,end:at,text:'2='}); bump('endMatterColumns');
        }
        return shield.restore(applyEdits(s,edits));
    }

    function endMatterColumns(source, cfg, bump, warn = () => {}) {
        if (!cfg.endMatter || !cfg.endMatterColumns) return source;
        source = repairColumnListArguments(source,bump);
        const {shield, blocks, unwraps, warnings} = endMatterColumnBlocks(source);
        warnings.forEach(warn);
        if (!blocks.length && !unwraps.length) return source;
        blocks.forEach(() => bump('endMatterColumns'));
        for (let i = 0; i < unwraps.length; i += 2) bump('endMatterColumns');
        return shield.restore(applyEdits(shield.text, [...blocks, ...unwraps].map(b => ({start: b.start, end: b.end, text: b.after}))));
    }
    function externalColumnsSuggestions(source, cfg) {
        if (!cfg.review || !cfg.externalLinkColumns || !cfg.endMatter) return [];
        const {blocks} = endMatterColumnBlocks(source);
        return blocks.map((b, i) => ({id: 'external-columns-' + i, start: b.start, end: b.end, before: b.before,
            label: 'Dispor ' + b.count + ' itens de ' + b.section + ' em duas colunas',
            choices: [{label: 'Usar duas colunas em ' + b.section, after: b.after}]}));
    }

    // O Cite rejeita nomes compostos apenas por dígitos ASCII, depois de decodificar entidades.
    function decodedReferenceName(value) {
        return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (raw, decimal, hex, named) => {
            if (decimal || hex) {
                const code = parseInt(decimal || hex, decimal ? 10 : 16);
                return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : raw;
            }
            return ({amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0'})[named] ?? raw;
        }).trim();
    }
    function numericReferenceName(value) { return /^\d+$/.test(decodedReferenceName(value)); }

    // Os intervalos apontam só para os valores. Corpos, grupos e demais atributos ficam intactos.
    function rReferenceUses(source) {
        const uses=[];
        for(const n of templates(source).nodes){
            const p=parsedTemplate(source.slice(n.start,n.end));if(p.name!=='r')continue;
            const fields=templateEntries(p),group=fields.find(e=>['group','grupo','g'].includes(norm(e.key)))?.value.trim()||'';
            let cursor=n.start+2,next=1;
            for(let i=0;i<p.parts.length;i++){
                const part=p.parts[i],named=i?biographyNamedPart(part):null;
                const key=i?(named?named.key:String(next++)):'';
                if(i&&/^[1-9]\d*$/.test(key)){
                    const value=named?named.value:part,lead=value.length-value.trimStart().length;
                    const start=cursor+(named?part.indexOf('=')+1:0)+lead,trimmed=value.trim();
                    if(trimmed)uses.push({start,end:start+trimmed.length,value:trimmed,key:'name',group,ownerStart:n.start,ownerEnd:n.end});
                }
                cursor+=part.length+1;
            }
        }
        return uses;
    }

    function referenceNameUses(s) {
        const uses = [];
        for (const r of refTokens(s)) {
            const a = attrsOf(r.attrs); if (!a) continue;
            const opener = tagAt(s, r.start), match = opener.raw.match(/^<\s*ref\b([\s\S]*?)>$/i);
            if (!match) continue;
            const offset = r.start + opener.raw.length - match[1].length - 1;
            const re = /\s+([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
            let m;
            while ((m = re.exec(r.attrs))) {
                const key = m[1].toLowerCase(), value = m[2] ?? m[3] ?? m[4];
                if (!['name', 'follow'].includes(key) || value === undefined) continue;
                const prefix = m[0].match(/^\s+[a-z][a-z0-9-]*\s*=\s*["']?/i)[0];
                const start = offset + m.index + prefix.length;
                uses.push({start, end: start + value.length, value, key, group: a.group || '', ownerStart: r.start, ownerEnd: r.end});
            }
        }
        for (const n of templates(s).nodes) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
            const helper = ['refn', 'nre', 'efn'].includes(p.name), tag = p.name === '#tag:ref';
            if (!helper && !tag) continue;
            const entries = templateEntries(p), group = entries.find(e => ['group', 'grupo'].includes(e.key))?.value.trim() || '';
            let cursor = n.start + 2;
            p.parts.forEach((part, index) => {
                const e = entries.find(e => e.index === index);
                const accepted = tag ? ['name', 'follow'] : p.name === 'refn' ? ['name'] : ['name', 'nome'];
                if (e && accepted.includes(e.key)) {
                    const start = cursor + e.lead.length + e.key.length + e.eq.length;
                    uses.push({start, end: start + e.value.length, value: e.value, key: e.key, group, ownerStart: n.start, ownerEnd: n.end});
                }
                cursor += part.length + 1;
            });
        }
        return uses.concat(rReferenceUses(s)).sort((a, b) => a.start - b.start);
    }
    function normalizeNumericReferenceNames(s, cfg, bump, warn) {
        if (!cfg.references || !cfg.numericRefNames) return s;
        const uses = referenceNameUses(s), numeric = uses.filter(u => numericReferenceName(u.value));
        if (!numeric.length) return s;
        if (cfg.sectionOnly) {
            warn('Nomes numéricos de referências preservados nesta edição de seção. Abra o código da página inteira para atualizar todas as chamadas juntas.');
            return s;
        }
        if (uses.some(u => /[{}\uE000]/.test(u.value))) {
            warn('Nomes numéricos de referências preservados porque há nomes calculados por predefinições ou conteúdo protegido. Confira todas as chamadas antes de renomear.');
            return s;
        }
        const reserved = new Set(uses.map(u => decodedReferenceName(u.value))), mapping = new Map(), blocked = new Set();
        // Um atributo malformado pode esconder outra chamada da mesma família.
        for (const r of refTokens(s)) if (!attrsOf(r.attrs)) {
            const re = /\b(?:name|follow)\s*=\s*["']?((?:\d|&#(?:\d+|x[\da-f]+);)+)/gi; let m;
            while ((m = re.exec(r.attrs))) if (numericReferenceName(m[1])) blocked.add(decodedReferenceName(m[1]));
        }
        for (const u of numeric) {
            const name = decodedReferenceName(u.value);
            if (blocked.has(name)) { warn('Nome numérico "' + name + '" preservado porque há um atributo de referência malformado. Confira todas as chamadas.'); continue; }
            if (mapping.has(name)) continue;
            const base = 'ref-' + name; let target = base, suffix = 2;
            while (reserved.has(target)) target = base + '-' + suffix++;
            mapping.set(name, target); reserved.add(target);
        }
        const edits = numeric.filter(u => mapping.has(decodedReferenceName(u.value))).map(u => {
            bump('numericRefNames'); return {start: u.start, end: u.end, text: mapping.get(decodedReferenceName(u.value))};
        });
        return applyEdits(s, edits);
    }
    function numericReferenceAudit(source) {
        return referenceNameUses(protectedView(source)).filter(u => numericReferenceName(u.value)).map(u => ({
            code: 'numeric-reference-name', severity: 'error', start: u.start,
            message: 'Nome de referência composto apenas por números: "' + decodedReferenceName(u.value) + '". Use um nome com letras e atualize todas as chamadas.'
        }));
    }
    function citationRepairSuggestions(source, cfg) {
        if (!cfg.review || !cfg.citations || !cfg.citationRepairs) return [];
        const shield = maskProtected(source, () => {}), s = shield.text, proposals = [];
        for (const n of templates(s).nodes) {
            const raw = s.slice(n.start, n.end), p = parsedTemplate(raw), foreign = TRANSLATION_RULES.profiles[p.name];
            if (!CITE_NAMES[p.name] && foreign?.kind !== 'citation') continue;
            const entries = templateEntries(p);
            const offer = (label, after) => {
                if (raw.includes('\uE000AJG') || raw === after) return;
                proposals.push({id: 'citation-repair-' + proposals.length, start: n.start, end: n.end, before: raw, label,
                    choices: [{label: label.startsWith('Caderno') ? 'Usar departamento e conservar o valor' : 'Recompor o título com &#124;', after}]});
            };
            if (['citar jornal', 'citar notícia', 'citation'].includes(p.name)) {
                const cadernos = entries.filter(e => norm(e.key) === 'caderno');
                if (cadernos.length === 1) {
                    const e = cadernos[0], targets = entries.filter(x => ['departamento', 'subtitulo', 'subtítulo', 'department'].includes(norm(x.key)));
                    if (e.value.trim() && targets.every(x => x.value.trim() === e.value.trim())) offer(
                        'Caderno do jornal: confirme que "' + e.value.trim() + '" é o nome do caderno ou suplemento',
                        entriesTemplate(p, entries.map(x => x === e ? targets.length ? {...x, remove: true} : {...x, key: 'departamento'} : x)));
                }
            }
            const titles = entries.filter(e => {
                const key = foreign?.fields[e.key] || mappedParam(e.key);
                return ['título', 'titulo', 'Título'].includes(key);
            });
            for (const title of titles) {
                const fragments = [];
                for (let i = title.index + 1; i < p.parts.length && !entries.some(e => e.index === i); i++) {
                    if (!p.parts[i].trim() || p.parts[i].includes('=')) break;
                    fragments.push(i);
                }
                if (!fragments.length) continue;
                const parts = p.parts.slice();
                parts[title.index] += fragments.map(i => '&#124;' + p.parts[i]).join('');
                offer('Possível barra literal no título: confira se os fragmentos pertencem ao título publicado',
                    '{{' + parts.filter((_, i) => !fragments.includes(i)).join('|') + '}}');
            }
        }
        return proposals.slice(0, 100);
    }
    function citationRepairWarnings(s, cfg, warn) {
        if (!cfg.citations) return;
        for (const n of templates(s).nodes) {
            const p = parsedTemplate(s.slice(n.start, n.end)), foreign = TRANSLATION_RULES.profiles[p.name];
            if (!CITE_NAMES[p.name] && foreign?.kind !== 'citation') continue;
            const entries = templateEntries(p);
            if (entries.some(e => norm(e.key) === 'caderno')) warn('Caderno não é um parâmetro aceito de ' + p.parts[0].trim() + '. Para o nome do caderno de um jornal, confira a sugestão departamento. O valor foi preservado.');
            if (p.parts.slice(1).some((part, i) => part.trim() && !entries.some(e => e.index === i + 1)) || entries.some(e => /^\d+$/.test(e.key) && e.value.trim()))
                warn('Citação ' + p.parts[0].trim() + ' com texto em parâmetro sem nome. Pode haver uma barra | literal no título ou um campo sem o sinal =. Confira os fragmentos antes de recompor o título.');
        }
    }

    // Auditorias locais, sem mudar dados ou completar células por inferência.
    function outermostRanges(ranges){
        const sorted=ranges.slice().sort((a,b)=>a.start-b.start||b.end-a.end),out=[];let maximum=-Infinity,maximumStart=-Infinity;
        for(const range of sorted){if(maximum>range.end||maximum===range.end&&maximumStart<range.start)continue;out.push(range);if(range.end>maximum){maximum=range.end;maximumStart=range.start;}}
        return out;
    }
    // Regras de tabelas 2.0. As posições usam sempre o texto original.
    // Fontes e limites de cada reparo: tables/rules.json.
    function tableMaskRanges(source, ranges) {
        return applyEdits(source, outermostRanges(ranges).map(r => ({start:r.start,end:r.end,
            text:source.slice(r.start,r.end).replace(/[^\r\n]/g,' ')})));
    }
    function tableSyntaxView(source) {
        const literal=protectedView(source), refs=refTokens(literal);
        let view=tableMaskRanges(literal,refs);
        const dynamic=templates(view).nodes.slice(), stack=[];
        // O leitor de predefinições exporta nós de {{...}}, mas não {{{...}}}.
        for(let i=0;i<view.length;){
            const tag=tagAt(view,i);if(tag){i=tag.end;continue;}
            const top=stack.at(-1);
            if(top&&view.slice(i,i+top.size)==='}'.repeat(top.size)){
                stack.pop();if(top.size===3)dynamic.push({start:top.start,end:i+3});i+=top.size;
            }else if(view.slice(i,i+3)==='{{{'){stack.push({start:i,size:3});i+=3;}
            else if(view.slice(i,i+2)==='{{'){stack.push({start:i,size:2});i+=2;}
            else i++;
        }
        for(const node of stack)dynamic.push({start:node.start,end:view.length});
        view=tableMaskRanges(view,dynamic);
        return {view,dynamic:outermostRanges(dynamic)};
    }
    function tableCellView(line,invalid=()=>{}) {
        // Barras em ligações, etiquetas e atributos entre aspas não separam células.
        const chars=line.split(''),hide=(a,b)=>{for(let j=a;j<b;j++)chars[j]=' ';};
        let link=0, bracket=0, quote='';
        for(let i=0;i<line.length;){
            const tag=tagAt(line,i);if(tag){hide(i,tag.end);i=tag.end;continue;}
            if(line.slice(i,i+2)==='[['){const start=i;i+=2;link=1;
                while(i<line.length&&link){if(line.slice(i,i+2)==='[['){link++;i+=2;}
                    else if(line.slice(i,i+2)===']]'){link--;i+=2;}else i++;}if(link)invalid();hide(start,i);continue;}
            if(line[i]==='['&&/^(?:https?:|\/\/)/i.test(line.slice(i+1))){const start=i;bracket=1;i++;
                while(i<line.length&&bracket){if(line[i]==='[')bracket++;else if(line[i]===']')bracket--;i++;}if(bracket)invalid();hide(start,i);continue;}
            // Negrito/itálico não são aspas de atributos.
            if((line[i]==='"'||line[i]==="'")&&/=[ \t]*$/.test(line.slice(0,i))){
                const start=i;quote=line[i++];while(i<line.length&&line[i]!==quote)i++;
                if(i<line.length)i++;else invalid();hide(start,i);continue;}
            i++;
        }
        return chars.join('');
    }
    function tableAttrs(raw,start) {
        if(raw.length>8192)return {attrs:[],valid:false};
        const attrs=[],seen=new Set(),re=/([a-zA-Z_:][\w:.-]*)(?:[ \t]*=[ \t]*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^\s|"'=<>`]+)))?/g;
        let match,position=0,valid=true;
        while((match=re.exec(raw))){
            if(raw.slice(position,match.index).trim())valid=false;
            const key=match[1].toLowerCase(),value=match[2]??match[3]??match[4];
            if(seen.has(key))valid=false;seen.add(key);
            if(value===undefined&&!['nowrap','hidden'].includes(key))valid=false;
            attrs.push({key,value,raw:match[0],start:start+match.index,end:start+re.lastIndex});position=re.lastIndex;
            if(attrs.length>128)return {attrs:[],valid:false};
        }
        if(raw.slice(position).trim()||/[{}\uE000\uE001]/.test(raw))valid=false;
        return {attrs,valid};
    }
    // Uma linha com apenas um subtítulo anual pode virar uma seção fora da tabela.
    // Os blocos de dados permanecem byte a byte. Não deduplica registros ou preenche células.
    function tableYearSectionCandidates(source) {
        const report={edits:[],findings:[],proofs:[]};
        if(!/^={3,5}[ \t]*[12]\d{3}[ \t]*={3,5}[ \t]*$/m.test(source)||!/^\s*\|[ \t]*colspan[ \t]*=/m.test(source))return report;
        const prepared=tableSyntaxView(source),view=prepared.view,stack=[],tables=[];
        for(const match of view.matchAll(/^[ \t]*(\{\||\|\})([^\r\n]*)(?:\r?\n|$)/gm)){
            if(match[1]==='{|'){
                if(stack.length)for(const t of stack)t.nested=true;
                stack.push({start:match.index,openEnd:match.index+match[0].length,nested:stack.length>0});
            }else if(stack.length){const t=stack.pop();t.closeStart=match.index;t.end=match.index+match[0].length;if(!stack.length)tables.push(t);}
        }
        const heading=body=>{
            const m=body.match(/^[ \t]*\|[ \t]*colspan[ \t]*=[ \t]*(?:"(\d+)"|'(\d+)'|(\d+))[ \t]*\|[ \t]*\r?\n(?:[ \t]*\r?\n)*(={3,5})[ \t]*([12]\d{3})[ \t]*\4[ \t]*(?:\r?\n[ \t]*\|[ \t]*)?[\r\n \t]*$/);
            if(!m)return null;
            const original=body.split(/\r?\n/).find(line=>/^[ \t]*={3,5}/.test(line));
            return {year:m[5],span:Number(m[1]||m[2]||m[3]),heading:original.trim()};
        };
        for(const t of tables){
            const inside=view.slice(t.openEnd,t.closeStart);
            if(!/^={3,5}[ \t]*[12]\d{3}[ \t]*={3,5}[ \t]*$/m.test(inside))continue;
            const finding={code:'table-year-heading',message:'Subtítulo anual dentro de uma tabela. Confira a separação das seções e a posição das células.',start:t.start,end:t.start+2,severity:'warning'};
            report.findings.push(finding);
            if(t.nested||t.end-t.start>500000||report.edits.length>=100)continue;
            const open=source.slice(t.start,t.openEnd),attrs=tableAttrs(open.replace(/^[ \t]*\{\|/,'').trim(),t.start);
            if(!attrs.valid||!attrs.attrs.some(a=>a.key==='class'&&/\bwikitable\b/.test(a.value||''))||attrs.attrs.some(a=>a.key==='class'&&/\b(?:infobox|navbox|toc)\b/.test(a.value||''))||attrs.attrs.some(a=>['id','role','headers'].includes(a.key)))continue;
            const markers=[...inside.matchAll(/^[ \t]*\|-([^\r\n]*)(?:\r?\n|$)/gm)].map(m=>({start:t.openEnd+m.index,end:t.openEnd+m.index+m[0].length,attrs:m[1]}));
            if(!markers.length||markers.length>5000)continue;
            const header=source.slice(t.openEnd,markers[0].start),headerView=view.slice(t.openEnd,markers[0].start);
            const headerLines=headerView.split(/\r?\n/).filter(line=>line.trim());
            if(!headerLines.length||headerLines.some(line=>!/^\s*!/.test(line))||/[{}]|<|<!--/.test(header)||/\b(?:rowspan|colspan|id|headers)\s*=/i.test(header))continue;
            let width=0;
            for(const line of headerLines)width+=1+(tableCellView(line).match(/!!|\|\|/g)||[]).length;
            if(width<2||width>32)continue;
            const rows=markers.map((marker,i)=>({...marker,stop:markers[i+1]?.start??t.closeStart,
                raw:source.slice(marker.start,markers[i+1]?.start??t.closeStart),
                body:source.slice(marker.end,markers[i+1]?.start??t.closeStart),
                bodyView:view.slice(marker.end,markers[i+1]?.start??t.closeStart)}));
            const sections=[];let section=null,valid=true;
            for(const row of rows){
                const group=heading(row.body);
                if(group){
                    if(row.attrs.trim()||![width,width-1].includes(group.span)||section&&!section.rows.length){valid=false;break;}
                    section={...group,rows:[],start:row.start};sections.push(section);
                }else{
                    if(!section||/^\s*={2,6}/m.test(row.bodyView)||/\browspan\s*=/i.test(row.bodyView)||/<\/?(?:table|tr|td|th|thead|tbody|tfoot)\b/i.test(row.bodyView)) {valid=false;break;}
                    const rowAttrs=tableAttrs(row.attrs,row.start+2);
                    if(!rowAttrs.valid||rowAttrs.attrs.some(a=>['id','headers'].includes(a.key))){valid=false;break;}
                    // A análise não pode garantir onde terminam linhas geradas por modelos.
                    const dynamic=prepared.dynamic.filter(n=>n.start<row.stop&&n.end>row.end);
                    for(const node of dynamic){
                        const raw=source.slice(node.start,node.end),lineStart=source.lastIndexOf('\n',node.start-1)+1,lineEnd=source.indexOf('\n',node.end);
                        const line=source.slice(lineStart,lineEnd<0?source.length:lineEnd),at=node.start-lineStart;
                        const inStyle=[...line.matchAll(/\bstyle\s*=\s*"[^"]*"/gi)].some(m=>at>m.index&&at+raw.length<m.index+m[0].length);
                        if(!/^\{\{\s*(?:Cor[ _]tempestade|Storm[ _]colour)\s*\|\s*[a-z0-9 -]+\s*\}\}$/i.test(raw)||!inStyle){valid=false;break;}
                    }
                    if(!valid)break;
                    section.rows.push(row.raw);
                }
            }
            if(!valid||!sections.length||!section.rows.length||sections.length>200)continue;
            const close=source.slice(t.closeStart,t.end);
            if(!/^[ \t]*\|}[ \t]*(?:\r?\n)?$/.test(close))continue;
            const parts=sections.map(s=>s.heading+'\n'+open+header+s.rows.join('')+close);
            const after=parts.join(close.endsWith('\n')?'\n':'\n\n');
            // The original data blocks and all their occurrences are copied verbatim.
            const dataRows=sections.flatMap(s=>s.rows);
            if(dataRows.join('')!==rows.filter(r=>!heading(r.body)).map(r=>r.raw).join(''))continue;
            report.edits.push({start:t.start,end:t.end,text:after,rule:'tableYearSections'});
            report.proofs.push({start:t.start,end:t.end,sections:sections.length,years:sections.map(s=>s.year),dataRows:dataRows.length,header,bodyBlocks:sections.map(s=>s.rows.join(''))});
            finding.message='Subtítulos anuais podem ser colocados fora da tabela, conservando todos os registros e referências.';finding.severity='info';
        }
        return report;
    }
    function automaticTableYearSections(source,cfg,bump,warn) {
        if(cfg.headings===false)return source;
        const report=tableYearSectionCandidates(source);
        if(!report.edits.length)return source;
        const after=applyEdits(source,report.edits);
        if(preservationAudit(source,after).length){warn('Separação anual da tabela preservada para revisão porque a conferência indicou possível perda de conteúdo.');return source;}
        for(const proof of report.proofs)for(let i=0;i<proof.sections;i++)bump('tableYearSections');
        return after;
    }

    function tableAnalysis(source) {
        if(!/^[ \t]*\{\|/m.test(source))return {findings:[],repairs:[],count:0,spans:[],spanAttributes:[],tables:[],structureSignature:'[]'};
        const prepared=tableSyntaxView(source),s=prepared.view;
        const findings=[],repairs=[],tables=[],stack=[];let dynamicAt=0;
        const issue=(code,message,start,end=start+2,severity='warning')=>{
            if(findings.length<500)findings.push({code,message,start,end,severity});
        };
        const finish=t=>{if(t.current){t.rows.push(t.current);t.current=null;}};
        const lineRE=/[^\n]*(?:\n|$)/g;let line;
        while((line=lineRE.exec(s))&&line[0]){
            const value=line[0].replace(/\r?\n$/,''),start=line.index,end=start+line[0].length;
            const open=value.match(/^[ \t]*\{\|/);
            if(open){
                if(stack.length){stack.at(-1).nested=true;stack.at(-1).complex=true;}
                const attrsStart=start+open[0].length,attrText=source.slice(attrsStart,start+value.length);
                const candidate=attrText.match(/[ \t]+\|[ \t]*$/),trailing=candidate&&tableCellView(attrText)[candidate.index+candidate[0].indexOf('|')]==='|'?candidate:null,attrsRaw=trailing?attrText.slice(0,trailing.index):attrText;
                const attrs=tableAttrs(attrsRaw,attrsStart);
                const t={start,openEnd:end,rows:[],current:null,closed:false,nested:stack.length>0,
                    complex:stack.length>0||!attrs.valid,dynamic:false,attrs:attrs.attrs,extraPipes:[],captions:0,rowAttrs:[],captionAttrs:[],depth:stack.length};
                if(trailing)t.extraPipes.push({start:attrsStart+trailing.index+trailing[0].indexOf('|'),end:attrsStart+trailing.index+trailing[0].indexOf('|')+1});
                stack.push(t);
            }
            while(dynamicAt<prepared.dynamic.length&&prepared.dynamic[dynamicAt].end<=start)dynamicAt++;
            if(stack.length&&dynamicAt<prepared.dynamic.length&&prepared.dynamic[dynamicAt].start<end&&prepared.dynamic[dynamicAt].end>start){
                for(const t of stack){t.dynamic=true;t.complex=true;}
            }
            if(open||!stack.length)continue;
            const t=stack.at(-1);
            if(/<\/?(?:table|tr|th|td|thead|tbody|tfoot)\b/i.test(source.slice(start,end))){t.complex=true;t.html=true;}
            if(/^[ \t]*\|}/.test(value)){
                if(!t.current&&t.rows.length)t.complex=true;
                finish(t);t.end=end;t.closed=true;stack.pop();tables.push(t);continue;
            }
            if(/^[ \t]*\|-/.test(value)){
                if(!t.current&&t.rows.length)t.complex=true;
                finish(t);
                const marker=value.match(/^[ \t]*\|-/)[0],attrsStart=start+marker.length,attrText=source.slice(attrsStart,start+value.length);
                const candidate=attrText.match(/[ \t]+\|[ \t]*$/),trailing=candidate&&tableCellView(attrText)[candidate.index+candidate[0].indexOf('|')]==='|'?candidate:null,attrsRaw=trailing?attrText.slice(0,trailing.index):attrText;
                const rowAttributes=tableAttrs(attrsRaw,attrsStart);
                if(!rowAttributes.valid)t.complex=true;
                t.rowAttrs.push(rowAttributes.attrs);
                if(trailing)t.extraPipes.push({start:attrsStart+trailing.index+trailing[0].indexOf('|'),end:attrsStart+trailing.index+trailing[0].indexOf('|')+1});
                continue;
            }
            if(/^[ \t]*\|\+/.test(value)){
                t.captions++;
                const marker=value.match(/^[ \t]*\|\+/)[0],captionStart=start+marker.length,captionView=tableCellView(value.slice(marker.length)),separator=captionView.indexOf('|');
                t.captionAttrs.push(separator<0?[]:tableAttrs(source.slice(captionStart,captionStart+separator),captionStart).attrs);
                continue;
            }
            const first=value.match(/^[ \t]*([!|])/);if(!first)continue;
            if(!t.current)t.current={start,cells:[]};
            const view=tableCellView(value,()=>{t.complex=true;}),delimiters=[{at:first[0].length,kind:first[1]}];
            const delimiter=first[1]==='!'?/!!|\|\|/g:/\|\|/g;delimiter.lastIndex=first[0].length;let match;
            while((match=delimiter.exec(view)))delimiters.push({at:match.index+2,kind:match[0]==='!!'?'!':'|'});
            for(let i=0;i<delimiters.length;i++){
                const boundary=delimiters[i],a=boundary.at,b=i+1<delimiters.length?delimiters[i+1].at-2:value.length;
                const attrsEnd=view.slice(a,b).indexOf('|'),rawAttrs=attrsEnd>=0?source.slice(start+a,start+a+attrsEnd):'';
                const attributes=tableAttrs(rawAttrs,start+a),cell={start:start+a,end:start+b,row:t.rows.length,
                    kind:boundary.kind,contentStart:start+a+(attrsEnd>=0?attrsEnd+1:0),attrsEnd:attrsEnd<0?null:start+a+attrsEnd,
                    attrs:attributes.attrs,rowspan:1,colspan:1};
                if(!attributes.valid)t.complex=true;
                for(const attr of cell.attrs){
                    if(!['rowspan','colspan'].includes(attr.key))continue;
                    if(!/^\d+$/.test(attr.value||'')||Number(attr.value)>1000||(attr.key==='colspan'&&Number(attr.value)===0)){
                        t.complex=true;issue('table-span-value','Extensão de célula inválida ou dinâmica, confira '+attr.raw+'.',attr.start,attr.end);continue;}
                    cell[attr.key]=Number(attr.value);
                }
                t.current.cells.push(cell);
                if(t.current.cells.length>200)t.complex=true;
            }
        }
        for(const t of stack){finish(t);t.end=source.length;tables.push(t);issue('table-unclosed','Tabela sem fechamento |}.',t.start,t.start+2,'error');}
        for(const t of tables){
            if(!t.closed)continue;
            let cost=0;
            for(let r=0;r<t.rows.length;r++)for(const cell of t.rows[r].cells)
                cost+=Math.min(t.rows.length-r,cell.rowspan||t.rows.length-r)*cell.colspan;
            if(cost>100000||t.rows.length>5000){t.complex=true;t.bounded=true;}
            if(t.complex){
                const reason=t.dynamic?'conteúdo produzido por predefinições':t.nested?'tabelas aninhadas':t.bounded?'muitas células':t.html?'elementos HTML de tabela':'atributos ou células que exigem conferência';
                issue(t.dynamic?'table-dynamic':t.nested?'table-nested':t.bounded?'table-large':'table-complex',
                    'Tabela com '+reason+'. Confira a estrutura completa na pré-visualização. As células foram preservadas.',t.start,t.start+2);continue;
            }
            const grid=[],widths=[],overflows=[];let irregular=false;
            for(let r=0;r<t.rows.length;r++){
                grid[r]||=[];let c=0;
                for(const cell of t.rows[r].cells){
                    while(grid[r][c])c++;
                    const span=cell.rowspan||t.rows.length-r;
                    if(r+span>t.rows.length){
                        const attr=cell.attrs.find(a=>a.key==='rowspan');
                        issue('table-rowspan-overflow','rowspan="'+span+'" ultrapassa as '+(t.rows.length-r)+' linhas restantes da tabela.',attr.start,attr.end);
                        overflows.push({...attr,after:attr.raw.replace(/\d+/,String(t.rows.length-r)),
                            rule:'tableSpanRepairs',label:'Ajustar rowspan para '+(t.rows.length-r)});
                    }
                    for(let k=c;k<c+cell.colspan;k++){
                        if(grid[r][k]){irregular=true;issue('table-cell-overlap','Uma célula ocupa uma coluna já coberta por rowspan.',cell.start,cell.start+1,'error');}
                        for(let q=r;q<Math.min(t.rows.length,r+span);q++){grid[q]||=[];grid[q][k]=true;}
                    }
                    c+=cell.colspan;cell.column=c-cell.colspan;
                }
                widths.push(grid[r].length);
            }
            const expected=Math.max(0,...widths);
            for(let r=0;r<widths.length;r++)if(widths[r]<expected||Object.keys(grid[r]).length<expected){
                irregular=true;issue('table-short-row','Linha '+(r+1)+' com '+Object.keys(grid[r]).length+' colunas ocupadas, enquanto a tabela chega a '+expected+'. Confira se falta uma célula.',t.rows[r].start,t.rows[r].start+2);
            }
            t.width=expected;t.irregular=irregular;
            // Atribuição nunca recompõe linhas, preenche células ou muda colspan.
            if(!irregular&&t.rows.length){repairs.push(...overflows);
                for(const pipe of t.extraPipes){issue('table-extra-attribute-pipe','Barra isolada após os atributos da tabela ou linha.',pipe.start,pipe.end);
                    repairs.push({...pipe,after:'',rule:'tableSyntaxRepairs',label:'Retirar barra isolada após os atributos'});}
            }
            const classes=t.attrs.find(a=>a.key==='class')?.value||'',role=t.attrs.find(a=>a.key==='role')?.value||'';
            const header=t.rows[0],body=t.rows.slice(1),flat=t.rows.flatMap(r=>r.cells);
            const simple=!irregular&&expected>=2&&body.length>=1&&/\bwikitable\b/.test(classes)&&
                !/\b(?:infobox|navbox|toc)\b/.test(classes)&&!['presentation','none'].includes(role.toLowerCase())&&
                flat.every(c=>c.rowspan===1&&c.colspan===1&&!c.attrs.some(a=>['headers','id'].includes(a.key)))&&
                header.cells.length===expected&&header.cells.every(c=>c.kind==='!')&&
                body.every(r=>r.cells.length===expected&&r.cells.slice(1).every(c=>c.kind==='|'))&&
                flat.every(c=>!c.attrs.some(a=>a.key==='scope'&&a.value!==((c.row===0)?'col':c.column===0&&c.kind==='!'?'row':'')));
            if(simple){
                for(const cell of flat.filter(c=>c.kind==='!'&&!c.attrs.some(a=>a.key==='scope'))){
                    if(!source.slice(cell.contentStart,cell.end).trim())continue;
                    const orientation=cell.row===0?'col':'row',hasAttrs=cell.attrsEnd!==null;
                    const after=hasAttrs?' scope="'+orientation+'"'+(/^[ \t]/.test(source.slice(cell.start,cell.start+1))?'':' '):' scope="'+orientation+'" |';
                    issue('table-header-scope','Cabeçalho explícito sem scope="'+orientation+'".',cell.start,cell.start+1,'info');
                    repairs.push({start:cell.start,end:cell.start,after,rule:'tableHeaderScopes',label:'Informar alcance do cabeçalho '+orientation});
                }
            }
        }
        const yearSections=tableYearSectionCandidates(source);
        findings.push(...yearSections.findings.slice(0,Math.max(0,500-findings.length)));
        const attributeSignature=attrs=>attrs.map(a=>[a.key,a.value===undefined?null:a.value]);
        const structureSignature=JSON.stringify(tables.map(t=>[t.depth,t.closed,attributeSignature(t.attrs),t.extraPipes.length,
            t.captions,t.captionAttrs.map(attributeSignature),t.rowAttrs.map(attributeSignature),
            t.rows.map(row=>row.cells.map(c=>[c.kind,c.rowspan,c.colspan,attributeSignature(c.attrs)]))]));
        return {findings,repairs,count:tables.length,spans:outermostRanges(tables.map(t=>({start:t.start,end:t.end}))),
            spanAttributes:tables.flatMap(t=>t.rows.flatMap(r=>r.cells.flatMap(c=>c.attrs.filter(a=>['rowspan','colspan'].includes(a.key))))),structureSignature,
            tables:tables.map(t=>({start:t.start,end:t.end,closed:t.closed,nested:t.nested,dynamic:t.dynamic,complex:t.complex,rows:t.rows.length,
                cells:t.rows.reduce((total,row)=>total+row.cells.length,0),width:t.width||0,irregular:!!t.irregular}))};
    }
    function tableStructureSignature(source) { return tableAnalysis(source).structureSignature; }
    function automaticTables(source,cfg,bump,warn) {
        if(cfg.tableChecks===false||cfg.automaticTableRepairs===false||cfg.discussionPage||cfg.namespaceNumber===10||cfg.sectionOnly)return source;
        source=automaticTableYearSections(source,cfg,bump,warn);
        const analysis=tableAnalysis(source),accepted=analysis.repairs.filter(r=>r.rule!=='tableHeaderScopes'||cfg.tableAccessibility!==false);
        if(!accepted.length)return source;
        const after=applyEdits(source,accepted.map(r=>({start:r.start,end:r.end,text:r.after})));
        const next=tableAnalysis(after),errorCounts=report=>{const counts=new Map();for(const f of report.findings.filter(f=>f.severity==='error'))counts.set(f.code,(counts.get(f.code)||0)+1);return counts;};
        const oldErrors=errorCounts(analysis),newErrors=errorCounts(next),gridSignature=report=>JSON.stringify(report.tables.map(t=>[t.closed,t.nested,t.dynamic,t.rows,t.cells,t.width,t.irregular]));
        if([...newErrors].some(([code,count])=>count>(oldErrors.get(code)||0))||next.count!==analysis.count||gridSignature(next)!==gridSignature(analysis)){
            warn('Reparos de tabela desfeitos porque a conferência encontrou uma alteração inesperada na estrutura.');return source;
        }
        for(const repair of accepted)bump(repair.rule);
        return after;
    }
    function tableSuggestions(source) {
        // Os reparos inequívocos já pertencem ao botão Ajustar código. Os casos
        // dinâmicos ou com células ausentes são relatados sem proposta destrutiva.
        return [];
    }

    function strictDate(value) {
        const s = value.replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>|<ref\b[^>]*\/\s*>/gi, '').trim();
        let m, d, month, y;
        if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, month, d] = m;
        else if ((m = s.match(/^\{\{(?:Dni|DataExt)\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})\s*\|\s*(\d{4})(?:\|[^{}]*)?}}$/i))) [, d, month, y] = m;
        else if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
            [, d, month, y] = m;
            if (Number(d) <= 12 && Number(month) <= 12 && d !== month) return {ambiguous: true};
        } else {
            m = s.match(/^(\d{1,2})(?:\.º|º)?\s+(?:de\s+)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})$/i);
            if (!m) return null;
            d = m[1]; y = m[3]; month = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'].indexOf(m[2].toLocaleLowerCase('pt')) + 1;
        }
        d = Number(d); month = Number(month); y = Number(y);
        const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
        const days = [31, leap ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
        const valid = y >= 1000 && y <= 9999 && month >= 1 && month <= 12 && d >= 1 && d <= days[month - 1];
        return {valid, day: d, month, year: y, value: y * 10000 + month * 100 + d};
    }
    function dateAudit(source) {
        const s = protectedView(source), findings = [];
        const birth = new Set(['nascimento_data','data_nascimento','nascimento','data de nascimento']);
        const death = new Set(['morte_data','data_morte','data_falecimento','falecimento','morte','data de morte']);
        const starts = new Set(['data_inicio','data_início','inicio_data','início_data']);
        const ends = new Set(['data_fim','fim_data']);
        const citationDates = new Set(['data','date','acessodata','access-date','arquivodata','archive-date','dataorigem']);
        for (const set of [birth, death, starts, ends]) { const keys = [...set].map(norm); set.clear(); keys.forEach(k => set.add(k)); }
        for (const n of templates(s).nodes) {
            const p = parsedTemplate(s.slice(n.start, n.end));
            if (!INFOBOX_CATALOG[p.name] && !CITE_NAMES[p.name]) continue;
            const dates = new Map(), seen = new Set();
            for (const e of templateEntries(p)) {
                const k = norm(e.key), relevant = INFOBOX_CATALOG[p.name] ? birth.has(k) || death.has(k) || starts.has(k) || ends.has(k) : citationDates.has(k);
                if (!relevant || !e.value.trim()) continue;
                const parsed = strictDate(e.value);
                if (!parsed || parsed.ambiguous) continue;
                if (!parsed.valid) findings.push({code:'date-impossible', message:'Data impossível em ' + e.key + ': ' + e.value.trim() + '.', start:n.start, end:n.end, severity:'warning'});
                else if (!seen.has(k)) dates.set(k, parsed);
                else dates.delete(k); // Campos repetidos não confirmam qual valor é usado.
                seen.add(k);
            }
            const first = set => [...dates].filter(([k]) => set.has(k)).map(([,v]) => v);
            for (const [a,b,code,message] of [[birth,death,'date-death-before-birth','A data de morte precede a de nascimento. Confira os dois campos.'],
                [starts,ends,'date-reversed-range','A data final precede a inicial. Confira o intervalo.']]) {
                const x=first(a), y=first(b);
                if (x.length===1 && y.length===1 && x[0].value>y[0].value) {
                    const show=v=>v.day+'/'+v.month+'/'+v.year;
                    const labels=code==='date-death-before-birth'?['Nascimento','morte']:['Início','final'];
                    findings.push({code,message:message+' '+labels[0]+': '+show(x[0])+', '+labels[1]+': '+show(y[0])+'.',start:n.start,end:n.end,severity:'warning'});
                }
            }
        }
        return findings;
    }
    function linkOccurrences(source, title) {
        const s = protectedView(source), re = /\[\[([^\]\n]*?)\]\]/g, found = []; let m;
        const canonical = text => {const t=text.trim().replace(/_/g,' ').replace(/\s+/g,' ');return t.slice(0,1).toLocaleUpperCase('pt')+t.slice(1);};
        while ((m=re.exec(s))) {
            const split=m[1].indexOf('|'), target=(split<0?m[1]:m[1].slice(0,split)).trim();
            if (canonical(target.split('#')[0].replace(/^:/,'')) !== canonical(title) || /[{}<>]/.test(m[1]) || target.includes('#')) continue;
            if (split>=0 && !m[1].slice(split+1)) continue; // Pipe trick precisa de expansão própria.
            found.push({start:m.index,end:re.lastIndex,before:source.slice(m.index,re.lastIndex),
                label:split<0?target.replace(/^:/,'').replace(/_/g,' '):source.slice(m.index+2+split+1,re.lastIndex-2), leading:target.startsWith(':')?':':''});
        }
        return found;
    }
    function replaceDisambiguationLink(source, occurrence, destination) {
        if (!occurrence || source.slice(occurrence.start,occurrence.end)!==occurrence.before || !destination || /[|\[\]{}<>\n#]/.test(destination)) throw new Error('Destino ou ocorrência inválida. Atualize a conferência.');
        const after='[['+occurrence.leading+destination+'|'+occurrence.label+']]';
        return {text:source.slice(0,occurrence.start)+after+source.slice(occurrence.end),after};
    }
    function comparisonDisplayGroups(before, after, hunks) {
        const bounds = (source, from, to) => {
            const start = from > 0 ? source.lastIndexOf('\n', from - 1) + 1 : 0;
            const next = source.indexOf('\n', Math.max(from, to - 1));
            return {start, end: next < 0 ? source.length : next + 1};
        };
        const inverse = (hunks || []).map(h => ({start:h.newStart,end:h.newEnd,newStart:h.start,newEnd:h.end,
            before:h.after,after:h.before}));
        const contexts = h => {
            let old = bounds(before,h.start,h.end), fresh = bounds(after,h.newStart,h.newEnd);
            // Expandir o contexto correspondente dos dois lados. Uma inserção
            // ou uma quebra de linha removida não pode parecer apagar a linha
            // vizinha que permaneceu no texto.
            for (let pass=0;pass<8;pass++) {
                const prior = [old.start,old.end,fresh.start,fresh.end].join(':');
                old = bounds(before,Math.min(old.start,mappedPosition(fresh.start,inverse,false)),
                    Math.max(old.end,mappedPosition(fresh.end,inverse,true)));
                fresh = bounds(after,Math.min(fresh.start,mappedPosition(old.start,hunks,false)),
                    Math.max(fresh.end,mappedPosition(old.end,hunks,true)));
                if ([old.start,old.end,fresh.start,fresh.end].join(':')===prior) break;
            }
            // A seleção continua usando os hunks originais. Estas posições
            // servem apenas para mostrar as linhas completas na comparação.
            old.start = Math.min(old.start,mappedPosition(fresh.start,inverse,false));
            old.end = Math.max(old.end,mappedPosition(fresh.end,inverse,true));
            fresh.start = mappedPosition(old.start,hunks,false);
            fresh.end = mappedPosition(old.end,hunks,true);
            return {old,fresh};
        };
        const groups = [];
        for (const h of hunks || []) {
            const {old,fresh} = contexts(h);
            const previous = groups.at(-1);
            if (previous && (old.start < previous.end || fresh.start < previous.newEnd ||
                old.start === previous.start && fresh.start === previous.newStart)) {
                previous.start = Math.min(previous.start, old.start);
                previous.end = Math.max(previous.end, old.end);
                previous.newStart = Math.min(previous.newStart, fresh.start);
                previous.newEnd = Math.max(previous.newEnd, fresh.end);
                previous.hunks.push(h);
            } else groups.push({start: old.start, end: old.end, newStart: fresh.start, newEnd: fresh.end, hunks: [h]});
        }
        for (const group of groups) {
            group.before = before.slice(group.start, group.end);
            group.after = after.slice(group.newStart, group.newEnd);
            group.reasons = [...new Set(group.hunks.flatMap(h => h.reasons || []))];
        }
        return groups;
    }
    function changeExplanation(group) {
        const old = group.before, fresh = group.after, text = old + '\n' + fresh;
        const edits = (group.hunks || []).map(h=>h.before+'\n'+h.after).join('\n');
        const reasons = (group.reasons || []).join('\n');
        const citation = /<ref\b|\{\{\s*(?:citar|cite|citation|referências|reflist|notas)/i;
        if (citation.test(edits) || /refer[êe]nci|cita[çc][ãa]o/i.test(reasons)) return 'Referência ajustada.';
        const spans = source => source.match(/\b(?:rowspan|colspan)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s|<>]+)/gi) || [];
        if (JSON.stringify(spans(old))!==JSON.stringify(spans(fresh)) &&
            (/\b(?:rowspan|colspan)\s*=/i.test(edits) || !group.hunks?.some(h=>h.unit?.startsWith('Campo '))))
            return 'Extensão de célula ajustada.';
        if (/\{\{\s*(?:info\/|infobox)/i.test(edits) || /infocaixa/i.test(reasons) ||
            /\{\{\s*(?:info\/|infobox)/i.test(text) && group.hunks?.some(h=>h.unit?.startsWith('Campo '))) return 'Infocaixa ajustada.';
        if (/\{\{\s*portal3?\b/i.test(edits) || /portais|portal/i.test(reasons)) return 'Portal ajustado.';
        if (/\{\{\s*contr[óo]le? de autoridade/i.test(edits) || /autoridade/i.test(reasons)) return 'Controle de autoridade ajustado.';
        if (/\{\{\s*div col\b/i.test(edits) || /colunas/i.test(reasons)) return 'Lista organizada em colunas.';
        if (/^={1,6}[^=]/m.test(edits) || /t[íi]tulos? de se[çc][ãa]o/i.test(reasons) ||
            group.hunks?.some(h=>h.unit==='Título de seção')) return 'Título de seção ajustado.';
        if (/\[\[(?:categoria|category|imagem|ficheiro|file):/i.test(edits)) return 'Categoria ou arquivo ajustado.';
        if (/\[\[/.test(edits) || /liga[çc][õo]es/i.test(reasons)) return 'Ligação ajustada.';
        if (/ortogr[áa]f|grafia|repeti[çc][ãa]o/i.test(reasons)) return 'Grafia ajustada.';
        return 'Código e formatação ajustados.';
    }

    function summarySpellingChanged(before, after) {
        // Só anuncia ortografia se uma correção ainda existir no resultado final.
        // O histórico de botões clicados não confirma que a escolha foi mantida.
        const words = source => plainProse(source).normalize('NFC').toLocaleLowerCase('pt')
            .match(/[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*/gu) || [];
        const a = words(before), b = words(after);
        if (a.length === b.length && a.every((word, i) => word === b[i])) return false;
        const count = tokens => {
            const out = new Map();
            for (const word of tokens) out.set(word, (out.get(word) || 0) + 1);
            return out;
        };
        const oldCounts = count(a), newCounts = count(b);
        const phrases = (tokens, phrase) => {
            const parts = phrase.split(/\s+/);
            if (parts.length === 1) return (tokens === a ? oldCounts : newCounts).get(phrase) || 0;
            let total = 0;
            for (let i = 0; i <= tokens.length - parts.length; i++)
                if (parts.every((word, j) => word === tokens[i + j])) total++;
            return total;
        };
        for (const rule of SPELLING_RULES) {
            if ((oldCounts.get(rule.wrong) || 0) <= (newCounts.get(rule.wrong) || 0)) continue;
            if ((rule.alternatives||[rule.correct]).some(correct=>phrases(b,correct)>phrases(a,correct))) return true;
        }
        const repeats = tokens => {
            const out = new Map();
            for (let i = 1; i < tokens.length; i++)
                if (tokens[i] === tokens[i - 1] && SPELLING_REPEAT_WORDS.has(tokens[i]))
                    out.set(tokens[i], (out.get(tokens[i]) || 0) + 1);
            return out;
        };
        const oldRepeats = repeats(a), newRepeats = repeats(b);
        for (const [word, total] of oldRepeats)
            if (total > (newRepeats.get(word) || 0) &&
                (oldCounts.get(word) || 0) > (newCounts.get(word) || 0)) return true;
        return false;
    }
    function summaryTopics(before, after, kinds = []) {
        if (before === after) return [];
        if (kinds.includes('styles')) return ['estilos'];
        const snapshot = source => {
            const view = protectedView(source), nodes = templates(view).nodes.map(n => {
                const raw = source.slice(n.start, n.end);
                return {...n, raw, name: parsedTemplate(raw).name};
            });
            const signature = predicate => nodes.filter(n => predicate(n.name)).map(n => n.raw).join('\n');
            const references = refTokens(view), ranges = [...nodes, ...references], tables = [];
            for (const m of view.matchAll(/\{\||\|\}/g)) {
                if (m[0] === '{|') tables.push(m.index);
                else if (tables.length) ranges.push({start: tables.pop(), end: m.index + 2});
            }
            tables.forEach(start => ranges.push({start, end: view.length}));
            const headings = [...view.matchAll(/^(={2,6})[ \t]*(.*?)[ \t]*\1[ \t]*$/gm)]
                .filter(m => !inRange(m.index, ranges)).map(m => m[0]).join('\n');
            const wrappers = new Set(['div col', 'div col fim', '-fim', 'inícioref', 'inicioref',
                'refbegin', 'refend', 'colunas', 'colunas-lista', 'multicol', 'multicol-end',
                'column', 'col-break', 'col-begin', 'col-end', 'columns', 'plainlist', 'lista simples',
                'unbulleted list', 'lista sem marcadores', 'hlist', 'flatlist', 'nowrap', 'nobr', 'séc', 'ac']);
            const html = (view.match(/<\/?[a-z][^<>]*>/gi) || [])
                .filter(tag => !/^<\/?(?:ref|references)\b/i.test(tag)).join('\n');
            const links = [], categories = [], images = [];
            const aliases = TRANSLATION_RULES.namespaceAliases;
            for (const m of view.matchAll(/\[\[[^\n]*?\]\]/g)) {
                const namespace = m[0].slice(2).match(/^\s*([^:|\]]+)\s*:/)?.[1];
                const mapped = namespace && (aliases[namespace] || namespace);
                if (mapped && /^(?:Categoria|Category)$/i.test(mapped)) categories.push(m[0]);
                else if (mapped && /^(?:Ficheiro|Imagem|File|Image|Arquivo)$/i.test(mapped)) images.push(m[0]);
                else links.push(m[0]);
            }
            return {
                references: references.map(r => source.slice(r.start, r.end)).join('\n') + '\n' +
                    signature(n => !!CITE_NAMES[n] || ['referências', 'referencias', 'reflist', 'references', 'notas', 'notas e referências', 'notelist'].includes(n)),
                infoboxes: signature(n => !!INFOBOX_CATALOG[n]),
                portals: signature(n => ['portal', 'portal3'].includes(n)),
                authority: signature(n => ['controle de autoridade', 'controlo de autoridade'].includes(n)),
                links: links.join('\n'), categories: categories.join('\n'), images: images.join('\n'),
                headings, formatting: signature(n => wrappers.has(n)) + '\n' + html,
                spans: tableStructureSignature(source)
            };
        };
        const a = snapshot(before), b = snapshot(after), topics = [];
        for (const [key, label] of [['references', 'referências'], ['infoboxes', 'infocaixas'],
            ['portals', 'portais'], ['authority', 'controle de autoridade'], ['links', 'ligações'],
            ['categories', 'categorias'], ['images', 'imagens'], ['spans', 'tabelas'],
            ['headings', 'seções'], ['formatting', 'formatação']])
            if (a[key] !== b[key]) topics.push(label);
        if(kinds.some(k=>/^syntax(?:Template|Tag|Reference|Named|Formatting|Table)/.test(k)))topics.unshift('sintaxe');
        if (summarySpellingChanged(before, after)) topics.push('ortografia');
        if (!topics.length) topics.push('sintaxe e formatação');
        return topics;
    }
    function summaryForTopics(topics) {
        const values = [...new Set(topics || [])];
        if (!values.length) return '';
        if (values.length === 1 && values[0] === 'ortografia') return 'Correções ortográficas com RevisaWiki.';
        return 'Ajustes de ' + (values.length === 1 ? values[0] :
            values.slice(0, -1).join(', ') + ' e ' + values.at(-1)) + ' com RevisaWiki.';
    }
    function cssDeclarations(source) {
        // Leitura lexical de declarações. A aceitação final é conferida na API.
        let s=source.replace(/\/\*[\s\S]*?\*\//g,v=>v.replace(/[^\n]/g,' '));
        const result=[]; let start=0, quote='', parens=0, depth=0;
        for(let i=0;i<s.length;i++) {
            const c=s[i];
            if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}
            if(c==='"'||c==="'"){quote=c;continue;}
            if(c==='('){parens++;continue;}if(c===')'){parens=Math.max(0,parens-1);continue;}if(parens)continue;
            if(c==='{'){depth++;start=i+1;continue;}
            if(c===';'||c==='}') {
                if(depth){const raw=s.slice(start,i),m=raw.match(/^\s*(--[\w-]+|[a-zA-Z-]+)\s*:\s*([\s\S]*?)\s*$/);
                    if(m){const a=start+raw.indexOf(m[1]);result.push({property:m[1].toLowerCase(),value:m[2],start:a,end:i,before:source.slice(a,i)});}}
                start=i+1;if(c==='}')depth=Math.max(0,depth-1);
            }
        }
        return result;
    }
    function templateStylesAudit(source) {
        const findings=[],suggestions=[],declarations=cssDeclarations(source);
        for(const d of declarations) {
            if(d.property.startsWith('--'))findings.push({code:'css-custom-property',message:'TemplateStyles não permite definir propriedades personalizadas: '+d.property+'.',start:d.start,end:d.end});
            if(d.property==='border-color'&&/^var\(--[\w-]+(?:\s*,\s*(?:#[a-f\d]{3}|#[a-f\d]{4}|#[a-f\d]{6}|#[a-f\d]{8}|[a-z]+))?\)\s*(?:!important)?$/i.test(d.value)) {
                findings.push({code:'css-border-color-var',message:'var() em border-color é descartado pelo TemplateStyles. Use as propriedades de cada lado da borda.',start:d.start,end:d.end});
                const indent=source.slice(source.lastIndexOf('\n',d.start-1)+1,d.start).match(/^\s*/)[0];
                const after=['top','right','bottom','left'].map(side=>'border-'+side+'-color: '+d.value.trim()).join(';\n'+indent);
                suggestions.push({start:d.start,end:d.end,before:d.before,after,label:'Usar as cores de cada lado da borda'});
            }
        }
        return {findings,suggestions,declarations};
    }
    function cssRetention(source, sanitized) {
        const before=cssDeclarations(source),after=cssDeclarations(sanitized),counts=new Map();
        after.forEach(d=>counts.set(d.property,(counts.get(d.property)||0)+1));
        const missing=[];
        for(const d of before){if(counts.get(d.property)>0)counts.set(d.property,counts.get(d.property)-1);else missing.push(d);}
        return {submitted:before.length,returned:after.length,missing};
    }
    function diagnosticReport(data) {
        const lines=['RevisaWiki '+data.version,'Página: '+data.title,'Revisão de origem: '+(data.base||'nova página'),
            'Editor: '+(data.editor||'não identificado'),'Opções ativas: '+(data.options||[]).join(', '),''];
        for(const f of (data.findings||[]).slice(0,100)) lines.push('['+f.domain+'/'+f.code+'] '+f.message);
        const changes=(data.changes||[]).slice(0,12);
        for(const c of changes)lines.push('','Regra: '+(c.reasons||[]).join(', '),'Antes: '+String(c.before||'').slice(0,600),'Depois: '+String(c.after||'').slice(0,600));
        if(!changes.length)lines.push('','Nenhum trecho alterado incluído no relatório.');
        return lines.join('\n');
    }
    function diagnosticChanges(before, after, rules=[]) {
        const merged=new Map();
        for(const h of diffHunks(before,after)) {
            const lineStart=(s,at)=>s.lastIndexOf('\n',Math.max(0,at-1))+1;
            const lineEnd=(s,start,end)=>{const n=s.indexOf('\n',Math.max(start,end-1));return n<0?s.length:n+1;};
            const insertionAfterLine=h.start===h.end&&before[h.start-1]==='\n';
            const anchor=insertionAfterLine?h.start-1:h.start, newAnchor=insertionAfterLine?Math.max(0,h.newStart-1):h.newStart;
            const start=lineStart(before,anchor),end=lineEnd(before,anchor,h.end);
            const newStart=lineStart(after,newAnchor),newEnd=lineEnd(after,newAnchor,h.newEnd);
            const old=merged.get(start);
            if(old){old.end=Math.max(old.end,end);old.newStart=Math.min(old.newStart,newStart);old.newEnd=Math.max(old.newEnd,newEnd);}
            else merged.set(start,{start,end,newStart,newEnd});
        }
        return [...merged.values()].slice(0,12).map(h=>({before:before.slice(h.start,h.end),after:after.slice(h.newStart,h.newEnd),reasons:rules}));
    }

    function pageContextOptions(options={}) {
        const cfg={...options}, ns=cfg.namespaceNumber;
        if(!Number.isInteger(ns)||ns===0)return cfg;
        // Article-specific additions never belong to another namespace.
        Object.assign(cfg,{biographyPortal:false,automaticBiographyPortals:false,livingBirthAge:false,
            authorityControl:false,autoMinor:false});
        const talk=ns>0&&ns%2===1;
        if(talk)Object.assign(cfg,{discussionPage:true,automaticSpelling:false,occupationCase:false,
            birthDates:false,headings:false,endMatter:false,endTemplateOrder:false,endSectionOrder:false,
            portals:false,shortDescriptions:false,obsoleteTemplates:false,maintenance:false,
            shortcuts:false,markup:false,categories:false,multilingual:false});
        if(ns===10&&!/\/(?:doc|documentação)(?:\/|$)/i.test(cfg.pageTitle||''))
            Object.assign(cfg,{automaticSpelling:false,occupationCase:false,birthDates:false,portals:false,
                endMatter:false,endTemplateOrder:false,endSectionOrder:false,headings:false,
                shortDescriptions:false,obsoleteTemplates:false,maintenance:false,categories:false,shortcuts:false,
                references:false,numericRefNames:false,neutralReferenceNames:false,automaticIdenticalReferences:false,
                moveNamedRefs:false,referenceColumns:false,unifiedNotesReferences:false,bareReferences:false});
        return cfg;
    }
    function discussionProtectionRanges(source,cfg={}) {
        if(!cfg.discussionPage)return [];
        // With a recognized signature anywhere, freeze the whole existing
        // conversation. New-section editors contain only the new message.
        const signatures=/(?:\b\d{1,2}(?:h\d{2}min|:\d{2})\s+(?:de\s+)?\d{1,2}\s+(?:de\s+)?[\p{L}]+\.?\s+(?:de\s+)?\d{4}|\{\{\s*(?:não assinou|nao assinou|unsigned)\b|\[\[\s*(?:Usuári[oa](?:\(a\))?|User)(?:[ _]Discuss[ãa]o|[ _]talk)?\s*:|\[\[\s*(?:Especial|Special)\s*:\s*(?:Contribuições|Contributions)\s*\/)/iu;
        return signatures.test(protectedView(source))?[{start:0,end:source.length}]:[];
    }
    function supportedPageContext(namespace,model) {
        return Number.isInteger(namespace)&&namespace>=0&&
            (model==='wikitext'||namespace===10&&model==='sanitized-css');
    }

    function* cleanupStages(source, options) {
        if (typeof source !== 'string') throw new TypeError('O texto precisa ser uma string.');
        const cfg = pageContextOptions(Object.assign({}, DEFAULTS, options || {})), counts = new Map(), warnings = new Set(), removed = [];
        cfg.biographyOriginalSource=source;
        const bump = id => counts.set(id, (counts.get(id) || 0) + 1);
        const warn = message => warnings.add(message);
        const syntactic=automaticSyntaxRepairs(source,cfg,bump,warn);
        const recovery=syntaxRepairPrefix(syntactic,cfg);
        if(cfg.partialSyntaxRecovery!==false&&recovery.unresolved.length&&recovery.end>0&&recovery.end<syntactic.length){
            yield 'Conferindo o trecho completo anterior ao código sem fechamento...';
            const prefix=syntactic.slice(0,recovery.end),tail=syntactic.slice(recovery.end);
            const guarded=maskProtected(prefix,()=>{},refTokens(protectedView(prefix)).filter(r=>{
                const a=attrsOf(r.attrs);return a&&(a.name||a.follow);
            }));
            const local=yield* cleanupStages(guarded.text,syntaxPrefixOptions(cfg));
            local.text=guarded.restore(local.text);
            const ending=prefix.match(/(?:\r?\n)[ \t\r\n]*$/)?.[0]||'';
            const prefixText=ending?local.text.replace(/[ \t\r\n]*$/,'')+ending:local.text;
            for(const c of local.changes||[])counts.set(c.id,(counts.get(c.id)||0)+c.count);
            if(prefixText!==prefix)bump('preservedUnresolvedTail');
            const text=prefixText+tail;
            for(const message of local.warnings||[])warn(message);
            warn('O código incompleto e tudo o que vem depois dele foram preservados. Os ajustes ficaram no trecho completo anterior.');
            return {text,changes:[...counts].map(([id,count])=>({id,label:GROUP_LABELS[id]||id,count})),
                warnings:[...warnings],removedDescriptions:[],suggestions:[],audit:referenceAudit(text,cfg),
                syntaxIsolation:{start:recovery.end,tailUnchanged:tail===syntactic.slice(recovery.end)},
                trace:cfg.captureTrace&&text!==source?[{label:'Reparos de sintaxe e ajustes locais com cauda preservada',before:source,after:text}]:[]};
        }
        const residues=removeKnownTranslationResidues(syntactic,cfg,bump,warn);
        const structured=automaticStructureCleanup(residues,cfg,bump,warn);
        const rendererLayout=preserveLegacyRendererLayout(structured,cfg,bump);
        const repaired=repairCenturySyntax(rendererLayout,cfg,bump);
        const initial = automaticMissingNoteCollector(repaired,cfg,bump);
        const shield = maskProtected(gallerySyntax(initial,cfg,bump), warn, discussionProtectionRanges(initial,cfg));
        let s = shield.text;
        if(shield.unclosed)cfg.endMatter=false; // A cauda opaca pode conter a lista existente.
        const trace = []; let checkpointText = source;
        function checkpoint(label) {
            if (!cfg.captureTrace) return;
            const next = shield.restore(s);
            if (next !== checkpointText) trace.push({label, before: checkpointText, after: next});
            checkpointText = next;
        }
        checkpoint('Sintaxe, notas, resíduos de tradução e estrutura do artigo inteiro');
        if (templates(s).unclosed.length) {
            warn('Há chaves de predefinição sem fechamento. Nenhum ajuste foi aplicado.');
            return {text: source, changes: [], warnings: [...warnings], removedDescriptions: []};
        }
        if (malformedRefs(s)) {
            warn('Há referências sem fechamento ou aninhadas. Nenhum ajuste foi aplicado.');
            return {text: source, changes: [], warnings: [...warnings], removedDescriptions: []};
        }
        if (cfg.shortcuts) s = expandShortcuts(s, bump, warn);
        if (cfg.shortDescriptions || cfg.obsoleteTemplates) {
            const edits = [], context = structuralRanges(s);
            for (const n of topNodes(s)) {
                const raw = s.slice(n.start, n.end), p = parsedTemplate(raw);
                const short = ['descrição curta', 'descricao curta', 'short description', 'shortdescription'].includes(p.name);
                const removable = cfg.shortDescriptions && short || cfg.obsoleteTemplates && ['sem interwiki', 'seminterwiki', 'sem interwikis'].includes(p.name);
                if (removable &&
                    !inRangeExcept(n.start,context,n.start,n.end)) {
                    const lineStart = s.lastIndexOf('\n', n.start - 1) + 1;
                    const nextNL = s.indexOf('\n', n.end), lineEnd = nextNL < 0 ? s.length : nextNL;
                    const standalone = !s.slice(lineStart, n.start).trim() && !s.slice(n.end, lineEnd).trim();
                    if (standalone) edits.push({start: lineStart, end: nextNL < 0 ? lineEnd : lineEnd + 1, text: ''});
                    else edits.push({start: n.start, end: n.end, text: ''});
                    if (short) removed.push(shield.restore(raw));
                    bump(short ? 'shortDescriptions' : 'obsoleteTemplates');
                }
            }
            s = applyEdits(s, edits);
        }
        if (cfg.obsoleteTemplates) {
            const edits = [];
            for (const n of topNodes(s)) {
                const p = parsedTemplate(s.slice(n.start, n.end));
                if (p.name !== 'tabela bonita' || p.parts.length !== 1) continue;
                const start = s.lastIndexOf('\n', n.start - 1) + 1;
                if (/^\{\|[ \t]*$/.test(s.slice(start, n.start))) {
                    edits.push({start: n.start, end: n.end, text: 'class="wikitable"'}); bump('obsoleteTemplates');
                } else warn('Tabela bonita fora do início de tabela preservada.');
            }
            s = applyEdits(s, edits);
        }
        checkpoint('Descrição curta e predefinições obsoletas');
        yield 'Conferindo o código e as referências...';
        if (cfg.bareReferences) s = simpleReferences(s, bump);
        checkpoint('Formatação de referências com ligação simples');
        yield 'Conferindo o código e as referências...';
        s = automaticRulesPass(s,cfg,bump,warn);
        s=canonicalPortugueseLinks(s,cfg,bump);
        s=historicalDateMarkup(s,cfg,bump);
        checkpoint("Reparos automáticos de citações e cabeçalhos");
        s = mapTemplateTree(s, raw => {
            const existingBox=INFOBOX_CATALOG[parsedTemplate(raw).name];
            const stabilized=cfg.infoboxes && existingBox?infobox(raw,bump,text=>{if(!/^Parâmetro fora do catálogo|^Infocaixa .*parâmetro não reconhecido/.test(text))warn(text);}):raw;
            const mechanical=automaticParameters(stabilized,cfg,bump);
            const migrated = multilingualTemplate(mechanical,cfg,bump,warn);
            if(migrated.handled && migrated.blocked)return migrated.text;
            let next = citation(migrated.text, cfg, bump, warn);
            next = extendedCitation(next, cfg, bump, warn);
            next = auxiliaryTemplate(next, cfg, bump, warn);
            if (cfg.birthDates) next = birthDate(next, bump);
            if (cfg.obsoleteTemplates) next = obsoleteTemplate(next, bump, warn);
            if (cfg.infoboxes) next = infobox(next, bump, warn);
            if (cfg.auxiliaryTemplates) next = auxiliaryParameters(next, bump, warn);
            next=automaticParameters(next,cfg,bump);
            if (cfg.portals) {
                const p = parsedTemplate(next);
                if (p.name === 'portal' && p.parts.length > 1 && p.parts.length <= 11 && p.parts.slice(1).every(x =>
                    x.trim() && !/[={}<>\r\n\uE000]/.test(x))) {
                    next = '{{Portal3|' + p.parts.slice(1).map(x => x.trim()).join('|') + '}}'; bump('portals');
                } else if (p.name === 'portal' && p.parts.length > 11) warn('Portal com mais de dez entradas preservado. Portal3 só exibe as dez primeiras.');
            }
            return next;
        });
        s=livingBirthAge(s,cfg,bump);
        s=occupationCase(s,cfg,bump);
        checkpoint('Parâmetros, datas, citações, infocaixas e portais');
        yield 'Conferindo o código e as referências...';
        s = foreignSyntax(s,cfg,bump,warn);
        if (cfg.links) { s = wikiURLs(s, bump); s = cleanLinks(s, bump); }
        checkpoint('Ligações internas');
        yield 'Conferindo o código e as referências...';
        if (cfg.headings) s = cleanHeadings(s, bump, cfg.multilingual);
        checkpoint('Títulos de seções');
        yield 'Conferindo o código e as referências...';
        if (cfg.references) { s = normalizeNumericReferenceNames(s, cfg, bump, warn); s=neutralAutomaticReferenceNames(s,cfg,bump); s = normalizeRefs(s, cfg, bump, warn); s = automaticIdenticalReferences(s,cfg,bump); s = normalizeLists(s, bump, warn); }
        checkpoint('Definições, chamadas e listas de referências');
        yield 'Conferindo o código e as referências...';
        if (cfg.markup) s = markupPass(s, bump);
        checkpoint('Formatação do código');
        s = automaticTables(s,cfg,bump,warn);
        checkpoint('Tabelas e acessibilidade dos cabeçalhos');
        yield 'Conferindo tabelas e cabeçalhos...';
        yield 'Conferindo o código e as referências...';
        if (cfg.categories) s = categoryPass(s, bump, warn);
        checkpoint('Categorias e imagens');
        yield 'Conferindo o código e as referências...';
        if (cfg.references) s = refPunctuation(s, bump, warn);
        checkpoint('Posição das referências');
        yield 'Conferindo o código e as referências...';
        if (cfg.endMatter) s = endMatterPass(s, bump, warn, cfg);
        checkpoint('Organização das seções finais');
        yield 'Conferindo o código e as referências...';
        if (cfg.links) s = cleanLinks(s, bump);
        if (cfg.headings) s = cleanHeadings(s, bump, cfg.multilingual);
        if (cfg.references) s = normalizeLists(s, bump, warn);
        checkpoint('Ligações, títulos e listas de referências');
        yield 'Conferindo o código e as referências...';
        s = unifiedNotesReferences(s,cfg,bump,warn);
        checkpoint('Notas e referências');
        s = referenceColumns(s,cfg,bump);
        checkpoint('Referências em duas colunas');
        s = endMatterColumns(s, cfg, bump, warn);
        checkpoint('Leituras e ligações externas em duas colunas');
        s = automaticStructureCleanup(s,cfg,bump,warn);
        s = finalEndMatter(s, cfg, bump, warn);
        s = unifiedNotesReferences(s,cfg,bump,warn);
        s = referenceColumns(s,cfg,bump);
        if(cfg.authorityLookupWarning)warn(cfg.authorityLookupWarning);
        if(cfg.footerLookupWarning)warn(cfg.footerLookupWarning);
        checkpoint('Bloco final e controle de autoridade');
        yield 'Conferindo grafias selecionadas na prosa...';
        s=automaticSpelling(s,cfg,bump,warn);
        checkpoint('Correções ortográficas automáticas');
        yield 'Conferindo o código e as referências...';
        s=captionTerminalPeriods(s,cfg,bump);
        checkpoint('Ponto final de legendas');
        diagnostics(s, cfg, warn);
        structuralAudit(shield.restore(s),cfg).forEach(f=>warn(f.message));
        citationRepairWarnings(s, cfg, warn);
        const biographies = biographyStyleAudit(shield.restore(s),cfg);
        biographies.forEach(f=>warn(f.message));
        const audit = cfg.references ? referenceAudit(shield.restore(s),cfg) : [];
        audit.forEach(f => warn(f.message));
        // Não mexer na pontuação da prosa, nos títulos publicados ou nas fontes escolhidas.
        return {text: shield.restore(s), changes: [...counts].map(([id, count]) =>
            ({id, label: GROUP_LABELS[id] || id, count})), warnings: [...warnings], removedDescriptions: removed, audit, trace, notApplied: notAppliedReasons(shield.restore(s),cfg), suggestions: reviewSuggestions(shield.restore(s), cfg)};
    }

    function cleanup(source, options) {
        const steps = cleanupStages(source, options); let next;
        do { next = steps.next(); } while (!next.done);
        return next.value;
    }

    // A lista manual e a correção automática compartilham os mesmos trechos protegidos.
    function unpackSpellingRows(data){
        return data.rows.map(row=>Object.fromEntries(data.schemas[row[0]].map((key,index)=>[key,data.values[row[index+1]]])));
    }
    const SPELLING_RULES = Object.freeze(unpackSpellingRows(root.RevisaWikiDataV2.packed.spelling));
    const SPELLING_LOOKUP = new Map(SPELLING_RULES.map(r => [r.wrong, r]));
    const AUTOMATIC_SPELLING_LOOKUP=new Map(SPELLING_RULES.filter(r=>r.automatic).map(r=>[r.wrong,r]));
    function spellingView(source,cfg={}) {
        const warnings = new Set(), shield = maskProtected(source, w => warnings.add(w),discussionProtectionRanges(source,pageContextOptions(cfg)));
        const s = shield.text, ranges = [];
        const protect = (start, end) => ranges.push({start, end});
        function balanced(start, open, close) {
            let depth = 1, i = start + open.length;
            while (i < s.length) {
                if (s.startsWith(open, i)) { depth++; i += open.length; }
                else if (s.startsWith(close, i)) { i += close.length; if (--depth === 0) return i; }
                else i++;
            }
            warnings.add('Trecho iniciado por ' + open + ' sem fechamento. A revisão ortográfica preservou o restante do texto.');
            return s.length;
        }
        function quoteToken(at) {
            const literal = s[at];
            if ('"\'“”‘’«»'.includes(literal || '\u0000')) return {symbol: literal, length: 1};
            if (literal !== '&') return null;
            const m = s.slice(at, at + 20).match(/^&(?:quot|apos|ldquo|rdquo|lsquo|rsquo|laquo|raquo|#\d+|#x[0-9a-f]+);/i);
            if (!m) return null;
            const value = m[0].slice(1, -1).toLowerCase(), named = {quot: '"', apos: "'", ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', laquo: '«', raquo: '»'};
            const number = value.startsWith('#x') ? parseInt(value.slice(2), 16) : value.startsWith('#') ? Number(value.slice(1)) : null;
            const symbol = named[value] || (number !== null && number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '');
            return symbol && '"\'“”‘’«»'.includes(symbol) ? {symbol, length: m[0].length} : null;
        }
        function quoted(start, open) {
            const close = {'“': '”', '‘': '’', '«': '»'}[open.symbol] || open.symbol;
            for (let i = start + open.length; i < s.length; i++) {
                if (!'"\'”’»&'.includes(s[i])) continue;
                const token = quoteToken(i);
                if (token?.symbol === close) {
                    const internal = (close === "'" || close === '’') &&
                        /[\p{L}\p{M}\p{N}]/u.test(s[i - 1] || '') && /[\p{L}\p{M}\p{N}]/u.test(s[i + token.length] || '');
                    if (!internal) return i + token.length;
                }
            }
            warnings.add('Aspas ou destaque sem fechamento. A revisão ortográfica preservou o restante do texto.');
            return s.length;
        }
        function highlighted(start) {
            let italic = false, bold = false, i = start;
            const re = /'{2,}/g; re.lastIndex = start;
            let m;
            while ((m = re.exec(s))) {
                if (m[0].length === 2) italic = !italic;
                else if (m[0].length === 3) bold = !bold;
                else if (m[0].length === 5) { italic = !italic; bold = !bold; }
                else {
                    warnings.add('Destaque com apóstrofos ambíguos. A revisão ortográfica preservou o restante do texto.');
                    return s.length;
                }
                i = re.lastIndex;
                if (!italic && !bold) return i;
            }
            warnings.add('Itálico ou negrito sem fechamento. A revisão ortográfica preservou o restante do texto.');
            return s.length;
        }
        const voidTags = new Set(['br', 'hr', 'wbr', 'img', 'meta', 'link', 'input', 'area', 'base', 'col', 'embed', 'param', 'track']);
        function htmlEnd(t) {
            if (t.close || t.self || voidTags.has(t.name)) return t.end;
            let depth = 1;
            for (let i = t.end; i < s.length;) {
                const at = s.indexOf('<', i);
                if (at < 0) break;
                const next = tagAt(s, at);
                if (!next) { i = at + 1; continue; }
                i = next.end;
                if (next.name !== t.name) continue;
                if (next.close) { if (--depth === 0) return next.end; }
                else if (!next.self) depth++;
            }
            warnings.add('Elemento <' + t.name + '> sem fechamento. A revisão ortográfica preservou o restante do texto.');
            return s.length;
        }
        for (let i = 0; i < s.length;) {
            let end = i;
            if (s.startsWith('\uE000AJG', i)) {
                const stop = s.indexOf('\uE001', i); end = stop < 0 ? s.length : stop + 1;
            } else if (s.startsWith('{{', i)) end = balanced(i, '{{', '}}');
            else if (s.startsWith('[[', i)) end = balanced(i, '[[', ']]');
            else if (s.startsWith('{|', i)) end = balanced(i, '{|', '|}');
            else if (s[i] === '[') end = balanced(i, '[', ']');
            else if (s[i] === '(') end = balanced(i, '(', ')');
            else if (s.startsWith("''", i)) end = highlighted(i);
            else if (s[i] === '<') {
                const t = tagAt(s, i);
                if (t) end = htmlEnd(t);
                else if (/^<\s*\/?\s*[a-z!?]/i.test(s.slice(i, i + 32))) {
                    warnings.add('Possível elemento HTML malformado. A revisão ortográfica preservou o restante do texto.');
                    end = s.length;
                }
            }
            if (end === i) {
                const token = quoteToken(i);
                // Apóstrofos dentro de palavras, como d'Anjos, não abrem aspas.
                if (token && '"\'“‘«'.includes(token.symbol) &&
                    (token.symbol !== "'" || !/[\p{L}\p{M}\p{N}]/u.test(s[i - 1] || ''))) end = quoted(i, token);
                else if (token && (token.symbol === "'" || token.symbol === '’') && token.length > 1 &&
                    /[\p{L}\p{M}\p{N}]/u.test(s[i - 1] || '') && /[\p{L}\p{M}\p{N}]/u.test(s[i + token.length] || '')) {
                    let left = i, right = i + token.length;
                    while (left > 0 && /[\p{L}\p{M}\p{N}]/u.test(s[left - 1])) left--;
                    while (right < s.length && /[\p{L}\p{M}\p{N}]/u.test(s[right])) right++;
                    protect(left, right); end = right;
                }
            }
            if (end > i) { protect(i, end); i = end; } else i++;
        }
        // Endereços, identificadores e nomes de arquivos não são prosa.
        for (const re of [/(?:https?:\/\/|ftp:\/\/|\/\/|mailto:|www\.)[^\s<>\[\]{}]+/gi,
            /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu,
            /\b10\.\d{4,9}\/[^\s<>\[\]{}]+/g,
            /[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*\.[\p{L}]{2,24}(?:\/[^\s<>\[\]{}]*)?/gu,
            /&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/gi]) {
            for (const m of s.matchAll(re)) protect(m.index, m.index + m[0].length);
        }
        function blanked() {
            const merged = [];
            for (const r of ranges.sort((a, b) => a.start - b.start || b.end - a.end)) {
                const previous = merged[merged.length - 1];
                if (previous && r.start <= previous.end) previous.end = Math.max(previous.end, r.end);
                else merged.push({...r});
            }
            const chunks = []; let pos = 0;
            for (const r of merged) { chunks.push(s.slice(pos, r.start), s.slice(r.start, r.end).replace(/[^\r\n]/g, ' ')); pos = r.end; }
            chunks.push(s.slice(pos)); return chunks.join('');
        }
        let view = blanked();
        // Conserva títulos, listas de obras e as seções finais.
        const endMatter = new Set(['referências', 'referencias', 'bibliografia', 'fontes', 'notas', 'notas e referências',
            'ligações externas', 'ligacoes externas', 'ver também', 'ver tambem', 'leitura adicional',
            'references', 'notes', 'bibliography', 'external links', 'see also', 'further reading',
            'références', 'notes et références', 'bibliographie', 'liens externes', 'voir aussi',
            'einzelnachweise', 'literatur', 'weblinks', 'siehe auch', 'referencias', 'enlaces externos', 'véase también']);
        let protectedLevel = null, offset = 0;
        for (const line of view.match(/[^\n]*(?:\n|$)/g) || []) {
            if (!line) continue;
            const h = line.match(/^[ \t]*(={1,6})\s*(.*?)\s*\1\s*$/);
            if (h) {
                if (protectedLevel !== null && h[1].length <= protectedLevel) protectedLevel = null;
                if (endMatter.has(h[2].trim().normalize('NFC').toLocaleLowerCase('pt'))) protectedLevel = h[1].length;
                protect(offset, offset + line.length);
            }
            if (protectedLevel !== null || /^[ \t]*[;:|!]/.test(line)) protect(offset, offset + line.length);
            offset += line.length;
        }
        view = blanked();
        // Um erro citado como exemplo não deve virar uma correção.
        const meta = /\b(?:palavra|palavras|grafia|grafias|ortografia|expressão|expressões|termo|termos|denominação|denominações|nome|nomes|título|títulos|alcunha|pseudônimo|pseudónimo|apelido|erro ortográfico)\b/iu;
        for (const m of view.matchAll(/[^\n]+(?:\n(?![ \t]*\n)[^\n]+)*/g))
            if (meta.test(m[0].normalize('NFC'))) protect(m.index, m.index + m[0].length);
        return {shield, view: blanked(), warnings: [...warnings]};
    }
    function automaticSpelling(source, cfg, bump, warn) {
        if (!cfg.automaticSpelling) return source;
        const {shield,view,warnings}=spellingView(source), edits=[];
        warnings.forEach(warn);
        const allowed=new Set(normalizeSpellingWords(cfg.spellingAllowedWords));
        const ignored=new Set(cfg.spellingIgnoredRules||[]);
        // A lowercase page title or bold subject name can also be a proper name.
        const names=[cfg.pageTitle||''];
        for(const m of source.matchAll(/'''([^'\n]+)'''/g))names.push(m[1]);
        for(const name of names)for(const m of name.matchAll(/[\p{L}\p{M}]+/gu))allowed.add(m[0].normalize('NFC').toLocaleLowerCase('pt'));
        for(const m of view.matchAll(/[\p{L}\p{M}\p{N}_]+(?:[-'’][\p{L}\p{M}\p{N}_]+)*/gu)){
            const word=m[0].normalize('NFC');
            // Capitalization is deliberately not guessed: it may be a name.
            if(word!==word.toLocaleLowerCase('pt')||allowed.has(word)||ignored.has('word:'+word))continue;
            const rule=AUTOMATIC_SPELLING_LOOKUP.get(word);
            if(!rule)continue;
            edits.push({start:m.index,end:m.index+m[0].length,text:rule.correct});
            bump('automaticSpelling');
        }
        return shield.restore(applyEdits(shield.text,edits));
    }

    const SPELLING_REPEAT_WORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
        'com', 'ao', 'aos', 'à', 'às']);
    function normalizeSpellingWords(values) {
        if (!Array.isArray(values)) return [];
        const words = new Set();
        for (const value of values) {
            if (typeof value !== 'string') continue;
            const word = value.trim().normalize('NFC').toLocaleLowerCase('pt');
            if (word.length > 80 || !/^[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*$/u.test(word)) continue;
            words.add(word);
            if (words.size >= 500) break;
        }
        return [...words];
    }
    function spellingReview(source, options) {
        if (typeof source !== 'string') throw new TypeError('A revisão ortográfica precisa de código-fonte em texto.');
        const cfg = pageContextOptions(options || {}), {shield, view, warnings} = spellingView(source,cfg);
        const limit = Number.isInteger(cfg.spellingLimit) ? Math.min(500, Math.max(1, cfg.spellingLimit)) : 100;
        const allowed = new Set(normalizeSpellingWords(cfg.spellingAllowedWords));
        const ignoredRules = new Set(Array.isArray(cfg.spellingIgnoredRules) ? cfg.spellingIgnoredRules.filter(r => typeof r === 'string') : []);
        const occurrenceKey = (start, end, before) => JSON.stringify([start, end, before]);
        const ignored = new Set((Array.isArray(cfg.spellingIgnored) ? cfg.spellingIgnored : [])
            .filter(r => r && Number.isInteger(r.start) && Number.isInteger(r.end) && typeof r.before === 'string')
            .map(r => occurrenceKey(r.start, r.end, r.before)));
        const markers = []; let delta = 0;
        for (const m of shield.text.matchAll(/\uE000AJGX*\d+\uE001/g)) {
            delta += shield.restore(m[0]).length - m[0].length;
            markers.push({end: m.index + m[0].length, delta});
        }
        function sourceOffset(at) {
            let low = 0, high = markers.length;
            while (low < high) {
                const mid = (low + high) >>> 1;
                if (markers[mid].end <= at) low = mid + 1;
                else high = mid;
            }
            return at + (low ? markers[low - 1].delta : 0);
        }
        const candidates = [], suggestions = [], tokens = [];
        let ignoredCount = 0, ignoredRuleCount = 0, allowedCount = 0;
        for (const m of view.matchAll(/[\p{L}\p{M}\p{N}_]+(?:[-'’][\p{L}\p{M}\p{N}_]+)*/gu)) {
            const word = m[0].normalize('NFC');
            tokens.push({text: m[0], word, start: m.index, end: m.index + m[0].length});
            if (word !== word.toLocaleLowerCase('pt')) continue;
            const rule = SPELLING_LOOKUP.get(word);
            if (!rule) continue;
            if (allowed.has(word)) { allowedCount++; continue; }
            candidates.push({subtype: 'word', ruleId: 'word:' + word, word,
                start: m.index, end: m.index + m[0].length, correct: rule.correct,
                alternatives:rule.alternatives, lexicalSource: rule.source, explanation: 'Confira a grafia e o contexto antes de substituir.', category: rule.category || 'Grafia'});
        }
        if (cfg.spellingRepeated !== false) {
            for (let i = 0; i < tokens.length - 1; i++) {
                const first = tokens[i];
                if (first.word !== first.word.toLocaleLowerCase('pt') || !SPELLING_REPEAT_WORDS.has(first.word)) continue;
                let last = first, next = i + 1;
                while (next < tokens.length && tokens[next].word === first.word &&
                    tokens[next].text === first.text && /^[ \t]+$/.test(view.slice(last.end, tokens[next].start)) &&
                    /^[ \t]+$/.test(shield.text.slice(last.end, tokens[next].start))) {
                    last = tokens[next++];
                }
                if (last === first) continue;
                let following = last.end;
                while (/[ \t]/.test(shield.text[following] || '\n')) following++;
                // Uma ligação ou outro trecho protegido pode completar um nome.
                if (following < view.length && view[following] !== shield.text[following]) { i = next - 1; continue; }
                // Partículas em nomes, como de de Gaulle, não recebem esta sugestão.
                if (tokens[next] && tokens[next].word !== tokens[next].word.toLocaleLowerCase('pt') &&
                    /^[ \t]+$/.test(shield.text.slice(last.end, tokens[next].start))) { i = next - 1; continue; }
                candidates.push({subtype: 'repetition', ruleId: 'repeat:' + first.word, word: first.word,
                    start: first.start, end: last.end, correct: first.text,
                    explanation: 'A repetição pode ser intencional. Remova uma palavra apenas depois de ler a frase.', category: 'Possível repetição'});
                i = next - 1;
            }
        }
        candidates.sort((a, b) => a.start - b.start || a.end - b.end);
        const filter = ['word', 'repetition'].includes(cfg.spellingFilter) ? cfg.spellingFilter : 'all';
        const totals = {word: 0, repetition: 0}; let filteredTotal = 0;
        for (const candidate of candidates) {
            const sourceStart = sourceOffset(candidate.start), sourceEnd = sourceOffset(candidate.end);
            const before = source.slice(sourceStart, sourceEnd);
            if (ignoredRules.has(candidate.ruleId)) { ignoredRuleCount++; continue; }
            if (ignored.has(occurrenceKey(sourceStart, sourceEnd, before))) { ignoredCount++; continue; }
            totals[candidate.subtype]++;
            if (filter !== 'all' && filter !== candidate.subtype) continue;
            filteredTotal++;
            if (suggestions.length >= limit) continue;
            const left = Math.max(0, sourceStart - 90), right = Math.min(source.length, sourceEnd + 90);
            suggestions.push({kind: 'spelling', subtype: candidate.subtype, ruleId: candidate.ruleId, word: candidate.word,
                label: (candidate.subtype === 'word' ? 'Possível erro ortográfico: ' : 'Possível palavra repetida: ') + before,
                start: candidate.start, end: candidate.end, sourceStart, sourceEnd, before,
                context: (left ? '...' : '') + source.slice(left, right) + (right < source.length ? '...' : ''),
                lexicalSource: candidate.lexicalSource, explanation: candidate.explanation, category: candidate.category,
                choices:(candidate.alternatives||[candidate.correct]).map(correct=>({label:candidate.subtype==='word'?'Substituir por "'+correct+'"':'Manter apenas "'+correct+'"',after:correct}))});
        }
        return {kind: 'spelling', text: source, changes: [], removedDescriptions: [], warnings, suggestions,
            spelling: {total: totals.word + totals.repetition, shown: suggestions.length, filteredTotal, filter, totals,
                ignored: ignoredCount, ignoredRules: ignoredRuleCount, allowed: allowedCount, limit, rules: SPELLING_RULES.length}};
    }

    function* calculationSteps(job) {
        const cfg = job.options || {};
        yield 'Lendo o código-fonte...';
        if (job.kind === 'comparison') return {kind:'comparison',text:job.source,hunks:yield* comparisonStages(job.originalSource,{text:job.source})};
        if (job.kind === 'styles') return {kind:'styles',text:job.source,...templateStylesAudit(job.source)};
        if (job.kind === 'audit') return {kind:'audit',text:job.source,changes:[],warnings:[],suggestions:cfg.tableChecks===false||discussionProtectionRanges(job.source,pageContextOptions(cfg)).length?[]:tableSuggestions(job.source),
            localReports:{references:referenceAudit(job.source,cfg),syntax:syntaxAudit(job.source),translation:cfg.multilingual?translationAudit(job.source):[],
                tables:cfg.tableChecks===false?[]:tableAnalysis(job.source).findings,biographies:biographyStyleAudit(job.source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(job.source)}};
        if (job.safetySource !== undefined) {
            const problem = safeComposition(job.safetySource, job.source);
            if (problem) throw new Error(problem + ' A escolha não foi aplicada.');
        }
        let result;
        if (job.kind === 'spelling') {
            yield 'Conferindo a lista de ortografia...';
            result = spellingReview(job.source, cfg);
            if (job.previousSource !== undefined) result.preservation = preservationAudit(job.previousSource, job.source).filter(f => f.code !== 'lost-prose');
            else result.preservation = [];
            if (job.originalSource !== undefined && job.previousSource !== undefined) {
                result.comparisonBefore = job.originalSource;
                result.appliedHunks = yield* comparisonStages(job.originalSource, {text:job.source});
            }
            return result;
        }
        result = yield* cleanupStages(job.source, job.kind === 'refresh' ? {...cfg, review: false} : cfg);
        if (job.kind === 'refresh') result = {...result, text: job.source, changes: [], removedDescriptions: [],
            suggestions: reviewSuggestions(job.source, cfg)};
        yield 'Conferindo a preservação do conteúdo...';
        const preservationBefore=job.originalSource??job.source;
        const expectedSpelling=result.changes?.some(c=>c.id==='automaticSpelling')?
            automaticSpelling(preservationBefore,pageContextOptions({...DEFAULTS,...cfg}),()=>{},()=>{}):preservationBefore;
        result.preservation = preservationAudit(verifiedDOIExpectedSource(expectedSpelling,cfg),result.text,cfg);
        yield 'Preparando os avisos...';
        result.localReports = {references: job.kind === 'refresh' ? referenceAudit(result.text,cfg) : result.audit || referenceAudit(result.text,cfg),
            syntax: syntaxAudit(result.text), translation: cfg.multilingual ? translationAudit(result.text) : [],
            tables: cfg.tableChecks === false ? [] : tableAnalysis(result.text).findings, biographies:biographyStyleAudit(result.text,cfg), dates: cfg.dateChecks === false ? [] : dateAudit(result.text)};
        if (job.kind === 'adjust') {
            yield 'Preparando a comparação dos ajustes...';
            result.comparisonBefore = job.originalSource ?? job.source;
            result.hunks = yield* comparisonStages(result.comparisonBefore, result);
        }
        if (job.kind === 'refresh' && job.originalSource !== undefined) {
            result.comparisonBefore = job.originalSource;
            result.appliedHunks = yield* comparisonStages(job.originalSource, {text:result.text});
        }
        const byteBefore=job.originalSource??job.source;
        const byteHunks=result.hunks||result.appliedHunks||diffHunks(byteBefore,result.text);
        result.byteMetrics=byteMetrics(byteBefore,result.text,byteHunks);
        result.minorCheck=minorEligibility(byteBefore,result.text,{...cfg,hunks:byteHunks,metrics:result.byteMetrics});
        return result;
    }
    function calculate(job) {
        const steps = calculationSteps(job); let next;
        do { next = steps.next(); } while (!next.done);
        return next.value;
    }
    function installWorkerEngine() {
        if (root.document || typeof root.importScripts !== 'function' || typeof root.postMessage !== 'function') return false;
        root.onmessage = event => {
            const request = event.data;
            if (!request || request.type !== 'calculate' || !Number.isInteger(request.id)) return;
            try {
                const steps = calculationSteps(request.job); let next;
                do {
                    next = steps.next();
                    if (!next.done) root.postMessage({type: 'progress', id: request.id, message: next.value});
                } while (!next.done);
                root.postMessage({type: 'result', id: request.id, result: next.value});
            } catch (error) { root.postMessage({type: 'error', id: request.id, message: error.message}); }
        };
        return true;
    }

    // A conferência usa somente parse/query. Nenhuma ação de edição é chamada.
    function renderedTableCells(html, Parser) {
        const doc = new Parser().parseFromString(html, 'text/html');
        return [...doc.querySelectorAll('table.wikitable')].filter(table=>!table.closest('.navbox,.infobox,.infobox_v2,table[class*="infobox_"]')).map(table=>
            [...table.querySelectorAll('tr')].filter(row=>row.closest('table')===table).map(row=>
                [...row.children].filter(cell=>/^(?:TD|TH)$/.test(cell.tagName)).map(cell=>{
                    const copy = cell.cloneNode(true);
                    copy.querySelectorAll('.reference,.mw-editsection,script,style').forEach(e=>e.remove());
                    return copy.textContent.replace(/\s+/g,' ').trim();
                })));
    }
    function literalOuterTables(source) {
        const view=tableSyntaxView(source).view,stack=[],out=[];
        for(const m of view.matchAll(/^[ \t]*(\{\||\|\})[^\r\n]*(?:\r?\n|$)/gm)){
            if(m[1]==='{|')stack.push(m.index);
            else if(stack.length){const start=stack.pop();if(!stack.length)out.push(source.slice(start,m.index+m[0].length));}
        }
        if(stack.length)out.push(source.slice(stack[0]));
        return out;
    }
    function tableSourceWithoutScopes(source) {
        return source.replace(/^([ \t]*!)([^\r\n]*)/gm,(all,lead,body)=>{
            const view=tableCellView(body),cuts=[...view.matchAll(/!!/g)].map(m=>m.index);
            const starts=[0,...cuts.map(i=>i+2)],ends=[...cuts,body.length];
            const cleaned=starts.map((start,i)=>{
                const raw=body.slice(start,ends[i]),mask=tableCellView(raw),at=mask.indexOf('|');
                if(at<0)return raw;
                const attrs=raw.slice(0,at),rest=raw.slice(at);
                if(!/\bscope="(?:col|row)"/.test(attrs))return raw;
                const clean=attrs.replace(/(?:^|\s+)scope="(?:col|row)"/g,'');
                return clean.trim()?clean+rest:rest.slice(1);
            });
            return lead+cleaned.join('!!');
        });
    }
    function staticRenderedHeader(header,Parser) {
        const out=[];
        for(const line of header.split(/\r?\n/).filter(x=>x.trim())){
            const body=line.replace(/^[ \t]*!/,''),view=tableCellView(body),cuts=[...view.matchAll(/!!|\|\|/g)].map(m=>m.index),starts=[0,...cuts.map(i=>i+2)],ends=[...cuts,body.length];
            for(let i=0;i<starts.length;i++){
                let raw=body.slice(starts[i],ends[i]),mask=tableCellView(raw),pipe=mask.indexOf('|');
                if(pipe>=0)raw=raw.slice(pipe+1);
                raw=raw.replace(/\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]/g,(_,target,label)=>label??target).replace(/'{2,5}/g,'');
                const doc=new Parser().parseFromString(raw,'text/html');out.push(doc.body.textContent.replace(/\s+/g,' ').trim());
            }
        }
        return out;
    }
    function renderedTableRegroupingProof(beforeHtml,afterHtml,Parser,sourceBefore,sourceAfter) {
        if(typeof sourceBefore!=='string'||typeof sourceAfter!=='string'||sourceBefore===sourceAfter)return {accepted:false};
        const plan=tableYearSectionCandidates(sourceBefore);
        if(!plan.edits.length)return {accepted:false};
        const expectedSource=applyEdits(sourceBefore,plan.edits);
        const expectedTables=literalOuterTables(expectedSource).map(tableSourceWithoutScopes),actualTables=literalOuterTables(sourceAfter).map(tableSourceWithoutScopes);
        if(JSON.stringify(expectedTables)!==JSON.stringify(actualTables))return {accepted:false};
        const remaining=plan.proofs.map(p=>({...p,headerCells:staticRenderedHeader(p.header,Parser)}));
        const doc=new Parser().parseFromString(beforeHtml,'text/html'),expected=[];let matched=0;
        const cells=row=>[...row.children].filter(c=>/^(?:TD|TH)$/.test(c.tagName)).map(cell=>{
            const copy=cell.cloneNode(true);copy.querySelectorAll('.reference,.mw-editsection,script,style').forEach(n=>n.remove());return copy.textContent.replace(/\s+/g,' ').trim();
        });
        for(const table of [...doc.querySelectorAll('table.wikitable')].filter(t=>!t.closest('.navbox,.infobox,.infobox_v2,table[class*="infobox_"]'))){
            const rows=[...table.querySelectorAll('tr')].filter(r=>r.closest('table')===table),values=rows.map(cells);
            const groups=[];let current=null,valid=values.length>0;
            for(let index=1;index<rows.length;index++){
                const row=rows[index],heads=[...row.querySelectorAll('h3,h4,h5')].filter(h=>h.closest('tr')===row);
                const head=heads.length===1&&heads[0].cloneNode(true);
                if(head)head.querySelectorAll('.mw-editsection,script,style').forEach(n=>n.remove());
                const year=head&&head.textContent.replace(/\s+/g,' ').trim();
                if(year&&/^[12]\d{3}$/.test(year)&&values[index].filter(Boolean).length===1&&values[index].includes(year)){
                    current={year,rows:[]};groups.push(current);
                }else if(current)current.rows.push(values[index]);else {valid=false;break;}
            }
            const years=groups.map(g=>g.year),index=valid?remaining.findIndex(p=>JSON.stringify(p.years)===JSON.stringify(years)&&JSON.stringify(p.headerCells)===JSON.stringify(values[0])):-1;
            if(index<0){expected.push(values);continue;}
            remaining.splice(index,1);matched++;
            for(const group of groups)expected.push([values[0],...group.rows]);
        }
        const actual=renderedTableCells(afterHtml,Parser);
        return {accepted:remaining.length===0&&matched===plan.edits.length&&JSON.stringify(expected)===JSON.stringify(actual),tables:matched,years:plan.proofs.reduce((n,p)=>n+p.sections,0)};
    }

    function previewDecision(before, after, Parser, sourceBefore, sourceAfter) {
        if (!before || !after || typeof before.text !== 'string' || typeof after.text !== 'string')
            return {checked:false, reason:'A pré-visualização ficou incompleta.'};
        const old = renderedAudit(before.text, before.parsewarnings, Parser);
        const now = renderedAudit(after.text, after.parsewarnings, Parser);
        const introduced = now.findings.filter(f => !old.findings.includes(f));
        const resolved = old.findings.filter(f => !now.findings.includes(f));
        const errorCounts = parsed => {
            const doc = new Parser().parseFromString(parsed.text,'text/html'), counts = new Map();
            const add = value => {const text=value.replace(/\s+/g,' ').trim();if(text)counts.set(text,(counts.get(text)||0)+1);};
            doc.querySelectorAll('.mw-ext-cite-error,.cite-error,.error,.cs1-visible-error,.cs1-hidden-error,.scribunto-error').forEach(e=>add(e.textContent));
            return counts;
        };
        const priorCounts=errorCounts(before), nextCounts=errorCounts(after);
        for(const [message,count] of nextCounts) if(priorCounts.has(message)&&count>priorCounts.get(message))
            introduced.push(message+' Há '+(count-priorCounts.get(message))+' ocorrência(s) nova(s).');
        const oldTables = renderedTableCells(before.text,Parser), newTables = renderedTableCells(after.text,Parser);
        let tableRegrouping=null;
        if(JSON.stringify(oldTables)!==JSON.stringify(newTables)){
            tableRegrouping=renderedTableRegroupingProof(before.text,after.text,Parser,sourceBefore,sourceAfter);
            if(!tableRegrouping.accepted)introduced.push('O conteúdo visível das células de tabelas mudou na pré-visualização.');
        }
        const structuralProof=renderedStructuralTableProof(before.text,after.text,Parser,sourceBefore,sourceAfter);
        if(structuralProof.applied&&!structuralProof.accepted)introduced.push(structuralProof.reason);
        return {checked:true, accepted:introduced.length === 0, introduced, resolved,
            previous:old.findings, current:now.findings,tableRegrouping,structuralProof};
    }
    function noteRendererProofs(html, Parser) {
        const doc = new Parser().parseFromString(html, 'text/html'), groups = new Set();
        for (const error of doc.querySelectorAll('.mw-ext-cite-error,.cite-error,.error')) {
            const text = error.textContent || '';
            const absent = /(?:n[aã]o.*(?:encontrad|definid|correspond)|sem.*(?:references|refer[eê]ncias)|no corresponding|not found)/i.test(text);
            if (!absent || !/references|refer[eê]ncias/i.test(text)) continue;
            // Prefix words are case-insensitive, but Cite group names are not.
            // Repeated errors for one group produce only one source-bound proof.
            const pattern = /(?:group|grupo)\s*(?:(?:=|:)\s*|(?:chamado|named)\s*)?["\u201c\u201d\u00ab\u00bb\u2018\u2019\x27]?([A-Za-z-]+)(?=["\u201c\u201d\u00ab\u00bb\u2018\u2019\x27\s/>]|$)/gi;
            for(const match of text.matchAll(pattern))
                if(['nota','Nota','nt','lower-alpha'].includes(match[1]))groups.add(match[1]);
        }
        return [...groups].map(group=>({group,missing:true}));
    }
    async function taskParse(task, source) {
        task.guard();
        if (!task.previewSession) task.previewSession = onlineSession();
        const session = task.previewSession;
        task.preflightRequests = [...session.requests];
        const parsed = await parseDraft(session, source);
        task.guard();
        return parsed;
    }
    async function prepareAutomaticProofs(task, options) {
        const cfg = await prepareHeadingMainArticles(task,options);
        task.preflightRequests ||= [];
        if (cfg.autoPreview !== false && cfg.references && cfg.namespaceNumber === 0 && !cfg.sectionOnly &&
            v20PreflightCandidates(task.source,cfg).noteGroups.length>0 &&
            !discussionProtectionRanges(task.source,cfg).length) {
            try {
                message('Conferindo a lista de notas na pré-visualização...');
                task.previewBaseline = await taskParse(task, task.source);
                cfg.noteRendererProofs = noteRendererProofs(task.previewBaseline.text, root.DOMParser);
                cfg.noteRendererProofSource = task.source;
            } catch(error) { task.guard(); cfg.noteRendererProofs = []; }
        }
        if (cfg.registryDoiCheck === false || !cfg.citations || !cfg.citationRepairs ||
            typeof root.fetch !== 'function' || discussionProtectionRanges(task.source,cfg).length) return cfg;
        const candidates = v20PreflightCandidates(task.source,cfg).dois;
        cfg.doiRepairProofs = [];
        for (const candidate of candidates.slice(0,3)) {
            task.guard();
            message('Conferindo a pontuação de um DOI no registro da publicação...');
            const controller = typeof root.AbortController === 'function' ? new root.AbortController() : null;
            const pending = {abort:()=>controller?.abort()};
            task.preflightRequests.push(pending);
            const timer = root.setTimeout(()=>controller?.abort(),6000);
            try {
                const read = doi => root.fetch('https://api.crossref.org/works/'+encodeURIComponent(doi),
                    {method:'GET',credentials:'omit',signal:controller?.signal,headers:{Accept:'application/json'}});
                const originalResponse = await read(candidate.original); task.guard();
                if (originalResponse.status !== 404) continue;
                const agencyResponse = await root.fetch('https://api.crossref.org/works/'+encodeURIComponent(candidate.original)+'/agency',
                    {method:'GET',credentials:'omit',signal:controller?.signal,headers:{Accept:'application/json'}}); task.guard();
                if (agencyResponse.status !== 404) continue;
                const response = await read(candidate.corrected); task.guard();
                if (response.status !== 200) continue;
                const data = await response.json(); task.guard(); const m = data?.message;
                const title = m?.title?.length === 1 ? m.title[0] : null;
                const dates = ['published','published-print','published-online'].map(k=>m?.[k]?.['date-parts']?.[0]?.[0]).filter(Number.isInteger);
                const years = [...new Set(dates)];
                if (!title || years.length !== 1 || typeof m?.DOI !== 'string') continue;
                cfg.doiRepairProofs.push({...candidate,originalStatus:404,originalAgencyStatus:404,correctedStatus:200,registry:'crossref',
                    checkedAt:new Date().toISOString(),articleTitle:title,publicationYear:years[0],
                    authorSurnames:(m.author||[]).map(a=>a.family).filter(v=>typeof v==='string'),metadataDoi:m.DOI,
                    sourceUrl:'https://api.crossref.org/works/'+encodeURIComponent(candidate.corrected)});
            } catch(error) { task.guard(); }
            finally { root.clearTimeout(timer); task.preflightRequests=task.preflightRequests.filter(p=>p!==pending); }
        }
        return cfg;
    }
    async function verifyAutomaticResult(task, result, options) {
        const loss = (result.preservation||[]).filter(f=>/^lost-(?:url|image|identifier|protected|prose|repaired-reference)$/.test(f.code));
        if(result.text!==task.source && loss.length) {
            const fresh = await computeLocal(task,{kind:'refresh',source:task.source,
                originalSource:appliedBaseline(editor(),task.source),options});
            task.guard();
            fresh.previewCheck={status:'local-rollback',checked:false,reason:'A verificação local encontrou possível retirada de conteúdo.'};
            fresh.warnings.push('Os ajustes desta execução foram recusados pela verificação de preservação: '+loss.map(f=>f.message).join(' '));
            return fresh;
        }
        if (options.autoPreview === false || result.text === task.source ||
            discussionProtectionRanges(task.source, options).length) return result;
        try {
            message('Conferindo os ajustes na pré-visualização, sem salvar...');
            const before = task.previewBaseline || await taskParse(task,task.source);
            const after = await taskParse(task,result.text);
            const syntaxProof=syntaxRepairSourceProof(task.source,result.text,options);
            let syntaxBaseline=null;
            if(syntaxProof.applied&&syntaxProof.accepted){
                message('Conferindo a estrutura recuperada, sem salvar...');
                syntaxBaseline={...await taskParse(task,syntaxProof.baseline),source:syntaxProof.baseline};
            }
            let decision=syntaxPreviewDecision(before,syntaxBaseline,after,root.DOMParser,task.source,result.text,options);
            const initialDecision=decision;
            if (decision.accepted) {
                result.previewCheck = {...decision,status:'checked'};
                return result;
            }
            // Uma tentativa de isolar o reparo evita dezenas de pedidos em páginas grandes.
            const hunks = comparison(task.source,result), families = new Map();
            hunks.forEach((h,index)=>{
                const key = h.transaction || (h.reasons||[]).join('|') || 'change-'+index;
                if (!families.has(key)) families.set(key,[]); families.get(key).push(h);
            });
            let isolated = null;
            const keys = [...families.keys()];
            const preferred = keys.filter(k=>/refer[eê]n|cita|par[aâ]metro|tabela|nota/i.test(k));
            for (const key of (preferred.length ? preferred : keys).slice(0,2)) {
                const omitted = new Set(families.get(key));
                const candidate = composeChanges(task.source,hunks.map(h=>({...h,accepted:!omitted.has(h)})));
                if (candidate === task.source || candidate === result.text || safeComposition(task.source,candidate)) continue;
                const parsed = await taskParse(task,candidate);
                decision=syntaxPreviewDecision(before,syntaxBaseline,parsed,root.DOMParser,task.source,candidate,options);
                if (decision.accepted) { isolated = {candidate,key,decision}; break; }
            }
            const candidate = isolated?.candidate ?? task.source;
            const fresh = await computeLocal(task,{kind:'refresh',source:candidate,
                originalSource:appliedBaseline(editor(),task.source),options});
            task.guard();
            fresh.previewCheck = {status:'rollback',checked:true,accepted:true,
                introduced:initialDecision.introduced,
                omitted:isolated?.key || 'Todos os ajustes desta execução'};
            fresh.hunks = comparison(fresh.comparisonBefore ?? task.source,fresh);
            fresh.changes = candidate===task.source ? [] : [{id:'verifiedRetainedRepairs',label:'Ajustes conferidos mantidos',count:fresh.hunks.length}];
            fresh.warnings.push(isolated ? 'Um conjunto de ajustes foi desfeito porque introduziu erro na pré-visualização: '+isolated.key+'.' :
                'Os ajustes desta execução foram recusados porque introduziram erros na pré-visualização. O texto anterior foi preservado.');
            return fresh;
        } catch(error) {
            task.guard();
            result.previewCheck = {checked:false,status:'incomplete',reason:onlineError(error)};
            result.warnings.push('A pré-visualização automática não terminou. Os ajustes locais precisam ser conferidos na pré-visualização normal.');
            return result;
        } finally { task.previewSession = null; task.preflightRequests = []; }
    }

    const api = {syntaxRepairPlan,automaticSyntaxRepairs,syntaxRepairPrefix,syntaxRepairEquivalence,syntaxRepairEquivalenceSource,
        syntaxRepairSourceProof,syntaxRepairInventoryProof,syntaxPreviewDecision,syntaxRepairTransactions,syntaxPrefixOptions,
        syntaxRepairCacheStatus:()=>({entries:v24SyntaxPlanCache.size,estimatedBytes:v24SyntaxPlanCacheBytes,maximumEstimatedBytes:4194304}),
        structuralArticlePlan,automaticStructureCleanup,structuralAudit,preserveLegacyRendererLayout,renderedStructuralTableProof,structuralReferenceBank,
        removeKnownTranslationResidues,knownTranslationResidueChanges,residueEquivalenceSource,removeWholeArticleMarkdownFence,removeObsoleteShortDescriptionCategory,repairDoubleEncodedAmpersands,linkedPortalEvidenceText,noteGroupInventory,womanEligibility,biographySubjectMatchesTitle,biographyIsWoman,verifiedWomenCategories:[...VERIFIED_WOMEN_CATEGORIES],sportLabels:{...SPORT_LABEL_PORTALS},occupationPortals:{...OCCUPATION_PORTALS},nationalityPortals:{...NATIONALITY_PORTALS},repairColumnListArguments,version: VERSION, catalogDate: CATALOG_DATE,
        headingMainArticleCandidates, automaticHeadingMainArticles, canonicalPortugueseLinks, historicalDateMarkup, captionTerminalPeriods, repairCenturySyntax, technicalFinding, groupedTechnicalFindings, renderedTableRegroupingProof,
        tableYearSectionCandidates, automaticTableYearSections, automaticTables, tableStructureSignature, automaticRulesPass, automaticMissingNoteCollector, automaticCitationRepairs, automaticLegacyReferenceColumns, automaticHeadingLinks, automaticShortCitationAuthors, biographyStyleAudit, v20PreflightCandidates, verifiedDOIExpectedSource, previewDecision, noteRendererProofs,
        comparisonDisplayGroups, changeExplanation, tableAnalysis, tableSuggestions, strictDate, dateAudit, linkOccurrences, replaceDisambiguationLink, summaryTopics, summaryForTopics, cssDeclarations, templateStylesAudit, cssRetention, diagnosticReport, diagnosticChanges,
        calculate, brazilStatePortalAliases:[...BRAZIL_STATE_PORTAL_ALIASES], occupationCase, occupationValueCase, occupationLabels:[...COMMON_OCCUPATIONS], pageContextOptions, supportedPageContext, discussionProtectionRanges, automaticSpelling, automaticSpellingRules: [...AUTOMATIC_SPELLING_LOOKUP.values()].map(r=>({...r})), livingBirthAge, livingDniValue, biographyPortalCandidates, addAutomaticBiographyPortals, neutralAutomaticReferenceNames, spellingReview, normalizeSpellingWords, spellingRules: SPELLING_RULES.map(r => ({...r})),
        infoboxCatalog: INFOBOX_CATALOG, obsoleteCatalog: OBSOLETE_CATALOG, templateCatalog: TEMPLATE_CATALOG,
        defaults: Object.assign({}, DEFAULTS), cleanup, applySuggestion, linkTargets, diffHunks, comparison, composeChanges,
        referenceAudit, safeComposition, duplicateReferenceSuggestions, templateTargets, fragmentTargets, imageTargets, normalizeFragment, renderedAudit, presetOptions,
        syntaxAudit, preservationAudit, plainProse, lostWords, renderedProse, composeSection, sectionRange, protectedView, referenceTransactions,
        biographyInfoboxes: [...BIOGRAPHY_INFOBOXES, ...BIOGRAPHY_MUSIC_BOXES, 'info/santo'], biographyDetection, addBiographyPortal,
        authorityProperties: AUTHORITY_PROPERTIES.slice(), authorityEligibility, authorityPresent, authorityRenderConfirmation, authorityDisplayConfirmed, footerTokens, footerCandidates, classifyFooterTemplate, orderFooter, orderEndSections, addAuthorityControl,
        translationRules: TRANSLATION_RULES, translationAudit, migrateForeignTemplate, foreignSyntax, unifiedNotesReferences, externalColumnsSuggestions, endMatterColumns, legacyReferenceColumnSuggestions,
        parserCacheStatus, automaticParameters, automaticIdenticalReferences, byteMetrics, minorEligibility, mechanicalMinorResult,
        referenceEntryCounts, referenceColumnPlans, referenceColumns, notAppliedReasons, noteReferenceColumnConfirmation, shortCitationAudit,
        referenceNameUses, numericReferenceAudit, citationRepairSuggestions,
        citationParameters: CS1_KEYS.slice(), citationAliases: Object.assign({}, PARAMS), shortcuts: Object.assign({}, SHORTCUTS)};
    if (typeof module === 'object' && module.exports) { module.exports = api; return; }
    if (root.RevisaWiki || root.AjusteGeralPT) {
        const loaded = root.RevisaWiki || root.AjusteGeralPT;
        root.RevisaWiki = loaded;
        root.AjusteGeralPT = loaded;
        loaded.loadCount = (loaded.loadCount || 1) + 1;
        const counter = root.document?.querySelector('.ajg-diagnostics .ajg-load-count');
        if (counter) counter.textContent = 'Carregamentos detectados: ' + loaded.loadCount + '.';
        if (root.mw?.notify) root.mw.notify('RevisaWiki foi carregado mais de uma vez. Versão ativa: ' + loaded.version +
            '. Versão solicitada agora: ' + VERSION + '. Confira as importações no common.js e recarregue a página.', {type: 'warn', autoHide: false});
        return;
    }
    api.loadCount = 1;
    root.RevisaWiki = api;
    // Evita uma segunda interface se um carregador antigo ainda estiver presente.
    root.AjusteGeralPT = api;
    if (installWorkerEngine()) return;
    if (!root.mw || !root.mw.config || !root.mw.loader) return;
    // A URL confirma o wiki mesmo antes de todas as configurações estarem prontas.
    const host = root.location && root.location.hostname || root.mw.config.get('wgServerName');
    if (host ? host !== 'pt.wikipedia.org' : root.mw.config.get('wgDBname') !== 'ptwiki') return;
    const stylesMode = root.mw.config.get('wgNamespaceNumber') === 10 && root.mw.config.get('wgPageContentModel') === 'sanitized-css';
    if (!supportedPageContext(Number(root.mw.config.get('wgNamespaceNumber')),root.mw.config.get('wgPageContentModel'))) return;

    const mw = root.mw;
    let $ = null, last = null, panel = null, panelEditor = null, publishAdjustment = null;
    api.uiStatus = 'loading';
    function sourceTarget() {
        const target = root.ve && root.ve.init && root.ve.init.target;
        const surface = target && (typeof target.getSurface === 'function' ? target.getSurface() : target.surface);
        return surface && typeof surface.getMode === 'function' && surface.getMode() === 'source' ? target : null;
    }
    function editor() {
        const target = root.ve && root.ve.init && root.ve.init.target;
        const surface = target && (typeof target.getSurface === 'function' ? target.getSurface() : target.surface);
        if (surface && typeof surface.getMode === 'function') {
            if (surface.getMode() !== 'source') return null;
            if (typeof surface.getModel !== 'function') return null;
            const model = surface.getModel();
            if (!model || typeof model.getDocument !== 'function') return null;
            const doc = model.getDocument();
            if (!doc || typeof doc.getDocumentRange !== 'function') return null;
            if (typeof model.getDom !== 'function' || typeof model.getLinearFragment !== 'function') return null;
            return {id: model, read: () => model.getDom(), locate(start, end) {
            if (typeof model.setLinearSelection !== 'function' || typeof root.ve.Range !== 'function') throw new Error('A seleção não está disponível no editor de 2017.');
                const converter = root.ve.dm?.sourceConverter;
                if (!converter?.getDataFromSourceText) throw new Error('O conversor de posições do editor de 2017 não está disponível.');
                const source = model.getDom(), position = offset => converter.getDataFromSourceText(source.slice(0, offset)).length - 1;
                model.setLinearSelection(new root.ve.Range(position(start), position(end)));
                if (surface.getView) { const view = surface.getView(); if (view?.focus) view.focus(); if (view?.scrollSelectionIntoView) view.scrollSelectionIntoView(); }
            }, write(text) {
                model.breakpoint();
                model.getLinearFragment(doc.getDocumentRange()).insertContent(text);
                model.breakpoint();
            }};
        }
        const textarea = root.document.getElementById('wpTextbox1');
        if (!textarea || !$.fn.textSelection) return null;
        // wikEd mantém outro modelo e não é um destino suportado por este adaptador.
        if (root.wikEd && root.wikEd.useWikEd) return null;
        return {id: textarea, read: () => $(textarea).textSelection('getContents'), locate(start, end) {
            $(textarea).textSelection('setSelection', {start, end});
            $(textarea).textSelection('scrollToCaretPosition');
            if (textarea.getClientRects().length) textarea.focus();
        }, write(text) {
            const selection = $(textarea).textSelection('getCaretPosition', {startAndEnd: true});
            $(textarea).textSelection('setContents', text);
            $(textarea).trigger('input').trigger('change');
            if (Array.isArray(selection)) $(textarea).textSelection('setSelection', {
                start: Math.min(selection[0], text.length), end: Math.min(selection[1], text.length)});
        }};
    }
    function summaryEditor() {
        const target = sourceTarget();
        if (target) {
            const widget = () => target.saveDialog && target.saveDialog.editSummaryInput;
            return {id: target, read() {
                const input = widget();
                const stored = target.editSummaryValue || target.initialEditSummary || '';
                if (!input || typeof input.getValue !== 'function') return stored;
                const value = input.getValue();
                return value || target.saveDialog.changedEditSummary ? value : stored;
            }, snapshot() {
                return {stored: target.editSummaryValue, display: this.read(),
                    dialogChanged: target.saveDialog && target.saveDialog.changedEditSummary};
            }, write(value) {
                target.editSummaryValue = value;
                const input = widget();
                if (input && typeof input.setValue === 'function') input.setValue(value);
            }, restore(snapshot) {
                target.editSummaryValue = snapshot.stored;
                const input = widget();
                if (input && typeof input.setValue === 'function') input.setValue(snapshot.display);
                if (target.saveDialog && snapshot.dialogChanged !== undefined) {
                    target.saveDialog.changedEditSummary = snapshot.dialogChanged;
                }
            }};
        }
        const input = root.document.getElementById('wpSummary');
        if (!input) return null;
        return {id: input, read: () => input.value, snapshot: () => input.value,
            write: value => { $(input).val(value).trigger('input').trigger('change'); },
            restore(value) { this.write(value); }};
    }
    function personalConfig() { return root.RevisaWikiConfig || root.AjusteGeralPTConfig || {}; }
    function automaticSummary(kinds, topics) {
        const cfg = personalConfig();
        if (currentOptions(false).autoSummary === false || !topics?.length) return '';
        if (typeof cfg.summaryText === 'string') return cfg.summaryText.trim();
        return summaryForTopics(topics);
    }
    function restoreOwnedSummary(generated) {
        if (!generated) return;
        const summary = summaryEditor();
        if (summary && summary.id === generated.id && summary.read() === generated.after)
            summary.restore(generated.before);
    }
    function fillSummary(kinds, previous, topics) {
        const summary = summaryEditor(), text = automaticSummary(kinds, topics);
        if (!summary) return null;
        if (!text) {
            // Desativar o preenchimento não deixa um resumo antigo afirmar uma escolha rejeitada.
            restoreOwnedSummary(previous);
            return null;
        }
        const before = summary.read();
        if (previous && previous.id === summary.id && before === previous.after) {
            const after = (previous.prefix || '') + text;
            summary.write(after);
            return {...previous, after};
        }
        // Conserva o marcador automático da seção e qualquer resumo já escrito.
        if (!/^\s*(?:\/\*[^\r\n]*?\*\/\s*)?$/.test(before)) return null;
        const prefix = before.trim() ? before.trimEnd() + ' ' : '';
        const after = prefix + text, snapshot = summary.snapshot();
        summary.write(after);
        return {id: summary.id, before: snapshot, prefix, after};
    }
    function rememberEdit(adapter, before, after, kind = 'syntax', ruleLabel) {
        if (before === after) return;
        const continuing = last && last.id === adapter.id && last.after === before;
        const originalText = continuing ? last.before : before;
        const previousSummary = continuing ? last.summary : null;
        // Rejeitar a última escolha deve retirar também o resumo gerado pelo script.
        // Um resumo que o editor escreveu continua intacto.
        if (after === originalText) {
            restoreOwnedMinor();
            try { restoreOwnedSummary(previousSummary); }
            catch (error) { root.console.warn('RevisaWiki: não foi possível restaurar o resumo.', error); }
            last = null;
            return;
        }
        const kinds = [...new Set([...(continuing ? last.kinds || ['syntax'] : []), kind])];
        const topics = summaryTopics(originalText, after, kinds);
        const rules = [...new Set([...(continuing ? last.rules || [] : []), ...(ruleLabel ? [ruleLabel] : [])])].slice(0, 30);
        last = {id: adapter.id, before: originalText, after, summary: previousSummary, kinds, topics, rules};
        // Uma falha no resumo não invalida a alteração já confirmada no texto.
        try { last.summary = fillSummary(kinds, previousSummary, topics); }
        catch (error) { root.console.warn('RevisaWiki: não foi possível preencher o resumo.', error); }
    }
    function message(text) {
        if (panel) panel.querySelector('.ajg-status').textContent = text;
    }
    async function undo() {
        const adapter = editor();
        if (!last || !adapter || adapter.id !== last.id || adapter.read() !== last.after) {
            message('O texto mudou após o ajuste. Use o Desfazer do editor para preservar suas edições posteriores.'); return;
        }
        const previous = last, task = beginLocalAnalysis(adapter, adapter.read(), 'Preparando o texto anterior...');
        if (!task) return;
        try {
            const result = await computeLocal(task, {kind: 'refresh', source: previous.before, options: {...currentOptions(false), review: false}});
            task.guard();
            adapter.write(previous.before);
            if (adapter.read() !== last.before) throw new Error('O editor não confirmou a restauração.');
            const summary = summaryEditor(), generated = last.summary;
            if (generated && summary && summary.id === generated.id && summary.read() === generated.after) {
                summary.restore(generated.before);
            }
            restoreOwnedMinor();last = null;
            panel.querySelector('.ajg-undo').disabled = true;
            showReport({...result, changes: [], suggestions: [], preservation: []});
            comparisonPlan = null; panel.querySelector('.ajg-diff').replaceChildren();
            message('Texto anterior ao ajuste restaurado.');
        } catch (error) { if (localTask === task) message('Não foi possível desfazer: ' + error.message); }
        finally { finishLocalAnalysis(task); }
    }
    const PREF_KEY = 'RevisaWiki.preferences.v1.2';
    const ignoredSuggestions = new Set();
    let spellingIgnored = [], spellingIgnoredSource = null;
    let spellingIgnoredRules = new Set(), spellingFilter = 'all';
    let spellingPreferences = {words: [], repeated: true}, spellingStorageWarning = false;
    const SPELLING_PREF_KEY = 'RevisaWiki.spelling.v1.3:' + encodeURIComponent(
        String(mw.config.get('wgDBname') || 'ptwiki') + ':' + String(mw.config.get('wgUserName') || 'anon'));
    try {
        const stored = JSON.parse(root.localStorage.getItem(SPELLING_PREF_KEY) || 'null');
        if (stored && typeof stored === 'object') {
            spellingPreferences.words = normalizeSpellingWords(stored.words);
            if (typeof stored.repeated === 'boolean') spellingPreferences.repeated = stored.repeated;
        }
    } catch (_) { spellingStorageWarning = true; }
    function spellingOptions(ignored = spellingIgnored) {
        const personal = personalConfig();
        return {...currentOptions(false),...personal, spellingIgnored: ignored, spellingIgnoredRules: [...spellingIgnoredRules],
            spellingAllowedWords: normalizeSpellingWords([...spellingPreferences.words,
                ...(Array.isArray(personal.spellingAllowedWords) ? personal.spellingAllowedWords : [])]),
            spellingRepeated: typeof personal.spellingRepeated === 'boolean' ? personal.spellingRepeated : spellingPreferences.repeated,
            spellingFilter};
    }
    function saveSpellingPreferences() {
        try {
            root.localStorage.setItem(SPELLING_PREF_KEY, JSON.stringify(spellingPreferences));
            spellingStorageWarning = false; return true;
        } catch (_) { spellingStorageWarning = true; return false; }
    }
    async function refreshSpellingResult(status) {
        const previous = lastLocalResult, adapter = editor();
        if (!previous || previous.kind !== 'spelling') { if (status) message(status); return; }
        if (!adapter || adapter.id !== previous.editorId || adapter.read() !== previous.text) {
            message('O texto mudou. Clique em Revisar ortografia novamente.'); return;
        }
        const source = adapter.read(), task = beginLocalAnalysis(adapter, source, 'Atualizando a revisão ortográfica...');
        if (!task) return;
        try {
            const result = await computeLocal(task, {kind: 'spelling', source, options: spellingOptions()});
            task.guard(); result.editorId = adapter.id; showReport(result);
            if (status) message(status);
        } catch (error) { if (localTask === task && !task.cancelled) message(error.message); }
        finally { finishLocalAnalysis(task); }
    }
    function canUseSpellingProposal(result) {
        const adapter = editor();
        if (!adapter || adapter.id !== result.editorId || adapter.read() !== result.text) {
            message('O texto mudou. Clique em Revisar ortografia novamente.'); return false;
        }
        return true;
    }
    async function ignoreSpellingRule(result, proposal) {
        if (!canUseSpellingProposal(result)) return;
        spellingIgnoredRules.add(proposal.ruleId);
        await refreshSpellingResult('As ocorrências desta sugestão foram ignoradas nesta edição.');
    }
    async function allowSpellingWord(result, proposal) {
        if (!canUseSpellingProposal(result)) return;
        if (!spellingPreferences.words.includes(proposal.word) && spellingPreferences.words.length >= 500) {
            message('A lista pessoal já tem 500 palavras. Remova uma delas antes de acrescentar outra.'); return;
        }
        spellingPreferences.words = normalizeSpellingWords([...spellingPreferences.words, proposal.word]);
        const saved = saveSpellingPreferences(); renderSpellingPreferences();
        await refreshSpellingResult(saved ? 'Palavra guardada na sua lista pessoal. Você pode removê-la nas opções de ortografia.' :
            'A palavra será preservada nesta aba. O navegador não permitiu guardar a lista pessoal.');
    }
    function renderSpellingPreferences() {
        const wrap = panel?.querySelector('.ajg-spelling-settings');
        if (!wrap) return;
        const container = wrap.querySelector('.ajg-spelling-word-list'); container.replaceChildren();
        wrap.querySelector('.ajg-spelling-storage').textContent = spellingStorageWarning ?
            'O navegador não permitiu guardar estas opções. Elas valem apenas nesta aba.' :
            'A lista fica neste navegador, separada por conta e wiki. Ela não é publicada nem sincronizada.';
        wrap.querySelector('.ajg-spelling-word-count').textContent = spellingPreferences.words.length + ' palavra(s) na lista pessoal.';
        if (!spellingPreferences.words.length) container.appendChild(node('li', 'Nenhuma palavra guardada.'));
        for (const word of spellingPreferences.words) {
            const item = node('li'); item.append(node('span', word + ' '), button('Voltar a conferir', async () => {
                spellingPreferences.words = spellingPreferences.words.filter(w => w !== word);
                const saved = saveSpellingPreferences(); renderSpellingPreferences();
                await refreshSpellingResult(saved ? 'Palavra retirada da lista pessoal.' : 'Alteração válida nesta aba. O navegador não permitiu guardar a lista.');
            }, 'ajg-spelling-word-remove'));
            item.querySelector('button').setAttribute('aria-label', 'Voltar a conferir a palavra ' + word);
            container.appendChild(item);
        }
        wrap.querySelector('.ajg-spelling-words-clear').disabled = !spellingPreferences.words.length;
    }
    function spellingSettingsPanel() {
        const wrap = node('details', undefined, 'ajg-spelling-settings');
        wrap.append(node('summary', 'Ortografia: opções e palavras'),
            node('p', 'Guarde palavras que você quer preservar. Isso apenas oculta sugestões, sem alterar o artigo.'));
        const label = node('label'), check = node('input'); check.type = 'checkbox';
        check.className = 'ajg-spelling-repeated'; check.dataset.option = 'spellingRepeated';
        check.checked = spellingOptions().spellingRepeated;
        check.disabled = Object.hasOwn(personalConfig(), 'spellingRepeated');
        label.append(check, node('span', ' Procurar possíveis palavras repetidas'));
        check.addEventListener('change', async () => {
            spellingPreferences.repeated = check.checked;
            const saved = saveSpellingPreferences(); renderSpellingPreferences();
            await refreshSpellingResult(saved ? 'Opção de repetições atualizada.' : 'Opção atualizada nesta aba. O navegador não permitiu guardá-la.');
        });
        wrap.append(label, node('p', '', 'ajg-spelling-storage'), node('p', '', 'ajg-spelling-word-count'));
        const form = node('div', undefined, 'ajg-spelling-word-form'), input = node('input');
        input.type = 'text'; input.className = 'ajg-spelling-word-input'; input.maxLength = 80;
        input.placeholder = 'Palavra a preservar';
        input.setAttribute('aria-label', 'Palavra a preservar na revisão ortográfica');
        async function addWord() {
            if (localBusy || onlineBusy) return;
            const words = normalizeSpellingWords([input.value]);
            if (!words.length) { message('Digite uma palavra, sem espaços, endereços ou código wiki.'); return; }
            if (!spellingPreferences.words.includes(words[0]) && spellingPreferences.words.length >= 500) {
                message('A lista pessoal já tem 500 palavras. Remova uma antes de acrescentar outra.'); return;
            }
            spellingPreferences.words = normalizeSpellingWords([...spellingPreferences.words, words[0]]);
            input.value = '';
            const saved = saveSpellingPreferences(); renderSpellingPreferences();
            await refreshSpellingResult(saved ? 'Palavra guardada na lista pessoal.' : 'Palavra preservada nesta aba. O navegador não permitiu guardá-la.');
        }
        const add = button('Guardar palavra', addWord, 'ajg-spelling-word-add');
        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter' || event.isComposing) return;
            event.preventDefault(); event.stopPropagation(); addWord();
        });
        form.append(input, add);
        wrap.append(form, node('ul', undefined, 'ajg-spelling-word-list'));
        wrap.appendChild(button('Limpar lista pessoal', async () => {
            spellingPreferences.words = []; const saved = saveSpellingPreferences(); renderSpellingPreferences();
            await refreshSpellingResult(saved ? 'Lista pessoal limpa. As palavras voltarão a ser conferidas.' :
                'Lista limpa nesta aba. O navegador não permitiu guardar a mudança.');
        }, 'ajg-spelling-words-clear'));
        wrap.appendChild(button('Rever sugestões ignoradas nesta edição', async () => {
            spellingIgnored = []; spellingIgnoredRules.clear();
            await refreshSpellingResult('As sugestões ignoradas nesta edição voltaram à conferência.');
        }, 'ajg-spelling-session-reset'));
        return wrap;
    }

    function remapSpellingIgnores(before, after, proposal, replacement) {
        if (spellingIgnoredSource !== before) { spellingIgnored = []; spellingIgnoredSource = after; return; }
        const delta = replacement.length - proposal.before.length;
        spellingIgnored = spellingIgnored.filter(r => r.end <= proposal.sourceStart || r.start >= proposal.sourceEnd)
            .map(r => r.start >= proposal.sourceEnd ? {...r, start: r.start + delta, end: r.end + delta} : r);
        spellingIgnoredSource = after;
    }
    let preferences = {preset: 'all', overrides: {}}, comparisonPlan = null, onlineBusy = false;
    try {
        const stored = JSON.parse(root.localStorage.getItem(PREF_KEY) || root.localStorage.getItem('RevisaWiki.preferences.v1.1') || root.localStorage.getItem('RevisaWiki.preferences.v1.0') || root.localStorage.getItem('AjusteGeralPT.preferences.v2.6') || root.localStorage.getItem('AjusteGeralPT.preferences.v2.5') || root.localStorage.getItem('AjusteGeralPT.preferences.v2.4') || root.localStorage.getItem('AjusteGeralPT.preferences.v2.3') || 'null');
        if (stored && Object.hasOwn(PRESETS, stored.preset)) {
            preferences.preset = stored.preset;
            for (const [k, v] of Object.entries(stored.overrides || {}))
                if (Object.hasOwn(DEFAULTS, k) && typeof v === 'boolean') preferences.overrides[k] = v;
        }
    } catch (_) { /* O navegador pode bloquear armazenamento. A edição continua disponível. */ }
    function currentOptions(trace) {
        return pageContextOptions({...presetOptions(preferences.preset, preferences.overrides), ...personalConfig(), spellingAllowedWords:spellingPreferences.words, spellingIgnoredRules:[...spellingIgnoredRules], captureTrace: !!trace, sectionOnly: editingSection() !== null,
            namespaceNumber: Number(mw.config.get('wgNamespaceNumber')), pageTitle: currentTitle(),
            pageRedirect: !!mw.config.get('wgIsRedirect'), pageDisambiguation: !!mw.config.get('wgIsDisambiguationPage')});
    }
    function savePreferences() {
        try { root.localStorage.setItem(PREF_KEY, JSON.stringify(preferences)); }
        catch (_) { message('As opções valem nesta aba. O navegador não permitiu guardá-las.'); }
    }
    function node(tag, text, className) {
        const e = root.document.createElement(tag);
        if (text !== undefined) e.textContent = text;
        if (className) e.className = className;
        return e;
    }
    function button(text, action, className) {
        const e = node('button', text, 'mw-ui-button ' + (className || '')); e.type = 'button';
        e.addEventListener('click', action); return e;
    }
    function snippet(text) {
        const pre = node('pre', text || '(vazio)');
        pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-height:160px;overflow:auto;';
        return pre;
    }
    function suggestionKey(p) { return JSON.stringify([p.label, p.before, p.choices]); }
    function locateTarget(source, target) {
        const possibilities = [target, target.replace(/ /g, '_'), target.replace(/^Predefinição:/, ''),
            target.replace(/^Ficheiro:/, ''), target.replace(/^Ficheiro:/, '').replace(/ /g, '_')];
        for (const needle of possibilities) {
            const start = source.toLocaleLowerCase('pt').indexOf(needle.toLocaleLowerCase('pt'));
            if (start >= 0) return {start, end: start + needle.length};
        }
        return null;
    }
    function locateFinding(source, message) {
        const quoted = message.match(/"([^"\n]+)"/);
        if (quoted) return locateTarget(source, quoted[1]);
        const field = message.match(/(?:Parâmetro[^:]*:|parâmetro[^:]*:)\s*([^.: ]+)/i);
        if (field) return locateTarget(source, field[1]);
        return null;
    }
    function setIssues(domain, findings, source, render = true) {
        const seen = new Set();
        for (const finding of findings) {
            const key = domain + ':' + (finding.code || 'warning') + ':' + finding.message; seen.add(key);
            const previous = issueStore.get(key), anchor = finding.anchor || (finding.start >= 0 && finding.code !== 'missing-renderer' ?
                {start: finding.start, end: finding.end || Math.min(source.length, finding.start + 80)} : null);
            issueStore.set(key, {...finding, domain, key, source, anchor,
                proposed: ['local', 'references', 'syntax', 'preservation', 'translation'].includes(domain) && !!lastLocalResult?.proposed,
                state: previous?.state === 'ignored' && previous.source === source ? 'ignored' : finding.state || 'pending'});
        }
        for (const [key, finding] of issueStore) if (finding.domain === domain && !seen.has(key)) {
            finding.state = 'resolved'; finding.anchor = null; finding.source = source;
        }
        // Não crescer indefinidamente durante uma sessão longa de revisão.
        if (issueStore.size > 600) for (const [key, finding] of issueStore) {
            if (finding.state === 'resolved') issueStore.delete(key);
            if (issueStore.size <= 500) break;
        }
        if (render) renderIssues();
    }
    function goToFinding(finding) {
        const adapter = editor();
        if (!adapter || adapter.read() !== finding.source) { message('O texto mudou. Atualize a verificação para localizar este aviso.'); return; }
        if (!finding.anchor) { message('Este aviso se refere à página inteira ou a uma dependência externa. Não há trecho correspondente no editor aberto.'); return; }
        try {
            if (!adapter.locate) throw new Error('Este editor não expôs a seleção do trecho.');
            adapter.locate(finding.anchor.start, finding.anchor.end);
            message('Trecho selecionado no editor. Nenhum conteúdo foi alterado.');
        } catch (error) { message('Não foi possível selecionar o trecho: ' + error.message); }
    }
    function renderIssues() {
        if (!panel) return;
        const report = panel.querySelector('.ajg-report');
        let container = report.querySelector('.ajg-issues');
        if (!container) { container = node('div', undefined, 'ajg-issues'); report.append(container); }
        container.replaceChildren();
        const source = editor()?.read();
        const findings = [...issueStore.values()];
        const current = finding => finding.source === source && finding.state === 'pending';
        const live=findings.filter(current),technical=groupedTechnicalFindings(live.filter(technicalFinding));
        const pending=live.filter(f=>!technicalFinding(f)),history=findings.filter(finding=>!current(finding));
        function appendFindings(target, values) {
            if (!values.length) return;
            const list = node('ul'); target.append(list);
            for (const finding of values.slice(0, 60)) {
                const stale = finding.source !== source;
                const proposed = stale && finding.proposed && comparisonPlan && !comparisonPlan.applied && comparisonPlan.before === source;
                const status = proposed ? 'Proposto' : stale ? 'Desatualizado' :
                    {pending: '', resolved: 'Resolvido', ignored: 'Ignorado nesta edição'}[finding.state];
                const row = node('li', (status ? status + ': ' : '') + finding.message, 'ajg-issue');
                row.dataset.state = proposed ? 'proposed' : stale ? 'stale' : finding.state;
                if (finding.severity === 'error') row.style.fontWeight = 'bold';
                if (finding.anchor && finding.state !== 'resolved') {
                    const go = button('Ir ao trecho', () => goToFinding(finding), 'ajg-locate');
                    go.disabled = stale; row.append(' ', go);
                }
                if (finding.code === 'disambiguation' && !stale && finding.state === 'pending') {
                    const chooser = node('details', undefined, 'ajg-disambig-choice'); chooser.append(node('summary', 'Escolher destino'));
                    const content = node('div'); chooser.append(content); let loaded = false;
                    chooser.addEventListener('toggle', () => {
                        if (chooser.open && !loaded && !localBusy && !onlineBusy) { loaded = true; loadDisambiguation(finding, content); }
                    }); row.append(chooser);
                }
                if (finding.url) {
                    const link = node('a', 'Comparar versões'); link.href = finding.url; link.target = '_blank'; link.rel = 'noopener'; row.append(' ', link);
                }
                if (!stale && finding.state !== 'resolved') row.append(' ', button(finding.state === 'ignored' ? 'Reabrir aviso' : 'Ignorar aviso', () => {
                    finding.state = finding.state === 'ignored' ? 'pending' : 'ignored'; renderIssues();
                }, 'ajg-ignore-issue'));
                list.append(row);
            }
            if (values.length > 60) target.append(node('p', 'Mostrando 60 de ' + values.length + ' avisos. Confira também o diagnóstico.'));
        }
        let review = report.querySelector('.ajg-review-area');
        if (!review) {
            review = node('details', undefined, 'ajg-review-area');
            review.append(node('summary', 'Precisa de revisão'));
            report.append(review);
        }
        const suggestions = report.querySelector('.ajg-suggestions');
        if (suggestions && suggestions.parentNode !== review) review.append(suggestions);
        const suggestionsCount = suggestions?.querySelectorAll(':scope > details').length || 0;
        review.querySelector('summary').textContent = 'Precisa de revisão' + (pending.length + suggestionsCount ? ' · ' + (pending.length + suggestionsCount) : '');
        review.hidden = !pending.length && !suggestionsCount;
        if (review.hidden) review.open = false;
        else if (pending.length || suggestionsCount) review.open = true;
        let pendingList = review.querySelector('.ajg-pending-list');
        if (!pendingList) { pendingList = node('div', undefined, 'ajg-pending-list'); review.prepend(pendingList); }
        // O summary deve continuar a ser o primeiro filho do details.
        review.prepend(review.querySelector('summary'));
        pendingList.replaceChildren(); appendFindings(pendingList, pending);
        if(technical.length){
            const extra=node('details',undefined,'ajg-technical-info');extra.append(node('summary','Informações técnicas'));appendFindings(extra,technical);container.append(extra);
        }
        if (history.length) {
            const previous = node('details', undefined, 'ajg-review-history');
            previous.append(node('summary', 'Resultados anteriores e conferências')); appendFindings(previous, history); container.append(previous);
        }
        report.hidden = !report.textContent || !pending.length && !suggestionsCount && !history.length && !technical.length && !report.querySelector('.ajg-automatic')?.textContent;
        updateAppliedResult();
    }

    function showReport(result) {
        lastLocalResult = result;
        syncMinorResult(result);
        if (last && result.appliedHunks && result.comparisonBefore === last.before && result.text === last.after)
            last.displayGroups = comparisonDisplayGroups(last.before, last.after, result.appliedHunks);
        const detail = panel.querySelector('.ajg-report');
        let automatic = detail.querySelector('.ajg-automatic'), suggestions = detail.querySelector('.ajg-suggestions');
        if (!automatic) { automatic = node('div', undefined, 'ajg-automatic'); detail.prepend(automatic); }
        if (!suggestions) { suggestions = node('div', undefined, 'ajg-suggestions'); detail.appendChild(suggestions); }
        automatic.replaceChildren(); suggestions.replaceChildren();
        if (result.kind === 'spelling') {
            const stats = result.spelling;
            automatic.appendChild(node('p', stats.total ?
                stats.total + (stats.total === 1 ? ' possível erro' : ' possíveis erros') + ' para conferir. Você escolhe as correções.' :
                'Nenhuma sugestão encontrada nos trechos examinados.'));
            const filterLabel = node('label', 'Mostrar: '), filter = node('select');
            filter.className = 'ajg-spelling-filter'; filter.setAttribute('aria-label', 'Filtrar sugestões de ortografia');
            for (const [value, text] of [['all', 'Todas as sugestões'], ['word', 'Só grafia'], ['repetition', 'Só possíveis repetições']]) {
                const option = node('option', text); option.value = value; filter.appendChild(option);
            }
            filter.value = stats.filter;
            filter.addEventListener('change', async () => {
                spellingFilter = filter.value; await refreshSpellingResult('Filtro da revisão atualizado.');
            });
            filterLabel.appendChild(filter); automatic.appendChild(filterLabel);
            if (stats.filteredTotal > stats.shown) automatic.appendChild(node('p', 'Mostrando ' + stats.shown + ' de ' +
                stats.filteredTotal + ' no filtro atual. Ao substituir ou ignorar ocorrências, as próximas entram no relatório.'));
            if (stats.total && !stats.filteredTotal) automatic.appendChild(node('p', 'Não há sugestões no filtro atual. Escolha outro filtro para conferir as demais.'));
            if (stats.ignored || stats.ignoredRules) automatic.appendChild(node('p', 'Ocorrências ignoradas nesta edição: ' +
                (stats.ignored + stats.ignoredRules) + '.'));
            if (stats.allowed) automatic.appendChild(node('p', 'Ocorrências preservadas pela lista pessoal: ' + stats.allowed + '.'));
        }
        const list = node('ul');
        if ((result.removedDescriptions || []).length) list.appendChild(node('li',
            'Descrições removidas, caso queira aproveitar no Wikidata: ' + result.removedDescriptions.join(' ')));
        automatic.appendChild(list);
        if (result.kind !== 'spelling' && result.notApplied?.length) {
            const kept=node('details',undefined,'ajg-not-applied');
            kept.append(node('summary','Por que alguns ajustes não entraram'));
            const reasons=node('ul');
            for(const finding of result.notApplied)reasons.append(node('li',finding.message));
            kept.append(reasons);automatic.append(kept);
        }
        if (result.kind !== 'spelling') {
        setIssues('spelling', [], result.text, false);
        const references = result.localReports?.references || result.audit || referenceAudit(result.text), referenceMessages = new Set(references.map(f => f.message));
        setIssues('local', (result.warnings || []).filter(w => !referenceMessages.has(w) &&
            !(w.startsWith('Data inválida preservada:') && (result.localReports?.dates || []).some(f => f.code === 'date-impossible' && f.message.includes(w.replace('Data inválida preservada:', '').trim()))) &&
            !(w.match(/^Referência "([^"]+)" sem definição/) && references.some(f => f.code === 'missing-definition' &&
                f.message.startsWith(w.match(/^Referência "([^"]+)" sem definição/)[0])))).map(message => ({code: 'warning', message,
            anchor: locateFinding(result.text, message)})), result.text, false);
        setIssues('references', references.map(f => ({...f, message: f.message + (editingSection() === null ? '' :
            ' Aviso limitado à seção aberta. Use Verificar pré-visualização para conferir a página inteira.')})), result.text, false);
        setIssues('syntax', result.localReports?.syntax || syntaxAudit(result.text), result.text, false);
        setIssues('translation', result.localReports?.translation || (currentOptions(false).multilingual ? translationAudit(result.text) : []), result.text, false);
        setIssues('tables', result.localReports?.tables || (currentOptions(false).tableChecks ? tableAnalysis(result.text).findings : []), result.text, false);
        setIssues('biographies',result.localReports?.biographies || [],result.text,false);
        if(result.previewCheck?.checked) setIssues('automatic-preview',[{code:'automatic-preview-complete',message:result.previewCheck.status==='rollback'?'Os reparos que criaram erros foram recusados.':'Pré-visualização automática conferida: nenhum erro novo foi encontrado.',state:'resolved'}],result.text,false);
        setIssues('dates', result.localReports?.dates || (currentOptions(false).dateChecks ? dateAudit(result.text) : []), result.text, false);
        } else setIssues('spelling', (result.warnings || []).map(message => ({code: 'spelling-boundary', message})), result.text, false);
        if (result.preservation) setIssues('preservation', result.preservation, result.text, false);
        for (const proposal of result.suggestions || []) {
            if (ignoredSuggestions.has(suggestionKey(proposal))) continue;
            const row = node('details', undefined, proposal.kind === 'spelling' ? 'ajg-spelling-suggestion' : ''), title = node('summary', 'Rever: ' + proposal.label);
            row.appendChild(title);
            if (proposal.context) row.append(node('strong', 'Contexto'), snippet(proposal.context));
            row.append(snippet(proposal.before));
            if (proposal.kind === 'spelling') {
                row.appendChild(button('Ir ao trecho', () => {
                    const adapter = editor();
                    if (!adapter || adapter.id !== result.editorId || adapter.read() !== result.text) { message('O texto mudou. Clique em Revisar ortografia novamente.'); return; }
                    try { adapter.locate(proposal.sourceStart, proposal.sourceEnd); } catch (error) { message(error.message); }
                }, 'ajg-spelling-locate'));
                if (proposal.explanation) row.appendChild(node('p', proposal.explanation));
                if (proposal.lexicalSource) {
                    const link = node('a', 'Conferir a grafia na fonte'); link.href = proposal.lexicalSource; link.target = '_blank'; link.rel = 'noopener noreferrer';
                    row.appendChild(link);
                }
                row.appendChild(button(proposal.subtype === 'repetition' ? 'Ignorar esta repetição nesta edição' : 'Ignorar esta palavra nesta edição',
                    () => ignoreSpellingRule(result, proposal), 'ajg-spelling-ignore-rule'));
                if (proposal.subtype === 'word') row.appendChild(button('Não sugerir esta palavra',
                    () => allowSpellingWord(result, proposal), 'ajg-spelling-allow-word'));
            }
            for (let i = 0; i < proposal.choices.length; i++) {
                const choice = proposal.choices[i];
                row.append(snippet(choice.after || '(remoção)'), button(choice.label, async () => {
                    let task;
                    try {
                        const adapter = editor();
                        if (!adapter || (result.kind === 'spelling' && adapter.id !== result.editorId) || adapter.read() !== result.text) { message(result.kind === 'spelling' ? 'O texto mudou. Clique em Revisar ortografia novamente.' : 'O texto mudou. Execute RevisaWiki novamente para atualizar as sugestões.'); return; }
                        const before = adapter.read(), after = applySuggestion(before, proposal, i);
                        task = beginLocalAnalysis(adapter, before, 'Preparando a substituição...');
                        if (!task) return;
                        const ignores = spellingIgnoredSource === before ? spellingIgnored.filter(r => r.end <= proposal.sourceStart || r.start >= proposal.sourceEnd)
                            .map(r => r.start >= proposal.sourceEnd ? {...r, start: r.start + choice.after.length - proposal.before.length, end: r.end + choice.after.length - proposal.before.length} : r) : [];
                        const next = await computeLocal(task, proposal.kind === 'spelling' ?
                            {kind: 'spelling', source: after, previousSource: before, originalSource: appliedBaseline(adapter, before), safetySource: before, options: spellingOptions(ignores)} :
                            {kind: 'refresh', source: after, safetySource: before, originalSource: appliedBaseline(adapter, before), options: currentOptions(false)});
                        task.guard();
                        if (proposal.kind === 'spelling') { next.editorId = adapter.id; remapSpellingIgnores(before, after, proposal, choice.after); }
                        adapter.write(after);
                        if (adapter.read() !== after) throw new Error('O editor não confirmou a atualização.');
                        if (after !== before) rememberEdit(adapter, before, after, proposal.kind === 'spelling' ? 'spelling' : 'syntax', proposal.label);
                        panel.querySelector('.ajg-undo').disabled = false; comparisonPlan = null;
                        panel.querySelector('.ajg-diff').replaceChildren(); showReport(next);
                        message('A escolha foi aplicada. Confira Mostrar alterações e a pré-visualização antes de salvar.');
                    } catch (error) { if (!task || localTask === task) message('Não foi possível aplicar a escolha: ' + error.message); }
                    finally { if (task) finishLocalAnalysis(task); }
                }, 'ajg-review'));
            }
            row.appendChild(button('Ignorar nesta edição', async () => {
                if (proposal.kind === 'spelling') {
                    const adapter = editor();
                    if (!adapter || adapter.id !== result.editorId || adapter.read() !== result.text) { message('O texto mudou. Clique em Revisar ortografia novamente.'); return; }
                    spellingIgnored.push({start: proposal.sourceStart, end: proposal.sourceEnd, before: proposal.before});
                    spellingIgnoredSource = result.text;
                    await refreshSpellingResult('Sugestão ignorada nesta edição.');
                } else { ignoredSuggestions.add(suggestionKey(proposal)); row.remove(); renderIssues(); }
                message('Sugestão ignorada nesta edição.');
            }, 'ajg-ignore'));
            suggestions.appendChild(row);
        }
        renderIssues(); detail.hidden = !detail.textContent;
    }

    async function writeChosenChanges() {
        const plan = comparisonPlan, adapter = editor();
        if (!plan || !adapter || adapter.id !== plan.id || adapter.read() !== plan.current) {
            message('O texto mudou. Compare os ajustes novamente antes de escolher alterações.'); return false;
        }
        const next = composeChanges(plan.before, plan.hunks), before = adapter.read();
        const task = beginLocalAnalysis(adapter, before, 'Preparando os trechos escolhidos...');
        if (!task) return false;
        try {
        const result = await computeLocal(task, {kind: 'refresh', source: next, safetySource: plan.before, originalSource: appliedBaseline(adapter, before), options: currentOptions(false)});
        task.guard();
        if (next !== before) {
            adapter.write(next);
            if (adapter.read() !== next) throw new Error('O editor não confirmou a atualização.');
            rememberEdit(adapter, before, next, 'syntax', plan.hunks.filter(h => h.accepted).flatMap(h => h.reasons).join(', '));
            if (last && next === last.before) {
                const summary = summaryEditor(), generated = last.summary;
                if (generated && summary && summary.id === generated.id && summary.read() === generated.after) summary.restore(generated.before);
                last = null;
            }
        }
        plan.current = next; plan.applied = true;
        panel.querySelector('.ajg-undo').disabled = !last;
        showReport(result);
        renderComparisonContents(plan, result.comparisonBefore ?? plan.before, next, result.appliedHunks || []);
        renderIssues();
        message('Escolhas aplicadas: ' + plan.hunks.filter(h => h.accepted).length + ' de ' + plan.hunks.length + ' trechos. Confira antes de salvar.');
        return true;
        } catch (error) { if (localTask === task) message(error.message); return false; }
        finally { finishLocalAnalysis(task); }
    }
    function appliedBaseline(adapter, source) {
        return last && last.id === adapter.id && last.after === source ? last.before : source;
    }
    function updateAppliedResult() {
        if (!panel || stylesMode) return;
        const host = panel.querySelector('.ajg-result');
        if (!host) return;
        const adapter = editor(), source = adapter?.read();
        const proposed = comparisonPlan && !comparisonPlan.applied && adapter?.id === comparisonPlan.id && source === comparisonPlan.current;
        const actual = last && adapter?.id === last.id && source === last.after;
        const stale = last && !actual;
        host.hidden = !actual && !proposed && !stale;
        host.querySelector('.ajg-result-title').textContent = proposed ? 'Ajustes propostos' : stale ? 'O texto mudou após os ajustes' : 'Ajustes aplicados';
        const groups = proposed ? comparisonPlan.groups : actual ? last.displayGroups : null;
        host.querySelector('.ajg-result-count').textContent = groups?.length ? groups.length + ' trecho' + (groups.length === 1 ? '' : 's') + ' alterado' + (groups.length === 1 ? '' : 's') :
            stale ? 'Execute o ajuste novamente para atualizar a comparação.' : '';
        let metrics=null;
        if(proposed){
            const key=comparisonPlan.hunks.map(h=>h.accepted?'1':'0').join('');
            if(comparisonPlan.bytesKey!==key){const selected=composeChanges(comparisonPlan.before,comparisonPlan.hunks);comparisonPlan.selectedBytes=byteMetrics(comparisonPlan.before,selected,comparisonPlan.hunks.filter(h=>h.accepted));comparisonPlan.bytesKey=key;}
            metrics=comparisonPlan.selectedBytes;
        }else if(actual){metrics=last.byteMetrics;if(!metrics){metrics=byteMetrics(last.before,last.after);last.byteMetrics=metrics;}}
        showByteBadge(host.querySelector('.ajg-bytes'),metrics);
        const minorLabel=host.querySelector('.ajg-minor-status');if(minorLabel){minorLabel.hidden=!(actual&&minorOwned&&minorOwned.source===source);minorLabel.textContent='Edição menor marcada automaticamente';}
        const view = host.querySelector('.ajg-show-changes');
        view.disabled = !!stale || localBusy || onlineBusy;
        host.querySelector('.ajg-undo').hidden = !last;
        const expanded = !!panel.querySelector('.ajg-diff > details')?.open;
        view.setAttribute('aria-expanded', String(expanded));
    }
    async function showAppliedChanges() {
        if (localBusy || onlineBusy) return;
        const adapter = editor(), current = adapter?.read();
        if (comparisonPlan && adapter?.id === comparisonPlan.id && current === comparisonPlan.current) {
            const details = panel.querySelector('.ajg-diff > details');
            if (details) { details.open = !details.open; updateAppliedResult(); return; }
        }
        if (!last || !adapter || adapter.id !== last.id || current !== last.after) {
            message('O texto mudou. Execute o ajuste novamente para atualizar a comparação.'); return;
        }
        const previous = last, task = beginLocalAnalysis(adapter, current, 'Preparando a comparação...');
        if (!task) return;
        try {
            const result = await computeLocal(task, {kind: 'comparison', source: current, originalSource: previous.before});
            task.guard();
            showComparison(adapter, previous.before, result, true);
            panel.querySelector('.ajg-diff > details').open = true;
            updateAppliedResult(); message('Comparação pronta. O texto permanece igual.');
        } catch (error) { if (localTask === task) message(error.message); }
        finally { finishLocalAnalysis(task); }
    }
    function contextualSnippet(source, start, end, hunks, fresh) {
        const pre = node('pre', undefined, fresh ? 'ajg-context ajg-after' : 'ajg-context ajg-before');
        const changed = hunks.map(h => ({start: fresh ? h.newStart : h.start, end: fresh ? h.newEnd : h.end}))
            .filter(range => range.end > range.start).sort((a, b) => a.start - b.start);
        let position = start;
        for (const range of changed) {
            const from = Math.max(position, range.start, start), to = Math.min(end, range.end);
            if (to <= from) continue;
            if (from > position) pre.append(source.slice(position, from));
            const mark = node('mark', source.slice(from, to)); pre.append(mark); position = to;
        }
        if (position < end) pre.append(source.slice(position, end));
        if (start === end) pre.append(node('span', fresh ? 'Trecho removido.' : 'Novo trecho.', 'ajg-empty-context'));
        return pre;
    }
    function renderComparisonContents(plan, before, after, hunks) {
        const content = plan.content; if (!content) return;
        content.replaceChildren();
        const groups = comparisonDisplayGroups(before, after, hunks);
        if (!groups.length) { content.append(node('p', 'Nenhuma alteração mantida.')); return; }
        groups.forEach(group => {
            const row = node('div', undefined, 'ajg-change');
            row.append(node('p', changeExplanation(group), 'ajg-change-explanation'));
            const old = node('div', undefined, 'ajg-change-side'), fresh = node('div', undefined, 'ajg-change-side');
            old.append(node('strong', 'Antes'), contextualSnippet(before, group.start, group.end, group.hunks, false));
            fresh.append(node('strong', 'Depois'), contextualSnippet(after, group.newStart, group.newEnd, group.hunks, true));
            row.append(old, fresh); content.append(row);
        });
    }
    function showComparison(adapter, before, result, applied) {
        const hunks = result.hunks || comparison(before, result);
        comparisonPlan = {id: adapter.id, before, after: result.text, current: applied ? result.text : before,
            hunks, groups: comparisonDisplayGroups(before, result.text, hunks), applied};
        const box = panel.querySelector('.ajg-diff'); box.replaceChildren();
        const plan = comparisonPlan;
        if (!hunks.length) { updateAppliedResult(); return; }
        if (applied && last && last.before === before && last.after === result.text) last.displayGroups = plan.groups;
        const wrap = node('details', undefined, 'ajg-comparison'); wrap.open = !applied;
        wrap.append(node('summary', 'Antes e depois'));
        wrap.addEventListener('toggle', updateAppliedResult);
        const controls = node('div', undefined, 'ajg-comparison-controls');
        const select = button('Escolher alterações', () => {
            wrap.classList.toggle('ajg-selecting');
            select.setAttribute('aria-expanded', String(wrap.classList.contains('ajg-selecting')));
        }, 'ajg-select-changes');
        select.setAttribute('aria-expanded', String(!applied));
        if (!applied) wrap.classList.add('ajg-selecting');
        controls.append(select);
        const selection = node('div', undefined, 'ajg-selection-help');
        selection.append(node('p', 'Cada escolha vale para o ajuste indicado. Alterações da mesma referência são mantidas juntas.'));
        const choiceList = node('div', undefined, 'ajg-choice-list'); selection.append(choiceList);
        controls.append(selection); wrap.append(controls);
        const sync = () => {
            for (const row of wrap.querySelectorAll('.ajg-change-choice')) {
                row.checked = !!plan.hunks.find(h => h.id === row.dataset.change)?.accepted;
            }
        };
        plan.hunks.forEach((h, index) => {
            const label = node('label', undefined, 'ajg-choice-item'), check = node('input');
            check.type = 'checkbox'; check.checked = h.accepted; check.className = 'ajg-change-choice';
            check.dataset.change = h.id; check.setAttribute('aria-label', 'Manter alteração ' + (Number(h.id.split('-')[1]) + 1));
            check.addEventListener('change', async () => {
                const related = plan.hunks.filter(item => item === h || h.transaction && item.transaction === h.transaction);
                const previous = related.map(h => h.accepted);
                related.forEach(h => { h.accepted = check.checked; }); sync();updateAppliedResult();
                if (plan.applied) {
                    try { if (!await writeChosenChanges()) { related.forEach((h, i) => { h.accepted = previous[i]; }); sync(); } }
                    catch (error) { related.forEach((h, i) => { h.accepted = previous[i]; }); sync(); message(error.message); }
                }
            });
            label.append(check, node('span', ' Manter ajuste ' + (index + 1)),
                node('code', (h.before || '(inserção)').slice(0, 100) + ' → ' + (h.after || '(remoção)').slice(0, 100)));
            choiceList.append(label);
        });
        selection.append(button('Aplicar escolhas', async () => { try { await writeChosenChanges(); } catch (error) { message(error.message); } }, 'ajg-apply-choices'));
        plan.content = node('div', undefined, 'ajg-comparison-content'); wrap.append(plan.content);
        renderComparisonContents(plan, before, result.text, hunks);
        box.append(wrap); updateAppliedResult();
    }

    const endMatterReadCache = new Map();
    const referenceColumnReadCache = new Map();
    let minorVerifiedBaseline=null, minorOwned=null,minorWriting=false,minorManualOverride=false;
    const minorBaseCache=new Map();
    function minorCheckbox(){const box=root.document.getElementById('wpMinoredit');return box?.type==='checkbox'&&!box.disabled?box:null;}
    function writeMinor(box,value){minorWriting=true;try{box.checked=value;box.dispatchEvent(new root.Event('change',{bubbles:true}));}finally{minorWriting=false;}}
    function restoreOwnedMinor(){
        if(minorOwned){const owned=minorOwned;minorOwned=null;if(owned.box.isConnected&&owned.box.checked===owned.after)writeMinor(owned.box,owned.before);}
    }
    function syncMinorResult(result){
        const adapter=editor();
        if(!adapter||!last||last.id!==adapter.id||adapter.read()!==last.after||result.text!==last.after)return;
        if(result.byteMetrics && result.comparisonBefore===last.before)last.byteMetrics=result.byteMetrics;
        if(!result.minorCheck)return;
        const box=minorCheckbox();
        if(!box||minorManualOverride)return;
        const currentConfirmed=minorVerifiedBaseline && minorVerifiedBaseline.id===adapter.id && minorVerifiedBaseline.title===currentTitle() && minorVerifiedBaseline.revision===baseRevision() && minorVerifiedBaseline.source===last.before;
        if(result.minorCheck.eligible && currentConfirmed && currentOptions(false).autoMinor){
            if(!box.checked){minorOwned={box,before:false,after:true,source:last.after};writeMinor(box,true);}
            else if(minorOwned&&minorOwned.box===box)minorOwned.source=last.after;
        }else restoreOwnedMinor();
    }
    function onMinorManualChange(event){if(event.target===minorCheckbox()&&!minorWriting){minorManualOverride=true;minorOwned=null;updateAppliedResult();}}
    root.document.addEventListener('change',onMinorManualChange);
    function onMinorDraftChange(){const adapter=editor();if(minorOwned&&(!adapter||adapter.read()!==minorOwned.source))restoreOwnedMinor();}
    async function prepareMinorBaseline(task,options){
        const cfg={...options};cfg.minorBaseConfirmed=false;
        if(!cfg.autoMinor||cfg.sectionOnly||Number(mw.config.get('wgNamespaceNumber'))!==0||!minorCheckbox()||minorManualOverride)return cfg;
        const revision=baseRevision(),key=task.title+'|'+revision;
        if(!revision)return cfg;
        task.preflightRequests=[];
        try{
            let cached=minorBaseCache.get(key);
            if(!cached){
                message('Conferindo a revisão de origem para edição menor...');
                const client=new mw.Api({ajax:{timeout:6000}}),request=client.get({action:'query',formatversion:2,prop:'revisions',revids:revision,rvprop:'ids|content',rvslots:'main'});
                task.preflightRequests.push(request);const response=await request;task.guard();
                const page=response.query?.pages?.find(p=>p.title?.replace(/_/g,' ')===task.title&&p.ns===0);
                const r=page?.revisions?.find(r=>r.revid===revision),source=r?.slots?.main?.content;
                if(typeof source!=='string')return cfg;
                cached={source};minorBaseCache.clear();minorBaseCache.set(key,cached);
            }
            task.guard();minorVerifiedBaseline={id:task.adapterId,title:task.title,revision,source:cached.source};
            cfg.minorBaseConfirmed=cached.source===appliedBaseline(editor(),task.source);
        }catch(error){task.guard();minorVerifiedBaseline=null;}finally{task.preflightRequests=[];}
        return cfg;
    }
    function confirmedMinorOptions(task,job){
        const cfg={...(job.options||{})},baseline=job.originalSource??job.source;
        cfg.minorBaseConfirmed=!!(cfg.autoMinor&&minorVerifiedBaseline&&minorVerifiedBaseline.id===task.adapterId&&minorVerifiedBaseline.title===task.title&&minorVerifiedBaseline.revision===baseRevision()&&minorVerifiedBaseline.source===baseline);
        return cfg;
    }
    function showByteBadge(host,metrics){
        if(!host)return;host.hidden=!metrics;
        if(!metrics)return;
        const delta=metrics.delta,sign=delta>0?'+':delta<0?'−':'';
        host.textContent=sign+Math.abs(delta).toLocaleString('pt-BR')+' bytes';
        host.className='ajg-bytes '+(delta>0?'ajg-bytes-plus':delta<0?'ajg-bytes-minus':'ajg-bytes-neutral');
        host.setAttribute('aria-label','Variação de tamanho: '+(delta>0?'aumento de ':delta<0?'redução de ':'')+Math.abs(delta).toLocaleString('pt-BR')+' bytes.');
        host.title='Antes: '+metrics.before.toLocaleString('pt-BR')+' bytes. Depois: '+metrics.after.toLocaleString('pt-BR')+' bytes. Inserções contabilizadas: '+metrics.added+'. Remoções contabilizadas: '+metrics.removed+'.';
    }

    async function prepareReferenceColumns(task, options) {
        const cfg={...options};
        const withNotes=automaticMissingNoteCollector(task.source,cfg,()=>{});
        const prospective=unifiedNotesReferences(orderEndSections(withNotes,cfg,()=>{},()=>{}),cfg,()=>{},()=>{});
        const combined=referenceColumnPlans(prospective,{...cfg,noteReferenceColumnsSupported:false})
            .some(p=>p.code==='columns-template' && /^\{\{\s*notas e referências\b/i.test(p.before));
        if (!combined) return cfg;
        task.preflightRequests=[];
        try {
            message('Conferindo as colunas de Notas e referências...');
            let cached=referenceColumnReadCache.get('notes');
            if (!cached || Date.now()-cached.time>120000) {
                const client=new mw.Api({ajax:{timeout:6000}});
                const request=client.post({action:'parse',formatversion:2,title:task.title,
                    text:'Texto de teste.<ref>Fonte de teste.</ref>\n{{Notas e referências|col_ref=2}}',
                    contentmodel:'wikitext',prop:'text|parsewarnings',preview:true});
                task.preflightRequests.push(request);
                const response=await request;task.guard();
                cached={time:Date.now(),supported:noteReferenceColumnConfirmation(response)};
                referenceColumnReadCache.set('notes',cached);
            }
            cfg.noteReferenceColumnsSupported=cached.supported;
            if (!cached.supported) cfg.referenceColumnLookupWarning='Duas colunas não aplicadas: Notas e referências não repassou col_ref para um estilo ativo. A chamada foi preservada.';
        } catch(error) {
            task.guard();cfg.noteReferenceColumnsSupported=false;
            cfg.referenceColumnLookupWarning='Duas colunas não aplicadas: a consulta de Notas e referências não terminou. A chamada foi preservada.';
        } finally {task.preflightRequests=[];}
        return cfg;
    }

    async function prepareEndMatter(task, options) {
        const cfg = {...options};
        if (!cfg.endMatter || cfg.sectionOnly || Number(mw.config.get('wgNamespaceNumber')) !== 0) return cfg;
        const pending = []; task.preflightRequests = pending;
        const remember = promise => {pending.push(promise); return promise;};
        async function cachedRead(key, call) {
            const cached = endMatterReadCache.get(key);
            if(cached && Date.now()-cached.time<120000) return cached.data;
            const data = await remember(call()); task.guard();
            if(endMatterReadCache.size>=25)endMatterReadCache.clear();
            endMatterReadCache.set(key,{time:Date.now(),data});return data;
        }
        try {
            const names = cfg.endTemplateOrder ? footerCandidates(task.source) : [];
            if (names.length) {
                message('Conferindo as predefinições do bloco final...');
                try {
                    const client = new mw.Api({ajax: {timeout: 6000}});
                    const response = await cachedRead('footer:'+names.map(norm).sort().join('|'),()=>client.get({action: 'query', formatversion: 2, redirects: true,
                        titles: names.map(n => 'Predefinição:' + n).join('|'), prop: 'revisions', rvprop: 'content', rvslots: 'main'}));
                    task.guard();
                    const aliases = new Map((response.query?.redirects || []).map(r => [norm(r.from), norm(r.to)]));
                    const profiles = {};
                    for (const page of response.query?.pages || []) {
                        const code = page.revisions?.[0]?.slots?.main?.content;
                        if (typeof code !== 'string') continue;
                        const role = classifyFooterTemplate(code);
                        if (!role) continue;
                        const title = norm(page.title); profiles[title.replace(/^predefinição:\s*/, '')] = role;
                        for (const name of names) {
                            let resolved = norm('Predefinição:' + name); const visited = new Set();
                            while (aliases.has(resolved) && !visited.has(resolved)) {visited.add(resolved); resolved = aliases.get(resolved);}
                            if (resolved === title) profiles[norm(name)] = role;
                        }
                    }
                    cfg.footerProfiles = profiles;
                } catch (error) {
                    task.guard(); cfg.footerLookupWarning = 'Não foi possível confirmar todas as predefinições finais. Os blocos sem equivalência confirmada serão preservados.';
                }
            }
            const item = mw.config.get('wgWikibaseItemId');
            if (cfg.authorityControl && !authorityPresent(task.source) && /^Q[1-9]\d*$/.test(item || '') &&
                !mw.config.get('wgIsRedirect') && !mw.config.get('wgIsDisambiguationPage')) {
                message('Conferindo identificadores de autoridade no Wikidata...');
                try {
                    const client = new mw.ForeignApi('https://www.wikidata.org/w/api.php', {anonymous: true, ajax: {timeout: 6000}});
                    const response = await cachedRead('authority:'+item,()=>client.get({action: 'wbgetentities', formatversion: 2, ids: item,
                        props: 'claims|sitelinks', sitefilter: 'ptwiki'}));
                    task.guard();
                    endMatterReadCache.set('person-entity:'+item,{time:Date.now(),data:response.entities?.[item]});
                    const candidate = authorityEligibility(response.entities?.[item], {entityId: item,
                        title: task.title, namespace: 0, fullPage: task.section === null,
                        redirect: !!mw.config.get('wgIsRedirect'), disambiguation: !!mw.config.get('wgIsDisambiguationPage')});
                    if (candidate) {
                        message('Conferindo se o controle de autoridade exibe identificadores...');
                        const parser = new mw.Api({ajax: {timeout: 6000}});
                        const parsed = await cachedRead('authority-render:' + item + ':' + task.title,
                            () => parser.post({action: 'parse', formatversion: 2, title: task.title,
                                text: '{{Controle de autoridade}}', contentmodel: 'wikitext', prop: 'text|parsewarnings|properties'}));
                        task.guard();
                        const displayConfirmation = authorityRenderConfirmation(parsed, {entityId: item,
                            title: task.title, namespace: 0, fullPage: task.section === null});
                        if (displayConfirmation) cfg.authorityData = {...candidate, displayConfirmation};
                    }
                } catch (error) {
                    task.guard(); cfg.authorityLookupWarning = 'A consulta de autoridade não foi concluída. Os outros ajustes podem ser conferidos normalmente.';
                }
            }
            task.guard(); return cfg;
        } finally { task.preflightRequests = []; }
    }

    async function prepareBiographyGender(task,options) {
        const cfg={...options};delete cfg.biographyGenderProof;
        if(!cfg.endMatter||!cfg.portals||!cfg.automaticBiographyPortals||cfg.namespaceNumber!==0||cfg.sectionOnly)return cfg;
        const box=principalBiographyBox(task.source,cfg);
        if(!box||!biographySubjectMatchesTitle(box,task.title)||biographyIsWoman(task.source,cfg,box))return cfg;
        for(const node of biographyNodes(task.source).nodes) {
            const p=parsedTemplate(task.source.slice(node.start,node.end));
            if(!['portal','portal2','portal3','barra de portal','portal bar'].includes(p.name))continue;
            const parsed=biographyPortalSlots(task.source.slice(node.start,node.end));
            if(parsed.unsafe||[...parsed.slots.values()].some(e=>portalIdentity(e.value)==='mulheres'))return cfg;
        }
        const item=mw.config.get('wgWikibaseItemId');
        if(!/^Q[1-9]\d*$/.test(item||''))return cfg;
        task.preflightRequests=[];
        try {
            const cacheKey='person-entity:'+item;let cached=endMatterReadCache.get(cacheKey);
            if(!cached||Date.now()-cached.time>=120000) {
                message('Conferindo portais da biografia no Wikidata...');
                const client=new mw.ForeignApi('https://www.wikidata.org/w/api.php',{anonymous:true,ajax:{timeout:6000}});
                const request=client.get({action:'wbgetentities',formatversion:2,ids:item,props:'claims|sitelinks',sitefilter:'ptwiki'});
                task.preflightRequests.push(request);const response=await request;task.guard();
                cached={time:Date.now(),data:response.entities?.[item]};
                if(endMatterReadCache.size>=25)endMatterReadCache.clear();endMatterReadCache.set(cacheKey,cached);
            }
            const context={entityId:item,title:task.title,namespace:0,fullPage:task.section===null,
                redirect:!!mw.config.get('wgIsRedirect'),disambiguation:!!mw.config.get('wgIsDisambiguationPage')};
            if(womanEligibility(cached.data,context)) {
                const entity=cached.data;
                cfg.biographyGenderProof={...context,source:task.source,entity:{id:entity.id,type:entity.type,
                    claims:{P31:entity.claims.P31,P21:entity.claims.P21},sitelinks:{ptwiki:entity.sitelinks.ptwiki}}};
            }
        }catch(error){task.guard();}finally{task.preflightRequests=[];}
        return cfg;
    }

    async function prepareLivingCategory(task,options) {
        const cfg={...options,livingCategoryConfirmed:false};
        if(!cfg.birthDates||!cfg.livingBirthAge||cfg.namespaceNumber!==0||cfg.sectionOnly)return cfg;
        const box=principalBiographyBox(task.source,cfg);
        if(!box||biographyDeathIndication(task.source,box)||
            !box.fields.some(e=>BIRTH_FIELDS.has(norm(e.key))&&livingDniValue(e.value)))return cfg;
        if(/\[\[\s*Categoria\s*:\s*Pessoas vivas\s*(?:\|[^\]]*)?\]\]/i.test(protectedView(task.source)))return cfg;
        const key='living-category:'+task.title+':'+baseRevision();
        task.preflightRequests=[];
        try{
            let cached=endMatterReadCache.get(key);
            if(!cached||Date.now()-cached.time>=120000){
                const client=new mw.Api({ajax:{timeout:4000}}),request=client.get({action:'query',formatversion:2,
                    titles:task.title,prop:'categories',clcategories:'Categoria:Pessoas vivas',cllimit:1});
                task.preflightRequests.push(request);
                const response=await request;task.guard();
                const page=response.query?.pages?.find(p=>norm(p.title||'')===norm(task.title)&&p.ns===0&&!p.missing);
                cached={time:Date.now(),data:!!page?.categories?.some(c=>norm(c.title)==='categoria:pessoas vivas')};
                if(endMatterReadCache.size>=25)endMatterReadCache.clear();endMatterReadCache.set(key,cached);
            }
            cfg.livingCategoryConfirmed=cached.data===true;
        }catch(error){task.guard();}finally{task.preflightRequests=[];}
        return cfg;
    }

    async function run(compareOnly) {
        const adapter = editor();
        if (!adapter) { message('Abra Editar código-fonte para ajustar o código.'); return; }
        const before = adapter.read(), task = beginLocalAnalysis(adapter, before, 'Preparando os ajustes...');
        if (!task) return;
        try {
            const proofs = await prepareAutomaticProofs(task,currentOptions(true));
            const prepared = await prepareBiographyGender(task,await prepareLivingCategory(task,await prepareEndMatter(task, await prepareReferenceColumns(task,await prepareMinorBaseline(task,proofs)))));
            let result = await computeLocal(task, {kind: 'adjust', source: before, originalSource: compareOnly ? before : appliedBaseline(adapter, before), options: prepared});
            result = await verifyAutomaticResult(task,result,prepared);
            task.guard(); result.proposed = !!compareOnly;
            if (!compareOnly && result.text !== before) {
                adapter.write(result.text);
                if (adapter.read() !== result.text) throw new Error('O editor não confirmou a atualização. Use o Desfazer do editor.');
                rememberEdit(adapter, before, result.text, 'syntax', result.changes.map(c => c.label).join(', '));
            }
            showReport(result);
            if (result.text === before) { panel.querySelector('.ajg-diff').replaceChildren(); comparisonPlan = null;
                message(['rollback','local-rollback'].includes(result.previewCheck?.status)?'Os ajustes foram recusados pela verificação de preservação. Confira o motivo no relatório.':'Nenhum ajuste automático necessário. Confira os avisos e as sugestões, se houver.'); return; }
            showComparison(adapter, result.comparisonBefore ?? before, result, !compareOnly); renderIssues();
            message(compareOnly ? 'Comparação pronta. Escolha os trechos e clique em Aplicar escolhas.' : 'Código ajustado. Confira as alterações e a pré-visualização antes de publicar.');
        } catch (error) { if (localTask === task) message(error.message); }
        finally { finishLocalAnalysis(task); }
    }
    async function runSpelling() {
        const adapter = editor();
        if (!adapter) { message('Abra Editar código-fonte para revisar a ortografia.'); return; }
        const source = adapter.read(), task = beginLocalAnalysis(adapter, source, 'Conferindo a ortografia...');
        if (!task) return;
        try {
            if (spellingIgnoredSource !== source) spellingIgnored = [];
            spellingIgnoredSource = source;
            const result = await computeLocal(task, {kind: 'spelling', source, options: spellingOptions()});
            task.guard(); showReport({...result, editorId: adapter.id});
            panel.querySelector('.ajg-diff').replaceChildren(); comparisonPlan = null;
            message('Conferência pronta. O texto permanece igual até você aceitar uma substituição.');
        } catch (error) { if (localTask === task) message(error.message); }
        finally { finishLocalAnalysis(task); }
    }
    let localBusy = false, localTask = null, workerState = null, workerUnavailable = false, localSerial = 0;
    api.processing = {active: false, engine: null, milliseconds: null, workerFailure: null};
    function updateBusyControls() {
        const any = localBusy || onlineBusy;
        if (publishAdjustment) publishAdjustment.disabled = any;
        if (!panel) return;
        updateAppliedResult();
        panel.classList.toggle('ajg-local-busy', localBusy);
        panel.setAttribute('aria-busy', String(any));
        panel.querySelectorAll('.ajg-check-all,.ajg-show-changes,.ajg-select-changes,.ajg-disambig-apply,.ajg-run,.ajg-compare,.ajg-spelling,.ajg-check,.ajg-preview,.ajg-revision,.ajg-resume,.ajg-review,.ajg-ignore,.ajg-spelling-ignore-rule,.ajg-spelling-allow-word,.ajg-change-choice,.ajg-apply-choices').forEach(b => { b.disabled = any; });
        const undoControl = panel.querySelector('.ajg-undo'); if (undoControl) undoControl.disabled = any || !last;
        const stopControl = panel.querySelector('.ajg-stop'); if (stopControl) {stopControl.hidden = !localBusy; stopControl.disabled = !localBusy;}
        for (const b of panel.querySelectorAll('.ajg-disambig-apply')) b.disabled = any || !b.parentNode.querySelector('.ajg-disambig-target')?.value;
        panel.querySelector('.ajg-cancel').hidden = !onlineBusy;
        panel.querySelector('.ajg-cancel').disabled = !onlineBusy;
        panel.querySelectorAll('.ajg-settings input,.ajg-settings select,.ajg-spelling-settings input,.ajg-spelling-settings button,.ajg-spelling-filter').forEach(e => {
            const key = e.dataset.option;
            e.disabled = any || !!(key && Object.hasOwn(personalConfig(), key)) ||
                (e.classList.contains('ajg-spelling-words-clear') && !spellingPreferences.words.length);
        });
    }
    function pauseLocal() { return new Promise(resolve => root.setTimeout(resolve, 0)); }
    function beginLocalAnalysis(adapter, source, messageText) {
        if (localBusy || onlineBusy) { message('Há uma conferência em andamento. Aguarde ou cancele antes de iniciar outra.'); return null; }
        const task = {id: ++localSerial, adapterId: adapter.id, source, panel, title: currentTitle(), section: editingSection(), base: baseRevision(), cancelled: false,
            guard() {
                const current = editor();
                if (this.cancelled || localTask !== this) throw new Error('Análise cancelada. Nenhum ajuste foi aplicado.');
                if (!current || current.id !== this.adapterId || current.read() !== this.source || panel !== this.panel ||
                    editingSection() !== this.section || baseRevision() !== this.base || currentTitle() !== this.title)
                    throw new Error('O texto ou o editor mudou durante a análise. Nenhum ajuste foi aplicado. Execute a revisão novamente.');
            }};
        localTask = task; localBusy = true; api.processing.active = true;
        updateBusyControls(); message(messageText);
        return task;
    }
    function finishLocalAnalysis(task) {
        if (localTask !== task) return;
        localTask = null; localBusy = false; api.processing.active = false; updateBusyControls();
    }
    function dropWorker(reason) {
        const state = workerState; workerState = null;
        if (!state) return;
        if (state.url) root.URL.revokeObjectURL(state.url);
        state.worker.terminate();
        const pending = state.pending; state.pending = null;
        if (pending) { root.clearTimeout(pending.timer); pending.reject(reason || new Error('Análise cancelada.')); }
    }
    function cancelLocalAnalysis() {
        if (!localTask) return;
        const task = localTask; task.cancelled = true;
        for(const pending of task.preflightRequests || []) if(typeof pending.abort === 'function')pending.abort();
        for(const pending of task.previewSession?.requests || []) if(typeof pending.abort === 'function')pending.abort();
        dropWorker(new Error('Análise cancelada. Nenhum ajuste foi aplicado.'));
        finishLocalAnalysis(task);
        message('Análise cancelada. O texto e o resumo foram preservados.');
    }
    function createWorker() {
        if (workerState) return workerState;
        if (workerUnavailable || typeof root.Worker !== 'function' || !root.Blob || !root.URL?.createObjectURL) throw new Error('Processamento separado indisponível.');
        const blob = new root.Blob(['globalThis.RevisaWikiDataV2='+JSON.stringify(root.RevisaWikiDataV2)+';\n(' + RevisaWikiBoot.toString() + ')(globalThis);'], {type: 'application/javascript'});
        const url = root.URL.createObjectURL(blob);
        let worker;
        try { worker = new root.Worker(url); }
        catch (error) { root.URL.revokeObjectURL(url); throw error; }
        const state = {worker, url, pending: null}; workerState = state;
        worker.onmessage = event => {
            const response = event.data, pending = state.pending;
            if (state.url) { root.URL.revokeObjectURL(state.url); state.url = null; }
            if (!pending || response?.id !== pending.id) return;
            if (response.type === 'progress') { pending.progress(response.message); return; }
            state.pending = null; root.clearTimeout(pending.timer);
            if (response.type === 'result') pending.resolve(response.result);
            else pending.reject(new Error(response.message || 'Não foi possível concluir a análise.'));
        };
        worker.onerror = event => {
            event.preventDefault?.();
            const error = new Error(event.message || 'O navegador não iniciou o processamento separado.');
            workerUnavailable = true; api.processing.workerFailure = error.message; dropWorker(error);
        };
        worker.onmessageerror = () => { workerUnavailable = true; dropWorker(new Error('Não foi possível receber a análise.')); };
        return state;
    }
    function serializableOptions(options) {
        const result = {};
        for (const key of [...Object.keys(DEFAULTS), 'captureTrace', 'sectionOnly', 'namespaceNumber', 'pageTitle', 'pageRedirect', 'pageDisambiguation', 'spellingLimit', 'spellingIgnored', 'spellingAllowedWords', 'spellingIgnoredRules', 'spellingRepeated', 'spellingFilter', 'authorityData', 'footerProfiles', 'authorityLookupWarning', 'footerLookupWarning', 'noteReferenceColumnsSupported', 'referenceColumnLookupWarning', 'minorBaseConfirmed','livingCategoryConfirmed','discussionPage','doiRepairProofs','noteRendererProofs','noteRendererProofSource','biographyGenderProof','headingMainArticleProofs','headingMainArticleProofSource']) {
            const value = options[key];
            if (typeof value === 'boolean' || typeof value === 'number' || Array.isArray(value) ||
                (['pageTitle','spellingFilter','authorityLookupWarning','footerLookupWarning','referenceColumnLookupWarning','noteRendererProofSource','headingMainArticleProofSource'].includes(key) && typeof value === 'string') ||
                (['authorityData','footerProfiles','biographyGenderProof'].includes(key) && value && typeof value === 'object' && !Array.isArray(value))) result[key] = value;
        }
        return result;
    }
    async function computeLocal(task, job) {
        const started = root.performance.now();
        const progress = text => { if (localTask === task && !task.cancelled) message(text); };
        await pauseLocal(); task.guard();
        job = {...job, options: serializableOptions(confirmedMinorOptions(task,job))};
        try {
            const state = createWorker();
            const result = await new Promise((resolve, reject) => {
                const timer = root.setTimeout(() => {
                    const error = new Error('A análise demorou demais. Nenhum ajuste foi aplicado. Tente novamente ou revise uma seção.');
                    error.noFallback = true; dropWorker(error);
                }, 60000);
                state.pending = {id: task.id, resolve, reject, timer, progress};
                try { state.worker.postMessage({type: 'calculate', id: task.id, job}); }
                catch (error) { root.clearTimeout(timer); state.pending = null; reject(error); }
            });
            task.guard(); api.processing.engine = 'worker'; api.processing.milliseconds = root.performance.now() - started;
            return result;
        } catch (error) {
            task.guard();
            if (error.noFallback) throw error;
            if (!workerUnavailable && workerState) throw error;
            workerUnavailable = true; api.processing.workerFailure = error.message;
            progress('Preparando a revisão em etapas...');
            const steps = calculationSteps(job); let next;
            do {
                await pauseLocal(); task.guard(); next = steps.next();
                if (!next.done) progress(next.value);
            } while (!next.done);
            task.guard(); api.processing.engine = 'staged'; api.processing.milliseconds = root.performance.now() - started;
            return next.value;
        }
    }

    function currentTitle() { return (mw.config.get('wgPageName') || mw.config.get('wgTitle') || 'RevisaWiki/Testes').replace(/_/g, ' '); }
    const queryCache = new Map(), issueStore = new Map();
    let activeCheck = null, linkProgress = null, cacheBytes = 0, lastLocalResult = null;
    function baseRevision() {
        for (const id of ['wpBaseRevId', 'editRevId', 'wpParentRevId']) {
            const value = root.document.getElementById(id)?.value;
            if (/^\d+$/.test(value || '') && Number(value)) return Number(value);
        }
        const target = sourceTarget();
        return Number(target?.revid || mw.config.get('wgRevisionId') || mw.config.get('wgCurRevisionId')) || 0;
    }
    function editingSection() {
        const element = root.document.getElementById('wpSection');
        if (element && element.value !== '') return element.value;
        try { return new URL(root.location.href).searchParams.get('section') ?? null; } catch (_) { return null; }
    }
    function onlineSession() {
        const adapter = editor();
        if (!adapter) throw new Error('Abra Editar código-fonte para verificar o texto.');
        const source = adapter.read(), base = baseRevision(), section = editingSection(), title = currentTitle();
        const session = {adapter, source, base, section, title, cancelled: false, requests: new Set(),
            key: JSON.stringify([title, base, section, source]), client: new mw.Api({ajax: {timeout: 15000}}),
            guard() {
                if (this.cancelled) throw new Error('Verificação cancelada.');
                const a = editor();
                if (!a || a.id !== adapter.id || a.read() !== source || editingSection() !== section || baseRevision() !== base || currentTitle() !== title) {
                    linkProgress = null; queryCache.clear(); cacheBytes = 0;
                    throw new Error('O texto mudou. Faça a verificação novamente.');
                }
            }};
        return session;
    }
    async function request(session, method, params, cache = true) {
        session.guard();
        const key = JSON.stringify([session.key, method, params]), previous = queryCache.get(key);
        if (cache && previous && Date.now() - previous.time < 120000) return previous.data;
        const pending = session.client[method](params); session.requests.add(pending);
        try {
            const data = await pending; session.guard();
            if (data.error) throw new Error(data.error.info || data.error.code);
            if (cache) {
                const bytes = JSON.stringify(data).length * 2;
                if (bytes < 8000000) {
                    if (cacheBytes + bytes > 10000000) { queryCache.clear(); cacheBytes = 0; }
                    const replaced = queryCache.get(key); if (replaced) cacheBytes -= replaced.bytes;
                    queryCache.set(key, {data, time: Date.now(), bytes}); cacheBytes += bytes;
                }
            }
            return data;
        } finally { session.requests.delete(pending); }
    }
    function cancelCheck() {
        if (!activeCheck) return;
        activeCheck.cancelled = true;
        for (const pending of activeCheck.requests) if (typeof pending.abort === 'function') pending.abort();
        message('Cancelamento solicitado. As etapas concluídas podem ser retomadas enquanto o texto permanecer igual.');
    }
    function onlineError(error) {
        return error && error.message || (typeof error === 'string' ? error : Array.isArray(error) ? String(error[0]) : 'A API não respondeu.');
    }
    function busy(value, session) {
        onlineBusy = value; activeCheck = value ? session : null; updateBusyControls();
    }
    function sectionNotice() {
        return editingSection() !== null ? ' A seção é conferida dentro da revisão de origem da página inteira.' : '';
    }
    async function draftContext(session, source) {
        if (session.section === null) return {text: source, start: 0, end: source.length};
        if (!session.base) throw new Error('Não foi possível determinar a revisão de origem da seção. Abra a edição da página inteira.');
        const response = await request(session, 'get', {action: 'parse', formatversion: 2, oldid: session.base, prop: 'wikitext|tocdata'});
        const parsed = response.parse, sections = parsed?.tocdata?.sections || parsed?.sections;
        if (!parsed || typeof parsed.wikitext !== 'string' || !Array.isArray(sections)) throw new Error('A API não retornou o código e as seções da revisão de origem.');
        return composeSection(parsed.wikitext, sections, session.section, source);
    }
    async function parseDraft(session, source) {
        const context = await draftContext(session, source);
        const response = await request(session, 'post', {action: 'parse', formatversion: 2, title: session.title,
            text: context.text, contentmodel: 'wikitext', prop: 'text|images|templates|parsewarnings', preview: true});
        if (!response.parse || typeof response.parse.text !== 'string') throw new Error('A API não retornou a pré-visualização.');
        return {...response.parse, context};
    }
    async function revisionAudit(session) {
        if (!session.base) return;
        const response = await request(session, 'get', {action: 'query', formatversion: 2, titles: session.title,
            prop: 'revisions', rvprop: 'ids', rvlimit: 1}, false);
        if (!response.query?.pages) throw new Error('Não foi possível conferir a revisão mais recente.');
        const page = response.query.pages[0], revision = page?.revisions?.[0]?.revid;
        const findings = [];
        if (revision && revision !== session.base) findings.push({code: 'newer-revision', severity: 'warning',
            message: 'Alguém editou a página depois que você abriu o editor. Compare as versões antes de salvar.',
            url: '/w/index.php?title=' + encodeURIComponent(session.title) + '&oldid=' + session.base + '&diff=' + revision});
        else if (!revision) findings.push({code: 'revision-unavailable', message: 'A revisão mais recente não está disponível para comparação.'});
        setIssues('revision', findings, session.source);
        return revision;
    }
    async function checkRevision(sharedSession) {
        const shared = sharedSession && typeof sharedSession.guard === 'function';
        if (!shared && (onlineBusy || localBusy)) return false;
        let session; try { session = shared ? sharedSession : onlineSession(); } catch (error) { message(error.message); return false; }
        if (!session.base) { setIssues('revision', [{code:'revision-unavailable',message:'A revisão de origem não está disponível. A página pode ser nova.'}], session.source); return false; }
        if (!shared) busy(true, session); message('Verificando se a página mudou desde que você abriu o editor...');
        try {
            const revision = await revisionAudit(session);
            message(revision === session.base ? 'Ninguém editou a página depois que você abriu esta revisão.' : 'Conferência concluída. Veja o relatório de mudanças desde que você abriu o editor.');
            return !!revision;
        } catch (error) { message('Não foi possível verificar se a página mudou: ' + onlineError(error)); return false; }
        finally { if (!shared) busy(false); }
    }
    async function checkPreview(sharedSession) {
        const shared = sharedSession && typeof sharedSession.guard === 'function';
        if (!shared && (onlineBusy || localBusy)) return false;
        let session; try { session = shared ? sharedSession : onlineSession(); } catch (error) { message(error.message); return false; }
        if (!shared) busy(true, session); message('Conferindo a pré-visualização, sem publicar...' + sectionNotice());
        try {
            if (!shared) await revisionAudit(session);
            const now = await parseDraft(session, session.source), current = renderedAudit(now.text, now.parsewarnings, root.DOMParser);
            let earlier = null;
            if (last && last.id === session.adapter.id && last.after === session.source) earlier = await parseDraft(session, last.before);
            const old = earlier ? renderedAudit(earlier.text, earlier.parsewarnings, root.DOMParser) : null;
            const findings = current.findings.map(f => ({code: 'parser', message: old ?
                (old.findings.includes(f) ? 'Já existia: ' : 'Novo após os ajustes: ') + f : f,
                anchor: locateFinding(session.source, f)}));
            if (old) for (const f of old.findings.filter(f => !current.findings.includes(f)))
                findings.push({code: 'parser-resolved', message: 'Resolvido: ' + f, state: 'resolved'});
            if (!findings.length) findings.push({code: 'parser-ok', message: 'Nenhum erro de referências, citações ou predefinições foi encontrado na pré-visualização.', state: 'resolved'});
            setIssues('preview', findings, session.source);
            const audit = referenceAudit(now.context.text).map(f => ({...f, start: f.start >= now.context.start && f.start < now.context.end ? f.start - now.context.start : -1}));
            setIssues('references', audit, session.source);
            if (earlier) {
                const missing = lostWords(renderedProse(earlier.text, root.DOMParser), renderedProse(now.text, root.DOMParser));
                setIssues('rendered-preservation', missing.length ? [{code: 'rendered-loss', message:
                    'Conferir palavras retiradas da pré-visualização: ' + missing.slice(0, 20).join(', ') + '. Alterações de apresentação podem explicar a diferença.'}] :
                    [{code: 'rendered-preserved', message: 'O vocabulário do texto visível foi preservado nas duas pré-visualizações conferidas.', state: 'resolved'}], session.source);
            }
            message('Pré-visualização verificada. Nenhum trecho foi alterado.' + sectionNotice());
            return true;
        } catch (error) { message('Não foi possível concluir a pré-visualização: ' + onlineError(error)); return false; }
        finally { if (!shared) busy(false); }
    }
    async function checkLinks(sharedSession) {
        const shared = sharedSession && typeof sharedSession.guard === 'function';
        if (!shared && (onlineBusy || localBusy)) return false;
        let session; try { session = shared ? sharedSession : onlineSession(); } catch (error) { message(error.message); return false; }
        if (!linkProgress || linkProgress.key !== session.key || Date.now() - linkProgress.time > 120000) {
            const targets = linkTargets(session.source).concat(templateTargets(session.source), imageTargets(session.source));
            const fragments = fragmentTargets(session.source, session.title);
            for (const f of fragments) if (!targets.some(t => t.title === f.title)) targets.push({title: f.title});
            const all = targets.filter((x, i, a) => a.findIndex(y => y.title === x.title) === i);
            linkProgress = {key: session.key, time: Date.now(), all, targets, fragments, offset: 0, fragmentOffset: 0,
                resolved: new Map(), pages: new Map(), anchors: new Map(), findings: []};
        }
        const work = linkProgress;
        if (!work.all.length) { setIssues('links', [{code:'destinations-empty',state:'resolved',message:'Não há destinos reconhecidos para conferir.'}], session.source); panel.querySelector('.ajg-resume').hidden = true; return true; }
        if (!shared) busy(true, session);
        const finding = (text, needle, extra = {}) => {
            if (!work.findings.some(f => f.message === text)) work.findings.push({code: 'destination', message: text,
                anchor: needle ? locateTarget(session.source, needle) : undefined, ...extra});
        };
        try {
            if (!shared) await revisionAudit(session);
            let checked = 0;
            for (; work.offset < work.all.length && checked < 1000;) {
                session.guard(); message('Verificando ' + Math.min(work.offset + 50, work.all.length) + ' de ' + work.all.length + ' destinos...');
                const batch = work.all.slice(work.offset, work.offset + 50), response = await request(session, 'get', {action: 'query', formatversion: 2,
                    titles: batch.map(x => x.title).join('|'), redirects: 1, prop: 'pageprops|revisions|imageinfo', rvprop: 'ids', iiprop: 'url'});
                if (!response.query?.pages) throw new Error('A API não retornou as páginas.');
                const aliases = new Map([...(response.query.normalized || []), ...(response.query.redirects || [])].map(x => [x.from, x.to]));
                const resolve = title => { const seen = new Set(); while (aliases.has(title) && !seen.has(title)) { seen.add(title); title = aliases.get(title); } return title; };
                const pages = new Map(response.query.pages.map(p => [p.title, p]));
                // Conferir a resposta completa antes de guardar a etapa como concluída.
                if (batch.some(t => !pages.has(resolve(t.title)))) throw new Error('A API retornou uma etapa incompleta.');
                for (const target of batch) {
                    const title = resolve(target.title), page = pages.get(title);
                    work.resolved.set(target.title, title); work.pages.set(title, page);
                    const kinds = work.targets.filter(t => t.title === target.title), image = kinds.some(t => t.image);
                    if (image) { if (!page.imageinfo?.length) finding('Arquivo sem imagem disponível na ptwiki ou no Commons: ' + target.title, target.title); }
                    else if (page.missing !== undefined) finding((target.template ? 'Predefinição inexistente' : target.dependency ? 'Dependência inexistente' :
                        target.category ? 'Categoria inexistente' : target.seeAlso ? 'Ligação inexistente em Ver também' : 'Ligação inexistente') + ': ' + target.title, target.title);
                    else if (page.invalid !== undefined) finding('Título inválido: ' + target.title, target.title);
                    else if (page.pageprops && Object.hasOwn(page.pageprops, 'disambiguation')) finding('Desambiguação: ' + target.title + (page.title !== target.title ? ' → ' + page.title : ''), target.title, {code:'disambiguation',destination:page.title,originalTitle:target.title});
                    const oldid = target.dependency ? target.oldid : target.profile?.oldid;
                    if (oldid && page.revisions?.[0]?.revid !== oldid) finding('O código de ' + target.title + ' mudou desde o catálogo local. Confira os parâmetros na documentação atual.', target.title);
                }
                work.offset += batch.length; checked += batch.length; work.time = Date.now();
                setIssues('links', work.findings, session.source);
            }
            const fragmentPages = [...new Set(work.fragments.map(f => work.resolved.get(f.title) || f.title))];
            let checkedPages = 0;
            if (work.offset === work.all.length) for (; work.fragmentOffset < fragmentPages.length && checkedPages < 30;) {
                const title = fragmentPages[work.fragmentOffset], page = work.pages.get(title);
                if (page?.missing !== undefined || page?.invalid !== undefined) { work.fragmentOffset++; continue; }
                session.guard(); message('Conferindo seções em ' + title + '...');
                let parsed;
                if (normalizeFragment(title) === normalizeFragment(session.title)) parsed = await parseDraft(session, session.source);
                else {
                    const response = await request(session, 'get', {action: 'parse', formatversion: 2, page: title, prop: 'text|parsewarnings', redirects: true});
                    if (!response.parse || typeof response.parse.text !== 'string') throw new Error('Não foi possível conferir as seções de ' + title + '.');
                    parsed = response.parse;
                }
                work.anchors.set(title, new Set(renderedAudit(parsed.text, [], root.DOMParser).ids));
                work.fragmentOffset++; checkedPages++; work.time = Date.now();
            }
            for (const f of work.fragments) {
                const title = work.resolved.get(f.title) || f.title, ids = work.anchors.get(title);
                if (ids && !ids.has(normalizeFragment(f.fragment))) finding('Destino de seção não encontrado: ' + f.title + '#' + f.fragment + '.', f.title);
            }
            const partial = work.offset < work.all.length || work.fragmentOffset < fragmentPages.length;
            const report = [...work.findings];
            if (partial) report.push({code: 'partial', message: 'Conferência parcial. Clique em Continuar conferência para verificar os destinos restantes.'});
            else if (!report.length) report.push({code: 'destinations-ok', state: 'resolved', message: 'Nenhuma categoria inexistente, ligação inexistente, desambiguação, arquivo ausente ou predefinição inexistente encontrada nos destinos verificados.'});
            setIssues('links', report, session.source);
            panel.querySelector('.ajg-resume').hidden = !partial;
            message(partial ? 'Verificação parcial: ' + work.offset + ' de ' + work.all.length + ' destinos. É possível continuar.' :
                'Verificação concluída: ' + work.offset + ' destinos. Nenhum trecho foi alterado.');
            return !partial;
        } catch (error) {
            // Mesmo um cancelamento guarda somente etapas totalmente concluídas.
            setIssues('links', [...work.findings, {code: 'interrupted', message: 'Verificação interrompida após ' + work.offset + ' destinos: ' + onlineError(error)}], session.source);
            panel.querySelector('.ajg-resume').hidden = false;
            message('Verificação interrompida após ' + work.offset + ' destinos: ' + onlineError(error));
            return false;
        } finally { if (!shared) busy(false); }
    }

    function disambiguationOptions(html, Parser, title) {
        const doc=new Parser().parseFromString(html,'text/html'), found=new Map();
        for(const a of doc.querySelectorAll('.mw-parser-output li a[href]')) {
            if(a.closest('table,.navbox,.sidebar,.hatnote,.reflist,nav')||a.classList.contains('new')||a!==a.closest('li').querySelector('a[href]'))continue;
            try {
                const url=new URL(a.getAttribute('href'),'https://pt.wikipedia.org/');
                if(url.hostname!=='pt.wikipedia.org'||!url.pathname.startsWith('/wiki/'))continue;
                const destination=decodeURIComponent(url.pathname.slice(6)).replace(/_/g,' ');
                if(destination.includes(':')||norm(destination)===norm(title)||/[|\[\]{}<>]/.test(destination))continue;
                if(!found.has(destination))found.set(destination,{title:destination,context:a.closest('li').textContent.trim().slice(0,180)});
            } catch(_) { /* Destinos não reconhecidos ficam na própria página de desambiguação. */ }
            if(found.size>=50)break;
        }
        return [...found.values()];
    }
    async function loadDisambiguation(finding, container) {
        if(onlineBusy||localBusy)return;
        let session;try{session=onlineSession();session.guard();if(session.source!==finding.source)throw new Error('O texto mudou. Confira os destinos novamente.');}
        catch(e){message(e.message);return;}
        busy(true,session);container.replaceChildren(node('p','Buscando opções na página de desambiguação...'));
        try {
            const response=await request(session,'get',{action:'parse',formatversion:2,page:finding.destination,prop:'text',redirects:true});
            if(typeof response.parse?.text!=='string')throw new Error('A API não retornou a página de desambiguação.');
            const options=disambiguationOptions(response.parse.text,root.DOMParser,finding.destination);
            let valid=[];
            if(options.length){
                const checked=await request(session,'get',{action:'query',formatversion:2,titles:options.map(x=>x.title).join('|'),redirects:true,prop:'pageprops'});
                if(!Array.isArray(checked.query?.pages))throw new Error('A API não retornou os destinos das opções.');
                const aliases=new Map([...(checked.query.normalized||[]),...(checked.query.redirects||[])].map(x=>[x.from,x.to]));
                const pages=new Map(checked.query.pages.map(x=>[x.title,x]));
                valid=options.filter(x=>{let t=x.title,seen=new Set();while(aliases.has(t)&&!seen.has(t)){seen.add(t);t=aliases.get(t);}const p=pages.get(t);
                    return p&&p.ns===0&&p.missing===undefined&&p.invalid===undefined&&!Object.hasOwn(p.pageprops||{},'disambiguation');});
            }
            session.guard();container.replaceChildren();
            const occurrences=linkOccurrences(session.source,finding.originalTitle);
            const full=node('a','Abrir a página de desambiguação ↗');full.href='/wiki/'+encodeURIComponent(finding.destination.replace(/ /g,'_'));full.target='_blank';full.rel='noopener';
            container.append(full);
            if(!valid.length||!occurrences.length){container.append(node('p','Não foi encontrada uma substituição simples para esta ligação. Confira o destino manualmente.'));return;}
            const occurrence=node('select');occurrence.setAttribute('aria-label','Ocorrência a corrigir');occurrence.className='ajg-disambig-occurrence';
            occurrences.forEach((o,i)=>{const opt=node('option','Ocorrência '+(i+1)+': '+o.before);opt.value=String(i);occurrence.append(opt);});
            const target=node('select');target.setAttribute('aria-label','Novo destino da ligação');target.className='ajg-disambig-target';
            const placeholder=node('option','Escolha o destino');placeholder.value='';target.append(placeholder);
            valid.forEach(x=>{const opt=node('option',x.title);opt.value=x.title;target.append(opt);});
            const context=snippet(''),description=node('p');
            const update=()=>{const o=occurrences[Number(occurrence.value)];context.textContent=session.source.slice(Math.max(0,o.start-70),Math.min(session.source.length,o.end+70));
                description.textContent=valid.find(x=>x.title===target.value)?.context||'Leia o contexto e escolha o assunto correspondente.';apply.disabled=!target.value||onlineBusy||localBusy;};
            const apply=button('Aplicar nesta ocorrência',async()=>{
                const adapter=editor();if(!adapter||adapter.id!==session.adapter.id||adapter.read()!==session.source){message('O texto mudou. Confira os destinos novamente.');return;}
                const o=occurrences[Number(occurrence.value)],choice=valid.find(x=>x.title===target.value);
                if(!choice)return;
                let task;
                try {
                    const next=replaceDisambiguationLink(session.source,o,choice.title);
                    task=beginLocalAnalysis(adapter,session.source,'Preparando a ligação escolhida...');if(!task)return;
                    const result=await computeLocal(task,{kind:'refresh',source:next.text,safetySource:session.source,originalSource:appliedBaseline(adapter,session.source),options:currentOptions(false)});
                    task.guard();adapter.write(next.text);if(adapter.read()!==next.text)throw new Error('O editor não confirmou a atualização.');
                    rememberEdit(adapter,session.source,next.text,'syntax','Desambiguar ligação para '+choice.title);comparisonPlan=null;panel.querySelector('.ajg-diff').replaceChildren();showReport(result);
                    if (occurrences.length === 1) { finding.state='resolved';finding.source=next.text;finding.anchor=null;
                        finding.message='Destino escolhido: '+choice.title+'. O texto visível da ligação foi preservado.'; }
                    renderIssues();message('Ligação corrigida. Confira os destinos novamente para atualizar os demais avisos.');
                }catch(e){message(e.message);}finally{if(task)finishLocalAnalysis(task);}
            },'ajg-disambig-apply');
            occurrence.addEventListener('change',update);target.addEventListener('change',update);
            container.append(occurrence,context,target,description,apply);update();
        }catch(e){container.replaceChildren(node('p','Não foi possível buscar opções: '+onlineError(e)));}
        finally{busy(false);const apply=container.querySelector('.ajg-disambig-apply');if(apply)apply.disabled=!container.querySelector('.ajg-disambig-target')?.value;}
    }
    async function checkAll() {
        if(localBusy||onlineBusy)return;
        let session,task;try{session=onlineSession();task=beginLocalAnalysis(session.adapter,session.source,'1 de 4: conferindo código, tabelas e datas...');if(!task)return;}
        catch(e){message(e.message);return;}
        const stages=[];
        try {
            const result=await computeLocal(task,{kind:'audit',source:session.source,options:currentOptions(false)});
            task.guard();showReport(result);stages.push({code:'local-complete',state:'resolved',message:'Código, tabelas e datas conferidos localmente.'});
        }catch(e){stages.push({code:'local-incomplete',message:'Conferência local não concluída: '+e.message});}
        finally{finishLocalAnalysis(task);}
        if (task.cancelled) { session.cancelled = true; return; }
        try{session.guard();}catch(e){message(e.message);return;}
        busy(true,session);
        try {
            for(const [label,fn] of [['pré-visualização',checkPreview],['destinos',checkLinks],['edições recentes',checkRevision]]) {
                session.guard();message((stages.length+1)+' de 4: conferindo '+label+'...');
                const ok=await fn(session);
                stages.push({code:'stage-'+label,state:ok?'resolved':'pending',message:label+': '+(ok?'concluído.':'conferência incompleta. Confira os avisos.')});
            }
            session.guard();setIssues('checks',stages,session.source);
            message(stages.every(s=>s.state==='resolved')?'Conferência concluída. Leia os resultados no relatório.':'Conferência concluída com etapas incompletas. Veja o relatório.');
        }catch(e){if(editor()?.read()===session.source)setIssues('checks',[...stages,{code:'check-interrupted',message:'Conferência interrompida: '+onlineError(e)}],session.source);message(onlineError(e));}
        finally{busy(false);}
    }
    async function copyDiagnostic() {
        const adapter=editor(),source=adapter?.read()||'';
        const text=diagnosticReport({version:VERSION,title:currentTitle(),base:baseRevision(),editor:sourceTarget()?'código-fonte de 2017':'código-fonte clássico ou CodeMirror',
            options:Object.entries(currentOptions(false)).filter(([,v])=>v===true).map(([k])=>k),
            findings:[...issueStore.values()].filter(f=>f.source===source&&f.state!=='ignored').map(f=>({domain:f.domain,code:f.code,message:f.message})),
            changes:last&&last.after===source?diagnosticChanges(last.before,last.after,last.rules?.length?last.rules:['Alteração aplicada nesta edição']):[]});
        let area=panel.querySelector('.ajg-diagnostic-text');
        if(!area){area=node('textarea',undefined,'ajg-diagnostic-text');area.readOnly=true;area.setAttribute('aria-label','Relatório para copiar');area.rows=8;
            panel.querySelector('.ajg-diagnostics').append(node('p','O relatório contém os trechos exibidos abaixo. Confira antes de compartilhar.'),area);}
        area.value=text;area.hidden=false;
        try{await root.navigator.clipboard.writeText(text);message('Diagnóstico copiado. Nenhum relatório foi enviado automaticamente.');}
        catch(_){area.focus();area.select();message('Relatório preparado. Use Copiar para levar o texto à área de transferência.');}
    }
    async function checkStyles() {
        if(localBusy||onlineBusy)return;
        let session;try{session=onlineSession();}catch(e){message(e.message);return;}
        const audit=templateStylesAudit(session.source);setIssues('styles',audit.findings,session.source);
        const choices=panel.querySelector('.ajg-style-choices');choices.replaceChildren();
        for(const p of audit.suggestions){const row=node('details');row.append(node('summary',p.label),node('strong','Antes'),snippet(p.before),node('strong','Depois'),snippet(p.after));
            row.append(button('Aplicar correção',()=>{
                const adapter=editor();if(!adapter||adapter.id!==session.adapter.id||adapter.read()!==session.source){message('O CSS mudou. Faça a conferência novamente.');return;}
                const after=session.source.slice(0,p.start)+p.after+session.source.slice(p.end);
                adapter.write(after);if(adapter.read()!==after){message('O editor não confirmou a atualização.');return;}
                rememberEdit(adapter,session.source,after,'styles',p.label);choices.replaceChildren();updateBusyControls();message('Correção aplicada. Confira o CSS novamente antes de salvar.');
            },'ajg-review'));choices.append(row);}
        busy(true,session);message('Conferindo o CSS retornado pelo TemplateStyles, sem publicar...');
        try {
            const escaped=session.title.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
            const response=await request(session,'post',{action:'parse',formatversion:2,title:'RevisaWiki/Teste de estilos',text:'<templatestyles src="'+escaped+'" />',prop:'text|parsewarnings',
                templatesandboxtitle:session.title,templatesandboxtext:session.source,templatesandboxcontentmodel:'sanitized-css',templatesandboxcontentformat:'text/css',preview:true});
            if(typeof response.parse?.text!=='string')throw new Error('A API não retornou a folha sanitizada.');
            const doc=new root.DOMParser().parseFromString(response.parse.text,'text/html');
            const sanitized=[...doc.querySelectorAll('style[data-mw-deduplicate]')].map(x=>x.textContent).join('\n');
            const retained=cssRetention(session.source,sanitized),findings=[...audit.findings];
            for(const d of retained.missing)if(!findings.some(f=>f.start===d.start))findings.push({code:'css-declaration-missing',message:'Declaração não encontrada no CSS retornado: '+d.before+'. Confira o aviso do editor.',start:d.start,end:d.end});
            for(const w of response.parse.parsewarnings||[])findings.push({code:'css-api-warning',message:typeof w==='string'?w:JSON.stringify(w)});
            if(!audit.declarations.length)findings.push({code:'css-empty',message:'Nenhuma declaração simples foi reconhecida. Confira a folha no editor.'});
            if(!findings.length)findings.push({code:'css-retained',state:'resolved',message:'As '+retained.submitted+' declarações reconhecidas têm suas propriedades no CSS retornado. Confira também os avisos ao salvar.'});
            setIssues('styles',findings,session.source);message('Conferência de CSS concluída. Veja os resultados abaixo.');
        }catch(e){setIssues('styles',[...audit.findings,{code:'css-unavailable',message:'Conferência online não concluída: '+onlineError(e)}],session.source);message('A análise local foi concluída. A conferência online não terminou.');}
        finally{busy(false);}
    }
    function mountStyles() {
        const adapter=editor();if(!adapter||panel&&panel.isConnected&&panelEditor===adapter.id)return;
        if(panel)panel.remove();if(panelEditor!==adapter.id){last=null;queryCache.clear();cacheBytes=0;}panelEditor=adapter.id;issueStore.clear();installPanelStyle();
        panel=node('div');panel.id='revisawiki-ptwiki';panel.setAttribute('role','region');panel.setAttribute('aria-label','RevisaWiki, conferência de TemplateStyles');
        const actions=node('div',undefined,'ajg-actions');
        actions.append(button('Conferir CSS',checkStyles,'mw-ui-progressive ajg-check'),button('Desfazer',undoStyle,'ajg-undo'),button('Cancelar conferência',cancelCheck,'ajg-cancel'));
        const status=node('div','Conferência experimental de TemplateStyles. As correções são oferecidas para escolha.','ajg-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
        const report=node('div',undefined,'ajg-report');report.hidden=true;
        panel.append(node('strong','RevisaWiki '+VERSION+' · TemplateStyles'),actions,status,node('div',undefined,'ajg-style-choices'),report,diagnosticsPanel());
        const anchor=root.document.querySelector('#wikiEditor-ui-toolbar,#wpTextbox1');if(anchor?.parentNode)anchor.parentNode.insertBefore(panel,anchor);
        busy(false);root.document.getElementById('wpTextbox1')?.addEventListener('input',renderIssues);
    }
    function undoStyle() {
        const adapter=editor();if(!last||!adapter||last.id!==adapter.id||last.after!==adapter.read()){message('O CSS mudou. Use o Desfazer do editor.');return;}
        const previous=last;adapter.write(previous.before);const summary=summaryEditor();
        if(summary&&previous.summary&&summary.id===previous.summary.id&&summary.read()===previous.summary.after)summary.restore(previous.summary.before);
        last=null;panel.querySelector('.ajg-style-choices').replaceChildren();issueStore.clear();renderIssues();busy(false);message('CSS anterior restaurado.');
    }

    function settingsPanel() {
        const wrap = node('details', undefined, 'ajg-settings'), title = node('summary', 'Opções de ajuste'); wrap.appendChild(title);
        const select = node('select'); select.className = 'ajg-preset'; select.setAttribute('aria-label', 'Conjunto de ajustes');
        for (const [value, text] of [['all', 'Todos os ajustes'], ['references', 'Só referências'], ['infoboxes', 'Só infocaixas']]) {
            const option = node('option', text); option.value = value; select.appendChild(option);
        }
        select.value = preferences.preset;
        select.addEventListener('change', () => { preferences = {preset: select.value, overrides: {}}; savePreferences(); refresh(); });
        wrap.append(select); const choices = node('div', undefined, 'ajg-options'); wrap.appendChild(choices);
        function refresh() {
            choices.replaceChildren(); const cfg = currentOptions(false);
            for (const [key, text] of [['citations', 'Citações'], ['references', 'Referências'],
                ['structuralRepairs', 'Corrigir sintaxe, repetições e listas de referências'], ['translationResidues', 'Retirar resíduos conhecidos de tradução'],
                ['referenceColumns', 'Duas colunas em listas de referências com seis ou mais entradas'], ['shortCitationChecks', 'Conferir destinos de citações abreviadas'],
                ['automaticIdenticalReferences', 'Reutilizar referências exatamente iguais'], ['automaticParameterDuplicates', 'Consolidar parâmetros repetidos idênticos'],
                ['automaticParameterNames', 'Corrigir nomes inválidos com equivalência única'], ['automaticEmptyParameters', 'Retirar parâmetros inválidos vazios confirmados'], ['autoMinor', 'Marcar ajustes pequenos e mecânicos como edição menor'],
                ['tableChecks', 'Conferir tabelas'], ['automaticTableRepairs', 'Aplicar reparos seguros de tabelas'], ['tableAccessibility', 'Informar alcance de cabeçalhos simples'], ['autoPreview', 'Conferir automaticamente a pré-visualização'], ['registryDoiCheck', 'Conferir pontuação de DOI na Crossref'], ['biographyStyleChecks', 'Conferir apresentação de biografias'], ['dateChecks', 'Conferir datas reconhecidas'], ['numericRefNames', 'Corrigir nomes numéricos de referências'], ['citationRepairs', 'Sugerir reparos de cadernos e títulos'], ['infoboxes', 'Infocaixas'],
                ['auxiliaryTemplates', 'Predefinições auxiliares e navboxes'], ['multilingual', 'Sintaxe importada de outras Wikipédias'],
                ['unifiedNotesReferences', 'Reunir notas e referências'], ['endMatterColumns', 'Colunas em listas finais com seis ou mais itens'], ['externalLinkColumns', 'Sugerir duas colunas quando o ajuste automático estiver desligado'], ['links', 'Ligações'], ['headings', 'Seções'],
                ['portals', 'Portais'], ['biographyPortal', 'Acrescentar portal de biografias'], ['occupationCase','Usar inicial minúscula em profissões comuns da infocaixa'], ['automaticBiographyPortals','Acrescentar portais confirmados para biografias'], ['livingBirthAge','Exibir idade quando confirmada a condição de pessoa viva'], ['automaticSpelling','Corrigir grafias inequívocas automaticamente'], ['neutralReferenceNames','Simplificar nomes automáticos antigos de referências'], ['obsoleteTemplates', 'Predefinições obsoletas'], ['shortDescriptions', 'Descrição curta'],
                ['authors', 'Autores'], ['dates', 'Datas de citações'], ['singleLineCitations', 'Citações em uma linha'],
                ['moveNamedRefs', 'Definição na primeira chamada'], ['bareReferences', 'Referências com ligação simples'], ['birthDates', 'Datas de nascimento'],
                ['markup', 'Formatação'], ['categories', 'Categorias e imagens'], ['endMatter', 'Seções finais'], ['endSectionOrder', 'Ordenar seções finais'], ['endTemplateOrder', 'Ordenar predefinições finais e categorias'], ['authorityControl', 'Acrescentar autoridade com identificadores do Wikidata'],
                ['maintenance', 'Predefinições de manutenção'], ['shortcuts', 'Atalhos explícitos'], ['review', 'Sugestões para revisão'], ['autoSummary', 'Resumo automático']]) {
                const label = node('label'), check = node('input'); check.type = 'checkbox'; check.checked = !!cfg[key]; check.dataset.option = key;
                if (Object.hasOwn(personalConfig(), key)) { check.disabled = true; label.title = 'Definido na configuração pessoal do script.'; }
                check.addEventListener('change', () => { preferences.overrides[key] = check.checked; savePreferences(); });
                label.style.cssText = 'display:inline-block;margin:4px 12px 4px 0;'; label.append(check, node('span', ' ' + text)); choices.appendChild(label);
            }
        }
        refresh(); return wrap;
    }
    function diagnosticsPanel() {
        const wrap = node('details', undefined, 'ajg-diagnostics'); wrap.append(node('summary', 'Sobre e diagnóstico'),
            node('p', 'Versão carregada: ' + VERSION + '. Catálogo: ' + CATALOG_DATE + '.'));
        const loaded = root.RevisaWikiLoadInfo || root.AjusteGeralPTLoadInfo;
        if (loaded?.expectedVersion && loaded.expectedVersion !== VERSION)
            wrap.appendChild(node('p', 'O carregador pediu ' + loaded.expectedVersion + ', mas recebeu ' + VERSION + '. Confira o arquivo salvo e recarregue com Command + Shift + R.'));
        wrap.appendChild(node('p', 'Carregamentos detectados: ' + (api.loadCount || 1) + '.', 'ajg-load-count'));
        wrap.appendChild(node('p', 'Verificações guardadas por até dois minutos, apenas nesta aba e para o mesmo texto e revisão.'));
        wrap.appendChild(node('p', 'Editor: ' + (sourceTarget() ? 'Código-fonte de 2017' : 'Código-fonte clássico ou CodeMirror') + '.'));
        wrap.append(button('Copiar diagnóstico', copyDiagnostic, 'ajg-copy-diagnostic'));
        return wrap;
    }
    function installPanelStyle() {
        if (root.document.getElementById('revisawiki-panel-style')) return;
        const style = node('style', '#revisawiki-ptwiki{box-sizing:border-box;border:1px solid var(--border-color-subtle,#c8ccd1);border-radius:6px;padding:12px 14px;margin:10px 0;background:var(--background-color-base,#fff);color:var(--color-base,#202122);font:14px/1.45 sans-serif;overflow-wrap:anywhere}\n#revisawiki-ptwiki *{box-sizing:border-box}\n#revisawiki-ptwiki [hidden]{display:none!important}\n#revisawiki-ptwiki .ajg-heading{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:4px}\n#revisawiki-ptwiki .ajg-heading strong{font-size:16px}\n#revisawiki-ptwiki .ajg-version{font-size:12px;color:var(--color-subtle,#54595d)}\n#revisawiki-ptwiki .ajg-intro{margin:0 0 10px;color:var(--color-subtle,#54595d);font-size:13px;line-height:1.5}\n#revisawiki-ptwiki .ajg-actions{display:flex;flex-wrap:wrap;align-items:center;gap:6px}\n#revisawiki-ptwiki button{min-height:32px;max-width:100%;white-space:normal;border-radius:3px;font-size:13px}\n#revisawiki-ptwiki .ajg-status{margin-top:10px;padding:6px 8px;background:var(--background-color-neutral-subtle,#f8f9fa);border-inline-start:3px solid var(--border-color-subtle,#c8ccd1);font-size:13px}\n#revisawiki-ptwiki[aria-busy=true] .ajg-status{border-inline-start-color:var(--color-progressive,#36c)}\n#revisawiki-ptwiki .ajg-online{margin:10px 0 0;border-top:1px solid var(--border-color-subtle,#c8ccd1);padding-top:7px}\n#revisawiki-ptwiki summary{cursor:pointer;padding:3px 0;font-weight:600}\n#revisawiki-ptwiki summary:focus-visible,#revisawiki-ptwiki button:focus-visible,#revisawiki-ptwiki select:focus-visible{outline:2px solid var(--color-progressive,#36c);outline-offset:2px}\n#revisawiki-ptwiki .ajg-online-intro{margin:6px 0 10px;color:var(--color-subtle,#54595d);font-size:13px}\n#revisawiki-ptwiki .ajg-online-row{display:grid;grid-template-columns:minmax(170px,220px) 1fr;align-items:center;gap:10px;margin:6px 0}\n#revisawiki-ptwiki .ajg-online-row button{width:100%}\n#revisawiki-ptwiki .ajg-online-row p{margin:0;color:var(--color-subtle,#54595d);font-size:13px;line-height:1.5}\n#revisawiki-ptwiki .ajg-online-controls{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}\n#revisawiki-ptwiki .ajg-tools{display:flex;flex-wrap:wrap;gap:6px 20px;margin-top:7px;color:var(--color-subtle,#54595d)}\n#revisawiki-ptwiki .ajg-tools>details{min-width:0;flex:1 1 250px;margin:0}\n#revisawiki-ptwiki .ajg-tools>details[open]{flex-basis:100%}\n#revisawiki-ptwiki .ajg-tools summary{font-size:13px}\n#revisawiki-ptwiki .ajg-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:5px 16px;margin:8px 0}\n#revisawiki-ptwiki .ajg-options label{min-height:24px;display:flex!important;align-items:flex-start;gap:5px;margin:0!important;color:var(--color-base,#202122);font-size:13px}\n#revisawiki-ptwiki .ajg-options input{flex:none;margin-top:3px}\n#revisawiki-ptwiki select{max-width:100%;margin-top:7px;padding:4px;background:var(--background-color-base,#fff);color:var(--color-base,#202122);border:1px solid var(--border-color-base,#a2a9b1);border-radius:3px}\n#revisawiki-ptwiki .ajg-report,#revisawiki-ptwiki .ajg-diff{max-height:420px;overflow:auto;scrollbar-gutter:stable;margin-top:8px}\n#revisawiki-ptwiki .ajg-diff:empty{display:none}\n#revisawiki-ptwiki .ajg-comparison-controls{position:sticky;top:0;z-index:1;background:var(--background-color-base,#fff);padding:6px 0;border-bottom:1px solid var(--border-color-subtle,#c8ccd1);margin-bottom:6px}\n#revisawiki-ptwiki .ajg-suggestions>details,#revisawiki-ptwiki .ajg-issue-group{margin-top:8px;padding:7px 9px;border:1px solid var(--border-color-subtle,#c8ccd1);border-radius:4px}\n#revisawiki-ptwiki .ajg-issues ul{padding-inline-start:20px}\n#revisawiki-ptwiki .ajg-issue{padding:4px 0}\n#revisawiki-ptwiki .ajg-issue button{min-height:27px;font-size:12px;padding:3px 7px;margin-top:3px}\n#revisawiki-ptwiki .ajg-diagnostic-text{width:100%;box-sizing:border-box;margin-top:8px;font:12px/1.4 monospace;resize:vertical}\n#revisawiki-ptwiki .ajg-disambig-choice{margin-top:6px}\n#revisawiki-ptwiki .ajg-disambig-choice select{display:block;width:100%}\n#revisawiki-ptwiki .ajg-individual-checks{margin-top:5px}\n#revisawiki-ptwiki .ajg-style-choices details{margin-top:8px}\n#revisawiki-ptwiki pre{color:var(--color-base,#202122);background:var(--background-color-neutral-subtle,#f8f9fa);border:1px solid var(--border-color-subtle,#c8ccd1);border-radius:3px;padding:8px;line-height:1.5;font-size:12px}\n#revisawiki-ptwiki .ajg-diagnostics p{margin:6px 0;font-size:13px}\n#revisawiki-ptwiki .ajg-stop,#revisawiki-ptwiki .ajg-cancel{color:var(--color-destructive,#b32424)}\n@media(max-width:600px){#revisawiki-ptwiki{padding:10px}#revisawiki-ptwiki .ajg-online-row{grid-template-columns:1fr;gap:4px;margin-bottom:12px}#revisawiki-ptwiki .ajg-online-row button{width:auto;justify-self:start}#revisawiki-ptwiki .ajg-options{grid-template-columns:1fr}#revisawiki-ptwiki .ajg-tools>details{flex-basis:100%}}'); style.id = 'revisawiki-panel-style';
        style.textContent += "\n#revisawiki-ptwiki .ajg-top{display:flex;align-items:center;flex-wrap:wrap;gap:8px 20px}\n#revisawiki-ptwiki .ajg-top .ajg-heading{margin:0}\n#revisawiki-ptwiki .ajg-intro{margin:4px 0 0;font-size:13px}\n#revisawiki-ptwiki .ajg-actions .ajg-run{font-weight:600}\n#revisawiki-ptwiki .ajg-run{background:var(--background-color-progressive,#36c);border-color:var(--border-color-progressive,#36c);color:var(--color-inverted,#fff)}\n#revisawiki-ptwiki .ajg-run:hover{background:var(--background-color-progressive--hover,#3056a9)}\n#revisawiki-ptwiki .ajg-result{display:flex;align-items:center;flex-wrap:wrap;gap:8px 20px;padding:10px 0;margin-top:10px;border-top:1px solid var(--border-color-subtle,#c8ccd1)}\n#revisawiki-ptwiki .ajg-result-copy{flex:1;min-width:160px}\n#revisawiki-ptwiki .ajg-result-title{font-size:14px}\n#revisawiki-ptwiki .ajg-result-count{display:block;color:var(--color-subtle,#54595d);font-size:13px}\n#revisawiki-ptwiki .ajg-result-actions{display:flex;flex-wrap:wrap;gap:6px}\n#revisawiki-ptwiki .ajg-report{max-height:none;overflow:visible;margin-top:0}\n#revisawiki-ptwiki .ajg-diff{max-height:420px;overflow:auto;margin:0}\n#revisawiki-ptwiki .ajg-comparison{border-top:1px solid var(--border-color-subtle,#c8ccd1);padding-top:5px}\n#revisawiki-ptwiki .ajg-change{border-top:1px solid var(--border-color-subtle,#c8ccd1);padding:8px 0}\n#revisawiki-ptwiki .ajg-change-explanation{margin:0 0 6px;font-weight:600;font-size:13px}\n#revisawiki-ptwiki .ajg-context{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:13px;line-height:1.55;margin:4px 0 8px;max-height:220px;overflow:auto}\n#revisawiki-ptwiki .ajg-context mark{color:inherit}\n#revisawiki-ptwiki .ajg-before mark{background:var(--background-color-error-subtle,rgba(221,51,51,.18))}\n#revisawiki-ptwiki .ajg-after mark{background:var(--background-color-success-subtle,rgba(0,175,80,.18))}\n#revisawiki-ptwiki .ajg-selection-help{display:none}\n#revisawiki-ptwiki .ajg-selecting .ajg-selection-help{display:block}\n#revisawiki-ptwiki .ajg-change label{font-size:13px;margin-bottom:6px}\n#revisawiki-ptwiki .ajg-change input{width:auto}\n#revisawiki-ptwiki .ajg-choice-item{display:flex;align-items:flex-start;flex-wrap:wrap;gap:4px 8px;margin:5px 0;font-size:13px}\n#revisawiki-ptwiki .ajg-choice-item input{width:auto;flex:none;margin:3px 0 0}\n#revisawiki-ptwiki .ajg-choice-item code{overflow-wrap:anywhere;white-space:pre-wrap;font-size:12px}\n#revisawiki-ptwiki .ajg-comparison-controls{position:static;padding:6px 0}\n#revisawiki-ptwiki .ajg-comparison-controls p{font-size:13px;margin:6px 0}\n#revisawiki-ptwiki .ajg-review-area{margin:8px 0;border-top:1px solid var(--border-color-subtle,#c8ccd1);padding-top:5px}\n#revisawiki-ptwiki .ajg-issue-group{border:0;border-radius:0;padding:2px 0;margin:4px 0}\n#revisawiki-ptwiki .ajg-review-history{margin-top:8px;color:var(--color-subtle,#54595d)}\n#revisawiki-ptwiki .ajg-suggestions>details{border:0;border-top:1px solid var(--border-color-subtle,#c8ccd1);border-radius:0;padding:6px 0}\n#revisawiki-ptwiki .ajg-automatic:empty{display:none}\n#revisawiki-ptwiki .ajg-automatic p{font-size:13px;margin:6px 0}\n#revisawiki-ptwiki .ajg-tools{border-top:1px solid var(--border-color-subtle,#c8ccd1);padding-top:5px;margin-top:8px;gap:6px 20px}\n#revisawiki-ptwiki .ajg-tools>details{flex:0 1 auto}\n#revisawiki-ptwiki .ajg-online{border:0;margin:3px 0;padding:0}\n#revisawiki-ptwiki .ajg-tools .ajg-settings,#revisawiki-ptwiki .ajg-tools .ajg-spelling-settings,#revisawiki-ptwiki .ajg-tools .ajg-diagnostics{margin-top:8px}\n#revisawiki-ptwiki .ajg-online-controls:empty{display:none}\n@media(max-width:600px){#revisawiki-ptwiki .ajg-top{gap:6px}#revisawiki-ptwiki .ajg-result{align-items:flex-start}#revisawiki-ptwiki .ajg-result-actions{width:100%}#revisawiki-ptwiki .ajg-diff{max-height:420px}}\n";
        style.textContent+='\n#revisawiki-ptwiki .ajg-bytes{display:inline-block;margin-top:4px;font-size:13px;font-weight:600;padding:2px 6px;border-radius:3px}#revisawiki-ptwiki .ajg-bytes-plus{color:var(--color-success,#14866d);background:var(--background-color-success-subtle,#e8f3ee)}#revisawiki-ptwiki .ajg-bytes-minus{color:var(--color-destructive,#b32424);background:var(--background-color-error-subtle,#fee7e6)}#revisawiki-ptwiki .ajg-bytes-neutral{color:var(--color-subtle,#54595d);background:var(--background-color-neutral-subtle,#f8f9fa)}#revisawiki-ptwiki .ajg-minor-status{display:block;font-size:12px;margin-top:3px;color:var(--color-subtle,#54595d)}';
        style.textContent += "\n#revisawiki-adjust-before-publish{display:inline-block;box-sizing:border-box;margin-inline-end:6px;min-height:32px;padding:6px 12px;border:1px solid #12776b;border-radius:2px;background:#12776b;color:#fff;font:inherit;font-weight:600;line-height:1.3;vertical-align:middle;white-space:nowrap;cursor:pointer}#revisawiki-adjust-before-publish:hover:not(:disabled){background:#0d5d54;border-color:#0d5d54}#revisawiki-adjust-before-publish:active:not(:disabled){background:#09463f;border-color:#09463f}#revisawiki-adjust-before-publish:focus-visible{outline:2px solid #36c;outline-offset:2px}#revisawiki-adjust-before-publish:disabled{background:#eaecf0;border-color:#c8ccd1;color:#72777d;cursor:default}\n";
        root.document.head.appendChild(style);
    }
    // O segundo atalho usa a mesma análise do painel e nunca envia o formulário.
    function mountPublishAdjustment(adapter) {
        const save = root.document.getElementById('wpSave');
        const form = root.document.getElementById('editform');
        if (stylesMode || !adapter || sourceTarget() || !form || !save || !form.contains(save)) {
            if (publishAdjustment) publishAdjustment.remove();
            publishAdjustment = null;
            return;
        }
        // O botão nativo pode estar dentro de um widget OOUI. Preserve esse widget.
        const widget = save.closest('#wpSaveWidget,.oo-ui-buttonElement');
        const anchor = widget && form.contains(widget) ? widget : save;
        if (!anchor.parentNode) return;
        if (!publishAdjustment || !publishAdjustment.isConnected) {
            if (publishAdjustment) publishAdjustment.remove();
            publishAdjustment = button('Ajustar código', () => run(false), 'ajg-save-adjust');
            publishAdjustment.id = 'revisawiki-adjust-before-publish';
            publishAdjustment.title = 'Aplicar os ajustes do RevisaWiki ao rascunho. Confira o resultado no painel antes de publicar.';
            publishAdjustment.setAttribute('aria-label', 'Ajustar código com RevisaWiki');
            publishAdjustment.setAttribute('aria-controls', 'revisawiki-ptwiki');
        }
        if (save.tabIndex > 0) publishAdjustment.tabIndex = save.tabIndex;
        else publishAdjustment.removeAttribute('tabindex');
        if (anchor.previousElementSibling !== publishAdjustment)
            anchor.parentNode.insertBefore(publishAdjustment, anchor);
        publishAdjustment.disabled = localBusy || onlineBusy;
    }

    function mount() {
        if (stylesMode) return mountStyles();
        const adapter = editor();
        if (localTask && (!adapter || localTask.adapterId !== adapter.id)) cancelLocalAnalysis();
        mountPublishAdjustment(adapter);
        if (!adapter) { if (panel) panel.remove(); panelEditor = null; last = null; comparisonPlan = null; return; }
        if (panel && panel.isConnected && panelEditor === adapter.id) return;
        if (panel) panel.remove();
        if (panelEditor !== adapter.id) { last = null; comparisonPlan = null; ignoredSuggestions.clear(); spellingIgnored = []; spellingIgnoredRules.clear(); spellingFilter = 'all'; spellingIgnoredSource = null; issueStore.clear(); queryCache.clear(); cacheBytes = 0; linkProgress = null; }
        panelEditor = adapter.id;
        installPanelStyle();
        panel = node('div'); panel.id = 'revisawiki-ptwiki';
        panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'RevisaWiki, ferramentas de revisão');
        const heading = node('div', undefined, 'ajg-heading');
        heading.append(node('strong', 'RevisaWiki'), node('span', 'PTwiki ' + VERSION, 'ajg-version'));
        const namespace=Number(mw.config.get('wgNamespaceNumber'));
        const introText=namespace>0&&namespace%2===1?'Confere o código da discussão. Conversas assinadas são preservadas.':
            namespace===10&&!/\/(?:doc|documentação)(?:\/|$)/i.test(currentTitle())?'Ajusta parâmetros e código da predefinição. Preserva referências e variáveis de uso.':
            'Ajusta código e grafias selecionadas. Confira o resultado antes de salvar.';
        const intro = node('p',introText,'ajg-intro');
        const actions = node('div', undefined, 'ajg-actions');
        function control(text, action, classes, hint, id) {
            const item = button(text, action, classes); item.title = hint;
            if (id) item.dataset.action = id;
            return item;
        }
        const back = control('Desfazer ajustes', undo, 'ajg-undo', 'Restaurar o texto anterior aos ajustes do RevisaWiki, se você ainda não tiver feito outras alterações.', 'undo'); back.disabled = !last;
        const stop = control('Cancelar análise', cancelLocalAnalysis, 'ajg-stop', 'Interromper a análise local antes de aplicar os ajustes.', 'stop'); stop.hidden = true;
        actions.append(control('Ajustar código', () => run(false), 'mw-ui-progressive ajg-run', 'Aplicar ajustes de código e grafias selecionadas ao texto aberto, sem publicar.', 'adjust'));
        const top = node('div', undefined, 'ajg-top'); top.append(heading, actions);
        const resultSummary = node('div', undefined, 'ajg-result'); resultSummary.hidden = true;
        const resultCopy = node('div', undefined, 'ajg-result-copy');
        resultCopy.append(node('strong', '', 'ajg-result-title'), node('span', '', 'ajg-result-count'),node('span','','ajg-bytes'),node('span','','ajg-minor-status'));resultCopy.querySelector('.ajg-bytes').hidden=true;resultCopy.querySelector('.ajg-minor-status').hidden=true;
        const resultActions = node('div', undefined, 'ajg-result-actions');
        const changesControl = control('Ver o que mudou', showAppliedChanges, 'ajg-show-changes', 'Abrir ou recolher a comparação antes e depois.', 'changes');
        changesControl.setAttribute('aria-expanded', 'false'); changesControl.setAttribute('aria-controls', 'revisawiki-comparison');
        resultActions.append(changesControl, back); resultSummary.append(resultCopy, resultActions);
        const status = node('div', 'Pronto para revisar o código-fonte.', 'ajg-status');
        status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
        const online = node('details', undefined, 'ajg-online');
        online.append(node('summary', 'Mais ferramentas'), node('p', 'Estas conferências deixam o texto como está.', 'ajg-online-intro'));
        online.append(control('Conferir outras grafias',runSpelling,'ajg-spelling','Conferir possíveis repetições e escolher correções adicionais. Não altera o texto automaticamente.','spelling'));
        online.append(control('Conferir tudo', checkAll, 'ajg-check-all', 'Conferir código, tabelas, datas, pré-visualização, destinos e edições recentes, sem alterar o texto.', 'check-all'));
        online.append(control('Ver ajustes antes de aplicar', () => run(true), 'ajg-compare', 'Comparar ajustes propostos sem mudar o texto.', 'compare'));
        function onlineRow(text, action, classes, explanation) {
            const row = node('div', undefined, 'ajg-online-row');
            const item = control(text, action, classes, explanation);
            const help = node('p', explanation); help.id = 'revisawiki-help-' + classes.slice(4);
            item.setAttribute('aria-describedby', help.id); row.append(item, help); online.append(row);
        }
        onlineRow('Conferir destinos', checkLinks, 'ajg-check', 'Confira ligações internas, categorias, imagens e predefinições, incluindo páginas inexistentes e desambiguações.');
        onlineRow('Conferir pré-visualização', checkPreview, 'ajg-preview', 'Procure avisos de referências e predefinições na pré-visualização do texto atual, sem publicar.');
        onlineRow('Ver se a página mudou', checkRevision, 'ajg-revision', 'Veja se alguém editou a página depois que você abriu o editor. Se houver outra edição, abra a comparação antes de salvar.');
        const onlineControls = node('div', undefined, 'ajg-online-controls');
        const cancel = control('Cancelar conferência', cancelCheck, 'ajg-cancel', 'Interromper a consulta em andamento.'); cancel.hidden = true;
        const resume = control('Continuar conferência', checkLinks, 'ajg-resume', 'Retomar os destinos restantes enquanto o texto e a revisão forem os mesmos.'); resume.hidden = true;
        onlineControls.append(cancel, resume); online.append(onlineControls);
        const tools = node('div', undefined, 'ajg-tools');
        const settings = node('details'); settings.append(node('summary', 'Configurações'), settingsPanel(), spellingSettingsPanel(), diagnosticsPanel());
        tools.append(online, settings);
        const report = node('div', undefined, 'ajg-report'); report.hidden = true;
        const diffs = node('div', undefined, 'ajg-diff'); diffs.id = 'revisawiki-comparison';
        panel.append(top, intro, status, stop, onlineControls, resultSummary, diffs, report, tools);
        renderSpellingPreferences();
        const classic = root.document.querySelector('#wikiEditor-ui-toolbar, #wpTextbox1');
        const sourceVE = root.document.querySelector('.ve-init-mw-desktopArticleTarget .ve-ui-surface, .ve-ui-surface');
        const anchor = sourceVE || classic;
        if (anchor?.parentNode) anchor.parentNode.insertBefore(panel, anchor);
        else (root.document.querySelector('#mw-content-text') || root.document.body).prepend(panel);
        const loadInfo = root.RevisaWikiLoadInfo || root.AjusteGeralPTLoadInfo;
        if (loadInfo?.expectedVersion && loadInfo.expectedVersion !== VERSION)
            message('Versão ' + VERSION + ' carregada, mas o carregador pediu ' + loadInfo.expectedVersion + '. Abra Sobre e diagnóstico.');
        mountPublishAdjustment(adapter);
        busy(onlineBusy, activeCheck);
        const openedPanel = panel;
        const changed = () => { if (panel === openedPanel){onMinorDraftChange();renderIssues();updateAppliedResult();} };
        root.document.getElementById('wpTextbox1')?.addEventListener('input', changed);
        if (sourceTarget()) { const model = sourceTarget().getSurface().getModel(); if (typeof model.on === 'function') model.on('change', changed); }
    }

    mw.loader.using(['jquery.textSelection', 'mediawiki.util', 'mediawiki.api', 'mediawiki.ForeignApi']).then(function () {
        $ = root.jQuery;
        if (!$ || !$.fn.textSelection) throw new Error('O módulo de edição não ficou disponível.');
        $(mount);
        mw.hook('wikipage.content').add(mount);
        mw.hook('ve.activationComplete').add(mount);
        mw.hook('ve.wikitextInteractive').add(mount);
        mw.hook('ve.deactivationComplete').add(function () {
            if (localTask) cancelLocalAnalysis();
            if (publishAdjustment) publishAdjustment.remove(); publishAdjustment = null;
            if (panel) panel.remove(); panelEditor = null; last = null;
        });
        const connectedTargets = new WeakSet();
        function connectTarget(target) {
            if (!target || typeof target.on !== 'function' || connectedTargets.has(target)) return;
            connectedTargets.add(target);
            target.on('surfaceReady', mount);
        }
        mw.hook('ve.newTarget').add(connectTarget);
        connectTarget(root.ve && root.ve.init && root.ve.init.target);
        // Abrir o editor pode inserir a área de texto depois de jQuery.ready.
        let scheduled = false;
        const selector = '#wpTextbox1, #wpSave, #wpSaveWidget, #wikiEditor-ui-toolbar, .ve-ui-surface, .cm-editor';
        const observer = new root.MutationObserver(records => {
            const relevant = records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
                node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector))));
            if (!relevant || scheduled) return;
            scheduled = true;
            root.requestAnimationFrame(() => { scheduled = false; mount(); });
        });
        $(function () { observer.observe(root.document.body, {childList: true, subtree: true}); });
        api.uiStatus = 'ready';
    }).catch(function (error) {
        api.uiStatus = 'error';
        root.console.error('RevisaWiki: falha ao iniciar.', error);
        const text = 'RevisaWiki não conseguiu carregar os módulos de edição. Recarregue a página.';
        if (typeof mw.notify === 'function') mw.notify(text, {type: 'error', autoHide: false});
    });
}(typeof window === 'undefined' ? globalThis : window));
        if (root.RevisaWiki) root.RevisaWiki.catalogLoad = {version:VERSION,origin,sha256:EXPECTED_HASH};
        if (root.RevisaWikiLoadInfo) root.RevisaWikiLoadInfo.state = 'loaded';
    }
    if (typeof module === 'object' && module.exports) {
        const data = require('./RevisaWiki_v2_4_dados.js');
        const hash = require('node:crypto').createHash('sha256').update(canonical(data.packed)).digest('hex');
        if (!validShape(data) || hash !== EXPECTED_HASH) throw new Error('Pacote de dados incompatível com RevisaWiki '+VERSION+'.');
        start(data,'local'); return;
    }
    if (!root.mw?.loader || (root.location?.hostname || root.mw.config?.get('wgServerName')) !== 'pt.wikipedia.org') return;
    root.RevisaWikiModuleReady = true;
    async function load() {
        if (root.RevisaWiki || root.RevisaWikiModuleLoading) return;
        root.RevisaWikiModuleLoading = true;
        try {
            let data = root.RevisaWikiDataV2, origin = 'preloaded';
            if (!await verified(data)) {
                data = null;
                try {
                    const cached = root.localStorage.getItem(CACHE_KEY);
                    if (cached && cached.length <= MAX_BYTES) {
                        const candidate = JSON.parse(cached);
                        if (await verified(candidate)) { data = candidate; origin = 'cache'; }
                    }
                } catch (_) { /* A página continua funcionando sem armazenamento local. */ }
            }
            if (!data) {
                const config = root.RevisaWikiConfig || {}, title = config.dataPage || 'Usuário:Daniel G Rego/RevisaWiki/Dados.js';
                const revision = Number.isInteger(config.dataRevision) && config.dataRevision > 0 ? '&oldid='+config.dataRevision : '';
                await root.mw.loader.getScript('/w/index.php?title='+encodeURIComponent(title)+revision+'&action=raw&ctype=text/javascript');
                const candidate = root.RevisaWikiDataV2;
                if (!await verified(candidate)) throw new Error('O pacote de dados não corresponde à versão '+VERSION+'.');
                data = candidate; origin = 'wiki';
                try {
                    const cached = JSON.stringify(data);
                    if (cached.length <= MAX_BYTES) root.localStorage.setItem(CACHE_KEY,cached);
                } catch (_) { /* O catálogo validado também pode ser usado só nesta aba. */ }
            }
            start(data,origin);
        } catch(error) {
            root.RevisaWikiModuleError = error.message;
            root.mw.notify('RevisaWiki não carregou: '+error.message+' Confira se o núcleo e Dados.js são da versão '+VERSION+'.',
                {type:'error',autoHide:false});
        } finally { root.RevisaWikiModuleLoading = false; }
    }
    const action = root.mw.config?.get('wgAction');
    if (['edit','submit'].includes(action) || root.document?.getElementById('wpTextbox1')) root.RevisaWikiModulePromise=load();
    // The kernel mounts only in source mode and observes later mode switches.
    // Loading it on editor activation also covers visual -> source transitions.
    root.mw.hook('ve.activationComplete').add(()=>{root.RevisaWikiModulePromise=load();});
    root.mw.hook('ve.wikitextInteractive').add(()=>{root.RevisaWikiModulePromise=load();});
    root.mw.hook('wikipage.content').add(()=>{
        if(root.document?.getElementById('wpTextbox1'))root.RevisaWikiModulePromise=load();
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);

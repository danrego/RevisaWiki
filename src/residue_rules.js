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

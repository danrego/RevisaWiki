    // Bounded article repairs. Every edit is tied to the exact draft and owner.
    // Unknown consumers, literal examples and competing interpretations stay intact.
    const V220_STRUCTURE_TYPO_TEMPLATES=Object.freeze({'referências;':'Referências','portal 3':'Portal3'});
    const V220_STRUCTURE_COLORS=new Set(['black','silver','gray','white','maroon','red','purple','fuchsia','green','lime','olive','yellow','navy','blue','teal','aqua','orange']);
    const V220_STRUCTURE_NAVBOX_CONTRACTS=Object.freeze({'movimento antinuclear':Object.freeze({kind:'native-navbox-block',renderOldid:73261889,invalidWrapperOldid:73261887})});
    function v220StructureScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&cfg.namespaceNumber===0&&(cfg.contentModel===undefined||cfg.contentModel==='wikitext')&&cfg.markup!==false&&cfg.structuralRepairs!==false&&cfg.v220StructureRepairs!==false&&!cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&!/~{3,5}/.test(source)&&!discussionProtectionRanges(source,{discussionPage:true}).length;
    }
    function v220StructureContext(source,{prose=false,references=false,tables=false,html=false}={}) {
        const shield=v24SyntaxProtected(source),view=shield.view,ranges=[...shield.ranges,...v219MarkdownLiteralRanges(source),...v219QuotedTemplateRanges(source)];
        const parsed=templates(view),nodes=parsed.nodes;
        ranges.push(...parsed.unclosed.map(n=>({start:n.start,end:source.length,kind:'unclosed-template'})));
        if(prose)ranges.push(...nodes,...editorialWikiLinkRanges(view),...structuralQuoteRanges(view));
        else ranges.push(...nodes);
        if(references)ranges.push(...refTokens(view),...rendererRanges(view));
        if(tables)ranges.push(...v272LiteralTables(source).tables);
        if(html)ranges.push(...structuralContainerRanges(view));
        if(prose)ranges.push(...proseRanges(view));
        return {shield,view,nodes,ranges,blocked:(start,end=start+1,own=false)=>ranges.some(r=>r.start<end&&r.end>start&&!(own&&r.start===start&&r.end===end))};
    }
    function v220StructureEdit(source,start,end,text,ruleId,condition,owner={}) {
        return {start,end,text,ruleId,proof:{sourceHash:v24SyntaxHash(source),condition,...owner}};
    }
    function v220StructureStandalone(source,start,end) {
        const begin=source.lastIndexOf('\n',start-1)+1,next=source.indexOf('\n',end),finish=next<0?source.length:next;
        return !source.slice(begin,start).trim()&&!source.slice(end,finish).trim()?{start:begin,end:next<0?finish:finish+1}:null;
    }
    function v220LeadingBlankEdits(source,cfg={}) {
        if(cfg.automaticProseGaps===false||!(/^(?:[ \t]*\r?\n)/.test(source)||/^\{\{\s*(?:descri[çc][ãa]o[ _]+curta|short[ _]*description)\b/i.test(source)))return [];
        const out=[],context=v220StructureContext(source),prefix=/^(?:[ \t]*\r?\n)+/.exec(source);
        if(prefix&&v219WholeQuotedCodeRanges(source).length)return [];
        if(prefix&&!context.blocked(0,prefix[0].length)&&!/^\s*<(?:nowiki|pre|syntaxhighlight|source|code|math)\b/i.test(source.slice(prefix[0].length)))out.push(v220StructureEdit(source,0,prefix[0].length,'','v220LeadingBlank','absolute article prefix contains only empty physical lines; content indentation is retained'));
        // Remove only the separator that the already enabled description rule
        // would expose at offset zero. The description itself is left to it.
        if(cfg.shortDescriptions!==false){
            const first=prefix?prefix[0].length:0,n=context.nodes.find(n=>n.start===first),raw=n&&source.slice(n.start,n.end),p=raw&&parsedTemplate(raw);
            if(p&&['descrição curta','descricao curta','short description','shortdescription'].includes(p.name)&&!context.blocked(n.start,n.end,true)){
                const tail=source.slice(n.end),gap=/^[ \t]*\r?\n((?:[ \t]*\r?\n)+)/.exec(tail);
                if(gap){const start=n.end+gap[0].length-gap[1].length;out.push(v220StructureEdit(source,start,start+gap[1].length,'','v220DescriptionLeadingGap','standalone initial description is already scheduled for removal; only following empty lines are removed',{description:raw}));}
            }
        }
        return out;
    }
    function v220StructureGaps(source,cfg={}) {
        if(cfg.automaticProseGaps===false||!/\n(?:[ \t]*\r?\n){2,}/.test(source))return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[],nodes=c.nodes.filter(n=>!c.nodes.some(p=>p!==n&&p.start<n.start&&p.end>=n.end)),refs=refTokens(c.view),tables=v272LiteralTables(source).tables;
        const heading=s=>/^={2,6}[^=\r\n]+={2,6}[ \t]*$/.test(s),plain=s=>!!s.trim()&&!/^[ \t*#:;|!{}<>\[\]_=\-]/.test(s)&&/[\p{L}\p{N}]/u.test(s)&&!/[{}]/.test(s);
        const collector=s=>{try{return v219NativeReflistIdentity(s).recognized===true||['referências','referencias','notas e referências'].includes(parsedTemplate(s).name);}catch(_){return false;}};
        for(const m of source.matchAll(/\n(?:[ \t]*\r?\n){2,}/g)){
            const start=m.index,end=start+m[0].length;if(c.ranges.some(r=>r.start<end&&r.end>start&&!tables.some(t=>t.start===r.start&&t.end===r.end&&t.end===start+1)))continue;
            const leftStart=source.lastIndexOf('\n',start-1)+1,rightEnd=source.indexOf('\n',end),left=source.slice(leftStart,start).replace(/\r$/,''),right=source.slice(end,rightEnd<0?source.length:rightEnd).replace(/\r$/,'');
            let residue=left;const inline=[];
            for(const r of refs.filter(r=>r.start>=leftStart&&r.end<=start&&r.body!==null&&/<\/ref[ \t]*>$/i.test(r.raw)))inline.push({start:r.start-leftStart,end:r.end-leftStart,text:''});
            for(const n of nodes.filter(n=>n.start>=leftStart&&n.end<=start)){
                const p=parsedTemplate(source.slice(n.start,n.end));if(['carece de fontes','carece de fontes2','cn','sem fontes-inline'].includes(p.name))inline.push({start:n.start-leftStart,end:n.end-leftStart,text:''});
            }
            const disjoint=inline.sort((a,b)=>a.start-b.start).filter((r,i,a)=>!a.some((p,j)=>j<i&&p.end>r.start));
            if(disjoint.length)residue=v24SyntaxApply(residue,disjoint);
            const beforeTable=tables.some(t=>t.end===start+1||t.end===start),leftCollector=nodes.some(n=>n.end===(source[start-1]==='\r'?start-1:start)&&source.slice(leftStart,n.start).trim()===''&&collector(source.slice(n.start,n.end)));
            const nextNode=nodes.find(n=>n.start===end),nextFooter=nextNode&&['portal','authority','navbox','project','stub','sort'].includes(footerRole(source.slice(nextNode.start,nextNode.end),cfg.footerProfiles||{}));
            const leftList=/^\*(?!\*)\s*\S/.test(left),rightFooter=nextFooter||/^\[\[Categoria\s*:/i.test(right);
            let rightResidue=right;const rightParts=[];for(const r of refs.filter(r=>r.start>=end&&r.end<=(rightEnd<0?source.length:rightEnd)&&r.body!==null&&/<\/ref[ \t]*>$/i.test(r.raw)))rightParts.push({start:r.start-end,end:r.end-end,text:''});
            for(const r of c.shield.ranges.filter(r=>r.kind==='math'&&r.start>=end&&r.end<=(rightEnd<0?source.length:rightEnd)))rightParts.push({start:r.start-end,end:r.end-end,text:''});
            if(rightParts.length&&!rightParts.some((r,i,a)=>a.some((p,j)=>j<i&&p.end>r.start)))rightResidue=v24SyntaxApply(rightResidue,rightParts.sort((a,b)=>a.start-b.start));
            const qualifies=(plain(residue)||heading(residue)||beforeTable||leftCollector)&&(plain(rightResidue)||heading(rightResidue))||leftList&&(rightFooter||heading(rightResidue));
            if(!qualifies)continue;const eol=source.slice(start-1,start+1)==='\r\n'?'\r\n':'\n';
            edits.push(v220StructureEdit(source,eol==='\r\n'?start-1:start,end,eol+eol,'v220ProseBoundaryGaps','empty physical lines at proved complete prose, table, collector or final-list boundary; all owner bytes retained',{leftKind:beforeTable?'table':leftCollector?'collector':leftList?'list':disjoint.length?'inline-citation':'prose'}));
        }
        return edits;
    }
    function v220FinalEmptyItems(source,cfg={}) {
        if(cfg.endMatter===false||!/^\*[ \t]*(?:\r?\n|$)/m.test(source))return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[];
        for(const m of source.matchAll(/(?:^|\n)(\*[ \t]*(?:\r?\n|$)(?:[ \t]*\r?\n|\*[ \t]*(?:\r?\n|$))*)/g)){
            const start=m.index+(m[0][0]==='\n'?1:0),end=start+m[1].length;if(c.blocked(start,end))continue;
            const before=source.slice(0,start),last=/([^\r\n]+)\s*$/.exec(before)?.[1]||'',tail=source.slice(end),n=c.nodes.find(n=>n.start===end);
            const footer=n&&footerRole(source.slice(n.start,n.end),cfg.footerProfiles||{}),safeTail=!tail.trim()||/^={2,6}\s*(?:Referências|Bibliografia|Leitura|Ligações externas)/i.test(tail)||/^\[\[Categoria:/i.test(tail)||['portal','authority','navbox','project','stub','sort','boundary'].includes(footer);
            if(!/^\*(?!\*)\s*\S/.test(last)||!safeTail)continue;
            edits.push(v220StructureEdit(source,start,end,'','v220FinalEmptyListItems','empty single-level terminal list items have no descendants and precede only a known final boundary'));
        }
        return edits;
    }
    function v220BibliographyColumns(source,cfg={}) {
        if(cfg.endMatter===false||cfg.endMatterColumns===false||!/^==[ \t]*Bibliografia complementar[ \t]*==/im.test(source))return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[];
        for(const m of source.matchAll(/^==[ \t]*Bibliografia complementar[ \t]*==[ \t]*\r?$/gmi)){
            if(c.blocked(m.index,m.index+m[0].length))continue;let start=m.index+m[0].length;if(source[start]==='\n')start++;
            const after=source.slice(start),next=/^={2,6}/m.exec(after),end=next?start+next.index:source.length,body=source.slice(start,end);
            if(/\{\{\s*(?:Colunas|Div col|InícioRef|InicioRef)|<\/?(?:div|table)\b/i.test(body))continue;
            const match=/^(?:[ \t]*\r?\n)*(\*[^\r\n]+(?:\r?\n(?:\*[^\r\n]+|[ \t]*))*)/.exec(body);if(!match)continue;
            const content=match[1].replace(/(?:\r?\n[ \t]*)+$/,''),lines=content.split(/\r?\n/);if(lines.filter(l=>/^\*(?!\*)\s*\S/.test(l)).length<6||lines.some(l=>l.trim()&&!/^\*(?!\*)\s*\S/.test(l)))continue;
            const from=start+match[0].indexOf(match[1]),to=from+content.length,eol=source.includes('\r\n')?'\r\n':'\n',call='{{Colunas-lista|2|2='+eol+content+eol+'}}';
            if(parsedTemplate(call).parts.length!==3||templates(call).unclosed.length)continue;
            edits.push(v220StructureEdit(source,from,to,call,'v220BibliographyColumns','exact final bibliography role; at least six complete one-line entries; no existing layout or top-level pipe',{items:lines.filter(l=>l.trim()).length}));
        }
        return edits;
    }
    function v220InlineMarkdown(source,cfg={}) {
        if(cfg.translationResidues===false||!(/\*\*|(?<!\*)\*\p{Lu}[\p{Ll}\p{M}]+[ \t]+\p{Lu}[\p{Ll}\p{M}]+\*(?!\*)/u.test(source)))return [];
        const c=v220StructureContext(source,{prose:true,references:true,tables:true,html:true}),edits=[];
        // Double pairs within ordinary prose are not list markers. Restrict to
        // words, with neither operators nor literal Markdown discussion.
        if(/\b(?:Markdown|CommonMark|asteriscos?|sintaxe\s+de\s+marca[çc][ãa]o)\b/iu.test(source.slice(0,1500)))return [];
        for(const m of source.matchAll(/(?<!\*)\*\*([^*\r\n]{2,150})\*\*(?!\*)/gu)){
            if(c.blocked(m.index,m.index+m[0].length)||/^[ \t]*$/.test(m[1])||m[1]!==m[1].trim()||/[{}<>\[\]|=+\\]/.test(m[1])||!/[\p{L}]/u.test(m[1]))continue;
            const lineStart=source.lastIndexOf('\n',m.index-1)+1,prefix=source.slice(lineStart,m.index),words=prefix.match(/\p{L}+/gu)||[],natural=words.length>=2&&words.some(word=>word.length>=3)||/^[ \t]*[*#][ \t]+$/.test(prefix)&&m[1].trim().split(/\s+/).length>=2;
            const after=source[m.index+m[0].length];if(!natural||/[=+\\{}<>]/.test(prefix)||!/[ \t]$/.test(prefix)||after&&!/[\s.,;:!?()]/.test(after))continue;
            edits.push(v220StructureEdit(source,m.index,m.index+m[0].length,"'''"+m[1]+"'''",'v220InlineMarkdown','balanced inline emphasis in ordinary nontechnical prose; no list-prefix or literal owner'));
        }
        // A finite title-shaped phrase has two or more ordinary title-case
        // words. Single letters, arithmetic and generic asterisk notation stay.
        for(const m of source.matchAll(/(?<!\*)\*((?:\p{Lu}[\p{Ll}\p{M}]+[ \t]+){1,3}\p{Lu}[\p{Ll}\p{M}]+)\*(?!\*)/gu)){
            if(c.blocked(m.index,m.index+m[0].length))continue;
            const lineStart=source.lastIndexOf('\n',m.index-1)+1,prefix=source.slice(lineStart,m.index);if(!prefix.trim()||/^\s*[*#]{2}/.test(prefix)||/[=+\\{}<>]/.test(prefix))continue;
            edits.push(v220StructureEdit(source,m.index,m.index+m[0].length,"''"+m[1]+"''",'v220InlineMarkdown','balanced existing inline emphasis around a multiword title-shaped phrase; no list, arithmetic, quote or literal owner'));
        }
        return edits;
    }
    function v220ExternalSyntax(source,cfg={}) {
        if(cfg.links===false||!(/\[https?:\/\/[^\]\n]*\||\[https?:\/\/[^\]\n]*\r?\n|\[hhttps:\/\//.test(source)))return [];
        const c=v220StructureContext(source,{html:true}),edits=[],allNodes=templates(c.view).nodes;
        const blocked=(start,end)=>c.blocked(start,end)||allNodes.some(n=>n.start<start&&n.end>end);
        for(const m of source.matchAll(/\[(https?:\/\/[^\s\[\]{}<>|?#]+\.(?:pdf|html?|aspx?))\|([\p{L}\p{N}][^\[\]{}<>|\r\n]{2,250})\]/giu)){
            if(blocked(m.index,m.index+m[0].length)||!/[\p{L}]+\s+[\p{L}]/u.test(m[2])||/[?=&%\\]/.test(m[2]))continue;
            const at=m.index+1+m[1].length;edits.push(v220StructureEdit(source,at,at+1,' ','v220ExternalPipeDelimiter','literal document URL without query or fragment; one pipe followed by a natural-language label'));
        }
        for(const m of source.matchAll(/\[(https?:\/\/[^\s\[\]{}<>]+)\r?\n([^\r\n\[\]{}<>]+)\]/g)){
            if(blocked(m.index,m.index+m[0].length)||!m[2].trim()||!/[\p{L}]/u.test(m[2])||/^\s*[*#;|!=]/.test(m[2]))continue;
            const at=m.index+1+m[1].length;edits.push(v220StructureEdit(source,at,at+(source.slice(at,at+2)==='\r\n'?2:1),' ','v220ExternalNewlineLabel','complete bracketed external link; one physical break separates complete URL and literal label'));
        }
        for(const m of source.matchAll(/\[hhttps:\/\/[^\s\[\]{}<>]+(?:[ \t]+[^\]\r\n]+)?\]/g)){
            if(blocked(m.index,m.index+m[0].length))continue;edits.push(v220StructureEdit(source,m.index+1,m.index+2,'','v220ExternalProtocolTypo','exact invalid hhttps prefix in a complete external-link owner'));
        }
        return edits;
    }
    function v220TemplateTypos(source,cfg={}) {
        if(cfg.auxiliaryTemplates===false||!/{{\s*(?:refer[êe]ncias;|portal[ _]3)\s*[|}]/i.test(source))return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[];
        for(const n of c.nodes){
            if(c.nodes.some(p=>p!==n&&p.start<n.start&&p.end>=n.end)||c.blocked(n.start,n.end,true))continue;
            const raw=source.slice(n.start,n.end),p=parsedTemplate(raw),to=V220_STRUCTURE_TYPO_TEMPLATES[p.name];if(!to||p.name==='referências;'&&p.parts.length!==1||!v220StructureStandalone(source,n.start,n.end))continue;
            const title=/^\{\{([\s\S]*?)(?=\||}})/.exec(raw);if(!title)continue;
            edits.push(v220StructureEdit(source,n.start+2,n.start+2+title[1].length,to,'v220TemplateNameTypo','finite missing native title and unique existing native consumer; standalone literal call preserves all arguments',{nativeOldid:p.name==='referências;'?63785697:undefined,nativeMissingTitle:p.name==='portal 3'?'Predefinição:Portal 3':undefined}));
        }
        return edits;
    }
    function v220UniqueWikiLinkCloser(source,cfg={}) {
        if(cfg.links===false||!/\[\[[^\[\]\r\n]+\](?!\])/.test(source))return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[];
        for(const m of source.matchAll(/\[\[([^\[\]{}<>|\r\n]{2,120})\](?!\])/g)){
            if(c.blocked(m.index,m.index+m[0].length)||m[1]!==m[1].trim()||/[=:]/.test(m[1]))continue;
            const lineStart=source.lastIndexOf('\n',m.index-1)+1,lineEnd=source.indexOf('\n',m.index+m[0].length),line=source.slice(lineStart,lineEnd<0?source.length:lineEnd);
            const open=[];let valid=true;for(const token of line.matchAll(/\[\[|\]\]/g)){if(token[0]==='[[')open.push(token.index);else if(open.length)open.pop();else{valid=false;break;}}
            if(!valid||open.length!==1||open[0]!==m.index-lineStart||!/[\p{L}]/u.test(m[1]))continue;
            const at=m.index+m[0].length;if(at<source.length&&!/[\s.,;:!?)–—]/.test(source[at]))continue;
            edits.push(v220StructureEdit(source,at,at,']','v220UniqueWikiLinkCloser','one opening and one single closing bracket on a complete prose line; unique literal destination and endpoint'));
        }
        return edits;
    }
    function v220FiniteSpelling(source,cfg={}) {
        if(cfg.automaticSpelling===false||!/(?:espectativas|estreiou)/.test(source))return [];
        const c=v220StructureContext(source,{prose:true,references:true,tables:true,html:true}),edits=[],map={espectativas:'expectativas',estreiou:'estreou'};
        for(const m of source.matchAll(/(?<![\p{L}\p{N}_])(?:espectativas|estreiou)(?![\p{L}\p{N}_])/gu))if(!c.blocked(m.index,m.index+m[0].length))edits.push(v220StructureEdit(source,m.index,m.index+m[0].length,map[m[0]],'v220FiniteSpelling','finite lowercase Portuguese typo outside names, links, quotations, sources, formulas and literal examples'));
        return edits;
    }
    function v220TableQuotes(source,cfg={}) {
        if(cfg.tableChecks===false||cfg.automaticTableRepairs===false||!/\bscope\s*=\s*[“”]/i.test(source))return [];
        const c=v220StructureContext(source),edits=[];
        for(const table of v272LiteralTables(source).tables){
            if(table.nested||!table.attrs.valid||c.blocked(table.start,table.start+2)||!table.attrs.attrs.some(a=>a.key==='class'&&/\bwikitable\b/.test(a.value||'')))continue;
            const raw=source.slice(table.openEnd,table.closeStart),locals=[];
            for(const m of raw.matchAll(/\b(scope)[ \t]*=[ \t]*[“”]((?:col|row)(?:group)?)[“”](?=[ \t]*[|!])/gi)){
                const at=table.openEnd+m.index,line=source.slice(source.lastIndexOf('\n',at-1)+1,at);if(!/^[ \t]*[!|][^\r\n]*$/.test(line)||/[{}<>]/.test(line)||c.ranges.some(r=>r.start<at+m[0].length&&r.end>at&&!(r.kind==='quotation'&&r.start>=at&&r.end<=at+m[0].length)))continue;
                locals.push(v220StructureEdit(source,at,at+m[0].length,m[1]+'="'+m[2]+'"','v220TableAttributeQuotes','finite scope attribute with complete typographic delimiters and explicit cell separator',{tableStart:table.start}));
            }
            if(!locals.length)continue;const next=v24SyntaxApply(source,locals),candidate=v272LiteralTables(next).tables.find(t=>t.start===table.start);if(candidate&&v29TableModel(next,candidate))edits.push(...locals);
        }

        if(!edits.length){
            const literal=tableSyntaxView(source),openings=[];
            for(const token of literal.view.matchAll(/^[ \t]*(\{\||\|})([^\r\n]*)/gm)){
                if(token[1]==='{|')openings.push({start:token.index,raw:source.slice(token.index,token.index+token[0].length)});else if(openings.length)openings.pop();
            }
            for(const table of openings){
                if(!/^\s*\{\|[ \t]+class=["']wikitable["'][ \t]*$/.test(table.raw)||c.nodes.some(n=>n.start<table.start&&n.end>table.start))continue;
                const tail=source.slice(table.start);
                for(const m of tail.matchAll(/^([ \t]*[!|][ \t]*scope[ \t]*=[ \t]*)[“”]((?:col|row)(?:group)?)[“”]([ \t]*\|[^\r\n{}<>]*)$/gmi)){
                    const at=table.start+m.index;if(c.shield.ranges.some(r=>r.start<at+m[0].length&&r.end>at&&r.kind!=='quotation'))continue;
                    edits.push(v220StructureEdit(source,at+m[1].length,at+m[1].length+m[2].length+2,'"'+m[2]+'"','v220TableAttributeQuotes','complete finite scope attribute inside a literal unfinished wikitable; no table boundary or data is inferred',{tableStart:table.start,localOnly:true}));
                }
            }
        }
        return edits;
    }
    function v220FosteredTableLabel(source,cfg={}) {
        if(cfg.tableChecks===false||cfg.automaticTableRepairs===false||!/^;[^\r\n]+/m.test(source))return [];
        const c=v220StructureContext(source),edits=[];
        for(const table of v272LiteralTables(source).tables){
            if(table.nested||!table.attrs.valid||c.blocked(table.start,table.start+2)||!table.attrs.attrs.some(a=>a.key==='class'&&/\bwikitable\b/.test(a.value||'')))continue;
            const m=/^;([^\r\n{}<>|]+)(\r?\n)/.exec(source.slice(table.openEnd,table.closeStart));if(!m||table.start&&!/\n[ \t]*\n$/.test(source.slice(0,table.start)))continue;
            const label=';'+m[1]+m[2],before=source.slice(table.start,table.openEnd),after=source.slice(table.openEnd+m[0].length,table.closeStart);
            if(!/^(?:\|-|!)/.test(after))continue;
            edits.push(v220StructureEdit(source,table.start,table.openEnd+m[0].length,label+before,'v220TableIntroLabel','one definition-term label fostered before the first literal table row; move intact to the same preceding position'));
        }
        return edits;
    }
    function v220LegacyTableAttributes(source,cfg={}) {
        if(cfg.tableChecks===false||cfg.automaticTableRepairs===false||cfg.automaticLegacyMarkup===false||!/^\s*[|!][^\r\n]*\b(?:align|valign|width|bgcolor)\s*=/im.test(source))return [];
        const edits=[];
        for(const table of v29TableStaticBounds(source)){
            const model=v29TableModel(source,table);if(!model)continue;
            for(const owner of model.attributes){
                if(!['row','cell'].includes(owner.kind))continue;
                const attrs=owner.entries,styles=attrs.filter(a=>a.key==='style');if(styles.length!==1)continue;
                const style=styles[0].value||'';if(/[{}<>]|\/\*|!important|url\s*\(|expression\s*\(/i.test(style))continue;
                const declarations=new Map();let valid=true;
                for(const part of style.split(';').filter(p=>p.trim())){const m=/^\s*([a-z-]+)\s*:\s*([^;]+)\s*$/i.exec(part);if(!m||declarations.has(m[1].toLowerCase())){valid=false;break;}declarations.set(m[1].toLowerCase(),m[2].trim());}if(!valid)continue;
                for(const attr of attrs){let property,value;
                    if(attr.key==='align'&&/^(?:left|center|right|justify)$/i.test(attr.value||'')){property='text-align';value=attr.value.toLowerCase();}
                    else if(owner.kind==='cell'&&attr.key==='valign'&&/^(?:top|middle|bottom|baseline)$/i.test(attr.value||'')){property='vertical-align';value=attr.value.toLowerCase();}
                    else if(owner.kind==='cell'&&attr.key==='width'&&/^(?:[1-9]\d{0,3}|(?:100|[1-9]?\d)%)$/.test(attr.value||'')){property='width';value=/%$/.test(attr.value)?attr.value:attr.value+'px';}
                    else if(attr.key==='bgcolor'&&(/^(?:#[0-9a-f]{3}|#[0-9a-f]{6})$/i.test(attr.value||'')||V220_STRUCTURE_COLORS.has((attr.value||'').toLowerCase()))){property='background-color';value=attr.value.toLowerCase();}
                    else continue;
                    // Never promote a presentational hint to inline priority.
                    // An equal valid inline declaration already dominates it,
                    // including in the presence of stylesheet rules or blocks.
                    if(!declarations.has(property)||declarations.get(property).toLowerCase()!==value.toLowerCase())continue;
                    edits.push(v220StructureEdit(source,attr.start,attr.end,'','v220LegacyTableAttributes','finite valid inline CSS already dominates this exact-equal presentational hint; only the redundant attribute is removed; CSS priority is unchanged'));
                }
            }
        }
        return edits;
    }
    function v220CellFormattingClosure(source,cfg={}) {
        if(cfg.tableChecks===false||cfg.automaticTableRepairs===false||!/^\s*[|!][^\r\n]*<(?:small|b|i)>/m.test(source))return [];
        const c=v220StructureContext(source),edits=[];
        for(const table of v29TableStaticBounds(source)){
            const model=v29TableModel(source,table);if(!model)continue;
            for(const cell of model.cells){const body=cell.content,m=/^([ \t]*)<(small|b|i)>([^<>\r\n{}]+)$/.exec(body);if(!m||c.blocked(cell.start,cell.end)||new RegExp('</'+m[2]+'\\s*>','i').test(source.slice(cell.end)))continue;
                const at=cell.end;if(!/^(?:\r?\n|$)/.test(source.slice(at)))continue;
                edits.push(v220StructureEdit(source,at,at,'</'+m[2]+'>','v220CellFormattingClosure','one attribute-free inline formatting tag starts wholly inside one literal cell; no later competing closer; physical cell endpoint is unique',{tableStart:table.start,tag:m[2]}));
            }
        }
        return edits;
    }
    function v220CoordinateDuplicates(source,cfg={}) {
        if(cfg.auxiliaryTemplates===false||(source.match(/\{\{\s*coord\s*[|}]/gi)||[]).length<2)return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),calls=[];
        for(const n of c.nodes){if(c.nodes.some(p=>p!==n&&p.start<n.start&&p.end>=n.end)||c.blocked(n.start,n.end,true))continue;
            const raw=source.slice(n.start,n.end),p=parsedTemplate(raw);if(p.name!=='coord'||/[{}<>\[\]]/.test(raw.slice(2,-2)))continue;
            const entries=foreignEntries(p),map=new Map();let valid=true,positional=0;for(const e of entries){const k=e.positional?String(++positional):norm(e.key);if(map.has(k)){valid=false;break;}map.set(k,e.value.trim());}if(!valid||map.get('display')!=='title'||!v220StructureStandalone(source,n.start,n.end))continue;
            const positions=[...map].filter(([k])=>/^\d+$/.test(k)).sort((a,b)=>+a[0]-+b[0]);if(![4,6,8].includes(positions.length)||positions.some(([k,v])=>!/^\d+(?:\.\d+)?$|^[NSEWO]$/i.test(v)))continue;calls.push({n,raw,map,positions});
        }
        const edits=[];
        for(let i=0;i<calls.length;i++)for(let j=i+1;j<calls.length;j++){
            const a=calls[i],b=calls[j];if(JSON.stringify(a.positions)!==JSON.stringify(b.positions)||edits.some(e=>e.start<=a.n.start&&e.end>=a.n.end))continue;
            if([...a.map].some(([k,v])=>v&&b.map.get(k)!==v))continue;
            const span=v220StructureStandalone(source,a.n.start,a.n.end);edits.push(v220StructureEdit(source,span.start,span.end,'','v220DuplicateCoordinateTitle','same literal coordinates and title-only display; later call retains every nonempty parameter of earlier call'));
        }
        return edits;
    }
    function v220MaintenanceDuplicates(source,cfg={}) {
        if(cfg.maintenance===false||(source.match(/\{\{\s*Evento atual\s*[|}]/gi)||[]).length<2)return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),calls=c.nodes.filter(n=>!c.nodes.some(p=>p!==n&&p.start<n.start&&p.end>=n.end)&&!c.blocked(n.start,n.end,true)).map(n=>({n,p:parsedTemplate(source.slice(n.start,n.end))})).filter(r=>r.p.name==='evento atual');
        const specific=calls.filter(r=>{const e=foreignEntries(r.p);return e.length===1&&norm(e[0].key)==='tema'&&/^[\p{L} -]+$/u.test(e[0].value.trim());});if(specific.length!==1)return [];
        return calls.filter(r=>r.p.parts.length===1&&v220StructureStandalone(source,r.n.start,r.n.end)).map(r=>{const s=v220StructureStandalone(source,r.n.start,r.n.end);return v220StructureEdit(source,s.start,s.end,'','v220DuplicateMaintenance','bare generic current-event notice is redundant with one literal theme-specific call; specific parameters retained');});
    }
    function v220LiteralNavboxIndirection(source,cfg={}) {
        if(cfg.auxiliaryTemplates===false||!/^\{\{\{\{[\p{L}\p{N} _-]+\}\}\}\}/mu.test(source))return [];
        const c=v220StructureContext(source,{references:true,tables:true,html:true}),edits=[];
        for(const m of source.matchAll(/^\{\{\{\{([\p{L}\p{N} _-]+)\}\}\}\}[ \t]*$/gmu)){
            const name=norm(m[1]),contract=V220_STRUCTURE_NAVBOX_CONTRACTS[name];if(!contract||c.nodes.some(n=>n.start<m.index&&n.end>=m.index+m[0].length)||c.shield.ranges.some(r=>r.start<m.index+m[0].length&&r.end>m.index)||v219MarkdownLiteralRanges(source).some(r=>r.start<m.index+m[0].length&&r.end>m.index))continue;
            const after=source.slice(m.index+m[0].length);if(!/^(?:\s*\[\[Categoria:[^\]\n]+\]\])*(?:\s*)$/i.test(after))continue;
            edits.push(v220StructureEdit(source,m.index,m.index+m[0].length,'{{'+m[1]+'}}','v220LiteralNavboxIndirection','finite native block-producing navbox; isolated final call; published native pair proves literal invalid wrapper',{contract}));
        }
        return edits;
    }
    function v220StructurePlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[],steps:[],proofVersion:'2.20-structure-1'};
        if(!v220StructureScope(source,cfg))return {...plan,disabled:true};
        const stages=[['leading',v220LeadingBlankEdits],['table-quotes',v220TableQuotes],['table-label',v220FosteredTableLabel],['table-formatting',v220CellFormattingClosure],['table-attributes',v220LegacyTableAttributes],['external-links',v220ExternalSyntax],['template-typos',v220TemplateTypos],['wikilink-closer',v220UniqueWikiLinkCloser],['spelling',v220FiniteSpelling],['markdown',v220InlineMarkdown],['coordinates',v220CoordinateDuplicates],['maintenance',v220MaintenanceDuplicates],['navbox-indirection',v220LiteralNavboxIndirection],['empty-list-items',v220FinalEmptyItems],['gaps',v220StructureGaps],['bibliography-columns',v220BibliographyColumns]];
        for(const [name,find]of stages){const before=plan.text,edits=find(before,cfg).sort((a,b)=>a.start-b.start||a.end-b.end);if(!edits.length)continue;
            if(edits.some((e,i)=>e.proof.sourceHash!==v24SyntaxHash(before)||i&&edits[i-1].end>e.start))continue;
            const after=v24SyntaxApply(before,edits);if(after===before)continue;plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;
        }
        return plan;
    }
    function v220StructureProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v220StructurePlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    // The native per-kind validators see a boundary-trimmed validation copy.
    // The emitted key edits and their recomputed proofs keep the original value.
    function v218CitationKeyValue(field,rule) {
        if(v220LegacyCitationKeyValue(field,rule))return true;
        if(typeof field?.value!=='string'||field.value.length>4096||
            !Object.hasOwn(V218_LEGACY_CITATION_KEYS,field.key)||
            V218_LEGACY_CITATION_KEYS[field.key]!==rule||!/[\r\n]/.test(field.value))return false;
        const value=field.value.trim();
        return !!value&&!/[\r\n]/.test(value)&&v220LegacyCitationKeyValue({...field,value},rule);
    }
    function v220CitationYearKeyValue(field) {
        if(typeof field?.value!=='string')return false;
        if(!/[{}\[\]<>|\r\n\uE000]/.test(field.value))return true;
        if(field.value.length>4096||!/[\r\n]/.test(field.value))return false;
        const value=field.value.trim();
        return !!value&&!/[{}\[\]<>|\r\n\uE000]/.test(value);
    }
    function v220CitationKeyOwner(source,view,node,literals) {
        if(!node||literals.some(r=>r.start<=node.start&&r.end>=node.end))return false;
        const context=v24SyntaxContext(view,node.start),prefix=source.slice(0,node.start);
        if(context.templates.length||context.links.length||context.external.length||
            context.html.length>1||context.html.some(t=>t.name!=='ref')||
            prefix.lastIndexOf('<')>prefix.lastIndexOf('>'))return false;
        if(context.html.length){
            const tag=context.html[0],attrs=v24SyntaxAttrs(tag.attrs);
            if(!v24SyntaxLiteralIdentity(attrs)||!refTokens(view).some(r=>r.start===tag.start&&
                r.body!==null&&r.end>=node.end&&/<\/ref[ \t]*>$/i.test(r.raw)))return false;
        }
        if(context.tables.length){
            if(context.tables.length!==1)return false;
            const table=v272LiteralTables(source).tables.find(t=>t.start===context.tables[0]&&
                !t.nested&&t.attrs.valid&&t.openEnd<=node.start&&t.closeStart>=node.end);
            if(!table)return false;
            const model=v29TableModel(source,table);if(!model)return false;
            let cellOwner=false;
            for(let rowIndex=0;rowIndex<model.rows.length;rowIndex++){
                const row=model.rows[rowIndex];
                for(let index=0;index<row.cells.length;index++){
                    const cell=row.cells[index],start=cell.attrsEnd===null?cell.start:cell.attrsEnd+1,
                        end=row.cells[index+1]?.start??model.rows[rowIndex+1]?.start??table.closeStart;
                    if(start<=node.start&&node.end<=end)cellOwner=true;
                }
            }
            if(!cellOwner)return false;
        }
        return true;
    }
    function v218CitationKeyEdits(source,options={}) {
        const edits=v220LegacyCitationKeyEdits(source,options);if(!edits.length)return edits;
        const view=protectedView(source),nodes=templates(view).nodes,
            literals=[...v24SyntaxProtected(source).ranges,...v219MarkdownLiteralRanges(source),
                ...v219QuotedTemplateRanges(source),...v219WholeQuotedCodeRanges(source),...structuralQuoteRanges(source)];
        return edits.filter(edit=>{
            const node=nodes.filter(n=>n.start<=edit.start&&n.end>=edit.end)
                .sort((a,b)=>(a.end-a.start)-(b.end-b.start))[0];
            return v220CitationKeyOwner(source,view,node,literals);
        });
    }

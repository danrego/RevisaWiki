    // Source-bound structural repairs. Literal examples and competing owners stay unchanged.
    const V221_STRUCTURE_TEXT_FIELDS=Object.freeze({
        'info/biografia':['nome','nome_completo','ocupação','alma_mater'],
        'info/cientista':['nome','campo','alma_mater'],
        'info/escritor':['nome','ocupação','alma_mater'],
        'info/ator':['nome','ocupação'],
        'info/empresa':['nome','indústria'],
        'info/organização':['nome','propósito']
    });
    const V221_STRUCTURE_HEADINGS=new Set(['leia na wikipedia','leia na wikipédia',
        'leia mais na wikipedia','leia mais na wikipédia','ver mais','veja mais']);
    function v221StructureEdit(source,start,end,text,ruleId,condition,owner={}) {
        return v220StructureEdit(source,start,end,text,ruleId,condition,owner);
    }
    function v221StructureContext(source) {
        const c=v220StructureContext(source),wiki=editorialWikiLinkRanges(c.view),
            tables=v272LiteralTables(source).tables;
        return {...c,wiki,tables};
    }
    function v221StructureOwned(c,start,end,{ref=false,wiki=false,table=false}={}) {
        if(c.blocked(start,end)||!wiki&&c.wiki.some(r=>r.start<start&&r.end>end)||
            !table&&c.tables.some(r=>r.start<end&&r.end>start))return false;
        const state=v24SyntaxContext(c.view,start);
        if(state.templates.length||!wiki&&state.links.length||state.external.length||!table&&state.tables.length)return false;
        return state.html.every(t=>ref&&t.name==='ref');
    }
    function v221StructureAnchorDependency(source,title) {
        const key=s=>String(s).normalize('NFC').replace(/_/g,' ').trim().toLowerCase(),wanted=key(title);
        for(const m of source.matchAll(/#([^\r\n\]|<>"}]+)/g)){
            for(const raw of [m[1].trim(),m[1].trim().split(/\s/)[0]]){
                let value=raw;
                try{value=decodeURIComponent(value.replace(/(?:\.[0-9a-f]{2})+/gi,run=>run.replace(/\./g,'%')));}catch(_){return true;}
                if(key(value)===wanted)return true;
            }
        }
        return false;
    }
    function v221StructureDisplayOwner(view,start,{table=false}={}) {
        const state=v24SyntaxContext(view,start);
        return !state.templates.length&&!state.links.length&&!state.external.length&&
            (table||!state.tables.length)&&!state.html.some(n=>['ref','references'].includes(n.name));
    }
    function v221StructureHttp(value) {
        if(typeof value!=='string'||!/^https?:\/\/[^\s\[\]{}<>|"'\\]+$/.test(value))return false;
        try{const u=new URL(value);return !!u.hostname&&!u.username&&!u.password&&u.hostname.includes('.');}catch(_){return false;}
    }
    function v221LinkEmphasisBoundarySafe(source,start,end,delimiter) {
        if(typeof source!=='string'||!Number.isInteger(start)||!Number.isInteger(end)||
            start<0||end>source.length||end<=start||!/^'{2,3}$/.test(delimiter))return false;
        if(source[start-1]==="'"||source[end]==="'")return false;
        const boundary=source.lastIndexOf('\n\n',start-1),begin=boundary<0?0:boundary+2,next=source.indexOf('\n\n',end),
            finish=next<0?source.length:next,before=source.slice(Math.max(0,begin),start),after=source.slice(end,finish);
        // A surrounding emphasis run may change how the moved delimiter pairs.
        if(/'{2,}/.test(before)||/'{2,}/.test(after))return false;
        const c=v221StructureContext(source);
        return !c.shield.ranges.some(r=>r.start<end&&r.end>start&&r.kind!=='quotation-markup')&&
            !v219MarkdownLiteralRanges(source).some(r=>r.start<end&&r.end>start)&&
            !c.nodes.some(r=>r.start<start&&r.end>end);
    }
    function v221StructureLinks(source,cfg={}) {
        if(cfg.links===false||!(/\[\[https?:\/\/|&#124;|\[https?:\/\/[^\r\n]*\]\]/.test(source)))return [];
        const c=v221StructureContext(source),edits=[];
        for(const m of source.matchAll(/\[\[(https?:\/\/[^\s\[\]{}<>|]+)([ \t]+[^\[\]{}<>|\r\n]+)?\]\]/g)){
            if(!v221StructureHttp(m[1])||!v221StructureOwned(c,m.index,m.index+m[0].length,{ref:true})||
                source[m.index-1]==='['||source[m.index+m[0].length]===']')continue;
            edits.push(v221StructureEdit(source,m.index,m.index+m[0].length,'['+m[1]+(m[2]||'')+']',
                'v221ExternalDoubleBrackets','STR-01: complete external URL with a simple literal label and a single owner'));
        }
        for(const m of source.matchAll(/\[(https?:\/\/[^\s\[\]{}<>|]+)([ \t]+[^\[\]{}<>|\r\n]+)?\]\](?!\])/g)){
            if(source[m.index-1]==='['||!v221StructureHttp(m[1])||
                !v221StructureOwned(c,m.index,m.index+m[0].length,{ref:true}))continue;
            edits.push(v221StructureEdit(source,m.index+m[0].length-1,m.index+m[0].length,'',
                'v221ExternalExtraCloser','STR-02: one surplus closing bracket outside a complete external-link owner'));
        }
        for(const m of source.matchAll(/\[\[([^\[\]{}<>|\r\n&]+)&#124;([^\[\]{}<>|\r\n&]+)\]\]/g)){
            if(!m[1].trim()||!m[2].trim()||m[1]!==m[1].trim()||/:/.test(m[1])||
                !v221StructureOwned(c,m.index,m.index+m[0].length,{ref:true}))continue;
            const at=m.index+2+m[1].length;
            edits.push(v221StructureEdit(source,at,at+6,'|','v221WikiEntitySeparator',
                'STR-03: one entity separates a complete literal mainspace target from its label'));
        }
        return edits;
    }
    function v221StructureUrlValue(value) {
        const m=/^(\s*)(http\/\/|https\/\/|htps:\/\/|https:[ \t]+\/\/)([^\s]+)(\s*)$/.exec(value);
        if(!m)return null;
        const protocol=m[2]==='http//'?'http://':'https://',url=protocol+m[3];
        return v221StructureHttp(url)?m[1]+url+m[4]:null;
    }
    function v221StructureUrls(source,cfg={}) {
        if(cfg.links===false||!/(?:https?\/\/|htps:\/\/|https:[ \t]+\/\/)/.test(source))return [];
        const c=v221StructureContext(source),edits=[];
        for(const m of source.matchAll(/\[(http\/\/|https\/\/|htps:\/\/|https:[ \t]+\/\/)([^\s\[\]{}<>|]+)([ \t]+[^\[\]{}<>|\r\n]+)?\]/g)){
            if(source[m.index-1]==='['||!v221StructureOwned(c,m.index,m.index+m[0].length,{ref:true}))continue;
            const fixed=v221StructureUrlValue(m[1]+m[2]);if(!fixed)continue;
            edits.push(v221StructureEdit(source,m.index+1,m.index+1+m[1].length+m[2].length,fixed,
                'v221UrlProtocol','GEN-02: finite protocol typo in a complete external URL; host, path, query and fragment retained'));
        }
        for(const node of c.nodes){
            if(c.ranges.some(r=>r!==node&&r.start<=node.start&&r.end>=node.end))continue;
            const owner=v24SyntaxContext(c.view,node.start);
            if(owner.links.length||owner.external.length)continue;
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),fields=v220BioLiteralFields(raw);
            if(!fields)continue;
            const citation=cfg.citations!==false&&cfg.references!==false&&/^citar (?:web|jornal|periódico|revista|livro)$/.test(p.name),
                box=cfg.infoboxes===false?null:v220BioNodes(source).find(b=>b.node.start===node.start),
                site=box?.contract?.website||[];
            for(const f of fields){
                const roles=citation?v219NativeCitationRoles(f.key):[],urlField=roles.some(role=>['URL','ArchiveURL'].includes(role)||role==='ChapterURL'&&p.name==='citar livro');
                if(f.positional||!(citation&&urlField||box&&site.includes(f.key)))continue;
                const fixed=v221StructureUrlValue(f.value);if(!fixed)continue;
                edits.push(v221StructureEdit(source,node.start+f.start,node.start+f.end,fixed,
                    'v221UrlProtocol','GEN-02: confirmed native URL field with one finite protocol typo; full address suffix retained',{field:f.key,nativeTitle:box?.profile?.title||p.parts[0]}));
            }
        }
        return edits;
    }
    function v221StructureAuthority(source,cfg={}) {
        if(cfg.endMatter===false||cfg.authorityControl===false||(source.match(/\{\{[Cc]ontrole de autoridade[ \t]*\}\}/g)||[]).length<2)return [];
        const c=v221StructureContext(source),calls=c.nodes.filter(n=>n.depth===0&&
            /^\{\{[Cc]ontrole de autoridade[ \t]*\}\}$/.test(source.slice(n.start,n.end))&&
            v220StructureStandalone(source,n.start,n.end)&&!c.blocked(n.start,n.end,true));
        if(calls.length<2)return [];
        const footer=footerTokens(source,cfg.footerProfiles||{}).tokens,eligible=calls.filter(n=>footer.some(f=>f.start===n.start&&f.end===n.end));
        if(eligible.length<2)return [];
        return eligible.slice(1).map(n=>{const line=v220StructureStandalone(source,n.start,n.end);
            return v221StructureEdit(source,line.start,line.end,'','v221AuthorityDuplicate',
                'GEN-01: repeated bare native authority call in the same complete footer; one exact call retained');});
    }
    function v221StructurePlainLine(line) {
        return !!line.trim()&&!/^[ \t*#:;|!{}<>\[\]_=-]/.test(line)&&
            /[\p{L}\p{N}]/u.test(line)&&!/[{}<>]/.test(line);
    }
    function v221StructureGaps(source,cfg={}) {
        if(cfg.automaticProseGaps===false||!/(?:&nbsp;|&#160;|&#x[aA]0;|\u00a0)|<!--|'''''<small>/.test(source))return [];
        const c=v221StructureContext(source),edits=[],eol=source.includes('\r\n')?'\r\n':'\n';
        for(const m of source.matchAll(/\r?\n(?:[ \t]*\r?\n)*[ \t]*(?:(?:&nbsp;|&#160;|&#x[aA]0;|\u00a0)[ \t]*)+\r?\n(?:[ \t]*\r?\n)*/g)){
            const start=m.index,end=start+m[0].length,left=source.slice(source.lastIndexOf('\n',start-1)+1,start).replace(/\r$/,''),
                right=source.slice(end,source.indexOf('\n',end)<0?source.length:source.indexOf('\n',end)).replace(/\r$/,'');
            if(/(?:^|\n)[ \t]+(?=(?:&nbsp;|&#160;|&#x[aA]0;|\u00a0))/.test(m[0])||!v221StructurePlainLine(left)||!v221StructurePlainLine(right)||
                !v221StructureOwned(c,start,end))continue;
            edits.push(v221StructureEdit(source,start,end,eol+eol,'v221NbspParagraph',
                'STR-04: isolated NBSP-only physical paragraph between ordinary prose; units and all owner bytes untouched'));
        }
        for(const comment of c.shield.ranges.filter(r=>r.kind==='comment')){
            const left=/\r?\n(?:[ \t]*\r?\n){2,}[ \t]*$/.exec(source.slice(0,comment.start)),
                right=/^[ \t]*\r?\n(?:[ \t]*\r?\n){2,}/.exec(source.slice(comment.end));
            if(!left||!right)continue;
            const start=comment.start-left[0].length,end=comment.end+right[0].length,
                a=source.slice(source.lastIndexOf('\n',start-1)+1,start).replace(/\r$/,''),
                b=source.slice(end,source.indexOf('\n',end)<0?source.length:source.indexOf('\n',end)).replace(/\r$/,'');
            if(!v221StructurePlainLine(a)||!v221StructurePlainLine(b)||
                c.ranges.some(r=>r.start<end&&r.end>start&&r!==comment&&!(r.kind==='comment'&&r.start===comment.start&&r.end===comment.end))||
                !v221StructureOwned(c,start,start+1))continue;
            edits.push(v221StructureEdit(source,start,end,eol+source.slice(comment.start,comment.end)+eol+eol,
                'v221CommentParagraphGap','STR-05: complete invisible comment retains exact bytes; native two-paragraph boundary replaces empty paragraphs'));
        }
        for(const n of c.nodes.filter(n=>n.depth===0)){
            if(footerRole(source.slice(n.start,n.end),cfg.footerProfiles||{})!=='navbox')continue;
            const m=/('''''<small>[^<>\r\n]*<\/small>''''')([ \t\r\n]+)$/.exec(source.slice(0,n.start));
            if(!m||!/(?:\r?\n[ \t]*){3}/.test(m[2])||m[1].includes('<!--'))continue;
            const at=n.start-m[2].length,noteStart=at-m[1].length;
            if(source.slice(source.lastIndexOf('\n',noteStart-1)+1,noteStart).trim()||
                v24SyntaxContext(c.view,noteStart).html.length||c.nodes.some(p=>p.start<noteStart&&p.end>n.end)||
                !v220StructureStandalone(source,n.start,n.end)||
                c.tables.some(t=>t.start<n.start&&t.end>noteStart)||
                c.shield.ranges.some(r=>r.start<n.start&&r.end>noteStart&&r.kind!=='quotation-markup'&&r.kind!=='preformatted'))continue;
            edits.push(v221StructureEdit(source,at,n.start,eol+eol,'v221FormattedFooterGap',
                'STR-AD-02: complete standalone formatted note and confirmed native navbox; only their whitespace gap changes'));
        }
        return edits;
    }
    function v221StructureEmptyMarkup(source,cfg={}) {
        if(!/^\*[ \t]*\r?\n|<small[ \t]*><\/small[ \t]*>|<\/br\s*>|<br[ \t]*\/[ \t]*\/[ \t]*>|<br\/[ \t]+>/im.test(source))return [];
        const c=v221StructureContext(source),edits=[];
        if(cfg.endMatter!==false)for(const m of source.matchAll(/^\*[ \t]*\r?\n/gm)){
            const at=m.index,before=source.slice(source.lastIndexOf('\n',at-2)+1,at).trimEnd(),
                after=source.slice(at+m[0].length).split(/\r?\n/)[0];
            if(!/^\*(?![*#:;])\s*\S/.test(before)||!/^\*(?![*#:;])\s*\S/.test(after)||
                !v221StructureOwned(c,at,at+m[0].length))continue;
            edits.push(v221StructureEdit(source,at,at+m[0].length,'','v221EmptyMiddleBullet',
                'STR-06: empty first-level unordered item between filled peers, without descendants'));
        }
        for(const m of source.matchAll(/<small[ \t]*><\/small[ \t]*>/gi)){
            const at=m.index,end=at+m[0].length,before=source[at-1],after=source[end];
            if(!before||!after||/[\r\n<>]/.test(before+after)||
                !v221StructureOwned(c,at,end)||!v221StructurePlainLine(source.slice(source.lastIndexOf('\n',at-1)+1,at)))continue;
            edits.push(v221StructureEdit(source,at,end,'','v221EmptyInlineSmall',
                'STR-08: empty attribute-free inline small between ordinary prose; adjacent spaces preserved'));
        }
        for(const b of cfg.infoboxes===false||cfg.automaticFieldSyntax===false?[]:v220BioNodes(source)){
            const keys=V221_STRUCTURE_TEXT_FIELDS[b.p.name];if(!keys)continue;
            const owner=v24SyntaxContext(c.view,b.node.start);
            if(owner.html.length||owner.tables.length||owner.links.length||owner.external.length)continue;
            for(const f of b.fields){
                if(!keys.includes(f.key)||b.profile.accepted?.length&&!b.profile.accepted.includes(f.key))continue;
                const valueContext=v220StructureContext(f.value,{references:true}),valueLinks=editorialWikiLinkRanges(valueContext.view);
                for(const m of f.value.matchAll(/<\/br\s*>|<br[ \t]*\/[ \t]*\/[ \t]*>|<br\/[ \t]+>/gi)){
                    const at=b.node.start+f.start+m.index,local=v24SyntaxProtected(f.value),
                        literal=local.ranges.filter(r=>!['quotation-markup'].includes(r.kind)),prefix=f.value.slice(0,m.index),
                        state=v24SyntaxContext(valueContext.view,m.index);
                    if(literal.some(r=>r.start<m.index+m[0].length&&r.end>m.index)||
                        valueContext.nodes.some(n=>n.start<m.index+m[0].length&&n.end>m.index)||
                        valueLinks.some(n=>n.start<m.index+m[0].length&&n.end>m.index)||
                        state.templates.length||state.links.length||state.external.length||state.tables.length||
                        state.html.some(n=>['ref','references'].includes(n.name))||
                        prefix.lastIndexOf('<')>prefix.lastIndexOf('>'))continue;
                    edits.push(v221StructureEdit(source,at,at+m[0].length,'<br />','v221InfoboxBreak',
                        'STR-07: equivalent attribute-free native break inside a confirmed displayed text field',
                        {nativeTitle:b.profile.title,nativeOldid:b.profile.oldid,field:f.key}));
                }
            }
        }
        return edits;
    }
    function v221StructureHeadings(source,cfg={}) {
        if(cfg.headings===false||cfg.sections===false||cfg.endMatter===false||!/^={2,6}[ \t]*(?:Leia|Ver|Veja|Refer[êe]ncias)/im.test(source))return [];
        const c=v221StructureContext(source),edits=[],headings=[...source.matchAll(/^(={2,6})[ \t]*([^=\r\n]+?)[ \t]*\1[ \t]*\r?$/gm)],
            label=m=>norm(m[2].replace(/\[\[([^\[\]{}|]+)\|([^\[\]{}|]+)\]\]/g,'$2').replace(/\[\[([^\[\]{}|]+)\]\]/g,'$1').replace(/'{2,}/g,'').replace(/&nbsp;|&#160;|&#xA0;/gi,' ')),
            aliases=headings.filter(m=>V221_STRUCTURE_HEADINGS.has(norm(m[2])));
        for(const [i,m] of headings.entries()){
            if(!V221_STRUCTURE_HEADINGS.has(norm(m[2]))||aliases.length!==1||!v221StructureOwned(c,m.index,m.index+m[0].length)||
                headings.some(x=>label(x)==='ver também'||/[{}<>]/.test(x[2])))continue;
            const start=m.index+m[0].length,end=headings[i+1]?.index??source.length,body=source.slice(start,end),
                lines=body.split(/\r?\n/).filter(l=>l.trim());
            if(!lines.length||lines.some(l=>!/^\*[ \t]+\[\[([^\[\]{}<>|:#\r\n]+(?:#[^\[\]{}<>|:\r\n]+)?)(?:\|[^\[\]{}<>|\r\n]+)?\]\][ \t]*$/.test(l)))continue;
            if(v221StructureAnchorDependency(source,m[2])||
                /\{\{\s*(?:âncora|ancora|anchor)\b/i.test(body))continue;
            const labelAt=m.index+m[0].indexOf(m[2]);
            edits.push(v221StructureEdit(source,labelAt,labelAt+m[2].length,'Ver também','v221RelatedSectionHeading',
                'STR-AD-01: unique finite heading at levels two to six whose entire body is a mainspace-related list; no competing section or anchor dependency'));
        }
        if(cfg.references!==false)for(const m of source.matchAll(/^==[ \t]*Refer[êe]ncias[ \t]*==[ \t]*\r?\n((?:[ \t]*\r?\n|[ \t]*\[\[Categoria:[^\[\]{}<>\r\n]+\]\][ \t]*\r?\n)+)(\{\{[^\r\n]*\}\})/gmi)){
            const collector=m[2],p=parsedTemplate(collector),alias=v219NativeReferenceCollectorAlias(p.parts[0]);
            if(!alias||p.parts.length!==1||!v221StructureOwned(c,m.index,m.index+m[0].indexOf(m[1]))||
                /#Refer(?:ê|e|\.C3\.AA|%C3%AA)ncias(?:_2| 2)?\b/i.test(source)||
                c.nodes.some(n=>n.start<m.index&&n.end>m.index))continue;
            const at=m.index,header=m[0].indexOf('\n')+1;
            edits.push(v221StructureEdit(source,at,at+header,'','v221CategoryReferenceHeading',
                'STR-11: exact native heading-emitting collector separated only by whitespace and literal categories; no heading overrides or anchor dependants',
                {nativeTitle:'Referências',nativeOldid:alias.targetOldid}));
        }
        return edits;
    }
    function v221StructureColumns(source,cfg={}) {
        if(cfg.endMatter===false||cfg.endMatterColumns===false||!/^==[ \t]*(?:Bibliografia adicional|Leituras complementares)[ \t]*==/im.test(source))return [];
        const c=v221StructureContext(source),edits=[];
        for(const m of source.matchAll(/^==[ \t]*(Bibliografia adicional|Leituras complementares)[ \t]*==[ \t]*\r?$/gmi)){
            if(!v221StructureOwned(c,m.index,m.index+m[0].length))continue;
            let start=m.index+m[0].length;if(source[start]==='\n')start++;
            const tail=source.slice(start),next=/^={2,6}/m.exec(tail),end=next?start+next.index:source.length,body=source.slice(start,end);
            if(/\{\{\s*(?:Colunas|Div col|InícioRef|InicioRef)|<\/?(?:div|table)\b/i.test(body))continue;
            const list=/^(?:[ \t]*\r?\n)*(\*[^\r\n]+(?:\r?\n(?:\*[^\r\n]+|[ \t]*))*)/.exec(body);if(!list)continue;
            const content=list[1].replace(/(?:\r?\n[ \t]*)+$/,''),lines=content.split(/\r?\n/);
            if(lines.filter(l=>l.trim()).length<6||lines.some(l=>l.trim()&&!/^\*(?![*#:;])\s*\S/.test(l)))continue;
            const from=start+list[0].indexOf(list[1]),to=from+content.length,eol=source.includes('\r\n')?'\r\n':'\n',
                call='{{Colunas-lista|2|2='+eol+content+eol+'}}';
            if(parsedTemplate(call).parts.length!==3||templates(call).unclosed.length)continue;
            const residue=body.slice(list[0].length).trim(),footer=footerTokens(source,cfg.footerProfiles||{}),restStart=start+list[0].length;
            if(residue&&(end!==source.length||footer.start<restStart||source.slice(restStart,footer.start).trim()||footer.tokens.some(t=>!t.role)))continue;
            edits.push(v221StructureEdit(source,from,to,call,'v221CompatibleBibliographyColumns',
                'STR-COMP-01: valid final bibliography heading retained byte-for-byte; at least six simple entries, no custom layout or ambiguous pipe',
                {items:lines.filter(l=>l.trim()).length}));
        }
        return edits;
    }
    function v221StructureRefPeriod(source,cfg={}) {
        if(cfg.references===false||cfg.automaticReferenceRepairs===false||!/[.]<ref\b/i.test(source))return [];
        const c=v221StructureContext(source),refs=refTokens(c.view),edits=[];
        for(let i=0;i<refs.length;i++){
            const first=refs[i];if(source[first.start-1]!=='.'||source[first.start-2]==='.')continue;
            let last=first,j=i;
            while(refs[j+1]?.start===last.end){last=refs[++j];}
            if(source[last.end]!=='.'||source[last.end+1]==='.'||
                !/^(?:\s|$)/.test(source.slice(last.end+1,last.end+2)))continue;
            const line=source.slice(source.lastIndexOf('\n',first.start-2)+1,first.start-1),
                word=/([\p{L}]+)$/u.exec(line)?.[1];
            if(!word||word.length<4||word!==word.toLowerCase()||
                /\b(?:etc|aprox|prof|profa|doutor|doutora|pág|págs|pags|vol|vols|ed|exmo|exma|ilmo|ilma|srta|univ|univers|depto|dept|ltda|eireli|cons|comp|fasc|arts|caps|cols|anex|corr|desp|decr|resol|telef|avda|nasc|falec|ibid|idem|opcit|loccit|passim|apud|sept)$/iu.test(line)||
                /["'“”‘’]/.test(line)||!v221StructurePlainLine(line)||
                !v221StructureOwned(c,first.start-1,first.start,{ref:false})||
                refs.slice(i,j+1).some(r=>r.body===null?!/\/\s*>$/.test(r.raw):!/<\/ref[ \t]*>$/i.test(r.raw))||
                refs.slice(i,j+1).some(r=>
                    !v24SyntaxLiteralIdentity(v24SyntaxAttrs(v24SyntaxTag(r.raw,0)?.attrs||''))))continue;
            edits.push(v221StructureEdit(source,last.end,last.end+1,'','v221ReferenceDuplicatePeriod',
                'EXT-REF-01: complete reference chain after an unambiguous prose sentence; first period and all reference bytes retained'));
            i=j;
        }
        return edits;
    }
    function v221StructureScopeColumn(source,cfg={}) {
        if(cfg.tableChecks===false||cfg.automaticTableRepairs===false||cfg.tableAccessibility===false||!/\bscope[ \t]*=[ \t]*[\"']?column(?:[\"']|[ \t|!])/i.test(source))return [];
        const c=v221StructureContext(source),edits=[];
        for(const table of v29TableStaticBounds(source)){
            if(c.shield.ranges.some(r=>r.start<=table.start&&r.end>=table.end)||
                !v221StructureDisplayOwner(c.view,table.start,{table:true}))continue;
            const model=v29TableModel(source,table);if(!model)continue;
            for(const row of model.rows)for(const cell of row.cells){
                if(cell.kind!=='!')continue;
                const scope=cell.attrs.entries.filter(a=>a.key==='scope');
                if(scope.length!==1||scope[0].value!=='column')continue;
                const a=scope[0],raw=source.slice(a.start,a.end),m=/^(scope[ \t]*=[ \t]*)(["']?)column\2$/i.exec(raw.trim());
                if(!m)continue;
                const at=a.start+raw.indexOf('column');
                edits.push(v221StructureEdit(source,at,at+6,'col','v221TableScopeColumn',
                    'LNR-01: complete literal header cell with invalid column scope; native col enum preserves every other cell byte',
                    {tableStart:table.start,cellStart:cell.start}));
            }
        }
        return edits;
    }
    function v221StructureRefSlash(source,cfg={}) {
        if(cfg.references===false||cfg.automaticReferenceRepairs===false||!/<ref\b[^<>\r\n]*\/[ \t]+\/[ \t]*>/i.test(source))return [];
        const c=v221StructureContext(source),edits=[];
        for(const m of source.matchAll(/<ref\b[^<>\r\n]*\/[ \t]+\/[ \t]*>/gi)){
            const at=m.index,raw=m[0],corrected=raw.replace(/\/[ \t]+\/[ \t]*>$/,'/>'),tag=v24SyntaxTag(corrected,0),
                attrs=tag&&v24SyntaxAttrs(tag.attrs);
            if(!tag||tag.end!==corrected.length||tag.name!=='ref'||tag.close||!tag.self||
                !v24SyntaxLiteralIdentity(attrs,true)||
                c.shield.ranges.some(r=>r.start<at+raw.length&&r.end>at)||
                !v221StructureOwned({...c,blocked:(a,b)=>c.ranges.some(r=>r.start<b&&r.end>a&&!(r.start===at&&r.end===at+raw.length))},at,at+raw.length)||
                v220RawReferenceAttributeBoundary(source,at))continue;
            edits.push(v221StructureEdit(source,at,at+raw.length,corrected,'v221RefExtraSelfCloseSlash',
                'LNR-04: two unquoted trailing slashes in a complete selfclosing named ref; literal identity and reuse graph retained'));
        }
        return edits;
    }
    function v221StructureGalleries(source,cfg={}) {
        if(cfg.images===false||!/<gallery\b/i.test(source))return [];
        const shield=v24SyntaxProtected(source),nodes=templates(shield.view).nodes,edits=[];
        for(const owner of shield.ranges.filter(r=>r.kind==='gallery')){
            const raw=source.slice(owner.start,owner.end),head=v24SyntaxTag(raw,0);
            if(!head||head.close||head.self||nodes.some(n=>n.start<owner.start&&n.end>owner.end)||!/<\/gallery\s*>$/i.test(raw)||
                /\{\{|\}\}|<!--|<nowiki/i.test(raw)||
                !v221StructureDisplayOwner(shield.view,owner.start)||
                v24SyntaxProtected(source.slice(0,owner.start)).unclosed.length)continue;
            const body=raw.slice(head.end,raw.lastIndexOf('<'));
            let offset=owner.start+head.end;
            for(const line of body.split(/(?<=\n)/)){
                const clean=line.replace(/\r?\n$/,''),parts=v24SyntaxParts(clean);
                if(parts&&parts.length>=3&&/^(?:File|Image|Imagem|Ficheiro|Arquivo):[^|\[\]{}<>\r\n]+$/i.test(parts[0].text.trim())){
                    const first=parts[1].text,last=parts.at(-1).text;
                    if(/^(?:thumb|thumbnail)$/.test(first.trim())&&last.trim()&&
                        !/^(?:thumb|thumbnail|\d+px|alt=|link=|class=|lang=)/i.test(last.trim())){
                        const at=offset+parts[1].start-1;
                        edits.push(v221StructureEdit(source,at,offset+parts[1].end,'','v221GalleryThumbnailOption',
                            'LNR-02: redundant gallery thumbnail option before a separate literal caption; gallery attributes and all other options retained'));
                    }
                }
                offset+=line.length;
            }
        }
        return edits;
    }
    function v221StructureTracks(source,cfg={}) {
        if(cfg.sections===false||cfg.markup===false||!/\{\{[ \t]*Info\/Álbum\b/i.test(source))return [];
        const box=v220BioPrincipal(source);if(!box||box.p.name!=='info/álbum')return [];
        const c=v221StructureContext(source),edits=[];
        for(const m of source.matchAll(/^==[ \t]*(?:Faixas|Lista de faixas)[ \t]*==[ \t]*\r?\n/gmi)){
            if(!v221StructureOwned(c,m.index,m.index+m[0].length))continue;
            const start=m.index+m[0].length,tail=source.slice(start),next=/^={2,6}/m.exec(tail),end=next?start+next.index:source.length,
                body=source.slice(start,end),lines=body.split(/\r?\n/).filter(l=>l.trim());
            if(lines.length<2||lines.length>100)continue;
            let valid=true;const replacements=[];
            for(let i=0;i<lines.length;i++){
                const match=/^([1-9]\d*)\.[ \t]+([^{}<>\r\n]+)$/.exec(lines[i]);
                if(!match||Number(match[1])!==i+1||/^[|!*#;:=]/.test(match[2])){valid=false;break;}
                replacements.push('# '+match[2]);
            }
            if(!valid||c.tables.some(t=>t.start<end&&t.end>start)||
                c.shield.ranges.some(r=>r.start<end&&r.end>start))continue;
            const eol=body.includes('\r\n')?'\r\n':'\n',leading=/^[ \t\r\n]*/.exec(body)[0],trailing=/[ \t\r\n]*$/.exec(body)[0];
            edits.push(v221StructureEdit(source,start,end,leading+replacements.join(eol)+trailing,'v221AlbumTrackList',
                'GEN-03: confirmed album and entire track section with complete consecutive literal numbering from one; every item payload retained'));
        }
        return edits;
    }
    function v221StructureResponsiveStyle(raw) {
        if(typeof raw!=='string'||/[{}\[\]<>\\]|\/\*|!important/i.test(raw))return null;
        const declarations=new Map();
        for(const part of raw.split(';').filter(p=>p.trim())){
            const m=/^\s*([a-z-]+)\s*:\s*([^;]+?)\s*$/i.exec(part);if(!m)return null;
            const key=m[1].toLowerCase(),value=m[2].toLowerCase();if(declarations.has(key))return null;
            if(!['width','min-width','table-layout','font-size','text-align','border-collapse'].includes(key))return null;
            if(key==='font-size'&&!/^(?:100|[7-9]\d|1[01]\d|120)%$/.test(value)||
                key==='text-align'&&!/^(?:left|right|center)$/.test(value)||
                key==='border-collapse'&&!/^(?:collapse|separate)$/.test(value))return null;
            declarations.set(key,value);
        }
        const minimum=/^([1-9]\d{0,3}(?:\.\d{1,3})?)(px|em|rem)$/.exec(declarations.get('min-width')||'');
        return declarations.size>3&&declarations.get('width')==='100%'&&declarations.get('table-layout')==='fixed'&&
            minimum&&Number(minimum[1])>=(minimum[2]==='px'?640:40)?declarations:null;
    }
    function v221StructureResponsive(source,cfg={}) {
        if(!/\bmin-width[ \t]*:/i.test(source)||!v29TableEnabled(source,cfg)||cfg.responsiveTableWrappers===false||v24SyntaxScan(source).issues.length)return [];
        const c=v221StructureContext(source),edits=[];
        for(const table of v272LiteralTables(source).tables){
            if(table.nested||table.end-table.start>500000||!table.attrs.valid||
                table.attrs.attrs.some(a=>!['class','style'].includes(a.key)))continue;
            const classes=table.attrs.attrs.filter(a=>a.key==='class'),styles=table.attrs.attrs.filter(a=>a.key==='style');
            if(classes.length!==1||styles.length!==1||!/^(?:wikitable(?: sortable)?|sortable wikitable)$/.test(classes[0].value||'')||
                !v221StructureResponsiveStyle(styles[0].value)||!v210ResponsiveTopLevel(source,table.start)||
                c.shield.ranges.some(r=>r.start<=table.start&&r.end>=table.end)||
                c.nodes.some(r=>r.start<table.end&&r.end>table.start)||
                /<\/?(?:table|tr|td|th|thead|tbody|tfoot|div)\b/i.test(source.slice(table.openEnd,table.closeStart)))continue;
            const eol=source.slice(table.start,table.end).includes('\r\n')?'\r\n':'\n';
            if(!source.slice(table.start,table.end).endsWith(eol))continue;
            const proof={tableStart:table.start,tableEnd:table.end,tableSourceHash:v24SyntaxHash(source.slice(table.start,table.end))};
            edits.push(v221StructureEdit(source,table.start,table.start,'<div style="max-width:100%;min-width:0;overflow-x:auto;">'+eol,
                'v221ResponsiveTableWrapper','STR-10: exact top-level fixed-layout table retained with finite independent CSS inside one width-bounded scrolling container',proof),
                v221StructureEdit(source,table.end,table.end,'</div>'+eol,'v221ResponsiveTableWrapper',
                    'STR-10: exact complete table retained; bounded scrolling container closes after the table',proof));
        }
        return edits;
    }
    function v221StructureExternalRequests(source,cfg={}) {
        if(!v220StructureScope(source,cfg))return {sourceHash:v24SyntaxHash(source),interwiki:[],files:[]};
        const c=v221StructureContext(source),interwiki=[],files=[];
        // An opaque expansion may suppress interwikis; matching sitelinks alone cannot disprove it.
        // No transclusion allowlist is inferred from template names or footer profiles.
        if(!source.includes('{{')){
            for(const m of source.matchAll(/^\[\[([a-z][a-z-]{1,14}):([^\[\]{}<>|#\r\n]+)\]\][ \t]*\r?$/gm))
                if(!['categoria','category','imagem','image','file','ficheiro','arquivo'].includes(m[1])&&
                    !c.blocked(m.index,m.index+m[0].length)&&
                    (TRANSLATION_RULES.languages.includes(m[1])||Object.values(LANGUAGE_CODES).includes(m[1])))
                    interwiki.push({language:m[1],title:m[2]});
        }
        for(const owner of c.shield.ranges.filter(r=>r.kind==='gallery')){
            const raw=source.slice(owner.start,owner.end);if(!/<\/gallery\s*>$/i.test(raw)||/\{\{|<!--/.test(raw)||c.nodes.some(n=>n.start<owner.start&&n.end>owner.end)||
                !v221StructureDisplayOwner(c.view,owner.start))continue;
            for(const m of raw.matchAll(/^(File|Image|Imagem|Ficheiro|Arquivo)::([^|\[\]{}<>:\r\n]+)(?=\||\r?$)/gmi))
                files.push({originalTitle:'File::'+m[2],correctedTitle:'File:'+m[2]});
        }
        return {sourceHash:v24SyntaxHash(source),pageTitle:cfg.pageTitle||'',revisionId:cfg.revisionId??null,interwiki,files};
    }
    function v221StructureExternal(source,cfg={}) {
        const proof=cfg.v221StructureExternalProof;if(!proof)return [];
        const requests=v221StructureExternalRequests(source,cfg);
        if(proof.sourceHash!==requests.sourceHash||proof.pageTitle!==requests.pageTitle||
            proof.revisionId!==requests.revisionId||!proof.checkedAt||!Number.isFinite(Date.parse(proof.checkedAt)))return [];
        const edits=[],c=v221StructureContext(source);
        for(const r of requests.interwiki){
            if(cfg.links===false||!proof.interwiki?.some(p=>p.language===r.language&&p.title===r.title&&p.matched===true))continue;
            const exact='[['+r.language+':'+r.title+']]';
            for(const m of source.matchAll(/^\[\[[^\r\n]+\]\][ \t]*\r?$/gm))if(m[0].trim()===exact&&!c.blocked(m.index,m.index+m[0].length))
                edits.push(v221StructureEdit(source,m.index,m.index+m[0].length+(source[m.index+m[0].length]==='\n'?1:0),'',
                    'v221WikidataInterwikiDuplicate','GEN-04: exact current sitelink and edited revision bound by preflight; no fragment, display prefix or suppression',
                    {language:r.language,title:r.title,checkedAt:proof.checkedAt,revisionId:requests.revisionId}));
        }
        if(cfg.images!==false)for(const owner of c.shield.ranges.filter(r=>r.kind==='gallery')){
            const raw=source.slice(owner.start,owner.end);if(!/<\/gallery\s*>$/i.test(raw)||/\{\{|<!--/.test(raw)||c.nodes.some(n=>n.start<owner.start&&n.end>owner.end)||
                !v221StructureDisplayOwner(c.view,owner.start))continue;
            for(const m of raw.matchAll(/^(File|Image|Imagem|Ficheiro|Arquivo)::([^|\[\]{}<>:\r\n]+)(?=\||\r?$)/gmi)){
                const hit=proof.files?.find(p=>p.originalTitle==='File::'+m[2]&&p.correctedTitle==='File:'+m[2]&&
                    p.correctedExists===true&&p.originalExists===false);
                if(!hit)continue;const at=owner.start+m.index+m[1].length+1;
                edits.push(v221StructureEdit(source,at,at+1,'','v221GalleryNamespaceColon',
                    'LNR-03: source-bound file lookup confirms corrected file exists and the double-colon filename does not; remaining filename and caption bytes retained',
                    {correctedTitle:hit.correctedTitle,checkedAt:proof.checkedAt}));
            }
        }
        return edits;
    }
    function v221CategoryEofFooter(source,cfg={}) {
        const original=cfg.biographyOriginalSource;
        if(cfg.endMatter===false||cfg.portals===false||typeof original!=='string'||original===source||
            /[\r\n]$/.test(original)||/\{\{\s*(?:Portal[23]?|Barra de portal|Portal bar)\s*[|}]/i.test(original))return [];
        const match=/(?:^|\r?\n)([ \t]+\[\[Categoria:([^|#\[\]{}<>\r\n]+)(?:\|[^\[\]{}<>\r\n]*)?\]\])$/.exec(original);
        if(!match||!match[2].trim()||match[2]!==match[2].trim())return [];
        const line=match[1],at=source.lastIndexOf('\n'+line)+1;
        if(at<=0||source.indexOf(line)!==at||source.indexOf(line,at+line.length)!==-1)return [];
        const tail=source.slice(at+line.length),parts=/^([ \t\r\n]+)(\{\{[\s\S]*\}\})([ \t\r\n]*)$/.exec(tail);
        if(!parts)return [];
        const portal=parts[2],parsed=templates(portal),nodes=parsed.nodes.filter(n=>n.depth===0),p=parsedTemplate(portal),
            slots=biographyPortalSlots(portal);
        if(parsed.unclosed.length||nodes.length!==1||nodes[0].start!==0||nodes[0].end!==portal.length||
            p.name!=='portal3'||slots.unsafe||!slots.slots.size||
            [...slots.slots.values()].some(s=>!s.value.trim()||/[{}<>\r\n]/.test(s.value)))return [];
        const originalAt=original.length-line.length;if(!/\r?\n[ \t]*\r?\n$/.test(original.slice(0,originalAt)))return [];
        const shield=v24SyntaxProtected(original),context=v24SyntaxContext(shield.view,originalAt);
        if(shield.unclosed.length||shield.ranges.some(r=>r.start<originalAt&&r.end>=original.length)||context.templates.length||context.html.length||context.tables.length||context.links.length||context.external.length)return [];
        const eol=original.includes('\r\n')?'\r\n':'\n';
        return [v221StructureEdit(source,at,source.length,portal+eol+eol+line,'v221CategoryEofFooter',
            'INT-04: the only new tail is a complete new Portal3; move it before the exact invisible original category line, retaining its indentation and absent EOF newline',
            {originalSourceHash:v24SyntaxHash(original),categoryLineHash:v24SyntaxHash(line),portalSourceHash:v24SyntaxHash(portal)})];
    }
    function v221InlineInfoboxEdits(source,cfg={}) {
        if(cfg.infoboxes===false||cfg.infoboxAlignment===false||cfg.alignInfoboxParameters===false||
            !/\{\{[Ii]nfo\/Assentamento\/Marrocos\b/.test(source))return [];
        const c=v221StructureContext(source),edits=[];
        if(c.shield.unclosed.length)return edits;
        for(const node of c.nodes.filter(row=>row.depth===0)){
            const raw=source.slice(node.start,node.end);
            if(/[\r\n<>]/.test(raw)||raw.includes('{|')||
                !v220StructureStandalone(source,node.start,node.end)||
                node.start!==source.lastIndexOf('\n',node.start-1)+1||
                c.ranges.some(row=>row.start<node.end&&row.end>node.start&&!c.nodes.includes(row)))continue;
            const state=v24SyntaxContext(c.view,node.start);
            if(state.templates.length||state.html.length||state.tables.length||state.links.length||state.external.length)continue;
            const parsed=parsedTemplate(raw),parts=splitParts(raw.slice(2,-2));
            if(parsed.name!=='info/assentamento/marrocos'||parts.length<3)continue;
            // Named arguments are trimmed by MediaWiki before substitution.
            // The only implicit argument allowed here is the documented `com`
            // selector of this exact wrapper, whose #switch trims its input.
            const positional=parsed.name==='info/assentamento/marrocos'&&parts[1]==='com',
                fields=[],seen=new Set();let valid=true,width=22;
            for(const part of parts.slice(positional?2:1)){
                const m=/^([ \t]*)([\p{L}\p{N}_ /().:-]+?)([ \t]*)=([\s\S]*)$/u.exec(part),key=m?.[2].trim();
                if(!m||!key||/^\d+$/.test(key)||seen.has(key.normalize('NFC'))){valid=false;break;}
                seen.add(key.normalize('NFC'));
                const prefix=' '+key,length=Array.from(prefix).length;
                width=Math.max(width,length+1);
                if(width>48){valid=false;break;}
                fields.push({part,key,value:m[4],prefix,length});
            }
            if(!valid||!fields.length)continue;
            const eol=source.includes('\r\n')?'\r\n':'\n',after='{{'+parts[0]+(positional?'|com':'')+eol+
                fields.map(field=>'|'+field.prefix+' '.repeat(width-field.length)+'='+field.value+eol).join('')+'}}',
                next=splitParts(after.slice(2,-2));
            if(next.length!==parts.length||next[0].trim()!==parts[0].trim()||
                positional&&next[1].trim()!=='com')continue;
            // Reparse every boundary and compare the exact effective name and
            // value. Nested templates and link pipes stay in the same field.
            if(fields.some((field,index)=>{
                const part=next[index+(positional?2:1)],at=part.indexOf('=');
                return at<0||part.slice(0,at).trim()!==field.key||part.slice(at+1).trim()!==field.value.trim();
            }))continue;
            edits.push(v221StructureEdit(source,node.start,node.end,after,'v221InfoboxLineBreaks',
                'inline standalone native settlement wrapper; identical ordered trimmed named arguments; only documented com positional selector',
                {template:parsed.name,fields:fields.length,positionalSelector:positional?'com':null}));
        }
        return edits;
    }
    function v221InlineInfoboxPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[]};
        if(!v220StructureScope(source,cfg)||cfg.v221StructureRepairs===false)return plan;
        const edits=v221InlineInfoboxEdits(source,cfg);
        return {...plan,edits,text:v24SyntaxApply(source,edits)};
    }
    function v221InlineInfoboxProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221InlineInfoboxPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v221StructurePlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[],steps:[],proofVersion:'2.21-structure-1'};
        if(!v220StructureScope(source,cfg)||cfg.v221StructureRepairs===false)return {...plan,disabled:true};
        const stages=[['external-proof',v221StructureExternal],['reference-slash',v221StructureRefSlash],
            ['links',v221StructureLinks],['urls',v221StructureUrls],['authority',v221StructureAuthority],
            ['gaps',v221StructureGaps],['empty-markup',v221StructureEmptyMarkup],['headings',v221StructureHeadings],
            ['columns',v221StructureColumns],['reference-period',v221StructureRefPeriod],
            ['scope-column',v221StructureScopeColumn],['gallery',v221StructureGalleries],
            ['tracks',v221StructureTracks],['responsive',v221StructureResponsive],['category-eof-footer',v221CategoryEofFooter]];
        for(const [name,find]of stages){
            const before=plan.text,hash=v24SyntaxHash(before),edits=find(before,cfg).sort((a,b)=>a.start-b.start||a.end-b.end);
            if(!edits.length||edits.some((e,i)=>e.proof.sourceHash!==hash||e.start<0||e.end<e.start||e.end>before.length||
                i&&edits[i-1].end>e.start))continue;
            const after=v24SyntaxApply(before,edits);if(after===before)continue;
            plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;
        }
        return plan;
    }
    function v221StructureProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v221StructurePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

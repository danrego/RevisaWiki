    const V212_CITATION_ALIASES=Object.freeze(__V212_CITATION_ALIASES__);
    const V212_URL_ROLES=Object.freeze(__V212_URL_ROLES__);
    function v212ReferenceFieldScope(cfg={}) {
        return v24SyntaxScope(cfg)&&cfg.namespaceNumber===0&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            !cfg.discussionPage&&!cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            cfg.references!==false&&cfg.automaticReferenceRepairs!==false&&cfg.markup!==false;
    }
    function v212LiteralCitationFields(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||
            /<!--|[<>\uE000-\uF8FF]|\{\{\{|\{\{[^{}]*\{\{/.test(raw))return null;
        const p=parsedTemplate(raw),head=p.parts[0].trim().replace(/_/g,' ').replace(/^(?:predefinição|template)\s*:\s*/i,'');
        if(!/^[cC]itar (?:web|jornal|revista|livro)$/.test(head)||!['citar web','citar jornal','citar revista','citar livro'].includes(p.name))return null;
        const fields=[];let at=2+p.parts[0].length;
        for(let index=1;index<p.parts.length;index++){
            const part=p.parts[index],match=/^(\s*)([^={}\[\]<>\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part);
            if(!match)return null;
            const key=match[2].trim(),tail=match[2].match(/\s*$/)[0].length;
            if(!/^[\p{L}\d _/-]+$/u.test(key)||/[{}\uE000-\uF8FF]/.test(match[4]))return null;
            fields.push({index,key,value:match[4],start:at,end:at+1+part.length,keyStart:at+1+match[1].length,keyEnd:at+1+match[1].length+match[2].length-tail,valueStart:at+1+match[1].length+match[2].length+match[3].length});
            at+=1+part.length;
        }
        return {p,fields};
    }
    function v212CollectorGroupCall(raw,cfg={}) {
        const result={text:raw,changes:[]};if(!v212ReferenceFieldScope(cfg))return result;
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||/[<>\uE000-\uF8FF]|<!--|\{\{\{|\{\{[^{}]*\{\{/.test(raw))return result;
        const p=parsedTemplate(raw),head=p.parts[0].trim().replace(/_/g,' ').replace(/^(?:predefinição|template)\s*:\s*/i,'');
        if(!/^[Rr]eferências$/.test(head))return result;
        const entries=foreignEntries(p),groups=entries.filter(e=>['group','grupo'].includes(e.key));
        if(groups.length!==1||groups[0].key!=='group'||groups[0].positional||!v29ReferenceName(groups[0].value.trim())||
            groups[0].value.trim()!==groups[0].value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'')||
            entries.some(e=>e.positional||/^\d+$/.test(e.key))||entries.some(e=>/[{}<>\uE000-\uF8FF]/.test(e.key+e.value)))return result;
        let at=2+p.parts[0].length+1;
        for(let index=1;index<p.parts.length;index++){
            const part=p.parts[index],match=/^(\s*)group(\s*)=/.exec(part);
            if(match){const start=at+match[1].length;result.text=raw.slice(0,start)+'grupo'+raw.slice(start+5);result.changes.push({start,end:start+5,text:'grupo',ruleId:'v212CollectorGroups',before:'group',after:'grupo'});return result;}
            at+=part.length+1;
        }
        return result;
    }
    function v212NativeRendererGroup(p) {
        const entries=foreignEntries(p),native=['referências','referencias'].includes(p.name),groups=entries.filter(e=>(native?['grupo']:['grupo','group']).includes(e.key));
        return groups.at(-1)?.value.trim()||'';
    }
    function v212BareURL(value) {
        const match=/^\[(https?:\/\/[^\s\[\]{}<>|"'`\\]+)\]$/.exec(value);if(!match)return null;
        const raw=match[1],authority=/^https?:\/\/([^/?#]+)/.exec(raw)?.[1];
        if(!authority||/@|%40/i.test(authority)||/[\u0000-\u0020\u007f-\u009f]/.test(raw))return null;
        try{const parsed=new URL(raw);if(!['http:','https:'].includes(parsed.protocol)||!parsed.hostname||parsed.username||parsed.password)return null;}catch(_){return null;}
        return raw;
    }
    function v212CitationAliasCall(raw,cfg={}) {
        const result={text:raw,changes:[]};if(!v212ReferenceFieldScope(cfg)||cfg.citations===false||cfg.citationRepairs===false)return result;
        const parsed=v212LiteralCitationFields(raw);if(!parsed)return result;
        const {p,fields}=parsed,edits=[];
        if(cfg.automaticParameterDuplicates!==false)for(const [family,aliases]of Object.entries(V212_CITATION_ALIASES)){
            const entries=fields.filter(e=>aliases.includes(e.key));
            if(entries.length<2||entries.some(e=>!nativeCitationAccepts(p,e.key)||!e.value.trim())||entries.some(e=>e.value.trim()!==entries[0].value.trim()))continue;
            for(const duplicate of entries.slice(1))edits.push({start:duplicate.start,end:duplicate.end,text:'',ruleId:'v212CitationAliases',family,before:raw.slice(duplicate.start,duplicate.end),after:''});
        }
        for(const [role,aliases]of Object.entries(V212_URL_ROLES)){
            if(role==='ChapterURL'&&p.name!=='citar livro')continue;
            const entries=fields.filter(e=>aliases.includes(e.key));if(entries.length!==1)continue;
            const field=entries[0];if(!nativeCitationAccepts(p,field.key))continue;
            const value=field.value.trim(),url=v212BareURL(value);if(url===null)continue;
            const leading=field.value.length-field.value.trimStart().length,start=field.valueStart+leading;
            edits.push({start,end:start+value.length,text:url,ruleId:'v212BracketedURLs',role,before:value,after:url});
        }
        edits.sort((a,b)=>a.start-b.start);result.text=v24SyntaxApply(raw,edits);result.changes=edits;return result;
    }
    function v212ReferenceFieldEdits(source,cfg={}) {
        if(!v212ReferenceFieldScope(cfg)||typeof source!=='string'||!/[|]\s*group\s*=|\{\{\s*(?:(?:Predefinição|Template):)?[cC]itar[ _]|<references\b/i.test(source))return [];
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        if(shield.unclosed.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const parsed=templates(shield.view);if(parsed.unclosed.length||v24SyntaxScan(source).issues.length)return [];
        const edits=[],sourceHash=v24SyntaxHash(source),protectedAt=(start,end)=>[...shield.ranges,...markdown].some(r=>r.start<end&&r.end>start);
        for(const node of parsed.nodes){
            if(protectedAt(node.start,node.end)||parsed.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>=node.end))continue;
            const before=source.slice(node.start,node.end),collector=v212CollectorGroupCall(before,cfg),citation=v212CitationAliasCall(before,cfg),result=collector.text!==before?collector:citation;
            for(const change of result.changes)edits.push({start:node.start+change.start,end:node.start+change.end,text:change.text,ruleId:change.ruleId,proof:{sourceHash,before,after:result.text,family:change.family,role:change.role,condition:'one exact native call; literal fields; only verified equivalent aliases or isolated HTTP address delimiters; every retained value and model preserved'}});
        }
        for(let at=0;at<shield.view.length;){const tag=v24SyntaxTag(shield.view,at);if(!tag){at++;continue;}at=tag.end;
            if(tag.name!=='references'||tag.close||protectedAt(tag.start,tag.end)||parsed.nodes.some(parent=>parent.start<tag.start&&parent.end>=tag.end))continue;
            const context=v24SyntaxContext(shield.view,tag.start);if(context.templates.length||context.links.length||context.external.length||context.html.length)continue;
            const attrs=v25SafeAttributes(tag.attrs,new Set(['group','responsive']));
            if(!attrs?.duplicates.length||attrs.values.has('responsive')&&!['0','1'].includes(attrs.values.get('responsive')))continue;
            if(!tag.self){
                const closing=v24SyntaxScan(source).tokens.find(token=>token.name==='references'&&token.close&&token.start>=tag.end);if(!closing)continue;
                const bank=source.slice(tag.end,closing.start),bankRefs=refTokens(bank);let cursor=0,valid=true;
                for(const ref of bankRefs){const identity=attrsOf(ref.attrs);if(bank.slice(cursor,ref.start).trim()||!identity||!v24SyntaxLiteralIdentity(identity,true)||ref.body===null||!v29ReferenceBody(ref.body)){valid=false;break;}cursor=ref.end;}
                if(!valid||bank.slice(cursor).trim()||protectedAt(tag.end,closing.start))continue;
            }
            const duplicates=attrs.duplicates,base=tag.start+tag.raw.indexOf(tag.attrs),local=duplicates.map(e=>({start:base+e.start,end:base+e.end,text:'',ruleId:'v212CollectorAttributes',proof:{sourceHash,openingStart:tag.start,key:e.key,value:e.value,condition:'native Cite list attributes; all literal; equal duplicate values; complete source and unchanged reference-bank body'}}));
            const after=v24SyntaxApply(source,local);if(v24SyntaxScan(after).issues.length)continue;
            edits.push(...local);
        }
        edits.sort((a,b)=>a.start-b.start);return edits;
    }
    function v212ReferenceFieldPlan(source,cfg={}) {
        const edits=v212ReferenceFieldEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v212ReferenceFieldProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v212ReferenceFieldPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

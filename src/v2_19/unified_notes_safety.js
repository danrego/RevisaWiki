    // Notas 59102402 emits nota + lower-alpha. The combined wrapper
    // 73218466 also emits Nota + nt. Only a closed native source can prove
    // those extra collectors dormant. Imported single collectors stay separate.
    function v219UnifiedNotesSourceAllowed(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||v219BankSourceFragmentRisk(source)||cfg.references===false||
            cfg.unifiedNotesReferences===false||cfg.sectionOnly||cfg.discussionPage||
            cfg.namespaceNumber!==0||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            /\{\{\{|[\uE000-\uF8FF]/.test(source)||v24SyntaxScan(source).issues.length)return false;
        const observed=v219NativeReferenceObserver(source),renderers=rendererRanges(observed.view);
        if(observed.unclosed.length||observed.empties.length||renderers.length!==2)return false;
        const hard=[...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source),...v219QuotedTemplateRanges(source,false)];
        if(hard.some(range=>renderers.some(renderer=>range.start<renderer.end&&renderer.start<range.end)))return false;
        const expected=['Notas','Referências'];
        for(let index=0;index<2;index++){
            const range=renderers[index],raw=source.slice(range.start,range.end),parsed=parsedTemplate(raw);
            const lineStart=source.lastIndexOf('\n',range.start-1)+1,next=source.indexOf('\n',range.end),lineEnd=next<0?source.length:next;
            if(/[^ \t\r]/.test(source.slice(lineStart,range.start)+source.slice(range.end,lineEnd)))return false;
            if(!raw.startsWith('{{')||!raw.endsWith('}}')||parsed.parts.length!==1||
                !v219OriginalTemplateHeaderAllowed(parsed.parts[0])||
                !v215SameTemplateTitle(parsed.parts[0],expected[index]))return false;
        }
        const groups=new Set(['','nota','lower-alpha']);
        for(const ref of observed.refs){
            if(!ref.valid||!ref.attrs||!groups.has(ref.group)||
                Object.keys(ref.attrs).some(key=>!['name','group'].includes(key))||
                Object.values(ref.attrs).some(value=>v219UncertainReferenceIdentity(value)))return false;
        }
        for(const helper of observed.helpers){
            if(!helper.eligible||helper.attributeScope||
                helper.calls.some(call=>!groups.has(call.group||''))||
                helper.nativeGroup!==undefined&&!groups.has(helper.nativeGroup))return false;
        }
        const parsed=v24SyntaxTemplates(observed.view);
        if(parsed.unclosed.length)return false;
        for(const node of parsed.nodes){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw);
            if(renderers.some(range=>range.start===node.start&&range.end===node.end))continue;
            if(observed.helpers.some(helper=>helper.eligible&&helper.start===node.start&&helper.end===node.end))continue;
            if(v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw)||v219LiteralDefaultSortCall(raw))continue;
            const head=v215TemplateTitle(p.parts[0]),entries=foreignEntries(p);
            if(v219OriginalTemplateHeaderAllowed(p.parts[0])&&/^[Pp]ortal3$/.test(head)&&
                entries.length>=1&&entries.length<=10&&entries.every(entry=>entry.positional&&
                    entry.value.trim()&&!/[{}<>\[\]&|\r\n\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(entry.value)))continue;
            return false;
        }
        return true;
    }

    const V2151_LEAD_PREFIXES = new Set([
        'ver desambig', 'ver desambiguação', 'outros usos', 'outrosusos',
        'ver também', 'não confundir', 'mais fontes', 'sem fontes',
        'fontes', 'reciclagem', 'revisão', 'parcial', 'wikificar',
        'sem notas', 'carece de fontes', 'tradução', 'tradução incompleta'
    ]);
    const V2151_LEAD_INLINE = new Set([
        'dni', 'morte', 'idade', 'dataext', 'lang', 'lang-en', 'lang-fr',
        'lang-de', 'lang-es', 'lang-it', 'lang-ru', 'lang-ja', 'nowrap',
        'nobr', 'pequeno', 'small', 'nre', 'efn', 'refn', 'sfn', 'sfnm',
        'sfnp', 'harv', 'harvnb', 'harvtxt'
    ]);
    function v2151InfoboxOrderScope(cfg={}) {
        return cfg.namespaceNumber===0 && cfg.infoboxes!==false &&
            cfg.structuralRepairs!==false && cfg.automaticInfoboxOrder!==false &&
            !cfg.sectionOnly && (cfg.section===undefined||cfg.section===null||cfg.section==='') &&
            !cfg.discussionPage && !cfg.redirectPage && !cfg.disambiguationPage &&
            !cfg.pageRedirect && !cfg.pageDisambiguation &&
            (!cfg.contentModel||cfg.contentModel==='wikitext') &&
            (!cfg.model||cfg.model==='wikitext');
    }
    function v2151InfoboxOrderPlan(source,cfg={}) {
        const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||!v2151InfoboxOrderScope(cfg))return plan;
        const literalBox=/\{\{(?:[Ii]nfo)\//.exec(source),literalOpening=/^(?:\uFEFF)?'''[^'\r\n]+'''[ \t]/m.exec(source);
        if(!literalBox||!literalOpening)return plan;
        const literalLineStart=source.lastIndexOf('\n',literalBox.index-1)+1,literalIndentation=source.slice(literalLineStart,literalBox.index);
        if(literalIndentation){
            if(!/^ +$/.test(literalIndentation)||[...source.matchAll(/\{\{\s*(?:Info\/|Infobox\b)/ig)].length!==1)return plan;
            // The ordinary readers correctly protect indented examples. Test
            // this one candidate without those spaces, then require the full
            // principal-box and subject-lead proof before removing anything.
            const candidate=source.slice(0,literalLineStart)+source.slice(literalBox.index),verified=v2151InfoboxOrderPlan(candidate,cfg);
            if(!verified.eligible&&!verified.edits.length)return plan;
            if(verified.edits.length){
                const original=verified.edits[0],edit={...original,end:original.end+literalIndentation.length,
                    proof:{...original.proof,boxStart:literalBox.index,boxEnd:original.proof.boxEnd+literalIndentation.length,
                        indentation:literalIndentation,changeRules:['infoboxLeadOrder','infoboxIndentation']}};
                return {...plan,text:verified.text,edits:[edit]};
            }
            const edit={start:literalLineStart,end:literalBox.index,text:'',ruleId:'infoboxIndentation',proof:{
                template:verified.template,infobox:verified.template,boxStart:literalBox.index,
                indentation:literalIndentation,changeRules:['infoboxIndentation'],
                conditions:['single catalogued native biography infobox','standalone principal call before first section',
                    'opening names the article subject','only ASCII spaces before the call removed']}};
            return {...plan,text:candidate,edits:[edit]};
        }
        const title=v25LeadTitle(cfg.pageTitle).replace(/ \([^()]+\)$/,'');
        const person=biographyDetection(source,cfg);
        if(!title||/[{}\[\]<>#|\r\n]/.test(title)||!person)return plan;
        const info=structuralReaders(source),firstSection=info.headings[0]?.start??source.length;
        const boxes=info.nodes.filter(n=>/^info\//.test(n.p.name)&&Object.hasOwn(INFOBOX_CATALOG,n.p.name));
        if(boxes.length!==1)return plan;
        const box=boxes[0],profile=INFOBOX_CATALOG[box.p.name];
        // Partial catalogs can still have a verified native title. Their
        // incompleteness concerns fields, not the already checked person box.
        if(person.infobox!==box.p.name||!profile.title||!v215LiteralTemplateIdentity(box.raw,profile)||box.start>=firstSection)return plan;
        const lineStart=source.lastIndexOf('\n',box.start-1)+1,
            lineEndAt=source.indexOf('\n',box.end),lineEnd=lineEndAt<0?source.length:lineEndAt;
        const indentation=source.slice(lineStart,box.start);
        if(indentation&&!/^ +$/.test(indentation)||source.slice(box.end,lineEnd).trim())return plan;
        // This rule moves a literal call. It does not interpret a generated box
        // or rearrange an article's explicitly styled layout.
        const beforeBox=source.slice(0,lineStart),crossed=source.slice(0,box.end);
        if(/<!--|\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)|\{\||\|\}|<\s*\/?\s*(?:div|section|table|blockquote|q|pre|code|syntaxhighlight|source|nowiki|noinclude|includeonly|onlyinclude|gallery|imagemap|poem|timeline|references)\b/i.test(crossed)||
            /\[\[\s*(?:arquivo|imagem|file|image)\s*:/i.test(beforeBox)||v24SyntaxScan(crossed).issues.length)return plan;
        const explicitRefs=refTokens(protectedView(crossed));
        // A conflicting named definition can change its displayed contents
        // when its first occurrence moves. Ref follow and dynamic identities
        // also need a different proof from a literal relocation.
        if(explicitRefs.some(r=>{const a=attrsOf(r.attrs);return !a||Object.keys(a).some(k=>!['name','group'].includes(k))||Object.values(a).some(v=>/[{}&\r\n]/.test(v));})||
            referenceAudit(source,{shortCitationChecks:false}).some(f=>f.code==='conflicting-definition'))return plan;
        const crossedView=protectedView(crossed),outsideRefs=v24SyntaxMaskRanges(crossedView,explicitRefs);
        if(/<\s*\/?\s*(?!br\b)[a-z]/i.test(outsideRefs))return plan;
        if(foreignEntries(box.p).some(e=>['alinhamento','alinhamento caixa','alinhamento_caixa','float','flutuar','estilo','estilo caixa','estilo_caixa'].includes(norm(e.key))&&e.value.trim()))return plan;
        const nested=templates(protectedView(box.raw.slice(2,-2))).nodes;
        if(nested.some(n=>/^(?:info\/|infobox\b)/.test(parsedTemplate(box.raw.slice(2,-2).slice(n.start,n.end)).name)||
            ['referências','referencias','reflist','references','notas','notas e referências'].includes(parsedTemplate(box.raw.slice(2,-2).slice(n.start,n.end)).name)))return plan;
        // Leave hatnotes and maintenance calls above the box, in their exact
        // original order. An unrecognized prefix may emit article content.
        let leadStart=0;
        for(const n of info.nodes.filter(n=>n.end<=lineStart)){
            if(source.slice(leadStart,n.start).trim())break;
            if(!V2151_LEAD_PREFIXES.has(n.p.name))return plan;
            const ls=source.lastIndexOf('\n',n.start-1)+1,
                leAt=source.indexOf('\n',n.end),le=leAt<0?source.length:leAt;
            if(source.slice(ls,n.start).trim()||source.slice(n.end,le).trim())return plan;
            leadStart=n.end;
        }
        const gap=source.slice(leadStart,lineStart).match(/^[\s\uFEFF]*/)[0];leadStart+=gap.length;
        // Only the accidental ASCII spaces before the principal literal call
        // are removable. Spaces inside the box, examples and explicit layouts
        // are retained. A box already first still needs a verified subject lead.
        if(!source.slice(leadStart,lineStart).trim()){
            const following=source.slice(box.end,firstSection),opening=following.match(/^[\s\uFEFF]*'''([^'\r\n]+)'''(?=[ \t])/);
            if(!opening||v25LeadTitle(opening[1])!==title)return plan;
            if(!indentation)return {...plan,eligible:true,template:box.p.name};
            const edit={start:lineStart,end:box.start,text:'',ruleId:'infoboxIndentation',proof:{template:box.p.name,infobox:box.p.name,
                boxStart:box.start,boxEnd:box.end,indentation,changeRules:['infoboxIndentation'],
                conditions:['single catalogued native biography infobox','standalone principal call before first section',
                    'opening names the article subject','only ASCII spaces before the call removed']}};
            return {...plan,text:source.slice(0,edit.start)+source.slice(edit.end),edits:[edit]};
        }
        const lead=source.slice(leadStart,lineStart),opening=lead.match(/^'''([^'\r\n]+)'''(?=[ \t])/);
        if(!opening||v25LeadTitle(opening[1])!==title||!lead.trim()||/^[ \t]*[*#:;=|!]/m.test(lead))return plan;
        const leadNodes=info.nodes.filter(n=>n.start>=leadStart&&n.end<=lineStart);
        if(leadNodes.some(n=>!V2151_LEAD_INLINE.has(n.p.name)))return plan;
        const movedBox=source.slice(box.start,box.end),separator=lead.match(/[\s\uFEFF]+$/)?.[0]||'',leadText=lead.slice(0,lead.length-separator.length);
        if(!/[\r\n]/.test(separator))return plan;
        const replacement=movedBox+separator+leadText,edit={start:leadStart,end:box.end,text:replacement,ruleId:'infoboxLeadOrder',
            proof:{template:box.p.name,infobox:box.p.name,boxStart:box.start,boxEnd:box.end,leadStart,
                separator,box:movedBox,lead:leadText,indentation,changeRules:['infoboxLeadOrder',...(indentation?['infoboxIndentation']:[])],
                conditions:['single catalogued native biography infobox','standalone literal call before first section',
                    'opening names the article subject','known prefix preserved','box and prose copied without changing their contents']}};
        return {...plan,text:source.slice(0,edit.start)+edit.text+source.slice(edit.end),edits:[edit]};
    }
    function automaticInfoboxOrder(source,cfg={},bump=()=>{}) {
        const plan=v2151InfoboxOrderPlan(source,cfg);
        for(const edit of plan.edits)for(const rule of edit.proof.changeRules)bump(rule);
        return plan.text;
    }
    function v2151InfoboxOrderProof(source,result,plan,cfg={}) {
        if(!plan||plan.source!==source||plan.sourceHash!==v24SyntaxHash(source)||plan.text!==result)return false;
        const fresh=v2151InfoboxOrderPlan(source,cfg);
        if(fresh.text!==result||JSON.stringify(fresh.edits)!==JSON.stringify(plan.edits))return false;
        return plan.edits.every(edit=>{
            const p=edit.proof;
            return edit.ruleId==='infoboxIndentation'?source.slice(edit.start,edit.end)===p.indentation&&/^ +$/.test(p.indentation)&&edit.text==='':
                source.slice(edit.start,edit.end)===p.lead+p.separator+p.indentation+p.box&&edit.text===p.box+p.separator+p.lead;
        });
    }

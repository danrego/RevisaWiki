    function v214QuoteScope(cfg={}) {
        return v24SyntaxScope(cfg)&&cfg.namespaceNumber===0&&cfg.auxiliaryTemplates!==false&&
            cfg.automaticParameterNames!==false&&!cfg.sectionOnly&&!cfg.discussionPage&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation;
    }
    function v214QuoteAlignmentCall(raw,cfg={}) {
        const result={text:raw,edits:[]};
        if(!v214QuoteScope(cfg)||typeof raw!=='string'||!/^\{\{/.test(raw)||!raw.endsWith('}}')||
            /<!--|\{\{\{|[\uE000-\uF8FF]/.test(raw))return result;
        const p=parsedTemplate(raw),profile=TEMPLATE_CATALOG[p.name];
        const head=p.parts[0].trim().replace(/_/g,' ').replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        if(!/^[Cc]aixa de citação$/.test(head)||p.name!=='caixa de citação'||profile?.oldid!==68629072||profile.partial)return result;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return result;
        const fields=[];
        for(const part of parts.slice(1)){
            const match=/^(\s*)([^={}\[\]<>\r\n]+?)(\s*=\s*)([\s\S]*)$/.exec(part.text);
            if(!match){if(part.text.trim())return result;continue;}
            const key=match[2].trim(),tail=match[2].length-match[2].trimEnd().length;
            fields.push({key,value:match[4],start:2+part.start+match[1].length,
                end:2+part.start+match[1].length+match[2].length-tail});
        }
        const rules=[
            {key:'alinhar',target:'posição',aliases:['alinhar','posição','align'],values:/^(?:esquerda|direita|centro|left|right|center|none)$/i},
            {key:'alinhar_fonte',target:'posição-autor',aliases:['alinhar_fonte','posição-autor','salign'],values:/^(?:esquerda|direita|centro|left|right|center)$/i}
        ];
        for(const rule of rules){
            const candidates=fields.filter(field=>rule.aliases.includes(field.key));
            if(candidates.length!==1||candidates[0].key!==rule.key||!profileAccepts(profile,rule.target)||
                !rule.values.test(candidates[0].value.trim()))continue;
            const field=candidates[0];
            result.edits.push({start:field.start,end:field.end,text:rule.target,
                ruleId:'v214QuoteAlignment',before:rule.key,after:rule.target});
        }
        result.edits.sort((a,b)=>a.start-b.start);result.text=v24SyntaxApply(raw,result.edits);return result;
    }
    function v214QuoteAlignmentEdits(source,cfg={}) {
        if(!v214QuoteScope(cfg)||typeof source!=='string'||!/[|]\s*alinhar(?:_fonte)?\s*=/.test(source))return [];
        const shield=v24SyntaxProtected(source),parsed=templates(shield.view),markdown=v27SafeMarkdownRanges(source);
        if(shield.unclosed.length||parsed.unclosed.length||v24SyntaxScan(source).issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const node of parsed.nodes){
            if(parsed.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>=node.end)||
                markdown.some(range=>range.start<node.end&&range.end>node.start))continue;
            const raw=source.slice(node.start,node.end),plan=v214QuoteAlignmentCall(raw,cfg);
            if(shield.ranges.some(range=>range.start<=node.start&&range.end>=node.end)||
                plan.edits.some(edit=>shield.ranges.some(range=>range.start<node.start+edit.end&&range.end>node.start+edit.start)))continue;
            for(const edit of plan.edits)edits.push({start:node.start+edit.start,end:node.start+edit.end,
                text:edit.text,ruleId:edit.ruleId,proof:{sourceHash,before:raw,after:plan.text,
                    oldid:68629072,fieldBefore:edit.before,fieldAfter:edit.after,
                    condition:'one native quote box; literal supported alignment; no duplicate or competing alias; every value and quote body retained'}});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v214QuoteAlignmentPlan(source,cfg={}) {
        const edits=v214QuoteAlignmentEdits(source,cfg);
        return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v214QuoteAlignmentProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v214QuoteAlignmentPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v214QuoteInventory(source,cfg={}) {
        const view=protectedView(source),keys=[];
        for(const node of templates(view).nodes){
            const raw=source.slice(node.start,node.end);if(parsedTemplate(raw).name!=='caixa de citação')continue;
            const canonical=mapTemplateTree(v214QuoteAlignmentCall(raw,cfg).text,part=>v24InventoryTemplate(part,cfg));
            const p=parsedTemplate(canonical),value=raw=>{
                let text=raw;const noop=()=>{};
                if(cfg.links){text=wikiURLs(text,noop);text=cleanLinks(text,noop);text=canonicalPortugueseLinks(text,cfg,noop);}
                return text.trim();
            };
            keys.push(JSON.stringify([p.name,foreignEntries(p).map(entry=>
                [entry.key,value(entry.value)])]));
        }
        return v24InventoryCount(keys);
    }
    function v214QuoteObjectProof(plan,expected,actual) {
        if(!(plan.safe?.steps||[]).some(step=>step.name==='v214-quote-alignments'))return {accepted:true,reason:''};
        return v24InventoryContains(v214QuoteInventory(expected,plan.cfg),v214QuoteInventory(actual,plan.cfg))?
            {accepted:true,reason:''}:{accepted:false,reason:'Uma caixa de citação corrigida perdeu ou alterou texto, fonte, alinhamento ou outra informação fora dos ajustes confirmados.'};
    }
    function v214QuoteAlignmentCount(before,after,topics=[]) {
        const plan=v214QuoteAlignmentPlan(before,{...DEFAULTS,namespaceNumber:0});
        if(!plan.edits.length||plan.text!==after)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after);let shift=0;
        const events=plan.edits.map(edit=>{
            const start=edit.start+shift;shift+=edit.text.length-(edit.end-edit.start);
            return {id:sourceHash+':parameter-name:'+edit.start+':'+edit.end,rule:'retained-parameter-name',
                kind:'parameter-name',label:'Nome de parâmetro de alinhamento',sourceHash,outputHash,
                sourceAnchors:[{start:edit.start,end:edit.end}],outputAnchors:[{start,end:start+edit.text.length}],
                before:before.slice(edit.start,edit.end),after:edit.text,
                fragments:[{start:edit.start,end:edit.end,newStart:start,newEnd:start+edit.text.length,
                    before:before.slice(edit.start,edit.end),after:edit.text}]};
        });
        return {count:events.length,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',
            coveredFragments:events.length,totalFragments:events.length,unresolvedFragments:0,unresolved:[],
            text:events.length+' '+(events.length===1?'ajuste aplicado':'ajustes aplicados')};
    }

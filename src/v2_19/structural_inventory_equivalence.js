    // Namespace padding is native ASCII space padding. Control characters
    // produce literal text in native parsing and must never activate an image.
    function v219NativeMediaHeaderAllowed(raw) {
        if(typeof raw!=='string')return false;
        const match=/^\[\[ *(?:File|Image|Ficheiro|Arquivo|Imagem) *: *([^|\[\]\r\n]+)(?:\|[^\[\]\n]*)?\]\]$/i.exec(raw);
        return !!match&&!!match[1].trim()&&!/[\u0000-\u001F\u007F]/.test(match[1]);
    }
    // Additional read-only literal-value equivalences proved by anonymous
    // native rendering. Only balanced link-label emphasis and ASCII namespace
    // padding are normalized. Link targets and media option bytes remain exact.
    function v219StructuralLiteralPlan(source,cfg={},quoteValue=false) {
        const base={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304)return base;
        const shield=v24SyntaxProtected(source),index=v210StructuralIndex(source),tags=[];
        if(shield.unclosed.length||index.templates.unclosed.length||v24SyntaxScan(source).issues.length)return base;
        for(let at=0;at<source.length;){const tag=tagAt(source,at);if(tag){tags.push({start:at,end:tag.end});at=tag.end;}else at++;}
        const overlaps=(a,b,ranges)=>ranges.some(r=>r.start<b&&a<r.end),
            safe=(start,end,emphasis=[])=>{
                if(overlaps(start,end,[...index.templates.nodes,...index.references,...index.collectors,...index.tables,...tags,...v27SafeMarkdownRanges(source)]))return false;
                if(shield.ranges.some(range=>range.start<end&&start<range.end&&!(range.kind==='quotation-markup'&&
                    emphasis.some(own=>own.start===range.start&&own.end===range.end))))return false;
                const context=v24SyntaxContext(source,start),lineStart=source.lastIndexOf('\n',start-1)+1;
                return !context.links.length&&!context.external.length&&!context.tables.length&&!context.html.length&&
                    !/\b(?:https?|ftp):\/\/[^\s<>"']*$/i.test(source.slice(lineStart,start));
            },add=(start,end,text,kind,evidence)=>base.edits.push({start,end,text,ruleId:'v218ReferenceMarkupEquivalence',
                proof:{sourceHash:base.sourceHash,before:source.slice(start,end),after:text,kind,...evidence,
                    condition:'read-only exact native displayed-value equivalence; link target, visible label, emphasis state, media identity and every option byte retained'}});
        if(cfg.markup!==false&&!quoteValue)for(const match of source.matchAll(/\[\[([^|\[\]\r\n]+)\|('{2}|'{3}|'{5})([^'\[\]\r\n]+)\2\]\]/g)){
            const [whole,target,inner,label]=match,linkStart=match.index,linkEnd=linkStart+whole.length;
            if(/[:#{}<>&]/.test(target)||target.includes("''")||/[{}<>|&]/.test(label)||
                target!==target.trim()||label!==label.trim()||!target||!label)continue;
            const before=/'+$/.exec(source.slice(0,linkStart))?.[0]||'',after=/^'+/.exec(source.slice(linkEnd))?.[0]||'';
            let start=linkStart,end=linkEnd,delimiter=inner,own=[{start:linkStart+2+target.length+1,end:linkEnd-2}];
            if(before||after){
                if(before!==after||![2,3].includes(before.length)||before.length+inner.length!==5)continue;
                start-=before.length;end+=after.length;delimiter="'''''";own.push({start,end});
            }
            if(!safe(start,end,own))continue;
            add(start,end,delimiter+'[['+target+'|'+label+']]'+delimiter,'balanced-displayed-link-emphasis',
                {target,label,innerDelimiter:inner,outerDelimiter:before,delimiter});
        }
        if(cfg.categories!==false)for(const match of source.matchAll(/\[\[ *(?:File|Image|Ficheiro|Arquivo|Imagem) *: *[^\[\]{}<>\r\n]+\]\]/gi)){
            const raw=match[0],start=match.index,end=start+raw.length,parts=/^\[\[ *(File|Image|Ficheiro|Arquivo|Imagem) *: *(.*)\]\]$/i.exec(raw);
            if(!parts||!v219NativeMediaHeaderAllowed(raw)||/[#&]|:\/\//.test(parts[2].split('|',1)[0])||!safe(start,end))continue;
            const text='[[Imagem:'+parts[2]+']]';if(text===raw)continue;
            add(start,end,text,'native-media-ascii-padding',{namespace:6,filename:parts[2].split('|',1)[0],payload:parts[2]});
        }
        base.edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(base.edits.some((e,i)=>i&&e.start<base.edits[i-1].end))return {...base,edits:[]};
        base.text=v24SyntaxApply(source,base.edits);return base;
    }
    // Read-only normalization for complete displayed structural values. These
    // functions never write source or choose a new value for an article.
    function v219StructuralValueMarkupPlan(source,cfg={},quoteValue=false) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string')return empty;
        const padding=/^[ \t]*/.exec(source)[0].length,context=source.slice(padding),
            literal=v219StructuralLiteralPlan(context,cfg,quoteValue),prior=v218ReferenceMarkupPlan(literal.text,cfg),
            allowed=quoteValue?['native-file-namespace']:['piped-label-emphasis','native-file-namespace'];
        if(prior.edits.length&&(!v218ReferenceMarkupProof(literal.text,prior.text,prior,cfg)||
            prior.edits.some(edit=>!allowed.includes(edit.proof?.kind))))return empty;
        if(!literal.edits.length&&!prior.edits.length)return empty;
        // Keep each intermediate source binding. Offsets from a later plan
        // are never treated as offsets into the original value.
        const text=source.slice(0,padding)+prior.text,edits=[{start:padding,end:source.length,text:prior.text,
            ruleId:'v218ReferenceMarkupEquivalence',proof:{sourceHash:empty.sourceHash,nativeContextSourceHash:v24SyntaxHash(context),
                literalPlan:literal,priorPlan:prior,leadingValuePadding:padding,structuralValue:quoteValue?'quotation':'table-cell',
                condition:'read-only composition of two exact finite displayed-value plans; every other byte retained'}}];
        return {...empty,text,edits};
    }
    function v219StructuralValueMarkupProof(before,after,plan,cfg={},quoteValue=false) {
        if(typeof before!=='string'||typeof after!=='string'||!plan||plan.source!==before||
            plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219StructuralValueMarkupPlan(before,cfg,quoteValue);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219StructuralValueInventoryBody(value,cfg={}) {
        return v24InventoryBody(v219StructuralValueMarkupPlan(value,cfg).text,cfg);
    }
    function v219DuplicateAttributeTableProof(plan,expected,actual) {
        const cfg=plan?.cfg||{},steps=(plan?.safe?.steps||[]).filter(step=>step.name==='duplicate-literal-attributes'),
            wanted=new Set(),reject=()=>({applied:true,accepted:false,
                reason:'A tabela corrigida perdeu células, referências, atributos, legenda ou a ordem dos dados.'});
        for(const step of steps)for(const edit of step.edits||[]){
            if(edit.proof?.tag!=='wikitable')continue;
            const index=tableAnalysis(step.before).tables.findIndex(table=>table.start===edit.proof.openingStart);
            if(index<0)return reject();wanted.add(index);
        }
        if(!wanted.size)return {applied:false,accepted:true,reason:''};
        if(typeof plan.source!=='string'||typeof plan.text!=='string'||typeof expected!=='string'||typeof actual!=='string')return reject();
        const fresh=v25ApprovedSyntaxPlan(plan.source,cfg);
        if(fresh.text!==plan.text||JSON.stringify(fresh.safe.steps)!==JSON.stringify(plan.safe.steps))return reject();
        const originals=tableAnalysis(plan.text).tables,before=tableAnalysis(expected).tables,
            after=tableAnalysis(actual).tables,originalLiteral=v272LiteralTables(plan.text).tables,
            beforeLiteral=v272LiteralTables(expected).tables,afterLiteral=v272LiteralTables(actual).tables;
        if(originals.length!==before.length||before.length!==after.length||
            originalLiteral.length!==originals.length||beforeLiteral.length!==before.length||
            afterLiteral.length!==after.length)return reject();
        // A shared ordinal is usable only when the independent table readers
        // agree on every opening. Nested or otherwise ambiguous ownership stays
        // conservative, including source whose table count has changed.
        if([[originals,originalLiteral],[before,beforeLiteral],[after,afterLiteral]].some(([a,b])=>
            a.some((table,index)=>table.start!==b[index].start)))return reject();
        const expectedInventory=v272TableInventories(expected,cfg),actualInventory=v272TableInventories(actual,cfg);
        if(expectedInventory.length!==before.length||actualInventory.length!==after.length)return reject();
        for(const index of wanted){
            if(!before[index]||!after[index]||expectedInventory[index]!==actualInventory[index]||
                v24InventoryTable(expected,before[index],cfg)!==v24InventoryTable(actual,after[index],cfg))return reject();
        }
        return {applied:true,accepted:true,reason:''};
    }

    function v219NativeDisplayedMediaInventoryValue(value,cfg={},field='',template='') {
        const profile=INFOBOX_CATALOG[template];
        if(typeof value!=='string'||cfg.categories===false||!profile||profile.oldid!==70403402||
            !['info/militar','info/combatente militar'].includes(template)||field!=='hierarquia'||!profileAccepts(profile,field))return value;
        // Native 70403402 emits dados13={{{hierarquia|}}}. Only the media
        // namespace/padding projection is allowed in this displayed field.
        return v219StructuralValueMarkupPlan(value,cfg,true).text;
    }
    function v219BiographyImageFrameOption(option) {
        return typeof option==='string'&&[...V219_NATIVE_IMAGE_OPTIONS.img_thumbnail,
            ...V219_NATIVE_IMAGE_OPTIONS.img_frameless].includes(option);
    }

    // A new repair is accepted only through its exact recomputed source plan.
    // The inherited preservation and composition checks still inspect the
    // resulting expected source. No finding class is globally ignored.
    let v220PrerequisiteGuardDepth=0;
    function v220LegacyTablePrerequisitePlan(source,cfg={}) {
        const empty={source,sourceHash:v24SyntaxHash(source),text:source,edits:[]};
        if(!v220StructureScope(source,cfg)||cfg.automaticTableRepairs===false||cfg.automaticLegacyMarkup===false||
            !/\b(?:align|valign|width|bgcolor)\s*=/i.test(source)||
            !/^\s*\|-[ \t]*\r?\n(?:[ \t]*\r?\n)*[ \t]*\|[-}]/m.test(source))return empty;
        const edits=v210TableEmptyRowEdits(source,cfg);
        if(!edits.length)return empty;
        const text=v24SyntaxApply(source,edits),before=v220LegacyTableAttributes(source,cfg),after=v220LegacyTableAttributes(text,cfg);
        if(after.length<=before.length)return empty;
        // The prerequisite is an existing repair, not an exemption from its
        // guards. Its whole source/candidate pair must pass both old checks.
        // Nested guard calls remain within those same old checks.
        v220PrerequisiteGuardDepth++;
        try{
            if(v220LegacyPreservationAudit(source,text,cfg).length||v220LegacySafeComposition(source,text,cfg))return empty;
        }finally{v220PrerequisiteGuardDepth--;}
        return {...empty,text,edits,legacyPreservationAccepted:true,legacyCompositionAccepted:true};
    }
    function v220LegacyTablePrerequisiteProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v220LegacyTablePrerequisitePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&
            (before===after||fresh.legacyPreservationAccepted===true&&fresh.legacyCompositionAccepted===true);
    }
    function v220LegacyCitationKeyPrerequisitePlan(source,cfg={}) {
        const empty={source,sourceHash:v24SyntaxHash(source),text:source,edits:[]};
        if(v220PrerequisiteGuardDepth||cfg.dates===false||!v218CitationKeyScope(source,cfg)||
            !/\|\s*ano\s*=/.test(source))return empty;
        const view=protectedView(source),nodes=templates(view).nodes,
            literals=[...v24SyntaxProtected(source).ranges,...v219MarkdownLiteralRanges(source),
                ...v219QuotedTemplateRanges(source),...v219WholeQuotedCodeRanges(source),...structuralQuoteRanges(source)],
            edits=[],witnesses=[];
        for(const node of nodes){
            if(!v220CitationKeyOwner(source,view,node,literals))continue;
            const raw=source.slice(node.start,node.end),context=v218CitationNativeContext(raw),fields=v2151FieldSyntaxParts(raw);
            if(!context||!fields||fields.some(f=>f.key!==f.plain||f.separator!=='='))continue;
            const years=fields.filter(f=>V218_CITATION_DATE_FAMILIES.year.some(k=>norm(k)===norm(f.key))),
                dates=fields.filter(f=>V218_CITATION_DATE_FAMILIES.date.some(k=>norm(k)===norm(f.key)));
            if(years.length!==1||dates.length||years[0].key!=='ano')continue;
            const field=years[0],value=field.value;
            if(!value.trim()||value.length>4096||!/[\r\n]/.test(value.trim())||/[{}\[\]<>|\uE000]/.test(value))continue;
            // Folding only physical whitespace must already identify the same
            // complete literal day. It does not resolve numeric date order.
            const literal=v218CitationDateValue(value.trim().replace(/[\r\n]+/g,' '),'date');
            if(literal?.precision!=='day')continue;
            const normalized=v219ScalarValueWithPadding(value,normalizeDate(value,()=>{})),
                parsed=v218CitationDateValue(normalized,'date');
            if(normalized===value||parsed?.precision!=='day'||JSON.stringify(parsed.identity)!==JSON.stringify(literal.identity))continue;
            const written=citation(raw,cfg,()=>{},()=>{}),writtenFields=v2151FieldSyntaxParts(written),
                writtenYear=writtenFields?.filter(f=>f.key==='ano');
            if(writtenYear?.length!==1||writtenYear[0].value.trim()!==normalized.trim())continue;
            const local=v24SyntaxApply(raw,[{start:field.start,end:field.end,text:normalized}]),
                keyPlan=v218CitationKeyPlan(local,cfg),key=keyPlan.edits.find(e=>
                    e.start===field.keyStart&&e.end===field.keyEnd&&e.proof?.sourceKey==='ano'&&
                    e.proof.targetKey==='data'&&JSON.stringify(e.proof.identity)===JSON.stringify(parsed.identity));
            if(!key||!v218CitationKeyProof(local,keyPlan.text,keyPlan,cfg))continue;
            edits.push({start:node.start+field.start,end:node.start+field.end,text:normalized,
                ruleId:'dates',proof:{sourceHash:empty.sourceHash,sourceKey:'ano',valueBefore:value,
                    valueAfter:normalized,identity:parsed.identity,nativeTemplateOldid:context.profile.oldid,
                    writerCallHash:v24SyntaxHash(written),method:'existing-literal-date-writer; same-complete-day; key-prerequisite'}});
            witnesses.push({keyStart:node.start+field.keyStart,keyEnd:node.start+field.keyEnd,identity:parsed.identity});
        }
        if(!edits.length)return empty;
        edits.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(edits.some((e,i)=>i&&edits[i-1].end>e.start))return empty;
        const text=v24SyntaxApply(source,edits),keys=v218CitationKeyPlan(text,cfg);
        if(!witnesses.every(w=>keys.edits.some(e=>
            e.start===v24InventoryPosition(w.keyStart,edits)&&e.end===v24InventoryPosition(w.keyEnd,edits)&&
            e.proof?.sourceKey==='ano'&&e.proof.targetKey==='data'&&
            JSON.stringify(e.proof.identity)===JSON.stringify(w.identity)))||!v218CitationKeyProof(text,keys.text,keys,cfg))return empty;
        v220PrerequisiteGuardDepth++;
        try{
            if(v220LegacyPreservationAudit(source,text,cfg).length||v220LegacySafeComposition(source,text,cfg))return empty;
        }finally{v220PrerequisiteGuardDepth--;}
        return {...empty,text,edits,witnesses,legacyPreservationAccepted:true,legacyCompositionAccepted:true};
    }
    function v220LegacyCitationKeyPrerequisiteProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v220LegacyCitationKeyPrerequisitePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&
            JSON.stringify(fresh.witnesses)===JSON.stringify(plan.witnesses)&&
            (before===after||fresh.legacyPreservationAccepted===true&&fresh.legacyCompositionAccepted===true);
    }
    function v220RepairPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        cfg.biographyOriginalSource=options.biographyOriginalSource??source;
        const families=[['citations',v220CitationPlan,v220CitationPlanProof],['legacy-citation-key-prerequisite',v220LegacyCitationKeyPrerequisitePlan,v220LegacyCitationKeyPrerequisiteProof],['legacy-citation-keys',v218CitationKeyPlan,v218CitationKeyProof],['table-prerequisite',v220LegacyTablePrerequisitePlan,v220LegacyTablePrerequisiteProof],['structure',v220StructurePlan,v220StructureProof],['biography',v220BiographyPlan,v220BiographyProof]];
        for(let round=0;round<2;round++){
            const start=plan.text;
            for(const [name,make,prove]of families){
                const before=plan.text,part=make(before,cfg);
                if(!part||typeof part.text!=='string'||part.text===before)continue;
                if(!prove(before,part.text,part,cfg))throw new Error('Um plano de ajuste não corresponde ao rascunho. Nenhum ajuste foi aplicado.');
                const local=part.stages||part.steps||[{name,edits:part.edits||[]}];
                const edits=local.flatMap(step=>step.edits||[]);
                plan.steps.push({family:name,round,before,after:part.text,plan:part});
                plan.edits.push(...edits);plan.text=part.text;
            }
            if(start===plan.text)break;
        }
        return plan;
    }
    function v220RepairProof(before,after,plan,options={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v220RepairPlan(before,options);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }
    function v220ExpectedSource(before,options={}) {
        const plan=v220RepairPlan(before,options);
        return plan.text;
    }
    function preservationAudit(before,after,options={}) {
        if(v220PrerequisiteGuardDepth)return v220LegacyPreservationAudit(before,after,options);
        if(before===after)return v220LegacyPreservationAudit(before,after,options);
        const expected=v220ExpectedSource(before,options);
        return v220LegacyPreservationAudit(expected,after,options);
    }
    function safeComposition(before,after,options={}) {
        if(v220PrerequisiteGuardDepth)return v220LegacySafeComposition(before,after,options);
        if(before===after)return v220LegacySafeComposition(before,after,options);
        const expected=v220ExpectedSource(before,options);
        return v220LegacySafeComposition(expected,after,options);
    }
    function referenceAudit(source,options={}) {
        return v220FilterReferenceFindings(source,v220LegacyReferenceAudit(source,options),options);
    }
    function reviewSuggestions(source,cfg) {
        return v220FilterCitationSuggestions(source,v220LegacyReviewSuggestions(source,cfg),cfg);
    }
    function v211RetainedAdjustments(before,after,kinds=[],options={}) {
        const retained=v220BaselineRetainedAdjustments(before,after,kinds,options);
        if(typeof before!=='string'||typeof after!=='string'||before===after||
            !before.includes('páginas-total')||!after.includes('total-páginas')||
            retained?.exact!==true||!Number.isSafeInteger(retained.count)||!Array.isArray(retained.events))return retained;
        const cfg=pageContextOptions({...DEFAULTS,...options});
        if(cfg.citations===false||cfg.citationRepairs===false||cfg.automaticParameterNames===false)return retained;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after);
        if(retained.sourceHash!==sourceHash||retained.outputHash!==outputHash)return retained;
        const shield=v24SyntaxProtected(before),diff=v27RawDiff(before,after),groups=[],claimed=new Set();
        let uncertain=false;
        const inside=(start,end,a,b)=>Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=a&&end<=b&&start<=end;
        for(const node of templates(before).nodes){
            if(inRange(node.start,shield.ranges))continue;
            const raw=before.slice(node.start,node.end),first=v220CitationCall(raw,cfg);
            if(!first||first.contract.title!=='Citar livro'||first.rules.length!==1||first.rules[0]!=='v220CitationLiteralPipe')continue;
            const second=v220CitationCall(first.text,cfg),rename=second?.fieldEdits.filter(e=>e.ruleId==='v220CitationTotalPages');
            if(!second||rename.length!==1||rename[0].text!=='total-páginas')continue;
            const oldFields=v220CitationFields(raw),old=oldFields?.filter(f=>!f.positional&&f.key==='páginas-total');
            if(old?.length!==1)continue;
            const start=v211CountAnchor(node.start,diff),end=v211CountAnchor(node.end,diff,false,true),target=after.slice(start,end),fields=v220CitationFields(target),fresh=fields?.filter(f=>!f.positional&&f.key==='total-páginas');
            if(v220CitationTitle(target)!=='Citar livro'||fresh?.length!==1||fresh[0].value!==old[0].value||fields.some(f=>!f.positional&&f.key==='páginas-total'))continue;
            const migration=migrateForeignTemplate(second.text,cfg),expected=migration&&!migration.blocked&&migration.profile?.kind==='citation'&&norm(migration.profile.target)==='citar livro'?migration.text:second.text;
            // Count a composed rename only for the complete native call that
            // the existing source-bound adapters actually produce. A manual
            // change to another field is not evidence for this adjustment.
            if(migration?.blocked||target!==expected){uncertain=true;continue;}
            const a=node.start+old[0].keyStart,b=node.start+old[0].keyEnd,c=start+fresh[0].keyStart,d=start+fresh[0].keyEnd;
            const indexes=retained.events.map((e,i)=>e.kind==='parameter-name'&&e.sourceHash===sourceHash&&e.outputHash===outputHash&&
                e.sourceAnchors?.length&&e.outputAnchors?.length&&e.sourceAnchors.every(r=>inside(r.start,r.end,a,b))&&
                e.outputAnchors.every(r=>inside(r.start,r.end,c,d))?i:-1).filter(i=>i>=0);
            if(indexes.length<=1)continue;
            const fragments=indexes.flatMap(i=>retained.events[i].fragments||[]).sort((x,y)=>x.start-y.start||x.end-y.end);
            const valid=fragments.length&&fragments.every((e,i)=>e.precise===true&&inside(e.start,e.end,a,b)&&inside(e.newStart,e.newEnd,c,d)&&
                e.before===before.slice(e.start,e.end)&&e.after===after.slice(e.newStart,e.newEnd)&&(!i||e.start>=fragments[i-1].end));
            if(!valid||v24SyntaxApply(before.slice(a,b),fragments.map(e=>({start:e.start-a,end:e.end-a,text:e.after})))!==after.slice(c,d)||indexes.some(i=>claimed.has(i))){uncertain=true;continue;}
            indexes.forEach(i=>claimed.add(i));groups.push({indexes,event:{id:sourceHash+':parameter-name:'+a+':'+b,rule:'retained-parameter-name',kind:'parameter-name',label:'Nome de parâmetro',sourceHash,outputHash,
                sourceAnchors:[{start:a,end:b}],outputAnchors:[{start:c,end:d}],before:before.slice(a,b),after:after.slice(c,d),fragments,
                countProof:{kind:'v220-composed-native-total-pages',sourceCallHash:v24SyntaxHash(raw),outputCallHash:v24SyntaxHash(target),nativeOldid:second.contract.nativeOldid}}});
        }
        if(uncertain)return {...retained,count:null,exact:false,text:'Ajustes aplicados, confira a comparação'};
        if(!groups.length)return retained;
        const replacements=new Map(groups.map(g=>[g.indexes[0],g.event])),events=retained.events.flatMap((e,i)=>replacements.has(i)?[replacements.get(i)]:claimed.has(i)?[]:[e]),count=retained.count-claimed.size+groups.length;
        return {...retained,count,events,text:count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s')};
    }
    const V220_RULE_LABELS=Object.freeze({
        v220LeadingBlank:'Linhas vazias no início removidas',
        v220DescriptionLeadingGap:'Separador inicial da descrição curta removido',
        v220Biography:'Campos e portais conferidos',v220TopicPortals:'Portais confirmados acrescentados',
        v220HeadingReference:'Referência deslocada do título com âncoras preservadas',
        v220UrlArgument:'Argumentos de URL corrigidos',v220PortalCleanup:'Chamadas redundantes de portais consolidadas',
        v220InfoboxField:'Campos de infocaixas corrigidos',v220OccupationCase:'Ocupações com inicial minúscula',
        v220PartialBirthMonth:'Mês e ano pessoais reunidos',v220WebsiteValue:'Endereço do site corrigido',
        v220InfoboxImage:'Imagem da infocaixa separada em seus campos',v220ImageOption:'Opção de imagem corrigida',
        v220IgnoredImageOption:'Opção de imagem sem função removida',
        v220ProseBoundaryGaps:'Linhas vazias excedentes reduzidas',v220FinalEmptyListItems:'Itens vazios finais removidos',
        v220BibliographyColumns:'Bibliografia complementar dividida em colunas',v220InlineMarkdown:'Ênfase importada de Markdown corrigida',
        v220ExternalPipeDelimiter:'Separador de ligação externa corrigido',v220ExternalNewlineLabel:'Rótulo da ligação externa reunido',
        v220ExternalProtocolTypo:'Protocolo da ligação externa corrigido',v220TemplateNameTypo:'Nome exato de predefinição corrigido',
        v220UniqueWikiLinkCloser:'Fechamento de ligação interna corrigido',v220FiniteSpelling:'Grafias inequívocas corrigidas',
        v220LegacyHTML:'HTML de apresentação migrado',v220TableAttributeQuotes:'Aspas de atributo da tabela corrigidas',
        v220TableIntroLabel:'Rótulo introdutório retirado da tabela',v220LegacyTableAttributes:'Atributos de apresentação da tabela migrados',
        v220CellFormattingClosure:'Formatação encerrada na própria célula',v220DuplicateCoordinateTitle:'Coordenada de título redundante removida',
        v220DuplicateMaintenance:'Aviso genérico redundante removido',v220LiteralNavboxIndirection:'Chamada literal de navecaixa corrigida',
        v220CitationTitlePipe:'Título da citação recomposto',v220CitationRefBoundary:'Delimitador de referência corrigido',
        v220HarvnbPage:'Páginas de citação abreviada corrigidas',v220TweetAuthor:'Nome explícito do autor reunido',
        v220TotalPages:'Parâmetro de total de páginas corrigido',v220CitationAlias:'Alias de citação atualizado',
        v220CitationLiteralPipe:'Título da citação recomposto',v220CitationTotalPages:'Parâmetro de total de páginas corrigido',
        v220CitationDeprecatedAlias:'Alias de citação atualizado',v220HarvardLocator:'Páginas de citação abreviada corrigidas',
        v220ReferenceDoubleOpening:'Abertura repetida de referência corrigida',v220ReferenceOrphanCloser:'Fechamento duplicado adjacente de referência removido'
    });
    function* cleanupStages(source,options,applyNewRepairs=true) {
        const cfg=pageContextOptions({...DEFAULTS,...(options||{})});cfg.biographyOriginalSource=source;
        if(!applyNewRepairs)return yield* v220LegacyCleanupStages(source,cfg);
        yield 'Conferindo os ajustes adicionais e seus limites...';
        const first=v220RepairPlan(source,cfg);
        const result=yield* v220LegacyCleanupStages(first.text,cfg);
        yield 'Conferindo os ajustes no código final...';
        const last=v220RepairPlan(result.text,cfg),counts=new Map((result.changes||[]).map(row=>[row.id,{...row}]));
        for(const edit of [...first.edits,...last.edits])for(const id of edit.ruleIds||[edit.ruleId||'v220Biography']){
            const old=counts.get(id),label=V220_RULE_LABELS[id]||GROUP_LABELS[id]||'Ajustes adicionais conferidos';
            const amount=Number.isSafeInteger(edit.count)&&edit.count>0?edit.count:1;
            if(old)old.count+=amount;else counts.set(id,{id,label,count:amount});
        }
        const trace=cfg.captureTrace?[...(first.text!==source?[{label:'Ajustes adicionais iniciais',before:source,after:first.text}]:[]),...(result.trace||[]),...(last.text!==result.text?[{label:'Ajustes adicionais finais',before:result.text,after:last.text}]:[])]:result.trace;
        return {...result,text:last.text,changes:[...counts.values()],trace,
            warnings:v220FilterReferenceFindings(last.text,result.warnings||[],cfg),
            suggestions:v220FilterCitationSuggestions(last.text,result.suggestions||[],cfg),
            v220Repairs:{sourceHash:v24SyntaxHash(source),initialHash:v24SyntaxHash(first.text),finalHash:v24SyntaxHash(last.text),initialSteps:first.steps.map(row=>row.family),finalSteps:last.steps.map(row=>row.family)}};
    }

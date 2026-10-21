    function v219StageProtectedRanges(source,cfg={},unmerged=false,provedOwners=[],ordinaryOnly=false) {
        const shield=v24SyntaxProtected(source),quoteOwners=shield.ranges.filter(range=>range.kind==='quotation-template'),
            ranges=shield.ranges.filter(range=>!['quotation','quotation-markup','quotation-template'].includes(range.kind)),
            examples=v219QuotedTemplateRanges(source,!ordinaryOnly);
        // A quotation template's own parameters are not its quoted text.
        // Known alignment-field repairs may still operate on that wrapper.
        // Its contained code objects remain protected independently.
        for(const range of examples)if(!quoteOwners.some(owner=>owner.start===range.start&&owner.end===range.end))ranges.push(range);
        // The ordinary whole-page view already masks a quotation owner. Parse
        // only its exact source slice to retain the contained code objects.
        // Its own wrapper fields remain available to their finite contract.
        for(const owner of quoteOwners){
            const literal=source.slice(owner.start,owner.end);
            for(const node of templates(literal).nodes)if(node.start!==0||node.end!==literal.length)
                ranges.push({start:owner.start+node.start,end:owner.start+node.end});
            for(const ref of refTokens(literal))ranges.push({start:owner.start+ref.start,end:owner.start+ref.end});
        }
        ranges.push(...v219UnknownTemplateRanges(source,cfg).map(range=>({...range,kind:'unknown-template-owner'})),...v219MarkdownLiteralRanges(source));
        // A complete heading shown between standalone emphasis delimiters is
        // an explicit code example. Native emphasis can reset at a newline,
        // so this deliberately narrow source boundary is checked separately.
        for(const match of source.matchAll(/^('{2}|'{3}|'{5})[ \t]*\r?\n(={2,6})[ \t]*\{\{[ \t]*(?:Ligações Externas|Ligações externas|Ver Também|Ver também|Bibliografia)[ \t]*\}\}[ \t]*\2[ \t]*\r?\n\1[ \t]*(?=\r?$)/gm))
            ranges.push({start:match.index,end:match.index+match[0].length,kind:'literal-heading-example'});
        // Identical named definitions form one source-level unit. A literal
        // or opaque copy protects every byte-identical peer, preventing a
        // later field repair from creating competing bodies for one name.
        if(!ordinaryOnly)ranges.push(...v219UncertainReferenceRanges(source,cfg));
        const peerSeeds=ranges.filter(range=>range.kind!=='unknown-template-owner'||!provedOwners.some(owner=>
            owner.referenceHelper&&owner.start===range.start&&owner.end===range.end));
        ranges.push(...v219ReferenceDefinitionPeerRanges(source,peerSeeds,cfg));
        return unmerged?ranges:mergeEditorialRanges(ranges);
    }
    function v219PrincipalInfoboxIndentation(source,edits,name,cfg={}) {
        if(name!=='v2151-infobox-order'||edits.length!==1)return null;
        const plan=v2151InfoboxOrderPlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v2151InfoboxOrderProof(source,plan.text,plan,cfg))return null;
        const edit=edits[0],proof=edit.proof||{},end=proof.boxStart,
            indentation=proof.indentation,start=Number.isInteger(end)?source.lastIndexOf('\n',end-1)+1:-1;
        if(typeof indentation!=='string'||!/^ +$/.test(indentation)||start<0||
            source.slice(start,end)!==indentation||!proof.changeRules?.includes('infoboxIndentation'))return null;
        const preformatted=v24SyntaxProtected(source).ranges.filter(range=>range.kind==='preformatted');
        // A deliberate collection of indented lines remains an opaque example.
        // Only the one verified principal box's ASCII prefix is removable.
        if(preformatted.length!==1||preformatted[0].start!==start||preformatted[0].end<=end)return null;
        return {start,end,rangeEnd:preformatted[0].end};
    }
    function v219LegacyHeadingOwners(source,edits,name,cfg={}) {
        if(name!=='v218-legacy-markup'||!edits.some(edit=>edit.ruleId==='headings'))return [];
        const plan=v218LegacyMarkupPlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v218LegacyMarkupProof(source,plan.text,plan,cfg))return [];
        const owners=[];
        for(const edit of edits){
            if(edit.ruleId!=='headings')continue;
            const raw=source.slice(edit.start,edit.end),match=/^(={2,6})[ \t]*(\{\{[ \t]*(?:Ligações Externas|Ligações externas|Ver Também|Ver também|Bibliografia)[ \t]*\}\})[ \t]*\1[ \t]*$/.exec(raw);
            if(!match)continue;
            const start=edit.start+raw.indexOf(match[2]);
            owners.push({start,end:start+match[2].length});
        }
        return owners;
    }
    function v219BiographyDateOwners(source,edits,name,cfg={}) {
        if(name!=='v28-biography-dates'||edits.length!==1||edits[0].ruleId!=='biographyDates')return [];
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.sourceRaw,box.profile))return [];
        const plan=v28BiographyDatePlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v28BiographyDateProof(source,plan.text,plan,cfg))return [];
        const proof=edits[0].proof,fields=box.fields.filter(field=>field.key===proof.deathKey);
        if(fields.length!==1||!profileAccepts(box.profile,fields[0].key))return [];
        const parts=v28DateValueParts(fields[0].value),call=parts&&v28DateTemplate(parts.core,'morte');
        if(!call||call.fields.size!==3||!v215SameTemplateTitle(call.parsed.parts[0],'Morte')||
            call.numbers.some((number,index)=>number!==proof.died[index]))return [];
        const start=fields[0].start+parts.start,end=fields[0].start+parts.end,
            inner=proof.edits.find(edit=>edit.start===start&&edit.end===end),
            after=inner&&v28DateTemplate(inner.text,'morte');
        if(!after||after.fields.size!==6||after.numbers.some((number,index)=>number!==proof.died[index])||
            ['4','5','6'].some((key,index)=>+after.fields.get(key)!==proof.born[index]))return [];
        return [{start:box.node.start+start,end:box.node.start+end}];
    }
    function v219NativePageWrapperOwners(source,edits,name,cfg={}) {
        if(name!=='v219-source-compatibility'||!edits.some(edit=>edit.proof?.kind==='native-page-prefix-wrapper'))return [];
        const plan=v219SourceCompatibilityPlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v219SourceCompatibilityProof(source,plan.text,plan,cfg))return [];
        const owners=[];
        for(const edit of edits){
            const proof=edit.proof||{};
            if(proof.kind!=='native-page-prefix-wrapper'||proof.nativeWrapperOldid!==47405734||
                proof.nativeWrapperSourceSha256!=='d1487d41f8c3bf4e63d1066c4838f7586f658119b5afedeeb101056694a9b3cc'||
                proof.valueBefore!==source.slice(edit.start,edit.end)||proof.valueAfter!==edit.text||
                !v219NativeCitationRoles(proof.sourceKey).some(role=>['Page','Pages'].includes(role)))continue;
            const match=/^([ \t]*)(\{\{[Pp]\.[ \t]*\|[ \t]*[1-9]\d*(?:[-–][1-9]\d*)?[ \t]*\}\})([ \t]*)$/.exec(proof.valueBefore);
            if(!match)continue;
            const start=edit.start+match[1].length;
            owners.push({start,end:start+match[2].length});
        }
        return owners;
    }
    function v219LinkDateWrapperOwners(source,edits,name,cfg={}) {
        if(name!=='v219-source-compatibility'||!edits.some(edit=>edit.proof?.kind==='native-link-access-date-wrapper'))return [];
        const plan=v219SourceCompatibilityPlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v219SourceCompatibilityProof(source,plan.text,plan,cfg))return [];
        const owners=[],nodes=templates(source).nodes;
        for(const edit of edits){
            const proof=edit.proof||{};
            if(proof.kind!=='native-link-access-date-wrapper'||proof.nativeTemplate!=='Link'||
                proof.nativeTemplateOldid!==72099361||proof.nativeWrapperOldid!==72119762||
                edit.ruleId!=='v218CitationDateValues'||proof.valueBefore!==source.slice(edit.start,edit.end)||
                proof.valueAfter!==edit.text||!Number.isInteger(proof.fieldStart)||!Number.isInteger(proof.fieldEnd)||
                !Number.isInteger(proof.wrapperStart)||!Number.isInteger(proof.wrapperEnd))continue;
            const nodeStart=edit.start-proof.fieldStart,node=nodes.find(node=>node.start===nodeStart&&node.start<=edit.start&&edit.end<=node.end);
            if(!node)continue;
            const raw=source.slice(node.start,node.end),fresh=v219SourceLinkDate(raw,cfg);
            if(!fresh||fresh.field.key!==proof.sourceKey||fresh.field.start!==proof.fieldStart||fresh.field.end!==proof.fieldEnd||
                node.start+fresh.field.end!==edit.end||fresh.field.value!==proof.valueBefore||fresh.value!==edit.text||
                fresh.wrapperStart!==proof.wrapperStart||fresh.wrapperEnd!==proof.wrapperEnd||
                JSON.stringify(fresh.tuple)!==JSON.stringify(proof.identity))continue;
            // Link 72099361 forwards this one unique access-date field. Its
            // own exact Dtlink 72119762 child reads day, month and year. The
            // fresh transaction authorizes that child only, never its parent.
            owners.push({start:node.start+fresh.wrapperStart,end:node.start+fresh.wrapperEnd});
        }
        return owners;
    }
    function v219ChemicalInfoboxOwners(source,edits,name,cfg={}) {
        if(!['v271-chemical-literal-braces','v271-chemical-inchi-wrapping'].includes(name))return [];
        const fresh=name==='v271-chemical-literal-braces'?v271ChemicalBraceEdits(source,cfg):v271ChemicalInchiEdits(source,cfg),
            plan=v271ChemicalSyntaxPlan(source,cfg);
        if(JSON.stringify(fresh)!==JSON.stringify(edits)||
            !v271ChemicalSyntaxProof(source,plan.text,plan,cfg))return [];
        const owners=[],kind=name==='v271-chemical-literal-braces'?'iupac':'inchi',
            fields=v271ChemicalFields(source,cfg,kind),boxes=v271ChemicalBoxes(source,cfg);
        for(const field of fields){
            const slot=/^dados([1-9]\d?)$/.exec(field.key);
            if(field.template!=='infocaixa'||!slot||+slot[1]>50)continue;
            const box=boxes.find(box=>box.nodeStart===field.nodeStart&&box.nodeEnd===field.nodeEnd),
                raw=source.slice(field.nodeStart,field.nodeEnd),parsed=parsedTemplate(raw);
            if(!box||!v215SameTemplateTitle(parsed.parts[0],'Infocaixa'))continue;
            const labels=box.entries.filter(entry=>entry.key==='rótulo'+slot[1]),
                values=box.entries.filter(entry=>entry.key===field.key);
            if(labels.length!==1||values.length!==1||box.entries.some(entry=>entry.key==='tópico'+slot[1])||
                !labels[0].value.trim()||!values[0].value.trim()||
                !(kind==='iupac'?labels[0].value.trim()==='Nome IUPAC':['InChI','InChI (forma hidratada)'].includes(labels[0].value.trim())))continue;
            if(!edits.some(edit=>edit.proof?.template==='infocaixa'&&edit.proof.key===field.key&&
                edit.proof.fieldStart===field.start&&edit.proof.fieldValue===field.value&&
                edit.start>=field.start&&edit.end<=field.start+field.value.length))continue;
            const contained=edits.filter(edit=>field.nodeStart<=edit.start&&edit.end<=field.nodeEnd);
            if(contained.some(edit=>!fields.some(candidate=>{
                const index=/^dados([1-9]\d?)$/.exec(candidate.key);
                if(candidate.nodeStart!==field.nodeStart||candidate.nodeEnd!==field.nodeEnd||
                    candidate.template!=='infocaixa'||!index||+index[1]>50)return false;
                const matchingLabels=box.entries.filter(entry=>entry.key==='rótulo'+index[1]);
                return matchingLabels.length===1&&!box.entries.some(entry=>entry.key==='tópico'+index[1])&&
                    box.entries.filter(entry=>entry.key===candidate.key).length===1&&
                    (kind==='iupac'?matchingLabels[0].value.trim()==='Nome IUPAC':
                        ['InChI','InChI (forma hidratada)'].includes(matchingLabels[0].value.trim()))&&
                    edit.proof?.template==='infocaixa'&&edit.proof.key===candidate.key&&
                    edit.proof.fieldStart===candidate.start&&edit.proof.fieldValue===candidate.value&&
                    candidate.start<=edit.start&&edit.end<=candidate.start+candidate.value.length;
            })))continue;
            // Infocaixa 70262218 delegates to module 72782381. Its first
            // preprocessing block loads dados1..50 and their rótulo peers.
            // Higher isolated slots need a separate block-continuity proof.
            if(!owners.some(owner=>owner.start===field.nodeStart&&owner.end===field.nodeEnd))
                owners.push({start:field.nodeStart,end:field.nodeEnd});
        }
        return owners;
    }
    function v219CitationDateWrapperOwners(source,edits,name,cfg={}) {
        if(name!=='v218-citation-date-values'||!edits.length)return [];
        const plan=v218CitationDatePlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v218CitationDateProof(source,plan.text,plan,cfg))return [];
        const owners=[];
        for(const edit of edits){
            const proof=edit.proof||{},value=source.slice(edit.start,edit.end),
                match=/^([ \t\r\n]*)(\{\{[ \t]*[Dd]ata[ \t]*\|[ \t]*(\d{1,4})[ \t]*\|[ \t]*(\d{1,2})[ \t]*\|[ \t]*(\d{1,2})[ \t]*\}\})([ \t\r\n]*)$/.exec(value),identity=proof.identity;
            if(edit.ruleId!=='v218CitationDateValues'||proof.precision!=='day'||!match||
                proof.valueBefore!==value||proof.valueAfter!==edit.text||!identity||
                identity.year!==+match[3]||identity.month!==+match[4]||identity.day!==+match[5]||
                !validDate(identity.day,identity.month,identity.year)||
                edit.text!==match[1]+identity.day+' de '+MONTH_PT[identity.month]+' de '+identity.year+match[6])continue;
            // Native Data 46302438 reads year, month and day in this order.
            // Only its complete existing three-argument call is unwrapped.
            const start=edit.start+match[1].length;
            owners.push({start,end:start+match[2].length});
        }
        return owners;
    }
    function v219BiographyDateAliasOwners(source,edits,name,cfg={}) {
        if(name!=='v219-identical-biography-date-aliases')return [];
        const plan=v219BiographyDateAliasPlan(source,cfg);
        if(JSON.stringify(plan.edits)!==JSON.stringify(edits)||
            !v219BiographyDateAliasProof(source,plan.text,plan,cfg))return [];
        const owners=[];
        for(const edit of edits){
            const value=edit.proof?.literalValue,core=typeof value==='string'?value.trim():'';
            if(edit.proof?.kind!=='identical-native-date-alias'||edit.ruleId!=='infoboxDuplicates'||
                edit.text!==''||!core.startsWith('{{'))continue;
            const parsed=parsedTemplate(core),expected=edit.proof.role==='birthDate'?'Dni':'Morte';
            if(!v215SameTemplateTitle(parsed.parts[0],expected)||
                !v28DateTemplate(core,expected==='Dni'?'dni':'morte'))continue;
            const at=source.indexOf(core,edit.start),next=source.indexOf(core,at+core.length);
            if(at<edit.start||at+core.length>edit.end||next>=0&&next<edit.end)continue;
            owners.push({start:at,end:at+core.length});
        }
        return owners;
    }
    // Both paths retain the same per-edit range and atomic-family filter.
    const v219StageRangeFilter=(source,original,edits,ranges,indentation)=>{
        if(!ranges.length)return v219AtomicReferenceStageEdits(original,edits);
        const allowed=edits.filter(edit=>{
            if(!Number.isInteger(edit.start)||!Number.isInteger(edit.end)||edit.start<0||
                edit.start>edit.end||edit.end>source.length||typeof edit.text!=='string')return false;
            if(edit.start===edit.end)return !ranges.some(range=>range.start<=edit.start&&edit.start<=range.end);
            const overlapping=ranges.filter(range=>range.start<edit.end&&edit.start<range.end);
            if(!overlapping.length)return true;
            let cursor=0;
            for(const range of overlapping) {
                if(indentation&&range.kind==='preformatted'&&range.start===indentation.start&&range.end===indentation.rangeEnd) {
                    // The fresh principal-box proof authorizes only its prefix.
                    // Any box bytes crossed by a relocation still have to occur
                    // unchanged in the replacement. The untouched suffix stays
                    // outside this edit at its original source position.
                    const retainedStart=Math.max(range.start,indentation.end,edit.start),retainedEnd=Math.min(range.end,edit.end);
                    if(retainedStart<retainedEnd){const payload=source.slice(retainedStart,retainedEnd),at=edit.text.indexOf(payload,cursor);if(at<0)return false;cursor=at+payload.length;}
                    continue;
                }
                if(range.start<edit.start||range.end>edit.end)return false;
                const payload=source.slice(range.start,range.end),at=edit.text.indexOf(payload,cursor);
                if(at<0)return false;cursor=at+payload.length;
            }
            return true;
        });
        return v219AtomicReferenceStageEdits(original,allowed);
    };
    // This closure is private to one unchanged-source named-move plan. Its
    // operation has no owner exception or principal-infobox indentation.
    const v219NamedMoveStageFilter=(source,cfg)=>{
        const scope=Object.freeze({...cfg});let ranges;
        return original=>{
            if(!Array.isArray(original)||!original.length)return original;
            const edits=v219ReferenceIdentityStageEdits(source,original,scope);
            if(!edits.length)return edits;
            if(!ranges)ranges=Object.freeze(v219StageProtectedRanges(source,scope).map(range=>Object.freeze({...range})));
            return v219StageRangeFilter(source,original,edits,ranges,null);
        };
    };
    function v219StageSafeEdits(source,edits,name,cfg={}) {
        if(!Array.isArray(edits)||!edits.length)return edits;
        if(name==='v219-gaia-peer-definition'){
            const expected=v219GaiaPeerDefinitionEdits(source,cfg);
            return JSON.stringify(edits)===JSON.stringify(expected)?edits:[];
        }
        const original=edits;
        edits=v219ReferenceIdentityStageEdits(source,edits,cfg);
        if(!edits.length)return edits;
        if(name==='v27-whole-article-wrapper') {
            const expected=v27WholeArticleWrapperEdits(source,cfg);
            return JSON.stringify(edits)===JSON.stringify(expected)?edits:[];
        }
        const indentation=v219PrincipalInfoboxIndentation(source,edits,name,cfg),
            provedOwners=[...v219IgnoredCitationStageOwners(source,edits,name,cfg),...v219NativeRStageOwners(source,edits,name,cfg),...v219LegacyHeadingOwners(source,edits,name,cfg),...v219BiographyDateOwners(source,edits,name,cfg),...v219BiographyDateAliasOwners(source,edits,name,cfg),...v219NativePageWrapperOwners(source,edits,name,cfg),...v219LinkDateWrapperOwners(source,edits,name,cfg),...v219ChemicalInfoboxOwners(source,edits,name,cfg),...v219CitationDateWrapperOwners(source,edits,name,cfg)],
            ranges=v219StageProtectedRanges(source,cfg,!!indentation||!!provedOwners.length,provedOwners)
                .filter(range=>range.kind!=='unknown-template-owner'||!provedOwners.some(owner=>owner.start===range.start&&owner.end===range.end));
        return v219StageRangeFilter(source,original,edits,ranges,indentation);
    }

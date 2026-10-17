    function v217ReferenceIdentity(attrs) {
        if(!attrs||Object.keys(attrs).some(key=>!['name','group','nome','grupo'].includes(key))||Object.hasOwn(attrs,'name')&&Object.hasOwn(attrs,'nome')||Object.hasOwn(attrs,'group')&&Object.hasOwn(attrs,'grupo'))return null;
        const name=attrs.name??attrs.nome,group=attrs.group??attrs.grupo??'',foreign=Object.keys(attrs).filter(key=>key==='nome'||key==='grupo');
        if((name===undefined?foreign.length:!v29ReferenceName(name))||!v29ReferenceName(group||'main')||Object.values(attrs).some(value=>!v29ReferenceName(value)||value.length>240||/[`\\]/.test(value)))return null;
        return {name,group,foreign};
    }
    function v217NativeRefAttributeEdits(source,cfg={}) {
        if(typeof source!=='string'||!/<ref\b[^<>]{0,2048}\b(?:nome|grupo)\s*=/i.test(source))return [];
        const context=v213ReferenceContext(source,cfg);if(!context||v24SyntaxScan(source).issues.length)return [];
        const records=[],edits=[],sourceHash=v24SyntaxHash(source);
        for(const ref of refTokens(source)){
            const tag=v24SyntaxTag(source,ref.start);if(!tag||context.shield.view.slice(tag.start,tag.end)!==tag.raw)continue;
            if(tag.close||tag.typo||context.blocked(ref.start,ref.end))return [];
            const attrs=v24SyntaxAttrs(tag.attrs),identity=v217ReferenceIdentity(attrs);if(!identity)return [];
            if(ref.body!==null&&!v213ReferenceBodyPlan(ref.body,cfg).accepted)return [];
            const record={ref,tag,attrs,...identity};records.push(record);
            for(const key of identity.foreign){
                const target=key==='nome'?'name':'group',hit=new RegExp('\\s('+key+')(?=\\s*=)','i').exec(tag.raw);if(!hit)return [];
                const start=tag.start+hit.index+hit[0].indexOf(hit[1]);
                edits.push({start,end:start+key.length,text:target,ruleId:'v213NativeRefAttributes',proof:{sourceHash,openingStart:tag.start,sourceKey:key,targetKey:target,name:identity.name,group:identity.group,body:ref.body,condition:'atomic literal identity family; existing native definition or unresolved native call in the exact group; one definition and collector interval; source bodies retained'}});
            }
        }
        if(!edits.length)return [];
        // A foreign definition and a foreign call cannot authorize each other.
        // Each changed opener needs its own unchanged native counterpart.
        for(const record of records.filter(record=>record.foreign.length)){
            const native=records.filter(other=>!other.foreign.length&&other.name===record.name&&other.group===record.group),definitions=native.filter(other=>other.ref.body!==null),calls=native.filter(other=>other.ref.body===null);
            if(record.ref.body===null){if(definitions.length!==1)return [];}
            else if(definitions.length||!calls.length)return [];
        }
        const candidate=v24SyntaxApply(source,edits),projection=v213ReferenceGraphProjection(candidate,cfg),graph=v210ReferenceGraph(projection,cfg);if(!graph)return [];
        for(const record of records.filter(record=>record.foreign.length)){
            const family=graph.families.get(graph.key(record.group,record.name));
            if(!family||family.definitions.length!==1||!family.uses.some(ref=>ref.body===null)||new Set(family.uses.map(ref=>ref.region)).size!==1)return [];
            const collectors=graph.renderers.filter(renderer=>renderer.group===record.group);
            if(collectors.length!==1||collectors[0].start<=family.uses.reduce((end,ref)=>Math.max(end,ref.end),0))return [];
            const original=record.ref.body===null?records.find(other=>!other.foreign.length&&other.name===record.name&&other.group===record.group&&other.ref.body!==null)?.ref.body:record.ref.body;
            if(typeof original!=='string'||v24InventoryBody(family.definitions[0].body,cfg)!==v24InventoryBody(original,cfg))return [];
        }
        return edits.sort((left,right)=>left.start-right.start);
    }
    function v217NativeRefAttributePlan(source,cfg={}) {
        const edits=v217NativeRefAttributeEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v217NativeRefAttributeProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v217NativeRefAttributePlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v217ReferenceAttributeCountEdits(source) {
        if(typeof source!=='string'||!/<ref\b[^<>]{0,2048}\b(?:nome|grupo)\s*=/i.test(source))return [];
        const cfg={...DEFAULTS,namespaceNumber:0},direct=v217NativeRefAttributeEdits(source,cfg);if(direct.length)return direct;
        const joint=v25SafeRepairPlan(source,cfg),steps=joint.steps.filter(step=>step.name==='v213-native-ref-attributes'),edits=[];
        for(const step of steps)for(const repair of step.edits){
            const proof=repair.proof,candidates=refTokens(source).filter(ref=>{const attrs=attrsOf(ref.attrs);return attrs&&(attrs.name||attrs.nome)===proof.name&&(attrs.group||attrs.grupo||'')===proof.group&&(ref.body===null)===(proof.body===null)&&Object.hasOwn(attrs,proof.sourceKey)&&!Object.hasOwn(attrs,proof.targetKey);});
            if(candidates.length!==1)continue;const ref=candidates[0],tag=v24SyntaxTag(source,ref.start),hit=new RegExp('\\s('+proof.sourceKey+')(?=\\s*=)','i').exec(tag.raw);if(!hit)continue;
            const start=tag.start+hit.index+hit[0].indexOf(hit[1]);edits.push({start,end:start+proof.sourceKey.length,text:proof.targetKey,ruleId:repair.ruleId,proof:{...proof,sourceHash:v24SyntaxHash(source),openingStart:ref.start,jointSourceHash:joint.sourceHash}});
        }
        return edits;
    }
    function v217ReferenceAttributeCountGroups(source) {
        const groups=new Map();for(const edit of v217ReferenceAttributeCountEdits(source)){const start=edit.proof.openingStart;if(!groups.has(start))groups.set(start,[]);groups.get(start).push(edit);}
        return [...groups.values()];
    }
    function v217TableJointSpanProof(source,table,structural,candidate) {
        if(structural.length<2||structural.length>4||structural.some(edit=>edit.ruleId!=='tableSpanAttributeTypos'))return null;
        let solutions=0,solution=0;
        // MediaWiki ignores these unknown literal attributes. Each finite
        // interpretation either keeps that span-one meaning or corrects its
        // allowlisted spelling, without changing the value or cell payload.
        for(let mask=0;mask<(1<<structural.length);mask++){
            const alternatives=structural.map((edit,index)=>mask&(1<<index)?edit:{start:edit.proof.attributeStart,end:edit.proof.attributeEnd,text:''});
            const interpretation=v210TableCandidate(source,table,alternatives);if(!interpretation)continue;
            solutions++;solution=mask;if(solutions>1)return null;
        }
        if(solutions!==1||solution!==(1<<structural.length)-1)return null;
        const payloads=[];for(const line of v210TableLines(source,table)){const cells=v210TableCells(v213TableCellParsingLine(line.text),line.start);if(cells===null)return null;for(const cell of cells){const pipe=cell.view.indexOf('|'),raw=source.slice(cell.start,cell.end);payloads.push([cell.kind,raw.slice(pipe<0?0:pipe+1)]);}}
        const after=candidate.model.cells.map(cell=>[cell.kind,cell.content]);
        if(JSON.stringify(payloads)!==JSON.stringify(after))return null;
        return {finiteAlternatives:1<<structural.length,regularAlternatives:solutions,selectedAlternative:solution,cellPayloadHash:v24SyntaxHash(JSON.stringify(payloads)),width:candidate.model.width};
    }
    function v217TableFiniteRepairEdits(source,cfg={},collectOnly=false) {
        if(!v210TableEnabled(source,cfg)||!v213TableFiniteTrigger(source))return [];
        const edits=[],shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        for(const table of v29TableStaticBounds(source)){
            const sortable=table.attrs.attrs.some(attr=>attr.key==='class'&&/\bsortable\b/.test(attr.value||'')),local=[],structural=[],unknown=[];let invalid=false;
            for(const line of v210TableLines(source,table)){
                const cells=v210TableCells(v213TableCellParsingLine(line.text),line.start);if(cells===null){invalid=true;break;}
                for(const cell of cells){const pipe=cell.view.indexOf('|');if(pipe<0)continue;const attrs=cell.raw.slice(0,pipe);
                    if(shield.ranges.some(range=>range.start<=cell.start&&cell.start<range.end)||markdown.some(range=>range.start<=cell.start&&cell.start<range.end)){invalid=true;break;}
                    const original=source.slice(cell.start,cell.end),span=v213TableSpanCandidate(original.slice(0,pipe),cell.start,original.slice(pipe+1));if(span){Object.assign(span.proof,{attributeStart:cell.start,attributeEnd:cell.start+pipe});structural.push(span);local.push(span);continue;}
                    const sorting=v213TableSortCandidate(attrs,cell.start,cell.kind,sortable);if(sorting){for(const edit of sorting.edits)Object.assign(edit.proof,{attributeStart:cell.start,attributeEnd:cell.start+pipe});local.push(...sorting.edits);if(sorting.typos)unknown.push(...sorting.edits.filter(edit=>edit.ruleId==='tableSortAttributeTypos'));}
                }
                if(invalid)break;
            }
            if(invalid||!local.length||structural.length>4||unknown.length>1||structural.length&&unknown.length)continue;
            if(structural.length>1&&(local.length!==structural.length||structural.some(edit=>edit.ruleId!=='tableSpanAttributeTypos')))continue;
            const candidate=v210TableCandidate(source,table,local);if(!candidate||structural.length&&v29TableModel(source,table))continue;
            if(structural.length>1){const proof=v217TableJointSpanProof(source,table,structural,candidate);if(!proof)continue;for(const edit of local)Object.assign(edit.proof,{jointSpanProof:proof});}
            edits.push(...(collectOnly?v210TableRawBound(table,local):v210TableBoundEdits(source,table,local,structural.length>1?'two to four independent allowlisted literal span misspellings; sole regular native interpretation among every corrected or ignored spelling; unchanged ordered cell payloads':'one finite literal span defect or one native sort-field misspelling; exact equal sort duplicates only; complete regular candidate; all cell payloads, values, order and unrelated attributes retained')));
        }
        return edits;
    }
    function v217TableFiniteRepairPlan(source,cfg={}) {
        const edits=v217TableFiniteRepairEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v217TableFiniteRepairProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v217TableFiniteRepairPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

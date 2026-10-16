    // Reference edits require a complete local graph and an exact source plan.
    function v210ReferenceScope(source,cfg={}) {
        return v29ReferenceScope(source,cfg)&&cfg.referenceGraphRepairs!==false;
    }
    function v210ReferenceSyntaxEdits(source,cfg={}) {
        if(typeof source!=='string'||!/<refname\s*=/i.test(source)||!v210ReferenceScope(source,cfg)||cfg.syntaxRepairs===false)return [];
        // Make only the equals sign lexically opaque to the quotation reader.
        // The shadow keeps every source offset and every protected example.
        const shadow=source.replace(/(<refname\s*)=/gi,'$1 '),shield=v29ReferenceShield(shadow),nodes=templates(shield.view);
        if(shield.unclosed.length||nodes.unclosed.length)return [];
        const edits=[],pattern=/<refname\s*=(?:"[^"<>]*"|'[^'<>]*')(?=[\s>])[^<>]*>/gi;
        for(const hit of source.matchAll(pattern)){
            const start=hit.index,end=start+hit[0].length;
            if(v29ReferenceOverlap(start,end,shield.ranges)||inRange(start,nodes.nodes))continue;
            const fixed=hit[0].replace(/^<refname/i,'<ref name'),opening=v24SyntaxTag(fixed,0);
            const attrs=opening&&v24SyntaxAttrs(opening.attrs);
            if(!opening||opening.self||!v24SyntaxLiteralIdentity(attrs,true)||!v29ReferenceName(attrs.name))continue;
            const closer=/<\/ref\s*>/gi;closer.lastIndex=end;const close=closer.exec(shield.view);
            if(!close||/<\s*\/?\s*(?:ref|refname|references)\b/i.test(shield.view.slice(end,close.index)))continue;
            const body=source.slice(end,close.index);
            if(!v29ReferenceBody(body)||v29ReferenceOverlap(start,closer.lastIndex,shield.ranges))continue;
            const prefix=v24SyntaxApply(shield.view.slice(0,start),edits),context=v24SyntaxContext(prefix,prefix.length);
            if(context.templates.length||context.html.length||context.links.length||context.external.length)continue;
            edits.push({start,end,text:fixed,ruleId:'v210ReferenceTagSpacing',proof:{sourceHash:v24SyntaxHash(source),before:hit[0],after:fixed,body,closeStart:close.index,condition:'one literal refname opening, one matching ref closer and a complete balanced source body'}});
        }
        if(!edits.length)return [];
        const after=v24SyntaxApply(source,edits);
        return v24SyntaxScan(after).issues.length?[]:edits;
    }
    function v210ReferenceRenderer(source,range) {
        const raw=source.slice(range.start,range.end),opening=v24SyntaxTag(source,range.start);
        if(opening&&opening.name==='references'&&!opening.close){
            const attrs=v24SyntaxAttrs(opening.attrs);
            if(!attrs||Object.keys(attrs).some(key=>!['group','responsive'].includes(key))||!v24SyntaxLiteralIdentity(Object.fromEntries(Object.entries(attrs).filter(([key])=>key==='group'))))return null;
            if(attrs.responsive!==undefined&&!['0','1'].includes(attrs.responsive))return null;
            if(!opening.self&&!/<\/references\s*>$/i.test(raw))return null;
            return {...range,group:attrs.group||'',kind:'tag'};
        }
        const p=parsedTemplate(raw);
        // Notes helpers can supply an implicit group. Their defaults are not
        // inferred from a similar-looking renderer name.
        if(!['referências','referencias','reflist','references'].includes(p.name))return null;
        const entries=foreignEntries(p),groups=entries.filter(entry=>['grupo','group'].includes(norm(entry.key)));
        if(groups.length>1||groups.some(entry=>!v29ReferenceName(entry.value.trim())))return null;
        const allowed=new Set(['grupo','group','refs','colunas','cols','columns','largura','width','nível','nivel','1']);
        if(entries.some(entry=>!allowed.has(norm(entry.key))||entry.positional&&entry.key!=='1'))return null;
        const keys=entries.map(entry=>norm(entry.key));if(new Set(keys).size!==keys.length)return null;
        for(const entry of entries){const key=norm(entry.key);if(key==='refs'||['grupo','group'].includes(key))continue;
            if(!/^(?:\d{1,3}(?:em|px|%)?)?$/.test(entry.value.trim()))return null;}
        return {...range,group:groups[0]?.value.trim()||'',kind:'template'};
    }
    function v210ReferenceGraph(source,cfg={},allowShort=false) {
        if(!v210ReferenceScope(source,cfg))return null;
        const read=()=>v210ReferenceGraphRead(source,allowShort);
        return typeof v210Memo==='function'?v210Memo(source,'reference-graph:'+Number(allowShort),read):read();
    }
    function v210ReferenceGraphRead(source,allowShort) {
        const shield=v29ReferenceShield(source),scan=v24SyntaxScan(source);
        if(shield.unclosed.length||scan.issues.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return null;
        const nodes=templates(shield.view);if(nodes.unclosed.length)return null;
        const parsed=v24SyntaxReferences(source);if(parsed.unclosed.length||parsed.empties.length)return null;
        const renderers=rendererRanges(shield.view).map(range=>v210ReferenceRenderer(source,range));
        if(renderers.some(renderer=>!renderer))return null;
        const key=(group,name)=>JSON.stringify([group,name]),refs=[],families=new Map();
        for(const ref of parsed.refs){
            if(!ref.valid||!ref.attrs||!v29ReferenceTag(source,ref)||!v24SyntaxLiteralIdentity(ref.attrs)||ref.container&&!ref.container.valid||!ref.renderer.valid||v29ReferenceOverlap(ref.start,ref.end,shield.ranges))return null;
            const bank=renderers.find(renderer=>renderer.start<=ref.start&&ref.end<=renderer.end)||null;
            const owners=nodes.nodes.filter(node=>node.start<ref.start&&ref.end<node.end);
            if(owners.some(node=>!bank||node.start!==bank.start||node.end!==bank.end))return null;
            const group=ref.group||'';
            if(!v29ReferenceName(group||'main')||bank&&group!==bank.group||ref.body!==null&&!v29ReferenceBody(ref.body))return null;
            const region=renderers.filter(renderer=>renderer.group===group&&renderer.end<=ref.start).length;
            const item={...ref,bank,group,region};refs.push(item);
            if(!ref.attrs.name)continue;
            if(!v29ReferenceName(ref.attrs.name))return null;
            const identity=key(group,ref.attrs.name);
            if(!families.has(identity))families.set(identity,{identity,name:ref.attrs.name,group,uses:[],definitions:[]});
            const family=families.get(identity);family.uses.push(item);if(ref.body!==null)family.definitions.push(item);
        }
        // Unknown transclusions can create calls absent from the literal graph.
        const literalOnly=nodes.nodes.every(node=>{
            const name=parsedTemplate(source.slice(node.start,node.end)).name;
            if(CITE_NAMES[name])return refs.some(ref=>ref.body!==null&&ref.start<node.start&&node.end<ref.end)||!refs.some(ref=>ref.start<=node.start&&node.end<=ref.end);
            return renderers.some(renderer=>renderer.kind==='template'&&renderer.start===node.start&&renderer.end===node.end)||['portal3','controle de autoridade'].includes(name)||/^(?:defaultsort|ordem padrão|ordenação):[^{}<>]+$/.test(name)||allowShort&&['harvnb','harv','harvtxt','sfnp','sfn'].includes(name);
        });
        if(!literalOnly)return null;
        return {source,sourceHash:v24SyntaxHash(source),shield,nodes,refs,renderers,families,key};
    }
    function v210ReferenceOpener(source,ref,name,self=false) {
        const tag=v24SyntaxTag(source,ref.start);if(!tag)return null;
        const pattern=/([\s]name\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,hit=pattern.exec(tag.raw);
        if(!hit)return null;
        const quote=hit[3]!==undefined?"'":'"';
        let opener=tag.raw.slice(0,hit.index)+hit[1]+quote+name+quote+tag.raw.slice(hit.index+hit[0].length);
        if(self&&!tag.self)opener=opener.replace(/\s*>$/,' />');
        return opener;
    }
    function v210ReferenceBodyKey(body,cfg={}) {
        const nodes=topNodes(body),parts=[];let at=0;
        for(const node of nodes){const raw=body.slice(node.start,node.end),normalized=v27SafeReferenceBody(raw,cfg);
            if(!CITE_NAMES[parsedTemplate(raw).name]||normalized===null)return null;
            parts.push(['literal',body.slice(at,node.start)],['citation',normalized]);at=node.end;}
        parts.push(['literal',body.slice(at)]);return JSON.stringify(parts);
    }
    function v210ReferenceBankEdits(source,cfg={}) {
        if(typeof source!=='string'||cfg.automaticIdenticalReferences===false||!/<ref\b/i.test(source)||!/<references\b|\|\s*refs\s*=/i.test(source))return [];
        const graph=v210ReferenceGraph(source,cfg);if(!graph)return [];
        const signatures=new Map(),edits=[],bodyKeys=new Map(),bodyKey=body=>{if(!bodyKeys.has(body))bodyKeys.set(body,v210ReferenceBodyKey(body,cfg));return bodyKeys.get(body);};
        for(const family of graph.families.values()){
            if(!family.definitions.length||new Set(family.uses.map(ref=>ref.region)).size!==1)continue;
            if(!family.uses.some(ref=>!ref.bank)||family.definitions.some(ref=>!ref.body.trim()))continue;
            const bodies=family.definitions.map(ref=>bodyKey(ref.body));if(bodies.some(body=>body===null)||new Set(bodies).size!==1)continue;
            const signature=JSON.stringify([family.group,family.uses[0].region,bodies[0]]);
            if(!signatures.has(signature))signatures.set(signature,[]);signatures.get(signature).push(family);
        }
        for(const group of signatures.values()){
            if(!group.some(family=>family.definitions.some(ref=>ref.bank)))continue;
            group.sort((a,b)=>Math.min(...a.uses.map(ref=>ref.start))-Math.min(...b.uses.map(ref=>ref.start)));
            const keeper=group[0],allDefinitions=group.flatMap(family=>family.definitions).sort((a,b)=>a.start-b.start);
            const kept=keeper.definitions[0],proof={sourceHash:graph.sourceHash,group:keeper.group,region:keeper.uses[0].region,name:keeper.name,body:kept.body,bodies:allDefinitions.map(ref=>ref.body),normalizedBody:bodyKey(kept.body),definitionStart:kept.start,names:group.map(family=>family.name),condition:'every complete source field matches after established deterministic citation normalization; all literal calls have the same effective group and collector interval; one complete source definition is retained'};
            if(group.length===1&&allDefinitions.length===1)continue;
            for(const family of group)for(const ref of family.uses){
                if(ref.start===kept.start)continue;
                if(ref.bank){edits.push({start:ref.start,end:ref.end,text:'',ruleId:'v210ReferenceBanks',proof});continue;}
                if(ref.body!==null){const opener=v210ReferenceOpener(source,ref,keeper.name,true);if(opener)edits.push({start:ref.start,end:ref.end,text:opener,ruleId:'v210ReferenceBanks',proof});}
                else if(family.name!==keeper.name){const opener=v210ReferenceOpener(source,ref,keeper.name);if(opener)edits.push({start:ref.start,end:ref.end,text:opener,ruleId:'v210ReferenceBanks',proof});}
            }
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v210ReferenceConflictEdits(source,cfg={}) {
        if(typeof source!=='string'||!/<ref\b[^>]*\bname\s*=/i.test(source))return [];
        const graph=v210ReferenceGraph(source,cfg);if(!graph)return [];
        const edits=[],occupied=new Set(graph.refs.map(ref=>graph.key(ref.group,ref.attrs.name||'')));
        for(const family of graph.families.values()){
            if(family.definitions.length<2||family.uses.some(ref=>ref.bank||ref.body===null)||new Set(family.uses.map(ref=>ref.region)).size!==1||new Set(family.definitions.map(ref=>ref.body)).size<2)continue;
            const bodies=new Map([[family.definitions[0].body,family.name]]);let suffix=2;
            for(const ref of family.definitions.slice(1)){
                let name=bodies.get(ref.body);
                if(!name){while(occupied.has(graph.key(family.group,family.name+'-'+suffix)))suffix++;name=family.name+'-'+suffix++;bodies.set(ref.body,name);occupied.add(graph.key(family.group,name));}
                if(name===family.name)continue;
                const opener=v210ReferenceOpener(source,ref,name);if(!opener)continue;
                edits.push({start:ref.start,end:ref.start+ref.raw.length,text:opener,ruleId:'v210ReferenceConflicts',proof:{sourceHash:graph.sourceHash,name:family.name,replacement:name,group:family.group,body:ref.body,definitionStarts:family.definitions.map(item=>item.start),condition:'every occurrence has its own complete body; no empty, indirect, continuation or list-defined call exists; conflicting explicit source bodies remain unchanged'}});
            }
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v210HarvardAnchorCandidates(source,cfg={}) {
        if(typeof source!=='string'||!/\{\{\s*(?:harvnb|harv|harvtxt|sfnp|sfn)\s*[|}]/i.test(source))return [];
        if(!v210ReferenceScope(source,cfg)||cfg.citations===false||cfg.shortCitationChecks===false||cfg.harvardAnchorRepairs===false)return [];
        const graph=v210ReferenceGraph(source,cfg,true);if(!graph)return [];
        const calls=[],works=[],allWorks=[],nodes=templates(graph.shield.view).nodes,plain=value=>typeof value==='string'&&value===value.trim()&&!!value&&!/[{}<>\[\]\r\n|]/.test(value);
        for(const node of nodes){const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),entries=foreignEntries(p);
            if(['harvnb','harv','harvtxt','sfnp','sfn'].includes(p.name)){
                if(nodes.some(other=>other.start<node.start&&node.end<other.end)||entries.some(entry=>!entry.positional&&!['p','pp','loc'].includes(entry.key)))continue;
                const position=entries.filter(entry=>entry.positional).map(entry=>entry.value.trim()),year=position.at(-1),authors=position.slice(0,-1);
                if(!/^\d{4}[a-z]?$/.test(year||'')||authors.length<1||authors.length>4||authors.some(name=>!plain(name)))continue;
                calls.push({start:node.start,authors,year,target:('CITEREF'+authors.join('')+year).normalize('NFC').replace(/ /g,'_')});continue;
            }
            if(!CITE_NAMES[p.name]||nodes.some(other=>other.start<node.start&&node.end<other.end)||graph.refs.some(ref=>ref.start<=node.start&&node.end<=ref.end))continue;
            const fields=v20CitationFields(p),authors=v20CitationSurnames(fields),year=v20PublicationYear(fields);
            if(!fields||entries.some(entry=>entry.positional)||authors.length<1||authors.some(name=>!plain(name))||!/^\d{4}[a-z]?$/.test(year)||!v20Plain(v20CitationTitle(fields)))continue;
            if([...fields].some(([key,value])=>value&&/^(?:último|ultimo|last)\d+$/.test(key)&&Number(key.match(/\d+$/)[0])>authors.length))continue;
            allWorks.push({target:('CITEREF'+authors.join('')+year).normalize('NFC').replace(/ /g,'_')});
            if(fields.has('ref'))continue;
            const years=[fields.get('ano'),fields.get('year')].filter(Boolean);if(new Set(years).size>1)continue;
            const named=entries.map(entry=>parameterFamily(entry.key));if(new Set(named).size!==named.length)continue;
            works.push({node,raw,authors,year,target:('CITEREF'+authors.join('')+year).normalize('NFC').replace(/ /g,'_')});
        }
        const result=[];
        for(const work of works){const matching=calls.filter(call=>call.target===work.target&&call.year===work.year&&JSON.stringify(call.authors)===JSON.stringify(work.authors)),sameWorks=allWorks.filter(other=>other.target===work.target);
            if(!matching.length||sameWorks.length!==1)continue;
            const after=work.raw.slice(0,-2)+'|ref=harv}}',proposal=source.slice(0,work.node.start)+after+source.slice(work.node.end),id=v24SyntaxHash(JSON.stringify([work.node.start,work.raw,after,work.target]));
            result.push({id,sourceHash:graph.sourceHash,sourceLength:source.length,pageTitle:cfg.pageTitle||'',start:work.node.start,end:work.node.end,before:work.raw,after,target:work.target,authors:work.authors,year:work.year,callStarts:matching.map(call=>call.start),proposalSourceHash:v24SyntaxHash(proposal)});
        }
        return result;
    }
    function v210HarvardProofPayload(proof) {
        const {proofHash,...payload}=proof;return JSON.stringify(payload);
    }
    function v210HarvardAnchorNativeProof(source,candidate,beforeHtml,afterHtml,Parser,cfg={}) {
        if(typeof Parser!=='function'||typeof beforeHtml!=='string'||typeof afterHtml!=='string'||beforeHtml.length>16777216||afterHtml.length>16777216)return null;
        const current=v210HarvardAnchorCandidates(source,cfg).find(item=>item.id===candidate?.id);
        if(!current||JSON.stringify(current)!==JSON.stringify(candidate))return null;
        const before=new Parser().parseFromString(beforeHtml,'text/html'),after=new Parser().parseFromString(afterHtml,'text/html');
        const targets=doc=>[...doc.querySelectorAll('[id]')].filter(node=>node.getAttribute('id')===candidate.target),oldTargets=targets(before),newTargets=targets(after);
        if(oldTargets.length||newTargets.length!==1)return null;
        const decode=value=>{try{return decodeURIComponent(value);}catch{return value;}},links=doc=>[...doc.querySelectorAll('a[href]')].map(node=>node.getAttribute('href')).filter(href=>href[0]==='#'&&decode(href.slice(1)).replace(/ /g,'_')===candidate.target);
        const oldLinks=links(before),newLinks=links(after);if(!oldLinks.length||JSON.stringify(oldLinks)!==JSON.stringify(newLinks))return null;
        newTargets[0].removeAttribute('id');
        if(before.body.innerHTML!==after.body.innerHTML)return null;
        const proof={kind:'v210-harvard-anchor-native',sourceHash:candidate.sourceHash,sourceLength:source.length,pageTitle:cfg.pageTitle||'',candidateId:candidate.id,proposalSourceHash:candidate.proposalSourceHash,target:candidate.target,targetCountBefore:0,targetCountAfter:1,shortLinks:oldLinks.length,renderingEqual:true,beforeHtmlHash:v24SyntaxHash(beforeHtml),afterHtmlHash:v24SyntaxHash(afterHtml)};
        proof.proofHash=v24SyntaxHash(v210HarvardProofPayload(proof));return proof;
    }
    function v210HarvardAnchorEdits(source,cfg={}) {
        const candidates=v210HarvardAnchorCandidates(source,cfg),proofs=Array.isArray(cfg.harvardAnchorProofs)?cfg.harvardAnchorProofs:[];
        // Each native parse proves one exact-source candidate. A subsequent
        // candidate requires a fresh parse of the resulting source.
        for(const candidate of candidates){const proof=proofs.find(item=>item&&item.kind==='v210-harvard-anchor-native'&&item.sourceHash===candidate.sourceHash&&item.sourceLength===source.length&&item.pageTitle===(cfg.pageTitle||'')&&item.candidateId===candidate.id&&item.proposalSourceHash===candidate.proposalSourceHash&&item.target===candidate.target&&item.targetCountBefore===0&&item.targetCountAfter===1&&item.shortLinks>0&&item.renderingEqual===true&&typeof item.beforeHtmlHash==='string'&&typeof item.afterHtmlHash==='string'&&item.proofHash===v24SyntaxHash(v210HarvardProofPayload(item)));
            if(proof)return [{start:candidate.start,end:candidate.end,text:candidate.after,ruleId:'v210HarvardAnchors',proof:{...proof,condition:'one exact local author and year match; native rendering changes only the missing unique target identifier'}}];}
        return [];
    }
    function v210ReferenceRepairPlan(source,cfg={}) {
        if(typeof source!=='string')throw new TypeError('O texto precisa ser uma string.');
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        for(const [name,find]of [['v210-reference-tag-spacing',v210ReferenceSyntaxEdits],['v210-reference-conflicts',v210ReferenceConflictEdits],['v210-reference-banks',v210ReferenceBankEdits],['v210-harvard-anchors',v210HarvardAnchorEdits]]){
            const before=plan.text,edits=find(before,cfg);if(!edits.length)continue;const after=v24SyntaxApply(before,edits);
            plan.steps.push({name,before,after,edits});plan.edits.push(...edits);plan.text=after;
        }
        return plan;
    }
    function v210ReferenceRepairProjection(source,cfg={}) {return v210ReferenceRepairPlan(source,cfg).text;}
    function v210ReferenceRepairProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const current=v210ReferenceRepairPlan(before,cfg);return current.text===after&&JSON.stringify(current.steps)===JSON.stringify(plan.steps)&&JSON.stringify(current.edits)===JSON.stringify(plan.edits);
    }

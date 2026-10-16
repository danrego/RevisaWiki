    // An offline manifest records a demonstrated citation-family change.
    // Current parameters are never replaced with a historical citation body.
    function v282HistoricalFreeze(value) {if(value&&typeof value==='object'){Object.values(value).forEach(v282HistoricalFreeze);Object.freeze(value);}return value;}
    const V282_HISTORICAL_CITATIONS=v282HistoricalFreeze(__V282_HISTORICAL_MANIFEST__);
    const V282_HISTORICAL_IDENTITY_KEYS=new Set(['título','url','doi','isbn','pmid','pmc','publicado','editora','jornal','periódico','data','ano']);
    function v282HistoricalCitationIdentity(raw) {
        const parsed=parsedTemplate(raw),values=new Map(),allValues=new Map();
        if(!CITE_NAMES[parsed.name])return null;
        for(const field of foreignEntries(parsed)){
            if(field.positional)return null;
            const key=norm(citationParam(field.key,'citation'));
            const value=v24InventorySpace(field.value);
            if(!value)continue;
            if(allValues.has(key)&&allValues.get(key)!==value)return null;allValues.set(key,value);
            if(!V282_HISTORICAL_IDENTITY_KEYS.has(key))continue;
            if(/[{}<>\uE000-\uF8FF]/.test(value))return null;
            values.set(key,value);
        }
        if(!values.has('título')||values.get('título').length<8)return null;
        return JSON.stringify([...values].sort(([a],[b])=>a.localeCompare(b)));
    }
    function v282HistoricalCitationScope(cfg={}) {
        return cfg.historicalCitationRepairs!==false&&cfg.citations!==false&&cfg.references!==false&&
            cfg.namespaceNumber===0&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&!cfg.sectionOnly&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext')&&
            String(cfg.pageTitle||'').normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim()===V282_HISTORICAL_CITATIONS.title;
    }
    function v282HistoricalCitationEdits(source,cfg={}) {
        if(!v282HistoricalCitationScope(cfg)||!/\{\{\s*(?:Predefinição\s*:\s*)?Citation\s*\|/i.test(source))return [];
        const view=protectedView(source),parsed=templates(view);if(parsed.unclosed.length||malformedRefs(view)||/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(view))return [];
        const refBodies=new Map(),identities=new Map(),records=new Map(V282_HISTORICAL_CITATIONS.records.map(record=>[record.identity,record]));
        for(const ref of refTokens(view))if(ref.body!==null){const body=source.slice(ref.openEnd,ref.openEnd+ref.body.length),start=ref.openEnd+body.length-body.trimStart().length,end=ref.openEnd+body.trimEnd().length,key=start+':'+end;if(!refBodies.has(key))refBodies.set(key,ref);else refBodies.set(key,null);}
        for(const node of parsed.nodes){
            const raw=source.slice(node.start,node.end),name=parsedTemplate(raw).name;if(!CITE_NAMES[name])continue;
            const identity=v282HistoricalCitationIdentity(raw);if(identity===null)continue;
            if(!identities.has(identity))identities.set(identity,[]);identities.get(identity).push({node,raw,name});
        }
        const edits=[];
        for(const [identity,calls]of identities){
            if(calls.length!==1)continue;const record=records.get(identity),call=calls[0];
            if(!record||record.repairable===false||call.name!==norm(record.currentFamily)||!['Citar web','Citar jornal','Citar revista'].includes(record.targetFamily))continue;
            const ref=refBodies.get(call.node.start+':'+call.node.end);if(!ref)continue;const attrs=attrsOf(ref.attrs);
            if(!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key))||(attrs.group||'')!==record.group||source.slice(ref.openEnd,ref.openEnd+ref.body.length).trim()!==call.raw)continue;
            const targetProfile=TEMPLATE_CATALOG[norm(record.targetFamily)];
            if(!targetProfile||foreignEntries(parsedTemplate(call.raw)).some(field=>field.positional||field.value.trim()&&!profileAccepts(targetProfile,field.key)))continue;
            const currentFields=foreignEntries(parsedTemplate(call.raw)),additions=record.parametersToAdd||[],urlFields=currentFields.filter(field=>norm(citationParam(field.key,'citation'))==='url'&&field.value.trim());
            if(additions.some(field=>!['url','periódico'].includes(field.key)||!profileAccepts(targetProfile,field.key)||currentFields.some(present=>norm(citationParam(present.key,'citation'))===field.key)||!field.value||/[\uE000-\uF8FF<>{}|\r\n]/.test(field.value)||field.key==='url'&&!/^https?:\/\/[^\s"]+$/i.test(field.value)))continue;
            if(record.targetFamily==='Citar web'&&!urlFields.length&&!additions.some(field=>field.key==='url'))continue;
            const opener=/^\{\{([ \t\r\n]*)([^|{}]+?)([ \t\r\n]*)(?=\||\}\})/.exec(call.raw);if(!opener)continue;
            const start=call.node.start+2+opener[1].length,end=start+opener[2].length;
            const proof={sourceHash:v24SyntaxHash(source),manifest:V282_HISTORICAL_CITATIONS.id,identity,currentFamily:record.currentFamily,targetFamily:record.targetFamily,parametersToAdd:additions,condition:'one complete citation with one historical identity in the confirmed article and reference group; current parameters retained; missing fields added only from their recorded exact source'};
            edits.push({start,end,text:record.targetFamily,ruleId:'citationNames',proof});
            if(additions.length)edits.push({start:call.node.end-2,end:call.node.end-2,text:additions.map(field=>'|'+field.key+'='+field.value).join(''),ruleId:'citationParameters',proof});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v282HistoricalCitationPlan(source,cfg={}) {
        const edits=v282HistoricalCitationEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v282HistoricalCitationProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;
        const fresh=v282HistoricalCitationPlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v282HistoricalCitationProjection(source,cfg={}) {
        if(!v282HistoricalCitationScope(cfg)||!/\{\{\s*(?:Predefinição\s*:\s*)?Citation\s*\|/i.test(source))return source;
        const stage=v25SafeRepairPlan(source,cfg).steps.find(step=>step.name==='v282-historical-citations');return stage?stage.after:source;
    }

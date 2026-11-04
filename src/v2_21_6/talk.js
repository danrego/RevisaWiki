    // Discussion metadata retains explicit human assessments and source revision data.
    function v2216TalkScope(source,cfg={}) {
        return typeof source==='string'&&v2215AliasScope(source,cfg,true)&&cfg.auxiliaryTemplates!==false;
    }
    function v2216TalkNodes(source,predicate) {
        const view=scanProtectedView(source),out=[];
        for(const node of topNodes(view)){
            const raw=source.slice(node.start,node.end);if(!predicate(raw))continue;
            const context=v24SyntaxContext(view,node.start);if(context.html.length||context.tables.length||context.links.length||context.external.length)continue;
            const start=source.lastIndexOf('\n',Math.max(0,node.start-1))+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next;
            let line=view.slice(start,end);for(const other of [...topNodes(line)].reverse())line=line.slice(0,other.start)+line.slice(other.end);
            if(line.trim())continue;out.push({...node,raw});
        }return out;
    }
    function v2216TalkRemoval(source,node) {
        const start=source.lastIndexOf('\n',Math.max(0,node.start-1))+1,next=source.indexOf('\n',node.end),end=next<0?source.length:next;
        return /^[ \t\r]*$/.test(source.slice(start,node.start))&&/^[ \t\r]*$/.test(source.slice(node.end,end))?{start,end:next<0?end:next+1,text:''}:{start:node.start,end:node.end,text:''};
    }
    function v2216TalkHeader(source,cfg={}) {
        const nodes=v2216TalkNodes(source,raw=>v2215PdName(parsedTemplate(raw)?.parts[0]||'')),slots=new Map();
        if(!nodes.length&&![1,11,101].includes(cfg.namespaceNumber))return [];
        for(const node of nodes){const current=v2216LayoutSlots(node.raw);if(!current)return [];
            for(const [key,value] of current){if(slots.has(key)&&slots.get(key).trim()!==value.trim())return [];if(!slots.has(key))slots.set(key,value);}}
        const canonical='{{PD'+[...slots].map(([key,value])=>'|'+key+'='+value).join('')+'}}';
        let body=v24SyntaxApply(source,nodes.map(n=>v2216TalkRemoval(source,n))).replace(/^(?:[ \t]*\r?\n)+/,'');
        const text=canonical+(body?'\n'+body:'');if(text===source)return [];
        return [{start:0,end:source.length,text,kind:'canonical-discussion-header',count:Math.max(1,Math.max(0,nodes.length-1)+(source.startsWith(canonical)&&(!source.slice(canonical.length)||/^\r?\n/.test(source.slice(canonical.length)))?0:1))}];
    }
    function v2216TalkBotSlots(source,node,slots,cfg={}) {
        const records=Array.isArray(cfg.v2216ConfirmedBotAssessments)?cfg.v2216ConfirmedBotAssessments:[],entry=records.find(r=>r&&r.sourceHash===v24SyntaxHash(source)&&r.templateHash===v24SyntaxHash(node.raw)&&r.templateStart===node.start);
        if(!entry)return slots;const next=new Map(slots);
        for(const [field,keys] of [['quality',['1','qualidade']],['reviewDate',['rev']]]){
            const evidence=entry[field];if(!evidence||evidence.confirmedBot!==true||typeof evidence.value!=='string')continue;
            const key=evidence.key||(field==='quality'?(slots.has('1')?'1':'qualidade'):'rev');
            if(!keys.includes(key)||!slots.has(key)||slots.get(key).trim()!==evidence.value)continue;
            if(field==='quality')next.set(key,'?');else next.delete(key);
        }return next;
    }
    function v2216TalkProjectRecord(source,node,cfg={}) {
        let slots=v2216LayoutSlots(node.raw);if(!slots)return null;slots=v2216TalkBotSlots(source,node,slots,cfg);
        const quality=slots.has('1')?slots.get('1'):(slots.get('qualidade')??'?'),projects=[],named=new Map();
        if(slots.has('1')&&slots.has('qualidade')&&slots.get('1').trim()!==slots.get('qualidade').trim())return null;
        const numbers=[...slots.keys()].filter(k=>/^\d+$/.test(k)).map(Number);if(numbers.some(k=>k<1))return null;
        const max=Math.max(1,...numbers);for(let i=2;i<=max;i+=2){
            const name=slots.get(String(i));if(!name||!name.trim()||/[{}\[\]<>\n]/.test(name))return null;
            const rating=slots.get(String(i+1))??'?';if(!/^[?1-4]?$/.test(rating.trim()))return null;projects.push({name:name.trim(),rating:rating.trim()||'?'});
        }
        for(const [key,value] of slots)if(!/^\d+$/.test(key)&&key!=='qualidade')named.set(key,value);
        return {quality:quality.trim()||'?',projects,named};
    }
    function v2216TalkProjects(source,cfg={}) {
        const nodes=v2216TalkNodes(source,raw=>v2216LayoutIdentity(raw)==='marca de projeto');if(!nodes.length)return [];
        const records=nodes.map(n=>v2216TalkProjectRecord(source,n,cfg));if(records.some(x=>!x))return [];
        let quality='?';const projects=new Map(),named=new Map();
        for(const record of records){
            if(!['','?'].includes(record.quality)){if(quality!=='?'&&quality!==record.quality)return [];quality=record.quality;}
            for(const [key,value] of record.named){if(named.has(key)&&named.get(key).trim()!==value.trim())return [];if(!named.has(key))named.set(key,value);}
            for(const project of record.projects){const key=project.name.normalize('NFC').toLocaleLowerCase('pt'),previous=projects.get(key);
                if(previous&&previous.rating!=='?'&&project.rating!=='?'&&previous.rating!==project.rating)return [];
                if(!previous)projects.set(key,{...project});else if(previous.rating==='?'&&project.rating!=='?')previous.rating=project.rating;
            }
        }
        const replacement='{{Marca de projeto|'+quality+[...projects.values()].map(p=>'|'+p.name+'|'+p.rating).join('')+[...named].map(([k,v])=>'|'+k+'='+v).join('')+'}}',edits=[];
        for(let i=0;i<nodes.length;i++)if(nodes[i].raw!==(i?'':replacement))edits.push({...(i?v2216TalkRemoval(source,nodes[i]):nodes[i]),text:i?'':replacement,kind:i?'duplicate-project-marker':'consolidated-project-marker',count:1});
        return edits;
    }
    function v2216TalkTranslations(source) {
        const nodes=v2216TalkNodes(source,raw=>v2216LayoutIdentity(raw)==='traduzido'),edits=[];
        for(const node of nodes){
            const slots=v2216LayoutSlots(node.raw);if(!slots||!slots.has('1')||!slots.has('2'))continue;
            const language=slots.get('1').trim(),page=slots.get('2').trim();if(!/^[a-z][a-z0-9-]{1,19}$/.test(language)||!page||/[\r\n{}<>]/.test(page))continue;
            const nativePage=slots.get('página')??slots.get('texto')??slots.get('Texto'),nativeLanguage=slots.get('cód_idioma');
            if(nativePage!==undefined&&nativePage.trim()!==page||nativeLanguage!==undefined&&nativeLanguage.trim()!==language)continue;
            const fields=[];for(const [key,value] of slots){if(['1','2','página','texto','Texto','cód_idioma'].includes(key))continue;fields.push('|'+key+'='+value);}
            const text='{{Traduzido|página='+page+'|cód_idioma='+language+fields.join('')+'}}';
            if(text!==node.raw)edits.push({...node,text,kind:'native-translation-attribution',count:1});
        }return edits;
    }
    function v2216TalkPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],steps:[]};if(!v2216TalkScope(source,cfg))return empty;
        let text=source;const steps=[];
        // Bot provenance is bound to the original source, before any header movement.
        for(const [kind,fn] of [['projects',s=>v2216TalkProjects(s,cfg)],['translations',v2216TalkTranslations],['header',s=>v2216TalkHeader(s,cfg)]]){
            const edits=fn(text).sort((a,b)=>a.start-b.start||a.end-b.end);if(edits.some((e,i)=>i&&e.start<edits[i-1].end))continue;
            const next=v24SyntaxApply(text,edits);if(next!==text){steps.push({kind,sourceHash:v24SyntaxHash(text),edits});text=next;}
        }
        if(text===source)return empty;return {...empty,text,steps,edits:[{start:0,end:source.length,text,ruleId:'v2216Talk',count:steps.reduce((n,s)=>n+s.edits.reduce((a,e)=>a+(e.count??1),0),0),proof:{sourceHash:empty.sourceHash,kinds:steps.map(s=>s.kind)}}]};
    }
    function v2216TalkProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2216TalkPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v25TalkPreparationPlan(source,article='',cfg={}) {
        const initial=v2216TalkPlan(source,cfg),result=v2216BaselineTalkPreparationPlan(initial.text,article,cfg),final=v2216TalkPlan(result.text,cfg),text=final.text;
        return {...result,source,text,changed:text!==source,
            summary:v2216TalkNodes(text,raw=>v2216LayoutIdentity(raw)==='marca de projeto').length?'{{PD}}{{Marca de projeto}}':'{{PD}}'};
    }

    // Finite expansion of one imported encyclopedia wrapper. Its defaults
    // are preserved as explicit native fields, without foreign tracking tags.
    function v214NSRWCall(raw,cfg={}) {
        const result={text:raw,accepted:false};
        if(!v212ReferenceFieldScope(cfg)||cfg.citations===false||cfg.citationRepairs===false||typeof raw!=='string'||raw.length>4096||
            !/^\{\{[\s\S]*\}\}$/.test(raw)||/[{}]/.test(raw.slice(2,-2))||/[<>\[\]`\u0000-\u001f\u007f-\u009f\uE000-\uF8FF]/.test(raw.replace(/[\t\r\n]/g,'')))return result;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts||parts.length<2)return result;
        const head=parts[0].text.trim().replace(/_/g,' ').replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        if(!/^[Cc]ite NSRW$/.test(head))return result;
        const fields=Object.create(null),allowed=new Set(['wstitle','display','short','no-icon','noicon','vb','inline']);
        for(const part of parts.slice(1)){
            const m=/^\s*([a-z-]+)\s*=([\s\S]*)$/.exec(part.text);if(!m||!allowed.has(m[1])||Object.hasOwn(fields,m[1]))return result;
            const value=m[2].trim();if(/[\r\n|{}<>\[\]`]/.test(value)||value.length>512)return result;fields[m[1]]=value;
        }
        if(Object.hasOwn(fields,'display')&&!fields.display)return result;
        if(Object.values(fields).some(value=>value.includes("''")))return result;
        if(!fields.wstitle||!/[\p{L}\p{N}]/u.test(fields.wstitle)||/[:#%\\]/.test(fields.wstitle)||fields.wstitle.startsWith('/')||fields.wstitle.includes('..'))return result;
        if(Object.hasOwn(fields,'no-icon')&&Object.hasOwn(fields,'noicon'))return result;
        // These wrapper options test emptiness, not a language-specific truth
        // value. Keep only the common literal forms and retain the same test.
        for(const key of ['short','no-icon','noicon','vb','inline'])if(Object.hasOwn(fields,key)&&!['','1','y','yes','true'].includes(fields[key]))return result;
        const work="The New Student's Reference Work",title=fields.display||fields.wstitle;
        const chapter='[[s:en:'+work+'/'+fields.wstitle+'|'+title+']]',book='[[s:en:'+work+'|'+work+']]';
        const metadata=fields.short?'':'|editor-nome=Chandler B.|editor-sobrenome=Beach|local=Chicago|editora=F. E. Compton and Co';
        const prefix=fields.vb?(fields.inline?'Uma ou mais das frases anteriores incorporam texto de uma publicação em [[domínio público]]: ':'Este artigo incorpora texto de uma publicação em [[domínio público]]: '):'';
        return {text:prefix+'{{Citar enciclopédia|título='+chapter+'|enciclopédia='+book+'|ano=1914'+metadata+'}}',accepted:true,
            fields:{...fields},proof:{template:'Cite NSRW',oldid:60696160,work,year:'1914',title:fields.wstitle,label:title,
                condition:'literal known wrapper; unique supported fields; complete work defaults; optional public-domain attribution retained; explicit English Wikisource target'}};
    }
    function v214NSRWEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v212ReferenceFieldScope(cfg)||cfg.citations===false||cfg.citationRepairs===false||
            !/\{\{\s*(?:(?:Predefinição|Template)\s*:\s*)?[Cc]ite[ _]NSRW\s*\|/.test(source))return [];
        const shield=v29ReferenceShield(source);if(shield.unclosed.length||v24SyntaxScan(source).issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view)||/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(shield.view))return [];
        const all=templates(shield.view);if(all.unclosed.length)return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const node of all.nodes){
            if(v29ReferenceOverlap(node.start,node.end,shield.ranges)||all.nodes.some(parent=>parent.start<node.start&&parent.end>=node.end))continue;
            const raw=source.slice(node.start,node.end),call=v214NSRWCall(raw,cfg);if(!call.accepted||call.text===raw)continue;
            edits.push({start:node.start,end:node.end,text:call.text,ruleId:'v214NSRWCitation',proof:{...call.proof,sourceHash,before:raw,after:call.text}});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v214NSRWPlan(source,cfg={}) {
        const edits=v214NSRWEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v214NSRWProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v214NSRWPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v214NSRWInventory(source,cfg={}) {
        const counts=new Map(),view=protectedView(source),nodes=templates(view).nodes;
        for(const node of nodes){
            if(nodes.some(parent=>parent.start<node.start&&parent.end>=node.end))continue;
            const raw=source.slice(node.start,node.end),original=v214NSRWCall(raw,cfg),marker='{{Citar enciclopédia|';
            let text,prefix='';
            if(original.accepted){const at=original.text.indexOf(marker);prefix=original.text.slice(0,at);text=original.text.slice(at);}
            else{
                const parsed=parsedTemplate(raw);if(parsed.name!=='citar enciclopédia')continue;text=raw;
                for(const known of ['Este artigo incorpora texto de uma publicação em [[domínio público]]: ','Uma ou mais das frases anteriores incorporam texto de uma publicação em [[domínio público]]: '])
                    if(source.slice(Math.max(0,node.start-known.length),node.start)===known){prefix=known;break;}
            }
            const key=JSON.stringify([v24InventoryBody(text,cfg),v24InventoryText(prefix,cfg)]);counts.set(key,(counts.get(key)||0)+1);
        }
        return counts;
    }
    function v214NSRWRetention(before,after,options={}) {
        if(typeof before!=='string'||!/\{\{\s*(?:(?:Predefinição|Template)\s*:\s*)?[Cc]ite[ _]NSRW\s*\|/.test(before))return {accepted:true,reason:''};
        const cfg={...DEFAULTS,...options},steps=v25SafeRepairPlan(before,cfg).steps.filter(step=>step.name==='v214-nsrw-native-citation');
        if(!steps.length)return {accepted:true,reason:''};
        const actual=v214NSRWInventory(after,cfg);
        for(const step of steps){
            const wanted=v214NSRWInventory(step.after,cfg),changed=new Set();
            for(const edit of step.edits)for(const key of v214NSRWInventory(edit.text,cfg).keys())changed.add(key);
            for(const key of changed)if((actual.get(key)||0)<(wanted.get(key)||0))return {accepted:false,reason:'Uma citação adaptada perdeu dados da obra, a ligação para a fonte ou a indicação de domínio público.'};
        }
        return {accepted:true,reason:''};
    }
    function v214NSRWCount(before,after,topics=[]) {
        const cfg={...DEFAULTS,namespaceNumber:0},plan=v214NSRWPlan(before,cfg);if(!plan.edits.length||plan.text!==after)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after);let delta=0;
        const events=plan.edits.map(edit=>{const start=edit.start+delta;delta+=edit.text.length-(edit.end-edit.start);return {
            id:sourceHash+':citation-structure:'+edit.start+':'+edit.end,rule:'retained-citation-structure',kind:'citation-structure',label:'Citação de enciclopédia adaptada',sourceHash,outputHash,
            sourceAnchors:[{start:edit.start,end:edit.end}],outputAnchors:[{start,end:start+edit.text.length}],before:before.slice(edit.start,edit.end),after:edit.text,
            fragments:[{start:edit.start,end:edit.end,newStart:start,newEnd:start+edit.text.length,before:before.slice(edit.start,edit.end),after:edit.text}]
        };});
        return {count:events.length,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:events.length,totalFragments:events.length,unresolvedFragments:0,unresolved:[],text:events.length+' '+(events.length===1?'ajuste aplicado':'ajustes aplicados')};
    }

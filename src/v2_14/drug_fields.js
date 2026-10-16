    const V214_DRUG_COMPOSITION_KEYS=new Set(
        "h he li be b c n o f ne na mg al si p s cl ar k ca sc ti v cr mn fe co ni cu zn ga ge as se br kr rb sr y zr nb mo tc ru rh pd ag cd in sn sb te i xe cs ba la ce pr nd pm sm eu gd tb dy ho er tm yb lu hf ta w re os ir pt au hg tl pb bi po at rn fr ra ac th pa u np pu am cm bk cf es fm md no lr rf db sg bh hs mt ds rg cn nh fl mc lv ts og uub uut uuq uup uuh uus uuo charge carga".split(' '));
    const V214_DRUG_FIELDS=/*__DRUG_FIELD_CONTRACT__*/;
    function v214DrugScope(cfg={}) {
        return v24SyntaxScope(cfg)&&cfg.namespaceNumber===0&&cfg.infoboxes!==false&&cfg.automaticParameterNames!==false&&
            cfg.markup!==false&&!cfg.discussionPage&&!cfg.sectionOnly&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='');
    }
    function v214DrugContext(head) {
        const name=head.trim().replace(/_/g,' ').replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        const id=/^[Ii]nfo\/Droga$/.test(name)?'drug':/^(?:[Ii]nfo\/Química|[Cc]hembox)$/.test(name)?'chem':
            /^[Cc]hembox Identifiers$/.test(name)?'identifiers':/^[Cc]hembox Pharmacology$/.test(name)?'pharmacology':/^[Cc]hembox Properties$/.test(name)?'properties':null;
        const context=id&&V214_DRUG_FIELDS.contexts[id];if(!context)return null;
        if(context.catalog&&(INFOBOX_CATALOG[context.catalog]?.oldid!==context.oldid||INFOBOX_CATALOG[context.catalog]?.partial))return null;
        return {id,...context};
    }
    function v214DrugFields(raw) {
        if(typeof raw!=='string'||raw.length>262144||!raw.startsWith('{{')||!raw.endsWith('}}')||/<!--|\{\{\{|[\uE000-\uF8FF]/.test(raw))return null;
        const p=parsedTemplate(raw),context=v214DrugContext(p.parts[0]);if(!context)return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const fields=[];
        for(const part of parts.slice(1)){
            const m=/^(\s*)([^={}\[\]<>\r\n]+?)(\s*=\s*)([\s\S]*)$/.exec(part.text);if(!m){if(part.text.trim())return null;continue;}
            const lead=m[1].length,tail=m[2].length-m[2].trimEnd().length;
            fields.push({key:m[2].trim(),value:m[4],start:2+part.start+lead,end:2+part.start+lead+m[2].length-tail,valueStart:2+part.start+lead+m[2].length+m[3].length});
        }
        return {p,fields,context};
    }
    function v214DrugCAS(value) {
        if(!/^\d{2,7}-\d{2}-\d$/.test(value))return false;
        const digits=value.replace(/-/g,''),check=+digits.at(-1);return [...digits.slice(0,-1)].reverse().reduce((sum,digit,index)=>sum+(+digit)*(index+1),0)%10===check;
    }
    function v214DrugValue(type,raw) {
        const value=raw.trim();if(!value||value.length>16384||/\uE000|\uE001|<!--|-\{|\}-/.test(value)||/^(?:none|no|yes|true|false|0|-|n\/a)$/i.test(value))return false;
        if(value.includes('{{')){const inner=templates(protectedView(value));if(inner.unclosed.length||inner.nodes.some(node=>!CITE_NAMES[parsedTemplate(value.slice(node.start,node.end)).name]))return false;}
        if(type==='cas')return v214DrugCAS(value);
        if(type==='cas-list')return value.split(/,\s*/).length<=8&&value.split(/,\s*/).every(v214DrugCAS);
        if(type==='atc-prefix')return /^[A-Z]\d{2}$/.test(value);
        if(type==='atc-suffix')return /^[A-Z]{2}\d{2}$/.test(value);
        if(type==='atc')return /^[A-Z]\d{2}[A-Z]{2}\d{2}$/.test(value);
        if(type==='integer')return /^[1-9]\d{0,11}$/.test(value);
        if(type==='inchi')return /^1S\/[A-Za-z0-9/().,;*+\-]+$/.test(value);
        if(type==='inchi-key')return /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/.test(value);
        if(type==='smiles')return value.length<=8192&&/^[A-Za-z0-9@+\-\[\]()\\/.=%#$:*]+$/.test(value);
        if(type==='file')return value.length<=240&&!/[\r\n\[\]{}<>|:#?\\]/.test(value)&&!/^https?:/i.test(value)&&/\.(?:svg|png|jpe?g|gif|webp|tiff?)$/i.test(value);
        if(type==='class')return value.length<=120&&/^[A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z][A-Za-z0-9_-]*)*$/.test(value);
        if(type==='clinical'&&/^[A-Za-z]$/.test(value))return false;
        if(type==='reference')return /^<ref(?:\s[^>]*)?>[\s\S]+<\/ref\s*>$/.test(value)&&!/<ref\b[\s\S]*<ref\b/i.test(value);
        return /[\p{L}\p{N}]/u.test(value);
    }
    function v214DrugCall(raw,cfg={}) {
        const result={text:raw,edits:[]};if(!v214DrugScope(cfg))return result;
        const parsed=v214DrugFields(raw);if(!parsed)return result;
        const {fields,context}=parsed,rules=V214_DRUG_FIELDS.rules[context.id],fingerprint=key=>key.normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').toLocaleLowerCase('pt'),family=rule=>{const keys=new Set([rule.target,...(rule.nativeAliases||[]),...rule.aliases].map(fingerprint));return fields.filter(field=>keys.has(fingerprint(field.key)));};
        const resolved=target=>{const rule=rules.find(rule=>rule.target===target);if(!rule)return null;const matches=family(rule);return matches.length===1&&v214DrugValue(rule.type,matches[0].value)?matches[0]:null;};
        for(const rule of rules){
            const found=family(rule);if(found.length!==1||!rule.aliases.includes(found[0].key)||found[0].key===rule.target||(rule.nativeAliases||[]).includes(found[0].key)||!v214DrugValue(rule.type,found[0].value))continue;
            if(rule.requires&&!resolved(rule.requires))continue;
            if(rule.type==='formula'&&fields.some(field=>V214_DRUG_COMPOSITION_KEYS.has(field.key.toLowerCase())&&field.value.trim()))continue;
            if(rule.requiresATC){const prefix=context.id==='drug'?'prefixo_ATC':'ATCCode_prefix',suffix=context.id==='drug'?'sufixo_ATC':'ATCCode_suffix';if(!resolved(prefix)||!resolved(suffix))continue;}
            if((rule.singleImageAliases||[]).includes(found[0].key)&&fields.some(field=>field.value.trim()&&/^(?:ImageFile(?:[123]|[LR][123])|image[2LR]|Imagen2|imagen[23])$/.test(field.key)))continue;
            const field=found[0],ruleId=rule.requiresATC?'v214DrugATCSupplement':'v214DrugParameters';
            result.edits.push({start:field.start,end:field.end,text:rule.target,ruleId,before:field.key,after:rule.target,context:context.id,type:rule.type});
        }
        result.edits.sort((a,b)=>a.start-b.start);result.text=v24SyntaxApply(raw,result.edits);return result;
    }
    function v214DrugCaseRefusal(raw,key,target,cfg={}) {
        if(!v214DrugScope(cfg))return false;
        const parsed=v214DrugFields(raw);if(!parsed)return false;
        const rule=V214_DRUG_FIELDS.rules[parsed.context.id].find(rule=>rule.target===target&&rule.aliases.includes(key));if(!rule)return false;
        return !v214DrugCall(raw,cfg).edits.some(edit=>edit.before===key&&edit.after===target);
    }
    function v214DrugOwner(source,node,nodes) {
        const parents=nodes.filter(parent=>parent.start<node.start&&parent.end>=node.end).sort((a,b)=>(a.end-a.start)-(b.end-b.start));
        if(!parents.length)return true;if(parents.length!==1)return false;
        const parsed=v214DrugFields(source.slice(parents[0].start,parents[0].end));if(parsed?.context.id!=='chem')return false;
        const relative=node.start-parents[0].start,ending=node.end-parents[0].start;
        return parsed.fields.some(field=>/^Section(?:[1-9]|1[0-5])$/.test(field.key)&&field.value.trim()===source.slice(node.start,node.end)&&field.valueStart<=relative&&field.valueStart+field.value.length>=ending);
    }
    function v214DrugEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v214DrugScope(cfg)||!/[|]\s*(?:ATC_supplemental|[\p{L}][\p{L}\d _-]{0,70})\s*=/u.test(source)||
            !/\{\{\s*(?:(?:Predefinição|Template)\s*:\s*)?(?:[Ii]nfo\/(?:Droga|Química)|[Cc]hembox(?: Identifiers| Pharmacology| Properties)?)\s*[|\r\n]/.test(source))return [];
        const shield=v29ReferenceShield(source),parsed=templates(shield.view);if(shield.unclosed.length||parsed.unclosed.length||v24SyntaxScan(source).issues.length||
            /<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view)||/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(shield.view))return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const node of parsed.nodes){
            if(!v214DrugOwner(source,node,parsed.nodes))continue;
            const raw=source.slice(node.start,node.end),call=v214DrugCall(raw,cfg);
            if(shield.ranges.some(range=>range.start<=node.start&&range.end>=node.end)||call.edits.some(edit=>v29ReferenceOverlap(node.start+edit.start,node.start+edit.end,shield.ranges)))continue;
            const context=v214DrugFields(raw)?.context;
            for(const edit of call.edits)edits.push({...edit,start:node.start+edit.start,end:node.start+edit.end,proof:{sourceHash,before:raw,after:call.text,
                oldid:context.oldid,fieldBefore:edit.before,fieldAfter:edit.after,condition:'one verified native chemistry or drug model; literal role-checked value; unique field family; all original data and field order retained'}});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v214DrugPlan(source,cfg={}) {
        const edits=v214DrugEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v214DrugProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v214DrugPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v214DrugInventory(source,cfg={}) {
        const view=protectedView(source),keys=[];
        for(const node of templates(view).nodes){
            const raw=source.slice(node.start,node.end);if(!v214DrugContext(parsedTemplate(raw).parts[0]))continue;
            const canonical=mapTemplateTree(v214DrugCall(raw,cfg).text,part=>v24InventoryTemplate(part,cfg)),p=parsedTemplate(canonical);
            keys.push(JSON.stringify([p.name,foreignEntries(p).map(entry=>[entry.key,entry.value.trim()])]));
        }
        return v24InventoryCount(keys);
    }
    function v214DrugObjectProof(plan,expected,actual) {
        if(!(plan.safe?.steps||[]).some(step=>step.name==='v214-drug-fields'))return {accepted:true,reason:''};
        return v24InventoryContains(v214DrugInventory(expected,plan.cfg),v214DrugInventory(actual,plan.cfg))?{accepted:true,reason:''}:
            {accepted:false,reason:'Uma infocaixa corrigida perdeu ou alterou um identificador, fórmula, dado farmacológico ou outra informação fora do ajuste confirmado.'};
    }
    function v214DrugCount(before,after,topics=[]) {
        const plan=v214DrugPlan(before,{...DEFAULTS,namespaceNumber:0});if(!plan.edits.length||plan.text!==after)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after);let shift=0;
        const events=plan.edits.map(edit=>{const start=edit.start+shift;shift+=edit.text.length-(edit.end-edit.start);return {
            id:sourceHash+':parameter-name:'+edit.start+':'+edit.end,rule:'retained-parameter-name',kind:'parameter-name',label:'Parâmetro de infocaixa química ou farmacológica',sourceHash,outputHash,
            sourceAnchors:[{start:edit.start,end:edit.end}],outputAnchors:[{start,end:start+edit.text.length}],before:before.slice(edit.start,edit.end),after:edit.text,
            fragments:[{start:edit.start,end:edit.end,newStart:start,newEnd:start+edit.text.length,before:before.slice(edit.start,edit.end),after:edit.text}]
        };});
        return {count:events.length,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:events.length,totalFragments:events.length,unresolvedFragments:0,unresolved:[],text:events.length+' '+(events.length===1?'ajuste aplicado':'ajustes aplicados')};
    }

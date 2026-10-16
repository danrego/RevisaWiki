"""Count reference entries per collector and add bounded responsive columns."""

ENGINE = r'''
    const V211_REFERENCE_COLUMN_STYLE='column-count:2;column-width:30em;column-gap:2em;max-width:62em;';
    function v211ReferenceCollectorCounts(source) {
        const view=protectedView(source),renderers=rendererRanges(view),records=[],byNode=new Map();let globallyUncertain=false;
        const literal=value=>typeof value==='string'&&!/[{}<>\uE000]/.test(value);
        const push=(node,name,group,confirmed,entries=[])=>{
            const row={start:node.start,end:node.end,template:name,group,count:0,confirmed,reasons:[],fields:entries,uses:new Set()};
            if(!confirmed)row.reasons.push('uncertain-renderer');records.push(row);if(!byNode.has(node.start))byNode.set(node.start,[]);byNode.get(node.start).push(row);return row;
        };
        for(const node of renderers){
            if(renderers.some(other=>other!==node&&other.start<=node.start&&other.end>=node.end))continue;
            const raw=view.slice(node.start,node.end);
            if(raw.startsWith('<')){
                const tag=tagAt(view,node.start),attrs=tag&&attrsOf(tag.attrs),group=attrs?.group||'';
                if(!attrs||!literal(group)){globallyUncertain=true;continue;}push(node,'references-tag',decodedReferenceName(group),true);continue;
            }
            const parsed=parsedTemplate(raw),entries=foreignEntries(parsed),groups=entries.filter(e=>['grupo','group'].includes(norm(e.key)));
            const group=groups[0]?.value.trim()||'',confirmed=groups.length<=1&&literal(group)&&!groups.some(e=>norm(e.key)==='group');
            if(!confirmed){globallyUncertain=true;continue;}
            if(['referências','referencias'].includes(parsed.name))push(node,parsed.name,decodedReferenceName(group),true,entries);
            else if(parsed.name==='notas e referências'){
                push(node,parsed.name,'',true,entries);
                for(const name of [...new Set(['nota','lower-alpha',group||'Nota','nt'])])push(node,'combined-notes',name,true,entries);
            }else if(parsed.name==='notas'){
                push(node,parsed.name,decodedReferenceName(group||'nota'),true,entries);if(group!=='lower-alpha')push(node,'notes-lower-alpha','lower-alpha',true,entries);
            }else globallyUncertain=true;
        }
        records.sort((a,b)=>a.start-b.start||a.group.localeCompare(b.group));
        const next=(at,group)=>records.find(row=>row.start>at&&row.group===group),uncertain=(at,group,reason)=>{
            const row=next(at,group);if(row){row.confirmed=false;if(!row.reasons.includes(reason))row.reasons.push(reason);}
        };
        const refs=refTokens(view),nodes=templates(view).nodes,definitions=new Map(),uses=[];
        for(const ref of refs){
            const parent=renderers.find(n=>n.start<=ref.start&&ref.end<=n.end),parentRows=parent&&byNode.get(parent.start),attrs=attrsOf(ref.attrs);
            if(!attrs){globallyUncertain=true;continue;}
            let group=attrs.group||'';
            if(parentRows&&Object.hasOwn(attrs,'group')&&parentRows.every(row=>row.group!==decodedReferenceName(group))){parentRows.forEach(row=>{row.confirmed=false;row.reasons.push('reference-bank-group-mismatch');});continue;}
            if(!group&&parentRows)group=parentRows.find(row=>['referências','referencias','notas e referências','references-tag'].includes(row.template))?.group||parentRows[0].group;
            if(!literal(group)||attrs.name&&!literal(attrs.name)){globallyUncertain=true;continue;}
            group=decodedReferenceName(group);const name=attrs.name?decodedReferenceName(attrs.name):'';
            if(attrs.follow||attrs.details){if(parentRows)parentRows.forEach(row=>{row.confirmed=false;row.reasons.push('continuation-reference');});else uncertain(ref.start,group,'continuation-reference');continue;}
            if(ref.body!==null&&ref.body.trim()&&name){
                const key=group+'\0'+name;if(!definitions.has(key))definitions.set(key,new Set());definitions.get(key).add(ref.body.trim());
            }
            if(parent)continue;
            if(nodes.some(node=>node.start<ref.start&&node.end>=ref.end))uncertain(ref.start,group,'reference-template-context');
            uses.push({ref,group,name});
        }
        for(const {ref,group,name}of uses){
            const row=next(ref.start,group);if(!row)continue;
            if(name&&(/^\d+$/.test(name)||definitions.get(group+'\0'+name)?.size!==1)){row.confirmed=false;row.reasons.push('unconfirmed-definition');continue;}
            if(!name&&(ref.body===null||!ref.body.trim())){row.confirmed=false;row.reasons.push('empty-reference');continue;}
            row.uses.add(name?'named:'+name:'anonymous:'+ref.start);
        }
        for(const node of nodes){
            const p=parsedTemplate(view.slice(node.start,node.end));
            if(/^#tag\s*:\s*references$/.test(p.name)){globallyUncertain=true;continue;}
            if(!['sfn','sfnp','sfnm','sfnmp','refn','nre','efn'].includes(p.name)||refs.some(ref=>ref.start<=node.start&&ref.end>=node.end))continue;
            const fields=foreignEntries(p),groups=fields.filter(e=>['grupo','group'].includes(norm(e.key))),group=groups[0]?.value.trim()||(['nre','efn'].includes(p.name)?'lower-alpha':'');
            if(groups.length>1||!literal(group)){globallyUncertain=true;continue;}uncertain(node.start,decodedReferenceName(group),'indirect-reference');
        }
        if(malformedRefs(view))globallyUncertain=true;
        for(const row of records){
            const banks=row.fields.filter(e=>norm(e.key)==='refs');
            if(banks.length>1){row.confirmed=false;row.reasons.push('duplicate-reference-bank');}
            for(const bank of banks){
                const bankView=protectedView(bank.value),bankRefs=refTokens(bankView),residue=applyEdits(bankView,bankRefs.map(ref=>({start:ref.start,end:ref.end,text:''})));
                if(residue.trim()){row.confirmed=false;row.reasons.push('indirect-reference-bank');}
            }
            if(globallyUncertain){row.confirmed=false;row.reasons.push('uncertain-reference-scope');}
            row.count=row.uses.size;delete row.uses;
        }
        return records;
    }
    function v211ReferenceColumnStyle(value) {
        if(!value.trim())return {manual:false,safe:true};
        if(/(?:^|;)\s*(?:(?:-moz-|-webkit-)?column-(?:count|width|gap|fill|span)|columns)\s*:/i.test(value))return {manual:true,safe:true};
        if(/[{}<>\uE000\r\n]|\/\*|\*\//.test(value))return {manual:false,safe:false};
        const allowed=new Set(['color','background-color','font-size','font-family','font-weight','font-style','line-height','text-align']);
        for(const declaration of value.split(';').map(v=>v.trim()).filter(Boolean)){
            const m=declaration.match(/^([a-z-]+)\s*:\s*([^;]+)$/i);if(!m||!allowed.has(m[1].toLowerCase())||/url\s*\(|expression\s*\(|!important/i.test(m[2]))return {manual:false,safe:false};
        }
        return {manual:false,safe:true};
    }
    function v211ReferenceCollectorContext(source,row,ranges) {
        if(inRangeExcept(row.start,ranges,row.start,row.end))return false;
        const prefix=protectedView(source.slice(0,row.start)),stack=[];
        for(let at=0;at<prefix.length;){
            const tag=tagAt(prefix,at);if(!tag){at++;continue;}at=tag.end;
            if(!['div','table','ol','ul'].includes(tag.name)||tag.self)continue;
            if(tag.close){if(stack[stack.length-1]!==tag.name)return false;stack.pop();}else stack.push(tag.name);
        }
        if(stack.length)return false;
        let columns=0;
        for(const node of topNodes(prefix)){
            const name=parsedTemplate(prefix.slice(node.start,node.end)).name;
            if(['div col','inícioref','inicioref','refbegin','multicol','column'].includes(name))columns++;
            if(['div col fim','-fim','refend','multicol-end','column-end'].includes(name)){if(!columns)return false;columns--;}
        }
        return !columns;
    }
    function v211ReferenceColumnPlans(source,options={},legacyOnly=false) {
        const cfg={...DEFAULTS,...options};if(!cfg.references||!cfg.referenceColumns)return [];
        if(cfg.sectionOnly||!v20AutomationAllowed(source,cfg))return [];
        const records=v211ReferenceCollectorCounts(source),ranges=structuralRanges(protectedView(source)),plans=[];
        for(const row of records){
            if(!['referências','referencias'].includes(row.template)||!v211ReferenceCollectorContext(source,row,ranges))continue;
            const raw=source.slice(row.start,row.end),p=parsedTemplate(raw),entries=foreignEntries(p),old=entries.filter(e=>LEGACY_REFERENCE_COLUMNS.has(norm(e.key))),styles=entries.filter(e=>norm(e.key)==='estilo'||e.key==='5');
            if(legacyOnly&&!old.length||!legacyOnly&&old.length)continue;
            if(styles.length>1)continue;const style=styles[0]?.value||'',layout=v211ReferenceColumnStyle(style);
            let changed=false;if(legacyOnly){for(const entry of old)entry.remove=true;changed=true;}
            if(row.confirmed&&row.count>=REFERENCE_COLUMN_MINIMUM&&layout.safe&&!layout.manual){
                const target=style.replace(/;+\s*$/,'').trim()+(style.trim()?';':'')+V211_REFERENCE_COLUMN_STYLE;
                if(styles.length)styles[0].value=target;else{entries.push({index:p.parts.length,key:'estilo',value:target,lead:'',eq:'='});p.parts.push('');}changed=true;
            }
            if(changed){const after=translatedEntries(p,entries);if(after!==raw)plans.push({start:row.start,end:row.end,before:raw,after,group:row.group,count:row.count,confirmed:row.confirmed,code:'',message:''});}
        }
        return plans;
    }
'''


def once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('columns patch anchor: ' + repr(old[:100]))
    return source.replace(old, new, 1)


def apply(source):
    source = once(source, '    const REFERENCE_COLUMN_MINIMUM = 6;', '    const REFERENCE_COLUMN_MINIMUM = 10;\n' + ENGINE)
    start = source.index('    function referenceColumnPlans(source, options = {}) {')
    end = source.index('    function referenceColumns(source, cfg, bump)', start)
    source = source[:start] + '    function referenceColumnPlans(source,options={}) {return v211ReferenceColumnPlans(source,options);}\n' + source[end:]
    start = source.index('    function automaticLegacyReferenceColumns(source,cfg,bump=()=>{}) {')
    end = source.index('\n    function ', start + 15)
    source = source[:start] + '''    function automaticLegacyReferenceColumns(source,cfg,bump=()=>{}) {
        if(!cfg.references||cfg.referenceColumns===false||cfg.sectionOnly||!v20AutomationAllowed(source,cfg))return source;
        const edits=v211ReferenceColumnPlans(source,cfg,true);for(const edit of edits)bump('legacyReferenceColumns');
        return applyEdits(source,edits.map(edit=>({start:edit.start,end:edit.end,text:edit.after})));
    }
''' + source[end:]
    source = once(source, "referenceColumns: 'Referências em duas colunas',", "referenceColumns: 'Referências com dez entradas ou mais em até duas colunas',")
    source = once(source, "['referenceColumns', 'Duas colunas em listas de referências com seis ou mais entradas']", "['referenceColumns', 'Até duas colunas em cada lista com dez ou mais entradas']")
    start = source.index('    async function prepareReferenceColumns(task, options) {')
    end = source.index('    async function prepareEndMatter(task, options)', start)
    source = source[:start] + '''    async function prepareReferenceColumns(task,options) {
        // O modelo combinado conserva o controle nativo de colunas.
        // Uma consulta ao antigo col_ref não comprova o novo contrato responsivo.
        task.guard();return {...options};
    }

''' + source[end:]
    source = once(source, 'referenceEntryCounts, referenceColumnPlans, referenceColumns,', 'v211ReferenceCollectorCounts,v211ReferenceColumnPlans,v211ReferenceColumnStyle,referenceColumnMinimum:REFERENCE_COLUMN_MINIMUM,referenceColumnStyle:V211_REFERENCE_COLUMN_STYLE,\n        referenceEntryCounts, referenceColumnPlans, referenceColumns,')
    return source

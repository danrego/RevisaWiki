    const V215_TEMPLATE_CONTRACT=Object.freeze(/*__TEMPLATE_DEFINITION_CONTRACT__*/);
    function v215TemplateDefinitionScope(cfg={}) {
        const context=v215TemplatePageContext(cfg);
        const enabled=cfg.templateDefinitionInputEnabled??(cfg.templateDefinitionRepairs!==false&&cfg.syntaxRepairs!==false&&cfg.structuralRepairs!==false&&cfg.markup!==false);
        return context.definition&&enabled&&!cfg.sectionOnly&&!cfg.discussionPage&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v215TemplateDataScope(cfg={}) {
        const context=v215TemplatePageContext(cfg);
        const enabled=cfg.templateDefinitionInputEnabled??(cfg.templateDefinitionRepairs!==false&&cfg.syntaxRepairs!==false&&cfg.structuralRepairs!==false&&cfg.markup!==false);
        return (context.definition||context.documentation)&&enabled&&!cfg.sectionOnly&&!cfg.discussionPage&&!cfg.pageRedirect&&
            !cfg.pageDisambiguation&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext');
    }
    function v215TemplateDefinitionContext(source,cfg={}) {
        if(typeof source!=='string'||source.length>1048576||!v215TemplateDataScope(cfg))return null;
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),braces=v215BraceStructure(source);
        if(shield.unclosed.length||braces.unclosed.length)return null;
        const opaque=[...shield.ranges,...markdown],view=v24SyntaxMaskRanges(source,opaque),stack=[],inclusions=[],stray=[];
        for(let at=0;at<view.length;){const tag=v24SyntaxTag(view,at);if(!tag){at++;continue;}at=tag.end;
            if(!['noinclude','includeonly','onlyinclude'].includes(tag.name))continue;
            if(tag.typo||tag.attrs.trim())return null;
            if(tag.self){if(tag.close)return null;inclusions.push({...tag,opening:tag,self:true});continue;}
            if(!tag.close)stack.push(tag);
            else if(stack.at(-1)?.name===tag.name){const opening=stack.pop();inclusions.push({start:opening.start,end:tag.end,name:tag.name,opening,closing:tag,depth:stack.length});}
            else stray.push(tag);
        }
        if(stack.length)return null;
        const syntax=v24SyntaxScan(source);
        if(syntax.issues.some(issue=>!(issue.code==='syntax-stray-tag'&&stray.some(tag=>tag.start===issue.start&&tag.name==='noinclude'))))return null;
        return {source,sourceHash:v24SyntaxHash(source),shield,opaque,view,braces,inclusions,stray,
            blocked:(start,end)=>opaque.some(range=>range.start<end&&range.end>start),
            blockedExecutable:(start,end)=>opaque.some(range=>range.start<end&&range.end>start)||
                inclusions.some(range=>range.name==='noinclude'&&range.start<end&&range.end>start)};
    }
    function v215TemplateFunctionEdits(source,cfg={}) {
        if(typeof source!=='string'||!/\{\{[ \t]*#[\p{L}][\p{L}\p{N}]*[ \t\r\n]+:/u.test(source))return [];
        const context=v215TemplateDefinitionContext(source,cfg);if(!context||context.stray.length||!v215TemplateDefinitionScope(cfg))return [];
        const names=new Set(V215_TEMPLATE_CONTRACT.functions),edits=[];
        for(const node of context.braces.nodes){if(node.size!==2||context.blockedExecutable(node.start,node.start+3))continue;
            const head=/^\{\{[ \t]*(#([\p{L}][\p{L}\p{N}]*))([ \t\r\n]+):/u.exec(source.slice(node.start,node.end));
            if(!head||!names.has(head[2].toLowerCase())||head[3].length>32)continue;
            const start=node.start+head[0].length-1-head[3].length,end=node.start+head[0].length-1;
            if(context.blockedExecutable(start,end))continue;
            edits.push({start,end,text:'',ruleId:'v215FunctionTokens',proof:{sourceHash:context.sourceHash,functionName:head[1],nodeStart:node.start,nodeEnd:node.end,
                condition:'supported parser function; only whitespace between its name and colon is removed; all arguments remain byte-identical'}});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v215TemplateDocumentationEdits(source,cfg={}) {
        if(typeof source!=='string'||!/\{\{[Dd]ocumentação\}\}|<\/noinclude\s*>[ \t\r\n]*<\/noinclude\s*>/i.test(source))return [];
        const context=v215TemplateDefinitionContext(source,cfg);if(!context||!v215TemplateDefinitionScope(cfg))return [];
        const edits=[];
        if(context.stray.length===1){const extra=context.stray[0],previous=context.inclusions.filter(pair=>pair.closing&&pair.end<=extra.start).sort((a,b)=>b.end-a.end)[0];
            if(extra.name==='noinclude'&&/^<\/noinclude\s*>$/i.test(extra.raw)&&previous?.name==='noinclude'&&previous.depth===0&&
                /^[ \t\r\n]*$/.test(source.slice(previous.end,extra.start))&&source.slice(extra.end).trim()===''&&
                !context.inclusions.some(pair=>pair.name==='onlyinclude')){
                const candidate=source.slice(0,extra.start)+source.slice(extra.end);
                if(v215TemplateDefinitionContext(candidate,cfg)?.stray.length===0)edits.push({start:extra.start,end:extra.end,text:'',ruleId:'v215DocumentationClosers',proof:{sourceHash:context.sourceHash,
                    condition:'one isolated extra noinclude closing token immediately after its complete nonnested block at the end of the definition'}});
            }
            return edits;
        }
        if(context.stray.length||context.inclusions.some(pair=>pair.name==='onlyinclude'))return [];
        const documentation=/^\{\{[Dd]ocumentação\}\}$/;
        const blocks=context.inclusions.filter(pair=>pair.name==='noinclude'&&pair.depth===0&&pair.closing&&documentation.test(source.slice(pair.opening.end,pair.closing.start).trim()));
        for(let i=1;i<blocks.length;i++){const previous=blocks[i-1],current=blocks[i];
            if(source.slice(previous.start,previous.end)!==source.slice(current.start,current.end)||!/^[ \t\r\n]*$/.test(source.slice(previous.end,current.start)))continue;
            edits.push({start:current.start,end:current.end,text:'',ruleId:'v215DocumentationDuplicates',proof:{sourceHash:context.sourceHash,
                condition:'adjacent byte-identical noinclude documentation blocks without arguments, comments or other content; one complete documentation block remains'}});
        }
        if(edits.length)return edits;
        const calls=context.braces.nodes.filter(node=>node.size===2&&documentation.test(source.slice(node.start,node.end))&&!context.blocked(node.start,node.end));
        if(calls.length!==1)return [];
        const call=calls[0];if(source.slice(call.end).trim()||context.inclusions.some(pair=>pair.start<=call.start&&pair.end>=call.end)||
            context.braces.nodes.some(node=>node!==call&&node.start<call.start&&node.end>=call.end))return [];
        const prefix=source.slice(0,call.start),start=prefix.trimEnd().length;
        if(!/(?:\}\}|\|\}|<\/includeonly>)$/i.test(prefix.trimEnd())||!prefix.trim())return [];
        edits.push({start,end:call.end,text:'<noinclude>'+source.slice(start,call.end)+'</noinclude>',ruleId:'v215DocumentationIsolation',proof:{sourceHash:context.sourceHash,
            condition:'one isolated trailing literal documentation call outside every inclusion or function; original documentation and separating whitespace remain visible on the template page only'}});
        return edits;
    }
    function v215TemplateReadCall(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||/<!--|[\uE000-\uF8FF]/.test(raw))return null;
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const literal=parts[0].text.trim().replace(/_/g,' ').replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        if(!/^[\p{L}0-9][\p{L}0-9 /()-]*$/u.test(literal))return null;
        const name=literal[0].toLocaleLowerCase('pt')+literal.slice(1),contract=V215_TEMPLATE_CONTRACT.calls[name],profile=TEMPLATE_CATALOG[name]||INFOBOX_CATALOG[name];
        if(!contract||!profile||profile.oldid!==contract.oldid||!v215LiteralTemplateIdentity(raw,profile))return null;
        const fields=[];
        for(let i=1;i<parts.length;i++){const part=parts[i],match=/^([ \t\r\n]*)([^=\r\n{}<>|\[\]]+?)([ \t\r\n]*=[ \t\r\n]*)([\s\S]*)$/.exec(part.text);
            if(!match||match[2].trim()!==match[2]||!match[2])return null;
            const start=2+part.start+match[1].length;
            fields.push({key:match[2],value:match[4],start,end:start+match[2].length,partStart:2+part.start,partEnd:2+part.end,bar:1+part.start,index:i});
        }
        return {raw,name,literal,parts,fields,profile,contract};
    }
    function v215TemplateParameterEdits(source,cfg={}) {
        const context=v215TemplateDefinitionContext(source,cfg);if(!context||context.stray.length||!v215TemplateDefinitionScope(cfg)||cfg.automaticParameterNames===false)return [];
        const edits=[];
        for(const node of context.braces.nodes){if(node.size!==2||context.blockedExecutable(node.start,node.end))continue;
            const call=v215TemplateReadCall(source.slice(node.start,node.end));if(!call)continue;
            for(const rule of call.contract.rules){const fields=call.fields.filter(field=>rule.family.includes(field.key));
                if(fields.length!==1||fields[0].key!==rule.from||profileAccepts(call.profile,rule.from)||!profileAccepts(call.profile,rule.to))continue;
                const field=fields[0];edits.push({start:node.start+field.start,end:node.start+field.end,text:rule.to,ruleId:'v215DefinitionParameters',proof:{sourceHash:context.sourceHash,template:call.name,oldid:call.contract.oldid,
                    condition:'one audited invalid parameter spelling; no competing accepted alias, empty alias or dynamic parameter name; every argument value and order remain unchanged'}});
            }
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v215TemplateDuplicateEdits(source,cfg={}) {
        const context=v215TemplateDefinitionContext(source,cfg);if(!context||context.stray.length||!v215TemplateDefinitionScope(cfg)||cfg.automaticParameterDuplicates===false)return [];
        const edits=[];
        for(const node of context.braces.nodes){if(node.size!==2||context.blockedExecutable(node.start,node.end))continue;
            const call=v215TemplateReadCall(source.slice(node.start,node.end));if(!call)continue;
            const families=new Map();for(const field of call.fields){if(!families.has(field.key))families.set(field.key,[]);families.get(field.key).push(field);}
            for(const [key,fields]of families){if(fields.length<2||!profileAccepts(call.profile,key)||new Set(fields.map(field=>field.value)).size!==1||
                    fields.some(field=>/<!--|\{\{\s*(?:safe)?subst:|<\s*(?:ref|references|gallery|templatestyles)\b/i.test(field.value)))continue;
                for(const field of fields.slice(0,-1))edits.push({start:node.start+field.bar,end:node.start+field.partEnd,text:'',ruleId:'v215DefinitionDuplicates',proof:{sourceHash:context.sourceHash,template:call.name,key,value:field.value,
                    condition:'same literal named parameter and byte-identical value repeated in one verified native call; retain the last binding; no anonymous argument, substitution, comment or reference'}});
            }
        }
        return edits.sort((a,b)=>a.start-b.start).filter((edit,index,list)=>!list.some((other,j)=>j!==index&&other.start<=edit.start&&other.end>=edit.end));
    }
    function v215TemplateForwardingEdits(source,cfg={}) {
        const contract=V215_TEMPLATE_CONTRACT.marrocos;
        if(typeof source!=='string'||cfg.pageTitle?.replace(/_/g,' ')!==contract.title||!source.includes(contract.before))return [];
        const context=v215TemplateDefinitionContext(source,cfg);
        if(!context||context.stray.length||!v215TemplateDefinitionScope(cfg)||cfg.automaticParameterNames===false||cfg.pageTitle?.replace(/_/g,' ')!==contract.title||
            (TEMPLATE_CATALOG['info/assentamento']||INFOBOX_CATALOG['info/assentamento'])?.oldid!==contract.parentOldid)return [];
        const start=source.indexOf(contract.before);if(start<0||source.indexOf(contract.before,start+1)>=0||context.blockedExecutable(start,start+contract.before.length))return [];
        const owners=context.braces.nodes.filter(node=>node.size===2&&node.start<start&&node.end>=start+contract.before.length&&
            /^\{\{Info\/Assentamento\s*[|]/.test(source.slice(node.start,node.end)));
        if(owners.length!==1)return [];
        const raw=source.slice(owners[0].start,owners[0].end);
        if((raw.match(/[|]\s*coord_sufixo\s*=/g)||[]).length!==1||(raw.match(/[|]\s*coord_escala\s*=/g)||[]).length!==1)return [];
        return [{start,end:start+contract.before.length,text:contract.after,ruleId:'v215DefinitionForwarding',proof:{sourceHash:context.sourceHash,beforeOldid:contract.beforeOldid,afterOldid:contract.afterOldid,
            condition:'exact audited obsolete forwarding block in its native wrapper; public coord_sufixo has priority; public coord_escala and both existing type-dependent defaults remain in the accepted parent field'}}];
    }
    function v215TemplateJSON(raw,allowTrailing=false) {
        if(typeof raw!=='string'||raw.length>102400)return null;
        let at=0;const commas=[],keyOrders=new WeakMap();const ws=()=>{while(at<raw.length&&/[ \t\r\n]/.test(raw[at]))at++;};
        function string(){const start=at++;while(at<raw.length){if(raw[at]==='\\'){at+=2;continue;}if(raw[at++]==='"')return JSON.parse(raw.slice(start,at));}throw 0;}
        function value(depth=0){if(depth>40)throw 0;ws();const c=raw[at];if(c==='"')return string();
            if(c==='{'||c==='['){const object=c==='{',closing=object?'}':']',result=object?Object.create(null):[];if(object)keyOrders.set(result,[]);at++;ws();if(raw[at]===closing){at++;return result;}
                while(at<raw.length){ws();let key;if(object){if(raw[at]!=='"')throw 0;key=string();if(Object.hasOwn(result,key))throw 0;keyOrders.get(result).push(key);ws();if(raw[at++]!==':')throw 0;}
                    const child=value(depth+1);if(object)result[key]=child;else result.push(child);ws();if(raw[at]===closing){at++;return result;}if(raw[at]!==',')throw 0;
                    const comma=at++;ws();if(raw[at]===closing){if(!allowTrailing)throw 0;commas.push(comma);at++;return result;}}
                throw 0;}
            const literal=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(raw.slice(at));if(!literal)throw 0;at+=literal[0].length;return JSON.parse(literal[0]);}
        try{const data=value();ws();return at===raw.length?{data,commas,paramKeys:data&&typeof data==='object'&&data.params&&typeof data.params==='object'?keyOrders.get(data.params)||null:null}:null;}catch{return null;}
    }
    function v215TemplateDataSchema(data) {
        const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value),strings=value=>Array.isArray(value)&&value.every(item=>typeof item==='string'),
            text=value=>value===null||typeof value==='string'||object(value)&&Object.entries(value).every(([key,item])=>/^[a-z][a-z0-9-]*$/i.test(key)&&typeof item==='string');
        if(!object(data)||Object.keys(data).some(key=>!['description','params','paramOrder','format'].includes(key))||!object(data.params)||
            Object.hasOwn(data,'description')&&!text(data.description)||Object.hasOwn(data,'format')&&!['inline','block'].includes(data.format)||
            Object.hasOwn(data,'paramOrder')&&!strings(data.paramOrder))return false;
        if(data.paramOrder?.some(key=>!Object.hasOwn(data.params,key)))return false;
        const types=new Set(['unknown','number','string','line','boolean','date','url','wiki-page-name','wiki-file-name','wiki-template-name','wiki-user-name','content','unbalanced-wikitext']),aliases=new Set();
        for(const [key,param]of Object.entries(data.params)){
            if(!key||!object(param)||Object.keys(param).some(field=>!['label','description','required','suggested','deprecated','aliases','default','autovalue','example','type','suggestedvalues'].includes(field)))return false;
            for(const field of ['label','description','default','example'])if(Object.hasOwn(param,field)&&!text(param[field]))return false;
            for(const field of ['required','suggested'])if(Object.hasOwn(param,field)&&typeof param[field]!=='boolean')return false;
            if(Object.hasOwn(param,'deprecated')&&!['boolean','string'].includes(typeof param.deprecated)||Object.hasOwn(param,'autovalue')&&typeof param.autovalue!=='string'||
                Object.hasOwn(param,'type')&&!types.has(param.type)||Object.hasOwn(param,'suggestedvalues')&&!strings(param.suggestedvalues)||Object.hasOwn(param,'aliases')&&!strings(param.aliases))return false;
            for(const alias of param.aliases||[]){if(!alias||Object.hasOwn(data.params,alias)||aliases.has(alias))return false;aliases.add(alias);}
        }
        return true;
    }
    function v215TemplateDataEdits(source,cfg={}) {
        if(typeof source!=='string'||!/<templatedata\s*>/i.test(source))return [];
        const context=v215TemplateDefinitionContext(source,cfg);if(!context||context.stray.length||!v215TemplateDataScope(cfg))return [];
        const edits=[];
        for(const range of context.shield.ranges){if(range.kind!=='templatedata'||v27SafeMarkdownRanges(source).some(other=>other.start<range.end&&other.end>range.start))continue;
            const raw=source.slice(range.start,range.end),opening=/^<templatedata\s*>/i.exec(raw),closing=/<\/templatedata\s*>$/i.exec(raw);if(!opening||!closing)continue;
            const start=range.start+opening[0].length,body=source.slice(start,range.start+closing.index),parsed=v215TemplateJSON(body,true);
            if(!parsed||!v215TemplateDataSchema(parsed.data))continue;
            const parent=context.braces.nodes.some(node=>node.start<range.start&&node.end>range.end);if(parent)continue;
            for(const at of parsed.commas)edits.push({start:start+at,end:start+at+1,text:'',ruleId:'v215TemplateDataJSON',proof:{sourceHash:context.sourceHash,
                condition:'one JSON trailing comma outside every string; duplicate keys and unsupported schemas are refused; removing commas yields valid typed TemplateData'}});
            if(!Object.hasOwn(parsed.data,'paramOrder'))continue;
            const order=parsed.data.paramOrder,keys=parsed.paramKeys;
            if(!Array.isArray(keys))continue;
            if(order.some(key=>!Object.hasOwn(parsed.data.params,key)))continue;
            const final=[...new Set(order),...keys.filter(key=>!order.includes(key))];if(JSON.stringify(final)===JSON.stringify(order))continue;
            // Locate the root member without matching a string, nested object or example.
            let at=0,depth=0,member=null;
            while(at<body.length){if(body[at]==='"'){const begin=at++;while(at<body.length){if(body[at]==='\\'){at+=2;continue;}if(body[at++]==='"')break;}
                    if(depth===1&&JSON.parse(body.slice(begin,at))==='paramOrder'){let next=at;while(/[ \t\r\n]/.test(body[next]||''))next++;if(body[next]!==':')continue;next++;while(/[ \t\r\n]/.test(body[next]||''))next++;
                        if(body[next]!=='[')continue;const beginArray=next++;let quoted=false;for(;next<body.length;next++){const c=body[next];if(quoted){if(c==='\\')next++;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c===']'){member={start:beginArray,end:next+1};break;}}
                    }continue;}
                if(body[at]==='{')depth++;else if(body[at]==='}')depth--;at++;
            }
            if(!member)continue;
            // A comma inside this replaced array is handled by its one exact replacement.
            let commasInside=0;
            for(let i=edits.length-1;i>=0;i--)if(edits[i].start>=start+member.start&&edits[i].end<=start+member.end){commasInside++;edits.splice(i,1);}
            const orderOperations=order.length-new Set(order).size+keys.filter(key=>!order.includes(key)).length;
            edits.push({start:start+member.start,end:start+member.end,text:JSON.stringify(final),ruleId:'v215TemplateDataOrder',proof:{sourceHash:context.sourceHash,
                changeRules:[...Array(orderOperations).fill('v215TemplateDataOrder'),...Array(commasInside).fill('v215TemplateDataJSON')],
                condition:'existing valid root paramOrder; only identical repeated keys removed and missing declared keys appended in declaration order; no parameter, alias or existing relative order is changed'}});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v215TemplateReadableEdits(source,cfg={}) {
        if(cfg.templateReadableFormatting===false||typeof source!=='string'||!/[|][^\r\n]{70,}\}\}/.test(source))return [];
        const context=v215TemplateDefinitionContext(source,cfg);if(!context||context.stray.length||!v215TemplateDefinitionScope(cfg)||cfg.templateReadableFormatting===false)return [];
        if(source.includes('\r\n')&&/(?<!\r)\n/.test(source)||/\r(?!\n)/.test(source))return [];
        const edits=[],newline=source.includes('\r\n')?'\r\n':'\n';
        for(const node of context.braces.nodes){if(node.size!==2||context.blockedExecutable(node.start,node.end))continue;
            const raw=source.slice(node.start,node.end),call=v215TemplateReadCall(raw);
            if(!call||call.fields.length<3||/[\r\n{}<>]/.test(raw.slice(2,-2))||raw.length<80||context.braces.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>node.end)||
                call.fields.some(field=>!profileAccepts(call.profile,field.key))||new Set(call.fields.map(field=>field.key)).size!==call.fields.length)continue;
            for(const field of call.fields)edits.push({start:node.start+field.bar,end:node.start+field.bar,text:newline,ruleId:'v215TemplateReadableFields',proof:{sourceHash:context.sourceHash,
                condition:'single-line verified native call with at least three literal named arguments; only newline before each named separator; no anonymous/dynamic argument or value change'}});
            edits.push({start:node.end-2,end:node.end-2,text:newline,ruleId:'v215TemplateReadableFields',proof:{sourceHash:context.sourceHash,
                condition:'closing delimiter on its own line after a literal named argument; MediaWiki trims the added final whitespace'}});
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v215TemplateDefinitionPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,steps:[],edits:[]};
        if(!v215TemplateDataScope(cfg))return {...plan,disabled:true};
        for(const [name,find]of [['documentation',v215TemplateDocumentationEdits],['functions',v215TemplateFunctionEdits],['parameters',v215TemplateParameterEdits],
            ['duplicates',v215TemplateDuplicateEdits],['forwarding',v215TemplateForwardingEdits],['templatedata',v215TemplateDataEdits],['formatting',v215TemplateReadableEdits]]){
            const edits=find(plan.text,cfg);if(!edits.length)continue;const before=plan.text,after=v24SyntaxApply(before,edits);if(before===after)continue;
            plan.steps.push({name:'v215-template-'+name,before,after,edits});plan.edits.push(...edits);plan.text=after;
        }
        return plan;
    }
    function v215TemplateDefinitionEdits(source,cfg={}) {
        const plan=v215TemplateDefinitionPlan(source,cfg);if(!plan.edits.length)return [];
        return [{start:0,end:source.length,text:plan.text,ruleId:'v215TemplateDefinitions',proof:{sourceHash:plan.sourceHash,changeRules:plan.steps.flatMap(step=>step.edits.flatMap(edit=>edit.proof?.changeRules||[edit.ruleId])),
            steps:plan.steps,condition:'complete source-bound template definition transaction; every finite component must reproduce its independently checked endpoint'}}];
    }
    function v215TemplateDefinitionProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v215TemplateDefinitionPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v215TemplateSafePlan(source,cfg={}) {
        const plan=v215TemplateDefinitionPlan(source,cfg),edits=v215TemplateDefinitionEdits(source,cfg);
        return {source,sourceHash:plan.sourceHash,text:plan.text,edits,steps:edits.length?[{name:'v215-template-definition',before:source,after:plan.text,edits}]:[]};
    }
    function v215TemplateObjectProof(plan,expected,actual) {
        if(!(plan.safe?.steps||[]).some(step=>step.name==='v215-template-definition'))return {accepted:true,reason:''};
        return expected===actual?{accepted:true,reason:''}:{accepted:false,reason:'O texto da predefinição mudou fora dos reparos locais confirmados. Os nomes, valores e limites precisam permanecer no resultado conferido.'};
    }
    function v215TemplateCount(before,after,topics=[]) {
        if(before===after)return null;
        const candidates=['Predefinição:Modelo de controle',V215_TEMPLATE_CONTRACT.marrocos.title,'Predefinição:Modelo de controle/doc'];let plan;
        for(const pageTitle of candidates){const next=v215TemplateDefinitionPlan(before,{...DEFAULTS,namespaceNumber:10,pageTitle,contentModel:'wikitext'});if(next.edits.length&&next.text===after){plan=next;break;}}
        if(!plan)return null;
        const sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after),events=[];
        for(const [stage,step]of plan.steps.entries())for(const [index,edit]of step.edits.entries())for(const [part,rule]of (edit.proof?.changeRules||[edit.ruleId]).entries())events.push({id:sourceHash+':template-definition:'+stage+':'+index+':'+part,
            rule:'retained-template-definition',kind:'template-definition',label:GROUP_LABELS[rule]||'Código da predefinição',sourceHash,outputHash,
            sourceAnchors:[{start:0,end:before.length}],outputAnchors:[{start:0,end:after.length}],
            stageSourceHash:v24SyntaxHash(step.before),stageOutputHash:v24SyntaxHash(step.after),stageSourceAnchors:[{start:edit.start,end:edit.end}],
            before:step.before.slice(edit.start,edit.end),after:edit.text,fragments:[]});
        const fragments=v27RawDiff(before,after);
        return {count:events.length,exact:true,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:fragments.length,totalFragments:fragments.length,
            proofCoverage:'source-bound-template-endpoint',unresolvedFragments:0,unresolved:[],text:events.length+' '+(events.length===1?'ajuste aplicado':'ajustes aplicados')};
    }

    // This observer follows native ref activation, not the editing shield.
    // A protected quotation can still reuse a footnote defined outside it.
    function v219NativeReferenceObserver(source) {
    const ranges=[],unclosed=[],literal=new Set(['nowiki','pre','syntaxhighlight','source','math','chem','ce','score','timeline','graph']);
    for(let at=source.indexOf('<');at>=0&&at<source.length;){
        if(source.slice(at,at+4)==='<!--'){
            const close=source.indexOf('-->',at+4),end=close<0?source.length:close+3;
            ranges.push({start:at,end});if(close<0)unclosed.push({start:at,end});
            at=source.indexOf('<',end);continue;
        }
        const tag=v24SyntaxTag(source,at);if(!tag){at=source.indexOf('<',at+1);continue;}
        if(!tag.close&&literal.has(tag.name)){
            let end=tag.end;
            if(!tag.self){const close=new RegExp('<\\s*\\/\\s*'+tag.name+'\\s*>','gi');close.lastIndex=tag.end;
                if(close.exec(source))end=close.lastIndex;else{end=source.length;unclosed.push({start:at,end});}}
            ranges.push({start:at,end});at=source.indexOf('<',end);continue;
        }
        at=source.indexOf('<',tag.end);
    }
    const view=v24SyntaxMaskRanges(source,ranges),nodes=v24SyntaxTemplates(view),refs=[],empties=[],containers=[],nativeContexts=new Map();
    let current=null;
    for(let at=view.indexOf('<');at>=0&&at<view.length;){
        const tag=v24SyntaxTag(view,at);if(!tag){at=view.indexOf('<',at+1);continue;}at=view.indexOf('<',tag.end);
        if(tag.name==='references'){
            if(!tag.close&&!tag.self){const attrs=v24SyntaxAttrs(tag.attrs);containers.push({...tag,attrs,
                valid:!!attrs&&Object.keys(attrs).every(key=>['group','responsive'].includes(key))&&v24SyntaxLiteralIdentity(attrs)});}
            else if(tag.close&&!tag.typo){if(current&&current.container===containers.at(-1)){unclosed.push(current);current=null;}containers.pop();}
            continue;
        }
        if(tag.name!=='ref')continue;
        if(tag.close){if(current&&!tag.typo&&!tag.attrs.trim()){
            refs.push({...current,end:tag.end,close:tag,body:source.slice(current.end,tag.start)});current=null;}
            continue;
        }
        if(current){if(!source.slice(current.end,tag.start).trim())empties.push(current);else unclosed.push(current);current=null;}
        const attrs=v24SyntaxAttrs(tag.attrs),renderer=v219NativeReferenceRendererContext(view,tag.start,nodes,nativeContexts),container=containers.at(-1),
            item={...tag,attrs,renderer,container,group:attrs?.group??container?.attrs?.group??renderer.group??'',
                valid:!!attrs&&Object.values(attrs).every(value=>!/[{}<>]/.test(value))&&renderer.valid};
        if(tag.self)refs.push({...item,body:null,close:null});else current=item;
    }
    if(current)unclosed.push(current);
    return {view,refs,empties,unclosed,helpers:[...v219NativeRProfiles(view),...v219NativeNoteProfiles(view)],shield:{unclosed:[]}};
}
    // R 72110148 forwards to Referências múltiplas 57611773 and R/ref
    // 70788941. Their argument values are not raw HTML attribute entities.
    function v219NativeReferenceBraceView(source) {
    const ranges=[],attributes=[],literal=new Set(['nowiki','pre','syntaxhighlight','source','math','chem','ce','score','timeline','graph']);
    for(let at=source.indexOf('<');at>=0&&at<source.length;){
        if(source.slice(at,at+4)==='<!--'){const end=source.indexOf('-->',at+4);ranges.push({start:at,end:end<0?source.length:end+3});at=source.indexOf('<',end<0?source.length:end+3);continue;}
        const tag=v24SyntaxTag(source,at);if(!tag){at=source.indexOf('<',at+1);continue;}
        let end=tag.end;
        if(!tag.close&&literal.has(tag.name)&&!tag.self){const close=new RegExp('<\\s*\\/\\s*'+tag.name+'\\s*>','gi');close.lastIndex=tag.end;end=close.exec(source)?close.lastIndex:source.length;}
        else if(!tag.close&&!literal.has(tag.name)&&/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas|refn|nre|efn|sfn(?:p|m|mp)?|harvref|#tag\s*:\s*ref)(?=[\s_|}])/i.test(tag.raw))attributes.push({start:at,end:tag.end,raw:tag.raw,eligible:false,calls:[],attributeScope:true});
        ranges.push({start:at,end});at=source.indexOf('<',end);
    }
    return {view:v24SyntaxMaskRanges(source,ranges),attributes};
}
    function v219NativeRProfiles(source) {
    if(typeof source!=='string'||!/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas)(?=[\s_|}])/i.test(source))return [];
    const prepared=v219NativeReferenceBraceView(source),result=prepared.attributes.filter(item=>/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas)(?=[\s_|}])/i.test(item.raw));
    for(const node of v24SyntaxTemplates(prepared.view).nodes){
        const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),
            child=/^[Rr]\/ref$/.test(head),native=child||/^[Rr]$|^[Rr]eferências múltiplas$/.test(head);
        if(!native)continue;
        const fields=[],seen=new Set(),calls=[];let cursor=node.start+2+p.parts[0].length+1,next=1,eligible=true;
        for(const part of p.parts.slice(1)){
            const named=biographyNamedPart(part),key=named?named.key:String(next++),value=named?named.value:part,
                start=cursor+(named?part.indexOf('=')+1:0),known=child?/^[1-4]$/.test(key):
                    /^[1-9]$/.test(key)||['group','grp','g','grupo','p','page','pp','pages','q','quote'].includes(key)||/^(?:p|page|pp|pages|q|quote)[1-9]$/.test(key);
            if(seen.has(key)||!known||/[{}<>\uE000-\uF8FF]/.test(value))eligible=false;
            seen.add(key);fields.push({key,value,start,end:start+value.length});cursor+=part.length+1;
        }
        const selected=keys=>{for(const key of keys){const field=fields.find(field=>field.key===key);if(field)return field;}return null;},
            groupField=selected(child?['2']:['group','grp','g']),group=groupField?.value||'',first=selected(['1']);
        if(!first||!first.value||child&&!groupField||[group,...fields.filter(field=>/^\d+$/.test(field.key)).map(field=>field.value)].some(value=>
            value!==value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'')||/[\[\]|&"']/.test(value)||v219UncertainReferenceIdentity(value)))eligible=false;
        for(let slot=1;slot<=(child?1:9);slot++){
            const field=selected([String(slot)]);if(!field||!field.value)continue;
            calls.push({...field,key:'name',value:field.value,group,ownerStart:node.start,ownerEnd:node.end,slot});
        }
        result.push({start:node.start,end:node.end,raw,eligible,calls,group,fields,helperKind:'r',nativeOldid:child?70788941:head.toLowerCase()==='r'?72110148:57611773});
    }
    return result;
}
    // These literal native wrappers emit ref objects. Their editing owners
    // stay protected even when native Cite activates the call inside them.
    function v219NativeNoteProfiles(source) {
    const gate=/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:refn|nre|efn|sfn(?:p|m|mp)?|harvref|#tag\s*:\s*ref)(?=[\s_|}])/i;
    if(typeof source!=='string'||!gate.test(source))return [];
    const prepared=v219NativeReferenceBraceView(source),result=prepared.attributes.filter(item=>gate.test(item.raw));
    for(const node of v24SyntaxTemplates(prepared.view).nodes){
        const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]),
            tag=/^#tag\s*:\s*ref$/.test(head),refn=/^[Rr]efn$/.test(head),note=/^[Nn]re$|^[Ee]fn$/.test(head);
        const generated=/^[Ss]fn$/.test(head)?67697954:/^[Ss]fnp$/.test(head)?62112876:
            /^[Ss]fnm$/.test(head)?44333336:/^[Ss]fnmp$/.test(head)?72289570:/^[Hh]arvRef$/.test(head)?60788260:0;
            // A source-pinned emitter with generated reference identity is
            // kept opaque until its complete module contract is modelled.
        if(generated){
            const fields=foreignEntries(p),selected=keys=>{for(const key of keys){const field=fields.find(field=>field.key===key);if(field)return field.value;}return '';},
                nativeGroup=[44333336,72289570].includes(generated)?'':selected(['group','grupo']).replace(/^[ \t\r\n\f\v]+|[ \t\r\n\f\v]+$/g,'');
            result.push({start:node.start,end:node.end,raw,eligible:false,helperKind:'generated-note',
                nativeOldid:generated,nativeGroup,calls:[]});continue;
        }
        if(!tag&&!refn&&!note)continue;
        const fields=[],seen=new Set();let eligible=true,next=1;
        for(const part of p.parts.slice(1)){
            const named=biographyNamedPart(part),key=named?named.key:String(next++),value=named?named.value:part,
                known=key==='1'||['name','group'].includes(key)||refn&&key==='refn'||note&&['nome','grupo','reference','content','text','referência','conteúdo','texto'].includes(key);
            if(!known||seen.has(key)||/[{}<>\uE000-\uF8FF]/.test(value))eligible=false;
            seen.add(key);fields.push({key,value});
        }
        const select=keys=>{for(const key of keys){const field=fields.find(field=>field.key===key);if(field)return field;}return null;},
            names=fields.filter(field=>['name','nome'].includes(field.key)),groups=fields.filter(field=>['group','grupo'].includes(field.key)),
            bodies=fields.filter(field=>['1','refn','reference','content','text','referência','conteúdo','texto'].includes(field.key)),
            name=select(note?['name','nome']:['name'])?.value||'',body=select(tag?['1']:refn?['1','refn']:['1','reference','content','text','referência','conteúdo','texto'])?.value||'';
        let group=select(note?['group','grupo']:['group'])?.value||'';
        if(names.length>1||groups.length>1||bodies.length>1||[name,group].some(value=>value!==value.trim()||/[&\[\]|"']/.test(value)||v219UncertainReferenceIdentity(value)))eligible=false;
        if(note){const selected=group.trim();group=['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'].includes(selected)?
            name?(select(['group'])?.value||''):group:'lower-alpha';}
        result.push({start:node.start,end:node.end,raw,eligible,helperKind:'note',fields,
            nativeOldid:tag?null:refn?57056787:/^[Ee]fn$/.test(head)?68628877:68628864,
            calls:[{start:node.start,end:node.end,value:name,group,body:body||null,ownerStart:node.start,ownerEnd:node.end}]});
    }
    return result;
}
    // These five pinned native emitters always prefix an unnamed generated
    // reference with the literal FOOTNOTE. No suffix or body is inferred.
    // Other names are independent only inside this closed, literal context.
    function v219LiteralDefaultSortCall(raw) {
    if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
    const p=parsedTemplate(raw),magic=p.parts[0].replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
    return p.parts.length===1&&/^(?:ORDENACAOPADRAO|ORDENAÇÃOPADRÃO|ORDEMPADRAO|ORDEMPADRÃO|DEFAULTSORT|DEFAULTSORTKEY|DEFAULTCATEGORYSORT):[^|{}<>&\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]+$/.test(magic);
}
    function v219GeneratedDefaultSortPlan(source,cfg={}) {
    const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
    if(typeof source!=='string'||source.length>4194304||!/sfn|harvref/i.test(source)||
        !v219GeneratedReferenceBoundary(source).present)return empty;
    const original=v219MagicWordPlan(source,cfg);
    if(!original.edits.length||!v219MagicWordProof(source,original.text,original,cfg))return empty;
    const candidates=original.edits.filter(edit=>{
        if(edit.start<2||source.slice(edit.start-2,edit.end+2)!==edit.proof?.before||
            !v219LiteralDefaultSortCall('{{'+edit.text+'}}'))return false;
        const before=edit.proof.before.slice(2,-2),after=edit.text;
        return before.includes(':')&&before.slice(before.indexOf(':')+1)===after.slice(after.indexOf(':')+1);
    }),edits=v219StageSafeEdits(source,candidates,'v219-generated-defaultsort',cfg);
    return edits.length?{...empty,text:v24SyntaxApply(source,edits),edits}:empty;
}
    function v219GeneratedDefaultSortProof(before,after,plan,cfg={}) {
    if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
    const fresh=v219GeneratedDefaultSortPlan(before,cfg);
    return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
    function v219NativeLiteralNoteHazard(source) {
    if(typeof source!=='string'||!/refn|nre|efn|#tag/i.test(source))return false;
    return v219NativeNoteProfiles(source).some(profile=>profile.helperKind==='note'||profile.attributeScope);
}
    function v219GeneratedReferenceBoundary(source,observed=null) {
    const empty={present:false,safe:true,generated:[],reason:''};
    if(typeof source!=='string'||source.length>4194304)return {...empty,safe:false,reason:'source-limit'};
    if(!/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:sfn(?:p|m|mp)?|harvref)(?=[\s_|}])/i.test(source))return empty;
    observed=observed||v219NativeReferenceObserver(source);
    const generated=observed.helpers.filter(helper=>helper.helperKind==='generated-note');
    if(!generated.length)return empty;
    const fail=reason=>({present:true,safe:false,generated,reason}),view=observed.view,
        prepared=v219NativeReferenceBraceView(view),parsed=v24SyntaxTemplates(prepared.view);
    if(observed.unclosed.length||observed.empties.length||parsed.unclosed.length||
        /\{\{\{|[\uE000-\uF8FF]/.test(view))return fail('incomplete-or-dynamic-context');
        // Literal targets can depend on a generated name without being a
        // ref call. Keep every such spelling outside the independent scope.
    if(/FOOTNOTE|cite[-_]note/i.test(decodedReferenceName(view)))return fail('generated-name-dependency');
    for(const ref of observed.refs){
        if(!ref.valid||!ref.attrs)return fail('unread-reference');
        for(const key of ['name','group','follow'])if(Object.hasOwn(ref.attrs,key)){
            const value=ref.attrs[key];
            if(v219UncertainReferenceIdentity(value)||/FOOTNOTE/i.test(decodedReferenceName(value)))
                return fail('uncertain-or-generated-reference-name');
        }
    }
    for(const helper of observed.helpers){
        if(helper.helperKind==='generated-note'){
            if(helper.attributeScope)return fail('generated-helper-in-attribute');
            const p=parsedTemplate(helper.raw),entries=foreignEntries(p),seen=new Set();let numericDuplicate=false;
            const unsafeDuplicate=entries.some(entry=>{const repeated=seen.has(entry.key);seen.add(entry.key);
                    if(repeated&&helper.nativeOldid===67697954&&/^[1-5]$/.test(entry.key)){numericDuplicate=true;return false;}
                    return repeated;}),
                controls={postscript:'postscript',ps:'postscript',p:'page',page:'page',pp:'pages',pages:'pages',
                    loc:'location',ref:'reference',Ref:'reference',group:'group',grupo:'group'},controlRoles=new Set(),
                unprovedDuplicateContext=numericDuplicate&&entries.some(entry=>{
                    if(/^[1-5]$/.test(entry.key))return false;
                    if(!Object.hasOwn(controls,entry.key)||controlRoles.has(controls[entry.key]))return true;
                    controlRoles.add(controls[entry.key]);return false;});
                // Native Sfn forwards its selected numeric slots unchanged.
                // Removing an anonymous outer tag creates no argument frame.
                // Other duplicate controls remain outside this boundary.
            if(unsafeDuplicate||unprovedDuplicateContext||entries.some(entry=>['name','nome'].includes(entry.key)||
                ['group','grupo'].includes(entry.key)&&v219UncertainReferenceIdentity(entry.value)||
                /[{}<>\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(entry.value)))
                return fail('explicit-or-dynamic-generated-name');
            continue;
        }
        if(!helper.eligible||helper.calls.some(call=>v219UncertainReferenceIdentity(call.value)||
            v219UncertainReferenceIdentity(call.group||'')||/FOOTNOTE/i.test(call.value)))
            return fail('other-unproved-reference-helper');
    }
    for(const node of parsed.nodes){
        const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),head=v215TemplateTitle(p.parts[0]);
        if(generated.some(helper=>helper.start===node.start&&helper.end===node.end))continue;
        if(observed.helpers.some(helper=>helper.eligible&&helper.start===node.start&&helper.end===node.end))continue;
        if(v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw))continue;
            // Native case-sensitive defaultsort aliases, literal value only.
            // No generic magic word, guessed local alias or expansion is free.
        if(v219LiteralDefaultSortCall(raw))continue;
        const collector=v219NativeCollectorGroups(raw);
        if(collector.recognized&&!collector.ambiguous)continue;
            // Portal3 71097872 -> Portais 73130378 -> Suporte 70895196.
            // The finite literal portal slots cannot expand another owner.
        const entries=foreignEntries(p);
        if(/^[Pp]ortal3$/.test(head)&&entries.length>=1&&entries.length<=10&&
            entries.every(entry=>entry.positional&&entry.value.trim()&&
                !/[{}<>\[\]&|\r\n\u0000-\u001F\uE000-\uF8FF]/.test(entry.value)))continue;
        return fail('unproved-template-owner');
    }
    return {present:true,safe:true,generated,reason:''};
}
    // Ref-section31771050 redirects literally to Referências63785697.
    // Withhold only a new append. This does not expand a renderer inventory
    // or prove that every unknown later template emits no references.
    const v219RefSectionDefaultAppendRefusal=(source,cfg={})=>{
        if(typeof source!=='string'||source.length>4194304||
            cfg.references!==true||cfg.endMatter!==true||cfg.namespaceNumber!==0||
            cfg.sectionOnly||cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||
            cfg.contentModel&&cfg.contentModel!=='wikitext')return false;
        const native=TEMPLATE_CATALOG['referências'];
        if(native?.oldid!==63785697||native.title!=='Referências'||native.partial||
            !Array.isArray(native.accepted)||!native.accepted.includes('1')||
            !native.accepted.includes('grupo')||!native.accepted.includes('refs'))return false;
        const view=protectedView(source),refs=refTokens(view),literalOwners=[
            ...discussionProtectionRanges(source,cfg),...v215DefinitionProtectedRanges(source,cfg),
            ...v219QuotedTemplateRanges(source,cfg),...v219MarkdownLiteralRanges(source)];
        let ordinary=false;
        for(const ref of refs){const attrs=attrsOf(ref.attrs);if(attrs&&!attrs.group)ordinary=true;}
        if(!ordinary)return false;
        for(const node of topNodes(view)){
            const raw=source.slice(node.start,node.end);
            if(!/^\{\{[Rr]ef-section\|Notas\}\}$/.test(raw))continue;
            const line=source.lastIndexOf('\n',node.start-1)+1,next=source.indexOf('\n',node.end);
            if(source.slice(line,node.start)!==''||
                !/^[ \t\r]*$/.test(source.slice(node.end,next<0?source.length:next)))continue;
            const context=v24SyntaxContext(view,node.start);
            let nested=false,following=false;
            for(const owner of literalOwners)if(owner.start<node.end&&owner.end>node.start)nested=true;
            for(const key of ['templates','html','tables','links','external'])if(context[key]?.length)nested=true;
            for(const ref of refs)if(ref.end>node.start)following=true;
            if(!nested&&!following)return true;
        }
        return false;
    };
    function v219GeneratedDefaultCollectorAllowed(source,cfg={}) {
    const boundary=v219GeneratedReferenceBoundary(source);
    if(!boundary.present&&!/refn|nre|efn|#tag/i.test(source))return true;
    const observed=v219NativeReferenceObserver(source),notes=observed.helpers.filter(helper=>helper.helperKind==='note');
    if(!boundary.present&&!notes.length)return true;
    if(!boundary.safe||notes.some(helper=>!helper.eligible))return false;
    const helpers=boundary.generated.concat(notes),collectors=rendererRanges(observed.view);
        // A new default list can expose an unchanged nested custom-group
        // error. Do not activate its outer wrapper while the exact helper
        // still lacks the separately proved following renderer/unwrap.
    if(observed.refs.some(ref=>ref.body!==null&&helpers.some(helper=>ref.start<helper.start&&helper.end<ref.end&&
        ref.body.trim()===helper.raw)&&!v219GeneratedOuterReferenceAllowed(source,ref,boundary,cfg)&&
            !v219SuppliedDefaultNoteContext(source,ref,cfg)))return false;
    if(boundary.generated.some(helper=>helper.nativeGroup==='')||notes.some(helper=>helper.calls.some(call=>call.group==='')))return true;
    return observed.refs.some(ref=>ref.valid&&ref.group===''&&!collectors.some(range=>range.start<=ref.start&&ref.end<=range.end)&&
        !helpers.some(helper=>ref.body!==null&&ref.start<helper.start&&helper.end<ref.end&&ref.body.trim()===helper.raw));
}
    function v219GeneratedAuthorChangeAllowed(source,start,end,text,cfg={}) {
    const boundary=v219GeneratedReferenceBoundary(source);
    if(!boundary.present)return true;
    const note=boundary.generated.find(helper=>helper.start===start&&helper.end===end);
    if(!note)return true;
    if(!boundary.safe||boundary.generated.length!==1)return false;
    const p=parsedTemplate(note.raw),head=v215TemplateTitle(p.parts[0]);
    if(!/^[Ss]fn$|^[Ss]fnp$/.test(head)||p.parts.length!==3||
        p.parts.slice(1).some(part=>biographyNamedPart(part)))return false;
    const hard=[...v24SyntaxProtected(source).ranges,...v219MarkdownLiteralRanges(source),
        ...v219QuotedTemplateRanges(source).filter(range=>!range.kind?.startsWith('uncertain-reference-'))];
    if(hard.some(range=>range.start<end&&start<range.end))return false;
    const works=[];
    for(const node of v24SyntaxTemplates(v219NativeReferenceBraceView(source).view).nodes){
        const raw=source.slice(node.start,node.end),work=parsedTemplate(raw);
        if(!v219NativeCitationTitle(work))continue;
        if(hard.some(range=>range.start<node.end&&node.start<range.end))return false;
        const roles=new Map();let valid=true;
        for(const field of foreignEntries(work)){
            const mapped=v219NativeCitationRoles(field.key);
            if(field.positional||mapped.length!==1||roles.has(mapped[0])||!field.value.trim()||
                !['Title','Year','Ref','AuthorList-Last:1','AuthorList-Last:2','AuthorList-Last:3','AuthorList-Last:4'].includes(mapped[0])||
                /[{}<>\[\]&\uE000-\uF8FF]/.test(field.value)){valid=false;break;}
            roles.set(mapped[0],field.value.trim());
        }
        if(!valid)return false;
        works.push({raw,roles});
    }
    if(works.length!==1)return false;
    const roles=works[0].roles,authors=[];
    for(let index=1;index<=4;index++)if(roles.has('AuthorList-Last:'+index))authors.push(roles.get('AuthorList-Last:'+index));
    return authors.length>=2&&authors.every((name,index)=>roles.get('AuthorList-Last:'+(index+1))===name)&&
        roles.get('Ref')==='harv'&&roles.has('Title')&&/^\d{4}[a-z]?$/.test(roles.get('Year')||'')&&
        text==='{{'+[p.parts[0],...authors,roles.get('Year')].join('|')+'}}';
}
    function v219GeneratedMinorAllowed(before,after,options={}) {
    const read=source=>{
        const observed=v219NativeReferenceObserver(source),generated=observed.helpers.filter(helper=>['generated-note','note'].includes(helper.helperKind));
        return [generated.map(helper=>helper.raw),observed.refs.filter(ref=>ref.body!==null&&ref.attrs&&
            Object.keys(ref.attrs).length===0&&generated.some(helper=>ref.start<helper.start&&helper.end<ref.end&&
                ref.body.trim()===helper.raw)).map(ref=>ref.body.trim())];
    };
    if(typeof before!=='string'||typeof after!=='string')return false;
    if(!/sfn|harvref|refn|nre|efn|#tag[\s_]*:[\s_]*ref/i.test(before+after))return true;
    return JSON.stringify(read(before))===JSON.stringify(read(after));
}
    function v219SuppliedDefaultNoteContext(source,ref,cfg={}) {
    if(cfg.endMatter!==true||cfg.references===false||cfg.sectionOnly||cfg.discussionPage||cfg.namespaceNumber!==0||
        typeof source!=='string'||source.length>4194304||/[\uE000-\uF8FF]/.test(source)||
        cfg.contentModel&&cfg.contentModel!=='wikitext'||v24SyntaxScan(source).issues.length)return false;
    const attrs=typeof ref?.attrs==='string'?v24SyntaxAttrs(ref.attrs):ref?.attrs;
    if(!attrs||Object.keys(attrs).length||ref.body===null||ref.container)return false;
    const profiles=v219NativeNoteProfiles(ref.body.trim()),note=profiles.length===1?profiles[0]:null;
    if(!note?.eligible||note.nativeOldid!==57056787||note.calls[0].group!==''||!note.calls[0].body?.trim())return false;
    const observed=v219NativeReferenceObserver(source),hard=[...v24SyntaxProtected(source).ranges,
        ...v219MarkdownLiteralRanges(source),...v219QuotedTemplateRanges(source)],nodes=v24SyntaxTemplates(observed.view);
    if(observed.unclosed.length||observed.empties.length||nodes.unclosed.length||
        v219ReferenceIdentityQuarantine(source,cfg).opaque||hard.some(range=>range.start<ref.end&&ref.start<range.end))return false;
    for(const node of nodes.nodes){
        const raw=source.slice(node.start,node.end);
        if(node.start<ref.start&&ref.end<node.end&&v219NativeCollectorGroups(raw).recognized)return false;
        if(observed.helpers.some(helper=>helper.eligible&&helper.start===node.start&&helper.end===node.end)||
            v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw)||v219LiteralDefaultSortCall(raw)||
            v219NativeCollectorGroups(raw).recognized)continue;
        return false;
    }
        // The existing writer inserts before its first footer. A source
        // marker beyond that position cannot borrow this append permission.
    const footer=/^(?:==[ \t]*(?:Ligações externas|Bibliografia|Leitura complementar)[ \t]*==|\{\{(?:Commons(?:cat)?|Controle de autoridade|Portal3)\b|\[\[Categoria:)/gmi.exec(source),at=footer?footer.index:source.length;
    return [...observed.refs,...observed.helpers].every(item=>item.end<=at)&&
        !rendererRanges(observed.view).some(range=>range.start<ref.start&&ref.end<range.end);
}
    function v219NativeOuterDefaultCollectorPlan(source,cfg={}) {
    const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
    if(typeof source!=='string'||!/refn/i.test(source)||cfg.endMatter!==true||cfg.references===false)return empty;
    const observed=v219NativeReferenceObserver(source),renderers=rendererRanges(observed.view);
    if(renderers.some(range=>{const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(raw,0),native=v219NativeCollectorGroups(raw);
        return tag?.name==='references'?(v24SyntaxAttrs(tag.attrs)?.group||'')==='':native.recognized&&native.groups.includes('');})||
        !observed.refs.some(ref=>v219SuppliedDefaultNoteContext(source,ref,cfg)))return empty;
    const text=endMatterPass(source,()=>{},()=>{},cfg);if(text===source)return empty;
    let start=0,end=source.length,tail=text.length;
    while(start<end&&start<tail&&source[start]===text[start])start++;
    while(end>start&&tail>start&&source[end-1]===text[tail-1]){end--;tail--;}
    const replacement=text.slice(start,tail);
    if(!/^[\r\n]*$/.test(source.slice(start,end))||! /^(?:[\r\n])*\{\{Referências\}\}(?:[\r\n])*$/.test(replacement)||
        [...observed.refs,...observed.helpers].some(item=>item.end>start))return empty;
    const edit={start,end,text:replacement,ruleId:'endMatter',proof:{kind:'native-refn-default-collector',sourceHash:empty.sourceHash}},
        edits=v219StageSafeEdits(source,[edit],'v219-refn-default-collector',cfg);
    return edits.length?{...empty,text:v24SyntaxApply(source,edits),edits}:empty;
}
    function v219NativeOuterDefaultCollectorProof(before,after,plan,cfg={}) {
    if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
    const fresh=v219NativeOuterDefaultCollectorPlan(before,cfg);
    return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
}
    function v219GeneratedOuterReferenceAllowed(source,ref,boundary=null,cfg={}) {
    const attrs=typeof ref?.attrs==='string'?v24SyntaxAttrs(ref.attrs):ref?.attrs;
    if(!ref||ref.body===null||!attrs||Object.keys(attrs).length)return false;
    boundary=boundary||v219GeneratedReferenceBoundary(source);
    const body=ref.body.trim(),generated=boundary.generated.find(helper=>ref.start<helper.start&&helper.end<ref.end&&body===helper.raw),
        native=generated?null:v219NativeNoteProfiles(body),note=native?.length===1&&native[0].eligible&&native[0].helperKind==='note'?native[0]:null;
    if(!generated&&!note||generated&&!boundary.safe)return false;
    const hard=[...v24SyntaxProtected(source).ranges,...v219MarkdownLiteralRanges(source),
        ...v219QuotedTemplateRanges(source).filter(range=>!range.kind?.startsWith('uncertain-reference-'))];
    if(hard.some(range=>range.start<ref.end&&ref.start<range.end))return false;
    const observed=v219NativeReferenceObserver(source),group=generated?generated.nativeGroup:note.calls[0].group,
        collectors=rendererRanges(observed.view).map(range=>{
            const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(raw,0);
            if(tag?.name==='references'){const attrs=v24SyntaxAttrs(tag.attrs);return {...range,
                groups:attrs&&Object.keys(attrs).every(key=>['group','responsive'].includes(key))?[attrs.group||'']:null};}
            const native=v219NativeCollectorGroups(raw);return {...range,groups:native.recognized&&!native.ambiguous?native.groups:null};
        }),matching=collectors.filter(range=>range.groups?.includes(group));
    if(ref.container||observed.refs.some(other=>other.start===ref.start&&other.end===ref.end&&other.container)||
        collectors.some(range=>range.start<ref.start&&ref.end<range.end)||
        v24SyntaxTemplates(observed.view).nodes.some(node=>node.start<ref.start&&ref.end<node.end&&
            v219NativeCollectorGroups(source.slice(node.start,node.end)).recognized))return false;
    if(note&&note.calls[0].value&&!note.calls[0].body){
        if(collectors.some(range=>range.groups===null))return false;
        const call=note.calls[0],region=at=>collectors.filter(range=>range.end<=at&&range.groups.includes(group)).length,
            local=observed.refs.some(other=>other.valid&&other.attrs?.name===call.value&&other.group===group&&other.body?.trim()&&region(other.start)===region(ref.start))||
                observed.helpers.some(other=>other.eligible&&other.calls.some(value=>value.value===call.value&&value.group===group&&value.body?.trim()&&region(other.start)===region(ref.start)));
        if(!local)return false;
    }
        // Supplied RefN bodies first obtain the exact existing default-list
        // insertion plan. They cannot activate before that list exists.
    return !!generated&&group===''&&!matching.length||matching.some(range=>range.start>=ref.end);
}
    function v219GeneratedReferenceEvents(source,boundary=null) {
    boundary=boundary||v219GeneratedReferenceBoundary(source);
    if(!boundary.present||!boundary.safe)return null;
    const observed=v219NativeReferenceObserver(source),collectors=rendererRanges(observed.view),events=[];
    for(const range of collectors){
        const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(raw,0),native=tag?.name==='references'?
            {recognized:true,ambiguous:!v24SyntaxAttrs(tag.attrs),groups:[v24SyntaxAttrs(tag.attrs)?.group||'']}:v219NativeCollectorGroups(raw);
        if(!native.recognized||native.ambiguous)return null;
        events.push({start:range.start,end:range.end,value:['collector',native.groups]});
    }
    for(const ref of observed.refs){
        if(collectors.some(range=>range.start<=ref.start&&ref.end<=range.end))continue;
            // The exact attr-free sole generated-helper outer ref is the
            // separately pinned nested-reference error repair. Its supplied
            // helper remains an event, never an invented generated name.
        if(ref.body!==null&&ref.attrs&&Object.keys(ref.attrs).length===0&&boundary.generated.some(helper=>
            ref.start<helper.start&&helper.end<ref.end&&ref.body.trim()===helper.raw)&&
            v219GeneratedOuterReferenceAllowed(source,ref,boundary))continue;
        events.push({start:ref.start,end:ref.end,value:['marker',ref.group||'']});
    }
    for(const helper of observed.helpers){
        if(helper.helperKind==='generated-note')events.push({start:helper.start,end:helper.end,value:['generated',helper.raw]});
        else if(helper.eligible)for(const call of helper.calls)events.push({start:call.start,end:call.end,value:['marker',call.group||'']});
    }
    return events.sort((a,b)=>a.start-b.start||b.end-a.end).map(event=>event.value);
}
    function v219CosmeticBaseGeneratedOrderRetention(before,after,cfg={}) {
    const expected=v219GeneratedReferenceEvents(before),actual=v219GeneratedReferenceEvents(after),same=value=>
        value!==null&&JSON.stringify(value)===JSON.stringify(actual);
    if(same(expected))return true;
        // These source-only producers never call retention guards. Each
        // fresh approved stage retains its normal source protections.
    let projected=cfg.references===false?before:v25ReferenceProofNormalization(before,cfg);
    if(same(v219GeneratedReferenceEvents(projected)))return true;
    const normal=mergeEditorialRanges([...v219QuotedTemplateRanges(projected),...v219UnknownTemplateRanges(projected,cfg),
        ...v219MarkdownLiteralRanges(projected),...discussionProtectionRanges(projected,cfg)]),
        shield=maskProtected(projected,()=>{},mergeEditorialRanges([...normal,
            ...v219ReferenceDefinitionPeerRanges(projected,normal,cfg)]));
    let text=shield.text;
    if(cfg.references!==false){text=normalizeLists(text,()=>{},()=>{});text=refPunctuation(text,()=>{},()=>{},cfg);}
    projected=shield.restore(text);
    const baseline=v219GeneratedReferenceEvents(projected);
    if(same(baseline))return true;
    if(!cfg.endMatter||!baseline||!v219GeneratedDefaultCollectorAllowed(projected,cfg)||
        baseline.some(event=>event[0]==='collector'&&event[1].includes('')))return false;
        // The existing missing-list writer may add exactly one default
        // collector after every native marker/helper. A legacy structural
        // plan that overlooks an opaque emitter cannot authorize crossing it.
    const added=shield.restore(endMatterPass(text,()=>{},()=>{},cfg)),events=v219GeneratedReferenceEvents(added);
    return events!==null&&events.length===baseline.length+1&&
        JSON.stringify(events.slice(0,-1))===JSON.stringify(baseline)&&
        JSON.stringify(events.at(-1))===JSON.stringify(['collector',['']])&&same(events);
}
    function v219CosmeticBaseGeneratedRetention(before,after,cfg={}) {
    const source=v219GeneratedReferenceBoundary(before),actual=v219GeneratedReferenceBoundary(after),
        fail=()=>({accepted:false,reason:'Uma citação curta passou a depender de um nome, alvo ou contexto não confirmado.'});
    if(!source.present)return actual.present?fail():{accepted:true,reason:''};
    if(!source.safe)return {accepted:true,reason:''}; // Exact quarantine inventory is checked separately.
    if(!actual.present||!actual.safe)return fail();
    const raw=state=>state.generated.map(helper=>helper.raw),original=raw(source),current=raw(actual);
    if(JSON.stringify(original)===JSON.stringify(current))return v219GeneratedReferenceOrderRetention(before,after,cfg)?{accepted:true,reason:''}:fail();
        // Reuse only the existing supplied-author producer, including its
        // native-bibliography/collision gate. Do not canonicalize the target.
    let projected=before;
    projected=mapTemplateTree(projected,value=>{
        if(!v219NativeCitationStateInterface(value))return value;
        const migrated=multilingualTemplate(value,cfg,()=>{},()=>{}).text;
        return automaticCitationRepairs(automaticParameters(migrated,cfg,()=>{}),cfg,()=>{});
    });
    projected=automaticShortCitationAuthors(projected,cfg,()=>{});
    const expected=v219GeneratedReferenceBoundary(projected);
    if(!expected.safe||JSON.stringify(raw(expected))!==JSON.stringify(current))return fail();
        // An author repair never licenses changing its local publication or
        // target anchor. Compare every complete native citation obligation.
    const publications=value=>v24SyntaxTemplates(v219NativeReferenceBraceView(value).view).nodes.map(node=>
        value.slice(node.start,node.end)).filter(value=>v219NativeCitationStateInterface(value)).map(value=>
            v219NativeBankBodyIdentity(value,cfg));
    return JSON.stringify(publications(projected))===JSON.stringify(publications(after))&&
        v219GeneratedReferenceOrderRetention(projected,after,cfg)?{accepted:true,reason:''}:fail();
}
    function v219RReferenceUses(source) {
    if(typeof source!=='string'||!/\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas)(?=[\s_|}])/i.test(source))return [];
    return v219NativeReferenceObserver(source).helpers.filter(profile=>profile.helperKind==='r'&&profile.eligible).flatMap(profile=>profile.calls).sort((a,b)=>a.start-b.start);
}
    function v219ReferenceNameUses(source) {
    const original=v219LegacyReferenceNameUses(source);
    if(typeof source!=='string'||!/refn|nre|efn|#tag/i.test(source))return original;
        // Retain the existing raw-attribute spans. Only exact, independently
        // pinned helper calls supply template-value spans and selected groups.
    const uses=original.filter(use=>source[use.ownerStart]==='<').concat(v219RReferenceUses(source));
    for(const profile of v219NativeNoteProfiles(source)){
        if(profile.helperKind!=='note'||!profile.eligible)continue;
        const call=profile.calls[0];if(!call?.value)continue;
        const parsed=parsedTemplate(profile.raw),entries=templateEntries(parsed);let cursor=profile.start+2;
        parsed.parts.forEach((part,index)=>{
            const entry=entries.find(entry=>entry.index===index);
            if(entry&&['name','nome'].includes(entry.key)&&entry.value===call.value){
                const start=cursor+entry.lead.length+entry.key.length+entry.eq.length,end=start+entry.value.length;
                if(source.slice(start,end)===call.value)uses.push({start,end,value:call.value,key:'name',
                    group:call.group,ownerStart:profile.start,ownerEnd:profile.end});
            }
            cursor+=part.length+1;
        });
    }
    return uses.sort((a,b)=>a.start-b.start);
}
    function v219NativeRNameOwner(source,edit) {
    return v219NativeReferenceObserver(source).helpers.find(profile=>profile.helperKind==='r'&&profile.eligible&&profile.calls.some(call=>
        call.start===edit.start&&call.end===edit.end)&&typeof edit.text==='string'&&edit.text&&
        !/[{}<>\[\]|&"'\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(edit.text)&&!v219UncertainReferenceIdentity(edit.text))||null;
}
    function v219BankBaseRendererContext(source,at,parsed,cache) {
    const ancestors=parsed.nodes.filter(node=>node.size===2&&node.start<at&&at<node.end);
    if(parsed.unclosed.some(node=>node.start<at)||ancestors.length!==1)
        return v24SyntaxRendererContext(source,at,parsed);
    const node=ancestors[0],key=node.start+':'+node.end;
    let profile=cache?.get(key);
    if(!profile){
        const native=v219NativeCollectorGroups(source.slice(node.start,node.end));
        profile={native:native.recognized,valid:false,group:'',start:0,end:0};
        if(native.recognized&&!native.ambiguous&&native.bankGroups.length===1){
            const parts=v24SyntaxParts(source.slice(node.start+2,node.end-2)),banks=parts?.slice(1).filter(part=>/^\s*refs\s*=/.test(part.text));
            if(banks?.length===1){const bank=banks[0];profile={native:true,valid:true,group:native.bankGroups[0],
                start:node.start+2+bank.start+bank.text.indexOf('=')+1,end:node.start+2+bank.end};}
        }
        cache?.set(key,profile);
    }
    return profile.native?{valid:profile.valid&&profile.start<=at&&at<profile.end,group:profile.group}:v24SyntaxRendererContext(source,at,parsed);
}
    function v219BareReferenceSourceProjection(source,cfg={}) {
    if(typeof source!=='string'||!/<ref\b/i.test(source))return source;
    const recovery=syntaxRepairPrefix(source,cfg);
    if(cfg.partialSyntaxRecovery!==false&&recovery.unresolved.length){
        if(recovery.end===0)return source;
        if(recovery.end<source.length){
            const prefix=source.slice(0,recovery.end),tail=source.slice(recovery.end),
                named=refTokens(protectedView(prefix)).filter(ref=>{const attrs=attrsOf(ref.attrs);return attrs&&(attrs.name||attrs.follow);}),
                guard=maskProtected(prefix,()=>{},mergeEditorialRanges([...named,
                    ...v219PartialReferenceQuarantineRanges(source,recovery.end,cfg),
                    ...v219ReferenceDefinitionPeerRanges(prefix,named,cfg)]));
            const local=syntaxPrefixOptions(cfg),bare=v219BareReferenceSourceProjection(guard.text,local);
            return guard.restore(v219PartialNativeFieldSource(bare,local))+tail;
        }
    }
    if(!cfg.bareReferences||!source.includes('['))return source;
    const c=v219ReferenceReservationOptions(source,cfg),normal=mergeEditorialRanges([...v219QuotedTemplateRanges(source),
        ...v219UnknownTemplateRanges(source,c),...v219UncertainReferenceRanges(source,c)]),
        shield=maskProtected(source,()=>{},mergeEditorialRanges([...normal,...v219ReferenceDefinitionPeerRanges(source,normal,c)]));
    return shield.restore(simpleReferences(shield.text,()=>{},cfg));
}
    // Literal named-reference obligations supplement the repair-specific
    // guards even when a page has no newly planned structural correction.
    // Names are not decoded here. Uncertain native entity/control identities
    // have a separate exact-raw preservation rule.
    function v219ReferenceBindingState(source,cfg={},allReferences=false,topology=false) {
    const empty={eligible:false,definitions:[],calls:[],rawClasses:[],opaqueCollectors:[],opaqueRefs:[],unread:0};
    if(typeof source!=='string'||source.length>4194304||!/<ref\b|\{\{/i.test(source)||
        cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg))return empty;
    const syntax=v24SyntaxScan(source),parsed=v219NativeReferenceObserver(source);
    if(syntax.issues.length||parsed.unclosed.length||parsed.empties.length||parsed.shield.unclosed.length)return empty;
    if(!allReferences&&!parsed.refs.some(ref=>ref.valid&&ref.attrs?.name)&&!parsed.helpers.some(profile=>profile.eligible&&profile.calls.length))return empty;
    const renderers=[];
    for(const range of rendererRanges(parsed.view)){
        const tag=v24SyntaxTag(source,range.start);
        if(tag?.name==='references'&&!tag.close){
            const attrs=v24SyntaxAttrs(tag.attrs);
            if(attrs&&Object.keys(attrs).every(key=>['group','responsive'].includes(key))&&
                !/[{}<>\[\]&\r\n]/.test(attrs.group||''))renderers.push({...range,groups:[attrs.group||'']});
            else renderers.push({...range,groups:null,raw:source.slice(range.start,range.end)});
        }else{
            const raw=source.slice(range.start,range.end),native=v219NativeCollectorGroups(raw);
            renderers.push({...range,groups:native.recognized&&!native.ambiguous?native.groups:null,raw});
        }
    }
    const key=(group,region,scope,name)=>JSON.stringify([group,region,scope,name]),items=[],families=new Map(),rawClasses=new Map(),bodyCache=new Map();
    let unread=0;const opaqueRefs=[],markupProtected=cfg.markup!==false&&/\[\[[^|\[\]\r\n]+\|'{2,3}/.test(source)?
        v219StageProtectedRanges(source,cfg):[];
    const helperCalls=parsed.helpers.filter(profile=>profile.eligible).flatMap(profile=>profile.calls.map(call=>({
        start:call.start,end:call.end,attrs:{name:call.value,group:call.group},group:call.group,body:call.body??null,valid:true,renderer:{valid:true,group:call.group},helper:true}))),
        observedRefs=[...parsed.refs,...helperCalls].sort((a,b)=>a.start-b.start||a.end-b.end);
    for(const ref of observedRefs){
        const attrs=ref.attrs;
        if(!ref.valid||!attrs||Object.keys(attrs).some(name=>!['name','group'].includes(name))||
            !ref.renderer.valid||ref.container&&!ref.container.valid){unread++;opaqueRefs.push(source.slice(ref.start,ref.end));continue;}
        const name=attrs.name||'',group=ref.group||'',parent=renderers.find(range=>range.start<=ref.start&&ref.end<=range.end),
            prior=renderers.filter(range=>range.end<=ref.start),scope=prior.filter(range=>range.groups===null).length,
            region=prior.filter(range=>range.groups?.includes(group)).length;
        if(parent?.groups===null){unread++;opaqueRefs.push(source.slice(ref.start,ref.end));continue;}
        const markupAllowed=!markupProtected.some(range=>range.start<=ref.start&&ref.end<=range.end),
            cacheKey=(markupAllowed?'1:':'0:')+(ref.body??'');
        if(ref.body!==null&&!bodyCache.has(cacheKey)){
            let canonical=mapTemplateTree(ref.body,raw=>{
                const plan=v219MaintenanceCall(raw,cfg);
                return plan.handled&&v219MaintenanceCallProof(raw,plan.text,plan,cfg)?plan.text:raw;
            });
            if(markupAllowed){const plan=v219ReferenceBodyMarkupPlan(canonical,cfg);
                if(plan.edits.length&&v219ReferenceBodyMarkupProof(canonical,plan.text,plan,cfg))canonical=plan.text;}
            const native=v219NativeBankBodyIdentity(canonical,cfg);
            bodyCache.set(cacheKey,native===null?JSON.stringify(['opaque-raw-reference-body',canonical]):native);
        }
        const body=ref.body===null?null:bodyCache.get(cacheKey),
            identity=key(group,region,scope,name),item={group,region,scope,name,body,rawBody:ref.body,bank:!!parent,identity};
        items.push(item);
    }
    for(const ref of items){
        const {name,body,identity}=ref;
        if(name&&body!==null){
            if(!families.has(identity))families.set(identity,new Set());families.get(identity).add(body);
            if(!rawClasses.has(identity))rawClasses.set(identity,new Set());rawClasses.get(identity).add(ref.rawBody);
        }
    }
    const definitions=[...families].map(([identity,bodies])=>[identity,[...bodies].sort()]).sort((a,b)=>a[0].localeCompare(b[0])),calls=[];
    for(const ref of items){
        if(ref.bank)continue;
        const bodies=ref.body===null?families.get(ref.identity):new Set([ref.body]);
        calls.push(bodies?[ref.group,ref.region,ref.scope,'resolved',[...bodies].sort()]:
            [ref.group,ref.region,ref.scope,'unresolved',ref.name]);
    }
    return {eligible:items.some(ref=>ref.name||ref.helper),definitions,calls,
        rawClasses:[...rawClasses].map(([identity,bodies])=>[identity,[...bodies]]),
        opaqueCollectors:renderers.filter(range=>range.groups===null).map(range=>range.raw),opaqueRefs,unread,
        ...(allReferences?{bankEntries:items.filter(ref=>ref.bank).map(ref=>[ref.identity,ref.body]),collectorGroups:renderers.map(range=>range.groups)}:{}),
        ...(topology?{topology:items.filter(ref=>!ref.bank).map(ref=>[ref.identity,!!ref.rawBody?.trim()])}:{})};
}
    function v219RawNamedReferenceInventory(source,cfg={}) {
    if(typeof source!=='string'||source.length>4194304||!/<ref\b|\{\{/i.test(source)||
        cfg.contentModel&&cfg.contentModel!=='wikitext')return [];
    const result=[];
    for(const ref of v219NativeReferenceObserver(source).refs){
        const attrs=ref.attrs;
        if(attrs?.name){
            const body=ref.body===null?null:ref.valid&&Object.keys(attrs).every(key=>['name','group'].includes(key))&&(!ref.container||ref.container.valid)?
                v219NativeBankBodyIdentity(ref.body,cfg):null;
            result.push({start:ref.start,value:body===null?[attrs.name,attrs.group??null,source.slice(ref.start,ref.end)]:
                [attrs.name,attrs.group??null,source.slice(ref.start,ref.end-ref.close.raw.length-ref.body.length),
                    ['native-body',body],ref.close.raw]});
        }
    }
    for(const helper of v219NativeReferenceObserver(source).helpers)
        result.push({start:helper.start,value:['native-reference-helper',helper.raw]});
    return result.sort((a,b)=>a.start-b.start).map(item=>item.value);
}
    function v219RawNamedReferenceClasses(source) {
    const classes=new Map();
    for(const ref of v219NativeReferenceObserver(source).refs){
        if(ref.body===null||!ref.attrs?.name||Object.keys(ref.attrs).some(key=>!['name','group'].includes(key)))continue;
        const key=JSON.stringify([ref.group,ref.attrs.name]);
        if(!classes.has(key))classes.set(key,new Set());classes.get(key).add(ref.body);
    }
    return classes;
}
    const v219FiniteAdjacentDefinitionSource=(source,cfg)=>{
        if(!v29ReferenceScope(source,cfg)||cfg.automaticIdenticalReferences===false)return source;
        const observed=v219NativeReferenceObserver(source),refs=observed.refs,edits=[],removed=new Set(),
            collectors=rendererRanges(observed.view),families=new Map(),familyProofs=new Map();
        if(refs.length>2048||collectors.length>128||observed.unclosed.length||observed.empties.length||observed.shield.unclosed.length||
            v24SyntaxScan(source).issues.length||observed.helpers.length)return source;
        const collectorIndex=rangeIndex(collectors),ends=collectors.map(range=>range.end).sort((a,b)=>a-b),
            region=at=>{let low=0,high=ends.length;while(low<high){const middle=(low+high)>>>1;if(ends[middle]<=at)low=middle+1;else high=middle;}return low;},
            contained=ref=>{const at=rangePosition(ref.start,collectorIndex);return at>=0&&collectorIndex.max[at]>=ref.end;};
        const key=ref=>JSON.stringify([ref.group||'',ref.attrs?.name||'']),
            literal=ref=>ref.valid&&ref.attrs&&Object.keys(ref.attrs).every(name=>name==='name'||name==='group')&&
                !!ref.attrs.name&&v24SyntaxLiteralIdentity(ref.attrs,true)&&!v219UncertainReferenceIdentity(ref.attrs.name)&&
                !v219UncertainReferenceIdentity(ref.group||'')&&ref.renderer.valid&&!ref.container&&v29ReferenceTag(source,ref)&&
                !contained(ref),
            root=ref=>{const context=v219IndexedSyntaxContext(source,ref.start);return context&&
                ['templates','html','tables','links','external'].every(name=>context[name].length===0);};
        for(const ref of refs){if(!families.has(key(ref)))families.set(key(ref),[]);families.get(key(ref)).push(ref);}
        for(let ordinal=1;ordinal<refs.length;ordinal++){
            const ref=refs[ordinal],definition=refs[ordinal-1];
            if(!literal(ref)||!literal(definition)||ref.body!==null||definition.body===null||
                key(ref)!==key(definition)||!/^[ \t]*$/.test(source.slice(definition.end,ref.start))||!root(ref)||!root(definition))continue;
            const identity=key(ref);
            if(!familyProofs.has(identity)){
                const family=families.get(identity),definitions=family.filter(item=>item.body!==null);
                familyProofs.set(identity,definition.body.length<=65536&&v29ReferenceBody(definition.body)&&
                    v219CitationLanguageNamedMoveBody(definition.body)&&definitions.length>0&&
                    !definitions.some(item=>item.body!==definition.body)&&
                    !family.some(item=>!literal(item)||!root(item)||region(item.start)!==region(ref.start)));
            }
            if(!familyProofs.get(identity))continue;
            removed.add(ordinal);edits.push({start:ref.start,end:ref.end,text:'',ruleId:'v29AnchorReferences'});
        }
        if(!edits.length)return source;
        const declared=v29ReferenceRepairPlan(source,cfg);
        if(!v29ReferenceRepairProof(source,declared.text,declared,cfg)||edits.some(edit=>!declared.edits.some(item=>
            item.start===edit.start&&item.end===edit.end&&item.text===''&&item.ruleId===edit.ruleId))||
            JSON.stringify(v219StageSafeEdits(source,edits,'v219-finite-adjacent-definition-source',cfg))!==JSON.stringify(edits))return source;
        const projected=v24SyntaxApply(source,edits),current=v219NativeReferenceObserver(projected),
            signature=(text,read,skip)=>{
                const rows=read.refs.flatMap((ref,ordinal)=>skip.has(ordinal)?[]:[{at:ref.start,kind:1,value:[text.slice(ref.start,ref.end),ref.attrs,
                    ref.group??null,ref.renderer?.valid??null,ref.renderer?.group??null,ref.container?.valid??null,ref.container?.group??null]}]);
                for(const collector of rendererRanges(read.view))rows.push({at:collector.start,kind:0,value:['collector',text.slice(collector.start,collector.end)]});
                return rows.sort((a,b)=>a.at-b.at||a.kind-b.kind).map(row=>row.value);
            };
        if(current.unclosed.length||current.empties.length||current.helpers.length||
            current.refs.length!==refs.length-removed.size||
            JSON.stringify(signature(source,observed,removed))!==JSON.stringify(signature(projected,current,new Set())))return source;
        const named=v219CitationLanguageNamedMovePlan(projected,cfg);
        return v219CitationLanguageNamedMoveProof(projected,named.text,named,cfg)?projected:source;
    };

    function v219CosmeticBaseNamedRetention(before,after,options={}) {
    const empty={accepted:true,reason:'',checked:0};
    if(before===after||typeof before!=='string'||typeof after!=='string'||
        !/<ref\b[^>]*\bname\s*=|\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas|refn|nre|efn|#tag[\s_]*:[\s_]*ref)(?=[\s_|}])/i.test(before))return empty;
    const cfg=pageContextOptions({...DEFAULTS,...options}),original=v219ReferenceBindingState(before,cfg,false,true),
        actualRaw=v219ReferenceBindingState(after,cfg,false,true),reject=reason=>({accepted:false,checked:original.calls.length,reason});
        // Never turn a new raw split into apparent canonical equivalence.
        // This obligation always starts with the unprojected source class.
    if(original.eligible){
        const rawAfter=new Map(actualRaw.rawClasses);
        for(const [identity,bodies]of original.rawClasses)if(bodies.length===1&&(rawAfter.get(identity)?.length||0)>1)
            return reject('Definições antes idênticas da mesma referência passaram a ter códigos diferentes.');
    }else{
        const afterClasses=v219RawNamedReferenceClasses(after);
        for(const [key,bodies]of v219RawNamedReferenceClasses(before))
            if(bodies.size===1&&(afterClasses.get(key)?.size||0)>1)
                return reject('Definições antes idênticas da mesma referência passaram a ter códigos diferentes.');
    }
    const compare=baseline=>{
        const sourceState=v219ReferenceBindingState(baseline,cfg,false,true);
        if(!sourceState.eligible||!actualRaw.eligible||actualRaw.unread>sourceState.unread)
            return reject('Uma referência deixou de ter nome, grupo ou conteúdo legível fora dos ajustes confirmados.');
        const project=value=>cfg.references===false?v219BareReferenceSourceProjection(value,cfg):v25ReferenceProofNormalization(value,cfg),
            expected=v219ReferenceBindingState(project(baseline),cfg),actual=v219ReferenceBindingState(project(after),cfg);
        if(!expected.eligible||!actual.eligible)return reject('Não foi possível confirmar a associação das referências após os ajustes.');
        if(JSON.stringify(expected.opaqueRefs)!==JSON.stringify(actual.opaqueRefs)||
            JSON.stringify(expected.opaqueCollectors)!==JSON.stringify(actual.opaqueCollectors)||
            JSON.stringify(expected.calls)!==JSON.stringify(actual.calls))
            return reject('A ordem das chamadas ou a associação com a fonte mudou fora dos ajustes confirmados.');
        if(JSON.stringify(sourceState.topology)!==JSON.stringify(actualRaw.topology)){
            const read=value=>v219ReferenceBindingState(v25ReferenceProofNormalization(value,cfg,true),cfg,false,true).topology,
                left=read(baseline),right=read(after);
            if(!left||!right||JSON.stringify(left)!==JSON.stringify(right)){
                const plan=v219CitationLanguageNamedMovePlan(baseline,cfg),observed=v219NativeReferenceObserver(baseline),
                    source=sourceState.topology,target=actualRaw.topology,groups=new Map(),selected=[],reason='A posição de uma definição nomeada mudou fora dos ajustes confirmados.';
                if(!plan.edits.length||!v219CitationLanguageNamedMoveProof(baseline,plan.text,plan,cfg)||
                    sourceState.unread||actualRaw.unread||observed.helpers.length||source.length!==observed.refs.length||source.length!==target.length)
                    return reject(reason);
                for(let i=0;i<source.length;i++){
                    if(source[i][0]!==target[i][0])return reject(reason);
                    if(!groups.has(source[i][0]))groups.set(source[i][0],[]);groups.get(source[i][0]).push(i);
                }
                for(const [identity,indices]of groups){
                    if(indices.every(i=>source[i][1]===target[i][1]))continue;
                    const [group,,,name]=JSON.parse(identity),family=plan.families.find(item=>item.group===group&&item.name===name);
                    if(!family||indices.length!==family.sites.length||indices.some((i,j)=>target[i][1]!==(family.sites[j].ordinal===family.keeper)))
                        return reject(reason);
                    selected.push(family);
                }
                if(!v219CitationLanguageNamedMoveSitesRetained(baseline,after,plan,cfg,selected))return reject(reason);
            }
        }
        const names=new Set(sourceState.definitions.map(([identity])=>{
            const [group,, ,name]=JSON.parse(identity);return JSON.stringify([group,name]);
        })),available=new Map(actual.definitions);
        for(const [identity,bodies]of expected.definitions){
            const [group,, ,name]=JSON.parse(identity);
            if(names.has(JSON.stringify([group,name]))&&JSON.stringify(available.get(identity))!==JSON.stringify(bodies))
                return reject('Uma definição nomeada passou a apontar para outra fonte, grupo ou lista.');
        }
        return {...empty,checked:sourceState.calls.length};
    };
        // Most pages require no extra plan. If a declared syntax repair changed
        // a citation, project the source once through that finite fresh plan.
        // It calls no global guard and is never applied to the supplied output.
    const first=original.eligible?compare(before):null;
    if(first?.accepted)return first;
    const adjacent=v219FiniteAdjacentDefinitionSource(before,cfg);
    if(adjacent!==before){const retained=compare(adjacent);if(retained.accepted)return retained;}
    let baseline=v25ApprovedSyntaxPlan(before,cfg).text;
    if(cfg.references!==false&&structuralScope(cfg)&&!v219ReferenceIdentityQuarantine(baseline,cfg).opaque){
        const collectorPlan=structuralArticlePlan(baseline,cfg).referencePlan;
        if(collectorPlan)baseline=collectorPlan.text;
    }
    if(v219ReferenceBindingState(baseline,cfg).eligible)return baseline===before&&first?first:compare(baseline);
    const observed=v219NativeReferenceObserver(baseline);
    if(cfg.references!==false&&!v24SyntaxScan(baseline).issues.length&&!observed.unclosed.length&&!observed.empties.length)
        baseline=v25ReferenceProofNormalization(baseline,cfg);
    else baseline=v219BareReferenceSourceProjection(baseline,cfg);
    return v219PartialReferenceRetention(before,baseline,after,cfg);
}
    // Carry occupied literal names from the original source through masks and
    // partial-prefix cleanup. A caller can add reservations, never remove one.
    function v219CosmeticBaseNameReservation(source,cfg={}) {
    const prior=cfg.v219ReferenceReservation,names=new Set(Array.isArray(prior?.names)?
        prior.names.filter(value=>typeof value==='string'):[]);
    let dynamic=prior?.dynamic===true;
    if(typeof source==='string'&&source.length<=4194304&&/<ref\b|\{\{[\s_]*(?:(?:predefinição|template)[\s_]*:[\s_]*)?(?:r(?:\/ref)?|referências[ _]+múltiplas|refn|nre|efn|#tag\s*:\s*ref)(?=[\s_|}])/i.test(source)){
        const observed=v219NativeReferenceObserver(source);
        if(observed.helpers.some(helper=>!helper.eligible))dynamic=true;
        for(const helper of observed.helpers)for(const call of helper.calls)names.add(call.value);
        for(const ref of [...observed.refs,...observed.unclosed,...observed.empties]){
            if(!ref.attrs){if(/\b(?:name|follow)\s*=/i.test(ref.raw||''))dynamic=true;continue;}
            for(const key of ['name','follow'])if(Object.hasOwn(ref.attrs,key)){
                const raw=ref.attrs[key];names.add(raw);
                if(/[{}\uE000-\uF8FF]/.test(raw))dynamic=true;
                else if(!v219UncertainReferenceIdentity(raw))names.add(decodedReferenceName(raw));
            }
        }
        for(const use of referenceNameUses(observed.view)){
            names.add(use.value);
            if(/[{}\uE000-\uF8FF]/.test(use.value))dynamic=true;
            else if(!v219UncertainReferenceIdentity(use.value))names.add(decodedReferenceName(use.value));
        }
    }
    return {names:[...names],dynamic};
}
    function v219ReferenceReservationOptions(source,cfg={}) {
    return {...cfg,v219ReferenceReservation:v219ReferenceNameReservation(source,cfg)};
}
    function v219ReferenceOccupiedNames(source,cfg={}) {
    return new Set(v219ReferenceNameReservation(source,cfg).names);
}

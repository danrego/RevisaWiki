    // Bounded structural repairs. Unknown consumers and reference associations stay unchanged.
    const V2212_STRUCTURE_MONTHS=Object.freeze({january:'janeiro',february:'fevereiro',march:'março',april:'abril',may:'maio',june:'junho',july:'julho',august:'agosto',september:'setembro',october:'outubro',november:'novembro',december:'dezembro'});
    const V2212_STRUCTURE_BOX_KEYS=Object.freeze([
        {title:'Imagem múltipla',from:'widht',to:'largura',alternatives:['width'],kind:'dimension',contract:69285958},
        {title:'Info/Artista',from:'nomecompleto',to:'nome_completo',contract:71821191},
        {title:'Info/Hotel',from:'tamanho_logo',to:'logo_tamanho',alternatives:['logo-tamanho'],kind:'dimension',contract:72768596},
        {title:'Info/Disciplina',from:'imagem_legenda',to:'legenda',contract:72963198},
        {title:'Info/Disciplina',from:'campo',to:'area',contract:72963198},
        {title:'Info/Estado extinto2',from:'ano_evento_posterio',to:'ano_evento_posterior',contract:67820624},
        {title:'Info/Droga',from:'ATC_sufixo',to:'sufixo_ATC',contract:69873897}
    ]);
    function v2212StructureScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&cfg.namespaceNumber===0&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&!cfg.sectionOnly&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='')&&!cfg.discussionPage&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&cfg.markup!==false&&cfg.structuralRepairs!==false&&
            cfg.v2212StructureRepairs!==false&&!/~{3,5}/.test(source);
    }
    function v2212StructureContext(source) {
        const shield=v24SyntaxProtected(source),parsed=v215BraceStructure(shield.view);
        return {source,view:shield.view,parsed,nodes:parsed.nodes.filter(n=>n.size===2),
            protected:[...shield.ranges,...v219MarkdownLiteralRanges(source),...v219WholeQuotedCodeRanges(source)]};
    }
    function v2212StructureProtected(c,start,end) {
        return c.protected.some(r=>r.start<end&&r.end>start);
    }
    function v2212StructureTitle(raw) {
        const parts=v215BraceParts(raw.slice(2,-2),true);if(!parts)return null;
        const literal=v215TemplateTitle(parts[0].text.replace(/<!--[\s\S]*?-->/g,''));
        return literal&&!/[{}<>\r\n]/.test(literal)?literal:null;
    }
    function v2212StructureFields(raw) {
        const parts=v215BraceParts(raw.slice(2,-2),true);if(!parts)return null;
        const fields=[];let position=1;
        for(const part of parts.slice(1)){
            const m=/^(\s*)([^=]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(m){const key=m[2].trim();if(!key||/[{}<>\r\n|]/.test(key))return null;
                const keyStart=2+part.start+m[1].length+/^\s*/.exec(m[2])[0].length;
                fields.push({key,value:m[4],keyStart,keyEnd:keyStart+key.length});
            }else fields.push({key:String(position++),value:part.text,positional:true});
        }
        return new Set(fields.map(f=>f.key)).size===fields.length?fields:null;
    }
    function v2212StructureBox(raw) {
        const literal=v2212StructureTitle(raw);if(!literal)return false;
        const profile=INFOBOX_CATALOG[norm(literal)];
        return !!profile&&v215SameTemplateTitle(literal,profile.title)||/^Info\//.test(literal)&&
            V2212_STRUCTURE_BOX_KEYS.some(row=>v215SameTemplateTitle(literal,row.title));
    }
    function v2212StructureOwner(c,start,end,{ref=false,ownTemplate=false,allowInnerProtected=false}={}) {
        if(c.protected.some(r=>r.start<end&&r.end>start&&!(allowInnerProtected&&r.start>start&&r.end<end)))return false;
        for(const n of c.nodes){
            if(n.start<=start&&n.end>=end&&!(ownTemplate&&n.start===start&&n.end===end)&&!v2212StructureBox(c.source.slice(n.start,n.end)))return false;
        }
        const state=v24SyntaxContext(c.view,start);
        if(state.links.length||state.external.length||state.html.some(t=>!ref||t.name!=='ref'))return false;
        return true;
    }
    function v2212StructureEdit(source,start,end,text,ruleId,label,contract) {
        return {start,end,text,ruleId,label,proof:{sourceHash:v24SyntaxHash(source),before:source.slice(start,end),contract}};
    }
    function v2212StructureFinish(source,edits) {
        const distinct=[];
        for(const e of edits){
            if(e.text===source.slice(e.start,e.end)||e.start<0||e.end>source.length||e.end<=e.start)continue;
            if(!distinct.some(x=>x.start===e.start&&x.end===e.end&&x.text===e.text))distinct.push(e);
        }
        const selected=distinct.filter(e=>!distinct.some(other=>other!==e&&e.start<other.end&&other.start<e.end)).sort((a,b)=>a.start-b.start||a.end-b.end);
        return {source,sourceHash:v24SyntaxHash(source),text:v24SyntaxApply(source,selected),edits:selected};
    }
    function v2212StructureMonthYear(value) {
        let m=/^([A-Za-z]+) ([12]\d{3})$/.exec(value);
        if(m&&V2212_STRUCTURE_MONTHS[m[1].toLowerCase()])return V2212_STRUCTURE_MONTHS[m[1].toLowerCase()]+' de '+m[2];
        m=/^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de ([12]\d{3})$/.exec(value);
        return m?value:null;
    }
    function v2212StructureTemplateEdits(source,cfg,c) {
        const edits=[];
        for(const n of c.nodes){
            const head=source.slice(n.start+2,Math.min(n.end-2,n.start+150)).split('|')[0].replace(/<!--[\s\S]*?-->/g,'').trim();
            if(!/^(?:[Cc]n|[Cc]larify|[Ee]sclarecer|[Ii]magem múltipla|[Ii]nfo\/(?:Artista|Hotel|Disciplina|Estado extinto2|Droga))$/.test(head))continue;
            if(!v2212StructureOwner(c,n.start,n.end,{ref:true,ownTemplate:true,allowInnerProtected:true}))continue;
            const raw=source.slice(n.start,n.end),title=v2212StructureTitle(raw),fields=v2212StructureFields(raw);
            if(!title||!fields)continue;
            if(cfg.translationResidues!==false&&(title==='cn'||title==='Cn')&&fields.length===1&&['data','date'].includes(fields[0].key)&&!fields[0].positional){
                const date=v2212StructureMonthYear(fields[0].value.trim());
                if(date)edits.push(v2212StructureEdit(source,n.start,n.end,'{{Carece de fontes|data='+date+'}}','v2212ImportedSourceMarker','Marca de falta de fonte recuperada','Cn 56167716 has a different native meaning; one unambiguous maintenance-date field; Carece de fontes 72919072'));
            }
            if(cfg.translationResidues!==false&&['Clarify','Esclarecer'].some(t=>v215SameTemplateTitle(title,t))){
                const reason=fields.find(f=>f.key==='reason');
                if(reason&&reason.value.trim()&&!fields.some(f=>f.key==='1')&&!/[{}<>\r\n]/.test(reason.value))
                    edits.push(v2212StructureEdit(source,n.start+reason.keyStart,n.start+reason.keyEnd,'1','v2212ClarificationReason','Motivo de esclarecimento recuperado','Esclarecer 56173037 consumes positional parameter 1; reason value and all other arguments retained'));
            }
            if(cfg.infoboxes===false||cfg.automaticParameterNames===false)continue;
            for(const row of V2212_STRUCTURE_BOX_KEYS){
                if(!v215SameTemplateTitle(title,row.title))continue;
                const field=fields.find(f=>!f.positional&&f.key===row.from);
                if(!field||!field.value.trim()||fields.some(f=>[row.to,...row.alternatives||[]].includes(f.key)))continue;
                if(row.kind==='dimension'&&!/^\s*[1-9]\d{0,3}(?:px)?\s*$/.test(field.value))continue;
                edits.push(v2212StructureEdit(source,n.start+field.keyStart,n.start+field.keyEnd,row.to,'v2212NativeBoxKey','Campo da infocaixa corrigido',{nativeTitle:row.title,oldid:row.contract,from:row.from,to:row.to,value:field.value}));
            }
        }
        return edits;
    }
    function v2212StructureHttp(value) {
        if(typeof value!=='string'||!/^https?:\/\/[^\s\[\]{}<>|"'\\]+$/.test(value))return false;
        try{const u=new URL(value);return !!u.hostname&&u.hostname.includes('.')&&!u.username&&!u.password;}catch(_){return false;}
    }
    function v2212StructureFileRequests(source,cfg={},context=null) {
        if(!v2212StructureScope(source,cfg)||cfg.images===false||cfg.links===false)return [];
        const c=context||v2212StructureContext(source),out=[];
        for(const n of editorialWikiLinkRanges(c.view)){
            if(!source.slice(n.start,n.end).endsWith(']]')||!/^\[\[https:\/\//.test(source.slice(n.start,n.start+12)))continue;
            if(!v2212StructureOwner(c,n.start,n.end,{ref:false}))continue;
            const raw=source.slice(n.start,n.end),parts=v215BraceParts(raw.slice(2,-2),true);
            if(!parts||parts.length<2)continue;
            const target=parts[0].text;
            if(!/^https:\/\/(?:[a-z-]+\.wikipedia\.org|commons\.wikimedia\.org)\/wiki\/(?:File|Ficheiro|Arquivo|Datei|Fichier|Fichier|Archivo):/u.test(target))continue;
            let u,fileName;
            try{u=new URL(target);if(u.search||u.hash||u.username||u.password)continue;fileName=decodeURIComponent(u.pathname.replace(/^\/wiki\/[^:]+:/,'')).replace(/_/g,' ');}catch(_){continue;}
            if(!fileName||fileName!==fileName.trim()||/[\[\]{}<>|\r\n#?]/.test(fileName)||fileName.includes('/../'))continue;
            if(!parts.slice(1).some(f=>/^(?:thumb|thumbnail|miniatura|miniaturadaimagem|left|right|esquerda|direita|[1-9]\d{0,3}px)$/.test(f.text.trim())))continue;
            out.push({start:n.start+2,end:n.start+2+target.length,target,fileName,sourceHash:v24SyntaxHash(source)});
        }
        return out;
    }
    function v2212StructureFileOriginProof(request,proof) {
        let url;
        try{url=new URL(request.target);}catch(_){return false;}
        if(url.hostname==='pt.wikipedia.org')return /^\/wiki\/(?:File|Ficheiro|Arquivo):/u.test(url.pathname);
        if(url.hostname!=='commons.wikimedia.org'||!/^\/wiki\/File:/u.test(url.pathname)||proof.repository!=='shared'||typeof proof.canonicalTitle!=='string')return false;
        const title=/^(?:Ficheiro|Arquivo|File):(.+)$/u.exec(proof.canonicalTitle);
        return !!title&&title[1].replace(/_/g,' ').normalize('NFC')===request.fileName.normalize('NFC');
    }
    function v2212StructureFileEdits(source,cfg={},context=null) {
        const proofs=Array.isArray(cfg.v2212VerifiedFiles)?cfg.v2212VerifiedFiles:[];
        return v2212StructureFileRequests(source,cfg,context).flatMap(r=>{
            const proof=proofs.find(p=>p&&p.target===r.target&&p.fileName===r.fileName&&p.available===true&&
                (p.sourceHash===r.sourceHash||typeof cfg.v2212OriginalDraftHash==='string'&&p.sourceHash===cfg.v2212OriginalDraftHash)&&
                ['shared','local'].includes(p.repository)&&v2212StructureFileOriginProof(r,p)&&p.method==='imageinfo'&&typeof p.responseSha256==='string'&&/^[a-f0-9]{64}$/.test(p.responseSha256));
            return proof?[v2212StructureEdit(source,r.start,r.end,'Ficheiro:'+r.fileName,'v2212ForeignFileTarget','Nome de ficheiro recuperado',{request:r,repository:proof.repository,responseSha256:proof.responseSha256})]:[];
        });
    }
    function v2212StructureInfoboxReferenceLinks(source,cfg,c) {
        if(cfg.references===false||cfg.links===false||cfg.infoboxes===false)return [];
        const edits=[];
        for(const m of c.view.matchAll(/\[\[(https?:\/\/[^\s\[\]{}<>|]+)\]\]/g)){
            const start=m.index,end=start+m[0].length;if(!v2212StructureHttp(m[1])||v2212StructureProtected(c,start,end))continue;
            const refs=refTokens(c.view).filter(r=>r.body!==null&&r.start<start&&r.end>end);
            if(refs.length!==1)continue;
            const owner=c.nodes.filter(n=>n.start<refs[0].start&&n.end>refs[0].end);
            if(owner.length!==1||!v2212StructureBox(source.slice(owner[0].start,owner[0].end)))continue;
            if(c.nodes.some(n=>n.start<=start&&n.end>=end&&n!==owner[0]))continue;
            edits.push(v2212StructureEdit(source,start,end,'['+m[1]+']','v2212InfoboxReferenceLink','Colchetes de ligação na referência corrigidos','One complete literal ref owned by one confirmed infobox; exact external URL and reference attributes retained'));
        }
        return edits;
    }
    function v2212StructureDoubledNameEdits(source,cfg,c) {
        if(cfg.references===false||cfg.syntaxRepairs===false)return [];
        const groups=new Map(),edits=[];
        for(const m of c.view.matchAll(/<ref\s+name=''([A-Za-z][A-Za-z0-9_.:-]{0,100})''\s*(\/?)>/g)){
            if(!v2212StructureOwner(c,m.index,m.index+m[0].length,{ref:true}))continue;
            if(!groups.has(m[1]))groups.set(m[1],[]);groups.get(m[1]).push(m);
        }
        for(const [name,rows]of groups){
            if(rows.filter(r=>!r[2]).length!==1||!rows.some(r=>r[2]))continue;
            const otherNames=new RegExp('(?:<ref\\b[^<>]*\\b(?:name|follow)\\s*=\\s*["\\\']'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\\\']|\\{\\{[^{}]*(?:name|nome)\\s*=\\s*'+name+'(?:[|}]))','i');
            if(otherNames.test(c.view))continue;
            const known=referenceNameUses(c.view),ownStarts=new Set(rows.map(r=>r.index));
            if(known.some(use=>!ownStarts.has(use.ownerStart)&&decodedReferenceName(use.value)===name))continue;
            const observed=v219NativeReferenceObserver(c.view);
            if(observed.helpers.some(helper=>!helper.eligible))continue;
            const opening=rows.find(r=>!r[2]),close=/<\/ref\s*>/gi;close.lastIndex=opening.index+opening[0].length;const tail=close.exec(c.view);
            if(!tail||/<\/?ref\b/i.test(c.view.slice(opening.index+opening[0].length,tail.index)))continue;
            for(const m of rows)edits.push(v2212StructureEdit(source,m.index,m.index+m[0].length,m[0].replace("name='"+"'"+name+"''",'name="'+name+'"'),'v2212ReferenceNameQuotes','Aspas do nome da referência corrigidas',{native:'Cite literal name',name,definitionStart:opening.index,body:source.slice(opening.index+opening[0].length,tail.index)}));
        }
        return edits;
    }
    function v2212StructureMissingNameQuoteEdits(source,cfg,c) {
        if(cfg.references===false||cfg.syntaxRepairs===false)return [];
        const edits=[];
        for(const m of source.matchAll(/<ref\s+name="([A-Za-z][A-Za-z0-9_.:-]{0,100})>/g)){
            const start=m.index,end=start+m[0].length;
            if(c.protected.some(r=>r.start<end&&r.end>start&&!(r.kind==='quotation'&&r.start>=start&&r.start<end)))continue;
            const close=/<\/ref\s*>/gi;close.lastIndex=end;const tail=close.exec(source);
            if(!tail||/<\/?ref\b/i.test(source.slice(end,tail.index)))continue;
            const body=source.slice(end,tail.index),scan=v215BraceStructure(body);
            if(scan.unclosed.length||scan.unclosedLinks.length||!/^\s*\{\{[Cc]itar (?:web|jornal|periódico|livro)\s*\|/.test(body)||!body.trimEnd().endsWith('}}'))continue;
            // The incomplete quote can confuse a whole-document tag reader. Read
            // its owner after only the one-byte repair, never after disabling it.
            const fixed=v24SyntaxApply(source,[{start:end-1,end:end-1,text:'"'}]),fc=v2212StructureContext(fixed);
            if(!v2212StructureOwner(fc,start,tail.index+7,{ref:true}))continue;
            edits.push(v2212StructureEdit(source,end-1,end,'">','v2212ReferenceMissingQuote','Aspas do nome da referência completadas',{name:m[1],body,native:'Cite tolerates this opener; one quote restores an unambiguous source boundary'}));
        }
        return edits;
    }
    function v2212StructureNestedReferenceEdits(source,cfg,c) {
        if(cfg.references===false||cfg.syntaxRepairs===false)return [];
        const stack=[],pairs=[],edits=[];
        for(const m of c.view.matchAll(/<\s*(\/?)\s*ref\b([^<>]*)>/gi)){
            const close=!!m[1],self=/\/\s*$/.test(m[2]);
            if(close){if(!stack.length)continue;const open=stack.pop();pairs.push({...open,end:m.index+m[0].length,closeStart:m.index,depth:stack.length});}
            else if(!self)stack.push({start:m.index,openEnd:m.index+m[0].length,raw:m[0],attrs:m[2],parentStart:stack.at(-1)?.start??null});
        }
        const children=new Map();for(const p of pairs){if(!children.has(p.parentStart))children.set(p.parentStart,[]);children.get(p.parentStart).push(p);}
        for(const outer of pairs.filter(p=>p.depth===0&&children.has(p.start))){
            const inner=children.get(outer.start);
            if(inner.some(p=>children.has(p.start))||!v2212StructureOwner(c,outer.start,outer.end,{ref:true,allowInnerProtected:true}))continue;
            const a=v24SyntaxAttrs(outer.attrs);
            if(!a||Object.keys(a).some(k=>k!=='group')||a.group!==undefined&&!/^[A-Za-z][A-Za-z0-9_-]{0,59}$/.test(a.group))continue;
            if(inner.some(p=>{const attrs=v24SyntaxAttrs(p.attrs);return !attrs||Object.keys(attrs).some(k=>!['name','group'].includes(k));}))continue;
            const body=source.slice(outer.openEnd,outer.closeStart),parts=v215BraceParts(body,true),scan=v215BraceStructure(body);
            if(!parts||parts.length!==1||scan.unclosed.length||scan.unclosedLinks.length)continue;
            const text='{{Refn|1='+body+(a.group?'|group='+a.group:'')+'}}';
            edits.push(v2212StructureEdit(source,outer.start,outer.end,text,'v2212NestedReference','Referência interna preservada em nota válida',{nativeTitle:'Refn',oldid:57056787,body,group:a.group||'',innerBodies:inner.map(p=>source.slice(p.start,p.end))}));
        }
        return edits;
    }
    function v2212StructureHybridLinkEdits(source,cfg,c) {
        if(cfg.links===false||cfg.syntaxRepairs===false)return [];
        const edits=[];
        for(const m of c.view.matchAll(/\[\[(https?:\/\/[^\s\[\]{}<>|()]+)\]\((https?:\/\/[^\s\[\]{}<>|()]+)\)[ \t]+([^\[\]{}<>\r\n]+)\]/g)){
            if(m[1]!==m[2]||!m[3].trim()||!v2212StructureHttp(m[1])||!v2212StructureOwner(c,m.index,m.index+m[0].length,{ref:true}))continue;
            edits.push(v2212StructureEdit(source,m.index,m.index+m[0].length,'['+m[1]+' '+m[3]+']','v2212HybridExternalLink','Ligação externa híbrida corrigida','Two literal identical HTTP URLs; existing label retained exactly; no nested syntax'));
        }
        return edits;
    }
    function v2212StructureNeedsPrerequisite(source) {
        if(/<ref\s+name=''|<ref\s+name="[A-Za-z][A-Za-z0-9_.:-]{0,100}>|\[\[https?:\/\/[^\r\n]*\]\(https?:\/\//.test(source))return true;
        let depth=0;
        for(const m of source.matchAll(/<\s*(\/?)\s*ref\b([^<>]*)>/gi)){
            if(m[1])depth=Math.max(0,depth-1);
            else if(!/\/\s*$/.test(m[2])&&++depth>1)return true;
        }
        return false;
    }
    function v2212StructurePrerequisitePlan(source,cfg={}) {
        if(!v2212StructureScope(source,cfg)||!v2212StructureNeedsPrerequisite(source))return v2212StructureFinish(source,[]);
        const c=v2212StructureContext(source);
        return v2212StructureFinish(source,[...v2212StructureDoubledNameEdits(source,cfg,c),
            ...v2212StructureMissingNameQuoteEdits(source,cfg,c),...v2212StructureNestedReferenceEdits(source,cfg,c),
            ...v2212StructureHybridLinkEdits(source,cfg,c)]);
    }
    function v2212StructurePrerequisiteProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2212StructurePrerequisitePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v2212StructurePlan(source,cfg={}) {
        if(!v2212StructureScope(source,cfg)||!/(?:\{\{[ \t]*(?:[Cc]n|[Cc]larify|[Ee]sclarecer|[Ii]magem múltipla|[Ii]nfo\/(?:Artista|Hotel|Disciplina|Estado extinto2|Droga))[ \t\r\n|}]|\[\[https?:\/\/)/.test(source))return v2212StructureFinish(source,[]);
        const c=v2212StructureContext(source);
        return v2212StructureFinish(source,[...v2212StructureTemplateEdits(source,cfg,c),
            ...v2212StructureInfoboxReferenceLinks(source,cfg,c),...v2212StructureFileEdits(source,cfg,c)]);
    }
    function v2212StructureProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2212StructurePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

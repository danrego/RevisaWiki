    // Portais: contratos finitos de assunto, sem alterar os dados do artigo.
    const V2212_PORTAL_BOXES=Object.freeze({
        'Info/Livro':{oldid:71125809,family:'PORTAL-R2-01',kind:'book'},
        'Info/Álbum':{oldid:72967282,family:'PORTAL-R2-02',kind:'album'},
        'Info/Universidade':{oldid:72732061,family:'PORTAL-R2-03',targets:['Educação']},
        'Info/Rede de televisão':{oldid:72719339,family:'PORTAL-R2-04',targets:['Televisão']},
        'Info/Canal de televisão':{oldid:72270233,family:'PORTAL-R2-04',targets:['Televisão']},
        'Info/Jornal':{oldid:71209271,family:'PORTAL-R2-05',targets:['Jornalismo']},
        'Info/Município do Brasil':{oldid:72887487,family:'PORTAL-R2-06',targets:['Geografia']},
        'Info/Rio':{oldid:71962339,family:'PORTAL-R2-07',targets:['Geografia']},
        'Info/Ilha':{oldid:72370863,family:'PORTAL-R2-08',targets:['Geografia']},
        'Info/Conflito militar':{oldid:72740211,family:'PORTAL-R2-09',targets:['Guerra']},
        'Info/Software':{oldid:72959888,family:'PORTAL-R2-10',targets:['Tecnologias de informação']},
        'Info/Clube de futebol':{oldid:73118511,family:'PORTAL-R2-11',targets:['Futebol','Esportes']},
        'Info/Militar':{oldid:70403402,family:'PORTAL-R2-12',targets:['Guerra']},
        'Info/Artista':{oldid:71821191,family:'PORTAL-R2-13',targets:['Arte']},
        'Info/Revista científica':{oldid:70222243,family:'PORTAL-R2-14',targets:['Ciência']},
        'Info/Computador':{oldid:72837193,family:'PORTAL-R2-15',targets:['Tecnologias de informação']},
        'Info/Automóvel':{oldid:70252203,family:'PORTAL-R2-16',targets:['Carros']},
        'Info/Moeda':{oldid:70221174,family:'PORTAL-R2-17',kind:'currency'},
        'Info/Estádio':{oldid:72808110,family:'PORTAL-R2-18',kind:'stadium'},
        'Info/Partido político':{oldid:73174876,family:'PORTAL-R2-19',targets:['Política']},
        'Info/Evento meteorológico':{oldid:70788988,family:'PORTAL-R2-20',targets:['Meteorologia']},
        'Info/Cerveja':{oldid:72828830,family:'PORTAL-R2-21',kind:'beer'},
        'Info/Foguete':{oldid:62404173,family:'PORTAL-R2-22',kind:'rocket'},
        'Info/Televisão':{oldid:73097989,family:'PORTAL-R2-23',kind:'animation'},
        'Info/Cientista':{oldid:72993800,family:'PORTAL-R2-26',kind:'scientist'},
        'Info/Música/artista':{oldid:73044750,family:'PORTAL-R2-27',kind:'band'}
    });
    const V2212_PORTAL_ALIASES=Object.freeze({Germany:'Alemanha',Numismatics:'Numismática',Biography:'Biografias'});
    const V2212_PORTAL_STUBS=Object.freeze({
        'Esboço-matemática':{oldid:46265143,theme:'Matemática',categories:['Topologia (matemática)','Teoria da homotopia']},
        'Esboço-física':{oldid:46265044,theme:'Física',categories:['Ondulatória','Mecânica ondulatória']},
        'Esboço-política':{oldid:62119729,theme:'Política',categories:['Eleições','Direito eleitoral']},
        'Esboço-informática':{oldid:61967606,theme:'Tecnologias de informação',categories:['Periféricos de computador']}
    });
    // Estes nomes têm função de rodapé confirmada. A função não infere assunto.
    const V2212_PORTAL_STUB_ROLES=Object.freeze(Object.fromEntries(Object.keys(V2212_PORTAL_STUBS).map(name=>[norm(name),'stub'])));
    const V2212_PORTAL_METADATA=new Set(['Título em itálico','Outro significado','Outros significados','Ver desambig','Ver desambiguação','Nota','About','Mais notas','Mais fontes','Reciclagem','Sem fontes','Sem-fontes','Fusão com','Não confunda','Não confundir com','Descrição curta','Coor title dms']);
    const V2212_PORTAL_WEATHER_CHILDREN=new Set(['Info/Evento meteorológico/Surto de tornado','Info/Evento meteorológico/Efeitos','Info/Evento meteorológico/Rodapé']);
    const V2212_PORTAL_DESTINATIONS=Object.freeze({Literatura:66665262,'Música':69553832,'Educação':66910265,'Televisão':65724310,
        Jornalismo:65719633,Geografia:65693086,Guerra:65719598,'Tecnologias de informação':65685529,Futebol:71264728,Esportes:3079615,
        Arte:68930783,'Ciência':68930787,Carros:69245897,'Numismática':51508785,'Política':65693083,Meteorologia:69766785,
        Cerveja:73130296,'Exploração espacial':65702658,'Animação':65724319,Alemanha:67878884,Biografias:68930785,
        'Bioquímica':65702689,'Física':65702726,'Matemática':72774103});
    function v2212PortalDestinations() { return Object.keys(V2212_PORTAL_DESTINATIONS); }
    function v2212PortalHeader(value) {
        const raw=String(value).replace(/<!--[\s\S]*?-->/g,'').trim().replace(/_/g,' ').replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        return raw?raw[0].toLocaleUpperCase('pt')+raw.slice(1):'';
    }
    function v2212PortalScope(source,cfg={}) {
        return typeof source==='string'&&cfg.portals!==false&&cfg.endMatter!==false&&!cfg.discussionPage&&!cfg.sectionOnly&&
            (cfg.namespaceNumber===undefined||cfg.namespaceNumber===0)&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&!/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))&&
            !/^\s*#(?:redirect|redirecionamento)\b/i.test(source)&&!/~{4}/.test(source);
    }
    function v2212PortalDocument(source) {
        const scan=v24SyntaxScan(source);if(scan.issues.length)return null;
        const nodes=templates(scan.shield.view).nodes.filter(node=>node.depth===0&&
            !scan.shield.ranges.some(range=>range.start<=node.start&&node.start<range.end&&range.kind!=='comment'));
        if(nodes.some(node=>['Desambig','Desambiguação','Desambiguar','Disambig','Disambiguation'].includes(v2212PortalHeader(parsedTemplate(source.slice(node.start,node.end)).parts[0]))))return null;
        return {source,scan,nodes};
    }
    function v2212PortalTopLevel(doc,node) {
        const context=v219IndexedSyntaxContext(doc.source,node.start);
        return !!context&&!['templates','html','tables','links','external'].some(kind=>context[kind].length);
    }
    function v2212PortalScalar(value) {
        let raw=value.trim();if(!raw||/[{}<>\r\n]/.test(raw))return null;
        raw=raw.replace(/^('{2,3})([^']+)\1$/,'$2').trim();
        const link=/^\[\[([^|\]#]+)(?:\|([^\]]+))?\]\]$/.exec(raw);
        if(link){
            const target=norm(link[1]),label=link[2]===undefined?target:norm(link[2]);
            if(target!==label)return null;
            raw=link[1];
        }
        return /[\[\]{}<>|?]/.test(raw)?null:norm(raw);
    }
    function v2212PortalField(box,keys) {
        const fields=box.fields.filter(field=>keys.includes(field.key)&&field.value.trim());
        if(fields.length!==1)return null;
        return v2212PortalScalar(fields[0].value);
    }
    function v2212PortalPrincipal(doc) {
        const section=doc.scan.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),possible=[];
        for(const node of doc.nodes){
            if(section>=0&&node.start>=section)continue;
            const raw=doc.source.slice(node.start,node.end),p=parsedTemplate(raw),name=v2212PortalHeader(p.parts[0]);
            if(/^(?:Desambig|Desambiguação|Disambig)$/.test(name))return null;
            if(/^Info\//.test(name))possible.push({node,raw,p,name,fields:foreignEntries(p)});
        }
        if(!possible.length)return null;
        possible.sort((a,b)=>a.node.start-b.node.start);const box=possible[0],contract=V2212_PORTAL_BOXES[box.name];
        if(!contract||!v2212PortalTopLevel(doc,box.node))return null;
        // A documentação de um tema ou exemplo de caixa não é o assunto da página.
        const before=doc.source.slice(0,box.node.start),leadNodes=doc.nodes.filter(node=>node.end<=box.node.start);
        let prefix=before;for(const node of leadNodes.slice().reverse()){
            const p=parsedTemplate(doc.source.slice(node.start,node.end)),name=v2212PortalHeader(p.parts[0]);
            if(!V2212_PORTAL_METADATA.has(name))return null;
            prefix=prefix.slice(0,node.start)+prefix.slice(node.end);
        }
        if(prefix.replace(/<!--[\s\S]*?-->/g,'').trim())return null;
        const line=doc.source.lastIndexOf('\n',box.node.start-1)+1;
        if(doc.source.slice(line,box.node.start).trim()&&!leadNodes.some(node=>node.start>=line&&node.end<=box.node.start))return null;
        if(box.fields.some(field=>['embed','child','embutido','subcaixa','nested'].includes(field.key)&&field.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(field.value.trim())))return null;
        if(new Set(box.fields.filter(field=>!field.positional).map(field=>field.key)).size!==box.fields.filter(field=>!field.positional).length)return null;
        for(const other of possible.slice(1)){
            if(box.name==='Info/Ilha'&&other.name==='Info/Património Mundial'&&v2212PortalTopLevel(doc,other.node))continue;
            if(box.name==='Info/Evento meteorológico'&&V2212_PORTAL_WEATHER_CHILDREN.has(other.name)&&
                v2212PortalTopLevel(doc,other.node)&&v2212PortalField(other,['child'])==='yes'&&
                !doc.source.slice(possible[possible.indexOf(other)-1].node.end,other.node.start).trim())continue;
            return null;
        }
        return {...box,contract};
    }
    function v2212PortalOpening(doc,box) {
        const next=doc.scan.view.slice(box.node.end).search(/^={2,6}[^=\n].*?={2,6}\s*$/m),end=next<0?doc.source.length:box.node.end+next;
        let raw=doc.source.slice(box.node.end,Math.min(end,box.node.end+1400)).replace(/<!--[\s\S]*?-->/g,'').trim();
        for(let i=0;i<3;i++){
            const match=/^\{\{Título em itálico\}\}\s*/i.exec(raw);if(!match)break;raw=raw.slice(match[0].length);
        }
        if(!/^'{3,5}[^'\n]+?'{3,5}(?:\s|[,(])/.test(raw))return '';
        return norm(raw.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g,(_,target,label)=>label||target).replace(/'{2,5}/g,''));
    }
    function v2212PortalFromBox(doc,box) {
        const contract=box.contract;let targets=contract.targets?.slice()||[];
        const opening=v2212PortalOpening(doc,box);
        if(box.name==='Info/Jornal'&&(/\b(?:fictício|fictícia|ficticio|ficticia|ficcional)\b/.test(opening)||/\[\[[Cc]ategoria:[^\]\n]*(?:fictícios|fictícias|ficcionais)/i.test(doc.source)))return [];
        if(contract.kind==='book'){
            if(['romance','conto','contos','poesia','poema','poemas','romance histórico','romance policial','romance de fantasia'].includes(v2212PortalField(box,['gênero'])))targets=['Literatura'];
        }else if(contract.kind==='album'){
            const genre=v2212PortalField(box,['gênero']);
            if(/(?:audiolivro|comédia|spoken word|humorístico)/.test(opening))return [];
            if(genre&&/\b(?:rock|pop|jazz|samba|sertanejo|funk|hip-hop|soul|blues|música|metal|reggae|rap)\b/.test(genre)||
                /(?:^|[^\p{L}])álbum[^.!?<]{0,240}\b(?:cantor|cantora|banda|músico|musical|gravadora)\b/u.test(opening)&&!/(?:audiolivro|comédia|spoken word|humorístico)/.test(opening))targets=['Música'];
        }else if(contract.kind==='currency'){
            const physical=box.fields.filter(field=>['moedas','notas'].includes(field.key)&&field.value.trim()),opening=v2212PortalOpening(doc,box),
                conflict=/(?:criptomoeda|bitcoin|token|moeda digital|moeda virtual)/.test(opening)||box.fields.some(field=>['tipo','formato','moedas','notas'].includes(field.key)&&/criptomoeda|bitcoin|token|digital|virtual/i.test(field.value));
            if(!conflict&&physical.some(field=>/\d/.test(field.value)&&!/[{}<>?]/.test(field.value)&&!/\b(?:nenhum|nenhuma|não|nao)\b/i.test(field.value)))targets=['Numismática'];
        }else if(contract.kind==='stadium'){
            const fields=box.fields.filter(field=>['capacidade','proprietário','mandante','mandantes','times','clubes'].includes(field.key)&&field.value.trim());
            if(fields.some(field=>field.key==='capacidade'&&/\d/.test(field.value))||fields.some(field=>['mandante','mandantes','times','clubes'].includes(field.key)&&/\[\[[^\]]+\]\]/.test(field.value)))targets=['Esportes'];
        }else if(contract.kind==='beer'){
            if(['cerveja','cervejaria'].includes(v2212PortalField(box,['classe'])))targets=['Cerveja'];
        }else if(contract.kind==='rocket'){
            if(['orbital launch vehicle','space launch vehicle','veículo de lançamento orbital','veículo de lançamento','lançador orbital','foguete espacial'].includes(v2212PortalField(box,['função'])))targets=['Exploração espacial'];
        }else if(contract.kind==='animation'){
            if(v2212PortalField(box,['formato'])==='série de animação')targets=['Televisão','Animação'];
        }else if(contract.kind==='scientist'){
            const field=box.fields.filter(row=>row.key==='campo'&&row.value.trim());
            if(field.length===1){
                const pieces=field[0].value.trim().split(/<br\s*\/?\s*>|[,;\n]/i).map(value=>v2212PortalScalar(value));
                const map={física:'Física','bioquímica':'Bioquímica'};
                if(pieces.length&&pieces.every(value=>value&&Object.hasOwn(map,value)))targets=pieces.map(value=>map[value]);
            }
        }else if(contract.kind==='band'){
            if(v2212PortalField(box,['fundo'])==='grupo ou banda')targets=['Música'];
        }
        return targets.map(target=>({target,family:contract.family,owner:box.name,nativeOldid:contract.oldid}));
    }
    function v2212PortalStubCandidates(doc) {
        const categories=[];
        for(const range of editorialWikiLinkRanges(doc.source)){
            const raw=doc.source.slice(range.start,range.end),match=/^\[\[[Cc]ategoria:([^|\]#]+)(?:\|[^\]]*)?\]\]$/.exec(raw);
            if(!match||!v2212PortalTopLevel(doc,range))continue;
            categories.push(match[1].trim());
        }
        const result=[];
        for(const node of doc.nodes){
            const p=parsedTemplate(doc.source.slice(node.start,node.end)),name=v2212PortalHeader(p.parts[0]),contract=V2212_PORTAL_STUBS[name];
            if(!contract||p.parts.length!==1||!v2212PortalTopLevel(doc,node)||!contract.categories.some(category=>categories.includes(category)))continue;
            result.push({target:contract.theme,family:'PORTAL-STUB-01',owner:name,nativeOldid:contract.oldid});
        }
        return result;
    }
    function v2212PortalCalls(doc) {
        return doc.nodes.filter(node=>{
            const name=v2212PortalHeader(parsedTemplate(doc.source.slice(node.start,node.end)).parts[0]);
            return ['Portal','Portal2','Portal3'].includes(name)&&v2212PortalTopLevel(doc,node);
        });
    }
    function v2212PortalCandidates(source,cfg={}) {
        if(!v2212PortalScope(source,cfg))return [];
        const doc=v2212PortalDocument(source);if(!doc)return [];
        const targets=[];
        if(cfg.automaticTopicPortals!==false){const box=v2212PortalPrincipal(doc);if(box)targets.push(...v2212PortalFromBox(doc,box).map(row=>row.target));targets.push(...v2212PortalStubCandidates(doc).map(row=>row.target));}
        for(const node of v2212PortalCalls(doc)){
            const parsed=biographyPortalSlots(doc.source.slice(node.start,node.end));if(parsed.unsafe)continue;
            for(const field of parsed.slots.values())if(Object.hasOwn(V2212_PORTAL_ALIASES,field.value.trim()))targets.push(V2212_PORTAL_ALIASES[field.value.trim()]);
        }
        return [...new Set(targets)].filter(target=>Object.hasOwn(V2212_PORTAL_DESTINATIONS,target));
    }
    function v2212PortalAvailable(source,cfg,target) {
        if(!Object.hasOwn(V2212_PORTAL_DESTINATIONS,target))return false;
        if(cfg.v2212PortalProofRequired!==true)return true;
        const proof=cfg.v2212PortalAvailability;
        if(!proof||!Array.isArray(proof.exists)||!proof.exists.includes(target))return false;
        const original=typeof cfg.citationOriginalSource==='string'?cfg.citationOriginalSource:
            typeof cfg.biographyOriginalSource==='string'?cfg.biographyOriginalSource:source;
        const binding=cfg.v2212OriginalDraftHash||v24SyntaxHash(original);
        if(typeof binding!=='string'||proof.sourceHash!==binding)return false;
        return proof.source===undefined||typeof proof.source==='string'&&v24SyntaxHash(proof.source)===proof.sourceHash;
    }
    function v2212PortalAliasEdits(source,cfg={}) {
        const doc=v2212PortalDocument(source);if(!doc)return [];
        const edits=[];
        for(const node of v2212PortalCalls(doc)){
            const parsed=biographyPortalSlots(source.slice(node.start,node.end));if(parsed.unsafe)continue;
            const parts=parsed.p.parts.slice();let changed=false;
            for(const field of parsed.slots.values()){
                const key=field.value.trim();if(!Object.hasOwn(V2212_PORTAL_ALIASES,key))continue;
                const target=V2212_PORTAL_ALIASES[key];if(!v2212PortalAvailable(source,cfg,target))continue;
                const value=field.value.replace(/\S[\s\S]*\S|\S/,target);
                parts[field.index]=field.named?parts[field.index].replace(/=([\s\S]*)$/,'='+value):value;changed=true;
            }
            if(changed)edits.push({start:node.start,end:node.end,text:'{{'+parts.join('|')+'}}',ruleId:'v2212PortalAlias',label:'Nomes de portais conferidos',proof:{family:'PORTAL-R2-25',portalRegistryOldid:73310980}});
        }
        return edits;
    }
    function v2212PortalRelocate(source,cfg) {
        const doc=v2212PortalDocument(source);if(!doc)return source;
        const profiles={...V2212_PORTAL_STUB_ROLES,...cfg.footerProfiles},footer=footerTokens(source,profiles),moved=[];
        for(const node of v2212PortalCalls(doc)){
            if(footer.tokens.some(token=>token.start===node.start&&token.role==='portal'))continue;
            const start=source.lastIndexOf('\n',node.start-1)+1,eol=source.indexOf('\n',node.end),end=eol<0?source.length:eol+1;
            if(source.slice(start,node.start).trim()||source.slice(node.end,eol<0?source.length:eol).trim())continue;
            const slots=biographyPortalSlots(source.slice(node.start,node.end));if(slots.unsafe)continue;
            const previous=[...source.slice(0,start).matchAll(/^={2,6}[^=\n].*?={2,6}\s*$/gm)].at(-1),next=/^={2,6}[^=\n].*?={2,6}\s*$/m.exec(source.slice(end));
            if(previous&&source.slice(previous.index+previous[0].length,start).trim()===''&&source.slice(end,next?end+next.index:source.length).trim()==='')continue;
            moved.push({start,end,raw:source.slice(node.start,node.end)});
        }
        if(!moved.length)return source;
        let text=v24SyntaxApply(source,moved.map(row=>({start:row.start,end:row.end,text:''}))),tail=footerTokens(text,profiles);
        if(tail.tokens.some(token=>!token.role||/<\s*ref\b/i.test(token.raw)))return source;
        const anchor=tail.tokens.find(token=>FOOTER_ROLES[token.role]>FOOTER_ROLES.portal),at=anchor?anchor.start:text.trimEnd().length;
        return text.slice(0,at).replace(/\n*$/,'\n\n')+moved.map(row=>row.raw).join('\n')+'\n'+(anchor?text.slice(at):'');
    }
    function v2212PortalPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!v2212PortalScope(source,cfg)||!v2212PortalDocument(source))return empty;
        let text=v24SyntaxApply(source,v2212PortalAliasEdits(source,cfg));
        text=v2212PortalRelocate(text,cfg);
        if(cfg.automaticTopicPortals!==false){
            const doc=v2212PortalDocument(text),box=doc&&v2212PortalPrincipal(doc),proofs=doc?[...(box?v2212PortalFromBox(doc,box):[]),...v2212PortalStubCandidates(doc)]:[],targets=[...new Set(proofs.map(row=>row.target))].filter(target=>v2212PortalAvailable(source,cfg,target));
            if(targets.length)text=v211AppendConfirmedPortals(text,{...cfg,footerProfiles:{...V2212_PORTAL_STUB_ROLES,...cfg.footerProfiles}},()=>{},targets,'v2212ConfirmedPortals');
        }
        if(text===source)return empty;
        const initialDoc=v2212PortalDocument(source),initialBox=initialDoc&&v2212PortalPrincipal(initialDoc);
        const proof={families:['PORTAL-R2-25','PORTAL-R2-28',...(initialBox?[initialBox.contract.family]:[]),...(initialDoc&&v2212PortalStubCandidates(initialDoc).length?['PORTAL-STUB-01']:[])],sourceHash:empty.sourceHash,portalRegistryOldid:73310980};
        const edits=v220BioSingleDifference(source,text,'v2212ConfirmedPortals',proof);
        if(!edits.length)return empty;
        edits[0].label='Portais conferidos';return {...empty,text,edits};
    }
    function v2212PortalProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2212PortalPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    const V2212_PORTAL_FOOTER_WRAPPERS=Object.freeze({
        'Esboço personalizado':{role:'stub',oldid:63772443,dependencies:[69565736]},
        'Esboço-personalizado':{role:'stub',oldid:63772443,dependencies:[69565736]},
        'Navbox/Artista musical':{role:'navbox',oldid:66030952,dependencies:[69824633,73285738]}
    });
    function v2212PortalFooterRole(code) {
        if(typeof code!=='string'||code.length>262144||/<\s*\/?\s*(?:nowiki|pre|source|syntaxhighlight|onlyinclude|ref|references)\b/i.test(code))return null;
        const noincludes=[...code.matchAll(/<noinclude\b[^>]*>[\s\S]*?<\/noinclude\s*>/gi)];
        let body=code;for(const range of noincludes.slice().reverse())body=body.slice(0,range.index)+body.slice(range.index+range[0].length);
        let includeDepth=0;for(const tag of body.matchAll(/<(\/?)includeonly\s*>/gi)){includeDepth+=tag[1]?-1:1;if(includeDepth<0||includeDepth>1)return null;}
        if(includeDepth)return null;
        body=body.replace(/<!--[\s\S]*?-->/g,'').replace(/<\/?includeonly\s*>/gi,'').trim();
        if(/<!--|-->|<\/?(?:noinclude|includeonly)\b/i.test(body))return null;
        const parsed=v24SyntaxTemplates(body);if(parsed.unclosed.length)return null;
        const root=parsed.nodes.filter(node=>node.depth===0&&node.size===2).sort((a,b)=>a.start-b.start)[0];
        if(!root||root.start!==0)return null;
        const call=parsedTemplate(body.slice(0,root.end)),name=v2212PortalHeader(call.parts[0]);
        if(!Object.hasOwn(V2212_PORTAL_FOOTER_WRAPPERS,name))return null;
        const wrapper=V2212_PORTAL_FOOTER_WRAPPERS[name],fields=foreignEntries(call);
        if(fields.some(field=>['child','embed','embutido','subcaixa','nested'].includes(field.key)&&field.value.trim()&&
            !/^(?:não|nao|no|false|0)$/i.test(field.value.trim()))||fields.some(field=>field.key==='1'&&/subgrupo|subgroup/i.test(field.value)))return null;
        let rest=body.slice(root.end).replace(/\{\{PAGENAME\}\}/g,'');
        rest=rest.replace(/\[\[[Cc]ategoria:[^\[\]{}<>\r\n]+\]\]/g,'').trim();
        return rest?null:wrapper.role;
    }

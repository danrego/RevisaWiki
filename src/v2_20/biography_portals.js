    // Literal native contracts. Unknown fields, dynamic owners and conflicting values stay intact.
    const V220_BIO_NATIVE = Object.freeze({
        'info/biografia':{title:'Info/Biografia',ids:[72993800,73243370],website:['website','site','url','sítio','site_oficial','homepage'],person:true},
        'info/cientista':{title:'Info/Cientista',ids:[55468951,72993800],website:['website','site','url','sítio','site_oficial','homepage'],person:true},
        'info/escritor':{title:'Info/Escritor',ids:[46988224,72993800],website:['website','site','url','sítio','site_oficial','homepage'],person:true},
        'info/ator':{title:'Info/Ator',ids:[72882232],website:['site_oficial'],person:true},
        'info/político':{title:'Info/Político',ids:[72931974],website:['website','homepage'],person:true},
        'info/música/artista':{title:'Info/Música/artista',ids:[73044750],website:['website','site','sítio'],music:true},
        'info/empresa':{title:'Info/Empresa',ids:[71838243],website:['website','homepage','site','pagina','página'],image:['imagem'],size:['imagem_tamanho','imagem-tamanho','img-tam','tamanho'],caption:['imagem_legenda','legenda','img-des']},
        'info/organização':{title:'Info/Organização',ids:[71071937],website:['website'],image:['imagem'],size:['imagem_tamanho'],caption:['imagem_legenda','legenda_img']},
        'info/sítio':{title:'Info/Sítio',ids:[71891649],website:['url','url_pt'],image:['imagem'],size:['imagem_tamanho','tamanho_imagem'],caption:['legenda','imagem_legenda','descricao']},
        'info/website':{title:'Info/Website',ids:[49199122,71891649],website:['url','url_pt'],image:['imagem'],size:['imagem_tamanho','tamanho_imagem'],caption:['legenda','imagem_legenda','descricao']},
        'info/aeroporto':{title:'Info/Aeroporto',ids:[71844736],website:['website']},
        'info/futebolista':{title:'Info/Futebolista',ids:[70095373],website:['site'],person:true},
        'info/cavalo nomeado':{title:'Info/Cavalo nomeado',ids:[52347944],image:['imagem'],size:['imagem_tamanho'],caption:['legenda']},
        'info/animal':{title:'Info/Animal',ids:[70252182],image:['imagem'],size:['tamanho','imagem_tamanho'],caption:['legenda','imagem_legenda']},
        'info/evento de mma':{title:'Info/Evento de MMA',ids:[72398430],image:['imagem'],size:['imagem_tamanho'],caption:['legenda']}
    });
    const V220_TOPIC_BOXES = Object.freeze({
        'Info/Empresa':['Empresas'], 'Info/Empresa/Wikidata':['Empresas'],
        'Info/Astro':['Astronomia'], 'Info/Jogo de cartas':['Jogos'],
        'Info/Jogo de tabuleiro':['Jogos'], 'Info/Jogo eletrônico':['Jogos'],
        'Info/Episódios de The Simpsons':['Televisão','Entretenimento'],
        'Info/Filme/Wikidata':['Cinema','Entretenimento'],
        'Info/Parque de diversão':['Entretenimento'],
        'Info/Assentamento/Marrocos':['Geografia','Marrocos'],
        'Info/Unidade militar':['Guerra'], 'Info/Unidade Militar':['Guerra'],
        'Info/Alimento':['Alimentos'], 'Info/Bebida':['Alimentos']
    });
    const V220_TOPIC_OLDIDS = Object.freeze({
        'Info/Empresa':71838243,'Info/Empresa/Wikidata':60995866,'Info/Astro':72564132,
        'Info/Jogo de cartas':72592947,'Info/Jogo de tabuleiro':70219964,'Info/Jogo eletrônico':71674829,
        'Info/Episódios de The Simpsons':70297231,'Info/Filme/Wikidata':62803917,
        'Info/Parque de diversão':72545653,'Info/Assentamento/Marrocos':73167661,
        'Info/Unidade militar':72222144,'Info/Unidade Militar':72222145,
        'Info/Alimento':70222026,'Info/Bebida':70483898
    });
    const V220_OCCUPATION_INITIALS = Object.freeze(['farmacêutica-bioquímica','farmacêutico-bioquímico',
        'produtor teatral','produtora teatral','ativista político','ativista política','investidor','investidora','empreendedor','empreendedora']);
    function v220BioTitleSame(a,b) {
        const clean=s=>String(s).replace(/_/g,' ').replace(/[ \t]+/g,' ').trim();a=clean(a);b=clean(b);
        return !!a&&!!b&&a[0].toUpperCase()+a.slice(1)===b[0].toUpperCase()+b.slice(1);
    }
    function v220BioScope(source,cfg={}) {
        return typeof source==='string'&&source.length<=4194304&&cfg.namespaceNumber===0&&
            !cfg.sectionOnly&&(cfg.section===undefined||cfg.section===null||cfg.section==='')&&!cfg.discussionPage&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&(!cfg.contentModel||cfg.contentModel==='wikitext')&&
            cfg.syntaxRepairs!==false&&cfg.structuralRepairs!==false&&v20AutomationAllowed(source,cfg)&&
            !/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''));
    }
    function v220BioLiteralFields(raw) {
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;
        const fields=[];let position=1;
        for(const part of parts.slice(1)){
            const named=/^(\s*)([^=]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(named){
                const key=named[2].trim();if(!/^(?:[1-9]\d*|\p{L}[\p{L}\p{N} _/()\-]*)$/u.test(key))return null;
                const keyStart=2+part.start+named[1].length+/^\s*/.exec(named[2])[0].length,
                    start=2+part.start+named[1].length+named[2].length+named[3].length;
                fields.push({key,value:named[4],keyStart,keyEnd:keyStart+key.length,start,end:start+named[4].length});
            }else{
                const start=2+part.start;fields.push({key:String(position++),value:part.text,keyStart:null,keyEnd:null,start,end:2+part.end,positional:true});
            }
        }
        return new Set(fields.map(f=>f.key)).size===fields.length?fields:null;
    }
    const V220_VIRTUAL_BOXES=Object.freeze({
        'Info/Empresa/Wikidata':60995866,'Info/Biografia/Wikidata':72589307,
        'Info/Filme/Wikidata':62803917,'Infocaixa':null,
        'Info/Unidade Militar':72222145
    });
    function v220BioNodes(source) {
        const shield=v24SyntaxProtected(source);if(shield.unclosed.length)return [];
        const nodes=templates(shield.view).nodes.filter(n=>n.depth===0),first=shield.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m);
        return nodes.filter(n=>first<0||n.start<first).map(node=>{
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),name=p.parts[0].trim(),contract=V220_BIO_NATIVE[p.name];
            let profile=INFOBOX_CATALOG[p.name];
            const virtual=Object.keys(V220_VIRTUAL_BOXES).find(n=>v220BioTitleSame(n,name));
            if(virtual)profile={title:virtual,oldid:V220_VIRTUAL_BOXES[virtual],accepted:[],patterns:[],partial:true};
            if(!profile){const topic=Object.keys(V220_TOPIC_OLDIDS).find(n=>v220BioTitleSame(n,name));if(topic)profile={title:topic,oldid:V220_TOPIC_OLDIDS[topic],accepted:[],patterns:[],partial:true};}
            if(!profile||!v220BioTitleSame(name,profile.title)||contract&&!v220BioTitleSame(name,contract.title))return null;
            const fields=v220BioLiteralFields(raw);if(!fields)return null;
            if(fields.some(f=>['embed','child','embutido','subcaixa','nested'].includes(norm(f.key))&&f.value.trim()&&!/^(?:não|nao|no|false|0)$/.test(f.value.trim())))return null;
            return {node,raw,p,name,profile,contract,fields};
        }).filter(Boolean);
    }
    function v220BioPrincipal(source) {
        const shield=v24SyntaxProtected(source),first=shield.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),possible=templates(shield.view).nodes.filter(n=>n.depth===0&&(first<0||n.start<first)&&/^(?:info\/|infocaixa$|info$)/.test(norm(parsedTemplate(source.slice(n.start,n.end)).parts[0])));
        const nodes=v220BioNodes(source).filter(n=>/^(?:Info\/|Infocaixa$|Info$)/.test(n.name));
        if(possible.length!==1||nodes.length!==1)return null;const box=nodes[0],start=source.lastIndexOf('\n',box.node.start-1)+1,end=source.indexOf('\n',box.node.end);
        return source.slice(start,box.node.start).trim()||source.slice(box.node.end,end<0?source.length:end).trim()?null:box;
    }
    function v220BioHttp(value) {
        if(typeof value!=='string'||value!==value.trim()||!/^https?:\/\/[^\s<>\[\]{}|"']+$/i.test(value))return null;
        try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&u.hostname&&!u.username&&!u.password?u:null;}catch{return null;}
    }
    function v220BioLiteralEvidenceContext(source) {
        const shield=v24SyntaxProtected(source),view=shield.view;
        return {view,shield,owners:templates(view),refs:refTokens(view),syntax:v24SyntaxScan(source),links:editorialWikiLinkRanges(source),
            transclusion:/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(view)};
    }
    function v220BioLiteralEvidenceRange(context,start,end) {
        const overlaps=range=>range.start<end&&range.end>start;
        return !context.transclusion&&!context.shield.ranges.some(overlaps)&&!context.owners.nodes.some(overlaps)&&
            !context.owners.unclosed.some(node=>node.start<end)&&!context.refs.some(overlaps)&&
            !context.syntax.tokens.some(overlaps)&&!context.syntax.html.some(node=>node.start<end)&&
            !context.links.some(range=>range.start<start&&range.end>end);
    }
    function v220BioOfficialMatch(source,value,excluded) {
        if(!/^(?:www\.)?[\p{L}\p{N}][^\s<>\[\]{}|"']*\.[\p{L}\p{N}][^\s<>\[\]{}|"']*$/u.test(value)||/^[a-z][a-z\d+.-]*:/i.test(value))return null;
        let wanted;try{wanted=new URL('https://'+value);}catch{return null;}
        if(wanted.username||wanted.password)return null;
        const context=v220BioLiteralEvidenceContext(source),view=context.view,urls=new Set();
        for(const m of view.matchAll(/\[(https?:\/\/[^\s<>\[\]{}|"']+)[ \t]+([^\[\]\r\n]+)\]/gi)){
            if(excluded&&m.index>=excluded.start&&m.index<excluded.end||!v220BioLiteralEvidenceRange(context,m.index,m.index+m[0].length)||
                !/^(?:(?:site|sítio|página|website)\s+oficial|oficial)$/iu.test(m[2].trim()))continue;
            const u=v220BioHttp(m[1]);if(!u)continue;
            if(u.host===wanted.host&&u.pathname===wanted.pathname&&u.search===wanted.search&&u.hash===wanted.hash)urls.add(m[1]);
        }
        return urls.size===1?[...urls][0]:null;
    }
    function v220BioWebsiteValue(value,source,box) {
        const known=v28BiographyWebsiteValue(value);if(known)return {text:value.slice(0,known.start)+known.text+value.slice(known.end),reason:'existing-explicit-url-adapter'};
        const refs=refTokens(value),first=refs.length?refs[0].start:value.length;let tailAt=first;
        for(const ref of refs){if(value.slice(tailAt,ref.start).trim())return null;tailAt=ref.end;}if(value.slice(tailAt).trim())return null;
        const start=/^\s*/.exec(value)[0].length,core=value.slice(start,first).trimEnd(),parts={start,end:start+core.length};if(!core||/[\r\n]/.test(core))return null;
        let host=core,label=core,wrong=/^\[\[([^\[\]{}|<>\s]+)(?:\|([^\[\]{}<>\r\n]+))?\]\]$/.exec(core);
        if(wrong){host=wrong[1];label=wrong[2]||wrong[1];if(label!==label.trim()||label.includes('|'))return null;}
        const official=v220BioOfficialMatch(source,host,box.node);if(official)return {text:value.slice(0,parts.start)+'['+official+' '+label+']'+value.slice(parts.end),reason:'unique-existing-official-address'};
        const angles=/^(?:<<(https?:\/\/[^<>\s]+)>>|<(https?:\/\/[^<>\s]+)>)$/.exec(core);
        if(angles){const url=angles[1]||angles[2];if(v220BioHttp(url)&&v220BioOfficialMatch(source,url.replace(/^https?:\/\//i,''),box.node))return {text:value.slice(0,parts.start)+url+value.slice(parts.end),reason:'literal-url-angle-delimiter'};}
        return null;
    }
    function v220BioOccupation(value) {
        const parts=v28DateValueParts(value);if(!parts||/[{}<>\r\n]/.test(parts.core))return null;const core=parts.core;
        const lower=s=>s[0]===s[0].toUpperCase()&&s.slice(1)===s.slice(1).toLowerCase()?s[0].toLowerCase()+s.slice(1):null;
        let next=null;const link=/^\[\[([^|\]#]+)(?:\|([^\]]+))?\]\]/.exec(core);
        if(link){const shown=link[2]||link[1],literal=shown.toLowerCase(),target=norm(link[1]);
            if(!V220_OCCUPATION_INITIALS.includes(literal)||!(COMMON_OCCUPATIONS.has(target)||V220_OCCUPATION_INITIALS.includes(target)||['farmacêutico','farmacêutica','ativista','ativista político','ativista política','produtor teatral','produtora teatral'].includes(target)))return null;
            const label=lower(shown);if(!label)return null;
            next=(link[2]?'[['+link[1]+'|'+label+']]':'[['+label+']]')+core.slice(link[0].length);
        }else for(const phrase of V220_OCCUPATION_INITIALS){const raw=core.slice(0,phrase.length),tail=core.slice(phrase.length);
            if(raw.toLowerCase()===phrase&&(!tail||/^[,;/]|^\s+(?:e|em)\s/.test(tail))){const label=lower(raw);if(label)next=label+tail;break;}}
        return next&&next!==core?value.slice(0,parts.start)+next+value.slice(parts.end):null;
    }
    function v220BioPartialMonth(value) {
        const data=v28DateValueParts(value);if(!data)return null;const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const match=/^([\p{L}]+)(?:\s+de)?\s+(\{\{[\s\S]+\}\})$/u.exec(data.core);if(!match)return null;
        const month=months.indexOf(match[1].toLowerCase())+1;if(!month)return null;const p=v24SyntaxParts(match[2].slice(2,-2));
        if(!p||!v220BioTitleSame(p[0].text,'Dni')||p.length<4||p.length>5||p[1].text.trim()||p[2].text.trim()||!/^\d{4}$/.test(p[3].text.trim())||p.length===5&&!/^(?:si|sem idade)$/.test(p[4].text.trim()))return null;
        const year=+p[3].text.trim();if(year<1||year>9999)return null;
        const fields=p.map(x=>x.text);fields[2]=fields[2].replace(/^\s*$/,String(month));
        return value.slice(0,data.start)+'{{'+fields.join('|')+'}}'+value.slice(data.end);
    }
    function v220BioImage(value) {
        const core=value.trim(),pad={left:value.slice(0,value.indexOf(core)),right:value.slice(value.indexOf(core)+core.length)};
        if(!core.startsWith('[[')||!core.endsWith(']]')||core.length>8000)return null;
        const parts=v24SyntaxParts(core.slice(2,-2));if(!parts)return null;const file=/^(?:Ficheiro|Imagem|Arquivo|File|Image):([^\[\]{}<>|#\r\n]+\.(?:jpe?g|png|gif|webp|svg|tiff?))$/i.exec(parts[0].text.trim());if(!file)return null;
        let size=null,caption=null,frame=null;
        for(const part of parts.slice(1)){const raw=part.text,option=raw.trim();
            if(v219BiographyImageFrameOption(option)){if(frame)return null;frame=option;}
            else if(/^[1-9]\d{0,2}(?:x[1-9]\d{0,2})?px$/.test(option)){if(size||option.slice(0,-2).split('x').some(n=>+n>500))return null;size=option;}
            else if(v219NativeMediaOption(option)||/^[\p{L}_][\p{L}\p{N}_ -]*\s*=|^\d*(?:x\d+)?px$/u.test(option)||caption!==null||!raw||raw!==raw.trim()||/[\r\n|=]/.test(raw.replace(/\[\[[^\[\]]+\]\]/g,'')))return null;
            else if(/^(?:semmdolura|width[1-9]\d*px)$/.test(option))return null;
            else caption=raw;
        }
        return {filename:file[1],size,caption,pad};
    }
    function v220BioImageDimensionsLiteral(fields,keys,inlineSize) {
        // A formatted image bypasses its native filename consumer. Moving it
        // into that branch would activate a malformed size as a caption/alt.
        // An absent inline size would also activate an external size/default.
        // Preserve that image rather than infer a replacement dimension.
        if(!inlineSize)return false;
        return fields.filter(f=>keys.includes(f.key)||keys.includes(V28_BIOGRAPHY_PARAMETER_TYPOS[f.key])).every(f=>
            !f.value.trim()||/^(?:[1-9]\d*(?:x[1-9]\d*)?|x[1-9]\d*)px$|^[1-9]\d*$/.test(f.value.trim()));
    }
    function v28BiographyFieldPlan(raw,cfg={}) {
        const plan=v220BaselineBiographyFieldPlan(raw,cfg);
        if(!plan.edits?.some(e=>e.ruleId==='biographyImages'))return plan;
        const canonical=plan.canonical||raw,name=parsedTemplate(canonical).name,contract=v28BiographyFieldContract(name),fields=contract&&v220BioLiteralFields(canonical),image=fields&&v28BiographySingleField(fields,contract.image),parsed=image&&v28BiographyImageValue(image.value);
        if(!contract||!fields||parsed&&v220BioImageDimensionsLiteral(fields,contract.size,parsed.size))return plan;
        const edits=plan.edits.filter(e=>e.ruleId!=='biographyImages'),rules=plan.rules.filter(id=>id!=='biographyImages');
        return {...plan,text:v24SyntaxApply(canonical,edits),edits,rules};
    }
    function v2151BiographyImageAltPlan(source,cfg={}) {
        const plan=v220BaselineBiographyImageAltPlan(source,cfg);
        if(!plan.edits.length)return plan;
        const edit=plan.edits[0],contract=v28BiographyFieldContract(edit.proof.template),fields=v220BioLiteralFields(edit.proof.raw);
        if(contract&&fields&&v220BioImageDimensionsLiteral(fields,contract.size,edit.proof.parsed?.size))return plan;
        return {...plan,text:source,edits:[]};
    }
    function v220BioFieldEdits(source,cfg,box) {
        const edits=[],contract=box.contract;if(!contract||cfg.infoboxes===false||cfg.markup===false)return edits;
        const pin=box.profile.oldid;if(!contract.ids.includes(pin))return edits;
        const fields=box.fields,person=contract.person||contract.music&&fields.filter(f=>f.key==='fundo'&&BIOGRAPHY_SOLO_TYPES.has(norm(f.value))).length===1&&!fields.some(f=>['integrantes','exintegrantes'].includes(f.key)&&f.value.trim()),by=keys=>fields.filter(f=>keys.includes(f.key)&&f.value.trim()),add=(start,end,text,rule,extra={},count=1)=>{if(source.slice(start,end)!==text)edits.push({start,end,text,ruleId:rule,...(count>1?{count}:{}),proof:{template:box.name,nativeOldid:pin,...extra}});};
        const rename=(field,target,blockers)=>{if(profileAccepts(box.profile,field.key)||!profileAccepts(box.profile,target)||by(blockers).length)return;add(box.node.start+field.keyStart,box.node.start+field.keyEnd,target,'v220InfoboxField',{from:field.key,to:target,value:field.value});};
        for(const field of fields){
            let value=field.value,rule=null,reason=null;
            if(cfg.automaticBiographyFields!==false){
                if(['info/biografia','info/cientista','info/escritor'].includes(box.p.name)){
                    if(field.key==='instituições'&&box.p.name==='info/cientista'&&field.value.trim()&&by(['campo']).length===1)rename(field,'instituicao_trabalho',['instituicao_trabalho','instituicoes_trabalho','local_trabalho']);
                    if(field.key==='occupation')rename(field,'ocupação',['ocupação','ocupações','ocupacao','trabalho civil','Ocupação']);
                    if(field.key==='ethnicity')rename(field,'etnia',['etnia']);
                }
                if(box.p.name==='info/político'){
                    if(field.key==='nome_completo')rename(field,'nome_comp',['nome_comp','nome_de_nascimento']);
                    const indexed=/^(antecessor|sucessor)([2-8])$/.exec(field.key);if(indexed)rename(field,(indexed[1]==='antecessor'?'antes':'depois')+indexed[2],[(indexed[1]==='antecessor'?'antes':'depois')+indexed[2]]);
                }
                if(box.p.name==='info/evento de mma'&&['image','caption'].includes(field.key))rename(field,field.key==='image'?'imagem':'legenda',field.key==='image'?['imagem']:['legenda']);
            }
            if(cfg.occupationCase!==false&&person&&['ocupação','ocupações','ocupacao','profissão'].includes(field.key)&&by(['ocupação','ocupações','ocupacao','ocupacoes','profissão','occupation','Ocupação','trabalho civil']).length===1){const n=v220BioOccupation(value);if(n){value=n;rule='v220OccupationCase';}}
            if(cfg.birthDates!==false&&cfg.automaticBiographyFields!==false&&person&&['nascimento_data','data_nascimento'].includes(field.key)&&by(['nascimento_data','data_nascimento','nascimento','nasceu']).length===1){const n=v220BioPartialMonth(value);if(n){value=n;rule='v220PartialBirthMonth';}}
            if(cfg.automaticBiographyFields!==false&&contract.website?.includes(field.key)&&profileAccepts(box.profile,field.key)&&by(contract.website).length===1){const n=v220BioWebsiteValue(value,source,box);if(n){value=n.text;rule='v220WebsiteValue';reason=n.reason;}}
            if(value!==field.value)add(box.node.start+field.start,box.node.start+field.end,value,rule,{key:field.key,reason,beforeValue:field.value,afterValue:value});
        }
        if(cfg.automaticBiographyFields!==false&&cfg.automaticInfoboxImages!==false&&contract.image){
            const images=by(contract.image);if(images.length===1&&!by(['imagem2','image2','foto2','landscape']).length){const f=images[0],image=v220BioImage(f.value);
                if(image&&v220BioImageDimensionsLiteral(fields,contract.size,image.size)){const changes=[],newFields=[];let ok=true;
                    for(const [keys,value]of [[contract.size,image.size],[contract.caption,image.caption]]){if(value===null)continue;const present=fields.filter(x=>keys.includes(x.key));
                        if(present.some(x=>x.value.trim()&&x.value.trim()!==value)||present.length>1){ok=false;break;}
                        if(present.length){if(!profileAccepts(box.profile,present[0].key)){ok=false;break;}if(!present[0].value.trim())changes.push([present[0],value]);}
                        else if(profileAccepts(box.profile,keys[0]))newFields.push([keys[0],value]);else{ok=false;break;}}
                    if(ok){add(box.node.start+f.start,box.node.start+f.end,image.pad.left+image.filename+image.pad.right,'v220InfoboxImage',{key:f.key,filename:image.filename,size:image.size,caption:image.caption});
                        for(const [field,value]of changes)add(box.node.start+field.start,box.node.start+field.end,v28BiographyEdgeValue(field.value,value),'v220InfoboxImage',{key:field.key});
                        if(newFields.length){const nl=box.raw.includes('\r\n')?'\r\n':'\n',multi=box.raw.includes('\n'),text=newFields.map(([key,value])=>'|'+(multi?' ':'')+key+(multi?' = ':'=')+value+(multi?nl:'')).join('');add(box.node.end-2,box.node.end-2,text,'v220InfoboxImage',{addedKeys:newFields.map(x=>x[0])},newFields.length);}
                    }
                }
            }
        }
        return edits;
    }
    function v220BioMediaEdits(source,cfg) {
        if(cfg.markup===false||cfg.links===false)return [];const shield=v24SyntaxProtected(source);if(shield.unclosed.length)return [];
        const parents=templates(shield.view).nodes,refs=refTokens(shield.view),edits=[];
        for(const range of editorialWikiLinkRanges(source)){
            if(shield.ranges.some(r=>r.start<range.end&&r.end>range.start)||parents.some(r=>r.start<=range.start&&r.end>=range.end)||refs.some(r=>r.start<=range.start&&r.end>=range.end))continue;
            const raw=source.slice(range.start+2,range.end-2),parts=v24SyntaxParts(raw);if(!parts||!/^(?:Ficheiro|Imagem|Arquivo|File|Image):[^\[\]{}<>|#\r\n]+\.(?:jpe?g|png|gif|webp|svg|tiff?)$/i.test(parts[0].text.trim()))continue;
            const options=parts.slice(1).map(p=>p.text.trim()),kind=(value,name)=>V219_NATIVE_IMAGE_OPTIONS[name].some(alias=>{
                if(!alias.includes('$1'))return value===alias;
                const [prefix,suffix]=alias.split('$1');return value.startsWith(prefix)&&value.endsWith(suffix)&&value.length>=prefix.length+suffix.length;
            }),frames=options.filter(value=>['img_thumbnail','img_framed','img_frameless','img_manualthumb'].some(name=>kind(value.toLowerCase(),name))),
                redundantFrameless=frames.length===1&&kind(frames[0],'img_frameless'),
                competingDimension=options.some(value=>/^(?:\d+(?:x\d+)?|x\d+)px$/i.test(value)),
                widthTokens=options.filter(value=>/^width\d+(?:x\d+)?px$/i.test(value)),upright=options.some(value=>kind(value.toLowerCase(),'img_upright')||/^(?:upright|superiordireito)(?:$|[\s=_])/i.test(value));
            const captions=parts.slice(1).map((p,i)=>({p,i:i+1})).filter(({p})=>!v219NativeMediaOption(p.text.trim()));
            const active=captions.at(-1),literalFinalCaption=active&&active.i===parts.length-1&&active.p.text.trim()&&!/[{}\[\]<>\r\n]/.test(active.p.text)&&!/^(?:vertical|semmdolura|width\d+px)$/.test(active.p.text.trim());
            for(const {p,i}of captions){const word=p.text.trim();let next=null,rule='v220ImageOption';
                // No new frame is introduced from an apparent size. A zero,
                // a very large size or a small natural file may render
                // differently after frameless, and this token may be caption.
                if(word==='semmdolura'&&redundantFrameless&&literalFinalCaption&&active.i>i&&!/[{}<>\r\n]/.test(raw))next=p.text.replace('semmdolura','semmoldura');
                else if(/^width[1-9]\d{0,3}px$/.test(word)&&+word.slice(5,-2)<=500&&!competingDimension&&!upright&&widthTokens.length===1&&literalFinalCaption&&active.i>i&&!/[{}<>\r\n]/.test(raw))next=p.text.replace('width','');
                else if(word==='vertical'&&cfg.multilingual!==false&&captions.some(c=>c.i>i&&c.p.text.trim()&&c.p.text.trim()!=='vertical')){
                    // A later caption is the active native caption. This earlier
                    // unrecognised token has no sizing role and is not upright.
                    edits.push({start:range.start+2+p.start-1,end:range.start+2+p.end,text:'',ruleId:'v220IgnoredImageOption',proof:{filename:parts[0].text,nativeAliasConfigurationSha256:'e6b9ff41808090cc84a28dc38ea573cfe0eaaf3760860311afee41cbefd95bfc',activeCaption:captions.at(-1).p.text}});continue;
                }
                // An option-looking image inside an HTML header/attribute is
                // an opaque example, not an independently editable image.
                // Read context only after a finite candidate has been found.
                if(next!==null&&!v219IndexedSyntaxContext(source,range.start))continue;
                if(next!==null)edits.push({start:range.start+2+p.start,end:range.start+2+p.end,text:next,ruleId:rule,proof:{filename:parts[0].text,beforeOption:p.text,afterOption:next,
                    nativeAliasConfigurationSha256:'e6b9ff41808090cc84a28dc38ea573cfe0eaaf3760860311afee41cbefd95bfc',
                    activeCaption:active.p.text,...(word==='semmdolura'?{kind:'redundant-existing-frameless',existingFrame:frames[0]}:{kind:'unique-literal-width',competingDimension:false,upright:false,widthTokenCount:widthTokens.length})}});
            }
        }
        return edits;
    }
    function v220BioUrlCallEdits(source,cfg) {
        if(cfg.markup===false||cfg.links===false)return [];const shield=v24SyntaxProtected(source);if(shield.unclosed.length)return [];
        const edits=[];for(const node of templates(shield.view).nodes){const raw=source.slice(node.start,node.end),parts=v24SyntaxParts(raw.slice(2,-2));
            if(!parts||!v220BioTitleSame(parts[0].text,'URL')||parts.length<2||parts.length>3)continue;
            const malformed=parts.slice(1).filter(p=>p.text.trim().includes('=')&&v220BioHttp(p.text.trim()));if(malformed.length!==1)continue;
            const bad=malformed[0],others=parts.slice(1).filter(p=>p!==bad);let label=null,ok=true;
            for(const p of others){const named=/^\s*([^=]+?)\s*=([\s\S]*)$/.exec(p.text);
                if(named){if(named[1]!=='2'||label!==null||!named[2].trim()){ok=false;break;}label={p,value:named[2],explicit:true};}
                else if(label===null&&p.text.trim()&&!/[{}\[\]<>\r\n]/.test(p.text))label={p,value:p.text,explicit:false};else{ok=false;break;}}
            if(!ok)continue;const changed=parts.map(p=>p.text),at=parts.indexOf(bad);changed[at]=bad.text.replace(/^(\s*)/,(_all,ws)=>ws+'1=');if(label&&!label.explicit)changed[parts.indexOf(label.p)]=label.p.text.replace(/^(\s*)/,(_all,ws)=>ws+'2=');
            const text='{{'+changed.join('|')+'}}';edits.push({start:node.start,end:node.end,text,ruleId:'v220UrlArgument',proof:{nativeTemplateOldid:72135033,nativeModuleOldid:49448117,url:bad.text.trim(),label:label?.value??null}});
        }return edits;
    }
    function v220BioHumanProof(source,cfg) {
        const p=cfg.v220HumanProof||cfg.biographyGenderProof;if(!p||p.source!==(cfg.biographyOriginalSource??source)||p.title!==cfg.pageTitle||p.namespace!==0||p.fullPage!==true||p.redirect||p.disambiguation)return false;
        const e=p.entity;if(!e||e.type!=='item'||e.id!==p.entityId||!/^Q[1-9]\d*$/.test(e.id)||e.sitelinks?.ptwiki?.title!==p.title)return false;
        const claims=(e.claims?.P31||[]).filter(x=>x&&x.rank!=='deprecated');return !!claims.length&&claims.every(x=>['normal','preferred'].includes(x.rank)&&!Object.keys(x.qualifiers||{}).length&&x.mainsnak?.snaktype==='value'&&x.mainsnak.datatype==='wikibase-item'&&x.mainsnak.datavalue?.type==='wikibase-entityid'&&x.mainsnak.datavalue.value?.['entity-type']==='item'&&x.mainsnak.datavalue.value?.id==='Q5');
    }
    function v220BioPortalCandidates(source,cfg,box) {
        const out=[],fields=box?.fields||[],identityOverride=fields.some(f=>['qid','wikidata','entity','entityid','id'].includes(norm(f.key))&&f.value.trim());
        if(box&&!identityOverride){const wanted=cfg.automaticTopicPortals!==false&&V220_TOPIC_BOXES[box.name];if(wanted&&box.profile.oldid===V220_TOPIC_OLDIDS[box.name])out.push(...wanted);
            if(cfg.automaticBiographyPortals!==false&&v220BioTitleSame(box.name,'Info/Biografia/Wikidata')&&box.profile.oldid===72589307)out.push('Biografias');
            if(cfg.automaticBiographyPortals!==false&&['Info','Infocaixa'].some(n=>v220BioTitleSame(box.name,n))&&v220BioHumanProof(source,cfg))out.push('Biografias');}
        const person=box&&(box.contract?.person||v220BioTitleSame(box.name,'Info/Biografia/Wikidata')&&!identityOverride||out.includes('Biografias'));
        if(person&&cfg.automaticBiographyPortals!==false){
            const born=fields.filter(f=>['nascimento_local','local_nascimento','nascimento_país','paisnatal'].includes(f.key)&&profileAccepts(box.profile,f.key)),countries=born.map(f=>countryPortals(f.value,true));
            if(countries.length&&countries.every(c=>c.length===1)&&new Set(countries.flat().map(portalIdentity)).size===1)out.push(countries[0][0]);
            const after=source.slice(box.node.end).split(/\n\s*\n/).filter(x=>x.trim())[0]||'',predicate=/^\s*'''([^\n]+?)'''\s+é\s+(?:um|uma)\s+\[\[(engenheir[oa](?: mecânic[oa]| civil| eletricist[a]| químic[oa])?)(?:\|([^\]]+))?\]\]/iu.exec(after);
            if(predicate&&biographySubjectMatchesTitle({fields:[{key:'nome',value:predicate[1]}]},cfg.pageTitle||'')&&
                (!predicate[3]||/^engenheir[oa](?: mecânic[oa]| civil| eletricista| químic[oa])?$/iu.test(predicate[3])))out.push('Engenharia');
        }
        // A literal, exact stellar chain identifies astronomy, not a person.
        const nodes=templates(v24SyntaxProtected(source).view).nodes.filter(n=>n.depth===0),begins=nodes.filter(n=>v220BioTitleSame(parsedTemplate(source.slice(n.start,n.end)).parts[0],'Starbox begin')),
            ends=nodes.filter(n=>v220BioTitleSame(parsedTemplate(source.slice(n.start,n.end)).parts[0],'Starbox end'));
        const firstSection=source.search(/^={2,6}[^=\n].*?={2,6}\s*$/m);
        if(begins.length===1&&ends.length===1&&begins[0].start<ends[0].start&&(firstSection<0||ends[0].end<firstSection)&&cfg.automaticTopicPortals!==false)out.push('Astronomia');
        if(cfg.automaticTopicPortals!==false&&source.includes('[[Categoria:Méis')){const context=v220BioLiteralEvidenceContext(source);
            if(!/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(context.view))for(const match of context.view.matchAll(/\[\[Categoria:Méis(?:\|[^\[\]{}<>\r\n]*)?\]\]/g))
                if(v220BioLiteralEvidenceRange(context,match.index,match.index+match[0].length)){out.push('Alimentos');break;}}
        return [...new Set(out)];
    }
    function v220BioPortalCleanup(source,cfg) {
        const shield=v24SyntaxProtected(source),nodes=templates(shield.view).nodes.filter(n=>n.depth===0),calls=nodes.filter(n=>v220BioTitleSame(parsedTemplate(source.slice(n.start,n.end)).parts[0],'Portal3'));
        const parsed=[];for(const node of calls){const raw=source.slice(node.start,node.end),p=biographyPortalSlots(raw);if(p.unsafe||p.p.parts.slice(1).some(x=>/[{}<>\r\n]/.test(x)))continue;
            const rows=[...p.slots.entries()].sort((a,b)=>a[0]-b[0]);if(rows.some(([n,e],i)=>n!==i+1||!e.value.trim()))continue;
            const themes=rows.map(([,e])=>e.value.trim()),seen=new Set(),kept=[];
            for(let theme of themes){if(theme==='Portal3')continue;if(theme==='RondôniaBrasil')theme='Rondônia';
                const key=['economia','economia e negócios','negócios e economia'].includes(theme.toLowerCase())?'negócios e economia':portalIdentity(theme);if(seen.has(key))continue;seen.add(key);kept.push(theme);}
            if(!kept.length)continue;parsed.push({node,themes:kept,keys:[...seen],text:JSON.stringify(themes)===JSON.stringify(kept)?raw:'{{'+p.p.parts[0]+'|'+kept.join('|')+'}}',raw});}
        const edits=[];
        for(let i=0;i<parsed.length;i++){const a=parsed[i],b=parsed[i+1];if(b&&/^\s*$/.test(source.slice(a.node.end,b.node.start))&&a.keys.every(k=>b.keys.includes(k))){edits.push({start:a.node.start,end:a.node.end,text:'',ruleId:'v220PortalCleanup',proof:{themes:a.themes,preservedInNext:b.themes}});continue;}
            if(a.text!==a.raw)edits.push({start:a.node.start,end:a.node.end,text:a.text,ruleId:'v220PortalCleanup',proof:{themes:a.themes,nativePortalSwitchLowercase:true}});}
        return {text:v24SyntaxApply(source,edits),edits};
    }
    function v220BioSingleDifference(before,after,rule,proof) {
        if(before===after)return [];let start=0,endB=before.length,endA=after.length;while(start<endB&&start<endA&&before[start]===after[start])start++;while(endB>start&&endA>start&&before[endB-1]===after[endA-1]){endB--;endA--;}
        return [{start,end:endB,text:after.slice(start,endA),ruleId:rule,proof}];
    }
    function v220BiographyPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[],stages:[]};if(!v220BioScope(source,cfg))return empty;
        let text=source;const stages=[];const stage=(name,edits)=>{if(!edits.length)return;const sorted=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end);if(sorted.some((e,i)=>i&&e.start<sorted[i-1].end))return;
            const before=text;for(const edit of sorted)edit.proof={sourceHash:v24SyntaxHash(before),...edit.proof};text=v24SyntaxApply(text,sorted);stages.push({name,source:before,sourceHash:v24SyntaxHash(before),text,edits:sorted});};
        const box=v220BioPrincipal(text);if(box)stage('native-infobox-fields',v220BioFieldEdits(text,cfg,box));
        stage('literal-image-options',v220BioMediaEdits(text,cfg));stage('native-url-arguments',v220BioUrlCallEdits(text,cfg));
        if(cfg.portals!==false&&cfg.endMatter!==false){const cleaned=v220BioPortalCleanup(text,cfg),candidates=v220BioPortalCandidates(cleaned.text,cfg,v220BioPrincipal(cleaned.text));
            // An open owner can hide every previously appended portal from the
            // shared writer. Check the complete boundary only for portal work.
            if((cleaned.edits.length||candidates.length)&&!v24SyntaxScan(text).issues.length){stage('portal-cleanup',cleaned.edits);
                if(candidates.length){let count=0;const before=text,after=v211AppendConfirmedPortals(before,cfg,()=>count++,candidates,'v220TopicPortals'),edits=v220BioSingleDifference(before,after,'v220TopicPortals',{candidates});if(edits.length&&count>1)edits[0].count=count;stage('confirmed-portals',edits);}}}
        if(text===source)return empty;
        return {...empty,text,stages,edits:v220BioSingleDifference(source,text,'v220Biography',{stageNames:stages.map(x=>x.name),editCount:stages.reduce((n,s)=>n+s.edits.reduce((m,e)=>m+(e.count||1),0),0)})};
    }
    function v220BiographyProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v220BiographyPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.stages)===JSON.stringify(plan.stages)&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

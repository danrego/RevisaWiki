    // A name is formatted only at the first literal subject mention. Dates
    // copied to that opening need their own explicit reference in the box.
    function v2151BiographyLeadScope(cfg={}) {
        return cfg.namespaceNumber===0&&cfg.automaticBiographyLead!==false&&cfg.markup!==false&&
            cfg.structuralRepairs!==false&&!cfg.sectionOnly&&!cfg.discussionPage&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&!cfg.redirectPage&&!cfg.disambiguationPage&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='')&&
            (!cfg.contentModel||cfg.contentModel==='wikitext')&&(!cfg.model||cfg.model==='wikitext')&&
            !/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''));
    }
    function v2151LeadTitle(value) {
        const title=String(value||'').normalize('NFC').replace(/_/g,' ').replace(/[ \t]+/g,' ').trim();
        return title?title[0].toLocaleUpperCase('pt')+title.slice(1):'';
    }
    function v2151LeadHead(source) {
        const section=source.search(/^={2,6}[^=\r\n].*?={2,6}[ \t]*(?:\r?\n|$)/m),end=section<0?source.length:section;
        return end<=65536?source.slice(0,end):null;
    }
    function v2151LeadReference(raw,source) {
        const tokens=refTokens(raw);if(tokens.length!==1||tokens[0].start!==0||tokens[0].end!==raw.length)return null;
        const token=tokens[0],attrs=attrsOf(token.attrs);
        if(!attrs||Object.keys(attrs).some(key=>!['name','group'].includes(key))||
            Object.values(attrs).some(value=>!value||/[{}&<>\r\n]/.test(value))||token.body!==null&&!token.body.trim())return null;
        if(!attrs.name)return token.body===null?null:raw;
        const matching=refTokens(protectedView(source)).filter(ref=>{
            const a=attrsOf(ref.attrs);return a&&a.name===attrs.name&&(a.group||'')===(attrs.group||'')&&ref.body!==null;
        });
        if(!matching.length||new Set(matching.map(ref=>ref.body)).size!==1||
            matching.some(ref=>!ref.body.trim()||Object.keys(attrsOf(ref.attrs)||{}).some(key=>!['name','group'].includes(key))))return null;
        // The definition remains in the box. The added occurrence reuses its
        // exact literal name and group instead of creating another definition.
        return token.self?raw:raw.slice(0,token.openEnd).replace(/>$/,' />');
    }
    function v2151LeadValue(value,source,requireReference=false,copyReference=false) {
        if(typeof value!=='string'||value.length>4096||/<!--|\{\{\{|[\uE000-\uF8FF]/.test(value))return null;
        const raw=value.trim(),tokens=refTokens(raw),first=tokens[0]?.start??raw.length;
        if(requireReference&&!tokens.length)return null;
        let at=first,refs='';
        for(const token of tokens){
            if(raw.slice(at,token.start).trim())return null;
            const reference=v2151LeadReference(raw.slice(token.start,token.end),source);if(reference===null)return null;
            refs+=copyReference?reference:raw.slice(token.start,token.end);at=token.end;
        }
        if(raw.slice(at).trim()||tokens.length>6)return null;
        const core=raw.slice(0,first).trim();
        if(!core||/[\r\n<>]/.test(core))return null;
        return {core,refs,raw};
    }
    function v2151LeadDate(core) {
        if(typeof core!=='string'||core.length>400||/[<>\r\n]|\b(?:cerca|circa|aproximad|julian|gregorian|a\.\s*c\.)|[?~]/iu.test(core))return null;
        let text=core,template=null;
        if(text.startsWith('{{')){
            if(!/^\{\{[^{}]*\}\}$/.test(text))return null;
            const parsed=parsedTemplate(text),positions=new Map();let position=1;
            if(!['dni','dataext','morte'].includes(parsed.name))return null;
            for(const part of parsed.parts.slice(1)){
                const named=/^\s*([1-6])\s*=\s*(.*?)\s*$/.exec(part),key=named?named[1]:String(position++),value=named?named[2]:part.trim();
                if(positions.has(key)||!['1','2','3','4','5','6'].includes(key))return null;
                if(!/^\d+$/.test(value)&&!(parsed.name==='dni'&&key==='4'&&['si','sem idade'].includes(norm(value))))return null;
                positions.set(key,value);
            }
            if(parsed.name==='dataext'&&positions.size!==3||parsed.name==='dni'&&(positions.size<3||positions.size>4)||parsed.name==='morte'&&![3,6].includes(positions.size))return null;
            if(parsed.name==='dni'&&positions.has('4')&&!['si','sem idade'].includes(norm(positions.get('4'))))return null;
            const numbers=['1','2','3'].map(key=>+positions.get(key));
            if(!validDate(...numbers))return null;
            if(parsed.name==='morte'&&positions.size===6){const born=['4','5','6'].map(key=>+positions.get(key));
                if(!validDate(...born)||numbers[2]*10000+numbers[1]*100+numbers[0]<born[2]*10000+born[1]*100+born[0])return null;
            }
            template={name:parsed.name,numbers,positions};text=numbers[0]+' de '+MONTH_PT[numbers[1]]+' de '+numbers[2];
        }else{
            let invalid=false;
            text=text.replace(/\[\[([^\[\]\r\n]+)\]\]/g,(_,body)=>{
                const bits=body.split('|');if(bits.length>2||/[#:{}<>]/.test(bits[0])||bits.length===2&&bits[1]!==bits[0]){invalid=true;return '';}
                return bits[0];
            });
            if(invalid||/[\[\]{}]/.test(text))return null;
        }
        const numbers=template?.numbers||v28DateNumbers(text.replace(/^1(?:\.º|º) de /,'1 de '));if(!numbers||numbers[2]<1583)return null;
        const stamp=numbers[2]*10000+numbers[1]*100+numbers[0],today=new Date(),now=today.getUTCFullYear()*10000+(today.getUTCMonth()+1)*100+today.getUTCDate();
        if(stamp>now)return null;
        return {numbers,stamp,identity:numbers.join('/'),raw:core,generated:'{{DataExt|'+numbers.join('|')+'}}',template:template?.name||null};
    }
    function v2151LeadPlace(core) {
        if(typeof core!=='string'||core.length>300||/[{}<>\r\n;!?~]|\b(?:desconhecid|ignorado|incerto|possivelmente|provavelmente|cerca|residência|sepultamento)\b/iu.test(core))return null;
        const links=[];let invalid=false;
        const plain=core.replace(/\[\[([^\[\]\r\n]+)\]\]/g,(_,body)=>{
            const bits=body.split('|'),target=bits[0].trim(),label=(bits[1]??bits[0]).trim();
            if(bits.length>2||!target||target!==bits[0]||!label||/[#:{}<>]/.test(target)||/[\d{}<>\[\]()]/u.test(label)){invalid=true;return '';}
            links.push(v2151LeadTitle(target));return label;
        });
        if(invalid||!plain||!/^[\p{L}\p{M} .'’,-]+$/u.test(plain)||/^[ ,.-]|[ ,.-]$/.test(plain))return null;
        return {raw:core,identity:links.length?'links:'+links.join('|'):'text:'+v2151LeadTitle(plain)};
    }
    function v2151LeadTuplePart(raw,source) {
        const value=v2151LeadValue(raw,source),direct=value&&v2151LeadDate(value.core);
        if(direct)return {date:{...direct,raw:value.core+value.refs},place:null,reversed:false};
        const content=value?value.core:raw,view=v24SyntaxMaskRanges(content,[...refTokens(content),...topNodes(content),...editorialWikiLinkRanges(content)]),cuts=[];
        for(const match of view.matchAll(/,/g))cuts.push(match.index);
        // A date has no comma. A literal location can itself contain commas,
        // so test every boundary and require exactly one valid reading.
        const readings=[];
        for(const cut of cuts){
            const left=v2151LeadValue(content.slice(0,cut),source),right=v2151LeadValue(content.slice(cut+1),source);
            if(!left||!right)continue;
            const a=v2151LeadDate(left.core),b=v2151LeadDate(right.core);
            if(a&&!(value===null&&refTokens(raw).length)){const place=v2151LeadPlace(right.core);if(place)readings.push({date:{...a,raw:left.core+left.refs},place:{...place,raw:right.core+right.refs},reversed:true,suffix:value?.refs||''});}
            if(b){const place=v2151LeadPlace(left.core);if(place)readings.push({date:{...b,raw:right.core+right.refs},place:{...place,raw:left.core+left.refs},reversed:false,suffix:value?.refs||''});}
        }
        return readings.length===1?readings[0]:null;
    }
    function v2151LeadTuple(raw,source) {
        const view=v24SyntaxMaskRanges(raw,[...refTokens(raw),...topNodes(raw),...editorialWikiLinkRanges(raw)]),
            separators=[...raw.matchAll(/[ \t]+[–—][ \t]+/g)].filter(match=>{const dash=match[0].search(/[–—]/);return view[match.index+dash]===match[0][dash];});
        if(separators.length>1)return null;
        if(!separators.length){const birth=v2151LeadTuplePart(raw,source);return birth?{birth,death:null,separator:null}:null;}
        const cut=separators[0],birth=v2151LeadTuplePart(raw.slice(0,cut.index),source),death=v2151LeadTuplePart(raw.slice(cut.index+cut[0].length),source);
        return birth&&death&&death.date.stamp>=birth.date.stamp?{birth,death,separator:cut[0]}:null;
    }
    function v2151LeadOpening(source,cfg={}) {
        const title=v2151LeadTitle(cfg.pageTitle),subject=title.replace(/ \([^()]+\)$/,'');
        if(!title||!subject||/[{}\[\]<>#|\r\n]/.test(title)||/^#(?:REDIRECT|REDIRECIONAMENTO)/i.test(source.trimStart()))return null;
        const head=v2151LeadHead(source);if(head===null)return null;
        const info=structuralReaders(head);let at=source[0]==='\uFEFF'?1:0;
        while(at<source.length){
            const whitespace=/^[ \t\r\n]*/.exec(source.slice(at))[0];at+=whitespace.length;
            if(source.slice(at,at+2)!=='{{')break;
            const node=info.nodes.find(n=>n.start===at);if(!node)return null;
            const allowed=typeof V2151_LEAD_PREFIXES!=='undefined'&&V2151_LEAD_PREFIXES.has(node.p.name),box=INFOBOX_CATALOG[node.p.name];
            if(!allowed&&!(box&&/^info\//.test(node.p.name)&&v215LiteralTemplateIdentity(node.raw,box)))return null;
            const lineEnd=source.indexOf('\n',node.end);if(source.slice(node.end,lineEnd<0?source.length:lineEnd).trim())return null;
            at=node.end;
        }
        if(at>=source.length||info.headings[0]?.start<at||at>0&&!/\n|\uFEFF/.test(source[at-1])&&source.slice(0,at).trim())return null;
        // A leading space is preformatted text, even when its words happen to
        // match the article title. It is not an encyclopedic opening.
        const lineStart=source.lastIndexOf('\n',at-1)+1;if(source.slice(lineStart,at).replace(/^\uFEFF/,'').length)return null;
        let end=at,body='',bold=false,selfLink=false;
        if(source.slice(end,end+3)==="'''"){bold=true;end+=3;}
        if(source.slice(end,end+2)==='[['){
            const close=source.indexOf(']]',end+2);if(close<0)return null;
            const pieces=source.slice(end+2,close).split('|');if(pieces.length>2||v2151LeadTitle(pieces[0])!==title||pieces[0].includes('#'))return null;
            body=pieces[1]??pieces[0].replace(/_/g,' ');if(body!==subject)return null;
            selfLink=true;end=close+2;
        }else{if(source.slice(end,end+subject.length)!==subject)return null;body=subject;end+=subject.length;}
        if(bold){if(source.slice(end,end+3)!=="'''")return null;end+=3;}
        const nameEnd=end,gap=/^[ \t]*/.exec(source.slice(end))[0];end+=gap.length;
        let tuple=null,tupleStart=null,tupleEnd=null;
        if(source[end]==='('){
            const fragment=source.slice(end+1,end+8193),view=v24SyntaxMaskRanges(fragment,[...refTokens(fragment),...topNodes(fragment),...editorialWikiLinkRanges(fragment)]),close=view.indexOf(')');
            if(close<0||/[\r\n(]/.test(view.slice(0,close)))return null;
            tupleStart=end;tupleEnd=end+close+2;tuple={raw:source.slice(end+1,tupleEnd-1)};end=tupleEnd;
        }else end=nameEnd;
        const grammar=/^[ \t]+(é|foi|são|foram)(?=[ \t])/.exec(source.slice(end));if(!grammar)return null;
        return {start:at,end:nameEnd,nameRaw:source.slice(at,nameEnd),body,bold,selfLink,tupleStart,tupleEnd,tuple,verb:grammar[1],subject,title};
    }
    // Literal value roles reviewed in these exact native definitions. The
    // accepted-parameter checker is not evidence that a value is displayed.
    const V2151_LEAD_TRANSFER_CONTRACTS = {"26361976":{"profiles":["info/revolucionário"],"birthDate":["data_nascimento"],"birthPlace":["local_nascimento"],"deathDate":["data_morte"],"deathPlace":["local_morte"],"headers":["nome"],"requireHeader":true},"36826568":{"profiles":["info/triatleta"],"birthDate":["nascimento_data","data_nascimento"],"birthPlace":["nascimento_local","local_nascimento"],"deathDate":["morte_data","data_morte"],"deathPlace":["morte_local","local_morte"],"headers":["nome"]},"53743614":{"profiles":["info/esgrimista"],"birthDate":["nascimento_data","data_nascimento"],"birthPlace":["nascimento_local","local_nascimento"],"deathDate":["morte_data","data_morte"],"deathPlace":["morte_local","local_morte"],"headers":["nome"]},"54243899":{"profiles":["info/treinador de basquete","info/treinador de basquetebol"],"birthDate":["DatadeNascimento"],"birthPlace":["LocaldeNascimento"],"deathDate":["DatadaMorte"],"deathPlace":["LocaldaMorte"],"headers":["Nome"],"requireHeader":true},"66124641":{"profiles":["info/piloto de corrida"],"birthDate":["data_de_nascimento","nascimento"],"birthPlace":["local_de_nascimento"],"deathDate":["data_da_morte","falecimento_data"],"deathPlace":["local_da_morte","falecimento_lugar"],"headers":["Name","nome"],"guardOnly":{"birthPlace":["origem","país"]}},"66374725":{"profiles":["info/jogador de rugby"],"birthDate":["dateofbirth"],"birthPlace":["placeofbirth"],"deathDate":["dateofdeath"],"deathPlace":["placeofdeath"],"headers":["name"],"requireHeader":true},"68053869":{"profiles":["info/tenista"],"birthDate":["datadenascimento"],"birthPlace":["cidadenatal"],"deathDate":["datadefalecimento"],"deathPlace":["cidadedamorte"],"headers":["nometenista"],"guardOnly":{"deathPlace":["paisdamorte"]}},"68468692":{"profiles":["info/comediante"],"birthDate":["data_nascimento","nascimento_data"],"birthPlace":["local_nascimento","nascimento_local"],"deathDate":["data_morte","morte_data"],"deathPlace":["local_morte","morte_local"],"headers":["nome"],"requireHeader":true,"placeNeedsDate":true},"68881875":{"profiles":["info/boxeador"],"birthDate":["nascimento_data","data_nascimento","nasceu","nascimento"],"birthPlace":["nascimento_local","local_nascimento","nascimento_cidade","cidade natal","localnasc"],"deathDate":["morte_data","data_morte","data_falecimento","faleceu","falecimento"],"deathPlace":["morte_local","local_morte"],"headers":["nome"],"guardOnly":{"deathPlace":["enterro_local","local_falecimento","localfaleceu"]}},"70095373":{"profiles":["info/futebolista"],"birthDate":["data_nascimento","datadenascimento","nascimento_data"],"birthPlace":["nascimento_local","cidadenatal","nascimento_cidade"],"deathDate":["morte_data","data_morte","datadefalecimento"],"deathPlace":["morte_local"],"headers":["nome"],"guardOnly":{"deathPlace":["morte_cidade","cidadedamorte","morte_país","paisdamorte"]}},"70299175":{"profiles":["info/prelado da igreja católica","info/bispo da igreja católica"],"birthDate":["nascimento_data"],"birthPlace":["nascimento_local"],"deathDate":["morte_data"],"deathPlace":["morte_local"],"headers":["nome"],"requireHeader":true},"70325721":{"profiles":["info/papa"],"birthDate":["nascimento_data"],"birthPlace":["nascimento_local"],"deathDate":["morte_data"],"deathPlace":["morte_local"],"headers":["nome","nome de nascimento"]},"70403402":{"profiles":["info/militar","info/combatente militar"],"birthDate":["nascimento_data","nascimento"],"birthPlace":["nascimento_local","localnascimento"],"deathDate":["morte_data","falecimento"],"deathPlace":["morte_local","localfalecimento"],"headers":["nome"]},"70433692":{"profiles":["info/treinador de futebol","info/treinador"],"birthDate":["data_nascimento","datadenascimento","nascimento_data"],"birthPlace":["nascimento_local","cidadenatal","nascimento_cidade"],"deathDate":["morte_data","data_morte","datadefalecimento"],"deathPlace":["morte_local"],"headers":["nome"],"guardOnly":{"deathPlace":["morte_cidade","cidadedamorte","morte_país","paisdamorte"]}},"70580964":{"profiles":["info/piloto de automóvel"],"birthDate":["nascimento_data","nascimento"],"birthPlace":["nascimento_local"],"deathDate":["morte_data","falecimento"],"deathPlace":["morte_local"],"headers":["nome"],"guardOnly":{"birthPlace":["localnascimento"],"deathPlace":["localfalecimento"]}},"70964118":{"profiles":["info/golfista"],"birthDate":["datadenascimento"],"birthPlace":["cidadenatal"],"deathDate":["datadefalecimento"],"deathPlace":["cidadedamorte"],"headers":["nomegolfista"],"guardOnly":{"deathPlace":["paisdamorte"]}},"71357256":{"profiles":["info/jogador de basquete"],"birthDate":["data_nascimento","datadenascimento","nascimento_data"],"birthPlace":["nascimento_local","cidadenatal","nascimento_cidade"],"deathDate":["morte_data","datadefalecimento","data_morte"],"deathPlace":["morte_local","local_morte"],"headers":["nome"],"guardOnly":{"deathPlace":["cidadedamorte","paisdamorte"]}},"71530652":{"profiles":["info/artista marcial"],"birthDate":["data de nascimento","nascimento_data"],"birthPlace":["local de nascimento","nascimento_local"],"deathDate":["data de morte","morte_data"],"deathPlace":["local de morte","morte_local","local de falecimento"],"headers":["nome"]},"71681928":{"profiles":["info/dublador"],"birthDate":["nascimento_data","data_nascimento"],"birthPlace":["nascimento_local","localidaden"],"deathDate":["morte_data","data_falecimento"],"deathPlace":["morte_local","localidadef"],"headers":["nome"]},"72130922":{"profiles":["info/modelo"],"birthDate":["nascimento_data","data_nascimento","nasceu","nascimento"],"birthPlace":["nascimento_local","local_nascimento","nascimento_cidade","cidade natal","localnasc"],"deathDate":["morte_data","data_morte","data_falecimento","faleceu","falecimento"],"deathPlace":["morte_local","local_morte"],"headers":["nome"],"requireHeader":true,"guardOnly":{"deathPlace":["enterro_local","local_falecimento","localfaleceu"]}},"72335378":{"profiles":["info/filósofo"],"birthDate":["data_nascimento","nascimento_data"],"birthPlace":["localidaden","nascimento_local"],"deathDate":["data_falecimento","morte_data"],"deathPlace":["localidadef","morte_local"],"headers":["nome"]},"72386980":{"profiles":["info/esporte/atleta","info/atleta"],"birthDate":["nascimento_data","data_nascimento"],"birthPlace":["nascimento_local","local_nascimento"],"deathDate":["morte_data","data_morte"],"deathPlace":["morte_local","local_morte"],"headers":["nome"]},"72594140":{"profiles":["info/futebol"],"birthDate":["data de nascimento","nascimento_data"],"birthPlace":["local de nascimento","nascimento_local"],"deathDate":["data de morte","morte_data"],"deathPlace":["local de morte","morte_local"],"headers":["nome"]},"72825634":{"profiles":["info/jogador de voleibol","info/voleibol/jogador"],"birthDate":["nascimento_data","datadenascimento"],"birthPlace":["nascimento_local"],"deathDate":["morte_data","datademorte"],"deathPlace":["morte_local"],"headers":["nomejogador"],"guardOnly":{"birthPlace":["cidadenatal","paisnatal"],"deathPlace":["cidadedemorte","paisdemorte"]}},"72882232":{"profiles":["info/ator","info/atriz","info/actor"],"birthDate":["nascimento_data","data_nascimento"],"birthPlace":["nascimento_local","localidaden"],"deathDate":["morte_data","data_falecimento"],"deathPlace":["morte_local","localidadef"],"headers":["nome"]},"72887103":{"profiles":["info/beisebolista"],"birthDate":["nascimento_data"],"birthPlace":["nascimento_local"],"deathDate":["morte_data"],"deathPlace":["morte_local"],"headers":["nome"]},"72931974":{"profiles":["info/político","info/senador do império do brasil"],"birthDate":["data_nascimento","nascimento_data"],"birthPlace":["local_nascimento","nascimento_local"],"deathDate":["data_morte","morte_data"],"deathPlace":["local_morte","morte_local"],"headers":["nome"]},"72947166":{"profiles":["info/magistrado"],"birthDate":["nascimento_data","data_nascimento"],"birthPlace":["nascimento_local","local_nascimento"],"deathDate":["morte_data","data_morte"],"deathPlace":["morte_local","local_morte"],"headers":["nome"]},"72993800":{"profiles":["info/biografia","info/cientista","info/escritor","info/autor","info/sacerdote","info/teólogo cristão","info/ator pornográfico","info/jornalista"],"birthDate":["nascimento_data","data_nascimento","nasceu","nascimento"],"birthPlace":["local_nascimento","nascimento_local"],"deathDate":["morte_data","data_morte","data_falecimento","faleceu","falecimento"],"deathPlace":["local_morte","morte_local","local_falecimento","localfaleceu"],"headers":["nome"]},"73044750":{"profiles":["info/música/artista","info/artista musical","info/cantor","info/músico"],"birthDate":["nascimento_data","nascimento"],"birthPlace":["nascimento_cidade"],"deathDate":["morte_data","falecimento","morte"],"deathPlace":["morte_local"],"headers":["nome"]},"73118835":{"profiles":["info/criminoso"],"birthDate":["data_nascimento","nascimento_data"],"birthPlace":["local_nascimento","nascimento_local"],"deathDate":["data_morte","morte_data"],"deathPlace":["local_morte","morte_local"],"headers":["nome"]},"73122259":{"profiles":["info/nobre","info/monarca"],"birthDate":["nascimento_data","nascimento","data de nascimento"],"birthPlace":["nascimento_local","cidadenatal","local de nascimento"],"deathDate":["morte_data","morte","falecimento","data de óbito","data da morte"],"deathPlace":["morte_local","cidademorte","cidadefalecimento","lugar de óbito","local da morte"],"headers":["nome"]},"73164878":{"profiles":["info/enxadrista","info/xadrezista"],"birthDate":["data de nascimento","nascimento_data"],"birthPlace":["local de nascimento","nascimento_local"],"deathDate":["data de morte","morte_data"],"deathPlace":["local de morte","morte_local"],"headers":["nome","nome do jogador"],"requireHeader":true}};
    function v2151LeadTransferContract(profile) {
        const contract=V2151_LEAD_TRANSFER_CONTRACTS[profile?.oldid];
        return contract&&contract.profiles.includes(norm(profile?.title||''))?contract:null;
    }
    function v2151LeadFactFields(box,kind) {
        const groups={birthDate:['nascimento_data','data_nascimento','nasceu','nascimento','datadenascimento','data de nascimento'],
            birthPlace:['nascimento_local','local_nascimento','nascimento_cidade','cidade natal','localnasc'],
            deathDate:['morte_data','data_morte','data_falecimento','faleceu','falecimento','data de morte','morte'],
            deathPlace:['morte_local','local_morte','local_falecimento','localfaleceu']},contract=v2151LeadTransferContract(box.profile),
            keys=new Set([...groups[kind],...(contract?.[kind]||[]),...(contract?.guardOnly?.[kind]||[])].map(norm));
        for(const [key,target]of Object.entries({...box.profile?.aliases,...box.profile?.renames}))if(keys.has(norm(target)))keys.add(norm(key));
        return box.fields.filter(field=>keys.has(norm(field.key)));
    }
    function v2151LeadFactField(box,kind,source,requireReference=true) {
        const contract=v2151LeadTransferContract(box.profile),fields=v2151LeadFactFields(box,kind);
        if(!contract||fields.length!==1||!contract[kind].includes(fields[0].key)||!profileAccepts(box.profile,fields[0].key))return null;
        if(contract.placeNeedsDate&&/Place$/.test(kind)&&!v2151LeadFactField(box,kind.replace('Place','Date'),source,false))return null;
        const field=fields[0],value=v2151LeadValue(field.value,source,requireReference,requireReference);if(!value)return null;
        const fact=/Date$/.test(kind)?v2151LeadDate(value.core):v2151LeadPlace(value.core);if(!fact)return null;
        if(kind==='birthDate'&&fact.template==='morte'||kind==='deathDate'&&fact.template==='dni')return null;
        return {...fact,key:field.key,fieldValue:field.value,fieldStart:box.node.start+field.start,fieldEnd:box.node.start+field.end,refs:value.refs,
            raw:(/Date$/.test(kind)?fact.generated:value.core)+value.refs};
    }
    function v2151LeadDateCompletion(source,cfg,opening) {
        const head=v2151LeadHead(source);
        if(head===null||cfg.infoboxes===false||!biographyDetection(head,cfg))return null;
        const box=v28PrincipalPersonBox(head,cfg);if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.raw,box.profile))return null;
        const contract=v2151LeadTransferContract(box.profile);if(!contract)return null;
        if(box.fields.some(field=>['incorporar','subbox','subcaixa','nested','child','embed','embutido'].includes(norm(field.key))&&
            field.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(field.value.trim())))return null;
        const headerKeys=new Set(['nome',...contract.headers].map(norm));
        for(const [key,target]of Object.entries({...box.profile.aliases,...box.profile.renames}))if(headerKeys.has(norm(target)))headerKeys.add(norm(key));
        const names=box.fields.filter(field=>headerKeys.has(norm(field.key)));
        if(names.length>1||names.length&&(!contract.headers.includes(names[0].key)||!names[0].value.trim())||contract.requireHeader&&!names.length)return null;
        if(names.length&&names[0].value.trim()){
            let header=names[0].value.trim();if(/^'''[^'\r\n]+'''$/.test(header))header=header.slice(3,-3);
            if(header.startsWith('[[')){
                const linked=/^\[\[([^\[\]|\r\n]+)(?:\|([^\[\]|\r\n]+))?\]\]$/.exec(header);
                if(!linked||v2151LeadTitle(linked[1])!==opening.title)return null;
                header=linked[2]??linked[1].replace(/_/g,' ');
            }
            if(header!==opening.subject)return null;
        }
        if(box.fields.some(field=>/calend[aá]rio|calendar/i.test(field.key)&&field.value.trim()))return null;
        const explicit=opening.tuple?v2151LeadTuple(opening.tuple.raw,source):null;if(opening.tuple&&!explicit)return null;
        const kinds=['birthDate','birthPlace','deathDate','deathPlace'],facts=Object.fromEntries(kinds.map(kind=>[kind,v2151LeadFactField(box,kind,source)])),
            literals=Object.fromEntries(kinds.map(kind=>[kind,v2151LeadFactField(box,kind,source,false)])),birth=explicit?.birth||null,death=explicit?.death||null;
        for(const kind of kinds){const fields=v2151LeadFactFields(box,kind);
            if(fields.length>1)return null;
            // Checker-only, condition-only and explicitly unproved value roles
            // cannot supply a fact. Other independently proved roles remain usable.
            if(fields.length===1&&contract[kind].includes(fields[0].key)&&fields[0].value.trim()&&!literals[kind])return null;
        }
        // An already written value wins. A disagreement prevents completion,
        // including a different location or a living/deceased contradiction.
        for(const [kind,current]of [['birthDate',birth?.date],['birthPlace',birth?.place],['deathDate',death?.date],['deathPlace',death?.place]]){
            if(current&&literals[kind]&&current.identity!==literals[kind].identity)return null;
        }
        if(literals.birthDate&&literals.deathDate&&(literals.deathDate.stamp<literals.birthDate.stamp||literals.deathDate.numbers[2]-literals.birthDate.numbers[2]>125))return null;
        if(opening.verb==='é'&&(death||v2151LeadFactFields(box,'deathDate').some(field=>field.value.trim())))return null;
        if(!['é','foi'].includes(opening.verb))return null;
        const changes=[],copied=[],nextBirth=birth?{...birth}:null;
        let b=nextBirth,d=death?{...death}:null;
        const copy=(kind,ruleId)=>{const fact=facts[kind];copied.push({kind,key:fact.key,fieldStart:fact.fieldStart,fieldEnd:fact.fieldEnd,fieldValue:fact.fieldValue,identity:fact.identity,emitted:fact.raw});changes.push(ruleId);return fact;};
        if(!b&&facts.birthDate)b={date:copy('birthDate','biographyLeadBirth'),place:null,reversed:false};
        if(!b)return null;
        if(!b.place&&facts.birthPlace)b.place=copy('birthPlace','biographyLeadBirth');
        if(opening.verb==='foi'&&!d&&facts.deathDate)d={date:copy('deathDate','biographyLeadDeath'),place:null,reversed:false};
        if(d&&!d.place&&facts.deathPlace)d.place=copy('deathPlace','biographyLeadDeath');
        if(d&&(d.date.stamp<b.date.stamp||d.date.numbers[2]-b.date.numbers[2]>125))return null;
        if(d&&(cfg.livingCategoryConfirmed||/\[\[\s*Categoria\s*:\s*Pessoas vivas\s*(?:\|[^\]]*)?\]\]/i.test(protectedView(source))))return null;
        if(b.reversed)changes.push('biographyLeadTuple');if(d?.reversed)changes.push('biographyLeadTuple');
        const render=part=>(part.place?part.place.raw+', ':'')+part.date.raw+(part.suffix||''),content=render(b)+(d?(explicit?.separator||' – ')+render(d):'');
        if(!changes.length||opening.tuple?.raw===content)return null;
        const start=opening.tupleStart??opening.end,end=opening.tupleEnd??opening.end,text=(opening.tuple?'':' ')+'('+content+')';
        return {start,end,text,ruleId:changes[0],proof:{scope:'biography-dates',sourceHash:v24SyntaxHash(source),template:box.name,boxRaw:box.sourceRaw,
            before:source.slice(start,end),after:text,copiedFacts:copied,changeRules:changes,
            condition:'one literal native principal person box; exact opening; unique individually referenced explicit date/place fields; existing values match; source box unchanged'}};
    }
    function v2151BiographyLeadEdits(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v2151BiographyLeadScope(cfg))return [];
        const opening=v2151LeadOpening(source,cfg);if(!opening)return [];
        const prefix=source.slice(0,Math.max(opening.end,opening.tupleEnd||0));
        if(/<!--|\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)|\{\||\|\}|<\s*\/?\s*(?:div|section|table|blockquote|q|pre|code|syntaxhighlight|source|nowiki|noinclude|includeonly|onlyinclude|gallery|imagemap|poem|timeline)\b/i.test(prefix)||v24SyntaxScan(prefix).issues.length)return [];
        const edits=[],rules=[];
        if(opening.selfLink)rules.push('biographyLeadSelfLink');if(!opening.bold)rules.push('biographyLeadBold');
        if(rules.length)edits.push({start:opening.start,end:opening.end,text:"'''"+opening.body+"'''",ruleId:rules[0],proof:{scope:'initial-subject',sourceHash:v24SyntaxHash(source),before:opening.nameRaw,after:"'''"+opening.body+"'''",subject:opening.subject,pageTitle:opening.title,changeRules:rules,
            condition:'first literal mainspace subject exactly names article title; preserve displayed subject; no body prose rewritten'}});
        const dates=v2151LeadDateCompletion(source,cfg,opening);if(dates)edits.push(dates);
        return edits.sort((a,b)=>a.start-b.start||a.end-b.end);
    }
    function v2151BiographyLeadPlan(source,cfg={}) {
        const edits=v2151BiographyLeadEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:v24SyntaxApply(source,edits),edits};
    }
    function automaticBiographyLead(source,cfg={},bump=()=>{}) {
        const plan=v2151BiographyLeadPlan(source,cfg);
        for(const edit of plan.edits)for(const ruleId of edit.proof.changeRules)bump(ruleId);
        return plan.text;
    }
    function v2151BiographyLeadProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2151BiographyLeadPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v2151PreparationFields(raw) {
        const parts=v24SyntaxParts(raw.slice(2,-2));if(!parts)return null;const fields=[];
        for(const part of parts.slice(1)){
            const match=/^(\s*)([^=]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(!match||!/^\p{L}[\p{L}\p{N} _/()\-]*$/u.test(match[2].trim()))return null;
            const start=2+part.start+match[1].length+match[2].length+match[3].length;
            fields.push({key:match[2].trim(),value:match[4],start,end:start+match[4].length});
        }
        return fields;
    }
    function v2151PreparationDate(core,cfg={}) {
        if(!/^\{\{[^{}]*\}\}$/.test(core))return null;
        const rules=[],bump=rule=>rules.push(rule),noop=()=>{};
        let text=automaticParameters(core,cfg,bump),migration=multilingualTemplate(text,cfg,bump,noop);
        if(migration.handled&&migration.blocked)return null;text=migration.text;
        if(cfg.birthDates)text=birthDate(text,bump);
        if(cfg.obsoleteTemplates)text=obsoleteTemplate(text,bump,noop);
        text=automaticParameters(text,cfg,bump);
        const fact=v2151LeadDate(text);return fact?{source:core,text,rules,fact}:null;
    }
    function v2151PreparationEnabled(source,cfg={}) {
        let text=source;const edits=[];
        for(let round=0;round<3;round++){
            const before=text;
            for(const build of [v2151BiographyLeadPlan,v2151InfoboxOrderPlan,v2151FieldSyntaxPlan,v2151BiographyImageAltPlan]){
                const plan=build(text,cfg);if(!plan.edits.length)continue;
                edits.push(...plan.edits);text=plan.text;
            }
            if(text===before)break;
        }
        return {text,edits};
    }
    function v2151BiographyAliasConflict(fields,profile) {
        const contract=v2151LeadTransferContract(profile);if(!contract||!Array.isArray(fields))return false;
        const box={profile,fields};
        if(['birthDate','birthPlace','deathDate','deathPlace'].some(kind=>v2151LeadFactFields(box,kind).length>1))return true;
        const headers=new Set(['nome',...contract.headers].map(norm));
        for(const [key,target]of Object.entries({...profile.aliases,...profile.renames}))if(headers.has(norm(target)))headers.add(norm(key));
        return fields.filter(field=>headers.has(norm(field.key))).length>1;
    }
    function v2151NativeBiographySourceConflict(raw) {
        if(typeof raw!=='string'||raw.length>65536||!raw.startsWith('{{')||!raw.endsWith('}}'))return false;
        const profile=INFOBOX_CATALOG[parsedTemplate(raw).name];
        if(!profile||!v2151LeadTransferContract(profile)||!v215LiteralTemplateIdentity(raw,profile))return false;
        const fields=v2151PreparationFields(raw);return !!fields&&v2151BiographyAliasConflict(fields,profile);
    }
    function v2151BiographyPreparationPlan(source,cfg={}) {
        const empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.infoboxes===false||!v2151BiographyLeadScope({...cfg,automaticBiographyLead:true})||
            [cfg.automaticBiographyLead,cfg.automaticInfoboxOrder,cfg.automaticFieldSyntax,cfg.automaticInfoboxImages].every(value=>value===false))return empty;
        const head=v2151LeadHead(source);if(head===null)return empty;
        const box=v28PrincipalPersonBox(head,cfg),original=box&&v2151PreparationFields(box.sourceRaw);
        if(!box||!original||!v215LiteralTemplateIdentity(box.sourceRaw)||!v2151LeadTransferContract(box.profile))return empty;
        if(new Set(original.map(field=>field.key)).size!==original.length)return empty;
        // Check precedence before the old normalizer can fill an explicitly
        // empty native parameter from an imported alias.
        const imported=INFOBOX_CATALOG[parsedTemplate(box.sourceRaw).name]?null:translationProfile(box.sourceRaw),
            semantic=original.map(field=>({...field,key:imported?.fields?.[norm(field.key)]||field.key}));
        if(v2151BiographyAliasConflict(semantic,box.profile))return empty;
        const reviewed=v2151FieldSyntaxContract(box.profile);
        if(reviewed?.groups.some(group=>semantic.filter(field=>group.keys.has(field.key)).length>1))return empty;
        const fieldEdits=[],dateWitnesses=[],rules=[],projected=[];
        for(const field of original){
            const parts=v28DateValueParts(field.value),date=parts&&v2151PreparationDate(parts.core,cfg);
            const value=date&&date.text!==parts.core?field.value.slice(0,parts.start)+date.text+field.value.slice(parts.end):field.value;
            projected.push({...field,normalizedValue:value});
            if(value!==field.value){fieldEdits.push({start:field.start,end:field.end,text:value});rules.push(...date.rules);
                dateWitnesses.push({key:field.key,value:field.value,normalizedValue:value,core:parts.core,normalizedCore:date.text,identity:date.fact.identity});}
        }
        const childFirst=v24SyntaxApply(box.sourceRaw,fieldEdits),noop=()=>{},normalRules=[],bump=rule=>normalRules.push(rule);
        const profile=INFOBOX_CATALOG[parsedTemplate(childFirst).name],stabilized=profile?infobox(childFirst,bump,noop):childFirst,
            mechanical=automaticParameters(stabilized,cfg,bump),migration=multilingualTemplate(mechanical,cfg,bump,noop);
        if(migration.handled&&migration.blocked)return empty;
        const raw=automaticParameters(infobox(migration.text,bump,noop),cfg,bump);
        if(raw===box.sourceRaw||parsedTemplate(raw).name!==box.name||!v215LiteralTemplateIdentity(raw,box.profile))return empty;
        const native=v28LiteralInfoboxFields(raw,box.name);if(!native)return empty;
        const burial=fields=>fields.filter(field=>v2151FrozenBurialField(field.key)).map(field=>[field.key,field.value]);
        if(JSON.stringify(burial(original))!==JSON.stringify(burial(native)))return empty;
        const text=source.slice(0,box.node.start)+raw+source.slice(box.node.end),enabled=v2151PreparationEnabled(text,cfg);
        if(!enabled.edits.length)return empty;
        const sourceFacts=[];
        for(const fact of enabled.edits.flatMap(edit=>edit.proof?.copiedFacts||[])){
            const matches=projected.filter(field=>field.normalizedValue===fact.fieldValue);if(matches.length!==1)return empty;
            const field=matches[0],value=v2151LeadValue(field.value,source,true,false);if(!value)return empty;
            const normalized=v2151LeadValue(field.normalizedValue,text,true,false);if(!normalized||value.refs!==normalized.refs)return empty;
            const date=/Date$/.test(fact.kind),originalFact=date?(v2151LeadDate(value.core)||v2151PreparationDate(value.core,cfg)?.fact):v2151LeadPlace(value.core);
            if(!originalFact||originalFact.identity!==fact.identity||!date&&value.core!==normalized.core)return empty;
            sourceFacts.push({kind:fact.kind,originalKey:field.key,originalValue:field.value,originalStart:box.node.start+field.start,
                originalEnd:box.node.start+field.end,nativeKey:fact.key,nativeValue:fact.fieldValue,identity:fact.identity,referenceSuffix:value.refs});
        }
        const changeRules=[...rules,...normalRules];if(!changeRules.length)return empty;
        const edit={start:box.node.start,end:box.node.end,text:raw,ruleId:changeRules[0],proof:{scope:'biography-preparation',sourceHash:empty.sourceHash,
            template:box.name,oldid:box.profile.oldid,raw:box.sourceRaw,canonical:raw,changeRules,dateWitnesses,sourceFacts,
            condition:'one complete principal person box; existing child-date and template migration routines; exact reviewed native value roles; unique original field and unchanged individual references for each enabled copied fact; burial keys and values unchanged; preparation immediately enables a proved new repair'}};
        return {...empty,text,edits:[edit]};
    }
    function v2151BiographyPreparationProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2151BiographyPreparationPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

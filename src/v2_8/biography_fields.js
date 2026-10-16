    Object.assign(GROUP_LABELS,{biographyFields:'Campos da infocaixa corrigidos',biographyImages:'Imagem organizada na infocaixa',biographyParameterTypos:'Parâmetros da infocaixa corrigidos',biographyWebsiteLinks:'Link da infocaixa corrigido',biographyOccupationLists:'Lista de ocupações organizada',biographyHeaderBold:'Negrito redundante retirado do cabeçalho'});
    // These contracts follow the literal argument precedence in the pinned
    // native definitions. An accepted alias is never renamed for appearance.
    const V28_BIOGRAPHY_FIELD_BASE=Object.freeze({
        'info/biografia':{image:['imagem','foto'],size:['imagem tamanho','imagem_tamanho','imagemtamanho'],caption:['legenda','imagem_legenda','desc'],imageTarget:'imagem',sizeTarget:'imagem_tamanho',captionTarget:'imagem_legenda',occupation:['ocupação','ocupações','ocupacao','trabalho civil','Ocupação','outras_ocupações','profissão'],website:['website','site','url','sítio','site_oficial','homepage'],header:['nome']},
        'info/ator':{image:['imagem'],size:['imagem_tamanho','imagem-tamanho','tamanho_imagem'],caption:['descrição','legenda','imagem_legenda'],sizeTarget:'imagem_tamanho',captionTarget:'imagem_legenda',occupation:['ocupação'],website:['site_oficial'],header:[]},
        'info/música/artista':{image:['imagem'],size:['imagem-tamanho','imagem_tamanho'],caption:['legenda','imagem_legenda'],sizeTarget:'imagem_tamanho',captionTarget:'legenda',occupation:['ocupação'],website:['website','site','sítio'],header:['nome']},
        'info/militar':{image:['imagem'],size:['imagem_tamanho'],caption:['imagem_legenda','legenda'],sizeTarget:'imagem_tamanho',captionTarget:'imagem_legenda',occupation:[],website:['website'],header:['nome']},
        'info/político':{image:['imagem','foto','image'],size:['imagem-tamanho','imagem_tamanho','imagemtamanho','tamanho_imagem'],caption:['legenda','imagem_legenda'],sizeTarget:'imagem_tamanho',captionTarget:'legenda',occupation:['profissão','ocupação'],website:['website','homepage'],header:['nome']},
        'info/criminoso':{image:['imagem'],size:['imagem-tamanho','imagem_tamanho'],caption:['imagem_legenda','legenda'],sizeTarget:'imagem_tamanho',captionTarget:'imagem_legenda',occupation:['ocupação'],website:[],header:[]},
        'info/dublador':{image:['imagem'],size:['imagem_tamanho','imagem-tamanho'],caption:['descrição','legenda'],sizeTarget:'imagem_tamanho',captionTarget:'legenda',occupation:['ocupação'],website:[],header:[]},
        'info/modelo':{image:['imagem'],size:['imagem tamanho','imagem_tamanho'],caption:['legenda'],sizeTarget:'imagem_tamanho',captionTarget:'legenda',occupation:['ocupacao','ocupação'],website:['website','site','url','sítio','site_oficial','homepage'],header:['nome']},
        'info/artista marcial':{image:['imagem'],size:['tamanho imagem','img-tam'],caption:['legenda','img-des'],sizeTarget:'tamanho imagem',captionTarget:'legenda',occupation:['ocupação'],website:['url','website','página'],header:['nome']},
        'info/magistrado':{image:['imagem'],size:['largura','tamanho_imagem','imagem_tamanho'],caption:['legenda','imagem_legenda'],sizeTarget:'imagem_tamanho',captionTarget:'legenda',occupation:['ocupação','profissão'],website:[],header:['nome']},
        'info/ciclista':{image:[],size:[],caption:[],occupation:['ocupação','profissão'],website:['website'],header:['nome']}
    });
    const V28_BIOGRAPHY_FIELD_ALIASES=Object.freeze({
        'info/actor':'info/ator','info/atriz':'info/ator','info/cientista':'info/biografia','info/escritor':'info/biografia','info/autor':'info/biografia','info/jornalista':'info/biografia','info/senador do império do brasil':'info/biografia','info/cantor':'info/música/artista','info/artista musical':'info/música/artista','info/músico':'info/música/artista','info/combatente militar':'info/militar'
    });
    const V28_BIOGRAPHY_PARAMETER_TYPOS=Object.freeze({
        nacimento_data:'nascimento_data',nascimeto_data:'nascimento_data',nascimento_dta:'nascimento_data',nascimento_dada:'nascimento_data',data_nacimento:'data_nascimento',data_nascimeto:'data_nascimento',
        nascimento_lcoal:'nascimento_local',nacimento_local:'nascimento_local',local_nacimento:'local_nascimento',morte_lcoal:'morte_local',local_motre:'local_morte',motre_data:'morte_data',data_motre:'data_morte',
        nacionaldade:'nacionalidade',nacionadade:'nacionalidade',nacionlidade:'nacionalidade',nacionaliade:'nacionalidade',
        imagm:'imagem',iamgem:'imagem',imgaem:'imagem',imagem_legnda:'imagem_legenda',imgaem_legenda:'imagem_legenda',imagem_tamnho:'imagem_tamanho',imagem_tamaho:'imagem_tamanho',
        ocupaçao:'ocupação',ocupacão:'ocupação',ocuapção:'ocupação',profisao:'profissão',profisção:'profissão',webiste:'website',webstie:'website',site_ofical:'site_oficial'
    });
    function v28BiographyFieldContract(name) {
        const resolved=V28_BIOGRAPHY_FIELD_ALIASES[name]||name,contract=V28_BIOGRAPHY_FIELD_BASE[resolved];
        return contract?{...contract,base:resolved}:null;
    }
    function v28BiographySingleField(fields,keys) {
        const present=fields.filter(field=>keys.includes(field.key));
        return present.length===1?present[0]:null;
    }
    function v28BiographyEdgeValue(value,replacement) {return /^\s*/.exec(value)[0]+replacement+/\s*$/.exec(value)[0];}
    function v28BiographyWebsiteValue(value) {
        const parts=v28DateValueParts(value);if(!parts)return null;
        let core=parts.core,url,label=null,kind='bare';
        const wrong=/^\[\[(https?:\/\/[^\[\]{}<>\s|"']+)(?:\|([^\[\]{}<>\r\n]+))?\]\]$/i.exec(core),external=/^\[(https?:\/\/[^\[\]{}<>\s|"']+)(?:[ \t]+([^\[\]{}<>\r\n]+))?\]$/i.exec(core);
        if(wrong){url=wrong[1];label=wrong[2]===undefined?null:wrong[2];kind='wrong';}
        else if(external){url=external[1];label=external[2]===undefined?null:external[2];kind='external';}
        else if(/^https?:\/\/[^\[\]{}<>\s|"']+$/i.test(core))url=core;
        else return null;
        const scheme=/^(https?:\/\/)/i.exec(url)[1],prefix=scheme.toLowerCase();let fixed=url;
        while(fixed.toLowerCase().startsWith(prefix+prefix))fixed=fixed.slice(scheme.length);
        if(!/^https?:\/\/[^\s/:?#]+(?::\d{1,5})?(?:[/?#][^\s<>\[\]{}|"']*)?$/i.test(fixed))return null;
        if(/https?:\/\//i.test(fixed.slice(scheme.length).split(/[/?#]/)[0]))return null;
        try{const address=new URL(fixed);if(!['http:','https:'].includes(address.protocol)||!address.hostname||address.username||address.password)return null;}catch{return null;}
        if(label!==null&&(label!==label.trim()||label.includes('|')))return null;
        const next=kind==='wrong'||kind==='external'?'['+fixed+(label===null?'':' '+label)+']':fixed;
        return next===core?null:{start:parts.start,end:parts.end,text:next};
    }
    function v28BiographyOccupationValue(value) {
        const core=value.trim(),refMask=v24SyntaxMaskRanges(core,refTokens(core));
        if(value.length>2000||/[\r\n{}<>]/.test(refMask))return null;
        const view=occupationView(core),ranges=refTokens(view).map(ref=>({start:ref.start,end:ref.end}));
        for(const match of view.matchAll(/\[\[[^\r\n]*?\]\]/g))ranges.push({start:match.index,end:match.index+match[0].length});
        const cuts=[];for(const match of view.matchAll(/,/g))if(!inRange(match.index,ranges))cuts.push(match.index);
        if(!cuts.length||cuts.length>7)return null;
        const items=[];let at=0;
        for(const end of [...cuts,core.length]){const raw=core.slice(at,end),check=occupationLabelEdits(raw);if(!check||!check.exact||/^\s*\*/.test(raw))return null;items.push(raw.trim());at=end+1;}
        if(items.some(item=>!item))return null;
        return v28BiographyEdgeValue(value,items.join('<br />'));
    }
    function v28BiographyImageValue(value) {
        const leading=/^\s*/.exec(value)[0],trailing=/\s*$/.exec(value)[0],core=value.trim();
        if(!core.startsWith('[[')||!core.endsWith(']]')||core.length>5000)return null;
        const parts=v24SyntaxParts(core.slice(2,-2));if(!parts||parts.length<1)return null;
        const target=/^(?:Ficheiro|Imagem|Arquivo|File|Image):([^\[\]{}<>|\r\n]+)$/i.exec(parts[0].text.trim());
        if(!target||target[1]!==target[1].trim()||!/\.(?:jpe?g|png|gif|webp|svg|tiff?)$/i.test(target[1])||/[#:]/.test(target[1]))return null;
        let size=null,caption=null,frame=false;
        for(const part of parts.slice(1)){
            const raw=part.text,option=raw.trim();
            if(/^(?:thumb|thumbnail|miniatura|frameless|sem moldura)$/i.test(option)){if(frame)return null;frame=true;}
            else if(/^[1-9]\d{1,2}px$/.test(option)){if(size||+option.slice(0,-2)>500)return null;size=option;}
            else{
                if(caption!==null||raw!==raw.trim()||!raw||/^[\p{L}_][\p{L}\p{N}_ -]*\s*=|^(?:left|right|center|none|esquerda|direita|centro|border|borda|frame|framed|moldura|miniaturada|upright|vertical|baseline|sub|super|top|text-top|middle|bottom|text-bottom)\s*$|^\d*(?:x\d+)?px\s*$/iu.test(option))return null;
                const shield=v24SyntaxProtected(raw),refs=refTokens(raw),plain=v24SyntaxMaskRanges(raw,refs.map(ref=>({start:ref.start,end:ref.end})));
                const residual=v24SyntaxMaskRanges(plain,templates(plain).nodes.filter(node=>node.depth===0)).replace(/\[\[[^\[\]\r\n]+\]\]/g,'');
                if(shield.unclosed.length||/\[\[\s*(?:Ficheiro|Imagem|Arquivo|File|Image|Categoria)\s*:/i.test(plain)||/[|=]/.test(residual)||/[\r\n]/.test(raw))return null;
                caption=raw;
            }
        }
        return {filename:target[1],size,caption,leading,trailing};
    }
    function v28BiographyFieldPlan(raw,cfg={}) {
        const input=raw;raw=v273MarriageCanonical(input,cfg);
        const name=parsedTemplate(raw).name,profile=INFOBOX_CATALOG[name],contract=v28BiographyFieldContract(name),original=profile&&v28LiteralInfoboxFields(raw,name),edits=[],rules=[];
        const empty=()=>({source:input,sourceHash:v24SyntaxHash(input),template:name,text:input,edits:[],rules:[]});
        if(!contract||!original||cfg.infoboxes===false||cfg.markup===false||!raw.startsWith('{{')||!raw.endsWith('}}'))return empty();
        const fields=original.map(field=>({...field})),count=key=>fields.filter(field=>field.key===key).length;
        if(fields.some(field=>count(field.key)>1))return empty();
        const add=(edit,rule)=>{edits.push({...edit,ruleId:rule});if(!rules.includes(rule))rules.push(rule);};
        for(const field of fields){
            const target=V28_BIOGRAPHY_PARAMETER_TYPOS[field.key];
            if(!target||profileAccepts(profile,field.key)||!profileAccepts(profile,target)||fields.some(other=>other!==field&&(other.key===target||V28_BIOGRAPHY_PARAMETER_TYPOS[other.key]===target)))continue;
            const aliasGroups=[contract.image,contract.size,contract.caption,contract.occupation,contract.website,['nascimento_data','data_nascimento','nasceu','nascimento','datadenascimento','data de nascimento'],['nascimento_local','local_nascimento','nascimento_cidade','cidade natal','localnasc'],['morte_data','data_morte','data_falecimento','faleceu','falecimento','data de morte'],['morte_local','local_morte','local_falecimento','localfaleceu']];
            if(aliasGroups.some(keys=>keys.includes(target)&&fields.some(other=>other!==field&&keys.includes(other.key))))continue;
            add({start:field.keyStart,end:field.keyEnd,text:target},'biographyParameterTypos');field.key=target;
        }
        const additions=[],image=v28BiographySingleField(fields,contract.image);
        if(image&&profileAccepts(profile,image.key)&&!fields.some(field=>/^(?:landscape|imagem_pequena|nome_imagem|imagem2|imagem3|foto2|image2)$/.test(field.key)&&field.value.trim())){
            const parsed=v28BiographyImageValue(image.value),dest=(keys,target,value)=>{
                if(value===null)return true;const present=fields.filter(field=>keys.includes(field.key));
                if(present.some(field=>field.value.trim()&&field.value.trim()!==value))return false;
                const chosen=keys.map(key=>present.find(field=>field.key===key)).find(Boolean);
                if(chosen){if(!profileAccepts(profile,chosen.key))return false;if(!chosen.value.trim())add({start:chosen.start,end:chosen.end,text:v28BiographyEdgeValue(chosen.value,value)},'biographyImages');}
                else{if(!target||!profileAccepts(profile,target))return false;additions.push([target,value]);}
                return true;
            };
            if(parsed){
                const saved=edits.length,savedAdd=additions.length,savedRules=rules.slice();
                if(dest(contract.size,contract.sizeTarget,parsed.size)&&dest(contract.caption,contract.captionTarget,parsed.caption))add({start:image.start,end:image.end,text:parsed.leading+parsed.filename+parsed.trailing},'biographyImages');
                else{edits.splice(saved);additions.splice(savedAdd);rules.splice(0,rules.length,...savedRules);}
            }
        }
        for(const field of fields){
            if(!profileAccepts(profile,field.key))continue;
            if(contract.website.includes(field.key)){
                const next=v28BiographyWebsiteValue(field.value);if(next)add({start:field.start+next.start,end:field.start+next.end,text:next.text},'biographyWebsiteLinks');
            }
            if(cfg.occupationCase!==false&&contract.occupation.includes(field.key)){
                const aliases=contract.occupation.filter(key=>norm(key)===norm(field.key)||['ocupação','ocupações','ocupacao','trabalho civil','Ocupação'].includes(key)&&['ocupação','ocupações','ocupacao','trabalho civil','Ocupação'].includes(field.key));
                if(fields.filter(other=>aliases.includes(other.key)).length===1){const next=v28BiographyOccupationValue(field.value);if(next&&next!==field.value)add({start:field.start,end:field.end,text:next},'biographyOccupationLists');}
            }
            if(contract.header.includes(field.key)&&!fields.some(other=>/(?:estilo|style|classe|class)/i.test(other.key)&&other.value.trim())){
                const parts=v28DateValueParts(field.value),match=parts&&/^'''([^'\r\n{}<>]+)'''$/.exec(parts.core);
                if(match&&match[1]===match[1].trim()&&!/[\[\]]/.test(match[1]))add({start:field.start+parts.start,end:field.start+parts.end,text:match[1]},'biographyHeaderBold');
            }
        }
        if(additions.length){const newline=raw.includes('\r\n')?'\r\n':'\n',multiline=raw.includes('\n'),text=additions.map(([key,value])=>'|'+(multiline?' ':'')+key+(multiline?' = ':'=')+value+(multiline?newline:'')).join('');add({start:raw.length-2,end:raw.length-2,text},'biographyImages');}
        const sorted=edits.slice().sort((a,b)=>a.start-b.start||a.end-b.end);if(sorted.some((edit,index)=>index&&edit.start<sorted[index-1].end))return empty();
        if(!edits.length)return empty();
        return {source:input,sourceHash:v24SyntaxHash(input),canonical:raw,template:name,text:v24SyntaxApply(raw,edits),edits,rules};
    }
    function v28BiographyFieldProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v28BiographyFieldPlan(before,cfg);
        return fresh.text===after&&plan.text===after&&fresh.canonical===plan.canonical&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits)&&JSON.stringify(fresh.rules)===JSON.stringify(plan.rules);
    }
    function v28BiographyFieldEdits(source,cfg={}) {
        if(!V28_BIOGRAPHY_FIELD_TRIGGER.test(source))return [];
        const box=v28PrincipalPersonBox(source,cfg);if(!box)return [];const plan=v28BiographyFieldPlan(box.sourceRaw||box.raw,cfg);if(!plan.edits.length)return [];
        return [{start:box.node.start,end:box.node.end,text:plan.text,ruleId:'biographyFields',proof:{sourceHash:v24SyntaxHash(source),template:box.name,raw:box.sourceRaw||box.raw,canonical:plan.canonical,rules:plan.rules,edits:plan.edits,changeRules:plan.edits.map(edit=>edit.ruleId),condition:'one complete principal person infobox; pinned native field contracts and approved existing alias migration only when a field repair is confirmed; explicit values and reference bodies retained; conflicting or ambiguous fields unchanged'}}];
    }
    const V28_BIOGRAPHY_FIELD_TRIGGER=new RegExp('\\|\\s*(?:'+Object.keys(V28_BIOGRAPHY_PARAMETER_TYPOS).join('|')+')\\s*=|\\|\\s*(?:imagem|foto|image)\\s*=\\s*\\[\\[(?:Ficheiro|Imagem|Arquivo|File|Image):|\\|\\s*(?:website|site|url|sítio|site_oficial|homepage|página)\\s*=\\s*(?:\\[\\[https?:\\/\\/|\\[?https?:\\/\\/https?:\\/\\/)|\\|\\s*(?:ocupação|ocupações|ocupacao|occupation|trabalho civil|outras_ocupações|profissão|profession)\\s*=[^\\n]*,|\\|\\s*(?:nome|name)\\s*=\\s*\'\'\'','i');

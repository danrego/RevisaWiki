    // The native Info/Biografia contract passes its `alt` argument directly to
    // InfoboxImage. Other person boxes are not assumed to share that contract.
    // Definition: https://pt.wikipedia.org/w/index.php?oldid=72993800
    const V2151_IMAGE_ALT_NAMES=new Set(['info/biografia','info/autor','info/cientista','info/escritor','info/jornalista']);
    function v2151BiographyImageAltValue(value) {
        if(typeof value!=='string')return null;
        const leading=/^\s*/.exec(value)[0],trailing=/\s*$/.exec(value)[0],core=value.trim();
        if(!core.startsWith('[[')||!core.endsWith(']]')||core.length>5000)return null;
        const parts=v24SyntaxParts(core.slice(2,-2));if(!parts)return null;
        const target=/^(?:Ficheiro|Imagem|Arquivo|File|Image):([^\[\]{}<>|\r\n]+)$/i.exec(parts[0].text.trim());
        if(!target||target[1]!==target[1].trim()||!/\.(?:jpe?g|png|gif|webp|svg|tiff?)$/i.test(target[1])||/[#:]/.test(target[1]))return null;
        let size=null,caption=null,alt=null,frame=false;
        for(const part of parts.slice(1)){
            const raw=part.text,option=raw.trim();
            if(/^(?:thumb|thumbnail|miniatura|frameless|sem moldura)$/i.test(option)){if(frame)return null;frame=true;continue;}
            if(/^[1-9]\d{1,2}px$/.test(option)){if(size||+option.slice(0,-2)>500)return null;size=option;continue;}
            const alternative=/^alt=([^\r\n]*)$/.exec(raw);
            if(alternative){
                if(alt!==null)return null;
                alt=alternative[1];
                if(/<!--|\{\{\{|\[\[\s*(?:Ficheiro|Imagem|Arquivo|File|Image|Categoria)\s*:/i.test(alt)||v24SyntaxScan(alt).issues.length)return null;
                continue;
            }
            if(caption!==null||raw!==raw.trim()||!raw||/^[\p{L}_][\p{L}\p{N}_ -]*\s*=|^(?:left|right|center|none|esquerda|direita|centro|border|borda|frame|framed|moldura|miniaturada|upright|vertical|baseline|sub|super|top|text-top|middle|bottom|text-bottom)\s*$|^\d*(?:x\d+)?px\s*$/iu.test(option))return null;
            const shield=v24SyntaxProtected(raw),refs=refTokens(raw),plain=v24SyntaxMaskRanges(raw,refs.map(ref=>({start:ref.start,end:ref.end}))),
                residual=v24SyntaxMaskRanges(plain,templates(plain).nodes.filter(node=>node.depth===0)).replace(/\[\[[^\[\]\r\n]+\]\]/g,'');
            if(shield.unclosed.length||v24SyntaxScan(raw).issues.length||/<!--|\{\{\{|\[\[\s*(?:Ficheiro|Imagem|Arquivo|File|Image|Categoria)\s*:/i.test(plain)||/[|=]/.test(residual)||/[\r\n]/.test(raw))return null;
            caption=raw;
        }
        // An empty native `alt` field omits the HTML attribute, while an
        // explicit file option alt= emits alt="". Keep that distinction.
        return alt===null||!alt.trim()||alt!==alt.trim()?null:{filename:target[1],size,caption,alt,leading,trailing};
    }
    function v2151BiographyImageAltPlan(source,cfg={}) {
        const plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.automaticInfoboxImages===false||cfg.infoboxes===false||cfg.markup===false||
            cfg.discussionPage||cfg.redirectPage||cfg.disambiguationPage||!/\[\[(?:Ficheiro|Imagem|Arquivo|File|Image):[^\r\n]*\|alt=/i.test(source))return plan;
        const box=v28PrincipalPersonBox(source,cfg);if(!box||box.raw!==box.sourceRaw||!v215LiteralTemplateIdentity(box.raw,box.profile))return plan;
        const contract=v28BiographyFieldContract(box.name),fields=v28LiteralInfoboxFields(box.raw,box.name);
        if(!contract||!V2151_IMAGE_ALT_NAMES.has(box.name)||contract.base!=='info/biografia'||box.profile.oldid!==72993800||
            !box.profile.dependencies?.some(item=>item.title==='Módulo:InfoboxImage'&&item.oldid===72932632)||!fields||new Set(fields.map(field=>field.key)).size!==fields.length||
            !profileAccepts(box.profile,'alt')||fields.some(field=>/^(?:landscape|imagem_pequena|nome_imagem|imagem2|imagem3|foto2|image2)$/.test(field.key)&&field.value.trim()))return plan;
        const image=v28BiographySingleField(fields,contract.image);if(!image||!profileAccepts(box.profile,image.key))return plan;
        const parsed=v2151BiographyImageAltValue(image.value);if(!parsed)return plan;
        const changes=[],additions=[],dest=(keys,target,value)=>{
            if(value===null)return true;
            const present=fields.filter(field=>keys.includes(field.key));if(present.length>1)return false;
            if(present.length){
                const field=present[0];if(!profileAccepts(box.profile,field.key))return false;
                if(field.value.trim()){if(field.value.trim()!==value||refTokens(value).length)return false;}
                else if(value!==''){
                    const split=/^[ \t]*/.exec(field.value)[0].length;
                    changes.push({start:field.start+split,end:field.start+split,text:value});
                }
            }else{if(!target||!profileAccepts(box.profile,target))return false;additions.push([target,value]);}
            return true;
        };
        if(!dest(['alt'],'alt',parsed.alt)||!dest(contract.size,contract.sizeTarget,parsed.size)||!dest(contract.caption,contract.captionTarget,parsed.caption))return plan;
        changes.push({start:image.start,end:image.end,text:parsed.leading+parsed.filename+parsed.trailing});
        const changedFields=changes.length+additions.length;
        if(additions.length){
            const newline=box.raw.includes('\r\n')?'\r\n':'\n',multiline=box.raw.includes('\n'),text=additions.map(([key,value])=>'|'+(multiline?' ':'')+key+(multiline?' = ':'=')+value+(multiline?newline:'')).join('');
            changes.push({start:box.raw.length-2,end:box.raw.length-2,text});
        }
        const sorted=changes.slice().sort((a,b)=>a.start-b.start||a.end-b.end);if(sorted.some((edit,index)=>index&&edit.start<sorted[index-1].end))return plan;
        const raw=v24SyntaxApply(box.raw,changes),changeRules=Array(changedFields).fill('biographyImageAlt');
        const edit={start:box.node.start,end:box.node.end,text:raw,ruleId:'biographyImageAlt',proof:{sourceHash:plan.sourceHash,template:box.name,raw:box.raw,parsed,edits:changes,changeRules,
            conditions:['one complete native principal person infobox','pinned native ALT destination','all source and destination fields accepted',
                'one explicit ALT option and finite understood image options','no existing field conflict','literal filename caption ALT and reference contents preserved']}};
        return {...plan,text:v24SyntaxApply(source,[edit]),edits:[edit]};
    }
    function automaticBiographyImageAlt(source,cfg={},bump=()=>{}) {
        const plan=v2151BiographyImageAltPlan(source,cfg);for(const edit of plan.edits)for(const rule of edit.proof.changeRules)bump(rule);return plan.text;
    }
    function v2151BiographyImageAltProof(source,result,plan,cfg={}) {
        if(!plan||plan.source!==source||plan.sourceHash!==v24SyntaxHash(source)||plan.text!==result)return false;
        const fresh=v2151BiographyImageAltPlan(source,cfg);
        return fresh.text===result&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

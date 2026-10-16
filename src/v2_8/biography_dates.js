    Object.assign(GROUP_LABELS,{biographyDates:'Datas e idade corrigidas na infocaixa'});
    const V28_DATE_FIELDS=Object.freeze({"info/actor":{"birth":["data_nascimento","nascimento_data"],"death":["data_falecimento","morte_data"]},"info/artista marcial":{"birth":["data de nascimento","nascimento_data"],"death":["data de morte","morte_data"]},"info/artista musical":{"birth":["nascimento","nascimento_data"],"death":["falecimento","morte","morte_data"]},"info/ator":{"birth":["data_nascimento","nascimento_data"],"death":["data_falecimento","morte_data"]},"info/atriz":{"birth":["data_nascimento","nascimento_data"],"death":["data_falecimento","morte_data"]},"info/autor":{"birth":["data_nascimento","nasceu","nascimento","nascimento_data"],"death":["data_falecimento","data_morte","faleceu","falecimento","morte_data"]},"info/biografia":{"birth":["data_nascimento","nasceu","nascimento","nascimento_data"],"death":["data_falecimento","data_morte","faleceu","falecimento","morte_data"]},"info/cantor":{"birth":["nascimento","nascimento_data"],"death":["falecimento","morte","morte_data"]},"info/ciclista":{"birth":["data_nascimento","datadenascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/cientista":{"birth":["data_nascimento","nasceu","nascimento","nascimento_data"],"death":["data_falecimento","data_morte","faleceu","falecimento","morte_data"]},"info/combatente militar":{"birth":["nascimento","nascimento_data"],"death":["data_morte","falecimento","morte_data"]},"info/comediante":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/criminoso":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/dublador":{"birth":["data_nascimento","nascimento_data"],"death":["data_falecimento","morte_data"]},"info/escritor":{"birth":["data_nascimento","nasceu","nascimento","nascimento_data"],"death":["data_falecimento","data_morte","faleceu","falecimento","morte_data"]},"info/gastrônomo":{"birth":["nascimento"],"death":["morte"]},"info/jornalista":{"birth":["data_nascimento","nasceu","nascimento","nascimento_data"],"death":["data_falecimento","data_morte","faleceu","falecimento","morte_data"]},"info/lutador de wrestling profissional":{"birth":["data de nascimento","nascimento_data"],"death":["morte_data"]},"info/magistrado":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/militar":{"birth":["nascimento","nascimento_data"],"death":["data_morte","falecimento","morte_data"]},"info/modelo":{"birth":["data_nascimento","nasceu","nascimento","nascimento_data"],"death":["data_falecimento","data_morte","faleceu","falecimento","morte_data"]},"info/motorista da f1":{"birth":["nascimento_data"],"death":["morte_data"]},"info/música/artista":{"birth":["nascimento","nascimento_data"],"death":["falecimento","morte","morte_data"]},"info/músico":{"birth":["nascimento","nascimento_data"],"death":["falecimento","morte","morte_data"]},"info/personalidade":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/piloto de automóvel":{"birth":["nascimento","nascimento_data"],"death":["falecimento","morte_data"]},"info/político":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/senador do império do brasil":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/titular de cargo":{"birth":["data_nascimento","nascimento_data"],"death":["data_morte","morte_data"]},"info/wrestler":{"birth":["data de nascimento","nascimento_data"],"death":["morte_data"]}});
    function v28LiteralInfoboxFields(raw,name) {
        const profile=INFOBOX_CATALOG[name],parts=v24SyntaxParts(raw.slice(2,-2));if(!profile||!parts)return null;
        const fields=[];
        for(const part of parts.slice(1)){
            const match=/^(\s*)([^=]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(!match||!/^\p{L}[\p{L}\p{N} _/()\-]*$/u.test(match[2].trim()))return null;
            const leading=/^\s*/.exec(match[2])[0].length,keyStart=2+part.start+match[1].length+leading,keyEnd=keyStart+match[2].trim().length,start=2+part.start+match[1].length+match[2].length+match[3].length;
            fields.push({key:match[2].trim(),value:match[4],keyStart,keyEnd,start,end:start+match[4].length});
        }
        return fields;
    }
    const V28_PERSON_NATIVE_NAMES=new Set([...BIOGRAPHY_INFOBOXES,...BIOGRAPHY_MUSIC_BOXES,...Object.keys(V273_MARRIAGE_PROFILES)]);
    const V28_PERSON_SOURCE_NAMES=new Set([...V28_PERSON_NATIVE_NAMES,...Object.entries(TRANSLATION_RULES.profiles).filter(([,profile])=>profile.kind==='infobox'&&V28_PERSON_NATIVE_NAMES.has(nameOf(profile.target))).flatMap(([name])=>[name,name.replace(TRANSLATION_PREFIX,'')])].map(norm));
    function v28PotentialPersonSource(source) {for(const match of source.matchAll(/\{\{([^|{}]*)/g))if(V28_PERSON_SOURCE_NAMES.has(nameOf(match[1])))return true;return false;}
    function v28DateFieldMarker(kind) {
        const keys=new Set(Object.values(V28_DATE_FIELDS).flatMap(profile=>profile[kind])),targets=new Set([...keys].map(norm));
        for(const name of V28_PERSON_NATIVE_NAMES)for(const [key,target]of Object.entries(INFOBOX_CATALOG[name]?.renames||{}))if(targets.has(norm(target)))keys.add(key);
        for(const profile of Object.values(TRANSLATION_RULES.profiles))if(profile.kind==='infobox'&&V28_PERSON_NATIVE_NAMES.has(nameOf(profile.target)))for(const [key,target]of Object.entries(profile.fields||{}))if(targets.has(norm(target)))keys.add(key);
        const escaped=[...keys].map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/[ _]+/g,'[\\s_]+'));
        return new RegExp('\\|\\s*(?:'+escaped.join('|')+')\\s*=','iu');
    }
    const V28_DATE_BIRTH_MARKER=v28DateFieldMarker('birth'),V28_DATE_DEATH_MARKER=v28DateFieldMarker('death');
    function v28PrincipalPersonBox(source,cfg={}) {
        if(!v28PotentialPersonSource(source))return null;
        if(cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.markup===false||cfg.pageRedirect||cfg.pageDisambiguation||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||!v24SyntaxScope(cfg)||/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))||/~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length)return null;
        const context=v27SafeContext(source,cfg);if(!context)return null;
        const nodes=biographyNodes(context.view).nodes,boxes=nodes.filter(node=>v273MarriageBoxName(parsedTemplate(source.slice(node.start,node.end)).name));if(boxes.length!==1)return null;
        const node=boxes[0],sourceRaw=source.slice(node.start,node.end),raw=v273MarriageCanonical(sourceRaw,cfg),name=parsedTemplate(raw).name,profile=INFOBOX_CATALOG[name],fields=v28LiteralInfoboxFields(raw,name);if(!profile||!fields)return null;
        const firstSection=context.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),lineEnd=source.indexOf('\n',node.end);
        if(firstSection>=0&&node.start>=firstSection||source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start).trim()||source.slice(node.end,lineEnd<0?source.length:lineEnd).trim()||context.shield.ranges.some(range=>range.start<=node.start&&node.start<range.end)||v273MarriagePotentialInfobox(source.slice(0,node.start))||v273MarriagePotentialInfobox(source.slice(node.end)))return null;
        if(fields.some(field=>['embed','child','embutido','subcaixa','nested'].includes(norm(field.key))&&field.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(field.value.trim())))return null;
        const music=BIOGRAPHY_MUSIC_BOXES.has(name)||V273_MARRIAGE_MUSIC.has(name),person=BIOGRAPHY_INFOBOXES.has(name)||!music&&Object.hasOwn(V273_MARRIAGE_PROFILES,name);
        if(!person&&!music)return null;
        if(music){const types=fields.filter(field=>norm(field.key)==='fundo');if(types.length!==1||!BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))||fields.some(field=>['integrantes','exintegrantes'].includes(norm(field.key))&&field.value.trim()))return null;}
        return {context,node,sourceRaw,originalRaw:sourceRaw,raw,name,profile,fields};
    }
    function v28DateValueParts(value) {
        const leading=/^\s*/.exec(value)[0].length,refs=refTokens(value),first=refs.length?refs[0].start:value.length;
        if(refs.length){let at=first;for(const ref of refs){if(value.slice(at,ref.start).trim())return null;at=ref.end;}if(value.slice(at).trim())return null;}
        const core=value.slice(leading,first).trimEnd();if(!core||/[\r\n<>]/.test(core))return null;
        return {core,start:leading,end:leading+core.length};
    }
    function v28DateNumbers(value) {
        const iso=/^([1-9]\d{3})-(\d{2})-(\d{2})$/.exec(value),pt=/^([1-9]\d?) de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de ([1-9]\d{3})$/.exec(value);
        if(!iso&&!pt)return null;
        const numbers=iso?[+iso[3],+iso[2],+iso[1]]:[+pt[1],MONTH_PT.indexOf(pt[2]),+pt[3]];
        return validDate(...numbers)?numbers:null;
    }
    function v28DateTemplate(value,name) {
        if(!/^\{\{[^{}]*\}\}$/.test(value))return null;const parsed=parsedTemplate(value);
        if(parsed.name!==name)return null;const fields=new Map();let position=1;
        for(const part of parsed.parts.slice(1)){
            const named=/^\s*([1-6])\s*=\s*(.*?)\s*$/.exec(part),key=named?named[1]:String(position++),raw=named?named[2]:part.trim();
            if(fields.has(key)||!['1','2','3','4','5','6'].includes(key)||!/^\d+$/.test(raw)&&!(name==='dni'&&key==='4'&&['si','sem idade'].includes(norm(raw))))return null;
            fields.set(key,raw);
        }
        const numbers=['1','2','3'].map(key=>fields.has(key)?+fields.get(key):NaN);
        if(!validDate(...numbers)||numbers[2]<1000)return null;
        if(name==='dni'&&(fields.size>4||fields.has('4')&&!['si','sem idade'].includes(norm(fields.get('4')))))return null;
        if(name==='morte'&&![3,6].includes(fields.size))return null;
        if(name==='morte'&&fields.size===6&&!validDate(...['4','5','6'].map(key=>fields.has(key)?+fields.get(key):NaN)))return null;
        return {numbers,fields,parsed};
    }
    function v28BiographyDateBoxPlan(box,cfg={}) {
        const contract=V28_DATE_FIELDS[box.name];if(!contract)return null;
        const birthKeys=new Set(contract.birth.map(norm)),deathKeys=new Set(contract.death.map(norm)),births=box.fields.filter(field=>birthKeys.has(norm(field.key))),deaths=box.fields.filter(field=>deathKeys.has(norm(field.key)));
        if(births.length!==1||deaths.length!==1||![births[0],deaths[0]].every(field=>profileAccepts(box.profile,field.key)))return null;
        if(box.fields.some(field=>/calend[aá]rio|calendar/i.test(field.key)&&field.value.trim())||/\b(?:julian[oa]|gregorian[oa]|estilo antigo|estilo novo|a\.\s*c\.)\b/iu.test(births[0].value+' '+deaths[0].value))return null;
        const birth=v28DateValueParts(births[0].value),death=v28DateValueParts(deaths[0].value);if(!birth||!death)return null;
        const normalize=core=>core.startsWith('{{')?mapTemplateTree(core,raw=>birthDate(cfg.obsoleteTemplates?obsoleteTemplate(raw,()=>{},()=>{}):raw,()=>{})):core,normalizedBirth=normalize(birth.core),normalizedDeath=normalize(death.core),bornTemplate=v28DateTemplate(normalizedBirth,'dni'),diedTemplate=v28DateTemplate(normalizedDeath,'morte'),born=bornTemplate?bornTemplate.numbers:v28DateNumbers(normalizedBirth),died=diedTemplate?diedTemplate.numbers:v28DateNumbers(normalizedDeath);
        if(!born||!died)return null;
        if(diedTemplate&&diedTemplate.fields.size===6&&['4','5','6'].some((key,index)=>+diedTemplate.fields.get(key)!==born[index]))return null;
        const stamp=numbers=>numbers[2]*10000+numbers[1]*100+numbers[0],today=new Date(),now=today.getUTCFullYear()*10000+(today.getUTCMonth()+1)*100+today.getUTCDate();
        if(stamp(died)<stamp(born)||stamp(died)>now||died[2]-born[2]>125)return null;
        const edits=[];
        if(bornTemplate&&!bornTemplate.fields.has('4')){
            const named=bornTemplate.parsed.parts.slice(1).some(part=>/^\s*[1-6]\s*=/.test(part));
            edits.push({start:births[0].start+birth.start,end:births[0].start+birth.end,text:normalizedBirth.slice(0,-2)+(named?'|4=si}}':'|si}}')});
        }
        if(!diedTemplate)edits.push({start:deaths[0].start+death.start,end:deaths[0].start+death.end,text:'{{Morte|'+died.concat(born).join('|')+'}}'});
        else if(diedTemplate.fields.size===3){
            const named=diedTemplate.parsed.parts.slice(1).some(part=>/^\s*[1-6]\s*=/.test(part)),suffix=named?born.map((number,index)=>'|'+(index+4)+'='+number).join(''):'|'+born.join('|');
            edits.push({start:deaths[0].start+death.start,end:deaths[0].start+death.end,text:normalizedDeath.slice(0,-2)+suffix+'}}'});
        }
        if(!edits.length)return null;
        return {text:v24SyntaxApply(box.raw,edits),edits,born,died,birthKey:births[0].key,deathKey:deaths[0].key};
    }
    function v28BiographyDateEdits(source,cfg={}) {
        if(!V28_DATE_BIRTH_MARKER.test(source)||!V28_DATE_DEATH_MARKER.test(source))return [];
        if(cfg.birthDates===false||cfg.livingCategoryConfirmed===true||/\[\[\s*Categoria\s*:\s*Pessoas vivas\s*(?:\|[^\]]*)?\]\]/i.test(protectedView(source)))return [];
        const box=v28PrincipalPersonBox(source,cfg);if(!box)return [];const plan=v28BiographyDateBoxPlan(box,cfg);if(!plan)return [];
        return [{start:box.node.start,end:box.node.end,text:plan.text,ruleId:'biographyDates',proof:{sourceHash:v24SyntaxHash(source),template:box.name,raw:box.sourceRaw,canonical:box.raw,born:plan.born,died:plan.died,birthKey:plan.birthKey,deathKey:plan.deathKey,edits:plan.edits,changeRules:plan.edits.map(()=> 'biographyDates'),condition:'one complete principal person infobox; approved existing native field normalization or foreign migration only; unique accepted full birth/death fields; calendar-valid nonfuture dates; no living-category conflict; only explicit dates used'}}];
    }
    function v28BiographyDatePlan(source,cfg={}) {const edits=v28BiographyDateEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};}
    function v28BiographyDateProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v28BiographyDatePlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}

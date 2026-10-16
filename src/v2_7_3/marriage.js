    Object.assign(GROUP_LABELS,{marriageInfoboxes:'Casamento formatado na infocaixa'});
    const V273_MARRIAGE_PROFILES=Object.freeze(Object.fromEntries([
        'biografia','cientista','escritor','autor','jornalista','ator','atriz','actor','dublador','comediante',
        'astronauta','modelo','político','titular de cargo','personalidade','combatente militar','militar',
        'senador do império do brasil','ciclista','artista marcial','piloto de automóvel','piloto de corrida',
        'motorista da f1','motociclista','lutador de wrestling profissional','wrestler','criminoso','gastrônomo','magistrado',
        'música/artista','artista musical','cantor','músico'
    ].map(name=>['info/'+name,Object.freeze(['conjuge','cônjuge',...(['wrestler','lutador de wrestling profissional'].includes(name)?['spouse']:[])].filter(key=>INFOBOX_CATALOG['info/'+name]&&profileAccepts(INFOBOX_CATALOG['info/'+name],key)))])));
    const V273_MARRIAGE_MUSIC=new Set(['info/música/artista','info/artista musical','info/cantor','info/músico']);
    const V273_MARRIAGE_BOX_NAMES=new Set([...Object.keys(INFOBOX_CATALOG),...Object.entries(TRANSLATION_RULES.profiles).filter(([,profile])=>profile.kind==='infobox').flatMap(([name])=>[name,name.replace(TRANSLATION_PREFIX,'')])].map(norm));
    function v273MarriageBoxName(name) {
        return /^(?:info\s*\/|infobox\b)/.test(norm(name))||V273_MARRIAGE_BOX_NAMES.has(norm(name));
    }
    function v273MarriageCanonical(raw,cfg) {
        const noop=()=>{},stabilized=INFOBOX_CATALOG[parsedTemplate(raw).name]?infobox(raw,noop,noop):raw,mechanical=automaticParameters(stabilized,cfg,noop),migration=migrateForeignTemplate(mechanical,cfg);
        const eligible=migration&&!migration.blocked&&migration.profile.kind==='infobox'&&Object.hasOwn(V273_MARRIAGE_PROFILES,parsedTemplate(migration.text).name);
        return automaticParameters(infobox(eligible?migration.text:mechanical,noop,noop),cfg,noop);
    }
    function v273MarriageDate(value) {
        const year=/^[1-9]\d{3}$/.exec(value);if(year)return {literal:value,min:+value*10000+101,max:+value*10000+1231};
        const iso=/^([1-9]\d{3})-(\d{2})-(\d{2})$/.exec(value),pt=/^([1-9]\d?) de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de ([1-9]\d{3})$/.exec(value);
        if(!iso&&!pt)return null;const y=+(iso?iso[1]:pt[3]),m=iso?+iso[2]:MONTH_PT.indexOf(pt[2]),d=+(iso?iso[3]:pt[1]);
        if(!validDate(d,m,y))return null;const stamp=y*10000+m*100+d;return {literal:value,min:stamp,max:stamp};
    }
    function v273MarriageName(value) {
        if(!value||value.length>240||/[{}<>\r\n=&:;#/*]/.test(value)||/''/.test(value))return false;
        if(/(?:^| )(?:e|ou|com|and|or|et|und|oder|y|o|en|och|og|ve)(?: |$)/iu.test(value))return false;
        let label=value;
        if(value.startsWith('[[')){
            const link=/^\[\[([^\[\]|]+)(?:\|([^\[\]|]+))?\]\]$/.exec(value);if(!link||link[1]!==link[1].trim())return false;
            label=link[2]===undefined?link[1].replace(/ \([^()]+\)$/,''):link[2];
        }else if(/[\[\]|()]/.test(value))return false;
        return label===label.trim()&&/^[\p{L}\p{M}][\p{L}\p{M} .'’\-]*$/u.test(label)&&
            !/\b(?:casad[oa]s?|divorciad[oa]s?|separad[oa]s?|solteir[oa]s?|viúv[oa]s?|desconhecid[oa]|nenhum|nenhuma|não|ex)\b/iu.test(label);
    }
    function v273MarriageValue(value) {
        const lead=/^\s*/.exec(value)[0].length,refs=refTokens(value),first=refs.length?refs[0].start:value.length;
        if(refs.length){let at=first;for(const ref of refs){if(value.slice(at,ref.start).trim())return null;at=ref.end;}if(value.slice(at).trim())return null;}
        const core=value.slice(lead,first).trimEnd();if(/[\r\n]/.test(core))return null;
        const match=/^(.+?) \((casado|casada|casados) (.+)\)$/i.exec(core);if(!match||!v273MarriageName(match[1]))return null;
        const word=match[2].toLocaleLowerCase('pt'),type={casado:'h',casada:'m',casados:'c'}[word],tail=match[3],pieces=tail.split(/\s*[;,]\s*/);let start,end=null,status=null;
        if(pieces.length===1){
            const opened=/^em (.+)$/.exec(tail),range=/^de (.+) a (.+)$/.exec(tail)||/^entre (.+) e (.+)$/.exec(tail);
            if(opened)start=v273MarriageDate(opened[1]);else if(range){start=v273MarriageDate(range[1]);end=v273MarriageDate(range[2]);if(!end)return null;}else return null;
        }else if(pieces.length===2){
            const opened=/^em (.+)$/.exec(pieces[0]),closed=/^(divorciado|divorciada|divorciados|separado|separada|separados|viúvo|viúva) em (.+)$/.exec(pieces[1]);
            if(!opened||!closed)return null;const agreement={casado:['divorciado','separado','viúvo'],casada:['divorciada','separada','viúva'],casados:['divorciados','separados']};
            if(!agreement[word].includes(closed[1]))return null;start=v273MarriageDate(opened[1]);end=v273MarriageDate(closed[2]);status=closed[1];if(!end)return null;
        }else return null;
        if(!start||end&&start.min>end.max)return null;
        const replacement='{{casamento|tipo='+type+'|()=pequeno|'+match[1]+'|'+start.literal+(end?'|'+end.literal:'')+(status?'|fim='+status:'')+'}}';
        return {start:lead,end:lead+core.length,text:replacement,name:match[1],type,from:start.literal,to:end?end.literal:null,status,original:core};
    }
    function v273MarriageFields(raw,template) {
        const profile=INFOBOX_CATALOG[template],allowed=V273_MARRIAGE_PROFILES[template],parts=v24SyntaxParts(raw.slice(2,-2));if(!profile||!allowed||!parts)return null;
        const fields=[];for(const part of parts.slice(1)){
            const m=/^(\s*)([^=]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);if(!m||!/^\p{L}[\p{L}\d _/()-]*$/u.test(m[2].trim()))return null;
            fields.push({key:m[2].trim(),value:m[4],start:2+part.start+m[1].length+m[2].length+m[3].length});
        }
        if(fields.some(f=>['embed','child','embutido','subcaixa'].includes(norm(f.key))&&f.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(f.value.trim())))return null;
        if(fields.some(f=>/(?:(?:cônjuge|conjuge|spouse|conjoint|cónyuge).*(?:tipo|type|título|titulo|title|label|rótulo|rotulo|libellé|etiqueta)|(?:tipo|type|título|titulo|title|label|rótulo|rotulo|libellé|etiqueta).*(?:cônjuge|conjuge|spouse|conjoint|cónyuge))/.test(norm(f.key))&&f.value.trim()))return null;
        if(V273_MARRIAGE_MUSIC.has(template)){
            const types=fields.filter(f=>f.key==='fundo');if(types.length!==1||!BIOGRAPHY_SOLO_TYPES.has(norm(types[0].value))||fields.some(f=>['integrantes','exintegrantes'].includes(norm(f.key))&&f.value.trim()))return null;
        }
        const spouses=fields.filter(f=>/^(?:conjuge|cônjuge|spouse|spouses|conjoint|cónyuge|esposa|esposo|marido|cônjuges|conjuges)(?:[ _-]*\d+)?$/.test(norm(f.key)));
        if(spouses.length!==1||!allowed.includes(spouses[0].key)||!profileAccepts(profile,spouses[0].key))return null;
        return {fields,spouse:spouses[0]};
    }
    function v273MarriagePotentialInfobox(source) {
        // An opaque suffix cannot establish which namespace or modifier was
        // intended. Decline if any literal opening can denote another box.
        for(const match of source.matchAll(/\{\{([^|{}]*)/g)){
            if(/[<>&\p{Cf}]/u.test(match[1]))return true;
            const names=match[1].replace(/_/g,' ').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt').split(':');
            if(names.some(v273MarriageBoxName))return true;
        }
        return false;
    }
    function v273MarriageEdits(source,cfg={}) {
        if(!/\bcasad[oa]s?\b/iu.test(source)||cfg.namespaceNumber!==0||cfg.infoboxes===false||cfg.markup===false||cfg.pageRedirect||cfg.pageDisambiguation||!v24SyntaxScope(cfg)||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||''))||/~{3,5}/.test(source)||discussionProtectionRanges(source,{discussionPage:true}).length)return [];
        let context=v27SafeContext(source,cfg),prefixEnd=source.length,contextEnd=source.length,confirmedBox=null;
        if(!context&&cfg.partialSyntaxRecovery!==false){
            const existing=syntaxRepairPlan(source,cfg),end=existing.safePrefixEnd;
            if(!existing.unresolved.length||end<=0||end>=source.length||v273MarriagePotentialInfobox(source.slice(end)))return [];
            // Only original-source offsets are used. No repaired prefix or
            // opaque tail becomes evidence for a relationship conversion.
            const exposed=biographyNodes(source).nodes.filter(n=>v273MarriageBoxName(parsedTemplate(source.slice(n.start,n.end)).name));
            if(exposed.length!==1||exposed[0].end>end)return [];
            confirmedBox=exposed[0];contextEnd=confirmedBox.end;context=v27SafeContext(source.slice(0,contextEnd),cfg);prefixEnd=end;
        }
        if(!context)return [];
        const exposed=biographyNodes(context.view),boxes=exposed.nodes.filter(n=>v273MarriageBoxName(parsedTemplate(source.slice(n.start,n.end)).name));if(boxes.length!==1)return [];
        const node=boxes[0],raw=source.slice(node.start,node.end),name=parsedTemplate(raw).name,firstSection=context.view.search(/^={2,6}[^=\n].*?={2,6}\s*$/m),lineEnd=source.indexOf('\n',node.end);
        if(confirmedBox&&(node.start!==confirmedBox.start||node.end!==confirmedBox.end)||node.end>contextEnd||node.end>prefixEnd||firstSection>=0&&node.start>=firstSection||source.slice(source.lastIndexOf('\n',node.start-1)+1,node.start).trim()||source.slice(node.end,lineEnd<0?source.length:lineEnd).trim()||context.shield.ranges.some(r=>r.start<=node.start&&node.start<r.end))return [];
        if(v273MarriagePotentialInfobox(source.slice(0,node.start))||v273MarriagePotentialInfobox(source.slice(node.end)))return [];
        const canonical=v273MarriageCanonical(raw,cfg),canonicalName=parsedTemplate(canonical).name,parsed=v273MarriageFields(canonical,canonicalName);if(!parsed)return [];
        const field=parsed.spouse,value=v273MarriageValue(field.value);if(!value)return [];
        // Approved aliases cannot turn a protected original value into data.
        let originalAt=raw.indexOf(value.original);if(originalAt<0)return [];
        while(originalAt>=0){if(v27SafeOverlap(node.start+originalAt,node.start+originalAt+value.original.length,context.shield.ranges))return [];originalAt=raw.indexOf(value.original,originalAt+value.original.length);}
        const text=canonical.slice(0,field.start+value.start)+value.text+canonical.slice(field.start+value.end);
        return [{start:node.start,end:node.end,text,ruleId:'marriageInfoboxes',proof:{sourceHash:v24SyntaxHash(source),prefixEnd,contextEnd,tailHash:v24SyntaxHash(source.slice(prefixEnd)),template:canonicalName,key:field.key,raw,canonical,value,condition:'one complete principal person infobox; accepted unique spouse field; explicit marriage dates/status; approved existing field normalization only; any opaque tail remains unchanged'}}];
    }
    function v273MarriagePlan(source,cfg={}) {
        const edits=v273MarriageEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v273MarriageProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v273MarriagePlan(before,cfg);
        return plan.text===after&&fresh.text===after&&JSON.stringify(plan.edits)===JSON.stringify(fresh.edits);
    }
    function v273MarriageInventory(source,cfg,wanted) {
        const noop=()=>{},normalized=occupationCase(livingBirthAge(mapTemplateTree(source,raw=>{
            const p=parsedTemplate(raw);return v273MarriageBoxName(p.name)?v273MarriageCanonical(raw,cfg):v24InventoryTemplate(raw,cfg);
        }),cfg,noop),cfg,noop),out=[];
        for(const node of topNodes(protectedView(normalized))){const raw=normalized.slice(node.start,node.end),p=parsedTemplate(raw);if(!wanted.has(p.name))continue;
            out.push(JSON.stringify([p.name,templateEntries(p).map(f=>[f.key,v24InventoryBody(f.value,cfg)])]));}
        return v24InventoryCount(out);
    }
    function v273MarriageObjectProof(plan,expected,actual) {
        const steps=plan.safe.steps.filter(s=>s.name==='v273-explicit-marriage');if(!steps.length)return {accepted:true,reason:''};
        const wanted=new Set(steps.flatMap(s=>s.edits.map(e=>e.proof.template))),before=v273MarriageInventory(expected,plan.cfg,wanted),after=v273MarriageInventory(actual,plan.cfg,wanted);
        return before.size&&v24InventoryContains(before,after)?{accepted:true,reason:''}:{accepted:false,reason:'A infocaixa perdeu ou alterou campos do casamento fora da conversão confirmada.'};
    }

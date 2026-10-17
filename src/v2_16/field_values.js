    // Every enabled field is a literal displayed slot in a pinned definition.
    // A checker allowlist or a foreign alias alone never enables these edits.
    const V216_FIELD_LABELS=Object.freeze({
        72993800:{fullName:['Nome completo'],birthDate:['Nascimento'],birthPlace:['Nascimento'],
            deathDate:['Morte'],deathPlace:['Morte'],nationality:['Nacionalidade'],citizenship:['Cidadania'],
            occupation:['Ocupação'],otherOccupation:['Outras ocupações'],profession:['Profissão']},
        70095373:{birthDate:['Data de nascimento'],birthPlace:['Local de nascimento'],
            deathDate:['Data da morte'],deathPlace:['Local da morte']}
    });
    const V216_LITERAL_LIST_KEYS=Object.freeze({72993800:[
        ['ocupação','ocupações','ocupacao','trabalho civil','Ocupação'],['outras_ocupações'],['profissão'],
        ['filhos','nome_filhos','filho','filhas','nome_filhas','filha'],['parentesco','parentes'],
        ['principais_trabalhos','trabalhos'],['instrumento','instrumentos']
    ]});
    function v216FieldValueScope(cfg={}) {
        return v2151FieldSyntaxScope({...cfg,automaticFieldSyntax:true})&&cfg.automaticBiographyFields!==false;
    }
    function v216FieldValueBox(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v216FieldValueScope(cfg))return null;
        const box=v28PrincipalPersonBox(source,cfg);
        if(!box||box.sourceRaw!==box.raw||!v215LiteralTemplateIdentity(box.raw,box.profile)||
            !v2151LeadTransferContract(box.profile))return null;
        const fields=v2151FieldSyntaxParts(box.raw);
        if(!fields||fields.some(field=>field.key!==field.plain||field.separator!=='='))return null;
        const inner=box.raw.slice(2,-2);
        if(templates(protectedView(inner)).nodes.some(node=>/^(?:info\/|infobox\b)/.test(parsedTemplate(inner.slice(node.start,node.end)).name)))return null;
        return {...box,fields};
    }
    function v216FieldValueClock() {
        const now=new Date(),year=now.getUTCFullYear(),month=now.getUTCMonth()+1,day=now.getUTCDate();
        return {year,month,day,calendarUTC:[year,month,day].join('-'),
            expiresUTC:Date.UTC(year,month-1,day+1)};
    }
    function v216FieldValueParts(value,source) {
        const parsed=v2151LeadValue(value,source,false,false);
        if(!parsed)return null;
        const start=value.length-value.trimStart().length;
        return {...parsed,start,end:start+parsed.core.length};
    }
    function v216FieldValueUnique(box,field,kind,contract) {
        if(v2151FrozenBurialField(field.key)||!profileAccepts(box.profile,field.key))return false;
        if(/^(?:birth|death)(?:Date|Place)$/.test(kind)){
            const matches=v2151LeadFactFields(box,kind);
            return contract?.[kind]?.includes(field.key)&&matches.length===1&&matches[0].key===field.key;
        }
        const reviewed=v2151FieldSyntaxContract(box.profile),group=reviewed?.groups.find(item=>item.kind===kind);
        if(!group||!reviewed.allowed.has(field.key)||!group.keys.has(field.key))return false;
        return box.fields.filter(other=>group.keys.has(other.key)).length===1;
    }
    function v216FieldValueAliasGroup(box,keys) {
        const family=new Set(keys),edges=[...Object.entries(box.profile.aliases||{}),...Object.entries(box.profile.renames||{})];
        let changed=true;
        while(changed){changed=false;for(const [key,target]of edges)
            if(typeof target==='string'&&(family.has(key)||family.has(target))){
                if(!family.has(key)){family.add(key);changed=true;}
                if(!family.has(target)){family.add(target);changed=true;}
            }}
        return family;
    }
    function v216StandaloneDateValue(value,source) {
        const parts=v216FieldValueParts(value,source);
        if(!parts||parts.core.startsWith('{{'))return null;
        const date=v2151LeadDate(parts.core);
        if(!date)return null;
        return {...parts,text:date.generated,date:date.numbers};
    }
    function v216DuplicateAgeValue(value,source) {
        // Dni 69218531 uses UTC CURRENTYEAR/MONTH/DAY and pluralizes the age.
        // An extra literal copy is removed only on the same confirmed day.
        const parts=v216FieldValueParts(value,source);
        if(!parts)return null;
        const match=/^(\{\{(?:Dni|dni)\|[^{}]*\}\})([ \t]+)\(([1-9]\d?|1[01]\d|12[0-5]) (ano|anos)\)$/.exec(parts.core);
        if(!match)return null;
        const parsed=v28DateTemplate(match[1],'dni'),date=v2151LeadDate(match[1]);
        if(!parsed||parsed.fields.size!==3||!date)return null;
        const clock=v216FieldValueClock(),[day,month,year]=date.numbers,
            age=clock.year-year-Number(clock.month<month||clock.month===month&&clock.day<day);
        if(age<1||age>125||age!==+match[3]||match[4]!== (age===1?'ano':'anos'))return null;
        return {...parts,start:parts.start+match[1].length,text:'',age,calendarUTC:clock.calendarUTC,
            expiresUTC:clock.expiresUTC,definition:69218531};
    }
    function v216DuplicateUnitValue(value,source,box,field) {
        // This definition literally emits {{{altura}}} [[Metro|m]]. Other
        // reviewed person boxes expect the editor to supply their own unit.
        if(box.profile.oldid!==70580964||field.key!=='altura'||
            box.fields.filter(other=>['altura','Altura','height'].includes(other.key)).length!==1)return null;
        const parts=v216FieldValueParts(value,source);
        if(!parts||!/^\d{1,3}(?:[.,]\d{1,3})? m$/.test(parts.core))return null;
        return {...parts,text:parts.core.slice(0,-2),unit:'m',definition:70580964};
    }
    function v216FieldLabelValue(value,source,labels,kind) {
        const parts=v216FieldValueParts(value,source);if(!parts)return null;
        let core=parts.core,count=0;
        for(let index=0;index<4;index++){
            const label=labels.find(item=>core.startsWith(item+': '));if(!label)break;
            core=core.slice(label.length+2);count++;
        }
        if(!count||!core||labels.some(label=>core.startsWith(label+': ')))return null;
        if(/Date$/.test(kind)){if(!v2151LeadDate(core))return null;}
        else if(/Place$/.test(kind)){if(!v2151LeadPlace(core)||/\b(?:desconhecid[oa]s?|ignorad[oa]s?|incert[oa]s?|ou|e\/ou)\b/iu.test(core))return null;}
        else if(!/^[\p{L}\p{M}0-9 .,\-'’]+$/u.test(core)||!/[\p{L}]/u.test(core))return null;
        return {...parts,text:core,count,labels};
    }
    function v216FieldHeaderSelfLink(value,source,title) {
        const parts=v216FieldValueParts(value,source);if(!parts)return null;
        const match=/^\[\[([^\[\]{}<>|#:\r\n]+)(?:\|([^\[\]{}<>|\r\n]+))?\]\]$/.exec(parts.core);
        if(!match||v2151LeadTitle(match[1])!==v2151LeadTitle(title)||
            !title||match[1]!==match[1].trim())return null;
        const display=match[2]??match[1].replace(/_/g,' ');
        if(!display||display!==display.trim())return null;
        return {...parts,text:display};
    }
    function v216FieldListValue(value,source,newline='\n') {
        if(typeof value!=='string'||value.length>4096||/<!--|\{\{\{|[\uE000-\uF8FF]/.test(value))return null;
        const leading=/^[ \t\r\n]*/.exec(value)[0],core=value.slice(leading.length).trimEnd();
        if(!core.startsWith('* '))return null;
        const refs=refTokens(core);
        if(refs.some(ref=>v2151LeadReference(core.slice(ref.start,ref.end),source)===null))return null;
        const links=editorialWikiLinkRanges(core),view=v24SyntaxMaskRanges(core,[...refs,...links]),
            markers=[...view.matchAll(/\*/g)];
        if(markers.length<2||markers.length>8||markers[0].index!==0)return null;
        const items=[];
        for(let index=0;index<markers.length;index++){
            const start=markers[index].index+1,end=markers[index+1]?.index??core.length,
                raw=core.slice(start,end),item=v2151LeadValue(raw,source,false,false);
            if(!/^\s/.test(raw)||!item||!/^\[\[[^\[\]{}<>#:\r\n]+\]\]$/.test(item.core)||
                (item.core.match(/\|/g)||[]).length>1)return null;
            items.push({start:markers[index].index,text:raw.trim()});
        }
        const missingBetween=items.slice(1).filter(item=>
            !/[\r\n]/.test(/\s*$/.exec(core.slice(0,item.start))[0])).length;
        if(!missingBetween)return null;
        // Only explicit linked bullet items are recognized. No punctuation,
        // names, occupations, dates or references are invented or discarded.
        const trailing=value.slice(value.length-value.match(/\s*$/)[0].length),
            text=leading+items.map(item=>'* '+item.text).join(newline)+trailing;
        return {text,count:missingBetween,items:items.map(item=>item.text),definition:72993800};
    }
    function v216FieldValueEdits(source,cfg={}) {
        const box=v216FieldValueBox(source,cfg);if(!box)return [];
        const contract=v2151LeadTransferContract(box.profile),local=[],changeRules=[],newline=box.raw.includes('\r\n')?'\r\n':'\n';
        const add=(field,parsed,ruleId,kind)=>{
            if(!parsed)return false;
            const start=field.start+(parsed.start??0),end=parsed.end===undefined?field.end:field.start+parsed.end;
            local.push({start,end,text:parsed.text,ruleId,detail:{key:field.key,kind,...parsed}});
            for(let n=0;n<(parsed.count??1);n++)changeRules.push(ruleId);
            return true;
        };
        const labels=V216_FIELD_LABELS[box.profile.oldid]||{},display=v2151FieldSyntaxContract(box.profile);
        for(const field of box.fields){
            if(v2151FrozenBurialField(field.key)||!profileAccepts(box.profile,field.key))continue;
            const kind=['birthDate','birthPlace','deathDate','deathPlace'].find(role=>contract[role]?.includes(field.key))||
                display?.groups.find(group=>group.keys.has(field.key))?.kind;
            if(kind&&v216FieldValueUnique(box,field,kind,contract)){
                if(labels[kind]&&add(field,v216FieldLabelValue(field.value,source,labels[kind],kind),'v216InfoboxValueLabels',kind))continue;
                if(/Date$/.test(kind)&&cfg.birthDates!==false&&
                    !box.fields.some(other=>/calend[aá]rio|calendar/i.test(other.key)&&other.value.trim())){
                    if(kind==='birthDate'&&add(field,v216DuplicateAgeValue(field.value,source),'v216InfoboxDuplicateAge',kind))continue;
                    if(add(field,v216StandaloneDateValue(field.value,source),'v216InfoboxStandaloneDates',kind))continue;
                }
                if(kind==='name'&&contract.headers.includes(field.key)&&
                    add(field,v216FieldHeaderSelfLink(field.value,source,cfg.pageTitle),'v216InfoboxHeaderSelfLinks',kind))continue;
            }
            if(add(field,v216DuplicateUnitValue(field.value,source,box,field),'v216InfoboxDuplicateUnits','unit'))continue;
            const lists=V216_LITERAL_LIST_KEYS[box.profile.oldid]||[],keys=lists.find(group=>group.includes(field.key)),
                family=keys&&v216FieldValueAliasGroup(box,keys);
            if(family&&box.fields.filter(other=>family.has(other.key)).length===1)
                add(field,v216FieldListValue(field.value,source,newline),'v216InfoboxLists','list');
        }
        // Removing an age copy or a date label can unlock the existing paired
        // birth/death rule. Let that rule read the still-literal other date
        // before standalone presentation is applied in the next bounded round.
        if(local.some(edit=>edit.ruleId==='v216InfoboxDuplicateAge'||
            edit.ruleId==='v216InfoboxValueLabels'&&/Date$/.test(edit.detail.kind))){
            for(let index=local.length-1;index>=0;index--)if(local[index].ruleId==='v216InfoboxStandaloneDates')local.splice(index,1);
            changeRules.splice(0,changeRules.length,...local.flatMap(edit=>Array(edit.detail.count??1).fill(edit.ruleId)));
        }
        if(!local.length)return [];
        local.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(local.some((edit,index)=>index&&edit.start<local[index-1].end))return [];
        const canonical=v24SyntaxApply(box.raw,local);
        if(!v2151FieldSyntaxParts(canonical))return [];
        for(const field of box.fields.filter(field=>v2151FrozenBurialField(field.key)))
            if(local.some(edit=>edit.start<field.partEnd&&edit.end>field.partStart))return [];
        return [{start:box.node.start,end:box.node.end,text:canonical,ruleId:'v216FieldValues',proof:{
            sourceHash:v24SyntaxHash(source),template:box.name,oldid:box.profile.oldid,raw:box.raw,canonical,
            edits:local,changeRules,condition:'single literal native person infobox; pinned displayed fields; complete alias blockers; exact local facts and reference binding retained; burial fields untouched'}}];
    }
    function v216FieldValuePlan(source,cfg={}) {
        const edits=v216FieldValueEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',edits,
            text:typeof source==='string'?v24SyntaxApply(source,edits):source};
    }
    function v216FieldValueProof(source,result,plan,cfg={}) {
        if(!plan||plan.source!==source||plan.sourceHash!==v24SyntaxHash(source)||plan.text!==result)return false;
        const fresh=v216FieldValuePlan(source,cfg);
        return fresh.text===result&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function automaticBiographyFieldValues(source,cfg={},bump=()=>{}) {
        const plan=v216FieldValuePlan(source,cfg);
        for(const edit of plan.edits)for(const rule of edit.proof.changeRules)bump(rule);
        return plan.text;
    }

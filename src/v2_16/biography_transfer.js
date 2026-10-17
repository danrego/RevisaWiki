    // These native definitions read the four date/place roles from literal
    // arguments. Their missing-value branches do not retrieve Wikidata facts.
    // The role keys and priority blockers still come from the pinned 2.15.1
    // contracts. A different revision never inherits this permission.
    const V216_LITERAL_EMPTY_DATE_PLACE=new Set([26361976,36826568,53743614,54243899,66124641,66374725,68053869,68468692,
        68881875,70095373,70299175,70325721,70403402,70433692,70580964,70964118,71357256,71530652,71681928,72130922,
        72335378,72386980,72594140,72825634,72882232,72887103,72931974,72947166,72993800,73044750,73118835,73122259,73164878]);
    function v216TransferContract(profile) {
        const contract=v2151LeadTransferContract(profile);
        return contract&&V216_LITERAL_EMPTY_DATE_PLACE.has(profile.oldid)?contract:null;
    }
    function v216TransferScope(cfg={}) {
        return cfg.automaticBiographyFields!==false&&cfg.infoboxes!==false&&
            v2151BiographyLeadScope({...cfg,automaticBiographyLead:true});
    }
    function v216TransferContext(source,cfg={}) {
        if(typeof source!=='string'||source.length>4194304||!v216TransferScope(cfg))return null;
        const head=v2151LeadHead(source),opening=v2151LeadOpening(source,cfg);
        if(head===null||!opening||!['é','foi'].includes(opening.verb))return null;
        // The principal-box check sees the complete article. A second person
        // box in a later section cannot be hidden by the lead-only boundary.
        const box=v28PrincipalPersonBox(source,cfg),contract=box&&v216TransferContract(box.profile);
        if(!box||!contract||box.raw!==box.sourceRaw||!v215LiteralTemplateIdentity(box.raw,box.profile)||
            box.fields.some(field=>v2151FrozenBurialField(field.key)&&/\{\{\{|<!--/.test(field.value))||
            new Set(box.fields.map(field=>field.key)).size!==box.fields.length)return null;
        const prefix=source.slice(0,Math.max(opening.end,opening.tupleEnd||0));
        if(/<!--|\{\{\{|\{\{\s*(?:#|subst\s*:|safesubst\s*:)|\{\||\|\}|<\s*\/?\s*(?:div|section|table|blockquote|q|pre|code|syntaxhighlight|source|nowiki|noinclude|includeonly|onlyinclude|gallery|imagemap|poem|timeline)\b/i.test(prefix)||
            v24SyntaxScan(prefix).issues.length||box.fields.some(field=>/calend[aá]rio|calendar/i.test(field.key)&&field.value.trim())||
            box.fields.some(field=>['incorporar','subbox','subcaixa','nested','child','embed','embutido'].includes(norm(field.key))&&
                field.value.trim()&&!/^(?:não|nao|no|false|0)$/i.test(field.value.trim())))return null;
        const headerKeys=new Set(['nome',...contract.headers].map(norm));
        for(const [key,target]of Object.entries({...box.profile.aliases,...box.profile.renames}))if(headerKeys.has(norm(target)))headerKeys.add(norm(key));
        const names=box.fields.filter(field=>headerKeys.has(norm(field.key)));
        if(names.length>1||names.length&&(!contract.headers.includes(names[0].key)||!names[0].value.trim())||contract.requireHeader&&!names.length)return null;
        if(names.length){
            let name=names[0].value.trim();if(/^'''[^'\r\n]+'''$/.test(name))name=name.slice(3,-3);
            if(name.startsWith('[[')){
                const match=/^\[\[([^\[\]|\r\n]+)(?:\|([^\[\]|\r\n]+))?\]\]$/.exec(name);
                if(!match||v2151LeadTitle(match[1])!==opening.title)return null;name=match[2]??match[1].replace(/_/g,' ');
            }
            if(name!==opening.subject)return null;
        }
        return {box,contract,opening};
    }
    function v216TransferFact(raw,source,kind,requireReference=false) {
        const value=v2151LeadValue(raw,source,requireReference,true);
        if(!value)return null;
        const fact=/Date$/.test(kind)?v2151LeadDate(value.core):v2151LeadPlace(value.core);
        if(!fact||kind==='birthDate'&&fact.template==='morte'||kind==='deathDate'&&fact.template==='dni')return null;
        return {...fact,core:value.core,refs:value.refs,sourceRaw:raw,raw:value.core+value.refs,
            emitted:(/Date$/.test(kind)?fact.generated:value.core)+value.refs};
    }
    // A trailing source for the whole parenthesis is not silently assigned to
    // every fact. Each copied field must have its own literal source suffix.
    function v216TransferParts(raw,source,side='birth') {
        if(typeof raw!=='string'||raw.length>8192)return null;
        const dateKind=side+'Date',placeKind=side+'Place',direct=v216TransferFact(raw,source,dateKind);
        if(direct)return {date:direct,place:null,reversed:false};
        const view=v24SyntaxMaskRanges(raw,[...refTokens(raw),...topNodes(raw),...editorialWikiLinkRanges(raw)]),readings=[],
            breaks=[...raw.matchAll(/<br(?: ?\/)?>/gi)].filter(match=>view.slice(match.index,match.index+match[0].length)===match[0]);
        if(breaks.length>1)return null;
        const boundaries=[...[...view.matchAll(/,/g)].map(match=>({index:match.index,end:match.index+1})),
            ...breaks.map(match=>({index:match.index,end:match.index+match[0].length}))];
        for(const match of boundaries){
            const left=raw.slice(0,match.index),right=raw.slice(match.end),a=v216TransferFact(left,source,dateKind),b=v216TransferFact(right,source,dateKind);
            if(a){const place=v216TransferFact(right,source,placeKind);if(place)readings.push({date:a,place,reversed:true});}
            if(b){const place=v216TransferFact(left,source,placeKind);if(place)readings.push({date:b,place,reversed:false});}
        }
        return readings.length===1?readings[0]:null;
    }
    function v216TransferTuple(raw,source) {
        // The existing reference normalizer can put a comma just before a
        // citation run. Read its finite equivalent layout before binding the
        // individually cited location, without rewriting the opening itself.
        raw=v2151LeadPunctuationCanonical(raw);if(raw===null)return null;
        const view=v24SyntaxMaskRanges(raw,[...refTokens(raw),...topNodes(raw),...editorialWikiLinkRanges(raw)]),
            cuts=[...raw.matchAll(/[ \t]+[–—][ \t]+/g)].filter(match=>{const offset=match[0].search(/[–—]/);return view[match.index+offset]===match[0][offset];});
        if(cuts.length>1)return null;
        if(!cuts.length){const birth=v216TransferParts(raw,source);return birth?{birth,death:null}:null;}
        const cut=cuts[0],birth=v216TransferParts(raw.slice(0,cut.index),source),death=v216TransferParts(raw.slice(cut.index+cut[0].length),source,'death');
        return birth&&death&&death.date.stamp>=birth.date.stamp&&death.date.numbers[2]-birth.date.numbers[2]<=125?{birth,death}:null;
    }
    function v216TransferCountryBlock(box,kind) {
        const keys=kind==='birthPlace'?['nascimento_país','nascimento_pais','paisnatal','paísnatal','país de nascimento','pais_nascimento']:
            ['morte_país','morte_pais','paisdamorte','paisdemorte','país de morte','pais_falecimento'];
        const normalized=new Set(keys.map(norm));
        return /Place$/.test(kind)&&box.fields.some(field=>normalized.has(norm(field.key))&&field.value.trim());
    }
    function v216TransferFieldEdit(field,value,ruleId,kind,detail={}) {
        const leading=/^\s*/.exec(field.value)[0],trailing=field.value.trim()?/\s*$/.exec(field.value)[0]:'';
        return {start:field.start,end:field.end,text:leading+value+trailing,ruleId,detail:{kind,key:field.key,before:field.value,emitted:value,...detail}};
    }
    function v216TransferAppend(box,additions) {
        if(!additions.length)return null;
        const multiline=box.raw.includes('\n'),newline=box.raw.includes('\r\n')?'\r\n':'\n',body=box.raw.slice(0,-2),
            trailing=/\s*$/.exec(body)[0],at=body.length-trailing.length;
        const text=additions.map(item=>(multiline?newline+'| ':'|')+item.key+(multiline?' = ':'=')+item.value).join('');
        return {start:at,end:at,text,ruleId:additions[0].ruleId,detail:{additions}};
    }
    function v216TransferTransaction(box,changes,additions) {
        const append=v216TransferAppend(box,additions);if(append)changes.push(append);
        const sorted=changes.slice().sort((a,b)=>a.start-b.start||a.end-b.end);
        if(sorted.some((edit,index)=>index&&edit.start<sorted[index-1].end))return null;
        return changes.length?{raw:v24SyntaxApply(box.raw,changes),edits:changes}:null;
    }
    function v216TransferSplit(source,cfg={}) {
        const context=v216TransferContext(source,cfg);if(!context)return null;
        const {box,contract}=context,changes=[],additions=[],changeRules=[],facts=[],
            tuple=context.opening.tuple?v216TransferTuple(context.opening.tuple.raw,source):null;
        if(context.opening.tuple&&!tuple)return null;
        if(tuple?.death&&(context.opening.verb!=='foi'||cfg.livingCategoryConfirmed||
            /\[\[\s*Categoria\s*:\s*Pessoas vivas\s*(?:\|[^\]]*)?\]\]/i.test(protectedView(source))))return null;
        for(const side of ['birth','death']){
            const dateKind=side+'Date',placeKind=side+'Place',dates=v2151LeadFactFields(box,dateKind),places=v2151LeadFactFields(box,placeKind);
            if(dates.length!==1||places.length>1||!contract[dateKind].includes(dates[0].key)||!profileAccepts(box.profile,dates[0].key)||
                places.length&&(!contract[placeKind].includes(places[0].key)||places[0].value.trim())||v216TransferCountryBlock(box,placeKind))continue;
            const part=v216TransferParts(dates[0].value.trim(),source,side);
            if(!part?.place||!part.reversed||!part.date.refs||!part.place.refs)continue;
            if(side==='death'&&context.opening.verb!=='foi')continue;
            const current=tuple?.[side];
            if(current&&(current.date.identity!==part.date.identity||current.place&&current.place.identity!==part.place.identity))continue;
            const otherSide=side==='birth'?'death':'birth',otherFields=v2151LeadFactFields(box,otherSide+'Date');
            if(otherFields.length>1)continue;
            const other=otherFields.length&&otherFields[0].value.trim()?
                v216TransferFact(otherFields[0].value,source,otherSide+'Date')||v216TransferParts(otherFields[0].value.trim(),source,otherSide)?.date:tuple?.[otherSide]?.date;
            if(otherFields.length&&otherFields[0].value.trim()&&!other)continue;
            const born=side==='birth'?part.date:other,died=side==='death'?part.date:other;
            if(born&&died&&(died.stamp<born.stamp||died.numbers[2]-born.numbers[2]>125))continue;
            const target=places[0]?.key||contract[placeKind].find(key=>profileAccepts(box.profile,key));
            if(!target||v2151FrozenBurialField(target))continue;
            // A combined field is split only when every original citation is
            // retained with the same component, in its original definition form.
            const originalDate=v2151LeadValue(part.date.sourceRaw,source,true,false),originalPlace=v2151LeadValue(part.place.sourceRaw,source,true,false);
            if(!originalDate||!originalPlace)continue;
            const dateValue=originalDate.core+originalDate.refs,placeValue=originalPlace.core+originalPlace.refs;
            changes.push(v216TransferFieldEdit(dates[0],dateValue,'biographyPackedDate',dateKind,{sourceValue:dates[0].value,identity:part.date.identity}));
            if(places.length)changes.push(v216TransferFieldEdit(places[0],placeValue,'biographyPackedPlace',placeKind,{identity:part.place.identity}));
            else additions.push({key:target,value:placeValue,ruleId:'biographyPackedPlace',kind:placeKind,identity:part.place.identity});
            changeRules.push('biographyPackedDate','biographyPackedPlace');
            facts.push({kind:dateKind,key:dates[0].key,identity:part.date.identity,refs:originalDate.refs,sourceValue:dates[0].value},
                {kind:placeKind,key:target,identity:part.place.identity,refs:originalPlace.refs,sourceValue:dates[0].value});
        }
        const transaction=v216TransferTransaction(box,changes,additions);
        return transaction?{...transaction,box,changeRules,facts,phase:'packed-date-place'}:null;
    }
    function v216TransferFromLead(source,cfg={}) {
        const context=v216TransferContext(source,cfg);if(!context||!context.opening.tuple)return null;
        const {box,contract,opening}=context,tuple=v216TransferTuple(opening.tuple.raw,source);if(!tuple)return null;
        if(opening.verb==='é'&&(tuple.death||v2151LeadFactFields(box,'deathDate').some(field=>field.value.trim())))return null;
        if(tuple.death&&(cfg.livingCategoryConfirmed||/\[\[\s*Categoria\s*:\s*Pessoas vivas\s*(?:\|[^\]]*)?\]\]/i.test(protectedView(source))))return null;
        if(!tuple.death&&opening.verb==='é'){const today=new Date();if(today.getUTCFullYear()-tuple.birth.date.numbers[2]>125)return null;}
        const sourceFacts={birthDate:tuple.birth.date,birthPlace:tuple.birth.place,deathDate:tuple.death?.date,deathPlace:tuple.death?.place},
            existing={},additions=[],changeRules=[],facts=[];
        for(const kind of Object.keys(sourceFacts)){
            const fields=v2151LeadFactFields(box,kind);
            if(fields.length>1||fields.length&&!contract[kind].includes(fields[0].key))return null;
            if(fields.length){
                if(!profileAccepts(box.profile,fields[0].key))return null;
                if(!fields[0].value.trim()){existing[kind]={empty:true};continue;}
                const literal=v216TransferFact(fields[0].value,source,kind);if(!literal)return null;
                existing[kind]=literal;if(sourceFacts[kind]&&literal.identity!==sourceFacts[kind].identity)return null;
            }
        }
        const born=existing.birthDate||sourceFacts.birthDate,died=existing.deathDate||sourceFacts.deathDate;
        if(born&&!born.empty&&died&&!died.empty&&(died.stamp<born.stamp||died.numbers[2]-born.numbers[2]>125))return null;
        for(const [kind,fact]of Object.entries(sourceFacts)){
            // An explicit empty argument is a local editorial choice and can
            // suppress a default. It is never filled from the opening.
            if(!fact||existing[kind]||!fact.refs||v216TransferCountryBlock(box,kind))continue;
            if(contract.placeNeedsDate&&/Place$/.test(kind)&&!existing[kind.replace('Place','Date')]&&!sourceFacts[kind.replace('Place','Date')]?.refs)continue;
            const key=contract[kind].find(candidate=>profileAccepts(box.profile,candidate));if(!key||v2151FrozenBurialField(key))continue;
            const ruleId=/^birth/.test(kind)?'biographyLeadToInfoboxBirth':'biographyLeadToInfoboxDeath';
            additions.push({key,value:fact.emitted,ruleId,kind,identity:fact.identity});changeRules.push(ruleId);
            facts.push({kind,key,identity:fact.identity,sourceRaw:fact.sourceRaw,emitted:fact.emitted,refs:fact.refs,
                openingStart:opening.tupleStart,openingEnd:opening.tupleEnd});
        }
        const transaction=v216TransferTransaction(box,[],additions);
        return transaction?{...transaction,box,changeRules,facts,phase:'referenced-lead-to-box'}:null;
    }
    function v216TransferEdits(source,cfg={}) {
        if(!v216TransferScope(cfg))return [];
        const context=v216TransferContext(source,cfg);if(!context)return [];
        const phases=[],changeRules=[];let text=source;
        for(const build of [v216TransferSplit,v216TransferFromLead]){
            const stage=build(text,cfg);if(!stage)continue;
            phases.push({phase:stage.phase,sourceHash:v24SyntaxHash(text),boxRaw:stage.box.raw,canonical:stage.raw,
                edits:stage.edits,changeRules:stage.changeRules,facts:stage.facts});changeRules.push(...stage.changeRules);
            text=text.slice(0,stage.box.node.start)+stage.raw+text.slice(stage.box.node.end);
        }
        if(text===source)return [];
        const {box}=context,newEnd=text.length-source.length+box.node.end,raw=text.slice(box.node.start,newEnd);
        return [{start:box.node.start,end:box.node.end,text:raw,ruleId:changeRules[0],proof:{scope:'native-biography-transfer',sourceHash:v24SyntaxHash(source),
            template:box.name,oldid:box.profile.oldid,raw:box.raw,canonical:raw,phases,changeRules,
            condition:'one exact native principal person; literal missing-field role with no Wikidata default; exact opening identity; separately bound fact references; no conflicting native alias; burial fields unchanged'}}];
    }
    function v216TransferPlan(source,cfg={}) {
        const edits=v216TransferEdits(source,cfg);
        return {source,sourceHash:typeof source==='string'?v24SyntaxHash(source):'',text:v24SyntaxApply(source,edits),edits};
    }
    function automaticBiographyTransfer(source,cfg={},bump=()=>{}) {
        const plan=v216TransferPlan(source,cfg);for(const edit of plan.edits)for(const rule of edit.proof.changeRules)bump(rule);return plan.text;
    }
    function v216TransferProof(source,result,plan,cfg={}) {
        if(!plan||plan.source!==source||plan.sourceHash!==v24SyntaxHash(source)||plan.text!==result)return false;
        const fresh=v216TransferPlan(source,cfg);
        return fresh.text===result&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

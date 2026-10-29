    // These guards only decline a conflicting imported-field activation.
    // The original argument and all independent edits remain available.
    function v2213AliasGroups(profile) {
        if(!v2213BiographyProfile(profile))return [];
        const groups=root.RevisaWikiDataV2?.packed?.support2213?.aliasGroups;
        return Array.isArray(groups)&&groups.length===61?groups:null;
    }
    function v2213AliasRenameBlocked(profile,fields,from,to) {
        if(!v2213BiographyProfile(profile))return false;
        const groups=v2213AliasGroups(profile);if(!groups)return true;
        if(V221_INFOBOX_CONTRACTS['Info/Biografia'].consumed.includes(from))return true;
        return groups.some(keys=>keys.includes(to)&&fields.some(f=>f.key!==from&&keys.includes(f.key)&&f.value.trim()));
    }
    function v2213PortalValueAllowed(box,field) {
        const profile=INFOBOX_CATALOG[box.infobox];if(!v2213BiographyProfile(profile))return true;
        if(!V221_INFOBOX_CONTRACTS['Info/Biografia'].consumed.includes(field.key))return false;
        const groups=v2213AliasGroups(profile);if(!groups)return false;
        return groups.filter(keys=>keys.includes(field.key)).every(keys=>{
            const present=keys.flatMap(key=>box.fields.filter(f=>f.key===key));
            if(new Set(present.map(f=>f.key)).size!==present.length)return false;
            const populated=present.filter(f=>f.value.trim());if(new Set(populated.map(f=>f.value.trim())).size>1)return false;
            const selected=keys.map(key=>present.find(f=>f.key===key)).find(f=>f?.value.trim());
            return !field.value.trim()||!selected||selected===field;
        });
    }

    function v220BaselineBiographyFieldPlan(raw,cfg={}) {
        const input=raw;raw=v273MarriageCanonical(input,cfg);
        const name=parsedTemplate(raw).name,profile=INFOBOX_CATALOG[name],contract=v28BiographyFieldContract(name),original=profile&&v28LiteralInfoboxFields(raw,name),edits=[],rules=[];
        const empty=()=>({source:input,sourceHash:v24SyntaxHash(input),template:name,text:input,edits:[],rules:[]});
        if(!contract||!original||cfg.infoboxes===false||cfg.markup===false||!raw.startsWith('{{')||!raw.endsWith('}}'))return empty();
        const fields=original.map(field=>({...field})),count=key=>fields.filter(field=>field.key===key).length;
        if(fields.some(field=>count(field.key)>1))return empty();
        const add=(edit,rule)=>{edits.push({...edit,ruleId:rule});if(!rules.includes(rule))rules.push(rule);};
        for(const field of fields){
            const target=V28_BIOGRAPHY_PARAMETER_TYPOS[field.key];
            if(!target||profileAccepts(profile,field.key)||!profileAccepts(profile,target)||v2213AliasRenameBlocked(profile,fields,field.key,target)||fields.some(other=>other!==field&&(other.key===target||V28_BIOGRAPHY_PARAMETER_TYPOS[other.key]===target)))continue;
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

    function v221BioMappingEdits(source,cfg,box) {
        if(cfg.infoboxes===false||cfg.markup===false||cfg.automaticBiographyFields===false||cfg.automaticParameterNames===false||!v221BioUniqueFields(box))return [];
        const edits=[],maps=V221_INFOBOX_MAPPINGS.filter(mapping=>mapping.owner===box.name);
        const add=(field,start,end,text,id,extra={})=>edits.push({start:box.node.start+start,end:box.node.start+end,text,
            ruleId:id,label:'Campos da infocaixa conferidos',proof:{owner:box.name,nativeOldid:box.native.oldid,
                nativeSha256:box.native.sha256,key:field.key,value:field.value,...extra}});
        for(const mapping of maps){
            if(cfg.automaticInfoboxValues===false&&V217_INFOBOX_VALUE_CONTRACTS[box.profile.oldid]?.accents?.[mapping.from]===mapping.to)continue;
            const origins=box.fields.filter(field=>field.key===mapping.from);if(origins.length!==1||!origins[0].value.trim())continue;
            const field=origins[0];if(v2213AliasRenameBlocked(box.profile,box.fields,field.key,mapping.to))continue;const others=box.fields.filter(other=>other.key!==mapping.from&&mapping.aliases.includes(other.key)&&
                (box.native.consumed.includes(other.key)||other.value.trim()));
            if(others.some(other=>other.value.trim()||other.key!==mapping.to)||others.length>1)continue;
            const original=cfg.biographyOriginalSource&&cfg.biographyOriginalSource!==source?v221BioPrincipal(cfg.biographyOriginalSource):null;
            if(original?.name===box.name&&original.fields.some(other=>other.key!==mapping.from&&other.key!==mapping.to&&
                mapping.aliases.includes(other.key)&&box.native.consumed.includes(other.key)))continue;
            // Distinct misspellings aimed at one native slot remain conflicting bindings.
            if(maps.some(other=>other.from!==mapping.from&&(other.to===mapping.to||mapping.aliases.includes(other.to))&&
                box.fields.some(candidate=>candidate.key===other.from&&candidate.value.trim())))continue;
            if(!v221BioEntityAllows(source,cfg,box,mapping,field.value))continue;
            if(!v221BioMappingValueAllowed(source,box,mapping,field))continue;
            if(['IBX-20','IBX-21'].includes(mapping.family)&&/\{\{\s*#|\{\{\{/.test(field.value))continue;
            const dimension=['BIO-X08','IBX-06','IBX-10','IBX-22'].includes(mapping.family)&&/(?:tamanho|largura|Width|image_size|imagesize|igmw)/i.test(mapping.from);
            const caption=['BIO-X09','IBX-06','IBX-07','IBH-07'].includes(mapping.family)&&/(?:legenda|imagem-alt)/i.test(mapping.from);
            if((dimension&&(!v221BioDimension(field.value)||!v221BioLiteralImage(box)))||(caption&&!v221BioLiteralImage(box)))continue;
            if(dimension&&(box.name==='Info/Taxonomia'||box.name==='Info/Nobre')&&!/px$/.test(field.value.trim()))continue;
            // These native tennis slots only switch a section heading, not the supplied result text.
            if(mapping.family==='BIO-X12'&&/^Resultadograndslam/.test(mapping.to)&&!/^(?:sim|yes|1)$/.test(field.value.trim()))continue;
            if(mapping.family==='IBH-04'){
                const literal=field.value.trim(),latitude=mapping.to==='latd',number=Number(literal);
                if(!/^[+-]?\d{1,3}(?:\.\d+)?$/.test(literal)||!Number.isFinite(number)||Math.abs(number)>(latitude?90:180))continue;
                if(literal.includes('.')&&box.fields.some(other=>(latitude?['latm','lats']:['longm','longs']).includes(other.key)&&other.value.trim()&&Number(other.value.trim())!==0))continue;
                if(number<0&&box.fields.some(other=>(latitude?['latNS','latns']:['longLO','longlo','longEW','longew']).includes(other.key)&&other.value.trim()))continue;
            }
            if(mapping.family==='IBH-05'&&mapping.to==='censo_data'&&!/^[12]\d{3}$/.test(field.value.trim()))continue;
            if(mapping.family==='IBX-16'&&mapping.to==='logo'&&!/^[^\[\]{}<>|#\r\n]+\.(?:jpe?g|png|gif|webp|svg)$/i.test(field.value.trim()))continue;
            if(others.length)add(others[0],others[0].partStart,others[0].partEnd,'','v221InfoboxEmptyDestination',{family:'BIO-01',destination:mapping.to});
            add(field,field.keyStart,field.keyEnd,mapping.to,'v221InfoboxField',{family:mapping.family,from:mapping.from,to:mapping.to,aliases:mapping.aliases,
                property:mapping.property||null});
        }
        const emptyKeys=V221_EMPTY_UNKNOWN[box.name]||[];
        for(const field of box.fields)if(emptyKeys.includes(field.key)&&!box.native.consumed.includes(field.key)&&!profileAccepts(box.profile,field.key)&&/^[ \t\r\n]*$/.test(field.value))
            add(field,field.partStart,field.partEnd,'','v221InfoboxEmptyUnknown',{family:'BIO-X15'});
        return edits;
    }

    function v217InfoboxValueEdits(source,cfg={}) {
        const box=v217InfoboxValueBox(source,cfg);if(!box)return [];
        const local=[],changeRules=[],add=(edit,ruleId,detail)=>{
            local.push({...edit,ruleId,detail});changeRules.push(ruleId);
        },acceptedNormalized=profileIndex(box.profile).normalized,
            accentMap=new Map(Object.entries(box.contract.accents).map(([key,target])=>[norm(key),target]));
        for(const field of box.fields){
            if(v2151FrozenBurialField(field.key)||profileAccepts(box.profile,field.key)||acceptedNormalized.has(norm(field.key))||
                /^[ \t\r\n]*$/.test(field.value))continue;
            const target=accentMap.get(norm(field.key));
            if(!target||!profileAccepts(box.profile,target)||v2151FrozenBurialField(target)||v2213AliasRenameBlocked(box.profile,box.fields,field.key,target))continue;
            const family=v217InfoboxValueFamily(box,[target]);
            if(box.fields.some(other=>other!==field&&family.has(norm(other.key))))continue;
            add({start:field.keyStart,end:field.keyEnd,text:target},'v217InfoboxParameterAccents',{
                key:field.key,target,oldid:box.profile.oldid,contractVersion:'native-infobox-values-1',
                condition:'per-template missing-accent typo; unique reviewed displayed native field; value bytes retained'});
        }
        for(const group of box.contract.groups){
            const family=v217InfoboxValueFamily(box,group.keys),present=box.fields.filter(field=>family.has(norm(field.key)));
            if(present.length!==2||present.some(field=>!group.keys.includes(field.key)||
                !profileAccepts(box.profile,field.key)||v2151FrozenBurialField(field.key)))continue;
            const empty=present.filter(field=>/^[ \t\r\n]*$/.test(field.value)),populated=present.filter(field=>field.value.trim());
            if(empty.length!==1||populated.length!==1||empty[0]===populated[0])continue;
            if(group.mode!=='presence'||group.keys.indexOf(populated[0].key)>=group.keys.indexOf(empty[0].key))continue;
            // A blank high-priority presence fallback is intentional output
            // suppression. It cannot be removed to expose a lower argument.
            add({start:empty[0].partStart-1,end:empty[0].partEnd,text:''},'v217InfoboxEmptyAliases',{
                key:empty[0].key,retainedKey:populated[0].key,kind:group.kind,mode:group.mode,
                oldid:box.profile.oldid,contractVersion:'native-infobox-values-1',
                condition:'populated higher-priority native argument already supplies the exact displayed value'});
        }
        if(!local.length)return [];
        local.sort((a,b)=>a.start-b.start||a.end-b.end);
        if(local.some((edit,index)=>index&&edit.start<local[index-1].end))return [];
        const canonical=v24SyntaxApply(box.raw,local),after=v2151FieldSyntaxParts(canonical);
        if(!after)return [];
        for(const field of box.fields.filter(field=>v2151FrozenBurialField(field.key)))
            if(local.some(edit=>edit.start<field.partEnd&&edit.end>field.partStart))return [];
        return [{start:box.node.start,end:box.node.end,text:canonical,ruleId:'v217InfoboxValues',proof:{
            sourceHash:v24SyntaxHash(source),template:box.name,oldid:box.profile.oldid,raw:box.raw,canonical,
            contractVersion:'native-infobox-values-1',edits:local,changeRules,
            minorSafe:local.every(edit=>edit.ruleId==='v217InfoboxEmptyAliases'),
            condition:'one literal principal native person infobox; native definition and anonymous parse contract; accepted names and all populated values retained; explicit empty defaults, dates, Wikidata and burial fields untouched'}}];
    }

function biographyPortalCandidates(source,cfg={}){const box=principalBiographyBox(source,cfg);if(!box)return[];const countries=biographyCountryPortal(box),subjects=new Set();biographySportsPortals(box).forEach(x=>subjects.add(x));(PROFESSIONAL_PORTALS[box.infobox]||[]).forEach(x=>subjects.add(x));if(BIOGRAPHY_MUSIC_BOXES.has(box.infobox))subjects.add('Música');for(const field of box.fields.filter(e=>v2213PortalValueAllowed(box,e)&&['ocupação','ocupacao','profissão','profissao'].includes(norm(e.key))))
for(const label of exactPortalOccupations(field.value))
(OCCUPATION_PORTALS[label]||[]).forEach(x=>subjects.add(x));if(subjects.has('Cinema'))subjects.add('Entretenimento');if([...subjects].some(x=>SPORT_PORTAL_IDENTITIES.has(portalIdentity(x))))subjects.add('Esportes');const woman=biographyIsWoman(source,cfg,box);const result=subjects.has('Esportes')?['Esportes',...[...subjects].filter(x=>portalIdentity(x)!=='desporto')]:[...subjects];if(woman)result.push('Mulheres');result.push(...countries);return[...new Set(result)].filter(x=>VERIFIED_BIOGRAPHY_PORTALS.has(portalIdentity(x)));}

function biographyCountryPortal(box){const nationalities=box.fields.filter(e=>v2213PortalValueAllowed(box,e)&&['nacionalidade','cidadania'].includes(norm(e.key))&&e.value.trim());if(nationalities.length){const countries=new Set();let uncertain=false;for(const field of nationalities){const values=explicitNationalityPortals(field.value);if(values.length!==1)uncertain=true;else values.forEach(x=>countries.add(x));}if(!uncertain&&countries.size===1)return[...countries];return[];}const dedicated=box.fields.filter(e=>v2213PortalValueAllowed(box,e)&&['país nascimento','pais nascimento','país de nascimento','pais de nascimento','nascimento país','nascimento pais','paisnatal'].includes(norm(e.key))&&e.value.trim());const places=box.fields.filter(e=>v2213PortalValueAllowed(box,e)&&['local nascimento','nascimento local','local de nascimento','nascimento cidade','cidade natal','cidadenatal'].includes(norm(e.key))&&e.value.trim());if(dedicated.length){const confirmed=dedicated.map(e=>v211ProductionCountries({fields:[{key:'país',value:e.value}]}));if(confirmed.some(row=>row.length!==1)||new Set(confirmed.flat()).size!==1)return[];const country=confirmed[0][0];if(places.some(e=>countryPortals(e.value).some(other=>portalIdentity(other)!==portalIdentity(country))))return[];return[country];}const confirmed=places.map(e=>countryPortals(e.value));if(confirmed.some(row=>row.length!==1)||new Set(confirmed.flat()).size!==1)return[];return confirmed.length?confirmed[0]:[];}

function v221BaselineMigrateForeignTemplate(raw,cfg,choiceTarget){const gaia=v219GaiaWrapperCall(raw,cfg,choiceTarget);if(gaia)return gaia;if(!v219NativeCitationCS1Consumer(raw))return{profile:translationProfile(raw),candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:{kind:'native-conditional-citation-consumer',nativeOldid:62525251}};const infoboxRefusal=v219ForeignInfoboxRefusal(raw);if(infoboxRefusal)return infoboxRefusal;const controlledHeader=v219CitationHeaderControlRefusal(raw);if(controlledHeader)return controlledHeader;const nativeWrapper=v219LocalCitationWrapperRefusal(raw);if(nativeWrapper)return nativeWrapper;const localOther=v219OtherNativeCall(raw,cfg);if(localOther)return localOther;const sourceCollector=v219BankSourceCall(raw,cfg);if(sourceCollector)return sourceCollector;const nativeReflist=v219NativeReflistCall(raw,cfg);if(nativeReflist)return{...nativeReflist,candidate:nativeReflist.text,profile:{nativeRenderer:true,kind:'renderer',target:'Referências',source:{language:'pt',title:'Predefinição:Reflist',oldid:56151616}}};const profile=translationProfile(raw);if(!profile|| !translationEnabled(profile,cfg))return null;const titreAmbiguity=v219NativeTitreAmbiguityCall(raw,profile);if(titreAmbiguity)return titreAmbiguity;const correctedURL=v219CorrectedCitationURLRefusal(raw,profile);if(correctedURL)return correctedURL;const dateWrapper=v219DateWrapperMigrationRefusal(raw,profile);if(dateWrapper)return dateWrapper;const shortCitation=v219NativeShortCitationRefusal(raw,profile);if(shortCitation)return shortCitation;const foreignShortCitation=v219ForeignShortCitationRefusal(raw,profile);if(foreignShortCitation)return foreignShortCitation;const listSlots=v219VariadicListSlotRefusal(raw,profile);if(listSlots)return listSlots;const refusal=v219NativeMixedParameterRefusal(raw,profile,cfg);if(refusal)return refusal;const identifier=v219NativeIdentifierActivationRefusal(raw,profile);if(identifier)return identifier;const local=v219LocalCitationRedirectCall(raw,cfg,profile);if(local)return local;const unprovedKey=v219CitationUnprovedKeyRefusal(raw,profile);if(unprovedKey)return unprovedKey;const crossRole=v219ForeignCitationCrossRoleRefusal(raw,profile);if(crossRole)return crossRole;const state=v219ForeignCitationStateRefusal(raw,profile);if(state)return state;const numbered=v219ForeignCitationNumberedRefusal(raw,profile);if(numbered)return numbered;const official=v219OfficialSiteCall(raw,cfg);if(official)return official;const p=parsedTemplate(raw),entries=foreignEntries(p),issues=[],issueEvidence=[];const sourceGroupDeclared=entries.some(entry=>['group','groupe','grupo'].includes(norm(entry.key)));if(v261LocalHatnoteName(p.parts[0])){const header=p.parts[0],space=header.match(/^(\s*)[\s\S]*?(\s*)$/);const candidate='{{'+space[1]+'Artigo principal'+space[2]+raw.slice(2+header.length);return{profile,candidate,text:candidate,blocked:false,issues:[]};}let target=choiceTarget||profile.target;const nativeOnlyIssues=profile.strictNativeCitation&&norm(target)==='citar jornal'?new Set():null;const message=(text,evidence={kind:'manual-review'})=>{if(!issues.includes(text)){issues.push(text);issueEvidence.push({...evidence,message:text});}};const fields=ownDictionary(profile.fields);const original=key=>entries.find(e=>norm(e.key)===norm(key)&&e.value.trim());if(profile.source.language==='fr'&&original('auteur institutionnel')&&entries.some(e=>/^(?:auteur|nom|prénom)\d*$/.test(norm(e.key))&&e.value.trim()))
message('Autor institucional e nomes pessoais presentes juntos. Confira os créditos de autoria.');if(profile.kind==='date'){const pos=entries.filter(e=>e.positional|| /^\d+$/.test(e.key));const day=pos.find(e=>e.key==='1')?.value.trim().replace(/^1er$/,'1'),month=pos.find(e=>e.key==='2')?.value.trim(),year=pos.find(e=>e.key==='3')?.value.trim();const m=/^\d+$/.test(month||'')?Number(month):MONTHS[norm(month||'')];const named=entries.filter(e=>!e.positional&& !/^\d+$/.test(e.key)&&e.value.trim());const age=named.find(e=>['âge','age'].includes(norm(e.key)));const simple=named.every(e=>['âge','age','liens'].includes(norm(e.key))&&['oui','non','yes','no','1','0'].includes(norm(e.value)));if(pos.length===3&& /^\d+$/.test(day||'')&& /^\d{4}$/.test(year||'')&&validDate(Number(day),m,Number(year))&&simple){target=profile.birth?'Dni':'DataExt';if(!profile.birth&&age&&['oui','yes','1'].includes(norm(age.value)))return{profile,blocked:true,issues:['Cálculo de idade fora de uma data de nascimento requer revisão.'],candidate:raw,text:raw};const candidate='{{'+target+'|'+Number(day)+'|'+m+'|'+year+(target==='Dni'&& !(age&&['oui','yes','1'].includes(norm(age.value)))?'|si':'')+'}}';return{profile,candidate,text:candidate,blocked:false,issues:[]};}return{profile,blocked:true,issues:['Data parcial, calendário ou formato sem equivalência confirmada.'],candidate:raw,text:raw};}if(profile.ambiguousWork&&original(profile.ambiguousWork)){if(!choiceTarget)message('Sammelwerk pode ser livro, revista ou jornal. Escolha o tipo de publicação.',{confirmed:true,kind:'publication-type'});if(target==='Citar livro'){fields.titel='capítulo';fields.sammelwerk='título';}else{fields.sammelwerk=target==='Citar jornal'?'jornal':'periódico';}}if(profile.kind==='infobox'&&profile.source.language==='fr'&& /biographie/i.test(profile.source.title))
message('A infocaixa francesa pode exibir dados do Wikidata que não estão no código. Confira a prévia antes de substituir.');if(profile.kind==='list'&&profile.variadic){const positions=entries.filter(e=>e.positional|| /^\d+$/.test(e.key));if(positions.every(e=>!/[\r\n]/.test(e.value.trim()))){if(positions.length){positions[0].key='1';positions[0].positional=true;positions[0].value='\n'+positions.map(e=>'* '+e.value.trim()).join('\n')+'\n';positions.slice(1).forEach(e=>e.remove=true);}}else message('Lista com entradas em mais de uma linha requer revisão.');}if(profile.nativeRenderer&&entries.some(e=>LEGACY_REFERENCE_COLUMNS.has(norm(e.key))&&e.value.trim())){return{profile,blocked:true,candidate:raw,text:raw,issues:['Parâmetro antigo de colunas ignorado pela predefinição atual. A configuração não foi ativada automaticamente. Confira a sugestão de duas colunas ou da apresentação automática.']};}if(profile.columnLayout){const layout=[];for(const e of entries){const k=norm(e.key),v=e.value.trim();if(k==='colonnes'||profile.nativeRenderer&&['col','cols','colunas'].includes(k)|| !profile.nativeRenderer&& /^1$/.test(k)){if(/^[1-6]$/.test(v)){layout.push('column-count:'+v);e.remove=true;}else if(v)message('Número de colunas não confirmado: '+v+'.');}else if(k==='taille'||['colwidth','largcol','larguracol'].includes(k)){if(/^\d+(?:\.\d+)?(?:em|px)?$/.test(v)){layout.push('column-width:'+v+(/(?:em|px)$/.test(v)?'':'em'));e.remove=true;}else if(v)message('Largura de colunas não confirmada: '+v+'.');}}if(layout.length){entries.push({index:p.parts.length,key:'estilo',value:layout.join(';')+';',lead:'',eq:'=',generated:true});p.parts.push('');}}let dateFields=[];if(profile.dateParts){const[dayKey,monthKey,yearKey]=profile.dateParts,day=original(dayKey),month=original(monthKey),year=original(yearKey);if(month||day){const m=month&&(/^\d+$/.test(month.value.trim())?Number(month.value):MONTHS[norm(month.value).replace(/\.$/,'')]);if(year&& /^\d{4}$/.test(year.value.trim())&&m&&(!day|| /^\d+$/.test(day.value.trim())&&validDate(Number(day.value),m,Number(year.value)))){if(original('date')||original('datum'))message('Data completa e componentes de data presentes ao mesmo tempo.');else{dateFields=[day,month,year].filter(Boolean);dateFields.forEach(e=>e.remove=true);entries.push({index:p.parts.length,key:'data',value:day?Number(day.value)+' de '+MONTH_PT[m]+' de '+year.value.trim():MONTH_PT[m]+' de '+year.value.trim(),lead:'',eq:'=',generated:true});p.parts.push('');}}else message('Componentes de data incompletos ou inválidos.');}}const targetProfile=INFOBOX_CATALOG[norm(target)]||TEMPLATE_CATALOG[norm(target)];const citationKeys=CITATION_KEY_CATALOG[norm(target)]||CS1_KEYS;function accepts(key){if(profile.kind==='citation')return profile.strictNativeCitation?!!targetProfile&&(profileAccepts(targetProfile,key)||v219NumberedCitationAccepts(targetProfile,key,raw,profile)):citationKeys.includes(key)||citationKeys.includes(key.replace(/\d+$/,'#'));if(profile.kind==='infobox')return!!targetProfile&&infoboxAccepts(targetProfile,key);const local={Oficial:['1','nome'],Lang:['1','2'],Nre:['1','nome','grupo','conteúdo','name','group','reference','content','text','referência','texto'],Referências:['grupo','refs','título','estilo','nível','estilolista','extra'],Notas:['grupo','refs'],'Lista simples':['1','classe','estilo','indent','indentação'],'Controle de autoridade':AUTHORITY_ARGUMENTS}[target];return local?local.includes(key):!!targetProfile&&infoboxAccepts(targetProfile,key);}const nativeSourceProfile=INFOBOX_CATALOG[p.name],nativeInfoboxFields=profile.kind==='infobox'&&v2213BiographyProfile(nativeSourceProfile)?foreignEntries(p):null;const subtitles=[];for(const e of entries){if(e.remove||e.generated)continue;if(v219NativeMixedCitationField(raw,profile,e))continue;if(profile.kind==='infobox'&&INFOBOX_CATALOG[p.name]&&v215LiteralTemplateIdentity(raw)&&v2151FrozenBurialField(e.key))continue;if(profile.kind==='citation'&&v219NativeCitationStateInterface(raw)&&nativeCitationAccepts(p,e.key)&&v219CitationUrlState(e.key,e.value))continue;const key=norm(e.key),value=e.value.trim();if(profile.subtitles?.[key]){subtitles.push({entry:e,target:profile.subtitles[key]});continue;}if(e.positional|| /^\d+$/.test(key)){if(profile.kind==='list'){if(e.index===1&&e.key==='1'&& /(?:^|\n)\s*[*#]/.test(e.value)){e.key='1';e.positional=true;}else if(value)message('A lista sem marcadores requer conversão das entradas antes de usar Lista simples.');}else if(profile.maxPos!==undefined&&Number(key)<=profile.maxPos){}else if(value)message('Parâmetro posicional sem equivalência: '+e.key+'.');continue;}if(key==='titre'&&v219NativeTitreContext(raw))continue;let mapped=fields[key];if(!mapped&&profile.numbered){const match=key.match(/^(.*?)(\d+)$/);if(match&&profile.numbered[match[1]]){const pattern=profile.numbered[match[1]];mapped=pattern.includes('#')?v219CitationNumberedTarget(profile,match[1],match[2],pattern):pattern+match[2];}}if(!mapped&&profile.kind==='citation'){if(/^(?:doi|isbn\d*|issn\d*|pmid|pmc|oclc|jstor|bibcode|arxiv|zbl|lccn|hdl|s2cid|volume|url|ref)$/.test(key))mapped=key;else if(accepts(e.key))mapped=citationParam(e.key,nameOf(target));}if(!mapped&&accepts(e.key))mapped=e.key;if(nativeInfoboxFields&&(profileAccepts(nativeSourceProfile,e.key)||mapped&&v2213AliasRenameBlocked(nativeSourceProfile,nativeInfoboxFields,e.key,mapped)))continue;
if(norm(target)==='nre'&&mapped==='grupo')mapped='group';if(!mapped|| !accepts(mapped)){if(value){const issue='Campo sem equivalência confirmada: '+e.key+'.',candidate=mapped||citationParam(e.key,nameOf(target));message(issue,{kind:'catalog-gap',parameter:e.key});if(nativeOnlyIssues&&(citationKeys.includes(candidate)||citationKeys.includes(candidate.replace(/\d+$/,'#'))))nativeOnlyIssues.add(issue);}continue;}e.key=mapped;e.positional=false;if(['data','ano','acessodata','arquivodata'].includes(mapped)&&cfg.dates)e.value=v219ScalarValueWithPadding(e.value,translationDate(e.value,message));if(['nascimento_data','morte_data','lançamento'].includes(mapped)&&cfg.dates&& !/[{}]/.test(e.value))e.value=v219ScalarValueWithPadding(e.value,translationDate(e.value,message));const language=profile.kind==='citation'?v219CitationLanguageFieldValue(raw,e.index,cfg,profile):null;if(language)e.value=v219ScalarValueWithPadding(e.value,language.code);if(mapped==='urlmorta'||['subscricao','registro'].includes(mapped)){const bool=norm(value);if(['sí','si','yes','ja','oui','sim','true','1'].includes(bool))e.value='sim';else if(['no','nein','non','não','false','0','off','-'].includes(bool))e.value='não';else if(value)message('Estado da ligação ou de acesso requer revisão: '+e.key+'='+value+'.');}if(mapped==='acessourl'&&profile.source.language==='fr'){const levels={inscription:'registo',payant:'subscrição','limité':'limitado'};if(levels[norm(value)])e.value=levels[norm(value)];else if(value)message('Condição de acesso francesa sem equivalente confirmado: '+value+'.');}if(key==='et al.'){if(['oui','yes','sim','1'].includes(norm(value)))e.value='et al';else if(value)message('Valor de et al. requer revisão.');}if(mapped==='duração'){const duration=value.match(/^(\d+)\s*(?:minutes?|minutos?|minuten|min\.?|mn)?$/i);if(duration)e.value=duration[1];else if(value)message('Unidade de duração não confirmada.');}if(mapped==='url'&&value&& !/^(?:https?:\/\/|\/\/|\{\{)/i.test(value))message('O campo '+e.key+' contém texto ou uma ligação formatada, não apenas uma URL.');if(norm(target)==='nre'&&mapped==='group'&& !['nota','upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'].includes(value))
message('Grupo de nota não suportado por Nre: '+value+'.');}for(const subtitle of subtitles){const title=entries.find(e=>!e.remove&&e.key===subtitle.target&&e!==subtitle.entry);if(title?.value.trim()){title.value=title.value.trim()+(/[:.,]$/.test(title.value.trim())?' ':': ')+subtitle.entry.value.trim();subtitle.entry.remove=true;}else if(subtitle.entry.value.trim())message('Subtítulo sem título correspondente.');}if(profile.kind==='notesRenderer'){const group=entries.find(e=>e.key==='grupo')?.value.trim()||profile.defaultGroup||'lower-alpha';if(!sourceGroupDeclared){entries.push({index:p.parts.length,key:'grupo',value:group,lead:'',eq:'='});p.parts.push('');}if(group!=='nota'&&group!=='lower-alpha')target='Referências';if(target==='Referências'){entries.push({index:p.parts.length,key:'título',value:'Notas',lead:'',eq:'='});p.parts.push('');}}const collision=v219ForeignCitationRoleCollision(raw,profile,target,entries);if(collision)return{profile,candidate:raw,text:raw,blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],proof:collision};const seen=new Map();for(const e of entries.filter(e=>!e.remove)){if(norm(e.key)==='titre'&&v219NativeTitreContext(raw))continue;const family=e.positional?e.key:parameterFamily(e.key);if(seen.has(family)){if(seen.get(family).value.trim()===e.value.trim()){if(cfg.automaticParameterDuplicates!==false)e.remove=true;}else message('Campos conflitantes para '+e.key+'.',{confirmed:true,kind:'field-conflict',parameter:e.key});}else seen.set(family,e);}if(!nativeInfoboxFields&&norm(p.parts[0])!==norm(target)&&!v219NativeMixedCitationIdentity(raw,profile))p.parts[0]=target;const candidate=translatedEntries(p,entries);return{profile,candidate,issues,issueEvidence,blocked:issues.length>0,text:issues.length?raw:candidate,quietNativeRefusal:!!nativeOnlyIssues&&issues.length>0&&issues.every(issue=>nativeOnlyIssues.has(issue))};}

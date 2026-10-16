    Object.assign(GROUP_LABELS,{redundantBirthCategory:'Categoria de nascimento já gerada pela data retirada'});
    const V283_BIRTH_CATEGORY_TTL=300000,V283_BIRTH_CATEGORY_GET_LIMIT=6500;
    const V283_DNI_ALIASES=new Set(['Dni','DNI','Nascimento e idade','Data de nascimento']);
    function v283BirthTitle(value) {return String(value||'').normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim();}
    function v283DniName(value) {
        const name=v283BirthTitle(value).replace(/^(?:Predefinição|Template)\s*:\s*/i,'');
        return name&&V283_DNI_ALIASES.has(name[0].toLocaleUpperCase('pt')+name.slice(1));
    }
    function v283Dni(value) {
        if(!/^\{\{[^{}<>\r\n]*\}\}$/.test(value))return null;const parsed=parsedTemplate(value);
        if(!v283DniName(parsed.parts[0]))return null;const fields=new Map();let position=1;
        for(const part of parsed.parts.slice(1)){
            const equal=part.indexOf('='),key=equal<0?String(position++):part.slice(0,equal).trim(),raw=(equal<0?part:part.slice(equal+1)).trim();
            if(fields.has(key)||!['1','2','3','4','lang','nowrap','nocat','circa','c'].includes(key)||/[{}<>\r\n]/.test(raw))return null;
            fields.set(key,raw);
        }
        if(fields.get('nocat')||fields.get('circa')||fields.get('c')||fields.has('4')&&!['','si','sem idade'].includes(fields.get('4').toLocaleLowerCase('pt'))||fields.get('lang')&&!['br','pt'].includes(fields.get('lang').toLocaleLowerCase('pt')))return null;
        const rawYear=fields.get('3');if(!rawYear||!/^[1-9]\d{3}$/.test(rawYear))return null;
        const year=Number(rawYear),today=new Date();if(year>today.getUTCFullYear())return null;
        const numbers=['1','2'].map(key=>{const raw=fields.get(key)||'';return raw===''?0:/^\d{1,2}$/.test(raw)?Number(raw):NaN;}),[day,month]=numbers;
        if(!Number.isInteger(day)||!Number.isInteger(month)||month<0||month>12||day<0||day>31||day&&!month||day&&month&&!validDate(day,month,year))return null;
        if(year===today.getUTCFullYear()&&(month>today.getUTCMonth()+1||month===today.getUTCMonth()+1&&day>today.getUTCDate()))return null;
        return {year,day,month,raw:value};
    }
    function v283BirthCategoryCandidate(source,cfg={}) {
        if(typeof source!=='string'||cfg.redundantBirthCategories===false||cfg.categories===false||cfg.endMatter===false||cfg.namespaceNumber!==0||!v283BirthTitle(cfg.pageTitle)||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||!v24SyntaxScope(cfg)||!/\[\[\s*(?:Categoria|Category)\s*:\s*[Nn]ascidos[ _]+em[ _]+[1-9]\d{3}/i.test(source))return null;
        if(/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(protectedView(source)))return null;
        const box=v28PrincipalPersonBox(source,cfg);if(!box||box.raw!==box.sourceRaw||!biographySubjectMatchesTitle(box,cfg.pageTitle)||box.fields.some(field=>field.value.trim()&&!profileAccepts(box.profile,field.key)))return null;
        const contract=V28_DATE_FIELDS[box.name];if(!contract)return null;const keys=new Set(contract.birth.map(norm)),births=box.fields.filter(field=>keys.has(norm(field.key)));
        if(births.length!==1||!profileAccepts(box.profile,births[0].key))return null;
        const parts=v28DateValueParts(births[0].value),dni=parts&&v283Dni(parts.core);if(!dni)return null;
        const boxTemplates=templates(protectedView(box.raw)).nodes.filter(node=>v283DniName(parsedTemplate(box.raw.slice(node.start,node.end)).parts[0]));
        if(boxTemplates.length!==1||/\{\{\{|\{\{\s*#|<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(box.raw))return null;
        let encodedLength;try{encodedLength=encodeURIComponent(box.raw).length+encodeURIComponent(v283BirthTitle(cfg.pageTitle)).length+160;}catch(_){return null;}if(encodedLength>V283_BIRTH_CATEGORY_GET_LIMIT)return null;
        const view=protectedView(source),ranges=[...templates(view).nodes,...refTokens(view),...tableAnalysis(view).tables],edits=[],year=String(dni.year),category='Nascidos em '+year;
        if(/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(view))return null;
        for(const match of view.matchAll(/\[\[([\s\S]*?)\]\]/g)){
            const colon=match[1].indexOf(':');if(colon<0||!['categoria','category'].includes(norm(match[1].slice(0,colon))))continue;
            const body=match[1].slice(colon+1),pipe=body.indexOf('|'),title=v283BirthTitle(pipe<0?body:body.slice(0,pipe)),normalized=title?title[0].toLocaleUpperCase('pt')+title.slice(1):'';
            if(!normalized.startsWith('Nascidos em '))continue;
            if(normalized!==category||pipe>=0||ranges.some(range=>range.start<=match.index&&match.index<range.end))return null;
            const start=source.lastIndexOf('\n',match.index-1)+1,linkEnd=match.index+match[0].length,next=source.indexOf('\n',linkEnd),end=next<0?source.length:next+1;
            if(match.index<box.node.end||source.slice(start,match.index).trim()||source.slice(linkEnd,next<0?source.length:next).trim())return null;
            edits.push({start,end,text:'',ruleId:'redundantBirthCategory'});
        }
        if(!edits.length)return null;
        return {source,sourceHash:v24SyntaxHash(source),pageTitle:v283BirthTitle(cfg.pageTitle),namespaceNumber:0,year:dni.year,category,renderSource:box.raw,encodedLength,infobox:{name:box.name,raw:box.raw,start:box.node.start,end:box.node.end,birthKey:births[0].key,dniRaw:parts.core},edits};
    }
    function v283BirthCategorySignature(candidate) {
        return candidate&&JSON.stringify([candidate.sourceHash,candidate.pageTitle,candidate.namespaceNumber,candidate.year,candidate.category,candidate.renderSource,candidate.infobox,candidate.edits]);
    }
    function v283BirthCategoryContext(value) {
        if(!value||value.namespaceNumber!==0||!v283BirthTitle(value.pageTitle)||!Number.isInteger(value.pageId)||value.pageId<=0||!Number.isInteger(value.revisionId)||value.revisionId<=0||value.section!==null)return null;
        return {pageTitle:v283BirthTitle(value.pageTitle),namespaceNumber:0,pageId:value.pageId,revisionId:value.revisionId,section:null};
    }
    function v283BirthCategoryProof(candidate,response,context,now=Date.now()) {
        const bound=v283BirthCategoryContext(context);if(!candidate||!bound||!Number.isFinite(now)||bound.pageTitle!==candidate.pageTitle||response?.error||response?.warnings&&Object.keys(response.warnings).length)return null;
        const fresh=v283BirthCategoryCandidate(candidate.source,{...DEFAULTS,...bound});if(!fresh||v283BirthCategorySignature(fresh)!==v283BirthCategorySignature(candidate))return null;
        const parsed=response?.parse;if(!parsed||v283BirthTitle(parsed.title)!==bound.pageTitle||parsed.parsewarnings?.length||parsed.warnings&&Object.keys(parsed.warnings).length||!Array.isArray(parsed.categories))return null;
        const matches=parsed.categories.filter(category=>v283BirthTitle(category.category??category['*']??category.title)===candidate.category);
        if(matches.length!==1||matches[0].sortkey!=='')return null;
        return {kind:'rendered-birth-category',version:1,source:candidate.source,sourceHash:candidate.sourceHash,context:bound,candidateSignature:v283BirthCategorySignature(candidate),renderSource:candidate.renderSource,category:candidate.category,sortkey:'',responseTitle:v283BirthTitle(parsed.title),checkedAt:now,expiresAt:now+V283_BIRTH_CATEGORY_TTL};
    }
    function v283BirthCategoryEdits(source,cfg={}) {
        const proof=cfg.birthCategoryProof,context=v283BirthCategoryContext(cfg.birthCategoryContext),now=Date.now();
        if(!proof||!context||proof.kind!=='rendered-birth-category'||proof.version!==1||proof.source!==source||proof.sourceHash!==v24SyntaxHash(source)||JSON.stringify(proof.context)!==JSON.stringify(context)||context.pageTitle!==v283BirthTitle(cfg.pageTitle)||context.namespaceNumber!==cfg.namespaceNumber||!Number.isFinite(proof.checkedAt)||!Number.isFinite(proof.expiresAt)||proof.checkedAt>now||proof.expiresAt!==proof.checkedAt+V283_BIRTH_CATEGORY_TTL||proof.expiresAt<=now||proof.sortkey!==''||proof.responseTitle!==context.pageTitle)return [];
        const candidate=v283BirthCategoryCandidate(source,cfg);if(!candidate||proof.candidateSignature!==v283BirthCategorySignature(candidate)||proof.renderSource!==candidate.renderSource||proof.category!==candidate.category)return [];
        return candidate.edits.map(edit=>({...edit,proof:{sourceHash:candidate.sourceHash,category:candidate.category,infobox:candidate.infobox,context,checkedAt:proof.checkedAt,expiresAt:proof.expiresAt,condition:'current anonymous parse of the exact principal infobox generates the same unkeyed birth-year category; only matching standalone unpiped category lines are removed'}}));
    }
    function v283BirthCategoryPlan(source,cfg={}) {const edits=v283BirthCategoryEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};}
    function v283BirthCategoryPlanProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v283BirthCategoryPlan(before,cfg);
        return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v283BirthCategoryProjection(source,cfg={}) {return v283BirthCategoryPlan(source,cfg).text;}
    function v283BirthCategoryInventory(source,cfg={}) {
        const noop=()=>{};let view=protectedView(source);
        view=foreignSyntax(removeObsoleteShortDescriptionCategory(view,cfg,noop,noop),cfg,noop,noop);
        const stack=[],links=[];
        for(let at=0;at<view.length-1;at++){
            if(view.slice(at,at+2)==='[['){stack.push(at);at++;}
            else if(view.slice(at,at+2)===']]'&&stack.length){links.push({start:stack.pop(),end:at+2});at++;}
        }
        const categories=new Map();
        for(const link of links.sort((a,b)=>a.start-b.start)){
            const raw=view.slice(link.start+2,link.end-2),match=/^\s*(?:Categoria|Category)\s*:([\s\S]*)$/i.exec(raw);if(!match)continue;
            const pipe=match[1].indexOf('|'),body=pipe<0?match[1]:match[1].slice(0,pipe),title=v283BirthTitle(body);if(!title)continue;
            const key=title[0].toLocaleUpperCase('pt')+title.slice(1),sort=pipe<0?null:match[1].slice(pipe+1),keys=categories.get(key)||[];
            if(!keys.length||keys[keys.length-1]!==sort)keys.push(sort);categories.set(key,keys);
        }
        const sorts=[];
        for(const node of templates(view).nodes){const raw=view.slice(node.start,node.end),match=/^\{\{\s*(?:DEFAULTSORT|ORDENAÇÃO)\s*:([\s\S]*)\}\}$/i.exec(raw);if(match)sorts.push(match[1]);}
        return JSON.stringify([[...categories].sort((a,b)=>a[0].localeCompare(b[0])),sorts.length&&sorts.every(value=>value===sorts[0])?[sorts[0]]:sorts]);
    }
    function v283BirthCategoryRetention(before,after,options={}) {
        if(before===after||!options.birthCategoryProof)return {accepted:true,reason:''};
        const cfg={...DEFAULTS,...options},expected=v283BirthCategoryProjection(before,cfg),actual=v283BirthCategoryInventory(after,cfg);
        return actual===v283BirthCategoryInventory(expected,cfg)||actual===v283BirthCategoryInventory(before,cfg)?{accepted:true,reason:''}:{accepted:false,reason:'Uma categoria ou sua chave de ordenação foi alterada além da retirada confirmada do ano de nascimento.'};
    }
    function preservationAudit(before,after,options={}) {
        const findings=v283PreviousPreservationAudit(before,after,options),proof=v283BirthCategoryRetention(before,after,options);
        if(!proof.accepted)findings.push({code:'lost-category',message:proof.reason,start:-1,severity:'warning'});
        return findings;
    }
    function safeComposition(before,after,options={}) {
        const proof=v283BirthCategoryRetention(before,after,options);return proof.accepted?v283PreviousSafeComposition(before,after,options):proof.reason;
    }

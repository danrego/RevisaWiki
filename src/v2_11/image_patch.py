"""Require source-bound public photograph evidence before adding a thumbnail."""


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Lead image patch anchor absent or repeated: ' + before[:90])
    return source.replace(before, after, 1)


MODULE = r'''
    function v211LeadFileTitle(value) {
        if(typeof value!=='string')return null;
        const name=value.trim().replace(/^(?:Ficheiro|Arquivo|Imagem|File|Image)\s*:\s*/i,'').replace(/_/g,' ').normalize('NFC');
        if(!name||/[{}<>\[\]|\r\n\uE000\uE001]/.test(name))return null;
        return 'Ficheiro:'+name[0].toLocaleUpperCase('pt')+name.slice(1);
    }
    function v211LeadImageBlockedLabel(value) {
        return /(?:^|[\s._:/-])(?:coats?[\s_-]+of[\s_-]+arms|maps?|mapas?|charts?|gr[aá]ficos?|diagrams?|diagramas?|flags?|bandeiras?|signatures?|assinaturas?|logos?|logotipos?|emblemas?|bras(?:ão|ões|ao|oes)|panoramas?|panoramic|panor[aâ]mica)(?:[\s._:/-]|$)/iu.test(value);
    }
    function v211LeadImageCandidate(source,cfg={}) {
        if(typeof source!=='string'||!cfg.markup||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null||
            cfg.pageRedirect||cfg.pageDisambiguation||/^(?:lista|listas|anexo)(?:\s|:)/.test(norm(cfg.pageTitle||'')))return null;
        const view=protectedView(source),firstHeading=view.search(/^={1,6}[^=\n].*?={1,6}[ \t]*$/m),limit=firstHeading<0?view.length:firstHeading;
        if(/^\s*#(?:REDIRECT|REDIRECIONAMENTO)\b/i.test(view)||/~{4}/.test(view))return null;
        const leadTemplates=topNodes(view);
        if(leadTemplates.some(n=>/^(?:info(?:\/|$)|infobox\b|infocaixa\b|desambig(?:uação)?$|disambig$)/.test(parsedTemplate(source.slice(n.start,n.end)).name)))return null;
        const ranges=structuralRanges(view),stack=[],images=[];
        for(let at=0;at<limit-1;at++){
            const pair=view.slice(at,at+2);
            if(pair==='[['){stack.push(at);at++;}
            else if(pair===']]'&&stack.length){const start=stack.pop(),end=at+2;at++;
                if(stack.length||inRange(start,ranges))continue;
                const raw=source.slice(start,end);if(/^\[\[\s*(?:Ficheiro|Arquivo|Imagem|File|Image)\s*:/i.test(raw))images.push({start,end,raw});
            }
        }
        if(images.length!==1)return null;
        const image=images[0],lineStart=view.lastIndexOf('\n',image.start-1)+1,lineEndAt=view.indexOf('\n',image.end),lineEnd=lineEndAt<0?view.length:lineEndAt;
        if(image.start!==lineStart||view.slice(image.end,lineEnd).trim()||/[\r\n{}\uE000\uE001]/.test(image.raw)||
            inRange(image.start,v27SafeMarkdownRanges(view))||[...image.raw.matchAll(/\[\[\s*(?:Ficheiro|Arquivo|Imagem|File|Image)\s*:/gi)].length!==1)return null;
        const html=[];for(let at=0;at<image.start;){const tag=tagAt(view,at);if(!tag){at++;continue;}
            if(!tag.self&&!['br','hr','wbr','img','input','meta','link','area','base','col','embed','param','source','track'].includes(tag.name)){
                if(!tag.close)html.push(tag.name);else{const index=html.lastIndexOf(tag.name);if(index>=0)html.splice(index);}
            }at=tag.end;
        }
        if(html.length)return null;
        const parts=splitParts(image.raw.slice(2,-2)),title=v211LeadFileTitle(parts[0]);
        if(!title||! /\.(?:jpe?g|png|webp|tiff?)$/i.test(title)||v211LeadImageBlockedLabel(title))return null;
        let caption=false,alternative=false;
        for(const part of parts.slice(1)){
            if(/^\s*(?:alt|alternativo|texto alternativo)\s*=/i.test(part)){if(alternative)return null;alternative=true;continue;}
            if(!part.trim()||preservationImageOption(part)||/^\s*[^\[\]<>]*=/.test(part)||caption)return null;
            caption=true;
        }
        const insert=image.start+2+parts[0].length;
        return {...image,title,insert,caption:parts.slice(1).join('|')};
    }
    function v211LeadImageRational(value) {
        if(typeof value==='number')return Number.isFinite(value)&&value>0?value:null;
        if(typeof value!=='string'||!/^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(value.trim()))return null;
        const numbers=value.trim().split('/').map(Number),result=numbers.length===2?numbers[0]/numbers[1]:numbers[0];
        return Number.isFinite(result)&&result>0?result:null;
    }
    function v211LeadPhotoEvidence(response,candidate) {
        if(!response||!candidate)return null;
        const pages=response.query?.pages;if(!Array.isArray(pages))return null;
        const matching=pages.filter(p=>p&&typeof p==='object'&&p.ns===6&&p.imagerepository==='shared'&&v211LeadFileTitle(p.title||'')===candidate.title);
        if(matching.length!==1)return null;
        const page=matching[0];if(!Array.isArray(page.imageinfo)||page.imageinfo.length!==1)return null;
        const info=page.imageinfo[0];if(!info||typeof info!=='object')return null;
        const width=info.width,height=info.height;
        if(info.mediatype!=='BITMAP'||!['image/jpeg','image/png','image/webp','image/tiff'].includes(info.mime)||
            !Number.isInteger(width)||!Number.isInteger(height)||Math.min(width,height)<480||Math.max(width,height)<1000||
            width/height<0.5||width/height>2||typeof info.sha1!=='string'||! /^[a-z0-9]{31,40}$/i.test(info.sha1))return null;
        if(typeof info.url!=='string'||typeof info.descriptionurl!=='string')return null;
        try{
            const file=new URL(info.url),description=new URL(info.descriptionurl);
            if(file.protocol!=='https:'||file.hostname!=='upload.wikimedia.org'||file.username||file.password||
                !file.pathname.startsWith('/wikipedia/commons/')||
                v211LeadFileTitle(decodeURIComponent(file.pathname.split('/').at(-1)))!==candidate.title||description.protocol!=='https:'||description.hostname!=='commons.wikimedia.org'||
                description.username||description.password||!description.pathname.startsWith('/wiki/File:')||
                v211LeadFileTitle(decodeURIComponent(description.pathname.slice('/wiki/'.length)))!==candidate.title)return null;
        }catch(_){return null;}
        const categoryField=info.extmetadata?.Categories;
        if(!categoryField||categoryField.source!=='commons-categories'||typeof categoryField.value!=='string'||/[<>]/.test(categoryField.value))return null;
        const categories=categoryField.value.split('|').map(v=>v.trim()).filter(Boolean);
        if(!categories.length||categories.some(v211LeadImageBlockedLabel))return null;
        const metadata=new Map(),wanted=new Set(['Make','Model','ExposureTime','FNumber','FocalLength']);
        for(const item of Array.isArray(info.metadata)?info.metadata:[]){if(!wanted.has(item?.name))continue;if(metadata.has(item.name))return null;metadata.set(item.name,item.value);}
        const make=metadata.get('Make'),model=metadata.get('Model');
        if(typeof make!=='string'||typeof model!=='string'||!make.trim()||!model.trim()||make.length>80||model.length>120||/[<>\r\n]/.test(make+model))return null;
        const exposure=v211LeadImageRational(metadata.get('ExposureTime')),aperture=v211LeadImageRational(metadata.get('FNumber')),focal=v211LeadImageRational(metadata.get('FocalLength'));
        if(!exposure||exposure>3600||!aperture||aperture>128||!focal||focal>3000)return null;
        const camera=norm(model).startsWith(norm(make)+' ')?model.trim():make.trim()+' '+model.trim();
        const category=categories.find(value=>norm(value)===norm('Taken with '+camera));if(!category)return null;
        // Only evidence needed for the layout decision survives the public read.
        // Camera serials, GPS, authors, contacts and capture dates are discarded.
        return {title:candidate.title,repository:'shared',width,height,mediatype:info.mediatype,mime:info.mime,sha1:info.sha1,
            url:info.url,descriptionurl:info.descriptionurl,category,make:make.trim(),model:model.trim(),exposure,aperture,focal,excludedClassification:false};
    }
    function v211LeadImageProof(source,cfg,response) {
        const candidate=v211LeadImageCandidate(source,cfg);if(!candidate)return null;
        const evidence=v211LeadPhotoEvidence(response,candidate);if(!evidence)return null;
        return {schema:1,source,title:cfg.pageTitle,namespace:0,fullPage:true,
            image:{start:candidate.start,end:candidate.end,raw:candidate.raw,title:candidate.title},evidence};
    }
    function v211LeadImageProofValid(source,cfg,proof) {
        if(!proof||proof.schema!==1||proof.source!==source||proof.title!==cfg.pageTitle||proof.namespace!==0||proof.fullPage!==true)return null;
        const candidate=v211LeadImageCandidate(source,cfg);if(!candidate||!proof.image||
            candidate.start!==proof.image.start||candidate.end!==proof.image.end||candidate.raw!==proof.image.raw||candidate.title!==proof.image.title)return null;
        const e=proof.evidence;if(!e||e.excludedClassification!==false)return null;
        const response={query:{pages:[{ns:6,title:e.title,imagerepository:e.repository,imageinfo:[{width:e.width,height:e.height,mediatype:e.mediatype,mime:e.mime,sha1:e.sha1,url:e.url,descriptionurl:e.descriptionurl,
            metadata:[{name:'Make',value:e.make},{name:'Model',value:e.model},{name:'ExposureTime',value:e.exposure},{name:'FNumber',value:e.aperture},{name:'FocalLength',value:e.focal}],
            extmetadata:{Categories:{source:'commons-categories',value:e.category}}}]}]}};
        const confirmed=v211LeadPhotoEvidence(response,candidate);return confirmed?candidate:null;
    }
    function v211AutomaticLeadImage(source,cfg,bump=()=>{}) {
        const image=v211LeadImageProofValid(source,cfg,cfg.leadImageProof);if(!image)return source;
        bump('leadImageThumbnail');return source.slice(0,image.insert)+'|miniatura'+source.slice(image.insert);
    }
    const v211LeadImageReadCache=new Map();
    async function v211PrepareLeadImage(task,options) {
        const cfg={...options};delete cfg.leadImageProof;
        const candidate=v211LeadImageCandidate(task.source,cfg);
        if(!candidate||typeof root.fetch!=='function')return cfg;
        const controller=typeof root.AbortController==='function'?new root.AbortController():null;
        if(!controller)return cfg;
        task.preflightRequests ||= [];const pending={abort:()=>controller.abort()};task.preflightRequests.push(pending);
        const timer=root.setTimeout(()=>controller.abort(),5000);
        try{
            let cached=v211LeadImageReadCache.get(candidate.title);
            if(!cached||Date.now()-cached.time>120000){
                const query=new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'imageinfo',titles:candidate.title,
                    iiprop:'size|mediatype|mime|sha1|metadata|extmetadata|url',iiextmetadatafilter:'Categories'});
                const response=await root.fetch('https://pt.wikipedia.org/w/api.php?'+query.toString(),
                    {method:'GET',credentials:'omit',signal:controller.signal,headers:{Accept:'application/json'}});task.guard();
                if(response.status!==200)return cfg;
                const data=await response.json();task.guard();
                // Cache only the allowlisted proof evidence, never the full EXIF response.
                const evidence=v211LeadPhotoEvidence(data,candidate);cached={time:Date.now(),evidence};
                if(v211LeadImageReadCache.size>=8)v211LeadImageReadCache.clear();v211LeadImageReadCache.set(candidate.title,cached);
            }
            if(cached.evidence){const e=cached.evidence;cfg.leadImageProof={schema:1,source:task.source,title:cfg.pageTitle,namespace:0,fullPage:true,
                image:{start:candidate.start,end:candidate.end,raw:candidate.raw,title:candidate.title},evidence:{...e}};}
        }catch(_){task.guard();if(v211LeadImageReadCache.size>=8)v211LeadImageReadCache.clear();v211LeadImageReadCache.set(candidate.title,{time:Date.now(),evidence:null});}finally{root.clearTimeout(timer);const index=task.preflightRequests.indexOf(pending);if(index>=0)task.preflightRequests.splice(index,1);}
        return cfg;
    }
'''


def apply(source):
    source=once(source,'    function imageTargets(source) {',MODULE+'\n    function imageTargets(source) {')
    source=once(source,"        infoboxAlignment:'Alinhamento dos campos da infocaixa',", "        leadImageThumbnail:'Fotografia inicial com tamanho de miniatura',\n        infoboxAlignment:'Alinhamento dos campos da infocaixa',")
    source=once(source,'        const safeRepairs=automaticSafeRepairs(source,cfg,bump);','        const imageAdjusted=v211AutomaticLeadImage(source,cfg,bump);\n        const safeRepairs=automaticSafeRepairs(imageAdjusted,cfg,bump);')
    source=once(source,'const proofs = await prepareAutomaticProofs(task,currentOptions(true));','const proofs = await v211PrepareLeadImage(task,await prepareAutomaticProofs(task,currentOptions(true)));')
    source=once(source,"'birthCategoryContext','birthCategoryProof'])", "'birthCategoryContext','birthCategoryProof','leadImageProof'])")
    source=once(source,"['authorityData','footerProfiles','biographyGenderProof','birthCategoryContext','birthCategoryProof'].includes(key)", "['authorityData','footerProfiles','biographyGenderProof','birthCategoryContext','birthCategoryProof','leadImageProof'].includes(key)")
    source=once(source,'templateTargets, fragmentTargets, imageTargets, normalizeFragment, renderedAudit,', 'templateTargets, fragmentTargets, imageTargets, v211LeadFileTitle, v211LeadImageCandidate, v211LeadPhotoEvidence, v211LeadImageProof, v211LeadImageProofValid, v211AutomaticLeadImage, v211PrepareLeadImage, normalizeFragment, renderedAudit,')
    return source

    // Guard-only source projection for separately enabled native citation
    // cosmetics. It never runs the general reference normalizer with refs off.
    function v219NestedCitationFields(raw,owner=false) {
        const parts=v215BraceParts(raw.slice(2,-2));if(!parts?.length)return null;
        const fields=[],seen=new Set();
        for(const part of parts.slice(1)){
            const match=/^([ \t\r\n]*)([^=\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            if(!match)return null;
            const key=match[2].replace(/^[ \t]+|[ \t]+$/g,'');
            if(!key||seen.has(key)||/[{}<>]/.test(key)||!owner&&/[{}<>]/.test(match[4])||
                /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(key+match[4]))return null;
            seen.add(key);fields.push({key,value:match[4],prefix:match[1]+match[2]+match[3],
                start:2+part.start+match[1].length+match[2].length+match[3].length,end:2+part.end});
        }
        return {head:parts[0].text,fields};
    }
    function v219NestedCitationContext(raw) {
        const context=v219NormalizedNativeCitationContext(raw),proof=context&&v219SourceNativeContract(raw,context);
        if(proof&&proof.aliasOldid===null)return {...context,localAliasOldid:null};
        // This additional local redirect has its own captured native chain.
        // Its compact runtime catalog retains the target oldid and redirectTo;
        // alias57056957 is bound separately by the primary source contract.
        const parsed=parsedTemplate(raw),alias=TEMPLATE_CATALOG[parsed.name],profile=TEMPLATE_CATALOG['citar revista'];
        if(!v215SameTemplateTitle(parsed.parts[0],'Citar publicação')||!v215LiteralTemplateIdentity(raw,alias)||
            alias?.redirectTo!=='citar revista'||alias.oldid!==68628855||
            profile?.oldid!==68628855||v219CitationHeaderControlRefusal(raw)||
            !profile.dependencies?.some(row=>row.title==='Módulo:Citar periódico'&&row.oldid===49463910)||
            !profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Configuração'&&row.oldid===73016847)||
            !profile.dependencies.some(row=>row.title==='Módulo:Citação/CS1/Whitelist'&&row.oldid===71860752))return null;
        return {parsed,profile,native:{...parsed,name:'citar revista',parts:[profile.title,...parsed.parts.slice(1)]},localAliasOldid:57056957};
    }
    // Exact placeholder data72932557 used by InfoboxImage72932632.
    const V219_NESTED_RADIO_PLACEHOLDERS=Object.freeze(["Blue - Replace this image female.svg","Blue - Replace this image male.svg","CarersLogo.gif","Cricket no pic.png","Defeito.svg","Diagram Needed.svg","Example.jpg","Exemplo.jpg","Flag of None (square).svg","Flag of None.svg","Flag of.svg","Green - Replace this image female.svg","Green - Replace this image male.svg","Imagem indisponível.svg","Image is needed female.svg","Image is needed male.svg","Image placeholder.png","Image-No portrait-text-BFD-test.svg","Image-request.png","Insert image here.svg","Location map of None.svg","Male no free image yet.png","Missing flag.png","No DVDcover copy.png","No flag.svg","No free portrait.svg","No image available.png","NO IMAGE YET square.png","NO IMAGE YET.png","No male portrait.svg","No Photo Available.svg","No portrait (female).svg","No portrait (male).svg","No portrait-BFD-test.svg","No Screenshot.svg","No-image-available.jpg","Nocover-upload.png","Noimage.gif","Noribbon.svg","Null.png","Padrao.svg","Padrão.svg","PictureNeeded.gif","Place holder.jpg","Placeholder barnstar ribbon.png","Project Trains no image.png","Red - Replace this image female.svg","Red - Replace this image male.svg","Replace this image - temple.png","Replace this image butterfly.png","Replace this image female.svg","Replace this image male (blue).svg","Replace this image male.svg","Replace this image.svg","Replace this image1.svg","Resolution angle.png","Sem imagem.svg","Silver - Replace this image female.svg","Silver - Replace this image male.svg","Sin bandera.svg","Sin escudo.svg","Unbenannt.JPG","UploadACopyrightFreeImage.svg","UploadAnImage.gif","UploadAnImage.svg","UploadAnImageShort.svg"]);
    function v219NestedRadioCaptionImage(value) {
        const image=value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
        // Restrict this read-only proof to an ordinary bare ASCII filename.
        // Native namespaces, rich images, supplied formatting and suppression
        // branches retain their original opacity.
        if(!/^[A-Za-z0-9][A-Za-z0-9 _().-]*\.(?:jpe?g|png|gif|svg|webp|tiff?)$/i.test(image))return false;
        const canonical=image.replace(/_/g,' '),first=canonical[0].toUpperCase()+canonical.slice(1);
        return !V219_NESTED_RADIO_PLACEHOLDERS.includes(first);
    }
    function v219NestedCitationOwner(source,ref,nodes) {
        const context=v219IndexedSyntaxContext(source,ref.start);
        if(!context||context.links.length||context.external.length)return null;
        const parents=nodes.filter(node=>node.start<ref.start&&ref.end<=node.end);
        if(!parents.length)return {kind:'root-reference'};
        if(parents.length!==1)return null;
        const owner=parents[0],raw=source.slice(owner.start,owner.end),parsed=parsedTemplate(raw),fields=v219NestedCitationFields(raw,true);
        if(!fields||!v215LiteralTemplateIdentity(raw))return null;
        const field=fields.fields.find(field=>owner.start+field.start<=ref.start&&ref.end<=owner.start+field.end);
        if(!field)return null;
        if(v215SameTemplateTitle(parsed.parts[0],'Caixa de citação')&&
            TEMPLATE_CATALOG[parsed.name]?.oldid===68629072&&field.key==='autor'&&
            !fields.fields.some(row=>['author','2'].includes(row.key)))
            return {kind:'native-quotation-metadata',oldid:68629072,field:'autor'};
        if(v215SameTemplateTitle(parsed.parts[0],'Info/Emissora de rádio')&&
            INFOBOX_CATALOG[parsed.name]?.oldid===72719420&&field.key==='legenda'&&
            !fields.fields.some(row=>['descricao','descrição','imagem_tamanho','logo_upright','alt'].includes(row.key))&&
            INFOBOX_CATALOG[parsed.name].dependencies?.some(row=>row.title==='Módulo:InfoboxImage'&&row.oldid===72932632)&&
            INFOBOX_CATALOG[parsed.name].dependencies.some(row=>row.title==='Módulo:InfoboxImage/data'&&row.oldid===72932557)){
            const image=fields.fields.find(row=>row.key==='imagem');
            if(image&&v219NestedRadioCaptionImage(image.value))
                return {kind:'native-radio-image-caption',oldid:72719420,field:'legenda',
                    templateOldid:70262218,moduleOldid:72782381};
        }
        return null;
    }
    function v219NestedCitationCall(raw,cfg={}) {
        const context=v219NestedCitationContext(raw),before=context&&v219NestedCitationFields(raw);
        if(!before||before.fields.some(field=>!nativeCitationAccepts(context.native,field.key)))return null;
        const writer=extendedCitation(citation(raw,cfg,()=>{},()=>{}),cfg,()=>{},()=>{});
        if(writer===raw)return null;
        const after=v219NestedCitationFields(writer),edge=value=>value.replace(/\r?\n[ \t]*$/,'');
        if(!after||after.fields.length<before.fields.length||after.fields.length>before.fields.length+1||
            after.head!==(cfg.singleLineCitations?edge(before.head):before.head))return null;
        const entries=templateEntries(context.parsed),appended=[];
        for(let index=0;index<before.fields.length;index++){
            const old=before.fields[index],next=after.fields[index];
            if(old.key!==next.key||old.prefix!==next.prefix)return null;
            let value=cfg.singleLineCitations?edge(old.value):old.value;
            const roles=v219NativeCitationRoles(old.key);
            if(cfg.citations&&roles.length===1&&roles[0]==='Edition'&&
                before.fields.filter(row=>v219NativeCitationRoles(row.key).includes('Edition')).length===1)
                value=value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
            if(next.value!==value){
                const entry=entries[index],who=norm(old.key).match(/^(autor|editor|tradutor)(\d*)$/),
                    link=/^\[\[([^|\[\]#]+)(?:\|([^\[\]]+))?\]\]$/.exec(value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''));
                if(before.fields.some(field=>v219NativeCitationRoles(field.key).includes('Ref'))||
                    !cfg.authors||!who||!link||!v219CitationPeopleLinkAllowed(raw,cfg,entries,entry,who,link)||
                    next.value!==(link[2]||link[1]))return null;
                const key=(who[1]==='tradutor'?'tradutor-link':who[1]+'link')+who[2],present=before.fields.find(row=>row.key===key);
                if(!present)appended.push({key,value:link[1]});
            }
        }
        if(appended.length!==after.fields.length-before.fields.length||appended.length>1)return null;
        if(appended.length){const actual=after.fields.at(-1);if(actual.key!==appended[0].key||actual.value!==appended[0].value||actual.prefix!==actual.key+'=')return null;}
        return {text:writer,profile:context.profile,localAliasOldid:context.localAliasOldid};
    }
    function v219NestedCitationSourcePlan(source,options={}) {
        const cfg={...DEFAULTS,...options},empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.references!==false||!cfg.citations||
            cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||cfg.pageRedirect||cfg.pageDisambiguation||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||!v20AutomationAllowed(source,cfg)||
            !/<ref\b/i.test(source)||v24SyntaxScan(source).issues.length)return empty;
        const nodes=templates(source);if(nodes.unclosed.length)return empty;
        const proposed=[];
        for(const ref of refTokens(source)){
            const attrs=attrsOf(ref.attrs);if(ref.body===null||!attrs||!attrs.name||Object.keys(attrs).some(key=>!['name','group'].includes(key)))continue;
            const match=/^([ \t\r\n]*)(\{\{[\s\S]*\}\})([ \t\r\n]*)$/.exec(ref.body);
            if(!match)continue;
            const inner=templates(match[2]),root=inner.nodes.filter(node=>node.start===0&&node.end===match[2].length);
            if(inner.unclosed.length||root.length!==1||inner.nodes.length!==1)continue;
            const owner=v219NestedCitationOwner(source,ref,nodes.nodes);if(!owner)continue;
            const candidate=v219NestedCitationCall(match[2],cfg);if(!candidate)continue;
            proposed.push({start:ref.openEnd+match[1].length,end:ref.openEnd+match[1].length+match[2].length,
                text:candidate.text,ruleId:'v219-native-citation-source-proof',proof:{sourceHash:empty.sourceHash,
                    nativeTemplateOldid:candidate.profile.oldid,nativeConfigOldid:73016847,nativeWhitelistOldid:71860752,
                    owner,before:match[2],condition:'existing native citation writer exactly matches retained named arguments, finite ASCII edge formatting and separately proved person-link fields'}});
        }
        const edits=v219AtomicNamedReferenceEdits(source,
            v219StageSafeEdits(source,proposed,'v219-native-citation-source-proof',cfg),cfg);
        return {...empty,edits,text:edits.length?v24SyntaxApply(source,edits):source};
    }
    function v219NestedCitationSourceProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219NestedCitationSourcePlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219NestedCitationOwnerInventory(source,plan) {
        const kinds=new Set(plan.edits.map(edit=>edit.proof.owner.kind).filter(kind=>kind!=='root-reference'));
        if(!kinds.size)return [];
        const nodes=templates(source);if(nodes.unclosed.length)return null;
        const result=[];
        for(const node of nodes.nodes){
            const raw=source.slice(node.start,node.end),parsed=parsedTemplate(raw),kind=
                kinds.has('native-quotation-metadata')&&v215SameTemplateTitle(parsed.parts[0],'Caixa de citação')?
                    'native-quotation-metadata':kinds.has('native-radio-image-caption')&&
                    v215SameTemplateTitle(parsed.parts[0],'Info/Emissora de rádio')?'native-radio-image-caption':null;
            if(!kind)continue;
            const context=v219IndexedSyntaxContext(source,node.start);if(!context)return null;
            const parents=[];
            for(const frame of context.templates){
                const parent=nodes.nodes.find(other=>other.start===frame.start);if(!parent)return null;
                const fields=v219NestedCitationFields(source.slice(parent.start,parent.end),true),
                    field=fields?.fields.find(field=>parent.start+field.start<=node.start&&node.end<=parent.start+field.end);
                if(!fields||!field)return null;parents.push([fields.head,field.key]);
            }
            result.push([kind,raw,parents,context.html.map(tag=>tag.raw),
                context.tables.map(at=>source.slice(at,source.indexOf('\n',at)<0?source.length:source.indexOf('\n',at))),
                context.links.length,context.external.length]);
        }
        return result;
    }
    function v219NestedCitationOwnersRetained(source,after,plan) {
        const expected=v219NestedCitationOwnerInventory(source,plan),actual=v219NestedCitationOwnerInventory(after,plan);
        return expected!==null&&actual!==null&&JSON.stringify(expected)===JSON.stringify(actual);
    }

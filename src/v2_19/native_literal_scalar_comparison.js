    // Pair-only native scalar identity. No writer or reference body signature uses it.
    function v219NativeLiteralScalarRead(source,cfg={}) {
        if(typeof source!=='string'||cfg.sectionOnly||Number(cfg.namespaceNumber??0)!==0||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||!v219SyntaxContextIndex(source))return null;
        const parsed=templates(protectedView(source));if(parsed.unclosed.length)return null;
        const reference=v24SyntaxReferences(source);if(reference.unclosed.length)return null;
        const refs=new Map(reference.refs.map(ref=>[ref.start,ref])),
            hard=[...v24SyntaxProtected(source).ranges,...v219MarkdownLiteralRanges(source),...v219QuotedTemplateRanges(source,false)],
            profiles={'citar web':48262420,'citar livro':48159689,'citar jornal':55834874,
                'citar periódico':48090957,'citar revista':68628855},values=[];
        for(const node of parsed.nodes){
            if(hard.some(range=>range.start<node.end&&node.start<range.end))continue;
            const raw=source.slice(node.start,node.end),call=parsedTemplate(raw),profile=TEMPLATE_CATALOG[call.name];
            if(!Object.hasOwn(profiles,call.name)||profiles[call.name]!==profile?.oldid||!v219OriginalTemplateHeaderAllowed(call.parts[0])||
                !v215SameTemplateTitle(call.parts[0],profile.title)||!v219NativeCitationStateInterface(raw))continue;
            const context=v219IndexedSyntaxContext(source,node.start);
            if(!context||context.templates.length||context.tables.length||context.links.length||context.external.length)continue;
            if(context.html.length){
                if(context.html.length!==1||context.html[0].name!=='ref')continue;
                const ref=refs.get(context.html[0].start);
                if(!ref||ref.body===null||!ref.close||ref.container||!v29ReferenceTag(source,ref)||
                    !v24SyntaxLiteralIdentity(ref.attrs)||Object.keys(ref.attrs).some(key=>!['name','group'].includes(key)))continue;
            }
            const fields=v2151FieldSyntaxParts(raw);
            if(!fields||!fields.length||fields.some(field=>field.key!==field.plain||field.separator!=='='||
                !nativeCitationAccepts(call,field.key)||v219NativeCitationRoles(field.key).length!==1))continue;
            const read=[];let safe=true;
            for(const field of fields){
                const value=field.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,'');
                if(/[{}\[\]<>&\u0000-\u001f\u007f-\u009f\u00a0\u1680\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\uFEFF\uE000-\uF8FF]/u.test(value)){safe=false;break;}
                read.push({start:node.start+field.start,end:node.start+field.end,
                    identity:['native-literal-scalar',profile.oldid,field.key,
                        v219CitationLanguageNativeFieldValue(field,call,fields,true)]});
            }
            if(safe)values.push(...read);
        }
        values.sort((a,b)=>a.start-b.start);let end=0;const segments=[];
        for(const value of values){if(value.start<end)return null;
            segments.push(['raw',source.slice(end,value.start)],value.identity);end=value.end;
        }
        segments.push(['raw',source.slice(end)]);return {segments,values:values.length};
    }
    function v219NativeLiteralScalarEquivalent(before,after,cfg={}) {
        if(typeof before!=='string'||typeof after!=='string'||before===after)return false;
        // Preserve the existing raw named-peer split veto before this final fallback.
        const sourceClasses=v219RawNamedReferenceClasses(before),actualClasses=v219RawNamedReferenceClasses(after);
        for(const [identity,bodies]of sourceClasses)if(bodies.size===1&&(actualClasses.get(identity)?.size||0)>1)return false;
        const source=v219NativeLiteralScalarRead(before,cfg),actual=v219NativeLiteralScalarRead(after,cfg);
        return !!source&&!!actual&&source.values>0&&actual.values>0&&
            JSON.stringify(source.segments)===JSON.stringify(actual.segments);
    }

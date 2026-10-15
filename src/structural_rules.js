    const STRUCTURAL_END_HEADINGS = new Set(['ver também','veja também','see also','notas','notes','referências','referencias','references','notas e referências','bibliografia','bibliography','leitura complementar','leitura adicional','further reading','ligações externas','external links']);
    const STRUCTURAL_LIST_NAMES = new Set(['referências','referencias','reflist','references','lista de referências','listaref']);
    const STRUCTURAL_NOTE_CALLS = new Set(['sfn','sfnp','sfnm','refn','efn','nre','r','rp','ref','nota','notas','notas e referências']);
    const STRUCTURAL_SAFE_BOX_CHILDREN = new Set(['flag','flagicon','flagcountry','bandeira','nowrap','nobr','lang','lang-en','lang-sv']);
    function structuralScope(cfg={}) {
        return cfg.structuralRepairs !== false && (cfg.namespaceNumber === undefined || cfg.namespaceNumber === 0) &&
            !cfg.sectionOnly && !cfg.discussionPage && !cfg.redirectPage && !cfg.disambiguationPage && !cfg.pageRedirect && !cfg.pageDisambiguation;
    }
    function structuralQuoteRanges(view) {
        const out=[];
        for(const m of view.matchAll(/"[^"\n]*(?:\n[^"\n]*)*"|“[^”]*”|«[^»]*»|'{2,5}[^'\n]+?'{2,5}/gu))out.push({start:m.index,end:m.index+m[0].length});
        for(const m of view.matchAll(/["“«]/gu))if(!inRange(m.index,out)){out.push({start:m.index,end:view.length});break;}
        return out;
    }
    function structuralContainerRanges(view) {
        const ranges=[],stack=[];
        for(const m of view.matchAll(/<\s*(\/?)\s*(table|div)\b[^>]*>/gi)){
            const name=m[2].toLowerCase();
            if(!m[1]){if(!/\/\s*>$/.test(m[0]))stack.push({name,start:m.index});continue;}
            const i=stack.map(x=>x.name).lastIndexOf(name);
            if(i>=0){const open=stack[i];stack.splice(i);ranges.push({start:open.start,end:m.index+m[0].length});}
        }
        for(const open of stack)ranges.push({start:open.start,end:view.length});
        return ranges;
    }
    function structuralReaders(source) {
        const view=protectedView(source), blockers=[...structuralRanges(view).filter(r=>view.slice(r.start,r.start+2)==='{|'),...refTokens(view),...structuralQuoteRanges(view),...structuralContainerRanges(view)];
        // Explicit links, including an unfinished link, are never deletion targets.
        const links=editorialWikiLinkRanges(view);
        for(const m of view.matchAll(/\[(?:https?:\/\/|\/\/)[^\]\n]*(?:\]|$)/g))links.push({start:m.index,end:m.index+m[0].length});
        blockers.push(...links);
        const nodes=topNodes(view).filter(n=>!inRange(n.start,blockers)).map(n=>({...n,raw:source.slice(n.start,n.end),p:parsedTemplate(source.slice(n.start,n.end))}));
        const headings=[...view.matchAll(/^(={2,6})[ \t]*([^=\n]+?)[ \t]*\1[ \t]*(?:\r?\n|$)/gm)].filter(m=>!inRange(m.index,blockers)).map(m=>({start:m.index,end:m.index+m[0].length,level:m[1].length,title:norm(m[2]),raw:m[0]}));
        let lastOther=-1;
        for(const h of headings)if(h.level===2&&!STRUCTURAL_END_HEADINGS.has(h.title))lastOther=h.start;
        const finalHeadings=headings.filter(h=>h.level===2&&h.start>lastOther&&STRUCTURAL_END_HEADINGS.has(h.title));
        return {view,nodes,headings,finalHeadings,blockers};
    }
    function structuralLiteralTemplate(raw,box=false) {
        if(/<!--|\{\{\{|\{\{\s*(?:#|subst:|safesubst:)|<\s*(?:ref|references|nowiki|pre|code|syntaxhighlight|source|blockquote|q)\b/i.test(raw))return false;
        const parsed=parsedTemplate(raw);
        if(parsed.parts.slice(1).some(x=>/\b(?:id|anchor|âncora|ancora)\s*=/.test(x)))return false;
        const children=templates(raw.slice(2,-2)).nodes;
        for(const n of children){const p=parsedTemplate(raw.slice(2,-2).slice(n.start,n.end));
            if(STRUCTURAL_NOTE_CALLS.has(p.name)||CITE_NAMES[p.name]||!box||!STRUCTURAL_SAFE_BOX_CHILDREN.has(p.name))return false;
        }
        return true;
    }
    function structuralBareList(raw) {
        if(/^<\s*references\s*(?:\/\s*>|>\s*<\s*\/\s*references\s*>)$/i.test(raw))return true;
        if(!/^\{\{/.test(raw))return false;
        const p=parsedTemplate(raw);
        if(!STRUCTURAL_LIST_NAMES.has(p.name))return false;
        if(p.parts.length===1)return true;
        // Only heading suppression is equivalent to a bare global renderer.
        return p.parts.slice(1).every(part=>/^\s*(?:nível|nivel)\s*=\s*0\s*$/i.test(part));
    }
    function structuralArticlePlan(source,cfg={}) {
        const result={source,boxRemovals:[],footerRemovals:[],referencePlan:null,headingRemovals:[],conflicts:[]};
        if(typeof source!=='string'||!structuralScope(cfg))return result;
        const info=structuralReaders(source),{view,nodes,headings,finalHeadings}=info;
        if(templates(view).unclosed.length||malformedRefs(view))return result;
        const firstMain=headings.find(h=>h.level===2&&!STRUCTURAL_END_HEADINGS.has(h.title))?.start??source.length;
        const finalStart=finalHeadings[0]?.start??source.length;
        const boxes=cfg.infoboxes===false?[]:nodes.filter(n=>!!INFOBOX_CATALOG[n.p.name]);
        const firsts=new Map();
        for(const n of boxes){
            const first=firsts.get(n.p.name);
            if(!first){firsts.set(n.p.name,n);continue;}
            const adjacent=/^\s*$/.test(source.slice(first.end,n.start));
            if(first.start>=firstMain||!(adjacent||n.start>=finalStart))continue;
            if(n.raw===first.raw&&structuralLiteralTemplate(n.raw,true))result.boxRemovals.push({...n,firstStart:first.start,firstRaw:first.raw});
            else if(n.raw!==first.raw){
                const identity=p=>foreignEntries(p).find(e=>['nome','name','título','titulo'].includes(norm(e.key)))?.value.trim();
                const a=identity(first.p),b=identity(n.p);
                if(a&&a===b)result.conflicts.push({code:'infobox-conflict',start:n.start,end:n.end,message:'Duas infocaixas de '+a+' têm campos diferentes. As duas foram preservadas.'});
            }
        }
        const footer=footerTokens(source,cfg.footerProfiles||{}),seen=new Map();
        for(const n of footer.tokens){
            if(!['portal','authority','project','navbox'].includes(n.role)||!/^\{\{/.test(n.raw)||!structuralLiteralTemplate(n.raw))continue;
            if(inRange(n.start,info.blockers))continue;
            if(seen.has(n.raw))result.footerRemovals.push({...n,firstStart:seen.get(n.raw),p:parsedTemplate(n.raw)});
            else seen.set(n.raw,n.start);
        }
        if(cfg.references!==false){
            const lists=rendererRanges(view).filter(n=>!inRange(n.start,info.blockers)).map(n=>({...n,raw:source.slice(n.start,n.end)}));
            const common=lists.filter(n=>structuralBareList(n.raw));
            const otherCommon=lists.some(n=>!structuralBareList(n.raw)&&(()=>{
                if(n.raw.startsWith('<'))return !(attrsOf(tagAt(n.raw,0)?.attrs)?.group);
                const p=parsedTemplate(n.raw);return STRUCTURAL_LIST_NAMES.has(p.name)&&!foreignEntries(p).some(e=>['grupo','group'].includes(norm(e.key))&&e.value.trim());
            })());
            const refs=refTokens(view),defaultRefs=refs.filter(r=>!(attrsOf(r.attrs)?.group));
            const macros=templates(view).nodes.some(n=>{
                if(inRange(n.start,refs))return false;
                return STRUCTURAL_NOTE_CALLS.has(parsedTemplate(source.slice(n.start,n.end)).name);
            });
            const local=common.some(n=>{
                const preceding=headings.filter(h=>h.start<n.start).at(-1);
                if(!preceding||STRUCTURAL_END_HEADINGS.has(preceding.title))return false;
                return n.start<finalStart&&headings.some(h=>h.start>n.end&&!STRUCTURAL_END_HEADINGS.has(h.title));
            });
            const misplaced=common.some(n=>n.start<(defaultRefs[0]?.start??0)&&n.start<firstMain);
            let used=0,cursor=0;
            for(const n of common){if(defaultRefs.some(r=>r.start>=cursor&&r.start<n.start))used++;cursor=n.end;}
            if(defaultRefs.some(r=>r.start>=cursor))used++;
            if(common.length&&defaultRefs.length&&!otherCommon&&!macros&&!local&&used<=1&&(common.length>1||misplaced)){
                const cuts=common.map(n=>({start:n.start,end:n.end,text:/[\p{L}\p{N}]$/u.test(source.slice(0,n.start))&&/^[\p{L}\p{N}]/u.test(source.slice(n.end))?' ':''}));
                for(let i=0;i<headings.length;i++){
                    const h=headings[i];if(h.level!==2||!['referências','referencias','references'].includes(h.title))continue;
                    const end=headings[i+1]?.start??footer.start;
                    let body=source.slice(h.end,end);
                    const within=common.filter(n=>n.start>=h.end&&n.end<=end);
                    for(const n of within.slice().sort((a,b)=>b.start-a.start))body=body.slice(0,n.start-h.end)+body.slice(n.end-h.end);
                    if(within.length&&!body.trim())cuts.push({start:h.start,end:h.end,text:''});
                }
                let candidate=applyEdits(source,cuts);
                const ci=structuralReaders(candidate),lastRef=refTokens(ci.view).reduce((n,r)=>Math.max(n,r.end),0);
                const target=ci.finalHeadings.find(h=>h.start>=lastRef&&['bibliografia','bibliography','leitura complementar','leitura adicional','further reading','ligações externas','external links'].includes(h.title));
                const at=target?.start??footerTokens(candidate,cfg.footerProfiles||{}).start;
                if(at>=lastRef){
                    const prefix=candidate.slice(0,at),suffix=candidate.slice(at);
                    candidate=prefix.replace(/\n*$/,'\n\n')+'{{Referências}}\n\n'+suffix.replace(/^\n+/,'');
                    result.referencePlan={text:candidate,removed:Math.max(0,common.length-1),calls:common.length};
                }
            }
        }
        // Remove an actually empty final heading, never a heading owning prose or a subsection.
        const end=footerTokens(source,cfg.footerProfiles||{}).start;
        for(let i=0;i<headings.length;i++){
            const h=headings[i],next=headings[i+1];
            if(cfg.headings===false||!finalHeadings.includes(h)||h.start>=end||(next&&next.level>h.level))continue;
            const finish=Math.min(next?.start??end,end);
            // A retained box or other unresolved template still belongs to this section.
            if(nodes.some(n=>n.start>=h.end&&n.start<(next?.start??source.length)&&(!footer.tokens.some(t=>t.start===n.start&&t.role))))continue;
            if(!source.slice(h.end,finish).trim())result.headingRemovals.push({start:h.start,end:h.end,text:''});
        }
        return result;
    }
    function automaticStructureCleanup(source,cfg={},bump=()=>{},warn=()=>{}) {
        if(!structuralScope(cfg))return source;
        let s=source;
        const first=structuralArticlePlan(s,cfg);
        const removals=[...first.boxRemovals.map(n=>({...n,text:''})),...first.footerRemovals.map(n=>({...n,text:''}))];
        if(removals.length){s=applyEdits(s,removals);first.boxRemovals.forEach(()=>bump('repeatedInfoboxes'));first.footerRemovals.forEach(()=>bump('repeatedFooterTemplates'));}
        const plan=structuralArticlePlan(s,cfg);
        if(plan.referencePlan&&plan.referencePlan.text!==s){s=plan.referencePlan.text;bump('relocatedReferenceList');for(let i=0;i<plan.referencePlan.removed;i++)bump('redundantReferenceLists');}
        const tail=structuralArticlePlan(s,cfg);
        if(tail.headingRemovals.length){s=applyEdits(s,tail.headingRemovals);if(tail.headingRemovals.some(n=>n.start===0))s=s.replace(/^(?:\r?\n)+/,'');tail.headingRemovals.forEach(()=>bump('emptyEndHeadings'));}
        return s;
    }
    function preserveLegacyRendererLayout(source,cfg={},bump=()=>{}) {
        if(!structuralScope(cfg)||cfg.references===false)return source;
        const info=structuralReaders(source),edits=[];
        for(const n of info.nodes){
            if(n.p.name!=='reflist')continue;
            const migrated=migrateReflist(n.p,source.slice(0,n.start),()=>{});
            if(!migrated)continue;
            const p=parsedTemplate(migrated);
            if(p.parts.slice(1).some(part=>/^\s*(?:nível|nivel)\s*=/.test(part)))continue;
            edits.push({start:n.start,end:n.end,text:'{{'+p.parts.join('|')+'|nível=0}}'});
        }
        if(edits.length)edits.forEach(()=>bump('rendererHeadingPreserved'));
        return applyEdits(source,edits);
    }
    function structuralAudit(source,cfg={}) {
        if(!structuralScope(cfg))return [];
        const plan=structuralArticlePlan(source,cfg),findings=plan.conflicts.slice();
        // Useful remaining conflicts only. Legitimate multiple boxes/lists are quiet.
        const info=structuralReaders(source),firstHeading=info.headings[0]?.start??source.length;
        const firstRef=refTokens(info.view).find(r=>!(attrsOf(r.attrs)?.group))?.start;
        if(firstRef!==undefined)for(const n of info.nodes){
            if(!['referências','referencias'].includes(n.p.name)||n.start>=firstRef||n.start>=firstHeading)continue;
            const e=foreignEntries(n.p);if(e.some(x=>['grupo','group'].includes(norm(x.key))&&x.value.trim())||e.some(x=>['nível','nivel'].includes(norm(x.key))&&x.value.trim()==='0'))continue;
            findings.push({code:'reference-heading-before-lead',start:n.start,end:n.end,message:'A chamada de Referências antes da introdução gera um título nesse ponto. Confira a lista e suas definições.'});break;
        }
        return findings;
    }
    function structuralRenderedObjects(html,Parser,selector) {
        const doc=new Parser().parseFromString(html,'text/html');
        return [...doc.querySelectorAll(selector)].filter(e=>!e.parentElement?.closest(selector)).map(e=>{
            const copy=e.cloneNode(true);copy.querySelectorAll('script,style,.reference,.mw-editsection,.mw-collapsible-toggle').forEach(n=>n.remove());
            return {text:copy.textContent.replace(/\s+/g,' ').trim(),links:[...copy.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(u=>!/^#cite_/.test(u)),images:[...copy.querySelectorAll('img')].map(i=>i.getAttribute('src'))};
        });
    }
    function structuralReferenceDisplay(html,Parser) {
        const doc=new Parser().parseFromString(html,'text/html');
        const months={january:1,jan:1,janeiro:1,february:2,feb:2,fevereiro:2,march:3,mar:3,março:3,april:4,apr:4,abril:4,may:5,maio:5,june:6,jun:6,junho:6,july:7,jul:7,julho:7,august:8,aug:8,agosto:8,september:9,sep:9,sept:9,setembro:9,october:10,oct:10,outubro:10,november:11,nov:11,novembro:11,december:12,dec:12,dezembro:12};
        const dates=new RegExp('\\b(\\d{1,2})\\s+(?:de\\s+)?('+Object.keys(months).join('|')+')\\.?\\s+(?:de\\s+)?(\\d{4})\\b','gi');
        return [...doc.querySelectorAll('li[id^="cite_note"]')].map(e=>{
            const copy=(e.querySelector('.reference-text')||e).cloneNode(true);
            copy.querySelectorAll('.error,.citation-comment,.Z3988,.mw-cite-backlink').forEach(n=>n.remove());
            const text=copy.textContent.replace(/\s+/g,' ').trim().replace(dates,(_,day,month,year)=>year+'-'+String(months[month.toLowerCase()]).padStart(2,'0')+'-'+String(Number(day)).padStart(2,'0')).replace(/Arquivado do original em|Cópia arquivada em/g,'Arquivo em');
            return {id:e.id,text,links:[...copy.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(u=>!/^#cite_/.test(u)).sort()};
        });
    }
    function structuralReferenceBank(source) {
        const view=protectedView(source),renderers=rendererRanges(view),out=new Set(),cfg={...DEFAULTS};
        for(const r of refTokens(view)){
            if(r.body===null)continue;
            const attrs=attrsOf(r.attrs)||{},parent=renderers.find(n=>n.start<=r.start&&r.start<n.end);
            let group=attrs.group||'';
            if(!group&&parent){const raw=source.slice(parent.start,parent.end);group=raw.startsWith('<')?attrsOf(tagAt(raw,0)?.attrs)?.group||'':foreignEntries(parsedTemplate(raw)).find(e=>['grupo','group'].includes(norm(e.key)))?.value.trim()||'';}
            let body=mapTemplateTree(r.body,raw=>extendedCitation(citation(raw,cfg,()=>{},()=>{}),cfg,()=>{},()=>{}));
            body=mapTemplateTree(body,raw=>{const p=parsedTemplate(raw);if(!CITE_NAMES[p.name])return raw;
                const fields=new Map();for(const e of foreignEntries(p))fields.set(parameterFamily(e.key),e.value.trim().replace(/[ \t\r\n]+/g,' '));
                return JSON.stringify({name:norm(CITE_NAMES[p.name]),fields:[...fields].sort((a,b)=>a[0].localeCompare(b[0]))});
            });
            out.add(JSON.stringify([group,body.replace(/[ \t\r\n]+/g,' ').trim()]));
        }
        return out;
    }
    function renderedStructuralTableProof(beforeHtml,afterHtml,Parser,beforeSource,afterSource) {
        const result={applied:false,accepted:true,boxes:0,footers:0,reason:''};
        if(typeof beforeSource!=='string'||typeof afterSource!=='string')return result;
        const plan=structuralArticlePlan(beforeSource,{namespaceNumber:0}),before=structuralReaders(beforeSource),after=structuralReaders(afterSource);
        const count=(items,raw)=>items.filter(n=>n.raw===raw).length;
        let allowedBoxes=0,allowedNavboxes=0;
        for(const raw of new Set(plan.boxRemovals.map(n=>n.raw))){const delta=count(before.nodes,raw)-count(after.nodes,raw);if(delta>0){
            const limit=plan.boxRemovals.filter(n=>n.raw===raw).length;
            if(delta>limit||count(after.nodes,raw)<1)return {...result,applied:true,accepted:false,reason:'A infocaixa que deveria permanecer foi alterada ou retirada.'};allowedBoxes+=delta;
        }}
        for(const raw of new Set(plan.footerRemovals.filter(n=>n.role==='navbox').map(n=>n.raw))){const delta=count(before.nodes,raw)-count(after.nodes,raw);if(delta>0)allowedNavboxes+=delta;}
        const collectorChanged=plan.referencePlan&&rendererRanges(before.view).length!==rendererRanges(after.view).length;
        const boxSelector='.infobox,.infobox_v2,table[class*="infobox_"]';
        if(structuralRenderedObjects(beforeHtml,Parser,boxSelector).length-structuralRenderedObjects(afterHtml,Parser,boxSelector).length>allowedBoxes)return {...result,applied:true,accepted:false,reason:'Uma infocaixa exibida desapareceu sem uma cópia literal confirmada no código.'};
        if(!allowedBoxes&&!allowedNavboxes&&!collectorChanged&&!plan.footerRemovals.some(n=>count(after.nodes,n.raw)<count(before.nodes,n.raw)))return result;
        result.applied=true;result.boxes=allowedBoxes;result.footers=plan.footerRemovals.length;
        if(preservationAudit(beforeSource,afterSource).length)return {...result,accepted:false,reason:'O código perdeu texto, arquivo, identificador ou trecho protegido.'};
        const newBank=structuralReferenceBank(afterSource);
        if([...structuralReferenceBank(beforeSource)].some(key=>!newBank.has(key)))return {...result,accepted:false,reason:'Uma definição de referência foi retirada ou alterada além das conversões reconhecidas.'};
        const same=JSON.stringify,compress=(list,removed)=>{
            const expected=list.slice();for(let i=expected.length-1;i>0&&removed;i--){const key=same(expected[i]);if(expected.slice(0,i).some(x=>same(x)===key)){expected.splice(i,1);removed--;}}
            return removed?null:expected;
        };
        const oldBoxes=structuralRenderedObjects(beforeHtml,Parser,'.infobox,.infobox_v2,table[class*="infobox_"]'),newBoxes=structuralRenderedObjects(afterHtml,Parser,'.infobox,.infobox_v2,table[class*="infobox_"]');
        const expectedBoxes=compress(oldBoxes,allowedBoxes);
        if(expectedBoxes===null||same(expectedBoxes)!==same(newBoxes))return {...result,accepted:false,reason:'Os dados visíveis da infocaixa que permaneceu não correspondem às cópias originais.'};
        const oldNav=structuralRenderedObjects(beforeHtml,Parser,'.navbox'),newNav=structuralRenderedObjects(afterHtml,Parser,'.navbox'),expectedNav=compress(oldNav,allowedNavboxes);
        if(expectedNav===null||same(expectedNav)!==same(newNav))return {...result,accepted:false,reason:'O conteúdo de uma caixa de navegação mudou além da cópia repetida.'};
        const oldRefs=structuralReferenceDisplay(beforeHtml,Parser),newRefs=structuralReferenceDisplay(afterHtml,Parser);
        function explicitNames(source){const names=new Set(),anon=[];for(const r of refTokens(protectedView(source))){if(r.body===null)continue;const attrs=attrsOf(r.attrs);if(attrs?.name)names.add((attrs.group||'')+'\0'+attrs.name);else anon.push(r.body);}return {names,anon};}
        const newExplicit=explicitNames(afterSource),minNew=newExplicit.names.size+newExplicit.anon.length;
        const refKey=e=>JSON.stringify([e.text,e.links]),oldTexts=new Set(oldRefs.map(refKey)),newTexts=new Set(newRefs.map(refKey));
        const named=new Set(refTokens(before.view).map(r=>attrsOf(r.attrs)?.name).filter(Boolean).map(n=>n.replace(/ /g,'_')));
        const explicit=e=>{let id=e.id.replace(/^cite_note-/,'').replace(/-\d+$/,'');try{id=decodeURIComponent(id.replace(/\.([0-9a-f]{2})/gi,'%$1'));}catch{}return named.has(id);};
        const implicitCounts=list=>{const out=new Map();for(const e of list.filter(x=>!explicit(x))){const key=refKey(e);out.set(key,(out.get(key)||0)+1);}return out;};
        const oldImplicit=implicitCounts(oldRefs),newImplicit=implicitCounts(newRefs);
        if(newRefs.length<minNew||[...oldTexts].some(text=>!newTexts.has(text))||[...oldImplicit].some(([key,n])=>(newImplicit.get(key)||0)<n))return {...result,accepted:false,reason:'As referências exibidas não foram preservadas na retirada das duplicações.'};
        return result;
    }

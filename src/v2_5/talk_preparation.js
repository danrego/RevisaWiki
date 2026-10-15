    // Estes nomes foram conferidos no Módulo:Avaliação/Marcas. Um portal
    // existente, por si só, não confirma a existência de uma marca de projeto.
    // https://pt.wikipedia.org/w/index.php?oldid=73060837
    const V25_TALK_PROJECTS = Object.freeze({
        'cinema':'Cinema','filme':'Cinema','estados unidos':'Estados Unidos',
        'estados unidos da américa':'Estados Unidos',
        'biografia':'Biografia','biografias':'Biografia','brasil':'Brasil',
        'frança':'França','portugal':'Portugal','história':'História',
        'física':'Física','matemática':'Matemática','política':'Política',
        'esportes':'Esporte','desporto':'Esporte','futebol':'Futebol',
        'literatura':'Literatura','música':'Música'
    });
    function v25TalkProject(value) {
        const key=String(value).normalize('NFC').replace(/_/g,' ').trim().toLocaleLowerCase('pt');
        return Object.prototype.hasOwnProperty.call(V25_TALK_PROJECTS,key)?V25_TALK_PROJECTS[key]:null;
    }
    function v25PortalProjects(raw,strict=true) {
        const p=parsedTemplate(raw),projects=[];
        if(!['portal','portal2','portal3'].includes(p.name))return null;
        let implicit=1;const seen=new Set();
        for(const part of p.parts.slice(1)) {
            const match=part.match(/^\s*(\d+)\s*=([\s\S]*)$/),slot=match?Number(match[1]):implicit++,value=match?match[2]:part;
            if(!Number.isSafeInteger(slot)||slot<1||slot>64||seen.has(slot)||/[{}<>\[\]=]/.test(value))return null;
            seen.add(slot);if(!value.trim())continue;
            const project=v25TalkProject(value);if(!project){if(strict)return null;else continue;}
            if(!projects.includes(project))projects.push(project);
        }
        return projects.length?projects:null;
    }
    function v25ArticleProjectPortals(article) {
        if(typeof article!=='string'||article.length>4194304)return [];
        let view=scanProtectedView(article);if(malformedRefs(view))return [];
        view=v24SyntaxMaskRanges(view,refTokens(view));
        const inventory=templates(view),projects=[];
        if(inventory.unclosed.length)return [];
        for(const item of inventory.nodes.filter(n=>n.depth===0)) {
            const found=v25PortalProjects(article.slice(item.start,item.end),false);
            if(found)for(const project of found)if(!projects.includes(project))projects.push(project);
        }
        return projects;
    }
    function v25PlainTalkPortals(line) {
        let rest=line.trim(),projects=[];
        if(!rest)return null;
        while(rest) {
            const match=rest.match(/^Portal\s+(?:do|da|dos|das|de)\s+(.+?)(?=\s+Portal\s+(?:do|da|dos|das|de)\s+|$)/iu);
            if(!match)return null;
            const project=v25TalkProject(match[1]);if(!project)return null;
            if(!projects.includes(project))projects.push(project);
            rest=rest.slice(match[0].length).trim();
        }
        return projects.length?projects:null;
    }
    function v25TalkPreparationPlan(source,article='',cfg={}) {
        const result={source,text:source,changed:false,projects:[],summary:'',reason:'',removedPortals:0};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==1||cfg.sectionOnly||
            cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||cfg.model&&cfg.model!=='wikitext'||
            cfg.pageRedirect||/^\s*#(?:redirect|redirecionamento)\b/iu.test(scanProtectedView(source))) {
            result.reason='Use a edição completa da discussão de um artigo.';return result;
        }
        const prefix=source.slice(0,65536),inventory=templates(prefix),byStart=new Map(inventory.nodes.filter(n=>n.depth===0).map(n=>[n.start,n]));
        const headers=[],portals=[];let cursor=0;
        while(cursor<prefix.length) {
            const ws=prefix.slice(cursor).match(/^\s+/);if(ws){cursor+=ws[0].length;continue;}
            if(prefix.startsWith('<!--',cursor)) {const end=prefix.indexOf('-->',cursor+4);if(end<0)break;cursor=end+3;continue;}
            const item=byStart.get(cursor);
            if(item) {
                const raw=source.slice(item.start,item.end),p=parsedTemplate(raw),entry={...item,raw,name:p.name,p};
                if(source.lastIndexOf('\n',cursor-1)+1!==cursor){
                    result.reason='Há código com recuo ou conteúdo na mesma linha do cabeçalho. O texto foi preservado.';return result;
                }
                // Somente predefinições isoladas no cabeçalho. Nunca leia texto
                // de conversas ou exemplos como se fosse uma escolha de projeto.
                if(!/^[ \t]*(?:\r?\n|$)/.test(source.slice(item.end)))break;
                headers.push(entry);const found=v25PortalProjects(raw);
                if(found)portals.push({...entry,projects:found});
                cursor=item.end;continue;
            }
            const end=source.indexOf('\n',cursor),line=source.slice(cursor,end<0?source.length:end),found=v25PlainTalkPortals(line);
            if(!found)break;
            if(source.lastIndexOf('\n',cursor-1)+1!==cursor){
                result.reason='Há texto com recuo antes dos portais. O cabeçalho foi preservado.';return result;
            }
            portals.push({start:cursor,end:end<0?source.length:end,raw:line,projects:found});cursor=end<0?source.length:end+1;
        }
        const pd=headers.filter(h=>['pd','cabeçalho de discussão'].includes(h.name));
        const marks=headers.filter(h=>h.name==='marca de projeto');
        const all=templates(scanProtectedView(source)).nodes.filter(item=>{
            const name=parsedTemplate(source.slice(item.start,item.end)).name;
            return ['pd','cabeçalho de discussão','marca de projeto'].includes(name);
        });
        if(all.some(item=>!headers.some(h=>h.start===item.start&&h.end===item.end))){
            result.reason='Há um cabeçalho ou marca fora do início da página. O texto foi preservado.';return result;
        }
        if(pd.length>1||marks.length>1){result.reason='Há cabeçalhos ou marcas repetidos. O texto foi preservado.';return result;}
        const projects=v25ArticleProjectPortals(article);
        for(const entry of portals)for(const project of entry.projects)if(!projects.includes(project))projects.push(project);
        result.projects=projects;
        let mark=marks[0]?.raw||'',mergeable=true,known=[];
        if(mark) {
            const positional=marks[0].p.parts.slice(1).filter(part=>!/^\s*[^|={}\r\n]+\s*=/.test(part));
            if(marks[0].p.parts.slice(1).some(part=>/^\s*\d+\s*=/.test(part))||!positional.length||positional.length%2!==1)mergeable=false;
            else for(let i=1;i<positional.length;i+=2) {
                if(/[{}<>\[\]]/.test(positional[i])){mergeable=false;break;}
                known.push(v25TalkProject(positional[i])||positional[i].trim());
            }
            if(mergeable)for(const project of projects)if(!known.includes(project)){
                mark=mark.slice(0,-2)+'|'+project+'|?}}';known.push(project);
            }
        } else if(projects.length)mark='{{Marca de projeto|?|'+projects.map(p=>p+'|?').join('|')+'}}';
        const newLine=source.includes('\r\n')?'\r\n':'\n',edits=[];
        // Remove somente as chamadas que puderam ser convertidas e só depois
        // de confirmar que todos os projetos estão representados na marca.
        const converted=mergeable&&!!mark?portals:[];
        for(const entry of [...pd,...(mark&&mergeable?marks:[]),...converted]) {
            let end=entry.end;if(source.startsWith('\r\n',end))end+=2;else if(source[end]==='\n')end++;
            edits.push({start:entry.start,end,text:''});
        }
        let body=applyEdits(source,edits).replace(/^(?:[ \t]*\r?\n)+/,'');
        const pdText=pd[0]?.raw||'{{PD}}',newHeader=pdText+(mark&&mergeable?newLine+mark:'');
        const text=newHeader+(body?newLine+body:'')+(body?'':newLine);
        result.text=text;result.changed=text!==source;result.removedPortals=converted.length;
        result.summary=mark?'{{PD}}{{Marca de projeto}}':'{{PD}}';
        result.reason=result.changed?'Cabeçalho preparado. Confira o código antes de aplicá-lo.':'O cabeçalho já está preparado.';
        return result;
    }

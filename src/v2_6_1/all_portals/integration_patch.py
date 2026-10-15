"""Use all registered project marks and confirm uncatalogued names by read-only lookup."""
from pathlib import Path
import json


def apply(source):
    here = Path(__file__).resolve().parent

    def once(old, new):
        nonlocal source
        assert source.count(old) == 1, old[:120]
        source = source.replace(old, new, 1)

    catalogs = ''
    for filename, constant in [('registered_projects.json','V261_TALK_REGISTERED_PROJECTS'),('verified_portals.json','V261_TALK_VERIFIED_PORTALS')]:
        data = json.loads((here / filename).read_text())
        catalogs += '    const '+constant+' = Object.freeze(ownDictionary('+json.dumps(data,ensure_ascii=False,separators=(',',':'))+'));\n'
    helpers = catalogs + (here/'helpers.js').read_text()+'\n'
    marker='    function v25TalkProject(value) {'
    once(marker,helpers+'    function v25TalkProject(value,cfg={}) {')
    once("""        const key=String(value).normalize('NFC').replace(/_/g,' ').trim().toLocaleLowerCase('pt');
        return Object.prototype.hasOwnProperty.call(V25_TALK_PROJECTS,key)?V25_TALK_PROJECTS[key]:null;""", """        if(typeof value!=='string')return null;
        const literal=v261TalkLiteralProject(value),key=value.normalize('NFC').replace(/_/g,' ').trim().replace(/[ \\t]+/g,' ').toLocaleLowerCase('pt');
        const inputs=cfg[V261_TALK_PROJECT_INPUTS];
        if(literal&&inputs instanceof Set)inputs.add(literal);
        for(const catalog of [V25_TALK_PROJECTS,V261_TALK_REGISTERED_PROJECTS,V261_TALK_VERIFIED_PORTALS])
            if(Object.prototype.hasOwnProperty.call(catalog,key))return v261TalkLiteralProject(catalog[key]);
        if(!literal)return null;
        if(Array.isArray(cfg.talkProjectProofs))for(const ns of [4,100]){
            const confirmed=new Set();
            for(const proof of cfg.talkProjectProofs.slice(0,128)){
                if(proof?.ns!==ns)continue;
                const project=v261TalkProofProject(literal,proof);if(project)confirmed.add(project);
            }
            if(confirmed.size>1)return null;
            if(confirmed.size===1)return [...confirmed][0];
        }
        return inputs instanceof Set?literal:null;""")
    once('    function v25PortalProjects(raw,strict=true) {','    function v25PortalProjects(raw,strict=true,cfg={}) {')
    once('const project=v25TalkProject(value);if(!project){if(strict)return null;else continue;}','const project=v25TalkProject(value,cfg);if(!project){if(strict)return null;else continue;}')
    once('    function v25ArticleProjectPortals(article) {','    function v25ArticleProjectPortals(article,cfg={}) {')
    once('v25PortalProjects(article.slice(item.start,item.end),false);','v25PortalProjects(article.slice(item.start,item.end),false,cfg);')
    once('    function v25PlainTalkPortals(line) {','    function v25PlainTalkPortals(line,cfg={}) {')
    once('const project=v25TalkProject(match[1]);if(!project)return null;','const project=v25TalkProject(match[1],cfg);if(!project)return null;')
    once('headers.push(entry);const found=v25PortalProjects(raw);','headers.push(entry);const found=v25PortalProjects(raw,true,cfg);')
    once('found=v25PlainTalkPortals(line);','found=v25PlainTalkPortals(line,cfg);')
    once('const projects=v25ArticleProjectPortals(article);','const projects=v25ArticleProjectPortals(article,cfg);')
    once('known.push(v25TalkProject(positional[i])||positional[i].trim());','known.push(v25TalkProject(positional[i],cfg)||positional[i].trim());')
    once('        v25TalkPreparationPlan,v25ArticleProjectPortals,','        v25TalkPreparationPlan,v25ArticleProjectPortals,v261TalkProjectCandidates,v261TalkProofProject,v261TalkProofsFromResponse,v261QueryTalkProjectProofs,')
    once("""            const plan=v25TalkPreparationPlan(source,slot.content,{namespaceNumber:1,sectionOnly:false,
                contentModel:mw.config.get('wgPageContentModel')||'wikitext',pageRedirect:!!mw.config.get('wgIsRedirect')});""", """            const talkProjectProofs=await v261QueryTalkProjectProofs(source,slot.content,
                params=>new mw.Api({ajax:{timeout:5000}}).get(params));
            if(localBusy||onlineBusy||panel!==openedPanel||editor()?.id!==adapter.id||adapter.read()!==source)
                throw new Error('O texto mudou durante a consulta. Tente novamente.');
            const plan=v25TalkPreparationPlan(source,slot.content,{namespaceNumber:1,sectionOnly:false,talkProjectProofs,
                contentModel:mw.config.get('wgPageContentModel')||'wikitext',pageRedirect:!!mw.config.get('wgIsRedirect')});""")
    return source

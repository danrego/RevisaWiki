    // UI ownership only. This does not authorize a source transformation or publication.
    function v219UIContext(value) {
        const keys=['title','namespace','model','base','section','editor'];
        if(!value||!keys.every(key=>Object.hasOwn(value,key))||
            typeof value.title!=='string'||!value.title||!Number.isInteger(value.namespace)||
            typeof value.model!=='string'||!value.model||!Number.isInteger(value.base)||value.base<0||
            value.section!==null&&typeof value.section!=='string'||value.editor==null)return null;
        return Object.freeze(Object.fromEntries(keys.map(key=>[key,value[key]])));
    }
    function v219UIContextSame(before,after) {
        before=v219UIContext(before);after=v219UIContext(after);
        return !!before&&!!after&&['title','namespace','model','base','section','editor'].every(key=>before[key]===after[key]);
    }
    function v219UITalkArticle(page,requestedTitle) {
        const title=value=>typeof value==='string'?value.replace(/_/g,' ').trim().normalize('NFC'):null;
        const expected=title(requestedTitle),revision=page?.revisions?.[0],slot=revision?.slots?.main;
        return !!expected&&!!page&&!page.missing&&!page.invalid&&!page.redirect&&page.ns===0&&
            title(page.title)===expected&&Number.isInteger(page.pageid)&&page.pageid>0&&
            Number.isInteger(revision?.revid)&&revision.revid>0&&!!slot&&typeof slot.content==='string'&&
            (!slot.contentmodel||slot.contentmodel==='wikitext');
    }

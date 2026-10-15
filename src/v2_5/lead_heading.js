    // A abertura já identifica o assunto. Só o título redundante é retirado.
    function v25LeadTitle(value) {
        const text=String(value||'').normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim();
        return text?text[0].toLocaleUpperCase('pt')+text.slice(1):'';
    }
    function v25LeadHeadingPlan(source,cfg={}) {
        const plan={source,text:source,edits:[]},title=v25LeadTitle(cfg.pageTitle);
        if(!title||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.section!==undefined&&cfg.section!==null&&cfg.section!==''||
            cfg.discussionPage||cfg.headings===false||cfg.structuralRepairs===false||!v24SyntaxScope(cfg)||
            /[{}\[\]<>#|\r\n]/.test(title))return plan;
        const candidate=/^[ \t]*==[ \t]*([^=\r\n]+?)[ \t]*==[ \t]*(?:\r?\n|$)/m.exec(source);
        if(!candidate||![title,'Introdução'].includes(v25LeadTitle(candidate[1]))||v24SyntaxScan(source).issues.length)return plan;
        const view=scanProtectedView(source);
        if(/\{\{\s*(?:desambiguação|desambiguacao|disambig|dab)\s*(?:\||\}\})/i.test(view)||
            /\{\{\s*(?:âncora|ancora|anchor)\s*[|}]/i.test(view)||/\bid\s*=/.test(view))return plan;
        const match=/^([ \t]*==[ \t]*([^=\r\n]+?)[ \t]*==[ \t]*)(?:\r?\n|$)/m.exec(view);
        if(!match||match[0]!==source.slice(match.index,match.index+match[0].length))return plan;
        const heading=v25LeadTitle(match[2]);
        if(heading!==title&&heading!=='Introdução')return plan;
        // Before the first heading, allow only whitespace, comments and a
        // complete known infobox. Arbitrary templates may emit article prose.
        const prefix=source.slice(0,match.index),nodes=v24SyntaxTemplates(scanProtectedView(prefix)).nodes;
        let remainder=prefix.replace(/<!--[\s\S]*?-->/g,m=>' '.repeat(m.length));
        for(const n of nodes.filter(n=>!nodes.some(p=>p!==n&&p.start<n.start&&p.end>=n.end))){
            const name=v24SyntaxName(prefix.slice(n.start+2,n.end-2).split('|')[0]);
            if(!/^info\//.test(name)||!Object.prototype.hasOwnProperty.call(INFOBOX_CATALOG,name))return plan;
            remainder=remainder.slice(0,n.start)+' '.repeat(n.end-n.start)+remainder.slice(n.end);
        }
        if(remainder.trim())return plan;
        // Keep the heading whenever a link might depend on a section anchor.
        // This deliberately includes encoded and legacy fragments and links to
        // other pages. Leaving one redundant heading is safer than breaking an
        // anchor whose normalization cannot be confirmed from local source.
        if(/\[\[[^\]\r\n]*(?:#|%23|\.23)/i.test(view)||
            /https?:\/\/[^\s<>]*(?:#|%23|\.23)/i.test(view)||
            /\bhref\s*=[^\r\n>]*(?:#|%23|\.23)/i.test(view))return plan;
        const end=match.index+match[0].length,tail=source.slice(end).replace(/^\s+/,''),
            subject=title.replace(/ \([^()]+\)$/,'');
        const bold=tail.startsWith("'''"),lead=bold?tail.slice(3):tail;
        if(!lead.startsWith(subject))return plan;
        if(bold&&!lead.slice(subject.length).startsWith("'''"))return plan;
        const rest=lead.slice(subject.length).replace(/^'''/,'');
        if(!/^[ \t]+[^\s=|{}<>]/u.test(rest)||!bold&&!/^[ \t]+(?:é|foi|são|foram|designa|denomina|refere-se)(?=[ \t.,])/u.test(rest))return plan;
        const edit={start:match.index,end,text:'',ruleId:'redundantLeadHeading',proof:{title,heading,subject,condition:'first literal H2; opening already names subject; no local anchor use'}};
        return {...plan,text:source.slice(0,edit.start)+source.slice(edit.end),edits:[edit]};
    }
    function automaticLeadHeadingCleanup(source,cfg={},bump=()=>{}) {
        const plan=v25LeadHeadingPlan(source,cfg);for(const edit of plan.edits)bump(edit.ruleId);return plan.text;
    }

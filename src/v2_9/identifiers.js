    // 2.9: extract only identifiers already present in literal official URLs.
    // Bounds match the recorded native CS1 contract, not an existence check.
    function v29IdentifierValue(key,value) {
        if(typeof value!=='string'||/[\s<>\[\]{}|%?#@\\]/.test(value))return null;
        let match;
        if(key==='pmc'){
            match=/^https?:\/\/(?:pmc\.ncbi\.nlm\.nih\.gov\/articles|www\.ncbi\.nlm\.nih\.gov\/pmc\/articles)\/PMC([1-9]\d{0,7})\/?$/.exec(value);
            return match&&Number(match[1])<=13900000?match[1]:null;
        }
        if(key!=='arxiv'||!(match=/^https?:\/\/arxiv\.org\/abs\/([^?#]+)$/.exec(value)))return null;
        const id=match[1];let parsed;
        if((parsed=/^(\d{2})(\d{2})\.(\d{4,5})(v[1-9]\d*)?$/.exec(id))){
            const year=Number(parsed[1]),month=Number(parsed[2]),serial=parsed[3];
            if(month<1||month>12||!/[1-9]/.test(serial))return null;
            return serial.length===4?(year>=7&&year<=14&&(year!==7||month>=4)?id:null):(year>=15?id:null);
        }
        if(!(parsed=/^[a-z][a-z-]+(?:\.[A-Z]{2})?\/(\d{2})(\d{2})(\d{3})(v[1-9]\d*)?$/.exec(id)))return null;
        const year=Number(parsed[1]),month=Number(parsed[2]);
        return (year>=91||year<=7)&&month>=1&&month<=12&&/[1-9]/.test(parsed[3])&&
            (year!==91||month>=7)&&(year!==7||month<=3)?id:null;
    }
    function v29IdentifierEnabled(cfg={}) {
        return cfg.identifierUrlRepairs!==false&&cfg.citations!==false&&cfg.markup!==false&&v24SyntaxScope(cfg)&&
            !cfg.pageRedirect&&!cfg.pageDisambiguation&&(cfg.section===undefined||cfg.section===null||cfg.section==='');
    }
    function v29IdentifierCitation(raw,cfg={},bump=()=>{}) {
        if(!v29IdentifierEnabled(cfg)||!/[|]\s*(?:pmc|pmcid|arxiv|eprint)\s*=\s*https?:\/\//i.test(raw)||
            /<!--|\{\{\{|\{\{[^{}]*\{\{|<\s*(?:nowiki|source|syntaxhighlight|pre|code|math)\b/i.test(raw))return raw;
        const parsed=parsedTemplate(raw),chosen=CITE_NAMES[parsed.name];if(!chosen)return raw;
        const native={...parsed,name:norm(chosen),parts:[chosen,...parsed.parts.slice(1)]},entries=[];
        for(let index=1;index<parsed.parts.length;index++){
            const match=/^(\s*)([^=\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(parsed.parts[index]);
            if(!match)return raw;
            const key=match[2].trim(),family=({pmc:'pmc',pmcid:'pmc',arxiv:'arxiv',eprint:'arxiv'})[norm(key)];if(!family)continue;
            if(!nativeCitationAccepts(native,key))return raw;
            entries.push({index,match,key,family,value:match[4].trim()});
        }
        const parts=parsed.parts.slice();let changed=false;
        for(const entry of entries){
            if(entries.some(other=>other.family===entry.family&&other.value!==entry.value))continue;
            const id=v29IdentifierValue(entry.family,entry.value);if(!id)continue;
            const {match}=entry,value=match[4].replace(/\S[\s\S]*\S|\S/,id);
            parts[entry.index]=match[1]+match[2]+match[3]+value;changed=true;bump('v29IdentifierUrls');
        }
        return changed?'{{'+parts.join('|')+'}}':raw;
    }
    function v29IdentifierPlan(source,cfg={}) {
        const plan={source,sourceHash:v24SyntaxHash(source),text:source,edits:[]};
        if(!v29IdentifierEnabled(cfg)||!/[|]\s*(?:pmc|pmcid|arxiv|eprint)\s*=\s*https?:\/\//i.test(source))return plan;
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        if(shield.unclosed.length||v24SyntaxScan(source).issues.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return plan;
        const parsed=templates(shield.view);if(parsed.unclosed.length)return plan;
        for(const node of parsed.nodes){
            if(markdown.some(range=>range.start<node.end&&range.end>node.start))continue;
            if(parsed.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>=node.end))continue;
            const raw=source.slice(node.start,node.end),after=v29IdentifierCitation(raw,cfg);if(raw===after)continue;
            plan.edits.push({start:node.start,end:node.end,text:after,ruleId:'v29IdentifierUrls',proof:{sourceHash:plan.sourceHash,before:raw,after,condition:'literal official PMC or arXiv abs URL; native accepted identifier field; exact encoded identifier and version retained; no conflicting identifier field'}});
        }
        plan.text=v24SyntaxApply(source,plan.edits);return plan;
    }
    function v29IdentifierProjection(source,cfg={}) {return v29IdentifierPlan(source,cfg).text;}
    function v29IdentifierPlanProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v29IdentifierPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

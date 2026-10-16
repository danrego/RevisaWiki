    Object.assign(GROUP_LABELS,{responsiveTableWrapper:'Rolagem da tabela limitada à largura disponível'});
    function v210ResponsiveTableStyle(raw) {
        if(typeof raw!=='string'||/[{}\[\]<>\\]|\/\*/.test(raw))return false;
        const declarations=new Map();
        for(const part of raw.split(';')){if(!part.trim())continue;const match=/^\s*([a-z-]+)\s*:\s*([^;]+?)\s*$/i.exec(part);if(!match)return false;const key=match[1].toLowerCase();if(declarations.has(key)||!['width','min-width','table-layout'].includes(key))return false;declarations.set(key,match[2].toLowerCase());}
        return declarations.size===3&&declarations.get('width')==='100%'&&declarations.get('table-layout')==='fixed'&&/^(?:[1-9]\d{0,3}(?:\.\d{1,3})?)(?:px|em|rem)$/.test(declarations.get('min-width')||'');
    }
    function v210ResponsiveTopLevel(source,at) {
        const events=scanMemo(source,'v210-responsive-html-contexts',()=>{
            const view=v29TablePrepared(source).view,stack=[],voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']),values=[{at:0,depth:0,invalid:false}];let invalid=false;
            for(let i=0;i<view.length;){const tag=tagAt(view,i);if(!tag){i++;continue;}i=tag.end;if(voids.has(tag.name)||tag.self)continue;if(tag.close){if(stack.pop()!==tag.name)invalid=true;}else stack.push(tag.name);values.push({at:tag.end,depth:stack.length,invalid});}
            return values;
        });
        let low=0,high=events.length-1;while(low<high){const middle=Math.ceil((low+high)/2);if(events[middle].at<=at)low=middle;else high=middle-1;}return !events[low].invalid&&events[low].depth===0;
    }
    function v210ResponsiveTableEdits(source,cfg={}) {
        if(!v29TableEnabled(source,cfg)||cfg.responsiveTableWrappers===false||v24SyntaxScan(source).issues.length)return [];
        const edits=[],prepared=v272LiteralTables(source),shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source),hash=v24SyntaxHash(source);
        for(const [tableIndex,table]of prepared.tables.entries()){
            if(table.nested||table.end-table.start>500000||!table.attrs.valid||table.attrs.attrs.some(attr=>!['class','style'].includes(attr.key)))continue;
            const classes=table.attrs.attrs.filter(attr=>attr.key==='class'),styles=table.attrs.attrs.filter(attr=>attr.key==='style');
            if(classes.length!==1||styles.length!==1||!/^(?:wikitable(?: sortable)?|sortable wikitable)$/.test(classes[0].value||'')||!v210ResponsiveTableStyle(styles[0].value))continue;
            const prefixStart=source.lastIndexOf('\n',Math.max(0,table.start-2))+1,prefix=source.slice(prefixStart,table.start),open=/(?:^|\n)([ \t]*<div[ \t]+style[ \t]*=[ \t]*(["'])([ \t]*overflow-x[ \t]*:[ \t]*auto[ \t]*;?[ \t]*)\2[ \t]*>)[ \t]*\r?\n[ \t]*$/i.exec(prefix);
            const blocked=at=>shield.ranges.some(range=>range.start<=at&&range.end>at)||markdown.some(range=>range.start<=at&&range.end>at);
            if(!open){
                const minimum=/(?:^|;)\s*min-width\s*:\s*([1-9]\d{0,3}(?:\.\d{1,3})?)(px|em|rem)\s*(?:;|$)/i.exec(styles[0].value||'');
                if(!minimum||Number(minimum[1])<(minimum[2].toLowerCase()==='px'?640:40)||blocked(table.start)||!v210ResponsiveTopLevel(source,table.start)||/<\/?(?:table|tr|td|th|thead|tbody|tfoot|div)\b/i.test(prepared.view.slice(table.openEnd,table.closeStart)))continue;
                const newline=source.slice(table.start,table.end).includes('\r\n')?'\r\n':'\n',close=table.end-newline.length;
                if(source.slice(close,table.end)!==newline)continue;
                const proof={sourceHash:hash,tableIndex,tableStart:table.start,tableEnd:table.end,tableSourceHash:v24SyntaxHash(source.slice(table.start,table.end)),condition:'unwrapped complete top-level fixed-layout wikitable; only width100 percent plus a literal minimum of at least 640px or 40em/rem; no HTML ancestor, custom table attributes or nested tables; exact table bytes retained inside one bounded horizontal-scroll wrapper'};
                edits.push({start:table.start,end:table.start,text:'<div style="max-width:100%;min-width:0;overflow-x:auto;">'+newline,ruleId:'responsiveTableWrapper',proof},{start:table.end,end:table.end,text:'</div>'+newline,ruleId:'responsiveTableWrapper',proof});continue;
            }
            if(!/^([ \t]*\r?\n)?[ \t]*<\/div>[ \t]*(?:\r?\n|$)/i.test(source.slice(table.end)))continue;
            const start=prefixStart+open.index+(open[0][0]==='\n'?1:0),end=start+open[1].length;
            if(shield.ranges.some(range=>range.start<end&&range.end>start)||markdown.some(range=>range.start<end&&range.end>start)||/<\/?(?:table|tr|td|th|thead|tbody|tfoot|div)\b/i.test(prepared.view.slice(table.openEnd,table.closeStart)))continue;
            const styleStart=start+open[1].indexOf(open[3]),styleEnd=styleStart+open[3].length;
            edits.push({start:styleStart,end:styleEnd,text:'max-width:100%;min-width:0;overflow-x:auto;',ruleId:'responsiveTableWrapper',proof:{sourceHash:hash,tableIndex,tableStart:table.start,tableEnd:table.end,wrapperStart:start,wrapperEnd:end,tableSourceHash:v24SyntaxHash(source.slice(table.start,table.end)),condition:'sole literal horizontal-scroll wrapper around one complete top-level fixed-layout wikitable; explicit table width and minimum remain unchanged; only the wrapper gains a containing-block maximum and zero automatic minimum'}});
        }
        return edits;
    }
    function v210ResponsiveTablePlan(source,cfg={}) {const edits=v210ResponsiveTableEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),text:v24SyntaxApply(source,edits),edits};}
    function v210ResponsiveTableProof(before,after,plan,cfg={}) {if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before))return false;const fresh=v210ResponsiveTablePlan(before,cfg);return fresh.text===after&&plan.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);}

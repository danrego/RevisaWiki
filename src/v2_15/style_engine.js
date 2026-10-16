    // CSS proofs bind each declaration to its selector and enclosing at-rules.
    // Unsupported grammar remains readable, but never authorizes a repair.
    function v215StyleMask(source) {
        let view='',quote='',complete=true;
        for(let i=0;i<source.length;i++){
            const c=source[i];if(quote){view+=c;if(c==='\\'&&i+1<source.length)view+=source[++i];else if(c===quote)quote='';continue;}
            if(c==='"'||c==="'"){quote=c;view+=c;continue;}
            if(source.slice(i,i+4).toLowerCase()==='url('){
                let begin=i+4;while(/[ \t\r\n]/.test(source[begin]||''))begin++;
                if(source[begin]!=="'"&&source[begin]!=='"'){
                    let end=begin;for(;end<source.length&&source[end]!==')';end++)if(source[end]==='\\')end++;
                    if(/\/\*|\*\//.test(source.slice(begin,end))){complete=false;break;}
                }
            }
            if(c==='/'&&source[i+1]==='*'){const end=source.indexOf('*/',i+2);if(end<0){complete=false;break;}view+=source.slice(i,end+2).replace(/[^\r\n]/g,' ');i=end+1;continue;}
            view+=c;
        }
        return {view,complete:complete&&!quote};
    }
    function v215StyleTokens(value, selector=false) {
        let result='',quote='',space=false;
        for(let i=0;i<value.length;i++){
            const c=value[i];
            if(quote){result+=c;if(c==='\\'&&i+1<value.length)result+=value[++i];else if(c===quote)quote='';continue;}
            if(c==='"'||c==="'"){if(space&&result&&!(selector?/[(:,>+~]$/:/[(:,]$/).test(result))result+=' ';space=false;quote=c;result+=c;continue;}
            if(/\s/.test(c)){space=true;continue;}
            if(space&&result&&!(selector?/[(:,>+~]$/:/[(:,]$/).test(result)&&!(selector?/[),>+~]/:/[),:]/).test(c))result+=' ';
            space=false;result+=c;
        }
        return result.trim();
    }
    function v215StyleSelectors(value, returned=false) {
        const selectors=[];let start=0,quote='',depth=0,brackets=0;
        for(let i=0;i<=value.length;i++){
            const c=value[i];if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}
            if(c==='"'||c==="'"){quote=c;continue;}if(c==='(')depth++;if(c===')')depth--;if(c==='[')brackets++;if(c===']')brackets--;
            if(depth<0||brackets<0)return null;
            if(i===value.length||c===','&&!depth&&!brackets){let part=value.slice(start,i).trim();if(returned)part=part.replace(/^\.mw-parser-output\s+/, '');if(!part)return null;selectors.push(v215StyleTokens(part,true));start=i+1;}
        }
        return quote||depth||brackets?null:selectors;
    }
    function v215StyleParse(source, returned=false) {
        const result={source,declarations:[],rules:[],issues:[],complete:true};
        if(typeof source!=='string'||source.length>524288){result.complete=false;return result;}
        const shield=v215StyleMask(source),view=shield.view;
        if(!shield.complete){result.complete=false;result.issues.push({code:'comment-or-string'});return result;}
        const delimiter=(start,end,wanted)=>{let quote='',paren=0,bracket=0;
            for(let i=start;i<end;i++){const c=view[i];if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='(')paren++;else if(c===')')paren--;else if(c==='[')bracket++;else if(c===']')bracket--;if(paren<0||bracket<0)return null;if(!paren&&!bracket&&wanted.includes(c))return {at:i,char:c};}return quote||paren||bracket?null:{at:end,char:''};};
        const blockEnd=(start,end)=>{let depth=1,quote='';for(let i=start;i<end;i++){const c=view[i];if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='{')depth++;if(c==='}'&&!--depth)return i;}return -1;};
        const fail=(code,start)=>{result.complete=false;result.issues.push({code,start});};
        const parse=(start,end,context)=>{
            if(context.length>12||result.rules.length>2048){fail('complexity-limit',start);return;}
            let cursor=start;
            while(cursor<end){while(cursor<end&&/\s/.test(view[cursor]))cursor++;if(cursor===end)break;const next=delimiter(cursor,end,'{};');if(!next){fail('unclosed',cursor);return;}if(next.char!=='{'){fail('unsupported-rule',cursor);return;}const close=blockEnd(next.at+1,end);if(close<0){fail('unclosed-block',cursor);return;}
                const head=view.slice(cursor,next.at).trim();
                if(/^@(?:media|supports|layer)\b/i.test(head)){parse(next.at+1,close,[...context,v215StyleTokens(head).replace(/^(@(?:media|supports|layer))\s+\(/i,'$1(')]);}
                else if(head.startsWith('@'))fail('unsupported-at-rule',cursor);
                else {
                    const selectors=v215StyleSelectors(head,returned);if(!selectors){fail('selector',cursor);return;}
                    const rule={selectors,context:[...context],start:cursor,end:close+1,declarations:[]};result.rules.push(rule);let pos=next.at+1;
                    while(pos<close){while(pos<close&&/[\s;]/.test(view[pos]))pos++;if(pos===close)break;const stop=delimiter(pos,close,';{}');if(!stop||['{','}'].includes(stop.char)){fail('nested-declaration',pos);break;}const raw=view.slice(pos,stop.at),match=raw.match(/^([a-zA-Z-]+)\s*:\s*([\s\S]*?)\s*$/);if(!match){fail('declaration',pos);break;}
                        const property=match[1].startsWith('--')?match[1]:match[1].toLowerCase(),value=match[2],important=/!\s*important\s*$/i.test(value),core=value.replace(/!\s*important\s*$/i,'').trim();
                        const item={property,value,canonical:v215StyleTokens(core),important,start:pos,end:stop.at,before:source.slice(pos,stop.at),selectors,context:[...context],ruleIndex:result.rules.length-1};rule.declarations.push(item);result.declarations.push(item);pos=stop.at+(stop.char===';'?1:0);
                    }
                }
                cursor=close+1;
            }
        };
        parse(0,view.length,[]);return result;
    }
    function v215StyleRetention(source, sanitized) {
        const before=v215StyleParse(source),after=v215StyleParse(sanitized,true),key=d=>JSON.stringify([d.context,d.selectors,d.property,d.canonical,d.important]);
        const available=new Map();for(const d of after.declarations){const k=key(d);if(!available.has(k))available.set(k,{items:[],used:0});available.get(k).items.push(d);}
        const missing=[];for(const d of before.declarations){const list=available.get(key(d));if(list&&list.used<list.items.length)list.used++;else missing.push(d);}
        const extras=[...available.values()].flatMap(list=>list.items.slice(list.used)),ruleKey=rule=>JSON.stringify([rule.context,rule.selectors]),remainingRules=new Map();for(const rule of after.rules)remainingRules.set(ruleKey(rule),(remainingRules.get(ruleKey(rule))||0)+1);
        const selectorsMissing=[];for(const rule of before.rules){const k=ruleKey(rule),count=remainingRules.get(k)||0;if(count)remainingRules.set(k,count-1);else selectorsMissing.push({selectors:rule.selectors,context:rule.context,start:rule.start,end:rule.end});}
        const sequence=value=>value.declarations.map(key),ordered=JSON.stringify(sequence(before))===JSON.stringify(sequence(after));
        return {submitted:before.declarations.length,returned:after.declarations.length,missing,extras,selectorsMissing,ordered,complete:before.complete&&after.complete,accepted:before.complete&&after.complete&&!missing.length&&!extras.length&&!selectorsMissing.length&&ordered};
    }
    function v215StylePlan(source) {
        const parsed=v215StyleParse(source),edits=[];
        if(!parsed.complete||!parsed.declarations.length)return {source,text:source,edits,complete:parsed.complete};
        const tokenRedefined=parsed.declarations.some(item=>item.property==='--border-color-base');
        // This token is a single color in the audited native skin. An
        // unknown token can expand to several shorthand components.
        const varColor=/^var\(--border-color-base\s*,\s*(?:#[a-fA-F\d]{3}|#[a-fA-F\d]{4}|#[a-fA-F\d]{6}|#[a-fA-F\d]{8})\)\s*(?:!important)?$/;
        for(const d of parsed.declarations){
            if(/\/\*|\\/.test(d.before)||d.property.startsWith('--'))continue;
            if(tokenRedefined)continue;
            if(d.property==='border-color'&&varColor.test(d.value)){
                const indent=source.slice(source.lastIndexOf('\n',d.start-1)+1,d.start).match(/^\s*/)[0];
                edits.push({kind:'border-color',start:d.start,end:d.end,before:d.before,after:['top','right','bottom','left'].map(side=>'border-'+side+'-color: '+d.value.trim()).join(';\n'+indent),property:d.property});
            }else if(['width','height','min-width','max-width','min-height','max-height'].includes(d.property)&&/^24\s+px\s*(?:!important)?$/i.test(d.value)){
                edits.push({kind:'dimension-space',start:d.start,end:d.end,before:d.before,after:d.property+': '+d.value.replace(/^(\d+)\s+px/i,'$1px'),property:d.property});
            }
        }
        // A spaced dimension is repaired only as the sole candidate defect.
        if(edits.some(edit=>edit.kind==='dimension-space')&&edits.length!==1)return {source,text:source,edits:[],complete:true};
        if(edits.length>8)return {source,text:source,edits:[],complete:true};
        let text=source;for(const edit of [...edits].reverse())text=text.slice(0,edit.start)+edit.after+text.slice(edit.end);
        return {source,sourceHash:v24SyntaxHash(source),text,textHash:v24SyntaxHash(text),edits,complete:true};
    }
    function v215StyleAcceptance(plan, proof) {
        const refuse=reason=>({accepted:false,reason,count:0,text:plan?.source});
        if(!plan?.edits?.length||!proof||proof.kind!=='native-template-styles'||proof.source!==plan.source||proof.candidate!==plan.text||proof.sourceHash!==plan.sourceHash||proof.candidateHash!==plan.textHash||proof.method!=='GET'||proof.originalError||proof.candidateError||proof.candidateWarnings?.length||typeof proof.originalCss!=='string'||typeof proof.candidateCss!=='string'||v215StyleMask(proof.candidateCss).view!==proof.candidateCss)return refuse('unconfirmed-native-result');
        const expected=v215StylePlan(plan.source);if(expected.text!==plan.text||JSON.stringify(expected.edits)!==JSON.stringify(plan.edits))return refuse('changed-plan');
        const before=v215StyleRetention(plan.source,proof.originalCss),after=v215StyleRetention(plan.text,proof.candidateCss);
        if(!after.accepted||!before.complete||before.extras.length||before.selectorsMissing.length||before.missing.length!==plan.edits.length)return refuse('contextual-retention');
        if(!before.missing.every(d=>plan.edits.some(edit=>edit.start===d.start&&edit.end===d.end)))return refuse('another-declaration-was-rejected');
        if(!Array.isArray(proof.originalWarnings)||proof.originalWarnings.some(warning=>!plan.edits.some(edit=>String(warning).replace(/[\u2010-\u2015]/g,'-').includes(edit.property))))return refuse('another-warning');
        return {accepted:true,reason:'native-contextual-retention',count:plan.edits.length,text:plan.text,proofKind:proof.kind};
    }

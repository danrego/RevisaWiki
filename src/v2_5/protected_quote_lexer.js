    function v25SyntaxQuoteReferenceEnd(view,opening) {
        if(!opening||opening.name!=='ref'||opening.close||opening.typo||/[\r\n]/.test(opening.raw))return null;
        const attrs=v24SyntaxAttrs(opening.attrs);if(!v24SyntaxLiteralIdentity(attrs))return null;if(opening.self)return opening.end;
        const lineEnd=view.indexOf('\n',opening.end),limit=lineEnd<0?view.length:lineEnd;
        for(let at=opening.end;at<limit;){const tag=v24SyntaxTag(view,at);if(!tag){at++;continue;}
            if(tag.end>limit||/[\r\n]/.test(tag.raw))return null;
            if(tag.name==='ref'){if(!tag.close||tag.typo||tag.attrs.trim())return null;return tag.end;}at=tag.end;}
        return null;
    }
    function v24SyntaxMarkupQuote(view,start,insideRef=false) {
        if(view[start-1]==="'")return null;const open=view.slice(start).match(/^('{2,5})(?!')/);if(!open)return null;
        const stack=[open[1].length];let i=start+open[1].length,content=false;
        for(;i<view.length;){if(/[\r\n]/.test(view[i]))return null;
            if(view[i]==='<'){const tag=v24SyntaxTag(view,i);if(insideRef&&tag?.name==='ref')return null;
                // Apostrophes in a complete inline citation cannot close
                // formatting that began in the surrounding prose. An outer
                // quoted example still stays opaque through its real closer.
                if(!insideRef&&tag?.name==='ref'&&!tag.close){const end=v25SyntaxQuoteReferenceEnd(view,tag);if(end!==null){content=true;i=end;continue;}}}
            if(view[i]!=="'"){content=true;i++;continue;}
            let end=i+1;while(view[end]==="'")end++;const size=end-i;
            if(size===1){content=true;i=end;continue;}
            if(size===stack.at(-1)){stack.pop();if(!stack.length)return content?{end}:null;}
            else if(stack.length===1&&[2,3].includes(stack[0])&&[2,3].includes(size))stack.push(size);
            else return null;i=end;
        }
        return null;
    }

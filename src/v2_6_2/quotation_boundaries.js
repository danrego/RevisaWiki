    // A quote inside a confirmed citation, link label or table cell belongs to
    // that field. Outside entered fields, keep the previous quotation behavior.
    // These readers do not add, delete or complete quotation marks in the source.
    function v262SyntaxQuoteReferenceAttrs(attrs) {
        if(!attrs||Object.keys(attrs).some(key=>!['name','group','follow','dir'].includes(key)))return false;
        if(attrs.dir!==undefined&&!['ltr','rtl'].includes(attrs.dir.toLowerCase()))return false;
        return Object.values(attrs).every(value=>value.trim()===value&&!/[{}\[\]<>|&\r\n]/.test(value));
    }
    function v262SyntaxQuotationScopes(view) {
        const refs=[],external=[],cells=[],attributes=new Map(),incompleteAttributes=new Map(),referenceStack=[];
        for(let at=0;at<view.length;){const tag=v24SyntaxTag(view,at);if(!tag){at++;continue;}
            if(tag.name==='ref'&&!tag.self){
                if(!tag.close){if(referenceStack.length)referenceStack[0].nested=true;referenceStack.push({...tag,nested:false});}
                else if(referenceStack.length){const opening=referenceStack.pop();if(!referenceStack.length&&!opening.nested&&!opening.typo&&!tag.typo&&!tag.attrs.trim()&&v262SyntaxQuoteReferenceAttrs(v24SyntaxAttrs(opening.attrs)))refs.push({openingStart:opening.start,start:opening.end,end:tag.end});}
            }
            at=tag.end;
        }
        const links=/\[(?:https?:|ftp:|\/\/)[^\r\n\]]*\]/gi;let match;
        while((match=links.exec(view)))if(view[match.index-1]!=='[')external.push({openingStart:match.index,start:match.index,end:links.lastIndex});
        const refOpenings=new Map(refs.map(range=>[range.openingStart,range])),externalOpenings=new Map(external.map(range=>[range.start,range]));
        const parsedTemplates=v24SyntaxTemplates(view),templateRanges=[];
        for(const range of [...parsedTemplates.nodes,...parsedTemplates.unclosed.map(node=>({...node,end:view.length}))].sort((a,b)=>a.start-b.start||b.end-a.end)){
            const last=templateRanges.at(-1);if(last&&range.start<=last.end)last.end=Math.max(last.end,range.end);else templateRanges.push({start:range.start,end:range.end});
        }
        function readAttributes(start,end,opening,openingStart) {
            let at=start,valid=false;const quoted=[];
            while(at<end){while(at<end&&/[ \t]/.test(view[at]))at++;
                const assignment=view.slice(at,end).match(/^[A-Za-z_:][A-Za-z0-9_:.-]*[ \t]*=[ \t]*/);
                if(!assignment){valid=opening&&/^[ \t]*$/.test(view.slice(at,end))||/^[|!]/.test(view.slice(at,end));break;}
                at+=assignment[0].length;const quote=view[at];
                if(quote==='"'||quote==="'"){const close=view.indexOf(quote,at+1);if(close<0||close>=end){incompleteAttributes.set(at,{openingStart});break;}quoted.push({start:at,end:close+1,opening,openingStart});at=close+1;}
                else{const value=view.slice(at,end).match(/^[^\s|!"']+/);if(!value)break;at+=value[0].length;}
                if(at===end){valid=opening;break;}
            }
            if(valid)for(const range of quoted)attributes.set(range.start,range);
        }
        function readCells(start,end,openingStart) {
            const fields=[],templates=[];let field=start,wikiLinks=0;
            for(let at=start;at<end;){const tag=v24SyntaxTag(view,at);if(tag){at=refOpenings.get(at)?.end??tag.end;continue;}
                const top=templates.at(-1),two=view.slice(at,at+2);
                if(top&&view.slice(at,at+top)==='}'.repeat(top)){templates.pop();at+=top;continue;}
                if(view.slice(at,at+3)==='{{{'){templates.push(3);at+=3;continue;}
                if(two==='{{'){templates.push(2);at+=2;continue;}
                if(two==='[['){wikiLinks++;at+=2;continue;}if(two===']]'){wikiLinks=Math.max(0,wikiLinks-1);at+=2;continue;}
                const link=!wikiLinks&&externalOpenings.get(at);if(link){at=link.end;continue;}
                if(!templates.length&&!wikiLinks&&(two==='||'||two==='!!')){fields.push({openingStart,start:field,end:at});field=at+2;at+=2;continue;}at++;
            }
            fields.push({openingStart,start:field,end});
            for(const range of fields)readAttributes(range.start,range.end,false,openingStart);
            return fields;
        }
        const tables=[];let offset=0;
        for(const line of view.match(/[^\n]*(?:\n|$)/g)||[]){
            const head=line.match(/^[ \t]*(\{\||\|}|\|[-+]?|!)[ \t]*/),end=offset+line.replace(/[\r\n]+$/,'').length;
            const markerStart=offset+(line.match(/^[ \t]*/)?.[0].length||0),insideTemplate=v262SyntaxContainingRange(templateRanges,markerStart);
            if(head&&!insideTemplate){const marker=head[1],start=offset+head[0].length;
                if(marker==='{|'){if(tables.at(-1)?.cells.length)tables.at(-1).cells.at(-1).multiline=true;tables.push({start:offset,cells:[]});readAttributes(start,end,true,offset);}
                else if(marker==='|}'){const table=tables.pop();if(table)for(const cell of table.cells)if(!cell.multiline)cells.push(cell);}
                else if(tables.length){const table=tables.at(-1);if(marker==='|-')readAttributes(start,end,true,table.start);else for(const cell of readCells(start,end,table.start))table.cells.push(cell);}
            }else if(tables.at(-1)?.cells.length)tables.at(-1).cells.at(-1).multiline=true;
            offset+=line.length;
        }
        cells.sort((a,b)=>a.start-b.start);
        const closers={'"':[], '”':[], '»':[]};
        for(let at=0;at<view.length;){const attribute=attributes.get(at);if(attribute){at=attribute.end;continue;}
            const tag=v24SyntaxTag(view,at);if(tag){at=tag.end;continue;}
            if(Object.hasOwn(closers,view[at]))closers[view[at]].push(at);at++;
        }
        return {refs,external,cells,templateRanges,attributes,incompleteAttributes,closers,protected:[]};
    }
    function v262SyntaxContainingRange(ranges,at) {
        let low=0,high=ranges.length;
        while(low<high){const middle=(low+high)>>>1;if(ranges[middle].start<=at)low=middle+1;else high=middle;}
        const range=ranges[low-1];return range&&at<range.end?range:null;
    }
    function v262SyntaxQuotationOwnerVisible(range,scopes) {
        return !!range&&!v262SyntaxContainingRange(scopes.protected,range.openingStart);
    }
    function v262SyntaxQuotationLimit(view,at,scopes) {
        const reference=v262SyntaxContainingRange(scopes.refs,at),external=v262SyntaxContainingRange(scopes.external,at);
        const owners=[reference,external].filter(range=>v262SyntaxQuotationOwnerVisible(range,scopes));
        if(owners.length)return Math.min(...owners.map(range=>range.end));
        if(v262SyntaxContainingRange(scopes.templateRanges,at))return null;
        const cell=v262SyntaxContainingRange(scopes.cells,at);return v262SyntaxQuotationOwnerVisible(cell,scopes)?cell.end:null;
    }
    function v262SyntaxQuotationEnd(view,start,closer,limit,scopes) {
        if(limit===null)return view.indexOf(closer,start+1);
        const candidates=scopes.closers[closer];let low=0,high=candidates.length;
        while(low<high){const middle=(low+high)>>>1;if(candidates[middle]<=start)low=middle+1;else high=middle;}
        const at=candidates[low];return at!==undefined&&at<limit?at:-1;
    }

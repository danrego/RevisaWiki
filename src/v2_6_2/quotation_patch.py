from pathlib import Path


def apply(source):
    marker = '    function v24SyntaxProtected(source) {'
    if source.count(marker) != 1 or 'function v262SyntaxQuotationScopes(' in source:
        raise ValueError('Unexpected or already patched quotation parser')
    helper = Path(__file__).with_name('quotation_boundaries.js').read_text()
    source = source.replace(marker, helper + '\n' + marker)
    before = '''        let quotedRefDepth=0;
        for(let i=0;i<view.length;)'''
    after = '''        const quotationScopes=v262SyntaxQuotationScopes(view);
        let quotedRefDepth=0;
        for(let i=0;i<view.length;)'''
    if source.count(before) != 1:
        raise ValueError('Quotation state anchor changed')
    source = source.replace(before, after)
    before = '''            if(closer){const at=view.indexOf(closer,i+1),lineStart=view.lastIndexOf('\\n',i-1)+1,tableAttribute=/^\\{\\|/.test(view.slice(lineStart,i))&&/=[ \\t]*$/.test(view.slice(lineStart,i));if(tableAttribute&&at>=0){i=at+1;continue;}if(at>=0){ranges.push({start:i,end:at+1,kind:'quotation'});i=at+1;continue;}const r={start:i,end:source.length,kind:'quotation'};ranges.push(r);unclosed.push({...r,code:'syntax-opaque-unclosed'});break;}'''
    after = '''            if(closer){
                const attribute=quotationScopes.attributes.get(i);
                if(v262SyntaxQuotationOwnerVisible(attribute,quotationScopes)){if(!attribute.opening){const range={start:i,end:attribute.end,kind:'quotation'};ranges.push(range);quotationScopes.protected.push(range);}i=attribute.end;continue;}
                const incompleteAttribute=v262SyntaxQuotationOwnerVisible(quotationScopes.incompleteAttributes.get(i),quotationScopes),limit=incompleteAttribute?null:v262SyntaxQuotationLimit(view,i,quotationScopes);
                const at=incompleteAttribute?-1:v262SyntaxQuotationEnd(view,i,closer,limit,quotationScopes);
                if(at>=0){const range={start:i,end:at+1,kind:'quotation'};ranges.push(range);quotationScopes.protected.push(range);i=at+1;continue;}
                if(limit!==null){i++;continue;}
                const r={start:i,end:source.length,kind:'quotation'};ranges.push(r);unclosed.push({...r,code:'syntax-opaque-unclosed'});break;
            }'''
    if source.count(before) != 1:
        raise ValueError('Quotation matching anchor changed')
    source = source.replace(before, after)
    before = "if(m){ranges.push({start:i,end:m.end,kind:'quotation-markup'});i=m.end;continue;}"
    after = "if(m){const range={start:i,end:m.end,kind:'quotation-markup'};ranges.push(range);quotationScopes.protected.push(range);i=m.end;continue;}"
    if source.count(before) != 1:
        raise ValueError('Markup quotation anchor changed')
    return source.replace(before, after)

"""Harden shared template readers without rewriting definitions or defaults."""
from pathlib import Path
import re


def once(source, old, new):
    assert source.count(old) == 1, 'Template-reader integration anchor changed.'
    return source.replace(old, new, 1)


def function(source, start, end, replacement):
    begin = source.index('    function ' + start)
    finish = source.index('    function ' + end, begin + 1)
    return source[:begin] + replacement + '\n' + source[finish:]


def apply(source):
    helpers = Path(__file__).with_name('reader_hardening.js').read_text()
    source = once(source, '    function norm(s) {', helpers + '\n    function norm(s) {')
    source = function(source, 'scanTemplates(', 'splitParts(', '''    function scanTemplates(s) {
        const parsed=v215BraceStructure(s);
        return {nodes:parsed.nodes.filter(n=>n.size===2),unclosed:parsed.unclosed};
    }''')
    source = function(source, 'scanSplitParts(', 'isVerifiedReferenceRedirect(', '''    function scanSplitParts(s) {
        return v215BraceParts(s).map(part=>part.text);
    }''')
    source = once(source, "return {name: isVerifiedReferenceRedirect(parts[0]) ? 'referências' : name, parts};",
                  "return {name: isVerifiedReferenceRedirect(parts[0]) ? 'referências' : v215TemplateLookupName(raw,name), parts};")
    source = function(source, 'v24SyntaxTemplates(', 'v25SyntaxQuoteReferenceEnd(', '''    function v24SyntaxTemplates(view) {
        const parsed=v215BraceStructure(view);return {nodes:parsed.nodes,unclosed:parsed.unclosed};
    }''')
    source = function(source, 'v24SyntaxParts(', 'v261SyntaxDiagnosticTagView(', '''    function v24SyntaxParts(body) { return v215BraceParts(body,true); }
    // Quoted examples remain opaque to repair passes.
''')
    old = "const issue=(code,start,end=start+2)=>issues.push({code,start,end});\n        for(let i=0;i<view.length;)"
    new = "const issue=(code,start,end=start+2)=>issues.push({code,start,end});\n        const braces=v215BraceStructure(view),opens=new Map([...braces.nodes,...braces.unclosed].map(n=>[n.start,n])),closes=new Map(braces.nodes.map(n=>[n.end-n.size,n]));\n        for(let i=0;i<view.length;)"
    source = once(source, old, new)
    old = """            const two=view.slice(i,i+2),top=stack.at(-1);
            if(top&&view.slice(i,i+top.size)==='}'.repeat(top.size)){stack.pop();i+=top.size;}
            else if(view.slice(i,i+3)==='{{{'){stack.push({start:i,size:3});i+=3;}
            else if(two==='{{'){stack.push({start:i,size:2});i+=2;}
            else if(two==='}}'){issue('syntax-stray-template-close',i);i+=2;}"""
    new = """            const two=view.slice(i,i+2),opening=opens.get(i),closing=closes.get(i);
            if(opening){stack.push({start:opening.start,size:opening.size});i+=opening.size;}
            else if(closing){if(stack.at(-1)?.start===closing.start)stack.pop();i+=closing.size;}
            else if(two==='}}'){issue('syntax-stray-template-close',i);i+=2;}"""
    source = once(source, old, new)
    source = function(source, 'tableSyntaxView(', 'tableCellView(', '''    function tableSyntaxView(source) {
        const literal=protectedView(source),refs=refTokens(literal);
        let view=tableMaskRanges(literal,refs);const parsed=v215BraceStructure(view),
            dynamic=[...parsed.nodes,...parsed.unclosed.map(node=>({...node,end:view.length}))];
        view=tableMaskRanges(view,dynamic);return {view,dynamic:outermostRanges(dynamic)};
    }''')
    old = """            const fields=[],templates=[];let field=start,wikiLinks=0;
            for(let at=start;at<end;){const tag=v24SyntaxTag(view,at);if(tag){at=refOpenings.get(at)?.end??tag.end;continue;}
                const top=templates.at(-1),two=view.slice(at,at+2);
                if(top&&view.slice(at,at+top)==='}'.repeat(top)){templates.pop();at+=top;continue;}
                if(view.slice(at,at+3)==='{{{'){templates.push(3);at+=3;continue;}
                if(two==='{{'){templates.push(2);at+=2;continue;}
                if(two==='[['){wikiLinks++;at+=2;continue;}if(two===']]'){wikiLinks=Math.max(0,wikiLinks-1);at+=2;continue;}
                const link=!wikiLinks&&externalOpenings.get(at);if(link){at=link.end;continue;}
                if(!templates.length&&!wikiLinks&&(two==='||'||two==='!!')){fields.push({openingStart,start:field,end:at});field=at+2;at+=2;continue;}at++;
            }"""
    new = """            const fields=[];let field=start,wikiLinks=0;
            for(let at=start;at<end;){const tag=v24SyntaxTag(view,at);if(tag){at=refOpenings.get(at)?.end??tag.end;continue;}
                const template=v262SyntaxContainingRange(templateRanges,at);if(template){at=Math.min(template.end,end);continue;}
                const two=view.slice(at,at+2);
                if(two==='[['){wikiLinks++;at+=2;continue;}if(two===']]'){wikiLinks=Math.max(0,wikiLinks-1);at+=2;continue;}
                const link=!wikiLinks&&externalOpenings.get(at);if(link){at=link.end;continue;}
                if(!wikiLinks&&(two==='||'||two==='!!')){fields.push({openingStart,start:field,end:at});field=at+2;at+=2;continue;}at++;
            }"""
    source = once(source, old, new)
    for name in ['automaticParameters', 'citation', 'infobox', 'auxiliaryParameters', 'extendedCitation', 'auxiliaryTemplate',
                 'birthDate', 'obsoleteTemplate', 'automaticCitationRepairs']:
        pattern = re.compile(r'(^    function ' + name + r'\([^\n]*\) \{\n)', re.MULTILINE)
        source, amount = pattern.subn(r'\1        if(!v215LiteralTemplateIdentity(raw))return raw;\n', source, count=1)
        assert amount == 1, 'Legacy template identity entry point changed: ' + name
    source = once(source, '    function v29IdentifierCitation(raw,cfg={},bump=()=>{}) {',
                  '    function v29IdentifierCitation(raw,cfg={},bump=()=>{}) {\n        if(!v215LiteralTemplateIdentity(raw))return raw;')
    source = once(source, '    function multilingualTemplate(raw,cfg,bump,warn) {',
                  '    function multilingualTemplate(raw,cfg,bump,warn) {\n        if(!v215LiteralTemplateIdentity(raw))return {text:raw,handled:false};')
    source = once(source, "        return cfg.namespaceNumber===10&&!/\\/(?:doc|documentação)(?:\\/|$)/i.test(cfg.pageTitle||'');",
                  "        return v215TemplatePageContext(cfg).definition;")
    source = once(source, '        const cfg={...options}, ns=cfg.namespaceNumber;',
                  '        const cfg={...options}, ns=cfg.namespaceNumber;\n        const templateContext=v215TemplatePageContext(cfg);cfg.templatePageKind=templateContext.kind;\n        cfg.templateDefinitionInputEnabled=cfg.templateDefinitionInputEnabled===true||[cfg.templateDefinitionRepairs,cfg.syntaxRepairs,cfg.structuralRepairs,cfg.markup].every(value=>value!==false);\n        if(cfg.templateDefinitionRepairs===false)cfg.templateDefinitionInputEnabled=false;')
    old = r"""        if(ns===10&&!/\/(?:doc|documentação)(?:\/|$)/i.test(cfg.pageTitle||''))
            Object.assign(cfg,{automaticSpelling:false,occupationCase:false,birthDates:false,portals:false,
                endMatter:false,endTemplateOrder:false,endSectionOrder:false,headings:false,
                shortDescriptions:false,obsoleteTemplates:false,maintenance:false,categories:false,shortcuts:false,
                references:false,numericRefNames:false,neutralReferenceNames:false,automaticIdenticalReferences:false,
                moveNamedRefs:false,referenceColumns:false,unifiedNotesReferences:false,bareReferences:false});"""
    new = """        if(ns===10)Object.assign(cfg,{automaticSpelling:false,occupationCase:false,birthDates:false,portals:false,
            links:false,markup:false,multilingual:false,
            endMatter:false,endTemplateOrder:false,endSectionOrder:false,headings:false,
            shortDescriptions:false,obsoleteTemplates:false,maintenance:false,categories:false,shortcuts:false,
            references:false,numericRefNames:false,neutralReferenceNames:false,automaticIdenticalReferences:false,
            moveNamedRefs:false,referenceColumns:false,unifiedNotesReferences:false,bareReferences:false});
        if(templateContext.documentation||templateContext.test)Object.assign(cfg,{citations:false,dates:false,links:false,
            auxiliaryTemplates:false,multilingual:false,infoboxes:false,markup:false,syntaxRepairs:false,structuralRepairs:false,
            automaticParameterNames:false,automaticParameterDuplicates:false,automaticEmptyParameters:false});"""
    source = once(source, old, new)
    source = once(source, 'const shield = maskProtected(gallerySyntax(initial,cfg,bump), warn, discussionProtectionRanges(initial,cfg));',
                  'const shield = maskProtected(gallerySyntax(initial,cfg,bump), warn, [...discussionProtectionRanges(initial,cfg),...v215DefinitionProtectedRanges(initial,cfg)]);')
    source = once(source, '        s = mapTemplateTree(s, raw => {\n            const existingBox=',
                  '        s = mapTemplateTree(s, raw => {\n            if(v215TemplatePageContext(cfg).definition)return raw;\n            const existingBox=')
    source = once(source, "const title = explicit.replace(/_/g, ' '), profile = INFOBOX_CATALOG[p.name] || TEMPLATE_CATALOG[p.name];",
                  "const title = explicit.replace(/_/g, ' '), profile = v215LiteralTemplateIdentity(s.slice(n.start,n.end))?(INFOBOX_CATALOG[p.name] || TEMPLATE_CATALOG[p.name]):null;")
    exports = ','.join(re.findall(r'^    function (v215\w+)\(', helpers, re.MULTILINE))
    source = once(source, '        parserCacheStatus, automaticParameters,', '        '+exports+',\n        parserCacheStatus, automaticParameters,')
    return source

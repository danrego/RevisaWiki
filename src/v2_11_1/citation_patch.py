"""Retain citation metadata while repairing two independently verified fields."""
from pathlib import Path
import json


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Citation field anchor absent or repeated: ' + before[:100])
    return source.replace(before, after, 1)


MODULE = r'''
    const V2111_CITATION_URL_REPAIRS=Object.freeze(__V2111_URL_MANIFEST__);
    const V2111_PERIODICAL_KEYS=new Set(['jornal','revista','dicionario','dicionário','publicacao','publicação','periodico','periódico','website','site','obra','encyclopedia','encyclopaedia','enciclopedia','enciclopédia','trabalho','work','journal','newspaper','magazine','periodical','dictionary','publicación','diccionario']);
    function v2111CitationFieldScope(cfg={}) {
        return cfg.citations!==false&&cfg.citationRepairs!==false&&cfg.markup!==false&&v24SyntaxScope(cfg)&&
            cfg.namespaceNumber===0&&!cfg.pageRedirect&&!cfg.pageDisambiguation&&!cfg.discussionPage&&!cfg.sectionOnly&&
            (cfg.section===undefined||cfg.section===null||cfg.section==='');
    }
    function v2111CitationLiteralFields(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}')||
            /<!--|[<>\uE000-\uF8FF]|\{\{\{|\{\{[^{}]*\{\{/.test(raw))return null;
        const p=parsedTemplate(raw),literal=p.parts[0].trim().replace(/_/g,' ').replace(/^(?:predefinição|template)\s*:\s*/i,'');
        if(!['citar web','citar jornal'].includes(p.name)||! /^[cC]itar (?:web|jornal)$/.test(literal))return null;
        const fields=[];let at=2+p.parts[0].length+1;
        for(let index=1;index<p.parts.length;index++){
            const part=p.parts[index],match=/^(\s*)([^={}\[\]<>\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part);
            if(!match)return null;
            const key=match[2].trim();if(!/^[\p{L}\d _/-]+$/u.test(key)||/[{}\uE000-\uF8FF]/.test(match[4]))return null;
            const trailing=match[2].match(/\s*$/)[0].length;
            fields.push({index,key,value:match[4],keyStart:at+match[1].length,keyEnd:at+match[1].length+match[2].length-trailing});
            at+=part.length+1;
        }
        return {p,fields};
    }
    function v2111CitationFieldCall(raw,cfg={}) {
        const result={text:raw,changes:[]};if(!v2111CitationFieldScope(cfg))return result;
        const literal=v2111CitationLiteralFields(raw);if(!literal)return result;
        const {p,fields}=literal,blogs=fields.filter(e=>norm(e.key)==='blog');
        // Empty and duplicate aliases also block this new equivalence. Another
        // independently verified cleanup may resolve them on a later draft.
        if(blogs.length===1&&blogs[0].value.trim()&&!fields.some(e=>V2111_PERIODICAL_KEYS.has(norm(e.key)))&&
            !nativeCitationAccepts(p,blogs[0].key)&&nativeCitationAccepts(p,'obra')){
            const e=blogs[0];result.text=raw.slice(0,e.keyStart)+'obra'+raw.slice(e.keyEnd);
            result.changes.push({ruleId:'v2111BlogPublication',before:e.key,after:'obra'});
        }
        // This is an exact historical correction pair, not punctuation removal.
        // Changed metadata, URLs, articles and partial edits cannot reuse it.
        if(String(cfg.pageTitle||'').normalize('NFC').replace(/_/g,' ').replace(/\s+/g,' ').trim()===V2111_CITATION_URL_REPAIRS.article){
            const record=V2111_CITATION_URL_REPAIRS.records.find(r=>r.beforeCall===raw);
            if(record){result.text=record.afterCall;result.changes.push({ruleId:'v2111VerifiedCitationURL',before:record.oldUrl,after:record.newUrl});}
        }
        return result;
    }
    function v2111CitationFieldEdits(source,cfg={}) {
        if(!v2111CitationFieldScope(cfg)||!/[|]\s*blog\s*=|\.html\./i.test(source))return [];
        const shield=v24SyntaxProtected(source),markdown=v27SafeMarkdownRanges(source);
        if(shield.unclosed.length||/<\s*\/?\s*(?:includeonly|noinclude|onlyinclude)\b/i.test(shield.view))return [];
        const parsed=templates(shield.view);if(parsed.unclosed.length||malformedRefs(shield.view))return [];
        const edits=[],sourceHash=v24SyntaxHash(source);
        for(const node of parsed.nodes){
            if(markdown.some(range=>range.start<node.end&&range.end>node.start)||
                parsed.nodes.some(parent=>parent!==node&&parent.start<node.start&&parent.end>=node.end))continue;
            const before=source.slice(node.start,node.end),result=v2111CitationFieldCall(before,cfg);if(result.text===before)continue;
            for(const change of result.changes){
                const raw=change.ruleId==='v2111BlogPublication'?v2111CitationLiteralFields(before):null;
                if(raw){const field=raw.fields.find(e=>norm(e.key)==='blog');edits.push({start:node.start+field.keyStart,end:node.start+field.keyEnd,text:'obra',ruleId:change.ruleId,
                    proof:{sourceHash,before,after:result.text,condition:'one nonempty literal publication field; native accepted obra; no competing Periodical alias; citation family and every value retained'}});}
                else {const record=V2111_CITATION_URL_REPAIRS.records.find(r=>r.beforeCall===before);if(!record)continue;
                    const offset=before.indexOf(record.oldUrl);if(offset<0||before.indexOf(record.oldUrl,offset+1)>=0)continue;
                    edits.push({start:node.start+offset,end:node.start+offset+record.oldUrl.length,text:record.newUrl,ruleId:change.ruleId,
                        proof:{sourceHash,manifest:V2111_CITATION_URL_REPAIRS.id,before,after:result.text,condition:'exact citation in the confirmed article; anonymous original 404 and replacement 200; TLS verified; exact canonical URL and unique matching headline; every other field retained'}});
                }
            }
        }
        return edits.sort((a,b)=>a.start-b.start);
    }
    function v2111CitationFieldPlan(source,cfg={}) {
        const edits=v2111CitationFieldEdits(source,cfg);return {source,sourceHash:v24SyntaxHash(source),edits,text:v24SyntaxApply(source,edits)};
    }
    function v2111CitationFieldProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v2111CitationFieldPlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
'''


def apply(source):
    manifest = json.loads(Path(__file__).with_name('VERIFIED_CITATION_URLS.json').read_text())
    # Response hashes, observation notes and citation facts stay in the audit
    # manifest. Runtime needs only the exact source-bound correction pair.
    runtime = {'schema': manifest['schema'], 'id': manifest['id'], 'article': manifest['article'],
               'records': [{key: record[key] for key in ['beforeCall', 'afterCall', 'oldUrl', 'newUrl']}
                           for record in manifest['records']]}
    module = MODULE.replace('__V2111_URL_MANIFEST__', json.dumps(runtime, ensure_ascii=False, separators=(',', ':')))
    source = once(source, '    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {',
                  module + '\n    function automaticCitationRepairs(raw,cfg,bump=()=>{}) {')
    source = once(source, "        stage('v282-historical-citations',s=>v282HistoricalCitationEdits(s,cfg));",
                  "        stage('v2111-citation-fields',s=>v2111CitationFieldEdits(s,cfg));\n        stage('v282-historical-citations',s=>v282HistoricalCitationEdits(s,cfg));")
    source = once(source, "        stage('identifier-url-syntax',s=>v29IdentifierPlan(s,cfg).text);",
                  "        stage('v2111-citation-fields',s=>v2111CitationFieldPlan(s,cfg).text);\n        stage('identifier-url-syntax',s=>v29IdentifierPlan(s,cfg).text);")
    source = once(source, '    function v24InventoryTemplate(raw,cfg={}) {\n        raw=v29IdentifierCitation(raw,cfg);',
                  '    function v24InventoryTemplate(raw,cfg={}) {\n        raw=v2111CitationFieldCall(raw,cfg).text;\n        raw=v29IdentifierCitation(raw,cfg);')
    source = once(source, "        leadImageThumbnail:'Fotografia inicial com tamanho de miniatura',",
                  "        v2111BlogPublication:'Publicação preservada em parâmetro aceito',\n        v2111VerifiedCitationURL:'URL corrigida com comprovação do destino',\n        leadImageThumbnail:'Fotografia inicial com tamanho de miniatura',")
    source = once(source, 'parserCacheStatus, automaticParameters, automaticIdenticalReferences, byteMetrics,',
                  'v2111CitationFieldScope,v2111CitationLiteralFields,v2111CitationFieldCall,v2111CitationFieldEdits,v2111CitationFieldPlan,v2111CitationFieldProof,\n        parserCacheStatus, automaticParameters, automaticIdenticalReferences, byteMetrics,')
    return source

"""Count complete row lines and paired scroll markup from exact endpoint bytes."""


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('2.12 count anchor changed: ' + repr(before[:120]))
    return source.replace(before, after, 1)


HELPERS = r'''
    function v212CountLiteralRow(source,start,end) {
        const context=scanMemo(source,'v212-count-row-context',()=>{const view=protectedView(source);return {tables:v272LiteralTables(source).tables.filter(table=>!table.nested),shield:v24SyntaxProtected(source).ranges.filter(range=>range.kind!=='preformatted'),refs:refTokens(view),renderers:rendererRanges(view),dynamic:v29TablePrepared(source).dynamic};});
        return context.tables.some(table=>table.openEnd<=start&&end<=table.closeStart)&&![context.shield,context.refs,context.renderers,context.dynamic].some(ranges=>ranges.some(range=>range.start<end&&range.end>start));
    }
    function v212CountIndentedRows(source,add) {
        if(!/^[ \t]+\|-[ \t]*\r?$/m.test(source))return;
        for(const match of source.matchAll(/^[ \t]+\|-[ \t]*(?:\r?\n|$)/gm)){
            const start=match.index,end=start+match[0].length;
            if(v212CountLiteralRow(source,start,end))add('table-marker',start,end,'Marcador de tabela');
        }
    }
    // Diff boundaries may move a shared line ending across an insertion. Align
    // only canonical scroll delimiters, and verify the entire endpoint again.
    function v212CountStructuralDiff(before,after,raw,fresh) {
        const edits=[],pairs=fresh.whole.filter(pair=>pair.kind==='paired-markup'&&pair.scrollWrapper);
        for(const original of raw){
            const edit={...original};
            if(edit.precise!==false&&!edit.after&&edit.before&&/^(?:[ \t]*\|-[ \t]*\r?\n)+$/.test(edit.before)&&
                (edit.start===0||before[edit.start-1]==='\n')&&v212CountLiteralRow(before,edit.start,edit.end)){
                let at=edit.start;
                for(const line of edit.before.match(/[^\n]*\n/g)||[]){edits.push({...edit,start:at,end:at+line.length,before:line});at+=line.length;}
                continue;
            }
            if(edit.precise!==false&&!edit.before&&edit.after){
                const bounds=pairs.flatMap(pair=>[[pair.start,pair.openEnd],[pair.closeTagStart,pair.end]]);
                for(const [start,end]of bounds){
                    const shift=start-edit.newStart;
                    if(shift<0||shift>2||edit.newEnd+shift!==end||!/^\r?\n$/.test(after.slice(edit.newStart,start))&&shift!==0)continue;
                    const shared=after.slice(edit.newStart,start);
                    if(before.slice(edit.start,edit.start+shift)!==shared||after.slice(edit.newEnd,end)!==shared)continue;
                    edit.start+=shift;edit.end+=shift;edit.newStart=start;edit.newEnd=end;edit.after=after.slice(start,end);break;
                }
            }
            edits.push(edit);
        }
        // A ledger decomposition never authorizes a different edit. Unknown or
        // overlapping boundary cases retain the original uncertain diff.
        let previous=0;
        for(const edit of edits){if(edit.start<previous||before.slice(edit.start,edit.end)!==edit.before||after.slice(edit.newStart,edit.newEnd)!==edit.after)return raw;previous=edit.end;}
        return v24SyntaxApply(before,edits.map(edit=>({start:edit.start,end:edit.end,text:edit.after})))===after?edits:raw;
    }
'''


def apply(source):
    source = once(source, '    function v211RetainedAdjustments(before,after,kinds=[]) {', HELPERS + '\n    function v211RetainedAdjustments(before,after,kinds=[]) {')
    source = once(source,
        "                const pair={kind:'paired-markup',start:open.start,end:tag.end,label:'Marcação pareada',openEnd:open.end+(view[open.end]==='\\n'?1:0),closeStart:tag.start-(view[tag.start-1]==='\\n'?1:0)};whole.push(pair);",
        "                const nextLine=at=>view.slice(at,at+2)==='\\r\\n'?2:view[at]==='\\n'?1:0,priorLine=at=>view.slice(at-2,at)==='\\r\\n'?2:view[at-1]==='\\n'?1:0;\n"
        "                const scrollWrapper=tag.name==='div'&&view.slice(open.start,open.end)==='<div style=\"max-width:100%;min-width:0;overflow-x:auto;\">'&&nextLine(open.end)>0&&view.slice(tag.start,tag.end)==='</div>'&&priorLine(tag.start)>0&&nextLine(tag.end)>0;\n"
        "                const pair={kind:'paired-markup',start:open.start,end:tag.end+(scrollWrapper?nextLine(tag.end):0),label:'Marcação pareada',openEnd:open.end+(scrollWrapper?nextLine(open.end):view[open.end]==='\\n'?1:0),closeStart:tag.start-(scrollWrapper?priorLine(tag.start):view[tag.start-1]==='\\n'?1:0),closeTagStart:tag.start,scrollWrapper};whole.push(pair);")
    source = once(source,
        "            if(marker)add('table-marker',m.index,m.index+marker[0].length,'Marcador de tabela');",
        "            if(marker){const fullEnd=m.index+m[0].length+(view[m.index+m[0].length]==='\\n'?1:0),end=m[0].trim()==='|-'&&v212CountLiteralRow(source,m.index,fullEnd)?fullEnd:m.index+marker[0].length;add('table-marker',m.index,end,'Marcador de tabela');}")
    source = once(source,
        "        for(const m of view.matchAll(/[\\p{L}\\p{N}_]+|[ \\t]+|\\r?\\n|\\{\\{|\\}\\}|\\[\\[|\\]\\]|'{2,3}|[^\\p{L}\\p{N}_\\s]/gu))",
        "        v212CountIndentedRows(source,add);\n        for(const m of view.matchAll(/[\\p{L}\\p{N}_]+|[ \\t]+|\\r?\\n|\\{\\{|\\}\\}|\\[\\[|\\]\\]|'{2,3}|[^\\p{L}\\p{N}_\\s]/gu))")
    source = once(source,
        "        const edits=v27RawDiff(before,after),old=v211CountUnits(before),fresh=v211CountUnits(after),oldLookup=v211CountLookup(old.units),newLookup=v211CountLookup(fresh.units),events=[],claimed=new Set(),unresolved=[];",
        "        const old=v211CountUnits(before),fresh=v211CountUnits(after),edits=v212CountStructuralDiff(before,after,v27RawDiff(before,after),fresh),oldLookup=v211CountLookup(old.units),newLookup=v211CountLookup(fresh.units),events=[],claimed=new Set(),unresolved=[];")
    source = once(source, '        for(const r of old.refs){', """        // Reordering the two literal reference identity fields is one opener
        // layout operation. Changed identities and additional attributes never
        // use this contract, even when a generic diff aligns their characters.
        for(const hit of before.matchAll(/<ref\\b[^<>]*>/gi)){
            const tag=v24SyntaxTag(before,hit.index);if(!tag||tag.close||old.view.slice(tag.start,tag.end)!==tag.raw)continue;
            const start=v211CountAnchor(tag.start,edits),end=v211CountAnchor(tag.end,edits,false,true),target=v24SyntaxTag(after,start);
            if(!target||target.name!=='ref'||target.close||target.self!==tag.self||target.end!==end||fresh.view.slice(start,end)!==target.raw)continue;
            const allowed=new Set(['name','group']),left=v25SafeAttributes(tag.attrs,allowed),right=v25SafeAttributes(target.attrs,allowed);
            if(!left||!right||left.duplicates.length||right.duplicates.length||left.entries.length!==2||right.entries.length!==2||!['name','group'].every(key=>left.values.has(key)&&right.values.has(key)&&left.values.get(key).trim()&&left.values.get(key)===right.values.get(key)))continue;
            if(left.entries.map(entry=>entry.key).join('|')===right.entries.map(entry=>entry.key).join('|'))continue;
            const ids=[...new Set([...indices('old',tag.start,tag.end),...indices('new',start,end)])];
            if(!ids.length||ids.some(i=>claimed.has(i)||!contained(edits[i],'old',tag.start,tag.end)||!contained(edits[i],'new',start,end)))continue;
            const local=ids.map(i=>({start:edits[i].start-tag.start,end:edits[i].end-tag.start,text:edits[i].after}));
            if(v24SyntaxApply(tag.raw,local)!==target.raw)continue;
            emit('reference-opener-layout','Ordem e espaçamento dos atributos da referência',ids,[{start:tag.start,end:tag.end}],[{start,end}]);
        }
        for(const r of old.refs){""")
    return source

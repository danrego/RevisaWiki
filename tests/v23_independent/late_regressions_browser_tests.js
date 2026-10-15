(async function runLateIndependentContracts(api) {
    'use strict';
    const rows=[];let checks=0;
    const eq=(a,b,m)=>{checks++;if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(m+'; expected '+JSON.stringify(b)+', got '+JSON.stringify(a));};
    const ok=(v,m)=>{checks++;if(!v)throw new Error(m);};
    function test(name,fn){const n=checks;try{fn();rows.push({name,passed:true,checks:checks-n});}catch(e){rows.push({name,passed:false,checks:checks-n,error:e.message});}}
    const cfg={namespaceNumber:0,pageTitle:'Conferência local',authorityControl:false,endTemplateOrder:false,endMatter:false,review:false,autoPreview:false};
    const ref='<ref name="a">Fonte A.</ref>';
    function run(source){return api.calculate({kind:'adjust',source,originalSource:source,options:cfg});}
    function stable(source,result){eq(api.cleanup(result.text,cfg).text,result.text,'First-click idempotence');eq(result.preservation,[],'All source facts retained');const hunks=api.comparison(source,result);eq(api.composeChanges(source,hunks),result.text,'Accept-all exact candidate');eq(api.composeChanges(source,hunks.map(h=>({...h,accepted:false}))),source,'Reject-all original');eq(result.byteMetrics.delta,new TextEncoder().encode(result.text).length-new TextEncoder().encode(source).length,'UTF-8 byte delta accurate');}
    test('punctuation before reference and following word in one click',()=>{
        for(const punct of ['.',',',':',';','!','?']) {
            const source='Texto'+ref+punct+'Galileu';
            const result=run(source);ok(result.text.includes('Texto'+punct+ref+' Galileu'),'Punctuation and following space correct '+punct);stable(source,result);
        }
        const quote='<q>Texto'+ref+'.Galileu</q>';
        ok(run(quote).text.includes(quote),'Quoted example remains byte identical');
    });
    test('decimal and time separators around reference stay literal',()=>{
        for(const punct of ['.',',',':'])for(const source of ['3'+ref+punct+'14','3'+punct+ref+'14']) {
            const result=run(source);ok(result.text.includes(source),'Ambiguous numeric boundary remains literal '+source);stable(source,result);
        }
        for(const [prefix,following] of [['٣','١٤'],['３','１４']])for(const source of [prefix+ref+'.'+following,prefix+'.'+ref+following]) {
            const result=run(source);ok(result.text.includes(source),'Unicode numeric separator remains literal');stable(source,result);
        }
        const source='3'+ref+';14',result=run(source);ok(result.text.includes('3;'+ref+' 14'),'Semicolon separated next value still repaired');stable(source,result);
    });
    test('bibliography and reference-bank structure retains its source fields',()=>{
        const bibliography='; Gerais\n\n* [https://example.invalid/a Primeira fonte]\n* [https://example.invalid/b?x=2 Segunda fonte]\n* [https://example.invalid/c Terceira fonte]\n\n; Específicas\n';
        const source='Texto.'+ref+'\n== Referências ==\n\n'+bibliography+'{{Reflist}}\n';
        const result=run(source);ok(result.text.includes(bibliography),'Complete general bibliography and specific-list boundary retained');
        for(const url of ['https://example.invalid/a','https://example.invalid/b?x=2','https://example.invalid/c'])ok(result.text.includes(url),'Exact URL retained '+url);
        stable(source,result);
        const empty='Texto.'+ref+'\n== Referências ==\n\n== Referências ==\n\n{{Reflist}}\n',fixed=run(empty);
        eq((fixed.text.match(/\{\{Referências\b/g)||[]).length,1,'One canonical collector');
        eq((fixed.text.match(/^== Referências ==$/gm)||[]).length,1,'One explicit reference heading remains without its empty duplicate');stable(empty,fixed);
        const calls='Texto.'+Array.from({length:6},(_,n)=>'<ref name="r'+n+'"/>').join('')+'\n';
        const bank=title=>Array.from({length:6},(_,n)=>'<ref name="r'+n+'">{{Citar livro|título='+title+n+'|ano=2020}}</ref>').join('\n');
        const valid=calls+'{{Referências|refs='+bank('Fonte ')+'}}\n';
        const expected=calls+'{{Referências|refs='+bank('Fonte ')+'|estilo=column-count:2;}}\n';
        eq(api.referenceColumns(valid,cfg,()=>{}),expected,'Exactly one style added outside a valid bank');
        eq(api.referenceColumns(expected,cfg,()=>{}),expected,'Valid bank column change stable');
        const ambiguous=calls+'{{Referências|refs='+bank('Fonte [ZDJĘCIA&#93; ')+'}}\n';
        eq(api.referenceColumns(ambiguous,cfg,()=>{}),ambiguous,'Entity-closed source bracket never swallows a new style parameter');
        eq(api.referenceColumns(ambiguous,cfg,()=>{}),ambiguous,'Ambiguous bank remains literal on repeated attempt');
    });
    return {version:api.version,cases:rows.length,checks,passed:rows.filter(x=>x.passed).length,failed:rows.filter(x=>!x.passed).length,wikipediaWrites:0,networkRequests:0,tests:rows};
})(window.RevisaWiki)

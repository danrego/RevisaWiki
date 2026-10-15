/* Independent browser fixtures use actual DOMParser. No request, write or script injection. */
(async function runIndependentStructuralPreviewTests(api, Parser) {
    'use strict';
    const cases=[];let checks=0;
    const eq=(a,b,m)=>{checks++;if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(m+'; expected '+JSON.stringify(b)+', got '+JSON.stringify(a));};
    const ok=(v,m)=>{checks++;if(!v)throw new Error(m);};
    const test=(name,fn)=>{let n=checks;try{fn();cases.push({name,passed:true,checks:checks-n});}catch(e){cases.push({name,passed:false,checks:checks-n,error:e.message});}};
    const box='{{Info/Arma|nome=Ikv 91|peso=16,3 toneladas}}';
    const source=box+'\nO veículo foi fabricado na Suécia.\n== Ver também ==\n'+box+'\n* [[Lista de tanques]]\n';
    const expected=box+'\nO veículo foi fabricado na Suécia.\n== Ver também ==\n\n* [[Lista de tanques]]\n';
    const boxHTML=(weight='16,3 toneladas')=>'<table class="infobox"><tr><th>Nome</th><td>Ikv 91</td></tr><tr><th>Peso</th><td>'+weight+'</td></tr></table>';
    const prose='<p>O veículo foi fabricado na Suécia.</p><h2>Ver também</h2><ul><li>Lista de tanques</li></ul>';
    const result=(html)=>({text:html,parsewarnings:[]});
    const before=boxHTML()+prose+boxHTML(),after=boxHTML()+prose;
    test('identical source duplicated infobox removal accepted',()=>{const d=api.previewDecision(result(before),result(after),Parser,source,expected);eq(d.accepted,true,'Safe duplicate removal');});
    test('render surviving infobox field changes rejected',()=>{const d=api.previewDecision(result(before),result(boxHTML('18 toneladas')+prose),Parser,source,expected);eq(d.accepted,false,'The surviving box has a changed field');});
    test('render surviving infobox vanishes rejected',()=>{const d=api.previewDecision(result(before),result(prose),Parser,source,expected);eq(d.accepted,false,'Cannot lose both boxes under duplicate-removal proof');});
    for(const cls of ['infobox_v2','wikitable infobox','wikitable infobox_v2']) {
        test('duplicate rendered box accepted class '+cls,()=>{const b=before.replaceAll('class=\"infobox\"','class=\"'+cls+'\"'),a=after.replaceAll('class=\"infobox\"','class=\"'+cls+'\"');eq(api.previewDecision(result(b),result(a),Parser,source,expected).accepted,true,'Recognized ptwiki infobox class');});
        test('changed surviving rendered box rejected class '+cls,()=>{const b=before.replaceAll('class=\"infobox\"','class=\"'+cls+'\"'),a=(boxHTML('18 toneladas')+prose).replaceAll('class=\"infobox\"','class=\"'+cls+'\"');eq(api.previewDecision(result(b),result(a),Parser,source,expected).accepted,false,'Remaining infobox fields must stay exact');});
    }
    test('source remaining box value changed rejected by structural proof',()=>{const d=api.renderedStructuralTableProof(before,boxHTML('18 toneladas')+prose,Parser,source,expected.replace('16,3','18'));eq(d.accepted,false,'Remaining source field changed outside plan');});
    test('source extra removal rejected by structural proof',()=>{const d=api.renderedStructuralTableProof(before,after,Parser,source,expected.replace('Suécia',''));eq(d.accepted,false,'Proof is bound to full structural source transition');});
    test('source stale plan rejected',()=>{const d=api.renderedStructuralTableProof(before,after,Parser,source.replace('16,3','17,3'),expected);eq(Boolean(d.applied&&d.accepted),false,'No stale safe source plan can authorize an exemption');});
    test('new parse error blocks otherwise safe structure',()=>{const d=api.previewDecision(result(before),result(after+'<span class="cite-error">Nova referência indefinida</span>'),Parser,source,expected);eq(d.accepted,false,'Parser errors remain authoritative');});
    const table='<table class="wikitable"><tr><th>Ano</th><th>Evento</th></tr><tr><td>2020</td><td>Evento A</td></tr><tr><td>2020</td><td>Evento A</td></tr><tr><td>2021</td><td>Evento B</td></tr></table>';
    const tableSource='{| class="wikitable"\n! Ano !! Evento\n|-\n| 2020 || Evento A\n|-\n| 2020 || Evento A\n|-\n| 2021 || Evento B\n|}\n';
    const changedTable=table.replace('<tr><td>2020</td><td>Evento A</td></tr>','');
    test('independent identical data table row removed rejected',()=>{const d=api.previewDecision(result(before+table),result(after+changedTable),Parser,source+tableSource,expected+tableSource);eq(d.accepted,false,'Duplicate data rows are independent records');});
    test('reordered data rows rejected',()=>{const changed=table.replace('<td>2021</td><td>Evento B</td>','<td>2020</td><td>Evento A</td>').replace('<td>2020</td><td>Evento A</td>','<td>2021</td><td>Evento B</td>');const d=api.previewDecision(result(before+table),result(after+changed),Parser,source+tableSource,expected+tableSource);eq(d.accepted,false,'Data table order remains exact');});
    test('infobox added disguised as wikitable rejected',()=>{const changed=boxHTML().replace('class="infobox"','class="wikitable"');const d=api.previewDecision(result(before+table),result(changed+prose+table),Parser,source+tableSource,expected+tableSource);eq(d.accepted,false,'Proof does not ignore newly introduced visible table');});
    const nav='{{Navbox|nome=Teste|título=Veículos|lista1=[[Ikv 91]]}}';
    const navHTML='<table class="navbox"><tr><th>Veículos</th><td>Ikv 91</td></tr></table>';
    const navSource='Texto.\n'+nav+'\n'+nav+'\n',navExpected='Texto.\n'+nav+'\n\n';
    test('identical navbox removal preserves unique rendering',()=>{const d=api.previewDecision(result('<p>Texto.</p>'+navHTML+navHTML),result('<p>Texto.</p>'+navHTML),Parser,navSource,navExpected);eq(d.accepted,true,'One identical final navigation retained');});
    test('surviving navbox link text changed rejected',()=>{const d=api.previewDecision(result('<p>Texto.</p>'+navHTML+navHTML),result('<p>Texto.</p>'+navHTML.replace('Ikv 91','Ikv 105')),Parser,navSource,navExpected);eq(d.accepted,false,'Remaining navigation has different data');});
    const referenceSource='{{Referências}}\nTexto.<ref name=\"a\">Fonte A.</ref><ref name=\"a\" group=\"nota\">Nota A.</ref>\n{{Referências|grupo=nota|título=Notas}}\n{{Referências}}\n';
    const referenceExpected='\nTexto.<ref name=\"a\">Fonte A.</ref><ref name=\"a\" group=\"nota\">Nota A.</ref>\n{{Referências|grupo=nota|título=Notas}}\n{{Referências}}\n';
    const refA='<ol class=\"references\"><li id=\"cite_note-a-1\"><span class=\"reference-text\">Fonte A.</span></li></ol>';
    const refN='<ol class=\"references\"><li id=\"cite_note-a-2\"><span class=\"reference-text\">Nota A.</span></li></ol>';
    test('same reference name in different groups both stay displayed',()=>{const d=api.previewDecision(result('<p>Texto.</p>'+refA+refN),result('<p>Texto.</p>'+refA+refN),Parser,referenceSource,referenceExpected);eq(d.accepted,true,'Two group-scoped references retained');});
    test('different group reference with same name cannot disappear',()=>{const d=api.previewDecision(result('<p>Texto.</p>'+refA+refN),result('<p>Texto.</p>'+refA),Parser,referenceSource,referenceExpected);eq(d.accepted,false,'Named references are scoped by group');});
    const implicitSource='{{Referências}}\nTexto.<ref name=\"a\">Fonte A.</ref>{{Dados com referências}}\n{{Referências}}\n';
    const implicitExpected='\nTexto.<ref name=\"a\">Fonte A.</ref>{{Dados com referências}}\n{{Referências}}\n';
    const implicitOne='<ol class=\"references\"><li id=\"cite_note-implicit1-2\"><span class=\"reference-text\">Fonte implícita.</span></li></ol>',implicitTwo='<ol class=\"references\"><li id=\"cite_note-implicit2-3\"><span class=\"reference-text\">Fonte implícita.</span></li></ol>';
    test('implicit identical reference occurrence loss rejected',()=>{const d=api.previewDecision(result('<p>Texto.</p>'+refA+implicitOne+implicitTwo),result('<p>Texto.</p>'+refA+implicitOne),Parser,implicitSource,implicitExpected);eq(d.accepted,false,'Cannot silently collapse separate template-generated citations');});
    if(window.__realFixture) {
        const real=window.__realFixture;
        test('real public rendered incident subset whole-pipeline candidate',()=>{const d=api.previewDecision(result(real.beforeHtml),result(real.afterHtml),Parser,real.beforeSource,real.afterSource);eq(d.accepted,true,'Actual public MediaWiki before/after pair supports structural removal plus canonical citation dates');eq(d.structuralProof.boxes,1,'One actual duplicate box removed');});
        const malicious=(name,change)=>test('real rendered citation corruption '+name,()=>{const altered=change(real.afterHtml);ok(altered!==real.afterHtml,'Fixture really mutated');const d=api.previewDecision(result(real.beforeHtml),result(altered),Parser,real.beforeSource,real.afterSource);eq(d.accepted,false,'Source-bound guard rejects citation field/link loss');});
        malicious('title',s=>s.replace('Tank Chats #130 Ikv 91','Tank Chats #131 Ikv 91'));
        malicious('primary URL',s=>s.replace('href="https://www.youtube.com/watch?v=pmsfvog5Thg"','href="https://example.invalid/unrelated"'));
        malicious('publication day',s=>s.replace('18 de junho de 2021','19 de junho de 2021'));
        malicious('archive year',s=>s.replace('22 de dezembro de 2021','22 de dezembro de 2022'));
        malicious('whole citation missing',s=>{const doc=new Parser().parseFromString(s,'text/html');doc.querySelector('li[id^=\"cite_note\"]')?.remove();return doc.body.innerHTML;});
        test('real source bibliography title corruption rejected',()=>{const corrupted=real.afterSource.replace('Tank Chats #130 Ikv 91','Tank Chats #131 Ikv 91');ok(corrupted!==real.afterSource,'Changed actual source');eq(api.previewDecision(result(real.beforeHtml),result(real.afterHtml),Parser,real.beforeSource,corrupted).accepted,false,'Reference-bank preservation checks source definition too');});
    }
    test('structural proof does not mutate inputs',()=>{const cfg={namespaceNumber:0};const original=JSON.stringify(cfg);api.structuralArticlePlan(source,cfg);eq(JSON.stringify(cfg),original,'Proof input immutability');eq(source,box+'\nO veículo foi fabricado na Suécia.\n== Ver também ==\n'+box+'\n* [[Lista de tanques]]\n','Source immutable');});
    return {version:api.version,cases:cases.length,checks,passed:cases.filter(x=>x.passed).length,failed:cases.filter(x=>!x.passed).length,wikipediaWrites:0,networkRequests:0,tests:cases};
})(window.RevisaWiki, window.DOMParser)

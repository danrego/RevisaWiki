'use strict';
// Independent regression cases load the actual release files. Nothing is
// injected into the runtime, and these tests cannot access the network.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const files = process.argv.slice(2).length ? process.argv.slice(2) : process.env.REVISAWIKI_SCRIPT
    ? [process.env.REVISAWIKI_SCRIPT]
    : ['RevisaWiki_v2_15_1.js', 'RevisaWiki_v2_15_1_completo.js'].map(file => path.join(root, 'dist/2.15.1', file));
const report = {version:'2.15.1', kind:'independent-infobox-regression', status:'passed',
    runnerSha256:sha(fs.readFileSync(__filename)), bundles:[], cases:0, checks:0, failures:[],
    networkRequests:0, wikipediaWrites:0, accountAccess:false};
function eq(actual, expected, message) { report.checks++; assert.deepEqual(actual, expected, message); }
function ok(actual, message) { report.checks++; assert(actual, message); }
function test(bundle, id, run) {
    report.cases++;
    try { run(); } catch (error) { report.status='failed'; report.failures.push({bundle,id,message:error.message}); }
}
function references(source) { return source.match(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>|<ref\b[^>]*\/\s*>/gi) || []; }
function links(source) { return source.match(/\[\[[^\[\]]+\]\]/g) || []; }
const resultHashes = new Map();
for (const file of files) {
    const api = require(path.resolve(file)), bundle = path.basename(file);
    eq(api.version, '2.15.1', 'The tested runtime is the requested release');
    for (const name of ['v2151InfoboxOrderPlan','v2151InfoboxOrderProof','automaticInfoboxOrder'])
        eq(typeof api[name], 'function', 'The actual distribution exposes '+name);
    report.bundles.push({file:bundle,sha256:sha(fs.readFileSync(file))});
    const cfg = {...Object.fromEntries(Object.keys(api.defaults).map(key => [key,false])),
        infoboxes:true, syntaxRepairs:true, structuralRepairs:true, markup:true, automaticParameterNames:true,
        automaticInfoboxOrder:true, namespaceNumber:0,
        pageTitle:'Pessoa de controle', contentModel:'wikitext'};
    const lead = "'''Pessoa de controle''' é uma escritora que publicou o livro ''Obra de controle''.";
    const box = '{{Info/Biografia|nome=Pessoa de controle|ocupação=escritora}}';
    const tail = '\n\n== Biografia ==\nTexto que deve permanecer no mesmo lugar.\n';
    const burial = '{{Info/Biografia|nome=Pessoa de controle|sepultamento=[[Local de controle]]<ref name="fonte">Fonte primária.</ref>}}';
    function pipeline(id, source, expected, extra={}, counts={}) {
        test(bundle,id,()=>{
            const settings={...cfg,...extra}, result=api.calculate({kind:'adjust',source,options:settings});
            eq(result.text,expected,'The complete pipeline returns the independent exact endpoint');
            eq(api.calculate({kind:'adjust',source:result.text,options:settings}).text,result.text,'One click reaches an idempotent endpoint');
            eq(api.safeComposition(source,result.text,settings),'','The complete result passes selection safety');
            eq(api.preservationAudit(source,result.text,settings),[],'No content loss is introduced');
            eq(result.preservation,[],'The pipeline retains its content proof');
            eq(references(result.text).slice().sort(),references(source).slice().sort(),'Every reference body and call is retained');
            eq(links(result.text).slice().sort(),links(source).slice().sort(),'Every local link and label is retained');
            for(const [rule,count] of Object.entries(counts))
                eq(result.changes.find(change=>change.id===rule)?.count||0,count,'Each completed operation has its own count');
            const composed=api.composeChanges(source,result.hunks);
            eq(composed,result.text,'Accepting the full comparison reproduces the result');
            const rejected=api.composeChanges(source,result.hunks.map(hunk=>({...hunk,accepted:false})));
            eq(rejected,source,'Rejecting all changes reproduces the source');
            const key=sha(source+'\0'+JSON.stringify(extra));
            if(resultHashes.has(key))eq(sha(result.text),resultHashes.get(key),'Modular and complete distributions agree');
            else resultHashes.set(key,sha(result.text));
        });
    }
    for(const key of ['sepultamento','enterro','resting_place','enterro_local']) {
        const source=burial.replace('sepultamento',key);
        pipeline('burial field remains unchanged pending input: '+key,source,source,{}, {v2151BurialField:0});
    }
    pipeline('a biography infobox moves above the opening paragraph',lead+'\n\n'+box+tail,box+'\n\n'+lead+tail,{}, {infoboxLeadOrder:1});
    pipeline('the title qualifier does not prevent a verified subject match',lead+'\n\n'+box+tail,box+'\n\n'+lead+tail,{pageTitle:'Pessoa de controle (escritora)'},{infoboxLeadOrder:1});
    const hatnote='{{Ver desambig|outro=Outro assunto}}\n{{Mais fontes}}\n\n';
    pipeline('hatnotes and maintenance calls remain before the moved box',hatnote+lead+'\n\n'+box+tail,hatnote+box+'\n\n'+lead+tail,{}, {infoboxLeadOrder:1});
    pipeline('relocation preserves the original burial field',lead+'\n\n'+burial+tail,burial+'\n\n'+lead+tail,{}, {v2151BurialField:0,infoboxLeadOrder:1});
    pipeline('a pre-existing correct placement remains literal',box+'\n\n'+lead+tail,box+'\n\n'+lead+tail,{}, {infoboxLeadOrder:0});
    const leadRef=lead+'<ref name="origem">Fonte da introdução.</ref>', boxRef=box.replace('}}','|notas=Detalhe.<ref name="outra">Fonte da caixa.</ref>}}');
    pipeline('references move with their complete containing objects',leadRef+'\n\n'+boxRef+tail,boxRef+'\n\n'+leadRef+tail,{}, {infoboxLeadOrder:1});
    for(const [id,source,extra] of [
        ['different subject',lead.replace('Pessoa de controle','Outro assunto')+'\n\n'+box+tail,{}],
        ['second distinct infobox',lead+'\n\n'+box+'\n\n'+box.replace('ocupação=escritora','ocupação=editora')+tail,{}],
        ['box following a section',lead+'\n\n== Biografia ==\n'+box,{}],
        ['inline box',lead+' '+box+tail,{}],
        ['explicit layout wrapper','<div>\n'+lead+'\n\n'+box+'\n</div>'+tail,{}],
        ['unknown content-producing prefix','{{Modelo desconhecido}}\n'+lead+'\n\n'+box+tail,{}],
        ['stateful expansion in the crossed lead',lead+' {{#vardefine:campo|valor}}\n\n'+box+tail,{}],
        ['conflicting named definitions',lead+'<ref name="origem">Fonte A.</ref>\n\n'+box.replace('}}','|notas=<ref name="origem">Fonte B.</ref>}}')+tail,{}],
        ['non-article namespace',lead+'\n\n'+box+tail,{namespaceNumber:2}],
        ['section edit',lead+'\n\n'+box+tail,{sectionOnly:true}],
        ['disabled relocation',lead+'\n\n'+box+tail,{automaticInfoboxOrder:false}]
    ]) pipeline('relocation refusal: '+id,source,source,extra,{infoboxLeadOrder:0});
    for(const [id,wrap] of [
        ['nowiki',s=>'<nowiki>'+s+'</nowiki>'],
        ['preformatted',s=>'<pre>'+s+'</pre>'],
        ['code example',s=>'<syntaxhighlight lang="wikitext">'+s+'</syntaxhighlight>'],
        ['comment',s=>'<!--'+s+'-->'],
        ['template argument',s=>'{{Modelo|exemplo='+s+'}}']
    ]) {
        const source=wrap(lead+'\n\n'+burial);
        pipeline('protected example: '+id,source,source,{}, {v2151BurialField:0,infoboxLeadOrder:0});
    }
    test(bundle,'selection safety rejects content loss from a relocation',()=>{
        const source=leadRef+'\n\n'+boxRef+tail,plan=api.v2151InfoboxOrderPlan(source,cfg),changed=plan.text;
        ok(changed!==source,'The control genuinely relocates the box');
        for(const tampered of [changed.replace('Fonte da introdução.','Outra fonte.'),changed.replace(/<ref name="origem">[\s\S]*?<\/ref>/,''),changed.replace('Pessoa de controle','Outra pessoa')]) {
            ok(api.safeComposition(source,tampered,cfg),'A selected change cannot alter or delete copied contents');
            ok(api.preservationAudit(source,tampered,cfg).length,'Preservation auditing detects the altered relocated contents');
        }
        eq(api.v2151InfoboxOrderProof(source,changed,plan,cfg),true,'The exact relocation endpoint passes its object proof');
        eq(api.v2151InfoboxOrderProof(source,changed.replace('Pessoa de controle','Outra pessoa'),{...plan,text:changed.replace('Pessoa de controle','Outra pessoa')},cfg),false,'A forged plan cannot alter the copied infobox identity');
    });

}
const output=process.env.REVISAWIKI_REPORT;
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
if(report.status!=='passed')process.exitCode=1;

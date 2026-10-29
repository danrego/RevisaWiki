'use strict';
const parser = require('@babel/parser');
const assert = require('node:assert/strict');
function functions(source) {
    const ast = parser.parse(source, {sourceType: 'unambiguous'}), rows=[];
    function visit(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'FunctionDeclaration') rows.push(node);
        for (const [key,value] of Object.entries(node)) {
            if (['loc','start','end'].includes(key)) continue;
            if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === 'object') visit(value);
        }
    }
    visit(ast);return rows;
}
function apply(source, edits) {
    let end=source.length;
    for (const edit of edits.sort((a,b)=>b.start-a.start)) {
        assert(edit.end<=end,'Overlapping UI edits');
        source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);end=edit.start;
    }
    return source;
}
function once(source,before,after) {
    assert.equal(source.split(before).length-1,1,'UI anchor: '+before.slice(0,90));
    return source.replace(before,after);
}
function transform(input) {
    let source=input, removed=[];
    const rows=functions(source);
    const mount=rows.find(row=>row.id.name==='mount'&&source.slice(row.start,row.end).includes('const online=node'));
    assert(mount,'Primary wikitext mount not found');
    let body=source.slice(mount.start,mount.end);
    const begin=body.indexOf("const online=node('details'"),end=body.indexOf("const report=node('div',undefined,'ajg-report')",begin);
    assert(begin>0&&end>begin);
    body=body.slice(0,begin)+"const tools=node('div',undefined,'ajg-tools');tools.append(settingsPanel());"+body.slice(end);
    body=once(body,'panel.append(top,intro,status,stop,onlineControls,resultSummary,report,tools);renderSpellingPreferences();',
                   'panel.append(top,intro,status,stop,resultSummary,report,tools);');
    body=once(body,'spellingIgnored=[];spellingIgnoredRules.clear();spellingFilter=\'all\';spellingIgnoredSource=null;', '');
    body=body.replace('linkProgress=null;','');
    body=body.replace('Abra Sobre e diagnóstico.','Confira os arquivos de dados, programa e carregador da mesma versão.');
    source=apply(source,[{start:mount.start,end:mount.end,text:body}]);
    const styleMount=functions(source).find(row=>row.id.name==='mountStyles');
    assert(styleMount);
    source=apply(source,[{start:styleMount.start,end:styleMount.end,
        text:once(source.slice(styleMount.start,styleMount.end),',report,diagnosticsPanel());',',report);')}]);
    const busy=functions(source).find(row=>row.id.name==='updateBusyControls');
    assert(busy);
    source=apply(source,[{start:busy.start,end:busy.end,text:once(source.slice(busy.start,busy.end),
        "panel.querySelector('.ajg-cancel').hidden= !onlineBusy;panel.querySelector('.ajg-cancel').disabled= !onlineBusy;",
        "const onlineCancel=panel.querySelector('.ajg-cancel');if(onlineCancel){onlineCancel.hidden=!onlineBusy;onlineCancel.disabled=!onlineBusy;}")}]);
    // Manual spelling reports are no longer reachable. Automatic spelling uses
    // the existing stored exemptions and the main adjustment pipeline.
    const report=functions(source).find(row=>row.id.name==='showReport');
    assert(report);
    let reportBody=source.slice(report.start,report.end);
    const local=parser.parse('('+reportBody+')',{sourceType:'unambiguous'}), reportEdits=[];
    function trimManual(node) {
        if(!node||typeof node!=='object')return;
        if(node.type==='IfStatement') {
            const test=('('+reportBody+')').slice(node.test.start,node.test.end);
            if(test==="result.kind==='spelling'") {
                reportEdits.push({start:node.start-1,end:node.end-1,
                    text:node.alternate?('('+reportBody+')').slice(node.alternate.start,node.alternate.end):''});return;
            }
            if(test==="result.kind!=='spelling'") {
                reportEdits.push({start:node.start-1,end:node.end-1,text:('('+reportBody+')').slice(node.consequent.start,node.consequent.end)});return;
            }
        }
        for(const[key,value]of Object.entries(node)){
            if(['loc','start','end'].includes(key))continue;
            if(Array.isArray(value))value.forEach(trimManual);else if(value&&typeof value==='object')trimManual(value);
        }
    }
    trimManual(local);
    reportBody=apply(reportBody,reportEdits);
    source=apply(source,[{start:report.start,end:report.end,text:reportBody}]);
    const manual=new Set(['checkAll','checkLinks','checkPreview','checkRevision','revisionAudit','runSpelling',
        'spellingSettingsPanel','renderSpellingPreferences','copyDiagnostic','diagnosticsPanel',
        'refreshSpellingResult','canUseSpellingProposal','ignoreSpellingRule','allowSpellingWord',
        'saveSpellingPreferences','remapSpellingIgnores','spellingOptions','loadDisambiguation','disambiguationOptions']);
    const threshold=source.indexOf('function spellingOptions(');
    assert(threshold>0);
    const removals=functions(source).filter(row=>row.start>=threshold&&manual.has(row.id.name));
    for(const row of removals)removed.push({name:row.id.name,bytes:Buffer.byteLength(source.slice(row.start,row.end))});
    source=apply(source,removals.map(row=>({start:row.start,end:row.end,text:''})));
    source=once(source,"serializableOptions(kind==='spelling'?spellingOptions():currentOptions(false))",
                       'serializableOptions(currentOptions(false))');
    const uiTree=parser.parse(source,{sourceType:'unambiguous'}),manualBranches=[];
    function trimExclusiveBranches(node) {
        if(!node||typeof node!=='object')return;
        if(node.type==='ConditionalExpression'&&node.start>threshold&&
                source.slice(node.test.start,node.test.end)==="proposal.kind==='spelling'") {
            manualBranches.push({start:node.start,end:node.end,
                text:source.slice(node.alternate.start,node.alternate.end)});return;
        }
        if(node.type==='IfStatement'&&node.start>threshold) {
            const test=source.slice(node.test.start,node.test.end);
            if(test==="proposal.kind==='spelling'"||test==="finding.code==='disambiguation'&& !stale&&finding.state==='pending'") {
                manualBranches.push({start:node.start,end:node.end,
                    text:node.alternate?source.slice(node.alternate.start,node.alternate.end):''});return;
            }
        }
        for(const[key,value]of Object.entries(node)){
            if(['loc','start','end'].includes(key))continue;
            if(Array.isArray(value))value.forEach(trimExclusiveBranches);
            else if(value&&typeof value==='object')trimExclusiveBranches(value);
        }
    }
    trimExclusiveBranches(uiTree);
    source=apply(source,manualBranches);
    const minor=functions(source).find(row=>row.id.name==='minorEligibility');
    assert(minor);
    source=apply(source,[{start:minor.start,end:minor.end,text:
        "function minorEligibility(before,after,options={}){const changed=typeof before==='string'&&typeof after==='string'&&before!==after;const eligible=changed&&options.autoMinor!==false;return{eligible,toolOnly:eligible,metrics:options.metrics||null,reason:eligible?'Ajustes aplicados pelo RevisaWiki.':changed?'Marcação automática desativada.':'Nenhuma alteração.'};}"}]);
    source=once(source,"if(v219History&&!cfg.minorAllToolChanges)result.minorCheck={...result.minorCheck,eligible:false,reason:'A edição contém uma escolha manual.'};",'');
    source=once(source,'await prepareMinorBaseline(task,proofs)','proofs');
    const minorPrepare=functions(source).find(row=>row.id.name==='prepareMinorBaseline');
    assert(minorPrepare);
    source=apply(source,[{start:minorPrepare.start,end:minorPrepare.end,text:''}]);
    const confirmed=functions(source).find(row=>row.id.name==='confirmedMinorOptions');
    assert(confirmed);
    source=apply(source,[{start:confirmed.start,end:confirmed.end,text:"function confirmedMinorOptions(task,job){return{...(job.options||{}),minorAllToolChanges:true};}"}]);
    const sync=functions(source).find(row=>row.id.name==='syncMinorResult');assert(sync);
    const syncRaw=source.slice(sync.start,sync.end);
    const syncText=syncRaw.replace(/const currentConfirmed=[^;]+;/,'').replace('result.minorCheck.eligible&&currentConfirmed&&currentOptions(false).autoMinor','result.minorCheck.eligible&&currentOptions(false).autoMinor');
    assert(syncRaw!==syncText&&!syncText.includes('minorVerifiedBaseline'));
    source=apply(source,[{start:sync.start,end:sync.end,text:syncText}]);
    source=once(source,'let minorVerifiedBaseline=null,minorOwned=null,minorWriting=false,minorManualOverride=false;','let minorOwned=null,minorWriting=false,minorManualOverride=false;');
    source=once(source,'const minorBaseCache=new Map();','');
    const summary=functions(source).find(row=>row.id.name==='automaticSummary');
    assert(summary);
    source=apply(source,[{start:summary.start,end:summary.end,text:
        "function automaticSummary(kinds,topics){if(currentOptions(false).autoSummary===false)return'';const cfg=personalConfig();if(typeof cfg.summaryText==='string')return cfg.summaryText.trim();return'Minúcias';}"}]);
    const automatic=functions(source).find(row=>row.id.name==='prepareAutomaticProofs');
    assert(automatic);
    const automaticBody=source.slice(automatic.start,automatic.end);
    const serial=functions(source).find(row=>row.id.name==='serializableOptions');assert(serial);
    const serialRaw=source.slice(serial.start,serial.end);
    let serialText=serialRaw.replace("'v221DOITitleProofs','revisionId'","'v221DOITitleProofs','revisionId','v2212OriginalDraftHash','v2212PortalProofRequired','v2212PortalAvailability','v2212VerifiedFiles'");
    serialText=serialText.replace("['pageTitle','spellingFilter'","['v2212OriginalDraftHash','pageTitle','spellingFilter'");
    serialText=serialText.replace("['authorityData','footerProfiles'","['v2212PortalAvailability','authorityData','footerProfiles'");
    assert(serialText!==serialRaw&&serialText.includes("['v2212OriginalDraftHash'"));
    source=apply(source,[{start:serial.start,end:serial.end,text:serialText}]);
    const prior="const cfg=await v221PrepareEvidence(task,await v220PrepareHeadingReferences(task,await prepareHeadingMainArticles(task,options)));";
    const next="const cfg=await v2212PrepareEvidence(task,await v221PrepareEvidence(task,await v220PrepareHeadingReferences(task,await prepareHeadingMainArticles(task,options))));";
    const fs=require('node:fs'),path=require('node:path');
    const preflight=fs.readFileSync(path.join(__dirname,'../src/v2_21_2/preflights.js'),'utf8');
    source=apply(source,[{start:automatic.start,end:automatic.end,
        text:preflight+'\n'+once(automaticBody,prior,next)}]);
    source=once(source,'const role=classifyFooterTemplate(code);if(!role)continue;',
                       'const role=classifyFooterTemplate(code)||v2212PortalFooterRole(code);if(!role)continue;');
    const styleFunction=functions(source).find(row=>row.id.name==='installPanelStyle');
    assert(styleFunction);
    const styleTree=parser.parse('('+source.slice(styleFunction.start,styleFunction.end)+')');
    let cssLiteral=null;
    function findStyle(node){
        if(!node||typeof node!=='object')return;
        if(node.type==='CallExpression'&&node.callee.type==='Identifier'&&node.callee.name==='node'&&
                node.arguments[0]?.value==='style'&&node.arguments[1]?.type==='StringLiteral')cssLiteral=node.arguments[1];
        for(const[key,value]of Object.entries(node)){
            if(['loc','start','end'].includes(key))continue;
            if(Array.isArray(value))value.forEach(findStyle);else if(value&&typeof value==='object')findStyle(value);
        }
    }
    findStyle(styleTree);assert(cssLiteral);
    const removedSelectors=[];
    const obsolete=/\.ajg-(?:online(?:-[a-z-]+)?|diagnostics|diagnostic-text|spelling-settings|spelling-filter|disambig(?:-[a-z-]+)?)(?![a-z-])/;
    const css=cssLiteral.value.replace(/([^{}]+)\{([^{}]*)\}/g,(raw,selectors,declarations)=>{
        if(/[()]/.test(selectors))return raw;
        const kept=selectors.split(',').filter(selector=>{
            if(!obsolete.test(selector))return true;
            removedSelectors.push(selector.trim());return false;
        });
        return kept.length?kept.join(',')+'{'+declarations+'}':'';
    });
    source=apply(source,[{start:styleFunction.start+cssLiteral.start-1,
        end:styleFunction.start+cssLiteral.end-1,text:JSON.stringify(css)}]);
    parser.parse(source,{sourceType:'unambiguous'});
    return {code:source,proof:{removedFunctions:removed,removedBytes:Buffer.byteLength(input)-Buffer.byteLength(source),
        removedCSSSelectors:removedSelectors,
        keptControls:['Ajustar código','Opções de ajuste','Mostrar alterações','Desfazer','Cancelar análise','TemplateStyles'],
        manualSpellingOnly:true}};
}
module.exports={transform,functions,apply,once};

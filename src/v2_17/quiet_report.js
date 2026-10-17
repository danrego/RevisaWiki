    // Visible review is a projection of the current draft. Raw producer output
    // stays on the calculation result and in the issue store for technical QA.
    function v217ProposalKey(proposal) {
        const group=v214ReviewGroupKey(proposal);
        const identity=group||(proposal.reviewEvidence?.confirmed===true?proposal.reviewEvidence.family:null);
        return JSON.stringify([proposal.label,proposal.before,proposal.choices,...(identity?[identity,proposal.start,proposal.end]:[])]);
    }
    function v217SourceProposal(proposal,source,kind) {
        if(!proposal||typeof source!=='string'||!Number.isInteger(proposal.start)||!Number.isInteger(proposal.end)||
            proposal.start<0||proposal.end<=proposal.start||typeof proposal.before!=='string'||!Array.isArray(proposal.choices)||!proposal.choices.length)return false;
        // Native review coordinates refer to the protected view, including its
        // opaque tokens. Spelling uses its own separately checked coordinates.
        if(kind==='spelling')return Number.isInteger(proposal.sourceStart)&&Number.isInteger(proposal.sourceEnd)&&proposal.sourceStart>=0&&
            proposal.sourceEnd<=source.length&&source.slice(proposal.sourceStart,proposal.sourceEnd)===proposal.before&&
            proposal.choices.some(choice=>typeof choice.after==='string'&&choice.after!==proposal.before);
        const view=maskProtected(source,()=>{}).text;
        return proposal.end<=view.length&&view.slice(proposal.start,proposal.end)===proposal.before&&
            proposal.choices.some(choice=>typeof choice.after==='string'&&choice.after!==proposal.before);
    }
    function v217ConfirmedWarnings(source,cfg={}) {
        const confirmed=new Map(),view=protectedView(source),noop=()=>{};
        const receive=(message,evidence)=>{
            if(evidence?.confirmed!==true||typeof evidence.family!=='string')return;
            if(evidence.kind==='invalid-identifier'&&(!evidence.value||/[{}<>\[\]\uE000]/.test(evidence.value)))return;
            const previous=confirmed.get(message),anchors=[...(previous?.anchors||[]),...(evidence.anchor?[evidence.anchor]:[])];
            confirmed.set(message,{...evidence,anchors});
        };
        for(const item of templates(view).nodes){
            const raw=view.slice(item.start,item.end),p=parsedTemplate(raw);
            const warn=(message,evidence)=>receive(message,evidence?{...evidence,anchor:{start:item.start,end:item.end}}:evidence);
            if(CITE_NAMES[p.name]&&cfg.citations!==false){extendedCitation(raw,cfg,noop,warn);citation(raw,cfg,noop,warn);}
            if(INFOBOX_CATALOG[p.name]&&cfg.infoboxes!==false)infobox(raw,noop,warn);
        }
        if(cfg.categories!==false)categoryPass(view,noop,receive);
        return confirmed;
    }
    function v217ResultFindings(result,source,cfg={},baseline=false) {
        if(!result||result.text!==source||typeof source!=='string')return [];
        const findings=[],reports=result.localReports||{};
        const add=(domain,items)=>{for(const finding of items||[])findings.push({...finding,domain,source,state:finding.state||'pending'});};
        if(result.kind==='spelling')add('spelling',(result.warnings||[]).map(message=>({code:'spelling-boundary',message})));
        else {
            const references=reports.references||result.audit||referenceAudit(source,cfg),messages=new Set(references.map(item=>item.message));
            const confirmed=baseline?new Map():v217ConfirmedWarnings(source,cfg);
            add('local',(result.warnings||[]).filter(message=>!messages.has(message)&&
                !(message.startsWith('Data inválida preservada:')&&(reports.dates||[]).some(item=>item.code==='date-impossible'&&item.message.includes(message.replace('Data inválida preservada:','').trim())))&&
                !(message.match(/^Referência "([^"]+)" sem definição/)&&references.some(item=>item.code==='missing-definition'&&item.message.startsWith(message.match(/^Referência "([^"]+)" sem definição/)[0]))))
                .map(message=>({code:'warning',message,...(confirmed.has(message)?{reviewEvidence:confirmed.get(message)}:{})})));
            add('references',references);add('syntax',reports.syntax||syntaxAudit(source));
            add('translation',reports.translation||(cfg.multilingual?translationAudit(source):[]));
            add('tables',reports.tables||(cfg.tableChecks?tableAnalysis(source).findings:[]));
            add('biographies',reports.biographies||[]);add('dates',reports.dates||(cfg.dateChecks?dateAudit(source):[]));
            if(result.previewCheck?.status==='incomplete')add('preview-availability',[{code:'preview-unavailable',severity:'warning',message:'Conferência online indisponível. Use Mostrar previsão para ver o resultado.'}]);
        }
        add('preservation',result.preservation);
        // setIssues uses this exact identity when installing producer records.
        // The pure model must mirror that store before counting DOM entries.
        return [...new Map(findings.map(item=>[item.domain+':'+(item.code||'warning')+':'+item.message,item])).values()];
    }
    function v217FinalReviewResult(result,cfg={}) {
        if(!result||typeof result.text!=='string'||result.kind==='spelling')return result;
        const source=result.text;
        return {...result,reviewSource:source,reviewBinding:v211FreshnessKey(cfg),localReports:{...(result.localReports||{}),
            references:referenceAudit(source,cfg),syntax:syntaxAudit(source),
            translation:cfg.multilingual?translationAudit(source):[],
            tables:cfg.tableChecks===false?[]:tableAnalysis(source).findings,
            biographies:biographyStyleAudit(source,cfg),dates:cfg.dateChecks===false?[]:dateAudit(source)}};
    }
    function v217MigrationEvidence(proposal,source,cfg) {
        const migration=migrateForeignTemplate(proposal.before,cfg);
        if(!migration?.blocked||migration.quietNativeRefusal)return null;
        const issues=migration.issueEvidence;
        if(!Array.isArray(issues)||!issues.some(item=>item.confirmed===true))return null;
        return {family:'migration:'+parsedTemplate(proposal.before).name,confirmed:true,kind:'migration-choice'};
    }
    function v217ProposalEvidence(proposal,source,cfg={}) {
        if(proposal.reviewGroup?.kind==='unsupported-template-parameter')return null;
        if(proposal.kind==='spelling')return {family:'spelling:'+proposal.ruleId,confirmed:true,kind:'spelling'};
        if(/^translation-/.test(proposal.id||''))return v217MigrationEvidence(proposal,source,cfg);
        if(proposal.reviewEvidence?.confirmed===true)return proposal.reviewEvidence;
        // A plausible choice or a producer id cannot prove a final-text defect.
        // Optional formatting and speculative repairs stay in technical output.
        return null;
    }
    function v217FindingFamily(finding) {
        if(finding.reviewEvidence?.family)return finding.reviewEvidence.family;
        if(['unclosed-table','table-unclosed'].includes(finding.code))return 'unclosed-table';
        if(finding.code==='warning')return 'local:'+finding.message;
        if(finding.code==='parser')return 'parser';
        return finding.code||finding.domain||'warning';
    }
    function v217FindingVisible(finding,context={}) {
        if(finding.state!=='pending'||finding.source!==context.source)return false;
        // Findings outside an opened section are not defects in this draft.
        if(['references','syntax','translation','dates','biographies','tables'].includes(finding.domain)&&Number.isInteger(finding.start)&&finding.start<0)return false;
        if(finding.severity==='error')return true;
        if(technicalFinding(finding))return false;
        if(finding.domain==='local')return finding.reviewEvidence?.confirmed===true;
        if(finding.domain==='preview-availability')return false;
        if(['short-citation-unconfirmed','missing-renderer','foreign-unknown','foreign-template','foreign-interwiki-helper','revision-unavailable','preview-unavailable'].includes(finding.code))return false;
        if(finding.domain==='translation')return finding.code==='ambiguous-citation';
        if(finding.domain==='references')return finding.code==='short-citation-ambiguous';
        if(finding.domain==='biographies'||finding.domain==='dates'||finding.domain==='syntax'||finding.domain==='tables'||finding.domain==='preservation')return true;
        if(finding.domain==='preview')return finding.code==='parser';
        if(finding.domain==='revision')return finding.code==='newer-revision';
        if(finding.domain==='links')return ['missing','missing-page','missing-file','missing-template','disambiguation','interwiki','redirect-loop','invalid-title'].includes(finding.code);
        if(finding.domain==='spelling')return true;
        if(finding.domain==='styles')return !['css-unavailable','css-api-warning'].includes(finding.code);
        // Explicit check failures retain their own result, while optional
        // availability notices cannot turn an otherwise valid draft red.
        return finding.reviewEvidence?.confirmed===true||['rendered-loss','local-incomplete','check-failed','calculation-failed','css-invalid','css-unsupported'].includes(finding.code);
    }
    function v217PlanMetrics(findings,groups,recoveryEntries=0) {
        const proposalEntries=groups.reduce((count,group)=>count+group.proposals.length,0);
        return {findingEntries:Math.min(60,findings.length),findingFamilies:findings.length,
            proposalEntries,proposalGroups:groups.length,proposalOccurrences:groups.reduce((count,group)=>count+(group.occurrences||group.proposals.length),0),
            recoveryEntries,headerCount:findings.length+groups.length+recoveryEntries,
            renderedEntries:Math.min(60,findings.length)+proposalEntries+recoveryEntries};
    }
    function v217BaselineVisibleReviewPlan(input={}) {
        const {result,source,options={}}=input,ignored=new Set(input.ignoredSuggestionKeys||[]);
        const raw=input.findings||v217ResultFindings(result,source,options,true),represented=v214RepresentedReviewMessages(result,source);
        const findings=raw.filter(finding=>finding.source===source&&finding.state==='pending'&&v214ReviewFindingVisible(finding)&&
            !(finding.domain==='local'&&finding.code==='warning'&&finding.severity!=='error'&&represented.has(finding.message)));
        const proposals=result?.text===source?(result.suggestions||[]).filter(proposal=>!ignored.has(v217ProposalKey(proposal))):[];
        const groups=v214ReviewGroups(proposals),recoveryEntries=result?.text===source&&(result.removedDescriptions||[]).length?1:0;
        return {source,findings,groups,rawFindings:raw.length,rawProposals:proposals.length,...v217PlanMetrics(findings,groups,recoveryEntries)};
    }
    function v217VisibleReviewPlan(input={}) {
        const {source,options={}}=input,ignored=new Set(input.ignoredSuggestionKeys||[]),fresh=input.result?.text===source&&typeof source==='string';
        const result=fresh&&(input.result.reviewSource!==source||input.result.reviewBinding!==v211FreshnessKey(options))?v217FinalReviewResult(input.result,options):input.result;
        const raw=input.findings||v217ResultFindings(result,source,options),confirmed=fresh?v217ConfirmedWarnings(source,options):new Map();
        const finalCore=new Map();
        if(fresh&&result.kind!=='spelling')for(const domain of ['references','syntax','translation','tables','biographies','dates'])
            finalCore.set(domain,new Set((result.localReports?.[domain]||[]).map(item=>item.code+':'+item.start)));
        const proposals=fresh?(result.suggestions||[]).filter(proposal=>!ignored.has(v217ProposalKey(proposal))&&v217SourceProposal(proposal,source,result.kind)):[];
        const groupMap=new Map(),groups=[];
        for(const proposal of proposals){
            const evidence=v217ProposalEvidence(proposal,source,options);if(!evidence)continue;
            const key=proposal.kind==='spelling'?null:evidence.family,existing=key&&groupMap.get(key);
            if(existing){existing.occurrences++;existing.proposals.push(proposal);existing.allProposals.push(proposal);continue;}
            const group={key,label:proposal.label,proposals:[proposal],allProposals:[proposal],occurrences:1,warningMessages:[],evidence};
            if(key)groupMap.set(key,group);groups.push(group);
        }
        const families=new Map(),findings=[];
        for(const original of raw){
            if(finalCore.has(original.domain)&&!finalCore.get(original.domain).has(original.code+':'+original.start))continue;
            const finding=original.domain==='local'&&confirmed.has(original.message)?{...original,reviewEvidence:confirmed.get(original.message)}:original;
            if(!v217FindingVisible(finding,{source}))continue;
            const family=v217FindingFamily(finding);
            if(groups.some(group=>group.evidence.family===family))continue;
            // The structured final audit covers its local producer's duplicate.
            if(finding.domain==='local'&&raw.some(other=>other!==original&&other.domain!=='local'&&other.message===finding.message&&v217FindingVisible(other,{source})))continue;
            const existing=families.get(family);
            const locations=finding.reviewEvidence?.anchors?.length?finding.reviewEvidence.anchors:finding.anchor?[finding.anchor]:Number.isInteger(finding.start)&&finding.start>=0?[{start:finding.start,end:finding.end||finding.start+1}]:[];
            const occurrences=Math.max(1,locations.length);
            if(existing){existing.occurrences+=occurrences;existing.members.push(original);existing.locations.push(...locations);if(finding.severity==='error')existing.severity='error';continue;}
            const row={...finding,anchor:finding.anchor||locations[0],locations,occurrences,members:[original]};families.set(family,row);findings.push(row);
        }
        const recoveryEntries=fresh&&(result.removedDescriptions||[]).length?1:0;
        return {source,findings,groups,rawFindings:raw.length,rawProposals:proposals.length,...v217PlanMetrics(findings,groups,recoveryEntries)};
    }

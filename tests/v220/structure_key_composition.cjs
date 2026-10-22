'use strict';
// Prescribed endpoints precede wiring the existing key plan into the final finite pass.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),cases=[];
for(const key of['ano','year'])for(const[eolName,eol]of[['lf','\n'],['crlf','\r\n']]){
 const source='{{citar livro'+eol+'|título=Obra'+eol+'|'+key+'=1 de'+eol+'janeiro de 2020'+eol+'}}',plain='{{citar livro|título=Obra|'+key+'=1 de janeiro de 2020}}',fixed=plain.replace('|'+key+'=','|data=');
 cases.push({id:key+'-'+eolName+'-bare',source,expected:fixed,strictPlanUnchanged:true});
 cases.push({id:key+'-'+eolName+'-note',source:'Texto.<ref name="controle">'+source+'</ref>\n{{Referências}}',expected:'Texto.<ref name="controle">'+fixed+'</ref>\n{{Referências}}',strictPlanUnchanged:true});
 cases.push({id:key+'-'+eolName+'-cell',source:'{| class="wikitable"\n| '+source+'\n|}',expected:'{| class="wikitable"\n| '+fixed+'\n|}',strictPlanUnchanged:true});
 for(const[id,wrap]of[['opaque',x=>'{{Modelo incerto|texto='+x+'}}'],['argument',x=>'{{{texto|'+x+'}}}'],['attribute',x=>'<span title="'+x+'">Texto</span>'],['table-attribute',x=>'{| class="wikitable"\n| title="'+x+'" | Texto\n|}'],['nowiki',x=>'<nowiki>'+x+'</nowiki>'],['code',x=>'<code>'+x+'</code>']])cases.push({id:key+'-'+eolName+'-'+id,source:wrap(source),expected:wrap(source),strictPlanUnchanged:true});
 for(const option of['automaticCitationKeyRepairs','automaticParameterNames','citations'])cases.push({id:key+'-'+eolName+'-off-'+option,source,expected:plain,options:{[option]:false},strictPlanUnchanged:true});
 cases.push({id:key+'-'+eolName+'-off-dates',source,expected:source,options:{dates:false},strictPlanUnchanged:true});
}
// The inherited citation date writer recognizes ano, not an interior-line year.
// Such year values retain the strict original validation and source bytes.
for(const c of cases)if(c.id.startsWith('year-'))c.expected=c.source;
if(process.argv.includes('--spec')){console.log(JSON.stringify({kind:'existing-key-plan-finite-composition-spec',cases},null,2));process.exit(0);}
const report={kind:'existing-key-plan-finite-composition',status:'passed',uniqueCases:cases.length,cases:[],failures:[],checks:0,wikipediaWrites:0,networkRequests:0};
for(const f of process.argv.slice(2)){const a=require(path.resolve(f)),runtimeSha256=sha(fs.readFileSync(f));for(const c of cases){const options={...a.defaults,namespaceNumber:0,pageTitle:'Obra de controle',contentModel:'wikitext',autoPreview:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,tableAccessibility:false,...c.options},row={id:c.id,runtimeSha256,sourceSha256:sha(c.source),expectedEndpointSha256:sha(c.expected),status:'passed'};try{
 const p=a.v218CitationKeyPlan(c.source,options);report.checks++;assert.equal(p.text,c.source,'The strict key validator must not accept an interior line break');
 const first=a.calculate({kind:'adjust',source:c.source,originalSource:c.source,options}),second=a.calculate({kind:'adjust',source:first.text,originalSource:first.text,options});row.endpointSha256=sha(first.text);row.appliedIds=first.changes.map(x=>[x.id,x.count]);report.checks++;assert.equal(first.text,c.expected);report.checks++;assert.equal(second.text,c.expected);report.checks++;assert.notEqual(first.localCompositionSafety?.accepted,false);report.checks++;assert.deepEqual(a.preservationAudit(c.source,c.expected,options),[]);report.checks++;assert.equal(!!a.safeComposition(c.source,c.expected,options),false);
 }catch(e){row.status='failed';row.error=e.message;report.failures.push(row);}report.cases.push(row);}}
report.status=report.failures.length?'failed':'passed';console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;

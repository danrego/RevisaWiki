'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const collector='\n{{Referências}}',body='Fonte literal alfa.';
const referenceCases=[
 {id:'ref-literal-call',source:'Texto.<ref name="a">'+body+'</ref> Nova chamada.<ref nome="a"/>'+collector,expected:'Texto.<ref name="a">'+body+'</ref> Nova chamada.<ref name="a"/>'+collector,adjustedExpected:'Texto.<ref name="a">'+body+'</ref> Nova chamada.<ref name="a" />'+collector,changes:1,native:true},
 {id:'ref-double-native-group',source:'Texto.<ref nome="a" grupo="n">'+body+'</ref> Nova chamada.<ref name="a" group="n" />\n<references group="n" />',expected:'Texto.<ref name="a" group="n">'+body+'</ref> Nova chamada.<ref name="a" group="n" />\n<references group="n" />',changes:2,native:true},
 {id:'ref-name-definition',source:'Texto.<ref nome="a">'+body+'</ref> Nova chamada.<ref name="a" />'+collector,expected:'Texto.<ref name="a">'+body+'</ref> Nova chamada.<ref name="a" />'+collector,changes:1},
 {id:'ref-group-definition',source:'Texto.<ref name="a" grupo="n">'+body+'</ref> Nova chamada.<ref name="a" group="n" />\n<references group="n" />',expected:'Texto.<ref name="a" group="n">'+body+'</ref> Nova chamada.<ref name="a" group="n" />\n<references group="n" />',changes:1},
 {id:'ref-grouped-call',source:'Texto.<ref name="a" group="n">'+body+'</ref> Nova chamada.<ref nome="a" grupo="n"/>\n<references group="n" />',expected:'Texto.<ref name="a" group="n">'+body+'</ref> Nova chamada.<ref name="a" group="n"/>\n<references group="n" />',adjustedExpected:'Texto.<ref name="a" group="n">'+body+'</ref> Nova chamada.<ref name="a" group="n" />\n<references group="n" />',changes:2,native:true},
 {id:'ref-two-calls-one-definition',source:'Texto.<ref name="a">'+body+'</ref> Outra.<ref nome="a" /> Terceira.<ref nome="a" />'+collector,expected:'Texto.<ref name="a">'+body+'</ref> Outra.<ref name="a" /> Terceira.<ref name="a" />'+collector,changes:2},
 {id:'ref-independent-families',source:'Texto.<ref name="a">'+body+'</ref> Outra.<ref nome="a" /> Texto.<ref name="b">Fonte literal beta.</ref> Outra.<ref nome="b" />'+collector,expected:'Texto.<ref name="a">'+body+'</ref> Outra.<ref name="a" /> Texto.<ref name="b">Fonte literal beta.</ref> Outra.<ref name="b" />'+collector,changes:2},
 {id:'ref-citation-body',source:'Texto.<ref name="a">{{Citar web|url=https://example.test/fonte|título=Fonte literal|autor=Autor literal}}</ref> Outra.<ref nome="a" />'+collector,expected:'Texto.<ref name="a">{{Citar web|url=https://example.test/fonte|título=Fonte literal|autor=Autor literal}}</ref> Outra.<ref name="a" />'+collector,changes:1}
];
referenceCases.push({id:'ref-independent-anonymous-definition',source:referenceCases[0].source.replace(collector,' Outra.<ref>Fonte anônima literal.</ref>'+collector),expected:referenceCases[0].expected.replace(collector,' Outra.<ref>Fonte anônima literal.</ref>'+collector),adjustedExpected:referenceCases[0].adjustedExpected.replace(collector,' Outra.<ref>Fonte anônima literal.</ref>'+collector),changes:1});
const referenceNegatives=[
 ['ref-missing-definition','Texto.<ref nome="a" />'+collector],
 ['ref-equal-duplicate-definitions','Texto.<ref name="a">'+body+'</ref><ref name="a">'+body+'</ref><ref nome="a" />'+collector],
 ['ref-conflicting-definitions','Texto.<ref name="a">'+body+'</ref><ref name="a">Fonte diferente.</ref><ref nome="a" />'+collector],
 ['ref-name-collision','Texto.<ref name="a">'+body+'</ref><ref nome="a" name="a" />'+collector],
 ['ref-group-collision','Texto.<ref nome="a" grupo="n" group="n">'+body+'</ref><ref name="a" group="n" />\n<references group="n" />'],
 ['ref-dynamic-name','Texto.<ref name="a">'+body+'</ref><ref nome="{{Nome}}" />'+collector],
 ['ref-entity-name','Texto.<ref name="a">'+body+'</ref><ref nome="&#97;" />'+collector],
 ['ref-follow','Texto.<ref name="a">'+body+'</ref><ref nome="a" follow="a" />'+collector],
 ['ref-details','Texto.<ref name="a">'+body+'</ref><ref nome="a" details="1" />'+collector],
 ['ref-unknown-attribute','Texto.<ref name="a">'+body+'</ref><ref nome="a" label="alfa" />'+collector],
 ['ref-duplicate-foreign-key','Texto.<ref name="a">'+body+'</ref><ref nome="a" nome="a" />'+collector],
 ['ref-case-sensitive-name','Texto.<ref name="A">'+body+'</ref><ref nome="a" />'+collector],
 ['ref-wrong-group','Texto.<ref name="a" group="m">'+body+'</ref><ref nome="a" grupo="n"/>\n<references group="m" /><references group="n" />'],
 ['ref-foreign-cycle','Texto.<ref nome="a">'+body+'</ref><ref nome="a" />'+collector],
 ['ref-two-foreign-definitions','Texto.<ref nome="a">'+body+'</ref><ref nome="a">'+body+'</ref><ref name="a" />'+collector],
 ['ref-split-collector-interval','Texto.<ref name="a">'+body+'</ref><references /><ref nome="a" /><references />'],
 ['ref-no-collector','Texto.<ref name="a">'+body+'</ref><ref nome="a" />'],
 ['ref-earlier-collector','<references />Texto.<ref name="a">'+body+'</ref><ref nome="a" />'],
 ['ref-unknown-template','{{Modelo desconhecido}} Texto.<ref name="a">'+body+'</ref><ref nome="a" />'+collector],
 ['ref-nested-template','Texto.<ref name="a">'+body+'</ref>{{Citar web|título=<ref nome="a" />}}'+collector],
 ['ref-one-unresolved-family-blocks-atomic-set','Texto.<ref name="a">'+body+'</ref><ref nome="a" /><ref nome="b" />'+collector],
 ['ref-nowiki','<nowiki>'+referenceCases[0].source+'</nowiki>'],
 ['ref-comment','<!--'+referenceCases[0].source+'-->']
].map(([id,source])=>({id,source,expected:source}));
function spanTable(keys,header=true){return '{| class="wikitable"\n'+(header?'! A !! B !! C\n|-\n':'')+keys.map((key,index)=>'| '+key+'="2" | Celula '+String.fromCharCode(65+index)+'\n| Final '+String.fromCharCode(65+index)).join('\n|-\n')+'\n|}';}
const tableCases=[
 ...[2,3,4].map(length=>{const keys=['colpan','colpsan','colpan','colpsan'].slice(0,length),source=spanTable(keys),expected=spanTable(Array(length).fill('colspan'));return {id:'table-'+length+'-independent-spans',source,expected,changes:length,native:true};}),
 {id:'table-two-spans-reference-preservation',source:spanTable(['colpan','colpsan']).replace('Final A','Final A<ref name="a">'+body+'</ref>').replace('Final B','Final B<ref name="a" />')+collector,expected:spanTable(['colspan','colspan']).replace('Final A','Final A<ref name="a">'+body+'</ref>').replace('Final B','Final B<ref name="a" />')+collector,changes:2,native:true}
];
const rowSpanSource='{| class="wikitable"\n! A !! B !! C\n|-\n| rowpan="2" | Celula A || Final A || Final B\n|-\n| Final C || Final D\n|-\n| rowpsan="2" | Celula B || Final E || Final F\n|-\n| Final G || Final H\n|}';
tableCases.push({id:'table-two-independent-rowspans',source:rowSpanSource,expected:rowSpanSource.replace('rowpan','rowspan').replace('rowpsan','rowspan'),changes:2});
const mixedSpanSource='{| class="wikitable"\n! A !! B !! C\n|-\n| rowpan="2" | Celula A || Final A || Final B\n|-\n| Final C || Final D\n|-\n| colpsan="2" | Celula B || Final E\n|}';
tableCases.push({id:'table-independent-row-and-column-spans',source:mixedSpanSource,expected:mixedSpanSource.replace('rowpan','rowspan').replace('colpsan','colspan'),changes:2});
const tableNegatives=[
 ['table-no-independent-width',spanTable(['colpan','colpsan'],false)],
 ['table-five-spans',spanTable(Array(5).fill('colpan'))],
 ['table-inconsistent-span-value',spanTable(['colpan','colpsan']).replace('colpsan="2"','colpsan="3"')],
 ['table-unknown-typo',spanTable(['colpan','colpsn'])],
 ['table-dynamic-span',spanTable(['colpan','colpsan']).replace('colpsan="2"','colpsan="{{Valor}}"')],
 ['table-duplicate-span',spanTable(['colpan','colpsan']).replace('colpsan="2"','colpsan="2" colspan="2"')],
 ['table-mixed-defect-family',spanTable(['colpan','colpsan']).replace('colpsan="2"','colspan="2”')],
 ['table-joint-sort-defect',spanTable(['colpan','colpsan']).replace('class="wikitable"','class="wikitable sortable"').replace('! A','! data-sort-vaule="1" | A')],
 ['table-protected', '<nowiki>'+spanTable(['colpan','colpsan'])+'</nowiki>'],
 ['table-unclosed',spanTable(['colpan','colpsan']).replace('\n|}','')],
 ['table-native-valid-control',spanTable(['colspan','colspan'])]
].map(([id,source])=>({id,source,expected:source}));
const cases={referenceCases,referenceNegatives,tableCases,tableNegatives};module.exports=cases;
function options(api){return {...api.defaults,namespaceNumber:0,pageTitle:'Exemplo técnico',authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,autoPreview:false,registryDoiCheck:false,minorBaseConfirmed:true,unifiedNotesReferences:false,referenceColumns:false,tableAccessibility:false,endTemplateOrder:false,endSectionOrder:false,headings:false,automaticIdenticalReferences:false,moveNamedRefs:false};}
function run(){
 const args=process.argv.slice(2),files=[];for(let index=0;index<args.length;index++){assert.ok(['--core','--complete'].includes(args[index]),'Use --core FILE and --complete FILE');files.push(path.resolve(args[++index]));}
 if(!files.length){const dir=path.resolve(__dirname,'../../dist/2.17.0');files.push(path.join(dir,'RevisaWiki_v2_17_0.js'),path.join(dir,'RevisaWiki_v2_17_0_completo.js'));}
 const report={kind:'bounded-reference-and-table-repairs',wikipediaWrites:0,networkRequests:0,bundles:[],cases:0,assertions:0,failures:[]},sha=value=>crypto.createHash('sha256').update(value).digest('hex');
 const eq=(actual,expected,message)=>{report.assertions++;assert.deepEqual(actual,expected,message);};
 for(const file of files){const api=require(file),cfg=options(api),bundle=path.basename(file);report.bundles.push({file:bundle,version:api.version,sha256:sha(fs.readFileSync(file))});
  for(const [kind,items]of [['reference',[...referenceCases,...referenceNegatives]],['table',[...tableCases,...tableNegatives]]])for(const item of items){report.cases++;try{
   const plan=kind==='reference'?api.v217NativeRefAttributePlan(item.source,cfg):api.v217TableFiniteRepairPlan(item.source,cfg),proof=kind==='reference'?api.v217NativeRefAttributeProof:api.v217TableFiniteRepairProof;
   eq(plan.text,item.expected,item.id+' has an independently written exact endpoint');eq(plan.edits.length,item.changes||0,item.id+' edit count');eq(proof(item.source,item.expected,plan,cfg),true,item.id+' source-bound proof');
   eq(proof(item.source+' ',item.expected,plan,cfg),false,item.id+' stale proof refuses another source');eq(proof(item.source,item.expected+' ',plan,cfg),false,item.id+' proof refuses changed endpoint');
   const next=kind==='reference'?api.v217NativeRefAttributePlan(item.expected,cfg):api.v217TableFiniteRepairPlan(item.expected,cfg);eq(next.edits,[],item.id+' is idempotent');
   if(item.changes){const actual=api.calculate({kind:'adjust',source:item.source,options:cfg});eq(actual.text,item.adjustedExpected||item.expected,item.id+' adjust action reaches endpoint');eq(actual.preservation,[],item.id+' facts and references remain preserved');eq(api.calculate({kind:'adjust',source:actual.text,options:cfg}).text,actual.text,item.id+' adjust completes in one action');const retained=api.v211RetainedAdjustments(item.source,item.expected,[],cfg);eq(retained.exact,true,item.id+' retained count is exact');eq(retained.count,item.changes,item.id+' counts the independent corrected attributes');eq(api.safeComposition(item.source,actual.text,cfg),'',item.id+' selective comparison accepts the proved repair');eq(api.v211MinorMechanicalPlan(item.source,cfg).text,actual.text,item.id+' mechanical replay reaches the complete endpoint');eq(actual.minorCheck.eligible,true,item.id+' mechanical source proof remains eligible');
    const altered=kind==='table'?item.expected.replace('Celula A','Celula alterada'):item.expected.replace('Fonte literal','Fonte falsa');eq(altered!==item.expected,true,item.id+' mutation control changes a real payload');eq(proof(item.source,altered,plan,cfg),false,item.id+' plan never authorizes changed payload');eq(api.syntaxRepairSourceProof(item.source,altered,cfg).accepted,false,item.id+' source proof rejects changed payload');eq(Boolean(api.safeComposition(item.source,altered,cfg)),true,item.id+' selective comparison rejects changed payload');eq(api.preservationAudit(item.source,altered,cfg).length>0,true,item.id+' independent audit detects changed payload');
   }
  }catch(error){report.failures.push({bundle,id:item.id,message:error.message});}}
  for(const [kind,item]of [['reference',referenceCases[0]],['table',tableCases[0]]])for(const override of [{namespaceNumber:1},{sectionOnly:true},{syntaxRepairs:false},{structuralRepairs:false},kind==='reference'?{references:false}:{automaticTableRepairs:false}]){report.cases++;try{const build=kind==='reference'?api.v217NativeRefAttributePlan:api.v217TableFiniteRepairPlan;eq(build(item.source,{...cfg,...override}).edits,[],kind+' respects disabled scope '+JSON.stringify(override));}catch(error){report.failures.push({bundle,id:kind+'-scope',message:error.message});}}
  const burial='{{Info/Biografia|nome=Pessoa fictícia|local_sepultamento=Local literal<ref name="s">Fonte sepultamento.</ref>|data_sepultamento=2 de janeiro de 2000}}\n'+referenceCases[0].source;
  report.cases++;try{const result=api.calculate({kind:'adjust',source:burial,options:cfg});eq(result.text.includes('|local_sepultamento=Local literal<ref name="s">Fonte sepultamento.</ref>|data_sepultamento=2 de janeiro de 2000'),true,'sepultamento fields and their reference remain exact');eq(result.preservation,[],'sepultamento reference preserved');}catch(error){report.failures.push({bundle,id:'sepultamento-preservation',message:error.message});}
 }
 process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.failures.length)process.exitCode=1;
}
if(require.main===module)run();

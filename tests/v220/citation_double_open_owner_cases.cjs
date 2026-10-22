'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const files=process.argv.slice(2);if(!files.length)throw new Error('Provide frozen built bundle paths.');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),report={kind:'double-reference-opening-owner-boundaries',status:'passed',checks:0,cases:[],networkRequests:0,wikipediaWrites:0};
const bad='<ref name="a"<ref>Fonte literal.</ref>',good='<ref name="a">Fonte literal.</ref>';
const positive=[
 ['top-level',bad,good],
 ['named-group','<ref name="a" group="nota" <ref>Fonte literal.</ref>','<ref name="a" group="nota">Fonte literal.</ref>'],
 ['reversed-group','<ref group="nota" name="a" <ref>Fonte literal.</ref>','<ref group="nota" name="a">Fonte literal.</ref>'],
 ['single-quoted',"<ref name='a' <ref>Fonte literal.</ref>","<ref name='a'>Fonte literal.</ref>"],
 ['complete-static-body','<ref name="a" <ref>Fonte <i>literal</i> com [[Tema]].</ref>','<ref name="a">Fonte <i>literal</i> com [[Tema]].</ref>'],
 ['native-citation-body','<ref name="a" <ref>{{Citar web|url=https://example.invalid/fonte|titulo=Fonte literal}}</ref>','<ref name="a">{{Citar web|url=https://example.invalid/fonte|titulo=Fonte literal}}</ref>'],
 ['table-cell','{| class="wikitable"\n|-\n| Texto.'+bad+'\n|}\n','{| class="wikitable"\n|-\n| Texto.'+good+'\n|}\n'],
 ['table-cell-with-attrs','{| class="wikitable"\n|-\n| style="text-align:left" | Texto.'+bad+'\n|}\n','{| class="wikitable"\n|-\n| style="text-align:left" | Texto.'+good+'\n|}\n'],
 ['two-independent-openings',bad+' Texto.<ref name="b" <ref>Outra fonte literal.</ref>',good+' Texto.<ref name="b">Outra fonte literal.</ref>'],
 ['positive-before-opaque',bad+'\n{{Modelo incerto|texto=<ref name="b"<ref>Outra fonte literal.</ref>}}',good+'\n{{Modelo incerto|texto=<ref name="b"<ref>Outra fonte literal.</ref>}}'],
 ['positive-before-attribute',bad+'\n<span title=\'<ref name="b"<ref>Outra fonte literal.</ref>\'>Texto.</span>',good+'\n<span title=\'<ref name="b"<ref>Outra fonte literal.</ref>\'>Texto.</span>'],
 ['positive-after-opaque','{{Modelo incerto|texto=<ref name="b"<ref>Outra fonte literal.</ref>}}\n'+bad,'{{Modelo incerto|texto=<ref name="b"<ref>Outra fonte literal.</ref>}}\n'+good]
];
const negative=[
 ['html-attribute-single',"<span title='<ref name=\"a\"<ref>Fonte literal.</ref>'>Texto.</span>"],
 ['html-attribute-double','<span title="<ref name=\'a\'<ref>Fonte literal.</ref>">Texto.</span>'],
 ['html-attribute-unquoted','<span title='+bad+'>Texto.</span>'],
 ['html-attribute-incomplete',"<span title='"+bad],
 ['html-unknown-element','<widget:item data-x=\''+bad+'\'>Texto.</widget:item>'],
 ['html-ref-attribute',"<ref name='prefixo "+bad+"'>Texto.</ref>"],
 ['template-opaque','{{Modelo incerto|texto='+bad+'}}'],
 ['template-incomplete','{{Modelo incerto|texto='+bad],
 ['template-citation-owner','{{Citar web|titulo='+bad+'|url=https://example.invalid/}}'],
 ['triple-argument','{{{texto|'+bad+'}}}'],
 ['triple-argument-incomplete','{{{texto|'+bad],
 ['parser-function-owner','{{#if:1|'+bad+'}}'],
 ['subst-owner','{{subst:Modelo|'+bad+'}}'],
 ['wiki-link','[[Tema|'+bad+']]'],
 ['wiki-link-incomplete','[[Tema|'+bad],
 ['external-link','[https://example.invalid/ '+bad+']'],
 ['external-link-incomplete','[https://example.invalid/ '+bad],
 ['html-body-owner','<div>'+bad+'</div>'],
 ['html-body-incomplete','<div>'+bad],
 ['table-opening-attribute','{| class="'+bad+'"\n| X\n|}'],
 ['table-row-attribute','{|\n|- title=\''+bad+'\'\n| X\n|}'],
 ['table-cell-attribute','{|\n| title=\''+bad+'\' | X\n|}'],
 ['table-cell-unquoted','{|\n| title='+bad+' | X\n|}'],
 ['table-cell-multiline-attribute','{|\n| title="texto\n'+bad+'" | X\n|}'],
 ['table-caption-attribute','{|\n|+ title=\''+bad+'\' | X\n| X\n|}'],
 ['table-incomplete','{| class="wikitable"\n| Texto.'+bad],
 ['unknown-body','<ref name="a" <ref>{{Modelo incerto}}</ref>'],
 ['parser-body','<ref name="a" <ref>{{#if:1|Fonte literal.}}</ref>'],
 ['triple-body','<ref name="a" <ref>{{{texto|Fonte literal.}}}</ref>'],
 ['unknown-nested-body','<ref name="a" <ref>{{Citar web|titulo={{Modelo incerto}}|url=https://example.invalid/}}</ref>'],
 ['raw-html-reference-in-body','<ref name="a" <ref>Fonte.<span title="</ ref>">Texto.</span></ref>'],
 ['raw-html-unknown-incomplete-body','<ref name="a" <ref>Fonte.<widget:item title="Texto.</ref>'],
 ['protected-nowiki','<nowiki>'+bad+'</nowiki>'],
 ['protected-code','<code>'+bad+'</code>'],
 ['nested-reference','<ref name="outer">'+bad+'</ref>']
];
for(const file of files){const api=require(path.resolve(file)),bundle=path.basename(file),runtimeSha256=sha(fs.readFileSync(file));
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false,automaticInfoboxOrder:false,automaticTableRepairs:false,tableSyntaxRepairs:false,tableAccessibility:false};
 const eq=(a,b,m)=>{report.checks++;assert.equal(a,b,m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
 for(const [id,source,expected=source]of [...positive,...negative]){
  const plan=api.v220CitationPlan(source,cfg);eq(plan.text,expected,id+' new plan changed the wrong owner');ok(api.v220CitationPlanProof(source,expected,plan,cfg),id+' recomputed proof');eq(api.v220CitationPlan(expected,cfg).text,expected,id+' helper idempotence');
  const result=api.calculate({kind:'adjust',source,options:cfg});
  if(expected===source){ok(!result.changes.some(c=>c.id==='v220ReferenceDoubleOpening'),id+' complete action applied the vetoed rule');ok(result.text.includes(source)||result.localCompositionSafety?.accepted===false,id+' complete action changed the opaque source without refusal');}
  else{const inheritedHeaderForms={
   'reversed-group':'<ref name="a" group="nota">Fonte literal.</ref>',
   'single-quoted':'<ref name="a">Fonte literal.</ref>'
  };ok(result.text.includes(inheritedHeaderForms[id]||expected),id+' complete action did not reach the declared safe opening: '+JSON.stringify(result.text));ok(result.localCompositionSafety?.accepted!==false,id+' safe repair refused');}
  eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,id+' action idempotence');
  report.cases.push({id,bundle,runtimeSha256,status:'passed',sourceSha256:sha(source),expectedSha256:sha(expected),appliedSha256:sha(result.text)});
 }
 for(const name of ['a','fonte-a','fonte_2','nome:3'])for(const group of ['', 'nota','lower-alpha'])for(const quote of ['"',"'"]){
  const attrs=' name='+quote+name+quote+(group?' group='+quote+group+quote:''),source='<ref'+attrs+' <ref>Fonte literal.</ref>',expected='<ref'+attrs+'>Fonte literal.</ref>',plan=api.v220CitationPlan(source,cfg);
  eq(plan.text,expected,'literal name/group header not repaired');ok(api.v220CitationPlanProof(source,expected,plan,cfg),'literal name/group proof');
  for(const wrap of [s=>'<span title='+ (quote==='"'?"'":'"')+s+(quote==='"'?"'":'"')+'>Texto.</span>',s=>'{{Modelo incerto|texto='+s+'}}',s=>'{{{texto|'+s+'}}}',s=>'[[Tema|'+s+']]',s=>'[https://example.invalid/ '+s+']']){
   const opaque=wrap(source),blocked=api.v220CitationPlan(opaque,cfg);eq(blocked.text,opaque,'generated opaque header changed');
  }
  report.cases.push({id:'property-literal-identity-'+name+'-'+group+'-'+(quote==='"'?'double':'single'),bundle,runtimeSha256,status:'passed'});
 }
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');

'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const files=process.argv.slice(2);if(!files.length)throw new Error('Provide frozen bundle paths.');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const report={kind:'raw-html-attribute-reference-boundary-regression',status:'passed',checks:0,cases:[],networkRequests:0,wikipediaWrites:0};
const unsafeBodies=[
 ['double-quoted-closing','<span title="</ ref>">Texto.</span>'],
 ['single-quoted-closing',"<span title='</ ref>'>Texto.</span>"],
 ['unquoted-closing','<span data-code=</ ref>>Texto.</span>'],
 ['upper-closing','<SPAN TITLE="</ ReF >">Texto.</SPAN>'],
 ['closing-extra-space','<span data-code="< / ref >">Texto.</span>'],
 ['other-html-element','<a data-code="</ ref>">Texto.</a>'],
 ['incomplete-single-quote',"<span title='</ ref>Texto."],
 ['incomplete-double-quote','<span title="</ ref>Texto.'],
 ['incomplete-unquoted','<span data-code=</ ref>Texto.'],
 ['valid-ref-opening','<span title="<ref name=\'interno\'>">Texto.</span>'],
 ['malformed-ref-opening','<span title="< ref name=\'interno\'>">Texto.</span>'],
 ['valid-ref-closing','<span title="</ref>">Texto.</span>']
];
for(const file of files){
 const api=require(path.resolve(file)),bundle=path.basename(file),runtimeSha256=sha(fs.readFileSync(file));
 const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema de controle',contentModel:'wikitext',autoPreview:false,registryDoiCheck:false,authorityControl:false,automaticBiographyPortals:false,automaticTopicPortals:false};
 const eq=(actual,expected,message)=>{report.checks++;assert.equal(actual,expected,message);},ok=(value,message)=>{report.checks++;assert.ok(value,message);};
 for(const [id,body]of unsafeBodies){
  const source='<ref name="origem">Fonte.'+body+'</ref>\n\n{{Referências}}';
  ok(api.v220RawReferenceAttributeBoundary(source),id+' ambiguous header not recognized');
  const result=api.calculate({kind:'adjust',source,options:cfg});
  eq(result.text,source,id+' changed a raw attribute reference boundary');
  eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,id+' not idempotent');
  ok(!result.changes.some(row=>row.id==='refAttributes'),id+' legacy attribute normalization still applied');
  report.cases.push({id,bundle,runtimeSha256,status:'passed',sourceSha256:sha(source),appliedSha256:sha(result.text)});
 }
 const normalBodies=[['ordinary-attribute','<span title="Referência de controle">Texto.</span>'],['encoded-marker','<span title="&lt;/ ref&gt;">Texto.</span>'],['ordinary-class','<span class="ref">Texto.</span>'],['no-html','Texto literal.']];
 for(const [id,body]of normalBodies){
  const source="<ref name='origem'>Fonte."+body+'</ref>\n\n{{Referências}}',expected=source.replace("name='origem'",'name="origem"');
  ok(!api.v220RawReferenceAttributeBoundary(source),id+' ordinary value blocked');
  const result=api.calculate({kind:'adjust',source,options:cfg});
  eq(result.text,expected,id+' normal reference normalization lost');
  ok(result.changes.some(row=>row.id==='refAttributes'),id+' normal normalization not accounted for');
  ok(result.localCompositionSafety?.accepted!==false,id+' normal guards refused');
  eq(api.calculate({kind:'adjust',source:result.text,options:cfg}).text,result.text,id+' normal normalization not idempotent');
  report.cases.push({id,bundle,runtimeSha256,status:'passed',sourceSha256:sha(source),appliedSha256:sha(result.text)});
 }
 const mixed='{{Descrição curta|Texto de controle}}\n<ref name="origem">Fonte.<span title="</ ref>">Texto.</span></ref>\n\n{{Referências}}',mixedResult=api.calculate({kind:'adjust',source:mixed,options:cfg});
 ok(mixedResult.text.includes('<ref name="origem">Fonte.<span title="</ ref>">Texto.</span></ref>'),'other-pass composition changed raw boundary');
 ok(!mixedResult.text.includes('{{Descrição curta'),'unrelated safe pass was disabled');
 eq(api.calculate({kind:'adjust',source:mixedResult.text,options:cfg}).text,mixedResult.text,'other-pass composition not idempotent');
 report.cases.push({id:'unrelated-safe-pass-continues',bundle,runtimeSha256,status:'passed',sourceSha256:sha(mixed),appliedSha256:sha(mixedResult.text)});
}
process.stdout.write(JSON.stringify(report,null,2)+'\n');

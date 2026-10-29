'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),{box,child}=require('./fixtures.cjs');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false};let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
const rows=[];
for(const [flags,parent]of [['child=não|embed=sim',true],['child=no|embed=yes',true],['child=false|embed=yes',true],['child=|embed=no',true],['child=sim|embed=no',false],['child=incerto|embed=no',false],['child=sim|child=no',false]]){
 const source=box('nascimento_data=1980-01-02|'+flags);eq(!!api.v28PrincipalPersonBox(source,cfg),parent,'Native first-nonempty flags determine the parent: '+flags);rows.push({flags,parent});
}
for(const [key,flags,expected]of [['módulo','child=sim',1],['módulo2','child=|embed=sim',1],['módulo6','child=yes',1],['module','child=sim',0],['módulo1','child=sim',0],['módulo','child=incerto',0],['módulo','child=não|embed=sim',0]]){
 const source=box('nascimento_data=1980-01-02|'+key+'='+child().replace('child=sim',flags)),nodes=api.v219CachedBraceStructure(source).nodes;
 eq(api.v2213EmbeddedPersonNodes(source,nodes).size,expected,'Only a proven native slot and true child call is certified');
 eq(api.v2213UncertifiedInnerInfo(source.slice(0,source.indexOf('\n'))),expected===0,'Unknown nested calls still block field readers');
}
const positive=box('nascimento_data=1980-01-02|módulo='+child('nome=Outra pessoa|nascimento_data=1920-03-04'));
eq(api.v2213PrincipalPersonNodes(positive,api.v219CachedBraceStructure(positive).nodes).length,1,'A proven child is not another primary person');
const negative=box('nascimento_data=1980-01-02|módulo='+child().replace('child=sim','child=não'));
eq(api.v2213PrincipalPersonNodes(negative,api.v219CachedBraceStructure(negative).nodes).length,2,'A false child flag is not silently excluded');
const receipt={suite:'biography-native-scope-2.21.3',runtimeSha256:crypto.createHash('sha256').update(fs.readFileSync(core)).digest('hex'),checks,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));

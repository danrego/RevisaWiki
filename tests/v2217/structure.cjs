'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const bundle=path.resolve(process.env.REVISAWIKI_CURRENT_CORE||'dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(bundle),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Tema fictício',sectionOnly:false,autoPreview:false,registryDoiCheck:false};let checks=0,calculations=0;
const check=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);checks++;};
const cases=[
 ['portal-close','{{Portal3|LGBT|Crime|Filipinas]]\n','{{Portal3|LGBT|Crime|Filipinas}}\n'],
 ['succession','{{Começa caixa}}\n{{S-bef|before=Pessoa fictícia}}\n{{S-inc|recent}}\n|}\n','{{Começa caixa}}\n{{S-bef|antes=Pessoa fictícia}}\n{{S-inc|recente}}\n|}\n'],
 ['duplicate-fields','{{S-bef|before=Pessoa A|antes=Pessoa B}}\n','{{S-bef|before=Pessoa A|antes=Pessoa B}}\n'],
 ['same-duplicate-fields','{{S-bef|before=Pessoa A|antes=Pessoa A}}\n','{{S-bef|before=Pessoa A|antes=Pessoa A}}\n'],
 ['native-reason','{{S-non|reason=Eleito|reason2=Outro}}\n','{{S-non|reason=Eleito|reason2=Outro}}\n'],
 ['recent-other-model','{{Modelo fictício|recent}}\n','{{Modelo fictício|recent}}\n'],
 ['numeric-cells','{| class="wikitable"\n|-\n|Rótulo |{{Td fmtn|80000}} |{{Td fmtn|312.5}}\n|}\n','{| class="wikitable"\n|-\n|Rótulo\n{{Td fmtn|80000}}\n{{Td fmtn|312.5}}\n|}\n'],
 ['cell-newline','{| class="wikitable"\n|-\n|{{Td fmtn|1}}\n|}\n','{| class="wikitable"\n|-\n{{Td fmtn|1}}\n|}\n'],
 ['cell-existing','{| class="wikitable"\n|-\n{{Td fmtn|1}}\n|}\n','{| class="wikitable"\n|-\n{{Td fmtn|1}}\n|}\n'],
 ['cell-unknown','{| class="wikitable"\n|-\n|Rótulo |{{Outro produtor|1}}\n|}\n','{| class="wikitable"\n|-\n|Rótulo |{{Outro produtor|1}}\n|}\n'],
 ['cell-attributes','{| class="wikitable"\n|-\n|style="color:red"|{{Td fmtn|1|atr=colspan="2"}}\n|}\n','{| class="wikitable"\n|-\n|style="color:red"|{{Td fmtn|1|atr=colspan="2"}}\n|}\n'],
 ['literal-example','<nowiki>{{S-bef|before=Pessoa}} {{Portal3|LGBT]]</nowiki>\n','<nowiki>{{S-bef|before=Pessoa}} {{Portal3|LGBT]]</nowiki>\n'],
 ['comment-example','<!-- {{S-inc|recent}} -->\n','<!-- {{S-inc|recent}} -->\n'],
 ['election-party','{{Election box candidate with party link no change|candidate=Pessoa fictícia|party=Democratic Party (United States)|votes=12,345|percentage=4.5}}\n','{{Election box candidate with party link no change|candidate=Pessoa fictícia|party=Partido Democrata (Estados Unidos)|votes=12,345|percentage=4.5}}\n'],
 ['prose-link-spacing','[[China]],[[Gansu]] e[[Xinjiang]].\n','[[China]], [[Gansu]] e [[Xinjiang]].\n'],
 ['bullet-spacing','*Item\n**Subitem\n','* Item\n** Subitem\n'],
 ['reference-spacing-negative','<ref>[[China]],[[Gansu]] e[[Xinjiang]].</ref>\n','<ref>[[China]],[[Gansu]] e[[Xinjiang]].</ref>\n'],
 ['url-spacing-negative','https://example.invalid/[[China]],[[Gansu]]\n','https://example.invalid/[[China]],[[Gansu]]\n'],
 ['field-spacing','{{Info/Conflito militar|local=[[China]],[[Gansu]] e[[Xinjiang]]}}\n','{{Info/Conflito militar|local=[[China]], [[Gansu]] e [[Xinjiang]]}}\n'],
 ['unknown-party-context','{{Modelo fictício|party=Democratic Party (United States)}}\n','{{Modelo fictício|party=Democratic Party (United States)}}\n']
];
for(const[id,before,expected]of cases){
 const plan=api.v2217StructurePlan(before,cfg);calculations++;check(plan.text,expected,id);check(api.v2217StructureProof(before,plan.text,plan,cfg),true,id+' proof');
 check(api.v2217StructurePlan(plan.text,cfg).text,plan.text,id+' idempotence');
 check(api.v2217StructureProof(before,plan.text+'alteração',plan,cfg),false,id+' tampered proof');
}
for(const name of ['Começa caixa','S-start']){
 const source='{{'+name+'}}\n{{S-bef|antes=Pessoa}}\n{{S-inc|recente}}\n|}\n';
 check(api.v24SyntaxScan(source).issues,[],name+' native pair');check(api.v24SyntaxScan(source.replace('|}','')).tables.length,1,name+' open context');
 check(api.v2217SuccessionBlocks(source).length,1,name+' atomic footer block');
}
check(api.v24SyntaxScan('{{Fim}}\n').issues,[],'unknown opener is not manufactured');
check(api.v24SyntaxScan('<a href="https://example.invalid/"><b>x</a>\n').issues.length>0,true,'nontrivial HTML mismatch remains');
check(api.v24SyntaxScan('<nowiki>{{Começa caixa}}</nowiki>\n|}\n').issues.some(i=>i.code==='syntax-stray-table-close'),true,'protected table opening ignored');
for(const source of ['Texto.</a>\n\n[[Tema|Tema]].\n','{{Election box begin no change|title=Exemplo}}\n{{Election box total no change|votes=2|percentage=100}}\n{{Fim}}\n\n[[Tema|Tema]].\n']){
 const result=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 check(result.text.includes('[[Tema]].'),true,'independent existing fix after native structure');check(api.v219AutomaticResultSafety(source,result).accepted,true,'bound safety');
 if(source.includes('</a>'))check(result.text.includes('</a>'),true,'orphan bytes preserved');
}
const report={version:'2.21.7',suite:'native-structure',checks,calculations,bundle:path.basename(bundle),bundleSha256:sha(fs.readFileSync(bundle)),wikipediaWrites:0};
if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

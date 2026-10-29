'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const core=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.3/RevisaWiki_v2_21_3.js'),api=require(core),{box}=require('./fixtures.cjs'),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cfg={...api.defaults,namespaceNumber:0,contentModel:'wikitext',pageTitle:'Pessoa de teste',autoPreview:false,registryDoiCheck:false,v216CalendarUTC:'2026-10-28'};
let checks=0,calculations=0;const failures=[],eq=(a,b,message)=>{checks++;try{assert.deepEqual(a,b,message);}catch(e){failures.push({message,actual:a,expected:b});}};
const rows=[],profile=api.infoboxCatalog['info/biografia'],groups=api.v2213AliasGroups(profile);eq(groups.length,61,'All reviewed coalesced groups are available');
for(const keys of groups){
 for(const target of keys){
  const other=keys.find(k=>k!==target);if(!other)continue;
  eq(api.v2213AliasRenameBlocked(profile,[{key:'importado',value:'Novo'},{key:other,value:'Existente'}],'importado',target),true,'A populated native alternative blocks imported activation');
  eq(api.v2213AliasRenameBlocked(profile,[{key:'importado',value:'Novo'},{key:other,value:''}],'importado',target),false,'A blank alternative does not pretend to be populated');
  eq(api.v2213AliasRenameBlocked(profile,[{key:'importado',value:'Novo'},{key:'nome',value:'Pessoa de teste'}],'importado',target),keys.includes('nome'),'An unrelated field does not block a rename');
 }
}
const collisions=[
 ['size-space','imagem=Foto.jpg|imagem tamanho=180px|image_size=250px',['imagem tamanho=180px','image_size=250px'],['imagem_tamanho=250px']],
 ['size-joined','imagem=Foto.jpg|imagemtamanho=180px|image_size=250px',['imagemtamanho=180px','image_size=250px'],['imagem_tamanho=250px']],
 ['caption-fallback','imagem=Foto.jpg|desc=Legenda existente|image_caption=Legenda importada',['desc=Legenda existente','image_caption=Legenda importada'],['imagem_legenda=Legenda importada']],
 ['caption-main','imagem=Foto.jpg|legenda=Legenda existente|caption=Legenda importada',['legenda=Legenda existente','caption=Legenda importada'],['imagem_legenda=Legenda importada']],
 ['occupation-plural','ocupações=Físico|ocupacoes=Escritor',['ocupacoes=Escritor'],['ocupação=escritor','ocupação=Escritor','|Literatura']],
 ['spouse-plural','cônjuges=Pessoa A|Cônjuge=Pessoa B',['cônjuges=Pessoa A','Cônjuge=Pessoa B'],['|cônjuge=Pessoa B']],
 ['photo-alias','foto=Foto.jpg|image=Outra.jpg',['foto=Foto.jpg','image=Outra.jpg'],['|imagem=Outra.jpg']],
 ['birthplace-fallback','nascimento_cidade=[[Paris]]|birth_place=[[Lisboa]]',['nascimento_cidade=[[Paris]]','birth_place=[[Lisboa]]'],['nascimento_local=[[Lisboa]]']],
 ['birthdate-fallback','data_nascimento=1980-01-02|birth_date=1920-03-04',['birth_date=1920-03-04'],['nascimento_data=1920-03-04']],
 ['capitalized-unknown-occupation','ocupações=Físico|Ocupacao=Escritor',['Ocupacao=Escritor'],['|Literatura']],
 ['unknown-nationality','Nacionalidade=português',['Nacionalidade=português'],['|Portugal']],
 ['lower-native-occupation','ocupação=Físico|ocupacao=Escritor',[],['|Literatura']]
];
for(const name of ['Biografia','Cientista','Escritor'])for(const [id,fields,retain,absent]of collisions){
 const source=box(fields+'|website=https://https://example.org/perfil',name),r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;
 eq(api.v219AutomaticResultSafety(source,r).accepted,true,'Conflict is handled locally, not by rejecting unrelated repairs: '+id);
 for(const literal of retain)eq(r.text.includes(literal),true,'Original conflicting argument stays exact: '+id+' '+literal);
 for(const literal of absent.filter(v=>v!=='|Literatura'||name!=='Escritor'))eq(r.text.includes(literal),false,'Imported alternative cannot overtake a native value or create a portal: '+id+' '+literal);
 eq(r.text.includes('website=https://example.org/perfil'),true,'Independent URL repair remains available: '+id);
 eq(r.text.startsWith('{{Info/'+name+'|'),true,'A valid native biography alias remains unchanged');
 const second=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options:cfg});calculations++;eq(second.text,r.text,'A second action cannot reactivate the declined alias');
 rows.push({id,name,sourceSha256:sha(source),candidateSha256:sha(r.text),accepted:true});
}
for(const [fields,expected]of [['imagem=Foto.jpg|image_size=250px','imagem_tamanho=250px'],['imagem=Foto.jpg|image_caption=Legenda importada','imagem_legenda=Legenda importada'],['ocupacoes=Escritor','ocupação=escritor'],['Cônjuge=Pessoa B','cônjuge=Pessoa B'],['imagem tamanho=|image_size=250px','imagem_tamanho=250px']]){
 const source=box(fields),r=api.calculate({kind:'adjust',source,originalSource:source,options:cfg});calculations++;eq(r.text.includes(expected),true,'Uncontested existing correction still runs');eq(api.v219AutomaticResultSafety(source,r).accepted,true,'Uncontested correction retains full safety proof');
}
const receipt={suite:'native-biography-alias-priority-2.21.3',runtimeSha256:sha(fs.readFileSync(core)),checks,calculations,failures,rows};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(failures.length,0,'No accepted rename may activate an ignored value over a populated native alternative');

'use strict';
const open="'''Pessoa de teste''' é uma pessoa.",tail='\n'+open+'\n';
const box=(fields,name='Biografia')=>'{{Info/'+name+'|nome=Pessoa de teste|'+fields+'}}'+tail;
const child=(fields='',name='Cientista')=>'{{Info/'+name+'|child=sim|campo=Física'+(fields?'|'+fields:'')+'}}';
const cases=[];
for(const name of ['Biografia','Cientista','Escritor']){
 for(const higher of ['local_nascimento','nascimento_local','nascimento_cidade','cidade natal']){
  cases.push({id:'birthplace-'+name+'-'+higher,source:box(higher+'=[[Paris]]|localnasc=[[Lisboa]]',name),preserve:[higher+'=[[Paris]]','localnasc=[[Lisboa]]']});
 }
 for(const field of ['imagem_alt','pronúncia','progenitores','mãe','pai','companheiro','companheira','nascimento_país','módulo6','instituicao_trabalho','instituicoes_trabalho','orientadores','orientados','tese','local_trabalho']){
  cases.push({id:'field-'+name+'-'+field,source:box(field+'=Valor de teste',name),preserve:[field+'=Valor de teste']});
 }
}
for(const key of ['módulo','módulo2','módulo3','módulo4','módulo5','módulo6'])cases.push({id:'module-'+key,source:box('nascimento_data=1980-01-02|'+key+'='+child()),preserve:[key+'='+child()],parentDate:true});
for(const flag of ['sim','yes','y','s','true','verdadeiro','verdadeira','1'])cases.push({id:'true-flag-'+flag,source:box('nascimento_data=1980-01-02|módulo='+child().replace('child=sim','child='+flag)),parentDate:true});
for(const flags of ['child=não','child=no','child=0','child=false','child=incerto','child=','embed=incerto','child=não|embed=sim','child={{#if:1|sim}}']){
 const nested='{{Info/Cientista|'+flags+'|campo=Física}}';
 cases.push({id:'uncertified-'+flags,source:box('nascimento_data=1980-01-02|módulo='+nested),preserve:[nested],blockedDate:true});
}
for(const key of ['module','module2','módulo1','modulo'])cases.push({id:'unknown-slot-'+key,source:box('nascimento_data=1980-01-02|'+key+'='+child()),preserve:key==='module'?[]:[key+'='+child()],blockedDate:key!=='module'});
for(const name of ['Ator','Nobre','Música/artista']){
 const nested='{{Info/'+name+'|child=sim|nome=Outra pessoa}}';
 cases.push({id:'unsupported-child-'+name,source:box('nascimento_data=1980-01-02|módulo='+nested),preserve:[nested],blockedDate:true});
}
for(const name of ['Político','Militar'])for(const flag of ['sim','yes']){
 const nested='{{Info/'+name+'|embed='+flag+'|nome=Outra pessoa}}';
 cases.push({id:'certified-special-'+name+'-'+flag,source:box('nascimento_data=1980-01-02|módulo='+nested),preserve:[nested],parentDate:true});
}
cases.push({id:'different-child-facts',source:box('nascimento_data=1980-01-02|nascimento_local=[[Paris]], [[França]]|módulo='+child('nome=Outra pessoa|nascimento_data=1920-03-04|nascimento_local=[[Lisboa]], [[Portugal]]|gênero=romance')),preserve:[child('nome=Outra pessoa|nascimento_data=1920-03-04|nascimento_local=[[Lisboa]], [[Portugal]]|gênero=romance')],parentDate:true,forbidden:['{{Portal3|Biografias|Mulheres','|Portugal}}']});
cases.push({id:'recursive-child',source:box('nascimento_data=1980-01-02|módulo='+child('módulo2='+child('tese=Pesquisa'))),parentDate:true});
cases.push({id:'duplicate-children',source:box('nascimento_data=1980-01-02|módulo='+child()+'|módulo2='+child()),preserve:['módulo='+child(),'módulo2='+child()],parentDate:true});
cases.push({id:'literary-genre',source:box('gênero=Feminino'),preserve:['gênero=Feminino'],forbidden:['|Mulheres']});
cases.push({id:'later-person',source:box('nascimento_data=1980-01-02')+'\n== Outra pessoa ==\n'+child(),blockedDate:true});
for(const fields of ['nascimento_data=|data_nascimento=1980-01-02','local_nascimento=|nascimento_cidade=[[Paris]]','morte_data=|data_morte=2000-01-02'])cases.push({id:'first-nonempty-'+fields,source:box(fields),preserve:fields.split('|').filter(x=>!x.endsWith('='))});
module.exports={cases,box,child,tail};

'use strict';
const assert=require('node:assert/strict');
// Literal fixtures preserve the historical value constraints. Context fields
// satisfy only the explicit native branch under test, never a hidden bypass.
function readerFixture(record,key,emptyTarget=false){
 const literal=record.role==='native-number-reference-text'?'1234':key==='premiacao'?'US$ 1234':record.owner==='Info/Aeroporto'&&key==='icao'?'SBGL':record.owner==='Info/Aeroporto'&&key==='site'?'https://example.invalid':record.key==='perc_água'?'12.5':record.owner==='Info/Canal de televisão'&&['data_lançamento','data_encerramento'].includes(record.key)?'2020':'Valor preservado',value=literal+'<ref name="A">Fonte.</ref>';
 const fields=new Map([['nome','Exemplo'],[key,value]]),conditions=record.reader.conditions||{};
 for(const name of [...conditions.absentKeys||[],...conditions.emptyOrAbsentKeys||[]])if(name!==key)fields.delete(name);
 for(const group of [...conditions.anyNonempty||[],...conditions.selectedNonempty||[],...conditions.firstNonempty||[]]){const name=group.find(name=>!conditions.absentKeys?.includes(name));assert(name);if(!fields.get(name)?.trim())fields.set(name,name==='imagem'?'Imagem real.jpg':'Contexto literal');}
 if(record.owner==='Info/Foguete'&&key==='payload-location'){fields.set('payload','100 kg');fields.set('carga útil-LEO','1000 kg');}
 if(record.owner==='Info/Futebolista'&&record.key==='imagem_legenda')fields.set('imagem_tamanho','250px');
 if(record.owner==='Info/Futebolista'&&record.key==='jogos(golos)'){fields.set('ano','2020');fields.set('clubes','Clube exemplo');}
 if(record.owner==='Info/Futebolista'&&record.key==='jovemclubes')fields.set('jovemanos','2020');
 if(record.owner==='Info/Condado dos Estados Unidos'&&record.key==='populacao')fields.set('censo_data','2020');
 const owner=record.sourceOwners?.[0]||record.owner;return {owner,text:'{{'+owner+'|'+[...fields].map(([name,value])=>name+'='+value).join('|')+(emptyTarget?'|'+record.key+'= \n':'')+'}}\n\nExemplo.\n\n[[Categoria:Exemplos]]',value};
}
module.exports={readerFixture};

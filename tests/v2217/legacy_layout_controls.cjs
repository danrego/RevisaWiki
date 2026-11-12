'use strict';
const assert=require('node:assert/strict'),{normalizedLayout:n}=require('./legacy_layout_qualification.cjs');let checks=0;
function eq(a,b){assert.deepEqual(a,b);checks++;}
const old='{{Info/Biografia|nome=Pessoa fictícia|local_nascimento=[[Paris]]|módulo={{Info/Cientista|campo=Física}}}}',next='{{Info/Biografia\n|nome                  =Pessoa fictícia\n|local_nascimento      =[[Paris]]\n|módulo                ={{Info/Cientista\n|campo                 =Física\n}}\n}}';
eq(n(old),n(next));eq(n('local_nascimento      =[[Paris]]',true),'local_nascimento=[[Paris]]');
eq(n(next).startsWith('{{Info/Biografia|'),true);eq(n(next).startsWith('{{Info/Cientista|'),false);
for(const [a,b]of [
 [old,next.replace('Pessoa fictícia','Outra pessoa')],
 [old,next.replace('[[Paris]]','[[Lisboa]]')],
 [old,next.replace('campo                 =Física','campo                 =Química')],
 [old,next.replace('local_nascimento','local_falecimento')],
 ['{{Info|valor=11.2}}','{{Info|valor=11,2}}'],
 ['{{Info|valor=Texto  com espaços}}','{{Info|valor=Texto com espaços}}'],
 ['{{Info|imagem_alt=Outro}}','{{Info|imagem_alt=Novo}}'],
 ['{{Info|valor=<ref name="A">Fonte.</ref>}}','{{Info|valor=<ref name="B">Fonte.</ref>}}']
 ]){assert.notEqual(n(a),n(b));checks++;}
for(const value of ['Texto  com  espaços.','https://example.invalid/?a=1&b=2','<math>a = b</math>','[[X|rótulo = valor]]','{{Infobox incompleta|nome=Pessoa'])eq(n(value),value);
eq(n('{{Info|x=[[X|rótulo = valor]]}}'),'{{Info|x=[[X|rótulo = valor]]}}');
eq(n('{{Info|1=  valor posicional}}'),'{{Info|1=valor posicional}}');
console.log(JSON.stringify({kind:'independent-historical-layout-reader-controls',checks,productionCodeModified:false,wikipediaWrites:0}));

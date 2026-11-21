'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{load,cfg}=require('./harness.cjs'),api=load(['citation_repairs']);
let checks=0,cases=0,calculations=0;
function equal(a,b,m){checks++;assert.equal(a,b,m);}
function plan(kind,source,expected){const options={...api.defaults,...cfg},p=api['v2221Citation'+kind+'Plan'](source,options);cases++;equal(p.text,expected,kind+' native archive access');equal(api['v2221Citation'+kind+'Proof'](source,p.text,p,options),true,'Source-bound plan proof');equal(api['v2221Citation'+kind+'Plan'](p.text,options).text,p.text,'Plan replay');return p;}
const citation=(model,state,access='subscription',title='|título=Obra',url='https://example.invalid/a')=>'{{'+model+'|url='+url+title+'|arquivourl=https://archive.example.invalid/a|arquivodata=2024-01-01|urlmorta='+state+'|acessourl='+access+'}}';
for(const model of ['Citar web','Citar periódico'])for(const state of ['live','dead','yes','sim'])for(const access of ['subscription','registration','limited']){const s=citation(model,state,access);plan('Values',s,s);}
for(const model of ['Citar web','Citar periódico'])for(const state of ['no','não']){const s=citation(model,state);plan('Values',s,s.replace('acessourl=subscription','acessourl=subscrição'));}
const unsafe=citation('Citar web','live'),good='{{Citar web|url=https://example.org/fonte}}';
plan('Values',unsafe+'\n'+good,unsafe+'\n'+good.replace('}}','|título=example.org}}'));
for(const url of ['https://example.invalid/a','{{URL|https://example.invalid/a}}']){const s=citation('Citar web','live','subscrição','',url);plan('Values',s,s);}
const options={...api.defaults,...cfg};
if(process.env.REVISAWIKI_CURRENT_CORE){const source='Texto sobre [[Brasil|Brasil]].<ref name="bad">'+unsafe+'</ref> Outra.<ref>'+good+'</ref>\n{{Referências}}',r=api.calculate({kind:'adjust',source,originalSource:source,options});calculations++;cases++;
 equal(api.v219AutomaticResultSafety(source,r).accepted,true,'Complete result keeps preservation checks');equal(r.text.includes('[[Brasil]]'),true,'An unrelated safe link still applies');equal(/<ref name="bad">[\s\S]*?acessourl=subscription[\s\S]*?<\/ref>/.test(r.text),true,'Archived original access keeps the required English value');equal(r.text.includes('acessourl=subscrição'),false,'The invalid archived presentation value is not activated');equal(r.text.includes('título=example.org'),true,'Another citation still receives its safe host label');const again=api.calculate({kind:'adjust',source:r.text,originalSource:r.text,options});calculations++;equal(again.text,r.text,'The full action is idempotent');}
const report={suite:'native-archived-original-access-guard',cases,checks,calculations,passed:true,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

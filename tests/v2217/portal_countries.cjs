'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=process.env.REVISAWIKI_CURRENT_CORE||path.resolve(__dirname,'../../dist/2.21.7/RevisaWiki_v2_21_7.js'),api=require(file);let checks=0;
function yes(x,m){checks++;assert.ok(x,m);}
const source=fs.readFileSync(path.resolve(__dirname,'../../src/v2_21_7/portals.js'),'utf8'),prefix='const V2217_COUNTRY_ROWS = Object.freeze(',start=source.indexOf(prefix)+prefix.length,end=source.indexOf(');',start),rows=JSON.parse(source.slice(start,end));
const identity=new Map();for(const[target,code,names]of rows)for(const alias of names.split('|')){const key=api.v2217CountryKey(alias);if(!identity.has(key))identity.set(key,new Set());identity.get(key).add(target);}
let aliases=0,ambiguous=0;
for(const[target,code,names]of rows){
 yes(api.v2217CountryTarget(code,true)===target,'typed ISO region identity '+code);
 for(const alias of names.split('|')){
  const candidates=identity.get(api.v2217CountryKey(alias));if(candidates.size!==1){ambiguous++;continue;}
  yes(api.v2217CountryTarget(alias,true)===target,'typed name identity '+code+' '+alias);aliases++;
 }
}
for(const value of ['Atlanta, Georgia','Terre Haute, Indiana','Cidade Exemplo, CA','Cidade Exemplo, IN','Possivelmente França','{{Modelo desconhecido|França}}','<nowiki>França</nowiki>'])yes(api.v2217CountryValues(value,false).length===0,'uncertain place or protected value remains '+value);
for(const value of ['no','No','in','it'])yes(api.v2217CountryValues(value,true).length===0,'lowercase common word not read as ISO region '+value);
yes(api.v2217CountryKnownTarget('shared',true,new Map([['frança','França']]),new Set(['shared']),{shared:'França'})===null,'ambiguous imported alias cannot return through legacy demonym fallback');
yes(api.v2217CountryKnownTarget('shared',true,new Map([['shared','França']]),new Set(['shared']),{})===null,'ambiguity overrides an accidental direct entry too');
yes(api.v2217CountryKnownTarget('constructor',true,new Map(),new Set(),{})===null,'prototype values are not country names');
yes(api.v2217CountryValues('indiana',true,true)[0]==='Índia','unambiguous Portuguese demonym remains valid in explicit nationality');
yes(api.v2217CountryValues('Indiana',true,false).length===0,'military country slot does not read a state name as a feminine demonym');
yes(JSON.stringify(api.v2217CountryValues('{{hlist|1=France|2=Italy}}',true))===JSON.stringify(['França','Itália']),'explicit numbered valid hlist members');
yes(api.v2217CountryValues('{{Lista horizontal|France|Italy}}',true).length===0,'unknown second body parameter not consumed as citizenship');
const receipt={suite:'portal_countries',checks,countryAndTerritoryTargets:rows.length,unambiguousAliases:aliases,ambiguousAliasesExcluded:ambiguous,passed:true,bundle:file,wikipediaWrites:0};if(process.env.REVISAWIKI_TEST_RECEIPT)fs.writeFileSync(process.env.REVISAWIKI_TEST_RECEIPT,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));

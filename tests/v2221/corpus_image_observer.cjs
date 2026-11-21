'use strict';
// The production image inventory masks template/preformatted contexts and predates some foreign namespaces.
// Add literal file calls to its inventory. Never remove a native
// target, normalize a filename, or infer a bare parameter as an image.
function foreignTargets(source){
 const ranges=[];let cursor=0;
 while(cursor<source.length){const start=source.indexOf('<',cursor);if(start<0)break;
  if(source.startsWith('<!--',start)){const end=source.indexOf('-->',start+4);ranges.push([start,end<0?source.length:end+3]);cursor=ranges.at(-1)[1];continue;}
  const match=/^<(\/?)([A-Za-z][A-Za-z0-9-]*)\b/.exec(source.slice(start));if(!match){cursor=start+1;continue;}let end=start+match[0].length,quote=null;
  for(;end<source.length;end++){const ch=source[end];if(quote){if(ch===quote)quote=null;}else if(ch==='"'||ch==="'")quote=ch;else if(ch==='>')break;}
  cursor=Math.min(source.length,end+1);if(end===source.length||match[1]||!['nowiki','pre','syntaxhighlight','source','code','math','chem','ce','score'].includes(match[2].toLowerCase()))continue;
  if(!/\/\s*>$/.test(source.slice(start,end+1))){const close=new RegExp('</'+match[2]+'\\s*>','gi');close.lastIndex=cursor;const m=close.exec(source);cursor=m?close.lastIndex:source.length;}ranges.push([start,cursor]);
 }
 let text=source;for(const[start,end]of ranges.reverse())text=text.slice(0,start)+' '.repeat(end-start)+text.slice(end);
 const found=[];for(const m of text.matchAll(/\[\[\s*(?:Imagem|Image|File|Ficheiro|Arquivo|Fichier|Datei|Bild|Archivo|Fitxer|Immagine)\s*:\s*([^|\]\r\n]+)/gi)){
  const title=m[1].trim().replace(/_/g,' ');if(!/[{}<>\uE000]/.test(title)&&/\.(?:svg|png|jpe?g|gif|webp|tiff?|pdf|djvu|og[gv]|webm|mp[34]|wav|flac)$/i.test(title))found.push('Ficheiro:'+title);
 }return found;
}
function imageKeys(api,source){return[...new Set([...api.imageTargets(source).map(item=>String(item.title).replace(/_/g,' ').trim()),...foreignTargets(source)])].sort();}
module.exports={imageKeys,foreignTargets};
if(require.main===module){
 const assert=require('node:assert/strict'),api={imageTargets:text=>[...text.matchAll(/\[\[Ficheiro:([^|\]]+)/g)].map(m=>({title:'Ficheiro:'+m[1]}))};let checks=0;
 for(const ns of ['Imagem','Image','File','Ficheiro','Arquivo','Fichier','Datei','Bild','Archivo','Fitxer','Immagine']){const raw='[['+ns+':Example_map.svg|thumb|caption]]',native='[[Ficheiro:Example map.svg|thumb|caption]]';assert.deepEqual(imageKeys(api,raw),imageKeys(api,native));checks++;assert.notDeepEqual(imageKeys(api,raw),imageKeys(api,native.replace('Example map','Other')));checks++;assert.notDeepEqual(imageKeys(api,raw),imageKeys(api,''));checks++;}
 for(const tag of ['nowiki','pre','syntaxhighlight','source','code','math','chem','ce','score']){assert.deepEqual(foreignTargets('<'+tag+' data-x="a>b">[[Datei:Example.png]]</'+tag+'>'),[]);checks++;assert.deepEqual(foreignTargets('<'+tag+'>[[Datei:Example.png]]'),[]);checks++;assert.deepEqual(foreignTargets('<'+tag+'/>[[Datei:Example.png]]'),['Ficheiro:Example.png']);checks++;}
 assert.deepEqual(foreignTargets('<!-- [[Datei:Example.png]] -->'),[]);checks++;assert.deepEqual(foreignTargets('[[Unknown:Example.png]]'),[]);checks++;
 assert.notDeepEqual(imageKeys(api,'[[Datei:Case.png]]'),imageKeys(api,'[[Ficheiro:case.png]]'));checks++;assert.notDeepEqual(imageKeys(api,'[[Datei:á.png]]'),imageKeys(api,'[[Ficheiro:á.png]]'));checks++;
 assert.deepEqual(imageKeys({imageTargets:()=>[]},'[[Ficheiro:Example.png]]'),['Ficheiro:Example.png']);checks++;
 console.log(JSON.stringify({suite:'strict-foreign-file-namespace-observer',checks,passed:true,productionChanged:false}));
}

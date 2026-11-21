function v2221NativeTagIntent(source,start) {
 const m=/^<\s+([a-z][a-z0-9-]*)(?=[\s/>])/i.exec(source.slice(start,start+128));
 if(!m)return true;
 // A less-than comparison followed by prose is not an arbitrary HTML tag.
 return /^(?:ref|references|nowiki|pre|source|syntaxhighlight|math|chem|ce|gallery|score|timeline|poem|templatestyles|includeonly|noinclude|onlyinclude|div|span|small|big|sup|sub|br|hr|p|b|i|u|s|del|ins|blockquote|q|code|kbd|samp|var|abbr|table|tr|td|th|caption|thead|tbody|tfoot|ul|ol|li|dl|dt|dd|center|font|ruby|rb|rt|rp|h[1-6])$/i.test(m[1]);
}
function v2221FileNameQuoteEnd(view,start) {
 if(view.slice(start,start+2)!=='[[')return null;
 const m=/^\[\[[ \t]*(?:Ficheiro|Imagem|Arquivo|File|Image)[ \t]*:/i.exec(view.slice(start,start+80));if(!m)return null;
 let depth=1;
 for(let at=start+2;at<view.length;at++){
  const two=view.slice(at,at+2);
  if(two==='[['){depth++;at++;continue;}
  if(two===']]'){if(--depth===0)return at+2;at++;continue;}
  if(depth===1&&view[at]==='|')return at;
  if(view[at]==='\n'||view[at]==='{'||view[at]==='<')return null;
 }
 return null;
}
function v2221ClosingProseQuote(view,start) {
 if(view[start]!=='"')return false;
 const left=view[start-1]||'',right=view[start+1]||'';
 // A closing straight quote directly after a word cannot open a new quoted
 // block. Paired opens at a boundary still retain their full protection.
 return /[\p{L}\p{N}\])!?.,]/u.test(left)&&(!right||/[\s.,;:!?\])]/.test(right));
}

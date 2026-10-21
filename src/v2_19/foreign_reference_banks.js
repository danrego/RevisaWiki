    // Foreign collectors use exact source contracts for groups and definition banks.
    var v219BankImplCache;
    function v219BankImplementation() {
        if(v219BankImplCache)return v219BankImplCache;
        const contract={"contracts":[{"id":"fr:202512479","kind":"renderer","source":{"language":"fr","oldid":202512479,"title":"Modèle:Références"},"semantics":{"body":["références","refs"],"group":["groupe","group"],"default":"","layout":["taille","colonnes","pasdecol"],"style":{"alpha":"lower-alpha","grec":"lower-greek","romain":"lower-roman"},"styleDefault":"decimal","invalidCatalog":["referencias"],"positional":[]}},{"id":"es:149592096","kind":"renderer","source":{"language":"es","oldid":149592096,"title":"Plantilla:Listaref"},"semantics":{"body":["refs"],"group":["grupo","group"],"default":"","layout":["ancho","colwidth","1","estilolista","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","invalidCatalog":["groupe","références","referencias"],"missingCatalog":["grupo"],"positional":["1 is CSS column count when ancho/colwidth absent"]}},{"id":"en:1323680032","kind":"notesRenderer","source":{"language":"en","oldid":1323680032,"title":"Template:Notelist"},"semantics":{"body":["refs","notes"],"group":["group"],"default":"lower-alpha","allowedGroups":["note","upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"layout":["1","colwidth"],"styleVia":"Reflist","positional":["1 is column width passed to Reflist, fallback colwidth"],"shadowedNative":true}},{"id":"en:1197504050","kind":"note","source":{"language":"en","oldid":1197504050,"title":"Template:Efn"},"semantics":{"body":["1","reference","content","text"],"group":["group"],"default":"lower-alpha","allowedGroups":["note","upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"name":["name"],"layout":[],"positional":["1 is note body"],"shadowedNative":true}},{"id":"fr:201633326","kind":"notesRenderer","source":{"language":"fr","oldid":201633326,"title":"Modèle:Notes"},"semantics":{"body":["références"],"group":["groupe","group"],"default":"note","groupMap":{"décimal":""},"layout":["taille"],"styleVia":"fr:Références","positional":[],"invalidCatalog":[]}},{"id":"ru:155614662","kind":"renderer","source":{"language":"ru","oldid":155614662,"title":"Шаблон:Примечания"},"semantics":{"body":["refs"],"group":["group","группа"],"default":"","layout":["1","colwidth","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleUsesOnly":"group","styleDefault":"decimal","missingCatalog":["группа"],"positional":["1 is width/count/narrow/wide selector with conditional responsive"]}},{"id":"uk:44146530","kind":"renderer","source":{"language":"uk","oldid":44146530,"title":"Шаблон:Reflist"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","colwidth","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","positional":["1 is width or count by #ifexpr"]}},{"id":"tr:36642853","kind":"renderer","source":{"language":"tr","oldid":36642853,"title":"Şablon:Kaynakça"},"semantics":{"body":["refs"],"group":["group","grup"],"default":"","layout":["1","colwidth","liststyle","responsive"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","missingCatalog":["grup"],"positional":["1 is width/count selector; responsive override only without width"]}},{"id":"he:36108756","kind":"renderer","source":{"language":"he","oldid":36108756,"title":"תבנית:הערות שוליים"},"semantics":{"body":["הערות"],"group":["group","קבוצה"],"default":"","layout":["יישור"],"styleDefault":"decimal","invalidCatalog":["refs"],"missingCatalog":["הערות","קבוצה"],"positional":[]}},{"id":"ro:17208405","kind":"renderer","source":{"language":"ro","oldid":17208405,"title":"Format:Listănote"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","colwidth","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","positional":["1 is width or count by #ifexpr"]}},{"id":"ko:41574853","kind":"renderer","source":{"language":"ko","oldid":41574853,"title":"틀:각주"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","colwidth","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","positional":["1 is width or count by #ifexpr"]}},{"id":"zh-yue:2020814","kind":"renderer","source":{"language":"zh-yue","oldid":2020814,"title":"Template:Reflist"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","colwidth","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","positional":["1 is width or count by #ifexpr"],"shadowedNative":true}},{"id":"vi:74643107","kind":"renderer","source":{"language":"vi","oldid":74643107,"title":"Bản mẫu:Tham khảo"},"semantics":{"body":["refs"],"group":["group","nhóm"],"default":"","layout":["1","colwidth","cột","rộng","liststyle","kiểu"],"styleDefault":"decimal","missingCatalog":["nhóm"],"positional":["1 is width or count by #ifexpr"]}},{"id":"th:13178113","kind":"renderer","source":{"language":"th","oldid":13178113,"title":"แม่แบบ:รายการอ้างอิง"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","colwidth","liststyle"],"styleDefault":"decimal","positional":["1 is width or count by #ifexpr"]}},{"id":"nl:71444677","kind":"renderer","source":{"language":"nl","oldid":71444677,"title":"Sjabloon:References"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","2"],"style":{"kleine-letter":"lower-alpha","hoofdletter":"upper-alpha","kleine-letter-Grieks":"lower-greek","kleine-letter-Romeins":"lower-roman","hoofdletter-Romeins":"upper-roman"},"styleDefault":"decimal","positional":["2 then 1 selects count 2/3/4/8 and special width 2/30em=30em or 3/4=21em; other values add no width/count"]}},{"id":"da:11780361","kind":"renderer","source":{"language":"da","oldid":11780361,"title":"Skabelon:Reflist"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","colwidth","liststyle"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","positional":["1 is width or count by #ifexpr"]}},{"id":"no:25410402","kind":"renderer","source":{"language":"no","oldid":25410402,"title":"Mal:Referanser"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["2","colwidth","class"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","quotedTagGroup":true,"positional":["2 then colwidth are width; 1 is ignored"]}},{"id":"nn:3517113","kind":"renderer","source":{"language":"nn","oldid":3517113,"title":"Mal:Referansar"},"semantics":{"body":["refs"],"group":["group"],"default":"","layout":["1","2","colcnt","colwidth","class"],"styleDefault":"decimal","quotedTagGroup":true,"positional":["1 then colcnt are count; 2 then colwidth are width"]}},{"id":"fi:23993516","kind":"renderer","source":{"language":"fi","oldid":23993516,"title":"Malline:Viitteet"},"semantics":{"body":["viitteet","refs"],"group":["ryhmä"],"default":"","layout":["1","2","sarakkeet"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"styleDefault":"decimal","invalidCatalog":["group"],"missingCatalog":["ryhmä","viitteet"],"positional":["1 and 2 respond to keyword sarakkeet; named sarakkeet controls columns"]}},{"id":"ar:70336474","kind":"renderer","source":{"language":"ar","oldid":70336474,"title":"قالب:مراجع"},"semantics":{"body":["refs","مراجع"],"group":["group","مجموعة"],"default":"","layout":["1","colwidth","liststyle","محاذاة"],"styleFromGroup":["upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"unprovedStyleGroups":["arabic-abajed","arabic-alfabeth"],"styleDefault":"decimal","missingCatalog":["مراجع","مجموعة"],"positional":["1 is width or count by #ifexpr"]}}],"profiles":[{"alias":"références","profileSource":"fr:202512479","nativeMissing":false},{"alias":"modèle:références","profileSource":"fr:202512479","nativeMissing":true},{"alias":"listaref","profileSource":"es:149592096","nativeMissing":false},{"alias":"plantilla:listaref","profileSource":"es:149592096","nativeMissing":true},{"alias":"notelist","profileSource":"en:1323680032","nativeMissing":false},{"alias":"template:notelist","profileSource":"en:1323680032","nativeMissing":false},{"alias":"efn","profileSource":"en:1197504050","nativeMissing":false},{"alias":"template:efn","profileSource":"en:1197504050","nativeMissing":false},{"alias":"notes","profileSource":"fr:201633326","nativeMissing":true},{"alias":"modèle:notes","profileSource":"fr:201633326","nativeMissing":true},{"alias":"примечания","profileSource":"ru:155614662","nativeMissing":true},{"alias":"шаблон:примечания","profileSource":"ru:155614662","nativeMissing":true},{"alias":"template:примечания","profileSource":"ru:155614662","nativeMissing":true},{"alias":"шаблон:reflist","profileSource":"uk:44146530","nativeMissing":true},{"alias":"шаблон:примітки","profileSource":"uk:44146530","nativeMissing":true},{"alias":"примітки","profileSource":"uk:44146530","nativeMissing":true},{"alias":"template:примітки","profileSource":"uk:44146530","nativeMissing":true},{"alias":"kaynakça","profileSource":"tr:36642853","nativeMissing":true},{"alias":"şablon:kaynakça","profileSource":"tr:36642853","nativeMissing":true},{"alias":"template:kaynakça","profileSource":"tr:36642853","nativeMissing":true},{"alias":"הערות שוליים","profileSource":"he:36108756","nativeMissing":true},{"alias":"תבנית:הערות שוליים","profileSource":"he:36108756","nativeMissing":true},{"alias":"template:הערות שוליים","profileSource":"he:36108756","nativeMissing":true},{"alias":"listănote","profileSource":"ro:17208405","nativeMissing":true},{"alias":"format:listănote","profileSource":"ro:17208405","nativeMissing":true},{"alias":"template:listănote","profileSource":"ro:17208405","nativeMissing":true},{"alias":"format:reflist","profileSource":"ro:17208405","nativeMissing":true},{"alias":"각주","profileSource":"ko:41574853","nativeMissing":true},{"alias":"틀:각주","profileSource":"ko:41574853","nativeMissing":true},{"alias":"template:각주","profileSource":"ko:41574853","nativeMissing":true},{"alias":"template:reflist","profileSource":"zh-yue:2020814","nativeMissing":false},{"alias":"tham khảo","profileSource":"vi:74643107","nativeMissing":true},{"alias":"bản mẫu:tham khảo","profileSource":"vi:74643107","nativeMissing":true},{"alias":"template:tham khảo","profileSource":"vi:74643107","nativeMissing":true},{"alias":"รายการอ้างอิง","profileSource":"th:13178113","nativeMissing":true},{"alias":"แม่แบบ:รายการอ้างอิง","profileSource":"th:13178113","nativeMissing":true},{"alias":"template:รายการอ้างอิง","profileSource":"th:13178113","nativeMissing":true},{"alias":"sjabloon:references","profileSource":"nl:71444677","nativeMissing":true},{"alias":"skabelon:reflist","profileSource":"da:11780361","nativeMissing":true},{"alias":"referanser","profileSource":"no:25410402","nativeMissing":true},{"alias":"mal:referanser","profileSource":"no:25410402","nativeMissing":true},{"alias":"template:referanser","profileSource":"no:25410402","nativeMissing":true},{"alias":"referansar","profileSource":"nn:3517113","nativeMissing":true},{"alias":"mal:referansar","profileSource":"nn:3517113","nativeMissing":true},{"alias":"template:referansar","profileSource":"nn:3517113","nativeMissing":true},{"alias":"viitteet","profileSource":"fi:23993516","nativeMissing":true},{"alias":"malline:viitteet","profileSource":"fi:23993516","nativeMissing":true},{"alias":"template:viitteet","profileSource":"fi:23993516","nativeMissing":true},{"alias":"مراجع","profileSource":"ar:70336474","nativeMissing":true},{"alias":"قالب:مراجع","profileSource":"ar:70336474","nativeMissing":true},{"alias":"template:مراجع","profileSource":"ar:70336474","nativeMissing":true}],"nativePrecedence":{"Predefinição:Références":{"aliasOldid":50194735,"target":"Referências","targetOldid":63785697,"mode":"native-header-only","consumedBody":["refs"],"consumedGroup":["grupo"],"headings":"native target defaults to H2; preserve all raw args including nível/title"},"Predefinição:Listaref":{"aliasOldid":46320561,"target":"Referências","targetOldid":63785697,"mode":"native-header-only","consumedBody":["refs"],"consumedGroup":["grupo"],"headings":"native target defaults to H2; preserve all raw args including nível/title"},"Predefinição:Efn":{"aliasOldid":68628877,"target":"Nre","targetOldid":68628864,"mode":"preserve-valid-native-call","consumedBody":["1","reference","content","text","referência","conteúdo","texto"],"consumedGroup":["group","grupo"],"headings":0},"Predefinição:Notelist":{"aliasOldid":59087899,"target":"Listanota","targetOldid":59274856,"mode":"native-single-collector-contract","consumedBody":["refs","notes","notas"],"consumedGroup":["group","grupo"],"default":"lower-alpha","allowedGroups":["nota","upper-alpha","upper-roman","lower-alpha","lower-greek","lower-roman"],"layout":["1","colwidth","larguracol","largcol"],"headings":0},"Predefinição:Reflist":{"aliasOldid":56151616,"target":"Referências","targetOldid":63785697,"mode":"existing-native-headless-reflist-contract","consumedBody":["refs"],"consumedGroup":["group","grupo"],"default":"","headings":0}}};
        return v219BankImplCache=(function(api){
 const std=new Set(['upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman']);
 const firstCase=(a,b)=>a.length>0&&b.length>0&&a[0].toUpperCase()===b[0].toUpperCase()&&a.slice(1)===b.slice(1);
 const headerParts=head=>{
  if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]/.test(head))return null;
  const text=head.replace(/_/g,' ').replace(/[ \t]+/g,' ').trim();
  if(/[{}<>\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(text))return null;
  const match=/^([^:]+)\s*:\s*(.+)$/.exec(text);
  return match?{prefix:match[1].trim().toLowerCase(),title:match[2].trim()}:{prefix:'',title:text};
 };
 function identity(head){
  const h=headerParts(head);if(!h)return null;
  const nativePrefix=!h.prefix||['template','predefinição'].includes(h.prefix);
  if(nativePrefix)for(const [title,record]of Object.entries(contract.nativePrecedence)){
   const expected=title.slice('Predefinição:'.length);
   if(firstCase(h.title,expected))return {native:true,record,title:expected};
  }
  // Listanota is the source implementation behind the exact native redirect.
  if(nativePrefix&&firstCase(h.title,'Listanota'))return {native:true,record:contract.nativePrecedence['Predefinição:Notelist'],title:'Listanota'};
  for(const row of contract.profiles){
   if(!row.nativeMissing)continue;
   const a=headerParts(row.alias);if(!a||a.prefix!==h.prefix)continue;
   const source=contract.contracts.find(c=>c.id===row.profileSource),declared=source.source.title.replace(/^[^:]+:/,'');
   const expected=a.title.toLowerCase()===declared.toLowerCase()?declared:a.title[0].toUpperCase()+a.title.slice(1);
   if(firstCase(h.title,expected))return {native:false,record:row,source};
  }
  return null;
 }
 const profileFor=id=>id?.native?{kind:id.record.mode==='preserve-valid-native-call'?'note':'renderer',nativeRenderer:true,target:id.record.mode==='preserve-valid-native-call'?'Nre':'Referências',source:{language:'pt',title:'Predefinição:'+id.title,oldid:id.record.aliasOldid},sourceContractOldid:id.record.targetOldid}:{kind:id?.source?.kind||'renderer',target:'Referências',source:id?.source?.source||{language:'unknown',title:'unproved internal case'}};
 const blocked=(raw,id,reason)=>({source:raw,candidate:raw,text:raw,handled:true,converted:false,profile:profileFor(id),blocked:true,quietNativeRefusal:true,issues:[],issueEvidence:[],identity:id,refusal:reason});
 function project(raw,cfg={}){
  if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
  const parts=api.v215BraceParts(raw.slice(2,-2));if(!parts?.length)return null;
  const head=parts[0].text,id=identity(head);if(!id){const weak=headerParts(head)||headerParts(head.replace(/[\u0000-\u001F\u007F-\u009F]/g,''));if(weak&&(contract.profiles.some(row=>{const other=headerParts(row.alias);return other&&other.prefix===weak.prefix&&other.title.toLowerCase()===weak.title.toLowerCase();})||(!weak.prefix||['template','predefinição'].includes(weak.prefix))&&Object.keys(contract.nativePrecedence).some(title=>title.slice('Predefinição:'.length).toLowerCase()===weak.title.toLowerCase())))return blocked(raw,null,'unproved internal case; weak lookup is refusal only');return null;}
  if(cfg.references===false||!id.native&&cfg.multilingual!==true)return blocked(raw,id,'applicable reference/foreign gate disabled');
  if(raw.length>4194304||/[\uE000-\uF8FF]|\{\{\{/.test(raw)||(()=>{const scan=api.syntaxRepairPlan(raw);return scan.edits.length||scan.unresolved.length;})())return blocked(raw,id,'opaque or incomplete source');
  const nodes=api.v215BraceStructure(raw),roots=nodes.nodes.filter(n=>n.depth===0);
  if(nodes.unclosed.length||roots.length!==1||roots[0].start!==0||roots[0].end!==raw.length)return blocked(raw,id,'not one complete source call');
  if(id.native&&id.record.mode==='preserve-valid-native-call')return blocked(raw,id,'already valid native note interface');
  if(id.native&&id.record.mode==='existing-native-headless-reflist-contract'){
   const values=parts.slice(1).map(part=>/^\s*(group|grupo)\s*=([\s\S]*)$/.exec(part.text)).filter(Boolean),selected=values.filter(m=>m[1]==='group').at(-1)||values.filter(m=>m[1]==='grupo').at(-1),value=selected?selected[2].replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''):'';
   if(/[{}<>|&"'\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(value)||api.v219UncertainReferenceIdentity(value))return blocked(raw,id,'uncertain native group identity; preserve exact call');
   return {...api.v219NativeReflistCall(raw,cfg),profile:profileFor(id),identity:id};
  }
  if(id.native&&id.record.mode==='native-header-only'){
   const pad=/^(\s*)[\s\S]*?(\s*)$/.exec(head),text='{{'+pad[1]+'Referências'+pad[2]+raw.slice(2+head.length);
   return {source:raw,text,candidate:text,handled:true,converted:text!==raw,profile:profileFor(id),blocked:false,issues:[],identity:id,proof:{kind:'exact-native-reference-redirect-header-only',nativeAliasOldid:id.record.aliasOldid,nativeTargetOldid:63785697,argumentBytesBefore:raw.slice(2+head.length),argumentBytesAfter:text.slice(2+pad[1].length+'Referências'.length+pad[2].length)}};
  }
  const model=id.native?{body:id.record.consumedBody,group:id.record.consumedGroup,default:id.record.default,allowedGroups:id.record.allowedGroups,layout:id.record.layout,styleFromGroup:[...std],styleDefault:'decimal'}:id.source.semantics;
  const fields=[];let next=1;
  for(const part of parts.slice(1)){
   const match=/^([ \t\r\n]*)([^=\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
   fields.push(match?{key:match[2].replace(/^[ \t]+|[ \t]+$/g,''),value:match[4]}:{key:String(next++),value:part.text});
  }
  const unique=new Set();for(const field of fields){if(unique.has(field.key))return blocked(raw,id,'duplicate source key');unique.add(field.key);}
  const roles=[model.body,model.group];
  if(roles.some(keys=>fields.filter(f=>keys.includes(f.key)).length>1))return blocked(raw,id,'competing source aliases including explicit blank');
  const known=new Set([...model.body,...model.group,...(model.layout||[])]);
  if(fields.some(f=>!known.has(f.key)))return blocked(raw,id,'unproved source field; preserve whole call');
  if(fields.some(f=>(model.layout||[]).includes(f.key)))return blocked(raw,id,'source layout branch needs separate exact proof');
  const body=fields.find(f=>model.body.includes(f.key)),group=fields.find(f=>model.group.includes(f.key)),literal=group?group.value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''):model.default;
  if(/[{}<>|\u0000-\u001F\u007F-\u009F\uE000-\uF8FF&"']/.test(literal)||api.v219UncertainReferenceIdentity(literal))return blocked(raw,id,'dynamic or uncertain group identity');
  if(body&&api.v219ReferenceIdentityQuarantine(body.value,cfg).opaque)return blocked(raw,id,'uncertain raw bank reference identities');
  let resolved=literal;
  if(model.allowedGroups&&!model.allowedGroups.includes(resolved))resolved=model.default;
  if(model.groupMap&&Object.hasOwn(model.groupMap,resolved))resolved=model.groupMap[resolved];
  if(model.unprovedStyleGroups?.includes(resolved))return blocked(raw,id,'unproved source marker style');
  let style=model.styleDefault||'decimal';
  if(model.style&&Object.hasOwn(model.style,resolved))style=model.style[resolved];
  if(model.styleFromGroup?.includes(resolved)&&(!model.styleUsesOnly||group?.key===model.styleUsesOnly))style=resolved;
  if(model.styleVia==='fr:Références')style=({alpha:'lower-alpha',grec:'lower-greek',romain:'lower-roman'})[resolved]||'decimal';
  const targetStyle=std.has(resolved)?resolved:'decimal';
  const text='{{Referências'+(resolved?'|grupo='+resolved:'')+(body?'|refs='+body.value:'')+(style!==targetStyle?'|estilolista='+style:'')+'|nível=0}}';
  return {source:raw,text,candidate:text,handled:true,converted:text!==raw,profile:profileFor(id),blocked:false,issues:[],identity:id,proof:{kind:'source-proven-single-reference-collector',sourceTemplateOldid:id.native?59274856:id.source.source.oldid,nativeTargetOldid:63785697,sourceBodyKey:body?.key??null,bodyRaw:body?.value??'',sourceGroupKey:group?.key??null,sourceGroupValue:literal,resolvedGroup:resolved,sourceListStyle:style,targetListStyle:style,sourceCollectorCount:1,targetCollectorCount:1,sourceHeadingCount:0,targetHeadingCount:0,method:'exact primary consumed role; one literal selected group/default; exact bank bytes; one headless native collector; no dormant alias activation'}};
 }
 return {identity,project,contract};

        })({v215BraceParts,v215BraceStructure,syntaxRepairPlan,v219NativeReflistCall,
            v219UncertainReferenceIdentity,v219ReferenceIdentityQuarantine});
    }
    function v219BankSourceCall(raw,cfg={}) {return v219BankImplementation().project(raw,cfg);}
    function v219BankSourceDescriptor(raw) {
        if(typeof raw!=='string'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const parts=v215BraceParts(raw.slice(2,-2));if(!parts?.length)return null;
        const id=v219BankImplementation().identity(parts[0].text);
        if(!id||id.native&&id.record.mode==='preserve-valid-native-call')return null;
        let model;
        if(id.native&&id.record.mode==='native-header-only')model={body:['refs'],group:['grupo'],default:'',styleFromGroup:['upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'],styleDefault:'decimal'};
        else if(id.native&&id.record.mode==='existing-native-headless-reflist-contract')model={body:['refs'],group:['group','grupo'],default:'',styleFromGroup:['upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'],styleDefault:'decimal'};
        else if(id.native)model={body:id.record.consumedBody,group:id.record.consumedGroup,default:id.record.default,allowedGroups:id.record.allowedGroups,layout:id.record.layout,styleFromGroup:['upper-alpha','upper-roman','lower-alpha','lower-greek','lower-roman'],styleDefault:'decimal'};
        else model=id.source.semantics;
        const fields=[];let implicit=1;
        for(const part of parts.slice(1)){
            const m=/^([ \t\r\n]*)([^=\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text);
            const key=m?m[2].replace(/^[ \t]+|[ \t]+$/g,''):String(implicit++),value=m?m[4]:part.text;
            fields.push({key,value,start:2+part.start+(m?m[0].length-m[4].length:0),end:2+part.end,partStart:2+part.start,partEnd:2+part.end});
        }
        const selected=keys=>{for(const key of keys){const found=fields.filter(field=>field.key===key).at(-1);if(found)return found;}return null;},
            body=selected(model.body),group=selected(model.group),ascii=value=>value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''),value=group?ascii(group.value):model.default;
        const uncertain=/[{}<>|&"'\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(value)||v219UncertainReferenceIdentity(value);
        let resolved=value;if(model.allowedGroups&&!model.allowedGroups.includes(resolved))resolved=model.default;
        if(model.groupMap&&Object.hasOwn(model.groupMap,resolved))resolved=model.groupMap[resolved];
        let style=model.styleDefault||'decimal';
        if(model.style&&Object.hasOwn(model.style,resolved))style=model.style[resolved];
        if(model.styleFromGroup?.includes(resolved)&&(!model.styleUsesOnly||group?.key===model.styleUsesOnly))style=resolved;
        if(model.styleVia==='fr:Références')style=({alpha:'lower-alpha',grec:'lower-greek',romain:'lower-roman'})[resolved]||'decimal';
        const styleField=selected(id.native&&id.record.mode==='existing-native-headless-reflist-contract'?['liststyle','listaestilo','estilolista']:id.native&&id.record.mode==='native-header-only'?['estilolista']:[]);
        if(styleField)style=ascii(styleField.value);
        return {recognized:true,ambiguous:uncertain,groups:uncertain?[]:[resolved],bankGroups:uncertain?[]:[resolved],group:resolved,style,body,fields,id,raw,heading:id.native&&id.record.mode==='native-header-only'?null:0};
    }
    function v219BankSourcePlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.references===false||cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg))return empty;
        const shield=v24SyntaxProtected(source),parsed=v24SyntaxTemplates(shield.view);
        if(shield.unclosed.length||parsed.unclosed.length||v24SyntaxScan(source).issues.length)return empty;
        const hard=v219StageProtectedRanges(source,cfg,true,[],true),edits=[];
        for(const node of parsed.nodes){
            if(node.depth!==0||node.size!==2)continue;
            const raw=source.slice(node.start,node.end),plan=v219BankSourceCall(raw,cfg);
            if(!plan||plan.blocked||plan.text===raw)continue;
            const descriptor=v219BankSourceDescriptor(raw),body=descriptor?.body,head=2+v215BraceParts(raw.slice(2,-2))[0].end,
                retained=plan.proof?.kind==='exact-native-reference-redirect-header-only'?{start:node.start+head,end:node.end}:body?{start:node.start+body.start,end:node.start+body.end}:null;
            let blocked=false;
            for(const range of hard){
                if(range.start>=node.end||range.end<=node.start)continue;
                if(range.kind==='unknown-template'&&range.start===node.start&&range.end===node.end&&descriptor)continue;
                if(retained&&retained.start<=range.start&&range.end<=retained.end&&plan.text.includes(source.slice(range.start,range.end)))continue;
                blocked=true;break;
            }
            if(blocked)continue;
            edits.push({start:node.start,end:node.end,text:plan.text,ruleId:plan.profile?.nativeRenderer?'referenceLists':'translatedTemplates',proof:{sourceHash:empty.sourceHash,raw,contract:plan.proof,retainedBody:body?.value??null}});
        }
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219BankSourceProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after)return false;
        const fresh=v219BankSourcePlan(before,cfg);return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }
    function v219BankProjection(source,cfg={}) {const p=v219BankSourcePlan(source,cfg);return p.edits.length&&v219BankSourceProof(source,p.text,p,cfg)?p.text:source;}
    // The supplement starts with a fresh SOURCE-only collector producer. It
    // never migrates or repairs the candidate endpoint to make it comparable.
    function v219BankFieldInventory(value,cfg={}) {
        const observed=v219NativeReferenceObserver(value),pieces=[];let end=0;
        for(const ref of observed.refs){
            if(ref.start<end)continue;
            pieces.push(value.slice(end,ref.start));
            const body=ref.body===null?null:v219NativeBankBodyIdentity(ref.body,cfg);
            pieces.push(JSON.stringify(['ref',ref.attrs??ref.raw,ref.body===null?null:body===null?['raw',ref.body]:['native',body],!!ref.close]));
            end=ref.end;
        }
        pieces.push(value.slice(end));return pieces.join('');
    }
    function v219BankCollectorInventory(source,cfg={},sensitive=null) {
        const observed=v219NativeReferenceObserver(source),ranges=rendererRanges(observed.view),events=[];
        for(const [ordinal,range]of ranges.entries()){
            const raw=source.slice(range.start,range.end),tag=v24SyntaxTag(raw,0),native=tag?.name==='references'?
                {recognized:true,groups:[v24SyntaxAttrs(tag.attrs)?.group??''],kind:'html'}:v219NativeCollectorGroups(raw);
            if(tag?.name==='references'){
                events.push({start:range.start,end:range.end,value:['collector-html',v24SyntaxAttrs(tag.attrs),v219BankFieldInventory(raw.slice(tag.end,raw.lastIndexOf('</')),cfg)]});continue;
            }
            const parts=v215BraceParts(raw.slice(2,-2));if(!parts?.length)return null;
            const descriptor=v219BankSourceDescriptor(raw),head=v215TemplateTitle(parts[0].text),
                ordinary=v219NativeReferenceCollectorAlias(parts[0].text),fields=[];let implicit=1;
            for(const part of parts.slice(1)){
                const m=/^([ \t\r\n]*)([^=\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part.text),
                    key=m?m[2].replace(/^[ \t]+|[ \t]+$/g,''):String(implicit++),value=m?m[4]:part.text;
                fields.push([key,v219BankFieldInventory(value,cfg)]);
            }
            // Distinct keys have no relative priority. Duplicate keys retain
            // their original order, including explicitly empty last values.
            fields.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
            const kind=ordinary?'native-references':native.recognized?native.kind:'opaque:'+head;
            events.push({start:range.start,end:range.end,value:sensitive!==null&&!sensitive.has(ordinal)?['collector-groups',native.groups??null]:['collector',kind,native.groups??null,fields,
                descriptor&&!ordinary?descriptor.style:null]});
        }
        for(const ref of observed.refs){
            if(ranges.some(range=>range.start<=ref.start&&ref.end<=range.end))continue;
            events.push({start:ref.start,end:ref.end,value:['marker',ref.group]});
        }
        for(const helper of observed.helpers){
            if(ranges.some(range=>range.start<=helper.start&&helper.end<=range.end))continue;
            if(helper.eligible)for(const call of helper.calls)events.push({start:call.start,end:call.end,
                value:['helper-marker',call.group??'']});
        }
        for(const owner of v219OpaqueNativeLangueOwners(source))events.push({start:owner.start,end:owner.end,value:['opaque-native-langue',owner.identity]});
        return events.sort((a,b)=>a.start-b.start||b.end-a.end).map(event=>event.value);
    }
    function v219BankCollectorGroupIntent(source,node,plan,cfg={}) {
        if(typeof source!=='string'||!node||!Number.isInteger(node.start)||!Number.isInteger(node.end)||node.start<0||node.end>source.length||node.end<=node.start||!v212ReferenceFieldScope(cfg)||!plan?.changes?.some(change=>change.ruleId==='v212CollectorGroups'))return false;
        const raw=source.slice(node.start,node.end),parts=v215BraceParts(raw.slice(2,-2));
        if(!parts?.length||!v219OriginalTemplateHeaderAllowed(parts[0].text)||!v219NativeReferenceCollectorAlias(parts[0].text))return false;
        const fields=foreignEntries(parsedTemplate(raw)).filter(field=>field.key==='group');
        if(!fields.length||parts.slice(1).filter(part=>/^[ \t\r\n]*group[ \t\r\n]*=/.test(part.text)).length!==fields.length)return false;
        const selected=v219NativeCollectorGroups(plan.text),group=selected.recognized&&selected.groups?.length===1?selected.groups[0]:'';
        if(!group||v219UncertainReferenceIdentity(group))return false;
        const observed=v219NativeReferenceObserver(source),matching=observed.refs.some(ref=>ref.valid&&ref.close&&typeof ref.body==='string'&&ref.body.trim()&&ref.group===group&&ref.attrs?.group===group)||
            observed.helpers.some(helper=>helper.eligible&&helper.helperKind==='note'&&helper.calls.some(call=>call.group===group&&typeof call.body==='string'&&call.body.trim()));
        if(!matching)return false;
        const ranges=rendererRanges(observed.view),otherDefault=ranges.some(range=>{
            if(range.start===node.start&&range.end===node.end)return false;
            const context=v24SyntaxContext(observed.view,range.start);
            if(context.templates.length||context.links.length||context.external.length||context.html.some(tag=>['ref','references'].includes(tag.name)))return false;
            const other=source.slice(range.start,range.end),tag=v24SyntaxTag(other,0);
            if(tag?.name==='references'){const attrs=v24SyntaxAttrs(tag.attrs);return !!attrs&&!v219UncertainReferenceIdentity(attrs.group||'')&&!(attrs.group||'');}
            const native=v219NativeCollectorGroups(other);return native.recognized&&!native.ambiguous&&native.groups.includes('');
        });
        if(otherDefault)return true;
        if(observed.unclosed.length||observed.empties.length||observed.refs.some(ref=>!ref.valid||!ref.group)||
            observed.helpers.some(helper=>!helper.eligible||helper.calls.some(call=>!call.group)))return false;
        const parsed=v24SyntaxTemplates(observed.view);if(parsed.unclosed.length)return false;
        for(const owner of parsed.nodes){
            const call=source.slice(owner.start,owner.end);
            if(ranges.some(range=>range.start===owner.start&&range.end===owner.end))continue;
            if(observed.helpers.some(helper=>helper.eligible&&helper.start===owner.start&&helper.end===owner.end))continue;
            if(v219NativeCitationStateInterface(call)||v2111ReferenceFreeTemplate(call)||v219LiteralDefaultSortCall(call))continue;
            const p=parsedTemplate(call),head=v215TemplateTitle(p.parts[0]),entries=foreignEntries(p);
            if(v219OriginalTemplateHeaderAllowed(p.parts[0])&&/^[Pp]ortal3$/.test(head)&&entries.length>=1&&entries.length<=10&&entries.every(field=>field.positional&&field.value.trim()&&!/[{}<>\[\]&|\r\n\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(field.value)))continue;
            return false;
        }
        return true;
    }
    function v219BankGroupMinorAllowed(before,after,options={}) {
        if(typeof before!=='string'||typeof after!=='string'||before===after||!/[|][ \t\r\n]*group[ \t\r\n]*=/.test(before))return true;
        const cfg=pageContextOptions({...DEFAULTS,...options}),source=v219BankProjection(before,cfg),plan=v219BankNativeGroupPlan(source,cfg);
        if(!plan.edits.length||!v219BankNativeGroupProof(source,plan.text,plan,cfg))return true;
        const groups=value=>{const observed=v219NativeReferenceObserver(value);return rendererRanges(observed.view).map(range=>{
            const raw=value.slice(range.start,range.end),tag=v24SyntaxTag(raw,0);
            return tag?.name==='references'?[v24SyntaxAttrs(tag.attrs)?.group??null]:v219NativeCollectorGroups(raw).groups??null;
        });};
        return JSON.stringify(groups(before))===JSON.stringify(groups(after));
    }

    function v219BankNativeGroupPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(typeof source!=='string'||source.length>4194304||!v212ReferenceFieldScope(cfg)||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg))return empty;
        const proposed=[...v219NativeCollectorGroupEdits(source,cfg),...v212ReferenceFieldEdits(source,cfg).filter(edit=>edit.ruleId==='v212CollectorGroups')],
            edits=v219StageSafeEdits(source,proposed,'v219-native-collector-groups',cfg);
        return {...empty,edits,text:v24SyntaxApply(source,edits)};
    }
    function v219BankNativeGroupProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.edits?.length)return false;
        const fresh=v219BankNativeGroupPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

    function v219BankSourceFragmentRisk(source) {
        return typeof source==='string'&&/#|%23|&num;/i.test(source);
    }
    function v219BankAnchorLinks(source,observed=null,cfg={}) {
        const view=(observed||v219NativeReferenceObserver(source)).view,links=[];
        for(const match of view.matchAll(/\[\[([^\[\]\r\n]*?)\]\]/g)){
            const target=source.slice(match.index+2,match.index+2+match[1].split('|')[0].length);
            if(!v219BankSourceFragmentRisk(target))continue;
            let local=target;
            if(typeof cfg.pageTitle==='string'&&cfg.pageTitle&&target.startsWith(cfg.pageTitle)){
                const suffix=target.slice(cfg.pageTitle.length);
                if(/^(?:#|%23|&#(?:35|x23);|&num;)/i.test(suffix))local=suffix;
            }
            const protection=v219ReferenceCollectorFragment(local.replace(/&num;/gi,'#'));
            if(/^#(?:notas|referências)(?:[ _]+[1-9]\d*)?$/.test(protection))
                links.push({start:match.index,end:match.index+match[0].length,value:['fragment',target]});
        }
        return links;
    }
    function v219BankAnchorContext(source,observed=null,ranges=null,cfg={}) {
        if(!v219BankSourceFragmentRisk(source)||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg))return false;
        observed=observed||v219NativeReferenceObserver(source);ranges=ranges||rendererRanges(observed.view);
        const names=[];
        if(ranges.length!==2)return false;
        for(const range of ranges){
            const raw=source.slice(range.start,range.end),parts=v215BraceParts(raw.slice(2,-2)),context=v24SyntaxContext(observed.view,range.start),
                lineStart=source.lastIndexOf('\n',range.start-1)+1,next=source.indexOf('\n',range.end),lineEnd=next<0?source.length:next;
            if(!parts?.length||parts.length!==1||!v219OriginalTemplateHeaderAllowed(parts[0].text)||
                context.templates.length||context.links.length||context.external.length||context.html.length||
                /[^ \t\r]/.test(source.slice(lineStart,range.start)+source.slice(range.end,lineEnd)))return false;
            const name=v215SameTemplateTitle(parts[0].text,'Notas')?'Notas':v215SameTemplateTitle(parts[0].text,'Referências')?'Referências':null;
            if(!name||names.includes(name))return false;names.push(name);
        }
        return names.includes('Notas')&&names.includes('Referências')&&v219BankAnchorLinks(source,observed,cfg).length>0;
    }
    function v219BankAnchorInventory(source,observed=null,ranges=null,cfg={},markers=false) {
        observed=observed||v219NativeReferenceObserver(source);ranges=ranges||rendererRanges(observed.view);
        const events=v219BankAnchorLinks(source,observed,cfg);
        for(const range of ranges){
            const raw=source.slice(range.start,range.end),parts=v215BraceParts(raw.slice(2,-2));
            if(parts?.length&&(v215SameTemplateTitle(parts[0].text,'Notas')||v215SameTemplateTitle(parts[0].text,'Referências')))
                events.push({start:range.start,end:range.end,value:['collector',raw]});
        }
        if(markers){
            for(const ref of observed.refs)events.push({start:ref.start,end:ref.end,value:['marker',ref.group]});
            for(const helper of observed.helpers)events.push({start:helper.start,end:helper.end,
                value:['helper-marker',helper.helperKind||'',!!helper.eligible,helper.calls.map(call=>call.group??'')]});
        }
        for(const match of observed.view.matchAll(/^[ \t]*(={1,6})(?!=)([^\r\n]*?)\1[ \t]*\r?$/gm)){
            const title=match[2].replace(/^[ \t]+|[ \t]+$/g,'');
            if(!/^(?:notas|referências)$/i.test(title))continue;
            const context=v24SyntaxContext(observed.view,match.index);
            if(!context.templates.length&&!context.links.length&&!context.external.length&&!context.html.length)
                events.push({start:match.index,end:match.index+match[0].length,value:['heading',source.slice(match.index,match.index+match[0].length)]});
        }
        return events.sort((a,b)=>a.start-b.start||b.end-a.end).map(event=>event.value);
    }

    function v219BankAnchorPaddingPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,edits:[]};
        if(!cfg.headings||typeof source!=='string'||source.length>4194304||!v219BankAnchorContext(source,null,null,cfg))return empty;
        const fullWriterText=cleanHeadings(source,()=>{},cfg.multilingual),before=source.split('\n'),after=fullWriterText.split('\n'),edits=[];
        if(fullWriterText===source||before.length!==after.length)return empty;
        let start=0;
        for(let index=0;index<before.length;index++){
            const raw=before[index],next=after[index];
            if(raw!==next){
                const a=/^(={2,6})(?!=)[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*(\r?)$/.exec(raw),
                    b=/^(={2,6})(?!=)[ \t]*([^\r\n]*?)[ \t]*\1[ \t]*(\r?)$/.exec(next);
                if(a&&b&&a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3]&&/^(?:Notas|Referências)$/.test(a[2]))
                    edits.push({start,end:start+raw.length,text:next,ruleId:'headings'});
            }
            start+=raw.length+1;
        }
        const allowed=v219StageSafeEdits(source,edits,'headings',cfg);
        if(!allowed.length||JSON.stringify(allowed)!==JSON.stringify(edits))return empty;
        return {...empty,text:v24SyntaxApply(source,allowed),edits:allowed,fullWriterText};
    }
    function v219BankAnchorPaddingProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.edits?.length)return false;
        const fresh=v219BankAnchorPaddingPlan(before,cfg);
        return fresh.text===after&&fresh.fullWriterText===plan.fullWriterText&&JSON.stringify(fresh.edits)===JSON.stringify(plan.edits);
    }

    function v219BankEndSectionSegmentAllowed(segment,cfg={},wholeSource=segment) {
        const context=pageContextOptions({...DEFAULTS,...cfg});
        if(context.namespaceNumber!==0||context.sectionOnly||context.discussionPage||
            context.contentModel&&context.contentModel!=='wikitext'||v20DefinitionContext(context)||!v20AutomationAllowed(wholeSource,context))return false;
        if(typeof segment!=='string'||/[\uE000-\uF8FF]/.test(segment))return false;
        const observed=v219NativeReferenceObserver(segment);
        if(observed.refs.length||observed.unclosed.length||observed.empties.length||observed.helpers.length)return false;
        const hard=[...v219MarkdownLiteralRanges(segment),...v219WholeQuotedCodeRanges(segment),...v219QuotedTemplateRanges(segment,false),...v24SyntaxProtected(segment).ranges];
        if(hard.length)return false;
        const parsed=v24SyntaxTemplates(observed.view),renderers=rendererRanges(observed.view);
        if(parsed.unclosed.length)return false;
        for(const range of renderers){
            const raw=segment.slice(range.start,range.end),parts=v215BraceParts(raw.slice(2,-2)),context=v24SyntaxContext(observed.view,range.start);
            if(context.templates.length||context.links.length||context.external.length||context.html.length||
                !parts?.length||!v219OriginalTemplateHeaderAllowed(parts[0].text)||!v219NativeCollectorGroups(raw).recognized)return false;
        }
        if(v219BankSourceFragmentRisk(wholeSource)&&renderers.filter(range=>{
            const parts=v215BraceParts(segment.slice(range.start+2,range.end-2));
            return parts?.length&&v219NativeReferenceCollectorAlias(parts[0].text);
        }).length>1)return false;
        for(const node of parsed.nodes){
            if(renderers.some(range=>range.start===node.start&&range.end===node.end))continue;
            const raw=segment.slice(node.start,node.end),parts=v215BraceParts(raw.slice(2,-2));
            if(!parts?.length||!v219OriginalTemplateHeaderAllowed(parts[0].text))return false;
            if(v219NativeCitationStateInterface(raw)||v2111ReferenceFreeTemplate(raw)||v219LiteralDefaultSortCall(raw))continue;
            return false;
        }
        return true;
    }
    function v219BankSourceTopologyPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,steps:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg))return plan;
        const stage=(name,text)=>{
            if(text===plan.text)return;
            const edit={start:0,end:plan.text.length,text,ruleId:name},allowed=v219StageSafeEdits(plan.text,[edit],name,cfg);
            if(allowed.length!==1||JSON.stringify(allowed[0])!==JSON.stringify(edit))return;
            const before=plan.text;plan.text=text;plan.steps.push({name,before,text,edits:allowed});
        };
        if(cfg.endMatter&&cfg.endSectionOrder){
            const observed=v219NativeReferenceObserver(plan.text),ranges=rendererRanges(observed.view),groups=new Set();
            let eligible=ranges.length>=2;
            for(const range of ranges){
                const raw=plan.text.slice(range.start,range.end),parts=v215BraceParts(raw.slice(2,-2)),native=v219NativeCollectorGroups(raw),
                    context=v24SyntaxContext(observed.view,range.start),lineStart=plan.text.lastIndexOf('\n',range.start-1)+1,
                    next=plan.text.indexOf('\n',range.end),lineEnd=next<0?plan.text.length:next;
                if(!parts?.length||!v219OriginalTemplateHeaderAllowed(parts[0].text)||
                    context.templates.length||context.links.length||context.external.length||context.html.length||
                    /[^ \t\r]/.test(plan.text.slice(lineStart,range.start)+plan.text.slice(range.end,lineEnd))||
                    !native.recognized||native.ambiguous||!native.groups?.length){eligible=false;break;}
                const notes=v215SameTemplateTitle(parts[0].text,'Notas'),refs=v219NativeReferenceCollectorAlias(parts[0].text);
                if(notes?parts.length!==1:!refs||parts.length>2||parts.length===2&&!/^[ \t\r\n]*grupo[ \t]*=[ \t]*[^{}<>|&"'\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]+[ \t\r\n]*$/.test(parts[1].text)){eligible=false;break;}
                for(const group of native.groups){if(typeof group!=='string'||v219UncertainReferenceIdentity(group)||groups.has(group)){eligible=false;break;}groups.add(group);}
                if(!eligible)break;
            }
            if(eligible){
                const start=ranges[0].start,footer=footerTokens(plan.text,cfg.footerProfiles),end=footer.start,
                    suffix=plan.text.slice(start,end),edits=ranges.map(range=>({start:range.start-start,end:range.end-start,text:''}));
                const footerSafe=end===plan.text.length||!cfg.footerProfiles&&footer.tokens.length&&footer.tokens.every(token=>
                    token.role==='sort'?v219LiteralDefaultSortCall(token.raw):
                    token.role==='category'?/^\[\[Categoria:[^{}\[\]<>&\r\n\u0000-\u001f\u007f-\u009f\uE000-\uF8FF]+\]\]$/.test(token.raw):
                    token.role==='portal'&&/^\{\{Portal3(?:\|[^{}\[\]<>&|="'`\r\n\u0000-\u001f\u007f-\u009f\uE000-\uF8FF]+){1,10}\}\}$/.test(token.raw));
                if(end>=ranges[ranges.length-1].end&&footerSafe&&!v24SyntaxApply(suffix,edits).trim()&&
                    v219BankEndSectionSegmentAllowed(suffix,cfg,plan.text)){
                    const ordered=orderEndSections(plan.text,cfg,()=>{},()=>{});
                    if(ordered.startsWith(plan.text.slice(0,start))&&ordered.endsWith(plan.text.slice(end)))
                        stage('v219-bank-source-collector-order',ordered);
                }
            }
        }
        if(v219UnifiedNotesSourceAllowed(plan.text,cfg))stage('v219-bank-source-unified-collectors',unifiedNotesReferences(plan.text,cfg,()=>{},()=>{}));
        return plan;
    }
    function v219BankSourceTopologyProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.steps?.length)return false;
        const fresh=v219BankSourceTopologyPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }

    function v219BankExistingCollectorPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),plan={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,steps:[]};
        if(typeof source!=='string'||source.length>4194304||cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg))return plan;
        const stage=(name,edits)=>{
            const allowed=v219StageSafeEdits(plan.text,edits,name,cfg);
            if(!allowed.length)return;
            const before=plan.text,text=v24SyntaxApply(before,allowed);
            if(text!==before){plan.steps.push({name,before,text,edits:allowed});plan.text=text;}
        };
        const syntax=syntaxRepairPlan(plan.text,cfg),referenceRules=new Set(['syntaxReferenceClosers','syntaxNamedRefReuse','syntaxFormattingClosers']);
        if(syntax.edits.length&&syntaxRepairEquivalence(plan.text,syntax.text,syntax,cfg))
            stage('v219-bank-existing-reference-syntax',syntax.edits.filter(edit=>edit.proof?.rules?.length&&edit.proof.rules.every(rule=>
                referenceRules.has(rule.ruleId)||rule.ruleId==='syntaxTagTypos'&&['ref','references'].includes(rule.tag)||
                rule.ruleId==='syntaxTemplateClosers'&&rule.profile==='citation'&&edit.proof.rules.some(peer=>
                    peer.ruleId==='syntaxReferenceClosers'&&['explicit-ref-close','explicit-references-close'].includes(peer.boundary)))));
        if(v24SyntaxScope(cfg)){
            stage('duplicate-literal-attributes',v25SafeDuplicateAttributeEdits(plan.text,cfg).filter(edit=>edit.proof?.tag==='ref'));
            const references=v213ReferenceSyntaxPlan(plan.text,cfg);
            if(references.steps.length&&v213ReferenceSyntaxProof(plan.text,references.text,references,cfg))
                for(const step of references.steps)if(step.before===plan.text)
                    stage(({closer:'v213-reference-closer-slash',dangling:'v213-dangling-reference',attributes:'v213-native-ref-attributes'})[step.name],step.edits);
            if(cfg.references!==false)stage('adjacent-empty-collectors',v25SafeCollectorEdits(plan.text));
        }
        if(cfg.noteRendererProofSource===plan.text&&Array.isArray(cfg.noteRendererProofs)){
            const text=automaticMissingNoteCollector(plan.text,cfg,()=>{});
            if(text!==plan.text)stage('v219-bank-source-proved-missing-note',[{start:0,end:plan.text.length,text,ruleId:'missingNoteCollector'}]);
        }
        if(v24SyntaxScope(cfg)){
            stage('v219-native-collector-groups',v219NativeCollectorGroupPlan(plan.text,cfg).edits);
            stage('v212-reference-fields',v212ReferenceFieldPlan(plan.text,cfg).edits);
        }
        if(cfg.references&&cfg.referenceColumns!==false){
            const legacy=v218ReferenceColumnPlans(plan.text,cfg,true);
            stage('v218-reference-layout',legacy.map(row=>({start:row.start,end:row.end,text:row.after,ruleId:'legacyReferenceColumns',proof:row.proof})));
        }
        if(cfg.references&&structuralScope(cfg)&&!v219ReferenceIdentityQuarantine(plan.text,cfg).opaque){
            const structural=structuralArticlePlan(plan.text,cfg).referencePlan;
            if(structural&&structural.text!==plan.text&&v219RestoredCollectorPlanAllowed(plan.text,cfg,structural,null))
                stage('v219-bank-existing-collector-relocation',[{start:0,end:plan.text.length,text:structural.text,ruleId:'relocatedReferenceList'}]);
        }
        return plan;
    }
    function v219BankExistingCollectorProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.steps?.length)return false;
        const fresh=v219BankExistingCollectorPlan(before,cfg);
        return fresh.text===after&&JSON.stringify(fresh.steps)===JSON.stringify(plan.steps);
    }

    function v219BankRetention(before,after,options={}) {
        const pass={accepted:true,reason:'',checked:0};
        if(before===after||typeof before!=='string'||typeof after!=='string')return pass;
        const cfg=pageContextOptions({...DEFAULTS,...options}),observed=v219NativeReferenceObserver(before),ranges=rendererRanges(observed.view),
            sensitive=new Set(ranges.flatMap((range,index)=>{
                const raw=before.slice(range.start,range.end),p=v219BankSourceCall(raw,cfg),tag=v24SyntaxTag(raw,0),
                    native=tag?.name==='references'||v219NativeCollectorGroups(raw).recognized;
                return native||p&&!(p.identity?.native&&p.identity.record.mode==='preserve-valid-native-call')?[index]:[];
            })),sourceCalls=[...sensitive];
        const anchored=v219BankAnchorContext(before,observed,ranges,cfg);
        if(anchored){
            const actualShape=JSON.stringify(v219BankAnchorInventory(after,null,null,cfg));
            if(JSON.stringify(v219BankAnchorInventory(before,observed,ranges,cfg))!==actualShape){
                const padding=v219BankAnchorPaddingPlan(before,cfg);
                if(!padding.edits.length||!v219BankAnchorPaddingProof(before,padding.text,padding,cfg)||
                    JSON.stringify(v219BankAnchorInventory(padding.text,null,null,cfg))!==actualShape)
                    return {accepted:false,checked:sourceCalls.length,reason:'Os destinos internos de Notas/Referências e a ordem dos títulos/coletores foram alterados.'};
            }
        }
        if(!sourceCalls.length&&!v219OpaqueNativeLangueOwners(before).length)return pass;
        const actualAnchors=anchored?JSON.stringify(v219BankAnchorInventory(after,null,null,cfg,true)):null,
            sameAnchors=value=>{
                if(!anchored||JSON.stringify(v219BankAnchorInventory(value,null,null,cfg,true))===actualAnchors)return true;
                const padding=v219BankAnchorPaddingPlan(value,cfg);
                return !!padding.edits.length&&v219BankAnchorPaddingProof(value,padding.text,padding,cfg)&&
                    JSON.stringify(v219BankAnchorInventory(padding.text,null,null,cfg,true))===actualAnchors;
            },actual=v219BankCollectorInventory(after,cfg,sensitive),same=value=>actual!==null&&
                JSON.stringify(v219BankCollectorInventory(value,cfg,sensitive))===JSON.stringify(actual)&&sameAnchors(value);
        if(same(before))return {...pass,checked:sourceCalls.length};
        const table=v213TableFiniteRepairPlan(before,cfg);
        if(table.edits.length&&table.text!==before&&v213TableFiniteRepairProof(before,table.text,table,cfg)&&
            JSON.stringify(v219StageSafeEdits(before,table.edits,'v210-table-syntax',cfg))===JSON.stringify(table.edits)){
            const sourceCollectors=v219BankCollectorInventory(before,cfg),tableCollectors=v219BankCollectorInventory(table.text,cfg);
            if(Array.isArray(sourceCollectors)&&Array.isArray(tableCollectors)&&JSON.stringify(sourceCollectors)===JSON.stringify(tableCollectors)){
                const collector=v219BankExistingCollectorPlan(table.text,cfg);
                if(collector.steps.length&&v219BankExistingCollectorProof(table.text,collector.text,collector,cfg)&&same(collector.text))
                    return {...pass,checked:sourceCalls.length};
            }
        }
        if(before.length<=4194304){
            const numeric=cfg.tableSyntaxRepairs!==false?v272TableSyntaxPlan(before,cfg):null;
            if(numeric?.edits.length&&numeric.text!==before&&v272TableSyntaxProof(before,numeric.text,numeric,cfg)&&
                JSON.stringify(v219StageSafeEdits(before,numeric.edits,'v272-numeric-cell-quotes',cfg))===JSON.stringify(numeric.edits)){
                const sourceCollectors=v219BankCollectorInventory(before,cfg),tableCollectors=v219BankCollectorInventory(numeric.text,cfg);
                if(Array.isArray(sourceCollectors)&&Array.isArray(tableCollectors)&&JSON.stringify(sourceCollectors)===JSON.stringify(tableCollectors)){
                    const collector=v219BankExistingCollectorPlan(numeric.text,cfg);
                    if(collector.steps.length&&v219BankExistingCollectorProof(numeric.text,collector.text,collector,cfg)&&same(collector.text))
                        return {...pass,checked:sourceCalls.length};
                }
            }
            const syntax=v210TableRepairPlan(before,cfg),step=syntax.steps.length===1?syntax.steps[0]:null;
            if(step?.name==='v210-table-syntax'&&step.before===before&&step.after===syntax.text&&step.edits.length&&
                v210TableRepairProof(before,syntax.text,syntax,cfg)&&
                JSON.stringify(v219StageSafeEdits(step.before,step.edits,'v210-table-syntax',cfg))===JSON.stringify(step.edits)){
                const sourceCollectors=v219BankCollectorInventory(step.before,cfg),tableCollectors=v219BankCollectorInventory(step.after,cfg);
                if(Array.isArray(sourceCollectors)&&Array.isArray(tableCollectors)&&JSON.stringify(sourceCollectors)===JSON.stringify(tableCollectors)){
                    const collector=v219BankExistingCollectorPlan(step.after,cfg);
                    if(collector.steps.length&&v219BankExistingCollectorProof(step.after,collector.text,collector,cfg)&&same(collector.text))
                        return {...pass,checked:sourceCalls.length};
                }
            }
        }
        const appended=v219OpaqueLangueDefaultCollectorPlan(before,cfg);
        if(appended.edits.length&&v219OpaqueLangueDefaultCollectorProof(before,appended.text,appended,cfg)&&same(appended.text))
            return {...pass,checked:sourceCalls.length};
        if(cfg.noteRendererProofSource===before&&typeof v219NativeHelperCosmeticContextSource==='function'){
            const context=v219NativeHelperCosmeticContextSource(before,cfg);
            if(context!==before&&same(context))return {...pass,checked:sourceCalls.length};
        }
        const plan=v219BankSourcePlan(before,cfg);
        let projected=plan.edits.length&&v219BankSourceProof(before,plan.text,plan,cfg)?plan.text:before;
        if(same(projected))return {...pass,checked:sourceCalls.length};
        // Independently construct only source-proven cosmetic argument drops.
        // Header, group selection, collector order and retained refs stay raw.
        const cosmetic=[];
        for(const range of rendererRanges(v219NativeReferenceObserver(projected).view)){
            const call=v219PinnedNativeParameterCosmeticCall(projected.slice(range.start,range.end),cfg);
            if(call&&!call.commonscat)cosmetic.push({start:range.start,end:range.end,text:call.text,ruleId:call.rules[0]});
        }
        const allowedCosmetic=v219StageSafeEdits(projected,cosmetic,'v219-native-collector-parameters',cfg);
        if(allowedCosmetic.length){
            projected=v24SyntaxApply(projected,allowedCosmetic);
            if(same(projected))return {...pass,checked:sourceCalls.length};
        }
        // A native helper can be unreadable solely because it still has the
        // identical/ignored fields removed by its independently pinned plan.
        // Compose that fresh SOURCE plan; never reinterpret the candidate.
        if(typeof v219NativeHelperCosmeticPlan==='function'&&typeof v219NativeHelperCosmeticProof==='function'){
            const cosmetic=v219NativeHelperCosmeticPlan(projected,cfg);
            if(cosmetic.edits.length&&v219NativeHelperCosmeticProof(projected,cosmetic.text,cosmetic,cfg))projected=cosmetic.text;
            if(same(projected))return {...pass,checked:sourceCalls.length};
        }
        const biography=v2151BiographyLeadPlan(projected,cfg);
        if(biography.edits.some(edit=>edit.proof?.copiedFacts?.length)&&
            v2151BiographyLeadProof(projected,biography.text,biography,cfg)&&
            JSON.stringify(v219StageSafeEdits(projected,biography.edits,'v2151-biography-lead',cfg))===JSON.stringify(biography.edits)){
            projected=biography.text;
            if(same(projected))return {...pass,checked:sourceCalls.length};
        }
        const existing=v219BankExistingCollectorPlan(projected,cfg);
        if(existing.steps.length&&v219BankExistingCollectorProof(projected,existing.text,existing,cfg)){
            projected=existing.text;
            if(same(projected))return {...pass,checked:sourceCalls.length};
        }
        // Existing independently enabled source producers can compose after
        // the bank transaction. Their fresh source endpoint is retained;
        // no target-side producer or fixed-point loop is used.
        if(cfg.references!==false){
            projected=v25ReferenceProofNormalization(projected,cfg);
            if(same(projected))return {...pass,checked:sourceCalls.length};
            const native=v219BankNativeCollectorPlan(projected,cfg);
            if(native.changed&&v219BankNativeCollectorProof(projected,native.text,native,cfg)){
                projected=native.text;
                if(same(projected))return {...pass,checked:sourceCalls.length};
            }
            const layout=v218ReferenceLayoutPlan(projected,cfg);
            if(layout.edits.length&&v218ReferenceLayoutProof(projected,layout.text,layout,cfg)&&
                JSON.stringify(v219StageSafeEdits(projected,layout.edits,'v218-reference-layout',cfg))===JSON.stringify(layout.edits)){
                projected=layout.text;
                if(same(projected))return {...pass,checked:sourceCalls.length};
            }
        }
        const topology=v219BankSourceTopologyPlan(projected,cfg);
        if(topology.steps.length&&v219BankSourceTopologyProof(projected,topology.text,topology,cfg)){
            projected=topology.text;
            if(same(projected))return {...pass,checked:sourceCalls.length};
        }
        const wrapped=v219BankWrappedFooterSource(before,cfg);
        if(wrapped!==null&&same(wrapped))return {...pass,checked:sourceCalls.length};
        return {accepted:false,checked:sourceCalls.length,
            reason:'O coletor, seus argumentos, estilo ou posição entre referências foram alterados além do contrato da fonte.'};
    }
    function v219NativeReflistCall(raw,cfg={}) {
        const base=v219BankBaseNativeReflistCall(raw,cfg);if(!base)return base;
        const parts=v215BraceParts(raw.slice(2,-2)),values=parts?.slice(1).map(part=>/^\s*(group|grupo)\s*=([\s\S]*)$/.exec(part.text)).filter(Boolean)||[],
            selected=values.filter(m=>m[1]==='group').at(-1)||values.filter(m=>m[1]==='grupo').at(-1),
            value=selected?selected[2].replace(/^[ \t\r\n]+|[ \t\r\n]+$/g,''):'';
        if(/[{}<>|&"'\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(value)||v219UncertainReferenceIdentity(value))
            return {...base,text:raw,candidate:raw,converted:false,blocked:true,quietNativeRefusal:true,
                refusal:'uncertain native group identity; preserve exact call'};
        return base;
    }

    function v219NativeCollectorGroups(raw) {
        const known=v219BankBaseNativeCollectorGroups(raw);if(known.recognized)return known;
        const source=v219BankSourceDescriptor(raw);return source?{recognized:true,groups:source.groups,bankGroups:source.bankGroups,ambiguous:source.ambiguous,kind:'source-bound-collector',nativeOldid:source.id.native?source.id.record.targetOldid:source.id.source.source.oldid}:known;
    }
    function scanRendererRanges(source) {
        const original=v219BankBaseScanRendererRanges(source),found=new Map(original.map(node=>[node.start+':'+node.end,node]));
        for(const node of topNodes(source)){const descriptor=v219BankSourceDescriptor(source.slice(node.start,node.end));if(descriptor)found.set(node.start+':'+node.end,node);}
        return [...found.values()].sort((a,b)=>a.start-b.start);
    }
    function v219NativeReferenceRendererContext(source,at,parsed,cache) {
        const ancestors=parsed.nodes.filter(node=>node.size===2&&node.start<at&&at<node.end);
        if(ancestors.length===1){const node=ancestors[0],descriptor=v219BankSourceDescriptor(source.slice(node.start,node.end));
            if(descriptor){const body=descriptor.body;return {valid:!descriptor.ambiguous&&!!body&&node.start+body.start<=at&&at<node.start+body.end,group:descriptor.group};}}
        return v219BankBaseRendererContext(source,at,parsed,cache);
    }

    function v219BareHtmlCollectorAllowed(source,range) {
        if(typeof source!=='string'||!range||!Number.isInteger(range.start)||!Number.isInteger(range.end))return false;
        const lineStart=source.lastIndexOf('\n',range.start-1)+1,next=source.indexOf('\n',range.end),lineEnd=next<0?source.length:next;
        if(!/^[ \t]*$/.test(source.slice(lineStart,range.start))||! /^[ \t\r]*$/.test(source.slice(range.end,lineEnd)))return false;
        const context=v24SyntaxContext(source,range.start);
        if(['templates','html','tables','links','external'].some(key=>context[key]?.length))return false;
        return !v219StageProtectedRanges(source,{},false,[],true).some(owner=>owner.start<range.end&&owner.end>range.start);
    }
    function v219BankNativeCollectorPlan(source,options={}) {
        const cfg=pageContextOptions({...DEFAULTS,...options}),empty={source,sourceHash:typeof source==='string'?v24SyntaxHash(source):null,text:source,changed:false};
        if(typeof source!=='string'||source.length>4194304||!cfg.references||cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg)||!v20AutomationAllowed(source,cfg)||v24SyntaxScan(source).issues.length)return empty;
        const text=normalizeLists(source,()=>{},()=>{});if(text===source)return empty;
        const edits=v219StageSafeEdits(source,[{start:0,end:source.length,text,ruleId:'referenceLists'}],'v219-bank-native-collector-source',cfg);
        return edits.length===1&&edits[0].text===text?{...empty,text,changed:true}:empty;
    }
    function v219BankNativeCollectorProof(before,after,plan,cfg={}) {
        if(!plan||plan.source!==before||plan.sourceHash!==v24SyntaxHash(before)||plan.text!==after||!plan.changed)return false;
        const fresh=v219BankNativeCollectorPlan(before,cfg);
        return fresh.changed&&fresh.text===after&&fresh.sourceHash===plan.sourceHash;
    }

    // Pinned native interfaces admit only identical duplicates and ignored
    // empty fields. Every surviving part keeps its original bytes and order.
    const v219PinnedNativeParameterCosmeticCall=(raw,cfg={})=>{
        if(typeof raw!=='string'||raw.length>4194304||cfg.auxiliaryTemplates!==true||
            cfg.namespaceNumber!==0||cfg.sectionOnly||cfg.discussionPage||
            cfg.contentModel&&cfg.contentModel!=='wikitext'||!raw.startsWith('{{')||!raw.endsWith('}}'))return null;
        const p=parsedTemplate(raw),name=v215SameTemplateTitle(p.parts[0],'Commonscat')?'commonscat':p.name,
            pins={commonscat:69308503,notas:59102402,
            'notas e referências':73218466,notelist:59274856,listanota:59274856,'referências':63785697,reflist:56151616},
            profile=TEMPLATE_CATALOG[name],parts=v215BraceParts(raw.slice(2,-2),true);
        if(!Object.hasOwn(pins,name)||!profile||profile.oldid!==pins[name]||profile.partial||
            !parts||parts.length!==p.parts.length||!v219OriginalTemplateHeaderAllowed(parts[0].text)||
            !v215SameTemplateTitle(parts[0].text,profile.title)||
            /[{}<>\r\n\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(parts[0].text)||
            Object.keys(profile.aliases||{}).length||Object.keys(profile.renames||{}).length)return null;
        if(name==='commonscat'&&/[{}<>\[\]\uE000-\uF8FF]/.test(raw.slice(2,-2)))return null;
        const rows=[],families=new Map(),removed=new Map();
        for(let index=1;index<parts.length;index++){
            const part=parts[index].text,match=/^([ \t\r\n]*)([^=\r\n]+?)([ \t]*=[ \t]*)([\s\S]*)$/.exec(part);
            if(!match)continue;
            const key=match[2].replace(/^[ \t]+|[ \t]+$/g,''),value=match[4];
            if(!key||/[{}<>\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(key))return null;
            const row={index,key,value,accepted:profileAccepts(profile,key)};rows.push(row);
            if(!families.has(key))families.set(key,[]);families.get(key).push(row);
        }
        if(cfg.automaticParameterDuplicates===true)for(const family of families.values())
            if(family.length>1&&family[0].accepted&&family.every(row=>row.value===family[0].value))
                for(const row of family.slice(0,-1))removed.set(row.index,'parameterDuplicates');
        // Reflist reports some unknown arguments in its native preview module.
        // Its empty-unknown branch stays outside this independent certificate.
        if(cfg.automaticEmptyParameters===true&&name!=='reflist')for(const row of rows)
            if(!removed.has(row.index)&&!row.accepted&&!/^\d+$/.test(row.key)&&
                /^[A-Za-z_][A-Za-z0-9_-]*$/.test(row.key)&&!row.value.trim()&&
                !v219EmptyParameterCollision(row,rows,profile))removed.set(row.index,'emptyInvalidParameters');
        if(!removed.size)return null;
        const text='{{'+parts.filter((part,index)=>!removed.has(index)).map(part=>part.text).join('|')+'}}';
        return {text,commonscat:name==='commonscat',rules:[...removed.values()],removed:[...removed.keys()],
            nativeOldid:profile.oldid,argumentAuthority:'exact pinned native interface; no key rename or value rewrite'};
    };

    // Opaque owners stay protected during ordinary passes. This final Source
    // transaction owns only pinned cosmetic drops or a native redirect header.
    const v219PinnedNativeParameterSource=(source,cfg={},bump=()=>{})=>{
        if(typeof source!=='string'||source.length>4194304||cfg.namespaceNumber!==0||
            cfg.sectionOnly||cfg.discussionPage||cfg.contentModel&&cfg.contentModel!=='wikitext'||
            !/\{\{/.test(source)||v24SyntaxScan(source).issues.length)return source;
        const protectedRanges=v219StageProtectedRanges(source,cfg,true),edits=[];
        for(const node of topNodes(scanProtectedView(source))){
            const raw=source.slice(node.start,node.end),call=v219PinnedNativeParameterCosmeticCall(raw,cfg),
                header=parsedTemplate(raw).parts[0],native=cfg.multilingual===true&&cfg.citations===true&&
                    v219OriginalTemplateHeaderAllowed(header)&&!v219CitationHeaderControlRefusal(raw)?
                    v219LocalCitationRedirectProfile(raw):null;
            let edit;
            if(call?.commonscat&&!/[{}<>\[\]\uE000-\uF8FF]/.test(raw.slice(2,-2)))
                edit={start:node.start,end:node.end,text:call.text,rules:call.rules};
            else if(native){
                const padding=/^([ \t]*)[\s\S]*?([ \t]*)$/.exec(header),text=padding[1]+native.target+padding[2];
                if(text!==header)edit={start:node.start+2,end:node.start+2+header.length,text,rules:['translatedTemplates']};
            }
            if(!edit||protectedRanges.some(range=>range.start<edit.end&&edit.start<range.end&&
                !(range.kind==='unknown-template-owner'&&range.start===node.start&&range.end===node.end)))continue;
            edits.push(edit);
        }
        for(const edit of edits)for(const id of edit.rules)bump(id);
        return v24SyntaxApply(source,edits);
    };

    // Only complete own-proved wrapper/chat Source contexts; no target input.
    const v219BankWrappedFooterSource=(source,cfg)=>{
        if(typeof source!=='string'||source.length>4194304)return null;
        const edits=v27WholeArticleWrapperEdits(source,cfg);
        if(edits.length!==1||edits[0].start!==0||edits[0].end!==source.length||
            typeof edits[0].text!=='string'||edits[0].text===source||
            JSON.stringify(v219StageSafeEdits(source,edits,'v27-whole-article-wrapper',cfg))!==JSON.stringify(edits))return null;
        let context=edits[0].text,prior=v219BankCollectorInventory(source,cfg,null),
            current=v219BankCollectorInventory(context,cfg,null);
        if(!Array.isArray(prior)||!Array.isArray(current)||JSON.stringify(prior)!==JSON.stringify(current))return null;
        const chat=v27ChatCopyPlan(context,cfg);
        if(chat.edits.length){
            if(!v27ChatCopyProof(context,chat.text,chat,cfg))return null;
            const next=v219BankCollectorInventory(chat.text,cfg,null);
            if(!Array.isArray(next)||JSON.stringify(current)!==JSON.stringify(next))return null;
            context=chat.text;
        }
        const topology=v219BankSourceTopologyPlan(context,cfg);
        return topology.steps.length===1&&topology.steps[0].name==='v219-bank-source-collector-order'&&
            v219BankSourceTopologyProof(context,topology.text,topology,cfg)?topology.text:null;
    };

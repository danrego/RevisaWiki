    // A contagem usa os componentes que diferem nos dois textos confirmados.
    // Tipos de ajuste e escolhas dependentes continuam sendo medidas distintas.
    const v211CountMemo=[];
    function v211CountUnits(source) {
        const view=protectedView(source),units=[],whole=[];
        const add=(kind,start,end,label,ownerStart=start,ownerEnd=end)=>{
            if(start>=end)return null;const value={kind,start,end,label,ownerStart,ownerEnd,key:kind+':'+ownerStart+':'+ownerEnd};units.push(value);return value;
        };
        for(const n of templates(view).nodes){
            const parts=parsedTemplate(source.slice(n.start,n.end)).parts;let at=n.start+2;
            whole.push({...n,kind:'template',label:'Predefinição'});
            parts.forEach((part,index)=>{
                const field=(kind,start,end,label,ownerStart=start,ownerEnd=end)=>{const unit=add(kind,start,end,label,ownerStart,ownerEnd);if(unit)Object.assign(unit,{templateStart:n.start,fieldIndex:index,fieldCount:parts.length});};
                if(!index)field('template-name',at,at+part.length,'Nome de predefinição');
                else {
                    const assignment=part.match(/^(\s*)([^={}<>\n]+?)(\s*)=([\s\S]*)$/);
                    if(assignment){
                        const nameStart=at+assignment[1].length,nameEnd=nameStart+assignment[2].length;
                        field('parameter-name',nameStart,nameEnd,'Nome de parâmetro');
                        field('parameter-value',at+part.indexOf('=')+1,at+part.length,'Valor de parâmetro');
                        field('parameter-layout',at-1,at+part.length,'Formatação de parâmetro',at-1,at+part.length);
                    }else field('positional-value',at-1,at+part.length,'Campo de predefinição');
                }
                at+=part.length+1;
            });
        }
        // Inclui a terminação fora dos colchetes na mesma ligação simplificada.
        for(const m of view.matchAll(/\[\[[^\n]*?\]\][\p{L}\p{M}]*|\[(?:https?:|\/\/)[^\]\n]*\]/gu)){
            add('link',m.index,m.index+m[0].length,/^\[\[(?:Categoria|Category)\s*:/i.test(m[0])?'Categoria':/^\[\[(?:Ficheiro|Imagem|File|Image|Arquivo)\s*:/i.test(m[0])?'Imagem':'Ligação');
        }
        const linkStack=[];
        for(let at=0;at<view.length-1;at++){
            const pair=view.slice(at,at+2);
            if(pair==='[['){linkStack.push(at);at++;}
            else if(pair===']]'&&linkStack.length){
                const start=linkStack.pop(),raw=view.slice(start,at+2);
                if(/^\[\[(?:Ficheiro|Imagem|File|Image|Arquivo)\s*:/i.test(raw)){
                    const parts=splitParts(raw.slice(2,-2));let cursor=start+2;
                    parts.forEach((part,i)=>{if(!i){const colon=part.indexOf(':');add('image-namespace',cursor,cursor+colon,'Espaço de nomes da imagem');add('image-file',cursor+colon+1,cursor+part.length,'Arquivo de imagem');}
                        else add('image-field',cursor-1,cursor+part.length,i===parts.length-1?'Legenda ou opção de imagem':'Opção de imagem');cursor+=part.length+1;});
                }
                at++;
            }
        }
        // Cada atributo é uma ocorrência, incluindo os espaços que o separam.
        const attributes=(text,start,kind)=>{
            for(const m of text.matchAll(/[ \t]+[A-Za-z][\w:-]*[ \t]*=[ \t]*(?:"[^"\n]*"|'[^'\n]*'|[^\s<>|]+)(?:[ \t]*\|[ \t]*)?/g)){
                let end=m.index+m[0].length;while(/[ \t]/.test(text[end]||'\n'))end++;
                const unit=add(kind,start+m.index,start+end,kind==='reference-attribute'?'Atributo de referência':kind==='table-attribute'?'Atributo de tabela':'Atributo HTML');if(unit)unit.fieldName=m[0].match(/^\s*([^\s=]+)/)[1].toLowerCase();
            }
        };
        const stack=[];
        for(let at=0;at<view.length;){
            const tag=tagAt(view,at);if(!tag){at++;continue;}
            const name=view.slice(at,tag.end).match(/^<\s*\/?\s*([\w-]+)/);
            if(name){const start=at+name.index+name[0].lastIndexOf(name[1]);add('tag-name',start,start+name[1].length,'Nome de etiqueta');}
            attributes(view.slice(at,tag.end),at,tag.name==='ref'?'reference-attribute':'html-attribute');
            add('tag-layout',at,tag.end,'Sintaxe de etiqueta');
            if(!tag.self&&!tag.close)stack.push(tag);
            else if(tag.close){const open=stack.at(-1);if(open?.name===tag.name){stack.pop();if(['i','em','b','strong','small','div','span','center'].includes(tag.name)){
                const pair={kind:'paired-markup',start:open.start,end:tag.end,label:'Marcação pareada',openEnd:open.end+(view[open.end]==='\n'?1:0),closeStart:tag.start-(view[tag.start-1]==='\n'?1:0)};whole.push(pair);
            }}}
            at=tag.end;
        }
        for(const m of view.matchAll(/('{2,3})(?!')([^\n]*?)\1(?!')/g))
            whole.push({kind:'paired-markup',start:m.index,end:m.index+m[0].length,openEnd:m.index+m[1].length,closeStart:m.index+m[0].length-m[1].length,label:'Marcação pareada'});
        for(const m of view.matchAll(/^[ \t]*[!|](?![}+\-])[^\n]*/gm))attributes(m[0],m.index,'table-attribute');
        for(const m of view.matchAll(/^(={1,6})[^\n]*\1[ \t]*$/gm))add('heading',m.index,m.index+m[0].length,'Título de seção');
        for(const m of view.matchAll(/^[ \t]*(?:\{\||\|\}|\|-|\|\+|!!|\|\|)[^\n]*/gm)){
            const marker=m[0].match(/^(\s*)(\{\||\|\}|\|-|\|\+|!!|\|\|)/);
            if(marker)add('table-marker',m.index,m.index+marker[0].length,'Marcador de tabela');
        }
        for(const m of view.matchAll(/[\p{L}\p{N}_]+|[ \t]+|\r?\n|\{\{|\}\}|\[\[|\]\]|'{2,3}|[^\p{L}\p{N}_\s]/gu))
            add(/^[\p{L}\p{N}_]+$/u.test(m[0])?'word':/^\s+$/.test(m[0])?'whitespace':'syntax-token',m.index,m.index+m[0].length,/^\s+$/.test(m[0])?'Espaçamento':'Sintaxe ou palavra');
        return {view,units,whole,refs:refTokens(view)};
    }
    function v211CountLookup(units) {
        const priority=u=>['link','image-namespace','image-file','reference-attribute','table-attribute','html-attribute'].includes(u.kind)?0:['parameter-value','positional-value'].includes(u.kind)?5:2;
        const structural=units.filter(u=>!['word','whitespace','syntax-token','parameter-layout','tag-layout'].includes(u.kind)).sort((a,b)=>a.end-a.start-(b.end-b.start)||priority(a)-priority(b));
        const layout=units.filter(u=>['parameter-layout','tag-layout'].includes(u.kind)).sort((a,b)=>a.end-a.start-(b.end-b.start));
        const lexical=units.filter(u=>['word','whitespace','syntax-token'].includes(u.kind));
        const a=v27AtomLookup(structural),b=v27AtomLookup(layout),c=v27AtomLookup(lexical);
        return (start,end)=>a(start,end)||b(start,end)||c(start,end);
    }
    function v211CountAnchor(position,edits,reverse=false,right=false) {
        let delta=0;
        for(const e of edits){const start=reverse?e.newStart:e.start,end=reverse?e.newEnd:e.end,toStart=reverse?e.start:e.newStart,toEnd=reverse?e.end:e.newEnd;
            if(position<start||position===start&&!right)return position+delta;
            if(position<=end)return position===end?toEnd:right?toEnd:toStart;
            delta=toEnd-end;
        }
        return position+delta;
    }
    function v211RetainedAdjustments(before,after,kinds=[]) {
        if(typeof before!=='string'||typeof after!=='string')return {count:null,exact:false,events:[],topics:[],text:'Comparação indisponível'};
        const memo=v211CountMemo.find(v=>v.before===before&&v.after===after&&v.kinds===kinds.join('|'));
        if(memo)return JSON.parse(JSON.stringify(memo.result));
        const topics=v27RetainedTypes(before,after,kinds).topics,sourceHash=v24SyntaxHash(before),outputHash=v24SyntaxHash(after);
        if(before===after)return {count:0,exact:true,events:[],topics,sourceHash,outputHash,text:'Nenhum ajuste mantido',unit:'retained-syntax-component'};
        const edits=v27RawDiff(before,after),old=v211CountUnits(before),fresh=v211CountUnits(after),oldLookup=v211CountLookup(old.units),newLookup=v211CountLookup(fresh.units),events=[],claimed=new Set(),unresolved=[];
        const touches=(start,end,a,b)=>start===end?start>=a&&start<=b:start<b&&end>a;
        const contained=(e,side,a,b)=>{const start=side==='old'?e.start:e.newStart,end=side==='old'?e.end:e.newEnd;return start>=a&&end<=b&&(start<end||start>a&&start<b);};
        const indices=(side,a,b)=>edits.map((e,i)=>contained(e,side,a,b)?i:-1).filter(i=>i>=0);
        const spacedIndices=(side,scan,n)=>{let a=n.start,b=n.end;while(a>0&&/\s/.test(scan[a-1]))a--;while(b<scan.length&&/\s/.test(scan[b]))b++;return indices(side,a,b);};
        const emit=(kind,label,indexes,oldRanges=[],newRanges=[])=>{
            const ids=indexes.filter(i=>!claimed.has(i));if(!ids.length)return;
            ids.forEach(i=>claimed.add(i));
            const ranges=ids.map(i=>edits[i]),start=Math.min(...ranges.map(e=>e.start)),end=Math.max(...ranges.map(e=>e.end)),newStart=Math.min(...ranges.map(e=>e.newStart)),newEnd=Math.max(...ranges.map(e=>e.newEnd));
            events.push({id:sourceHash+':'+kind+':'+start+':'+end,rule:'retained-'+kind,kind,label,sourceHash,outputHash,sourceAnchors:oldRanges.length?oldRanges:[{start,end}],outputAnchors:newRanges.length?newRanges:[{start:newStart,end:newEnd}],before:before.slice(start,end),after:after.slice(newStart,newEnd),fragments:ids.map(i=>({...edits[i]}))});
        };
        const component=(kind,label,a,b,c,d)=>{
            const left=before.slice(a,b),right=after.slice(c,d);if(left===right)return;
            events.push({id:sourceHash+':'+kind+':'+a+':'+b,rule:'retained-'+kind,kind,label,sourceHash,outputHash,sourceAnchors:[{start:a,end:b}],outputAnchors:[{start:c,end:d}],before:left,after:right,fragments:v27RawDiff(left,right).map(e=>({...e,start:e.start+a,end:e.end+a,newStart:e.newStart+c,newEnd:e.newEnd+c}))});
        };
        // Confirma uma movimentação simples retirando o mesmo objeto dos dois
        // textos. O restante precisa ser idêntico, incluindo todos os dados.
        const removalVariants=(text,n)=>{const options=[];for(const left of [0,1])for(const right of [0,1]){
            const a=n.start-(left&&text[n.start-1]==='\n'?1:0),b=n.end+(right&&text[n.end]==='\n'?1:0);options.push({start:a,end:b,remainder:text.slice(0,a)+text.slice(b)});
        }return options;};
        const movable=scan=>[...scan.whole.filter(n=>n.kind==='template'&&n.depth===0),...scan.units.filter(n=>n.kind==='link'&&n.label==='Categoria')];
        const oldObjects=movable(old),newObjects=movable(fresh),objectMap=(items,text)=>{const map=new Map();for(const n of items){const raw=text.slice(n.start,n.end);if(!map.has(raw))map.set(raw,[]);map.get(raw).push(n);}return map;};
        const oldObjectMap=objectMap(oldObjects,before),newObjectMap=objectMap(newObjects,after),pendingMoves=[];let moveProofs=0;
        for(const n of oldObjects){
            const raw=before.slice(n.start,n.end),oldMatches=oldObjectMap.get(raw),newMatches=newObjectMap.get(raw);if(oldMatches.length!==1||newMatches?.length!==1)continue;
            const target=newMatches[0],start=target.start;if(start===n.start)continue;
            if(before.length===after.length&&edits.length<=64&&before.length+after.length<=1000000&&moveProofs++<32){
                const left=removalVariants(before,n),right=removalVariants(after,target),match=left.find(a=>right.some(b=>a.remainder===b.remainder));
                if(match){emit('structural-relocation',n.label==='Categoria'?'Posição de categoria':'Posição de predefinição',edits.map((_,i)=>i),[{start:n.start,end:n.end}],[target]);break;}
            }
            if(start===v211CountAnchor(n.start,edits)||start===v211CountAnchor(n.start,edits,false,true))continue;
            pendingMoves.push({old:n,fresh:target});
        }
        for(const r of old.refs){
            const same=fresh.refs.filter(n=>n.raw===r.raw);if(same.length!==1)continue;const target=same[0],punctuation=before[r.end];
            if(!/[.,;:!?]/.test(punctuation||'')||after[target.start-1]!==punctuation)continue;
            const ids=edits.map((e,i)=>e.before===punctuation&&!e.after&&e.start===r.end||!e.before&&e.after===punctuation&&e.newStart===target.start-1?i:-1).filter(i=>i>=0);
            if(ids.length===2)emit('reference-punctuation','Pontuação junto à referência',ids);
        }
        // A definição transferida à primeira chamada conserva a identidade do
        // corpo. Conta-se a transferência e cada correção que nele permaneceu.
        const refKey=r=>{const a=attrsOf(r.attrs);return a?.name?JSON.stringify([a.group||'',decodedReferenceName(a.name)]):null;};
        const moved=new Set();
        for(const r of old.refs.filter(r=>r.body!==null&&refKey(r))){
            const key=refKey(r),targets=fresh.refs.filter(n=>n.body!==null&&refKey(n)===key),origins=old.refs.filter(n=>n.body!==null&&refKey(n)===key);
            if(targets.length!==1||origins.length!==1)continue;const target=targets[0];
            const call=old.refs.find(n=>n.body===null&&refKey(n)===key&&v211CountAnchor(n.start,edits)===target.start);
            if(!call||v211CountAnchor(r.start,edits)===target.start)continue;
            const ids=edits.map((e,i)=>(touches(e.start,e.end,r.start,r.end)||touches(e.start,e.end,call.start,call.end)||touches(e.newStart,e.newEnd,target.start,target.end))?i:-1).filter(i=>i>=0);
            if(!ids.length)continue;
            const inner=v211RetainedAdjustments(r.body,target.body);
            if(!inner.exact)continue;
            emit('reference-relocation','Definição transferida à primeira chamada',ids,[{start:r.start,end:r.end},{start:call.start,end:call.end}],[{start:target.start,end:target.end}]);moved.add(r);
            for(const child of inner.events){
                const mapRanges=(ranges,offset)=>ranges.map(q=>({start:q.start+offset,end:q.end+offset}));
                events.push({...child,id:sourceHash+':reference-body:'+r.start+':'+child.id,sourceHash,outputHash,sourceAnchors:mapRanges(child.sourceAnchors,r.openEnd),outputAnchors:mapRanges(child.outputAnchors,target.openEnd),logicalBody:{sourceStart:r.openEnd,outputStart:target.openEnd,sourceHash:inner.sourceHash,outputHash:inner.outputHash},fragments:child.fragments.map(e=>({...e,start:e.start+r.openEnd,end:e.end+r.openEnd,newStart:e.newStart+target.openEnd,newEnd:e.newEnd+target.openEnd}))});
            }
        }
        // Uma referência completa substituída pela chamada não conserva os ajustes
        // que poderiam ter sido feitos somente no corpo descartado.
        for(const r of old.refs.filter(r=>r.body!==null&&!moved.has(r))){
            const start=v211CountAnchor(r.start,edits),end=v211CountAnchor(r.end,edits,false,true);
            const target=fresh.refs.find(n=>n.body===null&&n.start===start&&n.end===end);
            if(target)emit('reference-reuse','Reutilização de referência',indices('old',r.start,r.end),[{start:r.start,end:r.end}],[{start:target.start,end:target.end}]);
        }
        for(const move of pendingMoves){const ids=[...indices('old',move.old.start,move.old.end),...indices('new',move.fresh.start,move.fresh.end)].filter(i=>!claimed.has(i));if(ids.length)unresolved.push(ids[0]);}
        const portalNodes=(scan,text)=>scan.whole.filter(n=>n.kind==='template'&&['portal','portal3'].includes(parsedTemplate(text.slice(n.start,n.end)).name));
        const oldPortals=portalNodes(old,before),newPortals=portalNodes(fresh,after);
        if(oldPortals.length===1&&newPortals.length===1){const a=oldPortals[0],b=newPortals[0];if(before.slice(a.start,a.end)!==after.slice(b.start,b.end)&&b.start!==v211CountAnchor(a.start,edits)&&b.start!==v211CountAnchor(a.start,edits,false,true)){
            const ids=[...spacedIndices('old',before,a),...spacedIndices('new',after,b)].filter(i=>!claimed.has(i));if(ids.length)unresolved.push(ids[0]);
        }}
        // Inclusões e remoções de campos contíguos não se tornam uma única
        // correção por estarem coladas à alteração do nome do modelo.
        for(const n of old.whole.filter(n=>n.kind==='template')){
            const start=v211CountAnchor(n.start,edits),end=v211CountAnchor(n.end,edits,false,true),target=fresh.whole.find(q=>q.kind==='template'&&q.start===start&&q.end===end);
            if(!target)continue;const left=parsedTemplate(before.slice(n.start,n.end)).parts,right=parsedTemplate(after.slice(target.start,target.end)).parts;
            if(left.length===right.length)continue;const common=Math.min(left.length,right.length);
            if(!left.slice(1,common).every((value,i)=>value===right[i+1]))continue;
            const ids=[...new Set([...indices('old',n.start,n.end),...indices('new',target.start,target.end)])];if(!ids.length||ids.some(i=>claimed.has(i)))continue;
            ids.forEach(i=>claimed.add(i));
            component('template-name','Nome de predefinição',n.start+2,n.start+2+left[0].length,target.start+2,target.start+2+right[0].length);
            let oldAt=n.start+2+left[0].length,newAt=target.start+2+right[0].length;
            for(let i=1;i<Math.max(left.length,right.length);i++){
                if(i<common){oldAt+=left[i].length+1;newAt+=right[i].length+1;continue;}
                const a=i<left.length?oldAt:n.end-2,b=i<left.length?oldAt+left[i].length+1:a,c=i<right.length?newAt:target.end-2,d=i<right.length?newAt+right[i].length+1:c;
                component('parameter-field',i<left.length?'Retirada de campo':'Inclusão de campo',a,b,c,d);if(i<left.length)oldAt=b;if(i<right.length)newAt=d;
            }
        }
        for(const n of fresh.whole.filter(n=>n.kind==='template')){
            const raw=after.slice(n.start,n.end),p=parsedTemplate(raw);if(!['portal','portal3'].includes(p.name))continue;
            const ids=spacedIndices('new',after,n);if(ids.length!==1||claimed.has(ids[0]))continue;const edit=edits[ids[0]];
            if(edit.before.trim()||edit.after.trim()!==raw.trim())continue;
            const fields=p.parts.slice(1).filter(part=>part.trim());if(!fields.length)continue;
            claimed.add(ids[0]);let cursor=n.start+2+p.parts[0].length;
            fields.forEach((part,index)=>{const start=index?cursor:edit.newStart,end=index===fields.length-1?edit.newEnd:cursor+part.length+1;const label=part.replace(/^\s*\d+\s*=\s*/,'').trim();
                const oldStart=index?edit.end:edit.start,oldEnd=edit.end,oldBytes=index?'':edit.before;
                events.push({id:sourceHash+':portal-slot:'+edit.start+':'+index,rule:'retained-portal-slot',kind:'portal-slot',label:'Portal: '+label,sourceHash,outputHash,sourceAnchors:[{start:oldStart,end:oldEnd}],outputAnchors:[{start,end}],before:oldBytes,after:after.slice(start,end),fragments:[{start:oldStart,end:oldEnd,newStart:start,newEnd:end,before:oldBytes,after:after.slice(start,end),precise:true}],logicalObject:{kind:'portal-template',start:n.start,end:n.end}});cursor+=part.length+1;
            });
        }
        // Um modelo inteiro inserido ou retirado constitui uma operação. Campos
        // que continuam presentes são contados separadamente abaixo.
        for(const [side,scan,other]of [['old',old,fresh],['new',fresh,old]])for(const n of scan.whole.filter(n=>n.kind==='template').sort((a,b)=>b.end-b.start-(a.end-a.start))){
            const ids=spacedIndices(side,side==='old'?before:after,n);if(!ids.length||ids.some(i=>claimed.has(i)))continue;
            const reverse=side==='new',a=v211CountAnchor(n.start,edits,reverse),b=v211CountAnchor(n.end,edits,reverse,true);
            if(side==='new'&&a!==b&&!other.whole.some(q=>q.kind==='template'&&q.start<b&&q.end>a)){
                emit('template-conversion','Conversão para predefinição',ids,[{start:a,end:b}],[{start:n.start,end:n.end}]);continue;
            }
            if(a!==b)continue;
            const entire=side==='old'?before.slice(n.start,n.end):after.slice(n.start,n.end),changed=ids.map(i=>side==='old'?edits[i].before:edits[i].after).join('');
            if(changed.trim()!==entire.trim())continue;
            emit(side==='old'?'template-removal':'template-insertion',side==='old'?'Retirada de predefinição':'Inclusão de predefinição',ids,side==='old'?[{start:n.start,end:n.end}]:[{start:a,end:b}],side==='new'?[{start:n.start,end:n.end}]:[{start:a,end:b}]);
        }
        // Os dois delimitadores de uma única conversão ou inclusão de marcação
        // pertencem à mesma ocorrência, mantendo ajustes internos independentes.
        for(const [side,scan]of [['old',old],['new',fresh]])for(const p of scan.whole.filter(p=>p.kind==='paired-markup')){
            const opening=indices(side,p.start,p.openEnd),closing=indices(side,p.closeStart,p.end),ids=[...opening,...closing].filter(i=>!claimed.has(i));
            if(!opening.length||!closing.length||ids.length!==opening.length+closing.length)continue;
            const reverse=side==='new',start=v211CountAnchor(p.start,edits,reverse),end=v211CountAnchor(p.end,edits,reverse,true);
            const other=reverse?before:after,inner=(side==='old'?before:after).slice(p.openEnd,p.closeStart);
            const otherScan=side==='old'?fresh:old,paired=otherScan.whole.some(q=>q.kind==='paired-markup'&&q.start===start&&q.end===end),removed=opening.every(i=>(side==='old'?edits[i].after:edits[i].before)==='')&&closing.every(i=>(side==='old'?edits[i].after:edits[i].before)==='');
            if(!paired&&!removed&&(!inner.trim()||!other.slice(start,end).includes(inner.trim())))continue;
            emit('paired-markup',p.label,ids,side==='old'?[{start:p.start,end:p.openEnd},{start:p.closeStart,end:p.end}]:[],side==='new'?[{start:p.start,end:p.openEnd},{start:p.closeStart,end:p.end}]:[]);
        }
        const groups=new Map(),parent=new Map();
        const find=k=>{if(!parent.has(k))parent.set(k,k);let p=parent.get(k);if(p!==k){p=find(p);parent.set(k,p);}return p;};
        const union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(b,a);};
        // O valor de um campo continua sendo a mesma ocorrência quando uma
        // data perde um sufixo numérico e recebe um prefixo por extenso.
        const freshTemplates=new Map(fresh.whole.filter(n=>n.kind==='template').map(n=>[n.start+':'+n.end,n])),freshFields=new Map();
        for(const u of fresh.units)if(u.templateStart!==undefined)freshFields.set(u.templateStart+':'+u.fieldIndex+':'+u.fieldCount+':'+u.kind,u);
        const templateMatches=new Map();
        for(const n of old.whole.filter(n=>n.kind==='template')){const start=v211CountAnchor(n.start,edits),end=v211CountAnchor(n.end,edits,false,true),target=freshTemplates.get(start+':'+end);if(target)templateMatches.set(n.start,target.start);}
        for(const u of old.units)if(u.templateStart!==undefined&&templateMatches.has(u.templateStart)){
            const target=freshFields.get(templateMatches.get(u.templateStart)+':'+u.fieldIndex+':'+u.fieldCount+':'+u.kind);if(target)union('old:'+u.key,'new:'+target.key);
        }
        for(let i=0;i<edits.length;i++){
            if(claimed.has(i))continue;const e=edits[i];if(e.precise===false){unresolved.push(i);continue;}
            let a=oldLookup(e.start,e.end),b=newLookup(e.newStart,e.newEnd);
            // Uma chave e seu valor têm contratos separados mesmo se o diff
            // lexical tiver unido a alteração junto do sinal de igualdade.
            if(a?.kind==='parameter-layout'&&b?.kind==='parameter-layout'){
                const aa=before.slice(a.start,a.end),bb=after.slice(b.start,b.end),am=aa.match(/^\|\s*([^=]+?)\s*=([\s\S]*)$/),bm=bb.match(/^\|\s*([^=]+?)\s*=([\s\S]*)$/);
                if(am&&bm&&am[1].trim()!==bm[1].trim()&&am[2].trim()!==bm[2].trim()){unresolved.push(i);continue;}
            }
            if(!a&&!b){unresolved.push(i);continue;}
            const templateComponent=u=>u&&['template-name','parameter-name','parameter-value','parameter-layout','positional-value'].includes(u.kind);
            if(templateComponent(a)&&e.after.includes('|')&&!b||templateComponent(b)&&e.before.includes('|')&&!a){unresolved.push(i);continue;}
            if(a?.fieldName&&b?.fieldName&&a.fieldName!==b.fieldName){
                if(!e.before)a=null;else if(!e.after)b=null;else{unresolved.push(i);continue;}
            }
            // Uma inserção junto ao limite de outro campo pertence à unidade
            // inserida, não ao campo inalterado que a precede.
            if(!a&&b?.kind==='link'&&!e.before)a=old.units.find(u=>u.kind==='link'&&u.end===e.start);
            if(!e.before&&b&&a?.kind!==b.kind)a=null;if(!e.after&&a&&a.kind!==b?.kind)b=null;
            const ak=a?'old:'+a.key:null,bk=b?'new:'+b.key:null;
            if(ak)find(ak);if(bk)find(bk);
            if(ak&&bk)union(ak,bk);
            groups.set(i,{key:ak||bk,a,b});
        }
        const retained=new Map();for(const [i,value]of groups){const key=find(value.key);if(!retained.has(key))retained.set(key,{ids:[],units:[]});retained.get(key).ids.push(i);retained.get(key).units.push(value.a||value.b);}
        for(const value of retained.values()){
            const unit=value.units.find(u=>!['word','whitespace','syntax-token','parameter-layout','tag-layout'].includes(u.kind))||value.units[0];
            emit(unit.kind,unit.label,value.ids);
        }
        events.sort((a,b)=>a.sourceAnchors[0].start-b.sourceAnchors[0].start||a.outputAnchors[0].start-b.outputAnchors[0].start||a.kind.localeCompare(b.kind));
        const seen=new Map();events.forEach(e=>{const n=seen.get(e.id)||0;seen.set(e.id,n+1);if(n)e.id+=':'+n;});
        const exact=!unresolved.length&&claimed.size===edits.length&&edits.every(e=>e.precise!==false),count=exact?events.length:null;
        const result={count,exact,events,topics,sourceHash,outputHash,unit:'retained-syntax-component',coveredFragments:claimed.size,totalFragments:edits.length,unresolvedFragments:unresolved.length,unresolved:unresolved.map(i=>({...edits[i]})),text:exact?count+' ajuste'+(count===1?'':'s')+' aplicado'+(count===1?'':'s'):'Ajustes aplicados, confira a comparação'};
        if(before.length+after.length<2000000){v211CountMemo.unshift({before,after,kinds:kinds.join('|'),result});while(v211CountMemo.length>2)v211CountMemo.pop();}
        return JSON.parse(JSON.stringify(result));
    }

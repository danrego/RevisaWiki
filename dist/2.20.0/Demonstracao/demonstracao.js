'use strict';
(async function(){
    const $=id=>document.getElementById(id),family=$('family'),example=$('example'),source=$('source'),run=$('run'),status=$('status');
    let book,selected,engineSource=null,workerAdapter=null,workerURL=null,worker=null,timer=null,sequence=0,active=null;
    function stop(){clearTimeout(timer);timer=null;if(worker)worker.terminate();worker=null;if(workerURL)URL.revokeObjectURL(workerURL);workerURL=null;active=null;}
    function reset(){stop();sequence++;source.value=selected.source;$('after').textContent='';$('diff-code').replaceChildren();$('result').hidden=true;$('difference').hidden=true;$('difference').textContent='Mostrar alterações';$('diff').hidden=true;$('difference').setAttribute('aria-expanded','false');run.disabled=false;run.textContent='Testar correção';status.textContent='O exemplo está pronto para testar.';}
    function show(){selected=book.examples.find(item=>item.id===example.value);$('example-title').textContent=selected.title;$('explanation').textContent=selected.explanation;$('behavior').textContent=selected.source===selected.expected?'Preserva o texto':'Corrige automaticamente';$('behavior').className='badge'+(selected.source===selected.expected?' preserve':'');reset();}
    function chooseFamily(){example.replaceChildren();for(const item of book.examples.filter(item=>item.family===family.value)){const option=document.createElement('option');option.value=item.id;option.textContent=item.title;example.append(option);}show();}
    function difference(before,after){const a=before.split('\n'),b=after.split('\n'),rows=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)rows[i][j]=a[i]===b[j]?rows[i+1][j+1]+1:Math.max(rows[i+1][j],rows[i][j+1]);const lines=[];let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){lines.push(['', '  '+a[i]]);i++;j++;}else if(j<b.length&&(i===a.length||rows[i][j+1]>=rows[i+1][j])){lines.push(['added','+ '+b[j++]]);}else lines.push(['removed','− '+a[i++]]);}const fragment=document.createDocumentFragment();for(const [kind,text]of lines){const line=document.createElement('span');line.className=kind;line.textContent=text||' ';fragment.append(line);}$('diff-code').replaceChildren(fragment);}
    run.addEventListener('click',()=>{
        if(active)return;run.disabled=true;run.textContent='Revisando…';status.textContent='O motor está analisando o exemplo.';
        const snapshot=source.value,id=++sequence;active={id,source:snapshot};
        function fail(message){if(!active||active.id!==id)return;stop();run.disabled=false;run.textContent='Testar correção';status.textContent=message;}
        try{
            if(engineSource!==null){workerURL=URL.createObjectURL(new Blob([engineSource,'\n',workerAdapter],{type:'text/javascript'}));worker=new Worker(workerURL);}else worker=new Worker('motor.js');
            timer=setTimeout(()=>fail('A análise atingiu 60 segundos. O exemplo foi preservado e você pode tentar novamente ou escolher outro.'),60000);
            worker.addEventListener('error',()=>fail('Não foi possível carregar o motor. Abra esta página pelo índice servido em um endereço HTTP e tente novamente.'));
            worker.addEventListener('message',event=>{
                const response=event.data;if(!active||active.id!==id||response.id!==id)return;
                if(response.type==='error'){fail('A análise não terminou. O exemplo foi preservado.');return;}
                if(response.type!=='result')return;
                const result=response.result;if(source.value!==snapshot||typeof result?.text!=='string'){fail('O exemplo mudou durante a análise. Selecione-o novamente para testar.');return;}
                if(result.text!==selected.expected||result.preservation?.length){fail('Este exemplo precisa ser conferido nesta versão. Nenhum resultado foi aplicado.');return;}
                stop();$('after').textContent=result.text;$('result').hidden=false;$('difference').hidden=result.text===snapshot;difference(snapshot,result.text);run.textContent='Exemplo revisado';status.textContent=result.text===snapshot?'O texto ficou intacto, como previsto para este exemplo.':'Correção concluída. Confira o resultado ou abra a comparação.';
            });
            worker.postMessage({type:'calculate',id,job:{kind:selected.operation==='talkHeader'?'talk-example':'adjust',articleSource:selected.articleSource||'',source:snapshot,originalSource:snapshot,options:selected.options}});
        }catch(_){fail('O navegador não conseguiu iniciar a demonstração. O exemplo foi preservado.');}
    });
    $('restore').addEventListener('click',reset);example.addEventListener('change',show);family.addEventListener('change',chooseFamily);$('difference').addEventListener('click',()=>{const expanded=$('diff').hidden;$('diff').hidden=!expanded;$('difference').setAttribute('aria-expanded',String(expanded));$('difference').textContent=expanded?'Ocultar alterações':'Mostrar alterações';});
    window.addEventListener('pagehide',stop);
    try{
        const embedded=document.getElementById('demo-book');let raw;
        if(embedded){
            book=JSON.parse(embedded.textContent);const encoded=JSON.parse(document.getElementById('demo-engine').textContent),bytes=Uint8Array.from(atob(encoded),letter=>letter.charCodeAt(0));raw=bytes.buffer;engineSource=new TextDecoder().decode(bytes);workerAdapter=JSON.parse(document.getElementById('demo-worker').textContent);
        }else{
            const response=await fetch('exemplos.json',{cache:'no-store'});if(!response.ok)throw Error('examples');book=await response.json();const engine=await fetch('../RevisaWiki_v2_20_0_completo.js',{cache:'no-store'});if(!engine.ok)throw Error('engine');raw=await engine.arrayBuffer();
        }
        if(book.version!=='2.20.0'||!Array.isArray(book.examples)||!book.examples.length)throw Error('version');
        const digest=await crypto.subtle.digest('SHA-256',raw),hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==book.engineSha256)throw Error('engine-version');$('version').textContent=book.version;
        for(const name of new Set(book.examples.map(item=>item.family))){const option=document.createElement('option');option.value=option.textContent=name;family.append(option);}chooseFamily();
    }catch(_){status.textContent='Não foi possível abrir os exemplos. Abra a demonstração pelo índice HTTP e recarregue a página.';}
}());

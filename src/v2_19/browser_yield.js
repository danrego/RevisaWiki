    // A self-message uses the native posted-message task source. It remains a
    // macrotask yield when MessageChannel is absent, without a background timer.
    let v219PostMessageSequence=0;
    function v219PostMessagePause() {
        let origin,token,resolve,listener,pending,listening=false;
        try {
            if(root.window!==root||typeof root.postMessage!=='function'||
                typeof root.addEventListener!=='function'||typeof root.removeEventListener!=='function')return null;
            origin=root.location?.origin;
            if(typeof origin!=='string'||!/^https?:\/\//.test(origin))return null;
            const random=typeof root.crypto?.randomUUID==='function'?root.crypto.randomUUID():
                Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);
            token='RevisaWiki.pause.v219:'+random+':'+(++v219PostMessageSequence);
            pending=new Promise(done=>{resolve=done;});
            listener=event=>{
                if(event.source!==root||event.origin!==origin||event.data!==token)return;
                root.removeEventListener('message',listener,false);listening=false;resolve();
            };
            root.addEventListener('message',listener,false);listening=true;
            root.postMessage(token,origin);
            return pending;
        } catch (_) {
            if(listening)try{root.removeEventListener('message',listener,false);}catch(_){}
            return null;
        }
    }

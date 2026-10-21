    const v219UIObjectIds=new WeakMap(),v219UIPrimitiveIds=new Map();
    let v219UIIdentity=0;
    function v219UIContextKey(value) {
        const context=v219UIContext(value);if(!context)return 'null';
        const id=context.editor,map=typeof id==='object'||typeof id==='function'?v219UIObjectIds:v219UIPrimitiveIds;
        if(!map.has(id))map.set(id,++v219UIIdentity);
        return JSON.stringify({...context,editor:map.get(id)});
    }

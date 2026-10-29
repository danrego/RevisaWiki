    // These observers add no edits. A known formatting plan may change an
    // owner, but it cannot silently replace a literal identity or cell value.
    function v2214PlainIdentityValue(value) {
        return typeof value==='string'&&value.trim()!==''&&
            !/[{}\[\]<>|&\u0000-\u001F\u007F-\u009F\uE000-\uF8FF]/.test(value.trim());
    }
    function v2214InfoboxIdentityRead(source) {
        const out=[],parsed=templates(protectedView(source));
        for(const node of parsed.nodes){
            const raw=source.slice(node.start,node.end),p=parsedTemplate(raw),profile=INFOBOX_CATALOG[p.name],
                contract=profile&&v2151FieldSyntaxContract(profile),fields=profile&&v2151FieldSyntaxParts(raw),
                keys=contract?.groups.find(group=>group.kind==='name')?.keys;
            if(!profile||!keys||!fields||!v215LiteralTemplateIdentity(raw,profile))continue;
            const values=fields.filter(field=>keys.has(field.key)&&profileAccepts(profile,field.key));
            out.push({profile:profile.oldid,values:values.map(field=>({key:field.key,value:field.value,
                plain:v2214PlainIdentityValue(field.value),start:node.start+field.start}))});
        }
        return out;
    }
    function v2214LiteralValueAudit(before,after,options={}) {
        if(typeof before!=='string'||typeof after!=='string'||before===after||before.length>4194304||after.length>4194304)return [];
        const cfg=pageContextOptions({...DEFAULTS,...options}),findings=[];
        if(cfg.contentModel&&cfg.contentModel!=='wikitext'||v20DefinitionContext(cfg))return findings;
        if(/info\//i.test(before)){
            const original=v2214InfoboxIdentityRead(before),actual=v2214InfoboxIdentityRead(after);
            if(original.length===actual.length)for(let index=0;index<original.length;index++){
                const owner=original[index],target=actual[index];if(owner.profile!==target.profile)continue;
                for(const field of owner.values){
                    if(!field.plain||owner.values.filter(row=>row.key===field.key).length!==1)continue;
                    const current=target.values.filter(row=>row.key===field.key);
                    if(current.length===1&&v24InventorySpace(field.value)!==v24InventorySpace(current[0].value))
                        findings.push({code:'changed-literal-infobox-identity',message:'Um campo de identidade da infocaixa mudou sem uma equivalência confirmada.',start:field.start,severity:'warning'});
                }
            }
        }
        if(before.includes('{|')&&after.includes('{|')){
            const finite=v210TableRepairPlan(before,cfg),expected=finite.text!==before&&
                v210TableRepairProof(before,finite.text,finite,cfg)?finite.text:before,
                original=v272TableInventories(expected,cfg).map(value=>JSON.parse(value)),
                actual=v272TableInventories(after,cfg).map(value=>JSON.parse(value));
            if(original.length===actual.length)for(let index=0;index<original.length;index++){
                const rows=original[index][2],next=actual[index][2];
                if(rows.length!==next.length||rows.some((row,i)=>row[1].length!==next[i][1].length))continue;
                for(let row=0;row<rows.length;row++)for(let cell=0;cell<rows[row][1].length;cell++){
                    const expected=rows[row][1][cell][2],current=next[row][1][cell][2];
                    if(v2214PlainIdentityValue(expected)&&expected!==current)
                        findings.push({code:'changed-literal-table-value',message:'O valor de uma célula mudou sem uma equivalência confirmada.',start:-1,severity:'warning'});
                }
            }
        }
        return findings;
    }
    function preservationAudit(before,after,options={}) {
        const expected=before===after?before:v221RepairPlan(before,options).text;
        return [...v221BaselinePreservationAudit(expected,after,options),...v2214LiteralValueAudit(expected,after,options),
            ...v2214ReferenceActivationAudit(before,after,options)];
    }

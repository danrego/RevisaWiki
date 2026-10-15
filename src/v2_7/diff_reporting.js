    // Bounded sequence alignment keeps unchanged lines out of the comparison.
    // Existing field expansion and dependency transactions remain authoritative.
    const v27DiffMemo=[];
    let v27DiffMemoBytes=0;
    function v27SequenceMatches(a,b,cellLimit) {
        const pairs=[],uncertain=[],budget={remaining:8000000},maximumDistance=512;
        function small(a0,a1,b0,b1){
            const n=a1-a0,m=b1-b0,width=m+1,table=new Uint32Array((n+1)*width);
            for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)table[i*width+j]=a[a0+i]===b[b0+j]?1+table[(i+1)*width+j+1]:Math.max(table[(i+1)*width+j],table[i*width+j+1]);
            let i=0,j=0;while(i<n&&j<m){if(a[a0+i]===b[b0+j])pairs.push([a0+i++,b0+j++]);else if(table[(i+1)*width+j]>=table[i*width+j+1])i++;else j++;}
        }
        function myers(a0,a1,b0,b1){
            const n=a1-a0,m=b1-b0,limit=Math.min(n+m,maximumDistance),offset=limit+1,v=new Int32Array(2*limit+3),trace=[];v.fill(-1);v[offset+1]=0;
            for(let d=0;d<=limit;d++){
                budget.remaining-=2*d+1;if(budget.remaining<0)return null;
                trace.push(v.slice());
                for(let k=-d;k<=d;k+=2){
                    let x=k===-d||k!==d&&v[offset+k-1]<v[offset+k+1]?v[offset+k+1]:v[offset+k-1]+1,y=x-k;
                    while(x<n&&y<m&&a[a0+x]===b[b0+y]){x++;y++;if(--budget.remaining<0)return null;}
                    v[offset+k]=x;
                    if(x>=n&&y>=m){
                        const found=[];let xx=n,yy=m;
                        for(let step=d;step>=0;step--){const prior=trace[step],kk=xx-yy,previous=kk===-step||kk!==step&&prior[offset+kk-1]<prior[offset+kk+1]?kk+1:kk-1,px=prior[offset+previous],py=px-previous;
                            while(xx>px&&yy>py){found.push([a0+--xx,b0+--yy]);}
                            if(step){xx=px;yy=py;}
                        }
                        return found.reverse();
                    }
                }
            }
            return null;
        }
        function anchors(a0,a1,b0,b1){
            const left=new Map(),right=new Map();
            for(let i=a0;i<a1;i++)left.set(a[i],left.has(a[i])?-1:i);
            for(let i=b0;i<b1;i++)right.set(b[i],right.has(b[i])?-1:i);
            const candidates=[];for(const[value,i]of left){const j=right.get(value);if(i>=0&&j!==undefined&&j>=0)candidates.push([i,j]);}
            const tails=[],indexes=[],previous=new Int32Array(candidates.length);previous.fill(-1);
            for(let i=0;i<candidates.length;i++){const position=candidates[i][1];let low=0,high=tails.length;while(low<high){const middle=(low+high)>>>1;if(tails[middle]<position)low=middle+1;else high=middle;}if(low)previous[i]=indexes[low-1];tails[low]=position;indexes[low]=i;}
            const found=[];for(let i=indexes[tails.length-1];i!==undefined&&i>=0;i=previous[i])found.push(candidates[i]);return found.reverse();
        }
        function range(a0,a1,b0,b1,depth){
            while(a0<a1&&b0<b1&&a[a0]===b[b0])pairs.push([a0++,b0++]);
            let suffix=0;while(a1-suffix>a0&&b1-suffix>b0&&a[a1-suffix-1]===b[b1-suffix-1])suffix++;
            const ae=a1-suffix,be=b1-suffix,n=ae-a0,m=be-b0;
            if(n&&m){const cells=(n+1)*(m+1);budget.remaining-=n+m;
                if(cells<=cellLimit&&cells<=budget.remaining){budget.remaining-=cells;small(a0,ae,b0,be);}
                else if(depth<32&&budget.remaining>0){const fixed=anchors(a0,ae,b0,be);if(fixed.length){let x=a0,y=b0;for(const[i,j]of fixed){range(x,i,y,j,depth+1);pairs.push([i,j]);x=i+1;y=j+1;}range(x,ae,y,be,depth+1);}else{const found=myers(a0,ae,b0,be);if(found)for(const pair of found)pairs.push(pair);else uncertain.push({a0,a1:ae,b0,b1:be});}}
                else uncertain.push({a0,a1:ae,b0,b1:be});
            }
            for(let i=0;i<suffix;i++)pairs.push([ae+i,be+i]);
        }
        range(0,a.length,0,b.length,0);return {pairs,uncertain};
    }
    function v27TrimDifference(before,after,start,end,newStart,newEnd) {
        const high=c=>c>=0xD800&&c<=0xDBFF,low=c=>c>=0xDC00&&c<=0xDFFF;
        while(start<end&&newStart<newEnd&&before[start]===after[newStart]){start++;newStart++;}
        if(start&&newStart&&((high(before.charCodeAt(start-1))&&low(before.charCodeAt(start)))||(high(after.charCodeAt(newStart-1))&&low(after.charCodeAt(newStart))))){start--;newStart--;}
        while(end>start&&newEnd>newStart&&before[end-1]===after[newEnd-1]){end--;newEnd--;}
        if((low(before.charCodeAt(end))&&high(before.charCodeAt(end-1)))||(low(after.charCodeAt(newEnd))&&high(after.charCodeAt(newEnd-1)))){end++;newEnd++;}
        return {start,end,newStart,newEnd,before:before.slice(start,end),after:after.slice(newStart,newEnd)};
    }
    function v27SequenceHunks(before,after,a,b,base=0,newBase=0,cells=160000) {
        const ao=[0],bo=[0];for(const item of a)ao.push(ao.at(-1)+item.length);for(const item of b)bo.push(bo.at(-1)+item.length);
        const alignment=v27SequenceMatches(a,b,cells),hunks=[];let i=0,j=0;
        for(const[ai,bi]of [...alignment.pairs,[a.length,b.length]]){
            if(i!==ai||j!==bi){const edit=v27TrimDifference(before,after,ao[i],ao[ai],bo[j],bo[bi]);if(edit.start!==edit.end||edit.newStart!==edit.newEnd){const precise=!alignment.uncertain.some(r=>i<r.a1&&ai>r.a0||j<r.b1&&bi>r.b0);hunks.push({...edit,start:base+edit.start,end:base+edit.end,newStart:newBase+edit.newStart,newEnd:newBase+edit.newEnd,precise});}}
            i=ai+1;j=bi+1;
        }
        return hunks;
    }
    function v27LineDiffHunks(before,after) {
        if(before===after)return [];
        const a=before.match(/[^\n]*(?:\n|$)/g).filter(Boolean),b=after.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
        if(a.length===b.length){let different=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])different++;
            if(different<=Math.max(1,Math.floor(a.length/5))){const edits=[];let left=0,right=0;for(let i=0;i<a.length;i++){if(a[i]!==b[i])edits.push({start:left,end:left+a[i].length,newStart:right,newEnd:right+b[i].length,before:a[i],after:b[i],precise:true});left+=a[i].length;right+=b[i].length;}return edits;}
        }
        return v27SequenceHunks(before,after,a,b,0,0,600000);
    }
    function v27LexicalDiff(before,after,start=0,newStart=0) {
        if(before===after)return [];
        const tokenize=s=>s.match(/[\p{L}\p{N}_]+|[ \t]+|\r?\n|[^\p{L}\p{N}_\s]|\s/gu)||[];
        return v27SequenceHunks(before,after,tokenize(before),tokenize(after),start,newStart,160000);
    }
    function v27RawDiff(before,after) {
        const cached=v27DiffMemo.find(value=>value.before===before&&value.after===after);if(cached)return cached.edits.map(edit=>({...edit}));
        const lines=v27LineDiffHunks(before,after),edits=[];
        for(const line of lines)for(const edit of v27LexicalDiff(line.before,line.after,line.start,line.newStart)){
            if(edit.precise!==false&&edit.before&&edit.after&&edit.before.length+edit.after.length<=1024){
                const local=v27SequenceHunks(edit.before,edit.after,Array.from(edit.before),Array.from(edit.after),edit.start,edit.newStart,65536);
                if(local.every(item=>item.precise!==false)){for(const item of local)edits.push(item);continue;}
            }
            edits.push(edit);
        }
        const ordered=edits.sort((a,b)=>a.start-b.start||a.newStart-b.newStart),merged=[];
        for(const edit of ordered){const previous=merged.at(-1);if(previous&&(edit.start<previous.end||edit.newStart<previous.newEnd||edit.start===previous.start&&edit.newStart===previous.newStart)){previous.end=Math.max(previous.end,edit.end);previous.newEnd=Math.max(previous.newEnd,edit.newEnd);previous.precise=previous.precise&&edit.precise;previous.before=before.slice(previous.start,previous.end);previous.after=after.slice(previous.newStart,previous.newEnd);}else merged.push({...edit});}
        let position=0,result='';for(const edit of merged){result+=before.slice(position,edit.start)+edit.after;position=edit.end;}result+=before.slice(position);
        const output=result===after?merged:[{start:0,end:before.length,newStart:0,newEnd:after.length,before,after,precise:false}];
        const bytes=4*(before.length+after.length)+128*output.length;if(bytes<=8388608){while(v27DiffMemo.length>=4||v27DiffMemoBytes+bytes>8388608){const removed=v27DiffMemo.shift();if(!removed)break;v27DiffMemoBytes-=removed.bytes;}v27DiffMemo.push({before,after,edits:output,bytes});v27DiffMemoBytes+=bytes;}
        return output.map(edit=>({...edit}));
    }
    function v27AtomLookup(atoms) {
        if(atoms.length<512)return (start,end)=>atoms.find(atom=>start>=atom.start&&end<=atom.end&&start<atom.end&&end>atom.start);
        const entries=atoms.map((atom,rank)=>({atom,rank})).sort((a,b)=>a.atom.start-b.atom.start||a.rank-b.rank);let size=1;while(size<entries.length)size*=2;
        const maximumEnd=new Float64Array(2*size),minimumRank=new Float64Array(2*size);maximumEnd.fill(-Infinity);minimumRank.fill(Infinity);
        entries.forEach((entry,i)=>{maximumEnd[size+i]=entry.atom.end;minimumRank[size+i]=entry.rank;});
        for(let i=size-1;i;i--){maximumEnd[i]=Math.max(maximumEnd[2*i],maximumEnd[2*i+1]);minimumRank[i]=Math.min(minimumRank[2*i],minimumRank[2*i+1]);}
        return (start,end)=>{let low=0,high=entries.length;while(low<high){const middle=(low+high)>>>1;if(entries[middle].atom.start<start||end>start&&entries[middle].atom.start===start)low=middle+1;else high=middle;}const limit=low;let best=Infinity,result;
            function visit(node,left,right){if(left>=limit||maximumEnd[node]<end||maximumEnd[node]<=start||minimumRank[node]>=best)return;
                if(right-left===1){const entry=entries[left];if(entry&&start>=entry.atom.start&&end<=entry.atom.end&&start<entry.atom.end&&end>entry.atom.start){best=entry.rank;result=entry.atom;}return;}
                const middle=(left+right)>>>1,first=2*node,second=first+1;if(minimumRank[first]<=minimumRank[second]){visit(first,left,middle);visit(second,middle,right);}else{visit(second,middle,right);visit(first,left,middle);}
            }
            visit(1,0,size);return result;
        };
    }
    function v27DiffCacheStatus(){return {entries:v27DiffMemo.length,bytes:v27DiffMemoBytes,maxEntries:4,maxBytes:8388608};}
    function v27ByteMetrics(before,after,hunks) {
        const original=utf8Length(before),result=utf8Length(after),edits=v27RawDiff(before,after),precise=edits.every(edit=>edit.precise!==false);let added=0,removed=0;
        if(precise)for(const edit of edits){const local=v27TrimDifference(edit.before,edit.after,0,edit.before.length,0,edit.after.length);removed+=utf8Length(local.before);added+=utf8Length(local.after);}
        return {before:original,after:result,delta:result-original,added:precise?added:null,removed:precise?removed:null,changed:precise?added+removed:null,hunks:(hunks||edits).length,consistent:precise&&added-removed===result-original,netExact:true,precise,precision:precise?'local-diff':'bounded-fallback'};
    }
    function v27RetainedTypes(before,after,kinds=[]) {
        if(typeof before!=='string'||typeof after!=='string'||before===after)return {topics:[],count:0,text:'Nenhum ajuste mantido'};
        const topics=[...new Set(summaryTopics(before,after,kinds))],list=topics.length<2?topics[0]:topics.slice(0,-1).join(', ')+' e '+topics.at(-1);
        return {topics,count:topics.length,text:topics.length+' tipo'+(topics.length===1?'':'s')+' de ajuste: '+list};
    }

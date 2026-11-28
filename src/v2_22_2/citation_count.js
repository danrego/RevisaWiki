// Count a finite native import from its retained endpoints. No repair planner,
// adjustment pipeline or renderer is replayed during result presentation.
function v2222CitationEndpointPair(before,after) {
 const a=v222Fields(before),b=v222Fields(after);if(!a||!b||a.parts.length!==a.fields.length+1||b.parts.length!==b.fields.length+1||!/^citar web$/i.test(b.header.trim()))return null;
 const head=a.header.trim().toLowerCase();if(!['cite apod','cite instagram'].includes(head))return null;
 const source=new Map(),target=new Map();for(const f of a.fields){if(source.has(f.key))return null;source.set(f.key,f);}for(const f of b.fields){if(target.has(f.key))return null;target.set(f.key,f);}
 const c=v218CitationNativeContext(after),r=c&&v2215CitationReader(c);if(!r)return null;
 const roles=new Map();for(const f of b.fields){const xs=v222CitationRoles(f.key,r);if(xs.length!==1||roles.has(xs[0]))return null;roles.set(xs[0],f);}
 const bindings=[],used=new Set(),bind=(key,role,kind='literal')=>{const from=source.get(key);if(!from)return true;const to=roles.get(role);if(!to||used.has(to))return false;let same=from.value.trim()===to.value.trim();
  if(!same&&kind==='date'){const x=v2222CitationAPODDate(from.value),y=v2222CitationAPODDate(to.value);same=!!x&&!!y&&x.year===y.year&&x.month===y.month&&x.day===y.day;}
  if(!same&&kind==='language'){const x=v2221CitationLanguageList(from.value),y=v2221CitationLanguageList(to.value);same=!!x&&!!y&&JSON.stringify(x)===JSON.stringify(y);}
  if(!same)return false;used.add(to);bindings.push({from,to});return true;};
 const mappings={title:'Title',date:'Date','access-date':'AccessDate',accessdate:'AccessDate',language:'Language','trans-title':'TransTitle'};
 const allowed=new Set([...Object.keys(mappings),...(head==='cite apod'?['apod']:['author','user','postid','link'])]);if([...source.keys()].some(k=>!allowed.has(k))||source.has('access-date')&&source.has('accessdate'))return null;
 for(const[key,role]of Object.entries(mappings))if(!bind(key,role,['Date','AccessDate'].includes(role)?'date':role==='Language'?'language':'literal'))return null;
 const fixed=new Map();
 if(head==='cite apod'){
  const d=source.get('date')&&v2222CitationAPODDate(source.get('date').value);if(!d||!source.get('title'))return null;const selector=String(d.year).slice(-2)+String(d.month).padStart(2,'0')+String(d.day).padStart(2,'0');if(source.has('apod')&&source.get('apod').value.trim()!==selector)return null;
  fixed.set('URL','https://apod.nasa.gov/apod/ap'+selector+'.html');fixed.set('Periodical','[[Astronomy Picture of the Day]]');fixed.set('PublisherName','[[NASA]]');fixed.set('EditorList-Last:1','Nemiroff');fixed.set('EditorList-First:1','R.');fixed.set('EditorList-Last:2','Bonnell');fixed.set('EditorList-First:2','J.');
 }else{
  const author=source.get('author'),user=source.get('user'),post=source.get('postid');if(!author||!user||!post||!/^[-\w.]{1,30}$/.test(user.value.trim())||!/^[-\w]+$/.test(post.value.trim()))return null;
  const to=roles.get('AuthorList-Last:1');if(!to||to.value.trim()!==author.value.trim()+' [@'+user.value.trim()+']')return null;used.add(to);bindings.push({from:author,to});
  fixed.set('URL','https://www.instagram.com/p/'+post.value.trim()+'/');fixed.set('Via',source.get('link')?.value.trim()==='no'?'Instagram':'[[Instagram]]');
 }
 for(const[role,value]of fixed){const f=roles.get(role);if(!f||used.has(f)||f.value.trim()!==value)return null;used.add(f);}
 if(used.size!==b.fields.length)return null;
 const events=[];if(a.header!==b.header)events.push({kind:'template-header',count:1});const matchedSource=new Set(),matchedTarget=new Set();
 for(const{from,to}of bindings){matchedSource.add(from);matchedTarget.add(to);if(from.key!==to.key)events.push({kind:'parameter-name',key:from.key,target:to.key,count:1});if(from.value!==to.value)events.push({kind:'parameter-value',key:from.key,target:to.key,count:1});}
 for(const f of a.fields)if(!matchedSource.has(f))events.push({kind:'parameter-remove',key:f.key,count:1});
 for(const f of b.fields)if(!matchedTarget.has(f))events.push({kind:'parameter-add',key:f.key,count:1});
 return {count:events.length,events,sourceHeader:a.header,targetHeader:b.header};
}
function v2222CitationEndpointCount(before,after,cfg={}) {
 if(typeof before!=='string'||typeof after!=='string'||before===after||!v2222CitationScope(before,cfg)||cfg.citations===false)return null;
 const sourceNodes=v24SyntaxTemplates(v222Protected(before).view).nodes.filter(n=>n.size===2&&/^\{\{\s*(?:cite apod|cite instagram)\s*[|}]/i.test(before.slice(n.start,n.end)));
 if(!sourceNodes.length||sourceNodes.length>32||sourceNodes.some((n,i)=>sourceNodes.some((m,j)=>i!==j&&m.start<n.start&&n.end<m.end)))return null;
 const candidates=v24SyntaxTemplates(v222Protected(after).view).nodes.filter(n=>n.size===2),used=new Set(),pairs=[];
 for(const a of sourceNodes){const raw=before.slice(a.start,a.end),matches=[];for(const b of candidates){if(used.has(b))continue;const p=v2222CitationEndpointPair(raw,after.slice(b.start,b.end));if(p)matches.push({node:b,pair:p});}if(!matches.length)return null;const first=matches[0];used.add(first.node);pairs.push({source:a,target:first.node,proof:first.pair});}
 const mask=(text,rows,key)=>v24SyntaxApply(text,rows.map((p,i)=>({start:p[key].start,end:p[key].end,text:'\uE000citation-'+i+'\uE001'})));
 if(mask(before,pairs,'source')!==mask(after,pairs,'target'))return null;
 const events=pairs.flatMap((p,i)=>p.proof.events.map((event,j)=>({...event,id:v24SyntaxHash(before)+':citation-endpoint:'+i+':'+j,sourceStart:p.source.start,targetStart:p.target.start})));
 return {schema:1,sourceHash:v24SyntaxHash(before),outputHash:v24SyntaxHash(after),count:events.reduce((n,e)=>n+e.count,0),exact:true,unit:'retained-syntax-component',events};
}

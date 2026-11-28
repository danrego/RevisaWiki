// A small native source contract extends the existing evidence producers.
const V2222_STUB_PORTALS=Object.freeze([
 {owner:'Esboço-astronomia',portal:'Astronomia',revision:56119660,sha256:'9d2437529d40b14c8797db3a4212b2a340b1d9e5916ad878bbb707a0b81c1659'},
 {owner:'Esboço-química',portal:'Química',revision:46265048,sha256:'3191fce1f604622d27cc55f2531ea99a9f81db692a45422f75b36c7baaa2633f'}
]);
const V2222_REGION_COUNTRIES=Object.freeze([
 {region:'Califórnia',country:'Estados Unidos',revision:73038239},
 {region:'Ontário',country:'Canadá',revision:71818660},
 {region:'Quebec',country:'Canadá',revision:73344543}
]);
function v2222FocusedStubRows(){return (V2221_FOCUSED.stubs||[]).concat(V2222_STUB_PORTALS);}
function v2222CountryCovered(candidate,others){const country=portalIdentity(candidate);return V2222_REGION_COUNTRIES.some(row=>portalIdentity(row.country)===country&&others.some(other=>portalIdentity(other)===portalIdentity(row.region)));}
function v2222CategoryAutomatic(row){
 if(V222_INFERENCE.categoryTargets[row[0]]==='Romances'&&V222_INFERENCE.categoryProfiles[row[1]]==='book.work-form-or-genre'&&row[2]==='f9c95d7c3665dc9fda712eb23607119edadd52d33473463737afa779f0e45201')return{criterion:'literal-published-novel-definition',property:'P31',subjectKind:'published-book',topicTitle:'Romance',requiresPublication:true,nativeCategoryRevision:59894027};
 if(V222_INFERENCE.categoryTargets[row[0]]==='Aberturas de xadrez'&&V222_INFERENCE.categoryProfiles[row[1]]==='SPORT-TOPIC'&&row[2]==='09c95c5566c93902e8ea6e7d177ec44bb1c84c5c18c868c5d2b9820c87de5ae7')return{criterion:'literal-chess-opening-definition',property:'P31',subjectKind:'chess-opening',topicTitle:'Abertura (xadrez)',nativeCategoryRevision:34594161};return null;
}
function v2222CategoryCriterionTopics(body,contract){if(contract?.automatic?.criterion==='literal-published-novel-definition')return /^Esta categoria contém \[\[romance\]\]s\.[ \t]*\r?$/m.test(body)?['Romance']:[];if(contract?.automatic?.criterion==='literal-chess-opening-definition')return /^Esta categoria contém páginas relacionadas com as \[\[Abertura \(xadrez\)\|aberturas de xadrez\]\]\.[ \t]*\r?$/m.test(body)?['Abertura (xadrez)']:[];return null;}
function v2222PublicationDateAllowed(value,precision){const m=/^\+(\d{4})-(\d{2})-(\d{2})T00:00:00Z$/.exec(value||'');if(!m||!Number.isInteger(precision)||precision<9)return false;const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]),now=new Date();if(year<1000||year>now.getUTCFullYear())return false;if(precision===9)return month===0&&day===0&&year<now.getUTCFullYear();if(precision===10)return month>=1&&month<=12&&day===0&&(year<now.getUTCFullYear()||month<now.getUTCMonth()+1);const date=new Date(Date.UTC(year,month-1,day));return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day&&value.slice(1,11)<=now.toISOString().slice(0,10);}
function v2222PublicationSourceAllowed(text){const view=v222InferenceView(text);return /[ \t](?:publicado|publicada|publicados|publicadas)(?:[ \t]|[.,])/u.test(view)&&!/\b(?:inédito|inédita|futuro|futura|previsto|prevista|será|programad[oa])\b/iu.test(view);}
function v2222CategoryPublicationProof(entity,candidate){
 if(!candidate?.contract?.automatic?.requiresPublication)return null;const anchor=candidate.anchor;
 if(!anchor||!v2222PublicationSourceAllowed(anchor.text))return null;
 const candidates=[];for(const statement of entity?.claims?.P577||[]){if(!['normal','preferred'].includes(statement?.rank))continue;const snak=statement?.mainsnak,time=snak?.datavalue?.value;if(snak?.snaktype!=='value'||snak?.datatype!=='time'||snak?.property!=='P577'||snak?.datavalue?.type!=='time'||!time||time.calendarmodel!=='http://www.wikidata.org/entity/Q1985727'||!v2222PublicationDateAllowed(time.time,time.precision)||statement.qualifiers&&Object.keys(statement.qualifiers).length)return null;
  const referenceUrls=v222CategoryProducerReferenceUrls(statement),shared=anchor.referenceUrls.filter(url=>referenceUrls.includes(url));if(!shared.length)return null;candidates.push({property:'P577',time:time.time,precision:time.precision,calendar:time.calendarmodel,rank:statement.rank,qualifiersPresent:false,referenceUrls:shared});
 }
 return candidates.length===1?candidates[0]:null;
}
function v2222CategoryPublicationValid(proof,anchor){
 const publication=proof.publicationEvidence;if(!publication||publication.property!=='P577'||!['normal','preferred'].includes(publication.rank)||publication.qualifiersPresent!==false||publication.calendar!=='http://www.wikidata.org/entity/Q1985727'||!Number.isInteger(publication.precision)||publication.precision<9||!Array.isArray(publication.referenceUrls)||!publication.referenceUrls.some(url=>anchor.referenceUrls.includes(url)))return false;
 return v2222PublicationDateAllowed(publication.time,publication.precision)&&v2222PublicationSourceAllowed(anchor.text);
}

"""Qualify one exact redirect-only source flag without changing the raw oracle."""
import argparse, collections, gzip, hashlib, json, pathlib, re
from independent_source_guards import dests
from independent_wikitext import targets

HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[1]
sha=lambda data:hashlib.sha256(data).hexdigest()
def read(path):
    if path.exists():return json.loads(path.read_text())
    return json.loads(gzip.decompress(path.with_name(path.name+'.gz').read_bytes()))
EXPECTED_SOURCE='c154b4c3237e8e4141e06f4502277a6c63261e184e343dc532fb3013fa1aeafd'
EXPECTED_OUTPUT='91f1c28f462a7b132ec633fd8b900d2717662229164fb08cac450feff8097911'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('run',nargs='?',default='release_final04');parser.add_argument('--evidence-only',action='store_true');args=parser.parse_args();run=args.run
    assert re.fullmatch(r'[A-Za-z0-9_-]+',run)
    base=ROOT/'tests/evidence/2.6.0/corpus' if args.evidence_only else HERE/run
    raw=read(base/'independent_source_guards.json')
    flags=[row for row in raw['articles'] if not row['passed']]
    assert len(flags)==raw['summary']['flagged']==1
    flag=flags[0]
    assert (flag['title'],flag['revid'],flag['corpus'])==('Participantes da Segunda Guerra Mundial',73110024,'new')
    assert flag['sourceSha256']==EXPECTED_SOURCE and flag['outputSha256']==EXPECTED_OUTPUT
    assert flag['lostLinks']==['Rangoon']
    assert all(flag[key] for key in ['distinctImagesRetained','distinctCategoriesRetained','sourceURLsRetained','protectedLiteralBlocksExact','mathBlocksExact','publicationIdentifiersRetained'])
    aliases=read(ROOT/'src/v2_6/verified_rules/linked_name_aliases.json')
    provenance=read(ROOT/'src/v2_6/verified_rules/public/revision_provenance.json')
    verified={row['alias']:row for row in provenance['verifiedLinkedNames']}
    redirects=read(ROOT/'tests/evidence/2.6.0/corpus/finite_alias_redirects_public_GET.json')
    targetdata=read(ROOT/'tests/evidence/2.6.0/corpus/finite_alias_targets_public_GET.json')
    redirectpages={row['title']:row for row in redirects['query']['pages']}
    targetpages={row['title']:row for row in targetdata['query']['pages']}
    assert len(aliases)==len(redirectpages)==11 and len(targetpages)==9
    proofs=[]
    for alias,target in aliases.items():
        page=redirectpages[alias];revision=page['revisions'][0];proof=verified[alias];destination=targetpages[target]
        source=revision['slots']['main']['content']
        assert re.fullmatch(r'\s*#(?:REDIRECT|REDIRECIONAMENTO)\s*\[\['+re.escape(target)+r'\]\]\s*',source,re.I)
        assert page.get('redirect') and page['ns']==destination['ns']==0 and not destination.get('missing')
        assert revision['revid']==proof['aliasOldid'] and page['pageid']==proof['aliasPageid']
        assert source==proof['redirectSource'] and proof['target']==target
        assert destination['pageid']==proof['targetPageid'] and destination['revisions'][0]['revid']==proof['targetOldid']
        assert destination.get('pageprops',{}).get('wikibase_item')==proof['wikidata']
        assert 'disambiguation' not in destination.get('pageprops',{})
        proofs.append({'alias':alias,'target':target,'redirectOldid':revision['revid'],'redirectSource':source,'targetOldid':destination['revisions'][0]['revid'],'targetPageid':destination['pageid'],'wikidata':proof['wikidata'],'redirectPermanentLink':f'https://pt.wikipedia.org/w/index.php?oldid={revision["revid"]}','targetPermanentLink':f'https://pt.wikipedia.org/w/index.php?oldid={destination["revisions"][0]["revid"]}'})
    if args.evidence_only:
        before=(HERE/'fixtures/73110024_before.wiki').read_text();after=(HERE/'fixtures/73110024_after.wiki').read_text()
    else:
        directory=ROOT/'tests/corpus/inputs/new'
        manifest=read(directory/'manifest.json');item=next(row for row in manifest if row['revid']==73110024)
        before=(directory/item['file']).read_text();paths=list(HERE.glob(run+'_part*/core_transformed/new/73110024.wiki'))
        assert len(paths)==1;after=paths[0].read_text()
    assert sha(before.encode())==EXPECTED_SOURCE and sha(after.encode())==EXPECTED_OUTPUT
    bl=targets(before)[0];al=targets(after)[0]
    assert bl['Rangoon']==1 and bl['Rangum']==0 and al['Rangoon']==0 and al['Rangum']==1
    oldlinks,oldimages,oldcats=dests(before);newlinks,newimages,newcats=dests(after)
    assert oldlinks-newlinks=={'Rangoon'} and 'Rangum' in newlinks
    assert (oldlinks-{'Rangoon'})|{'Rangum'}<=newlinks
    assert oldimages<=newimages and oldcats<=newcats
    # This qualification applies only to this exact revision and transformed
    # hash. Other aliases are verified here, but do not waive any corpus flag.
    result={'version':'2.6.0','run':run,'status':'exact-redirect-equivalence-review-complete','rawFlagCount':1,'qualifiedFlagCount':1,'unqualifiedFlagCount':0,'rawFlagsRetained':True,'rawOracleModified':False,'implementationImported':False,'scope':'Only revision 73110024 with the exact source/output hashes below; no global alias waiver.','corpusNetworkRequests':0,'wikipediaWrites':0,'externalEvidence':'Anonymous public GET responses fetched separately from the offline corpus execution.','publicGETResponseFiles':[{'file':name,'sha256':sha((ROOT/'tests/evidence/2.6.0/corpus'/name).read_bytes())} for name in ['finite_alias_redirects_public_GET.json','finite_alias_targets_public_GET.json']],'finiteRedirectsIndependentlyVerified':proofs,'articles':[{'title':flag['title'],'revid':flag['revid'],'sourceSha256':EXPECTED_SOURCE,'outputSha256':EXPECTED_OUTPUT,'lostRawDestination':'Rangoon','retainedCanonicalDestination':'Rangum','redirectOldid':37477663,'targetOldid':73096308,'wikidata':'Q37995','allOtherSourceChecksPassed':True,'uniqueImagesCategoriesURLsMathLiteralsAndIdentifiersRetained':True,'qualification':'A link to an exact redirect target retains the same page and Wikidata identity. The raw destination-name flag is retained.'}]}
    if not args.evidence_only:(base/'source_alias_review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({key:value for key,value in result.items() if key not in ['finiteRedirectsIndependentlyVerified','articles','publicGETResponseFiles']},ensure_ascii=False))

if __name__=='__main__':main()

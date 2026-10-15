"""Read verified literal list/nationality forms in the existing portal pipeline."""
from pathlib import Path
import json
HERE=Path(__file__).resolve().parent

def apply(source):
    def extend_declaration(source,prefix,suffix,change):
        start=source.index(prefix)+len(prefix);end=source.index(suffix,start)
        data=json.loads(source[start:end]);change(data)
        return source[:start]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+source[end:]
    source=extend_declaration(source,'const VERIFIED_BIOGRAPHY_PORTALS=new Set(',');',lambda a:a.append('entretenimento') if 'entretenimento' not in a else None)
    source=extend_declaration(source,'const OCCUPATION_PORTALS=ownDictionary(',');',lambda d:d.update({'cineasta documentarista':['Cinema']}))
    marker='    function exactPortalOccupations(value) {'
    assert source.count(marker)==1
    source=source.replace(marker,(HERE/'portal_evidence.js').read_text()+'\n'+marker,1)
    old="const text=linkedPortalEvidenceText(value,'occupation');if(text===null)return [];"
    new="const literal=v26PortalOccupationList(value);if(literal===null)return [];\n        const text=linkedPortalEvidenceText(literal,'occupation');if(text===null)return [];"
    assert source.count(old)==1;source=source.replace(old,new,1)
    marker='    function explicitNationalityPortals(value) {\n'
    assert source.count(marker)==1;source=source.replace(marker,marker+'        const confirmed=v26NationalityTemplate(value);if(confirmed)return confirmed;\n',1)
    marker="        if([...subjects].some(x=>SPORT_PORTAL_IDENTITIES.has(portalIdentity(x))))subjects.add('Esportes');"
    assert source.count(marker)==1;source=source.replace(marker,"        // Cinema foi confirmado pela profissão, sem usar prêmios ou ligações do corpo.\n        if(subjects.has('Cinema'))subjects.add('Entretenimento');\n"+marker,1)
    old="desired=desired.filter(x=>!present.has(portalIdentity(x))&&!(portalIdentity(x)==='brasil'&&brazilAlreadyCovered));"
    new="desired=desired.filter(x=>!present.has(portalIdentity(x))&&!(portalIdentity(x)==='brasil'&&brazilAlreadyCovered)&&!(portalIdentity(x)==='rússia'&&present.has('moscou')));"
    assert source.count(old)==1;source=source.replace(old,new,1)
    marker='biographyPortalCandidates, addAutomaticBiographyPortals'
    assert source.count(marker)==1;return source.replace(marker,'biographyPortalCandidates, v26PortalOccupationList, v26NationalityTemplate, addAutomaticBiographyPortals',1)

if __name__=='__main__':
    import sys
    assert len(sys.argv)==3,'Usage: integration_patch.py input.js output.js'
    Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))

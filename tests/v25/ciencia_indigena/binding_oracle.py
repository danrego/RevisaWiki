from pathlib import Path
from collections import Counter
import re,json,hashlib
P=Path(__file__).parent
before=(P/'source_73045540.wiki').read_text();after=(P/'observed_final04.wiki').read_text();review=json.loads((P/'review.json').read_text())
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
assert sha(before)=='9ae0ab7eb68049bebafc962ee2977ddda02df653e95415f821f1345d72451b90'
assert sha(after)=='497e307372d140cfe1554ee82ce1ffd6a612e02213e220e6eafdde40ef01f70c'
canon=lambda s:re.sub(r'[ \t\r\n]+',' ',s).strip()
raw_bodies=[canon(m.group(2)) for m in re.finditer(r'<ref\b([^>]*?)(?:/\s*>|>(.*?)</ref\s*>)',before,re.I|re.S) if m.group(2) is not None]
bodies={body for body in raw_bodies if body in ['(NOELLI; SALLUM, 2019)','(SILVA et al., 2022)'] or body.startswith('NOELLI, Francisco Silva; SALLUM, Marianne.') or body.startswith('SILVA, Cássio Alexandre da; SOUZA, Fabiano José Alves de; VELDEN, Felipe Vander; SILVA, Vanginei Leite da.')}
assert len(bodies)==4
labels={body:f'body-{i+1}' for i,body in enumerate(sorted(bodies))}
ref=re.compile(r'<ref\b([^>]*?)(?:/\s*>|>(.*?)</ref\s*>)',re.I|re.S)
attr=re.compile(r'\b(name|group)\s*=\s*(?:"([^"]*)"|\x27([^\x27]*)\x27|([^\s>]+))',re.I)
def occurrences(source):
    tokens=[];defs={}
    for m in ref.finditer(source):
        fields={x.group(1).lower():next(v for v in x.groups()[1:] if v is not None) for x in attr.finditer(m.group(1))}
        key=(fields.get('group',''),fields.get('name',''));body=canon(m.group(2)) if m.group(2) is not None else None
        if body is not None and key[1]:
            if key in defs and defs[key]!=body:raise AssertionError('Conflicting source bodies for one literal name and group')
            defs[key]=body
        tokens.append((key,body))
    return [labels[body if body is not None else defs.get(key)] for key,body in tokens if (body if body is not None else defs.get(key)) in bodies]
original=occurrences(before);current=occurrences(after);assert all(original.count(label)>0 for label in labels.values());assert original==current
mutations=[]
needle='<ref name="ref-auto-4" />';assert needle in after
for name,candidate in [('one-call-binding-swapped',after.replace(needle,'<ref name="ref-auto-5" />',1)),('one-call-deleted',after.replace(needle,'',1))]:
    try:rejected=occurrences(candidate)!=original
    except AssertionError:rejected=True
    assert rejected;mutations.append({'name':name,'rejected':True})
report={'version':'2.5.0','stage':'independent fixed-source binding oracle before production proof change','sourceSha256':sha(before),'outputSha256':sha(after),'scope':'Only the four plain-text reference families implicated in the failing inventory. Every original occurrence is expanded through its literal definition and compared in source order. No production helper is imported.','families':{labels[b]:{'bodySha256':sha(b),'occurrences':original.count(labels[b])} for b in sorted(bodies)},'originalSequence':original,'actualSequence':current,'sameCompleteBodyBindingAndOccurrenceOrder':original==current,'mutations':mutations,'wikipediaWrites':0,'networkRequests':0}
(P/'binding_oracle_results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))

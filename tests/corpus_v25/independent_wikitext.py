"""Independent literal-source table, image, category and link invariants. Does not import RevisaWiki."""
import collections, hashlib, html, json, pathlib, re, unicodedata
NAME=re.compile(r'\[\[\s*(:?)([^\]|\n]+)')
LITERAL_TAGS=r'nowiki|pre|syntaxhighlight|source|code|math|chem|score|timeline|graph|templatedata|poem|gallery|hiero|imagemap|mapframe|maplink|inputbox'
PROTECTED=re.compile(r'<!--[\s\S]*?(?:-->|$)|<('+LITERAL_TAGS+r')\b(?![^>]*?/\s*>)[^>]*>[\s\S]*?</\1\s*>',re.I)
REF=re.compile(r'<ref\b[^>]*?(?:/>|>[\s\S]*?</ref\s*>)',re.I)

def blank_match(m):
    return re.sub(r'[^\n]', ' ',m.group())

def literal_mask(s):
    return PROTECTED.sub(blank_match,s)

def normalize_target(s):
    s=html.unescape(unicodedata.normalize('NFC',s)).replace('_',' ')
    s=' '.join(s.split()).strip().lstrip(':')
    return s[:1].upper()+s[1:]

def targets(s):
    s=literal_mask(s)
    links=collections.Counter();images=collections.Counter();categories=collections.Counter()
    for m in NAME.finditer(s):
        raw=m.group(2).strip(); head,sep,tail=raw.partition(':')
        if sep and head.casefold() in ['imagem','ficheiro','arquivo','file','image']:
            images[normalize_target(tail)]+=1
        elif sep and head.casefold() in ['categoria','category']:
            if not m.group(1):categories[normalize_target(tail)]+=1
            else:links['Categoria:'+normalize_target(tail)]+=1
        else:
            links[normalize_target(raw)]+=1
    # A citation's author link can move from [[Name]] to an explicit supported link field.
    for m in re.finditer(r'\|\s*(?:autorlink\d*|author-link\d*|authorlink\d*|editor-link\d*|editorlink\d*|tradutor-link\d*)\s*=\s*([^|{}\n]+)',s,re.I):
        value=m.group(1).strip()
        if value and not value.startswith('[['):links[normalize_target(value)]+=1
    # Named file values in infoboxes are also checked, without assuming a full schema.
    for m in re.finditer(r'^\s*\|\s*(?:imagem|image|foto|photo|image_name|imagem_mapa\d*|mapa|bandeira|brasão)\s*=\s*([^\n|{}]+)',s,re.I|re.M):
        v=m.group(1).strip()
        if re.search(r'\.(?:png|jpe?g|svg|gif|webp|tiff?|ogg|ogv)\s*$',v,re.I) and not v.startswith('[['):
            v=re.sub(r'^(?:Imagem|Ficheiro|Arquivo|File|Image):','',v,flags=re.I)
            images[normalize_target(v)]+=1
    return links,images,categories

def protected_mask(s):
    s=REF.sub(blank_match,literal_mask(s))
    out=list(s);stack=[];link=[];i=0
    while i<len(s):
        if s.startswith('{{{',i):stack.append((i,3));i+=3;continue
        if s.startswith('{{',i):stack.append((i,2));i+=2;continue
        if stack and s.startswith('}'*stack[-1][1],i):
            start,n=stack.pop();end=i+n
            if not stack:
                for j in range(start,end):
                    if out[j]!='\n':out[j]=' '
            i=end;continue
        if s.startswith('[[',i):link.append(i);i+=2;continue
        if s.startswith(']]',i) and link:
            start=link.pop();end=i+2
            if not link:
                for j in range(start,end):
                    if out[j]!='\n':out[j]=' '
            i=end;continue
        i+=1
    for start,n in stack:
        for j in range(start,len(out)):
            if out[j]!='\n':out[j]=' '
    return ''.join(out)

def cell_value(raw):
    # Reference wording/parameter normalization is reviewed by the citation audit.
    from independent_presentation import canonical_images,canonical_alpha_notes
    value=REF.sub('',canonical_alpha_notes(canonical_images(raw)))
    mask=protected_mask(value)
    pipe=mask.find('|')
    if pipe>=0 and (not mask[:pipe].strip() or re.search(r'\b(?:scope|rowspan|colspan|style|class|align|valign|width|height|bgcolor|color|border|cellpadding|cellspacing|data-[\w-]+)\s*=',mask[:pipe],re.I)):
        value=value[pipe+1:]
    value=re.sub(r'<br\s*/?>',' ',value,flags=re.I)
    value=re.sub(r'</?small\b[^>]*>','',value,flags=re.I)
    # Finite transparent display wrappers cover the mechanical small/nowrap conversion.
    value=re.sub(r'\{\{\s*(?:Pequeno|Small|nowrap)\s*\|\s*(?:1\s*=\s*)?([^{}]*)\}\}',r'\1',value,flags=re.I)
    # Compare unchanged note payloads across the finite efn -> Nre name migration.
    value=re.sub(r'\{\{\s*(?:efn|nre)\s*\|','{{NOTE|',value,flags=re.I)
    value=re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]',r'\2',value)
    value=re.sub(r'\[\[([^\]]+)\]\]',r'\1',value)
    value=value.replace("'''",'').replace("''",'')
    return ' '.join(html.unescape(value).split()).strip()

def tables(s):
    mask=protected_mask(s); marks=list(re.finditer(r'\{\||\|\}',mask));stack=[];out=[];incomplete=[]
    for m in marks:
        if m.group()=='{|':stack.append(m.start())
        elif stack:
            start=stack.pop();end=m.end()
            if stack:continue
            raw=s[start:end];masked=mask[start:end]
            # Nested/dynamic rows are deliberately left unresolved rather than guessed.
            if re.search(r'\{\|',masked[2:]):
                out.append({'start':start,'line':s.count('\n',0,start)+1,'unresolved':'Nested table source','sha256':hashlib.sha256(raw.encode()).hexdigest()});continue
            rows=[];row=[];last=None;offset=0;captions=[];caption_at=None
            original_lines=raw.splitlines(keepends=True);masked_lines=masked.splitlines(keepends=True)
            for k,(line,ml) in enumerate(zip(original_lines,masked_lines)):
                if k==0 or ml.lstrip().startswith('|}'):continue
                lead=len(ml)-len(ml.lstrip());t=ml[lead:]
                if t.startswith('|-'):
                    if row:rows.append(row);row=[];last=None
                    caption_at=None
                elif t.startswith('|+'):
                    captions.append(line[lead+2:]);caption_at=len(captions)-1;last=None
                elif t.startswith('|') or t.startswith('!'):
                    caption_at=None
                    mark=t[0];body=line[lead+1:];bm=ml[lead+1:];sep='!!' if mark=='!' else '||'
                    splits=[m.start() for m in re.finditer(re.escape(sep),bm)];positions=[0]+[n+2 for n in splits];ends=splits+[len(body)]
                    for a,b in zip(positions,ends):
                        row.append({'kind':mark,'raw':body[a:b]});last=len(row)-1
                elif caption_at is not None:
                    captions[caption_at]+=line
                elif last is not None:
                    row[last]['raw']+=line
                elif t.strip():
                    # Template-produced rows or other non-cell material remain visible as unresolved.
                    incomplete.append({'line':s.count('\n',0,start+offset)+1,'reason':'Non-cell table line','text':line.strip()[:180]})
                offset+=len(line)
            if row:rows.append(row)
            out.append({'start':start,'line':s.count('\n',0,start)+1,'rows':[[{'kind':c['kind'],'value':cell_value(c['raw']),'numbers':re.findall(r'\d+(?:[.,]\d+)*',cell_value(c['raw']))} for c in row] for row in rows],'captions':[cell_value(c) for c in captions],'sha256':hashlib.sha256(raw.encode()).hexdigest()})
    for start in stack:incomplete.append({'line':s.count('\n',0,start)+1,'reason':'Unclosed table source'})
    return out,incomplete

def structure(t):
    return [{'rows':x.get('rows'),'captions':x.get('captions'),'unresolved':x.get('unresolved')} for x in t]


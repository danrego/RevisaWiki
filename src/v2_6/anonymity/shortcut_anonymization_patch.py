"""Retire nine optional dependencies on personal templates, without replacements."""
import hashlib,re

RETIRED={'it':43,'tw':45,'er':44,'wf':26,'wm':25,'w1':37,'tf':27,'w4':40,'ws':29}
BLOCK_SHA='0040fce5731ed13296ccea4858665f0df64bd2fb04e76db80250a449afc9d1a5'
RETIRED_BLOCK_SHA='29ff3c6ed7d4fae019359b6da88a2ff05451baeba21cf22ef48dcf0d14ad00cc'
WARNING_SHA='5477083c88ccca8044529dbc9a1fa10cbb462402c791f3c6ca3e917052bcab82'
LABEL_SHA='c76e69d51c5c1014467a631eb8672383c0d6e2e6ad70fe1a72099c0d0d5e7e45'
sha=lambda text:hashlib.sha256(text.encode()).hexdigest()

def apply(source):
    start_anchor='    const SHORTCUTS = ownDictionary({\n'
    end_anchor='    // São comandos digitados pelo editor, não inferências sobre o assunto da página.\n'
    assert source.count(start_anchor)==source.count(end_anchor)==1
    start=source.index(start_anchor);end=source.index(end_anchor,start)
    block=source[start:end]
    warning_anchor="            if (['tw', 'wf', 'wm', 'w1', 'tf', 'w4', 'ws'].includes(key))\n"
    if sha(block)==RETIRED_BLOCK_SHA:
        assert source.count("shortcuts: 'Atalhos explícitos',")==1
        assert not re.search(r"shortcuts: 'Atalhos explícitos do [^'\n]+'",source)
        assert warning_anchor not in source
        return source
    assert sha(block)==BLOCK_SHA,'Unexpected original shortcut map.'
    for key,number in RETIRED.items():
        pattern=r'^        '+re.escape(key)+r": '[^'\n]*/Predefinição"+str(number)+r"\}\}',\n"
        assert len(re.findall(pattern,block,re.M))==1,'Expected one retired shortcut: '+key
        block=re.sub(pattern,'',block,count=1,flags=re.M)
    source=source[:start]+block+source[end:]
    assert source.count(warning_anchor)==1
    start=source.index(warning_anchor);end=source.index("            bump('shortcuts');",start)
    warning=source[start:end];assert sha(warning)==WARNING_SHA,'Unexpected personal-template warning.'
    source=source[:start]+source[end:]
    pattern=r"shortcuts: 'Atalhos explícitos do [^'\n]+'"
    matches=list(re.finditer(pattern,source));assert len(matches)==1 and sha(matches[0][0])==LABEL_SHA
    source=source[:matches[0].start()]+"shortcuts: 'Atalhos explícitos'"+source[matches[0].end():]
    return source

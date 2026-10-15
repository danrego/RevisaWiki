"""Remove one verified unused music style field from Info/Biografia only."""
def apply(source):
    marker="            if(profileAccepts(profile,e.key))continue;\n"
    assert source.count(marker)==1
    replacement=marker+'''            // Info/Biografia 72993800 ignores fundo. Only the verified literal
            // music style and the empty field are covered by this exception.
            if(p.name==='info/biografia' && profile.oldid===72993800 && cfg.infoboxes &&
                v20AutomationAllowed(raw,cfg) && e.key==='fundo' &&
                entries.filter(item=>!item.remove && item.key==='fundo').length===1 &&
                ['', 'instrumentista_sem_vocal'].includes(e.value.trim())) {
                e.remove=true;changed=true;bump('infoboxParameters');continue;
            }
'''
    return source.replace(marker,replacement,1)

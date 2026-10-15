def _replace(source, before, after, expected=1):
    assert source.count(before) == expected, (source.count(before), before[:100])
    return source.replace(before, after)


def apply_loader(source):
    source = _replace(source,
        '    function v26InstallReadLauncher(root, mw, load) {\n',
        "    function v26InstallReadLauncher(root, mw, load) {\n        root.document.querySelectorAll('.rw26-lead-launch').forEach(button=>button.remove());\n")
    source = _replace(source,
        "        function add(native,href,label,lead) {\n            const button=doc.createElement('button'); button.type='button'; button.className='rw26-launch rw26-lazy-launch'+(lead?' rw26-lead-launch':'');",
        "        function add(native,href,label) {\n            const button=doc.createElement('button'); button.type='button'; button.className='rw26-launch rw26-lazy-launch';")
    source = _replace(source,
        '            if(lead)native.append(button);else native.after(button);',
        '            native.after(button);')
    source = _replace(source,
        '        function mount(content) {\n            if (root.RevisaWiki?.inlineEditing',
        "        function mount(content) {\n            doc.querySelectorAll('.rw26-lead-launch').forEach(button=>button.remove());\n            if (root.RevisaWiki?.inlineEditing")
    source = _replace(source,
        "native.dataset.rw26Lazy='1'; add(native,native.href,'Editar aqui',false);",
        "native.dataset.rw26Lazy='1'; add(native,native.href,'Editar aqui');")
    source = _replace(source,
        "            const heading=doc.getElementById('firstHeading'), native=doc.querySelector('#ca-edit a[href]');\n            if(heading&&native&&!doc.querySelector('.rw26-lead-launch')){const lead=new URL(native.href,origin);lead.searchParams.set('section','0');if(valid(lead.href))add(heading,lead.href,'Editar introdução aqui',true);}\n",
        '')
    assert 'Editar introdução aqui' not in source
    return source


def apply_core(source):
    source = _replace(source,
        '        function mount(content) {\n            if (active && !active.disposed',
        "        function mount(content) {\n            doc.querySelectorAll('.rw26-lead-launch').forEach(button=>button.remove());\n            if (active && !active.disposed")
    source = _replace(source, '''            if (container === doc && !doc.querySelector('.rw26-lead-launch')) {
                const first = doc.getElementById('firstHeading'), native = doc.querySelector('#ca-edit a[href]');
                if (first && native) {
                    const lead = new URL(native.href,origin); lead.searchParams.set('section','0');
                    try { H.parseEditTarget(lead.href,origin); const launch = action('Editar introdução aqui','rw26-launch rw26-lead-launch',()=>open(lead.href,first)); launch.style.cssText='font-size:.6em;margin-inline-start:.6em;'; first.append(launch); } catch (_) { /* A edição normal permanece disponível. */ }
                }
            }
''', '')
    if '    function v26InstallReadLauncher(root, mw, load) {' in source:
        source = apply_loader(source)
    assert 'Editar introdução aqui' not in source
    return source

"""Identify the revised distribution without changing its public version."""

REVISION = '2.11.0-r2'


def apply(source):
    old = 'repairColumnListArguments,version: VERSION, catalogDate: CATALOG_DATE,'
    assert source.count(old) == 1
    source = source.replace(old, 'repairColumnListArguments,distributionRevision: "' + REVISION + '",version: VERSION, catalogDate: CATALOG_DATE,', 1)
    old = "node('span', 'PTwiki ' + VERSION, 'ajg-version')"
    assert source.count(old) == 1
    source = source.replace(old, "node('span', 'PTwiki ' + VERSION + ' · r2', 'ajg-version')", 1)
    old = "node('p', 'Versão carregada: ' + VERSION + '. Catálogo: ' + CATALOG_DATE + '.')"
    assert source.count(old) == 1
    return source.replace(old, "node('p', 'Versão carregada: ' + VERSION + ', distribuição r2. Catálogo: ' + CATALOG_DATE + '.')", 1)

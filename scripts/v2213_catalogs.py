"""Apply only the reviewed current biography implementation to copied data."""
from pathlib import Path
import copy
import json

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / 'src/v2_21_3/native_contract.json'


def apply_catalogue(original):
    spec = json.loads(CONTRACT.read_text())
    native, priority = spec['native'], spec['priority']
    assert native['oldid'] == 73315036 and len(native['consumed']) == 349 and len(native['accepted']) == 353
    assert native['sha256'] == 'f38c0061df3e75de6e89d18d889a924da7c0ae4f316d6bd85580e76f0d0f36be'
    data = copy.deepcopy(original)
    data['version'] = '2.21.3'
    packed = data['packed']
    pt = packed['ptwiki']

    def string(index):
        value = pt['s'][index]
        return value if isinstance(value, str) else string(value[0]).replace('#', str(value[1]), 1)

    def intern(table, value):
        try:
            return pt[table].index(value)
        except ValueError:
            pt[table].append(value)
            return len(pt[table]) - 1

    def strings(values):
        return intern('l', [intern('s', v) for v in values])

    aliases = json.loads((CONTRACT.parent / 'alias_revisions.json').read_text())
    keys = {'info/biografia'} | {r['title'].split(':', 1)[1].casefold() for r in aliases['aliases']}
    rows = [row for row in pt['b'] if string(row[0]) in keys]
    assert len(rows) == len(keys)
    for row in rows:
        assert row[2] == 72993800
        row[2] = native['oldid']
        row[3] = intern('s', native['timestamp'])
        row[4] = strings(native['accepted'])
        # A native accepted alias is no longer an unknown parameter. Keep all
        # unrelated reports and the preserved source values themselves.
        for index in (7, 8):
            prior = pt['m'][row[index]]
            revised = [pair for pair in prior if string(pair[0]) not in native['accepted']]
            row[index] = intern('m', revised)
        row[12] = strings([string(i) for i in pt['l'][row[12]] if string(i) not in native['accepted']])
    literals = packed['support221']['literals']
    display = literals['V2151_FIELD_DISPLAY_GROUPS']
    assert '72993800' in display
    display[str(native['oldid'])] = {key: value for key, value in priority.items() if key in display['72993800']}
    for name in ('V216_FIELD_LABELS', 'V216_LITERAL_LIST_KEYS'):
        literals[name][str(native['oldid'])] = copy.deepcopy(literals[name]['72993800'])
    value_contract = copy.deepcopy(literals['V217_INFOBOX_VALUE_CONTRACTS']['72993800'])
    for group in value_contract['groups']:
        group['mode'] = 'first-nonempty'
    literals['V217_INFOBOX_VALUE_CONTRACTS'][str(native['oldid'])] = value_contract
    lead = packed['support219']['leadTransferContracts']
    lead[str(native['oldid'])] = copy.deepcopy(lead['72993800'])
    for role in ('birthDate', 'birthPlace', 'deathDate', 'deathPlace'):
        lead[str(native['oldid'])][role] = priority[role]
    # These definitions describe the live target, not a historical template.
    # Preserve other infobox families and old revision-specific display maps.
    base = literals['V28_BIOGRAPHY_FIELD_BASE']['info/biografia']
    for role in ('image', 'size', 'caption', 'alt', 'website', 'occupation'):
        if role in priority:
            base[role] = priority[role]
    base['occupation'] = priority['occupation'] + priority['otherOccupation'] + priority['profession']
    for key in ('info/biografia', 'info/cientista', 'info/escritor'):
        contract = literals['V220_BIO_NATIVE'][key]
        contract['ids'] = sorted(set(contract['ids'] + [native['oldid']]))
        contract['website'] = priority['website']
    alias = json.loads((CONTRACT.parent / 'native_ficha.json').read_text())
    assert alias['oldid'] == 50341076 and alias['sha256'] == '8dfc12f053840e727bf6215c76703c05002eccc824c5e2650566c2cd2d73e4b7'
    matches = [row for row in literals['V219_OTHER_NATIVE_ALIASES'] if row['title'] == 'Ficha de persona']
    assert len(matches) == 1 and matches[0]['oldid'] == alias['oldid'] and matches[0]['targetOldid'] == 72993800
    matches[0]['targetOldid'] = native['oldid']
    contracts = packed['support221']['biography']['V221_INFOBOX_CONTRACTS']
    assert contracts['Info/Biografia']['oldid'] == 73243370
    contracts['Info/Biografia'] = {'oldid': native['oldid'], 'sha256': native['sha256'], 'consumed': native['consumed']}
    mappings = packed['support221']['biography']['V221_INFOBOX_MAPPINGS']
    packed['support221']['biography']['V221_INFOBOX_MAPPINGS'] = [row for row in mappings if not (row['owner'] == 'Info/Biografia' and row['from'] in native['accepted'])]
    military = json.loads((CONTRACT.parent / 'military_contract.json').read_text())['native']
    military_rows = [row for row in pt['b'] if string(row[0]) == 'info/militar']
    assert len(military_rows) == 1 and military_rows[0][2] == 70403402
    mr = military_rows[0]
    mr[2] = military['oldid']
    mr[3] = intern('s', military['timestamp'])
    mr[4] = strings(military['accepted'])
    assert set(military['consumed']) == set(military['accepted']) and len(military['consumed']) == 48
    if 'Info/Militar' in contracts:
        contracts['Info/Militar'] = {key: military[key] for key in ('oldid', 'sha256', 'consumed')}
    literals['V220_BIO_NATIVE'].setdefault('info/militar', {'title': 'Info/Militar', 'ids': [], 'website': ['website'], 'person': True})['ids'] = [military['oldid']]
    display[str(military['oldid'])] = copy.deepcopy(display['70403402'])
    lead[str(military['oldid'])] = copy.deepcopy(lead['70403402'])
    groups = json.loads((CONTRACT.parent / 'coalesced_groups.json').read_text())
    assert groups['native']['oldid'] == native['oldid'] and groups['native']['sha256'] == native['sha256']
    packed['support2213'] = {'styles': json.loads((CONTRACT.parent / 'styles.json').read_text()), 'aliasGroups': [row['keys'] for row in groups['firstNonemptyGroups']]}
    return data

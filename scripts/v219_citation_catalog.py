"""Source-level proposal: apply only reviewed, source-pinned citation target corrections."""
import copy
import hashlib
import json


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def unpack_translation(packed):
    cache = {}

    def read(index):
        if index in cache:
            return cache[index]
        kind, value = packed['records'][index]
        if kind in (0, 3):
            result = value
        elif kind == 2:
            result = [read(item) for item in value]
        else:
            assert kind == 1
            result = {read(value[i]): read(value[i + 1]) for i in range(0, len(value), 2)}
        cache[index] = result
        return result

    return read(packed['root'])


def pack_translation(value):
    records, literals = [], {}

    def put(item):
        if isinstance(item, dict):
            record = [1, [index for pair in item.items() for index in (put(pair[0]), put(pair[1]))]]
        elif isinstance(item, list):
            record = [2, [put(child) for child in item]]
        elif isinstance(item, str):
            record = [0, item]
        else:
            record = [3, item]
        key = _canonical(record)
        # Containers are mutable after unpacking. Sharing equal profile objects
        # would make deleting fieldSet on one profile corrupt another profile.
        if record[0] in (0, 3) and key in literals:
            return literals[key]
        index = len(records)
        records.append(record)
        if record[0] in (0, 3):
            literals[key] = index
        return index

    root = put(value)
    return {'root': root, 'records': records}


def _expanded(catalog):
    result = copy.deepcopy(catalog)
    field_sets = result.pop('fieldSets', None)
    if field_sets is not None:
        for profile in result['profiles'].values():
            profile['fields'] = copy.deepcopy(field_sets[profile.pop('fieldSet')])
    return result


def apply_expanded_citation_targets(catalog, contract):
    """Return a clone. Every correction binds the exact donor identity and old value."""
    rows = contract['literalTargetCorrections']
    assert len(rows) == 409
    result = copy.deepcopy(catalog)
    assert 'fieldSets' not in result
    changed = set()
    for row in rows:
        profile = result['profiles'][row['profile']]
        assert profile['kind'] == 'citation'
        for key in ('language', 'title', 'oldid'):
            assert profile['source'].get(key) == row['source'].get(key)
        identity = (row['profile'], row['sourceKey'])
        assert identity not in changed
        changed.add(identity)
        assert profile['fields'][row['sourceKey']] == row['oldTarget']
        assert (row['oldTarget'], row['newTarget'], row['nativeRole']) in (
            ('capítulotrad', 'capítulo-trad', 'TransChapter'),
            ('url-seção', 'capítulourl', 'ChapterURL'),
        )
        assert row['donorProofs'], 'A declared map is not its donor-role proof'
        profile['fields'][row['sourceKey']] = row['newTarget']
    return result


def apply_packed_citation_targets(packed, contract):
    """Clone shared field sets, prune only unused sets, and intern literals only."""
    original = unpack_translation(packed)
    expected = apply_expanded_citation_targets(_expanded(original), contract)
    result = copy.deepcopy(original)
    assert 'fieldSets' in result
    replacements = {}
    for row in contract['literalTargetCorrections']:
        name = row['profile']
        replacements[name] = expected['profiles'][name]['fields']
    for name, fields in replacements.items():
        field_id = 'cite219:' + hashlib.sha256(_canonical(fields).encode()).hexdigest()
        if field_id in result['fieldSets']:
            assert result['fieldSets'][field_id] == fields
        else:
            result['fieldSets'][field_id] = copy.deepcopy(fields)
        result['profiles'][name]['fieldSet'] = field_id
    used = {profile['fieldSet'] for profile in result['profiles'].values()}
    result['fieldSets'] = {key: value for key, value in result['fieldSets'].items() if key in used}
    assert _expanded(result) == expected
    updated = pack_translation(result)
    assert unpack_translation(updated) == result
    assert _expanded(unpack_translation(updated)) == expected
    return updated

#!/usr/bin/env python3
"""Compile reviewed inference contracts; keep source provenance outside browser data."""
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def title(value):
    return re.sub(r'^(?:Categoria|Portal):', '', value)


def topic_from_definition(row):
    text = row.get('categoryDefinitionExcerpt', '')
    main = re.search(r'\{\{\s*(?:Cat main|Artigo principal|AP|Principal)\s*\|\s*([^|{}\n]+)\s*\}\}', text, re.I)
    if main:
        return main[1].strip(), 'literal-category-main-topic'
    # The explicit category definition, not a parent category or title similarity.
    body = re.search(r'(?:cont[eé]m|re[uú]ne)\s+(?:p[aá]ginas|artigos)\s+sobre\s+(?:o[sa]?\s+)?\[\[([^|\]#]+)(?:\|[^\]]+)?\]\]', text, re.I)
    if body:
        return body[1].strip(), 'literal-category-membership-definition'
    return None, None


def compact_params(row):
    contract = row['evidenceContract']
    profile = contract['id']
    criterion = contract.get('categoryMembershipCriterion')
    params = dict(criterion) if isinstance(criterion, dict) else {}
    facts = contract.get('facts')
    if isinstance(facts, dict):
        params.update(facts)
    params.update(contract.get('parameters', {}))
    for key in ['description', 'countryAssociationIsNotCitizenshipOrBirthplaceInference', 'articleFactsMustMatchTargetNotJustShareWords', 'notCitizenshipNationalityResidenceOrOriginInference']:
        params.pop(key, None)
    automatic = None
    if profile == 'bio-exact-birthplace-v1':
        place = params.get('birthplaceEntity')
        proof = row.get('placeEvidence') or {}
        definition = (row.get('categoryDefinitionEvidence') or {}).get('birthDefinitionExcerpt', '')
        if place and proof.get('title') and '[[%s' % place in definition:
            automatic = {'property': 'P19', 'topicTitle': proof['title'], 'criterion': 'literal-category-birthplace-definition', 'subjectKind': 'human'}
    if profile in {'astronomical-object', 'geological-object', 'inorganic-chemical-class', 'mathematical-object', 'biomolecular-object', 'scientific-instrument', 'chemical-element-class', 'physical-particle-class', 'chemical-structural-class'}:
        topic, criterion_kind = topic_from_definition(row)
        if topic:
            automatic = {'property': 'P31', 'topicTitle': topic, 'criterion': criterion_kind, 'subjectKind': 'scientific-object'}
    return params, automatic


def compile_data(planning):
    read = lambda rel: json.loads((planning / rel).read_text())
    portals = read('category-portals-expanded-plan/CATALOGO_PROPOSTO_CATEGORIAS_PORTAIS.json')
    categories = read('evidence-categories-expanded-plan/CATALOGO_PROPOSTO_EVIDENCIAS_CATEGORIAS.json')
    flags = read('flag-countries-expanded-plan-2026-11-13/CATALOGO_VERIFICADO_BANDEIRAS_PAISES.json')
    target_pairs = sorted({(p['argument'], title(p['target'])) for row in portals['rows'] for p in row['portals']})
    target_index = {value: i for i, value in enumerate(target_pairs)}
    portal_rows = []
    for row in portals['rows']:
        names = {p['target'] for p in row['portals']}
        guard = (1 if row['guardProfile'] == 'human-individual-category' else 0) | (2 if 'Portal:Mulheres' in names else 0)
        portal_rows.append([title(row['category']), [target_index[(x['argument'], title(x['target']))] for x in row['portals']], guard])
    target_categories = sorted(x['targetCategory'] for x in categories['targets'])
    category_index = {x: i for i, x in enumerate(target_categories)}
    profiles = sorted(categories['profileRows'])
    profile_index = {x: i for i, x in enumerate(profiles)}
    rows, params, parameter_index = [], [], {}
    private_rows = []
    for file in categories['sourceCatalogs']:
        domain = read('evidence-categories-expanded-plan/' + file)
        for source_index, row in enumerate(domain['rows']):
            if row['targetCategory'] not in category_index:
                raise ValueError('Domain contract missing from final target catalogue')
            contract = row['evidenceContract']
            compact, automatic = compact_params(row)
            value = {'facts': compact, 'automatic': automatic}
            packed = canonical(value)
            if packed not in parameter_index:
                parameter_index[packed] = len(params)
                params.append(value)
            contract_hash = digest({'target': row['targetCategory'], 'area': row['area'], 'contract': contract})
            rows.append([category_index[row['targetCategory']], profile_index[contract['id']], contract_hash, parameter_index[packed]])
            private_rows.append({'target': row['targetCategory'], 'profile': contract['id'], 'criterionHash': contract_hash, 'sourceFile': file, 'sourceRow': source_index, 'area': row['area'], 'automaticProducerCandidate': automatic is not None, 'conditions': contract, 'status': 'automatic-only-with-complete-bound-proof' if automatic else 'conditional-no-unproved-recognizer'})
    fact_keys = sorted({key for value in params for key in value['facts']})
    fact_key_index = {key: i for i, key in enumerate(fact_keys)}
    fact_values, fact_value_index, compact_parameters, automatic_parameters = [], {}, [], []
    for parameter_index, value in enumerate(params):
        packed_facts = []
        for key, fact_value in sorted(value['facts'].items()):
            encoded = canonical(fact_value)
            if encoded not in fact_value_index:
                fact_value_index[encoded] = len(fact_values)
                fact_values.append(fact_value)
            packed_facts.append([fact_key_index[key], fact_value_index[encoded]])
        compact_parameters.append(packed_facts)
        if value['automatic']:
            automatic_parameters.append([parameter_index, value['automatic']])
    output = {
        'schema': 1,
        'portalTargets': target_pairs,
        'portalRows': portal_rows,
        'categoryTargets': [title(x) for x in target_categories],
        'categoryProfiles': profiles,
        'categoryParamKeys': fact_keys,
        'categoryParamValues': fact_values,
        'categoryParams': compact_parameters,
        'categoryAutomatic': automatic_parameters,
        'categoryContracts': rows,
        'flagCalls': [[r['sourceCall'], r['proposedWikitext']] for r in flags['mappings']],
        'counts': {'categoryPortalRows': len(portal_rows), 'canonicalPortals': len({x[1] for x in target_pairs}), 'categoryTargets': len(target_categories), 'categoryProfiles': len(profiles), 'categoryContracts': len(rows), 'countrySlots': len(flags['countries']), 'fixedFlagCalls': len(flags['mappings'])},
    }
    assert output['counts'] == {'categoryPortalRows': 8337, 'canonicalPortals': 540, 'categoryTargets': 9913, 'categoryProfiles': 43, 'categoryContracts': 10359, 'countrySlots': 195, 'fixedFlagCalls': 1928}, output['counts']
    evidence = {'kind': 'inference-implementation-coverage', 'dataCounts': output['counts'], 'automaticProducerCandidateContracts': sum(x['automaticProducerCandidate'] for x in private_rows), 'automaticProducerCandidateProfiles': dict(Counter(x['profile'] for x in private_rows if x['automaticProducerCandidate'])), 'sourceBodiesNotEmbeddedInRuntime': True, 'sourceContracts': private_rows, 'targetRevalidationRequired': True, 'noClaimOfArticleSourceAudit': True}
    return output, evidence


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--planning-root', required=True, type=Path)
    parser.add_argument('--output', type=Path, default=Path('src/v2_22/inference_data.json'))
    parser.add_argument('--evidence-output', type=Path)
    args = parser.parse_args()
    data, evidence = compile_data(args.planning_root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(canonical(data) + '\n')
    if args.evidence_output:
        args.evidence_output.parent.mkdir(parents=True, exist_ok=True)
        args.evidence_output.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    print(canonical({'counts': data['counts'], 'bytes': args.output.stat().st_size, 'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(), 'automaticProducerCandidateProfiles': evidence['automaticProducerCandidateProfiles']}))


if __name__ == '__main__':
    main()

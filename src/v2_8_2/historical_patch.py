"""Integrate offline, source-bound citation-family restoration."""
import json
from pathlib import Path


def replace(source, before, after):
    if source.count(before) != 1:
        raise ValueError('Historical citation integration anchor is absent or repeated')
    return source.replace(before, after, 1)


def apply(source):
    directory = Path(__file__).parent
    manifest = json.loads((directory / 'HISTORICAL_CITATIONS.json').read_text())
    module = (directory / 'historical_citations.js').read_text().replace(
        '__V282_HISTORICAL_MANIFEST__', json.dumps(manifest, ensure_ascii=False, separators=(',', ':')))
    source = replace(source, '        citations: true, dates: true, links: true, references: true, auxiliaryTemplates: true,',
                     '        historicalCitationRepairs: true, citations: true, dates: true, links: true, references: true, auxiliaryTemplates: true,')
    source = replace(source, '    function v281CitationProfile(raw,profile) {', module + '\n    function v281CitationProfile(raw,profile) {')
    source = replace(source, "        for(const kind of ['infobox','defaultsort','portal'])stage('v27-'+kind,s=>v27SafeAutomationEdits(s,cfg,kind));", "        stage('v282-historical-citations',s=>v282HistoricalCitationEdits(s,cfg));\n        for(const kind of ['infobox','defaultsort','portal'])stage('v27-'+kind,s=>v27SafeAutomationEdits(s,cfg,kind));")
    source = replace(source, "        return JSON.stringify(Object.keys(DEFAULTS).map(key=>[key,cfg[key]===undefined?DEFAULTS[key]:cfg[key]]));",
                     "        return JSON.stringify([Object.keys(DEFAULTS).map(key=>[key,cfg[key]===undefined?DEFAULTS[key]:cfg[key]]),cfg.namespaceNumber,cfg.pageTitle,cfg.sectionOnly,cfg.section,cfg.pageRedirect,cfg.pageDisambiguation,cfg.discussionPage,cfg.contentModel,cfg.model]);")
    source = replace(source, '    function v281CitationRetention(before,after,options={}) {\n',
                     '    function v281CitationRetention(before,after,options={}) {\n        before=v282HistoricalCitationProjection(before,options);after=v282HistoricalCitationProjection(after,options);\n')
    source = replace(source, '        citationNewsProfiles:V281_CITATION_NEWS_PROFILES,v281CitationProfile,v281CitationObligation,v281CitationRetention,',
                     '        historicalCitationManifest:V282_HISTORICAL_CITATIONS,v282HistoricalCitationIdentity,v282HistoricalCitationScope,v282HistoricalCitationEdits,v282HistoricalCitationPlan,v282HistoricalCitationProof,v282HistoricalCitationProjection,\n        citationNewsProfiles:V281_CITATION_NEWS_PROFILES,v281CitationProfile,v281CitationObligation,v281CitationRetention,')
    return source

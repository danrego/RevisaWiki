#!/usr/bin/env python3
"""Independent, read-only AST checks on hash-bound local corpus endpoints.

This oracle does not import or execute the JavaScript under test. A field or
structure outside its finite contracts is reported as ambiguous, never passed
by discarding the unrecognized source. Detailed findings belong in a private
report directory supplied explicitly by the caller.
"""
from __future__ import annotations

import argparse
import collections
import concurrent.futures
import datetime
import gzip
import hashlib
import html
import json
from pathlib import Path
import re
import time
import unicodedata

import mwparserfromhell as mw
from mwparserfromhell import nodes

SCHEMA = 1
PARSER_VERSION = "0.7.2"
CHECKS = ("reference_bindings", "reference_lists", "citation_associations", "table_cells", "protected_literals", "media", "category_sort")
OPAQUE = {"nowiki", "pre", "code", "syntaxhighlight", "source", "math", "chem", "ce", "score", "timeline", "graph"}
FILE_NS = {"file", "image", "ficheiro", "arquivo", "imagem", "fichier", "datei", "bild", "archivo"}
CATEGORY_NS = {"categoria", "category", "catégorie", "kategorie", "categoría"}
COLLECTORS = {"referências", "referencias", "references", "referência", "referencia", "reflist", "notas", "notas e referências", "listaref", "notelist"}
NOTE_EMITTERS = {"nre", "efn", "refn", "nota de rodapé", "nota de rodape", "notetag", "sfn", "sfnm", "harvref", "r"}
FAMILIES = {
    "citar web": "web", "cite web": "web", "lien web": "web", "cita web": "web", "internetquelle": "web",
    "citar livro": "book", "cite book": "book", "ouvrage": "book", "cita libro": "book",
    "citar periódico": "journal", "cite journal": "journal", "cita publicación": "journal", "article": "journal",
    "citar jornal": "news", "cite news": "news", "cita noticia": "news", "lien actualité": "news",
    "citar revista": "magazine", "cite magazine": "magazine", "citation": "generic",
    # Exact local redirect 47999283 forwards to native wrapper 50506646,
    # whose 53648408 module uses the CS1 pressrelease class. This is not a
    # classification inferred from an English template name or its fields.
    "citar comunicado de imprensa": "pressrelease", "cite press release": "pressrelease",
    "citar conferência": "conference", "cite conference": "conference",
    "citar relatório": "report", "cite report": "report",
    "citar vídeo": "video", "cite video": "video",
    "citar enciclopédia": "encyclopedia", "cite encyclopedia": "encyclopedia",
    "citar tese": "thesis", "cite thesis": "thesis",
    "literatur": "book", "cite document": "journal",
}
# These independent finite values are bound to the separate primary
# languageinfo catalog. Foreign names are declared repairs, not rendering
# equivalence of an unknown-language value in the Portuguese native module.
NATIVE_LANGUAGE_NAMES = {'inglês': 'en', 'português': 'pt', 'francês': 'fr', 'espanhol': 'es', 'alemão': 'de', 'italiano': 'it', 'japonês': 'ja', 'chinês': 'zh', 'russo': 'ru', 'neerlandês': 'nl', 'checo': 'cs', 'árabe': 'ar', 'hindi': 'hi', 'coreano': 'ko', 'polaco': 'pl', 'grego': 'el', 'sueco': 'sv'}
FOREIGN_LANGUAGE_NAMES = {'english': 'en', 'portuguese': 'pt', 'french': 'fr', 'français': 'fr', 'spanish': 'es', 'español': 'es', 'german': 'de', 'deutsch': 'de', 'italian': 'it', 'japanese': 'ja', 'chinese': 'zh', 'russian': 'ru', 'dutch': 'nl', 'czech': 'cs', 'arabic': 'ar', 'korean': 'ko', 'polish': 'pl', 'greek': 'el', 'swedish': 'sv', 'anglais': 'en', 'allemand': 'de', 'espagnol': 'es', 'portugais': 'pt', 'italien': 'it', 'englisch': 'en', 'französisch': 'fr', 'spanisch': 'es', 'portugiesisch': 'pt', 'inglés': 'en', 'francés': 'fr', 'alemán': 'de', 'portugués': 'pt', 'afrikaans': 'af', 'bulgarian': 'bg', 'български': 'bg', 'catalan': 'ca', 'català': 'ca', 'danish': 'da', 'dansk': 'da', 'dzongkha': 'dz', 'ཇོང་ཁ': 'dz', 'estonian': 'et', 'eesti': 'et', 'persian': 'fa', 'فارسی': 'fa', 'finnish': 'fi', 'suomi': 'fi', 'galician': 'gl', 'galego': 'gl', 'hebrew': 'he', 'עברית': 'he', 'croatian': 'hr', 'hrvatski': 'hr', 'hungarian': 'hu', 'magyar': 'hu', 'indonesian': 'id', 'bahasa indonesia': 'id', 'icelandic': 'is', 'íslenska': 'is', '日本語': 'ja', 'latin': 'la', 'latina': 'la', 'lithuanian': 'lt', 'lietuvių': 'lt', 'latvian': 'lv', 'latviešu': 'lv', 'macedonian': 'mk', 'македонски': 'mk', 'norwegian bokmål': 'nb', 'norsk bokmål': 'nb', 'nepali': 'ne', 'नेपाली': 'ne', 'norwegian nynorsk': 'nn', 'norsk nynorsk': 'nn', 'serbo-croatian': 'sh', 'srpskohrvatski / српскохрватски': 'sh', 'albanian': 'sq', 'shqip': 'sq', 'tagalog': 'tl', 'turkish': 'tr', 'türkçe': 'tr', 'ukrainian': 'uk', 'українська': 'uk', 'vietnamese': 'vi', 'tiếng việt': 'vi'}
LANGUAGE_LINKS = [{'target': 'Língua francesa', 'code': 'fr', 'labels': ['francês'], 'bareAllowed': True}, {'target': 'Língua neerlandesa', 'code': 'nl', 'labels': ['neerlandês'], 'bareAllowed': True}, {'target': 'Língua holandesa', 'code': 'nl', 'labels': ['holandês'], 'bareAllowed': True}, {'target': 'Língua portuguesa', 'code': 'pt', 'labels': ['Português'], 'bareAllowed': True}, {'target': 'Português brasileiro', 'code': 'pt-br', 'labels': ['Português brasileiro'], 'bareAllowed': True}, {'target': 'Língua inglesa', 'code': 'en', 'labels': ['Inglês'], 'bareAllowed': True}, {'target': 'Língua alemã', 'code': 'de', 'labels': ['alemão'], 'bareAllowed': True}, {'target': 'Língua castelhana', 'code': 'es', 'labels': ['espanhol', 'castelhano'], 'bareAllowed': True}, {'target': 'Spanish language', 'code': 'es', 'labels': ['Spanish'], 'bareAllowed': True}, {'target': 'Língua catalã', 'code': 'ca', 'labels': ['Catalão'], 'bareAllowed': True}, {'target': 'Língua islandesa', 'code': 'is', 'labels': ['Islandês'], 'bareAllowed': True}, {'target': 'Língua hindi', 'code': 'hi', 'labels': ['Hindi'], 'bareAllowed': True}, {'target': 'Língua montenegrina', 'code': 'cnr', 'labels': ['Montenegrino'], 'bareAllowed': True}, {'target': 'Língua nepali', 'code': 'ne', 'labels': ['Nepali'], 'bareAllowed': True}, {'target': 'Língua italiana', 'code': 'it', 'labels': ['italiano'], 'bareAllowed': True}, {'target': 'Língua albanesa', 'code': 'sq', 'labels': ['albanês'], 'bareAllowed': True}, {'target': 'Língua ucraniana', 'code': 'uk', 'labels': ['ucraniana'], 'bareAllowed': True}, {'target': 'Língua árabe', 'code': 'ar', 'labels': ['árabe'], 'bareAllowed': True}, {'target': 'Língua croata', 'code': 'hr', 'labels': ['croata'], 'bareAllowed': False}, {'target': 'Latim', 'code': 'la', 'labels': ['Latim'], 'bareAllowed': True}, {'target': 'Língua sueca', 'code': 'sv', 'labels': ['sueca'], 'bareAllowed': True}, {'target': 'Sueco (idioma)', 'code': 'sv', 'labels': ['Sueco'], 'bareAllowed': False}, {'target': 'Língua norueguesa', 'code': 'no', 'labels': ['Norueguês'], 'bareAllowed': True}, {'target': 'Língua dinamarquesa', 'code': 'da', 'labels': ['Dinamarquês'], 'bareAllowed': True}]


def linked_language(value):
    link = re.fullmatch(r"\[\[([^|\[\]{}<>#\r\n]+)(?:\|([^|\[\]{}<>#\r\n]+))?\]\]", value.strip())
    if not link:
        return None
    target = re.sub(r" +", " ", link[1].strip().replace("_", " "))
    for row in LANGUAGE_LINKS:
        if target[:1].upper() + target[1:] != row["target"][:1].upper() + row["target"][1:]:
            continue
        if link[2] is None:
            return row["code"] if row["bareAllowed"] else None
        return row["code"] if link[2].strip().lower() in [label.lower() for label in row["labels"]] else None
    return None


ALIASES = {}
for role, aliases in {
    "title": ["título", "titulo", "title", "titre", "titel", "titolo", "título-livro", "book-title"],
    "url": ["url", "URL", "adresse", "enlace"],
    "archive_url": ["arquivourl", "arquivo-url", "archive-url", "archiveurl", "urlarchivo", "archive", "archiv-url"],
    "access_date": ["acessodata", "acesso-data", "access-date", "accessdate", "fechaacceso", "consulté le", "abruf"],
    "archive_date": ["arquivodata", "arquivo-data", "archive-date", "archivedate", "fechaarchivo", "archiv-datum"],
    "date": ["data", "date", "fecha", "datum", "data-publicação", "data-publicacao", "publication-date"],
    "year": ["ano", "year", "año", "année", "jahr"],
    "author": ["autor", "author", "auteur"],
    "authors": ["autores", "authors"],
    "first": ["primeiro", "first", "prénom", "vorname", "nome"],
    "last": ["último", "ultimo", "last", "nom", "nachname", "sobrenome", "apellido"],
    "author_link": ["autorlink", "autor-link", "author-link", "authorlink", "lien auteur"],
    "editor": ["editor", "editores", "editors"],
    "editor_first": ["editor-nome", "editor-first", "editor-given", "editor-primeiro"],
    "editor_last": ["editor-sobrenome", "editor-last", "editor-surname"],
    "editor_link": ["editor-link", "editorlink"],
    "editor_mask": ["editor-mascara", "editor-mask", "editormask"],
    "display_authors": ["numero-autores", "display-authors", "displayauthors"],
    "display_editors": ["numero-editores", "displayeditors", "display-editors"],
    "series": ["series", "serie", "série", "séries", "coleção", "Coleção", "colecao", "versão", "version"],
    "others": ["outros", "entrevistador", "entrevistadores", "notas", "interviewer", "interviewers", "otros", "others"],
    "publisher": ["publicado", "editora", "Editora", "editorial", "publisher", "éditeur", "verlag", "produtora", "instituição", "instituicao", "universidade", "grupo-noticias", "distributor", "institution", "newsgroup", "publicadopor", "publicado por"],
    "work": ["publicação", "publicacao", "obra", "website", "work", "jornal", "periódico", "periodico", "journal", "newspaper", "magazine", "périodique", "sito", "werk", "revista", "dicionario", "dicionário", "site", "encyclopedia", "encyclopaedia", "enciclopedia", "enciclopédia", "trabalho", "periodical", "dictionary", "publicación", "diccionario"],
    "language": ["língua", "lingua", "idioma", "language", "in", "língua2", "lingua2", "lingua3", "língua3", "lang", "codling", "ling", "idioma2", "idioma3", "língua4", "idioma4", "lingua4", "langue", "sprache"],
    "location": ["local", "location", "lieu", "ort"],
    "format": ["formato", "format", "formato-arquivo"],
    "quote": ["citação", "citacao", "quote", "citation", "cita"],
    "translated_title": ["titulotrad", "títulotrad", "título-trad", "titulo-trad", "trans-title", "traduction titre"],
    "pages": ["páginas", "paginas", "pages", "página", "pagina", "page", "p", "pp", "seiten"],
    "volume": ["volume", "volumen", "band"], "issue": ["número", "numero", "issue", "number", "numéro"],
    "chapter": ["capítulo", "capitulo", "chapter", "chapitre", "kapitel"],
    "chapter_url": ["capítulourl", "capitulourl", "capítulo-url", "chapter-url", "chapterurl"],
    "edition": ["edição", "edicao", "edition", "edición", "auflage"],
    "dead_url": ["datali", "li", "ligação inativa", "ligação inactiva", "urlmorta", "dead-url", "deadurl"],
    "url_status": ["url-status"],
    "isbn": ["isbn", "ISBN", "ISBN13", "isbn13"], "doi": ["doi", "DOI"],
    "pmid": ["pmid", "PMID"], "pmc": ["pmc", "PMC", "pmcid"],
    "issn": ["issn", "ISSN"], "oclc": ["oclc", "OCLC"], "jstor": ["jstor", "JSTOR"],
    "bibcode": ["bibcode"], "arxiv": ["arxiv", "ARXIV", "eprint"], "ref": ["ref"],
    "postscript": ["pontofinal", "postscript"], "separator": ["separador", "separator"],
    "mode": ["modo", "mode"], "url_access": ["acesso-url", "url-access", "acessourl"],
    "at": ["at", "em", "en"],
    "doi_access": ["doi-access"], "wayb": ["wayb"], "via": ["via"], "agency": ["agência", "agencia", "agency"],
    "hdl": ["hdl", "HDL"], "lccn": ["lccn", "LCCN"], "id": ["id", "ID"],
    "type": ["type", "medium", "tipo", "medio"],
    "subscription": ["subscription", "subscrição", "subscriçao", "subscricao", "suscripción", "assinatura"],
    "registration": ["registo", "registro", "registration", "cadastro"],
}.items():
    for alias in aliases:
        ALIASES[alias] = role
EMPTY_CONTROLS = {"ref", "postscript", "separator", "mode", "dead_url", "url_status"}
DATE_ROLES = {"date", "archive_date", "access_date"}
MONTHS = {}
for number, names in enumerate([
    "janeiro january janvier enero januar gennaio", "fevereiro february février febrero februar febbraio",
    "março march mars marzo märz", "abril april avril aprile", "maio may mai mayo maggio",
    "junho june juin junio juni giugno", "julho july juillet julio juli luglio", "agosto august août agosto",
    "setembro september septembre septiembre settembre", "outubro october octobre octubre oktober ottobre",
    "novembro november novembre noviembre", "dezembro december décembre diciembre dezember dicembre",
], 1):
    for name in names.split():
        MONTHS[name] = number
for number, names in enumerate(["jan", "fev feb", "mar", "abr apr", "mai may", "jun", "jul", "ago aug", "set sep sept", "out oct", "nov", "dez dec"], 1):
    for name in names.split():
        MONTHS[name] = number


def digest(value):
    return hashlib.sha256(value).hexdigest()


def textspace(value):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", html.unescape(str(value)))).strip()


def title(value):
    value = textspace(value).replace("_", " ")
    return value[:1].upper() + value[1:]


def template_name(value):
    value = textspace(value).replace("_", " ")
    value = re.sub(r"^(?:Predefinição|Template)\s*:\s*", "", value, flags=re.I)
    return value[:1].lower() + value[1:]


def freeze(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def attrs(tag):
    return {textspace(attr.name).lower(): textspace(attr.value or "") for attr in tag.attributes}


def params(template):
    return [(textspace(param.name), str(param.value).strip()) for param in template.params]


def date_value(value):
    value = textspace(value)
    value = re.sub(r"^1\.?[ºª](?=\s)", "1", value)
    match = re.fullmatch(r"(\d{4})([-/.])(\d{1,2})\2(\d{1,2})", value)
    if match:
        try:
            return datetime.date(int(match[1]), int(match[3]), int(match[4])).isoformat()
        except ValueError:
            return value
    match = re.fullmatch(r"(\d{1,2})([/.-])(\d{1,2})\2(\d{4})", value)
    if match:
        day, month, year = int(match[1]), int(match[3]), int(match[4])
        # Only the second component above twelve makes month-first numeric
        # notation independently unambiguous. Ambiguous dates keep the existing
        # day-first contract rather than guessing from a surrounding URL.
        if month > 12 and 1 <= day <= 12:
            day, month = month, day
        try:
            return datetime.date(year, month, day).isoformat()
        except ValueError:
            return value
    match = re.fullmatch(r"(\d{4})-(\d{1,2})|(\d{1,2})[-/](\d{4})", value)
    if match:
        year, month = (int(match[1]), int(match[2])) if match[1] else (int(match[4]), int(match[3]))
        if 1 <= month <= 12:
            return "%04d-%02d" % (year, month)
    match = re.fullmatch(r"([\wÀ-ž]+)\.?(?:\s+de)?\s+(\d{4})", value, re.I)
    if match and match[1].lower() in MONTHS:
        return "%04d-%02d" % (int(match[2]), MONTHS[match[1].lower()])
    match = re.fullmatch(r"(\d{1,2})(?:\.?\s+de)?\s+([\wÀ-ž]+)\.?(?:\s+de)?\s+(\d{4})", value, re.I)
    if match and match[2].lower() in MONTHS:
        try:
            return datetime.date(int(match[3]), MONTHS[match[2].lower()], int(match[1])).isoformat()
        except ValueError:
            return value
    match = re.fullmatch(r"([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})", value)
    if match and match[1].lower() in MONTHS:
        try:
            return datetime.date(int(match[3]), MONTHS[match[1].lower()], int(match[2])).isoformat()
        except ValueError:
            return value
    return value


def literal_url(value):
    value = textspace(value)
    match = re.match(r"^((?:https?://){2,4})(\S+)$", value, re.I)
    if match:
        protocols = re.findall(r"https?://", match[1], re.I)
        if len({part.lower() for part in protocols}) == 1:
            return protocols[0].lower() + match[2]
    return value


NATIVE_DATE_FAMILIES = {'citar web', 'cite web', 'citar livro', 'cite book', 'citar jornal', 'cite news',
                        'citar periódico', 'cite journal', 'citar revista', 'cite magazine', 'citation',
                        'citar comunicado de imprensa', 'cite press release', 'citar conferência', 'cite conference',
                        'citar relatório', 'cite report', 'citar vídeo', 'cite video',
                        'citar enciclopédia', 'cite encyclopedia', 'citar tese', 'cite thesis',
                        'literatur', 'cite document'}


def extended_native_date(value):
    """Exact supplied precision for the separately declared format cleanup."""
    value = textspace(value)
    season = re.fullmatch(r'(primavera|verão|outono|inverno) de ([1-9]\d{3})', value, flags=re.I)
    if season:
        return ['season', season[1].lower(), int(season[2])]
    interval = re.fullmatch(r'([A-Za-zÀ-ž]+)\.?[–-]([A-Za-zÀ-ž]+)\.?(?: de)? ([1-9]\d{3})', value, flags=re.I)
    if interval:
        first, last = MONTHS.get(interval[1].lower()), MONTHS.get(interval[2].lower())
        if first and last and first <= last:
            return ['month-range', int(interval[3]), first, last]
    month_first = re.fullmatch(r'([A-Za-zÀ-ž]+)\.? (\d{1,2}),? ([1-9]\d{3})', value, flags=re.I)
    if month_first and month_first[1].lower() in MONTHS:
        try:
            return datetime.date(int(month_first[3]), MONTHS[month_first[1].lower()], int(month_first[2])).isoformat()
        except ValueError:
            pass
    return None


def canonical_id(role, value):
    value = textspace(value)
    if role == "isbn":
        candidate = re.sub(r"^ISBN(?:-1[03])?\s*:?\s*", "", value, flags=re.I)
        candidate = re.sub(r"[ -]", "", candidate).upper()
        if re.fullmatch(r"\d{9}[\dX]", candidate):
            if sum((10 - index) * (10 if digit == "X" else int(digit)) for index, digit in enumerate(candidate)) % 11 == 0:
                return candidate
        elif re.fullmatch(r"\d{13}", candidate):
            if sum(int(digit) * (1 if index % 2 == 0 else 3) for index, digit in enumerate(candidate)) % 10 == 0:
                return candidate
        return value
    if role == "doi":
        candidate = re.sub(r"^(?:https?://(?:dx\.)?doi\.org/|doi\s*:\s*)", "", value, flags=re.I)
        return candidate if re.fullmatch(r"10\.\d{4,9}/[^\s<>\[\]{}|]+", candidate) else value
    if role == "pmid":
        candidate = re.sub(r"^PMID\s*:?\s*", "", value, flags=re.I)
        candidate = re.sub(r"^https?://pubmed\.ncbi\.nlm\.nih\.gov/(\d+)/?$", r"\1", candidate, flags=re.I)
        return candidate if re.fullmatch(r"[1-9]\d{0,8}", candidate) else value
    if role == "pmc":
        candidate = re.sub(r"^PMC\s*:?\s*", "", value, flags=re.I)
        return candidate if re.fullmatch(r"[1-9]\d{0,8}", candidate) else value
    return value


def native_list_items(template):
    """Finite ordered content contract, without discarding style fields."""
    name = template_name(template.name)
    if name not in {"unbulleted list", "plainlist", "lista simples"}:
        return None
    fields = params(template)
    if not fields or len({key for key, _ in fields}) != len(fields):
        return None
    if name == "unbulleted list":
        # Native en source 930012296 delegates positional items to list.
        # Named controls, gaps and multiline item syntax are not projected.
        if [key for key, _ in fields] != [str(number) for number in range(1, len(fields) + 1)]:
            return None
        if any(not value or "\n" in value or "\r" in value for _, value in fields):
            return None
        return [rich(value) for _, value in fields]
    # Native pt Plainlist 62301792 is a literal redirect to Lista simples
    # 69807403. Only its single content argument has this list contract.
    if len(fields) != 1 or fields[0][0] != "1":
        return None
    items, current = [], None
    for node in mw.parse(fields[0][1]).nodes:
        if isinstance(node, nodes.Tag) and textspace(node.tag).lower() == "li":
            if str(node) != "*":
                return None
            if current is not None:
                items.append("".join(current).strip())
            current = []
        elif current is None:
            if str(node).strip():
                return None
        else:
            current.append(str(node))
    if current is not None:
        items.append("".join(current).strip())
    if not items or any(not item or "\n" in item or "\r" in item for item in items):
        return None
    return [rich(item) for item in items]


def rich(value):
    # Independent finite native equivalence, with no arbitrary HTML rendering.
    value = re.sub(r"\[\[([^|\[\]\n:#{}<>&']+)\|('{2,3})([^'\[\]\n{}<>&|]+)\2\]\]",
                   lambda match: match[2] + "[[" + match[1] + "|" + match[3] + "]]" + match[2], str(value))

    def native_link_trail(match):
        target, label = match[1].strip(), match[2]
        if not target or label != label.strip() or re.search(r"[:#{}<>]", target) or re.search(r"[{}<>]", label):
            return match[0]
        lower_first = lambda text: text[:1].lower() + text[1:]
        if lower_first(target) == lower_first(label):
            return "[[" + label + "]]"
        if lower_first(label).startswith(lower_first(target)):
            suffix = label[len(target):]
            if re.fullmatch(r"[a-záéíóúâêôãõç]+", suffix):
                return "[[" + label[:len(target)] + "]]" + suffix
        return match[0]

    value = re.sub(r"\[\[([^\[\]\n|]+)\|([^\[\]\n|]+)\]\]", native_link_trail, value)
    out = []
    for node in mw.parse(value).nodes:
        if isinstance(node, nodes.Wikilink):
            target = title(node.title)
            if target.startswith(':') and node.text is not None and ':' in target[1:]:
                namespace, filename = target[1:].split(':', 1)
                if namespace.lower() in {'file', 'image', 'arquivo', 'ficheiro', 'imagem'}:
                    target = ':Imagem:' + filename
            if ":" in target and not target.startswith(":") and file_namespace(target.split(":", 1)[0]):
                media, _ = media_inventory(mw.parse(str(node)))
                out.append(["media", media])
                continue
            label = str(node.text) if node.text is not None else str(node.title).replace("_", " ")
            content = rich(label)
            # The same whole-label emphasis can enclose the complete link.
            # Keep every nested child and attribute, including literal small
            # markup. No link-target, child, or partial-label rewrite occurs.
            if ":" not in target and "#" not in target and len(content) == 1 and content[0][0] == "emphasis":
                out.append(["emphasis", content[0][1], [["link", target, content[0][2]]]])
            else:
                out.append(["link", target, content])
        elif isinstance(node, nodes.ExternalLink):
            raw_url = str(node.url)
            suffix_at = raw_url.find('{{')
            suffix = mw.parse(raw_url[suffix_at:]) if suffix_at >= 0 else None
            if not node.brackets and node.title is None and suffix is not None and len(suffix.nodes) == 1 and isinstance(suffix.nodes[0], nodes.Template) and template_name(suffix.nodes[0].name) in {'dead link', 'deadlink', 'link quebrado', 'ligação inativa'} and re.fullmatch(r'https?://[^\s{}<>\[\]"\']+', raw_url[:suffix_at]):
                # Native GET proves this exact URL/maintenance-template
                # boundary. The AST's URL node swallows the following call.
                out.append(['external', literal_url(raw_url[:suffix_at]), []])
                out.extend(rich(str(suffix.nodes[0])))
            else:
                out.append(["external", literal_url(node.url), rich(str(node.title or ""))])
        elif isinstance(node, nodes.Tag) and textspace(node.tag).lower() in {"i", "b", "em", "strong"}:
            out.append(["emphasis", {"em": "i", "strong": "b"}.get(textspace(node.tag).lower(), textspace(node.tag).lower()), rich(str(node.contents or ""))])
        elif isinstance(node, nodes.Tag) and textspace(node.tag).lower() in {"div", "span", "small", "big", "sup", "sub", "br", "p", "center", "ul", "li"}:
            out.append(["html", textspace(node.tag).lower(), sorted(attrs(node).items()), rich(str(node.contents or ""))])
        elif isinstance(node, nodes.HTMLEntity):
            out.append(["text", textspace(str(node))])
        else:
            if isinstance(node, nodes.Template):
                if template_name(node.name) in NATIVE_DATE_FAMILIES:
                    payload, uncertainty = citation(node)
                    out.append(['native-citation', payload, uncertainty])
                    continue
                display_name = template_name(node.name)
                if display_name in {'dead link', 'deadlink', 'link quebrado', 'ligação inativa'}:
                    out.append(['native-inactive-link', [[str(param.name), str(param.value)] for param in node.params]])
                    continue
                native_wrappers = {'citation needed': 'carece de fontes', 'fact': 'carece de fontes',
                                   'carece de fontes': 'carece de fontes', 'see also': 'ver também',
                                   'seealso': 'ver também', 'ver também': 'ver também'}
                exact_vt = native_collector_102_title(node.name) == 'VT'
                if display_name in native_wrappers or exact_vt:
                    selected = 'ver também' if exact_vt else native_wrappers[display_name]
                    fields = params(node)
                    if selected == 'carece de fontes' and fields in [[('data', 'Janeiro de 2011')], [('data', 'janeiro de 2011')]]:
                        out.append(['native-maintenance-date', 'Carece de fontes', [['data', 'janeiro de 2011']]])
                    else:
                        out.append(['native-display-wrapper', selected, [[key, rich(value)] for key, value in fields]])
                    continue
                fields = params(node)
                if display_name == 'azul' and len(fields) == 1 and fields[0][0] == '1':
                    out.append(['native-blue-wrapper', rich(fields[0][1])])
                    continue
                if display_name == 'cor do texto' and len(fields) == 2 and [key for key, _ in fields] == ['1', '2'] and fields[0][1] == 'blue':
                    out.append(['native-blue-wrapper', rich(fields[1][1])])
                    continue
                literal = re.sub(r'^(?:[Pp]redefinição|[Tt]emplate)\s*:\s*', '', str(node.name).strip()).replace('_', ' ')
                wrapper = next((role for alias, role in [('refbegin', 'begin'), ('InícioRef', 'begin'), ('refend', 'end'), ('-fim', 'end')]
                                if literal[1:] == alias[1:] and literal[:1].lower() == alias[:1].lower()), None)
                if wrapper is not None:
                    out.append(['native-reference-wrapper', wrapper, [[key, rich(value)] for key, value in params(node)]])
                    continue
                if literal in {'Carece de fontes', 'carece de fontes'} and params(node) in [[('data', 'Janeiro de 2011')], [('data', 'janeiro de 2011')]]:
                    out.append(['native-maintenance-date', 'Carece de fontes', [['data', 'janeiro de 2011']]])
                    continue
                items = native_list_items(node)
                if items is not None:
                    out.append(["unstyled-list", items])
                    continue
                if template_name(node.name) in {"plainlist", "lista simples"}:
                    # A literal native redirect still preserves every field
                    # when the more specific list-content model is ineligible.
                    node.name = "Lista simples"
            raw = str(node)
            if isinstance(node, nodes.Tag) and textspace(node.tag).lower() == 'table':
                raw = re.sub(r'(?m)^(\|-[ \t]+valign=top[ \t]+)\|(?=\r?$)', r'\1', raw)
            text = textspace(raw)
            if text:
                out.append(["text", text])
    return out


def crossed_reference_boundary(code):
    for node in code.nodes:
        if isinstance(node, nodes.Text) and re.search(r"</\s*ref\s*>", str(node), flags=re.I):
            return True
        if isinstance(node, nodes.Tag) and textspace(node.tag).lower() in OPAQUE:
            continue
        for child in node.__children__():
            if crossed_reference_boundary(child):
                return True
    return False


def citation(template):
    name = template_name(template.name)
    if name not in FAMILIES:
        return None, ["unrecognized citation family"]
    entries = params(template)
    roles = []
    ambiguous = []
    if any(crossed_reference_boundary(param.value) for param in template.params):
        ambiguous.append('independent AST citation field crosses a literal reference closing boundary')
    for key, value in entries:
        role = ALIASES.get(key)
        if role is None:
            match = re.fullmatch(r"(.+?)([1-9]\d*)", key)
            if match and ALIASES.get(match[1]) in {"author", "first", "last", "author_link", "editor", "editor_first", "editor_last", "editor_link", "editor_mask"}:
                role = ALIASES[match[1]] + match[2]
            else:
                match = re.fullmatch(r"editor([1-9]\d*)-(first|given|last|surname|link|mask)", key)
                if match:
                    role = {"first": "editor_first", "given": "editor_first", "last": "editor_last", "surname": "editor_last", "link": "editor_link", "mask": "editor_mask"}[match[2]] + match[1]
        if role is None:
            if value:
                ambiguous.append("unmodeled populated citation field " + key)
                role = "unmodeled:" + key
            else:
                continue
        roles.append([role, value])
    counts = collections.Counter(role for role, value in roles)
    state_entries = [[ALIASES[key], key, value] for key, value in entries
                     if ALIASES.get(key) in {"dead_url", "url_status"}]
    conflicting_states = {role for role, key, value in state_entries
                          if len({entry[2] for entry in state_entries if entry[0] == role}) > 1}
    state_precedence = [entry for entry in state_entries if entry[0] in conflicting_states]
    language_entries = [["language", key, value] for key, value in entries
                        if ALIASES.get(key) == "language"]
    language_precedence = language_entries if len({entry[2] for entry in language_entries}) > 1 else []
    dated_entries = [[ALIASES[key], key, extended_native_date(value) or date_value(value)] for key, value in entries
                     if ALIASES.get(key) in DATE_ROLES]
    competing_dates = {role for role, key, value in dated_entries
                       if len({freeze(entry[2]) for entry in dated_entries if entry[0] == role}) > 1}
    date_precedence = [entry for entry in dated_entries if entry[0] in competing_dates]
    split_roles = []
    for role, value in roles:
        if role in {"author", "editor"} and counts[role] == 1 and ";" in value and not re.search(r"[{}<>\[\]]", value):
            parts = value.split(";")
            if 2 <= len(parts) <= 20 and all(textspace(part) for part in parts) and not any(counts[role + str(n)] for n in range(1, 21)):
                split_roles.extend([role if index == 0 else role + str(index + 1), textspace(part)] for index, part in enumerate(parts))
                continue
        split_roles.append([role, value])
    roles = split_roles
    by_role = {role: value for role, value in roles if counts[role] == 1}
    archived = re.fullmatch(r"https?://web\.archive\.org/web/(\d{14})/(https?://\S+)", by_role.get("url", ""))
    if archived and not by_role.get("archive_url") and not by_role.get("archive_date"):
        source_url = by_role["url"]
        stamp, original = archived.groups()
        roles = [[role, original if role == "url" else value] for role, value in roles]
        roles.extend([["archive_url", source_url], ["archive_date", stamp[:4] + "-" + stamp[4:6] + "-" + stamp[6:8]]])
    normalized = []
    for role, value in roles:
        if not value and role not in EMPTY_CONTROLS and all(not other for key, other in roles if key == role):
            continue
        if role in {"isbn", "doi", "pmid", "pmc", "issn", "oclc", "jstor", "bibcode", "arxiv"}:
            data = canonical_id(role, value)
        elif role in DATE_ROLES:
            data = (extended_native_date(value) if name in NATIVE_DATE_FAMILIES else None) or date_value(value)
        elif role == "dead_url":
            # Native DeadURL is distinct from UrlStatus. In particular,
            # "live" has different URL/chapter behavior from "no" in the
            # pinned native implementation. Do not translate its enum here.
            data = {"no": "não", "não": "não", "yes": "sim", "sim": "sim"}.get(value, value)
        elif role.endswith("url") or role == "url":
            data = literal_url(value)
        elif role == "language":
            data = rich(NATIVE_LANGUAGE_NAMES.get(value.lower(), value))
        elif role == "pages":
            data = rich(value)
        else:
            data = rich(value)
        normalized.append([role, data])
    # The pinned native extract_names/list_people path uses the same explicit
    # link for authors and editors. Accept only a unique whole person with no
    # competing given name, surname, mask or first-person alias.
    for person_role in ["author", "editor"]:
        for number in [""] + [str(n) for n in range(1, 21)]:
            role = person_role + number
            link_role = person_role + "_link" + number
            related_numbers = ["", "1"] if number in {"", "1"} else [number]
            forbidden = [prefix + suffix for suffix in related_numbers for prefix in
                         (["first", "last", "author_mask"] if person_role == "author" else
                          ["editor_first", "editor_last", "editor_mask"])]
            alternate = person_role + ("1" if number == "" else "") if number in {"", "1"} else None
            if counts[role] != 1 or counts[link_role] > 1 or any(counts[key] for key in forbidden) or alternate and counts[alternate]:
                continue
            person = next((row for row in normalized if row[0] == role), None)
            link = next((row for row in normalized if row[0] == link_role), None)
            if person and isinstance(person[1], list):
                if not link and len(person[1]) == 1 and person[1][0][0] == "link":
                    target, label = person[1][0][1:]
                    if target and not re.search(r"[:#{}\[\]<>\r\n]", target):
                        person[1] = ["person", target, label]
                elif link and len(link[1]) == 1 and link[1][0][0] == "text":
                    target = title(link[1][0][1])
                    if target and not re.search(r"[:#{}\[\]<>\r\n]", target):
                        person[1] = ["person", target, person[1]]
                        normalized.remove(link)
    if state_precedence:
        normalized.append(["native_state_precedence", state_precedence])
    if language_precedence:
        normalized.append(["native_language_precedence", language_precedence])
    if date_precedence:
        normalized.append(["native_date_precedence", date_precedence])
    identical_roles = {role for role, data in normalized
                       if len({freeze(row[1]) for row in normalized if row[0] == role}) == 1}
    seen_identical = set()
    retained = []
    for row in normalized:
        if row[0] in identical_roles:
            if row[0] in seen_identical:
                continue
            seen_identical.add(row[0])
        retained.append(row)
    # Independent parameter order is immaterial. Repeated unequal values of
    # the same role keep their original order, including an explicit blank
    # override. Identical duplicates may collapse without changing that role.
    retained.sort(key=lambda row: row[0])
    return [FAMILIES[name], retained], ambiguous


def reference_body(value):
    code = mw.parse(value)
    templates = code.filter_templates(recursive=False)
    if len(templates) == 1 and str(code).strip() == str(templates[0]).strip():
        result, ambiguous = citation(templates[0])
        if result is not None:
            return ["citation", result], ambiguous
    trimmed = mw.parse(str(value).strip())
    if len(trimmed.nodes) == 1 and isinstance(trimmed.nodes[0], nodes.ExternalLink) and trimmed.nodes[0].title is not None:
        link = trimmed.nodes[0]
        minimal = nodes.Template("Citar web")
        minimal.add("url", str(link.url))
        minimal.add("título", str(link.title))
        modeled, uncertainty = citation(minimal)
        return ["citation", modeled], uncertainty
    ambiguous = ['independent AST reference body crosses a literal reference closing boundary'] if crossed_reference_boundary(code) else []
    pieces = []
    pending = []
    def flush():
        if pending:
            pieces.extend(rich(''.join(pending)))
            pending.clear()
    for node in code.nodes:
        if isinstance(node, nodes.Template):
            flush()
            result, extra = citation(node)
            pieces.append(["citation", result] if result is not None else ["template", textspace(str(node))])
            ambiguous.extend(extra)
        else:
            pending.append(str(node))
    flush()
    return pieces, ambiguous


def file_namespace(value):
    namespace = str(value).lower()
    if namespace in FILE_NS:
        return True
    # An anonymous native before/after render proved namespace padding does
    # not turn a native embedded file into a plain link. Apply that padding
    # rule only to the five native file namespace aliases.
    return namespace.strip() in {"file", "image", "arquivo", "ficheiro", "imagem"}



def native_collector_102_title(value):
    """Native first-letter identity, without entity/control/Unicode trimming."""
    value = str(value)
    if re.search(r'[^\x20-\x7e\u00c0-\u02ff]', value):
        return None
    value = re.sub(r' +', ' ', value.replace('_', ' ').strip(' '))
    value = re.sub(r'^(?:Predefinição|Template) *: *', '', value, flags=re.I)
    return value[:1].upper() + value[1:]


def native_collector_102(template):
    """Pinned local collectors and their exact redirect, not foreign genres."""
    head = native_collector_102_title(template.name)
    if head not in {'Listaref', 'Notelist', 'Listanota'}:
        return None
    fields = {}
    for param in template.params:
        key, value = str(param.name).strip(' \t\r\n'), str(param.value)
        if key in fields:
            return {'groups': [], 'bank': None, 'ambiguous': True,
                    'selectedBank': None, 'native102': head}
        fields[key] = value
    select = lambda keys, default='': next((fields[key] for key in keys if key in fields), default)
    group = select(['grupo']) if head == 'Listaref' else select(['group', 'grupo'])
    group = group.strip(' \t\r\n')
    if reference_identity_uncertain(group) or re.search(r'[&{}<>|\[\]]', group):
        return {'groups': [], 'bank': None, 'ambiguous': True,
                'selectedBank': None, 'native102': head}
    if head in {'Notelist', 'Listanota'} and group not in {'nota', 'upper-alpha', 'upper-roman', 'lower-alpha', 'lower-greek', 'lower-roman'}:
        group = 'lower-alpha'
    body = select(['refs']) if head == 'Listaref' else select(['refs', 'notes', 'notas'])
    return {'groups': [group], 'bank': group, 'ambiguous': False,
            'selectedBank': body, 'native102': head}


def native_collector_102_raw(template):
    head = native_collector_102_title(template.name)
    if head in {'Listaref', 'Referências'}:
        # Listaref46320561 is an exact redirect. ALL original argument bytes,
        # including ignored group/foreign-bank fields and explicit blanks,
        # remain part of the raw quarantine identity.
        raw = str(template)
        return '{{Referências' + raw[2+len(str(template.name)):]
    if head in {'Notelist', 'Listanota'} and not template.params:
        # Listanota59274856 -> one native headless lower-alpha collector.
        # Only the bare call has this raw lexical projection; no arbitrary
        # parameter/priority/canonicalization waiver is granted.
        return '{{Referências|grupo=lower-alpha|nível=0}}'
    if head == 'Reflist' and not template.params:
        # Bare native Reflist56151616 emits one headless default collector.
        # Keep the uncertain names/bodies opaque; this projects only its wrapper.
        return '{{Referências|nível=0}}'
    if head == 'Reflist' and len(template.params) == 1:
        # Reflist56151616 and Referências63785697 pass this exact literal
        # group to #tag:references and select the same group-based list style.
        # No other supplied field, alias priority, blank or opaque body is
        # normalized by this one-field wrapper projection.
        param = template.params[0]
        key, value = str(param.name).strip(' \t\r\n'), str(param.value)
        if key in {'group', 'grupo'} and re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,63}', value):
            return '{{Referências|grupo=' + value + '|nível=0}}'
        if key == 'refs' and param.showkey and value.strip(' \t\r\n'):
            # The pinned native source and target pass this exact sole refs
            # argument to the same default-group collector. Bind the whole
            # raw bank payload, key, padding and order. Only the headless
            # wrapper differs; no reference body or identity is projected.
            raw = str(template)
            return '{{Referências' + raw[2+len(str(template.name)):-2] + '|nível=0}}'
    return str(template)


def opaque_native_math_efn_102(template):
    """Observe identity only; the complete math note body stays opaque."""
    if native_collector_102_title(template.name) != 'Efn' or len(template.params) != 1:
        return False
    param = template.params[0]
    if str(param.name).strip(' \t\r\n') != '1' or not str(param.value).strip(' \t\r\n'):
        return False
    body = mw.parse(str(param.value))
    return any(isinstance(node, nodes.Tag) and str(node.tag) == 'math' for node in body.nodes) and all(
        isinstance(node, (nodes.Text, nodes.HTMLEntity)) or
        isinstance(node, nodes.Tag) and str(node.tag) == 'math' and not node.self_closing and
        (not node.attributes or len(node.attributes) == 1 and str(node).startswith('<math display="inline">') and str(node).endswith('</math>'))
        for node in body.nodes)


def opaque_native_math_efn_scope_102(code):
    calls = [str(node) for node in code.filter_templates() if opaque_native_math_efn_102(node) and not any(isinstance(parent, nodes.Tag) and str(parent.tag).lower() in OPAQUE - {'code'} for parent in code.get_ancestors(node))]
    if not calls:
        return None
    inventory, _ = reference_inventory(code)
    # No generated suffix/body is calculated. Full opaque raw calls and the
    # complete ordered, resolved outside marker/collector sequence are bound.
    return [calls, inventory['listEvents']]


def collector(template):
    extension = native_collector_102(template)
    if extension is not None:
        return extension
    if template_name(template.name) in {"listaref", "notelist"}:
        return {"groups": [], "bank": None, "ambiguous": True, "selectedBank": None}
    name = template_name(template.name)
    if name not in COLLECTORS:
        return None
    fields = dict(params(template))
    group = fields.get("group", fields.get("grupo", "")) if name == "reflist" else fields.get("grupo", "nota" if name == "notas" else "Nota" if name == "notas e referências" else "")
    if "{{" in group or "<" in group:
        return {"groups": [], "bank": None, "ambiguous": True}
    groups = ["nota", "lower-alpha", group, "nt", ""] if name == "notas e referências" else [group, "lower-alpha"] if name == "notas" else [group]
    return {"groups": list(dict.fromkeys(groups)), "bank": "" if name == "notas e referências" else group, "ambiguous": False}


def native_transparent_content(template):
    # Colunas-lista 69474033 emits exactly {{{2|{{{1|}}} }}}. An
    # explicitly supplied blank 2 overrides 1; style fields are not content.
    if template_name(template.name) != 'colunas-lista':
        return None
    selected = [param for param in template.params if textspace(param.name) == '2']
    if not selected:
        selected = [param for param in template.params if textspace(param.name) == '1']
    return selected[0].value if len(selected) == 1 else None


def reference_identity_uncertain(value):
    value = str(value)
    if re.search(r'[\x00-\x1f\x7f-\x9f\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]', value):
        return True
    for named in re.findall(r'&([A-Za-z][A-Za-z0-9]*);', value):
        if named not in {'amp', 'quot', 'apos', 'lt', 'gt'}:
            return True
    for decimal, hexadecimal in re.findall(r'&#(?:(\d+)|[xX]([A-Fa-f0-9]+));', value):
        codepoint = int(decimal or hexadecimal, 10 if decimal else 16)
        if codepoint < 32 or 127 <= codepoint <= 159 or codepoint > 0x10ffff or 0xd800 <= codepoint <= 0xdfff or codepoint in {0xa0, 0x1680, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff} or 0x2000 <= codepoint <= 0x200b:
            return True
    return False


def native_reference_lexical_102(template):
    """Finite native lexical identities without resolving opaque note bodies."""
    raw = str(template)
    if str(template.tag) != 'ref' or any(str(attr.name) not in {'name', 'group'} for attr in template.attributes):
        return raw
    if template.self_closing:
        # Whitespace outside the quoted attributes and before the extension's
        # self-closing slash is syntax, never part of a reference identity.
        if all(attr.quotes in {'"', "'"} for attr in template.attributes):
            return re.sub(r'[ \t]*/>$', '/>', raw)
        return raw
    body = mw.parse(str(template.contents))
    calls = [node for node in body.nodes if isinstance(node, nodes.Template)]
    if len(calls) != 1 or any(not isinstance(node, nodes.Template) and (not isinstance(node, nodes.Text) or str(node).strip(' \t\r\n')) for node in body.nodes):
        return raw
    call = calls[0]
    if native_collector_102_title(call.name) not in {'Citar web', 'Citar periódico'}:
        return raw
    # Only one supplied Page role and/or Volume role, on these pinned local
    # CS1 families. Named numeric argument edge padding is stripped by the
    # native template call. All other keys, values, bodies and attributes stay
    # raw; this does not grant a citation-wide semantic projection.
    for keys in [{'página', 'páginas', 'p', 'pp'}, {'volume'}]:
        selected = [param for param in call.params if str(param.name).strip(' \t\r\n') in keys]
        if len(selected) != 1 or not selected[0].showkey:
            continue
        param = selected[0]
        value = str(param.value)
        if re.fullmatch(r'[ \t]*[0-9]+(?:[–-][0-9]+)?[ \t]*', value):
            param.value = value.strip(' \t')
    copy = mw.parse(raw).nodes[0]
    copy.contents = body
    return str(copy)


def raw_reference_subsystem(code):
    rows, uncertain = [], False
    def visit(part):
        nonlocal uncertain
        for index, node in enumerate(part.nodes):
            if isinstance(node, nodes.Comment):
                continue
            if isinstance(node, (nodes.Text, nodes.HTMLEntity)):
                if index and isinstance(part.nodes[index - 1], (nodes.Text, nodes.HTMLEntity)):
                    continue
                run = []
                for child in part.nodes[index:]:
                    if not isinstance(child, (nodes.Text, nodes.HTMLEntity)):
                        break
                    run.append(str(child))
                # A complete opening token can remain an AST text node when
                # its closing reference is missing. Observe that supplied
                # identity without inventing a closing tag or a body.
                for hit in re.finditer(r'''<ref\b((?:"[^"]*"|'[^']*'|[^'">])*)>''', ''.join(run), flags=re.I):
                    opening = hit.group(0)
                    named = list(re.finditer(r'''(?:^|\s)(name|group)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))''', hit[1], flags=re.I))
                    if named:
                        rows.append(['partial-opening', opening])
                        uncertain |= any(reference_identity_uncertain(next(value for value in match.groups()[1:] if value is not None)) for match in named)
                continue
            if isinstance(node, nodes.Tag):
                name = textspace(node.tag).lower()
                if name in OPAQUE - {'code'}:
                    continue
                opening = re.match(r'''^<[A-Za-z][A-Za-z0-9:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>''', str(node))
                if opening and re.search(r'\{\{\s*(?:(?:predefinição|template)\s*:\s*)?(?:r(?:/ref)?|referências[ _]+múltiplas|refn|nre|efn|sfn(?:p|m|mp)?|harvref|#tag\s*:\s*ref)(?=[\s|}])', opening[0], flags=re.I):
                    rows.append(['unproved-attribute-emitter', opening[0]])
                    uncertain = True
                if name in {'ref', 'references'}:
                    uncertain |= any(textspace(attr.name).lower() in {'name', 'group'} and reference_identity_uncertain(attr.value or '') for attr in node.attributes)
                    rows.append([name, native_reference_lexical_102(node) if name == 'ref' else str(node)])
                    continue
            if isinstance(node, nodes.Template) and collector(node) is not None:
                rows.append(['collector', native_collector_102_raw(node)])
                for param in node.params:
                    if str(param.name).strip(' \t\r\n') in {'group', 'grupo'}:
                        uncertain |= reference_identity_uncertain(str(param.value).strip(' \t\r\n'))
                    if '<ref' in str(param.value).lower():
                        visit(param.value)
                continue
            if isinstance(node, nodes.Template) and (native_reference_template(node) is not None or template_name(node.name) in NOTE_EMITTERS | {'sfnmp', '#tag:ref'}):
                name = template_name(node.name)
                native = native_reference_template(node)
                if native is not None and not native['eligible'] and not opaque_native_math_efn_102(node):
                    uncertain = True
                rows.append(['emitter', str(node)])
                for param in node.params:
                    key = str(param.name).strip(' \t\r\n')
                    if key in {'name', 'nome', 'follow', 'group', 'grupo'} or name == 'r' and (key.isdigit() or key == 'g'):
                        # Template argument entities do not share the raw-tag
                        # attribute decoder. Keep this a conservative exact
                        # identity boundary, without asserting equivalence.
                        uncertain |= reference_identity_uncertain(str(param.value).strip(' \t\r\n'))
                continue
            for child in node.__children__():
                visit(child)
    visit(code)
    return rows, uncertain


def native_note_template(template):
    # Independent finite interpretation of the pinned native wrapper source.
    head = re.sub(r'[ \t]+', ' ', str(template.name).replace('_', ' ').strip())
    head = re.sub(r'^(?:Predefinição|Template)\s*:\s*', '', head, flags=re.I)
    if re.fullmatch(r'[Ss]fn(?:p|m|mp)?|[Hh]arvRef', head):
        return {'eligible': False, 'generated': True}
    refn = bool(re.fullmatch(r'[Rr]efn', head))
    note = bool(re.fullmatch(r'[Nn]re|[Ee]fn', head))
    tag = bool(re.fullmatch(r'#tag\s*:\s*ref', head))
    if not (refn or note or tag):
        return None
    fields, seen = [], set()
    for param in template.params:
        key, value = str(param.name).strip(' \t\r\n'), str(param.value)
        allowed = {'1', 'name', 'group'} | ({'refn'} if refn else {'nome', 'grupo', 'reference', 'content', 'text', 'referência', 'conteúdo', 'texto'} if note else set())
        if key in seen or key not in allowed or re.search(r'[{}<>\ue000-\uf8ff]', value):
            return {'eligible': False}
        seen.add(key)
        fields.append((key, value))
    field_map = dict(fields)
    select = lambda keys: next((field_map[key] for key in keys if key in field_map), '')
    name = select(['name', 'nome'] if note else ['name'])
    group = select(['group', 'grupo'] if note else ['group'])
    body_keys = ['1'] if tag else ['1', 'refn'] if refn else ['1', 'reference', 'content', 'text', 'referência', 'conteúdo', 'texto']
    body = select(body_keys)
    if sum(key in field_map for key in ['name', 'nome']) > 1 or sum(key in field_map for key in ['group', 'grupo']) > 1 or sum(key in field_map for key in body_keys) > 1 or any(value != value.strip() or re.search(r'''[&\[\]|"']''', value) or reference_identity_uncertain(value) for value in [name, group]):
        return {'eligible': False}
    if note:
        accepted = {'nota', 'upper-alpha', 'upper-roman', 'lower-alpha', 'lower-greek', 'lower-roman'}
        group = (field_map.get('group', '') if name else group) if group.strip() in accepted else 'lower-alpha'
    return {'eligible': True, 'names': [name], 'group': group, 'body': body or None,
            'context': ['native-note', [(key, value) for key, value in fields if key not in {'name', 'nome'}]]}


def native_reference_template(template):
    head = re.sub(r'[ \t]+', ' ', str(template.name).replace('_', ' ').strip())
    head = re.sub(r'^(?:Predefinição|Template)\s*:\s*', '', head, flags=re.I)
    child = bool(re.fullmatch(r'[Rr]/ref', head))
    if not child and not re.fullmatch(r'[Rr]|[Rr]eferências múltiplas', head):
        return native_note_template(template)
    fields, seen = [], set()
    for param in template.params:
        key, value = str(param.name).strip(' \t\r\n'), str(param.value)
        allowed = bool(re.fullmatch(r'[1-4]', key)) if child else bool(re.fullmatch(r'[1-9]|(?:p|page|pp|pages|q|quote)[1-9]', key)) or key in {'group', 'grp', 'g', 'grupo', 'p', 'page', 'pp', 'pages', 'q', 'quote'}
        if key in seen or not allowed or re.search(r'[{}<>\ue000-\uf8ff]', value):
            return {'eligible': False}
        seen.add(key)
        fields.append((key, value))
    field_map = dict(fields)
    group = next((field_map[key] for key in (['2'] if child else ['group', 'grp', 'g']) if key in field_map), '')
    identities = [group] + [value for key, value in fields if key.isdigit()]
    if not field_map.get('1') or child and '2' not in field_map or any(value != value.strip(' \t\r\n') or re.search(r'''[\[\]|&"']''', value) or reference_identity_uncertain(value) for value in identities):
        return {'eligible': False}
    name_keys = {'1'} if child else {str(index) for index in range(1, 10)}
    names = [field_map[str(index)] for index in range(1, 2 if child else 10) if field_map.get(str(index))]
    context = ['child' if child else 'multiple', [(key, value) for key, value in fields if key not in name_keys]]
    return {'eligible': True, 'names': names, 'group': group, 'context': context}


def reference_inventory(code, node_bindings=None):
    refs, collectors, ambiguities, opaque_emitters, events, helper_contexts = [], [], [], [], [], []
    regions = collections.defaultdict(int)

    def consume(groups):
        for group in groups:
            regions[group] += 1

    def visit(part, inherited="", bank=False, opaque=False):
        for node in part.nodes:
            if isinstance(node, nodes.Tag):
                name = textspace(node.tag).lower()
                if name in OPAQUE - {'code'}:
                    continue
                fields = attrs(node)
                if name == "ref":
                    for attribute in node.attributes:
                        key = textspace(attribute.name).lower()
                        if key in {"group", "name", "follow", "details"}:
                            fields[key] = str(attribute.value or '') if reference_identity_uncertain(attribute.value or '') else html.unescape(str(attribute.value or '')).strip(' \t\r\n')
                    body = str(node.contents or "") if not node.self_closing else ""
                    payload, extra = reference_body(body) if body.strip() else (None, [])
                    ambiguities.extend("reference body: " + reason for reason in extra)
                    group = fields.get("group") or inherited
                    refs.append({"nodeIdentity": id(node), "group": group, "region": regions[group], "name": fields.get("name", ""),
                                 "follow": fields.get("follow"), "details": fields.get("details"), "body": payload,
                                 "rawBody": body, "opaque": bool(extra), "bank": bank})
                    if not bank:
                        events.append(["marker", len(refs) - 1])
                    continue
                if name == "references":
                    group = fields.get("group", "")
                    if node.has("group"):
                        group = str(node.get('group').value or '') if reference_identity_uncertain(node.get('group').value or '') else html.unescape(str(node.get('group').value or '')).strip(' \t\r\n')
                    collectors.append(group)
                    visit(node.contents or mw.parse(""), group, True)
                    events.append(["collector", [group]])
                    consume([group])
                    continue
                if node.contents is not None:
                    visit(node.contents, inherited, bank)
            elif isinstance(node, nodes.Template):
                helper = native_reference_template(node)
                if helper is not None and helper['eligible']:
                    helper_contexts.append(helper['context'])
                    if bank:
                        ambiguities.append('native template reuse inside a definition bank is unproved')
                    for name in helper['names']:
                        group, body = helper['group'], helper.get('body')
                        payload, extra = reference_body(body) if body else (None, [])
                        ambiguities.extend('native note body: ' + reason for reason in extra)
                        refs.append({'nodeIdentity': id(node), 'group': group, 'region': regions[group], 'name': name,
                                     'follow': None, 'details': None, 'body': payload, 'rawBody': body or '', 'opaque': bool(extra), 'bank': bank})
                        if not bank:
                            events.append(['marker', len(refs) - 1])
                    continue
                model = collector(node)
                if model is not None:
                    collectors.extend(model["groups"])
                    if model["ambiguous"]:
                        ambiguities.append("dynamic native reference collector group")
                    bank_values = ([model['selectedBank']] if model.get('selectedBank') is not None else []) if 'selectedBank' in model else [value for key, value in params(node) if key in {"refs", "referências", "1"}]
                    for value in bank_values:
                        if "<ref" in value.lower():
                            if model["bank"] is None:
                                ambiguities.append("unresolved collector bank inheritance")
                            else:
                                visit(mw.parse(value), model["bank"], True)
                    events.append(["collector", model["groups"]])
                    consume(model["groups"])
                    continue
                content = native_transparent_content(node)
                if content is not None:
                    visit(content, inherited, bank)
                    continue
                if helper is not None or template_name(node.name) in NOTE_EMITTERS:
                    ambiguities.append("template-generated reference emission is not expanded")
                    opaque_emitters.append([inherited, bank, list(collectors), digest(str(node).encode())])
                    events.append(["opaque-emitter", inherited, bank, digest(str(node).encode())])
                for param in node.params:
                    if "<ref" in str(param.value).lower() or re.search(r'\{\{\s*(?:(?:predefinição|template)\s*:\s*)?(?:r(?:/ref)?|referências[ _]+múltiplas|refn|nre|efn|sfn(?:p|m|mp)?|harvref|#tag\s*:\s*ref)(?=[\s|}])', str(param.value), flags=re.I):
                        ambiguities.append("reference inside an unexpanded enclosing template")
                        events.append(["opaque-owner", digest(str(node).encode())])
                        visit(param.value, inherited, bank)
            elif isinstance(node, nodes.Wikilink) and node.text is not None:
                target = str(node.title).strip()
                if not target.startswith(":") and ":" in target and file_namespace(target.split(":", 1)[0]):
                    # A named definition can move to an earlier rendered image
                    # caption without changing any marker's resolved source.
                    visit(node.text, inherited, bank)
                elif "<ref" in str(node.text).lower():
                    ambiguities.append("reference inside an ordinary link label needs a native witness")
                    visit(node.text, inherited, bank)
            elif isinstance(node, nodes.Heading):
                visit(node.title, inherited, bank)

    visit(code)
    definitions = collections.defaultdict(list)
    for ref in refs:
        if ref["body"] is not None and ref["name"] and not ref["follow"]:
            payload = freeze(ref["body"])
            if payload not in definitions[(ref["group"], ref["region"], ref["name"])]:
                definitions[(ref["group"], ref["region"], ref["name"])].append(payload)
    if any(len(bodies) > 1 for bodies in definitions.values()):
        ambiguities.append("conflicting named reference definitions require native precedence")
    opaque_definitions = collections.defaultdict(set)
    for ref in refs:
        if ref["opaque"] and ref["name"]:
            opaque_definitions[(ref["group"], ref["region"], ref["name"])].add(digest(ref["rawBody"].encode()))
    opaque_associations = []
    bindings = []
    for ref in refs:
        opaque = [digest(ref["rawBody"].encode())] if ref["opaque"] else sorted(opaque_definitions.get((ref["group"], ref["region"], ref["name"]), [])) if ref["body"] is None else []
        if opaque:
            opaque_associations.append([ref["group"], ref["region"], ref["name"], ref["bank"], ref["follow"], ref["details"],
                                        "definition" if ref["body"] is not None else "call", opaque])
        if ref["bank"]:
            continue
        if ref["follow"] or ref["details"]:
            ambiguities.append("follow/details reference semantics require a native witness")
        bodies = [freeze(ref["body"])] if ref["body"] is not None else definitions.get((ref["group"], ref["region"], ref["name"]), [])
        binding = [ref["group"], "resolved", sorted(bodies)] if bodies else [ref["group"], "unresolved", ref["name"]]
        ref["binding"] = binding
        if node_bindings is not None:
            node_bindings[ref['nodeIdentity']] = binding
        bindings.append(binding)
    pending = collections.defaultdict(list)
    rendered, list_events = [], []
    for event in events:
        if event[0] == "marker":
            binding = refs[event[1]]["binding"]
            pending[binding[0]].append(binding)
            list_events.append(["marker", binding])
        elif event[0] == "collector":
            list_events.append(event)
            for group in event[1]:
                if pending[group]:
                    rendered.append([group, list(pending[group])])
                    pending[group].clear()
        else:
            list_events.append(event)
    remaining = sorted([group, rows] for group, rows in pending.items() if rows)
    payloads = sorted(set(freeze([ref["group"], ref["body"]]) for ref in refs if ref["body"] is not None))
    raw_named = collections.defaultdict(list)
    for ref in refs:
        if ref["name"] and ref["body"] is not None and not ref["follow"]:
            raw_named[(ref["group"], ref["region"], ref["name"])].append(digest(ref["rawBody"].encode()))
    return {"bindings": bindings, "definitionPayloads": payloads,
            "rawNamedDefinitions": {freeze(key): value for key, value in raw_named.items()},
            "definitions": sorted([group, region, name, sorted(bodies)] for (group, region, name), bodies in definitions.items()),
            "opaqueBodyAssociations": opaque_associations,
            "opaqueEmitters": opaque_emitters,
            "nativeHelperContexts": helper_contexts,
            "rawMarkers": sum(not ref["bank"] for ref in refs), "groups": sorted(set(collectors)),
            "renderedLists": rendered, "unrenderedMarkers": remaining, "listEvents": list_events}, sorted(set(ambiguities))


def reference_list_comparison(before, after, ambiguities):
    original = [before["renderedLists"], before["unrenderedMarkers"]]
    current = [after["renderedLists"], after["unrenderedMarkers"]]
    uncertainty = list(ambiguities)
    opaque_events = [event for event in before["listEvents"] if event[0].startswith("opaque-")]
    unchanged_scope = bool(opaque_events) and before["listEvents"] == after["listEvents"]
    if unchanged_scope:
        uncertainty = [reason for reason in uncertainty if reason not in {
            "template-generated reference emission is not expanded", "reference inside an unexpanded enclosing template"}]
    additions = 0
    # A newly supplied renderer may consume one complete previously unrendered
    # group. Every existing list must keep its exact position relative to the
    # other existing lists and its complete ordered marker payloads. Never
    # merge, split, delete or reassign a source list to another group.
    if original != current and not uncertainty:
        expected, index = before["renderedLists"], 0
        available = {group: rows for group, rows in before["unrenderedMarkers"]}
        valid = True
        for row in after["renderedLists"]:
            if index < len(expected) and row == expected[index]:
                index += 1
            elif row[0] in available and row[1] == available[row[0]]:
                del available[row[0]]
                additions += 1
            else:
                valid = False
                break
        if valid and index == len(expected) and sorted(available.items()) == [(group, rows) for group, rows in after["unrenderedMarkers"]]:
            original = current
        else:
            additions = 0
    return original, current, sorted(set(uncertainty)), {
        "sourceRenderedLists": len(before["renderedLists"]), "outputRenderedLists": len(after["renderedLists"]),
        "sourceUnrenderedMarkers": sum(len(rows) for group, rows in before["unrenderedMarkers"]),
        "outputUnrenderedMarkers": sum(len(rows) for group, rows in after["unrenderedMarkers"]),
        "newRenderersProvedFromExactPendingGroup": additions,
        "sourceOpaqueScopes": len(opaque_events),
        "outputOpaqueScopes": sum(event[0].startswith("opaque-") for event in after["listEvents"]),
        "opaqueScopesProvedByteExact": len(opaque_events) if unchanged_scope else 0}


def citation_inventory(code):
    result, ambiguities = [], []
    for template in code.filter_templates():
        if template_name(template.name) not in FAMILIES:
            fields = params(template)
            roles = {ALIASES.get(key) for key, value in fields if value}
            if not template_name(template.name).startswith("info/") and (
                roles.intersection({"isbn", "doi", "pmid", "pmc"}) or {"title", "url"}.issubset(roles)
            ):
                result.append(freeze(["unexpanded-citation-candidate", textspace(str(template))]))
                ambiguities.append("unexpanded citation candidate with populated identifying fields")
            continue
        item, extra = citation(template)
        result.append(freeze(item))
        ambiguities.extend(extra)
    for tag in code.filter_tags(matches=lambda node: textspace(node.tag).lower() == "ref" and not node.self_closing):
        body = mw.parse(str(tag.contents or "").strip())
        if len(body.nodes) == 1 and isinstance(body.nodes[0], nodes.ExternalLink) and body.nodes[0].title is not None:
            item, extra = reference_body(str(body))
            if item and item[0] == "citation":
                result.append(freeze(item[1]))
                ambiguities.extend(extra)
    # Native equal reference definitions can be deduplicated. Require all
    # distinct complete citation associations, without counting raw copies.
    return sorted(set(result)), sorted(set(ambiguities))


def opaque_citation_inventory(code):
    calls = collections.Counter()
    for template in code.filter_templates():
        name = template_name(template.name)
        if name in FAMILIES:
            _, uncertainty = citation(template)
            opaque = bool(uncertainty)
        else:
            roles = {ALIASES.get(key) for key, value in params(template) if value}
            opaque = not name.startswith("info/") and bool(roles.intersection({"isbn", "doi", "pmid", "pmc"}) or {"title", "url"}.issubset(roles))
        if opaque:
            calls[digest(str(template).encode())] += 1
    return calls


def native_table_line_reset_view(raw):
    """Keep the native cell boundary lost by the independent emphasis parser.

    The pinned native pair retains distinct bold headers. Closing the one
    supplied leading run in this parser view removes no content or attributes.
    """
    if not raw.startswith('{|') or raw.count('{|') != 1 or raw.count('|}') != 1:
        return raw
    initial = raw
    parsed = mw.parse(raw)
    if not parsed.filter_templates() and not parsed.filter_comments() and not any(
            textspace(tag.tag).lower() in OPAQUE for tag in parsed.filter_tags()):
        raw = re.sub(r'(?m)^(\|-[ \t]*\r?\n)(?:\|-[ \t]*\r?\n)+', r'\1', raw)
    lines, changed = raw.splitlines(keepends=True), raw != initial
    for index, line in enumerate(lines[1:], 1):
        if line.startswith('|-') or line.startswith('|') and not line.startswith('|+'):
            break
        match = re.fullmatch(r"(!(?:[ \t]+scope=\"col\"[ \t]*\|[ \t]*)?)('''[^\r\n]*)(\r?\n|$)", line)
        if not match or match[2].count("'''") != 1:
            continue
        body = mw.parse(match[2][3:])
        if body.filter_comments() or any(textspace(tag.tag).lower() in OPAQUE for tag in body.filter_tags()):
            continue
        if str(body).count('<ref') != len(body.filter_tags(matches=lambda tag: textspace(tag.tag).lower() == 'ref')):
            continue
        lines[index] = match[1] + match[2] + "'''" + match[3]
        changed = True
    return ''.join(lines) if changed else raw


def table_inventory(code, source):
    result, ambiguities = [], []
    tables = code.filter_tags(matches=lambda node: textspace(node.tag).lower() == "table")
    wiki_tables = [tag for tag in tables if tag.wiki_markup]
    if source.count("{|") != len(wiki_tables) or source.count("|}") != len(wiki_tables):
        ambiguities.append("literal table delimiters and independent AST disagree")
    for table in tables:
        view = native_table_line_reset_view(str(table)) if table.wiki_markup else str(table)
        if view != str(table):
            recovered = mw.parse(view).filter_tags(matches=lambda node: textspace(node.tag).lower() == 'table')
            if len(recovered) == 1:
                table = recovered[0]
        cells, rows, parent_context = [], [], {}

        def index_parents(part, parents=()):
            for child in part.nodes:
                parent_context[id(child)] = parents
                for descendants in child.__children__():
                    index_parents(descendants, parents + (child,))

        index_parents(table.contents)
        table_ancestors = lambda node: parent_context.get(id(node), ())
        owned = lambda node: not any(isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() == 'table'
                                     for parent in table_ancestors(node))
        all_rows = [row for row in table.contents.filter_tags(matches=lambda node: textspace(node.tag).lower() == 'tr') if owned(row)]
        row_ids = {}
        implicit = [cell for cell in table.contents.filter_tags(matches=lambda node: textspace(node.tag).lower() in {'td', 'th'})
                    if owned(cell) and not any(isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() == 'tr'
                                              for parent in table_ancestors(cell))]
        if implicit:
            rows.append([[], len(implicit)])
        for row in all_rows:
            content = [cell for cell in row.contents.filter_tags(matches=lambda node: textspace(node.tag).lower() in {'td', 'th'})
                       if owned(cell) and next((parent for parent in reversed(table_ancestors(cell))
                                               if isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() == 'tr'), None) is row]
            attributes = sorted(attrs(row).items())
            # The native pair proves only an entirely empty attribute-free
            # row marker can disappear. A supplied row attribute stays bound.
            if row.wiki_markup == '|-' and not content and not attributes and not str(row.contents).strip():
                continue
            row_ids[id(row)] = len(rows)
            rows.append([attributes, len(content)])
        for cell in table.contents.filter_tags(matches=lambda node: textspace(node.tag).lower() in {"td", "th"}):
            if not owned(cell):
                ambiguities.append('nested table cell needs a separate parent-grid contract')
                continue
            fields = attrs(cell)
            spans = []
            for key in ["rowspan", "colspan"]:
                value = fields.get(key, "1")
                if not re.fullmatch(r"[1-9]\d*", value):
                    ambiguities.append("nonnumeric table span")
                spans.append(value)
            body = mw.parse(str(cell.contents))
            for tag in reversed(body.filter_tags(matches=lambda node: textspace(node.tag).lower() == "ref")):
                try:
                    body.replace(tag, "")
                except ValueError:
                    pass
            row = next((parent for parent in reversed(table_ancestors(cell))
                        if isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() == 'tr'), None)
            row_id = row_ids.get(id(row)) if row is not None else 0
            if row_id is None:
                ambiguities.append('cell row ownership was not independently resolved')
            cells.append([textspace(cell.tag).lower(), rich(str(body)), spans, fields.get("data-sort-value"), row_id])
        result.append({'cells': cells, 'rows': rows})
    return result, sorted(set(ambiguities))


def ast_literal_ranges(code):
    """Locate serialized native literal nodes without a production scanner.

    AST child order follows serialization order. Every nested offset is checked
    against its exact parent slice before it can mask a fence-like text line.
    """
    result = []

    def visit(part, base):
        offset = base
        for node in part.nodes:
            raw = str(node)
            if isinstance(node, nodes.Comment) or isinstance(node, nodes.Tag) and textspace(node.tag).lower() in OPAQUE:
                result.append((offset, offset + len(raw)))
            else:
                cursor = 0
                for child in node.__children__():
                    value = str(child)
                    if not value:
                        continue
                    at = raw.find(value, cursor)
                    if at < 0:
                        raise ValueError("AST child is not an exact ordered slice of its serialized parent")
                    visit(child, offset + at)
                    cursor = at + len(value)
            offset += len(raw)

    visit(code, 0)
    return sorted(result)


def markdown_literals(code):
    """Read exact contextual fences, including an unfinished literal tail.

    A native opaque tag or comment cannot open an outside fence. Once a fence
    opens, tag-like text inside it cannot hide its matching closing fence.
    """
    raw = str(code)
    if '```' not in raw and '~~~' not in raw:
        return []
    native, result, opened = ast_literal_ranges(code), [], None
    for line in re.finditer(r"^[ \t]{0,3}(`{3,}|~{3,})([^\r\n]*)(?:\r?\n|$)", raw, re.M):
        marker = line.group(1)
        if opened is None:
            if any(start <= line.start() < end for start, end in native):
                continue
            opened = {"start": line.start(), "marker": marker, "closed": False}
        elif marker[0] == opened["marker"][0] and len(marker) >= len(opened["marker"]) and not line.group(2).strip():
            opened.update(end=line.end(), raw=raw[opened["start"]:line.end()], closed=True)
            result.append(opened)
            opened = None
    if opened is not None:
        opened.update(end=len(raw), raw=raw[opened["start"]:])
        result.append(opened)
    return result


def whole_page_markdown_wrapper(raw, fences):
    return len(fences) == 1 and fences[0]["closed"] and not raw[:fences[0]["start"]].strip() and not raw[fences[0]["end"]:].strip()


def protected_inventory(code, fences=None):
    counter = collections.Counter(str(node) for node in code.filter_comments())
    for node in code.filter_tags(matches=lambda tag: textspace(tag.tag).lower() in OPAQUE):
        counter[str(node)] += 1
    for fence in markdown_literals(code) if fences is None else fences:
        counter["markdown-fence:" + fence["raw"]] += 1
    return sorted(counter.items())


NATIVE_IMAGE_OPTION_ALIASES = ['linhadebase', 'baseline', 'borda', 'border', 'abaixo', 'bottom', 'centro', 'center', 'centre', 'commoldura', 'comborda', 'frame', 'framed', 'enframed', 'semmoldura', 'semborda', 'frameless', 'esquerda', 'left', 'ligação=$1', 'link=$1', 'miniaturadaimagem=$1', 'miniatura=$1', 'thumbnail=$1', 'thumb=$1', 'meio', 'middle', 'nenhum', 'none', 'página=$1', 'página_$1', 'página $1', 'page=$1', 'page $1', 'direita', 'right', 'miniaturadaimagem', 'miniatura', 'thumb', 'thumbnail', 'acima', 'top', 'superiordireito', 'superiordireito=$1', 'superiordireito_$1', 'superiordireito $1', 'upright', 'upright=$1', 'upright $1', 'lossy=$1', 'alt=$1', 'class=$1', 'lang=$1', 'sub', 'super', 'sup', 'text-bottom', 'text-top', '$1px']


def native_infobox_media(code):
    """Finite native image fields, with no competing alias inference."""
    contracts = {
        'Info/Biografia': (['imagem', 'foto'], ['imagem tamanho', 'imagem_tamanho', 'imagemtamanho'], ['legenda', 'imagem_legenda', 'desc']),
        'Info/Político': (['imagem', 'foto', 'image'], ['imagem-tamanho', 'imagem_tamanho', 'imagemtamanho', 'tamanho_imagem'], ['legenda', 'imagem_legenda']),
        'Info/Música/artista': (['imagem'], ['imagem-tamanho', 'imagem_tamanho'], ['legenda', 'imagem_legenda']),
        'Info/Militar': (['imagem'], ['imagem_tamanho'], ['imagem_legenda', 'legenda']),
        'Info/Combatente militar': (['imagem'], ['imagem_tamanho'], ['imagem_legenda', 'legenda']),
        'Info/Ator': (['imagem'], ['imagem_tamanho', 'imagem-tamanho', 'tamanho_imagem'], ['descrição', 'legenda', 'imagem_legenda']),
        'Info/Escritor': (['imagem', 'foto'], ['imagem tamanho', 'imagem_tamanho', 'imagemtamanho'], ['legenda', 'imagem_legenda', 'desc']),
        'Info/Jornalista': (['imagem', 'foto'], ['imagem tamanho', 'imagem_tamanho', 'imagemtamanho'], ['legenda', 'imagem_legenda', 'desc']),
    }
    rows, skipped, ambiguities = [], set(), []
    for template in code.filter_templates():
        literal = re.sub(r'^(?:[Pp]redefinição|[Tt]emplate)\s*:\s*', '', str(template.name).strip()).replace('_', ' ')
        family = next((name for name in contracts if literal[1:] == name[1:] and literal[:1].lower() == name[:1].lower()), None)
        if family is None:
            continue
        if any(isinstance(parent, nodes.Template) for parent in code.get_ancestors(template)):
            ambiguities.append('native image call has an unproved template owner')
            continue
        images, sizes, captions = contracts[family]
        fields = params(template)
        controls = [[(key, value) for key, value in fields if key in keys] for keys in [images, sizes, captions, ['alt']]]
        if not controls[0]:
            continue
        if any(len(group) > 1 for group in controls):
            ambiguities.append('native infobox image has competing literal fields')
            continue
        image = controls[0][0][1]
        if not image:
            continue
        caption, alt = controls[2][0][1] if controls[2] else '', controls[3][0][1] if controls[3] else ''
        if family == 'Info/Ator' and not controls[2]:
            names = [value for key, value in fields if key == 'nome']
            if len(names) != 1:
                ambiguities.append('native actor image caption fallback needs one literal name field')
                continue
            caption = names[0]
        size = controls[1][0][1] if controls[1] else ''
        inline_size, inline_caption = '', None
        image_code = next(param.value for param in template.params if str(param.name).strip() == controls[0][0][0])
        links = image_code.filter_wikilinks(recursive=False)
        if links:
            if len(links) != 1 or str(image_code).strip() != str(links[0]):
                ambiguities.append('native infobox image value is not one complete literal file')
                continue
            link = links[0]
            target = str(link.title).strip()
            if ':' not in target or target.startswith(':') or target.split(':', 1)[0].lower() not in {'file', 'image', 'arquivo', 'ficheiro', 'imagem'}:
                continue
            filename = target.split(':', 1)[1]
            options = str(link.text).split('|') if link.text is not None else []
            valid = True
            for option in options:
                option = option.strip()
                if option in {'thumb', 'thumbnail', 'miniatura', 'miniaturadaimagem'}:
                    continue
                if re.fullmatch(r'[1-9]\d*px', option) and not inline_size:
                    inline_size = option[:-2]
                elif any(re.fullmatch(re.escape(alias).replace(r'\$1', '.+'), option) for alias in NATIVE_IMAGE_OPTION_ALIASES):
                    valid = False
                elif not option or inline_caption is not None or re.search(r'[{}<>\[\]\r\n:|=]', option):
                    valid = False
                else:
                    inline_caption = option
            if not valid:
                ambiguities.append('native infobox embedded file has unproved options or caption')
                continue
        else:
            filename = image
        if re.search(r'[{}<>\[\]\r\n:|]', filename) or not re.search(r'\.(?:jpe?g|png|svg|gif|webp|tiff?|ogv|ogg)$', filename, flags=re.I):
            ambiguities.append('native infobox filename needs another display contract')
            continue
        if inline_caption is not None:
            if controls[2]:
                ambiguities.append('native embedded caption competes with a supplied caption field')
                continue
            caption = inline_caption
        normalized_size = re.fullmatch(r'([1-9]\d*)(?:px)?', size)
        if size and normalized_size is None or inline_size and normalized_size and inline_size != normalized_size[1]:
            ambiguities.append('native infobox image dimensions are unproved or conflicting')
            continue
        effective_size = normalized_size[1] if normalized_size else inline_size
        canonical_family = 'Info/Biografia' if family in {'Info/Escritor', 'Info/Jornalista'} else family
        rows.append(['native-infobox-image', canonical_family, title(filename), effective_size, rich(caption), rich(alt)])
        skipped.update(id(link) for link in image_code.filter_wikilinks())
    return rows, skipped, ambiguities


def media_inventory(code):
    result, ambiguities = [], []
    canonical = re.sub(r'\[\[(?:File|Image|Arquivo|Ficheiro|Imagem):([^{}<>\[\]\r\n:|]+\.(?:jpe?g|png|svg|gif|webp|tiff?|ogv|ogg))(?=[|\]])',
                       lambda match: '[[Imagem:' + match[1], str(code), flags=re.I)
    if canonical != str(code):
        code = mw.parse(canonical)
    virtual, skipped, virtual_ambiguities = native_infobox_media(code)
    ambiguities.extend(virtual_ambiguities)
    for link in code.filter_wikilinks():
        if id(link) in skipped:
            continue
        raw = str(link.title).strip()
        escaped = raw.startswith(":")
        unescaped = raw[1:] if escaped else raw
        if ":" not in unescaped:
            continue
        namespace, filename = unescaped.split(":", 1)
        if not file_namespace(namespace):
            continue
        parts = [""]
        for node in (link.text or mw.parse("")).nodes:
            bare_native_option = isinstance(node, nodes.ExternalLink) and not node.brackets and \
                namespace.lower() in {'file', 'image', 'arquivo', 'ficheiro', 'imagem'} and '|' in str(node) and \
                re.match(r'^https?://', str(node)) and not re.search(r'[{}<>\[\]\r\n]', str(node))
            if isinstance(node, nodes.Text) or bare_native_option:
                chunks = str(node).split("|")
                parts[-1] += chunks[0]
                parts.extend(chunks[1:])
            else:
                parts[-1] += str(node)
        alternatives, captions, options = [], [], []
        for part in parts:
            value = part.strip()
            if re.match(r"^(?:alt|alternativo|texto alternativo)\s*=", value, re.I):
                alternatives.append(value.split("=", 1)[1])
            elif re.fullmatch(r"\d+(?:x\d+)?px|x\d+px", value):
                continue
            elif re.fullmatch(r"(?:thumb|thumbnail|miniatura|miniaturadaimagem|frame|framed|frameless|semmoldura|commoldura|border|borda|left|right|center|centre|none|esquerda|direita|centro|nenhum|upright(?:=.*)?|superiordireito(?:=.*)?)", value):
                continue
            elif re.match(r"^(?:link|ligação|class|lang|página|page)\s*=", value):
                key, argument = value.split("=", 1)
                options.append({"ligação": "link", "página": "page"}.get(key.strip(), key.strip()) + "=" + argument)
            elif value:
                captions.append(value)
        if "{{" in filename:
            ambiguities.append("dynamic media filename")
        implicit_escaped_label = raw if escaped and link.text is None else None
        caption = mw.parse(captions[-1]) if captions else mw.parse("")
        # Reference marker payloads and group/name associations are checked by
        # reference_bindings, including definitions in file-link captions.
        # Keep the caption prose here, rather than mistaking an exact named
        # definition relocation for a caption edit.
        for ref in reversed(caption.filter_tags(matches=lambda node: textspace(node.tag).lower() == "ref")):
            caption.replace(ref, "")
        result.append([title(filename), escaped, rich(str(caption)), rich(alternatives[-1]) if alternatives else [], sorted(options), implicit_escaped_label])
    return result + virtual, sorted(set(ambiguities))


def category_inventory(code):
    result, ambiguities = [], []
    for link in code.filter_wikilinks():
        raw = str(link.title).strip()
        if raw.startswith(":") or ":" not in raw:
            continue
        namespace, target = raw.split(":", 1)
        if namespace.lower() in CATEGORY_NS:
            result.append([title(target), None if link.text is None else str(link.text)])
    sorts = []
    for template in code.filter_templates():
        name = str(template.name).strip()
        if re.match(r"^(?:DEFAULTSORT|ORDENAÇÃO)\s*:", name, re.I):
            sorts.append(name.split(":", 1)[1])
    if sorts and all(value == sorts[0] for value in sorts):
        sorts = [sorts[0]]
    return [sorted(set(freeze(item) for item in result)), sorts], ambiguities


def reference_media_relocation(first, second):
    """Bind only complete unique named footnote bodies, separately from order.

    Outside-footnote media remain in their original order. No ambiguous body,
    unknown owner, bank, attribute, file option or caption is discarded.
    """
    def collect(code):
        grouped = collections.defaultdict(list)
        for ref in code.filter_tags(matches=lambda item: textspace(item.tag).lower() == 'ref' and not item.self_closing):
            body = str(ref.contents or '')
            if not re.search(r'\[\[(?:File|Image|Arquivo|Ficheiro|Imagem):', body, flags=re.I):
                continue
            fields = [(textspace(attr.name).lower(), str(attr.value or '').strip()) for attr in ref.attributes]
            if len({key for key, _ in fields}) != len(fields) or any(key not in {'name', 'group'} for key, _ in fields):
                return None
            values = dict(fields)
            if not values.get('name') or re.search(r'[{}<>\[\]\r\n&]', values['name'] + values.get('group', '')):
                return None
            parents = code.get_ancestors(ref)
            if any(isinstance(parent, nodes.Template) or isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() in OPAQUE | {'ref', 'references'} for parent in parents):
                return None
            body_code = mw.parse(body)
            if body_code.filter_tags(matches=lambda item: textspace(item.tag).lower() == 'ref'):
                return None
            modeled, uncertainty = reference_body(body)
            media, media_uncertainty = media_inventory(body_code)
            if uncertainty or media_uncertainty:
                return None
            literal = []
            for link in body_code.filter_wikilinks():
                target = str(link.title).strip()
                escaped = target.startswith(':')
                bare = target[1:] if escaped else target
                if ':' not in bare:
                    continue
                namespace, filename = bare.split(':', 1)
                if namespace.lower() in {'file', 'image', 'arquivo', 'ficheiro', 'imagem'}:
                    literal.append([escaped, title(filename), str(link.text) if link.text is not None else None])
            grouped[(values.get('group', ''), values['name'])].append([body, modeled, literal, media])
        for values in grouped.values():
            if len({row[0] for row in values}) != 1:
                return None
        return grouped

    before, after = collect(first), collect(second)
    if before is None or after is None or not before or before.keys() != after.keys():
        return None
    for identity in before:
        if before[identity][0][1:] != after[identity][0][1:]:
            return None
    outside = []
    for code in [first, second]:
        copy = mw.parse(str(code))
        for ref in copy.filter_tags(matches=lambda item: textspace(item.tag).lower() == 'ref' and not item.self_closing):
            values = {textspace(attr.name).lower(): str(attr.value or '').strip() for attr in ref.attributes}
            if (values.get('group', ''), values.get('name', '')) in before:
                ref.contents = ''
        media, uncertainty = media_inventory(copy)
        if uncertainty:
            return None
        outside.append(media)
    attachments = [[group, name, before[(group, name)][0][1:]] for group, name in sorted(before)]
    return [outside[0], attachments], [outside[1], attachments], len(attachments)


def caption_reference_punctuation_projection(first, second):
    """Move only a supplied full stop across the same complete caption ref."""
    copy = mw.parse(str(first))

    def attributes(ref):
        fields = [(textspace(attr.name).lower(), str(attr.value or '')) for attr in ref.attributes]
        if len({key for key, value in fields}) != len(fields) or any(key not in {'name', 'group'} or re.search(r'[{}<>|\r\n]', value) for key, value in fields):
            return None
        return dict(fields)

    def bindings(code):
        if markdown_literals(code):
            return {}
        definitions, refused = collections.defaultdict(list), set()
        for ref in code.filter_tags(matches=lambda tag: textspace(tag.tag).lower() == 'ref'):
            values = attributes(ref)
            if values is None or not values.get('name'):
                continue
            key = (values.get('group', ''), values['name'])
            owners = code.get_ancestors(ref)
            if any(isinstance(parent, nodes.Template) or isinstance(parent, nodes.Tag) and
                   textspace(parent.tag).lower() in OPAQUE | {'references', 'ref'} for parent in owners):
                refused.add(key)
                continue
            if not ref.self_closing:
                body = str(ref.contents or '')
                parsed_body = mw.parse(body)
                if not body.strip() or parsed_body.filter_tags(matches=lambda tag: textspace(tag.tag).lower() == 'ref') or any(
                        template_name(template.name) not in NATIVE_DATE_FAMILIES for template in parsed_body.filter_templates()):
                    refused.add(key)
                    continue
                definitions[key].append(body)
        return {key: values[0] for key, values in definitions.items() if len(values) == 1 and key not in refused}

    source_bindings, target_bindings = bindings(copy), bindings(second)

    def ref_sequence(link):
        result = []
        for ref in link.text.filter_tags(matches=lambda tag: textspace(tag.tag).lower() == 'ref'):
            values = attributes(ref)
            if values is None:
                return None
            if values.get('name'):
                key = (values.get('group', ''), values['name'])
                if key not in source_bindings or source_bindings[key] != target_bindings.get(key):
                    return None
                result.append(['named', *key, source_bindings[key], sorted(values.items())])
            elif not ref.self_closing:
                result.append(['anonymous', values.get('group', ''), str(ref.contents or ''), sorted(values.items())])
            else:
                return None
        return result

    def files(code):
        return [link for link in code.filter_wikilinks() if not str(link.title).strip().startswith(':') and
                ':' in str(link.title) and str(link.title).split(':', 1)[0].strip().lower() in
                {'file', 'image', 'arquivo', 'ficheiro', 'imagem'}]

    source_links, target_links = files(copy), files(second)
    if len(source_links) != len(target_links):
        return None
    changed = 0
    for source, target in zip(source_links, target_links):
        if source.text is None or target.text is None or any(isinstance(parent, nodes.Template) for parent in copy.get_ancestors(source)):
            continue
        old_refs, new_refs = ref_sequence(source), ref_sequence(target)
        if not old_refs or old_refs != new_refs:
            continue
        for index in range(len(source.text.nodes) - 2, 0, -1):
            ref = source.text.nodes[index]
            following = source.text.nodes[index + 1]
            if not isinstance(ref, nodes.Tag) or textspace(ref.tag).lower() != 'ref':
                continue
            fields = [(textspace(attr.name).lower(), str(attr.value or '')) for attr in ref.attributes]
            if len({key for key, value in fields}) != len(fields) or any(key not in {'name', 'group'} or re.search(r'[{}<>|\r\n]', value) for key, value in fields):
                continue
            if not isinstance(following, nodes.Text) or not re.match(r'^\.[A-ZÀ-Ý]', str(following)) or not str(following)[1].isupper():
                continue
            previous = str(source.text.nodes[index - 1]).rstrip()
            if not previous or previous[-1] in '.!?:;…':
                continue
            source.text.insert_before(ref, '.')
            following.value = ' ' + str(following)[1:]
            changed += 1
    if not changed:
        return None
    source_inventory, source_uncertainty = media_inventory(copy)
    target_inventory, target_uncertainty = media_inventory(second)
    if source_uncertainty or target_uncertainty or source_inventory != target_inventory:
        return None
    return source_inventory, target_inventory, changed


def difference(before, after):
    changes = []

    def excerpt(value):
        raw = freeze(value)
        return value if len(raw) <= 1200 else {"characters": len(raw), "sha256": digest(raw.encode()), "excerpt": raw[:800]}

    def visit(old, new, at):
        if old == new or len(changes) >= 24:
            return
        if isinstance(old, list) and isinstance(new, list):
            for index in range(max(len(old), len(new))):
                if index >= len(old) or index >= len(new):
                    changes.append({"path": at + [index], "before": excerpt(old[index]) if index < len(old) else None,
                                    "after": excerpt(new[index]) if index < len(new) else None})
                else:
                    visit(old[index], new[index], at + [index])
                if len(changes) >= 24:
                    break
        else:
            changes.append({"path": at, "before": excerpt(old), "after": excerpt(new)})

    visit(before, after, [])
    return {"beforeSha256": digest(freeze(before).encode()), "afterSha256": digest(freeze(after).encode()),
            "firstChangedPaths": changes, "excerptsAreDiagnosticOnly": True}


def declared_repair_source(before, after):
    """Project only independently declared repairs with exact target payloads.

    These repairs can change original presentation or maintenance categories.
    The receipt records them separately, without whole-rendering equivalence.
    An unchanged, unmatched, conflicting or protected source is not projected.
    """
    if "[[Categoria:!Artigos com descrição curta]]" not in before and "subscription" not in before and "<ref" not in before.lower() and not re.search(r"\{\{\s*[Cc]ite[ _]NSRW\s*\|", before) and not re.search(r"(?m)^![ \t]+(?:rowspan|colspan)=", before) and not re.search(r"et\s+al", before, flags=re.I) and not re.search(r"\[https?://[^\r\n]*\r?\n", before) and not re.search(r"[|]\s*(?:língua|lingua|idioma|language|lang|mês|mes|month|data|date|ano|year|Ano|año|edição|Edição|volume|páginas|paginas|página|pagina|pages|page|pp|p)\s*=", before):
        return before, []
    first, second = mw.parse(before), mw.parse(after)
    repairs = []

    def native_call(node):
        header = re.sub(r"^(?:predefinição|template)\s*:\s*", "", str(node.name).strip(), flags=re.I)
        return bool(re.fullmatch(r"[Cc]itar (?:web|livro|jornal|periódico|revista)|[Cc]itation", header))

    def active(code, node):
        for parent in code.get_ancestors(node):
            if isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() in OPAQUE:
                return False
            if isinstance(parent, nodes.Template) and template_name(parent.name) not in COLLECTORS:
                content = native_transparent_content(parent)
                if content is None or not any(child is node for child in content.ifilter(recursive=True)):
                    return False
        return True

    # The pinned encyclopedia wrapper has fixed bibliographic defaults. Its
    # expansion changes a sister-project target and removes imported tracking
    # categories, so it is a declared migration, not old-HTML equivalence.
    wrapper_targets = collections.Counter(str(node) for node in second.filter_templates()
                                         if template_name(node.name) == 'citar enciclopédia' and active(second, node))
    for node in list(first.filter_templates()):
        header = re.sub(r'^(?:Predefinição|Template)\s*:\s*', '', str(node.name).strip().replace('_', ' '), flags=re.I)
        if not re.fullmatch(r'[Cc]ite NSRW', header) or not active(first, node):
            continue
        entries = params(node)
        if len({key for key, value in entries}) != len(entries) or any(key not in {'wstitle', 'display', 'short', 'no-icon', 'noicon', 'vb', 'inline'} for key, value in entries):
            continue
        fields = dict(entries)
        if not fields.get('wstitle') or 'display' in fields and not fields['display'] or 'no-icon' in fields and 'noicon' in fields:
            continue
        if any(re.search(r'[{}<>\[\]`\r\n|]', value) or "''" in value or len(value) > 512 for value in fields.values()):
            continue
        target_title = fields['wstitle']
        if not re.search(r'[^\W_]', target_title) or re.search(r'[:#%\\]', target_title) or target_title.startswith('/') or '..' in target_title:
            continue
        if any(fields[key] not in {'', '1', 'y', 'yes', 'true'} for key in ['short', 'no-icon', 'noicon', 'vb', 'inline'] if key in fields):
            continue
        work = "The New Student's Reference Work"
        label = fields.get('display') or target_title
        metadata = '' if fields.get('short') else '|editor-nome=Chandler B.|editor-sobrenome=Beach|local=Chicago|editora=F. E. Compton and Co'
        citation_text = '{{Citar enciclopédia|título=[[s:en:' + work + '/' + target_title + '|' + label + ']]|enciclopédia=[[s:en:' + work + '|' + work + ']]|ano=1914' + metadata + '}}'
        prefix = ('Uma ou mais das frases anteriores incorporam texto de uma publicação em [[domínio público]]: ' if fields.get('inline') else 'Este artigo incorpora texto de uma publicação em [[domínio público]]: ') if fields.get('vb') else ''
        if not wrapper_targets[citation_text] or prefix and prefix + citation_text not in after:
            continue
        first.replace(node, prefix + citation_text, recursive=True)
        wrapper_targets[citation_text] -= 1
        repairs.append({'kind': 'pinned-encyclopedia-wrapper-defaults', 'sourceOldid': 60696160,
                        'nativeTargetOldid': 60787857, 'suppliedFields': entries,
                        'targetSha256': digest((prefix + citation_text).encode())})

    after_calls = [node for node in second.filter_templates() if native_call(node) and active(second, node)]
    after_inventory = collections.Counter(freeze(citation(node)[0]) for node in after_calls)
    date_after = [node for node in second.filter_templates() if template_name(node.name) in NATIVE_DATE_FAMILIES and active(second, node)]
    for node in first.filter_templates():
        if template_name(node.name) not in NATIVE_DATE_FAMILIES or not active(first, node):
            continue
        original, uncertainty = citation(node)
        if uncertainty:
            continue
        for key, value in params(node):
            role = ALIASES.get(key)
            identity = extended_native_date(value)
            if role not in DATE_ROLES or identity is None or sum(ALIASES.get(k) == role for k, _ in params(node)) != 1:
                continue
            for target in date_after:
                modeled, target_uncertainty = citation(target)
                controls = [(k, v) for k, v in params(target) if ALIASES.get(k) == role]
                if target_uncertainty or modeled != original or len(controls) != 1 or controls[0][1] == value:
                    continue
                actual_identity = extended_native_date(controls[0][1]) or date_value(controls[0][1])
                if actual_identity == identity:
                    repairs.append({'kind': 'same-supplied-native-date-format', 'field': key,
                                    'from': value, 'to': controls[0][1], 'precisionIdentity': identity,
                                    'targetAssociationSha256': digest(freeze(modeled).encode())})
                    break
    # The obsolete native Month role is accepted but not rendered by CS1.
    # These finite month-precision repairs make supplied information visible.
    # Require an exact independently modeled complete target association and
    # report a declared repair, never equality of the original presentation.
    month_families = {"citar web", "cite web", "citar livro", "cite book", "citar jornal", "cite news",
                      "citar periódico", "cite journal", "citar revista", "cite magazine"}
    year_keys = {"ano", "year", "Ano", "año"}
    date_keys = {"data", "date", "airdate", "dataemissão", "fecha", "data2"}
    other_date_keys = {"data-publicação", "data-publicacao", "publication-date", "publicationdate", "fecha-publicación",
                       "anooriginal", "orig-year", "origyear", "transmissão", "air-date"}
    month_keys = {"mes", "mês", "month", "acessomesdia"}
    blocked_keys = {"day", "Day", "dia", "origdate", "orig-date", "data-original"}
    en_months = "january february march april may june july august september october november december".split()
    pt_months = "janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro".split()
    month_words = {name: index + 1 for names in [en_months, pt_months] for index, name in enumerate(names)}
    month_after = collections.Counter(freeze(citation(node)[0]) for node in second.filter_templates()
                                      if template_name(node.name) in month_families and active(second, node))
    for node in first.filter_templates():
        if template_name(node.name) not in month_families or not active(first, node):
            continue
        entries = params(node)
        if any(key in blocked_keys for key, _ in entries):
            continue
        publication = [(i, key, value) for i, (key, value) in enumerate(entries)
                       if key in year_keys | date_keys | other_date_keys]
        months = [(i, key, value) for i, (key, value) in enumerate(entries) if key in month_keys]
        if len(publication) != 1 or len(months) > 1:
            continue
        index, key, value = publication[0]
        copy = mw.parse(str(node)).nodes[0]
        kind, endpoint = None, None
        if not months and key in year_keys | date_keys:
            match = re.fullmatch(r"([1-9]\d{3})[ \t]+([A-Za-z]+)", value)
            word = match[2].lower() if match else None
            month = en_months.index(word) + 1 if word in en_months else None
            if month:
                endpoint = pt_months[month - 1] + " de " + match[1]
                copy.params[index].name = "data" if key in year_keys else key
                copy.params[index].value = endpoint
                kind = "supplied-year-month-scalar"
        elif len(months) == 1 and key in year_keys and months[0][1] in {"mes", "mês", "month"} and re.fullmatch(r"[1-9]\d{3}", value):
            month_index, _, month_value = months[0]
            match = re.fullmatch(r"([^\W\d_]+)(?:[ \t]*/[ \t]*([^\W\d_]+))?", month_value, re.UNICODE)
            left = month_words.get(match[1].lower()) if match else None
            right = month_words.get(match[2].lower()) if match and match[2] else None
            if left and (not match[2] or right and left < right):
                endpoint = pt_months[left - 1] + ("–" + pt_months[right - 1] if right else "") + " de " + value
                copy.params[index].name = "data"
                copy.params[index].value = endpoint
                copy.params.pop(month_index)
                kind = "supplied-obsolete-month-year-pair"
        if kind is None:
            continue
        original, _ = citation(node)
        expected, uncertainty = citation(copy)
        if uncertainty or month_after[freeze(original)] or not month_after[freeze(expected)]:
            continue
        node.name = copy.name
        node.params[:] = copy.params
        repairs.append({"kind": kind, "precision": "month-range" if "–" in endpoint else "month",
                        "configurationOldid": 73016847, "moduleOldid": 72936771, "sourceRevision": 72349758,
                        "targetAssociationSha256": digest(freeze(expected).encode())})
    # CS1 configuration 73016847 accepts subscrição, not subscription, for
    # UrlAccess. Module 72936771 validates that enum before using its exact
    # accepted target. Only one literal field in the role can be repaired.
    for node in first.filter_templates():
        # Cite web46214208 is an exact local redirect to Citar web. This
        # enrollment belongs only to the separately declared UrlAccess repair,
        # not to every repair using native_call elsewhere in the model.
        if not (native_call(node) or native_collector_102_title(node.name) == 'Cite web') or not active(first, node):
            continue
        entries = params(node)
        controls = [(index, key, value) for index, (key, value) in enumerate(entries)
                    if key in {"url-access", "acesso-url", "acessourl"}]
        if len(controls) != 1 or controls[0][2] != "subscription":
            continue
        original, uncertainty = citation(node)
        if uncertainty or after_inventory[freeze(original)]:
            continue
        copy = mw.parse(str(node)).nodes[0]
        copy.params[controls[0][0]].value = "subscrição"
        expected, uncertainty = citation(copy)
        if uncertainty or not after_inventory[freeze(expected)]:
            continue
        node.params[controls[0][0]].value = "subscrição"
        repairs.append({"kind": "invalid-native-url-access-enum", "field": controls[0][1],
                        "from": "subscription", "to": "subscrição", "configurationOldid": 73016847,
                        "moduleOldid": 72936771, "targetAssociationSha256": digest(freeze(expected).encode())})

    # Exact localized names/autonyms are bound to the code in the primary
    # languageinfo interface. The native Portuguese name/code pairs above
    # retain rendering identity; the following foreign literal repair does
    # not claim the original unknown-language presentation was equivalent.
    def language_call(node):
        return template_name(node.name) in {
            "citar web", "cite web", "citar livro", "cite book", "citar jornal", "cite news",
            "citar periódico", "cite journal", "citar revista", "cite magazine", "citation",
            "citar comunicado de imprensa", "cite press release", "citar conferência", "cite conference",
            "citar relatório", "cite report", "citar vídeo", "cite video",
            "citar enciclopédia", "cite encyclopedia", "citar tese", "cite thesis"}

    language_after = [node for node in second.filter_templates() if language_call(node) and active(second, node)]
    language_inventory = collections.Counter(freeze(citation(node)[0]) for node in language_after)
    for node in first.filter_templates():
        if not language_call(node) or not active(first, node):
            continue
        entries = params(node)
        controls = [(index, key, value) for index, (key, value) in enumerate(entries)
                    if ALIASES.get(key) == "language"]
        if len(controls) != 1:
            continue
        index, key, value = controls[0]
        target = linked_language(value) or FOREIGN_LANGUAGE_NAMES.get(value.lower())
        if target is None:
            continue
        original, uncertainty = citation(node)
        if uncertainty or language_inventory[freeze(original)]:
            continue
        copy = mw.parse(str(node)).nodes[0]
        copy.params[index].value = target
        expected, uncertainty = citation(copy)
        if uncertainty or not language_inventory[freeze(expected)]:
            continue
        node.params[index].value = target
        repairs.append({"kind": "complete-language-wikilink" if linked_language(value) else "foreign-literal-language-name", "field": key, "from": value,
                        "to": target, "configurationOldid": 73016847, "moduleOldid": 72936771,
                        "primaryMetadata": "languageinfo pt/en/fr/de/es finite catalog",
                        "targetAssociationSha256": digest(freeze(expected).encode())})

    formatting_families = month_families | {
        "citation", "citar comunicado de imprensa", "cite press release", "citar conferência", "cite conference",
        "citar relatório", "cite report", "citar vídeo", "cite video", "citar enciclopédia", "cite encyclopedia",
        "citar tese", "cite thesis"}
    formatting_after = collections.Counter(freeze(citation(node)[0]) for node in second.filter_templates()
                                           if template_name(node.name) in formatting_families and active(second, node))
    # Native extract_names already recognizes a supplied inline et-al marker.
    # Moving that marker to the explicit count field can remove a maintenance
    # category. The supplied literal name prefix stays byte-for-byte the same,
    # including an inverted name or initials and comma-separated body. This
    # does not split or reorder that body into people fields.
    person_after = collections.Counter(freeze(citation(node)[0]) for node in second.filter_templates()
                                       if template_name(node.name) in formatting_families and active(second, node))
    person_keys = {'autor', 'author', 'last', 'último', 'ultimo', 'sobrenome', 'autores', 'authors', 'editor', 'editor-sobrenome', 'editor-last'}
    for node in first.filter_templates():
        if template_name(node.name) not in formatting_families or not active(first, node):
            continue
        entries = params(node)
        for index, (key, value) in enumerate(entries):
            if key not in person_keys:
                continue
            match = re.fullmatch(r"(.+?)[,; \t]+et[ \t]+al\.?", value, flags=re.I)
            name = match[1].strip() if match else ''
            words = name.split()
            if not 2 <= len(words) <= 40 or not all(re.fullmatch(r"[^\W\d_](?:[^\W\d_]|[.'’,;-])*", word, flags=re.UNICODE) for word in words):
                continue
            if any(word.lower().strip('.,') in {'university', 'universidade', 'society', 'sociedade', 'institute', 'instituto', 'committee', 'comitê', 'association', 'associação', 'organization', 'organização', 'royal', 'national', 'nacional'} for word in words):
                continue
            family = 'editor' if key.startswith('editor') else 'author'
            roles = {'editor', 'editor_first', 'editor_last', 'editor_link', 'editor_mask', 'display_editors'} if family == 'editor' else {'author', 'first', 'last', 'author_link', 'display_authors', 'authors', 'coauthors', 'collaboration'}
            family_key = r'^(?:editor|veditor)' if family == 'editor' else r'^(?:autor|author|last|first|último|ultimo|sobrenome|nome|primeiro|coautor|coauthor|vauthor|colabora|collaboration)'
            if any(i != index and (ALIASES.get(other) in roles or re.match(family_key, other)) for i, (other, _) in enumerate(entries)):
                continue
            original, uncertainty = citation(node)
            if uncertainty or person_after[freeze(original)]:
                continue
            copy = mw.parse(str(node)).nodes[0]
            copy.params[index].value = name
            copy.add('numero-editores' if family == 'editor' else 'numero-autores', 'et al')
            expected, uncertainty = citation(copy)
            if uncertainty or not person_after[freeze(expected)]:
                continue
            node.params[:] = copy.params
            repairs.append({'kind': 'supplied-native-person-etal-marker', 'field': key,
                            'configurationOldid': 73016847, 'moduleOldid': 72936771,
                            'maintenanceCategoryMayChange': True,
                            'targetAssociationSha256': digest(freeze(expected).encode())})
            break
    # The native legacy Authors field is a literal author list. This finite
    # source constructor admits only an explicit semicolon list of personal
    # names and retains every other field. It is a declared formatting repair,
    # not a claim that free-form and numbered native output look identical.
    for node in first.filter_templates():
        if template_name(node.name) not in NATIVE_DATE_FAMILIES or not active(first, node):
            continue
        entries = params(node)
        selected = [(index, key, value) for index, (key, value) in enumerate(entries) if key in {'autores', 'authors'}]
        if len(selected) != 1:
            continue
        index, key, value = selected[0]
        names = [part.strip(' \t') for part in value.split(';')]
        if not 2 <= len(names) <= 20 or any(not 2 <= len(name.split()) <= 40 for name in names):
            continue
        # A single supplied comma may invert a personal name. Semicolons,
        # not commas, delimit the people. Keep each complete name literal.
        name_parts = [[part.strip(' \t') for part in name.split(',')] for name in names]
        if any(len(parts) > 2 or any(not part for part in parts) for parts in name_parts):
            continue
        words = [word for parts in name_parts for part in parts for word in part.split()]
        if not all(re.fullmatch(r"[^\W\d_](?:[^\W\d_]|[.'’-])*", word, flags=re.UNICODE) for word in words):
            continue
        if any(word.lower().strip('.,') in {'et', 'al', 'university', 'universidade', 'society', 'sociedade', 'institute', 'instituto', 'committee', 'comitê', 'association', 'associação', 'organization', 'organização', 'foundation', 'fundação', 'company', 'companhia', 'royal', 'national', 'nacional'} for word in words):
            continue
        if any(i != index and (ALIASES.get(other) in {'author', 'authors', 'first', 'last', 'coauthors', 'collaboration', 'display_authors'} or re.match(r'^(?:autor|author|last|first|último|ultimo|sobrenome|nome|primeiro|coautor|coauthor|vauthor|vautor|colabora|collaboration)', other, flags=re.I)) for i, (other, _) in enumerate(entries)):
            continue
        original, uncertainty = citation(node)
        if uncertainty or person_after[freeze(original)]:
            continue
        copy = mw.parse(str(node)).nodes[0]
        copy.params.pop(index)
        for ordinal, person in enumerate(names):
            copy.add('autor' + (str(ordinal + 1) if ordinal else ''), person)
        expected, uncertainty = citation(copy)
        if uncertainty or not person_after[freeze(expected)]:
            continue
        node.params[:] = copy.params
        repairs.append({'kind': 'supplied-native-semicolon-author-list', 'field': key,
                        'people': len(names), 'configurationOldid': 73016847, 'moduleOldid': 72936771,
                        'targetAssociationSha256': digest(freeze(expected).encode())})
    for node in first.filter_templates():
        if template_name(node.name) not in formatting_families or not active(first, node):
            continue
        entries, copy, kinds = params(node), mw.parse(str(node)).nodes[0], []
        for index, (key, value) in enumerate(entries):
            if key in date_keys and sum(k in date_keys | year_keys | other_date_keys | month_keys for k, _ in entries) == 1:
                match = re.fullmatch(r'([1-9]\d{3})/(\d{1,2})', value)
                if match and 1 <= int(match[2]) <= 12:
                    copy.params[index].value = match[1] + '-' + match[2].zfill(2)
                    kinds.append({'role': 'date', 'kind': 'supplied-numeric-year-month', 'precision': 'month',
                                  'year': int(match[1]), 'month': int(match[2])})
            page_keys = {'pagina', 'página', 'page', 'p', 'paginas', 'pp', 'páginas', 'pages'}
            if key in page_keys and sum(k in page_keys for k, _ in entries) == 1 and not any(k in {'nopp', 'no-pp'} for k, _ in entries):
                match = re.fullmatch(r'(?:p\.|pp\.|página|páginas|page|pages)[ \t]*(\d+(?:[ \t]*(?:[-–,]|e)[ \t]*\d+)*(?:[ \t]+\([^(){}\[\]<>\r\n]+\))?)', value, flags=re.I)
                if match:
                    copy.params[index].value = match[1]
                    kinds.append({'role': 'pages', 'kind': 'redundant-numeric-page-label',
                                  'retainedPayloadSha256': digest(match[1].encode())})
            if key in {"edição", "Edição"} and sum(k in {"edicao", "edition", "edição", "ed", "Edição", "edición"} for k, _ in entries) == 1:
                match = re.fullmatch(r"(\d+)(?:st|nd|rd|th|[.ªº°])?[ \t]*(?:ed\.?|edition|edição)", value, flags=re.I)
                if match:
                    copy.params[index].value = match[1]
                    kinds.append({"role": "edition", "kind": "redundant-numeric-edition-label", "numericValue": match[1]})
            if key == "volume" and sum(k in {"volume", "volumen"} for k, _ in entries) == 1 and not re.search(r"[{}<>\r\n]", value):
                match = re.match(r"(?:v\.|vol\.)[ \t]*(?=\d)", value, flags=re.I)
                if match:
                    copy.params[index].value = value[match.end():]
                    kinds.append({"role": "volume", "kind": "redundant-numeric-volume-prefix",
                                  "retainedPayloadSha256": digest(value[match.end():].encode())})
        if not kinds:
            continue
        original, _ = citation(node)
        expected, uncertainty = citation(copy)
        if uncertainty or formatting_after[freeze(original)] or not formatting_after[freeze(expected)]:
            continue
        node.params[:] = copy.params
        repairs.append({"kind": "native-citation-redundant-value-labels", "fields": kinds,
                        "configurationOldid": 73016847, "moduleOldid": 72936771,
                        "targetAssociationSha256": digest(freeze(expected).encode())})

    def ref_fields(node):
        fields = [(textspace(attr.name), str(attr.value or "")) for attr in node.attributes]
        if any(key not in {"name", "group"} for key, value in fields) or len(set(key for key, value in fields)) != len(fields):
            return None
        return sorted(fields)

    target_refs, raw_after_refs = [], set()
    for node in second.filter_tags(matches=lambda item: textspace(item.tag).lower() == "ref" and not item.self_closing):
        raw_after_refs.add(freeze([ref_fields(node), str(node.contents or "").strip()]))
        body = mw.parse(str(node.contents or "").strip())
        if not active(second, node) or len(body.nodes) != 1 or not isinstance(body.nodes[0], nodes.Template):
            continue
        call = body.nodes[0]
        entries = params(call)
        if native_call(call) and template_name(call.name) == "citar web" and len(entries) == 2:
            roles = {ALIASES.get(key): value for key, value in entries}
            if set(roles) == {"url", "title"} and ref_fields(node) is not None:
                target_refs.append((ref_fields(node), roles["url"], roles["title"]))
    candidates = []
    for node in first.filter_tags(matches=lambda item: textspace(item.tag).lower() == "ref" and not item.self_closing):
        if not active(first, node) or ref_fields(node) is None:
            continue
        raw = str(node.contents or "").strip()
        match = re.fullmatch(r"\[(https?://[^\s|<>\[\]{}\"']+)[ \t\r\n]+([^|<>\[\]{}]+)\]", raw)
        if match and '\n' in raw:
            candidates.append((node, ref_fields(node), match[1], match[2].strip()))
    identities = collections.Counter(freeze(item[1:]) for item in candidates)
    for node, fields, url, label in candidates:
        identity = (fields, url, label)
        if identities[freeze(identity)] != 1 or target_refs.count(identity) != 1 or\
                freeze([fields, str(node.contents or "").strip()]) in raw_after_refs:
            continue
        # Preserve quotation marks and all URL/label bytes apart from the
        # malformed separator whitespace. No title, source, or date is added.
        node.contents = "{{Citar web|url=" + url + "|título=" + label + "}}"
        repairs.append({"kind": "malformed-bracket-link-newline", "groupAndName": fields,
                        "urlSha256": digest(url.encode()), "labelSha256": digest(label.encode()),
                        "sourceAndTargetPayloadExact": True})
    # Help:Cite 8656221 binds a reused name to the same footnote within its
    # group. Removing an immediately repeated self-call changes the marker
    # layout, so report a declared cleanup. Never infer arbitrary ref removal.
    if not markdown_literals(first) and re.search(r"(?:</ref>|/\s*>)[ \t\r\n]*<ref\b", str(first), flags=re.I):
        def marker_identity(node):
            if not isinstance(node, nodes.Tag) or textspace(node.tag).lower() != 'ref':
                return None
            fields = ref_fields(node)
            if fields is None:
                return None
            values = dict(fields)
            name, group = values.get('name', ''), values.get('group', '')
            if not name or name.isdigit() or re.search(r'[{}<>\[\]\r\n&]', name + group):
                return None
            return group, name

        definitions, refused = collections.defaultdict(set), set()
        for node in first.filter_tags(matches=lambda item: textspace(item.tag).lower() == 'ref'):
            identity = marker_identity(node)
            if identity is None:
                values = attrs(node)
                if values.get('name'):
                    refused.add((values.get('group', ''), values['name']))
                continue
            if not active(first, node) or any(isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() in {'ref', 'references'} for parent in first.get_ancestors(node)):
                refused.add(identity)
            elif not node.self_closing:
                body = str(node.contents or '')
                _, uncertainty = reference_body(body)
                if not body.strip() or uncertainty:
                    refused.add(identity)
                definitions[identity].add(body)
        eligible = {identity for identity, bodies in definitions.items() if len(bodies) == 1 and identity not in refused}
        copy = mw.parse(str(first))
        remove, cluster = [], set()
        for node in copy.nodes:
            if isinstance(node, nodes.Text) and not str(node).strip():
                continue
            identity = marker_identity(node)
            if identity in eligible and identity in cluster and node.self_closing:
                remove.append(node)
            if identity in eligible:
                cluster.add(identity)
            else:
                cluster.clear()
        if remove:
            source_marker_bindings = {}
            reference_inventory(copy, source_marker_bindings)
            affected_bindings = {freeze(source_marker_bindings[id(node)]) for node in remove if id(node) in source_marker_bindings}
            for node in remove:
                copy.remove(node)
            expected, uncertainty = reference_inventory(copy)
            actual, actual_uncertainty = reference_inventory(second)
            keys = ['bindings', 'definitionPayloads', 'opaqueEmitters', 'opaqueBodyAssociations',
                    'renderedLists', 'unrenderedMarkers']
            def marker_layout(code):
                bindings = {}
                reference_inventory(code, bindings)
                def walk(part):
                    result, pending = [], []
                    def flush():
                        if pending:
                            result.extend(rich(''.join(pending)))
                            pending.clear()
                    for node in part.nodes:
                        if isinstance(node, nodes.Tag) and textspace(node.tag).lower() == 'ref':
                            flush()
                            result.append(['marker-position', bindings.get(id(node), ['unread-marker', str(node)])])
                        elif isinstance(node, nodes.Template) and collector(node) is not None:
                            flush()
                            result.append(['collector-position', collector(node)['groups']])
                        elif isinstance(node, nodes.Tag) and node.contents is not None and '<ref' in str(node.contents).lower() and textspace(node.tag).lower() not in OPAQUE:
                            flush()
                            structural = textspace(node.tag).lower() in {'table', 'tr', 'th', 'td'}
                            if structural:
                                result.append(['container-start', textspace(node.tag).lower()])
                            result.extend(walk(node.contents))
                            if structural:
                                result.append(['container-end', textspace(node.tag).lower()])
                        elif isinstance(node, nodes.Template) and '<ref' not in str(node).lower():
                            flush()
                            result.append(['template-boundary', template_name(node.name)])
                        elif isinstance(node, nodes.Heading) and '<ref' in str(node.title).lower():
                            flush()
                            result.append(['heading-start'])
                            result.extend(walk(node.title))
                            result.append(['heading-end'])
                        else:
                            pending.append(str(node))
                    flush()
                    return result
                trace = walk(code)
                boundary = {'marker-position', 'collector-position', 'container-start', 'container-end', 'template-boundary', 'heading-start', 'heading-end'}
                windows = []
                for index, item in enumerate(trace):
                    if item[0] != 'marker-position' or freeze(item[1]) not in affected_bindings:
                        continue
                    left = index - 1
                    while left >= 0 and trace[left][0] not in boundary:
                        left -= 1
                    right = index + 1
                    while right < len(trace) and trace[right][0] not in boundary:
                        right += 1
                    windows.append(trace[max(0, left):min(len(trace), right + 1)])
                return windows
            opaque_identity = bool(expected['opaqueBodyAssociations']) and expected['opaqueBodyAssociations'] == actual['opaqueBodyAssociations']
            blocking = [reason for reason in uncertainty + actual_uncertainty if not opaque_identity or
                        not reason.startswith('reference body: ') or 'crosses a literal reference closing boundary' in reason]
            if not blocking and all(expected[key] == actual[key] for key in keys) and marker_layout(copy) == marker_layout(second):
                first = copy
                repairs.append({'kind': 'adjacent-identical-named-reference-selfcall', 'removedMarkers': len(remove),
                                'nativeDocumentationOldid': 8656221,
                                'wholeAssociationSha256': digest(freeze([expected[key] for key in keys]).encode())})
    obsolete = '[[Categoria:!Artigos com descrição curta]]'
    if obsolete in str(first) and obsolete not in str(second):
        eligible = [link for link in first.filter_wikilinks() if str(link) == obsolete and active(first, link)]
        if eligible:
            copy = mw.parse(str(first))
            removed = 0
            for link in list(copy.filter_wikilinks()):
                if str(link) == obsolete and active(copy, link):
                    copy.remove(link)
                    removed += 1
            expected, uncertainty = category_inventory(copy)
            actual, actual_uncertainty = category_inventory(second)
            if not uncertainty and not actual_uncertainty and expected == actual:
                first = copy
                repairs.append({'kind': 'obsolete-short-description-maintenance-category', 'removed': removed,
                                'wholeCategoryAssociationSha256': digest(freeze(expected).encode())})
    # A bare adjacent native main-list/notes pair may be replaced by the
    # combined native collector. This changes group presentation order, so it
    # is a declared layout repair, not arbitrary sorting or HTML equivalence.
    pairs = []
    main_names = {'referências', 'referencias', 'references', 'referência', 'referencia'}
    for index, node in enumerate(first.nodes):
        if not isinstance(node, nodes.Template) or template_name(node.name) not in main_names or node.params:
            continue
        end = index + 1
        while end < len(first.nodes) and isinstance(first.nodes[end], nodes.Text) and not str(first.nodes[end]).strip():
            end += 1
        if end < len(first.nodes) and isinstance(first.nodes[end], nodes.Template) and template_name(first.nodes[end].name) == 'notas' and not first.nodes[end].params:
            pairs.append((index, end))
    targets = [node for node in second.nodes if isinstance(node, nodes.Template) and
               template_name(node.name) == 'notas e referências' and not node.params]
    if len(pairs) == len(targets) == 1:
        index, end = pairs[0]
        projected = mw.parse(str(first))
        projected.nodes[index:end + 1] = [nodes.Template('Notas e referências')]
        candidate, candidate_uncertainty = reference_inventory(projected)
        actual, actual_uncertainty = reference_inventory(second)
        keys = ['bindings', 'definitionPayloads', 'renderedLists', 'unrenderedMarkers', 'opaqueEmitters']
        if all(candidate[key] == actual[key] for key in keys):
            first = projected
            repairs.append({'kind': 'adjacent-native-main-notes-collector-layout',
                            'nativeSourceOldids': [63785697, 59102402], 'nativeTargetOldid': 73218466,
                            'completeOrderedAssociationsSha256': digest(freeze([candidate[key] for key in keys]).encode()),
                            'unresolvedExpansionRemainsAmbiguous': bool(candidate_uncertainty or actual_uncertainty)})
    # An existing literal span value can supply one missing cell separator.
    # This changes its original display and grid, so keep it a declared syntax
    # repair. Every table attribute, cell payload, row and numeric span must
    # match the independently projected complete endpoint.
    projected, spans = mw.parse(str(first)), []
    source_tables = list(projected.filter_tags(matches=lambda node: textspace(node.tag).lower() == 'table'))
    target_tables = list(second.filter_tags(matches=lambda node: textspace(node.tag).lower() == 'table'))
    def table_attributes(code):
        return [[textspace(tag.tag).lower(), sorted(attrs(tag).items())] for tag in code.filter_tags()
                if textspace(tag.tag).lower() in {'table', 'tr', 'th', 'td'} and tag.attributes]
    for index, table in enumerate(source_tables):
        raw = str(table)
        if len(source_tables) != len(target_tables) or not table.wiki_markup or raw.count('{|') != 1 or raw.count('|}') != 1 or not active(projected, table):
            continue
        lines, edits = [], []
        for line in raw.splitlines(keepends=True):
            match = re.fullmatch(r'''(![ \t]+(?:rowspan|colspan)=(?:"([1-9]\d{0,2})"|'([1-9]\d{0,2})'))([ \t]+)([^\r\n|{}<>\[\]=]+)(\r?\n|$)''', line)
            if match:
                lines.append(match[1] + match[4] + '| ' + match[5] + match[6])
                edits.append({'span': match[2] or match[3], 'sourceLineSha256': digest(line.encode())})
            else:
                lines.append(line)
        if edits:
            single = mw.parse(''.join(lines))
            target = mw.parse(str(target_tables[index]))
            candidate_table, candidate_uncertainty = table_inventory(single, str(single))
            actual_table, actual_uncertainty = table_inventory(target, str(target))
            # A conservative writer may decline the same lexical defect in
            # another table. Witness only complete same-index endpoints. An
            # unchanged source table cannot authorize a repair elsewhere.
            if not candidate_uncertainty and not actual_uncertainty and candidate_table == actual_table and table_attributes(single) == table_attributes(target):
                projected.replace(table, ''.join(lines))
                spans.extend(edits)
    if spans:
        candidate, uncertainty = table_inventory(projected, str(projected))
        actual, actual_uncertainty = table_inventory(second, str(second))
        if not uncertainty and not actual_uncertainty and candidate == actual and table_attributes(projected) == table_attributes(second):
            first = projected
            repairs.append({'kind': 'supplied-positive-span-missing-separator', 'edits': spans,
                            'nativeProof': 'table_native_nested_contract.json',
                            'completeTablePayloadSha256': digest(freeze([candidate, table_attributes(projected)]).encode())})
    # A nameless attribute-free self-closing ref supplies no definition. The
    # native parser emits an error for it. Removing that token is a declared
    # invalid-syntax cleanup, provided the entire remaining graph is exact.
    empty_refs = [node for node in first.filter_tags(matches=lambda item: textspace(item.tag).lower() == 'ref')
                  if not node.attributes and not str(node.contents or '').strip(' \t\r\n') and active(first, node) and
                  not any(isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() in {'ref', 'references'} or
                          isinstance(parent, nodes.Template) and template_name(parent.name) in COLLECTORS
                          for parent in first.get_ancestors(node))]
    if empty_refs:
        projected = mw.parse(str(first))
        for node in list(projected.filter_tags(matches=lambda item: textspace(item.tag).lower() == 'ref')):
            if not node.attributes and not str(node.contents or '').strip(' \t\r\n') and active(projected, node) and not any(
                    isinstance(parent, nodes.Tag) and textspace(parent.tag).lower() in {'ref', 'references'} or
                    isinstance(parent, nodes.Template) and template_name(parent.name) in COLLECTORS
                    for parent in projected.get_ancestors(node)):
                projected.remove(node, recursive=True)
        candidate, uncertainty = reference_inventory(projected)
        actual, actual_uncertainty = reference_inventory(second)
        keys = ['bindings', 'definitionPayloads', 'definitions', 'renderedLists', 'unrenderedMarkers', 'opaqueEmitters']
        if all(candidate[key] == actual[key] for key in keys):
            first = projected
            repairs.append({'kind': 'attribute-free-invalid-empty-reference-removal', 'removed': len(empty_refs),
                            'nativeResponseSha256': 'a4cdd9acad1ac846b49fa36606ccf4301993774c5f339be0c0d7ff236752343a',
                            'completeRemainingGraphSha256': digest(freeze([candidate[key] for key in keys]).encode()),
                            'unresolvedExpansionRemainsAmbiguous': bool(uncertainty or actual_uncertainty)})
    return str(first), repairs


def literal_reference_italic_recovery(before, after, original, current):
    """A strict raw association witness identifies an AST recovery boundary.

    This never supplies a passed semantic result. It permits a separately
    counted ambiguity only when exact raw bindings and a final simple native
    collector are retained despite an unclosed italic confusing the AST.
    """
    def read(source):
        opaque = re.compile(r'<!--[\s\S]*?(?:-->|$)|<(nowiki|pre|source|syntaxhighlight|math|chem)\b[^>]*>[\s\S]*?</\1\s*>', re.I)
        view = opaque.sub(lambda match: ''.join('\n' if character == '\n' else ' ' for character in match[0]), source)
        if re.search(r'\{\{\s*(?:(?:predefinição|template)\s*:\s*)?(?:r(?:/ref)?|referências[ _]+múltiplas|refn|nre|efn|sfn(?:p|m|mp)?|harvref|#tag\s*:\s*ref)(?=[\s|}])', view, flags=re.I):
            return None
        token = re.compile(r'''<ref\b(?:"[^"]*"|'[^']*'|[^'">])*>''', re.I)
        attribute = re.compile(r'''\s+(name|group)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))''', re.I)
        references, cursor = [], 0
        for match in token.finditer(view):
            if match.start() < cursor:
                continue
            raw, fields = match[0], {}
            tail = raw[4:-1]
            if tail.rstrip().endswith('/'):
                tail = tail.rstrip()[:-1]
            at = 0
            for field in attribute.finditer(tail):
                key = field[1].lower()
                value = next(value for value in field.groups()[1:] if value is not None)
                if tail[at:field.start()].strip() or key in fields or value != value.strip(' \t\r\n') or '&' in value or reference_identity_uncertain(value) or re.search(r'[{}<>\[\]]', value):
                    return None
                fields[key], at = value, field.end()
            if tail[at:].strip() or fields.get('group', ''):
                return None
            if raw.rstrip().endswith('/>'):
                end, body = match.end(), None
            else:
                close = re.search(r'</ref\s*>', view[match.end():], flags=re.I)
                if close is None:
                    return None
                end = match.end()+close.end()
                body = source[match.end():match.end()+close.start()]
                if re.search(r'<ref\b', view[match.end():match.end()+close.start()], flags=re.I):
                    return None
            cursor = end
            if body is None and not fields.get('name'):
                return None
            references.append({'start': match.start(), 'end': end, 'name': fields.get('name', ''), 'body': body})
        if not references:
            return None
        collector_pattern = re.compile(r'<references[ \t]*/[ \t]*>|\{\{[ \t]*(?:(?:Predefinição|Template)[ \t]*:[ \t]*)?(?:[Rr]eferências|[Rr]eferencias|[Rr]eflist)(?:\|col=[1-9]\d*)?[ \t]*\}\}')
        collectors = list(collector_pattern.finditer(view))
        if len(collectors) != 1 or collectors[0].start() < references[-1]['end']:
            return None
        definitions = collections.defaultdict(set)
        for ref in references:
            if ref['name'] and ref['body'] is not None:
                definitions[ref['name']].add(ref['body'])
        if any(len(bodies) != 1 for bodies in definitions.values()):
            return None
        bindings = []
        for ref in references:
            if ref['body'] is not None:
                body = ref['body']
            elif ref['name'] in definitions:
                body = next(iter(definitions[ref['name']]))
            else:
                return None
            bindings.append([ref['name'], body])
        italic = any(sum(run == "''" for run in re.findall(r"'{2,}", ref['body'] or '')) % 2 for ref in references)
        return {'markers': len(references), 'bindings': bindings, 'definitions': sorted((name, sorted(bodies)) for name, bodies in definitions.items()),
                'collector': collectors[0][0], 'unclosedItalic': italic}
    first, second = read(before), read(after)
    if first is None or second is None or not (first['unclosedItalic'] or second['unclosedItalic']) or first['bindings'] != second['bindings'] or first['definitions'] != second['definitions']:
        return None
    if first['collector'] != second['collector'] and not (re.search(r'\|col=[1-9]\d*\}\}$', first['collector']) and re.sub(r'\|col=[1-9]\d*(?=\}\}$)', '', first['collector']) == second['collector']):
        return None
    if first['markers'] == original['rawMarkers'] and second['markers'] == current['rawMarkers']:
        return None
    return {'rawSourceMarkers': first['markers'], 'rawOutputMarkers': second['markers'], 'exactOrderedRawAssociations': first['markers'],
            'sourceRawAssociationSha256': digest(freeze(first['bindings']).encode()), 'outputRawAssociationSha256': digest(freeze(second['bindings']).encode()),
            'classification': 'explicit-italic-reference-ast-recovery-ambiguity'}


def compare_sources(before, after):
    original_before = before
    before, declared_repairs = declared_repair_source(before, after) if before != after else (before, [])
    first, second = mw.parse(before), mw.parse(after)
    result = {}
    ar, au = reference_inventory(first)
    br, bu = reference_inventory(second)
    ref_ambiguities = sorted(set(au + bu))
    opaque_identity = bool(ar["opaqueBodyAssociations"]) and ar["opaqueBodyAssociations"] == br["opaqueBodyAssociations"]
    if opaque_identity:
        ref_ambiguities = [reason for reason in ref_ambiguities if not reason.startswith("reference body: ") or
                           'crosses a literal reference closing boundary' in reason]
    emitter_identity = bool(ar["opaqueEmitters"]) and ar["opaqueEmitters"] == br["opaqueEmitters"]
    if emitter_identity:
        ref_ambiguities = [reason for reason in ref_ambiguities if reason != "template-generated reference emission is not expanded"]
    # Bindings contain group and complete resolved content. Names themselves
    # may be mechanically renamed, but a body cannot move to another call.
    if ar["bindings"] != br["bindings"]:
        compressed = lambda rows: [row for index, row in enumerate(rows) if not index or row != rows[index - 1]]
        if compressed(ar["bindings"]) == compressed(br["bindings"]):
            ref_ambiguities.append("repeated logical binding changed; native adjacency/list-region witness required")
    introduced_splits = sorted(key for key, bodies in br["rawNamedDefinitions"].items()
                               if len(set(bodies)) > 1 and len(set(ar["rawNamedDefinitions"].get(key, []))) <= 1)
    # A typed-date or citation-alias comparison cannot conceal a newly
    # conflicting native named definition. If all source copies were byte
    # identical, partially editing that class is a separate exact failure.
    # Existing conflicts remain ambiguous, and complete identical updates or
    # legitimate same-name duplicate removal do not create a new split.
    result["reference_bindings"] = ([ar["bindings"], ar["definitionPayloads"], ar["opaqueEmitters"], ar['nativeHelperContexts'], []], [br["bindings"], br["definitionPayloads"], br["opaqueEmitters"], br['nativeHelperContexts'], introduced_splits], ref_ambiguities,
                                      {"sourceMarkers": ar["rawMarkers"], "outputMarkers": br["rawMarkers"], "sourceNamedDefinitions": len(ar["definitions"]), "outputNamedDefinitions": len(br["definitions"]),
                                       "introducedRawNamedDefinitionSplits": len(introduced_splits),
                                       "opaqueAssociationsProvedByteExact": len(ar["opaqueBodyAssociations"]) if opaque_identity else 0,
                                       "sourceOpaqueEmitters": len(ar["opaqueEmitters"]),
                                       "opaqueEmissionsProvedByteExact": len(ar["opaqueEmitters"]) if emitter_identity else 0})
    math_scope_before = opaque_native_math_efn_scope_102(first)
    math_scope_after = opaque_native_math_efn_scope_102(second)
    math_scope_changed = bool(math_scope_before or math_scope_after) and math_scope_before != math_scope_after
    if math_scope_before or math_scope_after:
        # The body is deliberately unexpanded even when every raw byte is
        # retained. This remains a separately counted ambiguity.
        ref_ambiguities.append('native opaque math note body retained without expansion')
        result['reference_bindings'][3]['nativeOpaqueMathScopeChanged'] = math_scope_changed
        result['reference_bindings'][3]['nativeOpaqueMathCalls'] = len(math_scope_before[0]) if math_scope_before else 0
        result['reference_bindings'][0].append(math_scope_before)
        result['reference_bindings'][1].append(math_scope_after)
    raw_first, uncertain_first = raw_reference_subsystem(mw.parse(original_before))
    raw_second, uncertain_second = raw_reference_subsystem(second)
    uncertain_identity_changed = (uncertain_first or uncertain_second) and raw_first != raw_second
    if uncertain_first or uncertain_second:
        ref_ambiguities.append('native entity/control identity is unproved; exact reference subsystem retained' if not uncertain_identity_changed else 'native entity/control identity reference subsystem changed')
        result['reference_bindings'][3]['uncertainNativeIdentitySubsystemChanged'] = uncertain_identity_changed
        result['reference_bindings'][3]['uncertainNativeIdentityRawObjects'] = len(raw_first)
    result["reference_lists"] = reference_list_comparison(ar, br, ref_ambiguities)
    if math_scope_before or math_scope_after:
        result['reference_lists'][3]['nativeOpaqueMathScopeChanged'] = math_scope_changed
        result['reference_lists'][3]['nativeOpaqueMathCalls'] = len(math_scope_before[0]) if math_scope_before else 0
    if uncertain_first or uncertain_second:
        result['reference_lists'][3]['uncertainNativeIdentitySubsystemChanged'] = uncertain_identity_changed
        result['reference_lists'][3]['uncertainNativeIdentityRawObjects'] = len(raw_first)
    recovery = literal_reference_italic_recovery(before, after, ar, br)
    if recovery:
        for invariant in ['reference_bindings', 'reference_lists']:
            result[invariant][2].append('unclosed italic caused native reference AST recovery; exact independent raw association retained')
            result[invariant][3]['rawItalicRecoveryBoundary'] = recovery
    ac, au = citation_inventory(first)
    bc, bu = citation_inventory(second)
    ao, bo = opaque_citation_inventory(first), opaque_citation_inventory(second)
    citation_ambiguities = sorted(set(au + bu))
    opaque_citation_identity = bool(ao) and ao == bo
    if opaque_citation_identity:
        citation_ambiguities = [reason for reason in citation_ambiguities if not reason.startswith("unmodeled populated citation field ") and
                               reason != "unexpanded citation candidate with populated identifying fields"]
    result["citation_associations"] = (ac, bc, citation_ambiguities, {"sourceDistinctCitations": len(ac), "outputDistinctCitations": len(bc),
                                       "opaqueCitationCallsProvedByteExact": sum(ao.values()) if opaque_citation_identity else 0})
    at, au = table_inventory(first, before)
    bt, bu = table_inventory(second, after)
    if len(at) != len(bt):
        au.append("table split or parser recovery needs a row-level native witness")
    result["table_cells"] = (at, bt, sorted(set(au + bu)), {"sourceTables": len(at), "outputTables": len(bt), "sourceCells": sum(len(table['cells']) for table in at), "outputCells": sum(len(table['cells']) for table in bt),
                                                          "sourceRows": sum(len(table['rows']) for table in at), "outputRows": sum(len(table['rows']) for table in bt)})
    literal_first = mw.parse(original_before) if declared_repairs else first
    af, bf = markdown_literals(literal_first), markdown_literals(second)
    al, bl = protected_inventory(literal_first, af), protected_inventory(second, bf)
    literal_ambiguities = []
    if al != bl and whole_page_markdown_wrapper(str(literal_first), af) and not re.match(r'^[ \t\r\n]*[`~]{3}', after) and not whole_page_markdown_wrapper(after, bf):
        # Whole-article wrapper removal is an explicit product feature, but
        # exact native rendering equivalence is not claimed by this oracle.
        # A separate source-bound wrapper proof remains necessary.
        literal_ambiguities.append("whole-page Markdown wrapper changed; independent source-bound wrapper proof required")
    result["protected_literals"] = (al, bl, literal_ambiguities, {"sourceDistinctLiterals": len(al), "outputDistinctLiterals": len(bl),
                                                               "sourceMarkdownFences": len(af), "outputMarkdownFences": len(bf)})
    am, au = media_inventory(first)
    bm, bu = media_inventory(second)
    media_metrics = {"sourceMedia": len(am), "outputMedia": len(bm)}
    if am != bm:
        relocation = reference_media_relocation(first, second)
        if relocation is not None:
            am, bm, count = relocation
            media_metrics['sourceBoundNamedReferenceAttachments'] = count
        else:
            punctuation = caption_reference_punctuation_projection(first, second)
            if punctuation is not None:
                am, bm, count = punctuation
                media_metrics['declaredCaptionReferencePunctuationRepairs'] = count
    result["media"] = (am, bm, sorted(set(au + bu)), media_metrics)
    ag, au = category_inventory(first)
    bg, bu = category_inventory(second)
    result["category_sort"] = (ag, bg, sorted(set(au + bu)), {"sourceCategories": len(ag[0]), "outputCategories": len(bg[0])})
    checked = {}
    for key, (old, new, ambiguity, metrics) in result.items():
        empty = not old and not new
        if key == "media" and ambiguity:
            empty = False
        if key == "reference_bindings":
            empty = not any(old) and not any(new)
        if key == "reference_lists":
            empty = not any(old) and not any(new) and not metrics["sourceOpaqueScopes"] and not metrics["outputOpaqueScopes"]
        if key == "category_sort":
            empty = old == [[], []] and new == [[], []]
        equal = old == new
        definite_split = key in {"reference_bindings", "reference_lists"} and (metrics.get("introducedRawNamedDefinitionSplits", 0) > 0 or metrics.get("uncertainNativeIdentitySubsystemChanged", False) or metrics.get("nativeOpaqueMathScopeChanged", False))
        status = "failed" if definite_split else "not_applicable" if empty else "ambiguous" if ambiguity else "passed" if equal else "failed"
        checked[key] = {"status": status, "equalWithinFiniteModel": equal, "ambiguities": ambiguity, "metrics": metrics}
        if key == 'media' and metrics.get('declaredCaptionReferencePunctuationRepairs'):
            checked[key]['comparisonBasis'] = 'source-bound-declared-reference-punctuation-repair'
            checked[key]['originalRenderingClaimedEquivalent'] = False
        if declared_repairs and (key in {"reference_bindings", "reference_lists", "citation_associations", "category_sort"} or
                                 key == "table_cells" and any(row["kind"] == "supplied-positive-span-missing-separator" for row in declared_repairs)):
            checked[key]["comparisonBasis"] = "source-bound-declared-repairs"
            checked[key]["originalRenderingClaimedEquivalent"] = False
            checked[key]["declaredRepairs"] = declared_repairs
            metrics["sourceBoundDeclaredRepairs"] = len(declared_repairs)
        if not equal:
            checked[key]["difference"] = difference(old, new)
    return checked


def checked_path(root, relative):
    file = (root / relative).resolve()
    if not file.is_relative_to(root.resolve()):
        raise ValueError("A recorded capture path leaves its supplied root")
    return file


def read_gzip(file, sha256, size, packed_sha=None):
    packed = file.read_bytes()
    if packed_sha and digest(packed) != packed_sha:
        raise ValueError("Compressed endpoint hash mismatch")
    raw = gzip.decompress(packed)
    if digest(raw) != sha256 or len(raw) != size:
        raise ValueError("Endpoint hash or byte count mismatch")
    text = raw.decode("utf-8", errors="strict")
    if text.encode() != raw:
        raise ValueError("Endpoint is not exact UTF-8")
    return text


def inspect(job):
    row, manifest_root, outputs = job
    capture = str(row["pageid"]) + "_" + str(row["revid"])
    page_file = outputs / "pages" / (capture + ".json")
    page_bytes = page_file.read_bytes()
    recorded = json.loads(page_bytes)
    if recorded.get("sourceVerified") is not True or recorded.get("sourceSha256") != row["sha256"]:
        raise ValueError("The actual-output receipt does not bind this source")
    endpoint = recorded["output"]
    before = read_gzip(checked_path(manifest_root, row["file"]), row["sha256"], row["bytes"], row.get("gzipSha256"))
    after = read_gzip(checked_path(outputs, endpoint["file"]), endpoint["sha256"], endpoint["bytes"], endpoint.get("gzipSha256"))
    checks = compare_sources(before, after)
    return {"capture": capture, "sourceSha256": row["sha256"], "outputSha256": endpoint["sha256"],
            "sourceBytes": row["bytes"], "outputBytes": endpoint["bytes"], "changed": before != after,
            "receiptSha256": digest(page_bytes), "actualCoreVersion": endpoint.get("actualCoreVersion"),
            "actualCompleteVersion": endpoint.get("actualCompleteVersion"), "checks": checks}


def selected_page_ids(raw):
    if not raw:
        return set()
    values = raw.split(',')
    if any(not re.fullmatch(r'[1-9][0-9]*', value.strip()) for value in values):
        raise ValueError('Use decimal page identifiers, without revision suffixes')
    return {int(value.strip()) for value in values}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--outputs", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--workers", type=int, default=1)
    parser.add_argument("--only-changed", action="store_true")
    parser.add_argument("--ids", default="")
    args = parser.parse_args()
    if mw.__version__ != PARSER_VERSION:
        raise ValueError("This oracle requires its pinned independent parser version")
    args.report.mkdir(parents=True, exist_ok=True)
    if (args.report / "SUMMARY.json").exists():
        raise ValueError("Use a fresh private report directory")
    raw_manifest = args.manifest.read_bytes()
    manifest = json.loads(raw_manifest)
    if manifest.get("historyComplete") is not True or manifest.get("complete") is not True:
        raise ValueError("The source collection is incomplete")
    receipt_file = args.outputs / "RUN_PRIVATE.json"
    receipt_bytes = receipt_file.read_bytes()
    receipt = json.loads(receipt_bytes)
    runtimes = receipt["settings"]["hashes"]
    for role in ["core", "complete"]:
        file = Path(receipt["settings"][role])
        if digest(file.read_bytes()) != runtimes[role]:
            raise ValueError("The actual-output runtime snapshot no longer matches its receipt")
    if runtimes.get("coreData"):
        data_file = Path(receipt["settings"]["core"]).with_name(Path(receipt["settings"]["core"]).stem + "_dados.js")
        if digest(data_file.read_bytes()) != runtimes["coreData"]:
            raise ValueError("The actual-output data snapshot no longer matches its receipt")
    ids = selected_page_ids(args.ids)
    selected = []
    for row in manifest["pages"]:
        if row.get("missing") or row.get("namespace") != 0 or not row.get("file") or not row.get("revid"):
            continue
        if ids and row["pageid"] not in ids:
            continue
        page_file = args.outputs / "pages" / (str(row["pageid"]) + "_" + str(row["revid"]) + ".json")
        if not page_file.exists():
            continue
        if args.only_changed and not json.loads(page_file.read_bytes()).get("core", {}).get("changed"):
            continue
        selected.append(row)
        if args.limit and len(selected) >= args.limit:
            break
    if not selected:
        raise ValueError('No hash-bound actual endpoints matched this selection')
    if len({row["pageid"] for row in selected}) != len(selected):
        raise ValueError("The selected source corpus repeats a page identifier")
    started = time.time()
    report = {"schemaVersion": SCHEMA, "kind": "independent-python-ast-oracle", "parser": {"name": "mwparserfromhell", "version": PARSER_VERSION},
              "runnerSha256": digest(Path(__file__).read_bytes()), "sourceManifestSha256": digest(raw_manifest),
              "actualOutputRunReceiptSha256": digest(receipt_bytes), "runtimeSha256": runtimes,
              "finiteModelContractSha256": "9c4b41e60b2564160c46ce53f996deafdc1d18818348edb266c48af9c5be1921",
              "nativeContracts": {"references": 63785697, "nativeListaref": 46320561, "nativeNotelistAlias": 59087899, "nativeListanota": 59274856, "notes": 59102402, "combined": 73218466, "reflist": 56151616,
                                  "genericCitation": 62525251, "cs1Configuration": 73016847, "cs1Module": 72936771,
                                  "plainlistRedirect": 62301792, "plainlistTarget": 69807403, "unbulletedListSource": 930012296},
              "plannedDistinctPages": len(selected), "completedDistinctPages": 0, "changedDistinctPages": 0,
              "captureSelectionSha256": digest(freeze([[row["pageid"], row["revid"], row["sha256"]] for row in selected]).encode()),
              "plannedCaptures": [[row["pageid"], row["revid"]] for row in selected],
              "checks": {key: dict.fromkeys(["passed", "failed", "ambiguous", "not_applicable"], 0) for key in CHECKS},
              "declaredRepairDistinctPages": dict.fromkeys(CHECKS, 0), "declaredRepairKindsDistinctPages": {},
              "status": "running", "networkRequests": 0, "wikipediaWrites": 0, "executionErrors": [], "findings": []}
    jobs = [(row, args.manifest.parent.resolve(), args.outputs.resolve()) for row in selected]
    with concurrent.futures.ProcessPoolExecutor(max_workers=max(1, min(args.workers, 6))) as pool:
        futures = {pool.submit(inspect, job): job[0] for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            row = futures[future]
            try:
                item = future.result()
                report["completedDistinctPages"] += 1
                report["changedDistinctPages"] += int(item["changed"])
                for key, check in item["checks"].items():
                    report["checks"][key][check["status"]] += 1
                    report["declaredRepairDistinctPages"][key] += int(bool(check.get("declaredRepairs")))
                kinds = {repair["kind"] for check in item["checks"].values() for repair in check.get("declaredRepairs", [])}
                for kind in kinds:
                    report["declaredRepairKindsDistinctPages"][kind] = report["declaredRepairKindsDistinctPages"].get(kind, 0) + 1
                if any(check["status"] in {"failed", "ambiguous"} for check in item["checks"].values()):
                    report["findings"].append({"capture": item["capture"], "checks": {key: check["status"] for key, check in item["checks"].items()}})
                (args.report / (item["capture"] + ".json")).write_text(json.dumps(item, ensure_ascii=False, indent=2) + "\n")
            except Exception as error:
                report["executionErrors"].append({"pageid": row["pageid"], "revid": row["revid"], "type": type(error).__name__, "message": str(error)})
            report["elapsedSeconds"] = round(time.time() - started, 3)
            (args.report / "PROGRESS.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    failures = sum(check["failed"] for check in report["checks"].values())
    report["status"] = "failed" if failures or report["executionErrors"] else "completed_with_ambiguities" if any(check["ambiguous"] for check in report["checks"].values()) else "passed"
    report["limitations"] = ["Unknown template expansion and follow/details reference behavior remain ambiguous.",
                              "Independent AST agreement is additional evidence, not a substitute for native rendering or source-bound runtime proofs.",
                              "Declared invalid-syntax and invalid-enum repairs are reported separately; original rendering is not claimed equivalent.",
                              "Counts describe actual distinct captured endpoints and separately report every unsupported ambiguity."]
    (args.report / "SUMMARY.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ["status", "plannedDistinctPages", "completedDistinctPages", "changedDistinctPages", "checks", "executionErrors", "elapsedSeconds"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()

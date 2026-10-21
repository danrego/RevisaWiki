"""Test-only witnesses for exact captured parser disagreements.

These helpers never change a product gate or reclassify a historical receipt.
They do not approve inputs beyond the hashes recorded in the native contract.
"""
from html.parser import HTMLParser
import hashlib
import re


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def literal_references(text):
    opening = re.compile(r'''<ref\b(?:"[^"]*"|'[^']*'|[^'">])*>''', re.I)
    closing = re.compile(r'</ref\s*>', re.I)
    result, cursor, paired = [], 0, 0
    for match in opening.finditer(text):
        if match.start() < cursor:
            continue
        if match[0].rstrip().endswith('/>'):
            end = match.end()
        else:
            close = closing.search(text, match.end())
            if close is None or opening.search(text, match.end(), close.start()):
                raise ValueError('Unclosed or nested literal reference')
            end, paired = close.end(), paired + 1
        result.append(text[match.start():end])
        cursor = end
    if len(list(closing.finditer(text))) != paired:
        raise ValueError('Unmatched literal reference closer')
    return result


class NativeTableEvents(HTMLParser):
    def __init__(self, omit_new_column_scopes=False):
        super().__init__(convert_charrefs=True)
        self.events, self.removed = [], 0
        self.omit_scopes = omit_new_column_scopes

    def handle_starttag(self, tag, attributes):
        attributes = list(attributes)
        if self.omit_scopes and tag == 'th' and ('scope', 'col') in attributes:
            attributes.remove(('scope', 'col'))
            self.removed += 1
        self.events.append(['start', tag, sorted([list(pair) for pair in attributes])])

    def handle_endtag(self, tag):
        self.events.append(['end', tag])

    def handle_data(self, value):
        if value.strip():
            self.events.append(['text', value])


def exact_binding(contract, source, output, model_sha, receipt_sha):
    binding = contract['sourceCapture']
    return (
        contract['status'] == 'passed'
        and binding['sourceSha256'] == sha(source.encode())
        and binding['outputSha256'] == sha(output.encode())
        and binding['independentModelSha256'] == model_sha
        and binding['originalIndependentReceiptSha256'] == receipt_sha
        and binding['originalRecordedStatus'] == 'failed'
        and binding['originalRecordedStatusChanged'] is False
        and contract['wikipediaWrites'] == 0
    )

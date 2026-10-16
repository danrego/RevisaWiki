"""Read the saved synthetic native HTML with the standard-library parser."""
from pathlib import Path
from html.parser import HTMLParser
import json


class Projection(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.current = None
        self.block = None
        self.rows = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div' and attrs.get('id', '').startswith('spacing-'):
            self.current = attrs['id'][8:]
            self.depth = 1
            self.rows[self.current] = {'paragraphs': [], 'emptyParagraphs': 0, 'headings': [], 'pre': [], 'breaks': 0}
            return
        if not self.current:
            return
        if tag == 'div':
            self.depth += 1
        if tag in ['p', 'h2', 'pre']:
            assert self.block is None
            self.block = {'tag': tag, 'text': ''}
        if tag == 'br':
            self.rows[self.current]['breaks'] += 1

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_data(self, data):
        if self.current and self.block:
            self.block['text'] += data

    def handle_endtag(self, tag):
        if not self.current:
            return
        if self.block and tag == self.block['tag']:
            text = self.block['text']
            key = {'p': 'paragraphs', 'h2': 'headings', 'pre': 'pre'}[tag]
            if tag == 'p' and not text.strip():
                self.rows[self.current]['emptyParagraphs'] += 1
            else:
                self.rows[self.current][key].append(text.strip() if tag != 'pre' else text)
            self.block = None
        if tag == 'div':
            self.depth -= 1
            if self.depth == 0:
                self.current = None


out = {}
for state in ['before', 'after']:
    parser = Projection()
    parser.feed((Path(__file__).with_name('spacing_native') / (state + '.html')).read_text())
    out[state] = parser.rows
print(json.dumps(out, ensure_ascii=False))

"""Read only the controlled quote elements of saved native HTML."""
from html.parser import HTMLParser
from pathlib import Path
import json


class Projection(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = {}
        self.current = None
        self.part = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identity = attrs.get('id', '')
        if tag == 'div' and identity in ['q0', 'q1', 'q2', 'q3']:
            self.current = identity
            self.rows[identity] = {'quote': '', 'author': '', 'boxClasses': [], 'authorClasses': []}
        if self.current is None:
            return
        classes = attrs.get('class', '').split()
        if 'quotebox' in classes:
            self.rows[self.current]['boxClasses'] = classes
        if tag == 'blockquote':
            self.part = 'quote'
        if tag == 'cite':
            self.part = 'author'
            self.rows[self.current]['authorClasses'] = classes

    def handle_endtag(self, tag):
        if tag in ['blockquote', 'cite']:
            self.part = None

    def handle_data(self, data):
        if self.current is not None and self.part is not None:
            self.rows[self.current][self.part] += data


result = {}
for state in ['before', 'after']:
    parser = Projection()
    parser.feed((Path(__file__).with_name('quote_native') / (state + '.html')).read_text())
    for row in parser.rows.values():
        row['quote'], row['author'] = row['quote'].strip(), row['author'].strip()
    result[state] = parser.rows
print(json.dumps(result, ensure_ascii=False))

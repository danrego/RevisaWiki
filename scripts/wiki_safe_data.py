"""Keep a JSON data module unchanged through a MediaWiki save.

MediaWiki normalizes incoming source to NFC and performs pre-save substitutions,
including inside JavaScript strings. Escape the vulnerable source characters,
without normalizing or changing the decoded keys and values. This deliberately
does not modify JavaScript code outside the complete JSON literal.
"""
from __future__ import annotations

import json
import re
import unicodedata

_JSON_STRING = re.compile(r'"(?:[^"\\]|\\.)*"')
_DATA_MARKER = 'const data='
_DATA_SUFFIX = ';if(typeof module'


def _vulnerable(character: str) -> bool:
    scalar = ord(character)
    return (
        character in '{~\u2028\u2029'
        or unicodedata.category(character).startswith('M')
        or unicodedata.normalize('NFC', character) != character
        or 0x1100 <= scalar <= 0x11FF
        or 0xA960 <= scalar <= 0xA97F
        or 0xD7B0 <= scalar <= 0xD7FF
    )


def _escape_string(match: re.Match[str]) -> str:
    def escaped(character: str) -> str:
        scalar = ord(character)
        if scalar <= 0xFFFF:
            return f'\\u{scalar:04x}'
        scalar -= 0x10000
        return f'\\u{0xD800 + (scalar >> 10):04x}\\u{0xDC00 + (scalar & 0x3FF):04x}'

    return ''.join(
        escaped(character) if _vulnerable(character) else character
        for character in match.group(0)
    )


def protect_json_source(source: str) -> str:
    """Escape JSON string spelling while retaining every decoded value.

    Escaping every left brace covers substitution aliases in any language and
    escaping tildes prevents signatures. Combining marks, canonically unstable
    scalars and Hangul composition characters are escaped individually, retaining
    distinct object keys that would collide after normalization.
    """
    decoded = json.loads(source)
    protected = _JSON_STRING.sub(_escape_string, source)
    if json.loads(protected) != decoded:
        raise ValueError('The JSON data changed while protecting its source')
    if unicodedata.normalize('NFC', protected) != protected:
        raise ValueError('The protected JSON source is not NFC-stable')
    if '{{' in protected or '~~~' in protected:
        raise ValueError('A pre-save trigger remains in the JSON source')
    return protected


def protect_data_module(source: str) -> str:
    """Protect the complete JSON literal in the known data-module wrapper.

    A JSON decoder locates the end of the literal rather than a text search, so
    strings containing wrapper-like text cannot truncate the protection.
    """
    marker = source.find(_DATA_MARKER)
    if marker < 0:
        raise ValueError('The data-module marker is missing')
    begin = marker + len(_DATA_MARKER)
    _, end = json.JSONDecoder().raw_decode(source, begin)
    if not source[end:].startswith(_DATA_SUFFIX):
        raise ValueError('The complete data-module suffix is missing')
    protected = (
        source[:begin] + protect_json_source(source[begin:end]) + source[end:]
    )
    if unicodedata.normalize('NFC', protected) != protected:
        raise ValueError('Source outside the JSON literal is not NFC-stable')
    if '{{' in protected or '~~~' in protected:
        raise ValueError('A pre-save trigger remains outside the JSON literal')
    return protected

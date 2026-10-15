# Public test provenance and privacy

Historical test reports retain their recorded assertions, counts, results and code hashes. Machine-local source paths were replaced with neutral portable placeholders. A synthetic calendar-validity fixture was changed to another valid date. These privacy changes do not rerun or alter historical test results.

When a public-file integrity record changes, its original hash is retained under `privacyOriginalSha256` or `privacyOriginalPortableSha256`, while the normal hash field describes the sanitized public file. Original captured-source hashes and historical source-manifest hashes remain provenance values, rather than claims that the redacted public bytes are unchanged. Gzip evidence is sanitized after decompression and recompressed deterministically.

Public article facts, citation URLs, third-party credits and the permitted project account links are retained. No screenshots or other image files were present in the fetched Git history.

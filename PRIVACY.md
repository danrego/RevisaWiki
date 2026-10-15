# Public test provenance and privacy

Historical test reports retain their recorded assertions, counts, results and code hashes. Machine-local source paths were replaced with neutral portable placeholders. A synthetic calendar-validity fixture was changed to another valid date. These privacy changes do not rerun or alter historical test results.

When a public-file integrity record changes, its original hash is retained under `privacyOriginalSha256` or `privacyOriginalPortableSha256`, while the normal hash field describes the sanitized public file. Original captured-source hashes and historical source-manifest hashes remain provenance values, rather than claims that the redacted public bytes are unchanged. Gzip evidence is sanitized after decompression and recompressed deterministically.

Article facts, scientific data and bibliographic authors are retained. Script attribution uses permanent source revisions, without named editorial credits. Only the technical account paths needed for installation and repository access remain. No screenshots or other image files were present in the fetched Git history.

The eight earlier commits were rewritten with generic author and committer metadata. Their dates and order were preserved. The check covered every reachable file and the contents of archives. See [the history check](tests/evidence/2.6.0/privacy/HISTORY_PRIVACY_SUMMARY.json).

If you work from a clone made before this cleanup, make a fresh clone before sending changes. An old clone can bring the removed history back. Rewriting the repository cannot erase other people's copies or guarantee that GitHub immediately removes old cached objects.

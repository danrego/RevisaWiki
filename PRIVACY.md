# Public test provenance and privacy

Historical test reports retain their recorded assertions, counts, results and code hashes. Machine-local source paths were replaced with neutral portable placeholders. A synthetic calendar-validity fixture was changed to another valid date. These privacy changes do not rerun or alter historical test results.

When a public-file integrity record changes, its original hash is retained under `privacyOriginalSha256` or `privacyOriginalPortableSha256`, while the normal hash field describes the sanitized public file. Original captured-source hashes and historical source-manifest hashes remain provenance values, rather than claims that the redacted public bytes are unchanged. Gzip evidence is sanitized after decompression and recompressed deterministically.

Article facts, scientific data and bibliographic authors are retained. Script attribution uses permanent source revisions, without named editorial credits. Only the technical account paths needed for installation and repository access remain. No screenshots or other image files were present in the fetched Git history.

The eight earlier commits were rewritten with generic author and committer metadata. Their dates and order were preserved. The check covered every reachable file and the contents of archives. See [the history check](tests/evidence/2.6.0/privacy/HISTORY_PRIVACY_SUMMARY.json).

If you work from a clone made before this cleanup, make a fresh clone before sending changes. An old clone can bring the removed history back. Rewriting the repository cannot erase other people's copies or guarantee that GitHub immediately removes old cached objects.

## Before each upload

Keep personal information out of project code, comments, documentation, research notes, filenames, test reports, copy-paste indexes and distribution archives. Do not add named editorial credits or identify whose edits were examined. Retain only the agreed technical account links needed for installation and access to the repository. Article facts, bibliographic authors and required third-party license notices remain source material.

Run `python3 scripts/check_privacy.py` before publication. For uploads prepared outside the tracked checkout, run `scripts/publication_privacy_gate.py` with an explicit `--allowlist` covering every file to be uploaded. Check the final packaged bytes, including archive contents, and review new filenames and Git author/committer metadata. Use neutral project identity metadata. Keep authentication files, private evidence, screenshots and machine-local reports outside the publication set.

Any finding must be resolved before uploading. A passing scan still requires a review of new prose and metadata, since pattern checks cannot recognize every personal identifier.

Two immutable article fixtures contain reviewed public identifiers in bibliographic fields: an institutional social identifier in a source title and a newspaper author's professional contact in the existing author field. The reviewed allowances bind the exact source-content hash and identifier hash, preserving the original citations without allowing other identifiers or modified source bytes. Neither identifies the owner or a Wikipedia editor. These allowances do not permit personal account details about the owner or editors.

An immutable public stylesheet used by the layout tests contains three image-size custom properties that resemble a user namespace. They contain no account name. Their reviewed allowance binds the complete stylesheet hash and each exact declaration. Changes to the stylesheet or an additional account destination still require review.

Current URL-grammar fixtures contain literal dummy user information in reserved documentation or test domains. Approval binds each complete source file and the exact URL hash. It does not exempt other addresses, names, domains or modified files. Separate mutation tests require those changes to be reported.

Two abstract namespace labels in an immutable fictional template-collision fixture are retained because their native basenames are the tested boundary. Approval binds the complete fixture hash and each exact token. Other account names, edited fixture bytes and additional identifiers remain rejected. The fixture does not assert that either label identifies an editor.

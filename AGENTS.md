# RevisaWiki publication rules

- Read `PRIVACY.md` before preparing changes or uploads.
- Do not include personal information about the owner or other editors in project code, comments, documentation, research notes, filenames, reports or packages.
- Retain only the agreed technical account paths needed for installation and repository access. Use neutral project author and committer metadata.
- Preserve article facts, bibliographic authors and required third-party license notices.
- Run the privacy checks against the final publication set, including new files and archive contents, before uploading. Review new prose, filenames and Git metadata as well.
- Keep private evidence, credentials, screenshots and machine-local files outside the publication set.
- Do not edit or publish on Wikipedia.

## Installation data release gate

- Serialize installable JSON data through `scripts/wiki_safe_data.py`. Preserve every decoded key and value and keep the catalogue hash check enabled.
- Require a successful read-only native pre-save round trip for the exact final data bytes before packaging or publication. The receipt must match the current data file, runtime manifest and gate implementation. Missing, failed or stale receipts block the delivery builder.
- Keep historical release files, manifests and test outcomes immutable. A corrected distribution gets a separate revision directory and GitHub tag.
- Keep data, core and loader destinations explicit in the copy-paste index. The fixed common.js call is not replaced during a routine update.

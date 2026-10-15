RevisaWiki 2.5: inherited independent 2.4 contracts

Run from the repository root with Node.js 18 or newer:
  node tests/v25_legacy/run_all.cjs

Default tested distribution: dist/2.5.0/RevisaWiki_v2_5_completo.js
Override with REVISAWIKI_QA_SCRIPT, an absolute path or path relative to the working directory. REVISAWIKI_QA_REPORT optionally selects the report file. The default report is tests/v25_legacy/artifacts/independent_contract_results.json.

The suite uses Node built-ins only and makes no network requests. It does not open an editor, account or Wiki page. The tests require the release's exported pure API.

Input and exact expected output fixtures cover six bounded syntax-repair families, protected literal and ambiguous content, known parameter typos and canonical/accepted alias collisions, narrow source-proof mutations, cache poisoning, safe-prefix isolation, one-click idempotence, summary topics, UTF-8 byte accounting and exact accept/reject diff composition. Every positive is exercised through cleanup and calculate as well as the isolated helper. The initial syntax corpus was frozen before reading the new implementation. Scope corrections are documented in design_amendments.txt. discovered_fixtures.json freezes regressions found during independent execution.

preview_contracts.js is an evaluatable browser expression for the exported API plus a real DOMParser. It checks the extra exact source-bound rendering baseline without relaxing table-cell or error conservation. It makes no requests. The real native Chrome/Firefox/Safari UI runs are separate release evidence and include actual Worker and fallback adjustment, visible diff, exact undo and repeated-click checks.


The entrypoint also executes the 450 punctuation, 72 reference-header and 64 reference-column regressions from 2.3. Their fixture JSON files stay unchanged. The three actual article sources are bundled in legacy/source_files and required, never silently skipped. Their source revision IDs are 71855786, 72350938 and 72221307. The aggregate is artifacts/suite_results.json; expected final count per selected distribution is 1066 cases. Another 40 cases test paired markup with isolated apostrophes and the mandatory Desflorestação source revision 68784588 in desflorestacao/source_68784588.wiki.

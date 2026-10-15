# Installation hotfix checks

Run with Node 18 or later, without installing packages:

```sh
node tests/v261/hotfix/run_all.cjs
```

Every runner first verifies the seven JavaScript files against `tests/expected_release_v261_hotfix_1.json`. The distribution is `2.6.1-hotfix.1`, while the runtime and data package retain version `2.6.1`. The frozen `dist/2.6.1` files, assertions and reports remain unchanged.

- `run_startup.cjs` checks the permanent bootstrap, five-minute cache buckets, shared and personal destinations, lazy loading, duplicate guards, failure recovery and verified data caching. These tests use an offline VM and do not request the network. The catalog-cache VM replaces only the final UI mount function and states that boundary in its report. The real transformation code runs unchanged in the other suites.
- `run_focus.cjs` retains the reference, template-alias, parser, source-preservation and idempotence assertions from the focused 2.6.1 runner. Its only adaptations select the hotfix files, accept the runtime version and resolve the existing fixture directory.
- `run_engine.cjs` stages the original `tests/v26_engine` assertions and fixtures in a temporary directory, verifies their hashes and replaces only the release-loading/report helper. It runs the original contracts, integration, composition, quote-lexer and corpus suites on the new core and complete bundle.

The startup suite also proves the exact production-code delta from the frozen release. The complete bundle differs only in an equivalent regular-expression quantifier. The modular core has that change and a cache key containing the runtime version and packed-catalog hash. The data file is identical.

Results are written to `artifacts/v261_hotfix_1`, or to `REVISAWIKI_REPORT_DIR` if supplied. Reports contain file hashes and neutral test identifiers. No Wikipedia writes occur. The five-minute bucket affects the next page load and does not create a timer or an edit.

VM syntax checks are not a substitute for ResourceLoader validation. The official server-parser and native-browser startup evidence is recorded separately. It is not a dependency of this offline Node test command.

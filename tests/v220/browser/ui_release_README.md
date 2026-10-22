# Native editor qualification

`ui_release.cjs` runs the pinned 2.20.0 bundles in installed Chrome, Firefox and Safari on macOS. Each browser runs 54 flows. The modular flows load the separate data file before the core. The other flows load the complete bundle.

The test server accepts read-only loopback requests. MediaWiki API replies, source2017 and textSelection editor contracts are fictional local adapters. The browsers execute the actual release transformations, Workers, staged fallback and editor handlers. Only the exact production origin guards are adapted to admit the local test server. These tests do not claim a live Wikipedia deployment or the complete native VisualEditor or CodeMirror packages.

The matrix covers circular editor objects, both adjustment buttons, repeated actions, Undo, source and editor identity changes while work is pending, mixed manual and automatic edits, minor ownership, cancellation, preview failures, preview rollback, a missing final preservation proof and no-op actions. Fault controls are explicit. The missing-proof case changes only the proof field of a real Worker result. It does not replace the source transformation or weaken a product check.

Each browser also runs two actual 60,000 ms deadlines, one per bundle. A local Worker wrapper leaves exactly its first calculation dispatch unanswered. It does not shorten the product timer, change a result or invoke an alternate engine. The test checks that the entire draft, manual summary and minor choice remain identical after the deadline, then confirms normal typing, a new real calculation and Undo. These controls use short fictional sources. They do not repeat any known extreme-source timeout.

Example invocation, with the native driver dependencies configured in the environment:

```sh
node tests/v220/browser/ui_release.cjs Firefox SNAPSHOT_DIRECTORY SNAPSHOT_DIRECTORY/MANIFESTO_RUNTIME.json PRIVATE_REPORT.json
```

Run the browsers sequentially and coordinate ownership with other browser suites. The runner closes only its own automation session. Screenshots, clipboard writes, publication controls, form submission and nonlocal requests are blocked or checked. A partial report is saved when each flow starts and before every deadline wait. Final receipts remain separate from the planned case inventory in `ui_release_contract.json`.

For a coordinated stop, set `REVISAWIKI_UI_STOP_FILE` to a private stop-file path before starting the runner. Creating that file lets the current flow finish, including a running real deadline, then skips every remaining unstarted flow and closes the owned browser session. The separate interruption record does not change any completed result. Removing the stop file does not resume the same run.

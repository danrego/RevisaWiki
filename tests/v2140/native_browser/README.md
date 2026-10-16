# Native browser regression for 2.14.0

This suite keeps the original 2.13.0 browser files and article fixtures unchanged. It compiles a recorded in-memory adaptation of those source modules against the new distribution. Every adapted block is visible in `COVERAGE_AND_ADAPTATION.json`, including its original source text, replacement, reason and source/compiled hashes.

The user requested removal of the custom Before/After viewer and per-change selection. Those retired assertions are recorded as retired. The replacement checks activate the editor's confirmed native `wpDiff` control with a local click stub, preserve the complete adjusted source, and verify that the old custom panels stay absent. They never submit the form or claim to test a remotely rendered Wikimedia diff page.

Except for the one explicitly reviewed static Aeroclubes full endpoint, all original handwritten source endpoints and ambiguous negative cases, article bytes, Apply/Undo, real Workers, occurrence counts, summaries, saved-revision minor-edit choices, source/options freshness, failure/cancellation and large-table data checks remain. The selective partial endpoint is intentionally replaced by the full retained endpoint. Twenty additional flows cover valid native submit controls and invalid or disabled controls in both modular and complete modes.

Prepare the explicit adaptation plan without launching a browser:

```sh
node tests/v2140/native_browser/prepare.cjs
node tests/v2140/native_browser/test_adapter.cjs
```

After the release is frozen and browser ownership is coordinated, run each real browser with the exact target manifest digest:

```sh
REVISAWIKI_INSTALL_REPORT_DIR=artifacts/v2140/native_browser node tests/v2140/native_browser/run_release.cjs Chrome --final-pin=FINAL_MANIFEST_SHA256
```

Use `Firefox` or `Safari` for the other engines. Safari automation must be available. Each runner closes only its own automation session. All HTTP requests are to loopback fixtures, every non-GET request is refused, API replies are local mocks, and no account or clipboard is used.

Run the additional image-proof flows with `--stage=images`. They keep the historical photo metadata, exact endpoints, negative evidence, minor-edit ownership and Undo checks, and use the same native shortcut contract. Their default output is `artifacts/v2140/final_image`.

After all three browsers and their image stages finish, bind the actual results to the same final pin:

```sh
node tests/v2140/native_browser/summarize.cjs --include-images --final-pin=FINAL_MANIFEST_SHA256
```

The final report records the actual flow and assertion counts. A report from an earlier candidate is not release evidence for a later build.

The runner saves the first concrete failure and stops its own session. It refuses to overwrite an existing receipt, so a withdrawn candidate must be archived before another final run.

The Aeroclubes full endpoint admits exactly one additional newline deletion before `== Acre ==`, and its four historical lexical repairs therefore count as five total repairs. The original input and expected files stay unchanged. `fixtures/AEROCLUBES_SPACING_ORACLE.json` records the old/new hashes, exact source quote and owner-reviewed reason. All 82 reference definitions remain literal, and no generic normalizer creates the static expected file.

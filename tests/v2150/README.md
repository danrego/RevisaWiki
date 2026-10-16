# Template-release tests

The current release is built from the pinned 2.14.0 distribution. Production
patches live in `src/v2_15`; historical code and test fixtures remain unchanged.

Use `npm test` for the inherited offline suites and the focused release tests.
`npm run test:focused` selects the new boundaries and the preceding release's
focused tests. `npm run test:complex` and `npm run test:large-articles` run the
stored large-article matrices separately. No test edits Wikipedia.

The reader tests include brace runs, dynamic template and argument names,
missing versus empty values, protected examples, unverified capitalizations,
documentation and test contexts. Native preprocessing fixtures record their
actual GET responses and hashes; replay does not make fresh network requests.

Template-definition tests cover exact endpoints, refused ambiguous input,
parameter values and precedence, pipeline composition, repeated execution,
retained adjustment counts and forged-plan rejection. CSS tests bind each
declaration to its selector, at-rule context, value, priority and position.
Native acceptance is required before a CSS repair enters the editor.

The `inherited` adapter preserves all source fixtures and behavioral assertions
from the original regression suite. It records the existing two literal spacing
extensions and the native editor comparison contract introduced in 2.14.0.
The finite identity oracle records 33 exact generated spellings that no longer
qualify as confirmed native titles. Their 156 positive eligibility decisions
per bundle become refusals, with all original assertion bodies and negative
assertions retained. Static paired endpoints separately verify their documented
native spellings and preserve every unverified source byte.
Three other generated positive loops use the same normalized catalogue keys as
literal source titles. A separately recorded finite projection supplies the
documented native spellings to those 324 generated inputs per bundle, preserving
every field, value and original assertion. The original unverified spellings are
also tested as refusals. This source-input amendment is distinct from the
eligibility changes above and from the later README-only provenance correction.
The `previous_release.cjs` adapter also executes the 2.14.0 focused suites against
the current runtime, changing only version labels and runtime addresses.

Real browser tests use `native_browser/run_release.cjs` with an explicit browser
and final manifest digest. They run local editor fixtures and real Workers,
intercept native diff clicks, refuse remote requests and never submit a form.
They close only their owned automation sessions. Copy-index tests use a mock
clipboard, preserving the system clipboard.

The final reports in `tests/evidence/2.15.0` state the actual executed case and
assertion counts and bind the tested executables by SHA-256. Synthetic cases
and permutations are not described as distinct articles. A report from a
withdrawn build is not evidence for the final distribution.

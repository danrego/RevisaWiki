# Reference repairs in 2.10.0

`test_reference_graph.cjs` adds exact-output, preservation, composition and second-click tests to the inherited reference suites. The inherited tests retain their original assertions. The new runner records the exact executable hashes and distinguishes synthetic permutations from article fixtures.

## Literal reference graph

The new rules require a complete article in the main namespace. Each reference must have static, recognized attributes and a complete body or a literal reuse. Protected examples, comments and quoted source are outside the graph. Unknown transclusions, indirect reference helpers and unconfirmed collector defaults prevent a graph-dependent repair.

Named-reference identity contains the effective group and the literal name. A collector interval is calculated separately for each group. A name or definition used across different intervals is preserved. A group inherited from an explicit recognized collector participates in identity just like a group written on the reference itself.

### List-defined duplicates

The bank rule recognizes explicit `references` containers and the `refs=` parameter of known collectors. A complete definition remains, every affected inline use is updated together, and definitions with no inline use are preserved. Different pages, quoted passages, authors, dates, URLs and other citation fields prevent consolidation.

Citation aliases use the existing deterministic field normalizer. The body key also distinguishes citation-template nodes from literal text. Literal JSON-like text cannot impersonate a normalized citation. The retained source body is not rewritten by the new key.

### Conflicting complete definitions

A conflicting name can receive a free suffix only when every occurrence has its own complete body. A single empty reuse, list-defined occurrence, indirect call, continuation, details attribute or separate collector interval prevents the separation. Bodies and their order remain unchanged. The new name is unique within its group.

### Malformed opening

The finite spelling rule repairs `<refname="source">` only when one complete body and one matching `</ref>` confirm the boundary. It adds the missing space. It does not apply fuzzy tag-name correction, invent a closing boundary or reinterpret protected code examples. Multiple independently complete instances are handled in the same pass.

## Harvard anchor validation

`v210HarvardAnchorCandidates` returns exact-source proposals without changing the text. The local author sequence and year must match one bibliography item. Existing `ref` parameters, including explicit opt-outs, prevent a proposal. Equality of a concatenated target string alone cannot substitute a different author sequence.

`v210HarvardAnchorNativeProof` requires a real HTML parser and the before/after native renderings of that exact proposal. It checks that the target changes from zero occurrences to one, that the existing short-reference links remain, and that removing only the new target `id` makes the rendered HTML equal. New errors, changed text, changed links, duplicate targets and stale candidates are refused.

`v210HarvardAnchorEdits` consumes only a proof bound to the source hash, source length, page, candidate, target and proposed output. Each proof authorizes one candidate. A source edit or page change invalidates it. A failed or unavailable native check leaves the source unchanged and adds no alert.

`reference_graph_native.json` supplies synthetic positive and negative DOM cases. The captured `native_harvard_render.json` fixture supplies a native-render specimen. The browser harness exercises the proof with the browser's `DOMParser`. The Node runner explicitly reports when its optional DOM branch did not run. A skipped Node DOM branch is never reported as native-browser validation.

## Recorded evidence

Final results belong to `tests/evidence/2.10.0` and must bind the final executable manifest. Local development runs do not become release evidence merely because they passed. The runners make no Wikipedia edits and use no account. Native capture scripts use anonymous, read-only parse requests.

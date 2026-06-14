# Regression Audit — Post-Modernization

**Date:** 2026-06-14
**Branch:** `claude/regression-audit` (off `dev` @ `8d7f074`)
**Range audited:** `a2f34e2` (upstream `1.6.2-beta.1`, the commit before our work began) → `8d7f074` — **98 commits**, ~444 frontend / 43 electron / 38 server source files changed.

> **Purpose:** verify that the large modernization effort (Svelte 3→5, Vite 4→8, Electron 37→40, TypeScript 4.9→5.9, ESLint 8→9, `music-metadata` 7→11, the security/correctness audit fixes, and the full `strict`-mode refactor) has not introduced latent functional regressions.
>
> **This is a documentation-only pass — no fixes were applied.** Every finding below is either **CONFIRMED** (proven by code/build artifact) or **NEEDS VERIFICATION** (requires a manual QA run of the packaged app).

---

## TL;DR / Verdict

The shipped app's **core logic is in good shape**: production compile, type-check, and the unit suite are all green, and the deep review of the two scariest changes — the mechanical `strict`-mode refactor and the Svelte 5 migration mechanics — came back **clean** (details in [§6](#6-verified-safe-negative-findings)). The refactor even *surfaced two real pre-existing bug-fixes*.

What automated checks **cannot** see, and where the residual risk actually lives:

- **2 CONFIRMED runtime issues**, both narrow: LTC timecode audio input silently fails ([H1](#h1)), and 3 `:has()` CSS rules are silently dropped (cosmetic, [M1](#m1)).
- **1 CONFIRMED dev-workflow break**: `npm start` doesn't work ([M2](#m2)) — does **not** affect the packaged app.
- **A cluster of runtime-only behaviors** (audio metadata, contenteditable slide editing, media-"ended"→Next, RemoteShow logo, NDI/Blackmagic frames, PDF) that are invisible to compile/type/unit checks and need a manual QA pass — see the [QA checklist](#7-recommended-manual-qa-checklist).

No evidence of a broad functional regression was found. The user's observation ("app seems to work fine") is consistent with this: the confirmed issues are either cosmetic, dev-only, or behind niche features.

---

## 1. Severity-ranked findings (quick scan)

| # | Severity | Status | Area | One-liner |
|---|---|---|---|---|
| [H1](#h1) | **HIGH** | CONFIRMED | Vite 8 / worklet | LTC timecode worklet URL 404s → LTC input silently dead |
| [H2](#h2) | **HIGH** | NEEDS QA | Svelte 5 | contenteditable slide-text editing (`EditboxLines`) — caret/IME |
| [H3](#h3) | **HIGH** | NEEDS QA | Svelte 5 | media "ended" → Next-on-finish may double-fire (already bit once) |
| [M1](#m1) | MED | CONFIRMED | Svelte 5 CSS | 3 `:has()` scoped rules pruned from bundle (cosmetic) |
| [M2](#m2) | MED | CONFIRMED | Vite 8 dev | `npm start` dev mode broken (serves prod bundle) |
| [M3](#m3) | MED | NEEDS QA | music-metadata 11 | ESM-only dep `require()`d from CJS — works on Node ≥22.12, fragile, untested |
| [M4](#m4) | MED | NEEDS QA | Vite 8 IIFE | RemoteShow auth-screen logo via `import.meta.url` |
| [M5](#m5) | MED | NEEDS QA | Electron 40 | OSR `capturePage` / `desktopCapturer` (NDI/BMD/thumbnails) on Chromium 140 |
| [M6](#m6) | MED | NEEDS QA | Svelte 5 | rename inputs (`HiddenInput`) — reactive write to bound prop |
| [M7](#m7) | MED | NEEDS QA | Vite 8 IIFE | pdfjs `import.meta.url` → `{}` (PDF import/preview) |
| [L1](#l1) | LOW | NEEDS QA | Svelte 5 | output slide transitions (`OutputTransition`, pre-existing fragility) |
| [L2](#l2) | LOW | CONFIRMED | Vite servers | deprecated `assetInfo.name` (works today; inconsistent w/ main config) |
| [L3](#l3) | LOW | NEEDS QA | Svelte 5 | `<svelte:component>` (editor inputs, popups), `data = data` reactivity |
| [L4](#l4) | LOW | NEEDS QA | strict refactor | `Conditions.svelte` added optional-chain (throw → `undefined`) |

Plus **two bug-fixes surfaced** by the work ([§9](#9-bug-fixes-surfaced-positive)) and an **environmental build note** ([§10](#10-appendix--environment--methodology)).

---

## 2. Automated verification results

Run on this Linux container (Node 22.22). Native modules (`better-sqlite3`, `@discordjs/opus`, …) are **not** compiled here, which affects only app launch / packaging, not the checks below.

| Check | Command | Result |
|---|---|---|
| Unit tests | `npm run test:unit` | ✅ **251 passed / 251** (35 files) |
| Type-check | `npm run test:svelte` | ✅ **0 errors**, 125 a11y warnings (documented backlog), 57 files |
| Frontend bundle | `vite build` | ✅ 1394 modules, `bundle.js` 3.16 MB |
| Companion apps | `build:servers:prod` | ✅ remote/stage/controller/output_stream all built, `styles.css` non-empty |
| Electron main | `tsc` (prod config) | ✅ 0 errors |
| **`npm run build` (overall)** | | ⚠️ **exit 1 — but only at `postBuild.js`** (`@discordjs/opus/prebuild` missing; native deps not compiled here; script unchanged by our work). All compile steps pass. **Environmental, not a regression** — see [§10](#10-appendix--environment--methodology). |

**Build warnings worth noting** (all reproduced from the build log): `import.meta` stripped in IIFE for pdfjs ([M7](#m7)) and `Auth.svelte` ([M4](#m4)); `fs` externalized for `json-bible` (likely pre-existing, see [§6](#6-verified-safe-negative-findings)); 4 "unused CSS selector" warnings ([M1](#m1)).

---

## 3. HIGH findings

<a name="h1"></a>
### H1 — CONFIRMED: LTC timecode worklet 404s (silent failure)

- **Evidence:** `src/frontend/components/timeline/timecode.ts:5` imports the worklet via `import ltcProcessorUrl from "./ltcProcessor.ts?worker&url"` and loads it at `:108` `await listenerCtx.audioWorklet.addModule(ltcProcessorUrl)`. The production bundle bakes the **absolute** URL `/assets/ltcProcessor-cWQBu8r1.js` (Vite `base` defaults to `/`), but the file is emitted to `public/build/assets/…`. Production loads `public/index.html` via `loadFile` (`src/electron/index.ts`), so `/assets/…` resolves to a non-existent path → **404**.
- **Why it's silent:** the `addModule` call is inside a `try/catch` (`timecode.ts:117`) that only `console.warn`s.
- **Contrast (root cause):** the 3 *working* worklets (`noise-gate-processor.js`, `stereo-shaper-processor.js`, `soundtouch-processor.js`) use hand-written **relative** strings (`addModule("./assets/…")`, `audioNoiseGate.ts:46`, `audioStereoShaper.ts:41`) and ship as **committed files in `public/assets/`**. Only the LTC worklet went through Vite's `?worker&url`, which produces a base-prefixed absolute URL incompatible with `file://` loading.
- **Impact:** LTC timecode **input** never initializes. Niche feature, but a clear regression from the Vite migration.
- **Fix direction (not applied):** set `base: "./"`, **or** convert the LTC worklet to the committed `public/assets/` + relative-string pattern the other three use.

<a name="h2"></a>
### H2 — NEEDS QA: contenteditable slide-text editing under Svelte 5

- **Evidence:** `src/frontend/components/edit/editbox/EditboxLines.svelte:786` two-way binds `innerHTML` on a `contenteditable` div (the core text editor). Svelte 5 changed contenteditable input/caret handling. *Not touched by the diff — risk is the runtime swap itself.*
- **Impact (if regressed):** caret jumps, lost keystrokes, or broken multi-line/chords editing — high-blast-radius for the primary editing workflow.
- **QA:** type/edit/delete in a textbox (single & multi-line), caret position after edits, chords-mode toggle (`textElem` gating ~`:775`), paste.

<a name="h3"></a>
### H3 — NEEDS QA: media "ended" → "Next on finish" double-fire

- **Evidence:** upstream already patched this once for `BackgroundMedia.svelte` (commit `c1830d3`, "Next on media finished sometimes triggering twice") by guarding a `$:` reactive — exactly the reactive-flush-frequency behavior that differs in Svelte 5. The sibling `src/frontend/components/media/Video.svelte:190` (`$: if (video) slManager.update(slParams)`) + `handleEnded → dispatch("ended")` (`:192`) use the same pattern and were **not** similarly guarded.
- **Impact (if regressed):** presentation skips two slides on video end.
- **QA:** play a video to natural end (looping & non-looping); confirm "Next on finish" advances **exactly once**; repeat with soft-loop.

---

## 4. MEDIUM findings

<a name="m1"></a>
### M1 — CONFIRMED: Svelte 5 prunes 3 `:has()` scoped CSS rules

- **Evidence:** build emits "Unused CSS selector" for `Popup.svelte:205` (`.card:has(.popup-back) h2`), `FloatingInputs.svelte:71` (`.row:has(.overflow)`), `:74` (`.row:has(.overflow-interact)`). Verified **absent** from `public/build/bundle.css` (`margin-left:35` → 0 matches; `:has(.overflow)` bare rule → 0). Other `:has()` selectors (textfield/togglefield, and the `:global(button)` variant) survive — Svelte drops only the ones whose inner class it can't statically match in the component's own markup.
- **Impact:** cosmetic/layout only — popup heading offset when a back button is present; FloatingInputs overflow behavior. No functional break.
- **Fix direction:** wrap the affected selectors in `:global(...)` or restructure so the referenced class is statically visible.

<a name="m2"></a>
### M2 — CONFIRMED: `npm start` (dev mode) is broken

- **Evidence:** `public/index.html:20` hardcodes the **production** bundle `<script type="module" src="./build/bundle.js">`. In dev, Vite serves with `root: "public"` and `publicDir: false` (`vite.config.mjs:20-21`) and does **not** rewrite that tag to the dev entry `src/frontend/main.ts`. Result: the dev server serves a page pointing at a stale/absent prod bundle (the "Failed to load /build/bundle.js" error). Introduced by the migration (`a77ada7`).
- **Impact:** **dev workflow only** — the packaged/production app is unaffected (prod correctly builds & references the bundle).
- **Fix direction:** a small dev-only `transformIndexHtml` plugin (or an `index.html` that points at `/src/frontend/main.ts` in dev) to restore HMR.

<a name="m3"></a>
### M3 — NEEDS QA: `music-metadata` 11 is ESM-only, `require()`d from CommonJS

- **Evidence:** used at `src/electron/audio/audio.ts:1,7` and `nowPlaying.ts:2,162`. `music-metadata@11` is pure ESM (`"type":"module"`, no `require` condition in its `exports`). The electron main process compiles to **CommonJS** (`src/electron/tsconfig.json:5`), so the emitted code is `require("music-metadata")`. This works **only** because `engines` pins Node ≥22.12 (`require(esm)` default-on) and the package has no top-level `await`. It is the **only** ESM-only-no-CJS dependency in the entire electron import graph.
- **Impact:** currently functional on the supported Node, but fragile — would break with `ERR_REQUIRE_ESM` if the build's Node target drops below 22.12 or the package adds top-level await. **No test covers any audio/metadata path** (those import `electron`, so they can't run under the node vitest env).
- **QA / test:** exercise audio playback + now-playing metadata in the packaged app; watch for `ERR_REQUIRE_ESM`. (Also a deep `import type` from `music-metadata/lib/type` in `showActions.ts:2` — type-only, erased, safe, but bypasses the public API.)

<a name="m4"></a>
### M4 — NEEDS QA: RemoteShow auth-screen logo via `import.meta.url` (IIFE)

- **Evidence:** `src/server/remote/components/Auth.svelte:7` resolves the FreeShow logo with `new URL(... import.meta.url)`. The server bundles are **IIFE**, where Vite replaces `import.meta` with `{}` (build warning confirms). The URL also traverses out of root (`../../../../public/import-logos/freeshow.webp`).
- **Impact:** missing logo on the RemoteShow auth screen (cosmetic). The sibling `data:image/...` URL in the same file is an absolute data URI and is unaffected.
- **QA:** open RemoteShow (port 5510) unauthenticated; confirm the logo renders.

<a name="m5"></a>
### M5 — NEEDS QA: Electron 40 offscreen capture / `desktopCapturer`

- **Evidence:** no removed-API usage was found (the app already uses `protocol.handle`, `contextBridge`, `webUtils.getPathForFile`, `setWindowOpenHandler`). The behavioral-sensitivity points are OSR + `capturePage()` (`windowOptions.ts:114`, `CaptureLifecycle.ts:124`, `thumbnails.ts:404,421`) and `desktopCapturer.getSources` (`responsesMain.ts:373`) against the Chromium ~140 bump (frame delivery / GPU path; macOS screen-recording perms; Wayland PipeWire).
- **QA:** launch app (macOS + Wayland if available); start NDI/Blackmagic output and confirm a **live, non-black** frame; generate a slide thumbnail and a PDF export; toggle hardware acceleration.

<a name="m6"></a>
### M6 — NEEDS QA: rename inputs — reactive write to a two-way-bound prop

- **Evidence:** `src/frontend/components/inputs/HiddenInput.svelte` `bind:edit`s a prop while three `$:` statements mutate it (`:12` trim, `:17` restore-prev, `:29-33` `$activeRename`-driven open/close). Reactive-write-to-bound-prop has different flush timing in Svelte 5 legacy mode. Parents: `ShowButton`, `ProjectList`, `Projects`, `Tag`.
- **QA:** rename a show / project / folder / tag — opens on click-hold, commits on Enter/Tab/blur, restores on empty, Escape cancels; test rapid open/close.

<a name="m7"></a>
### M7 — NEEDS QA: pdfjs `import.meta.url` → `{}` in IIFE build

- **Evidence:** build warns `EMPTY_IMPORT_META` for `pdfjs-dist/build/pdf.mjs` (`createRequire(import.meta.url)`). pdfjs is imported in the renderer (`PdfOutput.svelte`, `PdfPreview.svelte`, `ShowButton.svelte`, `showActions.ts`, `apiHelper.ts`). The affected line is in pdfjs's Node branch and may be dead in the renderer, but worth confirming.
- **QA:** import a PDF as a show; verify PDF preview thumbnails and PDF output rendering.

---

## 5. LOW findings

<a name="l1"></a>
- **L1 — NEEDS QA: output slide transitions.** `src/frontend/components/output/transitions/OutputTransition.svelte:12` carries a pre-existing `<!-- svelte transition bug!!! -->` workaround; Svelte 5 changed in/out transition coordination and `{#key}` handling. QA the presentation crossfade/in-out between slides and "none".
<a name="l2"></a>
- **L2 — CONFIRMED (works today): deprecated `assetInfo.name` in servers config.** `config/building/vite.config.servers.mjs:156` uses the singular `assetInfo.name.endsWith('.css')`; the main config was migrated to the null-safe `names?.[0] ?? name ?? ""` (`vite.config.mjs:34-36`) but this one was missed. **Currently functional** — the build emitted non-empty `styles.css` for all 4 apps — so this is a deprecation/consistency nit, not a break. Mirror the null-safe guard to future-proof.
<a name="l3"></a>
- **L3 — NEEDS QA: deprecated `<svelte:component>` & `data = data`.** 5 uses of `<svelte:component>` (most central: `Input.svelte:45` editor inputs, `Popup.svelte:71`) — supported in legacy mode, no break expected. `Scripture.svelte:64,104` use `data = data` self-reassignment for reactivity — preserved in legacy mode. QA: open editor tools (all input types render), several popups, and scripture book/chapter navigation.
<a name="l4"></a>
- **L4 — NEEDS QA: `Conditions.svelte` added optional-chain.** The strict refactor changed `slide?.items[itemIndex]` → `(slide?.items as any)?.[itemIndex]` (`:36,45`) — the only place it *added* `?.`. If `slide.items` is `undefined` the old code threw, the new returns `undefined` (almost certainly a defensive improvement). Confirm no caller relied on the throw.

---

## 6. Verified-safe (negative findings)

Documented so reviewers don't re-investigate. These were deep-reviewed and found clean.

**Strict-mode / `noImplicitAny` refactor (8 commits, ~200 files) — CLEAN.**
- All **49 inserted leading-`;` ASI guards** verified non-splitting (each preceding line is a terminated statement; the `;` is genuinely required because the line was rewritten to start with `(`).
- All ~187 `(obj as any)[key]` index casts are pure type assertions — no change to evaluation order or short-circuiting; pre-existing `?.` was preserved.
- Param/variable annotations are not over-narrowed (204/209 are `: any`; the 5 concrete ones match their call sites).
- **No** new non-null (`!`) assertions introduced.

**Svelte 5 / Vite 8 migration mechanics — CLEAN.**
- `mount(App, …)` correct in all **6** entry points (frontend + 5 servers); the return value is never consumed.
- **Zero** leftover Svelte-3 component APIs (`new Component({target})`, `.$set/.$on/.$destroy`).
- `createEventDispatcher` (69 files): no dependency on the `dispatch()` return value (the main 3→5 break).
- Preprocess swap to `vitePreprocess()` is low-risk (all `<style>` plain CSS, all scripts `lang="ts"`, no sass/postcss).
- Self-closing-tag cleanup touched **no** void or component elements.
- `svelte-ignore` additions are all `a11y_autofocus`; no behavior-affecting warnings suppressed.
- No `beforeUpdate`/`afterUpdate`, no `<script context="module">`.

**Dependencies — verified safe:** `better-sqlite3` 12 (API stable; needs ABI rebuild via postinstall), `fast-xml-parser` 5.4→5.8 (minor, dual-CJS), `axios` (dual-CJS), **`electron-store` kept at v8** (deliberate — v9+ are ESM-only and would break CJS usage), `electron-updater`/`@googleapis/drive` (minor, CJS), `@rollup/plugin-terser` (inert — only referenced by a stubbed, unused rollup config), `overrides` `shell-quote`/`tmp` (transitive/test-only). ESLint 9 / typescript-eslint / vitest / jsdom are dev-only.

**Likely pre-existing (not introduced by our work):** `json-bible` `fs` externalization warning — `json-bible/lib/load.ts` pulls `fs`, externalized in the browser bundle; the renderer uses the in-memory/API path (`scripture.ts`), and this is standard Vite node-builtin externalization independent of the version bump. Sanity-check scripture import, but low priority.

---

## 7. Recommended manual QA checklist

The confirmed-clean automated layer covers logic; this list covers the runtime behaviors it can't. Run against the **packaged** app + all four companion web apps.

- [ ] **Audio:** play audio; confirm now-playing metadata (title/artist/artwork) — [M3](#m3)
- [ ] **LTC timecode input** — confirm it actually initializes (currently expected to 404) — [H1](#h1)
- [ ] **Slide text editing:** type/edit/multi-line/paste/caret/chords toggle — [H2](#h2)
- [ ] **Video end → Next on finish** fires exactly once (looping & not) — [H3](#h3)
- [ ] **Output transitions** between slides (crossfade/in-out/none) — [L1](#l1)
- [ ] **NDI / Blackmagic** output shows a live (non-black) frame; **thumbnails** + **PDF export** — [M5](#m5)
- [ ] **PDF import** → preview thumbnails + PDF output — [M7](#m7)
- [ ] **RemoteShow (5510):** styling loads; auth-screen logo renders — [M4](#m4)
- [ ] **Rename** a show/project/folder/tag (open/commit/restore/Escape) — [M6](#m6)
- [ ] **Editor input types** all render; **popups** open — [L3](#l3)
- [ ] **Scripture** book/chapter navigation across multiple bibles — [L3](#l3)
- [ ] **Stage HTML-slide** display (path that was throwing at baseline, now fixed) — [§9](#9-bug-fixes-surfaced-positive)

---

## 8. Recommended new automated tests (coverage gaps)

The security/sync logic one would worry about is **already well-covered** — `expression.ts` (incl. all the `new Function` replacement security cases), `syncLedger.ts` (per-item merge), and the CSV CRLF fix all have thorough tests. The real gaps are the *other* audit-commit fixes that shipped without tests, plus a few logic-dense untested utilities. Prioritized:

**P1 — security-sensitive, changed in our work, unit-testable**
1. `src/electron/data/zip.ts` → **`sanitizeZipPath()`** (zip-slip guard) — highest value; currently *not exported*, so export it and unit-test (`../../x`→`x`, `/abs/x`→`abs/x`, `a\b\c`→`a/b/c`, legit nested unchanged).
2. `src/electron/utils/files.ts` → **`sanitizeFileName()`**, `getValidFileName`, `getExtension` — pure string; needs `vi.mock("electron")` + store (converter-test pattern).
3. `src/electron/utils/helpers.ts` → **`getMachineId()`** — per-process UUID fallback feeds sync identity; mock `node-machine-id` + store.

**P2 — logic-heavy, runtime-critical, untested**
4. `src/electron/utils/LyricSearch.ts` → `csvToArray` (public, testable now), `decodeHtmlEntities`, `parseUGStore`, `getLyricFromHtml` (need visibility tweak) — parse untrusted network HTML/CSV/JSON.
5. `src/electron/utils/shows.ts` → `trimShow`, `getShowTextContent` — defensive Show traversal; mock `./files` + `IPC/main`.
6. `src/frontend/components/helpers/media.ts` → path helpers (`getExtension`/`removeExtension`/`getFileName`/`splitPath`/`encodeFilePath`/`getMediaType`/`isMediaExtension`) — pure, pervasive; mock store + heavy imports.

**P3 — lower priority**
7. Uncovered variants in `array.ts`/`time.ts` (`sortByNameAndNumber`, `sortFilenames`, `sortObject`, `dateToString`, `changeTime`).
8. `nowPlaying.ts` `convertDynamicValues` (single-pass token replacement) — needs export to test.
9. `converters/easyworship.ts` (234 lines, the most logic-heavy untested converter).

**Runtime smoke (not unit):** an audio-metadata smoke check ([M3](#m3)) and an LTC-input check ([H1](#h1)) can only run in the launched app — candidates for the Playwright E2E layer rather than vitest (which uses the node env and can't import `electron`).

---

## 9. Bug-fixes surfaced (positive)

The work fixed two latent runtime bugs that existed at baseline:

1. **`src/server/stage/helpers/HtmlSlideHelper.ts:4`** — was importing a non-existent binding `{ stores }` (the module exports `_store`); every call (`stores.SHOWS.get(...)`) would throw `TypeError` at runtime. The strict pass corrected it to `{ _store as stores }` + optional chaining. The **stage HTML-slide path was effectively dead before** — verify it now works.
2. **`src/frontend/components/drawer/audio/effects/AudioFilter.svelte:93`** — `Float32Array.prototype.map` coerces returns back into the typed array, so the EQ curve's SVG-path **strings** were becoming `NaN`. Changed to `Array.from(magResp).map(...)` — fixes the equalizer response curve rendering.

---

## 10. Appendix — environment & methodology

- **`npm run build` exit 1:** the compile (frontend + 4 servers + electron tsc) succeeds; the failure is in the post-compile `scripts/postBuild.js` (`renameOpusBuild`) which scans `node_modules/@discordjs/opus/prebuild` — absent because native deps weren't compiled in this CI container (no `electron-builder install-app-deps`). `postBuild.js` is unchanged by our work. **Environmental only** — the user's local macOS build (with native deps) completes.
- **Method:** baseline diff `a2f34e2..HEAD`; automated checks (vitest, svelte-check, full build) run directly; four parallel read-only review agents covered dependency bumps, the strict-mode refactor, the Svelte 5 migration, and test-coverage gaps. Agent claims were cross-checked against build artifacts (which corrected the servers-CSS finding [L2](#l2) from "broken" to "works today" and confirmed [H1](#h1)).

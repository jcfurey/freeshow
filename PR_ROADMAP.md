# FreeShow → Upstream PR Roadmap

**Fork:** `jcfurey/freeshow`  **Upstream:** `ChurchApps/FreeShow`  **PR base branch:** `dev`
**Last updated:** 2026-06-16

Seven themed branches carved from `dev`, each rebased onto **current `upstream/dev`** and verified.
All seven open as PRs against upstream **`dev`**.

### Tracking (opened PRs)

| PR | Upstream PR | Status |
|----|-------------|--------|
| 1 | `ChurchApps/FreeShow#3384` | open |
| 2 | `ChurchApps/FreeShow#3385` | open |
| 3 | `ChurchApps/FreeShow#3386` | open |
| 4 | `ChurchApps/FreeShow#3387` | open |
| 5–7 | — | not opened yet |

## Submission strategy

- **PR1** and **PR7** are rooted directly on `upstream/dev` → independent, open **now, in parallel**.
- **PR2 → PR6** form a dependency stack (each built on the previous). Cleanest path is the
  **merge train**: open PR*n* once PR*(n‑1)* merges so its diff vs `dev` collapses to its own delta.
  (Cross‑repo PRs must target upstream `dev`; you can't set the base to a fork branch — so the
  "depends on" below is a *sequencing* note, not a GitHub base.)

```
upstream/dev ─┬─ PR1 ─ PR2 ─ PR3 ─ PR4 ─ PR5 ─ PR6
              └─ PR7 (independent)
```

## Summary

| PR | Branch | Tip | Depends on | Commits | Size (own delta) |
|----|--------|-----|------------|---------|------------------|
| 1 | `split/1-deps-and-security` | `c53fb58` | — (upstream/dev) | 10 | 23 files (line count = `package-lock.json`, collapsed via `.gitattributes`) |
| 2 | `split/2-eslint9-and-safe-eval` | `afedf4c` | PR1 | 4 | 298 files (+2390 / −2095) — mostly `eslint --fix` |
| 3 | `split/3-svelte5-vite8` | `fa4797d` | PR2 | 10 | 139 files (+4162 / −2620) |
| 4 | `split/4-unit-test-suite` | `486a43f` | PR3 | 13 | 36 files (+3153 / −3) |
| 5 | `split/5-typescript-strict` | `ef5dac8` | PR4 | 9 | 175 files (+410 / −415) |
| 6 | `split/6-build-and-regression-fixes` | `b33ac05` | PR5 | 7 | 38 files (+792 / −677) |
| 7 | `split/7-search-improvements` | `876117a` | — (upstream/dev) | 3 | 7 files (+285 / −106) |

## Verification (stack tip `split/6`)

- `svelte-check`: **0 errors** / 121 warnings (the warnings are the documented a11y roadmap in `ACCESSIBILITY.md`)
- Electron strict `tsc`: **clean**
- vitest: **267 tests pass** (37 files)

## Branch safety

Original (pre-rewrite) tips preserved as local tags: `backup/split/1-deps-and-security` … `backup/split/6-build-and-regression-fixes`.

## Open polish items

- A couple of PR1/PR2 commit messages still reference the now-stripped audit docs ("…from code audit", "…in audit docs"). Cosmetic; reword on request.
- The two Svelte 5 `|global` transition fixes live in **PR6**, so **PR3/PR4/PR5 ship that transition regression until PR6 merges**. Move them up into PR3 (self-contained migration) on request.

---

## PR 1 — Security & dependency hardening
**Branch:** `split/1-deps-and-security` → **base:** `dev` · independent (open now) · 10 commits

**Title:** `Security & dependency hardening: clear critical/high advisories, Electron 37→40, commit lockfile`

**Body:**
> Hardens the dependency tree and fixes correctness/security findings, with no functional changes to the app.
>
> **Dependencies / advisories**
> - Clear all **critical** + 3 **high** npm advisories (low-risk subset)
> - Electron **37 → 40** (clears the Electron advisory)
> - `music-metadata` **7 → 11** (ASF DoS high + file-type moderate)
> - `@rollup/plugin-terser` **0.4 → 1.0** (serialize-javascript RCE high)
> - Commit `package-lock.json` and mark it `generated`/binary so it's collapsed in diffs
>
> **Correctness/security fixes** across `src/electron/*` (IPC, save, zip, servers, webrtc) and a few frontend helpers, surfaced by a static review.
>
> **Tooling:** add `.nvmrc`, `.gitattributes`, and a CI workflow (`.github/workflows/ci.yml`); repair the stale Playwright smoke test for the current UI + Electron 40.
>
> **Verification:** `npm audit` no longer reports critical/high in the addressed set; Playwright smoke test passes.
>
> *Note:* the line count is dominated by `package-lock.json` churn (collapsed via `.gitattributes`); the reviewable source delta is small.

---

## PR 2 — ESLint 9 (flat config) + safe expression evaluator
**Branch:** `split/2-eslint9-and-safe-eval` → **base:** `dev` (after PR1) · 4 commits

**Title:** `Migrate to ESLint 9 flat config + replace new Function() math eval with a safe parser`

**Body:**
> 🔗 **Stacked on #3384** (deps-and-security). Until that merges, the diff below also includes PR1's changes; GitHub collapses it to just this PR's delta once PR1 lands.
>
> **Security:** replaces a `new Function()` arithmetic evaluator with a small, safe arithmetic parser in `src/frontend/utils/expression.ts` (+108), updating its call sites (`apiHelper`, `timers`, number inputs). Removes an eval-style code path.
>
> **Tooling:** migrates **ESLint 8 → 9** (flat config in `config/linting/eslint.config.mjs`), adds `typescript-eslint` 8 + `eslint-plugin-svelte`, removes the legacy `.eslintrc` files, and applies the resulting `eslint --fix` autofixes.
>
> ⚠️ **Review note:** this PR's own delta is 298 files, but ~293 are the mechanical `eslint --fix` pass (commit `afedf4c`). The substantive changes are two commits — **safe-eval** (`b70680b`) and the **flat-config migration** (`0f10f95`); review those first. Happy to split the autofix into its own PR if preferred.

---

## PR 3 — Svelte 5 + Vite 8 + TypeScript 5 migration
**Branch:** `split/3-svelte5-vite8` → **base:** `dev` (after PR2) · 10 commits

**Title:** `Migrate to Svelte 5 + Vite 8 + TypeScript 5 (compatibility mode)`

**Body:**
> 🔗 **Stacked on #3385** (ESLint 9 + safe-eval). Until it merges, the diff below also includes PR1+PR2's changes; GitHub collapses it once they land.
>
> Upgrades the frontend stack to **Svelte 5 / Vite 8 / TypeScript 5** in compatibility mode (no rune rewrite), preserving pre-migration type strictness so this PR stays a framework bump rather than a type overhaul (that's PR5).
>
> **Included:**
> - The core Svelte 5 + Vite 8 + TS 5 migration
> - Close self-closing non-void HTML elements (Svelte 5 requirement) and enforce going forward
> - Zero-risk a11y fixes (alt text, icon-button labels, `aria-selected`) + acknowledge intentional `autofocus`; keyboard activation for focusable color swatches
> - `ACCESSIBILITY.md` (scope/roadmap for operator-UI keyboard a11y) and per-platform `BUILDING.md`
> - `Dockerfile` + `.dockerignore` for a reproducible Linux build; switch CI to `npm ci`
>
> **Verification:** production build (`npm run build`) and the Playwright smoke test pass.
>
> **Follow-ups (kept out of this framework bump by design):**
> - `svelte-check` reports ~76 migration type errors at this stage; they're resolved in the strict-mode PR (PR5). Note: `svelte-check` is not part of upstream CI.
> - Two `|global` output-transition regressions from this migration are fixed in PR6.

---

## PR 4 — Vitest unit-test suite
**Branch:** `split/4-unit-test-suite` → **base:** `dev` (after PR3) · 13 commits

**Title:** `Add a vitest unit-test suite for helpers and import converters`

**Body:**
> 🔗 **Stacked on #3386** (Svelte 5 migration). Inherits PR3's deferred follow-ups (type errors → PR5, transitions → PR6).
>
> Adds a **vitest** unit-test layer — almost entirely new files (`+3153 / −3`, plus vitest/jsdom dev-deps), no behavioral changes. **251 tests pass** at this branch.
>
> **Coverage:**
> - Pure helpers: expression, color, scripture, chord transpose, bytes, style, cropping, mover, clickable, languageData, array, time
> - Electron helpers, fonts, request
> - Import converters: ChordPro, CSV, txt, SongBeamer; XML converters via jsdom (xml2json, OpenSong, OpenLP, Zefania, ProPresenter, Quelea, OSIS/Beblia, VerseView, EasySlides, MediaShout, VideoPsalm, SoftProjector); Calendar (ICS) and Project import
>
> Tests use dependency/collaborator mocking to isolate units. Run with `vitest run --config config/testing/vitest.config.ts`.

---

## PR 5 — TypeScript strict mode
**Branch:** `split/5-typescript-strict` → **base:** `dev` (after PR4) · 9 commits

**Title:** `Enable TypeScript strict mode across frontend, electron, and server`

**Body:**
> 🔗 **Stacked on #3387** (vitest suite). This PR **clears the ~76 Svelte 5 migration type errors** deferred from PR3/PR4 and completes strict mode.
>
> Builds on the Svelte 5 migration to re-enable and complete **TypeScript strict mode**.
>
> - Resolve the remaining Svelte 5 migration type errors (`svelte-check` → 0)
> - Re-enable strict mode, then work through `noImplicitAny` in stages (type untyped params, cast index access, type variable declarations) until full strict passes
> - Enable full strict for the **electron** tsconfig; make the already-strict **server** tsconfig type-check clean
>
> Mostly type annotations and safe casts (`+410 / −415`), no runtime behavior change.
>
> **Verification:** `svelte-check` (0 errors), electron `tsc`, and server `tsc` all clean.

---

## PR 6 — Build/release robustness + Svelte 5 transition fixes + regression fixes
**Branch:** `split/6-build-and-regression-fixes` → **base:** `dev` (after PR5) · 7 commits

**Title:** `Build/release robustness, Svelte 5 transition fixes, and regression fixes`

**Body:**
> Final polish on top of the modernization stack.
>
> - **Svelte 5 transition regressions:** restore `|global` output transitions (the "snap" blocker) and stop previous slide text lingering during `|global` transitions — fixes visible playback regressions introduced by the Svelte 5 migration (PR3)
> - **Release:** skip macOS notarization when Apple credentials aren't set; tolerate missing code-signing creds on macOS/Windows
> - **Regression fixes + security tests** surfaced during the modernization
> - **Formatting:** reformat with Prettier 3.8.4
> - **Docs:** Windows native-build gotchas + the unit-test layer
>
> **Verification:** full `svelte-check` (0 errors) and vitest suite (267 tests) pass.

---

## PR 7 — Search improvements
**Branch:** `split/7-search-improvements` → **base:** `dev` · independent (open now) · 3 commits

**Title:** `Repair show/lyrics search scorer, add caching, and support exact-phrase queries`

**Body:**
> Independent of the modernization stack — improves show/lyrics search.
>
> - Repair the show/lyrics search **scorer** (+ tests)
> - Add a lyric-search **cache** and stop search results flooding
> - Support **quoted** queries for strict exact-phrase matching
>
> `+285 / −106` across 7 files.

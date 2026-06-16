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
| 5 | `ChurchApps/FreeShow#3388` | open |
| 6 | `ChurchApps/FreeShow#3389` | open |
| 7 | `ChurchApps/FreeShow#3390` | open |

**All 7 open.** Stack: #3384 → #3385 → #3386 → #3387 → #3388 → #3389. Independent: #3390.

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
| 3 | `split/3-svelte5-vite8` | `e163a7a` | PR2 | 11 | 138 files (+4161 / −2619) |
| 4 | `split/4-unit-test-suite` | `049cce0` | PR3 | 13 | 36 files (+3153 / −3) |
| 5 | `split/5-typescript-strict` | `5a3b6cb` | PR4 | 9 | 175 files (+410 / −415) |
| 6 | `split/6-build-and-regression-fixes` | `75acba7` | PR5 | 8 | 40 files (+794 / −679) |
| 7 | `split/7-search-improvements` | `876117a` | — (upstream/dev) | 3 | 7 files (+285 / −106) |

## Verification

**Stack tip (`split/6`):** `svelte-check` **0 errors** / 121 warnings (a11y roadmap in `ACCESSIBILITY.md`) · Electron strict `tsc` **clean** · vitest **267 tests pass** (37 files).

Per-PR checks run before opening:

| PR | Checked at | Result |
|----|------------|--------|
| 1 | via `split/3` build | contained in the `split/3` production build (compiles); `npm audit` / Playwright per PR description |
| 2 | via `split/3` build | contained in the `split/3` production build (compiles) |
| 3 | `split/3` | `npm run build` compiles; `svelte-check` shows **76 migration type errors** (deferred to PR5 by design; not an upstream-CI step) |
| 4 | `split/4` | vitest **251 tests pass** |
| 5 | `split/5` | `svelte-check` **0 errors**, electron `tsc` clean, server `tsc` clean |
| 6 | `split/6` | `svelte-check` **0**, electron `tsc` clean, vitest **267** |
| 7 | `split/7` | `search.test.ts` **19 tests pass** |

## Branch safety

Original (pre-rewrite) split tips preserved as **branches on `origin`** (the proxy rejected tag pushes with 403, so these are branch refs; matching local `backup/split/*` tags are also retained):

| backup branch (on origin) | original tip |
|---|---|
| `backup/split/1-deps-and-security` | `f804f84` |
| `backup/split/2-eslint9-and-safe-eval` | `27c7db7` |
| `backup/split/3-svelte5-vite8` | `394afb8` |
| `backup/split/4-unit-test-suite` | `652258b` |
| `backup/split/5-typescript-strict` | `36ca75f` |
| `backup/split/6-build-and-regression-fixes` | `45a2705` |

Restore a branch: `git push --force-with-lease origin origin/backup/split/N-…:split/N-…`.

## Key findings & decisions

- **Fork/upstream divergence.** `dev` = current `upstream/dev` + 96 commits. The modernization (themes 1–6) was built on top of a **26-commit feature layer** (`#33xx` fixes) that diverged from upstream's parallel `1.6.2-beta.2 (#3364)` release. Consequence: the themes can't sit on bare `upstream/dev` independently — they form a dependency chain `1→2→3→{4,5}→6`; only search (PR7) is truly independent.
- **Build method — stacked redrive.** Each split branch = cherry-pick of `dev`'s theme commits onto `upstream/dev` as a stack. Conflicts resolved against `dev`'s known-good trees with a **mixed rule**: `package*.json` from the per-commit tree (`dev@sha` — keeps each branch's manifest+lock consistent for `npm ci`); all other source from **`dev` HEAD** (avoids transient feature-layer regressions that `dev`'s merges already fixed — e.g. an untyped `(a)` in `BoxStyle.svelte` that upstream types as `(a: any)`).
- **Internal docs stripped.** `AUDIT.md`, `CLAUDE.md`, `PACKAGE_AUDIT.md` are absent from every branch (originally added in theme 1, removed in theme 6; now never introduced). Kept: `.gitattributes`, `.nvmrc`, `.github/workflows/ci.yml`.
- **Deferred-by-design.** 76 `svelte-check` migration type errors appear in PR3/PR4 and are cleared in **PR5**. Two `|global` output-transition regressions from the migration are fixed in **PR6**.
- **Upstream context.** `upstream/dev` already ships a skeleton vitest setup (2 test files) — PR4 expands it (2→253), PR7 builds on it (no new deps). Upstream CI runs **`npm run build` + Playwright only**; `svelte-check`/vitest are **not** CI-gated (`npm run test` is commented out in `playwright.yml`), so PR3's 76 errors won't turn CI red.
- **Commit authorship.** Commits are authored by `@claude` (several co-authored with `@jcfurey`); no DCO sign-off.
- **Dev-server regression (found via runtime QA, fixed).** `npm start` was broken on the migrated branches: `public/index.html` had the **production** bundle tag (`./build/bundle.js`) committed — a `postBuild.js setProductionHTML()` artifact accidentally swept into a PR3 a11y commit (`e0011c3`), never reverted by `cleanBuilds.js`. Restored the dev entry (`/src/frontend/main.ts`, matching upstream) on `dev` + PR3, re-stacked PR4–6. PR3's net `index.html` diff is zero (add+revert cancels). **QA lesson:** we'd only run `npm run build` + the automated suites — never `npm start` — so the dev workflow slipped through. Always smoke `npm start` on a Vite migration.

## PR review status (opened 2026-06-16)

All seven triaged at open: **0 comments, no reviews, no merge conflicts** on every PR. CI **awaiting maintainer approval** (the gate showed on #3384–#3388). **Verdict: no comment needed on any PR** — the descriptions pre-empt the predictable reviewer questions (stacked cumulative diffs, the `package-lock.json` line count, the deferred type-errors/transition fixes).

## Anticipated maintainer feedback (by likelihood)

1. **`@claude` authorship / DCO sign-off** — fix = one-pass re-author across all 7 branches + force-push.
2. **"Split the `eslint --fix` autofix"** on #3385 — already offered in the body; carve the autofix into its own PR.
3. **CI red after approval** — diagnose the added `ci.yml` (#3384) or the build output and push fixes.

## Maintainer concerns (original PR #3379, closed by @vassbo)

**1. "Too mixed / too much for one PR."** → Addressed by this 7-PR split.

**2. "Svelte Transitions are broken in newer versions… create a custom transition system first!" (ref #1512).** The blocker that closed #3379, and the same wall the prior Svelte 5 PR (#1512) hit: transitions **snap to the next frame** instead of animating.
- **Root cause:** Svelte made transitions **local by default** at the 3→4 boundary (inherited by 5). A local transition doesn't play when a block *above* it (`{#key}`/`{#each}`/`{#if}`) is created/destroyed. FreeShow's output transitions live inside `{#key show}` / `{#each currentOut}`, so they snap. The manual compat migration skipped the `|global` that `svelte-migrate` adds automatically.
- **Fix (in PR6 / #3389):** `|global` on **all three** output `custom` transitions — `OutputTransition` (text/media/PDF/effect), `Output.svelte` song attribution, `ListView` — plus a keying fix (`{#key transitionId}` not `{#key show}`) so outgoing slide text isn't orphaned. `svelte-check` 0 / build clean.
- **✅ Confirmed (runtime):** visually verified on macOS (1.6.2-beta.2) — with a Fade set, slides **fade** on `dev` where they **snap** on the bare migration branch (`split/3`). The #1512 blocker is genuinely resolved. Fix kept in PR6 per decision, so PR3 in isolation still snaps until #3389 lands.
- FreeShow already has a custom transition system (`utils/transitions.ts` `custom()`); the fix makes those existing transitions play again — no new system needed.

**3. Out of scope — transition rework (#2169).** A separate, *pre-existing* (Svelte-4-era) effort the maintainer wants to own: identical-text flash / partial-fade, smoother text transitions. Our work only **restores pre-Svelte-5 behavior** — it deliberately does not touch #2169.

## Open polish items

- A couple of PR1/PR2 commit messages still reference the now-stripped audit docs ("…from code audit", "…in audit docs"). Cosmetic; reword on request.
- Transition fix is **complete** (all 3 output `custom` transitions have `|global`) but lives in **PR6** by decision, so **PR3/PR4/PR5 still snap until PR6 merges**. A drafted comment for #3386 explains the fix + points to #3389.
- **`import.meta` in iife companion builds (open).** `src/server/remote/components/Auth.svelte:7` resolves the logo via `new URL("…/freeshow.webp", import.meta.url)`. The companion apps build as `iife` (`vite.config.servers.mjs` → `formats: ['iife']`), where Vite 8 replaces `import.meta` with `{}` → the remote login logo URL breaks. **Upstream's code, unchanged** — a vite 4→8 behavior change our upgrade exposes (only the `remote` app). Minor/cosmetic; pending decision to fix in PR3 or flag on #3386.
- **Both surfaced via `npm start` runtime QA**, which we'd skipped (only `npm run build` + automated suites were run). The dev-server (`index.html`) one is fixed; this logo one is open.

---

## Additional feature — "Protect Bible text from editing" (NOT part of the modernization)

A standalone enhancement spun out of #3366 (Advanced Bible Engine request) + the user's concern that letting downloaded/API scripture be silently edited and re-projected invites objection.

- **Branch:** `feature/protect-scripture-text` (off `upstream/dev`) — `720b230`, **3 commits**, pushed. Also on `dev` (`e87bba8`), `svelte-check` 0. **PR not opened yet.**
- **Compare:** `https://github.com/ChurchApps/FreeShow/compare/dev...jcfurey:freeshow:feature/protect-scripture-text`
- **Title:** `Protect Bible text from accidental edits (scripture shows read-only by default)`
- **What it does:** verse text in Bible-sourced shows (`reference.type === "scripture"`) is read-only by default; styling/layout/templates/verse-number options stay editable — only the words lock.
  - Global setting `special.protectScriptureText` (default on) — Settings → General.
  - Per-show unlock `show.unlockedScriptureText` — edit-header "more options" (⋯) dropdown.
  - **Gated paths (hardened):** the inline editbox (`EditboxLines` `isLocked` render-swap), the plain-text popup (`TextEditor`/Notes `disabled`), and via a shared `isScriptureTextLocked()` helper — **format actions** (capitalize/lowercase/uppercase/trim), **find & replace** (`format()`), the **`formatText()` rebuild** (set_plain_text + transpose API + SlideEditor/TextEditor transpose), and the **`set_show` API**.
  - **Deliberately NOT gated** (don't alter the *words*): style/layout, merge/split, paste-slides, delete. 10 files, +56/−4.
- **Open decision:** currently locks **all** scripture shows; can narrow to **API-only** (`reference.data.api`) after runtime testing — pending the user's QA.
- **Strategic:** an 8th PR while the 7 modernization PRs are still unreviewed, and a behavior change — consider holding until @vassbo engages, or leading with a comment on #3366.

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
> 🔗 **Stacked on #3388** (strict mode) — the final PR in the modernization stack.
>
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
> Independent of the modernization stack — improves show/lyrics search. Builds on upstream's existing vitest setup (no new deps).
>
> - Repair the show/lyrics search **scorer** (rewrites `search.ts`; adds `search.test.ts` — **19 tests, all passing**)
> - Add a lyric-search **cache** and stop search results flooding
> - Support **quoted** queries for strict exact-phrase matching
>
> `+285 / −106` across 7 files.

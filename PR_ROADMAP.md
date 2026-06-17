# FreeShow → Upstream PR Roadmap

**Fork:** `jcfurey/freeshow`  **Upstream:** `ChurchApps/FreeShow`  **PR base branch:** `dev`
**Last updated:** 2026-06-17

Seven themed branches carved from `dev`, each rebased onto **current `upstream/dev`** and verified.
All seven open as PRs against upstream **`dev`**.

### Tracking (opened PRs) — maintainer sweep 2026-06-16 (via HTML fetch of PR pages)

| PR | Upstream PR | Status | @vassbo |
|----|-------------|--------|---------|
| 1 | `ChurchApps/FreeShow#3384` | **✅ MERGED (`2e6bbbd`, 2026-06-17)** | @vassbo requested changes (**18 inline comments / 14 files**); all addressed on `split/1-deps-and-security` (`c53fb58` → `0c95118`): reverted electron/music-metadata/fast-xml-parser to his pins + dropped the contested audit changes, kept the advisory fixes. **Merged into upstream/dev** — the migration (#3396) now rebases on top of it. |
| 2 | `ChurchApps/FreeShow#3385` | **CLOSED by jcfurey (conceded)** | vassbo: *"b70680b is overkill, it's fine to use `new Function` … local app"* + stacking concern. Dropped safe-parser, closed; noted ESLint 8 is EOL, flat-config on fork. |
| 3 | `#3386` → **`#3396`** | **#3386 closed; #3396 OPEN — active review (all rounds addressed)** | Migration. Standalone `feat/svelte5-vite8-migration`, rebased onto upstream/dev **post-#3384** (`2e6bbbd`). @vassbo reviewing: reconstructed to drop the contested new files / a11y / self-closing / node-pin, then 3 nit rounds resolved (tip `f94218d`). See "#3396 review rounds" below. |
| 4 | `ChurchApps/FreeShow#3387` | **CLOSED by vassbo** | *"I don't think this is a benefit."* (vitest suite) |
| 5 | `ChurchApps/FreeShow#3388` | **CLOSED by vassbo** | *"…just adds `: any` explicitly … already detected as `any`."* |
| 6 | `ChurchApps/FreeShow#3389` | **CLOSED** | silently closed (build/release + transition + regressions) |
| 7 | `ChurchApps/FreeShow#3390` | **✅ MERGED (`3823fb0`)** | Rebuild button removed per review → vassbo: *"Nice, great!"* → merged into dev. First modernization PR landed. |
| 8 (feature) | `ChurchApps/FreeShow#3391` | **CLOSED by vassbo (declined)** | *"I really don't think it's necessary…"* → *"Yeah, I got that."* Conceded; stays on fork. |

**Current (2026-06-17): 2 MERGED (#3390 search, #3384 security/deps `2e6bbbd`), 1 OPEN (migration **#3396** — active review, all rounds addressed, tip `f94218d`), 5 CLOSED (#3385 conceded, #3386 superseded by #3396, #3387/#3388/#3389/#3391).** With #3384 landed, the migration (#3396) is the **sole open PR** and rebases cleanly on top of it.

**Pattern:** @vassbo is declining most of the modernization as unnecessary for a *local desktop app* — he closed the **Svelte 5 migration itself (#3386)**, the **test suite (#3387)**, **strict types (#3388)**, and the **build/transition/regression bundle (#3389)**; and pushed back on **safe-eval (#3385)**, **search (#3390)**, and **scripture lock (#3391)**. Only **#3384 (security/deps)** has no comment. Closing #3386 also makes the transition fix moot upstream for now (no migration to attach to) — it survives as the `reference/svelte5-transition-global` branch + the posted explanation for if/when a migration happens.

**Actions taken on the 4 open PRs (2026-06-16 sweep):**
- **#3390 (search) — iterated, the one worth keeping.** Removed the manual "Rebuild search index" button per his note (`19d859a` on `split/7`, pushed → updates the PR). The lyric/content cache **auto-backfills** on load (`loadShows`/`loadShowsAsync`), so the button was redundant. Kept the real value: the **fuzzy-flooding gate** (search was returning ~every show), the **scorer repairs** (multi-word matching was disabled, `removeShortWords` a no-op, content outranking title, empty/punct queries matching everything), and **exact-phrase quotes**. 19 search unit tests green; electron `tsc` clean on the touched files. Reply drafted reframing it as a **bug fix**.
- **#3385 (eslint/safe-eval) — concede.** He's right `new Function` is fine for a local app; it was also stacked on the now-closed #3386. Concession reply drafted (optional low-pressure offer to land ESLint 9 flat-config standalone). Close + keep on fork.
- **#3391 (scripture) — concede.** Concession reply drafted (clarify text-only/opt-out/per-show-unlock, then defer). Close + keep on fork.
- **#3384 (security/deps) — leave it / strongest.** Only one with no pushback; if it draws a "why" it'll be the Electron 37→40 major — can split the pure advisory fixes from the Electron bump if needed.

## Standalone Svelte 5 migration — `feat/svelte5-vite8-migration` (per @vassbo's #3386 follow-up)

After the #3386 reply, @vassbo (2026-06-16): *"Okay, that makes sense. But I would still like it to not be stacked on another PR. Also have not checked if there's any other breaking changes."* → he accepts the transition-fix explanation and wants the **migration itself un-stacked** (off `dev`, not on #3385), self-contained with the transition fix. #3386 is closed, so this is a **fresh branch + new PR**.

- **Branch:** `feat/svelte5-vite8-migration` (off `upstream/dev`), pushed. **163 files, +5046/−4350** (incl. regenerated lockfile).
- **Compare:** `https://github.com/ChurchApps/FreeShow/compare/dev...jcfurey:freeshow:feat/svelte5-vite8-migration`
- **How built:** cherry-picked the 11 migration commits (`split/2..split/3`) onto `dev` with `-X theirs`; **dropped all #3384 (security/deps) and #3385 (eslint9/safe-eval) content.** Reconciled `package.json` to dev + svelte5/vite8/ts5 **only** (electron 37, vitest, version `beta.2` preserved); regenerated `package-lock.json`.
- **Necessary eslint change:** dropped `eslint-plugin-svelte3` (Svelte-3-only, blocks `npm install` with svelte 5) + its `lint:svelte` step/config. `.svelte` still covered by svelte-check/prettier/stylelint. This is the *only* eslint touch — not the #3385 modernization.
- **"Other breaking changes" found (answers his caveat):** building off **current** dev surfaced real Vite-8/rolldown errors — type-only imports must use `import type` (isolatedModules); newer dev code (Show, OutData, Item, ContextMenuItem, ProjectShowRef, DropAreas, Unsubscriber, …) used value imports. Converted all (~25 files). Also the known `import.meta`/iife remote-logo issue still applies (flag in PR).
- **Transition fix folded in** (self-contained): `|global` on OutputTransition/Output attribution/ListView + `transitionId` keying in SlideContent.
- **Verified:** `npm run build` **passes** (frontend + servers + electron + postbuild). `svelte-check` **71** deferred type errors (compatibility mode preserved — the documented backlog; not in upstream CI). Commits: 11 migration + `85057c7` (deps reconcile) + `4c138a1` (Vite-8 type imports + transitions) + `475ad9e` (vitest 2→4, npm-ci fix).
- **🔧 `npm ci` blocker found & fixed (2026-06-16, "double-check" pass) — `475ad9e`.** The committed lockfile pinned **esbuild 0.21.5** while vite 8 needs **^0.27/^0.28**: `vitest@2.1.9` drags in **vite 5** (esbuild 0.21), which npm hoists and can't satisfy vite 8. `npm install` tolerated it (build worked) but **`npm ci` — what upstream CI runs — failed to install.** Fix: bump **vitest 2→4** (`vitest@4` peer-supports vite ^8), regenerate a clean lockfile. Re-verified: **`npm ci` exit 0**, build 0 errors, unit tests pass on vitest 4, svelte-check 71. Also re-confirmed the **combined stack** (migration vitest4/vite8 + #3384 electron40/music-metadata11/npm-run-all2) **passes `npm ci`** — so it stays CI-installable once #3384 lands.
- **✅ import.meta iife logo — VERIFIED real & migration-related, then FIXED (`0eae2cd`).** Empirically built the remote companion on Vite 8: it inlines the 378-byte webp as a `data:` URI but compiles the base to the string `"undefined"` (Vite 8/rolldown replaces `import.meta` with `{}`; Rollup/Vite 4 polyfilled `import.meta.url` — rolldown's own warning documents this). `new URL(dataURI, "undefined")` **throws "Invalid URL" at runtime** (tested) — so it's not cosmetic, it would break the RemoteShow login script, and it IS a Vite 4→8 regression. Fix: import the asset (`import freeshowLogo from "…webp"`) so Vite inlines it with no `import.meta`; added a `*.webp` ambient declaration. Verified: 0 EMPTY_IMPORT_META from our code (one remains in third-party `pdfjs-dist`, pre-existing), build 0 errors, svelte-check 71, npm ci passes. Migration now has **zero known issues**.
- **DONE:** opened as **`ChurchApps/FreeShow#3396`** (2026-06-17). **⚠️ The details above describe the as-opened branch; it was reconstructed during @vassbo's review** — dropped the contested new files / a11y pass / self-closing conversions / node-pin → now **51 files, +1602/−2560**, clean 8-commit set `b7c095f`…`f94218d`. See **"#3396 review rounds"** below for current state.
- **Portability verified (2026-06-16):** svelte 5.56.3 / vite 8.0.16 / vite-plugin-svelte 7.1.2 / svelte-check 4.6.0 are already latest; plugin peers confirm correct alignment. Tested the next TS major (**TypeScript 6.0.3**): frontend/Svelte migration builds **0 errors** (portable); the only TS-6 friction is pre-existing electron-tsconfig strictness (`rootDir`/`node10`/`catch` unknown) that hits the whole repo, not this PR. Stays on `^5.9.3`.
- **Runtime verified (Playwright):** the built Electron app **launches and renders correctly** (screenshot: Welcome dialog, panels, tabs, live clock). The smoke test fails only on **stale selectors** (`.main .dropdownElem`/`.showElem`) — and our `start.test.ts` is byte-identical to upstream/dev's, so it fails on plain `dev` too; the repair lives in the excluded #3384 (`bc61ed0`). Not a migration regression.
- **@vassbo sequencing (2026-06-16):** *"No need to rush it, but it's probably good to get the other major PRs done and merged first?"* → the migration is **welcome, just sequenced after the foundational PRs**. Plan: **hold the migration PR** (branch is ready & waiting), prioritize landing **#3384 (security/deps)** and any wanted parts of **#3385**, then rebase + open the migration. No urgency.

### ✅ #3390 (search) MERGED into upstream/dev (`3823fb0`)
The reworked search PR (rebuild button removed per review) **landed**. First modernization PR merged. `upstream/dev` advanced 3f0f455 → 3823fb0.

### ✅ #3384 merge-readiness + svelte-3→5 path verified (2026-06-16)
Validated the full sequence vassbo wants (land #3384 on Svelte 3, then migration on top):
- **#3384 merges cleanly** into current `upstream/dev` (no conflicts, even after #3390). Merge adds `.github/workflows/ci.yml`, `.nvmrc`, `.gitattributes`.
- **#3384 builds on Svelte 3 + Electron 40** (`npm run build` exit 0) and **37 unit tests pass** (search 19 + syncLedger 18). Electron 37→40 does not break the electron `tsc`.
- **Migration ⊕ #3384 source merges with ZERO source conflicts** — only `package.json`/`package-lock.json` conflict (dep reconciliation, expected).
- **Full combined stack** (dev + #3384 + migration) **installs and builds clean under Svelte 5** (svelte 5 + vite 8 + Electron 40 + music-metadata 11 + terser 1.0 + npm-run-all2 all coexist; `npm run build` exit 0, 0 MISSING_EXPORT/TS errors) and **37 tests pass**. Dep reconcile on conflict: keep svelte 5 (migration) + #3384's security bumps (`npm-run-all2 ^9`, `tmp ^0.2.7`), drop the Svelte-3-only packages.
- **Conclusion:** the migration **works from Svelte 3.x (with #3384) → Svelte 5**. When #3384 lands, rebasing + opening the migration is mechanical (validated). Throwaway test branches not pushed.

### 🔄 #3384 review round — @vassbo requested changes (2026-06-17)
@vassbo reviewed #3384 (**"Please fix all my review comments"**, *changes requested*) with **18 inline comments across 14 files** (two passes — several in collapsed/outdated threads). All addressed on `split/1-deps-and-security` (tip `c53fb58` → `0c95118`, **+4 commits**: `f529363`, `cc5b8e7`, `09e6b34`, `0c95118`); `npm ci` + `npm run build` + unit tests green after each.

**Decision: drop everything contested (revert toward his pins), keep only advisory fixes with no runtime coupling.**

- **Dependencies reverted to dev's pins** (deferred to focused follow-ups): electron ^40→**^37.10.3** (+ electron-builder ^26.0.19), music-metadata ^11→**^7.14.0** (v11 is ESM-only — unsafe to `require()` from the CJS main), fast-xml-parser ^5.8.0→**5.4.1**; also reverted the incidental electron-updater/better-sqlite3 bumps to keep the dep diff minimal.
- **Source — contested audit changes reverted out of the PR entirely:** `data/save.ts` (pendingSave queue), `utils/files.ts` watcher (kept the `readExifData` always-resolve fix), `audio/nowPlaying.ts` (single-pass regex), `utils/helpers.ts` (`stableStringify` + non-constant fallback machine id), `utils/windowOptions.ts` (export-window `contextIsolation`), `webrtc/WebRtcHost.ts` (navigation hardening), `frontend/IPC/main.ts` (`window.api` guard).
- **Source — cleaned up & kept:** `data/thumbnails.ts` (moved lock-release into `finish()`, dropped the now-redundant `delete`), `IPC/main.ts` (kept the shared reply dispatcher, removed previous-state comments), `frontend/utils/sendData.ts` (kept the REMOTE auth gate, shortened the comment), `.gitattributes` (trimmed comment).
- **Kept (genuine hardening, no runtime coupling):** `@rollup/plugin-terser` 1.0 (serialize-javascript RCE), `npm-run-all`→`npm-run-all2` (drops unmaintained pkg + cross-spawn ReDoS), `tmp` ^0.2.7 + shell-quote/tmp overrides, `engines.node`, committed lockfile.
- **Preferences:** removed `.nvmrc` (kept `engines.node`); `ci.yml` trigger → `workflow_dispatch` (manual).
- **Scope now ≈15 source files** (down from 20); title/description rewritten to drop the reverted electron/music-metadata claims.

**Deferred follow-up PRs** (now that #3384 has landed): (1) **electron 37→40** with the macOS `NSAudioCaptureUsageDescription` Info.plist entry + the macOS 11 drop; (2) **music-metadata v11** via dynamic `import()` at the CJS call sites (`audio.ts`, `nowPlaying.ts`); (3) **fast-xml-parser 5.x** once the original 5.4.1-pin reason is confirmed resolved.

## #3396 review rounds — @vassbo (2026-06-17)

@vassbo opened review on **#3396** (*changes requested*): **"Check my reviews, and we probably don't need the new files."** Three rounds, all addressed; branch rebased onto upstream/dev **post-#3384** (`2e6bbbd`). Clean 8-commit set `b7c095f` … `f94218d`; **51 files, +1602/−2560** (down from the as-opened 163 files).

**Round 1 — reconstruction (drop the contested scope).** Per "we don't need the new files," stripped everything outside the framework bump and force-pushed a clean history (`b7c095f` → `a5f2efc`):
- **Dropped:** `BUILDING.md`, `ACCESSIBILITY.md`, `Dockerfile`, `.dockerignore`; the zero-risk **a11y code pass**; the **~200 self-closing-element conversions** (an `eslint svelte/html-self-closing` autofix — reverted, rule dropped, `/>` kept everywhere); and the **`.nvmrc` / Node-pin**.
- **Kept:** the core Svelte 5 / Vite 8 / TS 5 migration, the ~28 `import type` conversions, the `|global` transition fix, and the real toolchain fixes (`bonjour.ts` `Service`, `connectionCount` rename, Auth logo).
- Rebased onto upstream/dev (now carries #3384), regenerated `package-lock.json`, rewrote the PR description to match the slimmed scope.
- **Inline threads resolved:** `config/linting/eslint.svelte.js` → kept deleted (Svelte-3-only `eslint-plugin-svelte3` blocks `npm install` on Svelte 5); `DrawSettings.svelte` self-closing → reverted; `vite.config.servers.mjs` a11y `onwarn` → dropped the legacy `a11y-` check (Svelte 5 only emits `a11y_*`); `Auth.svelte` logo → verified (Round 2).

**Round 1.5 — consistency fix (`6b287be`).** The main `vite.config.mjs` `onwarn` still carried `a11y-` *and* `a11y_` while `servers.mjs` had been cleaned — brought it in line (only `a11y_`), since vassbo's "we don't need the old check" applies to both configs.

**Round 2 — `Auth.svelte` webp type warning.** @vassbo: *"I got `Cannot find module '*.webp' or its corresponding type declarations` warning. Do you think Vite 8 resolves that?"* Two layers, both verified:
- *Runtime* — yes: the iife companion build inlines the **378-byte** webp as a `data:` URI (no `import.meta`), which is exactly why the asset import replaced `new URL(…, import.meta.url)`.
- *Types* — the `declare module "*.webp"` added in `src/server/remote/global.d.ts` (same pattern as the existing `*?url` / `*.svelte` declarations) resolves it. Proven in-scope, not just present: `npm run test:svelte` (svelte-check) is **clean on `Auth.svelte`** — **0** "Cannot find module" across the run (the 71 errors are all the deferred `@tsconfig/svelte` v5 strict flags); `tsc --showConfig` shows **both** `src/server/tsconfig.json` and `config/typescript/tsconfig.server.json` load `remote/global.d.ts`. → vassbo's squiggle is a **stale editor language server**; a TS-server restart clears it.

**Round 3 — code-style nits (`f94218d`).** Three review comments, all applied:
- `main.ts` → dropped the redundant `mount()` comment.
- `SlideContent.svelte` → shortened the `transitionId`/`{#key}` comment from 4 lines to 2.
- `vite.config.mjs` → dropped the dead `?? assetInfo.name` fallback. Verified against `rollup.d.ts`: `PreRenderedAsset.name` is the **@deprecated** alias of `names[0]` (`undefined` when `names` is empty), so `assetInfo.names?.[0] ?? ""` already covers every case. Re-ran the frontend production build (`build:frontend:prod`, exit 0) — `bundle.js` + `bundle.css` still emit correctly.

**Round 4 — webp accepted + comment trimmed (`e8252fb`).** @vassbo on the Auth.svelte/webp thread: *"Thanks. I guess this will work then, but we can shorten the comment."* — i.e. **accepted the contested asset-import approach**; shortened the import comment from 3 lines to 1.

**Status (tip `e8252fb`):** all of @vassbo's threads addressed (the webp approach now accepted). No conflicts with base. Awaiting next review pass / dismissal of the "changes requested" gate.

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
| 1 | `split/1-deps-and-security` | `0c95118` | — (upstream/dev) | 14 | ~15 source files (line count = `package-lock.json`, collapsed via `.gitattributes`) |
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
- **Isolated reference branch (per @vassbo's #3386 request, 2026-06-16):** `reference/svelte5-transition-global` (off `upstream/dev`) — the *related diff only*, zero migration churn: `|global` on the 3 output `custom` transitions + the `transitionId` keying in `SlideContent`. **4 files, +12/−4**, `b9b23af`, pushed.
  - Branch: `https://github.com/jcfurey/freeshow/tree/reference/svelte5-transition-global`
  - Compare: `https://github.com/ChurchApps/FreeShow/compare/dev...jcfurey:freeshow:reference/svelte5-transition-global`
  - ⚠️ **Key finding — no-op on the current Svelte-3 `dev`.** `upstream/dev` is `svelte@^3.59.2`, where transitions are **global by default**; the local-default change was Svelte **4** (confirmed via the official v4 migration guide: made local "to prevent confusion around page navigations," restore with `|global`). So `|global` only *does* anything once the Svelte 4/5 migration is underneath it — the branch is a clean review artifact / "ready for when the migration lands," **not** a standalone behavioral fix against today's `dev`. This is stated honestly in the draft #3386 reply (can't be a meaningful standalone PR; it belongs with the migration).

**3. Out of scope — transition rework (#2169).** A separate, *pre-existing* (Svelte-4-era) effort the maintainer wants to own: identical-text flash / partial-fade, smoother text transitions. Our work only **restores pre-Svelte-5 behavior** — it deliberately does not touch #2169.

## Open polish items

- A couple of PR1/PR2 commit messages still reference the now-stripped audit docs ("…from code audit", "…in audit docs"). Cosmetic; reword on request.
- Transition fix is **complete** (all 3 output `custom` transitions have `|global`) but lives in **PR6** by decision, so **PR3/PR4/PR5 still snap until PR6 merges**. **@vassbo (#3386, 2026-06-16) asked for *only* the related diff in a PR** → extracted as the isolated reference branch `reference/svelte5-transition-global` (see concern #2 above). Reply drafted; honest caveat that it's a no-op on Svelte-3 `dev` and so is inseparable from the migration in effect.
- **✅ `import.meta` in iife companion builds — FIXED & review-verified.** `Auth.svelte` resolved the logo via `new URL("…/freeshow.webp", import.meta.url)`; the companion apps build as `iife` (`vite.config.servers.mjs` → `formats: ['iife']`), where Vite 8 replaces `import.meta` with `{}` → "Invalid URL" at runtime. Fixed by importing the asset (Vite inlines the 378-byte webp as a `data:` URI) + a `*.webp` ambient declaration in `src/server/remote/global.d.ts`. @vassbo later flagged a `Cannot find module '*.webp'` TS warning on this — verified the declaration is in-scope (svelte-check clean on `Auth.svelte`; `tsc --showConfig` confirms both server tsconfigs load it), so it's a stale editor language server, not a real gap. See "#3396 review rounds".
- **Both originally surfaced via `npm start` runtime QA** (only `npm run build` + automated suites were run); both are now fixed.

---

## Additional feature — "Protect Bible text from editing" (NOT part of the modernization)

A standalone enhancement spun out of #3366 (Advanced Bible Engine request) + the user's concern that letting downloaded/API scripture be silently edited and re-projected invites objection.

- **Branch:** `feature/protect-scripture-text` (off `upstream/dev`) — `720b230`, **3 commits**, pushed. Also on `dev` (`e87bba8`), `svelte-check` 0. **PR open: `ChurchApps/FreeShow#3391`.**
- **Compare:** `https://github.com/ChurchApps/FreeShow/compare/dev...jcfurey:freeshow:feature/protect-scripture-text`
- **Title:** `Protect Bible text from accidental edits (scripture shows read-only by default)`
- **What it does:** verse text in Bible-sourced shows (`reference.type === "scripture"`) is read-only by default; styling/layout/templates/verse-number options stay editable — only the words lock.
  - Global setting `special.protectScriptureText` (default on) — Settings → General.
  - Per-show unlock `show.unlockedScriptureText` — edit-header "more options" (⋯) dropdown.
  - **Gated paths (hardened):** the inline editbox (`EditboxLines` `isLocked` render-swap), the plain-text popup (`TextEditor`/Notes `disabled`), and via a shared `isScriptureTextLocked()` helper — **format actions** (capitalize/lowercase/uppercase/trim), **find & replace** (`format()`), the **`formatText()` rebuild** (set_plain_text + transpose API + SlideEditor/TextEditor transpose), and the **`set_show` API**.
  - **Deliberately NOT gated** (don't alter the *words*): style/layout, merge/split, paste-slides, delete. 10 files, +56/−4.
- **Open decision:** currently locks **all** scripture shows; can narrow to **API-only** (`reference.data.api`) after runtime testing — pending the user's QA.
- **Strategic:** an 8th PR while the 7 modernization PRs are still unreviewed, and a behavior change — consider holding until @vassbo engages, or leading with a comment on #3366.
- **@vassbo response (#3391, 2026-06-16) — declining:** *"I really don't think it's necessary… people will [not edit] willy-nilly, but rather fix spelling mistakes or break it up into parts."* His named use cases (typo fixes, splitting verses) are exactly what the text-lock gets in the way of, so the premise is weaker than assumed. Reply drafted: one clarification (it's text-**only** + opt-out toggle + per-show unlock — styling/splitting/whole-show stay editable, so the "unlock to change styling" concern doesn't apply), then **defer to his call**. Feature stays on the fork regardless; likely close the PR.

---

## Transition flicker audit (#2169) — dev-only fixes

Deep audit of the output/transition pipeline for the long-standing flicker complex tracked in **#2169 "Rework Transitions"** (black-frame flashes, identical-text fade at 0% offset, scripture metadata flashing). Corroborated by the **closed #2927** ("stabilise existing transition system" — targeted `main`, never merged).

**Root causes found (in `src/frontend/components/output/`):**
- **"None" black flash:** `SlideContent.updateItems()` cycled `show=false→true` across macrotasks, blanking the `{#key}` block for a frame even when transition = None; and `SlideItemTransition` synthesized a `fade(duration:1)` for None via the autosize-500ms / media-250ms flash-delays (the media one is the exact #2927 bug — `dev` lacked that guard).
- **"First run only" qualifier:** cold auto-size cache → `Textbox` hides itself (`visibility:hidden`) until the font is measured on first display; warm on run 2.
- **Identical-text fade (0% offset):** per-item persistence is defeated when *any* sibling transitions, and `itemsAreEqual` compared full JSON including volatile `autoFontSize`/`previewAutoFontSize`.
- **Metadata flash (#2451):** `Overlay` (metadata renderer) remounted via `{#key show}` + `show=false→true` every change; `getMetadata()` also returns fresh refs each tick + a `setTimeout` clear-to-`[]`.
- *Secondary/possible:* `Media.svelte {#key retryCount}` remount on decode error; background/text desync on rapid advance; `setTemplateStyle` in-place mutation re-triggering the child diff.

**Fixes applied on `dev`** (4 commits, `svelte-check` 0; **NOT PR'd** — vassbo wants to own #2169 and closed #2927; needs runtime visual QA):
- `7c2cf77` — `SlideItemTransition`: guard the autosize/media flash-delays with `type !== "none"` (no synthesized fade under None).
- `09af4d5` — `SlideContent`: synchronous swap when `currentTransitionDuration === 0` (no `show`-cycle blank); `itemsAreEqual` ignores volatile auto-size fields.
- `f876ed1` — `Overlay`: synchronous swap for no-transition (no metadata `{#key show}` remount).
- `5e213e8` — `SlideContent`: the no-transition swap now **awaits the off-screen autosize precompute** (bounded 600 ms, generation-guarded) before swapping, so a freshly-converted scripture show's cold-cache text is already measured (no `visibility:hidden` hide-blank) and the old slide stays visible meanwhile. Fixes the **"first run only"** black flash (finding #5).

**Standalone reference branch:** `feature/transition-flicker-fixes` (off `upstream/dev`) — the 4 fixes cherry-picked clean onto current upstream (3 files, +48/−5), so they read as the flicker fixes *in isolation* against the released transition system. Not opened as a PR.
- Branch: `https://github.com/jcfurey/freeshow/tree/feature/transition-flicker-fixes`
- Compare: `https://github.com/ChurchApps/FreeShow/compare/dev...jcfurey:freeshow:feature/transition-flicker-fixes`
- **Shared with @vassbo** via email (2026-06-16), framed as "here if useful" alongside the offer to open focused PRs.

**Optional contribution:** a **#2169 diagnosis comment** (especially the cold-cache "first run only" explanation, which answers @frederickjh's open question) would help vassbo's rework without stepping on it — not yet posted.

---

## PR 1 — Security & dependency hardening
**Branch:** `split/1-deps-and-security` → **base:** `dev` · independent (open now) · 14 commits · **changes requested → all addressed (2026-06-17)**

**Title:** `Security & dependency hardening: clear npm advisories + commit lockfile`

**Body:** *(updated after @vassbo's 2026-06-17 review — see the "#3384 review round" section above)*
> Hardens the dependency tree and fixes a few correctness findings, with no functional changes to the app.
>
> **Dependencies / advisories** (kept after review — no runtime coupling):
> - `@rollup/plugin-terser` **0.4 → 1.0** (serialize-javascript RCE)
> - `npm-run-all` → `npm-run-all2` (drops the unmaintained package + its cross-spawn ReDoS)
> - `tmp` → ^0.2.7 + `overrides` for `shell-quote` ^1.8.4 / `tmp` ^0.2.7 (path traversal / injection)
> - add `engines.node`; commit `package-lock.json` and mark it `generated` so it's collapsed in diffs
>
> Per review, the Electron 37→40, `music-metadata` 7→11, and `fast-xml-parser` 5.x bumps were **reverted** to their pins — they return as focused follow-ups with the breaking-change handling.
>
> **Source:** small fixes surfaced by a static review (thumbnails lock-release, `files.ts` EXIF resolve, a shared IPC reply dispatcher, a REMOTE auth gate, minor robustness in servers/zip/csv/media). Contested audit changes flagged in review were reverted.
>
> **Tooling:** manual CI workflow (`.github/workflows/ci.yml`); repaired Playwright smoke test.
>
> **Verification:** `npm ci`, `npm run build`, and unit tests pass.
>
> *Note:* the line count is dominated by `package-lock.json` (collapsed via `.gitattributes`); the reviewable source delta is ~15 files.

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

# Upstream `svelte5` branch — status & transition feedback

**Fork:** `jcfurey/freeshow`  **Upstream:** `ChurchApps/FreeShow`  **Branch:** `svelte5`
**Last updated:** 2026-08-17

Companion to `PR_ROADMAP.md`, covering the upstream `svelte5` integration branch that
#3396 was squash-merged into. The roadmap holds the same content in its
"Upstream `svelte5` branch — transition feedback" section; this file exists because the
web container has no git push credentials and the API push path needs whole-file content
(see "Tooling constraint" below).

## Branch pulled in

Added an `upstream` remote (`ChurchApps/FreeShow`); local `svelte5` tracks
`upstream/svelte5` **exactly** — `644e6b1`, 0 ahead / 0 behind, identical tree.

Only two commits since the fork point `e12355a`:

- **`47b4190`** — our #3396 squash (Svelte 5 + Vite 8 + TypeScript 5, compatibility mode).
- **`644e6b1` "Update"** (vassbo, 2026-07-27) — deps only, plus one style fix:
  - **`fast-xml-parser` `5.4.1` → `^5.10.1`** — this resolves the deferred bump the roadmap
    had gated on "@vassbo's pin reason"; he bumped it himself, so that question is closed.
  - dropped the `shell-quote` override, `npm-run-all2` → `^9.0.2`
  - `ProjectContentList.svelte`: `--border-color` binding made conditional

## @vassbo's feedback (#3396, 2026-08-14)

> "Btw. I did look at this but the transitions did not work properly. They were not smooth."

## Diagnosis — branch staleness, not a migration regression

`svelte5` is still `1.6.2-beta.2`; `upstream/dev` is `1.6.5-beta.3` — **15 commits, 506 files
apart**. Two commits in that gap are vassbo's own transition-smoothness fixes, and neither
is on `svelte5`:

- **`bd9aad4` (1.6.2, #3402)** — `SlideContent.svelte` gained an `isDifferentSlide` guard
  before setting `transitioningBetween`. Without it the branch sets it whenever items exist,
  so the *between* transition fires on updates that aren't slide changes.
- **`df5c41a` (1.6.4-beta.2, #3517)** — `SlideItemTransition.startTransition()` gained a
  "prevent stacking of the same item on update" early return. Without it every reactive
  re-run pushes another state into `currentlyTransitioning` and mounts another
  `OutputTransition` with its own in/out → overlapping animations, which reads as
  "not smooth".

**Verified not our doing:** neither guard exists at `e12355a` (the squash parent), so the
migration did not strip them — they landed on `dev` after the branch was cut. Our `|global`
transitions and the `transitionId` keying are both still intact on `svelte5`.

This is inference from the diff, **not runtime-confirmed** — it explains "not smooth" better
than the snapping the `|global` fix addressed, but nobody has watched it side by side yet.

## Refresh probe

`git merge upstream/dev` into `svelte5` → **34 conflicts**. Mostly mechanical and the same
shape as the original migration: dev's newer code uses **value imports for types**
(e.g. `import { ShowList }` in `searchFast.ts`), which Vite 8 rejects under
`isolatedModules`, so it needs another `import type` sweep.

Resolution rule stays the roadmap's mixed rule — take `upstream/dev` for source content,
re-apply the Svelte-5 / Vite-8 mechanical bits on top.

**Not executed** — gated on vassbo answering the offer below.

## Posted to #3396 (2026-08-17)

The diagnosis above, flagged as a theory pending runtime confirmation, plus an offer to
rebase the migration onto current `dev` so it can be tested against `1.6.5-beta.3`.
Awaiting his reply.

## Tooling constraint (Claude Code web container)

- **No git push credentials** — no `credential.helper`, no GitHub token in env; `git push`
  fails on every branch and every remote.
- Writes to the fork go through the **GitHub API** (MCP, authenticated as `jcfurey`).
- That path **cannot point a ref at an arbitrary SHA**, so it cannot mirror upstream
  `svelte5` history into the fork, and every push must carry **whole-file content**.
- Consequence: the API path suits small, bounded doc/source changes. It is **not** viable
  for the rebase deliverable (100+ files plus a regenerated ~1 MB `package-lock.json`).
  That needs a real `git push`, i.e. a PAT in the environment.
- Fork `dev` is also stale (`e0b36f5`, 1.6.3-beta.1) vs `upstream/dev` (`8a862f2`) —
  **click "Sync fork" on `jcfurey/freeshow` `dev`** before any rebase work so there is a
  current base to stack on.

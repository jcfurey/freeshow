# Advanced Bible Engine

Adds interlinear original-language support, Strong's numbers, cross references and a dedicated
Bible Study mode to FreeShow (see issue
[#3366](https://github.com/ChurchApps/FreeShow/issues/3366)).

The feature is intentionally **additive and backwards compatible** — existing Bibles, scripture
presentation and saved data are untouched. All of the new reference data (Strong's lexicon and
cross references) is **imported by the user** from standard open datasets, so no large data files
are bundled with the app.

## What it does

- **Interlinear Hebrew / Greek** – word-by-word display of the original language alongside the
  translation, with optional transliteration and morphology.
- **Strong's numbers** – click any tagged word to see its Strong's number and full lexicon entry
  (lemma, transliteration, pronunciation, definition and KJV usage).
- **Cross references** – related passages for the current verse, ranked by relevance, with one-click
  navigation.
- **Bible Study mode** – a dedicated full-screen study view (separate from presentation) with
  parallel translations, the interlinear view, Strong's concordance search, keyword/reference search
  and per-verse notes.

## How to open it

In the **Scripture** drawer, open a local Bible and click the **book** icon in the floating controls
(bottom-right), or use the _Bible study mode_ button. The study view opens at the currently selected
reference.

## Where the data comes from

The interlinear data lives **inside the Bible itself**. When you import a Strong's-tagged Bible (for
example an OSIS Bible with `<w lemma="strong:H7225">` markup, or a Bible whose verse text uses inline
`{H7225}` / `<S>0430</S>` markers), the engine automatically extracts the word-level Strong's numbers
and morphology. No separate file is needed for interlinear.

The **lexicon** (Strong's definitions) and **cross references** are shared reference data and are
imported separately via **Import Bible study data** (the download icon in the study view header, or
`Popups → Import Bible study data`).

### Supported import formats

| Data             | Format                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strong's lexicon | JSON object keyed by Strong's number, e.g. the [OpenScriptures](https://github.com/openscriptures/strongs) Hebrew & Greek dictionaries: `{ "H430": { "lemma": "…", "xlit": "…", "pron": "…", "strongs_def": "…", "kjv_def": "…" } }` |
| Cross references | Tab-separated [OpenBible.info](https://www.openbible.info/labs/cross-references/) export (`From Verse  To Verse  Votes`), or a JSON object `{ "John 3:16": ["Romans 5:8", …] }`                                                      |
| Tagged Bibles    | Any OSIS / FreeShow Bible whose verses carry Strong's tags (handled automatically on import)                                                                                                                                         |

## Architecture

| Layer                      | Files                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Types                      | `src/types/BibleStudy.ts`                                                                                                                                                                  |
| Engine (pure, unit-tested) | `src/common/scripture/bibleStudy.ts`, `src/common/scripture/bibleData.ts`                                                                                                                  |
| Tests                      | `src/common/scripture/bibleStudy.test.ts`                                                                                                                                                  |
| Converter integration      | `src/frontend/converters/osisBible.ts` (preserves `<w>` Strong's tags as interlinear words)                                                                                                |
| Stores                     | `strongsLexicon`, `crossReferences`, `bibleNotes`, `bibleStudySettings`, `bibleStudyState` in `src/frontend/stores.ts`                                                                     |
| Persistence                | dedicated `BIBLE_STUDY` store (`bible_study.json`) wired through the standard load/save flow                                                                                               |
| UI                         | `src/frontend/components/drawer/bible/BibleStudy.svelte` and its panels (`Interlinear`, `StrongsEntryView`, `CrossReferencesPanel`, `StudyNotesPanel`), plus `ImportBibleStudyData.svelte` |

The engine (`src/common/scripture`) has **no Svelte/Electron/DOM dependencies** so it is fully unit
tested in Node. Run the tests with:

```sh
npm run test:unit
```

## Data model notes

- A verse may carry an optional `words: InterlinearWord[]` array (surface text + Strong's numbers +
  morphology). Verses without it are unchanged.
- Verses are keyed canonically as `"book.chapter.verse"` using the canonical book number (1–66),
  independent of any translation's book naming, so cross references and notes are portable between
  translations.
- Strong's numbers are normalized to the `H430` / `G3056` form (leading zeros stripped, language
  prefix uppercased), so `H0430`, `h430` and `430` (with a Hebrew context) all resolve to the same
  entry.

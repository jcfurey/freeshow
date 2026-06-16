// ----- FreeShow -----
// Type definitions for the Advanced Bible Engine
// (interlinear original languages, Strong's numbers, cross references, study mode)
//
// These types are intentionally additive and backwards compatible:
// - Interlinear word data is stored on existing Bible verses via an optional `words` field.
// - Lexicon, cross references, notes and settings live in the dedicated BIBLE_STUDY store.

// A single word of word-by-word interlinear data attached to a verse.
export interface InterlinearWord {
    text: string // surface text as shown in the translation
    strongs?: string[] // one or more Strong's numbers, normalized (e.g. ["H7225"])
    morph?: string // morphology code (e.g. "Ncfsa" for Hebrew, "V-AAI-3S" for Greek)
    lemma?: string // original-language lemma (Hebrew/Greek/Aramaic)
    translit?: string // transliteration of the original word
    gloss?: string // short English gloss
}

// Strong's lexicon entry, keyed by normalized number (Hxxxx / Gxxxx).
export interface StrongsEntry {
    strongs: string // normalized id, e.g. "H7225" or "G2316"
    lemma?: string // original word (Hebrew/Greek)
    translit?: string // transliteration ("xlit")
    pronounce?: string // pronunciation
    language?: "hebrew" | "greek" | "aramaic"
    derivation?: string // etymology / derivation
    definition?: string // Strong's definition
    kjvDefinition?: string // KJV usage ("kjv_def")
    partOfSpeech?: string
}
export type StrongsLexicon = { [strongs: string]: StrongsEntry }

// A cross reference pointing from one verse to a related passage.
export interface CrossReference {
    ref: string // human readable reference, e.g. "John 3:16"
    key: string // canonical key "book.chapter.verse" (book is the canonical number)
    votes?: number // relevance score (higher = more relevant), from OpenBible data
}
export type CrossReferenceMap = { [verseKey: string]: CrossReference[] }

// A user generated study note attached to a verse.
export interface StudyNote {
    key: string // canonical verse key
    reference: string // human readable reference
    text: string // note content
    color?: string // optional highlight color
    tags?: string[]
    modified: number // timestamp
}
export type BibleNotes = { [verseKey: string]: StudyNote }

export interface BibleStudySettings {
    showInterlinear: boolean
    showTransliteration: boolean
    showMorphology: boolean
    showStrongs: boolean
    showLexicon: boolean
    parallelVersions: string[] // bible ids shown side by side
    primaryVersion: string // bible id used for navigation / interlinear
}

export const defaultBibleStudySettings: BibleStudySettings = {
    showInterlinear: true,
    showTransliteration: true,
    showMorphology: false,
    showStrongs: true,
    showLexicon: true,
    parallelVersions: [],
    primaryVersion: ""
}

// Aggregate object persisted in the local BIBLE_STUDY store file. Holds only the large, shared
// reference data (lexicon + cross references). Per-verse notes and study settings are persisted via
// synced settings instead, so they sync across devices and don't rewrite this (potentially large)
// file when a setting changes.
export interface BibleStudyData {
    lexicon: StrongsLexicon
    crossReferences: CrossReferenceMap
}

// A parsed scripture reference (used for searching and cross reference navigation).
export interface ParsedReference {
    book: number // canonical book number (1-66)
    bookName: string // resolved English book name
    chapter: number
    verses: number[] // empty = whole chapter
}

// A single search result when searching the Bible (by keyword or Strong's number).
export interface BibleStudySearchResult {
    key: string // canonical verse key
    reference: string // human readable reference
    book: number
    chapter: number
    verse: number
    text: string // verse text (may contain a highlight marker)
}

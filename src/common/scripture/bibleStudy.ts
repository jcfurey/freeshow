// ----- FreeShow -----
// Core engine for the Advanced Bible Engine.
//
// This module is intentionally free of any Svelte / Electron / DOM dependencies so it can be
// unit tested in a plain Node environment and reused by both the frontend and the converters.
//
// Responsibilities:
//  - Normalize Strong's numbers and canonical verse keys.
//  - Extract word-by-word interlinear data from tagged verse text (OSIS <w> tags or inline markers).
//  - Import & look up Strong's lexicon entries.
//  - Import & look up cross references.
//  - Parse and format scripture references.
//  - Search a Bible by keyword or by Strong's number (concordance).

import type { CrossReference, CrossReferenceMap, InterlinearWord, ParsedReference, StrongsEntry, StrongsLexicon } from "../../types/BibleStudy"
import { getBookByOsis, getBookName, resolveBook } from "./bibleData"

/// ----- STRONG'S NUMBER NORMALIZATION -----

// Normalize a Strong's number to the canonical "H430" / "G3056" form.
// Strips leading zeros, uppercases the language prefix, lowercases any trailing letter.
// `defaultPrefix` is used when the raw value has no H/G/A prefix (e.g. inferred from testament).
export function normalizeStrongs(raw: string | number, defaultPrefix = ""): string {
    if (raw === null || raw === undefined) return ""
    const value = String(raw).trim()
    const match = value.match(/^([HGAhga]?)0*(\d+)([A-Za-z]?)$/)
    if (!match) return ""

    const prefix = (match[1] || defaultPrefix).toUpperCase()
    const number = match[2]
    const suffix = (match[3] || "").toLowerCase()
    return `${prefix}${number}${suffix}`
}

export function isHebrewStrongs(strongs: string): boolean {
    return /^H/i.test(strongs)
}
export function isGreekStrongs(strongs: string): boolean {
    return /^G/i.test(strongs)
}

/// ----- CANONICAL VERSE KEYS -----

// A verse key has the form "book.chapter.verse" where book is the canonical book number (1-66).
export function verseKey(book: number | string, chapter: number | string, verse: number | string): string {
    return `${book}.${chapter}.${verse}`
}

export function parseVerseKey(key: string): { book: number; chapter: number; verse: number } | null {
    const parts = String(key).split(".")
    if (parts.length < 3) return null
    const [book, chapter, verse] = parts.map((p) => Number(p))
    if (![book, chapter, verse].every((n) => Number.isFinite(n))) return null
    return { book, chapter, verse }
}

/// ----- INTERLINEAR EXTRACTION -----

const OSIS_WORD_REGEX = /<w\b([^>]*)>([\s\S]*?)<\/w>/gi
const INLINE_STRONGS_REGEX = /\{([HGAhga]?\d{1,5}[a-z]?)\}|<S>\s*([HGAhga]?\d{1,5}[a-z]?)\s*<\/S>/gi
const MORPH_BRACE_REGEX = /\{([A-Za-z]{1,3}\d{2,5}[a-z]?)\}/g

// Does this verse text contain machine readable Strong's tagging?
export function hasStrongsTagging(text: string): boolean {
    if (!text) return false
    return /<w\b[^>]*\b(lemma|strong)/i.test(text) || /\{[HGAhga]?\d{1,5}[a-z]?\}/.test(text) || /<S>\s*[HGAhga]?\d{1,5}/i.test(text)
}

function parseAttributes(raw: string): { [key: string]: string } {
    const attrs: { [key: string]: string } = {}
    const regex = /([\w:-]+)\s*=\s*"([^"]*)"/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(raw))) attrs[match[1].toLowerCase()] = match[2]
    return attrs
}

// Extract every Strong's number found inside a lemma/strong attribute value.
function strongsFromAttribute(value: string, defaultPrefix: string): string[] {
    if (!value) return []
    const results: string[] = []
    const regex = /(?:strong:)?([HGAhga]?\d{1,5}[a-z]?)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(value))) {
        const normalized = normalizeStrongs(match[1], defaultPrefix)
        if (normalized) results.push(normalized)
    }
    return results
}

function stripTags(text: string): string {
    return text
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

// Parse OSIS style <w lemma="strong:H7225" morph="...">word</w> tagged text into words.
function parseOsisWords(text: string, defaultPrefix: string): InterlinearWord[] {
    const words: InterlinearWord[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    OSIS_WORD_REGEX.lastIndex = 0
    while ((match = OSIS_WORD_REGEX.exec(text))) {
        // capture any plain text between tagged words (punctuation, untagged words)
        const between = stripTags(text.slice(lastIndex, match.index))
        if (between) words.push({ text: between })

        const attrs = parseAttributes(match[1])
        const surface = stripTags(match[2])
        const strongs = strongsFromAttribute(attrs.lemma || attrs.strong || "", defaultPrefix)
        const word: InterlinearWord = { text: surface }
        if (strongs.length) word.strongs = strongs
        const morph = attrs.morph?.replace(/^[a-z]+:/i, "")
        if (morph) word.morph = morph
        words.push(word)

        lastIndex = match.index + match[0].length
    }

    const tail = stripTags(text.slice(lastIndex))
    if (tail) words.push({ text: tail })

    return words.filter((w) => w.text)
}

// Parse text with inline markers, e.g. "In{H7225} the beginning God{H430}" or "God<S>0430</S>".
function parseInlineWords(text: string, defaultPrefix: string): InterlinearWord[] {
    // Walk the string, accumulating surface words and attaching markers to the previous word.
    const words: InterlinearWord[] = []
    const tokenRegex = /(\{[HGAhga]?\d{1,5}[a-z]?\})|(<S>\s*[HGAhga]?\d{1,5}[a-z]?\s*<\/S>)|(\{[A-Za-z]{1,3}\d{2,5}[a-z]?\})|(<[^>]+>)|([^\s{}<]+)|(\s+)/g

    let match: RegExpExecArray | null
    while ((match = tokenRegex.exec(text))) {
        const [token, strongBrace, strongTag, morphBrace, otherTag, surface] = match

        if (strongBrace || strongTag) {
            const inner = (strongBrace || strongTag).replace(/[{}]|<\/?S>/gi, "").trim()
            const normalized = normalizeStrongs(inner, defaultPrefix)
            if (normalized) {
                const target = words[words.length - 1]
                if (target) {
                    if (!target.strongs) target.strongs = []
                    if (!target.strongs.includes(normalized)) target.strongs.push(normalized)
                }
            }
        } else if (morphBrace) {
            const target = words[words.length - 1]
            if (target && !target.morph) target.morph = morphBrace.replace(/[{}]/g, "")
        } else if (surface) {
            words.push({ text: surface })
        }
        // otherTag and whitespace are ignored as word separators
        void token
        void otherTag
    }

    return words.filter((w) => w.text)
}

// Tokenize plain text into surface words (no Strong's data available).
function tokenizePlain(text: string): InterlinearWord[] {
    return stripTags(text)
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => ({ text: t }))
}

// Extract interlinear words from tagged verse text. Returns words with Strong's numbers when the
// text is tagged, otherwise a plain word list. `book` (canonical number) is used to infer the
// language prefix (Old Testament => Hebrew, New Testament => Greek) for prefix-less markers.
export function extractInterlinearWords(text: string, book?: number): InterlinearWord[] {
    if (!text) return []
    const defaultPrefix = book ? (book <= 39 ? "H" : "G") : ""

    if (/<w\b/i.test(text)) return parseOsisWords(text, defaultPrefix)
    if (hasStrongsTagging(text)) return parseInlineWords(text, defaultPrefix)
    return tokenizePlain(text)
}

// Get the interlinear words for a verse, preferring pre-parsed `words` then falling back to the text.
export function getInterlinearWords(verse: { text?: string; words?: InterlinearWord[] }, book?: number): InterlinearWord[] {
    if (verse?.words?.length) return verse.words
    return extractInterlinearWords(verse?.text || "", book)
}

// Unwrap <w> tagged words and remove inline Strong's/morphology markers while keeping any other
// formatting (e.g. <span class="wj"> for the words of Jesus). Used when importing tagged bibles.
export function unwrapTaggedWords(text: string): string {
    if (!text) return ""
    return text
        .replace(OSIS_WORD_REGEX, (_m, _attrs, inner) => inner)
        .replace(INLINE_STRONGS_REGEX, "")
        .replace(MORPH_BRACE_REGEX, "")
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim()
}

// Remove Strong's / morphology markers and tags, leaving clean readable text.
export function stripStrongsMarkers(text: string): string {
    if (!text) return ""
    return text
        .replace(OSIS_WORD_REGEX, (_m, _attrs, inner) => inner)
        .replace(INLINE_STRONGS_REGEX, "")
        .replace(MORPH_BRACE_REGEX, "")
        .replace(/!\{(.*?)\}!/g, "$1") // FreeShow red-letter delimiters: keep the words
        .replace(/<[^>]+>/g, "")
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim()
}

/// ----- STRONG'S LEXICON -----

// Import an OpenScriptures style Strong's dictionary object into the FreeShow lexicon format.
// Accepts entries keyed by "H1"/"G1" with { lemma, xlit, pron, derivation, strongs_def, kjv_def }.
export function importStrongsLexicon(raw: { [key: string]: any }, language?: "hebrew" | "greek"): StrongsLexicon {
    const lexicon: StrongsLexicon = {}
    if (!raw || typeof raw !== "object") return lexicon

    for (const [rawKey, value] of Object.entries(raw)) {
        if (!value || typeof value !== "object") continue
        const key = normalizeStrongs(rawKey)
        if (!key) continue

        const inferred: "hebrew" | "greek" | "aramaic" | undefined = language || (isHebrewStrongs(key) ? "hebrew" : isGreekStrongs(key) ? "greek" : undefined)

        const entry: StrongsEntry = {
            strongs: key,
            lemma: value.lemma || value.original || value.word || "",
            translit: value.xlit || value.translit || value.transliteration || "",
            pronounce: value.pron || value.pronounce || value.pronunciation || "",
            language: inferred,
            derivation: value.derivation || "",
            definition: value.strongs_def || value.strongsDef || value.definition || value.def || "",
            kjvDefinition: value.kjv_def || value.kjvDef || value.kjvDefinition || value.usage || "",
            partOfSpeech: value.pos || value.partOfSpeech || value.part_of_speech || ""
        }
        lexicon[key] = entry
    }

    return lexicon
}

// Look up a Strong's entry, tolerating un-normalized input ("H0430", "g3056", 3056).
export function lookupStrongs(lexicon: StrongsLexicon, raw: string | number, defaultPrefix = ""): StrongsEntry | undefined {
    if (!lexicon) return undefined
    const key = normalizeStrongs(raw, defaultPrefix)
    if (!key) return undefined
    if (lexicon[key]) return lexicon[key]

    // tolerate a missing prefix by trying both languages
    if (!/^[HGA]/.test(key)) {
        return lexicon["H" + key] || lexicon["G" + key]
    }
    return undefined
}

/// ----- CROSS REFERENCES -----

// Convert an OSIS-ish reference ("John.3.16" or "John.3.16-John.3.18") to a canonical key + label.
export function osisRefToReference(osisRef: string): { key: string; ref: string } | null {
    if (!osisRef) return null
    const start = osisRef.split("-")[0]
    const parts = start.split(".")
    if (parts.length < 3) return null

    const book = getBookByOsis(parts[0])
    if (!book) return null

    const chapter = Number(parts[1])
    const verse = Number(parts[2])
    if (!Number.isFinite(chapter) || !Number.isFinite(verse)) return null

    // build a human readable label, expanding a same-chapter verse range
    let ref = `${book.name} ${chapter}:${verse}`
    const endPart = osisRef.includes("-") ? osisRef.split("-")[1].split(".") : null
    if (endPart && endPart.length >= 3) {
        const endChapter = Number(endPart[1])
        const endVerse = Number(endPart[2])
        if (endChapter === chapter && endVerse !== verse) ref += `-${endVerse}`
        else if (endChapter !== chapter) ref += `-${endChapter}:${endVerse}`
    }

    return { key: verseKey(book.number, chapter, verse), ref }
}

// Import the OpenBible.info cross reference dataset (tab separated: "From Verse\tTo Verse\tVotes").
export function importCrossReferencesTSV(tsv: string): CrossReferenceMap {
    const map: CrossReferenceMap = {}
    if (!tsv) return map

    const lines = tsv.split(/\r?\n/)
    for (const line of lines) {
        if (!line.trim()) continue
        const [from, to, votesRaw] = line.split("\t")
        if (!from || !to || /from verse/i.test(from)) continue // skip header

        const fromRef = osisRefToReference(from)
        const toRef = osisRefToReference(to)
        if (!fromRef || !toRef) continue

        const votes = Number(votesRaw)
        if (!map[fromRef.key]) map[fromRef.key] = []
        map[fromRef.key].push({ ref: toRef.ref, key: toRef.key, votes: Number.isFinite(votes) ? votes : 0 })
    }

    // sort each verse's references by votes (most relevant first)
    for (const key of Object.keys(map)) {
        map[key].sort((a, b) => (b.votes || 0) - (a.votes || 0))
    }

    return map
}

// Import cross references from a JSON object whose values are reference strings or objects.
// Accepts either canonical keys ("43.3.16") or human references ("John 3:16") as keys.
export function importCrossReferencesJSON(raw: { [key: string]: any }): CrossReferenceMap {
    const map: CrossReferenceMap = {}
    if (!raw || typeof raw !== "object") return map

    for (const [rawKey, value] of Object.entries(raw)) {
        const fromKey = canonicalizeKey(rawKey)
        if (!fromKey) continue
        const list = Array.isArray(value) ? value : []

        const refs: CrossReference[] = []
        for (const item of list) {
            const refString = typeof item === "string" ? item : item?.ref || item?.reference
            if (!refString) continue
            const parsed = parseReference(refString)
            if (!parsed) continue
            refs.push({ ref: refString, key: verseKey(parsed.book, parsed.chapter, parsed.verses[0] || 1), votes: typeof item === "object" ? item.votes || 0 : 0 })
        }

        if (refs.length) map[fromKey] = refs
    }

    return map
}

// Accept either an already-canonical key ("43.3.16") or a human reference ("John 3:16").
function canonicalizeKey(raw: string): string | null {
    if (/^\d+\.\d+\.\d+$/.test(raw)) return raw
    const parsed = parseReference(raw)
    if (!parsed) return null
    return verseKey(parsed.book, parsed.chapter, parsed.verses[0] || 1)
}

// Get cross references for a verse, optionally limiting the count.
export function getCrossReferences(map: CrossReferenceMap, key: string, limit = 0): CrossReference[] {
    const refs = map?.[key] || []
    return limit > 0 ? refs.slice(0, limit) : refs
}

/// ----- REFERENCE PARSING & FORMATTING -----

// Parse a free text reference such as "John 3:16", "1 Cor 13:4-7", "Genesis 1" into structured data.
export function parseReference(input: string): ParsedReference | null {
    if (!input) return null
    const trimmed = input.trim()

    // book token may start with a leading number (1/2/3 John) or roman numeral
    const match = trimmed.match(/^((?:[1-3]|i{1,3})\s*)?([A-Za-z][A-Za-z. ]*?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/i)
    if (!match) return null

    const bookToken = `${match[1] || ""}${match[2]}`.trim()
    const book = resolveBook(bookToken)
    if (!book) return null

    const chapter = Number(match[3])
    const verseStart = match[4] ? Number(match[4]) : 0
    const verseEnd = match[5] ? Number(match[5]) : verseStart

    const verses: number[] = []
    if (verseStart) {
        for (let v = verseStart; v <= Math.max(verseStart, verseEnd); v++) verses.push(v)
    }

    return { book: book.number, bookName: book.name, chapter, verses }
}

// Format a canonical location back into a human readable reference.
export function formatReference(book: number, chapter: number, verses: number[] = []): string {
    const name = getBookName(book)
    if (!verses.length) return `${name} ${chapter}`
    if (verses.length === 1) return `${name} ${chapter}:${verses[0]}`

    const first = verses[0]
    const last = verses[verses.length - 1]
    const isContiguous = verses.every((v, i) => i === 0 || v === verses[i - 1] + 1)
    if (isContiguous) return `${name} ${chapter}:${first}-${last}`
    return `${name} ${chapter}:${verses.join(",")}`
}

/// ----- SEARCH (CONCORDANCE & KEYWORD) -----

interface SearchableBible {
    books?: { number: number; name?: string; chapters?: { number: number; verses?: { number: number | string; text?: string; words?: InterlinearWord[] }[] }[] }[]
}

// Find every verse tagged with a given Strong's number (Strong's concordance).
export function searchStrongsInBible(bible: SearchableBible, strongsRaw: string, limit = 200) {
    const target = normalizeStrongs(strongsRaw)
    const results: { key: string; reference: string; book: number; chapter: number; verse: number; text: string }[] = []
    if (!target || !bible?.books) return results

    for (const book of bible.books) {
        for (const chapter of book.chapters || []) {
            for (const verse of chapter.verses || []) {
                const words = getInterlinearWords(verse, book.number)
                const matches = words.some((w) => w.strongs?.some((s) => normalizeStrongs(s) === target))
                if (!matches) continue

                const verseNumber = Number(verse.number)
                results.push({
                    key: verseKey(book.number, chapter.number, verseNumber),
                    reference: formatReference(book.number, chapter.number, [verseNumber]),
                    book: book.number,
                    chapter: chapter.number,
                    verse: verseNumber,
                    text: stripStrongsMarkers(verse.text || "")
                })
                if (results.length >= limit) return results
            }
        }
    }

    return results
}

// Keyword search across verse text (case insensitive, all words must be present).
export function searchTextInBible(bible: SearchableBible, query: string, limit = 200) {
    const results: { key: string; reference: string; book: number; chapter: number; verse: number; text: string }[] = []
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length || !bible?.books) return results

    for (const book of bible.books) {
        for (const chapter of book.chapters || []) {
            for (const verse of chapter.verses || []) {
                const clean = stripStrongsMarkers(verse.text || "")
                const lower = clean.toLowerCase()
                if (!terms.every((t) => lower.includes(t))) continue

                const verseNumber = Number(verse.number)
                results.push({
                    key: verseKey(book.number, chapter.number, verseNumber),
                    reference: formatReference(book.number, chapter.number, [verseNumber]),
                    book: book.number,
                    chapter: chapter.number,
                    verse: verseNumber,
                    text: clean
                })
                if (results.length >= limit) return results
            }
        }
    }

    return results
}

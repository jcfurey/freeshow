// ----- FreeShow -----
// Frontend glue for the Advanced Bible Engine: opening the study overlay, reading local Bible
// data from the cache and managing per-verse study notes.

import { get } from "svelte/store"
import type { Bible } from "json-bible/lib/Bible"
import { verseKey } from "../../../../common/scripture/bibleStudy"
import type { InterlinearWord, StudyNote } from "../../../../types/BibleStudy"
import { bibleNotes, bibleStudyState, scriptures, scripturesCache } from "../../../stores"
import { loadJsonBible } from "./scripture"

// Open the Bible Study overlay, optionally at a specific reference.
export function openBibleStudy(options: { bibleId?: string; book?: number; chapter?: number; verse?: number } = {}) {
    bibleStudyState.set({ active: true, ...options })
}

export function closeBibleStudy() {
    bibleStudyState.set({ active: false })
}

// All local (non-API, non-collection) bibles from the scripture list. Their full verse data is
// loaded lazily into scripturesCache on demand (see ensureBibleLoaded) — FreeShow does not load
// every local bible into memory at startup.
// Pass the scriptures store value (e.g. `$scriptures`) from a reactive context so the result stays
// in sync; defaults to a one-off read for imperative callers.
export function getLocalBibleIds(all = get(scriptures)): string[] {
    return Object.keys(all).filter((id) => all[id] && !all[id].api && !all[id].collection)
}

// Ensure a local bible's verse data is present in scripturesCache, loading it from disk if needed.
// loadJsonBible() populates scripturesCache as a side effect for local bibles.
export async function ensureBibleLoaded(id: string): Promise<void> {
    if (!id || get(scripturesCache)[id]?.books?.length) return
    const meta = get(scriptures)[id]
    if (!meta || meta.api || meta.collection) return
    try {
        await loadJsonBible(id)
    } catch (err) {
        console.error("Bible study: failed to load bible", id, err)
    }
}

export function getBibleData(id: string): Bible | null {
    return get(scripturesCache)[id] || null
}

export function getBibleName(id: string): string {
    const data = get(scriptures)[id]
    return data?.customName || data?.name || id
}

interface ChapterData {
    number: number
    verses: { number: number | string; text?: string; words?: InterlinearWord[] }[]
}
interface BookData {
    number: number
    name?: string
    customName?: string
    chapters?: ChapterData[]
}

export function getBook(bible: Bible | null, bookNumber: number): BookData | null {
    if (!bible?.books) return null
    return (bible.books.find((b: any) => Number(b.number) === Number(bookNumber)) as BookData) || null
}

export function getChapter(book: BookData | null, chapterNumber: number): ChapterData | null {
    if (!book?.chapters) return null
    return book.chapters.find((c) => Number(c.number) === Number(chapterNumber)) || null
}

export function getVerse(chapter: ChapterData | null, verseNumber: number) {
    if (!chapter?.verses) return null
    return chapter.verses.find((v) => Number(v.number) === Number(verseNumber)) || null
}

// Save (or clear) a study note for a verse.
export function setStudyNote(key: string, reference: string, text: string, color?: string) {
    bibleNotes.update((notes) => {
        const trimmed = (text || "").trim()
        if (!trimmed && !color) {
            delete notes[key]
            return notes
        }
        const existing = notes[key]
        const note: StudyNote = {
            key,
            reference,
            text: trimmed,
            color: color ?? existing?.color,
            tags: existing?.tags,
            modified: Date.now()
        }
        notes[key] = note
        return notes
    })
}

export function getStudyNote(book: number, chapter: number, verse: number): StudyNote | undefined {
    return get(bibleNotes)[verseKey(book, chapter, verse)]
}

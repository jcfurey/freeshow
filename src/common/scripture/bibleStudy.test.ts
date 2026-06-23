import { describe, expect, it } from "vitest"
import { extractInterlinearWords, formatReference, getCrossReferences, getInterlinearWords, hasStrongsTagging, importCrossReferencesJSON, importCrossReferencesTSV, importStrongsLexicon, lookupStrongs, normalizeStrongs, osisRefToReference, parseReference, parseVerseKey, searchStrongsInBible, searchTextInBible, stripStrongsMarkers, unwrapTaggedWords, verseKey } from "./bibleStudy"
import { getBookByOsis, resolveBook } from "./bibleData"

describe("normalizeStrongs", () => {
    it("strips leading zeros and uppercases the prefix", () => {
        expect(normalizeStrongs("H0430")).toBe("H430")
        expect(normalizeStrongs("g03056")).toBe("G3056")
        expect(normalizeStrongs("H7225")).toBe("H7225")
    })
    it("applies a default prefix when none is present", () => {
        expect(normalizeStrongs("430", "H")).toBe("H430")
        expect(normalizeStrongs(3056, "G")).toBe("G3056")
    })
    it("keeps a trailing disambiguation letter", () => {
        expect(normalizeStrongs("H7225a")).toBe("H7225a")
    })
    it("returns empty string for invalid input", () => {
        expect(normalizeStrongs("")).toBe("")
        expect(normalizeStrongs("abc")).toBe("")
        expect(normalizeStrongs(null as any)).toBe("")
    })
})

describe("verse keys", () => {
    it("builds and parses keys", () => {
        expect(verseKey(43, 3, 16)).toBe("43.3.16")
        expect(parseVerseKey("43.3.16")).toEqual({ book: 43, chapter: 3, verse: 16 })
        expect(parseVerseKey("bad")).toBeNull()
    })
})

describe("canonical book resolution", () => {
    it("resolves names, abbreviations and osis ids", () => {
        expect(resolveBook("Genesis")?.number).toBe(1)
        expect(resolveBook("Jn")?.number).toBe(43)
        expect(resolveBook("1 Cor")?.number).toBe(46)
        expect(resolveBook("II Corinthians")?.number).toBe(47)
        expect(resolveBook("Isaiah")?.number).toBe(23)
        expect(resolveBook("Isa")?.number).toBe(23)
        expect(getBookByOsis("1Sam")?.number).toBe(9)
    })
    it("returns undefined for unknown books", () => {
        expect(resolveBook("Hogwarts")).toBeUndefined()
    })
})

describe("extractInterlinearWords", () => {
    it("parses OSIS <w> tagged text", () => {
        const text = '<w lemma="strong:H7225">In the beginning</w> <w lemma="strong:H1254" morph="strongMorph:TH8804">God created</w>'
        const words = extractInterlinearWords(text, 1)
        expect(words).toHaveLength(2)
        expect(words[0]).toMatchObject({ text: "In the beginning", strongs: ["H7225"] })
        expect(words[1]).toMatchObject({ text: "God created", strongs: ["H1254"], morph: "TH8804" })
    })

    it("parses inline brace markers and attaches them to the preceding word", () => {
        const words = extractInterlinearWords("In{H7225} the beginning God{H430}")
        expect(words.map((w) => w.text)).toEqual(["In", "the", "beginning", "God"])
        expect(words[0].strongs).toEqual(["H7225"])
        expect(words[3].strongs).toEqual(["H430"])
        expect(words[1].strongs).toBeUndefined()
    })

    it("parses <S> tag markers and infers the prefix from the book", () => {
        const ot = extractInterlinearWords("God<S>0430</S> created", 1)
        expect(ot.find((w) => w.text === "God")?.strongs).toEqual(["H430"])

        const nt = extractInterlinearWords("Word{3056}", 43)
        expect(nt[0].strongs).toEqual(["G3056"])
    })

    it("falls back to plain tokens when no tagging is present", () => {
        const words = extractInterlinearWords("For God so loved")
        expect(words).toHaveLength(4)
        expect(words.every((w) => !w.strongs)).toBe(true)
    })
})

describe("getInterlinearWords", () => {
    it("prefers pre-parsed words on the verse", () => {
        const verse = { text: "ignored", words: [{ text: "λόγος", strongs: ["G3056"] }] }
        expect(getInterlinearWords(verse)).toBe(verse.words)
    })
    it("derives words from the verse text when none are stored", () => {
        const words = getInterlinearWords({ text: "God{H430}" }, 1)
        expect(words[0].strongs).toEqual(["H430"])
    })
})

describe("hasStrongsTagging / stripStrongsMarkers", () => {
    it("detects tagging", () => {
        expect(hasStrongsTagging("God{H430}")).toBe(true)
        expect(hasStrongsTagging('<w lemma="strong:H430">God</w>')).toBe(true)
        expect(hasStrongsTagging("plain text")).toBe(false)
    })
    it("removes markers and tags", () => {
        expect(stripStrongsMarkers("In{H7225} the beginning God{H430}")).toBe("In the beginning God")
        expect(stripStrongsMarkers('<w lemma="strong:H7225">In the beginning</w>')).toBe("In the beginning")
        expect(stripStrongsMarkers("God<S>H430</S> created")).toBe("God created")
    })
    it("strips FreeShow red-letter delimiters but keeps the words", () => {
        expect(stripStrongsMarkers("!{For God so loved}! the world")).toBe("For God so loved the world")
    })
    it("unwraps tagged words but keeps other formatting (Jesus words)", () => {
        expect(unwrapTaggedWords('<w lemma="strong:H7225">In the beginning</w>')).toBe("In the beginning")
        expect(unwrapTaggedWords('<span class="wj">Truly{G281} I say</span>')).toBe('<span class="wj">Truly I say</span>')
    })

    // guards against shared module-level /g regex lastIndex state leaking between calls
    it("strips repeatedly and after exec-based parsing without regex state leakage", () => {
        const osis = '<w lemma="strong:H7225">In the beginning</w> <w lemma="strong:H1254">God created</w> <w lemma="strong:H8064">the heavens</w>'
        expect(stripStrongsMarkers(osis)).toBe("In the beginning God created the heavens")
        expect(stripStrongsMarkers(osis)).toBe(stripStrongsMarkers(osis))
        // interleave an exec-based parse (parseOsisWords) with replace-based strips
        expect(extractInterlinearWords(osis, 1)).toHaveLength(3)
        expect(stripStrongsMarkers(osis)).toBe("In the beginning God created the heavens")

        const inline = "In{H7225} the beginning God{H430} created{H1254} the heavens{H8064}"
        expect(stripStrongsMarkers(inline)).toBe("In the beginning God created the heavens")
        expect(stripStrongsMarkers(inline)).toBe(stripStrongsMarkers(inline))
    })
})

describe("Strong's lexicon", () => {
    const raw = {
        H430: { lemma: "אֱלֹהִים", xlit: "ʼĕlôhîym", pron: "el-o-heem'", derivation: "plural of H433", strongs_def: "gods in the ordinary sense", kjv_def: "angels, X exceeding, God" },
        G3056: { lemma: "λόγος", xlit: "lógos", pron: "log'-os", strongs_def: "something said", kjv_def: "account, cause, word" }
    }
    const lexicon = importStrongsLexicon(raw)

    it("imports OpenScriptures style entries", () => {
        expect(lexicon.H430).toMatchObject({ strongs: "H430", lemma: "אֱלֹהִים", translit: "ʼĕlôhîym", language: "hebrew", definition: "gods in the ordinary sense" })
        expect(lexicon.G3056.language).toBe("greek")
    })
    it("looks up entries tolerating un-normalized input", () => {
        expect(lookupStrongs(lexicon, "H0430")?.lemma).toBe("אֱלֹהִים")
        expect(lookupStrongs(lexicon, "g3056")?.lemma).toBe("λόγος")
        expect(lookupStrongs(lexicon, "3056", "G")?.lemma).toBe("λόγος")
        expect(lookupStrongs(lexicon, "9999")).toBeUndefined()
    })
})

describe("references", () => {
    it("parses free text references", () => {
        expect(parseReference("John 3:16")).toMatchObject({ book: 43, chapter: 3, verses: [16] })
        expect(parseReference("1 Cor 13:4-7")).toMatchObject({ book: 46, chapter: 13, verses: [4, 5, 6, 7] })
        expect(parseReference("Genesis 1")).toMatchObject({ book: 1, chapter: 1, verses: [] })
        expect(parseReference("Ps 23")?.book).toBe(19)
        expect(parseReference("not a reference")).toBeNull()
    })
    it("formats canonical locations", () => {
        expect(formatReference(43, 3, [16])).toBe("John 3:16")
        expect(formatReference(46, 13, [4, 5, 6, 7])).toBe("1 Corinthians 13:4-7")
        expect(formatReference(19, 23, [])).toBe("Psalms 23")
        expect(formatReference(43, 3, [16, 18])).toBe("John 3:16,18")
    })
})

describe("cross references", () => {
    it("converts OSIS references to canonical labels", () => {
        expect(osisRefToReference("John.3.16")).toEqual({ key: "43.3.16", ref: "John 3:16" })
        expect(osisRefToReference("John.1.1-John.1.3")).toEqual({ key: "43.1.1", ref: "John 1:1-3" })
        expect(osisRefToReference("garbage")).toBeNull()
    })

    it("imports the OpenBible TSV format sorted by votes", () => {
        const tsv = ["From Verse\tTo Verse\tVotes", "Gen.1.1\tHeb.11.3\t40", "Gen.1.1\tJohn.1.1-John.1.3\t72", "John.3.16\tRom.5.8\t30"].join("\n")
        const map = importCrossReferencesTSV(tsv)
        expect(map["1.1.1"]).toHaveLength(2)
        // highest votes first
        expect(map["1.1.1"][0].ref).toBe("John 1:1-3")
        expect(map["43.3.16"][0]).toMatchObject({ ref: "Romans 5:8", key: "45.5.8", votes: 30 })
    })

    it("imports a JSON format keyed by human references", () => {
        const map = importCrossReferencesJSON({ "John 3:16": ["Romans 5:8", "1 John 4:9"] })
        expect(map["43.3.16"]).toHaveLength(2)
        expect(map["43.3.16"][1].key).toBe("62.4.9")
    })

    it("limits results when requested", () => {
        const map = importCrossReferencesJSON({ "John 3:16": ["Romans 5:8", "1 John 4:9", "John 1:14"] })
        expect(getCrossReferences(map, "43.3.16", 2)).toHaveLength(2)
        expect(getCrossReferences(map, "missing")).toEqual([])
    })
})

describe("bible search", () => {
    const bible = {
        books: [
            {
                number: 1,
                name: "Genesis",
                chapters: [
                    {
                        number: 1,
                        verses: [
                            { number: 1, text: "In{H7225} the beginning God{H430} created the heaven and the earth." },
                            { number: 2, text: "And the earth{H776} was without form, and void." }
                        ]
                    }
                ]
            }
        ]
    }

    it("finds verses by Strong's number (concordance)", () => {
        const results = searchStrongsInBible(bible, "H430")
        expect(results).toHaveLength(1)
        expect(results[0]).toMatchObject({ reference: "Genesis 1:1", key: "1.1.1" })
        expect(results[0].text).toBe("In the beginning God created the heaven and the earth.")
    })

    it("finds verses by keyword", () => {
        const results = searchTextInBible(bible, "earth")
        expect(results).toHaveLength(2)
        const single = searchTextInBible(bible, "without form")
        expect(single).toHaveLength(1)
        expect(single[0].reference).toBe("Genesis 1:2")
    })
})

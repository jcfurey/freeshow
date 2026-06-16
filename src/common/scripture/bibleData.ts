// ----- FreeShow -----
// Canonical Bible book data shared by the Advanced Bible Engine.
// Provides a stable mapping between book numbers, English names, OSIS ids and common
// abbreviations so that references and cross references can be parsed and normalized
// independently of any particular Bible translation's naming.

export interface CanonicalBook {
    number: number // canonical book number (1-66)
    osis: string // OSIS identifier (e.g. "Gen", "1Cor")
    name: string // English name
    testament: "old" | "new"
    abbreviations: string[] // lowercase, punctuation-free aliases used for matching
}

// prettier-ignore
export const canonicalBooks: CanonicalBook[] = [
    { number: 1, osis: "Gen", name: "Genesis", testament: "old", abbreviations: ["gen", "ge", "gn"] },
    { number: 2, osis: "Exod", name: "Exodus", testament: "old", abbreviations: ["exod", "exo", "ex"] },
    { number: 3, osis: "Lev", name: "Leviticus", testament: "old", abbreviations: ["lev", "le", "lv"] },
    { number: 4, osis: "Num", name: "Numbers", testament: "old", abbreviations: ["num", "nu", "nm", "nb"] },
    { number: 5, osis: "Deut", name: "Deuteronomy", testament: "old", abbreviations: ["deut", "deu", "dt"] },
    { number: 6, osis: "Josh", name: "Joshua", testament: "old", abbreviations: ["josh", "jos", "jsh"] },
    { number: 7, osis: "Judg", name: "Judges", testament: "old", abbreviations: ["judg", "jdg", "jg", "jdgs"] },
    { number: 8, osis: "Ruth", name: "Ruth", testament: "old", abbreviations: ["ruth", "rut", "rth"] },
    { number: 9, osis: "1Sam", name: "1 Samuel", testament: "old", abbreviations: ["1sam", "1sa", "1s", "1samuel", "isam"] },
    { number: 10, osis: "2Sam", name: "2 Samuel", testament: "old", abbreviations: ["2sam", "2sa", "2s", "2samuel", "iisam"] },
    { number: 11, osis: "1Kgs", name: "1 Kings", testament: "old", abbreviations: ["1kgs", "1ki", "1k", "1kings", "ikgs"] },
    { number: 12, osis: "2Kgs", name: "2 Kings", testament: "old", abbreviations: ["2kgs", "2ki", "2k", "2kings", "iikgs"] },
    { number: 13, osis: "1Chr", name: "1 Chronicles", testament: "old", abbreviations: ["1chr", "1ch", "1chron", "1chronicles"] },
    { number: 14, osis: "2Chr", name: "2 Chronicles", testament: "old", abbreviations: ["2chr", "2ch", "2chron", "2chronicles"] },
    { number: 15, osis: "Ezra", name: "Ezra", testament: "old", abbreviations: ["ezra", "ezr", "ez"] },
    { number: 16, osis: "Neh", name: "Nehemiah", testament: "old", abbreviations: ["neh", "ne"] },
    { number: 17, osis: "Esth", name: "Esther", testament: "old", abbreviations: ["esth", "est", "es"] },
    { number: 18, osis: "Job", name: "Job", testament: "old", abbreviations: ["job", "jb"] },
    { number: 19, osis: "Ps", name: "Psalms", testament: "old", abbreviations: ["ps", "psa", "psalm", "psalms", "psm", "pss"] },
    { number: 20, osis: "Prov", name: "Proverbs", testament: "old", abbreviations: ["prov", "pro", "pr", "prv"] },
    { number: 21, osis: "Eccl", name: "Ecclesiastes", testament: "old", abbreviations: ["eccl", "ecc", "ec", "qoh"] },
    { number: 22, osis: "Song", name: "Song of Solomon", testament: "old", abbreviations: ["song", "sng", "so", "sos", "canticles", "songofsongs", "songofsolomon"] },
    { number: 23, osis: "Isa", name: "Isaiah", testament: "old", abbreviations: ["isa", "is"] },
    { number: 24, osis: "Jer", name: "Jeremiah", testament: "old", abbreviations: ["jer", "je", "jr"] },
    { number: 25, osis: "Lam", name: "Lamentations", testament: "old", abbreviations: ["lam", "la"] },
    { number: 26, osis: "Ezek", name: "Ezekiel", testament: "old", abbreviations: ["ezek", "eze", "ezk"] },
    { number: 27, osis: "Dan", name: "Daniel", testament: "old", abbreviations: ["dan", "da", "dn"] },
    { number: 28, osis: "Hos", name: "Hosea", testament: "old", abbreviations: ["hos", "ho"] },
    { number: 29, osis: "Joel", name: "Joel", testament: "old", abbreviations: ["joel", "joe", "jl"] },
    { number: 30, osis: "Amos", name: "Amos", testament: "old", abbreviations: ["amos", "amo", "am"] },
    { number: 31, osis: "Obad", name: "Obadiah", testament: "old", abbreviations: ["obad", "oba", "ob"] },
    { number: 32, osis: "Jonah", name: "Jonah", testament: "old", abbreviations: ["jonah", "jon", "jnh"] },
    { number: 33, osis: "Mic", name: "Micah", testament: "old", abbreviations: ["mic", "mc"] },
    { number: 34, osis: "Nah", name: "Nahum", testament: "old", abbreviations: ["nah", "na"] },
    { number: 35, osis: "Hab", name: "Habakkuk", testament: "old", abbreviations: ["hab", "hb"] },
    { number: 36, osis: "Zeph", name: "Zephaniah", testament: "old", abbreviations: ["zeph", "zep", "zp"] },
    { number: 37, osis: "Hag", name: "Haggai", testament: "old", abbreviations: ["hag", "hg"] },
    { number: 38, osis: "Zech", name: "Zechariah", testament: "old", abbreviations: ["zech", "zec", "zc"] },
    { number: 39, osis: "Mal", name: "Malachi", testament: "old", abbreviations: ["mal", "ml"] },
    { number: 40, osis: "Matt", name: "Matthew", testament: "new", abbreviations: ["matt", "mat", "mt"] },
    { number: 41, osis: "Mark", name: "Mark", testament: "new", abbreviations: ["mark", "mrk", "mk", "mr"] },
    { number: 42, osis: "Luke", name: "Luke", testament: "new", abbreviations: ["luke", "luk", "lk"] },
    { number: 43, osis: "John", name: "John", testament: "new", abbreviations: ["john", "joh", "jhn", "jn"] },
    { number: 44, osis: "Acts", name: "Acts", testament: "new", abbreviations: ["acts", "act", "ac"] },
    { number: 45, osis: "Rom", name: "Romans", testament: "new", abbreviations: ["rom", "ro", "rm"] },
    { number: 46, osis: "1Cor", name: "1 Corinthians", testament: "new", abbreviations: ["1cor", "1co", "1corinthians", "icor"] },
    { number: 47, osis: "2Cor", name: "2 Corinthians", testament: "new", abbreviations: ["2cor", "2co", "2corinthians", "iicor"] },
    { number: 48, osis: "Gal", name: "Galatians", testament: "new", abbreviations: ["gal", "ga"] },
    { number: 49, osis: "Eph", name: "Ephesians", testament: "new", abbreviations: ["eph", "ephes"] },
    { number: 50, osis: "Phil", name: "Philippians", testament: "new", abbreviations: ["phil", "php", "pp"] },
    { number: 51, osis: "Col", name: "Colossians", testament: "new", abbreviations: ["col", "co"] },
    { number: 52, osis: "1Thess", name: "1 Thessalonians", testament: "new", abbreviations: ["1thess", "1th", "1thes", "1thessalonians", "ithess"] },
    { number: 53, osis: "2Thess", name: "2 Thessalonians", testament: "new", abbreviations: ["2thess", "2th", "2thes", "2thessalonians", "iithess"] },
    { number: 54, osis: "1Tim", name: "1 Timothy", testament: "new", abbreviations: ["1tim", "1ti", "1timothy", "itim"] },
    { number: 55, osis: "2Tim", name: "2 Timothy", testament: "new", abbreviations: ["2tim", "2ti", "2timothy", "iitim"] },
    { number: 56, osis: "Titus", name: "Titus", testament: "new", abbreviations: ["titus", "tit", "ti"] },
    { number: 57, osis: "Phlm", name: "Philemon", testament: "new", abbreviations: ["phlm", "phm", "philem", "pm"] },
    { number: 58, osis: "Heb", name: "Hebrews", testament: "new", abbreviations: ["heb", "hbr"] },
    { number: 59, osis: "Jas", name: "James", testament: "new", abbreviations: ["jas", "jam", "jm"] },
    { number: 60, osis: "1Pet", name: "1 Peter", testament: "new", abbreviations: ["1pet", "1pe", "1pt", "1peter", "ipet"] },
    { number: 61, osis: "2Pet", name: "2 Peter", testament: "new", abbreviations: ["2pet", "2pe", "2pt", "2peter", "iipet"] },
    { number: 62, osis: "1John", name: "1 John", testament: "new", abbreviations: ["1john", "1jn", "1jo", "1joh", "ijohn"] },
    { number: 63, osis: "2John", name: "2 John", testament: "new", abbreviations: ["2john", "2jn", "2jo", "2joh", "iijohn"] },
    { number: 64, osis: "3John", name: "3 John", testament: "new", abbreviations: ["3john", "3jn", "3jo", "3joh", "iiijohn"] },
    { number: 65, osis: "Jude", name: "Jude", testament: "new", abbreviations: ["jude", "jud", "jd"] },
    { number: 66, osis: "Rev", name: "Revelation", testament: "new", abbreviations: ["rev", "re", "rv", "apocalypse", "revelations"] }
]

// Fast lookup maps (built once).
const byNumber = new Map<number, CanonicalBook>()
const byOsis = new Map<string, CanonicalBook>()
const byAlias = new Map<string, CanonicalBook>()

for (const book of canonicalBooks) {
    byNumber.set(book.number, book)
    byOsis.set(book.osis.toLowerCase(), book)

    // index full name, OSIS id and every abbreviation
    byAlias.set(normalizeBookToken(book.name), book)
    byAlias.set(normalizeBookToken(book.osis), book)
    for (const abbr of book.abbreviations) byAlias.set(abbr, book)
}

// Lowercase a book token and strip spaces/periods so "1 Cor.", "1cor" and "1 Corinthians" all match.
// Roman numeral prefixes (I/II/III) are handled via the explicit alias lists on each book rather
// than by a blanket replacement, which would otherwise corrupt names like "Isaiah".
export function normalizeBookToken(token: string): string {
    return token.toLowerCase().replace(/\./g, "").replace(/\s+/g, "")
}

export function getBookByNumber(number: number): CanonicalBook | undefined {
    return byNumber.get(number)
}

export function getBookByOsis(osis: string): CanonicalBook | undefined {
    return byOsis.get(osis.toLowerCase())
}

// Resolve a free-text book token ("Jn", "1 John", "Genesis", "Gen") to a canonical book.
export function resolveBook(token: string): CanonicalBook | undefined {
    if (!token) return undefined
    const normalized = normalizeBookToken(token)
    const direct = byAlias.get(normalized)
    if (direct) return direct

    // fallback: convert a leading roman numeral (i/ii/iii) to 1/2/3 and retry (e.g. "II Corinthians")
    const roman = normalized.match(/^(i{1,3})([a-z].*)$/)
    if (roman) {
        const retry = byAlias.get(`${roman[1].length}${roman[2]}`)
        if (retry) return retry
    }

    // try matching by canonical number passed as a string
    const asNumber = Number(token)
    if (Number.isInteger(asNumber) && byNumber.has(asNumber)) return byNumber.get(asNumber)

    return undefined
}

export function getBookName(number: number): string {
    return byNumber.get(number)?.name || ""
}

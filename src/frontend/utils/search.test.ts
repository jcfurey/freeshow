import { beforeEach, describe, expect, it, vi } from "vitest"

// search.ts pulls in stores + heavy collaborators; stub them so the pure scorer can run.
const h = vi.hoisted(() => {
    const makeStore = (initial: unknown) => {
        let value = initial
        return { _set: (v: unknown) => (value = v), subscribe: (fn: (v: unknown) => void) => (fn(value), () => {}) }
    }
    return { textCache: makeStore({}), categories: makeStore({}), drawerTabsData: makeStore({}) }
})
vi.mock("../stores", () => ({ textCache: h.textCache, categories: h.categories, drawerTabsData: h.drawerTabsData }))
vi.mock("../components/helpers/array", () => ({
    sortObjectNumbers: (arr: any[], key: string, desc = false) => [...arr].sort((a, b) => (desc ? (b[key] || 0) - (a[key] || 0) : (a[key] || 0) - (b[key] || 0)))
}))
vi.mock("../converters/txt", () => ({ similarity: (a: string, b: string) => (a === b ? 1 : 0) }))

import { formatSearch, showSearch, showSearchFilter } from "./search"

const shows = [
    { id: "amazing", name: "Amazing Grace" },
    { id: "gracealone", name: "Grace Alone" },
    { id: "great", name: "How Great Thou Art" },
    { id: "mp", name: "Blessed Be", quickAccess: { number: "MP133" } }
] as any

const ids = (results: any[]) => results.map((r) => r.id)

describe("formatSearch", () => {
    it("lowercases and strips punctuation + diacritics", () => {
        expect(formatSearch("Café, Réal!")).toBe("cafe real")
    })
    it("optionally removes spaces", () => {
        expect(formatSearch("amazing grace", true)).toBe("amazinggrace")
    })
    it("returns empty string for non-strings", () => {
        expect(formatSearch(undefined as unknown as string)).toBe("")
    })
})

describe("showSearchFilter", () => {
    beforeEach(() => h.textCache._set({}))

    it("scores an exact title match 100", () => {
        expect(showSearchFilter("Amazing Grace", shows[0])).toBe(100)
    })
    it("scores a title starts-with match 100", () => {
        expect(showSearchFilter("amaz", shows[0])).toBe(100)
    })
    it("scores a song-number exact match 100", () => {
        expect(showSearchFilter("mp133", shows[3])).toBe(100)
    })
    it("ranks a title-word hit above a content-only hit", () => {
        h.textCache._set({ great: "amazing love how can it be" })
        const titleHit = showSearchFilter("amazing", shows[0]) // word in the title
        const contentHit = showSearchFilter("amazing", shows[2]) // word only in content
        expect(contentHit).toBeGreaterThan(0)
        expect(titleHit).toBeGreaterThan(contentHit)
    })
    it("returns 0 for no match", () => {
        expect(showSearchFilter("xylophone", shows[0])).toBe(0)
    })
    it("ignores empty / punctuation-only queries (no match-everything bug)", () => {
        expect(showSearchFilter("", shows[0])).toBe(0)
        expect(showSearchFilter("!!!", shows[0])).toBe(0)
    })
})

describe("showSearch ranking", () => {
    beforeEach(() => h.textCache._set({}))

    it("ranks a show containing ALL query words above one with only some (multi-word)", () => {
        const res = showSearch("amazing grace", shows)
        expect(ids(res)[0]).toBe("amazing")
        expect(ids(res)).toContain("gracealone")
        expect(ids(res).indexOf("amazing")).toBeLessThan(ids(res).indexOf("gracealone"))
    })
    it("finds a show by lyric content when the title doesn't match", () => {
        h.textCache._set({ great: "thou my everlasting portion more than friend or life to me" })
        const res = showSearch("everlasting portion", shows)
        expect(ids(res)[0]).toBe("great")
    })
    it("excludes non-matching shows", () => {
        const res = showSearch("zzz nonexistent", shows)
        expect(res.some((r) => r.id === "amazing")).toBe(false)
    })
    it("normalizes the top match to 100", () => {
        const res = showSearch("grace", shows)
        expect(res[0].match).toBe(100)
    })
})

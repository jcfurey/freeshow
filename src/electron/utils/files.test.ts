import { describe, expect, it, vi } from "vitest"

// files.ts pulls in electron + the main-process module tree; stub every collaborator so the pure name sanitizer can load.
vi.mock("electron", () => ({ app: { getPath: () => "", getName: () => "FreeShow", getAppPath: () => "", on: () => {} }, dialog: {}, shell: {} }))
vi.mock("exif", () => ({ ExifImage: class {} }))
vi.mock("../data/media", () => ({ imageExtensions: [], mimeTypes: {}, videoExtensions: [] }))
vi.mock("../data/store", () => ({ _store: {}, appDataPath: "", config: { get: () => undefined, set: () => {} }, getStore: () => ({}), setStore: () => {}, setStoreValue: () => {} }))
vi.mock("../data/thumbnails", () => ({ createThumbnail: () => "", doesMediaExist: () => false, filePathHashCode: () => 0 }))
vi.mock("../IPC/main", () => ({ sendMain: () => {}, sendToMain: () => {} }))
vi.mock("../output/OutputHelper", () => ({ OutputHelper: {} }))
vi.mock("../index", () => ({ mainWindow: {}, setAutoProfile: () => {}, toApp: () => {} }))
vi.mock("./shows", () => ({ getAllShows: () => ({}), trimShow: (show: unknown) => show }))

import { sanitizeFileName } from "./files"

describe("sanitizeFileName", () => {
    it("removes filesystem-reserved characters", () => {
        expect(sanitizeFileName("my:file/name?.txt")).toBe("myfilename.txt")
        expect(sanitizeFileName('a<b>c"d|e*f')).toBe("abcdef")
    })

    it("strips ASCII control characters", () => {
        const withControls = "a" + String.fromCharCode(0) + "b" + String.fromCharCode(31) + "c"
        expect(sanitizeFileName(withControls)).toBe("abc")
    })

    it("collapses runs of whitespace and trims", () => {
        expect(sanitizeFileName("  hello   world  ")).toBe("hello world")
    })

    it("removes trailing dots and spaces (Windows disallows them)", () => {
        expect(sanitizeFileName("file...")).toBe("file")
        expect(sanitizeFileName("name. . ")).toBe("name")
    })

    it("leaves no path separators, so a traversal name can't escape", () => {
        const out = sanitizeFileName("../../etc/passwd")
        expect(out).not.toContain("/")
        expect(out).not.toContain("\\")
    })

    it("returns empty string for empty or non-string input", () => {
        expect(sanitizeFileName("")).toBe("")
        expect(sanitizeFileName(null as unknown as string)).toBe("")
        expect(sanitizeFileName(123 as unknown as string)).toBe("")
    })
})

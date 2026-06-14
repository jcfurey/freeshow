import { describe, expect, it, vi } from "vitest"

// zip.ts imports electron-touching collaborators; stub them so the pure path sanitizer can load under the node env.
vi.mock("../IPC/main", () => ({ sendToMain: () => {}, sendMain: () => {} }))
vi.mock("../utils/files", () => ({ getExtension: (name: string) => name.split(".").pop() || "" }))

import { sanitizeZipPath } from "./zip"

describe("sanitizeZipPath (zip-slip guard)", () => {
    it("strips parent-directory traversal segments", () => {
        expect(sanitizeZipPath("../../etc/passwd")).toBe("etc/passwd")
        expect(sanitizeZipPath("foo/../../bar")).toBe("foo/bar")
    })

    it("drops leading slashes / absolute paths", () => {
        expect(sanitizeZipPath("/abs/path/x")).toBe("abs/path/x")
    })

    it("normalizes backslashes to forward slashes", () => {
        expect(sanitizeZipPath("a\\b\\c")).toBe("a/b/c")
        expect(sanitizeZipPath("..\\..\\windows\\system32")).toBe("windows/system32")
    })

    it("removes current-directory segments", () => {
        expect(sanitizeZipPath("./x")).toBe("x")
        expect(sanitizeZipPath("a/./b")).toBe("a/b")
    })

    it("preserves legitimate nested paths", () => {
        expect(sanitizeZipPath("ppt/media/image1.png")).toBe("ppt/media/image1.png")
    })

    it("returns empty string for empty or dot-only input", () => {
        expect(sanitizeZipPath("")).toBe("")
        expect(sanitizeZipPath("../..")).toBe("")
    })
})

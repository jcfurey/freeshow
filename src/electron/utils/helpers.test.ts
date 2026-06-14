import { describe, it, expect, vi } from "vitest"
import { checkIfMatching, clone, resolveMachineId, wait } from "./helpers"

describe("electron helpers", () => {
    describe("clone", () => {
        it("deep-clones objects (no shared references)", () => {
            const original = { a: 1, nested: { b: [1, 2, 3] } }
            const copy = clone(original)
            expect(copy).toEqual(original)
            expect(copy).not.toBe(original)
            copy.nested.b.push(4)
            expect(original.nested.b).toEqual([1, 2, 3])
        })
        it("returns primitives and null unchanged", () => {
            expect(clone(5)).toBe(5)
            expect(clone("x")).toBe("x")
            expect(clone(null)).toBe(null)
        })
    })

    describe("checkIfMatching", () => {
        it("treats objects with the same content but different key order as equal", () => {
            expect(checkIfMatching({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
            expect(checkIfMatching({ x: { p: 1, q: 2 } }, { x: { q: 2, p: 1 } })).toBe(true)
        })
        it("detects differing values", () => {
            expect(checkIfMatching({ a: 1 }, { a: 2 })).toBe(false)
        })
        it("is order-sensitive for arrays (slide order matters)", () => {
            expect(checkIfMatching({ a: [1, 2] }, { a: [2, 1] })).toBe(false)
            expect(checkIfMatching({ a: [1, 2] }, { a: [1, 2] })).toBe(true)
        })
        it("returns false for non-objects", () => {
            expect(checkIfMatching(null, { a: 1 })).toBe(false)
            expect(checkIfMatching("a", "a")).toBe(false)
        })
    })

    describe("wait", () => {
        it("resolves after the given delay", async () => {
            await expect(wait(1)).resolves.toBe("ended")
        })
    })

    describe("resolveMachineId", () => {
        it("returns the stored machine id when present (no hardware lookup)", () => {
            const set = vi.fn()
            const getHardwareId = vi.fn()
            expect(resolveMachineId({ get: () => "stored-id", set }, getHardwareId)).toBe("stored-id")
            expect(getHardwareId).not.toHaveBeenCalled()
            expect(set).not.toHaveBeenCalled()
        })

        it("falls back to the hardware id and persists it", () => {
            const set = vi.fn()
            expect(resolveMachineId({ get: () => undefined, set }, () => "hw-id")).toBe("hw-id")
            expect(set).toHaveBeenCalledWith("machineId", "hw-id")
        })

        it("generates a per-process UUID when the hardware id is unavailable, and persists it", () => {
            const set = vi.fn()
            const id = resolveMachineId({ get: () => undefined, set }, () => {
                throw new Error("no machine id")
            })
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
            expect(set).toHaveBeenCalledWith("machineId", id)
        })

        it("still resolves an id when no config store is available", () => {
            expect(resolveMachineId(undefined, () => "hw-id")).toBe("hw-id")
        })
    })
})

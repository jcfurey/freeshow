import crypto from "crypto"

// clone objects
export function clone<T>(object: T): T {
    if (object === null || typeof object !== "object") return object

    try {
        return structuredClone(object)
    } catch {
        return object
    }
}

// keys might not be placed in the same order in JS object vs store file, so compare with key order normalized at every level
function stableStringify(value: any): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value)
    if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]" // preserve array order (e.g. slide order)
    return (
        "{" +
        Object.keys(value)
            .sort()
            .map((key) => JSON.stringify(key) + ":" + stableStringify(value[key]))
            .join(",") +
        "}"
    )
}
export function checkIfMatching(a: any, b: any): boolean {
    try {
        if (!a || !b || typeof a !== "object" || typeof b !== "object") return false
        return stableStringify(a) === stableStringify(b)
    } catch (err) {
        console.warn("Failed to compare store data:", err)
        return false
    }
}

// async wait (instead of timeouts)
export function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("ended")
        }, Number(ms))
    })
}

// wait until input value is true
export function waitUntilValueIsDefined(value: () => any, intervalTime = 50, timeoutValue = 5000) {
    return new Promise((resolve) => {
        let currentValue = value()
        if (currentValue) resolve(currentValue)

        const timeout = setTimeout(() => {
            exit()
            resolve(null)
        }, timeoutValue)

        const interval = setInterval(() => {
            currentValue = value()
            if (!currentValue) return

            exit()
            resolve(currentValue)
        }, intervalTime)

        function exit() {
            clearTimeout(timeout)
            clearInterval(interval)
        }
    })
}

type MachineIdConfig = { get(key: string): string | undefined; set(key: string, value: string): void } | undefined

// Pure, testable core: resolve (and persist) the machine id from its collaborators.
// Extracted from getMachineId so it can be unit-tested without the lazy require()s.
export function resolveMachineId(config: MachineIdConfig, getHardwareId: () => string): string {
    const stored = config?.get ? config.get("machineId") : undefined
    if (stored) return stored

    let id: string
    try {
        // we need to store this value for now, because it's already used, but we can remove eventually once it's stored in the config for most users
        id = getHardwareId()
    } catch (machineIdErr) {
        console.warn("Could not retrieve legacy hardware machine ID, generating UUID instead:", machineIdErr)
        id = crypto.randomUUID()
    }

    if (config?.set) config.set("machineId", id)
    return id
}

export function getMachineId(): string {
    try {
        const { config } = require("../data/store")
        return resolveMachineId(config, () => require("node-machine-id").machineIdSync())
    } catch (err) {
        console.warn("Could not get machine ID from config store:", err)
        // avoid a shared constant: a fixed string would make every failing device share one identity,
        // corrupting cloud-sync change tracking. Use a per-process random UUID instead.
        if (!fallbackMachineId) fallbackMachineId = crypto.randomUUID()
        return fallbackMachineId
    }
}
let fallbackMachineId = ""

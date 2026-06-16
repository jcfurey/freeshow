import { get } from "svelte/store"
import { showsCache, special } from "../../stores"

// A Bible-sourced show's verse text is protected (read-only) when global scripture
// protection is enabled and the show hasn't been explicitly unlocked. Used to gate the
// imperative text-mutation paths (format actions, find & replace, API text setters) so
// they can't alter downloaded/API scripture. Styling/layout are intentionally NOT gated.
export function isScriptureTextLocked(showId: string | undefined | null): boolean {
    if (!showId) return false
    const show = get(showsCache)[showId]
    if (show?.reference?.type !== "scripture") return false
    return get(special).protectScriptureText !== false && !show.unlockedScriptureText
}

<script lang="ts">
    import { createEventDispatcher, onDestroy } from "svelte"
    import type { StudyNote } from "../../../../types/BibleStudy"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"

    export let reference = ""
    export let noteKey = ""
    export let note: StudyNote | undefined = undefined

    const dispatch = createEventDispatcher()

    let text = ""
    let editingKey = "" // the verse key the current `text` belongs to
    let editingReference = ""
    let savedText = "" // last persisted value, to avoid redundant saves
    let saveTimeout: ReturnType<typeof setTimeout> | null = null

    // When the selected verse changes, flush the previous edit BEFORE loading the new note,
    // so unsaved edits are never overwritten/lost when navigating between verses.
    $: if (noteKey !== editingKey) switchVerse(noteKey, reference)

    function switchVerse(newKey: string, newReference: string) {
        flush()
        editingKey = newKey
        editingReference = newReference
        text = note?.text || ""
        savedText = text
    }

    function scheduleSave() {
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(flush, 400)
    }

    // Persist the current edit (only if changed) to the verse it actually belongs to.
    function flush() {
        if (saveTimeout) {
            clearTimeout(saveTimeout)
            saveTimeout = null
        }
        if (!editingKey || text === savedText) return
        savedText = text
        dispatch("save", { key: editingKey, reference: editingReference, text })
    }

    // catch edits that weren't blurred (e.g. closing the overlay or switching tabs)
    onDestroy(flush)
</script>

<div class="notes">
    <textarea class="edit" bind:value={text} on:input={scheduleSave} on:blur={flush} placeholder="" spellcheck="true"></textarea>
    <div class="actions">
        {#if note?.modified}
            <span class="saved"><T id="bible_study.note_saved" /></span>
        {/if}
        <MaterialButton variant="contained" icon="save" style="margin-left: auto;" on:click={flush}>
            <T id="actions.save" />
        </MaterialButton>
    </div>
</div>

<style>
    .notes {
        padding: 10px;
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 8px;
    }
    textarea {
        flex: 1;
        min-height: 220px;
        resize: vertical;
        background-color: var(--primary-darkest);
        color: var(--text);
        border: 1px solid var(--primary-lighter);
        border-radius: 4px;
        padding: 10px;
        font-family: inherit;
        font-size: 0.95em;
        line-height: 1.5;
    }
    textarea:focus {
        outline: none;
        border-color: var(--secondary);
    }
    .actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .saved {
        font-size: 0.8em;
        opacity: 0.5;
    }
</style>

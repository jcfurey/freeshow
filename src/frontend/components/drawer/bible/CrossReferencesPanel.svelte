<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { parseVerseKey } from "../../../../common/scripture/bibleStudy"
    import type { CrossReference } from "../../../../types/BibleStudy"
    import T from "../../helpers/T.svelte"

    export let references: CrossReference[] = []
    export let hasData = false

    const dispatch = createEventDispatcher()

    function go(ref: CrossReference) {
        const parsed = parseVerseKey(ref.key)
        if (!parsed) return
        dispatch("navigate", { book: parsed.book, chapter: parsed.chapter, verse: parsed.verse })
    }
</script>

<div class="cross-refs">
    {#if !hasData}
        <p class="message"><T id="bible_study.no_cross_reference_data" /></p>
    {:else if !references.length}
        <p class="message"><T id="bible_study.no_cross_references" /></p>
    {:else}
        {#each references as ref}
            <button class="ref" on:click={() => go(ref)}>
                <span class="ref-label">{ref.ref}</span>
                {#if ref.votes}<span class="votes" title="Relevance">{ref.votes}</span>{/if}
            </button>
        {/each}
    {/if}
</div>

<style>
    .cross-refs {
        padding: 8px;
        display: flex;
        flex-direction: column;
    }
    .ref {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--primary-lighter);
        color: var(--text);
        padding: 9px 10px;
        cursor: pointer;
        text-align: start;
    }
    .ref:hover {
        background-color: var(--primary-lighter);
    }
    .ref-label {
        color: var(--secondary);
        font-weight: bold;
    }
    .votes {
        font-size: 0.75em;
        opacity: 0.5;
        background-color: var(--primary-darkest);
        border-radius: 8px;
        padding: 1px 7px;
    }
    .message {
        padding: 20px;
        opacity: 0.5;
        font-style: italic;
        text-align: center;
    }
</style>

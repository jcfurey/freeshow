<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { lookupStrongs, normalizeStrongs } from "../../../../common/scripture/bibleStudy"
    import type { BibleStudySettings, InterlinearWord, StrongsLexicon } from "../../../../types/BibleStudy"

    export let words: InterlinearWord[] = []
    export let lexicon: StrongsLexicon = {}
    export let settings: BibleStudySettings
    export let selectedStrongs = ""
    export let rtl = false

    const dispatch = createEventDispatcher()

    $: normalizedSelected = selectedStrongs ? normalizeStrongs(selectedStrongs) : ""

    function primaryStrongs(word: InterlinearWord): string {
        return word.strongs?.[0] ? normalizeStrongs(word.strongs[0]) : ""
    }

    function isSelected(word: InterlinearWord): boolean {
        if (!normalizedSelected) return false
        return !!word.strongs?.some((s) => normalizeStrongs(s) === normalizedSelected)
    }

    function clickWord(word: InterlinearWord) {
        if (!word.strongs?.length) return
        dispatch("wordClick", { word, strongs: primaryStrongs(word) })
    }
</script>

<div class="interlinear" class:rtl style="flex-direction: {rtl ? 'row-reverse' : 'row'};">
    {#each words as word}
        {@const entry = word.strongs?.length ? lookupStrongs(lexicon, word.strongs[0]) : undefined}
        <div class="word" class:clickable={!!word.strongs?.length} class:selected={isSelected(word)} on:click={() => clickWord(word)} on:keydown={(e) => e.key === "Enter" && clickWord(word)} role="button" tabindex={word.strongs?.length ? 0 : -1}>
            {#if entry?.lemma}
                <span class="original" style="direction: {entry.language === 'hebrew' || entry.language === 'aramaic' ? 'rtl' : 'ltr'};">{entry.lemma}</span>
            {/if}
            {#if settings.showTransliteration && entry?.translit}
                <span class="translit">{entry.translit}</span>
            {/if}
            <span class="surface">{word.text}</span>
            {#if settings.showStrongs && word.strongs?.length}
                <span class="strongs">{word.strongs.map((s) => normalizeStrongs(s)).join(" ")}</span>
            {/if}
            {#if settings.showMorphology && word.morph}
                <span class="morph">{word.morph}</span>
            {/if}
        </div>
    {/each}
</div>

<style>
    .interlinear {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px;
        align-items: flex-end;
    }

    .word {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid transparent;
        min-width: 40px;
        text-align: center;
    }
    .word.clickable {
        cursor: pointer;
        background-color: rgb(0 0 0 / 0.15);
    }
    .word.clickable:hover {
        background-color: var(--primary-lighter);
        border-color: var(--primary-lighter);
    }
    .word.selected {
        background-color: var(--secondary);
        color: var(--secondary-text);
    }

    .original {
        font-size: 1.4em;
        line-height: 1.2;
    }
    .translit {
        font-size: 0.75em;
        font-style: italic;
        opacity: 0.8;
    }
    .surface {
        font-size: 0.95em;
    }
    .strongs {
        font-size: 0.7em;
        opacity: 0.7;
        color: var(--secondary);
    }
    .word.selected .strongs {
        color: var(--secondary-text);
    }
    .morph {
        font-size: 0.65em;
        opacity: 0.6;
        font-family: monospace;
    }
</style>

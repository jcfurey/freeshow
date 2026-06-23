<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { normalizeStrongs } from "../../../../common/scripture/bibleStudy"
    import type { StrongsEntry } from "../../../../types/BibleStudy"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"

    export let strongs = ""
    export let entry: StrongsEntry | undefined = undefined

    const dispatch = createEventDispatcher()
    $: normalized = strongs ? normalizeStrongs(strongs) : ""
</script>

<div class="strongs-entry">
    {#if !normalized}
        <p class="empty"><T id="bible_study.click_word_hint" /></p>
    {:else}
        <div class="header">
            <span class="number">{normalized}</span>
            {#if entry?.language}
                <span class="language">{entry.language}</span>
            {/if}
        </div>

        {#if entry}
            {#if entry.lemma}
                <div class="lemma" style="direction: {entry.language === 'hebrew' || entry.language === 'aramaic' ? 'rtl' : 'ltr'};">{entry.lemma}</div>
            {/if}
            {#if entry.translit || entry.pronounce}
                <div class="pronunciation">
                    {#if entry.translit}<span class="translit">{entry.translit}</span>{/if}
                    {#if entry.pronounce}<span class="pron">/{entry.pronounce}/</span>{/if}
                </div>
            {/if}
            {#if entry.partOfSpeech}
                <div class="row"><span class="label"><T id="bible_study.part_of_speech" /></span> {entry.partOfSpeech}</div>
            {/if}
            {#if entry.derivation}
                <div class="row"><span class="label"><T id="bible_study.derivation" /></span> {entry.derivation}</div>
            {/if}
            {#if entry.definition}
                <div class="row"><span class="label"><T id="bible_study.definition" /></span> {entry.definition}</div>
            {/if}
            {#if entry.kjvDefinition}
                <div class="row"><span class="label"><T id="bible_study.kjv_usage" /></span> {entry.kjvDefinition}</div>
            {/if}
        {:else}
            <p class="empty"><T id="bible_study.no_lexicon_entry" /></p>
        {/if}

        <MaterialButton variant="outlined" icon="search" style="margin-top: 12px;" on:click={() => dispatch("search", normalized)}>
            <T id="bible_study.find_all_occurrences" />
        </MaterialButton>
    {/if}
</div>

<style>
    .strongs-entry {
        padding: 12px;
        display: flex;
        flex-direction: column;
    }
    .header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
    }
    .number {
        font-size: 1.3em;
        font-weight: bold;
        color: var(--secondary);
    }
    .language {
        font-size: 0.75em;
        text-transform: uppercase;
        opacity: 0.6;
        border: 1px solid var(--primary-lighter);
        padding: 1px 6px;
        border-radius: 4px;
    }
    .lemma {
        font-size: 2em;
        margin: 4px 0;
    }
    .pronunciation {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        opacity: 0.85;
    }
    .translit {
        font-style: italic;
    }
    .pron {
        opacity: 0.7;
    }
    .row {
        margin: 5px 0;
        line-height: 1.45;
    }
    .label {
        font-weight: bold;
        opacity: 0.6;
        font-size: 0.85em;
        margin-right: 4px;
    }
    .empty {
        opacity: 0.5;
        font-style: italic;
        padding: 8px 0;
    }
</style>

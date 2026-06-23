<script lang="ts">
    import { importCrossReferencesJSON, importCrossReferencesTSV, importStrongsLexicon } from "../../../../common/scripture/bibleStudy"
    import { crossReferences, strongsLexicon } from "../../../stores"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"

    let lexiconStatus = ""
    let crossRefStatus = ""

    $: lexiconCount = Object.keys($strongsLexicon).length
    $: crossRefCount = Object.keys($crossReferences).length

    function readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result || ""))
            reader.onerror = () => reject(reader.error)
            reader.readAsText(file)
        })
    }

    async function importLexicon(e: Event) {
        const input = e.target as HTMLInputElement
        const files = Array.from(input.files || [])
        if (!files.length) return
        lexiconStatus = ""

        let added = 0
        for (const file of files) {
            try {
                const content = await readFile(file)
                const raw = JSON.parse(content)
                const imported = importStrongsLexicon(raw)
                const keys = Object.keys(imported)
                if (!keys.length) continue
                strongsLexicon.update((lex) => ({ ...lex, ...imported }))
                added += keys.length
            } catch (err) {
                console.error("Failed to import lexicon:", err)
                lexiconStatus = "bible_study.import_error"
            }
        }
        if (added) lexiconStatus = "bible_study.import_success"
        input.value = ""
    }

    async function importCrossRefs(e: Event) {
        const input = e.target as HTMLInputElement
        const files = Array.from(input.files || [])
        if (!files.length) return
        crossRefStatus = ""

        let added = 0
        for (const file of files) {
            try {
                const content = await readFile(file)
                const trimmed = content.trimStart()
                const imported = file.name.endsWith(".json") || trimmed.startsWith("{") ? importCrossReferencesJSON(JSON.parse(content)) : importCrossReferencesTSV(content)
                const keys = Object.keys(imported)
                if (!keys.length) continue
                crossReferences.update((refs) => ({ ...refs, ...imported }))
                added += keys.length
            } catch (err) {
                console.error("Failed to import cross references:", err)
                crossRefStatus = "bible_study.import_error"
            }
        }
        if (added) crossRefStatus = "bible_study.import_success"
        input.value = ""
    }

    function clearLexicon() {
        strongsLexicon.set({})
        lexiconStatus = ""
    }
    function clearCrossRefs() {
        crossReferences.set({})
        crossRefStatus = ""
    }
</script>

<div class="import-study">
    <p class="intro"><T id="bible_study.import_intro" /></p>

    <!-- STRONG'S LEXICON -->
    <div class="section">
        <h3><T id="bible_study.strongs_lexicon" /></h3>
        <p class="hint"><T id="bible_study.lexicon_hint" /></p>
        <div class="row">
            <label class="file-button">
                <input type="file" accept=".json" multiple on:change={importLexicon} />
                <T id="bible_study.choose_file" />
            </label>
            <span class="count"><T id="bible_study.entries_loaded" replace={[String(lexiconCount)]} /></span>
            {#if lexiconCount}
                <MaterialButton variant="text" red icon="delete" title="actions.delete" on:click={clearLexicon} />
            {/if}
        </div>
        {#if lexiconStatus}<p class="status"><T id={lexiconStatus} /></p>{/if}
    </div>

    <!-- CROSS REFERENCES -->
    <div class="section">
        <h3><T id="bible_study.cross_references" /></h3>
        <p class="hint"><T id="bible_study.cross_reference_hint" /></p>
        <div class="row">
            <label class="file-button">
                <input type="file" accept=".txt,.tsv,.json" multiple on:change={importCrossRefs} />
                <T id="bible_study.choose_file" />
            </label>
            <span class="count"><T id="bible_study.verses_loaded" replace={[String(crossRefCount)]} /></span>
            {#if crossRefCount}
                <MaterialButton variant="text" red icon="delete" title="actions.delete" on:click={clearCrossRefs} />
            {/if}
        </div>
        {#if crossRefStatus}<p class="status"><T id={crossRefStatus} /></p>{/if}
    </div>
</div>

<style>
    .import-study {
        display: flex;
        flex-direction: column;
        gap: 18px;
        min-width: 500px;
    }
    .intro {
        opacity: 0.7;
        line-height: 1.5;
    }
    .section {
        border: 1px solid var(--primary-lighter);
        border-radius: 6px;
        padding: 14px;
    }
    h3 {
        margin: 0 0 6px;
    }
    .hint {
        opacity: 0.6;
        font-size: 0.85em;
        margin-bottom: 10px;
        line-height: 1.4;
    }
    .row {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .file-button {
        background-color: var(--secondary);
        color: var(--secondary-text);
        padding: 8px 14px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
    }
    .file-button input {
        display: none;
    }
    .count {
        opacity: 0.7;
        font-size: 0.9em;
    }
    .status {
        margin-top: 8px;
        font-size: 0.85em;
        color: var(--secondary);
    }
</style>

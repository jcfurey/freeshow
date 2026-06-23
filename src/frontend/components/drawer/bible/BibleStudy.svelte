<script lang="ts">
    import { formatReference, getCrossReferences, getInterlinearWords, lookupStrongs, normalizeStrongs, parseReference, searchStrongsInBible, searchTextInBible, unwrapTaggedWords, verseKey } from "../../../../common/scripture/bibleStudy"
    import type { BibleStudySearchResult, InterlinearWord } from "../../../../types/BibleStudy"
    import { activePopup, bibleNotes, bibleStudySettings, bibleStudyState, crossReferences, scriptures, scripturesCache, strongsLexicon } from "../../../stores"
    import { translateText } from "../../../utils/language"
    import Icon from "../../helpers/Icon.svelte"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import Loader from "../../main/Loader.svelte"
    import Center from "../../system/Center.svelte"
    import { closeBibleStudy, ensureBibleLoaded, getBibleName, getBook, getChapter, getLocalBibleIds, getVerse, setStudyNote } from "./bibleStudyActions"
    import CrossReferencesPanel from "./CrossReferencesPanel.svelte"
    import Interlinear from "./Interlinear.svelte"
    import { formatBibleText } from "./scripture"
    import StrongsEntryView from "./StrongsEntryView.svelte"
    import StudyNotesPanel from "./StudyNotesPanel.svelte"

    // ----- navigation state -----
    let primaryBibleId = ""
    let bookNumber = 1
    let chapterNumber = 1
    let verseNumber = 1
    let comparisonVersions: string[] = []

    let rightTab: "interlinear" | "strongs" | "cross" | "notes" = "interlinear"
    let selectedStrongs = ""

    let searchQuery = ""
    let searchResults: BibleStudySearchResult[] = []
    let searchMessage = ""

    // ----- initialize when the overlay opens -----
    let initialized = false
    $: if ($bibleStudyState.active && !initialized) init()
    $: if (!$bibleStudyState.active) initialized = false

    function init() {
        initialized = true
        const locals = getLocalBibleIds()
        primaryBibleId = $bibleStudyState.bibleId && locals.includes($bibleStudyState.bibleId) ? $bibleStudyState.bibleId : $bibleStudySettings.primaryVersion && locals.includes($bibleStudySettings.primaryVersion) ? $bibleStudySettings.primaryVersion : locals[0] || ""
        bookNumber = $bibleStudyState.book || 1
        chapterNumber = $bibleStudyState.chapter || 1
        verseNumber = $bibleStudyState.verse || 1
        comparisonVersions = ($bibleStudySettings.parallelVersions || []).filter((id) => locals.includes(id) && id !== primaryBibleId)
        selectedStrongs = ""
        searchResults = []
        searchQuery = ""
        searchMessage = ""
    }

    // persist the chosen primary version for next time
    $: if (primaryBibleId && $bibleStudySettings.primaryVersion !== primaryBibleId) bibleStudySettings.update((s) => ({ ...s, primaryVersion: primaryBibleId }))

    // ----- derived data ----- ($scriptures / $scripturesCache references keep these reactive)
    $: localBibleIds = getLocalBibleIds($scriptures)
    $: bible = primaryBibleId ? $scripturesCache[primaryBibleId] || null : null
    $: book = getBook(bible, bookNumber)
    $: chapter = getChapter(book, chapterNumber)
    $: verses = chapter?.verses || []
    $: selectedVerseObj = getVerse(chapter, verseNumber)
    $: words = selectedVerseObj ? getInterlinearWords(selectedVerseObj, bookNumber) : []
    $: hasInterlinear = words.some((w) => !!w.strongs?.length)
    $: currentKey = verseKey(bookNumber, chapterNumber, verseNumber)
    $: reference = formatReference(bookNumber, chapterNumber, [verseNumber])
    $: crossRefs = getCrossReferences($crossReferences, currentKey)
    $: rtl = bookNumber <= 39 // Old Testament => Hebrew/Aramaic (right to left)
    $: strongsEntry = selectedStrongs ? lookupStrongs($strongsLexicon, selectedStrongs) : undefined
    $: note = $bibleNotes[currentKey]
    // load bible data on demand (FreeShow keeps local bibles out of memory until first used)
    let attempted: { [id: string]: boolean } = {}
    async function loadBible(id: string) {
        if (!id || attempted[id]) return
        await ensureBibleLoaded(id)
        attempted = { ...attempted, [id]: true }
    }
    $: if (primaryBibleId) loadBible(primaryBibleId)
    $: comparisonVersions.forEach((id) => loadBible(id))

    // spinner while loading; error once the load has been attempted but no data arrived
    $: loadingBible = !!primaryBibleId && !bible && !attempted[primaryBibleId]
    $: loadFailed = !!primaryBibleId && !bible && !!attempted[primaryBibleId]

    // Pre-compute the comparison versions' verse text for the current chapter ONCE (keyed by verse
    // number) instead of re-scanning each version per verse row.
    $: comparisonData = comparisonVersions.map((id) => {
        const verseMap: { [verseNumber: number]: string } = {}
        const compChapter = getChapter(getBook($scripturesCache[id] || null, bookNumber), chapterNumber)
        ;(compChapter?.verses || []).forEach((v) => (verseMap[Number(v.number)] = displayText(v.text)))
        return { id, name: getBibleName(id), verses: verseMap }
    })

    // strip Strong's/interlinear markup, then apply FreeShow's standard verse formatting
    // (red-letter !{...}! -> wj spans, markdown cleanup) so the study view matches the drawer
    function displayText(text?: string): string {
        return formatBibleText(unwrapTaggedWords(text || ""), true)
    }

    // FreeShow books may carry a customName override that isn't on the json-bible Book type
    function bookLabel(b: { customName?: string; name?: string }): string {
        return b?.customName || b?.name || ""
    }

    // ----- actions -----
    function selectVerse(n: number | string) {
        verseNumber = Number(n)
        selectedStrongs = ""
        if (rightTab === "strongs") rightTab = "interlinear"
    }

    // switch the primary version, dropping it from the comparison list so it isn't shown twice
    function changePrimary(id: string) {
        primaryBibleId = id
        if (comparisonVersions.includes(id)) comparisonVersions = comparisonVersions.filter((v) => v !== id)
    }

    function changeBook(n: number) {
        bookNumber = n
        chapterNumber = 1
        verseNumber = 1
        selectedStrongs = ""
    }

    function changeChapter(n: number) {
        chapterNumber = n
        verseNumber = 1
        selectedStrongs = ""
    }

    function stepChapter(dir: number) {
        const chapters = book?.chapters || []
        const index = chapters.findIndex((c) => Number(c.number) === Number(chapterNumber))
        const next = chapters[index + dir]
        if (next) changeChapter(Number(next.number))
    }

    function onWordClick(e: CustomEvent<{ word: InterlinearWord; strongs: string }>) {
        selectedStrongs = e.detail.strongs
        rightTab = "strongs"
    }

    function navigateTo(book: number, chapter: number, verse: number) {
        bookNumber = book
        chapterNumber = chapter
        verseNumber = verse
        selectedStrongs = ""
        searchResults = []
    }

    function onSearch() {
        searchMessage = ""
        searchResults = []
        const query = searchQuery.trim()
        if (!query) return

        // 1) direct reference -> jump
        const ref = parseReference(query)
        if (ref && ref.chapter) {
            navigateTo(ref.book, ref.chapter, ref.verses[0] || 1)
            return
        }

        if (!bible) return

        // 2) Strong's number -> concordance
        if (/^[HGhg]?\d{1,5}[a-z]?$/.test(query)) {
            searchResults = searchStrongsInBible(bible, query)
        } else {
            // 3) keyword search
            searchResults = searchTextInBible(bible, query)
        }

        if (!searchResults.length) searchMessage = "bible_study.no_results"
    }

    function searchStrongs(e: CustomEvent<string>) {
        const number = normalizeStrongs(e.detail)
        if (!bible || !number) return
        searchQuery = number
        searchResults = searchStrongsInBible(bible, number)
        searchMessage = searchResults.length ? "" : "bible_study.no_results"
    }

    function toggleComparison(id: string) {
        if (comparisonVersions.includes(id)) comparisonVersions = comparisonVersions.filter((v) => v !== id)
        else comparisonVersions = [...comparisonVersions, id]
        bibleStudySettings.update((s) => ({ ...s, parallelVersions: comparisonVersions }))
    }

    function keydown(e: KeyboardEvent) {
        if (!$bibleStudyState.active) return
        if (e.key === "Escape") {
            // if a popup is layered on top (e.g. the import dialog), let it close first
            if ($activePopup) return
            e.preventDefault()
            closeBibleStudy()
        }
    }
</script>

<svelte:window on:keydown={keydown} />

{#if $bibleStudyState.active}
    <div class="bible-study">
        <!-- HEADER -->
        <div class="header">
            <div class="title">
                <Icon id="book" size={1.3} white />
                <span><T id="bible_study.title" /></span>
            </div>

            {#if localBibleIds.length}
                <div class="nav">
                    <select class="select" value={bookNumber} on:change={(e) => changeBook(Number(e.currentTarget.value))}>
                        {#each bible?.books || [] as b}
                            <option value={b.number}>{bookLabel(b)}</option>
                        {/each}
                    </select>
                    <select class="select" value={chapterNumber} on:change={(e) => changeChapter(Number(e.currentTarget.value))}>
                        {#each book?.chapters || [] as c}
                            <option value={c.number}>{c.number}</option>
                        {/each}
                    </select>
                    <select class="select" value={primaryBibleId} on:change={(e) => changePrimary(e.currentTarget.value)}>
                        {#each localBibleIds as id}
                            <option value={id}>{getBibleName(id)}</option>
                        {/each}
                    </select>
                </div>

                <div class="search">
                    <Icon id="search" white />
                    <input class="edit" type="text" placeholder={translateText("bible_study.search")} bind:value={searchQuery} on:keydown={(e) => e.key === "Enter" && onSearch()} />
                    <MaterialButton icon="search" title="bible_study.search" on:click={onSearch} />
                </div>
            {/if}

            <MaterialButton class="import-data" icon="download" title="popup.import_bible_study" on:click={() => activePopup.set("import_bible_study")} />
            <MaterialButton class="close" icon="close" iconSize={1.3} title="actions.close [esc]" on:click={closeBibleStudy} />
        </div>

        {#if !localBibleIds.length}
            <!-- EMPTY STATE -->
            <div class="empty-state">
                <Icon id="scripture" size={3} white />
                <p><T id="bible_study.no_local_bibles" /></p>
                <MaterialButton variant="outlined" icon="add" on:click={() => activePopup.set("import_scripture")}>
                    <T id="new.scripture" />
                </MaterialButton>
            </div>
        {:else}
            <div class="body">
                <!-- LEFT: passage -->
                <div class="passage">
                    <div class="passage-header">
                        <MaterialButton icon="previous" title="bible_study.previous_chapter" on:click={() => stepChapter(-1)} />
                        <span class="ref">{formatReference(bookNumber, chapterNumber)}</span>
                        <MaterialButton icon="next" title="bible_study.next_chapter" on:click={() => stepChapter(1)} />
                    </div>

                    <!-- comparison version chooser -->
                    <div class="comparison-bar">
                        <span class="label"><T id="bible_study.compare" />:</span>
                        {#each localBibleIds.filter((id) => id !== primaryBibleId) as id}
                            <button class="chip" class:active={comparisonVersions.includes(id)} on:click={() => toggleComparison(id)}>{getBibleName(id)}</button>
                        {/each}
                    </div>

                    {#if searchResults.length}
                        <div class="search-results">
                            <div class="results-header">
                                <T id="bible_study.results" replace={[String(searchResults.length)]} />
                                <MaterialButton icon="close" title="actions.close" on:click={() => (searchResults = [])} />
                            </div>
                            {#each searchResults as result}
                                <button class="result" on:click={() => navigateTo(result.book, result.chapter, result.verse)}>
                                    <span class="result-ref">{result.reference}</span>
                                    <span class="result-text">{result.text}</span>
                                </button>
                            {/each}
                        </div>
                    {:else if searchMessage}
                        <p class="message"><T id={searchMessage} /></p>
                    {:else if loadingBible}
                        <Center><Loader /></Center>
                    {:else if loadFailed}
                        <p class="message"><T id="error.bible" /></p>
                    {:else if !verses.length}
                        <p class="message"><T id="empty.general" /></p>
                    {:else}
                        <div class="verses">
                            {#each verses as verse}
                                <div class="verse-row" class:selected={Number(verse.number) === verseNumber} on:click={() => selectVerse(verse.number)} on:keydown={(e) => e.key === "Enter" && selectVerse(verse.number)} role="button" tabindex="0">
                                    <span class="vnum">{verse.number}</span>
                                    <div class="vtext-group">
                                        <span class="vtext">{@html displayText(verse.text)}</span>
                                        {#each comparisonData as comp}
                                            <span class="vtext comparison"><span class="comp-name">{comp.name}</span> {@html comp.verses[Number(verse.number)] || ""}</span>
                                        {/each}
                                    </div>
                                    {#if $bibleNotes[verseKey(bookNumber, chapterNumber, Number(verse.number))]}
                                        <Icon id="notes" size={0.8} white />
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- RIGHT: study panel -->
                <div class="study-panel">
                    <div class="tabs">
                        <button class="tab" class:active={rightTab === "interlinear"} on:click={() => (rightTab = "interlinear")}><Icon id="translate" white /> <T id="bible_study.interlinear" /></button>
                        <button class="tab" class:active={rightTab === "strongs"} on:click={() => (rightTab = "strongs")}><Icon id="info" white /> <T id="bible_study.strongs" /></button>
                        <button class="tab" class:active={rightTab === "cross"} on:click={() => (rightTab = "cross")}
                            ><Icon id="scripture_alt" white />
                            <T id="bible_study.cross_references" />
                            {#if crossRefs.length}<span class="badge">{crossRefs.length}</span>{/if}</button
                        >
                        <button class="tab" class:active={rightTab === "notes"} on:click={() => (rightTab = "notes")}><Icon id="notes" white /> <T id="bible_study.notes" /></button>
                    </div>

                    <div class="panel-ref">{reference}</div>

                    <div class="panel-content">
                        {#if rightTab === "interlinear"}
                            {#if hasInterlinear}
                                <div class="settings-row">
                                    <button class="mini" class:active={$bibleStudySettings.showTransliteration} on:click={() => bibleStudySettings.update((s) => ({ ...s, showTransliteration: !s.showTransliteration }))}><T id="bible_study.transliteration" /></button>
                                    <button class="mini" class:active={$bibleStudySettings.showStrongs} on:click={() => bibleStudySettings.update((s) => ({ ...s, showStrongs: !s.showStrongs }))}>Strong's</button>
                                    <button class="mini" class:active={$bibleStudySettings.showMorphology} on:click={() => bibleStudySettings.update((s) => ({ ...s, showMorphology: !s.showMorphology }))}><T id="bible_study.morphology" /></button>
                                </div>
                                <Interlinear {words} lexicon={$strongsLexicon} settings={$bibleStudySettings} {selectedStrongs} {rtl} on:wordClick={onWordClick} />
                            {:else}
                                <p class="message"><T id="bible_study.no_interlinear" /></p>
                            {/if}
                        {:else if rightTab === "strongs"}
                            <StrongsEntryView strongs={selectedStrongs} entry={strongsEntry} on:search={searchStrongs} />
                        {:else if rightTab === "cross"}
                            <CrossReferencesPanel references={crossRefs} hasData={Object.keys($crossReferences).length > 0} on:navigate={(e) => navigateTo(e.detail.book, e.detail.chapter, e.detail.verse)} />
                        {:else if rightTab === "notes"}
                            <StudyNotesPanel {reference} noteKey={currentKey} {note} on:save={(e) => setStudyNote(e.detail.key, e.detail.reference, e.detail.text)} />
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .bible-study {
        position: absolute;
        inset: 0;
        /* below popups/toasts (5000) so the "Import study data" popup appears above this overlay */
        z-index: 4900;
        background-color: var(--primary);
        color: var(--text);
        display: flex;
        flex-direction: column;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background-color: var(--primary-darker);
        border-bottom: 1px solid var(--primary-lighter);
        flex-shrink: 0;
    }
    .title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        font-size: 1.1em;
    }
    .nav {
        display: flex;
        gap: 6px;
    }
    .select {
        background-color: var(--primary-darkest);
        color: var(--text);
        border: 1px solid var(--primary-lighter);
        padding: 6px 8px;
        border-radius: 4px;
        max-width: 220px;
    }
    .search {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        background-color: var(--primary-darkest);
        border: 1px solid var(--primary-lighter);
        border-radius: 4px;
        padding: 0 8px;
    }
    .search input {
        background: transparent;
        border: none;
        color: var(--text);
        padding: 8px 4px;
        width: 200px;
    }
    .search input:focus {
        outline: none;
    }

    .empty-state {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        opacity: 0.8;
    }

    .body {
        flex: 1;
        display: flex;
        overflow: hidden;
    }

    .passage {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid var(--primary-lighter);
    }
    .passage-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        padding: 10px;
        font-size: 1.2em;
        font-weight: bold;
        border-bottom: 1px solid var(--primary-lighter);
    }
    .comparison-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-bottom: 1px solid var(--primary-lighter);
        background-color: var(--primary-darker);
    }
    .comparison-bar .label {
        opacity: 0.6;
        font-size: 0.85em;
    }
    .chip {
        background-color: var(--primary-darkest);
        color: var(--text);
        border: 1px solid var(--primary-lighter);
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.8em;
        cursor: pointer;
    }
    .chip.active {
        background-color: var(--secondary);
        color: var(--secondary-text);
        border-color: var(--secondary);
    }

    .verses {
        overflow-y: auto;
        padding: 8px;
    }
    .verse-row {
        display: flex;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 4px;
        cursor: pointer;
        align-items: flex-start;
    }
    .verse-row:hover {
        background-color: var(--primary-lighter);
    }
    .verse-row.selected {
        background-color: var(--primary-lighter);
        box-shadow: inset 3px 0 0 var(--secondary);
    }
    .vnum {
        color: var(--secondary);
        font-weight: bold;
        min-width: 22px;
        text-align: right;
    }
    .vtext-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        line-height: 1.5;
    }
    .comparison {
        opacity: 0.75;
        font-size: 0.92em;
        border-top: 1px dashed var(--primary-lighter);
        padding-top: 4px;
    }
    .comp-name {
        font-size: 0.75em;
        text-transform: uppercase;
        opacity: 0.6;
        margin-right: 4px;
    }

    .search-results {
        overflow-y: auto;
        padding: 8px;
    }
    .results-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        opacity: 0.7;
        font-size: 0.9em;
    }
    .result {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        text-align: start;
        background: transparent;
        border: none;
        color: var(--text);
        padding: 8px 10px;
        border-radius: 4px;
        cursor: pointer;
    }
    .result:hover {
        background-color: var(--primary-lighter);
    }
    .result-ref {
        color: var(--secondary);
        font-weight: bold;
        font-size: 0.85em;
    }
    .result-text {
        opacity: 0.85;
        font-size: 0.9em;
    }

    .study-panel {
        width: 40%;
        min-width: 320px;
        max-width: 560px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background-color: var(--primary-darker);
    }
    .tabs {
        display: flex;
        flex-shrink: 0;
    }
    .tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text);
        padding: 10px 6px;
        cursor: pointer;
        font-size: 0.85em;
        opacity: 0.6;
    }
    .tab.active {
        opacity: 1;
        border-bottom-color: var(--secondary);
    }
    .tab:hover {
        background-color: var(--primary-lighter);
    }
    .badge {
        background-color: var(--secondary);
        color: var(--secondary-text);
        border-radius: 10px;
        font-size: 0.75em;
        padding: 0 6px;
    }
    .panel-ref {
        padding: 8px 12px;
        font-weight: bold;
        color: var(--secondary);
        border-bottom: 1px solid var(--primary-lighter);
    }
    .panel-content {
        flex: 1;
        overflow-y: auto;
    }

    .settings-row {
        display: flex;
        gap: 6px;
        padding: 8px 10px 0;
    }
    .mini {
        background-color: var(--primary-darkest);
        color: var(--text);
        border: 1px solid var(--primary-lighter);
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 0.75em;
        cursor: pointer;
        opacity: 0.6;
    }
    .mini.active {
        opacity: 1;
        border-color: var(--secondary);
        color: var(--secondary);
    }

    .message {
        padding: 20px;
        opacity: 0.5;
        font-style: italic;
        text-align: center;
    }
</style>

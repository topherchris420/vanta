import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/Research.module.css";
import SearchEngine from "../../lib/research/searchEngine";
import workbench from "../../lib/research/workbench";
import useResearchSession from "../../hooks/useResearchSession";
import curatedKnowledgeData from "../../data/research/curatedKnowledge.json";
import ResearchDetails from "../../components/research/ResearchDetails";
import ErrorBoundary from "../../components/ErrorBoundary";

const ResearchGraphNoSSR = dynamic(
  () => import("../../components/research/ResearchGraph"),
  { ssr: false },
);
const {
  DISCIPLINES,
  ERAS,
  SORT_OPTIONS,
  LINK_OPTIONS,
  DEFAULT_SESSION,
  PROVENANCE_NOTE,
  serializeSession,
  createReadingListExport,
} = workbench;
const searchEngine = new SearchEngine(curatedKnowledgeData);
const documents = searchEngine.getAllDocuments();
const fullGraph = searchEngine.getFullGraph();
const nodeIds = new Set(fullGraph.nodes.map((node) => node.id));
const documentIds = new Set(documents.map((doc) => doc.id));
const entryPoints = ["EEG", "Resonance", "Quantum", "Open source"];

export default function ResearchExplorer() {
  const {
    session,
    updateSession,
    savedIds,
    toggleSaved,
    storageAvailable,
    ready,
  } = useResearchSession(nodeIds, documentIds);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSaved, setShowSaved] = useState(false);
  const [wideViewport, setWideViewport] = useState(false);
  const [notice, setNotice] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  const [hoveredDocId, setHoveredDocId] = useState(null);
  const searchInputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const fallbackRef = useRef(null);
  const search = useMemo(
    () =>
      searchEngine.search(session.q, {
        tag: session.discipline,
        era: session.era,
        provenanceFilter: session.links,
        sortBy:
          session.sort === "relevance" && !session.q.trim()
            ? "date-desc"
            : session.sort,
        hops: 2,
      }),
    [session.q, session.discipline, session.era, session.links, session.sort],
  );
  const selectedNode =
    fullGraph.nodes.find((node) => node.id === session.node) || null;
  const suggestions = useMemo(
    () =>
      session.q.trim().length >= 2 ? searchEngine.suggest(session.q, 6) : [],
    [session.q],
  );
  const suggestionsOpen = showSuggestions && suggestions.length > 0;
  const filterCount =
    Number(session.discipline !== "All") +
    Number(session.era !== "All") +
    Number(session.links !== "all");
  const savedSearch = useMemo(
    () =>
      searchEngine.search("", {
        hops: 1,
        documentIds: savedIds,
        sortBy: session.sort === "relevance" ? "date-desc" : session.sort,
      }),
    [savedIds, session.sort],
  );
  const results = showSaved ? savedSearch.results : search.results;
  const graph = showSaved ? savedSearch.graph : search.graph;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 901px)");
    const update = () => setWideViewport(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (shareFallback) {
      fallbackRef.current?.focus();
      fallbackRef.current?.select();
    }
  }, [shareFallback]);
  useEffect(() => {
    searchPanelRef.current?.scrollTo({ top: 0 });
  }, [
    session.q,
    session.discipline,
    session.era,
    session.links,
    session.sort,
    showSaved,
  ]);

  const resetSearch = () => {
    updateSession(DEFAULT_SESSION);
    setShowSaved(false);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };
  const chooseQuery = (q) => {
    updateSession({ q });
    setShowSaved(false);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };
  const inspectNode = (node) =>
    updateSession({ node: typeof node === "string" ? node : node.id });
  const saveRecord = (id) => {
    toggleSaved(id);
    setNotice(
      savedIds.includes(id)
        ? "Removed from your reading list."
        : "Added to your reading list.",
    );
  };
  const shareSearch = async () => {
    const url = window.location.origin + serializeSession(session, nodeIds);
    try {
      await navigator.clipboard.writeText(url);
      setShareFallback("");
      setNotice(
        "Search link copied. Your private reading list is not included.",
      );
    } catch {
      setShareFallback(url);
      setNotice(
        "Copy the selected link below. Your reading list is not included.",
      );
    }
  };
  const exportReadingList = () => {
    const blob = new Blob(
      [
        JSON.stringify(createReadingListExport(savedIds, documents), null, 2) +
          "\n",
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vanta-reading-list.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(
      `Exported ${savedIds.length} saved ${savedIds.length === 1 ? "record" : "records"}.`,
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Research Explorer — Vanta / Vers3Dynamics</title>
        <meta
          name="description"
          content="Follow connections across sound, biosignals, AI, and open research. Build a private reading list and share your path through the Vanta catalog."
        />
        <link rel="canonical" href="https://mitpress.vercel.app/research" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Logo.jpg" />
      </Head>
      <a className={styles.skipLink} href="#research-search">
        Skip to research search
      </a>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.brand} aria-label="Back to home">
            Vers<span className={styles.brandMark}>3</span>Dynamics
          </Link>
          <div className={styles.headerDivider} />
          <h1 className={styles.pageTitle}>
            Research Explorer{" "}
            <span className={styles.pageBadge}>Local catalog</span>
          </h1>
        </div>
        <Link href="/" className={styles.portfolioReturnButton}>
          ← Portfolio
        </Link>
      </header>
      <div className={styles.workbenchBar}>
        <div className={styles.catalogIdentity}>
          <span className={styles.statusDot} />
          {documents.length} records <span aria-hidden="true">/</span> 8
          disciplines
        </div>
        <div className={styles.workbenchActions}>
          <button type="button" onClick={shareSearch}>
            Copy search link ↗
          </button>
          <button
            type="button"
            aria-pressed={showSaved}
            onClick={() => setShowSaved((value) => !value)}
          >
            Reading list <span>{savedIds.length}</span>
          </button>
          <button
            type="button"
            disabled={!savedIds.length}
            onClick={exportReadingList}
          >
            Export list ↓
          </button>
        </div>
      </div>
      <div className={styles.sessionFeedback}>
        <span role="status" aria-live="polite">
          {notice || "Search locally. Follow a connection. Keep what matters."}
        </span>
        {shareFallback && (
          <input
            ref={fallbackRef}
            className={styles.shareInput}
            value={shareFallback}
            readOnly
            aria-label="Search link to copy"
            onFocus={(event) => event.target.select()}
          />
        )}
      </div>
      <main className={styles.main} data-view={session.view}>
        <section
          className={styles.searchPanel}
          aria-label="Research search and filters"
          ref={searchPanelRef}
        >
          <div className={styles.searchHeader}>
            <p className={styles.eyebrow}>An atlas of connected ideas</p>
            <h2 className={styles.searchHeadline}>Follow your curiosity.</h2>
            <p className={styles.searchGuidance}>
              Publications, datasets, and experiments. One place to begin.
            </p>
            <div className={styles.searchBarWrapper}>
              <span className={styles.searchIcon} aria-hidden="true">
                ⌕
              </span>
              <input
                ref={searchInputRef}
                id="research-search"
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                aria-controls={
                  suggestionsOpen ? "research-suggestions" : undefined
                }
                aria-activedescendant={
                  suggestionsOpen && activeSuggestion >= 0
                    ? `research-suggestion-${activeSuggestion}`
                    : undefined
                }
                className={styles.searchInput}
                placeholder="Search a topic, author, or idea…"
                value={session.q}
                maxLength={300}
                onChange={(event) => {
                  updateSession({ q: event.target.value });
                  setShowSaved(false);
                  setActiveSuggestion(-1);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setShowSuggestions(false);
                  setActiveSuggestion(-1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setShowSuggestions(false);
                    setActiveSuggestion(-1);
                  } else if (
                    ["ArrowDown", "ArrowUp"].includes(event.key) &&
                    suggestions.length
                  ) {
                    event.preventDefault();
                    setShowSuggestions(true);
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    setActiveSuggestion((current) =>
                      current < 0
                        ? direction === 1
                          ? 0
                          : suggestions.length - 1
                        : (current + direction + suggestions.length) %
                          suggestions.length,
                    );
                  } else if (
                    event.key === "Enter" &&
                    suggestionsOpen &&
                    activeSuggestion >= 0
                  ) {
                    event.preventDefault();
                    chooseQuery(suggestions[activeSuggestion]);
                  }
                }}
                aria-label="Search research publications"
              />
              {session.q && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    chooseQuery("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                >
                  ×
                </button>
              )}
              {suggestionsOpen && (
                <div
                  id="research-suggestions"
                  role="listbox"
                  aria-label="Suggested search terms"
                  className={styles.suggestionsDropdown}
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      id={`research-suggestion-${index}`}
                      role="option"
                      aria-selected={activeSuggestion === index}
                      tabIndex={-1}
                      type="button"
                      className={styles.suggestionItem}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseQuery(suggestion)}
                    >
                      {suggestion}
                      <span className={styles.suggestionType}>Topic</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!session.q && !showSaved && (
              <div className={styles.entryPoints} aria-label="Suggested topics">
                <span>Try</span>
                {entryPoints.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => chooseQuery(topic)}
                  >
                    {topic} ↗
                  </button>
                ))}
              </div>
            )}
            <div className={styles.filterGrid}>
              <label>
                Discipline
                <select
                  value={session.discipline}
                  onChange={(event) => {
                    updateSession({ discipline: event.target.value });
                    setShowSaved(false);
                  }}
                >
                  {DISCIPLINES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Sort by
                <select
                  value={session.sort}
                  onChange={(event) =>
                    updateSession({ sort: event.target.value })
                  }
                >
                  {SORT_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <details className={styles.advancedFilters}>
              <summary>
                Refine connections & era{" "}
                {filterCount > 0 && <span>({filterCount} active)</span>}
              </summary>
              <div className={styles.filterGrid}>
                <label>
                  Connections
                  <select
                    value={session.links}
                    onChange={(event) => {
                      updateSession({ links: event.target.value });
                      setShowSaved(false);
                    }}
                  >
                    {LINK_OPTIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Era
                  <select
                    value={session.era}
                    onChange={(event) => {
                      updateSession({ era: event.target.value });
                      setShowSaved(false);
                    }}
                  >
                    {ERAS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p>
                Catalog references use source or DOI metadata. Inferred
                connections are generated from shared topics; neither verifies a
                finding.
              </p>
            </details>
            {(session.q || filterCount > 0) && (
              <div className={styles.activeFilters}>
                <span>
                  {filterCount
                    ? `${filterCount} active ${filterCount === 1 ? "filter" : "filters"}`
                    : "Search applied"}
                </span>
                <button
                  type="button"
                  onClick={resetSearch}
                  className={styles.resetButton}
                >
                  Clear search & filters
                </button>
              </div>
            )}
            <div
              className={styles.mobileViewSwitch}
              role="group"
              aria-label="Research view"
            >
              <button
                type="button"
                aria-pressed={session.view === "list"}
                onClick={() =>
                  updateSession({ view: "list", node: session.node })
                }
              >
                Records
              </button>
              <button
                type="button"
                aria-pressed={session.view === "map"}
                onClick={() =>
                  updateSession({ view: "map", node: session.node })
                }
              >
                Connection map
              </button>
            </div>
          </div>
          <div className={styles.recordPanel}>
            <div className={styles.searchStatus}>
              <span role="status" aria-live="polite" aria-atomic="true">
                <strong className={styles.resultCount}>{results.length}</strong>{" "}
                {showSaved
                  ? "saved records"
                  : results.length === 1
                    ? "record found"
                    : "records found"}
              </span>
              <span>
                {showSaved
                  ? "Your reading list"
                  : `${graph.nodes.length} connected nodes`}
              </span>
            </div>
            {showSaved && (
              <p className={styles.readingListNote}>
                {storageAvailable
                  ? "Saved on this browser. Export a copy to take it with you."
                  : "Browser storage is unavailable. Export your list before leaving."}{" "}
                Search filters do not apply to saved records.
              </p>
            )}
            <div className={styles.resultsList}>
              {results.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyStateIcon} aria-hidden="true">
                    ◇
                  </span>
                  <h2>
                    {showSaved
                      ? "Start a reading list."
                      : "No matching records"}
                  </h2>
                  <p>
                    {showSaved
                      ? "Save a record as you explore. It will be waiting here."
                      : "Try a broader topic or clear your filters to explore the full collection."}
                  </p>
                  <button
                    type="button"
                    className={styles.filterPill}
                    onClick={resetSearch}
                  >
                    Browse all research
                  </button>
                </div>
              ) : (
                results.map(({ document: doc, matchedTerms }, index) => (
                  <article
                    key={doc.id}
                    className={`${styles.resultCard} ${selectedNode?.id === doc.id ? styles.resultCardActive : ""}`}
                    onMouseEnter={() => setHoveredDocId(doc.id)}
                    onMouseLeave={() => setHoveredDocId(null)}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.cardMeta}>
                        <span className={styles.recordNumber}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={styles.cardDate}>{doc.date}</span>
                      </div>
                      <span
                        className={`${styles.provenanceBadge} ${styles.provenanceLocal}`}
                      >
                        Catalog entry
                      </span>
                    </div>
                    <h2 className={styles.cardTitle}>
                      <button type="button" onClick={() => inspectNode(doc.id)}>
                        {doc.title}
                      </button>
                    </h2>
                    <p className={styles.recordAuthors}>
                      {doc.authors.join(", ")}
                    </p>
                    <p className={styles.cardAbstract}>{doc.abstract}</p>
                    <div className={styles.cardTags}>
                      {(doc.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className={styles.cardTag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {session.q && matchedTerms.length > 0 && (
                      <p className={styles.matchReason}>
                        Matched: {matchedTerms.slice(0, 4).join(" · ")}
                      </p>
                    )}
                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.focusGraphButton}
                        onClick={() => inspectNode(doc.id)}
                      >
                        Inspect record ↗
                      </button>
                      <button
                        type="button"
                        className={styles.saveButton}
                        disabled={!ready}
                        aria-pressed={savedIds.includes(doc.id)}
                        aria-label={`${savedIds.includes(doc.id) ? "Remove" : "Save"} ${doc.title}`}
                        onClick={() => saveRecord(doc.id)}
                      >
                        {savedIds.includes(doc.id) ? "✓ Saved" : "+ Save"}
                      </button>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                      >
                        Source ↗
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
            <p className={styles.catalogNote}>{PROVENANCE_NOTE}</p>
          </div>
        </section>
        <section className={styles.graphPanel} aria-label="Connection map">
          <div className={styles.mapCaption}>
            <span className={styles.eyebrow}>The space between ideas</span>
            <p>
              Drag to orbit. Scroll to zoom. Select a node to follow its
              connections.
            </p>
          </div>
          {graph.nodes.length ? (
            <ErrorBoundary className={styles.graphContainer}>
              {(wideViewport || session.view === "map") && (
                <ResearchGraphNoSSR
                  graph={graph}
                  selectedNodeId={session.node || null}
                  onSelectNode={inspectNode}
                  hoveredDocId={hoveredDocId}
                />
              )}
            </ErrorBoundary>
          ) : (
            <div className={styles.emptyMap}>
              <span aria-hidden="true">⊹</span>
              <h2>
                {showSaved
                  ? "Your map begins with a saved record."
                  : "No records. No connections."}
              </h2>
              <p>
                {showSaved
                  ? "Save something from the catalog to see its neighborhood."
                  : "Widen the search to bring the map back into view."}
              </p>
            </div>
          )}
          <p className={styles.mapFootnote}>
            A map of catalog relationships. Connections are not independent
            evidence.
          </p>
        </section>
      </main>
      <ResearchDetails
        node={selectedNode}
        graph={fullGraph}
        onClose={() => updateSession({ node: "" })}
        onSelectNode={inspectNode}
        saved={savedIds.includes(selectedNode?.id)}
        onToggleSaved={saveRecord}
      />
    </div>
  );
}

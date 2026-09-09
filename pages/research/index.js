import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/Research.module.css";
import SearchEngine from "../../lib/research/searchEngine";
import curatedKnowledgeData from "../../data/research/curatedKnowledge.json";
import ResearchDetails from "../../components/research/ResearchDetails";
import ErrorBoundary from "../../components/ErrorBoundary";

const ResearchGraphNoSSR = dynamic(
  () => import("../../components/research/ResearchGraph"),
  { ssr: false }
);

const DISCIPLINES = [
  "All",
  "Quantum Computing",
  "Cymatics",
  "Biosignal Processing",
  "AI & Neural Interfaces",
  "Neuroscience & Neural Datasets",
  "Acoustics",
  "Nuclear Engineering",
  "Archival Intelligence & Institutional Oversight",
];

const ERAS = [
  "All",
  "Cold War Era (1947–1975)",
  "Church Committee Era (1975–1980)",
  "Post-Cold War (1981–2000)",
  "Modern Oversight (2001–Present)",
];

const PROVENANCE_OPTIONS = [
  { id: "all", label: "All Records" },
  { id: "verifiedOnly", label: "Verified Only" },
  { id: "showInferred", label: "Inferred Links" },
];

// Singleton SearchEngine instance with curated knowledge data
const searchEngine = new SearchEngine(curatedKnowledgeData);

// Initial state for SSR pre-rendering
const initialSearch = searchEngine.search("", {
  provenanceFilter: "all",
  tag: undefined,
});

export default function ResearchExplorer() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [activeEra, setActiveEra] = useState("All");
  const [provenanceFilter, setProvenanceFilter] = useState("all");
  const [searchResults, setSearchResults] = useState(initialSearch.results);
  const [dynamicGraph, setDynamicGraph] = useState(initialSearch.graph);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchInputRef = useRef(null);
  const suggestions = useMemo(
    () => query.trim().length >= 2 ? searchEngine.suggest(query, 6) : [],
    [query]
  );
  const suggestionsOpen = showSuggestions && suggestions.length > 0;
  const filterCount = Number(activeTag !== "All") + Number(activeEra !== "All") + Number(provenanceFilter !== "all");
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredDocId, setHoveredDocId] = useState(null);

  // Perform search & dynamic subgraph extraction
  const performSearch = useCallback(
    (searchQuery, tag, provFilter, era) => {
      const res = searchEngine.search(searchQuery, {
        tag: tag === "All" ? undefined : tag,
        provenanceFilter: provFilter,
        era: era === "All" ? undefined : era,
        sortBy: searchQuery ? "relevance" : "date-desc",
        hops: 2,
      });
      setSearchResults(res.results);
      setDynamicGraph(res.graph);
    },
    []
  );

  // Run search when query, tag, era, or provenance filter changes
  useEffect(() => {
    performSearch(query, activeTag, provenanceFilter, activeEra);
  }, [query, activeTag, provenanceFilter, activeEra, performSearch]);

  const resetSearch = () => {
    setQuery("");
    setActiveTag("All");
    setActiveEra("All");
    setProvenanceFilter("all");
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    searchInputRef.current?.focus();
  };

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  // Handle selecting a node from 3D canvas or search list
  const handleSelectNode = useCallback(
    (node) => {
      if (typeof node === "string") {
        const found = dynamicGraph.nodes.find((n) => n.id === node);
        if (found) setSelectedNode(found);
      } else {
        setSelectedNode(node);
      }
    },
    [dynamicGraph]
  );

  // Handle clicking a document card in search list
  const handleCardClick = (doc) => {
    const matchingNode = dynamicGraph.nodes.find((n) => n.id === doc.id);
    if (matchingNode) {
      setSelectedNode(matchingNode);
    }
  };

  const getSourceBadgeText = (doc) => {
    if (doc.source.toLowerCase().includes("declassified")) {
      return "Declassified Record: " + (doc.agency || doc.source);
    }
    if (doc.source.toLowerCase().includes("neuro2")) {
      return "Dataset Atlas: " + doc.source;
    }
    if (doc.source.toLowerCase().includes("arxiv")) {
      return "Verified Source: arXiv";
    }
    if (doc.source.toLowerCase().includes("openalex")) {
      return "Verified Source: OpenAlex";
    }
    if (doc.source.toLowerCase().includes("ssrn")) {
      return "Verified Source: SSRN";
    }
    return `Source Verified: ${doc.source}`;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Vers3Dynamics | Research Explorer & Knowledge Graph</title>
        <meta
          name="description"
          content="Experimental research discovery engine, citation network, and interactive 3D Knowledge Graph across Quantum Computing, Cymatics, Biosignals, AI, Acoustics, and Nuclear Engineering."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/Logo.jpg" />
      </Head>

      {/* Top Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.brand} aria-label="Back to home">
            Vers<span className={styles.brandMark}>3</span>Dynamics
          </Link>
          <div className={styles.headerDivider} />
          <h1 className={styles.pageTitle}>
            Research Explorer
            <span className={styles.pageBadge}>Live Index</span>
          </h1>
        </div>

        <div className={styles.headerRight}>
          <Link href="/" className={styles.portfolioReturnButton}>
            <span>&larr; Portfolio</span>
          </Link>
        </div>
      </header>

      {/* Main Split Interface */}
      <main className={styles.main}>
        {/* Left Search & Result Panel */}
        <section
          className={styles.searchPanel}
          aria-label="Research search and filters"
        >
          <div className={styles.searchHeader}>
            <p className={styles.searchGuidance}>Find a publication. Follow its connections.</p>
            <div className={styles.searchBarWrapper}>
              <span className={styles.searchIcon} aria-hidden="true">&#x2315;</span>
              <input
                ref={searchInputRef}
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                aria-controls={suggestionsOpen ? "research-suggestions" : undefined}
                aria-activedescendant={suggestionsOpen && activeSuggestion >= 0 ? `research-suggestion-${activeSuggestion}` : undefined}
                className={styles.searchInput}
                placeholder="Search topics, publications, datasets…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveSuggestion(-1);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setShowSuggestions(false);
                  setActiveSuggestion(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowSuggestions(false);
                    setActiveSuggestion(-1);
                  } else if ((e.key === "ArrowDown" || e.key === "ArrowUp") && suggestions.length) {
                    e.preventDefault();
                    setShowSuggestions(true);
                    const direction = e.key === "ArrowDown" ? 1 : -1;
                    setActiveSuggestion((current) => current < 0
                      ? (direction === 1 ? 0 : suggestions.length - 1)
                      : (current + direction + suggestions.length) % suggestions.length);
                  } else if (e.key === "Enter" && suggestionsOpen && activeSuggestion >= 0) {
                    e.preventDefault();
                    selectSuggestion(suggestions[activeSuggestion]);
                  }
                }}
                aria-label="Search research publications"
              />
              {query && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setQuery("");
                    setShowSuggestions(false);
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                >
                  &#x2715;
                </button>
              )}

              {/* Suggestions Dropdown */}
              {suggestionsOpen && (
                <div id="research-suggestions" role="listbox" aria-label="Suggested search terms" className={styles.suggestionsDropdown}>
                  {suggestions.map((sugg, index) => (
                    <button
                      key={sugg}
                      id={`research-suggestion-${index}`}
                      role="option"
                      aria-selected={activeSuggestion === index}
                      tabIndex={-1}
                      type="button"
                      className={styles.suggestionItem}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(sugg)}
                    >
                      <span>{sugg}</span>
                      <span className={styles.suggestionType}>Keyword</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Discipline Filter Pills */}
            <div className={styles.filterPills} role="group" aria-label="Discipline filter">
              {DISCIPLINES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={activeTag === tag}
                  className={`${styles.filterPill} ${
                    activeTag === tag ? styles.filterPillActive : ""
                  }`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Administrative Era Filter Pills (shown when Archival Oversight or All selected) */}
            <div className={styles.filterPills} role="group" aria-label="Administrative era filter">
              <span className={styles.provenanceFilterLabel}>Era:</span>
              {ERAS.map((era) => (
                <button
                  key={era}
                  type="button"
                  aria-pressed={activeEra === era}
                  className={`${styles.filterPill} ${
                    activeEra === era ? styles.filterPillActive : ""
                  }`}
                  onClick={() => setActiveEra(era)}
                >
                  {era}
                </button>
              ))}
            </div>

            {/* Provenance Filter Toggle Chips */}
            <div className={styles.provenanceFilters} role="group" aria-label="Provenance filter">
              <span className={styles.provenanceFilterLabel}>Provenance:</span>
              {PROVENANCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={provenanceFilter === opt.id}
                  className={`${styles.provenanceFilterPill} ${
                    provenanceFilter === opt.id ? styles.provenanceFilterPillActive : ""
                  }`}
                  onClick={() => setProvenanceFilter(opt.id)}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {(query || filterCount > 0) && (
              <div className={styles.activeFilters}>
                <span>{filterCount > 0 ? `${filterCount} active ${filterCount === 1 ? "filter" : "filters"}` : "Search applied"}</span>
                <button type="button" onClick={resetSearch} className={styles.resetButton}>Clear search & filters</button>
              </div>
            )}
          </div>

          {/* Search Status */}
          <div className={styles.searchStatus}>
            <span role="status" aria-live="polite" aria-atomic="true">
              <strong className={styles.resultCount}>
                {searchResults.length}
              </strong>{" "}
              {searchResults.length === 1 ? "record found" : "records found"}
            </span>
            <span>
              Subgraph: {dynamicGraph.nodes.length} Nodes &bull; {dynamicGraph.edges.length} Edges
            </span>
          </div>

          {/* Search Result Cards */}
          <div className={styles.resultsList}>
            {searchResults.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}>&#x25C7;</span>
                <h2>No matching records</h2>
                <p>Try a broader topic or clear your filters to explore the full collection.</p>
                <button
                  type="button"
                  className={styles.filterPill}
                  onClick={resetSearch}
                >
                  Browse all research
                </button>
              </div>
            ) : (
              searchResults.map(({ document: doc }) => {
                const isSelected = selectedNode?.id === doc.id;
                const isDeclassified = doc.source.toLowerCase().includes("declassified");
                return (
                  <article
                    key={doc.id}
                    className={`${styles.resultCard} ${
                      isSelected ? styles.resultCardActive : ""
                    }`}
                    onClick={() => handleCardClick(doc)}
                    onMouseEnter={() => setHoveredDocId(doc.id)}
                    onMouseLeave={() => setHoveredDocId(null)}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardDate}>{doc.date}</span>
                        <span>&bull;</span>
                        <span className={styles.cardSource}>{doc.source}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {doc.agency && (
                          <span className={styles.cardAgencyBadge}>
                            {doc.agency}
                          </span>
                        )}
                        <span
                          className={`${styles.provenanceBadge} ${
                            isDeclassified
                              ? styles.provenanceDeclassified
                              : styles.provenanceVerified
                          }`}
                        >
                          {getSourceBadgeText(doc)}
                        </span>
                        {provenanceFilter === "showInferred" && (
                          <span
                            className={`${styles.provenanceBadge} ${styles.provenanceInferred}`}
                          >
                            Inferred Relation
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className={styles.cardTitle}>{doc.title}</h2>
                    <p className={styles.cardAbstract}>{doc.abstract}</p>

                    <div className={styles.cardTags}>
                      {doc.era && (
                        <span className={styles.cardEraBadge}>
                          {doc.era}
                        </span>
                      )}
                      {(doc.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.cardTag}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.focusGraphButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(doc);
                        }}
                      >
                        Focus in 3D Graph &rarr;
                      </button>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Read source</span>
                        <span>&#x2197;</span>
                      </a>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* Right 3D Knowledge Graph Canvas */}
        <section
          className={styles.graphContainer}
          aria-label="3D Knowledge Graph Visualization"
        >
          <ErrorBoundary className={styles.graphContainer}>
            <ResearchGraphNoSSR
              graph={dynamicGraph}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={handleSelectNode}
              hoveredDocId={hoveredDocId}
            />
          </ErrorBoundary>
        </section>
      </main>

      {/* Slide-out Inspector Drawer */}
      <ResearchDetails
        node={selectedNode}
        graph={dynamicGraph}
        onClose={() => setSelectedNode(null)}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}

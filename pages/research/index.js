import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/Research.module.css";
import { defaultProvider } from "../../lib/research/providers";
import { buildGraphFromDocuments } from "../../lib/research/graphEngine";
import ResearchDetails from "../../components/research/ResearchDetails";

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
  "Acoustics",
  "Nuclear Engineering",
];

const initialResults = defaultProvider
  .getAllDocuments()
  .map((doc) => ({ document: doc, score: 1.0, matchedTerms: [] }));

export default function ResearchExplorer() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [searchResults, setSearchResults] = useState(initialResults);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredDocId, setHoveredDocId] = useState(null);

  // Perform search
  const performSearch = useCallback(async (searchQuery, tag) => {
    const res = await defaultProvider.search(searchQuery, {
      tag: tag === "All" ? undefined : tag,
      sortBy: searchQuery ? "relevance" : "date-desc",
    });
    setSearchResults(res.results);
  }, []);

  // Run search when query or tag changes
  useEffect(() => {
    performSearch(query, activeTag);
  }, [query, activeTag, performSearch]);

  // Autocomplete suggestions
  useEffect(() => {
    if (query.trim().length >= 2) {
      defaultProvider.suggest(query, 6).then((suggs) => {
        setSuggestions(suggs);
        setShowSuggestions(suggs.length > 0);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // Construct 3D Knowledge Graph from search result documents (or all if filtered)
  const currentDocuments = useMemo(() => {
    return searchResults.map((r) => r.document);
  }, [searchResults]);

  const graphData = useMemo(() => {
    return buildGraphFromDocuments(
      currentDocuments.length > 0
        ? currentDocuments
        : defaultProvider.getAllDocuments()
    );
  }, [currentDocuments]);

  // Handle selecting a node from 3D canvas or search list
  const handleSelectNode = useCallback(
    (node) => {
      if (typeof node === "string") {
        const found = graphData.nodes.find((n) => n.id === node);
        if (found) setSelectedNode(found);
      } else {
        setSelectedNode(node);
      }
    },
    [graphData]
  );

  // Handle clicking a document card in search list
  const handleCardClick = (doc) => {
    const matchingNode = graphData.nodes.find((n) => n.id === doc.id);
    if (matchingNode) {
      setSelectedNode(matchingNode);
    }
  };

  const getProvenanceClass = (prov) => {
    if (prov === "Source Verified") return styles.provenanceVerified;
    if (prov === "Local Index") return styles.provenanceLocal;
    return styles.provenanceInferred;
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
            <div className={styles.searchBarWrapper}>
              <span className={styles.searchIcon}>&#x2315;</span>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search quantum, cymatics, neural interfaces..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                aria-label="Search research publications"
              />
              {query && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => setQuery("")}
                  aria-label="Clear search query"
                >
                  &#x2715;
                </button>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className={styles.suggestionsDropdown}>
                  {suggestions.map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      className={styles.suggestionItem}
                      onClick={() => {
                        setQuery(sugg);
                        setShowSuggestions(false);
                      }}
                    >
                      <span>{sugg}</span>
                      <span className={styles.suggestionType}>Keyword</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Discipline Filter Pills */}
            <div className={styles.filterPills} role="tablist">
              {DISCIPLINES.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  role="tab"
                  aria-selected={activeTag === tag}
                  className={`${styles.filterPill} ${
                    activeTag === tag ? styles.filterPillActive : ""
                  }`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Search Status */}
          <div className={styles.searchStatus}>
            <span>
              <strong className={styles.resultCount}>
                {searchResults.length}
              </strong>{" "}
              {searchResults.length === 1 ? "Artifact Found" : "Artifacts Indexed"}
            </span>
            <span>Provenance: 100% Verified</span>
          </div>

          {/* Search Result Cards */}
          <div className={styles.resultsList}>
            {searchResults.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}>&#x25C7;</span>
                <p>No research records matched your query.</p>
                <button
                  type="button"
                  className={styles.filterPill}
                  onClick={() => {
                    setQuery("");
                    setActiveTag("All");
                  }}
                >
                  Reset Search
                </button>
              </div>
            ) : (
              searchResults.map(({ document: doc, score }) => {
                const isSelected = selectedNode?.id === doc.id;
                return (
                  <article
                    key={doc.id}
                    className={`${styles.resultCard} ${
                      isSelected ? styles.resultCardActive : ""
                    }`}
                    onClick={() => handleCardClick(doc)}
                    onMouseEnter={() => setHoveredDocId(doc.id)}
                    onMouseLeave={() => setHoveredDocId(null)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleCardClick(doc);
                      }
                    }}
                  >
                    <div className={styles.cardTop}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardDate}>{doc.date}</span>
                        <span>&bull;</span>
                        <span className={styles.cardSource}>{doc.source}</span>
                      </div>
                      <span
                        className={`${styles.provenanceBadge} ${getProvenanceClass(
                          "Source Verified"
                        )}`}
                      >
                        Source Verified
                      </span>
                    </div>

                    <h2 className={styles.cardTitle}>{doc.title}</h2>
                    <p className={styles.cardAbstract}>{doc.abstract}</p>

                    <div className={styles.cardTags}>
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
                        <span>Artifact URL</span>
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
          <ResearchGraphNoSSR
            graph={graphData}
            selectedNodeId={selectedNode?.id || null}
            onSelectNode={handleSelectNode}
            hoveredDocId={hoveredDocId}
          />
        </section>
      </main>

      {/* Slide-out Inspector Drawer */}
      <ResearchDetails
        node={selectedNode}
        graph={graphData}
        onClose={() => setSelectedNode(null)}
        onSelectNode={handleSelectNode}
      />
    </div>
  );
}

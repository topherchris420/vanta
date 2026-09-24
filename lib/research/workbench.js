/** Serializable research sessions. URLs carry filters, never private reading lists. */
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
const SORT_OPTIONS = [
  { id: "relevance", label: "Best match" },
  { id: "date-desc", label: "Newest first" },
  { id: "date-asc", label: "Oldest first" },
  { id: "title-asc", label: "Title A–Z" },
];
const LINK_OPTIONS = [
  { id: "all", label: "All connections" },
  { id: "verifiedOnly", label: "Catalog references" },
  { id: "showInferred", label: "Inferred connections" },
];
const DEFAULT_SESSION = Object.freeze({
  q: "",
  discipline: "All",
  era: "All",
  links: "all",
  sort: "relevance",
  node: "",
  view: "list",
});
const STORAGE_KEY = "vanta:reading-list:v1";
const PROVENANCE_NOTE =
  "Metadata is supplied by the local catalog and has not been independently verified. Indexed and inferred connections are discovery aids, not evidence of a scientific relationship. Check original sources before citing.";

function normalizeSession(value = {}, nodeIds = new Set()) {
  const choose = (key, allowed) =>
    allowed.includes(value[key]) ? value[key] : DEFAULT_SESSION[key];
  return {
    q: typeof value.q === "string" ? value.q.slice(0, 300) : "",
    discipline: choose("discipline", DISCIPLINES),
    era: choose("era", ERAS),
    links: choose(
      "links",
      LINK_OPTIONS.map((option) => option.id),
    ),
    sort: choose(
      "sort",
      SORT_OPTIONS.map((option) => option.id),
    ),
    node:
      typeof value.node === "string" && nodeIds.has(value.node)
        ? value.node
        : "",
    view: choose("view", ["list", "map"]),
  };
}

function parseSession(search, nodeIds) {
  return normalizeSession(
    Object.fromEntries(new URLSearchParams(search)),
    nodeIds,
  );
}

function serializeSession(session, nodeIds) {
  const normalized = normalizeSession(session, nodeIds);
  const params = new URLSearchParams();
  Object.keys(DEFAULT_SESSION).forEach((key) => {
    if (normalized[key] !== DEFAULT_SESSION[key])
      params.set(key, normalized[key]);
  });
  const query = params.toString();
  return `/research${query ? `?${query}` : ""}`;
}

function parseReadingList(raw, documentIds) {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [
      ...new Set(
        value.filter((id) => typeof id === "string" && documentIds.has(id)),
      ),
    ];
  } catch {
    return [];
  }
}

function createReadingListExport(ids, documents) {
  const byId = new Map(documents.map((doc) => [doc.id, doc]));
  return {
    schema: "vanta.reading-list.v1",
    provenance: PROVENANCE_NOTE,
    records: [...new Set(ids)]
      .filter((id) => byId.has(id))
      .map((id) => {
        const { title, authors, date, source, url, doi, tags } = byId.get(id);
        return {
          id,
          title,
          authors,
          date,
          source,
          url,
          ...(doi ? { doi } : {}),
          tags,
        };
      }),
  };
}

module.exports = {
  DISCIPLINES,
  ERAS,
  SORT_OPTIONS,
  LINK_OPTIONS,
  DEFAULT_SESSION,
  STORAGE_KEY,
  PROVENANCE_NOTE,
  normalizeSession,
  parseSession,
  serializeSession,
  parseReadingList,
  createReadingListExport,
};

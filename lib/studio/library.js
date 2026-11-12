// The Library's holdings. Every volume is assembled from material that already
// exists in this repository: the practice model, the research catalog's own
// records, and the research notes in docs/. Nothing is written here. Where the
// text of a work is not in the repository (the poems of Life of a Line), the
// volume says so and points at the book instead of inventing pages.

/* --------------------------------------------------------------- markdown */

// Inline markdown to spans: links, bold, italics, and code. Anything else is
// text. Only http(s) and site-relative links survive as links.
const SAFE_HREF = /^(https?:\/\/|\/(?!\/)|mailto:)/i;

const parseInline = (source) => {
  const spans = [];
  const text = String(source ?? "");
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*\s][^*]*)\*)/g;
  let cursor = 0;
  let match;
  const push = (span) => {
    const last = spans[spans.length - 1];
    if (span.t === "text" && last && last.t === "text") last.v += span.v;
    else spans.push(span);
  };
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) push({ t: "text", v: text.slice(cursor, match.index) });
    if (match[1]) {
      const label = match[2].replace(/[`*]/g, "");
      if (SAFE_HREF.test(match[3])) push({ t: "link", v: label, href: match[3] });
      else push({ t: "text", v: label });
    } else if (match[4]) {
      push({ t: "strong", v: match[5].replace(/[`*]/g, "") });
    } else if (match[6]) {
      push({ t: "code", v: match[7] });
    } else if (match[8]) {
      push({ t: "em", v: match[9] });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) push({ t: "text", v: text.slice(cursor) });
  return spans;
};

const plainText = (spans) => spans.map((span) => span.v).join("");

// Block-level markdown: headings, paragraphs, lists, fenced code, quotes,
// rules, and simple tables. Enough for the notes in docs/, and no more.
const parseMarkdown = (source) => {
  const lines = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", spans: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };
  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^```/.test(line)) {
      flush();
      const code = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({
        type: "h",
        level: heading[1].length,
        spans: parseInline(heading[2].trim()),
      });
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flush();
      blocks.push({ type: "rule" });
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line)) {
      flush();
      const rows = [];
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
        const cells = lines[index].trim().slice(1, -1).split("|").map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) {
          rows.push(cells.map(parseInline));
        }
        index += 1;
      }
      index -= 1;
      blocks.push({ type: "table", rows });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flush();
      blocks.push({ type: "quote", spans: parseInline(quote[1]) });
      continue;
    }

    const item = /^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      const ordered = Boolean(item[2]);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { type: "list", ordered, items: [] };
      }
      list.items.push([item[3]]);
      continue;
    }

    // A continuation line belongs to the open list item, else to a paragraph.
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1].push(line.trim());
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }
  flush();

  return blocks.map((block) =>
    block.type === "list"
      ? { ...block, items: block.items.map((parts) => parseInline(parts.join(" "))) }
      : block
  );
};

// Cut a document into pages at its second-level headings. The title page is
// whatever comes before the first of them.
const paginate = (blocks) => {
  const pages = [];
  let current = { title: null, blocks: [] };
  blocks.forEach((block) => {
    if (block.type === "h" && block.level <= 2 && current.blocks.length) {
      pages.push(current);
      current = { title: null, blocks: [] };
    }
    if (block.type === "h" && !current.title) current.title = plainText(block.spans);
    current.blocks.push(block);
  });
  if (current.blocks.length) pages.push(current);
  return pages;
};

/* ---------------------------------------------------------------- volumes */

const text = (value) => [{ t: "text", v: value }];
const paragraph = (value) => ({ type: "p", spans: text(value) });
const heading = (value, level = 2) => ({ type: "h", level, spans: text(value) });
const link = (label, href) => ({ t: "link", v: label, href });

const AUTHOR = "Christopher Woodyard";

const isOwnRecord = (record) => (record.authors || []).includes(AUTHOR);
const isManuscript = (record) => /^(zenodo|osf|paper)-/.test(record.id);

// A catalog record as a page: its own title, date, source, and abstract, with
// the link to the original. The abstract is the catalog's summary of the
// deposit, and already says when a preprint is not peer reviewed.
const recordPage = (record) => ({
  title: record.title,
  blocks: [
    heading(record.title),
    {
      type: "meta",
      items: [record.date, record.source, record.doi ? `doi:${record.doi}` : null].filter(Boolean),
    },
    paragraph(record.abstract),
    {
      type: "p",
      spans: [
        link("Read the original", record.url),
        { t: "text", v: " · " },
        link("Open this record in the research atlas", `/research?q=${encodeURIComponent(record.title)}`),
      ],
    },
  ],
});

const workPage = (work) => ({
  title: work.title,
  blocks: [
    heading(work.title, 1),
    { type: "meta", items: [work.year, ...work.status].filter(Boolean) },
    ...(work.question ? [{ type: "quote", spans: text(work.question) }] : []),
    paragraph(work.body),
    ...(work.detail ? [paragraph(work.detail)] : []),
    {
      type: "list",
      ordered: false,
      items: work.evidence.map((entry) => [link(entry.label, entry.href)]),
    },
  ],
});

// Build the shelf. `notes` carries the raw markdown of the research notes,
// read from docs/ at build time by the page.
function buildLibrary({ practice, documents = [], notes = {} }) {
  const worksById = new Map(practice.works.map((work) => [work.id, work]));
  const own = documents.filter(isOwnRecord);
  const volumes = [];

  const lifeOfALine = worksById.get("life-of-a-line");
  if (lifeOfALine) {
    volumes.push({
      id: "life-of-a-line",
      title: lifeOfALine.title,
      kind: "book",
      byline: `${AUTHOR}, ${lifeOfALine.year}`,
      provenance: "Published in paperback. The verse itself is not stored in this repository, so it is not reproduced here.",
      source: lifeOfALine.evidence[0],
      pages: [
        workPage(lifeOfALine),
        {
          title: "Where the poems are",
          blocks: [
            heading("Where the poems are"),
            paragraph(
              "This copy holds the title page only. The thirty pages of verse live in the paperback, and nothing here stands in for them."
            ),
            { type: "p", spans: [link(lifeOfALine.evidence[0].label, lifeOfALine.evidence[0].href)] },
          ],
        },
      ],
    });
  }

  const location = worksById.get("location-papers");
  if (location) {
    const records = own.filter((record) => (record.practice || []).includes("location-papers"));
    const writing = practice.channels.find((channel) => channel.id === "writing");
    volumes.push({
      id: "location-papers",
      title: location.title,
      kind: "book",
      byline: `${AUTHOR}, ${location.year}`,
      provenance: "Self-deposited preprints. Not peer reviewed. The summaries are the research atlas's catalog entries; read the originals before citing.",
      source: location.evidence[0],
      pages: [
        {
          ...workPage(location),
          blocks: [
            ...workPage(location).blocks,
            ...(writing?.artifact?.kind === "quote"
              ? [
                  { type: "quote", spans: text(writing.artifact.text) },
                  { type: "p", spans: [link(writing.artifact.source, writing.artifact.href)] },
                ]
              : []),
          ],
        },
        ...records.map(recordPage),
      ],
    });
  }

  if (notes.mathResearch) {
    const pages = paginate(parseMarkdown(notes.mathResearch));
    volumes.push({
      id: "math-research",
      title: "A mathematical question worth testing",
      kind: "notebook",
      byline: "Research notebook, docs/MATH_RESEARCH.md",
      provenance: "A proposed study. Not tested: no mathematical capability has been demonstrated here.",
      source: {
        label: "The note in the repository",
        href: "https://github.com/topherchris420/vanta/blob/main/docs/MATH_RESEARCH.md",
      },
      pages,
    });
  }

  const epigraphRecord = own.find((record) => record.id === "paper-resonant-intelligence");
  if (practice.epigraph) {
    volumes.push({
      id: "resonant-intelligence",
      title: "Resonant Intelligence",
      kind: "book",
      byline: practice.epigraph.source,
      provenance: "A manuscript in the R.A.I.N. Lab corpus. Not peer reviewed.",
      source: { label: "The manuscript", href: practice.epigraph.href },
      pages: [
        {
          title: "Epigraph",
          blocks: [
            heading("Resonant Intelligence", 1),
            { type: "quote", spans: text(practice.epigraph.text) },
            { type: "p", spans: [link(practice.epigraph.source, practice.epigraph.href)] },
          ],
        },
        ...(epigraphRecord ? [recordPage(epigraphRecord)] : []),
      ],
    });
  }

  const manuscripts = own
    .filter(isManuscript)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (manuscripts.length) {
    volumes.push({
      id: "preprints",
      title: "Preprints and manuscripts",
      kind: "folder",
      byline: `${manuscripts.length} records from the research atlas`,
      provenance: "Self-deposited on Zenodo or OSF, or held in the R.A.I.N. Lab corpus. None is peer reviewed. Inclusion is not verification.",
      source: { label: "The research atlas", href: "/research" },
      pages: [
        {
          title: "Contents",
          blocks: [
            heading("Preprints and manuscripts", 1),
            paragraph(
              "Christopher's own deposits, as the research atlas records them. Each page is a catalog entry, not the paper: follow it to the original."
            ),
            {
              type: "list",
              ordered: true,
              items: manuscripts.map((record) => text(`${record.title} (${String(record.date).slice(0, 4)})`)),
            },
          ],
        },
        ...manuscripts.map(recordPage),
      ],
    });
  }

  return volumes;
}

module.exports = {
  buildLibrary,
  paginate,
  parseInline,
  parseMarkdown,
  plainText,
};

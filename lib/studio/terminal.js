// The studio computer's terminal. A sandbox by construction: commands are a
// fixed table of pure functions over a virtual file tree built from the
// practice model, and the only thing a command can do besides print is ask the
// desktop for one of a short list of effects (open a window, walk to a room).
// There is no eval, no network, no real file system, and no way to name a
// path outside the tree.

const MAX_INPUT = 240;

const ROOM_ALIASES = {
  library: "writing",
  writing: "writing",
  workbench: "instruments",
  bench: "instruments",
  instruments: "instruments",
  simulation: "worlds",
  worlds: "worlds",
  gallery: "art",
  art: "art",
  music: "music",
  studio: "music",
  hall: "hall",
  archive: "archive",
};

const dir = (children, meta = {}) => ({ type: "dir", children, ...meta });
const file = (text, meta = {}) => ({ type: "file", text, ...meta });

const wrapLines = (value) => String(value).split("\n");

const workText = (work, channel, threads) =>
  [
    `${work.title}${work.year ? ` (${work.year})` : ""}`,
    `channel   ${channel.title}, ${channel.note}`,
    `status    ${work.status.join(" · ")}`,
    work.question ? `question  ${work.question}` : null,
    "",
    work.body,
    work.detail ? work.detail : null,
    "",
    ...work.evidence.map((entry) => `→ ${entry.label}: ${entry.href}`),
    threads.length ? `\nthreads   ${threads.map((thread) => thread.name).join(", ")}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

// The tree the terminal can see. Five channel directories, the threads, the
// catalog's records, and a few top-level notes.
function buildFileSystem({ practice, documents = [], volumes = [] }) {
  const { channels, works, threads, epigraph, now, person } = practice;
  const worksById = new Map(works.map((work) => [work.id, work]));
  const threadsFor = (id) => threads.filter((thread) => thread.works.includes(id));

  const root = {};

  root["about.txt"] = file(
    [
      person.name,
      "",
      person.summary,
      "",
      "Vanta is the person. Vers3Dynamics is the open lab.",
      `→ ${person.lab.name}: ${person.lab.url}`,
      `→ contact: ${person.email}`,
    ].join("\n")
  );

  const nowWork = worksById.get(now.work);
  root["now.txt"] = file(`${now.text}\nas of ${now.asOf}\n→ open ${nowWork.id}`, {
    open: { app: "projects", props: { work: nowWork.id } },
  });

  channels.forEach((channel) => {
    const children = {};
    children["README.txt"] = file(
      `${channel.number}  ${channel.title}  ${channel.note}  ${channel.frequency.toFixed(2)} Hz\n\n${channel.lede}`
    );
    channel.works.forEach((id) => {
      const work = worksById.get(id);
      children[`${id}.work`] = file(workText(work, channel, threadsFor(id)), {
        open: { app: "projects", props: { work: id } },
      });
    });
    const artifact = channel.artifact;
    if (artifact.kind === "gallery") {
      artifact.panels.forEach((panel, index) => {
        children[panel.src.split("/").pop()] = file(`${panel.caption}\n\n${panel.alt}`, {
          open: { app: "art", props: { panel: index } },
        });
      });
    } else if (artifact.kind === "figure") {
      children[artifact.src.split("/").pop()] = file(`${artifact.caption}\n\n${artifact.alt}`, {
        open: { app: "art", props: { figure: channel.id } },
      });
    } else if (artifact.kind === "recording") {
      children[artifact.src.split("/").pop()] = file(
        `${artifact.title}\n${artifact.credit}\n${artifact.duration}-second excerpt. Written and owned by ${person.name}.`,
        { open: { app: "music", props: {} } }
      );
    } else if (artifact.kind === "quote") {
      children["claim.txt"] = file(`“${artifact.text}”\n${artifact.source}\n→ ${artifact.href}`);
    }
    if (channel.id === "writing") {
      volumes.forEach((volume) => {
        children[`${volume.id}.book`] = file(
          `${volume.title}\n${volume.byline}\n\n${volume.provenance}\n→ ${volume.source.label}: ${volume.source.href}`,
          { open: { app: "reader", props: { volume: volume.id } } }
        );
      });
    }
    root[channel.id] = dir(children, { channel: channel.id });
  });

  root.threads = dir(
    Object.fromEntries(
      threads.map((thread) => [
        `${thread.id}.txt`,
        file(
          [
            thread.name,
            thread.question,
            "",
            ...thread.works.map((id) => `· ${worksById.get(id).title}`),
            thread.coda ? `\n${thread.coda}` : null,
          ]
            .filter((line) => line !== null)
            .join("\n")
        ),
      ])
    )
  );

  root.research = dir(
    Object.fromEntries(
      documents.map((record) => [
        `${record.id}.record`,
        file(
          [
            record.title,
            `${record.date} · ${record.source}`,
            (record.authors || []).join(", "),
            "",
            record.abstract,
            "",
            `→ ${record.url}`,
          ].join("\n"),
          { open: { app: "atlas", props: { query: record.title } } }
        ),
      ])
    )
  );

  root["epigraph.txt"] = file(`“${epigraph.text}”\n${epigraph.source}\n→ ${epigraph.href}`);

  return dir(root);
}

/* ------------------------------------------------------------------ paths */

// Resolve a path against the working directory. `..` above the root stays at
// the root, so no path can leave the tree.
const resolvePath = (cwd, input) => {
  const raw = String(input ?? "").trim().replace(/^~(?=\/|$)/, "/");
  const base = raw.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
  raw.split("/").forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") base.pop();
    else base.push(part);
  });
  return "/" + base.join("/");
};

const lookup = (tree, path) => {
  let node = tree;
  for (const part of path.split("/").filter(Boolean)) {
    if (!node || node.type !== "dir" || !Object.hasOwn(node.children, part)) return null;
    node = node.children[part];
  }
  return node;
};

const listing = (node) =>
  Object.entries(node.children)
    .sort(([a, an], [b, bn]) =>
      an.type === bn.type ? a.localeCompare(b) : an.type === "dir" ? -1 : 1
    )
    .map(([name, child]) => (child.type === "dir" ? name + "/" : name));

/* --------------------------------------------------------------- commands */

const line = (text, kind = "out") => ({ text, kind });
const lines = (value, kind) => wrapLines(value).map((text) => line(text, kind));

const HELP = [
  ["help", "this list"],
  ["about", "who made all this"],
  ["ls [path]", "list a directory"],
  ["cd <path>", "change directory (.., /, a room)"],
  ["pwd", "where you are"],
  ["cat <file>", "print a file"],
  ["open <name>", "open a work, file, or app in a window"],
  ["projects", "every work, by channel"],
  ["research [query]", "search the research atlas"],
  ["art", "open the artwork viewer"],
  ["music", "open the music player"],
  ["threads", "the four questions that recur"],
  ["now", "what has the attention"],
  ["goto <room>", "stand up and walk there"],
  ["play", "launch Resolve, the tuning game"],
  ["chord", "name the chord the rooms make"],
  ["clear", "clear the screen"],
  ["exit", "leave the computer"],
];

const APPS = ["terminal", "projects", "atlas", "music", "art", "files", "experiments", "reader"];

function createTerminal({ practice, documents = [], volumes = [], search = null, chordName = null }) {
  const tree = buildFileSystem({ practice, documents, volumes });
  const { channels, works, threads, now, person } = practice;
  const worksById = new Map(works.map((work) => [work.id, work]));
  const channelsById = new Map(channels.map((channel) => [channel.id, channel]));

  const findWork = (name) => {
    const key = String(name).toLowerCase().replace(/\.work$/, "");
    return (
      worksById.get(key) ??
      works.find((work) => work.title.toLowerCase() === key) ??
      works.find((work) => work.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === key) ??
      null
    );
  };

  const commands = {
    help: () => ({
      output: HELP.map(([name, about]) => line(`  ${name.padEnd(18)}${about}`)),
    }),

    about: () => ({ output: lines(tree.children["about.txt"].text) }),

    pwd: (state) => ({ output: [line(state.cwd)] }),

    ls: (state, args) => {
      const path = resolvePath(state.cwd, args[0] ?? ".");
      const node = lookup(tree, path);
      if (!node) return { output: [line(`ls: ${args[0]}: no such file or directory`, "error")] };
      if (node.type === "file") return { output: [line(path.split("/").pop())] };
      return { output: listing(node).map((name) => line(name, name.endsWith("/") ? "dir" : "out")) };
    },

    cd: (state, args) => {
      const target = args[0] ?? "/";
      const alias = ROOM_ALIASES[target.toLowerCase()];
      const path =
        alias && channelsById.has(alias) && !lookup(tree, resolvePath(state.cwd, target))
          ? "/" + alias
          : resolvePath(state.cwd, target);
      const node = lookup(tree, path);
      if (!node) return { output: [line(`cd: ${target}: no such directory`, "error")] };
      if (node.type !== "dir") return { output: [line(`cd: ${target}: not a directory`, "error")] };
      return { state: { ...state, cwd: path }, output: [] };
    },

    cat: (state, args) => {
      if (!args.length) return { output: [line("cat: which file?", "error")] };
      const node = lookup(tree, resolvePath(state.cwd, args[0]));
      if (!node) return { output: [line(`cat: ${args[0]}: no such file`, "error")] };
      if (node.type === "dir") return { output: [line(`cat: ${args[0]}: is a directory`, "error")] };
      return { output: lines(node.text) };
    },

    open: (state, args) => {
      if (!args.length) return { output: [line("open: what? Try `open circle` or `open atlas`.", "error")] };
      const name = args.join(" ");
      const app = name.toLowerCase();
      if (APPS.includes(app)) {
        return { output: [line(`opening ${app}`)], effects: [{ type: "window", app, props: {} }] };
      }
      const node = lookup(tree, resolvePath(state.cwd, args[0]));
      if (node && node.type === "file" && node.open) {
        return { output: [line(`opening ${args[0]}`)], effects: [{ type: "window", ...node.open }] };
      }
      if (node && node.type === "file") return { output: lines(node.text) };
      if (node && node.type === "dir") {
        return {
          output: [line(`opening ${args[0]}`)],
          effects: [{ type: "window", app: "files", props: { path: resolvePath(state.cwd, args[0]) } }],
        };
      }
      const work = findWork(name);
      if (work) {
        return {
          output: [line(`opening ${work.title}`)],
          effects: [{ type: "window", app: "projects", props: { work: work.id } }],
        };
      }
      return { output: [line(`open: nothing here is called "${name}"`, "error")] };
    },

    projects: () => ({
      output: channels.flatMap((channel) => [
        line(`${channel.number} ${channel.title} (${channel.note})`, "head"),
        ...channel.works.map((id) => {
          const work = worksById.get(id);
          return line(`   ${id.padEnd(18)}${work.title}  [${work.status.join(", ")}]`);
        }),
      ]),
      effects: [{ type: "window", app: "projects", props: {} }],
    }),

    research: (state, args) => {
      const query = args.join(" ").trim();
      if (!query) {
        return {
          output: [line(`${documents.length} records in the local catalog. Inclusion is not verification.`)],
          effects: [{ type: "window", app: "atlas", props: {} }],
        };
      }
      const results = search ? search(query).slice(0, 6) : [];
      if (!results.length) {
        return { output: [line(`no records match "${query}"`)] };
      }
      return {
        output: [
          ...results.map((record) => line(`  ${String(record.date).slice(0, 4)}  ${record.title}`)),
          line("A local catalog for discovery, not verification. Opening the atlas.", "note"),
        ],
        effects: [{ type: "window", app: "atlas", props: { query } }],
      };
    },

    art: () => ({
      output: [line("opening the artwork viewer")],
      effects: [{ type: "window", app: "art", props: {} }],
    }),

    music: () => ({
      output: [line("opening the music player. Nothing plays until you ask.")],
      effects: [{ type: "window", app: "music", props: {} }],
    }),

    threads: () => ({
      output: threads.flatMap((thread) => [
        line(thread.name, "head"),
        line(`   ${thread.question}`),
        line(`   ${thread.works.map((id) => worksById.get(id).title).join(" · ")}`, "note"),
      ]),
    }),

    now: () => ({
      output: [line(now.text), line(`as of ${now.asOf}`, "note")],
      effects: [{ type: "window", app: "projects", props: { work: now.work } }],
    }),

    goto: (state, args) => {
      const room = ROOM_ALIASES[String(args[0] ?? "").toLowerCase()];
      if (!room) {
        return {
          output: [line("goto: library, workbench, simulation, gallery, music, hall, or archive", "error")],
        };
      }
      return { output: [line(`walking to ${args[0].toLowerCase()}`)], effects: [{ type: "goto", room }] };
    },

    play: () => ({
      output: [line("opening Resolve")],
      effects: [{ type: "window", app: "experiments", props: { experiment: "resolve" } }],
    }),

    chord: () => {
      const voiced = [...channels].sort((a, b) => a.frequency - b.frequency);
      return {
        output: [
          line(voiced.map((channel) => channel.note).join(" · ")),
          line(chordName ? `${chordName}. Five notes, one chord.` : "Five notes."),
        ],
        effects: [{ type: "chord" }],
      };
    },

    whoami: () => ({ output: [line("a visitor. The work belongs to " + person.name + ".")] }),

    clear: () => ({ output: [], clear: true }),

    exit: () => ({ output: [line("leaving the computer")], effects: [{ type: "exit" }] }),
  };

  const execute = (state, rawInput) => {
    const input = String(rawInput ?? "").slice(0, MAX_INPUT).trim();
    const echo = line(`${state.cwd} $ ${input}`, "echo");
    if (!input) return { state, output: [echo], effects: [] };

    const [name, ...args] = input.split(/\s+/);
    const command = Object.hasOwn(commands, name.toLowerCase())
      ? commands[name.toLowerCase()]
      : null;
    const history = [...state.history, input].slice(-50);

    if (!command) {
      return {
        state: { ...state, history },
        output: [echo, line(`${name}: command not found. Try \`help\`.`, "error")],
        effects: [],
      };
    }

    const result = command(state, args);
    return {
      state: { ...(result.state ?? state), history },
      output: result.clear ? [] : [echo, ...(result.output ?? [])],
      effects: result.effects ?? [],
      clear: Boolean(result.clear),
    };
  };

  // Tab completion: command names first, then entries of the directory the
  // partial path points into.
  const complete = (state, input) => {
    const parts = String(input).split(/\s+/);
    if (parts.length <= 1) {
      return Object.keys(commands).filter((name) => name.startsWith(parts[0].toLowerCase()));
    }
    const partial = parts[parts.length - 1];
    const slash = partial.lastIndexOf("/");
    const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : "";
    const stem = slash >= 0 ? partial.slice(slash + 1) : partial;
    const node = lookup(tree, resolvePath(state.cwd, dirPart || "."));
    if (!node || node.type !== "dir") return [];
    return listing(node)
      .filter((name) => name.toLowerCase().startsWith(stem.toLowerCase()))
      .map((name) => dirPart + name);
  };

  return {
    tree,
    initialState: { cwd: "/", history: [] },
    banner: [
      line("Vanta studio terminal. A sandbox over the portfolio, not a shell.", "note"),
      line("Type `help` to begin.", "note"),
    ],
    execute,
    complete,
    commandNames: Object.keys(commands),
  };
}

module.exports = {
  APPS,
  MAX_INPUT,
  ROOM_ALIASES,
  buildFileSystem,
  createTerminal,
  listing,
  lookup,
  resolvePath,
};

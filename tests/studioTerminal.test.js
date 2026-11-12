const assert = require("node:assert/strict");
const test = require("node:test");
const practice = require("../data/practice");
const catalog = require("../data/research/curatedKnowledge.json");
const SearchEngine = require("../lib/research/searchEngine");
const library = require("../lib/studio/library");
const signal = require("../lib/signalExperience");
const terminalModel = require("../lib/studio/terminal");

const engine = new SearchEngine(catalog);
const volumes = library.buildLibrary({ practice, documents: catalog.documents, notes: {} });
const terminal = terminalModel.createTerminal({
  practice,
  documents: catalog.documents,
  volumes,
  search: (query) => engine.search(query, { hops: 1 }).results.map((result) => result.document),
  chordName: signal.createCoda(practice.channels).chordName,
});

const run = (input, state = terminal.initialState) => terminal.execute(state, input);
const text = (result) => result.output.map((entry) => entry.text).join("\n");

test("the commands the brief names all exist and answer", () => {
  ["help", "about", "ls", "cd", "open", "projects", "research", "art", "music", "clear"].forEach(
    (name) => assert.ok(terminal.commandNames.includes(name), `${name} is a command`)
  );
  const help = text(run("help"));
  terminal.commandNames
    .filter((name) => name !== "whoami")
    .forEach((name) => assert.ok(help.includes(name), `help lists ${name}`));
  assert.ok(text(run("about")).includes(practice.person.summary));
  assert.ok(text(run("about")).includes("Vanta is the person. Vers3Dynamics is the open lab."));
});

test("the file tree is the practice model, navigable", () => {
  const root = run("ls");
  practice.channels.forEach((channel) =>
    assert.ok(text(root).includes(channel.id + "/"), `${channel.id} is a directory`)
  );
  assert.ok(text(root).includes("threads/"));
  assert.ok(text(root).includes("research/"));

  const moved = run("cd instruments");
  assert.equal(moved.state.cwd, "/instruments");
  const listing = text(run("ls", moved.state));
  ["circle.work", "drr.work", "rain.work", "circle-polygraph.webp"].forEach((name) =>
    assert.ok(listing.includes(name))
  );

  const circle = text(run("cat circle.work", moved.state));
  const work = practice.works.find((entry) => entry.id === "circle");
  assert.ok(circle.includes(work.body));
  assert.ok(circle.includes(work.detail));
  work.evidence.forEach((entry) => assert.ok(circle.includes(entry.href), "receipts are printed"));
  assert.ok(circle.includes("Open source · Prototype"), "status is stated, not embellished");

  assert.equal(run("cd library").state.cwd, "/writing", "rooms are aliases for channels");
  assert.equal(run("cd ..", moved.state).state.cwd, "/");
  assert.equal(run("pwd", moved.state).output[1].text, "/instruments");
  assert.equal(
    run("ls research").output.filter((entry) => entry.text.endsWith(".record")).length,
    catalog.documents.length
  );
});

test("the terminal is a sandbox: nothing escapes the tree or runs code", () => {
  const deep = run("cd ../../../../etc");
  assert.equal(deep.state.cwd, "/", "a path above the root goes nowhere");
  assert.match(text(deep), /no such directory/);
  assert.equal(run("cd /../..").state.cwd, "/");
  assert.equal(terminalModel.resolvePath("/music", "../../../x"), "/x");
  assert.equal(terminalModel.resolvePath("/music", "~/art/.."), "/");

  ["cat /etc/passwd", "cat ../../package.json", "cat __proto__", "ls constructor", "cd __proto__"].forEach(
    (input) => assert.equal(run(input).output.at(-1).kind, "error", `${input} is refused`)
  );
  [
    "rm -rf /",
    "sudo ls",
    "eval alert(1)",
    "node -e 1",
    "curl https://example.org",
    "constructor",
    "__proto__",
    "toString",
    "$(ls)",
    "; ls",
  ].forEach((input) => {
    const result = run(input);
    assert.match(text(result), /command not found/, `${input} is not a command`);
    assert.deepEqual(result.effects, []);
  });

  // Effects are a closed list.
  const allowed = new Set(["window", "goto", "chord", "exit"]);
  [
    "open circle", "projects", "research clock", "art", "music", "now", "goto gallery",
    "play", "chord", "exit", "open atlas", "open writing", "open /art/impasto-head.webp",
  ].forEach((input) => {
    run(input).effects.forEach((effect) => {
      assert.ok(allowed.has(effect.type), `${input} asked for an unknown effect ${effect.type}`);
      if (effect.type === "window") assert.ok(terminalModel.APPS.includes(effect.app));
    });
  });

  const long = run("x".repeat(5000));
  assert.ok(long.output[0].text.length <= terminalModel.MAX_INPUT + 8, "input is capped");
  assert.ok(Object.isFrozen(terminal.tree) === false, "sanity");
  assert.equal(terminalModel.lookup(terminal.tree, "/__proto__"), null);
  assert.equal(terminalModel.lookup(terminal.tree, "/music/constructor"), null);
});

test("open launches the right window for works, files, apps, and rooms", () => {
  assert.deepEqual(run("open circle").effects, [
    { type: "window", app: "projects", props: { work: "circle" } },
  ]);
  assert.deepEqual(run("open Lop Nur Twin").effects, [
    { type: "window", app: "projects", props: { work: "lop-nur" } },
  ]);
  assert.deepEqual(run("open /art/green-machine-cover.webp").effects, [
    { type: "window", app: "art", props: { panel: 1 } },
  ]);
  assert.deepEqual(run("open /music/green-machine-excerpt.mp3").effects, [
    { type: "window", app: "music", props: {} },
  ]);
  assert.deepEqual(run("open /writing/preprints.book").effects, [
    { type: "window", app: "reader", props: { volume: "preprints" } },
  ]);
  assert.deepEqual(run("open atlas").effects, [{ type: "window", app: "atlas", props: {} }]);
  assert.deepEqual(run("open worlds").effects, [
    { type: "window", app: "files", props: { path: "/worlds" } },
  ]);
  assert.match(text(run("open nonsense")), /nothing here is called/);
  assert.deepEqual(run("goto gallery").effects, [{ type: "goto", room: "art" }]);
  assert.deepEqual(run("goto library").effects, [{ type: "goto", room: "writing" }]);
  assert.equal(run("goto mars").effects.length, 0);
});

test("research searches the real catalog and keeps its caveat", () => {
  const result = run("research atomic clock");
  assert.ok(text(result).includes("Bounding the Scalar Coupling Constant"));
  assert.match(text(result), /not verification/);
  assert.deepEqual(result.effects, [
    { type: "window", app: "atlas", props: { query: "atomic clock" } },
  ]);
  assert.match(text(run("research zzzzqqqq")), /no records match/);
  assert.match(text(run("research")), new RegExp(`${catalog.documents.length} records`));
});

test("threads, now, and chord read from the model", () => {
  const threads = text(run("threads"));
  practice.threads.forEach((thread) => {
    assert.ok(threads.includes(thread.name));
    assert.ok(threads.includes(thread.question));
  });
  assert.ok(text(run("now")).includes(practice.now.text));
  const chord = text(run("chord"));
  assert.ok(chord.includes("G3 · C4 · E4 · G4 · C5"));
  assert.ok(chord.includes("C major"));
  assert.ok(text(run("cat /threads/agency.txt")).includes("The third is held by a person."));
});

test("history, clear, and completion behave like a terminal", () => {
  let state = terminal.initialState;
  ["ls", "cd art", "pwd"].forEach((input) => {
    state = run(input, state).state;
  });
  assert.deepEqual(state.history, ["ls", "cd art", "pwd"]);
  const cleared = run("clear", state);
  assert.equal(cleared.clear, true);
  assert.deepEqual(cleared.output, []);
  assert.deepEqual(run("", state).effects, []);

  assert.deepEqual(terminal.complete(terminal.initialState, "pro"), ["projects"]);
  assert.deepEqual(terminal.complete(terminal.initialState, "cd wo"), ["worlds/"]);
  assert.deepEqual(terminal.complete(state, "cat imp"), ["impasto-head.webp"]);
  assert.deepEqual(terminal.complete(terminal.initialState, "cat music/green-machine-e"), [
    "music/green-machine-excerpt.mp3",
  ]);
  assert.deepEqual(terminal.complete(terminal.initialState, "cat nowhere/x"), []);
});

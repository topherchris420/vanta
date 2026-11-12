// The floor plan of the studio, and everything in it a visitor can use.
//
// Nothing here is content. Rooms are the five channels of data/practice.js
// given a place to stand; objects point at works, threads, and artifacts by
// id. The scene builds geometry from these numbers, the walker collides with
// them, and the text index lists them, so the three can never disagree about
// what the studio holds.
//
// Axes: x runs east, z runs south, y is up. The visitor arrives at the south
// end of the nave looking north, down the chord's own axis: keyboard,
// workstation, Event Horizon Archive, window.

const SPEED_OF_SOUND = 343; // m/s in room-temperature air

const STUDIO = {
  bounds: { x: [-10, 10], z: [-9, 9] },
  height: 4,
  eyeHeight: 1.62,
  playerRadius: 0.32,
  reach: 2.9,
  start: { x: 0, z: 3.1, yaw: 0 },
  // The opening shot, on a long lens from the corner of the Hall: the desk,
  // the archive behind it, the slatted wall and the sunset in the windows.
  intro: { eye: [1.8, 1.58, 3.7], look: [-0.45, 1.27, -3.4] },
};

// yaw 0 looks north (-z); positive yaw turns toward the west (-x).
const ROOM_PLANS = [
  {
    id: "writing",
    name: "The Library",
    bounds: { x: [-10, -3.5], z: [-9, 0] },
    pendant: [-6.9, -4.6],
    view: { eye: [-4.6, 1.62, -2.3], look: [-8.2, 1.35, -6.4] },
  },
  {
    id: "instruments",
    name: "The Workbench",
    bounds: { x: [-10, -3.5], z: [0, 9] },
    pendant: [-6.6, 4.6],
    view: { eye: [-4.5, 1.62, 2.3], look: [-8.6, 1.2, 5.4] },
  },
  {
    id: "worlds",
    name: "The Simulation Room",
    bounds: { x: [3.5, 10], z: [0, 9] },
    pendant: [5.1, 4.5],
    view: { eye: [4.5, 1.62, 2.3], look: [9.6, 1.9, 4.9] },
  },
  {
    id: "art",
    name: "The Gallery",
    bounds: { x: [3.5, 10], z: [-9, 0] },
    pendant: [6.8, -4.6],
    view: { eye: [4.5, 1.62, -2.3], look: [8.4, 1.6, -6.6] },
  },
  {
    id: "music",
    name: "The Recording Studio",
    bounds: { x: [-3.5, 3.5], z: [4.2, 9] },
    pendant: [0, 6.2],
    view: { eye: [0, 1.62, 8.15], look: [0, 1.2, 4.6] },
  },
];

// Rest zones: places that tune no channel, like the hero and the gateway on
// the home page.
const REST_ZONES = [
  {
    id: "archive",
    name: "Event Horizon Archive",
    bounds: { x: [-3.5, 3.5], z: [-9, -4.4] },
    view: { eye: [0, 1.66, -3.2], look: [0, 1.62, -6.4] },
  },
  {
    id: "hall",
    name: "The Hall",
    bounds: { x: [-3.5, 3.5], z: [-4.4, 4.2] },
    view: { eye: [0, 1.62, 3.1], look: [0, 1.4, -6.4] },
  },
];

const box = (x0, x1, z0, z1, extra = {}) => ({
  x: [Math.min(x0, x1), Math.max(x0, x1)],
  z: [Math.min(z0, z1), Math.max(z0, z1)],
  ...extra,
});

const WALL = { wall: true };

// Full-height walls. Openings are simply the gaps between them.
const WALLS = [
  box(-10.4, 10.4, -9.4, -9, WALL), // north
  box(-10.4, 10.4, 9, 9.4, WALL), // south
  box(-10.4, -10, -9.4, 9.4, WALL), // west
  box(10, 10.4, -9.4, 9.4, WALL), // east
  // Nave partitions, each with a north and a south opening.
  box(-3.62, -3.38, -9, -3.6, WALL),
  box(-3.62, -3.38, -1, 1, WALL),
  box(-3.62, -3.38, 3.6, 9, WALL),
  box(3.38, 3.62, -9, -3.6, WALL),
  box(3.38, 3.62, -1, 1, WALL),
  box(3.38, 3.62, 3.6, 9, WALL),
  // Cross walls between the side rooms, each with one doorway.
  box(-10, -8.4, -0.12, 0.12, WALL),
  box(-6.8, -3.5, -0.12, 0.12, WALL),
  box(3.5, 6.8, -0.12, 0.12, WALL),
  box(8.4, 10, -0.12, 0.12, WALL),
];

// Where the walls are open, for door headers and for the text index.
const OPENINGS = [
  { axis: "z", at: -3.5, span: [-3.6, -1], joins: ["hall", "writing"] },
  { axis: "z", at: -3.5, span: [1, 3.6], joins: ["hall", "instruments"] },
  { axis: "z", at: 3.5, span: [-3.6, -1], joins: ["hall", "art"] },
  { axis: "z", at: 3.5, span: [1, 3.6], joins: ["hall", "worlds"] },
  { axis: "x", at: 0, span: [-8.4, -6.8], joins: ["writing", "instruments"] },
  { axis: "x", at: 0, span: [6.8, 8.4], joins: ["art", "worlds"] },
];

// Furniture the walker cannot pass through. Names are for the scene builder.
const FURNITURE = [
  box(-1.15, 1.15, -0.78, 0.12, { name: "desk" }),
  box(0.85, 1.45, 0.6, 1.2, { name: "chair" }),
  box(-3.38, -2.92, -0.8, 0.8, { name: "chimes" }),
  box(2.18, 2.72, -1.05, -0.51, { name: "softbox" }),
  box(-3.13, -2.77, -1.18, -0.82, { name: "globe-lamp" }),
  box(2.66, 3.14, 3.46, 3.94, { name: "plant-hall" }),
  box(-3.12, -2.68, -4.32, -3.88, { name: "plant-archive" }),
  box(-9.58, -9.12, -0.98, -0.52, { name: "plant-library" }),
  box(-1.55, 1.55, -7.95, -4.85, { name: "archive" }),
  // Library
  box(-8.2, -3.7, -9, -8.52, { name: "shelves-north" }),
  box(-3.98, -3.62, -8.4, -3.9, { name: "shelves-east" }),
  box(-7.95, -6.05, -5.2, -4.05, { name: "reading-table" }),
  box(-5.32, -4.68, -7.22, -6.6, { name: "lectern" }),
  box(-9.6, -8.6, -8.6, -7.6, { name: "armchair" }),
  box(-9.6, -9.2, -7.3, -6.9, { name: "floor-lamp" }),
  box(-8.52, -8.08, -4.85, -4.4, { name: "library-chair-west" }),
  box(-5.92, -5.48, -4.85, -4.4, { name: "library-chair-east" }),
  // Workbench
  box(-9.98, -9.12, 1.2, 7.8, { name: "bench-west" }),
  box(-8.6, -4.6, 8.2, 9, { name: "bench-south" }),
  box(-7.2, -6, 4, 5.2, { name: "plate-table" }),
  // Simulation room
  box(6.1, 6.7, 2.2, 2.8, { name: "plinth-pine-gap" }),
  box(6.1, 6.7, 4.2, 4.8, { name: "plinth-lop-nur" }),
  box(6.1, 6.7, 6.2, 6.8, { name: "plinth-mannahatta" }),
  box(5.2, 7.6, 8.2, 9, { name: "control-desk" }),
  // Gallery
  box(6, 7.6, -4.95, -4.25, { name: "gallery-bench" }),
  box(4.3, 4.9, -7.9, -7.3, { name: "scroll-plinth" }),
  // Recording studio
  box(-0.86, 0.86, 6.92, 7.52, { name: "synth" }),
  box(-1.55, -1.15, 6.5, 6.9, { name: "speaker-left" }),
  box(1.15, 1.55, 6.5, 6.9, { name: "speaker-right" }),
  box(-3.38, -2.8, 5.4, 7.4, { name: "credenza" }),
  box(2.8, 3.38, 5.6, 7, { name: "rack" }),
];

const COLLIDERS = [...WALLS, ...FURNITURE];

// Every object a visitor can use. `anchor` is where its marker floats, `stand`
// where the visitor is put, `view` the camera while it is open, `hit` the box
// a pointer has to land in. `ref` points into the practice model.
const OBJECTS = [
  // ------------------------------------------------------------------ hall
  {
    id: "computer",
    kind: "computer",
    room: "hall",
    verb: "Sit at the computer",
    title: "The workstation",
    anchor: [0, 1.28, -0.4],
    stand: [0, 1.05],
    view: { eye: [0, 1.31, 0.5], look: [0, 1.25, -0.42] },
    hit: { c: [0, 1.27, -0.42], s: [1.05, 0.72, 0.3] },
  },
  {
    id: "coda",
    kind: "coda",
    room: "hall",
    verb: "Sound the five chimes",
    title: "The chord",
    anchor: [-3.12, 1.55, 0],
    stand: [-1.85, 0],
    view: { eye: [-1.5, 1.62, 0], look: [-3.2, 1.9, 0] },
    hit: { c: [-3.12, 1.9, 0], s: [0.42, 2.2, 1.5] },
  },
  {
    id: "now",
    kind: "now",
    room: "hall",
    verb: "Read the note on the board",
    title: "Now",
    anchor: [3.34, 1.52, 0],
    stand: [2.1, 0],
    view: { eye: [2.2, 1.56, 0], look: [3.38, 1.5, 0] },
    hit: { c: [3.33, 1.5, 0], s: [0.12, 0.9, 1.3] },
  },
  // --------------------------------------------------------------- archive
  {
    id: "archive",
    kind: "archive",
    room: "archive",
    verb: "Approach the Event Horizon Archive",
    title: "Event Horizon Archive",
    anchor: [0, 0.98, -4.72],
    stand: [0, -3.9],
    view: { eye: [0, 1.68, -3.35], look: [0, 1.6, -6.4] },
    hit: { c: [0, 1.6, -6.4], s: [2.7, 2.4, 2.7] },
  },
  // --------------------------------------------------------------- writing
  {
    id: "shelf",
    kind: "channel",
    room: "writing",
    verb: "Browse the shelves",
    title: "The Writing collection",
    ref: { channel: "writing" },
    anchor: [-6, 1.72, -8.5],
    stand: [-6, -7.2],
    view: { eye: [-6, 1.62, -6.9], look: [-6, 1.55, -8.7] },
    hit: { c: [-5.95, 1.6, -8.74], s: [4.4, 2.9, 0.46] },
  },
  {
    id: "book-life-of-a-line",
    kind: "book",
    room: "writing",
    verb: "Open Life of a Line",
    title: "Life of a Line",
    ref: { work: "life-of-a-line", volume: "life-of-a-line" },
    anchor: [-5, 1.2, -6.9],
    stand: [-5, -5.9],
    view: { eye: [-5, 1.56, -6.2], look: [-5, 1.12, -6.92] },
    hit: { c: [-5, 1.16, -6.9], s: [0.6, 0.3, 0.5] },
  },
  {
    id: "book-location-papers",
    kind: "book",
    room: "writing",
    verb: "Read the location papers",
    title: "Location Is a Dynamic Variable",
    ref: { work: "location-papers", volume: "location-papers" },
    anchor: [-7.55, 0.9, -4.42],
    stand: [-7.55, -3.5],
    view: { eye: [-7.55, 1.5, -3.72], look: [-7.55, 0.8, -4.5] },
    hit: { c: [-7.55, 0.86, -4.42], s: [0.5, 0.2, 0.5] },
  },
  {
    id: "book-math-notebook",
    kind: "book",
    room: "writing",
    verb: "Open the research notebook",
    title: "A mathematical question worth testing",
    ref: { volume: "math-research" },
    anchor: [-6.95, 0.88, -4.4],
    stand: [-6.95, -3.5],
    view: { eye: [-6.95, 1.5, -3.72], look: [-6.95, 0.8, -4.48] },
    hit: { c: [-6.95, 0.85, -4.4], s: [0.46, 0.18, 0.5] },
  },
  {
    id: "book-epigraph",
    kind: "book",
    room: "writing",
    verb: "Open Resonant Intelligence",
    title: "Resonant Intelligence",
    ref: { volume: "resonant-intelligence" },
    anchor: [-6.38, 0.88, -4.42],
    stand: [-6.38, -3.5],
    view: { eye: [-6.38, 1.5, -3.72], look: [-6.38, 0.8, -4.5] },
    hit: { c: [-6.38, 0.85, -4.42], s: [0.46, 0.18, 0.5] },
  },
  {
    id: "book-preprints",
    kind: "book",
    room: "writing",
    verb: "Leaf through the preprints",
    title: "Preprints and manuscripts",
    ref: { volume: "preprints" },
    anchor: [-7, 0.92, -4.88],
    stand: [-7, -5.75],
    view: { eye: [-7, 1.5, -5.58], look: [-7, 0.8, -4.82] },
    hit: { c: [-7, 0.88, -4.88], s: [0.56, 0.24, 0.42] },
  },
  {
    id: "quote",
    kind: "quote",
    room: "writing",
    verb: "Read the claim on the wall",
    title: "The claim the preprints test",
    ref: { channel: "writing" },
    anchor: [-9.94, 1.72, -4.3],
    stand: [-8.85, -3.72],
    view: { eye: [-8.6, 1.64, -3.95], look: [-9.98, 1.7, -4.3] },
    hit: { c: [-9.95, 1.7, -4.3], s: [0.12, 0.8, 1.2] },
  },
  {
    id: "lamp",
    kind: "thread",
    room: "writing",
    verb: "Switch on the reading lamp",
    title: "The reading lamp",
    ref: { thread: "provenance" },
    anchor: [-9.4, 1.48, -7.1],
    stand: [-8.4, -6.5],
    view: { eye: [-7.75, 1.7, -6.05], look: [-9.9, 1.75, -7.6] },
    hit: { c: [-9.4, 1.0, -7.1], s: [0.5, 2, 0.5] },
  },
  // ----------------------------------------------------------- instruments
  {
    id: "scope",
    kind: "scope",
    room: "instruments",
    verb: "Use the signal generator",
    title: "Signal generator and oscilloscope",
    anchor: [-9.5, 1.22, 2.4],
    stand: [-8.5, 2.4],
    view: { eye: [-8.5, 1.46, 2.4], look: [-9.62, 1.14, 2.4] },
    hit: { c: [-9.52, 1.14, 2.4], s: [0.62, 0.5, 1.3] },
  },
  {
    id: "fork",
    kind: "thread",
    room: "instruments",
    verb: "Strike the tuning fork",
    title: "The tuning fork",
    ref: { thread: "resonance" },
    anchor: [-9.45, 1.14, 4.5],
    stand: [-8.5, 4.5],
    view: { eye: [-8.56, 1.46, 4.5], look: [-9.52, 1.06, 4.5] },
    hit: { c: [-9.45, 1.08, 4.5], s: [0.4, 0.4, 0.4] },
  },
  {
    id: "work-circle",
    kind: "work",
    room: "instruments",
    verb: "Inspect CIRCLE",
    title: "CIRCLE",
    ref: { work: "circle", figure: "instruments" },
    anchor: [-9.94, 1.72, 6.8],
    stand: [-8.5, 6.8],
    view: { eye: [-8.3, 1.6, 6.8], look: [-9.98, 1.5, 6.8] },
    hit: { c: [-9.8, 1.42, 6.8], s: [0.5, 1.3, 1.5] },
  },
  {
    id: "chladni",
    kind: "chladni",
    room: "instruments",
    verb: "Drive the resonance plate",
    title: "Resonance plate",
    anchor: [-6.6, 1.02, 4.6],
    stand: [-5.3, 4.6],
    view: { eye: [-5.62, 1.78, 4.6], look: [-6.62, 0.92, 4.6] },
    hit: { c: [-6.6, 0.98, 4.6], s: [1, 0.3, 1] },
  },
  {
    id: "work-drr",
    kind: "work",
    room: "instruments",
    verb: "Read the failed benchmark",
    title: "Dynamic Resonance Rooting",
    ref: { work: "drr" },
    anchor: [-7.6, 1.6, 8.94],
    stand: [-7.6, 7.5],
    view: { eye: [-7.6, 1.58, 7.62], look: [-7.6, 1.55, 8.98] },
    hit: { c: [-7.6, 1.55, 8.9], s: [1.1, 0.9, 0.2] },
  },
  {
    id: "work-rain",
    kind: "work",
    room: "instruments",
    verb: "Inspect the R.A.I.N. Lab box",
    title: "R.A.I.N. Lab",
    ref: { work: "rain" },
    anchor: [-5.6, 1.2, 8.55],
    stand: [-5.6, 7.5],
    view: { eye: [-5.6, 1.5, 7.66], look: [-5.6, 1.08, 8.6] },
    hit: { c: [-5.6, 1.1, 8.55], s: [0.7, 0.4, 0.5] },
  },
  // ---------------------------------------------------------------- worlds
  {
    id: "work-pine-gap",
    kind: "world",
    room: "worlds",
    verb: "Inspect Pine Gap",
    title: "Pine Gap",
    ref: { work: "pine-gap", figure: "worlds" },
    anchor: [6.4, 1.3, 2.5],
    stand: [5.2, 2.5],
    view: { eye: [4.95, 1.62, 2.5], look: [6.6, 1.25, 2.5] },
    hit: { c: [6.4, 1.15, 2.5], s: [0.7, 0.7, 0.7] },
  },
  {
    id: "work-lop-nur",
    kind: "world",
    room: "worlds",
    verb: "Inspect Lop Nur Twin",
    title: "Lop Nur Twin",
    ref: { work: "lop-nur" },
    anchor: [6.4, 1.3, 4.5],
    stand: [5.2, 4.5],
    view: { eye: [4.95, 1.62, 4.5], look: [6.6, 1.25, 4.5] },
    hit: { c: [6.4, 1.15, 4.5], s: [0.7, 0.7, 0.7] },
  },
  {
    id: "work-mannahatta",
    kind: "world",
    room: "worlds",
    verb: "Inspect Mannahatta",
    title: "Mannahatta",
    ref: { work: "mannahatta" },
    anchor: [6.4, 1.3, 6.5],
    stand: [5.2, 6.5],
    view: { eye: [4.95, 1.62, 6.5], look: [6.6, 1.25, 6.5] },
    hit: { c: [6.4, 1.15, 6.5], s: [0.7, 0.7, 0.7] },
  },
  {
    id: "seats",
    kind: "thread",
    room: "worlds",
    verb: "Pick up the second controller",
    title: "Two controllers, one input path",
    ref: { thread: "agency" },
    anchor: [6.4, 1.04, 8.5],
    stand: [6.4, 7.5],
    view: { eye: [6.4, 1.5, 7.62], look: [6.4, 0.96, 8.56] },
    hit: { c: [6.4, 1.0, 8.5], s: [1.3, 0.3, 0.5] },
  },
  // ------------------------------------------------------------------- art
  {
    id: "art-0",
    kind: "artwork",
    room: "art",
    verb: "Look closely at the painting",
    title: "Painting",
    ref: { panel: 0, related: "exhibitions" },
    anchor: [6.75, 1.78, -8.92],
    stand: [6.75, -6.85],
    view: { eye: [6.75, 1.72, -6.72], look: [6.75, 1.78, -8.98] },
    hit: { c: [6.75, 1.78, -8.92], s: [1.5, 1.8, 0.2] },
  },
  {
    id: "art-1",
    kind: "artwork",
    room: "art",
    verb: "Look closely at the Green Machine painting",
    title: "Painting; the cover of Green Machine",
    ref: { panel: 1, related: "green-machine" },
    anchor: [9.92, 1.72, -6.3],
    stand: [8.1, -6.3],
    view: { eye: [8.2, 1.7, -6.3], look: [9.98, 1.72, -6.3] },
    hit: { c: [9.92, 1.72, -6.3], s: [0.2, 1.4, 1.4] },
  },
  {
    id: "art-2",
    kind: "artwork",
    room: "art",
    verb: "Look closely at the cymatics still",
    title: "Circular bloom, 432 Hz",
    ref: { panel: 2, related: "cymatics" },
    anchor: [9.92, 1.72, -3],
    stand: [8.1, -3],
    view: { eye: [8.2, 1.7, -3], look: [9.98, 1.72, -3] },
    hit: { c: [9.92, 1.72, -3], s: [0.2, 1.4, 1.4] },
  },
  {
    id: "work-exhibitions",
    kind: "work",
    room: "art",
    verb: "Read the exhibition card",
    title: "Rooms",
    ref: { work: "exhibitions" },
    anchor: [5.2, 1.52, -0.16],
    stand: [5.2, -1.55],
    view: { eye: [5.2, 1.56, -1.42], look: [5.2, 1.5, -0.14] },
    hit: { c: [5.2, 1.5, -0.2], s: [0.9, 0.7, 0.16] },
  },
  {
    id: "work-cymatics",
    kind: "work",
    room: "art",
    verb: "Read the Cymatics placard",
    title: "Cymatics",
    ref: { work: "cymatics" },
    anchor: [9.94, 1.4, -1.9],
    stand: [8.5, -1.9],
    view: { eye: [8.62, 1.5, -1.9], look: [9.98, 1.4, -1.9] },
    hit: { c: [9.92, 1.4, -1.9], s: [0.16, 0.5, 0.6] },
  },
  {
    id: "work-signal-lab",
    kind: "work",
    room: "art",
    verb: "Unroll Signal Lab",
    title: "Signal Lab",
    ref: { work: "signal-lab" },
    anchor: [4.6, 1.2, -7.6],
    stand: [5.05, -6.4],
    view: { eye: [5, 1.56, -6.5], look: [4.6, 1.08, -7.6] },
    hit: { c: [4.6, 1.12, -7.6], s: [0.6, 0.4, 0.6] },
  },
  // ----------------------------------------------------------------- music
  {
    id: "keyboard",
    kind: "keyboard",
    room: "music",
    verb: "Play the synthesizer",
    title: "The synthesizer",
    anchor: [0, 1.1, 7.2],
    stand: [0, 8.15],
    view: { eye: [0, 1.6, 8.3], look: [0, 1.14, 5.2] },
    hit: { c: [0, 0.98, 7.22], s: [1.7, 0.4, 0.6] },
  },
  {
    id: "record",
    kind: "record",
    room: "music",
    verb: "Put on Green Machine",
    title: "Green Machine",
    ref: { work: "green-machine" },
    anchor: [-3.05, 1.02, 6],
    stand: [-1.95, 5.75],
    view: { eye: [-2, 1.5, 5.9], look: [-3.12, 0.9, 6.3] },
    hit: { c: [-3.08, 1.02, 6.4], s: [0.56, 0.6, 1.9] },
  },
  {
    id: "patch",
    kind: "thread",
    room: "music",
    verb: "Patch the loose cable",
    title: "The loose patch cable",
    ref: { thread: "translation" },
    anchor: [2.92, 1.22, 6.3],
    stand: [1.95, 5.95],
    view: { eye: [2, 1.5, 6.1], look: [3.05, 1.16, 6.32] },
    hit: { c: [3.02, 1.2, 6.3], s: [0.5, 1.5, 1.4] },
  },
];

// Small things worth finding. Each is completed by really doing the thing.
const DISCOVERIES = [
  { id: "lamp", title: "Light to read by", hint: "Something in the Library switches on." },
  { id: "provenance", title: "Provenance", hint: "A thread shows under the lamp." },
  { id: "agency", title: "Agency", hint: "The Simulation Room has a second seat." },
  { id: "translation", title: "Translation", hint: "One cable in the Recording Studio is not plugged in." },
  { id: "resonance", title: "Resonance", hint: "Something on the Workbench rings when struck." },
  { id: "third-note", title: "The third note", hint: "Two notes sound. The third is held by a person." },
  { id: "record", title: "Side A", hint: "A record is waiting by the turntable." },
  { id: "write-event", title: "A write event", hint: "The archive holds more than one index." },
  { id: "resolved", title: "In tune", hint: "Five strings are waiting to be tuned." },
  { id: "coda", title: "One chord", hint: "Five chimes hang in the Hall." },
];

const within = (bounds, x, z) =>
  x >= bounds.x[0] && x <= bounds.x[1] && z >= bounds.z[0] && z <= bounds.z[1];

// The wavelength of a note in air. Each room's pendant hangs exactly this far
// below the ceiling, so the lowest note has the longest lamp.
const wavelengthOf = (frequency) => SPEED_OF_SOUND / frequency;

// Join the floor plan to the practice model. Throws when the studio and the
// model disagree, which is what keeps a work from going missing in the walls.
function buildStudioLayout(practice) {
  const fail = (message) => {
    throw new Error("Studio layout: " + message);
  };
  const channelsById = new Map(practice.channels.map((c) => [c.id, c]));
  const worksById = new Map(practice.works.map((w) => [w.id, w]));
  const threadsById = new Map(practice.threads.map((t) => [t.id, t]));

  const rooms = ROOM_PLANS.map((plan) => {
    const channel = channelsById.get(plan.id);
    if (!channel) fail(`room ${plan.id} has no channel.`);
    const drop = wavelengthOf(channel.frequency);
    return {
      ...plan,
      kind: "channel",
      channel: channel.id,
      number: channel.number,
      note: channel.note,
      frequency: channel.frequency,
      lede: channel.lede,
      pendant: {
        x: plan.pendant[0],
        z: plan.pendant[1],
        drop: Number(drop.toFixed(3)),
        y: Number((STUDIO.height - drop).toFixed(3)),
      },
    };
  });
  if (rooms.length !== practice.channels.length) {
    fail("every channel needs exactly one room.");
  }
  practice.channels.forEach((channel) => {
    if (!rooms.some((room) => room.channel === channel.id)) {
      fail(`channel ${channel.id} has no room.`);
    }
  });

  const zones = [
    ...rooms,
    ...REST_ZONES.map((zone) => ({ ...zone, kind: "rest" })),
  ];
  const zoneIds = new Set(zones.map((zone) => zone.id));

  const objects = OBJECTS.map((object) => {
    if (!zoneIds.has(object.room)) fail(`${object.id} is in unknown room ${object.room}.`);
    const ref = object.ref || {};
    if (ref.work && !worksById.has(ref.work)) fail(`${object.id} names unknown work ${ref.work}.`);
    if (ref.thread && !threadsById.has(ref.thread)) fail(`${object.id} names unknown thread ${ref.thread}.`);
    if (ref.channel && !channelsById.has(ref.channel)) fail(`${object.id} names unknown channel ${ref.channel}.`);
    if (ref.related && !worksById.has(ref.related)) fail(`${object.id} names unknown related work ${ref.related}.`);
    if (ref.panel !== undefined) {
      const art = channelsById.get("art");
      if (!art || art.artifact.kind !== "gallery" || !art.artifact.panels[ref.panel]) {
        fail(`${object.id} hangs a painting the Art channel does not have.`);
      }
    }
    return { ...object, ref };
  });

  const ids = new Set();
  objects.forEach((object) => {
    if (ids.has(object.id)) fail(`duplicate object ${object.id}.`);
    ids.add(object.id);
  });

  // Every work on the home page has somewhere to be found, in its own room.
  practice.works.forEach((work) => {
    const holder = objects.find((object) => object.ref.work === work.id);
    if (!holder) fail(`work ${work.id} has no object in the studio.`);
    if (holder.room !== work.channel) {
      fail(`${work.id} lives in ${work.channel} but its object is in ${holder.room}.`);
    }
  });
  // Every thread is hidden in a room it actually spans.
  practice.threads.forEach((thread) => {
    const holder = objects.find((object) => object.ref.thread === thread.id);
    if (!holder) fail(`thread ${thread.id} has no object in the studio.`);
    const spans = new Set(thread.works.map((id) => worksById.get(id).channel));
    if (!spans.has(holder.room)) {
      fail(`thread ${thread.id} is hidden in ${holder.room}, which it does not span.`);
    }
  });

  return {
    studio: STUDIO,
    rooms,
    zones,
    walls: WALLS,
    openings: OPENINGS,
    furniture: FURNITURE,
    colliders: COLLIDERS,
    objects,
    discoveries: DISCOVERIES,
  };
}

// Which zone a point on the floor belongs to. Channel rooms win over rest
// zones, and anything outside every zone reads as the hall.
const zoneAt = (zones, x, z) =>
  zones.find((zone) => zone.kind === "channel" && within(zone.bounds, x, z)) ??
  zones.find((zone) => within(zone.bounds, x, z)) ??
  zones.find((zone) => zone.id === "hall");

// The guided tour: one stop per room, in the order the home page plays them,
// ending on the chord. Copy comes from the practice model, never from here.
function buildTour(layout, practice) {
  const zone = (id) => layout.zones.find((entry) => entry.id === id);
  const object = (id) => layout.objects.find((entry) => entry.id === id);
  const stops = [
    {
      id: "hall",
      room: "hall",
      title: "Five notes. One chord.",
      text: practice.person.summary,
      view: zone("hall").view,
    },
    ...practice.channels.map((channel) => {
      const room = zone(channel.id);
      return {
        id: channel.id,
        room: channel.id,
        title: `${room.name} · ${channel.title}, ${channel.note}`,
        text: channel.lede,
        view: room.view,
      };
    }),
    {
      id: "archive",
      room: "archive",
      title: "Event Horizon Archive",
      text: "The whole practice written to one surface. Cross it to reach the research atlas: the sources underneath the work.",
      view: zone("archive").view,
    },
    {
      id: "coda",
      room: "hall",
      title: "The chord",
      text: "Five chimes, one for each room. Sound them together and the headline is arithmetic.",
      view: object("coda").view,
      object: "coda",
    },
  ];
  return stops;
}

module.exports = {
  COLLIDERS,
  DISCOVERIES,
  FURNITURE,
  OBJECTS,
  OPENINGS,
  REST_ZONES,
  ROOM_PLANS,
  SPEED_OF_SOUND,
  STUDIO,
  WALLS,
  buildStudioLayout,
  buildTour,
  wavelengthOf,
  within,
  zoneAt,
};

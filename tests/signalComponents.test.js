const assert = require("node:assert/strict");
const test = require("node:test");
const signal = require("../lib/signalExperience");

const channels = [
  {
    id: "books",
    number: "01",
    title: "Books",
    note: "Foundational texts",
    frequency: 261.63,
    primaryLabel: "Read poetry book",
    primaryHref: "https://a.co/d/078d1kaa",
    secondaryLabel: "Intro to Quantum",
    secondaryHref: "https://woodyard.streamlit.app/",
  },
  {
    id: "apps",
    number: "02",
    title: "Apps",
    note: "Interactive systems",
    frequency: 329.63,
    primaryLabel: "Explore AI/ML Projects",
    primaryHref: "https://huggingface.co/spaces/ciaochris/vers3dynamics-cymatics",
    secondaryLabel: "James Library",
    secondaryHref: "https://github.com/topherchris420/james_library",
  },
  {
    id: "art",
    number: "03",
    title: "Art",
    note: "Spatial fragments",
    frequency: 392,
    primaryLabel: "View Oncyber Gallery",
    primaryHref: "https://oncyber.io/stanfordgsb",
    secondaryLabel: "See MADS Gallery Feature",
    secondaryHref:
      "https://madsgallery.art/item/085ddf21-f2f3-44d1-837b-6794109262af/artist/christopher-woodyard/",
  },
  {
    id: "frequency",
    number: "04",
    title: "Frequency",
    note: "Consciousness engine",
    frequency: 523.25,
    primaryLabel: "Open Frequency Experience",
    primaryHref: "https://woodyard.dappling.network",
    secondaryLabel: "Read Inspiration Source",
    secondaryHref:
      "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:254ea155-1ada-417d-8f60-4395a09faaf7",
  },
  {
    id: "music",
    number: "05",
    title: "Music",
    note: "Auditory geometry",
    frequency: 196,
    primaryLabel: "Listen on Bandcamp",
    primaryHref: "https://chriswoodyard.bandcamp.com/",
    secondaryLabel: "Play Featured Track",
    secondaryHref:
      "https://chriswoodyard.bandcamp.com/track/creators-innovators",
  },
];

test("frequency rail items expose hero-first anchor order and current state", () => {
  const heroItems = signal.createFrequencyRailItems(channels, "hero");

  assert.deepEqual(
    heroItems.map(({ href, number, label, current }) => ({
      href,
      number,
      label,
      current,
    })),
    [
      { href: "#top", number: "00", label: "Signal", current: "location" },
      {
        href: "#signal-books",
        number: "01",
        label: "Books",
        current: undefined,
      },
      {
        href: "#signal-apps",
        number: "02",
        label: "Apps",
        current: undefined,
      },
      {
        href: "#signal-art",
        number: "03",
        label: "Art",
        current: undefined,
      },
      {
        href: "#signal-frequency",
        number: "04",
        label: "Frequency",
        current: undefined,
      },
      {
        href: "#signal-music",
        number: "05",
        label: "Music",
        current: undefined,
      },
    ]
  );

  const musicItems = signal.createFrequencyRailItems(channels, "music");
  assert.equal(musicItems[0].current, undefined);
  assert.equal(musicItems[5].current, "location");
});

test("project channel view returns semantic ids, ordering, active state, and evidence links", () => {
  const firstView = signal.createProjectChannelView(channels[0], 0, false);
  assert.equal(firstView.sectionId, "signal-books");
  assert.equal(firstView.headingId, "signal-title-books");
  assert.equal(firstView.direction, "forward");
  assert.equal(firstView.active, false);
  assert.equal(firstView.frequencyLabel, "261.63 Hz");
  assert.deepEqual(firstView.evidenceLinks, [
    { href: "https://a.co/d/078d1kaa", label: "Read poetry book" },
    { href: "https://woodyard.streamlit.app/", label: "Intro to Quantum" },
  ]);

  const reverseView = signal.createProjectChannelView(channels[3], 3, true);
  assert.equal(reverseView.sectionId, "signal-frequency");
  assert.equal(reverseView.headingId, "signal-title-frequency");
  assert.equal(reverseView.direction, "reverse");
  assert.equal(reverseView.active, true);
  assert.equal(reverseView.frequencyLabel, "523.25 Hz");
  assert.deepEqual(reverseView.evidenceLinks, [
    {
      href: "https://woodyard.dappling.network",
      label: "Open Frequency Experience",
    },
    {
      href: "https://acrobat.adobe.com/id/urn:aaid:sc:VA6C2:254ea155-1ada-417d-8f60-4395a09faaf7",
      label: "Read Inspiration Source",
    },
  ]);
});

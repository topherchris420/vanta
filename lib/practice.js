// Integrity rules and derived views for data/practice.js. Nothing here adds
// content; it only checks the model and reads relationships out of it.

const STATUSES = [
  "Live",
  "Open source",
  "Published",
  "Preprint",
  "Paper",
  "Exhibited",
  "Recorded",
  "Simulation",
  "Experiment",
  "Prototype",
];

const ARTIFACT_KINDS = ["quote", "figure", "gallery", "recording"];

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const isSitePath = (value) => typeof value === "string" && /^\/[\w./-]+$/.test(value);

function validatePractice({ channels, works, threads, now }) {
  const fail = (message) => {
    throw new Error("Practice model: " + message);
  };

  if (!Array.isArray(channels) || channels.length !== 5) {
    fail("the instrument has exactly five channels.");
  }

  const channelIds = new Set(channels.map((channel) => channel.id));
  const workIds = new Set();

  works.forEach((work) => {
    if (!work.id || workIds.has(work.id)) fail(`duplicate or missing work id ${work.id}.`);
    workIds.add(work.id);
    if (!channelIds.has(work.channel)) fail(`${work.id} lives in unknown channel ${work.channel}.`);
    if (!work.title || !work.body) fail(`${work.id} needs a title and a body.`);
    if (!Array.isArray(work.status) || work.status.length === 0 || work.status.length > 3) {
      fail(`${work.id} needs one to three statuses.`);
    }
    work.status.forEach((status) => {
      if (!STATUSES.includes(status)) fail(`${work.id} has unknown status ${status}.`);
    });
    if (!Array.isArray(work.evidence) || work.evidence.length === 0) {
      fail(`${work.id} makes a claim without a receipt.`);
    }
    work.evidence.forEach((link) => {
      if (!link.label || !isHttpUrl(link.href)) fail(`${work.id} has an invalid evidence link.`);
    });
    (work.alsoIn || []).forEach((id) => {
      if (!channelIds.has(id) || id === work.channel) {
        fail(`${work.id} resonates in an invalid channel ${id}.`);
      }
    });
  });

  channels.forEach((channel, index) => {
    if (channel.number !== String(index + 1).padStart(2, "0")) {
      fail("channel numbers run 01 through 05.");
    }
    if (!Array.isArray(channel.works) || channel.works.length === 0) {
      fail(`${channel.id} has no works.`);
    }
    channel.works.forEach((id) => {
      const work = works.find((candidate) => candidate.id === id);
      if (!work) fail(`${channel.id} lists unknown work ${id}.`);
      if (work.channel !== channel.id) fail(`${id} is listed in ${channel.id} but lives in ${work.channel}.`);
    });
    const artifact = channel.artifact;
    if (!artifact || !ARTIFACT_KINDS.includes(artifact.kind)) {
      fail(`${channel.id} needs a real artifact.`);
    }
    const sources =
      artifact.kind === "gallery"
        ? artifact.panels.map((panel) => panel.src)
        : artifact.src
          ? [artifact.src]
          : [];
    sources.forEach((src) => {
      if (!isSitePath(src)) fail(`${channel.id} artifact must be served from this site.`);
    });
  });

  works.forEach((work) => {
    const listed = channels.find((channel) => channel.id === work.channel).works;
    if (!listed.includes(work.id)) fail(`${work.id} is not listed by its channel.`);
  });

  threads.forEach((thread) => {
    if (!thread.id || !thread.name || !thread.question) fail("threads need an id, name, and question.");
    thread.works.forEach((id) => {
      if (!workIds.has(id)) fail(`thread ${thread.id} names unknown work ${id}.`);
    });
    if (threadChannels(thread, works).length < 2) {
      fail(`thread ${thread.id} must connect at least two channels.`);
    }
  });

  if (!now || !workIds.has(now.work) || !now.text) fail("now must point at a work.");

  return true;
}

// The channels a thread touches, in instrument order.
function threadChannels(thread, works, channels) {
  const touched = new Set(
    thread.works.map((id) => works.find((work) => work.id === id)?.channel).filter(Boolean)
  );
  return channels
    ? channels.filter((channel) => touched.has(channel.id)).map((channel) => channel.id)
    : Array.from(touched);
}

// The notes sounded when a thread is tuned: one frequency per channel touched.
function threadChord(thread, works, channels) {
  const ids = threadChannels(thread, works, channels);
  return channels
    .filter((channel) => ids.includes(channel.id))
    .map((channel) => channel.frequency);
}

// Threads a work belongs to, for "also carries" annotations.
function threadsForWork(workId, threads) {
  return threads.filter((thread) => thread.works.includes(workId));
}

module.exports = {
  ARTIFACT_KINDS,
  STATUSES,
  threadChannels,
  threadChord,
  threadsForWork,
  validatePractice,
};

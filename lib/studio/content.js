// Everything the studio page shows, assembled once from the canonical model.
// Pure and node-testable: the page renders what this returns and never
// restates a work, a status, or a link of its own.

const signalExperience = require("../signalExperience");
const practiceModel = require("../practice");
const layoutModel = require("./layout");
const library = require("./library");

const { createCoda } = signalExperience;
const { threadChannels, threadChord, threadsForWork, validatePractice } = practiceModel;

// The works a visitor can open right now in another tab, with the first link
// the work itself offers. Status decides, not taste: only works marked Live.
const liveExperiences = (practice) =>
  practice.works
    .filter((work) => work.status.includes("Live"))
    .map((work) => {
      const link =
        work.evidence.find((entry) => !/github\.com/.test(entry.href)) ?? work.evidence[0];
      return {
        id: work.id,
        title: work.title,
        channel: work.channel,
        status: work.status,
        label: link.label,
        href: link.href,
        source: work.evidence.find((entry) => /github\.com/.test(entry.href)) ?? null,
      };
    });

// Every image the portfolio holds, with the channel it belongs to and the
// works it is associated with in the studio.
const artworks = (practice) => {
  const images = [];
  practice.channels.forEach((channel) => {
    const { artifact } = channel;
    if (artifact.kind === "gallery") {
      artifact.panels.forEach((panel, index) => images.push({ ...panel, id: `${channel.id}-${index}`, channel: channel.id, panel: index }));
    } else if (artifact.kind === "figure") {
      images.push({ ...artifact, id: channel.id, channel: channel.id });
    }
  });
  return images;
};

function buildStudioContent({ practice, documents = [], notes = {} }) {
  validatePractice(practice);
  const layout = layoutModel.buildStudioLayout(practice);
  const tour = layoutModel.buildTour(layout, practice);
  const volumes = library.buildLibrary({ practice, documents, notes });
  const coda = createCoda(practice.channels);
  const worksById = Object.fromEntries(practice.works.map((work) => [work.id, work]));
  const channelsById = Object.fromEntries(practice.channels.map((channel) => [channel.id, channel]));

  const threads = practice.threads.map((thread) => ({
    ...thread,
    channelIds: threadChannels(thread, practice.works, practice.channels),
    frequencies: threadChord(thread, practice.works, practice.channels),
    notes: threadChannels(thread, practice.works, practice.channels).map((id) => channelsById[id].note),
    hiddenIn: layout.objects.find((object) => object.ref.thread === thread.id)?.id ?? null,
  }));

  // Where each work can be found, so a list in the computer can send the
  // visitor to the object in the room.
  const objectForWork = Object.fromEntries(
    practice.works.map((work) => [work.id, layout.objects.find((object) => object.ref.work === work.id)?.id ?? null])
  );

  const threadsForWorkId = Object.fromEntries(
    practice.works.map((work) => [work.id, threadsForWork(work.id, practice.threads).map((thread) => thread.id)])
  );

  return {
    layout,
    tour,
    volumes,
    coda,
    threads,
    worksById,
    channelsById,
    objectForWork,
    threadsForWorkId,
    live: liveExperiences(practice),
    artworks: artworks(practice),
    recordCount: documents.length,
  };
}

module.exports = { artworks, buildStudioContent, liveExperiences };

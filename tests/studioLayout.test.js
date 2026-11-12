const assert = require("node:assert/strict");
const test = require("node:test");
const practice = require("../data/practice");
const layoutModel = require("../lib/studio/layout");
const nav = require("../lib/studio/navigation");

const layout = layoutModel.buildStudioLayout(practice);

test("every channel is a room and every work is an object in its own room", () => {
  assert.deepEqual(
    layout.rooms.map((room) => room.channel).sort(),
    practice.channels.map((channel) => channel.id).sort()
  );
  practice.works.forEach((work) => {
    const holder = layout.objects.find((object) => object.ref.work === work.id);
    assert.ok(holder, `${work.id} can be found in the studio`);
    assert.equal(holder.room, work.channel);
  });
});

test("the studio refuses a practice model it cannot house", () => {
  const extra = {
    ...practice,
    works: [
      ...practice.works,
      { ...practice.works[0], id: "unhoused", channel: "music" },
    ],
  };
  assert.throws(() => layoutModel.buildStudioLayout(extra), /unhoused has no object/);
  assert.throws(
    () => layoutModel.buildStudioLayout({ ...practice, channels: practice.channels.slice(0, 4) }),
    /has no channel/
  );
});

test("each thread is hidden in a room it actually spans", () => {
  practice.threads.forEach((thread) => {
    const holder = layout.objects.find((object) => object.ref.thread === thread.id);
    assert.ok(holder, `${thread.id} is hidden somewhere`);
    const spans = thread.works.map((id) => practice.works.find((work) => work.id === id).channel);
    assert.ok(spans.includes(holder.room), `${thread.id} is in a room it spans`);
  });
});

test("each pendant hangs one wavelength of its room's note below the ceiling", () => {
  layout.rooms.forEach((room) => {
    assert.ok(Math.abs(room.pendant.drop - 343 / room.frequency) < 0.001);
    assert.ok(Math.abs(room.pendant.y + room.pendant.drop - layout.studio.height) < 0.001);
    assert.ok(room.pendant.y > 2.1, `${room.id} pendant clears a visitor's head`);
  });
  const byPitch = [...layout.rooms].sort((a, b) => a.frequency - b.frequency);
  byPitch.reduce((previous, room) => {
    if (previous) assert.ok(room.pendant.drop < previous.pendant.drop, "lower notes hang longer");
    return room;
  }, null);
  assert.equal(byPitch[0].channel, "music", "G3 is the lowest note and the longest lamp");
});

test("objects are placed where a visitor can stand and reach them", () => {
  const { bounds, playerRadius, reach } = layout.studio;
  layout.objects.forEach((object) => {
    const [sx, sz] = object.stand;
    assert.ok(layoutModel.within(bounds, sx, sz), `${object.id} stand is indoors`);
    assert.ok(
      !nav.isBlocked(sx, sz, playerRadius, layout.colliders),
      `${object.id} stand is not inside furniture or a wall`
    );
    const [ax, , az] = object.anchor;
    assert.ok(Math.hypot(ax - sx, az - sz) <= reach, `${object.id} is within reach of its stand`);
    assert.equal(layoutModel.zoneAt(layout.zones, ax, az).id, object.room, `${object.id} sits in its room`);
    assert.ok(nav.hasLineOfSight(sx, sz, ax, az, layout.colliders), `${object.id} is visible from its stand`);
    assert.ok(object.verb && object.title, `${object.id} names what it does`);
    const [ex, , ez] = object.view.eye;
    assert.ok(
      !nav.isBlocked(ex, ez, 0.12, layout.walls),
      `${object.id} view is not inside a wall`
    );
  });
});

test("every object and every room can be walked to from the entrance", () => {
  const from = { x: layout.studio.start.x, z: layout.studio.start.z };
  const targets = [
    ...layout.objects.map((object) => ({ id: object.id, x: object.stand[0], z: object.stand[1] })),
    ...layout.zones.map((zone) => ({ id: zone.id, x: zone.view.eye[0], z: zone.view.eye[2] })),
  ];
  targets.forEach((target) => {
    const path = nav.findPath(from, target, layout);
    assert.ok(path && path.length >= 2, `a route exists to ${target.id}`);
    for (let index = 1; index < path.length; index += 1) {
      assert.ok(
        !nav.segmentBlocked(
          path[index - 1].x, path[index - 1].z,
          path[index].x, path[index].z,
          layout.colliders, layout.studio.playerRadius * 0.6
        ),
        `the route to ${target.id} keeps clear of walls and furniture`
      );
    }
    const end = path[path.length - 1];
    assert.ok(Math.hypot(end.x - target.x, end.z - target.z) < 0.01);
  });
});

test("zones tune like the home page: rooms are channels, the rest is standby", () => {
  const at = (x, z) => layoutModel.zoneAt(layout.zones, x, z);
  assert.equal(at(-7, -5).id, "writing");
  assert.equal(at(-7, 5).id, "instruments");
  assert.equal(at(7, 5).id, "worlds");
  assert.equal(at(7, -5).id, "art");
  assert.equal(at(0, 7).id, "music");
  assert.equal(at(0, 0).kind, "rest");
  assert.equal(at(0, -6).id, "archive");
  assert.equal(at(layout.studio.start.x, layout.studio.start.z).id, "hall", "a visit begins untuned");
});

test("the tour visits every room once and ends on the chord", () => {
  const tour = layoutModel.buildTour(layout, practice);
  assert.equal(tour.length, practice.channels.length + 3);
  assert.equal(tour[0].text, practice.person.summary);
  practice.channels.forEach((channel) => {
    const stop = tour.find((entry) => entry.id === channel.id);
    assert.equal(stop.text, channel.lede, "tour copy comes from the practice model");
  });
  assert.equal(tour[tour.length - 1].object, "coda");
});

test("a walker accelerates, coasts to a stop, and slides along walls", () => {
  let walker = { x: 0, z: 3, vx: 0, vz: 0, yaw: 0 };
  walker = nav.stepWalker(walker, { forward: 1 }, 1 / 60, layout.colliders);
  const firstSpeed = Math.hypot(walker.vx, walker.vz);
  assert.ok(firstSpeed > 0 && firstSpeed < nav.WALK.speed, "speed builds rather than snapping");
  assert.ok(walker.z < 3, "forward at yaw 0 is north");

  for (let frame = 0; frame < 30; frame += 1) {
    walker = nav.stepWalker(walker, { forward: 1 }, 1 / 60, layout.colliders);
  }
  assert.ok(Math.abs(Math.hypot(walker.vx, walker.vz) - nav.WALK.speed) < 0.15);

  for (let frame = 0; frame < 4; frame += 1) {
    walker = nav.stepWalker(walker, {}, 1 / 60, layout.colliders);
  }
  assert.ok(Math.hypot(walker.vx, walker.vz) > 0.2, "a released key coasts");
  for (let frame = 0; frame < 90; frame += 1) {
    walker = nav.stepWalker(walker, {}, 1 / 60, layout.colliders);
  }
  assert.equal(Math.hypot(walker.vx, walker.vz), 0, "and then rests");

  // Walk hard into the west partition: never through it.
  let pusher = { x: -2.6, z: 0.4, vx: 0, vz: 0, yaw: Math.PI / 2 };
  for (let frame = 0; frame < 120; frame += 1) {
    pusher = nav.stepWalker(pusher, { forward: 1 }, 1 / 60, layout.colliders);
    assert.ok(pusher.x > -3.38 + 0.31, "the partition holds");
  }
  // Leaning along it turns the blocked motion into a slide.
  const before = pusher.z;
  for (let frame = 0; frame < 20; frame += 1) {
    pusher = nav.stepWalker(pusher, { forward: 1, strafe: 0.5 }, 1 / 60, layout.colliders);
    assert.ok(pusher.x > -3.38 + 0.31);
  }
  assert.ok(pusher.z < before - 0.1, "blocked motion slides along the wall");
});

test("no walk can leave the building", () => {
  const random = (() => {
    let state = 7;
    return () => {
      state = (state * 16807) % 2147483647;
      return state / 2147483647;
    };
  })();
  let walker = { x: 0, z: 3, vx: 0, vz: 0, yaw: 0 };
  for (let frame = 0; frame < 6000; frame += 1) {
    walker = nav.stepWalker(
      walker,
      { forward: 1, strafe: random() - 0.5, turn: random() * 2 - 1, run: true },
      1 / 30,
      layout.colliders
    );
    assert.ok(
      layoutModel.within(layout.studio.bounds, walker.x, walker.z),
      `walker escaped at frame ${frame}`
    );
    assert.ok(!nav.isBlocked(walker.x, walker.z, 0.25, layout.colliders));
  }
});

test("walls block a sight line; furniture does not", () => {
  // Library to gallery straight through both partitions.
  assert.equal(nav.hasLineOfSight(-6, -6, 6, -6, layout.colliders), false);
  // Across the reading table.
  assert.equal(nav.hasLineOfSight(-7, -3.4, -7, -5.8, layout.colliders), true);
  // Through an opening.
  assert.equal(nav.hasLineOfSight(0, -2.3, -6, -2.3, layout.colliders), true);
});

test("views resolve to a heading and tilt, and turns take the short way round", () => {
  const pose = nav.poseFromView({ eye: [0, 1.6, 0], look: [0, 1.6, -5] });
  assert.ok(Math.abs(pose.yaw) < 1e-9 && Math.abs(pose.pitch) < 1e-9);
  const west = nav.poseFromView({ eye: [0, 1.6, 0], look: [-5, 0.6, 0] });
  assert.ok(Math.abs(west.yaw - Math.PI / 2) < 1e-9);
  assert.ok(west.pitch < 0);
  assert.ok(Math.abs(nav.shortestAngle(3, -3) - (Math.PI * 2 - 6)) < 1e-9);
  assert.equal(nav.easeInOutCubic(0), 0);
  assert.equal(nav.easeInOutCubic(1), 1);
  assert.ok(nav.glideDuration(0.2) >= 0.7 && nav.glideDuration(60) <= 3.4);
});

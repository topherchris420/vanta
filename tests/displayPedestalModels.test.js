const assert = require("node:assert/strict");
const test = require("node:test");

const models = require("../lib/displayPedestalModels.json");

const SHELLS = new Set(["tetra", "octa", "cube", "icosa"]);

test("display pedestal exposes four swappable user models", () => {
  assert.equal(models.length, 4);
  for (const model of models) {
    assert.match(model.label, /\S/);
    assert.match(model.primary, /^#[0-9a-f]{6}$/i);
    assert.match(model.secondary, /^#[0-9a-f]{6}$/i);
    assert.ok(Array.isArray(model.nodes));
    assert.ok(model.nodes.length >= 3);
    for (const node of model.nodes) {
      assert.equal(node.length, 3);
      assert.ok(node.every((axis) => Number.isFinite(axis)));
    }
  }
});

test("every model names a containment shell the archive can build", () => {
  for (const model of models) {
    assert.ok(
      SHELLS.has(model.shell),
      `${model.label} names an unbuildable shell: ${model.shell}`
    );
  }
});

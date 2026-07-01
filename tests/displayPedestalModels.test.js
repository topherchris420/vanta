const assert = require("node:assert/strict");
const test = require("node:test");

const models = require("../lib/displayPedestalModels.json");

test("display pedestal exposes four swappable user models", () => {
  assert.equal(models.length, 4);
  for (const model of models) {
    assert.match(model.label, /\S/);
    assert.match(model.primary, /^#[0-9a-f]{6}$/i);
    assert.match(model.secondary, /^#[0-9a-f]{6}$/i);
    assert.ok(Array.isArray(model.nodes));
    assert.ok(model.nodes.length >= 3);
  }
});

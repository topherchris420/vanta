const { test } = require("node:test");
const assert = require("node:assert/strict");
const { multiply, seededMatrices, rowNotes } = require("../lib/studio/nineFourths");

test("both algorithms agree for bounded seeded integer matrices", () => {
  for (const n of [2,4,8]) for (let seed=0;seed<20;seed++) {
    const [a,b]=seededMatrices(n,seed);
    const classical=multiply(a,b), strassen=multiply(a,b,"strassen");
    assert.deepEqual(strassen.result,classical.result);
    assert.equal(classical.products,n**3);
    assert.equal(strassen.products,7**Math.log2(n));
    assert.equal(classical.additions,n*n*(n-1));
    assert.equal(strassen.additions,6*(7**Math.log2(n)-n*n));
  }
});
test("known product, rejected inputs and bounded audio",()=>{
  assert.deepEqual(multiply([[1,2],[3,4]],[[5,6],[7,8]],"strassen").result,[[19,22],[43,50]]);
  assert.throws(()=>multiply([[1]],[[1]]),RangeError);
  assert.throws(()=>multiply([[1,20],[3,4]],[[1,2],[3,4]]),RangeError);
  const notes=rowNotes([-10,0,10]);
  assert.equal(notes[0].frequency,220);
  assert.equal(notes[1].gain,0);
  assert.equal(notes[2].frequency,880);
});

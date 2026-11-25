const { test } = require("node:test");
const assert = require("node:assert/strict");
const { multiply, seededMatrices, rowNotes, processFrames, processNotes } = require("../lib/studio/nineFourths");

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

test("exact trace covers every counted arithmetic operation", () => {
  for (const n of [2,4,8]) for (let seed=0;seed<20;seed++) {
    const [a,b]=seededMatrices(n,seed);
    for (const algorithm of ["classical","strassen"]) {
      const traced=multiply(a,b,algorithm,{trace:true});
      const plain=multiply(a,b,algorithm);
      assert.deepEqual(traced.result,plain.result);
      assert.equal(traced.events.length,traced.products+traced.additions);
      assert.equal(traced.events.filter(e=>e.kind==="multiply").length,traced.products);
      for (const e of traced.events) {
        assert.ok(e.location);
        assert.equal(e.result,e.kind==="multiply"?e.left*e.right:e.kind==="add"?e.left+e.right:e.left-e.right);
      }
      assert.equal(plain.events,undefined);
    }
  }
});
test("2x2 trace distinguishes real arithmetic paths",()=>{
  const a=[[1,2],[3,4]], b=[[5,6],[7,8]];
  const c=multiply(a,b,"classical",{trace:true}), s=multiply(a,b,"strassen",{trace:true});
  assert.deepEqual(c.events.slice(0,3).map(e=>[e.kind,e.left,e.right,e.result]),
    [["multiply",1,5,5],["multiply",2,7,14],["add",5,14,19]]);
  assert.deepEqual(s.events.slice(0,3).map(e=>[e.kind,e.left,e.right,e.result]),
    [["add",1,4,5],["add",5,8,13],["multiply",5,13,65]]);
  assert.equal(c.events.length,12);
  assert.equal(s.events.length,25);
  assert.deepEqual(c.result,s.result);
});
test("shared grouping preserves operations and bounds audio",()=>{
  for(const n of [2,4,8]){
    const [a,b]=seededMatrices(n);
    const traces=["classical","strassen"].map(algorithm=>multiply(a,b,algorithm,{trace:true}).events);
    const group=Math.ceil(Math.max(...traces.map(t=>t.length))/96);
    for(const trace of traces){
      const frames=processFrames(trace,group);
      assert.ok(frames.length<=96);
      let offset=0;
      for(const frame of frames){
        assert.equal(frame.start,offset);
        const slice=trace.slice(frame.start,frame.end);
        for(const kind of ["multiply","add","subtract"]){
          assert.equal(frame.counts[kind],slice.filter(e=>e.kind===kind).length);
        }
        assert.deepEqual(frame.order,[...new Set(slice.map(e=>e.kind))]);
        for(const seconds of [0.12,0.18,0.36])for(const note of processNotes(frame,seconds)){
          assert.ok(note.onset>=0&&note.onset+note.duration<=seconds+1e-12);
          assert.ok(note.gain>0&&note.gain<=0.07);
          assert.ok(note.frequency>=196&&note.frequency<=392);
        }
        offset=frame.end;
      }
      assert.equal(offset,trace.length);
    }
  }
  assert.throws(()=>processFrames([],1),RangeError);
  assert.throws(()=>processFrames([{kind:"other"}],1),RangeError);
  assert.throws(()=>processNotes({order:["add"]},0),RangeError);
});

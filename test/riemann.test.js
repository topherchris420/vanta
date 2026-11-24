const test = require("node:test");
const assert = require("node:assert/strict");
const { ZEROS, primePowers, psi, coefficients, zeroWave, smoothCorrection, reconstruct, trace, pulseSchedule } = require("../lib/studio/riemann");

test("64 positive ordinates in increasing order with known endpoints",()=>{
  assert.equal(ZEROS.length,64);
  assert.ok(ZEROS.every((g,i)=>Number.isFinite(g)&&g>0&&(i===0||g>ZEROS[i-1])));
  assert.ok(Math.abs(ZEROS[0]-14.1347251417347)<1e-12);
  assert.ok(Math.abs(ZEROS[63]-169.911976479412)<1e-12);
});
test("prime powers include repeated powers but not arbitrary composites",()=>{
  const events=primePowers(16);
  assert.deepEqual(events.map(e=>e.n),[2,3,4,5,7,8,9,11,13,16]);
  assert.equal(events.find(e=>e.n===16).weight,Math.log(2));
  assert.equal(events.find(e=>e.n===9).k,2);
  assert.ok(Math.abs(psi(4,events)-(1.5*Math.log(2)+Math.log(3)))<1e-12);
});
test("zero contribution matches independent complex-pair arithmetic",()=>{
  for(const g of ZEROS) for(const u of [0,0.4,2.9,7]){
    const expected=-2*Math.cos(g*u-Math.atan2(g,.5))/Math.hypot(.5,g);
    assert.ok(Math.abs(zeroWave(u,[g])-expected)<1e-12);
    const c=coefficients(g);
    assert.ok(Math.abs(Math.hypot(c.cosine,c.sine)-2/Math.hypot(.5,g))<1e-12);
  }
});
test("explicit formula includes both smooth corrections and finite trace",()=>{
  const x=10;
  assert.ok(Math.abs(reconstruct(x,ZEROS)-zeroWave(Math.log(x),ZEROS)-smoothCorrection(x))<1e-12);
  const points=trace(100,ZEROS);
  assert.equal(points[0].x,2);
  assert.equal(points.at(-1).x,100);
  assert.ok(points.every(p=>Number.isFinite(p.actual)&&Number.isFinite(p.reconstructed)));
  const at4=points.find(p=>p.x===4);
  assert.ok(Math.abs(at4.actual-(psi(4,primePowers(100))-4)/2)<1e-12);
});
test("more zeros improve sampled mean squared reconstruction on a fixed domain",()=>{
  const mse=n=>{const a=trace(100,ZEROS.slice(0,n));return a.reduce((s,p)=>s+(p.actual-p.reconstructed)**2,0)/a.length;};
  assert.ok(mse(64)<mse(1));
});
test("pulse timing preserves logarithmic distances and mathematical weights",()=>{
  const events=pulseSchedule(16,8);
  assert.equal(events[0].time,0);
  assert.equal(events.at(-1).time,8);
  assert.ok(Math.abs(events.find(e=>e.n===4).time-8/3)<1e-12);
  assert.ok(events.every((e,i)=>i===0||e.time>events[i-1].time));
});

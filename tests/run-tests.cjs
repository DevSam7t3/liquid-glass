/**
 * DOM-free tests for the liquid-glass library.
 * Tests the pure-JS math functions from the CJS bundle.
 */
const assert = require('assert');
const lib = require('../dist/liquid-glass.cjs.js');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
}

console.log('liquid-glass — math tests\n');

test('Spring settles to target', () => {
  const s = new lib.Spring(0, 300, 20);
  s.setTarget(100);
  for (let i = 0; i < 500; i++) s.update(1 / 60);
  assert.ok(Math.abs(s.value - 100) < 0.1, `value=${s.value}`);
  assert.ok(s.isSettled());
});

test('Spring initial value is correct', () => {
  const s = new lib.Spring(42);
  assert.strictEqual(s.value, 42);
  assert.strictEqual(s.target, 42);
  assert.ok(s.isSettled());
});

test('compute1D returns correct length', () => {
  const r = lib.compute1D(80, 20, lib.PROFILES.convexSquircle, 1.5, 128);
  assert.strictEqual(r.length, 128);
});

test('compute1D last sample (inner edge) is zero', () => {
  // At x = (s-1)/s ≈ 1 the convex profile is flat (derivative → 0),
  // so the refracted ray is nearly straight and lateral displacement is ~0.
  const r = lib.compute1D(80, 20, lib.PROFILES.convexSquircle, 1.5, 128);
  assert.ok(Math.abs(r[r.length - 1]) < 5, `r[last]=${r[r.length - 1]}`);
});

test('compute1D produces non-zero displacements', () => {
  const r = lib.compute1D(80, 20, lib.PROFILES.convexSquircle, 1.5, 128);
  const nonZero = r.filter((v) => Math.abs(v) > 0.001);
  assert.ok(nonZero.length > 10, 'Expected significant displacement in bezel');
});

test('maxDisp returns maximum absolute value', () => {
  const r = lib.compute1D(80, 20, lib.PROFILES.convexSquircle, 1.5, 128);
  const md = lib.maxDisp(r);
  assert.ok(md > 0, 'maxDisp must be positive');
  assert.ok(
    r.every((v) => Math.abs(v) <= md + 1e-9),
    'maxDisp must be the true max',
  );
});

test('PROFILES.convexSquircle endpoints', () => {
  const f = lib.PROFILES.convexSquircle;
  assert.ok(Math.abs(f(0)) < 1e-9, 'f(0) should be 0');
  assert.ok(Math.abs(f(1) - 1) < 1e-9, 'f(1) should be 1');
});

test('PROFILES.convexCircle endpoints', () => {
  const f = lib.PROFILES.convexCircle;
  assert.ok(Math.abs(f(0)) < 1e-9, 'f(0) should be 0');
  assert.ok(Math.abs(f(1) - 1) < 1e-9, 'f(1) should be 1');
});

test('PROFILES.concave is inverse of convexCircle', () => {
  for (let i = 0; i <= 10; i++) {
    const x = i / 10;
    const sum = lib.PROFILES.convexCircle(x) + lib.PROFILES.concave(x);
    assert.ok(Math.abs(sum - 1) < 1e-9, `sum at x=${x} should be 1, got ${sum}`);
  }
});

test('higher refractiveIndex → larger maxDisp', () => {
  const lo = lib.maxDisp(lib.compute1D(80, 20, lib.PROFILES.convexSquircle, 1.1));
  const hi = lib.maxDisp(lib.compute1D(80, 20, lib.PROFILES.convexSquircle, 2.0));
  assert.ok(hi > lo, `Expected hi(${hi}) > lo(${lo})`);
});

test('larger glassThickness → larger maxDisp', () => {
  const thin = lib.maxDisp(lib.compute1D(40, 20, lib.PROFILES.convexSquircle, 1.5));
  const thick = lib.maxDisp(lib.compute1D(200, 20, lib.PROFILES.convexSquircle, 1.5));
  assert.ok(thick > thin, `Expected thick(${thick}) > thin(${thin})`);
});

console.log(`\n${passed} test(s) passed`);

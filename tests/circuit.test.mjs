import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCircuit } from '../src/circuit.ts';

const wire = (from, to, color = 'hot', id = 1) => ({ from, to, color, id });
const correct = () => [
  wire('panel.hot1', 'switch.a'), wire('switch.b', 'light.hot'),
  wire('panel.neutral', 'light.neutral', 'neutral'),
  wire('panel.ground', 'switch.ground', 'ground'), wire('panel.ground', 'light.ground', 'ground'),
];

test('a safe circuit follows BOTH source power and switch position', () => {
  for (const power of [false, true]) for (const on of [false, true]) {
    const result = evaluateCircuit(correct(), power, on);
    assert.equal(result.valid, true);
    assert.equal(result.lightOn, power && on);
    assert.deepEqual(result.errors, []);
  }
});
test('either brass screw may receive incoming hot', () => {
  const wires = correct();
  wires[0] = wire('panel.hot1', 'switch.b');
  wires[1] = wire('switch.a', 'light.hot');
  assert.equal(evaluateCircuit(wires, true, true).lightOn, true);
});
test('ground may bond the devices through a continuous shared grounding path', () => {
  const wires = correct();
  wires[4] = wire('switch.ground', 'light.ground', 'ground');
  assert.equal(evaluateCircuit(wires, true, true).valid, true);
});
test('an empty circuit cannot energize', () => {
  const result = evaluateCircuit([], true, true);
  assert.equal(result.lightOn, false);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('switched hot path')));
});
test('every required branch must exist', () => {
  for (let i = 0; i < 5; i++) {
    const result = evaluateCircuit(correct().filter((_, n) => n !== i), true, true);
    assert.equal(result.valid, false, `missing wire ${i}`);
    assert.equal(result.lightOn, false);
  }
});
test('direct hot-to-light wiring bypasses the switch', () => {
  const result = evaluateCircuit([...correct(), wire('panel.hot1', 'light.hot')], true, true);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('bypasses')));
});
test('switching neutral rather than hot is rejected', () => {
  const result = evaluateCircuit([
    wire('panel.hot1','light.hot'), wire('panel.neutral','switch.a','neutral'),
    wire('switch.b','light.neutral','neutral'),
    ...correct().slice(3),
  ], true, true);
  assert.equal(result.lightOn, false);
  assert.ok(result.errors.some(e => e.includes('bypasses')));
});
test('ground cannot be substituted for neutral', () => {
  const wires = correct();wires[2] = wire('panel.ground', 'light.neutral', 'ground');
  const result = evaluateCircuit(wires, true, true);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('ground must never')));
  assert.ok(result.errors.some(e => e.includes('directly to light NEUTRAL')));
});
test('hot-neutral and hot-ground faults are caught even before switch closes', () => {
  for (const destination of ['panel.neutral', 'panel.ground']) {
    const result = evaluateCircuit([...correct(), wire('switch.b', destination)], true, false);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('fault')));
  }
});
test('neutral and ground must remain separate in the modeled branch circuit', () => {
  assert.equal(evaluateCircuit([...correct(), wire('panel.neutral', 'panel.ground', 'neutral')], true, true).valid, false);
});
test('the second breaker cannot substitute for the lesson source', () => {
  const wires = correct();wires[0] = wire('panel.hot2', 'switch.a');
  const result = evaluateCircuit(wires, true, true);
  assert.equal(result.lightOn, false);
  assert.ok(result.errors.some(e => e.includes('Breaker 2')));
});
test('incorrect conductor identification is rejected', () => {
  for (let i = 0; i < 5; i++) {
    const wires = correct();wires[i].color = wires[i].color === 'hot' ? 'neutral' : 'hot';
    assert.equal(evaluateCircuit(wires, true, true).valid, false);
  }
});

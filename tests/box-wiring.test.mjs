import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNMExample, evaluateBoxWiring } from '../src/box-wiring.ts';

test('two NM cables and explicit box splices drive the original single-pole lesson', () => {
  const layout = createNMExample();
  assert.equal(layout.cables.length, 2);
  assert.ok(layout.cables.every(c => c.conductors.length === 3 && c.conductors.find(w => w.kind === 'ground').bare));
  for (const power of [false, true]) for (const on of [false, true]) {
    const result = evaluateBoxWiring(layout, power, on);
    assert.deepEqual(result.errors, []);
    assert.equal(result.lightOn, power && on);
  }
});
test('removing any required cable conductor breaks the safe complete circuit', () => {
  for (let cable = 0; cable < 2; cable++) for (let conductor = 0; conductor < 3; conductor++) {
    const layout = createNMExample(); layout.cables[cable].conductors[conductor].connected = false;
    assert.equal(evaluateBoxWiring(layout, true, true).valid, false);
    assert.equal(evaluateBoxWiring(layout, true, true).lightOn, false);
  }
});
test('opening each connector breaks continuity, and reconnecting restores it', () => {
  for (let i = 0; i < 5; i++) {
    const layout = createNMExample(); layout.splices[i].connected = false;
    assert.equal(evaluateBoxWiring(layout, true, true).lightOn, false);
    layout.splices[i].connected = true;
    assert.equal(evaluateBoxWiring(layout, true, true).lightOn, true);
  }
});
test('metal boxes and device grounds have independent tested bonding pigtails', () => {
  for (const id of ['switch-pigtail', 'switch-box-bond', 'fixture-ground', 'fixture-box-bond']) {
    const layout = createNMExample(); layout.leads.find(c => c.id === id).connected = false;
    assert.equal(evaluateBoxWiring(layout, true, true).valid, false, id);
  }
});
test('a jacket without conductors has no continuity', () => {
  const layout = createNMExample(); layout.cables.forEach(c => c.conductors = []);
  assert.equal(evaluateBoxWiring(layout, true, true).lightOn, false);
});
test('a mixed neutral-ground splice and hot-neutral splice cannot energize even with an open switch', () => {
  for (const end of ['feed.out.ground', 'feed.out.hot']) {
    const layout = createNMExample(); layout.splices[0].members.push(end);
    const result = evaluateBoxWiring(layout, true, false);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('different purposes')));
  }
});
test('incorrectly identified and bare current conductors are rejected', () => {
  const layout = createNMExample(); layout.cables[0].conductors[0].kind = 'neutral';
  assert.equal(evaluateBoxWiring(layout, true, true).valid, false);
  const bare = createNMExample(); bare.cables[0].conductors[0].bare = true;
  assert.ok(evaluateBoxWiring(bare).errors.some(e => e.includes('Bare NM')));
});
test('an unknown splice end fails closed instead of creating imaginary continuity', () => {
  const layout = createNMExample(); layout.splices[0].members.push('missing.end');
  assert.ok(evaluateBoxWiring(layout, true, true).errors.some(e => e.includes('Unknown conductor')));
});

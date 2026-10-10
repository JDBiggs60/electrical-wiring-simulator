import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addLessonPigtail, createHardwareCircuit, boxView, checkLessonCircuit, createLessonCircuit, disconnectLessonEnd, joinLessonEnds, lessonContinuity, lessonLayout, removeLessonConnector, setLessonPower, terminateLessonEnd } from '../src/lesson-circuit.ts';

function wired(reverse = false) {
  const s = createLessonCircuit();
  const attach = (end, terminal) => assert.equal(terminateLessonEnd(s, end, terminal), null);
  const join = (box, members) => assert.equal(joinLessonEnds(s, box, members), null);
  attach('feed.hot.switch', reverse ? 'switch.b' : 'switch.a');
  attach('load.hot.switch', reverse ? 'switch.a' : 'switch.b');
  join('switch', ['feed.neutral.switch', 'load.neutral.switch']);
  join('switch', ['feed.ground.switch', 'load.ground.switch', 'switch.device-ground.splice', 'switch.box-ground.splice']);
  attach('switch.device-ground.terminal', 'switch.ground');
  attach('switch.box-ground.terminal', 'switch.box');
  for (const kind of ['hot', 'neutral', 'ground']) {
    join('fixture', ['load.' + kind + '.fixture', 'fixture.' + kind + '.splice', ...(kind === 'ground' ? ['fixture.box-ground.splice'] : [])]);
    attach('fixture.' + kind + '.terminal', 'light.' + kind);
  }
  attach('fixture.box-ground.terminal', 'light.box');
  return s;
}

test('lesson starts completely unwired with unique cables, copper, ends and empty terminals', () => {
  const s = createLessonCircuit();
  assert.deepEqual(s.connectors, []);
  assert.deepEqual(s.terminations, {});
  assert.equal(s.power, false);
  assert.equal(new Set(s.cables.map(c => c.id)).size, 2);
  const copper = [...s.cables.flatMap(c => c.conductors), ...s.leads];
  assert.equal(new Set(copper.map(c => c.id)).size, copper.length);
  assert.equal(new Set(s.ends.map(e => e.id)).size, s.ends.length);
  assert.ok(s.cables.every(c => c.conductors.length === 3 && c.conductors.find(w => w.kind === 'ground').bare));
  assert.deepEqual(lessonLayout(s).splices, []);
  assert.deepEqual(lessonContinuity(s), { hot: false, neutral: false, switchGround: false, fixtureGround: false, switchBox: false, fixtureBox: false });
  assert.equal(checkLessonCircuit(s, true, true).lightOn, false);
});

test('both box views refer to the overview cable and conductor objects and physical entries', () => {
  const s = createLessonCircuit(), sw = boxView(s, 'switch'), fixture = boxView(s, 'fixture');
  const load = s.cables.find(c => c.id === 'load');
  assert.equal(sw.ports.find(p => p.cable.id === 'load').cable, load);
  assert.equal(fixture.ports[0].cable, load);
  assert.equal(sw.ports.find(p => p.cable.id === 'load').port, load.ports[0]);
  assert.equal(fixture.ports[0].port, load.ports[1]);
  assert.deepEqual(sw.ports.map(p => p.port.side), ['left', 'top']);
  assert.equal(fixture.ports[0].port.side, 'left');
  const feed = sw.ports[0].port, outgoing = sw.ports[1].port, incoming = fixture.ports[0].port;
  assert.equal((feed.main.y - 336) / 266, feed.position);
  assert.ok(Math.abs((feed.closeup.y - 96) / 516 - feed.position) < 1e-12);
  assert.equal((outgoing.main.x - 353) / 246, outgoing.position);
  assert.ok(Math.abs((outgoing.closeup.x - 109) / 732 - outgoing.position) < 1e-12);
  assert.equal((incoming.main.y - 168) / 138, incoming.position);
  assert.ok(Math.abs((incoming.closeup.y - 149) / 368 - incoming.position) < 1e-12);
  for (const port of s.cables.flatMap(c => c.ports)) assert.ok(port.main.x >= 0 && port.closeup.x >= 0);
  for (const c of load.conductors) {
    assert.equal(sw.ends.find(e => e.conductor === c.id).id, c.from);
    assert.equal(fixture.ends.find(e => e.conductor === c.id).id, c.to);
  }
  assert.equal(terminateLessonEnd(s, sw.ends[0].id, 'switch.a'), null);
  assert.equal(boxView(s, 'switch').ends[0], sw.ends[0]);
  assert.equal(lessonLayout(s).leads.at(-1).from, sw.ends[0].id);
});

test('actual student connections operate the switch and light in either brass screw orientation', () => {
  for (const reverse of [false, true]) {
    const s = wired(reverse);
    for (const power of [false, true]) for (const on of [false, true]) {
      const r = checkLessonCircuit(s, power, on);
      assert.deepEqual(r.errors, []);
      assert.equal(r.lightOn, power && on);
      assert.equal(r.continuity.hot, on);
      assert.ok(Object.entries(r.continuity).filter(([k]) => k !== 'hot').every(([, v]) => v));
    }
  }
});

test('every learner connector and terminal attachment changes continuity and blocks incomplete circuits', () => {
  for (const connector of wired().connectors) {
    const s = wired();
    assert.equal(removeLessonConnector(s, connector.id), null);
    assert.equal(checkLessonCircuit(s, true, true).valid, false);
    assert.equal(checkLessonCircuit(s, true, true).lightOn, false);
  }
  for (const end of Object.keys(wired().terminations)) {
    const s = wired();
    assert.equal(disconnectLessonEnd(s, end), null);
    assert.equal(checkLessonCircuit(s, true, true).lightOn, false, end);
  }
  const s = wired();
  disconnectLessonEnd(s, 'fixture.neutral.terminal');
  assert.equal(lessonContinuity(s, true).neutral, false);
  assert.equal(terminateLessonEnd(s, 'fixture.neutral.terminal', 'light.neutral'), null);
  assert.equal(checkLessonCircuit(s, true, true).lightOn, true);
});

test('device and metal box grounds each require their own completed bonds', () => {
  for (const [end, path] of [['switch.device-ground.terminal', 'switchGround'], ['switch.box-ground.terminal', 'switchBox'], ['fixture.ground.terminal', 'fixtureGround'], ['fixture.box-ground.terminal', 'fixtureBox']]) {
    const s = wired(); disconnectLessonEnd(s, end);
    assert.equal(lessonContinuity(s).neutral, true);
    assert.equal(lessonContinuity(s)[path], false);
    assert.equal(checkLessonCircuit(s, true, true).valid, false);
  }
});

test('cross-box joins, unknown ends, duplicate connections and occupied screws are rejected', () => {
  const s = createLessonCircuit();
  assert.ok(joinLessonEnds(s, 'switch', ['load.hot.switch', 'load.hot.fixture']));
  assert.ok(joinLessonEnds(s, 'switch', ['missing', 'load.hot.switch']));
  assert.ok(terminateLessonEnd(s, 'load.hot.fixture', 'switch.a'));
  assert.equal(terminateLessonEnd(s, 'feed.hot.switch', 'switch.a'), null);
  assert.ok(terminateLessonEnd(s, 'load.hot.switch', 'switch.a'));
  assert.ok(joinLessonEnds(s, 'switch', ['feed.hot.switch', 'load.hot.switch']));
  assert.equal(s.connectors.length, 0);
  const corrupt = wired();
  corrupt.connectors[0].members.push('load.neutral.fixture');
  assert.equal(checkLessonCircuit(corrupt, true, true).valid, false);
});

test('hot-neutral, hot-ground, neutral-ground faults and switch bypasses cannot energize', () => {
  for (const pair of [['feed.hot.switch', 'load.neutral.switch'], ['feed.hot.switch', 'load.ground.switch'], ['feed.neutral.switch', 'load.ground.switch']]) {
    const s = createLessonCircuit(); joinLessonEnds(s, 'switch', pair);
    for (const on of [false, true]) {
      assert.ok(checkLessonCircuit(s, true, on).errors.some(e => e.includes('different purposes')));
      assert.equal(checkLessonCircuit(s, true, on).lightOn, false);
    }
  }
  const s = wired();
  disconnectLessonEnd(s, 'feed.hot.switch'); disconnectLessonEnd(s, 'load.hot.switch');
  joinLessonEnds(s, 'switch', ['feed.hot.switch', 'load.hot.switch']);
  assert.ok(checkLessonCircuit(s, true, true).errors.some(e => e.includes('bypasses')));
});

test('test power refuses incomplete wiring and freezes edits until deenergized', () => {
  const empty = createLessonCircuit();
  assert.ok(setLessonPower(empty, true)); assert.equal(empty.power, false);
  const s = wired();
  assert.equal(setLessonPower(s, true), null);
  const before = JSON.stringify(s);
  assert.ok(disconnectLessonEnd(s, 'feed.hot.switch'));
  assert.ok(removeLessonConnector(s, 1));
  assert.ok(joinLessonEnds(s, 'fixture', ['load.hot.fixture', 'fixture.hot.splice']));
  assert.ok(terminateLessonEnd(s, 'feed.hot.switch', 'switch.a'));
  assert.equal(JSON.stringify(s), before);
  assert.equal(setLessonPower(s, false), null);
  assert.equal(disconnectLessonEnd(s, 'feed.hot.switch'), null);
});


test('hardware parts tray creates unique loose two-ended ground pigtails without prewiring', () => {
  const s = createHardwareCircuit();
  assert.equal(s.ends.length, 13);
  assert.equal(s.leads.length, 2);
  assert.equal(checkLessonCircuit(s).valid, false);
  for (const id of ['switch.device-ground','switch.box-ground','fixture.ground','fixture.box-ground']) {
    assert.equal(addLessonPigtail(s,id),null);
    assert.ok(addLessonPigtail(s,id));
  }
  assert.equal(s.ends.length,21);
  assert.equal(new Set(s.ends.map(e => e.id)).size,21);
  assert.deepEqual(s.terminations,{});
  assert.deepEqual(s.connectors,[]);
  assert.deepEqual(lessonContinuity(s),lessonContinuity(createLessonCircuit()));
  s.power = true;
  assert.match(addLessonPigtail(s,'fixture.ground'), /power off/);
});

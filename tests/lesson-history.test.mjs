import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLessonHistory } from '../src/lesson-history.ts';
import { createHardwareCircuit, addLessonPigtail, terminateLessonEnd, joinLessonEnds, disconnectLessonEnd, lessonContinuity } from '../src/lesson-circuit.ts';

test('one action history restores pigtails, terminations, splice removal and actual continuity across boxes', () => {
  const s = createHardwareCircuit(), h = createLessonHistory(s);
  const step = fn => h.perform(() => assert.equal(fn(),null));
  assert.equal(h.canUndo,false); assert.equal(h.canRedo,false);
  step(() => addLessonPigtail(s,'switch.box-ground'));
  h.undo(); assert.equal(s.leads.some(l => l.id === 'switch.box-ground'),false);
  h.redo(); assert.equal(s.ends.filter(e => e.conductor === 'switch.box-ground').length,2);
  step(() => joinLessonEnds(s,'switch',['feed.ground.switch','load.ground.switch','switch.box-ground.splice']));
  step(() => terminateLessonEnd(s,'switch.box-ground.terminal','switch.box'));
  assert.equal(lessonContinuity(s).switchBox,true);
  h.undo(); assert.equal(lessonContinuity(s).switchBox,false); assert.equal(s.connectors.length,1);
  h.redo(); assert.equal(lessonContinuity(s).switchBox,true);
  step(() => disconnectLessonEnd(s,'feed.ground.switch'));
  assert.equal(s.connectors.length,0); assert.equal(lessonContinuity(s).switchBox,false);
  h.undo(); assert.equal(s.connectors.length,1); assert.equal(lessonContinuity(s).switchBox,true);
  step(() => terminateLessonEnd(s,'fixture.hot.terminal','light.hot'));
  assert.equal(h.canRedo,false);
  h.undo(); assert.equal(s.terminations['fixture.hot.terminal'],undefined);
  assert.equal(lessonContinuity(s).switchBox,true);
});

test('selection, rejected actions and power/switch operation do not consume history; power locks undo', () => {
  const s = createHardwareCircuit(), h = createLessonHistory(s);
  h.perform(() => terminateLessonEnd(s,'no.end','switch.a'));
  assert.equal(h.canUndo,false);
  h.perform(() => terminateLessonEnd(s,'feed.hot.switch','switch.a'));
  h.perform(() => { s.switchOn = true; });
  s.power = true;
  assert.equal(h.canUndo,false); assert.match(h.undo(),/power off/);
  s.power = false; h.undo(); assert.equal(s.terminations['feed.hot.switch'],undefined);
  assert.equal(s.switchOn,true);
  h.redo(); assert.equal(s.terminations['feed.hot.switch'],'switch.a');
  h.clear(); assert.equal(h.canUndo,false); assert.equal(h.canRedo,false);
});

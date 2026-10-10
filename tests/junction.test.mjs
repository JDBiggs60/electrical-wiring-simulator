import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJunction, joinEnds, removeConnector, setPigtail, checkJunction } from '../src/junction.ts';
const pair = (s,a,b) => assert.equal(joinEnds(s,[a,b]),null);
function correct() {
  const s=createJunction();
  pair(s,'a.hot','b.hot');pair(s,'a.neutral','b.neutral');
  setPigtail(s,true);assert.equal(joinEnds(s,['a.ground','b.ground','pigtail.end']),null);
  s.boxAttached=true;return s;
}
test('the junction starts electrically open; drawing geometry creates no implicit splice',()=>{
  const r=checkJunction(createJunction(),true,true);
  assert.equal(r.valid,false);assert.equal(r.lightOn,false);
  assert.deepEqual(r.continuity,{hot:false,neutral:false,ground:false,box:false});
});
test('three explicit splices and a pigtail complete the actual Phase 1 test loop',()=>{
  const s=correct();
  for(const power of [false,true])for(const on of [false,true]){
    const r=checkJunction(s,power,on);assert.equal(r.valid,true);assert.deepEqual(r.errors,[]);assert.equal(r.lightOn,power&&on);
  }
});
test('removing each connector opens its electrical net and prevents the light from operating',()=>{
  for(let i=0;i<3;i++){
    const s=correct();const removed=s.connectors[i];removeConnector(s,removed.id);
    assert.equal(checkJunction(s,true,true).lightOn,false);
    assert.equal(joinEnds(s,removed.members),null);assert.equal(checkJunction(s,true,true).lightOn,true);
  }
});
test('the pigtail must be joined at its splice end AND attached at its box end',()=>{
  const s=correct();s.boxAttached=false;
  assert.equal(checkJunction(s,true,true).continuity.ground,true);
  assert.equal(checkJunction(s,true,true).continuity.box,false);
  assert.equal(checkJunction(s,true,true).lightOn,false);
  s.boxAttached=true;removeConnector(s,s.connectors[2].id);pair(s,'a.ground','b.ground');
  assert.equal(checkJunction(s).continuity.box,false);
  assert.ok(checkJunction(s).errors.some(e=>e.includes('Missing steel-box bond')));
});
test('removing a pigtail preserves the bare-ground splice but removes the steel-box bond',()=>{
  const s=correct();setPigtail(s,false);
  assert.deepEqual(s.connectors[2].members,['a.ground','b.ground']);
  const r=checkJunction(s,true,true);assert.equal(r.continuity.ground,true);assert.equal(r.continuity.box,false);assert.equal(r.lightOn,false);
});
test('every black/white pairing is diagnosed as hot-to-neutral, including unpowered downstream ends',()=>{
  for(const hot of ['a.hot','b.hot'])for(const neutral of ['a.neutral','b.neutral']){
    const s=createJunction();pair(s,hot,neutral);const r=checkJunction(s,true,false);
    assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.includes('Hot-to-neutral fault')));
  }
});
test('black/bare and black/pigtail splices create hot-to-ground faults',()=>{
  for(const hot of ['a.hot','b.hot'])for(const ground of ['a.ground','b.ground','pigtail.end']){
    const s=createJunction();setPigtail(s,true);pair(s,hot,ground);
    const r=checkJunction(s,true,true);assert.equal(r.lightOn,false);assert.ok(r.errors.some(e=>e.includes('Hot-to-ground fault')));
  }
});
test('equipment ground cannot substitute for the neutral return',()=>{
  const s=createJunction();pair(s,'a.hot','b.hot');assert.equal(joinEnds(s,['a.neutral','b.neutral','a.ground','b.ground']),null);
  assert.ok(checkJunction(s).errors.some(e=>e.includes('never the normal neutral return')));
  assert.equal(checkJunction(s,true,true).valid,false);
});
test('a conductor end cannot be assigned to two connectors and selection requires present, distinct ends',()=>{
  const s=createJunction();pair(s,'a.hot','b.hot');
  assert.match(joinEnds(s,['a.hot','b.neutral']),/Remove/);
  assert.match(joinEnds(s,['a.ground','pigtail.end']),/not present/);
  assert.match(joinEnds(s,['a.neutral','a.neutral']),/two to four/);
  assert.match(joinEnds(s,['not-an-end','a.neutral']),/not present/);
  assert.equal(s.connectors.length,1);
});

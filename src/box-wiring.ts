import { evaluateCircuit, terminals, type CircuitResult, type TerminalId, type Wire, type WireColor } from './circuit.ts';

/** Physical conductor ends are distinct nodes. A jacket never creates continuity. */
export interface Conductor {
  id: string; from: string; to: string; kind: WireColor; label: string;
  bare?: boolean; connected: boolean;
}
export interface NMCable { id: string; label: string; fromBox: string; toBox: string; conductors: Conductor[] }
export interface Splice { id: string; box: 'switch' | 'light' | 'junction'; label: string; members: string[]; connected: boolean }
export interface BoxWiring { cables: NMCable[]; leads: Conductor[]; splices: Splice[]; boxBonds: string[] }
const lead = (id: string, from: string, to: string, kind: WireColor, label: string, bare = false): Conductor => ({ id, from, to, kind, label, bare, connected: true });

export function createNMExample(): BoxWiring {
  const cable = (id: string, fromBox: string, toBox: string): NMCable => ({
    id, label: '14/2 NM-B + bare ground', fromBox, toBox,
    conductors: (['hot', 'neutral', 'ground'] as WireColor[]).map(kind => lead(`${id}.${kind}`, `${id}.in.${kind}`, `${id}.out.${kind}`, kind, `${id === 'feed' ? 'Panel → switch box' : 'Switch box → fixture box'} · ${kind === 'ground' ? 'bare ground' : kind === 'hot' ? 'black' : 'white'}`, kind === 'ground')),
  });
  return {
    cables: [cable('feed', 'panel', 'switch'), cable('load', 'switch', 'light')],
    leads: [
      lead('panel-hot', 'panel.hot1', 'feed.in.hot', 'hot', 'Breaker 1 connection'),
      lead('panel-neutral', 'panel.neutral', 'feed.in.neutral', 'neutral', 'Neutral bar connection'),
      lead('panel-ground', 'panel.ground', 'feed.in.ground', 'ground', 'Ground bar connection', true),
      lead('switch-line', 'feed.out.hot', 'switch.a', 'hot', 'Incoming black → brass A'),
      lead('switch-load', 'switch.b', 'load.in.hot', 'hot', 'Brass B → outgoing black'),
      lead('switch-pigtail', 'switch.ground.tail', 'switch.ground', 'ground', 'Green device-ground pigtail'),
      lead('switch-box-bond', 'switch.box.tail', 'switch.box', 'ground', 'Green metal-box bonding pigtail'),
      lead('fixture-hot', 'fixture.hot.lead', 'light.hot', 'hot', 'Black fixture lead'),
      lead('fixture-neutral', 'fixture.neutral.lead', 'light.neutral', 'neutral', 'White fixture lead'),
      lead('fixture-ground', 'fixture.ground.lead', 'light.ground', 'ground', 'Green fixture-ground lead'),
      lead('fixture-box-bond', 'fixture.box.tail', 'light.box', 'ground', 'Green fixture-box bonding pigtail'),
    ],
    splices: [
      { id: 'switch-neutral', box: 'switch', label: 'Neutral pass-through', members: ['feed.out.neutral', 'load.in.neutral'], connected: true },
      { id: 'switch-ground', box: 'switch', label: 'Ground splice + bonding pigtails', members: ['feed.out.ground', 'load.in.ground', 'switch.ground.tail', 'switch.box.tail'], connected: true },
      { id: 'fixture-hot', box: 'light', label: 'Switched hot + fixture lead', members: ['load.out.hot', 'fixture.hot.lead'], connected: true },
      { id: 'fixture-neutral', box: 'light', label: 'Neutral + fixture lead', members: ['load.out.neutral', 'fixture.neutral.lead'], connected: true },
      { id: 'fixture-ground', box: 'light', label: 'Ground splice + fixture / box bonds', members: ['load.out.ground', 'fixture.ground.lead', 'fixture.box.tail'], connected: true },
    ],
    boxBonds: ['switch.box', 'light.box'],
  };
}

/** Reduce physical continuity to the existing evaluator's device-terminal graph. */
export function analyzeBoxWiring(layout: BoxWiring): { wires: Wire[]; errors: string[] } {
  const errors: string[] = [];
  const edges = new Map<string, Set<string>>();
  const kinds = new Map<string, Set<WireColor>>();
  const mark = (node: string, kind: WireColor) => { if (!kinds.has(node)) kinds.set(node, new Set()); kinds.get(node)!.add(kind); };
  const add = (a: string, b: string) => { if (!edges.has(a)) edges.set(a, new Set()); edges.get(a)!.add(b); };
  const join = (a: string, b: string) => { add(a, b); add(b, a); };
  Object.entries(terminals).forEach(([id, t]) => mark(id, t.kind));
  layout.boxBonds.forEach(id => mark(id, 'ground'));
  for (const c of [...layout.cables.flatMap(cable => cable.conductors), ...layout.leads]) {
    mark(c.from, c.kind); mark(c.to, c.kind);
    if (c.bare && c.kind !== 'ground') errors.push('Bare NM conductors are equipment grounds, never hot or neutral.');
    if (c.connected) join(c.from, c.to);
  }
  for (const splice of layout.splices) {
    if (splice.members.some(member => !kinds.has(member))) errors.push(`Unknown conductor at ${splice.label}.`);
    if (!splice.connected) continue;
    const first = splice.members[0];
    if (first) splice.members.slice(1).forEach(member => join(first, member));
  }
  const visited = new Set<string>();
  const wires: Wire[] = [];
  const bonded = new Set<string>();
  for (const start of kinds.keys()) {
    if (visited.has(start)) continue;
    const group: string[] = [], queue = [start];
    while (queue.length) {
      const node = queue.pop()!;
      if (visited.has(node)) continue;
      visited.add(node); group.push(node); queue.push(...(edges.get(node) ?? []));
    }
    const purposes = new Set(group.flatMap(id => [...(kinds.get(id) ?? [])]));
    if (purposes.size > 1) errors.push('A splice or conductor joins different purposes. Keep hot, neutral, and ground separate.');
    if (group.includes('panel.ground') && purposes.size === 1) group.forEach(node => bonded.add(node));
    const deviceEnds = group.filter(id => id in terminals) as TerminalId[];
    const first = deviceEnds[0];
    if (first) for (const to of deviceEnds.slice(1)) wires.push({ id: wires.length + 1, from: first, to, color: terminals[first].kind });
  }
  for (const box of layout.boxBonds) if (!bonded.has(box)) errors.push(`Bond the ${box === 'switch.box' ? 'switch' : box === 'junction.box' ? 'junction' : 'fixture'} metal box to equipment ground through its grounding pigtail.`);
  return { wires, errors: [...new Set(errors)] };
}
export function evaluateBoxWiring(layout: BoxWiring, power = false, switchOn = false): CircuitResult {
  const physical = analyzeBoxWiring(layout);
  const result = evaluateCircuit(physical.wires, power, switchOn);
  const errors = [...physical.errors, ...result.errors];
  return { valid: errors.length === 0, errors, lightOn: errors.length === 0 && result.lightOn };
}

import { evaluateBoxWiring, type BoxWiring, type Conductor } from './box-wiring.ts';
import type { WireColor } from './circuit.ts';
import { connectorSelection } from './connectors.ts';

export type BoxId = 'switch' | 'fixture';
export interface Point { x: number; y: number }
export interface CablePort { box: BoxId; side: 'left' | 'top'; position: number; main: Point; closeup: Point }
export interface LessonCable { id: string; label: string; path: string; ports: CablePort[]; conductors: Conductor[] }
export interface LessonEnd { id: string; conductor: string; label: string; box: BoxId; kind: WireColor; bare: boolean; cable?: string; port?: CablePort; offset?: number; free: Point }
export interface LessonTerminal { id: string; box: BoxId; label: string; kind: WireColor; point: Point }
export interface LessonConnector { id: number; box: BoxId; members: string[] }
export interface LessonCircuit {
  cables: LessonCable[]; leads: Conductor[]; ends: LessonEnd[]; terminals: LessonTerminal[];
  connectors: LessonConnector[]; terminations: Record<string, string>; nextId: number;
  power: boolean; switchOn: boolean;
}
const span = (id: string, from: string, to: string, kind: WireColor, bare = false): Conductor =>
  ({ id, from, to, kind, bare, label: id, connected: true });

/** Cable copper is continuous; all learner-accessible terminations start disconnected.
 * The incoming supply boundary is upstream of this lesson's boxes. */
export function createLessonCircuit(): LessonCircuit {
  // One physical entry position along each wall; scale that slot into the cutaway.
  const feedPosition = (510 - 336) / (602 - 336), loadPosition = (545 - 353) / (599 - 353);
  const fixturePosition = (208 - 168) / (306 - 168);
  const feedPort: CablePort = { box: 'switch', side: 'left', position: feedPosition, main: { x: 364, y: 510 }, closeup: { x: 109, y: 96 + feedPosition * (612 - 96) } };
  const loadSwitchPort: CablePort = { box: 'switch', side: 'top', position: loadPosition, main: { x: 545, y: 346 }, closeup: { x: 109 + loadPosition * (841 - 109), y: 96 } };
  const loadFixturePort: CablePort = { box: 'fixture', side: 'left', position: fixturePosition, main: { x: 1016, y: 208 }, closeup: { x: 121, y: 149 + fixturePosition * (517 - 149) } };
  const cables: LessonCable[] = [
    { id: 'feed', label: 'Supply NM-B 14/2 + ground', path: 'M0 510H373', ports: [feedPort], conductors: [] },
    { id: 'load', label: 'Switch → fixture NM-B 14/2 + ground', path: 'M545 353V208H1030', ports: [loadSwitchPort, loadFixturePort], conductors: [] },
  ];
  const ends: LessonEnd[] = [];
  const kinds: WireColor[] = ['hot', 'neutral', 'ground'];
  const names = ['black', 'white', 'bare ground'];
  for (const cable of cables) kinds.forEach((kind, i) => {
    const id = cable.id + '.' + kind;
    const from = cable.id === 'feed' ? ({ hot: 'panel.hot1', neutral: 'panel.neutral', ground: 'panel.ground' })[kind] : id + '.switch';
    const to = id + (cable.id === 'feed' ? '.switch' : '.fixture');
    cable.conductors.push(span(id, from, to, kind, kind === 'ground'));
    cable.ports.forEach(port => {
      const free = port.box === 'fixture' ? { x: 260 + i * 75, y: 295 + i * 100 }
        : cable.id === 'feed' ? [{ x: 265, y: 290 }, { x: 235, y: 460 }, { x: 315, y: 540 }][i]!
        : [{ x: 580, y: 290 }, { x: 690, y: 410 }, { x: 720, y: 510 }][i]!;
      ends.push({ id: id + '.' + port.box, conductor: id, label: (cable.id === 'feed' ? 'Supply' : port.box === 'fixture' ? 'From switch' : 'To fixture') + ' · ' + names[i],
        box: port.box, kind, bare: kind === 'ground', cable: cable.id, port, offset: (i - 1) * 17, free });
    });
  });
  const leads: Conductor[] = [];
  const lead = (id: string, box: BoxId, kind: WireColor, label: string, a: Point, b: Point) => {
    leads.push(span(id, id + '.splice', id + '.terminal', kind));
    ends.push({ id: id + '.splice', conductor: id, box, kind, bare: false, label: label + ' · splice end', free: a },
      { id: id + '.terminal', conductor: id, box, kind, bare: false, label: label + ' · terminal end', free: b });
  };
  lead('switch.device-ground', 'switch', 'ground', 'Device ground pigtail', { x: 535, y: 530 }, { x: 540, y: 435 });
  lead('switch.box-ground', 'switch', 'ground', 'Switch box bond pigtail', { x: 615, y: 550 }, { x: 760, y: 475 });
  lead('fixture.hot', 'fixture', 'hot', 'Black fixture lead', { x: 500, y: 260 }, { x: 750, y: 280 });
  lead('fixture.neutral', 'fixture', 'neutral', 'White fixture lead', { x: 500, y: 370 }, { x: 800, y: 400 });
  lead('fixture.ground', 'fixture', 'ground', 'Green fixture lead', { x: 490, y: 480 }, { x: 950, y: 410 });
  lead('fixture.box-ground', 'fixture', 'ground', 'Fixture box bond pigtail', { x: 330, y: 540 }, { x: 565, y: 455 });
  return { cables, leads, ends, terminals: [
    { id: 'switch.a', box: 'switch', label: 'Brass switch screw A', kind: 'hot', point: { x: 409, y: 319 } },
    { id: 'switch.b', box: 'switch', label: 'Brass switch screw B', kind: 'hot', point: { x: 409, y: 395 } },
    { id: 'switch.ground', box: 'switch', label: 'Green device ground screw', kind: 'ground', point: { x: 484, y: 449 } },
    { id: 'switch.box', box: 'switch', label: 'Green steel box bond screw', kind: 'ground', point: { x: 768, y: 552 } },
    { id: 'light.hot', box: 'fixture', label: 'Fixture brass hot terminal', kind: 'hot', point: { x: 812, y: 310 } },
    { id: 'light.neutral', box: 'fixture', label: 'Fixture silver neutral terminal', kind: 'neutral', point: { x: 860, y: 325 } },
    { id: 'light.ground', box: 'fixture', label: 'Fixture green ground terminal', kind: 'ground', point: { x: 916, y: 310 } },
    { id: 'light.box', box: 'fixture', label: 'Green steel box bond screw', kind: 'ground', point: { x: 551, y: 519 } },
  ], connectors: [], terminations: {}, nextId: 1, power: false, switchOn: false };
}
export function boxView(state: LessonCircuit, box: BoxId) {
  return { ports: state.cables.flatMap(c => c.ports.filter(p => p.box === box).map(port => ({ cable: c, port }))),
    ends: state.ends.filter(e => e.box === box), terminals: state.terminals.filter(t => t.box === box),
    connectors: state.connectors.filter(c => c.box === box) };
}
export function endConnection(state: LessonCircuit, id: string): string | null {
  return state.terminations[id] ?? (state.connectors.find(c => c.members.includes(id)) ? 'connector' : null);
}
export function joinLessonEnds(state: LessonCircuit, box: BoxId, members: string[]): string | null {
  if (state.power) return 'Turn test power off before changing wiring.';
  const selection = connectorSelection(members, id => state.ends.some(e => e.id === id && e.box === box), id => !!endConnection(state, id));
  if (selection.error) return selection.error;
  state.connectors.push({ id: state.nextId++, box, members: selection.members });
  return null;
}
export function terminateLessonEnd(state: LessonCircuit, end: string, terminal: string): string | null {
  if (state.power) return 'Turn test power off before changing wiring.';
  const e = state.ends.find(e => e.id === end), t = state.terminals.find(t => t.id === terminal);
  if (!e || !t || e.box !== t.box) return 'Choose an end and a terminal in the same box.';
  if (endConnection(state, end)) return 'Disconnect this end before moving it.';
  if (Object.values(state.terminations).includes(terminal)) return 'This screw holds one conductor. Use a connector and pigtail for multiple wires.';
  // Allow incorrect purposes so the electrical evaluator can teach the fault.
  state.terminations[end] = terminal;
  return null;
}
export function disconnectLessonEnd(state: LessonCircuit, end: string): string | null {
  if (state.power) return 'Turn test power off before changing wiring.';
  delete state.terminations[end];
  const connector = state.connectors.find(c => c.members.includes(end));
  if (connector) state.connectors = state.connectors.filter(c => c.id !== connector.id);
  return null;
}
export function removeLessonConnector(state: LessonCircuit, id: number): string | null {
  if (state.power) return 'Turn test power off before changing wiring.';
  state.connectors = state.connectors.filter(c => c.id !== id);
  return null;
}
/** The overview and both close-ups edit this state; no independent box simulations. */
export function lessonLayout(state: LessonCircuit): BoxWiring {
  const attachments = Object.entries(state.terminations).flatMap(([end, terminal]) => {
    const e = state.ends.find(e => e.id === end);
    return e ? [span('attachment.' + end, end, terminal, e.kind, e.bare)] : [];
  });
  return { cables: state.cables.map(c => ({ ...c, fromBox: c.id === 'feed' ? 'panel' : 'switch', toBox: c.id === 'feed' ? 'switch' : 'light' })),
    leads: [...state.leads, ...attachments],
    splices: state.connectors.map(c => ({ id: 'connector.' + c.id, box: c.box === 'fixture' ? 'light' : 'switch', label: 'Connector ' + c.id, members: c.members, connected: true })),
    boxBonds: ['switch.box', 'light.box'] };
}
export function lessonContinuity(state: LessonCircuit, switchOn = state.switchOn) {
  const layout = lessonLayout(state), edges = new Map<string, Set<string>>();
  const join = (a: string, b: string) => {
    for (const [x, y] of [[a, b], [b, a]]) { if (!edges.has(x!)) edges.set(x!, new Set()); edges.get(x!)!.add(y!); }
  };
  for (const c of [...layout.cables.flatMap(c => c.conductors), ...layout.leads]) if (c.connected) join(c.from, c.to);
  for (const s of layout.splices) if (s.connected) s.members.slice(1).forEach(m => join(s.members[0]!, m));
  if (switchOn) join('switch.a', 'switch.b');
  const connected = (a: string, b: string) => {
    const seen = new Set<string>(), queue = [a];
    while (queue.length) { const n = queue.pop()!; if (n === b) return true; if (seen.has(n)) continue; seen.add(n); queue.push(...edges.get(n) ?? []); }
    return false;
  };
  return { hot: connected('panel.hot1', 'light.hot'), neutral: connected('panel.neutral', 'light.neutral'),
    switchGround: connected('panel.ground', 'switch.ground'), fixtureGround: connected('panel.ground', 'light.ground'),
    switchBox: connected('panel.ground', 'switch.box'), fixtureBox: connected('panel.ground', 'light.box') };
}
export function checkLessonCircuit(state: LessonCircuit, power = state.power, switchOn = state.switchOn) {
  const result = evaluateBoxWiring(lessonLayout(state), power, switchOn), errors = [...result.errors];
  const members = state.connectors.flatMap(c => c.members);
  if (members.some((id, i) => members.indexOf(id) !== i || state.terminations[id])) errors.push('A conductor end has more than one connection.');
  if (Object.values(state.terminations).some((id, i, all) => all.indexOf(id) !== i)) errors.push('A terminal holds more than one conductor.');
  if (state.connectors.some(c => c.members.length < 2 || c.members.length > 4 || c.members.some(id => !state.ends.some(e => e.id === id && e.box === c.box)))) errors.push('A connector contains invalid ends or crosses between boxes.');
  if (Object.entries(state.terminations).some(([end, terminal]) => {
    const e = state.ends.find(e => e.id === end), t = state.terminals.find(t => t.id === terminal);
    return !e || !t || e.box !== t.box;
  })) errors.push('Invalid terminal attachment.');
  const loose = state.ends.filter(e => !endConnection(state, e.id));
  if (loose.length) errors.push(loose.length + ' conductor ends are still disconnected.');
  return { valid: errors.length === 0, errors: [...new Set(errors)], lightOn: errors.length === 0 && result.lightOn, continuity: lessonContinuity(state, switchOn) };
}
export function setLessonPower(state: LessonCircuit, on: boolean): string | null {
  if (on && !checkLessonCircuit(state).valid) return 'Test power stays off. Correct the wiring first.';
  state.power = on; return null;
}

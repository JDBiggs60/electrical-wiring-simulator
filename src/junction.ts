import { evaluateBoxWiring, type BoxWiring } from './box-wiring.ts';
import type { WireColor } from './circuit.ts';

export const junctionEnds = {
  'a.hot': { label: 'Cable A · black', kind: 'hot' },
  'a.neutral': { label: 'Cable A · white', kind: 'neutral' },
  'a.ground': { label: 'Cable A · bare ground', kind: 'ground' },
  'b.hot': { label: 'Cable B · black', kind: 'hot' },
  'b.neutral': { label: 'Cable B · white', kind: 'neutral' },
  'b.ground': { label: 'Cable B · bare ground', kind: 'ground' },
  'pigtail.end': { label: 'Grounding pigtail · free end', kind: 'ground' },
} satisfies Record<string, { label: string; kind: WireColor }>;
export type EndId = keyof typeof junctionEnds;
export interface JunctionConnector { id: number; members: EndId[] }
export interface JunctionState { connectors: JunctionConnector[]; pigtail: boolean; boxAttached: boolean; nextId: number }
export function createJunction(): JunctionState { return { connectors: [], pigtail: false, boxAttached: false, nextId: 1 }; }
export function joinEnds(state: JunctionState, members: EndId[]): string | null {
  const unique = [...new Set(members)];
  if (unique.length < 2 || unique.length > 4) return 'Select two to four free conductor ends for this virtual connector.';
  if (unique.some(id => !Object.hasOwn(junctionEnds, id) || (id === 'pigtail.end' && !state.pigtail))) return 'That conductor is not present in this box.';
  if (unique.some(id => state.connectors.some(c => c.members.includes(id)))) return 'Remove the existing connector before changing its conductor ends.';
  state.connectors.push({ id: state.nextId++, members: unique });
  return null;
}
export function removeConnector(state: JunctionState, id: number) { state.connectors = state.connectors.filter(c => c.id !== id); }
export function setPigtail(state: JunctionState, present: boolean) {
  state.pigtail = present;
  if (!present) {
    state.boxAttached = false;
    state.connectors = state.connectors.map(c => ({ ...c, members: c.members.filter(id => id !== 'pigtail.end') })).filter(c => c.members.length > 1);
  }
}
/** Fixed external Phase 1 loop; all learner-created joins happen inside this junction. */
export function junctionLayout(state: JunctionState): BoxWiring {
  const span = (id: string, from: string, to: string, kind: WireColor, bare = false) => ({ id, from, to, kind, bare, label: id, connected: true });
  return {
    cables: [
      { id: 'a', label: 'Cable A · supply', fromBox: 'panel', toBox: 'junction', conductors: [
        span('a.black', 'panel.hot1', 'a.hot', 'hot'), span('a.white', 'panel.neutral', 'a.neutral', 'neutral'), span('a.bare', 'panel.ground', 'a.ground', 'ground', true),
      ] },
      { id: 'b', label: 'Cable B · downstream circuit', fromBox: 'junction', toBox: 'downstream', conductors: [
        span('b.black', 'b.hot', 'switch.a', 'hot'), span('b.white', 'b.neutral', 'light.neutral', 'neutral'), span('b.bare', 'b.ground', 'downstream.ground', 'ground', true),
      ] },
    ],
    leads: [span('switched-hot', 'switch.b', 'light.hot', 'hot'), span('switch-ground', 'downstream.ground', 'switch.ground', 'ground'), span('fixture-ground', 'downstream.ground', 'light.ground', 'ground'),
      ...(state.pigtail ? [span('box-pigtail', 'pigtail.end', 'bond.tail', 'ground')] : []),
      ...(state.pigtail && state.boxAttached ? [span('bond-attachment', 'bond.tail', 'junction.box', 'ground')] : []),
    ],
    splices: state.connectors.map(c => ({ id: `connector-${c.id}`, box: 'junction', label: `Connector ${c.id}`, members: c.members, connected: true })),
    boxBonds: ['junction.box'],
  };
}
export function checkJunction(state: JunctionState, power = false, switchOn = false) {
  const layout = junctionLayout(state);
  const result = evaluateBoxWiring(layout, power, switchOn);
  const edges = new Map<string, Set<string>>();
  const add = (a: string, b: string) => { if (!edges.has(a)) edges.set(a, new Set()); edges.get(a)!.add(b); };
  for (const w of [...layout.cables.flatMap(c => c.conductors), ...layout.leads]) {add(w.from,w.to);add(w.to,w.from);}
  for (const c of layout.splices) for (const a of c.members) for (const b of c.members) {add(a,b);}
  const connected = (a: string,b: string) => {
    const seen = new Set<string>(), queue = [a];
    while(queue.length) {const n=queue.pop()!;if(n===b)return true;if(seen.has(n))continue;seen.add(n);queue.push(...edges.get(n)??[]);}
    return false;
  };
  const errors: string[] = [];
  if (state.connectors.some(c => c.members.some(id => !Object.hasOwn(junctionEnds,id)) || c.members.length<2 || c.members.length>4 || new Set(c.members).size!==c.members.length)) errors.push('A connector contains invalid conductor ends. Remove it and make the connection again.');
  if (state.connectors.flatMap(c => c.members).some((id,i,all) => all.indexOf(id)!==i)) errors.push('A conductor end cannot be in two connectors.');
  if (!state.pigtail && state.connectors.some(c => c.members.includes('pigtail.end'))) errors.push('The grounding pigtail is missing.');
  const hots = ['a.hot', 'b.hot'], neutrals = ['a.neutral', 'b.neutral'];
  const grounds = ['a.ground', 'b.ground', 'junction.box', ...(state.pigtail ? ['pigtail.end'] : [])];
  const crosses = (a: string[], b: string[]) => a.some(x => b.some(y => connected(x,y)));
  if (crosses(hots,neutrals)) errors.push('Hot-to-neutral fault: a black conductor is spliced to a white conductor. Remove that connector and keep hot and neutral separate.');
  if (crosses(hots,grounds)) errors.push('Hot-to-ground fault: a black conductor touches an equipment-ground conductor or the steel box. Remove that incorrect splice.');
  if (crosses(neutrals,grounds)) errors.push('Neutral and equipment ground must remain separate. Bare or green ground is never the normal neutral return.');
  const continuity = { hot: connected('a.hot','b.hot'), neutral: connected('a.neutral','b.neutral'), ground: connected('a.ground','b.ground'), box: connected('a.ground','junction.box') };
  if (!continuity.hot) errors.push('Open hot: join Cable A black to Cable B black with a connector.');
  if (!continuity.neutral) errors.push('Open neutral: join Cable A white to Cable B white with a separate connector.');
  if (!continuity.ground) errors.push('Open equipment ground: join the two bare grounding conductors.');
  if (!continuity.box) errors.push('Missing steel-box bond: add a grounding pigtail, join its free end to both bare grounds, and attach its other end to the green box screw.');
  // Preserve the evaluator as a second check of the actual downstream single-pole circuit.
  if (!result.valid && !errors.length) errors.push(...result.errors);
  const valid = errors.length === 0 && result.valid;
  return { valid, errors, continuity, lightOn: valid && result.lightOn };
}

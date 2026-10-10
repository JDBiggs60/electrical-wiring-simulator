/** A simplified isolated branch-circuit teaching model, not an installation design tool. */
export type TerminalId = 'panel.hot1' | 'panel.hot2' | 'panel.neutral' | 'panel.ground' | 'switch.a' | 'switch.b' | 'switch.ground' | 'light.hot' | 'light.neutral' | 'light.ground';
export type WireColor = 'hot' | 'neutral' | 'ground';
export interface Wire { id: number; from: TerminalId; to: TerminalId; color: WireColor }
export interface CircuitResult { valid: boolean; errors: string[]; lightOn: boolean }
export const terminals: Record<TerminalId, { label: string; kind: WireColor; component: 'panel' | 'switch' | 'light' }> = {
  'panel.hot1': { label: 'Breaker 1 · hot output', kind: 'hot', component: 'panel' },
  'panel.hot2': { label: 'Breaker 2 · future lesson', kind: 'hot', component: 'panel' },
  'panel.neutral': { label: 'Panel · neutral bar', kind: 'neutral', component: 'panel' },
  'panel.ground': { label: 'Panel · ground bar', kind: 'ground', component: 'panel' },
  'switch.a': { label: 'Switch · brass terminal A', kind: 'hot', component: 'switch' },
  'switch.b': { label: 'Switch · brass terminal B', kind: 'hot', component: 'switch' },
  'switch.ground': { label: 'Switch · green ground screw', kind: 'ground', component: 'switch' },
  'light.hot': { label: 'Light · hot connection', kind: 'hot', component: 'light' },
  'light.neutral': { label: 'Light · neutral connection', kind: 'neutral', component: 'light' },
  'light.ground': { label: 'Light · grounding connection', kind: 'ground', component: 'light' },
};

function graph(wires: Wire[], closeSwitch = false) {
  const edges = new Map<TerminalId, Set<TerminalId>>();
  const add = (a: TerminalId, b: TerminalId) => {
    if (!edges.has(a)) edges.set(a, new Set());
    edges.get(a)!.add(b);
  };
  for (const w of wires) { add(w.from, w.to); add(w.to, w.from); }
  if (closeSwitch) { add('switch.a', 'switch.b'); add('switch.b', 'switch.a'); }
  return (a: TerminalId, b: TerminalId): boolean => {
    const seen = new Set<TerminalId>();
    const visit: TerminalId[] = [a];
    while (visit.length) {
      const current = visit.pop()!;
      if (current === b) return true;
      if (seen.has(current)) continue;
      seen.add(current);
      visit.push(...(edges.get(current) ?? []));
    }
    return false;
  };
}

export function evaluateCircuit(wires: Wire[], power = false, switchOn = false): CircuitResult {
  const errors: string[] = [];
  const open = graph(wires);
  const closed = graph(wires, true);
  const ids = Object.keys(terminals) as TerminalId[];
  // Check with the switch both open and closed: a latent fault must never energize.
  if (ids.some(a => ids.some(b => terminals[a].kind !== terminals[b].kind && closed(a, b)))) {
    errors.push('Keep hot, neutral, and ground separate. A connection between them creates a fault; ground must never carry the normal return current.');
  }
  if (wires.some(w => terminals[w.from].kind !== w.color || terminals[w.to].kind !== w.color)) {
    errors.push('Match wire colors to their purpose: black for hot, white for neutral, green for ground. Both switch brass screws belong on the hot path.');
  }
  if (wires.some(w => w.from === 'panel.hot2' || w.to === 'panel.hot2')) {
    errors.push('Use Breaker 1 for this lesson. Breaker 2 is reserved for a future circuit and cannot power this light.');
  }
  if (open('panel.hot1', 'light.hot')) {
    errors.push('The hot wire bypasses the switch. Route Breaker 1 through the two brass switch terminals before reaching the light.');
  }
  const forward = open('panel.hot1', 'switch.a') && open('switch.b', 'light.hot');
  const reverse = open('panel.hot1', 'switch.b') && open('switch.a', 'light.hot');
  if ((!forward && !reverse) || open('switch.a', 'switch.b')) {
    errors.push('Complete the switched hot path: Breaker 1 → one brass switch screw, then the other brass screw → light HOT. Either brass screw can be the incoming connection.');
  }
  if (!open('panel.neutral', 'light.neutral')) {
    errors.push('Connect the panel NEUTRAL bar directly to light NEUTRAL with a white wire. Neutral does not go through this switch.');
  }
  if (!open('panel.ground', 'switch.ground') || !open('panel.ground', 'light.ground')) {
    errors.push('Bond both the switch and light to the panel GROUND bar using green wires. Ground protects exposed metal; it is not a substitute for neutral.');
  }
  const valid = errors.length === 0;
  return { valid, errors, lightOn: valid && power && switchOn };
}

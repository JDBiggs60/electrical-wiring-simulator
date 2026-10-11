export type PartKind = 'box' | 'switch' | 'receptacle';
export interface Component { id: string; kind: PartKind; x: number; y: number; parentId: string | null; receptacle?: ReceptacleHardware }
export interface ReceptacleHardware {
  rating: '15A 125V NEMA 5-15R';
  terminals: { id: string; kind: 'hot' | 'neutral' | 'ground'; termination: null }[];
  tabs: { id: string; kind: 'hot' | 'neutral'; terminalIds: [string,string]; intact: true }[];
}
export interface Workbench { components: Component[]; nextId: number }
export const partSize = { box: { width: 172, height: 282 }, switch: { width: 108, height: 302 }, receptacle: { width: 108, height: 302 } };
// Align the preserved illustrations' top and bottom mounting centers at one
// uniform scale. Mounted coordinates are local to the parent component.
export const mountOffset = { x: 35, y: -6 };
export function createWorkbench(): Workbench { return { components: [], nextId: 1 }; }
export function addPart(state: Workbench, kind: PartKind, x: number, y: number) {
  const part: Component = { id: `part-${state.nextId++}`, kind, x, y, parentId: null };
  if (kind === 'receptacle') {
    part.receptacle = { rating: '15A 125V NEMA 5-15R',
      terminals: ['hot.upper','hot.lower','neutral.upper','neutral.lower','ground'].map(name => ({id:`${part.id}.${name}`,kind:name.split('.')[0] as 'hot'|'neutral'|'ground',termination:null})),
      tabs: (['hot','neutral'] as const).map(kind => ({id:`${part.id}.${kind}.tab`,kind,terminalIds:[`${part.id}.${kind}.upper`,`${part.id}.${kind}.lower`],intact:true})) };
  }
  state.components.push(part); return part;
}
export function worldPosition(state: Workbench, part: Component): { x: number; y: number } {
  const parent = state.components.find(p => p.id === part.parentId);
  if (!parent) return { x: part.x, y: part.y };
  const p = worldPosition(state,parent); return { x: p.x + part.x, y: p.y + part.y };
}
export function snapTarget(state: Workbench, part: Component): Component | undefined {
  if (part.kind === 'box' || part.parentId) return;
  return state.components.filter(p => p.kind === 'box' && !state.components.some(child => child.parentId === p.id)).reverse().find(box => {
    const p = worldPosition(state,box);
    return Math.abs(part.x - p.x - mountOffset.x) < 62 && Math.abs(part.y - p.y - mountOffset.y) < 85;
  });
}
export function mountDevice(state: Workbench, part: Component, box: Component) {
  if (part.kind === 'box' || box.kind !== 'box' || part.parentId || state.components.some(p => p.parentId === box.id)) return false;
  part.parentId = box.id; Object.assign(part,mountOffset); return true;
}
export function deletePart(state: Workbench, id: string) {
  const removed = new Set([id]);
  for (const p of state.components) if (p.parentId && removed.has(p.parentId)) removed.add(p.id);
  state.components = state.components.filter(p => !removed.has(p.id));
}
export function workbenchHistory(state: Workbench) {
  const past: Workbench[] = [], future: Workbench[] = [];
  return {
    get canUndo() { return past.length > 0; }, get canRedo() { return future.length > 0; },
    record(before: Workbench) {
      if (JSON.stringify(before) === JSON.stringify(state)) return;
      past.push(structuredClone(before)); future.length = 0;
    },
    undo() { const prior = past.pop(); if (prior) { future.push(structuredClone(state)); Object.assign(state,structuredClone(prior)); } },
    redo() { const next = future.pop(); if (next) { past.push(structuredClone(state)); Object.assign(state,structuredClone(next)); } },
  };
}

// Preserve the existing switch API for prior phases.
export const mountSwitch = mountDevice;

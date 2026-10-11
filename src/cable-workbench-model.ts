import { createWorkbench as baseCreate, deletePart as baseDelete, worldPosition, type Component, type Workbench as BaseWorkbench } from './workbench-model.ts';
export { addPart, mountOffset, mountSwitch, partSize, snapTarget, workbenchHistory, worldPosition } from './workbench-model.ts';
export type { PartKind } from './workbench-model.ts';
export type EntryId = 'left' | 'right';
export interface CableEnd { boxId: string; entryId: EntryId }
export interface CableConductor { id: string; kind: 'black' | 'white' | 'bare'; ends: [CableEnd & { id: string; termination: null }, CableEnd & { id: string; termination: null }] }
export interface InstalledCable { id: string; type: '14/2 NM-B with ground'; from: CableEnd; to: CableEnd; conductors: CableConductor[] }
export interface Workbench extends BaseWorkbench { cables: InstalledCable[]; nextCableId: number }
export const entries = { left: { x:25.35, y:108.55, side:-1 }, right: { x:146.9, y:162.5, side:1 } } as const;
export function createWorkbench(): Workbench { return { ...baseCreate(), cables: [], nextCableId:1 }; }
export function entryPosition(state: Workbench, end: CableEnd) {
  const box = state.components.find(p => p.id === end.boxId && p.kind === 'box');
  if (!box) return null;
  const p = worldPosition(state,box), entry = entries[end.entryId];
  return { x:p.x+entry.x, y:p.y+entry.y, side:entry.side };
}
export function entryFree(state: Workbench, end: CableEnd) {
  return !!entryPosition(state,end) && !state.cables.some(c => [c.from,c.to].some(e => e.boxId === end.boxId && e.entryId === end.entryId));
}
export function nearestEntry(state: Workbench, point: {x:number;y:number}, source?: CableEnd): CableEnd | null {
  let best: CableEnd | null = null, distance = 38;
  for (const box of state.components.filter(p => p.kind === 'box' && p.id !== source?.boxId)) for (const entryId of ['left','right'] as EntryId[]) {
    const end = {boxId:box.id,entryId}, p = entryPosition(state,end)!;
    const d = Math.hypot(p.x-point.x,p.y-point.y);
    if (d < distance && entryFree(state,end)) { distance = d; best = end; }
  }
  return best;
}
export function installCable(state: Workbench, from: CableEnd, to: CableEnd): string | null {
  if (from.boxId === to.boxId || !entryFree(state,from) || !entryFree(state,to)) return 'Choose free knockout entries on two different boxes.';
  const id = `cable-${state.nextCableId++}`;
  state.cables.push({id,type:'14/2 NM-B with ground',from:{...from},to:{...to},conductors:(['black','white','bare'] as const).map(kind => ({id:`${id}.${kind}`,kind,ends:[{...from,id:`${id}.${kind}.from`,termination:null},{...to,id:`${id}.${kind}.to`,termination:null}]}))});
  return null;
}
export function deletePart(state: Workbench,id:string) {
  baseDelete(state,id);
  state.cables = state.cables.filter(c => c.id !== id && state.components.some(p => p.id === c.from.boxId) && state.components.some(p => p.id === c.to.boxId));
}
export function unmountDevice(state: Workbench, part: Component) {
  if (!part.parentId) return false;
  const p = worldPosition(state,part); part.parentId = null; part.x = p.x+185; part.y = p.y; return true;
}
/** Shared inspection projection; every conductor is the same object from the
 * installed cable, with disconnected termination records at both ends. */
export function inspectBox(state: Workbench,boxId:string) {
  return state.cables.filter(c => c.from.boxId === boxId || c.to.boxId === boxId).map(cable => ({cable,entry:cable.from.boxId === boxId ? cable.from : cable.to,conductors:cable.conductors}));
}
export function cableRoute(state: Workbench,cable: InstalledCable) {
  const a = entryPosition(state,cable.from)!, b = entryPosition(state,cable.to)!;
  const obstacles = state.components.filter(p => !p.parentId).map(p => ({ x:p.x-12,y:p.y-12,right:p.x+(p.kind === 'box' ? 172 : 108)+12,bottom:p.y+(p.kind === 'box' ? 282 : 302)+12 }));
  const xs = [...new Set([a.x+a.side*52,b.x+b.side*52,...obstacles.flatMap(o => [o.x-24,o.right+24])])].sort((x,y)=>x-y);
  const ys = [...new Set([a.y,b.y,...obstacles.flatMap(o => [o.y-32,o.bottom+32])])].sort((x,y)=>x-y);
  const blocked = (x:number,y:number) => obstacles.some(o => x>o.x && x<o.right && y>o.y && y<o.bottom);
  const nodes = xs.flatMap(x => ys.filter(y => !blocked(x,y)).map(y => ({x,y})));
  const start = nodes.findIndex(p => p.x === a.x+a.side*52 && p.y === a.y), goal = nodes.findIndex(p => p.x === b.x+b.side*52 && p.y === b.y);
  const clear = (p:{x:number;y:number},q:{x:number;y:number}) => !obstacles.some(o => p.x === q.x ? p.x>o.x && p.x<o.right && Math.max(p.y,q.y)>o.y && Math.min(p.y,q.y)<o.bottom : p.y>o.y && p.y<o.bottom && Math.max(p.x,q.x)>o.x && Math.min(p.x,q.x)<o.right);
  const costs = new Map<number,number>([[start,0]]), previous = new Map<number,number>(), remaining = new Set(nodes.map((_,i)=>i));
  while (remaining.size && start >= 0 && goal >= 0) {
    let current = -1, cost = Infinity;
    for (const i of remaining) if ((costs.get(i) ?? Infinity)<cost) { current=i;cost=costs.get(i)!; }
    if (current < 0 || current === goal) break;
    remaining.delete(current); const p = nodes[current]!;
    for (const i of remaining) { const q = nodes[i]!; if ((p.x !== q.x && p.y !== q.y) || !clear(p,q)) continue;
      const candidate = cost+Math.abs(p.x-q.x)+Math.abs(p.y-q.y)+3;
      if (candidate < (costs.get(i) ?? Infinity)) { costs.set(i,candidate); previous.set(i,current); }
    }
  }
  const route: {x:number;y:number}[] = [];
  let index = goal;
  if (start >= 0 && goal >= 0 && costs.has(goal)) { while (index !== start) { route.unshift(nodes[index]!); index=previous.get(index)!; } route.unshift(nodes[start]!); }
  const issue = !route.length;
  const points = issue ? [a,{x:a.x+a.side*52,y:a.y},{x:b.x+b.side*52,y:b.y},b] : [a,...route,b];
  return { path:'M'+points.map(p=>`${p.x} ${p.y}`).join('L'), issue, points };
}

export const unmountSwitch = unmountDevice;

export type PartKind = 'box' | 'switch' | 'receptacle' | 'panel';
export interface Component { id: string; kind: PartKind; x: number; y: number; parentId: string | null; receptacle?: ReceptacleHardware; terminals: BranchTerminal[]; panel?: PanelHardware; pulledOut?: boolean }
export interface BranchTerminal { id: string; componentId: string; kind: 'hot' | 'neutral' | 'ground'; x: number; y: number; termination: string | null }
export interface PanelHardware {
  designation: 'subpanel'; neutralIsolated: true; groundBarBondedToEnclosure: true;
  source: { kind: 'protected-simulated-120v'; accessible: false };
  spaces: { id: string; position: number; breaker: null | { id: string; amps: 15; poles: 1; terminalId: string; on: boolean } }[];
}
export interface ReceptacleHardware {
  rating: '15A 125V NEMA 5-15R';
  terminals: { id: string; kind: 'hot' | 'neutral' | 'ground'; termination: string | null }[];
  tabs: { id: string; kind: 'hot' | 'neutral'; terminalIds: [string,string]; intact: true }[];
}
// Future direct-drag wiring will add graph edges between these stable node IDs.
export interface ElectricalConnection { id: string; fromId: string; toId: string }
export interface GroundPigtail { id:string; boxId:string; role:'device'|'box'; ends: {id:string;boxId:string;kind:'bare';termination:string|null}[] }
export interface WireNutConnector {id:string;boxId:string;capacity:3|4;kind:'hot'|'neutral'|'ground';endIds:string[];x:number;y:number}
export interface SpliceGroup {id:string;boxId:string;kind:'hot'|'neutral'|'ground';endIds:string[];x:number;y:number}
export interface Workbench { components: Component[]; nextId: number; connections: ElectricalConnection[]; pigtails:GroundPigtail[]; connectors:WireNutConnector[]; spliceGroups:SpliceGroup[]; nextWiringId:number; power:boolean }
export const partSize = { box: { width: 172, height: 282 }, switch: { width: 108, height: 302 }, receptacle: { width: 108, height: 302 }, panel: { width: 260, height: 420 } };
// Align the preserved illustrations' top and bottom mounting centers at one
// uniform scale. Mounted coordinates are local to the parent component.
export const mountOffset = { x: 35, y: -6 };
export function createWorkbench(): Workbench { return { components: [], nextId: 1, connections: [], pigtails:[], connectors:[],spliceGroups:[],nextWiringId:1,power:false }; }
export function addPart(state: Workbench, kind: PartKind, x: number, y: number) {
  const part: Component = { id: `part-${state.nextId++}`, kind, x, y, parentId: null, terminals: [] };
  if (kind === 'receptacle') {
    part.receptacle = { rating: '15A 125V NEMA 5-15R',
      terminals: ['hot.upper','hot.lower','neutral.upper','neutral.lower','ground'].map(name => ({id:`${part.id}.${name}`,kind:name.split('.')[0] as 'hot'|'neutral'|'ground',termination:null})),
      tabs: (['hot','neutral'] as const).map(kind => ({id:`${part.id}.${kind}.tab`,kind,terminalIds:[`${part.id}.${kind}.upper`,`${part.id}.${kind}.lower`],intact:true})) };
  }
  const terminal=(name:string,kind:BranchTerminal['kind'],x:number,y:number):BranchTerminal => ({id:`${part.id}.${name}`,componentId:part.id,kind,x,y,termination:null});
  if (kind === 'box') part.terminals=[terminal('box','ground',52,213.85)];
  if (kind === 'switch') part.terminals=[terminal('a','hot',103,98),terminal('b','hot',103,205),terminal('ground','ground',10,236)];
  if (kind === 'receptacle') part.terminals=part.receptacle!.terminals.map(t => ({...t,componentId:part.id,x:t.kind==='hot'?96:t.kind==='neutral'?18:23,y:t.kind==='ground'?239:t.id.endsWith('upper')?91:200}));
  if (kind === 'receptacle') part.receptacle!.terminals=part.terminals;
  if (kind === 'panel') {
    part.panel={designation:'subpanel',neutralIsolated:true,groundBarBondedToEnclosure:true,source:{kind:'protected-simulated-120v',accessible:false},spaces:Array.from({length:6},(_,i)=>({id:`${part.id}.space.${i+1}`,position:i+1,breaker:i<2?{id:`${part.id}.breaker.${i+1}`,amps:15,poles:1,on:false,terminalId:`${part.id}.breaker.${i+1}.hot`}:null}))};
    part.terminals=[terminal('breaker.1.hot','hot',83,166),terminal('breaker.2.hot','hot',177,166),...Array.from({length:6},(_,i)=>terminal(`neutral.${i+1}`,'neutral',45,185+i*24)),...Array.from({length:6},(_,i)=>terminal(`ground.${i+1}`,'ground',225,185+i*24))];
  }
  state.components.push(part); return part;
}
export function worldPosition(state: Workbench, part: Component): { x: number; y: number } {
  const parent = state.components.find(p => p.id === part.parentId);
  if (!parent) return { x: part.x, y: part.y };
  const p = worldPosition(state,parent); return { x: p.x + part.x + (part.pulledOut?200:0), y: p.y + part.y };
}
export function snapTarget(state: Workbench, part: Component): Component | undefined {
  if ((part.kind !== 'switch' && part.kind !== 'receptacle') || (part.parentId&&!part.pulledOut)) return;
  return state.components.filter(p => p.kind === 'box' && !state.components.some(child => child.parentId === p.id && child.id!==part.id)).reverse().find(box => {
    const p = worldPosition(state,box);
    return Math.abs(worldPosition(state,part).x - p.x - mountOffset.x) < 62 && Math.abs(worldPosition(state,part).y - p.y - mountOffset.y) < 85;
  });
}
export function mountDevice(state: Workbench, part: Component, box: Component) {
  if ((part.kind !== 'switch' && part.kind !== 'receptacle') || box.kind !== 'box' || (part.parentId&&!(part.pulledOut&&part.parentId===box.id)) || state.components.some(p => p.parentId === box.id && p.id!==part.id)) return false;
  part.parentId = box.id; part.pulledOut=false; Object.assign(part,mountOffset); return true;
}
export function deletePart(state: Workbench, id: string) {
  const removed = new Set([id]);
  for (const p of state.components) if (p.parentId && removed.has(p.parentId)) removed.add(p.id);
  const nodes=new Set(state.components.filter(p=>removed.has(p.id)).flatMap(p=>p.terminals.map(t=>t.id)));
  state.connections=state.connections.filter(c=>!nodes.has(c.fromId)&&!nodes.has(c.toId));
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

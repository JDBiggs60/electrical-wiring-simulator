export type PartKind = 'box' | 'box2' | 'box3' | 'ceiling' | 'lampholder' | 'switch' | 'receptacle' | 'panel';
export interface Component { id: string; kind: PartKind; x: number; y: number; parentId: string | null; receptacle?: ReceptacleHardware; terminals: BranchTerminal[]; panel?: PanelHardware; slot?: number; pulledOut?: boolean; switchClosed?: boolean }
export interface BranchTerminal { id: string; componentId: string; kind: 'hot' | 'neutral' | 'ground'; x: number; y: number; termination: string | null }
export interface PanelHardware {
  designation: 'subpanel'; neutralIsolated: true; groundBarBondedToEnclosure: true;
  source: { kind: 'protected-simulated-120v'; accessible: false };
  spaces: { id: string; position: number; breaker: null | { id: string; amps: 15; poles: 1; terminalId: string; on: boolean; tripped?: boolean; tripReason?: string } }[];
}
export interface ReceptacleHardware {
  rating: '15A 125V NEMA 5-15R';
  terminals: { id: string; kind: 'hot' | 'neutral' | 'ground'; termination: string | null }[];
  tabs: { id: string; kind: 'hot' | 'neutral'; terminalIds: [string,string]; intact: true }[];
}
// Future direct-drag wiring will add graph edges between these stable node IDs.
export interface ElectricalConnection { id: string; fromId: string; toId: string }
export interface GroundPigtail { id:string; boxId:string; deviceId?:string; role:'device'|'box'; ends: {id:string;boxId:string;kind:'bare';termination:string|null}[] }
export interface WireNutConnector {id:string;boxId:string;capacity:3|4;kind:'hot'|'neutral'|'ground';endIds:string[];x:number;y:number}
export interface SpliceGroup {id:string;boxId:string;kind:'hot'|'neutral'|'ground';endIds:string[];x:number;y:number}
export interface Workbench { components: Component[]; nextId: number; connections: ElectricalConnection[]; pigtails:GroundPigtail[]; connectors:WireNutConnector[]; spliceGroups:SpliceGroup[]; nextWiringId:number; power:boolean }
export const partSize = { box: { width: 172, height: 282 }, box2: { width: 292, height: 282 }, box3: { width: 412, height: 282 }, ceiling: { width: 220, height: 220 }, lampholder: { width: 190, height: 190 }, switch: { width: 108, height: 302 }, receptacle: { width: 108, height: 302 }, panel: { width: 260, height: 420 } };
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
  if (isSteelBox(part)) part.terminals=[terminal('box','ground',52,kind==='ceiling'?155:213.85)];
  if (kind === 'lampholder') part.terminals=[terminal('hot','hot',160,105),terminal('neutral','neutral',30,105)];
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
export const isSteelBox = (p:Component) => ['box','box2','box3','ceiling'].includes(p.kind);
export const isDevice = (p:Component) => ['switch','receptacle','lampholder'].includes(p.kind);
export const gangCount = (p:Component) => p.kind==='box3'?3:p.kind==='box2'?2:1;
export const compatible = (device:Component,box:Component) => isSteelBox(box) && (box.kind==='ceiling'?device.kind==='lampholder':device.kind==='switch'||device.kind==='receptacle');
export const slotOffset = (box:Component,slot=0) => box.kind==='ceiling'?{x:15,y:15}:{x:mountOffset.x+120*slot,y:mountOffset.y};
export function mountingSlot(state:Workbench,part:Component,box:Component):number|undefined {
 if(!compatible(part,box))return;
 const p=worldPosition(state,box),d=worldPosition(state,part);
 return Array.from({length:gangCount(box)},(_,i)=>i).filter(i=>!state.components.some(c=>c.parentId===box.id&&c.id!==part.id&&(c.slot??0)===i)).sort((a,b)=>Math.abs(d.x-p.x-slotOffset(box,a).x)-Math.abs(d.x-p.x-slotOffset(box,b).x))[0];
}
export function snapTarget(state: Workbench, part: Component): Component | undefined {
 if(!isDevice(part)||(part.parentId&&!part.pulledOut))return;
 return state.components.filter(p=>compatible(part,p)).reverse().find(box=>{
  const slot=mountingSlot(state,part,box);if(slot===undefined)return false;
  const p=worldPosition(state,box),d=worldPosition(state,part),offset=slotOffset(box,slot);
  return Math.abs(d.x-p.x-offset.x)<62&&Math.abs(d.y-p.y-offset.y)<85;
 });
}
export function mountDevice(state: Workbench, part: Component, box: Component) {
 const slot=mountingSlot(state,part,box);
 if(slot===undefined||(part.parentId&&!(part.pulledOut&&part.parentId===box.id)))return false;
 part.parentId=box.id;part.slot=slot;part.pulledOut=false;Object.assign(part,slotOffset(box,slot));return true;
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
  function restore(snapshot:Workbench){
    const operating=(state.components.some(p=>p.kind==='lampholder'||p.panel?.spaces.some(b=>b.breaker?.tripped))||snapshot.components.some(p=>p.kind==='lampholder'))?{power:state.power,parts:structuredClone(state.components)}:null;
    Object.assign(state,structuredClone(snapshot));
    if(operating){state.power=operating.power;for(const p of state.components){const live=operating.parts.find(q=>q.id===p.id);if(live){p.switchClosed=live.switchClosed;for(const space of p.panel?.spaces??[]){const b=live.panel?.spaces.find(q=>q.breaker?.id===space.breaker?.id)?.breaker;if(b&&space.breaker){space.breaker.on=b.on;space.breaker.tripped=b.tripped;space.breaker.tripReason=b.tripReason;}}}}}
  }
  return {
    get canUndo() { return past.length > 0; }, get canRedo() { return future.length > 0; },
    record(before: Workbench) {
      if (JSON.stringify(before) === JSON.stringify(state)) return;
      past.push(structuredClone(before)); future.length = 0;
    },
    undo() { const prior = past.pop(); if (prior) { future.push(structuredClone(state)); restore(prior); } },
    redo() { const next = future.pop(); if (next) { past.push(structuredClone(state)); restore(next); } },
  };
}

// Preserve the existing switch API for prior phases.
export const mountSwitch = mountDevice;

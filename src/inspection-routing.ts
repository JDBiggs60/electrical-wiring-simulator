import {partSize, type Component} from './workbench-model.ts';
export interface RoutePoint {x:number;y:number}
export interface Projection {x:number;y:number;scale:number}

/** Project visual positions into the usable cavity, with room for the cap or
 * copper tip. This never edits conductor length, membership or termination. */
export function insideBox(point:RoutePoint,box:Component,base:Projection,margin=6):RoutePoint {
 const m=margin/base.scale;
 const vertices=box.kind==='ceiling'
  ? (()=>{const a=20+m,b=200-m,c=90+Math.SQRT2*m,d=350-Math.SQRT2*m;return [{x:c-a,y:a},{x:d-b,y:a},{x:b,y:c-a},{x:b,y:d-b},{x:d-b,y:b},{x:c-a,y:b},{x:a,y:d-b},{x:a,y:c-a}];})()
  : [{x:26+m,y:18+m},{x:partSize[box.kind].width-25-m,y:18+m},{x:partSize[box.kind].width-25-m,y:260-m},{x:26+m,y:260-m}];
 const p={x:(point.x-base.x)/base.scale,y:(point.y-base.y)/base.scale};
 let inside=true,best=p,distance=Infinity;
 for(let i=0;i<vertices.length;i++) {
  const a=vertices[i]!,b=vertices[(i+1)%vertices.length]!,dx=b.x-a.x,dy=b.y-a.y;
  if(dx*(p.y-a.y)-dy*(p.x-a.x)<-1e-6)inside=false;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
  const q={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(q.x-p.x,q.y-p.y);
  if(d<distance){distance=d;best=q;}
 }
 if(inside)return point;
 const q=best;return {x:base.x+q.x*base.scale,y:base.y+q.y*base.scale};
}

/** Rounded, bounded polyline: corner controls stay in the adjacent segments'
 * convex hull, so rounding cannot manufacture a loop or overshoot. */
export function smoothRoute(input:RoutePoint[],radius=10):string {
 const points=input.filter((p,i)=>!i||Math.hypot(p.x-input[i-1]!.x,p.y-input[i-1]!.y)>.01);
 if(points.length===1)return `M${points[0]!.x} ${points[0]!.y}`;
 let d=`M${points[0]!.x} ${points[0]!.y}`;
 for(let i=1;i<points.length-1;i++) {
  const a=points[i-1]!,b=points[i]!,c=points[i+1]!,before=Math.hypot(a.x-b.x,a.y-b.y),after=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(radius,before/2,after/2);
  d+=`L${b.x+(a.x-b.x)*r/before} ${b.y+(a.y-b.y)*r/before}Q${b.x} ${b.y} ${b.x+(c.x-b.x)*r/after} ${b.y+(c.y-b.y)*r/after}`;
 }
 const end=points.at(-1)!;return d+`L${end.x} ${end.y}`;
}

/** Only the face is an obstacle. Approach exposed side screws from their own
 * side instead of circling the entire yoke or porcelain mounting plate. */
export function deviceRoute(origin:RoutePoint,end:RoutePoint,device:Component,pos:Projection,lane:number):RoutePoint[] {
 const lamp=device.kind==='lampholder',gap=(8+(lane%3)*4)*pos.scale;
 const left=pos.x+(lamp?50:26.5)*pos.scale-gap,right=pos.x+(lamp?140:75.5)*pos.scale+gap;
 const top=pos.y+(lamp?54:48)*pos.scale-gap,bottom=pos.y+(lamp?144:245)*pos.scale+gap;
 const rightTerminal=end.x>right-gap,approach={x:rightTerminal?Math.max(right,end.x+10*pos.scale):Math.min(left,end.x-10*pos.scale),y:end.y};
 // Same-side connections need no detour, including both grounding screws.
 if((origin.x<=left&&!rightTerminal)||(origin.x>=right&&rightTerminal))return [origin,approach,end];
 const rail=Math.abs(origin.y-top)+Math.abs(end.y-top)<=Math.abs(origin.y-bottom)+Math.abs(end.y-bottom)?top:bottom;
 const entry=origin.x<left?left:origin.x>right?right:origin.x;
 return [origin,{x:entry,y:origin.y},{x:entry,y:rail},{x:approach.x,y:rail},approach,end];
}

export interface RouteObstacle {left:number;top:number;right:number;bottom:number}
export function faceObstacle(device:Component,pos:Projection):RouteObstacle {
 const lamp=device.kind==='lampholder';
 return {left:pos.x+(lamp?52:26.5)*pos.scale,right:pos.x+(lamp?138:75.5)*pos.scale,top:pos.y+(lamp?56:48)*pos.scale,bottom:pos.y+(lamp?142:245)*pos.scale};
}
const inRect=(p:RoutePoint,r:RouteObstacle)=>p.x>r.left+.001&&p.x<r.right-.001&&p.y>r.top+.001&&p.y<r.bottom-.001;
const segmentClear=(a:RoutePoint,b:RoutePoint,r:RouteObstacle)=>{
 let lo=0,hi=1;
 for(const [start,delta,min,max]of [[a.x,b.x-a.x,r.left+.01,r.right-.01],[a.y,b.y-a.y,r.top+.01,r.bottom-.01]]) {
  if(Math.abs(delta)<.00001){if(start<min||start>max)return true;continue;}
  const x=(min-start)/delta,y=(max-start)/delta;lo=Math.max(lo,Math.min(x,y));hi=Math.min(hi,Math.max(x,y));
 }
 return lo>hi||hi<=0||lo>=1;
};
/** Resolve visual placements against the same cavity and face geometry used by
 * paths. No stored connector memberships or endpoint coordinates are changed. */
export function clearBoxPoint(point:RoutePoint,box:Component,base:Projection,obstacles:RouteObstacle[],margin=8):RoutePoint {
 const p=insideBox(point,box,base,margin);
 const valid=(q:RoutePoint)=>{const a=insideBox(q,box,base,margin);return Math.hypot(a.x-q.x,a.y-q.y)<.01&&!obstacles.some(r=>inRect(q,r));};
 if(valid(p))return p;
 const xs=[p.x,...obstacles.flatMap(r=>[r.left-1,r.right+1])],ys=[p.y,...obstacles.flatMap(r=>[r.top-1,r.bottom+1])];
 let best=p,cost=Infinity;
 for(const x of xs)for(const y of ys){const q=insideBox({x,y},box,base,margin),d=Math.hypot(q.x-point.x,q.y-point.y);if(d<cost&&valid(q)){best=q;cost=d;}}
 return best;
}

/** Visibility graph in inspection coordinates. Every stationary segment stays
 * in the convex cavity and avoids every mounted face. Rounded corners are
 * bounded by adjacent segments; there are no fixed Bézier overshoot offsets. */
export function cavityRoute(origin:RoutePoint,end:RoutePoint,box:Component,base:Projection,faces:RouteObstacle[],lane=0,dragging=false):RoutePoint[] {
 const gap=6+(5-lane%6)*2;
 const distance=(p:RoutePoint,r:RouteObstacle)=>Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));
 const active=faces.map(r=>{
  const clearance=Math.max(0,Math.min(gap,distance(origin,r)-1,distance(end,r)-1));
  return {left:r.left-clearance,top:r.top-clearance,right:r.right+clearance,bottom:r.bottom+clearance};
 });
 const inside=(p:RoutePoint)=>{const q=insideBox(p,box,base,4);return Math.hypot(p.x-q.x,p.y-q.y)<.01;};
 const valid=(p:RoutePoint)=>inside(p)&&!active.some(r=>inRect(p,r));
 const candidates=[origin,end,...active.flatMap(r=>[{x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom}])];
 const nodes=candidates.filter((p,i)=>i<2||valid(p));
 const costs=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),visited=new Set<number>();costs[0]=0;
 while(visited.size<nodes.length){
  let index=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(index<0||costs[i]!<costs[index]!))index=i;
  if(index<0||!Number.isFinite(costs[index]!)||index===1)break;
  visited.add(index);
  for(let j=0;j<nodes.length;j++){
   if(j===index||visited.has(j))continue;
   const a=nodes[index]!,b=nodes[j]!;
   if(!active.every(r=>segmentClear(a,b,r)))continue;
   if(!dragging&&(!inside(a)||!inside(b)))continue;
   const cost=costs[index]!+Math.hypot(b.x-a.x,b.y-a.y)+8;
   if(cost<costs[j]!){costs[j]=cost;prev[j]=index;}
  }
 }
 if(!Number.isFinite(costs[1]!))return [origin,end];
 const points=[end];for(let i=prev[1]!;i>=0;i=prev[i]!)points.unshift(nodes[i]!);
 return points;
}

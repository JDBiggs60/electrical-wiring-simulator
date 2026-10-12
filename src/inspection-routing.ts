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

// geometry/dxf.js
import DxfParser from 'dxf-parser';
import { area, ensureCCW } from './utils.js';

export function parseDXFtoPolylines(dxfString){
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfString);
  const entities = dxf.entities || [];
  const polys = [];
  for(const e of entities){
    if(e.type === 'LWPOLYLINE' && e.vertices && e.vertices.length>=3){
      const pts = e.vertices.map(v=>[v.x, v.y]);
      if(e.shape || e.closed || closeEnough(pts[0], pts.at(-1))) polys.push({points: ensureCCW(closeIfNeeded(pts)), layer:e.layer||'0'});
    } else if(e.type==='POLYLINE' && e.vertices && e.vertices.length>=3){
      const pts = e.vertices.map(v=>[v.x, v.y]);
      if(e.closed || closeEnough(pts[0], pts.at(-1))) polys.push({points: ensureCCW(closeIfNeeded(pts)), layer:e.layer||'0'});
    }
  }
  // choose largest by absolute area as panel
  if(polys.length===0) throw new Error('No closed polylines found');
  polys.sort((a,b)=>Math.abs(area(b.points))-Math.abs(area(a.points)));
  return polys;
}

export function findPanelOutline(polys){
  return polys[0]; // largest
}

export function findCablePath(polys){
  // pick first poly on 'CABLE_PATH' if exists; else return null
  const c = polys.find(p=> (p.layer||'').toUpperCase()==='CABLE_PATH');
  return c || null;
}

function closeIfNeeded(pts){
  const a=pts[0], b=pts[pts.length-1];
  if(!closeEnough(a,b)) return [...pts, a];
  return pts;
}
function closeEnough(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]) < 1e-6; }

// src/main.js
import { parseDXFtoPolylines, findPanelOutline, findCablePath } from './geometry/dxf.js';
import { insetPolygon } from './geometry/clipper.js';
import { bbox, perimeter, samplePerimeterEquidistant, lineSampleAlongX, lineSampleAlongY, clampInside, pointInPolygon } from './geometry/utils.js';
import { renderSVG } from './geometry/svg.js';
import { exportDXF } from './geometry/export-dxf.js';

const els = {
  file: document.getElementById('file'),
  unitsScale: document.getElementById('unitsScale'),
  edgeClear: document.getElementById('edgeClear'),
  drillDia: document.getElementById('drillDia'),
  spacing: document.getElementById('spacing'),
  mode: document.getElementById('mode'),
  cableDia: document.getElementById('cableDia'),
  cableSpacing: document.getElementById('cableSpacing'),
  btnPlace: document.getElementById('btnPlace'),
  btnExport: document.getElementById('btnExport'),
  svgMount: document.getElementById('svgMount'),
  msg: document.getElementById('msg')
};

let state = {
  panel: null,
  cablePath: null,
  drillPts: [],
  cablePts: [],
  lastDXFString: null
};

els.file.addEventListener('change', async (e)=>{
  const f = e.target.files?.[0];
  if(!f) return;
  const text = await f.text();
  try{
    const polys = parseDXFtoPolylines(text);
    const panelPoly = findPanelOutline(polys);
    state.panel = scalePoints(panelPoly.points, Number(els.unitsScale.value||1));
    const cable = findCablePath(polys);
    state.cablePath = cable ? scalePoints(cable.points, Number(els.unitsScale.value||1)) : null;
    state.lastDXFString = text;
    note('DXF loaded ✓');
    preview();
  }catch(err){
    console.warn('DXF parsing failed, trying SVG...', err);
    if(f.name.toLowerCase().endswith('.svg')){
      // naive SVG rectangle fallback
      const rect = await parseSVGRect(text);
      if(rect){
        state.panel = rect;
        state.cablePath = null;
        note('SVG rectangle loaded ✓');
        preview();
      } else {
        note('Could not parse file. Use DXF with a closed LWPOLYLINE.');
      }
    } else {
      note('Could not parse DXF. Ensure there is a closed LWPOLYLINE outline.');
    }
  }
});

els.btnPlace.addEventListener('click', ()=>{
  if(!state.panel){ note('Load a DXF first.'); return; }
  const edge = Number(els.edgeClear.value||15);
  const drillDia = Number(els.drillDia.value||5);
  const spacing = Number(els.spacing.value||200);
  const mode = els.mode.value;
  const cableDia = Number(els.cableDia.value||10);
  const cableSpacing = Number(els.cableSpacing.value||150);

  // inset polygon for clearance from edge (centre must be >= edge + r)
  const rD = drillDia/2;
  const rC = cableDia/2;
  const insetForDrill = insetPolygon(state.panel, -(edge + rD));
  if(!insetForDrill || insetForDrill.length<3){ note('Inset failed — edge clearance too large for panel size.'); return; }

  let drillPts = [];
  if(mode === 'border'){
    const peri = perimeter(insetForDrill);
    let n = Math.max(4, Math.round(peri / spacing));
    drillPts = samplePerimeterEquidistant(insetForDrill, n, 40);
  } else {
    const b = bbox(state.panel);
    if(mode === 'centre_h' || mode === 'centre_both'){
      const y = (b.minY + b.maxY)/2;
      const pts = lineSampleAlongX(b, y, b.minX + (edge + rD), b.maxX - (edge + rD), spacing);
      for(const p of pts){
        const q = clampInside(p, insetForDrill);
        if(q) drillPts.push(q);
      }
    }
    if(mode === 'centre_v' || mode === 'centre_both'){
      const x = (b.minX + b.maxX)/2;
      const pts = lineSampleAlongY(b, x, b.minY + (edge + rD), b.maxY - (edge + rD), spacing);
      for(const p of pts){
        const q = clampInside(p, insetForDrill);
        if(q) drillPts.push(q);
      }
    }
  }

  // Cable holes if cable path exists
  let cablePts = [];
  if(state.cablePath){
    const insetForCable = insetPolygon(state.panel, -(edge + rC));
    if(insetForCable && insetForCable.length>=3){
      const samples = samplePolylineByArc(state.cablePath, cableSpacing);
      for(const p of samples){
        const q = clampInside(p, insetForCable);
        if(q) cablePts.push(q);
      }
    }
  }

  state.drillPts = dedupeByMinGap(drillPts, drillDia*1.0); // simple dedupe
  state.cablePts = dedupeByMinGap(cablePts, cableDia*1.0);

  note(`Placed ${state.drillPts.length} drill holes` + (state.cablePts.length? `, ${state.cablePts.length} cable holes` : ''));
  preview();
  els.btnExport.disabled = false;
});

els.btnExport.addEventListener('click', ()=>{
  if(!state.panel){ note('Nothing to export'); return; }
  const dxf = exportDXF(state.panel, state.drillPts, state.cablePts, Number(els.drillDia.value||5), Number(els.cableDia.value||10));
  const blob = new Blob([dxf], {type:'application/dxf'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'holes-output.dxf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

function preview(){
  if(!state.panel){ els.svgMount.innerHTML=''; return; }
  const svg = renderSVG(state.panel, state.drillPts||[], state.cablePts||[]);
  els.svgMount.innerHTML = svg;
}

function note(s){ els.msg.textContent = s; }

function scalePoints(points, scale=1){
  if(scale===1) return points;
  return points.map(([x,y])=>[x*scale, y*scale]);
}

async function parseSVGRect(svgText){
  // Naive: if there's a single <rect>, treat it as panel
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const rect = doc.querySelector('rect');
  if(!rect) return null;
  const x = parseFloat(rect.getAttribute('x')||'0');
  const y = parseFloat(rect.getAttribute('y')||'0');
  const w = parseFloat(rect.getAttribute('width')||'0');
  const h = parseFloat(rect.getAttribute('height')||'0');
  if(w<=0 || h<=0) return null;
  return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
}

function samplePolylineByArc(points, spacing){
  // points: array of [x,y], closed or open.
  const segs=[];
  let total=0;
  for(let i=0;i<points.length-1;i++){
    const a=points[i], b=points[i+1];
    const L=Math.hypot(b[0]-a[0], b[1]-a[1]);
    segs.push({a,b,L}); total+=L;
  }
  const pts=[];
  let d=0;
  while(d<=total){
    let t=d;
    for(const s of segs){
      if(t<=s.L){
        const u=t/s.L;
        pts.push([ s.a[0]+u*(s.b[0]-s.a[0]), s.a[1]+u*(s.b[1]-s.a[1]) ]);
        break;
      } else t -= s.L;
    }
    d += spacing;
  }
  return pts;
}

function dedupeByMinGap(points, minGap){
  const out=[];
  for(const p of points){
    let ok=true;
    for(const q of out){
      const dx=p[0]-q[0], dy=p[1]-q[1];
      if(Math.hypot(dx,dy) < minGap){ ok=false; break; }
    }
    if(ok) out.push(p);
  }
  return out;
}

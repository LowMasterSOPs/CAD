// geometry/svg.js
import { bbox } from './utils.js';

export function renderSVG(panel, drillPts, cablePts){
  const b = bbox(panel);
  const pad = 20;
  const width = b.maxX - b.minX, height = b.maxY - b.minY;
  const vb = `${b.minX-pad} ${b.minY-pad} ${width+2*pad} ${height+2*pad}`;

  const poly = panel.map(p=>p.join(',')).join(' ');
  const drillCircles = drillPts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2" fill="#34d399" />`).join('');
  const cableCircles = cablePts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2" fill="#fbbf24" />`).join('');

  return `
  <svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${b.minX-pad}" y="${b.minY-pad}" width="${width+2*pad}" height="${height+2*pad}" fill="#071024"/>
    <polyline points="${poly}" fill="none" stroke="#60a5fa" stroke-width="1"/>
    ${drillCircles}
    ${cableCircles}
  </svg>
  `;
}

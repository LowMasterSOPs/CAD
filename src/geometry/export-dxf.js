// geometry/export-dxf.js
import Drawing from 'dxf-writer';

export function exportDXF(panel, drillPts, cablePts, drillDia, cableDia){
  const d = new Drawing();
  d.setUnits('Millimeters');
  d.addLayer('SOURCE', Drawing.ACI.BLUE, 'CONTINUOUS');
  d.addLayer('DRILL_HOLES', Drawing.ACI.GREEN, 'CONTINUOUS');
  d.addLayer('DRILL_CENTRES', Drawing.ACI.YELLOW, 'CONTINUOUS');
  d.addLayer('CABLE_HOLES', Drawing.ACI.CYAN, 'CONTINUOUS');
  d.addLayer('CABLE_CENTRES', Drawing.ACI.MAGENTA, 'CONTINUOUS');

  d.setActiveLayer('SOURCE');
  d.drawPolyline(panel.map(p=>({x:p[0], y:p[1]})), {closed:true});

  const rD = drillDia/2, rC = cableDia/2;

  d.setActiveLayer('DRILL_HOLES');
  for(const p of drillPts){
    d.drawCircle(p[0], p[1], rD);
  }
  d.setActiveLayer('DRILL_CENTRES');
  for(const p of drillPts){
    cross(d, p[0], p[1], rD*1.2);
  }

  d.setActiveLayer('CABLE_HOLES');
  for(const p of cablePts){
    d.drawCircle(p[0], p[1], rC);
  }
  d.setActiveLayer('CABLE_CENTRES');
  for(const p of cablePts){
    cross(d, p[0], p[1], rC*1.2);
  }

  return d.toDxfString();
}

function cross(d, x, y, s){
  d.drawLine(x-s, y, x+s, y);
  d.drawLine(x, y-s, x, y+s);
}

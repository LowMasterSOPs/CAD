// geometry/utils.js
export function bbox(points){
  let xs = points.map(p=>p[0]), ys = points.map(p=>p[1]);
  return {minX:Math.min(...xs), maxX:Math.max(...xs), minY:Math.min(...ys), maxY:Math.max(...ys)};
}
export function perimeter(points, closed=true){
  let L=0;
  for(let i=0;i<points.length-1;i++){
    L += dist(points[i], points[i+1]);
  }
  if(closed) L += dist(points[points.length-1], points[0]);
  return L;
}
export function dist(a,b){ let dx=a[0]-b[0], dy=a[1]-b[1]; return Math.hypot(dx,dy); }
export function area(points){ // signed polygon area
  let s=0; for(let i=0;i<points.length;i++){ const [x1,y1]=points[i], [x2,y2]=points[(i+1)%points.length]; s += x1*y2 - x2*y1; }
  return 0.5*s;
}
export function isClockwise(points){ return area(points) < 0; }
export function ensureCCW(points){ return isClockwise(points) ? [...points].reverse() : points; }
export function pointInPolygon(point, vs){
  // ray-casting
  const x=point[0], y=point[1];
  let inside=false;
  for(let i=0,j=vs.length-1;i<vs.length;j=i++){
    const xi=vs[i][0], yi=vs[i][1], xj=vs[j][0], yj=vs[j][1];
    const intersect = ((yi>y)!==(yj>y)) && (x < (xj - xi) * (y - yi) / ((yj - yi)||1e-9) + xi);
    if(intersect) inside = !inside;
  }
  return inside;
}
export function samplePerimeterEquidistant(points, count, cornerOffset=40){
  // returns 'count' points equally spaced along the closed polygon perimeter, offsetting the start by cornerOffset mm
  const segs=[]; let total=0;
  for(let i=0;i<points.length;i++){
    const a=points[i], b=points[(i+1)%points.length];
    const L=dist(a,b);
    segs.push({a,b,L}); total+=L;
  }
  const step = total / count;
  const samples=[];
  for(let k=0;k<count;k++){
    let d = (k*step + cornerOffset) % total;
    // walk segments
    for(const s of segs){
      if(d<=s.L){
        const t=d/s.L;
        samples.push([ s.a[0] + t*(s.b[0]-s.a[0]), s.a[1] + t*(s.b[1]-s.a[1]) ]);
        break;
      } else d -= s.L;
    }
  }
  return samples;
}
export function lineSampleAlongX(bbox, y, startX, endX, spacing){
  const pts=[]; for(let x=startX; x<=endX+1e-6; x+=spacing) pts.push([x,y]); return pts;
}
export function lineSampleAlongY(bbox, x, startY, endY, spacing){
  const pts=[]; for(let y=startY; y<=endY+1e-6; y+=spacing) pts.push([x,y]); return pts;
}
export function clampInside(point, insetPoly){
  // If outside, nudge toward polygon centroid
  const [x,y]=point;
  if(pointInPolygon(point, insetPoly)) return point;
  const c = centroid(insetPoly);
  const dir=[c[0]-x, c[1]-y];
  const steps=20;
  for(let i=1;i<=steps;i++){
    const q=[ x + dir[0]*i/steps, y + dir[1]*i/steps ];
    if(pointInPolygon(q, insetPoly)) return q;
  }
  return null; // couldn't clamp
}
export function centroid(points){
  let x=0,y=0; for(const p of points){ x+=p[0]; y+=p[1]; }
  return [x/points.length, y/points.length];
}

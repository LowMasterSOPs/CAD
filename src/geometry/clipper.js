// geometry/clipper.js
import ClipperLib from 'clipper-lib';
const SCALE = 1000; // scale mm to integer
export function insetPolygon(points, delta){ // negative delta shrinks
  const subj = [ points.map(([x,y])=>({X:Math.round(x*SCALE), Y:Math.round(y*SCALE)})) ];
  const co = new ClipperLib.ClipperOffset(2, 2);
  co.AddPaths(subj, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
  const solution=[];
  co.Execute(solution, Math.round(delta*SCALE));
  if(solution.length===0) return [];
  // return the largest result by area magnitude
  let best = solution[0];
  if(solution.length>1){
    let bestA = Math.abs(ClipperLib.Clipper.Area(best));
    for(const s of solution){
      const a = Math.abs(ClipperLib.Clipper.Area(s));
      if(a>bestA){ best=s; bestA=a; }
    }
  }
  return best.map(p=>[p.X/SCALE, p.Y/SCALE]);
}

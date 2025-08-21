# Bolt Hole Placer (DXF/SVG)
A minimal Bolt-ready app to import a **DXF** (or SVG) panel outline and automatically place **drill holes** (border or centre-line) and **cable holes** (along a cable path layer). Then export a new **DXF** and **SVG** with holes on their own layers.

> MVP supports DXF best. SVG works for simple rectangles. PDF (vector) is *not* included in this MVP.

## Quick Start (Bolt)
1. **Import this zip** into Bolt (or upload the folder).
2. In the terminal, run:
   ```bash
   npm i
   npm run dev
   ```
3. Open the preview URL. Upload a DXF. Tweak options. Click **Place Holes** → **Export DXF**.

## DXF Layer conventions
- Panel outline: any **closed LWPOLYLINE** (largest area will be treated as the panel).
- Optional cable path: a **polyline on layer `CABLE_PATH`** (LWPOLYLINE). If present and you enable "Cable holes", holes will be sampled along this path.
- Output layers:
  - `SOURCE` (original outline as a polyline)
  - `DRILL_HOLES` (circles for drill holes)
  - `DRILL_CENTRES` (cross markers at drill centres)
  - `CABLE_HOLES` (circles for cable holes)
  - `CABLE_CENTRES` (cross markers at cable centres)

## Controls
- Units: mm (assumed). If your DXF is inches, scale in your CAD or tweak `Units scale` in the UI.
- Edge clearance: min distance from hole edge to original panel edge.
- Target spacing: for border sampling. The app computes count ≈ perimeter / spacing.
- Centre-line: horizontal/vertical/both from the panel's bounding box.
- Cable holes: needs a `CABLE_PATH` polyline. Spaced by `Cable spacing` (mm).

## Notes
- Complex arcs/splines are approximated as straight segments.
- If multiple closed polylines exist, the **largest** by area is used as the panel.
- Clearance rules: hole-to-edge and hole-to-hole are enforced simply; if conflicts occur, some holes may be dropped.

## License
MIT (for this scaffold). Libraries retain their own licenses.

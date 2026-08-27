# Šenčur B2 — Parametric Kitchen (three.js)

Interactive 3D model of the kitchen for **Rezidence Šenčur, enota B2** (east duplex half,
"S2" in the PZI drawings), built from the real blueprint dimensions in the two PDFs in
this repo and from manufacturer appliance spec sheets.

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

**Live app (GitHub Pages, auto-deploys from main):**
https://yangwao.github.io/mu43-kitchen/

Shareable interactive version (same app, single file):
https://claude.ai/code/artifact/8d132cfb-53f4-4eea-a3ab-0a6199de2e8d

## What's in the model

- **Room shell** from the PZI plan: 648×411.5 cm kitchen band + lounge limb, 273 cm ceiling,
  floor-to-ceiling glazing (south 380+90 cm, east 290 cm, lounge 90 cm), pantry/WC core.
  B2 is the **east (S2) half, as drawn** — kitchen run on the west party wall, dining glass
  east. A mirror toggle in the View folder flips to an S1-type unit if ever needed.
- **Confirmed scheme (GA-Kuhinje style)**: the party wall (411.5 cm) is one tall
  composition **with an integrated counter niche** — fridge + oven tower (north), then a
  ~184 cm counter at 100 cm with **workstation sink + boiling tap + DW**, a contrast back
  panel and wall cabinets above, framed by a tall larder column (south) · the island
  (105 cm) carries the **venting hob toward the south windows** plus deep drawer banks,
  with an **open "breathing" section on slim legs at the north end**, away from the glass ·
  DW either in the wall counter or **raised in the south tall column** (dropdown) · only
  island floor penetration needed: hob duct/recirculation.
- **Island = peninsula (default)**: 300×87.5 cm, anchored to the south wall **flush with
  the 87.5 cm pier between the windows** (tall wall 65 + aisle 100 = 165 = pier start);
  hob at the window end, 85 cm open section at the north end, 40 cm table-depth seating
  overhang, 90 cm per stool. Freestanding variants remain as variations A and C.
- **Matched to real site photos** (July 2026, in repo): rustic knotty oak floor with E-W
  planks, white window frames, water/drain stub mid-party-wall (sink position confirmed),
  glass terrace door at the kitchen corner. 5 finish schemes incl. Cashmere & Walnut and
  Deep Forest & Oak; matte fronts carry subtle texture.
- **Context**: entrance door, TV wall, summer kitchen on the terrace, carport with car.
- **Performance**: render-on-demand loop — near-zero CPU when the camera is still.
- **3 layout variations** (dropdown): A architect-refined · B XL social island (default) ·
  C gastro table end (seats facing the terrace glass).
- **3 finish schemes**: Graphite & Oak · Total Black · Greige Soft.
  Swap tones in `src/params.js` → `FINISHES` once the real parquet sample is photographed.
- **Live clearance checks** (bottom-left): NKBA two-cook aisle (122), seat overhang,
  passages, walkway to dining, work triangle, DW niche math, fridge notes.
- **Camera presets** incl. "Cook at hob" at a 197 cm eye height; scale figures are
  197/186 cm.

## Key real-world constraints encoded

| Item | Value | Source |
|---|---|---|
| Samsung RS8000 | 912×716×1780, plumbed dispenser, 5 cm side gaps | Samsung UK spec |
| BORA X Pure | 830×515 cutout ~810, fits 60 cm cabinet | BORA manual |
| DW at 100 cm counter | niche 96 → std DW on ~9 cm platform | Bosch spec math |
| Island length cap | ~260 cm (411 cm band minus both passages) | PZI plan |
| Party wall budget | tall 221 + run 150 + 40 to glass = 411 | PZI plan |
| Ventilation riser VK4 | on party wall at the kitchen run | PZI plan |

## Open questions for the GA Kuhinje / seller meeting

1. Confirm B2 ↔ S2 (east half) mapping and that the kitchen is truly not included (turnkey spec omits it).
2. Water line for the fridge at the pantry wall (plumbed dispenser) — before screed/finishes.
3. Xeno/nobilia carcass options for 100/105 cm worktop heights (XL carcass + plinth).
4. Duct routing for the island downdraft: recirculation vs. ducting toward VK4.
5. O3 terrace door: sliding or hinged? (affects furniture near the south glass).
6. Island holds sink + DW + hob → water, drain and downdraft duct/recirc all in the
   island footprint — coordinate floor penetrations with the developer BEFORE screed.

## PZI-verified corrections (2nd measurement pass)

- South chain from party-wall face: **75 | O4 90 | pier 87.5 | O3 380** (first pass had
  the pier at ~45 — wrong; user caught it).
- Stairs are **enclosed in the core along the party wall** (quarter-turn, entered from the
  entry hall) — not in the lounge. Lounge NE corner has window **O1 90×235** in a notch.
- Shramba door on the core south wall: chain 69.5 | **door 80×220** | 78 | pier.
- TV is drawn on the core east wall (VK3 segment) → sofa placed opposite, east wall.
- Entrance V-010 110×220 at the vetrolov (plus side door V-02 90×220 from the carport
  side into the same vetrolov — not modeled).

`src/params.js` holds every dimension; `VARIATIONS` has a marked TODO slot where you can
add your own variation — it appears in the dropdown automatically.

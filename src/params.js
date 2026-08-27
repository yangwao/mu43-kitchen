// ============================================================================
// Rezidence Šenčur — enota B2 (east duplex half, "S2" in the PZI drawings)
// All dimensions in CENTIMETERS, taken from:
//  - DOMSEN PZI SMG NAČRTI (3).pdf  (ground floor plan, 1:50, Sept 2025)
//  - appliance manufacturer spec sheets (see research notes)
// Geometry is built in the S2 (east-unit) frame exactly as drawn: party wall
// (kitchen run) west at x=0, dining glazing east, terrace south. The mirror
// toggle in the UI flips to an S1-type (west) unit if ever needed.
// ============================================================================

export const CM = 0.01; // cm -> meters

// ---------------------------------------------------------------------------
// Room shell (interior faces, ground floor "dnevna soba + kuhinja", 44.5 m²)
// ---------------------------------------------------------------------------
export const ROOM = {
  ceiling: 273,           // clear height (+2.73 soffit)
  kitchenBand: { w: 648, d: 411.5 }, // south band, party wall -> exterior wall
  lounge: { w: 330, d: 470 },        // north limb along the exterior side wall
  coreWallLen: 228.5,     // usable north wall of kitchen band (shramba/pantry wall)
  wallThin: 12,           // interior partition thickness (drawn)
  wallExt: 45,            // exterior wall build-up
  glazingHeight: 235,     // all ground-floor glazing, head at +240
  glazingSill: 5,

  // Openings, logical S2 frame (party wall = x0, south wall = z0, x grows east)
  // South chain re-verified against the PZI (2nd pass): wall 75 | O4 90 |
  // pier 87.5 | O3 380 | corner. (First extraction had the pier at ~45 — wrong.)
  openings: {
    // south wall (terrace side)
    O4: { wall: 'S', from: 75, w: 90 },     // window at kitchen/island end
    O3: { wall: 'S', from: 252.5, w: 380 }, // main terrace glazing
    // side exterior wall (east in S2 / west in B2) at the dining zone
    O2: { wall: 'E', from: 40, w: 290 },    // full-height dining glass, 40 from SE corner
    // lounge north wall, in the recessed NE-corner notch — lights the sofa corner
    O1: { wall: 'N', from: 60, w: 90 },     // 60 from the NE corner (PZI-verified)
  },
};

// ---------------------------------------------------------------------------
// Appliances (manufacturer data)
// ---------------------------------------------------------------------------
export const APPLIANCES = {
  fridge: { // Samsung RS8000 family (RS68A884CSL): plumbed water/ice dispenser
    w: 91.2, caseD: 61, doorD: 10.6, h: 178,
    sideGap: 5, topGap: 10, // ventilation clearances
    label: 'Samsung RS8000 91×178, plumbed dispenser',
  },
  dishwasher: { // Bosch/Siemens fully integrated 60: niche 815–875 (std) / 865–925 (XXL)
    w: 60, nicheStd: [81.5, 87.5], nicheXXL: [86.5, 92.5],
    label: '60cm fully integrated DW',
  },
  sink: { // user decision 2026-08-27: Blanco Silgranit matte black single bowl
    w: 86, d: 44, label: 'Blanco 80/90 matte black single bowl, flexible rails, boiling-water tap',
  },
  ovenTower: { w: 60, label: 'Oven + combi-microwave tower' },
};

// Hob options — user decision 2026-08-27: going with Bosch, 70 or 90 cm
export const HOBS = {
  'Bosch 70 venting (PVQ731F15E)': {
    w: 71, d: 52.2, minCabinet: 60, venting: true,
    label: 'Bosch Serie 6 70cm venting hob — cutout 560×490, fits a 60cm cabinet, drawers stay usable',
  },
  'Bosch 90 induction (PXX975KW1E)': {
    w: 91.6, d: 52.2, minCabinet: 90, venting: false,
    label: 'Bosch 90cm induction — Bosch venting hobs top out at 80cm, so 90 needs separate extraction',
  },
  'BORA X Pure 83 venting': {
    w: 83, d: 51.5, minCabinet: 90, venting: true,
    label: 'BORA X Pure 83cm venting hob — cutout 810±2, fits 60cm-deep cabinet',
  },
};

// ---------------------------------------------------------------------------
// Ergonomics guardrails (NKBA + EU practice) — used by the live checks
// ---------------------------------------------------------------------------
export const RULES = {
  aisleOneCook: 107, aisleTwoCooks: 122, aisleMinPractical: 100,
  walkway: 91,
  seatWidth: 60,           // NKBA minimum; user prefers ~90 for shoulder room
  seatOverhangMin: 25, seatOverhangGood: 30,
  stoolSeatDrop: [25, 30],          // counter minus seat height
  fridgeSwingSideWall: 9.5,         // gap so doors open >90°
  sinkToDWMax: 90,
  hobSideLanding: [30, 38],
};

// ---------------------------------------------------------------------------
// Kitchen state (user-adjustable). Defaults = confirmed brief:
// run 100cm / island 105cm (users are 197 & 186cm tall), B2 = mirrored S1.
// ---------------------------------------------------------------------------
export const DEFAULTS = {
  mirrored: false,         // B2 = S2 (east half) = the logical frame as drawn; true mirrors to S1/west
  islandHeight: 105,
  counterHeight: 100,      // integrated counter niche in the tall wall (sink + DW)
  attachSouth: true,       // peninsula: island anchored to the south wall at the
                           // 87.5cm pier between the windows (65 tall + 100 aisle = 165 = pier start)
  aisle: 100,
  islandLen: 300,
  islandCabDepth: 87.5,    // = pier width between the two windows → flush anchor
  overhang: 40,            // table-like depth per diner (needs brackets/thick top)
  seatSpacing: 90,         // per-person width at the bar (shoulder room; NKBA min 60)
  openEnd: 85,             // open "breathing" section at the NORTH end (away from windows)
  dwLocation: 'counter',   // 'counter' (in the tall-wall niche) | 'tallWall' (raised column)
  hobChoice: 'Bosch 70 venting (PVQ731F15E)',
  pendantColor: '#ffd9a0', // Philips Hue pendants over the island — live color
  pendantIntensity: 1.0,   // 0 = off, 1 = full
  northGap: 75,            // passage island → pantry wall (shramba door there)
  plinth: 15,
  topThickness: 4,         // worktop (1.2 ceramic look also available per scheme)
  tallHeight: 221,         // tall unit height above floor
  tallDepth: 65,
  seatCount: 3,
  seatSide: 'east',        // 'east' (facing dining) | 'south' (end, facing terrace)
  showDims: false,
  showPeople: true,        // 197/186cm silhouettes for scale
  variation: 'B — Peninsula at pier',
  finish: 'Graphite & Oak',
};

// Layout variations — each patches the state
export const VARIATIONS = {
  // GA-Kuhinje-style party wall (411.5cm): fridge + oven tower, then an
  // INTEGRATED COUNTER NICHE (worktop with sink + DW, contrast back panel,
  // wall cabinets above) framed by a tall larder column at the south end.
  // Island = hob (toward the windows) + deep drawers, with an open
  // "breathing" section on slim legs at the NORTH end, away from the glass.
  'A — Freestanding island': {
    attachSouth: false, aisle: 105, islandLen: 270, islandCabDepth: 90, openEnd: 60,
    overhang: 30, seatCount: 2, seatSide: 'east', northGap: 75, dwLocation: 'counter',
    seatSpacing: 90,
  },
  'B — Peninsula at pier': {
    attachSouth: true, aisle: 100, islandLen: 300, islandCabDepth: 87.5, openEnd: 85,
    overhang: 40, seatCount: 3, seatSide: 'east', northGap: 75, dwLocation: 'counter',
    seatSpacing: 90,
  },
  'C — Gastro table end': {
    attachSouth: false, aisle: 120, islandLen: 270, islandCabDepth: 80, openEnd: 100,
    overhang: 38, seatCount: 2, seatSide: 'south', northGap: 60, dwLocation: 'tallWall',
    seatSpacing: 90,
  },
  // TODO(user): add your own variation here — copy one of the objects above,
  // rename it, and tweak. It will appear in the Variation dropdown automatically.
};

export const FINISHES = {
  // Tuned against the real B2 photos: rustic honey-oak floor, white frames.
  'Graphite & Oak': {
    front: 0x3a3d40, frontRough: 0.62,      // graphite premium-matte
    tall: 0x77572f, tallIsWood: true,        // honey oak decor — echoes the floor
    islandFront: 0x3a3d40, islandIsWood: false,
    top: 0x26272b, topRough: 0.35,           // dark ceramic
    backPanel: 0x2e3033,
  },
  'Total Black': {
    front: 0x1c1d1f, frontRough: 0.58,
    tall: 0x1c1d1f, tallIsWood: false,
    islandFront: 0x1c1d1f, islandIsWood: false,
    top: 0x141416, topRough: 0.22,           // black marble-look
    backPanel: 0x141416,
  },
  'Greige Soft': {
    front: 0x8d857b, frontRough: 0.65,
    tall: 0x6b5a4c, tallIsWood: true,
    islandFront: 0x8d857b, islandIsWood: false,
    top: 0xcfc9bf, topRough: 0.4,            // light quartz
    backPanel: 0xbdb6ab,
  },
  'Cashmere & Walnut': {
    front: 0xc9bfb0, frontRough: 0.66,       // warm cashmere matte
    tall: 0x4a3527, tallIsWood: true,        // dark walnut decor
    islandFront: 0xc9bfb0, islandIsWood: false,
    top: 0x3b352e, topRough: 0.38,           // warm dark stone
    backPanel: 0x5a4636,
  },
  'Deep Forest & Oak': {
    front: 0x2e3a34, frontRough: 0.6,        // deep green matte
    tall: 0x8a6a44, tallIsWood: true,        // light rustic oak like the floor
    islandFront: 0x2e3a34, islandIsWood: false,
    top: 0xd8d2c6, topRough: 0.32,           // light veined stone
    backPanel: 0x24302b,
  },
};

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Batcher, GEO, makeWorldMaterial } from '../core/Batcher.js';

/**
 * Procedural builder for the walkable Rome District:
 *  1. FORUM ROMANUM (center, x: -20..20, z: -32..20) + Temple of Jupiter + Rostra + Arch
 *  2. SENATE BUILDING / CURIA JULIA (east of Forum, x: 28, z: -18)
 *  3. PUBLIC BATHS / THERMAE (west of Forum, x: -50, z: -6) with outdoor natatio pool
 *  4. MARKET STREET / VIA MERCATORIA (south-west, x: -58..-16, z: 20..38) with stalls & insulae
 *  5. COLOSSEUM EXTERIOR / AMPHITHEATRUM FLAVIUM (east, x: 76, z: 6)
 *
 * Returns { group, smokeOrigins, torchPositions, landmarks }.
 */
export function buildRomeDistrict(colliders) {
  const P = CONFIG.palette;
  const mat = makeWorldMaterial();
  const b = new Batcher({ cellSize: 48, colliders });
  const smokeOrigins = [];
  const torchPositions = [];

  // ============================================================================
  // 0. GROUND, PAVED PIAZZAS & BASALT STREETS
  // ============================================================================
  b.add(GEO.box, P.grass, { x: 0, y: -0.5, z: 0, sx: 360, sy: 1.0, sz: 320 });

  // Forum travertine piazza
  b.add(GEO.box, P.paving, { x: 0, y: 0.02, z: -6, sx: 46, sy: 0.04, sz: 58 });
  b.add(GEO.box, P.marble, { x: 0, y: 0.04, z: -6, sx: 34, sy: 0.04, sz: 44 });

  // Via Sacra (South Gate → Forum → Colosseum)
  b.add(GEO.box, P.basalt, { x: 0, y: 0.03, z: 45, sx: 11, sy: 0.05, sz: 56 });
  b.add(GEO.box, P.basalt, { x: 34, y: 0.03, z: 16, sx: 58, sy: 0.05, sz: 11 });

  // Market Street paving
  b.add(GEO.box, P.basalt, { x: -38, y: 0.03, z: 28, sx: 54, sy: 0.05, sz: 12 });

  // Baths forecourt paving
  b.add(GEO.box, P.paving, { x: -38, y: 0.03, z: -6, sx: 42, sy: 0.05, sz: 36 });

  // Colosseum grand travertine plaza
  b.add(GEO.cyl12, P.paving, { x: 76, y: 0.03, z: 6, sx: 88, sy: 0.05, sz: 74 });

  // ============================================================================
  // 1. FORUM ROMANUM — Temple of Jupiter, Rostra, Colonnades & Triumphal Arch
  // ============================================================================
  // North Temple of Jupiter Optimus Maximus (x: 0, z: -42)
  b.push(0, 0, -42, 0);
  b.add(GEO.box, P.travertine, { x: 0, y: 1.4, z: 0, sx: 22, sy: 2.8, sz: 26 });
  b.collideBox(0, -1.5, 11, 11.5, 14);
  // Front steps
  for (let s = 0; s < 5; s++) {
    b.add(GEO.box, P.marble, { x: 0, y: 0.28 + s * 0.52, z: 13.5 + (4 - s) * 0.65, sx: 14, sy: 0.5, sz: 1.2 });
  }
  // Cella inner sanctuary
  b.add(GEO.box, P.stucco, { x: 0, y: 6.6, z: -2.5, sx: 15, sy: 7.6, sz: 15 });
  b.add(GEO.box, P.imperialRed, { x: 0, y: 5.5, z: 5.05, sx: 4.2, sy: 5.2, sz: 0.25 });
  // Hexastyle Corinthian portico columns
  for (let cx = -8.5; cx <= 8.5; cx += 3.4) {
    b.add(GEO.cyl12, P.marble, { x: cx, y: 6.6, z: 9.5, sx: 1.05, sy: 7.6, sz: 1.05 });
    b.add(GEO.box, P.gold, { x: cx, y: 10.5, z: 9.5, sx: 1.35, sy: 0.45, sz: 1.35 });
  }
  for (const cz of [6.0, 2.5]) {
    b.add(GEO.cyl12, P.marble, { x: -8.5, y: 6.6, z: cz, sx: 1.0, sy: 7.6, sz: 1.0 });
    b.add(GEO.cyl12, P.marble, { x: 8.5, y: 6.6, z: cz, sx: 1.0, sy: 7.6, sz: 1.0 });
  }
  // Entablature & triangular pediment + terracotta roof
  b.add(GEO.box, P.marble, { x: 0, y: 11.1, z: 0, sx: 20.5, sy: 1.1, sz: 24 });
  b.add(GEO.prism, P.roofTile, { x: 0, y: 11.65, z: 0, sx: 21.2, sy: 3.4, sz: 24.6 });
  b.add(GEO.prism, P.marble, { x: 0, y: 11.65, z: 12.1, sx: 20.2, sy: 3.1, sz: 0.6 });
  // Golden eagle acroterion
  b.add(GEO.sphere, P.gold, { x: 0, y: 15.4, z: 11.8, sx: 1.2, sy: 1.2, sz: 1.2 });
  b.pop();
  torchPositions.push([-6.5, 3.2, -27.5], [6.5, 3.2, -27.5]);

  // Speaker's Rostra & Victory Column in the middle of the Forum (x: 0, z: -12)
  b.push(0, 0, -12, 0);
  b.add(GEO.box, P.travertine, { x: 0, y: 0.9, z: 0, sx: 9.5, sy: 1.8, sz: 4.6 });
  b.add(GEO.box, P.marble, { x: 0, y: 1.9, z: 0, sx: 9.8, sy: 0.25, sz: 4.9 });
  // Bronze ship prows (rostra) mounted on the front
  for (const rx of [-3.2, 0, 3.2]) {
    b.add(GEO.cone6, P.bronze, { x: rx, y: 1.0, z: 2.6, rx: Math.PI / 2, sx: 0.55, sy: 1.1, sz: 0.55 });
  }
  b.collideBox(0, 0, 4.9, 2.5, 4);
  b.pop();

  // Triumphal Column of the Emperors (x: 0, z: 2)
  b.add(GEO.box, P.marble, { x: 0, y: 1.1, z: 2, sx: 3.4, sy: 2.2, sz: 3.4 });
  b.add(GEO.cyl12, P.marble, { x: 0, y: 7.5, z: 2, sx: 1.5, sy: 10.6, sz: 1.5 });
  b.add(GEO.sphere, P.gold, { x: 0, y: 13.4, z: 2, sx: 1.3, sy: 1.8, sz: 1.3 });
  b.collideBox(0, 2, 1.8, 1.8, 14);

  // West & East Forum Porticoes (Basilica Julia & Basilica Aemilia colonnades)
  for (const side of [-1, 1]) {
    const px = side * 21;
    b.add(GEO.box, P.travertine, { x: px, y: 0.35, z: -8, sx: 5.2, sy: 0.7, sz: 34 });
    for (let z = -23; z <= 7; z += 3.75) {
      b.add(GEO.cyl8, P.marble, { x: px - side * 1.8, y: 3.3, z, sx: 0.72, sy: 5.2, sz: 0.72 });
      b.collideCircle(px - side * 1.8, z, 0.55, 6);
    }
    b.add(GEO.box, P.travertine, { x: px, y: 6.3, z: -8, sx: 5.4, sy: 0.9, sz: 34.6 });
    b.add(GEO.prism, P.roofTile, { x: px, y: 6.75, z: -8, sx: 5.8, sy: 1.6, sz: 35 });
  }

  // Triumphal Arch of Via Sacra (south entrance to Forum, x: 0, z: 24)
  b.push(0, 0, 24, 0);
  b.add(GEO.box, P.marble, { x: -4.6, y: 3.8, z: 0, sx: 3.2, sy: 7.6, sz: 3.6 });
  b.add(GEO.box, P.marble, { x: 4.6, y: 3.8, z: 0, sx: 3.2, sy: 7.6, sz: 3.6 });
  b.add(GEO.box, P.marble, { x: 0, y: 8.6, z: 0, sx: 12.8, sy: 2.6, sz: 3.9 });
  b.add(GEO.box, P.gold, { x: 0, y: 10.3, z: 0, sx: 4.2, sy: 1.1, sz: 2.2 });
  b.collideBox(-4.6, 0, 1.7, 1.9, 10);
  b.collideBox(4.6, 0, 1.7, 1.9, 10);
  b.pop();
  torchPositions.push([-3.2, 2.6, 26], [3.2, 2.6, 26]);

  // ============================================================================
  // 2. SENATE BUILDING — CURIA JULIA (x: 32, z: -18, facing west onto Forum)
  // ============================================================================
  b.push(32, 0, -18, -Math.PI / 2);
  b.add(GEO.box, P.travertine, { x: 0, y: 1.0, z: 0, sx: 16, sy: 2.0, sz: 21 });
  // Tall brick-faced Curia hall with corner buttresses
  b.add(GEO.box, P.brick, { x: 0, y: 7.5, z: -1.2, sx: 14.5, sy: 11.0, sz: 17.5 });
  for (const sx of [-7.2, 7.2]) {
    for (const sz of [-9.8, 7.4]) {
      b.add(GEO.box, P.travertine, { x: sx, y: 7.8, z: sz, sx: 1.4, sy: 11.6, sz: 1.4 });
    }
  }
  // Monumental bronze doors & marble frame
  b.add(GEO.box, P.marble, { x: 0, y: 5.6, z: 7.65, sx: 4.6, sy: 7.2, sz: 0.4 });
  b.add(GEO.box, P.bronze, { x: 0, y: 5.4, z: 7.8, sx: 3.6, sy: 6.4, sz: 0.3 });
  // Three high clerestory windows
  for (const wx of [-4.2, 0, 4.2]) {
    b.add(GEO.box, P.dark, { x: wx, y: 10.4, z: 7.65, sx: 2.1, sy: 2.2, sz: 0.3 });
  }
  // Steps down to Forum
  for (let s = 0; s < 4; s++) {
    b.add(GEO.box, P.marble, { x: 0, y: 0.25 + s * 0.45, z: 10.8 + (3 - s) * 0.6, sx: 12, sy: 0.45, sz: 1.0 });
  }
  b.add(GEO.prism, P.roofTile, { x: 0, y: 13.0, z: -1.2, sx: 15.6, sy: 3.2, sz: 18.6 });
  b.add(GEO.prism, P.travertine, { x: 0, y: 13.0, z: 7.9, sx: 15.0, sy: 2.9, sz: 0.5 });
  b.collideBox(0, -1.0, 8.2, 10.2, 16);
  b.pop();
  torchPositions.push([21.5, 2.6, -14], [21.5, 2.6, -22]);

  // ============================================================================
  // 3. PUBLIC BATHS — THERMAE ANTONINIANAE (x: -50, z: -6)
  // ============================================================================
  b.push(-50, 0, -6, 0);
  // Perimeter platform
  b.add(GEO.box, P.travertine, { x: 0, y: 0.4, z: 0, sx: 34, sy: 0.8, sz: 36 });
  // Main vaulted frigidarium / caldarium block (west half)
  b.add(GEO.box, P.stucco, { x: -7, y: 5.4, z: 0, sx: 16, sy: 9.2, sz: 30 });
  b.add(GEO.vault, P.roofTile, { x: -7, y: 10.0, z: 0, sx: 14, sy: 4.5, sz: 28 });
  // Central rotunda dome + bronze oculus ring
  b.add(GEO.cyl12, P.brick, { x: -6, y: 8.2, z: 0, sx: 13.5, sy: 6.5, sz: 13.5 });
  b.add(GEO.dome, P.travertine, { x: -6, y: 11.4, z: 0, sx: 13.2, sy: 6.8, sz: 13.2 });
  b.add(GEO.cyl12, P.bronze, { x: -6, y: 14.8, z: 0, sx: 3.2, sy: 0.4, sz: 3.2 });
  b.collideBox(-7, 0, 8.5, 15.2, 15);

  // Outdoor Natatio (swimming pool) in the east courtyard
  b.add(GEO.box, P.marble, { x: 7.5, y: 0.85, z: 0, sx: 11.5, sy: 0.4, sz: 22 });
  b.add(GEO.box, P.water, { x: 7.5, y: 0.92, z: 0, sx: 9.8, sy: 0.35, sz: 20.2 });
  // Poolside colonnade
  for (let z = -12; z <= 12; z += 4) {
    b.add(GEO.cyl8, P.marble, { x: 14.5, y: 3.2, z, sx: 0.65, sy: 4.8, sz: 0.65 });
    b.collideCircle(14.5, z, 0.5, 5);
  }
  b.add(GEO.box, P.travertine, { x: 14.5, y: 5.8, z: 0, sx: 2.2, sy: 0.7, sz: 26 });
  // Hypocaust chimneys emitting warm steam/smoke
  b.add(GEO.box, P.brick, { x: -13, y: 11.2, z: -10, sx: 1.6, sy: 3.5, sz: 1.6 });
  b.add(GEO.box, P.brick, { x: -13, y: 11.2, z: 10, sx: 1.6, sy: 3.5, sz: 1.6 });
  b.pop();
  smokeOrigins.push(
    new THREE.Vector3(-63, 13.0, -16),
    new THREE.Vector3(-63, 13.0, 4),
    new THREE.Vector3(-42.5, 1.2, -4),
    new THREE.Vector3(-42.5, 1.2, 2),
  );
  torchPositions.push([-34, 2.5, -12], [-34, 2.5, 0]);

  // ============================================================================
  // 4. MARKET STREET — VIA MERCATORIA (x: -60..-16, z: 20..38)
  // ============================================================================
  const awningColors = [P.imperialRed, P.ochre, P.terracotta, 0x3b6e7c, P.gold];
  let stallIdx = 0;
  for (let x = -56; x <= -18; x += 7.5) {
    for (const side of [-1, 1]) {
      const sz = 28 + side * 6.2;
      const col = awningColors[stallIdx++ % awningColors.length];
      b.push(x, 0, sz, side > 0 ? Math.PI : 0);
      // Wooden counter & crates/amphorae
      b.add(GEO.box, P.wood, { x: 0, y: 0.55, z: 0, sx: 4.2, sy: 1.1, sz: 1.6 });
      b.add(GEO.cyl8, P.terracotta, { x: -1.2, y: 1.35, z: 0, sx: 0.45, sy: 0.65, sz: 0.45 });
      b.add(GEO.cyl8, P.terracotta, { x: -0.5, y: 1.3, z: 0.1, sx: 0.4, sy: 0.55, sz: 0.4 });
      b.add(GEO.box, P.ochre, { x: 0.9, y: 1.25, z: 0, sx: 1.1, sy: 0.35, sz: 0.9 });
      // Corner poles + sloped fabric awning
      for (const px of [-1.95, 1.95]) {
        for (const pz of [-0.9, 0.9]) {
          b.add(GEO.cyl8, P.wood, { x: px, y: 1.65, z: pz, sx: 0.14, sy: 3.3, sz: 0.14 });
        }
      }
      b.add(GEO.box, col, { x: 0, y: 3.35, z: 0.15, rx: 0.18, sx: 4.6, sy: 0.18, sz: 2.8 });
      b.collideBox(0, 0, 2.3, 1.1, 3.5);
      b.pop();
    }
  }

  // Multi-story Roman Insulae (apartment blocks) backing the Market Street
  const insulae = [
    [-54, 42, 13, 13, 9],
    [-38, 42, 14, 14, 9],
    [-22, 42, 13, 12, 9],
    [-56, 15, 12, 11, 8],
    [-22, 15, 11, 11, 8],
  ];
  for (const [ix, iz, w, h, d] of insulae) {
    b.add(GEO.box, P.brick, { x: ix, y: 1.6, z: iz, sx: w, sy: 3.2, sz: d }, 0.04);
    b.add(GEO.box, P.stucco, { x: ix, y: 3.2 + (h - 3.2) * 0.5, z: iz, sx: w - 0.3, sy: h - 3.2, sz: d - 0.3 }, 0.06);
    b.add(GEO.box, P.wood, { x: ix, y: 3.4, z: iz + (iz > 28 ? -d * 0.52 : d * 0.52), sx: w - 1, sy: 0.35, sz: 1.2 });
    b.add(GEO.prism, P.roofTile, { x: ix, y: h, z: iz, sx: w + 0.6, sy: 2.2, sz: d + 0.6 }, 0.05);
    b.collideBox(ix, iz, w * 0.5 + 0.2, d * 0.5 + 0.2, h + 2);
    smokeOrigins.push(new THREE.Vector3(ix + 1.5, h + 1.8, iz));
  }
  torchPositions.push([-46, 2.5, 23], [-28, 2.5, 23]);

  // ============================================================================
  // 5. COLOSSEUM EXTERIOR — AMPHITHEATRUM FLAVIUM (x: 76, z: 6)
  // ============================================================================
  const colX = 76, colZ = 6;
  const rxOut = 32, rzOut = 26;
  const rxIn = 23, rzIn = 18;
  const bays = 36;

  for (let i = 0; i < bays; i++) {
    const a0 = (i / bays) * Math.PI * 2;
    const aMid = ((i + 0.5) / bays) * Math.PI * 2;
    const px = colX + Math.cos(a0) * rxOut;
    const pz = colZ + Math.sin(a0) * rzOut;
    const mx = colX + Math.cos(aMid) * rxOut;
    const mz = colZ + Math.sin(aMid) * rzOut;
    // Tangent orientation around the ellipse
    const rotY = -Math.atan2(Math.sin(a0) * rxOut, Math.cos(a0) * rzOut);
    const rotMid = -Math.atan2(Math.sin(aMid) * rxOut, Math.cos(aMid) * rzOut);

    // Classic stepped ruin/complete silhouette: 4 tiers (21 m) on the north/east, 3 tiers (15.5 m) on south-west
    const fullAttic = i < 24 || i > 32;
    const hTotal = fullAttic ? 21.0 : 15.5;

    // Travertine radial pier between arches
    b.add(
      GEO.box,
      P.travertine,
      { x: px, y: hTotal * 0.5, z: pz, ry: rotY, sx: 2.6, sy: hTotal, sz: 1.9 },
      0.03,
    );
    // Engaged half-column on outer face
    b.add(
      GEO.cyl8,
      P.marble,
      { x: colX + Math.cos(a0) * (rxOut + 1.15), y: hTotal * 0.5, z: colZ + Math.sin(a0) * (rzOut + 1.15), sx: 0.75, sy: hTotal, sz: 0.75 },
    );

    // Horizontal cornices / spandrel lintels across each tier (leaving open archways below!)
    for (const ty of [4.8, 9.8, 14.8]) {
      b.add(
        GEO.box,
        P.travertine,
        { x: mx, y: ty, z: mz, ry: rotMid, sx: 2.5, sy: 1.35, sz: 4.8 },
      );
    }
    if (fullAttic) {
      // Solid 4th-story attic wall + bronze shield medallions + velarium masts
      b.add(
        GEO.box,
        P.travertine,
        { x: mx, y: 18.2, z: mz, ry: rotMid, sx: 2.3, sy: 5.2, sz: 4.8 },
        0.03,
      );
      if (i % 2 === 0) {
        b.add(
          GEO.cyl8,
          P.gold,
          { x: colX + Math.cos(aMid) * (rxOut + 1.25), y: 18.2, z: colZ + Math.sin(aMid) * (rzOut + 1.25), rx: Math.PI / 2, rz: rotMid, sx: 1.2, sy: 0.25, sz: 1.2 },
        );
      }
      b.add(
        GEO.cyl8,
        P.wood,
        { x: colX + Math.cos(a0) * (rxOut + 0.9), y: 22.2, z: colZ + Math.sin(a0) * (rzOut + 0.9), sx: 0.22, sy: 3.2, sz: 0.22 },
      );
    }

    // Inner arena wall + sloped marble cavea seating
    const ix = colX + Math.cos(aMid) * rxIn;
    const iz = colZ + Math.sin(aMid) * rzIn;
    b.add(GEO.box, P.brick, { x: ix, y: 5.5, z: iz, ry: rotMid, sx: 3.5, sy: 11.0, sz: 4.2 });
    b.add(GEO.box, P.marble, { x: (mx + ix) * 0.5, y: 11.5, z: (mz + iz) * 0.5, ry: rotMid, rz: 0.45, sx: 7.5, sy: 1.2, sz: 4.4 });
  }
  // Sand arena floor visible through the arches
  b.add(GEO.cyl12, P.ochre, { x: colX, y: 0.08, z: colZ, sx: rxIn * 1.9, sy: 0.12, sz: rzIn * 1.9 });
  colliders.addEllipse(colX, colZ, rxOut + 1.4, rzOut + 1.4, 22);
  torchPositions.push([41, 2.6, 11], [41, 2.6, 21]);

  // ============================================================================
  // 6. TREES (Cypresses & Umbrella Pines), STATUES & PERIMETER AQUEDUCT
  // ============================================================================
  const pines = [
    [-26, -34, 11], [24, -36, 12], [46, -24, 11], [52, 36, 12],
    [-12, 48, 10], [16, 44, 11], [-68, -28, 12], [-70, 22, 11],
  ];
  for (const [tx, tz, h] of pines) {
    b.add(GEO.cyl8, P.wood, { x: tx, y: h * 0.45, z: tz, sx: 0.75, sy: h * 0.9, sz: 0.75 });
    b.add(GEO.Cyl8 || GEO.cyl12, P.pine, { x: tx, y: h, z: tz, sx: 7.5, sy: 2.4, sz: 7.5 }, 0.06);
    b.add(GEO.dome, P.pine, { x: tx, y: h + 0.8, z: tz, sx: 6.2, sy: 2.2, sz: 6.2 }, 0.06);
    b.collideCircle(tx, tz, 0.65, h);
  }

  const cypresses = [
    [-14, 28, 8], [14, 28, 8.5], [26, 2, 8], [-28, -22, 8.5],
    [36, 26, 7.5], [42, -8, 8.5], [-6, 60, 8], [6, 60, 8],
  ];
  for (const [cx, cz, h] of cypresses) {
    b.add(GEO.cyl8, P.wood, { x: cx, y: 1.2, z: cz, sx: 0.45, sy: 2.4, sz: 0.45 });
    b.add(GEO.cone8, P.cypress, { x: cx, y: 1.8 + h * 0.5, z: cz, sx: 1.9, sy: h, sz: 1.9 }, 0.05);
    b.collideCircle(cx, cz, 0.55, h);
  }

  // Bronze equestrian / heroic statues on marble pedestals along the Via Sacra
  for (const [sx, sz] of [[-8, -2], [8, -2], [-8, 12], [8, 12], [28, 10]]) {
    b.add(GEO.box, P.marble, { x: sx, y: 0.9, z: sz, sx: 1.5, sy: 1.8, sz: 1.5 });
    b.add(GEO.cyl8, P.gold, { x: sx, y: 2.55, z: sz, sx: 0.55, sy: 1.5, sz: 0.55 });
    b.add(GEO.sphere, P.gold, { x: sx, y: 3.45, z: sz, sx: 0.4, sy: 0.4, sz: 0.4 });
    b.collideBox(sx, sz, 0.9, 0.9, 4);
  }

  // Bronze street braziers at torchPositions
  for (const [bx, , bz] of torchPositions) {
    b.add(GEO.cyl8, P.bronze, { x: bx, y: 1.1, z: bz, sx: 0.65, sy: 2.2, sz: 0.65 });
    b.add(GEO.cyl12, P.imperialRed, { x: bx, y: 2.25, z: bz, sx: 0.8, sy: 0.2, sz: 0.8 });
    b.collideCircle(bx, bz, 0.45, 2.5);
  }

  // Grand Aqueduct closing the northern horizon (z = -84)
  for (let ax = -120; ax <= 130; ax += 8) {
    b.add(GEO.box, P.travertine, { x: ax, y: 7.5, z: -84, sx: 2.6, sy: 15, sz: 3.2 });
  }
  b.add(GEO.box, P.travertine, { x: 5, y: 15.8, z: -84, sx: 260, sy: 2.4, sz: 3.6 });

  const group = b.build(mat, { name: 'romeDistrict' });

  const landmarks = [
    { name: 'Forum Romanum', x: 0, z: -8, r: 22 },
    { name: 'Temple of Jupiter Optimus Maximus', x: 0, z: -36, r: 16 },
    { name: 'Curia Julia · Roman Senate', x: 26, z: -18, r: 16 },
    { name: 'Thermae · Public Baths', x: -44, z: -6, r: 22 },
    { name: 'Via Mercatoria · Market Street', x: -38, z: 28, r: 22 },
    { name: 'Amphitheatrum Flavium · Colosseum', x: 64, z: 6, r: 38 },
    { name: 'Via Sacra · Triumphal Approach', x: 0, z: 38, r: 18 },
  ];

  return { group, smokeOrigins, torchPositions, landmarks };
}

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { Batcher, GEO, makeWorldMaterial } from '../core/Batcher.js';
import { SkyRig } from '../entities/SkyRig.js';
import { SmokeSystem } from '../entities/Smoke.js';
import { Birds } from '../entities/Birds.js';
import { buildLobbyMenu } from '../ui/Menu.js';

/**
 * SCENE 1 — LOBBY
 * A 3D Roman villa terrace at dawn overlooking the Eternal City.
 * Foreground: travertine balustrade, Ionic columns, pergola, cypresses, mosaic floor,
 *             wine table & smoking bronze brazier.
 * Distance:   silhouettes of the Colosseum, Forum temples, Capitoline & aqueducts,
 *             rising chimney smoke, circling birds, slow camera drift.
 */
export class LobbyScene {
  constructor(ctx) {
    this.ctx = ctx;
    this.is3D = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 600);
    this.baseCamPos = new THREE.Vector3(-2.6, 3.25, 7.2);
    this.baseLookAt = new THREE.Vector3(4.5, 2.2, -55);
    this.time = 0;

    this.sky = new SkyRig(this.scene, {
      fogDensity: CONFIG.lobby.fogDensity,
      shadowRadius: 28,
    });
    this.sky.setHour(CONFIG.lobby.hour);

    this._buildWorld();
  }

  _buildWorld() {
    const P = CONFIG.palette;
    const mat = makeWorldMaterial();
    const b = new Batcher();

    // --- Villa terrace floor & mosaic border ---
    b.add(GEO.box, P.travertine, { x: 0, y: -0.3, z: 4, sx: 18, sy: 0.6, sz: 12 });
    b.add(GEO.box, P.marble, { x: 0, y: 0.02, z: 4, sx: 14, sy: 0.04, sz: 8.5 });
    b.add(GEO.box, P.imperialRed, { x: 0, y: 0.04, z: 4, sx: 12.6, sy: 0.03, sz: 7.2 });
    b.add(GEO.box, P.marble, { x: 0, y: 0.06, z: 4, sx: 11.8, sy: 0.03, sz: 6.4 });

    // --- Balustrade along the cliff edge (z = -1.6) ---
    b.add(GEO.box, P.travertine, { x: 0, y: 0.18, z: -1.6, sx: 17.6, sy: 0.35, sz: 0.55 });
    b.add(GEO.box, P.marble, { x: 0, y: 1.05, z: -1.6, sx: 17.6, sy: 0.16, sz: 0.48 });
    for (let x = -8; x <= 8; x += 0.8) {
      const isPillar = Math.abs(x % 3.2) < 0.01;
      b.add(
        isPillar ? GEO.box : GEO.cyl8,
        P.travertine,
        { x, y: 0.62, z: -1.6, sx: isPillar ? 0.36 : 0.16, sy: 0.72, sz: isPillar ? 0.36 : 0.16 },
      );
    }

    // --- Colonaded loggia (columns + architrave + timber pergola beams) ---
    const colXs = [-7.2, -3.6, 0, 3.6, 7.2];
    for (const x of colXs) {
      b.add(GEO.box, P.travertine, { x, y: 0.25, z: 0.6, sx: 0.75, sy: 0.5, sz: 0.75 });
      b.add(GEO.cyl12, P.marble, { x, y: 2.55, z: 0.6, sx: 0.52, sy: 4.1, sz: 0.52 });
      b.add(GEO.box, P.travertine, { x, y: 4.7, z: 0.6, sx: 0.78, sy: 0.28, sz: 0.78 });
    }
    b.add(GEO.box, P.travertine, { x: 0, y: 5.05, z: 0.6, sx: 16.2, sy: 0.42, sz: 0.72 });
    for (let z = 1.0; z <= 6.5; z += 1.1) {
      b.add(GEO.box, P.wood, { x: 0, y: 5.32, z, sx: 15.8, sy: 0.14, sz: 0.18 });
    }

    // --- Terracotta oil brazier + low marble table on the right ---
    b.add(GEO.cyl8, P.bronze, { x: 2.2, y: 0.55, z: 2.1, sx: 0.75, sy: 1.1, sz: 0.75 });
    b.add(GEO.cyl12, P.imperialRed, { x: 2.2, y: 1.15, z: 2.1, sx: 0.6, sy: 0.12, sz: 0.6 });
    b.add(GEO.box, P.marble, { x: -0.6, y: 0.42, z: 3.1, sx: 1.5, sy: 0.84, sz: 0.9 });
    b.add(GEO.cyl8, P.terracotta, { x: -0.4, y: 1.05, z: 3.0, sx: 0.26, sy: 0.45, sz: 0.26 });

    // --- Hillside & cypress trees below the terrace ---
    b.add(GEO.box, P.grass, { x: 0, y: -14, z: -90, sx: 460, sy: 6, sz: 260 });
    const cypressPos = [
      [-10.5, -2, -4, 7.5],
      [-8.2, -3, -7, 6.5],
      [9.5, -2, -3.5, 8.0],
      [12.0, -3.5, -8, 7.0],
      [-18, -8, -22, 9.0],
      [16, -9, -25, 8.5],
      [-6, -10, -28, 7.5],
    ];
    for (const [cx, cy, cz, h] of cypressPos) {
      b.add(GEO.cyl8, P.wood, { x: cx, y: cy + 1.2, z: cz, sx: 0.4, sy: 2.4, sz: 0.4 });
      b.add(GEO.cone8, P.cypress, { x: cx, y: cy + 1.8 + h * 0.5, z: cz, sx: 1.7, sy: h, sz: 1.7 }, 0.06);
    }

    // --- Distant city roofs & insulae clusters ---
    const rng = (seed) => {
      let s = seed;
      return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    };
    const rand = rng(42);
    for (let i = 0; i < 95; i++) {
      const x = (rand() - 0.46) * 210;
      const z = -38 - rand() * 125;
      const w = 3.5 + rand() * 5.5;
      const d = 3.5 + rand() * 5.5;
      const h = 3.5 + rand() * 5.5;
      const baseY = -11;
      b.add(GEO.box, P.stucco, { x, y: baseY + h * 0.5, z, sx: w, sy: h, sz: d }, 0.08);
      b.add(GEO.prism, P.roofTile, { x, y: baseY + h, z, sx: w + 0.4, sy: 1.3, sz: d + 0.4 }, 0.06);
    }

    // --- Distant Forum Romanum silhouette (center-left, z ≈ -82) ---
    const fx = -16, fz = -82, fy = -10.5;
    b.add(GEO.box, P.travertine, { x: fx, y: fy + 2, z: fz, sx: 26, sy: 4, sz: 16 });
    // Temple of Jupiter / Saturn pediment
    b.add(GEO.box, P.marble, { x: fx, y: fy + 7.5, z: fz, sx: 14, sy: 7, sz: 10 });
    for (let cx = fx - 6; cx <= fx + 6; cx += 2) {
      b.add(GEO.cyl8, P.marble, { x: cx, y: fy + 7.5, z: fz + 5.6, sx: 0.7, sy: 7, sz: 0.7 });
    }
    b.add(GEO.prism, P.roofTile, { x: fx, y: fy + 11, z: fz, sx: 15.2, sy: 3.2, sz: 11.6 });
    // Triumphal arch & Senate Curia beside it
    b.add(GEO.box, P.marble, { x: fx + 16, y: fy + 5.5, z: fz + 4, sx: 8, sy: 7, sz: 3 });
    b.add(GEO.box, P.brick, { x: fx - 17, y: fy + 6.5, z: fz + 2, sx: 10, sy: 9, sz: 11 });
    b.add(GEO.prism, P.roofTile, { x: fx - 17, y: fy + 11, z: fz + 2, sx: 10.8, sy: 2.8, sz: 11.6 });

    // --- Distant Colosseum silhouette (center-right, z ≈ -105) ---
    const colX = 32, colZ = -105, colY = -10.5;
    const segs = 24;
    const rx = 22, rz = 17;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const sx = colX + Math.cos(a) * rx;
      const sz = colZ + Math.sin(a) * rz;
      const tierH = i > 3 && i < 14 ? 16.5 : 12.5; // iconic stepped outer wall
      b.add(
        GEO.box,
        P.travertine,
        { x: sx, y: colY + tierH * 0.5, z: sz, ry: -a, sx: 2.8, sy: tierH, sz: 5.0 },
        0.04,
      );
    }

    // --- Distant Aqueduct across the valley ---
    for (let ax = -120; ax <= 110; ax += 6.5) {
      b.add(GEO.box, P.travertine, { x: ax, y: -4.5, z: -140, sx: 2.2, sy: 13, sz: 2.4 });
    }
    b.add(GEO.box, P.travertine, { x: -5, y: 2.4, z: -140, sx: 240, sy: 1.8, sz: 2.8 });

    this.scene.add(b.build(mat, { name: 'lobbyWorld' }));

    // --- Chimney smoke emitters across the city + terrace brazier ---
    const smokeOrigins = [
      new THREE.Vector3(2.2, 1.25, 2.1),
      new THREE.Vector3(-22, -3.5, -52),
      new THREE.Vector3(-8, -3.0, -64),
      new THREE.Vector3(12, -3.5, -58),
      new THREE.Vector3(25, -3.0, -72),
      new THREE.Vector3(-34, -3.0, -78),
      new THREE.Vector3(5, -3.0, -88),
    ];
    this.smoke = new SmokeSystem(smokeOrigins, 7);
    this.scene.add(this.smoke.mesh);

    // --- Flock of birds ---
    this.birds = new Birds(CONFIG.lobby.birdCount, new THREE.Vector3(8, 12, -55), 38);
    this.scene.add(this.birds.group);
  }

  enter({ first = false } = {}) {
    this.ctx.input.pointerLockEnabled = false;
    this.ctx.input.releasePointer();
    this.ctx.audio.setSceneMode('lobby');
    if (first) this.ctx.audio.playBuccina();
    buildLobbyMenu(this.ctx);
    this.update(0);
  }

  exit() {}

  applyQuality(q) {
    this.sky.sun.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
    this.sky.sun.shadow.map?.dispose();
    this.sky.sun.shadow.map = null;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    this.time += dt;
    const s = CONFIG.lobby.cameraDriftSpeed;
    const a = CONFIG.lobby.cameraDriftAmount;
    this.camera.position.set(
      this.baseCamPos.x + Math.sin(this.time * s) * a,
      this.baseCamPos.y + Math.sin(this.time * s * 0.7) * 0.16,
      this.baseCamPos.z + Math.cos(this.time * s * 0.8) * (a * 0.45),
    );
    this.camera.lookAt(
      this.baseLookAt.x + Math.cos(this.time * s * 0.6) * 1.8,
      this.baseLookAt.y,
      this.baseLookAt.z,
    );
    this.smoke.update(dt);
    this.birds.update(dt);
  }
}

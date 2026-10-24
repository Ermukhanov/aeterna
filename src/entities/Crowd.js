import * as THREE from 'three';
import { GEO } from '../core/Batcher.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Instanced crowd of 30–50 Roman citizens (senators, plebeians, merchants, guards)
 * walking along street & Forum waypoint loops. Uses just 2 InstancedMeshes
 * (tunic body + skin head) so 50 NPCs cost only 2 draw calls.
 */
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();

const TUNIC_PALETTE = [
  0xede2cc, // senator cream toga
  0x9a231c, // crimson tunic
  0xc98a4b, // ochre merchant
  0x4c6878, // Aegean blue
  0x6b7c4e, // olive green
  0xb85a3a, // terracotta
  0xd8c39e, // linen
];

// Waypoint loops through the Forum, Via Sacra, Market Street, Baths & Colosseum plaza
const LOOPS = [
  // Loop A: Forum square promenade
  [
    [-16, -24], [16, -24], [16, 16], [-16, 16],
  ],
  // Loop B: Via Sacra from South Gate to Forum and out to Colosseum
  [
    [-4, 52], [-4, 18], [18, 8], [38, 12], [38, 28], [4, 28], [4, 52],
  ],
  // Loop C: Market Street (south-west bazaar)
  [
    [-14, 24], [-56, 24], [-56, 32], [-14, 32],
  ],
  // Loop D: Public Baths forecourt & north portico
  [
    [-18, -14], [-36, -14], [-36, 10], [-18, 10],
  ],
  // Loop E: Grand circuit around the Forum & Colosseum exterior
  [
    [-22, 22], [22, 22], [44, 18], [44, -14], [18, -28], [-22, -28],
  ],
];

export class Crowd {
  constructor(maxCount = 50) {
    this.maxCount = maxCount;
    this.activeCount = maxCount;
    this.group = new THREE.Group();
    this.group.name = 'RomanCrowd';

    // Merged body = tapered tunic cylinder + shoulder cloak block
    const robe = GEO.cyl8.clone();
    robe.scale(0.55, 1.32, 0.42);
    robe.translate(0, 0.66, 0);
    const shoulders = GEO.box.clone();
    shoulders.scale(0.62, 0.32, 0.38);
    shoulders.translate(0, 1.18, 0);
    const bodyGeo = mergeGeometries([robe.toNonIndexed(), shoulders.toNonIndexed()], false);
    bodyGeo.computeVertexNormals();

    const headGeo = GEO.ico1.clone();
    headGeo.scale(0.32, 0.36, 0.32);
    headGeo.translate(0, 1.54, 0);

    const bodyMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xd8a882, flatShading: true, roughness: 0.8 });

    this.bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, maxCount);
    this.headMesh = new THREE.InstancedMesh(headGeo, headMat, maxCount);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.headMesh.castShadow = true;
    this.group.add(this.bodyMesh, this.headMesh);

    this.agents = [];
    for (let i = 0; i < maxCount; i++) {
      const loop = LOOPS[i % LOOPS.length];
      const wpIdx = i % loop.length;
      const nextIdx = (wpIdx + 1) % loop.length;
      const t = Math.random();
      const [x0, z0] = loop[wpIdx];
      const [x1, z1] = loop[nextIdx];
      const laneOffset = (Math.random() - 0.5) * 2.8;

      this.agents.push({
        loop,
        wpIdx: nextIdx,
        x: x0 + (x1 - x0) * t + laneOffset,
        z: z0 + (z1 - z0) * t + laneOffset,
        laneOffset,
        speed: 1.55 + Math.random() * 0.95,
        phase: Math.random() * Math.PI * 2,
        scaleY: 0.92 + Math.random() * 0.16,
        heading: 0,
      });

      _c.setHex(TUNIC_PALETTE[i % TUNIC_PALETTE.length]);
      _c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      this.bodyMesh.setColorAt(i, _c);
    }
    this.bodyMesh.instanceColor.needsUpdate = true;
  }

  setCount(n) {
    this.activeCount = Math.max(1, Math.min(this.maxCount, n));
    this.bodyMesh.count = this.activeCount;
    this.headMesh.count = this.activeCount;
  }

  update(dt, heroPos) {
    for (let i = 0; i < this.activeCount; i++) {
      const a = this.agents[i];
      const [tx, tz] = a.loop[a.wpIdx];
      const targetX = tx + a.laneOffset;
      const targetZ = tz + a.laneOffset;
      let dx = targetX - a.x;
      let dz = targetZ - a.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 1.2) {
        a.wpIdx = (a.wpIdx + 1) % a.loop.length;
      } else {
        dx /= dist;
        dz /= dist;
        // Softly step aside when the Marshal or his horse passes nearby
        if (heroPos) {
          const hx = a.x - heroPos.x;
          const hz = a.z - heroPos.z;
          const hd = Math.hypot(hx, hz);
          if (hd < 2.4 && hd > 0.01) {
            dx += (hx / hd) * 1.4;
            dz += (hz / hd) * 1.4;
          }
        }
        a.x += dx * a.speed * dt;
        a.z += dz * a.speed * dt;
        a.heading = Math.atan2(dx, dz);
      }

      a.phase += dt * a.speed * 4.2;
      const bob = Math.abs(Math.sin(a.phase)) * 0.07;
      const sway = Math.sin(a.phase) * 0.06;

      _p.set(a.x, bob, a.z);
      _e.set(0, a.heading, sway);
      _q.setFromEuler(_e);
      _s.set(1, a.scaleY, 1);
      _m.compose(_p, _q, _s);

      this.bodyMesh.setMatrixAt(i, _m);
      this.headMesh.setMatrixAt(i, _m);
    }
    this.bodyMesh.instanceMatrix.needsUpdate = true;
    this.headMesh.instanceMatrix.needsUpdate = true;
  }
}

import * as THREE from 'three';
import { GEO } from '../core/Batcher.js';

/**
 * Lightweight instanced chimney smoke puffs rising and drifting in the breeze.
 */
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

export class SmokeSystem {
  constructor(emitters, puffsPerEmitter = 7) {
    this.emitters = emitters;
    this.puffs = [];
    const total = emitters.length * puffsPerEmitter;
    const mat = new THREE.MeshLambertMaterial({
      color: 0xf3e4cf,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      flatShading: true,
    });
    this.mesh = new THREE.InstancedMesh(GEO.ico, mat, total);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;

    for (let e = 0; e < emitters.length; e++) {
      for (let i = 0; i < puffsPerEmitter; i++) {
        this.puffs.push({
          origin: emitters[e],
          age: i / puffsPerEmitter,
          speed: 0.14 + Math.random() * 0.08,
          seed: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  update(dt) {
    for (let i = 0; i < this.puffs.length; i++) {
      const p = this.puffs[i];
      p.age = (p.age + dt * p.speed) % 1;
      const a = p.age;
      const lift = a * 9.5;
      const driftX = a * 2.6 + Math.sin(a * 5 + p.seed) * 0.45;
      const driftZ = a * 1.1 + Math.cos(a * 4 + p.seed) * 0.35;
      const scale = (0.35 + a * 1.45) * Math.sin(a * Math.PI);
      _p.set(p.origin.x + driftX, p.origin.y + lift, p.origin.z + driftZ);
      _s.setScalar(Math.max(0.01, scale));
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

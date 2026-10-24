import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { GEO } from '../core/Batcher.js';

/**
 * Low-poly Roman cavalry steed with crimson saddle cloth, gold phalerae harness,
 * and 4-leg trot/gallop animation. Can be mounted/dismounted with E.
 */
export class Horse {
  constructor(x = 6, z = 44) {
    const P = CONFIG.palette;
    this.group = new THREE.Group();
    this.group.name = 'Warhorse';
    this.group.position.set(x, 0, z);
    this.position = this.group.position;
    this.heading = 0.4;
    this.speed = 0;
    this.phase = 0;
    this.lastStepSign = 1;

    const mat = (hex) =>
      new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 0.78, metalness: 0.06 });

    const mCoat = mat(0x5b3a24);
    const mDark = mat(0x23160e);
    const mRed = mat(P.imperialRed);
    const mGold = mat(P.gold);

    // Barrel body
    const body = new THREE.Mesh(GEO.box, mCoat);
    body.scale.set(0.92, 0.86, 2.15);
    body.position.set(0, 1.32, 0);
    body.castShadow = true;
    this.group.add(body);

    // Saddle cloth & four-horned Roman saddle
    const cloth = new THREE.Mesh(GEO.box, mRed);
    cloth.scale.set(0.98, 0.55, 1.05);
    cloth.position.set(0, 1.5, -0.05);
    cloth.castShadow = true;
    const trim = new THREE.Mesh(GEO.box, mGold);
    trim.scale.set(1.0, 0.12, 1.08);
    trim.position.set(0, 1.25, -0.05);
    this.group.add(cloth, trim);

    // Neck & head
    const neck = new THREE.Mesh(GEO.box, mCoat);
    neck.scale.set(0.46, 0.95, 0.52);
    neck.position.set(0, 1.92, 0.92);
    neck.rotation.x = 0.42;
    neck.castShadow = true;

    const mane = new THREE.Mesh(GEO.box, mDark);
    mane.scale.set(0.14, 0.92, 0.22);
    mane.position.set(0, 1.98, 0.72);
    mane.rotation.x = 0.42;

    const head = new THREE.Mesh(GEO.box, mCoat);
    head.scale.set(0.42, 0.38, 0.76);
    head.position.set(0, 2.26, 1.28);
    head.rotation.x = 0.32;
    head.castShadow = true;
    this.group.add(neck, mane, head);

    // Tail
    this.tail = new THREE.Mesh(GEO.box, mDark);
    this.tail.scale.set(0.2, 0.85, 0.22);
    this.tail.position.set(0, 1.25, -1.16);
    this.tail.rotation.x = -0.28;
    this.group.add(this.tail);

    // Four articulated legs
    const legCoords = [
      [-0.32, 0.95, 0.78], // FL
      [0.32, 0.95, 0.78],  // FR
      [-0.32, 0.95, -0.78],// BL
      [0.32, 0.95, -0.78], // BR
    ];
    this.legs = legCoords.map(([lx, ly, lz]) => {
      const lg = new THREE.Group();
      lg.position.set(lx, ly, lz);
      const upper = new THREE.Mesh(GEO.box, mCoat);
      upper.scale.set(0.22, 0.82, 0.22);
      upper.position.set(0, -0.4, 0);
      upper.castShadow = true;
      const hoof = new THREE.Mesh(GEO.box, mDark);
      hoof.scale.set(0.24, 0.16, 0.26);
      hoof.position.set(0, -0.87, 0.02);
      lg.add(upper, hoof);
      this.group.add(lg);
      return lg;
    });
  }

  update(dt, onStep) {
    this.group.rotation.y = this.heading;
    if (this.speed > 0.2) {
      this.phase += dt * (2.2 + this.speed * 0.95);
      const amp = Math.min(0.75, 0.22 + this.speed * 0.04);
      const s = Math.sin(this.phase);
      const c = Math.cos(this.phase);
      this.legs[0].rotation.x = s * amp;
      this.legs[3].rotation.x = s * amp;
      this.legs[1].rotation.x = -s * amp;
      this.legs[2].rotation.x = -s * amp;
      this.tail.rotation.x = -0.35 - Math.min(0.45, this.speed * 0.03) + c * 0.08;

      const sign = s >= 0 ? 1 : -1;
      if (sign !== this.lastStepSign) {
        this.lastStepSign = sign;
        onStep?.(true);
      }
    } else {
      for (const l of this.legs) l.rotation.x = 0;
      this.tail.rotation.x = -0.25;
    }
  }
}

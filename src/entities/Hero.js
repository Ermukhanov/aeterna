import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { GEO } from '../core/Batcher.js';

/**
 * Placeholder low-poly character model for Marcus Valerius Corvinus (29, Roman Marshal):
 *  - Bronze muscled cuirass (lorica musculata) & pteryges skirt
 *  - Imperial crimson paludamentum cloak
 *  - Crested marshal helmet & gladius scabbard at hip
 *  - Articulated legs & arms with walk/run/mounted pose
 */
export class Hero {
  constructor() {
    const P = CONFIG.palette;
    this.group = new THREE.Group();
    this.group.name = 'MarcusValeriusCorvinus';

    this.position = this.group.position;
    this.heading = 0;
    this.speed = 0;
    this.mounted = false;
    this.stepPhase = 0;
    this.lastStepSign = 1;

    const mat = (hex, metal = 0.08, rough = 0.75) =>
      new THREE.MeshStandardMaterial({ color: hex, flatShading: true, metalness: metal, roughness: rough });

    const mSkin = mat(0xd8a984);
    const mArmor = mat(P.bronze, 0.45, 0.45);
    const mGold = mat(P.gold, 0.55, 0.35);
    const mRed = mat(P.imperialRed, 0.05, 0.8);
    const mTunic = mat(0xefe4ce, 0.02, 0.85);
    const mLeather = mat(P.wood, 0.1, 0.8);

    this.bodyRoot = new THREE.Group();
    this.group.add(this.bodyRoot);

    // Legs (pivoted at hip y = 0.86)
    this.leftLeg = this._makeLeg(mSkin, mLeather, mGold);
    this.leftLeg.position.set(-0.16, 0.86, 0);
    this.rightLeg = this._makeLeg(mSkin, mLeather, mGold);
    this.rightLeg.position.set(0.16, 0.86, 0);
    this.bodyRoot.add(this.leftLeg, this.rightLeg);

    // Tunic & pteryges skirt
    const skirt = new THREE.Mesh(GEO.cyl8, mTunic);
    skirt.scale.set(0.54, 0.36, 0.42);
    skirt.position.set(0, 0.92, 0);
    skirt.castShadow = true;
    this.bodyRoot.add(skirt);

    // Bronze cuirass torso
    const torso = new THREE.Mesh(GEO.box, mArmor);
    torso.scale.set(0.56, 0.62, 0.34);
    torso.position.set(0, 1.32, 0);
    torso.castShadow = true;
    this.bodyRoot.add(torso);

    // Gold pectoral baldric / eagle emblem
    const emblem = new THREE.Mesh(GEO.box, mGold);
    emblem.scale.set(0.32, 0.16, 0.37);
    emblem.position.set(0, 1.42, 0);
    this.bodyRoot.add(emblem);

    // Shoulder pauldrons
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(GEO.box, mArmor);
      p.scale.set(0.22, 0.16, 0.38);
      p.position.set(s * 0.36, 1.56, 0);
      p.castShadow = true;
      this.bodyRoot.add(p);
    }

    // Crimson marshal cloak (paludamentum)
    this.cloak = new THREE.Mesh(GEO.box, mRed);
    this.cloak.scale.set(0.58, 1.05, 0.08);
    this.cloak.position.set(0, 1.08, -0.22);
    this.cloak.rotation.x = 0.12;
    this.cloak.castShadow = true;
    this.bodyRoot.add(this.cloak);

    // Gladius scabbard on left hip
    const scabbard = new THREE.Mesh(GEO.box, mGold);
    scabbard.scale.set(0.08, 0.52, 0.12);
    scabbard.position.set(-0.32, 0.96, 0.05);
    scabbard.rotation.x = -0.35;
    this.bodyRoot.add(scabbard);

    // Arms (pivoted at shoulder y = 1.52)
    this.leftArm = this._makeArm(mSkin, mArmor);
    this.leftArm.position.set(-0.38, 1.52, 0);
    this.rightArm = this._makeArm(mSkin, mArmor);
    this.rightArm.position.set(0.38, 1.52, 0);
    this.bodyRoot.add(this.leftArm, this.rightArm);

    // Head + Gallic/Imperial helmet + transverse red crest
    const head = new THREE.Mesh(GEO.ico1, mSkin);
    head.scale.set(0.34, 0.38, 0.34);
    head.position.set(0, 1.82, 0);
    head.castShadow = true;
    this.bodyRoot.add(head);

    const helm = new THREE.Mesh(GEO.dome, mGold);
    helm.scale.set(0.39, 0.38, 0.42);
    helm.position.set(0, 1.84, -0.01);
    helm.castShadow = true;
    this.bodyRoot.add(helm);

    const crest = new THREE.Mesh(GEO.box, mRed);
    crest.scale.set(0.12, 0.24, 0.48);
    crest.position.set(0, 2.12, -0.02);
    crest.castShadow = true;
    this.bodyRoot.add(crest);
  }

  _makeLeg(mSkin, mLeather, mGold) {
    const g = new THREE.Group();
    const thigh = new THREE.Mesh(GEO.cyl8, mSkin);
    thigh.scale.set(0.18, 0.42, 0.18);
    thigh.position.set(0, -0.22, 0);
    thigh.castShadow = true;
    const greave = new THREE.Mesh(GEO.cyl8, mGold);
    greave.scale.set(0.17, 0.42, 0.17);
    greave.position.set(0, -0.62, 0);
    greave.castShadow = true;
    const boot = new THREE.Mesh(GEO.box, mLeather);
    boot.scale.set(0.19, 0.12, 0.28);
    boot.position.set(0, -0.82, 0.04);
    g.add(thigh, greave, boot);
    return g;
  }

  _makeArm(mSkin, mArmor) {
    const g = new THREE.Group();
    const upper = new THREE.Mesh(GEO.cyl8, mSkin);
    upper.scale.set(0.15, 0.56, 0.15);
    upper.position.set(0, -0.28, 0);
    upper.castShadow = true;
    const bracer = new THREE.Mesh(GEO.cyl8, mArmor);
    bracer.scale.set(0.16, 0.24, 0.16);
    bracer.position.set(0, -0.46, 0);
    g.add(upper, bracer);
    return g;
  }

  updateAnimation(dt, onStep) {
    this.group.rotation.y = this.heading;
    if (this.mounted) {
      // Seated cavalry posture
      this.bodyRoot.position.set(0, 0.92, -0.08);
      this.leftLeg.rotation.set(-0.95, 0, -0.28);
      this.rightLeg.rotation.set(-0.95, 0, 0.28);
      this.leftArm.rotation.set(-0.55, 0, 0.1);
      this.rightArm.rotation.set(-0.55, 0, -0.1);
      this.cloak.rotation.x = 0.28 + Math.min(0.45, this.speed * 0.03);
      return;
    }

    const moving = this.speed > 0.15;
    if (moving) {
      const rate = this.speed * 1.85;
      this.stepPhase += dt * rate;
      const s = Math.sin(this.stepPhase);
      const amp = Math.min(0.75, 0.25 + this.speed * 0.065);
      this.leftLeg.rotation.set(s * amp, 0, 0);
      this.rightLeg.rotation.set(-s * amp, 0, 0);
      this.leftArm.rotation.set(-s * amp * 0.7, 0, 0);
      this.rightArm.rotation.set(s * amp * 0.7, 0, 0);
      this.bodyRoot.position.set(0, Math.abs(Math.cos(this.stepPhase)) * 0.06, 0);
      this.cloak.rotation.x = 0.16 + Math.min(0.35, this.speed * 0.04) + Math.sin(this.stepPhase * 2) * 0.04;

      const sign = s >= 0 ? 1 : -1;
      if (sign !== this.lastStepSign) {
        this.lastStepSign = sign;
        onStep?.(false);
      }
    } else {
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, 0);
      this.rightArm.rotation.set(0, 0, 0);
      this.bodyRoot.position.set(0, 0, 0);
      this.cloak.rotation.x = 0.12;
    }
  }
}

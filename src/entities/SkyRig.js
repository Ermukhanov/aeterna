import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Shared lighting + sky dome + fog rig used by both Lobby and Rome District.
 * Supports smooth evaluation at any hour (0..24) with warm golden-hour bias.
 */
const KEYFRAMES = [
  { h: 0,  zenith: 0x090d1c, horizon: 0x182038, fog: 0x161d30, sun: 0x2c3c66, sunI: 0.12, hemiI: 0.22 },
  { h: 5,  zenith: 0x1c2240, horizon: 0x6b3a3e, fog: 0x563338, sun: 0xff7b4a, sunI: 0.45, hemiI: 0.35 },
  { h: 6.4,zenith: 0x3b4d7a, horizon: 0xf4a259, fog: 0xe8a568, sun: 0xffae52, sunI: 1.95, hemiI: 0.75 },
  { h: 9,  zenith: 0x4b77a8, horizon: 0xe8c796, fog: 0xdfc295, sun: 0xffe0a8, sunI: 2.2,  hemiI: 0.85 },
  { h: 13, zenith: 0x3d73b0, horizon: 0xdcc9a6, fog: 0xd8c6a4, sun: 0xfff0cf, sunI: 2.4,  hemiI: 0.95 },
  { h: 17.5,zenith:0x3f4c77, horizon: 0xf08c4b, fog: 0xdf8c52, sun: 0xff9642, sunI: 2.0,  hemiI: 0.75 },
  { h: 19.5,zenith:0x1b203c, horizon: 0x6f3542, fog: 0x482836, sun: 0xff6b3d, sunI: 0.35, hemiI: 0.32 },
  { h: 24, zenith: 0x090d1c, horizon: 0x182038, fog: 0x161d30, sun: 0x2c3c66, sunI: 0.12, hemiI: 0.22 },
];

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();

export class SkyRig {
  constructor(scene, { fogDensity = 0.0045, shadowRadius = CONFIG.render.shadowRadius } = {}) {
    this.scene = scene;
    this.shadowRadius = shadowRadius;

    this.fog = new THREE.FogExp2(0xe8a568, fogDensity);
    scene.fog = this.fog;

    // Gradient sky dome shader
    this.skyUniforms = {
      uZenith: { value: new THREE.Color(0x3b4d7a) },
      uHorizon: { value: new THREE.Color(0xf4a259) },
      uSunDir: { value: new THREE.Vector3(0.6, 0.25, -0.7).normalize() },
      uSunColor: { value: new THREE.Color(0xffae52) },
    };

    const skyGeo = new THREE.SphereGeometry(520, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.skyUniforms,
      vertexShader: /* glsl */ `
        varying vec3 vWorldDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        varying vec3 vWorldDir;
        void main() {
          vec3 d = normalize(vWorldDir);
          float h = clamp(d.y * 0.85 + 0.15, 0.0, 1.0);
          vec3 col = mix(uHorizon, uZenith, pow(h, 0.6));
          float sunAmt = max(dot(d, uSunDir), 0.0);
          col += uSunColor * pow(sunAmt, 18.0) * 0.55;
          col += uSunColor * smoothstep(0.996, 0.9995, sunAmt) * 1.4;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this.skyMesh);

    this.hemi = new THREE.HemisphereLight(0xffe2b0, 0x5c4330, 0.8);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffb45c, 2.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(CONFIG.render.shadowMapSize, CONFIG.render.shadowMapSize);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.03;
    const r = shadowRadius;
    this.sun.shadow.camera.left = -r;
    this.sun.shadow.camera.right = r;
    this.sun.shadow.camera.top = r;
    this.sun.shadow.camera.bottom = -r;
    this.sun.shadow.camera.near = 5;
    this.sun.shadow.camera.far = 260;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.setHour(6.4);
  }

  setHour(hour, focusPos = null) {
    const h = ((hour % 24) + 24) % 24;
    let a = KEYFRAMES[0], b = KEYFRAMES[KEYFRAMES.length - 1];
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (h >= KEYFRAMES[i].h && h <= KEYFRAMES[i + 1].h) {
        a = KEYFRAMES[i];
        b = KEYFRAMES[i + 1];
        break;
      }
    }
    const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);

    this.skyUniforms.uZenith.value.copy(_c1.setHex(a.zenith)).lerp(_c2.setHex(b.zenith), t);
    this.skyUniforms.uHorizon.value.copy(_c1.setHex(a.horizon)).lerp(_c2.setHex(b.horizon), t);
    this.fog.color.copy(_c1.setHex(a.fog)).lerp(_c2.setHex(b.fog), t);
    this.sun.color.copy(_c1.setHex(a.sun)).lerp(_c2.setHex(b.sun), t);
    this.skyUniforms.uSunColor.value.copy(this.sun.color);

    this.sun.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, t);
    this.hemi.intensity = THREE.MathUtils.lerp(a.hemiI, b.hemiI, t);
    this.hemi.color.copy(this.skyUniforms.uHorizon.value);

    // Sun arc: rises in the east (+X / -Z), peaks at noon, sets in the west
    const angle = ((h - 6) / 12) * Math.PI;
    const elev = Math.max(0.14, Math.sin(angle));
    const azim = Math.cos(angle);
    const dir = this.skyUniforms.uSunDir.value.set(azim * 0.75, elev, -0.55).normalize();

    const cx = focusPos ? focusPos.x : 0;
    const cz = focusPos ? focusPos.z : 0;
    this.sun.target.position.set(cx, 0, cz);
    this.sun.position.set(cx + dir.x * 110, dir.y * 110, cz + dir.z * 110);
    if (focusPos) this.skyMesh.position.set(cx, 0, cz);
  }
}

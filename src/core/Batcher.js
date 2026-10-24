import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Static geometry batcher.
 * Collects many primitive geometries (with per-part vertex colour) and merges
 * them into a handful of meshes, bucketed on an XZ grid so frustum culling
 * still works. This keeps draw calls very low for the procedural city.
 *
 * Supports a transform stack: push(x,y,z,rotY) / pop() so builders can work
 * in local coordinates.
 */
const _m = new THREE.Matrix4();
const _local = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _v = new THREE.Vector3();

export class Batcher {
  constructor({ cellSize = 0, colliders = null } = {}) {
    this.cellSize = cellSize;
    this.colliders = colliders;
    this.buckets = new Map();
    this.stack = [new THREE.Matrix4()];
  }

  get matrix() {
    return this.stack[this.stack.length - 1];
  }

  push(x = 0, y = 0, z = 0, ry = 0) {
    _q.setFromAxisAngle(_v.set(0, 1, 0), ry);
    _local.compose(_p.set(x, y, z), _q, _s.set(1, 1, 1));
    this.stack.push(this.matrix.clone().multiply(_local));
    return this;
  }

  pop() {
    if (this.stack.length > 1) this.stack.pop();
    return this;
  }

  /**
   * Add a geometry. `t` = { x,y,z, rx,ry,rz, sx,sy,sz } local transform.
   * color: hex or THREE.Color. jitter: random brightness variation (0..1).
   */
  add(geo, color, t = {}, jitter = 0) {
    _e.set(t.rx || 0, t.ry || 0, t.rz || 0);
    _q.setFromEuler(_e);
    _local.compose(
      _p.set(t.x || 0, t.y || 0, t.z || 0),
      _q,
      _s.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1),
    );
    _m.copy(this.matrix).multiply(_local);
    return this.addMatrix(geo, color, _m, jitter);
  }

  addMatrix(geo, color, matrix, jitter = 0) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) {
      if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    g.applyMatrix4(matrix);
    _c.set(color);
    if (jitter) _c.offsetHSL(0, 0, (Math.random() - 0.5) * jitter);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = _c.r;
      col[i * 3 + 1] = _c.g;
      col[i * 3 + 2] = _c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    let key = '0';
    if (this.cellSize) {
      g.computeBoundingSphere();
      const c = g.boundingSphere.center;
      key = `${Math.floor(c.x / this.cellSize)},${Math.floor(c.z / this.cellSize)}`;
    }
    if (!this.buckets.has(key)) this.buckets.set(key, []);
    this.buckets.get(key).push(g);
    return g;
  }

  /** Axis-aligned box collider in local coords (centre lx,lz; half sizes). */
  collideBox(lx, lz, hw, hd, h = 10) {
    if (!this.colliders) return;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [dx, dz] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) {
      _v.set(lx + dx, 0, lz + dz).applyMatrix4(this.matrix);
      minX = Math.min(minX, _v.x); maxX = Math.max(maxX, _v.x);
      minZ = Math.min(minZ, _v.z); maxZ = Math.max(maxZ, _v.z);
    }
    this.colliders.addBox(minX, minZ, maxX, maxZ, h);
  }

  collideCircle(lx, lz, r, h = 10) {
    if (!this.colliders) return;
    _v.set(lx, 0, lz).applyMatrix4(this.matrix);
    this.colliders.addEllipse(_v.x, _v.z, r, r, h);
  }

  build(material, { castShadow = true, receiveShadow = true, name = 'batch' } = {}) {
    const group = new THREE.Group();
    group.name = name;
    for (const [key, parts] of this.buckets) {
      if (!parts.length) continue;
      const merged = mergeGeometries(parts, false);
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.name = `${name}:${key}`;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
      for (const p of parts) p.dispose();
    }
    this.buckets.clear();
    return group;
  }
}

/** Shared geometry primitives (unit sized, reused by builders). */
export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cyl12: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone6: new THREE.ConeGeometry(0.5, 1, 6),
  cone8: new THREE.ConeGeometry(0.5, 1, 8),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  ico1: new THREE.IcosahedronGeometry(0.5, 1),
  dome: new THREE.SphereGeometry(0.5, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2),
  sphere: new THREE.SphereGeometry(0.5, 8, 6),
  // triangular prism (roof): base width 1, height 1, depth 1, ridge along Z
  prism: (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, 0);
    s.lineTo(0.5, 0);
    s.lineTo(0, 1);
    s.lineTo(-0.5, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
    g.translate(0, 0, -0.5);
    return g;
  })(),
  // half cylinder (barrel vault), axis along Z, radius 0.5, length 1
  vault: (() => {
    const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 10, 1, false, -Math.PI / 2, Math.PI);
    g.rotateX(Math.PI / 2);
    return g;
  })(),
  pyramid: (() => {
    const g = new THREE.ConeGeometry(0.7071, 1, 4);
    g.rotateY(Math.PI / 4);
    g.translate(0, 0.5, 0);
    return g;
  })(),
};

/** Standard low-poly vertex-coloured material. */
export function makeWorldMaterial() {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.88,
    metalness: 0.0,
  });
}

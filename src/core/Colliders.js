/**
 * 2D (XZ-plane) collision world: axis-aligned boxes and ellipses.
 * Good enough for a walkable prototype; spatially hashed for speed.
 */
export class Colliders {
  constructor(cell = 16) {
    this.cell = cell;
    this.grid = new Map();
    this.list = [];
  }

  _key(ix, iz) {
    return ix * 73856093 + iz * 19349663;
  }

  _insert(c) {
    this.list.push(c);
    const c0x = Math.floor(c.minX / this.cell), c1x = Math.floor(c.maxX / this.cell);
    const c0z = Math.floor(c.minZ / this.cell), c1z = Math.floor(c.maxZ / this.cell);
    for (let x = c0x; x <= c1x; x++)
      for (let z = c0z; z <= c1z; z++) {
        const k = this._key(x, z);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(c);
      }
  }

  addBox(minX, minZ, maxX, maxZ, h = 10) {
    this._insert({ type: 'box', minX, minZ, maxX, maxZ, h });
  }

  addEllipse(cx, cz, rx, rz, h = 10) {
    this._insert({ type: 'ellipse', cx, cz, rx, rz, h, minX: cx - rx, maxX: cx + rx, minZ: cz - rz, maxZ: cz + rz });
  }

  _near(x, z, r) {
    const out = new Set();
    const c0x = Math.floor((x - r) / this.cell), c1x = Math.floor((x + r) / this.cell);
    const c0z = Math.floor((z - r) / this.cell), c1z = Math.floor((z + r) / this.cell);
    for (let ix = c0x; ix <= c1x; ix++)
      for (let iz = c0z; iz <= c1z; iz++) {
        const arr = this.grid.get(this._key(ix, iz));
        if (arr) for (const c of arr) out.add(c);
      }
    return out;
  }

  /** Push a circle (pos.x,pos.z,radius) out of all colliders. Mutates pos. */
  resolve(pos, radius) {
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this._near(pos.x, pos.z, radius + 1)) {
        if (c.type === 'box') {
          const qx = Math.max(c.minX, Math.min(pos.x, c.maxX));
          const qz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
          let dx = pos.x - qx, dz = pos.z - qz;
          const d2 = dx * dx + dz * dz;
          if (d2 > 1e-8) {
            if (d2 < radius * radius) {
              const d = Math.sqrt(d2);
              pos.x = qx + (dx / d) * radius;
              pos.z = qz + (dz / d) * radius;
            }
          } else {
            // centre inside box: push along smallest penetration axis
            const pl = pos.x - c.minX, pr = c.maxX - pos.x, pt = pos.z - c.minZ, pb = c.maxZ - pos.z;
            const m = Math.min(pl, pr, pt, pb);
            if (m === pl) pos.x = c.minX - radius;
            else if (m === pr) pos.x = c.maxX + radius;
            else if (m === pt) pos.z = c.minZ - radius;
            else pos.z = c.maxZ + radius;
          }
        } else {
          const ex = (pos.x - c.cx) / (c.rx + radius);
          const ez = (pos.z - c.cz) / (c.rz + radius);
          const d = Math.hypot(ex, ez);
          if (d < 1) {
            const s = d > 1e-6 ? 1 / d : 1;
            pos.x = c.cx + ex * s * (c.rx + radius) + (d > 1e-6 ? 0 : c.rx + radius);
            pos.z = c.cz + ez * s * (c.rz + radius);
          }
        }
      }
    }
    return pos;
  }

  /** Is world point (x,y,z) inside any collider volume? (used for camera) */
  pointBlocked(x, y, z) {
    for (const c of this._near(x, z, 0.1)) {
      if (y > c.h) continue;
      if (c.type === 'box') {
        if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
      } else {
        const ex = (x - c.cx) / c.rx, ez = (z - c.cz) / c.rz;
        if (ex * ex + ez * ez < 1) return true;
      }
    }
    return false;
  }
}

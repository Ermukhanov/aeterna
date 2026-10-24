import * as THREE from 'three';

/**
 * Flock of low-poly birds wheeling across the sky with flapping wings.
 */
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

function makeWingGeometry(side) {
  const g = new THREE.BufferGeometry();
  const s = side;
  const verts = new Float32Array([
    0, 0, 0.25,
    0, 0, -0.25,
    s * 0.9, 0.05, -0.05,
  ]);
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

export class Birds {
  constructor(count = 18, center = new THREE.Vector3(0, 26, -65), radius = 48) {
    this.count = count;
    this.center = center;
    this.radius = radius;
    this.time = 0;
    this.group = new THREE.Group();

    const mat = new THREE.MeshBasicMaterial({ color: 0x261a14, side: THREE.DoubleSide });
    this.leftMesh = new THREE.InstancedMesh(makeWingGeometry(-1), mat, count);
    this.rightMesh = new THREE.InstancedMesh(makeWingGeometry(1), mat, count);
    this.group.add(this.leftMesh, this.rightMesh);

    this.birds = [];
    for (let i = 0; i < count; i++) {
      this.birds.push({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
        r: radius * (0.45 + Math.random() * 0.7),
        y: center.y + (Math.random() - 0.5) * 14,
        speed: 0.14 + Math.random() * 0.12,
        flapSpeed: 6.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        scale: 0.65 + Math.random() * 0.45,
      });
    }
  }

  update(dt) {
    this.time += dt;
    for (let i = 0; i < this.count; i++) {
      const b = this.birds[i];
      b.angle += b.speed * dt;
      const x = this.center.x + Math.cos(b.angle) * b.r;
      const z = this.center.z + Math.sin(b.angle) * b.r * 0.65;
      const y = b.y + Math.sin(this.time * 0.9 + b.phase) * 1.4;
      const heading = -b.angle;
      const flap = Math.sin(this.time * b.flapSpeed + b.phase) * 0.55;

      _p.set(x, y, z);
      _s.setScalar(b.scale);

      _e.set(0, heading, flap);
      _q.setFromEuler(_e);
      _m.compose(_p, _q, _s);
      this.leftMesh.setMatrixAt(i, _m);

      _e.set(0, heading, -flap);
      _q.setFromEuler(_e);
      _m.compose(_p, _q, _s);
      this.rightMesh.setMatrixAt(i, _m);
    }
    this.leftMesh.instanceMatrix.needsUpdate = true;
    this.rightMesh.instanceMatrix.needsUpdate = true;
  }
}

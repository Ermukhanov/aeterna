/** Lightweight FPS + draw-call readout. */
export class FpsCounter {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'fps';
    document.body.appendChild(this.el);
    this.frames = 0;
    this.acc = 0;
    this.last = performance.now();
    this.value = 0;
  }

  setVisible(v) {
    this.el.style.display = v ? 'block' : 'none';
  }

  tick(renderer) {
    this.frames++;
    const now = performance.now();
    if (now - this.last >= 500) {
      this.value = Math.round((this.frames * 1000) / (now - this.last));
      const info = renderer.info.render;
      this.el.textContent = `${this.value} FPS · ${info.calls} draws · ${(info.triangles / 1000).toFixed(0)}k tris`;
      this.frames = 0;
      this.last = now;
    }
  }
}

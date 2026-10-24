/**
 * Minimal scene manager.
 * Scenes are created lazily via factories and cached. Each scene implements:
 *   enter(params) / exit() / update(dt) / resize(w,h)
 *   is3D (bool), scene (THREE.Scene), camera (THREE.Camera)
 */
export class SceneManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.factories = new Map();
    this.cache = new Map();
    this.current = null;
    this.currentName = null;
    this.transitioning = false;
    this.fadeEl = document.getElementById('fade');
  }

  register(name, factory) {
    this.factories.set(name, factory);
  }

  get(name) {
    if (!this.cache.has(name)) {
      const f = this.factories.get(name);
      if (!f) throw new Error(`Unknown scene: ${name}`);
      this.cache.set(name, f());
    }
    return this.cache.get(name);
  }

  async go(name, params = {}, { fade = true } = {}) {
    if (this.transitioning) return;
    this.transitioning = true;
    try {
      if (fade && this.current) await this._fade(1);
      if (this.current) this.current.exit();
      this.ctx.ui.innerHTML = '';
      // let the fade paint before a potentially heavy scene build
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      const next = this.get(name);
      this.current = next;
      this.currentName = name;
      next.enter(params);
      next.resize?.(window.innerWidth, window.innerHeight);
      this.ctx.renderer.domElement.style.display = next.is3D ? 'block' : 'none';
      window.dispatchEvent(new CustomEvent('aeterna:scene', { detail: name }));
      if (fade) await this._fade(0);
    } finally {
      this.transitioning = false;
    }
  }

  _fade(to) {
    return new Promise((resolve) => {
      this.fadeEl.style.opacity = String(to);
      setTimeout(resolve, 600);
    });
  }

  update(dt) {
    this.current?.update(dt);
  }

  resize(w, h) {
    for (const s of this.cache.values()) s.resize?.(w, h);
  }
}

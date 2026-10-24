import * as THREE from 'three';
import './styles.css';
import { CONFIG, loadSettings, saveSettings, qualityPreset } from './config.js';
import { SceneManager } from './core/SceneManager.js';
import { Input } from './core/Input.js';
import { AudioManager } from './audio/AudioManager.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { RomeDistrictScene } from './scenes/RomeDistrictScene.js';
import { ProvinceMapScene } from './scenes/ProvinceMapScene.js';
import { createMuteButton } from './ui/MuteButton.js';
import { FpsCounter } from './ui/FpsCounter.js';
import { showSplash } from './ui/Splash.js';

// ---------- renderer ----------
const settings = loadSettings();
const renderer = new THREE.WebGLRenderer({
  antialias: CONFIG.render.antialias,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = CONFIG.render.toneMappingExposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('app').appendChild(renderer.domElement);

// ---------- shared context ----------
const ctx = {
  renderer,
  settings,
  audio: new AudioManager(settings),
  input: new Input(renderer.domElement),
  ui: document.getElementById('ui'),
  manager: null,
  applySettings,
  saveSettings: () => saveSettings(settings),
};
const manager = new SceneManager(ctx);
ctx.manager = manager;

manager.register('lobby', () => new LobbyScene(ctx));
manager.register('district', () => new RomeDistrictScene(ctx));
manager.register('map', () => new ProvinceMapScene(ctx));

const fps = new FpsCounter();

function applySettings() {
  const q = qualityPreset(settings);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio * q.pixelRatio, CONFIG.render.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (renderer.shadowMap.enabled !== q.shadows) {
    renderer.shadowMap.enabled = q.shadows;
    // materials must recompile when shadow support toggles
    for (const s of manager.cache.values()) {
      s.scene?.traverse((o) => {
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true));
      });
    }
  }
  for (const s of manager.cache.values()) s.applyQuality?.(q);
  fps.setVisible(settings.showFps);
  ctx.audio.applyVolumes();
  saveSettings(settings);
}
applySettings();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  manager.resize(window.innerWidth, window.innerHeight);
});

// ---------- main loop ----------
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (ctx.input.wasPressed('KeyM')) ctx.audio.toggleMute();
  manager.update(dt);
  ctx.audio.update(dt);
  const cur = manager.current;
  if (cur?.is3D) renderer.render(cur.scene, cur.camera);
  ctx.input.endFrame();
  fps.tick(renderer);
  requestAnimationFrame(frame);
}

// ---------- boot ----------
createMuteButton(ctx.audio);
// Pre-build the lobby behind the splash so entering is instant.
manager.get('lobby');
document.getElementById('fade').style.opacity = '0';
showSplash(() => {
  ctx.audio.init(); // must happen inside a user gesture
  manager.go('lobby', { first: true });
});
requestAnimationFrame(frame);

// expose for debugging / smoke tests
window.__AETERNA__ = ctx;

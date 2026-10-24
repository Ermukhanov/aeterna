import { CONFIG } from '../config.js';
import { openSettingsModal } from './Settings.js';

function formatRomanHour(h) {
  const hr = Math.floor(((h % 24) + 24) % 24);
  const mn = Math.floor((h % 1) * 60);
  const hh = String(hr).padStart(2, '0');
  const mm = String(mn).padStart(2, '0');
  let watch = 'Noctis';
  if (hr >= 5 && hr < 8) watch = 'Aurora · Dawn';
  else if (hr >= 8 && hr < 12) watch = 'Mane · Morning';
  else if (hr >= 12 && hr < 16) watch = 'Meridies · Midday';
  else if (hr >= 16 && hr < 20) watch = 'Vespera · Golden Hour';
  else watch = 'Vigilia Noctis · Night';
  return { clock: `${hh}:${mm}`, watch };
}

/**
 * In-game HUD for the playable Rome District:
 *  - Hero card (Marcus Valerius Corvinus, current district landmark, foot/mounted state)
 *  - Day/Night cycle time slider + pause/play time button
 *  - Controls legend & contextual interaction prompt ("Press E to Mount Warhorse")
 */
export class DistrictHUD {
  constructor(ctx, scene) {
    this.ctx = ctx;
    this.scene = scene;

    this.root = document.createElement('div');
    this.root.innerHTML = `
      <div class="panel hero-card">
        <div class="crest">M·V</div>
        <div>
          <div class="name">${CONFIG.hero.name}</div>
          <div class="sub">${CONFIG.hero.title} · Age ${CONFIG.hero.age}</div>
          <div class="mode" data-role="status">On Foot · Via Sacra</div>
        </div>
      </div>

      <div class="crosshair-hint">Click scene to look around · ESC for menu</div>

      <div class="top-right-btns">
        <button class="btn" data-act="map">Province Map (P)</button>
        <button class="btn" data-act="settings">Settings</button>
        <button class="btn" data-act="lobby">Main Menu</button>
      </div>

      <div class="panel help">
        <div><b>WASD</b> Move / Steer</div>
        <div><b>SHIFT</b> Sprint / Gallop</div>
        <div><b>E</b> Mount / Dismount Horse</div>
        <div><b>MOUSE</b> Orbit Camera · Wheel Zoom</div>
      </div>

      <div class="panel time-panel">
        <div class="clock">
          <span data-role="clock">07:00</span>
          <small data-role="watch">Aurora · Dawn</small>
        </div>
        <input type="range" min="0" max="24" step="0.05" value="${scene.hour}" data-role="slider" title="Drag to change time of day" />
        <button class="btn" data-act="toggleTime">Pause Sun</button>
      </div>

      <div class="panel prompt" data-role="prompt" style="opacity:0"></div>
    `;

    this.statusEl = this.root.querySelector('[data-role="status"]');
    this.clockEl = this.root.querySelector('[data-role="clock"]');
    this.watchEl = this.root.querySelector('[data-role="watch"]');
    this.sliderEl = this.root.querySelector('[data-role="slider"]');
    this.promptEl = this.root.querySelector('[data-role="prompt"]');
    this.timeBtn = this.root.querySelector('[data-act="toggleTime"]');

    this.sliderEl.addEventListener('input', () => {
      this.scene.setHour(parseFloat(this.sliderEl.value));
    });

    this.timeBtn.addEventListener('click', () => {
      this.ctx.audio.playClick();
      this.scene.timePaused = !this.scene.timePaused;
      this.timeBtn.textContent = this.scene.timePaused ? 'Resume Sun' : 'Pause Sun';
    });

    this.root.querySelector('[data-act="map"]').addEventListener('click', () => {
      this.ctx.audio.playClick();
      this.ctx.manager.go('map', { from: 'district' });
    });
    this.root.querySelector('[data-act="settings"]').addEventListener('click', () => {
      this.ctx.audio.playClick();
      this.ctx.input.releasePointer();
      openSettingsModal(this.ctx);
    });
    this.root.querySelector('[data-act="lobby"]').addEventListener('click', () => {
      this.ctx.audio.playClick();
      this.scene.saveProgress();
      this.ctx.manager.go('lobby');
    });

    ctx.ui.appendChild(this.root);
  }

  update(hour, mounted, landmarkName, promptHtml) {
    const { clock, watch } = formatRomanHour(hour);
    this.clockEl.textContent = clock;
    this.watchEl.textContent = watch;
    if (document.activeElement !== this.sliderEl) {
      this.sliderEl.value = String(((hour % 24) + 24) % 24);
    }
    this.statusEl.textContent = `${mounted ? 'Mounted on Warhorse' : 'On Foot'} · ${landmarkName}`;
    if (promptHtml) {
      this.promptEl.innerHTML = promptHtml;
      this.promptEl.style.opacity = '1';
    } else {
      this.promptEl.style.opacity = '0';
    }
  }
}

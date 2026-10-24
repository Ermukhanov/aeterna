import { openSettingsModal } from './Settings.js';

const SAVE_KEY = 'aeterna.save.v1';

export function hasSavedGame() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function loadSavedGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSavedGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Builds the Lobby main menu UI inside ctx.ui. */
export function buildLobbyMenu(ctx) {
  const saved = hasSavedGame();
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="vignette"></div>
    <div class="menu">
      <h1 class="title">AETERNA</h1>
      <div class="subtitle">ANNO URBIS CONDITAE DCCCLXX · PAX IMPERII</div>
      <button class="item" data-act="continue">
        Continue ${saved ? '<span class="hint">(Saved in Rome)</span>' : '<span class="hint">(Enter Rome)</span>'}
      </button>
      <button class="item" data-act="new">New Campaign</button>
      <button class="item" data-act="map">Province Map</button>
      <button class="item" data-act="settings">Settings</button>
    </div>
    <div class="lobby-footer">
      <span>Marcus Valerius Corvinus · Marshal of the Western Legions</span>
      <span>Prototype v0.1 · Three.js</span>
    </div>
  `;

  root.querySelectorAll('.item').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.audio.playClick();
      const act = btn.dataset.act;
      if (act === 'continue') {
        ctx.manager.go('district', { mode: 'continue' });
      } else if (act === 'new') {
        ctx.manager.go('district', { mode: 'new' });
      } else if (act === 'map') {
        ctx.manager.go('map', { from: 'lobby' });
      } else if (act === 'settings') {
        openSettingsModal(ctx);
      }
    });
  });

  ctx.ui.appendChild(root);
}

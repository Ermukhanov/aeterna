import { CONFIG } from '../config.js';

/**
 * Atmospheric narrative intro overlay shown when starting a New Campaign.
 */
export function showIntroOverlay(parent) {
  const el = document.createElement('div');
  el.className = 'intro';
  el.innerHTML = `
    <div class="line">“${CONFIG.intro.text}”</div>
    <div class="who">
      ${CONFIG.hero.name.toUpperCase()}<br/>
      ${CONFIG.hero.title} · Age ${CONFIG.hero.age}
    </div>
  `;
  parent.appendChild(el);
  setTimeout(() => el.remove(), CONFIG.intro.durationMs);
}

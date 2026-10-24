/** Modal dialog for quality preset, FPS counter, and volume sliders. */
export function openSettingsModal(ctx, onClose) {
  const s = ctx.settings;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `
    <div class="panel settings">
      <h2>SETTINGS</h2>
      <div class="row">
        <label>Graphics Quality</label>
        <select data-k="quality">
          <option value="low" ${s.quality === 'low' ? 'selected' : ''}>Low (Fastest)</option>
          <option value="medium" ${s.quality === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="high" ${s.quality === 'high' ? 'selected' : ''}>High (Golden Hour)</option>
        </select>
      </div>
      <div class="row">
        <label>Show FPS Counter</label>
        <input type="checkbox" data-k="showFps" ${s.showFps ? 'checked' : ''} />
      </div>
      <div class="row">
        <label>Master Volume</label>
        <input type="range" min="0" max="1" step="0.02" value="${s.master}" data-k="master" />
      </div>
      <div class="row">
        <label>Music Volume</label>
        <input type="range" min="0" max="1" step="0.02" value="${s.music}" data-k="music" />
      </div>
      <div class="row">
        <label>Ambience Volume</label>
        <input type="range" min="0" max="1" step="0.02" value="${s.ambience}" data-k="ambience" />
      </div>
      <div class="row">
        <label>Mouse Sensitivity</label>
        <input type="range" min="0.4" max="2.0" step="0.05" value="${s.mouseSensitivity}" data-k="mouseSensitivity" />
      </div>
      <div class="actions">
        <button class="btn" data-close>Close</button>
      </div>
    </div>
  `;

  wrap.querySelectorAll('select, input').forEach((el) => {
    el.addEventListener('input', () => {
      const k = el.dataset.k;
      if (el.type === 'checkbox') s[k] = el.checked;
      else if (el.type === 'range') s[k] = parseFloat(el.value);
      else s[k] = el.value;
      ctx.applySettings();
    });
  });

  const close = () => {
    ctx.audio.playClick();
    wrap.remove();
    onClose?.();
  };
  wrap.querySelector('[data-close]').addEventListener('click', close);
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) close();
  });
  ctx.ui.appendChild(wrap);
}

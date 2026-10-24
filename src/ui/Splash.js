/**
 * "Click to enter" splash. Browsers block audio until a user gesture,
 * so this doubles as the audio unlock (and triggers the buccina).
 */
export function showSplash(onEnter) {
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = `<h1>AETERNA</h1><p>Click or press any key to enter the city</p>`;
  document.body.appendChild(el);
  const go = () => {
    window.removeEventListener('keydown', go);
    el.style.transition = 'opacity 0.8s';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    setTimeout(() => el.remove(), 900);
    onEnter();
  };
  el.addEventListener('click', go, { once: true });
  window.addEventListener('keydown', go);
}

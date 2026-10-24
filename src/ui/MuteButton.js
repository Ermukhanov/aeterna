const ICON_ON =
  '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const ICON_OFF =
  '<svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.2l2.4 2.4c.1-.2.1-.4.1-.6zM19 12c0 .9-.2 1.8-.5 2.6l1.5 1.5A9 9 0 0 0 14 3.2v2.1A7 7 0 0 1 19 12zM4.3 3 3 4.3 7.7 9H3v6h4l5 5v-6.7l4.3 4.3c-.7.5-1.4.9-2.3 1.2v2.1a9 9 0 0 0 3.7-1.8L19.7 21 21 19.7l-9-9L4.3 3zM12 4 9.9 6.1 12 8.2V4z"/></svg>';

/** Global mute toggle (top-right). Also bound to the M key. */
export function createMuteButton(audio) {
  const btn = document.createElement('button');
  btn.className = 'btn mute-btn';
  btn.title = 'Mute / unmute (M)';
  const render = () => (btn.innerHTML = audio.muted ? ICON_OFF : ICON_ON);
  btn.addEventListener('click', () => {
    audio.toggleMute();
    btn.blur();
  });
  audio.onMuteChange = render;
  render();
  document.body.appendChild(btn);
  return btn;
}

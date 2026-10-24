import { saveSettings } from '../config.js';

/**
 * Procedural WebAudio synthesizer:
 *  - Buccina (Roman brass horn) on lobby entry
 *  - Ambient loop: distant city crowd murmur, wind, random market chatter blips, temple bells
 *  - Modal music loop (D Dorian / Phrygian plucked lyre + warm drone)
 *  - UI click & footstep / hoofbeat SFX
 * Zero external audio files required.
 */
export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.muted = !!settings.muted;
    this.onMuteChange = null;
    this.mode = 'none'; // 'lobby' | 'district' | 'map'
    this.bellTimer = 4;
    this.chatterTimer = 1.5;
    this.musicTimer = 0;
    this.musicStep = 0;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.ambGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.musicGain.connect(this.masterGain);
    this.ambGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this._buildAmbienceBed();
    this._buildMusicDrone();
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const m = this.muted ? 0 : (this.settings.master ?? 0.8);
    this.masterGain.gain.setTargetAtTime(m, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.settings.music ?? 0.35, now, 0.05);
    this.ambGain.gain.setTargetAtTime(this.settings.ambience ?? 0.7, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(0.8, now, 0.05);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.settings.muted = this.muted;
    saveSettings(this.settings);
    this.applyVolumes();
    this.onMuteChange?.(this.muted);
  }

  setSceneMode(mode) {
    this.mode = mode;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // District has louder crowd murmur than distant villa terrace
    const crowdTarget = mode === 'district' ? 0.28 : mode === 'lobby' ? 0.11 : 0.05;
    this.crowdBedGain?.gain.setTargetAtTime(crowdTarget, now, 0.5);
  }

  _buildAmbienceBed() {
    const ctx = this.ctx;
    // 3 seconds of pink-ish noise buffer
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029;
      b1 = 0.985 * b1 + w * 0.032;
      b2 = 0.950 * b2 + w * 0.048;
      data[i] = (b0 + b1 + b2 + w * 0.02) * 0.25;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 420;
    bp.Q.value = 0.9;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);
    lfo.start();

    this.crowdBedGain = ctx.createGain();
    this.crowdBedGain.gain.value = 0.12;

    src.connect(bp);
    bp.connect(this.crowdBedGain);
    this.crowdBedGain.connect(this.ambGain);
    src.start();
  }

  _buildMusicDrone() {
    const ctx = this.ctx;
    // Warm fifth drone: D2 (73.42 Hz) + A2 (110 Hz)
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.12;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;

    for (const freq of [73.42, 110.0]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(lp);
      osc.start();
    }
    lp.connect(droneGain);
    droneGain.connect(this.musicGain);
  }

  /** Roman brass buccina fanfare on lobby start. */
  playBuccina() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + 0.05;

    const notes = [
      { f: 146.83, t: 0.0, d: 0.55, g: 0.32 }, // D3
      { f: 220.0, t: 0.52, d: 1.45, g: 0.42 }, // A3
      { f: 293.66, t: 1.95, d: 1.9, g: 0.38 }, // D4
    ];

    for (const n of notes) {
      const t0 = now + n.t;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(n.f * 0.985, t0);
      osc1.frequency.exponentialRampToValueAtTime(n.f, t0 + 0.09);
      osc2.frequency.setValueAtTime(n.f * 1.004, t0);

      const formant = ctx.createBiquadFilter();
      formant.type = 'lowpass';
      formant.Q.value = 4.2;
      formant.frequency.setValueAtTime(360, t0);
      formant.frequency.exponentialRampToValueAtTime(1350, t0 + 0.25);
      formant.frequency.exponentialRampToValueAtTime(680, t0 + n.d);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(n.g, t0 + 0.14);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d + 0.25);

      osc1.connect(formant);
      osc2.connect(formant);
      formant.connect(env);
      env.connect(this.sfxGain);

      osc1.start(t0);
      osc2.start(t0);
      osc1.stop(t0 + n.d + 0.3);
      osc2.stop(t0 + n.d + 0.3);
    }
  }

  /** Distant bronze temple bell. */
  playBell() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const base = 528 + (Math.random() - 0.5) * 60;
    const partials = [1, 1.5, 2.02, 2.98];
    partials.forEach((p, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * p;
      const g = ctx.createGain();
      const amp = (0.09 / (idx + 1)) * (this.mode === 'district' ? 1.1 : 0.65);
      g.gain.setValueAtTime(amp, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8 / (idx * 0.6 + 1));
      osc.connect(g);
      g.connect(this.ambGain);
      osc.start(now);
      osc.stop(now + 3.0);
    });
  }

  /** Subtle vocal-formant blip simulating distant market chatter. */
  playMarketBlip() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const f0 = 150 + Math.random() * 190;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.linearRampToValueAtTime(f0 * (0.85 + Math.random() * 0.35), now + 0.16);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600 + Math.random() * 900;
    bp.Q.value = 3.5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.035, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(bp);
    bp.connect(g);
    g.connect(this.ambGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Plucked lyre note for the background modal loop. */
  _playLyreNote(freq) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, now);
    lp.frequency.exponentialRampToValueAtTime(320, now + 1.4);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    osc.connect(lp);
    lp.connect(g);
    g.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 1.55);
  }

  playClick() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playStep(mounted = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(mounted ? 170 : 110, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(mounted ? 0.14 : 0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  update(dt) {
    if (!this.ctx || this.muted) return;

    this.bellTimer -= dt;
    if (this.bellTimer <= 0) {
      this.bellTimer = 6 + Math.random() * 8;
      this.playBell();
    }

    if (this.mode === 'district') {
      this.chatterTimer -= dt;
      if (this.chatterTimer <= 0) {
        this.chatterTimer = 0.25 + Math.random() * 0.7;
        this.playMarketBlip();
      }
    }

    // D Dorian scale lyre pattern
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      const scale = [293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33];
      const pattern = [0, 4, 3, 2, 4, 6, 4, 1];
      const note = scale[pattern[this.musicStep % pattern.length]];
      this.musicStep++;
      this.musicTimer = 0.9 + (this.musicStep % 2) * 0.45;
      this._playLyreNote(note);
    }
  }
}

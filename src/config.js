/**
 * AETERNA – central configuration.
 * Tweak values here; user-facing settings (quality, volume…) are persisted
 * to localStorage and merged over these defaults at startup.
 */
export const CONFIG = {
  version: '0.1.0-prototype',

  render: {
    antialias: true,
    maxPixelRatio: 1.5, // cap DPR for laptop performance
    toneMappingExposure: 1.05,
    shadowMapSize: 2048,
    shadowRadius: 60, // half-size (m) of the shadow frustum around the player
  },

  // Quality presets selectable in Settings
  qualityPresets: {
    low: { pixelRatio: 0.85, shadows: false, shadowMapSize: 1024, crowd: 25, drawDistance: 260 },
    medium: { pixelRatio: 1.0, shadows: true, shadowMapSize: 1024, crowd: 36, drawDistance: 340 },
    high: { pixelRatio: 1.5, shadows: true, shadowMapSize: 2048, crowd: 48, drawDistance: 420 },
  },

  lobby: {
    hour: 6.35, // dawn
    cameraDriftSpeed: 0.06,
    cameraDriftAmount: 0.6,
    birdCount: 18,
    fogDensity: 0.0042,
  },

  district: {
    startHour: 7.0,
    dayLengthSeconds: 360, // real seconds per full 24h cycle
    fogDensity: 0.0055,
    worldBounds: { minX: -128, maxX: 140, minZ: -128, maxZ: 108 },
    autosaveSeconds: 10,
  },

  hero: {
    name: 'Marcus Valerius Corvinus',
    title: 'Marshal of Rome',
    age: 29,
    walkSpeed: 4.0,
    runSpeed: 7.2,
    horseSpeed: 9.5,
    horseGallopSpeed: 17,
    turnSpeed: 10,
    horseTurnSpeed: 3.2,
    radius: 0.45,
    horseRadius: 0.9,
    mountRange: 7,
  },

  camera: {
    fov: 58,
    distance: 6.5,
    mountedDistance: 9,
    minDistance: 2.5,
    maxDistance: 18,
    mouseSensitivity: 0.0024,
    minPitch: -0.25,
    maxPitch: 1.15,
  },

  audio: {
    master: 0.8,
    music: 0.35,
    ambience: 0.7,
    sfx: 0.8,
  },

  intro: {
    text: 'Rome at its height. But someone wants war.',
    durationMs: 7000,
  },

  palette: {
    marble: 0xeee6d6,
    travertine: 0xd9c8a6,
    stucco: 0xe8d4b0,
    ochre: 0xd4a464,
    terracotta: 0xb4553a,
    roofTile: 0xa8482e,
    brick: 0xb0684a,
    basalt: 0x5a5550,
    paving: 0xc9b896,
    bronze: 0x8a6a3a,
    grass: 0x8a9a52,
    dryGrass: 0xb5a466,
    cypress: 0x2f4a2a,
    pine: 0x4a6a35,
    wood: 0x6b4a2e,
    dark: 0x2a1f18,
    water: 0x3f7f8f,
    imperialRed: 0x9a1f1a,
    gold: 0xd8b25a,
  },
};

const STORAGE_KEY = 'aeterna.settings.v1';

export const DEFAULT_SETTINGS = {
  quality: 'high',
  showFps: true,
  muted: false,
  master: CONFIG.audio.master,
  music: CONFIG.audio.music,
  ambience: CONFIG.audio.ambience,
  mouseSensitivity: 1.0,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function qualityPreset(settings) {
  return CONFIG.qualityPresets[settings.quality] || CONFIG.qualityPresets.high;
}

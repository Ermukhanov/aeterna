# AETERNA — 3D Historical Strategy Prototype (Three.js + Vite)

Browser-based 3D prototype set in an alternate-history Roman Empire at its peak, featuring **Marcus Valerius Corvinus** (29-year-old Marshal of Rome).

## Quick Start

```bash
cd aeterna
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173/`) in any modern browser.

To create a production build:

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
| --- | --- |
| **W / A / S / D** or **Arrow Keys** | Walk / steer warhorse |
| **Shift** | Sprint (on foot) / Gallop (mounted) |
| **E** | Mount / dismount warhorse (when within 7 m) |
| **Mouse (click to lock or drag)** | Third-person camera orbit |
| **Mouse Wheel** | Camera zoom in / out |
| **Time Slider (bottom HUD)** | Scrub day/night cycle (`00:00` – `24:00`) |
| **P** | Open Province Map |
| **M** | Mute / unmute all audio |
| **ESC** | Release mouse pointer / return from map |

## Scenes

1. **Lobby (`src/scenes/LobbyScene.js`)** — Dawn terrace of a Roman villa overlooking Rome, with travertine balustrade, columns, smoking bronze brazier, wheeling birds, rising chimney smoke, and distant silhouettes of the Colosseum, Forum temples, and aqueduct. Menu buttons: *Continue*, *New Campaign*, *Province Map*, *Settings*.
2. **Rome District (`src/scenes/RomeDistrictScene.js`)** — Playable third-person district with:
   - **Forum Romanum** (Temple of Jupiter Optimus Maximus, Speaker's Rostra, Victory Column, Basilica porticoes, Triumphal Arch)
   - **Senate Building (Curia Julia)**
   - **Public Baths (Thermae)** with vaulted halls, domed rotunda, steaming hypocaust chimneys, and outdoor *natatio* swimming pool
   - **Market Street (Via Mercatoria)** with fabric-awning stalls, amphorae, and multi-story *insulae*
   - **Colosseum Exterior (Amphitheatrum Flavium)** with tiered travertine arcades
   - **Crowd of 30–50 autonomous Roman citizens** walking path loops (rendered in 2 instanced draw calls)
   - **Day/Night cycle** with interactive time slider and night-time street braziers
3. **Province Map (`src/scenes/ProvinceMapScene.js`)** — Clickable 2D parchment map of Roman provinces around *Mare Nostrum*.

## Folder Structure

```text
src/
  main.js                  Renderer bootstrap, main loop, quality application
  config.js                Tweakable parameters, color palette, quality presets
  styles.css               Cinzel / Cormorant Garamond Roman UI styling
  core/
    SceneManager.js        Lazy scene registration, caching & fade transitions
    Input.js               Keyboard + pointer-lock / drag mouse input
    Batcher.js             Spatial-bucketed static geometry merger for low draw calls
    Colliders.js           Spatial-hashed 2D AABB & ellipse collision solver
  scenes/
    LobbyScene.js          Villa terrace main menu scene
    RomeDistrictScene.js   Walkable & rideable Rome district prototype
    ProvinceMapScene.js    Clickable 2D Roman Empire province map
  entities/
    SkyRig.js              Golden-hour sky shader dome, sun arc & exponential fog
    Buildings.js           Procedural Forum, Senate, Baths, Market & Colosseum
    Hero.js                Marcus Valerius Corvinus low-poly articulated model
    Horse.js               Mountable Roman cavalry warhorse
    Crowd.js / NPC.js      Instanced crowd of 30–50 citizens on waypoint loops
    Birds.js               Instanced flapping bird flock
    Smoke.js               Instanced rising chimney & brazier smoke puffs
  ui/
    Splash.js              Click-to-enter audio unlock screen
    Menu.js                Lobby menu & localStorage save helpers
    HUD.js                 District HUD, landmark indicator & time-of-day slider
    IntroOverlay.js        "Rome at its height. But someone wants war." overlay
    Settings.js            Quality preset, FPS & volume modal
    MuteButton.js          Persistent top-right mute button
    FpsCounter.js          Live FPS, draw-call & triangle counter
  audio/
    AudioManager.js        WebAudio synthesized buccina horn, crowd murmur,
                           market chatter, temple bells & modal lyre loop
```

## Asset & Licensing Notes

All geometry and audio in this prototype are **100% procedural** (zero external asset downloads), ensuring instant startup and complete CC0 / public-domain compliance. You can drop additional CC0 `.glb` models from **Kenney** or **Poly Haven** into `public/assets/` if desired.

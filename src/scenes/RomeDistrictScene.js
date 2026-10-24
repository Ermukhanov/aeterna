import * as THREE from 'three';
import { CONFIG, qualityPreset } from '../config.js';
import { Colliders } from '../core/Colliders.js';
import { SkyRig } from '../entities/SkyRig.js';
import { SmokeSystem } from '../entities/Smoke.js';
import { Birds } from '../entities/Birds.js';
import { buildRomeDistrict } from '../entities/Buildings.js';
import { Hero } from '../entities/Hero.js';
import { Horse } from '../entities/Horse.js';
import { Crowd } from '../entities/Crowd.js';
import { DistrictHUD } from '../ui/HUD.js';
import { showIntroOverlay } from '../ui/IntroOverlay.js';
import { loadSavedGame, writeSavedGame } from '../ui/Menu.js';

/**
 * SCENE 2 — ROME DISTRICT (Playable Prototype)
 * Walkable Roman district containing:
 *  - Forum Romanum & Temple of Jupiter
 *  - Senate Building (Curia Julia)
 *  - Public Baths (Thermae)
 *  - Market Street (Via Mercatoria)
 *  - Colosseum Exterior (Amphitheatrum Flavium)
 * Features:
 *  - Hero Marcus Valerius Corvinus with third-person orbit camera & WASD movement
 *  - Warhorse mount/dismount toggle (E)
 *  - Crowd of 30–50 autonomous Roman citizens on paths
 *  - Full day/night cycle with interactive time slider & night braziers
 */
export class RomeDistrictScene {
  constructor(ctx) {
    this.ctx = ctx;
    this.is3D = true;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      0.25,
      550,
    );

    this.colliders = new Colliders(16);
    this.hour = CONFIG.district.startHour;
    this.timePaused = false;
    this.autosaveTimer = 0;

    // Sky, sun & warm golden-hour fog
    this.sky = new SkyRig(this.scene, {
      fogDensity: CONFIG.district.fogDensity,
      shadowRadius: CONFIG.render.shadowRadius,
    });

    // Static procedural architecture
    const { group, smokeOrigins, torchPositions, landmarks } = buildRomeDistrict(this.colliders);
    this.scene.add(group);
    this.landmarks = landmarks;

    // Chimney & bath steam/smoke + birds wheeling above the Colosseum
    this.smoke = new SmokeSystem(smokeOrigins, 6);
    this.scene.add(this.smoke.mesh);
    this.birds = new Birds(20, new THREE.Vector3(45, 28, -5), 55);
    this.scene.add(this.birds.group);

    // Night-time brazier warm lights + flame meshes
    this._buildNightBraziers(torchPositions);

    // Hero & Warhorse
    this.hero = new Hero();
    this.scene.add(this.hero.group);
    this.horse = new Horse(1.8, 42.5);
    this.scene.add(this.horse.group);

    // Crowd of 30–50 NPCs
    this.crowd = new Crowd(50);
    this.crowd.setCount(qualityPreset(this.ctx.settings).crowd);
    this.scene.add(this.crowd.group);

    // Third-person camera state
    this.camYaw = Math.PI; // looking north toward the Forum arch
    this.camPitch = 0.28;
    this.camDist = CONFIG.camera.distance;
    this.camTarget = new THREE.Vector3();
  }

  _buildNightBraziers(positions) {
    this.flames = [];
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9a36 });
    const flameGeo = new THREE.ConeGeometry(0.32, 0.75, 6);
    for (const [x, y, z] of positions) {
      const m = new THREE.Mesh(flameGeo, flameMat);
      m.position.set(x, y, z);
      this.scene.add(m);
      this.flames.push(m);
    }
    // 4 pooled warm point lights at key plazas (Forum, Senate, Market, Colosseum)
    const keyCoords = [
      [0, 3.8, 25],
      [20, 3.8, -18],
      [-36, 3.8, 24],
      [41, 3.8, 16],
    ];
    this.nightLights = keyCoords.map(([x, y, z]) => {
      const l = new THREE.PointLight(0xff8c3b, 0, 28, 1.6);
      l.position.set(x, y, z);
      this.scene.add(l);
      return l;
    });
  }

  enter({ mode = 'new' } = {}) {
    this.ctx.input.pointerLockEnabled = true;
    this.ctx.audio.setSceneMode('district');

    const saved = mode === 'continue' ? loadSavedGame() : null;
    if (saved) {
      this.hero.position.set(saved.x ?? 0, 0, saved.z ?? 46);
      this.hero.heading = saved.heading ?? Math.PI;
      this.horse.position.set(saved.hx ?? 5.5, 0, saved.hz ?? 43);
      this.hour = saved.hour ?? CONFIG.district.startHour;
      if (saved.mounted) this._setMounted(true);
      else this._setMounted(false);
    } else {
      this._setMounted(false);
      this.hero.position.set(0, 0, 46);
      this.hero.heading = Math.PI; // facing north toward the Forum Triumphal Arch
      this.horse.position.set(1.8, 0, 42.5);
      this.horse.heading = Math.PI;
      this.hour = CONFIG.district.startHour;
      this.camYaw = 0;
    }

    this.hud = new DistrictHUD(this.ctx, this);
    if (mode === 'new' || !saved) {
      showIntroOverlay(this.ctx.ui);
    }
    this.setHour(this.hour);
    this._updateCamera(1);
  }

  exit() {
    this.saveProgress();
    this.ctx.input.pointerLockEnabled = false;
    this.ctx.input.releasePointer();
  }

  saveProgress() {
    writeSavedGame({
      x: this.hero.position.x,
      z: this.hero.position.z,
      heading: this.hero.heading,
      hx: this.horse.position.x,
      hz: this.horse.position.z,
      mounted: this.hero.mounted,
      hour: this.hour,
    });
  }

  applyQuality(q) {
    this.crowd.setCount(q.crowd);
    this.camera.far = q.drawDistance + 140;
    this.camera.updateProjectionMatrix();
    this.sky.sun.shadow.mapSize.set(q.shadowMapSize, q.shadowMapSize);
    this.sky.sun.shadow.map?.dispose();
    this.sky.sun.shadow.map = null;
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setHour(h) {
    this.hour = ((h % 24) + 24) % 24;
    this.sky.setHour(this.hour, this.hero.position);
    const isNight = this.hour < 6.0 || this.hour > 18.4;
    const nightAmt = isNight ? 1 : 0;
    for (const l of this.nightLights) l.intensity = nightAmt * 18;
    for (const f of this.flames) f.visible = isNight;
  }

  _setMounted(flag) {
    this.hero.mounted = flag;
    if (flag) {
      this.camDist = CONFIG.camera.mountedDistance;
      this.hero.position.copy(this.horse.position);
      this.hero.heading = this.horse.heading;
    } else {
      this.camDist = CONFIG.camera.distance;
      // Step off to the left of the horse
      this.hero.position.set(
        this.horse.position.x + Math.cos(this.horse.heading) * 1.6,
        0,
        this.horse.position.z - Math.sin(this.horse.heading) * 1.6,
      );
      this.colliders.resolve(this.hero.position, CONFIG.hero.radius);
      this.horse.speed = 0;
    }
  }

  _toggleMount() {
    if (this.hero.mounted) {
      this.ctx.audio.playClick();
      this._setMounted(false);
      return;
    }
    const d = Math.hypot(
      this.hero.position.x - this.horse.position.x,
      this.hero.position.z - this.horse.position.z,
    );
    if (d <= CONFIG.hero.mountRange) {
      this.ctx.audio.playClick();
      this._setMounted(true);
    }
  }

  _currentLandmarkName() {
    const x = this.hero.position.x, z = this.hero.position.z;
    for (const lm of this.landmarks) {
      if (Math.hypot(x - lm.x, z - lm.z) <= lm.r) return lm.name;
    }
    return 'Rome · Imperial District';
  }

  update(dt) {
    const input = this.ctx.input;

    // Hotkeys
    if (input.wasPressed('KeyE')) this._toggleMount();
    if (input.wasPressed('KeyP')) {
      this.ctx.manager.go('map', { from: 'district' });
      return;
    }

    // Day/night progression
    if (!this.timePaused) {
      this.setHour(this.hour + (dt * 24) / CONFIG.district.dayLengthSeconds);
    } else {
      this.sky.setHour(this.hour, this.hero.position);
    }

    // Camera look
    const sens = CONFIG.camera.mouseSensitivity * (this.ctx.settings.mouseSensitivity ?? 1);
    this.camYaw -= input.mouseDX * sens;
    this.camPitch = THREE.MathUtils.clamp(
      this.camPitch + input.mouseDY * sens,
      CONFIG.camera.minPitch,
      CONFIG.camera.maxPitch,
    );
    if (input.wheel !== 0) {
      this.camDist = THREE.MathUtils.clamp(
        this.camDist + input.wheel * 0.9,
        CONFIG.camera.minDistance,
        CONFIG.camera.maxDistance,
      );
    }

    // WASD movement relative to camera yaw
    const fwd = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) -
                (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0);
    const str = (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0) -
                (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0);
    const sprint = input.down('ShiftLeft') || input.down('ShiftRight');

    const len = Math.hypot(fwd, str);
    if (len > 0) {
      // Camera looks along (-sin(camYaw), -cos(camYaw))
      const moveAngle = this.camYaw + Math.atan2(str, -fwd);
      const dx = Math.sin(moveAngle);
      const dz = Math.cos(moveAngle);

      const maxSpeed = this.hero.mounted
        ? sprint ? CONFIG.hero.horseGallopSpeed : CONFIG.hero.horseSpeed
        : sprint ? CONFIG.hero.runSpeed : CONFIG.hero.walkSpeed;

      const active = this.hero.mounted ? this.horse : this.hero;
      active.speed = maxSpeed;

      // Smooth angular turn toward movement vector
      let diff = ((moveAngle - active.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const turnRate = this.hero.mounted ? CONFIG.hero.horseTurnSpeed * 2.2 : CONFIG.hero.turnSpeed;
      active.heading += diff * Math.min(1, dt * turnRate);

      active.position.x += dx * maxSpeed * dt;
      active.position.z += dz * maxSpeed * dt;

      const B = CONFIG.district.worldBounds;
      active.position.x = THREE.MathUtils.clamp(active.position.x, B.minX, B.maxX);
      active.position.z = THREE.MathUtils.clamp(active.position.z, B.minZ, B.maxZ);
      this.colliders.resolve(
        active.position,
        this.hero.mounted ? CONFIG.hero.horseRadius : CONFIG.hero.radius,
      );
    } else {
      this.hero.speed = 0;
      this.horse.speed = 0;
    }

    if (this.hero.mounted) {
      this.hero.position.copy(this.horse.position);
      this.hero.heading = this.horse.heading;
      this.hero.speed = this.horse.speed;
    }

    const onStep = (mounted) => this.ctx.audio.playStep(mounted);
    this.hero.updateAnimation(dt, onStep);
    this.horse.update(dt, this.hero.mounted ? onStep : null);

    // Crowd, smoke & birds
    this.crowd.update(dt, this.hero.position);
    this.smoke.update(dt);
    this.birds.update(dt);

    this._updateCamera(dt);

    // HUD & contextual horse prompt
    const horseDist = Math.hypot(
      this.hero.position.x - this.horse.position.x,
      this.hero.position.z - this.horse.position.z,
    );
    let prompt = '';
    if (!this.hero.mounted && horseDist <= CONFIG.hero.mountRange) {
      prompt = 'Press <b>E</b> to mount Warhorse';
    } else if (this.hero.mounted) {
      prompt = 'Press <b>E</b> to dismount';
    }
    this.hud?.update(this.hour, this.hero.mounted, this._currentLandmarkName(), prompt);

    this.autosaveTimer += dt;
    if (this.autosaveTimer > CONFIG.district.autosaveSeconds) {
      this.autosaveTimer = 0;
      this.saveProgress();
    }
  }

  _updateCamera(dt) {
    const targetY = this.hero.mounted ? 2.35 : 1.65;
    this.camTarget.set(this.hero.position.x, targetY, this.hero.position.z);

    const horiz = Math.cos(this.camPitch) * this.camDist;
    const vert = Math.sin(this.camPitch) * this.camDist;
    const ox = Math.sin(this.camYaw) * horiz;
    const oz = Math.cos(this.camYaw) * horiz;

    // Pull camera in if a building blocks the line of sight
    let frac = 1.0;
    for (let s = 0.25; s <= 1.0; s += 0.15) {
      const tx = this.camTarget.x + ox * s;
      const ty = Math.max(0.5, this.camTarget.y + vert * s);
      const tz = this.camTarget.z + oz * s;
      if (this.colliders.pointBlocked(tx, ty, tz)) {
        frac = Math.max(0.22, s - 0.15);
        break;
      }
    }

    const desiredX = this.camTarget.x + ox * frac;
    const desiredY = Math.max(0.6, this.camTarget.y + vert * frac);
    const desiredZ = this.camTarget.z + oz * frac;

    const k = Math.min(1, dt * 14);
    this.camera.position.lerp(new THREE.Vector3(desiredX, desiredY, desiredZ), k);
    this.camera.lookAt(this.camTarget);
  }
}

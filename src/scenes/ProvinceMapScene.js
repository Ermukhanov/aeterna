/**
 * SCENE 3 — PROVINCE MAP (stub)
 * Stylised 2D parchment map of the Roman Empire at its peak.
 * Clickable provinces display their Latin & English names and garrison status.
 */
const PROVINCES = [
  {
    id: 'italia',
    name: 'ITALIA',
    sub: 'Heart of the Empire · Rome',
    pts: [[445, 250], [492, 245], [525, 295], [552, 355], [530, 395], [500, 360], [472, 310], [448, 280]],
  },
  {
    id: 'gallia',
    name: 'GALLIA',
    sub: 'Lugdunensis & Belgica · 3 Legions',
    pts: [[320, 170], [420, 155], [450, 225], [420, 265], [335, 255], [305, 215]],
  },
  {
    id: 'hispania',
    name: 'HISPANIA',
    sub: 'Tarraconensis & Baetica · 2 Legions',
    pts: [[185, 265], [315, 258], [322, 355], [205, 372], [170, 320]],
  },
  {
    id: 'britannia',
    name: 'BRITANNIA',
    sub: 'Northern Frontier · Hadrianic Line',
    pts: [[295, 72], [358, 78], [372, 145], [302, 152]],
  },
  {
    id: 'germania',
    name: 'GERMANIA',
    sub: 'Superior & Inferior · Rhine Watch',
    pts: [[425, 130], [510, 125], [518, 210], [452, 222]],
  },
  {
    id: 'illyricum',
    name: 'ILLYRICUM & PANNONIA',
    sub: 'Danubian Shield · 4 Legions',
    pts: [[520, 215], [625, 210], [635, 295], [545, 305]],
  },
  {
    id: 'dacia',
    name: 'DACIA',
    sub: 'Carpathian Gold Mines · 2 Legions',
    pts: [[630, 185], [720, 185], [728, 258], [638, 262]],
  },
  {
    id: 'macedonia',
    name: 'MACEDONIA & ACHAIA',
    sub: 'Hellenic Provinces · Corinth',
    pts: [[575, 305], [665, 302], [660, 405], [585, 412]],
  },
  {
    id: 'asia',
    name: 'ASIA & BITHYNIA',
    sub: 'Anatolian Heartland · Ephesus',
    pts: [[685, 295], [835, 285], [845, 375], [692, 382]],
  },
  {
    id: 'syria',
    name: 'SYRIA PALAESTINA',
    sub: 'Eastern Marches · Antioch · 4 Legions',
    pts: [[842, 325], [935, 325], [925, 455], [838, 445]],
  },
  {
    id: 'aegyptus',
    name: 'AEGYPTUS',
    sub: 'Granary of Rome · Alexandria',
    pts: [[700, 455], [845, 452], [860, 560], [695, 560]],
  },
  {
    id: 'africa',
    name: 'AFRICA PROCONSULARIS',
    sub: 'Carthage & Numidia · 1 Legion',
    pts: [[375, 405], [555, 415], [685, 455], [685, 545], [365, 535]],
  },
  {
    id: 'mauretania',
    name: 'MAURETANIA',
    sub: 'Western Atlas · Tingitana',
    pts: [[195, 395], [368, 405], [360, 520], [185, 510]],
  },
];

function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function centroid(pts) {
  let x = 0, y = 0;
  for (const [px, py] of pts) {
    x += px;
    y += py;
  }
  return [x / pts.length, y / pts.length];
}

export class ProvinceMapScene {
  constructor(ctx) {
    this.ctx = ctx;
    this.is3D = false;
    this.hovered = null;
    this.selected = PROVINCES[0];
    this.from = 'lobby';
  }

  enter({ from = 'lobby' } = {}) {
    this.from = from;
    this.ctx.input.pointerLockEnabled = false;
    this.ctx.input.releasePointer();
    this.ctx.audio.setSceneMode('map');

    const wrap = document.createElement('div');
    wrap.className = 'map-wrap';
    wrap.innerHTML = `
      <div class="map-header">
        <h2>IMPERIUM ROMANUM · PROVINCIAE</h2>
        <p>Click a province to inspect · Mare Nostrum</p>
      </div>
      <button class="btn map-back">← Return</button>
      <canvas width="1060" height="600"></canvas>
      <div class="panel map-info"></div>
    `;
    this.ctx.ui.appendChild(wrap);

    this.canvas = wrap.querySelector('canvas');
    this.c2d = this.canvas.getContext('2d');
    this.infoEl = wrap.querySelector('.map-info');

    wrap.querySelector('.map-back').addEventListener('click', () => {
      this.ctx.audio.playClick();
      this.ctx.manager.go(this.from);
    });

    const toCanvasCoords = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return [
        ((e.clientX - r.left) / r.width) * this.canvas.width,
        ((e.clientY - r.top) / r.height) * this.canvas.height,
      ];
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const [x, y] = toCanvasCoords(e);
      const hit = PROVINCES.find((p) => pointInPoly(x, y, p.pts)) || null;
      if (hit !== this.hovered) {
        this.hovered = hit;
        this._draw();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const [x, y] = toCanvasCoords(e);
      const hit = PROVINCES.find((p) => pointInPoly(x, y, p.pts));
      if (hit) {
        this.selected = hit;
        this.ctx.audio.playClick();
        this._updateInfo();
        this._draw();
      }
    });

    this._updateInfo();
    this._draw();
  }

  _updateInfo() {
    const p = this.selected;
    this.infoEl.innerHTML = p
      ? `${p.name}<small>${p.sub}</small>`
      : `SELECT A PROVINCE<small>Click any territory on the map</small>`;
  }

  _draw() {
    const ctx = this.c2d;
    const W = this.canvas.width, H = this.canvas.height;

    // Aged sea parchment background
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 60, W * 0.5, H * 0.5, W * 0.65);
    g.addColorStop(0, '#c8b282');
    g.addColorStop(1, '#8c7248');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Subtle latitude/longitude graticule lines
    ctx.strokeStyle = 'rgba(60, 40, 18, 0.16)';
    ctx.lineWidth = 1;
    for (let x = 100; x < W; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 100; y < H; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Sea label
    ctx.fillStyle = 'rgba(55, 38, 20, 0.42)';
    ctx.font = 'italic 22px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('M A R E   N O S T R U M', 515, 385);

    // Provinces
    for (const p of PROVINCES) {
      const isSel = this.selected === p;
      const isHov = this.hovered === p;
      ctx.beginPath();
      p.pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();

      ctx.fillStyle = isSel
        ? '#9e2b22'
        : isHov
          ? '#dfc48d'
          : '#e8d5a7';
      ctx.fill();

      ctx.lineWidth = isSel ? 2.6 : 1.5;
      ctx.strokeStyle = isSel ? '#f7dc8a' : '#4a3219';
      ctx.stroke();

      const [cx, cy] = centroid(p.pts);
      ctx.fillStyle = isSel ? '#fff4d2' : '#2b1b0e';
      ctx.font = '600 13px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, cx, cy + 4);
    }

    // Star marker on Rome
    ctx.fillStyle = '#ffd86b';
    ctx.strokeStyle = '#3a1a08';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(482, 292, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  exit() {}

  update() {
    if (this.ctx.input.wasPressed('Escape')) {
      this.ctx.manager.go(this.from);
    }
  }
}

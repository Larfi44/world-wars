// ============================================================
//  GRAND STRATEGY – WW1 & WW2 EUROPE
//  World Wars Tactical Grand Strategy Game
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ========== STATE ==========
let gameState = 'menu';
let scenario = 1;
let playerCountry = null;
let difficulty = 'normal';
let paused = false;
let wasPausedBeforeDiplo = false;
let lastFrameTime = 0;
let diplomacyTimer = 0;
let aiTimer = 0;
let gameTime = 0;
let spectatorMode = false;
let explorationMode = true;

// WW2 historical triggers
let ww2FranceUKAttacked = false;
let ww2ItalyAttacked = false;
let ww2USSRattackedPoland = false;
let ww2GermanyAttackedUSSR = false;
let ww2FranceUKAttackTime = 0;

// ========== CONSTANTS ==========
const MAP_W = 2400;
const MAP_H = 1700;
const CELL = 10;
const COLS = Math.floor(MAP_W / CELL);
const ROWS = Math.floor(MAP_H / CELL);

let camera = { x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tz: 0.55 };
let grid = [];
let mapCanvas = document.createElement('canvas');
let mapCtx = mapCanvas.getContext('2d');
mapCanvas.width = MAP_W;
mapCanvas.height = MAP_H;
let mapDirty = true;

// ========== COUNTRY DEFINITIONS ==========
const allCountryDefs = [
  { id: 0, name: 'France', color: '#2563eb' },
  { id: 1, name: 'UK', color: '#0891b2' },
  { id: 2, name: 'Germany', color: '#d97706' },
  { id: 3, name: 'Russia', color: '#dc2626' },
  { id: 4, name: 'Italy', color: '#16a34a' },
  { id: 5, name: 'Poland', color: '#9333ea' },
  { id: 6, name: 'Spain', color: '#eab308' },
  { id: 7, name: 'Sweden', color: '#3b82f6' },
  { id: 8, name: 'Norway', color: '#ef4444' },
  { id: 9, name: 'Yugoslavia', color: '#f97316' },
  { id: 10, name: 'Austria-Hungary', color: '#b8860b' },
  { id: 11, name: 'Ottoman Empire', color: '#800000' },
];

let countries = [];
let rels = [];
let activeCountries = [];

// ========== FLAG IMAGES ==========
const flagImages = {};
const flagMap = {
  0: { 1: 'flags/france.jpg', 3: 'flags/france.jpg' }, // France
  1: { 1: 'flags/britain.png', 3: 'flags/britain.png' }, // UK
  2: { 1: 'flags/nazi.png', 2: 'flags/nazi.png', 3: 'flags/german_empire.jpg' }, // Germany
  3: {
    1: 'flags/ussr.png',
    2: 'flags/ussr.png',
    3: 'flags/russian_empire.png',
  }, // Russia/USSR
  4: { 1: 'flags/fascist_italy.jpg', 3: 'flags/italy.png' }, // Italy
  6: { 1: 'flags/spain.png', 3: 'flags/spain.png' }, // Spain
  9: { 1: 'flags/yugoslavia.png', 3: 'flags/yugoslavia.png' }, // Yugoslavia
  10: { 3: 'flags/austro-hungria.png' }, // Austria-Hungary
  11: { 3: 'flags/osman_empire.jpg' }, // Ottoman Empire
};

function getFlagPath(cid) {
  if (flagMap[cid] && flagMap[cid][scenario]) return flagMap[cid][scenario];
  // fallback: try any scenario
  if (flagMap[cid]) {
    const keys = Object.keys(flagMap[cid]);
    if (keys.length) return flagMap[cid][keys[0]];
  }
  return null;
}

function loadFlags() {
  const toLoad = new Set();
  for (const cid in flagMap) {
    for (const s in flagMap[cid]) {
      toLoad.add(flagMap[cid][s]);
    }
  }
  for (const path of toLoad) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = path;
    flagImages[path] = img;
  }
}
loadFlags();

// ========== SEA POLYGONS ==========
const seaPolys = [
  // Atlantic Ocean (west of Europe)
  [
    [0, 0],
    [200, 0],
    [200, 200],
    [160, 340],
    [130, 480],
    [100, 600],
    [50, 750],
    [0, 850],
  ],
  // Atlantic Ocean (SW)
  [
    [0, 850],
    [100, 820],
    [180, 900],
    [220, 1020],
    [260, 1100],
    [200, 1250],
    [120, 1350],
    [0, 1400],
  ],
  // North Sea
  [
    [200, 0],
    [560, 0],
    [560, 80],
    [500, 160],
    [420, 200],
    [360, 240],
    [280, 260],
    [200, 240],
    [180, 200],
    [170, 160],
    [180, 100],
  ],
  // Baltic Sea
  [
    [860, 100],
    [1020, 80],
    [1120, 100],
    [1180, 160],
    [1160, 260],
    [1080, 340],
    [960, 380],
    [860, 360],
    [820, 300],
    [800, 220],
    [820, 140],
  ],
  // Mediterranean Sea
  [
    [220, 850],
    [340, 840],
    [440, 850],
    [540, 880],
    [620, 880],
    [700, 840],
    [800, 820],
    [900, 820],
    [1000, 840],
    [1100, 880],
    [1200, 960],
    [1300, 1060],
    [1360, 1140],
    [1300, 1200],
    [1200, 1300],
    [1100, 1360],
    [1000, 1400],
    [900, 1440],
    [780, 1460],
    [660, 1480],
    [540, 1460],
    [420, 1420],
    [320, 1350],
    [240, 1260],
    [200, 1160],
    [180, 1050],
    [200, 960],
  ],
  // Black Sea
  [
    [1500, 700],
    [1660, 680],
    [1780, 720],
    [1840, 780],
    [1860, 860],
    [1820, 940],
    [1740, 1000],
    [1640, 1020],
    [1540, 980],
    [1480, 920],
    [1460, 840],
    [1480, 760],
  ],
  // Adriatic Sea
  [
    [720, 900],
    [820, 880],
    [880, 920],
    [900, 1000],
    [880, 1080],
    [840, 1140],
    [760, 1160],
    [700, 1100],
    [680, 1020],
    [700, 960],
  ],
  // Aegean Sea
  [
    [1280, 1120],
    [1360, 1100],
    [1420, 1120],
    [1440, 1180],
    [1420, 1260],
    [1360, 1300],
    [1280, 1280],
    [1240, 1220],
    [1260, 1160],
  ],
  // Sea between UK and Ireland (west of UK)
  [
    [120, 180],
    [160, 200],
    [170, 240],
    [150, 280],
    [120, 300],
    [80, 280],
    [60, 240],
    [80, 200],
  ],
  // Caspian Sea
  [
    [1920, 660],
    [2000, 640],
    [2060, 660],
    [2080, 740],
    [2060, 820],
    [2000, 860],
    [1940, 840],
    [1900, 780],
    [1900, 720],
  ],
  // Gulf of Bothnia
  [
    [900, 60],
    [980, 40],
    [1040, 60],
    [1060, 120],
    [1000, 180],
    [940, 200],
    [880, 180],
    [860, 120],
  ],
];

const mountainPolys = [
  [
    [640, 550],
    [730, 510],
    [820, 536],
    [800, 640],
    [720, 670],
    [630, 620],
  ], // Alps
  [
    [400, 880],
    [480, 850],
    [520, 880],
    [490, 950],
    [420, 960],
    [380, 920],
  ], // Pyrenees
  [
    [780, 780],
    [820, 740],
    [870, 770],
    [860, 860],
    [820, 920],
    [770, 890],
  ], // Apennines
  [
    [620, 140],
    [700, 120],
    [760, 160],
    [740, 260],
    [660, 300],
    [600, 240],
  ], // Scandinavian mountains
  [
    [1100, 1060],
    [1180, 1020],
    [1240, 1060],
    [1200, 1160],
    [1120, 1180],
    [1060, 1120],
  ], // Balkans
  [
    [1700, 600],
    [1780, 560],
    [1840, 600],
    [1800, 680],
    [1720, 700],
    [1660, 660],
  ], // Urals
  [
    [1900, 200],
    [1940, 160],
    [1980, 200],
    [1960, 360],
    [1900, 400],
    [1860, 340],
  ], // Finland/Russia north
];

// ========== BORDERS ==========
const countryBorders = {
  France: [
    [360, 500],
    [440, 430],
    [560, 400],
    [680, 420],
    [760, 480],
    [780, 560],
    [760, 640],
    [680, 700],
    [590, 720],
    [490, 710],
    [400, 650],
    [370, 580],
    [350, 520],
  ],
  UK: [
    [160, 220],
    [280, 180],
    [360, 190],
    [400, 240],
    [410, 300],
    [380, 350],
    [310, 370],
    [240, 350],
    [190, 300],
    [170, 260],
  ],
  Germany: [
    [690, 390],
    [800, 340],
    [920, 330],
    [1010, 370],
    [1050, 430],
    [1040, 530],
    [970, 600],
    [870, 630],
    [770, 610],
    [700, 550],
    [680, 490],
    [685, 430],
  ],
  Poland: [
    [1030, 400],
    [1140, 370],
    [1260, 380],
    [1320, 430],
    [1330, 510],
    [1270, 600],
    [1170, 630],
    [1070, 610],
    [1010, 530],
    [990, 460],
  ],
  Russia: [
    [1300, 340],
    [1480, 280],
    [1660, 290],
    [1820, 330],
    [1940, 380],
    [2000, 500],
    [2020, 640],
    [1960, 820],
    [1840, 980],
    [1680, 1060],
    [1500, 1070],
    [1340, 1010],
    [1240, 880],
    [1170, 720],
    [1190, 570],
    [1240, 430],
  ],
  Italy: [
    [660, 760],
    [760, 720],
    [840, 730],
    [900, 780],
    [910, 880],
    [880, 990],
    [820, 1060],
    [740, 1080],
    [680, 1030],
    [630, 940],
    [620, 840],
  ],
  Spain: [
    [340, 880],
    [400, 840],
    [480, 830],
    [540, 860],
    [560, 900],
    [550, 980],
    [500, 1060],
    [420, 1100],
    [340, 1120],
    [260, 1100],
    [190, 1050],
    [170, 980],
    [200, 920],
    [260, 890],
  ],
  Sweden: [
    [760, 160],
    [920, 120],
    [1060, 150],
    [1120, 220],
    [1080, 350],
    [960, 440],
    [820, 430],
    [740, 350],
    [710, 240],
  ],
  Norway: [
    [560, 100],
    [700, 60],
    [860, 70],
    [980, 120],
    [1000, 240],
    [920, 340],
    [780, 400],
    [640, 360],
    [560, 240],
    [520, 160],
  ],
  Yugoslavia: [
    [840, 1100],
    [980, 1060],
    [1100, 1090],
    [1160, 1160],
    [1140, 1260],
    [1040, 1320],
    [920, 1300],
    [840, 1220],
  ],
  'Austria-Hungary': [
    [720, 600],
    [820, 560],
    [920, 580],
    [980, 620],
    [1020, 680],
    [1040, 760],
    [1000, 840],
    [920, 900],
    [840, 920],
    [760, 900],
    [700, 840],
    [680, 760],
    [680, 680],
  ],
  'Ottoman Empire': [
    [1100, 1100],
    [1200, 1060],
    [1300, 1080],
    [1360, 1140],
    [1380, 1240],
    [1340, 1340],
    [1240, 1400],
    [1140, 1380],
    [1060, 1320],
    [1020, 1220],
    [1040, 1140],
  ],
};

// ========== CITIES ==========
let cities = [];
let armies = [];
let selArmy = null;
let selArmies = new Set();
let lastCity = null;
let lastArmy = null;

// ========== TOUCH STATE ==========
let touchState = {
  touches: [],
  startTime: 0,
  startPos: null,
  moved: false,
  isPanning: false,
  isPinching: false,
  panStart: { x: 0, y: 0, cx: 0, cy: 0 },
  lastPinchDist: 0,
};

// ========== CLASSES ==========
class City {
  constructor(id, name, cid, x, y) {
    this.id = id;
    this.name = name;
    this.cid = cid;
    this.x = x;
    this.y = y;
    this.lvl = 1;
    this.inc = 10;
  }
  get income() {
    return this.inc * this.lvl;
  }
  upgrade() {
    if (this.lvl >= 3 || countries[this.cid].money < 100 * this.lvl)
      return false;
    countries[this.cid].money -= 100 * this.lvl;
    this.lvl++;
    this.inc += 8;
    return true;
  }
}

class Army {
  constructor(id, cid, x, y, str = 100, maxStr = 100) {
    this.id = id;
    this.cid = cid;
    this.x = x;
    this.y = y;
    this.str = str;
    this.maxStr = maxStr;
    this.morale = 100;
    this.ships = false;
    this.spd = 12;
    this.path = null;
    this.ctimer = 0;
    this.dead = false;
    this.knockX = 0;
    this.knockY = 0;
    this.garrison = false;
  }
  get size() {
    return 1.5 + (this.maxStr / 250) * 3;
  }
  get power() {
    return Math.floor(this.str * (this.morale / 100) * (this.maxStr / 100));
  }
  isSurrounded() {
    return false;
  }
  getEffectiveSpeed() {
    let spd = this.spd;
    const gx = Math.floor(this.x / CELL);
    const gy = Math.floor(this.y / CELL);
    const cell = grid[gy]?.[gx];
    if (cell?.terrain === 'mtn') spd *= 0.3;
    if (
      cell &&
      cell.owner !== -1 &&
      cell.owner !== this.cid &&
      atWar(this.cid, cell.owner)
    )
      spd *= 0.7;
    return spd;
  }
  getCombatModifier() {
    return 1.0;
  }
  upgrade() {
    if (countries[this.cid].money < 50 || this.maxStr >= 250) return false;
    countries[this.cid].money -= 50;
    this.maxStr = Math.min(250, this.maxStr + 50);
    this.str = Math.min(this.str + 50, this.maxStr);
    return true;
  }
}

// ========== UTILITY FUNCTIONS ==========
function inPoly(x, y, p) {
  if (!p || p.length < 3) return false;
  let i = false;
  for (let a = 0, b = p.length - 1; a < p.length; b = a++) {
    if (
      p[a][1] > y !== p[b][1] > y &&
      x < ((p[b][0] - p[a][0]) * (y - p[a][1])) / (p[b][1] - p[a][1]) + p[a][0]
    )
      i = !i;
  }
  return i;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getTerrain(x, y) {
  // Check sea first (sea takes priority)
  for (let sp of seaPolys) {
    if (inPoly(x, y, sp)) return 'sea';
  }
  for (let mp of mountainPolys) {
    if (inPoly(x, y, mp)) return 'mtn';
  }
  return 'land';
}

function isSea(x, y) {
  return getTerrain(x, y) === 'sea';
}

function getOwner(x, y) {
  // If it's sea, no owner
  if (isSea(x, y)) return -1;
  for (let c of activeCountries) {
    const b = countryBorders[c.name];
    if (b && inPoly(x, y, b)) return c.id;
  }
  return -1;
}

function atWar(a, b) {
  return rels[a] && rels[a][b] <= -50 && rels[a][b] !== 0;
}
function allied(a, b) {
  return rels[a] && rels[a][b] >= 50;
}

function canMove(army, gx, gy) {
  const c = grid[gy]?.[gx];
  if (!c) return false;
  // Cannot move into sea
  if (c.terrain === 'sea') return false;
  const o = c.owner;
  return (
    o === -1 || o === army.cid || allied(army.cid, o) || atWar(army.cid, o)
  );
}

// ========== PATHFINDING ==========
function findPath(army, tx, ty) {
  const sx = Math.floor(army.x / CELL);
  const sy = Math.floor(army.y / CELL);
  const ex = Math.floor(tx / CELL);
  const ey = Math.floor(ty / CELL);
  if (sx === ex && sy === ey) return null;

  const key = (x, y) => `${x},${y}`;
  const open = new Map();
  open.set(key(sx, sy), { x: sx, y: sy, g: 0, f: 0, p: null });
  const closed = new Set();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  let iterations = 0;

  while (open.size && iterations < 5000) {
    iterations++;
    let cur = [...open.values()].reduce((a, b) => (a.f < b.f ? a : b));
    if (cur.x === ex && cur.y === ey) {
      const path = [];
      let n = cur;
      while (n.p) {
        path.unshift({ x: n.x * CELL + CELL / 2, y: n.y * CELL + CELL / 2 });
        n = n.p;
      }
      return path;
    }
    open.delete(key(cur.x, cur.y));
    closed.add(key(cur.x, cur.y));
    for (let [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = key(nx, ny);
      if (closed.has(nk) || !canMove(army, nx, ny)) continue;
      const c = grid[ny][nx];
      let cost = 1;
      if (c.terrain === 'mtn') cost *= 4;
      const g = cur.g + cost;
      const f = g + Math.hypot(nx - ex, ny - ey);
      if (!open.has(nk) || g < open.get(nk).g) {
        open.set(nk, { x: nx, y: ny, g, f, p: cur });
      }
    }
  }
  return null;
}

// ========== GRID & MAP ==========
function initGrid() {
  grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      const wx = x * CELL + CELL / 2;
      const wy = y * CELL + CELL / 2;
      grid[y][x] = {
        terrain: getTerrain(wx, wy),
        owner: getOwner(wx, wy),
        occupier: null,
      };
    }
  }
}

function drawMap() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      let color;
      if (c.terrain === 'sea') {
        // Blue gradient based on depth (y position)
        const depthFactor = y / ROWS;
        const r = Math.floor(10 + depthFactor * 15);
        const g = Math.floor(40 + depthFactor * 30);
        const b = Math.floor(100 + depthFactor * 60);
        color = `rgb(${r},${g},${b})`;
      } else if (c.terrain === 'mtn') {
        color = '#5c4a3a';
      } else if (c.owner >= 0 && c.owner < countries.length) {
        const country = countries[c.owner];
        color = country.color;
        if (c.occupier !== null && c.occupier !== c.owner) {
          const bColor = countries[c.owner].color;
          const oColor = countries[c.occupier].color;
          color =
            '#' +
            [1, 3, 5]
              .map((i) =>
                Math.round(
                  (parseInt(bColor[i] + bColor[i + 1], 16) +
                    parseInt(oColor[i] + oColor[i + 1], 16)) /
                    2,
                )
                  .toString(16)
                  .padStart(2, '0'),
              )
              .join('');
        }
      } else {
        color = '#3a3528';
      }
      mapCtx.fillStyle = color;
      mapCtx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  // Draw wave lines on sea
  mapCtx.strokeStyle = 'rgba(255,255,255,0.04)';
  mapCtx.lineWidth = 1;
  for (let wy = 0; wy < ROWS; wy += 8) {
    for (let wx = 0; wx < COLS; wx += 6) {
      if (grid[wy]?.[wx]?.terrain === 'sea') {
        const px = wx * CELL;
        const py = wy * CELL;
        mapCtx.beginPath();
        mapCtx.arc(px, py, 3, 0, Math.PI * 2);
        mapCtx.stroke();
      }
    }
  }

  // Draw country borders
  mapCtx.strokeStyle = 'rgba(255,255,255,0.25)';
  mapCtx.lineWidth = 2;
  for (let c of activeCountries) {
    const b = countryBorders[c.name];
    if (!b) continue;
    mapCtx.beginPath();
    mapCtx.moveTo(b[0][0], b[0][1]);
    for (let i = 1; i < b.length; i++) mapCtx.lineTo(b[i][0], b[i][1]);
    mapCtx.closePath();
    mapCtx.stroke();
  }

  mapDirty = false;
}

function paint(army, r = 30) {
  const gx = Math.floor(army.x / CELL);
  const gy = Math.floor(army.y / CELL);
  const cr = Math.ceil(r / CELL);
  for (let dy = -cr; dy <= cr; dy++) {
    for (let dx = -cr; dx <= cr; dx++) {
      if (dx * dx + dy * dy > cr * cr) continue;
      const nx = gx + dx;
      const ny = gy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const c = grid[ny][nx];
      if (c.terrain === 'sea' || c.terrain === 'mtn') continue;
      if (c.owner !== -1 && c.owner !== army.cid && !atWar(army.cid, c.owner))
        continue;
      if (c.owner === army.cid) c.occupier = null;
      else if (c.owner !== -1) c.occupier = army.cid;
    }
  }
  mapDirty = true;
}

function captureCity(city, newO) {
  if (city.cid === newO) return;
  const oldO = city.cid;
  city.cid = newO;
  const remaining = cities.filter((c) => c.cid === oldO);
  if (remaining.length === 0 && oldO >= 0) {
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        if (grid[y][x].owner === oldO && !allied(newO, oldO)) {
          grid[y][x].owner = newO;
          grid[y][x].occupier = null;
        }
    for (let a of armies) if (a.cid === oldO) a.dead = true;
    tickerNotify(`${countries[newO].name} conquered ${countries[oldO].name}!`);
    activeCountries = activeCountries.filter((c) => c.id !== oldO);
  }
  mapDirty = true;
  notify(`${countries[newO].name} captured ${city.name}!`);
}

// ========== COMBAT ==========
function combat(a1, a2) {
  const bp1 = a1.power * (0.8 + Math.random() * 0.4);
  const bp2 = a2.power * (0.8 + Math.random() * 0.4);
  if (bp1 >= bp2) {
    a2.str -= Math.floor(bp1 * 0.6);
    a1.str -= Math.floor(bp2 * 0.2);
    a1.morale = Math.max(30, a1.morale - 2);
    a2.morale = Math.max(0, a2.morale - 30);
    a1.knockX += Math.cos(Math.atan2(a2.y - a1.y, a2.x - a1.x)) * 8;
    a1.knockY += Math.sin(Math.atan2(a2.y - a1.y, a2.x - a1.x)) * 8;
    a2.knockX -= Math.cos(Math.atan2(a2.y - a1.y, a2.x - a1.x)) * 20;
    a2.knockY -= Math.sin(Math.atan2(a2.y - a1.y, a2.x - a1.x)) * 20;
    if (a2.str <= 0) {
      a2.dead = true;
      a2.str = 0;
    }
  } else {
    a1.str -= Math.floor(bp2 * 0.6);
    a2.str -= Math.floor(bp1 * 0.2);
    a2.morale = Math.max(30, a2.morale - 2);
    a1.morale = Math.max(0, a1.morale - 30);
    a2.knockX += Math.cos(Math.atan2(a1.y - a2.y, a1.x - a2.x)) * 8;
    a2.knockY += Math.sin(Math.atan2(a1.y - a2.y, a1.x - a2.x)) * 8;
    a1.knockX -= Math.cos(Math.atan2(a1.y - a2.y, a1.x - a2.x)) * 20;
    a1.knockY -= Math.sin(Math.atan2(a1.y - a2.y, a1.x - a2.x)) * 20;
    if (a1.str <= 0) {
      a1.dead = true;
      a1.str = 0;
    }
  }
  a1.ctimer = 0.2;
  a2.ctimer = 0.2;
}

function combatUpdate() {
  const buckets = new Map();
  for (let a of armies) {
    if (a.dead) continue;
    const bx = Math.floor(a.x / 200);
    const by = Math.floor(a.y / 200);
    const key = `${bx},${by}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(a);
  }
  for (let [, list] of buckets) {
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.ctimer > 0) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead || b.ctimer > 0) continue;
        if (a.cid === b.cid || !atWar(a.cid, b.cid)) continue;
        if (dist(a.x, a.y, b.x, b.y) < a.size + b.size + 5) {
          combat(a, b);
        }
      }
    }
  }
}

function mergeArmies(ams) {
  if (ams.length < 2) return;
  const b = ams[0];
  let ts = b.str;
  let tm = b.maxStr;
  for (let i = 1; i < ams.length; i++) {
    ts += ams[i].str;
    tm += ams[i].maxStr;
    ams[i].dead = true;
  }
  b.str = Math.min(ts, 500);
  b.maxStr = Math.min(tm, 500);
  b.morale = Math.min(100, b.morale + 10);
  notify(`Merged! ${b.str}`);
}

function splitArmy(a) {
  if (a.str < 20) {
    notify('Too weak!');
    return;
  }
  const h = Math.floor(a.str / 2);
  const hm = Math.floor(a.maxStr / 2);
  a.str = h;
  a.maxStr = hm;
  armies.push(new Army(armies.length, a.cid, a.x + 12, a.y + 12, h, hm));
  notify('Army split!');
}

// ========== HELPER: check if army is visible to player ==========
function isArmyVisible(a) {
  if (!explorationMode) return true;
  if (a.cid === playerCountry || allied(playerCountry, a.cid)) return true;
  // Check distance to any of player's armies or cities
  const visRange = 300; // visibility range in pixels
  for (let pa of armies) {
    if (pa.dead || pa.cid !== playerCountry) continue;
    if (dist(pa.x, pa.y, a.x, a.y) < visRange) return true;
  }
  for (let pc of cities) {
    if (pc.cid !== playerCountry) continue;
    if (dist(pc.x, pc.y, a.x, a.y) < visRange) return true;
  }
  return false;
}

// ========== DRAWING ==========
function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Smooth camera
  camera.x += (camera.tx - camera.x) * 0.2;
  camera.y += (camera.ty - camera.y) * 0.2;
  camera.zoom += (camera.tz - camera.zoom) * 0.2;

  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  // Draw map
  if (mapDirty) drawMap();
  ctx.drawImage(mapCanvas, 0, 0);

  // Draw cities
  for (let c of cities) {
    const sz = 3 + c.lvl;
    ctx.beginPath();
    ctx.arc(c.x, c.y, sz, 0, Math.PI * 2);
    ctx.fillStyle = countries[c.cid]?.color || '#888';
    ctx.fill();
    ctx.strokeStyle = lastCity === c ? '#ff0' : '#fff';
    ctx.lineWidth = lastCity === c ? 2.5 : 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(7, sz)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(c.name, c.x, c.y - sz - 4);
    ctx.fillStyle = '#4ade80';
    ctx.font = `bold ${Math.max(6, sz - 1)}px Arial`;
    ctx.fillText(`+${c.income}💰`, c.x, c.y + sz + 10);
    if (c.lvl > 1) {
      ctx.fillStyle = '#ffd700';
      ctx.font = `${Math.max(6, sz - 1)}px Arial`;
      ctx.fillText('★'.repeat(c.lvl - 1), c.x, c.y + sz + 16);
    }
  }

  // Draw armies with flags
  for (let a of armies) {
    if (a.dead) continue;

    // Exploration: hide non-visible enemy armies
    if (!isArmyVisible(a)) continue;

    const sel = a === selArmy || selArmies.has(a);
    const sz = a.size;

    // Draw flag background circle
    const flagPath = getFlagPath(a.cid);
    const flagImg = flagPath ? flagImages[flagPath] : null;

    ctx.save();
    ctx.beginPath();
    ctx.arc(a.x, a.y, sz, 0, Math.PI * 2);
    ctx.clip();

    if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
      // Draw flag image clipped to circle
      ctx.drawImage(flagImg, a.x - sz, a.y - sz, sz * 2, sz * 2);
    } else {
      // Fallback: colored circle
      ctx.fillStyle = countries[a.cid]?.color || '#888';
      ctx.fillRect(a.x - sz, a.y - sz, sz * 2, sz * 2);
    }
    ctx.restore();

    // Outline
    ctx.beginPath();
    ctx.arc(a.x, a.y, sz, 0, Math.PI * 2);
    ctx.strokeStyle = sel ? '#ff0' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = sel ? 2.5 : 1;
    ctx.stroke();

    // Selection glow
    if (sel) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, sz + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,0,0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Strength text (below the circle)
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, sz * 0.9)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(a.str)}`, a.x, a.y + sz + 8);
  }

  // Draw minimap
  drawMinimap();

  ctx.restore();
}

// ========== MINIMAP ==========
function drawMinimap() {
  const mmW = 160;
  const mmH = 113;
  const mmX = canvas.width - mmW - 8;
  const mmY = canvas.height - mmH - 8;
  const margin = 4;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(
    mmX - margin,
    mmY - margin,
    mmW + margin * 2,
    mmH + margin * 2,
    6,
  );
  ctx.fill();
  ctx.stroke();

  // Draw map on minimap
  const scaleX = mmW / MAP_W;
  const scaleY = mmH / MAP_H;
  const imgData = mapCtx.getImageData(0, 0, MAP_W, MAP_H);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = mmW;
  tempCanvas.height = mmH;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imgData, 0, 0);
  ctx.drawImage(tempCanvas, mmX, mmY, mmW, mmH);

  // Viewport rectangle
  const vx = mmX + (-camera.x / camera.zoom) * scaleX;
  const vy = mmY + (-camera.y / camera.zoom) * scaleY;
  const vw = (canvas.width / camera.zoom) * scaleX;
  const vh = (canvas.height / camera.zoom) * scaleY;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(vx, vy, vw, vh);

  // Player army dots
  if (!spectatorMode && playerCountry >= 0) {
    for (let a of armies) {
      if (a.dead || a.cid !== playerCountry) continue;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(mmX + a.x * scaleX, mmY + a.y * scaleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ========== GAME LOOP ==========
function update(dt) {
  if (paused) return;
  dt = Math.min(dt, 0.05);
  gameTime += dt;

  // Income
  for (let c of activeCountries) {
    const own = cities.filter((ct) => ct.cid === c.id);
    c.money += own.reduce((s, ct) => s + ct.income, 0) * 0.18 * dt;
  }

  // DP generation
  diplomacyTimer += dt;
  if (diplomacyTimer >= 0.5) {
    diplomacyTimer -= 0.5;
    for (let c of activeCountries) c.dp = Math.min(100, (c.dp || 0) + 3);
  }

  // Clean dead armies
  armies = armies.filter((a) => !a.dead);
  if (selArmy?.dead) selArmy = null;
  for (let a of [...selArmies]) if (a.dead) selArmies.delete(a);
  if (lastArmy?.dead) lastArmy = null;

  // Knockback
  for (let a of armies) {
    if (Math.abs(a.knockX) > 0.1 || Math.abs(a.knockY) > 0.1) {
      a.x += a.knockX * dt * 5;
      a.y += a.knockY * dt * 5;
      a.knockX *= 0.8;
      a.knockY *= 0.8;
      if (Math.abs(a.knockX) < 0.1) a.knockX = 0;
      if (Math.abs(a.knockY) < 0.1) a.knockY = 0;
    }
    if (a.ctimer > 0) a.ctimer -= dt;
  }

  combatUpdate();

  // City capture & movement
  for (let a of armies) {
    if (a.dead) continue;
    const nc = cities.find(
      (c) =>
        dist(c.x, c.y, a.x, a.y) < 15 && c.cid !== a.cid && atWar(a.cid, c.cid),
    );
    if (nc) captureCity(nc, a.cid);

    if (a.path?.length) {
      const tgt = a.path[0];
      const dx = tgt.x - a.x;
      const dy = tgt.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 2) {
        a.path.shift();
        if (!a.path.length) a.path = null;
      } else {
        const spd = a.getEffectiveSpeed();
        const step = Math.min(d, spd * dt);
        a.x += (dx / d) * step;
        a.y += (dy / d) * step;
        if (Math.random() < 0.05) paint(a, 25);
      }
    }

    if (a.morale < 100) a.morale = Math.min(100, a.morale + 5 * dt);
  }

  // Historical WW2 triggers
  if (scenario === 1) {
    // France and UK attack Germany after 45 seconds
    if (!ww2FranceUKAttacked && gameTime > 45) {
      if (rels[0][2] > -50) {
        rels[0][2] = rels[2][0] = -60;
        notify('⚔️ France declared war on Germany! (Historical)');
      }
      if (rels[1][2] > -50) {
        rels[1][2] = rels[2][1] = -60;
        notify('⚔️ UK declared war on Germany! (Historical)');
      }
      ww2FranceUKAttacked = true;
      ww2FranceUKAttackTime = gameTime;
    }
    // Italy joins after 30 seconds from France/UK attack
    if (
      !ww2ItalyAttacked &&
      ww2FranceUKAttackTime > 0 &&
      gameTime > ww2FranceUKAttackTime + 30
    ) {
      if (rels[4][0] > -50) {
        rels[4][0] = rels[0][4] = -60;
        notify('⚔️ Italy declared war on France! (Historical)');
      }
      if (rels[4][1] > -50) {
        rels[4][1] = rels[1][4] = -60;
        notify('⚔️ Italy declared war on UK! (Historical)');
      }
      ww2ItalyAttacked = true;
    }
    // USSR attacks Poland after 120 seconds
    if (
      !ww2USSRattackedPoland &&
      gameTime > 120 &&
      activeCountries.some((c) => c.id === 5)
    ) {
      if (rels[3][5] > -50) {
        rels[3][5] = rels[5][3] = -60;
        notify('⚔️ USSR declared war on Poland! (Historical)');
      }
      ww2USSRattackedPoland = true;
    }
    // Germany attacks USSR after 240 seconds
    if (
      !ww2GermanyAttackedUSSR &&
      gameTime > 240 &&
      activeCountries.some((c) => c.id === 3)
    ) {
      if (rels[2][3] > -50) {
        rels[2][3] = rels[3][2] = -60;
        notify('⚔️ Germany declared war on USSR! (Historical)');
      }
      ww2GermanyAttackedUSSR = true;
    }
  }

  // AI
  aiTimer += dt;
  if (aiTimer >= 2.5) {
    aiTimer = 0;
    runAI();
  }

  refreshHUD();
}

function runAI() {
  for (let c of activeCountries) {
    if (c.id === playerCountry) continue;

    const oc = cities.filter((ct) => ct.cid === c.id);

    // Recruit if rich
    if (
      c.money > 120 &&
      oc.length &&
      Math.random() < 0.3 &&
      armies.filter((a) => a.cid === c.id && !a.dead).length < 15
    ) {
      const ct = oc[Math.floor(Math.random() * oc.length)];
      armies.push(
        new Army(
          armies.length,
          c.id,
          ct.x + (Math.random() - 0.5) * 25,
          ct.y + (Math.random() - 0.5) * 25,
        ),
      );
      c.money -= 100;
    }

    const enemies = activeCountries.filter((e) => atWar(c.id, e.id));
    const myArmies = armies.filter(
      (a) => a.cid === c.id && !a.dead && !a.garrison && !a.path,
    );

    if (enemies.length) {
      // Attack enemy cities
      for (let a of myArmies.slice(0, 3)) {
        const ec = cities.filter((ct) => enemies.some((e) => e.id === ct.cid));
        if (ec.length) {
          const tgt = ec[Math.floor(Math.random() * ec.length)];
          const p = findPath(a, tgt.x, tgt.y);
          if (p) a.path = p;
        }
      }
    } else {
      // Peacetime movement
      if (
        c.id === 3 &&
        scenario === 1 &&
        activeCountries.some((co) => co.id === 5)
      ) {
        // USSR moves toward Polish border
        for (let a of myArmies.slice(0, 4)) {
          const targetX = 1200 + Math.random() * 100;
          const targetY = 400 + Math.random() * 100;
          const p = findPath(a, targetX, targetY);
          if (p) a.path = p;
        }
      } else {
        for (let a of myArmies.slice(0, 2)) {
          const dirs = [
            [-60, 0],
            [60, 0],
            [0, -60],
            [0, 60],
          ];
          const d = dirs[Math.floor(Math.random() * 4)];
          const p = findPath(a, a.x + d[0] * 5, a.y + d[1] * 5);
          if (p) a.path = p;
        }
      }
    }

    // Diplomacy actions
    if ((c.dp || 0) >= 20) {
      for (let o of activeCountries) {
        if (o.id === c.id) continue;
        const rel = rels[c.id][o.id] || 0;
        if (
          rel >= 65 &&
          !allied(c.id, o.id) &&
          !atWar(c.id, o.id) &&
          Math.random() < 0.08
        ) {
          rels[c.id][o.id] = 65;
          rels[o.id][c.id] = 65;
          c.dp -= 30;
          tickerNotify(`🤝 ${c.name} allied with ${o.name}!`);
        }
        if (rel <= -55 && !atWar(c.id, o.id) && Math.random() < 0.06) {
          rels[c.id][o.id] = -60;
          rels[o.id][c.id] = -60;
          c.dp -= 20;
          tickerNotify(`⚔️ ${c.name} declared war on ${o.name}!`);
        }
      }
    }
  }
}

// ========== HUD ==========
function refreshHUD() {
  if (spectatorMode || playerCountry < 0) return;
  const c = countries[playerCountry];
  if (!c) return;
  document.getElementById('money-display').textContent = Math.floor(c.money);
  document.getElementById('dp-display').textContent = Math.floor(c.dp || 0);
  document.getElementById('city-display').textContent = cities.filter(
    (ct) => ct.cid === playerCountry,
  ).length;
  document.getElementById('army-display').textContent = armies.filter(
    (a) => a.cid === playerCountry && !a.dead,
  ).length;
}

function notify(msg) {
  const n = document.createElement('div');
  n.className = 'notification';
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2000);
}

function tickerNotify(msg) {
  const n = document.createElement('div');
  n.className = 'news-ticker';
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ========== DIPLOMACY ==========
function changeRel(tid, amt) {
  if (spectatorMode || Math.abs(amt) > (countries[playerCountry].dp || 0)) {
    notify('Not enough DP!');
    return;
  }
  rels[playerCountry][tid] = Math.max(
    -100,
    Math.min(100, (rels[playerCountry][tid] || 0) + amt),
  );
  rels[tid][playerCountry] = rels[playerCountry][tid];
  countries[playerCountry].dp -= Math.abs(amt);
  refreshHUD();
  updateDiploPanel();
}

function declareWar(tid) {
  if (spectatorMode || atWar(playerCountry, tid)) return;
  if ((countries[playerCountry].dp || 0) < 20) {
    notify('Need 20 DP!');
    return;
  }
  rels[playerCountry][tid] = -60;
  rels[tid][playerCountry] = -60;
  countries[playerCountry].dp -= 20;
  refreshHUD();
  tickerNotify(
    `⚔️ ${countries[playerCountry].name} declared war on ${countries[tid].name}!`,
  );
  updateDiploPanel();
}

function formAlliance(tid) {
  if (spectatorMode || allied(playerCountry, tid)) return;
  if (atWar(playerCountry, tid)) {
    notify('Cannot ally enemy!');
    return;
  }
  if ((countries[playerCountry].dp || 0) < 30) {
    notify('Need 30 DP!');
    return;
  }
  rels[playerCountry][tid] = 60;
  rels[tid][playerCountry] = 60;
  countries[playerCountry].dp -= 30;
  refreshHUD();
  tickerNotify(
    `🤝 ${countries[playerCountry].name} allied with ${countries[tid].name}!`,
  );
  updateDiploPanel();
}

function offerPeace(tid) {
  if (spectatorMode || !atWar(playerCountry, tid)) return;
  if (Math.random() < 0.5) {
    rels[playerCountry][tid] = 0;
    rels[tid][playerCountry] = 0;
    tickerNotify(`🕊️ Peace`);
  } else notify('Rejected');
  updateDiploPanel();
}

function openDiplomacy() {
  wasPausedBeforeDiplo = paused;
  paused = true;
  document.getElementById('diplo-overlay').style.display = 'block';
  document.getElementById('diplo-panel').style.display = 'block';
  document.getElementById('pause-btn').textContent = '▶️';
  updateDiploPanel();
}

function closeDiplomacy() {
  document.getElementById('diplo-overlay').style.display = 'none';
  document.getElementById('diplo-panel').style.display = 'none';
  if (!wasPausedBeforeDiplo) {
    paused = false;
    document.getElementById('pause-btn').textContent = '⏸️';
  }
}

function updateDiploPanel() {
  if (spectatorMode || playerCountry < 0) return;
  const c = document.getElementById('diplo-content');
  c.innerHTML = `<div style="background:rgba(233,69,96,0.2);padding:4px 8px;border-radius:4px;margin-bottom:6px;text-align:center;color:#ffd700;font-size:12px;">⭐ DP: <b>${Math.floor(countries[playerCountry].dp || 0)}</b></div>`;
  for (let ct of activeCountries) {
    if (ct.id === playerCountry) continue;
    const rel = rels[playerCountry][ct.id] || 0;
    const war = atWar(playerCountry, ct.id);
    const ally = allied(playerCountry, ct.id);
    const d = document.createElement('div');
    d.className = 'diplo-entry';
    d.innerHTML = `
      <div class="header">
        <span class="country-name" style="color:${ct.color}">
          ${ct.name}
          ${war ? '<span class="badge-war">WAR</span>' : ''}
          ${ally ? '<span class="badge-ally">ALLY</span>' : ''}
        </span>
        <span class="rel-value">${rel > 0 ? '+' : ''}${rel}</span>
      </div>
      <div class="actions">
        <button onclick="changeRel(${ct.id},10)" style="background:#2ecc71;">+10</button>
        <button onclick="changeRel(${ct.id},-10)" style="background:#e74c3c;">-10</button>
        ${!war && !ally ? `<button onclick="declareWar(${ct.id})" style="background:#c0392b;">⚔️WAR</button>` : ''}
        ${!ally && !war ? `<button onclick="formAlliance(${ct.id})" style="background:#27ae60;">🤝ALLY</button>` : ''}
        ${war ? `<button onclick="offerPeace(${ct.id})" style="background:#2980b9;">🕊️PEACE</button>` : ''}
      </div>`;
    c.appendChild(d);
  }
}

// ========== ACTIONS ==========
function showActions(actions) {
  const p = document.getElementById('action-panel');
  p.innerHTML = '';
  for (let a of actions) {
    const b = document.createElement('button');
    b.textContent = a.text;
    b.style.background = a.cl || '#555';
    b.onclick = () => {
      a.fn();
      p.style.display = 'none';
      refreshHUD();
    };
    p.appendChild(b);
  }
  p.innerHTML +=
    '<button onclick="document.getElementById(\'action-panel\').style.display=\'none\'" style="background:#e94560;">✕</button>';
  p.style.display = 'flex';
}

// ========== INPUT ==========
function getWorld(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (cx - r.left - camera.x) / camera.zoom,
    y: (cy - r.top - camera.y) / camera.zoom,
  };
}

let mouseDownPos = null;
let mouseDownTime = 0;
let mouseDragging = false;
let mouseDragStart = null;
let mouseDragCam = null;

function handleClick(wp, shift) {
  if (
    gameState !== 'playing' ||
    document.getElementById('diplo-panel').style.display === 'block' ||
    spectatorMode
  )
    return;
  document.getElementById('action-panel').style.display = 'none';

  // Check click on player army
  const ca = armies.find(
    (a) =>
      !a.dead &&
      dist(a.x, a.y, wp.x, wp.y) < a.size + 8 &&
      a.cid === playerCountry,
  );
  // Check click on player city
  const cc = cities.find(
    (c) => dist(c.x, c.y, wp.x, wp.y) < 18 && c.cid === playerCountry,
  );

  // If clicked on selected army -> show actions
  if (ca && (ca === selArmy || selArmies.has(ca))) {
    lastArmy = ca;
    lastCity = null;
    const nearby = armies.filter(
      (a) =>
        !a.dead &&
        a.cid === playerCountry &&
        a !== ca &&
        dist(a.x, a.y, ca.x, ca.y) < 40,
    );
    const acts = [
      {
        text: '⬆️ Upgrade ($50)',
        cl: '#f39c12',
        fn: () => {
          if (ca.upgrade()) notify('Upgraded!');
        },
      },
      { text: '✂️ Split', cl: '#e67e22', fn: () => splitArmy(ca) },
    ];
    if (nearby.length)
      acts.push({
        text: `🔗 Merge (${nearby.length + 1})`,
        cl: '#8e44ad',
        fn: () => mergeArmies([ca, ...nearby]),
      });
    showActions(acts);
    return;
  }

  // If clicked on city (tap again to show actions)
  if (cc && cc === lastCity) {
    showActions([
      {
        text: `⬆️ Upgrade City ($${100 * cc.lvl})`,
        cl: '#f39c12',
        fn: () => {
          if (cc.upgrade()) notify('Upgraded!');
        },
      },
      {
        text: '⚔️ Recruit ($100)',
        cl: '#27ae60',
        fn: () => {
          if (countries[playerCountry].money >= 100) {
            countries[playerCountry].money -= 100;
            armies.push(
              new Army(
                armies.length,
                playerCountry,
                cc.x + (Math.random() - 0.5) * 20,
                cc.y + (Math.random() - 0.5) * 20,
              ),
            );
            notify('Recruited!');
          }
        },
      },
    ]);
    return;
  }

  // Select army
  if (ca) {
    lastArmy = null;
    lastCity = null;
    if (shift) {
      if (selArmies.has(ca)) selArmies.delete(ca);
      else selArmies.add(ca);
      selArmy = null;
    } else {
      selArmy = ca;
      selArmies.clear();
    }
    notify(`Selected (${Math.floor(ca.str)})`);
    return;
  }

  // Select city (first tap)
  if (cc) {
    lastCity = cc;
    lastArmy = null;
    notify('City - tap again');
    return;
  }

  // Move selected army/armies
  if (selArmy || selArmies.size) {
    const tgts = selArmy ? [selArmy] : [...selArmies];
    let m = 0;
    for (let a of tgts) {
      if (!a || a.dead || a.cid !== playerCountry) continue;
      const p = findPath(a, wp.x, wp.y);
      if (p) {
        a.path = p;
        m++;
      }
    }
    if (m) notify(`Moving ${m}`);
    else notify('Blocked');
    return;
  }

  // Deselect
  lastCity = null;
  lastArmy = null;
  if (!shift) {
    selArmy = null;
    selArmies.clear();
  }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
  if (gameState !== 'playing') return;
  const wp = getWorld(e.clientX, e.clientY);
  mouseDownPos = wp;
  mouseDownTime = Date.now();
  mouseDragging = false;
  mouseDragStart = { x: e.clientX, y: e.clientY };
  mouseDragCam = { x: camera.tx, y: camera.ty };
});

canvas.addEventListener('mousemove', (e) => {
  if (!mouseDragStart) return;
  const dx = e.clientX - mouseDragStart.x;
  const dy = e.clientY - mouseDragStart.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    mouseDragging = true;
    camera.tx = mouseDragCam.x + dx;
    camera.ty = mouseDragCam.y + dy;
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (gameState !== 'playing') return;
  if (!mouseDragging && mouseDownPos && Date.now() - mouseDownTime < 400)
    handleClick(mouseDownPos, e.shiftKey);
  mouseDownPos = null;
  mouseDragStart = null;
  mouseDragging = false;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const oldZoom = camera.tz;
    camera.tz = Math.min(3, Math.max(0.2, camera.tz - e.deltaY * 0.0008));
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    // Zoom towards mouse position
    camera.tx = mx - ((mx - camera.x) / camera.zoom) * camera.tz;
    camera.ty = my - ((my - camera.y) / camera.zoom) * camera.tz;
  },
  { passive: false },
);

canvas.oncontextmenu = (e) => e.preventDefault();

// Touch events
canvas.addEventListener(
  'touchstart',
  (e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const nt = e.touches.length;
    touchState.touches = [...e.touches];
    if (nt === 1) {
      const t = e.touches[0];
      touchState.startPos = getWorld(t.clientX, t.clientY);
      touchState.startTime = Date.now();
      touchState.moved = false;
      touchState.panStart = {
        x: t.clientX,
        y: t.clientY,
        cx: camera.tx,
        cy: camera.ty,
      };
    } else if (nt >= 2) {
      touchState.isPinching = true;
      touchState.startTime = 0;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchState.panStart = { x: cx, y: cy, cx: camera.tx, cy: camera.ty };
      touchState.lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  },
  { passive: false },
);

canvas.addEventListener(
  'touchmove',
  (e) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const nt = e.touches.length;
    if (nt === 1) {
      const t = e.touches[0];
      if (
        Math.abs(t.clientX - touchState.panStart.x) > 3 ||
        Math.abs(t.clientY - touchState.panStart.y) > 3
      ) {
        touchState.moved = true;
        camera.tx =
          touchState.panStart.cx + (t.clientX - touchState.panStart.x);
        camera.ty =
          touchState.panStart.cy + (t.clientY - touchState.panStart.y);
      }
    } else if (nt >= 2) {
      touchState.moved = true;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      camera.tx = touchState.panStart.cx + (cx - touchState.panStart.x);
      camera.ty = touchState.panStart.cy + (cy - touchState.panStart.y);
      const nd = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (touchState.lastPinchDist > 0) {
        const s = nd / touchState.lastPinchDist;
        camera.tz = Math.min(3, Math.max(0.2, camera.tz * s));
      }
      touchState.lastPinchDist = nd;
    }
  },
  { passive: false },
);

canvas.addEventListener('touchend', (e) => {
  if (gameState !== 'playing') return;
  if (
    e.touches.length === 0 &&
    !touchState.moved &&
    touchState.startPos &&
    Date.now() - touchState.startTime < 350
  )
    handleClick(touchState.startPos);
  touchState.startPos = null;
  touchState.moved = false;
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && gameState === 'playing') {
    e.preventDefault();
    document.getElementById('diplo-panel').style.display === 'block'
      ? closeDiplomacy()
      : togglePause();
  } else if (e.code === 'KeyA' && !spectatorMode) {
    selArmy = null;
    selArmies.clear();
    for (let a of armies)
      if (a.cid === playerCountry && !a.dead) selArmies.add(a);
  } else if (e.code === 'Escape') {
    document.getElementById('diplo-panel').style.display === 'block'
      ? closeDiplomacy()
      : ((selArmy = null),
        selArmies.clear(),
        (document.getElementById('action-panel').style.display = 'none'));
  }
});

// ========== MENU ==========
function selectScenario(num) {
  scenario = num;
  const sel = document.getElementById('player-country');
  sel.innerHTML = '';
  if (num === 3) {
    // WW1
    [0, 1, 2, 3, 4, 6, 7, 8, 10, 11].forEach((id) =>
      sel.add(new Option(allCountryDefs[id].name, id.toString())),
    );
  } else if (num === 2) {
    sel.add(new Option('Germany', '2'));
    sel.add(new Option('USSR', '3'));
  } else {
    // WW2 default
    allCountryDefs
      .slice(0, 10)
      .forEach((c) => sel.add(new Option(c.name, c.id.toString())));
  }
  document.getElementById('scenario-buttons').style.display = 'none';
  document.getElementById('country-select').style.display = 'block';
  document.getElementById('historical-mode').checked = true;
  document.getElementById('spectator-mode').checked = false;
  toggleSpectator();
}

function backToScenarios() {
  document.getElementById('scenario-buttons').style.display = 'block';
  document.getElementById('country-select').style.display = 'none';
}

function toggleSpectator() {
  const s = document.getElementById('spectator-mode').checked;
  document.getElementById('difficulty-select').style.display = s
    ? 'none'
    : 'block';
  document.getElementById('country-label').style.display = s ? 'none' : 'block';
  document.getElementById('player-country').style.display = s
    ? 'none'
    : 'block';
  const label = document.querySelector('#player-options label');
  if (label) label.style.display = s ? 'none' : 'block';
}

// ========== GAME INIT ==========
function initializeGame() {
  const startAtWar = document.getElementById('historical-mode').checked;
  spectatorMode = document.getElementById('spectator-mode').checked;
  explorationMode = document.getElementById('exploration-mode').checked;

  ww2FranceUKAttacked =
    ww2ItalyAttacked =
    ww2USSRattackedPoland =
    ww2GermanyAttackedUSSR =
      false;
  ww2FranceUKAttackTime = 0;

  playerCountry = spectatorMode
    ? -1
    : parseInt(document.getElementById('player-country').value);
  difficulty = spectatorMode
    ? 'normal'
    : document.getElementById('difficulty-select').value;

  document.getElementById('menu').style.display = 'none';
  if (spectatorMode) {
    document.getElementById('hud').style.display = 'none';
    document.getElementById('spectator-hud').style.display = 'flex';
  } else {
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('spectator-hud').style.display = 'none';
    // Set HUD flag
    const flagEl = document.getElementById('hud-flag');
    const flagPath = getFlagPath(playerCountry);
    if (flagPath) {
      const flagImg = flagImages[flagPath];
      if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
        flagEl.innerHTML = `<img src="${flagPath}" alt="flag">`;
        flagEl.style.display = 'block';
      } else {
        flagEl.innerHTML = `<img src="${flagPath}" alt="flag">`;
        flagEl.style.display = 'block';
        // Image will show when loaded
      }
    }
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const baseMoney =
    difficulty === 'easy' ? 400 : difficulty === 'normal' ? 300 : 200;
  const baseDP = 60;

  // Initialize countries
  if (scenario === 2) {
    activeCountries = [
      { ...allCountryDefs[2], money: baseMoney, dp: baseDP },
      { ...allCountryDefs[3], money: baseMoney, dp: baseDP },
    ];
    countries = allCountryDefs.map((d) => ({ ...d, money: 0, dp: 0 }));
    countries[2] = activeCountries[0];
    countries[3] = activeCountries[1];
  } else if (scenario === 3) {
    const ids = [0, 1, 2, 3, 4, 6, 7, 8, 10, 11];
    activeCountries = ids.map((id) => ({
      ...allCountryDefs[id],
      money: baseMoney,
      dp: baseDP,
    }));
    countries = allCountryDefs.map((d) => ({ ...d, money: 0, dp: 0 }));
    activeCountries.forEach((ac) => {
      countries[ac.id] = ac;
    });
  } else {
    activeCountries = allCountryDefs
      .slice(0, 10)
      .map((d) => ({ ...d, money: baseMoney, dp: baseDP }));
    countries = [...activeCountries];
  }

  // Initialize relations
  rels = Array(countries.length)
    .fill()
    .map(() => Array(countries.length).fill(0));
  const sr = (a, b, v) => {
    rels[a][b] = v;
    rels[b][a] = v;
  };
  if (startAtWar) {
    if (scenario === 1) {
      sr(2, 5, -60);
      sr(2, 3, -20);
      sr(1, 2, -15);
      sr(0, 2, -10);
      sr(0, 1, 45);
      sr(2, 4, 65);
    } else if (scenario === 2) {
      sr(2, 3, -60);
    } else if (scenario === 3) {
      const cp = [2, 10, 11];
      const en = [0, 1, 3, 4];
      for (let c of cp) for (let e of en) sr(c, e, -60);
      for (let i = 0; i < cp.length; i++)
        for (let j = i + 1; j < cp.length; j++) sr(cp[i], cp[j], 60);
      for (let i = 0; i < en.length; i++)
        for (let j = i + 1; j < en.length; j++) sr(en[i], en[j], 60);
    }
  }

  // Initialize cities
  cities = [
    new City(0, 'Paris', 0, 520, 490),
    new City(1, 'Lyon', 0, 600, 600),
    new City(2, 'Bordeaux', 0, 440, 600),
    new City(3, 'London', 1, 280, 240),
    new City(4, 'Manchester', 1, 250, 180),
    new City(5, 'Berlin', 2, 860, 410),
    new City(6, 'Munich', 2, 830, 560),
    new City(7, 'Hamburg', 2, 790, 330),
    new City(8, 'Cologne', 2, 760, 460),
    new City(9, 'Moscow', 3, 1700, 370),
    new City(10, 'Stalingrad', 3, 1780, 720),
    new City(11, 'Leningrad', 3, 1540, 230),
    new City(12, 'Kiev', 3, 1500, 540),
    new City(13, 'Minsk', 3, 1380, 390),
    new City(14, 'Odessa', 3, 1520, 740),
    new City(15, 'Rome', 4, 840, 870),
    new City(16, 'Milan', 4, 760, 760),
    new City(17, 'Warsaw', 5, 1200, 430),
    new City(18, 'Krakow', 5, 1160, 520),
    new City(19, 'Madrid', 6, 340, 1060),
    new City(20, 'Barcelona', 6, 450, 1000),
    new City(21, 'Stockholm', 7, 920, 210),
    new City(22, 'Oslo', 8, 640, 210),
    new City(23, 'Belgrade', 9, 1010, 1130),
  ];
  if (scenario === 3) {
    cities.find((c) => c.name === 'Warsaw').cid = 10;
    cities.find((c) => c.name === 'Krakow').cid = 10;
    cities.find((c) => c.name === 'Belgrade').cid = 11;
    cities.push(
      new City(24, 'Vienna', 10, 790, 660),
      new City(25, 'Budapest', 10, 940, 760),
      new City(26, 'Sarajevo', 11, 1080, 1180),
      new City(27, 'Constantinople', 11, 1300, 1300),
    );
  }

  // Initialize armies
  armies = [];
  selArmy = null;
  selArmies.clear();
  lastCity = lastArmy = null;

  for (let c of activeCountries) {
    const border = countryBorders[c.name];
    if (border) {
      for (let i = 0; i < border.length; i += 2) {
        const a = new Army(
          armies.length,
          c.id,
          border[i][0],
          border[i][1],
          90,
          90,
        );
        if (i % 4 === 0) a.garrison = true;
        armies.push(a);
      }
    }
    // Special reinforcements for specific scenarios
    if (c.id === 2 && scenario === 1) {
      for (let k = 0; k < 5; k++)
        armies.push(
          new Army(
            armies.length,
            2,
            1000 + Math.random() * 40,
            400 + Math.random() * 60,
            110,
            110,
          ),
        );
      for (let k = 0; k < 3; k++)
        armies.push(
          new Army(
            armies.length,
            2,
            980 + Math.random() * 40,
            450 + Math.random() * 50,
            110,
            110,
          ),
        );
    }
    if (c.id === 3 && scenario === 1 && startAtWar) {
      for (let k = 0; k < 6; k++)
        armies.push(
          new Army(
            armies.length,
            3,
            1250 + Math.random() * 50,
            420 + Math.random() * 80,
            110,
            110,
          ),
        );
    }
    const myCities = cities.filter((ct) => ct.cid === c.id);
    for (let ct of myCities) {
      armies.push(new Army(armies.length, c.id, ct.x + 15, ct.y, 100, 100));
      armies.push(new Army(armies.length, c.id, ct.x - 15, ct.y + 12, 95, 95));
    }
  }

  initGrid();
  drawMap();

  camera.tz = 0.55;
  camera.tx = canvas.width / 2 - (MAP_W * camera.tz) / 2;
  camera.ty = canvas.height / 2 - (MAP_H * camera.tz) / 2;
  camera.x = camera.tx;
  camera.y = camera.ty;
  camera.zoom = camera.tz;

  gameState = 'playing';
  paused = false;
  gameTime = 0;
  lastFrameTime = performance.now();
  refreshHUD();
  requestAnimationFrame(gameLoop);
}

function returnToMenu() {
  gameState = 'menu';
  document.getElementById('menu').style.display = 'block';
  document.getElementById('scenario-buttons').style.display = 'block';
  document.getElementById('country-select').style.display = 'none';
  [
    'hud',
    'spectator-hud',
    'diplo-panel',
    'diplo-overlay',
    'action-panel',
  ].forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  });
  paused = false;
}

function togglePause() {
  if (document.getElementById('diplo-panel').style.display === 'block') return;
  paused = !paused;
  const b = document.getElementById('pause-btn');
  const sb = document.getElementById('spectator-pause-btn');
  if (b) b.textContent = paused ? '▶️' : '⏸️';
  if (sb) sb.textContent = paused ? '▶️' : '⏸️';
  if (!paused) refreshHUD();
}

// ========== GAME LOOP ==========
function gameLoop(ts) {
  if (gameState === 'playing') {
    const dt = Math.min((ts - lastFrameTime) / 1000, 0.05);
    lastFrameTime = ts;
    update(dt);
    draw();
  }
  requestAnimationFrame(gameLoop);
}

// ========== INIT ==========
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
lastFrameTime = performance.now();
requestAnimationFrame(gameLoop);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

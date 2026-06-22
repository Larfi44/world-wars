// ============================================================
//  GRAND STRATEGY – WW1 & WW2 EUROPE
//  World Wars Tactical Grand Strategy Game
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---- STATE ----
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
// ========== STAT HISTORY ==========
let statHistory = [];
let statRecordTimer = 0;

// WW2 historical triggers
let ww2FranceUKAttacked = false;
let ww2ItalyAttacked = false;
let ww2USSRattackedPoland = false;
let ww2GermanyAttackedUSSR = false;
let ww2FranceUKAttackTime = 0;

// ========== CUSTOM MAP ==========
const CUSTOM_MAP_W = 1200;
const CUSTOM_MAP_H = 900;

// ========== CONSTANTS ==========
const MAP_W = 2400;
const MAP_H = 1700;
const CELL = 10;
const COLS = Math.floor(MAP_W / CELL);
const ROWS = Math.floor(MAP_H / CELL);
const CUSTOM_COLS = Math.floor(CUSTOM_MAP_W / CELL);
const CUSTOM_ROWS = Math.floor(CUSTOM_MAP_H / CELL);

let camera = { x: 0, y: 0, zoom: 1, tx: 0, ty: 0, tz: 0.55 };
let grid = [];
let mapCanvas = document.createElement('canvas');
let mapCtx = mapCanvas.getContext('2d');
mapCanvas.width = MAP_W;
mapCanvas.height = MAP_H;
let mapDirty = true;

let useLandscape = false;

// ========== COUNTRY DEFINITIONS ==========
const allCountryDefs = [
  {
    id: 0,
    name: 'France',
    color: '#2563eb',
    ideology: 'Democracy',
    leader: 'Charles de Gaulle',
    leaderImg: 'leaders/charles-de-gaulle.jpg',
  },
  {
    id: 1,
    name: 'UK',
    color: '#0891b2',
    ideology: 'Democracy',
    leader: 'Winston Churchill',
    leaderImg: 'leaders/winston-cherchil.jpg',
  },
  {
    id: 2,
    name: 'Germany',
    color: '#d97706',
    ideology: 'Nazism',
    leader: 'Adolf Hitler',
    leaderImg: 'leaders/adolf-hitler.png',
  },
  {
    id: 3,
    name: 'Russia',
    color: '#dc2626',
    ideology: 'Communism',
    leader: 'Joseph Stalin',
    leaderImg: 'leaders/stalin.png',
  },
  {
    id: 4,
    name: 'Italy',
    color: '#16a34a',
    ideology: 'Fascism',
    leader: 'Benito Mussolini',
    leaderImg: 'leaders/benito-mussolini.jpg',
  },
  {
    id: 5,
    name: 'Poland',
    color: '#9333ea',
    ideology: 'Conservatism',
    leader: 'Wladyslaw Sikorski',
    leaderImg: 'leaders/wladyslav-sikorski.jpg',
  },
  {
    id: 6,
    name: 'Spain',
    color: '#eab308',
    ideology: 'Conservatism',
    leader: 'Francisco Franco',
    leaderImg: null,
  },
  {
    id: 7,
    name: 'Sweden',
    color: '#3b82f6',
    ideology: 'Democracy',
    leader: 'Per Albin Hansson',
    leaderImg: null,
  },
  {
    id: 8,
    name: 'Norway',
    color: '#ef4444',
    ideology: 'Democracy',
    leader: 'Haakon VII',
    leaderImg: null,
  },
  {
    id: 9,
    name: 'Yugoslavia',
    color: '#f97316',
    ideology: 'Liberalism',
    leader: 'King Peter II',
    leaderImg: null,
  },
  {
    id: 10,
    name: 'Austria-Hungary',
    color: '#b8860b',
    ideology: 'Conservatism',
    leader: 'Franz Joseph I',
    leaderImg: null,
  },
  {
    id: 11,
    name: 'Ottoman Empire',
    color: '#800000',
    ideology: 'Conservatism',
    leader: 'Mehmed VI',
    leaderImg: null,
  },
  {
    id: 12,
    name: 'Red',
    color: '#dc2626',
    ideology: '-',
    leader: 'Red Commander',
    leaderImg: null,
  },
  {
    id: 13,
    name: 'Blue',
    color: '#2563eb',
    ideology: '-',
    leader: 'Blue Commander',
    leaderImg: null,
  },
  {
    id: 14,
    name: 'Yellow',
    color: '#eab308',
    ideology: '-',
    leader: 'Yellow Commander',
    leaderImg: null,
  },
  {
    id: 15,
    name: 'Green',
    color: '#16a34a',
    ideology: '-',
    leader: 'Green Commander',
    leaderImg: null,
  },
];

let countries = [];
let rels = [];
let activeCountries = [];

// ========== FLAG IMAGES ==========
const flagImages = {};
const flagMap = {
  0: { 1: 'flags/france.jpg', 3: 'flags/france.jpg' },
  1: { 1: 'flags/britain.png', 3: 'flags/britain.png' },
  2: { 1: 'flags/nazi.png', 2: 'flags/nazi.png', 3: 'flags/german_empire.jpg' },
  3: {
    1: 'flags/ussr.png',
    2: 'flags/ussr.png',
    3: 'flags/russian_empire.png',
  },
  4: { 1: 'flags/fascist_italy.jpg', 3: 'flags/italy.png' },
  6: { 1: 'flags/spain.png', 3: 'flags/spain.png' },
  9: { 1: 'flags/yugoslavia.png', 3: 'flags/yugoslavia.png' },
  10: { 3: 'flags/austro-hungria.png' },
  11: { 3: 'flags/osman_empire.jpg' },
};

function getFlagPath(cid) {
  if (cid >= 12) return null;
  if (flagMap[cid] && flagMap[cid][scenario]) return flagMap[cid][scenario];
  if (flagMap[cid]) {
    const keys = Object.keys(flagMap[cid]);
    if (keys.length) return flagMap[cid][keys[0]];
  }
  return null;
}

function loadFlags() {
  const toLoad = new Set();
  for (const cid in flagMap)
    for (const s in flagMap[cid]) toLoad.add(flagMap[cid][s]);
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
  ],
  [
    [400, 880],
    [480, 850],
    [520, 880],
    [490, 950],
    [420, 960],
    [380, 920],
  ],
  [
    [780, 780],
    [820, 740],
    [870, 770],
    [860, 860],
    [820, 920],
    [770, 890],
  ],
  [
    [620, 140],
    [700, 120],
    [760, 160],
    [740, 260],
    [660, 300],
    [600, 240],
  ],
  [
    [1100, 1060],
    [1180, 1020],
    [1240, 1060],
    [1200, 1160],
    [1120, 1180],
    [1060, 1120],
  ],
  [
    [1700, 600],
    [1780, 560],
    [1840, 600],
    [1800, 680],
    [1720, 700],
    [1660, 660],
  ],
  [
    [1900, 200],
    [1940, 160],
    [1980, 200],
    [1960, 360],
    [1900, 400],
    [1860, 340],
  ],
];

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

let cities = [];
let armies = [];
let selArmy = null;
let selArmies = new Set();
let lastCity = null;
let selCities = new Set();

// ========== SELECTION SNIPPETS ==========
let snippets = [];
for (let i = 0; i < 10; i++) snippets.push(null);

function getSelectedArmyIds() {
  const ids = new Set();
  if (selArmy) ids.add(selArmy.id);
  for (const sa of selArmies)
    if (!sa.dead && sa.cid === playerCountry) ids.add(sa.id);
  return ids;
}
function getSelectedCityIds() {
  const ids = new Set();
  if (lastCity) ids.add(lastCity.id);
  for (const sc of selCities) if (sc.cid === playerCountry) ids.add(sc.id);
  return ids;
}

function saveSnippet(slot) {
  const armyIds = getSelectedArmyIds(),
    cityIds = getSelectedCityIds();
  if (armyIds.size === 0 && cityIds.size === 0) {
    notify('Nothing selected to save!');
    return;
  }
  snippets[slot] = { name: `Slot ${slot}`, armyIds, cityIds };
  updateSnippetBar();
  notify(`Saved selection to slot ${slot}`);
}
function loadSnippet(slot) {
  const s = snippets[slot];
  if (!s) {
    notify('Slot is empty!');
    return;
  }
  selArmy = null;
  selArmies.clear();
  selCities.clear();
  lastCity = null;
  for (const id of s.armyIds) {
    const a = armies.find(
      (ar) => ar.id === id && !ar.dead && ar.cid === playerCountry,
    );
    if (a) selArmies.add(a);
  }
  for (const id of s.cityIds) {
    const c = cities.find((ct) => ct.id === id && ct.cid === playerCountry);
    if (c) selCities.add(c);
  }
  if (selArmies.size === 1) {
    selArmy = [...selArmies][0];
    selArmies.clear();
  }
  if (selCities.size === 1) {
    lastCity = [...selCities][0];
    selCities.clear();
  }
  notify(`Loaded slot ${s.name || slot}`);
}
function deleteSnippet(slot) {
  if (!snippets[slot]) {
    notify('Slot is empty!');
    return;
  }
  snippets[slot] = null;
  updateSnippetBar();
  notify(`Deleted slot ${slot}`);
}
function promptRenameSnippet(slot) {
  if (!snippets[slot]) {
    notify('Slot is empty!');
    return;
  }
  const newName = prompt(
    'Name this snippet:',
    snippets[slot].name || `Slot ${slot}`,
  );
  if (newName && newName.trim()) {
    snippets[slot].name = newName.trim();
    updateSnippetBar();
    notify(`Renamed to "${newName.trim()}"`);
  }
}
function updateSnippetBar() {
  const bar = document.getElementById('snippet-bar');
  if (!bar) return;
  bar.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    if (snippets[i] === null) continue;
    const s = snippets[i];
    const wrap = document.createElement('div');
    wrap.className = 'snippet-wrap';
    const btn = document.createElement('button');
    btn.className = 'snippet-btn';
    btn.textContent = `${i}: ${s.name}`;
    btn.onclick = () => loadSnippet(i);
    const nameBtn = document.createElement('button');
    nameBtn.className = 'snippet-name-btn';
    nameBtn.textContent = '✏️';
    nameBtn.onclick = (e) => {
      e.stopPropagation();
      promptRenameSnippet(i);
    };
    const delBtn = document.createElement('button');
    delBtn.className = 'snippet-del-btn';
    delBtn.textContent = '✕';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSnippet(i);
    };
    wrap.appendChild(btn);
    wrap.appendChild(nameBtn);
    wrap.appendChild(delBtn);
    bar.appendChild(wrap);
  }
}

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
    return Math.floor((this.inc * this.lvl) / 2);
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
    return 3 + (this.maxStr / 250) * 6;
  }
  get power() {
    return Math.floor(this.str * (this.morale / 100) * (this.maxStr / 100));
  }
  getEffectiveSpeed() {
    let spd = this.spd;
    spd *= Math.max(0.6, 1 - (this.maxStr / 500) * 0.4);
    const gx = Math.floor(this.x / CELL),
      gy = Math.floor(this.y / CELL);
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
  upgrade() {
    if (countries[this.cid].money < 50 || this.maxStr >= 250) return false;
    countries[this.cid].money -= 50;
    this.maxStr = Math.min(250, this.maxStr + 50);
    this.str = Math.min(this.str + 50, this.maxStr);
    return true;
  }
}

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
  if (isSea(x, y)) return -1;
  for (let c of activeCountries) {
    let borderKey = c.name;
    if (c.id === 3 && scenario >= 1) borderKey = 'Russia';
    const b = countryBorders[borderKey];
    if (b && inPoly(x, y, b)) return c.id;
  }
  return -1;
}

function atWar(a, b) {
  return rels[a] && rels[a][b] <= -50;
}
function allied(a, b) {
  return rels[a] && rels[a][b] >= 50;
}

function canMove(army, gx, gy) {
  const c = grid[gy]?.[gx];
  if (!c) return false;
  if (c.terrain === 'sea' && !army.ships) return false;
  const o = c.owner;
  return (
    o === -1 || o === army.cid || allied(army.cid, o) || atWar(army.cid, o)
  );
}

function findPath(army, tx, ty) {
  const sx = Math.floor(army.x / CELL),
    sy = Math.floor(army.y / CELL),
    ex = Math.floor(tx / CELL),
    ey = Math.floor(ty / CELL);
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
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
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
      const nx = cur.x + dx,
        ny = cur.y + dy,
        nk = key(nx, ny);
      if (closed.has(nk) || !canMove(army, nx, ny)) continue;
      const c = grid[ny][nx];
      let cost = Math.sqrt(dx * dx + dy * dy);
      if (c.terrain === 'mtn') cost *= 4;
      const g = cur.g + cost,
        f = g + Math.hypot(nx - ex, ny - ey);
      if (!open.has(nk) || g < open.get(nk).g)
        open.set(nk, { x: nx, y: ny, g, f, p: cur });
    }
  }
  return null;
}

function initGrid() {
  const cols = scenario === 4 || scenario === 5 ? CUSTOM_COLS : COLS;
  const rows = scenario === 4 || scenario === 5 ? CUSTOM_ROWS : ROWS;
  grid = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      const wx = x * CELL + CELL / 2,
        wy = y * CELL + CELL / 2;
      let terrain = 'land';
      if (scenario !== 4 && scenario !== 5) terrain = getTerrain(wx, wy);
      grid[y][x] = { terrain, owner: -1, occupier: null };
    }
  }
}

function drawMap() {
  const rows = grid.length,
    cols = grid[0].length;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = grid[y][x];
      let color;
      if (c.terrain === 'sea') {
        const df = y / rows;
        color = `rgb(${Math.floor(10 + df * 15)},${Math.floor(40 + df * 30)},${Math.floor(100 + df * 60)})`;
      } else if (c.terrain === 'mtn') color = '#5c4a3a';
      else if (c.owner >= 0 && c.owner < countries.length) {
        color = countries[c.owner].color;
        if (c.occupier !== null && c.occupier !== c.owner) {
          const oc = countries[c.occupier]?.color || '#888';
          const blend = (a, b) => {
            const ai = parseInt(a, 16),
              bi = parseInt(b, 16);
            return Math.round((ai + bi) / 2)
              .toString(16)
              .padStart(2, '0');
          };
          color =
            '#' +
            blend(color[1] + color[2], oc[1] + oc[2]) +
            blend(color[3] + color[4], oc[3] + oc[4]) +
            blend(color[5] + color[6], oc[5] + oc[6]);
        }
      } else color = '#3a3528';
      mapCtx.fillStyle = color;
      mapCtx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
  // Draw borders
  if (scenario !== 4 && scenario !== 5) {
    mapCtx.strokeStyle = 'rgba(255,255,255,0.25)';
    mapCtx.lineWidth = 2;
    for (let c of activeCountries) {
      let borderKey = c.name;
      if (c.id === 3 && scenario >= 1) borderKey = 'Russia';
      const b = countryBorders[borderKey];
      if (!b) continue;
      mapCtx.beginPath();
      mapCtx.moveTo(b[0][0], b[0][1]);
      for (let i = 1; i < b.length; i++) mapCtx.lineTo(b[i][0], b[i][1]);
      mapCtx.closePath();
      mapCtx.stroke();
    }
  }
  mapDirty = false;
}

function paint(army, r = 30) {
  const gx = Math.floor(army.x / CELL),
    gy = Math.floor(army.y / CELL),
    cr = Math.ceil(r / CELL);
  let changed = false;
  for (let dy = -cr; dy <= cr; dy++) {
    for (let dx = -cr; dx <= cr; dx++) {
      if (dx * dx + dy * dy > cr * cr) continue;
      const nx = gx + dx,
        ny = gy + dy;
      if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length)
        continue;
      const c = grid[ny][nx];
      if (c.terrain === 'sea' || c.terrain === 'mtn') continue;
      if (c.owner === -1) {
        c.owner = army.cid;
        c.occupier = null;
        changed = true;
        continue;
      }
      if (c.owner !== army.cid && !atWar(army.cid, c.owner)) continue;
      if (c.owner === army.cid) {
        if (c.occupier !== null) {
          c.occupier = null;
          changed = true;
        }
      } else if (c.owner !== -1) {
        if (c.occupier !== army.cid) {
          c.occupier = army.cid;
          changed = true;
        }
      }
    }
  }
  if (changed) mapDirty = true;
}

function captureCity(city, newO) {
  if (city.cid === newO) return;
  const oldO = city.cid;
  city.cid = newO;
  const remaining = cities.filter((c) => c.cid === oldO);
  if (remaining.length === 0 && oldO >= 0) {
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++)
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

function combat(a1, a2) {
  const bp1 = a1.power * (0.8 + Math.random() * 0.4),
    bp2 = a2.power * (0.8 + Math.random() * 0.4);
  const angle = Math.atan2(a2.y - a1.y, a2.x - a1.x);
  if (bp1 >= bp2) {
    a2.str -= Math.floor(bp1 * 0.25);
    a1.str -= Math.floor(bp2 * 0.08);
    a1.morale = Math.max(30, a1.morale - 1);
    a2.morale = Math.max(0, a2.morale - 12);
    a2.knockX += Math.cos(angle) * 15;
    a2.knockY += Math.sin(angle) * 15;
    a1.knockX -= Math.cos(angle) * 3;
    a1.knockY -= Math.sin(angle) * 3;
    if (a2.str <= 0) {
      a2.dead = true;
      a2.str = 0;
    }
  } else {
    a1.str -= Math.floor(bp2 * 0.25);
    a2.str -= Math.floor(bp1 * 0.08);
    a2.morale = Math.max(30, a2.morale - 1);
    a1.morale = Math.max(0, a1.morale - 12);
    a1.knockX -= Math.cos(angle) * 15;
    a1.knockY -= Math.sin(angle) * 15;
    a2.knockX += Math.cos(angle) * 3;
    a2.knockY += Math.sin(angle) * 3;
    if (a1.str <= 0) {
      a1.dead = true;
      a1.str = 0;
    }
  }
  a1.ctimer = 0.5;
  a2.ctimer = 0.5;
}

function combatUpdate() {
  const buckets = new Map();
  for (let a of armies) {
    if (a.dead) continue;
    const bx = Math.floor(a.x / 200),
      by = Math.floor(a.y / 200),
      key = `${bx},${by}`;
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
        if (dist(a.x, a.y, b.x, b.y) < a.size + b.size + 5) combat(a, b);
      }
    }
  }
}

function mergeArmies(ams) {
  if (ams.length < 2) return;
  const b = ams[0];
  let ts = b.str,
    tm = b.maxStr;
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
  const h = Math.floor(a.str / 2),
    hm = Math.floor(a.maxStr / 2);
  a.str = h;
  a.maxStr = hm;
  armies.push(new Army(armies.length, a.cid, a.x + 12, a.y + 12, h, hm));
  notify('Army split!');
}

function isArmyVisible(a) {
  if (spectatorMode) return true;
  if (!explorationMode) return true;
  if (a.cid === playerCountry || allied(playerCountry, a.cid)) return true;
  const visRange = 150;
  for (let pa of armies) {
    if (
      !pa.dead &&
      pa.cid === playerCountry &&
      dist(pa.x, pa.y, a.x, a.y) < visRange
    )
      return true;
  }
  for (let pc of cities) {
    if (pc.cid === playerCountry && dist(pc.x, pc.y, a.x, a.y) < visRange)
      return true;
  }
  return false;
}

function walkToMerge(selectedArmyIds) {
  const ids = [...selectedArmyIds];
  let cx = 0,
    cy = 0,
    count = 0;
  for (const id of ids) {
    const a = armies.find(
      (ar) => ar.id === id && !ar.dead && ar.cid === playerCountry,
    );
    if (!a) continue;
    cx += a.x;
    cy += a.y;
    count++;
  }
  if (count < 2) return;
  cx /= count;
  cy /= count;
  let moved = 0;
  for (const id of ids) {
    const a = armies.find(
      (ar) => ar.id === id && !ar.dead && ar.cid === playerCountry,
    );
    if (!a) continue;
    if (!a.path) {
      const p = findPath(
        a,
        cx - 5 + Math.random() * 10,
        cy - 5 + Math.random() * 10,
      );
      if (p) {
        a.path = p;
        moved++;
      }
    }
  }
  if (moved > 0) notify('Moving armies together...');
  else notify('Armies already moving');
}

// ========== DRAWING ==========
function draw() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  camera.x += (camera.tx - camera.x) * 0.2;
  camera.y += (camera.ty - camera.y) * 0.2;
  camera.zoom += (camera.tz - camera.zoom) * 0.2;
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);
  if (mapDirty) drawMap();
  ctx.drawImage(mapCanvas, 0, 0);
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
  for (let a of armies) {
    if (a.dead || a.cid !== playerCountry || !a.path || a.path.length < 2)
      continue;
    const sel = a === selArmy || selArmies.has(a);
    if (!sel) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(a.path[0].x, a.path[0].y);
    for (let i = 1; i < a.path.length; i++)
      ctx.lineTo(a.path[i].x, a.path[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let a of armies) {
    if (a.dead || !isArmyVisible(a)) continue;
    const sel = a === selArmy || selArmies.has(a);
    const sz = a.size;
    const flagPath = getFlagPath(a.cid);
    const flagImg = flagPath ? flagImages[flagPath] : null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(a.x, a.y, sz, 0, Math.PI * 2);
    ctx.clip();
    if (a.ships) {
      ctx.fillStyle = '#1e88e5';
      ctx.fillRect(a.x - sz - 2, a.y - sz - 2, sz * 2 + 4, sz * 2 + 4);
    }
    if (flagImg && flagImg.complete && flagImg.naturalWidth > 0) {
      ctx.drawImage(flagImg, a.x - sz, a.y - sz, sz * 2, sz * 2);
    } else {
      ctx.fillStyle = countries[a.cid]?.color || '#888';
      ctx.fillRect(a.x - sz, a.y - sz, sz * 2, sz * 2);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(a.x, a.y, sz, 0, Math.PI * 2);
    ctx.strokeStyle = sel ? '#ff0' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = sel ? 2.5 : 1;
    ctx.stroke();
    if (sel) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, sz + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,0,0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(8, sz * 0.9)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(a.str)}`, a.x, a.y + sz + 8);
    if (a.ships) {
      ctx.fillStyle = '#64b5f6';
      ctx.font = `bold ${Math.max(6, sz * 0.6)}px Arial`;
      ctx.fillText('⚓', a.x, a.y - sz - 6);
    }
  }
  if (selRectDragging && selRectStart && selRectEnd) {
    const r = canvas.getBoundingClientRect();
    const x1 = selRectStart.x,
      y1 = selRectStart.y,
      x2 = selRectEnd.x,
      y2 = selRectEnd.y;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2 / camera.zoom;
    ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
    ctx.strokeRect(
      (x1 - r.left - camera.x) / camera.zoom,
      (y1 - r.top - camera.y) / camera.zoom,
      (x2 - x1) / camera.zoom,
      (y2 - y1) / camera.zoom,
    );
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(
      (x1 - r.left - camera.x) / camera.zoom,
      (y1 - r.top - camera.y) / camera.zoom,
      (x2 - x1) / camera.zoom,
      (y2 - y1) / camera.zoom,
    );
  }
  ctx.restore();
}

// ========== GAME LOOP ==========
function update(dt) {
  if (paused) return;
  dt = Math.min(dt, 0.05);
  gameTime += dt;
  for (let c of activeCountries) {
    const own = cities.filter((ct) => ct.cid === c.id);
    c.money += own.reduce((s, ct) => s + ct.income, 0) * 0.18 * dt;
  }
  diplomacyTimer += dt;
  if (diplomacyTimer >= 0.5) {
    diplomacyTimer -= 0.5;
    for (let c of activeCountries) c.dp = Math.min(100, (c.dp || 0) + 3);
  }
  armies = armies.filter((a) => !a.dead);
  if (selArmy?.dead) selArmy = null;
  for (let a of [...selArmies]) if (a.dead) selArmies.delete(a);
  for (let a of armies) {
    if (Math.abs(a.knockX) > 0.1 || Math.abs(a.knockY) > 0.1) {
      a.x += a.knockX * dt * 5;
      a.y += a.knockY * dt * 5;
      a.knockX *= 0.85;
      a.knockY *= 0.85;
      if (Math.abs(a.knockX) < 0.1) a.knockX = 0;
      if (Math.abs(a.knockY) < 0.1) a.knockY = 0;
    }
    if (a.ctimer > 0) a.ctimer -= dt;
  }
  combatUpdate();
  for (let a of armies) {
    if (a.dead) continue;
    const nc = cities.find(
      (c) =>
        dist(c.x, c.y, a.x, a.y) < 15 &&
        c.cid !== a.cid &&
        (c.cid === -1 || atWar(a.cid, c.cid)),
    );
    if (nc) captureCity(nc, a.cid);
    if (a.path?.length) {
      const tgt = a.path[0],
        dx = tgt.x - a.x,
        dy = tgt.y - a.y,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < 2) {
        a.path.shift();
        if (!a.path.length) a.path = null;
      } else {
        const spd = a.getEffectiveSpeed(),
          step = Math.min(d, spd * dt);
        a.x += (dx / d) * step;
        a.y += (dy / d) * step;
        if (Math.random() < 0.05) paint(a, 25);
      }
    }
    if (a.morale < 100) a.morale = Math.min(100, a.morale + 5 * dt);
  }
  // Historical WW2 triggers
  if (scenario === 1 && gameState !== 'diplo') {
    if (!ww2FranceUKAttacked && gameTime > 45) {
      if (rels[0][2] > -50) {
        rels[0][2] = rels[2][0] = -60;
        tickerNotify('⚔️ Historical: France declared war on Germany!');
      }
      if (rels[1][2] > -50) {
        rels[1][2] = rels[2][1] = -60;
        tickerNotify('⚔️ Historical: UK declared war on Germany!');
      }
      ww2FranceUKAttacked = true;
      ww2FranceUKAttackTime = gameTime;
    }
    if (
      !ww2ItalyAttacked &&
      ww2FranceUKAttackTime > 0 &&
      gameTime > ww2FranceUKAttackTime + 30
    ) {
      if (rels[4][0] > -50) {
        rels[4][0] = rels[0][4] = -60;
        tickerNotify('⚔️ Historical: Italy declared war on France!');
      }
      if (rels[4][1] > -50) {
        rels[4][1] = rels[1][4] = -60;
        tickerNotify('⚔️ Historical: Italy declared war on UK!');
      }
      ww2ItalyAttacked = true;
    }
    if (
      !ww2USSRattackedPoland &&
      gameTime > 180 &&
      activeCountries.some((c) => c.id === 5)
    ) {
      if (rels[3][5] > -50) {
        rels[3][5] = rels[5][3] = -60;
        tickerNotify('⚔️ Historical: USSR declared war on Poland!');
      }
      ww2USSRattackedPoland = true;
    }
    if (
      !ww2GermanyAttackedUSSR &&
      gameTime > 360 &&
      activeCountries.some((c) => c.id === 3)
    ) {
      if (rels[2][3] > -50) {
        rels[2][3] = rels[3][2] = -60;
        tickerNotify('⚔️ Historical: Germany declared war on USSR!');
      }
      ww2GermanyAttackedUSSR = true;
    }
  }
  // Record stats
  statRecordTimer += dt;
  if (statRecordTimer >= 5 && playerCountry >= 0 && !spectatorMode) {
    statRecordTimer = 0;
    const pc = playerCountry;
    const myArmies = armies.filter((a) => a.cid === pc && !a.dead);
    const power = myArmies.reduce((s, a) => s + a.power, 0);
    let ownedCells = 0,
      totalLandCells = 0;
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++)
        if (grid[y][x].terrain === 'land') {
          totalLandCells++;
          if (grid[y][x].owner === pc) ownedCells++;
        }
    const terrPct =
      totalLandCells > 0 ? Math.round((ownedCells / totalLandCells) * 100) : 0;
    statHistory.push({
      time: gameTime,
      gold: Math.floor(countries[pc].money),
      power,
      territory: terrPct,
      armies: myArmies.length,
    });
    if (statHistory.length > 200)
      statHistory.splice(0, statHistory.length - 200);
    drawHistoryCharts();
  }
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
    const myArmies = armies.filter((a) => a.cid === c.id && !a.dead);
    const enemies = activeCountries.filter((e) => atWar(c.id, e.id));
    const isCustom = scenario === 4 || scenario === 5;

    // ===== ECONOMY =====
    // Recruit more often, up to more armies
    if (
      c.money > 100 &&
      oc.length &&
      Math.random() < 0.5 &&
      myArmies.length < (isCustom ? 25 : 15)
    ) {
      const ct = oc[Math.floor(Math.random() * oc.length)];
      armies.push(
        new Army(
          armies.length,
          c.id,
          ct.x + 25 + (Math.random() - 0.5) * 15,
          ct.y + (Math.random() - 0.5) * 15,
        ),
      );
      c.money -= 100;
    }
    // Upgrade armies that have high strength
    for (let a of myArmies) {
      if (
        c.money >= 50 &&
        a.maxStr < 200 &&
        a.str > a.maxStr * 0.8 &&
        Math.random() < 0.2
      ) {
        a.upgrade();
      }
    }
    // Buy fleets near sea
    if (c.money > 150 && Math.random() < 0.15) {
      const candidates = myArmies.filter((a) => !a.ships);
      if (candidates.length) {
        const candidate =
          candidates[Math.floor(Math.random() * candidates.length)];
        const gx = Math.floor(candidate.x / CELL),
          gy = Math.floor(candidate.y / CELL);
        let nearSea = false;
        for (let dx = -4; dx <= 4 && !nearSea; dx++)
          for (let dy = -4; dy <= 4 && !nearSea; dy++) {
            const nx = gx + dx,
              ny = gy + dy;
            if (
              nx >= 0 &&
              nx < grid[0].length &&
              ny >= 0 &&
              ny < grid.length &&
              grid[ny][nx].terrain === 'sea'
            )
              nearSea = true;
          }
        if (nearSea) {
          candidate.ships = true;
          c.money -= 60;
        }
      }
    }

    // ===== MILITARY TACTICS =====
    const idleArmies = myArmies.filter((a) => !a.garrison && !a.path);
    const frontierArmies = myArmies.filter((a) => !a.dead);

    if (enemies.length) {
      // Identify nearest enemy city as primary target
      let targetCity = null;
      let minDist = Infinity;
      const enemyCities = cities.filter((ct) =>
        enemies.some((e) => e.id === ct.cid),
      );
      if (enemyCities.length > 0) {
        // Find closest enemy city to any of our armies
        for (let a of idleArmies.slice(0, 15)) {
          for (let ec of enemyCities) {
            const d = dist(a.x, a.y, ec.x, ec.y);
            if (d < minDist) {
              minDist = d;
              targetCity = ec;
            }
          }
        }
      }

      if (targetCity) {
        // Send armies to the target in waves
        const attackers = idleArmies.slice(0, isCustom ? 6 : 3);
        for (let a of attackers) {
          // Spread around the target
          const offsetX = (Math.random() - 0.5) * 60;
          const offsetY = (Math.random() - 0.5) * 60;
          const p = findPath(a, targetCity.x + offsetX, targetCity.y + offsetY);
          if (p) a.path = p;
        }
      } else {
        // No enemy cities known - attack nearest enemy army
        const enemyArmies = armies.filter(
          (a) => enemies.some((e) => e.id === a.cid) && !a.dead,
        );
        if (enemyArmies.length > 0 && idleArmies.length > 0) {
          const nearest = enemyArmies
            .slice(0, Math.min(enemyArmies.length, 10))
            .sort(
              (a, b) =>
                dist(a.x, a.y, idleArmies[0].x, idleArmies[0].y) -
                dist(b.x, b.y, idleArmies[0].x, idleArmies[0].y),
            )[0];
          if (nearest) {
            for (let a of idleArmies.slice(0, isCustom ? 5 : 2)) {
              const p = findPath(
                a,
                nearest.x + (Math.random() - 0.5) * 30,
                nearest.y + (Math.random() - 0.5) * 30,
              );
              if (p) a.path = p;
            }
          }
        }
      }

      // Merge nearby friendly armies for larger groups
      if (isCustom && Math.random() < 0.3) {
        for (let a of frontierArmies) {
          if (a.dead || a.path) continue;
          for (let other of frontierArmies) {
            if (other.id === a.id || other.dead || other.path) continue;
            if (dist(a.x, a.y, other.x, other.y) < 50) {
              // One army goes toward the other
              const p = findPath(
                a,
                other.x + (Math.random() - 0.5) * 10,
                other.y + (Math.random() - 0.5) * 10,
              );
              if (p) {
                a.path = p;
                break;
              }
            }
          }
        }
      }
    } else {
      // No enemies: explore/expand
      for (let a of idleArmies.slice(0, isCustom ? 4 : 2)) {
        const unexploredCities = cities.filter((ct) => ct.cid === -1);
        if (unexploredCities.length > 0) {
          const tgt =
            unexploredCities[
              Math.floor(Math.random() * unexploredCities.length)
            ];
          const p = findPath(a, tgt.x, tgt.y);
          if (p) a.path = p;
        } else {
          const dirs = [
            [-60, 0],
            [60, 0],
            [0, -60],
            [0, 60],
            [-40, -40],
            [40, -40],
            [-40, 40],
            [40, 40],
          ];
          const d = dirs[Math.floor(Math.random() * dirs.length)];
          const p = findPath(a, a.x + d[0] * 3, a.y + d[1] * 3);
          if (p) a.path = p;
        }
      }
    }

    // ===== DIPLOMACY =====
    if ((c.dp || 0) >= 20)
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

// ========== HUD ==========
function refreshHUD() {
  if (spectatorMode || playerCountry < 0) return;
  const c = countries[playerCountry];
  if (!c) return;
  const pc = playerCountry;
  document.getElementById('money-display').textContent = Math.floor(c.money);
  document.getElementById('dp-display').textContent = Math.floor(c.dp || 0);
  document.getElementById('city-display').textContent = cities.filter(
    (ct) => ct.cid === pc,
  ).length;
  const myArmies = armies.filter((a) => a.cid === pc && !a.dead);
  document.getElementById('army-display').textContent = myArmies.length;
  document.getElementById('power-display').textContent = myArmies.reduce(
    (s, a) => s + a.power,
    0,
  );
  let ownedCells = 0,
    totalLandCells = 0;
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++)
      if (grid[y][x].terrain === 'land') {
        totalLandCells++;
        if (grid[y][x].owner === pc) ownedCells++;
      }
  document.getElementById('territory-display').textContent =
    ownedCells + ' cells';
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
  const rel = rels[playerCountry][tid] || 0;
  if (rel > -50) {
    notify(`Relations too high (${rel}). Lower them to -50 or below first!`);
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
  if (
    spectatorMode ||
    allied(playerCountry, tid) ||
    atWar(playerCountry, tid)
  ) {
    notify('Cannot ally enemy!');
    return;
  }
  if ((countries[playerCountry].dp || 0) < 30) {
    notify('Need 30 DP!');
    return;
  }
  const rel = rels[playerCountry][tid] || 0;
  if (rel < 50) {
    notify(`Relations too low (${rel}). Raise them to +50 or higher first!`);
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
    d.innerHTML = `<div class="header"><span class="country-name" style="color:${ct.color}">${ct.name}${war ? '<span class="badge-war">WAR</span>' : ''}${ally ? '<span class="badge-ally">ALLY</span>' : ''}</span><span class="rel-value">${rel > 0 ? '+' : ''}${rel}</span></div><div class="actions"><button onclick="changeRel(${ct.id},10)" style="background:#2ecc71;">+10</button><button onclick="changeRel(${ct.id},-10)" style="background:#e74c3c;">-10</button>${!war && !ally ? `<button onclick="declareWar(${ct.id})" style="background:#c0392b;">⚔️WAR</button>` : ''}${!ally && !war ? `<button onclick="formAlliance(${ct.id})" style="background:#27ae60;">🤝ALLY</button>` : ''}${war ? `<button onclick="offerPeace(${ct.id})" style="background:#2980b9;">🕊️PEACE</button>` : ''}</div>`;
    c.appendChild(d);
  }
}

// ========== STATS PANEL ==========
let wasPausedBeforeStats = false;
function openStatsPanel() {
  if (spectatorMode || playerCountry < 0) return;
  const c = countries[playerCountry];
  if (!c) return;
  document.getElementById('stats-overlay').style.display = 'block';
  document.getElementById('stats-panel').style.display = 'block';
  wasPausedBeforeStats = paused;
  paused = true;
  const flagPath = getFlagPath(playerCountry);
  document.getElementById('stats-flag').src = flagPath || '';
  if (!flagPath) {
    document.getElementById('stats-flag').style.display = 'none';
    document.getElementById('stats-flag-container').style.background =
      countries[playerCountry]?.color || '#555';
  } else {
    document.getElementById('stats-flag').style.display = 'block';
    document.getElementById('stats-flag-container').style.background =
      'transparent';
  }
  document.getElementById('stats-country-name').textContent = c.name;
  document.getElementById('stats-ideology').textContent =
    c.ideology || 'Unknown';
  const leaderName = c.leader || 'Unknown';
  document.getElementById('stats-leader-label').textContent = leaderName;
  const leaderImg = document.getElementById('stats-leader-img');
  if (c.leaderImg) {
    leaderImg.src = c.leaderImg;
    leaderImg.style.display = 'block';
  } else {
    leaderImg.style.display = 'none';
  }
  drawHistoryCharts();
}
function closeStatsPanel() {
  document.getElementById('stats-overlay').style.display = 'none';
  document.getElementById('stats-panel').style.display = 'none';
  if (!wasPausedBeforeStats) {
    paused = false;
    document.getElementById('pause-btn').textContent = '⏸️';
  }
}

function drawHistoryCharts() {
  const chartIds = [
    { id: 'hchart-gold', key: 'gold', color: '#ffd700' },
    { id: 'hchart-power', key: 'power', color: '#e94560' },
    { id: 'hchart-territory', key: 'territory', color: '#4ade80' },
    { id: 'hchart-armies', key: 'armies', color: '#64b5f6' },
  ];
  for (const ci of chartIds) {
    const canvas = document.getElementById(ci.id);
    if (!canvas) continue;
    const hctx = canvas.getContext('2d');
    const W = canvas.width,
      H = canvas.height;
    const pad = 8;
    const gw = W - pad * 2,
      gh = H - pad * 2;
    hctx.fillStyle = 'rgba(10,10,25,0.95)';
    hctx.fillRect(0, 0, W, H);
    if (statHistory.length < 2) {
      hctx.fillStyle = '#555';
      hctx.font = '10px Arial';
      hctx.textAlign = 'center';
      hctx.fillText('Collecting data...', W / 2, H / 2);
      continue;
    }
    const data = statHistory;
    let maxVal = Math.max(...data.map((d) => d[ci.key]), 1);
    if (ci.key === 'territory') maxVal = 100;
    hctx.strokeStyle = ci.color;
    hctx.lineWidth = 1.5;
    hctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = pad + (i / (data.length - 1)) * gw;
      const y = pad + gh - (data[i][ci.key] / maxVal) * gh;
      if (i === 0) hctx.moveTo(x, y);
      else hctx.lineTo(x, y);
    }
    hctx.stroke();
  }
}

// ========== ACTIONS ==========
function showActions(actions) {
  const p = document.getElementById('action-panel');
  p.innerHTML = '';
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const b = document.createElement('button');
    b.textContent = a.text;
    b.style.background = a.cl || '#555';
    b.setAttribute('data-idx', i);
    b.onclick = (function (idx) {
      return function () {
        actions[idx].fn();
        p.style.display = 'none';
        refreshHUD();
      };
    })(i);
    p.appendChild(b);
  }
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.background = '#e94560';
  closeBtn.onclick = function () {
    p.style.display = 'none';
  };
  p.appendChild(closeBtn);
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

let mouseDownPos = null,
  mouseDownTime = 0,
  mouseDragging = false,
  mouseDragStart = null,
  mouseDragCam = null;
let selRectStart = null,
  selRectEnd = null,
  selRectDragging = false;

function handleClick(wp, eventOrShift) {
  let shift = false,
    ctrlMeta = false;
  if (typeof eventOrShift === 'boolean') {
    shift = eventOrShift;
  } else if (eventOrShift) {
    shift = eventOrShift.shiftKey;
    ctrlMeta = eventOrShift.ctrlKey || eventOrShift.metaKey;
  }
  if (
    gameState !== 'playing' ||
    document.getElementById('diplo-panel').style.display === 'block' ||
    spectatorMode
  )
    return;
  document.getElementById('action-panel').style.display = 'none';
  const ca = armies.find(
    (a) =>
      !a.dead &&
      dist(a.x, a.y, wp.x, wp.y) < a.size + 8 &&
      a.cid === playerCountry,
  );
  const cc = cities.find(
    (c) => dist(c.x, c.y, wp.x, wp.y) < 18 && c.cid === playerCountry,
  );
  if (ca && (ca === selArmy || selArmies.has(ca))) {
    const selectedArmyIds = new Set();
    if (selArmy) selectedArmyIds.add(selArmy.id);
    for (const sa of selArmies)
      if (!sa.dead && sa.cid === playerCountry) selectedArmyIds.add(sa.id);
    let hasAnyWithoutFleet = false,
      hasAnyWithFleet = false;
    for (const id of selectedArmyIds) {
      const a = armies.find((ar) => ar.id === id && !ar.dead);
      if (!a) continue;
      if (a.ships) hasAnyWithFleet = true;
      else hasAnyWithoutFleet = true;
    }
    const acts = [
      {
        text: '⬆️ Upgrade ($50)',
        cl: '#f39c12',
        fn: () => {
          let upgraded = false;
          for (const id of selectedArmyIds) {
            const a = armies.find((ar) => ar.id === id && !ar.dead);
            if (a && a.upgrade()) upgraded = true;
          }
          if (upgraded) notify('Upgraded!');
          else notify('No upgrades available');
        },
      },
      {
        text: '✂️ Split',
        cl: '#e67e22',
        fn: () => {
          const a = armies.find((ar) => ar.id === ca.id && !ar.dead);
          if (a) splitArmy(a);
        },
      },
    ];
    if (hasAnyWithoutFleet)
      acts.push({
        text: '⚓ Buy Fleet ($60)',
        cl: '#1e88e5',
        fn: () => {
          let bought = false;
          for (const id of selectedArmyIds) {
            const a = armies.find((ar) => ar.id === id && !ar.dead);
            if (a && !a.ships && countries[a.cid].money >= 60) {
              countries[a.cid].money -= 60;
              a.ships = true;
              bought = true;
            }
          }
          if (bought) notify('Fleet purchased!');
          else notify('No funds or already have fleet');
        },
      });
    if (hasAnyWithFleet)
      acts.push({
        text: '🚢 Sell Fleet (+$30)',
        cl: '#e53935',
        fn: () => {
          let sold = false;
          for (const id of selectedArmyIds) {
            const a = armies.find((ar) => ar.id === id && !ar.dead);
            if (a && a.ships) {
              a.ships = false;
              countries[a.cid].money += 30;
              sold = true;
            }
          }
          if (sold) notify('Fleet sold!');
        },
      });
    acts.push({
      text: `🔗 Merge`,
      cl: '#8e44ad',
      fn: () => {
        const ids = [...selectedArmyIds];
        let allClose = true;
        for (let i = 0; i < ids.length && allClose; i++) {
          const a = armies.find((ar) => ar.id === ids[i] && !ar.dead);
          if (!a) continue;
          for (let j = i + 1; j < ids.length && allClose; j++) {
            const b = armies.find((ar) => ar.id === ids[j] && !ar.dead);
            if (!b) continue;
            if (dist(a.x, a.y, b.x, b.y) >= 40) allClose = false;
          }
        }
        if (allClose) {
          const main = armies.find((ar) => ar.id === ids[0] && !ar.dead);
          if (!main) return;
          const toMerge = armies.filter(
            (ar) => !ar.dead && ids.includes(ar.id) && ar.id !== ids[0],
          );
          if (toMerge.length > 0) mergeArmies([main, ...toMerge]);
          else notify('No armies to merge');
        } else {
          walkToMerge(selectedArmyIds);
        }
      },
    });
    showActions(acts);
    return;
  }
  if (cc && (cc === lastCity || selCities.has(cc))) {
    const selectedCityIds = new Set();
    if (lastCity) selectedCityIds.add(lastCity.id);
    for (const sc of selCities)
      if (sc.cid === playerCountry) selectedCityIds.add(sc.id);
    let upgradeCost = 100;
    if (selectedCityIds.size) {
      const firstCity = cities.find((ci) => ci.id === [...selectedCityIds][0]);
      if (firstCity) upgradeCost = 100 * firstCity.lvl;
    }
    showActions([
      {
        text: `⬆️ Upgrade Cities ($${upgradeCost})`,
        cl: '#f39c12',
        fn: () => {
          let upgraded = false;
          for (const id of selectedCityIds) {
            const c = cities.find((ci) => ci.id === id);
            if (c && c.upgrade()) upgraded = true;
          }
          if (upgraded) notify('Cities upgraded!');
          else notify('No upgrades available');
        },
      },
      {
        text: '⚔️ Recruit ($100)',
        cl: '#27ae60',
        fn: () => {
          if (countries[playerCountry].money < 100) {
            notify('Not enough money!');
            return;
          }
          let recruited = 0;
          for (const id of selectedCityIds) {
            if (countries[playerCountry].money < 100) break;
            countries[playerCountry].money -= 100;
            const c = cities.find((ci) => ci.id === id);
            if (c) {
              armies.push(
                new Army(
                  armies.length,
                  playerCountry,
                  c.x + (Math.random() - 0.5) * 20,
                  c.y + (Math.random() - 0.5) * 20,
                ),
              );
              recruited++;
            }
          }
          if (recruited) notify(`Recruited ${recruited} armies!`);
        },
      },
    ]);
    return;
  }
  if (ca) {
    if (shift) {
      if (selArmy) {
        selArmies.add(selArmy);
        selArmy = null;
      }
      if (selArmies.has(ca)) selArmies.delete(ca);
      else selArmies.add(ca);
    } else {
      selArmy = ca;
      selArmies.clear();
      selCities.clear();
      lastCity = null;
    }
    notify(`Selected (${Math.floor(ca.str)})`);
    return;
  }
  if (cc) {
    if (shift) {
      if (lastCity) {
        selCities.add(lastCity);
        lastCity = null;
      }
      if (selCities.has(cc)) selCities.delete(cc);
      else selCities.add(cc);
      notify(`City toggled selection`);
    } else {
      lastCity = cc;
      selCities.clear();
      notify('City selected - tap again for actions');
    }
    return;
  }
  if (selArmy || selArmies.size) {
    const tgts = selArmy ? [selArmy] : [...selArmies];
    let m = 0;
    // Check for Ctrl/Meta (waypoint) or Shift (spread)
    const isWaypoint = ctrlMeta;
    const isSpread = shift;
    for (let a of tgts) {
      if (!a || a.dead || a.cid !== playerCountry) continue;
      let tx = wp.x,
        ty = wp.y;
      if (isSpread) {
        // Spread: each army gets a slightly different offset in the general direction
        const angle = Math.random() * Math.PI * 2;
        const spreadDist = 30 + Math.random() * 40;
        tx += Math.cos(angle) * spreadDist;
        ty += Math.sin(angle) * spreadDist;
      }
      const p = findPath(a, tx, ty);
      if (p) {
        if (isWaypoint && a.path && a.path.length > 0) {
          // Ctrl+click: append to existing path (waypoints)
          a.path = a.path.concat(p);
        } else {
          a.path = p;
        }
        m++;
      }
    }
    if (m) {
      if (isWaypoint) notify(`Waypoint set for ${m}`);
      else if (isSpread) notify(`Spreading ${m}`);
      else notify(`Moving ${m}`);
    } else notify('Blocked');
    return;
  }
  if (!shift) {
    selArmy = null;
    selArmies.clear();
    selCities.clear();
    lastCity = null;
  }
}

canvas.addEventListener('mousedown', (e) => {
  if (gameState !== 'playing') return;
  const wp = getWorld(e.clientX, e.clientY);
  mouseDownPos = wp;
  mouseDownTime = Date.now();
  mouseDragging = false;
  if (e.shiftKey) {
    selRectStart = { x: e.clientX, y: e.clientY };
    selRectEnd = null;
    selRectDragging = false;
  }
  mouseDragStart = { x: e.clientX, y: e.clientY };
  mouseDragCam = { x: camera.tx, y: camera.ty };
});
canvas.addEventListener('mousemove', (e) => {
  if (!mouseDragStart) return;
  const dx = e.clientX - mouseDragStart.x,
    dy = e.clientY - mouseDragStart.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
    if (selRectStart) {
      selRectEnd = { x: e.clientX, y: e.clientY };
      selRectDragging = true;
      mouseDragging = true;
    } else {
      mouseDragging = true;
      camera.tx = mouseDragCam.x + dx;
      camera.ty = mouseDragCam.y + dy;
    }
  }
});
function doRectangleSelect() {
  if (!selRectStart || !selRectEnd) return;
  const r1 = canvas.getBoundingClientRect();
  const x1 =
    (Math.min(selRectStart.x, selRectEnd.x) - r1.left - camera.x) / camera.zoom;
  const y1 =
    (Math.min(selRectStart.y, selRectEnd.y) - r1.top - camera.y) / camera.zoom;
  const x2 =
    (Math.max(selRectStart.x, selRectEnd.x) - r1.left - camera.x) / camera.zoom;
  const y2 =
    (Math.max(selRectStart.y, selRectEnd.y) - r1.top - camera.y) / camera.zoom;
  selArmy = null;
  selArmies.clear();
  selCities.clear();
  lastCity = null;
  let armyCount = 0,
    cityCount = 0;
  for (let a of armies) {
    if (a.dead || a.cid !== playerCountry) continue;
    if (a.x >= x1 && a.x <= x2 && a.y >= y1 && a.y <= y2) {
      selArmies.add(a);
      armyCount++;
    }
  }
  for (let c of cities) {
    if (c.cid !== playerCountry) continue;
    if (c.x >= x1 && c.x <= x2 && c.y >= y1 && c.y <= y2) {
      selCities.add(c);
      cityCount++;
    }
  }
  if (selArmies.size === 1 && selCities.size === 0) {
    selArmy = [...selArmies][0];
    selArmies.clear();
  }
  if (selCities.size === 1 && selArmies.size === 0) {
    lastCity = [...selCities][0];
    selCities.clear();
  }
  if (armyCount > 0 || cityCount > 0)
    notify(`Selected ${armyCount} armies, ${cityCount} cities`);
}
canvas.addEventListener('mouseup', (e) => {
  if (gameState !== 'playing') return;
  if (selRectDragging && selRectStart && selRectEnd) {
    doRectangleSelect();
    selRectStart = null;
    selRectEnd = null;
    selRectDragging = false;
    mouseDownPos = null;
    mouseDragStart = null;
    mouseDragging = false;
    return;
  }
  selRectStart = null;
  selRectEnd = null;
  selRectDragging = false;
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
    camera.tz = Math.min(3, Math.max(0.2, camera.tz - e.deltaY * 0.0008));
    const mx = e.clientX - r.left,
      my = e.clientY - r.top;
    camera.tx = mx - ((mx - camera.x) / camera.zoom) * camera.tz;
    camera.ty = my - ((my - camera.y) / camera.zoom) * camera.tz;
  },
  { passive: false },
);
canvas.oncontextmenu = (e) => e.preventDefault();
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
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
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
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
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
document.addEventListener('keydown', (e) => {
  if (gameState !== 'playing') return;
  if (e.code === 'Space') {
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
        selCities.clear(),
        (document.getElementById('action-panel').style.display = 'none'));
  }
  const isNumber =
    e.code && (e.code.startsWith('Digit') || e.code.startsWith('Numpad'));
  if (!spectatorMode && isNumber) {
    let slot = e.code.startsWith('Digit')
      ? parseInt(e.code.replace('Digit', ''))
      : parseInt(e.code.replace('Numpad', ''));
    if (e.shiftKey) {
      e.preventDefault();
      saveSnippet(slot);
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (snippets[slot]) loadSnippet(slot);
      else notify(`Slot ${slot} is empty`);
    }
  }
});

// ========== MENU ==========
function selectScenario(num) {
  scenario = num;
  const sel = document.getElementById('player-country');
  sel.innerHTML = '';
  const historicalRow = document.getElementById('historical-row');
  const explorationCB = document.getElementById('exploration-mode');
  const diffSelect = document.getElementById('difficulty-select');
  const diffLabel = document.querySelector('#player-options label');
  const diploRow = document.getElementById('diplo-mode-row');
  const landscapeRow = document.getElementById('landscape-row');
  const historicalCB = document.getElementById('historical-mode');

  if (num === 4) {
    sel.add(new Option('Red', '12'));
    sel.add(new Option('Blue', '13'));
    historicalRow.style.display = 'none';
    historicalCB.checked = false;
    explorationCB.parentElement.style.display = 'none';
    landscapeRow.style.display = 'flex';
    diffLabel.style.display = 'block';
    diffSelect.style.display = 'block';
    document.getElementById('country-label').style.display = 'block';
    diploRow.style.display = 'none';
  } else if (num === 5) {
    sel.add(new Option('Red', '12'));
    sel.add(new Option('Yellow', '14'));
    sel.add(new Option('Blue', '13'));
    sel.add(new Option('Green', '15'));
    historicalRow.style.display = 'none';
    historicalCB.checked = false;
    explorationCB.parentElement.style.display = 'none';
    landscapeRow.style.display = 'flex';
    diffLabel.style.display = 'block';
    diffSelect.style.display = 'block';
    document.getElementById('country-label').style.display = 'block';
    diploRow.style.display = 'flex';
  } else if (num === 3) {
    [0, 1, 2, 3, 4, 6, 7, 8, 10, 11].forEach((id) =>
      sel.add(new Option(allCountryDefs[id].name, id.toString())),
    );
    historicalRow.style.display = 'flex';
    explorationCB.parentElement.style.display = 'flex';
    landscapeRow.style.display = 'none';
    diploRow.style.display = 'flex';
  } else if (num === 2) {
    sel.add(new Option('Germany', '2'));
    sel.add(new Option('USSR', '3'));
    historicalRow.style.display = 'flex';
    explorationCB.parentElement.style.display = 'flex';
    landscapeRow.style.display = 'none';
    diploRow.style.display = 'flex';
  } else {
    allCountryDefs
      .slice(0, 10)
      .forEach((c) => sel.add(new Option(c.name, c.id.toString())));
    historicalRow.style.display = 'flex';
    explorationCB.parentElement.style.display = 'flex';
    landscapeRow.style.display = 'none';
    diploRow.style.display = 'flex';
  }
  document.getElementById('scenario-buttons').style.display = 'none';
  document.getElementById('country-select').style.display = 'block';
  historicalCB.checked = true;
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
  useLandscape = document.getElementById('landscape-mode')?.checked || false;

  closeDiplomacy();
  closeStatsPanel();

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

  for (let i = 0; i < 10; i++) snippets[i] = null;
  updateSnippetBar();
  statHistory = [];
  statRecordTimer = 0;

  document.getElementById('menu').style.display = 'none';
  if (spectatorMode) {
    document.getElementById('hud').style.display = 'none';
    document.getElementById('spectator-hud').style.display = 'flex';
  } else {
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('spectator-hud').style.display = 'none';
    const flagEl = document.getElementById('hud-flag');
    const flagPath = getFlagPath(playerCountry);
    if (flagPath) {
      flagEl.innerHTML = `<img src="${flagPath}" alt="flag">`;
      flagEl.style.background = 'transparent';
      flagEl.style.display = 'block';
    } else {
      flagEl.style.display = 'block';
      flagEl.innerHTML = '';
      flagEl.style.background = countries[playerCountry]?.color || '#555';
    }
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const baseMoney =
    difficulty === 'easy' ? 400 : difficulty === 'normal' ? 300 : 200;
  const baseDP = 60;

  let mapW = MAP_W,
    mapH = MAP_H;
  if (scenario === 4 || scenario === 5) {
    mapW = CUSTOM_MAP_W;
    mapH = CUSTOM_MAP_H;
  }

  if (scenario === 4) {
    activeCountries = [
      { ...allCountryDefs[12], money: baseMoney, dp: baseDP },
      { ...allCountryDefs[13], money: baseMoney, dp: baseDP },
    ];
    countries = allCountryDefs.map((d) => ({ ...d, money: 0, dp: 0 }));
    countries[12] = activeCountries[0];
    countries[13] = activeCountries[1];
    rels = Array(countries.length)
      .fill()
      .map(() => Array(countries.length).fill(0));
    rels[12][13] = rels[13][12] = -60;
    const cw = CUSTOM_COLS,
      ch = CUSTOM_ROWS;
    cities = [
      new City(0, 'Red HQ', 12, 100, 700),
      new City(1, 'Blue HQ', 13, 1050, 100),
      new City(2, 'Center', -1, 600, 425),
      new City(3, 'North-West', -1, 300, 150),
      new City(4, 'North-East', -1, 900, 150),
      new City(5, 'South-West', -1, 300, 700),
      new City(6, 'South-East', -1, 900, 700),
    ];
    initGrid();
    if (useLandscape) generateLandscape();
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const wx = x * CELL + CELL / 2,
          wy = y * CELL + CELL / 2;
        const dRed = dist(wx, wy, 100, 700),
          dBlue = dist(wx, wy, 1050, 100);
        if (dRed < 150) grid[y][x].owner = 12;
        else if (dBlue < 150) grid[y][x].owner = 13;
      }
  } else if (scenario === 5) {
    const useDiplo = document.getElementById('diplo-mode').checked;
    activeCountries = [
      { ...allCountryDefs[12], money: baseMoney, dp: baseDP, name: 'Red' },
      { ...allCountryDefs[14], money: baseMoney, dp: baseDP, name: 'Yellow' },
      { ...allCountryDefs[13], money: baseMoney, dp: baseDP, name: 'Blue' },
      { ...allCountryDefs[15], money: baseMoney, dp: baseDP, name: 'Green' },
    ];
    countries = allCountryDefs.map((d) => ({ ...d, money: 0, dp: 0 }));
    countries[12] = activeCountries[0];
    countries[14] = activeCountries[1];
    countries[13] = activeCountries[2];
    countries[15] = activeCountries[3];
    rels = Array(countries.length)
      .fill()
      .map(() => Array(countries.length).fill(0));
    if (!useDiplo) {
      const ids = [12, 14, 13, 15];
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++)
          rels[ids[i]][ids[j]] = rels[ids[j]][ids[i]] = -60;
    }
    const cw = CUSTOM_COLS,
      ch = CUSTOM_ROWS;
    cities = [
      new City(0, 'Red HQ', 12, 100, 700),
      new City(1, 'Yellow HQ', 14, 100, 100),
      new City(2, 'Blue HQ', 13, 1050, 100),
      new City(3, 'Green HQ', 15, 1050, 700),
      new City(4, 'Center', -1, 600, 425),
    ];
    initGrid();
    if (useLandscape) generateLandscape();
    for (let y = 0; y < ch; y++)
      for (let x = 0; x < cw; x++) {
        const wx = x * CELL + CELL / 2,
          wy = y * CELL + CELL / 2;
        if (grid[y][x].terrain === 'sea') continue;
        const dRed = dist(wx, wy, 100, 700),
          dYel = dist(wx, wy, 100, 100),
          dBlu = dist(wx, wy, 1050, 100),
          dGrn = dist(wx, wy, 1050, 700);
        if (dRed < 150) grid[y][x].owner = 12;
        else if (dYel < 150) grid[y][x].owner = 14;
        else if (dBlu < 150) grid[y][x].owner = 13;
        else if (dGrn < 150) grid[y][x].owner = 15;
      }
  } else {
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
      } else if (scenario === 2) sr(2, 3, -60);
      else if (scenario === 3) {
        const cp = [2, 10, 11],
          en = [0, 1, 3, 4];
        for (let c of cp) for (let e of en) sr(c, e, -60);
        for (let i = 0; i < cp.length; i++)
          for (let j = i + 1; j < cp.length; j++) sr(cp[i], cp[j], 60);
        for (let i = 0; i < en.length; i++)
          for (let j = i + 1; j < en.length; j++) sr(en[i], en[j], 60);
      }
    } else if (scenario === 1) {
      // If not historical mode, set all to enemies
      for (let c of activeCountries)
        for (let o of activeCountries)
          if (c.id !== o.id && Math.random() < 0.3) sr(c.id, o.id, -60);
    }
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
    armies = [];
    selArmy = null;
    selArmies.clear();
    selCities.clear();
    for (let c of activeCountries) {
      let borderKey = c.name;
      if (c.id === 3) borderKey = 'Russia';
      const border = countryBorders[borderKey];
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
        armies.push(
          new Army(armies.length, c.id, ct.x - 15, ct.y + 12, 95, 95),
        );
      }
    }
  }

  if (scenario === 4 || scenario === 5) {
    armies = [];
    selArmy = null;
    selArmies.clear();
    selCities.clear();
    for (let c of activeCountries) {
      const myCities = cities.filter((ct) => ct.cid === c.id);
      for (let ct of myCities) {
        for (let k = 0; k < 4; k++)
          armies.push(
            new Army(
              armies.length,
              c.id,
              ct.x + 15 + (Math.random() - 0.5) * 30,
              ct.y + (Math.random() - 0.5) * 30,
              100,
              100,
            ),
          );
        for (let k = 0; k < 4; k++)
          armies.push(
            new Army(
              armies.length,
              c.id,
              ct.x - 15 + (Math.random() - 0.5) * 30,
              ct.y + 12 + (Math.random() - 0.5) * 30,
              95,
              95,
            ),
          );
      }
    }
  }

  if (scenario !== 4 && scenario !== 5) initGrid();
  drawMap();

  camera.tz = 0.55;
  camera.tx = canvas.width / 2 - (mapW * camera.tz) / 2;
  camera.ty = canvas.height / 2 - (mapH * camera.tz) / 2;
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

function generateLandscape() {
  const cols = grid[0].length,
    rows = grid.length;
  // Add some random seas
  for (let i = 0; i < 15; i++) {
    const cx = Math.floor(Math.random() * cols),
      cy = Math.floor(Math.random() * rows);
    const r = 3 + Math.floor(Math.random() * 6);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        // Don't place sea on city positions
        let isCity = false;
        for (const city of cities) {
          const gx = Math.floor(city.x / CELL),
            gy = Math.floor(city.y / CELL);
          if (Math.abs(nx - gx) < 4 && Math.abs(ny - gy) < 4) {
            isCity = true;
            break;
          }
        }
        if (!isCity) grid[ny][nx].terrain = 'sea';
      }
  }
  // Add some random mountains
  for (let i = 0; i < 10; i++) {
    const cx = Math.floor(Math.random() * cols),
      cy = Math.floor(Math.random() * rows);
    const r = 2 + Math.floor(Math.random() * 4);
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        let isCity = false;
        for (const city of cities) {
          const gx = Math.floor(city.x / CELL),
            gy = Math.floor(city.y / CELL);
          if (Math.abs(nx - gx) < 4 && Math.abs(ny - gy) < 4) {
            isCity = true;
            break;
          }
        }
        if (!isCity && grid[ny][nx].terrain !== 'sea')
          grid[ny][nx].terrain = 'mtn';
      }
  }
}

function returnToMenu() {
  if (!confirm('Are you sure you want to quit?')) return;
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
    'stats-panel',
    'stats-overlay',
  ].forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  });
  paused = false;
}

function togglePause() {
  if (document.getElementById('diplo-panel').style.display === 'block') return;
  paused = !paused;
  const b = document.getElementById('pause-btn'),
    sb = document.getElementById('spectator-pause-btn');
  if (b) b.textContent = paused ? '▶️' : '⏸️';
  if (sb) sb.textContent = paused ? '▶️' : '⏸️';
  if (!paused) refreshHUD();
}

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
document.addEventListener('DOMContentLoaded', () => {
  closeDiplomacy();
  closeStatsPanel();
});

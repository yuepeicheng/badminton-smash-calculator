// --- Elements ---
const fileInput = document.getElementById('fileInput');
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const statusEl = document.getElementById('status');

const knownMetersEl = document.getElementById('knownMeters');
const btnCalibrate = document.getElementById('btnCalibrate');
const btnResetCalib = document.getElementById('btnResetCalib');
const calibReadout = document.getElementById('calibReadout');

const btnMarkA = document.getElementById('btnMarkA');
const btnMarkB = document.getElementById('btnMarkB');
const btnResetAB = document.getElementById('btnResetAB');
const abReadout = document.getElementById('abReadout');

const skewDegEl = document.getElementById('skewDeg');
const resultsEl = document.getElementById('results');

const ctx = overlay.getContext('2d');

// --- State ---
let mode = 'idle'; // 'calib1' | 'calib2' | 'markA' | 'markB' | 'idle'
let calib = { p1: null, p2: null, metersPerPixel: null, pxDist: null };
let A = null; // {nx, ny, t}
let B = null;

// --- Helpers ---
function setStatus(msg) {
  statusEl.textContent = msg || '';
}
function fmt(n, digits = 3) {
  if (!isFinite(n)) return '—';
  return Number(n).toFixed(digits);
}
function toRad(deg) {
  return (Number(deg) || 0) * Math.PI / 180;
}
function clearAB() {
  A = null; B = null;
  abReadout.textContent = 'A/B: not set';
  draw();
  compute();
}
function clearCalib() {
  calib = { p1: null, p2: null, metersPerPixel: null, pxDist: null };
  calibReadout.textContent = 'Calibration: not set';
  draw();
  compute();
}
function normFromEvent(ev) {
  const rect = overlay.getBoundingClientRect();
  const nx = (ev.clientX - rect.left) / rect.width;
  const ny = (ev.clientY - rect.top) / rect.height;
  return { nx: Math.min(Math.max(nx, 0), 1), ny: Math.min(Math.max(ny, 0), 1) };
}
function pxDistBetween(p1, p2) {
  // Convert normalized coords to intrinsic pixels (video videoWidth/Height)
  const dx = (p2.nx - p1.nx) * video.videoWidth;
  const dy = (p2.ny - p1.ny) * video.videoHeight;
  return Math.hypot(dx, dy);
}
function draw() {
  // Match canvas to element size
  overlay.width = overlay.clientWidth;
  overlay.height = overlay.clientHeight;
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  function drawPoint(p, color) {
    if (!p) return;
    const x = p.nx * overlay.width;
    const y = p.ny * overlay.height;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  function drawLine(p1, p2, color) {
    if (!p1 || !p2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.nx * overlay.width, p1.ny * overlay.height);
    ctx.lineTo(p2.nx * overlay.width, p2.ny * overlay.height);
    ctx.stroke();
  }

  // Calibration in gold
  drawLine(calib.p1, calib.p2, '#ffcc4d');
  drawPoint(calib.p1, '#ffcc4d');
  drawPoint(calib.p2, '#ffcc4d');

  // Shuttle A/B (A=blue, B=red)
  drawLine(A, B, '#6db5ff');
  drawPoint(A, '#6db5ff');
  drawPoint(B, '#ff6b6b');
}

function compute() {
  let info = {
    distance_m: null,
    dt_s: null,
    speed_mps: null,
    speed_kmh: null,
    speed_mph: null
  };

  // Calibration
  if (calib.p1 && calib.p2) {
    const knownMeters = Number(knownMetersEl.value);
    const px = pxDistBetween(calib.p1, calib.p2);
    if (knownMeters > 0 && px > 0) {
      calib.pxDist = px;
      calib.metersPerPixel = knownMeters / px;
      calibReadout.innerHTML = `Calibration: ${fmt(knownMeters, 3)} m over ${fmt(px, 1)} px → <strong>${fmt(calib.metersPerPixel, 6)} m/px</strong>`;
    } else {
      calibReadout.textContent = 'Calibration: waiting for valid known distance and two clicks.';
      calib.metersPerPixel = null;
    }
  }

  // A/B
  if (A && B) {
    const pxAB = pxDistBetween(A, B);
    const dt = Math.abs((A.t ?? video.currentTime) - (B.t ?? video.currentTime));
    abReadout.textContent = `A: t=${fmt(A?.t, 3)} s • B: t=${fmt(B?.t, 3)} s • Δpx=${fmt(pxAB, 1)} • Δt=${fmt(dt, 4)} s`;

    if (calib.metersPerPixel && dt > 0) {
      let d = pxAB * calib.metersPerPixel; // meters
      const theta = toRad(skewDegEl.value);
      const corrected = Math.cos(theta) || 1; // avoid NaN
      const v = (d / dt) / corrected;

      info.distance_m = d;
      info.dt_s = dt;
      info.speed_mps = v;
      info.speed_kmh = v * 3.6;
      info.speed_mph = v * 2.236936;

      resultsEl.innerHTML = `
        <div><strong>Distance (m):</strong> ${fmt(d, 3)}</div>
        <div><strong>Δt (s):</strong> ${fmt(dt, 4)}</div>
        <div><strong>Speed (m/s):</strong> ${fmt(v, 3)}</div>
        <div><strong>Speed (km/h):</strong> ${fmt(info.speed_kmh, 2)}</div>
        <div><strong>Speed (mph):</strong> ${fmt(info.speed_mph, 2)}</div>
        <div class="small">Skew correction factor: 1/cos(${fmt(Number(skewDegEl.value) || 0,1)}°)</div>
      `;
    }
  }

  return info;
}

// --- Event wiring ---
fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  clearCalib();
  clearAB();
  const url = URL.createObjectURL(file);
  video.src = url;
  setStatus('Video loaded. Pause on a frame, then click points.');
});

video.addEventListener('loadedmetadata', () => {
  // size overlay to video element
  const resize = () => draw();
  new ResizeObserver(resize).observe(overlay);
  draw();
});

btnCalibrate.addEventListener('click', () => {
  const L = Number(knownMetersEl.value);
  if (!(L > 0)) {
    setStatus('Enter a valid known distance in meters before calibrating.');
    knownMetersEl.focus();
    return;
  }
  calib.p1 = null; calib.p2 = null; calib.metersPerPixel = null; calib.pxDist = null;
  mode = 'calib1';
  setStatus('Calibration: click point 1 on the video.');
  draw();
});

btnResetCalib.addEventListener('click', () => {
  clearCalib();
  setStatus('Calibration reset.');
});

btnMarkA.addEventListener('click', () => {
  mode = 'markA';
  setStatus('Mark A: pause video at time t₁ and click the shuttle.');
});

btnMarkB.addEventListener('click', () => {
  mode = 'markB';
  setStatus('Mark B: pause video at time t₂ and click the shuttle.');
});

btnResetAB.addEventListener('click', () => {
  clearAB();
  setStatus('Cleared A/B.');
});

overlay.addEventListener('click', ev => {
  const p = normFromEvent(ev);

  if (mode === 'calib1') {
    calib.p1 = { nx: p.nx, ny: p.ny };
    mode = 'calib2';
    setStatus('Calibration: click point 2.');
    draw();
  } else if (mode === 'calib2') {
    calib.p2 = { nx: p.nx, ny: p.ny };
    mode = 'idle';
    setStatus('Calibration set.');
    draw();
    compute();
  } else if (mode === 'markA') {
    A = { nx: p.nx, ny: p.ny, t: video.currentTime };
    mode = 'idle';
    setStatus('Marked A.');
    draw();
    compute();
  } else if (mode === 'markB') {
    B = { nx: p.nx, ny: p.ny, t: video.currentTime };
    mode = 'idle';
    setStatus('Marked B.');
    draw();
    compute();
  } else {
    // idle: ignore clicks (prevents accidental marks)
  }
});

[knownMetersEl, skewDegEl].forEach(el => {
  el.addEventListener('input', compute);
});

// Keep overlay synced on window resize
window.addEventListener('resize', draw);

/* app.js
   Client-side calculator for:
   v0 = (e^(k_x * x(t)) - 1) / (k_x * t * cos(theta))

   - Everything runs locally in the user's browser (no server).
   - Edit the UI default values in index.html, or change defaultKx below.
   - The UI also includes a visible kx input; if you prefer to "hardcode" kx,
     set defaultKx and optionally hide the input in index.html/CSS.
*/

/* -------------------------
   Config / default constants
   -------------------------
   If you want to hardcode kx in the source file instead of the input,
   update `defaultKx` and (optionally) remove or hide the kx input from index.html.
*/
const defaultKx = 0.05; // <-- placeholder: replace this with your measured k_x if desired

/* -------------------------
   DOM element references
   ------------------------- */
const el = {
  distance: document.getElementById('inputDistance'),
  time: document.getElementById('inputTime'),
  angle: document.getElementById('inputAngle'),
  kx: document.getElementById('inputKx'),

  btnCalc: document.getElementById('btnCalc'),
  btnClear: document.getElementById('btnClear'),

  outMps: document.getElementById('outMps'),
  outKmh: document.getElementById('outKmh'),
  outMph: document.getElementById('outMph'),
  outNotes: document.getElementById('outNotes'),

  resultCard: document.getElementById('resultCard'),
  errorBox: document.getElementById('error'),
  varSelect: document.getElementById('varSelect'),
  varExplain: document.getElementById('varExplain')
};

/* Initialize visible kx input with default fallback */
if (!el.kx.value) {
  el.kx.value = defaultKx;
}

/* Utility formatting helpers */
function fmt(n, dp = 3) {
  if (!isFinite(n)) return '—';
  return Number(n).toFixed(dp);
}

/* Show/hide helpers */
function showError(msg) {
  el.errorBox.textContent = msg;
  el.errorBox.classList.remove('hidden');
}
function hideError() {
  el.errorBox.textContent = '';
  el.errorBox.classList.add('hidden');
}
function showResults() {
  el.resultCard.classList.remove('hidden');
}
function hideResults() {
  el.resultCard.classList.add('hidden');
}

/* Core calculation:
   v0 = (exp(kx * x) - 1) / (kx * t * cos(theta))
   All inputs should be numbers; theta must be converted to radians.
*/
function calculateV0(x, t, thetaDegrees, kx) {
  // Convert angle to radians
  const thetaRad = (Number(thetaDegrees) || 0) * Math.PI / 180;

  // Numerator: exp(kx * x) - 1
  const numerator = Math.exp(kx * x) - 1;

  // Denominator: kx * t * cos(theta)
  const cosTheta = Math.cos(thetaRad);
  const denominator = kx * t * cosTheta;

  // Guard against invalid denom (near zero)
  if (Math.abs(denominator) < 1e-12) {
    return { error: 'Denominator too small — check t and θ (cos θ should not be 0).' };
  }

  const v0 = numerator / denominator;
  return { v0, numerator, denominator, cosTheta, thetaRad };
}

/* Button handlers */
el.btnCalc.addEventListener('click', () => {
  hideError();

  // Parse inputs
  const x = Number(el.distance.value);
  const t = Number(el.time.value);
  const theta = Number(el.angle.value);
  const kx = Number(el.kx.value);

  // Basic validation — you can add stronger checks if needed
  if (!isFinite(x) || !isFinite(t) || !isFinite(theta) || !isFinite(kx)) {
    showError('Please enter valid numeric values for all fields.');
    hideResults();
    return;
  }
  if (t <= 0) {
    showError('Time must be > 0 seconds.');
    hideResults();
    return;
  }
  if (kx === 0) {
    showError('kₓ must be non-zero for this formula.');
    hideResults();
    return;
  }

  // Run calculation
  const res = calculateV0(x, t, theta, kx);
  if (res.error) {
    showError(res.error);
    hideResults();
    return;
  }

  const v0 = res.v0;
  // Set outputs & conversions
  const v_kmh = v0 * 3.6;
  const v_mph = v0 * 2.236936;

  el.outMps.textContent = `${fmt(v0, 3)} m/s`;
  el.outKmh.textContent = `${fmt(v_kmh, 2)} km/h`;
  el.outMph.textContent = `${fmt(v_mph, 2)} mph`;

  // Small note about numeric stability and assumptions
  el.outNotes.innerHTML = `
    <strong>Notes:</strong> numerator = exp(kₓ·x) − 1 = ${fmt(res.numerator,4)}; cos(θ) = ${fmt(res.cosTheta,4)}.
    Results sensitive to kₓ and θ measurement errors. See methodology for validation tips.
  `;

  showResults();
});

/* Reset / clear */
el.btnClear.addEventListener('click', () => {
  // Reset to defaults found in index.html; if you want different defaults, edit index.html values.
  el.distance.value = 5.00;
  el.time.value = 0.2;
  el.angle.value = 5;
  el.kx.value = defaultKx;
  hideError();
  hideResults();
});

/* Variable explanation dropdown (select) — small UI behavior */
el.varSelect.addEventListener('change', (ev) => {
  const v = ev.target.value;
  if (!v) {
    el.varExplain.textContent = 'Select a variable to see a short explanation.';
    return;
  }
  let text = '';
  switch (v) {
    case 'x':
      text = 'x(t): measured distance travelled by the shuttle (meters). Use the same measurement units as kₓ (meters).';
      break;
    case 't':
      text = 't: measured time interval (seconds) during which the shuttle covered distance x(t). Should be > 0.';
      break;
    case 'theta':
      text = 'θ: launch angle (degrees) relative to a horizontal reference. Small angles (near 0°) are common for smashes; cos θ is used in the denominator.';
      break;
    case 'kx':
      text = 'kₓ: model constant (units 1/m). This parameter models exponential decay/growth used in the derivation. Calibrate experimentally or enter a literature / fitted value.';
      break;
    default:
      text = '';
  }
  el.varExplain.textContent = text;
});

/* Small UX: hide results initially */
hideResults();
hideError();

/* Optional: expose calculate function to console for debugging / quick checks */
window._debug_calc = function(x,t,theta,kx){ return calculateV0(x,t,theta,kx); };

/* End of app.js */

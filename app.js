/* app.js — Defensive version with debugging & user-visible errors
   Replace your existing app.js with this file.
   Key improvements:
   - Waits for DOMContentLoaded before grabbing elements.
   - Validates all required DOM elements exist and shows a clear message if not.
   - Catches runtime errors and prints them to console + the on-page error box.
   - Adds a small "debug" output in console to show input values.
   - Keeps original formula and conversions.
*/

/* ------------ Utility / config ------------ */
const defaultKx = 0.05; // placeholder — change to your measured k_x if you wish

// formatting helper
function fmt(n, dp = 3) {
  if (!isFinite(n)) return '—';
  return Number(n).toFixed(dp);
}

/* ------------ DOM-ready wrapper ------------ */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Grab elements
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

    // Check all required elements exist — if any are missing, show error and abort.
    const missing = Object.entries(el).filter(([k, v]) => v === null).map(([k]) => k);
    if (missing.length) {
      const msg = `ERROR: Missing DOM elements: ${missing.join(', ')}. Check that IDs in index.html match those in app.js (case-sensitive).`;
      console.error(msg);
      // If we have an error box element, show this; otherwise alert.
      const errorBox = document.getElementById('error');
      if (errorBox) {
        errorBox.classList.remove('hidden');
        errorBox.textContent = msg;
      } else {
        alert(msg);
      }
      return; // stop — elements missing
    }

    // Init kx input if empty
    if (!el.kx.value) el.kx.value = defaultKx;

    // show/hide helpers
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

    // Core calculation function
    function calculateV0(x, t, thetaDegrees, kx) {
      const thetaRad = (Number(thetaDegrees) || 0) * Math.PI / 180;
      const numerator = Math.exp(kx * x) - 1;
      const cosTheta = Math.cos(thetaRad);
      const denominator = kx * t * cosTheta;

      if (!isFinite(numerator) || !isFinite(denominator)) {
        return { error: 'Non-finite intermediate result; check inputs.' };
      }
      if (Math.abs(denominator) < 1e-12) {
        return { error: 'Denominator is too small (near zero). Check time t and angle θ.' };
      }
      const v0 = numerator / denominator;
      return { v0, numerator, denominator, cosTheta, thetaRad };
    }

    // Button click handler
    el.btnCalc.addEventListener('click', () => {
      try {
        hideError();

        const x = Number(el.distance.value);
        const t = Number(el.time.value);
        const theta = Number(el.angle.value);
        const kx = Number(el.kx.value);

        // Basic validation
        if (![x,t,theta,kx].every(v => isFinite(v))) {
          showError('Please enter valid numeric values for all fields.');
          hideResults();
          console.log('Invalid numeric inputs:', {x,t,theta,kx});
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

        // Debug: echo inputs to console so you can see them quickly
        console.log('Calculate clicked — inputs:', { x, t, theta, kx });

        // Compute
        const res = calculateV0(x, t, theta, kx);
        if (res.error) {
          showError(res.error);
          hideResults();
          console.error('Calculation error:', res.error);
          return;
        }

        const v0 = res.v0;
        const v_kmh = v0 * 3.6;
        const v_mph = v0 * 2.236936;

        el.outMps.textContent = `${fmt(v0, 3)} m/s`;
        el.outKmh.textContent = `${fmt(v_kmh, 2)} km/h`;
        el.outMph.textContent = `${fmt(v_mph, 2)} mph`;

        el.outNotes.innerHTML = `
          <strong>Notes:</strong> numerator = exp(kₓ·x) − 1 = ${fmt(res.numerator,4)}; cos(θ) = ${fmt(res.cosTheta,4)}.
          Results sensitive to kₓ and θ measurement errors.
        `;
        showResults();
      } catch (err) {
        // Catch unexpected runtime errors
        console.error('Unexpected error in calculation handler:', err);
        showError('Unexpected error occurred. See console for details.');
        hideResults();
      }
    });

    // Reset handler
    el.btnClear.addEventListener('click', () => {
      try {
        el.distance.value = 5.00;
        el.time.value = 0.2;
        el.angle.value = 5;
        el.kx.value = defaultKx;
        hideError();
        hideResults();
        console.log('Reset values to defaults.');
      } catch (err) {
        console.error('Error during reset:', err);
      }
    });

    // Variable explanation dropdown (UI)
    el.varSelect.addEventListener('change', (ev) => {
      const v = ev.target.value;
      if (!v) {
        el.varExplain.textContent = 'Select a variable to see a short explanation.';
        return;
      }
      let text = '';
      switch (v) {
        case 'x':
          text = 'x(t): measured distance travelled by the shuttle (meters). Use same units as kₓ.';
          break;
        case 't':
          text = 't: measured time interval (seconds).';
          break;
        case 'theta':
          text = 'θ: launch angle in degrees relative to horizontal. cos(θ) in denominator reduces speed when θ increases.';
          break;
        case 'kx':
          text = 'kₓ: model constant (1/m). Calibrate experimentally; it crucially affects the result.';
          break;
      }
      el.varExplain.textContent = text;
    });

    // Keyboard convenience: press Enter inside any input to compute
    ['inputDistance','inputTime','inputAngle','inputKx'].forEach(id => {
      const node = document.getElementById(id);
      if (node) {
        node.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            el.btnCalc.click();
          }
        });
      }
    });

    // initial hide
    hideResults();
    hideError();

    console.log('app.js loaded successfully (defensive mode).');
  } catch (outerErr) {
    console.error('Fatal error while initializing app.js:', outerErr);
    const box = document.getElementById('error');
    if (box) {
      box.classList.remove('hidden');
      box.textContent = 'Fatal initialization error — check console for details.';
    } else {
      alert('Fatal initialization error — check console for details.');
    }
  }
}); // DOMContentLoaded end

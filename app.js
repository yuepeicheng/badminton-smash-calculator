/* app.js — Non-video defensive version (no canvas/video references)
   Replace your existing app.js with this file.
   This version:
   - Does NOT reference overlay/video or call getContext().
   - Validates DOM elements and reports clear errors.
   - Implements the formula: v0 = (e^(k_x * x) - 1) / (k_x * t * cos(theta))
   - Has keyboard "Enter" binding, reset button, and variable explanations.
*/

const defaultKx = 0.05; // placeholder — change to your measured k_x if you wish

function fmt(n, dp = 3) {
  if (!isFinite(n)) return '—';
  return Number(n).toFixed(dp);
}

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

    // Check existence of required elements
    const missing = Object.entries(el).filter(([k,v]) => v === null).map(([k]) => k);
    if (missing.length) {
      const msg = `MISSING DOM ELEMENTS: ${missing.join(', ')}. Check IDs in index.html (case-sensitive).`;
      console.error(msg);
      const box = document.getElementById('error');
      if (box) {
        box.classList.remove('hidden');
        box.textContent = msg;
      } else {
        alert(msg);
      }
      return;
    }

    // Initialize kx input if empty
    if (!el.kx.value) el.kx.value = defaultKx;

    // Helpers
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

    // Calculation core
    function calculateV0(x, t, thetaDegrees, kx) {
      const thetaRad = (Number(thetaDegrees) || 0) * Math.PI / 180;
      const numerator = Math.exp(kx * x) - 1;
      const cosTheta = Math.cos(thetaRad);
      const denominator = kx * t * cosTheta;

      if (!isFinite(numerator) || !isFinite(denominator)) {
        return { error: 'Non-finite intermediate result; check inputs.' };
      }
      if (Math.abs(denominator) < 1e-12) {
        return { error: 'Denominator too small (near zero). Check t and θ.' };
      }

      return { v0: numerator / denominator, numerator, denominator, cosTheta, thetaRad };
    }

    // Button handlers
    el.btnCalc.addEventListener('click', () => {
      try {
        hideError();

        const x = Number(el.distance.value);
        const t = Number(el.time.value);
        const theta = Number(el.angle.value);
        const kx = Number(el.kx.value);

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

        console.log('Inputs:', { x, t, theta, kx });

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

        el.outMps.textContent = `${fmt(v0,3)} m/s`;
        el.outKmh.textContent = `${fmt(v_kmh,2)} km/h`;
        el.outMph.textContent = `${fmt(v_mph,2)} mph`;
        el.outNotes.innerHTML = `
          <strong>Notes:</strong> numerator = exp(kₓ·x) − 1 = ${fmt(res.numerator,4)}; cos(θ) = ${fmt(res.cosTheta,4)}.
          Results sensitive to kₓ and θ errors.
        `;

        showResults();
      } catch (err) {
        console.error('Unexpected error in calc handler:', err);
        showError('Unexpected error — see console for details.');
        hideResults();
      }
    });

    // Reset
    el.btnClear.addEventListener('click', () => {
      el.distance.value = 5.00;
      el.time.value = 0.2;
      el.angle.value = 5;
      el.kx.value = defaultKx;
      hideError();
      hideResults();
      console.log('Reset to defaults.');
    });

    // Variable explain select
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
          text = 'θ: launch angle (degrees).';
          break;
        case 'kx':
          text = 'kₓ: model constant (1/m). Calibrate experimentally.';
          break;
      }
      el.varExplain.textContent = text;
    });

    // Enter key -> calculate
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

    // initial state
    hideResults();
    hideError();

    console.log('app.js loaded (non-video defensive).');
    // Expose debug function
    window._debug_calc = (x,t,theta,kx) => calculateV0(x,t,theta,kx);
  } catch (err) {
    console.error('Fatal init error in app.js:', err);
    const box = document.getElementById('error');
    if (box) {
      box.classList.remove('hidden');
      box.textContent = 'Fatal initialization error — check console.';
    } else {
      alert('Fatal initialization error — check console.');
    }
  }
});

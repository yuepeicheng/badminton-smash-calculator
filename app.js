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

// Video analysis variables
let startTime = null;
let endTime = null;

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

    // ===== VIDEO ANALYSIS FUNCTIONALITY =====
    initVideoAnalysis();

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

// Video Analysis Functions
function initVideoAnalysis() {
  const videoUpload = document.getElementById('videoUpload');
  const videoContainer = document.getElementById('videoContainer');
  const videoPlayer = document.getElementById('videoPlayer');
  const btnSetStart = document.getElementById('btnSetStart');
  const btnSetEnd = document.getElementById('btnSetEnd');
  const btnUseTime = document.getElementById('btnUseTime');
  const startTimeDisplay = document.getElementById('startTimeDisplay');
  const endTimeDisplay = document.getElementById('endTimeDisplay');
  const timeDiffValue = document.getElementById('timeDiffValue');
  const timeDiffResult = document.getElementById('timeDiffResult');

  if (!videoUpload || !videoContainer || !videoPlayer) {
    console.log('Video analysis elements not found - skipping video functionality');
    return;
  }

  // Handle video file upload
  videoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      videoPlayer.src = url;
      videoContainer.classList.remove('hidden');

      // Reset markers
      startTime = null;
      endTime = null;
      startTimeDisplay.textContent = '--:--';
      endTimeDisplay.textContent = '--:--';
      timeDiffResult.classList.add('hidden');

      console.log('Video loaded:', file.name);
    }
  });

  // Format time as MM:SS.mmm
  function formatTime(seconds) {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }

  // Set start point
  btnSetStart.addEventListener('click', () => {
    if (videoPlayer.src && !videoPlayer.paused) {
      startTime = videoPlayer.currentTime;
      startTimeDisplay.textContent = formatTime(startTime);
      console.log('Start time set:', startTime);
      updateTimeDifference();
    } else if (!videoPlayer.src) {
      alert('Please upload a video first');
    } else {
      alert('Please play the video and pause/click when you want to mark the start point');
    }
  });

  // Set end point
  btnSetEnd.addEventListener('click', () => {
    if (videoPlayer.src && !videoPlayer.paused) {
      endTime = videoPlayer.currentTime;
      endTimeDisplay.textContent = formatTime(endTime);
      console.log('End time set:', endTime);
      updateTimeDifference();
    } else if (!videoPlayer.src) {
      alert('Please upload a video first');
    } else {
      alert('Please play the video and pause/click when you want to mark the end point');
    }
  });

  // Calculate and display time difference
  function updateTimeDifference() {
    if (startTime !== null && endTime !== null) {
      const diff = Math.abs(endTime - startTime);
      timeDiffValue.textContent = diff.toFixed(3);
      timeDiffResult.classList.remove('hidden');
      console.log('Time difference:', diff);
    }
  }

  // Use calculated time in the main calculator
  btnUseTime.addEventListener('click', () => {
    if (startTime !== null && endTime !== null) {
      const diff = Math.abs(endTime - startTime);
      const timeInput = document.getElementById('inputTime');
      if (timeInput) {
        timeInput.value = diff.toFixed(3);
        // Scroll to calculator section
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
        console.log('Time value transferred to calculator:', diff);

        // Optional: highlight the time input briefly
        timeInput.style.background = 'rgba(74,163,255,0.2)';
        setTimeout(() => {
          timeInput.style.background = '';
        }, 1000);
      }
    }
  });

  // Allow setting markers by clicking on the video while it's playing
  videoPlayer.addEventListener('click', () => {
    if (!videoPlayer.paused) {
      // Could add logic here to auto-set start/end based on clicks
      videoPlayer.pause();
    }
  });

  console.log('Video analysis initialized');
}

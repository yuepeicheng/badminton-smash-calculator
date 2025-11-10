/* app.js — Non-video defensive version (no canvas/video references)
   Replace your existing app.js with this file.
   This version:
   - Does NOT reference overlay/video or call getContext().
   - Validates DOM elements and reports clear errors.
   - Implements the formula: v0 = (e^(k_x * x) - 1) / (k_x * t * cos(theta))
   - Has keyboard "Enter" binding, reset button, and variable explanations.
*/

const defaultKx = 0.2; // Default drag constant (hidden from user interface)

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
      btnCalc: document.getElementById('btnCalc'),
      btnClear: document.getElementById('btnClear'),
      outMps: document.getElementById('outMps'),
      outKmh: document.getElementById('outKmh'),
      outMph: document.getElementById('outMph'),
      outNotes: document.getElementById('outNotes'),
      resultCard: document.getElementById('resultCard'),
      errorBox: document.getElementById('error')
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
        const kx = defaultKx; // Use the default constant

        if (![x,t,theta].every(v => isFinite(v))) {
          showError('Please enter valid numeric values for all fields.');
          hideResults();
          console.log('Invalid numeric inputs:', {x,t,theta});
          return;
        }
        if (t <= 0) {
          showError('Time must be > 0 seconds.');
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
      el.distance.value = 9.50;
      el.time.value = 0.5;
      el.angle.value = 8;
      hideError();
      hideResults();
      console.log('Reset to defaults.');
    });

    // Enter key -> calculate
    ['inputDistance','inputTime','inputAngle'].forEach(id => {
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

// Video Analysis Functions with Dual Slider
function initVideoAnalysis() {
  const videoUpload = document.getElementById('videoUpload');
  const videoContainer = document.getElementById('videoContainer');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoUploadArea = document.querySelector('.video-upload-area');
  const closeVideoBtn = document.getElementById('closeVideoBtn');
  const startSlider = document.getElementById('startSlider');
  const endSlider = document.getElementById('endSlider');
  const sliderRange = document.getElementById('sliderRange');
  const startTimeDisplay = document.getElementById('startTimeDisplay');
  const endTimeDisplay = document.getElementById('endTimeDisplay');
  const timeDiffValue = document.getElementById('timeDiffValue');
  const btnUseTime = document.getElementById('btnUseTime');

  if (!videoUpload || !videoContainer || !videoPlayer) {
    console.log('Video analysis elements not found - skipping video functionality');
    return;
  }

  let videoDuration = 0;

  // Format time as M:SS.mmm
  function formatTime(seconds) {
    if (seconds === null || seconds === undefined || !isFinite(seconds)) return '0:00.000';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`;
  }

  // Update slider range visualization
  function updateSliderRange() {
    const startVal = parseFloat(startSlider.value);
    const endVal = parseFloat(endSlider.value);

    const minVal = Math.min(startVal, endVal);
    const maxVal = Math.max(startVal, endVal);

    const percentStart = minVal;
    const percentEnd = maxVal;

    sliderRange.style.left = percentStart + '%';
    sliderRange.style.width = (percentEnd - percentStart) + '%';
  }

  // Update time displays
  function updateTimeDisplays() {
    const startPercent = parseFloat(startSlider.value) / 100;
    const endPercent = parseFloat(endSlider.value) / 100;

    startTime = startPercent * videoDuration;
    endTime = endPercent * videoDuration;

    startTimeDisplay.textContent = formatTime(startTime);
    endTimeDisplay.textContent = formatTime(endTime);

    const diff = Math.abs(endTime - startTime);
    timeDiffValue.textContent = diff.toFixed(3) + 's';

    updateSliderRange();
  }

  // Handle video file upload
  videoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      videoPlayer.src = url;

      videoPlayer.addEventListener('loadedmetadata', () => {
        videoDuration = videoPlayer.duration;
        videoContainer.classList.remove('hidden');
        // Hide the upload box after video is uploaded
        if (videoUploadArea) {
          videoUploadArea.classList.add('hidden');
        }

        // Initialize sliders
        startSlider.value = 0;
        endSlider.value = 100;

        updateTimeDisplays();
        console.log('Video loaded:', file.name, 'Duration:', videoDuration);
      });
    }
  });

  // Handle close video button
  if (closeVideoBtn) {
    closeVideoBtn.addEventListener('click', () => {
      // Hide video container
      videoContainer.classList.add('hidden');
      // Show upload area again
      if (videoUploadArea) {
        videoUploadArea.classList.remove('hidden');
      }
      // Reset video
      videoPlayer.src = '';
      videoUpload.value = '';
      videoDuration = 0;
      console.log('Video closed, ready for new upload');
    });
  }

  // Slider event listeners
  startSlider.addEventListener('input', () => {
    // Ensure start doesn't go past end
    if (parseFloat(startSlider.value) > parseFloat(endSlider.value)) {
      endSlider.value = startSlider.value;
    }
    updateTimeDisplays();

    // Seek video to start time
    if (videoDuration > 0) {
      videoPlayer.currentTime = startTime;
    }
  });

  endSlider.addEventListener('input', () => {
    // Ensure end doesn't go before start
    if (parseFloat(endSlider.value) < parseFloat(startSlider.value)) {
      startSlider.value = endSlider.value;
    }
    updateTimeDisplays();

    // Seek video to end time
    if (videoDuration > 0) {
      videoPlayer.currentTime = endTime;
    }
  });

  // Use calculated time in the main calculator
  btnUseTime.addEventListener('click', () => {
    const diff = Math.abs(endTime - startTime);
    const timeInput = document.getElementById('inputTime');
    if (timeInput && diff > 0) {
      timeInput.value = diff.toFixed(3);

      // Highlight the time input briefly with modern animation
      timeInput.style.transition = 'all 0.3s ease';
      timeInput.style.borderColor = 'var(--accent)';
      timeInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';

      setTimeout(() => {
        timeInput.style.borderColor = '';
        timeInput.style.boxShadow = '';
      }, 1500);

      console.log('Time value transferred to calculator:', diff);
    }
  });

  // Update sliders when video time changes (optional sync)
  videoPlayer.addEventListener('timeupdate', () => {
    // This could be used to sync sliders with video playback if desired
  });

  console.log('Video analysis with dual slider initialized');
}

// Angle Measurement Tool
function initAngleTool() {
  const canvas = document.getElementById('angleCanvas');
  const angleValue = document.getElementById('angleValue');
  const btnUseAngle = document.getElementById('btnUseAngle');

  if (!canvas || !angleValue || !btnUseAngle) {
    console.log('Angle tool elements not found - skipping angle tool functionality');
    return;
  }

  const ctx = canvas.getContext('2d');

  // State variables
  let baseLineStart = { x: 150, y: 200 };
  let baseLineEnd = { x: 450, y: 200 };
  let angleLineEnd = { x: 450, y: 100 };
  let dragging = null;
  let currentAngle = 0;

  // Calculate angle between two lines
  function calculateAngle() {
    // Vector from base line start to end
    const baseVector = {
      x: baseLineEnd.x - baseLineStart.x,
      y: baseLineEnd.y - baseLineStart.y
    };

    // Vector from base line end to angle line end
    const angleVector = {
      x: angleLineEnd.x - baseLineEnd.x,
      y: angleLineEnd.y - baseLineEnd.y
    };

    // Calculate angle using atan2
    const baseAngle = Math.atan2(baseVector.y, baseVector.x);
    const lineAngle = Math.atan2(angleVector.y, angleVector.x);

    // Get the difference and convert to degrees
    let angle = (lineAngle - baseAngle) * (180 / Math.PI);

    // Normalize to 0-360 range
    if (angle < 0) angle += 360;

    // Return the acute angle (0-180)
    if (angle > 180) angle = 360 - angle;

    return angle;
  }

  // Draw the angle measurement tool
  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Style settings
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Draw base line (horizontal reference)
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(baseLineStart.x, baseLineStart.y);
    ctx.lineTo(baseLineEnd.x, baseLineEnd.y);
    ctx.stroke();

    // Draw angle line (adjustable)
    ctx.strokeStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(baseLineEnd.x, baseLineEnd.y);
    ctx.lineTo(angleLineEnd.x, angleLineEnd.y);
    ctx.stroke();

    // Draw angle arc
    const radius = 50;
    const baseAngle = Math.atan2(baseLineEnd.y - baseLineStart.y, baseLineEnd.x - baseLineStart.x);
    const lineAngle = Math.atan2(angleLineEnd.y - baseLineEnd.y, angleLineEnd.x - baseLineEnd.x);

    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.beginPath();
    ctx.arc(baseLineEnd.x, baseLineEnd.y, radius, baseAngle, lineAngle, lineAngle < baseAngle);
    ctx.stroke();
    ctx.lineTo(baseLineEnd.x, baseLineEnd.y);
    ctx.closePath();
    ctx.fill();

    // Draw control points
    const drawPoint = (point, color) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    };

    drawPoint(baseLineStart, '#3b82f6');
    drawPoint(baseLineEnd, '#10b981');
    drawPoint(angleLineEnd, '#60a5fa');

    // Update angle display
    currentAngle = calculateAngle();
    angleValue.textContent = currentAngle.toFixed(1) + '°';
  }

  // Get mouse position relative to canvas
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  // Check if mouse is near a point
  function isNearPoint(mouse, point, threshold = 15) {
    const dx = mouse.x - point.x;
    const dy = mouse.y - point.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  // Mouse event handlers
  canvas.addEventListener('mousedown', (e) => {
    const mouse = getMousePos(e);

    if (isNearPoint(mouse, baseLineStart)) {
      dragging = 'baseStart';
    } else if (isNearPoint(mouse, baseLineEnd)) {
      dragging = 'baseEnd';
    } else if (isNearPoint(mouse, angleLineEnd)) {
      dragging = 'angleEnd';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const mouse = getMousePos(e);

    // Update cursor
    if (isNearPoint(mouse, baseLineStart) || isNearPoint(mouse, baseLineEnd) || isNearPoint(mouse, angleLineEnd)) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }

    if (dragging) {
      if (dragging === 'baseStart') {
        baseLineStart = mouse;
      } else if (dragging === 'baseEnd') {
        baseLineEnd = mouse;
        // Keep angle line attached to base line end
      } else if (dragging === 'angleEnd') {
        angleLineEnd = mouse;
      }
      draw();
    }
  });

  canvas.addEventListener('mouseup', () => {
    dragging = null;
  });

  canvas.addEventListener('mouseleave', () => {
    dragging = null;
    canvas.style.cursor = 'crosshair';
  });

  // Use angle button
  btnUseAngle.addEventListener('click', () => {
    const angleInput = document.getElementById('inputAngle');
    if (angleInput && currentAngle > 0) {
      angleInput.value = currentAngle.toFixed(1);

      // Highlight the angle input briefly
      angleInput.style.transition = 'all 0.3s ease';
      angleInput.style.borderColor = 'var(--accent)';
      angleInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';

      setTimeout(() => {
        angleInput.style.borderColor = '';
        angleInput.style.boxShadow = '';
      }, 1500);

      console.log('Angle value transferred to calculator:', currentAngle.toFixed(1));
    }
  });

  // Initial draw
  draw();
  console.log('Angle measurement tool initialized');
}

// Initialize angle tool when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initAngleTool();
});

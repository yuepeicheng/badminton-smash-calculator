/* app.js — Non-video defensive version (no canvas/video references)
   Replace your existing app.js with this file.
   This version:
   - Does NOT reference overlay/video or call getContext().
   - Validates DOM elements and reports clear errors.
   - Implements the formula: v0 = (e^(k_x * x) - 1) / (k_x * t * cos(theta))
   - Has keyboard "Enter" binding, reset button, and variable explanations.
*/

const defaultKx = 0.20324632; // Default drag constant (hidden from user interface)

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
      el.distance.value = '';
      el.time.value = '';
      el.angle.value = '';
      hideError();
      hideResults();
      console.log('Fields cleared.');
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

    // ===== DISTANCE BUTTONS =====
    const distanceButtons = document.querySelectorAll('.use-distance-btn');
    distanceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const distance = btn.getAttribute('data-distance');
        if (distance && el.distance) {
          el.distance.value = distance;

          // Highlight the distance input briefly with modern animation
          el.distance.style.transition = 'all 0.3s ease';
          el.distance.style.borderColor = 'var(--accent)';
          el.distance.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';

          setTimeout(() => {
            el.distance.style.borderColor = '';
            el.distance.style.boxShadow = '';
          }, 1500);

          console.log('Distance value transferred to calculator:', distance);
        }
      });
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

  // Keyboard frame navigation for time tool (moves sliders frame-by-frame)
  const frameRate = 30; // Assume 30fps, adjust based on video if needed

  document.addEventListener('keydown', (e) => {
    // Only work if video is loaded and not hidden
    if (!videoContainer.classList.contains('hidden') && videoDuration > 0) {
      const frameTime = 1 / frameRate; // Time per frame in seconds
      const framePercent = (frameTime / videoDuration) * 100; // Convert to percentage

      // Check which slider is focused
      const focusedSlider = document.activeElement === startSlider ? startSlider :
                            document.activeElement === endSlider ? endSlider : null;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (focusedSlider) {
          focusedSlider.value = Math.max(0, parseFloat(focusedSlider.value) - framePercent);
          updateTimeDisplays();
          const isStartSlider = focusedSlider === startSlider;
          videoPlayer.currentTime = isStartSlider ? startTime : endTime;
          console.log('Frame left:', focusedSlider.value);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (focusedSlider) {
          focusedSlider.value = Math.min(100, parseFloat(focusedSlider.value) + framePercent);
          updateTimeDisplays();
          const isStartSlider = focusedSlider === startSlider;
          videoPlayer.currentTime = isStartSlider ? startTime : endTime;
          console.log('Frame right:', focusedSlider.value);
        }
      }
    }
  });

  console.log('Video analysis with dual slider initialized');
}

// Angle Measurement Tool
function initAngleTool() {
  const canvas = document.getElementById('angleCanvas');
  const angleValue = document.getElementById('angleValue');
  const btnUseAngle = document.getElementById('btnUseAngle');
  const angleVideoPlayer = document.getElementById('angleVideoPlayer');
  const btnFreezeVideo = document.getElementById('btnFreezeVideo');
  const btnUnfreezeVideo = document.getElementById('btnUnfreezeVideo');
  const btnFlipAngle = document.getElementById('btnFlipAngle');

  if (!canvas || !angleValue || !btnUseAngle) {
    console.log('Angle tool elements not found - skipping angle tool functionality');
    return;
  }

  const ctx = canvas.getContext('2d');

  // State variables
  let baseLineStart = { x: 150, y: 200 };
  let baseLineEnd = { x: 450, y: 200 };
  let angleLineEnd = { x: 350, y: 300 };
  let dragging = null;
  let currentAngle = 0;
  let isFlipped = false;
  let frozenFrame = null;

  // Sync video with main video player and use start time
  function syncVideoWithMain() {
    const mainVideoPlayer = document.getElementById('videoPlayer');
    if (mainVideoPlayer && mainVideoPlayer.src && angleVideoPlayer) {
      angleVideoPlayer.src = mainVideoPlayer.src;
      // Use the start time from the time tool
      angleVideoPlayer.currentTime = startTime || 0;
      angleVideoPlayer.classList.remove('hidden');

      // Show freeze button when video is loaded
      if (btnFreezeVideo) btnFreezeVideo.classList.remove('hidden');

      console.log('Video synced to angle tool at time:', startTime || 0);
    }
  }

  // Listen for video uploads on main player
  const mainVideoUpload = document.getElementById('videoUpload');
  if (mainVideoUpload) {
    mainVideoUpload.addEventListener('change', () => {
      setTimeout(syncVideoWithMain, 500);
    });
  }

  // Listen for "Use This Time" button to sync the start time
  const btnUseTime = document.getElementById('btnUseTime');
  if (btnUseTime) {
    btnUseTime.addEventListener('click', () => {
      setTimeout(() => {
        if (angleVideoPlayer && angleVideoPlayer.src) {
          angleVideoPlayer.currentTime = startTime || 0;
          console.log('Angle tool video synced to start time:', startTime);
        }
      }, 100);
    });
  }

  // Frame navigation
  const btnPrevFrame = document.getElementById('btnPrevFrame');
  const btnNextFrame = document.getElementById('btnNextFrame');
  const frameRate = 30; // Assume 30fps, adjust based on video if needed

  function captureFrame() {
    if (!angleVideoPlayer) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Calculate aspect ratio fit
    const videoAspect = angleVideoPlayer.videoWidth / angleVideoPlayer.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (videoAspect > canvasAspect) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / videoAspect;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * videoAspect;
      offsetX = (canvas.width - drawWidth) / 2;
      offsetY = 0;
    }

    tempCtx.drawImage(angleVideoPlayer, offsetX, offsetY, drawWidth, drawHeight);
    frozenFrame = tempCanvas;
    draw();
  }

  // Freeze/Unfreeze functionality
  if (btnFreezeVideo) {
    btnFreezeVideo.addEventListener('click', () => {
      if (angleVideoPlayer) {
        angleVideoPlayer.pause();
        captureFrame();

        btnFreezeVideo.classList.add('hidden');
        if (btnUnfreezeVideo) btnUnfreezeVideo.classList.remove('hidden');
        if (btnPrevFrame) btnPrevFrame.classList.remove('hidden');
        if (btnNextFrame) btnNextFrame.classList.remove('hidden');

        console.log('Frame frozen at time:', angleVideoPlayer.currentTime);
      }
    });
  }

  if (btnPrevFrame) {
    btnPrevFrame.addEventListener('click', () => {
      if (angleVideoPlayer) {
        angleVideoPlayer.currentTime = Math.max(0, angleVideoPlayer.currentTime - (1/frameRate));
        setTimeout(captureFrame, 50);
      }
    });
  }

  if (btnNextFrame) {
    btnNextFrame.addEventListener('click', () => {
      if (angleVideoPlayer) {
        angleVideoPlayer.currentTime = Math.min(angleVideoPlayer.duration, angleVideoPlayer.currentTime + (1/frameRate));
        setTimeout(captureFrame, 50);
      }
    });
  }

  if (btnUnfreezeVideo) {
    btnUnfreezeVideo.addEventListener('click', () => {
      frozenFrame = null;
      if (angleVideoPlayer) angleVideoPlayer.play();

      btnUnfreezeVideo.classList.add('hidden');
      if (btnFreezeVideo) btnFreezeVideo.classList.remove('hidden');
      if (btnPrevFrame) btnPrevFrame.classList.add('hidden');
      if (btnNextFrame) btnNextFrame.classList.add('hidden');

      draw();
      console.log('Frame unfrozen');
    });
  }

  // Flip functionality
  if (btnFlipAngle) {
    btnFlipAngle.addEventListener('click', () => {
      isFlipped = !isFlipped;

      // Swap the base line endpoints to flip direction
      const temp = baseLineStart;
      baseLineStart = baseLineEnd;
      baseLineEnd = temp;

      // Flip the angle line position to the opposite side
      // Calculate the perpendicular to maintain acute angle on the other side
      const baseVecX = baseLineEnd.x - baseLineStart.x;
      const baseVecY = baseLineEnd.y - baseLineStart.y;

      // Current angle line relative to base endpoint
      const currentVecX = angleLineEnd.x - baseLineEnd.x;
      const currentVecY = angleLineEnd.y - baseLineEnd.y;

      // Reflect across the base line
      const dotProduct = (currentVecX * baseVecX + currentVecY * baseVecY);
      const baseMagSq = baseVecX * baseVecX + baseVecY * baseVecY;

      const projX = (dotProduct / baseMagSq) * baseVecX;
      const projY = (dotProduct / baseMagSq) * baseVecY;

      angleLineEnd.x = baseLineEnd.x + 2 * projX - currentVecX;
      angleLineEnd.y = baseLineEnd.y + 2 * projY - currentVecY;

      draw();
      console.log('Angle measurement flipped');
    });
  }

  // Calculate angle (always 0-90 degrees acute angle between lines A-B and B-C)
  function calculateAngle() {
    // Vector from A to B (base line)
    const baseVecX = baseLineEnd.x - baseLineStart.x;
    const baseVecY = baseLineEnd.y - baseLineStart.y;

    // Vector from B to C (angle line)
    const angleVecX = angleLineEnd.x - baseLineEnd.x;
    const angleVecY = angleLineEnd.y - baseLineEnd.y;

    // Calculate angle between the two vectors using dot product
    const dotProduct = baseVecX * angleVecX + baseVecY * angleVecY;
    const baseMag = Math.sqrt(baseVecX * baseVecX + baseVecY * baseVecY);
    const angleMag = Math.sqrt(angleVecX * angleVecX + angleVecY * angleVecY);

    // Calculate angle in radians then convert to degrees
    let angle = Math.acos(dotProduct / (baseMag * angleMag)) * (180 / Math.PI);

    // Ensure we always return an acute angle (0-90 degrees)
    if (angle > 90) {
      angle = 180 - angle;
    }

    return Math.max(0, Math.min(90, angle));
  }

  // Draw the angle measurement tool
  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw frozen frame if available
    if (frozenFrame) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(frozenFrame, 0, 0);
      ctx.globalAlpha = 1.0;
    }

    // Style settings
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Draw base line (horizontal reference) - force it to be horizontal
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(baseLineStart.x, baseLineStart.y);
    ctx.lineTo(baseLineEnd.x, baseLineStart.y); // Force same Y coordinate
    ctx.stroke();

    // Draw angle line (adjustable, constrained to go downward)
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(baseLineEnd.x, baseLineStart.y);
    ctx.lineTo(angleLineEnd.x, angleLineEnd.y);
    ctx.stroke();

    const radius = 60;

    // Base vector (A → B)
    const baseVec = {
      x: baseLineEnd.x - baseLineStart.x,
      y: baseLineEnd.y - baseLineStart.y,
    };

    // Angle vector (B → C)
    const angleVec = {
      x: angleLineEnd.x - baseLineEnd.x,
      y: angleLineEnd.y - baseLineEnd.y,
    };

    // Angles from x-axis
    const targetAngle = Math.atan2(angleVec.y, angleVec.x);

    // The arc should go from the BC line back to the BA line (opposite direction of base vector)
    // This creates a proper angle measurement between the two lines
    const arcStartAngle = targetAngle;
    // arcEndAngle points backwards along the base line (BA direction, opposite of AB)
    const arcEndAngle = Math.atan2(-baseVec.y, -baseVec.x);

    // Determine direction: if C is above the AB line, go counter-clockwise; if below, go clockwise
    const anticlockwise = angleVec.y < 0;

    // Draw the inside (acute/interior) arc
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
      baseLineEnd.x,
      baseLineEnd.y,
      radius,
      arcStartAngle,
      arcEndAngle,
      anticlockwise
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(baseLineEnd.x, baseLineEnd.y);
    ctx.arc(
      baseLineEnd.x,
      baseLineEnd.y,
      radius,
      arcStartAngle,
      arcEndAngle,
      anticlockwise
    );
    ctx.closePath();
    ctx.fill();

    // Draw control points
    const drawPoint = (point, color, label) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, point.x, point.y - 15);
    };

    drawPoint(baseLineStart, '#3b82f6', 'A');
    drawPoint({ x: baseLineEnd.x, y: baseLineStart.y }, '#10b981', 'B');
    drawPoint(angleLineEnd, '#60a5fa', 'C');

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
  function isNearPoint(mouse, point, threshold = 20) {
    const dx = mouse.x - point.x;
    const dy = mouse.y - point.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  // Mouse event handlers
  canvas.addEventListener('mousedown', (e) => {
    const mouse = getMousePos(e);

    if (isNearPoint(mouse, baseLineStart)) {
      dragging = 'baseStart';
    } else if (isNearPoint(mouse, { x: baseLineEnd.x, y: baseLineStart.y })) {
      dragging = 'baseEnd';
    } else if (isNearPoint(mouse, angleLineEnd)) {
      dragging = 'angleEnd';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const mouse = getMousePos(e);

    // Update cursor
    if (isNearPoint(mouse, baseLineStart) ||
        isNearPoint(mouse, { x: baseLineEnd.x, y: baseLineStart.y }) ||
        isNearPoint(mouse, angleLineEnd)) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'crosshair';
    }

    if (dragging) {
      if (dragging === 'baseStart') {
        // Move entire horizontal line
        const deltaY = mouse.y - baseLineStart.y;
        baseLineStart = mouse;
        baseLineEnd.y = baseLineStart.y; // Keep horizontal
        angleLineEnd.y += deltaY;
      } else if (dragging === 'baseEnd') {
        // Move the end point, but keep it horizontal
        baseLineEnd.x = mouse.x;
        baseLineEnd.y = baseLineStart.y; // Force horizontal
      } else if (dragging === 'angleEnd') {
        // Constrain angle line endpoint
        // Only allow movement below the horizontal line (positive Y direction)
        angleLineEnd.x = mouse.x;
        angleLineEnd.y = Math.max(baseLineStart.y, mouse.y); // Force it to be at or below horizontal line

        // No need to constrain further - full 0-90 degrees is allowed
        // The angle is always between horizontal (0°) and vertical (90°) as long as dy >= 0
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
    if (angleInput) {
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

# badminton-smash-calculator
A browser-based tool to estimate badminton smash speed without fancy equipment.  All computation runs locally in the browser—no uploads.

**Method summary**
- Calibrate distance by clicking two court points with known real-world separation (e.g., singles width 5.18 m).
- Mark shuttle positions at times t1 and t2 (paused frames). The app measures pixel distance Δpx and time Δt from the video.
- Speed v = (Δpx × metersPerPixel) / Δt. Optional skew correction v' = v / cos(θ).

**Accuracy tips**
- Use a long calibration baseline (full width/length).
- Perpendicular camera angle, high frame rate, sharp frames.
- Repeat measurements and average.

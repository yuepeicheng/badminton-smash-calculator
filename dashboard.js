// ===== DASHBOARD MODULE =====
// All data fetched from the Spring Boot backend.
// API_BASE is declared in auth.js which loads first.

let progressionChart = null;
let allRecords = [];
let activeTimeframe = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();

  document.getElementById('timeframeButtons').addEventListener('click', e => {
    const btn = e.target.closest('[data-tf]');
    if (!btn) return;
    activeTimeframe = btn.dataset.tf;
    document.querySelectorAll('#timeframeButtons [data-tf]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const deduped = deduplicateByDay(allRecords);
    const filtered = filterByTimeframe(deduped, activeTimeframe);
    if (filtered.length === 0) {
      document.getElementById('noDataMsg').classList.remove('hidden');
      if (progressionChart) { progressionChart.destroy(); progressionChart = null; }
    } else {
      document.getElementById('noDataMsg').classList.add('hidden');
      renderChart(filtered, activeTimeframe);
    }
  });
});

/**
 * Initialize the dashboard: verify session then load data.
 */
async function initDashboard() {
  const sessionId = localStorage.getItem('sessionId');

  if (!sessionId) {
    document.getElementById('dashboardLogin').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'X-Session-Id': sessionId }
    });
    const data = await res.json();

    if (!data.success) {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('username');
      document.getElementById('dashboardLogin').classList.remove('hidden');
      document.getElementById('dashboardContent').classList.add('hidden');
      return;
    }

    document.getElementById('dashboardLogin').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');

    loadProgression(sessionId);
    loadLeaderboard(data.username);
  } catch {
    // Backend unreachable
    document.getElementById('dashboardLogin').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
  }
}

/**
 * Load and render the progression chart from the backend.
 */
async function loadProgression(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/api/records/progression`, {
      headers: { 'X-Session-Id': sessionId }
    });
    const records = await res.json();

    if (!Array.isArray(records) || records.length === 0) {
      document.getElementById('noDataMsg').classList.remove('hidden');
      return;
    }

    allRecords = records;
    const deduped = deduplicateByDay(allRecords);
    const filtered = filterByTimeframe(deduped, activeTimeframe);
    document.getElementById('noDataMsg').classList.add('hidden');
    renderChart(filtered, activeTimeframe);
  } catch {
    document.getElementById('noDataMsg').classList.remove('hidden');
  }
}

/**
 * Collapse same-day records, keeping the highest speed per day.
 * Returns [{day: 'YYYY-MM-DD', speedKmh: number}] sorted ascending.
 */
function deduplicateByDay(records) {
  const byDay = {};
  for (const r of records) {
    const day = r.date.slice(0, 10);
    if (!byDay[day] || r.speedKmh > byDay[day]) {
      byDay[day] = r.speedKmh;
    }
  }
  return Object.keys(byDay).sort().map(day => ({ day, speedKmh: byDay[day] }));
}

/**
 * Filter deduped records to a timeframe window.
 */
function filterByTimeframe(dedupedRecords, timeframe) {
  if (timeframe === 'all') return dedupedRecords;
  const now = new Date();
  const cutoff = new Date(now);
  if (timeframe === 'week')  cutoff.setDate(now.getDate() - 7);
  if (timeframe === 'month') cutoff.setMonth(now.getMonth() - 1);
  if (timeframe === 'year')  cutoff.setFullYear(now.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return dedupedRecords.filter(r => r.day >= cutoffStr);
}

/**
 * Render the Chart.js line chart.
 * @param {Array<{day: string, speedKmh: number}>} records - deduped+filtered records
 * @param {string} timeframe - active timeframe ('week'|'month'|'year'|'all')
 */
function renderChart(records, timeframe) {
  const ctx = document.getElementById('progressionChart').getContext('2d');

  // Use {x: Date, y: speed} so Chart.js time scale positions points by real date
  const dataPoints = records.map(r => {
    const [year, month, day] = r.day.split('-').map(Number);
    return { x: new Date(year, month - 1, day), y: Math.round(r.speedKmh * 100) / 100 };
  });

  if (progressionChart) {
    progressionChart.destroy();
  }

  progressionChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        data: dataPoints,
        borderColor: '#FF9500',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0,
        pointBackgroundColor: '#FF9500',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            tooltipFormat: 'MMM d, yyyy',
            displayFormats: {
              day: 'MMM d',
              week: 'MMM d',
              month: 'MMM yyyy',
              year: 'yyyy'
            }
          },
          ticks: { display: false },
          grid: { color: 'rgba(58, 58, 58, 0.8)' }
        },
        y: {
          min: 50,
          max: 400,
          ticks: { color: '#808080' },
          grid: { color: 'rgba(58, 58, 58, 0.8)' },
          title: { display: true, text: 'Speed (km/h)', color: '#808080' }
        }
      }
    }
  });
}

/**
 * Load and render the global leaderboard from the backend.
 */
async function loadLeaderboard(currentUsername) {
  try {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    const entries = await res.json();

    if (!Array.isArray(entries) || entries.length === 0) {
      document.getElementById('leaderboardTable').classList.add('hidden');
      document.getElementById('emptyLeaderboard').classList.remove('hidden');
      return;
    }

    document.getElementById('leaderboardTable').classList.remove('hidden');
    document.getElementById('emptyLeaderboard').classList.add('hidden');

    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    entries.forEach(entry => {
      const row = document.createElement('tr');
      const isCurrentUser = entry.username === currentUsername;
      if (isCurrentUser) row.classList.add('current-user-row');

      row.innerHTML = `
        <td class="rank-cell">${entry.rank}</td>
        <td class="player-cell">${entry.username}${isCurrentUser ? ' (you)' : ''}</td>
        <td class="speed-cell">${entry.bestSpeedKmh} km/h</td>
        <td class="smashes-cell">${entry.totalSmashes}</td>
      `;
      tbody.appendChild(row);
    });
  } catch {
    document.getElementById('leaderboardTable').classList.add('hidden');
    document.getElementById('emptyLeaderboard').classList.remove('hidden');
  }
}

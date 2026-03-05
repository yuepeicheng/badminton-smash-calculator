// ===== DASHBOARD MODULE =====
// All data fetched from the Spring Boot backend.

const API_BASE = 'http://localhost:8080';

let progressionChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
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

    document.getElementById('noDataMsg').classList.add('hidden');
    renderChart(records);
  } catch {
    document.getElementById('noDataMsg').classList.remove('hidden');
  }
}

/**
 * Render the Chart.js line chart.
 */
function renderChart(records) {
  const ctx = document.getElementById('progressionChart').getContext('2d');

  const labels = records.map(r => {
    const d = new Date(r.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const speeds = records.map(r => Math.round(r.speedKmh * 100) / 100);

  if (progressionChart) {
    progressionChart.destroy();
  }

  progressionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Smash Speed (km/h)',
        data: speeds,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#cbd5e1', font: { family: 'Inter' } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(51, 65, 85, 0.5)' }
        },
        y: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(51, 65, 85, 0.5)' },
          title: { display: true, text: 'Speed (km/h)', color: '#94a3b8' }
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

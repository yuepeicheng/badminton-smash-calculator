// ===== DASHBOARD MODULE =====
// Handles progression chart and global leaderboard display.

const API_BASE = 'http://localhost:8080/api';

let progressionChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

/**
 * Initialize the dashboard: check login state and load data.
 */
async function initDashboard() {
  const sessionId = localStorage.getItem('sessionId');

  if (!sessionId) {
    // Not logged in — show login prompt
    document.getElementById('dashboardLogin').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    return;
  }

  try {
    // Check if session is valid
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'X-Session-Id': sessionId }
    });
    const data = await res.json();

    if (!data.success) {
      document.getElementById('dashboardLogin').classList.remove('hidden');
      document.getElementById('dashboardContent').classList.add('hidden');
      return;
    }

    // Session valid — show dashboard
    document.getElementById('dashboardLogin').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');

    // Load data in parallel
    loadProgression(sessionId);
    loadLeaderboard(data.username);
  } catch (err) {
    console.log('Backend not running — dashboard disabled');
    document.getElementById('dashboardLogin').innerHTML =
      '<h2>Cannot connect to server</h2><p>Make sure the backend is running: <code>cd backend && mvn spring-boot:run</code></p>';
  }
}

/**
 * Load and render the progression chart.
 */
async function loadProgression(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/records/progression`, {
      headers: { 'X-Session-Id': sessionId }
    });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById('noDataMsg').classList.remove('hidden');
      return;
    }

    document.getElementById('noDataMsg').classList.add('hidden');
    renderChart(data);
  } catch (err) {
    console.error('Failed to load progression:', err);
  }
}

/**
 * Render the Chart.js line chart.
 */
function renderChart(records) {
  const ctx = document.getElementById('progressionChart').getContext('2d');

  // Format dates for display
  const labels = records.map(r => {
    const d = new Date(r.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const speeds = records.map(r => Math.round(r.speedKmh * 100) / 100);

  // Destroy existing chart if re-rendering
  if (progressionChart) {
    progressionChart.destroy();
  }

  progressionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
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
          labels: {
            color: '#cbd5e1',
            font: { family: 'Inter' }
          }
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
          title: {
            display: true,
            text: 'Speed (km/h)',
            color: '#94a3b8'
          }
        }
      }
    }
  });
}

/**
 * Load and render the global leaderboard.
 */
async function loadLeaderboard(currentUsername) {
  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById('leaderboardTable').classList.add('hidden');
      document.getElementById('emptyLeaderboard').classList.remove('hidden');
      return;
    }

    document.getElementById('leaderboardTable').classList.remove('hidden');
    document.getElementById('emptyLeaderboard').classList.add('hidden');

    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    for (const entry of data) {
      const row = document.createElement('tr');
      const isCurrentUser = entry.username === currentUsername;

      if (isCurrentUser) {
        row.classList.add('current-user-row');
      }

      row.innerHTML = `
        <td class="rank-cell">${entry.rank}</td>
        <td class="player-cell">${entry.username}${isCurrentUser ? ' (you)' : ''}</td>
        <td class="speed-cell">${entry.bestSpeedKmh} km/h</td>
        <td class="smashes-cell">${entry.totalSmashes}</td>
      `;

      tbody.appendChild(row);
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  }
}

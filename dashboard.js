// ===== DASHBOARD MODULE =====
// All data read from localStorage — no backend required.

let progressionChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

/**
 * Initialize the dashboard: check login state and load data.
 */
function initDashboard() {
  const username = localStorage.getItem('username');

  if (!username) {
    document.getElementById('dashboardLogin').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
    return;
  }

  document.getElementById('dashboardLogin').classList.add('hidden');
  document.getElementById('dashboardContent').classList.remove('hidden');

  loadProgression(username);
  loadLeaderboard(username);
}

/**
 * Load and render the progression chart from localStorage.
 */
function loadProgression(username) {
  const key = 'smashRecords_' + username;
  const records = JSON.parse(localStorage.getItem(key) || '[]');

  if (records.length === 0) {
    document.getElementById('noDataMsg').classList.remove('hidden');
    return;
  }

  document.getElementById('noDataMsg').classList.add('hidden');

  const chartData = records.map(r => ({
    date: r.recordedAt,
    speedKmh: r.speedMps * 3.6
  }));

  renderChart(chartData);
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
 * Build and render the leaderboard from all users' localStorage data.
 * Note: only users on the same device/browser are visible in the leaderboard.
 */
function loadLeaderboard(currentUsername) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const entries = [];

  for (const username of Object.keys(users)) {
    const key = 'smashRecords_' + username;
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    if (records.length === 0) continue;

    const bestSpeedMps = Math.max(...records.map(r => r.speedMps));
    entries.push({
      username,
      bestSpeedKmh: Math.round(bestSpeedMps * 3.6 * 10) / 10,
      totalSmashes: records.length
    });
  }

  // Sort descending by best speed
  entries.sort((a, b) => b.bestSpeedKmh - a.bestSpeedKmh);

  if (entries.length === 0) {
    document.getElementById('leaderboardTable').classList.add('hidden');
    document.getElementById('emptyLeaderboard').classList.remove('hidden');
    return;
  }

  document.getElementById('leaderboardTable').classList.remove('hidden');
  document.getElementById('emptyLeaderboard').classList.add('hidden');

  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '';

  entries.forEach((entry, i) => {
    const row = document.createElement('tr');
    const isCurrentUser = entry.username === currentUsername;
    if (isCurrentUser) row.classList.add('current-user-row');

    row.innerHTML = `
      <td class="rank-cell">${i + 1}</td>
      <td class="player-cell">${entry.username}${isCurrentUser ? ' (you)' : ''}</td>
      <td class="speed-cell">${entry.bestSpeedKmh} km/h</td>
      <td class="smashes-cell">${entry.totalSmashes}</td>
    `;
    tbody.appendChild(row);
  });
}

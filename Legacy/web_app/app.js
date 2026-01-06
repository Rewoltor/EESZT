/**
 * Logic for Blood Results App
 * Dependencies: data.js (defines `bloodData` global)
 */

// Helper to normalize dates (YYYY.MM.DD -> JS Date)
// Main App Logic

// Check if bloodData is loaded
if (typeof bloodData === 'undefined') {
    console.error("Blood data not loaded! Check if data.js exists.");
    document.body.innerHTML = "<h1>Error: Data not found</h1><p>Please run the extraction script to generate data.js</p>";
}

// Process Data
const markers = {};

bloodData.forEach(entry => {
    entry.results.forEach(result => {
        const name = result.test_name;
        if (!markers[name]) {
            markers[name] = {
                name: name,
                unit: result.unit,
                history: []
            };
        }

        // Clean value
        let valStr = result.result.replace(",", ".");
        // Handle "< 5" or "> 10"
        let operator = "";
        if (valStr.startsWith("<")) { operator = "<"; valStr = valStr.substring(1); }
        if (valStr.startsWith(">")) { operator = ">"; valStr = valStr.substring(1); }

        const value = parseFloat(valStr);

        // Parse date
        const dateParts = entry.metadata.date.split("."); // 2023.03.31.
        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        if (!isNaN(value)) {
            markers[name].history.push({
                date: date,
                value: value,
                originalValue: result.result,
                operator: operator,
                refRange: result.ref_range,
                refMin: result.ref_min,
                refMax: result.ref_max,
                flag: result.flag
            });
        }
    });
});

// Sort history by date
Object.values(markers).forEach(m => {
    m.history.sort((a, b) => a.date - b.date);
});

// Helper to determine status class with intelligent thresholds
function getStatusClass(val, min, max) {
    // No reference range available
    if (min === undefined && max === undefined) {
        return { class: 'status-neutral', label: 'No Reference', badge: 'neutral' };
    }

    // Within optimal range
    const belowMin = (min !== undefined && val < min);
    const aboveMax = (max !== undefined && val > max);

    if (!belowMin && !aboveMax) {
        return { class: 'status-optimal', label: 'Optimal', badge: 'optimal' };
    }

    // Calculate deviation percentage
    let deviation = 0;
    if (belowMin && min !== 0) {
        deviation = Math.abs((min - val) / min);
    } else if (aboveMax && max !== 0) {
        deviation = Math.abs((val - max) / max);
    }

    // Borderline (within 15% of range)
    if (deviation <= 0.15) {
        return { class: 'status-warning', label: 'Borderline', badge: 'warning' };
    }

    // Critical (>15% outside range)
    return { class: 'status-critical', label: 'Out of Range', badge: 'critical' };
}

// Render Dashboard
// Render Dashboard
function renderDashboard(filterText = '') {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return; // Not on dashboard page

    // Clear existing content
    grid.innerHTML = '';

    // Sort markers by Severity then Alphabetical
    const sortedKeys = Object.keys(markers).sort((a, b) => {
        const mA = markers[a];
        const mB = markers[b];

        // Skip sort logic if no history (should be filtered out anyway later but safe to check)
        if (!mA.history.length) return 1;
        if (!mB.history.length) return -1;

        // Get latest status for comparison
        const latestA = mA.history[mA.history.length - 1];
        const latestB = mB.history[mB.history.length - 1];

        const statusA = getStatusClass(latestA.value, latestA.refMin, latestA.refMax).badge;
        const statusB = getStatusClass(latestB.value, latestB.refMin, latestB.refMax).badge;

        // Severity Priority: Critical > Warning > Optimal > Neutral
        const severityMap = { 'critical': 3, 'warning': 2, 'optimal': 1, 'neutral': 0 };

        const scoreA = severityMap[statusA] || 0;
        const scoreB = severityMap[statusB] || 0;

        if (scoreA !== scoreB) {
            return scoreB - scoreA; // Descending score
        }

        // Fallback to alphabetical
        return a.localeCompare(b);
    });

    let count = 0;
    sortedKeys.forEach(key => {
        const m = markers[key];

        // Filter by text (case-insensitive)
        if (filterText && !m.name.toLowerCase().includes(filterText.toLowerCase())) {
            return;
        }

        // Skip if no history
        if (!m.history || m.history.length === 0) return;

        count++;

        const latest = m.history[m.history.length - 1];
        const prev = m.history.length > 1 ? m.history[m.history.length - 2] : null;

        const card = document.createElement('div');

        // Determine Status
        const status = getStatusClass(latest.value, latest.refMin, latest.refMax);
        card.className = `card ${status.class}`;

        card.onclick = () => window.location.href = `detail.html?marker=${encodeURIComponent(m.name)}`;

        // Trend indicator
        let trendHtml = '';
        if (prev) {
            const diff = latest.value - prev.value;
            if (Math.abs(diff) < 0.001) {
                trendHtml = `<div class="trend-indicator"><span>–</span> Stable</div>`;
            } else {
                const isUp = diff > 0;
                const symbol = isUp ? '↑' : '↓';
                const className = isUp ? 'trend-up' : 'trend-down';
                const diffFormatted = Math.abs(diff).toFixed(1).replace(/\.0$/, '');
                trendHtml = `<div class="trend-indicator ${className}"><span>${symbol}</span> ${diffFormatted}</div>`;
            }
        }

        // Date formatting
        const dateStr = latest.date instanceof Date && !isNaN(latest.date)
            ? latest.date.toLocaleDateString()
            : 'Unknown Date';

        // Status badge
        const statusBadge = `<span class="status-badge ${status.badge}">${status.label}</span>`;

        card.innerHTML = `
            <div class="card-content-left">
                <div class="marker-name">${m.name}</div>
                <div class="marker-meta">
                    <span class="marker-unit">${m.unit}</span>
                    <span class="marker-date">${dateStr}</span>
                </div>
            </div>
            <div class="card-content-right">
                <div class="latest-value">${latest.originalValue}</div>
                ${trendHtml || statusBadge}
            </div>
        `;
        grid.appendChild(card);
    });

    // Show empty state if no results and filter was applied
    if (count === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px;">No markers found.</div>';
    }
}

// Render Detail View
function renderDetail() {
    const params = new URLSearchParams(window.location.search);
    const markerName = params.get('marker');

    if (!markerName || !markers[markerName]) {
        document.getElementById('chart-container').innerHTML = '<p>Marker not found.</p>';
        return;
    }

    const m = markers[markerName];
    document.getElementById('marker-title').textContent = m.name;

    // Stats
    const latest = m.history[m.history.length - 1];
    const min = Math.min(...m.history.map(d => d.value));
    const max = Math.max(...m.history.map(d => d.value));

    // Get status for latest value
    const status = getStatusClass(latest.value, latest.refMin, latest.refMax);

    // Update stat boxes with status colors
    const statBoxes = document.querySelectorAll('.stat-box');
    if (statBoxes.length >= 1) {
        statBoxes[0].className = `stat-box ${status.badge}`;
    }

    document.getElementById('latest-stat').textContent = `${latest.originalValue} ${m.unit}`;
    document.getElementById('min-stat').textContent = `${min} ${m.unit}`;
    document.getElementById('max-stat').textContent = `${max} ${m.unit}`;
    document.getElementById('count-stat').textContent = m.history.length;

    // Reference Range Banner
    const banner = document.getElementById('ref-range-banner');
    if (latest.refMin !== undefined && latest.refMax !== undefined) {
        banner.className = `ref-range-info ${status.badge}`;
        banner.innerHTML = `
            <span class="ref-range-label">Reference Range:</span>
            <span class="ref-range-value">${latest.refMin} - ${latest.refMax} ${m.unit}</span>
            <span class="status-badge ${status.badge}">${status.label}</span>
        `;
    } else if (latest.refRange) {
        banner.className = `ref-range-info ${status.badge}`;
        banner.innerHTML = `
            <span class="ref-range-label">Reference Range:</span>
            <span class="ref-range-value">${latest.refRange}</span>
        `;
    }

    // Chart
    const ctx = document.getElementById('historyChart').getContext('2d');

    // Helper to fill gaps (Forward fill then Backfill)
    function fillNulls(data) {
        let lastValid = null;
        // Forward fill
        let filled = data.map(v => {
            if (v !== null && v !== undefined && !isNaN(v)) lastValid = v;
            return lastValid;
        });
        // Backfill
        const firstValid = filled.find(v => v !== null);
        if (firstValid === null || firstValid === undefined) return filled;
        return filled.map(v => v === null ? firstValid : v);
    }

    // Prepare reference range datasets
    let refMinData = m.history.map(d => (d.refMin !== undefined && d.refMin !== "") ? parseFloat(d.refMin) : null);
    let refMaxData = m.history.map(d => (d.refMax !== undefined && d.refMax !== "") ? parseFloat(d.refMax) : null);

    refMinData = fillNulls(refMinData);
    refMaxData = fillNulls(refMaxData);

    // Check if we have any valid reference data
    const hasRefData = refMinData.some(v => v !== null) || refMaxData.some(v => v !== null);

    const datasets = [];

    if (hasRefData) {
        // Calculate dynamic chart max for the Red High Zone
        const allValues = m.history.map(d => d.value).concat(refMaxData).filter(v => v !== null);
        const maxY = Math.max(...allValues) * 1.1;
        const chartTopData = m.history.map(() => maxY);

        // 1. Red Low Zone (Scale Bottom -> RefMin)
        datasets.push({
            label: 'Red Low Zone',
            data: refMinData,
            borderColor: 'transparent',
            pointRadius: 0,
            fill: 'start', // Fill to bottom
            backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red
            borderWidth: 0,
            tension: 0
        });

        // 2. Green Optimal Zone (RefMin -> RefMax)
        datasets.push({
            label: 'Green Optimal Zone',
            data: refMaxData,
            borderColor: 'transparent',
            pointRadius: 0,
            fill: '-1', // Fill to previous (RefMin)
            backgroundColor: 'rgba(16, 185, 129, 0.15)', // Green
            borderWidth: 0,
            tension: 0
        });

        // 3. Red High Zone (RefMax -> Chart Top)
        datasets.push({
            label: 'Red High Zone',
            data: chartTopData,
            borderColor: 'transparent',
            pointRadius: 0,
            fill: '-1', // Fill to previous (RefMax)
            backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red
            borderWidth: 0,
            tension: 0
        });
    }

    // Determine chart color based on status
    const chartColor = status.badge === 'optimal' ? '#10b981' :
        status.badge === 'warning' ? '#f59e0b' :
            status.badge === 'critical' ? '#ef4444' : '#3b82f6';

    // 4. Main Data Line
    datasets.push({
        label: `${m.name} (${m.unit})`,
        data: m.history.map(d => d.value),
        borderColor: chartColor,
        backgroundColor: `${chartColor}20`,
        borderWidth: 3,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: function (context) {
            const index = context.dataIndex;
            const val = context.dataset.data[index];
            const min = refMinData[index];
            const max = refMaxData[index];

            // Color points based on their individual status
            if (min !== null && max !== null) {
                if (val >= min && val <= max) return '#10b981'; // Optimal

                const belowMin = val < min;
                const aboveMax = val > max;
                let deviation = 0;

                if (belowMin) deviation = Math.abs((min - val) / min);
                else if (aboveMax) deviation = Math.abs((val - max) / max);

                if (deviation <= 0.15) return '#f59e0b'; // Warning
                return '#ef4444'; // Critical
            }

            return chartColor;
        },
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
    });

    // Chart Configuration
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: m.history.map(d => d.date.toLocaleDateString()),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            // Don't show tooltips for area datasets
                            if (context.dataset.label && context.dataset.label.includes('Zone')) return null;
                            const d = m.history[context.dataIndex];
                            let label = `Value: ${d.originalValue} ${d.unit} `;
                            if (d.ref) label += ` (Ref: ${d.ref})`;
                            return label;
                        }
                    },
                    filter: function (tooltipItem) {
                        // Only show tooltip for main dataset
                        return !tooltipItem.dataset.label.includes('Zone');
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#f1f5f9'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Search Logic Hook
if (document.getElementById('search-input')) {
    document.getElementById('search-input').addEventListener('input', (e) => {
        renderDashboard(e.target.value);
    });
}

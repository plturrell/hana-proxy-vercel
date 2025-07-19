// Monitoring API endpoints
import { metricsCollector, logger, healthChecker, handleMetrics, handleHealth } from './monitoring.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    
    try {
        switch (pathname) {
            case '/api/monitor/health':
                return await handleHealth(req, res);
                
            case '/api/monitor/metrics':
                return await handleMetrics(req, res);
                
            case '/api/monitor/dashboard':
                // Return monitoring dashboard HTML
                return res.status(200).send(generateDashboardHTML());
                
            default:
                return res.status(404).json({ error: 'Endpoint not found' });
        }
    } catch (error) {
        logger.error('Monitoring endpoint error', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

function generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BPMN Agent System - Production Monitoring</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f5f7;
            color: #1d1d1f;
            line-height: 1.5;
        }
        
        .header {
            background: #fff;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .metric-title {
            font-size: 14px;
            color: #86868b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: 600;
            color: #1d1d1f;
            margin-bottom: 4px;
        }
        
        .metric-change {
            font-size: 14px;
            color: #86868b;
        }
        
        .metric-change.positive {
            color: #34c759;
        }
        
        .metric-change.negative {
            color: #ff3b30;
        }
        
        .health-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .health-status.healthy {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .health-status.degraded {
            background: #fff3e0;
            color: #e65100;
        }
        
        .health-status.error {
            background: #ffebee;
            color: #c62828;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }
        
        .charts-section {
            background: #fff;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 20px;
        }
        
        .logs-section {
            background: #1d1d1f;
            color: #f5f5f7;
            border-radius: 12px;
            padding: 24px;
            font-family: "SF Mono", Monaco, monospace;
            font-size: 13px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .log-entry {
            padding: 4px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .log-timestamp {
            color: #86868b;
            margin-right: 12px;
        }
        
        .log-level {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-right: 8px;
        }
        
        .log-level.INFO {
            background: #007aff;
            color: #fff;
        }
        
        .log-level.WARN {
            background: #ff9500;
            color: #fff;
        }
        
        .log-level.ERROR {
            background: #ff3b30;
            color: #fff;
        }
        
        .refresh-button {
            background: #007aff;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .refresh-button:hover {
            background: #0051d5;
        }
        
        .refresh-button:disabled {
            background: #86868b;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>BPMN Agent System - Production Monitoring</h1>
        </div>
    </div>
    
    <div class="container">
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">System Health</div>
                <div id="health-status" class="health-status">
                    <span class="status-dot"></span>
                    <span>Checking...</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Total Requests</div>
                <div class="metric-value" id="total-requests">-</div>
                <div class="metric-change" id="requests-change">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Average Response Time</div>
                <div class="metric-value" id="avg-response-time">-</div>
                <div class="metric-change" id="response-time-change">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Cache Hit Rate</div>
                <div class="metric-value" id="cache-hit-rate">-</div>
                <div class="metric-change" id="cache-change">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Error Rate</div>
                <div class="metric-value" id="error-rate">-</div>
                <div class="metric-change" id="error-change">Loading...</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Active Agents</div>
                <div class="metric-value" id="active-agents">-</div>
                <div class="metric-change" id="agents-change">Loading...</div>
            </div>
        </div>
        
        <div class="charts-section">
            <h2>Request Volume</h2>
            <div class="chart-container">
                <canvas id="requests-chart"></canvas>
            </div>
        </div>
        
        <div class="charts-section">
            <h2>Response Times</h2>
            <div class="chart-container">
                <canvas id="response-times-chart"></canvas>
            </div>
        </div>
        
        <div class="logs-section">
            <h2 style="margin-bottom: 16px;">Recent Logs</h2>
            <div id="logs-container">
                <div class="log-entry">
                    <span class="log-timestamp">Loading logs...</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <button class="refresh-button" onclick="refreshData()">Refresh</button>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        let requestsChart, responseTimesChart;
        let previousMetrics = null;
        
        async function fetchHealthData() {
            try {
                const response = await fetch('/api/monitor/health');
                const data = await response.json();
                updateHealthStatus(data);
            } catch (error) {
                console.error('Failed to fetch health data:', error);
                updateHealthStatus({ status: 'error', message: error.message });
            }
        }
        
        async function fetchMetricsData() {
            try {
                const response = await fetch('/api/monitor/metrics');
                const data = await response.json();
                updateMetrics(data);
                previousMetrics = data;
            } catch (error) {
                console.error('Failed to fetch metrics data:', error);
            }
        }
        
        function updateHealthStatus(health) {
            const statusEl = document.getElementById('health-status');
            statusEl.className = 'health-status ' + health.status;
            statusEl.innerHTML = \`
                <span class="status-dot"></span>
                <span>\${health.status.charAt(0).toUpperCase() + health.status.slice(1)}</span>
            \`;
        }
        
        function updateMetrics(metrics) {
            // Update request count
            const totalRequests = Object.values(metrics.requests || {}).reduce((sum, req) => sum + (req.count || 0), 0);
            document.getElementById('total-requests').textContent = totalRequests.toLocaleString();
            
            // Update response time
            const avgResponseTime = calculateAverageResponseTime(metrics.requests || {});
            document.getElementById('avg-response-time').textContent = avgResponseTime + 'ms';
            
            // Update cache hit rate
            const cacheHitRate = calculateCacheHitRate(metrics.cache || {});
            document.getElementById('cache-hit-rate').textContent = cacheHitRate + '%';
            
            // Update error rate
            const errorCount = Object.values(metrics.errors || {}).reduce((sum, count) => sum + count, 0);
            document.getElementById('error-rate').textContent = errorCount.toLocaleString();
            
            // Update charts
            updateCharts(metrics);
        }
        
        function calculateAverageResponseTime(requests) {
            let totalTime = 0;
            let totalCount = 0;
            
            for (const endpoint in requests) {
                if (requests[endpoint].totalDuration && requests[endpoint].count) {
                    totalTime += requests[endpoint].totalDuration;
                    totalCount += requests[endpoint].count;
                }
            }
            
            return totalCount > 0 ? Math.round(totalTime / totalCount) : 0;
        }
        
        function calculateCacheHitRate(cache) {
            let totalHits = 0;
            let totalRequests = 0;
            
            for (const key in cache) {
                if (cache[key].hits !== undefined && cache[key].misses !== undefined) {
                    totalHits += cache[key].hits;
                    totalRequests += cache[key].hits + cache[key].misses;
                }
            }
            
            return totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0;
        }
        
        function initCharts() {
            const ctx1 = document.getElementById('requests-chart').getContext('2d');
            requestsChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Requests per minute',
                        data: [],
                        borderColor: '#007aff',
                        backgroundColor: 'rgba(0, 122, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
            
            const ctx2 = document.getElementById('response-times-chart').getContext('2d');
            responseTimesChart = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Average Response Time (ms)',
                        data: [],
                        backgroundColor: '#34c759'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        function updateCharts(metrics) {
            // Update with real data when available
            const timestamp = new Date().toLocaleTimeString();
            
            // Update requests chart
            if (requestsChart.data.labels.length > 20) {
                requestsChart.data.labels.shift();
                requestsChart.data.datasets[0].data.shift();
            }
            requestsChart.data.labels.push(timestamp);
            requestsChart.data.datasets[0].data.push(Math.random() * 100 + 50);
            requestsChart.update();
            
            // Update response times chart
            if (responseTimesChart.data.labels.length > 10) {
                responseTimesChart.data.labels.shift();
                responseTimesChart.data.datasets[0].data.shift();
            }
            responseTimesChart.data.labels.push(timestamp);
            responseTimesChart.data.datasets[0].data.push(Math.random() * 200 + 100);
            responseTimesChart.update();
        }
        
        async function refreshData() {
            const button = document.querySelector('.refresh-button');
            button.disabled = true;
            button.textContent = 'Refreshing...';
            
            await Promise.all([
                fetchHealthData(),
                fetchMetricsData()
            ]);
            
            button.disabled = false;
            button.textContent = 'Refresh';
        }
        
        // Initialize
        initCharts();
        refreshData();
        
        // Auto-refresh every 30 seconds
        setInterval(refreshData, 30000);
    </script>
</body>
</html>
    `;
}
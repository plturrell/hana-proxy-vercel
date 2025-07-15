const fs = require('fs');
const path = require('path');

// Blueprint template structure
const blueprintTemplate = (title, pageTitle, content, activeMenuItem) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://unpkg.com/@blueprintjs/icons@^4.0.0/lib/css/blueprint-icons.css" rel="stylesheet">
    <link href="https://unpkg.com/@blueprintjs/core@^4.0.0/lib/css/blueprint.css" rel="stylesheet">
    <link href="shared-header-styles.css" rel="stylesheet">
    <style>
        /* Blueprint Design System CSS Variables */
        :root {
            --bp3-grid-size: 10px;
            --bp3-black: #111418;
            --bp3-dark-gray1: #1C2127;
            --bp3-dark-gray2: #252A31;
            --bp3-dark-gray3: #2F343C;
            --bp3-dark-gray4: #383E47;
            --bp3-dark-gray5: #404854;
            --bp3-gray1: #5C7080;
            --bp3-gray2: #738091;
            --bp3-gray3: #8A9BA8;
            --bp3-gray4: #A7B6C2;
            --bp3-gray5: #BFCCD6;
            --bp3-light-gray1: #CED9E0;
            --bp3-light-gray2: #D8E1E8;
            --bp3-light-gray3: #E1E8ED;
            --bp3-light-gray4: #EBF1F5;
            --bp3-light-gray5: #F5F8FA;
            --bp3-white: #FFFFFF;
            --bp3-blue1: #0E5A8A;
            --bp3-blue2: #106BA3;
            --bp3-blue3: #137CBD;
            --bp3-blue4: #2B95D6;
            --bp3-blue5: #48AFF0;
            --bp3-green1: #0A6640;
            --bp3-green2: #0D8050;
            --bp3-green3: #0F9960;
            --bp3-green4: #15B371;
            --bp3-green5: #3DCC91;
            --bp3-orange1: #A66321;
            --bp3-orange2: #BF7326;
            --bp3-orange3: #D9822B;
            --bp3-orange4: #F29D49;
            --bp3-orange5: #FFB366;
            --bp3-red1: #A82A2A;
            --bp3-red2: #C23030;
            --bp3-red3: #DB3737;
            --bp3-red4: #F55656;
            --bp3-red5: #FF7373;
            --bp3-intent-primary: var(--bp3-blue3);
            --bp3-intent-success: var(--bp3-green3);
            --bp3-intent-warning: var(--bp3-orange3);
            --bp3-intent-danger: var(--bp3-red3);
            --bp3-font-family: -apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", "Icons16", sans-serif;
            --bp3-font-size: 14px;
            --bp3-font-size-large: 16px;
            --bp3-line-height: 18px;
            --bp3-elevation-shadow-0: 0 0 0 1px rgba(17, 20, 24, 0.15);
            --bp3-elevation-shadow-1: 0 0 0 1px rgba(17, 20, 24, 0.1), 0 1px 1px rgba(17, 20, 24, 0.2);
            --bp3-elevation-shadow-2: 0 0 0 1px rgba(17, 20, 24, 0.1), 0 1px 1px rgba(17, 20, 24, 0.2), 0 2px 6px rgba(17, 20, 24, 0.2);
            --bp3-elevation-shadow-3: 0 0 0 1px rgba(17, 20, 24, 0.1), 0 2px 4px rgba(17, 20, 24, 0.2), 0 8px 24px rgba(17, 20, 24, 0.2);
            --bp3-elevation-shadow-4: 0 0 0 1px rgba(17, 20, 24, 0.1), 0 4px 8px rgba(17, 20, 24, 0.2), 0 18px 46px 6px rgba(17, 20, 24, 0.2);
            --bp3-border-radius: 3px;
            --bp3-transition-duration: 100ms;
            --bp3-transition-ease: cubic-bezier(0.4, 1, 0.75, 0.9);
            --bp3-text-color: #182026;
            --bp3-text-color-muted: #5C7080;
            --bp3-text-color-disabled: rgba(92, 112, 128, 0.6);
            --bp3-heading-color: #182026;
            --bp3-link-color: var(--bp3-blue2);
            --bp3-app-background-color: var(--bp3-light-gray5);
            --bp3-divider-color: rgba(17, 20, 24, 0.15);
        }

        .bp3-dark {
            --bp3-text-color: rgba(255, 255, 255, 0.9);
            --bp3-text-color-muted: rgba(255, 255, 255, 0.6);
            --bp3-text-color-disabled: rgba(255, 255, 255, 0.3);
            --bp3-heading-color: rgba(255, 255, 255, 0.9);
            --bp3-link-color: var(--bp3-blue4);
            --bp3-app-background-color: var(--bp3-dark-gray2);
            --bp3-divider-color: rgba(255, 255, 255, 0.15);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: var(--bp3-font-family);
            font-size: var(--bp3-font-size);
            line-height: var(--bp3-line-height);
            color: var(--bp3-text-color);
            background-color: var(--bp3-app-background-color);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transition: all var(--bp3-transition-duration) var(--bp3-transition-ease);
        }

        .bp3-dark {
            background-color: var(--bp3-dark-gray2);
            color: var(--bp3-text-color);
        }

        .bp3-app {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        .bp3-navbar {
            flex-shrink: 0;
            z-index: 20;
        }

        .app-content {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .bp3-sidebar {
            width: 280px;
            flex-shrink: 0;
            background-color: var(--bp3-light-gray5);
            border-right: 1px solid var(--bp3-divider-color);
            overflow-y: auto;
        }

        .bp3-dark .bp3-sidebar {
            background-color: var(--bp3-dark-gray3);
            border-right-color: rgba(255, 255, 255, 0.15);
        }

        .main-content {
            flex: 1;
            overflow-y: auto;
            padding: calc(var(--bp3-grid-size) * 3);
        }

        .bp3-menu-item.bp3-active {
            background-color: var(--bp3-intent-primary);
            color: white;
        }

        .bp3-menu-item.bp3-active .bp3-icon {
            color: white;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: calc(var(--bp3-grid-size) / 2);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--bp3-gray3);
        }

        .status-dot.connected {
            background-color: var(--bp3-intent-success);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .content-header {
            margin-bottom: calc(var(--bp3-grid-size) * 3);
            padding-bottom: calc(var(--bp3-grid-size) * 2);
            border-bottom: 1px solid var(--bp3-divider-color);
        }

        /* Page-specific styles */
        .bp3-card {
            background-color: white;
            border-radius: var(--bp3-border-radius);
            box-shadow: var(--bp3-elevation-shadow-1);
            padding: calc(var(--bp3-grid-size) * 2);
            margin-bottom: calc(var(--bp3-grid-size) * 2);
        }

        .bp3-dark .bp3-card {
            background-color: var(--bp3-dark-gray3);
        }
    </style>
</head>
<body class="bp3-dark">
    <div class="bp3-app">
        <nav class="bp3-navbar bp3-dark">
            <div class="bp3-navbar-group bp3-align-left">
                <div class="bp3-navbar-heading">FinSight Intelligence</div>
                <span class="bp3-navbar-divider"></span>
                <button class="bp3-button bp3-minimal bp3-icon-dashboard">${pageTitle}</button>
            </div>
            <div class="bp3-navbar-group bp3-align-right">
                <div class="status-indicator">
                    <span class="status-dot connected"></span>
                    <span class="bp3-text-muted">Connected</span>
                </div>
                <span class="bp3-navbar-divider"></span>
                <button class="bp3-button bp3-minimal bp3-icon-moon" id="theme-toggle" onclick="toggleTheme()"></button>
                <button class="bp3-button bp3-minimal bp3-icon-user"></button>
            </div>
        </nav>

        <div class="app-content">
            <aside class="bp3-sidebar">
                <div class="bp3-menu">
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Analytics</h6>
                    </div>
                    <a class="bp3-menu-item ${activeMenuItem === 'portfolio-analyser' ? 'bp3-active' : ''}" href="portfolio-analyser.html">
                        <span class="bp3-icon bp3-icon-chart"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Portfolio Analyser</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'treasury-insights' ? 'bp3-active' : ''}" href="treasury-insights.html">
                        <span class="bp3-icon bp3-icon-trending-up"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Insights</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'scenario-analyser' ? 'bp3-active' : ''}" href="scenario-analyser-config.html">
                        <span class="bp3-icon bp3-icon-predictive-analysis"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Scenario Analysis</span>
                    </a>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Configuration</h6>
                    </div>
                    <a class="bp3-menu-item ${activeMenuItem === 'news-market-data' ? 'bp3-active' : ''}" href="news-market-data-config.html">
                        <span class="bp3-icon bp3-icon-feed"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">News & Market Data</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'calculation-manager' ? 'bp3-active' : ''}" href="calculation-manager-config.html">
                        <span class="bp3-icon bp3-icon-function"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Manager</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'ml-models' ? 'bp3-active' : ''}" href="ml-models-config.html">
                        <span class="bp3-icon bp3-icon-learning"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">ML Models</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'treasury-config' ? 'bp3-active' : ''}" href="treasury-insights-config.html">
                        <span class="bp3-icon bp3-icon-bank-account"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Config</span>
                    </a>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Tools</h6>
                    </div>
                    <a class="bp3-menu-item ${activeMenuItem === 'calculation-tester' ? 'bp3-active' : ''}" href="calculation-tester.html">
                        <span class="bp3-icon bp3-icon-calculator"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Tester</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'calculations-config' ? 'bp3-active' : ''}" href="calculations-config.html">
                        <span class="bp3-icon bp3-icon-numerical"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Calculations Config</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'news-market-config' ? 'bp3-active' : ''}" href="news-market-config.html">
                        <span class="bp3-icon bp3-icon-timeline-events"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Market Config</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'scenario-analysis' ? 'bp3-active' : ''}" href="scenario-analysis.html">
                        <span class="bp3-icon bp3-icon-fork"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">MCTS Analysis</span>
                    </a>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">System</h6>
                    </div>
                    <a class="bp3-menu-item ${activeMenuItem === 'command-centre' ? 'bp3-active' : ''}" href="command-centre.html">
                        <span class="bp3-icon bp3-icon-console"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Command Centre</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'deployment' ? 'bp3-active' : ''}" href="deployment.html">
                        <span class="bp3-icon bp3-icon-cloud-upload"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Deployment</span>
                    </a>
                    <a class="bp3-menu-item ${activeMenuItem === 'system-config' ? 'bp3-active' : ''}" href="system-config.html">
                        <span class="bp3-icon bp3-icon-settings"></span>
                        <span class="bp3-text-overflow-ellipsis bp3-fill">System Config</span>
                    </a>
                </div>
            </aside>

            <main class="main-content">
                ${content}
            </main>
        </div>
    </div>

    <script>
        function toggleTheme() {
            const body = document.body;
            const button = document.getElementById('theme-toggle');
            
            if (body.classList.contains('bp3-dark')) {
                body.classList.remove('bp3-dark');
                button.className = 'bp3-button bp3-minimal bp3-icon-flash';
            } else {
                body.classList.add('bp3-dark');
                button.className = 'bp3-button bp3-minimal bp3-icon-moon';
            }
        }
    </script>
    <script src="shared-header.js"></script>
</body>
</html>`;

// Pages to convert
const pagesToConvert = [
    {
        file: 'calculations-config.html',
        title: 'Calculations Configuration - FinSight Intelligence',
        pageTitle: 'Calculations Config',
        activeMenuItem: 'calculations-config'
    },
    {
        file: 'news-market-config.html',
        title: 'News & Market Data Configuration - FinSight Intelligence',
        pageTitle: 'Market Config',
        activeMenuItem: 'news-market-config'
    },
    {
        file: 'scenario-analysis.html',
        title: 'Scenario Analysis (MCTS) - FinSight Intelligence',
        pageTitle: 'MCTS Analysis',
        activeMenuItem: 'scenario-analysis'
    },
    {
        file: 'system-config.html',
        title: 'System Configuration - FinSight Intelligence',
        pageTitle: 'System Config',
        activeMenuItem: 'system-config'
    },
    {
        file: 'treasury-insights-config.html',
        title: 'Treasury Context-Aware Insights Configuration - FinSight Intelligence',
        pageTitle: 'Treasury Config',
        activeMenuItem: 'treasury-config'
    }
];

// Extract main content from existing files
function extractMainContent(html) {
    // Extract JavaScript
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    const script = scriptMatch ? scriptMatch[1] : '';
    
    // Try to extract main content area
    const containerMatch = html.match(/<div class="container">([\s\S]*?)<\/div>\s*<script>/);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<script>/);
    
    let content = '';
    if (containerMatch) {
        content = `<div class="content-header">
                    <h1 class="bp3-heading">${extractTitle(html)}</h1>
                    <p class="bp3-text-muted">${extractSubtitle(html)}</p>
                </div>
                <div class="bp3-card">
                    ${containerMatch[1]}
                </div>`;
    } else if (bodyMatch) {
        content = `<div class="content-header">
                    <h1 class="bp3-heading">${extractTitle(html)}</h1>
                    <p class="bp3-text-muted">Configure system settings</p>
                </div>
                <div class="bp3-card">
                    ${bodyMatch[1]}
                </div>`;
    }
    
    return { content, script };
}

function extractTitle(html) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) return h1Match[1];
    
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) return titleMatch[1].split(' - ')[0];
    
    return 'Configuration';
}

function extractSubtitle(html) {
    const pMatch = html.match(/<p[^>]*style="color:\s*var\(--text-secondary\)"[^>]*>([^<]+)<\/p>/);
    if (pMatch) return pMatch[1];
    
    const h2Match = html.match(/<h2[^>]*>([^<]+)<\/h2>/);
    if (h2Match) return h2Match[1];
    
    return 'Configure and manage system settings';
}

// Convert each page
pagesToConvert.forEach(page => {
    const filePath = path.join('public', page.file);
    const html = fs.readFileSync(filePath, 'utf-8');
    const { content, script } = extractMainContent(html);
    
    // Build the new Blueprint version
    const newHtml = blueprintTemplate(
        page.title,
        page.pageTitle,
        content,
        page.activeMenuItem
    ).replace('</body>', `    <script>${script}</script>
</body>`);
    
    // Write the new file
    fs.writeFileSync(filePath, newHtml);
    console.log(`Converted ${page.file} to Blueprint structure`);
});

console.log('All files converted successfully!');
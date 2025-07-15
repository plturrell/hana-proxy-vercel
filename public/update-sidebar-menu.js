// Unified sidebar menu structure for all pages
const unifiedSidebarMenu = `
                <div class="bp3-menu">
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Analytics</h6>
                    </div>
                    <a class="bp3-menu-item" href="portfolio-analyser.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Portfolio Analyser</span>
                    </a>
                    <a class="bp3-menu-item" href="treasury-insights.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Insights</span>
                    </a>
                    <a class="bp3-menu-item" href="scenario-analyser-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Scenario Analysis</span>
                    </a>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Configuration</h6>
                    </div>
                    <a class="bp3-menu-item" href="news-market-data-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">News & Market Data</span>
                    </a>
                    <a class="bp3-menu-item" href="calculation-manager-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Manager</span>
                    </a>
                    <a class="bp3-menu-item" href="ml-models-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">ML Models</span>
                    </a>
                    <a class="bp3-menu-item" href="treasury-insights-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Config</span>
                    </a>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Tools</h6>
                    </div>
                    <a class="bp3-menu-item" href="calculation-tester.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Tester</span>
                    </a>
                    <a class="bp3-menu-item" href="calculations-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Calculations Config</span>
                    </a>
                    <a class="bp3-menu-item" href="news-market-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Market Config</span>
                    </a>
                    <a class="bp3-menu-item" href="scenario-analysis.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">MCTS Analysis</span>
                    </a>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">System</h6>
                    </div>
                    <a class="bp3-menu-item" href="command-centre.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Command Centre</span>
                    </a>
                    <a class="bp3-menu-item" href="deployment.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">Deployment</span>
                    </a>
                    <a class="bp3-menu-item" href="system-config.html">
                        
                        <span class="bp3-text-overflow-ellipsis bp3-fill">System Config</span>
                    </a>
                </div>`;

// Page mapping for active states
const pageActiveStates = {
    'index.html': 'command-centre.html',
    'portfolio-analyser.html': 'portfolio-analyser.html',
    'treasury-insights.html': 'treasury-insights.html',
    'scenario-analyser-config.html': 'scenario-analyser-config.html',
    'news-market-data-config.html': 'news-market-data-config.html',
    'calculation-manager-config.html': 'calculation-manager-config.html',
    'ml-models-config.html': 'ml-models-config.html',
    'treasury-insights-config.html': 'treasury-insights-config.html',
    'calculation-tester.html': 'calculation-tester.html',
    'calculations-config.html': 'calculations-config.html',
    'news-market-config.html': 'news-market-config.html',
    'scenario-analysis.html': 'scenario-analysis.html',
    'command-centre.html': 'command-centre.html',
    'deployment.html': 'deployment.html',
    'system-config.html': 'system-config.html'
};

module.exports = { unifiedSidebarMenu, pageActiveStates };
#!/bin/bash

# Standard sidebar content from standard-sidebar.html
read -r -d '' SIDEBAR_CONTENT << 'EOF'
            <!-- Left Sidebar -->
            <aside class="bp3-sidebar">
                <ul class="bp3-menu bp3-large">
                    <li class="bp3-menu-header">
                        <h6 class="bp3-heading">Analytics</h6>
                    </li>
                    <li>
                        <a class="bp3-menu-item PORTFOLIO_ACTIVE" href="/portfolio-analyser.html">
                            <span class="bp3-icon bp3-icon-timeline-line-chart"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Portfolio Analyser</span>
                        </a>
                    </li>
                    <li>
                        <a class="bp3-menu-item TREASURY_ACTIVE" href="/treasury-insights.html">
                            <span class="bp3-icon bp3-icon-bank-account"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Insights</span>
                        </a>
                    </li>
                    <li>
                        <a class="bp3-menu-item SCENARIO_ACTIVE" href="/scenario-analyser-config.html">
                            <span class="bp3-icon bp3-icon-predictive-analysis"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Scenario Analysis</span>
                        </a>
                    </li>
                    
                    <li class="bp3-menu-header">
                        <h6 class="bp3-heading">Knowledge</h6>
                    </li>
                    <li>
                        <a class="bp3-menu-item NEWS_ACTIVE" href="/news-market-data-config.html">
                            <span class="bp3-icon bp3-icon-feed"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">News & Market Data</span>
                        </a>
                    </li>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item CALC_MANAGER_ACTIVE" href="/calculation-manager-config.html">
                            <span class="bp3-icon bp3-icon-function"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Manager</span>
                        </a>
                    </li>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item ML_ACTIVE" href="/ml-models-config.html">
                            <span class="bp3-icon bp3-icon-learning"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">ML Models</span>
                        </a>
                    </li>
                    <li>
                        <a class="bp3-menu-item TREASURY_CONFIG_ACTIVE" href="/treasury-insights-config.html">
                            <span class="bp3-icon bp3-icon-bank-account"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Config</span>
                        </a>
                    </li>
                    
                    <div class="bp3-menu-divider"></div>
                    <div class="bp3-menu-header">
                        <h6 class="bp3-heading">Tools</h6>
                    </div>
                    <li>
                        <a class="bp3-menu-item CALC_TESTER_ACTIVE" href="/calculation-tester.html">
                            <span class="bp3-icon bp3-icon-calculator"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Tester</span>
                        </a>
                    </li>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item CALC_CONFIG_ACTIVE" href="/calculations-config.html">
                            <span class="bp3-icon bp3-icon-numerical"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Calculations Config</span>
                        </a>
                    </li>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item MARKET_CONFIG_ACTIVE" href="/news-market-config.html">
                            <span class="bp3-icon bp3-icon-timeline-events"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Market Config</span>
                        </a>
                    </li>
                    <li>
                        <a class="bp3-menu-item SCENARIO_ANALYSIS_ACTIVE" href="/scenario-analysis.html">
                            <span class="bp3-icon bp3-icon-fork"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">MCTS Analysis</span>
                        </a>
                    </li>
                    
                    <div class="bp3-menu-divider admin-only" style="display: none;"></div>
                    <div class="bp3-menu-header admin-only" style="display: none;">
                        <h6 class="bp3-heading">System</h6>
                    </div>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item COMMAND_CENTRE_ACTIVE" href="/command-centre.html">
                            <span class="bp3-icon bp3-icon-console"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Command Centre</span>
                        </a>
                    </li>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item DEPLOYMENT_ACTIVE" href="/deployment.html">
                            <span class="bp3-icon bp3-icon-cloud-upload"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">Deployment</span>
                        </a>
                    </li>
                    <li class="admin-only" style="display: none;">
                        <a class="bp3-menu-item SYSTEM_CONFIG_ACTIVE" href="/system-config.html">
                            <span class="bp3-icon bp3-icon-settings"></span>
                            <span class="bp3-text-overflow-ellipsis bp3-fill">System Config</span>
                        </a>
                    </li>
                </ul>
            </aside>
EOF

# Function to update sidebar for a specific file
update_sidebar() {
    local file="$1"
    local active_placeholder="$2"
    
    echo "Updating sidebar for $file with active: $active_placeholder"
    
    # Replace the active placeholder with bp3-active
    local updated_content=$(echo "$SIDEBAR_CONTENT" | sed "s/$active_placeholder/bp3-active/g")
    
    # Find the existing sidebar section and replace it
    python3 -c "
import re
import sys

file_path = '$file'
new_sidebar = '''$updated_content'''

# Read the file
with open(file_path, 'r') as f:
    content = f.read()

# Pattern to match the sidebar section
pattern = r'(\s*<!-- Left Sidebar -->\s*<(?:div|aside) class=\"bp3-sidebar\">.*?</(?:div|aside)>)'

# Replace the sidebar section
updated_content = re.sub(pattern, new_sidebar, content, flags=re.DOTALL)

# Write back to file
with open(file_path, 'w') as f:
    f.write(updated_content)

print(f'Updated sidebar in {file_path}')
"
}

# Update remaining files
update_sidebar "scenario-analysis.html" "SCENARIO_ANALYSIS_ACTIVE"
update_sidebar "news-market-data-config.html" "NEWS_ACTIVE"
update_sidebar "treasury-insights-config.html" "TREASURY_CONFIG_ACTIVE"
update_sidebar "calculation-manager-config.html" "CALC_MANAGER_ACTIVE"
update_sidebar "ml-models-config.html" "ML_ACTIVE"
update_sidebar "calculations-config.html" "CALC_CONFIG_ACTIVE"
update_sidebar "calculations-config-blueprint.html" "CALC_CONFIG_ACTIVE"
update_sidebar "news-market-config.html" "MARKET_CONFIG_ACTIVE"
update_sidebar "deployment.html" "DEPLOYMENT_ACTIVE"
update_sidebar "system-config.html" "SYSTEM_CONFIG_ACTIVE"

echo "All sidebars updated!"
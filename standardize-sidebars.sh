#!/bin/bash

# Script to standardize sidebar menus across all HTML files

echo "Standardizing sidebar menus across all HTML files..."

PUBLIC_DIR="/Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel/public"

# Define the standard sidebar template
STANDARD_SIDEBAR='    <aside class="bp3-sidebar">
        <ul class="bp3-menu bp3-large">
            <li class="bp3-menu-header">
                <h6 class="bp3-heading">Analytics</h6>
            </li>
            <li>
                <a class="bp3-menu-item" href="/portfolio-analyser.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Portfolio Analyser</span>
                </a>
            </li>
            <li>
                <a class="bp3-menu-item" href="/treasury-insights.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Insights</span>
                </a>
            </li>
            <li>
                <a class="bp3-menu-item" href="/scenario-analyser-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Scenario Analysis</span>
                </a>
            </li>
            
            <li class="bp3-menu-header">
                <h6 class="bp3-heading">Knowledge</h6>
            </li>
            <li>
                <a class="bp3-menu-item" href="/news-market-data-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">News & Market Data</span>
                </a>
            </li>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/calculation-manager-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Manager</span>
                </a>
            </li>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/ml-models-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">ML Models</span>
                </a>
            </li>
            <li>
                <a class="bp3-menu-item" href="/treasury-insights-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Treasury Config</span>
                </a>
            </li>
            
            <div class="bp3-menu-divider"></div>
            <div class="bp3-menu-header">
                <h6 class="bp3-heading">Tools</h6>
            </div>
            <li>
                <a class="bp3-menu-item" href="/calculation-tester.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Calculation Tester</span>
                </a>
            </li>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/calculations-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Calculations Config</span>
                </a>
            </li>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/news-market-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Market Config</span>
                </a>
            </li>
            <li>
                <a class="bp3-menu-item" href="/scenario-analysis.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">MCTS Analysis</span>
                </a>
            </li>
            
            <div class="bp3-menu-divider technology-only" style="display: none;"></div>
            <div class="bp3-menu-header technology-only" style="display: none;">
                <h6 class="bp3-heading">System</h6>
            </div>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/command-centre.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Command Centre</span>
                </a>
            </li>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/deployment.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">Deployment</span>
                </a>
            </li>
            <li class="technology-only" style="display: none;">
                <a class="bp3-menu-item" href="/system-config.html">
                    <span class="bp3-text-overflow-ellipsis bp3-fill">System Config</span>
                </a>
            </li>
        </ul>
    </aside>'

# List of all HTML files that need sidebar standardization
HTML_FILES=(
    "calculation-manager-config.html"
    "calculation-tester.html"
    "calculations-config.html"
    "calculations-config-blueprint.html"
    "command-centre.html"
    "deployment.html"
    "index.html"
    "ml-models-config.html"
    "news-market-config.html"
    "news-market-data-config.html"
    "portfolio-analyser.html"
    "scenario-analyser-config.html"
    "scenario-analysis.html"
    "system-config.html"
    "treasury-insights-config.html"
    "treasury-insights.html"
)

# Function to replace sidebar in a file
replace_sidebar() {
    local file=$1
    local current_page=$(basename "$file" .html)
    
    echo "Processing $file..."
    
    # Create a temporary file with the standard sidebar
    local temp_sidebar=$(mktemp)
    echo "$STANDARD_SIDEBAR" > "$temp_sidebar"
    
    # Mark the current page as active in the sidebar
    case "$current_page" in
        "portfolio-analyser")
            sed -i '' 's|href="/portfolio-analyser.html">|href="/portfolio-analyser.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "treasury-insights")
            sed -i '' 's|href="/treasury-insights.html">|href="/treasury-insights.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "scenario-analyser-config")
            sed -i '' 's|href="/scenario-analyser-config.html">|href="/scenario-analyser-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "news-market-data-config")
            sed -i '' 's|href="/news-market-data-config.html">|href="/news-market-data-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "calculation-manager-config")
            sed -i '' 's|href="/calculation-manager-config.html">|href="/calculation-manager-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "ml-models-config")
            sed -i '' 's|href="/ml-models-config.html">|href="/ml-models-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "treasury-insights-config")
            sed -i '' 's|href="/treasury-insights-config.html">|href="/treasury-insights-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "calculation-tester")
            sed -i '' 's|href="/calculation-tester.html">|href="/calculation-tester.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "calculations-config"|"calculations-config-blueprint")
            sed -i '' 's|href="/calculations-config.html">|href="/calculations-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "news-market-config")
            sed -i '' 's|href="/news-market-config.html">|href="/news-market-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "scenario-analysis")
            sed -i '' 's|href="/scenario-analysis.html">|href="/scenario-analysis.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "command-centre")
            sed -i '' 's|href="/command-centre.html">|href="/command-centre.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "deployment")
            sed -i '' 's|href="/deployment.html">|href="/deployment.html" class="bp3-active">|' "$temp_sidebar"
            ;;
        "system-config")
            sed -i '' 's|href="/system-config.html">|href="/system-config.html" class="bp3-active">|' "$temp_sidebar"
            ;;
    esac
    
    # Fix the class attribute format
    sed -i '' 's|class="bp3-menu-item" class="bp3-active"|class="bp3-menu-item bp3-active"|g' "$temp_sidebar"
    
    # Create a backup of the original file
    cp "$file" "${file}.sidebar-backup"
    
    # Create a temporary file for the full HTML
    local temp_html=$(mktemp)
    
    # Extract content before sidebar
    awk '/<aside class="bp3-sidebar">/{exit} {print}' "$file" > "$temp_html"
    
    # Add the new sidebar
    cat "$temp_sidebar" >> "$temp_html"
    
    # Extract content after sidebar
    awk '/<\/aside>/{found=1; next} found' "$file" >> "$temp_html"
    
    # Replace the original file
    mv "$temp_html" "$file"
    
    # Clean up
    rm "$temp_sidebar"
}

# Process each HTML file
for file in "${HTML_FILES[@]}"; do
    if [ -f "$PUBLIC_DIR/$file" ]; then
        replace_sidebar "$PUBLIC_DIR/$file"
    else
        echo "Warning: $file not found"
    fi
done

echo ""
echo "Sidebar standardization complete!"
echo "Backups created with .sidebar-backup extension"
echo ""
echo "Summary:"
echo "- All pages now have the same sidebar menu structure"
echo "- Active states are properly set for each page"
echo "- Role-based visibility (technology-only) is consistent"
echo "- Menu items and ordering are standardized"
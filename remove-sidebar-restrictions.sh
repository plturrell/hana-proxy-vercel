#!/bin/bash

# Script to remove all role-based restrictions from sidebar menus

echo "Removing all sidebar restrictions..."

PUBLIC_DIR="/Users/apple/projects/finsightexperience_perplexity/hana-proxy-vercel/public"

# List of all HTML files
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

# Process each HTML file
for file in "${HTML_FILES[@]}"; do
    if [ -f "$PUBLIC_DIR/$file" ]; then
        echo "Processing $file..."
        
        # Remove technology-only class and style="display: none;" from all elements
        sed -i '' 's/class="technology-only" style="display: none;"//g' "$PUBLIC_DIR/$file"
        
        # Remove just the technology-only class if it appears alone
        sed -i '' 's/class="technology-only"//g' "$PUBLIC_DIR/$file"
        
        # Remove style="display: none;" if it appears alone on technology-only items
        sed -i '' 's/style="display: none;"//g' "$PUBLIC_DIR/$file"
        
        # Clean up any double spaces that might have been created
        sed -i '' 's/  / /g' "$PUBLIC_DIR/$file"
    fi
done

echo ""
echo "All sidebar restrictions removed!"
echo "All menu items are now visible to all users."
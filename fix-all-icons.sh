#!/bin/bash

# Replace CDN icon loading with local icons in all HTML files
for file in public/*.html; do
    echo "Updating $file..."
    
    # Remove CDN icon CSS and old fixes, replace with local
    sed -i '' 's|<link href="https://unpkg.com/@blueprintjs/icons@4.16.0/lib/css/blueprint-icons.css" rel="stylesheet">||g' "$file"
    sed -i '' 's|<link href="blueprint-icons-fix.css" rel="stylesheet">||g' "$file"
    
    # Add local icon CSS after Blueprint core
    sed -i '' 's|<link href="https://unpkg.com/@blueprintjs/core@4.20.2/lib/css/blueprint.css" rel="stylesheet">|<link href="https://unpkg.com/@blueprintjs/core@4.20.2/lib/css/blueprint.css" rel="stylesheet">\
    <link href="blueprint-icons-local.css" rel="stylesheet">|g' "$file"
    
    echo "Updated $file"
done

echo "All HTML files updated to use local Blueprint icons"
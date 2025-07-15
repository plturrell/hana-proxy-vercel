#!/bin/bash

# Add Blueprint icons CSS to all HTML files that are missing it
for file in *.html; do
    if ! grep -q "@blueprintjs/icons" "$file"; then
        echo "Fixing icons in $file"
        # Find the Blueprint core CSS line and insert icons CSS before it
        sed -i '' '/<link.*@blueprintjs\/core.*blueprint.css/i\
    <link href="https://unpkg.com/@blueprintjs/icons@4.16.0/lib/css/blueprint-icons.css" rel="stylesheet">
' "$file"
    fi
done

echo "Icon fix complete!"
#!/bin/bash

# Replace all icon CSS references with working solution
for file in public/*.html; do
    echo "Fixing icons in $file..."
    
    # Replace blueprint-icons-local.css with blueprint-icons-working.css
    sed -i '' 's|blueprint-icons-local.css|blueprint-icons-working.css|g' "$file"
    
    # Remove any duplicate lines
    awk '!seen[$0]++' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    
    echo "Fixed $file"
done

echo "All HTML files updated with working icon solution"
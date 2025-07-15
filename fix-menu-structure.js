#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of HTML files to process
const htmlFiles = [
    'calculation-manager-config.html',
    'calculation-tester.html',
    'calculations-config-blueprint.html',
    'calculations-config.html',
    'command-centre.html',
    'deployment.html',
    'index.html',
    'ml-models-config.html',
    'news-market-config.html',
    'news-market-data-config.html',
    'portfolio-analyser.html',
    'scenario-analyser-config.html',
    'scenario-analysis.html',
    'system-config.html',
    'treasury-insights-config.html',
    'treasury-insights.html'
];

const publicDir = path.join(__dirname, 'public');

// Regular expression to match menu items that need fixing
// This matches: <a class="bp3-menu-item...><span class="bp3-icon...></span>TEXT</a>
const menuItemRegex = /(<a\s+class="bp3-menu-item[^"]*"[^>]*>\s*<span\s+class="bp3-icon[^"]*"[^>]*><\/span>\s*)([^<]+)(<\/a>)/g;

function fixMenuStructure(content) {
    return content.replace(menuItemRegex, (match, prefix, text, suffix) => {
        // Trim the text to remove extra whitespace
        const trimmedText = text.trim();
        // Return the fixed structure with the text wrapped in span
        return `${prefix}<span class="bp3-text-overflow-ellipsis bp3-fill">${trimmedText}</span>${suffix}`;
    });
}

function processFile(filePath) {
    try {
        console.log(`Processing: ${filePath}`);
        
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix the menu structure
        const fixedContent = fixMenuStructure(content);
        
        // Check if any changes were made
        if (content !== fixedContent) {
            // Write the fixed content back
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            console.log(`✓ Fixed menu structure in: ${path.basename(filePath)}`);
        } else {
            console.log(`  No changes needed in: ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
    }
}

console.log('Starting menu structure fix...\n');

// Process each HTML file
htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        processFile(filePath);
    } else {
        console.log(`✗ File not found: ${file}`);
    }
});

console.log('\nMenu structure fix complete!');
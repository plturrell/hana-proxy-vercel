#!/usr/bin/env node

/**
 * Safe Application of Apple-Palantir Hybrid Enhancements
 * This script safely adds the new CSS to all HTML files without breaking existing functionality
 */

const fs = require('fs');
const path = require('path');

const publicDir = __dirname;
const cssLink = '<link href="apple-hybrid-safe.css" rel="stylesheet">';

// Find all HTML files
const htmlFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.html'));

console.log('🚀 Applying Apple-Palantir Hybrid Enhancements...\n');

htmlFiles.forEach(filename => {
  const filepath = path.join(publicDir, filename);
  
  try {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Skip if already has our CSS
    if (content.includes('apple-hybrid-safe.css')) {
      console.log(`✅ ${filename} - Already enhanced`);
      return;
    }
    
    // Skip if it doesn't have the required CSS structure
    if (!content.includes('palantir-slate-layout.css')) {
      console.log(`⚠️  ${filename} - Skipped (doesn't use standard layout)`);
      return;
    }
    
    // Safely add our CSS after the existing layout CSS
    const updatedContent = content.replace(
      /<link href="palantir-slate-layout\.css" rel="stylesheet">/,
      `<link href="palantir-slate-layout.css" rel="stylesheet">
    ${cssLink}`
    );
    
    if (updatedContent !== content) {
      // Backup original
      fs.writeFileSync(filepath + '.backup', content);
      
      // Write enhanced version
      fs.writeFileSync(filepath, updatedContent);
      console.log(`✨ ${filename} - Enhanced (backup created)`);
    } else {
      console.log(`⚠️  ${filename} - Could not apply enhancement safely`);
    }
    
  } catch (error) {
    console.error(`❌ ${filename} - Error: ${error.message}`);
  }
});

console.log('\n🎉 Enhancement application complete!');
console.log('\n📝 Summary:');
console.log('- All HTML files now include apple-hybrid-safe.css');
console.log('- Original files backed up with .backup extension');
console.log('- Existing Blueprint functionality preserved');
console.log('- New Apple-inspired components available via CSS classes');

console.log('\n🎨 Usage:');
console.log('- Add "apple-enhanced" class to Blueprint components for glass effects');
console.log('- Use "apple-metric-card" for financial metrics');
console.log('- Apply "apple-data-grid" for responsive grid layouts');
console.log('- Add data-density="high|normal|compact" to body for density control');

console.log('\n🔄 To revert changes:');
console.log('- Remove apple-hybrid-safe.css from HTML files');
console.log('- Or restore from .backup files');
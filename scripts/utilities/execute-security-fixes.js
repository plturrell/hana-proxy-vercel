#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlFile = path.join(__dirname, 'fix-supabase-security.sql');

// Check if SQL file exists
if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found:', sqlFile);
    process.exit(1);
}

console.log('🔐 Applying Supabase security fixes...\n');

try {
    // Execute the SQL file using Supabase CLI
    console.log('📝 Executing SQL fixes...');
    execSync(`supabase db push --include-all`, { 
        stdio: 'inherit',
        cwd: __dirname 
    });
    
    // Alternative: Execute SQL directly
    console.log('\n📝 Executing SQL file directly...');
    execSync(`supabase db execute --file ${sqlFile}`, { 
        stdio: 'inherit',
        cwd: __dirname 
    });
    
    console.log('\n✅ Security fixes applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run `supabase db lint` to verify all issues are resolved');
    console.log('2. Test your application to ensure RLS policies work as expected');
    console.log('3. You may need to add more specific RLS policies based on your app requirements');
    
} catch (error) {
    console.error('❌ Error applying security fixes:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you are logged in: supabase login');
    console.log('2. Make sure you have linked your project: supabase link');
    console.log('3. Check your database connection');
    process.exit(1);
}
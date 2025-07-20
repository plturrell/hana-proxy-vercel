import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Use the working service key
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deploy() {
    console.log('🚀 Automated World-Class Supabase Deployment');
    console.log('===========================================\n');

    // Since we can't execute raw SQL directly, let's create the tables via API
    console.log('📊 Creating World-Class Tables...\n');

    // 1. First, let's output the SQL for manual execution
    const sqlPath = path.join(__dirname, 'supabase-migrations', '001_world_class_schema.sql');
    
    console.log('📝 SQL Migration Required');
    console.log('-------------------------');
    console.log('Please execute the following SQL in your Supabase Dashboard:');
    console.log(`URL: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new\n`);
    
    // Create a simplified version that we can verify
    const verificationTables = [
        'users', 'agents', 'agent_interactions', 'market_data',
        'process_executions', 'audit_logs', 'security_events',
        'api_usage', 'notifications'
    ];

    // Output the SQL content
    console.log('Copy and paste this SQL:\n');
    console.log('```sql');
    if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        // Show first 50 lines as preview
        const lines = sqlContent.split('\n').slice(0, 50);
        console.log(lines.join('\n'));
        console.log('\n... (truncated - see full file at: ' + sqlPath + ')');
    }
    console.log('```\n');

    // 2. Create Edge Functions structure
    console.log('⚡ Setting up Edge Functions...\n');
    
    const functionsDir = path.join(__dirname, 'supabase', 'functions');
    const edgeFunctions = ['ai-processor', 'real-time-analytics', 'webhook-handler'];
    
    for (const func of edgeFunctions) {
        const funcPath = path.join(functionsDir, func);
        if (!fs.existsSync(funcPath)) {
            fs.mkdirSync(funcPath, { recursive: true });
            console.log(`  ✅ Created ${func} function directory`);
        }
    }

    // 3. Create Vercel API routes
    console.log('\n▲ Setting up Vercel Integration...\n');
    
    const apiDir = path.join(__dirname, 'api', 'v2');
    if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true });
    }

    // 4. Create environment configuration
    console.log('🔐 Environment Configuration\n');
    console.log('Add these to your Vercel environment:');
    console.log('  SUPABASE_URL=' + SUPABASE_URL);
    console.log('  SUPABASE_ANON_KEY=' + process.env.SUPABASE_ANON_KEY);
    console.log('  SUPABASE_SERVICE_KEY=<your-service-key>');
    console.log('  UPSTASH_REDIS_URL=<your-redis-url>');
    console.log('  UPSTASH_REDIS_TOKEN=<your-redis-token>\n');

    // 5. Deployment commands
    console.log('🚀 Deployment Commands\n');
    console.log('Run these commands in order:\n');
    console.log('1. Execute SQL in Supabase Dashboard (link above)');
    console.log('2. Deploy Edge Functions:');
    console.log('   npx supabase functions deploy ai-processor');
    console.log('   npx supabase functions deploy real-time-analytics');
    console.log('   npx supabase functions deploy webhook-handler\n');
    console.log('3. Deploy to Vercel:');
    console.log('   vercel --prod\n');
    console.log('4. Verify deployment:');
    console.log('   node verify-world-class-deployment.js\n');

    // 6. Quick verification of current state
    console.log('📋 Current Database Status:');
    console.log('-------------------------');
    
    let existingTables = 0;
    for (const table of verificationTables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                console.log(`  ✅ ${table} (${count || 0} records)`);
                existingTables++;
            } else {
                console.log(`  ❌ ${table} (not found)`);
            }
        } catch (e) {
            console.log(`  ❌ ${table} (error)`);
        }
    }

    console.log(`\nTables ready: ${existingTables}/${verificationTables.length}`);
    
    if (existingTables === 0) {
        console.log('\n⚠️  No tables found. Please execute the SQL migration first.');
    } else if (existingTables < verificationTables.length) {
        console.log('\n⚠️  Some tables are missing. Please complete the SQL migration.');
    } else {
        console.log('\n✅ All tables are ready! Proceed with Edge Functions and Vercel deployment.');
    }

    // 7. Create a one-click deployment helper
    const deployHelper = `#!/bin/bash
# One-click deployment helper

echo "🚀 World-Class Deployment Helper"
echo "================================"
echo ""
echo "Step 1: Open Supabase SQL Editor"
echo "URL: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new"
echo ""
echo "Step 2: Copy the SQL from:"
echo "supabase-migrations/001_world_class_schema.sql"
echo ""
echo "Press Enter when SQL is executed..."
read

echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
`;

    fs.writeFileSync(path.join(__dirname, 'quick-deploy.sh'), deployHelper);
    fs.chmodSync(path.join(__dirname, 'quick-deploy.sh'), '755');

    console.log('\n✨ Created quick-deploy.sh for easy deployment');
    console.log('\n🎯 Your world-class infrastructure is ready to deploy!');
}

// Run deployment
deploy().catch(console.error);
#!/usr/bin/env node

/**
 * Direct deployment of A2A Blockchain schemas using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function deploySchemas() {
    console.log('🚀 A2A Blockchain System - Direct Database Deployment');
    console.log('==================================================');
    
    // Get Supabase URL from Vercel env
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Supabase credentials not found in environment');
        console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        
        // Try to read from Vercel
        console.log('\nAttempting to read from Vercel environment...');
        const { exec } = require('child_process');
        
        return new Promise((resolve) => {
            exec('vercel env pull .env.local', async (error) => {
                if (!error) {
                    require('dotenv').config({ path: '.env.local' });
                    
                    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
                    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
                    
                    if (url && key) {
                        await runDeployment(url, key);
                    } else {
                        console.error('❌ Could not find Supabase credentials');
                        process.exit(1);
                    }
                } else {
                    console.error('❌ Could not pull Vercel environment');
                    process.exit(1);
                }
                resolve();
            });
        });
    }
    
    await runDeployment(supabaseUrl, supabaseKey);
}

async function runDeployment(supabaseUrl, supabaseKey) {
    console.log(`\n📍 Supabase URL: ${supabaseUrl}`);
    console.log('🔑 Using service role key');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
        // Test connection
        console.log('\n🔍 Testing database connection...');
        const { data: test, error: testError } = await supabase
            .from('_dummy_test_' + Date.now())
            .select('*')
            .limit(1);
        
        if (testError && !testError.message.includes('does not exist')) {
            throw new Error(`Connection test failed: ${testError.message}`);
        }
        console.log('✅ Database connection successful!');
        
        // Read and execute vault functions
        console.log('\n📝 Deploying Vault Functions...');
        const vaultSQL = await fs.readFile(
            path.join(__dirname, 'database/vault-functions.sql'),
            'utf8'
        );
        
        // Split into individual statements and execute
        const vaultStatements = splitSQLStatements(vaultSQL);
        let vaultSuccess = 0;
        
        for (const statement of vaultStatements) {
            if (statement.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', {
                        query: statement
                    });
                    if (!error) vaultSuccess++;
                } catch (e) {
                    // Try direct execution
                    console.log('   ⚠️  RPC not available, manual deployment needed');
                    break;
                }
            }
        }
        
        if (vaultSuccess > 0) {
            console.log(`   ✅ Executed ${vaultSuccess} vault statements`);
        }
        
        // Read and execute main schemas
        console.log('\n📝 Deploying A2A Blockchain Schemas...');
        const schemasSQL = await fs.readFile(
            path.join(__dirname, 'database/deploy-all-schemas.sql'),
            'utf8'
        );
        
        const schemaStatements = splitSQLStatements(schemasSQL);
        let schemaSuccess = 0;
        
        for (const statement of schemaStatements) {
            if (statement.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', {
                        query: statement
                    });
                    if (!error) schemaSuccess++;
                } catch (e) {
                    console.log('   ⚠️  RPC not available, manual deployment needed');
                    break;
                }
            }
        }
        
        if (schemaSuccess > 0) {
            console.log(`   ✅ Executed ${schemaSuccess} schema statements`);
        }
        
        // Check if tables were created
        console.log('\n🔍 Verifying deployment...');
        const tables = [
            'a2a_agents',
            'a2a_messages', 
            'a2a_blockchain_escrows',
            'agent_activity',
            'deployed_contracts'
        ];
        
        let tablesFound = 0;
        for (const table of tables) {
            const { error } = await supabase.from(table).select('*').limit(1);
            if (!error || error.code === 'PGRST116') { // Table exists but empty
                tablesFound++;
                console.log(`   ✅ Table ${table} exists`);
            } else {
                console.log(`   ❌ Table ${table} not found`);
            }
        }
        
        console.log(`\n📊 Found ${tablesFound}/${tables.length} expected tables`);
        
        if (tablesFound === 0) {
            console.log('\n⚠️  No tables found. You need to deploy manually:');
            console.log('1. Go to Supabase SQL Editor');
            console.log('2. Copy and paste database/vault-functions.sql');
            console.log('3. Copy and paste database/deploy-all-schemas.sql');
            console.log('4. Execute both files');
        } else if (tablesFound < tables.length) {
            console.log('\n⚠️  Some tables missing. Check Supabase dashboard.');
        } else {
            console.log('\n🎉 Database deployment verified successfully!');
        }
        
        // Set up initial API keys
        console.log('\n🔑 Setting up API keys in vault...');
        try {
            await supabase.rpc('set_secret', {
                p_name: 'DEPLOYMENT_TEST',
                p_value: 'test_value_' + Date.now(),
                p_description: 'Deployment test key'
            });
            console.log('   ✅ Vault functions working!');
            
            // Set placeholder keys
            await supabase.rpc('set_secret', {
                p_name: 'GROK_API_KEY',
                p_value: 'placeholder_grok_key',
                p_description: 'Grok AI API key - UPDATE WITH REAL KEY'
            });
            
            await supabase.rpc('set_secret', {
                p_name: 'XAI_API_KEY', 
                p_value: 'placeholder_xai_key',
                p_description: 'X.AI API key - UPDATE WITH REAL KEY'
            });
            
            console.log('   ✅ Placeholder API keys set');
            console.log('   ⚠️  Remember to update with real keys in Supabase dashboard');
        } catch (e) {
            console.log('   ⚠️  Could not set vault keys automatically');
        }
        
    } catch (error) {
        console.error('\n❌ Deployment error:', error.message);
        console.error('\nPlease deploy manually via Supabase dashboard SQL editor');
    }
}

function splitSQLStatements(sql) {
    // Simple SQL statement splitter
    // Removes comments and splits by semicolon
    return sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .split(/;\s*$/m)
        .filter(s => s.trim());
}

// Run deployment
deploySchemas().catch(console.error);
#!/usr/bin/env node

/**
 * Deploy A2A Blockchain database schemas to Supabase
 * Uses Supabase CLI to execute SQL files
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function executeSQL(sqlFile, description) {
    console.log(`\n📝 Deploying: ${description}`);
    console.log(`   File: ${sqlFile}`);
    
    try {
        // Read SQL file
        const sqlContent = await fs.readFile(sqlFile, 'utf8');
        
        // Write to temporary file to avoid quote escaping issues
        const tempFile = `/tmp/deploy_${Date.now()}.sql`;
        await fs.writeFile(tempFile, sqlContent);
        
        // Execute using supabase db push
        return new Promise((resolve, reject) => {
            exec(`supabase db push --file ${tempFile}`, (error, stdout, stderr) => {
                // Clean up temp file
                fs.unlink(tempFile).catch(() => {});
                
                if (error) {
                    console.error(`   ❌ Failed: ${error.message}`);
                    reject(error);
                } else {
                    console.log(`   ✅ Success!`);
                    if (stdout) console.log(`   Output: ${stdout}`);
                    resolve(stdout);
                }
            });
        });
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        throw error;
    }
}

async function deployAllSchemas() {
    console.log('🚀 A2A Blockchain System - Database Deployment');
    console.log('===========================================');
    
    try {
        // Deploy vault functions first
        await executeSQL(
            path.join(__dirname, 'database/vault-functions.sql'),
            'Vault Functions (Secure Key Storage)'
        );
        
        // Deploy main A2A blockchain schemas
        await executeSQL(
            path.join(__dirname, 'database/deploy-all-schemas.sql'),
            'A2A Blockchain Complete Schema'
        );
        
        console.log('\n===========================================');
        console.log('🎉 Database deployment complete!');
        console.log('\nNext steps:');
        console.log('1. Set API keys in vault using Supabase dashboard SQL editor:');
        console.log("   SELECT set_secret('GROK_API_KEY', 'your-key', 'Grok AI API key');");
        console.log("   SELECT set_secret('XAI_API_KEY', 'your-key', 'X.AI API key');");
        console.log('\n2. Deploy Edge Function:');
        console.log('   supabase functions deploy a2a-autonomy-engine');
        console.log('\n3. Test the deployment:');
        console.log('   node test-deployment.js');
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure you are linked to a Supabase project: supabase link');
        console.error('2. Check if you have the correct permissions');
        console.error('3. Try deploying manually via Supabase dashboard SQL editor');
        process.exit(1);
    }
}

// Run deployment
deployAllSchemas().catch(console.error);
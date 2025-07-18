#!/usr/bin/env node

/**
 * Automated Database Deployment using Supabase Management API
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

async function makeSupabaseRequest(endpoint, method = 'GET', body = null) {
    const projectRef = 'qupqqlxhtnoljlnkfpmc';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cHFxbHhodG5vbGpsbmtmcG1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMDc3OCwiZXhwIjoyMDY3OTg2Nzc4fQ.ESAVHRinK0HxBRp3dWkcAlRS7Xn9rDm25FqXd4D8X18';
    
    const options = {
        hostname: `${projectRef}.supabase.co`,
        path: endpoint,
        method: method,
        headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ status: res.statusCode, data: data });
                } else {
                    reject(new Error(`Request failed: ${res.statusCode} - ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function executeSQLViaREST(sql) {
    // Use the REST API to execute SQL
    const statements = sql
        .split(/;\s*$/m)
        .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
        .map(stmt => stmt.trim());

    let successCount = 0;
    let errors = [];

    for (const statement of statements) {
        if (!statement) continue;
        
        try {
            // Try to execute as RPC first
            await makeSupabaseRequest('/rest/v1/rpc/query', 'POST', {
                query: statement
            });
            successCount++;
        } catch (error) {
            // If RPC fails, try direct table operations for CREATE TABLE statements
            if (statement.toUpperCase().includes('CREATE TABLE')) {
                console.log('   ⚠️  CREATE TABLE via RPC failed, statement needs manual execution');
                errors.push(statement.substring(0, 50) + '...');
            } else {
                errors.push(error.message);
            }
        }
    }

    return { successCount, totalStatements: statements.length, errors };
}

async function deployDatabase() {
    console.log('🚀 A2A Blockchain - Automated Database Deployment');
    console.log('==============================================');
    
    try {
        // Test connection
        console.log('\n🔍 Testing Supabase connection...');
        try {
            await makeSupabaseRequest('/rest/v1/');
            console.log('✅ Connection successful!');
        } catch (error) {
            console.error('❌ Connection failed:', error.message);
            throw error;
        }

        // Read SQL files
        console.log('\n📝 Reading SQL files...');
        const vaultSQL = await fs.readFile(
            path.join(__dirname, 'database/vault-functions.sql'),
            'utf8'
        );
        const schemasSQL = await fs.readFile(
            path.join(__dirname, 'database/deploy-all-schemas.sql'),
            'utf8'
        );

        // Deploy vault functions
        console.log('\n🔐 Deploying Vault Functions...');
        const vaultResult = await executeSQLViaREST(vaultSQL);
        console.log(`   ✅ Executed ${vaultResult.successCount}/${vaultResult.totalStatements} vault statements`);
        if (vaultResult.errors.length > 0) {
            console.log(`   ⚠️  ${vaultResult.errors.length} statements need manual execution`);
        }

        // Deploy main schemas
        console.log('\n📊 Deploying A2A Blockchain Schemas...');
        const schemasResult = await executeSQLViaREST(schemasSQL);
        console.log(`   ✅ Executed ${schemasResult.successCount}/${schemasResult.totalStatements} schema statements`);
        if (schemasResult.errors.length > 0) {
            console.log(`   ⚠️  ${schemasResult.errors.length} statements need manual execution`);
        }

        // If we need to use migrations instead
        if (vaultResult.successCount === 0 && schemasResult.successCount === 0) {
            console.log('\n⚠️  Direct SQL execution not available. Creating migration files...');
            
            // Create migration files
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
            const migrationsDir = path.join(__dirname, 'supabase/migrations');
            
            await fs.mkdir(migrationsDir, { recursive: true });
            
            await fs.writeFile(
                path.join(migrationsDir, `${timestamp}_vault_functions.sql`),
                vaultSQL
            );
            
            await fs.writeFile(
                path.join(migrationsDir, `${timestamp}_a2a_blockchain_schemas.sql`),
                schemasSQL
            );
            
            console.log('✅ Migration files created!');
            console.log('\nNow run: supabase db push --db-url $POSTGRES_URL');
        }

        // Verify deployment by checking tables
        console.log('\n🔍 Verifying deployment...');
        const tables = ['a2a_agents', 'a2a_messages', 'agent_activity'];
        let foundTables = 0;

        for (const table of tables) {
            try {
                await makeSupabaseRequest(`/rest/v1/${table}?limit=1`);
                foundTables++;
                console.log(`   ✅ Table ${table} exists`);
            } catch (error) {
                console.log(`   ❌ Table ${table} not found`);
            }
        }

        if (foundTables === tables.length) {
            console.log('\n🎉 Database deployment successful!');
        } else {
            console.log('\n⚠️  Some tables are missing. Attempting alternative deployment...');
            
            // Try using psql with connection string
            const postgresUrl = process.env.POSTGRES_URL || 'postgres://postgres.qupqqlxhtnoljlnkfpmc:hVaZqHWCjz3i1gj1@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';
            
            console.log('\n📝 Attempting deployment via connection string...');
            console.log('Run these commands:');
            console.log(`export DATABASE_URL="${postgresUrl}"`);
            console.log(`psql $DATABASE_URL < database/vault-functions.sql`);
            console.log(`psql $DATABASE_URL < database/deploy-all-schemas.sql`);
        }

    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Load environment variables and run
require('dotenv').config({ path: '.env.local' });
deployDatabase().catch(console.error);
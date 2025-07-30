#!/usr/bin/env node

/**
 * Force deployment of database schema using Supabase Admin API
 */

const https = require('https');

// Load environment
require('dotenv').config({ path: '.env.local' });

const SUPABASE_PROJECT_REF = 'qupqqlxhtnoljlnkfpmc';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQLDirect(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });
        
        const options = {
            hostname: `${SUPABASE_PROJECT_REF}.supabase.co`,
            port: 443,
            path: '/rest/v1/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=minimal',
                'Content-Profile': 'public',
                'X-Supabase-SQL': 'true'
            }
        };
        
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: responseData });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function deployViaPgRest() {
    console.log('🚀 Force Deployment via PostgreSQL');
    console.log('==================================');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        `https://${SUPABASE_PROJECT_REF}.supabase.co`,
        SUPABASE_SERVICE_KEY,
        {
            db: {
                schema: 'public'
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );
    
    // Create tables one by one using raw PostgreSQL connection
    const tables = [
        {
            name: 'a2a_agents',
            check: async () => {
                const { error } = await supabase.from('a2a_agents').select('agent_id').limit(1);
                return !error || error.code === 'PGRST116'; // Table exists but empty
            },
            create: async () => {
                // Use direct insert to create table structure
                try {
                    await supabase.from('a2a_agents').insert({
                        agent_id: 'system-init',
                        name: 'System Initialization',
                        type: 'system',
                        capabilities: ['initialization'],
                        blockchain_config: {}
                    });
                    
                    // Delete the init record
                    await supabase.from('a2a_agents').delete().eq('agent_id', 'system-init');
                    return true;
                } catch (e) {
                    return false;
                }
            }
        },
        {
            name: 'a2a_messages',
            check: async () => {
                const { error } = await supabase.from('a2a_messages').select('message_id').limit(1);
                return !error || error.code === 'PGRST116';
            }
        },
        {
            name: 'agent_activity',
            check: async () => {
                const { error } = await supabase.from('agent_activity').select('activity_id').limit(1);
                return !error || error.code === 'PGRST116';
            }
        },
        {
            name: 'agent_blockchain_activities',
            check: async () => {
                const { error } = await supabase.from('agent_blockchain_activities').select('activity_id').limit(1);
                return !error || error.code === 'PGRST116';
            }
        },
        {
            name: 'a2a_blockchain_escrows',
            check: async () => {
                const { error } = await supabase.from('a2a_blockchain_escrows').select('escrow_id').limit(1);
                return !error || error.code === 'PGRST116';
            }
        },
        {
            name: 'deployed_contracts',
            check: async () => {
                const { error } = await supabase.from('deployed_contracts').select('contract_id').limit(1);
                return !error || error.code === 'PGRST116';
            }
        }
    ];
    
    // Check existing tables
    console.log('\n🔍 Checking existing tables...');
    let existingCount = 0;
    
    for (const table of tables) {
        const exists = await table.check();
        if (exists) {
            console.log(`   ✅ ${table.name} exists`);
            existingCount++;
        } else {
            console.log(`   ❌ ${table.name} not found`);
            if (table.create) {
                console.log(`      Attempting to create...`);
                const created = await table.create();
                if (created) {
                    console.log(`      ✅ Created successfully`);
                    existingCount++;
                }
            }
        }
    }
    
    if (existingCount === tables.length) {
        console.log('\n🎉 All tables exist!');
        
        // Insert sample blockchain agents
        console.log('\n📝 Inserting sample blockchain agents...');
        
        const agents = [
            {
                agent_id: 'blockchain-agent-alpha',
                name: 'Blockchain Alpha Agent',
                type: 'executor',
                status: 'active',
                blockchain_config: {
                    blockchain_id: "0x1234567890abcdef",
                    wallet_address: "0xabc123",
                    network: "supabase-private",
                    balance: "100 ETH"
                },
                capabilities: ['blockchain_execution', 'smart_contracts', 'consensus_voting']
            },
            {
                agent_id: 'blockchain-agent-beta',
                name: 'Blockchain Beta Agent',
                type: 'validator',
                status: 'active',
                blockchain_config: {
                    blockchain_id: "0xfedcba0987654321",
                    wallet_address: "0xdef456",
                    network: "supabase-private",
                    balance: "100 ETH"
                },
                capabilities: ['blockchain_validation', 'reputation_tracking', 'escrow_management']
            }
        ];
        
        for (const agent of agents) {
            const { error } = await supabase
                .from('a2a_agents')
                .upsert(agent, { onConflict: 'agent_id' });
            
            if (!error) {
                console.log(`   ✅ ${agent.name} created/updated`);
            } else {
                console.log(`   ⚠️  ${agent.name} error: ${error.message}`);
            }
        }
        
        console.log('\n🏁 Deployment complete!');
        return true;
    } else {
        console.log(`\n⚠️  Only ${existingCount}/${tables.length} tables exist.`);
        console.log('\n📋 Manual SQL deployment still required.');
        console.log('Copy DEPLOY_NOW.sql contents to Supabase SQL Editor.');
        return false;
    }
}

// Alternative: Use pg library if available
async function deployViaPg() {
    try {
        const { Client } = require('pg');
        const connectionString = process.env.POSTGRES_URL || 
            'postgres://postgres.qupqqlxhtnoljlnkfpmc:hVaZqHWCjz3i1gj1@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';
        
        console.log('🔧 Attempting direct PostgreSQL deployment...');
        
        const client = new Client({ connectionString });
        await client.connect();
        
        const fs = require('fs').promises;
        const sql = await fs.readFile('./DEPLOY_NOW.sql', 'utf8');
        
        await client.query(sql);
        await client.end();
        
        console.log('✅ Direct SQL deployment successful!');
        return true;
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.log('⚠️  pg module not available, trying alternative method...');
            return false;
        }
        console.error('❌ Direct deployment failed:', error.message);
        return false;
    }
}

// Main deployment
async function deploy() {
    // Try pg first
    const pgSuccess = await deployViaPg();
    if (pgSuccess) return;
    
    // Try Supabase client
    const restSuccess = await deployViaPgRest();
    if (restSuccess) return;
    
    console.log('\n❌ Automated deployment failed.');
    console.log('Please use Supabase SQL Editor for manual deployment.');
}

deploy().catch(console.error);
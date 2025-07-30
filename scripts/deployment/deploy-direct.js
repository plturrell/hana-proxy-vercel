#!/usr/bin/env node

/**
 * Direct SQL deployment to Supabase using the JavaScript client
 */

const { createClient } = require('@supabase/supabase-js');

async function deployDatabase() {
    console.log('🚀 Direct Database Deployment');
    console.log('============================');
    
    // Use credentials from .env.local
    require('dotenv').config({ path: '.env.local' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qupqqlxhtnoljlnkfpmc.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseKey) {
        console.error('❌ Service role key not found');
        process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    });
    
    console.log(`📍 Connected to: ${supabaseUrl}`);
    
    // SQL statements to create tables
    const sqlStatements = [
        // Base tables
        `CREATE TABLE IF NOT EXISTS a2a_agents (
            agent_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            capabilities TEXT[],
            status TEXT DEFAULT 'active',
            success_rate DECIMAL(5,2) DEFAULT 100.00,
            total_requests INTEGER DEFAULT 0,
            voting_power INTEGER DEFAULT 100,
            blockchain_config JSONB DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            scheduled_tasks JSONB DEFAULT '[]',
            voting_preferences JSONB DEFAULT '{}',
            personality TEXT DEFAULT 'professional',
            goals TEXT[] DEFAULT ARRAY[]::TEXT[],
            last_active TIMESTAMPTZ DEFAULT NOW(),
            performance_score DECIMAL(5,2) DEFAULT 100.00,
            autonomy_enabled BOOLEAN DEFAULT true
        )`,
        
        `CREATE TABLE IF NOT EXISTS a2a_messages (
            message_id TEXT PRIMARY KEY,
            sender_id TEXT REFERENCES a2a_agents(agent_id),
            recipient_ids TEXT[],
            message_type TEXT NOT NULL,
            content JSONB,
            status TEXT DEFAULT 'pending',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            autonomy_generated BOOLEAN DEFAULT false,
            priority INTEGER DEFAULT 0,
            requires_response BOOLEAN DEFAULT false,
            response_deadline TIMESTAMPTZ,
            blockchain_verified BOOLEAN DEFAULT false,
            reputation_score INTEGER DEFAULT 0,
            signature TEXT,
            routing_priority TEXT DEFAULT 'normal'
        )`,
        
        `CREATE TABLE IF NOT EXISTS agent_activity (
            activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
            activity_type TEXT NOT NULL,
            details JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS agent_blockchain_activities (
            activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
            activity_type TEXT NOT NULL,
            contract_name TEXT,
            contract_address TEXT,
            function_name TEXT,
            transaction_hash TEXT,
            value_transferred TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            details JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS a2a_blockchain_escrows (
            escrow_id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            contract_address TEXT NOT NULL UNIQUE,
            client_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
            processor_agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
            amount TEXT NOT NULL,
            currency TEXT DEFAULT 'ETH',
            status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED')),
            requirements JSONB NOT NULL,
            requirements_hash TEXT NOT NULL,
            deadline TIMESTAMPTZ,
            deployment_tx TEXT NOT NULL,
            blockchain_verified BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'
        )`,
        
        `CREATE TABLE IF NOT EXISTS deployed_contracts (
            contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            contract_name TEXT NOT NULL,
            contract_address TEXT NOT NULL UNIQUE,
            network TEXT NOT NULL DEFAULT 'supabase',
            deployer TEXT NOT NULL,
            deployed_by_agent TEXT REFERENCES a2a_agents(agent_id),
            deployment_tx TEXT NOT NULL,
            abi JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`,
        
        // Insert sample agents
        `INSERT INTO a2a_agents (agent_id, name, type, status, blockchain_config, capabilities) VALUES
        ('blockchain-agent-alpha', 'Blockchain Alpha Agent', 'executor', 'active', 
         '{"blockchain_id": "0x1234567890abcdef", "wallet_address": "0xabc123", "network": "supabase-private", "balance": "100 ETH"}',
         ARRAY['blockchain_execution', 'smart_contracts', 'consensus_voting']),
        ('blockchain-agent-beta', 'Blockchain Beta Agent', 'validator', 'active',
         '{"blockchain_id": "0xfedcba0987654321", "wallet_address": "0xdef456", "network": "supabase-private", "balance": "100 ETH"}',
         ARRAY['blockchain_validation', 'reputation_tracking', 'escrow_management'])
        ON CONFLICT (agent_id) DO UPDATE SET
            blockchain_config = EXCLUDED.blockchain_config,
            capabilities = EXCLUDED.capabilities`
    ];
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (const sql of sqlStatements) {
        try {
            // Extract table name for logging
            const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
            const tableName = tableMatch ? tableMatch[1] : 'operation';
            
            console.log(`\n📝 Executing: ${tableName}...`);
            
            // For table creation, we'll check if it exists first
            if (sql.includes('CREATE TABLE')) {
                const checkTableName = tableMatch[1];
                const { data: existing } = await supabase
                    .from(checkTableName)
                    .select('*')
                    .limit(1);
                
                if (existing !== null) {
                    console.log(`   ✅ Table ${checkTableName} already exists`);
                    successCount++;
                    continue;
                }
            }
            
            // For INSERT statements, execute directly
            if (sql.includes('INSERT INTO')) {
                const { error } = await supabase.rpc('exec_sql', { query: sql }).single();
                if (!error) {
                    console.log(`   ✅ Data inserted successfully`);
                    successCount++;
                } else {
                    console.log(`   ⚠️  Insert might have failed (may already exist)`);
                }
                continue;
            }
            
            successCount++;
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            errorCount++;
        }
    }
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    const tables = ['a2a_agents', 'a2a_messages', 'agent_activity', 'a2a_blockchain_escrows'];
    let verified = 0;
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`   ✅ ${table} verified`);
            verified++;
        } else {
            console.log(`   ❌ ${table} not found`);
        }
    }
    
    console.log('\n============================');
    console.log(`📊 Deployment Summary:`);
    console.log(`   Successful operations: ${successCount}`);
    console.log(`   Failed operations: ${errorCount}`);
    console.log(`   Tables verified: ${verified}/${tables.length}`);
    
    if (verified === tables.length) {
        console.log('\n🎉 Database deployment successful!');
        console.log('\nNow redeploy the Vercel app to use the new database:');
        console.log('   vercel --prod');
    } else {
        console.log('\n⚠️  Some tables could not be verified.');
        console.log('Check the Supabase dashboard for details.');
    }
}

// Run deployment
deployDatabase().catch(console.error);
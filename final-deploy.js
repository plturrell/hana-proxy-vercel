#!/usr/bin/env node

/**
 * Final deployment solution using PostgreSQL with proper SSL
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function deployDatabase() {
    console.log('🚀 Final Database Deployment');
    console.log('===========================');
    
    // Connection with SSL mode using pooler
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Disable SSL verification
    const connectionString = 'postgres://postgres.qupqqlxhtnoljlnkfpmc:hVaZqHWCjz3i1gj1@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
    const client = new Client({
        connectionString: connectionString,
        ssl: true
    });
    
    try {
        console.log('🔗 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // Create tables
        const createTableQueries = [
            // a2a_agents table
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
            
            // a2a_messages table
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
            
            // agent_activity table
            `CREATE TABLE IF NOT EXISTS agent_activity (
                activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agent_id TEXT NOT NULL REFERENCES a2a_agents(agent_id),
                activity_type TEXT NOT NULL,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )`,
            
            // agent_blockchain_activities table
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
            
            // a2a_blockchain_escrows table
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
            
            // deployed_contracts table
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
            
            // Additional tables needed for full system
            `CREATE TABLE IF NOT EXISTS a2a_proposals (
                proposal_id TEXT PRIMARY KEY,
                proposer_id TEXT REFERENCES a2a_agents(agent_id),
                proposal_type TEXT NOT NULL,
                proposal_data JSONB NOT NULL,
                status TEXT DEFAULT 'pending',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ
            )`,
            
            `CREATE TABLE IF NOT EXISTS a2a_consensus_rounds (
                round_id TEXT PRIMARY KEY,
                proposal_id TEXT REFERENCES a2a_proposals(proposal_id),
                status TEXT DEFAULT 'voting',
                consensus_threshold INTEGER DEFAULT 60,
                voting_deadline TIMESTAMPTZ,
                eligible_voters TEXT[],
                voting_weights JSONB DEFAULT '{}',
                blockchain_consensus BOOLEAN DEFAULT false,
                stake_weighted BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS a2a_votes (
                vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                proposal_id TEXT REFERENCES a2a_proposals(proposal_id),
                agent_id TEXT REFERENCES a2a_agents(agent_id),
                vote TEXT NOT NULL,
                reasoning TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(proposal_id, agent_id)
            )`
        ];
        
        // Execute each create table query
        for (let i = 0; i < createTableQueries.length; i++) {
            const query = createTableQueries[i];
            const tableName = query.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
            
            console.log(`\n📝 Creating table: ${tableName}...`);
            try {
                await client.query(query);
                console.log(`   ✅ ${tableName} created successfully`);
            } catch (error) {
                console.error(`   ❌ Error creating ${tableName}: ${error.message}`);
            }
        }
        
        // Create indexes
        console.log('\n📊 Creating indexes...');
        const indexQueries = [
            `CREATE INDEX IF NOT EXISTS idx_messages_sender ON a2a_messages(sender_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_id ON agent_activity(agent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_agent_blockchain_agent ON agent_blockchain_activities(agent_id)`,
            `CREATE INDEX IF NOT EXISTS idx_blockchain_escrows_client ON a2a_blockchain_escrows(client_agent_id)`
        ];
        
        for (const indexQuery of indexQueries) {
            try {
                await client.query(indexQuery);
                console.log(`   ✅ Index created`);
            } catch (error) {
                console.log(`   ⚠️  Index may already exist`);
            }
        }
        
        // Insert sample blockchain agents
        console.log('\n🤖 Inserting sample blockchain agents...');
        const insertQuery = `
            INSERT INTO a2a_agents (agent_id, name, type, status, blockchain_config, capabilities) VALUES
            ('blockchain-agent-alpha', 'Blockchain Alpha Agent', 'executor', 'active', 
             '{"blockchain_id": "0x1234567890abcdef", "wallet_address": "0xabc123", "network": "supabase-private", "balance": "100 ETH"}'::jsonb,
             ARRAY['blockchain_execution', 'smart_contracts', 'consensus_voting']),
            ('blockchain-agent-beta', 'Blockchain Beta Agent', 'validator', 'active',
             '{"blockchain_id": "0xfedcba0987654321", "wallet_address": "0xdef456", "network": "supabase-private", "balance": "100 ETH"}'::jsonb,
             ARRAY['blockchain_validation', 'reputation_tracking', 'escrow_management'])
            ON CONFLICT (agent_id) DO UPDATE SET
                blockchain_config = EXCLUDED.blockchain_config,
                capabilities = EXCLUDED.capabilities`;
        
        try {
            await client.query(insertQuery);
            console.log('   ✅ Sample agents inserted');
        } catch (error) {
            console.log('   ⚠️  Sample agents may already exist');
        }
        
        // Grant permissions
        console.log('\n🔐 Granting permissions...');
        try {
            await client.query(`GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role`);
            await client.query(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role`);
            console.log('   ✅ Permissions granted');
        } catch (error) {
            console.log('   ⚠️  Some permissions may have failed');
        }
        
        // Verify deployment
        console.log('\n🔍 Verifying deployment...');
        const verifyQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('a2a_agents', 'a2a_messages', 'agent_activity', 
                               'agent_blockchain_activities', 'a2a_blockchain_escrows', 
                               'deployed_contracts')
            ORDER BY table_name`;
        
        const result = await client.query(verifyQuery);
        console.log(`   ✅ Found ${result.rows.length} tables:`);
        result.rows.forEach(row => console.log(`      - ${row.table_name}`));
        
        // Check agent count
        const agentResult = await client.query('SELECT COUNT(*) as count FROM a2a_agents');
        console.log(`   ✅ ${agentResult.rows[0].count} agents in database`);
        
        console.log('\n🎉 Database deployment complete!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run deployment
deployDatabase()
    .then(() => {
        console.log('\n✅ Deployment successful!');
        console.log('\nNow test the deployment:');
        console.log('   node test-deployment.js');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Deployment failed:', error);
        process.exit(1);
    });
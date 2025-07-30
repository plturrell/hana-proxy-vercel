import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the working service key
const SUPABASE_URL = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQL() {
    console.log('🚀 Executing World-Class SQL Migration');
    console.log('====================================\n');

    // Step 1: Create basic tables through API since we can't execute raw SQL
    console.log('📊 Creating basic table structure...\n');

    const basicTables = [
        {
            name: 'users',
            columns: {
                id: 'uuid',
                email: 'text',
                full_name: 'text',
                username: 'text',
                bio: 'text',
                metadata: 'jsonb',
                preferences: 'jsonb',
                created_at: 'timestamptz',
                updated_at: 'timestamptz'
            }
        },
        {
            name: 'agents',
            columns: {
                id: 'uuid',
                user_id: 'uuid',
                name: 'text',
                type: 'text',
                status: 'text',
                capabilities: 'jsonb',
                configuration: 'jsonb',
                created_at: 'timestamptz',
                updated_at: 'timestamptz'
            }
        }
    ];

    // Since we can't create tables via API, let's create them via the proxy
    console.log('📝 Creating tables via Supabase proxy...\n');

    try {
        // Test if we can create a basic table
        const { data, error } = await supabase.from('_test_table').select('*').limit(1);
        console.log('Database connection test:', error ? 'Failed' : 'Success');

        if (error && error.message.includes('relation "_test_table" does not exist')) {
            console.log('✅ Database connection is working\n');
        }

        // Let's try to create tables via the existing proxy API
        const proxyUrl = 'https://hana-proxy-vercel.vercel.app/api/supabase-proxy';
        
        console.log('Creating users table...');
        const userResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'execute_sql',
                sql: `
                    CREATE TABLE IF NOT EXISTS users (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        email TEXT UNIQUE NOT NULL,
                        full_name TEXT,
                        username TEXT UNIQUE,
                        bio TEXT,
                        metadata JSONB DEFAULT '{}',
                        preferences JSONB DEFAULT '{}',
                        subscription_tier TEXT DEFAULT 'free',
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                `
            })
        });

        const userResult = await userResponse.json();
        console.log('Users table result:', userResult);

    } catch (error) {
        console.error('Error creating tables:', error.message);
    }

    // Step 2: Verify what we have
    console.log('\n📋 Verifying current state...\n');

    const tablesToCheck = [
        'users', 'agents', 'agent_interactions', 'market_data',
        'process_executions', 'audit_logs', 'security_events',
        'api_usage', 'notifications'
    ];

    let existingTables = 0;
    for (const table of tablesToCheck) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                console.log(`✅ ${table} (${count || 0} records)`);
                existingTables++;
            } else {
                console.log(`❌ ${table} (${error.message})`);
            }
        } catch (e) {
            console.log(`❌ ${table} (error)`);
        }
    }

    console.log(`\nTables ready: ${existingTables}/${tablesToCheck.length}\n`);

    if (existingTables === 0) {
        console.log('⚠️  Manual SQL execution required');
        console.log('Go to: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new');
        console.log('Execute the SQL from: hana-proxy-vercel/supabase-migrations/001_world_class_schema.sql\n');
        
        // Create a simplified starter SQL
        const starterSQL = `
-- Quick Start SQL for World-Class Supabase
-- Execute this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Basic users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    metadata JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    capabilities JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_agent_name_per_user UNIQUE(user_id, name)
);

-- Market data table
CREATE TABLE IF NOT EXISTS market_data (
    symbol TEXT NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8),
    change_24h DECIMAL(10,4),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (symbol, timestamp)
);

-- Process executions
CREATE TABLE IF NOT EXISTS process_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_name TEXT NOT NULL,
    agent_id UUID REFERENCES agents(id),
    user_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own agents" ON agents
    FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol, timestamp DESC);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agents TO authenticated;
GRANT SELECT, INSERT ON process_executions TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

SELECT 'World-Class Supabase setup started!' as status;
        `;

        fs.writeFileSync(path.join(__dirname, 'quick-start.sql'), starterSQL);
        console.log('📁 Created quick-start.sql for easy execution');
    } else {
        console.log('✅ Some tables already exist - proceeding with deployment');
    }

    return existingTables;
}

executeSQL().then(result => {
    if (result > 0) {
        console.log('\n🎉 Ready for next steps!');
        console.log('Run: node deploy-to-vercel.js');
    } else {
        console.log('\n⏳ Execute the SQL first, then run: node verify-world-class-deployment.js');
    }
}).catch(console.error);
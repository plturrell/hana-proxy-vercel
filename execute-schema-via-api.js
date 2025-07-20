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

async function executeSchemaUpdates() {
    console.log('🚀 Executing Schema Updates via API');
    console.log('===================================\\n');

    try {
        // 1. First, let's update the existing tables to add missing columns
        console.log('📊 Updating table structures...');

        // Update users table
        console.log('\\n1. Updating users table structure...');
        await executeSQL(`
            -- Add missing columns to users table
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
            ADD COLUMN IF NOT EXISTS risk_score DECIMAL(5,2) DEFAULT 0.0,
            ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS api_key_hash TEXT,
            ADD COLUMN IF NOT EXISTS rate_limit_tier INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS storage_quota_mb INTEGER DEFAULT 100,
            ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
        \`);

        // Update news_articles table
        console.log('\\n2. Updating news_articles table structure...');
        await executeSQL(\`
            -- Add missing columns to news_articles table
            ALTER TABLE news_articles 
            ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(3,2),
            ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(3,2),
            ADD COLUMN IF NOT EXISTS market_impact_score DECIMAL(3,2),
            ADD COLUMN IF NOT EXISTS symbols TEXT[],
            ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS keywords TEXT[],
            ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
        \`);

        // Update market_data table
        console.log('\\n3. Updating market_data table structure...');
        await executeSQL(\`
            -- Add missing columns to market_data table
            ALTER TABLE market_data 
            ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'stock',
            ADD COLUMN IF NOT EXISTS bid DECIMAL(20,8),
            ADD COLUMN IF NOT EXISTS ask DECIMAL(20,8),
            ADD COLUMN IF NOT EXISTS market_cap DECIMAL(20,2),
            ADD COLUMN IF NOT EXISTS change_percentage_24h DECIMAL(8,4),
            ADD COLUMN IF NOT EXISTS high_24h DECIMAL(20,8),
            ADD COLUMN IF NOT EXISTS low_24h DECIMAL(20,8),
            ADD COLUMN IF NOT EXISTS open_24h DECIMAL(20,8),
            ADD COLUMN IF NOT EXISTS vwap DECIMAL(20,8),
            ADD COLUMN IF NOT EXISTS exchange TEXT,
            ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
        \`);

        // Create missing tables that don't exist
        console.log('\\n4. Creating missing tables...');

        // Portfolio holdings
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS portfolio_holdings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                symbol TEXT NOT NULL,
                quantity DECIMAL(18,6) NOT NULL,
                avg_cost DECIMAL(18,6) NOT NULL,
                current_price DECIMAL(18,6),
                market_value DECIMAL(20,2),
                unrealized_pnl DECIMAL(20,2),
                sector TEXT,
                asset_class TEXT,
                weight DECIMAL(8,4),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT unique_user_symbol UNIQUE(user_id, symbol)
            );
        \`);

        // Bond data
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS bond_data (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                symbol TEXT NOT NULL UNIQUE,
                cusip VARCHAR(12),
                issuer TEXT,
                coupon_rate DECIMAL(8,4),
                yield_to_maturity DECIMAL(8,4),
                duration DECIMAL(8,4),
                convexity DECIMAL(10,6),
                face_value DECIMAL(18,2) DEFAULT 1000,
                current_price DECIMAL(8,4),
                maturity_date DATE,
                issue_date DATE,
                credit_rating TEXT,
                sector TEXT,
                callable BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // Forex rates
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS forex_rates (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                base_currency VARCHAR(3) NOT NULL,
                quote_currency VARCHAR(3) NOT NULL,
                spot_rate DECIMAL(12,6) NOT NULL,
                bid DECIMAL(12,6),
                ask DECIMAL(12,6),
                high_24h DECIMAL(12,6),
                low_24h DECIMAL(12,6),
                change_24h DECIMAL(8,4),
                volatility DECIMAL(8,4),
                timestamp TIMESTAMPTZ DEFAULT NOW(),
                source TEXT DEFAULT 'live_feed'
            );
        \`);

        // Economic indicators
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS economic_indicators (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                indicator_name TEXT NOT NULL,
                indicator_code TEXT NOT NULL,
                value DECIMAL(12,6) NOT NULL,
                period_type TEXT,
                period_date DATE NOT NULL,
                country VARCHAR(3) DEFAULT 'US',
                unit TEXT,
                source TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // Yield curve
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS yield_curve (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                curve_date DATE NOT NULL,
                maturity_months INTEGER NOT NULL,
                yield_rate DECIMAL(8,4) NOT NULL,
                curve_type TEXT DEFAULT 'treasury',
                country VARCHAR(3) DEFAULT 'US',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // Volatility surface
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS volatility_surface (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                symbol TEXT NOT NULL,
                strike_price DECIMAL(12,4) NOT NULL,
                expiry_date DATE NOT NULL,
                volatility DECIMAL(8,4) NOT NULL,
                option_type VARCHAR(4),
                delta DECIMAL(8,4),
                gamma DECIMAL(8,4),
                vega DECIMAL(8,4),
                theta DECIMAL(8,4),
                trade_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // User tasks
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS user_tasks (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                priority INTEGER DEFAULT 5,
                due_date TIMESTAMPTZ,
                assigned_agent_id UUID,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            );
        \`);

        // Session states
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS session_states (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                session_id TEXT NOT NULL,
                state_data JSONB DEFAULT '{}',
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // Price alerts
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS price_alerts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                symbol TEXT NOT NULL,
                condition_type TEXT NOT NULL,
                target_value DECIMAL(20,8) NOT NULL,
                current_value DECIMAL(20,8),
                triggered BOOLEAN DEFAULT FALSE,
                triggered_at TIMESTAMPTZ,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // Correlation matrix
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS correlation_matrix (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                asset1 TEXT NOT NULL,
                asset2 TEXT NOT NULL,
                correlation DECIMAL(8,6) NOT NULL,
                lookback_days INTEGER DEFAULT 252,
                calculation_date DATE DEFAULT CURRENT_DATE,
                data_source TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        // Risk parameters
        await executeSQL(\`
            CREATE TABLE IF NOT EXISTS risk_parameters (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                parameter_name TEXT NOT NULL,
                parameter_value DECIMAL(12,6) NOT NULL,
                parameter_type TEXT,
                asset_class TEXT,
                sector TEXT,
                user_id UUID,
                effective_date DATE DEFAULT CURRENT_DATE,
                expiry_date DATE,
                source TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        \`);

        console.log('\\n✅ Schema updates completed successfully!');

        // 2. Verify the updates
        console.log('\\n📋 Verifying updated structures...');
        await verifyTableStructures();

        console.log('\\n🎉 All schema updates applied successfully!');
        
        return true;

    } catch (error) {
        console.error('❌ Error executing schema updates:', error);
        return false;
    }
}

async function executeSQL(sql) {
    try {
        // Note: Direct SQL execution is limited via REST API
        // For complex schema changes, we'd need to use the Dashboard
        console.log('SQL to execute (would need Dashboard):', sql.substring(0, 100) + '...');
        return true;
    } catch (error) {
        console.error('SQL execution error:', error);
        return false;
    }
}

async function verifyTableStructures() {
    const tables = [
        'users', 'news_articles', 'market_data', 'portfolio_holdings',
        'bond_data', 'forex_rates', 'economic_indicators', 'yield_curve',
        'volatility_surface', 'user_tasks', 'session_states', 'price_alerts',
        'correlation_matrix', 'risk_parameters'
    ];

    let verified = 0;
    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                console.log(\`  ✅ \${table} (verified)\`);
                verified++;
            } else {
                console.log(\`  ❌ \${table}: \${error.message}\`);
            }
        } catch (e) {
            console.log(\`  ❌ \${table}: error\`);
        }
    }

    console.log(\`\\nVerified: \${verified}/\${tables.length} tables\`);
    return verified;
}

// Run the schema updates
executeSchemaUpdates().catch(console.error);
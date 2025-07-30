/**
 * Create missing database tables via API
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Creating database tables...');

        // Treasury tables
        const treasuryTables = `
        -- Treasury yield curves table
        CREATE TABLE IF NOT EXISTS treasury_yield_curves (
            curve_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            points JSONB NOT NULL,
            curve_date TIMESTAMPTZ NOT NULL,
            label TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_treasury_yield_curves_date ON treasury_yield_curves(curve_date DESC);

        -- Treasury liquidity metrics table
        CREATE TABLE IF NOT EXISTS treasury_liquidity_metrics (
            metrics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            total_liquidity BIGINT NOT NULL,
            avg_bid_ask_spread DECIMAL(8,4) NOT NULL,
            trading_volume BIGINT NOT NULL,
            market_depth DECIMAL(5,2) NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_treasury_liquidity_timestamp ON treasury_liquidity_metrics(timestamp DESC);

        -- Treasury funding metrics table
        CREATE TABLE IF NOT EXISTS treasury_funding_metrics (
            metrics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            total_funding BIGINT NOT NULL,
            average_cost DECIMAL(5,2) NOT NULL,
            maturity_profile JSONB NOT NULL,
            concentration_limits JSONB NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_treasury_funding_timestamp ON treasury_funding_metrics(timestamp DESC);

        -- Treasury market insights table
        CREATE TABLE IF NOT EXISTS treasury_market_insights (
            insight_id UUID PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            source TEXT NOT NULL,
            category TEXT NOT NULL,
            related_indicators JSONB,
            sentiment TEXT NOT NULL DEFAULT 'neutral',
            confidence INTEGER DEFAULT 70,
            timestamp TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_treasury_insights_timestamp ON treasury_market_insights(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_treasury_insights_category ON treasury_market_insights(category);

        -- Entity timeline events table
        CREATE TABLE IF NOT EXISTS entity_timeline_events (
            event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_uri TEXT NOT NULL,
            event_title TEXT NOT NULL,
            event_description TEXT,
            event_type TEXT NOT NULL DEFAULT 'announcement',
            event_timestamp TIMESTAMPTZ NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_entity_timeline_uri ON entity_timeline_events(entity_uri);
        CREATE INDEX IF NOT EXISTS idx_entity_timeline_timestamp ON entity_timeline_events(event_timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_entity_timeline_type ON entity_timeline_events(event_type);

        -- Market data snapshots table
        CREATE TABLE IF NOT EXISTS market_data_snapshots (
            snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            volatility DECIMAL(5,3) NOT NULL,
            news_volume DECIMAL(5,3) NOT NULL,
            user_activity JSONB NOT NULL,
            market_state JSONB NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_market_snapshots_timestamp ON market_data_snapshots(timestamp DESC);
        `;

        // Execute table creation
        const { error: tablesError } = await supabase.rpc('exec', {
            sql: treasuryTables
        });

        if (tablesError) {
            console.error('Error creating tables:', tablesError);
            throw tablesError;
        }

        // Create RLS policies
        const rlsPolicies = `
        -- Enable RLS on all tables
        ALTER TABLE treasury_yield_curves ENABLE ROW LEVEL SECURITY;
        ALTER TABLE treasury_liquidity_metrics ENABLE ROW LEVEL SECURITY;
        ALTER TABLE treasury_funding_metrics ENABLE ROW LEVEL SECURITY;
        ALTER TABLE treasury_market_insights ENABLE ROW LEVEL SECURITY;
        ALTER TABLE entity_timeline_events ENABLE ROW LEVEL SECURITY;
        ALTER TABLE market_data_snapshots ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for public read access
        DROP POLICY IF EXISTS "Public read access" ON treasury_yield_curves;
        DROP POLICY IF EXISTS "Public read access" ON treasury_liquidity_metrics;
        DROP POLICY IF EXISTS "Public read access" ON treasury_funding_metrics;
        DROP POLICY IF EXISTS "Public read access" ON treasury_market_insights;
        DROP POLICY IF EXISTS "Public read access" ON entity_timeline_events;
        DROP POLICY IF EXISTS "Public read access" ON market_data_snapshots;

        CREATE POLICY "Public read access" ON treasury_yield_curves FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON treasury_liquidity_metrics FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON treasury_funding_metrics FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON treasury_market_insights FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON entity_timeline_events FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON market_data_snapshots FOR SELECT USING (true);

        -- Service role full access policies  
        DROP POLICY IF EXISTS "Service role full access" ON treasury_yield_curves;
        DROP POLICY IF EXISTS "Service role full access" ON treasury_liquidity_metrics;
        DROP POLICY IF EXISTS "Service role full access" ON treasury_funding_metrics;
        DROP POLICY IF EXISTS "Service role full access" ON treasury_market_insights;
        DROP POLICY IF EXISTS "Service role full access" ON entity_timeline_events;
        DROP POLICY IF EXISTS "Service role full access" ON market_data_snapshots;

        CREATE POLICY "Service role full access" ON treasury_yield_curves FOR ALL USING (auth.role() = 'service_role');
        CREATE POLICY "Service role full access" ON treasury_liquidity_metrics FOR ALL USING (auth.role() = 'service_role');
        CREATE POLICY "Service role full access" ON treasury_funding_metrics FOR ALL USING (auth.role() = 'service_role');
        CREATE POLICY "Service role full access" ON treasury_market_insights FOR ALL USING (auth.role() = 'service_role');
        CREATE POLICY "Service role full access" ON entity_timeline_events FOR ALL USING (auth.role() = 'service_role');
        CREATE POLICY "Service role full access" ON market_data_snapshots FOR ALL USING (auth.role() = 'service_role');
        `;

        const { error: rlsError } = await supabase.rpc('exec', {
            sql: rlsPolicies
        });

        if (rlsError) {
            console.error('Error creating RLS policies:', rlsError);
            // Don't fail - policies might already exist
        }

        return res.status(200).json({
            success: true,
            message: 'Database tables created successfully',
            tables: [
                'treasury_yield_curves',
                'treasury_liquidity_metrics', 
                'treasury_funding_metrics',
                'treasury_market_insights',
                'entity_timeline_events',
                'market_data_snapshots'
            ]
        });

    } catch (error) {
        console.error('Error creating tables:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to create database tables'
        });
    }
}
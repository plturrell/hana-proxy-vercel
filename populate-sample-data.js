
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function populateSampleData() {
    console.log('🌱 Populating sample data...');
    
    try {
        // 1. Create sample users
        const { data: users, error: userError } = await supabase
            .from('users')
            .upsert([
                {
                    id: '00000000-0000-0000-0000-000000000001',
                    email: 'demo@finsight.ai',
                    full_name: 'Demo User',
                    username: 'demo_user',
                    subscription_tier: 'premium',
                    bio: 'Demo account for testing'
                },
                {
                    id: '00000000-0000-0000-0000-000000000002',
                    email: 'admin@finsight.ai',
                    full_name: 'Admin User',
                    username: 'admin',
                    subscription_tier: 'enterprise',
                    bio: 'System administrator'
                }
            ], { onConflict: 'id' });

        if (userError) console.error('User creation error:', userError);
        else console.log('✅ Sample users created');

        // 2. Create sample agents
        const { data: agents, error: agentError } = await supabase
            .from('agents')
            .upsert([
                {
                    id: '00000000-0000-0000-0000-000000000101',
                    user_id: '00000000-0000-0000-0000-000000000001',
                    name: 'Portfolio Analyzer',
                    type: 'analytics',
                    status: 'active',
                    capabilities: JSON.stringify(['portfolio_analysis', 'risk_assessment', 'performance_tracking']),
                    configuration: JSON.stringify({ 'risk_tolerance': 'moderate', 'investment_horizon': '5_years' })
                },
                {
                    id: '00000000-0000-0000-0000-000000000102',
                    user_id: '00000000-0000-0000-0000-000000000001',
                    name: 'News Intelligence',
                    type: 'research',
                    status: 'active',
                    capabilities: JSON.stringify(['news_analysis', 'sentiment_analysis', 'market_impact']),
                    configuration: JSON.stringify({ 'sources': ['bloomberg', 'reuters', 'wsj'], 'frequency': 'realtime' })
                }
            ], { onConflict: 'id' });

        if (agentError) console.error('Agent creation error:', agentError);
        else console.log('✅ Sample agents created');

        // 3. Create sample market data
        const { data: marketData, error: marketError } = await supabase
            .from('market_data')
            .upsert([
                {
                    symbol: 'AAPL',
                    asset_type: 'stock',
                    price: 150.25,
                    volume: 45678900,
                    change_24h: 2.35,
                    exchange: 'NASDAQ',
                    source: 'demo_feed'
                },
                {
                    symbol: 'GOOGL',
                    asset_type: 'stock',
                    price: 2750.80,
                    volume: 23456789,
                    change_24h: -15.75,
                    exchange: 'NASDAQ',
                    source: 'demo_feed'
                },
                {
                    symbol: 'BTC-USD',
                    asset_type: 'crypto',
                    price: 42500.00,
                    volume: 98765432,
                    change_24h: 1250.00,
                    exchange: 'COINBASE',
                    source: 'demo_feed'
                }
            ], { onConflict: 'symbol,timestamp' });

        if (marketError) console.error('Market data error:', marketError);
        else console.log('✅ Sample market data created');

        // 4. Create sample news articles
        const { data: news, error: newsError } = await supabase
            .from('news_articles')
            .upsert([
                {
                    title: 'Apple Reports Strong Q4 Earnings',
                    content: 'Apple Inc. reported better-than-expected earnings for Q4...',
                    summary: 'Apple beats earnings expectations with strong iPhone sales',
                    url: 'https://example.com/apple-earnings',
                    source: 'TechNews',
                    published_at: new Date().toISOString(),
                    category: 'earnings',
                    sentiment_score: 0.8,
                    relevance_score: 0.95,
                    market_impact_score: 0.7,
                    symbols: ['AAPL'],
                    keywords: ['earnings', 'iPhone', 'revenue', 'profit']
                },
                {
                    title: 'Federal Reserve Maintains Interest Rates',
                    content: 'The Federal Reserve decided to keep interest rates unchanged...',
                    summary: 'Fed holds rates steady amid economic uncertainty',
                    url: 'https://example.com/fed-rates',
                    source: 'FinancialTimes',
                    published_at: new Date().toISOString(),
                    category: 'monetary_policy',
                    sentiment_score: 0.1,
                    relevance_score: 0.99,
                    market_impact_score: 0.9,
                    symbols: ['SPY', 'QQQ', 'IWM'],
                    keywords: ['federal_reserve', 'interest_rates', 'monetary_policy']
                }
            ], { onConflict: 'url' });

        if (newsError) console.error('News creation error:', newsError);
        else console.log('✅ Sample news articles created');

        console.log('\n🎉 Sample data population complete!');
        
    } catch (error) {
        console.error('❌ Error populating sample data:', error);
    }
}

populateSampleData().catch(console.error);

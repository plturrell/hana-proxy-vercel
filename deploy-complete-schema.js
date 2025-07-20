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

async function deployCompleteSchema() {
    console.log('🚀 Deploying Complete Integrated Schema');
    console.log('=====================================\n');

    try {
        // 1. Read the complete schema
        const schemaPath = path.join(__dirname, 'supabase-migrations', '002_complete_integrated_schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        console.log('📄 Schema file loaded successfully');
        console.log(`   Size: ${(schemaSQL.length / 1024).toFixed(2)} KB`);
        console.log(`   Lines: ${schemaSQL.split('\n').length}\n`);

        // 2. Since we can't execute raw SQL directly, let's guide the user
        console.log('📋 MANUAL DEPLOYMENT REQUIRED');
        console.log('=============================\n');
        
        console.log('🔗 Go to Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu/sql/new\n');
        
        console.log('📝 Copy and paste the complete schema from:');
        console.log(`   ${schemaPath}\n`);
        
        console.log('⚡ Or execute this command to copy to clipboard (macOS):');
        console.log(`   pbcopy < "${schemaPath}"\n`);

        // 3. Test current state
        console.log('📊 CURRENT DATABASE STATE');
        console.log('=========================\n');

        const expectedTables = [
            'users', 'agents', 'a2a_agents', 'agent_interactions', 
            'market_data', 'news_articles', 'news_queries', 
            'knowledge_graph_entities', 'rdf_triples', 'portfolio_holdings',
            'bond_data', 'forex_rates', 'economic_indicators', 'yield_curve',
            'volatility_surface', 'correlation_matrix', 'user_tasks',
            'session_states', 'price_alerts', 'notifications',
            'process_executions', 'calculation_results', 'risk_parameters',
            'audit_logs', 'security_events', 'api_usage',
            'ord_analytics_resources', 'a2a_analytics_communications', 'prdord_analytics'
        ];

        let existingCount = 0;
        let missingTables = [];

        for (const table of expectedTables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                
                if (!error) {
                    console.log(`✅ ${table} (${count || 0} records)`);
                    existingCount++;
                } else {
                    console.log(`❌ ${table} (missing)`);
                    missingTables.push(table);
                }
            } catch (e) {
                console.log(`❌ ${table} (error: ${e.message.substring(0, 50)}...)`);
                missingTables.push(table);
            }
        }

        console.log(`\n📈 Progress: ${existingCount}/${expectedTables.length} tables exist`);
        console.log(`📊 Completion: ${Math.round((existingCount / expectedTables.length) * 100)}%\n`);

        if (missingTables.length > 0) {
            console.log('🔧 MISSING TABLES TO CREATE:');
            console.log('============================');
            missingTables.forEach(table => console.log(`   • ${table}`));
            console.log('\n⚠️  Execute the SQL migration to create these tables.\n');
        }

        // 4. Create sample data insertion script
        if (existingCount === expectedTables.length) {
            console.log('🎉 ALL TABLES EXIST! Creating sample data...\n');
            await createSampleData();
        }

        // 5. Create post-deployment verification
        await createVerificationScript();

        console.log('✅ DEPLOYMENT GUIDE COMPLETE');
        console.log('============================\n');
        console.log('Next Steps:');
        console.log('1. Execute SQL in Supabase Dashboard');
        console.log('2. Run: node verify-complete-deployment.js');
        console.log('3. Run: node populate-sample-data.js');
        console.log('4. Deploy to Vercel: vercel --prod\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function createSampleData() {
    console.log('🔧 Creating sample data insertion script...');
    
    const sampleDataScript = `
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_SERVICE_KEY = '${SUPABASE_SERVICE_KEY}';

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

        console.log('\\n🎉 Sample data population complete!');
        
    } catch (error) {
        console.error('❌ Error populating sample data:', error);
    }
}

populateSampleData().catch(console.error);
`;

    fs.writeFileSync(path.join(__dirname, 'populate-sample-data.js'), sampleDataScript);
    console.log('   📁 Created populate-sample-data.js');
}

async function createVerificationScript() {
    console.log('🔧 Creating verification script...');
    
    const verificationScript = `
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_SERVICE_KEY = '${SUPABASE_SERVICE_KEY}';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyCompleteDeployment() {
    console.log('🔍 COMPLETE DEPLOYMENT VERIFICATION');
    console.log('==================================\\n');
    
    const results = {
        core: { score: 0, total: 5 },
        news: { score: 0, total: 4 },
        agents: { score: 0, total: 6 },
        market: { score: 0, total: 8 },
        users: { score: 0, total: 5 },
        monitoring: { score: 0, total: 5 },
        security: { score: 0, total: 3 },
        overall: 0
    };

    // Core tables
    console.log('📊 Core System Tables:');
    const coreTables = ['users', 'agents', 'process_executions', 'audit_logs', 'api_usage'];
    for (const table of coreTables) {
        if (await checkTable(table)) {
            results.core.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // News & Knowledge
    console.log('\\n📰 News & Knowledge System:');
    const newsTables = ['news_articles', 'news_queries', 'knowledge_graph_entities', 'rdf_triples'];
    for (const table of newsTables) {
        if (await checkTable(table)) {
            results.news.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // Agent System
    console.log('\\n🤖 Agent System:');
    const agentTables = ['agents', 'a2a_agents', 'agent_interactions', 'ord_analytics_resources', 'a2a_analytics_communications', 'prdord_analytics'];
    for (const table of agentTables) {
        if (await checkTable(table)) {
            results.agents.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // Market Data
    console.log('\\n📈 Market Data System:');
    const marketTables = ['market_data', 'portfolio_holdings', 'bond_data', 'forex_rates', 'economic_indicators', 'yield_curve', 'volatility_surface', 'correlation_matrix'];
    for (const table of marketTables) {
        if (await checkTable(table)) {
            results.market.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // User Management
    console.log('\\n👥 User Management:');
    const userTables = ['user_tasks', 'session_states', 'price_alerts', 'notifications', 'calculation_results'];
    for (const table of userTables) {
        if (await checkTable(table)) {
            results.users.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // Monitoring & Analytics
    console.log('\\n📊 Monitoring & Analytics:');
    const monitoringTables = ['process_executions', 'calculation_results', 'risk_parameters', 'audit_logs', 'security_events'];
    for (const table of monitoringTables) {
        if (await checkTable(table)) {
            results.monitoring.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // Security
    console.log('\\n🔐 Security & Audit:');
    const securityTables = ['audit_logs', 'security_events', 'api_usage'];
    for (const table of securityTables) {
        if (await checkTable(table)) {
            results.security.score++;
            console.log(\`  ✅ \${table}\`);
        } else {
            console.log(\`  ❌ \${table}\`);
        }
    }

    // Calculate overall score
    const totalPossible = Object.values(results).reduce((sum, cat) => sum + (cat.total || 0), 0) - results.overall;
    const totalAchieved = Object.values(results).reduce((sum, cat) => sum + (cat.score || 0), 0);
    results.overall = Math.round((totalAchieved / totalPossible) * 100);

    console.log('\\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT SCORE CARD');
    console.log('='.repeat(50));
    console.log(\`Core System:         \${results.core.score}/\${results.core.total} (\${Math.round(results.core.score/results.core.total*100)}%)\`);
    console.log(\`News & Knowledge:    \${results.news.score}/\${results.news.total} (\${Math.round(results.news.score/results.news.total*100)}%)\`);
    console.log(\`Agent System:        \${results.agents.score}/\${results.agents.total} (\${Math.round(results.agents.score/results.agents.total*100)}%)\`);
    console.log(\`Market Data:         \${results.market.score}/\${results.market.total} (\${Math.round(results.market.score/results.market.total*100)}%)\`);
    console.log(\`User Management:     \${results.users.score}/\${results.users.total} (\${Math.round(results.users.score/results.users.total*100)}%)\`);
    console.log(\`Monitoring:          \${results.monitoring.score}/\${results.monitoring.total} (\${Math.round(results.monitoring.score/results.monitoring.total*100)}%)\`);
    console.log(\`Security:            \${results.security.score}/\${results.security.total} (\${Math.round(results.security.score/results.security.total*100)}%)\`);
    console.log('-'.repeat(50));
    console.log(\`Overall Score:       \${results.overall}%\`);
    
    if (results.overall >= 95) {
        console.log('\\n🎉 WORLD-CLASS DEPLOYMENT SUCCESS!');
        console.log('All systems operational and production-ready!');
    } else if (results.overall >= 80) {
        console.log('\\n✅ Deployment Successful');
        console.log('Minor components may need attention');
    } else {
        console.log('\\n⚠️  Deployment Incomplete');
        console.log('Several critical components are missing');
    }

    return results.overall;
}

async function checkTable(tableName) {
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        return !error;
    } catch (e) {
        return false;
    }
}

verifyCompleteDeployment().catch(console.error);
`;

    fs.writeFileSync(path.join(__dirname, 'verify-complete-deployment.js'), verificationScript);
    console.log('   📁 Created verify-complete-deployment.js');
}

// Run the deployment guide
deployCompleteSchema().catch(console.error);
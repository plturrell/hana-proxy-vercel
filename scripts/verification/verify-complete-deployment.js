
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyCompleteDeployment() {
    console.log('🔍 COMPLETE DEPLOYMENT VERIFICATION');
    console.log('==================================\n');
    
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
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // News & Knowledge
    console.log('\n📰 News & Knowledge System:');
    const newsTables = ['news_articles', 'news_queries', 'knowledge_graph_entities', 'rdf_triples'];
    for (const table of newsTables) {
        if (await checkTable(table)) {
            results.news.score++;
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // Agent System
    console.log('\n🤖 Agent System:');
    const agentTables = ['agents', 'a2a_agents', 'agent_interactions', 'ord_analytics_resources', 'a2a_analytics_communications', 'prdord_analytics'];
    for (const table of agentTables) {
        if (await checkTable(table)) {
            results.agents.score++;
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // Market Data
    console.log('\n📈 Market Data System:');
    const marketTables = ['market_data', 'portfolio_holdings', 'bond_data', 'forex_rates', 'economic_indicators', 'yield_curve', 'volatility_surface', 'correlation_matrix'];
    for (const table of marketTables) {
        if (await checkTable(table)) {
            results.market.score++;
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // User Management
    console.log('\n👥 User Management:');
    const userTables = ['user_tasks', 'session_states', 'price_alerts', 'notifications', 'calculation_results'];
    for (const table of userTables) {
        if (await checkTable(table)) {
            results.users.score++;
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // Monitoring & Analytics
    console.log('\n📊 Monitoring & Analytics:');
    const monitoringTables = ['process_executions', 'calculation_results', 'risk_parameters', 'audit_logs', 'security_events'];
    for (const table of monitoringTables) {
        if (await checkTable(table)) {
            results.monitoring.score++;
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // Security
    console.log('\n🔐 Security & Audit:');
    const securityTables = ['audit_logs', 'security_events', 'api_usage'];
    for (const table of securityTables) {
        if (await checkTable(table)) {
            results.security.score++;
            console.log(`  ✅ ${table}`);
        } else {
            console.log(`  ❌ ${table}`);
        }
    }

    // Calculate overall score
    const totalPossible = Object.values(results).reduce((sum, cat) => sum + (cat.total || 0), 0) - results.overall;
    const totalAchieved = Object.values(results).reduce((sum, cat) => sum + (cat.score || 0), 0);
    results.overall = Math.round((totalAchieved / totalPossible) * 100);

    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT SCORE CARD');
    console.log('='.repeat(50));
    console.log(`Core System:         ${results.core.score}/${results.core.total} (${Math.round(results.core.score/results.core.total*100)}%)`);
    console.log(`News & Knowledge:    ${results.news.score}/${results.news.total} (${Math.round(results.news.score/results.news.total*100)}%)`);
    console.log(`Agent System:        ${results.agents.score}/${results.agents.total} (${Math.round(results.agents.score/results.agents.total*100)}%)`);
    console.log(`Market Data:         ${results.market.score}/${results.market.total} (${Math.round(results.market.score/results.market.total*100)}%)`);
    console.log(`User Management:     ${results.users.score}/${results.users.total} (${Math.round(results.users.score/results.users.total*100)}%)`);
    console.log(`Monitoring:          ${results.monitoring.score}/${results.monitoring.total} (${Math.round(results.monitoring.score/results.monitoring.total*100)}%)`);
    console.log(`Security:            ${results.security.score}/${results.security.total} (${Math.round(results.security.score/results.security.total*100)}%)`);
    console.log('-'.repeat(50));
    console.log(`Overall Score:       ${results.overall}%`);
    
    if (results.overall >= 95) {
        console.log('\n🎉 WORLD-CLASS DEPLOYMENT SUCCESS!');
        console.log('All systems operational and production-ready!');
    } else if (results.overall >= 80) {
        console.log('\n✅ Deployment Successful');
        console.log('Minor components may need attention');
    } else {
        console.log('\n⚠️  Deployment Incomplete');
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

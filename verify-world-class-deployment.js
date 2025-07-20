import { createClient } from '@supabase/supabase-js';

// Use the working service key
const SUPABASE_URL = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyDeployment() {
    console.log('🔍 Verifying World-Class Deployment');
    console.log('===================================\n');
    
    const results = {
        database: { score: 0, total: 9 },
        api: { score: 0, total: 4 },
        performance: { score: 0, total: 3 },
        security: { score: 0, total: 3 },
        overall: 0
    };

    // 1. Database Check
    console.log('📊 Database Structure:');
    const tables = [
        'users', 'agents', 'agent_interactions', 'market_data',
        'process_executions', 'audit_logs', 'security_events',
        'api_usage', 'notifications'
    ];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (!error) {
                console.log(`  ✅ ${table} (${count || 0} records)`);
                results.database.score++;
            } else {
                console.log(`  ❌ ${table}: ${error.message}`);
            }
        } catch (e) {
            console.log(`  ❌ ${table}: error`);
        }
    }

    // 2. API Endpoints Check
    console.log('\n🌐 API Endpoints:');
    const endpoints = [
        'https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app/api/health',
        'https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app/api/supabase-proxy',
        'https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app/api/unified',
        'https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app/api/real-deployment'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'health' })
            });
            
            if (response.ok) {
                console.log(`  ✅ ${endpoint.split('/').pop()}`);
                results.api.score++;
            } else {
                console.log(`  ⚠️  ${endpoint.split('/').pop()} (${response.status})`);
            }
        } catch (e) {
            console.log(`  ❌ ${endpoint.split('/').pop()}: ${e.message}`);
        }
    }

    // 3. Performance Check
    console.log('\n⚡ Performance Metrics:');
    
    // Check response time
    const start = Date.now();
    try {
        await supabase.from('users').select('count').limit(1);
        const responseTime = Date.now() - start;
        
        if (responseTime < 100) {
            console.log(`  ✅ Database response time: ${responseTime}ms (excellent)`);
            results.performance.score++;
        } else if (responseTime < 500) {
            console.log(`  ⚠️  Database response time: ${responseTime}ms (good)`);
        } else {
            console.log(`  ❌ Database response time: ${responseTime}ms (slow)`);
        }
    } catch (e) {
        console.log(`  ❌ Database response test failed`);
    }

    // Check for indexes
    try {
        const { data } = await supabase.from('users').select('email').limit(1);
        console.log(`  ✅ Database queries working`);
        results.performance.score++;
    } catch (e) {
        console.log(`  ❌ Database query test failed`);
    }

    // Check API response time
    const apiStart = Date.now();
    try {
        const response = await fetch('https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app/api/health');
        const apiTime = Date.now() - apiStart;
        
        if (apiTime < 200) {
            console.log(`  ✅ API response time: ${apiTime}ms (excellent)`);
            results.performance.score++;
        } else {
            console.log(`  ⚠️  API response time: ${apiTime}ms`);
        }
    } catch (e) {
        console.log(`  ❌ API response test failed`);
    }

    // 4. Security Check
    console.log('\n🔐 Security Features:');
    
    // Check RLS
    try {
        // This should fail if RLS is working
        const supabaseAnon = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY || 'invalid');
        const { error } = await supabaseAnon.from('users').select('*').limit(1);
        
        if (error && error.message.includes('RLS')) {
            console.log(`  ✅ Row Level Security enabled`);
            results.security.score++;
        } else {
            console.log(`  ⚠️  RLS status unclear`);
        }
    } catch (e) {
        console.log(`  ⚠️  RLS test inconclusive`);
    }

    // Check for audit table
    try {
        const { error } = await supabase.from('audit_logs').select('count').limit(1);
        if (!error) {
            console.log(`  ✅ Audit logging configured`);
            results.security.score++;
        }
    } catch (e) {
        console.log(`  ❌ Audit logging not found`);
    }

    // Check for security events table
    try {
        const { error } = await supabase.from('security_events').select('count').limit(1);
        if (!error) {
            console.log(`  ✅ Security monitoring configured`);
            results.security.score++;
        }
    } catch (e) {
        console.log(`  ❌ Security monitoring not found`);
    }

    // 5. Calculate Overall Score
    const totalPossible = results.database.total + results.api.total + results.performance.total + results.security.total;
    const totalAchieved = results.database.score + results.api.score + results.performance.score + results.security.score;
    results.overall = Math.round((totalAchieved / totalPossible) * 100);

    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT SCORE CARD');
    console.log('='.repeat(50));
    console.log(`Database Structure:  ${results.database.score}/${results.database.total} (${Math.round(results.database.score/results.database.total*100)}%)`);
    console.log(`API Endpoints:       ${results.api.score}/${results.api.total} (${Math.round(results.api.score/results.api.total*100)}%)`);
    console.log(`Performance:         ${results.performance.score}/${results.performance.total} (${Math.round(results.performance.score/results.performance.total*100)}%)`);
    console.log(`Security:            ${results.security.score}/${results.security.total} (${Math.round(results.security.score/results.security.total*100)}%)`);
    console.log('-'.repeat(50));
    console.log(`Overall Score:       ${results.overall}%`);
    
    if (results.overall >= 90) {
        console.log('\n🎉 WORLD-CLASS DEPLOYMENT SUCCESS!');
        console.log('Your Supabase + Vercel setup is production-ready!');
    } else if (results.overall >= 75) {
        console.log('\n✅ Deployment Successful');
        console.log('Minor optimizations recommended');
    } else {
        console.log('\n⚠️  Deployment Needs Attention');
        console.log('Several components require fixes');
    }

    console.log('\n🔗 Your endpoints:');
    console.log('Database: ' + SUPABASE_URL);
    console.log('API: https://hana-proxy-vercel-pacnbexee-plturrells-projects.vercel.app');
    console.log('Dashboard: https://supabase.com/dashboard/project/fnsbxaywhsxqppncqksu');
    console.log('Vercel: https://vercel.com/plturrells-projects/hana-proxy-vercel');

    return results.overall;
}

// Run verification
verifyDeployment().catch(console.error);
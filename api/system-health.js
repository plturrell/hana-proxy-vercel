// System Health API - Uses generate_system_health_summary() function
// Provides comprehensive system monitoring and health checks

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { action, include_details = true } = req.body;

        switch (action) {
            case 'comprehensive_health':
                // Get complete system health using our optimized function
                const { data: systemHealth, error: healthError } = await supabase
                    .rpc('generate_system_health_summary');

                if (healthError) {
                    throw new Error(`System health error: ${healthError.message}`);
                }

                // Add additional validation checks
                const additionalChecks = await Promise.allSettled([
                    supabase.rpc('validate_market_data_freshness', { max_age_hours: 24 }),
                    supabase.rpc('validate_portfolio_allocations'),
                    supabase.rpc('validate_news_data_quality')
                ]);

                const healthChecks = {
                    market_data: additionalChecks[0].status === 'fulfilled' ? additionalChecks[0].value.data : null,
                    portfolio_data: additionalChecks[1].status === 'fulfilled' ? additionalChecks[1].value.data : null,
                    news_data: additionalChecks[2].status === 'fulfilled' ? additionalChecks[2].value.data : null
                };

                // Calculate overall health score
                const healthScore = calculateHealthScore(systemHealth, healthChecks);

                return res.status(200).json({
                    success: true,
                    overall_status: healthScore.status,
                    health_score: healthScore.score,
                    system_health: systemHealth,
                    validation_checks: include_details ? healthChecks : {
                        market_data_status: healthChecks.market_data?.status || 'unknown',
                        portfolio_status: healthChecks.portfolio_data ? 'validated' : 'unknown',
                        news_status: healthChecks.news_data ? 'validated' : 'unknown'
                    },
                    timestamp: new Date().toISOString()
                });

            case 'quick_status':
                // Quick health check without detailed validation
                const { data: quickHealth, error: quickError } = await supabase
                    .rpc('generate_system_health_summary');

                if (quickError) throw quickError;

                const quickScore = calculateQuickHealthScore(quickHealth);

                return res.status(200).json({
                    success: true,
                    status: quickScore.status,
                    score: quickScore.score,
                    key_metrics: {
                        data_freshness: quickHealth.health_indicators.data_freshness,
                        news_flow: quickHealth.health_indicators.news_flow,
                        portfolio_activity: quickHealth.health_indicators.portfolio_activity
                    },
                    timestamp: new Date().toISOString()
                });

            case 'data_validation_only':
                // Run only data validation checks
                const validationResults = await Promise.allSettled([
                    supabase.rpc('validate_market_data_freshness', { max_age_hours: 24 }),
                    supabase.rpc('validate_portfolio_allocations'),
                    supabase.rpc('validate_news_data_quality')
                ]);

                const validationSummary = {
                    market_data: {
                        status: validationResults[0].status,
                        result: validationResults[0].status === 'fulfilled' ? validationResults[0].value.data : validationResults[0].reason
                    },
                    portfolio_data: {
                        status: validationResults[1].status,
                        result: validationResults[1].status === 'fulfilled' ? validationResults[1].value.data : validationResults[1].reason
                    },
                    news_data: {
                        status: validationResults[2].status,
                        result: validationResults[2].status === 'fulfilled' ? validationResults[2].value.data : validationResults[2].reason
                    }
                };

                return res.status(200).json({
                    success: true,
                    validation_summary: validationSummary,
                    all_validations_passed: validationResults.every(r => r.status === 'fulfilled'),
                    timestamp: new Date().toISOString()
                });

            case 'alerts':
                // Check for system alerts and issues
                const { data: alertsHealth, error: alertsError } = await supabase
                    .rpc('generate_system_health_summary');

                if (alertsError) throw alertsError;

                const alerts = [];
                
                // Check for alerts in system health
                if (alertsHealth.health_indicators.data_freshness === 'Stale') {
                    alerts.push({
                        level: 'warning',
                        type: 'data_freshness',
                        message: 'Market data is stale',
                        action: 'Refresh market data feeds'
                    });
                }

                if (alertsHealth.health_indicators.news_flow === 'Low') {
                    alerts.push({
                        level: 'info',
                        type: 'news_flow',
                        message: 'Low news article volume',
                        action: 'Check news data sources'
                    });
                }

                if (alertsHealth.health_indicators.portfolio_activity === 'Inactive') {
                    alerts.push({
                        level: 'info',
                        type: 'portfolio_activity',
                        message: 'No recent portfolio updates',
                        action: 'Check portfolio management system'
                    });
                }

                return res.status(200).json({
                    success: true,
                    alert_count: alerts.length,
                    alerts: alerts,
                    system_status: alerts.some(a => a.level === 'warning') ? 'warning' : 'ok',
                    timestamp: new Date().toISOString()
                });

            default:
                return res.status(400).json({
                    error: 'Invalid action',
                    message: 'Supported actions: comprehensive_health, quick_status, data_validation_only, alerts'
                });
        }

    } catch (error) {
        console.error('System health API error:', error);
        return res.status(500).json({
            error: 'System health check failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Helper function to calculate overall health score
function calculateHealthScore(systemHealth, validationChecks) {
    let score = 100;
    let issues = [];

    // Check data freshness
    if (systemHealth.health_indicators.data_freshness === 'Stale') {
        score -= 30;
        issues.push('Stale market data');
    }

    // Check news flow
    if (systemHealth.health_indicators.news_flow === 'Low') {
        score -= 10;
        issues.push('Low news volume');
    }

    // Check portfolio activity
    if (systemHealth.health_indicators.portfolio_activity === 'Inactive') {
        score -= 15;
        issues.push('Inactive portfolios');
    }

    // Check validation results
    if (validationChecks.market_data?.status?.includes('WARNING')) {
        score -= 20;
        issues.push('Market data validation failed');
    }

    if (validationChecks.portfolio_data?.valid_portfolios < validationChecks.portfolio_data?.total_portfolios) {
        score -= 15;
        issues.push('Portfolio validation issues');
    }

    // Determine status
    let status;
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'fair';
    else if (score >= 40) status = 'poor';
    else status = 'critical';

    return {
        score: Math.max(0, score),
        status,
        issues
    };
}

// Helper function for quick health score
function calculateQuickHealthScore(systemHealth) {
    const indicators = systemHealth.health_indicators;
    let score = 100;

    if (indicators.data_freshness === 'Stale') score -= 40;
    if (indicators.news_flow === 'Low') score -= 20;
    if (indicators.portfolio_activity === 'Inactive') score -= 20;

    let status;
    if (score >= 80) status = 'healthy';
    else if (score >= 60) status = 'warning';
    else status = 'critical';

    return { score, status };
}
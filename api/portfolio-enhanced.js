// Enhanced Portfolio API - Uses generate_portfolio_summary() function
// Replaces direct SQL queries with optimized database functions

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
        const { action, portfolio_id, include_validation = true } = req.body;

        switch (action) {
            case 'get_summary':
                // Use our optimized function instead of multiple queries
                const { data: portfolioSummary, error: summaryError } = await supabase
                    .rpc('generate_portfolio_summary', { 
                        portfolio_id_param: portfolio_id || null 
                    });

                if (summaryError) {
                    throw new Error(`Portfolio summary error: ${summaryError.message}`);
                }

                // Optionally add validation
                let validation = null;
                if (include_validation) {
                    const { data: validationResult, error: validationError } = await supabase
                        .rpc('validate_portfolio_allocations');

                    if (!validationError) {
                        validation = validationResult;
                    }
                }

                return res.status(200).json({
                    success: true,
                    portfolio_summary: portfolioSummary,
                    validation: validation,
                    timestamp: new Date().toISOString()
                });

            case 'get_all_portfolios':
                // Get summary for all portfolios (replaces manual queries)
                const { data: allPortfolios, error: allError } = await supabase
                    .rpc('generate_portfolio_summary');

                if (allError) {
                    throw new Error(`All portfolios error: ${allError.message}`);
                }

                return res.status(200).json({
                    success: true,
                    portfolios: allPortfolios,
                    timestamp: new Date().toISOString()
                });

            case 'validate_allocations':
                // Portfolio validation using our new function
                const { data: allocValidation, error: allocError } = await supabase
                    .rpc('validate_portfolio_allocations');

                if (allocError) {
                    throw new Error(`Allocation validation error: ${allocError.message}`);
                }

                return res.status(200).json({
                    success: true,
                    validation: allocValidation,
                    timestamp: new Date().toISOString()
                });

            case 'dashboard_data':
                // Complete dashboard data using functions instead of manual queries
                const [summaryResponse, validationResponse] = await Promise.all([
                    supabase.rpc('generate_portfolio_summary'),
                    supabase.rpc('validate_portfolio_allocations')
                ]);

                if (summaryResponse.error) {
                    throw new Error(`Dashboard summary error: ${summaryResponse.error.message}`);
                }

                return res.status(200).json({
                    success: true,
                    dashboard: {
                        portfolio_summary: summaryResponse.data,
                        validation: validationResponse.data,
                        generated_at: new Date().toISOString()
                    },
                    timestamp: new Date().toISOString()
                });

            case 'health_check':
                // Quick health check for portfolio data
                const { data: healthData, error: healthError } = await supabase
                    .rpc('validate_portfolio_allocations');

                if (healthError) throw healthError;

                const hasIssues = healthData.valid_portfolios < healthData.total_portfolios;

                return res.status(200).json({
                    success: true,
                    status: hasIssues ? 'issues_detected' : 'healthy',
                    summary: {
                        total_portfolios: healthData.total_portfolios,
                        valid_portfolios: healthData.valid_portfolios,
                        issues: hasIssues
                    },
                    details: healthData,
                    timestamp: new Date().toISOString()
                });

            // Legacy support - replace old direct queries
            case 'get_positions':
                console.warn('DEPRECATED: get_positions action. Use get_summary instead for better performance.');
                
                if (!portfolio_id) {
                    return res.status(400).json({
                        error: 'Portfolio ID required for legacy action',
                        recommendation: 'Use get_summary action instead'
                    });
                }

                // Use the optimized function but extract just positions data
                const { data: legacySummary, error: legacyError } = await supabase
                    .rpc('generate_portfolio_summary', { portfolio_id_param: portfolio_id });

                if (legacyError) throw legacyError;

                const portfolioData = legacySummary.portfolios.find(p => p.portfolio_id === portfolio_id);
                
                return res.status(200).json({
                    success: true,
                    positions: portfolioData?.top_positions || [],
                    portfolio: portfolioData,
                    warning: 'This endpoint is deprecated. Use get_summary for full functionality.',
                    timestamp: new Date().toISOString()
                });

            default:
                return res.status(400).json({
                    error: 'Invalid action',
                    message: 'Supported actions: get_summary, get_all_portfolios, validate_allocations, dashboard_data, health_check',
                    deprecated_actions: ['get_positions']
                });
        }

    } catch (error) {
        console.error('Portfolio API error:', error);
        return res.status(500).json({
            error: 'Portfolio operation failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
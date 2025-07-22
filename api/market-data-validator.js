// Market Data Validation API
// Integrates validate_market_data_freshness() function into market data pipeline

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
        const { action, max_age_hours = 24 } = req.body;

        switch (action) {
            case 'validate_freshness':
                // Use our new validation function
                const { data: validationResult, error: validationError } = await supabase
                    .rpc('validate_market_data_freshness', { max_age_hours });

                if (validationError) {
                    throw new Error(`Validation error: ${validationError.message}`);
                }

                return res.status(200).json({
                    success: true,
                    validation: validationResult,
                    timestamp: new Date().toISOString()
                });

            case 'validate_and_fetch':
                // Validate first, then fetch if data is stale
                const { data: validation, error: valError } = await supabase
                    .rpc('validate_market_data_freshness', { max_age_hours });

                if (valError) throw valError;

                const needsRefresh = validation.status.includes('WARNING');
                
                let marketData = null;
                if (needsRefresh) {
                    // If data is stale, trigger refresh
                    const baseUrl = process.env.VERCEL_URL 
                        ? `https://${process.env.VERCEL_URL}` 
                        : 'http://localhost:3000';
                        
                    const refreshResponse = await fetch(`${baseUrl}/api/market-data-unified`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'fetch_latest',
                            symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'] // Default symbols
                        })
                    });

                    if (refreshResponse.ok) {
                        marketData = await refreshResponse.json();
                    }
                }

                return res.status(200).json({
                    success: true,
                    validation: validation,
                    data_refreshed: needsRefresh,
                    market_data: marketData,
                    timestamp: new Date().toISOString()
                });

            case 'health_check':
                // Quick health check for market data
                const { data: health, error: healthError } = await supabase
                    .rpc('validate_market_data_freshness', { max_age_hours: 1 });

                if (healthError) throw healthError;

                return res.status(200).json({
                    success: true,
                    status: health.status.includes('WARNING') ? 'stale' : 'fresh',
                    details: health,
                    timestamp: new Date().toISOString()
                });

            default:
                return res.status(400).json({
                    error: 'Invalid action',
                    message: 'Supported actions: validate_freshness, validate_and_fetch, health_check'
                });
        }

    } catch (error) {
        console.error('Market data validation error:', error);
        return res.status(500).json({
            error: 'Market data validation failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
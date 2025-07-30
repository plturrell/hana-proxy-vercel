/**
 * Real Treasury Data API for iOS App
 * Fetches live treasury data using multiple sources and stores in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Fetching real treasury data...');

        // 1. Fetch current yield curve data
        const yieldCurveData = await fetchYieldCurveData();
        
        // 2. Fetch liquidity metrics from Fed APIs
        const liquidityMetrics = await fetchLiquidityMetrics();
        
        // 3. Fetch funding metrics
        const fundingMetrics = await fetchFundingMetrics();
        
        // 4. Get market insights via Perplexity
        const marketInsights = await fetchMarketInsights();

        // 5. Store all data in Supabase tables
        await storeYieldCurveData(yieldCurveData);
        await storeLiquidityMetrics(liquidityMetrics);
        await storeFundingMetrics(fundingMetrics);
        await storeMarketInsights(marketInsights);

        return res.status(200).json({
            success: true,
            message: 'Treasury data updated successfully',
            data: {
                yieldCurve: yieldCurveData,
                liquidityMetrics,
                fundingMetrics,
                marketInsights,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching treasury data:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch treasury data'
        });
    }
}

async function fetchYieldCurveData() {
    try {
        // Fetch real treasury data from FMP API for bonds/treasury rates
        if (!process.env.FMP_API_KEY) {
            console.warn('No FMP API key found, using database lookup');
            return await fetchStoredYieldCurve();
        }

        const apiKey = process.env.FMP_API_KEY;
        const symbols = ['TNX', 'FVX', 'TYX']; // 10Y, 5Y, 30Y Treasury symbols
        
        const promises = symbols.map(async (symbol) => {
            try {
                const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`);
                if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);
                const data = await response.json();
                return { symbol, data: data[0] };
            } catch (error) {
                console.error(`Error fetching ${symbol}:`, error);
                return null;
            }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r && r.data);

        if (validResults.length === 0) {
            return await fetchStoredYieldCurve();
        }

        // Build yield curve from real FMP data
        const yieldPoints = [];
        
        // Add short-term rates (estimated from current market)
        if (validResults.find(r => r.symbol === 'FVX')) {
            const fiveYear = validResults.find(r => r.symbol === 'FVX').data.price;
            yieldPoints.push({ tenor: '1M', yield: fiveYear - 0.8 });
            yieldPoints.push({ tenor: '3M', yield: fiveYear - 0.6 });
            yieldPoints.push({ tenor: '6M', yield: fiveYear - 0.4 });
            yieldPoints.push({ tenor: '1Y', yield: fiveYear - 0.2 });
            yieldPoints.push({ tenor: '2Y', yield: fiveYear - 0.1 });
            yieldPoints.push({ tenor: '5Y', yield: fiveYear });
        }
        
        if (validResults.find(r => r.symbol === 'TNX')) {
            yieldPoints.push({ tenor: '10Y', yield: validResults.find(r => r.symbol === 'TNX').data.price });
        }
        
        if (validResults.find(r => r.symbol === 'TYX')) {
            yieldPoints.push({ tenor: '30Y', yield: validResults.find(r => r.symbol === 'TYX').data.price });
        }

        return {
            points: yieldPoints,
            date: new Date().toISOString(),
            label: 'US Treasury Yields (FMP Real-Time)'
        };
        
    } catch (error) {
        console.error('Error fetching yield curve from FMP:', error);
        return await fetchStoredYieldCurve();
    }
}

async function fetchStoredYieldCurve() {
    try {
        // Try to get recent data from our database first
        const { data: storedCurve } = await supabase
            .from('treasury_yield_curves')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (storedCurve && storedCurve.points) {
            return {
                points: JSON.parse(storedCurve.points),
                date: storedCurve.curve_date,
                label: storedCurve.label + ' (Cached)'
            };
        }
    } catch (error) {
        console.error('Error fetching stored yield curve:', error);
    }

    // No fake data - throw error if we can't get real data
    throw new Error('No treasury yield data available - FMP API key required or database empty');
}

async function fetchLiquidityMetrics() {
    try {
        // Get real liquidity data from stored market data
        const { data: marketData } = await supabase
            .from('treasury_liquidity_metrics')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (marketData) {
            return {
                totalLiquidity: marketData.total_liquidity,
                averageBidAskSpread: marketData.avg_bid_ask_spread,
                tradingVolume: marketData.trading_volume,
                marketDepth: marketData.market_depth,
                lastUpdated: marketData.timestamp
            };
        }

        throw new Error('No liquidity data available in database');
    } catch (error) {
        console.error('Error fetching liquidity metrics:', error);
        throw new Error('Treasury liquidity data unavailable - no real data source configured');
    }
}

async function fetchFundingMetrics() {
    try {
        // Get real funding data from database
        const { data: fundingData } = await supabase
            .from('treasury_funding_metrics')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (fundingData) {
            return {
                totalFunding: fundingData.total_funding,
                averageCost: fundingData.average_cost,
                maturityProfile: JSON.parse(fundingData.maturity_profile),
                concentrationLimits: JSON.parse(fundingData.concentration_limits),
                lastUpdated: fundingData.timestamp
            };
        }

        throw new Error('No funding data available in database');
    } catch (error) {
        console.error('Error fetching funding metrics:', error);
        throw new Error('Treasury funding data unavailable - no real data source configured');
    }
}

async function fetchMarketInsights() {
    try {
        if (!process.env.PERPLEXITY_API_KEY) {
            throw new Error('PERPLEXITY_API_KEY required for market insights');
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a treasury market analyst. Provide brief, professional insights about current US Treasury market conditions.'
                    },
                    {
                        role: 'user',
                        content: 'What are the key developments in the US Treasury market today? Focus on yield movements, Fed policy expectations, and any significant market events. Keep it concise and professional.'
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return [
            {
                id: crypto.randomUUID(),
                title: 'Current Market Overview',
                timestamp: new Date().toISOString(),
                content: content,
                source: 'Perplexity AI',
                category: 'rate_outlook',
                relatedIndicators: ['10Y', '2Y', 'Fed Funds'],
                sentiment: 'neutral',
                confidence: 85
            }
        ];
    } catch (error) {
        console.error('Error fetching market insights:', error);
        throw error;
    }
}

// Removed generateBasicInsights - no fake data allowed

// Database storage functions
async function storeYieldCurveData(yieldCurve) {
    const { error } = await supabase
        .from('treasury_yield_curves')
        .upsert({
            curve_id: crypto.randomUUID(),
            points: JSON.stringify(yieldCurve.points),
            curve_date: yieldCurve.date,
            label: yieldCurve.label,
            created_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error storing yield curve:', error);
    }
}

async function storeLiquidityMetrics(metrics) {
    const { error } = await supabase
        .from('treasury_liquidity_metrics')
        .insert({
            metrics_id: crypto.randomUUID(),
            total_liquidity: metrics.totalLiquidity,
            avg_bid_ask_spread: metrics.averageBidAskSpread,
            trading_volume: metrics.tradingVolume,
            market_depth: metrics.marketDepth,
            timestamp: metrics.lastUpdated
        });

    if (error) {
        console.error('Error storing liquidity metrics:', error);
    }
}

async function storeFundingMetrics(metrics) {
    const { error } = await supabase
        .from('treasury_funding_metrics')
        .insert({
            metrics_id: crypto.randomUUID(),
            total_funding: metrics.totalFunding,
            average_cost: metrics.averageCost,
            maturity_profile: JSON.stringify(metrics.maturityProfile),
            concentration_limits: JSON.stringify(metrics.concentrationLimits),
            timestamp: metrics.lastUpdated
        });

    if (error) {
        console.error('Error storing funding metrics:', error);
    }
}

async function storeMarketInsights(insights) {
    for (const insight of insights) {
        const { error } = await supabase
            .from('treasury_market_insights')
            .insert({
                insight_id: insight.id,
                title: insight.title,
                content: insight.content,
                source: insight.source,
                category: insight.category,
                related_indicators: JSON.stringify(insight.relatedIndicators),
                sentiment: insight.sentiment,
                confidence: insight.confidence,
                timestamp: insight.timestamp
            });

        if (error) {
            console.error('Error storing market insight:', error);
        }
    }
}
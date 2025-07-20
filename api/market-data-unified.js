// Unified Market Data API - Combines Finhub and FMP
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Import market data providers
async function getFinhubData(action, params) {
    try {
        const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
            
        const response = await fetch(`${baseUrl}/api/market-data-finhub`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...params })
        });
        
        if (!response.ok) throw new Error(`Finhub error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Finhub fetch error:', error);
        return null;
    }
}

async function getFMPData(action, params) {
    try {
        const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}` 
            : 'http://localhost:3000';
            
        const response = await fetch(`${baseUrl}/api/market-data-fmp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...params })
        });
        
        if (!response.ok) throw new Error(`FMP error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('FMP fetch error:', error);
        return null;
    }
}

// Merge data from both sources
function mergeMarketData(finhubData, fmpData) {
    if (!finhubData && !fmpData) return null;
    if (!finhubData) return fmpData;
    if (!fmpData) return finhubData;
    
    // Merge quote data
    return {
        ...finhubData,
        ...fmpData,
        sources: ['finhub', 'fmp'],
        price: fmpData.price || finhubData.price,
        change: fmpData.change || finhubData.change,
        changePercent: fmpData.changePercent || finhubData.changePercent,
        volume: fmpData.volume || finhubData.volume,
        marketCap: fmpData.marketCap || finhubData.marketCap,
        // Additional FMP-specific data
        pe: fmpData.pe,
        eps: fmpData.eps,
        yearHigh: fmpData.yearHigh,
        yearLow: fmpData.yearLow,
        priceAvg50: fmpData.priceAvg50,
        priceAvg200: fmpData.priceAvg200
    };
}

// Get real-time quote with fallback
async function getRealtimeQuote(symbol) {
    try {
        // Try both sources in parallel
        const [finhubResult, fmpResult] = await Promise.all([
            getFinhubData('quote', { symbol }),
            getFMPData('quote', { symbol })
        ]);
        
        const finhubQuote = finhubResult?.data;
        const fmpQuote = fmpResult?.data;
        
        if (!finhubQuote && !fmpQuote) {
            throw new Error('No data available from any source');
        }
        
        const mergedData = mergeMarketData(finhubQuote, fmpQuote);
        
        // Store in database
        await storeUnifiedMarketData(symbol, mergedData);
        
        return mergedData;
    } catch (error) {
        console.error('Unified quote error:', error);
        
        // Try to get from database cache
        const { data: cached } = await supabase
            .from('market_data')
            .select('*')
            .eq('symbol', symbol)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
        if (cached) {
            return {
                ...cached,
                cached: true,
                cacheAge: new Date() - new Date(cached.created_at)
            };
        }
        
        throw error;
    }
}

// Store unified market data
async function storeUnifiedMarketData(symbol, data) {
    try {
        const { error } = await supabase
            .from('market_data')
            .upsert({
                symbol,
                asset_type: 'stock',
                price: data.price,
                bid: data.bid || data.price - 0.01,
                ask: data.ask || data.price + 0.01,
                volume: data.volume,
                change_pct: data.changePercent,
                market_cap: data.marketCap,
                exchange: data.exchange,
                source: 'unified',
                metadata: {
                    pe: data.pe,
                    eps: data.eps,
                    yearHigh: data.yearHigh,
                    yearLow: data.yearLow,
                    priceAvg50: data.priceAvg50,
                    priceAvg200: data.priceAvg200,
                    sources: data.sources
                }
            }, {
                onConflict: 'symbol'
            });
            
        if (error) throw error;
    } catch (error) {
        console.error('Error storing unified data:', error);
    }
}

// Get market overview
async function getMarketOverview() {
    try {
        // Get major indices
        const indices = ['SPY', 'QQQ', 'DIA', 'IWM', 'VTI'];
        const indexQuotes = await Promise.all(
            indices.map(symbol => getRealtimeQuote(symbol).catch(e => null))
        );
        
        // Get sector performance from FMP
        const sectorResult = await getFMPData('sector-performance', {});
        const sectors = sectorResult?.data || [];
        
        // Get forex rates from Finhub
        const forexResult = await getFinhubData('forex', { base: 'USD' });
        const forex = forexResult?.data || {};
        
        // Get market news from Finhub
        const newsResult = await getFinhubData('news', { category: 'general' });
        const news = newsResult?.data || [];
        
        return {
            indices: indexQuotes.filter(q => q !== null),
            sectors,
            forex,
            news: news.slice(0, 5),
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Market overview error:', error);
        throw error;
    }
}

// Get portfolio data
async function getPortfolioData(symbols) {
    try {
        const quotes = await Promise.all(
            symbols.map(async (symbol) => {
                try {
                    const quote = await getRealtimeQuote(symbol);
                    const profileResult = await getFMPData('profile', { symbol });
                    const profile = profileResult?.data || {};
                    
                    return {
                        ...quote,
                        companyName: profile.companyName,
                        sector: profile.sector,
                        industry: profile.industry,
                        beta: profile.beta
                    };
                } catch (error) {
                    return { symbol, error: error.message };
                }
            })
        );
        
        return quotes;
    } catch (error) {
        console.error('Portfolio data error:', error);
        throw error;
    }
}

// API Handler
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { action, symbol, symbols } = req.body || req.query;
    
    try {
        switch (action) {
            case 'quote':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const quote = await getRealtimeQuote(symbol.toUpperCase());
                return res.json({ success: true, data: quote });
                
            case 'quotes':
                if (!symbols || !Array.isArray(symbols)) {
                    return res.status(400).json({ error: 'Symbols array required' });
                }
                const quotes = await Promise.all(
                    symbols.map(s => getRealtimeQuote(s.toUpperCase()).catch(e => ({ 
                        symbol: s, 
                        error: e.message 
                    })))
                );
                return res.json({ success: true, data: quotes });
                
            case 'portfolio':
                if (!symbols || !Array.isArray(symbols)) {
                    return res.status(400).json({ error: 'Symbols array required' });
                }
                const portfolio = await getPortfolioData(symbols.map(s => s.toUpperCase()));
                return res.json({ success: true, data: portfolio });
                
            case 'market-overview':
                const overview = await getMarketOverview();
                return res.json({ success: true, data: overview });
                
            case 'health':
                return res.json({ 
                    success: true, 
                    message: 'Unified market data API is running',
                    providers: ['finhub', 'fmp'],
                    timestamp: new Date()
                });
                
            default:
                // Forward to specific provider if requested
                if (req.body?.provider === 'finhub') {
                    const result = await getFinhubData(action, req.body);
                    return res.json(result);
                } else if (req.body?.provider === 'fmp') {
                    const result = await getFMPData(action, req.body);
                    return res.json(result);
                }
                
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Unified market data error:', error);
        return res.status(500).json({ 
            error: 'Market data fetch failed', 
            message: error.message,
            providers: ['finhub', 'fmp']
        });
    }
}
// Finhub Market Data API Integration
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Finhub API configuration
const FINHUB_API_KEY = process.env.FINHUB_API_KEY || process.env.FINNHUB_API_KEY || 'd1o8orpr01qtrauvrd7gd1o8orpr01qtrauvrd80';
const FINHUB_BASE_URL = 'https://finnhub.io/api/v1';

class FinhubMarketData {
    constructor() {
        this.apiKey = FINHUB_API_KEY;
        this.baseUrl = FINHUB_BASE_URL;
    }

    async fetchQuote(symbol) {
        try {
            const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`;
            console.log('Fetching from Finhub:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FinSight-BPMN/1.0'
                }
            });
            
            console.log('Finhub response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Finhub error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Finhub data received:', data);
            
            // Store in database
            await this.storeMarketData({
                symbol,
                price: data.c, // Current price
                bid: data.pc, // Previous close (as bid proxy)
                ask: data.c + 0.01, // Current + spread
                high: data.h,
                low: data.l,
                open: data.o,
                previousClose: data.pc,
                change: data.d,
                changePercent: data.dp,
                timestamp: new Date(data.t * 1000)
            });
            
            return {
                symbol,
                price: data.c,
                change: data.d,
                changePercent: data.dp,
                high: data.h,
                low: data.l,
                open: data.o,
                previousClose: data.pc,
                timestamp: new Date(data.t * 1000)
            };
        } catch (error) {
            console.error('Finhub quote error:', error);
            throw error;
        }
    }

    async fetchCompanyProfile(symbol) {
        try {
            const response = await fetch(`${this.baseUrl}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`);
            const data = await response.json();
            
            return {
                symbol,
                name: data.name,
                exchange: data.exchange,
                industry: data.finnhubIndustry,
                marketCap: data.marketCapitalization,
                currency: data.currency,
                country: data.country,
                ipo: data.ipo,
                logo: data.logo,
                weburl: data.weburl
            };
        } catch (error) {
            console.error('Finhub profile error:', error);
            throw error;
        }
    }

    async fetchMarketNews(category = 'general') {
        try {
            const response = await fetch(`${this.baseUrl}/news?category=${category}&token=${this.apiKey}`);
            const data = await response.json();
            
            return data.slice(0, 10).map(article => ({
                id: article.id,
                headline: article.headline,
                summary: article.summary,
                source: article.source,
                url: article.url,
                datetime: new Date(article.datetime * 1000),
                category: article.category,
                related: article.related
            }));
        } catch (error) {
            console.error('Finhub news error:', error);
            throw error;
        }
    }

    async fetchForexRates(base = 'USD') {
        try {
            // Finhub forex symbols
            const pairs = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];
            const rates = {};
            
            for (const currency of pairs) {
                const symbol = `${base}${currency}`;
                const response = await fetch(`${this.baseUrl}/forex/rates?base=${base}&token=${this.apiKey}`);
                const data = await response.json();
                
                if (data.quote && data.quote[currency]) {
                    rates[currency] = data.quote[currency];
                }
            }
            
            // Store forex rates
            await this.storeForexRates(base, rates);
            
            return rates;
        } catch (error) {
            console.error('Finhub forex error:', error);
            throw error;
        }
    }

    async fetchEconomicCalendar() {
        try {
            const response = await fetch(`${this.baseUrl}/calendar/economic?token=${this.apiKey}`);
            const data = await response.json();
            
            return data.economicCalendar?.slice(0, 20).map(event => ({
                country: event.country,
                event: event.event,
                impact: event.impact,
                actual: event.actual,
                estimate: event.estimate,
                previous: event.prev,
                time: event.time,
                unit: event.unit
            })) || [];
        } catch (error) {
            console.error('Finhub economic calendar error:', error);
            return [];
        }
    }

    async storeMarketData(data) {
        try {
            const { error } = await supabase
                .from('market_data')
                .upsert({
                    symbol: data.symbol,
                    asset_type: 'stock',
                    price: data.price,
                    bid: data.bid,
                    ask: data.ask,
                    volume: data.volume,
                    change_pct: data.changePercent,
                    source: 'finhub',
                    timestamp: data.timestamp || new Date()
                }, {
                    onConflict: 'symbol'
                });
                
            if (error) throw error;
        } catch (error) {
            console.error('Error storing market data:', error);
        }
    }

    async storeForexRates(base, rates) {
        try {
            const forexData = Object.entries(rates).map(([currency, rate]) => ({
                base_currency: base,
                quote_currency: currency,
                exchange_rate: rate,
                source: 'finhub'
            }));
            
            const { error } = await supabase
                .from('forex_rates')
                .upsert(forexData, {
                    onConflict: 'base_currency,quote_currency'
                });
                
            if (error) throw error;
        } catch (error) {
            console.error('Error storing forex rates:', error);
        }
    }
}

// Initialize Finhub client
const finhub = new FinhubMarketData();

// API Handler
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { action, symbol, symbols, category, base } = req.body || req.query;
    
    try {
        switch (action) {
            case 'quote':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const quote = await finhub.fetchQuote(symbol);
                return res.json({ success: true, data: quote });
                
            case 'quotes':
                if (!symbols || !Array.isArray(symbols)) {
                    return res.status(400).json({ error: 'Symbols array required' });
                }
                const quotes = await Promise.all(
                    symbols.map(s => finhub.fetchQuote(s).catch(e => ({ symbol: s, error: e.message })))
                );
                return res.json({ success: true, data: quotes });
                
            case 'profile':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const profile = await finhub.fetchCompanyProfile(symbol);
                return res.json({ success: true, data: profile });
                
            case 'news':
                const news = await finhub.fetchMarketNews(category || 'general');
                return res.json({ success: true, data: news });
                
            case 'forex':
                const forex = await finhub.fetchForexRates(base || 'USD');
                return res.json({ success: true, data: forex });
                
            case 'economic-calendar':
                const calendar = await finhub.fetchEconomicCalendar();
                return res.json({ success: true, data: calendar });
                
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Finhub API error:', error);
        return res.status(500).json({ 
            error: 'Market data fetch failed', 
            message: error.message 
        });
    }
}
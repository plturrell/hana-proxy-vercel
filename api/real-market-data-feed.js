// Real Market Data Feed Integration
import { monitoringMiddleware, logger } from './monitoring.js';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

class RealMarketDataFeed {
    constructor() {
        this.polygonKey = process.env.POLYGON_API_KEY;
        this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
        this.connections = new Map();
        this.priceCache = new Map();
        this.lastUpdate = new Map();
    }
    
    // Connect to Polygon.io WebSocket for real-time data
    connectToPolygon(symbols) {
        if (!this.polygonKey) {
            logger.warn('Polygon API key not configured');
            return this.fallbackToAlphaVantage(symbols);
        }
        
        const ws = new WebSocket(`wss://socket.polygon.io/stocks`);
        
        ws.on('open', () => {
            // Authenticate
            ws.send(JSON.stringify({
                action: 'auth',
                params: this.polygonKey
            }));
            
            // Subscribe to symbols
            ws.send(JSON.stringify({
                action: 'subscribe',
                params: symbols.map(s => `T.${s}`) // Trade updates
            }));
            
            logger.info('Connected to Polygon WebSocket', { symbols });
        });
        
        ws.on('message', async (data) => {
            const messages = JSON.parse(data);
            
            for (const msg of messages) {
                if (msg.ev === 'T') { // Trade event
                    await this.processTrade({
                        symbol: msg.sym,
                        price: msg.p,
                        volume: msg.s,
                        timestamp: msg.t,
                        conditions: msg.c
                    });
                }
            }
        });
        
        ws.on('error', (error) => {
            logger.error('Polygon WebSocket error', error);
            this.reconnectPolygon(symbols);
        });
        
        this.connections.set('polygon', ws);
    }
    
    // Process real trade data
    async processTrade(trade) {
        // Update cache
        this.priceCache.set(trade.symbol, {
            price: trade.price,
            volume: trade.volume,
            timestamp: trade.timestamp,
            change: this.calculateChange(trade.symbol, trade.price)
        });
        
        this.lastUpdate.set(trade.symbol, Date.now());
        
        // Store in database for historical analysis
        await supabase
            .from('market_data')
            .insert({
                symbol: trade.symbol,
                price: trade.price,
                volume: trade.volume,
                timestamp: new Date(trade.timestamp).toISOString(),
                source: 'polygon'
            });
            
        // Trigger any alerts
        await this.checkAlerts(trade.symbol, trade.price);
    }
    
    calculateChange(symbol, newPrice) {
        const cached = this.priceCache.get(symbol);
        if (!cached || !cached.previousClose) {
            return { amount: 0, percent: 0 };
        }
        
        const change = newPrice - cached.previousClose;
        const changePercent = (change / cached.previousClose) * 100;
        
        return {
            amount: change,
            percent: changePercent
        };
    }
    
    // Alpha Vantage for fallback/additional data
    async fallbackToAlphaVantage(symbols) {
        if (!this.alphaVantageKey) {
            logger.warn('No market data API keys configured');
            return;
        }
        
        // Poll every 5 seconds (Alpha Vantage has rate limits)
        setInterval(async () => {
            for (const symbol of symbols) {
                try {
                    const response = await fetch(
                        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageKey}`
                    );
                    
                    const data = await response.json();
                    const quote = data['Global Quote'];
                    
                    if (quote) {
                        await this.processTrade({
                            symbol: symbol,
                            price: parseFloat(quote['05. price']),
                            volume: parseInt(quote['06. volume']),
                            timestamp: Date.now(),
                            previousClose: parseFloat(quote['08. previous close'])
                        });
                    }
                } catch (error) {
                    logger.error('Alpha Vantage fetch error', { symbol, error });
                }
            }
        }, 5000);
    }
    
    // Get real-time price
    getCurrentPrice(symbol) {
        const cached = this.priceCache.get(symbol);
        if (!cached) {
            return null;
        }
        
        // If data is older than 1 minute, mark as stale
        const isStale = Date.now() - this.lastUpdate.get(symbol) > 60000;
        
        return {
            ...cached,
            isStale,
            lastUpdate: this.lastUpdate.get(symbol)
        };
    }
    
    // Historical data for analysis
    async getHistoricalData(symbol, period = '1D') {
        const endpoint = this.getHistoricalEndpoint(period);
        
        try {
            const response = await fetch(
                `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${endpoint}?apiKey=${this.polygonKey}`
            );
            
            const data = await response.json();
            
            if (data.results) {
                return data.results.map(bar => ({
                    timestamp: bar.t,
                    open: bar.o,
                    high: bar.h,
                    low: bar.l,
                    close: bar.c,
                    volume: bar.v
                }));
            }
        } catch (error) {
            logger.error('Historical data fetch error', { symbol, error });
        }
        
        return [];
    }
    
    getHistoricalEndpoint(period) {
        const now = Date.now();
        const ranges = {
            '1D': now - 24 * 60 * 60 * 1000,
            '1W': now - 7 * 24 * 60 * 60 * 1000,
            '1M': now - 30 * 24 * 60 * 60 * 1000,
            '3M': now - 90 * 24 * 60 * 60 * 1000,
            '1Y': now - 365 * 24 * 60 * 60 * 1000
        };
        
        const from = new Date(ranges[period] || ranges['1D']).toISOString();
        const to = new Date(now).toISOString();
        
        return `${from}/${to}`;
    }
    
    // Price alerts
    async checkAlerts(symbol, price) {
        const { data: alerts } = await supabase
            .from('price_alerts')
            .select('*')
            .eq('symbol', symbol)
            .eq('active', true);
            
        if (!alerts) return;
        
        for (const alert of alerts) {
            let triggered = false;
            
            if (alert.condition === 'above' && price > alert.threshold) {
                triggered = true;
            } else if (alert.condition === 'below' && price < alert.threshold) {
                triggered = true;
            }
            
            if (triggered) {
                await this.triggerAlert(alert, price);
            }
        }
    }
    
    async triggerAlert(alert, currentPrice) {
        // Send notification
        await supabase
            .from('notifications')
            .insert({
                user_id: alert.user_id,
                type: 'price_alert',
                title: `Price Alert: ${alert.symbol}`,
                message: `${alert.symbol} is now ${alert.condition} ${alert.threshold} at ${currentPrice}`,
                data: { alert, currentPrice },
                created_at: new Date().toISOString()
            });
            
        // Mark alert as triggered
        await supabase
            .from('price_alerts')
            .update({ 
                active: false, 
                triggered_at: new Date().toISOString(),
                triggered_price: currentPrice
            })
            .eq('id', alert.id);
            
        logger.info('Price alert triggered', { alert, currentPrice });
    }
    
    // Disconnect all feeds
    disconnect() {
        for (const [name, connection] of this.connections) {
            if (connection && connection.close) {
                connection.close();
            }
        }
        this.connections.clear();
    }
}

// Initialize feed
const marketDataFeed = new RealMarketDataFeed();

// API Handler
async function realMarketDataHandler(req, res) {
    const { action, ...params } = req.body;
    
    try {
        switch (action) {
            case 'subscribe': {
                const { symbols } = params;
                
                // Connect to real-time feed
                marketDataFeed.connectToPolygon(symbols);
                
                return res.status(200).json({
                    success: true,
                    message: 'Subscribed to market data',
                    symbols
                });
            }
            
            case 'get-price': {
                const { symbol } = params;
                
                const price = marketDataFeed.getCurrentPrice(symbol);
                
                if (!price) {
                    // Fetch if not in cache
                    await marketDataFeed.fallbackToAlphaVantage([symbol]);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return res.status(200).json({
                        success: true,
                        price: marketDataFeed.getCurrentPrice(symbol)
                    });
                }
                
                return res.status(200).json({
                    success: true,
                    price
                });
            }
            
            case 'historical': {
                const { symbol, period } = params;
                
                const data = await marketDataFeed.getHistoricalData(symbol, period);
                
                return res.status(200).json({
                    success: true,
                    data
                });
            }
            
            case 'set-alert': {
                const { userId, symbol, condition, threshold } = params;
                
                const { data: alert } = await supabase
                    .from('price_alerts')
                    .insert({
                        user_id: userId,
                        symbol,
                        condition,
                        threshold,
                        active: true,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                    
                return res.status(200).json({
                    success: true,
                    alert
                });
            }
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error('Market data error', error);
        return res.status(500).json({ 
            error: 'Market data operation failed',
            message: error.message 
        });
    }
}

export default monitoringMiddleware(realMarketDataHandler);
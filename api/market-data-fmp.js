// Financial Modeling Prep (FMP) Market Data API Integration
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Import key manager
import { getFMPKeyManager } from './fmp-key-manager.js';

// FMP API configuration
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

class FMPMarketData {
    constructor() {
        this.baseUrl = FMP_BASE_URL;
        this.keyManager = getFMPKeyManager();
    }
    
    async getApiKey() {
        return await this.keyManager.getCurrentKey();
    }

    async fetchQuote(symbol) {
        try {
            const apiKey = await this.getApiKey();
            const url = `${this.baseUrl}/quote/${symbol}?apikey=${apiKey}`;
            console.log('Fetching from FMP:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'FinSight-BPMN/1.0'
                }
            });
            
            console.log('FMP response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('FMP error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('FMP data received:', data);
            const quote = data[0];
            
            if (!quote) throw new Error('No data found for symbol');
            
            // Store in database
            await this.storeMarketData({
                symbol: quote.symbol,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changesPercentage,
                dayLow: quote.dayLow,
                dayHigh: quote.dayHigh,
                yearLow: quote.yearLow,
                yearHigh: quote.yearHigh,
                marketCap: quote.marketCap,
                priceAvg50: quote.priceAvg50,
                priceAvg200: quote.priceAvg200,
                volume: quote.volume,
                avgVolume: quote.avgVolume,
                exchange: quote.exchange,
                open: quote.open,
                previousClose: quote.previousClose,
                eps: quote.eps,
                pe: quote.pe,
                timestamp: new Date(quote.timestamp * 1000)
            });
            
            return {
                symbol: quote.symbol,
                name: quote.name,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changesPercentage,
                dayLow: quote.dayLow,
                dayHigh: quote.dayHigh,
                yearLow: quote.yearLow,
                yearHigh: quote.yearHigh,
                marketCap: quote.marketCap,
                priceAvg50: quote.priceAvg50,
                priceAvg200: quote.priceAvg200,
                volume: quote.volume,
                avgVolume: quote.avgVolume,
                exchange: quote.exchange,
                open: quote.open,
                previousClose: quote.previousClose,
                eps: quote.eps,
                pe: quote.pe,
                sharesOutstanding: quote.sharesOutstanding,
                timestamp: new Date(quote.timestamp * 1000)
            };
        } catch (error) {
            console.error('FMP quote error:', error);
            throw error;
        }
    }

    async fetchCompanyProfile(symbol) {
        try {
            const apiKey = await this.getApiKey();
            const response = await fetch(`${this.baseUrl}/profile/${symbol}?apikey=${apiKey}`);
            const data = await response.json();
            const profile = data[0];
            
            if (!profile) throw new Error('No profile found');
            
            return {
                symbol: profile.symbol,
                price: profile.price,
                beta: profile.beta,
                volAvg: profile.volAvg,
                mktCap: profile.mktCap,
                lastDiv: profile.lastDiv,
                range: profile.range,
                changes: profile.changes,
                companyName: profile.companyName,
                currency: profile.currency,
                cik: profile.cik,
                isin: profile.isin,
                cusip: profile.cusip,
                exchange: profile.exchange,
                exchangeShortName: profile.exchangeShortName,
                industry: profile.industry,
                website: profile.website,
                description: profile.description,
                ceo: profile.ceo,
                sector: profile.sector,
                country: profile.country,
                fullTimeEmployees: profile.fullTimeEmployees,
                phone: profile.phone,
                address: profile.address,
                city: profile.city,
                state: profile.state,
                zip: profile.zip,
                dcfDiff: profile.dcfDiff,
                dcf: profile.dcf,
                image: profile.image,
                ipoDate: profile.ipoDate,
                defaultImage: profile.defaultImage,
                isEtf: profile.isEtf,
                isActivelyTrading: profile.isActivelyTrading
            };
        } catch (error) {
            console.error('FMP profile error:', error);
            throw error;
        }
    }

    async fetchHistoricalPrices(symbol, from, to) {
        try {
            const apiKey = await this.getApiKey();
            const response = await fetch(
                `${this.baseUrl}/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${apiKey}`
            );
            const data = await response.json();
            
            return data.historical?.map(day => ({
                date: day.date,
                open: day.open,
                high: day.high,
                low: day.low,
                close: day.close,
                adjClose: day.adjClose,
                volume: day.volume,
                unadjustedVolume: day.unadjustedVolume,
                change: day.change,
                changePercent: day.changePercent,
                vwap: day.vwap,
                changeOverTime: day.changeOverTime
            })) || [];
        } catch (error) {
            console.error('FMP historical error:', error);
            throw error;
        }
    }

    async fetchFinancialStatements(symbol, period = 'annual', limit = 5) {
        try {
            const [income, balance, cashflow] = await Promise.all([
                fetch(`${this.baseUrl}/income-statement/${symbol}?period=${period}&limit=${limit}&apikey=${this.apiKey}`),
                fetch(`${this.baseUrl}/balance-sheet-statement/${symbol}?period=${period}&limit=${limit}&apikey=${this.apiKey}`),
                fetch(`${this.baseUrl}/cash-flow-statement/${symbol}?period=${period}&limit=${limit}&apikey=${this.apiKey}`)
            ]);
            
            const [incomeData, balanceData, cashflowData] = await Promise.all([
                income.json(),
                balance.json(),
                cashflow.json()
            ]);
            
            return {
                incomeStatement: incomeData,
                balanceSheet: balanceData,
                cashFlowStatement: cashflowData
            };
        } catch (error) {
            console.error('FMP financials error:', error);
            throw error;
        }
    }

    async fetchKeyMetrics(symbol, period = 'annual', limit = 5) {
        try {
            const response = await fetch(
                `${this.baseUrl}/key-metrics/${symbol}?period=${period}&limit=${limit}&apikey=${this.apiKey}`
            );
            const data = await response.json();
            
            return data.map(metric => ({
                symbol: metric.symbol,
                date: metric.date,
                period: metric.period,
                revenuePerShare: metric.revenuePerShare,
                netIncomePerShare: metric.netIncomePerShare,
                operatingCashFlowPerShare: metric.operatingCashFlowPerShare,
                freeCashFlowPerShare: metric.freeCashFlowPerShare,
                cashPerShare: metric.cashPerShare,
                bookValuePerShare: metric.bookValuePerShare,
                tangibleBookValuePerShare: metric.tangibleBookValuePerShare,
                shareholdersEquityPerShare: metric.shareholdersEquityPerShare,
                interestDebtPerShare: metric.interestDebtPerShare,
                marketCap: metric.marketCap,
                enterpriseValue: metric.enterpriseValue,
                peRatio: metric.peRatio,
                priceToSalesRatio: metric.priceToSalesRatio,
                pocfratio: metric.pocfratio,
                pfcfRatio: metric.pfcfRatio,
                pbRatio: metric.pbRatio,
                ptbRatio: metric.ptbRatio,
                evToSales: metric.evToSales,
                enterpriseValueOverEBITDA: metric.enterpriseValueOverEBITDA,
                evToOperatingCashFlow: metric.evToOperatingCashFlow,
                evToFreeCashFlow: metric.evToFreeCashFlow,
                earningsYield: metric.earningsYield,
                freeCashFlowYield: metric.freeCashFlowYield,
                debtToEquity: metric.debtToEquity,
                debtToAssets: metric.debtToAssets,
                netDebtToEBITDA: metric.netDebtToEBITDA,
                currentRatio: metric.currentRatio,
                interestCoverage: metric.interestCoverage,
                incomeQuality: metric.incomeQuality,
                dividendYield: metric.dividendYield,
                payoutRatio: metric.payoutRatio,
                salesGeneralAndAdministrativeToRevenue: metric.salesGeneralAndAdministrativeToRevenue,
                researchAndDdevelopementToRevenue: metric.researchAndDdevelopementToRevenue,
                intangiblesToTotalAssets: metric.intangiblesToTotalAssets,
                capexToOperatingCashFlow: metric.capexToOperatingCashFlow,
                capexToRevenue: metric.capexToRevenue,
                capexToDepreciation: metric.capexToDepreciation,
                stockBasedCompensationToRevenue: metric.stockBasedCompensationToRevenue,
                grahamNumber: metric.grahamNumber,
                roic: metric.roic,
                returnOnTangibleAssets: metric.returnOnTangibleAssets,
                grahamNetNet: metric.grahamNetNet,
                workingCapital: metric.workingCapital,
                tangibleAssetValue: metric.tangibleAssetValue,
                netCurrentAssetValue: metric.netCurrentAssetValue,
                investedCapital: metric.investedCapital,
                averageReceivables: metric.averageReceivables,
                averagePayables: metric.averagePayables,
                averageInventory: metric.averageInventory,
                daysSalesOutstanding: metric.daysSalesOutstanding,
                daysPayablesOutstanding: metric.daysPayablesOutstanding,
                daysOfInventoryOnHand: metric.daysOfInventoryOnHand,
                receivablesTurnover: metric.receivablesTurnover,
                payablesTurnover: metric.payablesTurnover,
                inventoryTurnover: metric.inventoryTurnover,
                roe: metric.roe,
                capexPerShare: metric.capexPerShare
            }));
        } catch (error) {
            console.error('FMP key metrics error:', error);
            throw error;
        }
    }

    async fetchSectorPerformance() {
        try {
            const response = await fetch(`${this.baseUrl}/sectors-performance?apikey=${this.apiKey}`);
            const data = await response.json();
            
            return data.map(sector => ({
                sector: sector.sector,
                changesPercentage: sector.changesPercentage
            }));
        } catch (error) {
            console.error('FMP sector performance error:', error);
            throw error;
        }
    }

    async fetchEconomicCalendar(from, to) {
        try {
            const response = await fetch(
                `${this.baseUrl}/economic_calendar?from=${from}&to=${to}&apikey=${this.apiKey}`
            );
            const data = await response.json();
            
            return data.map(event => ({
                event: event.event,
                date: event.date,
                country: event.country,
                currency: event.currency,
                previous: event.previous,
                estimate: event.estimate,
                actual: event.actual,
                change: event.change,
                changePercentage: event.changePercentage,
                impact: event.impact
            }));
        } catch (error) {
            console.error('FMP economic calendar error:', error);
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
                    bid: data.price - 0.01, // Estimate bid
                    ask: data.price + 0.01, // Estimate ask
                    volume: data.volume,
                    change_pct: data.changePercent,
                    market_cap: data.marketCap,
                    exchange: data.exchange,
                    source: 'fmp',
                    timestamp: data.timestamp || new Date()
                }, {
                    onConflict: 'symbol'
                });
                
            if (error) throw error;
        } catch (error) {
            console.error('Error storing market data:', error);
        }
    }
}

// Initialize FMP client
const fmp = new FMPMarketData();

// API Handler
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { action, symbol, symbols, period, limit, from, to } = req.body || req.query;
    
    try {
        switch (action) {
            case 'quote':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const quote = await fmp.fetchQuote(symbol);
                return res.json({ success: true, data: quote });
                
            case 'quotes':
                if (!symbols || !Array.isArray(symbols)) {
                    return res.status(400).json({ error: 'Symbols array required' });
                }
                const quotes = await Promise.all(
                    symbols.map(s => fmp.fetchQuote(s).catch(e => ({ symbol: s, error: e.message })))
                );
                return res.json({ success: true, data: quotes });
                
            case 'profile':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const profile = await fmp.fetchCompanyProfile(symbol);
                return res.json({ success: true, data: profile });
                
            case 'historical':
                if (!symbol || !from || !to) {
                    return res.status(400).json({ error: 'Symbol, from, and to dates required' });
                }
                const historical = await fmp.fetchHistoricalPrices(symbol, from, to);
                return res.json({ success: true, data: historical });
                
            case 'financials':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const financials = await fmp.fetchFinancialStatements(symbol, period, limit);
                return res.json({ success: true, data: financials });
                
            case 'key-metrics':
                if (!symbol) {
                    return res.status(400).json({ error: 'Symbol required' });
                }
                const metrics = await fmp.fetchKeyMetrics(symbol, period, limit);
                return res.json({ success: true, data: metrics });
                
            case 'sector-performance':
                const sectors = await fmp.fetchSectorPerformance();
                return res.json({ success: true, data: sectors });
                
            case 'economic-calendar':
                if (!from || !to) {
                    // Default to current week
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    from = weekAgo.toISOString().split('T')[0];
                    to = today.toISOString().split('T')[0];
                }
                const calendar = await fmp.fetchEconomicCalendar(from, to);
                return res.json({ success: true, data: calendar });
                
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('FMP API error:', error);
        return res.status(500).json({ 
            error: 'Market data fetch failed', 
            message: error.message 
        });
    }
}
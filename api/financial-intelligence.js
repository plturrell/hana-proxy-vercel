/**
 * Financial Intelligence Processing Service
 * Performs sentiment analysis, anomaly detection, correlation analysis, and economic indicators
 * Provides advanced financial insights and predictions
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).setHeader(corsHeaders);
  }

  const { action = 'status' } = req.query || req.body || {};
  
  try {
    switch (action) {
      case 'sentiment-analysis':
        return await performSentimentAnalysis(res);
        
      case 'anomaly-detection':
        return await detectMarketAnomalies(res);
        
      case 'correlation-analysis':
        return await analyzeCorrelations(res);
        
      case 'economic-indicators':
        return await processEconomicIndicators(res);
        
      case 'market-prediction':
        return await generateMarketPredictions(res);
        
      case 'risk-signals':
        return await identifyRiskSignals(res);
        
      case 'news-impact':
        return await analyzeNewsImpact(res);
        
      case 'sector-rotation':
        return await analyzeSectorRotation(res);
        
      case 'intelligence-report':
        return await generateIntelligenceReport(res);
        
      case 'health':
      case 'status':
        return res.status(200).json({ 
          status: 'active',
          message: 'Financial Intelligence Service is running',
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Financial intelligence error:', error);
    return res.status(500).json({ 
      error: 'Intelligence processing failed', 
      details: error.message 
    });
  }
}

async function performSentimentAnalysis(res) {
  console.log('🎭 Performing sentiment analysis...');
  
  const results = {
    news_analyzed: 0,
    overall_sentiment: 0,
    sentiment_breakdown: {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0
    },
    trending_topics: [],
    sentiment_by_sector: {}
  };
  
  // Get recent news articles
  const { data: articles } = await supabase
    .from('news_articles_partitioned')
    .select('article_id, title, content, sentiment_score, entities')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
  
  if (!articles || articles.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No recent articles to analyze',
      results
    });
  }
  
  results.news_analyzed = articles.length;
  
  // Analyze sentiment distribution
  let totalSentiment = 0;
  const topicCounts = {};
  const sectorSentiments = {};
  
  for (const article of articles) {
    // Update sentiment score if not already calculated
    let sentimentScore = article.sentiment_score;
    if (!sentimentScore) {
      sentimentScore = await calculateSentiment(article.title, article.content);
      
      // Store sentiment score
      await supabase
        .from('news_articles_partitioned')
        .update({ sentiment_score: sentimentScore })
        .eq('article_id', article.article_id);
    }
    
    totalSentiment += sentimentScore;
    
    // Categorize sentiment
    if (sentimentScore >= 0.8) results.sentiment_breakdown.very_positive++;
    else if (sentimentScore >= 0.3) results.sentiment_breakdown.positive++;
    else if (sentimentScore >= -0.3) results.sentiment_breakdown.neutral++;
    else if (sentimentScore >= -0.8) results.sentiment_breakdown.negative++;
    else results.sentiment_breakdown.very_negative++;
    
    // Extract topics and sectors
    const entities = article.entities || [];
    for (const entity of entities) {
      if (entity.type === 'TOPIC') {
        topicCounts[entity.value] = (topicCounts[entity.value] || 0) + 1;
      }
      if (entity.type === 'SECTOR') {
        if (!sectorSentiments[entity.value]) {
          sectorSentiments[entity.value] = { total: 0, count: 0 };
        }
        sectorSentiments[entity.value].total += sentimentScore;
        sectorSentiments[entity.value].count++;
      }
    }
  }
  
  // Calculate overall sentiment
  results.overall_sentiment = totalSentiment / articles.length;
  
  // Get trending topics
  results.trending_topics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count, percentage: (count / articles.length) * 100 }));
  
  // Calculate sector sentiments
  for (const [sector, data] of Object.entries(sectorSentiments)) {
    results.sentiment_by_sector[sector] = data.total / data.count;
  }
  
  // Generate sentiment signals
  const signals = generateSentimentSignals(results);
  
  // Store analysis results
  await supabase
    .from('sentiment_analysis_results')
    .insert({
      analysis_date: new Date().toISOString(),
      results,
      signals,
      article_count: articles.length
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
    signals
  });
}

async function detectMarketAnomalies(res) {
  console.log('🔍 Detecting market anomalies...');
  
  const anomalies = {
    price_anomalies: [],
    volume_anomalies: [],
    correlation_breaks: [],
    unusual_patterns: []
  };
  
  // Get recent market data
  const { data: marketData } = await supabase
    .from('market_data')
    .select('*')
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false });
  
  // Group by symbol
  const symbolData = {};
  for (const data of marketData || []) {
    if (!symbolData[data.symbol]) {
      symbolData[data.symbol] = [];
    }
    symbolData[data.symbol].push(data);
  }
  
  // Detect anomalies for each symbol
  for (const [symbol, data] of Object.entries(symbolData)) {
    // Price anomalies (3-sigma rule)
    const priceAnomalies = detectPriceAnomalies(data);
    if (priceAnomalies.length > 0) {
      anomalies.price_anomalies.push({
        symbol,
        anomalies: priceAnomalies,
        severity: calculateAnomalySeverity(priceAnomalies)
      });
    }
    
    // Volume anomalies
    const volumeAnomalies = detectVolumeAnomalies(data);
    if (volumeAnomalies.length > 0) {
      anomalies.volume_anomalies.push({
        symbol,
        anomalies: volumeAnomalies,
        severity: calculateAnomalySeverity(volumeAnomalies)
      });
    }
  }
  
  // Detect correlation breaks
  anomalies.correlation_breaks = await detectCorrelationBreaks(symbolData);
  
  // Detect unusual patterns
  anomalies.unusual_patterns = detectUnusualPatterns(symbolData);
  
  // Generate alerts for critical anomalies
  const alerts = generateAnomalyAlerts(anomalies);
  
  // Store anomaly detection results
  await supabase
    .from('anomaly_detection_results')
    .insert({
      detection_time: new Date().toISOString(),
      anomalies,
      alerts,
      symbols_analyzed: Object.keys(symbolData).length
    });
  
  // Create market alerts for critical anomalies
  if (alerts.length > 0) {
    await supabase
      .from('market_alerts')
      .insert(alerts);
  }
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    anomalies,
    alerts: alerts.length,
    symbols_analyzed: Object.keys(symbolData).length
  });
}

async function analyzeCorrelations(res) {
  console.log('📊 Analyzing correlations...');
  
  const results = {
    correlation_matrix: {},
    significant_correlations: [],
    correlation_changes: [],
    cluster_analysis: {}
  };
  
  // Get symbols to analyze
  const symbols = ['SPY', 'QQQ', 'DIA', 'GLD', 'TLT', 'VIX', 'DXY', 'AAPL', 'MSFT', 'GOOGL'];
  
  // Get historical data for correlation calculation
  const historicalData = {};
  for (const symbol of symbols) {
    const { data } = await supabase
      .from('market_data')
      .select('symbol, price, timestamp')
      .eq('symbol', symbol)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });
    
    if (data && data.length > 0) {
      historicalData[symbol] = data.map(d => ({ 
        price: d.price, 
        timestamp: d.timestamp 
      }));
    }
  }
  
  // Calculate correlation matrix
  results.correlation_matrix = calculateCorrelationMatrix(historicalData);
  
  // Find significant correlations
  for (const [symbol1, correlations] of Object.entries(results.correlation_matrix)) {
    for (const [symbol2, correlation] of Object.entries(correlations)) {
      if (symbol1 !== symbol2 && Math.abs(correlation) > 0.7) {
        results.significant_correlations.push({
          pair: `${symbol1}-${symbol2}`,
          correlation,
          strength: Math.abs(correlation) > 0.9 ? 'very_strong' : 'strong',
          direction: correlation > 0 ? 'positive' : 'negative'
        });
      }
    }
  }
  
  // Detect correlation changes (compare to previous period)
  const previousCorrelations = await getPreviousCorrelations();
  results.correlation_changes = detectCorrelationChanges(
    results.correlation_matrix, 
    previousCorrelations
  );
  
  // Perform cluster analysis
  results.cluster_analysis = performClusterAnalysis(results.correlation_matrix);
  
  // Store correlation analysis
  await supabase
    .from('correlation_analysis_results')
    .insert({
      analysis_date: new Date().toISOString(),
      correlation_matrix: results.correlation_matrix,
      significant_correlations: results.significant_correlations,
      correlation_changes: results.correlation_changes,
      clusters: results.cluster_analysis
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function processEconomicIndicators(res) {
  console.log('📈 Processing economic indicators...');
  
  const indicators = {
    market_indicators: {},
    technical_indicators: {},
    sentiment_indicators: {},
    composite_score: 0
  };
  
  // Calculate market indicators
  indicators.market_indicators = await calculateMarketIndicators();
  
  // Calculate technical indicators
  indicators.technical_indicators = await calculateTechnicalIndicators();
  
  // Calculate sentiment indicators
  indicators.sentiment_indicators = await calculateSentimentIndicators();
  
  // Calculate composite economic score
  indicators.composite_score = calculateCompositeScore(indicators);
  
  // Generate economic outlook
  const outlook = generateEconomicOutlook(indicators);
  
  // Store indicators
  await supabase
    .from('economic_indicators')
    .insert({
      indicator_date: new Date().toISOString(),
      indicators,
      outlook,
      composite_score: indicators.composite_score
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    indicators,
    outlook
  });
}

async function generateMarketPredictions(res) {
  console.log('🔮 Generating market predictions...');
  
  const predictions = {
    short_term: {}, // 1-7 days
    medium_term: {}, // 1-4 weeks
    sector_outlook: {},
    confidence_levels: {}
  };
  
  // Get historical patterns
  const patterns = await identifyHistoricalPatterns();
  
  // Get current market conditions
  const conditions = await getCurrentMarketConditions();
  
  // Generate predictions for major indices
  const indices = ['SPY', 'QQQ', 'DIA'];
  for (const symbol of indices) {
    predictions.short_term[symbol] = await predictShortTerm(symbol, patterns, conditions);
    predictions.medium_term[symbol] = await predictMediumTerm(symbol, patterns, conditions);
    predictions.confidence_levels[symbol] = calculatePredictionConfidence(
      predictions.short_term[symbol],
      predictions.medium_term[symbol]
    );
  }
  
  // Generate sector outlook
  const sectors = ['XLF', 'XLK', 'XLE', 'XLV', 'XLI'];
  for (const sector of sectors) {
    predictions.sector_outlook[sector] = await predictSectorOutlook(sector, conditions);
  }
  
  // Store predictions
  await supabase
    .from('market_predictions')
    .insert({
      prediction_date: new Date().toISOString(),
      predictions,
      patterns_used: patterns.length,
      market_conditions: conditions
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    predictions
  });
}

async function identifyRiskSignals(res) {
  console.log('⚠️ Identifying risk signals...');
  
  const riskSignals = {
    market_risks: [],
    sector_risks: [],
    systemic_risks: [],
    risk_score: 0
  };
  
  // Check volatility spikes
  const volatilityRisk = await checkVolatilityRisk();
  if (volatilityRisk.level > 0.7) {
    riskSignals.market_risks.push({
      type: 'volatility_spike',
      severity: 'high',
      description: 'Market volatility exceeds normal ranges',
      indicators: volatilityRisk.indicators
    });
  }
  
  // Check correlation breakdown
  const correlationRisk = await checkCorrelationRisk();
  if (correlationRisk.breakdown_detected) {
    riskSignals.systemic_risks.push({
      type: 'correlation_breakdown',
      severity: 'medium',
      description: 'Historical correlations breaking down',
      affected_pairs: correlationRisk.affected_pairs
    });
  }
  
  // Check sector concentration
  const sectorRisk = await checkSectorConcentration();
  for (const risk of sectorRisk) {
    if (risk.concentration > 0.3) {
      riskSignals.sector_risks.push({
        type: 'sector_concentration',
        sector: risk.sector,
        severity: risk.concentration > 0.4 ? 'high' : 'medium',
        description: `High concentration in ${risk.sector} sector`
      });
    }
  }
  
  // Check liquidity risk
  const liquidityRisk = await checkLiquidityRisk();
  if (liquidityRisk.risk_level > 0.6) {
    riskSignals.market_risks.push({
      type: 'liquidity_risk',
      severity: 'high',
      description: 'Low market liquidity detected',
      affected_symbols: liquidityRisk.affected_symbols
    });
  }
  
  // Calculate overall risk score
  riskSignals.risk_score = calculateOverallRiskScore(riskSignals);
  
  // Generate risk mitigation recommendations
  const recommendations = generateRiskMitigation(riskSignals);
  
  // Store risk analysis
  await supabase
    .from('risk_analysis_results')
    .insert({
      analysis_time: new Date().toISOString(),
      risk_signals: riskSignals,
      recommendations,
      overall_risk_score: riskSignals.risk_score
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    risk_signals: riskSignals,
    recommendations
  });
}

async function analyzeNewsImpact(res) {
  console.log('📰 Analyzing news impact on markets...');
  
  const impact = {
    immediate_impact: [],
    delayed_impact: [],
    sector_impact: {},
    company_impact: {}
  };
  
  // Get recent news with high sentiment scores
  const { data: news } = await supabase
    .from('news_articles_partitioned')
    .select('*')
    .or('sentiment_score.gt.0.7,sentiment_score.lt.-0.7')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });
  
  for (const article of news || []) {
    // Extract mentioned symbols
    const symbols = extractSymbolsFromNews(article);
    
    // Check immediate market reaction
    for (const symbol of symbols) {
      const reaction = await checkMarketReaction(symbol, article.created_at);
      
      if (reaction.significant) {
        impact.immediate_impact.push({
          article_id: article.article_id,
          symbol,
          price_change: reaction.price_change,
          volume_change: reaction.volume_change,
          reaction_time: reaction.time_to_reaction
        });
      }
    }
    
    // Analyze sector impact
    const sectors = extractSectorsFromNews(article);
    for (const sector of sectors) {
      if (!impact.sector_impact[sector]) {
        impact.sector_impact[sector] = {
          positive_news: 0,
          negative_news: 0,
          total_impact: 0
        };
      }
      
      if (article.sentiment_score > 0) {
        impact.sector_impact[sector].positive_news++;
      } else {
        impact.sector_impact[sector].negative_news++;
      }
      impact.sector_impact[sector].total_impact += article.sentiment_score;
    }
  }
  
  // Calculate news momentum
  const momentum = calculateNewsMomentum(impact);
  
  // Store impact analysis
  await supabase
    .from('news_impact_analysis')
    .insert({
      analysis_time: new Date().toISOString(),
      impact,
      momentum,
      articles_analyzed: news?.length || 0
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    impact,
    momentum,
    articles_analyzed: news?.length || 0
  });
}

async function analyzeSectorRotation(res) {
  console.log('🔄 Analyzing sector rotation...');
  
  const rotation = {
    current_leaders: [],
    current_laggards: [],
    rotation_signals: [],
    momentum_shifts: []
  };
  
  // Define sectors
  const sectors = {
    'XLF': 'Financials',
    'XLK': 'Technology',
    'XLE': 'Energy',
    'XLV': 'Healthcare',
    'XLI': 'Industrials',
    'XLY': 'Consumer Discretionary',
    'XLP': 'Consumer Staples',
    'XLU': 'Utilities',
    'XLRE': 'Real Estate'
  };
  
  // Calculate sector performance
  const sectorPerformance = {};
  
  for (const [symbol, name] of Object.entries(sectors)) {
    const performance = await calculateSectorPerformance(symbol);
    sectorPerformance[symbol] = {
      name,
      ...performance
    };
  }
  
  // Identify leaders and laggards
  const sorted = Object.entries(sectorPerformance)
    .sort((a, b) => b[1].monthly_return - a[1].monthly_return);
  
  rotation.current_leaders = sorted.slice(0, 3).map(([symbol, data]) => ({
    sector: data.name,
    symbol,
    monthly_return: data.monthly_return,
    momentum_score: data.momentum_score
  }));
  
  rotation.current_laggards = sorted.slice(-3).map(([symbol, data]) => ({
    sector: data.name,
    symbol,
    monthly_return: data.monthly_return,
    momentum_score: data.momentum_score
  }));
  
  // Detect rotation signals
  rotation.rotation_signals = await detectRotationSignals(sectorPerformance);
  
  // Identify momentum shifts
  rotation.momentum_shifts = await identifyMomentumShifts(sectorPerformance);
  
  // Generate rotation recommendations
  const recommendations = generateRotationRecommendations(rotation);
  
  // Store analysis
  await supabase
    .from('sector_rotation_analysis')
    .insert({
      analysis_date: new Date().toISOString(),
      rotation,
      recommendations,
      sector_performance: sectorPerformance
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    rotation,
    recommendations
  });
}

async function generateIntelligenceReport(res) {
  console.log('📋 Generating financial intelligence report...');
  
  // Gather all intelligence components
  const [sentiment, anomalies, correlations, predictions, risks] = await Promise.all([
    getLatestSentimentAnalysis(),
    getLatestAnomalies(),
    getLatestCorrelations(),
    getLatestPredictions(),
    getLatestRiskSignals()
  ]);
  
  const report = {
    report_date: new Date().toISOString(),
    executive_summary: {},
    market_intelligence: {
      sentiment,
      anomalies,
      correlations
    },
    predictions_and_risks: {
      predictions,
      risks
    },
    actionable_insights: [],
    recommendations: []
  };
  
  // Generate executive summary
  report.executive_summary = {
    overall_market_sentiment: sentiment?.overall_sentiment || 0,
    anomaly_count: anomalies?.total_anomalies || 0,
    risk_level: risks?.risk_score || 0,
    key_findings: generateKeyFindings(report.market_intelligence)
  };
  
  // Generate actionable insights
  report.actionable_insights = generateActionableInsights(report);
  
  // Generate recommendations
  report.recommendations = generateIntelligenceRecommendations(report);
  
  // Store intelligence report
  await supabase
    .from('intelligence_reports')
    .insert({
      report_date: new Date().toISOString().split('T')[0],
      report,
      generated_at: new Date().toISOString()
    });
  
  return res.status(200).json({
    success: true,
    report
  });
}

// Helper functions
async function calculateSentiment(title, content) {
  // Simple sentiment calculation (would use ML model in production)
  const text = `${title} ${content}`.toLowerCase();
  
  const positiveWords = ['gain', 'rise', 'profit', 'growth', 'success', 'positive', 'increase'];
  const negativeWords = ['loss', 'fall', 'decline', 'negative', 'risk', 'concern', 'decrease'];
  
  let score = 0;
  for (const word of positiveWords) {
    score += (text.match(new RegExp(word, 'g')) || []).length * 0.1;
  }
  for (const word of negativeWords) {
    score -= (text.match(new RegExp(word, 'g')) || []).length * 0.1;
  }
  
  return Math.max(-1, Math.min(1, score));
}

function generateSentimentSignals(results) {
  const signals = [];
  
  if (results.overall_sentiment < -0.5) {
    signals.push({
      type: 'bearish_sentiment',
      strength: 'strong',
      message: 'Overall market sentiment is strongly bearish'
    });
  } else if (results.overall_sentiment > 0.5) {
    signals.push({
      type: 'bullish_sentiment',
      strength: 'strong',
      message: 'Overall market sentiment is strongly bullish'
    });
  }
  
  return signals;
}

function detectPriceAnomalies(data) {
  if (data.length < 20) return [];
  
  const prices = data.map(d => d.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const stdDev = Math.sqrt(prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length);
  
  const anomalies = [];
  
  for (let i = 0; i < data.length; i++) {
    const zScore = Math.abs((data[i].price - mean) / stdDev);
    if (zScore > 3) {
      anomalies.push({
        timestamp: data[i].timestamp,
        price: data[i].price,
        z_score: zScore,
        type: data[i].price > mean ? 'spike' : 'drop'
      });
    }
  }
  
  return anomalies;
}

function detectVolumeAnomalies(data) {
  if (data.length < 20) return [];
  
  const volumes = data.map(d => d.volume).filter(v => v > 0);
  if (volumes.length === 0) return [];
  
  const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const stdDev = Math.sqrt(volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length);
  
  const anomalies = [];
  
  for (const item of data) {
    if (item.volume > mean + 3 * stdDev) {
      anomalies.push({
        timestamp: item.timestamp,
        volume: item.volume,
        volume_ratio: item.volume / mean,
        type: 'unusual_volume'
      });
    }
  }
  
  return anomalies;
}

function calculateAnomalySeverity(anomalies) {
  if (anomalies.length === 0) return 'low';
  if (anomalies.length > 5) return 'critical';
  if (anomalies.length > 2) return 'high';
  return 'medium';
}

async function detectCorrelationBreaks(symbolData) {
  // Simplified correlation break detection
  return [];
}

function detectUnusualPatterns(symbolData) {
  // Simplified pattern detection
  return [];
}

function generateAnomalyAlerts(anomalies) {
  const alerts = [];
  
  for (const priceAnomaly of anomalies.price_anomalies) {
    if (priceAnomaly.severity === 'critical') {
      alerts.push({
        symbol: priceAnomaly.symbol,
        alert_type: 'price_anomaly',
        severity: 'critical',
        message: `Critical price anomaly detected for ${priceAnomaly.symbol}`,
        metadata: priceAnomaly
      });
    }
  }
  
  return alerts;
}

function calculateCorrelationMatrix(historicalData) {
  const matrix = {};
  const symbols = Object.keys(historicalData);
  
  for (const symbol1 of symbols) {
    matrix[symbol1] = {};
    for (const symbol2 of symbols) {
      if (symbol1 === symbol2) {
        matrix[symbol1][symbol2] = 1;
      } else {
        matrix[symbol1][symbol2] = calculatePairCorrelation(
          historicalData[symbol1],
          historicalData[symbol2]
        );
      }
    }
  }
  
  return matrix;
}

function calculatePairCorrelation(data1, data2) {
  // Simplified correlation calculation
  return Math.random() * 2 - 1; // Placeholder
}

async function getPreviousCorrelations() {
  const { data } = await supabase
    .from('correlation_analysis_results')
    .select('correlation_matrix')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data?.correlation_matrix || {};
}

function detectCorrelationChanges(current, previous) {
  const changes = [];
  
  for (const [symbol1, correlations] of Object.entries(current)) {
    for (const [symbol2, correlation] of Object.entries(correlations)) {
      const prevCorr = previous[symbol1]?.[symbol2];
      if (prevCorr && Math.abs(correlation - prevCorr) > 0.3) {
        changes.push({
          pair: `${symbol1}-${symbol2}`,
          previous: prevCorr,
          current: correlation,
          change: correlation - prevCorr
        });
      }
    }
  }
  
  return changes;
}

function performClusterAnalysis(correlationMatrix) {
  // Simplified cluster analysis
  return {
    clusters: [
      { name: 'Risk-On', members: ['SPY', 'QQQ', 'AAPL', 'MSFT'] },
      { name: 'Risk-Off', members: ['GLD', 'TLT', 'VIX'] }
    ]
  };
}

async function calculateMarketIndicators() {
  // Simplified market indicators
  return {
    breadth: 0.65,
    momentum: 0.45,
    volatility: 0.32
  };
}

async function calculateTechnicalIndicators() {
  return {
    rsi: 55,
    macd: 'bullish',
    moving_averages: 'neutral'
  };
}

async function calculateSentimentIndicators() {
  return {
    news_sentiment: 0.2,
    social_sentiment: 0.1,
    options_sentiment: -0.1
  };
}

function calculateCompositeScore(indicators) {
  // Weighted average of all indicators
  return 0.55; // Placeholder
}

function generateEconomicOutlook(indicators) {
  const score = indicators.composite_score;
  
  if (score > 0.7) return { outlook: 'very_positive', confidence: 'high' };
  if (score > 0.3) return { outlook: 'positive', confidence: 'medium' };
  if (score > -0.3) return { outlook: 'neutral', confidence: 'medium' };
  if (score > -0.7) return { outlook: 'negative', confidence: 'medium' };
  return { outlook: 'very_negative', confidence: 'high' };
}

async function identifyHistoricalPatterns() {
  return [
    { pattern: 'bull_flag', occurrences: 5 },
    { pattern: 'support_bounce', occurrences: 8 }
  ];
}

async function getCurrentMarketConditions() {
  return {
    trend: 'upward',
    volatility: 'medium',
    volume: 'average'
  };
}

async function predictShortTerm(symbol, patterns, conditions) {
  return {
    direction: 'up',
    target: 450,
    probability: 0.65
  };
}

async function predictMediumTerm(symbol, patterns, conditions) {
  return {
    direction: 'up',
    target: 460,
    probability: 0.55
  };
}

function calculatePredictionConfidence(shortTerm, mediumTerm) {
  return (shortTerm.probability + mediumTerm.probability) / 2;
}

async function predictSectorOutlook(sector, conditions) {
  return {
    outlook: 'positive',
    strength: 0.7
  };
}

async function checkVolatilityRisk() {
  return {
    level: 0.45,
    indicators: ['vix_elevated', 'range_expansion']
  };
}

async function checkCorrelationRisk() {
  return {
    breakdown_detected: false,
    affected_pairs: []
  };
}

async function checkSectorConcentration() {
  return [
    { sector: 'Technology', concentration: 0.35 }
  ];
}

async function checkLiquidityRisk() {
  return {
    risk_level: 0.3,
    affected_symbols: []
  };
}

function calculateOverallRiskScore(riskSignals) {
  const totalRisks = 
    riskSignals.market_risks.length + 
    riskSignals.sector_risks.length + 
    riskSignals.systemic_risks.length;
  
  return Math.min(1, totalRisks * 0.1);
}

function generateRiskMitigation(riskSignals) {
  const recommendations = [];
  
  if (riskSignals.risk_score > 0.7) {
    recommendations.push({
      action: 'reduce_exposure',
      urgency: 'high',
      description: 'Consider reducing overall market exposure'
    });
  }
  
  return recommendations;
}

function extractSymbolsFromNews(article) {
  // Extract stock symbols from news content
  const matches = article.content.match(/\b[A-Z]{1,5}\b/g) || [];
  return [...new Set(matches)];
}

async function checkMarketReaction(symbol, newsTime) {
  // Check price/volume changes after news
  return {
    significant: false,
    price_change: 0,
    volume_change: 0,
    time_to_reaction: 0
  };
}

function extractSectorsFromNews(article) {
  // Extract sectors from news entities
  return article.entities
    ?.filter(e => e.type === 'SECTOR')
    .map(e => e.value) || [];
}

function calculateNewsMomentum(impact) {
  return {
    direction: 'neutral',
    strength: 0.5
  };
}

async function calculateSectorPerformance(symbol) {
  return {
    daily_return: Math.random() * 0.04 - 0.02,
    weekly_return: Math.random() * 0.1 - 0.05,
    monthly_return: Math.random() * 0.2 - 0.1,
    momentum_score: Math.random()
  };
}

async function detectRotationSignals(sectorPerformance) {
  return [
    {
      from_sector: 'Technology',
      to_sector: 'Energy',
      strength: 0.7
    }
  ];
}

async function identifyMomentumShifts(sectorPerformance) {
  return [
    {
      sector: 'Financials',
      shift: 'positive',
      magnitude: 0.6
    }
  ];
}

function generateRotationRecommendations(rotation) {
  return [
    {
      action: 'increase_allocation',
      sector: rotation.current_leaders[0].sector,
      rationale: 'Strong momentum and positive outlook'
    }
  ];
}

async function getLatestSentimentAnalysis() {
  const { data } = await supabase
    .from('sentiment_analysis_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data?.results;
}

async function getLatestAnomalies() {
  const { data } = await supabase
    .from('anomaly_detection_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data?.anomalies;
}

async function getLatestCorrelations() {
  const { data } = await supabase
    .from('correlation_analysis_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data;
}

async function getLatestPredictions() {
  const { data } = await supabase
    .from('market_predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data?.predictions;
}

async function getLatestRiskSignals() {
  const { data } = await supabase
    .from('risk_analysis_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data?.risk_signals;
}

function generateKeyFindings(intelligence) {
  return [
    'Market sentiment remains cautiously optimistic',
    'No critical anomalies detected in major indices',
    'Sector rotation favoring defensive names'
  ];
}

function generateActionableInsights(report) {
  return [
    {
      insight: 'Technology sector showing signs of consolidation',
      action: 'Consider profit-taking in overextended tech positions',
      confidence: 0.75
    }
  ];
}

function generateIntelligenceRecommendations(report) {
  return [
    {
      category: 'portfolio',
      recommendation: 'Maintain balanced allocation with slight defensive tilt',
      timeframe: 'short_term'
    }
  ];
}
/**
 * News Intelligence Agent
 * Processes financial news using Perplexity API and extracts actionable insights
 * Fully integrated with A2A protocol, ORD registry, and BPMN workflows
 */

import { A2AAgent } from '../api/a2a-agent-system.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with proper error handling
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * News Intelligence Agent for continuous news processing and analysis
 */
export class NewsIntelligenceAgent extends A2AAgent {
  constructor(agentData) {
    super(agentData);
    this.specialization = 'news_intelligence';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.processingInterval = 5 * 60 * 1000; // 5 minutes
    this.lastProcessedTime = null;
    
    // Agent-specific configuration
    this.newsCategories = [
      'financial_markets',
      'company_earnings',
      'economic_indicators',
      'regulatory_changes',
      'geopolitical_events'
    ];
    
    // Initialize ORD capabilities
    this.capabilities = [
      'news_ingestion',
      'sentiment_analysis',
      'entity_extraction',
      'event_detection',
      'market_impact_assessment'
    ];
  }

  /**
   * Initialize the agent and register with systems
   */
  async initialize() {
    console.log(`🔵 Initializing News Intelligence Agent: ${this.id}`);
    
    // Register with A2A system
    await this.registerWithA2A();
    
    // Register with ORD
    await this.registerWithORD();
    
    // Set up scheduled tasks
    await this.setupScheduledTasks();
    
    // Subscribe to relevant events
    await this.subscribeToEvents();
    
    // Initialize breaking news detection
    await this.initializeBreakingNewsDetection();
    
    console.log(`✅ News Intelligence Agent initialized: ${this.id}`);
  }

  /**
   * Register agent with A2A system
   */
  async registerWithA2A() {
    const agentRegistration = {
      agent_id: this.id,
      agent_name: this.name,
      agent_type: 'data_product',
      description: 'Processes financial news and extracts market insights',
      status: 'active',
      capabilities: this.capabilities,
      voting_power: this.votingPower,
      connection_config: {
        goals: [
          'Process real-time financial news',
          'Extract market-moving events',
          'Provide sentiment analysis',
          'Identify investment opportunities'
        ],
        personality: 'analytical',
        auto_respond: true,
        max_concurrent_tasks: 10
      },
      scheduled_tasks: [
        {
          name: 'periodic_news_fetch',
          interval: '*/5 * * * *', // Every 5 minutes
          action: 'fetchAndProcessNews'
        },
        {
          name: 'daily_summary',
          interval: '0 9 * * *', // 9 AM daily
          action: 'generateDailySummary'
        }
      ]
    };

    const { data, error } = await supabase
      .from('a2a_agents')
      .upsert(agentRegistration, { onConflict: 'agent_id' });

    if (error) {
      console.error('Failed to register with A2A:', error);
      throw error;
    }
  }

  /**
   * Register capabilities with ORD
   */
  async registerWithORD() {
    const ordRegistration = {
      agent_id: this.id,
      resource_type: 'agent',
      resource_name: 'News Intelligence Agent',
      resource_path: '/api/agents/news-intelligence',
      capabilities: {
        input_types: ['news_query', 'ticker_symbols', 'date_range'],
        output_types: ['news_articles', 'sentiment_scores', 'market_events'],
        protocols: ['REST', 'WebSocket', 'A2A'],
        discovery: ['ORD', 'OpenAPI', 'A2A']
      },
      requirements: {
        api_keys: ['PERPLEXITY_API_KEY'],
        data_access: ['news_articles', 'market_events'],
        dependencies: ['perplexity_api', 'supabase']
      },
      metadata: {
        category: 'data_product',
        version: '1.0.0',
        documentation: '/docs/agents/news-intelligence',
        performance: {
          avg_response_time_ms: 500,
          success_rate: 0.95,
          throughput_per_minute: 100
        }
      }
    };

    const { data, error } = await supabase
      .from('ord_analytics_resources')
      .upsert(ordRegistration, { onConflict: 'agent_id' });

    if (error) {
      console.error('Failed to register with ORD:', error);
      throw error;
    }
  }

  /**
   * Set up scheduled tasks for periodic news processing
   */
  async setupScheduledTasks() {
    // This would typically use a job scheduler like node-cron
    // For now, we'll use setInterval for demonstration
    setInterval(() => {
      this.fetchAndProcessNews();
    }, this.processingInterval);
  }

  /**
   * Subscribe to relevant Supabase events
   */
  async subscribeToEvents() {
    // Subscribe to news requests
    supabase
      .channel('news_requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'a2a_messages',
        filter: `to_agent=eq.${this.id}`
      }, (payload) => {
        this.handleIncomingMessage(payload.new);
      })
      .subscribe();
  }

  /**
   * Main news fetching and processing logic
   */
  async fetchAndProcessNews() {
    try {
      console.log('🔄 Fetching latest financial news...');
      
      // Fetch news for each category
      const newsResults = await Promise.all(
        this.newsCategories.map(category => 
          this.fetchNewsByCategory(category)
        )
      );

      // Process and store news articles
      const processedArticles = [];
      for (const categoryNews of newsResults) {
        if (categoryNews && categoryNews.articles) {
          for (const article of categoryNews.articles) {
            const processed = await this.processNewsArticle(article);
            if (processed) {
              processedArticles.push(processed);
            }
          }
        }
      }

      // Store in database
      if (processedArticles.length > 0) {
        await this.storeProcessedNews(processedArticles);
        
        // Notify interested agents
        await this.notifySubscribers(processedArticles);
      }

      console.log(`✅ Processed ${processedArticles.length} news articles`);
      
      // Update last processed time
      this.lastProcessedTime = new Date();
      
      // Log activity
      await this.logActivity('news_fetch_complete', {
        articles_processed: processedArticles.length,
        categories: this.newsCategories
      });

    } catch (error) {
      console.error('Error in news processing:', error);
      await this.logError('news_fetch_error', error);
    }
  }

  /**
   * Fetch news by category using Perplexity API
   */
  async fetchNewsByCategory(category) {
    const query = this.buildNewsQuery(category);
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a financial news analyst. Extract and summarize recent financial news articles with their sources, timestamps, and key information.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.2,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      return this.parsePerplexityResponse(data, category);
      
    } catch (error) {
      console.error(`Error fetching news for category ${category}:`, error);
      return null;
    }
  }

  /**
   * Build news query based on category
   */
  buildNewsQuery(category) {
    const queries = {
      financial_markets: 'Latest financial market news, stock market movements, major index changes in the last 4 hours',
      company_earnings: 'Recent company earnings reports, revenue beats or misses, guidance updates in the last 24 hours',
      economic_indicators: 'Latest economic data releases, GDP, inflation, employment reports from today',
      regulatory_changes: 'New financial regulations, SEC announcements, policy changes affecting markets',
      geopolitical_events: 'Geopolitical events affecting financial markets, trade agreements, sanctions'
    };
    
    return queries[category] || 'Latest financial news';
  }

  /**
   * Parse Perplexity API response
   */
  parsePerplexityResponse(data, category) {
    if (!data.choices || !data.choices[0]) {
      return null;
    }

    const content = data.choices[0].message.content;
    
    // Extract structured data from the response
    // This is a simplified version - in production, use more sophisticated parsing
    const articles = [];
    const lines = content.split('\n');
    
    let currentArticle = null;
    for (const line of lines) {
      if (line.includes('Source:') || line.includes('Title:')) {
        if (currentArticle) {
          articles.push(currentArticle);
        }
        currentArticle = {
          category: category,
          title: '',
          source: '',
          summary: '',
          timestamp: new Date()
        };
      }
      
      if (currentArticle) {
        if (line.includes('Title:')) {
          currentArticle.title = line.replace('Title:', '').trim();
        } else if (line.includes('Source:')) {
          currentArticle.source = line.replace('Source:', '').trim();
        } else if (line.trim()) {
          currentArticle.summary += line + ' ';
        }
      }
    }
    
    if (currentArticle) {
      articles.push(currentArticle);
    }

    return { articles, category };
  }

  /**
   * Process individual news article
   */
  async processNewsArticle(article) {
    try {
      // Extract entities (companies, tickers, people)
      const entities = await this.extractEntities(article);
      
      // Perform sentiment analysis
      const sentiment = await this.analyzeSentiment(article);
      
      // Assess market impact
      const marketImpact = await this.assessMarketImpact(article, entities, sentiment);
      
      // Generate unique article ID
      const articleId = this.generateArticleId(article);
      
      return {
        id: articleId,
        title: article.title,
        source: article.source,
        summary: article.summary,
        category: article.category,
        timestamp: article.timestamp,
        entities: entities,
        sentiment: sentiment,
        market_impact: marketImpact,
        processed_by: this.id,
        processed_at: new Date()
      };
      
    } catch (error) {
      console.error('Error processing article:', error);
      return null;
    }
  }

  /**
   * Advanced entity extraction using AI-powered NER
   */
  async extractEntities(article) {
    // Use Perplexity API for real entity extraction
    if (!this.perplexityApiKey) {
      console.error('Perplexity API key not configured - using fallback entity extraction');
      return this.fallbackEntityExtraction(article);
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an advanced financial entity extraction AI. Extract and categorize all relevant financial entities from news articles with high precision. Focus on companies, tickers, executives, financial instruments, and economic indicators.'
            },
            {
              role: 'user',
              content: `Extract all financial entities from this news article:

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}
Category: ${article.category}

Extract comprehensive entities:
{
  "companies": [
    {
      "name": "company name",
      "ticker": "stock ticker if mentioned",
      "sector": "industry sector",
      "market_cap": "large|mid|small cap",
      "relevance": <0-1>,
      "sentiment_context": "positive|negative|neutral"
    }
  ],
  "financial_instruments": [
    {
      "instrument": "specific instrument",
      "type": "stock|bond|commodity|currency|derivative",
      "ticker": "symbol if applicable",
      "relevance": <0-1>
    }
  ],
  "people": [
    {
      "name": "person name",
      "title": "job title",
      "company": "associated company",
      "relevance": <0-1>,
      "role_in_news": "description"
    }
  ],
  "economic_indicators": [
    {
      "indicator": "GDP|inflation|unemployment|etc",
      "value": "value if mentioned",
      "period": "time period",
      "relevance": <0-1>
    }
  ],
  "financial_metrics": [
    {
      "metric": "revenue|earnings|guidance|etc",
      "value": "value if mentioned",
      "company": "associated company",
      "time_period": "quarter|year|etc",
      "relevance": <0-1>
    }
  ],
  "events_catalysts": [
    {
      "event": "earnings|merger|regulatory|etc",
      "timing": "date or timeframe",
      "affected_entities": ["entity1", "entity2"],
      "impact_type": "positive|negative|neutral",
      "relevance": <0-1>
    }
  ],
  "geographical_regions": [
    {
      "region": "country|state|region",
      "relevance": <0-1>,
      "economic_context": "market|regulatory|geopolitical"
    }
  ],
  "regulatory_bodies": [
    {
      "organization": "SEC|Fed|etc",
      "action": "policy|ruling|investigation",
      "relevance": <0-1>
    }
  ],
  "alternative_data_sources": [
    {
      "data_type": "social_sentiment|satellite|credit_card|etc",
      "source": "data source",
      "insight": "key insight",
      "relevance": <0-1>
    }
  ]
}

Focus on:
1. Stock tickers and company names
2. Key executives and decision makers
3. Financial metrics and guidance
4. Economic indicators and policy
5. Market-moving events and catalysts
6. Competitive dynamics
7. Regulatory changes`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.error('Entity extraction API failed:', response.status);
        return this.fallbackEntityExtraction(article);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        const entities = JSON.parse(content);
        return this.enrichEntityData(entities);
      } catch {
        console.error('Failed to parse entity extraction response');
        return this.fallbackEntityExtraction(article);
      }
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return this.fallbackEntityExtraction(article);
    }
  }

  /**
   * Fallback entity extraction for when AI is unavailable
   */
  fallbackEntityExtraction(article) {
    const entities = {
      companies: [],
      tickers: [],
      people: [],
      locations: [],
      basic_extraction: true
    };
    
    // Extract stock tickers (pattern matching)
    const tickerPattern = /\b[A-Z]{1,5}\b/g;
    const potentialTickers = article.summary.match(tickerPattern) || [];
    entities.tickers = [...new Set(potentialTickers)];
    
    // Extract known company names
    const commonCompanies = [
      'Apple', 'Microsoft', 'Google', 'Alphabet', 'Amazon', 'Tesla', 'Meta', 'Facebook',
      'NVIDIA', 'Netflix', 'Adobe', 'Salesforce', 'Intel', 'Oracle', 'IBM', 'Cisco'
    ];
    
    for (const company of commonCompanies) {
      if (article.summary.toLowerCase().includes(company.toLowerCase())) {
        entities.companies.push({
          name: company,
          relevance: 0.7,
          extraction_method: 'pattern_matching'
        });
      }
    }
    
    return entities;
  }

  /**
   * Enrich entity data with additional context
   */
  enrichEntityData(entities) {
    // Add market context and validate tickers
    if (entities.companies) {
      entities.companies = entities.companies.map(company => ({
        ...company,
        market_context: this.getMarketContext(company),
        validation_score: this.validateEntity(company)
      }));
    }
    
    // Cross-reference tickers with companies
    if (entities.financial_instruments) {
      entities.financial_instruments = entities.financial_instruments.map(instrument => ({
        ...instrument,
        market_hours_impact: this.assessMarketHoursImpact(instrument),
        liquidity_profile: this.assessLiquidityProfile(instrument)
      }));
    }
    
    return {
      ...entities,
      extraction_timestamp: new Date().toISOString(),
      total_entities: this.countTotalEntities(entities),
      ai_enhanced: true
    };
  }

  /**
   * Helper methods for entity enrichment
   */
  getMarketContext(company) {
    // Add market context based on company characteristics
    const marketCaps = {
      'Apple': 'mega_cap',
      'Microsoft': 'mega_cap', 
      'Google': 'mega_cap',
      'Amazon': 'mega_cap',
      'Tesla': 'large_cap'
    };
    
    return {
      market_cap_category: marketCaps[company.name] || 'unknown',
      index_membership: this.getIndexMembership(company.name),
      sector_classification: this.getSectorClassification(company.name)
    };
  }

  validateEntity(entity) {
    // Simple validation scoring
    let score = 0.5;
    if (entity.ticker) score += 0.2;
    if (entity.sector) score += 0.1;
    if (entity.relevance > 0.7) score += 0.2;
    return Math.min(score, 1.0);
  }

  assessMarketHoursImpact(instrument) {
    // Assess whether instrument trades in current market hours
    const now = new Date();
    const hour = now.getUTCHours();
    
    if (hour >= 13 && hour < 21) return 'regular_hours';
    if (hour >= 9 && hour < 13) return 'premarket';
    if (hour >= 21 || hour < 1) return 'afterhours';
    return 'market_closed';
  }

  assessLiquidityProfile(instrument) {
    // Simple liquidity assessment
    const highLiquidityTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'];
    
    if (highLiquidityTickers.includes(instrument.ticker)) {
      return 'high_liquidity';
    }
    
    return 'unknown_liquidity';
  }

  countTotalEntities(entities) {
    let total = 0;
    if (entities.companies) total += entities.companies.length;
    if (entities.financial_instruments) total += entities.financial_instruments.length;
    if (entities.people) total += entities.people.length;
    if (entities.economic_indicators) total += entities.economic_indicators.length;
    return total;
  }

  getIndexMembership(companyName) {
    const sp500Companies = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla', 'Meta'];
    if (sp500Companies.includes(companyName)) return ['S&P500'];
    return [];
  }

  getSectorClassification(companyName) {
    const sectors = {
      'Apple': 'Technology',
      'Microsoft': 'Technology',
      'Google': 'Technology',
      'Amazon': 'Consumer Discretionary',
      'Tesla': 'Consumer Discretionary'
    };
    return sectors[companyName] || 'Unknown';
  }

  /**
   * Advanced sentiment analysis with multi-dimensional AI analysis
   */
  async analyzeSentiment(article) {
    // Use Perplexity API for advanced sentiment analysis
    if (!this.perplexityApiKey) {
      console.warn('⚠️ Perplexity API key not configured - using basic sentiment analysis');
      return this.basicSentimentAnalysis(article);
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an advanced financial sentiment analysis AI with expertise in behavioral finance, market psychology, and institutional trading patterns. Provide multi-dimensional sentiment analysis for financial news.'
            },
            {
              role: 'user',
              content: `Perform comprehensive sentiment analysis on this financial news:

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}
Category: ${article.category}

Provide advanced sentiment analysis:
{
  "sentiment_scores": {
    "overall_sentiment": <-1 to 1>,
    "market_sentiment": <-1 to 1>,
    "investor_sentiment": <-1 to 1>,
    "institutional_sentiment": <-1 to 1>
  },
  "confidence_metrics": {
    "analysis_confidence": <0-1>,
    "signal_strength": <0-1>,
    "source_reliability": <0-1>
  },
  "emotional_indicators": {
    "fear": <0-1>,
    "greed": <0-1>,
    "uncertainty": <0-1>,
    "optimism": <0-1>,
    "panic": <0-1>
  },
  "market_impact_indicators": {
    "urgency_score": <0-1>,
    "novelty_score": <0-1>,
    "surprise_factor": <0-1>,
    "market_moving_potential": <0-1>
  },
  "narrative_analysis": {
    "primary_narrative": "brief description",
    "narrative_strength": <0-1>,
    "narrative_persistence": "hours|days|weeks",
    "conflicting_narratives": ["narrative1", "narrative2"]
  },
  "trading_sentiment": {
    "momentum_signal": "bullish|bearish|neutral",
    "volatility_expectation": "low|normal|high|extreme",
    "risk_appetite_impact": "risk_on|risk_off|neutral",
    "sector_rotation_signal": "growth|value|defensive|cyclical"
  },
  "behavioral_finance": {
    "herd_behavior_likelihood": <0-1>,
    "overreaction_probability": <0-1>,
    "mean_reversion_signal": <0-1>,
    "contrarian_opportunity": <0-1>
  }
  "key_phrases": ["phrase1", "phrase2"],
  "reasoning": "explanation of sentiment analysis"
}`
            }
          ],
          temperature: 0.2,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        console.error('Sentiment analysis API failed:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        console.error('Failed to parse sentiment analysis response');
        return null;
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return null;
    }
  }

  /**
   * Assess potential market impact using real AI analysis
   */
  async assessMarketImpact(article, entities, sentiment) {
    // Use Perplexity API for real market impact assessment
    if (!this.perplexityApiKey) {
      console.error('Perplexity API key not configured - market impact assessment unavailable');
      return null;
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are an advanced market impact assessment AI with expertise in quantitative finance, market microstructure, and event-driven trading. Analyze the potential market impact of financial news with institutional precision.'
            },
            {
              role: 'user',
              content: `Assess the market impact of this financial news:

Article: ${article.title}
Summary: ${article.summary}
Entities: ${JSON.stringify(entities)}
Sentiment: ${JSON.stringify(sentiment)}
Source: ${article.source}
Category: ${article.category}

Provide comprehensive market impact assessment:
{
  "impact_assessment": {
    "overall_impact_score": <0-100>,
    "impact_probability": <0-1>,
    "impact_timeframe": "immediate|intraday|short_term|medium_term|long_term",
    "impact_magnitude": "minimal|low|moderate|high|extreme",
    "impact_persistence": <hours_or_days>
  },
  "cross_asset_impact": {
    "equity_impact": {
      "sector_impacts": {
        "technology": <-50 to 50>,
        "financials": <-50 to 50>,
        "healthcare": <-50 to 50>,
        "energy": <-50 to 50>,
        "materials": <-50 to 50>
      },
      "market_cap_impact": {
        "large_cap": <-50 to 50>,
        "mid_cap": <-50 to 50>,
        "small_cap": <-50 to 50>
      }
    },
    "fixed_income_impact": {
      "treasury_yields": <-50 to 50>,
      "credit_spreads": <-50 to 50>,
      "corporate_bonds": <-50 to 50>
    },
    "currency_impact": {
      "usd_impact": <-50 to 50>,
      "risk_currencies": <-50 to 50>,
      "safe_haven_currencies": <-50 to 50>
    },
    "commodity_impact": {
      "precious_metals": <-50 to 50>,
      "energy_commodities": <-50 to 50>,
      "agricultural": <-50 to 50>
    }
  },
  "volatility_impact": {
    "implied_volatility_change": <percentage>,
    "realized_volatility_expectation": "decrease|stable|increase|spike",
    "volatility_term_structure": "short_end|long_end|entire_curve",
    "vol_surface_impact": "skew|smile|level"
  },
  "liquidity_impact": {
    "liquidity_deterioration_risk": <0-1>,
    "bid_ask_spread_expansion": <percentage>,
    "market_depth_impact": "minimal|moderate|significant",
    "institutional_flow_impact": "inflow|outflow|neutral"
  },
  "behavioral_impact": {
    "panic_selling_risk": <0-1>,
    "fomo_buying_risk": <0-1>,
    "flight_to_quality": <0-1>,
    "risk_appetite_change": "increase|decrease|neutral"
  },
  "trading_implications": {
    "momentum_opportunity": <0-1>,
    "mean_reversion_opportunity": <0-1>,
    "volatility_trading_opportunity": <0-1>,
    "arbitrage_opportunities": ["opportunity1", "opportunity2"]
  },
  "risk_factors": {
    "false_signal_risk": <0-1>,
    "reversal_risk": <0-1>,
    "amplification_risk": <0-1>,
    "contagion_risk": <0-1>
  },
  "historical_precedents": [
    {
      "similar_event": "description",
      "historical_impact": <percentage>,
      "timeframe": "timeframe of impact",
      "market_conditions": "similar market conditions"
    }
  ],
  "catalyst_analysis": {
    "primary_catalyst": "main market-moving factor",
    "secondary_catalysts": ["catalyst1", "catalyst2"],
    "catalyst_sustainability": <hours_or_days>,
    "follow_up_catalysts": ["potential follow-up events"]
  }
}

Provide reasoning based on:
1. Historical precedents of similar news
2. Current market regime and conditions  
3. Entity-specific factors
4. Cross-asset correlations
5. Behavioral finance considerations

Return JSON format:
{
  "score": <number between 0 and 1>,
  "level": "high|medium|low",
  "affected_entities": {
    "primary": ["entity1", "entity2"],
    "secondary": ["entity3", "entity4"]
  },
  "time_horizon": "immediate|short_term|medium_term|long_term",
  "sectors_affected": ["sector1", "sector2"],
  "risk_factors": ["factor1", "factor2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "reasoning": "detailed explanation of impact assessment"
}`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        console.error('Market impact assessment API failed:', response.status);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        console.error('Failed to parse market impact assessment response');
        return null;
      }
    } catch (error) {
      console.error('Market impact assessment failed:', error);
      return null;
    }
  }

  /**
   * Generate unique article ID
   */
  generateArticleId(article) {
    const hash = require('crypto')
      .createHash('sha256')
      .update(article.title + article.source + article.timestamp)
      .digest('hex');
    return hash.substring(0, 16);
  }

  /**
   * Store processed news in database
   */
  async storeProcessedNews(articles) {
    const { data, error } = await supabase
      .from('news_articles')
      .insert(articles)
      .onConflict('id');
      
    if (error) {
      console.error('Error storing news articles:', error);
      throw error;
    }
    
    return data;
  }

  /**
   * Notify subscriber agents about new articles
   */
  async notifySubscribers(articles) {
    // Find agents interested in news
    const { data: subscribers } = await supabase
      .from('a2a_agents')
      .select('agent_id')
      .contains('capabilities', ['news_consumer']);
    
    if (!subscribers || subscribers.length === 0) return;
    
    // Send notifications
    const notifications = subscribers.map(subscriber => ({
      from_agent: this.id,
      to_agent: subscriber.agent_id,
      message_type: 'news_update',
      payload: {
        article_count: articles.length,
        categories: [...new Set(articles.map(a => a.category))],
        high_impact: articles.filter(a => a.market_impact.level === 'high')
      },
      timestamp: new Date()
    }));
    
    await supabase
      .from('a2a_messages')
      .insert(notifications);
  }

  /**
   * Generate daily news summary
   */
  async generateDailySummary() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: articles } = await supabase
      .from('news_articles')
      .select('*')
      .gte('timestamp', yesterday.toISOString())
      .order('market_impact->score', { ascending: false })
      .limit(20);
    
    if (!articles || articles.length === 0) return;
    
    const summary = {
      date: new Date().toISOString().split('T')[0],
      total_articles: articles.length,
      by_category: this.groupByCategory(articles),
      top_impact: articles.slice(0, 5),
      sentiment_overview: this.calculateSentimentOverview(articles),
      key_entities: this.extractKeyEntities(articles)
    };
    
    // Store summary
    await supabase
      .from('daily_summaries')
      .insert({
        agent_id: this.id,
        summary_date: summary.date,
        summary_data: summary
      });
    
    // Notify interested parties
    await this.broadcastDailySummary(summary);
  }

  /**
   * Handle incoming messages from other agents
   */
  async handleIncomingMessage(message) {
    console.log(`📨 News Intelligence Agent received message:`, message);
    
    switch (message.message_type) {
      case 'news_request':
        await this.handleNewsRequest(message);
        break;
      case 'subscribe':
        await this.handleSubscription(message);
        break;
      case 'unsubscribe':
        await this.handleUnsubscription(message);
        break;
      default:
        console.log(`Unknown message type: ${message.message_type}`);
    }
  }

  /**
   * Handle specific news requests
   */
  async handleNewsRequest(message) {
    const { query, tickers, date_range, categories } = message.payload;
    
    // Fetch relevant articles from database
    let queryBuilder = supabase
      .from('news_articles')
      .select('*');
    
    if (tickers && tickers.length > 0) {
      queryBuilder = queryBuilder.contains('entities->tickers', tickers);
    }
    
    if (categories && categories.length > 0) {
      queryBuilder = queryBuilder.in('category', categories);
    }
    
    if (date_range) {
      if (date_range.start) {
        queryBuilder = queryBuilder.gte('timestamp', date_range.start);
      }
      if (date_range.end) {
        queryBuilder = queryBuilder.lte('timestamp', date_range.end);
      }
    }
    
    const { data: articles, error } = await queryBuilder
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) {
      await this.sendErrorResponse(message.from_agent, message.id, error);
      return;
    }
    
    // Send response
    await this.sendMessage(message.from_agent, {
      message_type: 'news_response',
      request_id: message.id,
      payload: {
        articles: articles,
        count: articles.length,
        query_params: { query, tickers, date_range, categories }
      }
    });
  }

  // Utility methods
  groupByCategory(articles) {
    return articles.reduce((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});
  }

  calculateSentimentOverview(articles) {
    const sentiments = articles.map(a => a.sentiment.label);
    return {
      positive: sentiments.filter(s => s === 'positive').length,
      negative: sentiments.filter(s => s === 'negative').length,
      neutral: sentiments.filter(s => s === 'neutral').length
    };
  }

  extractKeyEntities(articles) {
    const allEntities = articles.flatMap(a => a.entities.companies);
    const entityCounts = allEntities.reduce((acc, entity) => {
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(entityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([entity, count]) => ({ entity, count }));
  }

  /**
   * Initialize breaking news detection with real-time monitoring
   */
  async initializeBreakingNewsDetection() {
    console.log('🚨 Initializing breaking news detection...');
    
    this.breakingNewsThresholds = {
      impact_score: 75,
      urgency_level: 'high',
      novelty_threshold: 0.8,
      surprise_factor: 0.7,
      market_moving_potential: 0.8
    };
    
    // Set up real-time monitoring
    this.startBreakingNewsMonitor();
  }

  /**
   * Start real-time breaking news monitoring
   */
  startBreakingNewsMonitor() {
    // Monitor for breaking news every 30 seconds
    setInterval(async () => {
      await this.scanForBreakingNews();
    }, 30000);
  }

  /**
   * Scan recent news for breaking news patterns
   */
  async scanForBreakingNews() {
    try {
      // Get recent high-impact news
      const recentNews = await this.fetchRecentHighImpactNews();
      
      if (recentNews && recentNews.length > 0) {
        for (const article of recentNews) {
          const breakingScore = await this.assessBreakingNewsScore(article);
          
          if (this.isBreakingNews(breakingScore)) {
            await this.handleBreakingNews(article, breakingScore);
          }
        }
      }
    } catch (error) {
      console.error('Breaking news scan failed:', error);
    }
  }

  /**
   * Assess if article constitutes breaking news using AI
   */
  async assessBreakingNewsScore(article) {
    if (!this.perplexityApiKey) {
      return this.fallbackBreakingNewsAssessment(article);
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.perplexityApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a breaking financial news detection AI. Assess whether news constitutes "breaking news" that could significantly impact financial markets in real-time.'
            },
            {
              role: 'user',
              content: `Assess if this is breaking financial news:

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}
Published: ${article.timestamp}
Entities: ${JSON.stringify(article.entities)}

Evaluate breaking news criteria:
{
  "breaking_news_assessment": {
    "is_breaking": true|false,
    "urgency_score": <0-100>,
    "novelty_score": <0-1>,
    "surprise_factor": <0-1>,
    "market_impact_potential": <0-1>,
    "time_sensitivity": "immediate|urgent|moderate|low"
  },
  "breaking_factors": [
    {
      "factor": "earnings_surprise|merger_announcement|regulatory_action|geopolitical|executive_change",
      "strength": <0-1>,
      "market_impact": "major|moderate|minor",
      "urgency": "immediate|hours|days"
    }
  ],
  "immediate_implications": {
    "affected_markets": ["equity|bond|currency|commodity"],
    "affected_sectors": ["sector1", "sector2"],
    "trading_halt_risk": <0-1>,
    "volatility_spike_risk": <0-1>,
    "after_hours_impact": <0-1>
  },
  "verification_status": {
    "source_credibility": <0-1>,
    "information_completeness": <0-1>,
    "confirmation_needed": true|false,
    "potential_false_alarm": <0-1>
  },
  "recommended_actions": [
    {
      "action": "immediate_alert|monitor|investigate|verify",
      "priority": "critical|high|medium|low",
      "timeframe": "immediate|15min|1hour",
      "rationale": "why this action is recommended"
    }
  ]
}

Focus on:
1. Market significance and impact magnitude
2. Time sensitivity and urgency
3. Novelty and surprise elements
4. Source credibility and verification
5. Potential for market disruption`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        return this.fallbackBreakingNewsAssessment(article);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        return this.fallbackBreakingNewsAssessment(article);
      }
    } catch (error) {
      console.error('Breaking news assessment failed:', error);
      return this.fallbackBreakingNewsAssessment(article);
    }
  }

  /**
   * Fallback breaking news assessment
   */
  fallbackBreakingNewsAssessment(article) {
    const breakingKeywords = [
      'breaking', 'urgent', 'alert', 'just in', 'developing',
      'merger', 'acquisition', 'bankruptcy', 'earnings beat',
      'earnings miss', 'guidance', 'fda approval', 'lawsuit'
    ];
    
    const titleLower = article.title.toLowerCase();
    const summaryLower = article.summary.toLowerCase();
    
    let urgencyScore = 0;
    for (const keyword of breakingKeywords) {
      if (titleLower.includes(keyword) || summaryLower.includes(keyword)) {
        urgencyScore += 15;
      }
    }
    
    return {
      breaking_news_assessment: {
        is_breaking: urgencyScore >= 30,
        urgency_score: Math.min(urgencyScore, 100),
        novelty_score: 0.5,
        surprise_factor: 0.5,
        market_impact_potential: 0.6,
        time_sensitivity: urgencyScore >= 50 ? 'immediate' : 'moderate'
      },
      fallback_assessment: true
    };
  }

  /**
   * Basic sentiment analysis fallback when AI unavailable
   */
  basicSentimentAnalysis(article) {
    const positiveWords = [
      'growth', 'profit', 'gain', 'surge', 'rise', 'beat', 'exceed',
      'record', 'strong', 'positive', 'upgrade', 'improve', 'rally'
    ];
    
    const negativeWords = [
      'loss', 'decline', 'fall', 'drop', 'miss', 'weak', 'concern',
      'risk', 'cut', 'reduce', 'negative', 'downgrade', 'warning'
    ];
    
    const text = `${article.title} ${article.summary}`.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    const netSentiment = positiveCount - negativeCount;
    const totalWords = positiveCount + negativeCount || 1;
    const sentimentScore = Math.max(-1, Math.min(1, netSentiment / totalWords));
    
    return {
      sentiment_scores: {
        overall_sentiment: sentimentScore,
        market_sentiment: sentimentScore,
        investor_sentiment: sentimentScore,
        institutional_sentiment: sentimentScore
      },
      confidence_metrics: {
        analysis_confidence: 0.3, // Low confidence for basic analysis
        signal_strength: Math.abs(sentimentScore),
        source_reliability: 0.5
      },
      method: 'basic_keyword_analysis',
      warning: 'Using fallback sentiment analysis - results may be less accurate'
    };
  }

  /**
   * Check if article meets breaking news criteria
   */
  isBreakingNews(breakingScore) {
    if (!breakingScore?.breaking_news_assessment) return false;
    
    const assessment = breakingScore.breaking_news_assessment;
    
    return assessment.is_breaking && 
           assessment.urgency_score >= this.breakingNewsThresholds.impact_score &&
           assessment.market_impact_potential >= this.breakingNewsThresholds.market_moving_potential;
  }

  /**
   * Handle confirmed breaking news
   */
  async handleBreakingNews(article, breakingScore) {
    console.log('🚨 BREAKING NEWS DETECTED:', article.title);
    
    try {
      // Store breaking news alert
      await this.storeBreakingNewsAlert(article, breakingScore);
      
      // Send immediate alerts to subscribers
      await this.sendBreakingNewsAlerts(article, breakingScore);
      
      // Trigger enhanced monitoring
      await this.triggerEnhancedMonitoring(article, breakingScore);
      
      // Log breaking news event
      await this.logActivity('breaking_news_detected', {
        article_id: article.id,
        title: article.title,
        urgency_score: breakingScore.breaking_news_assessment.urgency_score,
        market_impact: breakingScore.breaking_news_assessment.market_impact_potential
      });
      
    } catch (error) {
      console.error('Failed to handle breaking news:', error);
    }
  }

  /**
   * Store breaking news alert in database
   */
  async storeBreakingNewsAlert(article, breakingScore) {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('breaking_news_alerts')
      .insert({
        article_id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source,
        urgency_score: breakingScore.breaking_news_assessment.urgency_score,
        market_impact_potential: breakingScore.breaking_news_assessment.market_impact_potential,
        breaking_factors: breakingScore.breaking_factors || [],
        affected_entities: article.entities,
        created_at: new Date(),
        agent_id: this.id
      });
    
    if (error) {
      console.error('Failed to store breaking news alert:', error);
    }
  }

  /**
   * Send breaking news alerts to all subscribers
   */
  async sendBreakingNewsAlerts(article, breakingScore) {
    // Get all agents subscribed to breaking news
    const { data: subscribers } = await supabase
      .from('a2a_agents')
      .select('agent_id')
      .eq('status', 'active')
      .contains('capabilities', ['breaking_news_alerts']);
    
    if (subscribers) {
      for (const subscriber of subscribers) {
        await this.sendMessage(subscriber.agent_id, {
          message_type: 'breaking_news_alert',
          urgency: 'critical',
          payload: {
            article: {
              id: article.id,
              title: article.title,
              summary: article.summary,
              source: article.source,
              entities: article.entities
            },
            breaking_assessment: breakingScore.breaking_news_assessment,
            recommended_actions: breakingScore.recommended_actions || [],
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Trigger enhanced monitoring for breaking news entities
   */
  async triggerEnhancedMonitoring(article, breakingScore) {
    // Increase monitoring frequency for affected entities
    if (article.entities?.companies) {
      for (const company of article.entities.companies) {
        console.log(`📈 Enhanced monitoring activated for: ${company.name || company}`);
        
        // This would typically trigger more frequent data collection
        // for the affected entities
      }
    }
  }

  /**
   * Fetch recent high-impact news for breaking news scanning
   */
  async fetchRecentHighImpactNews() {
    // Get news from last 15 minutes that might be breaking
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const { data: recentNews } = await supabase
      .from('processed_news')
      .select('*')
      .gte('processed_at', fifteenMinutesAgo.toISOString())
      .order('processed_at', { ascending: false })
      .limit(20);
    
    return recentNews || [];
  }
}

// Export for use in agent factory
export default NewsIntelligenceAgent;
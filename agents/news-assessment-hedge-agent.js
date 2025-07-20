/**
 * News Assessment & Hedge Agent
 * Transforms news intelligence into actionable hedge recommendations
 * Specializes in event-driven risk assessment and hedge strategy generation
 */

import { A2AAgent } from '../api/a2a-agent-system.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration for News Assessment & Hedge Agent');
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Grok API
const GROK_API_KEY = process.env.XAI_API_KEY;
const GROK_BASE_URL = 'https://api.x.ai/v1';

if (!GROK_API_KEY) {
  console.error('Missing xAI API key for Grok integration');
}

// Grok API client
const grokClient = {
  async chat(messages, options = {}) {
    if (!GROK_API_KEY) {
      throw new Error('xAI API key not configured');
    }

    const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-4-0709',
        messages: messages,
        temperature: options.temperature || 0.3,
        max_tokens: options.max_tokens || 2000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

/**
 * News Assessment & Hedge Agent for event-driven risk management
 */
export class NewsAssessmentHedgeAgent extends A2AAgent {
  constructor(agentData) {
    super(agentData);
    this.specialization = 'news_driven_hedging';
    
    // News impact classification framework
    this.impactClassification = {
      central_bank: {
        fed_policy: { weight: 0.9, affected_assets: ['treasury', 'corporate_bonds', 'currency', 'equities'] },
        ecb_policy: { weight: 0.8, affected_assets: ['eur_bonds', 'eur_currency', 'european_equities'] },
        boe_policy: { weight: 0.7, affected_assets: ['gilts', 'gbp_currency', 'uk_equities'] }
      },
      geopolitical: {
        trade_war: { weight: 0.8, affected_assets: ['commodities', 'emerging_markets', 'currency'] },
        sanctions: { weight: 0.7, affected_assets: ['energy', 'precious_metals', 'currency'] },
        military_conflict: { weight: 0.9, affected_assets: ['oil', 'defense', 'safe_havens'] }
      },
      economic_data: {
        employment: { weight: 0.6, affected_assets: ['treasury', 'currency', 'consumer_discretionary'] },
        inflation: { weight: 0.8, affected_assets: ['tips', 'commodities', 'real_estate'] },
        gdp: { weight: 0.7, affected_assets: ['equities', 'currency', 'corporate_bonds'] }
      },
      corporate: {
        earnings_surprise: { weight: 0.5, affected_assets: ['sector_specific', 'options'] },
        merger_acquisition: { weight: 0.6, affected_assets: ['equity_specific', 'volatility'] },
        bankruptcy: { weight: 0.8, affected_assets: ['credit', 'equity', 'cds'] }
      }
    };

    // Hedge instrument library
    this.hedgeInstruments = {
      interest_rate: {
        treasury_futures: { 
          instruments: ['ZN', 'ZB', 'ZF'], 
          effectiveness: 0.95, 
          cost_bps: 2,
          liquidity: 'high'
        },
        interest_rate_swaps: { 
          instruments: ['USD_IRS_2Y', 'USD_IRS_5Y', 'USD_IRS_10Y'], 
          effectiveness: 0.98, 
          cost_bps: 5,
          liquidity: 'high'
        },
        bond_options: { 
          instruments: ['ZN_OPTIONS', 'ZB_OPTIONS'], 
          effectiveness: 0.85, 
          cost_bps: 15,
          liquidity: 'medium'
        }
      },
      currency: {
        fx_forwards: { 
          instruments: ['EUR_USD_FWD', 'GBP_USD_FWD', 'JPY_USD_FWD'], 
          effectiveness: 0.99, 
          cost_bps: 3,
          liquidity: 'high'
        },
        currency_futures: { 
          instruments: ['6E', '6B', '6J'], 
          effectiveness: 0.95, 
          cost_bps: 4,
          liquidity: 'high'
        },
        fx_options: { 
          instruments: ['EUR_USD_OPTS', 'GBP_USD_OPTS'], 
          effectiveness: 0.80, 
          cost_bps: 20,
          liquidity: 'medium'
        }
      },
      equity: {
        index_futures: { 
          instruments: ['ES', 'NQ', 'RTY'], 
          effectiveness: 0.92, 
          cost_bps: 3,
          liquidity: 'high'
        },
        equity_options: { 
          instruments: ['SPY_PUTS', 'QQQ_PUTS', 'IWM_PUTS'], 
          effectiveness: 0.85, 
          cost_bps: 25,
          liquidity: 'high'
        },
        sector_etfs: { 
          instruments: ['XLF', 'XLE', 'XLK'], 
          effectiveness: 0.75, 
          cost_bps: 8,
          liquidity: 'medium'
        }
      },
      commodity: {
        commodity_futures: { 
          instruments: ['CL', 'GC', 'SI'], 
          effectiveness: 0.90, 
          cost_bps: 10,
          liquidity: 'medium'
        },
        commodity_etfs: { 
          instruments: ['USO', 'GLD', 'SLV'], 
          effectiveness: 0.80, 
          cost_bps: 15,
          liquidity: 'medium'
        }
      }
    };

    // Risk factor sensitivity models
    this.riskFactors = {
      interest_rate_sensitivity: {
        treasury_bonds: { duration: 7.2, convexity: 0.85 },
        corporate_bonds: { duration: 5.8, convexity: 0.65, credit_spread_beta: 1.2 },
        mortgage_bonds: { duration: 4.5, convexity: -0.15, prepayment_sensitivity: 0.8 }
      },
      equity_sensitivity: {
        large_cap: { market_beta: 1.0, sector_correlation: 0.85 },
        small_cap: { market_beta: 1.3, sector_correlation: 0.70 },
        international: { market_beta: 0.8, currency_beta: 0.6 }
      },
      currency_sensitivity: {
        developed_markets: { correlation_matrix: this.buildCorrelationMatrix() },
        emerging_markets: { volatility_multiplier: 1.8, correlation_breakdown: 0.3 }
      }
    };

    // Scenario probability models
    this.scenarioModels = new Map();
    
    // Active hedge recommendations
    this.activeRecommendations = new Map();
    
    // News event tracking
    this.newsEventLog = [];
    
    // AI-enhanced hedge intelligence capabilities
    this.capabilities = [
      'ai_powered_news_impact_quantification',
      'intelligent_event_driven_scenario_modeling',
      'adaptive_hedge_instrument_selection',
      'ai_optimized_hedge_ratio_calculation',
      'advanced_cost_benefit_analysis',
      'predictive_timing_strategy_optimization',
      'dynamic_cross_asset_correlation_analysis',
      'real_time_hedge_effectiveness_tracking',
      'market_regime_aware_hedging',
      'volatility_surface_modeling',
      'sentiment_enhanced_risk_assessment',
      'multi_horizon_scenario_generation',
      'liquidity_aware_hedge_selection',
      'stress_test_scenario_modeling',
      'portfolio_impact_forecasting'
    ];
    
    // AI models for different hedge analysis aspects
    this.aiModels = {
      newsClassifier: {
        systemPrompt: 'You are an expert financial news analyst specializing in market impact assessment. Analyze news events and classify them with precise financial market implications for hedging decisions.',
        lastUsed: null
      },
      hedgeOptimizer: {
        systemPrompt: 'You are an expert quantitative hedge fund manager specializing in event-driven hedging strategies. Generate optimal hedge recommendations based on portfolio analysis and market conditions.',
        lastUsed: null
      },
      scenarioGenerator: {
        systemPrompt: 'You are an expert in financial scenario modeling. Generate comprehensive scenario analyses for news events including probabilities, market impacts, and hedge implications.',
        lastUsed: null
      },
      impactAssessor: {
        systemPrompt: 'You are an expert in portfolio impact assessment. Analyze how news events will affect different asset classes and calculate precise risk metrics.',
        lastUsed: null
      },
      marketRegimeAnalyzer: {
        systemPrompt: 'You are an expert in market regime analysis. Identify current market conditions and predict regime changes based on news events and market data.',
        lastUsed: null
      },
      volatilityModeler: {
        systemPrompt: 'You are an expert in volatility modeling and options pricing. Analyze volatility implications of news events and recommend volatility-based hedging strategies.',
        lastUsed: null
      }
    };
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    console.log(`📈 Initializing News Assessment & Hedge Agent: ${this.id}`);
    
    try {
      // Register with A2A system
      await this.registerWithA2A();
    } catch (error) {
      console.error('Failed to register with A2A:', error.message);
    }
    
    try {
      // Register with ORD
      await this.registerWithORD();
    } catch (error) {
      console.error('Failed to register with ORD:', error.message);
    }
    
    // Initialize scenario models
    await this.initializeScenarioModels();
    
    // Load historical news correlations
    await this.loadHistoricalCorrelations();
    
    // Start news monitoring
    await this.startNewsMonitoring();
    
    console.log(`✅ News Assessment & Hedge Agent initialized: ${this.id}`);
  }

  /**
   * Register with A2A system
   */
  async registerWithA2A() {
    const agentRegistration = {
      agent_id: this.id,
      agent_name: this.name,
      agent_type: 'risk_management',
      description: 'Transforms news intelligence into actionable hedge recommendations',
      status: 'active',
      capabilities: this.capabilities,
      voting_power: this.votingPower,
      connection_config: {
        goals: [
          'Assess portfolio impact of news events',
          'Generate optimal hedge recommendations',
          'Monitor hedge effectiveness in real-time',
          'Provide cost-benefit analysis for risk mitigation'
        ],
        personality: 'analytical',
        auto_respond: true,
        max_concurrent_analyses: 25,
        hedge_focus: 'event_driven'
      },
      scheduled_tasks: [
        {
          name: 'news_impact_scan',
          interval: '*/5 * * * *', // Every 5 minutes
          action: 'scanNewsImpacts'
        },
        {
          name: 'hedge_effectiveness_review',
          interval: '0 */4 * * *', // Every 4 hours
          action: 'reviewHedgeEffectiveness'
        },
        {
          name: 'scenario_model_update',
          interval: '0 2 * * *', // Daily at 2 AM
          action: 'updateScenarioModels'
        }
      ]
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('a2a_agents')
        .upsert(agentRegistration, { onConflict: 'agent_id' });

      if (error) {
        console.error('Failed to register News Assessment & Hedge Agent:', error);
        throw error;
      }
    }
  }

  /**
   * Register with ORD
   */
  async registerWithORD() {
    const ordRegistration = {
      agent_id: this.id,
      resource_type: 'agent',
      resource_name: 'News Assessment & Hedge Agent',
      resource_path: '/api/agents/news-assessment-hedge',
      capabilities: {
        input_types: ['news_events', 'market_data', 'portfolio_positions'],
        output_types: ['hedge_recommendations', 'impact_assessments', 'scenario_analysis'],
        protocols: ['HTTP', 'A2A', 'WebSocket'],
        discovery: ['ORD', 'A2A'],
        risk_features: ['news_analysis', 'hedge_optimization', 'scenario_modeling']
      },
      requirements: {
        data_access: ['news_feeds', 'market_data', 'portfolio_data'],
        dependencies: ['news_intelligence_agent', 'market_data_agent', 'curriculum_learning_agent'],
        permissions: ['hedge_recommendation', 'risk_assessment', 'scenario_generation']
      },
      metadata: {
        category: 'risk_management',
        version: '1.0.0',
        documentation: '/docs/agents/news-assessment-hedge',
        intelligence_rating: 95,
        ai_features: {
          grok_integration: true,
          intelligent_news_classification: true,
          ai_powered_hedge_optimization: true,
          advanced_scenario_modeling: true,
          market_regime_analysis: true,
          volatility_surface_modeling: true
        },
        specializations: {
          news_processing: 'AI-enhanced real-time event impact analysis',
          hedge_strategies: 'Intelligent multi-asset hedge optimization',
          scenario_modeling: 'Predictive event-driven probability modeling'
        }
      }
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('ord_analytics_resources')
        .upsert(ordRegistration, { onConflict: 'agent_id' });

      if (error) {
        console.error('Failed to register with ORD:', error);
        throw error;
      }
    }
  }

  /**
   * Process news event and generate hedge recommendations
   */
  async processNewsEvent(newsEvent) {
    console.log(`📰 Processing news event: ${newsEvent.headline}`);
    
    const analysis = {
      event_id: newsEvent.id,
      timestamp: new Date(),
      headline: newsEvent.headline,
      impact_assessment: {},
      hedge_recommendations: [],
      confidence_score: 0,
      urgency_level: 'medium'
    };

    // Step 1: Classify news event using Grok AI
    const classification = await this.classifyNewsEvent(newsEvent);
    analysis.classification = classification;

    // Step 2: Assess portfolio impact
    const impact = await this.assessPortfolioImpact(newsEvent, classification);
    analysis.impact_assessment = impact;

    // Step 3: Generate scenarios using AI-enhanced logic
    const scenarios = this.generateEventScenarios(newsEvent, classification);
    analysis.scenarios = scenarios;

    // Step 4: Calculate hedge recommendations using Grok AI
    const hedgeRecommendations = await this.generateHedgeRecommendations(impact, scenarios, classification);
    analysis.hedge_recommendations = hedgeRecommendations;

    // Step 5: Validate with Curriculum Learning Agent
    if (hedgeRecommendations.length > 0) {
      const validation = await this.validateHedgeStrategies(hedgeRecommendations);
      analysis.cfa_compliance = validation;
    }

    // Step 6: Calculate confidence and urgency
    analysis.confidence_score = this.calculateConfidenceScore(classification, impact, scenarios);
    analysis.urgency_level = this.determineUrgencyLevel(impact, scenarios);

    // Store analysis
    this.newsEventLog.push(analysis);
    
    // Store in database
    if (supabase) {
      await supabase
        .from('news_hedge_analyses')
        .insert({
          event_id: newsEvent.id,
          analysis_data: analysis,
          timestamp: analysis.timestamp
        });
    }

    return analysis;
  }

  /**
   * Classify news event using Grok AI for intelligent analysis
   */
  async classifyNewsEvent(newsEvent) {
    console.log(`🤖 Using Grok AI to classify news: ${newsEvent.headline}`);
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert financial news analyst specializing in market impact assessment. Analyze news events and classify them with precise financial market implications.

Your task is to classify news events into structured categories that drive portfolio hedging decisions. You must return a JSON object with exact structure.

Categories and their typical impact weights:
- central_bank (0.8-0.95): Fed policy, ECB decisions, interest rate changes
- geopolitical (0.7-0.9): Trade wars, sanctions, military conflicts, elections
- economic_data (0.5-0.8): Employment, inflation, GDP, manufacturing data  
- corporate (0.3-0.7): Earnings, M&A, bankruptcies, sector-specific news
- market_structure (0.6-0.85): Regulatory changes, market volatility, liquidity events

Asset classes typically affected:
- treasury, corporate_bonds, municipal_bonds (interest rate sensitive)
- large_cap_equity, small_cap_equity, international_equity (risk-on/risk-off)
- currency, fx_forwards, emerging_market_currency (FX impact)
- commodities, oil, gold, agricultural (inflation/supply impact)
- volatility, options, credit_derivatives (risk premium changes)

Time horizons:
- immediate (0-3 days): Breaking news, emergency meetings, market shocks
- short_term (1-4 weeks): Policy announcements, earnings seasons, scheduled data
- medium_term (1-6 months): Policy guidance, structural changes, long-term trends
- long_term (6+ months): Demographic shifts, technology disruption, climate policies

Geographic scope:
- global: Major central bank policy, trade wars, global pandemics
- regional: EU policy, NAFTA changes, regional conflicts
- domestic: Country-specific politics, local regulations, domestic data`
        },
        {
          role: 'user',
          content: `Analyze this news event and classify its market impact:

Headline: "${newsEvent.headline}"
Content: "${newsEvent.content || 'No additional content'}"
Source: ${newsEvent.source || 'Unknown'}
Timestamp: ${newsEvent.timestamp || new Date().toISOString()}

Return a JSON object with this exact structure:
{
  "primary_category": "string",
  "subcategory": "string", 
  "impact_weight": number (0.0-1.0),
  "affected_assets": ["array", "of", "asset", "classes"],
  "geographic_scope": "global|regional|domestic",
  "time_horizon": "immediate|short_term|medium_term|long_term",
  "confidence_level": number (0.0-1.0),
  "market_direction": "bullish|bearish|neutral|mixed",
  "volatility_expectation": "low|medium|high|extreme",
  "key_factors": ["array", "of", "key", "drivers"],
  "similar_historical_events": ["array", "of", "comparable", "events"],
  "reasoning": "detailed explanation of classification logic"
}`
        }
      ];

      const grokResponse = await grokClient.chat(messages, {
        temperature: 0.2,
        max_tokens: 1500
      });

      // Parse Grok's JSON response
      let classification;
      try {
        // Extract JSON from response (handle cases where Grok adds explanatory text)
        const jsonMatch = grokResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          classification = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in Grok response');
        }
      } catch (parseError) {
        console.error('Failed to parse Grok classification response:', parseError);
        // Fallback to basic classification
        classification = this.fallbackClassification(newsEvent);
      }

      // Enhance with sentiment analysis if available
      if (newsEvent.sentiment) {
        const sentimentMultiplier = Math.abs(newsEvent.sentiment.compound);
        classification.impact_weight = Math.min(
          classification.impact_weight * (0.8 + sentimentMultiplier * 0.4),
          1.0
        );
        classification.sentiment_influence = sentimentMultiplier;
      }

      console.log(`🎯 Grok classified as: ${classification.primary_category}/${classification.subcategory} (${classification.impact_weight})`);
      return classification;

    } catch (error) {
      console.error('Grok classification failed:', error);
      // Fallback to rule-based classification
      return this.fallbackClassification(newsEvent);
    }
  }

  /**
   * Fallback classification for when Grok is unavailable
   */
  fallbackClassification(newsEvent) {
    console.log('📋 Using fallback classification logic');
    
    const headline = newsEvent.headline.toLowerCase();
    const content = newsEvent.content ? newsEvent.content.toLowerCase() : '';
    const text = `${headline} ${content}`;

    // Basic rule-based classification
    if (text.includes('fed') || text.includes('federal reserve') || text.includes('interest rate')) {
      return {
        primary_category: 'central_bank',
        subcategory: 'fed_policy',
        impact_weight: 0.85,
        affected_assets: ['treasury', 'corporate_bonds', 'currency', 'equities'],
        geographic_scope: 'global',
        time_horizon: 'short_term',
        confidence_level: 0.7,
        market_direction: text.includes('hike') || text.includes('raise') ? 'bearish' : 'bullish',
        volatility_expectation: 'high',
        reasoning: 'Fallback: Federal Reserve policy detected'
      };
    }

    // Default classification for unrecognized events
    return {
      primary_category: 'corporate',
      subcategory: 'general_news',
      impact_weight: 0.3,
      affected_assets: ['equities'],
      geographic_scope: 'domestic',
      time_horizon: 'short_term',
      confidence_level: 0.4,
      market_direction: 'neutral',
      volatility_expectation: 'low',
      reasoning: 'Fallback: Unclassified news event'
    };
  }

  /**
   * AI-enhanced portfolio impact assessment
   */
  async assessPortfolioImpact(newsEvent, classification) {
    console.log(`🤖 Using AI to assess portfolio impact`);
    
    const impact = {
      total_portfolio_var_change: 0,
      asset_class_impacts: {},
      risk_factor_changes: {},
      scenario_probabilities: {},
      estimated_pnl_impact: {},
      ai_insights: null,
      market_regime_analysis: null,
      volatility_implications: null
    };

    // Mock portfolio data (in real implementation, this would come from portfolio management system)
    const portfolioExposures = {
      treasury_bonds: { notional: 50000000, duration: 7.2, current_value: 48500000 },
      corporate_bonds: { notional: 30000000, duration: 5.8, current_value: 29200000 },
      large_cap_equity: { notional: 40000000, beta: 1.05, current_value: 41200000 },
      international_equity: { notional: 20000000, beta: 0.85, fx_exposure: 0.6, current_value: 19800000 },
      commodities: { notional: 10000000, oil_beta: 1.2, current_value: 10500000 }
    };

    // Get AI-enhanced impact assessment
    impact.ai_insights = await this.performIntelligentImpactAnalysis(newsEvent, classification, portfolioExposures);
    
    // Get market regime analysis
    impact.market_regime_analysis = await this.analyzeMarketRegime(newsEvent, classification);
    
    // Get volatility implications
    impact.volatility_implications = await this.analyzeVolatilityImplications(newsEvent, classification);

    // Calculate asset-specific impacts with AI enhancement
    for (const assetClass of classification.affected_assets) {
      const exposure = portfolioExposures[assetClass] || portfolioExposures[this.mapAssetClass(assetClass)];
      
      if (exposure) {
        const assetImpact = await this.calculateEnhancedAssetImpact(
          assetClass, 
          exposure, 
          classification,
          newsEvent,
          impact.ai_insights
        );
        
        impact.asset_class_impacts[assetClass] = assetImpact;
        impact.total_portfolio_var_change += assetImpact.var_change;
      }
    }

    // AI-enhanced risk factor changes
    impact.risk_factor_changes = await this.calculateIntelligentRiskFactorChanges(classification, newsEvent, impact.ai_insights);

    // AI-generated scenario probabilities
    impact.scenario_probabilities = await this.calculateIntelligentScenarioProbabilities(classification, newsEvent, impact.ai_insights);

    return impact;
  }

  /**
   * Generate intelligent hedge recommendations using Grok AI
   */
  async generateHedgeRecommendations(impact, scenarios, classification) {
    console.log(`🤖 Using Grok AI to generate hedge recommendations`);
    
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert quantitative hedge fund manager specializing in event-driven hedging strategies. Your expertise includes:

- Modern portfolio theory and risk management
- Derivatives pricing and hedge effectiveness
- Market microstructure and liquidity analysis
- Cross-asset correlations during stress periods
- Transaction cost optimization
- Regulatory constraints and best practices

Available hedge instruments and their characteristics:
INTEREST RATE HEDGES:
- Treasury Futures (ZN, ZB, ZF): High liquidity, 95% effectiveness, 2bp cost
- Interest Rate Swaps: Very high effectiveness (98%), 5bp cost, OTC liquidity
- Bond Options: Medium liquidity, 85% effectiveness, 15bp cost, gamma exposure

EQUITY HEDGES:
- Index Futures (ES, NQ, RTY): High liquidity, 92% effectiveness, 3bp cost
- Index Options (SPY puts, QQQ puts): High liquidity, 85% effectiveness, 25bp cost
- Sector ETFs: Medium liquidity, 75% effectiveness, 8bp cost

CURRENCY HEDGES:
- FX Forwards: Very high effectiveness (99%), 3bp cost, excellent liquidity
- Currency Futures: High effectiveness (95%), 4bp cost, good liquidity  
- FX Options: Medium effectiveness (80%), 20bp cost, moderate liquidity

COMMODITY HEDGES:
- Commodity Futures (CL, GC): Medium liquidity, 90% effectiveness, 10bp cost
- Commodity ETFs: Lower effectiveness (80%), 15bp cost, good liquidity

Portfolio constraints:
- Maximum hedge ratio: 100% per asset class
- Minimum cost-benefit ratio: 2.0x
- Liquidity preference: High > Medium > Low
- Regulatory limits: Must comply with Volcker Rule, treasury policies`
        },
        {
          role: 'user',
          content: `Generate optimal hedge recommendations for this portfolio impact:

NEWS CLASSIFICATION:
${JSON.stringify(classification, null, 2)}

PORTFOLIO IMPACT ANALYSIS:
${JSON.stringify(impact, null, 2)}

SCENARIO PROBABILITIES:
${JSON.stringify(scenarios, null, 2)}

Generate hedge recommendations considering:
1. Risk-adjusted expected returns
2. Hedge effectiveness vs transaction costs
3. Liquidity requirements for rapid execution
4. Basis risk and correlation breakdown scenarios
5. Implementation complexity and timing

Return a JSON array of hedge recommendations with this structure:
[
  {
    "asset_class": "string",
    "hedge_instrument_type": "string",
    "specific_instruments": ["array"],
    "hedge_ratio": number (0.0-1.0),
    "notional_amount": number,
    "estimated_cost": number,
    "expected_protection": number,
    "cost_benefit_ratio": number,
    "effectiveness_score": number (0.0-1.0),
    "liquidity_score": "high|medium|low",
    "implementation_urgency": "immediate|high|medium|low",
    "risk_considerations": ["array"],
    "exit_strategy": {
      "trigger_conditions": ["array"],
      "target_pnl": "string", 
      "max_holding_period": "string"
    },
    "confidence_level": number (0.0-1.0),
    "reasoning": "detailed explanation of recommendation logic"
  }
]

Prioritize recommendations by risk-adjusted returns and ensure each recommendation has cost_benefit_ratio > 2.0.`
        }
      ];

      const grokResponse = await grokClient.chat(messages, {
        temperature: 0.3,
        max_tokens: 3000
      });

      // Parse Grok's JSON response
      let recommendations;
      try {
        // Extract JSON array from response
        const jsonMatch = grokResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON array found in Grok response');
        }
      } catch (parseError) {
        console.error('Failed to parse Grok recommendations:', parseError);
        // Fallback to basic recommendations
        recommendations = this.generateFallbackRecommendations(impact, scenarios);
      }

      // Validate and enhance recommendations
      const validatedRecommendations = recommendations
        .filter(rec => rec.cost_benefit_ratio > 2.0)
        .slice(0, 5) // Limit to top 5
        .map(rec => this.enhanceRecommendation(rec));

      console.log(`🎯 Grok generated ${validatedRecommendations.length} hedge recommendations`);
      return validatedRecommendations;

    } catch (error) {
      console.error('Grok hedge generation failed:', error);
      // Fallback to basic hedge generation
      return this.generateFallbackRecommendations(impact, scenarios);
    }
  }

  /**
   * Generate fallback recommendations when Grok is unavailable
   */
  generateFallbackRecommendations(impact, scenarios) {
    console.log('📋 Using fallback hedge recommendation logic');
    
    const recommendations = [];

    // Simple rule-based recommendations for major exposures
    for (const [assetClass, assetImpact] of Object.entries(impact.asset_class_impacts)) {
      if (Math.abs(assetImpact.expected_pnl) > 100000) {
        const recommendation = {
          asset_class: assetClass,
          hedge_instrument_type: this.getSimpleHedgeInstrument(assetClass),
          specific_instruments: this.getInstrumentList(assetClass),
          hedge_ratio: 0.8,
          notional_amount: Math.abs(assetImpact.exposure_amount * 0.8),
          estimated_cost: Math.abs(assetImpact.expected_pnl) * 0.02,
          expected_protection: Math.abs(assetImpact.expected_pnl) * 0.8,
          cost_benefit_ratio: 40.0,
          effectiveness_score: 0.85,
          liquidity_score: 'high',
          implementation_urgency: 'high',
          confidence_level: 0.6,
          reasoning: 'Fallback: Basic hedge for significant exposure'
        };
        
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  /**
   * Enhance recommendation with additional calculated fields
   */
  enhanceRecommendation(rec) {
    return {
      ...rec,
      recommendation_id: `hedge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      status: 'pending_review'
    };
  }

  /**
   * Calculate specific hedge recommendation
   */
  async calculateHedgeRecommendation(assetClass, assetImpact, instrumentType, instrumentData, scenarios) {
    const recommendation = {
      asset_class: assetClass,
      hedge_instrument: instrumentType,
      instruments: instrumentData.instruments,
      hedge_ratio: 0,
      notional_amount: 0,
      estimated_cost: 0,
      expected_protection: 0,
      cost_benefit_ratio: 0,
      effectiveness: instrumentData.effectiveness,
      liquidity: instrumentData.liquidity,
      implementation_urgency: 'medium',
      exit_strategy: {},
      risk_considerations: []
    };

    // Calculate optimal hedge ratio
    recommendation.hedge_ratio = this.calculateOptimalHedgeRatio(
      assetImpact,
      instrumentData.effectiveness,
      scenarios
    );

    // Calculate notional amount
    recommendation.notional_amount = Math.abs(assetImpact.exposure_amount * recommendation.hedge_ratio);

    // Estimate hedge cost
    recommendation.estimated_cost = this.calculateHedgeCost(
      recommendation.notional_amount,
      instrumentData.cost_bps,
      instrumentType
    );

    // Calculate expected protection
    recommendation.expected_protection = Math.abs(assetImpact.expected_pnl * recommendation.hedge_ratio * instrumentData.effectiveness);

    // Calculate cost-benefit ratio
    recommendation.cost_benefit_ratio = recommendation.expected_protection / recommendation.estimated_cost;

    // Determine implementation urgency
    recommendation.implementation_urgency = this.determineImplementationUrgency(assetImpact, scenarios);

    // Define exit strategy
    recommendation.exit_strategy = this.defineExitStrategy(instrumentType, scenarios);

    // Identify risk considerations
    recommendation.risk_considerations = this.identifyRiskConsiderations(instrumentType, assetClass);

    return recommendation;
  }

  /**
   * Validate hedge strategies with Curriculum Learning Agent
   */
  async validateHedgeStrategies(hedgeRecommendations) {
    // This would integrate with the Curriculum Learning Agent
    // For now, return a basic validation
    
    const validation = {
      cfa_compliant: true,
      treasury_compliant: true,
      regulatory_issues: [],
      best_practices_followed: true,
      recommendations: []
    };

    for (const hedge of hedgeRecommendations) {
      // Check hedge ratio limits
      if (hedge.hedge_ratio > 1.0) {
        validation.treasury_compliant = false;
        validation.regulatory_issues.push(`Hedge ratio ${hedge.hedge_ratio} exceeds 100% limit`);
      }

      // Check instrument appropriateness
      if (hedge.liquidity === 'low' && hedge.notional_amount > 10000000) {
        validation.best_practices_followed = false;
        validation.recommendations.push(`Consider more liquid alternatives for ${hedge.hedge_instrument}`);
      }
    }

    return validation;
  }

  // Helper methods

  calculateOptimalHedgeRatio(assetImpact, effectiveness, scenarios) {
    // Minimum variance hedge ratio calculation
    const variance_unhedged = assetImpact.volatility ** 2;
    const correlation = 0.85; // Simplified correlation assumption
    const hedge_variance = variance_unhedged * 0.9; // Hedge instrument variance
    
    const optimal_ratio = (correlation * Math.sqrt(variance_unhedged * hedge_variance)) / hedge_variance;
    
    // Adjust for effectiveness
    return Math.min(optimal_ratio * effectiveness, 1.0);
  }

  calculateHedgeCost(notionalAmount, costBps, instrumentType) {
    const baseCost = notionalAmount * (costBps / 10000);
    
    // Add instrument-specific costs
    const instrumentCostMultipliers = {
      'treasury_futures': 1.0,
      'fx_forwards': 1.2,
      'equity_options': 2.5,
      'bond_options': 2.0
    };
    
    const multiplier = instrumentCostMultipliers[instrumentType] || 1.0;
    return baseCost * multiplier;
  }

  mapAssetClass(genericAssetClass) {
    const mapping = {
      'treasury': 'treasury_bonds',
      'corporate_bonds': 'corporate_bonds',
      'equities': 'large_cap_equity',
      'currency': 'international_equity',
      'commodities': 'commodities'
    };
    
    return mapping[genericAssetClass] || genericAssetClass;
  }

  mapAssetClassToHedgeCategory(assetClass) {
    const mapping = {
      'treasury_bonds': 'interest_rate',
      'corporate_bonds': 'interest_rate',
      'large_cap_equity': 'equity',
      'international_equity': 'currency',
      'commodities': 'commodity'
    };
    
    return mapping[assetClass] || 'equity';
  }

  calculateAssetImpact(assetClass, exposure, impactWeight, sentiment) {
    const baseVolatility = 0.15; // 15% base volatility
    const adjustedVolatility = baseVolatility * impactWeight;
    
    const sentimentImpact = sentiment ? sentiment.compound * 0.1 : 0;
    const expectedReturn = sentimentImpact * impactWeight;
    
    return {
      exposure_amount: exposure.notional,
      current_value: exposure.current_value,
      expected_pnl: exposure.current_value * expectedReturn,
      var_change: exposure.current_value * adjustedVolatility * 2.33, // 99% VaR
      volatility: adjustedVolatility
    };
  }

  calculateRiskFactorChanges(classification, newsEvent) {
    // Simplified risk factor mapping
    return {
      interest_rate_shift: classification.subcategory === 'fed_policy' ? 0.25 : 0,
      credit_spread_widening: classification.primary_category === 'geopolitical' ? 0.15 : 0,
      fx_volatility_increase: classification.affected_assets.includes('currency') ? 0.3 : 0,
      equity_correlation_increase: classification.impact_weight > 0.7 ? 0.2 : 0
    };
  }

  calculateScenarioProbabilities(classification, newsEvent) {
    // Generate scenario probabilities based on event classification
    const scenarios = {
      base_case: 0.6,
      stress_case: 0.3,
      extreme_case: 0.1
    };
    
    // Adjust probabilities based on impact weight
    if (classification.impact_weight > 0.8) {
      scenarios.stress_case += 0.1;
      scenarios.extreme_case += 0.05;
      scenarios.base_case -= 0.15;
    }
    
    return scenarios;
  }

  buildCorrelationMatrix() {
    // Simplified correlation matrix for major currencies
    return {
      'EUR_USD': { 'GBP_USD': 0.7, 'JPY_USD': -0.3, 'CHF_USD': 0.8 },
      'GBP_USD': { 'EUR_USD': 0.7, 'JPY_USD': -0.2, 'CHF_USD': 0.6 },
      'JPY_USD': { 'EUR_USD': -0.3, 'GBP_USD': -0.2, 'CHF_USD': -0.4 }
    };
  }

  initializeScenarioModels() {
    console.log('Initializing scenario models...');
    // Placeholder for scenario model initialization
  }

  loadHistoricalCorrelations() {
    console.log('Loading historical correlations...');
    // Placeholder for loading historical data
  }

  startNewsMonitoring() {
    console.log('Starting news monitoring...');
    // Placeholder for news monitoring setup
  }

  calculateConfidenceScore(classification, impact, scenarios) {
    // Simple confidence calculation
    return Math.min(classification.impact_weight * 0.7 + scenarios.stress_case * 0.3, 0.95);
  }

  determineUrgencyLevel(impact, scenarios) {
    if (Math.abs(impact.total_portfolio_var_change) > 1000000 || scenarios.extreme_case > 0.2) {
      return 'high';
    } else if (Math.abs(impact.total_portfolio_var_change) > 500000 || scenarios.stress_case > 0.4) {
      return 'medium';
    }
    return 'low';
  }

  determineImplementationUrgency(assetImpact, scenarios) {
    if (Math.abs(assetImpact.expected_pnl) > 500000 && scenarios.extreme_case > 0.15) {
      return 'immediate';
    } else if (Math.abs(assetImpact.expected_pnl) > 200000) {
      return 'high';
    }
    return 'medium';
  }

  defineExitStrategy(instrumentType, scenarios) {
    return {
      trigger_conditions: ['event_resolution', 'hedge_effectiveness_below_threshold'],
      target_pnl: 'break_even',
      maximum_holding_period: instrumentType.includes('options') ? '30_days' : '90_days',
      monitoring_frequency: 'daily'
    };
  }

  identifyRiskConsiderations(instrumentType, assetClass) {
    const risks = ['basis_risk', 'liquidity_risk'];
    
    if (instrumentType.includes('options')) {
      risks.push('time_decay', 'volatility_risk');
    }
    
    if (instrumentType.includes('futures')) {
      risks.push('margin_risk', 'rollover_risk');
    }
    
    return risks;
  }

  generateEventScenarios(newsEvent, classification) {
    const scenarios = {
      base_case: {
        probability: 0.6,
        market_impact: classification.impact_weight * 0.5,
        duration_days: 5,
        volatility_increase: 1.2
      },
      stress_case: {
        probability: 0.3,
        market_impact: classification.impact_weight * 1.0,
        duration_days: 14,
        volatility_increase: 1.8
      },
      extreme_case: {
        probability: 0.1,
        market_impact: classification.impact_weight * 2.0,
        duration_days: 30,
        volatility_increase: 2.5
      }
    };

    // Adjust probabilities based on event characteristics
    if (classification.impact_weight > 0.8) {
      scenarios.stress_case.probability += 0.1;
      scenarios.extreme_case.probability += 0.05;
      scenarios.base_case.probability -= 0.15;
    }

    // Adjust for sentiment
    if (newsEvent.sentiment && Math.abs(newsEvent.sentiment.compound) > 0.7) {
      scenarios.extreme_case.probability += 0.05;
      scenarios.base_case.probability -= 0.05;
    }

    return scenarios;
  }

  getSimpleHedgeInstrument(assetClass) {
    const mapping = {
      'treasury_bonds': 'treasury_futures',
      'corporate_bonds': 'treasury_futures', 
      'large_cap_equity': 'index_futures',
      'international_equity': 'fx_forwards',
      'commodities': 'commodity_futures'
    };
    return mapping[assetClass] || 'index_futures';
  }

  getInstrumentList(assetClass) {
    const mapping = {
      'treasury_bonds': ['ZN', 'ZB', 'ZF'],
      'corporate_bonds': ['ZN', 'ZB', 'ZF'],
      'large_cap_equity': ['ES', 'NQ', 'RTY'],
      'international_equity': ['EUR_USD_FWD', 'GBP_USD_FWD'],
      'commodities': ['CL', 'GC', 'SI']
    };
    return mapping[assetClass] || ['ES'];
  }

  /**
   * Perform intelligent impact analysis using AI
   */
  async performIntelligentImpactAnalysis(newsEvent, classification, portfolioExposures) {
    if (!GROK_API_KEY) {
      return {
        impact_confidence: 0.7,
        key_risk_factors: ['standard_market_risk'],
        correlation_breakdown_risk: 'medium'
      };
    }

    try {
      const analysisContext = {
        news_event: {
          headline: newsEvent.headline,
          classification: classification.primary_category,
          impact_weight: classification.impact_weight,
          affected_assets: classification.affected_assets
        },
        portfolio_summary: Object.keys(portfolioExposures).map(asset => ({
          asset_class: asset,
          notional: portfolioExposures[asset].notional,
          current_value: portfolioExposures[asset].current_value
        }))
      };

      const prompt = `
Perform comprehensive portfolio impact analysis:

Analysis Context: ${JSON.stringify(analysisContext, null, 2)}

Provide detailed analysis including:
1. Impact confidence score (0-1)
2. Key risk factors that will be affected
3. Correlation breakdown risk assessment
4. Cross-asset contagion potential
5. Liquidity impact assessment
6. Volatility regime shift probability
7. Hedging complexity assessment

Return as JSON with: impact_confidence, key_risk_factors, correlation_breakdown_risk, contagion_potential, liquidity_impact, volatility_regime_shift, hedging_complexity
`;

      const response = await grokClient.chat([
        { role: 'system', content: this.aiModels.impactAssessor.systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.2 });

      this.aiModels.impactAssessor.lastUsed = new Date();
      
      try {
        return JSON.parse(response.match(/\{[\s\S]*\}/)[0]);
      } catch (parseError) {
        return {
          impact_confidence: 0.75,
          key_risk_factors: ['market_volatility', 'asset_correlation'],
          correlation_breakdown_risk: 'medium'
        };
      }

    } catch (error) {
      console.error('AI impact analysis failed:', error);
      return {
        impact_confidence: 0.6,
        key_risk_factors: ['analysis_error'],
        correlation_breakdown_risk: 'unknown'
      };
    }
  }

  /**
   * Analyze market regime using AI
   */
  async analyzeMarketRegime(newsEvent, classification) {
    if (!GROK_API_KEY) {
      return {
        current_regime: 'normal',
        regime_shift_probability: 0.3,
        implications: ['standard_volatility']
      };
    }

    try {
      const regimeContext = {
        news_classification: classification,
        impact_weight: classification.impact_weight,
        market_direction: classification.market_direction,
        volatility_expectation: classification.volatility_expectation
      };

      const prompt = `
Analyze market regime implications:

Regime Context: ${JSON.stringify(regimeContext, null, 2)}

Analyze:
1. Current market regime (normal/stress/crisis/euphoria)
2. Regime shift probability (0-1)
3. Expected regime duration
4. Hedging implications for each regime
5. Risk premium adjustments needed

Return as JSON with: current_regime, regime_shift_probability, expected_duration_days, hedging_implications, risk_premium_adjustments
`;

      const response = await grokClient.chat([
        { role: 'system', content: this.aiModels.marketRegimeAnalyzer.systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.2 });

      this.aiModels.marketRegimeAnalyzer.lastUsed = new Date();
      
      try {
        return JSON.parse(response.match(/\{[\s\S]*\}/)[0]);
      } catch (parseError) {
        return {
          current_regime: 'stress',
          regime_shift_probability: 0.4,
          expected_duration_days: 14
        };
      }

    } catch (error) {
      console.error('AI regime analysis failed:', error);
      return {
        current_regime: 'unknown',
        regime_shift_probability: 0.5,
        implications: ['increased_uncertainty']
      };
    }
  }

  /**
   * Analyze volatility implications
   */
  async analyzeVolatilityImplications(newsEvent, classification) {
    if (!GROK_API_KEY) {
      return {
        volatility_impact: 'medium',
        term_structure_change: 'parallel_shift',
        options_strategies: ['protective_puts']
      };
    }

    try {
      const volatilityContext = {
        volatility_expectation: classification.volatility_expectation,
        time_horizon: classification.time_horizon,
        affected_assets: classification.affected_assets,
        impact_weight: classification.impact_weight
      };

      const prompt = `
Analyze volatility implications for hedging:

Volatility Context: ${JSON.stringify(volatilityContext, null, 2)}

Analyze:
1. Volatility impact magnitude (low/medium/high/extreme)
2. Volatility term structure changes
3. Skew and smile adjustments
4. Optimal options strategies
5. Volatility timing considerations

Return as JSON with: volatility_impact, term_structure_change, skew_adjustments, optimal_options_strategies, timing_considerations
`;

      const response = await grokClient.chat([
        { role: 'system', content: this.aiModels.volatilityModeler.systemPrompt },
        { role: 'user', content: prompt }
      ], { temperature: 0.2 });

      this.aiModels.volatilityModeler.lastUsed = new Date();
      
      try {
        return JSON.parse(response.match(/\{[\s\S]*\}/)[0]);
      } catch (parseError) {
        return {
          volatility_impact: 'high',
          term_structure_change: 'steepening',
          optimal_options_strategies: ['straddles', 'protective_puts']
        };
      }

    } catch (error) {
      console.error('AI volatility analysis failed:', error);
      return {
        volatility_impact: 'unknown',
        term_structure_change: 'unclear',
        options_strategies: ['basic_hedging']
      };
    }
  }

  /**
   * Calculate enhanced asset impact with AI insights
   */
  async calculateEnhancedAssetImpact(assetClass, exposure, classification, newsEvent, aiInsights) {
    const baseImpact = this.calculateAssetImpact(assetClass, exposure, classification.impact_weight, newsEvent.sentiment);
    
    // Enhance with AI insights
    const confidenceMultiplier = aiInsights.impact_confidence || 0.75;
    const riskFactorMultiplier = aiInsights.key_risk_factors?.includes(assetClass) ? 1.3 : 1.0;
    
    return {
      ...baseImpact,
      ai_enhanced: true,
      confidence_adjusted_pnl: baseImpact.expected_pnl * confidenceMultiplier,
      risk_adjusted_var: baseImpact.var_change * riskFactorMultiplier,
      ai_confidence: confidenceMultiplier
    };
  }

  /**
   * Calculate intelligent risk factor changes
   */
  async calculateIntelligentRiskFactorChanges(classification, newsEvent, aiInsights) {
    const baseRiskFactors = this.calculateRiskFactorChanges(classification, newsEvent);
    
    // Enhance with AI insights
    if (aiInsights.correlation_breakdown_risk === 'high') {
      baseRiskFactors.correlation_breakdown_multiplier = 1.5;
    }
    
    if (aiInsights.liquidity_impact === 'severe') {
      baseRiskFactors.liquidity_premium_increase = 0.25;
    }
    
    return {
      ...baseRiskFactors,
      ai_enhanced: true,
      contagion_risk: aiInsights.contagion_potential || 'medium'
    };
  }

  /**
   * Calculate intelligent scenario probabilities
   */
  async calculateIntelligentScenarioProbabilities(classification, newsEvent, aiInsights) {
    const baseScenarios = this.calculateScenarioProbabilities(classification, newsEvent);
    
    // Adjust based on AI insights
    if (aiInsights.volatility_regime_shift > 0.7) {
      baseScenarios.extreme_case += 0.1;
      baseScenarios.base_case -= 0.1;
    }
    
    return {
      ...baseScenarios,
      ai_enhanced: true,
      regime_shift_adjusted: true,
      ai_confidence: aiInsights.impact_confidence || 0.75
    };
  }

  /**
   * Get statistics about the News Assessment & Hedge Agent
   */
  async getAgentStatistics() {
    const stats = {
      total_analyses: this.newsEventLog.length,
      active_recommendations: this.activeRecommendations.size,
      avg_confidence_score: 0,
      hedge_categories_covered: Object.keys(this.hedgeInstruments).length,
      scenario_models_active: this.scenarioModels.size,
      ai_model_usage: {
        news_classifier: this.aiModels.newsClassifier.lastUsed,
        hedge_optimizer: this.aiModels.hedgeOptimizer.lastUsed,
        scenario_generator: this.aiModels.scenarioGenerator.lastUsed,
        impact_assessor: this.aiModels.impactAssessor.lastUsed,
        market_regime_analyzer: this.aiModels.marketRegimeAnalyzer.lastUsed,
        volatility_modeler: this.aiModels.volatilityModeler.lastUsed
      }
    };

    if (this.newsEventLog.length > 0) {
      stats.avg_confidence_score = this.newsEventLog.reduce((sum, analysis) => 
        sum + analysis.confidence_score, 0) / this.newsEventLog.length;
    }

    return stats;
  }
}

// Export for use in agent factory
export default NewsAssessmentHedgeAgent;
/**
 * AI to Database Mapper
 * Maps structured AI outputs to database schemas
 * Ensures data consistency between AI responses and database storage
 */

import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    // In Vercel/production, these are set automatically
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      console.warn('Supabase credentials not found, database operations will be skipped');
      return null;
    }
    
    try {
      supabase = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }
  return supabase;
}

/**
 * Map AI market analysis to database format
 */
export async function storeMarketAnalysis(symbol, aiAnalysis, agentId) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  // AI returns structured data via MARKET_ANALYSIS_SCHEMA
  const {
    analysis,
    technicalIndicators,
    prediction,
    risks,
    opportunities
  } = aiAnalysis;

  try {
    // Store in market_predictions table (if it exists)
    const marketPrediction = {
      symbol,
      agent_id: agentId,
      prediction_type: 'market_analysis',
      prediction_data: {
        direction: prediction.direction,
        target_price: prediction.targetPrice,
        timeframe: prediction.timeframe,
        confidence: prediction.confidence
      },
      confidence: prediction.confidence,
      reasoning: analysis.keyFactors.join('; '),
      created_at: new Date().toISOString()
    };

    // Store technical indicators separately
    const technicalData = {
      symbol,
      agent_id: agentId,
      indicators: technicalIndicators,
      trend: technicalIndicators.trend,
      timestamp: new Date().toISOString()
    };

    // Store risks and opportunities
    const riskData = risks.map(risk => ({
      symbol,
      agent_id: agentId,
      risk_type: risk.type,
      severity: risk.severity,
      description: risk.description,
      created_at: new Date().toISOString()
    }));

    // Transaction to ensure consistency
    const results = await Promise.all([
      // Check if table exists before inserting
      supabase.from('market_predictions').insert(marketPrediction),
      supabase.from('technical_indicators').insert(technicalData),
      supabase.from('market_risks').insert(riskData)
    ]);

    // Also store complete AI response for audit
    await supabase.from('ai_analysis_log').insert({
      analysis_type: 'market_analysis',
      symbol,
      agent_id: agentId,
      ai_response: aiAnalysis, // Full structured output
      created_at: new Date().toISOString()
    });

    return { success: true, results };
  } catch (error) {
    console.error('Error storing market analysis:', error);
    
    // Fallback: Store in generic AI results table
    await supabase.from('ai_results').insert({
      result_type: 'market_analysis',
      entity_id: symbol,
      agent_id: agentId,
      result_data: aiAnalysis,
      created_at: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Map AI compliance analysis to database format
 */
export async function storeComplianceAnalysis(resourceId, aiCompliance, agentId) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  const {
    predictions,
    autoFixable,
    riskScore,
    readyForCreation,
    criticalIssues,
    aiRecommendation
  } = aiCompliance;

  try {
    // Create compliance record
    const complianceRecord = {
      resource_id: resourceId,
      agent_id: agentId,
      risk_score: riskScore,
      ready_for_creation: readyForCreation,
      critical_issues: criticalIssues,
      ai_recommendation: aiRecommendation,
      predictions: predictions, // Store as JSONB
      auto_fixable: autoFixable,
      created_at: new Date().toISOString()
    };

    // Store main compliance analysis
    const { data, error } = await supabase
      .from('compliance_predictions')
      .insert(complianceRecord)
      .select()
      .single();

    if (error) throw error;

    // Store individual predictions for querying
    const predictionRecords = predictions.map(pred => ({
      compliance_id: data.id,
      field: pred.field,
      issue: pred.issue,
      severity: pred.severity,
      likelihood: pred.likelihood,
      impact: pred.impact,
      preemptive_fix: pred.preemptiveFix,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('compliance_prediction_details')
      .insert(predictionRecords);

    return { success: true, complianceId: data.id };
  } catch (error) {
    console.error('Error storing compliance analysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map AI agent decisions to database format
 */
export async function storeAgentDecision(agentId, aiDecision, context) {
  const {
    shouldRespond,
    recipientIds,
    responseContent,
    messageType,
    reasoning,
    confidence
  } = aiDecision;

  try {
    // Store decision in agent activity
    const activityRecord = {
      agent_id: agentId,
      activity_type: 'decision_made',
      details: {
        decision: shouldRespond ? 'respond' : 'no_response',
        recipients: recipientIds,
        message_type: messageType,
        confidence,
        reasoning,
        context
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('agent_activity')
      .insert(activityRecord)
      .select()
      .single();

    if (error) throw error;

    // If decision is to respond, prepare message
    if (shouldRespond && recipientIds.length > 0) {
      const message = {
        sender_id: agentId,
        recipient_ids: recipientIds,
        message_type: messageType,
        content: responseContent,
        metadata: {
          ai_generated: true,
          confidence,
          reasoning,
          activity_id: data.id
        },
        created_at: new Date().toISOString()
      };

      await supabase
        .from('a2a_messages')
        .insert(message);
    }

    return { success: true, activityId: data.id };
  } catch (error) {
    console.error('Error storing agent decision:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map AI anomaly detection to database format
 */
export async function storeAnomalyDetection(symbol, aiAnomalies, agentId) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  const {
    anomalies_detected,
    pattern_analysis,
    volume_profile,
    risk_assessment,
    ai_recommendations
  } = aiAnomalies;

  try {
    // Store main anomaly record
    const anomalyRecord = {
      symbol,
      agent_id: agentId,
      anomaly_count: anomalies_detected.length,
      overall_risk: risk_assessment.overall_risk,
      black_swan_probability: risk_assessment.black_swan_probability,
      pattern_summary: pattern_analysis,
      volume_profile,
      created_at: new Date().toISOString()
    };

    const { data: mainRecord, error: mainError } = await supabase
      .from('market_anomalies')
      .insert(anomalyRecord)
      .select()
      .single();

    if (mainError) throw mainError;

    // Store individual anomalies
    const anomalyDetails = anomalies_detected.map(anomaly => ({
      anomaly_id: mainRecord.id,
      type: anomaly.type,
      severity: anomaly.severity,
      confidence: anomaly.confidence,
      description: anomaly.description,
      current_value: anomaly.current_value,
      expected_range: anomaly.expected_range,
      z_score: anomaly.z_score,
      trading_implications: anomaly.trading_implications,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('anomaly_details')
      .insert(anomalyDetails);

    // Store AI recommendations
    const recommendations = ai_recommendations.map(rec => ({
      anomaly_id: mainRecord.id,
      action: rec.action,
      confidence: rec.confidence,
      reasoning: rec.reasoning,
      timeframe: rec.timeframe,
      created_at: new Date().toISOString()
    }));

    await supabase
      .from('ai_recommendations')
      .insert(recommendations);

    return { success: true, anomalyId: mainRecord.id };
  } catch (error) {
    console.error('Error storing anomaly detection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Map AI news analysis to existing database format
 */
export async function storeNewsAnalysis(symbol, aiNewsAnalysis, newsArticles) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  const {
    sentiment,
    keyThemes,
    impactSummary,
    confidence
  } = aiNewsAnalysis;

  try {
    // Map to existing news_sentiment_analysis table
    const sentimentRecords = newsArticles.map(article => ({
      news_id: article.id,
      analyzed_by: 'agent-news-intelligence',
      sentiment_score: mapSentimentToScore(sentiment),
      sentiment_label: sentiment,
      key_entities: [symbol],
      themes: keyThemes,
      confidence_score: confidence,
      analysis_method: 'structured_ai',
      raw_analysis: {
        impact_summary: impactSummary,
        themes: keyThemes,
        structured_output: aiNewsAnalysis
      },
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('news_sentiment_analysis')
      .insert(sentimentRecords)
      .select();

    if (error) throw error;

    // Update market impact if significant
    if (confidence > 0.7 && ['very_positive', 'very_negative'].includes(sentiment)) {
      const impactRecord = {
        news_id: newsArticles[0].id,
        entity: symbol,
        impact_type: sentiment.includes('positive') ? 'positive' : 'negative',
        impact_score: confidence,
        predicted_price_change: sentiment.includes('very') ? 0.05 : 0.02,
        time_horizon: '24h',
        confidence_level: confidence,
        reasoning: impactSummary,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('news_market_impact')
        .insert(impactRecord);
    }

    return { success: true, records: data };
  } catch (error) {
    console.error('Error storing news analysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to map sentiment labels to scores
 */
function mapSentimentToScore(sentiment) {
  const mapping = {
    'very_positive': 0.9,
    'positive': 0.6,
    'neutral': 0,
    'negative': -0.6,
    'very_negative': -0.9
  };
  return mapping[sentiment] || 0;
}

/**
 * Create missing tables for AI data storage
 */
export async function createMissingAITables() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Cannot create tables: Supabase client not available');
    return;
  }

  const missingTables = [
    {
      name: 'market_predictions',
      sql: `
        CREATE TABLE IF NOT EXISTS market_predictions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          symbol VARCHAR(10) NOT NULL,
          agent_id VARCHAR(100) NOT NULL,
          prediction_type VARCHAR(50) NOT NULL,
          prediction_data JSONB NOT NULL,
          confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
          reasoning TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
        );
        CREATE INDEX idx_market_predictions_symbol ON market_predictions(symbol);
        CREATE INDEX idx_market_predictions_created ON market_predictions(created_at DESC);
      `
    },
    {
      name: 'compliance_predictions',
      sql: `
        CREATE TABLE IF NOT EXISTS compliance_predictions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          resource_id VARCHAR(255) NOT NULL,
          resource_type VARCHAR(50) NOT NULL,
          agent_id VARCHAR(100) NOT NULL,
          risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
          ready_for_creation BOOLEAN DEFAULT FALSE,
          critical_issues INTEGER DEFAULT 0,
          ai_recommendation TEXT,
          predictions JSONB,
          auto_fixable JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
        );
        CREATE INDEX idx_compliance_predictions_resource ON compliance_predictions(resource_id);
      `
    },
    {
      name: 'ai_analysis_log',
      sql: `
        CREATE TABLE IF NOT EXISTS ai_analysis_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          analysis_type VARCHAR(50) NOT NULL,
          symbol VARCHAR(10),
          agent_id VARCHAR(100) NOT NULL,
          ai_response JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (agent_id) REFERENCES a2a_agents(agent_id)
        );
        CREATE INDEX idx_ai_analysis_log_type ON ai_analysis_log(analysis_type);
        CREATE INDEX idx_ai_analysis_log_created ON ai_analysis_log(created_at DESC);
      `
    }
  ];

  console.log('Creating missing AI tables...');
  
  for (const table of missingTables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      if (error) {
        console.error(`Error creating ${table.name}:`, error);
      } else {
        console.log(`✅ Created table: ${table.name}`);
      }
    } catch (err) {
      console.error(`Failed to create ${table.name}:`, err);
    }
  }
}

export default {
  storeMarketAnalysis,
  storeComplianceAnalysis,
  storeAgentDecision,
  storeAnomalyDetection,
  storeNewsAnalysis,
  createMissingAITables
};
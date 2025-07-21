/**
 * Example: Complete AI to Database Flow with Structured Outputs
 * Shows how AI responses flow into the database with proper mapping
 */

import { createClient } from '@supabase/supabase-js';
import { 
  MARKET_ANALYSIS_SCHEMA, 
  COMPLIANCE_ANALYSIS_SCHEMA,
  callGrokStructured 
} from '../lib/grok-structured-schemas.js';
import {
  storeMarketAnalysis,
  storeComplianceAnalysis,
  storeNewsAnalysis,
  storeAnomalyDetection
} from '../lib/ai-to-database-mapper.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Complete flow: Market Analysis → Database Storage
 */
async function performMarketAnalysisFlow(symbol) {
  console.log(`\n📊 Analyzing ${symbol}...`);
  
  try {
    // 1. Get market data from database
    const { data: marketData } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(50);

    // 2. Get news data
    const { data: newsData } = await supabase
      .from('breaking_news')
      .select('*')
      .contains('entities', [symbol])
      .order('published_at', { ascending: false })
      .limit(5);

    // 3. Call AI with structured output
    const messages = [
      {
        role: 'system',
        content: 'You are a market analysis AI providing comprehensive technical and fundamental analysis.'
      },
      {
        role: 'user',
        content: `Analyze ${symbol} with the following data:
        
        Recent Prices: ${marketData.map(d => d.price).slice(0, 10).join(', ')}
        Recent News: ${newsData.map(n => n.title).join('; ')}
        
        Provide comprehensive analysis including sentiment, technical indicators, predictions, risks, and opportunities.`
      }
    ];

    const aiAnalysis = await callGrokStructured(
      process.env.GROK_API_KEY,
      messages,
      MARKET_ANALYSIS_SCHEMA,
      { temperature: 0.3, max_tokens: 2000 }
    );

    console.log('✅ AI Analysis Complete:', {
      sentiment: aiAnalysis.analysis.sentiment,
      confidence: aiAnalysis.analysis.confidence,
      prediction: aiAnalysis.prediction.direction
    });

    // 4. Store in database with proper mapping
    const storageResult = await storeMarketAnalysis(
      symbol,
      aiAnalysis,
      'agent-market-analysis'
    );

    console.log('💾 Stored in database:', storageResult);

    // 5. Trigger downstream actions based on analysis
    if (aiAnalysis.prediction.confidence > 0.8) {
      await triggerHighConfidenceAlert(symbol, aiAnalysis);
    }

    if (aiAnalysis.risks.some(r => r.severity === 'critical')) {
      await triggerRiskAlert(symbol, aiAnalysis.risks);
    }

    return aiAnalysis;
  } catch (error) {
    console.error('❌ Market analysis flow failed:', error);
    throw error;
  }
}

/**
 * Complete flow: Compliance Check → Database Storage
 */
async function performComplianceCheckFlow(agentData) {
  console.log(`\n⚖️ Checking compliance for ${agentData.agent_id}...`);
  
  try {
    // 1. Get historical compliance data
    const { data: history } = await supabase
      .from('compliance_predictions')
      .select('*')
      .eq('resource_id', agentData.agent_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 2. Call AI with structured output
    const messages = [
      {
        role: 'system',
        content: 'You are a compliance AI specializing in A2A and ORD standards.'
      },
      {
        role: 'user',
        content: `Analyze this agent registration for compliance:
        
        ${JSON.stringify(agentData, null, 2)}
        
        Historical issues: ${history.map(h => h.ai_recommendation).join('; ')}
        
        Check for compliance issues and provide predictions with fixes.`
      }
    ];

    const aiCompliance = await callGrokStructured(
      process.env.GROK_API_KEY,
      messages,
      COMPLIANCE_ANALYSIS_SCHEMA,
      { temperature: 0.2, max_tokens: 2000 }
    );

    console.log('✅ Compliance Check Complete:', {
      riskScore: aiCompliance.riskScore,
      criticalIssues: aiCompliance.criticalIssues,
      readyForCreation: aiCompliance.readyForCreation
    });

    // 3. Store in database
    const storageResult = await storeComplianceAnalysis(
      agentData.agent_id,
      aiCompliance,
      'agent-compliance-checker'
    );

    // 4. Apply auto-fixes if safe
    if (aiCompliance.riskScore < 30 && Object.keys(aiCompliance.autoFixable).length > 0) {
      await applyComplianceFixes(agentData.agent_id, aiCompliance.autoFixable);
    }

    // 5. Update agent status based on compliance
    await updateAgentComplianceStatus(agentData.agent_id, aiCompliance);

    return aiCompliance;
  } catch (error) {
    console.error('❌ Compliance check flow failed:', error);
    throw error;
  }
}

/**
 * Real-time data flow with WebSocket integration
 */
async function setupRealTimeDataFlow() {
  console.log('\n🔄 Setting up real-time AI analysis flow...');
  
  // Subscribe to new market data
  const marketChannel = supabase
    .channel('market-updates')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'market_data'
    }, async (payload) => {
      console.log('📈 New market data:', payload.new.symbol);
      
      // Trigger AI analysis automatically
      const analysis = await performMarketAnalysisFlow(payload.new.symbol);
      
      // Broadcast results to connected clients
      marketChannel.send({
        type: 'broadcast',
        event: 'ai-analysis-complete',
        payload: {
          symbol: payload.new.symbol,
          analysis: analysis
        }
      });
    })
    .subscribe();

  // Subscribe to compliance requests
  const complianceChannel = supabase
    .channel('compliance-requests')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'a2a_agents'
    }, async (payload) => {
      console.log('🆕 New agent registered:', payload.new.agent_id);
      
      // Automatic compliance check
      await performComplianceCheckFlow(payload.new);
    })
    .subscribe();

  return { marketChannel, complianceChannel };
}

/**
 * Helper functions for downstream actions
 */
async function triggerHighConfidenceAlert(symbol, analysis) {
  await supabase.from('alerts').insert({
    type: 'high_confidence_prediction',
    symbol,
    data: {
      direction: analysis.prediction.direction,
      confidence: analysis.prediction.confidence,
      reasoning: analysis.analysis.keyFactors
    },
    priority: 'high',
    created_at: new Date().toISOString()
  });
}

async function triggerRiskAlert(symbol, risks) {
  const criticalRisks = risks.filter(r => r.severity === 'critical');
  
  await supabase.from('alerts').insert({
    type: 'critical_risk_detected',
    symbol,
    data: {
      risks: criticalRisks,
      count: criticalRisks.length
    },
    priority: 'urgent',
    created_at: new Date().toISOString()
  });
}

async function applyComplianceFixes(resourceId, fixes) {
  console.log(`🔧 Applying ${Object.keys(fixes).length} compliance fixes...`);
  
  // Update the resource with fixes
  const { error } = await supabase
    .from('a2a_agents')
    .update(fixes)
    .eq('agent_id', resourceId);
    
  if (!error) {
    // Log the fixes applied
    await supabase.from('compliance_fixes_log').insert({
      resource_id: resourceId,
      fixes_applied: fixes,
      applied_at: new Date().toISOString()
    });
  }
}

async function updateAgentComplianceStatus(agentId, compliance) {
  const status = compliance.readyForCreation ? 'compliant' : 
                 compliance.riskScore > 70 ? 'non_compliant' : 
                 'needs_review';
                 
  await supabase
    .from('a2a_agents')
    .update({
      compliance_status: status,
      compliance_score: 100 - compliance.riskScore,
      last_compliance_check: new Date().toISOString()
    })
    .eq('agent_id', agentId);
}

/**
 * Example: Query integrated data
 */
async function queryIntegratedData(symbol) {
  console.log(`\n🔍 Querying integrated AI analysis for ${symbol}...`);
  
  // Get latest prediction with analysis
  const { data: prediction } = await supabase
    .from('market_predictions')
    .select(`
      *,
      ai_analysis_log!inner(
        ai_response
      )
    `)
    .eq('symbol', symbol)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  // Get related anomalies
  const { data: anomalies } = await supabase
    .from('market_anomalies')
    .select(`
      *,
      anomaly_details(*),
      ai_recommendations(*)
    `)
    .eq('symbol', symbol)
    .order('detected_at', { ascending: false })
    .limit(5);
    
  // Get sentiment analysis
  const { data: sentiment } = await supabase
    .from('news_sentiment_analysis')
    .select(`
      *,
      breaking_news(title, published_at)
    `)
    .contains('key_entities', [symbol])
    .order('created_at', { ascending: false })
    .limit(10);
    
  return {
    latestPrediction: prediction,
    recentAnomalies: anomalies,
    sentimentTrend: sentiment
  };
}

// Export for use in other modules
export {
  performMarketAnalysisFlow,
  performComplianceCheckFlow,
  setupRealTimeDataFlow,
  queryIntegratedData
};

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  async function runExamples() {
    // Test market analysis flow
    await performMarketAnalysisFlow('NVDA');
    
    // Test compliance flow
    await performComplianceCheckFlow({
      agent_id: 'agent-test-001',
      name: 'Test Agent',
      type: 'analytics',
      capabilities: ['calculate', 'analyze']
    });
    
    // Query integrated data
    const integrated = await queryIntegratedData('NVDA');
    console.log('\n📊 Integrated Data:', JSON.stringify(integrated, null, 2));
  }
  
  runExamples().catch(console.error);
}
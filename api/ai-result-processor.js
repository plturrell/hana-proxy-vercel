/**
 * AI Result Background Processor
 * Processes AI analysis results asynchronously and triggers downstream actions
 */

import { createClient } from '@supabase/supabase-js';
import { 
  storeMarketAnalysis,
  storeComplianceAnalysis,
  storeAnomalyDetection,
  storeNewsAnalysis
} from '../lib/ai-to-database-mapper.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;

  try {
    switch (action) {
      case 'process_market_analysis':
        return await processMarketAnalysis(req, res);
      case 'process_compliance_analysis':
        return await processComplianceAnalysis(req, res);
      case 'process_anomaly_detection':
        return await processAnomalyDetection(req, res);
      case 'process_news_analysis':
        return await processNewsAnalysis(req, res);
      case 'trigger_alerts':
        return await triggerAlerts(req, res);
      case 'cleanup_old_data':
        return await cleanupOldData(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('AI result processing error:', error);
    return res.status(500).json({ 
      error: 'Processing failed',
      details: error.message 
    });
  }
}

/**
 * Process market analysis results
 */
async function processMarketAnalysis(req, res) {
  const { symbol, aiAnalysis, agentId, metadata } = req.body;
  
  console.log(`📊 Processing market analysis for ${symbol}...`);
  
  try {
    // Store in database
    const storageResult = await storeMarketAnalysis(symbol, aiAnalysis, agentId);
    
    // Trigger high-confidence alerts
    if (aiAnalysis.prediction.confidence > 0.8) {
      await triggerHighConfidenceAlert(symbol, aiAnalysis, agentId);
    }
    
    // Check for critical risks
    const criticalRisks = aiAnalysis.risks?.filter(r => r.severity === 'critical') || [];
    if (criticalRisks.length > 0) {
      await triggerRiskAlert(symbol, criticalRisks, agentId);
    }
    
    // Update agent performance metrics
    await updateAgentPerformance(agentId, 'market_analysis', aiAnalysis.prediction.confidence);
    
    // Trigger real-time updates
    const channel = supabase.channel('market-analysis-updates');
    await channel.send({
      type: 'broadcast',
      event: 'analysis-complete',
      payload: {
        symbol,
        sentiment: aiAnalysis.analysis.sentiment,
        confidence: aiAnalysis.prediction.confidence,
        direction: aiAnalysis.prediction.direction,
        timestamp: new Date().toISOString()
      }
    });
    
    return res.json({
      success: true,
      storage: storageResult,
      alertsTriggered: criticalRisks.length,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Market analysis processing failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Process compliance analysis results
 */
async function processComplianceAnalysis(req, res) {
  const { resourceId, aiCompliance, agentId } = req.body;
  
  console.log(`⚖️ Processing compliance analysis for ${resourceId}...`);
  
  try {
    // Store in database
    const storageResult = await storeComplianceAnalysis(resourceId, aiCompliance, agentId);
    
    // Apply auto-fixes if safe
    let fixesApplied = 0;
    if (aiCompliance.riskScore < 30 && Object.keys(aiCompliance.autoFixable || {}).length > 0) {
      fixesApplied = await applyComplianceFixes(resourceId, aiCompliance.autoFixable);
    }
    
    // Update compliance status
    await updateComplianceStatus(resourceId, aiCompliance);
    
    // Trigger compliance alerts for high-risk items
    if (aiCompliance.riskScore > 70) {
      await triggerComplianceAlert(resourceId, aiCompliance, agentId);
    }
    
    return res.json({
      success: true,
      storage: storageResult,
      fixesApplied,
      riskScore: aiCompliance.riskScore,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Compliance analysis processing failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Process anomaly detection results
 */
async function processAnomalyDetection(req, res) {
  const { symbol, aiAnomalies, agentId } = req.body;
  
  console.log(`🚨 Processing anomaly detection for ${symbol}...`);
  
  try {
    // Store in database
    const storageResult = await storeAnomalyDetection(symbol, aiAnomalies, agentId);
    
    // Process high-severity anomalies
    const criticalAnomalies = aiAnomalies.anomalies_detected?.filter(
      a => a.severity === 'critical'
    ) || [];
    
    if (criticalAnomalies.length > 0) {
      await triggerAnomalyAlert(symbol, criticalAnomalies, agentId);
    }
    
    // Update market status if extreme risk detected
    if (aiAnomalies.risk_assessment?.overall_risk === 'extreme') {
      await updateMarketStatus(symbol, 'high_risk', aiAnomalies);
    }
    
    // Trigger automated responses for certain anomaly types
    for (const anomaly of aiAnomalies.anomalies_detected || []) {
      if (anomaly.trading_implications?.suggested_action === 'sell') {
        await triggerTradeAlert(symbol, anomaly, agentId);
      }
    }
    
    return res.json({
      success: true,
      storage: storageResult,
      criticalAnomalies: criticalAnomalies.length,
      overallRisk: aiAnomalies.risk_assessment?.overall_risk,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Anomaly detection processing failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Process news analysis results
 */
async function processNewsAnalysis(req, res) {
  const { symbol, aiNewsAnalysis, newsArticles, agentId } = req.body;
  
  console.log(`📰 Processing news analysis for ${symbol}...`);
  
  try {
    // Store in database
    const storageResult = await storeNewsAnalysis(symbol, aiNewsAnalysis, newsArticles);
    
    // Trigger sentiment alerts for extreme sentiment
    if (['very_positive', 'very_negative'].includes(aiNewsAnalysis.sentiment)) {
      await triggerSentimentAlert(symbol, aiNewsAnalysis, agentId);
    }
    
    // Update entity sentiment tracking
    await updateEntitySentiment(symbol, aiNewsAnalysis);
    
    return res.json({
      success: true,
      storage: storageResult,
      sentiment: aiNewsAnalysis.sentiment,
      confidence: aiNewsAnalysis.confidence,
      processedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('News analysis processing failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Helper functions for downstream actions
 */

async function triggerHighConfidenceAlert(symbol, analysis, agentId) {
  const alert = {
    type: 'high_confidence_prediction',
    symbol,
    agent_id: agentId,
    severity: 'high',
    data: {
      direction: analysis.prediction.direction,
      confidence: analysis.prediction.confidence,
      sentiment: analysis.analysis.sentiment,
      factors: analysis.analysis.keyFactors
    },
    created_at: new Date().toISOString()
  };
  
  await supabase.from('alerts').insert(alert);
  console.log(`🚨 High confidence alert triggered for ${symbol}`);
}

async function triggerRiskAlert(symbol, risks, agentId) {
  for (const risk of risks) {
    const alert = {
      type: 'critical_risk_detected',
      symbol,
      agent_id: agentId,
      severity: 'critical',
      data: {
        risk_type: risk.type,
        description: risk.description,
        severity: risk.severity
      },
      created_at: new Date().toISOString()
    };
    
    await supabase.from('alerts').insert(alert);
  }
  
  console.log(`⚠️ ${risks.length} critical risk alerts triggered for ${symbol}`);
}

async function triggerComplianceAlert(resourceId, compliance, agentId) {
  const alert = {
    type: 'compliance_violation',
    resource_id: resourceId,
    agent_id: agentId,
    severity: compliance.riskScore > 90 ? 'critical' : 'high',
    data: {
      risk_score: compliance.riskScore,
      critical_issues: compliance.criticalIssues,
      recommendation: compliance.aiRecommendation
    },
    created_at: new Date().toISOString()
  };
  
  await supabase.from('alerts').insert(alert);
  console.log(`⚖️ Compliance alert triggered for ${resourceId}`);
}

async function applyComplianceFixes(resourceId, fixes) {
  try {
    // Apply fixes to the resource
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
      
      console.log(`🔧 Applied ${Object.keys(fixes).length} compliance fixes to ${resourceId}`);
      return Object.keys(fixes).length;
    }
  } catch (error) {
    console.error('Failed to apply compliance fixes:', error);
  }
  
  return 0;
}

async function updateAgentPerformance(agentId, analysisType, confidence) {
  const performanceUpdate = {
    agent_id: agentId,
    analysis_type: analysisType,
    confidence_score: confidence,
    timestamp: new Date().toISOString()
  };
  
  await supabase.from('agent_performance_log').insert(performanceUpdate);
}

async function updateComplianceStatus(resourceId, compliance) {
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
    .eq('agent_id', resourceId);
}

async function triggerAlerts(req, res) {
  // Process pending alerts and notifications
  console.log('🔔 Processing pending alerts...');
  
  // Implementation for alert processing
  return res.json({ 
    success: true, 
    alertsProcessed: 0,
    processedAt: new Date().toISOString()
  });
}

async function cleanupOldData(req, res) {
  console.log('🧹 Cleaning up old AI analysis data...');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
  
  try {
    // Clean up old analysis logs
    const { error: logError } = await supabase
      .from('ai_analysis_log')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
      
    // Clean up resolved compliance predictions
    const { error: complianceError } = await supabase
      .from('compliance_predictions')
      .delete()
      .not('resolved_at', 'is', null)
      .lt('resolved_at', cutoffDate.toISOString());
      
    console.log('✅ Cleanup completed');
    
    return res.json({
      success: true,
      cleanedAt: new Date().toISOString(),
      errors: [logError, complianceError].filter(Boolean)
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
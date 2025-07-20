/**
 * Deep Research Intelligence API
 * Uses Perplexity's sonar-deep-research for comprehensive financial analysis
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, symbol, query } = req.query;

  try {
    switch (action) {
      case 'company-research':
        return await deepCompanyResearch(req, res, symbol);
      case 'market-analysis':
        return await deepMarketAnalysis(req, res, query);
      case 'risk-assessment':
        return await deepRiskAssessment(req, res, symbol);
      case 'investment-due-diligence':
        return await investmentDueDiligence(req, res, symbol);
      case 'competitive-intelligence':
        return await competitiveIntelligence(req, res, symbol);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Deep research error:', error);
    return res.status(500).json({ 
      error: 'Research failed',
      details: error.message 
    });
  }
}

/**
 * Comprehensive company research using hundreds of sources
 */
async function deepCompanyResearch(req, res, symbol) {
  if (!PERPLEXITY_API_KEY) {
    return res.status(400).json({ error: 'Deep research requires Perplexity API key' });
  }

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Conduct comprehensive research on ${symbol} including: financial performance, competitive position, management analysis, growth prospects, risk factors, recent developments, analyst opinions, and investment outlook. Provide a detailed investment research report.`
          }
        ],
        reasoning_effort: 'high',
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Store the research in database
    await supabase.from('deep_research_reports').insert({
      symbol,
      report_type: 'company_research',
      content: analysis,
      sources_count: data.citations?.length || 0,
      citations: data.citations || [],
      search_context: data.search_results || [],
      created_at: new Date().toISOString()
    });

    return res.json({
      symbol,
      report_type: 'comprehensive_company_research',
      analysis,
      metadata: {
        sources_analyzed: data.citations?.length || 0,
        search_context_size: data.usage?.search_context_size || 'high',
        reasoning_tokens: data.usage?.reasoning_tokens || 0,
        research_depth: 'exhaustive'
      },
      citations: data.citations || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Company research error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Deep market analysis across multiple sources
 */
async function deepMarketAnalysis(req, res, query) {
  if (!PERPLEXITY_API_KEY) {
    return res.status(400).json({ error: 'Deep research requires Perplexity API key' });
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Conduct exhaustive market research on: ${query}. Analyze market trends, key players, growth drivers, challenges, regulatory environment, technological disruption, investment opportunities, and provide strategic insights with supporting data from multiple authoritative sources.`
          }
        ],
        reasoning_effort: 'high',
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();

    return res.json({
      query,
      report_type: 'comprehensive_market_analysis',
      analysis: data.choices[0].message.content,
      metadata: {
        sources_analyzed: data.citations?.length || 0,
        research_depth: 'exhaustive',
        analysis_type: 'multi_source_synthesis'
      },
      citations: data.citations || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Deep risk assessment with multi-source analysis
 */
async function deepRiskAssessment(req, res, symbol) {
  if (!PERPLEXITY_API_KEY) {
    return res.status(400).json({ error: 'Deep research requires Perplexity API key' });
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Conduct comprehensive risk assessment for ${symbol} investment. Analyze: financial risks, operational risks, regulatory risks, competitive threats, market risks, ESG factors, management risks, supply chain vulnerabilities, and provide detailed risk mitigation strategies with probability assessments.`
          }
        ],
        reasoning_effort: 'high',
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();

    return res.json({
      symbol,
      report_type: 'comprehensive_risk_assessment',
      analysis: data.choices[0].message.content,
      metadata: {
        risk_factors_analyzed: 'comprehensive',
        sources_count: data.citations?.length || 0,
        assessment_depth: 'exhaustive'
      },
      citations: data.citations || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Investment due diligence with exhaustive research
 */
async function investmentDueDiligence(req, res, symbol) {
  if (!PERPLEXITY_API_KEY) {
    return res.status(400).json({ error: 'Deep research requires Perplexity API key' });
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Perform institutional-grade investment due diligence on ${symbol}. Research: financial statement analysis, business model sustainability, competitive moats, management track record, governance structure, growth catalysts, valuation metrics, peer comparisons, regulatory compliance, and provide investment recommendation with supporting rationale.`
          }
        ],
        reasoning_effort: 'high',
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();

    return res.json({
      symbol,
      report_type: 'investment_due_diligence',
      analysis: data.choices[0].message.content,
      metadata: {
        diligence_scope: 'institutional_grade',
        sources_analyzed: data.citations?.length || 0,
        research_methodology: 'exhaustive_multi_source'
      },
      citations: data.citations || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Due diligence error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Competitive intelligence analysis
 */
async function competitiveIntelligence(req, res, symbol) {
  if (!PERPLEXITY_API_KEY) {
    return res.status(400).json({ error: 'Deep research requires Perplexity API key' });
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'user',
            content: `Conduct competitive intelligence analysis for ${symbol}. Research: main competitors, market share analysis, competitive advantages/disadvantages, pricing strategies, product differentiation, strategic partnerships, technological capabilities, financial performance comparisons, and emerging competitive threats.`
          }
        ],
        reasoning_effort: 'high',
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();

    return res.json({
      symbol,
      report_type: 'competitive_intelligence',
      analysis: data.choices[0].message.content,
      metadata: {
        intelligence_scope: 'comprehensive',
        competitive_landscape: 'detailed',
        sources_count: data.citations?.length || 0
      },
      citations: data.citations || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Competitive intelligence error:', error);
    return res.status(500).json({ error: error.message });
  }
}
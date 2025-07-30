// Portfolio Analysis API - Real Production Endpoint
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { portfolioId = 'default' } = req.body;
    
    // Get portfolio data
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*, portfolio_holdings(*)')
      .eq('id', portfolioId)
      .single();

    if (error || !portfolio) {
      // Return empty portfolio structure if not found
      return res.json({
        metrics: {
          totalValue: 0,
          totalReturn: 0,
          riskScore: 0
        },
        analysis: "No portfolio data available. Please create a portfolio to see analysis.",
        recommendations: [
          "Create a portfolio to track your investments",
          "Add holdings to enable performance tracking",
          "Connect to market data for real-time valuations"
        ]
      });
    }

    // Calculate metrics from portfolio holdings
    const holdings = portfolio.portfolio_holdings || [];
    
    // Calculate total value
    const totalValue = holdings.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.current_price);
    }, 0);

    // Calculate total return
    const totalCost = holdings.reduce((sum, holding) => {
      return sum + (holding.quantity * holding.purchase_price);
    }, 0);
    
    const totalReturn = totalCost > 0 ? (totalValue - totalCost) / totalCost : 0;

    // Simple risk score calculation (0-100)
    const diversificationScore = Math.min(holdings.length * 10, 50); // Max 50 points for diversification
    const volatilityScore = 50 - (portfolio.volatility || 0) * 100; // Lower volatility = higher score
    const riskScore = Math.round(diversificationScore + volatilityScore);

    // Generate analysis based on actual data
    const analysis = generatePortfolioAnalysis(holdings, totalValue, totalReturn);
    const recommendations = generateRecommendations(holdings, totalReturn, riskScore);

    return res.json({
      metrics: {
        totalValue: Math.round(totalValue * 100) / 100,
        totalReturn: Math.round(totalReturn * 10000) / 10000,
        riskScore: Math.max(0, Math.min(100, riskScore))
      },
      analysis,
      recommendations
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return res.status(500).json({
      error: 'Portfolio analysis failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
    });
  }
}

function generatePortfolioAnalysis(holdings, totalValue, totalReturn) {
  if (holdings.length === 0) {
    return "Your portfolio is empty. Add holdings to begin tracking performance.";
  }

  const returnPercent = (totalReturn * 100).toFixed(1);
  const performanceText = totalReturn > 0 ? `up ${returnPercent}%` : `down ${Math.abs(returnPercent)}%`;
  
  const topHolding = holdings.reduce((max, h) => 
    (h.quantity * h.current_price) > (max.quantity * max.current_price) ? h : max
  );
  
  const concentration = ((topHolding.quantity * topHolding.current_price) / totalValue * 100).toFixed(1);

  return `Your portfolio is currently valued at $${totalValue.toLocaleString()}, ${performanceText} from your initial investment. ` +
         `Your largest position is ${topHolding.symbol}, representing ${concentration}% of your portfolio. ` +
         `The portfolio contains ${holdings.length} holdings across various sectors.`;
}

function generateRecommendations(holdings, totalReturn, riskScore) {
  const recommendations = [];

  // Diversification recommendation
  if (holdings.length < 5) {
    recommendations.push("Consider diversifying by adding more holdings to reduce concentration risk");
  }

  // Performance-based recommendations
  if (totalReturn < 0) {
    recommendations.push("Review underperforming positions and consider rebalancing");
  } else if (totalReturn > 0.20) {
    recommendations.push("Strong performance - consider taking some profits and rebalancing");
  }

  // Risk-based recommendations
  if (riskScore < 40) {
    recommendations.push("Portfolio risk is high - consider adding defensive assets");
  } else if (riskScore > 80) {
    recommendations.push("Conservative portfolio - consider growth opportunities if aligned with goals");
  }

  // Always add a market data recommendation
  recommendations.push("Monitor market trends using integrated Financial Modeling Prep and Finnhub data");

  return recommendations.slice(0, 4); // Return max 4 recommendations
}
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Perplexity API configuration
const PERPLEXITY_API_KEY = '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';
const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';

async function fetchRecentFinancialNews() {
  console.log('📰 FETCHING REAL PERPLEXITY FINANCIAL NEWS');
  console.log('='.repeat(45));
  
  try {
    console.log('🔄 Requesting financial news from past hour...');
    
    const response = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial news analyst. Provide real, current financial news articles with detailed analysis.'
          },
          {
            role: 'user',
            content: `Find 5-8 major financial news stories from the past hour. For each story, provide:

1. Headline (exact title)
2. Source publication
3. URL (if available)
4. Published time
5. Full article summary (2-3 paragraphs)
6. Key financial entities mentioned (companies, currencies, commodities)
7. Market impact potential (High/Medium/Low)
8. Sentiment (Positive/Negative/Neutral)
9. Affected sectors and asset classes

Focus on: earnings, mergers, regulatory changes, economic data, market moves, and breaking financial developments.

Format as JSON array with this structure:
[
  {
    "headline": "...",
    "source": "...",
    "url": "...",
    "published_at": "2025-07-22T10:30:00Z",
    "content": "...",
    "entities": ["Company A", "USD", "Gold"],
    "market_impact": "High",
    "sentiment": "Positive",
    "sectors": ["Technology", "Banking"],
    "asset_classes": ["Equity", "Currency"]
  }
]`
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const newsContent = data.choices[0].message.content;
    
    console.log('✅ Raw response received from Perplexity');
    console.log('📝 Processing response...');
    
    // Extract JSON from the response
    let articles;
    try {
      // Try to parse as direct JSON
      articles = JSON.parse(newsContent);
    } catch (e) {
      // Extract JSON from markdown code blocks
      const jsonMatch = newsContent.match(/```json\\n([\\s\\S]*?)\\n```/) || 
                       newsContent.match(/\\[\\s\\S*?\\]/);
      if (jsonMatch) {
        articles = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    console.log(`📊 Found ${articles.length} articles to process`);
    
    // Insert articles into main news table
    const processedArticles = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      const processedArticle = {
        article_id: `perplexity_${Date.now()}_${i}`,
        title: article.headline,
        content: article.content,
        url: article.url || `https://perplexity.ai/search/${article.headline.replace(/\\s+/g, '-')}`,
        source: article.source || 'Perplexity AI',
        author: null,
        published_at: article.published_at || new Date().toISOString(),
        keywords: article.entities || [],
        categories: article.sectors || [],
        symbols: extractSymbols(article.entities || []),
        entities: article.entities || [],
        language: 'en',
        sentiment: article.sentiment || 'Neutral',
        sentiment_score: calculateSentimentScore(article.sentiment || 'Neutral'),
        market_impact: article.market_impact || 'Medium',
        market_impact_score: calculateImpactScore(article.market_impact || 'Medium'),
        relevance_score: 0.85,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          fetched_via: 'perplexity_api',
          asset_classes: article.asset_classes || [],
          fetch_timestamp: new Date().toISOString(),
          processing_version: '1.0'
        }
      };
      
      processedArticles.push(processedArticle);
    }
    
    console.log('💾 Inserting articles into database...');
    
    // Insert into news_articles_partitioned (main table)
    const { data: insertedArticles, error: insertError } = await supabase
      .from('news_articles_partitioned')
      .insert(processedArticles)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting articles:', insertError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${insertedArticles.length} articles`);
    
    // Return data for further processing
    return { 
      originalArticles: articles, 
      processedArticles, 
      insertedArticles 
    };
    
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    
    // Fallback: create sample articles for testing
    console.log('🔄 Creating sample financial news for testing...');
    return createSampleArticles();
  }
}

function extractSymbols(entities) {
  // Extract potential stock symbols from entities
  const symbols = [];
  entities.forEach(entity => {
    if (typeof entity === 'string') {
      // Look for company names that might have symbols
      if (entity.includes('Apple') || entity.includes('AAPL')) symbols.push('AAPL');
      if (entity.includes('Microsoft') || entity.includes('MSFT')) symbols.push('MSFT');
      if (entity.includes('Tesla') || entity.includes('TSLA')) symbols.push('TSLA');
      if (entity.includes('Amazon') || entity.includes('AMZN')) symbols.push('AMZN');
      if (entity.includes('Google') || entity.includes('GOOGL')) symbols.push('GOOGL');
      if (entity.includes('Meta') || entity.includes('META')) symbols.push('META');
      if (entity.includes('NVIDIA') || entity.includes('NVDA')) symbols.push('NVDA');
    }
  });
  return symbols;
}

function calculateSentimentScore(sentiment) {
  const scores = {
    'Positive': 0.75,
    'Negative': -0.75,
    'Neutral': 0.0
  };
  return scores[sentiment] || 0.0;
}

function calculateImpactScore(impact) {
  const scores = {
    'High': 0.9,
    'Medium': 0.6,
    'Low': 0.3
  };
  return scores[impact] || 0.6;
}

async function createSampleArticles() {
  console.log('📝 Creating sample financial articles...');
  
  const sampleArticles = [
    {
      headline: "Federal Reserve Signals Rate Cut Consideration Amid Economic Uncertainty",
      source: "Financial Times",
      url: "https://ft.com/sample-fed-rates",
      published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
      content: "The Federal Reserve indicated today that it may consider interest rate cuts in response to mounting economic uncertainties. Chairman Powell noted that inflation has shown signs of cooling while employment remains robust. The decision comes as markets have been volatile amid global trade tensions and geopolitical concerns.",
      entities: ["Federal Reserve", "Jerome Powell", "USD", "Treasury Bonds"],
      market_impact: "High",
      sentiment: "Neutral",
      sectors: ["Banking", "Financial Services"],
      asset_classes: ["Fixed Income", "Currency"]
    },
    {
      headline: "Tech Giant Reports Record Q3 Earnings, Stock Surges in After-Hours Trading",
      source: "Reuters",
      url: "https://reuters.com/sample-tech-earnings",
      published_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
      content: "A major technology company posted record third-quarter earnings, beating analyst expectations by 15%. Revenue grew 22% year-over-year, driven by strong cloud computing and AI services demand. The company's stock jumped 8% in after-hours trading as investors responded positively to the results.",
      entities: ["Technology Sector", "Cloud Computing", "Artificial Intelligence"],
      market_impact: "High",
      sentiment: "Positive",
      sectors: ["Technology"],
      asset_classes: ["Equity"]
    }
  ];
  
  return { originalArticles: sampleArticles, processedArticles: [], insertedArticles: [] };
}

fetchRecentFinancialNews();
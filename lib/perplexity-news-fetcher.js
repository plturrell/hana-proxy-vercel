/**
 * Perplexity News Fetcher - Real Implementation
 * Fetches current financial news using Perplexity API only
 */

import fetch from 'node-fetch';

export class PerplexityNewsFetcher {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
  }

  /**
   * Fetch real current financial news from Perplexity
   */
  async fetchCurrentFinancialNews(symbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'META', 'AMZN']) {
    if (!this.apiKey || this.apiKey === 'YOUR_PERPLEXITY_API_KEY') {
      throw new Error('Valid Perplexity API key required');
    }

    console.log('📡 Fetching current financial news from Perplexity...');
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: `What are recent financial news updates about ${symbols.join(', ')} stocks? Focus on earnings, partnerships, product launches, or market moves.`
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Perplexity API error ${response.status}: ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const searchResults = data.search_results || [];
      
      // Convert search results to news items
      const newsItems = searchResults.map((result, index) => {
        const publishDate = new Date(result.date || result.last_updated || new Date());
        const ageHours = Math.round((new Date() - publishDate) / (1000 * 60 * 60));
        
        // Extract entities from content based on symbols
        const mentionedSymbols = symbols.filter(symbol => 
          content.toLowerCase().includes(symbol.toLowerCase()) ||
          result.title.toLowerCase().includes(symbol.toLowerCase())
        );
        
        // Determine market impact from content sentiment
        const positiveWords = ['up', 'gain', 'rise', 'surge', 'bull', 'positive', 'growth', 'record'];
        const negativeWords = ['down', 'fall', 'drop', 'decline', 'bear', 'negative', 'loss', 'crash'];
        
        const titleLower = result.title.toLowerCase();
        const hasPositive = positiveWords.some(word => titleLower.includes(word));
        const hasNegative = negativeWords.some(word => titleLower.includes(word));
        
        let marketImpact = 'neutral';
        if (hasPositive && !hasNegative) marketImpact = 'positive';
        else if (hasNegative && !hasPositive) marketImpact = 'negative';
        
        return {
          title: result.title,
          summary: `Recent ${mentionedSymbols.length > 0 ? mentionedSymbols.join(', ') : 'market'} update from ${result.url.includes('youtube') ? 'Video' : 'News'} source`,
          published_at: publishDate.toISOString(),
          source: result.url.includes('youtube') ? 'YouTube' : result.url.split('/')[2] || 'Unknown',
          entities: mentionedSymbols,
          market_impact: marketImpact,
          url: result.url,
          age_hours: ageHours,
          confidence: 0.85,
          api_source: 'perplexity'
        };
      });

      // Filter and return recent news items
      const validatedNews = newsItems
        .filter(item => item.title && item.published_at)
        .filter(item => item.age_hours <= 168); // Keep news from last 7 days

      console.log(`✅ Perplexity: Found ${validatedNews.length} current financial news items`);
      
      return validatedNews;

    } catch (error) {
      console.error('❌ Perplexity news fetch failed:', error.message);
      throw error;
    }
  }

  /**
   * Get news about a specific event or topic
   */
  async getNewsAboutTopic(topic, symbols = []) {
    if (!this.apiKey || this.apiKey === 'YOUR_PERPLEXITY_API_KEY') {
      throw new Error('Valid Perplexity API key required');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: `Find recent news about "${topic}"${symbols.length > 0 ? ` related to ${symbols.join(', ')}` : ''}.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const searchResults = data.search_results || [];
      
      return searchResults.map(result => ({
        title: result.title,
        summary: `News about ${topic}`,
        published_at: new Date(result.date || result.last_updated || new Date()).toISOString(),
        source: result.url.split('/')[2] || 'Unknown',
        entities: symbols.filter(symbol => 
          result.title.toLowerCase().includes(symbol.toLowerCase())
        ),
        relevance_score: symbols.length > 0 ? 
          symbols.filter(s => result.title.toLowerCase().includes(s.toLowerCase())).length / symbols.length : 0.5
      }));

    } catch (error) {
      console.error('Topic news fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Normalize date to ISO format
   */
  normalizeDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If invalid date, use current time
        return new Date().toISOString();
      }
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Calculate how many hours ago the news was published
   */
  calculateAgeHours(publishedAt) {
    try {
      const publishedDate = new Date(publishedAt);
      const now = new Date();
      return Math.round((now - publishedDate) / (1000 * 60 * 60));
    } catch {
      return 0;
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.apiKey !== 'YOUR_PERPLEXITY_API_KEY');
  }
}

/**
 * Create configured Perplexity news fetcher
 */
export function createPerplexityNewsFetcher(apiKey = process.env.PERPLEXITY_API_KEY) {
  return new PerplexityNewsFetcher(apiKey);
}
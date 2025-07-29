import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Fetching news from Perplexity AI...');
        
        // Call Perplexity API to get real-time financial news
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a financial news analyst. Search for and provide the latest financial news from reputable sources. Include source citations.'
                    },
                    {
                        role: 'user',
                        content: 'Find the latest financial news from the past 24 hours. Focus on: stock market movements, Federal Reserve decisions, major tech companies (Apple, Microsoft, Tesla, etc), cryptocurrency, and economic indicators. Provide 5-7 articles with title, source, summary, and a sentiment score from -1 (very negative) to 1 (very positive).'
                    }
                ],
                temperature: 0.2,
                max_tokens: 2000,
                return_citations: true,
                search_recency_filter: 'day'
            })
        });

        if (!perplexityResponse.ok) {
            throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
        }

        const perplexityData = await perplexityResponse.json();
        const content = perplexityData.choices[0].message.content;
        const citations = perplexityData.citations || [];

        console.log('Perplexity response received, processing...');

        // Parse the news from Perplexity's response
        const newsArticles = parsePerplexityResponse(content, citations);

        // Clear old news
        await supabase
            .from('news_articles')
            .delete()
            .neq('article_id', '00000000-0000-0000-0000-000000000000');

        // Insert new articles
        const articlesToInsert = newsArticles.map(article => ({
            article_id: crypto.randomUUID(),
            title: article.title,
            source: article.source,
            url: article.url || citations.find(c => c.title === article.title)?.url || '#',
            content: article.summary,
            published_at: new Date().toISOString(),
            sentiment_score: article.sentiment || 0,
            entities: JSON.stringify(article.entities || []),
            relevance_score: 0.95
        }));

        const { data, error } = await supabase
            .from('news_articles')
            .insert(articlesToInsert)
            .select();

        if (error) {
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'News updated from Perplexity AI',
            articlesCount: data.length,
            articles: data
        });

    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({
            error: 'Failed to update news',
            details: error.message
        });
    }
}

function parsePerplexityResponse(content, citations) {
    // Extract structured data from Perplexity's response
    const articles = [];
    
    // Simple parsing - in production this would be more sophisticated
    const lines = content.split('\n');
    let currentArticle = null;
    
    lines.forEach(line => {
        if (line.match(/^\d+\./)) {
            // New article
            if (currentArticle) {
                articles.push(currentArticle);
            }
            currentArticle = {
                title: line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim(),
                source: '',
                summary: '',
                sentiment: 0,
                entities: []
            };
        } else if (line.includes('Source:')) {
            if (currentArticle) {
                currentArticle.source = line.replace('Source:', '').trim();
            }
        } else if (line.includes('Sentiment:')) {
            if (currentArticle) {
                const sentimentMatch = line.match(/-?\d+\.?\d*/);
                if (sentimentMatch) {
                    currentArticle.sentiment = parseFloat(sentimentMatch[0]);
                }
            }
        } else if (currentArticle && line.trim()) {
            currentArticle.summary += line.trim() + ' ';
        }
    });
    
    if (currentArticle) {
        articles.push(currentArticle);
    }
    
    // Extract entities
    articles.forEach(article => {
        const entities = [];
        const entityPatterns = [
            /Apple|Microsoft|Google|Amazon|Tesla|Meta|Netflix/gi,
            /Federal Reserve|Fed|ECB|Bank of England/gi,
            /S&P 500|Nasdaq|Dow Jones|FTSE|DAX/gi,
            /Bitcoin|Ethereum|cryptocurrency/gi
        ];
        
        entityPatterns.forEach(pattern => {
            const matches = (article.title + ' ' + article.summary).match(pattern);
            if (matches) {
                entities.push(...new Set(matches));
            }
        });
        
        article.entities = entities;
    });
    
    return articles;
}
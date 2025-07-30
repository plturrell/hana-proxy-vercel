/**
 * Simplified Perplexity News Endpoint for iOS App
 * Writes directly to news_articles table that iOS app expects
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Fetching news from Perplexity AI...');
        
        if (!process.env.PERPLEXITY_API_KEY) {
            throw new Error('PERPLEXITY_API_KEY not configured - cannot fetch real news data');
        }
        
        // Call Perplexity API to get real-time financial news
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a financial news analyst. Search for and provide the latest financial news from reputable sources. Include source citations.'
                    },
                    {
                        role: 'user',
                        content: 'Find the latest financial news from the past 2 hours. Focus on: stock market movements, Federal Reserve decisions, major tech companies (Apple, Microsoft, Tesla, etc), cryptocurrency, and economic indicators. Provide 5-7 articles with title, source, summary, and a sentiment score from -1 (very negative) to 1 (very positive). Format as JSON array.'
                    }
                ],
                temperature: 0.2,
                max_tokens: 2000,
                return_citations: true,
                return_related_questions: false,
                search_recency_filter: 'day'
            })
        });

        if (!perplexityResponse.ok) {
            throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
        }

        const perplexityData = await perplexityResponse.json();
        const content = perplexityData.choices[0].message.content;
        const citations = perplexityData.citations || [];

        console.log('Perplexity API response:', content);
        console.log('Citations:', citations);

        // Since Perplexity doesn't return structured JSON, parse the text response
        // and create articles from citations
        const articles = [];
        
        if (citations && citations.length > 0) {
            // Create articles from citations
            for (let i = 0; i < Math.min(citations.length, 7); i++) {
                const citation = citations[i];
                articles.push({
                    title: `Financial News Update ${i + 1}`,
                    content: content.substring(i * 200, (i + 1) * 200) + '...',
                    url: citation,
                    source: 'Perplexity AI',
                    sentiment_score: 0 // Neutral for now
                });
            }
        } else {
            // If no citations, create articles from content segments
            const sentences = content.split('.').filter(s => s.length > 50);
            for (let i = 0; i < Math.min(sentences.length, 5); i++) {
                articles.push({
                    title: `Market Update: ${sentences[i].substring(0, 60)}...`,
                    content: sentences[i].trim() + '.',
                    url: '#',
                    source: 'Perplexity AI',
                    sentiment_score: 0
                });
            }
        }

        if (!articles || articles.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No articles found',
                articlesCount: 0
            });
        }

        // Clear old articles (older than 24 hours)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        await supabase
            .from('news_articles')
            .delete()
            .lt('published_at', yesterday);

        // Insert new articles into news_articles table (what iOS app expects)
        let insertedCount = 0;
        for (const article of articles) {
            const newsArticle = {
                article_id: crypto.randomUUID(),
                title: article.title,
                content: article.summary || article.content,
                url: article.url || citations[insertedCount] || '#',
                source: article.source || 'Perplexity AI',
                published_at: new Date().toISOString(),
                sentiment_score: article.sentiment_score || 0,
                entities: JSON.stringify(extractEntities(article.content || article.summary)),
                relevance_score: 0.9,
                processed_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('news_articles')
                .insert(newsArticle);

            if (!error) {
                insertedCount++;
            } else {
                console.error('Error inserting article:', error);
            }
        }

        console.log(`Successfully inserted ${insertedCount} articles from Perplexity`);

        return res.status(200).json({
            success: true,
            message: 'News updated from Perplexity AI',
            articlesCount: insertedCount,
            articles: articles.slice(0, insertedCount)
        });

    } catch (error) {
        console.error('Error in perplexity-news-simple:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch news from Perplexity'
        });
    }
}

function extractEntities(content) {
    const entities = [];
    const patterns = [
        /Federal Reserve|Fed|FOMC/gi,
        /S&P 500|Nasdaq|Dow Jones/gi,
        /Apple|AAPL|Microsoft|MSFT|Google|GOOGL|Amazon|AMZN|Tesla|TSLA/gi,
        /Bitcoin|Ethereum|cryptocurrency/gi,
        /inflation|interest rates|GDP/gi
    ];
    
    patterns.forEach(pattern => {
        const matches = content ? content.match(pattern) : null;
        if (matches) {
            entities.push(...new Set(matches));
        }
    });
    
    return entities;
}
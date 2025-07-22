/**
 * Rating and Review API with Feedback Loop
 * User ratings directly influence AI behavior and curriculum
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { method } = req;
  const userId = req.headers['x-user-id'];

  if (!userId && method !== 'GET') {
    return res.status(401).json({ error: 'Authentication required' });
  }

  switch (method) {
    case 'GET':
      return await getReviews(req, res);
    case 'POST':
      return await createRatingReview(req, res, userId);
    case 'PUT':
      return await updateRatingReview(req, res, userId);
    case 'PATCH':
      return await markHelpful(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Create a new rating and review
 */
async function createRatingReview(req, res, userId) {
  const {
    content_type,
    content_id,
    rating,
    usefulness,
    clarity,
    depth,
    practical_value,
    title,
    review_text,
    time_spent_seconds,
    completion_percentage
  } = req.body;

  try {
    // Validate rating
    if (!rating || rating < 1 || rating > 100) {
      return res.status(400).json({ error: 'Rating must be between 1 and 100' });
    }

    // Start transaction
    const { data: ratingData, error: ratingError } = await supabase
      .from('content_ratings')
      .insert({
        user_id: userId,
        content_type,
        content_id,
        rating,
        usefulness,
        clarity,
        depth,
        practical_value,
        time_spent_seconds,
        completion_percentage
      })
      .select()
      .single();

    if (ratingError) throw ratingError;

    // Create review if provided
    let reviewData = null;
    if (review_text) {
      // Analyze review sentiment and extract insights
      const analysis = await analyzeReview(review_text);

      const { data: review, error: reviewError } = await supabase
        .from('user_reviews')
        .insert({
          user_id: userId,
          content_type,
          content_id,
          rating_id: ratingData.id,
          title,
          review_text,
          sentiment_score: analysis.sentiment,
          key_topics: analysis.topics,
          suggestions: analysis.suggestions
        })
        .select()
        .single();

      if (reviewError) throw reviewError;
      reviewData = review;

      // Feed insights back to curriculum agent
      await feedbackToCurriculum(content_type, content_id, analysis, rating);
    }

    // Update content statistics
    await updateContentStats(content_type, content_id);

    // Check if this affects AI behavior
    await adjustAIBehavior(content_type, content_id, rating, reviewData);

    return res.status(201).json({
      rating: ratingData,
      review: reviewData,
      impact: {
        curriculum_updated: true,
        ai_behavior_adjusted: rating < 70 // AI adjusts for low ratings
      }
    });
  } catch (error) {
    console.error('Failed to create rating/review:', error);
    return res.status(500).json({ error: 'Failed to create rating/review' });
  }
}

/**
 * Analyze review text for insights
 */
async function analyzeReview(reviewText) {
  // In production, this would use NLP/AI
  // For now, simple keyword extraction
  const positiveWords = ['excellent', 'great', 'helpful', 'clear', 'useful', 'comprehensive'];
  const negativeWords = ['confusing', 'unclear', 'difficult', 'lacking', 'poor', 'incomplete'];
  const suggestionPhrases = ['should', 'could', 'needs', 'would be better', 'missing'];

  const words = reviewText.toLowerCase().split(/\s+/);
  
  // Calculate sentiment
  let sentiment = 0;
  words.forEach(word => {
    if (positiveWords.includes(word)) sentiment += 0.2;
    if (negativeWords.includes(word)) sentiment -= 0.2;
  });
  sentiment = Math.max(-1, Math.min(1, sentiment));

  // Extract topics (simple version)
  const topics = [];
  if (reviewText.match(/calculation|formula|math/i)) topics.push('calculations');
  if (reviewText.match(/example|practical|real.world/i)) topics.push('examples');
  if (reviewText.match(/explanation|clarity|understand/i)) topics.push('clarity');
  if (reviewText.match(/visual|chart|graph/i)) topics.push('visualization');

  // Extract suggestions
  const suggestions = [];
  suggestionPhrases.forEach(phrase => {
    const regex = new RegExp(`${phrase}[^.]+`, 'gi');
    const matches = reviewText.match(regex);
    if (matches) {
      suggestions.push(...matches.map(m => m.trim()));
    }
  });

  return {
    sentiment,
    topics,
    suggestions: suggestions.slice(0, 3) // Limit to 3 suggestions
  };
}

/**
 * Feed review insights back to curriculum system
 */
async function feedbackToCurriculum(contentType, contentId, analysis, rating) {
  try {
    // Create curriculum feedback entry
    await supabase.from('curriculum_feedback').insert({
      content_type: contentType,
      content_id: contentId,
      feedback_type: 'user_review',
      rating,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      suggestions: analysis.suggestions,
      created_at: new Date().toISOString()
    });

    // If rating is low, create improvement task
    if (rating < 60) {
      await supabase.from('curriculum_improvements').insert({
        content_type: contentType,
        content_id: contentId,
        priority: rating < 40 ? 'high' : 'medium',
        improvement_type: 'content_quality',
        description: `Low rating (${rating}/100). User suggestions: ${analysis.suggestions.join('; ')}`,
        status: 'pending'
      });
    }

    // Update curriculum agent's knowledge
    await fetch(`${process.env.VERCEL_URL}/api/agents/curriculum-learning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'learn_from_feedback',
        data: {
          content_type: contentType,
          content_id: contentId,
          rating,
          analysis
        }
      })
    });
  } catch (error) {
    console.error('Failed to feedback to curriculum:', error);
  }
}

/**
 * Adjust AI behavior based on ratings
 */
async function adjustAIBehavior(contentType, contentId, rating, review) {
  try {
    // Track pattern of low ratings
    if (rating < 70) {
      // Get recent ratings for this content type
      const { data: recentRatings } = await supabase
        .from('content_ratings')
        .select('rating')
        .eq('content_type', contentType)
        .order('created_at', { ascending: false })
        .limit(10);

      const avgRating = recentRatings.reduce((sum, r) => sum + r.rating, 0) / recentRatings.length;

      // If consistently low, adjust AI parameters
      if (avgRating < 65) {
        await supabase.from('ai_behavior_adjustments').insert({
          adjustment_type: 'content_generation',
          content_type: contentType,
          reason: 'low_user_ratings',
          parameters: {
            increase_detail: true,
            add_more_examples: true,
            simplify_language: review?.suggestions?.some(s => s.includes('confusing')),
            average_rating: avgRating
          },
          created_at: new Date().toISOString()
        });

        // Notify AI agents to reload parameters
        await notifyAIAgents('behavior_adjustment', contentType);
      }
    }

    // Track high-performing content
    if (rating >= 90) {
      await supabase.from('ai_behavior_adjustments').insert({
        adjustment_type: 'content_pattern',
        content_type: contentType,
        reason: 'high_user_rating',
        parameters: {
          exemplar_content_id: contentId,
          rating: rating,
          key_factors: review?.key_topics || []
        }
      });
    }
  } catch (error) {
    console.error('Failed to adjust AI behavior:', error);
  }
}

/**
 * Update content statistics
 */
async function updateContentStats(contentType, contentId) {
  try {
    // Calculate new average rating
    const { data: ratings } = await supabase
      .from('content_ratings')
      .select('rating, usefulness, clarity, depth, practical_value')
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (!ratings || ratings.length === 0) return;

    const stats = {
      total_ratings: ratings.length,
      average_rating: ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length,
      average_usefulness: ratings.reduce((sum, r) => sum + (r.usefulness || 0), 0) / ratings.length,
      average_clarity: ratings.reduce((sum, r) => sum + (r.clarity || 0), 0) / ratings.length,
      average_depth: ratings.reduce((sum, r) => sum + (r.depth || 0), 0) / ratings.length,
      average_practical_value: ratings.reduce((sum, r) => sum + (r.practical_value || 0), 0) / ratings.length
    };

    // Update the content's rating in its table
    if (contentType === 'article') {
      await supabase
        .from('news_articles')
        .update({ user_rating: stats.average_rating })
        .eq('id', contentId);
    }

    // Store detailed stats
    await supabase
      .from('content_statistics')
      .upsert({
        content_type: contentType,
        content_id: contentId,
        ...stats,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'content_type,content_id'
      });
  } catch (error) {
    console.error('Failed to update content stats:', error);
  }
}

/**
 * Get reviews for content
 */
async function getReviews(req, res) {
  const { content_type, content_id, sort = 'helpful' } = req.query;

  try {
    let query = supabase
      .from('user_reviews')
      .select(`
        *,
        user:users(name, avatar_url),
        rating:content_ratings(rating, usefulness, clarity, depth, practical_value)
      `)
      .eq('is_published', true);

    if (content_type) query = query.eq('content_type', content_type);
    if (content_id) query = query.eq('content_id', content_id);

    // Sorting
    switch (sort) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating_high':
        query = query.order('rating.rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating.rating', { ascending: true });
        break;
    }

    const { data: reviews, error } = await query.limit(50);

    if (error) throw error;

    // Get summary statistics
    const { data: stats } = await supabase
      .from('content_statistics')
      .select('*')
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .single();

    return res.status(200).json({
      reviews,
      stats,
      total: reviews?.length || 0
    });
  } catch (error) {
    console.error('Failed to get reviews:', error);
    return res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
}

/**
 * Mark review as helpful/not helpful
 */
async function markHelpful(req, res, userId) {
  const { review_id, helpful } = req.body;

  try {
    // Record vote
    await supabase.from('review_votes').upsert({
      user_id: userId,
      review_id,
      is_helpful: helpful,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,review_id'
    });

    // Update counts
    const column = helpful ? 'helpful_count' : 'not_helpful_count';
    await supabase.rpc(`increment_${column}`, { review_id });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to mark helpful:', error);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
}

/**
 * Notify AI agents of behavior adjustments
 */
async function notifyAIAgents(adjustmentType, contentType) {
  // In a real system, this would notify all AI agents to reload their parameters
  console.log(`Notifying AI agents of ${adjustmentType} for ${contentType}`);
}
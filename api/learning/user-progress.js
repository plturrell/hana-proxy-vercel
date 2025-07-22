/**
 * User Learning Progress API
 * Tracks real human learning and provides curriculum progression
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { method } = req;
  const userId = req.headers['x-user-id']; // Should come from auth

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  switch (method) {
    case 'GET':
      return await getUserProgress(req, res, userId);
    case 'POST':
      return await updateUserProgress(req, res, userId);
    case 'PUT':
      return await recordLearningActivity(req, res, userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get user's learning progress across all curricula
 */
async function getUserProgress(req, res, userId) {
  try {
    // Get all user progress
    const { data: progress, error } = await supabase
      .from('user_learning_progress')
      .select(`
        *,
        curricula (
          name,
          description,
          category,
          difficulty_level,
          estimated_hours,
          learning_objectives
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Get recent assessments
    const { data: assessments } = await supabase
      .from('learning_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    // Get achievements
    const { data: achievements } = await supabase
      .from('learning_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    // Calculate overall stats
    const stats = calculateLearningStats(progress, assessments);

    return res.status(200).json({
      progress,
      recent_assessments: assessments,
      achievements,
      stats,
      recommendations: generateRecommendations(progress, assessments)
    });
  } catch (error) {
    console.error('Failed to get user progress:', error);
    return res.status(500).json({ error: 'Failed to retrieve progress' });
  }
}

/**
 * Update user's progress in a specific curriculum
 */
async function updateUserProgress(req, res, userId) {
  const { curriculum_id, module_id, action, data } = req.body;

  try {
    // Update module progress
    if (module_id) {
      const { data: moduleProgress, error } = await supabase
        .from('module_progress')
        .upsert({
          user_id: userId,
          module_id: module_id,
          ...data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,module_id'
        });

      if (error) throw error;

      // Update curriculum progress
      await updateCurriculumProgress(userId, curriculum_id);
    }

    // Check for achievements
    const newAchievements = await checkForAchievements(userId, curriculum_id);

    return res.status(200).json({
      success: true,
      new_achievements: newAchievements
    });
  } catch (error) {
    console.error('Failed to update progress:', error);
    return res.status(500).json({ error: 'Failed to update progress' });
  }
}

/**
 * Record a learning activity (viewing content, completing exercise, etc.)
 */
async function recordLearningActivity(req, res, userId) {
  const { 
    activity_type, 
    content_id, 
    content_type,
    duration_seconds,
    completion_percentage,
    interaction_data 
  } = req.body;

  try {
    // Record the activity
    const { data: activity, error } = await supabase
      .from('learning_activities')
      .insert({
        user_id: userId,
        activity_type,
        content_id,
        content_type,
        duration_seconds,
        completion_percentage,
        interaction_data,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update content engagement metrics
    if (content_type === 'article') {
      await supabase.rpc('increment_article_engagement', {
        p_article_id: content_id,
        p_view_time: duration_seconds
      });
    }

    // Check if this activity completes any learning objectives
    const objectives = await checkLearningObjectives(userId, activity_type, content_id);

    return res.status(200).json({
      success: true,
      activity_id: activity?.id,
      objectives_completed: objectives
    });
  } catch (error) {
    console.error('Failed to record activity:', error);
    return res.status(500).json({ error: 'Failed to record activity' });
  }
}

/**
 * Calculate learning statistics
 */
function calculateLearningStats(progress, assessments) {
  const stats = {
    total_curricula_enrolled: progress.length,
    completed_curricula: progress.filter(p => p.status === 'completed').length,
    average_completion: 0,
    total_hours_spent: 0,
    average_assessment_score: 0,
    learning_streak: 0,
    strongest_category: null,
    improvement_rate: 0
  };

  // Calculate averages
  if (progress.length > 0) {
    stats.average_completion = progress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / progress.length;
    stats.total_hours_spent = progress.reduce((sum, p) => sum + (p.total_time_spent_minutes || 0), 0) / 60;
  }

  if (assessments.length > 0) {
    stats.average_assessment_score = assessments.reduce((sum, a) => sum + (a.score_percentage || 0), 0) / assessments.length;
    
    // Calculate improvement rate (compare recent vs older scores)
    if (assessments.length >= 5) {
      const recentAvg = assessments.slice(0, 3).reduce((sum, a) => sum + a.score_percentage, 0) / 3;
      const olderAvg = assessments.slice(-3).reduce((sum, a) => sum + a.score_percentage, 0) / 3;
      stats.improvement_rate = ((recentAvg - olderAvg) / olderAvg) * 100;
    }
  }

  // Find strongest category
  const categoryScores = {};
  progress.forEach(p => {
    const category = p.curricula?.category;
    if (category) {
      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }
      categoryScores[category].total += p.current_score || 0;
      categoryScores[category].count += 1;
    }
  });

  let maxScore = 0;
  Object.entries(categoryScores).forEach(([category, data]) => {
    const avgScore = data.total / data.count;
    if (avgScore > maxScore) {
      maxScore = avgScore;
      stats.strongest_category = category;
    }
  });

  return stats;
}

/**
 * Generate personalized learning recommendations
 */
function generateRecommendations(progress, assessments) {
  const recommendations = [];

  // Find weak areas from assessments
  const weakAreas = new Set();
  assessments.forEach(a => {
    if (a.score_percentage < 70 && a.weaknesses) {
      a.weaknesses.forEach(w => weakAreas.add(w));
    }
  });

  // Recommend curricula for weak areas
  if (weakAreas.size > 0) {
    recommendations.push({
      type: 'improvement',
      priority: 'high',
      message: `Focus on improving: ${Array.from(weakAreas).join(', ')}`,
      suggested_curricula: Array.from(weakAreas).map(area => ({
        area,
        curriculum_id: `${area.toLowerCase().replace(/\s+/g, '_')}_fundamentals`
      }))
    });
  }

  // Recommend next difficulty level
  const completedBeginner = progress.filter(p => 
    p.status === 'completed' && p.curricula?.difficulty_level === 'beginner'
  ).length;

  if (completedBeginner >= 3) {
    recommendations.push({
      type: 'advancement',
      priority: 'medium',
      message: 'Ready for intermediate level content',
      suggested_curricula: ['intermediate_portfolio_management', 'intermediate_risk_analysis']
    });
  }

  // Recommend based on learning pace
  const fastLearners = progress.filter(p => p.learning_pace === 'fast').length;
  if (fastLearners > progress.length / 2) {
    recommendations.push({
      type: 'challenge',
      priority: 'low',
      message: 'Consider accelerated learning paths',
      suggested_curricula: ['advanced_derivatives', 'quantitative_methods']
    });
  }

  return recommendations;
}

/**
 * Update overall curriculum progress
 */
async function updateCurriculumProgress(userId, curriculumId) {
  // Get all module progress for this curriculum
  const { data: modules } = await supabase
    .from('module_progress')
    .select('*, curriculum_modules(*)')
    .eq('user_id', userId)
    .eq('curriculum_modules.curriculum_id', curriculumId);

  if (!modules) return;

  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.completed_at).length;
  const completionPercentage = (completedModules / totalModules) * 100;

  // Update curriculum progress
  await supabase
    .from('user_learning_progress')
    .update({
      modules_completed: completedModules,
      completion_percentage: completionPercentage,
      status: completionPercentage === 100 ? 'completed' : 'in_progress',
      last_accessed: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('curriculum_id', curriculumId);
}

/**
 * Check for new achievements
 */
async function checkForAchievements(userId, curriculumId) {
  const achievements = [];

  // Check for curriculum completion
  const { data: progress } = await supabase
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('curriculum_id', curriculumId)
    .single();

  if (progress?.completion_percentage === 100) {
    achievements.push({
      type: 'certificate',
      name: `${curriculumId} Completion Certificate`,
      description: 'Successfully completed all modules'
    });
  }

  // Check for perfect scores
  const { data: assessments } = await supabase
    .from('learning_assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('curriculum_id', curriculumId)
    .gte('score_percentage', 95);

  if (assessments?.length >= 3) {
    achievements.push({
      type: 'badge',
      name: 'Perfectionist',
      description: 'Achieved 95%+ on three assessments'
    });
  }

  // Insert new achievements
  if (achievements.length > 0) {
    await supabase
      .from('learning_achievements')
      .insert(achievements.map(a => ({
        user_id: userId,
        curriculum_id: curriculumId,
        ...a,
        earned_at: new Date().toISOString()
      })));
  }

  return achievements;
}

/**
 * Check if learning objectives are met
 */
async function checkLearningObjectives(userId, activityType, contentId) {
  // This would check against defined learning objectives
  // For now, return a simple example
  return [];
}
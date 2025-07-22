/**
 * Grok-4 Powered Intelligent Tutoring System
 * Provides personalized learning assistance for RAG curriculum
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Grok-4 API configuration
const GROK_API_KEY = process.env.XAI_API_KEY;
const GROK_BASE_URL = 'https://api.x.ai/v1';

class Grok4Tutor {
  constructor() {
    this.systemPrompts = {
      rag_expert: `You are an expert tutor specializing in RAG (Retrieval-Augmented Generation) systems. You have deep knowledge of:
- PDF processing and text extraction
- Semantic chunking strategies
- Vector embeddings and databases
- Supabase pgvector implementation
- Performance optimization techniques
- Production deployment best practices

Your teaching style is:
- Clear and practical with real-world examples
- Patient and encouraging
- Focused on building understanding through hands-on practice
- Able to explain complex concepts simply

Always provide code examples when relevant and help students debug their implementations.`,

      code_reviewer: `You are a senior engineer reviewing RAG system code. Focus on:
- Performance bottlenecks and optimization opportunities
- Best practices for production systems
- Security considerations
- Scalability issues
- Code clarity and maintainability

Provide specific, actionable feedback with code examples.`,

      project_mentor: `You are a project mentor guiding students through building production RAG systems. Help them:
- Make architectural decisions
- Choose appropriate technologies
- Plan implementation steps
- Troubleshoot issues
- Optimize for their specific use case

Ask clarifying questions to understand their requirements better.`
    };
  }

  async chat(messages, options = {}) {
    try {
      const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-4-vision-1212', // Latest Grok-4 model
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 2000,
          stream: options.stream || false
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Grok-4 API call failed:', error);
      throw error;
    }
  }

  async explainConcept(concept, userLevel, context = {}) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompts.rag_expert
      },
      {
        role: 'user',
        content: `Explain the concept of "${concept}" for someone at ${userLevel} level. 
        ${context.previousTopics ? `They've already learned: ${context.previousTopics.join(', ')}.` : ''}
        ${context.strugglingWith ? `They're struggling with: ${context.strugglingWith}.` : ''}
        
        Please include:
        1. A clear explanation with an analogy
        2. A practical code example
        3. Common pitfalls to avoid
        4. A simple exercise to test understanding`
      }
    ];

    return await this.chat(messages);
  }

  async reviewCode(code, language, requirements) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompts.code_reviewer
      },
      {
        role: 'user',
        content: `Review this ${language} code for a RAG system implementation:

\`\`\`${language}
${code}
\`\`\`

Requirements:
${requirements}

Please provide:
1. Overall assessment
2. Specific issues found
3. Performance optimization suggestions
4. Improved code example
5. Best practices not followed`
      }
    ];

    return await this.chat(messages);
  }

  async generateExercise(topic, difficulty, previousPerformance) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompts.rag_expert
      },
      {
        role: 'user',
        content: `Create a ${difficulty} level hands-on exercise for "${topic}" in RAG systems.

Student's previous performance: ${JSON.stringify(previousPerformance)}

The exercise should:
1. Build on their current knowledge
2. Address any weak areas
3. Include starter code
4. Have clear success criteria
5. Provide hints without giving away the solution

Format as JSON with: title, description, starter_code, hints, success_criteria, solution_outline`
      }
    ];

    const response = await this.chat(messages);
    try {
      return JSON.parse(response);
    } catch {
      return { raw_response: response };
    }
  }

  async provideHint(exercise, currentCode, attemptNumber) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompts.project_mentor
      },
      {
        role: 'user',
        content: `Student is working on: ${exercise}

Their current code:
\`\`\`
${currentCode}
\`\`\`

This is attempt #${attemptNumber}.

Provide a helpful hint that:
1. Doesn't give away the solution
2. Guides them toward the right approach
3. Addresses their specific issue
4. Encourages them to think critically`
      }
    ];

    return await this.chat(messages);
  }

  async assessUnderstanding(topic, studentResponse) {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert assessor evaluating student understanding of RAG systems. Be fair but thorough.'
      },
      {
        role: 'user',
        content: `Assess this student's understanding of "${topic}":

Student's response: "${studentResponse}"

Provide:
1. Understanding level (0-100)
2. Strengths demonstrated
3. Gaps in knowledge
4. Specific feedback
5. Recommended next topics

Format as JSON.`
      }
    ];

    const response = await this.chat(messages);
    try {
      return JSON.parse(response);
    } catch {
      return { raw_response: response };
    }
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const userId = req.headers['x-user-id'];
  const tutor = new Grok4Tutor();

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    switch (method) {
      case 'POST':
        return await handleTutoringRequest(req, res, tutor, userId);
      case 'GET':
        return await getTutoringHistory(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tutoring error:', error);
    return res.status(500).json({ error: 'Tutoring service error' });
  }
}

async function handleTutoringRequest(req, res, tutor, userId) {
  const { action, data } = req.body;

  // Log interaction for learning analytics
  await logTutoringInteraction(userId, action, data);

  switch (action) {
    case 'explain_concept':
      const explanation = await tutor.explainConcept(
        data.concept,
        data.level || 'intermediate',
        data.context || {}
      );
      return res.json({ explanation });

    case 'review_code':
      const review = await tutor.reviewCode(
        data.code,
        data.language || 'python',
        data.requirements || ''
      );
      return res.json({ review });

    case 'generate_exercise':
      const exercise = await tutor.generateExercise(
        data.topic,
        data.difficulty || 'medium',
        data.previousPerformance || {}
      );
      return res.json({ exercise });

    case 'provide_hint':
      const hint = await tutor.provideHint(
        data.exercise,
        data.currentCode,
        data.attemptNumber || 1
      );
      return res.json({ hint });

    case 'assess_understanding':
      const assessment = await tutor.assessUnderstanding(
        data.topic,
        data.response
      );
      
      // Update learning progress based on assessment
      await updateLearningProgress(userId, data.topic, assessment);
      
      return res.json({ assessment });

    case 'chat':
      // General tutoring chat
      const response = await tutor.chat(data.messages, data.options || {});
      return res.json({ response });

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

async function getTutoringHistory(req, res, userId) {
  const { limit = 10 } = req.query;

  const { data, error } = await supabase
    .from('tutoring_interactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }

  return res.json({ history: data });
}

async function logTutoringInteraction(userId, action, data) {
  try {
    await supabase.from('tutoring_interactions').insert({
      user_id: userId,
      action,
      data,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

async function updateLearningProgress(userId, topic, assessment) {
  try {
    // Update user's understanding score for the topic
    if (assessment.understanding_level) {
      await supabase.from('topic_mastery').upsert({
        user_id: userId,
        topic,
        mastery_level: assessment.understanding_level,
        strengths: assessment.strengths,
        gaps: assessment.gaps,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,topic'
      });
    }

    // Update recommended next topics
    if (assessment.recommended_next_topics) {
      await supabase.from('learning_recommendations').insert({
        user_id: userId,
        recommendation_type: 'next_topics',
        recommendations: assessment.recommended_next_topics,
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}
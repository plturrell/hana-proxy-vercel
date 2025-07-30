/**
 * Entity Timeline API for iOS App
 * Fetches real timeline events for knowledge entities from news mentions
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { entity_uri } = req.query;

    if (!entity_uri) {
        return res.status(400).json({ error: 'entity_uri parameter is required' });
    }

    try {
        console.log(`Fetching timeline events for entity: ${entity_uri}`);

        // 1. Get existing timeline events
        const existingEvents = await fetchExistingTimelineEvents(entity_uri);
        
        // 2. Generate new events from news mentions
        const newsEvents = await generateEventsFromNews(entity_uri);
        
        // 3. Generate events from entity relationships
        const relationshipEvents = await generateEventsFromRelationships(entity_uri);
        
        // 4. Combine and sort all events
        const allEvents = [...existingEvents, ...newsEvents, ...relationshipEvents]
            .sort((a, b) => new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime())
            .slice(0, 20); // Limit to 20 most recent events

        // 5. Store new events in database
        for (const event of newsEvents.concat(relationshipEvents)) {
            await storeTimelineEvent(event);
        }

        return res.status(200).json({
            success: true,
            message: 'Timeline events fetched successfully',
            data: {
                entity_uri,
                events: allEvents,
                total_events: allEvents.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching timeline events:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch timeline events'
        });
    }
}

async function fetchExistingTimelineEvents(entityUri) {
    try {
        const { data, error } = await supabase
            .from('entity_timeline_events')
            .select('*')
            .eq('entity_uri', entityUri)
            .order('event_timestamp', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching existing events:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching existing timeline events:', error);
        return [];
    }
}

async function generateEventsFromNews(entityUri) {
    try {
        // Extract entity name from URI
        const entityName = extractEntityName(entityUri);
        
        // Search for news articles mentioning this entity
        const { data: newsArticles } = await supabase
            .from('news_articles')
            .select('article_id, title, content, source, published_at, sentiment_score')
            .or(`title.ilike.%${entityName}%,content.ilike.%${entityName}%`)
            .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
            .order('published_at', { ascending: false })
            .limit(5);

        if (!newsArticles || newsArticles.length === 0) {
            return [];
        }

        return newsArticles.map(article => ({
            event_id: crypto.randomUUID(),
            entity_uri: entityUri,
            event_title: `News Mention: ${article.title.substring(0, 60)}...`,
            event_description: `${entityName} mentioned in ${article.source}: ${article.content?.substring(0, 150)}...`,
            event_type: 'news_mention',
            event_timestamp: article.published_at,
            metadata: {
                article_id: article.article_id,
                source: article.source,
                sentiment_score: article.sentiment_score,
                full_title: article.title
            }
        }));

    } catch (error) {
        console.error('Error generating events from news:', error);
        return [];
    }
}

async function generateEventsFromRelationships(entityUri) {
    try {
        // Get knowledge relationships for this entity
        const { data: relationships } = await supabase
            .from('knowledge_relationships')
            .select('*')
            .or(`source_id.eq.${entityUri},target_id.eq.${entityUri}`)
            .order('created_at', { ascending: false })
            .limit(3);

        if (!relationships || relationships.length === 0) {
            return [];
        }

        return relationships.map(rel => ({
            event_id: crypto.randomUUID(),
            entity_uri: entityUri,
            event_title: `Relationship Discovery`,
            event_description: `New ${rel.relationship_type.replace(/_/g, ' ')} relationship discovered`,
            event_type: 'relationship_discovery',
            event_timestamp: rel.created_at,
            metadata: {
                relationship_id: rel.id,
                relationship_type: rel.relationship_type,
                confidence: rel.confidence,
                related_entity: rel.source_id === entityUri ? rel.target_id : rel.source_id
            }
        }));

    } catch (error) {
        console.error('Error generating events from relationships:', error);
        return [];
    }
}

async function storeTimelineEvent(event) {
    try {
        // Check if event already exists
        const { data: existing } = await supabase
            .from('entity_timeline_events')
            .select('event_id')
            .eq('entity_uri', event.entity_uri)
            .eq('event_title', event.event_title)
            .eq('event_timestamp', event.event_timestamp)
            .single();

        if (existing) {
            return; // Event already exists
        }

        // Insert new event
        const { error } = await supabase
            .from('entity_timeline_events')
            .insert({
                entity_uri: event.entity_uri,
                event_title: event.event_title,
                event_description: event.event_description,
                event_type: event.event_type,
                event_timestamp: event.event_timestamp,
                metadata: event.metadata
            });

        if (error) {
            console.error('Error storing timeline event:', error);
        }
    } catch (error) {
        console.error('Error storing timeline event:', error);
    }
}

function extractEntityName(entityUri) {
    // Extract meaningful name from URI
    // Examples:
    // "http://finsight.ai/entities/apple_inc" -> "Apple Inc"
    // "https://dbpedia.org/resource/Apple_Inc." -> "Apple Inc"
    
    const parts = entityUri.split('/');
    const lastPart = parts[parts.length - 1];
    
    return lastPart
        .replace(/[._]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace(/\.$/, ''); // Remove trailing dot
}
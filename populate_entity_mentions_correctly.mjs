import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateEntityMentionsCorrectly() {
  console.log('✅ PROPERLY POPULATING NEWS_ENTITY_MENTIONS');
  console.log('='.repeat(45));

  try {
    // Get existing financial entities
    const { data: entities } = await supabase
      .from('financial_entities')
      .select('id, name, entity_type')
      .limit(30);

    console.log(`📊 Found ${entities?.length || 0} existing financial entities`);

    if (!entities || entities.length === 0) {
      console.log('❌ No financial entities found');
      return;
    }

    // Get recent articles
    const { data: articles } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, title, entities')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log(`📰 Found ${articles?.length || 0} recent articles`);

    // Create entity mentions based on article content
    let mentionCount = 0;
    
    for (const article of articles) {
      // Match entities by name or identifier
      for (const entity of entities) {
        let isRelevant = false;
        
        // Check if entity is mentioned in title or entities array
        if (article.title) {
          if (article.title.includes(entity.name) || 
              (entity.identifier && article.title.includes(entity.identifier))) {
            isRelevant = true;
          }
        }
        
        if (article.entities && Array.isArray(article.entities)) {
          if (article.entities.some(e => 
            e.includes(entity.name) || 
            (entity.identifier && e.includes(entity.identifier))
          )) {
            isRelevant = true;
          }
        }
        
        if (isRelevant) {
          // Check if mention already exists
          const { data: existing } = await supabase
            .from('news_entity_mentions')
            .select('id')
            .eq('article_id', article.article_id)
            .eq('entity_id', entity.id)
            .single();
          
          if (!existing) {
            const mentionData = {
              article_id: article.article_id,
              entity_id: entity.id,
              entity_type: entity.entity_type,
              created_at: new Date().toISOString()
            };
            
            const { error } = await supabase
              .from('news_entity_mentions')
              .insert(mentionData);
            
            if (!error) {
              mentionCount++;
              console.log(`  ✅ Linked ${entity.name} to article about ${article.title.substring(0, 50)}...`);
            } else {
              console.log(`  ❌ Failed to create mention: ${error.message}`);
            }
          }
        }
      }
    }

    console.log(`\n📊 Created ${mentionCount} entity mentions`);

    // Final verification
    const { count } = await supabase
      .from('news_entity_mentions')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ ENTITY MENTIONS POPULATED!`);
    console.log(`📈 Total mentions in table: ${count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

populateEntityMentionsCorrectly();
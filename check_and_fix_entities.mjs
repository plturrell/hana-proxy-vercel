import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixEntities() {
  console.log('🔍 CHECKING FINANCIAL_ENTITIES TABLE STRUCTURE');
  console.log('='.repeat(45));

  try {
    // First, check what's in financial_entities
    const { data: existingEntities, error: fetchError } = await supabase
      .from('financial_entities')
      .select('*')
      .limit(5);

    console.log('\n📊 Existing entities sample:');
    if (fetchError) {
      console.log('❌ Error fetching entities:', fetchError.message);
    } else {
      console.log(`Found ${existingEntities?.length || 0} entities`);
      if (existingEntities && existingEntities.length > 0) {
        console.log('Sample:', existingEntities[0]);
      }
    }

    // Try a minimal insert to understand the schema
    console.log('\n🧪 Testing minimal entity creation...');
    const testEntity = {
      entity_name: 'Test Corp'
    };

    const { data: testResult, error: testError } = await supabase
      .from('financial_entities')
      .insert(testEntity)
      .select();

    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      console.log('Schema hint:', testError.hint || 'No hint available');
      
      // If the error is about missing columns, try with more fields
      if (testError.message.includes('violates not-null constraint')) {
        console.log('\n🔧 Retrying with required fields...');
        
        // Common required fields for entity tables
        const enhancedEntity = {
          entity_name: 'Test Entity ' + Date.now(),
          entity_type: 'COMPANY',
          created_at: new Date().toISOString()
        };
        
        const { error: retryError } = await supabase
          .from('financial_entities')
          .insert(enhancedEntity)
          .select();
          
        if (retryError) {
          console.log('❌ Enhanced insert also failed:', retryError.message);
        }
      }
    } else {
      console.log('✅ Test entity created successfully');
      // Clean up test entity
      if (testResult && testResult[0]) {
        await supabase
          .from('financial_entities')
          .delete()
          .eq('id', testResult[0].id);
      }
    }

    // Alternative approach: Use the existing entities if any
    console.log('\n📋 Alternative approach: Link to existing entities...');
    
    // Get articles and their entities
    const { data: articles } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, entities')
      .not('entities', 'is', null)
      .limit(5);

    if (articles && articles.length > 0) {
      console.log(`\n💡 Found ${articles.length} articles with entities`);
      
      // For now, create entity mentions without entity_id
      // Some tables might allow null entity_id
      const mentionsToCreate = [];
      
      articles.forEach(article => {
        if (Array.isArray(article.entities) && article.entities.length > 0) {
          // Try creating a mention with just article_id
          mentionsToCreate.push({
            article_id: article.article_id,
            entity_id: 1, // Try with a default ID
            created_at: new Date().toISOString()
          });
        }
      });

      if (mentionsToCreate.length > 0) {
        console.log(`\n📝 Creating ${mentionsToCreate.length} entity mentions...`);
        
        const { data: mentions, error: mentionError } = await supabase
          .from('news_entity_mentions')
          .insert(mentionsToCreate[0]) // Try one first
          .select();

        if (mentionError) {
          console.log('❌ Mention creation failed:', mentionError.message);
          
          // Final attempt: Check if we need to use entity name instead
          console.log('\n🔄 Final attempt with different structure...');
          const finalAttempt = {
            article_id: articles[0].article_id,
            entity_name: articles[0].entities[0], // Use entity name directly
            mention_count: 1,
            created_at: new Date().toISOString()
          };
          
          const { error: finalError } = await supabase
            .from('news_entity_mentions')
            .insert(finalAttempt)
            .select();
            
          if (finalError) {
            console.log('❌ Final attempt failed:', finalError.message);
          } else {
            console.log('✅ Success with entity_name approach!');
            
            // Now populate all mentions
            await populateAllMentions(articles);
          }
        } else {
          console.log('✅ Mention created with entity_id approach');
        }
      }
    }

    // Final check
    const { count } = await supabase
      .from('news_entity_mentions')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 FINAL STATUS:`);
    console.log(`✅ news_entity_mentions: ${count} records`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function populateAllMentions(articles) {
  console.log('\n🚀 Populating all entity mentions...');
  let successCount = 0;
  
  for (const article of articles) {
    if (!Array.isArray(article.entities)) continue;
    
    const entityCounts = {};
    article.entities.forEach(entity => {
      entityCounts[entity] = (entityCounts[entity] || 0) + 1;
    });
    
    for (const [entityName, count] of Object.entries(entityCounts)) {
      const mention = {
        article_id: article.article_id,
        entity_name: entityName,
        mention_count: count,
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('news_entity_mentions')
        .insert(mention);
        
      if (!error) {
        successCount++;
      }
    }
  }
  
  console.log(`✅ Created ${successCount} entity mentions`);
}

checkAndFixEntities();
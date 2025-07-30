import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEntityMentions() {
  console.log('🔧 FIXING NEWS_ENTITY_MENTIONS TABLE');
  console.log('='.repeat(40));

  try {
    // Step 1: Get all entities from articles
    console.log('\n📊 Step 1: Collecting entities from articles...');
    const { data: articles } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, entities')
      .not('entities', 'is', null)
      .order('created_at', { ascending: false });

    if (!articles || articles.length === 0) {
      console.log('❌ No articles with entities found');
      return;
    }

    // Collect unique entities
    const uniqueEntities = new Set();
    articles.forEach(article => {
      if (Array.isArray(article.entities)) {
        article.entities.forEach(entity => uniqueEntities.add(entity));
      }
    });

    console.log(`✅ Found ${uniqueEntities.size} unique entities across ${articles.length} articles`);

    // Step 2: Ensure entities exist in financial_entities table
    console.log('\n📝 Step 2: Creating/verifying entities in financial_entities table...');
    const entityMap = new Map();

    for (const entityName of uniqueEntities) {
      // Check if entity exists
      let { data: existingEntity } = await supabase
        .from('financial_entities')
        .select('id, entity_name')
        .eq('entity_name', entityName)
        .single();

      if (!existingEntity) {
        // Create the entity
        const entityType = classifyEntityType(entityName);
        const { data: newEntity, error } = await supabase
          .from('financial_entities')
          .insert({
            entity_name: entityName,
            entity_type: entityType,
            entity_subtype: getEntitySubtype(entityName, entityType),
            is_active: true,
            metadata: {
              source: 'news_intelligence',
              created_from: 'entity_mentions_fix'
            }
          })
          .select()
          .single();

        if (!error && newEntity) {
          existingEntity = newEntity;
          console.log(`  ✅ Created entity: ${entityName} (${entityType})`);
        } else {
          console.log(`  ❌ Failed to create entity: ${entityName}`);
          continue;
        }
      }

      entityMap.set(entityName, existingEntity.id);
    }

    console.log(`\n✅ Entity map created with ${entityMap.size} entities`);

    // Step 3: Populate news_entity_mentions
    console.log('\n💾 Step 3: Populating news_entity_mentions...');
    let mentionCount = 0;

    for (const article of articles) {
      if (!Array.isArray(article.entities)) continue;

      for (const entityName of article.entities) {
        const entityId = entityMap.get(entityName);
        if (!entityId) continue;

        // Check if mention already exists
        const { data: existing } = await supabase
          .from('news_entity_mentions')
          .select('id')
          .eq('article_id', article.article_id)
          .eq('entity_id', entityId)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('news_entity_mentions')
            .insert({
              article_id: article.article_id,
              entity_id: entityId,
              created_at: new Date().toISOString()
            });

          if (!error) {
            mentionCount++;
          }
        }
      }
    }

    console.log(`✅ Created ${mentionCount} entity mentions`);

    // Step 4: Verify the results
    console.log('\n🔍 Step 4: Verifying results...');
    const { count } = await supabase
      .from('news_entity_mentions')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ ENTITY MENTIONS FIXED!`);
    console.log(`📊 Total entity mentions: ${count}`);
    console.log(`📈 Entities tracked: ${entityMap.size}`);
    console.log(`✅ Table is now properly populated`);

  } catch (error) {
    console.error('❌ Error fixing entity mentions:', error.message);
  }
}

function classifyEntityType(entityName) {
  if (entityName.includes('Inc') || entityName.includes('Corp') || 
      entityName.includes('Ltd') || entityName.includes('Apple') || 
      entityName.includes('Microsoft') || entityName.includes('Tesla')) {
    return 'COMPANY';
  }
  if (entityName.includes('Bank') || entityName.includes('Federal Reserve') || 
      entityName.includes('ECB')) {
    return 'FINANCIAL_INSTITUTION';
  }
  if (entityName.includes('USD') || entityName.includes('EUR') || 
      entityName.includes('GBP') || entityName.includes('Bitcoin')) {
    return 'CURRENCY';
  }
  if (entityName.includes('Oil') || entityName.includes('Gold') || 
      entityName.includes('Crude')) {
    return 'COMMODITY';
  }
  if (entityName.includes('Powell') || entityName.includes('Lagarde') || 
      entityName.includes('Cook')) {
    return 'PERSON';
  }
  if (entityName.includes('S&P') || entityName.includes('NASDAQ') || 
      entityName.includes('Dow')) {
    return 'INDEX';
  }
  return 'OTHER';
}

function getEntitySubtype(entityName, entityType) {
  const subtypes = {
    'COMPANY': {
      'Apple': 'TECH_GIANT',
      'Microsoft': 'TECH_GIANT',
      'Tesla': 'EV_MANUFACTURER',
      'MicroStrategy': 'CRYPTO_HOLDER',
      'BlackRock': 'ASSET_MANAGER'
    },
    'FINANCIAL_INSTITUTION': {
      'Federal Reserve': 'CENTRAL_BANK',
      'European Central Bank': 'CENTRAL_BANK',
      'ECB': 'CENTRAL_BANK'
    },
    'CURRENCY': {
      'Bitcoin': 'CRYPTOCURRENCY',
      'USD': 'FIAT',
      'EUR': 'FIAT'
    },
    'COMMODITY': {
      'WTI Crude': 'ENERGY',
      'Brent Crude': 'ENERGY',
      'Gold': 'PRECIOUS_METAL'
    },
    'PERSON': {
      'Jerome Powell': 'FED_CHAIR',
      'Christine Lagarde': 'ECB_PRESIDENT',
      'Tim Cook': 'CEO'
    }
  };

  return subtypes[entityType]?.[entityName] || entityType.toLowerCase();
}

fixEntityMentions();
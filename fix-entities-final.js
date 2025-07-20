import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function fixEntities() {
  console.log('🔧 Fixing NVIDIA entities for NVDA search...');
  
  // Find NVIDIA articles
  const { data: articles } = await supabase
    .from('news_articles')
    .select('*')
    .or('title.ilike.%NVIDIA%,content.ilike.%NVIDIA%')
    .limit(20);

  console.log('Found', articles?.length || 0, 'NVIDIA articles');

  if (articles && articles.length > 0) {
    for (const article of articles) {
      try {
        // Parse existing entities
        const entities = JSON.parse(article.entities);
        
        // Add NVDA if not present
        if (!entities.includes('NVDA')) {
          entities.push('NVDA');
          
          // Update the article
          const { error } = await supabase
            .from('news_articles')
            .update({ entities: JSON.stringify(entities) })
            .eq('article_id', article.article_id);
          
          if (!error) {
            console.log('✅ Updated:', article.title.substring(0, 40) + '...');
          } else {
            console.log('❌ Error:', error.message);
          }
        } else {
          console.log('⚪ Already has NVDA:', article.title.substring(0, 40) + '...');
        }
      } catch (e) {
        console.log('❌ Parse error for:', article.title);
      }
    }
  }

  // Test NVDA search
  console.log('\n🔍 Testing NVDA search...');
  const { data: nvdaResults } = await supabase
    .from('news_articles')
    .select('title, sentiment_score, entities')
    .contains('entities', ['NVDA'])
    .limit(5);

  console.log('✅ NVDA search results:', nvdaResults?.length || 0);
  nvdaResults?.forEach(article => {
    console.log(`  - ${article.title.substring(0, 50)}... (sentiment: ${article.sentiment_score})`);
  });
}

fixEntities().catch(console.error);
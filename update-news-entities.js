import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function updateNewsEntities() {
  console.log('📰 Updating news entities...');

  // Get NVIDIA articles
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('*')
    .or('title.ilike.%NVIDIA%,content.ilike.%NVIDIA%');

  console.log('Found', articles?.length || 0, 'NVIDIA articles');

  if (articles && articles.length > 0) {
    for (const article of articles) {
      // Update entities to include NVDA ticker
      const { error: updateError } = await supabase
        .from('news_articles')
        .update({ 
          entities: ['NVIDIA', 'NVDA', 'AI', 'semiconductors', 'technology']
        })
        .eq('article_id', article.article_id);
      
      if (!updateError) {
        console.log('✅ Updated entities for:', article.title.substring(0, 50) + '...');
      } else {
        console.log('❌ Error updating:', updateError.message);
      }
    }
    
    // Test the NVDA search
    console.log('\n🔍 Testing NVDA search...');
    const { data: nvdaResults, error: nvdaError } = await supabase
      .from('news_articles')
      .select('title, sentiment_score, entities')
      .contains('entities', ['NVDA']);
    
    if (nvdaError) {
      console.log('❌ Search error:', nvdaError.message);
    } else {
      console.log('✅ Found', nvdaResults?.length || 0, 'articles for NVDA');
      nvdaResults?.forEach(article => {
        console.log(`  - ${article.title} (sentiment: ${article.sentiment_score})`);
      });
    }
  }
}

updateNewsEntities().catch(console.error);
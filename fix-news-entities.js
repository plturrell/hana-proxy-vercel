import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function fixNewsEntities() {
  console.log('🔍 Testing news query for NVDA...');
  
  // Try with NVIDIA
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('*')
    .or(`entities.cs.{"NVIDIA"},title.ilike.%NVIDIA%,content.ilike.%NVIDIA%`)
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log('❌ Error for NVIDIA:', error.message);
  } else {
    console.log('✅ Articles found for NVIDIA:', articles?.length || 0);
    articles?.forEach(a => {
      console.log('  -', a.title);
      console.log('    Sentiment:', a.sentiment_score);
      console.log('    Entities:', a.entities);
    });
  }
  
  // Update entities to include both NVDA and NVIDIA
  if (articles && articles.length > 0) {
    console.log('\n📝 Updating entities to include NVDA...');
    for (const article of articles) {
      try {
        const entities = JSON.parse(article.entities);
        if (!entities.includes('NVDA')) {
          entities.push('NVDA');
          const { error: updateError } = await supabase
            .from('news_articles')
            .update({ entities: JSON.stringify(entities) })
            .eq('article_id', article.article_id);
          
          if (!updateError) {
            console.log('✅ Updated:', article.title.substring(0, 40) + '...');
          } else {
            console.log('❌ Update error:', updateError.message);
          }
        }
      } catch (e) {
        console.log('❌ Parse error for article:', article.title);
      }
    }
    
    // Test the NVDA query now
    console.log('\n🔍 Testing NVDA query after update...');
    const { data: nvdaArticles, error: nvdaError } = await supabase
      .from('news_articles')
      .select('*')
      .or(`entities.cs.{"NVDA"},title.ilike.%NVDA%,content.ilike.%NVDA%`)
      .order('published_at', { ascending: false })
      .limit(10);

    if (!nvdaError) {
      console.log('✅ Articles now found for NVDA:', nvdaArticles?.length || 0);
    }
  }
}

fixNewsEntities().catch(console.error);
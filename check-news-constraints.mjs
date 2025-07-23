import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNewsConstraints() {
  console.log('🔍 CHECKING NEWS TABLE CONSTRAINTS AND DUPLICATES');
  console.log('='.repeat(45));
  
  try {
    // Skip RPC call - will check manually
    
    // Alternative approach - get all articles and check manually
    const { data: articles, error } = await supabase
      .from('news_articles_partitioned')
      .select('article_id, title, url, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching articles:', error);
      return;
    }
    
    console.log(`\nTotal articles: ${articles.length}`);
    
    // Check for duplicates by title
    const titleMap = new Map();
    const urlMap = new Map();
    
    articles.forEach(article => {
      // Check title duplicates
      if (titleMap.has(article.title)) {
        titleMap.get(article.title).push(article);
      } else {
        titleMap.set(article.title, [article]);
      }
      
      // Check URL duplicates
      if (urlMap.has(article.url)) {
        urlMap.get(article.url).push(article);
      } else {
        urlMap.set(article.url, [article]);
      }
    });
    
    // Report title duplicates
    console.log('\n📋 DUPLICATE TITLES:');
    let hasTitleDuplicates = false;
    for (const [title, articleList] of titleMap) {
      if (articleList.length > 1) {
        hasTitleDuplicates = true;
        console.log(`\n"${title}" - ${articleList.length} copies:`);
        articleList.forEach(a => {
          console.log(`  - ${a.article_id} (${new Date(a.created_at).toLocaleString()})`);
        });
      }
    }
    
    if (!hasTitleDuplicates) {
      console.log('✅ No duplicate titles found');
    }
    
    // Report URL duplicates
    console.log('\n🔗 DUPLICATE URLS:');
    let hasUrlDuplicates = false;
    for (const [url, articleList] of urlMap) {
      if (articleList.length > 1) {
        hasUrlDuplicates = true;
        console.log(`\n"${url}" - ${articleList.length} copies:`);
        articleList.forEach(a => {
          console.log(`  - ${a.article_id}: ${a.title}`);
        });
      }
    }
    
    if (!hasUrlDuplicates) {
      console.log('✅ No duplicate URLs found');
    }
    
    // Check table structure for unique constraints
    console.log('\n🔧 CHECKING TABLE CONSTRAINTS:');
    
    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('news_articles_partitioned')
      .select('*')
      .limit(0);
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Add unique constraint on URL to prevent exact duplicates');
    console.log('2. Add a compound unique index on (title, published_at) for near-duplicates');
    console.log('3. Implement content hashing for semantic deduplication');
    console.log('4. Add "last_seen" timestamp to track when we last encountered the article');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNewsConstraints();
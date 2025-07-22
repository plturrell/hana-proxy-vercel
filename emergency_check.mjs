import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyCheck() {
  console.log('🚨 EMERGENCY DATA CHECK');
  console.log('='.repeat(30));

  try {
    // Check all possible locations for our data
    const tables = [
      'news_articles',
      'news_articles_partitioned',
      'news_articles_y2025m07',
      'news_articles_old'
    ];

    console.log('📊 Checking all tables for data...\n');

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`${count > 0 ? '✅' : '⚪'} ${table}: ${count} rows`);
          
          // If we find data, show sample
          if (count > 0) {
            const { data } = await supabase
              .from(table)
              .select('article_id, title, source')
              .limit(2);
            
            if (data && data.length > 0) {
              console.log(`   Sample: ${data[0].title?.substring(0, 40)}...`);
            }
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: Table not accessible`);
      }
    }

    // Check if we need to restore data
    console.log('\n🔍 DATA RECOVERY STATUS:');
    
    const { count: mainCount } = await supabase
      .from('news_articles_partitioned')
      .select('*', { count: 'exact', head: true });

    const { count: viewCount } = await supabase
      .from('news_articles')
      .select('*', { count: 'exact', head: true });

    if (mainCount === 0 && viewCount === 0) {
      console.log('🚨 ISSUE: Data missing from main tables');
      
      // Check if we have backup in old table
      try {
        const { count: backupCount } = await supabase
          .from('news_articles_old')
          .select('*', { count: 'exact', head: true });
        
        if (backupCount > 0) {
          console.log('✅ GOOD: Backup data found in news_articles_old');
          console.log('🔄 SOLUTION: Restore from backup');
          
          // Get backup data
          const { data: backupData } = await supabase
            .from('news_articles_old')
            .select('*');
          
          if (backupData && backupData.length > 0) {
            console.log('\n📋 BACKUP DATA FOUND:');
            backupData.forEach((article, i) => {
              console.log(`  ${i+1}. ${article.title?.substring(0, 50)}...`);
            });
            
            console.log('\n🔄 RESTORING DATA...');
            
            // Transform and restore to partitioned table
            const transformedData = backupData.map(article => ({
              article_id: article.article_id,
              title: article.title,
              content: article.content,
              url: article.url,
              source: article.source,
              published_at: article.published_at || article.created_at,
              sentiment_score: article.sentiment_score,
              entities: article.entities,
              relevance_score: article.relevance_score,
              created_at: article.created_at,
              metadata: {
                restored_from: 'news_articles_old',
                restored_at: new Date().toISOString()
              }
            }));

            const { error: restoreError } = await supabase
              .from('news_articles_partitioned')
              .insert(transformedData);

            if (restoreError) {
              console.log(`❌ Restore failed: ${restoreError.message}`);
            } else {
              console.log('✅ DATA SUCCESSFULLY RESTORED!');
              
              // Verify restoration
              const { count: restoredCount } = await supabase
                .from('news_articles_partitioned')
                .select('*', { count: 'exact', head: true });
              
              console.log(`✅ Verified: ${restoredCount} articles restored`);
            }
          }
        } else {
          console.log('❌ No backup data found');
        }
      } catch (backupError) {
        console.log('❌ Cannot access backup table');
      }
    } else {
      console.log('✅ Data is safe in main tables');
    }

  } catch (error) {
    console.error('❌ Emergency check failed:', error.message);
  }
}

emergencyCheck();
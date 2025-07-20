import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function checkTableColumns() {
  console.log('📋 CHECKING TABLE COLUMNS FOR GRAPHQL VIEWS');
  console.log('===========================================\n');
  
  const tables = ['users', 'market_data', 'news_articles', 'portfolio_holdings', 'a2a_agents'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`\n${table.toUpperCase()} (${columns.length} columns):`);
        console.log(columns.join(', '));
      } else if (!error) {
        console.log(`\n${table.toUpperCase()}: Empty table`);
      } else {
        console.log(`\n${table.toUpperCase()} error:`, error.message);
      }
    } catch (e) {
      console.log(`\n${table.toUpperCase()} exception:`, e.message);
    }
  }
}

checkTableColumns().catch(console.error);
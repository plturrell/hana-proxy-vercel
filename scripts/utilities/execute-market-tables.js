import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  const sql = fs.readFileSync('create-market-data-tables.sql', 'utf8');
  
  console.log('📊 Creating market data tables in Supabase...');
  console.log('Database:', supabaseUrl);
  
  // Execute the entire SQL script directly
  const { data, error } = await supabase
    .from('_sql')
    .select('*')
    .single()
    .then(() => supabase.rpc('exec_sql', { sql_query: sql }))
    .catch(async () => {
      // If exec_sql doesn't exist, try direct query
      console.log('Using direct SQL execution...');
      
      // Split by GO or double newline for major sections
      const sections = sql.split(/\n\s*\n/).filter(s => s.trim());
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;
        
        console.log(`\nExecuting section ${i + 1}/${sections.length}...`);
        
        try {
          // Use Supabase SQL editor endpoint
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: section })
          });
          
          if (!response.ok) {
            const text = await response.text();
            console.error(`Section ${i + 1} failed:`, text);
          } else {
            console.log(`✓ Section ${i + 1} completed`);
          }
        } catch (e) {
          console.error(`Section ${i + 1} error:`, e.message);
        }
      }
    });
  
  if (error) {
    console.error('Error executing SQL:', error);
    return;
  }
  
  console.log('\n✅ Market data tables created successfully!');
  
  // Verify tables were created
  console.log('\n📋 Verifying tables...');
  const tables = ['market_data', 'market_data_collection_log', 'market_symbols', 'market_alerts'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${table}: Not found`);
    } else {
      console.log(`✅ ${table}: Created (${count || 0} rows)`);
    }
  }
}

executeSql().catch(console.error);
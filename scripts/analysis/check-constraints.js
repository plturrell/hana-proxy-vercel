import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function checkConstraints() {
  const { data, error } = await supabase.rpc('sql_safe', {
    query_text: `SELECT 
      conname as constraint_name,
      contype as constraint_type,
      pg_get_constraintdef(oid) as definition
    FROM pg_constraint 
    WHERE conrelid = 'market_data'::regclass
    ORDER BY conname`
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Market Data Table Constraints:');
  console.log(JSON.stringify(data[0].result, null, 2));
  
  // Also check columns
  const { data: columns, error: colError } = await supabase.rpc('sql_safe', {
    query_text: `SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'market_data' 
    AND table_schema = 'public'
    ORDER BY ordinal_position`
  });
  
  if (!colError) {
    console.log('\nMarket Data Table Columns:');
    console.log(JSON.stringify(columns[0].result, null, 2));
  }
}

checkConstraints();
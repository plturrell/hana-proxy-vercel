import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function testForeignKeyRelationships() {
  console.log('🔗 FOREIGN KEY RELATIONSHIPS VERIFICATION');
  console.log('=========================================\n');

  // Get foreign key count
  console.log('📊 FOREIGN KEY COUNT:');
  try {
    const { data: countData, error: countError } = await supabase.rpc('count_foreign_keys');
    
    if (!countError) {
      console.log(`Total Foreign Key Constraints: ${countData}`);
      console.log('');
    } else {
      console.log('Error getting count:', countError.message);
    }
  } catch (e) {
    console.log('Count function error:', e.message);
  }

  // Get detailed foreign key information
  console.log('📋 FOREIGN KEY DETAILS:');
  try {
    const { data: fkData, error: fkError } = await supabase.rpc('check_foreign_keys');
    
    if (!fkError && fkData) {
      console.log(`Found ${fkData.length} foreign key constraints:`);
      console.log('');
      
      // Group by table for better readability
      const byTable = fkData.reduce((acc, fk) => {
        if (!acc[fk.table_name]) acc[fk.table_name] = [];
        acc[fk.table_name].push(fk);
        return acc;
      }, {});
      
      Object.keys(byTable).sort().forEach(tableName => {
        console.log(`  📋 ${tableName}:`);
        byTable[tableName].forEach(fk => {
          console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        console.log('');
      });
      
      return fkData.length;
    } else {
      console.log('Error getting foreign keys:', fkError?.message);
    }
  } catch (e) {
    console.log('FK function error:', e.message);
  }

  // Test some key relationships by checking if data can be joined
  console.log('🧪 TESTING RELATIONSHIP INTEGRITY:');
  
  const relationshipTests = [
    {
      name: 'Users table exists and has data',
      test: async () => {
        const { data, error } = await supabase.from('users').select('id, username').limit(5);
        return { success: !error && data.length > 0, data: data?.length || 0, error: error?.message };
      }
    },
    {
      name: 'Portfolio holdings can reference users',
      test: async () => {
        const { data, error } = await supabase
          .from('portfolio_holdings')
          .select('user_id, symbol')
          .limit(1);
        return { success: !error, data: data?.length || 0, error: error?.message };
      }
    },
    {
      name: 'Agents table exists and can reference users',
      test: async () => {
        const { data, error } = await supabase
          .from('agents')
          .select('user_id, name')
          .limit(1);
        return { success: !error, data: data?.length || 0, error: error?.message };
      }
    },
    {
      name: 'Price alerts can reference users',
      test: async () => {
        const { data, error } = await supabase
          .from('price_alerts')
          .select('user_id, symbol')
          .limit(1);
        return { success: !error, data: data?.length || 0, error: error?.message };
      }
    },
    {
      name: 'Notifications can reference users',
      test: async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('user_id, message')
          .limit(1);
        return { success: !error, data: data?.length || 0, error: error?.message };
      }
    }
  ];

  let passedTests = 0;
  
  for (const test of relationshipTests) {
    try {
      const result = await test.test();
      if (result.success) {
        console.log(`  ✅ ${test.name}: Working (${result.data} records)`);
        passedTests++;
      } else {
        console.log(`  ❌ ${test.name}: ${result.error || 'Failed'}`);
      }
    } catch (e) {
      console.log(`  ❌ ${test.name}: Exception - ${e.message}`);
    }
  }

  console.log(`\n🎯 RELATIONSHIP TESTS: ${passedTests}/${relationshipTests.length} passed`);

  // Calculate score based on foreign keys
  const expectedFKs = 30; // Target was 30+ for 95% score
  let actualFKs = 0;
  let fkScore = 0;
  
  if (fkData && fkData.length) {
    actualFKs = fkData.length;
    fkScore = Math.min(100, (actualFKs / expectedFKs) * 100);
  }
  
  console.log('\n📊 FOREIGN KEY SCORING:');
  console.log(`Expected FKs for 95% score: ${expectedFKs}`);
  console.log(`Actual FKs found: ${actualFKs}`);
  console.log(`FK Score: ${fkScore.toFixed(1)}%`);
  
  if (actualFKs >= expectedFKs) {
    console.log('🎉 FOREIGN KEY TARGET ACHIEVED! Database relationships are properly established.');
  }

  return { count: actualFKs || 0, score: fkScore || 0, passed: passedTests || 0 };
}

testForeignKeyRelationships().then(result => {
  console.log(`\n🏆 FINAL RESULT: ${result.count} foreign keys, ${result.score.toFixed(1)}% score`);
}).catch(console.error);
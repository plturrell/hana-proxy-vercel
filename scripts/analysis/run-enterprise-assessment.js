import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4'
);

async function runEnterpriseAssessment() {
  console.log('🏆 RUNNING ENTERPRISE DATABASE ASSESSMENT');
  console.log('========================================\n');

  // Run the comprehensive assessment
  const { data, error } = await supabase.rpc('enterprise_database_assessment');
  
  if (error) {
    console.error('Error running assessment:', error);
    return;
  }

  let totalScore = 0;
  let totalMax = 0;

  data.forEach(category => {
    const icon = category.percentage >= 95 ? '✅' : 
                 category.percentage >= 80 ? '⚠️' : '❌';
    
    console.log(`${icon} ${category.category}: ${category.score}/${category.max_score} (${category.percentage}%) - ${category.status}`);
    
    totalScore += parseInt(category.score);
    totalMax += parseInt(category.max_score);
  });

  const overallPercentage = Math.round((totalScore / totalMax) * 100);
  
  console.log('\n⭐ OVERALL ENTERPRISE GRADE:', overallPercentage + '%');
  
  if (overallPercentage >= 95) {
    console.log('🎉 DATABASE IS 100% ENTERPRISE GRADE!');
    console.log('Ready for production deployment');
  } else if (overallPercentage >= 90) {
    console.log('✅ DATABASE IS ENTERPRISE READY');
    console.log('Minor optimizations recommended');
  } else if (overallPercentage >= 80) {
    console.log('⚠️ DATABASE APPROACHING ENTERPRISE GRADE');
    console.log('Some improvements needed');
  } else {
    console.log('❌ DATABASE NOT YET ENTERPRISE GRADE');
    console.log('Significant improvements required');
  }

  // Run constraint tests
  console.log('\n🔒 CONSTRAINT ENFORCEMENT TEST:');
  const { data: constraints, error: constraintError } = await supabase.rpc('enterprise_constraint_test');
  
  if (!constraintError && constraints) {
    constraints.forEach(test => {
      const icon = test.is_working ? '✅' : '❌';
      console.log(`${icon} ${test.test_name}: ${test.status} - ${test.details}`);
    });
  }

  // Run transaction tests  
  console.log('\n⚡ TRANSACTION SAFETY TEST:');
  const { data: transactions, error: txError } = await supabase.rpc('enterprise_transaction_test');
  
  if (!txError && transactions) {
    transactions.forEach(test => {
      const icon = test.is_working ? '✅' : '❌';
      console.log(`${icon} ${test.test_name}: ${test.status} - ${test.details}`);
    });
  }
}

runEnterpriseAssessment().catch(console.error);
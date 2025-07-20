/**
 * Test script for the Curriculum Learning Agent
 * Tests all major functionality to ensure it's working perfectly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const API_BASE_URL = 'https://hana-proxy-vercel-jgo17nt09-plturrells-projects.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

// Use production URL by default
const BASE_URL = API_BASE_URL;

console.log('🧪 Testing Curriculum Learning Agent...');
console.log(`Base URL: ${BASE_URL}`);

/**
 * Test agent status endpoint
 */
async function testAgentStatus() {
  console.log('\n📊 Testing Agent Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning?action=status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Status Check Successful');
      console.log(`Agent ID: ${data.agent_id}`);
      console.log(`Agent Name: ${data.agent_name}`);
      console.log(`Status: ${data.status}`);
      console.log(`Capabilities: ${data.capabilities.join(', ')}`);
      console.log(`Knowledge Domains: ${data.knowledge_domains.join(', ')}`);
      console.log('Statistics:', data.statistics);
    } else {
      console.error('❌ Status Check Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Status Check Error:', error.message);
    return false;
  }
}

/**
 * Test knowledge domains endpoint
 */
async function testKnowledgeDomains() {
  console.log('\n📚 Testing Knowledge Domains...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning?action=domains`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Domains Fetch Successful');
      console.log(`Total Domains: ${data.total_domains}`);
      console.log('CFA Topics:', Object.keys(data.cfa_topics || {}));
      console.log('Treasury Topics:', Object.keys(data.treasury_topics || {}));
    } else {
      console.error('❌ Domains Fetch Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Domains Fetch Error:', error.message);
    return false;
  }
}

/**
 * Test validation functionality
 */
async function testValidation() {
  console.log('\n🔍 Testing Validation Functionality...');
  
  const testOutput = {
    weights: {
      'AAPL': 0.3,
      'MSFT': 0.4,
      'GOOGL': 0.3
    },
    expected_return: 0.12,
    risk: 0.18
  };
  
  const testContext = {
    calculation_type: 'portfolio_optimization',
    treasury_function: 'investment_selection'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'validate',
        agent_id: 'test.agent',
        output: testOutput,
        context: testContext
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Validation Test Successful');
      console.log(`Compliance Score: ${data.validation.compliance_score}`);
      console.log(`Errors: ${data.validation.errors.length}`);
      console.log(`Warnings: ${data.validation.warnings.length}`);
      console.log(`Compliance Status: ${data.compliance_status}`);
      
      if (data.validation.errors.length > 0) {
        console.log('Validation Errors:', data.validation.errors);
      }
      if (data.validation.warnings.length > 0) {
        console.log('Validation Warnings:', data.validation.warnings);
      }
    } else {
      console.error('❌ Validation Test Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Validation Test Error:', error.message);
    return false;
  }
}

/**
 * Test context overlay functionality
 */
async function testContextOverlay() {
  console.log('\n🎯 Testing Context Overlay...');
  
  const testTask = {
    id: 'task-001',
    type: 'calculate_portfolio_var',
    parameters: {
      portfolio_id: 'test-portfolio',
      confidence_level: 0.95
    }
  };
  
  const businessContext = {
    treasury_function: 'risk_management',
    reporting_purpose: 'board_presentation',
    regulatory_requirements: ['basel_iii', 'ccar']
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'apply_context',
        agent_id: 'analytics.agent',
        task: testTask,
        business_context: businessContext
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Context Overlay Test Successful');
      console.log(`Context Additions: ${data.context_additions.join(', ')}`);
      console.log(`Constraints Added: ${data.constraints_added}`);
      console.log('Enhanced Task:', data.enhanced_task);
    } else {
      console.error('❌ Context Overlay Test Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Context Overlay Test Error:', error.message);
    return false;
  }
}

/**
 * Test curriculum creation
 */
async function testCurriculumCreation() {
  console.log('\n📖 Testing Curriculum Creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create_curriculum',
        agent_id: 'analytics.test.agent',
        agent_type: 'analytics',
        current_level: 'intermediate'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Curriculum Creation Test Successful');
      console.log(`Total Modules: ${data.total_modules}`);
      console.log(`Estimated Duration: ${data.estimated_duration} hours`);
      console.log('Curriculum Modules:', data.curriculum.modules.map(m => m.name));
    } else {
      console.error('❌ Curriculum Creation Test Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Curriculum Creation Test Error:', error.message);
    return false;
  }
}

/**
 * Test knowledge assessment
 */
async function testKnowledgeAssessment() {
  console.log('\n🎓 Testing Knowledge Assessment...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'assess_knowledge',
        agent_id: 'data.product.agent',
        concept: 'portfolio_optimization',
        test_data: {
          questions_answered: 10,
          correct_answers: 7
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Knowledge Assessment Test Successful');
      console.log(`Assessment Score: ${data.assessment.score}`);
      console.log(`Passed: ${data.passed ? 'Yes' : 'No'}`);
      console.log(`Strengths: ${data.assessment.strengths.join(', ')}`);
      console.log(`Weaknesses: ${data.assessment.weaknesses.join(', ')}`);
      console.log(`Recommendations: ${data.assessment.recommendations.join(', ')}`);
    } else {
      console.error('❌ Knowledge Assessment Test Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Knowledge Assessment Test Error:', error.message);
    return false;
  }
}

/**
 * Test validation history
 */
async function testValidationHistory() {
  console.log('\n📊 Testing Validation History...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning?action=validations&days=7`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Validation History Test Successful');
      console.log(`Total Validations: ${data.summary.total_validations}`);
      console.log(`Average Compliance Score: ${data.summary.average_compliance_score.toFixed(2)}`);
      console.log(`Total Errors: ${data.summary.total_errors}`);
      console.log(`Total Warnings: ${data.summary.total_warnings}`);
    } else {
      console.error('❌ Validation History Test Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Validation History Test Error:', error.message);
    return false;
  }
}

/**
 * Test monitor agent functionality
 */
async function testMonitorAgent() {
  console.log('\n👁️ Testing Agent Monitoring...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/agents/curriculum-learning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'monitor_agent',
        agent_id: 'interface.agent',
        action: 'generate_report',
        params: {
          report_type: 'portfolio_performance',
          format: 'pdf'
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Agent Monitoring Test Successful');
      console.log(`Interventions Made: ${data.interventions_made}`);
      console.log(`Requires Training: ${data.requires_training ? 'Yes' : 'No'}`);
      
      if (data.monitoring.interventions.length > 0) {
        console.log('Interventions:', data.monitoring.interventions);
      }
    } else {
      console.error('❌ Agent Monitoring Test Failed:', data);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Agent Monitoring Test Error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Curriculum Learning Agent Tests');
  console.log('=========================================');
  
  const tests = [
    { name: 'Agent Status', fn: testAgentStatus },
    { name: 'Knowledge Domains', fn: testKnowledgeDomains },
    { name: 'Validation', fn: testValidation },
    { name: 'Context Overlay', fn: testContextOverlay },
    { name: 'Curriculum Creation', fn: testCurriculumCreation },
    { name: 'Knowledge Assessment', fn: testKnowledgeAssessment },
    { name: 'Validation History', fn: testValidationHistory },
    { name: 'Agent Monitoring', fn: testMonitorAgent }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n⏳ Running ${test.name} test...`);
    const success = await test.fn();
    results.push({ name: test.name, success });
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n=========================================');
  console.log('📈 TEST SUMMARY');
  console.log('=========================================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log('\n-----------------------------------------');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The Curriculum Learning Agent is working perfectly!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
  }
}

// Run tests
runAllTests().catch(console.error);
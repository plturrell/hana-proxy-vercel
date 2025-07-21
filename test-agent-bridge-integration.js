/**
 * Test Agent Bridge Integration
 * Verifies that the UI sections are properly updated with real V2 agent data
 */

import { promises as fs } from 'fs';
import path from 'path';

class AgentBridgeIntegrationTest {
  constructor() {
    this.testResults = [];
    this.publicPath = './public';
  }

  /**
   * Run comprehensive integration test
   */
  async runTests() {
    console.log('🧪 Testing Agent Bridge Integration...\n');

    // Test 1: Verify agent-bridge.js has all required methods
    await this.testAgentBridgeStructure();

    // Test 2: Verify HTML has correct section IDs
    await this.testHTMLStructure();

    // Test 3: Verify stub files are replaced with real functionality
    await this.testStubReplacements();

    // Test 4: Verify section update methods exist
    await this.testSectionUpdateMethods();

    // Test 5: Verify test function mappings
    await this.testFunctionMappings();

    // Generate summary report
    this.generateReport();
  }

  /**
   * Test agent-bridge.js structure
   */
  async testAgentBridgeStructure() {
    console.log('📊 Testing agent-bridge.js structure...');
    
    try {
      const agentBridgeContent = await fs.readFile(
        path.join(this.publicPath, 'agent-bridge.js'), 
        'utf8'
      );

      const requiredMethods = [
        'initialize',
        'loadAgents',
        'updateAgentOverview',
        'updateSectionAgents',
        'updateAnalyticsSection',
        'updateFinancialSection',
        'updateMLSection', 
        'updateDataSection',
        'updateTrustSection',
        'testFunction',
        'testAgentCalculation',
        'generateAgentCard',
        'generateFunctionCards'
      ];

      const missingMethods = requiredMethods.filter(method => 
        !agentBridgeContent.includes(`${method}(`) && 
        !agentBridgeContent.includes(`async ${method}(`)
      );

      if (missingMethods.length === 0) {
        this.testResults.push({
          test: 'Agent Bridge Structure',
          status: 'PASS',
          message: 'All required methods are present'
        });
      } else {
        this.testResults.push({
          test: 'Agent Bridge Structure',
          status: 'FAIL',
          message: `Missing methods: ${missingMethods.join(', ')}`
        });
      }
    } catch (error) {
      this.testResults.push({
        test: 'Agent Bridge Structure',
        status: 'ERROR',
        message: `Failed to read agent-bridge.js: ${error.message}`
      });
    }
  }

  /**
   * Test HTML structure for section IDs
   */
  async testHTMLStructure() {
    console.log('🏗️  Testing HTML structure...');
    
    try {
      const htmlContent = await fs.readFile(
        path.join(this.publicPath, 'model-jobs.html'),
        'utf8'
      );

      const requiredSections = [
        { id: 'overview-agents-grid', description: 'Overview agents grid' },
        { id: 'analytics', description: 'Analytics section' },
        { id: 'financial', description: 'Financial section' },
        { id: 'ml', description: 'ML section' },
        { id: 'data', description: 'Data section' },
        { id: 'trust', description: 'Trust section' },
        { id: 'network-total-agents', description: 'Total agents counter' },
        { id: 'network-active-agents', description: 'Active agents counter' },
        { id: 'network-connections', description: 'Connections counter' },
        { id: 'connection-status-btn', description: 'Connection status button' }
      ];

      const missingSections = requiredSections.filter(section => 
        !htmlContent.includes(`id="${section.id}"`)
      );

      if (missingSections.length === 0) {
        this.testResults.push({
          test: 'HTML Structure',
          status: 'PASS',
          message: 'All required section IDs are present'
        });
      } else {
        this.testResults.push({
          test: 'HTML Structure', 
          status: 'FAIL',
          message: `Missing sections: ${missingSections.map(s => s.description).join(', ')}`
        });
      }

      // Check for placeholder text that should be removed
      const placeholderTexts = [
        'PLACEHOLDER CARDS',
        'These will be replaced by real agents',
        'Simulated',
        'placeholder-'
      ];

      const foundPlaceholders = placeholderTexts.filter(text => 
        htmlContent.includes(text)
      );

      if (foundPlaceholders.length > 0) {
        console.log(`⚠️  Found placeholder content: ${foundPlaceholders.join(', ')}`);
      }

    } catch (error) {
      this.testResults.push({
        test: 'HTML Structure',
        status: 'ERROR', 
        message: `Failed to read model-jobs.html: ${error.message}`
      });
    }
  }

  /**
   * Test that stub files are replaced with real functionality
   */
  async testStubReplacements() {
    console.log('🔄 Testing stub file replacements...');

    const stubFiles = [
      { 
        file: 'insanely-great-minimal.js',
        checkFor: 'class InsanelyGreatMinimal',
        shouldNotContain: 'Stub file'
      },
      {
        file: 'a2a-ord-metadata.js', 
        checkFor: 'class A2AOrdMetadata',
        shouldNotContain: 'Stub file'
      }
    ];

    for (const stub of stubFiles) {
      try {
        const content = await fs.readFile(
          path.join(this.publicPath, stub.file),
          'utf8'
        );

        const hasRealImplementation = content.includes(stub.checkFor);
        const hasStubMarker = content.includes(stub.shouldNotContain);

        if (hasRealImplementation && !hasStubMarker) {
          this.testResults.push({
            test: `Stub Replacement: ${stub.file}`,
            status: 'PASS',
            message: 'Real implementation detected'
          });
        } else {
          this.testResults.push({
            test: `Stub Replacement: ${stub.file}`,
            status: 'FAIL',
            message: hasStubMarker ? 'Still contains stub marker' : 'Missing real implementation'
          });
        }
      } catch (error) {
        this.testResults.push({
          test: `Stub Replacement: ${stub.file}`,
          status: 'ERROR',
          message: `Failed to read file: ${error.message}`
        });
      }
    }
  }

  /**
   * Test section update methods
   */
  async testSectionUpdateMethods() {
    console.log('📊 Testing section update methods...');

    try {
      const agentBridgeContent = await fs.readFile(
        path.join(this.publicPath, 'agent-bridge.js'),
        'utf8'
      );

      // Check that section update methods properly populate with v2 agents
      const sectionTests = [
        {
          method: 'updateAnalyticsSection',
          shouldContain: ['generateFunctionCards', 'analytics']
        },
        {
          method: 'updateFinancialSection', 
          shouldContain: ['Market Data Agent', 'News Assessment & Hedge Agent', 'intelligence: 95']
        },
        {
          method: 'updateMLSection',
          shouldContain: ['Client Learning Agent', 'Curriculum Learning Agent', 'intelligence: 91']
        },
        {
          method: 'updateDataSection',
          shouldContain: ['Data Quality Agent', 'News Intelligence Agent', 'intelligence: 89']
        },
        {
          method: 'updateTrustSection',
          shouldContain: ['A2A Protocol Manager', 'API Gateway Agent', 'ORD Registry Manager']
        }
      ];

      let passedSections = 0;

      for (const section of sectionTests) {
        const methodStartIndex = agentBridgeContent.indexOf(`${section.method}(`);
        if (methodStartIndex === -1) {
          this.testResults.push({
            test: `Section Method: ${section.method}`,
            status: 'FAIL',
            message: 'Method not found'
          });
          continue;
        }

        // Extract method content (approximate)
        const methodEndIndex = agentBridgeContent.indexOf('  }', methodStartIndex + 200);
        const methodContent = agentBridgeContent.substring(methodStartIndex, methodEndIndex);

        const missingContent = section.shouldContain.filter(content => 
          !methodContent.includes(content)
        );

        if (missingContent.length === 0) {
          passedSections++;
        } else {
          this.testResults.push({
            test: `Section Method: ${section.method}`,
            status: 'FAIL',
            message: `Missing content: ${missingContent.join(', ')}`
          });
        }
      }

      if (passedSections === sectionTests.length) {
        this.testResults.push({
          test: 'Section Update Methods',
          status: 'PASS',
          message: 'All section methods have proper V2 agent content'
        });
      }

    } catch (error) {
      this.testResults.push({
        test: 'Section Update Methods',
        status: 'ERROR',
        message: `Failed to analyze methods: ${error.message}`
      });
    }
  }

  /**
   * Test function mappings for calculations
   */
  async testFunctionMappings() {
    console.log('🧮 Testing function mappings...');

    try {
      const agentBridgeContent = await fs.readFile(
        path.join(this.publicPath, 'agent-bridge.js'),
        'utf8'
      );

      // Check that testAgentCalculation has proper mappings
      const requiredMappings = [
        'Market Data Agent',
        'News Intelligence Agent',
        'News Assessment & Hedge Agent',
        'Client Learning Agent',
        'Data Quality Agent',
        'A2A Protocol Manager'
      ];

      const missingMappings = requiredMappings.filter(agent => 
        !agentBridgeContent.includes(`'${agent}':`)
      );

      if (missingMappings.length === 0) {
        this.testResults.push({
          test: 'Function Mappings',
          status: 'PASS',
          message: 'All V2 agents have test function mappings'
        });
      } else {
        this.testResults.push({
          test: 'Function Mappings',
          status: 'FAIL',
          message: `Missing mappings for: ${missingMappings.join(', ')}`
        });
      }

      // Check that mathematical functions are properly mapped
      const mathFunctions = [
        'sharpe_ratio',
        'black_scholes',
        'clustering',
        'outlier_detection',
        'pearson_correlation',
        'value_at_risk'
      ];

      const missingFunctions = mathFunctions.filter(func => 
        !agentBridgeContent.includes(`'${func}'`)
      );

      if (missingFunctions.length === 0) {
        this.testResults.push({
          test: 'Mathematical Functions',
          status: 'PASS',
          message: 'All mathematical functions are mapped'
        });
      } else {
        this.testResults.push({
          test: 'Mathematical Functions',
          status: 'FAIL',
          message: `Missing functions: ${missingFunctions.join(', ')}`
        });
      }

    } catch (error) {
      this.testResults.push({
        test: 'Function Mappings',
        status: 'ERROR',
        message: `Failed to analyze mappings: ${error.message}`
      });
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📋 Agent Bridge Integration Test Report');
    console.log('='.repeat(50));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;

    console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${errors} errors\n`);

    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });

    if (failed === 0 && errors === 0) {
      console.log('\n🎉 All tests passed! Agent Bridge integration is ready.');
      console.log('\n🚀 Next steps:');
      console.log('   1. Test the live UI by opening model-jobs.html in browser');
      console.log('   2. Verify each section loads real V2 agent data');
      console.log('   3. Test "Test Function" and "Test Agent" buttons');
      console.log('   4. Confirm no placeholder text remains');
    } else {
      console.log('\n⚠️  Integration issues detected. Please fix before testing UI.');
    }

    console.log('\n' + '='.repeat(50));
  }
}

// Run the test
const tester = new AgentBridgeIntegrationTest();
tester.runTests().catch(console.error);
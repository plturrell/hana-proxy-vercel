/**
 * Test ORD (Open Resource Discovery) Compliance
 * Verifies our implementation against ORD v1 specification
 */

const BASE_URL = 'https://hana-proxy-vercel-1hjwde39b-plturrells-projects.vercel.app';

// Test 1: ORD Configuration Endpoint
async function testORDConfiguration() {
  console.log('\n🔍 Test 1: ORD Configuration Endpoint');
  
  try {
    const response = await fetch(`${BASE_URL}/.well-known/open-resource-discovery/v1/configuration`);
    
    if (!response.ok) {
      console.log('❌ ORD configuration endpoint not found');
      return false;
    }
    
    const config = await response.json();
    console.log('✅ ORD configuration retrieved');
    console.log(`  - Base URL: ${config.baseUrl}`);
    console.log(`  - Document URLs: ${config.ordDocumentUrls?.length || 0}`);
    console.log(`  - Has blockchain extension: ${!!config.ordExtensions?.blockchain}`);
    
    return true;
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message);
    return false;
  }
}

// Test 2: ORD Document Structure
async function testORDDocument() {
  console.log('\n📄 Test 2: ORD Document Structure');
  
  try {
    const response = await fetch(`${BASE_URL}/open-resource-discovery/v1/documents/analytics-agents`);
    
    if (!response.ok) {
      console.log('❌ ORD document endpoint not found');
      return false;
    }
    
    const document = await response.json();
    console.log('✅ ORD document retrieved');
    
    // Check required fields
    const requiredFields = ['openResourceDiscovery', 'perspective'];
    const hasRequired = requiredFields.every(field => document[field]);
    console.log(`  - Has required fields: ${hasRequired ? '✅' : '❌'}`);
    console.log(`  - ORD version: ${document.openResourceDiscovery}`);
    console.log(`  - Perspective: ${document.perspective}`);
    
    // Check resource types
    const resourceTypes = ['packages', 'capabilities', 'apiResources', 'eventResources', 'entityTypes'];
    resourceTypes.forEach(type => {
      const count = document[type]?.length || 0;
      console.log(`  - ${type}: ${count} items`);
    });
    
    return hasRequired;
  } catch (error) {
    console.log('❌ Document test failed:', error.message);
    return false;
  }
}

// Test 3: Resource Namespace Compliance
async function testNamespaceCompliance() {
  console.log('\n🏷️  Test 3: Namespace Compliance');
  
  try {
    const response = await fetch(`${BASE_URL}/open-resource-discovery/v1/documents/analytics-agents`);
    if (!response.ok) return false;
    
    const document = await response.json();
    
    // Check ordId format
    const sampleCapability = document.capabilities?.[0];
    if (sampleCapability) {
      console.log('✅ Checking namespace format');
      console.log(`  - Sample ordId: ${sampleCapability.ordId}`);
      
      const validNamespace = sampleCapability.ordId.startsWith('urn:') || 
                            sampleCapability.ordId.includes(':');
      console.log(`  - Valid namespace format: ${validNamespace ? '✅' : '❌'}`);
      
      return validNamespace;
    }
    
    console.log('❌ No capabilities found to check namespace');
    return false;
  } catch (error) {
    console.log('❌ Namespace test failed:', error.message);
    return false;
  }
}

// Test 4: API Resource Definitions
async function testAPIResourceDefinitions() {
  console.log('\n🔌 Test 4: API Resource Definitions');
  
  try {
    const response = await fetch(`${BASE_URL}/open-resource-discovery/v1/documents/analytics-agents`);
    if (!response.ok) return false;
    
    const document = await response.json();
    const apiResource = document.apiResources?.[0];
    
    if (!apiResource) {
      console.log('❌ No API resources found');
      return false;
    }
    
    console.log('✅ API resource found');
    console.log(`  - Title: ${apiResource.title}`);
    console.log(`  - Protocol: ${apiResource.apiProtocol}`);
    console.log(`  - Has resource definitions: ${!!apiResource.resourceDefinitions}`);
    
    // Check OpenAPI definition
    const openApiDef = apiResource.resourceDefinitions?.find(d => d.type === 'openapi-v3');
    if (openApiDef) {
      console.log(`  - OpenAPI URL: ${openApiDef.url}`);
      
      // Try to fetch OpenAPI doc
      const openApiUrl = `${BASE_URL}${openApiDef.url}`;
      const openApiResponse = await fetch(openApiUrl);
      console.log(`  - OpenAPI accessible: ${openApiResponse.ok ? '✅' : '❌'}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ API resource test failed:', error.message);
    return false;
  }
}

// Test 5: Package and Group Organization
async function testPackageStructure() {
  console.log('\n📦 Test 5: Package and Group Structure');
  
  try {
    const response = await fetch(`${BASE_URL}/open-resource-discovery/v1/documents/analytics-agents`);
    if (!response.ok) return false;
    
    const document = await response.json();
    
    console.log('✅ Checking package structure');
    console.log(`  - Packages: ${document.packages?.length || 0}`);
    console.log(`  - Groups: ${document.groups?.length || 0}`);
    
    // Check if resources reference packages
    const capability = document.capabilities?.[0];
    if (capability) {
      console.log(`  - Capability references package: ${!!capability.partOfPackage ? '✅' : '❌'}`);
      console.log(`  - Package: ${capability.partOfPackage}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Package structure test failed:', error.message);
    return false;
  }
}

// Compliance Summary
async function runORDComplianceTests() {
  console.log('🔍 ORD (Open Resource Discovery) Compliance Test');
  console.log('📍 Testing against ORD v1 Specification');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Configuration Endpoint', fn: testORDConfiguration },
    { name: 'Document Structure', fn: testORDDocument },
    { name: 'Namespace Compliance', fn: testNamespaceCompliance },
    { name: 'API Resource Definitions', fn: testAPIResourceDefinitions },
    { name: 'Package Structure', fn: testPackageStructure }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 ORD Compliance Summary:');
  
  let passed = 0;
  results.forEach(result => {
    console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`);
    if (result.passed) passed++;
  });
  
  const score = Math.round((passed / tests.length) * 100);
  console.log(`\n🎯 ORD Compliance Score: ${score}%`);
  
  // Comparison with our table-based approach
  console.log('\n📋 Comparison:');
  console.log('  Our Implementation: Database tables (ord_analytics_resources)');
  console.log('  ORD Standard: REST endpoints with JSON documents');
  console.log('  Recommendation: Add ORD adapter layer for external compliance');
}

// Run tests
runORDComplianceTests()
  .then(() => console.log('\n✨ ORD compliance test completed'))
  .catch(error => console.error('\n💥 Test suite error:', error));
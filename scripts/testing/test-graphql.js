// Test GraphQL endpoint locally
import fetch from 'node-fetch';

const GRAPHQL_URL = process.env.VERCEL_URL 
  ? `${process.env.VERCEL_URL}/api/graphql`
  : 'http://localhost:3000/api/graphql';

async function testGraphQL() {
  console.log('🧪 Testing GraphQL endpoint...\n');
  
  const query = `
    query TestQuery {
      __schema {
        queryType {
          name
          fields {
            name
            description
          }
        }
      }
    }
  `;
  
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
    } else {
      console.log('✅ GraphQL endpoint is working!');
      console.log('📋 Available queries:');
      result.data.__schema.queryType.fields.forEach(field => {
        console.log(`  • ${field.name}: ${field.description || 'No description'}`);
      });
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure to run "vercel dev" first to test locally');
  }
}

// Run test
testGraphQL().catch(console.error);
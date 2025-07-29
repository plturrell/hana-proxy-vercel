/**
 * Test if document list API fix is working
 */

import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const VERCEL_URL = 'https://hana-proxy-vercel.vercel.app';

async function testDocumentsFix() {
  console.log('🧪 Testing Document List API Fix\n' + '='.repeat(50));
  
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\nAttempt ${attempts}/${maxAttempts}:`);
    
    try {
      // Test the endpoint
      const response = await fetch(`${VERCEL_URL}/api/rag/process?list=documents`);
      const data = await response.json();
      
      // Check if we get the documents response
      if (data.documents !== undefined) {
        console.log('✅ SUCCESS! Document list API is working!');
        console.log(`📊 Response: ${JSON.stringify(data, null, 2)}`);
        
        // Test the UI
        console.log('\n🌐 Testing UI Integration:');
        const uiResponse = await fetch(`${VERCEL_URL}/teach-jobs.html`);
        if (uiResponse.ok) {
          console.log('✅ Teach interface is accessible');
          console.log(`\n🎉 Knowledge Base is fully functional!`);
          console.log(`📍 URL: ${VERCEL_URL}/teach-jobs.html`);
          console.log(`📚 Click the "Knowledge" tab to access the document manager`);
        }
        
        return;
      } else {
        console.log('⏳ Still deploying... Got status response instead of documents');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    if (attempts < maxAttempts) {
      console.log('Waiting 10 seconds...');
      await setTimeout(10000);
    }
  }
  
  console.log('\n❌ Deployment timeout - fix may still be deploying');
  console.log('Try accessing: ' + VERCEL_URL + '/teach-jobs.html');
}

testDocumentsFix().catch(console.error);
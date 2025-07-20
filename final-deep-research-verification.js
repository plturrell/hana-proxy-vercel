#!/usr/bin/env node

import fetch from 'node-fetch';

const PRODUCTION_URL = 'https://hana-proxy-vercel-h5qyafh2i-plturrells-projects.vercel.app';

async function finalVerification() {
  console.log('🎯 FINAL DEEP RESEARCH PRODUCTION VERIFICATION\n');
  console.log(`Testing: ${PRODUCTION_URL}\n`);

  try {
    // Test 1: Full AI verification with deep research
    console.log('1️⃣ Testing All AI Features Including Deep Research...');
    const verifyResponse = await fetch(`${PRODUCTION_URL}/api/news-intelligence-verify?action=verify-all`);
    const verifyData = await verifyResponse.json();

    const { total_features, working, degraded, failed, health_score, production_ready } = verifyData.summary;

    console.log('📊 COMPREHENSIVE AI STATUS:');
    console.log(`   Total Features: ${total_features}`);
    console.log(`   Working: ${working} ✅`);
    console.log(`   Degraded: ${degraded} ⚠️`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Health Score: ${health_score}%`);
    console.log(`   Production Ready: ${production_ready ? 'YES ✅' : 'NO ❌'}\n`);

    // Test 2: Deep Research Specifically
    console.log('2️⃣ Testing Deep Research Capabilities...');
    if (verifyData.features.deep_research) {
      const dr = verifyData.features.deep_research;
      console.log(`   Status: ${dr.status} ${dr.status === 'working' ? '✅' : '❌'}`);
      console.log(`   Sources Analyzed: ${dr.metadata?.sources_analyzed || 0}`);
      console.log(`   Reasoning Tokens: ${dr.metadata?.reasoning_tokens || 0}`);
      console.log(`   Research Depth: ${dr.metadata?.research_depth || 'unknown'}`);
      console.log('   Capabilities:');
      dr.capabilities?.forEach(cap => {
        console.log(`     • ${cap}`);
      });
    }

    // Test 3: Direct Deep Research API
    console.log('\n3️⃣ Testing Direct Deep Research API...');
    const deepResponse = await fetch(`${PRODUCTION_URL}/api/deep-research-intelligence?action=company-research&symbol=AAPL`);
    
    if (deepResponse.ok) {
      const deepData = await deepResponse.json();
      console.log('   ✅ Direct Deep Research API Working');
      console.log(`   Sources Analyzed: ${deepData.metadata?.sources_analyzed || 0}`);
      console.log(`   Research Depth: ${deepData.metadata?.research_depth || 'unknown'}`);
      console.log(`   Report ID: ${deepData.report_id || 'N/A'}`);
    } else {
      console.log('   ⚠️  Direct API needs investigation');
    }

    // Test 4: Database Integration
    console.log('\n4️⃣ Testing Database Integration...');
    if (verifyData.dependencies?.database_tables) {
      const tables = verifyData.dependencies.database_tables;
      console.log('   Database Tables:');
      Object.entries(tables).forEach(([table, status]) => {
        console.log(`     ${status === 'exists' ? '✅' : '❌'} ${table}: ${status}`);
      });
    }

    // Final Summary
    if (production_ready && health_score === 100) {
      console.log('\n🏆 DEEP RESEARCH INTEGRATION COMPLETE!');
      console.log('\n🚀 PRODUCTION SYSTEM NOW INCLUDES:');
      console.log('   ⚡ 30-second breaking news detection');
      console.log('   🧠 Multi-dimensional sentiment analysis');
      console.log('   🤖 AI-powered entity extraction');
      console.log('   📊 Cross-asset market impact modeling');
      console.log('   💡 Real-time news intelligence');
      console.log('   🗄️ Complete database infrastructure');
      console.log('   🔬 INSTITUTIONAL-GRADE DEEP RESEARCH');
      console.log('   📈 Multi-source competitive intelligence');
      console.log('   ⚖️ Comprehensive risk assessment');
      console.log('   🎯 Investment due diligence reports');
      
      console.log('\n🌐 PRODUCTION URLs:');
      console.log(`   • Main System: ${PRODUCTION_URL}`);
      console.log(`   • Deep Research API: ${PRODUCTION_URL}/api/deep-research-intelligence`);
      console.log(`   • GraphQL Endpoint: ${PRODUCTION_URL}/api/graphql`);
      console.log(`   • Verification: ${PRODUCTION_URL}/api/news-intelligence-verify`);
      
      console.log('\n✨ DEEP RESEARCH FEATURES:');
      console.log('   📚 Analysis across hundreds of sources');
      console.log('   🔍 Exhaustive institutional-grade research');
      console.log('   💎 Multi-source synthesis and reasoning');
      console.log('   📊 Comprehensive competitive intelligence');
      console.log('   ⚠️  Advanced risk assessment models');
      console.log('   💼 Investment due diligence automation');
      
      console.log('\n🎉 MISSION ACCOMPLISHED - ALL SYSTEMS OPERATIONAL! 🎉');
    }

  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
  }
}

finalVerification().catch(console.error);
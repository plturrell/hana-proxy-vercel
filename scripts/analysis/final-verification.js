#!/usr/bin/env node

import fetch from 'node-fetch';

const PRODUCTION_URL = 'https://hana-proxy-vercel-6o63parz6-plturrells-projects.vercel.app';

async function finalVerification() {
  console.log('🎯 FINAL AI PRODUCTION VERIFICATION\n');
  console.log(`Testing: ${PRODUCTION_URL}\n`);

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/news-intelligence-verify?action=verify-all`);
    const data = await response.json();

    const { total_features, working, degraded, failed, health_score, production_ready } = data.summary;

    console.log('📊 FINAL DEPLOYMENT STATUS:');
    console.log(`   Total Features: ${total_features}`);
    console.log(`   Working: ${working} ✅`);
    console.log(`   Degraded: ${degraded} ⚠️`);
    console.log(`   Failed: ${failed} ❌`);
    console.log(`   Health Score: ${health_score}%`);
    console.log(`   Production Ready: ${production_ready ? 'YES ✅' : 'NO ❌'}\n`);

    console.log('🔥 OPERATIONAL AI FEATURES:');
    for (const [name, status] of Object.entries(data.features)) {
      const icon = status.status === 'working' ? '✅' :
                  status.status === 'degraded' ? '⚠️' : '❌';
      console.log(`   ${icon} ${name.replace('_', ' ').toUpperCase()}: ${status.status}`);
      
      if (status.capabilities) {
        status.capabilities.slice(0, 2).forEach(cap => {
          console.log(`      • ${cap}`);
        });
      }
      
      if (status.test_result && typeof status.test_result === 'object') {
        console.log(`      • Test: ${JSON.stringify(status.test_result).substring(0, 60)}...`);
      }
    }

    if (production_ready && health_score === 100) {
      console.log('\n🎉 ALL AI FEATURES 100% OPERATIONAL!');
      console.log('\n🚀 LIVE PRODUCTION CAPABILITIES:');
      console.log('   ⚡ 30-second breaking news detection');
      console.log('   🧠 Multi-dimensional sentiment analysis');  
      console.log('   🤖 AI-powered entity extraction');
      console.log('   📊 Cross-asset market impact modeling');
      console.log('   💡 Real-time news intelligence');
      console.log('   🗄️ Complete database infrastructure');
      
      console.log('\n🌐 PRODUCTION URLs:');
      console.log(`   • Main App: ${PRODUCTION_URL}`);
      console.log(`   • Visual Builder: ${PRODUCTION_URL}/public/visual-builder-real.html`);
      console.log(`   • Model Jobs: ${PRODUCTION_URL}/public/model-jobs.html`);
      
      console.log('\n🏆 DEPLOYMENT SUCCESS - ALL SYSTEMS OPERATIONAL! 🏆');
    }

  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
  }
}

finalVerification().catch(console.error);
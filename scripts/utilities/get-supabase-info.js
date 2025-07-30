#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'https://hana-proxy-vercel-16psq0m1p-plturrells-projects.vercel.app';

async function getSupabaseInfo() {
  console.log('🔍 Extracting Supabase project information...\n');
  
  // The Supabase URL format is: https://[project-ref].supabase.co
  // We can extract the project reference from error messages or successful responses
  
  try {
    // Make a request that will show us the Supabase URL in headers or error
    const response = await fetch(`${API_BASE}/api/supabase-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'select',
        table: 'system_info',
        query: '*'
      })
    });
    
    // Check response headers for clues
    const headers = response.headers;
    console.log('Response status:', response.status);
    
    // Try to get project info from the response
    const text = await response.text();
    
    // Look for Supabase URL patterns
    const supabaseUrlMatch = text.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
    if (supabaseUrlMatch) {
      const projectRef = supabaseUrlMatch[1];
      console.log('✅ Found Supabase project reference:', projectRef);
      console.log('📋 Full URL:', supabaseUrlMatch[0]);
      
      console.log('\n🚀 To link and push migrations:\n');
      console.log(`1. Link to project:`);
      console.log(`   supabase link --project-ref ${projectRef}\n`);
      console.log(`2. Push migrations:`);
      console.log(`   supabase db push\n`);
      console.log(`3. Or apply directly in dashboard:`);
      console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
      
      return projectRef;
    }
    
    // Check if we got valid JSON response (means Supabase is working)
    try {
      const json = JSON.parse(text);
      console.log('✅ Supabase is connected and working');
      console.log('❓ Project reference not found in response');
      console.log('\nTo find your project reference:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project');
      console.log('3. The URL will contain: /project/[your-project-ref]');
    } catch (e) {
      console.log('Response:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getSupabaseInfo();
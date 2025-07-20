#!/usr/bin/env node
/**
 * Test Supabase Connection
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Supabase Connection');
console.log('='.repeat(50));

// Check environment variables
console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Test with anon key
console.log('\n📋 Testing connection with anon key...');
const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

try {
  const { data, error } = await supabaseAnon
    .from('a2a_agents')
    .select('count', { count: 'exact', head: true });
    
  if (error) {
    console.log('❌ Anon key failed:', error.message);
  } else {
    console.log('✅ Anon key works. Count:', data);
  }
} catch (err) {
  console.log('❌ Anon key error:', err.message);
}

// Test with service key if available
if (process.env.SUPABASE_SERVICE_KEY) {
  console.log('\n📋 Testing connection with service key...');
  const supabaseService = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  try {
    const { data, error } = await supabaseService
      .from('a2a_agents')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      console.log('❌ Service key failed:', error.message);
    } else {
      console.log('✅ Service key works. Count:', data);
    }
  } catch (err) {
    console.log('❌ Service key error:', err.message);
  }
}

// List all agents
console.log('\n📋 Listing current agents...');
try {
  const { data: agents, error } = await supabaseAnon
    .from('a2a_agents')
    .select('agent_id, agent_name')
    .limit(10);
    
  if (error) {
    console.log('❌ Failed to list agents:', error.message);
  } else {
    console.log(`✅ Found ${agents.length} agents:`);
    agents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent.agent_id} (${agent.agent_name || 'No name'})`);
    });
  }
} catch (err) {
  console.log('❌ List agents error:', err.message);
}
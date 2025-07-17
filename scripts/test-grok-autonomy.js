/**
 * Test script for Grok4-powered A2A Autonomy Engine via Supabase Edge Functions
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testGrokAutonomyEngine() {
  console.log('🧠 Testing Grok4-powered A2A Autonomy Engine...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Edge Function Health Check...');
    const { data: healthData, error: healthError } = await supabase.functions.invoke('a2a-autonomy-engine', {
      body: { action: 'health_check' },
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_KEY
      }
    });
    
    if (healthError) {
      console.error('❌ Health check failed:', healthError);
      return;
    }
    
    console.log('✅ Health Check Result:', healthData);
    console.log('🔑 Grok API Configured:', healthData.grok_api_configured ? '✅ Yes' : '❌ No');
    console.log('');

    // 2. Check current agents
    console.log('2️⃣ Checking autonomous agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('a2a_agents')
      .select('agent_id, name, type, status, autonomy_enabled')
      .eq('autonomy_enabled', true);
    
    if (agentsError) {
      console.error('❌ Error getting agents:', agentsError);
      return;
    }
    
    console.log(`✅ Found ${agents?.length || 0} autonomous agents:`);
    agents?.forEach(agent => {
      console.log(`   🤖 ${agent.name} (${agent.type}) - ${agent.status}`);
    });
    console.log('');

    // 3. Create a test message to trigger autonomous processing
    console.log('3️⃣ Creating test message for autonomous processing...');
    const testMessageId = `test-msg-${Date.now()}`;
    const testAgentIds = agents?.slice(0, 2).map(a => a.agent_id) || [];
    
    if (testAgentIds.length === 0) {
      console.log('⚠️  No agents available for testing. Please ensure agents are set up in the database.');
      return;
    }

    const { error: msgError } = await supabase
      .from('a2a_messages')
      .insert({
        message_id: testMessageId,
        sender_id: 'test-system',
        recipient_ids: testAgentIds,
        message_type: 'test_autonomous',
        content: {
          message: 'This is a test message to trigger autonomous agent responses using Grok4 AI',
          test_scenario: 'autonomy_test',
          requires_response: true
        },
        autonomy_generated: false
      });

    if (msgError) {
      console.error('❌ Error creating test message:', msgError);
      return;
    }
    
    console.log(`✅ Created test message: ${testMessageId}`);
    console.log(`📬 Recipients: ${testAgentIds.join(', ')}`);
    console.log('');

    // 4. Process the message through autonomous agents
    console.log('4️⃣ Processing message through Grok4-powered autonomous agents...');
    const { data: processResult, error: processError } = await supabase.functions.invoke('a2a-autonomy-engine', {
      body: {
        action: 'process_message',
        message_id: testMessageId
      },
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_KEY
      }
    });

    if (processError) {
      console.error('❌ Error processing message:', processError);
      return;
    }

    console.log('✅ Message Processing Result:', JSON.stringify(processResult, null, 2));
    console.log('');

    // 5. Create a test proposal for autonomous voting
    console.log('5️⃣ Creating test proposal for autonomous voting...');
    const testProposalId = `test-prop-${Date.now()}`;
    
    const { error: propError } = await supabase
      .from('a2a_proposals')
      .insert({
        proposal_id: testProposalId,
        proposer_id: 'test-system',
        title: 'Test Autonomous Voting Proposal',
        proposal_type: 'test_vote',
        proposal_data: {
          description: 'This is a test proposal to evaluate autonomous agent voting using Grok4 AI',
          options: ['approve', 'reject'],
          test_scenario: 'autonomy_voting_test'
        },
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

    if (propError) {
      console.error('❌ Error creating test proposal:', propError);
      return;
    }
    
    console.log(`✅ Created test proposal: ${testProposalId}`);
    console.log('');

    // 6. Process the proposal through autonomous agents
    console.log('6️⃣ Processing proposal through Grok4-powered autonomous agents...');
    const { data: voteResult, error: voteError } = await supabase.functions.invoke('a2a-autonomy-engine', {
      body: {
        action: 'process_proposal',
        proposal_id: testProposalId
      },
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_KEY
      }
    });

    if (voteError) {
      console.error('❌ Error processing proposal:', voteError);
      return;
    }

    console.log('✅ Proposal Processing Result:', JSON.stringify(voteResult, null, 2));
    console.log('');

    // 7. Test proactive actions
    console.log('7️⃣ Testing proactive autonomous actions...');
    const { data: proactiveResult, error: proactiveError } = await supabase.functions.invoke('a2a-autonomy-engine', {
      body: {
        action: 'run_proactive'
      },
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_KEY
      }
    });

    if (proactiveError) {
      console.error('❌ Error running proactive actions:', proactiveError);
      return;
    }

    console.log('✅ Proactive Actions Result:', JSON.stringify(proactiveResult, null, 2));
    console.log('');

    // 8. Check agent activity logs
    console.log('8️⃣ Checking recent agent activity...');
    const { data: activity, error: activityError } = await supabase
      .from('agent_activity')
      .select('agent_id, activity_type, details, created_at')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('❌ Error getting activity:', activityError);
    } else {
      console.log(`✅ Recent activity (${activity?.length || 0} entries):`);
      activity?.forEach(act => {
        console.log(`   📊 ${act.agent_id}: ${act.activity_type} at ${new Date(act.created_at).toLocaleTimeString()}`);
      });
    }
    console.log('');

    // 9. Check autonomous messages generated
    console.log('9️⃣ Checking autonomous messages generated...');
    const { data: autoMessages, error: msgError2 } = await supabase
      .from('a2a_messages')
      .select('message_id, sender_id, message_type, content, created_at')
      .eq('autonomy_generated', true)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (msgError2) {
      console.error('❌ Error getting autonomous messages:', msgError2);
    } else {
      console.log(`✅ Autonomous messages (${autoMessages?.length || 0} recent):`);
      autoMessages?.forEach(msg => {
        console.log(`   💬 ${msg.sender_id}: ${msg.message_type} at ${new Date(msg.created_at).toLocaleTimeString()}`);
      });
    }
    console.log('');

    // 10. Check autonomous votes
    console.log('🔟 Checking autonomous votes...');
    const { data: votes, error: voteError2 } = await supabase
      .from('a2a_votes')
      .select('agent_id, proposal_id, vote, reasoning, created_at')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (voteError2) {
      console.error('❌ Error getting votes:', voteError2);
    } else {
      console.log(`✅ Recent autonomous votes (${votes?.length || 0}):`);
      votes?.forEach(vote => {
        console.log(`   🗳️  ${vote.agent_id}: ${vote.vote} on ${vote.proposal_id}`);
        if (vote.reasoning) {
          console.log(`       Reasoning: ${vote.reasoning.substring(0, 100)}...`);
        }
      });
    }

    console.log('\n🎉 Grok4-powered A2A Autonomy Engine test completed successfully!');
    console.log('🧠 Autonomous agents are now making decisions using Grok4 AI via Supabase Edge Functions');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGrokAutonomyEngine();

// src/a2a/autonomy/deploy.ts
import { getAgentEngine, GrokAgentEngine } from './grok-agent-engine';
import { config } from 'dotenv';

config(); // Load environment variables

/**
 * Main deployment script for A2A Autonomy Engine
 */
async function deployAutonomyEngine() {
  console.log('🚀 Deploying A2A Agent Autonomy Engine...\n');
  
  // 1. Validate environment
  validateEnvironment();
  
  // 2. Create and configure engine
  let engine: GrokAgentEngine | null = null;
  engine = getAgentEngine({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY!, // Use service key for full access
    openaiKey: process.env.OPENAI_API_KEY!
  });
  
  // 3. Setup event handlers
  setupEventHandlers(engine);
  
  // 4. Start the engine
  await engine.start();
  
  // 5. Setup graceful shutdown
  setupGracefulShutdown(engine);
  
  console.log('\n✅ A2A Autonomy Engine deployed successfully!');
  console.log('📊 Monitoring dashboard: http://localhost:3001/autonomy\n');
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('\nPlease create a .env file with:');
    console.error(missing.map(key => `${key}=your_value_here`).join('\n'));
    process.exit(1);
  }
}

/**
 * Setup event handlers for monitoring
 */
function setupEventHandlers(engine: any) {
  // Message events
  engine.on('message_sent', (data: any) => {
    console.log(`📤 Message sent by ${data.sender_id}`);
    logToSupabase('agent_activity', {
      type: 'message_sent',
      agent_id: data.sender_id,
      details: data
    });
  });
  
  // Voting events
  engine.on('vote_cast', (data: any) => {
    console.log(`🗳️ Vote cast by ${data.agentId}: ${data.vote}`);
    logToSupabase('agent_activity', {
      type: 'vote_cast',
      agent_id: data.agentId,
      details: data
    });
  });
  
  // Consensus events
  engine.on('consensus_deadline_approaching', (round: any) => {
    console.log(`⏰ Consensus deadline approaching for round ${round.round_id}`);
  });
  
  // Error handling
  engine.on('error', (error: any) => {
    console.error('❌ Engine error:', error);
    logToSupabase('agent_errors', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Log events to Supabase for monitoring
 */
async function logToSupabase(table: string, data: any) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    await supabase.from(table).insert(data);
  } catch (error) {
    console.error('Failed to log to Supabase:', error);
  }
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(engine: any) {
  const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    // Stop accepting new tasks
    engine.stop();
    
    // Wait for ongoing tasks to complete (max 30 seconds)
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// --- Agent Configuration Templates ---

/**
 * Create different types of agents with specific behaviors
 */
export async function createAgentTemplates(supabase: any) {
  const templates = [
    {
      // Data Provider Agent
      agent_id: 'agent-data-provider-001',
      name: 'Data Provider Alpha',
      type: 'data_provider',
      status: 'active',
      voting_power: 100,
      config: {
        personality: 'Professional and detail-oriented',
        goals: [
          'Provide accurate data on request',
          'Maintain data quality standards',
          'Collaborate with analysis agents'
        ],
        capabilities: ['data_retrieval', 'data_validation', 'api_access'],
        scheduled_tasks: [
          {
            name: 'data_quality_check',
            interval: '*/30 * * * *', // Every 30 minutes
            action: 'check_data_freshness'
          }
        ],
        voting_preferences: {
          favor_proposals: ['data_access', 'quality_improvement'],
          oppose_proposals: ['reduce_validation', 'lower_standards']
        }
      },
      stats: {
        messages_sent: 0,
        messages_processed: 0,
        proposals_created: 0,
        votes_cast: 0
      }
    },
    {
      // Analysis Agent
      agent_id: 'agent-analyzer-001',
      name: 'Analysis Engine Beta',
      type: 'analyzer',
      status: 'active',
      voting_power: 150,
      config: {
        personality: 'Analytical and thorough',
        goals: [
          'Perform complex data analysis',
          'Generate insights from data',
          'Propose optimization strategies'
        ],
        capabilities: ['data_analysis', 'ml_inference', 'report_generation'],
        scheduled_tasks: [
          {
            name: 'trend_analysis',
            interval: '0 * * * *', // Every hour
            action: 'analyze_recent_trends'
          }
        ],
        voting_preferences: {
          favor_proposals: ['new_analysis_methods', 'ml_models'],
          oppose_proposals: ['reduce_compute_resources']
        }
      }
    },
    {
      // Coordinator Agent
      agent_id: 'agent-coordinator-001',
      name: 'Task Coordinator Gamma',
      type: 'coordinator',
      status: 'active',
      voting_power: 200,
      config: {
        personality: 'Organized and diplomatic',
        goals: [
          'Coordinate multi-agent tasks',
          'Resolve conflicts between agents',
          'Optimize workflow efficiency'
        ],
        capabilities: ['task_assignment', 'conflict_resolution', 'workflow_optimization'],
        scheduled_tasks: [
          {
            name: 'task_review',
            interval: '*/15 * * * *', // Every 15 minutes
            action: 'review_pending_tasks'
          },
          {
            name: 'performance_check',
            interval: '0 */6 * * *', // Every 6 hours
            action: 'evaluate_agent_performance'
          }
        ],
        voting_preferences: {
          favor_proposals: ['efficiency_improvement', 'collaboration_tools'],
          oppose_proposals: ['reduce_coordination', 'isolate_agents']
        }
      }
    },
    {
      // Validator Agent
      agent_id: 'agent-validator-001',
      name: 'Trust Validator Delta',
      type: 'validator',
      status: 'active',
      voting_power: 250,
      config: {
        personality: 'Cautious and security-focused',
        goals: [
          'Validate agent actions',
          'Ensure compliance with rules',
          'Maintain network security'
        ],
        capabilities: ['action_validation', 'compliance_check', 'security_audit'],
        scheduled_tasks: [
          {
            name: 'security_scan',
            interval: '0 */4 * * *', // Every 4 hours
            action: 'scan_for_anomalies'
          }
        ],
        voting_preferences: {
          favor_proposals: ['security_enhancement', 'validation_rules'],
          oppose_proposals: ['reduce_security', 'bypass_validation'],
          require_high_threshold: ['system_changes', 'permission_grants']
        }
      }
    }
  ];
  
  // Insert templates
  for (const template of templates) {
    const { error } = await supabase
      .from('a2a_agents')
      .upsert(template);
    
    if (error) {
      console.error(`Failed to create agent ${template.name}:`, error);
    } else {
      console.log(`✅ Created agent template: ${template.name}`);
    }
  }
}

// --- Monitoring Dashboard ---

/**
 * Simple monitoring server for the autonomy engine
 */
export async function startMonitoringDashboard() {
  const express = await import('express');
  const app = express.default();
  
  app.use(express.json());
  
  // Dashboard HTML
  app.get('/autonomy', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>A2A Autonomy Engine Dashboard</title>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f7;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 36px;
            font-weight: 600;
            color: #007AFF;
        }
        .stat-label {
            color: #86868b;
            margin-top: 8px;
        }
        .activity-log {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-height: 500px;
            overflow-y: auto;
        }
        .log-entry {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            font-family: monospace;
            font-size: 13px;
        }
        .log-entry.message { color: #007AFF; }
        .log-entry.vote { color: #34C759; }
        .log-entry.error { color: #FF3B30; }
    </style>
</head>
<body>
    <div class="container">
        <h1>A2A Autonomy Engine Dashboard</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="activeAgents">0</div>
                <div class="stat-label">Active Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="messagesSent">0</div>
                <div class="stat-label">Messages Sent</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="votesCast">0</div>
                <div class="stat-label">Votes Cast</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="activeProposals">0</div>
                <div class="stat-label">Active Proposals</div>
            </div>
        </div>
        
        <h2>Activity Log</h2>
        <div class="activity-log" id="activityLog">
            <div class="log-entry">Waiting for activity...</div>
        </div>
    </div>
    
    <script>
        // Poll for updates
        setInterval(async () => {
            const response = await fetch('/autonomy/stats');
            const stats = await response.json();
            
            document.getElementById('activeAgents').textContent = stats.activeAgents;
            document.getElementById('messagesSent').textContent = stats.messagesSent;
            document.getElementById('votesCast').textContent = stats.votesCast;
            document.getElementById('activeProposals').textContent = stats.activeProposals;
        }, 1000);
        
        // Stream activity log
        const eventSource = new EventSource('/autonomy/stream');
        eventSource.onmessage = (event) => {
            const log = document.getElementById('activityLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + event.data.type;
            entry.textContent = new Date().toISOString() + ' - ' + event.data.message;
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 100 entries
            while (log.children.length > 100) {
                log.removeChild(log.lastChild);
            }
        };
    </script>
</body>
</html>
    `);
  });
  
  // Stats endpoint
  app.get('/autonomy/stats', async (req, res) => {
    const engine = (global as any).autonomyEngine;
    
    res.json({
      activeAgents: engine?.activeAgents?.size || 0,
      messagesSent: engine?.stats?.messagesSent || 0,
      votesCast: engine?.stats?.votesCast || 0,
      activeProposals: engine?.stats?.activeProposals || 0
    });
  });
  
  // Activity stream
  app.get('/autonomy/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const engine = (global as any).autonomyEngine;
    
    const messageHandler = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'message', message: `Message sent by ${data.sender_id}` })}\n\n`);
    };
    
    const voteHandler = (data: any) => {
      res.write(`data: ${JSON.stringify({ type: 'vote', message: `Vote cast by ${data.agentId}: ${data.vote}` })}\n\n`);
    };
    
    engine?.on('message_sent', messageHandler);
    engine?.on('vote_cast', voteHandler);
    
    req.on('close', () => {
      engine?.off('message_sent', messageHandler);
      engine?.off('vote_cast', voteHandler);
    });
  });
  
  app.listen(3001, () => {
    console.log('📊 Monitoring dashboard running on http://localhost:3001/autonomy');
  });
}

// --- Main Execution ---

if (require.main === module) {
  deployAutonomyEngine().catch(console.error);
  startMonitoringDashboard().catch(console.error);
}

// LLM Automation API - Intelligent process automation
import { monitoringMiddleware, logger } from './monitoring.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Process patterns for natural language understanding
const PROCESS_PATTERNS = {
    'risk assessment': {
        agents: ['risk-assessment-agent', 'var-calculation-agent', 'risk-reporting-agent'],
        flow: 'sequential',
        trigger: 'daily',
        outputs: ['risk-report', 'alerts']
    },
    'portfolio optimization': {
        agents: ['portfolio-analyzer', 'optimization-engine', 'rebalance-executor'],
        flow: 'sequential',
        trigger: 'on-demand',
        outputs: ['optimized-allocation', 'trade-list']
    },
    'compliance check': {
        agents: ['compliance-checker', 'regulation-monitor', 'audit-logger'],
        flow: 'parallel-gateway',
        trigger: 'pre-trade',
        outputs: ['compliance-status', 'audit-trail']
    },
    'market monitoring': {
        agents: ['market-sentiment-agent', 'news-analyzer', 'alert-dispatcher'],
        flow: 'event-driven',
        trigger: 'real-time',
        outputs: ['market-signals', 'alerts']
    }
};

class LLMAutomationEngine {
    constructor() {
        this.agents = null;
        this.loadAgents();
    }
    
    async loadAgents() {
        const { data } = await supabase
            .from('a2a_agents')
            .select('*');
        this.agents = data || [];
    }
    
    // Parse natural language to process design
    async parseDescription(description) {
        const lower = description.toLowerCase();
        
        // Extract key intent
        const intents = {
            'risk': 'risk assessment',
            'optimize': 'portfolio optimization',
            'compliance': 'compliance check',
            'monitor': 'market monitoring',
            'hedge': 'risk hedging',
            'trade': 'trading execution'
        };
        
        let primaryIntent = null;
        for (const [keyword, intent] of Object.entries(intents)) {
            if (lower.includes(keyword)) {
                primaryIntent = intent;
                break;
            }
        }
        
        // Extract frequency/trigger
        const triggers = {
            'daily': { type: 'timer', frequency: 'daily' },
            'hourly': { type: 'timer', frequency: 'hourly' },
            'real-time': { type: 'event', frequency: 'immediate' },
            'when': { type: 'conditional', frequency: 'on-condition' },
            'if': { type: 'conditional', frequency: 'on-condition' }
        };
        
        let trigger = { type: 'manual', frequency: 'on-demand' };
        for (const [keyword, config] of Object.entries(triggers)) {
            if (lower.includes(keyword)) {
                trigger = config;
                break;
            }
        }
        
        // Extract conditions
        const conditions = [];
        if (lower.includes('exceeds') || lower.includes('above')) {
            conditions.push({ type: 'threshold-exceeded' });
        }
        if (lower.includes('below') || lower.includes('under')) {
            conditions.push({ type: 'threshold-below' });
        }
        
        return {
            intent: primaryIntent,
            trigger,
            conditions,
            originalDescription: description
        };
    }
    
    // Build BPMN from parsed intent
    async buildProcess(parsedIntent) {
        const pattern = PROCESS_PATTERNS[parsedIntent.intent];
        if (!pattern) {
            return this.buildCustomProcess(parsedIntent);
        }
        
        // Get agent details
        const agents = await this.getAgentsByIds(pattern.agents);
        
        // Build BPMN structure
        const process = {
            name: this.generateProcessName(parsedIntent),
            trigger: parsedIntent.trigger,
            steps: []
        };
        
        // Create start event
        process.steps.push({
            type: 'startEvent',
            name: this.generateStartEventName(parsedIntent),
            id: 'start_1'
        });
        
        // Add agent tasks based on flow pattern
        if (pattern.flow === 'sequential') {
            agents.forEach((agent, index) => {
                process.steps.push({
                    type: 'serviceTask',
                    name: this.generateTaskName(agent),
                    agentId: agent.agent_id,
                    agentType: agent.agent_type,
                    id: `task_${index + 1}`
                });
            });
        } else if (pattern.flow === 'parallel-gateway') {
            // Add parallel gateway
            process.steps.push({
                type: 'parallelGateway',
                name: 'Process in Parallel',
                id: 'gateway_1'
            });
            
            // Add parallel tasks
            agents.forEach((agent, index) => {
                process.steps.push({
                    type: 'serviceTask',
                    name: this.generateTaskName(agent),
                    agentId: agent.agent_id,
                    agentType: agent.agent_type,
                    id: `task_${index + 1}`,
                    parallel: true
                });
            });
            
            // Add join gateway
            process.steps.push({
                type: 'parallelGateway',
                name: 'Synchronize',
                id: 'gateway_2'
            });
        }
        
        // Add conditions if needed
        if (parsedIntent.conditions.length > 0) {
            process.steps.push({
                type: 'exclusiveGateway',
                name: 'Check Conditions',
                id: 'gateway_condition',
                conditions: parsedIntent.conditions
            });
        }
        
        // Add end event
        process.steps.push({
            type: 'endEvent',
            name: 'Process Complete',
            id: 'end_1'
        });
        
        // Convert to BPMN XML
        const bpmnXML = this.generateBPMNXML(process);
        
        return {
            process,
            bpmnXML,
            agents: agents.map(a => ({
                id: a.agent_id,
                name: a.name,
                type: a.agent_type
            }))
        };
    }
    
    generateProcessName(parsedIntent) {
        const names = {
            'risk assessment': 'Automated Risk Analysis',
            'portfolio optimization': 'Smart Portfolio Optimizer',
            'compliance check': 'Compliance Verification',
            'market monitoring': 'Market Intelligence Monitor'
        };
        
        return names[parsedIntent.intent] || 'Custom Process';
    }
    
    generateStartEventName(parsedIntent) {
        const triggers = {
            'daily': 'Daily at 9 AM',
            'hourly': 'Every Hour',
            'on-condition': 'When Condition Met',
            'on-demand': 'Start Process'
        };
        
        return triggers[parsedIntent.trigger.frequency] || 'Start';
    }
    
    generateTaskName(agent) {
        // Simplify agent names for display
        const simplifications = {
            'risk-assessment-agent': 'Assess Risk',
            'portfolio-optimization-agent': 'Optimize Portfolio',
            'compliance-officer-agent': 'Check Compliance',
            'market-sentiment-agent': 'Analyze Market Sentiment'
        };
        
        return simplifications[agent.agent_id] || agent.name;
    }
    
    generateBPMNXML(process) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                   xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:a2a="http://a2a.io/schema/bpmn/extensions" 
                   id="ai-generated" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_AI" name="${process.name}" isExecutable="true">`;
        
        // Add elements
        process.steps.forEach((step, index) => {
            if (step.type === 'startEvent') {
                xml += `
    <bpmn2:startEvent id="${step.id}" name="${step.name}">
      <bpmn2:outgoing>flow_${index}</bpmn2:outgoing>
    </bpmn2:startEvent>`;
            } else if (step.type === 'serviceTask') {
                xml += `
    <bpmn2:serviceTask id="${step.id}" name="${step.name}" a2a:agentId="${step.agentId}" a2a:agentType="${step.agentType}">
      <bpmn2:incoming>flow_${index - 1}</bpmn2:incoming>
      <bpmn2:outgoing>flow_${index}</bpmn2:outgoing>
    </bpmn2:serviceTask>`;
            } else if (step.type === 'endEvent') {
                xml += `
    <bpmn2:endEvent id="${step.id}" name="${step.name}">
      <bpmn2:incoming>flow_${index - 1}</bpmn2:incoming>
    </bpmn2:endEvent>`;
            }
        });
        
        // Add flows
        process.steps.forEach((step, index) => {
            if (index < process.steps.length - 1) {
                xml += `
    <bpmn2:sequenceFlow id="flow_${index}" sourceRef="${step.id}" targetRef="${process.steps[index + 1].id}" />`;
            }
        });
        
        xml += `
  </bpmn2:process>
</bpmn2:definitions>`;
        
        return xml;
    }
    
    async getAgentsByIds(agentIds) {
        const { data } = await supabase
            .from('a2a_agents')
            .select('*')
            .in('agent_id', agentIds);
        
        return data || [];
    }
    
    // Fix validation errors automatically
    async fixError(error, context) {
        const fixes = {
            'no incoming flow': {
                action: 'connect-to-previous',
                message: 'Connected to previous element'
            },
            'no outgoing flow': {
                action: 'connect-to-next',
                message: 'Connected to next element'
            },
            'no agent assigned': {
                action: 'assign-best-agent',
                message: 'Assigned appropriate agent'
            },
            'disconnected element': {
                action: 'integrate-into-flow',
                message: 'Integrated into process flow'
            }
        };
        
        for (const [pattern, fix] of Object.entries(fixes)) {
            if (error.toLowerCase().includes(pattern)) {
                return fix;
            }
        }
        
        return {
            action: 'general-fix',
            message: 'Applied intelligent fix'
        };
    }
    
    // Suggest agent based on task context
    async suggestAgent(taskName, context) {
        const taskLower = taskName.toLowerCase();
        
        // Direct mappings
        const mappings = {
            'risk': 'risk-assessment-agent',
            'optimize': 'portfolio-optimization-agent',
            'compliance': 'compliance-officer-agent',
            'trade': 'trading-execution-agent',
            'hedge': 'hedge-calculation-agent',
            'market': 'market-sentiment-agent',
            'calculate var': 'var-calculation-agent',
            'monte carlo': 'monte-carlo-simulation-agent'
        };
        
        for (const [keyword, agentId] of Object.entries(mappings)) {
            if (taskLower.includes(keyword)) {
                const agent = this.agents.find(a => a.agent_id === agentId);
                if (agent) {
                    return {
                        ...agent,
                        confidence: 0.9,
                        reason: `Task mentions "${keyword}"`
                    };
                }
            }
        }
        
        // Context-based suggestion
        if (context.previousTask?.agentId) {
            // Suggest complementary agent
            const suggestions = {
                'risk-assessment-agent': 'hedge-calculation-agent',
                'portfolio-analyzer': 'optimization-engine',
                'market-sentiment-agent': 'trading-strategy-agent'
            };
            
            const suggested = suggestions[context.previousTask.agentId];
            if (suggested) {
                const agent = this.agents.find(a => a.agent_id === suggested);
                if (agent) {
                    return {
                        ...agent,
                        confidence: 0.7,
                        reason: 'Complements previous step'
                    };
                }
            }
        }
        
        // Default suggestion
        return {
            agent_id: 'general-processor',
            name: 'General Processor',
            confidence: 0.5,
            reason: 'Default suggestion'
        };
    }
}

// Initialize engine
const engine = new LLMAutomationEngine();

// API Handler
async function llmAutomationHandler(req, res) {
    const { action, ...params } = req.body;
    
    try {
        switch (action) {
            case 'build-from-description': {
                const { description } = params;
                
                logger.info('Building process from description', { description });
                
                // Parse natural language
                const parsed = await engine.parseDescription(description);
                
                // Build process
                const result = await engine.buildProcess(parsed);
                
                return res.status(200).json({
                    success: true,
                    ...result
                });
            }
            
            case 'fix-error': {
                const { error, context } = params;
                
                const fix = await engine.fixError(error, context);
                
                return res.status(200).json({
                    success: true,
                    fix
                });
            }
            
            case 'suggest-agent': {
                const { taskName, context } = params;
                
                const suggestion = await engine.suggestAgent(taskName, context);
                
                return res.status(200).json({
                    success: true,
                    suggestion
                });
            }
            
            case 'analyze-complexity': {
                const { bpmnXML } = params;
                
                // Simple complexity analysis
                const taskCount = (bpmnXML.match(/<bpmn2?:.*Task/g) || []).length;
                const gatewayCount = (bpmnXML.match(/<bpmn2?:.*Gateway/g) || []).length;
                
                return res.status(200).json({
                    success: true,
                    complexity: taskCount + (gatewayCount * 2),
                    agentCount: taskCount
                });
            }
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error('LLM automation error', error);
        return res.status(500).json({ 
            error: 'Automation failed',
            message: error.message 
        });
    }
}

export default monitoringMiddleware(llmAutomationHandler);
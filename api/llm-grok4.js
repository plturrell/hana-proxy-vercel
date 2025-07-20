// Real LLM Automation using Grok4 API
import { monitoringMiddleware, logger } from './monitoring.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class Grok4Automation {
    constructor() {
        this.grokApiKey = process.env.GROK4_API_KEY;
        this.grokEndpoint = process.env.GROK4_ENDPOINT || 'https://api.x.ai/v1';
        this.agents = null;
        this.loadAgents();
    }
    
    async loadAgents() {
        try {
            const { data, error } = await supabase
                .from('a2a_agents')
                .select('*');
            
            if (error) throw error;
            this.agents = data || [];
            logger.info(`Loaded ${this.agents.length} agents from database`);
        } catch (error) {
            logger.error('Failed to load agents', error);
            this.agents = [];
        }
    }
    
    // Natural language to BPMN using Grok4
    async parseDescriptionWithGrok(description) {
        if (!this.grokApiKey) {
            logger.warn('Grok4 API key not configured, using fallback');
            return this.fallbackParsing(description);
        }
        
        try {
            const agentList = this.agents.map(a => ({
                id: a.agent_id,
                name: a.name,
                type: a.agent_type,
                capabilities: a.capabilities
            }));
            
            const prompt = `You are a BPMN process designer for a financial system. 
Available agents: ${JSON.stringify(agentList, null, 2)}

When given a description, respond with a JSON object containing:
{
    "processName": "Short descriptive name",
    "steps": [
        {
            "type": "startEvent|serviceTask|exclusiveGateway|parallelGateway|endEvent",
            "name": "Step name",
            "agentId": "agent-id (only for serviceTasks)",
            "conditions": ["array of conditions for gateways"]
        }
    ],
    "connections": [
        {"from": "step_index", "to": "step_index", "condition": "optional"}
    ],
    "trigger": {"type": "timer|event|manual", "frequency": "daily|hourly|realtime|on-demand"}
}

User request: ${description}`;

            const response = await fetch(`${this.grokEndpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.grokApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'grok-4',
                    messages: [
                        { role: 'system', content: 'You are a BPMN process expert. Always respond with valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Grok4 API error: ${response.status}`);
            }
            
            const data = await response.json();
            const result = JSON.parse(data.choices[0].message.content);
            
            logger.info('Grok4 parsed process design', { processName: result.processName });
            return result;
            
        } catch (error) {
            logger.error('Grok4 parsing failed', error);
            return this.fallbackParsing(description);
        }
    }
    
    // Fix errors using Grok4
    async fixErrorWithGrok(error, context) {
        if (!this.grokApiKey) {
            return this.fallbackFix(error);
        }
        
        try {
            const prompt = `Fix this BPMN validation error:
Error: ${error}
Context: ${JSON.stringify(context, null, 2)}

Respond with a JSON object containing:
{
    "action": "specific action to take",
    "parameters": {"any": "needed parameters"},
    "explanation": "user-friendly explanation"
}`;

            const response = await fetch(`${this.grokEndpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.grokApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'grok-4',
                    messages: [
                        { role: 'system', content: 'You are a BPMN expert helping fix validation errors. Respond with JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                })
            });
            
            const data = await response.json();
            const fix = JSON.parse(data.choices[0].message.content);
            
            logger.info('Grok4 generated fix', { action: fix.action });
            return fix;
            
        } catch (error) {
            logger.error('Grok4 fix generation failed', error);
            return this.fallbackFix(error);
        }
    }
    
    // Suggest agent using Grok4 intelligence
    async suggestAgentWithGrok(taskDescription, availableAgents) {
        if (!this.grokApiKey) {
            return this.fallbackAgentSuggestion(taskDescription, availableAgents);
        }
        
        try {
            const prompt = `Given this task: "${taskDescription}"
And these available agents:
${JSON.stringify(availableAgents.map(a => ({
    id: a.agent_id,
    name: a.name,
    type: a.agent_type,
    capabilities: a.capabilities
})), null, 2)}

Which agent is best suited for this task? Respond with JSON:
{
    "agentId": "selected agent id",
    "confidence": 0.0 to 1.0,
    "reason": "explanation"
}`;

            const response = await fetch(`${this.grokEndpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.grokApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'grok-4',
                    messages: [
                        { role: 'system', content: 'You are an expert at matching tasks to agents.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                })
            });
            
            const data = await response.json();
            const suggestion = JSON.parse(data.choices[0].message.content);
            
            const agent = availableAgents.find(a => a.agent_id === suggestion.agentId);
            if (agent) {
                return {
                    ...agent,
                    confidence: suggestion.confidence,
                    reason: suggestion.reason
                };
            }
            
        } catch (error) {
            logger.error('Grok4 agent suggestion failed', error);
        }
        
        return this.fallbackAgentSuggestion(taskDescription, availableAgents);
    }
    
    // Generate BPMN XML from design
    generateBPMNXML(design) {
        const processId = `Process_${Date.now()}`;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                   xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   xmlns:a2a="http://a2a.io/schema/bpmn/extensions" 
                   id="${processId}_def" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="${processId}" name="${design.processName}" isExecutable="true">`;
        
        // Generate elements
        const elementIds = {};
        design.steps.forEach((step, index) => {
            const elementId = `${step.type}_${index}`;
            elementIds[index] = elementId;
            
            switch (step.type) {
                case 'startEvent':
                    xml += `
    <bpmn2:startEvent id="${elementId}" name="${step.name}">
      <bpmn2:outgoing>flow_${elementId}_out</bpmn2:outgoing>
    </bpmn2:startEvent>`;
                    break;
                    
                case 'serviceTask':
                    const agent = this.agents.find(a => a.agent_id === step.agentId);
                    xml += `
    <bpmn2:serviceTask id="${elementId}" name="${step.name}" 
                       a2a:agentId="${step.agentId}" 
                       a2a:agentType="${agent?.agent_type || 'unknown'}">
      <bpmn2:incoming>flow_${elementId}_in</bpmn2:incoming>
      <bpmn2:outgoing>flow_${elementId}_out</bpmn2:outgoing>
    </bpmn2:serviceTask>`;
                    break;
                    
                case 'endEvent':
                    xml += `
    <bpmn2:endEvent id="${elementId}" name="${step.name}">
      <bpmn2:incoming>flow_${elementId}_in</bpmn2:incoming>
    </bpmn2:endEvent>`;
                    break;
            }
        });
        
        // Generate connections
        design.connections.forEach((conn, index) => {
            const fromId = elementIds[conn.from];
            const toId = elementIds[conn.to];
            const flowId = `flow_${index}`;
            
            xml += `
    <bpmn2:sequenceFlow id="${flowId}" 
                        sourceRef="${fromId}" 
                        targetRef="${toId}"${conn.condition ? ` name="${conn.condition}"` : ''} />`;
        });
        
        xml += `
  </bpmn2:process>
</bpmn2:definitions>`;
        
        return xml;
    }
    
    // Fallback methods
    fallbackParsing(description) {
        logger.warn('Using fallback parsing (no Grok4)');
        const lower = description.toLowerCase();
        
        const steps = [{
            type: 'startEvent',
            name: 'Start Process'
        }];
        
        if (lower.includes('risk')) {
            steps.push({
                type: 'serviceTask',
                name: 'Assess Risk',
                agentId: 'risk-assessment-agent'
            });
        }
        
        if (lower.includes('portfolio')) {
            steps.push({
                type: 'serviceTask',
                name: 'Optimize Portfolio',
                agentId: 'portfolio-optimization-agent'
            });
        }
        
        if (lower.includes('alert') || lower.includes('notify')) {
            steps.push({
                type: 'serviceTask',
                name: 'Send Alert',
                agentId: 'alert-dispatcher'
            });
        }
        
        steps.push({
            type: 'endEvent',
            name: 'Process Complete'
        });
        
        const connections = [];
        for (let i = 0; i < steps.length - 1; i++) {
            connections.push({ from: i, to: i + 1 });
        }
        
        return {
            processName: 'Custom Process',
            steps,
            connections,
            trigger: { type: 'manual', frequency: 'on-demand' }
        };
    }
    
    fallbackFix(error) {
        return {
            action: 'manual-fix',
            parameters: {},
            explanation: 'Please fix this manually'
        };
    }
    
    fallbackAgentSuggestion(taskDescription, availableAgents) {
        const keywords = taskDescription.toLowerCase().split(' ');
        
        for (const agent of availableAgents) {
            const agentText = `${agent.name} ${agent.agent_type}`.toLowerCase();
            const matches = keywords.filter(k => agentText.includes(k)).length;
            
            if (matches > 0) {
                return {
                    ...agent,
                    confidence: matches / keywords.length,
                    reason: 'Keyword match'
                };
            }
        }
        
        return availableAgents[0] || null;
    }
}

// Initialize engine
const engine = new Grok4Automation();

// API Handler
async function grok4AutomationHandler(req, res) {
    const { action, ...params } = req.body;
    
    try {
        switch (action) {
            case 'build-from-description': {
                const { description } = params;
                
                logger.info('Building process from description with Grok4', { description });
                
                const design = await engine.parseDescriptionWithGrok(description);
                const bpmnXML = engine.generateBPMNXML(design);
                
                return res.status(200).json({
                    success: true,
                    process: design,
                    bpmnXML,
                    usingGrok4: !!process.env.GROK4_API_KEY
                });
            }
            
            case 'fix-error': {
                const { error, context } = params;
                
                const fix = await engine.fixErrorWithGrok(error, context);
                
                return res.status(200).json({
                    success: true,
                    fix,
                    usingGrok4: !!process.env.GROK4_API_KEY
                });
            }
            
            case 'suggest-agent': {
                const { taskName, context } = params;
                
                await engine.loadAgents();
                
                const suggestion = await engine.suggestAgentWithGrok(taskName, engine.agents);
                
                return res.status(200).json({
                    success: true,
                    suggestion,
                    usingGrok4: !!process.env.GROK4_API_KEY
                });
            }
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error('Grok4 automation error', error);
        return res.status(500).json({ 
            error: 'Automation failed',
            message: error.message,
            usingGrok4: !!process.env.GROK4_API_KEY
        });
    }
}

export default monitoringMiddleware(grok4AutomationHandler);
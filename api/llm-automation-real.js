// Real LLM Automation API - Using OpenAI for actual intelligence
import { monitoringMiddleware, logger } from './monitoring.js';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize OpenAI - this needs OPENAI_API_KEY in environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class RealLLMAutomation {
    constructor() {
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
    
    // REAL natural language to BPMN using GPT-4
    async parseDescriptionWithLLM(description) {
        try {
            const agentList = this.agents.map(a => ({
                id: a.agent_id,
                name: a.name,
                type: a.agent_type,
                capabilities: a.capabilities
            }));
            
            const systemPrompt = `You are a BPMN process designer for a financial system. 
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
}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: description }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            
            const result = JSON.parse(completion.choices[0].message.content);
            logger.info('LLM parsed process design', { processName: result.processName });
            
            return result;
        } catch (error) {
            logger.error('LLM parsing failed', error);
            // Fallback to pattern matching if LLM fails
            return this.fallbackParsing(description);
        }
    }
    
    // Generate real BPMN XML from LLM output
    generateRealBPMNXML(design) {
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
        
        // Generate elements with proper IDs
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
                    
                case 'exclusiveGateway':
                    xml += `
    <bpmn2:exclusiveGateway id="${elementId}" name="${step.name}">
      <bpmn2:incoming>flow_${elementId}_in</bpmn2:incoming>
      <bpmn2:outgoing>flow_${elementId}_out_yes</bpmn2:outgoing>
      <bpmn2:outgoing>flow_${elementId}_out_no</bpmn2:outgoing>
    </bpmn2:exclusiveGateway>`;
                    break;
                    
                case 'parallelGateway':
                    xml += `
    <bpmn2:parallelGateway id="${elementId}" name="${step.name}">
      <bpmn2:incoming>flow_${elementId}_in</bpmn2:incoming>
      <bpmn2:outgoing>flow_${elementId}_out_1</bpmn2:outgoing>
      <bpmn2:outgoing>flow_${elementId}_out_2</bpmn2:outgoing>
    </bpmn2:parallelGateway>`;
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
  
  <!-- BPMN Diagram -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">`;
        
        // Auto-layout elements
        const positions = this.calculateLayout(design.steps);
        design.steps.forEach((step, index) => {
            const elementId = elementIds[index];
            const pos = positions[index];
            
            xml += `
      <bpmndi:BPMNShape id="${elementId}_di" bpmnElement="${elementId}">
        <dc:Bounds x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" />
      </bpmndi:BPMNShape>`;
        });
        
        xml += `
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
        
        return xml;
    }
    
    calculateLayout(steps) {
        const positions = [];
        const baseX = 100;
        const baseY = 100;
        const stepWidth = 200;
        const stepHeight = 80;
        
        steps.forEach((step, index) => {
            positions.push({
                x: baseX + (index * stepWidth),
                y: baseY,
                width: step.type.includes('Event') ? 36 : 100,
                height: step.type.includes('Event') ? 36 : 80
            });
        });
        
        return positions;
    }
    
    // REAL error fixing using GPT-4
    async fixErrorWithLLM(error, context) {
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

            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    { role: "system", content: "You are a BPMN process expert helping fix validation errors." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            
            const fix = JSON.parse(completion.choices[0].message.content);
            logger.info('LLM generated fix', { action: fix.action });
            
            return fix;
        } catch (error) {
            logger.error('LLM fix generation failed', error);
            return this.fallbackFix(error);
        }
    }
    
    // REAL agent suggestion using embeddings
    async suggestAgentWithAI(taskDescription, availableAgents) {
        try {
            // Get embeddings for task description
            const taskEmbedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: taskDescription
            });
            
            // Get embeddings for all agents (could be cached)
            const agentDescriptions = availableAgents.map(a => 
                `${a.name}: ${a.agent_type}. Capabilities: ${JSON.stringify(a.capabilities)}`
            );
            
            const agentEmbeddings = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: agentDescriptions
            });
            
            // Calculate cosine similarity
            const taskVector = taskEmbedding.data[0].embedding;
            const similarities = agentEmbeddings.data.map((agent, index) => ({
                agent: availableAgents[index],
                similarity: this.cosineSimilarity(taskVector, agent.embedding)
            }));
            
            // Sort by similarity
            similarities.sort((a, b) => b.similarity - a.similarity);
            
            const bestMatch = similarities[0];
            logger.info('AI agent suggestion', { 
                task: taskDescription, 
                suggested: bestMatch.agent.name,
                confidence: bestMatch.similarity 
            });
            
            return {
                ...bestMatch.agent,
                confidence: bestMatch.similarity,
                reason: `Best semantic match for "${taskDescription}"`
            };
        } catch (error) {
            logger.error('AI agent suggestion failed', error);
            return this.fallbackAgentSuggestion(taskDescription, availableAgents);
        }
    }
    
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    // Fallback methods when LLM is unavailable
    fallbackParsing(description) {
        logger.warn('Using fallback parsing (no LLM)');
        const lower = description.toLowerCase();
        
        // Simple pattern matching as fallback
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
        
        // Build connections
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
        // Simple keyword matching
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
const engine = new RealLLMAutomation();

// API Handler
async function realLLMAutomationHandler(req, res) {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using fallback methods');
    }
    
    const { action, ...params } = req.body;
    
    try {
        switch (action) {
            case 'build-from-description': {
                const { description } = params;
                
                logger.info('Building process from description', { description });
                
                // Use real LLM or fallback
                const design = process.env.OPENAI_API_KEY 
                    ? await engine.parseDescriptionWithLLM(description)
                    : engine.fallbackParsing(description);
                
                // Generate real BPMN XML
                const bpmnXML = engine.generateRealBPMNXML(design);
                
                return res.status(200).json({
                    success: true,
                    process: design,
                    bpmnXML,
                    usingLLM: !!process.env.OPENAI_API_KEY
                });
            }
            
            case 'fix-error': {
                const { error, context } = params;
                
                const fix = process.env.OPENAI_API_KEY
                    ? await engine.fixErrorWithLLM(error, context)
                    : engine.fallbackFix(error);
                
                return res.status(200).json({
                    success: true,
                    fix,
                    usingLLM: !!process.env.OPENAI_API_KEY
                });
            }
            
            case 'suggest-agent': {
                const { taskName, context } = params;
                
                await engine.loadAgents(); // Ensure agents are loaded
                
                const suggestion = process.env.OPENAI_API_KEY
                    ? await engine.suggestAgentWithAI(taskName, engine.agents)
                    : engine.fallbackAgentSuggestion(taskName, engine.agents);
                
                return res.status(200).json({
                    success: true,
                    suggestion,
                    usingLLM: !!process.env.OPENAI_API_KEY
                });
            }
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error('Real LLM automation error', error);
        return res.status(500).json({ 
            error: 'Automation failed',
            message: error.message,
            usingLLM: !!process.env.OPENAI_API_KEY
        });
    }
}

export default monitoringMiddleware(realLLMAutomationHandler);
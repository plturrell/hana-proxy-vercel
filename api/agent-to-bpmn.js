import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { monitoringMiddleware, metricsCollector, logger } from './monitoring.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jysyqzppaszgaemwleef.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5c3lxenBwYXN6Z2FlbXdsZWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNzkyMjAsImV4cCI6MjA0ODc1NTIyMH0.lnBYbVqvNNkKBkmqU2GrX-JkQUxYavcFQS_aGqhXIAw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

// Agent cache
const agentCache = new Map();
const AGENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(clientId) {
    const now = Date.now();
    const clientData = rateLimitMap.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + RATE_LIMIT_WINDOW;
    }
    
    clientData.count++;
    rateLimitMap.set(clientId, clientData);
    
    return clientData.count <= RATE_LIMIT_MAX_REQUESTS;
}

// Input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    // Remove any potential XSS attempts
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '');
}

// Validate agent IDs
function validateAgentIds(agentIds) {
    if (!Array.isArray(agentIds)) return false;
    if (agentIds.length === 0 || agentIds.length > 50) return false; // Max 50 agents
    return agentIds.every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id));
}

// Error logger for production monitoring
function logError(error, context) {
    logger.error('[Agent-to-BPMN Error]', error, context);
    metricsCollector.recordError('agent_to_bpmn', error.message, context);
}

// Convert agent metadata to BPMN service task notation
function agentToBPMNTask(agent) {
    const { agent_id, agent_name, agent_type, capabilities, function_parameters } = agent;
    
    // Extract input/output schemas from function parameters
    const inputSchema = function_parameters?.parameters || {};
    const outputSchema = function_parameters?.returns || {};
    
    // Extract ORD properties from capabilities
    const ordProperties = {
        discovery: capabilities?.discovery || [],
        protocols: capabilities?.protocols || [],
        standards: capabilities?.standards || [],
        authentication: capabilities?.authentication || []
    };
    
    // Create BPMN task element
    return {
        id: agent_id,
        type: 'bpmn:ServiceTask',
        name: agent_name,
        properties: {
            'a2a:agentId': agent_id,
            'a2a:agentType': agent_type,
            'a2a:implementation': 'a2a-agent',
            'a2a:capabilities': capabilities
        },
        extensionElements: {
            'a2a:InputOutput': {
                'a2a:InputParameters': Object.entries(inputSchema).map(([key, schema]) => ({
                    name: key,
                    type: schema.type || 'any',
                    required: schema.required || false,
                    description: schema.description || ''
                })),
                'a2a:OutputParameters': outputSchema.type ? [{
                    name: 'result',
                    type: outputSchema.type,
                    description: outputSchema.description || ''
                }] : []
            },
            'a2a:Performance': {
                avgResponseTime: agent.avg_response_time_ms || 0,
                successRate: agent.success_rate || 100,
                totalRequests: agent.total_requests || 0
            },
            'ord:Discovery': ordProperties
        }
    };
}

// Convert multiple agents into a BPMN collaboration diagram
function agentsToBPMNProcess(agents, processName = 'A2A Agent Process') {
    const tasks = agents.map(agentToBPMNTask);
    
    // Generate BPMN XML
    const bpmnXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
    xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
    xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
    xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
    xmlns:a2a="http://a2a.finsight/schema/1.0" 
    xmlns:ord="http://sap.com/open-resource-discovery/1.0"
    id="agent-process" 
    targetNamespace="http://a2a.finsight/bpmn">
    
    <bpmn2:collaboration id="Collaboration_1">
        <bpmn2:participant id="Participant_1" name="${processName}" processRef="Process_1" />
    </bpmn2:collaboration>
    
    <bpmn2:process id="Process_1" isExecutable="true">
        <bpmn2:laneSet id="LaneSet_1">
            ${generateLanes(agents)}
        </bpmn2:laneSet>
        
        <bpmn2:startEvent id="Start_1" name="Process Start">
            <bpmn2:outgoing>Flow_Start</bpmn2:outgoing>
        </bpmn2:startEvent>
        
        ${tasks.map((task, index) => `
        <bpmn2:serviceTask id="${task.id}" name="${task.name}" a2a:agentId="${task.properties['a2a:agentId']}" a2a:agentType="${task.properties['a2a:agentType']}">
            <bpmn2:incoming>Flow_${index === 0 ? 'Start' : tasks[index-1].id}</bpmn2:incoming>
            <bpmn2:outgoing>Flow_${task.id}</bpmn2:outgoing>
            <bpmn2:extensionElements>
                ${generateExtensionElements(task)}
            </bpmn2:extensionElements>
        </bpmn2:serviceTask>`).join('\n')}
        
        <bpmn2:endEvent id="End_1" name="Process Complete">
            <bpmn2:incoming>Flow_${tasks[tasks.length-1].id}</bpmn2:incoming>
        </bpmn2:endEvent>
        
        ${generateSequenceFlows(tasks)}
    </bpmn2:process>
    
    <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
            ${generateDiagramElements(tasks)}
        </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;
    
    return bpmnXML;
}

// Generate lanes based on agent types
function generateLanes(agents) {
    const agentTypes = [...new Set(agents.map(a => a.agent_type))];
    return agentTypes.map((type, index) => `
        <bpmn2:lane id="Lane_${index}" name="${type}">
            ${agents.filter(a => a.agent_type === type).map(a => `<bpmn2:flowNodeRef>${a.agent_id}</bpmn2:flowNodeRef>`).join('\n')}
        </bpmn2:lane>
    `).join('\n');
}

// Generate extension elements for agent metadata
function generateExtensionElements(task) {
    const ext = task.extensionElements;
    const ord = ext['ord:Discovery'];
    return `
        <a2a:InputOutput>
            ${ext['a2a:InputOutput']['a2a:InputParameters'].map(param => `
            <a2a:InputParameter name="${param.name}" type="${param.type}" required="${param.required}">
                <a2a:description>${param.description}</a2a:description>
            </a2a:InputParameter>`).join('\n')}
            ${ext['a2a:InputOutput']['a2a:OutputParameters'].map(param => `
            <a2a:OutputParameter name="${param.name}" type="${param.type}">
                <a2a:description>${param.description}</a2a:description>
            </a2a:OutputParameter>`).join('\n')}
        </a2a:InputOutput>
        <a2a:Performance>
            <a2a:avgResponseTime>${ext['a2a:Performance'].avgResponseTime}</a2a:avgResponseTime>
            <a2a:successRate>${ext['a2a:Performance'].successRate}</a2a:successRate>
            <a2a:totalRequests>${ext['a2a:Performance'].totalRequests}</a2a:totalRequests>
        </a2a:Performance>
        <ord:ResourceDiscovery>
            ${ord.discovery.length > 0 ? `<ord:discoveryMethods>${ord.discovery.join(', ')}</ord:discoveryMethods>` : ''}
            ${ord.protocols.length > 0 ? `<ord:supportedProtocols>${ord.protocols.join(', ')}</ord:supportedProtocols>` : ''}
            ${ord.standards.length > 0 ? `<ord:supportedStandards>${ord.standards.join(', ')}</ord:supportedStandards>` : ''}
            ${ord.authentication.length > 0 ? `<ord:authenticationMethods>${ord.authentication.join(', ')}</ord:authenticationMethods>` : ''}
        </ord:ResourceDiscovery>
    `;
}

// Generate sequence flows
function generateSequenceFlows(tasks) {
    const flows = [`<bpmn2:sequenceFlow id="Flow_Start" sourceRef="Start_1" targetRef="${tasks[0].id}" />`];
    
    for (let i = 0; i < tasks.length - 1; i++) {
        flows.push(`<bpmn2:sequenceFlow id="Flow_${tasks[i].id}" sourceRef="${tasks[i].id}" targetRef="${tasks[i+1].id}" />`);
    }
    
    flows.push(`<bpmn2:sequenceFlow id="Flow_${tasks[tasks.length-1].id}" sourceRef="${tasks[tasks.length-1].id}" targetRef="End_1" />`);
    
    return flows.join('\n');
}

// Generate diagram elements with layout
function generateDiagramElements(tasks) {
    const laneHeight = 200;
    const taskWidth = 100;
    const taskHeight = 80;
    const xSpacing = 150;
    const yStart = 100;
    
    let elements = [];
    
    // Start event
    elements.push(`
        <bpmndi:BPMNShape id="Start_1_di" bpmnElement="Start_1">
            <dc:Bounds x="180" y="${yStart + laneHeight/2 - 18}" width="36" height="36" />
        </bpmndi:BPMNShape>
    `);
    
    // Tasks
    tasks.forEach((task, index) => {
        const x = 280 + (index * xSpacing);
        const y = yStart + laneHeight/2 - taskHeight/2;
        
        elements.push(`
        <bpmndi:BPMNShape id="${task.id}_di" bpmnElement="${task.id}">
            <dc:Bounds x="${x}" y="${y}" width="${taskWidth}" height="${taskHeight}" />
        </bpmndi:BPMNShape>
        `);
    });
    
    // End event
    const endX = 280 + (tasks.length * xSpacing);
    elements.push(`
        <bpmndi:BPMNShape id="End_1_di" bpmnElement="End_1">
            <dc:Bounds x="${endX}" y="${yStart + laneHeight/2 - 18}" width="36" height="36" />
        </bpmndi:BPMNShape>
    `);
    
    // Flows
    elements.push(`<bpmndi:BPMNEdge id="Flow_Start_di" bpmnElement="Flow_Start">
        <di:waypoint x="216" y="${yStart + laneHeight/2}" />
        <di:waypoint x="280" y="${yStart + laneHeight/2}" />
    </bpmndi:BPMNEdge>`);
    
    tasks.forEach((task, index) => {
        const x1 = 280 + (index * xSpacing) + taskWidth;
        const x2 = 280 + ((index + 1) * xSpacing);
        const y = yStart + laneHeight/2;
        
        elements.push(`<bpmndi:BPMNEdge id="Flow_${task.id}_di" bpmnElement="Flow_${task.id}">
            <di:waypoint x="${x1}" y="${y}" />
            <di:waypoint x="${index === tasks.length - 1 ? endX : x2}" y="${y}" />
        </bpmndi:BPMNEdge>`);
    });
    
    return elements.join('\n');
}

// Generate internal agent process diagram
function generateAgentInternalBPMN(agent) {
    const { agent_id, agent_name, function_parameters, capabilities } = agent;
    const steps = generateInternalSteps(agent);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:a2a="http://a2a.finsight/schema/1.0" xmlns:ord="http://sap.com/open-resource-discovery/1.0" id="${agent_id}-internal" targetNamespace="http://a2a.finsight/bpmn">
    <bpmn2:process id="Process_${agent_id}" name="${agent_name} Internal Process" isExecutable="true">
        <bpmn2:startEvent id="Start_Input" name="Receive Input">
            <bpmn2:outgoing>Flow_1</bpmn2:outgoing>
        </bpmn2:startEvent>
        
        <bpmn2:task id="Task_Validate" name="Validate Input">
            <bpmn2:incoming>Flow_1</bpmn2:incoming>
            <bpmn2:outgoing>Flow_2</bpmn2:outgoing>
        </bpmn2:task>
        
        ${steps.map((step, index) => `
        <bpmn2:task id="Task_${index}" name="${step.name}">
            <bpmn2:incoming>Flow_${index + 2}</bpmn2:incoming>
            <bpmn2:outgoing>Flow_${index + 3}</bpmn2:outgoing>
        </bpmn2:task>`).join('\n')}
        
        <bpmn2:task id="Task_Format" name="Format Output">
            <bpmn2:incoming>Flow_${steps.length + 2}</bpmn2:incoming>
            <bpmn2:outgoing>Flow_Final</bpmn2:outgoing>
        </bpmn2:task>
        
        <bpmn2:endEvent id="End_Output" name="Return Result">
            <bpmn2:incoming>Flow_Final</bpmn2:incoming>
        </bpmn2:endEvent>
        
        ${generateInternalFlows(steps)}
    </bpmn2:process>
    
    ${generateInternalDiagram(agent_id, steps)}
</bpmn2:definitions>`;
}

// Generate internal processing steps based on agent type
function generateInternalSteps(agent) {
    const steps = [];
    
    switch(agent.agent_type) {
        case 'risk-assessment':
            steps.push(
                { name: 'Load Market Data' },
                { name: 'Calculate Risk Metrics' },
                { name: 'Apply Risk Models' },
                { name: 'Generate Risk Score' }
            );
            break;
        case 'portfolio-optimization':
            steps.push(
                { name: 'Analyze Current Portfolio' },
                { name: 'Identify Optimization Opportunities' },
                { name: 'Run Optimization Algorithm' },
                { name: 'Generate Recommendations' }
            );
            break;
        case 'trading-strategy':
            steps.push(
                { name: 'Analyze Market Conditions' },
                { name: 'Evaluate Trading Signals' },
                { name: 'Calculate Position Size' },
                { name: 'Generate Trade Order' }
            );
            break;
        default:
            steps.push(
                { name: 'Process Data' },
                { name: 'Apply Business Logic' },
                { name: 'Generate Result' }
            );
    }
    
    return steps;
}

function generateInternalFlows(steps) {
    const flows = ['<bpmn2:sequenceFlow id="Flow_1" sourceRef="Start_Input" targetRef="Task_Validate" />'];
    flows.push('<bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_Validate" targetRef="Task_0" />');
    
    for (let i = 0; i < steps.length; i++) {
        if (i < steps.length - 1) {
            flows.push(`<bpmn2:sequenceFlow id="Flow_${i + 3}" sourceRef="Task_${i}" targetRef="Task_${i + 1}" />`);
        } else {
            flows.push(`<bpmn2:sequenceFlow id="Flow_${i + 3}" sourceRef="Task_${i}" targetRef="Task_Format" />`);
        }
    }
    
    flows.push('<bpmn2:sequenceFlow id="Flow_Final" sourceRef="Task_Format" targetRef="End_Output" />');
    
    return flows.join('\n');
}

function generateInternalDiagram(agentId, steps) {
    const yPos = 200;
    const xStart = 180;
    const xSpacing = 150;
    
    return `
    <bpmndi:BPMNDiagram id="BPMNDiagram_${agentId}">
        <bpmndi:BPMNPlane id="BPMNPlane_${agentId}" bpmnElement="Process_${agentId}">
            <bpmndi:BPMNShape id="Start_Input_di" bpmnElement="Start_Input">
                <dc:Bounds x="${xStart}" y="${yPos - 18}" width="36" height="36" />
            </bpmndi:BPMNShape>
            
            <bpmndi:BPMNShape id="Task_Validate_di" bpmnElement="Task_Validate">
                <dc:Bounds x="${xStart + xSpacing}" y="${yPos - 40}" width="100" height="80" />
            </bpmndi:BPMNShape>
            
            ${steps.map((step, index) => `
            <bpmndi:BPMNShape id="Task_${index}_di" bpmnElement="Task_${index}">
                <dc:Bounds x="${xStart + (index + 2) * xSpacing}" y="${yPos - 40}" width="100" height="80" />
            </bpmndi:BPMNShape>`).join('\n')}
            
            <bpmndi:BPMNShape id="Task_Format_di" bpmnElement="Task_Format">
                <dc:Bounds x="${xStart + (steps.length + 2) * xSpacing}" y="${yPos - 40}" width="100" height="80" />
            </bpmndi:BPMNShape>
            
            <bpmndi:BPMNShape id="End_Output_di" bpmnElement="End_Output">
                <dc:Bounds x="${xStart + (steps.length + 3) * xSpacing + 50}" y="${yPos - 18}" width="36" height="36" />
            </bpmndi:BPMNShape>
            
            ${generateInternalDiagramEdges(xStart, yPos, xSpacing, steps)}
        </bpmndi:BPMNPlane>
    </bpmndi:BPMNDiagram>`;
}

function generateInternalDiagramEdges(xStart, yPos, xSpacing, steps) {
    const edges = [];
    
    // Start to Validate
    edges.push(`<bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="${xStart + 36}" y="${yPos}" />
        <di:waypoint x="${xStart + xSpacing}" y="${yPos}" />
    </bpmndi:BPMNEdge>`);
    
    // Validate to first task
    edges.push(`<bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="${xStart + xSpacing + 100}" y="${yPos}" />
        <di:waypoint x="${xStart + 2 * xSpacing}" y="${yPos}" />
    </bpmndi:BPMNEdge>`);
    
    // Between tasks
    for (let i = 0; i < steps.length; i++) {
        const x1 = xStart + (i + 2) * xSpacing + 100;
        const x2 = xStart + (i + 3) * xSpacing;
        
        edges.push(`<bpmndi:BPMNEdge id="Flow_${i + 3}_di" bpmnElement="Flow_${i + 3}">
            <di:waypoint x="${x1}" y="${yPos}" />
            <di:waypoint x="${x2}" y="${yPos}" />
        </bpmndi:BPMNEdge>`);
    }
    
    // Format to End
    edges.push(`<bpmndi:BPMNEdge id="Flow_Final_di" bpmnElement="Flow_Final">
        <di:waypoint x="${xStart + (steps.length + 2) * xSpacing + 100}" y="${yPos}" />
        <di:waypoint x="${xStart + (steps.length + 3) * xSpacing + 50}" y="${yPos}" />
    </bpmndi:BPMNEdge>`);
    
    return edges.join('\n');
}

async function agentToBPMNHandler(req, res) {
    // CORS headers for production
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Rate limiting
    const clientId = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientId)) {
        return res.status(429).json({ 
            error: 'Too many requests', 
            retryAfter: 60,
            message: 'Please try again in 1 minute' 
        });
    }
    
    // Authentication check
    const authHeader = req.headers.authorization;
    if (process.env.NODE_ENV === 'production') {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'Please provide a valid Bearer token' 
            });
        }
        
        // Verify token (implement your auth logic here)
        const token = authHeader.slice(7);
        if (!token || token.length < 20) { // Basic validation
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'The provided token is invalid' 
            });
        }
    }
    
    // Request size limit (10MB)
    if (req.headers['content-length'] > 10 * 1024 * 1024) {
        return res.status(413).json({ 
            error: 'Request too large',
            message: 'Request body must be less than 10MB' 
        });
    }
    
    // Input validation and sanitization
    const { action, agentIds, processName, agentId } = req.body;
    
    if (!action || typeof action !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid request',
            message: 'Action parameter is required and must be a string' 
        });
    }
    
    const sanitizedAction = sanitizeInput(action);
    const sanitizedProcessName = processName ? sanitizeInput(processName) : 'A2A Agent Process';
    
    try {
        switch (sanitizedAction) {
            case 'convertAgents': {
                // Validate agent IDs
                if (!validateAgentIds(agentIds)) {
                    return res.status(400).json({ 
                        error: 'Invalid agent IDs',
                        message: 'Agent IDs must be an array of valid identifiers (1-50 items)' 
                    });
                }
                
                // Check cache first
                const cacheKey = `agents_${agentIds.sort().join('_')}`;
                const cachedAgents = agentCache.get(cacheKey);
                
                if (cachedAgents && Date.now() - cachedAgents.timestamp < AGENT_CACHE_TTL) {
                    metricsCollector.recordCacheHit('agents', true);
                    const { data: agents } = cachedAgents;
                    
                    try {
                        // Convert to BPMN with cached data
                        const bpmnXML = agentsToBPMNProcess(agents, sanitizedProcessName);
                        
                        return res.status(200).json({
                            success: true,
                            bpmn: bpmnXML,
                            agents: agents.map(a => ({
                                id: a.agent_id,
                                name: sanitizeInput(a.agent_name),
                                type: a.agent_type,
                                capabilities: a.capabilities
                            })),
                            metadata: {
                                generatedAt: new Date().toISOString(),
                                processName: sanitizedProcessName,
                                agentCount: agents.length,
                                fromCache: true
                            }
                        });
                    } catch (error) {
                        logError(error, { action: 'convertAgents', source: 'cache' });
                    }
                }
                
                metricsCollector.recordCacheHit('agents', false);
                
                // Fetch agents with timeout
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database timeout')), 10000)
                );
                
                const queryPromise = supabase
                    .from('a2a_agents')
                    .select('*')
                    .in('agent_id', agentIds)
                    .eq('status', 'active');
                
                const result = await Promise.race([queryPromise, timeoutPromise]).catch(error => {
                    logError(error, { action: 'convertAgents', agentIds });
                    throw new Error('Database query failed');
                });
                
                const { data: agents, error } = result;
                
                if (error) {
                    logError(error, { action: 'convertAgents', agentIds });
                    return res.status(500).json({ 
                        error: 'Database error',
                        message: 'Failed to fetch agents from database' 
                    });
                }
                
                if (!agents || agents.length === 0) {
                    return res.status(404).json({ 
                        error: 'No agents found',
                        message: 'No active agents found with the provided IDs' 
                    });
                }
                
                // Update cache
                agentCache.set(cacheKey, {
                    data: agents,
                    timestamp: Date.now()
                });
                
                try {
                    // Convert to BPMN with error handling
                    const bpmnXML = agentsToBPMNProcess(agents, sanitizedProcessName);
                    
                    // Validate generated BPMN (basic check)
                    if (!bpmnXML || bpmnXML.length < 100) {
                        throw new Error('Invalid BPMN generated');
                    }
                    
                    return res.status(200).json({
                        success: true,
                        bpmn: bpmnXML,
                        agents: agents.map(a => ({
                            id: a.agent_id,
                            name: sanitizeInput(a.agent_name),
                            type: a.agent_type,
                            capabilities: a.capabilities
                        })),
                        metadata: {
                            generatedAt: new Date().toISOString(),
                            processName: sanitizedProcessName,
                            agentCount: agents.length,
                            fromCache: false
                        }
                    });
                } catch (conversionError) {
                    logError(conversionError, { action: 'convertAgents', agentCount: agents.length });
                    return res.status(500).json({ 
                        error: 'Conversion failed',
                        message: 'Failed to convert agents to BPMN format' 
                    });
                }
            }
            
            case 'getAgentInternal': {
                // Validate agent ID
                if (!agentId || typeof agentId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(agentId)) {
                    return res.status(400).json({ 
                        error: 'Invalid agent ID',
                        message: 'Agent ID must be a valid identifier' 
                    });
                }
                
                try {
                    // Fetch single agent with timeout
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Database timeout')), 10000)
                    );
                    
                    const queryPromise = supabase
                        .from('a2a_agents')
                        .select('*')
                        .eq('agent_id', agentId)
                        .single();
                    
                    const { data: agent, error } = await Promise.race([queryPromise, timeoutPromise]);
                    
                    if (error || !agent) {
                        if (error?.code === 'PGRST116') { // Not found
                            return res.status(404).json({ 
                                error: 'Agent not found',
                                message: `No agent found with ID: ${agentId}` 
                            });
                        }
                        logError(error || new Error('No agent returned'), { action: 'getAgentInternal', agentId });
                        return res.status(500).json({ 
                            error: 'Database error',
                            message: 'Failed to fetch agent details' 
                        });
                    }
                    
                    // Generate internal process diagram
                    const internalBPMN = generateAgentInternalBPMN(agent);
                    
                    return res.status(200).json({
                        success: true,
                        bpmn: internalBPMN,
                        agent: {
                            id: agent.agent_id,
                            name: sanitizeInput(agent.agent_name),
                            type: agent.agent_type,
                            parameters: agent.function_parameters,
                            capabilities: agent.capabilities,
                            ordProperties: {
                                discovery: agent.capabilities?.discovery || [],
                                protocols: agent.capabilities?.protocols || [],
                                standards: agent.capabilities?.standards || [],
                                authentication: agent.capabilities?.authentication || [],
                                inputTypes: agent.capabilities?.input_types || [],
                                outputTypes: agent.capabilities?.output_types || []
                            },
                            performance: {
                                avgResponseTime: agent.avg_response_time_ms || 0,
                                successRate: agent.success_rate || 100,
                                totalRequests: agent.total_requests || 0
                            }
                        },
                        metadata: {
                            retrievedAt: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    logError(error, { action: 'getAgentInternal', agentId });
                    return res.status(500).json({ 
                        error: 'Internal error',
                        message: 'Failed to process agent data' 
                    });
                }
            }
            
            case 'getAllAgents': {
                try {
                    // Implement pagination for large datasets
                    const page = parseInt(req.body.page) || 1;
                    const limit = Math.min(parseInt(req.body.limit) || 50, 100); // Max 100 per page
                    const offset = (page - 1) * limit;
                    
                    // Fetch agents with timeout
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Database timeout')), 10000)
                    );
                    
                    const queryPromise = supabase
                        .from('a2a_agents')
                        .select('agent_id, agent_name, agent_type, description, capabilities', { count: 'exact' })
                        .eq('status', 'active')
                        .order('agent_name')
                        .range(offset, offset + limit - 1);
                    
                    const { data: agents, error, count } = await Promise.race([queryPromise, timeoutPromise]);
                    
                    if (error) {
                        logError(error, { action: 'getAllAgents', page, limit });
                        return res.status(500).json({ 
                            error: 'Database error',
                            message: 'Failed to fetch agents list' 
                        });
                    }
                    
                    // Sanitize agent names
                    const sanitizedAgents = agents?.map(agent => ({
                        ...agent,
                        agent_name: sanitizeInput(agent.agent_name),
                        description: agent.description ? sanitizeInput(agent.description) : null
                    })) || [];
                    
                    return res.status(200).json({ 
                        success: true,
                        agents: sanitizedAgents,
                        pagination: {
                            page,
                            limit,
                            total: count || 0,
                            totalPages: Math.ceil((count || 0) / limit)
                        },
                        metadata: {
                            retrievedAt: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    logError(error, { action: 'getAllAgents' });
                    return res.status(500).json({ 
                        error: 'Internal error',
                        message: 'Failed to retrieve agents list' 
                    });
                }
            }
            
            default:
                return res.status(400).json({ 
                    error: 'Invalid action',
                    message: `Unknown action: ${action}`,
                    validActions: ['convertAgents', 'getAgentInternal', 'getAllAgents']
                });
        }
    } catch (error) {
        logError(error, { action, context: 'unhandled' });
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again later.',
            requestId: crypto.randomUUID() // For tracking in logs
        });
    }
}

// Export with monitoring middleware
export default monitoringMiddleware(agentToBPMNHandler);
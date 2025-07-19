// BPMN Validation Service
import { monitoringMiddleware, logger } from './monitoring.js';

// BPMN validation rules
const BPMN_RULES = {
    // Required elements
    requiredElements: {
        'bpmn:StartEvent': { min: 1, max: null, message: 'Process must have at least one start event' },
        'bpmn:EndEvent': { min: 1, max: null, message: 'Process must have at least one end event' }
    },
    
    // Element connection rules
    connectionRules: {
        'bpmn:StartEvent': { 
            incoming: { min: 0, max: 0 }, 
            outgoing: { min: 1, max: 1 },
            message: 'Start event must have exactly one outgoing flow'
        },
        'bpmn:EndEvent': { 
            incoming: { min: 1, max: null }, 
            outgoing: { min: 0, max: 0 },
            message: 'End event must have at least one incoming flow'
        },
        'bpmn:Task': { 
            incoming: { min: 1, max: null }, 
            outgoing: { min: 1, max: null },
            message: 'Task must have at least one incoming and one outgoing flow'
        },
        'bpmn:ServiceTask': { 
            incoming: { min: 1, max: null }, 
            outgoing: { min: 1, max: null },
            message: 'Service task must have at least one incoming and one outgoing flow'
        },
        'bpmn:UserTask': { 
            incoming: { min: 1, max: null }, 
            outgoing: { min: 1, max: null },
            message: 'User task must have at least one incoming and one outgoing flow'
        },
        'bpmn:ExclusiveGateway': { 
            incoming: { min: 1, max: null }, 
            outgoing: { min: 2, max: null },
            message: 'Exclusive gateway must have at least one incoming and two outgoing flows'
        },
        'bpmn:ParallelGateway': { 
            incoming: { min: 1, max: null }, 
            outgoing: { min: 2, max: null },
            message: 'Parallel gateway must have at least one incoming and two outgoing flows'
        }
    },
    
    // A2A specific rules
    a2aRules: {
        serviceTaskRequiresAgent: true,
        agentIdPattern: /^[a-zA-Z0-9_-]+$/,
        maxAgentsPerProcess: 50
    }
};

// Parse BPMN XML
function parseBPMN(bpmnXML) {
    try {
        // Simple XML parsing - in production use a proper XML parser
        const elements = [];
        const flows = [];
        
        // Extract elements
        const elementRegex = /<bpmn2?:(\w+)\s+id="([^"]+)"[^>]*>/g;
        let match;
        while ((match = elementRegex.exec(bpmnXML)) !== null) {
            const [fullMatch, type, id] = match;
            const element = {
                type: `bpmn:${type}`,
                id,
                name: extractAttribute(fullMatch, 'name'),
                incoming: [],
                outgoing: [],
                attributes: {}
            };
            
            // Extract A2A attributes
            if (type === 'ServiceTask') {
                element.attributes['a2a:agentId'] = extractAttribute(fullMatch, 'a2a:agentId');
                element.attributes['a2a:agentType'] = extractAttribute(fullMatch, 'a2a:agentType');
            }
            
            elements.push(element);
        }
        
        // Extract sequence flows
        const flowRegex = /<bpmn2?:sequenceFlow\s+id="([^"]+)"\s+sourceRef="([^"]+)"\s+targetRef="([^"]+)"/g;
        while ((match = flowRegex.exec(bpmnXML)) !== null) {
            const [, id, sourceRef, targetRef] = match;
            flows.push({ id, sourceRef, targetRef });
        }
        
        // Connect elements with flows
        flows.forEach(flow => {
            const source = elements.find(e => e.id === flow.sourceRef);
            const target = elements.find(e => e.id === flow.targetRef);
            if (source) source.outgoing.push(flow.id);
            if (target) target.incoming.push(flow.id);
        });
        
        return { elements, flows };
    } catch (error) {
        throw new Error(`Failed to parse BPMN: ${error.message}`);
    }
}

// Extract attribute from XML element
function extractAttribute(xmlElement, attributeName) {
    const regex = new RegExp(`${attributeName}="([^"]+)"`);
    const match = xmlElement.match(regex);
    return match ? match[1] : null;
}

// Validate BPMN structure
function validateBPMNStructure(parsedBPMN) {
    const errors = [];
    const warnings = [];
    const { elements, flows } = parsedBPMN;
    
    // Check required elements
    for (const [elementType, rule] of Object.entries(BPMN_RULES.requiredElements)) {
        const count = elements.filter(e => e.type === elementType).length;
        
        if (rule.min && count < rule.min) {
            errors.push(rule.message);
        }
        if (rule.max && count > rule.max) {
            errors.push(`Too many ${elementType} elements (max: ${rule.max})`);
        }
    }
    
    // Check element connections
    elements.forEach(element => {
        const rule = BPMN_RULES.connectionRules[element.type];
        if (!rule) return;
        
        const incomingCount = element.incoming.length;
        const outgoingCount = element.outgoing.length;
        
        if (rule.incoming.min && incomingCount < rule.incoming.min) {
            const elementDesc = element.name ? `"${element.name}"` : `with ID "${element.id}"`;
            warnings.push(`${element.type} ${elementDesc}: ${rule.message}`);
        }
        
        if (rule.outgoing.min && outgoingCount < rule.outgoing.min) {
            const elementDesc = element.name ? `"${element.name}"` : `with ID "${element.id}"`;
            warnings.push(`${element.type} ${elementDesc}: ${rule.message}`);
        }
    });
    
    // Check for disconnected elements
    elements.forEach(element => {
        if (element.type !== 'bpmn:Process' && 
            element.type !== 'bpmn:Collaboration' &&
            element.incoming.length === 0 && 
            element.outgoing.length === 0) {
            warnings.push(`Disconnected element: ${element.type} "${element.name || element.id}"`);
        }
    });
    
    // Check for cycles (simple detection)
    const visited = new Set();
    const recursionStack = new Set();
    
    function hasCycle(elementId) {
        if (recursionStack.has(elementId)) return true;
        if (visited.has(elementId)) return false;
        
        visited.add(elementId);
        recursionStack.add(elementId);
        
        const element = elements.find(e => e.id === elementId);
        if (element) {
            for (const outgoingFlow of element.outgoing) {
                const flow = flows.find(f => f.id === outgoingFlow);
                if (flow && hasCycle(flow.targetRef)) {
                    return true;
                }
            }
        }
        
        recursionStack.delete(elementId);
        return false;
    }
    
    const startEvents = elements.filter(e => e.type === 'bpmn:StartEvent');
    for (const startEvent of startEvents) {
        if (hasCycle(startEvent.id)) {
            warnings.push('Process contains cycles that may cause infinite loops');
            break;
        }
    }
    
    return { errors, warnings };
}

// Validate A2A specific requirements
function validateA2ARequirements(parsedBPMN) {
    const errors = [];
    const warnings = [];
    const { elements } = parsedBPMN;
    
    // Check service tasks have agents assigned
    const serviceTasks = elements.filter(e => e.type === 'bpmn:ServiceTask');
    let agentCount = 0;
    
    serviceTasks.forEach(task => {
        const agentId = task.attributes['a2a:agentId'];
        
        if (BPMN_RULES.a2aRules.serviceTaskRequiresAgent && !agentId) {
            warnings.push(`Service task "${task.name || task.id}" has no agent assigned`);
        } else if (agentId) {
            agentCount++;
            
            // Validate agent ID format
            if (!BPMN_RULES.a2aRules.agentIdPattern.test(agentId)) {
                errors.push(`Invalid agent ID format: ${agentId}`);
            }
        }
    });
    
    // Check max agents limit
    if (agentCount > BPMN_RULES.a2aRules.maxAgentsPerProcess) {
        errors.push(`Too many agents in process (${agentCount}/${BPMN_RULES.a2aRules.maxAgentsPerProcess})`);
    }
    
    return { errors, warnings };
}

// Calculate complexity score
function calculateComplexityScore(parsedBPMN) {
    const { elements, flows } = parsedBPMN;
    
    // McCabe Cyclomatic Complexity approximation
    const nodes = elements.length;
    const edges = flows.length;
    const connectedComponents = 1; // Assuming single process
    
    const cyclomaticComplexity = edges - nodes + 2 * connectedComponents;
    
    // Additional complexity factors
    const gatewayCount = elements.filter(e => e.type.includes('Gateway')).length;
    const taskCount = elements.filter(e => e.type.includes('Task')).length;
    const subprocessCount = elements.filter(e => e.type === 'bpmn:SubProcess').length;
    
    // Calculate weighted score
    const complexityScore = {
        cyclomatic: cyclomaticComplexity,
        gateways: gatewayCount,
        tasks: taskCount,
        subprocesses: subprocessCount,
        total: cyclomaticComplexity + (gatewayCount * 2) + (subprocessCount * 3),
        level: 'low' // Will be set below
    };
    
    // Determine complexity level
    if (complexityScore.total < 10) {
        complexityScore.level = 'low';
    } else if (complexityScore.total < 25) {
        complexityScore.level = 'medium';
    } else if (complexityScore.total < 50) {
        complexityScore.level = 'high';
    } else {
        complexityScore.level = 'very high';
    }
    
    return complexityScore;
}

// Main validation handler
async function validateBPMNHandler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { bpmnXML, options = {} } = req.body;
    
    if (!bpmnXML || typeof bpmnXML !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid request',
            message: 'BPMN XML is required' 
        });
    }
    
    // Size limit (5MB)
    if (bpmnXML.length > 5 * 1024 * 1024) {
        return res.status(413).json({ 
            error: 'BPMN too large',
            message: 'BPMN XML must be less than 5MB' 
        });
    }
    
    try {
        logger.info('Validating BPMN', { 
            size: bpmnXML.length,
            options 
        });
        
        // Parse BPMN
        const parsedBPMN = parseBPMN(bpmnXML);
        
        // Run validations
        const structureValidation = validateBPMNStructure(parsedBPMN);
        const a2aValidation = validateA2ARequirements(parsedBPMN);
        const complexityScore = calculateComplexityScore(parsedBPMN);
        
        // Combine results
        const errors = [
            ...structureValidation.errors,
            ...a2aValidation.errors
        ];
        
        const warnings = [
            ...structureValidation.warnings,
            ...a2aValidation.warnings
        ];
        
        // Add complexity warnings
        if (complexityScore.level === 'high' || complexityScore.level === 'very high') {
            warnings.push(`Process complexity is ${complexityScore.level} (score: ${complexityScore.total})`);
        }
        
        const isValid = errors.length === 0;
        
        const result = {
            isValid,
            errors,
            warnings,
            metrics: {
                elements: parsedBPMN.elements.length,
                flows: parsedBPMN.flows.length,
                tasks: parsedBPMN.elements.filter(e => e.type.includes('Task')).length,
                gateways: parsedBPMN.elements.filter(e => e.type.includes('Gateway')).length,
                events: parsedBPMN.elements.filter(e => e.type.includes('Event')).length,
                complexity: complexityScore
            },
            validatedAt: new Date().toISOString()
        };
        
        logger.info('BPMN validation complete', { 
            isValid,
            errorCount: errors.length,
            warningCount: warnings.length
        });
        
        return res.status(200).json(result);
        
    } catch (error) {
        logger.error('BPMN validation error', error);
        return res.status(500).json({ 
            error: 'Validation failed',
            message: error.message 
        });
    }
}

// Export with monitoring
export default monitoringMiddleware(validateBPMNHandler);
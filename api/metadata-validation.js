/**
 * Metadata Validation Service
 * Validates A2A and ORD metadata using database enum types
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Import enum definitions (these should match database enum types)
const ENUM_DEFINITIONS = {
  // A2A Enums
  a2a_protocol_version: ['a2a/v1.0', 'a2a/v1.1', 'a2a/v1.2', 'a2a/v2.0-beta', 'a2a/v2.0'],
  a2a_agent_capability: [
    'financial-analysis', 'risk-assessment', 'portfolio-optimization', 'market-research',
    'compliance-monitoring', 'fraud-detection', 'algorithmic-trading', 'sentiment-analysis',
    'forecasting', 'data-transformation', 'anomaly-detection', 'regulatory-reporting',
    'stress-testing', 'backtesting', 'performance-attribution'
  ],
  a2a_message_type: [
    'request', 'response', 'notification', 'broadcast', 'negotiation', 'heartbeat',
    'error', 'ack', 'nack', 'subscribe', 'unsubscribe', 'discovery'
  ],
  a2a_message_priority: ['low', 'normal', 'high', 'urgent', 'critical'],
  a2a_consensus_method: [
    'simple-majority', 'weighted-voting', 'reputation-based', 'stake-weighted',
    'proof-of-work', 'proof-of-stake', 'delegated-consensus', 'byzantine-fault-tolerant'
  ],
  a2a_verification_level: [
    'none', 'basic', 'enhanced', 'cryptographic', 'blockchain-verified',
    'multi-signature', 'zero-knowledge-proof'
  ],
  a2a_agent_role: [
    'autonomous', 'reactive', 'coordinator', 'monitor', 'validator',
    'mediator', 'aggregator', 'transformer', 'gateway', 'oracle'
  ],
  a2a_communication_pattern: [
    'synchronous', 'asynchronous', 'publish-subscribe', 'request-response',
    'streaming', 'batch', 'event-driven', 'message-queue'
  ],
  
  // ORD Enums
  ord_version: [
    'v1.0', 'v1.1', 'v1.2', 'v1.3', 'v1.4', 'v1.5', 'v1.6',
    'v1.7', 'v1.8', 'v1.9', 'v1.10', 'v1.11', 'v1.12'
  ],
  ord_release_status: [
    'active', 'beta', 'deprecated', 'retired', 'planned', 'draft', 'review', 'approved'
  ],
  ord_visibility: ['public', 'internal', 'restricted', 'private', 'partner', 'customer'],
  ord_api_protocol: [
    'rest', 'graphql', 'grpc', 'websocket', 'sse', 'soap', 'rpc', 'odata', 'mqtt', 'kafka'
  ],
  ord_data_product_type: [
    'primary', 'derived', 'aggregated', 'reference', 'audit',
    'operational', 'analytical', 'transactional', 'master', 'dimensional'
  ],
  ord_entity_level: ['1', '2', '3', '4', '5'],
  ord_capability_extensibility: ['automatic', 'manual', 'none', 'scripted', 'api-driven'],
  ord_policy_level: [
    'sap:core:v1', 'custom:v1', 'partner:v1', 'industry:finance:v1',
    'regulatory:mifid:v1', 'regulatory:basel:v1'
  ],
  ord_resource_category: [
    'api', 'event', 'entity-type', 'data-product', 'capability',
    'package', 'group', 'integration-dependency', 'tombstone'
  ],
  ord_documentation_type: [
    'openapi-v3', 'asyncapi-v2', 'json-schema', 'markdown', 'html',
    'pdf', 'swagger-v2', 'raml', 'blueprint'
  ],
  ord_access_strategy: [
    'open', 'api-key', 'oauth2', 'jwt', 'basic-auth', 'certificate', 'saml', 'custom'
  ],
  
  // General Enums
  compliance_status: [
    'compliant', 'non-compliant', 'partially-compliant', 'unknown', 'pending-review', 'exempted'
  ],
  data_quality_level: ['gold', 'silver', 'bronze', 'raw', 'quarantined', 'deprecated'],
  security_classification: ['public', 'internal', 'confidential', 'restricted', 'top-secret']
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'validate-agent':
        return await validateAgent(req, res);
      case 'validate-data-product':
        return await validateDataProduct(req, res);
      case 'validate-function':
        return await validateFunction(req, res);
      case 'validate-enum':
        return await validateEnumValue(req, res);
      case 'get-enum-options':
        return await getEnumOptions(req, res);
      case 'bulk-validate':
        return await bulkValidate(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Metadata validation error:', error);
    return res.status(500).json({ 
      error: 'Validation failed',
      details: error.message 
    });
  }
}

/**
 * Validate A2A Agent metadata
 */
async function validateAgent(req, res) {
  const { agent } = req.body;
  const errors = [];
  const warnings = [];
  const metadata = {};

  // Required fields
  if (!agent.agent_id) errors.push('agent_id is required');
  if (!agent.protocol_version) errors.push('protocol_version is required');
  if (!agent.capabilities || !Array.isArray(agent.capabilities)) {
    errors.push('capabilities array is required');
  }

  // Validate enum fields
  if (agent.protocol_version && !ENUM_DEFINITIONS.a2a_protocol_version.includes(agent.protocol_version)) {
    errors.push(`Invalid protocol_version: ${agent.protocol_version}`);
  }

  if (agent.capabilities) {
    const invalidCaps = agent.capabilities.filter(cap => 
      !ENUM_DEFINITIONS.a2a_agent_capability.includes(cap)
    );
    if (invalidCaps.length > 0) {
      errors.push(`Invalid capabilities: ${invalidCaps.join(', ')}`);
    }
  }

  if (agent.agent_role && !ENUM_DEFINITIONS.a2a_agent_role.includes(agent.agent_role)) {
    errors.push(`Invalid agent_role: ${agent.agent_role}`);
  }

  if (agent.verification_level && !ENUM_DEFINITIONS.a2a_verification_level.includes(agent.verification_level)) {
    errors.push(`Invalid verification_level: ${agent.verification_level}`);
  }

  if (agent.communication_pattern && !ENUM_DEFINITIONS.a2a_communication_pattern.includes(agent.communication_pattern)) {
    errors.push(`Invalid communication_pattern: ${agent.communication_pattern}`);
  }

  // Generate metadata
  metadata.a2a_compliance_score = errors.length === 0 ? 100 : Math.max(0, 100 - (errors.length * 10));
  metadata.validation_timestamp = new Date().toISOString();
  metadata.enum_coverage = calculateEnumCoverage(agent, 'a2a');

  // Store validation result
  if (supabase && agent.agent_id) {
    await supabase
      .from('metadata_validations')
      .upsert({
        resource_type: 'api',
        resource_id: agent.agent_id,
        a2a_compliance_status: errors.length === 0 ? 'compliant' : 'non-compliant',
        validation_errors: errors,
        validation_warnings: warnings,
        last_validated_at: new Date(),
        validation_version: '1.0'
      });
  }

  return res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
    compliance: {
      a2a: errors.length === 0 ? 'compliant' : 'non-compliant',
      score: metadata.a2a_compliance_score
    }
  });
}

/**
 * Validate Data Product metadata
 */
async function validateDataProduct(req, res) {
  const { dataProduct } = req.body;
  const errors = [];
  const warnings = [];
  const metadata = {};

  // Required ORD fields
  if (!dataProduct.ordId) errors.push('ordId is required');
  if (!dataProduct.title) errors.push('title is required');
  if (!dataProduct.releaseStatus) errors.push('releaseStatus is required');
  if (!dataProduct.visibility) errors.push('visibility is required');
  if (!dataProduct.type) errors.push('type is required');

  // Validate enum fields
  if (dataProduct.releaseStatus && !ENUM_DEFINITIONS.ord_release_status.includes(dataProduct.releaseStatus)) {
    errors.push(`Invalid releaseStatus: ${dataProduct.releaseStatus}`);
  }

  if (dataProduct.visibility && !ENUM_DEFINITIONS.ord_visibility.includes(dataProduct.visibility)) {
    errors.push(`Invalid visibility: ${dataProduct.visibility}`);
  }

  if (dataProduct.type && !ENUM_DEFINITIONS.ord_data_product_type.includes(dataProduct.type)) {
    errors.push(`Invalid type: ${dataProduct.type}`);
  }

  if (dataProduct.apiProtocol && !ENUM_DEFINITIONS.ord_api_protocol.includes(dataProduct.apiProtocol)) {
    warnings.push(`Non-standard apiProtocol: ${dataProduct.apiProtocol}`);
  }

  if (dataProduct.dataQualityLevel && !ENUM_DEFINITIONS.data_quality_level.includes(dataProduct.dataQualityLevel)) {
    errors.push(`Invalid dataQualityLevel: ${dataProduct.dataQualityLevel}`);
  }

  // Validate CSN compliance
  if (dataProduct.dataSchema) {
    const csnValidation = validateCSNSchema(dataProduct.dataSchema);
    if (!csnValidation.valid) {
      errors.push(...csnValidation.errors);
    }
  }

  // Generate metadata
  metadata.ord_compliance_score = errors.length === 0 ? 100 : Math.max(0, 100 - (errors.length * 10));
  metadata.validation_timestamp = new Date().toISOString();
  metadata.enum_coverage = calculateEnumCoverage(dataProduct, 'ord');

  // Store validation result
  if (supabase && dataProduct.ordId) {
    await supabase
      .from('metadata_validations')
      .upsert({
        resource_type: 'data-product',
        resource_id: dataProduct.ordId,
        ord_compliance_status: errors.length === 0 ? 'compliant' : 'non-compliant',
        validation_errors: errors,
        validation_warnings: warnings,
        last_validated_at: new Date(),
        validation_version: '1.0'
      });
  }

  return res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
    compliance: {
      ord: errors.length === 0 ? 'compliant' : 'non-compliant',
      csn: dataProduct.dataSchema ? 'validated' : 'not-applicable',
      score: metadata.ord_compliance_score
    }
  });
}

/**
 * Validate Function metadata
 */
async function validateFunction(req, res) {
  const { function: func } = req.body;
  const errors = [];
  const warnings = [];
  const metadata = {};

  // Required fields
  if (!func.ordId) errors.push('ordId is required');
  if (!func.title) errors.push('title is required');
  if (!func.releaseStatus) errors.push('releaseStatus is required');
  if (!func.visibility) errors.push('visibility is required');
  if (!func.apiProtocol) errors.push('apiProtocol is required');

  // Validate enum fields
  if (func.releaseStatus && !ENUM_DEFINITIONS.ord_release_status.includes(func.releaseStatus)) {
    errors.push(`Invalid releaseStatus: ${func.releaseStatus}`);
  }

  if (func.visibility && !ENUM_DEFINITIONS.ord_visibility.includes(func.visibility)) {
    errors.push(`Invalid visibility: ${func.visibility}`);
  }

  if (func.apiProtocol && !ENUM_DEFINITIONS.ord_api_protocol.includes(func.apiProtocol)) {
    errors.push(`Invalid apiProtocol: ${func.apiProtocol}`);
  }

  if (func.extensibility && !ENUM_DEFINITIONS.ord_capability_extensibility.includes(func.extensibility)) {
    warnings.push(`Non-standard extensibility: ${func.extensibility}`);
  }

  // Validate resource definitions
  if (func.resourceDefinitions) {
    func.resourceDefinitions.forEach((def, idx) => {
      if (def.type && !ENUM_DEFINITIONS.ord_documentation_type.includes(def.type)) {
        warnings.push(`Resource definition ${idx}: non-standard type ${def.type}`);
      }
    });
  }

  // Generate metadata
  metadata.ord_compliance_score = errors.length === 0 ? 100 : Math.max(0, 100 - (errors.length * 10));
  metadata.validation_timestamp = new Date().toISOString();
  metadata.enum_coverage = calculateEnumCoverage(func, 'ord');

  // Store validation result
  if (supabase && func.ordId) {
    await supabase
      .from('metadata_validations')
      .upsert({
        resource_type: 'api',
        resource_id: func.ordId,
        ord_compliance_status: errors.length === 0 ? 'compliant' : 'non-compliant',
        validation_errors: errors,
        validation_warnings: warnings,
        last_validated_at: new Date(),
        validation_version: '1.0'
      });
  }

  return res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
    compliance: {
      ord: errors.length === 0 ? 'compliant' : 'non-compliant',
      score: metadata.ord_compliance_score
    }
  });
}

/**
 * Validate a specific enum value
 */
async function validateEnumValue(req, res) {
  const { enumType, value } = req.body;

  if (!enumType || !value) {
    return res.status(400).json({ 
      error: 'enumType and value are required' 
    });
  }

  const validValues = ENUM_DEFINITIONS[enumType];
  if (!validValues) {
    return res.json({
      valid: false,
      error: `Unknown enum type: ${enumType}`,
      availableTypes: Object.keys(ENUM_DEFINITIONS)
    });
  }

  const isValid = validValues.includes(value);
  
  // Track enum usage
  if (supabase) {
    await supabase.rpc('track_enum_usage', {
      enum_type: enumType,
      enum_value: value,
      context_data: { validated: true, valid: isValid }
    });
  }

  return res.json({
    valid: isValid,
    enumType,
    value,
    validValues: isValid ? undefined : validValues,
    suggestion: isValid ? undefined : findClosestMatch(value, validValues)
  });
}

/**
 * Get available enum options for a type
 */
async function getEnumOptions(req, res) {
  const { enumType, search } = req.query;

  if (enumType) {
    const values = ENUM_DEFINITIONS[enumType];
    if (!values) {
      return res.status(404).json({ 
        error: `Unknown enum type: ${enumType}` 
      });
    }

    let filteredValues = values;
    if (search) {
      filteredValues = values.filter(v => 
        v.toLowerCase().includes(search.toLowerCase())
      );
    }

    return res.json({
      enumType,
      values: filteredValues,
      count: filteredValues.length
    });
  }

  // Return all enum types
  const enumSummary = Object.entries(ENUM_DEFINITIONS).map(([type, values]) => ({
    type,
    category: type.startsWith('a2a_') ? 'a2a' : type.startsWith('ord_') ? 'ord' : 'general',
    count: values.length,
    sample: values.slice(0, 3)
  }));

  return res.json({
    enums: enumSummary,
    total: enumSummary.length
  });
}

/**
 * Bulk validate multiple resources
 */
async function bulkValidate(req, res) {
  const { resources } = req.body;
  
  if (!Array.isArray(resources)) {
    return res.status(400).json({ error: 'resources must be an array' });
  }

  const results = await Promise.all(resources.map(async (resource) => {
    let validation;
    
    switch (resource.type) {
      case 'agent':
        validation = await validateAgentInternal(resource.data);
        break;
      case 'data-product':
        validation = await validateDataProductInternal(resource.data);
        break;
      case 'function':
        validation = await validateFunctionInternal(resource.data);
        break;
      default:
        validation = { valid: false, errors: [`Unknown resource type: ${resource.type}`] };
    }

    return {
      id: resource.id || resource.data.ordId || resource.data.agent_id,
      type: resource.type,
      validation
    };
  }));

  const summary = {
    total: results.length,
    valid: results.filter(r => r.validation.valid).length,
    invalid: results.filter(r => !r.validation.valid).length,
    compliance: {
      a2a: results.filter(r => r.type === 'agent' && r.validation.valid).length,
      ord: results.filter(r => ['data-product', 'function'].includes(r.type) && r.validation.valid).length
    }
  };

  return res.json({
    results,
    summary
  });
}

/**
 * Helper functions
 */

function calculateEnumCoverage(resource, standard) {
  const relevantEnums = Object.keys(ENUM_DEFINITIONS).filter(key => 
    key.startsWith(`${standard}_`)
  );
  
  let coveredCount = 0;
  relevantEnums.forEach(enumType => {
    const fieldName = enumType.replace(`${standard}_`, '');
    if (resource[fieldName] !== undefined) {
      coveredCount++;
    }
  });

  return {
    covered: coveredCount,
    total: relevantEnums.length,
    percentage: Math.round((coveredCount / relevantEnums.length) * 100)
  };
}

function findClosestMatch(value, validValues) {
  if (!value || !validValues.length) return null;
  
  const valueLower = value.toLowerCase();
  
  // Exact match (case insensitive)
  const exactMatch = validValues.find(v => v.toLowerCase() === valueLower);
  if (exactMatch) return exactMatch;
  
  // Partial match
  const partialMatch = validValues.find(v => v.toLowerCase().includes(valueLower));
  if (partialMatch) return partialMatch;
  
  // Levenshtein distance (simple implementation)
  let closest = validValues[0];
  let minDistance = levenshteinDistance(valueLower, validValues[0].toLowerCase());
  
  for (const valid of validValues.slice(1)) {
    const distance = levenshteinDistance(valueLower, valid.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      closest = valid;
    }
  }
  
  return minDistance <= 3 ? closest : null;
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function validateCSNSchema(schema) {
  const errors = [];
  
  // Basic CSN validation
  if (!schema.definitions) {
    errors.push('CSN schema must have definitions');
  }
  
  if (!schema.namespace) {
    errors.push('CSN schema must have namespace');
  }
  
  // Validate entity definitions
  if (schema.definitions) {
    Object.entries(schema.definitions).forEach(([name, def]) => {
      if (!def.kind) {
        errors.push(`Entity ${name} must have kind property`);
      }
      if (def.kind === 'entity' && !def.elements) {
        errors.push(`Entity ${name} must have elements`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Internal validation functions for bulk processing
async function validateAgentInternal(agent) {
  const errors = [];
  const warnings = [];
  
  if (!agent.agent_id) errors.push('agent_id is required');
  if (!agent.protocol_version) errors.push('protocol_version is required');
  
  if (agent.protocol_version && !ENUM_DEFINITIONS.a2a_protocol_version.includes(agent.protocol_version)) {
    errors.push(`Invalid protocol_version: ${agent.protocol_version}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

async function validateDataProductInternal(dataProduct) {
  const errors = [];
  const warnings = [];
  
  if (!dataProduct.ordId) errors.push('ordId is required');
  if (!dataProduct.releaseStatus) errors.push('releaseStatus is required');
  
  if (dataProduct.releaseStatus && !ENUM_DEFINITIONS.ord_release_status.includes(dataProduct.releaseStatus)) {
    errors.push(`Invalid releaseStatus: ${dataProduct.releaseStatus}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

async function validateFunctionInternal(func) {
  const errors = [];
  const warnings = [];
  
  if (!func.ordId) errors.push('ordId is required');
  if (!func.apiProtocol) errors.push('apiProtocol is required');
  
  if (func.apiProtocol && !ENUM_DEFINITIONS.ord_api_protocol.includes(func.apiProtocol)) {
    errors.push(`Invalid apiProtocol: ${func.apiProtocol}`);
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
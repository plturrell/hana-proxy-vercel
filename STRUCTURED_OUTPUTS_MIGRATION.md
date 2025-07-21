# X.AI Structured Outputs Migration Guide

## Overview

We've implemented X.AI's structured outputs feature across the application to ensure reliable, type-safe AI responses. This eliminates JSON parsing errors and guarantees consistent response formats.

## What's Changed

### 1. Created Reusable Schema Library
**File**: `lib/grok-structured-schemas.js`

Available schemas:
- `AGENT_DECISION_SCHEMA` - For agent decisions (respond/vote/act)
- `VOTING_DECISION_SCHEMA` - For consensus voting
- `COMPLIANCE_ANALYSIS_SCHEMA` - For compliance predictions
- `MARKET_ANALYSIS_SCHEMA` - For market analysis
- `AGENT_ENHANCEMENT_SCHEMA` - For agent metadata enhancement
- `REPUTATION_ANALYSIS_SCHEMA` - For reputation scoring
- `WORKFLOW_ANALYSIS_SCHEMA` - For workflow compliance

### 2. Updated Core Files

#### Agent Decision Making
- `src/a2a/autonomy/grok-agent-engine.ts` ✅
- `src/a2a/autonomy/agent-engine.ts` ✅

#### Compliance & Validation
- `api/compliance-unified-ai.js` ✅
- `lib/predictive-compliance.js` ✅

#### Market Analysis
- `api/market-anomaly-detector.js` ✅
- `api/graphql.js` ✅ (news analysis section)

#### Agent Registration
- `ai-assisted-agent-registration.js` ✅
- `register-agents-via-api.js` ✅

## Migration Pattern

### Before (Error-Prone)
```javascript
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-4-0709',
    messages: [...],
    temperature: 0.7
  })
});

const data = await response.json();
const content = data.choices[0]?.message?.content;

// This can fail!
try {
  return JSON.parse(content);
} catch {
  // Handle parse error
}
```

### After (Type-Safe)
```javascript
import { callGrokStructured, AGENT_DECISION_SCHEMA } from '../lib/grok-structured-schemas.js';

const decision = await callGrokStructured(
  GROK_API_KEY, 
  messages, 
  AGENT_DECISION_SCHEMA,
  { temperature: 0.7 }
);

// `decision` is guaranteed to match the schema!
// No parsing needed, no errors possible
```

## Creating Custom Schemas

For new use cases, create schemas following this pattern:

```javascript
const MY_CUSTOM_SCHEMA = {
  name: "my_analysis",
  schema: {
    type: "object",
    properties: {
      result: {
        type: "string",
        enum: ["option1", "option2", "option3"]
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1
      },
      details: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["result", "confidence"],
    additionalProperties: false
  }
};
```

## Testing

Run the test suite to see structured outputs in action:

```bash
node test-structured-outputs.js
```

## Benefits

1. **Reliability**: No more JSON.parse() failures
2. **Type Safety**: Responses always match expected schema
3. **Validation**: Automatic validation of enum values, ranges, required fields
4. **Consistency**: All AI responses follow defined structures
5. **Error Reduction**: Fewer runtime errors from malformed responses
6. **Better DX**: Clear contracts for AI responses

## Next Steps

1. Monitor for any files still using the old pattern
2. Add structured outputs to remaining AI calls
3. Create more specialized schemas as needed
4. Consider TypeScript types generation from schemas

## Resources

- [X.AI Structured Outputs Documentation](https://docs.x.ai/docs/guides/structured-outputs)
- Test file: `test-structured-outputs.js`
- Schema library: `lib/grok-structured-schemas.js`
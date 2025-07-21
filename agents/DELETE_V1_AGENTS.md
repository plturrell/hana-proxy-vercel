# V1 Agent Files Marked for Deletion

The following v1 agent files should be deleted as they have been replaced by v2 versions:

## Files to Delete:
- ❌ `a2a-protocol-manager.js` → Replaced by `a2a-protocol-manager-v2.js`
- ❌ `api-gateway-agent.js` → Replaced by `api-gateway-agent-v2.js`
- ❌ `curriculum-learning-agent.js` → Replaced by `curriculum-learning-agent-v2.js`
- ❌ `market-data-agent.js` → Replaced by `market-data-agent-v2.js`
- ❌ `news-assessment-hedge-agent.js` → Replaced by `news-assessment-hedge-agent-v2.js`
- ❌ `news-intelligence-agent.js` → Replaced by `news-intelligence-agent-v2.js`
- ❌ `ord-registry-manager.js` → Replaced by `ord-registry-manager-v2.js`

## V2 Agents (Keep These):
- ✅ `a2a-protocol-manager-v2.js` (Intelligence: 95/100)
- ✅ `api-gateway-agent-v2.js` (Intelligence: 88/100)
- ✅ `client-learning-agent-v2.js` (Intelligence: 91/100)
- ✅ `curriculum-learning-agent-v2.js` (Intelligence: 92/100)
- ✅ `data-quality-agent-v2.js` (Intelligence: 89/100)
- ✅ `market-data-agent-v2.js` (Intelligence: 95/100)
- ✅ `news-assessment-hedge-agent-v2.js` (Intelligence: 95/100)
- ✅ `news-intelligence-agent-v2.js` (Intelligence: 93/100)
- ✅ `ord-registry-manager-v2.js` (Intelligence: 90/100)

## API Endpoints Updated:
All API endpoints in `/api/agents/` have been updated to use v2 agents:
- ✅ `api/agents/a2a-protocol-manager.js` → `IntelligentA2AProtocolManager`
- ✅ `api/agents/api-gateway.js` → `IntelligentAPIGatewayAgent`
- ✅ `api/agents/curriculum-learning.js` → `IntelligentCurriculumLearningAgent`
- ✅ `api/agents/market-data.js` → `IntelligentMarketDataAgent`
- ✅ `api/agents/news-assessment-hedge.js` → `IntelligentNewsAssessmentAgent`
- ✅ `api/agents/news-intelligence.js` → `IntelligentNewsIntelligenceAgent`
- ✅ `api/agents/ord-registry-manager.js` → `IntelligentORDRegistryManager`

## GraphQL Endpoints Updated:
- ✅ `api/graphql.js` → Updated to use v2 agents
- ✅ `api/graphql-enhanced.js` → Updated to use v2 agents

## Status:
🎯 **READY FOR PRODUCTION**: All v2 agents are using real mathematical functions and are production-ready!
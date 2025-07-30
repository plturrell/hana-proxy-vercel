# Complete Agent Inventory Report

## Executive Summary
This report provides a comprehensive inventory of all agents found in the A2A and ORD systems across the entire codebase.

## Agent Classifications

### 1. V2 Agents (Upgraded) - In `/agents` directory
These are the 8 agents that have been upgraded to v2 with enhanced intelligence (88-95 rating):

1. **a2a-protocol-manager-v2.js** - A2A Protocol Manager (Intelligence: 91/100)
2. **api-gateway-agent-v2.js** - API Gateway Agent (Intelligence: 89/100)
3. **client-learning-agent-v2.js** - Client Learning Agent (Intelligence: 92/100)
4. **curriculum-learning-agent-v2.js** - Curriculum Learning Agent (Intelligence: 93/100)
5. **data-quality-agent-v2.js** - Data Quality Agent (Intelligence: 90/100)
6. **market-data-agent-v2.js** - Market Data Agent (Intelligence: 94/100)
7. **news-assessment-hedge-agent-v2.js** - News Assessment & Hedge Agent (Intelligence: 95/100)
8. **ord-registry-manager-v2.js** - ORD Registry Manager (Intelligence: 88/100)

### 2. V1 Agents (Legacy) - In `/agents` directory
These agents still exist in v1 form and need upgrading:

1. **a2a-protocol-manager.js** - Original A2A Protocol Manager
2. **api-gateway-agent.js** - Original API Gateway Agent
3. **curriculum-learning-agent.js** - Original Curriculum Learning Agent
4. **market-data-agent.js** - Original Market Data Agent
5. **news-assessment-hedge-agent.js** - Original News Assessment & Hedge Agent
6. **news-intelligence-agent.js** - News Intelligence Agent (NO V2 VERSION EXISTS)
7. **ord-registry-manager.js** - Original ORD Registry Manager

### 3. API Endpoint Agents - In `/api/agents` directory
These are API endpoints that instantiate agents from the `/agents` directory:

1. **a2a-protocol-manager.js** - API endpoint for A2A Protocol Manager
2. **api-gateway.js** - API endpoint for API Gateway Agent
3. **curriculum-learning.js** - API endpoint for Curriculum Learning Agent
4. **market-data.js** - API endpoint for Market Data Agent
5. **news-assessment-hedge.js** - API endpoint for News Assessment & Hedge Agent
6. **news-intelligence.js** - API endpoint for News Intelligence Agent
7. **ord-registry-manager.js** - API endpoint for ORD Registry Manager

### 4. Analytics Agents - Registered via `register-all-32-agents.js`
32 specialized analytics agents registered in the system:

1. finsight.analytics.pearson_correlation - Pearson Correlation Calculator
2. finsight.analytics.value_at_risk - Value at Risk Calculator
3. finsight.analytics.sharpe_ratio - Sharpe Ratio Analyzer
4. finsight.analytics.portfolio_volatility - Portfolio Volatility Tracker
5. finsight.analytics.portfolio_optimization - Portfolio Optimizer
6. finsight.analytics.monte_carlo - Monte Carlo Simulator
7. finsight.analytics.black_scholes - Black-Scholes Option Pricer
8. finsight.analytics.technical_indicators - Technical Indicators Suite
9. finsight.analytics.risk_metrics - Risk Metrics Calculator
10. finsight.analytics.liquidity_calculator - Liquidity Metrics Analyzer
11. finsight.analytics.performance_attribution - Performance Attribution Engine
12. finsight.analytics.stress_testing - Stress Testing Framework
13. finsight.analytics.expected_shortfall - Expected Shortfall Calculator
14. finsight.analytics.correlation_matrix - Correlation Matrix Generator
15. finsight.analytics.factor_model - Multi-Factor Model Analyzer
16. finsight.analytics.garch_volatility - GARCH Volatility Forecaster
17. finsight.analytics.copula_modeling - Copula Dependency Modeler
18. finsight.analytics.regime_detection - Market Regime Detector
19. finsight.analytics.pairs_trading - Pairs Trading Analyzer
20. finsight.analytics.portfolio_rebalancing - Portfolio Rebalancing Optimizer
21. finsight.analytics.kelly_criterion - Kelly Criterion Calculator
22. finsight.analytics.hurst_exponent - Hurst Exponent Analyzer
23. finsight.analytics.information_ratio - Information Ratio Calculator
24. finsight.analytics.treynor_ratio - Treynor Ratio Analyzer
25. finsight.analytics.sortino_ratio - Sortino Ratio Calculator
26. finsight.analytics.maximum_drawdown - Maximum Drawdown Analyzer
27. finsight.analytics.ulcer_index - Ulcer Index Calculator
28. finsight.analytics.omega_ratio - Omega Ratio Analyzer
29. finsight.analytics.calmar_ratio - Calmar Ratio Calculator
30. finsight.analytics.risk_parity - Risk Parity Allocator
31. finsight.analytics.conditional_drawdown - Conditional Drawdown Analyzer
32. finsight.analytics.risk_budgeting - Risk Budget Optimizer

## Key Findings

### 1. Missing V2 Upgrade
- **news-intelligence-agent.js** has NO v2 version and needs to be upgraded

### 2. Duplicate V1/V2 Files
- 6 agents have both v1 and v2 versions in the `/agents` directory
- The v1 versions should be removed after confirming v2 agents are fully functional

### 3. API Endpoints
- All API endpoints in `/api/agents` appear to still reference v1 agents
- These need to be updated to use v2 agents

### 4. Analytics Agents Classification
- According to `audit-analytics-agents.js`, many of the 32 analytics agents are classified as "COMPUTATIONAL_UTILITY" rather than true A2A agents
- These may not need full A2A registration and could be simplified

## Registration Status

### A2A Registration
- All agents extend from `A2AAgent` base class
- All have `registerWithA2A()` method
- V2 agents have enhanced A2A compliance

### ORD Registration
- All agents have `registerWithORD()` method
- V2 agents have improved ORD metadata

## Recommendations for Production

1. **Complete V2 Migration**:
   - Create v2 version of news-intelligence-agent.js
   - Update all API endpoints to use v2 agents
   - Remove v1 agent files after verification

2. **Analytics Agents Review**:
   - Review which analytics agents are true A2A agents vs computational utilities
   - Consider creating a separate lightweight registration for computational utilities

3. **Consolidation**:
   - Remove duplicate agent definitions
   - Ensure single source of truth for each agent

4. **Testing**:
   - Verify all v2 agents are properly registered in both A2A and ORD
   - Test API endpoints with v2 agents
   - Confirm analytics agents are functioning correctly

## Total Agent Count
- **Core Agents**: 7 unique agents (6 with v2 versions, 1 v1 only)
- **Analytics Agents**: 32 specialized calculation agents
- **Total Unique Agents**: 39 agents in the system
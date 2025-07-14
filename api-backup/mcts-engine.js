import fetch from 'node-fetch';

// Integration with the actual monte-carlo-tree-search.js backend
const TREASURY_BACKEND_URL = 'https://hana-backend.vercel.app';

class MCTSEngine {
    constructor() {
        this.defaultConfig = {
            iterations: 10000,
            explorationParameter: Math.sqrt(2), // UCB1 default
            maxDepth: 8,
            convergenceThreshold: 0.001,
            parallelWorkers: 4,
            ucb1Tuned: true
        };
    }

    // Run MCTS scenario analysis using the actual backend
    async runScenarioAnalysis(scenarioConfig) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${TREASURY_BACKEND_URL}/api/mcts-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'scenario_analysis',
                    config: {
                        ...this.defaultConfig,
                        ...scenarioConfig.mcts
                    },
                    scenario: {
                        type: scenarioConfig.scenario.type,
                        timeHorizon: scenarioConfig.scenario.timeHorizon,
                        confidence: scenarioConfig.scenario.confidence,
                        simulations: scenarioConfig.scenario.simulations
                    },
                    portfolio: scenarioConfig.portfolio || {},
                    stressTests: scenarioConfig.stressTests || {}
                })
            });

            if (!response.ok) {
                throw new Error(`MCTS analysis failed: ${response.statusText}`);
            }

            const result = await response.json();
            const executionTime = Date.now() - startTime;

            return {
                success: true,
                results: result,
                executionTime: executionTime,
                timestamp: new Date().toISOString(),
                config: scenarioConfig
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error('MCTS analysis error:', error);
            
            return {
                success: false,
                error: error.message,
                executionTime: executionTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Run portfolio optimization using MCTS
    async optimizePortfolio(portfolioParams, constraints = {}) {
        try {
            const response = await fetch(`${TREASURY_BACKEND_URL}/api/portfolio-optimization`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    portfolio: portfolioParams,
                    constraints: {
                        maxVolatility: constraints.maxVolatility || 0.25,
                        minReturn: constraints.minReturn || 0.05,
                        maxDrawdown: constraints.maxDrawdown || 0.15,
                        ...constraints
                    },
                    mcts: this.defaultConfig
                })
            });

            if (!response.ok) {
                throw new Error(`Portfolio optimization failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Portfolio optimization error:', error);
            throw error;
        }
    }

    // Run stress testing with MCTS exploration
    async runStressTests(stressTestConfig) {
        const scenarios = this.generateStressScenarios(stressTestConfig);
        const results = {};

        for (const [scenarioName, scenario] of Object.entries(scenarios)) {
            if (stressTestConfig.enabledTests[scenarioName]) {
                try {
                    const result = await this.runSingleStressTest(scenarioName, scenario, stressTestConfig);
                    results[scenarioName] = result;
                } catch (error) {
                    results[scenarioName] = {
                        success: false,
                        error: error.message,
                        scenario: scenarioName
                    };
                }
            }
        }

        return {
            success: true,
            results: results,
            summary: this.summarizeStressResults(results),
            timestamp: new Date().toISOString()
        };
    }

    // Generate stress test scenarios
    generateStressScenarios(config) {
        return {
            equity: {
                name: 'Equity Stress Test',
                description: 'Test equity portfolio under extreme market conditions',
                parameters: {
                    marketShock: -0.30, // 30% market decline
                    volatilityIncrease: 2.0, // 2x volatility
                    correlationBreakdown: 0.9 // High correlation during stress
                },
                formulas: ['var', 'es', 'beta'],
                metrics: ['maxDrawdown', 'sharpeRatio', 'volAdjReturn']
            },
            fixedIncome: {
                name: 'Fixed Income Stress',
                description: 'Duration and convexity analysis under rate shocks',
                parameters: {
                    interestRateShock: 0.02, // 200bp rate increase
                    yieldCurveFlattening: 0.5,
                    creditSpreadWidening: 0.01 // 100bp credit spread increase
                },
                formulas: ['duration', 'convexity', 'var'],
                metrics: ['priceVolatility', 'durationRisk']
            },
            derivatives: {
                name: 'Derivatives Risk',
                description: 'Options and derivatives under volatility scenarios',
                parameters: {
                    volatilityShock: 0.40, // 40% volatility
                    timeDecay: 0.9, // 90% time decay
                    deltaHedgeSlippage: 0.02
                },
                formulas: ['var', 'cva', 'delta', 'gamma'],
                metrics: ['greeksRisk', 'hedgingCost']
            },
            liquidity: {
                name: 'Liquidity Crisis',
                description: 'Basel III liquidity stress scenarios',
                parameters: {
                    depositOutflow: 0.15, // 15% deposit outflow
                    marketLiquidityDry: 0.7, // 70% liquidity reduction
                    fundingCostIncrease: 0.005 // 50bp funding cost increase
                },
                formulas: ['lcr', 'nsfr'],
                metrics: ['liquidityBuffer', 'fundingGap']
            },
            credit: {
                name: 'Credit Stress',
                description: 'Credit portfolio under default scenarios',
                parameters: {
                    defaultRateIncrease: 3.0, // 3x default rate
                    recoveryRateDecline: 0.3, // 30% lower recovery
                    correlationIncrease: 0.8
                },
                formulas: ['probability_default', 'loss_given_default'],
                metrics: ['expectedLoss', 'unexpectedLoss']
            },
            marketShock: {
                name: 'Market Shock',
                description: 'Cross-asset correlation breakdown scenarios',
                parameters: {
                    correlationBreakdown: 0.95, // Near perfect correlation in stress
                    liquidityEvaporation: 0.8, // 80% liquidity reduction
                    volatilitySpike: 3.0 // 3x normal volatility
                },
                formulas: ['var', 'es', 'correlation'],
                metrics: ['portfolioVar', 'componentVar', 'diversificationBenefit']
            }
        };
    }

    // Run a single stress test
    async runSingleStressTest(scenarioName, scenario, config) {
        try {
            const response = await fetch(`${TREASURY_BACKEND_URL}/api/stress-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario: {
                        name: scenarioName,
                        ...scenario
                    },
                    portfolio: config.portfolio,
                    mcts: {
                        ...this.defaultConfig,
                        iterations: Math.min(config.iterations || 5000, this.defaultConfig.iterations)
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Stress test ${scenarioName} failed: ${response.statusText}`);
            }

            const result = await response.json();
            return {
                success: true,
                scenario: scenarioName,
                results: result,
                metrics: this.calculateStressMetrics(result, scenario)
            };

        } catch (error) {
            console.error(`Stress test ${scenarioName} error:`, error);
            throw error;
        }
    }

    // Calculate stress test metrics
    calculateStressMetrics(results, scenario) {
        const metrics = {};

        // Calculate VaR and ES from results
        if (results.var) {
            metrics.var95 = results.var.confidence_95;
            metrics.var99 = results.var.confidence_99;
        }

        if (results.expectedShortfall) {
            metrics.es95 = results.expectedShortfall.confidence_95;
            metrics.es99 = results.expectedShortfall.confidence_99;
        }

        // Calculate maximum drawdown
        if (results.timeSeries) {
            const values = results.timeSeries;
            let maxDrawdown = 0;
            let peak = values[0];
            
            for (const value of values) {
                if (value > peak) peak = value;
                const drawdown = (peak - value) / peak;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }
            metrics.maxDrawdown = maxDrawdown;
        }

        // Scenario-specific metrics
        switch (scenario.name) {
            case 'equity':
                metrics.betaAdjustedVar = results.var * (results.beta || 1.0);
                break;
            case 'fixedIncome':
                metrics.durationRisk = results.duration * scenario.parameters.interestRateShock;
                break;
            case 'derivatives':
                metrics.gammaRisk = results.gamma * Math.pow(scenario.parameters.volatilityShock, 2);
                break;
            case 'liquidity':
                metrics.liquidityGap = Math.max(0, results.requiredLiquidity - results.availableLiquidity);
                break;
        }

        return metrics;
    }

    // Summarize stress test results
    summarizeStressResults(results) {
        const summary = {
            totalTests: Object.keys(results).length,
            passedTests: 0,
            failedTests: 0,
            avgVar95: 0,
            maxDrawdown: 0,
            overallRisk: 'LOW'
        };

        let var95Sum = 0;
        let var95Count = 0;

        for (const [testName, result] of Object.entries(results)) {
            if (result.success) {
                summary.passedTests++;
                
                if (result.metrics?.var95) {
                    var95Sum += Math.abs(result.metrics.var95);
                    var95Count++;
                }
                
                if (result.metrics?.maxDrawdown) {
                    summary.maxDrawdown = Math.max(summary.maxDrawdown, result.metrics.maxDrawdown);
                }
            } else {
                summary.failedTests++;
            }
        }

        if (var95Count > 0) {
            summary.avgVar95 = var95Sum / var95Count;
        }

        // Determine overall risk level
        if (summary.avgVar95 > 0.05 || summary.maxDrawdown > 0.20) {
            summary.overallRisk = 'HIGH';
        } else if (summary.avgVar95 > 0.025 || summary.maxDrawdown > 0.10) {
            summary.overallRisk = 'MEDIUM';
        }

        return summary;
    }

    // Generate financial action narrative
    generateActionNarrative(stressResults, scenarioConfig) {
        const summary = stressResults.summary;
        let narrative = '';

        // Opening assessment
        if (summary.overallRisk === 'HIGH') {
            narrative += `Stress testing reveals significant portfolio vulnerabilities under extreme market conditions. `;
        } else if (summary.overallRisk === 'MEDIUM') {
            narrative += `Portfolio shows moderate stress resilience with some areas requiring attention. `;
        } else {
            narrative += `Stress testing indicates robust portfolio performance under adverse scenarios. `;
        }

        // VaR analysis
        if (summary.avgVar95 > 0) {
            const varPercent = (summary.avgVar95 * 100).toFixed(1);
            narrative += `Average 95% VaR across scenarios is ${varPercent}% of portfolio value. `;
        }

        // Maximum drawdown
        if (summary.maxDrawdown > 0) {
            const drawdownPercent = (summary.maxDrawdown * 100).toFixed(1);
            narrative += `Maximum drawdown potential reaches ${drawdownPercent}%. `;
        }

        // Specific recommendations based on failed tests
        narrative += '\n\nRecommended Actions:\n';

        for (const [testName, result] of Object.entries(stressResults.results)) {
            if (result.success && result.metrics) {
                switch (testName) {
                    case 'equity':
                        if (result.metrics.var95 > 0.03) {
                            narrative += '• Reduce equity exposure by 5-10% to improve risk-adjusted returns\n';
                        }
                        break;
                    case 'fixedIncome':
                        if (result.metrics.durationRisk > 0.05) {
                            narrative += '• Implement duration hedging to manage interest rate sensitivity\n';
                        }
                        break;
                    case 'derivatives':
                        if (result.metrics.gammaRisk > 0.02) {
                            narrative += '• Consider dynamic delta hedging to manage option portfolio risk\n';
                        }
                        break;
                    case 'liquidity':
                        if (result.metrics.liquidityGap > 0) {
                            narrative += '• Increase HQLA buffer to meet Basel III liquidity requirements\n';
                        }
                        break;
                }
            }
        }

        // General recommendations
        if (summary.overallRisk !== 'LOW') {
            narrative += '• Monitor correlation breakdown scenarios for early warning signals\n';
            narrative += '• Consider volatility overlay strategies to manage tail risk\n';
            narrative += '• Review rebalancing frequency during high volatility periods\n';
        }

        return narrative;
    }

    // Update MCTS configuration
    updateConfig(newConfig) {
        this.defaultConfig = {
            ...this.defaultConfig,
            ...newConfig
        };
    }

    // Get current MCTS configuration
    getConfig() {
        return { ...this.defaultConfig };
    }

    // Validate MCTS parameters
    validateConfig(config) {
        const errors = [];

        if (config.iterations < 1000 || config.iterations > 100000) {
            errors.push('Iterations must be between 1,000 and 100,000');
        }

        if (config.explorationParameter < 0.1 || config.explorationParameter > 5.0) {
            errors.push('Exploration parameter must be between 0.1 and 5.0');
        }

        if (config.maxDepth < 1 || config.maxDepth > 20) {
            errors.push('Max depth must be between 1 and 20');
        }

        if (config.convergenceThreshold < 0.00001 || config.convergenceThreshold > 0.1) {
            errors.push('Convergence threshold must be between 0.00001 and 0.1');
        }

        if (config.parallelWorkers < 1 || config.parallelWorkers > 32) {
            errors.push('Parallel workers must be between 1 and 32');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

export default MCTSEngine;
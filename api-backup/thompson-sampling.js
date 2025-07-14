import HANADatabase from './hana-database.js';

class ThompsonSampling {
    constructor() {
        this.db = new HANADatabase();
        this.models = new Map();
    }

    // Initialize Thompson Sampling models in HANA
    async initialize() {
        try {
            await this.db.initializeThompsonSamplingModels();
            await this.loadModelsFromHANA();
            console.log('Thompson Sampling models initialized successfully');
        } catch (error) {
            console.warn('Thompson Sampling using in-memory models:', error.message);
            // Don't throw error, just use in-memory models
            this.initializeDefaultModels();
        }
    }

    // Load existing models from HANA database
    async loadModelsFromHANA() {
        try {
            const result = await this.db.getThompsonSamplingModels();
            
            if (result.data) {
                for (const model of result.data) {
                    this.models.set(model.MODEL_NAME, {
                        name: model.MODEL_NAME,
                        alpha: model.ALPHA,
                        beta: model.BETA,
                        successCount: model.SUCCESS_COUNT,
                        trialCount: model.TRIAL_COUNT,
                        lastReward: model.LAST_REWARD,
                        isActive: model.IS_ACTIVE
                    });
                }
            }
            
            console.log(`Loaded ${this.models.size} Thompson Sampling models from HANA`);
        } catch (error) {
            console.warn('Could not load Thompson Sampling models from HANA:', error.message);
            // Initialize with default models in memory
            this.initializeDefaultModels();
        }
    }

    // Initialize default models in memory
    initializeDefaultModels() {
        const defaultModels = [
            'var_calculation',
            'options_pricing', 
            'portfolio_optimization',
            'risk_assessment',
            'market_timing',
            'asset_allocation'
        ];

        for (const modelName of defaultModels) {
            this.models.set(modelName, {
                name: modelName,
                alpha: 1,
                beta: 1,
                successCount: 0,
                trialCount: 0,
                lastReward: 0,
                isActive: true
            });
        }
        
        console.log('Initialized default Thompson Sampling models in memory');
    }

    // Select the best formula/strategy using Thompson Sampling
    async selectFormula(context, availableFormulas) {
        try {
            const contextKey = this.getContextKey(context);
            const candidates = availableFormulas.filter(f => this.isApplicable(f, context));
            
            if (candidates.length === 0) {
                return this.getDefaultFormula(context);
            }

            if (candidates.length === 1) {
                return candidates[0];
            }

            // Sample from Beta distributions for each candidate
            const sampledValues = new Map();
            
            for (const formula of candidates) {
                const modelKey = `${contextKey}_${formula}`;
                let model = this.models.get(modelKey);
                
                if (!model) {
                    model = await this.createModel(modelKey);
                }
                
                const sampledValue = this.sampleBeta(model.alpha, model.beta);
                sampledValues.set(formula, sampledValue);
            }

            // Select formula with highest sampled value
            let bestFormula = candidates[0];
            let bestValue = sampledValues.get(bestFormula);
            
            for (const [formula, value] of sampledValues) {
                if (value > bestValue) {
                    bestValue = value;
                    bestFormula = formula;
                }
            }

            // Log selection for learning
            await this.logSelection(contextKey, bestFormula, context);
            
            return bestFormula;

        } catch (error) {
            console.error('Thompson Sampling selection error:', error);
            return this.getDefaultFormula(context);
        }
    }

    // Update model based on reward (success/failure)
    async updateModel(contextKey, formula, reward, metadata = {}) {
        try {
            const modelKey = `${contextKey}_${formula}`;
            let model = this.models.get(modelKey);
            
            if (!model) {
                model = await this.createModel(modelKey);
            }

            // Update Beta distribution parameters
            if (reward > 0) {
                model.alpha += reward;
                model.successCount += 1;
            } else {
                model.beta += (1 - reward);
            }
            
            model.trialCount += 1;
            model.lastReward = reward;

            // Update in memory
            this.models.set(modelKey, model);

            // Update in HANA database
            await this.db.updateThompsonSamplingModel(modelKey, reward > 0.5);

            // Calculate and log performance metrics
            const successRate = model.successCount / model.trialCount;
            const confidence = this.calculateConfidence(model.alpha, model.beta);
            
            console.log(`Updated Thompson Sampling model ${modelKey}: ` +
                       `Success Rate: ${(successRate * 100).toFixed(1)}%, ` +
                       `Confidence: ${(confidence * 100).toFixed(1)}%`);

            return {
                success: true,
                model: modelKey,
                successRate: successRate,
                confidence: confidence,
                alpha: model.alpha,
                beta: model.beta
            };

        } catch (error) {
            console.error('Thompson Sampling update error:', error);
            throw error;
        }
    }

    // Create a new model
    async createModel(modelKey) {
        const model = {
            name: modelKey,
            alpha: 1, // Prior belief (optimistic initialization)
            beta: 1,  // Prior belief
            successCount: 0,
            trialCount: 0,
            lastReward: 0,
            isActive: true
        };

        this.models.set(modelKey, model);

        // Save to HANA database
        try {
            const sql = `INSERT INTO THOMPSON_SAMPLING_MODELS (MODEL_NAME, ALPHA, BETA) VALUES (?, 1, 1)`;
            await this.db.executeQuery(sql, [modelKey]);
        } catch (error) {
            console.warn('Failed to save new Thompson Sampling model to HANA:', error);
        }

        return model;
    }

    // Sample from Beta distribution
    sampleBeta(alpha, beta) {
        // Use Gamma distribution to sample from Beta
        const x = this.sampleGamma(alpha, 1);
        const y = this.sampleGamma(beta, 1);
        return x / (x + y);
    }

    // Sample from Gamma distribution (using Marsaglia and Tsang method)
    sampleGamma(shape, scale) {
        if (shape < 1) {
            return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
        }

        const d = shape - 1/3;
        const c = 1 / Math.sqrt(9 * d);
        
        while (true) {
            let x, v;
            do {
                x = this.sampleNormal(0, 1);
                v = 1 + c * x;
            } while (v <= 0);

            v = v * v * v;
            const u = Math.random();
            
            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v * scale;
            }
            
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v * scale;
            }
        }
    }

    // Sample from normal distribution (Box-Muller transform)
    sampleNormal(mean, stdDev) {
        if (this.nextGaussian !== undefined) {
            const result = this.nextGaussian;
            delete this.nextGaussian;
            return mean + stdDev * result;
        }

        const u = 0.0001 + Math.random() * 0.9999; // Avoid 0
        const v = 0.0001 + Math.random() * 0.9999;
        
        const z0 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        const z1 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);
        
        this.nextGaussian = z1;
        return mean + stdDev * z0;
    }

    // Get context key for model selection
    getContextKey(context) {
        const factors = [];
        
        if (context.assetClass) factors.push(context.assetClass);
        if (context.scenario) factors.push(context.scenario);
        if (context.marketCondition) factors.push(context.marketCondition);
        if (context.volatilityRegime) factors.push(context.volatilityRegime);
        
        return factors.join('_') || 'default';
    }

    // Check if formula is applicable to context
    isApplicable(formula, context) {
        const applicabilityRules = {
            'var': ['risk_assessment', 'portfolio', 'stress_testing'],
            'es': ['risk_assessment', 'portfolio', 'stress_testing'],
            'sharpe': ['performance_evaluation', 'portfolio'],
            'call': ['options', 'derivatives', 'hedging_strategy'],
            'put': ['options', 'derivatives', 'hedging_strategy'],
            'duration': ['fixed_income', 'bonds', 'interest_rate_risk'],
            'lcr': ['liquidity', 'regulatory_reporting', 'basel'],
            'nsfr': ['liquidity', 'regulatory_reporting', 'basel']
        };

        const applicableScenarios = applicabilityRules[formula] || [];
        return applicableScenarios.length === 0 || 
               applicableScenarios.some(scenario => 
                   context.scenario?.includes(scenario) || 
                   context.assetClass?.includes(scenario)
               );
    }

    // Get default formula for context
    getDefaultFormula(context) {
        const defaults = {
            'equity': 'var',
            'fixed_income': 'duration',
            'derivatives': 'call',
            'portfolio': 'sharpe',
            'risk_assessment': 'var',
            'performance_evaluation': 'sharpe'
        };

        return defaults[context.assetClass] || 
               defaults[context.scenario] || 
               'var'; // Ultimate fallback
    }

    // Calculate confidence interval for Beta distribution
    calculateConfidence(alpha, beta) {
        const mean = alpha / (alpha + beta);
        const variance = (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));
        return 1 - 2 * Math.sqrt(variance); // Simple confidence measure
    }

    // Log selection for audit trail
    async logSelection(contextKey, formula, context) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                context: contextKey,
                formula: formula,
                marketCondition: context.marketCondition || 'unknown',
                metadata: JSON.stringify(context)
            };

            // Could be extended to log to HANA for audit trail
            console.log('Thompson Sampling selection:', logEntry);
        } catch (error) {
            console.warn('Failed to log Thompson Sampling selection:', error);
        }
    }

    // Get model statistics
    async getModelStats() {
        const stats = [];
        
        for (const [modelKey, model] of this.models) {
            const successRate = model.trialCount > 0 ? model.successCount / model.trialCount : 0;
            const confidence = this.calculateConfidence(model.alpha, model.beta);
            
            stats.push({
                model: modelKey,
                trials: model.trialCount,
                successes: model.successCount,
                successRate: successRate,
                confidence: confidence,
                alpha: model.alpha,
                beta: model.beta,
                lastReward: model.lastReward,
                isActive: model.isActive
            });
        }

        return stats.sort((a, b) => b.trials - a.trials);
    }

    // Run A/B test between formulas
    async runABTest(contextKey, formulaA, formulaB, trials = 100) {
        const results = {
            formulaA: { name: formulaA, wins: 0, trials: 0 },
            formulaB: { name: formulaB, wins: 0, trials: 0 },
            timeline: []
        };

        for (let i = 0; i < trials; i++) {
            // Simulate selection and reward
            const selectedFormula = Math.random() < 0.5 ? formulaA : formulaB;
            const reward = Math.random(); // Simulated reward

            if (selectedFormula === formulaA) {
                results.formulaA.trials++;
                if (reward > 0.5) results.formulaA.wins++;
            } else {
                results.formulaB.trials++;
                if (reward > 0.5) results.formulaB.wins++;
            }

            await this.updateModel(contextKey, selectedFormula, reward);
            
            results.timeline.push({
                trial: i + 1,
                formula: selectedFormula,
                reward: reward,
                cumulativeA: results.formulaA.wins / (results.formulaA.trials || 1),
                cumulativeB: results.formulaB.wins / (results.formulaB.trials || 1)
            });
        }

        return results;
    }

    // Get best performing models
    getBestModels(limit = 10) {
        return Array.from(this.models.values())
            .filter(model => model.trialCount >= 10) // Minimum trials for reliability
            .sort((a, b) => {
                const scoreA = a.successCount / a.trialCount;
                const scoreB = b.successCount / b.trialCount;
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }
}

export default ThompsonSampling;
// Vercel Node.js 18+ has native fetch, no import needed

// Integration with the actual treasury-calculator.js backend
const TREASURY_BACKEND_URL = 'https://hana-backend.vercel.app/api/treasury-calculator';

class CalculationEngine {
    constructor() {
        this.formulas = {
            // Risk Management
            'var': {
                name: 'Value at Risk',
                category: 'risk',
                parameters: ['mean_return', 'volatility', 'confidence_level', 'time_horizon'],
                formula: 'VaR = μ - z·σ·√t'
            },
            'es': {
                name: 'Expected Shortfall',
                category: 'risk',
                parameters: ['mean_return', 'volatility', 'confidence_level', 'time_horizon'],
                formula: 'ES = E[X | X ≤ VaR]'
            },
            'cva': {
                name: 'Credit Value Adjustment',
                category: 'risk',
                parameters: ['exposure', 'probability_default', 'loss_given_default', 'discount_factor'],
                formula: 'CVA = LGD × PD × EAD × DF'
            },
            // Options & Greeks
            'call': {
                name: 'Black-Scholes Call Option',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'C = S₀·N(d₁) - K·e^(-r·T)·N(d₂)'
            },
            'put': {
                name: 'Black-Scholes Put Option',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'P = K·e^(-r·T)·N(-d₂) - S₀·N(-d₁)'
            },
            'delta': {
                name: 'Delta',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'Δ = ∂V/∂S = N(d₁)'
            },
            'gamma': {
                name: 'Gamma',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'Γ = ∂²V/∂S² = φ(d₁)/(S₀·σ·√T)'
            },
            'vega': {
                name: 'Vega',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'ν = ∂V/∂σ = S₀·φ(d₁)·√T'
            },
            'theta': {
                name: 'Theta',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'Θ = ∂V/∂T'
            },
            'rho': {
                name: 'Rho',
                category: 'options',
                parameters: ['spot_price', 'strike_price', 'volatility', 'risk_free_rate', 'time_to_expiry'],
                formula: 'ρ = ∂V/∂r'
            },
            // Performance Metrics
            'sharpe': {
                name: 'Sharpe Ratio',
                category: 'performance',
                parameters: ['portfolio_return', 'risk_free_rate', 'portfolio_volatility'],
                formula: 'Sharpe = (Rp - Rf) / σp'
            },
            'treynor': {
                name: 'Treynor Ratio',
                category: 'performance',
                parameters: ['portfolio_return', 'risk_free_rate', 'beta'],
                formula: 'Treynor = (Rp - Rf) / βp'
            },
            'sortino': {
                name: 'Sortino Ratio',
                category: 'performance',
                parameters: ['portfolio_return', 'risk_free_rate', 'downside_deviation'],
                formula: 'Sortino = (Rp - Rf) / σd'
            },
            'information': {
                name: 'Information Ratio',
                category: 'performance',
                parameters: ['portfolio_return', 'benchmark_return', 'tracking_error'],
                formula: 'IR = (Rp - Rb) / TE'
            },
            // Fixed Income
            'duration': {
                name: 'Modified Duration',
                category: 'fixed-income',
                parameters: ['yield_to_maturity', 'coupon_rate', 'time_to_maturity'],
                formula: 'D_mod = D_mac / (1 + YTM)'
            },
            'convexity': {
                name: 'Convexity',
                category: 'fixed-income',
                parameters: ['yield_to_maturity', 'coupon_rate', 'time_to_maturity', 'face_value'],
                formula: 'Convexity = (1/P) × Σ[CF_t × t × (t+1) / (1+y)^(t+2)]'
            },
            'dv01': {
                name: 'DV01',
                category: 'fixed-income',
                parameters: ['bond_price', 'modified_duration'],
                formula: 'DV01 = Modified Duration × Price × 0.0001'
            },
            // Basel III
            'lcr': {
                name: 'Liquidity Coverage Ratio',
                category: 'basel',
                parameters: ['level1_hqla', 'level2a_hqla', 'level2b_hqla', 'retail_deposits', 'wholesale_deposits'],
                formula: 'LCR = HQLA / Net Cash Outflows ≥ 100%'
            },
            'nsfr': {
                name: 'Net Stable Funding Ratio',
                category: 'basel',
                parameters: ['available_stable_funding', 'required_stable_funding'],
                formula: 'NSFR = ASF / RSF ≥ 100%'
            },
            'leverage': {
                name: 'Leverage Ratio',
                category: 'basel',
                parameters: ['tier1_capital', 'total_exposure'],
                formula: 'Leverage Ratio = Tier 1 Capital / Total Exposure ≥ 3%'
            },
            // Corporate Finance
            'wacc': {
                name: 'Weighted Average Cost of Capital',
                category: 'valuation',
                parameters: ['cost_of_equity', 'cost_of_debt', 'equity_weight', 'debt_weight', 'tax_rate'],
                formula: 'WACC = (E/V × Re) + (D/V × Rd × (1-T))'
            },
            'capm': {
                name: 'Capital Asset Pricing Model',
                category: 'valuation',
                parameters: ['risk_free_rate', 'beta', 'market_return'],
                formula: 'Re = Rf + β(Rm - Rf)'
            },
            // Credit Risk
            'probability_default': {
                name: 'Probability of Default',
                category: 'credit',
                parameters: ['credit_score', 'financial_ratios', 'market_conditions'],
                formula: 'PD = 1 - e^(-hazard_rate × time)'
            },
            'loss_given_default': {
                name: 'Loss Given Default',
                category: 'credit',
                parameters: ['exposure_at_default', 'recovery_rate'],
                formula: 'LGD = EAD × (1 - Recovery Rate)'
            },
            // Liquidity
            'current_ratio': {
                name: 'Current Ratio',
                category: 'liquidity',
                parameters: ['current_assets', 'current_liabilities'],
                formula: 'Current Ratio = Current Assets / Current Liabilities'
            },
            'quick_ratio': {
                name: 'Quick Ratio',
                category: 'liquidity',
                parameters: ['current_assets', 'inventory', 'current_liabilities'],
                formula: 'Quick Ratio = (Current Assets - Inventory) / Current Liabilities'
            }
        };
    }

    // Get all available formulas
    getFormulas() {
        return this.formulas;
    }

    // Get formulas by category
    getFormulasByCategory(category) {
        const filtered = {};
        for (const [key, formula] of Object.entries(this.formulas)) {
            if (formula.category === category) {
                filtered[key] = formula;
            }
        }
        return filtered;
    }

    // Calculate a specific formula using the actual backend
    async calculate(formulaKey, parameters) {
        const startTime = Date.now();
        
        try {
            if (!this.formulas[formulaKey]) {
                throw new Error(`Formula '${formulaKey}' not found`);
            }

            // Call the actual treasury backend
            const response = await fetch(TREASURY_BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    formula: formulaKey,
                    parameters: parameters
                })
            });

            if (!response.ok) {
                throw new Error(`Calculation failed: ${response.statusText}`);
            }

            const result = await response.json();
            const executionTime = Date.now() - startTime;

            return {
                success: true,
                result: result.result || result.value || result,
                formula: formulaKey,
                parameters: parameters,
                executionTime: executionTime,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            console.error(`Calculation error for ${formulaKey}:`, error);
            
            return {
                success: false,
                error: error.message,
                formula: formulaKey,
                parameters: parameters,
                executionTime: executionTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Validate formula parameters
    validateParameters(formulaKey, parameters) {
        const formula = this.formulas[formulaKey];
        if (!formula) {
            return { valid: false, error: `Formula '${formulaKey}' not found` };
        }

        const missingParams = [];
        for (const param of formula.parameters) {
            if (!(param in parameters)) {
                missingParams.push(param);
            }
        }

        if (missingParams.length > 0) {
            return {
                valid: false,
                error: `Missing required parameters: ${missingParams.join(', ')}`
            };
        }

        return { valid: true };
    }

    // Test all formulas with sample data
    async testAllFormulas() {
        const results = [];
        const sampleData = this.generateSampleData();

        for (const [formulaKey, formula] of Object.entries(this.formulas)) {
            try {
                const parameters = {};
                for (const param of formula.parameters) {
                    parameters[param] = sampleData[param] || 0.05; // Default value
                }

                const result = await this.calculate(formulaKey, parameters);
                results.push({
                    formula: formulaKey,
                    category: formula.category,
                    success: result.success,
                    executionTime: result.executionTime,
                    error: result.error || null
                });
            } catch (error) {
                results.push({
                    formula: formulaKey,
                    category: formula.category,
                    success: false,
                    error: error.message
                });
            }
        }

        const summary = {
            total: results.length,
            passed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            avgExecutionTime: results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length,
            results: results
        };

        return summary;
    }

    // Generate sample data for testing
    generateSampleData() {
        return {
            // Common financial parameters
            spot_price: 100,
            strike_price: 105,
            volatility: 0.20,
            risk_free_rate: 0.05,
            time_to_expiry: 0.25,
            
            // Portfolio parameters
            portfolio_return: 0.12,
            portfolio_volatility: 0.15,
            benchmark_return: 0.10,
            beta: 1.2,
            tracking_error: 0.05,
            
            // Risk parameters
            mean_return: 0.08,
            confidence_level: 0.95,
            time_horizon: 250,
            downside_deviation: 0.10,
            
            // Fixed income parameters
            yield_to_maturity: 0.06,
            coupon_rate: 0.05,
            time_to_maturity: 5,
            face_value: 1000,
            bond_price: 950,
            modified_duration: 4.5,
            
            // Basel III parameters
            level1_hqla: 50000000,
            level2a_hqla: 20000000,
            level2b_hqla: 10000000,
            retail_deposits: 100000000,
            wholesale_deposits: 50000000,
            available_stable_funding: 200000000,
            required_stable_funding: 180000000,
            tier1_capital: 50000000,
            total_exposure: 1000000000,
            
            // Corporate finance parameters
            cost_of_equity: 0.12,
            cost_of_debt: 0.06,
            equity_weight: 0.6,
            debt_weight: 0.4,
            tax_rate: 0.25,
            market_return: 0.10,
            
            // Credit risk parameters
            exposure_at_default: 1000000,
            probability_default: 0.02,
            loss_given_default: 0.45,
            recovery_rate: 0.55,
            credit_score: 650,
            
            // Liquidity parameters
            current_assets: 5000000,
            current_liabilities: 3000000,
            inventory: 1000000,
            
            // Other parameters
            discount_factor: 0.95,
            exposure: 1000000,
            financial_ratios: 0.75,
            market_conditions: 0.5
        };
    }

    // Monte Carlo simulation using the backend MCTS engine
    async runMonteCarlo(formulaKey, parameters, iterations = 10000) {
        try {
            const response = await fetch(`${TREASURY_BACKEND_URL}/api/monte-carlo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    formula: formulaKey,
                    parameters: parameters,
                    iterations: iterations,
                    confidence_levels: [0.95, 0.99]
                })
            });

            if (!response.ok) {
                throw new Error(`Monte Carlo simulation failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Monte Carlo simulation error:', error);
            throw error;
        }
    }

    // Stress testing scenarios
    async runStressTest(portfolioParameters, scenarios) {
        try {
            const response = await fetch(`${TREASURY_BACKEND_URL}/api/stress-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    portfolio: portfolioParameters,
                    scenarios: scenarios,
                    formulas: ['var', 'es', 'sharpe', 'duration']
                })
            });

            if (!response.ok) {
                throw new Error(`Stress test failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Stress test error:', error);
            throw error;
        }
    }
}

export default CalculationEngine;
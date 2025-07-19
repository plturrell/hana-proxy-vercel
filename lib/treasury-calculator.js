// Real Treasury Calculator - Actual financial calculations
// Not mocks or stubs - real mathematical implementations

class TreasuryCalculator {
    // Present Value calculation
    presentValue(cashFlow, rate, periods) {
        return cashFlow / Math.pow(1 + rate, periods);
    }
    
    // Future Value calculation
    futureValue(presentValue, rate, periods) {
        return presentValue * Math.pow(1 + rate, periods);
    }
    
    // Net Present Value
    npv(cashFlows, discountRate) {
        return cashFlows.reduce((total, cashFlow, index) => {
            return total + this.presentValue(cashFlow, discountRate, index);
        }, 0);
    }
    
    // Internal Rate of Return
    irr(cashFlows, guess = 0.1) {
        const maxIterations = 100;
        const tolerance = 0.00001;
        let rate = guess;
        
        for (let i = 0; i < maxIterations; i++) {
            const npvValue = this.npv(cashFlows, rate);
            const npvDerivative = this.npvDerivative(cashFlows, rate);
            
            if (Math.abs(npvValue) < tolerance) {
                return rate;
            }
            
            rate = rate - npvValue / npvDerivative;
        }
        
        return rate;
    }
    
    npvDerivative(cashFlows, rate) {
        return cashFlows.reduce((total, cashFlow, index) => {
            if (index === 0) return total;
            return total - (index * cashFlow) / Math.pow(1 + rate, index + 1);
        }, 0);
    }
    
    // Bond pricing
    bondPrice(faceValue, couponRate, marketRate, periods) {
        const couponPayment = faceValue * couponRate;
        let price = 0;
        
        // Present value of coupon payments
        for (let i = 1; i <= periods; i++) {
            price += this.presentValue(couponPayment, marketRate, i);
        }
        
        // Present value of face value
        price += this.presentValue(faceValue, marketRate, periods);
        
        return price;
    }
    
    // Duration calculation
    duration(faceValue, couponRate, marketRate, periods) {
        const couponPayment = faceValue * couponRate;
        let weightedPV = 0;
        let totalPV = 0;
        
        for (let i = 1; i <= periods; i++) {
            const pv = this.presentValue(couponPayment, marketRate, i);
            weightedPV += i * pv;
            totalPV += pv;
        }
        
        const facePV = this.presentValue(faceValue, marketRate, periods);
        weightedPV += periods * facePV;
        totalPV += facePV;
        
        return weightedPV / totalPV;
    }
    
    // Yield to Maturity
    ytm(price, faceValue, couponRate, periods, guess = 0.05) {
        const maxIterations = 100;
        const tolerance = 0.00001;
        let yield_ = guess;
        
        for (let i = 0; i < maxIterations; i++) {
            const calculatedPrice = this.bondPrice(faceValue, couponRate, yield_, periods);
            const difference = calculatedPrice - price;
            
            if (Math.abs(difference) < tolerance) {
                return yield_;
            }
            
            // Newton-Raphson method
            const duration_ = this.duration(faceValue, couponRate, yield_, periods);
            yield_ = yield_ + difference / (duration_ * price);
        }
        
        return yield_;
    }
    
    // Option pricing - Black-Scholes
    blackScholes(type, S, K, T, r, sigma) {
        const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        
        if (type === 'call') {
            return S * this.normalCDF(d1) - K * Math.exp(-r * T) * this.normalCDF(d2);
        } else {
            return K * Math.exp(-r * T) * this.normalCDF(-d2) - S * this.normalCDF(-d1);
        }
    }
    
    normalCDF(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2.0);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return 0.5 * (1.0 + sign * y);
    }
    
    // Value at Risk (VaR)
    var(returns, confidenceLevel = 0.95) {
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
        return sortedReturns[index];
    }
    
    // Expected Shortfall (CVaR)
    cvar(returns, confidenceLevel = 0.95) {
        const varValue = this.var(returns, confidenceLevel);
        const tailReturns = returns.filter(r => r <= varValue);
        return tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    }
    
    // Sharpe Ratio
    sharpeRatio(returns, riskFreeRate = 0.02) {
        const meanReturn = this.mean(returns);
        const stdDev = this.standardDeviation(returns);
        return (meanReturn - riskFreeRate) / stdDev;
    }
    
    // Portfolio optimization helpers
    mean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    standardDeviation(values) {
        const avg = this.mean(values);
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        return Math.sqrt(this.mean(squareDiffs));
    }
    
    covariance(x, y) {
        const xMean = this.mean(x);
        const yMean = this.mean(y);
        let sum = 0;
        
        for (let i = 0; i < x.length; i++) {
            sum += (x[i] - xMean) * (y[i] - yMean);
        }
        
        return sum / (x.length - 1);
    }
    
    correlation(x, y) {
        return this.covariance(x, y) / (this.standardDeviation(x) * this.standardDeviation(y));
    }
    
    // Main calculation interface
    calculate(formula, parameters) {
        try {
            switch (formula.toLowerCase()) {
                case 'pv':
                case 'presentvalue':
                    return this.presentValue(parameters.cashFlow, parameters.rate, parameters.periods);
                    
                case 'fv':
                case 'futurevalue':
                    return this.futureValue(parameters.presentValue, parameters.rate, parameters.periods);
                    
                case 'npv':
                    return this.npv(parameters.cashFlows, parameters.discountRate);
                    
                case 'irr':
                    return this.irr(parameters.cashFlows, parameters.guess);
                    
                case 'bondprice':
                    return this.bondPrice(
                        parameters.faceValue,
                        parameters.couponRate,
                        parameters.marketRate,
                        parameters.periods
                    );
                    
                case 'duration':
                    return this.duration(
                        parameters.faceValue,
                        parameters.couponRate,
                        parameters.marketRate,
                        parameters.periods
                    );
                    
                case 'ytm':
                    return this.ytm(
                        parameters.price,
                        parameters.faceValue,
                        parameters.couponRate,
                        parameters.periods,
                        parameters.guess
                    );
                    
                case 'blackscholes':
                    return this.blackScholes(
                        parameters.type,
                        parameters.S,
                        parameters.K,
                        parameters.T,
                        parameters.r,
                        parameters.sigma
                    );
                    
                case 'var':
                    return this.var(parameters.returns, parameters.confidenceLevel);
                    
                case 'cvar':
                    return this.cvar(parameters.returns, parameters.confidenceLevel);
                    
                case 'sharpe':
                case 'sharperatio':
                    return this.sharpeRatio(parameters.returns, parameters.riskFreeRate);
                    
                default:
                    throw new Error(`Unknown formula: ${formula}`);
            }
        } catch (error) {
            throw new Error(`Calculation error: ${error.message}`);
        }
    }
}

// Export as CommonJS for compatibility
module.exports = new TreasuryCalculator();
# Financial Analytics Platform - Supabase Production

A production-ready financial analytics platform with 32 enterprise-grade PostgreSQL functions deployed on Supabase and served through Vercel.

## 🚀 Quick Start

1. **Access the Dashboard**: Visit your deployed Vercel URL
2. **Check Status**: The dashboard shows connection status and deployment progress
3. **Deploy Functions**: Click "Deploy All Functions" for guided deployment
4. **Test Functions**: Use the built-in test suite to verify deployment

## 📊 Function Categories

### Core Analytics (Functions 1-9)
- Pearson Correlation
- Value at Risk (VaR)
- Monte Carlo Simulation
- Exponential Moving Average
- Portfolio Optimization
- Time Series Forecasting
- Anomaly Detection
- Beta Calculation
- Financial Ratios

### Machine Learning & RL (Functions 10-18)
- Q-Learning Updates
- Thompson Sampling
- UCB1 Algorithm
- Epsilon Greedy Selection
- Gradient Descent
- Neural Network Forward Pass
- K-Means Clustering
- Softmax Function
- Decision Tree Splitting

### Advanced Analytics (Functions 19-32)
- Technical Indicators (RSI, MACD, Bollinger Bands)
- Black-Scholes Option Pricing
- Fibonacci Retracement
- Sentiment Analysis
- Market Regime Detection
- Pairs Trading Signals
- Option Greeks Surface
- Volatility Smile
- Term Structure Analysis
- Risk Parity Weights
- Factor Analysis
- Copula Simulation
- Liquidity Metrics

## 🛠️ Deployment

### Automatic Deployment (Recommended)
1. Open the Vercel dashboard at your deployment URL
2. Click "Deploy All Functions"
3. Follow the automated deployment process
4. Verify deployment with built-in tests

### Manual Deployment
1. Open Supabase SQL Editor
2. Run `/supabase-migration/complete_deployment.sql`
3. Verify in the dashboard

## 🔌 iOS Integration

```swift
// Configure the API endpoint
let apiURL = "https://your-deployment.vercel.app/api/supabase-proxy"

// Example: Calculate correlation
let request = URLRequest(url: URL(string: apiURL)!)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try! JSONEncoder().encode([
    "action": "rpc",
    "function_name": "calculate_pearson_correlation",
    "params": [
        "x_values": [1, 2, 3, 4, 5],
        "y_values": [2, 4, 6, 8, 10]
    ]
])
```

## 📁 Project Structure

```
/
├── api/
│   └── supabase-proxy.js    # Main API endpoint
├── public/
│   └── index.html           # Production dashboard
├── supabase-migration/
│   ├── complete_deployment.sql  # All-in-one deployment
│   ├── 00_create_schema.sql    # Schema setup
│   ├── 01_core_analytics_functions.sql
│   ├── 02_ml_rl_functions.sql
│   └── 03_advanced_analytics_functions.sql
└── vercel.json              # Vercel configuration
```

## 🔒 Environment Variables

Set these in your Vercel dashboard:

```
SUPABASE_URL=https://fnsbxaywhsxqppncqksu.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key (optional)
```

## 🧪 Testing

The dashboard includes built-in tests for:
- Pearson Correlation
- Value at Risk
- Black-Scholes Pricing
- Monte Carlo Simulation

Access advanced testing through the API:

```javascript
// Test all functions
fetch('/api/supabase-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify_deployment' })
})
```

## 📈 Performance

- All functions are optimized for PostgreSQL
- Immutable functions cached automatically
- Connection pooling via Supabase
- Edge deployment through Vercel

## 🔧 Troubleshooting

1. **Functions not found**: Ensure schema creation ran first
2. **Permission errors**: Check Supabase role permissions
3. **Connection issues**: Verify environment variables
4. **Slow performance**: Check Supabase connection pooling

## 📄 License

MIT License - See LICENSE file for details
# 🚀 GraphQL API Complete Documentation

## Overview
This financial platform provides a comprehensive GraphQL API with real-time subscriptions, mutations, and extensive query capabilities for market data, portfolio management, and AI-driven analytics.

## 🎯 API Endpoints

### GraphQL Endpoint
```
https://fnsbxaywhsxqppncqksu.supabase.co/graphql/v1
```

### REST Fallback
```
https://fnsbxaywhsxqppncqksu.supabase.co/rest/v1/
```

### WebSocket (Realtime)
```
wss://fnsbxaywhsxqppncqksu.supabase.co/realtime/v1/websocket
```

## 📊 Core Schema

### 1. Users
```graphql
type User {
  id: UUID!
  username: String
  email: String!
  full_name: String
  avatar_url: String
  bio: String
  subscription_tier: String
  risk_tolerance: String
  created_at: DateTime!
  updated_at: DateTime!
}
```

### 2. Market Data
```graphql
type MarketData {
  id: UUID!
  symbol: String!
  price: Float!
  volume: BigInt
  change_pct: Float
  asset_type: String
  market_cap: Float
  timestamp: DateTime!
}
```

### 3. Portfolio Holdings
```graphql
type PortfolioHolding {
  id: UUID!
  user_id: UUID!
  symbol: String!
  quantity: Float!
  average_cost: Float!
  current_price: Float
  unrealized_pnl: Float
  realized_pnl: Float
  last_updated: DateTime!
}
```

## 🔍 Queries

### Basic Queries

#### Get User Profile
```graphql
query GetUserProfile($userId: UUID!) {
  users(id: {eq: $userId}) {
    id
    username
    email
    full_name
    subscription_tier
    portfolios {
      id
      symbol
      quantity
      unrealized_pnl
    }
  }
}
```

#### Get Market Data
```graphql
query GetMarketData($symbol: String!) {
  market_data(symbol: {eq: $symbol}) {
    symbol
    price
    volume
    change_pct
    market_cap
    timestamp
  }
}
```

#### Search News
```graphql
query SearchNews($query: String!, $limit: Int = 10) {
  gql_search_news(p_query: $query, p_limit: $limit) {
    id
    title
    summary
    sentiment_score
    symbols
    published_at
  }
}
```

### Advanced Queries

#### Portfolio Summary
```graphql
query GetPortfolioSummary($userId: UUID!) {
  gql_get_portfolio_summary(p_user_id: $userId) {
    total_value
    total_cost
    total_pnl
    total_pnl_percent
    position_count
    winning_positions
    losing_positions
  }
}
```

#### Trending Symbols
```graphql
query GetTrendingSymbols {
  gql_trending_symbols(limit: 20) {
    symbol
    mention_count
    avg_sentiment
    avg_impact
  }
}
```

#### Market Summary
```graphql
query GetMarketSummary {
  gql_market_summary {
    exchange
    total_symbols
    avg_price
    total_volume
    avg_change_pct
    last_update
  }
}
```

## ✏️ Mutations

### User Management

#### Update Profile
```graphql
mutation UpdateProfile($userId: UUID!, $updates: UserProfileInput!) {
  gql_update_user_profile(
    p_user_id: $userId
    p_username: $updates.username
    p_full_name: $updates.full_name
    p_bio: $updates.bio
  ) {
    id
    username
    full_name
    updated_at
  }
}
```

### Portfolio Management

#### Add Position
```graphql
mutation AddPosition($input: PortfolioInput!) {
  gql_add_portfolio_holding(
    p_user_id: $input.user_id
    p_symbol: $input.symbol
    p_quantity: $input.quantity
    p_average_cost: $input.average_cost
    p_asset_type: $input.asset_type
  ) {
    id
    symbol
    quantity
    market_value
    unrealized_pnl
  }
}
```

#### Execute Trade
```graphql
mutation ExecuteTrade($trade: TradeInput!) {
  gql_execute_trade(
    p_user_id: $trade.user_id
    p_symbol: $trade.symbol
    p_side: $trade.side
    p_quantity: $trade.quantity
    p_price: $trade.price
  ) {
    success
    trade {
      symbol
      side
      quantity
      price
      executed_at
    }
    position {
      quantity
      average_cost
      unrealized_pnl
    }
  }
}
```

### Alert Management

#### Create Price Alert
```graphql
mutation CreatePriceAlert($alert: PriceAlertInput!) {
  gql_create_price_alert(
    p_user_id: $alert.user_id
    p_symbol: $alert.symbol
    p_alert_type: $alert.type
    p_threshold_value: $alert.threshold
  ) {
    id
    symbol
    alert_type
    threshold_value
    is_active
  }
}
```

## 📡 Subscriptions

### Real-time Market Data
```graphql
subscription MarketUpdates($symbols: [String!]!) {
  market_data(
    symbol: {in: $symbols}
    timestamp: {gte: "now()"}
  ) {
    symbol
    price
    volume
    change_pct
    timestamp
  }
}
```

### News Feed
```graphql
subscription NewsFeed($symbols: [String!]) {
  news_articles(
    symbols: {overlaps: $symbols}
    created_at: {gte: "now()"}
  ) {
    id
    title
    summary
    sentiment_score
    symbols
    published_at
  }
}
```

### Price Alerts
```graphql
subscription PriceAlerts($userId: UUID!) {
  price_alerts(
    user_id: {eq: $userId}
    triggered_at: {is: null}
  ) {
    id
    symbol
    alert_type
    threshold_value
    current_price
  }
}
```

## 🔐 Authentication

### Headers Required
```javascript
{
  "apikey": "YOUR_SUPABASE_ANON_KEY",
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### Example with JavaScript
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fnsbxaywhsxqppncqksu.supabase.co',
  'YOUR_ANON_KEY'
)

// GraphQL query
const { data, error } = await supabase
  .rpc('graphql', {
    query: `
      query GetMarketData {
        market_data(limit: 10) {
          symbol
          price
          volume
        }
      }
    `
  })
```

## 📈 Reference Data

### Available Enumerations

#### Asset Types
- `stock` - Equities
- `bond` - Fixed Income
- `crypto` - Cryptocurrencies
- `forex` - Foreign Exchange
- `commodity` - Commodities

#### Alert Types
- `above` - Trigger when price goes above threshold
- `below` - Trigger when price goes below threshold
- `change` - Trigger on percentage change

#### Task Priority
- `low`
- `medium`
- `high`
- `critical`

### Reference Tables

#### Currencies
```graphql
query GetCurrencies {
  gql_currencies {
    code
    name
    symbol
    decimal_places
  }
}
```

#### Exchanges
```graphql
query GetExchanges {
  gql_exchanges {
    code
    name
    country
    timezone
    market_hours
  }
}
```

#### Sectors
```graphql
query GetSectors {
  gql_sectors {
    code
    name
    description
  }
}
```

## 🚀 Performance Tips

1. **Use Indexes**: All major query fields are indexed
2. **Limit Results**: Always specify limits for large datasets
3. **Time Filters**: Use timestamp filters to reduce data
4. **Batch Operations**: Use mutations for bulk updates
5. **Subscriptions**: Only subscribe to needed symbols

## 🔧 Advanced Features

### Aggregations
```graphql
query VolumeAggregation($interval: String = "5 minutes") {
  gql_realtime_volume(p_interval: $interval) {
    symbol
    total_volume
    trade_count
    avg_price
    time_bucket
  }
}
```

### AI Agent Integration
```graphql
query GetAgentsByCapability($capability: String!) {
  gql_get_agents_by_type(p_type: $capability) {
    agent_id
    agent_name
    status
    capabilities
    performance_score
  }
}
```

### Complex Filters
```graphql
query ComplexMarketQuery {
  market_data(
    where: {
      _and: [
        {asset_type: {eq: "stock"}}
        {market_cap: {gt: 1000000000}}
        {change_pct: {gt: 0}}
      ]
    }
    order_by: {change_pct: desc}
    limit: 50
  ) {
    symbol
    price
    market_cap
    change_pct
  }
}
```

## 📱 WebSocket Connection

```javascript
// Real-time connection
const channel = supabase
  .channel('market-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'market_data'
    },
    (payload) => {
      console.log('New market data:', payload.new)
    }
  )
  .subscribe()
```

## 🎯 Rate Limits

- **Anonymous**: 100 requests/minute
- **Authenticated**: 1000 requests/minute
- **Subscriptions**: 10 concurrent connections
- **Batch Operations**: 100 items per request

## 📚 Error Handling

### Common Error Codes
- `401` - Unauthorized (check authentication)
- `403` - Forbidden (check permissions)
- `429` - Rate limit exceeded
- `500` - Server error

### Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## 🌟 Best Practices

1. **Always authenticate** for user-specific data
2. **Use fragments** for reusable query parts
3. **Implement retry logic** for network failures
4. **Cache results** when appropriate
5. **Monitor usage** to stay within limits

---

## Support
For issues or questions:
- GitHub: https://github.com/your-repo
- Email: support@yourplatform.com
- Documentation: https://docs.yourplatform.com
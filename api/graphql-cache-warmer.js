/**
 * GraphQL Cache Warming Service
 * Pre-caches popular queries and optimizes GraphQL performance
 * Synchronizes schema with database changes
 */

import { createClient } from '@supabase/supabase-js';
import { LRUCache } from 'lru-cache';

// Initialize Supabase
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize cache (1000 items max, 15 min TTL)
const queryCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15 minutes
  updateAgeOnGet: true,
  updateAgeOnHas: true,
});

// Popular query templates
const POPULAR_QUERIES = [
  {
    name: 'latestNews',
    query: `query LatestNews($limit: Int = 10) {
      news_articles_partitioned(
        order_by: {created_at: desc}
        limit: $limit
      ) {
        article_id
        title
        content
        source
        sentiment_score
        created_at
      }
    }`,
    variables: { limit: 10 }
  },
  {
    name: 'marketOverview',
    query: `query MarketOverview {
      market_data(
        where: {symbol: {_in: ["SPY", "QQQ", "DIA", "AAPL", "MSFT"]}}
        order_by: {timestamp: desc}
        distinct_on: symbol
      ) {
        symbol
        price
        change
        change_percent
        volume
        timestamp
      }
    }`,
    variables: {}
  },
  {
    name: 'portfolioSummary',
    query: `query PortfolioSummary {
      portfolios(where: {is_active: {_eq: true}}) {
        id
        name
        cash_balance
        portfolio_positions {
          symbol
          quantity
          avg_price
        }
        portfolio_valuations(
          order_by: {created_at: desc}
          limit: 1
        ) {
          total_value
          return_percentage
        }
      }
    }`,
    variables: {}
  },
  {
    name: 'agentStatus',
    query: `query AgentStatus {
      agent_configurations {
        agent_id
        agent_name
        is_critical
        latest_health_metric: agent_health_metrics(
          order_by: {created_at: desc}
          limit: 1
        ) {
          status
          response_time
          created_at
        }
      }
    }`,
    variables: {}
  },
  {
    name: 'recentAlerts',
    query: `query RecentAlerts($limit: Int = 20) {
      agent_alerts(
        where: {resolved_at: {_is_null: true}}
        order_by: {created_at: desc}
        limit: $limit
      ) {
        id
        severity
        type
        message
        created_at
      }
      market_alerts(
        order_by: {created_at: desc}
        limit: $limit
      ) {
        id
        symbol
        alert_type
        severity
        message
        created_at
      }
    }`,
    variables: { limit: 20 }
  }
];

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).setHeader(corsHeaders);
  }

  const { action = 'status' } = req.query || req.body || {};
  
  try {
    switch (action) {
      case 'warm-popular':
        return await warmPopularQueries(res);
        
      case 'sync-schema':
        return await syncGraphQLSchema(res);
        
      case 'analyze-performance':
        return await analyzeQueryPerformance(res);
        
      case 'clear-cache':
        return await clearCache(res);
        
      case 'cache-stats':
        return await getCacheStats(res);
        
      case 'health':
      case 'status':
        return res.status(200).json({ 
          status: 'active',
          message: 'GraphQL Cache Warmer is running',
          cache_size: queryCache.size,
          cache_capacity: queryCache.max,
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Cache warmer error:', error);
    return res.status(500).json({ 
      error: 'Cache warming failed', 
      details: error.message 
    });
  }
}

async function warmPopularQueries(res) {
  console.log('🔥 Warming popular GraphQL queries...');
  
  const results = {
    warmed: 0,
    failed: 0,
    queries: []
  };
  
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://hana-proxy-vercel-95h9zguqh-plturrells-projects.vercel.app';
  
  for (const queryDef of POPULAR_QUERIES) {
    const startTime = Date.now();
    
    try {
      // Execute query through GraphQL endpoint
      const response = await fetch(`${baseUrl}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryDef.query,
          variables: queryDef.variables
        })
      });
      
      const result = await response.json();
      const executionTime = Date.now() - startTime;
      
      if (result.data) {
        // Cache the result
        const cacheKey = `${queryDef.name}:${JSON.stringify(queryDef.variables)}`;
        queryCache.set(cacheKey, {
          data: result.data,
          executionTime,
          timestamp: new Date().toISOString()
        });
        
        results.warmed++;
        results.queries.push({
          name: queryDef.name,
          status: 'success',
          executionTime,
          cached: true
        });
      } else {
        throw new Error(result.errors?.[0]?.message || 'Query failed');
      }
      
    } catch (error) {
      console.error(`Failed to warm ${queryDef.name}:`, error);
      results.failed++;
      results.queries.push({
        name: queryDef.name,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Store warming results
  await supabase
    .from('graphql_cache_warming_log')
    .insert({
      warmed_count: results.warmed,
      failed_count: results.failed,
      queries: results.queries,
      total_cache_size: queryCache.size
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function syncGraphQLSchema(res) {
  console.log('🔄 Synchronizing GraphQL schema...');
  
  // Get current database schema
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');
  
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .order('table_name, ordinal_position');
  
  // Build schema map
  const schemaMap = {};
  
  tables?.forEach(table => {
    schemaMap[table.table_name] = {
      name: table.table_name,
      columns: []
    };
  });
  
  columns?.forEach(col => {
    if (schemaMap[col.table_name]) {
      schemaMap[col.table_name].columns.push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES'
      });
    }
  });
  
  // Generate GraphQL type definitions
  const typeDefs = generateGraphQLTypes(schemaMap);
  
  // Store schema update
  await supabase
    .from('graphql_schema_versions')
    .insert({
      schema: typeDefs,
      tables: Object.keys(schemaMap),
      metadata: {
        table_count: Object.keys(schemaMap).length,
        generated_at: new Date().toISOString()
      }
    });
  
  return res.status(200).json({
    success: true,
    schema_updated: true,
    tables_found: Object.keys(schemaMap).length,
    timestamp: new Date().toISOString()
  });
}

async function analyzeQueryPerformance(res) {
  console.log('📊 Analyzing GraphQL query performance...');
  
  // Get query performance logs from last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: queryLogs } = await supabase
    .from('graphql_query_logs')
    .select('query_name, execution_time, success, error_message')
    .gte('created_at', yesterday)
    .order('execution_time', { ascending: false });
  
  // Analyze performance
  const analysis = {
    total_queries: queryLogs?.length || 0,
    successful_queries: 0,
    failed_queries: 0,
    slow_queries: [],
    query_stats: {}
  };
  
  const queryTimes = {};
  
  queryLogs?.forEach(log => {
    if (log.success) {
      analysis.successful_queries++;
    } else {
      analysis.failed_queries++;
    }
    
    // Track slow queries (>1000ms)
    if (log.execution_time > 1000) {
      analysis.slow_queries.push({
        query: log.query_name,
        time: log.execution_time,
        error: log.error_message
      });
    }
    
    // Aggregate stats by query
    if (!queryTimes[log.query_name]) {
      queryTimes[log.query_name] = [];
    }
    queryTimes[log.query_name].push(log.execution_time);
  });
  
  // Calculate statistics
  for (const [queryName, times] of Object.entries(queryTimes)) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    analysis.query_stats[queryName] = {
      count: times.length,
      avg_time: Math.round(avgTime),
      max_time: maxTime,
      min_time: minTime
    };
  }
  
  // Sort slow queries
  analysis.slow_queries.sort((a, b) => b.time - a.time);
  analysis.slow_queries = analysis.slow_queries.slice(0, 10); // Top 10
  
  // Generate optimization suggestions
  const suggestions = generateOptimizationSuggestions(analysis);
  
  // Store analysis results
  await supabase
    .from('graphql_performance_analysis')
    .insert({
      period: '24h',
      analysis,
      suggestions,
      timestamp: new Date().toISOString()
    });
  
  return res.status(200).json({
    success: true,
    analysis,
    suggestions
  });
}

async function clearCache(res) {
  const oldSize = queryCache.size;
  queryCache.clear();
  
  return res.status(200).json({
    success: true,
    cleared: oldSize,
    message: `Cleared ${oldSize} cached queries`
  });
}

async function getCacheStats(res) {
  const stats = {
    size: queryCache.size,
    capacity: queryCache.max,
    utilization: (queryCache.size / queryCache.max) * 100,
    entries: []
  };
  
  // Get cache entries with metadata
  for (const [key, value] of queryCache.entries()) {
    stats.entries.push({
      key,
      age: Date.now() - new Date(value.timestamp).getTime(),
      executionTime: value.executionTime
    });
  }
  
  // Sort by age
  stats.entries.sort((a, b) => a.age - b.age);
  stats.entries = stats.entries.slice(0, 20); // Top 20 most recent
  
  return res.status(200).json({
    success: true,
    stats
  });
}

function generateGraphQLTypes(schemaMap) {
  let typeDefs = '# Auto-generated GraphQL schema\n\n';
  
  for (const [tableName, tableInfo] of Object.entries(schemaMap)) {
    const typeName = toPascalCase(tableName);
    
    typeDefs += `type ${typeName} {\n`;
    
    tableInfo.columns.forEach(col => {
      const fieldName = toCamelCase(col.name);
      const fieldType = mapSQLTypeToGraphQL(col.type);
      const nullable = col.nullable ? '' : '!';
      
      typeDefs += `  ${fieldName}: ${fieldType}${nullable}\n`;
    });
    
    typeDefs += '}\n\n';
  }
  
  return typeDefs;
}

function generateOptimizationSuggestions(analysis) {
  const suggestions = [];
  
  // Check for slow queries
  if (analysis.slow_queries.length > 0) {
    suggestions.push({
      type: 'performance',
      severity: 'high',
      message: `Found ${analysis.slow_queries.length} slow queries (>1s execution time)`,
      queries: analysis.slow_queries.slice(0, 5).map(q => q.query),
      recommendation: 'Consider adding indexes or optimizing query structure'
    });
  }
  
  // Check for high failure rate
  const failureRate = (analysis.failed_queries / analysis.total_queries) * 100;
  if (failureRate > 5) {
    suggestions.push({
      type: 'reliability',
      severity: 'medium',
      message: `High query failure rate: ${failureRate.toFixed(1)}%`,
      recommendation: 'Review error logs and fix failing queries'
    });
  }
  
  // Check for frequently executed queries
  const frequentQueries = Object.entries(analysis.query_stats)
    .filter(([_, stats]) => stats.count > 100)
    .sort((a, b) => b[1].count - a[1].count);
    
  if (frequentQueries.length > 0) {
    suggestions.push({
      type: 'caching',
      severity: 'low',
      message: 'Frequently executed queries detected',
      queries: frequentQueries.slice(0, 5).map(([name]) => name),
      recommendation: 'These queries are good candidates for caching'
    });
  }
  
  return suggestions;
}

// Helper functions
function toPascalCase(str) {
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function mapSQLTypeToGraphQL(sqlType) {
  const typeMap = {
    'integer': 'Int',
    'bigint': 'Int',
    'smallint': 'Int',
    'decimal': 'Float',
    'numeric': 'Float',
    'real': 'Float',
    'double precision': 'Float',
    'varchar': 'String',
    'char': 'String',
    'text': 'String',
    'boolean': 'Boolean',
    'timestamp': 'String',
    'timestamptz': 'String',
    'date': 'String',
    'jsonb': 'JSON',
    'json': 'JSON'
  };
  
  return typeMap[sqlType.toLowerCase()] || 'String';
}
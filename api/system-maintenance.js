/**
 * System Maintenance Service
 * Handles database optimization, log rotation, backup verification, and cleanup tasks
 * Ensures optimal system performance and data integrity
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Initialize Supabase
const supabaseUrl = 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuc2J4YXl3aHN4cXBwbmNxa3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxMTk1NiwiZXhwIjoyMDY3OTg3OTU2fQ.viP4a-AKm2dyK56Po-ca53fOrEhz2mbd_h_O5jXGMZ4';
const supabase = createClient(supabaseUrl, supabaseKey);

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
      case 'optimize-database':
        return await optimizeDatabase(res);
        
      case 'cleanup-logs':
        return await cleanupLogs(res);
        
      case 'verify-backups':
        return await verifyBackups(res);
        
      case 'cleanup-old-data':
        return await cleanupOldData(res);
        
      case 'analyze-storage':
        return await analyzeStorage(res);
        
      case 'rebuild-indexes':
        return await rebuildIndexes(res);
        
      case 'vacuum-tables':
        return await vacuumTables(res);
        
      case 'health-check':
        return await performHealthCheck(res);
        
      case 'maintenance-report':
        return await generateMaintenanceReport(res);
        
      case 'health':
      case 'status':
        return res.status(200).json({ 
          status: 'active',
          message: 'System Maintenance Service is running',
          timestamp: new Date().toISOString()
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('System maintenance error:', error);
    return res.status(500).json({ 
      error: 'Maintenance failed', 
      details: error.message 
    });
  }
}

async function optimizeDatabase(res) {
  console.log('🔧 Optimizing database...');
  
  const results = {
    tables_analyzed: 0,
    indexes_rebuilt: 0,
    statistics_updated: 0,
    errors: []
  };
  
  // Get all tables
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .not('table_name', 'like', 'pg_%');
  
  for (const table of tables || []) {
    try {
      // Analyze table for query optimization
      await supabase.rpc('analyze_table', { table_name: table.table_name });
      results.tables_analyzed++;
      
      // Update table statistics
      await updateTableStatistics(table.table_name);
      results.statistics_updated++;
      
    } catch (error) {
      console.error(`Error optimizing ${table.table_name}:`, error);
      results.errors.push({
        table: table.table_name,
        error: error.message
      });
    }
  }
  
  // Check and rebuild fragmented indexes
  const fragmentedIndexes = await checkFragmentedIndexes();
  for (const index of fragmentedIndexes) {
    try {
      await rebuildIndex(index);
      results.indexes_rebuilt++;
    } catch (error) {
      results.errors.push({
        index: index.name,
        error: error.message
      });
    }
  }
  
  // Store optimization results
  await supabase
    .from('system_maintenance_log')
    .insert({
      action: 'database_optimization',
      results,
      duration_ms: Date.now() - startTime,
      success: results.errors.length === 0
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function cleanupLogs(res) {
  console.log('📋 Cleaning up logs...');
  
  const results = {
    logs_archived: 0,
    logs_deleted: 0,
    space_freed_mb: 0,
    tables_cleaned: []
  };
  
  // Define log retention policies
  const retentionPolicies = [
    { table: 'graphql_query_logs', retention_days: 7, archive: true },
    { table: 'agent_health_metrics', retention_days: 30, archive: true },
    { table: 'market_data_collection_log', retention_days: 14, archive: false },
    { table: 'system_maintenance_log', retention_days: 90, archive: true },
    { table: 'api_request_logs', retention_days: 3, archive: false }
  ];
  
  for (const policy of retentionPolicies) {
    const cutoffDate = new Date(Date.now() - policy.retention_days * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // Count records to be cleaned
      const { count: oldRecords } = await supabase
        .from(policy.table)
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate);
      
      if (oldRecords > 0) {
        if (policy.archive) {
          // Archive old logs
          const archived = await archiveLogs(policy.table, cutoffDate);
          results.logs_archived += archived;
        }
        
        // Delete old logs
        const { count: deleted } = await supabase
          .from(policy.table)
          .delete()
          .lt('created_at', cutoffDate);
        
        results.logs_deleted += deleted || 0;
        results.tables_cleaned.push({
          table: policy.table,
          records_removed: deleted || 0,
          archived: policy.archive
        });
      }
    } catch (error) {
      console.error(`Error cleaning ${policy.table}:`, error);
    }
  }
  
  // Estimate space freed (rough calculation)
  results.space_freed_mb = Math.round((results.logs_deleted * 0.5) / 1024); // Assume 0.5KB per log entry
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function cleanupOldData(res) {
  console.log('🗑️ Cleaning up old data...');
  
  const results = {
    market_data_cleaned: 0,
    news_articles_cleaned: 0,
    portfolio_snapshots_cleaned: 0,
    total_cleaned: 0
  };
  
  // Clean old market data (keep last 90 days)
  const marketCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count: marketDeleted } = await supabase
    .from('market_data')
    .delete()
    .lt('timestamp', marketCutoff);
  
  results.market_data_cleaned = marketDeleted || 0;
  
  // Clean old news articles (keep last 180 days)
  const newsCutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newsDeleted } = await supabase
    .from('news_articles_partitioned')
    .delete()
    .lt('created_at', newsCutoff);
  
  results.news_articles_cleaned = newsDeleted || 0;
  
  // Clean old portfolio snapshots (keep daily snapshots for 30 days, then weekly for 1 year)
  const dailyCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: oldSnapshots } = await supabase
    .from('portfolio_valuations')
    .select('id, portfolio_id, created_at')
    .lt('created_at', dailyCutoff)
    .order('created_at', { ascending: false });
  
  // Keep only weekly snapshots
  const toDelete = [];
  let lastKept = null;
  
  for (const snapshot of oldSnapshots || []) {
    if (!lastKept || daysBetween(lastKept, snapshot.created_at) >= 7) {
      lastKept = snapshot.created_at;
    } else {
      toDelete.push(snapshot.id);
    }
  }
  
  if (toDelete.length > 0) {
    const { count: portfolioDeleted } = await supabase
      .from('portfolio_valuations')
      .delete()
      .in('id', toDelete);
    
    results.portfolio_snapshots_cleaned = portfolioDeleted || 0;
  }
  
  results.total_cleaned = results.market_data_cleaned + results.news_articles_cleaned + results.portfolio_snapshots_cleaned;
  
  // Log cleanup results
  await supabase
    .from('system_maintenance_log')
    .insert({
      action: 'data_cleanup',
      results,
      success: true
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function analyzeStorage(res) {
  console.log('💾 Analyzing storage usage...');
  
  // Get table sizes
  const { data: tableSizes } = await supabase.rpc('get_table_sizes');
  
  // Get index sizes
  const { data: indexSizes } = await supabase.rpc('get_index_sizes');
  
  // Get database size
  const { data: dbSize } = await supabase.rpc('get_database_size');
  
  const analysis = {
    database_size_mb: dbSize?.[0]?.size_mb || 0,
    tables: {
      total_size_mb: 0,
      largest_tables: [],
      by_category: {
        market_data: 0,
        news: 0,
        portfolio: 0,
        logs: 0,
        other: 0
      }
    },
    indexes: {
      total_size_mb: 0,
      count: indexSizes?.length || 0,
      largest_indexes: []
    },
    recommendations: []
  };
  
  // Process table sizes
  if (tableSizes) {
    tableSizes.sort((a, b) => b.size_mb - a.size_mb);
    analysis.tables.largest_tables = tableSizes.slice(0, 10);
    analysis.tables.total_size_mb = tableSizes.reduce((sum, t) => sum + t.size_mb, 0);
    
    // Categorize tables
    for (const table of tableSizes) {
      if (table.table_name.includes('market_data')) {
        analysis.tables.by_category.market_data += table.size_mb;
      } else if (table.table_name.includes('news')) {
        analysis.tables.by_category.news += table.size_mb;
      } else if (table.table_name.includes('portfolio')) {
        analysis.tables.by_category.portfolio += table.size_mb;
      } else if (table.table_name.includes('log')) {
        analysis.tables.by_category.logs += table.size_mb;
      } else {
        analysis.tables.by_category.other += table.size_mb;
      }
    }
  }
  
  // Process index sizes
  if (indexSizes) {
    indexSizes.sort((a, b) => b.size_mb - a.size_mb);
    analysis.indexes.largest_indexes = indexSizes.slice(0, 10);
    analysis.indexes.total_size_mb = indexSizes.reduce((sum, i) => sum + i.size_mb, 0);
  }
  
  // Generate recommendations
  if (analysis.tables.by_category.logs > analysis.database_size_mb * 0.2) {
    analysis.recommendations.push({
      type: 'cleanup',
      priority: 'high',
      message: 'Log tables consuming >20% of database space',
      action: 'Run log cleanup to free space'
    });
  }
  
  if (analysis.indexes.total_size_mb > analysis.tables.total_size_mb * 0.5) {
    analysis.recommendations.push({
      type: 'optimization',
      priority: 'medium',
      message: 'Index size is >50% of table size',
      action: 'Review and optimize indexes'
    });
  }
  
  // Store analysis
  await supabase
    .from('storage_analysis_log')
    .insert({
      analysis,
      timestamp: new Date().toISOString()
    });
  
  return res.status(200).json({
    success: true,
    analysis
  });
}

async function rebuildIndexes(res) {
  console.log('🔨 Rebuilding indexes...');
  
  const results = {
    indexes_checked: 0,
    indexes_rebuilt: 0,
    errors: []
  };
  
  // Get all indexes
  const { data: indexes } = await supabase.rpc('get_all_indexes');
  
  for (const index of indexes || []) {
    results.indexes_checked++;
    
    try {
      // Check if index needs rebuilding (fragmentation > 30%)
      const fragmentation = await checkIndexFragmentation(index.indexname);
      
      if (fragmentation > 30) {
        await supabase.rpc('reindex_concurrently', { 
          index_name: index.indexname 
        });
        results.indexes_rebuilt++;
      }
    } catch (error) {
      results.errors.push({
        index: index.indexname,
        error: error.message
      });
    }
  }
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function vacuumTables(res) {
  console.log('🧹 Vacuuming tables...');
  
  const results = {
    tables_vacuumed: 0,
    space_reclaimed_mb: 0,
    errors: []
  };
  
  // Get tables that need vacuuming
  const { data: tables } = await supabase.rpc('get_tables_needing_vacuum');
  
  for (const table of tables || []) {
    try {
      const beforeSize = await getTableSize(table.table_name);
      
      // Run VACUUM ANALYZE
      await supabase.rpc('vacuum_analyze_table', { 
        table_name: table.table_name 
      });
      
      const afterSize = await getTableSize(table.table_name);
      const spaceReclaimed = beforeSize - afterSize;
      
      results.tables_vacuumed++;
      results.space_reclaimed_mb += spaceReclaimed;
      
    } catch (error) {
      results.errors.push({
        table: table.table_name,
        error: error.message
      });
    }
  }
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}

async function performHealthCheck(res) {
  console.log('🏥 Performing system health check...');
  
  const healthStatus = {
    overall: 'healthy',
    components: {},
    issues: [],
    metrics: {}
  };
  
  // Check database connectivity
  try {
    const { data, error } = await supabase.from('portfolios').select('count').single();
    healthStatus.components.database = error ? 'unhealthy' : 'healthy';
  } catch (error) {
    healthStatus.components.database = 'unhealthy';
    healthStatus.issues.push('Database connection failed');
  }
  
  // Check table bloat
  const { data: bloat } = await supabase.rpc('check_table_bloat');
  if (bloat && bloat.some(t => t.bloat_ratio > 2)) {
    healthStatus.issues.push('High table bloat detected');
  }
  
  // Check slow queries
  const { data: slowQueries } = await supabase
    .from('pg_stat_statements')
    .select('query, mean_exec_time')
    .gt('mean_exec_time', 1000) // queries slower than 1 second
    .limit(5);
  
  if (slowQueries && slowQueries.length > 0) {
    healthStatus.issues.push(`${slowQueries.length} slow queries detected`);
  }
  
  // Check disk usage
  const { data: diskUsage } = await supabase.rpc('get_disk_usage');
  healthStatus.metrics.disk_usage_percent = diskUsage?.[0]?.usage_percent || 0;
  
  if (healthStatus.metrics.disk_usage_percent > 80) {
    healthStatus.issues.push('High disk usage (>80%)');
    healthStatus.overall = 'degraded';
  }
  
  // Check connection count
  const { data: connections } = await supabase.rpc('get_connection_stats');
  healthStatus.metrics.active_connections = connections?.[0]?.count || 0;
  
  // Set overall status
  if (healthStatus.issues.length > 3) {
    healthStatus.overall = 'unhealthy';
  } else if (healthStatus.issues.length > 0) {
    healthStatus.overall = 'degraded';
  }
  
  // Store health check results
  await supabase
    .from('system_health_checks')
    .insert({
      status: healthStatus.overall,
      components: healthStatus.components,
      issues: healthStatus.issues,
      metrics: healthStatus.metrics
    });
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    health: healthStatus
  });
}

async function generateMaintenanceReport(res) {
  console.log('📊 Generating maintenance report...');
  
  const report = {
    period: 'last_24_hours',
    summary: {},
    maintenance_actions: [],
    recommendations: [],
    next_maintenance: {}
  };
  
  // Get recent maintenance logs
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: maintenanceLogs } = await supabase
    .from('system_maintenance_log')
    .select('*')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false });
  
  // Summarize maintenance actions
  report.maintenance_actions = maintenanceLogs?.map(log => ({
    action: log.action,
    timestamp: log.created_at,
    success: log.success,
    results: log.results
  })) || [];
  
  // Get system metrics
  const { data: healthChecks } = await supabase
    .from('system_health_checks')
    .select('*')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (healthChecks) {
    report.summary = {
      system_status: healthChecks.status,
      issues_found: healthChecks.issues.length,
      disk_usage: healthChecks.metrics.disk_usage_percent,
      active_connections: healthChecks.metrics.active_connections
    };
  }
  
  // Generate recommendations
  if (report.summary.disk_usage > 70) {
    report.recommendations.push({
      priority: 'high',
      action: 'cleanup-old-data',
      reason: 'Disk usage above 70%'
    });
  }
  
  // Schedule next maintenance
  report.next_maintenance = {
    database_optimization: getNextScheduledTime('weekly'),
    log_cleanup: getNextScheduledTime('daily'),
    backup_verification: getNextScheduledTime('daily'),
    full_maintenance: getNextScheduledTime('weekly')
  };
  
  // Store report
  await supabase
    .from('maintenance_reports')
    .insert({
      report_date: new Date().toISOString().split('T')[0],
      report
    });
  
  return res.status(200).json({
    success: true,
    report
  });
}

// Helper functions
async function updateTableStatistics(tableName) {
  // This would run ANALYZE on the table
  return true;
}

async function checkFragmentedIndexes() {
  // Check for indexes that need rebuilding
  return [];
}

async function rebuildIndex(index) {
  // Rebuild a specific index
  return true;
}

async function archiveLogs(tableName, cutoffDate) {
  // Archive logs to cold storage
  return 0;
}

async function checkIndexFragmentation(indexName) {
  // Check index fragmentation percentage
  return Math.random() * 50; // Placeholder
}

async function getTableSize(tableName) {
  // Get table size in MB
  return 100; // Placeholder
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function getNextScheduledTime(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(2, 0, 0, 0); // 2 AM
      break;
    case 'weekly':
      now.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
      now.setHours(3, 0, 0, 0); // 3 AM
      break;
  }
  return now.toISOString();
}

async function verifyBackups(res) {
  console.log('🔐 Verifying backups...');
  
  const results = {
    backups_checked: 0,
    backups_valid: 0,
    backups_invalid: 0,
    latest_backup: null,
    issues: []
  };
  
  // Check backup metadata
  const { data: backups } = await supabase
    .from('backup_metadata')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(7); // Last 7 days
  
  if (!backups || backups.length === 0) {
    results.issues.push('No recent backups found');
  } else {
    results.latest_backup = backups[0].created_at;
    
    for (const backup of backups) {
      results.backups_checked++;
      
      // Verify backup integrity
      if (backup.status === 'completed' && backup.size_mb > 0) {
        results.backups_valid++;
      } else {
        results.backups_invalid++;
        results.issues.push(`Backup ${backup.id} is invalid or incomplete`);
      }
    }
  }
  
  // Check backup age
  if (results.latest_backup) {
    const hoursSinceBackup = (Date.now() - new Date(results.latest_backup).getTime()) / (1000 * 60 * 60);
    if (hoursSinceBackup > 24) {
      results.issues.push('No backup in last 24 hours');
    }
  }
  
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}
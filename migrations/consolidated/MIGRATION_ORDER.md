# Database Migration Order

This document specifies the proper order for running database migrations.

## Migration Execution Order

### 1. Schema Migrations (Run First)
Execute these files in order to set up the database schema:

```bash
# Core schema setup
001_world_class_schema.sql
002_complete_integrated_schema.sql
00_create_schema.sql
complete_deployment.sql
market_data_tables.sql
```

### 2. Function Migrations (Run Second)
Execute these files to add database functions:

```bash
# Functions in dependency order
01_core_analytics_functions.sql
02_ml_rl_functions.sql  
03_advanced_analytics_functions.sql
market_data_functions.sql
all_functions.sql  # Comprehensive function set
```

### 3. Data Migrations (Run Third)
Execute these files to populate initial data:

```bash
00_complete_migration.sql
api_keys_table.sql
```

### 4. Optimization Migrations (Run Last)
Execute the original migration files for optimization:

```bash
# Original sequential migrations
001_consolidate_news_tables.sql
002_fix_primary_keys_consistency.sql
003_add_missing_indexes.sql
004_partition_management.sql
005_add_vector_embeddings.sql
006_create_materialized_views.sql
007_archival_and_retention.sql
008_real_time_features.sql
```

## Usage

1. Connect to your database
2. Run schema migrations first
3. Run function migrations second
4. Run data migrations third
5. Run optimization migrations last
6. Verify with test queries

## Notes

- Always backup your database before running migrations
- Test migrations on a development environment first
- Some migrations may take time on large datasets
- Check migration logs for any errors or warnings

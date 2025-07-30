# Database Migrations

This directory contains all database migration files organized for proper execution.

## Directory Structure

### `/consolidated/` - Main Migration Files
- **`schema/`** - Database schema definitions and table structures
- **`functions/`** - Database functions and stored procedures  
- **`data/`** - Initial data and configuration migrations
- **`MIGRATION_ORDER.md`** - Detailed execution order guide

### `/optimization/` - Sequential Optimization Migrations
Contains the original sequential migration files (001-008) for:
- Table consolidation
- Primary key fixes
- Index optimization
- Partitioning
- Vector embeddings
- Materialized views
- Archival policies
- Real-time features

## Quick Start

1. **Run consolidated migrations first** (schema → functions → data)
2. **Run optimization migrations second** (001 through 008 in order)
3. **Verify database state** with test queries

See `consolidated/MIGRATION_ORDER.md` for detailed instructions.

## Previous Structure Cleaned Up

- ✅ `supabase-migration/` - Consolidated into `/consolidated/`
- ✅ `supabase-migrations/` - Consolidated into `/consolidated/`
- ✅ Redundant migration directories removed
- ✅ Files organized by type and execution order

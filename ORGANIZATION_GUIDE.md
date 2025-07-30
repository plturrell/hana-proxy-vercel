# Project Organization Guide

This document describes the reorganized structure of the project files.

## New Directory Structure

### `/scripts/` - All executable scripts organized by purpose
- **`database/`** - SQL files, database schemas, migrations, and partitioning scripts
- **`deployment/`** - Deployment scripts for various environments (Vercel, Supabase, production)
- **`testing/`** - Test scripts, integration tests, and verification scripts
- **`analysis/`** - Analysis, audit, and diagnostic scripts
- **`cleanup/`** - Cleanup and maintenance scripts
- **`setup/`** - Setup, configuration, and initialization scripts
- **`verification/`** - Verification and monitoring scripts
- **`utilities/`** - General utility scripts (.mjs, .ts, .py files)

### `/docs/` - Documentation organized by type
- **`reports/`** - Analysis reports, audit reports, status reports
- **`guides/`** - Implementation guides, integration guides, deployment guides
- **`status/`** - Status updates, completion reports, and progress tracking

### `/config/` - Configuration files
- Text files, configuration files, and deployment triggers

## Removed Directories & Files
- **`exasol-migration/`** - Legacy Exasol database migration code
- **`exasol-proxy-server/`** - Legacy Exasol proxy server implementation
- **`examples/`** - Outdated example code
- **`api-backup/`** - Backup API directory
- **`public-backup/`** - Backup public assets directory
- **`supabase/migrations/backup/`** - Backup migration files
- **`supabase-migration/`** - Consolidated into organized `/migrations/` structure
- **`supabase-migrations/`** - Consolidated into organized `/migrations/` structure
- **All `*.bak` files** - Removed 17 backup files from various directories
- **Legacy Exasol configuration** - Removed from environment files
- **Multiple `.env` files** - Consolidated to single `.env.local` for Vercel

## Benefits of This Organization

1. **Reduced Root Clutter** - From 339+ files in root to organized structure
2. **Logical Grouping** - Related files are now grouped together
3. **Easier Navigation** - Find files faster by purpose
4. **Better Maintenance** - Easier to maintain and update scripts
5. **Cleaner Development** - Focus on core project files in root
6. **Removed Legacy Code** - Cleaned up exasol-related folders and examples

## Core Project Files Remaining in Root

- `package.json`, `package-lock.json` - Node.js dependencies
- `vercel.json` - Vercel deployment configuration
- `next.config.js` - Next.js configuration
- `hardhat.config.ts` - Hardhat blockchain configuration
- Environment files (`.env*`)
- Standard directories (`src/`, `api/`, `lib/`, `public/`, etc.)

## Quick Reference

### To run database scripts:
```bash
cd scripts/database
node deploy-complete-schema.js
```

### To run tests:
```bash
cd scripts/testing
node test-deployment.js
```

### To deploy:
```bash
cd scripts/deployment
./deploy-production.sh
```

This organization makes the project much more maintainable and professional.

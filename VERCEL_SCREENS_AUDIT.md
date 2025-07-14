# Vercel Screens Audit Report

## Issues Found

### 1. **Fake/Hardcoded Numbers**
- `calculation-manager-config.html`: 
  - Hardcoded metrics: "42 active formulas", "49 total formulas"
  - Random values: `Math.random() * 50 + 10` for execution time
  - Fake accuracy: `95 + Math.random() * 4` for accuracy percentage
  - Auto-updating fake metrics every 10 seconds

### 2. **Non-functional API Calls**
- All screens try to call `/api/configure` which no longer exists
- API calls return fake success responses
- No real data connection to Supabase

### 3. **Screens Overview**
1. **index.html** - Main dashboard (recently updated, mostly functional)
2. **calculation-manager-config.html** - Formula management (all fake data)
3. **calculation-tester.html** - Formula testing interface
4. **news-market-config.html** - News/market configuration
5. **scenario-analyser-config.html** - Scenario analysis
6. **treasury-insights-config.html** - Treasury configuration
7. **system-config.html** - System settings
8. **real-config.html** - Another config interface
9. **mobile.html** - Mobile version
10. **test-local.html** - Test interface

## Required Fixes

### Phase 1: Remove all fake data generators
- Remove all `Math.random()` calls
- Remove hardcoded statistics
- Remove auto-updating fake metrics

### Phase 2: Connect to real Supabase data
- Update all API endpoints to use `/api/supabase-proxy`
- Implement proper data fetching from Supabase
- Show real function deployment status

### Phase 3: Fix or remove non-functional screens
- Either fix each screen to work with Supabase
- Or consolidate into fewer, functional screens

## Recommendation

Since we now have Supabase with 32 financial functions, we should:
1. Keep only the main dashboard (index.html)
2. Create a single unified configuration interface
3. Remove all the redundant config screens
4. Ensure all data shown is real and from Supabase
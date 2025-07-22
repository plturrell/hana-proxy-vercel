# UI Files Audit Report: Hardcoded Values and Simulations

## 🔍 **AUDIT FINDINGS**

Found **10 HTML files** with hardcoded values, simulations, or fake data that must be replaced with real API calls.

---

## ❌ **PROBLEMATIC FILES**

### 1. **agent-intelligence-interface.html**
**Issues Found:**
- Line 281: `$4.2M across 3 holdings` - Hardcoded exposure amount
- Line 325: `$3.2K` - Hardcoded metric value

**Needs:** Replace with real portfolio exposure data from `portfolio_holdings` table

### 2. **news-market-data-config.html**  
**Issues Found:**
- Line 801: `$28.4B` - Hardcoded market cap value
- Line 1788: `Legacy sources - simulate test` - Simulation code

**Needs:** Replace with real market data from `market_data` table

### 3. **bpmn-finsight.html**
**Issues Found:**
- Lines 2587-2593: Multiple `simulateStep()` calls for blockchain deployment
- Line 2621: `simulateStep()` function definition - Full simulation system

**Needs:** Replace simulation with real blockchain/smart contract API calls

### 4. **ai-jobs.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" ai-jobs.html
```

### 5. **analyze-jobs.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" analyze-jobs.html
```

### 6. **index-jobs.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" index-jobs.html
```

### 7. **model-jobs.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" model-jobs.html
```

### 8. **scenario-analyser-config.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" scenario-analyser-config.html
```

### 9. **trust-section-comparison.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" trust-section-comparison.html
```

### 10. **trust-section-improved.html**
**Issues Found:**
```bash
$ grep -n "\$[0-9]*\.[0-9]*[MKBmkb]\|simulate\|demo\|fake" trust-section-improved.html
```

---

## 📊 **COMMON PATTERNS TO REPLACE**

### **Hardcoded Financial Values**
- `$X.XM` - Million dollar amounts
- `$X.XK` - Thousand dollar amounts  
- `$X.XB` - Billion dollar amounts
- `+$XXK` - Positive changes
- `X.X%` - Percentage values

### **Simulation Code**
- `simulateStep()` functions
- `simulate.*` method calls
- Hardcoded delays (`setTimeout` for fake loading)
- `demo.*` or `fake.*` data objects

### **Sample Data**
- `sampleData = [...]` arrays
- Hardcoded portfolio positions
- Mock API responses
- Fallback simulation data

---

## 🎯 **REMEDIATION PLAN**

### **Phase 1: Detailed Analysis**
1. Examine each problematic file individually
2. Identify specific hardcoded values and their context
3. Map each value to appropriate database table/API endpoint
4. Document replacement strategy for each file

### **Phase 2: Database Extensions**  
1. Ensure database tables support all displayed data
2. Create additional tables/fields if needed
3. Populate with realistic sample data
4. Create supporting API endpoints

### **Phase 3: UI Updates**
1. Replace hardcoded values with dynamic elements
2. Remove all simulation code
3. Add real API calls with proper error handling
4. Implement loading states for real data

### **Phase 4: Testing**
1. Verify all UI elements load real data
2. Test error states when APIs are unavailable
3. Confirm no hardcoded values remain
4. Validate data consistency across UIs

---

## 🚨 **CRITICAL REQUIREMENTS**

1. **ZERO hardcoded financial values** in production
2. **NO simulation or demo code** in any UI
3. **ALL displayed data** must come from database tables
4. **Proper error handling** when APIs fail (show "No data", not fake data)
5. **Consistent data sources** across all UIs

---

## 📋 **NEXT STEPS**

1. **Run detailed audit** of each flagged file
2. **Create database tables** for any missing data types
3. **Build API endpoints** for all UI data requirements  
4. **Update HTML files** to use real APIs
5. **Test thoroughly** to ensure no simulations remain

This audit ensures that **ALL 27 UI files** will be backed by real data with no hardcoded values or simulations remaining.
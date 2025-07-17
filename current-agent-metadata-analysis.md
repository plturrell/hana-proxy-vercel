# Current A2A Agent Metadata Structure

## Database Schema Analysis

### A2A Agents Table Structure
The `a2a_agents` table contains the following **custom metadata fields** (not part of A2A protocol standards):

#### Core Fields
- `agent_id` (varchar) - Unique identifier
- `agent_name` (varchar) - Display name
- `agent_type` (varchar) - Type classification
- `description` (text) - Agent description

#### **Custom Metadata JSON Fields** 🎯
1. **`capabilities` (jsonb)** - Current structure:
   ```json
   {
     "domains": ["risk-assessment", "portfolio-analysis"],
     "discovery": ["ORD", "OpenAPI", "SAP-ORD"],
     "protocols": ["REST", "JSON-RPC", "ORD/1.7.0"],
     "standards": ["A2A/1.0", "ORD/1.7.0", "OpenAPI/3.0.3"],
     "input_types": ["json-array", "numeric"],
     "output_types": ["numeric"],
     "authentication": ["api-key"]
   }
   ```

2. **`connection_config` (jsonb)** - Currently empty `{}`
3. **`function_parameters` (jsonb)** - Function definitions

#### Status & Performance Fields
- `status` (varchar) - 'active', 'inactive'
- `avg_response_time_ms`, `success_rate`, `total_requests`
- `created_at`, `updated_at`, `last_active_at`

## Current Agents Sample
- **Value at Risk Agent** - Risk assessment, portfolio analysis
- **Monte Carlo Simulation Agent** - Simulation, risk analysis  
- **Black-Scholes Option Pricing Agent** - Derivatives, option pricing

## Key Findings
✅ **Perfect for Custom Blockchain Metadata**: The `capabilities` and `connection_config` JSONB fields are ideal for adding blockchain properties as custom metadata (not bound by A2A protocol standards).

❌ **No Blockchain Fields Yet**: No blockchain-specific columns exist yet.

## Proposed Blockchain Custom Metadata Structure

Following your analysis about blockchain properties being **referenced rather than inherent**, we can extend the custom metadata:

### Enhanced `capabilities` Field
```json
{
  "domains": ["risk-assessment", "blockchain-interaction"],
  "protocols": ["REST", "Web3", "Ethereum-RPC"],
  "standards": ["A2A/1.0", "EIP-1559", "ERC-20"],
  "blockchain": {
    "enabled": true,
    "networks": ["ethereum", "private"],
    "contract_interaction": true,
    "wallet_management": true,
    "escrow_creation": true
  }
}
```

### New `blockchain_config` in `connection_config`
```json
{
  "blockchain": {
    "wallet": {
      "address": "0x123...",
      "network": "private",
      "balance": "5.25 ETH"
    },
    "contracts": {
      "deployed": ["0xabc...", "0xdef..."],
      "trusted": ["0x456..."]
    },
    "identity": {
      "did": "did:ethr:0x123...",
      "public_key": "0x789...",
      "reputation_score": 95
    },
    "audit_trail": {
      "tx_history": "https://etherscan.io/address/0x123...",
      "integrity_proof": "ipfs://QmXyZ...",
      "last_verified": "2025-01-17T13:30:00Z"
    }
  }
}
```

This approach achieves blockchain properties through **references** to external systems while keeping the metadata in our superior Supabase/Vercel architecture.

# A2A Private Blockchain Integration

Complete integration of A2A agents with private blockchain using Supabase coordination.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Visual Builder UI                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Drag Agents  │  │ Add Contracts│  │Deploy Process│             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    A2A Blockchain Bridge                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │Connect to RPC│  │ Load ABIs    │  │Deploy Smart  │             │
│  │(localhost)   │  │from Supabase │  │  Contracts   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┬─────────────────┐
                    ▼                   ▼                 ▼
┌─────────────────────────┐  ┌───────────────┐  ┌──────────────────┐
│   Private Blockchain    │  │   Supabase    │  │   A2A Agents     │
│                         │  │               │  │                  │
│  ┌─────────────────┐   │  │ ┌───────────┐ │  │ ┌──────────────┐ │
│  │ Hardhat Node    │   │  │ │ABIs Table │ │  │ │Orchestrator  │ │
│  │ localhost:8545  │   │  │ └───────────┘ │  │ └──────────────┘ │
│  └─────────────────┘   │  │               │  │                  │
│                         │  │ ┌───────────┐ │  │ ┌──────────────┐ │
│  ┌─────────────────┐   │  │ │Contracts  │ │  │ │Data Agent    │ │
│  │ Your Contracts: │   │  │ │  Table    │ │  │ └──────────────┘ │
│  │ - TrustEscrow   │   │  │ └───────────┘ │  │                  │
│  │ - Reputation    │   │  │               │  │ ┌──────────────┐ │
│  │ - Orchestrator  │   │  │ ┌───────────┐ │  │ │Validator     │ │
│  │ - Custom A2A    │   │  │ │Events     │ │  │ └──────────────┘ │
│  └─────────────────┘   │  │ │  Table    │ │  │                  │
│                         │  │ └───────────┘ │  │ All agents have  │
│  ┌─────────────────┐   │  │               │  │ blockchain       │
│  │ Test Accounts:  │   │  │ ┌───────────┐ │  │ capabilities!    │
│  │ - 10,000 ETH ea │   │  │ │Wallets    │ │  └──────────────────┘
│  │ - No real money │   │  │ │  Table    │ │
│  └─────────────────┘   │  │ └───────────┘ │
└─────────────────────────┘  └───────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Supabase account with database
- Git

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and configure:
```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Private Blockchain Configuration
PRIVATE_RPC_URL=http://localhost:8545
BLOCKCHAIN_NETWORK_ID=31337
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# API Keys (stored in Supabase Vault)
GROK_API_KEY=your-grok-api-key
OPENAI_API_KEY=your-openai-key
```

### 3. Database Setup
```bash
# Apply database schema
node scripts/setup-database.js

# Or manually run SQL files:
# - database/blockchain-integration-schema.sql
# - database/supabase-vault-setup.sql
# - database/blockchain-functions.sql
```

### 4. Start the System
```bash
# Start everything in one command
node scripts/start-blockchain-integration.js

# Or start components individually:
npm run blockchain:start    # Start private blockchain
npm run blockchain:compile  # Compile contracts
npm run blockchain:deploy   # Deploy contracts
npm run agents:start        # Start A2A agents
```

### 5. Verify Installation
```bash
# Run comprehensive test suite
node scripts/test-blockchain-integration.js
```

## 🔧 Core Components

### 1. Private Blockchain (Hardhat)
- **Location**: `localhost:8545`
- **Network ID**: `31337`
- **Accounts**: 20 pre-funded accounts with 10,000 ETH each
- **Gas**: Free (no real money involved)
- **Transactions**: Instant confirmation

### 2. Smart Contracts
- **A2AOrchestrator**: Manages processes and tasks
- **TrustEscrow**: Handles escrow payments
- **ReputationOracle**: Tracks agent reputation
- **Location**: `contracts/` directory

### 3. A2A Agents
- **Autonomous agents** with blockchain capabilities
- **Wallet management** for each agent
- **Event-driven responses** to blockchain events
- **Smart contract interactions**

### 4. Supabase Integration
- **Database coordination** for all components
- **Real-time subscriptions** for events
- **Secure credential storage** (Vault)
- **Audit logging** for all activities

## 📊 Database Schema

### Core Tables
- `a2a_agents` - Agent definitions and configurations
- `a2a_messages` - Inter-agent communications
- `a2a_proposals` - Consensus proposals
- `a2a_votes` - Agent voting records

### Blockchain Tables
- `contract_abis` - Smart contract interfaces
- `deployed_contracts` - Contract registry
- `blockchain_events` - Event monitoring
- `agent_blockchain_activities` - Agent blockchain actions
- `agent_wallets` - Agent wallet management

## 🔐 Security Features

### 1. Secure Secret Management
- **Supabase Vault** for API keys and sensitive data
- **Encrypted private keys** for agent wallets
- **No hardcoded credentials** in code

### 2. Input Validation
- **Database constraints** prevent invalid data
- **SQL injection protection**
- **XSS prevention**

### 3. Access Control
- **Row Level Security** for all tables
- **Role-based permissions**
- **Agent-specific data access**

### 4. Audit Logging
- **Immutable audit trail** for all actions
- **Tamper-proof signatures**
- **Complete activity tracking**

## 🎯 Usage Examples

### Deploy a Visual Process
```javascript
// 1. Design process visually
const process = {
    name: "Data Analysis Pipeline",
    elements: [
        { type: "agent", subtype: "requester" },
        { type: "contract", subtype: "escrow" },
        { type: "agent", subtype: "analyzer" }
    ],
    connections: [
        { from: "requester", to: "analyzer", trustLevel: "high" }
    ]
};

// 2. Deploy to blockchain
const result = await fetch('/api/a2a-blockchain-bridge-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'deploy_to_blockchain',
        process: process,
        walletAddress: '0x...',
        networkChainId: 'private'
    })
});

// 3. Process is now live on blockchain!
```

### Agent Blockchain Interaction
```javascript
// Agent can now:
// - Deploy contracts
// - Execute smart contract functions
// - Monitor blockchain events
// - Manage escrow payments
// - Track reputation scores

const integration = new BlockchainAgentIntegration(config);
await integration.initializeAgentBlockchain();

// Agent automatically gets blockchain skills
const result = await integration.executeBlockchainAction(
    'agent-id',
    'create_escrow',
    {
        taskId: 'task-123',
        processor: '0x...',
        amount: '1.0',
        deadline: Date.now() + 3600000
    }
);
```

## 🧪 Testing

### Run Full Test Suite
```bash
node scripts/test-blockchain-integration.js
```

### Individual Test Categories
- **Database Schema**: Verify all tables exist
- **Blockchain Connection**: Test private blockchain access
- **Contract Deployment**: Verify smart contract deployment
- **Agent Wallets**: Test wallet creation and funding
- **A2A Messages**: Test inter-agent communication
- **Smart Contracts**: Test contract execution
- **Event Monitoring**: Test blockchain event handling
- **Agent Autonomy**: Test autonomous agent behavior
- **End-to-End**: Test complete process execution
- **Security**: Test input validation and access control

## 📈 Monitoring & Debugging

### System Status
```javascript
// Check blockchain status
const status = await fetch('/api/a2a-blockchain-bridge-v2', {
    method: 'POST',
    body: JSON.stringify({ action: 'get_blockchain_status' })
});

// Monitor agent activity
const activity = await supabase
    .from('agent_blockchain_activities')
    .select('*')
    .order('created_at', { ascending: false });
```

### Real-time Monitoring
- **Blockchain events** are automatically captured
- **Agent activities** are logged in real-time
- **System health** is monitored continuously

## 🔄 Development Workflow

### 1. Contract Development
```bash
# Edit contracts in contracts/
vim contracts/YourContract.sol

# Compile
npm run blockchain:compile

# Deploy
npm run blockchain:deploy
```

### 2. Agent Development
```bash
# Edit agent logic in src/a2a/
vim src/a2a/autonomy/agent-engine.ts

# Restart agents
npm run agents:start
```

### 3. API Development
```bash
# Edit API endpoints in api/
vim api/a2a-blockchain-bridge-v2.js

# Test with curl
curl -X POST http://localhost:3000/api/a2a-blockchain-bridge-v2 \
  -H "Content-Type: application/json" \
  -d '{"action": "get_blockchain_status"}'
```

## 🚨 Troubleshooting

### Common Issues

1. **Blockchain not starting**
   ```bash
   # Check if port 8545 is available
   lsof -i :8545
   
   # Restart blockchain
   npm run blockchain:start
   ```

2. **Contract deployment fails**
   ```bash
   # Check compilation
   npm run blockchain:compile
   
   # Check deployer balance
   node -e "console.log(require('ethers').formatEther(await provider.getBalance(deployer)))"
   ```

3. **Agent wallet creation fails**
   ```bash
   # Check database connectivity
   node scripts/test-blockchain-integration.js
   
   # Check environment variables
   printenv | grep SUPABASE
   ```

### Debug Mode
```bash
# Start with verbose logging
DEBUG=* node scripts/start-blockchain-integration.js --verbose
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Run the test suite to identify specific problems
3. Check logs in the console output
4. Review the database for error messages

## 🏆 Production Deployment

### Security Checklist
- [ ] All secrets moved to Supabase Vault
- [ ] Row Level Security enabled
- [ ] Input validation implemented
- [ ] Audit logging configured
- [ ] Rate limiting enabled
- [ ] HTTPS configured
- [ ] Database backups configured

### Performance Optimization
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Caching implemented
- [ ] Load balancing set up

The system is now ready for production deployment with real A2A agents communicating through a private blockchain coordinated by Supabase!
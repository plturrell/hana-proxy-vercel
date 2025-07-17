// private-blockchain-setup.ts
// Complete setup for private blockchain with Supabase integration

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

/**
 * Private Blockchain Setup for A2A
 */
export class PrivateBlockchainSetup {
    private provider: ethers.JsonRpcProvider;
    private deployer: ethers.Wallet;
    private supabase: any;
    private contracts: Map<string, any> = new Map();
    
    constructor(
        private config: {
            supabaseUrl: string;
            supabaseKey: string;
            privateKey?: string;
            rpcUrl?: string;
        }
    ) {
        // Default to local Hardhat/Ganache node
        this.provider = new ethers.JsonRpcProvider(
            config.rpcUrl || 'http://127.0.0.1:8545'
        );
        
        // Create deployer wallet
        const privateKey = config.privateKey || 
            '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat default
        
        this.deployer = new ethers.Wallet(privateKey, this.provider);
        
        // Initialize Supabase
        this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }
    
    /**
     * Step 1: Compile contracts and generate ABIs
     */
    async compileContracts(): Promise<Map<string, any>> {
        console.log('📝 Compiling smart contracts...');
        
        // Create contracts directory if it doesn't exist
        const contractsDir = path.join(process.cwd(), 'contracts');
        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir, { recursive: true });
        }
        
        // Write your A2A contracts
        await this.writeA2AContracts(contractsDir);
        
        // Compile using Hardhat
        try {
            await execAsync('npx hardhat compile');
            console.log('✅ Contracts compiled successfully');
        } catch (error) {
            console.error('Compilation failed:', error);
            throw error;
        }
        
        // Load compiled artifacts
        const artifacts = await this.loadCompiledArtifacts();
        
        // Store ABIs in Supabase
        await this.storeABIsInSupabase(artifacts);
        
        return artifacts;
    }
    
    /**
     * Write A2A smart contracts
     */
    private async writeA2AContracts(dir: string) {
        // TrustEscrow.sol
        const escrowContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrustEscrow {
    struct EscrowTask {
        bytes32 taskId;
        address initiator;
        address processor;
        uint256 amount;
        uint256 deadline;
        bool completed;
        string dataHash;
    }
    
    mapping(bytes32 => EscrowTask) public tasks;
    mapping(address => uint256) public deposits;
    
    event EscrowCreated(bytes32 indexed taskId, address initiator, address processor, uint256 amount);
    event TaskCompleted(bytes32 indexed taskId, address processor, uint256 amount);
    
    function createEscrow(
        bytes32 _taskId,
        address _processor,
        uint256 _deadline,
        string memory _dataHash
    ) external payable {
        require(msg.value > 0, "Escrow amount required");
        require(_deadline > block.timestamp, "Invalid deadline");
        
        tasks[_taskId] = EscrowTask({
            taskId: _taskId,
            initiator: msg.sender,
            processor: _processor,
            amount: msg.value,
            deadline: _deadline,
            completed: false,
            dataHash: _dataHash
        });
        
        deposits[msg.sender] += msg.value;
        emit EscrowCreated(_taskId, msg.sender, _processor, msg.value);
    }
    
    function completeTask(bytes32 _taskId) external {
        EscrowTask storage task = tasks[_taskId];
        require(msg.sender == task.processor, "Not authorized");
        require(!task.completed, "Already completed");
        require(block.timestamp <= task.deadline, "Deadline passed");
        
        task.completed = true;
        payable(task.processor).transfer(task.amount);
        
        emit TaskCompleted(_taskId, task.processor, task.amount);
    }
}`;

        // ReputationOracle.sol
        const reputationContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ReputationOracle {
    mapping(address => uint256) public reputationScores;
    mapping(address => bool) public isRegistered;
    
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant INITIAL_REPUTATION = 100;
    
    event AgentRegistered(address indexed agent, uint256 initialScore);
    event ReputationUpdated(address indexed agent, int256 delta, uint256 newScore);
    
    function registerAgent(string memory _name) external {
        require(!isRegistered[msg.sender], "Already registered");
        
        isRegistered[msg.sender] = true;
        reputationScores[msg.sender] = INITIAL_REPUTATION;
        
        emit AgentRegistered(msg.sender, INITIAL_REPUTATION);
    }
    
    function updateReputation(address _agent, int256 _delta) external {
        require(isRegistered[_agent], "Agent not registered");
        
        uint256 currentScore = reputationScores[_agent];
        uint256 newScore;
        
        if (_delta < 0) {
            uint256 decrease = uint256(-_delta);
            newScore = currentScore > decrease ? currentScore - decrease : MIN_REPUTATION;
        } else {
            uint256 increase = uint256(_delta);
            newScore = currentScore + increase > MAX_REPUTATION ? MAX_REPUTATION : currentScore + increase;
        }
        
        reputationScores[_agent] = newScore;
        emit ReputationUpdated(_agent, _delta, newScore);
    }
    
    function checkReputation(address _agent) external view returns (bool qualified, uint256 score) {
        score = reputationScores[_agent];
        qualified = score >= 50; // Minimum reputation threshold
    }
}`;

        // A2AOrchestrator.sol
        const orchestratorContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract A2AOrchestrator {
    struct Process {
        bytes32 processId;
        string name;
        address creator;
        mapping(bytes32 => bool) taskCompleted;
        bytes32[] taskIds;
        bool active;
    }
    
    mapping(bytes32 => Process) public processes;
    mapping(address => bytes32[]) public agentProcesses;
    
    event ProcessCreated(bytes32 indexed processId, string name, address creator);
    event TaskAdded(bytes32 indexed processId, bytes32 taskId);
    event ProcessCompleted(bytes32 indexed processId);
    
    function createProcess(string memory _name) external returns (bytes32) {
        bytes32 processId = keccak256(abi.encodePacked(msg.sender, _name, block.timestamp));
        
        Process storage newProcess = processes[processId];
        newProcess.processId = processId;
        newProcess.name = _name;
        newProcess.creator = msg.sender;
        newProcess.active = true;
        
        agentProcesses[msg.sender].push(processId);
        
        emit ProcessCreated(processId, _name, msg.sender);
        return processId;
    }
    
    function addTask(bytes32 _processId, bytes32 _taskId) external {
        Process storage process = processes[_processId];
        require(process.active, "Process not active");
        require(msg.sender == process.creator, "Not authorized");
        
        process.taskIds.push(_taskId);
        emit TaskAdded(_processId, _taskId);
    }
}`;

        // Write contracts
        fs.writeFileSync(path.join(dir, 'TrustEscrow.sol'), escrowContract);
        fs.writeFileSync(path.join(dir, 'ReputationOracle.sol'), reputationContract);
        fs.writeFileSync(path.join(dir, 'A2AOrchestrator.sol'), orchestratorContract);
        
        console.log('✅ A2A contracts written');
    }
    
    /**
     * Load compiled artifacts
     */
    private async loadCompiledArtifacts(): Promise<Map<string, any>> {
        const artifactsDir = path.join(process.cwd(), 'artifacts', 'contracts');
        const artifacts = new Map<string, any>();
        
        // Load each contract's artifact
        const contracts = ['TrustEscrow', 'ReputationOracle', 'A2AOrchestrator'];
        
        for (const contractName of contracts) {
            const artifactPath = path.join(
                artifactsDir,
                `${contractName}.sol`,
                `${contractName}.json`
            );
            
            if (fs.existsSync(artifactPath)) {
                const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
                artifacts.set(contractName, {
                    abi: artifact.abi,
                    bytecode: artifact.bytecode,
                    contractName: contractName
                });
                
                console.log(`✅ Loaded ABI for ${contractName}`);
            }
        }
        
        return artifacts;
    }
    
    /**
     * Store ABIs in Supabase
     */
    private async storeABIsInSupabase(artifacts: Map<string, any>) {
        console.log('💾 Storing ABIs in Supabase...');
        
        for (const [name, artifact] of artifacts) {
            const { error } = await this.supabase
                .from('contract_abis')
                .upsert({
                    contract_name: name,
                    abi: artifact.abi,
                    bytecode: artifact.bytecode,
                    network: 'private',
                    version: '1.0.0',
                    updated_at: new Date().toISOString()
                });
            
            if (error) {
                console.error(`Failed to store ${name} ABI:`, error);
            } else {
                console.log(`✅ Stored ${name} ABI in Supabase`);
            }
        }
    }
    
    /**
     * Step 2: Deploy contracts to private blockchain
     */
    async deployContracts(artifacts?: Map<string, any>): Promise<Map<string, string>> {
        console.log('🚀 Deploying contracts to private blockchain...');
        
        // Load artifacts if not provided
        if (!artifacts) {
            artifacts = await this.loadABIsFromSupabase();
        }
        
        const deployedAddresses = new Map<string, string>();
        
        // Deploy each contract
        for (const [name, artifact] of artifacts) {
            try {
                const factory = new ethers.ContractFactory(
                    artifact.abi,
                    artifact.bytecode,
                    this.deployer
                );
                
                console.log(`Deploying ${name}...`);
                const contract = await factory.deploy();
                await contract.waitForDeployment();
                
                const address = await contract.getAddress();
                deployedAddresses.set(name, address);
                this.contracts.set(name, contract);
                
                console.log(`✅ ${name} deployed at: ${address}`);
                
                // Store deployment in Supabase
                await this.storeDeploymentInSupabase(name, address, artifact.abi);
                
            } catch (error) {
                console.error(`Failed to deploy ${name}:`, error);
                throw error;
            }
        }
        
        return deployedAddresses;
    }
    
    /**
     * Load ABIs from Supabase
     */
    private async loadABIsFromSupabase(): Promise<Map<string, any>> {
        const { data, error } = await this.supabase
            .from('contract_abis')
            .select('*')
            .eq('network', 'private');
        
        if (error) throw error;
        
        const artifacts = new Map<string, any>();
        
        for (const record of data) {
            artifacts.set(record.contract_name, {
                abi: record.abi,
                bytecode: record.bytecode,
                contractName: record.contract_name
            });
        }
        
        return artifacts;
    }
    
    /**
     * Store deployment info in Supabase
     */
    private async storeDeploymentInSupabase(
        contractName: string,
        address: string,
        abi: any[]
    ) {
        const { error } = await this.supabase
            .from('deployed_contracts')
            .insert({
                contract_name: contractName,
                address: address,
                network: 'private',
                deployer: this.deployer.address,
                abi: abi,
                rpc_url: this.provider._getConnection().url,
                created_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Failed to store deployment:', error);
        }
    }
    
    /**
     * Step 3: Setup private RPC endpoint
     */
    async setupPrivateRPC(): Promise<string> {
        console.log('🌐 Setting up private RPC endpoint...');
        
        // Option 1: Local Hardhat node
        const hardhatConfig = {
            port: 8545,
            hostname: 'localhost',
            accounts: {
                mnemonic: 'test test test test test test test test test test test junk',
                path: "m/44'/60'/0'/0",
                count: 20,
                accountsBalance: '10000000000000000000000' // 10,000 ETH
            }
        };
        
        // Write Hardhat config
        const hardhatConfigFile = `
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
    solidity: "0.8.19",
    networks: {
        hardhat: ${JSON.stringify(hardhatConfig, null, 2)}
    }
};

export default config;
`;
        
        fs.writeFileSync('hardhat.config.ts', hardhatConfigFile);
        
        // Start Hardhat node (in production, this would be a separate process)
        console.log('Starting Hardhat node...');
        
        // Store RPC info in Supabase
        const rpcUrl = `http://localhost:${hardhatConfig.port}`;
        await this.storeRPCInSupabase(rpcUrl);
        
        return rpcUrl;
    }
    
    /**
     * Store RPC endpoint in Supabase
     */
    private async storeRPCInSupabase(rpcUrl: string) {
        const { error } = await this.supabase
            .from('blockchain_config')
            .upsert({
                network_name: 'private',
                rpc_url: rpcUrl,
                chain_id: 31337, // Hardhat default
                explorer_url: null,
                is_active: true,
                config: {
                    gasLimit: 30000000,
                    gasPrice: '20000000000', // 20 gwei
                    confirmations: 1
                }
            });
        
        if (error) {
            console.error('Failed to store RPC config:', error);
        } else {
            console.log('✅ RPC endpoint stored in Supabase');
        }
    }
    
    /**
     * Step 4: Initialize blockchain for A2A
     */
    async initializeForA2A(): Promise<{
        rpcUrl: string;
        contracts: Record<string, string>;
        accounts: string[];
    }> {
        console.log('🔧 Initializing private blockchain for A2A...');
        
        // 1. Compile contracts
        const artifacts = await this.compileContracts();
        
        // 2. Deploy contracts
        const contracts = await this.deployContracts(artifacts);
        
        // 3. Setup RPC
        const rpcUrl = await this.setupPrivateRPC();
        
        // 4. Create test accounts
        const accounts = await this.createTestAccounts();
        
        // 5. Initialize A2A agents with blockchain
        await this.initializeA2AAgents(contracts);
        
        return {
            rpcUrl,
            contracts: Object.fromEntries(contracts),
            accounts
        };
    }
    
    /**
     * Create test accounts with ETH
     */
    private async createTestAccounts(): Promise<string[]> {
        console.log('👛 Creating test accounts...');
        
        const accounts: string[] = [];
        
        for (let i = 0; i < 5; i++) {
            const wallet = ethers.Wallet.createRandom().connect(this.provider);
            
            // Fund account from deployer
            const tx = await this.deployer.sendTransaction({
                to: wallet.address,
                value: ethers.parseEther('100') // 100 ETH
            });
            await tx.wait();
            
            accounts.push(wallet.address);
            
            // Store in Supabase
            await this.supabase
                .from('test_accounts')
                .insert({
                    address: wallet.address,
                    private_key: wallet.privateKey,
                    balance: '100',
                    network: 'private',
                    purpose: `test-account-${i}`
                });
            
            console.log(`✅ Created account ${i + 1}: ${wallet.address}`);
        }
        
        return accounts;
    }
    
    /**
     * Initialize A2A agents with blockchain capabilities
     */
    private async initializeA2AAgents(contracts: Map<string, string>) {
        console.log('🤖 Initializing A2A agents with blockchain...');
        
        // Create blockchain-enabled agent templates
        const agentTemplates = [
            {
                agent_id: 'blockchain-orchestrator',
                name: 'Blockchain Orchestrator',
                type: 'orchestrator',
                capabilities: ['deploy_contract', 'manage_process', 'verify_transaction'],
                blockchain_config: {
                    network: 'private',
                    rpc_url: this.provider._getConnection().url,
                    contracts: Object.fromEntries(contracts),
                    wallet_address: this.deployer.address
                }
            },
            {
                agent_id: 'escrow-manager',
                name: 'Escrow Manager',
                type: 'financial',
                capabilities: ['create_escrow', 'release_funds', 'verify_completion'],
                blockchain_config: {
                    network: 'private',
                    contract_address: contracts.get('TrustEscrow'),
                    contract_type: 'escrow'
                }
            },
            {
                agent_id: 'reputation-tracker',
                name: 'Reputation Tracker',
                type: 'validator',
                capabilities: ['check_reputation', 'update_score', 'verify_agent'],
                blockchain_config: {
                    network: 'private',
                    contract_address: contracts.get('ReputationOracle'),
                    contract_type: 'reputation'
                }
            }
        ];
        
        // Store agents in Supabase
        for (const agent of agentTemplates) {
            await this.supabase
                .from('a2a_agents')
                .upsert(agent);
            
            console.log(`✅ Created blockchain agent: ${agent.name}`);
        }
    }
    
    /**
     * Get connection info for visual builder
     */
    async getConnectionInfo(): Promise<{
        rpcUrl: string;
        chainId: number;
        contracts: Record<string, string>;
        abis: Record<string, any>;
        testAccounts: string[];
    }> {
        // Load from Supabase
        const { data: config } = await this.supabase
            .from('blockchain_config')
            .select('*')
            .eq('network_name', 'private')
            .single();
        
        const { data: contracts } = await this.supabase
            .from('deployed_contracts')
            .select('*')
            .eq('network', 'private');
        
        const { data: accounts } = await this.supabase
            .from('test_accounts')
            .select('address')
            .eq('network', 'private');
        
        const { data: abis } = await this.supabase
            .from('contract_abis')
            .select('*')
            .eq('network', 'private');
        
        return {
            rpcUrl: config.rpc_url,
            chainId: config.chain_id,
            contracts: contracts.reduce((acc, c) => ({
                ...acc,
                [c.contract_name]: c.address
            }), {}),
            abis: abis.reduce((acc, a) => ({
                ...acc,
                [a.contract_name]: a.abi
            }), {}),
            testAccounts: accounts.map(a => a.address)
        };
    }
}

// Database schema for Supabase
export const SUPABASE_SCHEMA = `
-- Contract ABIs storage
CREATE TABLE IF NOT EXISTS contract_abis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT UNIQUE NOT NULL,
    abi JSONB NOT NULL,
    bytecode TEXT NOT NULL,
    network TEXT DEFAULT 'private',
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deployed contracts registry
CREATE TABLE IF NOT EXISTS deployed_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_name TEXT NOT NULL,
    address TEXT NOT NULL,
    network TEXT NOT NULL,
    deployer TEXT NOT NULL,
    abi JSONB NOT NULL,
    rpc_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(address, network)
);

-- Blockchain configuration
CREATE TABLE IF NOT EXISTS blockchain_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network_name TEXT UNIQUE NOT NULL,
    rpc_url TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    explorer_url TEXT,
    is_active BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test accounts for development
CREATE TABLE IF NOT EXISTS test_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    private_key TEXT, -- Encrypt in production!
    balance TEXT,
    network TEXT,
    purpose TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(address, network)
);

-- Indexes
CREATE INDEX idx_deployed_contracts_network ON deployed_contracts(network);
CREATE INDEX idx_contract_abis_network ON contract_abis(network);
`;

// Helper script to set everything up
export async function setupPrivateBlockchain() {
    const setup = new PrivateBlockchainSetup({
        supabaseUrl: process.env.SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_SERVICE_KEY!
    });
    
    try {
        // Initialize everything
        const result = await setup.initializeForA2A();
        
        console.log('\n🎉 Private blockchain setup complete!');
        console.log('📝 Connection info:');
        console.log(`   RPC URL: ${result.rpcUrl}`);
        console.log(`   Contracts deployed: ${Object.keys(result.contracts).length}`);
        console.log(`   Test accounts created: ${result.accounts.length}`);
        
        // Get connection info for visual builder
        const connectionInfo = await setup.getConnectionInfo();
        
        console.log('\n🔗 Use this in your visual builder:');
        console.log(JSON.stringify(connectionInfo, null, 2));
        
        return connectionInfo;
        
    } catch (error) {
        console.error('Setup failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    setupPrivateBlockchain()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
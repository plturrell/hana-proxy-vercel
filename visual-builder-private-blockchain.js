/**
 * Visual Builder Private Blockchain Integration
 * Drop-in replacement for MetaMask - connects to YOUR private blockchain
 */

import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

export class PrivateBlockchainConnector {
    constructor(config = {}) {
        this.supabase = createClient(
            config.supabaseUrl || process.env.SUPABASE_URL,
            config.supabaseKey || process.env.SUPABASE_SERVICE_KEY
        );
        
        this.provider = null;
        this.signer = null;
        this.contracts = new Map();
        this.contractFactories = new Map();
        this.connected = false;
    }
    
    /**
     * Connect to private blockchain (replaces MetaMask connection)
     */
    async connect() {
        console.log('🔗 Connecting to private blockchain...');
        
        try {
            // 1. Load blockchain config from Supabase
            const config = await this.loadBlockchainConfig();
            
            // 2. Connect to RPC
            this.provider = new ethers.JsonRpcProvider(config.rpc_url);
            
            // 3. Get test account (replaces MetaMask account)
            const account = await this.getTestAccount();
            this.signer = new ethers.Wallet(account.private_key, this.provider);
            
            // 4. Load contract ABIs and deployed addresses
            await this.loadContractABIs();
            await this.loadDeployedContracts();
            
            this.connected = true;
            
            console.log('✅ Connected to private blockchain');
            console.log(`   Account: ${this.signer.address}`);
            console.log(`   Balance: ${ethers.formatEther(await this.provider.getBalance(this.signer.address))} ETH`);
            console.log(`   Contracts: ${this.contracts.size} loaded`);
            
            return {
                connected: true,
                account: this.signer.address,
                balance: await this.provider.getBalance(this.signer.address),
                contracts: Array.from(this.contracts.keys()),
                network: {
                    name: config.network_name,
                    chainId: config.chain_id,
                    rpcUrl: config.rpc_url
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to connect to private blockchain:', error);
            throw error;
        }
    }
    
    /**
     * Load blockchain configuration from Supabase
     */
    async loadBlockchainConfig() {
        const { data, error } = await this.supabase
            .from('blockchain_config')
            .select('*')
            .eq('network_name', 'private')
            .eq('is_active', true)
            .single();
        
        if (error) throw new Error(`Failed to load blockchain config: ${error.message}`);
        return data;
    }
    
    /**
     * Get test account for visual builder
     */
    async getTestAccount() {
        let { data, error } = await this.supabase
            .from('test_accounts')
            .select('*')
            .eq('purpose', 'visual-builder')
            .eq('network', 'private')
            .single();
        
        // Create visual builder account if it doesn't exist
        if (error || !data) {
            console.log('Creating new visual builder test account...');
            
            const wallet = ethers.Wallet.createRandom();
            
            const { data: newAccount, error: insertError } = await this.supabase
                .from('test_accounts')
                .insert({
                    address: wallet.address,
                    private_key: wallet.privateKey,
                    balance: '0',
                    network: 'private',
                    purpose: 'visual-builder'
                })
                .select()
                .single();
            
            if (insertError) throw new Error(`Failed to create test account: ${insertError.message}`);
            
            // Fund the account
            await this.fundAccount(wallet.address);
            
            data = newAccount;
        }
        
        return data;
    }
    
    /**
     * Fund test account (in production this would be automatic)
     */
    async fundAccount(address) {
        // This would fund from a faucet or deployer account
        console.log(`💰 Funding account ${address} with test ETH...`);
        
        // Update balance in database (in real implementation, this would transfer actual ETH)
        await this.supabase
            .from('test_accounts')
            .update({ balance: '100.0' })
            .eq('address', address);
    }
    
    /**
     * Load contract ABIs from Supabase
     */
    async loadContractABIs() {
        const { data, error } = await this.supabase
            .from('contract_abis')
            .select('*')
            .eq('network', 'private');
        
        if (error) throw new Error(`Failed to load contract ABIs: ${error.message}`);
        
        for (const contract of data) {
            this.contractFactories.set(contract.contract_name, {
                abi: contract.abi,
                bytecode: contract.bytecode
            });
        }
        
        console.log(`📋 Loaded ${data.length} contract ABIs`);
    }
    
    /**
     * Load deployed contracts from Supabase
     */
    async loadDeployedContracts() {
        const { data, error } = await this.supabase
            .from('deployed_contracts')
            .select('*')
            .eq('network', 'private');
        
        if (error) throw new Error(`Failed to load deployed contracts: ${error.message}`);
        
        for (const deployment of data) {
            const factory = this.contractFactories.get(deployment.contract_name);
            if (factory) {
                const contract = new ethers.Contract(
                    deployment.address,
                    factory.abi,
                    this.signer
                );
                
                this.contracts.set(deployment.contract_name, {
                    contract,
                    address: deployment.address,
                    abi: factory.abi
                });
            }
        }
        
        console.log(`🏭 Loaded ${data.length} deployed contracts`);
    }
    
    /**
     * Deploy visual process to blockchain (main function for visual builder)
     */
    async deployVisualProcess(visualProcess) {
        if (!this.connected) {
            throw new Error('Not connected to blockchain. Call connect() first.');
        }
        
        console.log('🚀 Deploying visual process to private blockchain...');
        console.log('Process:', visualProcess.name);
        
        try {
            const deployments = [];
            
            // Process each element in the visual process
            for (const element of visualProcess.elements) {
                if (element.type === 'contract') {
                    const deployment = await this.deployContractElement(element);
                    deployments.push(deployment);
                }
            }
            
            // Create orchestrator process
            const processId = await this.createOrchestratorProcess(visualProcess.name);
            
            // Store deployment info
            const deploymentRecord = {
                process_name: visualProcess.name,
                process_id: processId,
                contracts: deployments,
                deployed_at: new Date().toISOString(),
                deployer: this.signer.address,
                network: 'private'
            };
            
            await this.supabase
                .from('visual_process_deployments')
                .insert(deploymentRecord);
            
            console.log('✅ Visual process deployed successfully');
            
            return {
                success: true,
                processId,
                contracts: deployments,
                txHashes: deployments.map(d => d.txHash),
                gasUsed: deployments.reduce((total, d) => total + d.gasUsed, 0),
                totalCost: '0 ETH' // Free on private blockchain!
            };
            
        } catch (error) {
            console.error('❌ Failed to deploy visual process:', error);
            throw error;
        }
    }
    
    /**
     * Deploy individual contract element
     */
    async deployContractElement(element) {
        const factory = this.contractFactories.get(element.subtype);
        if (!factory) {
            throw new Error(`Contract type ${element.subtype} not found`);
        }
        
        console.log(`Deploying ${element.subtype}...`);
        
        const contractFactory = new ethers.ContractFactory(
            factory.abi,
            factory.bytecode,
            this.signer
        );
        
        // Deploy with constructor args if provided
        const constructorArgs = this.parseConstructorArgs(element.config);
        const contract = await contractFactory.deploy(...constructorArgs);
        const receipt = await contract.deploymentTransaction().wait();
        
        const address = await contract.getAddress();
        
        // Store deployment in Supabase
        await this.supabase
            .from('deployed_contracts')
            .insert({
                contract_name: element.subtype,
                address,
                network: 'private',
                deployer: this.signer.address,
                abi: factory.abi,
                deployment_context: 'visual-process'
            });
        
        return {
            contractName: element.subtype,
            address,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: Number(receipt.gasUsed)
        };
    }
    
    /**
     * Create orchestrator process
     */
    async createOrchestratorProcess(processName) {
        const orchestrator = this.contracts.get('A2AOrchestrator');
        if (!orchestrator) {
            throw new Error('A2AOrchestrator contract not found');
        }
        
        const tx = await orchestrator.contract.createProcess(processName);
        const receipt = await tx.wait();
        
        // Extract process ID from event logs
        const event = receipt.logs.find(log => {
            try {
                return orchestrator.contract.interface.parseLog(log).name === 'ProcessCreated';
            } catch {
                return false;
            }
        });
        
        if (event) {
            const parsed = orchestrator.contract.interface.parseLog(event);
            return parsed.args.processId;
        }
        
        throw new Error('Failed to get process ID from transaction');
    }
    
    /**
     * Parse constructor arguments from visual element config
     */
    parseConstructorArgs(config) {
        if (!config || !config.constructorArgs) {
            return [];
        }
        
        return config.constructorArgs.map(arg => {
            // Convert strings to appropriate types
            if (arg.type === 'address') {
                return arg.value;
            } else if (arg.type === 'uint256') {
                return ethers.parseEther(arg.value);
            } else if (arg.type === 'string') {
                return arg.value;
            } else if (arg.type === 'bytes32') {
                return ethers.id(arg.value);
            }
            return arg.value;
        });
    }
    
    /**
     * Execute contract function (for visual builder interactions)
     */
    async executeContractFunction(contractName, functionName, args = []) {
        const contractInfo = this.contracts.get(contractName);
        if (!contractInfo) {
            throw new Error(`Contract ${contractName} not found`);
        }
        
        console.log(`Executing ${contractName}.${functionName}(${args.join(', ')})`);
        
        const tx = await contractInfo.contract[functionName](...args);
        const receipt = await tx.wait();
        
        return {
            success: true,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: Number(receipt.gasUsed),
            events: receipt.logs.map(log => {
                try {
                    return contractInfo.contract.interface.parseLog(log);
                } catch {
                    return null;
                }
            }).filter(Boolean)
        };
    }
    
    /**
     * Get contract information for visual builder
     */
    getAvailableContracts() {
        return Array.from(this.contractFactories.keys()).map(name => ({
            name,
            deployed: this.contracts.has(name),
            address: this.contracts.get(name)?.address,
            abi: this.contractFactories.get(name).abi
        }));
    }
    
    /**
     * Get account information
     */
    async getAccountInfo() {
        if (!this.signer) return null;
        
        return {
            address: this.signer.address,
            balance: await this.provider.getBalance(this.signer.address),
            balanceFormatted: ethers.formatEther(await this.provider.getBalance(this.signer.address))
        };
    }
    
    /**
     * Disconnect from blockchain
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.contracts.clear();
        this.contractFactories.clear();
        this.connected = false;
        
        console.log('🔌 Disconnected from private blockchain');
    }
}

// Usage example for visual builder:
/*
const connector = new PrivateBlockchainConnector();

// Connect (replaces MetaMask connection)
const connection = await connector.connect();

// Deploy visual process
const visualProcess = {
    name: "My A2A Process",
    elements: [
        {
            type: "contract",
            subtype: "TrustEscrow",
            config: {
                constructorArgs: []
            }
        }
    ]
};

const deployment = await connector.deployVisualProcess(visualProcess);
console.log('Deployed at:', deployment.contracts);
console.log('Gas cost: FREE!');
*/

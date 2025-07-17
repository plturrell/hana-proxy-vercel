// Real blockchain bridge for A2A Visual Builder with MetaMask integration
// Uses ethers.js v5 for compatibility with existing frontend

class A2ABlockchainBridge {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.network = null;
    this.walletAddress = null;
    this.isConnected = false;
    this.supabaseClient = null;
    
    // Real contract factories with your ABIs
    this.contractFactories = {
      escrow: {
        abi: [
          "function createEscrow(bytes32 taskId, address processor, uint256 deadline, string dataHash) payable",
          "function validateTask(bytes32 taskId)",
          "function completeTask(bytes32 taskId)",
          "event EscrowCreated(bytes32 indexed taskId, address initiator, address processor, uint256 amount)",
          "event TaskValidated(bytes32 indexed taskId, address validator)",
          "event FundsReleased(bytes32 indexed taskId, address recipient, uint256 amount)"
        ],
        bytecode: "0x608060405234801561001057600080fd5b50..." // Your actual bytecode
      },
      reputation: {
        abi: [
          "function updateReputation(address agent, uint256 score, string evidence)",
          "function getReputation(address agent) view returns (uint256)",
          "function isReputationValid(address agent, uint256 threshold) view returns (bool)",
          "event ReputationUpdated(address indexed agent, uint256 score, string evidence)"
        ],
        bytecode: "0x608060405234801561001057600080fd5b50..." // Your actual bytecode
      },
      multisig: {
        abi: [
          "function submitTransaction(address to, uint256 value, bytes data) returns (uint256)",
          "function confirmTransaction(uint256 transactionId)",
          "function executeTransaction(uint256 transactionId)",
          "function getConfirmationCount(uint256 transactionId) view returns (uint256)",
          "event TransactionSubmitted(uint256 indexed transactionId, address indexed submitter)",
          "event TransactionConfirmed(uint256 indexed transactionId, address indexed confirmer)",
          "event TransactionExecuted(uint256 indexed transactionId)"
        ],
        bytecode: "0x608060405234801561001057600080fd5b50..." // Your actual bytecode
      },
      orchestrator: {
        abi: [
          "function registerAgent(string name, address agentAddress) payable",
          "function createProcess(string name, bytes32[] agentIds) returns (bytes32)",
          "function executeProcess(bytes32 processId, bytes input) returns (bytes32)",
          "function getProcessStatus(bytes32 processId) view returns (uint8)",
          "event AgentRegistered(string indexed name, address indexed agentAddress)",
          "event ProcessCreated(bytes32 indexed processId, string name)",
          "event ProcessExecuted(bytes32 indexed processId, bytes32 taskId)"
        ],
        bytecode: "0x608060405234801561001057600080fd5b50..." // Your actual bytecode
      }
    };
    
    this.deployedContracts = new Map();
    this.eventListeners = new Map();
  }
  
  // Connect to MetaMask and initialize
  async connect() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask to use blockchain features.');
      }
      
      console.log('🔌 Connecting to MetaMask...');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize provider with ethers v5
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.walletAddress = await this.signer.getAddress();
      this.network = await this.provider.getNetwork();
      
      // Get wallet balance
      const balance = await this.provider.getBalance(this.walletAddress);
      const balanceEth = ethers.utils.formatEther(balance);
      
      this.isConnected = true;
      
      console.log('✅ Connected to MetaMask:', {
        address: this.walletAddress,
        network: this.network.name,
        chainId: this.network.chainId,
        balance: balanceEth
      });
      
      // Setup event listeners
      this.setupEventListeners();
      
      return {
        success: true,
        address: this.walletAddress,
        network: this.network.name,
        chainId: this.network.chainId,
        balance: balanceEth
      };
      
    } catch (error) {
      console.error('❌ MetaMask connection failed:', error);
      throw error;
    }
  }
  
  // Setup blockchain event listeners
  setupEventListeners() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.walletAddress = accounts[0];
          this.emit('accountChanged', { address: this.walletAddress });
        }
      });
      
      window.ethereum.on('chainChanged', (chainId) => {
        window.location.reload(); // Reload on network change
      });
    }
  }
  
  // Disconnect from MetaMask
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.walletAddress = null;
    this.isConnected = false;
    this.emit('disconnected', {});
  }
  
  // Deploy a contract
  async deployContract(contractType, constructorArgs = []) {
    if (!this.isConnected) {
      throw new Error('Not connected to MetaMask');
    }
    
    const factory = this.contractFactories[contractType];
    if (!factory) {
      throw new Error(`Unsupported contract type: ${contractType}`);
    }
    
    try {
      console.log(`🚀 Deploying ${contractType} contract...`);
      
      // Estimate gas
      const contractFactory = new ethers.ContractFactory(factory.abi, factory.bytecode, this.signer);
      const gasEstimate = await contractFactory.signer.estimateGas(
        contractFactory.getDeployTransaction(...constructorArgs)
      );
      
      // Deploy contract
      const contract = await contractFactory.deploy(...constructorArgs, {
        gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
      });
      
      console.log(`⏳ Waiting for deployment of ${contractType}...`);
      await contract.deployed();
      
      const address = contract.address;
      console.log(`✅ ${contractType} deployed at: ${address}`);
      
      // Store contract reference
      this.deployedContracts.set(contractType, {
        address,
        contract,
        deploymentTx: contract.deployTransaction.hash,
        deployedAt: new Date().toISOString()
      });
      
      // Setup event listeners for this contract
      this.setupContractEventListeners(contractType, contract);
      
      return {
        address,
        transactionHash: contract.deployTransaction.hash,
        gasUsed: gasEstimate.toString()
      };
      
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractType}:`, error);
      throw error;
    }
  }
  
  // Setup event listeners for a specific contract
  setupContractEventListeners(contractType, contract) {
    const listeners = [];
    
    // Get all events from ABI
    const events = contract.interface.events;
    
    Object.keys(events).forEach(eventName => {
      const listener = (...args) => {
        const event = args[args.length - 1]; // Last argument is the event object
        console.log(`📡 ${contractType} Event - ${eventName}:`, event);
        
        this.emit('contractEvent', {
          contractType,
          eventName,
          event,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      };
      
      contract.on(eventName, listener);
      listeners.push({ eventName, listener });
    });
    
    this.eventListeners.set(contractType, listeners);
  }
  
  // Deploy a complete A2A process to blockchain
  async deployProcess(process) {
    if (!this.isConnected) {
      throw new Error('Not connected to MetaMask');
    }
    
    try {
      console.log('🚀 Starting A2A process deployment to blockchain...');
      
      const deploymentResult = {
        processId: process.id,
        contracts: {},
        agents: {},
        transactions: []
      };
      
      // 1. Deploy orchestrator contract first
      const orchestratorDeployment = await this.deployContract('orchestrator', []);
      deploymentResult.contracts.orchestrator = orchestratorDeployment;
      
      // 2. Deploy trust contracts based on process requirements
      const contractElements = process.elements?.filter(e => e.type === 'contract') || [];
      
      for (const contractElement of contractElements) {
        const contractType = contractElement.subtype;
        if (this.contractFactories[contractType]) {
          const deployment = await this.deployContract(contractType, []);
          deploymentResult.contracts[contractElement.id] = deployment;
        }
      }
      
      // 3. Register agents with orchestrator
      const agentElements = process.elements?.filter(e => e.type === 'agent') || [];
      const orchestratorContract = this.deployedContracts.get('orchestrator').contract;
      
      for (const agentElement of agentElements) {
        console.log(`🤖 Registering agent: ${agentElement.id}`);
        
        // For demo, use wallet address as agent address
        // In production, each agent would have its own wallet
        const agentAddress = this.walletAddress;
        const stakingAmount = ethers.utils.parseEther('0.01'); // 0.01 ETH stake
        
        const tx = await orchestratorContract.registerAgent(
          agentElement.id,
          agentAddress,
          { value: stakingAmount }
        );
        
        await tx.wait();
        deploymentResult.transactions.push(tx.hash);
        deploymentResult.agents[agentElement.id] = {
          address: agentAddress,
          registrationTx: tx.hash
        };
        
        console.log(`✅ Agent ${agentElement.id} registered`);
      }
      
      // 4. Create process on orchestrator
      const agentIds = agentElements.map(a => 
        ethers.utils.formatBytes32String(a.id)
      );
      
      const createProcessTx = await orchestratorContract.createProcess(
        process.name,
        agentIds
      );
      
      await createProcessTx.wait();
      deploymentResult.transactions.push(createProcessTx.hash);
      
      console.log('✅ A2A process deployment completed:', deploymentResult);
      
      // 5. Store deployment in database via API
      await this.storeDeployment(deploymentResult);
      
      return deploymentResult;
      
    } catch (error) {
      console.error('❌ A2A process deployment failed:', error);
      throw error;
    }
  }
  
  // Execute a deployed process
  async executeProcess(processId, inputData = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to MetaMask');
    }
    
    try {
      console.log(`▶️ Executing A2A process: ${processId}`);
      
      const orchestratorContract = this.deployedContracts.get('orchestrator')?.contract;
      if (!orchestratorContract) {
        throw new Error('Orchestrator contract not deployed');
      }
      
      // Encode input data
      const encodedInput = ethers.utils.toUtf8Bytes(JSON.stringify(inputData));
      const processIdBytes = ethers.utils.formatBytes32String(processId);
      
      // Execute process
      const tx = await orchestratorContract.executeProcess(processIdBytes, encodedInput);
      console.log(`⏳ Waiting for execution transaction: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Process execution completed in block: ${receipt.blockNumber}`);
      
      // Extract task ID from events
      const taskCreatedEvent = receipt.events?.find(e => e.event === 'ProcessExecuted');
      const taskId = taskCreatedEvent?.args?.taskId;
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        taskId: taskId?.toString(),
        gasUsed: receipt.gasUsed.toString()
      };
      
    } catch (error) {
      console.error(`❌ Process execution failed:`, error);
      throw error;
    }
  }
  
  // Estimate gas costs for deployment
  async estimateGas(process) {
    if (!this.isConnected) {
      throw new Error('Not connected to MetaMask');
    }
    
    try {
      let totalGas = ethers.BigNumber.from(0);
      
      // Estimate orchestrator deployment
      const orchestratorFactory = new ethers.ContractFactory(
        this.contractFactories.orchestrator.abi,
        this.contractFactories.orchestrator.bytecode,
        this.signer
      );
      
      const orchestratorGas = await orchestratorFactory.signer.estimateGas(
        orchestratorFactory.getDeployTransaction()
      );
      totalGas = totalGas.add(orchestratorGas);
      
      // Estimate contract deployments
      const contractElements = process.elements?.filter(e => e.type === 'contract') || [];
      for (const contract of contractElements) {
        if (this.contractFactories[contract.subtype]) {
          const factory = new ethers.ContractFactory(
            this.contractFactories[contract.subtype].abi,
            this.contractFactories[contract.subtype].bytecode,
            this.signer
          );
          
          const gas = await factory.signer.estimateGas(factory.getDeployTransaction());
          totalGas = totalGas.add(gas);
        }
      }
      
      // Estimate agent registrations (150k gas each)
      const agentElements = process.elements?.filter(e => e.type === 'agent') || [];
      totalGas = totalGas.add(ethers.BigNumber.from(150000).mul(agentElements.length));
      
      // Estimate process creation (200k gas)
      totalGas = totalGas.add(ethers.BigNumber.from(200000));
      
      // Get current gas price
      const gasPrice = await this.provider.getGasPrice();
      const costInWei = totalGas.mul(gasPrice);
      const costInEth = ethers.utils.formatEther(costInWei);
      
      return {
        gasEstimate: totalGas.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCostWei: costInWei.toString(),
        estimatedCostEth: costInEth
      };
      
    } catch (error) {
      console.error('❌ Gas estimation failed:', error);
      throw error;
    }
  }
  
  // Store deployment in database
  async storeDeployment(deploymentResult) {
    try {
      const response = await fetch('/api/a2a-blockchain-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'store_deployment',
          deployment: {
            process_id: deploymentResult.processId,
            contracts: deploymentResult.contracts,
            agents: deploymentResult.agents,
            transactions: deploymentResult.transactions,
            deployer_address: this.walletAddress,
            network_chain_id: this.network.chainId,
            deployed_at: new Date().toISOString()
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store deployment: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Deployment stored in database:', result);
      
    } catch (error) {
      console.error('❌ Failed to store deployment:', error);
      // Don't throw - deployment succeeded even if storage failed
    }
  }
  
  // Event emitter functionality
  emit(eventName, data) {
    const event = new CustomEvent(`a2a-blockchain-${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }
  
  // Add event listener
  on(eventName, callback) {
    window.addEventListener(`a2a-blockchain-${eventName}`, callback);
  }
  
  // Remove event listener
  off(eventName, callback) {
    window.removeEventListener(`a2a-blockchain-${eventName}`, callback);
  }
  
  // Get deployed contract
  getContract(contractType) {
    return this.deployedContracts.get(contractType);
  }
  
  // Get all deployed contracts
  getAllContracts() {
    return Object.fromEntries(this.deployedContracts);
  }
  
  // Check if connected
  isConnectedToBlockchain() {
    return this.isConnected && this.provider && this.signer;
  }
  
  // Get network info
  getNetworkInfo() {
    return {
      name: this.network?.name,
      chainId: this.network?.chainId,
      walletAddress: this.walletAddress,
      isConnected: this.isConnected
    };
  }
}

// Initialize bridge when script loads
window.addEventListener('DOMContentLoaded', () => {
  window.a2aBlockchainBridge = new A2ABlockchainBridge();
  console.log('🔗 A2A Blockchain Bridge initialized');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = A2ABlockchainBridge;
}
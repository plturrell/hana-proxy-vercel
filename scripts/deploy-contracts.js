/**
 * Smart Contract Deployment Pipeline
 * Compiles and deploys contracts to private blockchain
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getSecureConfig } = require('../lib/secure-config');

class ContractDeploymentPipeline {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.deployedContracts = new Map();
    this.config = null;
  }

  async initialize() {
    this.config = await getSecureConfig().getExternalConfig();
    
    const rpcUrl = process.env.PRIVATE_RPC_URL || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const deployerKey = this.config.blockchain.deployerKey;
    this.signer = new ethers.Wallet(deployerKey, this.provider);
    
    console.log(`🔌 Connected to blockchain: ${rpcUrl}`);
    console.log(`💼 Deployer address: ${this.signer.address}`);
  }

  /**
   * Compile contracts using Hardhat
   */
  async compileContracts() {
    console.log('🔧 Compiling smart contracts...');
    
    try {
      // Run Hardhat compile
      execSync('npx hardhat compile', { 
        cwd: process.cwd(),
        stdio: 'inherit' 
      });
      
      console.log('✅ Contracts compiled successfully');
    } catch (error) {
      console.error('❌ Contract compilation failed:', error);
      throw error;
    }
  }

  /**
   * Load contract artifacts
   */
  loadContractArtifact(contractName) {
    const artifactPath = path.join(
      process.cwd(),
      'artifacts',
      'contracts',
      `${contractName}.sol`,
      `${contractName}.json`
    );
    
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Contract artifact not found: ${artifactPath}`);
    }
    
    return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  }

  /**
   * Deploy A2A Orchestrator contract
   */
  async deployOrchestrator() {
    console.log('🚀 Deploying A2AOrchestrator...');
    
    const artifact = this.loadContractArtifact('A2AOrchestrator');
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      this.signer
    );
    
    const contract = await factory.deploy({
      gasLimit: 2000000
    });
    
    await contract.waitForDeployment();
    
    const deployment = {
      name: 'A2AOrchestrator',
      address: contract.target,
      transactionHash: contract.deploymentTransaction().hash,
      contract
    };
    
    this.deployedContracts.set('A2AOrchestrator', deployment);
    console.log(`✅ A2AOrchestrator deployed at: ${deployment.address}`);
    
    return deployment;
  }

  /**
   * Deploy TrustEscrow contract
   */
  async deployTrustEscrow() {
    console.log('🚀 Deploying TrustEscrow...');
    
    const artifact = this.loadContractArtifact('TrustEscrow');
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      this.signer
    );
    
    const contract = await factory.deploy({
      gasLimit: 2500000
    });
    
    await contract.waitForDeployment();
    
    const deployment = {
      name: 'TrustEscrow',
      address: contract.target,
      transactionHash: contract.deploymentTransaction().hash,
      contract
    };
    
    this.deployedContracts.set('TrustEscrow', deployment);
    console.log(`✅ TrustEscrow deployed at: ${deployment.address}`);
    
    return deployment;
  }

  /**
   * Deploy ReputationOracle contract
   */
  async deployReputationOracle() {
    console.log('🚀 Deploying ReputationOracle...');
    
    const artifact = this.loadContractArtifact('ReputationOracle');
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      this.signer
    );
    
    const contract = await factory.deploy({
      gasLimit: 2000000
    });
    
    await contract.waitForDeployment();
    
    const deployment = {
      name: 'ReputationOracle',
      address: contract.target,
      transactionHash: contract.deploymentTransaction().hash,
      contract
    };
    
    this.deployedContracts.set('ReputationOracle', deployment);
    console.log(`✅ ReputationOracle deployed at: ${deployment.address}`);
    
    return deployment;
  }

  /**
   * Deploy all core contracts
   */
  async deployAllContracts() {
    await this.initialize();
    await this.compileContracts();
    
    console.log('🚀 Starting full contract deployment...');
    
    const deployments = [];
    
    // Deploy in order of dependencies
    deployments.push(await this.deployOrchestrator());
    deployments.push(await this.deployTrustEscrow());
    deployments.push(await this.deployReputationOracle());
    
    console.log('\n📋 Deployment Summary:');
    deployments.forEach(deployment => {
      console.log(`  ${deployment.name}: ${deployment.address}`);
    });
    
    // Save deployment info
    await this.saveDeploymentInfo(deployments);
    
    return deployments;
  }

  /**
   * Save deployment information to Supabase
   */
  async saveDeploymentInfo(deployments) {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    const deploymentRecords = deployments.map(deployment => ({
      contract_name: deployment.name,
      contract_address: deployment.address,
      deployment_tx: deployment.transactionHash,
      abi: this.loadContractArtifact(deployment.name).abi,
      deployed_at: new Date().toISOString(),
      deployer: this.signer.address,
      network: 'private-blockchain'
    }));
    
    const { error } = await supabase
      .from('deployed_contracts')
      .insert(deploymentRecords);
    
    if (error) {
      console.error('❌ Failed to save deployment info:', error);
    } else {
      console.log('✅ Deployment info saved to Supabase');
    }
  }

  /**
   * Verify contracts are working
   */
  async verifyDeployments() {
    console.log('🔍 Verifying contract deployments...');
    
    for (const [name, deployment] of this.deployedContracts) {
      try {
        // Check if contract exists at address
        const code = await this.provider.getCode(deployment.address);
        if (code === '0x') {
          throw new Error(`No contract code at ${deployment.address}`);
        }
        
        // Test basic functionality
        await this.testContractFunctionality(name, deployment);
        
        console.log(`✅ ${name} verification passed`);
      } catch (error) {
        console.error(`❌ ${name} verification failed:`, error);
        throw error;
      }
    }
  }

  /**
   * Test basic contract functionality
   */
  async testContractFunctionality(name, deployment) {
    const { contract } = deployment;
    
    switch (name) {
      case 'A2AOrchestrator':
        // Test creating a process
        const tx = await contract.createProcess('Test Process');
        await tx.wait();
        break;
        
      case 'ReputationOracle':
        // Test agent registration
        const regTx = await contract.registerAgent('Test Agent');
        await regTx.wait();
        break;
        
      case 'TrustEscrow':
        // Test creating escrow (requires ETH)
        const escrowId = ethers.solidityPackedKeccak256(['string'], ['test']);
        const escrowTx = await contract.createEscrow(
          escrowId,
          this.signer.address,
          Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          'test-data-hash',
          { value: ethers.parseEther('0.1') }
        );
        await escrowTx.wait();
        break;
    }
  }

  /**
   * Get deployment summary
   */
  getDeploymentSummary() {
    const summary = {
      totalContracts: this.deployedContracts.size,
      contracts: [],
      deployedAt: new Date().toISOString()
    };
    
    for (const [name, deployment] of this.deployedContracts) {
      summary.contracts.push({
        name,
        address: deployment.address,
        transactionHash: deployment.transactionHash
      });
    }
    
    return summary;
  }
}

// CLI execution
if (require.main === module) {
  const pipeline = new ContractDeploymentPipeline();
  
  pipeline.deployAllContracts()
    .then(deployments => {
      console.log('\n🎉 All contracts deployed successfully!');
      return pipeline.verifyDeployments();
    })
    .then(() => {
      console.log('\n✅ All contracts verified successfully!');
      console.log('\n📊 Final Summary:');
      console.log(JSON.stringify(pipeline.getDeploymentSummary(), null, 2));
    })
    .catch(error => {
      console.error('\n❌ Deployment pipeline failed:', error);
      process.exit(1);
    });
}

module.exports = { ContractDeploymentPipeline };
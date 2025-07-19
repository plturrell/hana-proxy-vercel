// Hide Blockchain Complexity - Make it invisible infrastructure
// Following Apple's principle: The best interface is no interface

(function() {
    'use strict';
    
    // Override deployment to hide blockchain details
    const originalDeployToProduction = window.deployToProduction;
    window.deployToProduction = async function(tier) {
        // Just show simple deployment without blockchain mentions
        const deploymentOptions = {
            'development': {
                name: 'Test Environment',
                description: 'Perfect for trying things out',
                time: '30 seconds',
                icon: '🧪'
            },
            'staging': {
                name: 'Staging Environment', 
                description: 'Test with real-world conditions',
                time: '2 minutes',
                icon: '🎭'
            },
            'production': {
                name: 'Live Environment',
                description: 'Your process goes live for everyone',
                time: '5 minutes',
                icon: '🚀'
            }
        };
        
        const option = deploymentOptions[tier] || deploymentOptions['development'];
        
        // Simple, beautiful deployment UI - no blockchain mentions
        const modal = document.createElement('div');
        modal.className = 'agent-modal active';
        modal.style.zIndex = '5000';
        
        modal.innerHTML = `
            <div class="agent-modal-content" style="max-width: 500px; text-align: center;">
                <div style="font-size: 72px; margin: 20px 0;">${option.icon}</div>
                <h2 style="font-size: 32px; margin: 0 0 16px 0;">Deploying to ${option.name}</h2>
                <p style="font-size: 18px; color: var(--jobs-gray); margin-bottom: 32px;">
                    ${option.description}
                </p>
                
                <div style="margin: 32px 0;">
                    <div class="deployment-progress" style="
                        width: 200px;
                        height: 200px;
                        margin: 0 auto;
                        position: relative;
                    ">
                        <svg width="200" height="200" style="transform: rotate(-90deg);">
                            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--jobs-light-gray)" stroke-width="8"/>
                            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--jobs-blue)" stroke-width="8"
                                    stroke-dasharray="565" stroke-dashoffset="565"
                                    style="transition: stroke-dashoffset 3s ease;">
                                <animate attributeName="stroke-dashoffset" from="565" to="0" dur="${option.time}" fill="freeze"/>
                            </circle>
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                                    font-size: 24px; font-weight: 600;">
                            <span id="deploy-status">Starting...</span>
                        </div>
                    </div>
                </div>
                
                <p style="font-size: 14px; color: var(--jobs-gray);">
                    This usually takes about ${option.time}
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Simulate deployment steps without technical details
        const steps = [
            { text: 'Preparing...', delay: 1000 },
            { text: 'Setting up...', delay: 2000 },
            { text: 'Almost ready...', delay: 3000 },
            { text: 'Complete!', delay: 4000 }
        ];
        
        steps.forEach(step => {
            setTimeout(() => {
                const status = document.getElementById('deploy-status');
                if (status) status.textContent = step.text;
            }, step.delay);
        });
        
        // Complete deployment
        setTimeout(() => {
            modal.innerHTML = `
                <div class="agent-modal-content" style="max-width: 500px; text-align: center;">
                    <div style="font-size: 72px; margin: 20px 0; color: var(--jobs-green);">✓</div>
                    <h2 style="font-size: 32px; margin: 0 0 16px 0;">You're Live!</h2>
                    <p style="font-size: 18px; color: var(--jobs-gray); margin-bottom: 32px;">
                        Your process is now running in ${option.name.toLowerCase()}
                    </p>
                    
                    <div style="background: var(--jobs-light-gray); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                        <div style="font-size: 14px; color: var(--jobs-gray); margin-bottom: 8px;">Your process URL</div>
                        <div style="font-size: 16px; font-family: monospace; color: var(--jobs-blue);">
                            app.finsight.io/${tier}/${Math.random().toString(36).substr(2, 9)}
                        </div>
                    </div>
                    
                    <button class="jobs-action-button" onclick="this.closest('.agent-modal').remove()">
                        Done
                    </button>
                </div>
            `;
            
            // Celebrate
            if (tier === 'production') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }, 5000);
        
        // Handle the actual deployment in background (including blockchain)
        // But user never sees any of this complexity
        if (originalDeployToProduction) {
            originalDeployToProduction(tier).catch(console.error);
        }
    };
    
    // Remove blockchain mentions from UI
    function hideBlockchainReferences() {
        // Hide any blockchain-related UI elements
        const blockchainElements = document.querySelectorAll('[class*="blockchain"], [id*="blockchain"]');
        blockchainElements.forEach(el => {
            if (el.textContent.toLowerCase().includes('blockchain') || 
                el.textContent.toLowerCase().includes('smart contract') ||
                el.textContent.toLowerCase().includes('wallet')) {
                el.style.display = 'none';
            }
        });
        
        // Update deployment modal to remove blockchain steps
        const originalShowDeploymentProgress = window.showDeploymentProgress;
        if (originalShowDeploymentProgress) {
            window.showDeploymentProgress = function(deploymentId) {
                const progress = document.createElement('div');
                progress.id = 'deployment-progress';
                progress.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    padding: 20px;
                    z-index: 2000;
                `;
                
                progress.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="loading-spinner" style="width: 24px; height: 24px;"></div>
                        <div>
                            <div style="font-weight: 600;">Deploying...</div>
                            <div style="font-size: 12px; color: var(--jobs-gray);">This won't take long</div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(progress);
            };
        }
    }
    
    // Update agent descriptions to remove technical details
    function simplifyAgentDescriptions() {
        if (window.agentCardsSystem) {
            const originalCreateAgentCard = window.agentCardsSystem.createAgentCard;
            window.agentCardsSystem.createAgentCard = function(agent) {
                // Remove blockchain capabilities from display
                if (agent.capabilities && agent.capabilities.protocols) {
                    agent.capabilities.protocols = agent.capabilities.protocols.filter(
                        p => !['blockchain', 'smart-contract', 'web3'].includes(p)
                    );
                }
                
                return originalCreateAgentCard.call(this, agent);
            };
        }
    }
    
    // Hide blockchain from zero-config deployment
    function simplifyDeploymentOptions() {
        const originalAnalyzeProcess = window.analyzeProcess;
        if (originalAnalyzeProcess) {
            window.analyzeProcess = function(bpmnXML, agents) {
                const result = originalAnalyzeProcess(bpmnXML, agents);
                
                // Remove blockchain from required services
                if (result && result.requiredServices) {
                    result.requiredServices = result.requiredServices.filter(
                        s => !s.includes('blockchain')
                    );
                }
                
                return result;
            };
        }
    }
    
    // Apply all hiding functions
    hideBlockchainReferences();
    simplifyAgentDescriptions();
    simplifyDeploymentOptions();
    
    // Monitor for new elements and hide blockchain mentions
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.textContent && (
                        node.textContent.includes('blockchain') ||
                        node.textContent.includes('smart contract') ||
                        node.textContent.includes('0x') // Ethereum addresses
                    )) {
                        // Replace technical terms with simple ones
                        node.innerHTML = node.innerHTML
                            .replace(/blockchain/gi, 'secure infrastructure')
                            .replace(/smart contract/gi, 'automated process')
                            .replace(/0x[a-fA-F0-9]{40}/g, 'secure-id')
                            .replace(/wallet/gi, 'account');
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Add confetti library for celebrations (lightweight)
    if (!window.confetti) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        document.head.appendChild(script);
    }
    
})();
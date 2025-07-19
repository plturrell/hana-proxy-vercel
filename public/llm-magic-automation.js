// LLM Magic Automation - Hide ALL complexity with AI
// Making the interface disappear through intelligent automation

class LLMMagicAutomation {
    constructor() {
        this.llmEndpoint = '/api/llm-automation';
        this.setupAutoFixers();
        this.setupNaturalLanguage();
        this.setupSmartDefaults();
    }
    
    // 1. AUTO-FIX VALIDATION ERRORS
    setupAutoFixers() {
        // Override validation to add AI fixes
        const originalValidate = window.validateProcess;
        window.validateProcess = async function() {
            const result = await originalValidate();
            
            if (result.errors.length > 0 || result.warnings.length > 0) {
                // Add AI fix button to each issue
                result.errors = result.errors.map(error => ({
                    ...error,
                    fix: () => window.llmMagic.autoFixError(error)
                }));
                
                result.warnings = result.warnings.map(warning => ({
                    ...warning,
                    fix: () => window.llmMagic.autoFixWarning(warning)
                }));
                
                // Show friendly UI
                window.llmMagic.showValidationWithFixes(result);
            }
            
            return result;
        };
    }
    
    async autoFixError(error) {
        // Common auto-fixes without even calling LLM
        const autoFixes = {
            'no incoming flow': async (elementId) => {
                const element = modeler.get('elementRegistry').get(elementId);
                const previousTask = this.findNearestPreviousTask(element);
                if (previousTask) {
                    this.connectElements(previousTask, element);
                    showNotification('✓ Connected to previous step', 'success');
                }
            },
            'no agent assigned': async (elementId) => {
                const element = modeler.get('elementRegistry').get(elementId);
                const suggestedAgent = await this.suggestAgentForTask(element);
                if (suggestedAgent) {
                    this.assignAgent(element, suggestedAgent);
                    showNotification(`✓ Assigned ${suggestedAgent.name}`, 'success');
                }
            },
            'disconnected element': async (elementId) => {
                const element = modeler.get('elementRegistry').get(elementId);
                await this.intelligentlyConnectElement(element);
                showNotification('✓ Connected element to flow', 'success');
            }
        };
        
        // Find matching fix
        for (const [key, fixer] of Object.entries(autoFixes)) {
            if (error.message.toLowerCase().includes(key)) {
                await fixer(error.elementId);
                return;
            }
        }
        
        // If no auto-fix, use LLM
        await this.llmAutoFix(error);
    }
    
    async llmAutoFix(error) {
        // Call LLM to understand and fix the error
        const response = await fetch(this.llmEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'fix-error',
                error: error.message,
                context: await this.getProcessContext()
            })
        });
        
        const fix = await response.json();
        await this.applyFix(fix);
    }
    
    showValidationWithFixes(result) {
        const modal = document.createElement('div');
        modal.className = 'agent-modal active';
        modal.innerHTML = `
            <div class="agent-modal-content" style="max-width: 600px;">
                <div class="agent-modal-header">
                    <h2 class="agent-modal-title">Let's fix these issues together</h2>
                    <button class="agent-modal-close" onclick="this.closest('.agent-modal').remove()">×</button>
                </div>
                <div class="agent-modal-body">
                    ${result.errors.length > 0 ? `
                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--jobs-red);">
                            Things to fix:
                        </h3>
                        ${result.errors.map((error, i) => `
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
                                        padding: 12px; background: var(--jobs-light-gray); border-radius: 8px;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500;">${this.humanizeError(error.message)}</div>
                                    <div style="font-size: 12px; color: var(--jobs-gray); margin-top: 4px;">
                                        ${this.explainError(error.message)}
                                    </div>
                                </div>
                                <button class="jobs-action-button" style="background: var(--jobs-green); color: white;"
                                        onclick="window.llmMagic.autoFixError(${JSON.stringify(error).replace(/"/g, '&quot;')})">
                                    Fix This
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; padding: 20px; background: var(--jobs-light-gray); border-radius: 12px;">
                        <button class="jobs-action-button" style="background: linear-gradient(135deg, var(--jobs-green), var(--jobs-teal)); 
                                                                   color: white; font-size: 16px; padding: 12px 32px;"
                                onclick="window.llmMagic.fixAllIssues()">
                            ✨ Fix Everything Automatically
                        </button>
                        <p style="font-size: 12px; color: var(--jobs-gray); margin-top: 8px;">
                            AI will intelligently fix all issues at once
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    humanizeError(technicalError) {
        const translations = {
            'has no incoming flow': 'isn\'t connected to anything before it',
            'has no outgoing flow': 'doesn\'t lead anywhere',
            'has no agent assigned': 'needs someone to handle it',
            'disconnected element': 'is floating by itself',
            'missing end event': 'doesn\'t have a proper ending',
            'cycle detected': 'creates an infinite loop'
        };
        
        for (const [tech, human] of Object.entries(translations)) {
            if (technicalError.includes(tech)) {
                return technicalError.replace(tech, human);
            }
        }
        
        return technicalError;
    }
    
    explainError(error) {
        const explanations = {
            'incoming flow': 'Every step needs to come from somewhere. I can connect it to the previous step.',
            'outgoing flow': 'Every step needs to go somewhere. I can connect it to the next logical step.',
            'agent assigned': 'This task needs an expert to handle it. I\'ll suggest the best one.',
            'disconnected': 'This step is isolated. I\'ll connect it where it makes sense.',
            'end event': 'Every process needs a clear ending. I\'ll add one.',
            'cycle': 'This creates a loop that never ends. I\'ll add a proper exit condition.'
        };
        
        for (const [key, explanation] of Object.entries(explanations)) {
            if (error.toLowerCase().includes(key)) {
                return explanation;
            }
        }
        
        return 'I can fix this for you automatically.';
    }
    
    // 2. NATURAL LANGUAGE PROCESS BUILDER
    setupNaturalLanguage() {
        // Add natural language input
        const nlInput = document.createElement('div');
        nlInput.style.cssText = `
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            background: white;
            padding: 12px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            display: none;
        `;
        
        nlInput.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <input type="text" 
                       id="nl-process-input"
                       placeholder="Describe what you want to build..."
                       style="width: 400px; padding: 12px; border: 2px solid var(--jobs-blue); 
                              border-radius: 8px; font-size: 16px; outline: none;"
                       onkeypress="if(event.key === 'Enter') window.llmMagic.buildFromDescription()">
                <button class="jobs-action-button" style="background: var(--jobs-blue); color: white;"
                        onclick="window.llmMagic.buildFromDescription()">
                    ✨ Build
                </button>
            </div>
            <div style="font-size: 12px; color: var(--jobs-gray); margin-top: 8px; text-align: center;">
                Try: "Create a daily risk assessment that alerts if portfolio risk exceeds limits"
            </div>
        `;
        
        document.body.appendChild(nlInput);
        
        // Add keyboard shortcut (Cmd+K)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                nlInput.style.display = nlInput.style.display === 'none' ? 'block' : 'none';
                if (nlInput.style.display === 'block') {
                    document.getElementById('nl-process-input').focus();
                }
            }
        });
    }
    
    async buildFromDescription() {
        const input = document.getElementById('nl-process-input');
        const description = input.value.trim();
        if (!description) return;
        
        // Show building animation
        this.showBuildingAnimation();
        
        // Call LLM to parse and build
        const response = await fetch(this.llmEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'build-from-description',
                description: description,
                availableAgents: await this.getAvailableAgents()
            })
        });
        
        const processDesign = await response.json();
        
        // Build the process
        await this.buildProcess(processDesign);
        
        // Hide input and show success
        input.value = '';
        input.parentElement.parentElement.style.display = 'none';
        showNotification('✨ Process created from your description!', 'success', 5000);
    }
    
    showBuildingAnimation() {
        const animation = document.createElement('div');
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
        `;
        
        animation.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🤖</div>
            <h3 style="font-size: 24px; margin: 0 0 12px 0;">AI is building your process...</h3>
            <p style="color: var(--jobs-gray);">This usually takes 5-10 seconds</p>
            <div class="loading-dots" style="font-size: 32px; margin-top: 20px;">
                <span>.</span><span>.</span><span>.</span>
            </div>
        `;
        
        document.body.appendChild(animation);
        
        // Animate dots
        const dots = animation.querySelectorAll('.loading-dots span');
        dots.forEach((dot, i) => {
            dot.style.animation = `pulse 1.4s infinite ${i * 0.2}s`;
        });
        
        // Remove after build completes
        setTimeout(() => animation.remove(), 10000);
    }
    
    // 3. SMART DEFAULTS FOR EVERYTHING
    setupSmartDefaults() {
        // Override deployment to use smart defaults
        const originalDeploy = window.deployToProduction;
        window.deployToProduction = async function(tier) {
            if (!tier) {
                // AI chooses the best tier
                tier = await window.llmMagic.chooseBestDeploymentTier();
            }
            
            return originalDeploy(tier);
        };
        
        // Override agent selection with smart suggestions
        const originalShowServiceTaskModal = window.showServiceTaskModal;
        window.showServiceTaskModal = async function(element) {
            // Get AI suggestion for best agent
            const suggestion = await window.llmMagic.suggestAgentForTask(element);
            
            if (suggestion && suggestion.confidence > 0.8) {
                // High confidence - just assign it
                window.llmMagic.assignAgent(element, suggestion);
                showNotification(`✓ Assigned ${suggestion.name} (AI was ${Math.round(suggestion.confidence * 100)}% confident)`, 'success');
            } else {
                // Show modal with suggestion highlighted
                originalShowServiceTaskModal(element);
                setTimeout(() => {
                    window.llmMagic.highlightSuggestedAgent(suggestion);
                }, 100);
            }
        };
    }
    
    async chooseBestDeploymentTier() {
        const analysis = await this.analyzeProcessComplexity();
        
        if (analysis.complexity < 10 && analysis.agentCount < 5) {
            return 'development';
        } else if (analysis.complexity < 30 && analysis.agentCount < 15) {
            return 'staging';
        } else {
            return 'production';
        }
    }
    
    async suggestAgentForTask(element) {
        const taskName = element.businessObject.name || '';
        const context = await this.getTaskContext(element);
        
        // Local intelligence first (no API call needed)
        const suggestions = {
            'risk': ['risk-assessment-agent', 'var-calculation-agent'],
            'portfolio': ['portfolio-optimization-agent', 'portfolio-analyzer'],
            'market': ['market-sentiment-agent', 'market-data-agent'],
            'trade': ['trading-execution-agent', 'trading-strategy-agent'],
            'hedge': ['hedge-calculation-agent', 'hedging-strategy-agent'],
            'compliance': ['compliance-officer-agent', 'regulation-monitor']
        };
        
        // Find best match
        for (const [keyword, agents] of Object.entries(suggestions)) {
            if (taskName.toLowerCase().includes(keyword)) {
                const agent = await this.getAgentDetails(agents[0]);
                return { ...agent, confidence: 0.9 };
            }
        }
        
        // If no local match, use LLM
        return await this.llmSuggestAgent(taskName, context);
    }
    
    // 4. ONE-CLICK EVERYTHING
    async fixAllIssues() {
        const result = await validateProcess();
        const allIssues = [...result.errors, ...result.warnings];
        
        showNotification('🤖 AI is fixing all issues...', 'info');
        
        for (const issue of allIssues) {
            await this.autoFixError(issue);
            await new Promise(resolve => setTimeout(resolve, 500)); // Smooth animation
        }
        
        showNotification('✨ All issues fixed!', 'success');
        document.querySelector('.agent-modal')?.remove();
        
        // Re-validate to show clean state
        validateProcess();
    }
    
    // 5. PREDICTIVE AUTOMATION
    async setupPredictiveAutomation() {
        // Watch user actions and predict next steps
        const eventBus = modeler.get('eventBus');
        
        eventBus.on('element.added', async (event) => {
            const element = event.element;
            
            // Predict what user wants to do next
            const prediction = await this.predictNextAction(element);
            
            if (prediction.confidence > 0.7) {
                this.showPredictiveSuggestion(prediction);
            }
        });
    }
    
    showPredictiveSuggestion(prediction) {
        const suggestion = document.createElement('div');
        suggestion.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: var(--jobs-blue);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease;
            z-index: 1000;
        `;
        
        suggestion.innerHTML = `
            <span>${prediction.message}</span>
            <button style="background: white; color: var(--jobs-blue); border: none; 
                           padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;"
                    onclick="window.llmMagic.acceptPrediction('${prediction.id}')">
                Do it
            </button>
            <button style="background: transparent; color: white; border: none; 
                           padding: 8px; cursor: pointer; opacity: 0.8;"
                    onclick="this.parentElement.remove()">
                ×
            </button>
        `;
        
        document.body.appendChild(suggestion);
        
        // Auto-hide after 10 seconds
        setTimeout(() => suggestion.remove(), 10000);
    }
}

// Initialize LLM Magic
window.llmMagic = new LLMMagicAutomation();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .loading-spinner {
        border: 3px solid var(--jobs-light-gray);
        border-top: 3px solid var(--jobs-blue);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
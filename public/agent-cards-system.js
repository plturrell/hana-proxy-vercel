// Agent Cards System - Visual drag & drop for our 32 analytics agents
// Implements Jony Ive's design philosophy: Simple, Beautiful, Intuitive

class AgentCardsSystem {
    constructor() {
        this.agents = [];
        this.selectedAgent = null;
        this.draggedAgent = null;
        this.container = null;
    }
    
    async initialize() {
        // Fetch all 32 analytics agents
        const response = await fetch('/api/a2a-standard-adapter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' })
        });
        
        const result = await response.json();
        if (result.agents) {
            this.agents = this.categorizeAgents(result.agents);
        }
    }
    
    categorizeAgents(agents) {
        // Group agents by their primary capability for better UX
        const categories = {
            'Risk Analysis': [],
            'Portfolio Management': [],
            'Market Intelligence': [],
            'Trading & Execution': [],
            'Advanced Analytics': []
        };
        
        agents.forEach(agent => {
            if (agent.agent_type.includes('risk') || agent.agent_type.includes('var')) {
                categories['Risk Analysis'].push(agent);
            } else if (agent.agent_type.includes('portfolio') || agent.agent_type.includes('optimization')) {
                categories['Portfolio Management'].push(agent);
            } else if (agent.agent_type.includes('market') || agent.agent_type.includes('sentiment')) {
                categories['Market Intelligence'].push(agent);
            } else if (agent.agent_type.includes('trading') || agent.agent_type.includes('execution')) {
                categories['Trading & Execution'].push(agent);
            } else {
                categories['Advanced Analytics'].push(agent);
            }
        });
        
        return categories;
    }
    
    renderAgentCards(containerId, onSelectCallback) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        Object.entries(this.agents).forEach(([category, agentList]) => {
            if (agentList.length === 0) return;
            
            const categorySection = document.createElement('div');
            categorySection.className = 'agent-category-section';
            categorySection.style.marginBottom = '24px';
            
            categorySection.innerHTML = `
                <h4 style="font-size: 14px; font-weight: 600; color: var(--jobs-gray); 
                           margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${category}
                </h4>
                <div class="agent-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
                    ${agentList.map(agent => this.createAgentCard(agent)).join('')}
                </div>
            `;
            
            this.container.appendChild(categorySection);
        });
        
        // Attach event handlers
        this.attachEventHandlers(onSelectCallback);
    }
    
    createAgentCard(agent) {
        // Extract key capabilities for display
        const capabilities = agent.capabilities?.domains?.slice(0, 2) || [];
        const personality = this.getPersonalityIcon(agent.personality);
        
        return `
            <div class="agent-card" 
                 data-agent-id="${agent.agent_id}"
                 draggable="true"
                 style="
                    background: white;
                    border: 2px solid transparent;
                    border-radius: 12px;
                    padding: 16px;
                    cursor: grab;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                 "
                 onmouseover="this.style.borderColor='var(--jobs-blue)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'"
                 onmouseout="this.style.borderColor='transparent'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'">
                
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--jobs-blue), var(--jobs-purple));
                                border-radius: 8px; display: flex; align-items: center; justify-content: center;
                                font-size: 20px; color: white;">
                        ${personality}
                    </div>
                    <div style="flex: 1;">
                        <h5 style="margin: 0; font-size: 16px; font-weight: 600;">${agent.name}</h5>
                        <p style="margin: 0; font-size: 12px; color: var(--jobs-gray);">
                            ${this.humanizeAgentType(agent.agent_type)}
                        </p>
                    </div>
                </div>
                
                ${capabilities.length > 0 ? `
                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
                    ${capabilities.map(cap => `
                        <span style="background: var(--jobs-light-gray); color: var(--jobs-gray);
                                     padding: 4px 8px; border-radius: 6px; font-size: 11px;">
                            ${this.humanizeCapability(cap)}
                        </span>
                    `).join('')}
                </div>
                ` : ''}
                
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-size: 12px; color: var(--jobs-green);">
                        ✓ Ready to use
                    </span>
                    <span style="font-size: 11px; color: var(--jobs-gray);">
                        Drag to canvas
                    </span>
                </div>
            </div>
        `;
    }
    
    getPersonalityIcon(personality) {
        const icons = {
            'analytical': '📊',
            'risk-aware': '🛡️',
            'performance-focused': '🎯',
            'market-savvy': '📈',
            'strategic': '♟️',
            'quantitative': '🔢',
            'adaptive': '🔄',
            'conservative': '🏦',
            'innovative': '💡',
            'methodical': '📋'
        };
        
        for (const [key, icon] of Object.entries(icons)) {
            if (personality?.toLowerCase().includes(key)) {
                return icon;
            }
        }
        return '🤖';
    }
    
    humanizeAgentType(type) {
        const mappings = {
            'risk-assessment': 'Risk Analyst',
            'portfolio-optimization': 'Portfolio Optimizer',
            'market-sentiment': 'Market Intelligence',
            'trading-strategy': 'Trading Strategist',
            'var-calculation': 'Value at Risk Calculator',
            'correlation-analysis': 'Correlation Analyst',
            'monte-carlo': 'Monte Carlo Simulator',
            'black-scholes': 'Options Pricing Expert'
        };
        
        return mappings[type] || type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    humanizeCapability(capability) {
        const mappings = {
            'risk-assessment': 'Risk Analysis',
            'portfolio-optimization': 'Portfolio Mgmt',
            'market-data': 'Market Data',
            'real-time-analytics': 'Real-time',
            'historical-analysis': 'Historical',
            'predictive-modeling': 'Predictions',
            'compliance': 'Compliance',
            'reporting': 'Reports'
        };
        
        return mappings[capability] || capability.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).slice(0, 2).join(' ');
    }
    
    attachEventHandlers(onSelectCallback) {
        const cards = this.container.querySelectorAll('.agent-card');
        
        cards.forEach(card => {
            // Click to select
            card.addEventListener('click', (e) => {
                // Remove previous selection
                cards.forEach(c => c.style.borderColor = 'transparent');
                
                // Select this card
                card.style.borderColor = 'var(--jobs-blue)';
                
                const agentId = card.dataset.agentId;
                const agent = this.findAgentById(agentId);
                
                if (agent && onSelectCallback) {
                    onSelectCallback(agent);
                }
            });
            
            // Drag start
            card.addEventListener('dragstart', (e) => {
                this.draggedAgent = this.findAgentById(card.dataset.agentId);
                card.style.cursor = 'grabbing';
                card.style.opacity = '0.5';
                
                // Create custom drag image
                const dragImage = this.createDragPreview(this.draggedAgent);
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 50, 50);
                
                // Store agent data
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('agent', JSON.stringify(this.draggedAgent));
                
                // Clean up drag image after a moment
                setTimeout(() => dragImage.remove(), 0);
            });
            
            // Drag end
            card.addEventListener('dragend', (e) => {
                card.style.cursor = 'grab';
                card.style.opacity = '1';
                this.draggedAgent = null;
            });
        });
    }
    
    createDragPreview(agent) {
        const preview = document.createElement('div');
        preview.style.cssText = `
            position: absolute;
            top: -1000px;
            left: -1000px;
            background: white;
            border: 2px solid var(--jobs-blue);
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            font-size: 14px;
            font-weight: 600;
            color: var(--jobs-blue);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        preview.innerHTML = `
            <span style="font-size: 20px;">${this.getPersonalityIcon(agent.personality)}</span>
            <span>${agent.name}</span>
        `;
        
        return preview;
    }
    
    findAgentById(agentId) {
        for (const category of Object.values(this.agents)) {
            const agent = category.find(a => a.agent_id === agentId);
            if (agent) return agent;
        }
        return null;
    }
    
    setupCanvasDropZone(modeler) {
        const canvas = modeler.get('canvas')._container;
        
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            
            // Show drop indicator
            canvas.style.backgroundColor = 'rgba(0, 122, 255, 0.05)';
        });
        
        canvas.addEventListener('dragleave', (e) => {
            canvas.style.backgroundColor = '';
        });
        
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.style.backgroundColor = '';
            
            const agentData = e.dataTransfer.getData('agent');
            if (!agentData) return;
            
            const agent = JSON.parse(agentData);
            const canvasPosition = canvas.getBoundingClientRect();
            
            // Calculate drop position
            const x = e.clientX - canvasPosition.left;
            const y = e.clientY - canvasPosition.top;
            
            // Create service task at drop position
            this.createAgentTask(modeler, agent, { x, y });
        });
    }
    
    createAgentTask(modeler, agent, position) {
        const elementFactory = modeler.get('elementFactory');
        const modeling = modeler.get('modeling');
        const canvas = modeler.get('canvas');
        const rootElement = canvas.getRootElement();
        
        // Convert screen coordinates to diagram coordinates
        const viewbox = canvas.viewbox();
        const diagramPosition = {
            x: viewbox.x + (position.x / viewbox.scale),
            y: viewbox.y + (position.y / viewbox.scale)
        };
        
        // Create service task with agent metadata
        const serviceTask = elementFactory.createShape({
            type: 'bpmn:ServiceTask',
            businessObject: modeler.get('moddle').create('bpmn:ServiceTask', {
                name: agent.name,
                'a2a:agentId': agent.agent_id,
                'a2a:agentType': agent.agent_type
            })
        });
        
        // Add to diagram
        modeling.createShape(serviceTask, diagramPosition, rootElement);
        
        // Show success feedback
        this.showDropFeedback(agent);
    }
    
    showDropFeedback(agent) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--jobs-green);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        
        feedback.textContent = `✓ Added ${agent.name} to your process`;
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
}

// Export for use in main file
window.AgentCardsSystem = AgentCardsSystem;
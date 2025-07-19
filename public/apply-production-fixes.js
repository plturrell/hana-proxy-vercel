// Apply Production Fixes to BPMN Designer
// This script patches the existing bpmn-finsight.html with all critical fixes

(function() {
    'use strict';
    
    // Wait for DOM and modeler to be ready
    const originalInitModeler = window.initModeler;
    
    window.initModeler = async function() {
        // Call original initialization
        if (originalInitModeler) {
            await originalInitModeler();
        }
        
        // Apply all production fixes
        applyTemplateFixes();
        applyIconFixes();
        applyLanguageFixes();
        applyAgentCardsFixes();
        applyVisualHierarchyFixes();
        initializeProgressiveDisclosure();
    };
    
    // 1. Fix the template system
    function applyTemplateFixes() {
        // Override the fake loadTemplate function
        window.loadTemplate = async function(templateId) {
            const template = window.BPMN_PRODUCTION_FIXES.REAL_TEMPLATES[templateId];
            if (!template) {
                window.showNotification('Template not found', 'error');
                return;
            }
            
            window.showNotification(`Loading ${template.name}...`, 'info');
            
            try {
                await window.modeler.importXML(template.bpmn);
                
                const canvas = window.modeler.get('canvas');
                canvas.zoom('fit-viewport', 'auto');
                
                // Show success modal
                showTemplateSuccessModal(template);
                
                // Track usage
                window.progressiveDisclosure?.incrementUsage();
                
            } catch (error) {
                console.error('Failed to load template:', error);
                window.showNotification('Failed to load template', 'error');
            }
        };
    }
    
    function showTemplateSuccessModal(template) {
        const modal = document.createElement('div');
        modal.className = 'agent-modal active';
        modal.style.zIndex = '5000';
        
        modal.innerHTML = `
            <div class="agent-modal-content" style="max-width: 500px; text-align: center;">
                <div style="font-size: 64px; margin: 20px 0;">${template.icon}</div>
                <h2 style="font-size: 28px; margin: 0 0 16px 0;">${template.name}</h2>
                <p style="font-size: 18px; color: var(--jobs-gray); margin-bottom: 24px;">
                    ${template.preview}
                </p>
                <div style="background: linear-gradient(135deg, var(--jobs-green), var(--jobs-teal)); 
                            color: white; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                    <div style="font-size: 14px; opacity: 0.9;">Previous Performance</div>
                    <div style="font-size: 20px; font-weight: 600;">${template.wow}</div>
                </div>
                <button class="jobs-action-button" onclick="this.closest('.agent-modal').remove()">
                    Start Customizing
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        }, 5000);
    }
    
    // 2. Fix icon chaos
    function applyIconFixes() {
        // Replace emoji icons in palette
        const paletteItems = document.querySelectorAll('.palette-item');
        paletteItems.forEach(item => {
            const label = item.querySelector('.palette-label')?.textContent?.toLowerCase();
            if (!label) return;
            
            const iconContainer = item.querySelector('.palette-icon');
            if (iconContainer) {
                let iconType = 'task';
                if (label.includes('start')) iconType = 'start';
                else if (label.includes('end')) iconType = 'end';
                else if (label.includes('gateway')) iconType = 'gateway';
                
                iconContainer.innerHTML = window.BPMN_PRODUCTION_FIXES.ICON_SYSTEM.getIcon(iconType);
                iconContainer.className = 'palette-icon-svg';
            }
        });
    }
    
    // 3. Humanize language
    function applyLanguageFixes() {
        // Update palette labels
        const labelMappings = {
            'Start': 'Start Process',
            'Task': 'Add Step', 
            'Gateway': 'Make Decision',
            'End': 'End Process'
        };
        
        document.querySelectorAll('.palette-label').forEach(label => {
            const text = label.textContent.trim();
            if (labelMappings[text]) {
                label.textContent = labelMappings[text];
            }
        });
        
        // Update properties panel headers
        const propertiesHeaders = document.querySelectorAll('.properties-section h4');
        propertiesHeaders.forEach(header => {
            if (header.textContent.includes('Properties')) {
                header.textContent = header.textContent.replace('Properties', 'Details');
            }
        });
        
        // Override modals to use humanized language
        const originalShowModal = window.showServiceTaskModal;
        if (originalShowModal) {
            window.showServiceTaskModal = function(element) {
                originalShowModal(element);
                
                // Update modal after it's created
                setTimeout(() => {
                    const modalTitle = document.querySelector('.agent-modal-title');
                    if (modalTitle && modalTitle.textContent.includes('Configure')) {
                        modalTitle.textContent = 'Tell this agent what to analyze';
                    }
                    
                    const selectLabel = document.querySelector('label[for="agent-select"]');
                    if (selectLabel) {
                        selectLabel.textContent = 'Which expert should handle this?';
                    }
                }, 50);
            };
        }
    }
    
    // 4. Initialize agent cards system
    function applyAgentCardsFixes() {
        if (!window.AgentCardsSystem) return;
        
        window.agentCardsSystem = new AgentCardsSystem();
        window.agentCardsSystem.initialize().then(() => {
            // Set up canvas drop zone
            if (window.modeler) {
                window.agentCardsSystem.setupCanvasDropZone(window.modeler);
            }
            
            // Replace dropdown in service task modal with cards
            const originalShowModal = window.showServiceTaskModal;
            if (originalShowModal) {
                window.showServiceTaskModal = function(element) {
                    const modal = document.createElement('div');
                    modal.className = 'agent-modal active';
                    modal.innerHTML = `
                        <div class="agent-modal-content">
                            <div class="agent-modal-header">
                                <h2 class="agent-modal-title">Choose an expert for this task</h2>
                                <button class="agent-modal-close" onclick="this.closest('.agent-modal').remove()">×</button>
                            </div>
                            <div class="agent-modal-body">
                                <div style="margin-bottom: 16px;">
                                    <input type="text" 
                                           placeholder="Search experts..." 
                                           class="bp4-input"
                                           style="width: 100%;"
                                           onkeyup="filterAgentCards(this.value)">
                                </div>
                                <div id="agent-cards-modal-container" style="max-height: 500px; overflow-y: auto;">
                                    <!-- Agent cards will be rendered here -->
                                </div>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(modal);
                    
                    // Render agent cards
                    window.agentCardsSystem.renderAgentCards('agent-cards-modal-container', (agent) => {
                        // Update element with selected agent
                        const modeling = window.modeler.get('modeling');
                        modeling.updateProperties(element, {
                            name: agent.name,
                            'a2a:agentId': agent.agent_id,
                            'a2a:agentType': agent.agent_type
                        });
                        
                        modal.remove();
                        window.showNotification(`Assigned ${agent.name} to this task`, 'success');
                    });
                };
            }
        });
    }
    
    // 5. Apply visual hierarchy improvements
    function applyVisualHierarchyFixes() {
        // Add CSS for better visual hierarchy
        const style = document.createElement('style');
        style.textContent = `
            /* Visual Hierarchy Improvements */
            .properties-section h4 {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: var(--jobs-black) !important;
                margin-bottom: 12px !important;
                text-transform: none !important;
                letter-spacing: 0 !important;
            }
            
            .properties-section label {
                font-size: 12px !important;
                font-weight: 500 !important;
                color: var(--jobs-gray) !important;
                margin-bottom: 4px !important;
            }
            
            .properties-section input,
            .properties-section select {
                font-size: 14px !important;
                padding: 8px 12px !important;
                border: 1px solid rgba(0, 0, 0, 0.1) !important;
                border-radius: 6px !important;
                transition: all 0.2s ease !important;
            }
            
            .properties-section input:focus,
            .properties-section select:focus {
                border-color: var(--jobs-blue) !important;
                outline: none !important;
                box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1) !important;
            }
            
            /* Reduce information density */
            .properties-section > div {
                margin-bottom: 20px !important;
            }
            
            /* Add breathing room */
            .properties-panel {
                padding: 20px !important;
            }
            
            /* Consistent icon styling */
            .palette-icon-svg {
                width: 36px;
                height: 36px;
                margin-bottom: 8px;
                color: var(--jobs-gray);
                transition: color 0.2s ease;
            }
            
            .palette-item:hover .palette-icon-svg {
                color: var(--jobs-blue);
            }
            
            /* Agent card improvements */
            .agent-category-section h4 {
                font-size: 13px;
                font-weight: 600;
                color: var(--jobs-gray);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 12px 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 6. Initialize progressive disclosure
    function initializeProgressiveDisclosure() {
        window.progressiveDisclosure = new window.BPMN_PRODUCTION_FIXES.ProgressiveDisclosure();
        
        // Hide/show features based on user level
        const checkFeatures = () => {
            // AI Optimization button
            const aiButton = document.querySelector('button[onclick="optimizeWithAI()"]');
            if (aiButton) {
                aiButton.style.display = window.progressiveDisclosure.shouldShowFeature('ai-optimization') ? '' : 'none';
            }
            
            // Collaboration button
            const collabButton = document.querySelector('button[onclick="startCollaboration()"]');
            if (collabButton) {
                collabButton.style.display = window.progressiveDisclosure.shouldShowFeature('collaboration') ? '' : 'none';
            }
            
            // Deployment options
            const deployButton = document.querySelector('button[onclick="deployToProduction()"]');
            if (deployButton) {
                deployButton.style.display = window.progressiveDisclosure.shouldShowFeature('deployment') ? '' : 'none';
            }
        };
        
        // Check on load and after actions
        checkFeatures();
        
        // Re-check after any significant action
        const originalSaveProcess = window.saveProcess;
        window.saveProcess = async function() {
            if (originalSaveProcess) await originalSaveProcess();
            window.progressiveDisclosure.incrementUsage();
            checkFeatures();
        };
    }
    
    // Helper function for agent card filtering
    window.filterAgentCards = function(searchTerm) {
        const cards = document.querySelectorAll('.agent-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('h5')?.textContent?.toLowerCase() || '';
            const type = card.querySelector('p')?.textContent?.toLowerCase() || '';
            
            if (name.includes(term) || type.includes(term)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Hide empty categories
        document.querySelectorAll('.agent-category-section').forEach(section => {
            const visibleCards = section.querySelectorAll('.agent-card:not([style*="display: none"])');
            section.style.display = visibleCards.length > 0 ? '' : 'none';
        });
    };
    
})();
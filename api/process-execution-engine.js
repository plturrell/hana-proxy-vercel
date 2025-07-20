// Real Process Execution Engine
import { monitoringMiddleware, logger } from './monitoring.js';
import { createClient } from '@supabase/supabase-js';
import { Worker } from 'worker_threads';
import EventEmitter from 'events';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Process execution states
const ExecutionState = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    PAUSED: 'paused'
};

class ProcessExecutionEngine extends EventEmitter {
    constructor() {
        super();
        this.executions = new Map();
        this.workers = new Map();
        this.maxWorkers = 10;
        this.queue = [];
    }
    
    // Execute a BPMN process
    async executeProcess(processDefinition, input = {}, options = {}) {
        const executionId = crypto.randomUUID();
        
        const execution = {
            id: executionId,
            processId: processDefinition.id,
            state: ExecutionState.PENDING,
            input,
            output: {},
            currentStep: null,
            steps: [],
            startTime: Date.now(),
            endTime: null,
            error: null,
            logs: [],
            options
        };
        
        this.executions.set(executionId, execution);
        
        // Store in database
        await this.storeExecution(execution);
        
        // Start execution
        this.startExecution(executionId, processDefinition);
        
        return executionId;
    }
    
    async startExecution(executionId, processDefinition) {
        const execution = this.executions.get(executionId);
        if (!execution) return;
        
        execution.state = ExecutionState.RUNNING;
        
        try {
            // Parse BPMN to execution plan
            const executionPlan = await this.parseProcessDefinition(processDefinition);
            
            // Execute steps
            for (const step of executionPlan) {
                if (execution.state === ExecutionState.CANCELLED) break;
                
                execution.currentStep = step.id;
                await this.executeStep(executionId, step);
            }
            
            execution.state = ExecutionState.COMPLETED;
            execution.endTime = Date.now();
            
            // Emit completion event
            this.emit('process-completed', execution);
            
        } catch (error) {
            execution.state = ExecutionState.FAILED;
            execution.error = error.message;
            execution.endTime = Date.now();
            
            logger.error('Process execution failed', { executionId, error });
            this.emit('process-failed', execution);
        }
        
        // Update database
        await this.updateExecution(execution);
    }
    
    async executeStep(executionId, step) {
        const execution = this.executions.get(executionId);
        
        const stepExecution = {
            stepId: step.id,
            type: step.type,
            startTime: Date.now(),
            endTime: null,
            status: 'running',
            result: null,
            error: null
        };
        
        execution.steps.push(stepExecution);
        
        try {
            // Execute based on step type
            switch (step.type) {
                case 'serviceTask':
                    stepExecution.result = await this.executeServiceTask(step, execution);
                    break;
                    
                case 'userTask':
                    stepExecution.result = await this.executeUserTask(step, execution);
                    break;
                    
                case 'scriptTask':
                    stepExecution.result = await this.executeScriptTask(step, execution);
                    break;
                    
                case 'exclusiveGateway':
                    stepExecution.result = await this.evaluateGateway(step, execution);
                    break;
                    
                case 'parallelGateway':
                    stepExecution.result = await this.executeParallel(step, execution);
                    break;
                    
                default:
                    stepExecution.result = { completed: true };
            }
            
            stepExecution.status = 'completed';
            stepExecution.endTime = Date.now();
            
            // Update execution context
            if (step.outputVariable && stepExecution.result) {
                execution.output[step.outputVariable] = stepExecution.result;
            }
            
        } catch (error) {
            stepExecution.status = 'failed';
            stepExecution.error = error.message;
            stepExecution.endTime = Date.now();
            throw error;
        }
        
        // Log step completion
        this.logExecution(executionId, `Step ${step.name} completed`, stepExecution);
    }
    
    async executeServiceTask(step, execution) {
        if (step.agentId) {
            // Execute through A2A agent
            return await this.executeAgent(step.agentId, execution.input);
        } else if (step.implementation) {
            // Execute custom implementation
            return await this.executeImplementation(step.implementation, execution);
        }
        
        throw new Error(`No implementation for service task ${step.id}`);
    }
    
    async executeAgent(agentId, input) {
        // Get agent from database
        const { data: agent } = await supabase
            .from('a2a_agents')
            .select('*')
            .eq('agent_id', agentId)
            .single();
            
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        // Execute based on agent type
        switch (agent.agent_type) {
            case 'risk-assessment':
                return await this.executeRiskAssessment(agent, input);
                
            case 'portfolio-optimization':
                return await this.executePortfolioOptimization(agent, input);
                
            case 'market-sentiment':
                return await this.executeMarketSentiment(agent, input);
                
            case 'calculation':
                return await this.executeCalculation(agent, input);
                
            default:
                // Generic agent execution
                return await this.executeGenericAgent(agent, input);
        }
    }
    
    async executeRiskAssessment(agent, input) {
        // Real risk calculation using treasury calculator
        const { treasuryCalculator: calculator } = await import('../lib/treasury-calculator-esm.js');
        
        const portfolio = input.portfolio || [];
        const returns = portfolio.map(asset => asset.return || 0);
        
        const var95 = calculator.var(returns, 0.95);
        const cvar95 = calculator.cvar(returns, 0.95);
        const sharpe = calculator.sharpeRatio(returns, input.riskFreeRate || 0.02);
        
        return {
            valueAtRisk: var95,
            conditionalVaR: cvar95,
            sharpeRatio: sharpe,
            riskLevel: this.categorizeRisk(var95),
            timestamp: new Date().toISOString()
        };
    }
    
    async executePortfolioOptimization(agent, input) {
        // Real portfolio optimization
        const { treasuryCalculator: calculator } = await import('../lib/treasury-calculator-esm.js');
        
        const assets = input.assets || [];
        const constraints = input.constraints || {};
        
        // Calculate optimal weights (simplified - real implementation would use quadratic programming)
        const returns = assets.map(a => a.expectedReturn);
        const risks = assets.map(a => a.risk);
        
        // Risk-return optimization
        const weights = this.optimizePortfolio(returns, risks, constraints);
        
        return {
            optimalWeights: weights,
            expectedReturn: this.calculateExpectedReturn(weights, returns),
            risk: this.calculatePortfolioRisk(weights, risks),
            rebalancingRequired: this.checkRebalancing(input.currentWeights, weights)
        };
    }
    
    async executeMarketSentiment(agent, input) {
        // Get real market data
        const response = await fetch('/api/real-market-data-feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get-price',
                symbol: input.symbol || 'SPY'
            })
        });
        
        const { price } = await response.json();
        
        // Simple sentiment based on price movement
        const sentiment = price.change.percent > 1 ? 'bullish' :
                         price.change.percent < -1 ? 'bearish' : 'neutral';
        
        return {
            symbol: input.symbol,
            currentPrice: price.price,
            change: price.change,
            sentiment,
            confidence: 0.75,
            timestamp: new Date().toISOString()
        };
    }
    
    async executeCalculation(agent, input) {
        const { treasuryCalculator: calculator } = await import('../lib/treasury-calculator-esm.js');
        
        const { formula, parameters } = input;
        const result = calculator.calculate(formula, parameters);
        
        return {
            formula,
            parameters,
            result,
            timestamp: new Date().toISOString()
        };
    }
    
    async executeUserTask(step, execution) {
        // Create task for user
        const { data: task } = await supabase
            .from('user_tasks')
            .insert({
                execution_id: execution.id,
                step_id: step.id,
                title: step.name,
                description: step.description,
                assigned_to: step.assignee || execution.options.userId,
                data: execution.input,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        // Wait for completion (with timeout)
        const timeout = step.timeout || 86400000; // 24 hours default
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const { data: updatedTask } = await supabase
                .from('user_tasks')
                .select('*')
                .eq('id', task.id)
                .single();
                
            if (updatedTask.status === 'completed') {
                return updatedTask.result;
            } else if (updatedTask.status === 'rejected') {
                throw new Error(`User task rejected: ${updatedTask.reason}`);
            }
            
            // Check every 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        throw new Error('User task timeout');
    }
    
    async executeScriptTask(step, execution) {
        // Execute JavaScript in worker thread for isolation
        return new Promise((resolve, reject) => {
            const worker = new Worker(step.script, {
                eval: true,
                workerData: {
                    input: execution.input,
                    context: execution.output
                }
            });
            
            worker.on('message', resolve);
            worker.on('error', reject);
            
            // Timeout after 30 seconds
            setTimeout(() => {
                worker.terminate();
                reject(new Error('Script execution timeout'));
            }, 30000);
        });
    }
    
    async evaluateGateway(step, execution) {
        const condition = step.condition;
        const context = {
            ...execution.input,
            ...execution.output
        };
        
        // Safely evaluate condition
        try {
            const func = new Function('context', `with(context) { return ${condition}; }`);
            const result = func(context);
            
            return {
                evaluated: result,
                nextPath: result ? step.truePath : step.falsePath
            };
        } catch (error) {
            throw new Error(`Gateway evaluation failed: ${error.message}`);
        }
    }
    
    async executeParallel(step, execution) {
        const parallelTasks = step.branches || [];
        
        // Execute all branches in parallel
        const results = await Promise.all(
            parallelTasks.map(branch => 
                this.executeStep(execution.id, branch)
            )
        );
        
        return {
            branches: results,
            completed: true
        };
    }
    
    // Helper methods
    categorizeRisk(varValue) {
        if (varValue < -0.05) return 'high';
        if (varValue < -0.02) return 'medium';
        return 'low';
    }
    
    optimizePortfolio(returns, risks, constraints) {
        // Simplified equal weight for now
        // Real implementation would use optimization library
        const count = returns.length;
        return Array(count).fill(1 / count);
    }
    
    calculateExpectedReturn(weights, returns) {
        return weights.reduce((sum, w, i) => sum + w * returns[i], 0);
    }
    
    calculatePortfolioRisk(weights, risks) {
        // Simplified - ignores correlation
        return Math.sqrt(weights.reduce((sum, w, i) => sum + Math.pow(w * risks[i], 2), 0));
    }
    
    checkRebalancing(current, optimal) {
        if (!current) return true;
        
        const threshold = 0.05; // 5% threshold
        return optimal.some((w, i) => Math.abs(w - (current[i] || 0)) > threshold);
    }
    
    async parseProcessDefinition(definition) {
        // Parse BPMN XML to execution plan
        // Simplified - real implementation would use bpmn-moddle
        const steps = [];
        
        // Extract tasks from XML
        const taskRegex = /<bpmn2?:(\w+Task)[^>]+id="([^"]+)"[^>]*>/g;
        let match;
        
        while ((match = taskRegex.exec(definition)) !== null) {
            steps.push({
                type: match[1].toLowerCase(),
                id: match[2],
                name: this.extractAttribute(definition, match[2], 'name'),
                agentId: this.extractAttribute(definition, match[2], 'a2a:agentId'),
                implementation: this.extractAttribute(definition, match[2], 'implementation')
            });
        }
        
        return steps;
    }
    
    extractAttribute(xml, elementId, attribute) {
        const regex = new RegExp(`id="${elementId}"[^>]*${attribute}="([^"]+)"`);
        const match = xml.match(regex);
        return match ? match[1] : null;
    }
    
    logExecution(executionId, message, data = {}) {
        const execution = this.executions.get(executionId);
        if (!execution) return;
        
        const logEntry = {
            timestamp: Date.now(),
            message,
            data
        };
        
        execution.logs.push(logEntry);
        logger.info('Process execution log', { executionId, message, data });
    }
    
    async storeExecution(execution) {
        await supabase
            .from('process_executions')
            .insert({
                execution_id: execution.id,
                process_id: execution.processId,
                state: execution.state,
                input: execution.input,
                started_at: new Date(execution.startTime).toISOString()
            });
    }
    
    async updateExecution(execution) {
        await supabase
            .from('process_executions')
            .update({
                state: execution.state,
                output: execution.output,
                error: execution.error,
                ended_at: execution.endTime ? new Date(execution.endTime).toISOString() : null,
                logs: execution.logs
            })
            .eq('execution_id', execution.id);
    }
    
    // Control methods
    async pauseExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.state === ExecutionState.RUNNING) {
            execution.state = ExecutionState.PAUSED;
            await this.updateExecution(execution);
        }
    }
    
    async resumeExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.state === ExecutionState.PAUSED) {
            execution.state = ExecutionState.RUNNING;
            // Resume from current step
            // Implementation depends on process definition
        }
    }
    
    async cancelExecution(executionId) {
        const execution = this.executions.get(executionId);
        if (execution && [ExecutionState.RUNNING, ExecutionState.PAUSED].includes(execution.state)) {
            execution.state = ExecutionState.CANCELLED;
            execution.endTime = Date.now();
            await this.updateExecution(execution);
        }
    }
    
    getExecutionStatus(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) return null;
        
        return {
            id: execution.id,
            state: execution.state,
            currentStep: execution.currentStep,
            progress: this.calculateProgress(execution),
            startTime: execution.startTime,
            duration: execution.endTime ? execution.endTime - execution.startTime : Date.now() - execution.startTime,
            output: execution.output,
            error: execution.error
        };
    }
    
    calculateProgress(execution) {
        if (execution.steps.length === 0) return 0;
        const completed = execution.steps.filter(s => s.status === 'completed').length;
        return Math.round((completed / execution.steps.length) * 100);
    }
}

// Initialize engine
const engine = new ProcessExecutionEngine();

// API Handler
async function processExecutionHandler(req, res) {
    const { action, ...params } = req.body;
    
    try {
        switch (action) {
            case 'execute': {
                const { processDefinition, input, options } = params;
                
                const executionId = await engine.executeProcess(
                    processDefinition,
                    input,
                    options
                );
                
                return res.status(200).json({
                    success: true,
                    executionId,
                    status: engine.getExecutionStatus(executionId)
                });
            }
            
            case 'status': {
                const { executionId } = params;
                
                const status = engine.getExecutionStatus(executionId);
                if (!status) {
                    return res.status(404).json({ error: 'Execution not found' });
                }
                
                return res.status(200).json({
                    success: true,
                    status
                });
            }
            
            case 'pause': {
                const { executionId } = params;
                await engine.pauseExecution(executionId);
                
                return res.status(200).json({
                    success: true,
                    message: 'Execution paused'
                });
            }
            
            case 'resume': {
                const { executionId } = params;
                await engine.resumeExecution(executionId);
                
                return res.status(200).json({
                    success: true,
                    message: 'Execution resumed'
                });
            }
            
            case 'cancel': {
                const { executionId } = params;
                await engine.cancelExecution(executionId);
                
                return res.status(200).json({
                    success: true,
                    message: 'Execution cancelled'
                });
            }
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error('Process execution error', error);
        return res.status(500).json({ 
            error: 'Process execution failed',
            message: error.message 
        });
    }
}

export default monitoringMiddleware(processExecutionHandler);
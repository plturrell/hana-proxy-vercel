/**
 * TypeScript definitions for A2A Visual Builder integration
 * Compatible with src/a2a-visual/integration.ts
 */

// Re-export your existing interfaces for compatibility
export interface VisualProcess {
  id: string;
  name: string;
  elements: ProcessElement[];
  connections: ProcessConnection[];
  trustRequirements: TrustRequirement[];
}

export interface ProcessElement {
  id: string;
  type: 'agent' | 'contract' | 'condition' | 'action';
  subtype: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  realData?: {
    realAgentId?: string;
    realContractAddress?: string;
    isReal?: boolean;
  };
}

export interface ProcessConnection {
  from: string;
  to: string;
  trustLevel?: 'low' | 'medium' | 'high';
  contract?: string;
}

export interface TrustRequirement {
  type: 'reputation' | 'stake' | 'multisig' | 'timelock';
  threshold?: number;
  participants?: string[];
  duration?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  gasEstimate: bigint | number;
}

export interface NetworkStatus {
  totalAgents: number;
  activeAgents: number;
  deployedContracts: number;
  runningProcesses: number;
  networkHealth: 'healthy' | 'degraded' | 'error';
  lastUpdate: string;
}

export interface VisualUpdate {
  type: 'task_progress' | 'agent_activity' | 'contract_event';
  processId: string;
  taskId?: string;
  status: string;
  progress?: number;
  currentAgent?: string;
  message?: string;
}

// Bridge interface for compatibility
export interface A2AVisualBridge {
  isInitialized: boolean;
  currentProcess: VisualProcess | null;
  
  // Core methods matching your VisualProcessExecutor
  createVisualProcess(elements: ProcessElement[], connections: ProcessConnection[], name?: string): VisualProcess;
  validateProcess(process?: VisualProcess): Promise<ValidationResult>;
  deployProcess(process?: VisualProcess): Promise<string>;
  executeProcess(processId: string, input: any): Promise<any>;
  
  // Network interaction methods
  loadRealAgents(): Promise<RealAgent[]>;
  loadRealContracts(): Promise<RealContract[]>;
  getNetworkStatus(): Promise<NetworkStatus>;
  
  // Event handling
  emitEvent(type: string, data: any): void;
  emitVisualUpdate(update: VisualUpdate): void;
}

export interface RealAgent {
  id: string;
  name: string;
  agent_type: string;
  status: 'active' | 'inactive' | 'busy';
  reputation_score?: number;
  capabilities: string[];
  last_active?: string;
  created_at: string;
}

export interface RealContract {
  id: string;
  element_id: string;
  contract_type: string;
  address: string;
  deployed_at: string;
  status: 'deployed' | 'active' | 'paused';
}

// UI Component interfaces
export interface VisualNode extends ProcessElement {
  selected?: boolean;
  executing?: boolean;
}

export interface VisualConnection extends ProcessConnection {
  highlighted?: boolean;
}

// Builder class interface
export interface RealA2ABuilder {
  nodes: VisualNode[];
  connections: VisualConnection[];
  realAgents: RealAgent[];
  realContracts: RealContract[];
  selectedNode: VisualNode | null;
  bridge: A2AVisualBridge;
  
  // Core methods
  initializeBridge(): Promise<void>;
  connectToNetwork(): Promise<void>;
  handleCanvasDrop(event: DragEvent): void;
  renderNodes(): void;
  renderConnections(): void;
  
  // Node management
  selectNode(event: Event, node: VisualNode): void;
  clearSelection(): void;
  updateNodeProperty(nodeId: string, property: string, value: any): void;
  deleteNode(nodeId: string): void;
  
  // Visual updates
  handleVisualUpdate(update: VisualUpdate): void;
  highlightNode(nodeId: string, progress?: number): void;
}

// Global declarations for browser environment
declare global {
  interface Window {
    A2AVisualBridge: A2AVisualBridge;
    builder: RealA2ABuilder;
    ethereum?: any; // MetaMask
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  }
  
  // Event types
  interface WindowEventMap {
    'a2a-bridge-initialized': CustomEvent<{ success: boolean }>;
    'a2a-bridge-error': CustomEvent<{ error: string }>;
    'a2a-visual-update': CustomEvent<VisualUpdate>;
    'a2a-process-deployed': CustomEvent<{ processId: string; process: VisualProcess }>;
    'a2a-execution-completed': CustomEvent<{ taskId: string; result: any }>;
    'a2a-execution-error': CustomEvent<{ error: string }>;
  }
}

// Message types for postMessage communication
export interface A2AMessage {
  type: 'a2a-visual-update' | 'a2a-process-deployed' | 'a2a-execution-status';
  processId?: string;
  taskId?: string;
  status?: string;
  progress?: number;
  currentAgent?: string;
  data?: any;
}

// Integration with your existing A2A protocol
export interface A2ACompatibility {
  // Convert between your TypeScript interfaces and our HTML/JS implementation
  toVisualProcess(process: any): VisualProcess;
  fromVisualProcess(process: VisualProcess): any;
  
  // Agent skill registration compatibility
  registerAgentSkills(agentId: string, subtype: string): void;
  
  // Message handling compatibility
  createA2AMessage(type: string, payload: any): any;
  handleA2AMessage(message: any): Promise<any>;
}

export {};
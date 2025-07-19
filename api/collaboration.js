// Real-time Collaborative Editing Service
import { monitoringMiddleware, logger } from './monitoring.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// In-memory session storage (use Redis in production)
const collaborationSessions = new Map();
const userConnections = new Map();

// Collaboration session class
class CollaborationSession {
    constructor(sessionId, processId) {
        this.sessionId = sessionId;
        this.processId = processId;
        this.participants = new Map();
        this.bpmnContent = null;
        this.operations = [];
        this.version = 0;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
    }
    
    addParticipant(userId, userInfo) {
        this.participants.set(userId, {
            id: userId,
            name: userInfo.name,
            email: userInfo.email,
            color: this.generateUserColor(userId),
            cursor: null,
            selection: null,
            joinedAt: Date.now(),
            lastSeen: Date.now()
        });
        this.lastActivity = Date.now();
    }
    
    removeParticipant(userId) {
        this.participants.delete(userId);
        this.lastActivity = Date.now();
    }
    
    updateCursor(userId, position) {
        const participant = this.participants.get(userId);
        if (participant) {
            participant.cursor = position;
            participant.lastSeen = Date.now();
        }
        this.lastActivity = Date.now();
    }
    
    updateSelection(userId, selection) {
        const participant = this.participants.get(userId);
        if (participant) {
            participant.selection = selection;
            participant.lastSeen = Date.now();
        }
        this.lastActivity = Date.now();
    }
    
    applyOperation(operation) {
        this.operations.push({
            ...operation,
            timestamp: Date.now(),
            version: ++this.version
        });
        this.lastActivity = Date.now();
        
        // Apply operational transform if needed
        this.bpmnContent = this.transformOperation(this.bpmnContent, operation);
        
        return this.version;
    }
    
    transformOperation(content, operation) {
        // Simplified operational transform
        // In production, use a proper OT library
        switch (operation.type) {
            case 'element-add':
                return this.addElement(content, operation.data);
            case 'element-update':
                return this.updateElement(content, operation.data);
            case 'element-delete':
                return this.deleteElement(content, operation.data);
            case 'connection-add':
                return this.addConnection(content, operation.data);
            default:
                return content;
        }
    }
    
    generateUserColor(userId) {
        // Generate consistent color based on user ID
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#48C9B0', '#5499C7', '#AF7AC5', '#F8B500', '#00A8CC'
        ];
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }
    
    addElement(content, elementData) {
        // Add element to BPMN XML
        // This is simplified - use proper XML manipulation in production
        return content;
    }
    
    updateElement(content, elementData) {
        // Update element in BPMN XML
        return content;
    }
    
    deleteElement(content, elementData) {
        // Delete element from BPMN XML
        return content;
    }
    
    addConnection(content, connectionData) {
        // Add connection to BPMN XML
        return content;
    }
    
    getState() {
        return {
            sessionId: this.sessionId,
            processId: this.processId,
            participants: Array.from(this.participants.values()),
            version: this.version,
            lastActivity: this.lastActivity
        };
    }
}

// WebSocket connection handler (for Vercel, we'll use polling)
class CollaborationManager {
    constructor() {
        this.sessions = collaborationSessions;
        this.connections = userConnections;
        
        // Clean up inactive sessions periodically
        setInterval(() => this.cleanupInactiveSessions(), 60000); // Every minute
    }
    
    createSession(processId, creatorId, creatorInfo) {
        const sessionId = crypto.randomUUID();
        const session = new CollaborationSession(sessionId, processId);
        session.addParticipant(creatorId, creatorInfo);
        
        this.sessions.set(sessionId, session);
        
        logger.info('Collaboration session created', {
            sessionId,
            processId,
            creatorId
        });
        
        return {
            sessionId,
            joinUrl: `/collaborate/${sessionId}`,
            shareCode: this.generateShareCode(sessionId)
        };
    }
    
    joinSession(sessionId, userId, userInfo) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        session.addParticipant(userId, userInfo);
        this.connections.set(userId, sessionId);
        
        // Notify other participants
        this.broadcastToSession(sessionId, {
            type: 'participant-joined',
            participant: session.participants.get(userId)
        }, userId);
        
        return session.getState();
    }
    
    leaveSession(userId) {
        const sessionId = this.connections.get(userId);
        if (!sessionId) return;
        
        const session = this.sessions.get(sessionId);
        if (session) {
            const participant = session.participants.get(userId);
            session.removeParticipant(userId);
            
            // Notify other participants
            this.broadcastToSession(sessionId, {
                type: 'participant-left',
                participantId: userId,
                participantName: participant?.name
            }, userId);
            
            // Delete session if empty
            if (session.participants.size === 0) {
                this.sessions.delete(sessionId);
            }
        }
        
        this.connections.delete(userId);
    }
    
    handleOperation(userId, operation) {
        const sessionId = this.connections.get(userId);
        if (!sessionId) {
            throw new Error('User not in a session');
        }
        
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Apply operation
        const newVersion = session.applyOperation({
            ...operation,
            userId,
            userName: session.participants.get(userId)?.name
        });
        
        // Broadcast to other participants
        this.broadcastToSession(sessionId, {
            type: 'operation',
            operation: {
                ...operation,
                version: newVersion,
                userId,
                userName: session.participants.get(userId)?.name
            }
        }, userId);
        
        return { version: newVersion, success: true };
    }
    
    updateCursor(userId, position) {
        const sessionId = this.connections.get(userId);
        if (!sessionId) return;
        
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        session.updateCursor(userId, position);
        
        // Broadcast cursor update
        this.broadcastToSession(sessionId, {
            type: 'cursor-update',
            userId,
            position,
            color: session.participants.get(userId)?.color
        }, userId);
    }
    
    updateSelection(userId, selection) {
        const sessionId = this.connections.get(userId);
        if (!sessionId) return;
        
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        session.updateSelection(userId, selection);
        
        // Broadcast selection update
        this.broadcastToSession(sessionId, {
            type: 'selection-update',
            userId,
            selection,
            color: session.participants.get(userId)?.color
        }, userId);
    }
    
    broadcastToSession(sessionId, message, excludeUserId = null) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        // In a real implementation, use WebSockets
        // For now, store messages for polling
        session.participants.forEach((participant, userId) => {
            if (userId !== excludeUserId) {
                this.queueMessage(userId, message);
            }
        });
    }
    
    queueMessage(userId, message) {
        // Store messages for polling
        if (!this.messageQueues) {
            this.messageQueues = new Map();
        }
        
        if (!this.messageQueues.has(userId)) {
            this.messageQueues.set(userId, []);
        }
        
        this.messageQueues.get(userId).push({
            ...message,
            timestamp: Date.now()
        });
        
        // Keep only last 100 messages
        const queue = this.messageQueues.get(userId);
        if (queue.length > 100) {
            queue.splice(0, queue.length - 100);
        }
    }
    
    getMessages(userId, since = 0) {
        if (!this.messageQueues || !this.messageQueues.has(userId)) {
            return [];
        }
        
        const messages = this.messageQueues.get(userId).filter(m => m.timestamp > since);
        
        // Clear retrieved messages
        if (messages.length > 0) {
            const lastTimestamp = messages[messages.length - 1].timestamp;
            this.messageQueues.set(
                userId,
                this.messageQueues.get(userId).filter(m => m.timestamp > lastTimestamp)
            );
        }
        
        return messages;
    }
    
    generateShareCode(sessionId) {
        // Generate a short shareable code
        return sessionId.substring(0, 8).toUpperCase();
    }
    
    getSessionByShareCode(shareCode) {
        // Find session by share code
        for (const [sessionId, session] of this.sessions) {
            if (sessionId.substring(0, 8).toUpperCase() === shareCode) {
                return { sessionId, session };
            }
        }
        return null;
    }
    
    cleanupInactiveSessions() {
        const now = Date.now();
        const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
        
        for (const [sessionId, session] of this.sessions) {
            if (now - session.lastActivity > inactivityThreshold) {
                // Save session to database before cleanup
                this.archiveSession(session);
                
                // Remove all participants
                session.participants.forEach((_, userId) => {
                    this.connections.delete(userId);
                });
                
                this.sessions.delete(sessionId);
                
                logger.info('Cleaned up inactive session', { sessionId });
            }
        }
    }
    
    async archiveSession(session) {
        try {
            await supabase
                .from('collaboration_sessions')
                .insert({
                    session_id: session.sessionId,
                    process_id: session.processId,
                    participants: Array.from(session.participants.values()),
                    operations: session.operations,
                    final_content: session.bpmnContent,
                    created_at: new Date(session.createdAt),
                    archived_at: new Date()
                });
        } catch (error) {
            logger.error('Failed to archive session', error);
        }
    }
}

// Initialize collaboration manager
const collaborationManager = new CollaborationManager();

// API Handler
async function collaborationHandler(req, res) {
    const { action, ...params } = req.body;
    
    try {
        switch (action) {
            case 'create-session': {
                const { processId, userId, userInfo } = params;
                const result = collaborationManager.createSession(processId, userId, userInfo);
                return res.status(200).json({ success: true, ...result });
            }
            
            case 'join-session': {
                const { sessionId, shareCode, userId, userInfo } = params;
                
                let actualSessionId = sessionId;
                if (!sessionId && shareCode) {
                    const found = collaborationManager.getSessionByShareCode(shareCode);
                    if (!found) {
                        return res.status(404).json({ error: 'Session not found' });
                    }
                    actualSessionId = found.sessionId;
                }
                
                const state = collaborationManager.joinSession(actualSessionId, userId, userInfo);
                return res.status(200).json({ success: true, state });
            }
            
            case 'leave-session': {
                const { userId } = params;
                collaborationManager.leaveSession(userId);
                return res.status(200).json({ success: true });
            }
            
            case 'apply-operation': {
                const { userId, operation } = params;
                const result = collaborationManager.handleOperation(userId, operation);
                return res.status(200).json({ success: true, ...result });
            }
            
            case 'update-cursor': {
                const { userId, position } = params;
                collaborationManager.updateCursor(userId, position);
                return res.status(200).json({ success: true });
            }
            
            case 'update-selection': {
                const { userId, selection } = params;
                collaborationManager.updateSelection(userId, selection);
                return res.status(200).json({ success: true });
            }
            
            case 'poll-messages': {
                const { userId, since = 0 } = params;
                const messages = collaborationManager.getMessages(userId, since);
                return res.status(200).json({ success: true, messages });
            }
            
            case 'get-session-state': {
                const { sessionId } = params;
                const session = collaborationManager.sessions.get(sessionId);
                if (!session) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                return res.status(200).json({ success: true, state: session.getState() });
            }
            
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error('Collaboration error', error);
        return res.status(500).json({ 
            error: 'Collaboration failed',
            message: error.message 
        });
    }
}

export default monitoringMiddleware(collaborationHandler);
// Real WebSocket Server for Live Collaboration
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Operational Transform for real-time collaboration
class OperationalTransform {
    constructor() {
        this.operations = new Map();
    }
    
    transform(op1, op2) {
        // Real OT algorithm for concurrent edits
        if (op1.type === 'insert' && op2.type === 'insert') {
            if (op1.position < op2.position) {
                return { ...op2, position: op2.position + op1.length };
            } else if (op1.position > op2.position) {
                return { ...op1, position: op1.position + op2.length };
            } else {
                // Same position - use timestamp to determine order
                return op1.timestamp < op2.timestamp ? op2 : op1;
            }
        }
        
        if (op1.type === 'delete' && op2.type === 'delete') {
            if (op1.position + op1.length <= op2.position) {
                return { ...op2, position: op2.position - op1.length };
            } else if (op2.position + op2.length <= op1.position) {
                return op1;
            } else {
                // Overlapping deletes
                const start = Math.max(op1.position, op2.position);
                const end = Math.min(op1.position + op1.length, op2.position + op2.length);
                return { ...op2, position: start, length: Math.max(0, op2.length - (end - start)) };
            }
        }
        
        return op2;
    }
}

const ot = new OperationalTransform();

export default function websocketHandler(req, res) {
    if (res.socket.server.io) {
        res.end();
        return;
    }
    
    const io = new Server(res.socket.server, {
        path: '/api/socketio',
        cors: {
            origin: process.env.NEXTAUTH_URL,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    
    res.socket.server.io = io;
    
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
            
            // Verify user exists in database
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.userId)
                .single();
                
            if (!user) {
                return next(new Error('Authentication failed'));
            }
            
            socket.userId = user.id;
            socket.userInfo = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            
            next();
        } catch (err) {
            next(new Error('Authentication failed'));
        }
    });
    
    // Real-time collaboration
    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        
        // Join collaboration session
        socket.on('join-session', async (sessionId) => {
            socket.join(sessionId);
            socket.sessionId = sessionId;
            
            // Add user to session in database
            await supabase
                .from('collaboration_sessions')
                .upsert({
                    session_id: sessionId,
                    user_id: socket.userId,
                    user_info: socket.userInfo,
                    joined_at: new Date().toISOString(),
                    socket_id: socket.id
                });
            
            // Get current session state
            const { data: session } = await supabase
                .from('collaboration_sessions')
                .select('*')
                .eq('session_id', sessionId);
                
            // Notify others
            socket.to(sessionId).emit('user-joined', {
                user: socket.userInfo,
                participants: session
            });
            
            // Send current state to new user
            const { data: currentState } = await supabase
                .from('session_states')
                .select('*')
                .eq('session_id', sessionId)
                .single();
                
            if (currentState) {
                socket.emit('session-state', currentState);
            }
        });
        
        // Handle BPMN operations
        socket.on('bpmn-operation', async (operation) => {
            operation.userId = socket.userId;
            operation.timestamp = Date.now();
            
            // Store operation
            await supabase
                .from('collaboration_operations')
                .insert({
                    session_id: socket.sessionId,
                    user_id: socket.userId,
                    operation: operation,
                    created_at: new Date().toISOString()
                });
            
            // Apply OT if needed
            const { data: pendingOps } = await supabase
                .from('collaboration_operations')
                .select('*')
                .eq('session_id', socket.sessionId)
                .gt('created_at', new Date(Date.now() - 5000).toISOString())
                .order('created_at', { ascending: true });
                
            let transformedOp = operation;
            for (const pendingOp of pendingOps) {
                if (pendingOp.user_id !== socket.userId) {
                    transformedOp = ot.transform(transformedOp, pendingOp.operation);
                }
            }
            
            // Broadcast to others
            socket.to(socket.sessionId).emit('bpmn-operation', transformedOp);
            
            // Update session state
            await updateSessionState(socket.sessionId, transformedOp);
        });
        
        // Cursor updates
        socket.on('cursor-update', (position) => {
            socket.to(socket.sessionId).emit('cursor-update', {
                userId: socket.userId,
                position,
                color: getUserColor(socket.userId)
            });
        });
        
        // Selection updates
        socket.on('selection-update', (selection) => {
            socket.to(socket.sessionId).emit('selection-update', {
                userId: socket.userId,
                selection,
                color: getUserColor(socket.userId)
            });
        });
        
        // Voice chat for collaboration
        socket.on('voice-signal', (signal) => {
            socket.to(socket.sessionId).emit('voice-signal', {
                userId: socket.userId,
                signal
            });
        });
        
        // Clean up on disconnect
        socket.on('disconnect', async () => {
            console.log(`User ${socket.userId} disconnected`);
            
            if (socket.sessionId) {
                // Remove from session
                await supabase
                    .from('collaboration_sessions')
                    .delete()
                    .eq('session_id', socket.sessionId)
                    .eq('user_id', socket.userId);
                
                // Notify others
                socket.to(socket.sessionId).emit('user-left', {
                    userId: socket.userId
                });
            }
        });
    });
    
    res.end();
}

async function updateSessionState(sessionId, operation) {
    const { data: currentState } = await supabase
        .from('session_states')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
    let newState = currentState?.state || {};
    
    // Apply operation to state
    switch (operation.type) {
        case 'element-add':
            newState.elements = newState.elements || {};
            newState.elements[operation.elementId] = operation.data;
            break;
            
        case 'element-update':
            if (newState.elements?.[operation.elementId]) {
                Object.assign(newState.elements[operation.elementId], operation.data);
            }
            break;
            
        case 'element-delete':
            if (newState.elements?.[operation.elementId]) {
                delete newState.elements[operation.elementId];
            }
            break;
            
        case 'connection-add':
            newState.connections = newState.connections || [];
            newState.connections.push(operation.data);
            break;
    }
    
    // Save updated state
    await supabase
        .from('session_states')
        .upsert({
            session_id: sessionId,
            state: newState,
            version: (currentState?.version || 0) + 1,
            updated_at: new Date().toISOString()
        });
}

function getUserColor(userId) {
    // Generate consistent color from user ID
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#48C9B0', '#5499C7', '#AF7AC5', '#F8B500', '#00A8CC'
    ];
    
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}
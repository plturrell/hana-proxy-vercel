/**
 * Supabase Auth Middleware for API Protection
 * Implements JWT authentication using Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client for auth verification
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Auth levels for different API endpoints
 */
const AUTH_LEVELS = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
  SERVICE_ROLE: 'service_role',
  ADMIN: 'admin'
};

/**
 * Endpoint auth configuration
 */
const ENDPOINT_AUTH = {
  // Public endpoints (no auth required)
  'get_blockchain_status': AUTH_LEVELS.PUBLIC,
  'load_real_blockchain_agents': AUTH_LEVELS.PUBLIC,
  'load_real_blockchain_contracts': AUTH_LEVELS.PUBLIC,
  
  // Authenticated user endpoints
  'validate_blockchain_process': AUTH_LEVELS.AUTHENTICATED,
  'monitor_blockchain_execution': AUTH_LEVELS.AUTHENTICATED,
  
  // Service role endpoints (elevated permissions)
  'deploy_to_blockchain': AUTH_LEVELS.SERVICE_ROLE,
  'execute_blockchain_process': AUTH_LEVELS.SERVICE_ROLE,
  
  // Default requires authentication
  'default': AUTH_LEVELS.AUTHENTICATED
};

/**
 * Verify JWT token and extract user
 */
async function verifyToken(token) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Token verification error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
function hasRequiredRole(user, requiredLevel) {
  if (!user) return false;
  
  switch (requiredLevel) {
    case AUTH_LEVELS.PUBLIC:
      return true;
      
    case AUTH_LEVELS.AUTHENTICATED:
      return !!user.id;
      
    case AUTH_LEVELS.SERVICE_ROLE:
      // Check for service role in user metadata
      return user.app_metadata?.role === 'service_role' || 
             user.app_metadata?.roles?.includes('service_role');
      
    case AUTH_LEVELS.ADMIN:
      return user.app_metadata?.role === 'admin' || 
             user.app_metadata?.roles?.includes('admin');
      
    default:
      return false;
  }
}

/**
 * Auth middleware for API routes
 */
export async function authMiddleware(req, res, next) {
  try {
    // Get action from request
    const action = req.body?.action || req.query?.action;
    const requiredLevel = ENDPOINT_AUTH[action] || ENDPOINT_AUTH.default;
    
    // Public endpoints don't need auth
    if (requiredLevel === AUTH_LEVELS.PUBLIC) {
      return next();
    }
    
    // Extract token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Check role permissions
    if (!hasRequiredRole(user, requiredLevel)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredLevel
      });
    }
    
    // Attach user to request
    req.user = user;
    req.authLevel = requiredLevel;
    
    // Log authentication
    await logAuthAccess(user.id, action, true);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Log authentication access
 */
async function logAuthAccess(userId, action, success) {
  try {
    const { error } = await supabase
      .from('auth_access_logs')
      .insert({
        user_id: userId,
        action: action,
        success: success,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to log auth access:', error);
    }
  } catch (error) {
    console.error('Auth logging error:', error);
  }
}

/**
 * Create authenticated Supabase client for user
 */
export function createUserClient(token) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Express middleware wrapper
 */
export function requireAuth(level = AUTH_LEVELS.AUTHENTICATED) {
  return async (req, res, next) => {
    // Override the required level for specific endpoints
    const originalAction = ENDPOINT_AUTH[req.body?.action];
    ENDPOINT_AUTH[req.body?.action] = level;
    
    await authMiddleware(req, res, () => {
      // Restore original auth level
      if (originalAction) {
        ENDPOINT_AUTH[req.body?.action] = originalAction;
      }
      next();
    });
  };
}

/**
 * Verify API key for service-to-service calls
 */
export async function verifyApiKey(apiKey) {
  if (!apiKey) return false;
  
  try {
    // Check if API key exists in vault
    const { data, error } = await supabase.rpc('get_secret', {
      p_name: 'api_key_hash'
    });
    
    if (error || !data) return false;
    
    // Compare API key hash
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    return hash === data;
  } catch (error) {
    console.error('API key verification error:', error);
    return false;
  }
}

export default authMiddleware;
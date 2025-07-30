const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { promisify } = require('util');
const { createClient } = require('@supabase/supabase-js');
const { logger, auditLogger } = require('./logger');
const { AuthenticationError, AuthorizationError } = require('./error-handler');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Security constants
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

class AuthService {
  // Generate JWT tokens
  static generateTokens(userId, role, permissions) {
    const payload = {
      userId,
      role,
      permissions,
      iat: Date.now()
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'finsight-intelligence',
      audience: 'finsight-api'
    });

    const refreshToken = jwt.sign(
      { userId, tokenType: 'refresh' },
      JWT_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'finsight-intelligence'
      }
    );

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  static async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'finsight-intelligence',
        audience: 'finsight-api'
      });
      
      // Check if token is blacklisted
      const { data: blacklisted } = await supabase
        .from('token_blacklist')
        .select('id')
        .eq('token', token)
        .single();
      
      if (blacklisted) {
        throw new AuthenticationError('Token has been revoked');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token');
      }
      throw error;
    }
  }

  // User registration
  static async register(email, password, userData = {}) {
    // Validate password strength
    if (!this.isPasswordValid(password)) {
      throw new ValidationError('Password does not meet security requirements', {
        requirements: [
          'At least 12 characters long',
          'Contains uppercase letter',
          'Contains lowercase letter',
          'Contains number',
          'Contains special character'
        ]
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in database
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        ...userData,
        created_at: new Date().toISOString(),
        email_verified: false,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('User already exists');
      }
      throw error;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await supabase
      .from('email_verifications')
      .insert({
        user_id: user.id,
        token: verificationToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    // Log registration
    auditLogger.info('User registered', {
      userId: user.id,
      email: user.email,
      ip: userData.ip
    });

    return {
      user: this.sanitizeUser(user),
      verificationToken
    };
  }

  // User login
  static async login(email, password, ipAddress) {
    // Check for account lockout
    const { data: lockout } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .gte('attempted_at', new Date(Date.now() - LOCKOUT_DURATION).toISOString())
      .order('attempted_at', { ascending: false });

    if (lockout && lockout.length >= MAX_LOGIN_ATTEMPTS) {
      throw new AuthenticationError('Account temporarily locked due to multiple failed login attempts');
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    if (error || !user) {
      await this.recordFailedLogin(email, ipAddress);
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      await this.recordFailedLogin(email, ipAddress);
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new AuthenticationError('Email not verified');
    }

    // Clear failed login attempts
    await supabase
      .from('login_attempts')
      .delete()
      .eq('email', email);

    // Get user permissions
    const { data: permissions } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', user.id);

    const userPermissions = permissions.map(p => p.permission);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.role, userPermissions);

    // Store refresh token
    await supabase
      .from('refresh_tokens')
      .insert({
        user_id: user.id,
        token: tokens.refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip_address: ipAddress
      });

    // Log successful login
    auditLogger.info('User login successful', {
      userId: user.id,
      email: user.email,
      ip: ipAddress
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken) {
    const decoded = await this.verifyToken(refreshToken);
    
    // Verify refresh token in database
    const { data: storedToken } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .eq('user_id', decoded.userId)
      .single();

    if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Get user and permissions
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    const { data: permissions } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', user.id);

    const userPermissions = permissions.map(p => p.permission);

    // Generate new access token
    const { accessToken } = this.generateTokens(user.id, user.role, userPermissions);

    return { accessToken, user: this.sanitizeUser(user) };
  }

  // Logout
  static async logout(token, refreshToken) {
    // Add tokens to blacklist
    const blacklistEntries = [
      { token, type: 'access', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
    ];

    if (refreshToken) {
      blacklistEntries.push({
        token: refreshToken,
        type: 'refresh',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Remove refresh token from database
      await supabase
        .from('refresh_tokens')
        .delete()
        .eq('token', refreshToken);
    }

    await supabase
      .from('token_blacklist')
      .insert(blacklistEntries);

    return { success: true };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    if (!this.isPasswordValid(newPassword)) {
      throw new ValidationError('New password does not meet security requirements');
    }

    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', userId);

    auditLogger.info('Password changed', { userId });

    return { success: true };
  }

  // Helper methods
  static isPasswordValid(password) {
    return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_REGEX.test(password);
  }

  static async recordFailedLogin(email, ipAddress) {
    await supabase
      .from('login_attempts')
      .insert({
        email,
        ip_address: ipAddress,
        attempted_at: new Date().toISOString()
      });
  }

  static sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

// Middleware for protecting routes
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = await AuthService.verifyToken(token);
    
    // Get fresh user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('status', 'active')
      .single();

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = AuthService.sanitizeUser(user);
    req.user.permissions = decoded.permissions;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient role permissions'));
    }

    next();
  };
};

// Permission-based authorization
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(new AuthorizationError(`Required permissions: ${permissions.join(', ')}`));
    }

    next();
  };
};

module.exports = {
  AuthService,
  authenticate,
  authorize,
  requirePermission
};
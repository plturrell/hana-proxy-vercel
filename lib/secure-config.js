/**
 * Secure Configuration Module using Supabase Vault
 * Replaces hardcoded environment variables with secure vault storage
 */

const { createClient } = require('@supabase/supabase-js');

class SecureConfig {
  constructor() {
    // Only these non-sensitive values come from environment
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Supabase configuration required');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get secret from Supabase Vault with caching
   */
  async getSecret(name) {
    // Check cache first
    const cached = this.cache.get(name);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    try {
      // Call the vault function to get secret
      const { data, error } = await this.supabase
        .rpc('get_secret', { p_name: name });

      if (error) {
        console.error(`Failed to retrieve secret ${name}:`, error.message);
        return null;
      }

      // Cache the result
      if (data) {
        this.cache.set(name, {
          value: data,
          expires: Date.now() + this.cacheTimeout
        });
      }

      return data;
    } catch (error) {
      console.error(`Error accessing vault for ${name}:`, error);
      return null;
    }
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(names) {
    const results = {};
    const promises = names.map(async (name) => {
      results[name] = await this.getSecret(name);
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Clear cached secrets
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get configuration for external services
   */
  async getExternalConfig() {
    const secrets = await this.getSecrets([
      'grok_api_key',
      'exasol_password',
      'blockchain_deployer_key'
    ]);

    return {
      grok: {
        apiKey: secrets.grok_api_key,
        baseUrl: 'https://api.x.ai/v1'
      },
      exasol: {
        host: process.env.EXASOL_HOST,
        port: process.env.EXASOL_PORT,
        user: process.env.EXASOL_USER,
        password: secrets.exasol_password,
        schema: process.env.EXASOL_SCHEMA
      },
      blockchain: {
        networkId: process.env.BLOCKCHAIN_NETWORK_ID || 'supabase-private',
        deployerKey: secrets.blockchain_deployer_key,
        simulationMode: true
      }
    };
  }

  /**
   * Get Supabase client with proper configuration
   */
  getSupabaseClient(role = 'anon') {
    if (role === 'service') {
      return this.supabase;
    }
    
    // Return anon client for public access
    return createClient(
      this.supabaseUrl,
      process.env.SUPABASE_ANON_KEY
    );
  }
}

// Singleton instance
let instance = null;

function getSecureConfig() {
  if (!instance) {
    instance = new SecureConfig();
  }
  return instance;
}

module.exports = {
  SecureConfig,
  getSecureConfig
};
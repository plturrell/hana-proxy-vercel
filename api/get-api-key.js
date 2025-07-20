/**
 * Unified API Key Retrieval
 * Gets API keys from Supabase Vault or falls back to environment variables
 */

import { createClient } from '@supabase/supabase-js';

// Cache for API keys
const apiKeyCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get API key from vault or environment
 */
export async function getApiKey(keyName) {
  // Check cache first
  const cached = apiKeyCache.get(keyName);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  // Try Supabase Vault first
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.rpc('get_secret', { p_name: keyName });
      
      if (!error && data) {
        // Cache the result
        apiKeyCache.set(keyName, {
          value: data,
          expires: Date.now() + CACHE_DURATION
        });
        return data;
      }
    }
  } catch (error) {
    console.warn(`Failed to get ${keyName} from vault:`, error.message);
  }

  // Fall back to environment variables
  const envMappings = {
    'perplexity_api_key': process.env.PERPLEXITY_API_KEY,
    'grok_api_key': process.env.GROK_API_KEY || process.env.XAI_API_KEY,
    'openai_api_key': process.env.OPENAI_API_KEY,
    'fmp_api_key': process.env.FMP_API_KEY || process.env.FINANCIAL_MODELING_PREP_API_KEY,
    'finnhub_api_key': process.env.FINNHUB_API_KEY || process.env.FINHUB_API_KEY
  };

  const value = envMappings[keyName];
  if (value) {
    // Cache the result
    apiKeyCache.set(keyName, {
      value: value,
      expires: Date.now() + CACHE_DURATION
    });
  }

  return value;
}

/**
 * Clear the API key cache
 */
export function clearApiKeyCache() {
  apiKeyCache.clear();
}

/**
 * Get all API keys needed for AI features
 */
export async function getAllAiApiKeys() {
  const keys = await Promise.all([
    getApiKey('perplexity_api_key'),
    getApiKey('grok_api_key'),
    getApiKey('openai_api_key')
  ]);

  return {
    perplexity: keys[0],
    grok: keys[1],
    openai: keys[2]
  };
}
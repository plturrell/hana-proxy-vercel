// FMP API Key Manager - Handles daily key rotation
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class FMPKeyManager {
    constructor() {
        this.baseUrl = 'https://financialmodelingprep.com/api/v3';
        this.dashboardUrl = 'https://site.financialmodelingprep.com/developer/docs/dashboard';
        this.currentKey = null;
        this.keyExpiry = null;
    }

    async getCurrentKey() {
        try {
            // First check if we have a valid key in database
            const { data: keyData } = await supabase
                .from('api_keys')
                .select('*')
                .eq('provider', 'fmp')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (keyData && this.isKeyValid(keyData)) {
                console.log('✅ Using cached FMP API key');
                this.currentKey = keyData.api_key;
                this.keyExpiry = new Date(keyData.expires_at);
                return this.currentKey;
            }

            // If no valid key, try to get a new one
            console.log('🔄 FMP API key expired or missing, attempting to get new key...');
            return await this.refreshKey();

        } catch (error) {
            console.error('Error getting FMP key:', error);
            // Fallback to hardcoded key
            return 'DKVIEgAABvrrglog978ZuBzlmBT5VGuc';
        }
    }

    isKeyValid(keyData) {
        if (!keyData || !keyData.api_key) return false;
        
        const now = new Date();
        const expiry = new Date(keyData.expires_at);
        
        // Check if key expires within the next hour
        const bufferTime = 60 * 60 * 1000; // 1 hour buffer
        return expiry.getTime() > (now.getTime() + bufferTime);
    }

    async refreshKey() {
        try {
            // Try multiple strategies to get a new key
            let newKey = null;

            // Strategy 1: Check if there's a service to fetch new keys
            newKey = await this.fetchFromDashboard();
            
            if (!newKey) {
                // Strategy 2: Use environment variable if set
                newKey = process.env.FMP_API_KEY_DAILY || process.env.FMP_API_KEY;
            }

            if (!newKey) {
                // Strategy 3: Try to parse from a configuration service
                newKey = await this.fetchFromConfigService();
            }

            if (newKey && await this.validateKey(newKey)) {
                await this.storeKey(newKey);
                this.currentKey = newKey;
                this.keyExpiry = this.getKeyExpiry();
                console.log('✅ FMP API key refreshed successfully');
                return newKey;
            }

            throw new Error('Unable to obtain valid FMP API key');

        } catch (error) {
            console.error('Error refreshing FMP key:', error);
            throw error;
        }
    }

    async fetchFromDashboard() {
        // This would integrate with FMP dashboard API if available
        // For now, return null - would need FMP account credentials
        console.log('📡 Attempting to fetch from FMP dashboard...');
        return null;
    }

    async fetchFromConfigService() {
        try {
            // Check if we have a key service configured
            const keyServiceUrl = process.env.FMP_KEY_SERVICE_URL;
            if (!keyServiceUrl) return null;

            const response = await fetch(keyServiceUrl, {
                headers: {
                    'Authorization': `Bearer ${process.env.KEY_SERVICE_TOKEN}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.apiKey;
            }
        } catch (error) {
            console.error('Key service fetch error:', error);
        }
        return null;
    }

    async validateKey(apiKey) {
        try {
            // Test the key with a simple API call
            const testUrl = `${this.baseUrl}/quote/AAPL?apikey=${apiKey}`;
            const response = await fetch(testUrl);
            
            if (response.ok) {
                const data = await response.json();
                return Array.isArray(data) && data.length > 0;
            }
            
            return false;
        } catch (error) {
            console.error('Key validation error:', error);
            return false;
        }
    }

    async storeKey(apiKey) {
        try {
            // Mark old keys as expired
            await supabase
                .from('api_keys')
                .update({ status: 'expired' })
                .eq('provider', 'fmp');

            // Store new key
            const { error } = await supabase
                .from('api_keys')
                .insert({
                    provider: 'fmp',
                    api_key: apiKey,
                    status: 'active',
                    expires_at: this.getKeyExpiry(),
                    created_at: new Date().toISOString(),
                    metadata: {
                        auto_refreshed: true,
                        validation_passed: true
                    }
                });

            if (error) throw error;

            console.log('💾 FMP API key stored successfully');
        } catch (error) {
            console.error('Error storing FMP key:', error);
        }
    }

    getKeyExpiry() {
        // FMP keys expire daily, set expiry to end of day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Start of next day
        return tomorrow;
    }

    async scheduleKeyRefresh() {
        // Calculate time until next refresh (daily at midnight)
        const now = new Date();
        const nextMidnight = new Date();
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = nextMidnight.getTime() - now.getTime();
        
        console.log(`⏰ Scheduling FMP key refresh in ${Math.round(msUntilMidnight / 1000 / 60 / 60)} hours`);
        
        setTimeout(async () => {
            try {
                await this.refreshKey();
                // Schedule next refresh
                this.scheduleKeyRefresh();
            } catch (error) {
                console.error('Scheduled key refresh failed:', error);
                // Retry in 1 hour
                setTimeout(() => this.scheduleKeyRefresh(), 60 * 60 * 1000);
            }
        }, msUntilMidnight);
    }

    async getKeyStatus() {
        try {
            const { data: keyData } = await supabase
                .from('api_keys')
                .select('*')
                .eq('provider', 'fmp')
                .order('created_at', { ascending: false })
                .limit(5);

            const currentKey = await this.getCurrentKey();
            const isValid = currentKey ? await this.validateKey(currentKey) : false;

            return {
                currentKey: currentKey ? `${currentKey.substring(0, 8)}***` : 'None',
                isValid,
                expiry: this.keyExpiry,
                recentKeys: keyData?.map(k => ({
                    key: `${k.api_key.substring(0, 8)}***`,
                    status: k.status,
                    created: k.created_at,
                    expires: k.expires_at
                })) || []
            };
        } catch (error) {
            console.error('Error getting key status:', error);
            return { error: error.message };
        }
    }
}

// Singleton instance
let keyManager = null;

export function getFMPKeyManager() {
    if (!keyManager) {
        keyManager = new FMPKeyManager();
        // Start automatic refresh scheduling in production
        if (process.env.NODE_ENV === 'production') {
            keyManager.scheduleKeyRefresh();
        }
    }
    return keyManager;
}

// API Handler
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const manager = getFMPKeyManager();
    const { action } = req.body || req.query;
    
    try {
        switch (action) {
            case 'get-current-key':
                const currentKey = await manager.getCurrentKey();
                return res.json({ 
                    success: true, 
                    key: currentKey ? `${currentKey.substring(0, 8)}***` : 'None',
                    fullKey: currentKey // Only for internal use
                });
                
            case 'refresh-key':
                const newKey = await manager.refreshKey();
                return res.json({ 
                    success: true, 
                    message: 'Key refreshed successfully',
                    key: `${newKey.substring(0, 8)}***`
                });
                
            case 'validate-key':
                const { testKey } = req.body;
                if (!testKey) {
                    return res.status(400).json({ error: 'Test key required' });
                }
                const isValid = await manager.validateKey(testKey);
                return res.json({ success: true, isValid });
                
            case 'status':
                const status = await manager.getKeyStatus();
                return res.json({ success: true, status });
                
            default:
                return res.json({
                    success: true,
                    message: 'FMP Key Manager is running',
                    actions: ['get-current-key', 'refresh-key', 'validate-key', 'status'],
                    info: {
                        provider: 'Financial Modeling Prep',
                        keyRotation: 'Daily',
                        autoRefresh: process.env.NODE_ENV === 'production'
                    }
                });
        }
    } catch (error) {
        console.error('FMP Key Manager error:', error);
        return res.status(500).json({ 
            error: 'Key management failed', 
            message: error.message 
        });
    }
}
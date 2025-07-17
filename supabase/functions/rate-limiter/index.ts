import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitConfig {
  endpoint: string
  limit: number
  windowMinutes: number
}

const defaultLimits: Record<string, RateLimitConfig> = {
  'deploy_to_blockchain': { endpoint: 'deploy_to_blockchain', limit: 10, windowMinutes: 60 },
  'execute_blockchain_process': { endpoint: 'execute_blockchain_process', limit: 50, windowMinutes: 60 },
  'validate_blockchain_process': { endpoint: 'validate_blockchain_process', limit: 100, windowMinutes: 60 },
  'default': { endpoint: 'default', limit: 100, windowMinutes: 60 }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, identifier } = await req.json()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get rate limit config
    const config = defaultLimits[action] || defaultLimits['default']
    
    // Get client identifier (IP or user ID)
    const clientId = identifier || req.headers.get('x-forwarded-for') || 'anonymous'
    
    // Check rate limit
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientId,
      p_endpoint: config.endpoint,
      p_limit: config.limit,
      p_window_minutes: config.windowMinutes
    })

    if (error) throw error

    const allowed = data as boolean

    if (!allowed) {
      return new Response(
        JSON.stringify({
          allowed: false,
          error: 'Rate limit exceeded',
          limit: config.limit,
          windowMinutes: config.windowMinutes,
          retryAfter: config.windowMinutes * 60
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Window': config.windowMinutes.toString(),
            'Retry-After': (config.windowMinutes * 60).toString()
          },
        }
      )
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        limit: config.limit,
        windowMinutes: config.windowMinutes
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Window': config.windowMinutes.toString()
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
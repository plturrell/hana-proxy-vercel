// Simple health check endpoint
export default function handler(req, res) {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
            hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasGrok4: !!process.env.GROK_API_KEY || !!process.env.XAI_API_KEY || !!process.env.GROK4_API_KEY,
            hasFinhub: true, // Hardcoded in market-data-finhub.js
            hasFMP: true, // Hardcoded in market-data-fmp.js
            finhubKey: 'd1o8***d80', // Masked for security
            fmpKey: 'DKVI***VGuc' // Masked for security
        },
        message: 'FinSight BPMN is running'
    });
}
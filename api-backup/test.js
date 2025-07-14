// Simple test endpoint to verify API is working
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Test basic functionality
        const status = {
            success: true,
            message: 'Test endpoint working',
            timestamp: new Date().toISOString(),
            method: req.method,
            env: {
                hasHanaPassword: !!process.env.HANA_PASSWORD,
                hasFinnhubKey: !!process.env.FINNHUB_API_KEY,
                hasNewsApiKey: !!process.env.NEWS_API_KEY
            }
        };
        
        return res.json(status);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
// Simple redirect to supabase-proxy to fix deployment errors
// The original configure.js was moved to api-backup/ but Vercel still expects this file

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Redirect all configure requests to supabase-proxy
    try {
        const supabaseProxy = await import('./supabase-proxy.js');
        return supabaseProxy.default(req, res);
    } catch (error) {
        console.error('Configure redirect error:', error);
        return res.status(200).json({
            message: 'Configuration endpoint moved to /api/supabase-proxy',
            redirect: '/api/supabase-proxy',
            timestamp: new Date().toISOString()
        });
    }
}
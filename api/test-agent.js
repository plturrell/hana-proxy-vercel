export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Return basic status to verify the endpoint works
  return res.json({
    success: true,
    message: 'Test agent endpoint working',
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
      hasFinnhubKey: !!process.env.FINNHUB_API_KEY,
      hasFmpKey: !!process.env.FMP_API_KEY
    },
    timestamp: new Date()
  });
}
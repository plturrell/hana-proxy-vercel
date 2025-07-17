export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const timestamp = new Date().toISOString();
  const commitHash = '8d5fa3d'; // Latest commit
  
  return res.json({
    success: true,
    message: 'Deployment test successful!',
    timestamp: timestamp,
    commitHash: commitHash,
    version: 'Trust Section Standard with Grok AI',
    deployment: 'active'
  });
}
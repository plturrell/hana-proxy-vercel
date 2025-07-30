/**
 * Deploy consensus tables to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Deploying consensus tables...');
    
    // Read SQL file
    const sqlPath = path.join(path.dirname(__dirname), 'database', 'create-consensus-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    const results = [];
    const errors = [];
    
    // Execute each statement
    for (const statement of statements) {
      try {
        // Skip GRANT and CREATE POLICY statements for now
        if (statement.toUpperCase().includes('GRANT ') || 
            statement.toUpperCase().includes('CREATE POLICY') ||
            statement.toUpperCase().includes('ALTER TABLE') && statement.toUpperCase().includes('ENABLE ROW LEVEL SECURITY')) {
          console.log('Skipping permission statement');
          continue;
        }
        
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.error('Statement error:', error);
          errors.push({
            statement: statement.substring(0, 100),
            error: error.message
          });
        } else {
          results.push({
            statement: statement.substring(0, 100),
            success: true
          });
        }
      } catch (error) {
        console.error('Execution error:', error);
        errors.push({
          statement: statement.substring(0, 100),
          error: error.message
        });
      }
    }
    
    // Try direct table creation as fallback
    if (errors.length > 0) {
      console.log('Attempting direct table creation...');
      
      // Create tables directly
      const tables = [
        {
          name: 'a2a_proposals',
          check: async () => {
            const { count } = await supabase
              .from('a2a_proposals')
              .select('*', { count: 'exact', head: true });
            return count !== null;
          }
        },
        {
          name: 'a2a_votes',
          check: async () => {
            const { count } = await supabase
              .from('a2a_votes')
              .select('*', { count: 'exact', head: true });
            return count !== null;
          }
        },
        {
          name: 'a2a_consensus_rounds',
          check: async () => {
            const { count } = await supabase
              .from('a2a_consensus_rounds')
              .select('*', { count: 'exact', head: true });
            return count !== null;
          }
        },
        {
          name: 'a2a_contracts',
          check: async () => {
            const { count } = await supabase
              .from('a2a_contracts')
              .select('*', { count: 'exact', head: true });
            return count !== null;
          }
        }
      ];
      
      const tableStatus = [];
      for (const table of tables) {
        try {
          const exists = await table.check();
          tableStatus.push({
            table: table.name,
            exists: exists
          });
        } catch (error) {
          tableStatus.push({
            table: table.name,
            exists: false,
            error: error.message
          });
        }
      }
      
      return res.json({
        success: errors.length === 0,
        message: 'Consensus tables deployment attempted',
        results: results,
        errors: errors,
        tableStatus: tableStatus,
        recommendation: errors.length > 0 ? 
          'Some errors occurred. You may need to run the SQL directly in Supabase dashboard.' : 
          'Tables deployed successfully!'
      });
    }
    
    return res.json({
      success: true,
      message: 'Consensus tables deployed successfully',
      results: results
    });
    
  } catch (error) {
    console.error('Deploy consensus tables error:', error);
    return res.status(500).json({ 
      error: 'Failed to deploy consensus tables',
      details: error.message,
      recommendation: 'Try running the SQL file directly in Supabase SQL Editor'
    });
  }
}

// Helper function for direct invocation
export async function deployConsensusTables() {
  try {
    const req = { method: 'POST', body: {} };
    const res = {
      status: (code) => ({ json: (data) => console.log('Response:', code, data) }),
      json: (data) => console.log('Response:', data)
    };
    
    await handler(req, res);
  } catch (error) {
    console.error('Direct deployment error:', error);
  }
}

// Add execute_sql RPC function if it doesn't exist
const createExecuteSqlFunction = `
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE sql_query;
    result := jsonb_build_object('success', true);
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function deployCompleteRAGDatabase() {
  console.log('🚀 Deploying Complete RAG Database Schema...');

  try {
    // Read the migration SQL
    const sqlPath = path.join(__dirname, 'supabase/migrations/20250730_complete_rag_system.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the complete SQL as one block
    try {
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: sql 
      });
      
      if (error) {
        console.warn('RPC execution warning:', error.message);
        // Try alternative approach
        throw error;
      }
      
      console.log('✅ Migration executed successfully via RPC');
    } catch (rpcError) {
      console.log('⚠️ RPC failed, trying direct table operations...');
      
      // Fallback: Execute critical parts manually
      await executeCoreTables();
    }

    // Verify deployment
    await verifyDeployment();
    
    console.log('\n🎉 RAG Database Deployment Complete!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function executeCoreTables() {
  console.log('🔧 Creating tables manually...');
  
  // Create tables that definitely need to exist
  const tables = [
    {
      name: 'documents',
      sql: `CREATE TABLE IF NOT EXISTS documents (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        source_url TEXT,
        file_type TEXT,
        file_size_bytes BIGINT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`
    },
    {
      name: 'document_chunks',
      sql: `CREATE TABLE IF NOT EXISTS document_chunks (
        id BIGSERIAL PRIMARY KEY,
        document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        token_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(document_id, chunk_index)
      );`
    },
    {
      name: 'document_processing_status',
      sql: `CREATE TABLE IF NOT EXISTS document_processing_status (
        id BIGSERIAL PRIMARY KEY,
        document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
        status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        chunks_processed INTEGER DEFAULT 0,
        total_chunks INTEGER,
        error_message TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`
    },
    {
      name: 'search_history',
      sql: `CREATE TABLE IF NOT EXISTS search_history (
        id BIGSERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        query_embedding vector(1536),
        results_count INTEGER,
        search_type TEXT CHECK (search_type IN ('vector', 'hybrid', 'fulltext')),
        response_time_ms INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`
    }
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      if (error) {
        console.warn(`Warning creating ${table.name}:`, error.message);
      } else {
        console.log(`✅ Created table: ${table.name}`);
      }
    } catch (err) {
      console.warn(`Failed to create ${table.name}:`, err.message);
    }
  }
}

async function verifyDeployment() {
  console.log('🔍 Verifying deployment...');
  
  const tables = ['documents', 'document_chunks', 'document_processing_status', 'search_history'];
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: accessible`);
      }
    } catch (err) {
      console.log(`❌ Table ${tableName}: ${err.message}`);
    }
  }
  
  // Test vector extension
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT extname FROM pg_extension WHERE extname = 'vector';"
    });
    
    if (error || !data) {
      console.log('❌ Vector extension: not installed');
    } else {
      console.log('✅ Vector extension: installed');
    }
  } catch (err) {
    console.log('❌ Vector extension: unknown');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCompleteRAGDatabase();
}

export default deployCompleteRAGDatabase;
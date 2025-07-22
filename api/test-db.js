import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fnsbxaywhsxqppncqksu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // Test 1: Check connection
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key exists:', !!supabaseKey);
    console.log('Key prefix:', supabaseKey?.substring(0, 20));
    
    // Test 2: List all tables that start with 'news'
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'news%');
    
    if (tablesError) {
      console.log('Tables query failed, trying alternative...');
      // Try to query specific known tables
      const testTables = ['news_articles', 'news_articles_partitioned', 'news_sentiment_analysis'];
      const tableExists = {};
      
      for (const table of testTables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          tableExists[table] = error ? `Error: ${error.message}` : `Exists (${count} rows)`;
        } catch (e) {
          tableExists[table] = `Error: ${e.message}`;
        }
      }
      
      return res.status(200).json({
        connection: 'success',
        tables: tableExists,
        tablesError: tablesError?.message
      });
    }
    
    // Test 3: Try inserting a test record
    const testArticle = {
      article_id: `test_${Date.now()}`,
      title: 'Test Article',
      content: 'Test content',
      created_at: new Date().toISOString()
    };
    
    const insertResults = {};
    const testTableNames = ['news_articles', 'news_articles_partitioned'];
    
    for (const tableName of testTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .insert(testArticle)
          .select()
          .single();
        
        if (error) {
          insertResults[tableName] = `Insert failed: ${error.message}`;
        } else {
          insertResults[tableName] = 'Insert successful';
          
          // Clean up test record
          await supabase.from(tableName).delete().eq('article_id', testArticle.article_id);
        }
      } catch (e) {
        insertResults[tableName] = `Exception: ${e.message}`;
      }
    }
    
    return res.status(200).json({
      connection: 'success',
      availableTables: tables?.map(t => t.table_name) || [],
      insertTests: insertResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      error: 'Database test failed',
      details: error.message,
      stack: error.stack
    });
  }
}
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    if (action === 'generate') {
      return await generateCSN(req, res);
    }
    
    if (action === 'tables') {
      return await listTables(req, res);
    }
    
    if (action === 'schema') {
      return await getTableSchema(req, res);
    }
    
    if (action === 'update') {
      return await updateCSN(req, res);
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('CSN Generator Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Generate CSN from actual database schema
async function generateCSN(req, res) {
  try {
    // Get all tables from the database
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_database_tables', {});
    
    if (tablesError) {
      // If RPC doesn't exist, query information_schema directly
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_type', ['BASE TABLE']);
      
      if (schemaError) {
        // Fallback to known tables
        return generateFromKnownTables(res);
      }
      
      tables = schemaData;
    }

    const csn = {
      "@context": {
        "csn": "https://cap.cloud.sap/csn/1.0",
        "ord": "https://sap.github.io/object-resource-discovery/1.0"
      },
      "definitions": {},
      "services": {
        "finsight.srv.DataDiscovery": {
          "@ord.title": "Data Discovery Service",
          "@ord.description": "ORD service for discovering available data resources",
          "kind": "service",
          "entities": []
        }
      }
    };

    // Process each table
    for (const table of tables) {
      const tableName = table.table_name || table;
      const entityName = `finsight.db.${toPascalCase(tableName)}`;
      
      // Get columns for this table
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (!columnsError && columns) {
        csn.definitions[entityName] = {
          "@ord.title": toTitleCase(tableName),
          "@ord.description": `Data entity for ${tableName}`,
          "kind": "entity",
          "elements": {}
        };

        // Add columns
        for (const column of columns) {
          csn.definitions[entityName].elements[toCamelCase(column.column_name)] = {
            "type": mapPostgresToCSN(column.data_type),
            "@ord.title": toTitleCase(column.column_name),
            "nullable": column.is_nullable === 'YES'
          };
        }

        // Add to service entities
        csn.services["finsight.srv.DataDiscovery"].entities.push(toPascalCase(tableName));
      }
    }

    return res.json({ csn, generated_at: new Date().toISOString() });
    
  } catch (error) {
    console.error('Generate CSN error:', error);
    return generateFromKnownTables(res);
  }
}

// Generate CSN from known tables
function generateFromKnownTables(res) {
  const knownTables = {
    // A2A Agent tables
    "a2a_agents": {
      title: "A2A Agents",
      description: "Autonomous agents in the A2A network",
      columns: {
        agent_id: { type: "String", key: true },
        agent_name: { type: "String" },
        agent_type: { type: "String" },
        status: { type: "String" },
        capabilities: { type: "LargeString" },
        connection_config: { type: "LargeString" },
        metrics: { type: "LargeString" },
        created_at: { type: "Timestamp" }
      }
    },
    "a2a_messages": {
      title: "A2A Messages",
      description: "Messages between agents",
      columns: {
        message_id: { type: "UUID", key: true },
        from_agent_id: { type: "String" },
        to_agent_id: { type: "String" },
        message_type: { type: "String" },
        content: { type: "LargeString" },
        status: { type: "String" },
        created_at: { type: "Timestamp" }
      }
    },
    "agent_activity": {
      title: "Agent Activity",
      description: "Agent activity logs",
      columns: {
        activity_id: { type: "UUID", key: true },
        agent_id: { type: "String" },
        activity_type: { type: "String" },
        details: { type: "LargeString" },
        created_at: { type: "Timestamp" }
      }
    },
    // Blockchain tables
    "deployed_contracts": {
      title: "Deployed Contracts",
      description: "Smart contracts deployed to blockchain",
      columns: {
        contract_id: { type: "UUID", key: true },
        contract_name: { type: "String" },
        contract_address: { type: "String" },
        network: { type: "String" },
        deployer: { type: "String" },
        abi: { type: "LargeString" },
        created_at: { type: "Timestamp" }
      }
    },
    "blockchain_events": {
      title: "Blockchain Events",
      description: "Events from smart contracts",
      columns: {
        event_id: { type: "UUID", key: true },
        contract_name: { type: "String" },
        contract_address: { type: "String" },
        event_name: { type: "String" },
        args: { type: "LargeString" },
        block_number: { type: "Integer" },
        created_at: { type: "Timestamp" }
      }
    },
    // Financial data tables (assumed)
    "market_data": {
      title: "Market Data",
      description: "Real-time market data",
      columns: {
        symbol: { type: "String", key: true },
        timestamp: { type: "Timestamp", key: true },
        price: { type: "Decimal" },
        volume: { type: "Integer" },
        bid: { type: "Decimal" },
        ask: { type: "Decimal" }
      }
    },
    "portfolios": {
      title: "Portfolios",
      description: "Investment portfolios",
      columns: {
        portfolio_id: { type: "UUID", key: true },
        name: { type: "String" },
        owner_id: { type: "String" },
        total_value: { type: "Decimal" },
        currency: { type: "String" },
        created_at: { type: "Timestamp" }
      }
    },
    "trading_signals": {
      title: "Trading Signals",
      description: "AI-generated trading signals",
      columns: {
        signal_id: { type: "UUID", key: true },
        symbol: { type: "String" },
        action: { type: "String" },
        confidence: { type: "Decimal" },
        generated_by: { type: "String" },
        created_at: { type: "Timestamp" }
      }
    }
  };

  const csn = {
    "@context": {
      "csn": "https://cap.cloud.sap/csn/1.0",
      "ord": "https://sap.github.io/object-resource-discovery/1.0"
    },
    "definitions": {},
    "services": {
      "finsight.srv.DataDiscovery": {
        "@ord.title": "Data Discovery Service",
        "@ord.description": "ORD service for discovering available data resources",
        "kind": "service",
        "entities": []
      }
    }
  };

  for (const [tableName, tableInfo] of Object.entries(knownTables)) {
    const entityName = `finsight.db.${toPascalCase(tableName)}`;
    
    csn.definitions[entityName] = {
      "@ord.title": tableInfo.title,
      "@ord.description": tableInfo.description,
      "kind": "entity",
      "elements": {}
    };

    for (const [columnName, columnInfo] of Object.entries(tableInfo.columns)) {
      csn.definitions[entityName].elements[toCamelCase(columnName)] = {
        "type": columnInfo.type,
        "@ord.title": toTitleCase(columnName),
        "key": columnInfo.key || false
      };
    }

    csn.services["finsight.srv.DataDiscovery"].entities.push(toPascalCase(tableName));
  }

  return res.json({ 
    csn, 
    generated_at: new Date().toISOString(),
    source: 'known_tables'
  });
}

// List all available tables
async function listTables(req, res) {
  try {
    // Try to get tables from database
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .in('table_type', ['BASE TABLE', 'VIEW']);
    
    if (error) {
      // Return known tables
      return res.json({
        tables: [
          'a2a_agents',
          'a2a_messages',
          'agent_activity',
          'deployed_contracts',
          'blockchain_events',
          'market_data',
          'portfolios',
          'trading_signals'
        ],
        source: 'known_tables'
      });
    }

    return res.json({
      tables: tables.map(t => t.table_name),
      source: 'database'
    });
    
  } catch (error) {
    console.error('List tables error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get schema for a specific table
async function getTableSchema(req, res) {
  const { table } = req.query;
  
  if (!table) {
    return res.status(400).json({ error: 'Table name required' });
  }

  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', table);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const schema = {
      table_name: table,
      columns: columns.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default: col.column_default,
        max_length: col.character_maximum_length
      }))
    };

    return res.json(schema);
    
  } catch (error) {
    console.error('Get schema error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Update CSN with custom definitions
async function updateCSN(req, res) {
  const { definitions } = req.body;
  
  if (!definitions) {
    return res.status(400).json({ error: 'Definitions required' });
  }

  try {
    // Store custom CSN definitions (could be in a database table)
    // For now, we'll merge with existing CSN
    const baseCSN = await generateCSN({ method: 'GET' }, { json: () => {} });
    
    const updatedCSN = {
      ...baseCSN.csn,
      definitions: {
        ...baseCSN.csn.definitions,
        ...definitions
      }
    };

    return res.json({
      csn: updatedCSN,
      updated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Update CSN error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Helper functions
function toPascalCase(str) {
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toTitleCase(str) {
  return str.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function mapPostgresToCSN(pgType) {
  const typeMap = {
    'uuid': 'UUID',
    'text': 'String',
    'varchar': 'String',
    'character varying': 'String',
    'char': 'String',
    'integer': 'Integer',
    'bigint': 'Integer64',
    'smallint': 'Integer',
    'decimal': 'Decimal',
    'numeric': 'Decimal',
    'real': 'Double',
    'double precision': 'Double',
    'boolean': 'Boolean',
    'timestamp': 'Timestamp',
    'timestamp with time zone': 'Timestamp',
    'timestamp without time zone': 'Timestamp',
    'date': 'Date',
    'time': 'Time',
    'json': 'LargeString',
    'jsonb': 'LargeString',
    'array': 'array of String',
    'bytea': 'Binary'
  };
  
  return typeMap[pgType.toLowerCase()] || 'String';
}
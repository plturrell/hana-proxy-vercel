#!/usr/bin/env node
/**
 * Test Optimized Exasol WebSocket Client
 */

const ExasolWebSocketClient = require('./api/exasol-websocket-client.js');

class ExasolTester {
    constructor() {
        this.client = new ExasolWebSocketClient({
            host: '6c2pxsycfjdudh5tsy6bb4cqzy.clusters.exasol.com',
            port: 8563,
            user: 'admin',
            password: process.env.EXASOL_PAT || 'exa_pat_WtbBImutVtveHomSiKXZuuq4uR07uqfFTzG7WX421ygNsd',
            schema: 'app_data',
            encryption: true,
            autocommit: true,
            fetchSize: 100000
        });

        // Set up event listeners
        this.client.on('connected', () => {
            console.log('✅ WebSocket connected');
        });

        this.client.on('login', (attributes) => {
            console.log('✅ Login successful');
            console.log(`   Session ID: ${attributes.sessionId}`);
            console.log(`   Protocol Version: ${attributes.protocolVersion}`);
            console.log(`   Database: ${attributes.databaseName}`);
            console.log(`   Product: ${attributes.productName}`);
        });

        this.client.on('response', ({ command, duration, success }) => {
            if (success) {
                console.log(`✅ ${command} completed in ${duration}ms`);
            } else {
                console.log(`❌ ${command} failed after ${duration}ms`);
            }
        });

        this.client.on('error', (error) => {
            console.error('❌ Client error:', error.message);
        });

        this.client.on('disconnected', () => {
            console.log('🔌 Client disconnected');
        });
    }

    async runTests() {
        console.log('🚀 Testing Optimized Exasol WebSocket Client');
        console.log('============================================\n');

        try {
            // Test connection
            console.log('1. Testing connection...');
            await this.client.connect();
            console.log('✅ Connection established\n');

            // Test basic query
            console.log('2. Testing basic query...');
            const schemas = await this.client.execute('SELECT SCHEMA_NAME FROM EXA_ALL_SCHEMAS ORDER BY SCHEMA_NAME');
            console.log('✅ Schema query successful');
            console.log(`   Found ${schemas.numRows} schemas:`);
            schemas.rows.forEach(row => {
                console.log(`   - ${row[0]}`);
            });
            console.log();

            // Test schema creation
            console.log('3. Creating app_data schema...');
            await this.client.execute('CREATE SCHEMA IF NOT EXISTS app_data');
            console.log('✅ Schema created\n');

            // Test UDF creation
            console.log('4. Creating test UDF...');
            const testUDF = `
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.test_optimized_client()
RETURNS VARCHAR(200) AS
function run(ctx)
    return "Optimized Exasol WebSocket client working perfectly! Connected at " .. os.date()
end
/`;
            
            await this.client.execute(testUDF);
            console.log('✅ Test UDF created\n');

            // Test UDF execution
            console.log('5. Testing UDF execution...');
            const udfResult = await this.client.executeUDF('test_optimized_client', []);
            console.log('✅ UDF executed successfully');
            console.log(`   Result: ${udfResult.rows[0][0]}\n`);

            // Test prepared statements
            console.log('6. Testing prepared statements...');
            const preparedStmt = await this.client.prepare('SELECT ? as test_value, CURRENT_TIMESTAMP as timestamp');
            const preparedResult = await this.client.executePrepared(preparedStmt, ['Prepared statement test']);
            console.log('✅ Prepared statement executed');
            console.log(`   Value: ${preparedResult.rows[0][0]}`);
            console.log(`   Timestamp: ${preparedResult.rows[0][1]}`);
            await this.client.closePreparedStatement(preparedStmt);
            console.log();

            // Test session attributes
            console.log('7. Testing session attributes...');
            const attributes = await this.client.getAttributes();
            console.log('✅ Session attributes retrieved');
            console.log(`   Current Schema: ${attributes.currentSchema}`);
            console.log(`   Autocommit: ${attributes.autocommit}`);
            console.log(`   Timezone: ${attributes.timezone}`);
            console.log();

            // Test performance metrics
            console.log('8. Performance metrics...');
            const metrics = this.client.getMetrics();
            console.log('✅ Metrics collected');
            console.log(`   Total queries: ${metrics.queries}`);
            console.log(`   Average query time: ${metrics.avgQueryTime.toFixed(2)}ms`);
            console.log(`   Errors: ${metrics.errors}`);
            console.log(`   Slow queries: ${metrics.slowQueries.length}`);
            console.log(`   Connected: ${metrics.connected}`);
            console.log();

            // Final schema verification
            console.log('9. Final verification...');
            const finalSchemas = await this.client.execute('SELECT SCHEMA_NAME FROM EXA_ALL_SCHEMAS WHERE SCHEMA_NAME = ?', ['APP_DATA']);
            console.log('✅ Verification complete');
            console.log(`   app_data schema exists: ${finalSchemas.numRows > 0 ? 'YES' : 'NO'}\n`);

            console.log('🎉 All tests passed successfully!');
            console.log('✅ Optimized WebSocket client is working properly');
            console.log('✅ Schema and UDF deployment successful');
            console.log('✅ Ready for production use');

            return true;

        } catch (error) {
            console.error('\n💥 Test failed:', error.message);
            if (error.sqlCode) {
                console.error(`   SQL Code: ${error.sqlCode}`);
            }
            return false;
        } finally {
            // Clean disconnect
            console.log('\n🔌 Disconnecting...');
            await this.client.disconnect();
        }
    }
}

async function main() {
    const tester = new ExasolTester();
    
    try {
        const success = await tester.runTests();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('💥 Script failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
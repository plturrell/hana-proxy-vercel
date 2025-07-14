#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ExasolWebSocketClient = require('./api/exasol-websocket-client');

async function deployUDFs() {
    console.log('🚀 Starting UDF deployment to Exasol cluster...');
    
    // Initialize Exasol client
    const client = new ExasolWebSocketClient({
        host: '6c2pxsycfjdudh5tsy6bb4cqzy.clusters.exasol.com',
        port: 8563,
        username: 'admin',
        password: process.env.EXASOL_PAT,
        schema: 'app_data'
    });

    try {
        // Connect to Exasol
        console.log('📡 Connecting to Exasol cluster...');
        await client.connect();
        console.log('✅ Connected successfully');

        // Create schema if not exists
        console.log('🏗️  Creating schema app_data...');
        await client.execute('CREATE SCHEMA IF NOT EXISTS app_data');
        console.log('✅ Schema created/verified');

        // Get all UDF files
        const migrationDir = path.join(__dirname, 'exasol-migration');
        const udfFiles = fs.readdirSync(migrationDir)
            .filter(file => file.endsWith('_udfs.lua'))
            .sort();

        console.log(`📁 Found ${udfFiles.length} UDF files to deploy:`);
        udfFiles.forEach(file => console.log(`   - ${file}`));

        let totalUDFs = 0;
        let successfulUDFs = 0;
        let failedUDFs = 0;

        // Deploy each file
        for (const file of udfFiles) {
            console.log(`\n🔄 Deploying ${file}...`);
            const filePath = path.join(migrationDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Split content by UDF (each UDF ends with '/')
            const udfs = content.split('/\n').filter(udf => udf.trim().length > 0);
            
            for (let i = 0; i < udfs.length; i++) {
                const udf = udfs[i].trim();
                if (udf.length === 0) continue;
                
                totalUDFs++;
                
                try {
                    // Extract UDF name for logging
                    const nameMatch = udf.match(/CREATE\s+OR\s+REPLACE\s+LUA\s+SCALAR\s+SCRIPT\s+app_data\.(\w+)/i);
                    const udfName = nameMatch ? nameMatch[1] : `UDF_${totalUDFs}`;
                    
                    console.log(`   📝 Creating ${udfName}...`);
                    await client.execute(udf);
                    console.log(`   ✅ ${udfName} deployed successfully`);
                    successfulUDFs++;
                    
                } catch (error) {
                    console.error(`   ❌ Failed to deploy UDF ${totalUDFs}: ${error.message}`);
                    failedUDFs++;
                }
            }
        }

        console.log('\n📊 Deployment Summary:');
        console.log(`   Total UDFs: ${totalUDFs}`);
        console.log(`   ✅ Successful: ${successfulUDFs}`);
        console.log(`   ❌ Failed: ${failedUDFs}`);
        console.log(`   📈 Success Rate: ${((successfulUDFs / totalUDFs) * 100).toFixed(1)}%`);

        // Verify deployment by listing UDFs
        console.log('\n🔍 Verifying deployed UDFs...');
        const result = await client.execute(`
            SELECT SCRIPT_NAME, SCRIPT_TYPE, SCRIPT_LANGUAGE
            FROM EXA_ALL_SCRIPTS 
            WHERE SCRIPT_SCHEMA = 'APP_DATA' 
            AND SCRIPT_TYPE = 'UDF'
            ORDER BY SCRIPT_NAME
        `);
        
        console.log(`📋 Found ${result.rows?.length || 0} UDFs in database:`);
        if (result.rows) {
            result.rows.forEach(row => {
                console.log(`   - ${row[0]} (${row[1]}, ${row[2]})`);
            });
        }

        return {
            totalUDFs,
            successfulUDFs,
            failedUDFs,
            deployedUDFs: result.rows?.length || 0
        };

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    } finally {
        await client.close();
        console.log('🔌 Connection closed');
    }
}

// Main execution
if (require.main === module) {
    deployUDFs()
        .then(stats => {
            console.log('\n🎉 UDF deployment completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 UDF deployment failed:', error.message);
            process.exit(1);
        });
}

module.exports = { deployUDFs };
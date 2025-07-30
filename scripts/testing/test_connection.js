#!/usr/bin/env node

const WebSocket = require('./node_modules/ws');

async function testBasicConnection() {
    console.log('🧪 Testing basic WebSocket connection to Exasol...');
    
    const url = 'wss://6c2pxsycfjdudh5tsy6bb4cqzy.clusters.exasol.com:8563';
    console.log('🔗 Connecting to:', url);
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url, {
            rejectUnauthorized: false,
            timeout: 10000
        });
        
        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout after 10 seconds');
            ws.close();
            reject(new Error('Connection timeout'));
        }, 10000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connection established');
            clearTimeout(timeout);
        });
        
        ws.on('message', (data) => {
            console.log('📨 Received message:', data.toString());
            // Parse the message to check if it's a valid Exasol response
            try {
                const response = JSON.parse(data.toString());
                console.log('📋 Parsed response:', JSON.stringify(response, null, 2));
                
                if (response.responseData && response.responseData.publicKeyPem) {
                    console.log('🔑 Received public key from Exasol server');
                    console.log('✅ Connection test successful - Exasol is responding');
                    ws.close();
                    resolve(true);
                } else {
                    console.log('📄 Received response but no public key found');
                }
            } catch (error) {
                console.log('❌ Failed to parse response as JSON:', error.message);
                console.log('📝 Raw response:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            clearTimeout(timeout);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket closed: ${code} ${reason || ''}`);
            clearTimeout(timeout);
            if (code === 1006) {
                reject(new Error('WebSocket connection closed unexpectedly (1006)'));
            } else {
                resolve(false);
            }
        });
    });
}

if (require.main === module) {
    testBasicConnection()
        .then(success => {
            if (success) {
                console.log('\n🎉 Connection test passed!');
                process.exit(0);
            } else {
                console.log('\n❌ Connection test failed');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Connection test failed:', error.message);
            process.exit(1);
        });
}
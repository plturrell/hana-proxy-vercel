#!/usr/bin/env node
/**
 * Exasol Deployment Script
 * Deploys schemas and UDFs to your Exasol cluster
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class ExasolDeployer {
    constructor() {
        this.config = {
            host: '6c2pxsycfjdudh5tsy6bb4cqzy.clusters.exasol.com',
            port: 8563,
            username: 'admin',
            password: process.env.EXASOL_PAT || 'exa_pat_WtbBImutVtveHomSiKXZuuq4uR07uqfFTzG7WX421ygNsd'
        };
        
        this.ws = null;
        this.sessionId = null;
        this.commandCounter = 0;
        this.deploymentResults = [];
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const url = `wss://${this.config.host}:${this.config.port}`;
                console.log(`Connecting to Exasol: ${url}`);
                
                this.ws = new WebSocket(url);
                
                this.ws.on('open', () => {
                    console.log('WebSocket connection established');
                    this.login().then(resolve).catch(reject);
                });
                
                this.ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                });
                
                this.ws.on('close', () => {
                    console.log('WebSocket connection closed');
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async login() {
        return new Promise((resolve, reject) => {
            const loginCommand = {
                command: 'login',
                protocolVersion: 1,
                attributes: {
                    username: this.config.username,
                    password: this.config.password,
                    useCompression: false,
                    clientName: 'Exasol-Deployer',
                    clientVersion: '1.0.0'
                }
            };

            this.commandCounter++;
            loginCommand.messageId = this.commandCounter;

            const messageHandler = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    
                    if (response.messageId === this.commandCounter) {
                        this.ws.removeListener('message', messageHandler);
                        
                        if (response.status === 'ok') {
                            this.sessionId = response.sessionId;
                            console.log('Successfully logged in to Exasol');
                            resolve();
                        } else {
                            const error = response.exception?.text || 'Login failed';
                            console.error('Login failed:', error);
                            reject(new Error(error));
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };

            this.ws.on('message', messageHandler);
            this.ws.send(JSON.stringify(loginCommand));
        });
    }

    async executeSQL(sql, description = '') {
        return new Promise((resolve, reject) => {
            const executeCommand = {
                command: 'execute',
                attributes: {
                    sqlText: sql,
                    resultSetMaxRows: 1000
                }
            };

            this.commandCounter++;
            executeCommand.messageId = this.commandCounter;

            console.log(`${description}`);
            console.log(`SQL: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);

            const messageHandler = (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    
                    if (response.messageId === this.commandCounter) {
                        this.ws.removeListener('message', messageHandler);
                        
                        if (response.status === 'ok') {
                            console.log(`Success`);
                            this.deploymentResults.push({
                                description,
                                sql: sql.substring(0, 200),
                                status: 'success',
                                timestamp: new Date().toISOString()
                            });
                            resolve(response);
                        } else {
                            const error = response.exception?.text || 'SQL execution failed';
                            console.error(`Failed: ${error}`);
                            this.deploymentResults.push({
                                description,
                                sql: sql.substring(0, 200),
                                status: 'failed',
                                error,
                                timestamp: new Date().toISOString()
                            });
                            reject(new Error(error));
                        }
                    }
                } catch (error) {
                    reject(error);
                }
            };

            this.ws.on('message', messageHandler);
            this.ws.send(JSON.stringify(executeCommand));
        });
    }

    async deploy() {
        console.log('Starting Exasol deployment...');
        
        let success = true;
        
        try {
            // Connect to Exasol
            await this.connect();
            
            // List current schemas
            console.log('\nListing current schemas...');
            const schemasResult = await this.executeSQL(
                'SELECT SCHEMA_NAME FROM EXA_ALL_SCHEMAS ORDER BY SCHEMA_NAME',
                'Listing all schemas'
            );
            
            if (schemasResult.results && schemasResult.results.length > 0) {
                console.log('Current schemas:');
                schemasResult.results.forEach(row => {
                    console.log(`- ${row[0]}`);
                });
            } else {
                console.log('No schemas found');
            }
            
            // Create app_data schema
            console.log('\nCreating app_data schema...');
            await this.executeSQL(
                'CREATE SCHEMA IF NOT EXISTS app_data',
                'Creating app_data schema'
            );
            
            // Deploy test UDF
            console.log('\nDeploying test UDF...');
            const testUDF = `
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.test_connection()
RETURNS VARCHAR(100) AS
function run(ctx)
    return "Exasol deployment successful!"
end
/`;

            await this.executeSQL(testUDF, 'Creating test UDF');
            
            // Test the UDF
            console.log('\nTesting UDF...');
            const testResult = await this.executeSQL(
                'SELECT app_data.test_connection() as result',
                'Testing UDF execution'
            );
            
            console.log('Test result:', testResult.results);
            
            // List schemas again
            console.log('\nListing schemas after deployment...');
            const finalSchemas = await this.executeSQL(
                'SELECT SCHEMA_NAME FROM EXA_ALL_SCHEMAS ORDER BY SCHEMA_NAME',
                'Final schema list'
            );
            
            if (finalSchemas.results) {
                console.log('Final schemas:');
                finalSchemas.results.forEach(row => {
                    console.log(`- ${row[0]}`);
                });
            }
            
            this.generateReport(true);
            return true;
            
        } catch (error) {
            console.error('Deployment failed:', error.message);
            this.generateReport(false);
            return false;
        } finally {
            if (this.ws) {
                this.ws.close();
            }
        }
    }

    generateReport(success) {
        console.log('\n' + '='.repeat(60));
        console.log('EXASOL DEPLOYMENT REPORT');
        console.log('='.repeat(60));
        
        console.log(`Status: ${success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Cluster: ${this.config.host}`);
        console.log(`Operations: ${this.deploymentResults.length}`);
        
        console.log('\nOperations performed:');
        this.deploymentResults.forEach((result, index) => {
            const status = result.status === 'success' ? '✓' : '✗';
            console.log(`${index + 1}. ${status} ${result.description}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        console.log('='.repeat(60));
        
        // Save report to file
        const report = {
            success,
            timestamp: new Date().toISOString(),
            cluster: this.config.host,
            operations: this.deploymentResults
        };
        
        fs.writeFileSync('deployment_report.json', JSON.stringify(report, null, 2));
        console.log('\nReport saved to: deployment_report.json');
    }
}

async function main() {
    const deployer = new ExasolDeployer();
    
    try {
        const success = await deployer.deploy();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('Script failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ExasolDeployer;
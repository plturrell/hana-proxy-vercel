#!/usr/bin/env node
/**
 * Test Optimized Exasol WebSocket Client
 */

const ExasolWebSocketClient = require('./api/exasol-websocket-client.js');

class ExasolTester {
    def __init__(self):
        self.config = {
            'host': '6c2pxsycfjdudh5tsy6bb4cqzy.clusters.exasol.com',
            'port': 8563,
            'username': 'admin',
            'password': 'exa_pat_WtbBImutVtveHomSiKXZuuq4uR07uqfFTzG7WX421ygNsd'
        }
        self.ws = None
        self.session_id = None
        self.command_counter = 0

    def connect(self):
        url = f"wss://{self.config['host']}:{self.config['port']}"
        print(f"Connecting to: {url}")
        
        try:
            self.ws = websocket.create_connection(
                url,
                sslopt={"cert_reqs": ssl.CERT_NONE}
            )
            print("WebSocket connection established")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def login(self):
        login_command = {
            "command": "login",
            "protocolVersion": 3,
            "username": self.config['username'],
            "password": self.config['password'],
            "useCompression": False,
            "clientName": "Exasol-Test-Client",
            "clientVersion": "1.0.0"
        }

        self.command_counter += 1
        login_command["messageId"] = self.command_counter

        try:
            self.ws.send(json.dumps(login_command))
            response = json.loads(self.ws.recv())

            if response.get('status') == 'ok':
                self.session_id = response.get('sessionId')
                print("Successfully logged in")
                return True
            else:
                error = response.get('exception', {}).get('text', 'Unknown error')
                print(f"Login failed: {error}")
                return False
        except Exception as e:
            print(f"Login error: {e}")
            return False

    def execute_sql(self, sql, description=""):
        execute_command = {
            "command": "execute",
            "sqlText": sql
        }

        self.command_counter += 1
        execute_command["messageId"] = self.command_counter

        print(f"{description}")
        print(f"SQL: {sql}")

        try:
            self.ws.send(json.dumps(execute_command))
            response = json.loads(self.ws.recv())

            if response.get('status') == 'ok':
                print("✓ Success")
                if 'results' in response:
                    print(f"Results: {response['results']}")
                return response
            else:
                error = response.get('exception', {}).get('text', 'Unknown error')
                print(f"✗ Failed: {error}")
                return None
        except Exception as e:
            print(f"Execution error: {e}")
            return None

    def test_deployment(self):
        print("Starting Exasol deployment test...")
        
        if not self.connect():
            return False

        if not self.login():
            return False

        # List current schemas
        print("\n1. Listing current schemas...")
        self.execute_sql(
            "SELECT SCHEMA_NAME FROM EXA_ALL_SCHEMAS ORDER BY SCHEMA_NAME",
            "Getting current schemas"
        )

        # Create schema
        print("\n2. Creating app_data schema...")
        self.execute_sql(
            "CREATE SCHEMA IF NOT EXISTS app_data",
            "Creating app_data schema"
        )

        # Create test UDF
        print("\n3. Creating test UDF...")
        test_udf = """
CREATE OR REPLACE LUA SCALAR SCRIPT app_data.test_connection()
RETURNS VARCHAR(100) AS
function run(ctx)
    return "Exasol deployment working!"
end
/"""
        
        self.execute_sql(test_udf, "Creating test UDF")

        # Test UDF
        print("\n4. Testing UDF...")
        result = self.execute_sql(
            "SELECT app_data.test_connection() as result",
            "Testing UDF execution"
        )

        # List schemas again
        print("\n5. Final schema list...")
        self.execute_sql(
            "SELECT SCHEMA_NAME FROM EXA_ALL_SCHEMAS ORDER BY SCHEMA_NAME",
            "Final schema check"
        )

        if self.ws:
            self.ws.close()

        return True

if __name__ == "__main__":
    tester = ExasolTester()
    try:
        success = tester.test_deployment()
        if success:
            print("\n✓ Test completed successfully")
        else:
            print("\n✗ Test failed")
    except Exception as e:
        print(f"\nTest failed with error: {e}")
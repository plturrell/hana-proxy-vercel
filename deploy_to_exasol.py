#!/usr/bin/env python3

import requests
import json
import base64
import os
import glob

# Exasol connection details
EXASOL_HOST = "6c2pxsycfjdudh5tsy6bb4cqzy.clusters.exasol.com"
EXASOL_TOKEN = "exa_pat_yyeUiyP3SAkX20RchMS0viPkmMZuw94ImwB44wBm4zCs7U"

def execute_sql(sql_statement):
    """Execute SQL statement on Exasol via REST API"""
    url = f"https://{EXASOL_HOST}/api/v1/sql"
    headers = {
        "Authorization": f"Bearer {EXASOL_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "sqlText": sql_statement
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, verify=False)
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, f"Error {response.status_code}: {response.text}"
    except Exception as e:
        return False, str(e)

def main():
    print("🚀 ACTUAL Exasol Deployment Starting...")
    
    # First, create schema
    print("\n1️⃣ Creating app_data schema...")
    success, result = execute_sql("CREATE SCHEMA IF NOT EXISTS app_data;")
    if success:
        print("✅ Schema created/verified")
    else:
        print(f"❌ Schema creation failed: {result}")
    
    # Deploy production tables
    print("\n2️⃣ Creating production tables...")
    with open('create_production_schema.sql', 'r') as f:
        sql_content = f.read()
        
    # Split by semicolon and execute each statement
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    success_count = 0
    failed_count = 0
    
    for i, statement in enumerate(statements):
        if statement.startswith('--') or not statement:
            continue
            
        print(f"\nExecuting statement {i+1}/{len(statements)}...")
        success, result = execute_sql(statement + ';')
        
        if success:
            success_count += 1
            print(f"✅ Success")
        else:
            failed_count += 1
            print(f"❌ Failed: {result}")
    
    # Deploy UDFs
    print("\n3️⃣ Deploying UDFs...")
    udf_files = sorted(glob.glob('./exasol-migration/*_udfs.lua'))
    
    total_udfs = 0
    deployed_udfs = 0
    
    for udf_file in udf_files:
        print(f"\n📄 Processing {os.path.basename(udf_file)}...")
        with open(udf_file, 'r') as f:
            content = f.read()
        
        # Split UDFs (each ends with /)
        udfs = [u.strip() for u in content.split('/') if u.strip()]
        
        for udf in udfs:
            if not udf:
                continue
                
            total_udfs += 1
            success, result = execute_sql(udf)
            
            if success:
                deployed_udfs += 1
                print(f"   ✅ UDF {total_udfs} deployed")
            else:
                print(f"   ❌ UDF {total_udfs} failed: {result}")
    
    # Verify deployment
    print("\n4️⃣ Verifying deployment...")
    success, result = execute_sql("""
        SELECT COUNT(*) as table_count 
        FROM EXA_ALL_TABLES 
        WHERE TABLE_SCHEMA = 'APP_DATA'
    """)
    
    if success:
        print(f"✅ Tables in APP_DATA: {result}")
    
    success, result = execute_sql("""
        SELECT COUNT(*) as udf_count 
        FROM EXA_ALL_SCRIPTS 
        WHERE SCRIPT_SCHEMA = 'APP_DATA' 
        AND SCRIPT_TYPE = 'UDF'
    """)
    
    if success:
        print(f"✅ UDFs in APP_DATA: {result}")
    
    print(f"\n📊 FINAL SUMMARY:")
    print(f"   Tables: {success_count} successful, {failed_count} failed")
    print(f"   UDFs: {deployed_udfs} successful, {total_udfs - deployed_udfs} failed")
    print(f"   Total Success Rate: {((success_count + deployed_udfs) / (success_count + failed_count + total_udfs)) * 100:.1f}%")

if __name__ == "__main__":
    main()
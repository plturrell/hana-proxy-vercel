-- Comprehensive Audit Logging for A2A Blockchain System
-- Immutable audit trail with tamper protection

-- 1. Create comprehensive audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    event_type TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'EXECUTE', 'AUTH')),
    user_id TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    request_id TEXT,
    api_endpoint TEXT,
    execution_time_ms INTEGER,
    
    -- Security
    signature TEXT, -- HMAC signature for tamper detection
    
    -- Indexes will be created below
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'data_change', 'api_call', 'auth_attempt', 'permission_check',
        'blockchain_operation', 'secret_access', 'rate_limit', 'error'
    ))
);

-- Make audit log append-only (no updates or deletes)
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- 2. Create function to generate audit signature
CREATE OR REPLACE FUNCTION generate_audit_signature(
    p_event_type TEXT,
    p_table_name TEXT,
    p_record_id TEXT,
    p_action TEXT,
    p_user_id TEXT,
    p_old_values JSONB,
    p_new_values JSONB
)
RETURNS TEXT AS $$
DECLARE
    v_data TEXT;
    v_secret TEXT;
    v_signature TEXT;
BEGIN
    -- Get signing secret from vault
    SELECT vault.get_secret('audit_signing_key') INTO v_secret;
    
    -- Create data string for signing
    v_data := COALESCE(p_event_type, '') || '|' ||
              COALESCE(p_table_name, '') || '|' ||
              COALESCE(p_record_id, '') || '|' ||
              COALESCE(p_action, '') || '|' ||
              COALESCE(p_user_id, '') || '|' ||
              COALESCE(p_old_values::text, '') || '|' ||
              COALESCE(p_new_values::text, '');
    
    -- Generate HMAC signature
    v_signature := encode(
        hmac(v_data::bytea, COALESCE(v_secret, 'default-key')::bytea, 'sha256'),
        'hex'
    );
    
    RETURN v_signature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create comprehensive audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id TEXT;
    v_session_id TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
    v_signature TEXT;
BEGIN
    -- Get current user and session
    v_user_id := COALESCE(current_setting('app.user_id', true), 'system');
    v_session_id := COALESCE(current_setting('app.session_id', true), gen_random_uuid()::text);
    
    -- Prepare old and new values
    IF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
        -- Calculate changed fields
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_old_values) o
        FULL OUTER JOIN jsonb_each(v_new_values) n ON o.key = n.key
        WHERE o.value IS DISTINCT FROM n.value;
    ELSE -- INSERT
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    END IF;
    
    -- Generate signature
    v_signature := generate_audit_signature(
        'data_change',
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        TG_OP,
        v_user_id,
        v_old_values,
        v_new_values
    );
    
    -- Insert audit log
    INSERT INTO audit_logs (
        event_type,
        table_name,
        record_id,
        action,
        user_id,
        session_id,
        old_values,
        new_values,
        changed_fields,
        signature
    ) VALUES (
        'data_change',
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        TG_OP,
        v_user_id,
        v_session_id,
        v_old_values,
        v_new_values,
        v_changed_fields,
        v_signature
    );
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply audit triggers to all blockchain tables
DO $$
DECLARE
    v_table_name TEXT;
BEGIN
    FOR v_table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'a2a_blockchain_%'
    LOOP
        EXECUTE format('
            CREATE TRIGGER audit_trigger_%s
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        ', v_table_name, v_table_name);
    END LOOP;
END $$;

-- 5. Create function to log API calls
CREATE OR REPLACE FUNCTION log_api_call(
    p_endpoint TEXT,
    p_user_id TEXT,
    p_action TEXT,
    p_request_data JSONB,
    p_response_data JSONB,
    p_execution_time_ms INTEGER,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        event_type,
        api_endpoint,
        action,
        user_id,
        new_values,
        execution_time_ms,
        ip_address,
        user_agent
    ) VALUES (
        'api_call',
        p_endpoint,
        p_action,
        p_user_id,
        jsonb_build_object(
            'request', p_request_data,
            'response', p_response_data
        ),
        p_execution_time_ms,
        p_ip_address,
        p_user_agent
    ) RETURNING audit_id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_integrity(
    p_audit_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_audit RECORD;
    v_calculated_signature TEXT;
BEGIN
    SELECT * INTO v_audit
    FROM audit_logs
    WHERE audit_id = p_audit_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Recalculate signature
    v_calculated_signature := generate_audit_signature(
        v_audit.event_type,
        v_audit.table_name,
        v_audit.record_id,
        v_audit.action,
        v_audit.user_id,
        v_audit.old_values,
        v_audit.new_values
    );
    
    -- Compare signatures
    RETURN v_audit.signature = v_calculated_signature;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create audit summary views
CREATE OR REPLACE VIEW audit_summary_by_table AS
SELECT 
    table_name,
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
    COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE action = 'DELETE') as deletes,
    COUNT(DISTINCT user_id) as unique_users,
    MAX(event_time) as last_activity
FROM audit_logs
WHERE event_type = 'data_change'
GROUP BY table_name;

CREATE OR REPLACE VIEW audit_summary_by_user AS
SELECT 
    user_id,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(event_time)) as active_days,
    COUNT(*) FILTER (WHERE event_type = 'api_call') as api_calls,
    COUNT(*) FILTER (WHERE event_type = 'data_change') as data_changes,
    MAX(event_time) as last_activity
FROM audit_logs
GROUP BY user_id;

-- 8. Create indexes for performance
CREATE INDEX idx_audit_logs_event_time ON audit_logs(event_time DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, event_time DESC);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name, event_time DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type, event_time DESC);
CREATE INDEX idx_audit_logs_api_endpoint ON audit_logs(api_endpoint) WHERE api_endpoint IS NOT NULL;

-- 9. Create retention policy function
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
    p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    -- Move old logs to archive table
    WITH archived AS (
        INSERT INTO audit_logs_archive
        SELECT * FROM audit_logs
        WHERE event_time < NOW() - (p_days_to_keep || ' days')::INTERVAL
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_archived_count FROM archived;
    
    -- Note: We can't actually delete from audit_logs due to the rule
    -- In production, you'd partition the table by date instead
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Create archive table
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    LIKE audit_logs INCLUDING ALL
);

-- 11. Row Level Security for audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs
CREATE POLICY "Service role can read audit logs" ON audit_logs
    FOR SELECT USING (auth.jwt()->>'role' = 'service_role');

-- Users can read their own audit logs
CREATE POLICY "Users can read own audit logs" ON audit_logs
    FOR SELECT USING (
        auth.jwt()->>'role' = 'authenticated' AND
        user_id = auth.uid()::text
    );

-- 12. Create audit access tracking
CREATE TABLE IF NOT EXISTS audit_access_logs (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    accessed_by TEXT NOT NULL,
    audit_ids UUID[],
    purpose TEXT,
    ip_address INET
);

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_summary_by_table TO authenticated;
GRANT SELECT ON audit_summary_by_user TO authenticated;
GRANT EXECUTE ON FUNCTION verify_audit_integrity TO service_role;
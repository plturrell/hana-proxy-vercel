-- Add GraphQL Mutations
-- Migration: 20250719050004_add_graphql_mutations.sql

-- 1. User mutations

-- Update user profile
CREATE OR REPLACE FUNCTION public.gql_update_user_profile(
    p_user_id BIGINT,
    p_username TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_preferences JSONB DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user public.users;
BEGIN
    UPDATE public.users
    SET
        username = COALESCE(p_username, username),
        full_name = COALESCE(p_full_name, full_name),
        bio = COALESCE(p_bio, bio),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        preferences = COALESCE(p_preferences, preferences),
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO v_user;
    
    RETURN v_user;
END;
$$;

-- 2. Portfolio mutations

-- Add portfolio holding
CREATE OR REPLACE FUNCTION public.gql_add_portfolio_holding(
    p_user_id BIGINT,
    p_symbol TEXT,
    p_quantity DECIMAL,
    p_average_cost DECIMAL,
    p_asset_type TEXT DEFAULT 'stock',
    p_exchange TEXT DEFAULT NULL
)
RETURNS public.portfolio_holdings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_holding public.portfolio_holdings;
    v_current_price DECIMAL;
BEGIN
    -- Get current price
    SELECT price INTO v_current_price
    FROM public.market_data
    WHERE symbol = p_symbol
    ORDER BY timestamp DESC
    LIMIT 1;
    
    INSERT INTO public.portfolio_holdings (
        user_id,
        symbol,
        quantity,
        average_cost,
        current_price,
        market_value,
        unrealized_pnl,
        asset_type,
        exchange,
        last_updated
    ) VALUES (
        p_user_id,
        p_symbol,
        p_quantity,
        p_average_cost,
        COALESCE(v_current_price, p_average_cost),
        p_quantity * COALESCE(v_current_price, p_average_cost),
        p_quantity * (COALESCE(v_current_price, p_average_cost) - p_average_cost),
        p_asset_type,
        p_exchange,
        NOW()
    )
    RETURNING * INTO v_holding;
    
    RETURN v_holding;
END;
$$;

-- Update portfolio holding
CREATE OR REPLACE FUNCTION public.gql_update_portfolio_holding(
    p_holding_id UUID,
    p_quantity DECIMAL DEFAULT NULL,
    p_average_cost DECIMAL DEFAULT NULL
)
RETURNS public.portfolio_holdings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_holding public.portfolio_holdings;
    v_current_price DECIMAL;
BEGIN
    -- Get current holding and price
    SELECT current_price INTO v_current_price
    FROM public.portfolio_holdings
    WHERE id = p_holding_id;
    
    UPDATE public.portfolio_holdings
    SET
        quantity = COALESCE(p_quantity, quantity),
        average_cost = COALESCE(p_average_cost, average_cost),
        market_value = COALESCE(p_quantity, quantity) * current_price,
        unrealized_pnl = COALESCE(p_quantity, quantity) * (current_price - COALESCE(p_average_cost, average_cost)),
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = p_holding_id
    RETURNING * INTO v_holding;
    
    RETURN v_holding;
END;
$$;

-- 3. Price alert mutations

-- Create price alert
CREATE OR REPLACE FUNCTION public.gql_create_price_alert(
    p_user_id BIGINT,
    p_symbol TEXT,
    p_alert_type TEXT,
    p_threshold_value DECIMAL
)
RETURNS public.price_alerts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_alert public.price_alerts;
BEGIN
    INSERT INTO public.price_alerts (
        user_id,
        symbol,
        alert_type,
        threshold_value,
        is_active
    ) VALUES (
        p_user_id,
        p_symbol,
        p_alert_type,
        p_threshold_value,
        true
    )
    RETURNING * INTO v_alert;
    
    RETURN v_alert;
END;
$$;

-- 4. Task mutations

-- Create user task
CREATE OR REPLACE FUNCTION public.gql_create_task(
    p_user_id BIGINT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium',
    p_due_date TIMESTAMPTZ DEFAULT NULL,
    p_assigned_agent_id UUID DEFAULT NULL
)
RETURNS public.user_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task public.user_tasks;
BEGIN
    INSERT INTO public.user_tasks (
        user_id,
        title,
        description,
        priority,
        due_date,
        assigned_agent_id,
        status
    ) VALUES (
        p_user_id,
        p_title,
        p_description,
        p_priority,
        p_due_date,
        p_assigned_agent_id,
        'pending'
    )
    RETURNING * INTO v_task;
    
    RETURN v_task;
END;
$$;

-- Update task status
CREATE OR REPLACE FUNCTION public.gql_update_task_status(
    p_task_id UUID,
    p_status TEXT
)
RETURNS public.user_tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task public.user_tasks;
BEGIN
    UPDATE public.user_tasks
    SET
        status = p_status,
        completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_task_id
    RETURNING * INTO v_task;
    
    RETURN v_task;
END;
$$;

-- 5. Agent mutations

-- Create agent
CREATE OR REPLACE FUNCTION public.gql_create_agent(
    p_user_id BIGINT,
    p_name TEXT,
    p_type TEXT,
    p_capabilities TEXT[] DEFAULT '{}',
    p_configuration JSONB DEFAULT '{}'
)
RETURNS public.agents
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent public.agents;
BEGIN
    INSERT INTO public.agents (
        user_id,
        name,
        type,
        capabilities,
        configuration,
        status
    ) VALUES (
        p_user_id,
        p_name,
        p_type,
        p_capabilities,
        p_configuration,
        'active'
    )
    RETURNING * INTO v_agent;
    
    RETURN v_agent;
END;
$$;

-- 6. Notification mutations

-- Mark notification as read
CREATE OR REPLACE FUNCTION public.gql_mark_notification_read(
    p_notification_id UUID
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification public.notifications;
BEGIN
    UPDATE public.notifications
    SET
        is_read = true,
        read_at = NOW()
    WHERE id = p_notification_id
    RETURNING * INTO v_notification;
    
    RETURN v_notification;
END;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION public.gql_mark_all_notifications_read(
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET
        is_read = true,
        read_at = NOW()
    WHERE user_id = p_user_id
        AND is_read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 7. Complex mutations

-- Execute trade (creates portfolio holding and logs interaction)
CREATE OR REPLACE FUNCTION public.gql_execute_trade(
    p_user_id BIGINT,
    p_symbol TEXT,
    p_side TEXT, -- 'buy' or 'sell'
    p_quantity DECIMAL,
    p_price DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_holding public.portfolio_holdings;
    v_result JSONB;
    v_existing_quantity DECIMAL;
    v_existing_avg_cost DECIMAL;
    v_new_quantity DECIMAL;
    v_new_avg_cost DECIMAL;
BEGIN
    -- Get existing holding if any
    SELECT quantity, average_cost
    INTO v_existing_quantity, v_existing_avg_cost
    FROM public.portfolio_holdings
    WHERE user_id = p_user_id AND symbol = p_symbol
    LIMIT 1;
    
    IF p_side = 'buy' THEN
        -- Calculate new position
        v_new_quantity := COALESCE(v_existing_quantity, 0) + p_quantity;
        v_new_avg_cost := ((COALESCE(v_existing_quantity, 0) * COALESCE(v_existing_avg_cost, 0)) + (p_quantity * p_price)) / v_new_quantity;
        
        -- Update or insert holding
        INSERT INTO public.portfolio_holdings (
            user_id, symbol, quantity, average_cost, current_price, market_value, unrealized_pnl
        ) VALUES (
            p_user_id, p_symbol, v_new_quantity, v_new_avg_cost, p_price, 
            v_new_quantity * p_price, v_new_quantity * (p_price - v_new_avg_cost)
        )
        ON CONFLICT (user_id, symbol) DO UPDATE
        SET 
            quantity = v_new_quantity,
            average_cost = v_new_avg_cost,
            current_price = p_price,
            market_value = v_new_quantity * p_price,
            unrealized_pnl = v_new_quantity * (p_price - v_new_avg_cost),
            last_updated = NOW()
        RETURNING * INTO v_holding;
        
    ELSIF p_side = 'sell' THEN
        -- Check if sufficient quantity
        IF COALESCE(v_existing_quantity, 0) < p_quantity THEN
            RAISE EXCEPTION 'Insufficient quantity. Available: %, Requested: %', v_existing_quantity, p_quantity;
        END IF;
        
        v_new_quantity := v_existing_quantity - p_quantity;
        
        IF v_new_quantity > 0 THEN
            -- Update holding
            UPDATE public.portfolio_holdings
            SET 
                quantity = v_new_quantity,
                current_price = p_price,
                market_value = v_new_quantity * p_price,
                unrealized_pnl = v_new_quantity * (p_price - average_cost),
                realized_pnl = realized_pnl + (p_quantity * (p_price - average_cost)),
                last_updated = NOW()
            WHERE user_id = p_user_id AND symbol = p_symbol
            RETURNING * INTO v_holding;
        ELSE
            -- Close position
            UPDATE public.portfolio_holdings
            SET 
                quantity = 0,
                realized_pnl = realized_pnl + (p_quantity * (p_price - average_cost)),
                last_updated = NOW()
            WHERE user_id = p_user_id AND symbol = p_symbol
            RETURNING * INTO v_holding;
        END IF;
    END IF;
    
    -- Log trade execution
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, changes
    ) VALUES (
        p_user_id, 
        'trade_execution', 
        'portfolio_holding',
        v_holding.id,
        jsonb_build_object(
            'symbol', p_symbol,
            'side', p_side,
            'quantity', p_quantity,
            'price', p_price,
            'timestamp', NOW()
        )
    );
    
    v_result := jsonb_build_object(
        'success', true,
        'trade', jsonb_build_object(
            'symbol', p_symbol,
            'side', p_side,
            'quantity', p_quantity,
            'price', p_price,
            'executed_at', NOW()
        ),
        'position', row_to_json(v_holding)
    );
    
    RETURN v_result;
END;
$$;

-- 8. Grant permissions for mutations
GRANT EXECUTE ON FUNCTION public.gql_update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_add_portfolio_holding TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_update_portfolio_holding TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_create_price_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_create_task TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_update_task_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_create_agent TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.gql_execute_trade TO authenticated;

-- 9. Add mutation comments for GraphQL
COMMENT ON FUNCTION public.gql_update_user_profile IS 'Update user profile information';
COMMENT ON FUNCTION public.gql_add_portfolio_holding IS 'Add a new position to portfolio';
COMMENT ON FUNCTION public.gql_update_portfolio_holding IS 'Update existing portfolio position';
COMMENT ON FUNCTION public.gql_create_price_alert IS 'Create a new price alert';
COMMENT ON FUNCTION public.gql_create_task IS 'Create a new task';
COMMENT ON FUNCTION public.gql_update_task_status IS 'Update task status';
COMMENT ON FUNCTION public.gql_create_agent IS 'Create a new AI agent';
COMMENT ON FUNCTION public.gql_mark_notification_read IS 'Mark notification as read';
COMMENT ON FUNCTION public.gql_mark_all_notifications_read IS 'Mark all notifications as read';
COMMENT ON FUNCTION public.gql_execute_trade IS 'Execute a buy or sell trade';

-- Success notification
DO $$
BEGIN
    RAISE NOTICE 'GraphQL mutations created successfully';
END $$;
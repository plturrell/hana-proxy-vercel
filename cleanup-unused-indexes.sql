-- Cleanup Unused Indexes
-- These indexes have been identified as never used by Supabase linter
-- Removing them will improve write performance and save storage

DO $$
DECLARE
    idx RECORD;
    drop_count INTEGER := 0;
    total_indexes_before INTEGER;
    total_indexes_after INTEGER;
BEGIN
    -- Count indexes before
    SELECT COUNT(*) INTO total_indexes_before
    FROM pg_indexes
    WHERE schemaname IN ('public', 'app_data');
    
    RAISE NOTICE 'Starting cleanup of unused indexes...';
    RAISE NOTICE 'Total indexes before: %', total_indexes_before;
    
    -- List of all unused indexes identified by the linter
    FOR idx IN 
        SELECT schemaname, indexname FROM (VALUES
            -- Asset and financial data indexes
            ('public', 'idx_asset_prices_asset_timestamp'),
            ('public', 'idx_financial_metrics_entity_metric'),
            ('public', 'idx_user_interactions_user_timestamp'),
            ('public', 'idx_feature_values_entity_feature'),
            ('public', 'idx_breaking_news_alerts_created_at'),
            ('public', 'idx_breaking_news_alerts_urgency'),
            ('public', 'idx_sentiment_article'),
            ('public', 'idx_impact_article'),
            ('public', 'idx_entities_article'),
            
            -- A2A and agent-related indexes
            ('public', 'idx_proposals_status'),
            ('public', 'idx_proposals_deadline'),
            ('public', 'idx_agent_activity_agent_id'),
            ('public', 'idx_agent_states_agent'),
            ('public', 'idx_news_archive_article_id'),
            ('public', 'idx_news_archive_archived_at'),
            ('public', 'idx_consensus_rounds_status'),
            
            -- Market data indexes
            ('public', 'idx_asset_correlations_classes'),
            ('public', 'idx_asset_volatility_class_date'),
            ('public', 'idx_liquidity_metrics_symbol_date'),
            ('public', 'idx_regulatory_scenarios_active'),
            ('public', 'idx_interest_curves_type_date'),
            ('public', 'idx_asset_volatility_lookup'),
            ('public', 'idx_sector_risk_lookup'),
            ('public', 'idx_liquidity_lookup'),
            
            -- RDF and entity indexes
            ('public', 'idx_rdf_graph'),
            ('public', 'idx_rdf_subject'),
            ('public', 'idx_rdf_predicate'),
            ('public', 'idx_rdf_object'),
            ('public', 'idx_extracted_entities_type'),
            ('public', 'idx_extracted_entities_name'),
            
            -- User and authentication indexes
            ('public', 'idx_users_username'),
            
            -- Blockchain and deployment indexes
            ('public', 'idx_deployed_contracts_network'),
            ('public', 'idx_contract_abis_network'),
            ('public', 'idx_visual_process_deployments_network'),
            ('public', 'idx_visual_process_deployments_deployer'),
            ('public', 'idx_portfolio_holdings_symbol'),
            ('public', 'idx_blockchain_events_contract'),
            ('public', 'idx_blockchain_events_processed'),
            ('public', 'idx_agent_blockchain_activities_type'),
            ('public', 'idx_agent_blockchain_activities_created_at'),
            ('public', 'idx_process_blockchain_deployments_network'),
            ('public', 'idx_process_blockchain_deployments_deployed_by'),
            
            -- Learning and validation indexes
            ('public', 'idx_agent_curricula_agent_id'),
            ('public', 'idx_agent_curricula_status'),
            ('public', 'idx_stock_symbols_priority'),
            ('public', 'idx_stock_symbols_discovery_count'),
            ('public', 'idx_entity_market_data_mapping_symbol'),
            ('public', 'idx_entity_market_data_mapping_relevance'),
            ('public', 'idx_market_data_fetch_history_symbol'),
            ('public', 'idx_market_data_fetch_history_source'),
            ('public', 'idx_market_data_fetch_history_created_at'),
            ('public', 'idx_agent_learning_agent_concept'),
            ('public', 'idx_agent_learning_completed'),
            ('public', 'idx_agent_validations_agent_id'),
            ('public', 'idx_agent_validations_timestamp'),
            ('public', 'idx_agent_validations_compliance'),
            ('public', 'idx_knowledge_assessments_agent_concept'),
            ('public', 'idx_knowledge_assessments_score'),
            ('public', 'idx_context_overlays_agent_id'),
            ('public', 'idx_context_overlays_task_id'),
            
            -- CFA and policy indexes
            ('public', 'idx_cfa_standards_topic_level'),
            ('public', 'idx_treasury_policies_function'),
            
            -- Classification and messaging indexes
            ('public', 'idx_article_classifications_primary_category'),
            ('public', 'idx_article_classifications_sentiment'),
            ('public', 'idx_a2a_messages_sender'),
            ('public', 'idx_a2a_messages_recipient'),
            ('public', 'idx_a2a_messages_status'),
            ('public', 'idx_a2a_messages_created_at'),
            ('public', 'idx_a2a_messages_from_agent'),
            ('public', 'idx_a2a_messages_to_agent'),
            ('public', 'idx_a2a_messages_message_id'),
            
            -- Reference data indexes
            ('public', 'idx_bond_data_symbol'),
            ('public', 'idx_forex_rates_pair'),
            ('public', 'idx_economic_indicators_code'),
            ('public', 'idx_yield_curve_date'),
            ('public', 'idx_volatility_surface_symbol'),
            ('public', 'idx_correlation_matrix_assets'),
            ('public', 'idx_currencies_code'),
            ('public', 'idx_exchanges_code'),
            ('public', 'idx_sectors_code'),
            ('public', 'idx_industries_code'),
            ('public', 'idx_industries_sector'),
            ('public', 'idx_asset_classes_code'),
            ('public', 'idx_countries_code'),
            ('public', 'idx_countries_currency'),
            ('public', 'idx_market_calendars_date'),
            ('public', 'idx_credit_ratings_agency'),
            ('public', 'idx_ref_data_category'),
            ('public', 'idx_enums_type'),
            ('public', 'idx_configurations_environment'),
            
            -- Foreign key indexes that were just created but showing as unused
            ('public', 'idx_a2a_agents_base_agent_id'),
            ('public', 'idx_agent_interactions_user_id'),
            ('public', 'idx_anomaly_details_anomaly_id'),
            ('public', 'idx_breaking_news_alerts_agent_id'),
            ('public', 'idx_compliance_prediction_details_compliance_id'),
            ('public', 'idx_entity_news_association_entity_id'),
            ('public', 'idx_entity_relations_source_entity_id'),
            ('public', 'idx_entity_relations_target_entity_id'),
            ('public', 'idx_news_entity_extractions_extracted_by'),
            ('public', 'idx_news_market_impact_assessed_by'),
            ('public', 'idx_news_sentiment_analysis_analyzed_by'),
            ('public', 'idx_security_events_user_id'),
            
            -- News and hedge analysis indexes
            ('public', 'idx_news_hedge_analyses_event_id'),
            ('public', 'idx_news_hedge_analyses_timestamp'),
            ('public', 'idx_news_hedge_analyses_confidence'),
            ('public', 'idx_news_hedge_analyses_urgency'),
            ('public', 'idx_hedge_recommendations_analysis_id'),
            ('public', 'idx_hedge_recommendations_asset_class'),
            ('public', 'idx_hedge_recommendations_status'),
            ('public', 'idx_hedge_recommendations_cost_benefit'),
            ('public', 'idx_hedge_effectiveness_rec_id'),
            ('public', 'idx_hedge_effectiveness_timestamp'),
            ('public', 'idx_hedge_effectiveness_status'),
            
            -- Portfolio and alert indexes
            ('public', 'idx_portfolio_holdings_user'),
            ('public', 'idx_calendars_exchange'),
            ('public', 'idx_holidays_country'),
            ('public', 'idx_news_symbols_article'),
            ('public', 'idx_agent_caps_agent'),
            ('public', 'idx_user_tasks_agent_id'),
            ('public', 'idx_price_alerts_symbol'),
            ('public', 'idx_session_states_token'),
            ('public', 'idx_agent_interactions_agent_id'),
            ('public', 'idx_audit_logs_created'),
            ('public', 'idx_api_usage_date'),
            
            -- Communication and analytics indexes
            ('public', 'idx_a2a_comms_sender'),
            ('public', 'idx_a2a_comms_receiver'),
            ('public', 'idx_news_classifications_event_id'),
            ('public', 'idx_news_classifications_category'),
            ('public', 'idx_news_classifications_processed'),
            ('public', 'idx_scenario_models_category'),
            ('public', 'idx_scenario_models_updated'),
            ('public', 'idx_holdings_portfolio'),
            
            -- User and notification indexes
            ('public', 'idx_users_user_type'),
            ('public', 'idx_price_alerts_active'),
            ('public', 'idx_agents_type'),
            ('public', 'idx_agents_status'),
            ('public', 'idx_notifications_read'),
            ('public', 'idx_notifications_created_at_desc'),
            ('public', 'idx_user_tasks_status'),
            
            -- News and market data indexes
            ('public', 'idx_news_articles_sentiment'),
            ('public', 'idx_news_articles_source'),
            ('public', 'idx_market_data_source'),
            ('public', 'idx_agent_messages_timestamp'),
            ('public', 'idx_agent_messages_status'),
            ('public', 'idx_agent_messages_from_to'),
            
            -- API and workflow indexes
            ('public', 'idx_api_requests_timestamp'),
            ('public', 'idx_api_requests_endpoint'),
            ('public', 'idx_api_requests_status'),
            ('public', 'idx_agent_workflows_agent_id'),
            ('public', 'idx_agent_workflows_status'),
            
            -- Prediction and AI indexes
            ('public', 'idx_market_predictions_symbol'),
            ('public', 'idx_market_predictions_created'),
            ('public', 'idx_market_predictions_confidence'),
            ('public', 'idx_compliance_predictions_resource'),
            ('public', 'idx_compliance_predictions_risk'),
            ('public', 'idx_ai_analysis_log_type'),
            ('public', 'idx_ai_analysis_log_entity'),
            ('public', 'idx_ai_analysis_log_created'),
            ('public', 'idx_ai_results_type'),
            ('public', 'idx_agent_performance_agent'),
            ('public', 'idx_agent_performance_type'),
            
            -- App data schema indexes
            ('app_data', 'idx_a2a_agents_type'),
            ('app_data', 'idx_a2a_agents_function'),
            
            -- Compound index that was just created but may not be used yet
            ('public', 'idx_news_articles_published_at_source')
        ) AS t(schemaname, indexname)
    LOOP
        -- Check if index exists before dropping
        IF EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE schemaname = idx.schemaname
            AND indexname = idx.indexname
        ) THEN
            -- Skip foreign key indexes that were recently created
            -- They might show as unused because no queries have run yet
            IF idx.indexname IN (
                'idx_a2a_agents_base_agent_id',
                'idx_agent_interactions_user_id',
                'idx_anomaly_details_anomaly_id',
                'idx_breaking_news_alerts_agent_id',
                'idx_compliance_prediction_details_compliance_id',
                'idx_entity_news_association_entity_id',
                'idx_entity_relations_source_entity_id',
                'idx_entity_relations_target_entity_id',
                'idx_news_entity_extractions_extracted_by',
                'idx_news_market_impact_assessed_by',
                'idx_news_sentiment_analysis_analyzed_by',
                'idx_security_events_user_id'
            ) THEN
                RAISE NOTICE 'Skipping recently created FK index: %.%', idx.schemaname, idx.indexname;
                CONTINUE;
            END IF;
            
            -- Also skip compound indexes we just created
            IF idx.indexname IN (
                'idx_news_articles_published_at_source',
                'idx_portfolio_holdings_user_symbol',
                'idx_notifications_user_read',
                'idx_price_alerts_user_active',
                'idx_agent_messages_conversation',
                'idx_user_tasks_user_status',
                'idx_market_data_symbol_timestamp'
            ) THEN
                RAISE NOTICE 'Skipping recently created compound index: %.%', idx.schemaname, idx.indexname;
                CONTINUE;
            END IF;
            
            EXECUTE format('DROP INDEX IF EXISTS %I.%I CASCADE', idx.schemaname, idx.indexname);
            drop_count := drop_count + 1;
            RAISE NOTICE 'Dropped unused index: %.%', idx.schemaname, idx.indexname;
        END IF;
    END LOOP;
    
    -- Count indexes after
    SELECT COUNT(*) INTO total_indexes_after
    FROM pg_indexes
    WHERE schemaname IN ('public', 'app_data');
    
    RAISE NOTICE E'\n=== Unused Index Cleanup Summary ===';
    RAISE NOTICE 'Total indexes dropped: %', drop_count;
    RAISE NOTICE 'Total indexes before: %', total_indexes_before;
    RAISE NOTICE 'Total indexes after: %', total_indexes_after;
    RAISE NOTICE 'Indexes removed: %', total_indexes_before - total_indexes_after;
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Recently created foreign key and compound indexes were preserved';
    RAISE NOTICE 'as they may not show usage until queries are executed.';
END $$;

-- Update statistics after dropping indexes
ANALYZE;
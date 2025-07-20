-- Add Missing Market Data Constraints for 100% Enterprise Grade
-- Migration: 20250119120000_add_missing_market_constraints.sql

-- Add the missing constraints to market_data table
ALTER TABLE public.market_data 
ADD CONSTRAINT market_data_price_positive CHECK (price > 0);

ALTER TABLE public.market_data 
ADD CONSTRAINT market_data_volume_positive CHECK (volume IS NULL OR volume >= 0);

ALTER TABLE public.market_data 
ADD CONSTRAINT market_data_symbol_not_empty CHECK (symbol IS NOT NULL AND LENGTH(TRIM(symbol)) > 0);
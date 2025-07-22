-- =====================================================
-- FINANCIAL CURRICULUM CONTENT
-- Complete curriculum structure for FinSight Experience
-- =====================================================

-- Clear existing test data
TRUNCATE TABLE app_data.curricula CASCADE;
TRUNCATE TABLE app_data.curriculum_modules CASCADE;

-- =====================================================
-- 1. FOUNDATION CURRICULA
-- =====================================================

-- Financial Markets Fundamentals
INSERT INTO app_data.curricula (id, name, description, category, difficulty_level, estimated_hours, prerequisites, learning_objectives, min_passing_score) VALUES
('curr_001', 
 'Financial Markets Fundamentals', 
 'Master the basics of financial markets, instruments, and key concepts that form the foundation of modern finance.',
 'markets',
 'beginner',
 15,
 ARRAY[]::TEXT[],
 '{
   "primary": ["Understand different types of financial markets", "Identify key market participants", "Explain basic financial instruments"],
   "secondary": ["Analyze market efficiency concepts", "Evaluate market microstructure", "Apply basic trading principles"],
   "skills": ["Market analysis", "Financial literacy", "Critical thinking"]
 }'::JSONB,
 70),

-- Risk Management Essentials
('curr_002',
 'Risk Management Essentials',
 'Learn fundamental risk management concepts, measurement techniques, and mitigation strategies used in financial institutions.',
 'risk',
 'beginner',
 20,
 ARRAY[]::TEXT[],
 '{
   "primary": ["Identify different types of financial risks", "Calculate basic risk metrics", "Understand risk-return tradeoffs"],
   "secondary": ["Apply VaR concepts", "Implement basic hedging strategies", "Evaluate risk management frameworks"],
   "skills": ["Quantitative analysis", "Risk assessment", "Decision making"]
 }'::JSONB,
 75),

-- Portfolio Theory Basics
('curr_003',
 'Portfolio Theory Basics',
 'Introduction to modern portfolio theory, diversification principles, and asset allocation strategies.',
 'portfolio',
 'beginner',
 18,
 ARRAY[]::TEXT[],
 '{
   "primary": ["Understand diversification benefits", "Calculate portfolio returns and risk", "Apply mean-variance optimization"],
   "secondary": ["Construct efficient frontiers", "Implement asset allocation strategies", "Evaluate portfolio performance"],
   "skills": ["Portfolio construction", "Optimization", "Performance analysis"]
 }'::JSONB,
 70);

-- =====================================================
-- 2. INTERMEDIATE CURRICULA
-- =====================================================

INSERT INTO app_data.curricula (id, name, description, category, difficulty_level, estimated_hours, prerequisites, learning_objectives, min_passing_score) VALUES
-- Fixed Income Analytics
('curr_004',
 'Fixed Income Analytics',
 'Deep dive into bond mathematics, yield curve analysis, and fixed income portfolio management.',
 'fixed_income',
 'intermediate',
 25,
 ARRAY['curr_001']::TEXT[],
 '{
   "primary": ["Master bond pricing and yields", "Analyze yield curves", "Calculate duration and convexity"],
   "secondary": ["Implement immunization strategies", "Evaluate credit risk", "Manage fixed income portfolios"],
   "skills": ["Bond mathematics", "Yield analysis", "Duration management"]
 }'::JSONB,
 75),

-- Derivatives and Options
('curr_005',
 'Derivatives and Options',
 'Comprehensive coverage of derivative instruments, pricing models, and trading strategies.',
 'derivatives',
 'intermediate',
 30,
 ARRAY['curr_001', 'curr_002']::TEXT[],
 '{
   "primary": ["Understand derivative instruments", "Apply option pricing models", "Implement hedging strategies"],
   "secondary": ["Design structured products", "Analyze Greeks", "Evaluate exotic options"],
   "skills": ["Option pricing", "Risk management", "Strategic thinking"]
 }'::JSONB,
 75),

-- Quantitative Finance Methods
('curr_006',
 'Quantitative Finance Methods',
 'Statistical and mathematical methods used in modern quantitative finance and algorithmic trading.',
 'quantitative',
 'intermediate',
 35,
 ARRAY['curr_002', 'curr_003']::TEXT[],
 '{
   "primary": ["Apply statistical models to finance", "Implement time series analysis", "Develop trading algorithms"],
   "secondary": ["Use machine learning in finance", "Backtest strategies", "Optimize execution"],
   "skills": ["Programming", "Statistical modeling", "Algorithm development"]
 }'::JSONB,
 80);

-- =====================================================
-- 3. ADVANCED CURRICULA
-- =====================================================

INSERT INTO app_data.curricula (id, name, description, category, difficulty_level, estimated_hours, prerequisites, learning_objectives, min_passing_score) VALUES
-- Advanced Risk Analytics
('curr_007',
 'Advanced Risk Analytics',
 'Sophisticated risk modeling techniques including stress testing, scenario analysis, and regulatory frameworks.',
 'risk',
 'advanced',
 40,
 ARRAY['curr_002', 'curr_006']::TEXT[],
 '{
   "primary": ["Model extreme events", "Implement stress testing", "Design risk frameworks"],
   "secondary": ["Apply copula methods", "Develop early warning systems", "Ensure regulatory compliance"],
   "skills": ["Advanced modeling", "Regulatory knowledge", "System design"]
 }'::JSONB,
 80),

-- Alternative Investments
('curr_008',
 'Alternative Investments',
 'Explore hedge funds, private equity, real estate, and other alternative investment strategies.',
 'alternatives',
 'advanced',
 30,
 ARRAY['curr_003', 'curr_005']::TEXT[],
 '{
   "primary": ["Analyze hedge fund strategies", "Evaluate private equity deals", "Assess real estate investments"],
   "secondary": ["Structure fund of funds", "Implement portable alpha", "Manage illiquid investments"],
   "skills": ["Due diligence", "Structuring", "Alternative analysis"]
 }'::JSONB,
 80),

-- Treasury Management Mastery
('curr_009',
 'Treasury Management Mastery',
 'Advanced corporate treasury concepts including cash management, FX hedging, and liquidity optimization.',
 'treasury',
 'advanced',
 35,
 ARRAY['curr_004', 'curr_005']::TEXT[],
 '{
   "primary": ["Optimize cash management", "Design hedging programs", "Manage liquidity risk"],
   "secondary": ["Implement netting systems", "Develop funding strategies", "Ensure Basel compliance"],
   "skills": ["Treasury operations", "Liquidity management", "Regulatory compliance"]
 }'::JSONB,
 85);

-- =====================================================
-- 4. SPECIALIZED CURRICULA
-- =====================================================

INSERT INTO app_data.curricula (id, name, description, category, difficulty_level, estimated_hours, prerequisites, learning_objectives, min_passing_score) VALUES
-- ESG and Sustainable Finance
('curr_010',
 'ESG and Sustainable Finance',
 'Environmental, Social, and Governance factors in investment decisions and sustainable finance practices.',
 'esg',
 'intermediate',
 20,
 ARRAY['curr_003']::TEXT[],
 '{
   "primary": ["Integrate ESG factors", "Measure sustainability impact", "Apply green finance principles"],
   "secondary": ["Design ESG portfolios", "Evaluate climate risks", "Report sustainability metrics"],
   "skills": ["ESG analysis", "Impact measurement", "Sustainable investing"]
 }'::JSONB,
 75),

-- FinTech and Digital Assets
('curr_011',
 'FinTech and Digital Assets',
 'Blockchain technology, cryptocurrencies, DeFi, and the future of digital finance.',
 'fintech',
 'intermediate',
 25,
 ARRAY['curr_001']::TEXT[],
 '{
   "primary": ["Understand blockchain technology", "Analyze cryptocurrency markets", "Evaluate DeFi protocols"],
   "secondary": ["Design tokenomics", "Implement smart contracts", "Assess regulatory implications"],
   "skills": ["Blockchain literacy", "Digital asset valuation", "Technical analysis"]
 }'::JSONB,
 75),

-- AI in Finance
('curr_012',
 'AI in Finance',
 'Machine learning applications in trading, risk management, and financial analysis.',
 'ai_finance',
 'advanced',
 40,
 ARRAY['curr_006']::TEXT[],
 '{
   "primary": ["Apply ML to trading", "Develop predictive models", "Implement NLP for finance"],
   "secondary": ["Design robo-advisors", "Create sentiment analysis", "Build recommendation systems"],
   "skills": ["Machine learning", "Python programming", "Model deployment"]
 }'::JSONB,
 80);

-- =====================================================
-- 5. CURRICULUM MODULES
-- =====================================================

-- Modules for Financial Markets Fundamentals (curr_001)
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_001_01', 'curr_001', 'Introduction to Financial Markets', 'Overview of global financial markets and their interconnections', 1, 'article', 45, 70, true),
('mod_001_02', 'curr_001', 'Money Markets and Capital Markets', 'Understanding short-term vs long-term funding markets', 2, 'interactive', 60, 70, true),
('mod_001_03', 'curr_001', 'Equity Markets Deep Dive', 'Stock exchanges, trading mechanisms, and market participants', 3, 'video', 90, 70, true),
('mod_001_04', 'curr_001', 'Fixed Income Markets', 'Bond markets, government securities, and corporate debt', 4, 'article', 75, 70, true),
('mod_001_05', 'curr_001', 'Foreign Exchange Markets', 'Currency trading, exchange rates, and FX market structure', 5, 'interactive', 60, 70, true),
('mod_001_06', 'curr_001', 'Commodities and Futures', 'Physical commodities, futures contracts, and hedging', 6, 'article', 60, 70, true),
('mod_001_07', 'curr_001', 'Market Efficiency Theory', 'EMH, behavioral finance, and market anomalies', 7, 'video', 45, 70, true),
('mod_001_08', 'curr_001', 'Trading and Execution', 'Order types, market microstructure, and best execution', 8, 'interactive', 90, 70, true),
('mod_001_09', 'curr_001', 'Regulatory Environment', 'Key regulations, compliance requirements, and market oversight', 9, 'article', 60, 70, true),
('mod_001_10', 'curr_001', 'Final Assessment', 'Comprehensive exam covering all market fundamentals', 10, 'assessment', 120, 75, true);

-- Modules for Risk Management Essentials (curr_002)
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_002_01', 'curr_002', 'Introduction to Risk', 'Types of financial risks and risk management frameworks', 1, 'article', 60, 70, true),
('mod_002_02', 'curr_002', 'Market Risk Fundamentals', 'Price risk, volatility, and market risk factors', 2, 'interactive', 90, 75, true),
('mod_002_03', 'curr_002', 'Credit Risk Basics', 'Default risk, credit ratings, and counterparty risk', 3, 'video', 75, 75, true),
('mod_002_04', 'curr_002', 'Operational Risk', 'Process failures, system risks, and human factors', 4, 'article', 60, 70, true),
('mod_002_05', 'curr_002', 'Liquidity Risk Management', 'Funding liquidity and market liquidity risks', 5, 'interactive', 75, 75, true),
('mod_002_06', 'curr_002', 'Risk Measurement: VaR', 'Value at Risk calculation methods and applications', 6, 'project', 120, 80, true),
('mod_002_07', 'curr_002', 'Stress Testing', 'Scenario analysis and stress testing methodologies', 7, 'interactive', 90, 75, true),
('mod_002_08', 'curr_002', 'Risk Mitigation Strategies', 'Hedging, insurance, and diversification techniques', 8, 'video', 60, 70, true),
('mod_002_09', 'curr_002', 'Risk Reporting', 'Risk dashboards, KRIs, and regulatory reporting', 9, 'project', 90, 75, true),
('mod_002_10', 'curr_002', 'Integrated Risk Assessment', 'Holistic risk management case study', 10, 'assessment', 150, 80, true);

-- Modules for Portfolio Theory Basics (curr_003)
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_003_01', 'curr_003', 'Portfolio Return Calculations', 'Computing returns, arithmetic vs geometric means', 1, 'interactive', 60, 70, true),
('mod_003_02', 'curr_003', 'Risk and Standard Deviation', 'Measuring portfolio risk and volatility', 2, 'article', 75, 70, true),
('mod_003_03', 'curr_003', 'Correlation and Covariance', 'Understanding asset relationships and diversification', 3, 'interactive', 90, 75, true),
('mod_003_04', 'curr_003', 'Efficient Frontier', 'Constructing and interpreting the efficient frontier', 4, 'project', 120, 75, true),
('mod_003_05', 'curr_003', 'Capital Asset Pricing Model', 'CAPM theory and practical applications', 5, 'video', 60, 70, true),
('mod_003_06', 'curr_003', 'Factor Models', 'Multi-factor models and the Fama-French approach', 6, 'article', 75, 70, true),
('mod_003_07', 'curr_003', 'Asset Allocation Strategies', 'Strategic vs tactical allocation, rebalancing', 7, 'interactive', 90, 75, true),
('mod_003_08', 'curr_003', 'Performance Measurement', 'Sharpe ratio, Jensen\'s alpha, and attribution analysis', 8, 'project', 90, 75, true),
('mod_003_09', 'curr_003', 'Behavioral Portfolio Theory', 'Psychological biases in portfolio construction', 9, 'video', 45, 70, false),
('mod_003_10', 'curr_003', 'Portfolio Construction Project', 'Build and analyze a diversified portfolio', 10, 'assessment', 180, 80, true);

-- =====================================================
-- 6. LEARNING PATHS
-- =====================================================

-- Create recommended learning paths
INSERT INTO app_data.learning_paths (id, name, description, target_audience, curricula_sequence) VALUES
('path_001', 'Investment Professional Track', 'Comprehensive path for aspiring investment professionals', 'Entry-level analysts', 
 ARRAY['curr_001', 'curr_003', 'curr_004', 'curr_005', 'curr_006']::UUID[]),

('path_002', 'Risk Manager Track', 'Specialized path for risk management professionals', 'Risk analysts',
 ARRAY['curr_001', 'curr_002', 'curr_006', 'curr_007']::UUID[]),

('path_003', 'Treasury Professional Track', 'Corporate treasury and cash management focus', 'Corporate finance professionals',
 ARRAY['curr_001', 'curr_004', 'curr_005', 'curr_009']::UUID[]),

('path_004', 'Quantitative Analyst Track', 'Mathematical and programming intensive path', 'Quants and developers',
 ARRAY['curr_001', 'curr_006', 'curr_007', 'curr_012']::UUID[]),

('path_005', 'Sustainable Finance Track', 'ESG and impact investing specialization', 'ESG professionals',
 ARRAY['curr_001', 'curr_003', 'curr_010']::UUID[]);

-- =====================================================
-- 7. ASSESSMENT QUESTIONS BANK
-- =====================================================

-- Sample assessment questions for modules
INSERT INTO app_data.assessment_questions (id, module_id, question_type, question_text, options, correct_answer, explanation, difficulty) VALUES
-- Financial Markets Fundamentals
('q_001', 'mod_001_10', 'multiple_choice', 
 'What is the primary difference between money markets and capital markets?',
 '["Geographical location", "Time to maturity", "Currency denomination", "Regulatory oversight"]'::JSONB,
 'Time to maturity',
 'Money markets deal with short-term instruments (less than 1 year), while capital markets handle long-term securities.',
 'easy'),

('q_002', 'mod_001_10', 'multiple_choice',
 'Which of the following best describes market efficiency?',
 '["Markets always rise", "Prices reflect all available information", "No transaction costs exist", "All investors are rational"]'::JSONB,
 'Prices reflect all available information',
 'The Efficient Market Hypothesis states that asset prices fully reflect all available information.',
 'medium'),

-- Risk Management
('q_003', 'mod_002_10', 'calculation',
 'Calculate the 1-day VaR at 95% confidence for a portfolio with daily returns that are normally distributed with mean 0.1% and standard deviation 2%.',
 null,
 '-3.19%',
 'VaR(95%) = μ - 1.65σ = 0.1% - 1.65(2%) = -3.19%',
 'medium'),

('q_004', 'mod_002_10', 'multiple_choice',
 'Which risk type is most difficult to quantify?',
 '["Market risk", "Credit risk", "Operational risk", "Liquidity risk"]'::JSONB,
 'Operational risk',
 'Operational risk involves human factors, system failures, and processes that are inherently difficult to model quantitatively.',
 'easy');

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON app_data.curricula TO authenticated;
GRANT SELECT ON app_data.curriculum_modules TO authenticated;
GRANT SELECT ON app_data.learning_paths TO authenticated;
GRANT SELECT ON app_data.assessment_questions TO authenticated;
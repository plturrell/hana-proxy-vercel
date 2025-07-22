-- =====================================================
-- RAG PIPELINE CURRICULUM MODULE
-- Building Production RAG Systems with Grok-4 and Supabase
-- =====================================================

-- Add new specialized curriculum for RAG systems
INSERT INTO app_data.curricula (id, name, description, category, difficulty_level, estimated_hours, prerequisites, learning_objectives, min_passing_score) VALUES
('curr_013',
 'Building Production RAG Systems with Grok-4',
 'Master the complete pipeline from PDF parsing to vector search using Grok-4 API, Supabase pgvector, and modern embedding techniques. Build production-ready RAG applications with 2024-2025 best practices.',
 'ai_engineering',
 'intermediate',
 30,
 ARRAY['curr_001', 'curr_012']::TEXT[],
 '{
   "primary": [
     "Build complete PDF-to-RAG pipelines with production quality",
     "Implement efficient vector storage using Supabase pgvector",
     "Master semantic chunking and embedding strategies",
     "Integrate Grok-4 API for intelligent document processing"
   ],
   "secondary": [
     "Optimize performance with HNSW indexing and batch processing",
     "Implement hybrid search combining vector and full-text",
     "Deploy monitoring and error handling for production systems",
     "Scale to millions of documents with cost optimization"
   ],
   "skills": ["RAG architecture", "Vector databases", "Document processing", "AI integration", "Performance optimization"]
 }'::JSONB,
 80);

-- =====================================================
-- DETAILED MODULE CONTENT
-- =====================================================

-- Module 1: Introduction to RAG Systems
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_01', 'curr_013', 
 'RAG Architecture Fundamentals', 
 'Understanding Retrieval-Augmented Generation systems, their components, and why they outperform pure LLMs for knowledge-intensive tasks',
 1, 'interactive', 90, 75, true);

-- Module 2: PDF Processing Deep Dive
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_02', 'curr_013',
 'High-Performance PDF Parsing',
 'Benchmark-driven selection of PDF libraries, implementing PyMuPDF for 42x speed improvement, handling complex documents and OCR',
 2, 'project', 120, 80, true);

-- Module 3: Semantic Chunking Strategies
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_03', 'curr_013',
 'Advanced Document Chunking',
 'Implement semantic chunking for 12% accuracy improvement, optimize chunk sizes (300-500 tokens), hierarchical chunking patterns',
 3, 'interactive', 90, 80, true);

-- Module 4: Embedding Generation with Grok-4
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_04', 'curr_013',
 'Grok-4 Embeddings and Intelligence',
 'Generate embeddings using Grok-4 API, implement batch processing, cost optimization with dimension reduction, intelligent preprocessing',
 4, 'project', 150, 85, true);

-- Module 5: Supabase Vector Database
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_05', 'curr_013',
 'Supabase pgvector Mastery',
 'Configure pgvector with HNSW indexes for 3x performance, design optimal schemas, implement efficient query patterns',
 5, 'interactive', 120, 80, true);

-- Module 6: Vector Search Implementation
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_06', 'curr_013',
 'Advanced Vector Search Patterns',
 'Build hybrid search with 25% better relevance, implement RRF fusion, metadata filtering, and similarity thresholds',
 6, 'project', 120, 85, true);

-- Module 7: Complete Pipeline Integration
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_07', 'curr_013',
 'End-to-End RAG Pipeline',
 'Connect all components into production pipeline, error handling, progress tracking, async processing patterns',
 7, 'project', 180, 85, true);

-- Module 8: Grok-4 Framework Integration
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_08', 'curr_013',
 'Grok-4 Advanced Features',
 'Leverage Grok-4 for document understanding, query enhancement, answer generation with source attribution',
 8, 'interactive', 90, 80, true);

-- Module 9: Performance Optimization
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_09', 'curr_013',
 'Production Performance Tuning',
 'Implement pgmq for 3x throughput, float16 storage optimization, automatic embedding generation, caching strategies',
 9, 'project', 150, 85, true);

-- Module 10: Monitoring and Deployment
INSERT INTO app_data.curriculum_modules (id, curriculum_id, title, description, module_order, content_type, estimated_minutes, passing_score, is_required) VALUES
('mod_013_10', 'curr_013',
 'Production Deployment & Monitoring',
 'Deploy with comprehensive monitoring, track p95 latency (<100ms), retrieval precision (>0.85), implement circuit breakers',
 10, 'assessment', 120, 90, true);

-- =====================================================
-- MODULE CONTENT AND EXERCISES
-- =====================================================

-- Store detailed content for each module
INSERT INTO app_data.module_content (module_id, content_type, content_data) VALUES
('mod_013_01', 'lesson', '{
  "title": "Understanding RAG Systems",
  "sections": [
    {
      "title": "Why RAG?",
      "content": "RAG systems combine the reasoning capabilities of LLMs with external knowledge retrieval, solving hallucination issues and enabling real-time information access.",
      "code_example": null
    },
    {
      "title": "Core Components",
      "content": "1. Document Processing Pipeline\n2. Embedding Generation\n3. Vector Storage\n4. Retrieval System\n5. Response Generation",
      "diagram": "rag_architecture.svg"
    }
  ],
  "interactive_elements": ["rag_simulator", "component_quiz"]
}'::JSONB),

('mod_013_02', 'code_exercise', '{
  "title": "Implement High-Performance PDF Parser",
  "starter_code": "import pymupdf\nimport re\n\ndef extract_and_clean_pdf(pdf_path):\n    # TODO: Implement PDF extraction\n    pass",
  "solution": "import pymupdf\nimport re\n\ndef extract_and_clean_pdf(pdf_path):\n    doc = pymupdf.open(pdf_path)\n    text = \"\"\n    \n    for page in doc:\n        page_text = page.get_text()\n        page_text = re.sub(r''\\s+'', '' '', page_text)\n        page_text = re.sub(r''\\n\\s*\\d+\\s*\\n'', ''\\n'', page_text)\n        text += page_text + \"\\n\"\n    \n    return text.strip()",
  "test_cases": [
    {
      "input": "sample.pdf",
      "expected_output_contains": ["extracted text", "no page numbers"]
    }
  ],
  "hints": [
    "Use PyMuPDF for 42x speed improvement",
    "Clean whitespace and page numbers",
    "Handle edge cases like empty pages"
  ]
}'::JSONB),

('mod_013_03', 'interactive_lab', '{
  "title": "Semantic Chunking Laboratory",
  "objectives": [
    "Compare fixed-size vs semantic chunking",
    "Optimize chunk size for your use case",
    "Implement overlap strategies"
  ],
  "sandbox_code": "from langchain_text_splitters import RecursiveCharacterTextSplitter\nfrom langchain_experimental.text_splitter import SemanticChunker\n\n# Experiment with different chunking strategies\ntext = \"Your document text here...\"\n\n# Try different configurations\nchunk_size = 500  # Adjust this\noverlap = 50     # And this",
  "metrics_to_track": ["chunk_count", "avg_chunk_size", "semantic_coherence"]
}'::JSONB),

('mod_013_04', 'grok4_integration', '{
  "title": "Grok-4 Embedding Generation",
  "api_setup": {
    "endpoint": "https://api.x.ai/v1/embeddings",
    "model": "grok-4-embed",
    "dimensions": 1536
  },
  "implementation": "from grok import GrokClient\nimport numpy as np\n\nclient = GrokClient(api_key=os.getenv(''XAI_API_KEY''))\n\nasync def generate_embeddings_batch(texts, model=\"grok-4-embed\"):\n    embeddings = []\n    batch_size = 100\n    \n    for i in range(0, len(texts), batch_size):\n        batch = texts[i:i+batch_size]\n        \n        response = await client.embeddings.create(\n            input=batch,\n            model=model,\n            dimensions=1536\n        )\n        embeddings.extend([e.embedding for e in response.data])\n    \n    return np.array(embeddings)",
  "optimization_tips": [
    "Use batch processing for efficiency",
    "Implement retry logic with exponential backoff",
    "Cache embeddings to reduce API calls",
    "Consider dimension reduction for cost savings"
  ]
}'::JSONB);

-- =====================================================
-- ASSESSMENT QUESTIONS
-- =====================================================

INSERT INTO app_data.assessment_questions (module_id, question_type, question_text, options, correct_answer, explanation, difficulty) VALUES
('mod_013_01', 'multiple_choice',
 'Why do RAG systems outperform pure LLMs for knowledge-intensive tasks?',
 '["They are faster", "They prevent hallucination by grounding responses in retrieved data", "They use less memory", "They are easier to train"]'::JSONB,
 'They prevent hallucination by grounding responses in retrieved data',
 'RAG systems retrieve relevant information from a knowledge base, ensuring responses are grounded in actual data rather than relying solely on training data.',
 'easy'),

('mod_013_02', 'multiple_choice',
 'Which PDF parsing library provides the best performance according to benchmarks?',
 '["pdfplumber", "PyMuPDF", "PDFMiner", "Apache Tika"]'::JSONB,
 'PyMuPDF',
 'PyMuPDF processes PDFs 42x faster than pdfplumber with 0.1s average processing time.',
 'easy'),

('mod_013_03', 'calculation',
 'If semantic chunking improves accuracy from 74% to 86.2%, what is the percentage improvement?',
 null,
 '16.49%',
 'Percentage improvement = ((86.2 - 74) / 74) × 100 = 16.49%',
 'medium'),

('mod_013_05', 'multiple_choice',
 'Which index type provides 3x better performance for pgvector in production?',
 '["B-tree", "GiST", "IVFFlat", "HNSW"]'::JSONB,
 'HNSW',
 'HNSW (Hierarchical Navigable Small World) indexes provide 3x better performance than IVFFlat for production workloads.',
 'medium'),

('mod_013_06', 'code_completion',
 'Complete the hybrid search function to combine vector and text search:',
 '{
   "starter": "def hybrid_search(query_text, query_embedding, k=60):\\n    # TODO: Implement RRF fusion\\n    pass",
   "solution_pattern": "reciprocal_rank_fusion|1.0 / (k + rank)|combine vector and text results"
 }'::JSONB,
 'Implementation uses RRF with formula: score = Σ(1.0 / (k + rank))',
 'Reciprocal Rank Fusion combines results by summing 1/(k+rank) for each result across different search methods.',
 'hard');

-- =====================================================
-- HANDS-ON PROJECTS
-- =====================================================

INSERT INTO app_data.module_projects (module_id, project_name, description, requirements, evaluation_criteria) VALUES
('mod_013_07', 
 'Build Complete RAG Pipeline',
 'Create an end-to-end pipeline that processes PDFs, generates embeddings with Grok-4, stores in Supabase, and enables intelligent search',
 '{
   "technical": [
     "Process at least 10 PDF documents",
     "Implement semantic chunking with 300-500 token chunks",
     "Use Grok-4 API for embeddings",
     "Store in Supabase with HNSW indexing",
     "Implement hybrid search"
   ],
   "deliverables": [
     "Complete Python/JS implementation",
     "Performance benchmarks",
     "Search quality metrics",
     "Documentation"
   ]
 }'::JSONB,
 '{
   "functionality": 40,
   "performance": 30,
   "code_quality": 20,
   "documentation": 10
 }'::JSONB),

('mod_013_09',
 'Performance Optimization Challenge',
 'Optimize an existing RAG system to achieve <100ms p95 latency and >0.85 retrieval precision',
 '{
   "baseline": {
     "p95_latency": "250ms",
     "retrieval_precision": "0.72",
     "throughput": "10 queries/second"
   },
   "constraints": [
     "Cannot increase infrastructure cost",
     "Must maintain existing API interface",
     "Support 1M+ documents"
   ]
 }'::JSONB,
 '{
   "latency_improvement": 35,
   "precision_improvement": 35,
   "solution_elegance": 20,
   "documentation": 10
 }'::JSONB);

-- =====================================================
-- GROK-4 TUTORING INTEGRATION
-- =====================================================

INSERT INTO app_data.ai_tutoring_config (curriculum_id, ai_model, tutoring_prompts) VALUES
('curr_013', 'grok-4', '{
  "concept_explanation": "You are an expert in RAG systems. Explain {concept} clearly with practical examples from PDF processing and vector search.",
  "code_review": "Review this RAG implementation code. Focus on performance, scalability, and best practices. Suggest improvements.",
  "debugging_help": "Help debug this RAG pipeline issue. Consider common problems like embedding mismatches, index configuration, and chunking errors.",
  "project_guidance": "Guide the student through building their RAG system. Ask probing questions about their design choices and suggest optimizations."
}'::JSONB);

-- =====================================================
-- LEARNING PATH INTEGRATION
-- =====================================================

-- Add to AI Engineering learning path
INSERT INTO app_data.learning_paths (id, name, description, target_audience, curricula_sequence) VALUES
('path_006', 'AI Engineering Track', 'Build production AI systems including RAG, fine-tuning, and deployment', 'AI Engineers',
 ARRAY['curr_001', 'curr_006', 'curr_012', 'curr_013']::UUID[])
ON CONFLICT (id) DO UPDATE SET curricula_sequence = EXCLUDED.curricula_sequence;
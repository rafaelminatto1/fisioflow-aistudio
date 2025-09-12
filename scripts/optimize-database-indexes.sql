-- FisioFlow Database Optimization Script
-- Performance indexes for exercise search and categorization

-- ============================================
-- EXERCISE SEARCH OPTIMIZATION
-- ============================================

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_exercises_name_fts ON exercises USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_exercises_description_fts ON exercises USING gin(to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_exercises_combined_fts ON exercises USING gin(
    to_tsvector('portuguese', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, ''))
);

-- Category and classification indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category_status ON exercises (category, status);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty_category ON exercises (difficulty, category);
CREATE INDEX IF NOT EXISTS idx_exercises_status_created ON exercises (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_ai_categorized ON exercises (ai_categorized, ai_confidence DESC);

-- Array field indexes for body parts and equipment
CREATE INDEX IF NOT EXISTS idx_exercises_body_parts_gin ON exercises USING gin(body_parts);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_gin ON exercises USING gin(equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_indications_gin ON exercises USING gin(indications);
CREATE INDEX IF NOT EXISTS idx_exercises_contraindications_gin ON exercises USING gin(contraindications);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_exercises_category_difficulty_status ON exercises (category, difficulty, status);
CREATE INDEX IF NOT EXISTS idx_exercises_status_confidence ON exercises (status, ai_confidence DESC) WHERE ai_categorized = true;
CREATE INDEX IF NOT EXISTS idx_exercises_author_status ON exercises (author_id, status, created_at DESC);

-- Duration-based searches
CREATE INDEX IF NOT EXISTS idx_exercises_duration_category ON exercises (duration, category) WHERE duration IS NOT NULL;

-- Media availability
CREATE INDEX IF NOT EXISTS idx_exercises_has_video ON exercises (status) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_has_thumbnail ON exercises (status) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercises_has_media ON exercises (status) WHERE video_url IS NOT NULL OR thumbnail_url IS NOT NULL;

-- ============================================
-- APPROVAL WORKFLOW OPTIMIZATION
-- ============================================

-- Exercise approvals indexes
CREATE INDEX IF NOT EXISTS idx_exercise_approvals_status_submitted ON exercise_approvals (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_approvals_exercise_status ON exercise_approvals (exercise_id, status);
CREATE INDEX IF NOT EXISTS idx_exercise_approvals_reviewer_date ON exercise_approvals (reviewer_id, reviewed_at DESC) WHERE reviewed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_exercise_approvals_pending ON exercise_approvals (submitted_at DESC) WHERE status = 'pending';

-- ============================================
-- EXERCISE MEDIA OPTIMIZATION
-- ============================================

-- Exercise media indexes
CREATE INDEX IF NOT EXISTS idx_exercise_media_exercise_type ON exercise_media (exercise_id, type);
CREATE INDEX IF NOT EXISTS idx_exercise_media_primary ON exercise_media (exercise_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_exercise_media_type_created ON exercise_media (type, created_at DESC);

-- ============================================
-- ANALYTICS AND REPORTING OPTIMIZATION
-- ============================================

-- Patient and appointment related indexes for reporting
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments (start_time, status);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_date ON appointments (therapist_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_recent ON appointments (patient_id, start_time DESC);

-- Financial optimization
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_type ON financial_transactions (date DESC, type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON financial_transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_due ON payments (status, due_date) WHERE status = 'pending';

-- Assessment results optimization
CREATE INDEX IF NOT EXISTS idx_assessment_results_patient_date ON assessment_results (patient_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_date ON assessment_results (assessment_id, evaluated_at DESC);

-- ============================================
-- TREATMENT PROTOCOL OPTIMIZATION
-- ============================================

-- Treatment protocols and exercises relationship
CREATE INDEX IF NOT EXISTS idx_treatment_protocols_pathology_active ON treatment_protocols (pathology_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_protocol_exercises_protocol_order ON treatment_protocol_exercises (protocol_id, "order");

-- ============================================
-- USER AND SESSION OPTIMIZATION
-- ============================================

-- User activity and session metrics
CREATE INDEX IF NOT EXISTS idx_session_metrics_user_start ON session_metrics (user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category_created ON analytics_events (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type ON analytics_events (user_id, event_type, created_at DESC);

-- ============================================
-- EXERCISE SEARCH PERFORMANCE VIEWS
-- ============================================

-- Materialized view for exercise search with pre-computed scores
CREATE MATERIALIZED VIEW IF NOT EXISTS exercise_search_index AS
SELECT 
    e.id,
    e.name,
    e.description,
    e.category,
    e.subcategory,
    e.body_parts,
    e.difficulty,
    e.equipment,
    e.status,
    e.ai_categorized,
    e.ai_confidence,
    e.therapeutic_goals,
    e.duration,
    e.created_at,
    e.updated_at,
    CASE WHEN e.video_url IS NOT NULL THEN true ELSE false END as has_video,
    CASE WHEN e.thumbnail_url IS NOT NULL THEN true ELSE false END as has_thumbnail,
    CASE WHEN e.video_url IS NOT NULL OR e.thumbnail_url IS NOT NULL THEN true ELSE false END as has_media,
    -- Pre-compute search vectors for better performance
    to_tsvector('portuguese', e.name || ' ' || COALESCE(e.description, '') || ' ' || COALESCE(e.category, '')) as search_vector,
    -- Popularity score based on usage in protocols
    COALESCE((
        SELECT COUNT(*)
        FROM treatment_protocol_exercises tpe
        JOIN treatment_protocols tp ON tpe.protocol_id = tp.id
        WHERE tpe.exercise_id = e.id AND tp.is_active = true
    ), 0) as protocol_usage_count,
    -- Quality score combination
    CASE 
        WHEN e.ai_confidence IS NOT NULL THEN e.ai_confidence
        WHEN e.status = 'approved' THEN 75
        ELSE 50
    END as quality_score
FROM exercises e
WHERE e.status IN ('approved', 'pending_approval');

-- Index the materialized view
CREATE INDEX IF NOT EXISTS idx_exercise_search_index_vector ON exercise_search_index USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_exercise_search_index_category ON exercise_search_index (category, status);
CREATE INDEX IF NOT EXISTS idx_exercise_search_index_quality ON exercise_search_index (quality_score DESC, protocol_usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_search_index_body_parts ON exercise_search_index USING gin(body_parts);
CREATE INDEX IF NOT EXISTS idx_exercise_search_index_equipment ON exercise_search_index USING gin(equipment);

-- ============================================
-- AGGREGATION TABLES FOR FASTER ANALYTICS
-- ============================================

-- Exercise statistics aggregation table
CREATE TABLE IF NOT EXISTS exercise_stats_cache (
    id SERIAL PRIMARY KEY,
    stat_type VARCHAR(50) NOT NULL,
    stat_key VARCHAR(100),
    stat_value INTEGER NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_type, stat_key)
);

-- Populate initial stats
INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value) 
SELECT 'category_count', category, COUNT(*)
FROM exercises 
WHERE status = 'approved' AND category IS NOT NULL
GROUP BY category
ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    last_updated = CURRENT_TIMESTAMP;

INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value)
SELECT 'difficulty_count', difficulty, COUNT(*)
FROM exercises 
WHERE status = 'approved' AND difficulty IS NOT NULL
GROUP BY difficulty
ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    last_updated = CURRENT_TIMESTAMP;

-- Index the stats cache
CREATE INDEX IF NOT EXISTS idx_exercise_stats_cache_type_key ON exercise_stats_cache (stat_type, stat_key);
CREATE INDEX IF NOT EXISTS idx_exercise_stats_cache_updated ON exercise_stats_cache (last_updated DESC);

-- ============================================
-- SEARCH PERFORMANCE FUNCTIONS
-- ============================================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_exercise_search_index()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_search_index;
    
    -- Update stats cache
    INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value) 
    SELECT 'total_exercises', 'approved', COUNT(*)
    FROM exercises WHERE status = 'approved'
    ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        last_updated = CURRENT_TIMESTAMP;
        
    INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value) 
    SELECT 'total_exercises', 'ai_categorized', COUNT(*)
    FROM exercises WHERE status = 'approved' AND ai_categorized = true
    ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function for fuzzy exercise search
CREATE OR REPLACE FUNCTION fuzzy_exercise_search(
    search_query TEXT,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    exercise_id TEXT,
    name TEXT,
    category TEXT,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        esi.id,
        esi.name,
        esi.category,
        (
            -- Name match weight: 50%
            CASE WHEN esi.name ILIKE '%' || search_query || '%' THEN 50.0 ELSE 0.0 END +
            -- Category match weight: 20%
            CASE WHEN esi.category ILIKE '%' || search_query || '%' THEN 20.0 ELSE 0.0 END +
            -- Description match weight: 15%
            CASE WHEN esi.description ILIKE '%' || search_query || '%' THEN 15.0 ELSE 0.0 END +
            -- Full-text search weight: 10%
            (ts_rank(esi.search_vector, plainto_tsquery('portuguese', search_query)) * 10.0) +
            -- Quality bonus: 5%
            (esi.quality_score * 0.05)
        ) as relevance_score
    FROM exercise_search_index esi
    WHERE 
        esi.status = 'approved' AND
        (
            esi.search_vector @@ plainto_tsquery('portuguese', search_query) OR
            esi.name ILIKE '%' || search_query || '%' OR
            esi.category ILIKE '%' || search_query || '%' OR
            esi.description ILIKE '%' || search_query || '%'
        )
    ORDER BY relevance_score DESC, esi.quality_score DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MAINTENANCE PROCEDURES
-- ============================================

-- Procedure to update exercise statistics
CREATE OR REPLACE FUNCTION update_exercise_statistics()
RETURNS void AS $$
BEGIN
    -- Update category counts
    INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value)
    SELECT 'category_count', category, COUNT(*)
    FROM exercises 
    WHERE status = 'approved' AND category IS NOT NULL
    GROUP BY category
    ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        last_updated = CURRENT_TIMESTAMP;
        
    -- Update body part counts
    INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value)
    SELECT 'body_part_count', unnest(body_parts), COUNT(*)
    FROM exercises 
    WHERE status = 'approved' AND array_length(body_parts, 1) > 0
    GROUP BY unnest(body_parts)
    ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        last_updated = CURRENT_TIMESTAMP;
        
    -- Update equipment counts
    INSERT INTO exercise_stats_cache (stat_type, stat_key, stat_value)
    SELECT 'equipment_count', unnest(equipment), COUNT(*)
    FROM exercises 
    WHERE status = 'approved' AND array_length(equipment, 1) > 0
    GROUP BY unnest(equipment)
    ON CONFLICT (stat_type, stat_key) DO UPDATE SET 
        stat_value = EXCLUDED.stat_value,
        last_updated = CURRENT_TIMESTAMP;
        
    RAISE NOTICE 'Exercise statistics updated successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTOMATED MAINTENANCE SETUP
-- ============================================

-- Note: These would typically be set up as cron jobs or scheduled tasks
-- REFRESH MATERIALIZED VIEW exercise_search_index; -- Run every hour
-- SELECT update_exercise_statistics(); -- Run every 6 hours
-- VACUUM ANALYZE exercises; -- Run daily
-- REINDEX INDEX CONCURRENTLY idx_exercises_combined_fts; -- Run weekly

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- View to monitor search performance
CREATE OR REPLACE VIEW search_performance_stats AS
SELECT 
    'Total Exercises' as metric,
    COUNT(*) as value,
    'approved exercises in system' as description
FROM exercises WHERE status = 'approved'

UNION ALL

SELECT 
    'AI Categorized',
    COUNT(*),
    'exercises categorized by AI'
FROM exercises WHERE status = 'approved' AND ai_categorized = true

UNION ALL

SELECT 
    'With Media',
    COUNT(*),
    'exercises with video or image'
FROM exercises WHERE status = 'approved' AND (video_url IS NOT NULL OR thumbnail_url IS NOT NULL)

UNION ALL

SELECT 
    'High Confidence',
    COUNT(*),
    'exercises with AI confidence > 80%'
FROM exercises WHERE status = 'approved' AND ai_confidence > 80;

-- Show index usage statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('exercises', 'exercise_approvals', 'exercise_media')
ORDER BY idx_scan DESC;

COMMIT;
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM airdrop_transactions) as total_transactions,
    (SELECT COUNT(*) FROM airdrop_transactions WHERE status = 'pending') as pending_txs,
    (SELECT COUNT(*) FROM airdrop_transactions WHERE status = 'completed') as completed_txs,
    (SELECT COUNT(*) FROM airdrop_transactions WHERE status = 'failed') as failed_txs,
    (SELECT COALESCE(SUM(amount), 0) FROM airdrop_transactions WHERE status = 'completed') as total_amount;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
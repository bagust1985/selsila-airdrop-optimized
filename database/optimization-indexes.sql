-- ==================== PERFORMANCE INDEXES ====================
-- Indexes untuk mempercepat queries dashboard dan airdrop

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at DESC);

-- Airdrop transactions indexes  
CREATE INDEX IF NOT EXISTS idx_airdrop_user_id ON airdrop_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_airdrop_created_at ON airdrop_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_airdrop_status ON airdrop_transactions(status);
CREATE INDEX IF NOT EXISTS idx_airdrop_amount ON airdrop_transactions(amount);
CREATE INDEX IF NOT EXISTS idx_airdrop_tx_hash ON airdrop_transactions(tx_hash) WHERE tx_hash IS NOT NULL;

-- Composite indexes untuk complex queries
CREATE INDEX IF NOT EXISTS idx_airdrop_user_created ON airdrop_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_airdrop_status_created ON airdrop_transactions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_airdrop_user_status ON airdrop_transactions(user_id, status);

-- Index untuk dashboard aggregation queries
CREATE INDEX IF NOT EXISTS idx_airdrop_status_amount ON airdrop_transactions(status, amount);
CREATE INDEX IF NOT EXISTS idx_airdrop_created_status ON airdrop_transactions(created_at, status);

-- Performance monitoring
CREATE INDEX IF NOT EXISTS idx_airdrop_date_status ON airdrop_transactions(date(created_at), status);

-- ==================== INDEX VERIFICATION ====================
-- Query untuk verifikasi indexes berhasil dibuat
SELECT 
    schemaname,
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
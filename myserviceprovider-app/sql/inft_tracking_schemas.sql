-- INFT Agent System Database Schemas
-- Database schemas for tracking INFT packages, generations, and user interactions

-- ============================================================================
-- INFT Package Tracking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS inft_packages (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    token_id NVARCHAR(100) NOT NULL UNIQUE,
    package_type TINYINT NOT NULL, -- 1=Starter, 2=Pro, 3=Business, 4=Enterprise
    owner_address NVARCHAR(42) NOT NULL,
    total_credits INT NOT NULL,
    used_credits INT DEFAULT 0,
    remaining_credits AS (total_credits - used_credits) PERSISTED,
    ai_models NVARCHAR(500) NOT NULL, -- JSON array of available models
    collection_influences NVARCHAR(500), -- JSON array of supported collections
    agent_metadata NVARCHAR(MAX), -- JSON metadata for the agent
    system_prompt NVARCHAR(MAX),
    purchase_price_usd DECIMAL(10,2),
    payment_token NVARCHAR(10) NOT NULL, -- 'Native_S', 'USDC', 'wS'
    payment_amount DECIMAL(18,8),
    transaction_hash NVARCHAR(66) NOT NULL,
    block_number BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1,
    
    -- Indexes
    INDEX IX_inft_packages_owner (owner_address),
    INDEX IX_inft_packages_type (package_type),
    INDEX IX_inft_packages_active (is_active),
    INDEX IX_inft_packages_created (created_at)
);

-- ============================================================================
-- Generated Content Tracking Table (ERC-1155 Tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS generated_content (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    token_id NVARCHAR(100) NOT NULL UNIQUE,
    package_token_id NVARCHAR(100) NOT NULL,
    creator_address NVARCHAR(42) NOT NULL,
    prompt NVARCHAR(MAX) NOT NULL,
    enhanced_prompt NVARCHAR(MAX),
    generation_type NVARCHAR(10) NOT NULL, -- 'image' or 'video'
    ai_provider NVARCHAR(20) NOT NULL, -- 'openai', 'cloudflare', 'gemini', 'groq-kimi'
    ai_model NVARCHAR(50) NOT NULL,
    influenced_collection NVARCHAR(50),
    ipfs_hash NVARCHAR(100),
    result_url NVARCHAR(500),
    metadata NVARCHAR(MAX), -- JSON metadata
    credits_used INT NOT NULL,
    generation_cost_usd DECIMAL(10,4),
    processing_time_ms INT,
    quality_score DECIMAL(3,2), -- 0.00 to 1.00
    status NVARCHAR(20) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
    error_message NVARCHAR(500),
    transaction_hash NVARCHAR(66),
    block_number BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Foreign key constraint
    FOREIGN KEY (package_token_id) REFERENCES inft_packages(token_id),
    
    -- Indexes
    INDEX IX_generated_content_creator (creator_address),
    INDEX IX_generated_content_package (package_token_id),
    INDEX IX_generated_content_type (generation_type),
    INDEX IX_generated_content_provider (ai_provider),
    INDEX IX_generated_content_collection (influenced_collection),
    INDEX IX_generated_content_created (created_at)
);

-- ============================================================================
-- User Activity and Analytics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_address NVARCHAR(42) NOT NULL,
    activity_type NVARCHAR(30) NOT NULL, -- 'package_purchase', 'generation', 'marketplace_list', etc.
    package_token_id NVARCHAR(100),
    generation_token_id NVARCHAR(100),
    metadata NVARCHAR(MAX), -- JSON for additional data
    credits_consumed INT DEFAULT 0,
    usd_value DECIMAL(10,4),
    transaction_hash NVARCHAR(66),
    created_at DATETIME2 DEFAULT GETDATE(),
    
    -- Indexes
    INDEX IX_user_activity_user (user_address),
    INDEX IX_user_activity_type (activity_type),
    INDEX IX_user_activity_created (created_at)
);

-- ============================================================================
-- Collection Influence Analytics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_analytics (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    collection_name NVARCHAR(50) NOT NULL,
    generation_count INT DEFAULT 0,
    total_credits_used INT DEFAULT 0,
    average_quality_score DECIMAL(3,2),
    popular_prompts NVARCHAR(MAX), -- JSON array of frequent prompt themes
    last_used DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Unique constraint
    UNIQUE (collection_name),
    
    -- Index
    INDEX IX_collection_analytics_name (collection_name)
);

-- ============================================================================
-- AI Provider Performance Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS provider_performance (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    provider_name NVARCHAR(20) NOT NULL,
    model_name NVARCHAR(50) NOT NULL,
    generation_type NVARCHAR(10) NOT NULL,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    average_processing_time_ms INT,
    average_quality_score DECIMAL(3,2),
    total_credits_processed INT DEFAULT 0,
    last_used DATETIME2,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Unique constraint
    UNIQUE (provider_name, model_name, generation_type),
    
    -- Indexes
    INDEX IX_provider_performance_provider (provider_name),
    INDEX IX_provider_performance_model (model_name)
);

-- ============================================================================
-- INFT Marketplace Listings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    listing_type NVARCHAR(20) NOT NULL, -- 'inft_package', 'generated_content'
    token_id NVARCHAR(100) NOT NULL,
    seller_address NVARCHAR(42) NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    payment_token NVARCHAR(10) NOT NULL,
    price_in_token DECIMAL(18,8) NOT NULL,
    listing_status NVARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'cancelled', 'expired'
    buyer_address NVARCHAR(42),
    sale_transaction_hash NVARCHAR(66),
    sale_block_number BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    sold_at DATETIME2,
    expires_at DATETIME2,
    
    -- Indexes
    INDEX IX_marketplace_seller (seller_address),
    INDEX IX_marketplace_status (listing_status),
    INDEX IX_marketplace_type (listing_type),
    INDEX IX_marketplace_created (created_at)
);

-- ============================================================================
-- Revenue Distribution Tracking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS revenue_distribution (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    transaction_hash NVARCHAR(66) NOT NULL,
    total_amount_usd DECIMAL(10,2) NOT NULL,
    payment_token NVARCHAR(10) NOT NULL,
    total_amount_token DECIMAL(18,8) NOT NULL,
    staking_amount DECIMAL(18,8) NOT NULL, -- 25%
    dev_wallet_amount DECIMAL(18,8) NOT NULL, -- 50%
    leaderboard_amount DECIMAL(18,8) NOT NULL, -- 15%
    treasury_amount DECIMAL(18,8) NOT NULL, -- 10%
    distribution_status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    block_number BIGINT,
    created_at DATETIME2 DEFAULT GETDATE(),
    distributed_at DATETIME2,
    
    -- Indexes
    INDEX IX_revenue_transaction (transaction_hash),
    INDEX IX_revenue_status (distribution_status),
    INDEX IX_revenue_created (created_at)
);

-- ============================================================================
-- System Configuration Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY IDENTITY(1,1),
    config_key NVARCHAR(50) NOT NULL UNIQUE,
    config_value NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(500),
    updated_by NVARCHAR(42),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    -- Index
    INDEX IX_system_config_key (config_key)
);

-- ============================================================================
-- Initial System Configuration Data
-- ============================================================================
INSERT INTO system_config (config_key, config_value, description) VALUES
('image_generation_cost', '200', 'Credits required for image generation'),
('video_generation_cost', '500', 'Credits required for video generation'),
('openai_rate_limit_per_hour', '10', 'OpenAI API calls per hour per user'),
('marketplace_fee_percentage', '2.5', 'Marketplace transaction fee percentage'),
('staking_reward_percentage', '25', 'Percentage of revenue for NFT staking'),
('dev_wallet_percentage', '50', 'Percentage of revenue for development'),
('leaderboard_percentage', '15', 'Percentage of revenue for leaderboards'),
('treasury_percentage', '10', 'Percentage of revenue for treasury'),
('ipfs_gateway_url', 'https://gateway.pinata.cloud/ipfs/', 'IPFS gateway for content access'),
('contract_inft_packages', '', 'INFT Packages contract address'),
('contract_generated_nft', '', 'Generated NFT contract address'),
('contract_marketplace', '', 'Marketplace contract address'),
('contract_payment_splitter', '', 'Payment splitter contract address');

-- ============================================================================
-- Stored Procedures for Common Operations
-- ============================================================================

-- Procedure to update package credits after generation
CREATE OR ALTER PROCEDURE UpdatePackageCredits
    @PackageTokenId NVARCHAR(100),
    @CreditsUsed INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE inft_packages 
    SET used_credits = used_credits + @CreditsUsed,
        updated_at = GETDATE()
    WHERE token_id = @PackageTokenId;
    
    SELECT 
        token_id,
        total_credits,
        used_credits,
        remaining_credits
    FROM inft_packages 
    WHERE token_id = @PackageTokenId;
END;

-- Procedure to get user's INFT packages with remaining credits
CREATE OR ALTER PROCEDURE GetUserINFTPackages
    @UserAddress NVARCHAR(42)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        token_id,
        package_type,
        total_credits,
        used_credits,
        remaining_credits,
        ai_models,
        collection_influences,
        created_at
    FROM inft_packages 
    WHERE owner_address = @UserAddress 
    AND is_active = 1
    ORDER BY created_at DESC;
END;

-- Procedure to get generation analytics
CREATE OR ALTER PROCEDURE GetGenerationAnalytics
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, GETDATE());
    IF @EndDate IS NULL SET @EndDate = GETDATE();
    
    SELECT 
        generation_type,
        ai_provider,
        COUNT(*) as generation_count,
        SUM(credits_used) as total_credits,
        AVG(quality_score) as avg_quality,
        AVG(processing_time_ms) as avg_processing_time
    FROM generated_content 
    WHERE created_at BETWEEN @StartDate AND @EndDate
    AND status = 'completed'
    GROUP BY generation_type, ai_provider
    ORDER BY generation_count DESC;
END;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for active packages with usage statistics
CREATE OR ALTER VIEW ActiveINFTPackages AS
SELECT 
    p.token_id,
    p.package_type,
    p.owner_address,
    p.total_credits,
    p.used_credits,
    p.remaining_credits,
    p.created_at,
    COUNT(g.id) as total_generations,
    SUM(CASE WHEN g.generation_type = 'image' THEN 1 ELSE 0 END) as image_generations,
    SUM(CASE WHEN g.generation_type = 'video' THEN 1 ELSE 0 END) as video_generations,
    MAX(g.created_at) as last_generation_at
FROM inft_packages p
LEFT JOIN generated_content g ON p.token_id = g.package_token_id
WHERE p.is_active = 1
GROUP BY p.token_id, p.package_type, p.owner_address, p.total_credits, 
         p.used_credits, p.remaining_credits, p.created_at;

-- View for marketplace activity
CREATE OR ALTER VIEW MarketplaceActivity AS
SELECT 
    m.listing_type,
    m.token_id,
    m.seller_address,
    m.buyer_address,
    m.price_usd,
    m.payment_token,
    m.price_in_token,
    m.listing_status,
    m.created_at,
    m.sold_at,
    CASE 
        WHEN m.listing_type = 'inft_package' THEN p.package_type
        ELSE NULL
    END as package_type,
    CASE 
        WHEN m.listing_type = 'generated_content' THEN g.generation_type
        ELSE NULL
    END as generation_type
FROM marketplace_listings m
LEFT JOIN inft_packages p ON m.token_id = p.token_id AND m.listing_type = 'inft_package'
LEFT JOIN generated_content g ON m.token_id = g.token_id AND m.listing_type = 'generated_content';

-- ============================================================================
-- Triggers for Automatic Updates
-- ============================================================================

-- Trigger to update collection analytics when new generation is created
CREATE OR ALTER TRIGGER TR_UpdateCollectionAnalytics
ON generated_content
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE ca
    SET generation_count = ca.generation_count + 1,
        total_credits_used = ca.total_credits_used + i.credits_used,
        last_used = i.created_at,
        updated_at = GETDATE()
    FROM collection_analytics ca
    INNER JOIN inserted i ON ca.collection_name = i.influenced_collection
    WHERE i.influenced_collection IS NOT NULL;
    
    -- Insert new collection if it doesn't exist
    INSERT INTO collection_analytics (collection_name, generation_count, total_credits_used, last_used)
    SELECT DISTINCT 
        i.influenced_collection,
        1,
        i.credits_used,
        i.created_at
    FROM inserted i
    WHERE i.influenced_collection IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM collection_analytics ca 
        WHERE ca.collection_name = i.influenced_collection
    );
END;

-- Trigger to log user activity
CREATE OR ALTER TRIGGER TR_LogUserActivity
ON generated_content
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO user_activity (
        user_address,
        activity_type,
        package_token_id,
        generation_token_id,
        credits_consumed,
        metadata
    )
    SELECT 
        i.creator_address,
        'generation',
        i.package_token_id,
        i.token_id,
        i.credits_used,
        JSON_OBJECT(
            'generation_type', i.generation_type,
            'ai_provider', i.ai_provider,
            'ai_model', i.ai_model,
            'influenced_collection', i.influenced_collection
        )
    FROM inserted i;
END;
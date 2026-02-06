-- AI Personal Finance Tracker Database Schema
-- PostgreSQL Database

-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Transactions Table
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('credit', 'debit')),
    category VARCHAR(100),
    confidence_score DECIMAL(3, 2),
    is_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budgets Table
CREATE TABLE budgets (
    budget_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE CASCADE,
    monthly_limit DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, start_date)
);

-- ML Training Data Table
CREATE TABLE ml_training_data (
    training_id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(user_id),
    is_validated BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences Table
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    currency VARCHAR(3) DEFAULT 'INR',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring Transactions Table
CREATE TABLE recurring_transactions (
    recurring_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    frequency VARCHAR(20) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Goals Table
CREATE TABLE financial_goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    goal_name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0,
    target_date DATE,
    category VARCHAR(100),
    is_achieved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Categories
INSERT INTO categories (category_name, description, icon, color) VALUES
('Food & Dining', 'Restaurants, food delivery, groceries', '🍔', '#f59e0b'),
('Transportation', 'Fuel, taxi, public transport', '🚗', '#3b82f6'),
('Shopping', 'Retail purchases, online shopping', '🛍️', '#ec4899'),
('Entertainment', 'Movies, streaming, gaming', '🎬', '#8b5cf6'),
('Bills & Utilities', 'Electricity, water, internet, mobile', '💡', '#ef4444'),
('Healthcare', 'Medical expenses, pharmacy', '🏥', '#10b981'),
('Education', 'Courses, books, tuition', '📚', '#14b8a6'),
('Investment', 'Stocks, mutual funds, SIP', '📈', '#06b6d4'),
('Salary', 'Monthly salary, income', '💰', '#22c55e'),
('Transfer', 'Bank transfers, wallet transfers', '🔄', '#6366f1'),
('Other', 'Miscellaneous expenses', '📝', '#9ca3af');

-- Create Indexes for Performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_budgets_user_category ON budgets(user_id, category_id);
CREATE INDEX idx_ml_training_category ON ml_training_data(category);

-- Create Views for Common Queries

-- Monthly Spending Summary View
CREATE VIEW monthly_spending_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', transaction_date) as month,
    category,
    SUM(CASE WHEN transaction_type = 'debit' THEN ABS(amount) ELSE 0 END) as total_spent,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_income,
    COUNT(*) as transaction_count
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date), category;

-- User Balance View
CREATE VIEW user_balance AS
SELECT 
    user_id,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END) as current_balance,
    SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN transaction_type = 'debit' THEN ABS(amount) ELSE 0 END) as total_expenses
FROM transactions
GROUP BY user_id;

-- Category Spending View
CREATE VIEW category_spending AS
SELECT 
    user_id,
    category,
    SUM(ABS(amount)) as total_amount,
    COUNT(*) as transaction_count,
    AVG(ABS(amount)) as avg_amount
FROM transactions
WHERE transaction_type = 'debit'
GROUP BY user_id, category;

-- Stored Procedure: Add Transaction
CREATE OR REPLACE FUNCTION add_transaction(
    p_user_id INTEGER,
    p_date DATE,
    p_description TEXT,
    p_amount DECIMAL,
    p_type VARCHAR,
    p_category VARCHAR,
    p_confidence DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
    v_transaction_id INTEGER;
BEGIN
    INSERT INTO transactions (
        user_id, transaction_date, description, amount, 
        transaction_type, category, confidence_score
    ) VALUES (
        p_user_id, p_date, p_description, p_amount,
        p_type, p_category, p_confidence
    )
    RETURNING transaction_id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Stored Procedure: Get Monthly Report
CREATE OR REPLACE FUNCTION get_monthly_report(
    p_user_id INTEGER,
    p_month DATE
)
RETURNS TABLE (
    category VARCHAR,
    total_spent DECIMAL,
    transaction_count BIGINT,
    budget_limit DECIMAL,
    budget_remaining DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.category,
        SUM(ABS(t.amount)) as total_spent,
        COUNT(*) as transaction_count,
        COALESCE(b.monthly_limit, 0) as budget_limit,
        COALESCE(b.monthly_limit, 0) - SUM(ABS(t.amount)) as budget_remaining
    FROM transactions t
    LEFT JOIN budgets b ON t.category = (
        SELECT category_name FROM categories WHERE category_id = b.category_id
    ) AND b.user_id = p_user_id
    WHERE t.user_id = p_user_id
        AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', p_month)
        AND t.transaction_type = 'debit'
    GROUP BY t.category, b.monthly_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on transaction update
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Sample Data (Optional - for testing)
-- INSERT INTO users (email, password_hash, full_name) VALUES
-- ('demo@example.com', '$2b$12$hashed_password_here', 'Demo User');

COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE transactions IS 'Stores all financial transactions';
COMMENT ON TABLE categories IS 'Predefined and custom transaction categories';
COMMENT ON TABLE budgets IS 'Monthly budget limits for categories';
COMMENT ON TABLE ml_training_data IS 'Training data for ML model improvement';
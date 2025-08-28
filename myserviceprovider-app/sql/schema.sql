-- ServiceFlow AI Waitlist Database Schema
-- This creates the waitlist table for storing business signups

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  business_type TEXT NOT NULL,
  current_challenges TEXT,
  interested_package TEXT,
  estimated_revenue TEXT,
  signup_date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'landing_page',
  status TEXT NOT NULL DEFAULT 'pending',
  notified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  last_contact_date TEXT,
  notes TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_business_type ON waitlist(business_type);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_signup_date ON waitlist(signup_date);

-- Insert some sample data for testing (optional)
INSERT OR IGNORE INTO waitlist (
  business_name, owner_name, email, phone, business_type,
  current_challenges, interested_package, estimated_revenue,
  signup_date, source, status, notified, created_at, updated_at,
  ip_address, user_agent, priority
) VALUES 
  ('Johnson Roofing', 'Mike Johnson', 'mike@johnsonroofing.com', '555-0123', 'roofer',
   'Need better lead qualification', 'professional', '$150000',
   '2024-01-15T10:00:00Z', 'landing_page', 'pending', 0, '2024-01-15T10:00:00Z', '2024-01-15T10:00:00Z',
   '192.168.1.1', 'Mozilla/5.0...', 4),
  
  ('Elite Hair Studio', 'Sarah Martinez', 'sarah@elitehairstudio.com', '555-0124', 'hairstylist',
   'Appointment booking chaos', 'starter', '$80000',
   '2024-01-15T11:00:00Z', 'landing_page', 'pending', 0, '2024-01-15T11:00:00Z', '2024-01-15T11:00:00Z',
   '192.168.1.2', 'Mozilla/5.0...', 3),
   
  ('Wilson Plumbing', 'Tom Wilson', 'tom@wilsonplumbing.com', '555-0125', 'plumber',
   'Missing emergency calls', 'enterprise', '$200000',
   '2024-01-15T12:00:00Z', 'landing_page', 'pending', 0, '2024-01-15T12:00:00Z', '2024-01-15T12:00:00Z',
   '192.168.1.3', 'Mozilla/5.0...', 5);
-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('add', 'subtract')) DEFAULT 'subtract',
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint after table creation to allow 0 amounts for add groups
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_amount_check;
ALTER TABLE groups ADD CONSTRAINT groups_amount_check 
  CHECK (
    (group_type = 'add' AND amount >= 0) OR 
    (group_type = 'subtract' AND amount > 0)
  );

-- Create group_items table
CREATE TABLE IF NOT EXISTS group_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  sent_by TEXT NOT NULL,
  received_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_items_group_id ON group_items(group_id);
CREATE INDEX IF NOT EXISTS idx_group_items_created_at ON group_items(created_at DESC);

-- Enable Row Level Security (RLS) - for future authentication
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE group_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (no authentication)
CREATE POLICY "Allow all operations on groups" ON groups
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on group_items" ON group_items
  FOR ALL USING (true);

-- Create a function to update last_activity when items are added/modified
CREATE OR REPLACE FUNCTION update_group_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE groups 
  SET last_activity = NOW() 
  WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_activity
CREATE TRIGGER trigger_update_group_last_activity
  AFTER INSERT OR UPDATE ON group_items
  FOR EACH ROW
  EXECUTE FUNCTION update_group_last_activity(); 
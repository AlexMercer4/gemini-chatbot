/*
  # Admin Dashboard Database Schema

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_session_id` (text, optional for tracking sessions)
      - `total_messages` (integer, cached count)
      - `total_tokens` (integer, cached count)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `role` (text, 'user' or 'assistant')
      - `content` (text)
      - `token_count` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admin access
    - Create indexes for performance

  3. Functions
    - Function to update conversation totals
    - Trigger to automatically update conversation stats
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_session_id text,
  total_messages integer DEFAULT 0,
  total_tokens integer DEFAULT 0
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  token_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin access)
CREATE POLICY "Admin can read all conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Function to update conversation totals
CREATE OR REPLACE FUNCTION update_conversation_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation's total messages and tokens
  UPDATE conversations 
  SET 
    total_messages = (
      SELECT COUNT(*) 
      FROM messages 
      WHERE conversation_id = NEW.conversation_id
    ),
    total_tokens = (
      SELECT COALESCE(SUM(token_count), 0) 
      FROM messages 
      WHERE conversation_id = NEW.conversation_id
    )
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation totals
DROP TRIGGER IF EXISTS trigger_update_conversation_totals ON messages;
CREATE TRIGGER trigger_update_conversation_totals
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_totals();

-- Create a view for easy stats querying
CREATE OR REPLACE VIEW chat_stats AS
SELECT 
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(m.id) as total_messages,
  COALESCE(SUM(m.token_count), 0) as total_tokens,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 
    THEN ROUND(COUNT(m.id)::numeric / COUNT(DISTINCT c.id), 2)
    ELSE 0 
  END as avg_messages_per_conversation,
  COUNT(DISTINCT CASE 
    WHEN c.created_at >= CURRENT_DATE 
    THEN c.id 
  END) as conversations_today,
  COALESCE(SUM(CASE 
    WHEN m.created_at >= CURRENT_DATE 
    THEN m.token_count 
    ELSE 0 
  END), 0) as tokens_today
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id;
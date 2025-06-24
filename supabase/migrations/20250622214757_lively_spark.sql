/*
  # Create site_events table for analytics tracking

  1. New Tables
    - `site_events`
      - `id` (uuid, primary key)
      - `site_name` (text) - Name of the website/project
      - `event_name` (text) - Type of event (session_start, orb_interaction, etc.)
      - `event_data` (jsonb) - Additional event data
      - `timestamp` (timestamptz) - When the event occurred
      - `user_agent` (text) - Browser user agent
      - `url` (text) - Page URL where event occurred
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `site_events` table
    - Add policy for anonymous users to insert events (for analytics)
    - Add policy for authenticated users to read all events
*/

CREATE TABLE IF NOT EXISTS site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT '',
  event_name text NOT NULL DEFAULT '',
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  user_agent text DEFAULT '',
  url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE site_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert events (for analytics tracking)
CREATE POLICY "Allow anonymous event tracking"
  ON site_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read all events (for analytics dashboard)
CREATE POLICY "Allow authenticated users to read events"
  ON site_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_site_events_site_name ON site_events(site_name);
CREATE INDEX IF NOT EXISTS idx_site_events_event_name ON site_events(event_name);
CREATE INDEX IF NOT EXISTS idx_site_events_timestamp ON site_events(timestamp);
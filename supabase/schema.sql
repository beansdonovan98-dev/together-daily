-- Supabase schema for Together Daily shared journal state

CREATE TABLE IF NOT EXISTS guest_rooms (
  room_code TEXT PRIMARY KEY,
  journal_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  members TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE guest_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to read/write (room code acts as the secret)
CREATE POLICY "Allow all access to guest_rooms"
  ON guest_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Storage bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Allow public upload to media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Allow public delete on media"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'media');
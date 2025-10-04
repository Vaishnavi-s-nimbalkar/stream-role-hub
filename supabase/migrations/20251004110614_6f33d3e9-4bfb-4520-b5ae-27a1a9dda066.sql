-- Create increment function for views counter
CREATE OR REPLACE FUNCTION increment_views(video_id_param UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE videos
  SET views = views + 1
  WHERE id = video_id_param;
END;
$$;
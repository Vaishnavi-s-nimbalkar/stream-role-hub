-- Fix search_path for increment_views function
CREATE OR REPLACE FUNCTION increment_views(video_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE videos
  SET views = views + 1
  WHERE id = video_id_param;
END;
$$;
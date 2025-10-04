import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, ThumbsUp, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  views: number;
  created_at: string;
  teacher_id: string;
  teacherName?: string;
}

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVideo();
      incrementViews();
      if (user) {
        recordWatchHistory();
      }
    }
  }, [id, user]);

  const fetchVideo = async () => {
    if (!id) return;

    const { data: videoData, error } = await supabase
      .from('videos')
      .select('id, title, description, video_url, views, created_at, teacher_id')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching video:', error);
      toast.error('Video not found');
      navigate('/');
      setLoading(false);
      return;
    }

    // Fetch teacher profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', videoData.teacher_id)
      .single();

    setVideo({
      ...videoData,
      teacherName: profileData?.full_name || 'Unknown Teacher'
    });
    setLoading(false);
  };

  const incrementViews = async () => {
    if (!id) return;
    await supabase.rpc('increment_views', { video_id_param: id });
  };

  const recordWatchHistory = async () => {
    if (!id || !user) return;

    await supabase
      .from('watch_history')
      .upsert({
        user_id: user.id,
        video_id: id,
        watched_at: new Date().toISOString(),
      });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-muted-foreground">Video not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="glass-card overflow-hidden mb-6">
            <video
              src={video.video_url}
              controls
              className="w-full aspect-video bg-black"
            />
          </Card>

          <Card className="glass-card p-6">
            <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
            
            <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{video.views} views</span>
                </div>
                <span>•</span>
                <span>{new Date(video.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Like
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                  {video.teacherName?.[0] || 'T'}
                </div>
                <div>
                  <p className="font-semibold">{video.teacherName || 'Unknown Teacher'}</p>
                  <p className="text-sm text-muted-foreground">Teacher</p>
                </div>
              </div>

              {video.description && (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Watch;

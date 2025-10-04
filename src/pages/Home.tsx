import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import { Loader2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
  teacher_id: string;
}

interface ProfileData {
  full_name: string | null;
}

const Home = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data: videosData, error } = await supabase
      .from('videos')
      .select('id, title, description, thumbnail_url, views, created_at, teacher_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const teacherIds = [...new Set(videosData?.map(v => v.teacher_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
    
    const videosWithProfiles = videosData?.map(video => ({
      ...video,
      teacherName: profilesMap.get(video.teacher_id)?.full_name || 'Unknown Teacher'
    })) || [];

    setVideos(videosWithProfiles as any);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Discover Videos</h1>
          <p className="text-muted-foreground">Explore educational content from talented teachers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No videos available yet.</p>
            <p className="text-muted-foreground">Be the first to upload!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video: any) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                description={video.description || undefined}
                thumbnailUrl={video.thumbnail_url || undefined}
                views={video.views}
                teacherName={video.teacherName}
                createdAt={video.created_at}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;

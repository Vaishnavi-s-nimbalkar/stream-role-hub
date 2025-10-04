import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import { Loader2 } from 'lucide-react';

interface WatchHistoryItem {
  watched_at: string;
  video_id: string;
  videos: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    views: number;
    created_at: string;
    teacher_id: string;
  };
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data: historyData, error } = await supabase
      .from('watch_history')
      .select('watched_at, video_id, videos(id, title, description, thumbnail_url, views, created_at, teacher_id)')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      setLoading(false);
      return;
    }

    // Fetch teacher profiles
    const teacherIds = [...new Set(historyData?.map((h: any) => h.videos?.teacher_id).filter(Boolean) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    const historyWithProfiles = historyData?.map((item: any) => ({
      ...item,
      teacherName: item.videos ? profilesMap.get(item.videos.teacher_id)?.full_name || 'Unknown Teacher' : 'Unknown Teacher'
    })) || [];

    setHistory(historyWithProfiles as any);
    setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Watch History</h1>
          <p className="text-muted-foreground">Videos you've watched recently</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No watch history yet.</p>
            <p className="text-muted-foreground">Start watching videos to build your history!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.map((item: any) => (
              <VideoCard
                key={item.videos.id}
                id={item.videos.id}
                title={item.videos.title}
                description={item.videos.description || undefined}
                thumbnailUrl={item.videos.thumbnail_url || undefined}
                views={item.videos.views}
                teacherName={item.teacherName}
                createdAt={item.videos.created_at}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
  teacherName?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
}

const PlaylistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchPlaylistAndVideos();
    }
  }, [user, id, navigate]);

  const fetchPlaylistAndVideos = async () => {
    if (!user || !id) return;

    // Fetch playlist details
    const { data: playlistData, error: playlistError } = await supabase
      .from('playlists')
      .select('id, name, description')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (playlistError || !playlistData) {
      toast.error('Playlist not found');
      navigate('/playlists');
      return;
    }

    setPlaylist(playlistData);

    // Fetch videos in this playlist
    const { data: playlistVideosData, error: playlistVideosError } = await supabase
      .from('playlist_videos')
      .select('video_id, position')
      .eq('playlist_id', id)
      .order('position', { ascending: true });

    if (playlistVideosError) {
      console.error('Error fetching playlist videos:', playlistVideosError);
      setLoading(false);
      return;
    }

    if (!playlistVideosData || playlistVideosData.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    // Fetch video details
    const videoIds = playlistVideosData.map(pv => pv.video_id);
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('id, title, description, thumbnail_url, views, created_at, teacher_id')
      .in('id', videoIds);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      setLoading(false);
      return;
    }

    // Fetch teacher profiles
    const teacherIds = [...new Set(videosData.map(v => v.teacher_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

    // Combine data and maintain playlist order
    const videosWithTeachers = videosData.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      views: video.views,
      created_at: video.created_at,
      teacherName: profilesMap.get(video.teacher_id) || 'Unknown',
    }));

    // Sort by position in playlist
    const orderedVideos = playlistVideosData
      .map(pv => videosWithTeachers.find(v => v.id === pv.video_id))
      .filter(Boolean) as Video[];

    setVideos(orderedVideos);
    setLoading(false);
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!id) return;

    const { error } = await supabase
      .from('playlist_videos')
      .delete()
      .eq('playlist_id', id)
      .eq('video_id', videoId);

    if (error) {
      toast.error('Failed to remove video');
    } else {
      toast.success('Video removed from playlist');
      fetchPlaylistAndVideos();
    }
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
          <Button
            variant="ghost"
            onClick={() => navigate('/playlists')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playlists
          </Button>
          
          <h1 className="text-4xl font-bold gradient-text mb-2">{playlist?.name}</h1>
          {playlist?.description && (
            <p className="text-muted-foreground">{playlist.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">No videos in this playlist yet.</p>
            <Button onClick={() => navigate('/')} className="btn-gradient">
              Browse Videos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="relative group">
                <VideoCard 
                  id={video.id}
                  title={video.title}
                  description={video.description || undefined}
                  thumbnailUrl={video.thumbnail_url || undefined}
                  views={video.views}
                  createdAt={video.created_at}
                  teacherName={video.teacherName}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVideo(video.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlaylistDetail;

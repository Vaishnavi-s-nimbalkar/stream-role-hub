import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
}

const MyVideos = () => {
  const { user } = useAuth();
  const { isTeacher, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!roleLoading && !isTeacher) {
      toast.error('You need to be a teacher to access this page');
      navigate('/');
      return;
    }
    if (user) {
      fetchMyVideos();
    }
  }, [user, isTeacher, roleLoading, navigate]);

  const fetchMyVideos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('videos')
      .select('id, title, description, thumbnail_url, views, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load your videos');
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete video');
    } else {
      toast.success('Video deleted successfully');
      setVideos(videos.filter(v => v.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  };

  if (loading || roleLoading) {
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
          <h1 className="text-4xl font-bold gradient-text mb-2">My Uploaded Videos</h1>
          <p className="text-muted-foreground">Manage your educational content</p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-4">You haven't uploaded any videos yet.</p>
            <Button onClick={() => navigate('/upload')} className="btn-gradient">
              Upload Your First Video
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
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(video.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyVideos;

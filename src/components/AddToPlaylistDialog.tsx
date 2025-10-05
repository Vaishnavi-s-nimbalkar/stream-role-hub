import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, BookMarked, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
}

interface AddToPlaylistDialogProps {
  videoId: string;
  trigger?: React.ReactNode;
}

const AddToPlaylistDialog = ({ videoId, trigger }: AddToPlaylistDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchPlaylists();
    }
  }, [open, user]);

  const fetchPlaylists = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch all user playlists
    const { data: playlistsData, error: playlistsError } = await supabase
      .from('playlists')
      .select('id, name, description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (playlistsError) {
      console.error('Error fetching playlists:', playlistsError);
      setLoading(false);
      return;
    }

    // Fetch which playlists already contain this video
    const { data: playlistVideosData, error: playlistVideosError } = await supabase
      .from('playlist_videos')
      .select('playlist_id')
      .eq('video_id', videoId);

    if (playlistVideosError) {
      console.error('Error fetching playlist videos:', playlistVideosError);
    }

    setPlaylists(playlistsData || []);
    setAddedPlaylists(new Set((playlistVideosData || []).map(pv => pv.playlist_id)));
    setLoading(false);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user) return;

    const isAdded = addedPlaylists.has(playlistId);

    if (isAdded) {
      // Remove from playlist
      const { error } = await supabase
        .from('playlist_videos')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('video_id', videoId);

      if (error) {
        toast.error('Failed to remove from playlist');
      } else {
        toast.success('Removed from playlist');
        setAddedPlaylists(prev => {
          const newSet = new Set(prev);
          newSet.delete(playlistId);
          return newSet;
        });
      }
    } else {
      // Add to playlist - get the current max position
      const { data: maxPositionData } = await supabase
        .from('playlist_videos')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const nextPosition = (maxPositionData?.position ?? -1) + 1;

      const { error } = await supabase
        .from('playlist_videos')
        .insert({
          playlist_id: playlistId,
          video_id: videoId,
          position: nextPosition,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Video already in this playlist');
        } else {
          toast.error('Failed to add to playlist');
        }
      } else {
        toast.success('Added to playlist');
        setAddedPlaylists(prev => new Set(prev).add(playlistId));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add to Playlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        
        {!user ? (
          <p className="text-muted-foreground text-center py-4">
            Please sign in to add videos to playlists
          </p>
        ) : loading ? (
          <p className="text-muted-foreground text-center py-4">Loading playlists...</p>
        ) : playlists.length === 0 ? (
          <div className="text-center py-8">
            <BookMarked className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No playlists yet.</p>
            <Button 
              onClick={() => {
                setOpen(false);
                window.location.href = '/playlists';
              }}
              className="btn-gradient"
            >
              Create Your First Playlist
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {playlists.map((playlist) => {
                const isAdded = addedPlaylists.has(playlist.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isAdded ? 'bg-primary' : 'bg-muted'}`}>
                        <BookMarked className={`h-4 w-4 ${isAdded ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{playlist.name}</p>
                        {playlist.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {isAdded && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistDialog;
